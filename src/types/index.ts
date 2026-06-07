export interface Supplement {
  id: string;
  name: string;
  dose: string;
  notes: string;
  scheduleType: 'daily' | 'specific_days' | 'cycle';
  scheduleDays?: number[]; // 0=Sun..6=Sat
  cycleOn?: number;
  cycleOff?: number;
  cycleStartDate?: string;
  reminderTime?: string; // "HH:MM"
  history: { date: string; status: 'taken' | 'skipped' }[];
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
  date: string;      // "YYYY-MM-DD"
  clockIn: string;   // "HH:MM"
  clockOut: string;  // "HH:MM"
  lunchAllowance: number; // ৳ amount added to earnings
  hoursWorked: number;
  earnings: number;
}

export interface HoursSettings {
  hourlyRate: number;
}
