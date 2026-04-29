import React, { useEffect, useState } from 'react';
import type { TrainingSession, ExperienceLevel, TrainingSessionExercise, Exercise } from '../db/models';
import { getAllTrainingSessions, saveTrainingSession, deleteTrainingSession, getUserSettings, updateUserSettings } from '../progression/settings';
import { seedExerciseLibrary } from '../progression/exerciseLibrarySeed';
import { Palette, Scale, Package, Plus, Trash2, Edit2, ChevronDown, Library, Calendar, RotateCcw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/ui';
import { exportBackup, importBackupFromFile } from '../features/settings/backup';
import { SettingsExercisePickerModal, SettingsPortabilitySection, SplitEditorModal } from '../features/settings/components';

const DASHBOARD_SUGGESTIONS_VISIBILITY_KEY = 'dashboard_hide_target_exercises';

interface SettingsProps {
  theme: string;
  selectTheme: (theme: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, selectTheme }) => {
  const navigate = useNavigate();
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [level, setLevel] = useState<ExperienceLevel>('intermediate');
  const [deloadFreq, setDeloadFreq] = useState<4 | 6 | 8 | "off">(6);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [showPicker, setShowPicker] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<Partial<TrainingSession> | null>(null);
  const [showSplits, setShowSplits] = useState(false);
  const [showLibraryMgmt, setShowLibraryMgmt] = useState(false);
  const [hideDashboardSuggestions, setHideDashboardSuggestions] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const userSettings = await getUserSettings();
      setUnit(userSettings.unit);
      setLevel(userSettings.experienceLevel);
      setDeloadFreq(userSettings.deloadFrequency || 6);

      const sessions = await getAllTrainingSessions();
      setTrainingSessions(sessions);
      setHideDashboardSuggestions(localStorage.getItem(DASHBOARD_SUGGESTIONS_VISIBILITY_KEY) === 'true');
    }
    void loadSettings();
  }, []);

  const handleUnitChange = async (newUnit: 'lbs' | 'kg') => {
    setUnit(newUnit);
    await updateUserSettings({ unit: newUnit });
  };

  const handleLevelChange = async (newLevel: ExperienceLevel) => {
    setLevel(newLevel);
    await updateUserSettings({ experienceLevel: newLevel });
  };

  const handleDeloadChange = async (freq: 4 | 6 | 8 | 'off') => {
    setDeloadFreq(freq);
    await updateUserSettings({ deloadFrequency: freq });
  };

  const handleSaveSession = async () => {
    if (!editingSession?.name) {
      alert('Please provide a name for the split.');
      return;
    }

    const validExercises = (editingSession.exercises ?? []).filter(e => e.exerciseName.trim() !== '');
    if (validExercises.length === 0) {
      alert('Please add at least one exercise to the split.');
      return;
    }

    try {
      await saveTrainingSession({
        ...editingSession,
        exercises: validExercises
      } as TrainingSession);

      setTrainingSessions(await getAllTrainingSessions());
      setEditingSession(null);
    } catch (error) {
      console.error('Failed to save split:', error);
      alert('Failed to save split.');
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (confirm('Delete this training split?')) {
      await deleteTrainingSession(id);
      setTrainingSessions(await getAllTrainingSessions());
    }
  };

    const handleExerciseSelect = (exercise: Exercise) => {
    if (!editingSession) return;
    const name = exercise.name;
    const id = exercise.id?.toString();

    const exercises = [...(editingSession.exercises ?? [])];
    if (showPicker === -1) {
      exercises.push({ exerciseName: name, exerciseId: id, targetSets: 3, targetRepsRange: [6, 12] });
    } else if (showPicker !== null) {
      exercises[showPicker] = { ...exercises[showPicker], exerciseName: name, exerciseId: id };
    }
    setEditingSession({ ...editingSession, exercises });
    setShowPicker(null);
  };

  const addExToSession = () => {
    setShowPicker(-1);
  };
  const updateExInSession = (idx: number, field: keyof TrainingSessionExercise, value: string | number | [number, number]) => {
    if (!editingSession?.exercises) return;
    const exercises = [...editingSession.exercises];
    const currentExercise = exercises[idx];
    if (!currentExercise) return;

    switch (field) {
      case 'exerciseName':
        exercises[idx] = { ...currentExercise, exerciseName: value as string };
        break;
      case 'exerciseId':
        exercises[idx] = { ...currentExercise, exerciseId: value as string };
        break;
      case 'targetSets':
        exercises[idx] = { ...currentExercise, targetSets: value as number };
        break;
      case 'targetRepsRange':
        exercises[idx] = { ...currentExercise, targetRepsRange: value as [number, number] };
        break;
      default:
        return;
    }

    setEditingSession({ ...editingSession, exercises });
  };

  const removeExFromSession = (idx: number) => {
    if (!editingSession?.exercises) return;
    const exercises = editingSession.exercises.filter((_, i) => i !== idx);
    setEditingSession({ ...editingSession, exercises });
  };

  const handleResetLibrary = async () => {
    if (confirm('This will restore all default exercises. Custom exercises will be preserved. Continue?')) {
      await seedExerciseLibrary();
      alert('Library updated with missing defaults.');
    }
  };

  const handleDashboardSuggestionsVisibilityChange = () => {
    const nextValue = !hideDashboardSuggestions;
    setHideDashboardSuggestions(nextValue);
    localStorage.setItem(DASHBOARD_SUGGESTIONS_VISIBILITY_KEY, String(nextValue));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <div className="px-1">
        <h2 className="text-[1.9rem] font-black tracking-tight leading-none text-theme-text-primary">Settings</h2>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">App Preferences</p>
      </div>

      {/* Global Profile */}
      <div className="space-y-6 rounded-2xl border border-white/5 bg-theme-bg-secondary p-5">
        <div className="flex items-center gap-3 px-1">
          <Package size={16} className="text-blue-500" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Profile</h3>
        </div>

        <div className="flex justify-between items-center bg-theme-bg-secondary/50 p-5 rounded-2xl border border-white/5 ">
          <div className="flex items-center gap-4 font-black text-theme-text-primary text-sm uppercase tracking-tight">
            <div className="p-3 bg-theme-bg-tertiary rounded-2xl  border border-white/5">
               <Palette size={20} className="text-blue-400" />
            </div>
            Theme
          </div>
          <div className="flex gap-2">
            {['monochrome', 'jewel', 'amoled'].map(t => (
              <button
                key={t}
                onClick={() => selectTheme(t)}
                className={cn(
                  "h-10 w-10 rounded-full border-2 transition-all active:scale-95",
                  theme === t ? "border-blue-500 scale-110" : "border-transparent opacity-40"
                )}
                style={{ backgroundColor: t === 'monochrome' ? '#1E1E1E' : t === 'jewel' ? '#16202C' : '#000000' }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-5 px-1">
           <div className="flex items-center gap-2">
             <Scale size={14} className="text-blue-500" />
             <span className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Experience Level</span>
           </div>
           <div className="grid grid-cols-2 gap-2">
              {(['beginner', 'novice', 'intermediate', 'advanced'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => handleLevelChange(l)}
                  className={cn(
                    "min-h-10 rounded-xl border px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition-all active:scale-95 ",
                    level === l
                      ? "bg-theme-accent text-white border-blue-600 "
                      : "bg-white dark:bg-white/5 text-theme-text-tertiary border-white/5"
                  )}
                >
                  {l}
                </button>
              ))}
           </div>
        </div>
        <div className="space-y-4 px-1 pt-2">
           <div className="flex items-center gap-2">
             <Calendar size={14} className="text-blue-500" />
             <span className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Deload Frequency</span>
           </div>
           <div className="grid grid-cols-2 gap-2">
             {([4, 6, 8, 'off'] as const).map(f => (
               <button
                 key={f}
                 onClick={() => handleDeloadChange(f)}
                 className={cn(
                   "min-h-10 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] border transition-all active:scale-95",
                   deloadFreq === f
                     ? "bg-blue-600 border-blue-600 text-white  "
                     : "bg-theme-bg-tertiary border-white/5 text-theme-text-tertiary"
                 )}
               >
                 {f === 'off' ? 'Disabled' : f + ' Weeks'}
               </button>
             ))}
           </div>
        </div>

        <div className="flex flex-col gap-5 px-1">
          <div className="flex items-center gap-2">
            <Scale size={14} className="text-blue-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Units</span>
          </div>
          <div className="flex bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200 border-white/5 ">
            {(['lbs', 'kg'] as const).map(u => (
              <button
                key={u}
                className={cn(
                  "flex-grow rounded-2xl py-3.5 text-sm font-black uppercase tracking-[0.14em] transition-all",
                  unit === u
                    ? "bg-theme-bg-tertiary  text-theme-accent"
                    : "text-theme-text-tertiary opacity-60"
                )}
                onClick={() => handleUnitChange(u)}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-theme-bg-secondary/50 p-5">
          <div className="pr-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">Dashboard Suggestions</p>
            <p className="mt-2 text-sm font-bold leading-relaxed text-theme-text-secondary">
              Hide the collapsible Target Exercises section on the dashboard if you mainly work from your own templates.
            </p>
          </div>
          <button
            onClick={handleDashboardSuggestionsVisibilityChange}
            className={cn(
              'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-all',
              hideDashboardSuggestions
                ? 'border-blue-600 bg-blue-600'
                : 'border-white/10 bg-theme-bg-tertiary'
            )}
            aria-pressed={hideDashboardSuggestions}
            aria-label="Hide dashboard target exercises section"
          >
            <span
              className={cn(
                'h-6 w-6 rounded-full bg-white shadow transition-transform',
                hideDashboardSuggestions ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Exercise Pool Management */}
      <div className="bg-theme-bg-secondary border border-white/5 p-5 rounded-2xl  space-y-6">
        <button
          onClick={() => setShowLibraryMgmt(!showLibraryMgmt)}
          className="w-full flex justify-between items-center px-1 group"
        >
          <div className="flex items-center gap-3">
            <Library size={16} className="text-blue-500" />
            <h3 className="text-[10px] font-black text-theme-text-tertiary uppercase tracking-[0.25em]">Exercise Vault</h3>
          </div>
          <div className={cn("transition-transform duration-300", showLibraryMgmt ? "rotate-180" : "")}>
            <ChevronDown size={20} className="text-theme-text-tertiary group-hover:text-blue-500" />
          </div>
        </button>

        <AnimatePresence>
          {showLibraryMgmt && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4 pt-2">
                <button
                  onClick={() => navigate('/library')}
                  className="bg-theme-bg-secondary/50 p-5 rounded-2xl border border-white/5 flex justify-between items-center group active:scale-[0.98] transition-all hover:border-blue-500/20"
                >
                  <div className="text-left">
                    <h4 className="font-black text-theme-text-primary text-base tracking-tight leading-none">Open Exercise Library</h4>
                    <p className="text-[9px] font-black text-theme-text-tertiary uppercase tracking-widest mt-2">Manage exercises and muscle groups</p>
                  </div>
                  <div className="w-10 h-10 bg-theme-bg-tertiary rounded-xl flex items-center justify-center  border border-white/5 group-hover:translate-x-1 transition-transform">
                    <ArrowRight size={20} className="text-blue-500" />
                  </div>
                </button>

                <button
                  onClick={handleResetLibrary}
                  className="bg-theme-bg-secondary/50 p-5 rounded-2xl border border-white/5 flex justify-between items-center group active:scale-[0.98] transition-all hover:border-amber-500/20"
                >
                  <div className="text-left">
                    <h4 className="font-black text-theme-text-primary text-base tracking-tight leading-none">Restore Default Exercises</h4>
                    <p className="text-[9px] font-black text-theme-text-tertiary uppercase tracking-widest mt-2">Add back any missing built-in exercises</p>
                  </div>
                  <div className="w-10 h-10 bg-theme-bg-tertiary rounded-xl flex items-center justify-center  border border-white/5 group-hover:rotate-180 transition-transform duration-500">
                    <RotateCcw size={20} className="text-amber-500" />
                  </div>
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Training Splits */}
      <div className="bg-theme-bg-secondary border border-white/5 p-5 rounded-2xl  space-y-6">
        <button
          onClick={() => setShowSplits(!showSplits)}
          className="w-full flex justify-between items-center px-1 group"
        >
          <div className="flex items-center gap-3">
            <Plus size={16} className="text-blue-500" />
            <h3 className="text-[10px] font-black text-theme-text-tertiary uppercase tracking-[0.25em]">Session Templates</h3>
          </div>
          <div className={cn("transition-transform duration-300", showSplits ? "rotate-180" : "")}>
            <ChevronDown size={20} className="text-theme-text-tertiary group-hover:text-blue-500" />
          </div>
        </button>

        <AnimatePresence>
          {showSplits && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-5 overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4 pt-2">
                {trainingSessions.map(s => (
                  <div key={s.id} className="bg-theme-bg-secondary/50 p-5 rounded-2xl border border-white/5 flex justify-between items-center  relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
                    <div>
                      <h4 className="font-black text-theme-text-primary text-base tracking-tight leading-none">{s.name}</h4>
                      <p className="text-[9px] font-black text-theme-text-tertiary uppercase tracking-widest mt-2">{s.exercises.length} Exercises Programmed</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingSession(s)} className="w-10 h-10 flex items-center justify-center bg-theme-bg-tertiary text-blue-500 rounded-xl  border border-white/5 hover:scale-110 transition-transform">
                         <Edit2 size={16} />
                      </button>
                      <button onClick={() => s.id && handleDeleteSession(s.id)} className="w-10 h-10 flex items-center justify-center bg-theme-bg-tertiary text-red-400 rounded-xl  border border-white/5 hover:scale-110 transition-transform">
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setEditingSession({ name: '', exercises: [] })}
                className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-white/10 text-theme-text-tertiary rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:border-blue-500/40 hover:text-blue-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-2 group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Create Session Template
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <SplitEditorModal
        editingSession={editingSession}
        showPicker={showPicker}
        setShowPicker={setShowPicker}
        updateExInSession={updateExInSession}
        removeExFromSession={removeExFromSession}
        addExToSession={addExToSession}
        setEditingSession={setEditingSession}
        handleSaveSession={handleSaveSession}
      />

      <SettingsPortabilitySection onExport={exportBackup} onImport={importBackupFromFile} />

      <SettingsExercisePickerModal
        isOpen={showPicker !== null}
        onClose={() => setShowPicker(null)}
        onSelect={handleExerciseSelect}
      />
    </div>
  );
};

export default Settings;
