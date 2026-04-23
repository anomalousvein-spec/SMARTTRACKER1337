import React from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  Activity,
  ArrowDownRight,
  Brain,
  RotateCcw,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Flame,
  Minus,
  Plus,
  TrendingUp,
  Calendar,
  Gauge,
} from 'lucide-react';
import { m, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toTitleCase } from '../utils/formatters';
import { cn } from '../utils/ui';
import LazyChart from './LazyChart';
import { useAnalysisData } from '../features/analysis/useAnalysisData';
import EmptyStateCard from './EmptyStateCard';
import type { ExerciseCoachState } from '../db/models';
import { resetExerciseCoachState } from '../repositories/coachStateRepository';

function formatMetric(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function getTrendSummary(percentChange?: number) {
  if (percentChange === undefined) {
    return {
      label: 'Baseline',
      tone: 'text-theme-text-tertiary',
      chip: 'border-gray-500/10 bg-gray-500/5 text-theme-text-tertiary',
      Icon: Minus,
    };
  }

  if (percentChange > 0) {
    return {
      label: `Up ${Math.abs(percentChange)}%`,
      tone: 'text-emerald-500',
      chip: 'border-emerald-500/10 bg-emerald-500/5 text-emerald-500',
      Icon: ArrowUpRight,
    };
  }

  if (percentChange < 0) {
    return {
      label: `Down ${Math.abs(percentChange)}%`,
      tone: 'text-red-500',
      chip: 'border-red-500/10 bg-red-500/5 text-red-500',
      Icon: ArrowDownRight,
    };
  }

  return {
    label: 'Flat',
    tone: 'text-theme-text-tertiary',
    chip: 'border-gray-500/10 bg-gray-500/5 text-theme-text-tertiary',
    Icon: Minus,
  };
}

function formatBias(value: number) {
  if (value > 0) return `+${value.toFixed(2)}`;
  return value.toFixed(2);
}

function formatCoachMemoryRecency(iso: string) {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return 'Not learned yet';
  }

  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;

  return `Updated ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function getCoachMemoryLabel(state: ExerciseCoachState) {
  if (state.painPenalty >= 1.5) {
    return {
      label: 'Pain Watch',
      tone: 'text-amber-600 dark:text-amber-300',
      chip: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300',
      summary: 'This lift is being protected because pain or strain has been flagged repeatedly.',
    };
  }

  if (state.swapPreference >= 1.25) {
    return {
      label: 'Swap Lean',
      tone: 'text-orange-500',
      chip: 'border-orange-500/20 bg-orange-500/10 text-orange-500',
      summary: 'The coach is leaning toward a variation change if this lift keeps stalling.',
    };
  }

  if (state.toleranceBias <= -0.75) {
    return {
      label: 'Low Tolerance',
      tone: 'text-yellow-600 dark:text-yellow-300',
      chip: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300',
      summary: 'This lift has been less well-tolerated lately, so volume pressure is being softened.',
    };
  }

  if (state.confidenceBias >= 0.5) {
    return {
      label: 'High Confidence',
      tone: 'text-emerald-600 dark:text-emerald-300',
      chip: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
      summary: 'The coach has built confidence that this lift can handle faster progression.',
    };
  }

  if (state.confidenceBias <= -0.5) {
    return {
      label: 'Cautious',
      tone: 'text-sky-600 dark:text-sky-300',
      chip: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300',
      summary: 'The coach wants a little more proof before pushing this lift harder.',
    };
  }

  return {
    label: 'Neutral',
    tone: 'text-theme-text-tertiary',
    chip: 'border-white/10 bg-white/5 text-theme-text-tertiary',
    summary: 'This lift is still close to baseline and has not built a strong coaching bias yet.',
  };
}

const Analysis: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading,
    filterEx,
    setFilterEx,
    currentWeek,
    unit,
    exerciseNames,
    analysisData,
    chartData,
    chartOptions,
    insight,
    handleWeekChange,
    coachStates,
    globalCoachState,
    refreshCoachMemory,
  } = useAnalysisData();
  const [resettingExercise, setResettingExercise] = React.useState<string | null>(null);

  if (loading) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-label="Loading analysis">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600/20 border-t-blue-600"></div>
      <p className="animate-pulse text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Running Bio-Analytics...</p>
    </div>
  );

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const latestWeek = analysisData[analysisData.length - 1];
  const displayedWeek = analysisData.find((entry) => entry.week === currentWeek) ?? latestWeek;
  const trend = getTrendSummary(displayedWeek?.percentChange);
  const TrendIcon = trend.Icon;
  const selectedLabel = filterEx === 'All' ? 'All Movements' : filterEx;
  const recoveryTrendLabel = globalCoachState.recoveryTrend >= 0.5
    ? 'Recovery trending up'
    : globalCoachState.recoveryTrend <= -0.5
      ? 'Recovery trending down'
      : 'Recovery stable';
  const fatigueTrendLabel = globalCoachState.fatigueTrend <= -0.5
    ? 'Fatigue accumulating'
    : globalCoachState.fatigueTrend >= 0.5
      ? 'Fatigue manageable'
      : 'Fatigue stable';
  const globalCoachRecency = formatCoachMemoryRecency(globalCoachState.lastUpdated);

  const handleResetCoachMemory = async (exerciseName: string) => {
    const shouldReset = confirm(`Reset learned coach memory for ${toTitleCase(exerciseName)}?`);
    if (!shouldReset) return;

    setResettingExercise(exerciseName);
    try {
      await resetExerciseCoachState(exerciseName);
      await refreshCoachMemory();
    } finally {
      setResettingExercise(null);
    }
  };

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-2xl space-y-7 pb-24"
    >
      <m.div variants={itemVariants} className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-[1.9rem] font-black leading-none tracking-tight text-theme-text-primary">Progression Matrix</h2>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Volume and Load Trends</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-theme-bg-secondary p-1.5">
          <button onClick={() => handleWeekChange(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl text-theme-text-tertiary transition-all hover:bg-blue-50 hover:text-blue-500 active:scale-90 dark:hover:bg-blue-900/20"><Minus size={14} /></button>
          <div className="px-3 text-[11px] font-black uppercase tracking-[0.14em] text-theme-text-primary">Week {currentWeek}</div>
          <button onClick={() => handleWeekChange(1)} className="flex h-10 w-10 items-center justify-center rounded-xl text-theme-text-tertiary transition-all hover:bg-blue-50 hover:text-blue-500 active:scale-90 dark:hover:bg-blue-900/20"><Plus size={14} /></button>
        </div>
      </m.div>

      <m.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-theme-bg-tertiary p-5 text-white"
        aria-label="Analysis overview"
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-400/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">Current Lens</p>
              <h3 className="text-3xl font-black leading-none tracking-tight">
                {selectedLabel}
              </h3>
              <p className="max-w-md text-sm font-bold leading-relaxed text-theme-text-secondary">
                {displayedWeek
                  ? `Week ${displayedWeek.week} is showing ${formatMetric(displayedWeek.totalVolume)} total volume at ${formatMetric(displayedWeek.avgWeight)}${unit} average intensity.`
                  : 'Assign program weeks to logged sessions to unlock weekly trend analysis.'}
              </p>
            </div>

            <div className={cn('inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em]', trend.chip)}>
              <TrendIcon size={14} />
              {trend.label}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-center gap-2 text-center text-blue-200">
                <Flame size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Volume</p>
              </div>
              <p className="mt-3 text-center text-[1.65rem] font-black leading-none">{displayedWeek ? formatMetric(displayedWeek.totalVolume) : '--'}</p>
              <p className="mt-1 text-center text-[11px] font-bold text-theme-text-secondary">weekly tonnage</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-center gap-2 text-center text-emerald-300">
                <Gauge size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Intensity</p>
              </div>
              <p className="mt-3 text-center text-[1.65rem] font-black leading-none">{displayedWeek ? formatMetric(displayedWeek.avgWeight) : '--'}</p>
              <p className="mt-1 text-center text-[11px] font-bold text-theme-text-secondary">avg load {unit}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-center gap-2 text-center text-orange-300">
                <TrendingUp size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Peak</p>
              </div>
              <p className="mt-3 text-center text-[1.65rem] font-black leading-none">{displayedWeek ? formatMetric(displayedWeek.bestWeight) : '--'}</p>
              <p className="mt-1 text-center text-[11px] font-bold text-theme-text-secondary">best weight {unit}</p>
            </div>
          </div>
        </div>
      </m.section>

      <m.div variants={itemVariants} className="group relative">
        <div className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-theme-text-tertiary transition-colors group-focus-within:text-blue-500">
          <Filter size={16} />
        </div>
        <select
          value={filterEx}
          onChange={(e) => setFilterEx(e.target.value)}
          className="w-full appearance-none rounded-[1.75rem] border border-white/5 bg-theme-bg-secondary py-5 pl-14 pr-12 text-sm font-black capitalize tracking-[0.08em] text-theme-text-primary outline-none transition-all focus:ring-4 focus:ring-blue-500/10"
        >
          {exerciseNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-5 top-1/2 z-10 -translate-y-1/2 text-theme-text-tertiary">
          <ChevronRight size={18} className="rotate-90 opacity-40" />
        </div>
      </m.div>

      <m.section variants={itemVariants} className="space-y-4" aria-label="Coach memory">
        <div className="flex items-center gap-3 px-1">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500">
            <Brain size={18} />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Coach Memory</h3>
            <p className="mt-1 text-xs font-bold text-theme-text-tertiary">What the model is learning from repeated session feedback.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/5 bg-theme-bg-secondary p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Global Recovery Trend</p>
            <p className="mt-2 text-xl font-black text-theme-text-primary">{formatBias(globalCoachState.recoveryTrend)}</p>
            <p className="mt-1 text-xs font-bold text-theme-text-tertiary">{recoveryTrendLabel}</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">{globalCoachRecency}</p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-theme-bg-secondary p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Global Fatigue Trend</p>
            <p className="mt-2 text-xl font-black text-theme-text-primary">{formatBias(globalCoachState.fatigueTrend)}</p>
            <p className="mt-1 text-xs font-bold text-theme-text-tertiary">{fatigueTrendLabel}</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">{globalCoachRecency}</p>
          </div>
        </div>

        {coachStates.length > 0 ? (
          <div className="space-y-3">
            {coachStates.map((state) => {
              const memory = getCoachMemoryLabel(state);
              const recencyLabel = formatCoachMemoryRecency(state.lastUpdated);
              const isResetting = resettingExercise === state.exerciseName;
              return (
                <div key={state.id} className="rounded-3xl border border-white/5 bg-theme-bg-secondary p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black tracking-tight text-theme-text-primary">{toTitleCase(state.exerciseName)}</p>
                      <p className={cn('mt-1 text-xs font-bold leading-relaxed', memory.tone)}>{memory.summary}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">{recencyLabel}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className={cn('rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]', memory.chip)}>
                        {memory.label}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResetCoachMemory(state.exerciseName)}
                        disabled={isResetting}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-theme-bg-tertiary text-theme-text-tertiary transition-all active:scale-95',
                          isResetting
                            ? 'cursor-not-allowed opacity-60'
                            : 'hover:border-blue-500/20 hover:text-blue-500'
                        )}
                        aria-label={isResetting ? `Resetting coach memory for ${state.exerciseName}` : `Reset coach memory for ${state.exerciseName}`}
                        title={isResetting ? `Resetting ${toTitleCase(state.exerciseName)}` : `Reset coach memory for ${toTitleCase(state.exerciseName)}`}
                      >
                        <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-theme-bg-tertiary p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Confidence</p>
                      <p className="mt-2 text-lg font-black text-theme-text-primary">{formatBias(state.confidenceBias)}</p>
                    </div>
                    <div className="rounded-2xl bg-theme-bg-tertiary p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Tolerance</p>
                      <p className="mt-2 text-lg font-black text-theme-text-primary">{formatBias(state.toleranceBias)}</p>
                    </div>
                    <div className="rounded-2xl bg-theme-bg-tertiary p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Pain Watch</p>
                      <p className="mt-2 text-lg font-black text-theme-text-primary">{state.painPenalty.toFixed(2)}</p>
                    </div>
                    <div className="rounded-2xl bg-theme-bg-tertiary p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Swap Lean</p>
                      <p className="mt-2 text-lg font-black text-theme-text-primary">{state.swapPreference.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyStateCard
            icon={Brain}
            eyebrow="Coach Memory"
            title="No Learned Lift State Yet"
            description="Log a few sessions with the intake and debrief so the coach can begin building persistent lift-by-lift memory."
            actionLabel="Start Logging"
            onAction={() => navigate('/log')}
            compact
          />
        )}
      </m.section>

      {analysisData.length > 0 ? (
        <div className="space-y-8">
          <m.div
            variants={itemVariants}
            className="glass relative overflow-hidden rounded-3xl border border-blue-500/10 p-5"
          >
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="shrink-0 rounded-2xl bg-theme-accent p-4 text-white">
                <Activity size={22} />
              </div>
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-accent dark:text-blue-400">Tactical Insight</h3>
                <p className="text-sm font-bold italic leading-relaxed text-theme-text-secondary">
                  &quot;{insight}&quot;
                </p>
              </div>
            </div>
          </m.div>

          <m.div variants={itemVariants} className="space-y-4 overflow-hidden rounded-3xl border border-white/5 bg-theme-bg-secondary p-4">
            <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-blue-500" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Efficiency Trend</h3>
                </div>
                <p className="max-w-lg text-xs font-medium leading-relaxed text-theme-text-tertiary">
                  Volume bars and intensity line move together here so it is easier to spot whether load progression is being supported by enough weekly work.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Intensity</span>
                </div>
              </div>
            </div>
            <div className="relative h-64">
              <LazyChart
                type="bar"
                data={chartData as unknown as ChartData<'bar'>}
                options={chartOptions as unknown as ChartOptions<'bar'>}
              />
            </div>
          </m.div>

          <m.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Calendar size={14} className="text-blue-500" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Weekly Registry</h3>
            </div>
            <div className="space-y-3">
              {analysisData.slice().reverse().map((entry) => {
                const entryTrend = getTrendSummary(entry.percentChange);
                const EntryTrendIcon = entryTrend.Icon;

                return (
                  <div
                    key={entry.week}
                    className={cn(
                      'rounded-3xl border border-white/5 bg-theme-bg-secondary p-4',
                      entry.week === currentWeek && 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black tracking-tight text-theme-text-primary">Week {entry.week}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Peak load {entry.bestWeight}{unit}</p>
                      </div>
                      <div className={cn('inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-black tabular-nums', entryTrend.chip)}>
                        <EntryTrendIcon size={12} />
                        {entryTrend.label}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-theme-bg-tertiary p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Volume</p>
                        <p className="mt-2 tabular-nums text-xl font-black text-theme-accent dark:text-blue-400">{entry.totalVolume.toLocaleString()}</p>
                        <p className="mt-1 text-xs font-bold text-theme-text-tertiary">Total tonnage</p>
                      </div>
                      <div className="rounded-2xl bg-theme-bg-tertiary p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Intensity</p>
                        <p className="mt-2 tabular-nums text-xl font-black text-theme-text-primary">{entry.avgWeight}<span className="ml-1 text-sm opacity-50">{unit}</span></p>
                        <p className="mt-1 text-xs font-bold text-theme-text-tertiary">Average load</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </m.div>
        </div>
      ) : (
        <div>
          <EmptyStateCard
            icon={Activity}
            eyebrow="Analytics Offline"
            title="Signal Weak"
            description="Assign a program week to your sessions so the analytics view can map your training blocks correctly."
            actionLabel="Start Logging"
            onAction={() => navigate('/log')}
          />
        </div>
      )}
    </m.div>
  );
};

export default Analysis;
