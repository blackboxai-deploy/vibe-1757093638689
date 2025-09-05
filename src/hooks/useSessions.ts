'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session, DailyStats, CalendarDay } from '@/lib/types';
import { sessionStorage } from '@/lib/storage';
import { startOfDay, endOfDay, format } from 'date-fns';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const loadedSessions = sessionStorage.getAll();
    setSessions(loadedSessions);
    setLoading(false);
  }, []);

  const getSessionsByHabit = useCallback((habitId: string) => {
    return sessions.filter(session => session.habitId === habitId);
  }, [sessions]);

  const getSessionsByDate = useCallback((date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= dayStart && sessionDate <= dayEnd;
    });
  }, [sessions]);

  const getSessionsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startOfDay(startDate) && sessionDate <= endOfDay(endDate);
    });
  }, [sessions]);

  const getTodaysSessions = useCallback(() => {
    return getSessionsByDate(new Date());
  }, [getSessionsByDate]);

  const getCompletedSessionsToday = useCallback((habitId?: string) => {
    const todaySessions = getTodaysSessions();
    const completedSessions = todaySessions.filter(session => 
      session.completed && session.type === 'work'
    );
    
    if (habitId) {
      return completedSessions.filter(session => session.habitId === habitId);
    }
    
    return completedSessions;
  }, [getTodaysSessions]);

  const getTotalMinutesToday = useCallback((habitId?: string) => {
    const completedSessions = getCompletedSessionsToday(habitId);
    return completedSessions.reduce((total, session) => total + session.duration, 0);
  }, [getCompletedSessionsToday]);

  const getStreakForHabit = useCallback((habitId: string, targetSessions: number = 1) => {
    const habitSessions = getSessionsByHabit(habitId);
    const sessionsByDate = new Map<string, Session[]>();
    
    // Group sessions by date
    habitSessions.forEach(session => {
      if (session.completed && session.type === 'work') {
        const dateKey = format(new Date(session.startTime), 'yyyy-MM-dd');
        if (!sessionsByDate.has(dateKey)) {
          sessionsByDate.set(dateKey, []);
        }
        sessionsByDate.get(dateKey)!.push(session);
      }
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    
    // Check streak going backwards from today
    for (let i = 0; i < 365; i++) { // Check up to a year back
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = format(checkDate, 'yyyy-MM-dd');
      
      const daySessions = sessionsByDate.get(dateKey) || [];
      const goalMet = daySessions.length >= targetSessions;
      
      if (goalMet) {
        tempStreak++;
        if (i === 0 || (currentStreak === 0 && tempStreak > 0)) {
          currentStreak = tempStreak;
        }
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        if (i === 0) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }
    
    return {
      current: currentStreak,
      longest: Math.max(longestStreak, tempStreak)
    };
  }, [getSessionsByHabit]);

  const getDailyStats = useCallback((date: Date, habitId?: string): DailyStats[] => {
    const daySessions = getSessionsByDate(date);
    const completedWorkSessions = daySessions.filter(session => 
      session.completed && session.type === 'work'
    );

    if (habitId) {
      const habitSessions = completedWorkSessions.filter(session => session.habitId === habitId);
      return [{
        date: format(date, 'yyyy-MM-dd'),
        habitId,
        sessionsCompleted: habitSessions.length,
        totalMinutes: habitSessions.reduce((sum, session) => sum + session.duration, 0),
        targetReached: habitSessions.length >= 1 // This should be based on habit target
      }];
    }

    // Group by habit
    const habitGroups = new Map<string, Session[]>();
    completedWorkSessions.forEach(session => {
      if (!habitGroups.has(session.habitId)) {
        habitGroups.set(session.habitId, []);
      }
      habitGroups.get(session.habitId)!.push(session);
    });

    return Array.from(habitGroups.entries()).map(([habitId, habitSessions]) => ({
      date: format(date, 'yyyy-MM-dd'),
      habitId,
      sessionsCompleted: habitSessions.length,
      totalMinutes: habitSessions.reduce((sum, session) => sum + session.duration, 0),
      targetReached: habitSessions.length >= 1 // This should be based on habit target
    }));
  }, [getSessionsByDate]);

  const getCalendarData = useCallback((month: Date, habits: Array<{id: string, targetSessions: number}>) => {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const monthSessions = getSessionsByDateRange(startDate, endDate);
    
    const calendarDays: CalendarDay[] = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      const daySessions = monthSessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return format(sessionDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') &&
               session.completed && session.type === 'work';
      });

      const habitData = habits.map(habit => {
        const habitSessions = daySessions.filter(session => session.habitId === habit.id);
        return {
          habitId: habit.id,
          sessionsCompleted: habitSessions.length,
          targetSessions: habit.targetSessions,
          completionRate: habit.targetSessions > 0 ? 
            Math.min(habitSessions.length / habit.targetSessions, 1) : 0
        };
      });

      calendarDays.push({
        date: new Date(currentDate),
        habits: habitData,
        totalSessions: daySessions.length
      });
    }

    return calendarDays;
  }, [getSessionsByDateRange]);

  const refreshSessions = useCallback(() => {
    const loadedSessions = sessionStorage.getAll();
    setSessions(loadedSessions);
  }, []);

  return {
    sessions,
    loading,
    getSessionsByHabit,
    getSessionsByDate,
    getSessionsByDateRange,
    getTodaysSessions,
    getCompletedSessionsToday,
    getTotalMinutesToday,
    getStreakForHabit,
    getDailyStats,
    getCalendarData,
    refreshSessions
  };
}