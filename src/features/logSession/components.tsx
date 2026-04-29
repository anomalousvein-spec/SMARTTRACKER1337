import React, { useState } from 'react';
import { Trash2, Plus, Save, Info, CheckCircle2, Copy, XCircle, Search, Zap, Dumbbell, Calendar, Minus, Target, CloudCheck, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import type { Exercise, PostSessionDebrief, PreSessionCheckIn } from '../../db/models';
import { calculateE1RM, getVolumeStatus, type Suggestion } from '../../progression/engine';
import ExerciseLibrary from '../../components/ExerciseLibrary';
import { cn } from '../../utils/ui';
import type { ExerciseSessionUI, WorkoutSetUI } from './types';

export function LogSessionHeader({
  hasDraft,
  onClear,
}: {
  hasDraft: boolean;
  onClear: () => void;
}) {
  return (
    <header className="flex justify-between items-end gap-3 px-1">
      <div>
        <h2 className="text-[1.9rem] font-black tracking-tight leading-none text-theme-text-primary">Log Session</h2>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Live Training Entry</p>
          {hasDraft && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-500">
              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div> Draft
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onClear}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-theme-bg-secondary text-theme-text-tertiary transition-all hover:rotate-90 hover:text-red-500 active:scale-90"
        >
          <XCircle size={20} />
        </button>
        <div className="text-right">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</p>
          <p className="text-sm font-black uppercase text-theme-text-secondary">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>
    </header>
  );
}

export function SaveSuccessBanner() {
  return (
    <m.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed inset-x-4 top-20 z-50 pointer-events-none"
    >
      <div className="mx-auto flex max-w-md items-center gap-5 rounded-2xl border border-emerald-400/30 bg-emerald-500 p-5 text-white backdrop-blur-sm">
        <div className="rounded-2xl bg-white/20 p-2.5 shadow-inner"><CheckCircle2 size={24} /></div>
        <div>
          <p className="text-lg font-black tracking-tight">Session Archived</p>
          <p className="text-xs font-bold uppercase tracking-widest opacity-90">Routing to History...</p>
        </div>
      </div>
    </m.div>
  );
}

export function DraftStatusBanner({
  restoredAtLabel,
  savedAtLabel,
  isSaving,
}: {
  restoredAtLabel?: string | null;
  savedAtLabel?: string | null;
  isSaving: boolean;
}) {
  if (!restoredAtLabel && !savedAtLabel && !isSaving) {
    return null;
  }

  return (
    <section className="glass rounded-2xl border border-white/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
          {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <CloudCheck size={18} />}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-theme-accent dark:text-blue-400">
            {isSaving ? 'Saving Local Draft' : 'Local Draft Active'}
          </p>
          {restoredAtLabel && (
            <p className="mt-1 text-sm font-bold text-theme-text-primary">
              Recovered your previous session draft from {restoredAtLabel}.
            </p>
          )}
          <p className="mt-1 text-xs font-medium leading-relaxed text-theme-text-tertiary">
            {isSaving
              ? 'Recent changes are being stored locally so you can safely come back to this session.'
              : savedAtLabel
                ? `Latest local save: ${savedAtLabel}.`
                : 'Changes in this session will auto-save locally as you log.'}
          </p>
        </div>
      </div>
    </section>
  );
}

export function CoachCheckInSection({
  checkIn,
  onChange,
}: {
  checkIn: PreSessionCheckIn;
  onChange: (value: PreSessionCheckIn) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <section className="glass rounded-2xl border border-white/10 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex w-full items-center justify-between gap-3 px-1"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-500">
            <Zap size={16} />
          </div>
          <div className="text-left">
            <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">Coach Check-In</h3>
            <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Guide today&apos;s plan before you lift</p>
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-theme-text-tertiary transition-all hover:bg-theme-bg-tertiary active:scale-90">
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-4 pt-5">
              <CoachChoiceGroup
                label="Recovery"
                value={checkIn.recovery}
                options={[
                  { value: 'poor', label: 'Poor', description: 'Cap progression and protect recovery.' },
                  { value: 'okay', label: 'Okay', description: 'Train normally with standard progression.' },
                  { value: 'good', label: 'Good', description: 'Allow stronger progression if execution supports it.' },
                ]}
                onChange={(value) => onChange({ ...checkIn, recovery: value as PreSessionCheckIn['recovery'] })}
              />
              <CoachChoiceGroup
                label="Energy"
                value={checkIn.energy}
                options={[
                  { value: 'low', label: 'Low', description: 'Bias the plan toward controlled execution.' },
                  { value: 'medium', label: 'Medium', description: 'Run the standard session target.' },
                  { value: 'high', label: 'High', description: 'Good candidate for a stronger push.' },
                ]}
                onChange={(value) => onChange({ ...checkIn, energy: value as PreSessionCheckIn['energy'] })}
              />
              <CoachChoiceGroup
                label="Body Status"
                value={checkIn.bodyStatus}
                options={[
                  { value: 'fresh', label: 'Fresh', description: 'Minimal soreness and no meaningful discomfort.' },
                  { value: 'normal_soreness', label: 'Normal', description: 'Expected training soreness is present.' },
                  { value: 'pain_or_strain', label: 'Pain', description: 'Something feels irritated or strained.' },
                ]}
                onChange={(value) => onChange({ ...checkIn, bodyStatus: value as PreSessionCheckIn['bodyStatus'] })}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CoachChoiceGroup
                  label="Goal Today"
                  value={checkIn.goal}
                  options={[
                    { value: 'push', label: 'Push', description: 'If recovery supports it, lean into progression.' },
                    { value: 'standard', label: 'Standard', description: 'Run the normal productive target.' },
                    { value: 'light', label: 'Light', description: 'Bias toward maintenance and recovery.' },
                  ]}
                  onChange={(value) => onChange({ ...checkIn, goal: value as PreSessionCheckIn['goal'] })}
                />
                <CoachChoiceGroup
                  label="Time Window"
                  value={checkIn.timeAvailable}
                  options={[
                    { value: 'short', label: 'Short', description: 'Favor minimum effective work.' },
                    { value: 'normal', label: 'Normal', description: 'Run the intended session length.' },
                    { value: 'long', label: 'Long', description: 'Room for full work and accessories.' },
                  ]}
                  onChange={(value) => onChange({ ...checkIn, timeAvailable: value as PreSessionCheckIn['timeAvailable'] })}
                />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function ProgramWeekSection({
  programWeek,
  onDecrement,
  onIncrement,
  onSync,
}: {
  programWeek: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onSync: () => void;
}) {
  return (
    <section className="glass flex flex-col gap-5 rounded-2xl border border-white/10 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-theme-accent text-white">
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="mb-1 text-[11px] font-black uppercase tracking-[0.14em] text-theme-accent dark:text-blue-400">Program Progression</h3>
            <p className="text-xl font-black leading-none text-theme-text-primary">Week {programWeek}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/5 bg-theme-bg-tertiary p-1.5">
          <button onClick={onDecrement} className="flex h-10 w-10 items-center justify-center rounded-xl text-theme-text-tertiary transition-all hover:bg-theme-bg-tertiary active:scale-90">
            <Minus size={16} />
          </button>
          <div className="w-10 text-center text-base font-black text-theme-text-primary">{programWeek}</div>
          <button onClick={onIncrement} className="flex h-10 w-10 items-center justify-center rounded-xl text-theme-text-tertiary transition-all hover:bg-theme-bg-tertiary active:scale-90">
            <Plus size={16} />
          </button>
        </div>
      </div>
      <button
        onClick={onSync}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary shadow-inner transition-all hover:border-blue-500/20 hover:text-blue-400 active:scale-[0.98]"
      >
        <Target size={14} /> Sync Global Program Cycle
      </button>
    </section>
  );
}

export function CoachPlanSummarySection({
  headline,
  summary,
  bullets,
  note,
  movementCount,
  readySuggestionCount,
}: {
  headline: string;
  summary: string;
  bullets: string[];
  note?: string;
  movementCount: number;
  readySuggestionCount: number;
}) {
  return (
    <section className="glass space-y-5 rounded-2xl border border-white/10 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
          <Info size={18} />
        </div>
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-theme-accent dark:text-blue-400">Why Today Changed</h3>
          <p className="mt-2 text-lg font-black leading-tight text-theme-text-primary">{headline}</p>
          <p className="mt-2 text-sm font-bold leading-relaxed text-theme-text-tertiary">{summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-theme-bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">
          {movementCount} Movement{movementCount === 1 ? '' : 's'} In Session
        </span>
        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-theme-accent dark:text-blue-300">
          {readySuggestionCount > 0 ? `${readySuggestionCount} Live Coach Signal${readySuggestionCount === 1 ? '' : 's'}` : 'Waiting For Lift Signals'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {bullets.map((bullet, index) => (
          <div
            key={`${index}-${bullet}`}
            className="flex items-start gap-2 rounded-2xl border border-white/5 bg-theme-bg-secondary px-4 py-3"
          >
            <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
            <p className="text-xs font-bold leading-relaxed text-theme-text-secondary">{bullet}</p>
          </div>
        ))}
      </div>

      {note && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Coach Note Carried In</p>
          <p className="mt-2 text-xs font-bold leading-relaxed text-theme-text-secondary">{note}</p>
        </div>
      )}
    </section>
  );
}

export const ExerciseCard = React.memo(function ExerciseCard({
  exercise,
  exerciseIndex,
  unit,
  suggestion,
  onPickExercise,
  onRemoveExercise,
  onKeyDown,
  onUpdateSet,
  onRemoveSet,
  onAddWarmupSet,
  onAddWorkSet,
  onCopyLastSet,
}: {
  exercise: ExerciseSessionUI;
  exerciseIndex: number;
  unit: string;
  suggestion?: Suggestion;
  onPickExercise: (index: number) => void;
  onRemoveExercise: (index: number) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: keyof WorkoutSetUI, value: string) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onAddWarmupSet: (exerciseIndex: number) => void;
  onAddWorkSet: (exerciseIndex: number) => void;
  onCopyLastSet: (exerciseIndex: number) => void;
}) {
  const currentVolumeStatus = suggestion
    ? getVolumeStatus(suggestion.currentWeeklySets, suggestion.caps)
    : null;
  const projectedVolumeStatus = suggestion
    ? getVolumeStatus(suggestion.projectedWeeklySets, suggestion.caps)
    : null;

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-3"
    >
      {suggestion && (
        <m.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-4"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl" />
          <div className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-theme-accent dark:text-blue-400">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            {suggestion.primaryMuscle.toUpperCase()} Weekly Volume
          </div>
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black leading-none text-theme-accent dark:text-blue-400">{suggestion.currentWeeklySets}</span>
              <span className="pb-0.5 text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary dark:text-theme-text-tertiary">current / {suggestion.caps.mav} MAV | {suggestion.caps.mrv} MRV</span>
            </div>
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-theme-accent dark:text-blue-400">
              projected {suggestion.projectedWeeklySets}
            </span>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
              Current {currentVolumeStatus}
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              Projected {projectedVolumeStatus}
            </span>
          </div>
          {suggestion.suggestedRPE !== undefined && (
            <div className="mb-3 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
              Target RPE {suggestion.suggestedRPE.toFixed(1)}
            </div>
          )}
          <div className="rounded-xl border border-white/20 bg-white/40 p-2.5 dark:bg-black/20">
            <p className="text-[11px] font-bold italic leading-relaxed text-theme-text-tertiary dark:text-theme-text-tertiary">"{suggestion.reason}"</p>
          </div>
        </m.div>
      )}

      <div className="group relative space-y-4 rounded-2xl border border-white/5 bg-theme-bg-secondary p-4">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => onPickExercise(exerciseIndex)} className="flex-grow text-left group/btn">
            <h3 className="text-lg font-black capitalize leading-tight tracking-tight text-theme-text-primary transition-colors group-hover/btn:text-blue-500">
              {exercise.exerciseName || 'Choose Movement'}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-theme-text-tertiary">
              <Search size={9} className="text-blue-500" /> Tap to swap exercise
            </p>
          </button>
          <button
            onClick={() => onRemoveExercise(exerciseIndex)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-theme-text-tertiary transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 dark:hover:bg-red-900/10"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-5 gap-2 px-1 text-[8px] font-black uppercase tracking-[0.2em] text-theme-text-tertiary">
            <div className="text-center">Set</div>
            <div className="text-center text-blue-500">Load ({unit})</div>
            <div className="text-center">Reps</div>
            <div className="text-center">RPE</div>
            <div></div>
          </div>
          <AnimatePresence mode="popLayout">
            {exercise.sets.map((set, setIndex) => {
              const weightNum = parseFloat(set.weight) || 0;
              const repsNum = parseInt(set.reps) || 0;
              const isNewBestWeight = suggestion && weightNum > suggestion.allTimeBestWeight;
              const isNewBest1RM = suggestion && calculateE1RM(weightNum, repsNum) > suggestion.allTimeBestE1RM;

              return (
                <m.div
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={`set-${exerciseIndex}-${setIndex}`}
                  className="group/set relative grid grid-cols-5 items-center gap-2"
                >
                  <div className="flex h-10 w-full items-center justify-center rounded-xl bg-theme-bg-tertiary text-[11px] font-black text-theme-text-tertiary shadow-inner dark:text-theme-text-tertiary">
                    {setIndex + 1}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="h-10 w-full rounded-xl border border-white/5 bg-theme-bg-tertiary text-center font-black text-theme-text-primary outline-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                      value={set.weight}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onKeyDown={onKeyDown}
                      onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                    />
                    {isNewBestWeight && (
                      <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 z-10 rounded-md bg-yellow-400 px-1 py-0.5 text-[5px] font-black text-yellow-900">
                        PB
                      </m.div>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="h-10 w-full rounded-xl border border-white/5 bg-theme-bg-tertiary text-center font-black text-theme-text-primary outline-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                      value={set.reps}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onKeyDown={onKeyDown}
                      onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                    />
                    {isNewBest1RM && !isNewBestWeight && (
                      <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 z-10 rounded-md bg-blue-400 px-1 py-0.5 text-[5px] font-black text-white">
                        PB
                      </m.div>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="h-10 w-full rounded-xl border border-white/5 bg-theme-bg-tertiary text-center font-black text-theme-text-primary outline-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                      value={set.rpe}
                      placeholder="8"
                      onFocus={(e) => e.target.select()}
                      onKeyDown={onKeyDown}
                      onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'rpe', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => onRemoveSet(exerciseIndex, setIndex)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-all active:scale-90"
                      aria-label="Delete set"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>

          <div className="grid grid-cols-5 gap-2 pt-1">
            <button onClick={() => onAddWarmupSet(exerciseIndex)} className="col-span-1 flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-theme-bg-tertiary/50 py-1.5 text-[7px] font-black uppercase tracking-widest text-theme-text-tertiary transition-all hover:text-blue-500 active:scale-95"><Plus size={9} /> Warmup</button>
            <button onClick={() => onAddWorkSet(exerciseIndex)} className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-theme-bg-tertiary/50 py-1.5 text-[7px] font-black uppercase tracking-widest text-theme-text-tertiary transition-all hover:text-blue-500 active:scale-95"><Plus size={9} /> Work Set</button>
            <button onClick={() => onCopyLastSet(exerciseIndex)} className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-theme-bg-tertiary/50 py-1.5 text-[7px] font-black uppercase tracking-widest text-theme-text-tertiary transition-all hover:text-blue-500 active:scale-95"><Copy size={9} /> Copy</button>
          </div>
        </div>
      </div>
    </m.div>
  );
});

export function EmptyExerciseState() {
  return (
    <m.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass space-y-6 rounded-2xl border border-white/5 py-24 text-center shadow-inner">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
        <Dumbbell size={40} />
      </div>
      <div className="space-y-2">
        <p className="text-xl font-black tracking-tight text-theme-text-primary">Fresh Session</p>
        <p className="px-16 text-xs font-medium leading-relaxed text-theme-text-tertiary">Select your first foundational movement to begin your progression journey.</p>
      </div>
    </m.div>
  );
}

export function AddMovementButton({ onClick }: { onClick: () => void }) {
  return (
    <m.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex w-full items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-theme-bg-secondary py-5 font-black text-theme-text-tertiary transition-all hover:border-blue-500/40 hover:bg-theme-accent/10"
    >
      <Plus size={28} className="transition-transform duration-500 group-hover:rotate-90" />
      <span className="text-sm uppercase tracking-[0.25em]">Add Movement</span>
    </m.button>
  );
}

export function SessionWrapUpSection({
  debrief,
  notes,
  onDebriefChange,
  onNotesChange,
}: {
  debrief: PostSessionDebrief;
  notes: string;
  onDebriefChange: (value: PostSessionDebrief) => void;
  onNotesChange: (value: string) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <section className="glass rounded-2xl border border-white/10 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex w-full items-center justify-between gap-3 px-1"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
            <Info size={16} />
          </div>
          <div className="text-left">
            <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-accent dark:text-blue-400">Coach Debrief</h3>
            <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">How It Played Out</p>
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-theme-text-tertiary transition-all hover:bg-theme-bg-tertiary active:scale-90">
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-5">
              <CoachChoiceGroupCompact
                label="How It Played Out"
                value={debrief.sessionDifficulty}
                options={[
                  { value: 'undershot', label: 'Undershot', description: 'You left a lot in reserve.' },
                  { value: 'on_plan', label: 'On Plan', description: 'The session matched the intended difficulty.' },
                  { value: 'pushed_hard', label: 'Pushed', description: 'The session demanded a lot from you.' },
                ]}
                onChange={(value) => onDebriefChange({ ...debrief, sessionDifficulty: value as PostSessionDebrief['sessionDifficulty'] })}
              />
              <CoachChoiceGroupCompact
                label="Plan Fit"
                value={debrief.planFit}
                options={[
                  { value: 'too_easy', label: 'Too Easy', description: 'The plan can probably progress faster next time.' },
                  { value: 'about_right', label: 'Right', description: 'This matched the day well.' },
                  { value: 'too_much', label: 'Too Much', description: 'The target overshot what was realistic today.' },
                ]}
                onChange={(value) => onDebriefChange({ ...debrief, planFit: value as PostSessionDebrief['planFit'] })}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CoachChoiceGroupCompact
                  label="Body Response"
                  value={debrief.bodyResponse}
                  options={[
                    { value: 'felt_good', label: 'Good', description: 'The session felt productive and stable.' },
                    { value: 'fatigued', label: 'Fatigued', description: 'Fatigue built up more than expected.' },
                    { value: 'pain_or_strain', label: 'Pain', description: 'Something feels irritated or strained.' },
                  ]}
                  onChange={(value) => onDebriefChange({ ...debrief, bodyResponse: value as PostSessionDebrief['bodyResponse'] })}
                />
                <CoachChoiceGroupCompact
                  label="Next Session"
                  value={debrief.confidenceNextTime}
                  options={[
                    { value: 'progress', label: 'Progress', description: 'You feel ready to move this lift forward.' },
                    { value: 'repeat', label: 'Repeat', description: 'Run a similar target again next time.' },
                    { value: 'swap', label: 'Swap', description: 'A variation change may be smarter.' },
                  ]}
                  onChange={(value) => onDebriefChange({ ...debrief, confidenceNextTime: value as PostSessionDebrief['confidenceNextTime'] })}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 px-1 text-[9px] font-black uppercase tracking-[0.3em] text-theme-text-tertiary">
                  <Info size={11} className="text-blue-500" /> Coach Notes
                </label>
                <textarea
                  placeholder="Anything the coach should remember about this session?"
                  className="h-28 w-full resize-none rounded-xl border border-white/5 bg-theme-bg-tertiary p-4 text-xs font-medium text-theme-text-primary shadow-inner outline-none transition-all focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10"
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function CoachChoiceGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; description: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">{label}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-2xl border p-4 text-left transition-all active:scale-[0.98]',
                isActive
                  ? 'border-blue-500/30 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
                  : 'border-white/5 bg-theme-bg-tertiary hover:border-blue-500/15'
              )}
            >
              <p className={cn(
                'text-[11px] font-black uppercase tracking-[0.14em]',
                isActive ? 'text-theme-accent dark:text-blue-400' : 'text-theme-text-primary'
              )}>
                {option.label}
              </p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-theme-text-tertiary">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CoachChoiceGroupCompact({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; description: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="px-1">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">{label}</p>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-xl border p-3 text-left transition-all active:scale-[0.98]',
                isActive
                  ? 'border-blue-500/30 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
                  : 'border-white/5 bg-theme-bg-tertiary hover:border-blue-500/15'
              )}
            >
              <p className={cn(
                'text-[10px] font-black uppercase tracking-[0.14em]',
                isActive ? 'text-theme-accent dark:text-blue-400' : 'text-theme-text-primary'
              )}>
                {option.label}
              </p>
              <p className="mt-1 text-[10px] font-medium leading-relaxed text-theme-text-tertiary">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SaveSessionButton({
  isSaving,
  onSave,
}: {
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-4 z-30 px-1">
      <m.button
        whileTap={{ scale: 0.96 }}
        onClick={onSave}
        disabled={isSaving}
        className={cn(
          'relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl py-5.5 text-base font-black transition-all',
          isSaving
            ? 'cursor-not-allowed bg-gray-200 bg-theme-bg-tertiary text-theme-text-tertiary shadow-none'
            : 'bg-theme-accent text-white hover:-translate-y-1 hover:bg-blue-700'
        )}
      >
        {isSaving ? (
          <m.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="h-6 w-6 rounded-full border-4 border-white/20 border-t-white"
          />
        ) : (
          <>
            <Save size={24} />
            <span className="uppercase tracking-[0.3em]">Save Session To History</span>
          </>
        )}
      </m.button>
    </div>
  );
}

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center overflow-hidden p-0 sm:items-center sm:p-6">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <m.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[3.5rem] border-t border-white/10 bg-theme-bg-primary p-8 sm:rounded-2xl sm:border"
          >
            <div className="mx-auto mb-6 h-2 w-16 shrink-0 rounded-full bg-gray-200 bg-theme-bg-tertiary" />
            <div className="scrollbar-hide flex-grow overflow-y-auto">
              <ExerciseLibrary isPicker onSelect={onSelect} onClose={onClose} />
            </div>
            <div className="shrink-0 pt-6">
              <button
                onClick={onClose}
                className="w-full rounded-2xl border border-white/5 bg-theme-bg-secondary py-4 text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary transition-all hover:text-theme-text-primary"
              >
                Close Picker
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
