export interface Supplement {
  id: string;
  name: string;
  dose: string;
  notes: string;
  scheduleType: 'daily' | 'specific_days' | 'cycle';
  scheduleDays?: number[]; // 0=Sun..6=Sat for specific_days
  cycleOn?: number;  // for cycle type
  cycleOff?: number;
  cycleStartDate?: string; // ISO date
  reminderTime?: string; // "HH:MM"
  history: { date: string; status: 'taken' | 'skipped' }[];
  streak: number;
  createdAt: string;
}

export interface RoutineBlock {
  id: string;
  label: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  color: string;
}

export type RoutineData = Record<string, RoutineBlock[]>; // key: "0".."6" (0=Sun)

export interface Todo {
  id: string;
  text: string;
  status: 'pending' | 'completed' | 'skipped';
  createdAt: string;
  completedAt?: string;
}

export interface HoursEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  clockIn: string; // "HH:MM"
  clockOut: string; // "HH:MM"
  lunchMinutes: number;
  hoursWorked: number;
  earnings: number;
}

export interface HoursSettings {
  hourlyRate: number;
  defaultLunchMinutes: number;
  lunchEnabled: boolean;
}
