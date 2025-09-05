'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { settingsStorage, exportData, importData } from '@/lib/storage';
import { AppSettings } from '@/lib/types';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(settingsStorage.get());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);



  const handlePomodoroChange = (pomodoroSettings: Partial<AppSettings['pomodoro']>) => {
    const updatedSettings = {
      ...settings,
      pomodoro: { ...settings.pomodoro, ...pomodoroSettings }
    };
    setSettings(updatedSettings);
    settingsStorage.save(updatedSettings);
    toast.success('Pomodoro settings updated');
  };

  const handleNotificationChange = (notificationSettings: Partial<AppSettings['notifications']>) => {
    const updatedSettings = {
      ...settings,
      notifications: { ...settings.notifications, ...notificationSettings }
    };
    setSettings(updatedSettings);
    settingsStorage.save(updatedSettings);
    toast.success('Notification settings updated');
  };

  const handleExportData = () => {
    try {
      const data = exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habitflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importData(data);
        // Reload settings after import
        setSettings(settingsStorage.get());
        toast.success('Data imported successfully');
        // Refresh the page to reflect all changes
        window.location.reload();
      } catch (error) {
        toast.error('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (!mounted) {
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
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Customize your HabitFlow experience
        </p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎨</span>
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
            
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pomodoro Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⏱️</span>
            Pomodoro Timer
          </CardTitle>
          <CardDescription>
            Configure your focus and break session durations
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="workDuration">Work Session (minutes)</Label>
                <p className="text-sm text-muted-foreground">
                  Duration of focused work sessions
                </p>
              </div>
              <Input
                id="workDuration"
                type="number"
                min="5"
                max="120"
                value={settings.pomodoro.workDuration}
                onChange={(e) => handlePomodoroChange({ 
                  workDuration: parseInt(e.target.value) || 25 
                })}
                className="w-20"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="shortBreakDuration">Short Break (minutes)</Label>
                <p className="text-sm text-muted-foreground">
                  Duration of short breaks between work sessions
                </p>
              </div>
              <Input
                id="shortBreakDuration"
                type="number"
                min="1"
                max="30"
                value={settings.pomodoro.shortBreakDuration}
                onChange={(e) => handlePomodoroChange({ 
                  shortBreakDuration: parseInt(e.target.value) || 5 
                })}
                className="w-20"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="longBreakDuration">Long Break (minutes)</Label>
                <p className="text-sm text-muted-foreground">
                  Duration of long breaks after completing a cycle
                </p>
              </div>
              <Input
                id="longBreakDuration"
                type="number"
                min="5"
                max="60"
                value={settings.pomodoro.longBreakDuration}
                onChange={(e) => handlePomodoroChange({ 
                  longBreakDuration: parseInt(e.target.value) || 15 
                })}
                className="w-20"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="longBreakInterval">Long Break Interval</Label>
                <p className="text-sm text-muted-foreground">
                  Number of work sessions before a long break
                </p>
              </div>
              <Input
                id="longBreakInterval"
                type="number"
                min="2"
                max="8"
                value={settings.pomodoro.longBreakInterval}
                onChange={(e) => handlePomodoroChange({ 
                  longBreakInterval: parseInt(e.target.value) || 4 
                })}
                className="w-20"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-start Breaks</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start break sessions when work completes
                </p>
              </div>
              <Switch
                checked={settings.pomodoro.autoStartBreaks}
                onCheckedChange={(checked) => handlePomodoroChange({ autoStartBreaks: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-start Work Sessions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start work sessions when breaks complete
                </p>
              </div>
              <Switch
                checked={settings.pomodoro.autoStartWorkSessions}
                onCheckedChange={(checked) => handlePomodoroChange({ autoStartWorkSessions: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔔</span>
            Notifications & Sounds
          </CardTitle>
          <CardDescription>
            Configure audio and notification preferences
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Sound Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds when sessions start or complete
              </p>
            </div>
            <Switch
              checked={settings.pomodoro.soundEnabled}
              onCheckedChange={(checked) => handlePomodoroChange({ soundEnabled: checked })}
            />
          </div>

          {settings.pomodoro.soundEnabled && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Sound Volume</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(settings.pomodoro.soundVolume * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.pomodoro.soundVolume]}
                onValueChange={([value]) => handlePomodoroChange({ soundVolume: value })}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Complete</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when work or break sessions complete
                </p>
              </div>
              <Switch
                checked={settings.notifications.sessionComplete}
                onCheckedChange={(checked) => handleNotificationChange({ sessionComplete: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Break Time</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when it's time to take a break
                </p>
              </div>
              <Switch
                checked={settings.notifications.breakTime}
                onCheckedChange={(checked) => handleNotificationChange({ breakTime: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Daily Goal Achieved</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when you complete daily habit goals
                </p>
              </div>
              <Switch
                checked={settings.notifications.dailyGoalAchieved}
                onCheckedChange={(checked) => handleNotificationChange({ dailyGoalAchieved: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💾</span>
            Data Management
          </CardTitle>
          <CardDescription>
            Export and import your habit data
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Button onClick={handleExportData} className="w-full">
                <span className="mr-2">📤</span>
                Export Data
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Download your habits, sessions, and settings as a JSON file
              </p>
            </div>

            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="import-file"
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <span className="mr-2">📥</span>
                Import Data
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Restore your data from a previously exported JSON file
              </p>
            </div>
          </div>

          <div className="p-4 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 rounded-lg">
            <h4 className="text-sm font-medium mb-1">⚠️ Important</h4>
            <p className="text-sm text-muted-foreground">
              Importing data will overwrite your current habits, sessions, and settings. 
              Make sure to export your current data first if you want to keep it.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}