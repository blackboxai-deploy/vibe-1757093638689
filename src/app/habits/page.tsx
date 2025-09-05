'use client';

import { useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useSessions } from '@/hooks/useSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Habit, HabitCategory } from '@/lib/types';

const HABIT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
  '#ec4899', '#6366f1', '#14b8a6', '#eab308'
];

const HABIT_CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'health', label: 'Health & Fitness' },
  { value: 'learning', label: 'Learning' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'personal', label: 'Personal Growth' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'creative', label: 'Creative' }
];

export default function HabitsPage() {
  const { habits, loading, addHabit, updateHabit, deleteHabit } = useHabits();
  const { getStreakForHabit } = useSessions();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: HABIT_COLORS[0],
    category: 'productivity' as HabitCategory,
    targetSessions: 1,
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: HABIT_COLORS[0],
      category: 'productivity' as HabitCategory,
      targetSessions: 1,
      isActive: true
    });
    setEditingHabit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a habit name');
      return;
    }

    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, formData);
        toast.success('Habit updated successfully');
      } else {
        await addHabit(formData);
        toast.success('Habit created successfully');
      }
      
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save habit');
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description || '',
      color: habit.color,
      category: habit.category as HabitCategory,
      targetSessions: habit.targetSessions,
      isActive: habit.isActive
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (habitId: string) => {
    if (window.confirm('Are you sure you want to delete this habit? This will also delete all related sessions.')) {
      try {
        await deleteHabit(habitId);
        toast.success('Habit deleted successfully');
      } catch (error) {
        toast.error('Failed to delete habit');
      }
    }
  };

  const handleToggleActive = async (habit: Habit) => {
    try {
      await updateHabit(habit.id, { isActive: !habit.isActive });
      toast.success(`Habit ${habit.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update habit');
    }
  };

  if (loading) {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <p className="text-muted-foreground">
            Manage your habits and track your progress
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <span className="mr-2">➕</span>
              Create Habit
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </DialogTitle>
              <DialogDescription>
                {editingHabit 
                  ? 'Update your habit details below.'
                  : 'Set up a new habit to start tracking your progress.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Habit Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Morning Exercise, Reading, Meditation"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional: Describe your habit or goals"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value as HabitCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HABIT_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="targetSessions">Daily Target</Label>
                    <Input
                      id="targetSessions"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.targetSessions}
                      onChange={(e) => setFormData({ ...formData, targetSessions: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {HABIT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color 
                            ? 'border-foreground scale-110' 
                            : 'border-muted-foreground/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active habit</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Habits List */}
      {habits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <span className="text-6xl mb-4">🎯</span>
            <h3 className="text-xl font-semibold mb-2">No Habits Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Start building better habits by creating your first one. Track your progress with Pomodoro sessions!
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <span className="mr-2">➕</span>
              Create Your First Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {habits.map((habit) => {
            const streak = getStreakForHabit(habit.id, habit.targetSessions);
            const categoryLabel = HABIT_CATEGORIES.find(c => c.value === habit.category)?.label || habit.category;
            
            return (
              <Card key={habit.id} className={habit.isActive ? '' : 'opacity-60'}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div>
                        <CardTitle className="text-lg">{habit.name}</CardTitle>
                        <CardDescription>
                          {habit.description && (
                            <span className="block">{habit.description}</span>
                          )}
                          <span className="text-xs">
                            {categoryLabel} • Target: {habit.targetSessions} session{habit.targetSessions !== 1 ? 's' : ''}/day
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={habit.isActive ? 'default' : 'secondary'}>
                        {habit.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>🔥</span>
                        <span>Current streak: {streak.current} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🏆</span>
                        <span>Best streak: {streak.longest} days</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleActive(habit)}
                      >
                        {habit.isActive ? 'Pause' : 'Resume'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(habit)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(habit.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}