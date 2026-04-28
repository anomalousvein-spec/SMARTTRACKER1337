import React, { useState } from 'react';
import type { Session } from '../db/models';
import { History as HistoryIcon, Calendar, ChevronRight, Info, Filter, Trash2, Edit3, X, Check, Wand2, ArrowRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { m, AnimatePresence, type Variants } from 'framer-motion';
import { formatShortDate, toTitleCase } from '../utils/formatters';
import { cn } from '../utils/ui';
import { useHistoryData } from '../features/history/useHistoryData';
import EmptyStateCard from './EmptyStateCard';

function normalizeProgramWeek(value: number) {
  if (!Number.isFinite(value)) return null;
  return Math.max(1, Math.floor(value));
}

const History: React.FC = () => {
  const [editingWeekId, setEditingWeekId] = useState<number | null>(null);
  const [tempWeek, setTempWeek] = useState<number>(1);
  const navigate = useNavigate();
  const { sessions, groupedSessions, loading, isProcessing, showWandFeedback, deleteSession, updateSessionWeek, autoAssignWeeks } = useHistoryData();

  const handleDeleteSession = async (id: number) => {
    if (confirm('Delete this workout session permanently?')) {
      try {
        await deleteSession(id);
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  const handleStartEditWeek = (session: Session) => {
    if (!session.id) return;
    setEditingWeekId(session.id);
    setTempWeek(session.programWeek ?? 1);
  };

  const handleSaveWeek = async (id: number) => {
    const normalizedWeek = normalizeProgramWeek(tempWeek);
    if (normalizedWeek === null) {
      alert('Program week must be a whole number of at least 1.');
      return;
    }

    try {
      await updateSessionWeek(id, normalizedWeek);
      setTempWeek(normalizedWeek);
      setEditingWeekId(null);
    } catch (error) {
      console.error('Failed to update week:', error);
    }
  };

  const handleAutoAssignWeeks = async () => {
    if (!confirm('Auto-detect program weeks based on dates? This will only update sessions missing a week number.')) return;
    await autoAssignWeeks();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" role="status" aria-label="Loading history">
      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-[11px] font-black text-theme-text-tertiary uppercase tracking-[0.18em] animate-pulse">Decrypting Logs...</p>
    </div>
  );
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-7 pb-24">
      <div className="flex justify-between items-end gap-3 px-1">
        <div>
          <h2 className="text-[1.9rem] font-black text-theme-text-primary tracking-tight leading-none">Training Logs</h2>
          <p className="mt-1 text-[11px] font-black text-theme-text-tertiary uppercase tracking-[0.18em]">Session History</p>
        </div>
        <div className="flex gap-2.5 relative">
           <AnimatePresence>
             {showWandFeedback && (
               <m.div
                 initial={{ opacity: 0, y: 10, scale: 0.9 }}
                 animate={{ opacity: 1, y: -40, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 z-20 whitespace-nowrap rounded-xl bg-theme-accent px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white"
              >
                <span className="flex items-center gap-2"><Sparkles size={10} /> Weeks Synced</span>
              </m.div>
             )}
           </AnimatePresence>
           <button
             onClick={handleAutoAssignWeeks}
             disabled={isProcessing}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-theme-bg-secondary text-theme-text-tertiary transition-all disabled:opacity-50 active:scale-90 hover:text-blue-500"
             title="Auto-assign Program Weeks"
             aria-label="Auto-assign program weeks"
           >
             <Wand2 size={20} className={isProcessing ? "animate-spin" : ""} />
           </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Filters coming soon"
            title="Filters coming soon"
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-theme-bg-secondary px-3 text-theme-text-tertiary opacity-60"
          >
             <Filter size={16} />
             <span className="text-[9px] font-black uppercase tracking-[0.14em]">Soon</span>
           </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyStateCard
          icon={HistoryIcon}
          eyebrow="Session Archive"
          title="No Sessions Yet"
          description="Your history feed will fill in after the first workout. Start logging and this screen becomes your running archive."
          actionLabel="Start Logging"
          actionIcon={ArrowRight}
          onAction={() => navigate('/log')}
        />
      ) : (
        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {groupedSessions.map(({ monthYear, sessions: monthSessions }) => (
            <div key={monthYear} className="space-y-4">
              <h3 className="sticky top-20 z-10 border-b border-blue-500/10 bg-theme-bg-primary/90 px-3 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-theme-accent backdrop-blur-md dark:text-blue-400">
                {monthYear}
              </h3>
              <div className="space-y-4">
                {monthSessions.map((session) => (
                  <m.div
                    key={session.id}
                    variants={itemVariants}
                    className="group relative overflow-hidden rounded-3xl border border-white/5 bg-theme-bg-secondary p-4 transition-all"
                  >
                    <div className="mb-4 flex justify-between items-start gap-3 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3 text-theme-text-tertiary dark:text-theme-text-tertiary">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100/50 bg-blue-50 p-3 text-theme-accent dark:border-blue-500/10 dark:bg-blue-500/5 dark:text-blue-400">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Week</p>
                             {editingWeekId === session.id ? (
                               <div className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-theme-bg-tertiary px-2 py-1">
                                 <input
                                   type="number"
                                   min={1}
                                   step={1}
                                   className="w-10 bg-transparent p-0.5 text-center text-[11px] font-black text-blue-500 outline-none"
                                   value={Number.isFinite(tempWeek) ? tempWeek : ''}
                                   onChange={(e) => {
                                     const nextValue = e.target.value;
                                     setTempWeek(nextValue === '' ? Number.NaN : Number(nextValue));
                                   }}
                                   autoFocus
                                 />
                                 <button onClick={() => session.id && handleSaveWeek(session.id)} className="text-emerald-500 hover:scale-110 transition-transform"><Check size={12}/></button>
                                 <button onClick={() => setEditingWeekId(null)} className="text-red-400 hover:scale-110 transition-transform"><X size={12}/></button>
                               </div>
                             ) : (
                               <button
                                 onClick={() => handleStartEditWeek(session)}
                                 className="flex items-center gap-1.5 rounded-xl border border-blue-100/50 bg-theme-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-theme-accent transition-all hover:bg-blue-100 dark:border-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                               >
                                 W{session.programWeek ?? '?'}
                                 <Edit3 size={8} className="opacity-40" />
                               </button>
                             )}
                          </div>
                          <p className="mt-1 text-lg font-black text-theme-text-primary tracking-tight">
                            {formatShortDate(session.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary opacity-60">Soreness</p>
                          <p className={cn("mt-1 text-base font-black", getSorenessColor(session.soreness))}>{session.soreness}<span className="text-[11px] opacity-40">/10</span></p>
                        </div>
                        <button
                          onClick={() => session.id && handleDeleteSession(session.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-theme-text-tertiary transition-all active:scale-90 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {session.exercises.map((ex, idx) => (
                        <Link
                          key={idx}
                          to={`/exercise/${encodeURIComponent(ex.exerciseName)}`}
                          className="group/link flex items-center justify-between gap-3 rounded-2xl border border-transparent p-3 transition-all hover:border-blue-100 hover:bg-blue-50 dark:hover:border-white/10 dark:hover:bg-white/[0.02]"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full  group-hover/link:scale-150 transition-transform"></div>
                            <span className="truncate text-sm font-black uppercase tracking-tight text-theme-text-secondary">
                              {toTitleCase(ex.exerciseName)}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <div className="hidden gap-3 sm:flex">
                               {ex.sets.map((s, si) => (
                                 <div key={si} className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-theme-text-primary tabular-nums">{s.weight}</span>
                                    <span className="text-[9px] font-black text-theme-text-tertiary uppercase tabular-nums">x{s.reps}</span>
                                 </div>
                               ))}
                            </div>
                            <span className="rounded-full bg-theme-bg-tertiary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary sm:hidden">
                              {ex.sets.length} sets
                            </span>
                            <ChevronRight size={16} className="text-theme-text-tertiary group-hover/link:translate-x-1 transition-transform" />
                          </div>
                        </Link>
                      ))}
                    </div>

                    {session.notes && (
                      <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/5 bg-theme-bg-tertiary p-4">
                         <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
                         <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-theme-text-tertiary">
                           <Info size={10} className="text-blue-500" /> Tactical Notes
                         </p>
                         <p className="line-clamp-3 text-sm font-bold italic leading-relaxed text-theme-text-secondary dark:text-theme-text-tertiary">
                          {session.notes}
                        </p>
                      </div>
                    )}
                  </m.div>
                ))}
              </div>
            </div>
          ))}
        </m.div>
      )}
    </div>
  );
};

function getSorenessColor(val: number) {
  if (val <= 3) return "text-emerald-500";
  if (val <= 6) return "text-orange-500";
  return "text-red-500";
}

export default History;
