import { useCallback, useMemo } from 'react';
import { useStorage } from './useStorage';
import { STORAGE_KEYS } from '@/constants/storage';
import type { Supplement } from '@/types';
import { format, subDays } from 'date-fns';
import { scheduleSupplementReminder, cancelSupplementReminder } from '@/utils/notifications';

export function useSupplements() {
  const { data: supplements, save, loading } = useStorage<Supplement[]>(STORAGE_KEYS.SUPPLEMENTS, []);

  const today = format(new Date(), 'yyyy-MM-dd');

  const addSupplement = useCallback(async (supplement: Supplement) => {
    await save([...supplements, supplement]);
    await scheduleSupplementReminder(supplement);
  }, [supplements, save]);

  const removeSupplement = useCallback(async (id: string) => {
    await save(supplements.filter(s => s.id !== id));
    await cancelSupplementReminder(id);
  }, [supplements, save]);

  const recordAction = useCallback(async (id: string, status: 'taken' | 'skipped', date: string) => {
    const updated = supplements.map(s => {
      if (s.id !== id) return s;
      const historyWithout = s.history.filter(h => h.date !== date);
      return { ...s, history: [...historyWithout, { date, status }] };
    });
    await save(updated);
  }, [supplements, save]);

  const getStatusForDate = useCallback((supplement: Supplement, date: string) => {
    return supplement.history.find(h => h.date === date)?.status ?? null;
  }, []);

  // Global streak: consecutive days where ALL supplements were taken
  const globalStreak = useMemo(() => {
    if (supplements.length === 0) return 0;
    let streak = 0;
    let checkDate = new Date();
    // Allow today to not be complete yet (start checking from yesterday if today incomplete)
    const allTakenToday = supplements.every(s =>
      s.history.some(h => h.date === today && h.status === 'taken')
    );
    if (!allTakenToday) checkDate = subDays(checkDate, 1);

    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const allTaken = supplements.every(s =>
        s.history.some(h => h.date === dateStr && h.status === 'taken')
      );
      if (allTaken) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    return streak;
  }, [supplements, today]);

  const takenTodayCount = supplements.filter(s =>
    s.history.some(h => h.date === today && h.status === 'taken')
  ).length;

  return {
    supplements, loading,
    addSupplement, removeSupplement, recordAction,
    getStatusForDate, takenTodayCount, globalStreak,
  };
}
