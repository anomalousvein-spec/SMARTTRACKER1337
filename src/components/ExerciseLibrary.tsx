import React, { useState, useEffect, useMemo } from 'react';
import type { Exercise } from '../db/models';
import { Search, Plus, X, ChevronRight, Dumbbell } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/ui';
import { createCustomExercise, exerciseNameExists, getAllExercises } from '../repositories/exerciseLibraryRepository';
import EmptyStateCard from './EmptyStateCard';

const MUSCLE_GROUPS = [
  "chest", "back", "quads", "hamstrings", "glutes", "shoulders", "biceps", "triceps", "core", "calves"
] as const;

const CATEGORIES = ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight", "Other"] as const;
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

interface Props {
  onSelect?: (exercise: Exercise) => void;
  onClose?: () => void;
  isPicker?: boolean;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

const ExerciseLibrary: React.FC<Props> = ({ onSelect, onClose, isPicker = false }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom Exercise Form State
  const [customEx, setCustomEx] = useState<Partial<Exercise>>({
    name: "",
    primaryMuscles: [],
    secondaryMuscles: [],
    category: "Other",
    movementPattern: "Other",
    difficulty: "Beginner",
    isCustom: true
  });

  useEffect(() => {
    void loadExercises();
  }, []);

  async function loadExercises() {
    try {
      const data = await getAllExercises();
      setExercises(data);
    } catch (err) {
      console.error("Failed to load exercises", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredExercises = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search);
    const searchTokens = normalizedSearch.split(' ').filter(Boolean);

    return exercises.filter(ex => {
      const normalizedName = normalizeSearchText(ex.name);
      const matchesSearch = normalizedSearch === '' ||
        normalizedName.includes(normalizedSearch) ||
        searchTokens.every((token) => normalizedName.includes(token));
      const matchesCategory = !filterCategory || ex.category === filterCategory;
      const matchesMuscle = !filterMuscle ||
        ex.primaryMuscles.includes(filterMuscle) ||
        ex.secondaryMuscles.includes(filterMuscle);

      return matchesSearch && matchesCategory && matchesMuscle;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, search, filterCategory, filterMuscle]);

  const handleAddCustom = async () => {
    const normalizedName = customEx.name?.trim() ?? '';
    if (!normalizedName || (customEx.primaryMuscles?.length ?? 0) === 0) return;

    try {
      if (await exerciseNameExists(normalizedName)) {
        alert(`${normalizedName} already exists in your exercise library.`);
        return;
      }

      const newEx = await createCustomExercise({
        ...customEx,
        name: normalizedName,
        createdAt: new Date().toISOString(),
        isCustom: true
      } as Exercise);

      setShowCustomModal(false);
      setCustomEx({
        name: "",
        primaryMuscles: [],
        secondaryMuscles: [],
        category: "Other",
        movementPattern: "Other",
        difficulty: "Beginner",
        isCustom: true
      });

      if (onSelect && newEx) {
        onSelect(newEx);
      } else {
        void loadExercises();
      }
    } catch (err) {
      console.error("Failed to add custom exercise", err);
    }
  };

  const toggleMuscleSelection = (muscle: string, isPrimary: boolean) => {
    setCustomEx(prev => {
      const key = isPrimary ? 'primaryMuscles' : 'secondaryMuscles';
      const current = prev[key] ?? [];
      const updated = current.includes(muscle)
        ? current.filter(m => m !== muscle)
        : [...current, muscle];

      return { ...prev, [key]: updated };
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-[11px] font-black text-theme-text-tertiary uppercase tracking-[0.18em] animate-pulse">Scanning Bio-Vault...</p>
    </div>
  );

  return (
    <div className={cn("space-y-8", isPicker && "max-h-[85vh] flex flex-col overflow-hidden p-1")}>
      <div className="flex justify-between items-end shrink-0 px-1">
        <div>
          <h2 className="text-[1.9rem] font-black text-theme-text-primary tracking-tight">{isPicker ? 'Select Exercise' : 'Exercise Library'}</h2>
          <p className="mt-1 text-[11px] font-black text-theme-text-tertiary uppercase tracking-[0.18em]">Exercise List</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCustomModal(true)}
            className="w-12 h-12 flex items-center justify-center bg-theme-accent rounded-2xl text-white   active:scale-90 transition-all hover:bg-blue-700"
          >
            <Plus size={24} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center bg-theme-bg-secondary border border-white/5 rounded-2xl text-theme-text-tertiary active:scale-90 transition-all hover:text-white"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 shrink-0 px-1">
        <div className="relative group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-tertiary group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search movement patterns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/5 bg-theme-bg-secondary py-4 pl-14 pr-6 text-base font-bold text-theme-text-primary outline-none transition-all focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              "whitespace-nowrap rounded-2xl border px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95",
              !filterCategory
                ? "bg-theme-accent border-blue-600 text-white "
                : "bg-theme-bg-secondary border-white/5 text-theme-text-tertiary"
            )}
          >
            All Types
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
              className={cn(
                "whitespace-nowrap rounded-2xl border px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95",
                filterCategory === cat
                  ? "bg-theme-accent border-blue-600 text-white "
                  : "bg-theme-bg-secondary border-white/5 text-theme-text-tertiary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {MUSCLE_GROUPS.map(muscle => (
            <button
              key={muscle}
              onClick={() => setFilterMuscle(muscle === filterMuscle ? null : muscle)}
              className={cn(
                "whitespace-nowrap rounded-2xl border px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95",
                filterMuscle === muscle
                  ? "bg-emerald-700 border-emerald-600 text-white "
                  : "bg-theme-bg-secondary border-white/5 text-theme-text-tertiary"
              )}
            >
              {muscle}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className={cn("space-y-3 px-1", isPicker && "overflow-y-auto pr-1 flex-grow scrollbar-hide")}>
        <AnimatePresence mode="popLayout">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((ex, idx) => (
              <m.div
                key={ex.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                onClick={() => onSelect?.(ex)}
                className="group flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-theme-bg-secondary p-4 transition-all active:scale-[0.98] hover:border-blue-500/30"
              >
                <div className="min-w-0 flex items-center gap-4">
                  <div className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    ex.isCustom ? "bg-amber-500/5 text-amber-500" : "bg-blue-500/5 text-blue-500"
                  )}>
                    <Dumbbell size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black leading-tight tracking-tight text-theme-text-primary">
                      {ex.name}
                      {ex.isCustom && <span className="ml-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-500">Custom</span>}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[10px] font-black text-theme-text-tertiary uppercase tracking-[0.14em]">
                      {ex.primaryMuscles.join(", ")}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-theme-text-tertiary group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </m.div>
            ))
          ) : (
            <EmptyStateCard
              icon={Search}
              eyebrow="Movement Search"
              title="No Matches Found"
              description="Try widening the search or clearing a filter to surface more movement options from the library."
              actionLabel="Reset Filters"
              onAction={() => { setFilterCategory(null); setFilterMuscle(null); setSearch(''); }}
              compact
            />
          )}
        </AnimatePresence>
      </div>

      {/* Custom Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCustomModal(false)}
            />
            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-theme-bg-primary rounded-t-[3.5rem] sm:rounded-2xl border-t sm:border border-white/10 p-6  overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="w-16 h-2 bg-gray-200 bg-theme-bg-tertiary rounded-full mx-auto mb-6 shrink-0" />
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-theme-text-primary tracking-tight">New Exercise</h3>
                <button onClick={() => setShowCustomModal(false)} className="w-10 h-10 flex items-center justify-center text-theme-text-tertiary hover:text-white bg-white/5 rounded-xl">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto pr-1 scrollbar-hide">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-tertiary ml-2">Exercise Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Zottman Curl"
                    value={customEx.name}
                    onChange={(e) => setCustomEx(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-50 bg-theme-bg-secondary border border-white/5 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-blue-500/10 text-theme-text-primary  font-bold"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-tertiary ml-2">Primary Muscles</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {MUSCLE_GROUPS.map(muscle => (
                      <button
                        key={muscle}
                        onClick={() => toggleMuscleSelection(muscle, true)}
                        className={cn(
                          "rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-all active:scale-90",
                          customEx.primaryMuscles?.includes(muscle)
                            ? "bg-theme-accent border-blue-600 text-white "
                            : "bg-theme-bg-tertiary/50 border-white/5 text-theme-text-tertiary"
                        )}
                      >
                        {muscle}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-tertiary ml-2">Category</label>
                    <select
                      value={customEx.category}
                      onChange={(e) =>
                        setCustomEx((prev) => ({ ...prev, category: e.target.value as Exercise['category'] }))
                      }
                      className="w-full appearance-none rounded-2xl border border-white/5 bg-gray-50 bg-theme-bg-secondary px-4 py-3 text-[11px] font-black text-theme-text-primary uppercase tracking-[0.12em] outline-none"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-tertiary ml-2">Difficulty</label>
                    <select
                      value={customEx.difficulty}
                      onChange={(e) =>
                        setCustomEx((prev) => ({ ...prev, difficulty: e.target.value as Exercise['difficulty'] }))
                      }
                      className="w-full appearance-none rounded-2xl border border-white/5 bg-gray-50 bg-theme-bg-secondary px-4 py-3 text-[11px] font-black text-theme-text-primary uppercase tracking-[0.12em] outline-none"
                    >
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddCustom}
                  disabled={!customEx.name || (customEx.primaryMuscles?.length ?? 0) === 0}
                  className="w-full bg-theme-accent py-5 rounded-2xl text-white font-black uppercase tracking-[0.3em] text-[11px]   active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale mt-4"
                >
                  Save Exercise
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExerciseLibrary;
