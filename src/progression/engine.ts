import type { ExperienceLevel, ExerciseCoachState, GlobalCoachState, ExerciseSession, Session } from '../db/models';
import { findExerciseByName, findExerciseVariations } from '../repositories/exerciseLibraryRepository';
import { getExerciseCoachState, getGlobalCoachState } from '../repositories/coachStateRepository';
import { getExerciseHistoryByName } from '../repositories/sessionRepository';
import { toTitleCase } from '../utils/formatters';
import { getPrimaryMuscle } from './muscleMapping';
import { getExperienceLevelSetting, getSettings, getUserSettings, MUSCLE_LANDMARKS, VOLUME_CAPS_BY_LEVEL } from './settings';
import { calculateWeeklyVolume } from './weeklyVolume';
import { normalizeExerciseName } from '../utils/normalization';
import {
  BASELINE_REPS,
  BASELINE_SETS,
  BASELINE_WEIGHT_KG,
  BASELINE_WEIGHT_LBS,
  LEVEL_CONFIGS,
  SWAP_MAPPING,
} from './config';

export interface Suggestion {
  suggestedWeight: number;
  suggestedReps: number;
  suggestedSets: number;
  reason: string;
  plateauFlag: boolean;
  suggestedRPE?: number;
  swapSuggestions?: string[];
  primaryMuscle: string;
  currentWeeklySets: number;
  projectedWeeklySets: number;
  caps: { mev: number; mav: number; mrv: number };
  isReadinessPoor?: boolean;
  allTimeBestWeight: number;
  allTimeBestE1RM: number;
}

export interface SuggestionReadinessContext {
  sleep: number;
  energy: number;
  soreness: number;
  bodyStatus?: 'fresh' | 'normal_soreness' | 'pain_or_strain';
  goal?: 'push' | 'standard' | 'light';
  timeAvailable?: 'short' | 'normal' | 'long';
}

export type VolumeStatus = 'under-stimulated' | 'optimal stimulus' | 'near recovery limit' | 'over-reached';

export function getVolumeStatus(
  weeklySets: number,
  caps: { mev: number; mav: number; mrv: number }
): VolumeStatus {
  if (weeklySets > caps.mrv) return 'over-reached';
  if (weeklySets >= caps.mav) return 'near recovery limit';
  if (weeklySets >= caps.mev) return 'optimal stimulus';
  return 'under-stimulated';
}

export const calculateE1RM = (weight: number, reps: number) => {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight / (1.0278 - (0.0278 * reps)));
};

const calculateMaxE1RMFromSets = (sets: { weight: number; reps: number }[]) => {
  if (sets.length === 0) return 0;
  return Math.max(...sets.map((set) => calculateE1RM(set.weight, set.reps)));
};

export async function calculateNextSuggestion(
  exerciseName: string,
  overrideWeek?: number,
  readiness?: SuggestionReadinessContext
): Promise<Suggestion> {
  try {
    const normalizedExerciseName = normalizeExerciseName(exerciseName);
    const [history, settings, experienceLevel, libraryEntry, coachMemory] = await Promise.all([
      getExerciseHistoryByName(normalizedExerciseName),
      getSettings(normalizedExerciseName),
      getExperienceLevelSetting() as Promise<ExperienceLevel>,
      findExerciseByName(normalizedExerciseName),
      loadCoachMemory(normalizedExerciseName),
    ]);
    const config = LEVEL_CONFIGS[experienceLevel];
    const primaryMuscle = libraryEntry?.primaryMuscles[0] ?? getPrimaryMuscle(normalizedExerciseName);

    const currentWeeklySets = await calculateWeeklyVolume(primaryMuscle);
    const genericCaps = VOLUME_CAPS_BY_LEVEL[experienceLevel] || VOLUME_CAPS_BY_LEVEL.intermediate;
    const muscleLandmarks = MUSCLE_LANDMARKS[primaryMuscle as keyof typeof MUSCLE_LANDMARKS] || genericCaps;
    const caps = {
      mev: Math.round(muscleLandmarks.mev / config.volumeEase),
      mav: Math.round(muscleLandmarks.mav / config.volumeEase),
      mrv: Math.round(muscleLandmarks.mrv / config.volumeEase),
    };

    const userSettings = await getUserSettings();
    const unit = userSettings.unit || 'lbs';
    const baselineWeight = unit === 'kg' ? BASELINE_WEIGHT_KG : BASELINE_WEIGHT_LBS;
    const currentProgramWeek = overrideWeek ?? userSettings.currentProgramWeek ?? 1;
    const deloadFreq = userSettings.deloadFrequency || 6;

    let allTimeBestWeight = 0;
    let allTimeBestE1RM = 0;

    for (const session of history) {
      const exercise = session.exercises.find((entry) => normalizeExerciseName(entry.exerciseName) === normalizedExerciseName);
      if (!exercise) continue;

      for (const set of exercise.sets) {
        allTimeBestWeight = Math.max(allTimeBestWeight, set.weight);
        allTimeBestE1RM = Math.max(allTimeBestE1RM, calculateE1RM(set.weight, set.reps));
      }
    }

    const baseSuggestion = {
      primaryMuscle,
      currentWeeklySets,
      projectedWeeklySets: currentWeeklySets,
      caps,
      allTimeBestWeight,
      allTimeBestE1RM,
    };

    if (history.length === 0) {
      return {
        ...baseSuggestion,
        suggestedWeight: baselineWeight,
        suggestedReps: BASELINE_REPS,
        suggestedSets: BASELINE_SETS,
        reason: `No history - start conservative (${toTitleCase(experienceLevel)} approach)`,
        plateauFlag: false,
      };
    }

    const metrics = calculateMetrics(history, normalizedExerciseName, settings);
    if (!metrics) {
      return {
        suggestedWeight: baselineWeight,
        suggestedReps: BASELINE_REPS,
        suggestedSets: BASELINE_SETS,
        reason: 'Insufficient history data',
        plateauFlag: false,
        primaryMuscle,
        currentWeeklySets: 0,
        projectedWeeklySets: 0,
        caps,
        allTimeBestWeight: 0,
        allTimeBestE1RM: 0,
      };
    }
    
    const suggestion = applyDecisionHierarchy(
      metrics,
      settings,
      history,
      normalizedExerciseName,
      experienceLevel,
      currentWeeklySets,
      caps,
      baseSuggestion,
      currentProgramWeek,
      deloadFreq,
      readiness,
      coachMemory
    );

    if (suggestion.plateauFlag) {
      suggestion.swapSuggestions = libraryEntry
        ? await findSwapSuggestions(libraryEntry, primaryMuscle, normalizedExerciseName)
        : SWAP_MAPPING[normalizedExerciseName] || [];
    }

    return suggestion;
  } catch (error) {
    console.error(`Error calculating suggestion for ${exerciseName}:`, error);
    return {
      suggestedWeight: BASELINE_WEIGHT_LBS,
      suggestedReps: BASELINE_REPS,
      suggestedSets: BASELINE_SETS,
      reason: 'Error loading history - using default suggestion',
      plateauFlag: false,
      primaryMuscle: 'unknown',
      currentWeeklySets: 0,
      projectedWeeklySets: 0,
      caps: VOLUME_CAPS_BY_LEVEL.intermediate,
      allTimeBestWeight: 0,
      allTimeBestE1RM: 0,
    };
  }
}

async function loadCoachMemory(exerciseName: string): Promise<CoachMemoryContext> {
  const [exercise, global] = await Promise.all([
    getExerciseCoachState(exerciseName),
    getGlobalCoachState(),
  ]);

  return { exercise, global };
}

async function findSwapSuggestions(
  currentExercise: NonNullable<Awaited<ReturnType<typeof findExerciseByName>>>,
  primaryMuscle: string,
  excludeName: string
): Promise<string[]> {
  const variations = await findExerciseVariations(primaryMuscle, currentExercise, 3);
  return variations.length > 0 ? variations.map((exercise) => exercise.name) : (SWAP_MAPPING[normalizeExerciseName(excludeName)] || []);
}

interface Metrics {
  daysSinceLast: number;
  avgRPE: number;
  repDropOff: number;
  allSetsHitTopRepRange: boolean;
  mostSetsNearTopRange: boolean;
  repsDecliningOverLast2Sessions: boolean;
  weightStagnant: boolean;
  noProgressOverLast3Sessions: boolean;
  noProgressOverLast4Sessions: boolean;
  lastBestWeight: number;
  lastSets: number;
  lastAvgReps: number;
  soreness: number;
  lastDebrief?: Session['postSessionDebrief'];
}

interface CoachMemoryContext {
  exercise: ExerciseCoachState;
  global: GlobalCoachState;
}

function calculateMetrics(history: Session[], exerciseName: string, settings: { maxReps: number }): Metrics | null {
  const normalizedExerciseName = normalizeExerciseName(exerciseName);
  const lastSession = history[history.length - 1];
  if (!lastSession) return null;
  
  const lastExercise = lastSession.exercises.find((entry) => normalizeExerciseName(entry.exerciseName) === normalizedExerciseName);
  if (!lastExercise || lastExercise.sets.length === 0) return null;
  
  const currentE1RM = calculateMaxE1RMFromSets(lastExercise.sets);
  const daysSinceLast = Math.floor((Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24));
  const avgRPE = lastExercise.sets.reduce((sum, set) => sum + set.rpe, 0) / lastExercise.sets.length;
  const repDropOff = lastExercise.sets[0].reps - lastExercise.sets[lastExercise.sets.length - 1].reps;
  const allSetsHitTopRepRange = lastExercise.sets.every((set) => set.reps >= settings.maxReps);
  const setsNearTop = lastExercise.sets.filter((set) => set.reps >= settings.maxReps - 1).length;
  const mostSetsNearTopRange = setsNearTop >= lastExercise.sets.length / 2;
  const lastBestWeight = Math.max(...lastExercise.sets.map((set) => set.weight));
  const lastSets = lastExercise.sets.length;
  const lastAvgReps = Math.round(lastExercise.sets.reduce((sum, set) => sum + set.reps, 0) / lastExercise.sets.length);

  let repsDecliningOverLast2Sessions = false;
  let weightStagnant = false;
  let noProgressOverLast3Sessions = false;
  let noProgressOverLast4Sessions = false;

  if (history.length >= 2) {
    const previousSession = history[history.length - 2];
    const previousExercise = previousSession.exercises.find((entry) => normalizeExerciseName(entry.exerciseName) === normalizedExerciseName);
    if (previousExercise) {
      const previousE1RM = calculateMaxE1RMFromSets(previousExercise.sets);
      repsDecliningOverLast2Sessions = (previousE1RM - currentE1RM) > (previousE1RM * 0.05);

      const previousBestWeight = Math.max(...previousExercise.sets.map((set) => set.weight));
      const weightDiff = Math.abs(lastBestWeight - previousBestWeight);
      weightStagnant = weightDiff <= Math.max(previousBestWeight * 0.015, 1);
    }
  }

  if (history.length >= 3) {
    const lastThree = history
      .slice(-3)
      .map((session) => session.exercises.find((entry) => normalizeExerciseName(entry.exerciseName) === normalizedExerciseName))
      .filter(Boolean) as ExerciseSession[];

    if (lastThree.length === 3) {
      const firstE1RM = calculateMaxE1RMFromSets(lastThree[0].sets);
      const latestE1RM = calculateMaxE1RMFromSets(lastThree[2].sets);
      noProgressOverLast3Sessions = latestE1RM <= firstE1RM * 1.01;
    }
  }

  if (history.length >= 4) {
    const lastFour = history
      .slice(-4)
      .map((session) => session.exercises.find((entry) => normalizeExerciseName(entry.exerciseName) === normalizedExerciseName))
      .filter(Boolean) as ExerciseSession[];

    if (lastFour.length === 4) {
      const firstE1RM = calculateMaxE1RMFromSets(lastFour[0].sets);
      const latestE1RM = calculateMaxE1RMFromSets(lastFour[3].sets);
      noProgressOverLast4Sessions = latestE1RM <= firstE1RM * 1.01;
    }
  }

  return {
    daysSinceLast,
    avgRPE,
    repDropOff,
    allSetsHitTopRepRange,
    mostSetsNearTopRange,
    repsDecliningOverLast2Sessions,
    weightStagnant,
    noProgressOverLast3Sessions,
    noProgressOverLast4Sessions,
    lastBestWeight,
    lastSets,
    lastAvgReps,
    soreness: lastSession.soreness,
    lastDebrief: lastSession.postSessionDebrief,
  };
}

function applyDecisionHierarchy(
  metrics: Metrics,
  settings: { weightIncrement: number; minReps: number; maxReps: number },
  history: Session[],
  exerciseName: string,
  level: ExperienceLevel,
  currentWeeklySets: number,
  caps: { mev: number; mav: number; mrv: number },
  baseSuggestion: Partial<Suggestion>,
  programWeek: number,
  deloadFreq: number | 'off',
  readiness?: SuggestionReadinessContext,
  coachMemory?: CoachMemoryContext
): Suggestion {
  const config = LEVEL_CONFIGS[level];
  const weightIncrement = settings.weightIncrement * config.incrementMult;
  const rpeGate = 9.5 + config.rpeThresholdOffset;
  const plateauDetected = config.plateauSessions === 4 ? metrics.noProgressOverLast4Sessions : metrics.noProgressOverLast3Sessions;

  const suggestion: Suggestion = {
    ...(baseSuggestion as Suggestion),
    suggestedWeight: metrics.lastBestWeight,
    suggestedReps: metrics.lastAvgReps,
    suggestedSets: metrics.lastSets,
    reason: '',
    plateauFlag: false,
  };

  let specificVolumeDecision = false;
  const isReadinessPoor = Boolean(readiness && (readiness.sleep < 6.5 || readiness.energy <= 4));
  const hasPainFlag = readiness?.bodyStatus === 'pain_or_strain';
  const wantsLight = readiness?.goal === 'light';
  const wantsPush = readiness?.goal === 'push';
  const isShortOnTime = readiness?.timeAvailable === 'short';
  const lastDebriefTooMuch = metrics.lastDebrief?.planFit === 'too_much';
  const lastDebriefTooEasy = metrics.lastDebrief?.planFit === 'too_easy';
  const lastDebriefFatigued = metrics.lastDebrief?.bodyResponse === 'fatigued';
  const lastDebriefPain = metrics.lastDebrief?.bodyResponse === 'pain_or_strain';
  const lastDebriefWantsSwap = metrics.lastDebrief?.confidenceNextTime === 'swap';
  const persistentPainFlag = (coachMemory?.exercise.painPenalty ?? 0) >= 1;
  const lowLiftTolerance = (coachMemory?.exercise.toleranceBias ?? 0) <= -0.5;
  const highLiftConfidence = (coachMemory?.exercise.confidenceBias ?? 0) >= 0.5;
  const lowLiftConfidence = (coachMemory?.exercise.confidenceBias ?? 0) <= -0.5;
  const persistentSwapPreference = (coachMemory?.exercise.swapPreference ?? 0) >= 1.25;
  const negativeGlobalRecovery =
    (coachMemory?.global.recoveryTrend ?? 0) <= -0.75 ||
    (coachMemory?.global.fatigueTrend ?? 0) <= -0.75;
  const positiveGlobalRecovery =
    (coachMemory?.global.recoveryTrend ?? 0) >= 0.75 &&
    (coachMemory?.global.fatigueTrend ?? 0) >= -0.25;

  if (hasPainFlag || lastDebriefPain || persistentPainFlag) {
    suggestion.suggestedWeight = metrics.lastBestWeight * 0.85;
    suggestion.suggestedSets = Math.max(1, Math.min(metrics.lastSets, 2));
    suggestion.suggestedReps = Math.max(settings.minReps, metrics.lastAvgReps - 1);
    suggestion.suggestedRPE = rpeGate - 2;
    suggestion.reason = persistentPainFlag
      ? 'Coach memory still has this lift on a pain watch - keep it submaximal and protect the pattern'
      : 'Pain or strain flagged - keep this lift submaximal and protect the pattern';
    specificVolumeDecision = true;
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, true, exerciseName, coachMemory);
  }

  if (lastDebriefTooMuch || lastDebriefFatigued || lastDebriefWantsSwap || lowLiftTolerance || negativeGlobalRecovery || persistentSwapPreference) {
    suggestion.suggestedWeight = metrics.lastBestWeight * (lastDebriefWantsSwap ? 0.9 : 0.95);
    suggestion.suggestedSets = Math.max(1, metrics.lastSets - 1);
    suggestion.suggestedReps = Math.max(settings.minReps, metrics.lastAvgReps - (lastDebriefWantsSwap ? 1 : 0));
    suggestion.reason = lastDebriefWantsSwap || persistentSwapPreference
      ? 'Last session debrief favored a variation change - keep this lift conservative if you repeat it'
      : lowLiftTolerance || negativeGlobalRecovery
        ? 'Coach memory shows this lift has been less well-tolerated recently - reduce demand and rebuild quality'
      : 'Last session debrief ran harder than planned - reduce demand and rebuild quality';
    specificVolumeDecision = true;
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
  }

  if (isReadinessPoor) {
    suggestion.suggestedSets = Math.min(metrics.lastSets, 2);
    suggestion.suggestedReps = metrics.lastAvgReps;
    suggestion.suggestedRPE = rpeGate - 1.5;
    suggestion.reason = 'Low sleep or energy - reduced volume to protect recovery and quality';
    specificVolumeDecision = true;
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
  }

  if (wantsLight) {
    suggestion.suggestedWeight = metrics.lastBestWeight * 0.95;
    suggestion.suggestedSets = Math.max(1, Math.min(metrics.lastSets, 2));
    suggestion.reason = 'Light-day goal selected - hold quality and keep demand intentionally lower';
    specificVolumeDecision = true;
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
  }

  if (isShortOnTime) {
    suggestion.suggestedSets = Math.max(1, Math.min(metrics.lastSets, 2));
    suggestion.reason = 'Short session window - prioritize minimum effective work';
    specificVolumeDecision = true;
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
  }

  if (deloadFreq !== 'off' && programWeek % deloadFreq === 0) {
    const hasFatigue = metrics.soreness >= 6 || metrics.avgRPE >= 9 || metrics.repDropOff > 2;

    if (hasFatigue) {
      suggestion.suggestedWeight = metrics.lastBestWeight * 0.85;
      suggestion.suggestedSets = Math.max(1, Math.floor(metrics.lastSets * 0.75));
      suggestion.reason = `Programmed deload week (Week ${programWeek}) - fatigue markers present`;
    } else {
      suggestion.suggestedWeight = metrics.lastBestWeight * 0.95;
      suggestion.reason = `Programmed deload week (Week ${programWeek}) - active recovery / light session`;
    }

    specificVolumeDecision = true;
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
  }

  if (metrics.soreness >= 8) {
    suggestion.suggestedWeight = metrics.lastBestWeight * 0.8;
    suggestion.suggestedSets = Math.max(1, metrics.lastSets - 1);
    suggestion.reason = 'High soreness - prioritize recovery';
    specificVolumeDecision = true;
  } else if (metrics.daysSinceLast > 14 && metrics.soreness >= 6) {
    suggestion.suggestedWeight = metrics.lastBestWeight * 0.85;
    suggestion.suggestedSets = BASELINE_SETS;
    suggestion.reason = 'Extended rest with fatigue - rebuild gradually';
    specificVolumeDecision = true;
  } else if (metrics.daysSinceLast > 14) {
    suggestion.suggestedWeight = metrics.lastBestWeight * 0.9;
    suggestion.suggestedSets = BASELINE_SETS;
    suggestion.reason = 'Extended rest - conservative re-entry';
    specificVolumeDecision = true;
  }

  if (suggestion.reason) {
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
  }

  const projectedWeeklySets = currentWeeklySets + suggestion.suggestedSets;
  if (projectedWeeklySets > caps.mrv) {
    suggestion.suggestedWeight = metrics.lastBestWeight;
    suggestion.suggestedReps = metrics.lastAvgReps;
    suggestion.suggestedSets = Math.max(1, Math.min(suggestion.suggestedSets, caps.mrv - currentWeeklySets));
    suggestion.reason = `Weekly ${suggestion.primaryMuscle} volume near MRV (${currentWeeklySets}/${caps.mrv}) - capping volume`;
    specificVolumeDecision = true;
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
  }

  if (metrics.avgRPE > rpeGate) {
    suggestion.suggestedWeight = metrics.lastBestWeight;
    suggestion.suggestedReps = Math.max(3, metrics.lastAvgReps - 2);
    suggestion.reason = 'Maximal effort reached - build capacity before loading';
    specificVolumeDecision = true;
  } else if (metrics.repDropOff > 4) {
    suggestion.suggestedWeight = metrics.lastBestWeight;
    suggestion.reason = 'Fatigue dominated - improve work capacity';
    specificVolumeDecision = true;
  } else if (metrics.repDropOff > 2 && metrics.avgRPE > 8.5) {
    suggestion.suggestedWeight = metrics.lastBestWeight;
    suggestion.reason = 'Quality threshold approached - consolidate gains';
    specificVolumeDecision = true;
  }

  if (suggestion.reason) {
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
  }

  const aggressiveRPE =
    6 -
    config.rpeThresholdOffset -
    (wantsPush ? 0.5 : 0) -
    (lastDebriefTooEasy ? 0.5 : 0) -
    (highLiftConfidence ? 0.35 : 0) +
    (lowLiftConfidence ? 0.35 : 0) -
    (positiveGlobalRecovery ? 0.15 : 0);
  if (metrics.avgRPE < aggressiveRPE && metrics.allSetsHitTopRepRange && metrics.repDropOff <= 2) {
    suggestion.suggestedWeight = metrics.lastBestWeight + (weightIncrement * 2);
    suggestion.suggestedSets = Math.min(metrics.lastSets + 1, config.setCap);
    suggestion.suggestedReps = settings.minReps;
    suggestion.reason = highLiftConfidence
      ? 'Strong performance with supportive coach memory - accelerate'
      : 'Strong performance with low effort - accelerate';
    specificVolumeDecision = true;
  } else if (metrics.avgRPE < (aggressiveRPE + 1) && metrics.daysSinceLast < 5) {
    suggestion.suggestedWeight = metrics.lastBestWeight + weightIncrement;
    suggestion.suggestedSets = Math.min(metrics.lastSets + 1, config.setCap);
    suggestion.reason = positiveGlobalRecovery
      ? 'Recovery trend looks strong and the stimulus is being well-tolerated - add volume'
      : 'Recovering fast, stimulus well-tolerated - add volume';
    specificVolumeDecision = true;
  }

  if (suggestion.reason) {
    return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
  }

  if (metrics.allSetsHitTopRepRange && metrics.repDropOff <= 2) {
    suggestion.suggestedWeight = metrics.lastBestWeight + weightIncrement;
    suggestion.suggestedReps = settings.minReps;
    suggestion.reason = 'Range mastered with quality - load progression';
  } else if (metrics.mostSetsNearTopRange && metrics.repDropOff <= 3) {
    suggestion.suggestedWeight = metrics.lastBestWeight;
    suggestion.suggestedReps = Math.min(settings.maxReps, metrics.lastAvgReps + 1);
    suggestion.reason = 'Approaching threshold - push reps to unlock load';
  } else {
    suggestion.suggestedWeight = metrics.lastBestWeight;
    suggestion.suggestedReps = Math.min(settings.maxReps, metrics.lastAvgReps + 1);
    suggestion.reason = 'Standard progression - build reps toward range ceiling';
  }

  if (metrics.repsDecliningOverLast2Sessions && metrics.weightStagnant) {
    suggestion.suggestedWeight = metrics.lastBestWeight * 0.9;
    suggestion.suggestedReps = settings.minReps;
    suggestion.suggestedSets = BASELINE_SETS;
    suggestion.reason = 'Performance declining - reduce load, rebuild';
    specificVolumeDecision = true;
  } else if (config.plateauSessions !== null && (plateauDetected || persistentSwapPreference)) {
    const windowSize = config.plateauSessions;
    const normalizedExerciseName = normalizeExerciseName(exerciseName);
    const recentHistory = history
      .filter((session) => session.exercises.some((entry) => normalizeExerciseName(entry.exerciseName) === normalizedExerciseName))
      .slice(-windowSize);

    const rpes = recentHistory
      .map((session) => {
        const exercise = session.exercises.find((entry) => normalizeExerciseName(entry.exerciseName) === normalizedExerciseName);
        return exercise ? exercise.sets.reduce((sum, set) => sum + set.rpe, 0) / exercise.sets.length : null;
      })
      .filter((rpe): rpe is number => rpe !== null);

    const effortIncreasing = rpes.length >= 2 && rpes[rpes.length - 1] > rpes[0];
    const effortConsistentlyHigh = rpes.length >= 2 && rpes.every((rpe) => rpe >= 9);

    if (effortIncreasing || effortConsistentlyHigh) {
      suggestion.plateauFlag = true;
      suggestion.reason = 'Plateau detected - performance stagnant despite high effort';
    } else if (persistentSwapPreference) {
      suggestion.plateauFlag = true;
      suggestion.reason = 'Coach memory is leaning toward a variation change after repeated swap signals';
    }
  }

  return finalizeSets(suggestion, metrics, specificVolumeDecision, level, currentWeeklySets, caps, isReadinessPoor, exerciseName, coachMemory);
}

function finalizeSets(
  suggestion: Suggestion,
  metrics: Metrics,
  specificVolumeDecision: boolean,
  level: ExperienceLevel,
  currentWeeklySets: number,
  caps: { mev: number; mav: number; mrv: number },
  isReadinessPoor?: boolean,
  exerciseName?: string,
  coachMemory?: CoachMemoryContext
): Suggestion {
  const config = LEVEL_CONFIGS[level];
  const maxSets = config.setCap;
  const toleranceBias = coachMemory?.exercise.toleranceBias ?? 0;
  const fatigueTrend = coachMemory?.global.fatigueTrend ?? 0;

  if (!specificVolumeDecision) {
    const rpeThreshold = 8 + config.rpeThresholdOffset;
    const projectedWeeklySets = currentWeeklySets + suggestion.suggestedSets + 1;

    const shouldAddSet =
      metrics.lastSets < maxSets &&
      metrics.soreness <= ((4 + toleranceBias) * config.volumeEase) &&
      metrics.avgRPE <= (rpeThreshold + Math.max(0, toleranceBias * 0.3)) &&
      metrics.repDropOff <= 2 &&
      metrics.daysSinceLast < (7 * config.volumeEase) &&
      !isReadinessPoor &&
      toleranceBias > -0.75 &&
      fatigueTrend > -1.25 &&
      projectedWeeklySets <= caps.mav;

    const shouldReduceSet =
      metrics.soreness >= ((7 - toleranceBias) / config.volumeEase) ||
      metrics.avgRPE > (9.5 + config.rpeThresholdOffset) ||
      metrics.repDropOff > 4 ||
      metrics.daysSinceLast > 10 ||
      toleranceBias <= -0.75 ||
      fatigueTrend <= -1.25 ||
      Boolean(isReadinessPoor);

    if (shouldAddSet) {
      suggestion.suggestedSets = Math.min(metrics.lastSets + 1, maxSets);
      const nextWeeklySets = currentWeeklySets + suggestion.suggestedSets;
      const volumeLabel = nextWeeklySets < caps.mev
        ? `below MEV (${nextWeeklySets}/${caps.mev}-${caps.mav})`
        : `targeting MAV (${nextWeeklySets}/${caps.mev}-${caps.mav})`;
      suggestion.reason += ` + strong recovery - ${volumeLabel}`;
      suggestion.projectedWeeklySets = nextWeeklySets;
    } else if (shouldReduceSet) {
      suggestion.suggestedSets = Math.max(1, metrics.lastSets - 1);
      suggestion.projectedWeeklySets = currentWeeklySets + suggestion.suggestedSets;
      if (toleranceBias <= -0.75 || fatigueTrend <= -1.25) {
        suggestion.reason += ' + coach memory is holding volume down';
      }
    }
  }

  if (suggestion.plateauFlag && exerciseName) {
    suggestion.reason += ' - Consider swapping exercise.';
    suggestion.swapSuggestions = suggestion.swapSuggestions ?? SWAP_MAPPING[normalizeExerciseName(exerciseName)] ?? [];
  }

  suggestion.currentWeeklySets = currentWeeklySets;
  suggestion.projectedWeeklySets ??= currentWeeklySets + suggestion.suggestedSets;

  suggestion.isReadinessPoor = isReadinessPoor;
  return suggestion;
}
