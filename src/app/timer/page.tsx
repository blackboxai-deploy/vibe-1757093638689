'use client';

import { useState, useEffect } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useTimer } from '@/hooks/useTimer';
import { useSessions } from '@/hooks/useSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { settingsStorage } from '@/lib/storage';

export default function TimerPage() {
  const { habits } = useHabits();
  const { 
    timerState, 
    currentPhase, 
    startWorkSession, 
    startBreakSession, 
    pauseTimer, 
    stopTimer, 
    formatTime, 
    getProgress 
  } = useTimer();
  const { refreshSessions } = useSessions();
  
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const [settings] = useState(settingsStorage.get());

  const activeHabits = habits.filter(habit => habit.isActive);
  const selectedHabit = habits.find(h => h.id === selectedHabitId);
  const progress = getProgress();

  useEffect(() => {
    // Set first active habit as default if none selected
    if (!selectedHabitId && activeHabits.length > 0) {
      setSelectedHabitId(activeHabits[0].id);
    }
  }, [activeHabits, selectedHabitId]);

  // Refresh sessions when timer completes
  useEffect(() => {
    if (!timerState.isRunning && timerState.currentSession?.completed) {
      refreshSessions();
    }
  }, [timerState.isRunning, timerState.currentSession, refreshSessions]);

  const handleStartWorkSession = () => {
    if (!selectedHabitId) {
      alert('Please select a habit first');
      return;
    }
    startWorkSession(selectedHabitId);
  };

  const handleStartBreak = (breakType: 'shortBreak' | 'longBreak') => {
    startBreakSession(breakType);
  };

  const getNextBreakType = (): 'shortBreak' | 'longBreak' => {
    return (timerState.sessionCount + 1) % settings.pomodoro.longBreakInterval === 0 
      ? 'longBreak' 
      : 'shortBreak';
  };

  // Get phase display info
  const getPhaseInfo = () => {
    switch (currentPhase) {
      case 'work':
        return {
          title: 'Focus Time',
          description: selectedHabit ? `Working on: ${selectedHabit.name}` : 'Work session in progress',
          emoji: '🎯',
          color: 'bg-primary'
        };
      case 'shortBreak':
        return {
          title: 'Short Break',
          description: 'Take a quick break and recharge',
          emoji: '☕',
          color: 'bg-green-500'
        };
      case 'longBreak':
        return {
          title: 'Long Break',
          description: 'Time for a longer break - well done!',
          emoji: '🌟',
          color: 'bg-blue-500'
        };
      default:
        return {
          title: 'Ready to Focus',
          description: 'Select a habit and start your first session',
          emoji: '⏱️',
          color: 'bg-muted'
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Pomodoro Timer</h1>
        <p className="text-muted-foreground">
          Focus on your habits with structured work sessions
        </p>
      </div>

      {/* Main Timer Card */}
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">{phaseInfo.emoji}</span>
            <CardTitle>{phaseInfo.title}</CardTitle>
          </div>
          <CardDescription>{phaseInfo.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          {/* Circular Progress Indicator */}
          <div className="relative w-48 h-48 mx-auto">
            <div className="absolute inset-0 w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted stroke-current opacity-20"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000 ease-in-out",
                    currentPhase === 'work' ? 'text-primary' :
                    currentPhase === 'shortBreak' ? 'text-green-500' :
                    currentPhase === 'longBreak' ? 'text-blue-500' :
                    'text-muted-foreground'
                  )}
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                />
              </svg>
            </div>
            
            {/* Timer display in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={cn(
                  "text-4xl font-bold font-mono",
                  timerState.isRunning ? "timer-active" : ""
                )}>
                  {timerState.isRunning || currentPhase !== 'idle' 
                    ? formatTime(timerState.timeRemaining)
                    : formatTime(settings.pomodoro.workDuration * 60)
                  }
                </div>
                {timerState.isRunning && (
                  <Badge 
                    variant={currentPhase === 'work' ? 'default' : 'secondary'} 
                    className="mt-2"
                  >
                    {timerState.isPaused ? 'Paused' : 
                     currentPhase === 'work' ? 'Working' : 'Break'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Session Counter */}
          {(timerState.sessionCount > 0 || timerState.isRunning) && (
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Sessions Completed</div>
              <div className="flex justify-center gap-1">
                {Array.from({ length: settings.pomodoro.longBreakInterval }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full border-2",
                      i < timerState.sessionCount
                        ? "bg-primary border-primary"
                        : "border-muted-foreground bg-transparent"
                    )}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {timerState.sessionCount} / {settings.pomodoro.longBreakInterval} until long break
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-4">
            {!timerState.isRunning && currentPhase === 'idle' && (
              <>
                {/* Habit Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Habit</label>
                  <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a habit to work on" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeHabits.map((habit) => (
                        <SelectItem key={habit.id} value={habit.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: habit.color }}
                            />
                            {habit.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleStartWorkSession}
                  disabled={!selectedHabitId || activeHabits.length === 0}
                >
                  <span className="mr-2">▶️</span>
                  Start Focus Session
                </Button>
              </>
            )}

            {timerState.isRunning && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={pauseTimer}
                >
                  {timerState.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="lg"
                  onClick={stopTimer}
                >
                  ⏹️ Stop
                </Button>
              </div>
            )}

            {!timerState.isRunning && currentPhase === 'work' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Session completed! Take a break:</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleStartBreak('shortBreak')}
                  >
                    ☕ Short Break ({settings.pomodoro.shortBreakDuration}m)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleStartBreak('longBreak')}
                  >
                    🌟 Long Break ({settings.pomodoro.longBreakDuration}m)
                  </Button>
                </div>
                <Button 
                  className="w-full mt-2"
                  onClick={handleStartWorkSession}
                  disabled={!selectedHabitId}
                >
                  ▶️ Start Another Session
                </Button>
              </div>
            )}

            {!timerState.isRunning && (currentPhase === 'shortBreak' || currentPhase === 'longBreak') && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Break completed! Ready to work:</p>
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleStartWorkSession}
                  disabled={!selectedHabitId}
                >
                  ▶️ Start Next Session
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{timerState.sessionCount}</div>
            <p className="text-xs text-muted-foreground">Sessions Today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(timerState.sessionCount * settings.pomodoro.workDuration)}m
            </div>
            <p className="text-xs text-muted-foreground">Total Focus Time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {getNextBreakType() === 'longBreak' 
                ? settings.pomodoro.longBreakInterval - (timerState.sessionCount % settings.pomodoro.longBreakInterval)
                : settings.pomodoro.longBreakInterval - (timerState.sessionCount % settings.pomodoro.longBreakInterval)
              }
            </div>
            <p className="text-xs text-muted-foreground">Sessions Until Long Break</p>
          </CardContent>
        </Card>
      </div>

      {/* No Habits Message */}
      {activeHabits.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <span className="text-4xl mb-4 block">🎯</span>
            <h3 className="text-lg font-medium mb-2">No Active Habits</h3>
            <p className="text-muted-foreground mb-4">
              You need to create and activate habits before you can start timer sessions.
            </p>
            <Button>
              Go to Habits
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}