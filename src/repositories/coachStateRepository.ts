import { db } from '../db/database';
import type { ExerciseCoachState, GlobalCoachState, Session } from '../db/models';

const GLOBAL_COACH_STATE_ID = 'global' as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundBias(value: number) {
  return Math.round(value * 100) / 100;
}

function getExerciseCoachStateId(exerciseName: string) {
  return `exercise:${exerciseName.toLowerCase().trim()}`;
}

function normalizeExerciseName(exerciseName: string) {
  return exerciseName.toLowerCase().trim();
}

export async function getExerciseCoachState(exerciseName: string): Promise<ExerciseCoachState> {
  const normalizedName = exerciseName.toLowerCase().trim();
  const existing = await db.coachStates.get(getExerciseCoachStateId(normalizedName)) as ExerciseCoachState | undefined;

  if (existing) {
    return existing;
  }

  return {
    id: getExerciseCoachStateId(normalizedName),
    exerciseName: normalizedName,
    confidenceBias: 0,
    toleranceBias: 0,
    painPenalty: 0,
    swapPreference: 0,
    lastUpdated: new Date(0).toISOString(),
  };
}

export async function getGlobalCoachState(): Promise<GlobalCoachState> {
  const existing = await db.coachStates.get(GLOBAL_COACH_STATE_ID) as GlobalCoachState | undefined;

  if (existing) {
    return existing;
  }

  return {
    id: GLOBAL_COACH_STATE_ID,
    recoveryTrend: 0,
    fatigueTrend: 0,
    lastUpdated: new Date(0).toISOString(),
  };
}

export async function getAllExerciseCoachStates(): Promise<ExerciseCoachState[]> {
  const allRecords = await db.coachStates.toArray();
  const records = allRecords.filter(
    (entry): entry is ExerciseCoachState => entry.id !== GLOBAL_COACH_STATE_ID
  );

  return records.sort((a, b) => {
    const scoreA = a.painPenalty + a.swapPreference + Math.abs(a.confidenceBias) + Math.abs(a.toleranceBias);
    const scoreB = b.painPenalty + b.swapPreference + Math.abs(b.confidenceBias) + Math.abs(b.toleranceBias);
    return scoreB - scoreA || a.exerciseName.localeCompare(b.exerciseName);
  });
}

export async function resetExerciseCoachState(exerciseName: string): Promise<void> {
  await db.coachStates.delete(getExerciseCoachStateId(exerciseName));
}

export async function updateCoachStateFromSession(session: Session): Promise<void> {
  const timestamp = session.date || new Date().toISOString();
  const debrief = session.postSessionDebrief;
  const checkIn = session.preSessionCheckIn;

  const globalState = await getGlobalCoachState();
  let nextRecoveryTrend = globalState.recoveryTrend;
  let nextFatigueTrend = globalState.fatigueTrend;

  if (checkIn?.recovery === 'good') nextRecoveryTrend += 0.2;
  if (checkIn?.recovery === 'poor') nextRecoveryTrend -= 0.3;
  if (checkIn?.energy === 'high') nextRecoveryTrend += 0.1;
  if (checkIn?.energy === 'low') nextRecoveryTrend -= 0.2;

  if (debrief?.sessionDifficulty === 'pushed_hard') nextFatigueTrend -= 0.15;
  if (debrief?.bodyResponse === 'fatigued') nextFatigueTrend -= 0.35;
  if (debrief?.bodyResponse === 'felt_good') nextFatigueTrend += 0.1;
  if (debrief?.planFit === 'too_much') nextFatigueTrend -= 0.2;
  if (debrief?.planFit === 'too_easy') nextFatigueTrend += 0.1;

  await db.coachStates.put({
    id: GLOBAL_COACH_STATE_ID,
    recoveryTrend: roundBias(clamp(nextRecoveryTrend, -2, 2)),
    fatigueTrend: roundBias(clamp(nextFatigueTrend, -2, 2)),
    lastUpdated: timestamp,
  } satisfies GlobalCoachState);

  await Promise.all(session.exercises.map(async (exercise) => {
    const normalizedExerciseName = normalizeExerciseName(exercise.exerciseName);
    const current = await getExerciseCoachState(normalizedExerciseName);

    let confidenceBias = current.confidenceBias;
    let toleranceBias = current.toleranceBias;
    let painPenalty = current.painPenalty;
    let swapPreference = current.swapPreference;

    if (debrief?.planFit === 'too_easy') confidenceBias += 0.25;
    if (debrief?.planFit === 'too_much') {
      confidenceBias -= 0.25;
      toleranceBias -= 0.25;
    }

    if (debrief?.bodyResponse === 'felt_good') toleranceBias += 0.1;
    if (debrief?.bodyResponse === 'fatigued') toleranceBias -= 0.25;
    if (debrief?.bodyResponse === 'pain_or_strain') {
      toleranceBias -= 0.35;
      painPenalty += 1;
      swapPreference += 0.5;
    } else {
      painPenalty -= 0.15;
    }

    if (debrief?.confidenceNextTime === 'progress') confidenceBias += 0.2;
    if (debrief?.confidenceNextTime === 'repeat') toleranceBias -= 0.05;
    if (debrief?.confidenceNextTime === 'swap') swapPreference += 0.6;

    if (checkIn?.goal === 'push' && checkIn.recovery === 'good' && checkIn.energy === 'high') {
      confidenceBias += 0.1;
    }
    if (checkIn?.bodyStatus === 'pain_or_strain') {
      painPenalty += 0.5;
      toleranceBias -= 0.2;
    }

    await db.coachStates.put({
      id: current.id,
      exerciseName: normalizedExerciseName,
      confidenceBias: roundBias(clamp(confidenceBias, -2, 2)),
      toleranceBias: roundBias(clamp(toleranceBias, -2, 2)),
      painPenalty: roundBias(clamp(painPenalty, 0, 3)),
      swapPreference: roundBias(clamp(swapPreference, 0, 3)),
      lastUpdated: timestamp,
    } satisfies ExerciseCoachState);
  }));
}

export async function rebuildCoachStateFromHistory(): Promise<void> {
  const sessions = await db.sessions.orderBy('date').toArray();
  await db.coachStates.clear();

  for (const session of sessions) {
    await updateCoachStateFromSession(session);
  }
}
