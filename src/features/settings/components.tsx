import React from 'react';
import { Download, Upload, ShieldCheck, Plus, Trash2, ChevronUp, X } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import type { Exercise, TrainingSession, TrainingSessionExercise } from '../../db/models';
import ExerciseLibrary from '../../components/ExerciseLibrary';

export function SplitEditorModal({
  editingSession,
  showPicker: _showPicker,
  setShowPicker,
  updateExInSession,
  removeExFromSession,
  addExToSession,
  setEditingSession,
  handleSaveSession,
}: {
  editingSession: Partial<TrainingSession> | null;
  showPicker: number | null;
  setShowPicker: (value: number | null) => void;
  updateExInSession: (idx: number, field: keyof TrainingSessionExercise, value: string | number | [number, number]) => void;
  removeExFromSession: (idx: number) => void;
  addExToSession: () => void;
  setEditingSession: (value: Partial<TrainingSession> | null) => void;
  handleSaveSession: () => void;
}) {
  return (
    <AnimatePresence>
      {editingSession && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center overflow-hidden p-0 sm:items-center sm:p-5">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingSession(null)}
          />
          <m.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[3.5rem] border-t border-white/10 bg-theme-bg-primary p-5 sm:rounded-2xl sm:border"
          >
            <div className="mx-auto mb-6 h-2 w-16 shrink-0 rounded-full bg-gray-200 bg-theme-bg-tertiary" />
            <div className="shrink-0 flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tighter text-theme-text-primary">Forge Split</h3>
              <button onClick={() => setEditingSession(null)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-theme-text-tertiary hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="scrollbar-hide flex-grow space-y-8 overflow-y-auto px-1">
              <div className="space-y-2">
                <label className="ml-2 text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-tertiary">Sequence Name</label>
                <input
                  type="text"
                  placeholder="e.g. Upper Body Focus"
                  className="w-full border-b-2 border-white/5 bg-transparent px-2 py-4 text-xl font-black text-theme-text-primary outline-none transition-colors focus:border-blue-600"
                  value={editingSession.name}
                  onChange={(e) => setEditingSession({ ...editingSession, name: e.target.value })}
                />
              </div>

              <div className="space-y-5">
                <p className="ml-2 text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-tertiary">Bio-Sequence</p>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {editingSession.exercises?.map((exercise, idx) => (
                      <m.div
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={`split-ex-${idx}`}
                        className="relative space-y-5 rounded-2xl border border-white/5 bg-theme-bg-secondary/50 p-5"
                      >
                        <button
                          onClick={() => setShowPicker(idx)}
                          className="group/pick flex w-full items-center justify-between border-b border-white/5 pb-3 text-left text-base font-black tracking-tight text-theme-text-primary"
                        >
                          <span className={exercise.exerciseName ? '' : 'text-theme-text-tertiary'}>
                            {exercise.exerciseName || 'Select Movement'}
                          </span>
                          <ChevronUp size={16} className="rotate-90 text-theme-text-tertiary transition-colors group-hover/pick:text-blue-500" />
                        </button>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-theme-text-tertiary">Target Sets</label>
                            <input
                              type="number"
                              className="w-full rounded-xl bg-theme-bg-tertiary p-3 text-sm font-black text-theme-text-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={exercise.targetSets}
                              onChange={(e) => updateExInSession(idx, 'targetSets', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-theme-text-tertiary">Rep Protocol</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                className="w-full rounded-xl bg-theme-bg-tertiary p-3 text-center text-sm font-black text-theme-text-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={exercise.targetRepsRange[0]}
                                onChange={(e) => updateExInSession(idx, 'targetRepsRange', [Number(e.target.value), exercise.targetRepsRange[1]])}
                              />
                              <span className="font-bold text-theme-text-tertiary">-</span>
                              <input
                                type="number"
                                className="w-full rounded-xl bg-theme-bg-tertiary p-3 text-center text-sm font-black text-theme-text-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={exercise.targetRepsRange[1]}
                                onChange={(e) => updateExInSession(idx, 'targetRepsRange', [exercise.targetRepsRange[0], Number(e.target.value)])}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeExFromSession(idx)}
                          className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-110"
                        >
                          <Trash2 size={14} />
                        </button>
                      </m.div>
                    ))}
                  </AnimatePresence>
                </div>
                <button
                  onClick={addExToSession}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-100 py-4 text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary transition-all hover:border-blue-500/40 hover:text-blue-500 active:scale-[0.98] dark:border-white/10"
                >
                  <Plus size={18} /> Append Sequence
                </button>
              </div>
            </div>

            <div className="flex shrink-0 gap-4 pt-6">
              <button onClick={() => setEditingSession(null)} className="flex-grow rounded-2xl bg-gray-100 py-4 text-xs font-black uppercase tracking-widest text-theme-text-tertiary transition-all active:scale-95 dark:bg-white/5 dark:text-theme-text-tertiary">Cancel</button>
              <button onClick={handleSaveSession} className="flex-grow rounded-xl bg-theme-accent py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 active:scale-95">Commit Split</button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SettingsPortabilitySection({
  onExport,
  onImport,
}: {
  onExport: () => void;
  onImport: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-theme-bg-secondary p-5 space-y-8">
      <div className="absolute -bottom-10 -right-10 rotate-12 opacity-[0.03] transition-opacity duration-1000 group-hover:opacity-[0.06]">
        <ShieldCheck size={200} />
      </div>

      <div className="relative z-10 space-y-1 px-1">
        <h3 className="text-base font-black uppercase tracking-widest text-theme-text-primary">Bio-Data Portability</h3>
        <p className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-tertiary">Secure Vault Backup & Restoration</p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-5">
        <button onClick={onExport} className="group/btn flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-theme-bg-secondary/50 p-5 text-[10px] font-black uppercase tracking-widest text-theme-text-secondary transition-all hover:text-blue-500 active:scale-95">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-theme-bg-tertiary transition-transform group-hover/btn:-translate-y-1">
            <Download size={24} className="text-blue-500" />
          </div>
          Export Vault
        </button>
        <label className="group/btn flex cursor-pointer flex-col items-center gap-4 rounded-2xl border border-white/5 bg-theme-bg-secondary/50 p-5 text-[10px] font-black uppercase tracking-widest text-theme-text-secondary transition-all hover:text-emerald-500 active:scale-95">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-theme-bg-tertiary transition-transform group-hover/btn:-translate-y-1">
            <Upload size={24} className="text-emerald-500" />
          </div>
          Restore Vault
          <input type="file" className="hidden" accept=".json" onChange={onImport} />
        </label>
      </div>
    </div>
  );
}

export function SettingsExercisePickerModal({
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
        <div className="fixed inset-0 z-[200] flex items-end justify-center overflow-hidden p-0 sm:items-center sm:p-5">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <m.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[3.5rem] border-t border-white/10 bg-theme-bg-primary p-5 sm:rounded-2xl sm:border"
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
