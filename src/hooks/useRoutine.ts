import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { STORAGE_KEYS } from '@/constants/storage';
import type { RoutineData, RoutineBlock } from '@/types';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function blocksOverlap(a: RoutineBlock, b: RoutineBlock): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

export function useRoutine() {
  const { data: routineData, save, loading } = useStorage<RoutineData>(STORAGE_KEYS.ROUTINE, {});

  const getBlocksForDay = useCallback((dayIndex: number): RoutineBlock[] => {
    return (routineData[String(dayIndex)] ?? []).sort((a, b) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
  }, [routineData]);

  const addBlock = useCallback(async (dayIndex: number, block: RoutineBlock): Promise<boolean> => {
    const existing = routineData[String(dayIndex)] ?? [];
    const hasOverlap = existing.some(b => blocksOverlap(b, block));
    if (hasOverlap) return false;

    const updated = {
      ...routineData,
      [String(dayIndex)]: [...existing, block],
    };
    await save(updated);
    return true;
  }, [routineData, save]);

  const removeBlock = useCallback(async (dayIndex: number, blockId: string) => {
    const existing = routineData[String(dayIndex)] ?? [];
    const updated = {
      ...routineData,
      [String(dayIndex)]: existing.filter(b => b.id !== blockId),
    };
    await save(updated);
  }, [routineData, save]);

  return { routineData, loading, getBlocksForDay, addBlock, removeBlock };
}
