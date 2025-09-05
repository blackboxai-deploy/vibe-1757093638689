'use client';

import { useHabits } from '@/hooks/useHabits';
import { useSessions } from '@/hooks/useSessions';
import { useTimer } from '@/hooks/useTimer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
// import { format } from 'date-fns';

export default function Dashboard() {
  const { habits, loading: habitsLoading } = useHabits();
  const { getCompletedSessionsToday, getTotalMinutesToday } = useSessions();
  const { timerState, currentPhase, formatTime } = useTimer();

  const activeHabits = habits.filter(habit => habit.isActive);
  const totalMinutesToday = getTotalMinutesToday();
  const totalSessionsToday = getCompletedSessionsToday().length;

  if (habitsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your progress for {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeHabits.length}</div>
            <p className="text-xs text-muted-foreground">
              {habits.length - activeHabits.length} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessionsToday}</div>
            <p className="text-xs text-muted-foreground">
              Completed work sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <span className="text-2xl">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMinutesToday}m</div>
            <p className="text-xs text-muted-foreground">
              Total focus time today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-2xl">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Timer */}
      {timerState.isRunning && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              Timer Active
            </CardTitle>
            <CardDescription>
              {currentPhase === 'work' ? 'Focus Session' : 'Break Time'} in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold font-mono">
                  {formatTime(timerState.timeRemaining)}
                </div>
                <Badge variant={currentPhase === 'work' ? 'default' : 'secondary'} className="mt-2">
                  {currentPhase === 'work' ? 'Working' : 'Break'}
                </Badge>
              </div>
              {currentPhase === 'work' && (
                <div className="text-sm text-muted-foreground text-center">
                  Session {timerState.sessionCount + 1}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Habits */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Habits</CardTitle>
          <CardDescription>
            Your habit progress for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeHabits.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">🎯</span>
              <h3 className="text-lg font-medium mb-2">No Active Habits</h3>
              <p className="text-muted-foreground mb-4">
                Create your first habit to start building better routines
              </p>
              <Button>
                Create Habit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeHabits.map((habit) => {
                const completedToday = getCompletedSessionsToday(habit.id).length;
                const progressPercentage = (completedToday / habit.targetSessions) * 100;
                
                return (
                  <div key={habit.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div>
                        <h4 className="font-medium">{habit.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {completedToday} / {habit.targetSessions} sessions completed
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <Progress value={Math.min(progressPercentage, 100)} />
                      </div>
                      <Button 
                        size="sm" 
                        variant={completedToday >= habit.targetSessions ? "secondary" : "default"}
                        disabled={timerState.isRunning}
                      >
                        {completedToday >= habit.targetSessions ? '✅ Done' : 'Start'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-center p-6 text-center">
            <div>
              <span className="text-3xl mb-2 block">➕</span>
              <h3 className="font-medium">Create Habit</h3>
              <p className="text-sm text-muted-foreground">Add a new habit to track</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-center p-6 text-center">
            <div>
              <span className="text-3xl mb-2 block">⏱️</span>
              <h3 className="font-medium">Quick Timer</h3>
              <p className="text-sm text-muted-foreground">Start a 25-minute session</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-center p-6 text-center">
            <div>
              <span className="text-3xl mb-2 block">📊</span>
              <h3 className="font-medium">View Stats</h3>
              <p className="text-sm text-muted-foreground">Check your progress</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}