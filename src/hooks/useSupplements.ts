import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { STORAGE_KEYS } from '@/constants/storage';
import type { Supplement } from '@/types';
import { format } from 'date-fns';

export function useSupplements() {
  const { data: supplements, save, loading } = useStorage<Supplement[]>(STORAGE_KEYS.SUPPLEMENTS, []);

  const today = format(new Date(), 'yyyy-MM-dd');

  const addSupplement = useCallback(async (supplement: Supplement) => {
    await save([...supplements, supplement]);
  }, [supplements, save]);

  const removeSupplement = useCallback(async (id: string) => {
    await save(supplements.filter(s => s.id !== id));
  }, [supplements, save]);

  const recordAction = useCallback(async (id: string, status: 'taken' | 'skipped') => {
    const updated = supplements.map(s => {
      if (s.id !== id) return s;
      // Remove existing today entry if any
      const historyWithoutToday = s.history.filter(h => h.date !== today);
      const newHistory = [...historyWithoutToday, { date: today, status }];

      // Recalculate streak
      let streak = 0;
      if (status === 'taken') {
        const sortedHistory = [...newHistory]
          .filter(h => h.status === 'taken')
          .sort((a, b) => b.date.localeCompare(a.date));

        let checkDate = new Date();
        for (const entry of sortedHistory) {
          const entryDate = format(new Date(entry.date), 'yyyy-MM-dd');
          const checkDateStr = format(checkDate, 'yyyy-MM-dd');
          if (entryDate === checkDateStr) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      } else {
        streak = 0;
      }

      return { ...s, history: newHistory, streak };
    });
    await save(updated);
  }, [supplements, save, today]);

  const getTodayStatus = useCallback((supplement: Supplement) => {
    return supplement.history.find(h => h.date === today)?.status ?? null;
  }, [today]);

  const takenTodayCount = supplements.filter(s =>
    s.history.some(h => h.date === today && h.status === 'taken')
  ).length;

  return {
    supplements,
    loading,
    addSupplement,
    removeSupplement,
    recordAction,
    getTodayStatus,
    takenTodayCount,
  };
}
