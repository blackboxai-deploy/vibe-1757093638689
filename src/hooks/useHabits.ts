'use client';

import { useState, useEffect, useCallback } from 'react';
import { Habit } from '@/lib/types';
import { habitStorage } from '@/lib/storage';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // Load habits from localStorage on mount
  useEffect(() => {
    const loadedHabits = habitStorage.getAll();
    setHabits(loadedHabits);
    setLoading(false);
  }, []);

  const addHabit = useCallback((habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newHabit = habitStorage.add(habitData);
    setHabits(prev => [...prev, newHabit]);
    return newHabit;
  }, []);

  const updateHabit = useCallback((habitId: string, updates: Partial<Habit>) => {
    const updatedHabit = habitStorage.update(habitId, updates);
    if (updatedHabit) {
      setHabits(prev => prev.map(habit => 
        habit.id === habitId ? updatedHabit : habit
      ));
    }
    return updatedHabit;
  }, []);

  const deleteHabit = useCallback((habitId: string) => {
    const success = habitStorage.delete(habitId);
    if (success) {
      setHabits(prev => prev.filter(habit => habit.id !== habitId));
    }
    return success;
  }, []);

  const getHabitById = useCallback((habitId: string) => {
    return habits.find(habit => habit.id === habitId);
  }, [habits]);

  const getActiveHabits = useCallback(() => {
    return habits.filter(habit => habit.isActive);
  }, [habits]);

  const getHabitsByCategory = useCallback((category: string) => {
    return habits.filter(habit => habit.category === category);
  }, [habits]);

  return {
    habits,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    getHabitById,
    getActiveHabits,
    getHabitsByCategory
  };
}