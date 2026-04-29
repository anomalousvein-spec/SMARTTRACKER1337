import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  Flame,
  Gauge,
  Layers3,
  Play,
  Plus,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { m, type Variants } from 'framer-motion';
import { toTitleCase } from '../utils/formatters';
import type { TrainingSession } from '../db/models';
import { useDashboardData } from '../features/dashboard/useDashboardData';
import type { ExerciseSuggestion } from '../features/dashboard/types';
import EmptyStateCard from './EmptyStateCard';

const DASHBOARD_SUGGESTIONS_VISIBILITY_KEY = 'dashboard_hide_target_exercises';

function formatVolume(volume: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(volume);
}

function readHiddenSuggestionsPreference() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DASHBOARD_SUGGESTIONS_VISIBILITY_KEY) === 'true';
}

const Dashboard: React.FC = () => {
  const { suggestions, coachFocus, trainingSessions, globalWeeklyData, globalInsight, loading, streak, userLevel, unit } = useDashboardData();
  const navigate = useNavigate();
  const [hideSuggestionsSection, setHideSuggestionsSection] = useState(readHiddenSuggestionsPreference);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const syncPreference = () => {
      setHideSuggestionsSection(readHiddenSuggestionsPreference());
    };

    window.addEventListener('focus', syncPreference);
    window.addEventListener('storage', syncPreference);

    return () => {
      window.removeEventListener('focus', syncPreference);
      window.removeEventListener('storage', syncPreference);
    };
  }, []);

  const plateauCount = suggestions.filter((suggestion) => suggestion.plateauFlag).length;
  const latestWeek = globalWeeklyData[globalWeeklyData.length - 1];
  const previousWeek = globalWeeklyData[globalWeeklyData.length - 2];
  const weeklyVolume = latestWeek?.totalVolume ?? 0;
  const weeklyTrend = latestWeek && previousWeek
    ? latestWeek.totalVolume > previousWeek.totalVolume
      ? 'Up'
      : latestWeek.totalVolume < previousWeek.totalVolume
        ? 'Down'
        : 'Flat'
    : 'Building';
  const handleStartWorkout = (suggestion: ExerciseSuggestion) => {
    void navigate('/log', {
      state: {
        prefill: {
          exerciseName: suggestion.exerciseName,
          suggestedWeight: suggestion.suggestedWeight,
          suggestedReps: suggestion.suggestedReps,
          suggestedSets: suggestion.suggestedSets,
        },
      },
    });
  };

  const handleStartSplit = (split: TrainingSession) => {
    void navigate('/log', {
      state: {
        prefill: split.exercises.map((exercise) => ({
          exerciseName: exercise.exerciseName,
          suggestedWeight: 0,
          suggestedReps: exercise.targetRepsRange[0],
          suggestedSets: exercise.targetSets,
        })),
      },
    });
  };

  const handleCoachFocusAction = () => {
    if (coachFocus.ctaTarget === 'exercise' && coachFocus.exerciseName) {
      void navigate(`/exercise/${encodeURIComponent(coachFocus.exerciseName)}`);
      return;
    }

    if (coachFocus.ctaTarget === 'analysis') {
      void navigate('/analysis');
      return;
    }

    if (coachFocus.exerciseName) {
      const matchingSuggestion = suggestions.find((suggestion) => suggestion.exerciseName === coachFocus.exerciseName);
      if (matchingSuggestion) {
        handleStartWorkout(matchingSuggestion);
        return;
      }
    }

    void navigate('/log');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-label="Loading dashboard">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600/20 border-t-blue-600"></div>
        <p className="animate-pulse text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">Syncing Performance...</p>
      </div>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-6"
    >
      <m.div variants={itemVariants} className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-[1.9rem] font-black leading-none tracking-tight text-theme-text-primary">Today&apos;s Training</h2>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Progression Coach Dashboard</p>
        </div>
        <Link
          to="/log"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-theme-accent to-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl active:scale-90"
          aria-label="Log new workout"
        >
          <Plus size={24} />
        </Link>
      </m.div>

      <m.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-theme-bg-tertiary p-5 text-white"
        role="complementary"
        aria-label="Coach focus and recommendations"
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-400/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true" />

        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-4">
            <div className="rounded-xl bg-blue-500/10 p-2" aria-hidden="true">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Coach Focus</h3>
              <p className={`mt-1 text-[11px] font-black uppercase tracking-[0.16em] ${coachFocus.accent}`}>{coachFocus.label}</p>
            </div>
          </div>

          <div aria-live="polite">
            <p className="text-2xl font-black leading-tight tracking-tight text-white">{coachFocus.headline}</p>
            <p className="mt-3 text-base font-bold leading-relaxed text-theme-text-secondary">{coachFocus.reason}</p>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-100">{coachFocus.action}</p>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-orange-300">
                <Flame size={14} />
                <p className="text-[9px] font-black uppercase tracking-[0.18em]">Streak</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black leading-none">{streak}</p>
                <p className="mt-0.5 text-[10px] font-bold text-theme-text-secondary">days active</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-300">
                <Gauge size={14} />
                <p className="text-[9px] font-black uppercase tracking-[0.18em]">Volume</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black leading-none">{formatVolume(weeklyVolume)}</p>
                <p className="mt-0.5 text-[10px] font-bold text-theme-text-secondary">{weeklyTrend} this week</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-blue-200">
                <Layers3 size={14} />
                <p className="text-[9px] font-black uppercase tracking-[0.18em]">Focus</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black leading-none">{suggestions.length}</p>
                <p className="mt-0.5 text-[10px] font-bold text-theme-text-secondary">target movements</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className={`h-2 w-2 animate-pulse rounded-full ${coachFocus.dot}`} aria-hidden="true"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-200">Coaching Signal Active</span>
            {coachFocus.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-secondary"
              >
                {tag}
              </span>
            ))}
            {plateauCount > 0 && (
              <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-300">
                {plateauCount} Plateau Alert{plateauCount > 1 ? 's' : ''}
              </span>
            )}
            {trainingSessions.length > 0 && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-secondary">
                {trainingSessions.length} Quick Start Split{trainingSessions.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleCoachFocusAction}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-white to-blue-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-900 shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <Play size={14} fill="currentColor" />
              {coachFocus.ctaLabel}
            </button>
          </div>
        </div>
      </m.section>

      <section aria-label="Volume statistics">
        <m.div variants={itemVariants} className="space-y-2">
          <div className="card flex items-center justify-between rounded-xl border border-white/5 bg-theme-bg-secondary px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-500" aria-hidden="true">
                <Flame size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Streak</p>
                <p className="text-lg font-black leading-none text-theme-text-primary">{streak} Days</p>
              </div>
            </div>
          </div>
          <div className="card flex items-center justify-between rounded-xl border border-white/5 bg-theme-bg-secondary px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500" aria-hidden="true">
                <Trophy size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Level</p>
                <p className="text-lg font-black leading-none text-theme-text-primary">{userLevel}</p>
              </div>
            </div>
          </div>
        </m.div>
      </section>

      {globalWeeklyData.length >= 2 && (
        <m.div
          variants={itemVariants}
          className="card rounded-2xl border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent p-5 dark:from-emerald-900/10 dark:to-transparent"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-600 p-2.5 text-white" aria-hidden="true">
              <Activity size={16} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-500">Global Progress Insight</p>
              <p className="mt-2 text-sm font-bold italic leading-relaxed text-theme-text-secondary">
                &quot;{globalInsight}&quot;
              </p>
            </div>
          </div>
        </m.div>
      )}

      {trainingSessions.length > 0 && (
        <m.div variants={itemVariants} className="space-y-3">
          <h3 className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Quick Start Splits</h3>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-hide" role="region" aria-label="Quick start workout splits">
            {trainingSessions.map((split) => (
              <button
                key={split.id}
                onClick={() => handleStartSplit(split)}
                className="group flex min-w-[168px] flex-shrink-0 flex-col items-start gap-3 rounded-2xl border border-white/5 bg-theme-bg-secondary p-4 transition-all hover:border-blue-500/20 active:scale-95"
                aria-label={`Start ${split.name} workout with ${split.exercises.length} exercises`}
              >
                <div className="rounded-2xl bg-blue-500/10 p-3 text-theme-accent transition-colors group-hover:bg-theme-accent group-hover:text-white" aria-hidden="true">
                  <Play size={16} fill="currentColor" />
                </div>
                <div className="text-left">
                  <p className="line-clamp-2 text-base font-black leading-tight text-theme-text-primary">{split.name}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">{split.exercises.length} Exercises</p>
                </div>
              </button>
            ))}
          </div>
        </m.div>
      )}

      {!hideSuggestionsSection && (
      <m.section variants={itemVariants} className="space-y-4" aria-label="Target exercises">
        <button
          onClick={() => setShowSuggestions((current) => !current)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/5 bg-theme-bg-secondary px-4 py-4 text-left transition-all hover:border-blue-500/20 active:scale-[0.99]"
          aria-expanded={showSuggestions}
        >
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Target Exercises</h3>
            <p className="mt-1 text-xs font-bold text-theme-text-tertiary">
              {suggestions.length > 0
                ? `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} available when you want them`
                : 'No suggestions available yet'}
            </p>
          </div>
          <ChevronDown
            size={18}
            className={`shrink-0 text-theme-text-tertiary transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
          />
        </button>

        {showSuggestions && (
          suggestions.length === 0 ? (
            <EmptyStateCard
              icon={Sparkles}
              eyebrow="Coach Queue"
              title="No Targets Yet"
              description="Start your first session and this board will begin surfacing smart targets, momentum cues, and next-lift recommendations."
              actionLabel="Start Logging"
              onAction={() => navigate('/log')}
              compact
            />
          ) : (
            <section aria-label="Exercise suggestions" className="space-y-2">
              {suggestions.map((suggestion) => (
                <m.div
                  key={suggestion.exerciseName}
                  variants={itemVariants}
                  className="group rounded-2xl border border-white/5 bg-theme-bg-secondary p-4 transition-all active:scale-[0.99]"
                  role="article"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-black tracking-tight text-theme-text-primary">{toTitleCase(suggestion.exerciseName)}</h4>
                      <Link
                        to={`/exercise/${encodeURIComponent(suggestion.exerciseName)}`}
                        className="mt-1 block text-[11px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary transition-colors hover:text-blue-500"
                      >
                        History & Analytics
                      </Link>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {suggestion.plateauFlag && (
                        <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-500">
                          <AlertTriangle size={11} /> Plateau
                        </span>
                      )}
                      {suggestion.weeklyHistory.length >= 2 && (
                        <div className="flex h-6 items-end gap-0.5">
                          {suggestion.weeklyHistory.slice(-5).map((week, index) => {
                            const maxVolume = Math.max(...suggestion.weeklyHistory.map((entry) => entry.totalVolume));
                            const height = maxVolume > 0 ? (week.totalVolume / maxVolume) * 100 : 0;
                            return (
                              <div
                                key={`${suggestion.exerciseName}-${index}`}
                                className={`w-1 rounded-t-sm ${index === suggestion.weeklyHistory.slice(-5).length - 1 ? 'bg-blue-500' : 'bg-white/10'}`}
                                style={{ height: `${Math.max(20, height)}%` }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Suggested Target</p>
                      <p className="text-base font-black leading-snug text-theme-text-primary">
                        {suggestion.suggestedWeight}{unit} <span className="mx-1 text-theme-text-tertiary">x</span> {suggestion.suggestedSets} <span className="mx-1 text-theme-text-tertiary">x</span> {suggestion.suggestedReps}
                      </p>
                      <p className="mt-2 max-w-md text-xs font-medium leading-relaxed text-theme-text-tertiary">
                        {suggestion.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => handleStartWorkout(suggestion)}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-theme-accent px-6 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-blue-600 active:scale-95 sm:w-auto"
                    >
                      <Play size={14} fill="currentColor" /> Start
                    </button>
                  </div>
                </m.div>
              ))}
            </section>
          )
        )}
      </m.section>
      )}

    </m.div>
  );
};

export default Dashboard;
