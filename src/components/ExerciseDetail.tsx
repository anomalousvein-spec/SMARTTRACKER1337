import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { calculateE1RM, getVolumeStatus } from '../progression/engine';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Flame,
  RefreshCcw,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { formatShortDate, toTitleCase } from '../utils/formatters';
import { m, AnimatePresence } from 'framer-motion';
import LazyChart from './LazyChart';
import { useExerciseDetail } from '../features/exerciseDetail/useExerciseDetail';

function formatMetric(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

const ExerciseDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { exerciseName, relevantExSessions, suggestion, loading, unit, bestE1RM, chartData, chartOptions } = useExerciseDetail(name);

  const latestSession = relevantExSessions[relevantExSessions.length - 1];
  const sessionCount = relevantExSessions.length;
  const lastVolume = latestSession?.totalVolume ?? 0;
  const lastPeak = latestSession?.peakE1RM ?? 0;
  const currentVolumeStatus = suggestion ? getVolumeStatus(suggestion.currentWeeklySets, suggestion.caps) : null;
  const projectedVolumeStatus = suggestion ? getVolumeStatus(suggestion.projectedWeeklySets, suggestion.caps) : null;

  const handleApplySwap = (swapName: string) => {
    navigate('/log', {
      state: {
        prefill: {
          exerciseName: swapName,
          suggestedWeight: suggestion?.suggestedWeight || 0,
          suggestedReps: suggestion?.suggestedReps || 8,
          suggestedSets: suggestion?.suggestedSets || 3,
        },
        note: `Tactical swap from ${exerciseName} (Plateau Detection)`,
      },
    });
  };

  if (loading || !name) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600/20 border-t-blue-600"></div>
      <p className="animate-pulse text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Analyzing Performance Data...</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-7 pb-12">
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 px-1 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-500 transition-transform hover:-translate-x-1 active:scale-95"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:scale-110" /> Back to logs
      </button>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-theme-bg-tertiary p-5 text-white">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-400/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">Movement Profile</p>
              <h2 className="text-3xl font-black leading-none tracking-tighter">{toTitleCase(exerciseName)}</h2>
              <p className="max-w-md text-sm font-bold leading-relaxed text-theme-text-secondary">
                {sessionCount > 0
                  ? `${sessionCount} logged session${sessionCount > 1 ? 's' : ''} tracked for this lift, with a current peak estimated 1RM of ${formatMetric(bestE1RM)}${unit}.`
                  : 'Start logging this movement to unlock progression analytics and next-session guidance.'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-200 opacity-80">Peak 1RM</p>
              <p className="text-2xl font-black leading-none">{formatMetric(bestE1RM)}<span className="ml-1 text-[11px] uppercase opacity-50">{unit}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-emerald-300">
                <Flame size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Sessions</p>
              </div>
              <p className="mt-3 text-2xl font-black leading-none">{sessionCount}</p>
              <p className="mt-1 text-[11px] font-bold text-theme-text-secondary">logged blocks</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-blue-200">
                <Activity size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Volume</p>
              </div>
              <p className="mt-3 text-2xl font-black leading-none">{formatMetric(lastVolume)}</p>
              <p className="mt-1 text-[11px] font-bold text-theme-text-secondary">last session tonnage</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-orange-300">
                <TrendingUp size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Recent Peak</p>
              </div>
              <p className="mt-3 text-2xl font-black leading-none">{formatMetric(lastPeak)}</p>
              <p className="mt-1 text-[11px] font-bold text-theme-text-secondary">latest est. 1RM</p>
            </div>
          </div>
        </div>
      </section>

      {suggestion && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative space-y-5 overflow-hidden rounded-3xl bg-theme-accent p-5 text-white"
        >
          <div className="absolute -bottom-6 -right-6 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2 backdrop-blur-md">
                <Zap size={18} className="text-yellow-300" fill="currentColor" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">Next Training Target</h3>
            </div>
            {suggestion.plateauFlag && (
              <span className="flex items-center gap-2 rounded-2xl border border-white/30 bg-orange-500 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white animate-pulse">
                <AlertTriangle size={12} fill="currentColor" /> Plateau Alert
              </span>
            )}
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-5 shadow-inner backdrop-blur-md">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Load</p>
              <p className="text-3xl font-black leading-none">{suggestion.suggestedWeight}<span className="ml-1.5 text-sm font-black uppercase opacity-50">{unit}</span></p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-5 shadow-inner backdrop-blur-md">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Sequence</p>
              <p className="text-3xl font-black leading-none">{suggestion.suggestedSets} <span className="px-1 text-base font-bold opacity-40">x</span> {suggestion.suggestedReps}</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2">
            <span className="rounded-full border border-sky-200/30 bg-sky-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-sky-100">
              Current {suggestion.currentWeeklySets} | {currentVolumeStatus}
            </span>
            <span className="rounded-full border border-emerald-200/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
              Projected {suggestion.projectedWeeklySets} | {projectedVolumeStatus}
            </span>
            {suggestion.suggestedRPE !== undefined && (
              <span className="rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
                Target RPE {suggestion.suggestedRPE.toFixed(1)}
              </span>
            )}
          </div>

          <div className="relative z-10 rounded-2xl border border-white/5 bg-black/10 p-4 shadow-inner backdrop-blur-sm">
            <p className="px-2 text-center text-sm font-bold italic leading-relaxed opacity-95">
              &quot;{suggestion.reason}&quot;
            </p>
          </div>

          <AnimatePresence>
            {suggestion.plateauFlag && suggestion.swapSuggestions && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="relative z-10 space-y-4 pt-2"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Target size={12} className="text-blue-200" />
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100 opacity-80">Tactical Stimulus Swap</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {suggestion.swapSuggestions.map((swap) => (
                    <button
                      key={swap}
                      onClick={() => handleApplySwap(swap)}
                      className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/20 px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-white/30 active:scale-95"
                    >
                      <RefreshCcw size={12} /> {swap}
                    </button>
                  ))}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      )}

      <div className="space-y-5 rounded-3xl border border-white/10 bg-theme-bg-secondary p-5">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h3 className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">
              <Activity size={16} className="text-blue-500" /> Bio-Trajectory
            </h3>
            <p className="max-w-lg text-xs font-medium leading-relaxed text-theme-text-tertiary">
              Estimated strength and total volume are layered together here so you can spot whether performance is rising on top of enough work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Strength</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Volume</span>
            </div>
          </div>
        </div>
        <div className="relative h-64">
          <LazyChart type="bar" data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">
            <Calendar size={16} className="text-blue-500" /> Training Archive
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">Recent Blocks</p>
        </div>

        <div className="space-y-5">
          {relevantExSessions.slice(-5).reverse().map((session, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group space-y-4 rounded-3xl border border-white/5 bg-theme-bg-secondary p-5 transition-all hover:border-blue-500/20 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500/40" />
                  <p className="truncate text-[12px] font-black uppercase tracking-tight text-theme-text-secondary">
                    {formatShortDate(session.date)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary opacity-60">Peak</p>
                    <p className="text-xs font-black uppercase tracking-tighter text-theme-text-primary">
                      {Math.max(...session.ex.sets.map((set) => calculateE1RM(set.weight, set.reps)))} {unit}
                    </p>
                  </div>
                  <span className="rounded-xl border border-blue-100/50 bg-theme-accent/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-theme-accent dark:border-blue-500/10 dark:text-blue-400">
                    {session.ex.sets.length} Sets
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 px-1">
                {session.ex.sets.map((set, setIndex) => (
                  <div key={setIndex} className="group/set flex items-center justify-between gap-3 rounded-2xl bg-theme-bg-tertiary/60 px-4 py-3">
                    <div className="flex items-center gap-4">
                      <span className="w-6 text-[10px] font-black text-theme-text-tertiary">S{setIndex + 1}</span>
                      <span className="text-sm font-black tracking-tight text-theme-text-primary tabular-nums">{set.weight} {unit} x {set.reps}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="mb-0.5 text-[9px] font-black uppercase leading-none tracking-[0.14em] text-emerald-500">Tonnage</span>
                        <span className="text-[11px] font-black leading-none text-emerald-600 tabular-nums dark:text-emerald-400">{(set.weight * set.reps).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="mb-0.5 text-[9px] font-black uppercase leading-none tracking-[0.14em] text-theme-text-tertiary">Intensity</span>
                        <span className="text-[11px] font-black leading-none text-theme-text-tertiary">RPE {set.rpe}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </m.div>
          ))}
        </div>

        {relevantExSessions.length > 5 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-3 rounded-2xl bg-gray-100 px-8 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary transition-all hover:text-blue-500 active:scale-95 dark:bg-white/5"
            >
              Access Full Archive <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseDetail;
