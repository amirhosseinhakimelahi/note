/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { toLocalDateStr } from './services/date';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
} from 'lucide-react';
import {
  TabDestination,
  Task,
  Note,
  Birthday,
  Category,
  AppSettings,
  Alarm,
  FocusModeType,
  DailyHabit,
} from './types';
import {
  getTasks,
  saveTask,
  deleteTask,
  completeTask,
  getNotes,
  saveNote,
  deleteNote,
  toggleNotePin,
  getBirthdays,
  saveBirthday,
  deleteBirthday,
  getCategories,
  saveCategory,
  deleteCategory,
  getSettings,
  saveSettings,
  applyTheme,
  exportAllData,
  importAllData,
  clearAllData,
  getAlarms,
  saveAlarm,
  toggleAlarm,
  deleteAlarm,
  getHabits,
  saveHabit,
  toggleHabitForDate,
  deleteHabit,
} from './services/storage';
import { getActiveFocusMode, setActiveFocusMode } from './services/timerManager';

import { TopAppBar } from './components/TopAppBar';
import { BottomNavigationBar } from './components/BottomNavigationBar';
import { AndroidDeviceFrame } from './components/AndroidDeviceFrame';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TaskEditorModal } from './components/TaskEditorModal';
import { NoteEditorModal } from './components/NoteEditorModal';
import { BirthdayEditorModal } from './components/BirthdayEditorModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { AdvancedNoteEditor } from './components/AdvancedNoteEditor';
import { ActiveAlarmOverlay } from './components/ActiveAlarmOverlay';
import { isNativeApp, saveTextFile } from './services/native';
import { requestNotificationPermission } from './services/notifications';
import { syncAllSchedules, getExpiredOneShotAlarmIds } from './services/scheduler';

import { HomeScreen } from './screens/HomeScreen';
import { NotesScreen } from './screens/NotesScreen';
import { PlannerScreen } from './screens/PlannerScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { FocusScreen } from './screens/FocusScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AlarmsSheet } from './screens/AlarmsSheet';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabDestination>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlarmsOpen, setIsAlarmsOpen] = useState(false);
  const [isDeviceFrame, setIsDeviceFrame] = useState(false);

  // Focus mode (Pomodoro vs Stopwatch)
  const [activeFocusMode, setFocusModeState] = useState<FocusModeType>(getActiveFocusMode);

  // Core Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [habits, setHabits] = useState<DailyHabit[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  // Active ringing alarm
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<Alarm | null>(null);
  const lastTriggeredMinute = useRef<string>('');
  const [dataReady, setDataReady] = useState(false);

  // Modals & Dialogs
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    task: Task | null;
    defaultDate?: string;
  }>({ isOpen: false, task: null });

  const [noteModalState, setNoteModalState] = useState<{
    isOpen: boolean;
    note: Note | null;
  }>({ isOpen: false, note: null });

  const [advancedNoteModalState, setAdvancedNoteModalState] = useState<{
    isOpen: boolean;
    note: Note | null;
  }>({ isOpen: false, note: null });

  const [birthdayModalState, setBirthdayModalState] = useState<{
    isOpen: boolean;
    birthday: Birthday | null;
  }>({ isOpen: false, birthday: null });

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'task' | 'note' | 'birthday';
    id: string;
    title: string;
  }>({ isOpen: false, type: 'task', id: '', title: '' });

  // Load data function
  const loadData = useCallback(() => {
    setTasks(getTasks());
    setNotes(getNotes());
    setBirthdays(getBirthdays());
    setCategories(getCategories());
    setAlarms(getAlarms());
    setHabits(getHabits());
    const currentSettings = getSettings();
    setSettings(currentSettings);
    applyTheme(currentSettings.theme, currentSettings.themePalette, currentSettings.displayDensity);
    setDataReady(true);
  }, []);

  // Initial load & sync listener
  useEffect(() => {
    loadData();

    const handleStorageUpdate = () => {
      loadData();
    };
    window.addEventListener('daylight_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('daylight_storage_update', handleStorageUpdate);
  }, [loadData]);

  // Alarm clock monitor (checks every 5 seconds for current minute trigger)
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentH}:${currentM}`;
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...

      if (lastTriggeredMinute.current === timeStr) return;

      const matched = alarms.find((a) => {
        if (!a.enabled) return false;
        if (a.time !== timeStr) return false;
        if (a.repeatDays.length === 0) return true; // One-shot
        return a.repeatDays.includes(dayOfWeek);
      });

      if (matched && !activeRingingAlarm) {
        lastTriggeredMinute.current = timeStr;
        setActiveRingingAlarm(matched);
        // One-shot alarms switch themselves off after ringing; snooze alarms are removed
        if (matched.repeatDays.length === 0) {
          if (matched.id.startsWith('snooze_')) deleteAlarm(matched.id);
          else toggleAlarm(matched.id, false);
        }
      }
    };

    const interval = setInterval(checkAlarms, 4000);
    return () => clearInterval(interval);
  }, [alarms, activeRingingAlarm]);

  // First launch inside the Android app: ask once for notification permission (needed for alarms)
  useEffect(() => {
    if (!isNativeApp || localStorage.getItem('daylight_asked_notif_v1')) return;
    localStorage.setItem('daylight_asked_notif_v1', '1');
    requestNotificationPermission().then((result) => {
      if (result === 'granted') {
        const current = getSettings();
        if (!current.notificationsEnabled) {
          saveSettings({ ...current, notificationsEnabled: true });
          loadData();
        }
      }
    });
  }, [loadData]);

  // Hand alarms & reminders to Android so they fire while the app is closed
  useEffect(() => {
    if (!dataReady) return;
    const expired = getExpiredOneShotAlarmIds(alarms);
    if (expired.length > 0) {
      expired.forEach((id) => (id.startsWith('snooze_') ? deleteAlarm(id) : toggleAlarm(id, false)));
      return; // storage update reloads data and re-runs this effect
    }
    syncAllSchedules({
      alarms,
      tasks,
      birthdays,
      remindersEnabled: settings.notificationsEnabled,
    });
  }, [dataReady, alarms, tasks, birthdays, settings.notificationsEnabled]);

  // Handle Settings updates
  const handleUpdateSettings = (newSettings: AppSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    applyTheme(newSettings.theme, newSettings.themePalette, newSettings.displayDensity);
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ ...settings, theme: nextTheme });
  };

  // Export Data Download
  const handleExportData = () => {
    const jsonStr = exportAllData();
    saveTextFile(`daylight-backup-${toLocalDateStr()}.json`, 'application/json', jsonStr);
  };

  // Import Data
  const handleImportData = (jsonStr: string) => {
    const res = importAllData(jsonStr);
    if (res.success) {
      loadData();
    } else {
      throw new Error(res.error || 'Failed to import backup');
    }
  };

  // Clear all data
  const handleClearAllData = () => {
    clearAllData();
    loadData();
  };

  // Task Actions
  const handleSaveTask = (task: Task) => {
    saveTask(task);
    loadData();
  };

  const handleToggleTaskComplete = (id: string, completed: boolean) => {
    completeTask(id, completed);
    loadData();
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'task') {
      deleteTask(deleteConfirm.id);
    } else if (deleteConfirm.type === 'note') {
      deleteNote(deleteConfirm.id);
    } else if (deleteConfirm.type === 'birthday') {
      deleteBirthday(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, type: 'task', id: '', title: '' });
    loadData();
  };

  // Note Actions
  const handleSaveNote = (note: Note) => {
    saveNote(note);
    loadData();
  };

  const handleTogglePin = (id: string) => {
    toggleNotePin(id);
    loadData();
  };

  // Birthday Actions
  const handleSaveBirthday = (bday: Birthday) => {
    saveBirthday(bday);
    loadData();
  };

  // Category Actions
  const handleSaveCategory = (cat: Category) => {
    saveCategory(cat);
    loadData();
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    loadData();
  };

  // Alarm Actions
  const handleSaveAlarm = (alarm: Alarm) => {
    saveAlarm(alarm);
    loadData();
  };

  const handleToggleAlarm = (id: string, enabled: boolean) => {
    toggleAlarm(id, enabled);
    loadData();
  };

  const handleDeleteAlarm = (id: string) => {
    deleteAlarm(id);
    loadData();
  };

  const handleTriggerTestAlarm = (alarm: Alarm) => {
    setActiveRingingAlarm(alarm);
  };

  const handleSnoozeAlarm = (minutes: number) => {
    if (!activeRingingAlarm) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const snoozeTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const snoozedAlarm: Alarm = {
      ...activeRingingAlarm,
      id: 'snooze_' + Date.now(),
      label: `Snooze: ${activeRingingAlarm.label}`,
      time: snoozeTime,
      repeatDays: [],
      enabled: true,
    };
    saveAlarm(snoozedAlarm);
    setActiveRingingAlarm(null);
    loadData();
  };

  const handleFocusModeChange = (mode: FocusModeType) => {
    setFocusModeState(mode);
    setActiveFocusMode(mode);
  };

  // Compute pending tasks count for badge
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  // Habit handlers
  const handleToggleHabit = useCallback((habitId: string) => {
    const todayStr = toLocalDateStr();
    toggleHabitForDate(habitId, todayStr);
    setHabits(getHabits());
  }, []);

  const handleCreateHabit = useCallback((name: string) => {
    const newHabit = {
      id: 'habit_' + Date.now(),
      name: name.trim(),
      completedDates: [],
    };
    saveHabit(newHabit);
    setHabits(getHabits());
  }, []);

  const handleDeleteHabit = useCallback((habitId: string) => {
    deleteHabit(habitId);
    setHabits(getHabits());
  }, []);

  // Floating Action Button Handler
  const handleFabClick = () => {
    if (currentTab === 'notes') {
      setNoteModalState({ isOpen: true, note: null });
    } else if (currentTab === 'planner') {
      setTaskModalState({ isOpen: true, task: null });
    } else if (currentTab === 'calendar') {
      setTaskModalState({ isOpen: true, task: null });
    } else {
      setIsQuickCaptureOpen(true);
    }
  };

  return (
    <AndroidDeviceFrame enabled={isDeviceFrame}>
      {/* Top App Bar */}
      <TopAppBar
        title={
          isSettingsOpen
            ? 'Settings'
            : currentTab === 'home'
            ? 'Daylight'
            : currentTab === 'notes'
            ? 'Notes & Sketches'
            : currentTab === 'planner'
            ? 'Planner'
            : currentTab === 'calendar'
            ? 'Calendar'
            : activeFocusMode === 'stopwatch'
            ? 'Stopwatch'
            : 'Focus'
        }
        subtitle={
          isSettingsOpen
            ? 'Preferences & Storage'
            : currentTab === 'home'
            ? 'Daily Organizer'
            : currentTab === 'focus'
            ? activeFocusMode === 'stopwatch'
              ? 'Lap Timer'
              : 'Pomodoro Timer'
            : undefined
        }
        settings={settings}
        isDeviceFrame={isDeviceFrame}
        onToggleDeviceFrame={isNativeApp ? undefined : () => setIsDeviceFrame(!isDeviceFrame)}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-surface dark:bg-slate-950 text-slate-900 dark:text-white">
        {isSettingsOpen ? (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onClearAllData={handleClearAllData}
            onBack={() => setIsSettingsOpen(false)}
              />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeScreen
                tasks={tasks}
                birthdays={birthdays}
                notes={notes}
                alarms={alarms}
                habits={habits}
                showBirthdayCountdown={settings.showBirthdayCountdownOnHome}
                showSolarHijriDates={settings.showSolarHijriDates}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
                onOpenTask={(task) => setTaskModalState({ isOpen: true, task })}
                onOpenBirthday={(bday) => setBirthdayModalState({ isOpen: true, birthday: bday })}
                onOpenCreateBirthday={() => setBirthdayModalState({ isOpen: true, birthday: null })}
                onToggleTaskComplete={handleToggleTaskComplete}
                onStartFocus={() => setCurrentTab('focus')}
                onOpenAlarms={() => setIsAlarmsOpen(true)}
                onToggleAlarm={handleToggleAlarm}
                onOpenEditAlarm={(alarm) => setIsAlarmsOpen(true)}
                onOpenCreateAlarm={() => setIsAlarmsOpen(true)}
                onTriggerTestAlarm={handleTriggerTestAlarm}
                onToggleHabit={handleToggleHabit}
                onAddHabit={handleCreateHabit}
                onDeleteHabit={handleDeleteHabit}
                      />
            )}

            {currentTab === 'notes' && (
              <NotesScreen
                notes={notes}
                onOpenCreateNote={() => setNoteModalState({ isOpen: true, note: null })}
                onOpenCreateAdvancedNote={() => setAdvancedNoteModalState({ isOpen: true, note: null })}
                onOpenEditNote={(note) => {
                  if (note.isAdvanced) {
                    setAdvancedNoteModalState({ isOpen: true, note });
                  } else {
                    setNoteModalState({ isOpen: true, note });
                  }
                }}
                onTogglePin={handleTogglePin}
                onRequestDeleteNote={(id) => {
                  const target = notes.find((n) => n.id === id);
                  setDeleteConfirm({
                    isOpen: true,
                    type: 'note',
                    id,
                    title: target?.title || 'Note',
                  });
                }}
              />
            )}

            {currentTab === 'planner' && (
              <PlannerScreen
                tasks={tasks}
                categories={categories}
                showSolarHijriDates={settings.showSolarHijriDates}
                onOpenCreateTask={(defaultDate) =>
                  setTaskModalState({ isOpen: true, task: null, defaultDate })
                }
                onOpenEditTask={(task) => setTaskModalState({ isOpen: true, task })}
                onToggleTaskComplete={handleToggleTaskComplete}
                onRequestDeleteTask={(id) => {
                  const target = tasks.find((t) => t.id === id);
                  setDeleteConfirm({
                    isOpen: true,
                    type: 'task',
                    id,
                    title: target?.title || 'Task',
                  });
                }}
                onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarScreen
                tasks={tasks}
                birthdays={birthdays}
                firstDayOfWeek={settings.firstDayOfWeek}
                showSolarHijriDates={settings.showSolarHijriDates}
                onOpenCreateTaskForDate={(date) =>
                  setTaskModalState({ isOpen: true, task: null, defaultDate: date })
                }
                onOpenEditTask={(task) => setTaskModalState({ isOpen: true, task })}
                onToggleTaskComplete={handleToggleTaskComplete}
                onOpenCreateBirthday={() => setBirthdayModalState({ isOpen: true, birthday: null })}
                onOpenEditBirthday={(bday) => setBirthdayModalState({ isOpen: true, birthday: bday })}
                onRequestDeleteBirthday={(id) => {
                  const target = birthdays.find((b) => b.id === id);
                  setDeleteConfirm({
                    isOpen: true,
                    type: 'birthday',
                    id,
                    title: target?.name || 'Birthday',
                  });
                }}
              />
            )}

            {currentTab === 'focus' && (
              <FocusScreen
                settings={settings.pomodoro}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenAlarms={() => setIsAlarmsOpen(true)}
                activeFocusMode={activeFocusMode}
                onChangeFocusMode={handleFocusModeChange}
              />
            )}
          </>
        )}

        {/* Floating Action Button (FAB) for rapid creation - visible when not in Settings or Focus */}
        {!isSettingsOpen && currentTab !== 'focus' && (
          <button
            type="button"
            onClick={handleFabClick}
            className="absolute bottom-20 right-5 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 z-30 cursor-pointer"
            title="Add item"
            aria-label="Add item"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setIsSettingsOpen(false);
          setCurrentTab(tab);
        }}
        pendingTasksCount={pendingTasksCount}
        activeFocusMode={activeFocusMode}
      />

      {/* MODALS & PANELS */}
      {/* Alarms Sheet */}
      <AlarmsSheet
        isOpen={isAlarmsOpen}
        alarms={alarms}
        onSaveAlarm={handleSaveAlarm}
        onToggleAlarm={handleToggleAlarm}
        onDeleteAlarm={handleDeleteAlarm}
        onTriggerTestAlarm={handleTriggerTestAlarm}
        onClose={() => setIsAlarmsOpen(false)}
      />

      {/* Active Ringing Alarm Overlay with Wake-up Math Challenge */}
      <ActiveAlarmOverlay
        alarm={activeRingingAlarm}
        onDismiss={() => setActiveRingingAlarm(null)}
        onSnooze={handleSnoozeAlarm}
      />

      {/* Quick Capture Sheet */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        categories={categories}
        onSaveTask={handleSaveTask}
        onSaveNote={handleSaveNote}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      {/* Task Editor Modal */}
      <TaskEditorModal
        isOpen={taskModalState.isOpen}
        initialTask={taskModalState.task}
        defaultDate={taskModalState.defaultDate}
        categories={categories}
        onSave={handleSaveTask}
        onClose={() => setTaskModalState({ isOpen: false, task: null })}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
      />

      {/* Standard Note Editor Modal */}
      <NoteEditorModal
        isOpen={noteModalState.isOpen}
        initialNote={noteModalState.note}
        onSave={handleSaveNote}
        onDelete={(id) => {
          noteModalState.isOpen && setNoteModalState({ isOpen: false, note: null });
          const target = notes.find((n) => n.id === id);
          setDeleteConfirm({
            isOpen: true,
            type: 'note',
            id,
            title: target?.title || 'Note',
          });
        }}
        onClose={() => setNoteModalState({ isOpen: false, note: null })}
      />

      {/* Advanced Sketch Note Editor Modal */}
      <AdvancedNoteEditor
        isOpen={advancedNoteModalState.isOpen}
        initialNote={advancedNoteModalState.note}
        onSave={handleSaveNote}
        onClose={() => setAdvancedNoteModalState({ isOpen: false, note: null })}
      />

      {/* Birthday Editor Modal */}
      <BirthdayEditorModal
        isOpen={birthdayModalState.isOpen}
        initialBirthday={birthdayModalState.birthday}
        onSave={handleSaveBirthday}
        onDelete={(id) => {
          birthdayModalState.isOpen && setBirthdayModalState({ isOpen: false, birthday: null });
          const target = birthdays.find((b) => b.id === id);
          setDeleteConfirm({
            isOpen: true,
            type: 'birthday',
            id,
            title: target?.name || 'Birthday',
          });
        }}
        onClose={() => setBirthdayModalState({ isOpen: false, birthday: null })}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        categories={categories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onClose={() => setIsCategoryManagerOpen(false)}
      />

      {/* Generic Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={`Delete ${deleteConfirm.type === 'task' ? 'Task' : deleteConfirm.type === 'note' ? 'Note' : 'Birthday'}?`}
        message={`Are you sure you want to permanently delete "${deleteConfirm.title}"? This action cannot be reversed.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Keep"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'task', id: '', title: '' })}
      />
    </AndroidDeviceFrame>
  );
}
