// Core data types for the habit formation app

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: string;
  targetSessions: number; // Target sessions per day
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  habitId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  completed: boolean;
  type: 'work' | 'break';
  notes?: string;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // after how many work sessions
  autoStartBreaks: boolean;
  autoStartWorkSessions: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0-1
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  pomodoro: PomodoroSettings;
  notifications: {
    enabled: boolean;
    sessionComplete: boolean;
    breakTime: boolean;
    dailyGoalAchieved: boolean;
  };
}

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  habitId: string;
  sessionsCompleted: number;
  totalMinutes: number;
  targetReached: boolean;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentSession: Session | null;
  timeRemaining: number; // in seconds
  sessionCount: number; // work sessions completed today
  currentHabitId: string | null;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}

// Utility types
export type HabitCategory = 'health' | 'learning' | 'productivity' | 'personal' | 'fitness' | 'creative';

export type TimerPhase = 'work' | 'shortBreak' | 'longBreak' | 'idle';

export interface CalendarDay {
  date: Date;
  habits: {
    habitId: string;
    sessionsCompleted: number;
    targetSessions: number;
    completionRate: number;
  }[];
  totalSessions: number;
}