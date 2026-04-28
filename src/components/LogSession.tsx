import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import type { Session, Exercise, ExerciseSession } from '../db/models';
import { getUserSettings, updateUserSettings } from '../progression/settings';
import { saveWorkoutSession } from '../repositories/sessionRepository';
import { clearWorkoutDraft, formatDraftTimestamp, readWorkoutDraft, WORKOUT_DRAFT_KEY, writeWorkoutDraft } from '../features/logSession/draft';
import {
  buildSession,
  createDefaultPostSessionDebrief,
  createDefaultPreSessionCheckIn,
  deriveReadinessScores,
  ensureDefaultCheckIn,
  normalizeExercisesForSave,
  validateCheckIn,
  validateDebrief,
  validateExercisesForSave,
} from '../features/logSession/session';
import type { ExerciseSessionUI, PrefillExercise, WorkoutDraft, WorkoutSetUI } from '../features/logSession/types';
import { useExerciseSuggestions } from '../features/logSession/useExerciseSuggestions';
import { normalizeExerciseName } from '../utils/normalization';
import {
  AddMovementButton,
  CoachCheckInSection,
  CoachPlanSummarySection,
  DraftStatusBanner,
  EmptyExerciseState,
  ExerciseCard,
  ExercisePickerModal,
  LogSessionHeader,
  ProgramWeekSection,
  SaveSessionButton,
  SaveSuccessBanner,
  SessionWrapUpSection,
} from '../features/logSession/components';

function getCoachPlanSummary(
  checkIn: ReturnType<typeof createDefaultPreSessionCheckIn>,
  suggestionReasons: string[],
  carriedNote?: string
) {
  const bullets: string[] = [];

  if (checkIn.bodyStatus === 'pain_or_strain') {
    bullets.push('Pain or strain was flagged, so the coach will protect loading and may favor a variation change.');
  } else if (checkIn.recovery === 'poor' || checkIn.energy === 'low') {
    bullets.push('Recovery or energy came in low, so today is biased toward quality and controlled fatigue.');
  } else if (checkIn.goal === 'light') {
    bullets.push('You selected a light day, so progression will stay conservative even if the lift is moving well.');
  } else if (checkIn.goal === 'push' && checkIn.recovery === 'good' && checkIn.energy === 'high') {
    bullets.push('Recovery and energy both look strong, so the coach is open to a more assertive progression path.');
  } else {
    bullets.push('Today starts from a normal productive baseline, then adjusts once lift-specific history is factored in.');
  }

  if (checkIn.timeAvailable === 'short') {
    bullets.push('Your shorter session window trims the plan toward minimum effective work instead of full volume.');
  } else if (checkIn.timeAvailable === 'long') {
    bullets.push('Your longer session window leaves room for full work and accessory volume if recovery supports it.');
  }

  suggestionReasons.slice(0, 2).forEach((reason) => {
    bullets.push(reason);
  });

  if (bullets.length === 0) {
    bullets.push('Add a movement to see lift-specific coaching reasons for today.');
  }

  let headline = 'Normal Productive Session';
  let summary = 'The coach is reading today as a standard training day and will tailor each lift as suggestions load.';

  if (checkIn.bodyStatus === 'pain_or_strain') {
    headline = 'Protective Session';
    summary = 'The coach is treating today as a protection-first day, keeping demand lower and watching for swap signals.';
  } else if (checkIn.recovery === 'poor' || checkIn.energy === 'low') {
    headline = 'Recovery-Managed Session';
    summary = 'The coach is holding the session below full aggression because your check-in points to a lower-readiness day.';
  } else if (checkIn.goal === 'light') {
    headline = 'Light Intent Session';
    summary = 'The coach is preserving training quality while intentionally keeping the day easier to recover from.';
  } else if (checkIn.goal === 'push' && checkIn.recovery === 'good' && checkIn.energy === 'high') {
    headline = 'Push Window Open';
    summary = 'The coach sees enough readiness to allow stronger progression if the lift-specific history agrees.';
  }

  if (carriedNote && !bullets.some((bullet) => bullet.includes(carriedNote))) {
    bullets.push('A prior coaching note was carried into this session so the context follows the lift.');
  }

  return { headline, summary, bullets: bullets.slice(0, 4) };
}

const LogSession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill as PrefillExercise | PrefillExercise[] | undefined;
  const hasPrefill = Boolean(prefill);
  const initialDraftRef = useRef<WorkoutDraft | null>(hasPrefill ? null : readWorkoutDraft());
  const initialDraft = initialDraftRef.current;

  const [exercises, setExercises] = useState<ExerciseSessionUI[]>(() => {
    if (prefill) {
      const items = Array.isArray(prefill) ? prefill : [prefill];
      return items.map((item) => ({
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        sets: Array.from({ length: item.suggestedSets || 3 }, () => ({
          weight: (item.suggestedWeight || 0).toString(),
          reps: (item.suggestedReps || 8).toString(),
          rpe: '8',
        })),
      }));
    }

    if (initialDraft?.exercises) {
      return initialDraft.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => ({
          weight: s.weight.toString(),
          reps: s.reps.toString(),
          rpe: s.rpe.toString()
        }))
      }));
    }

    return [];
  });

  const [preSessionCheckIn, setPreSessionCheckIn] = useState(() => hasPrefill
    ? createDefaultPreSessionCheckIn()
    : initialDraft?.preSessionCheckIn ?? createDefaultPreSessionCheckIn()
  );
  const [postSessionDebrief, setPostSessionDebrief] = useState(() => hasPrefill
    ? createDefaultPostSessionDebrief()
    : initialDraft?.postSessionDebrief ?? createDefaultPostSessionDebrief()
  );

  const [notes, setNotes] = useState<string>(() => {
    if (location.state?.note) return location.state.note as string;
    if (hasPrefill) return '';
    return initialDraft?.notes ?? '';
  });

  const [programWeek, setProgramWeek] = useState<number>(1);
  const [showPicker, setShowPicker] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unit, setUnit] = useState('lbs');
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(initialDraft?.timestamp ?? null);

  const draftDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const derivedReadiness = deriveReadinessScores(preSessionCheckIn);

  const exercisesForSuggestions = useMemo(() => exercises.map(ex => ({
    ...ex,
    sets: ex.sets.map(s => ({
      weight: parseFloat(s.weight) || 0,
      reps: parseInt(s.reps) || 0,
      rpe: parseFloat(s.rpe) || 0
    }))
  })), [exercises]);

  const suggestions = useExerciseSuggestions(exercisesForSuggestions, {
    ...derivedReadiness,
    bodyStatus: preSessionCheckIn.bodyStatus,
    goal: preSessionCheckIn.goal,
    timeAvailable: preSessionCheckIn.timeAvailable,
  }, programWeek);

  const restoredDraftAtLabel = formatDraftTimestamp(initialDraft?.timestamp);
  const draftSavedAtLabel = formatDraftTimestamp(draftSavedAt ?? undefined);
  const visibleSuggestionReasons = exercises
    .map((exercise) => suggestions[normalizeExerciseName(exercise.exerciseName)]?.reason)
    .filter((reason): reason is string => Boolean(reason));
  const trackedMovementCount = exercises.filter((exercise) => exercise.exerciseName.trim() !== '').length;
  const readySuggestionCount = Object.values(suggestions).filter((suggestion) => Boolean(suggestion?.reason)).length;
  const coachPlanSummary = getCoachPlanSummary(
    preSessionCheckIn,
    Array.from(new Set(visibleSuggestionReasons)),
    location.state?.note as string | undefined
  );

  // Debounced draft auto-save
  useEffect(() => {
    if (showSuccess) return;

    setIsDraftSaving(true);
    if (draftDebounceTimer.current) clearTimeout(draftDebounceTimer.current);
    draftDebounceTimer.current = setTimeout(() => {
      const timestamp = Date.now();
      const exercisesForDraft: ExerciseSession[] = exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          rpe: parseFloat(s.rpe) || 0
        }))
      }));
      writeWorkoutDraft({ exercises: exercisesForDraft, preSessionCheckIn, postSessionDebrief, notes, programWeek, timestamp });
      setDraftSavedAt(timestamp);
      setIsDraftSaving(false);
    }, 500);

    return () => {
      if (draftDebounceTimer.current) clearTimeout(draftDebounceTimer.current);
    };
  }, [exercises, notes, postSessionDebrief, preSessionCheckIn, programWeek, showSuccess]);

  useEffect(() => {
    async function init() {
      const settings = await getUserSettings();
      setUnit(settings.unit);

      const draft = initialDraftRef.current;
      if (draft && !hasPrefill) {
        if (draft.preSessionCheckIn) setPreSessionCheckIn(draft.preSessionCheckIn);
        if (draft.postSessionDebrief) setPostSessionDebrief(draft.postSessionDebrief);
        if (draft.programWeek) {
          setProgramWeek(draft.programWeek);
          return;
        }
      }
      setProgramWeek(settings.lastUsedWeek || 1);
    }
    init();
  }, [hasPrefill]);

  const handleExerciseSelect = useCallback((exercise: Exercise) => {
    const name = exercise.name;
    const id = exercise.id?.toString();

    let shouldClosePicker = true;
    setExercises(currentExercises => {
      const isDuplicate = currentExercises.some(ex => ex.exerciseName.toLowerCase() === name.toLowerCase());
      if (isDuplicate) {
        alert(`${name} is already in this session.`);
        return currentExercises;
      }

      if (showPicker === -1) {
        return [...currentExercises, { exerciseId: id, exerciseName: name, sets: [{ weight: '0', reps: '0', rpe: '7' }] }];
      }

      if (showPicker === null) {
        shouldClosePicker = false;
        return currentExercises;
      }

      return currentExercises.map((existingExercise, index) => (
        index === showPicker
          ? { ...existingExercise, exerciseId: id, exerciseName: name }
          : existingExercise
      ));
    });

    if (shouldClosePicker) {
      setShowPicker(null);
    }
  }, [showPicker]);

  const removeExercise = useCallback((index: number) => {
    const ex = exercises[index];
    const hasData = ex.exerciseName || ex.sets.some(s => parseFloat(s.weight) > 0 || parseInt(s.reps) > 0);
    if (hasData && !confirm(`Remove ${ex.exerciseName || 'this exercise'}?`)) return;
    setExercises(currentExercises => currentExercises.filter((_, i) => i !== index));
  }, [exercises]);

  const clearWorkout = useCallback(() => {
    if (confirm('Clear current workout draft?')) {
      clearWorkoutDraft();
      initialDraftRef.current = null;
      setExercises([]);
      setPreSessionCheckIn(createDefaultPreSessionCheckIn());
      setPostSessionDebrief(createDefaultPostSessionDebrief());
      setNotes('');
      setDraftSavedAt(null);
      setIsDraftSaving(false);
      getUserSettings().then(s => setProgramWeek(s.lastUsedWeek || 1));
    }
  }, []);

  const addSet = useCallback((exIndex: number, isWarmup: boolean = false) => {
    setExercises(currentExercises => currentExercises.map((exercise, index) => {
      if (index !== exIndex) return exercise;

      const lastSet = exercise.sets[exercise.sets.length - 1];
      const lastWeight = parseFloat(lastSet.weight) || 0;
      const lastReps = parseInt(lastSet.reps) || 0;
      const lastRPE = parseFloat(lastSet.rpe) || 0;

      return {
        ...exercise,
        sets: [
          ...exercise.sets,
          {
            weight: (isWarmup ? Math.round(lastWeight * 0.6) : lastWeight).toString(),
            reps: (isWarmup ? 12 : lastReps).toString(),
            rpe: (isWarmup ? 4 : lastRPE).toString(),
          },
        ],
      };
    }));
  }, []);

  const copyLastSet = useCallback((exIndex: number) => {
    setExercises(currentExercises => currentExercises.map((exercise, index) => {
      if (index !== exIndex) return exercise;

      const lastSet = exercise.sets[exercise.sets.length - 1];
      return {
        ...exercise,
        sets: [...exercise.sets, { ...lastSet }],
      };
    }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('input[inputmode]')) as HTMLInputElement[];
      const target = e.target as HTMLInputElement;
      const currentIndex = inputs.indexOf(target);
      if (currentIndex > -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
        inputs[currentIndex + 1].select();
      }
    }
  }, []);

  const updateSet = useCallback((exIndex: number, setIndex: number, field: keyof WorkoutSetUI, value: string) => {
    // Permit intermediate characters like a single decimal point or empty string
    const sanitized = value.replace(/[^0-9.]/g, '');
    if (sanitized.split('.').length > 2) return; // Only one decimal point

    setExercises(currentExercises => {
      return currentExercises.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== exIndex) return exercise;

        return {
          ...exercise,
          sets: exercise.sets.map((set, currentSetIndex) => (
            currentSetIndex === setIndex
              ? { ...set, [field]: sanitized }
              : set
          )),
        };
      });
    });
  }, []);

  const removeSet = useCallback((exIndex: number, setIndex: number) => {
    setExercises(currentExercises => currentExercises.map((exercise, index) => {
      if (index !== exIndex) return exercise;

      const nextSets = exercise.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex);
      return {
        ...exercise,
        sets: nextSets.length > 0 ? nextSets : [{ weight: '0', reps: '0', rpe: '7' }],
      };
    }));
  }, []);

  const handleSetAsGlobalWeek = useCallback(async () => {
    await updateUserSettings({ currentProgramWeek: programWeek });
    alert(`Week ${programWeek} is now your active program cycle.`);
  }, [programWeek]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const checkInValidation = validateCheckIn(preSessionCheckIn);
    if (!checkInValidation.valid) {
      alert(checkInValidation.errors[0]);
      return;
    }

    const debriefValidation = validateDebrief(postSessionDebrief);
    if (!debriefValidation.valid) {
      alert(debriefValidation.errors[0]);
      return;
    }

    const exercisesForSaving: ExerciseSession[] = exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps) || 0,
        rpe: parseFloat(s.rpe) || 0
      }))
    }));

    const processedExercises = normalizeExercisesForSave(exercisesForSaving);

    if (processedExercises.length === 0) {
      alert('Add at least one exercise with sets logged.');
      return;
    }

    const exerciseValidation = validateExercisesForSave(processedExercises);
    if (!exerciseValidation.valid) {
      alert(exerciseValidation.errors[0]);
      return;
    }

    setIsSaving(true);
    const normalizedCheckIn = ensureDefaultCheckIn(preSessionCheckIn);
    const session: Session = buildSession({
      exercises: processedExercises,
      preSessionCheckIn: normalizedCheckIn,
      postSessionDebrief,
      notes,
      programWeek,
    });

    try {
      await saveWorkoutSession(session);
      clearWorkoutDraft();
      initialDraftRef.current = null;
      setDraftSavedAt(null);
      setIsDraftSaving(false);
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/history'), 1500);
    } catch {
      alert('Failed to save session.');
      setIsSaving(false);
    }
  }, [exercises, isSaving, navigate, notes, postSessionDebrief, preSessionCheckIn, programWeek]);

  const handlePickExercise = useCallback((index: number) => {
    setShowPicker(index);
  }, []);

  const handleAddMovement = useCallback(() => {
    setShowPicker(-1);
  }, []);

  const handleAddWarmupSet = useCallback((index: number) => {
    addSet(index, true);
  }, [addSet]);

  const handleAddWorkSet = useCallback((index: number) => {
    addSet(index);
  }, [addSet]);

  const handleProgramWeekDecrement = useCallback(() => {
    setProgramWeek(currentWeek => Math.max(1, currentWeek - 1));
  }, []);

  const handleProgramWeekIncrement = useCallback(() => {
    setProgramWeek(currentWeek => currentWeek + 1);
  }, []);

  const handleClosePicker = useCallback(() => {
    setShowPicker(null);
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-32">
      <LogSessionHeader hasDraft={Boolean(localStorage.getItem(WORKOUT_DRAFT_KEY))} onClear={clearWorkout} />

      {showSuccess && <SaveSuccessBanner />}
      {!showSuccess && (
        <DraftStatusBanner
          restoredAtLabel={restoredDraftAtLabel}
          savedAtLabel={draftSavedAtLabel}
          isSaving={isDraftSaving}
        />
      )}

      <CoachCheckInSection checkIn={preSessionCheckIn} onChange={setPreSessionCheckIn} />
      <CoachPlanSummarySection
        headline={coachPlanSummary.headline}
        summary={coachPlanSummary.summary}
        bullets={coachPlanSummary.bullets}
        note={location.state?.note as string | undefined}
        movementCount={trackedMovementCount}
        readySuggestionCount={readySuggestionCount}
      />

      <ProgramWeekSection
        programWeek={programWeek}
        onDecrement={handleProgramWeekDecrement}
        onIncrement={handleProgramWeekIncrement}
        onSync={handleSetAsGlobalWeek}
      />

      <div className="space-y-8">
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {exercises.map((ex, exIndex) => {
              const suggestion = suggestions[normalizeExerciseName(ex.exerciseName)];
              return (
                <ExerciseCard
                  key={`ex-${exIndex}`}
                  exercise={ex}
                  exerciseIndex={exIndex}
                  unit={unit}
                  suggestion={suggestion}
                  onPickExercise={handlePickExercise}
                  onRemoveExercise={removeExercise}
                  onKeyDown={handleKeyDown}
                  onUpdateSet={updateSet}
                  onRemoveSet={removeSet}
                  onAddWarmupSet={handleAddWarmupSet}
                  onAddWorkSet={handleAddWorkSet}
                  onCopyLastSet={copyLastSet}
                />
              );
            })}
          </AnimatePresence>
        </LayoutGroup>

        {exercises.length === 0 && <EmptyExerciseState />}

        <AddMovementButton onClick={handleAddMovement} />
      </div>

      <SessionWrapUpSection
        debrief={postSessionDebrief}
        notes={notes}
        onDebriefChange={setPostSessionDebrief}
        onNotesChange={setNotes}
      />

      <SaveSessionButton isSaving={isSaving} onSave={handleSave} />

      <ExercisePickerModal isOpen={showPicker !== null} onClose={handleClosePicker} onSelect={handleExerciseSelect} />
    </div>
  );
};

export default LogSession;
