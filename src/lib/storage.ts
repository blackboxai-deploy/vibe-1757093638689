// Local storage utilities for data persistence

import { Habit, Session, AppSettings, PomodoroSettings } from './types';

// Storage keys
const STORAGE_KEYS = {
  HABITS: 'habits',
  SESSIONS: 'sessions', 
  SETTINGS: 'appSettings',
  DAILY_STATS: 'dailyStats',
  STREAKS: 'habitStreaks'
} as const;

// Default settings
export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWorkSessions: false,
  soundEnabled: true,
  soundVolume: 0.7
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'system',
  pomodoro: DEFAULT_POMODORO_SETTINGS,
  notifications: {
    enabled: true,
    sessionComplete: true,
    breakTime: true,
    dailyGoalAchieved: true
  }
};

// Generic storage functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    // Convert date strings back to Date objects for habits and sessions
    if (key === STORAGE_KEYS.HABITS) {
      return (parsed as Habit[]).map(habit => ({
        ...habit,
        createdAt: new Date(habit.createdAt),
        updatedAt: new Date(habit.updatedAt)
      })) as T;
    }
    
    if (key === STORAGE_KEYS.SESSIONS) {
      return (parsed as Session[]).map(session => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined
      })) as T;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error);
  }
}

// Habit storage functions
export const habitStorage = {
  getAll(): Habit[] {
    return getFromStorage(STORAGE_KEYS.HABITS, []);
  },
  
  save(habits: Habit[]): void {
    saveToStorage(STORAGE_KEYS.HABITS, habits);
  },
  
  add(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Habit {
    const habits = this.getAll();
    const newHabit: Habit = {
      ...habit,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    habits.push(newHabit);
    this.save(habits);
    return newHabit;
  },
  
  update(habitId: string, updates: Partial<Habit>): Habit | null {
    const habits = this.getAll();
    const index = habits.findIndex(h => h.id === habitId);
    
    if (index === -1) return null;
    
    habits[index] = {
      ...habits[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.save(habits);
    return habits[index];
  },
  
  delete(habitId: string): boolean {
    const habits = this.getAll();
    const filtered = habits.filter(h => h.id !== habitId);
    
    if (filtered.length === habits.length) return false;
    
    this.save(filtered);
    // Also clean up related sessions
    sessionStorage.deleteByHabit(habitId);
    return true;
  }
};

// Session storage functions
export const sessionStorage = {
  getAll(): Session[] {
    return getFromStorage(STORAGE_KEYS.SESSIONS, []);
  },
  
  save(sessions: Session[]): void {
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
  },
  
  add(session: Omit<Session, 'id'>): Session {
    const sessions = this.getAll();
    const newSession: Session = {
      ...session,
      id: generateId()
    };
    
    sessions.push(newSession);
    this.save(sessions);
    return newSession;
  },
  
  update(sessionId: string, updates: Partial<Session>): Session | null {
    const sessions = this.getAll();
    const index = sessions.findIndex(s => s.id === sessionId);
    
    if (index === -1) return null;
    
    sessions[index] = { ...sessions[index], ...updates };
    this.save(sessions);
    return sessions[index];
  },
  
  getByHabit(habitId: string): Session[] {
    return this.getAll().filter(session => session.habitId === habitId);
  },
  
  getByDateRange(startDate: Date, endDate: Date): Session[] {
    return this.getAll().filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  },
  
  deleteByHabit(habitId: string): void {
    const sessions = this.getAll().filter(session => session.habitId !== habitId);
    this.save(sessions);
  }
};

// Settings storage functions
export const settingsStorage = {
  get(): AppSettings {
    return getFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_APP_SETTINGS);
  },
  
  save(settings: AppSettings): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  },
  
  updatePomodoro(pomodoroSettings: Partial<PomodoroSettings>): void {
    const currentSettings = this.get();
    const updatedSettings = {
      ...currentSettings,
      pomodoro: { ...currentSettings.pomodoro, ...pomodoroSettings }
    };
    this.save(updatedSettings);
  }
};

// Utility functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function exportData() {
  return {
    habits: habitStorage.getAll(),
    sessions: sessionStorage.getAll(),
    settings: settingsStorage.get(),
    exportDate: new Date().toISOString()
  };
}

export function importData(data: ReturnType<typeof exportData>): void {
  if (data.habits) habitStorage.save(data.habits);
  if (data.sessions) sessionStorage.save(data.sessions);
  if (data.settings) settingsStorage.save(data.settings);
}