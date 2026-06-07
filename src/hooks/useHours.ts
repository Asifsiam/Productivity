import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { STORAGE_KEYS } from '@/constants/storage';
import type { HoursEntry, HoursSettings } from '@/types';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, getMonth, getYear } from 'date-fns';

const DEFAULT_SETTINGS: HoursSettings = {
  hourlyRate: 100,
  defaultLunchMinutes: 30,
  lunchEnabled: true,
};

function calcHoursWorked(clockIn: string, clockOut: string, lunchMinutes: number): number {
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - lunchMinutes;
  return Math.max(0, totalMinutes / 60);
}

export function useHours() {
  const { data: entries, save: saveEntries, loading: loadingEntries } = useStorage<HoursEntry[]>(
    STORAGE_KEYS.HOURS_ENTRIES, []
  );
  const { data: settings, save: saveSettings, loading: loadingSettings } = useStorage<HoursSettings>(
    STORAGE_KEYS.HOURS_SETTINGS, DEFAULT_SETTINGS
  );

  const addEntry = useCallback(async (
    date: string,
    clockIn: string,
    clockOut: string,
    lunchMinutes: number
  ) => {
    const hoursWorked = calcHoursWorked(clockIn, clockOut, lunchMinutes);
    const earnings = hoursWorked * settings.hourlyRate;
    const entry: HoursEntry = {
      id: Date.now().toString(),
      date,
      clockIn,
      clockOut,
      lunchMinutes,
      hoursWorked,
      earnings,
    };
    // Replace if same date exists
    const filtered = entries.filter(e => e.date !== date);
    await saveEntries([...filtered, entry]);
  }, [entries, saveEntries, settings.hourlyRate]);

  const removeEntry = useCallback(async (id: string) => {
    await saveEntries(entries.filter(e => e.id !== id));
  }, [entries, saveEntries]);

  const updateSettings = useCallback(async (s: HoursSettings) => {
    await saveSettings(s);
  }, [saveSettings]);

  const getEntryForDate = useCallback((date: string) => {
    return entries.find(e => e.date === date) ?? null;
  }, [entries]);

  const getWeekEntries = useCallback((date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const end = endOfWeek(date, { weekStartsOn: 0 });
    return entries.filter(e => {
      try {
        return isWithinInterval(parseISO(e.date), { start, end });
      } catch { return false; }
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  const getMonthEntries = useCallback((year: number, month: number) => {
    return entries
      .filter(e => {
        const d = parseISO(e.date);
        return getYear(d) === year && getMonth(d) === month;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  const getMonthStats = useCallback((year: number, month: number) => {
    const monthEntries = entries.filter(e => {
      const d = parseISO(e.date);
      return getYear(d) === year && getMonth(d) === month;
    });
    const totalHours = monthEntries.reduce((sum, e) => sum + e.hoursWorked, 0);
    const totalEarnings = monthEntries.reduce((sum, e) => sum + e.earnings, 0);
    return { totalHours, totalEarnings };
  }, [entries]);

  return {
    entries,
    settings,
    loading: loadingEntries || loadingSettings,
    addEntry,
    removeEntry,
    updateSettings,
    getEntryForDate,
    getWeekEntries,
    getMonthEntries,
    getMonthStats,
    calcHoursWorked,
  };
}
