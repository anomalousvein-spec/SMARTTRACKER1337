import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '../../db/models';
import { estimateProgramWeek, groupSessionsByMonth } from '../../utils/sessionData';
import {
  deleteSessionById,
  getSessionsNewestFirst,
  getSessionsOldestFirst,
  updateSessionProgramWeek,
} from '../../repositories/sessionRepository';

export function useHistoryData() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWandFeedback, setShowWandFeedback] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const results = await getSessionsNewestFirst();
      setSessions(results);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const deleteSession = useCallback(
    async (id: number) => {
      await deleteSessionById(id);
      await loadSessions();
    },
    [loadSessions]
  );

  const updateSessionWeek = useCallback(
    async (id: number, week: number) => {
      await updateSessionProgramWeek(id, week);
      await loadSessions();
    },
    [loadSessions]
  );

  const autoAssignWeeks = useCallback(async () => {
    setIsProcessing(true);

    try {
      const allSessions = await getSessionsOldestFirst();
      if (allSessions.length === 0) return 0;

      const firstDate = new Date(allSessions[0].date).getTime();
      let updatedCount = 0;

      for (const session of allSessions) {
        if (session.programWeek === undefined && session.id) {
          const estimatedWeek = estimateProgramWeek(firstDate, session.date);
          await updateSessionProgramWeek(session.id, estimatedWeek);
          updatedCount += 1;
        }
      }

      await loadSessions();

      if (updatedCount > 0) {
        setShowWandFeedback(true);
        window.setTimeout(() => setShowWandFeedback(false), 3000);
      }

      return updatedCount;
    } catch (error) {
      console.error(error);
      return 0;
    } finally {
      setIsProcessing(false);
    }
  }, [loadSessions]);

  const groupedSessions = useMemo(() => groupSessionsByMonth(sessions), [sessions]);

  return {
    sessions,
    groupedSessions,
    loading,
    isProcessing,
    showWandFeedback,
    deleteSession,
    updateSessionWeek,
    autoAssignWeeks,
  };
}
