'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerState, Session, TimerPhase } from '@/lib/types';
import { sessionStorage, settingsStorage } from '@/lib/storage';

export function useTimer() {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    currentSession: null,
    timeRemaining: 0,
    sessionCount: 0,
    currentHabitId: null
  });

  const [currentPhase, setCurrentPhase] = useState<TimerPhase>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3'); // We'll create this later
      audioRef.current.volume = settingsStorage.get().pomodoro.soundVolume;
    }
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused && timerState.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused, timerState.timeRemaining]);

  // Handle session completion
  useEffect(() => {
    if (timerState.isRunning && timerState.timeRemaining === 0) {
      handleSessionComplete();
    }
  }, [timerState.timeRemaining, timerState.isRunning]);

  const playNotificationSound = useCallback(() => {
    const settings = settingsStorage.get();
    if (settings.pomodoro.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const handleSessionComplete = useCallback(() => {
    if (!timerState.currentSession) return;

    const completedSession: Session = {
      ...timerState.currentSession,
      endTime: new Date(),
      completed: true,
      duration: Math.round((Date.now() - timerState.currentSession.startTime.getTime()) / 60000)
    };

    // Save completed session
    sessionStorage.update(completedSession.id, {
      endTime: completedSession.endTime,
      completed: true,
      duration: completedSession.duration
    });

    playNotificationSound();

    const settings = settingsStorage.get();
    const { longBreakInterval } = settings.pomodoro;

    // Determine next phase
    if (currentPhase === 'work') {
      const newSessionCount = timerState.sessionCount + 1;
      const nextPhase: TimerPhase = 
        newSessionCount % longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
      
      setCurrentPhase(nextPhase);
      setTimerState(prev => ({
        ...prev,
        sessionCount: newSessionCount,
        isRunning: false,
        currentSession: null
      }));

      // Auto-start break if enabled
      if (settings.pomodoro.autoStartBreaks) {
        setTimeout(() => startBreakSession(nextPhase), 1000);
      }
    } else {
      // Break completed
      setCurrentPhase('work');
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        currentSession: null
      }));

      // Auto-start work session if enabled
      if (settings.pomodoro.autoStartWorkSessions) {
        setTimeout(() => {
          if (timerState.currentHabitId) {
            startWorkSession(timerState.currentHabitId);
          }
        }, 1000);
      }
    }
  }, [timerState, currentPhase, playNotificationSound]);

  const startWorkSession = useCallback((habitId: string) => {
    const settings = settingsStorage.get();
    const duration = settings.pomodoro.workDuration * 60; // Convert to seconds

    const newSession: Session = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      habitId,
      startTime: new Date(),
      duration: settings.pomodoro.workDuration,
      completed: false,
      type: 'work'
    };

    // Save session to storage
    sessionStorage.add(newSession);

    setTimerState({
      isRunning: true,
      isPaused: false,
      currentSession: newSession,
      timeRemaining: duration,
      sessionCount: timerState.sessionCount,
      currentHabitId: habitId
    });

    setCurrentPhase('work');
  }, [timerState.sessionCount]);

  const startBreakSession = useCallback((breakType: 'shortBreak' | 'longBreak') => {
    const settings = settingsStorage.get();
    const duration = breakType === 'shortBreak' 
      ? settings.pomodoro.shortBreakDuration * 60
      : settings.pomodoro.longBreakDuration * 60;

    const newSession: Session = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      habitId: timerState.currentHabitId || '',
      startTime: new Date(),
      duration: duration / 60,
      completed: false,
      type: 'break'
    };

    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentSession: newSession,
      timeRemaining: duration
    }));

    setCurrentPhase(breakType);
  }, [timerState.currentHabitId]);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  }, []);

  const stopTimer = useCallback(() => {
    if (timerState.currentSession && !timerState.currentSession.completed) {
      // Mark session as incomplete
      sessionStorage.update(timerState.currentSession.id, {
        endTime: new Date(),
        completed: false,
        duration: Math.round((Date.now() - timerState.currentSession.startTime.getTime()) / 60000)
      });
    }

    setTimerState({
      isRunning: false,
      isPaused: false,
      currentSession: null,
      timeRemaining: 0,
      sessionCount: 0,
      currentHabitId: null
    });
    
    setCurrentPhase('idle');
  }, [timerState.currentSession]);

  const resetSessionCount = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      sessionCount: 0
    }));
  }, []);

  // Format time for display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback(() => {
    if (!timerState.currentSession) return 0;
    
    const settings = settingsStorage.get();
    let totalDuration: number;
    
    if (currentPhase === 'work') {
      totalDuration = settings.pomodoro.workDuration * 60;
    } else if (currentPhase === 'shortBreak') {
      totalDuration = settings.pomodoro.shortBreakDuration * 60;
    } else {
      totalDuration = settings.pomodoro.longBreakDuration * 60;
    }
    
    return ((totalDuration - timerState.timeRemaining) / totalDuration) * 100;
  }, [timerState, currentPhase]);

  return {
    timerState,
    currentPhase,
    startWorkSession,
    startBreakSession,
    pauseTimer,
    stopTimer,
    resetSessionCount,
    formatTime,
    getProgress
  };
}