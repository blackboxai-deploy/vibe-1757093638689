'use client';

import { useState, useMemo } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useSessions } from '@/hooks/useSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const { habits } = useHabits();
  const { getCalendarData, getSessionsByDate, getStreakForHabit } = useSessions();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');

  // Generate calendar data for current month
  const calendarData = useMemo(() => {
    const habitsWithTargets = habits.map(h => ({ id: h.id, targetSessions: h.targetSessions }));
    return getCalendarData(currentDate, habitsWithTargets);
  }, [currentDate, habits, getCalendarData]);

  // Get sessions for selected date
  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    return getSessionsByDate(selectedDate).filter(session => 
      session.completed && session.type === 'work'
    );
  }, [selectedDate, getSessionsByDate]);

  // Filter habits based on selection
  const filteredHabits = selectedHabitId === 'all' 
    ? habits 
    : habits.filter(h => h.id === selectedHabitId);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayData = calendarData.find(d => isSameDate(d.date, date));
      days.push({ date, data: dayData });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground">
            Track your habit progress over time
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Habit Filter */}
          <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Habits</SelectItem>
              {habits.map((habit) => (
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{getMonthName(currentDate)}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  ←
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  →
                </Button>
              </div>
            </div>
            <CardDescription>
              Click on any day to see detailed session information
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} className="aspect-square" />;
                }

                const { date, data } = day;
                const isSelected = selectedDate && isSameDate(date, selectedDate);
                const dayHabits = data?.habits.filter(h => 
                  selectedHabitId === 'all' || h.habitId === selectedHabitId
                ) || [];
                
                const totalCompletionRate = dayHabits.length > 0 
                  ? dayHabits.reduce((sum, h) => sum + h.completionRate, 0) / dayHabits.length 
                  : 0;

                return (
                  <button
                    key={index}
                    className={cn(
                      "aspect-square p-1 rounded-lg border transition-all hover:shadow-sm text-xs relative",
                      isToday(date) && "ring-2 ring-primary",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && totalCompletionRate > 0 && "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800",
                      !isSelected && totalCompletionRate === 0 && "hover:bg-muted"
                    )}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="flex flex-col items-center justify-between h-full">
                      <span className={cn(
                        "font-medium",
                        isToday(date) && !isSelected && "text-primary"
                      )}>
                        {date.getDate()}
                      </span>
                      
                      {dayHabits.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {dayHabits.slice(0, 4).map((habit, i) => {
                            const habitInfo = habits.find(h => h.id === habit.habitId);
                            if (!habitInfo) return null;
                            
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  habit.completionRate >= 1 ? "opacity-100" : "opacity-50"
                                )}
                                style={{ backgroundColor: habitInfo.color }}
                              />
                            );
                          })}
                          {dayHabits.length > 4 && (
                            <span className="text-[8px]">+{dayHabits.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Selected Date Details or Stats */}
        <div className="space-y-6">
          {selectedDate ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
                <CardDescription>
                  Session details for this day
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {selectedDateSessions.length === 0 ? (
                  <div className="text-center py-4">
                    <span className="text-2xl mb-2 block">📅</span>
                    <p className="text-sm text-muted-foreground">
                      No sessions recorded for this day
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{selectedDateSessions.length}</div>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {selectedDateSessions.reduce((sum, s) => sum + s.duration, 0)}m
                        </div>
                        <p className="text-xs text-muted-foreground">Total Time</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Sessions by Habit</h4>
                      {Array.from(new Set(selectedDateSessions.map(s => s.habitId))).map(habitId => {
                        const habit = habits.find(h => h.id === habitId);
                        const habitSessions = selectedDateSessions.filter(s => s.habitId === habitId);
                        
                        if (!habit) return null;
                        
                        return (
                          <div key={habitId} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: habit.color }}
                              />
                              <span className="text-sm">{habit.name}</span>
                            </div>
                            <Badge variant="secondary">
                              {habitSessions.length} sessions
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overview</CardTitle>
                <CardDescription>
                  Your habit statistics for {getMonthName(currentDate)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {filteredHabits.length === 0 ? (
                  <div className="text-center py-4">
                    <span className="text-2xl mb-2 block">🎯</span>
                    <p className="text-sm text-muted-foreground">
                      No habits to display
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHabits.map((habit) => {
                      const streak = getStreakForHabit(habit.id, habit.targetSessions);
                      
                      return (
                        <div key={habit.id} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: habit.color }}
                            />
                            <span className="font-medium text-sm">{habit.name}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>Current streak: {streak.current} days</div>
                            <div>Best streak: {streak.longest} days</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}