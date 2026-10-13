import { toLocalDateStr } from './date';
import {
  AppSettings,
  Birthday,
  Category,
  Note,
  Task,
  Recurrence,
  Alarm,
  ThemePalette,
  DisplayDensity,
  DailyReflection,
  DailyHabit,
} from '../types';

const STORAGE_KEYS = {
  TASKS: 'daylight_tasks_v1',
  NOTES: 'daylight_notes_v1',
  CATEGORIES: 'daylight_categories_v1',
  BIRTHDAYS: 'daylight_birthdays_v1',
  SETTINGS: 'daylight_settings_v1',
  FOCUS_STATE: 'daylight_focus_state_v1',
  STOPWATCH_STATE: 'daylight_stopwatch_state_v1',
  ALARMS: 'daylight_alarms_v1',
  REFLECTIONS: 'daylight_reflections_v1',
  HABITS: 'daylight_habits_v1',
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-personal', name: 'Personal', color: '#6366F1', isDefault: true },
  { id: 'cat-homework', name: 'Homework', color: '#059669', isDefault: true },
  { id: 'cat-work', name: 'Work', color: '#D97706', isDefault: true },
  { id: 'cat-birthday', name: 'Birthday', color: '#E11D48', isDefault: true },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  firstDayOfWeek: 'monday',
  showBirthdayCountdownOnHome: true,
  showSolarHijriDates: true,
  themePalette: 'warm_linen',
  displayDensity: 'comfortable',
  alarmSound: 'gentle_chimes',
  notificationSound: 'crystal_ping',
  notificationsEnabled: false,
  pomodoro: {
    focusDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    soundEnabled: true,
    vibrationEnabled: true,
  },
};

export const DEFAULT_ALARMS: Alarm[] = [
  {
    id: 'alarm_morning_1',
    time: '07:30',
    label: 'Morning Rise & Shine',
    enabled: false,
    repeatDays: [1, 2, 3, 4, 5], // Mon-Fri
    sound: 'morning_sunrise',
    snoozeEnabled: true,
    mathChallenge: {
      enabled: true,
      difficulty: 'easy',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'alarm_study_2',
    time: '14:00',
    label: 'Afternoon Study Block',
    enabled: false,
    repeatDays: [],
    sound: 'zen_bell',
    snoozeEnabled: false,
    mathChallenge: {
      enabled: false,
      difficulty: 'easy',
    },
    createdAt: new Date().toISOString(),
  },
];

// Safe JSON reader
function getJson<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error parsing localStorage key ${key}`, e);
    return defaultValue;
  }
}

function setJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('daylight_storage_update'));
  } catch (e) {
    console.error(`Error saving localStorage key ${key}`, e);
  }
}

// ----------------- Categories -----------------
export function getCategories(): Category[] {
  const cats = getJson<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  if (cats.length === 0) {
    setJson(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return cats;
}

export function saveCategory(category: Category): void {
  const cats = getCategories();
  const index = cats.findIndex((c) => c.id === category.id);
  if (index >= 0) {
    cats[index] = category;
  } else {
    cats.push(category);
  }
  setJson(STORAGE_KEYS.CATEGORIES, cats);
}

export function deleteCategory(id: string): void {
  const cats = getCategories().filter((c) => c.id !== id || c.isDefault);
  setJson(STORAGE_KEYS.CATEGORIES, cats);
}

// ----------------- Tasks -----------------
export function getTasks(): Task[] {
  return getJson<Task[]>(STORAGE_KEYS.TASKS, []);
}

export function saveTask(task: Task): void {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    tasks[index] = { ...task, updatedAt: new Date().toISOString() };
  } else {
    tasks.unshift({ ...task, updatedAt: new Date().toISOString() });
  }
  setJson(STORAGE_KEYS.TASKS, tasks);
}

export function deleteTask(id: string): void {
  const tasks = getTasks().filter((t) => t.id !== id);
  setJson(STORAGE_KEYS.TASKS, tasks);
}

// Advance recurring task to next occurrence when completed
export function completeTask(id: string, completed: boolean): void {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return;

  const current = tasks[index];
  const nowIso = new Date().toISOString();

  if (completed && current.recurrence && current.recurrence !== 'None') {
    // 1. Mark current task completed
    current.completed = true;
    current.completedAt = nowIso;
    current.updatedAt = nowIso;

    // 2. Compute next due date
    const nextDate = calculateNextOccurrence(current.dueDate, current.recurrence);

    // 3. Create next uncompleted occurrence while preserving the history of this completed one
    const nextTask: Task = {
      ...current,
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      dueDate: nextDate,
      completed: false,
      completedAt: undefined,
      checklist: current.checklist.map((c) => ({ ...c, completed: false })),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    tasks.unshift(nextTask);
  } else {
    current.completed = completed;
    current.completedAt = completed ? nowIso : undefined;
    current.updatedAt = nowIso;
  }

  setJson(STORAGE_KEYS.TASKS, tasks);
}

export function calculateNextOccurrence(currentDueDate: string, recurrence: Recurrence): string {
  const [year, month, day] = currentDueDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (recurrence === 'Daily') {
    date.setDate(date.getDate() + 1);
  } else if (recurrence === 'Weekly') {
    date.setDate(date.getDate() + 7);
  } else if (recurrence === 'Monthly') {
    // Clamp to the last day of next month (Jan 31 -> Feb 28, not Mar 3)
    const lastDayNextMonth = new Date(year, month + 1, 0).getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    date.setDate(Math.min(day, lastDayNextMonth));
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ----------------- Notes -----------------
export function getNotes(): Note[] {
  return getJson<Note[]>(STORAGE_KEYS.NOTES, []);
}

export function saveNote(note: Note): void {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === note.id);
  const nowIso = new Date().toISOString();

  if (index >= 0) {
    notes[index] = { ...note, updatedAt: nowIso };
  } else {
    notes.unshift({ ...note, createdAt: nowIso, updatedAt: nowIso });
  }
  setJson(STORAGE_KEYS.NOTES, notes);
}

export function deleteNote(id: string): void {
  const notes = getNotes().filter((n) => n.id !== id);
  setJson(STORAGE_KEYS.NOTES, notes);
}

export function toggleNotePin(id: string): void {
  const notes = getNotes();
  const target = notes.find((n) => n.id === id);
  if (target) {
    target.isPinned = !target.isPinned;
    target.updatedAt = new Date().toISOString();
    setJson(STORAGE_KEYS.NOTES, notes);
  }
}

// ----------------- Birthdays -----------------
export function getBirthdays(): Birthday[] {
  return getJson<Birthday[]>(STORAGE_KEYS.BIRTHDAYS, []);
}

export function saveBirthday(birthday: Birthday): void {
  const list = getBirthdays();
  const index = list.findIndex((b) => b.id === birthday.id);
  if (index >= 0) {
    list[index] = birthday;
  } else {
    list.push(birthday);
  }
  setJson(STORAGE_KEYS.BIRTHDAYS, list);
}

export function deleteBirthday(id: string): void {
  const list = getBirthdays().filter((b) => b.id !== id);
  setJson(STORAGE_KEYS.BIRTHDAYS, list);
}

// Compute days until next birthday and age
export function getBirthdayDetails(birthday: Birthday, referenceDate: Date = new Date()) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const currentYear = today.getFullYear();

  // birthDate can be "YYYY-MM-DD" or "MM-DD"
  const parts = birthday.birthDate.split('-');
  const month = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
  const day = parts.length === 3 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);

  // Handle leap day
  let targetYear = currentYear;
  let birthdayThisYear = getAdjustedDate(targetYear, month, day);

  if (birthdayThisYear < today) {
    targetYear += 1;
    birthdayThisYear = getAdjustedDate(targetYear, month, day);
  }

  const diffTime = birthdayThisYear.getTime() - today.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let turningAge: number | undefined = undefined;
  if (birthday.birthYear) {
    turningAge = targetYear - birthday.birthYear;
  }

  return {
    daysRemaining,
    nextBirthdayDate: birthdayThisYear,
    turningAge,
    isToday: daysRemaining === 0,
  };
}

function getAdjustedDate(year: number, month: number, day: number): Date {
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  // If Feb 29 in a non-leap year, celebrate on Feb 28
  if (month === 2 && day === 29 && !isLeapYear) {
    return new Date(year, 1, 28);
  }
  return new Date(year, month - 1, day);
}

// ----------------- Alarms -----------------
export function getAlarms(): Alarm[] {
  const alarms = getJson<Alarm[]>(STORAGE_KEYS.ALARMS, []);
  if (alarms.length === 0) {
    setJson(STORAGE_KEYS.ALARMS, DEFAULT_ALARMS);
    return DEFAULT_ALARMS;
  }
  return alarms;
}

export function saveAlarm(alarm: Alarm): void {
  const alarms = getAlarms();
  const idx = alarms.findIndex((a) => a.id === alarm.id);
  if (idx >= 0) {
    alarms[idx] = alarm;
  } else {
    alarms.push(alarm);
  }
  setJson(STORAGE_KEYS.ALARMS, alarms);
}

export function toggleAlarm(id: string, enabled: boolean): void {
  const alarms = getAlarms();
  const target = alarms.find((a) => a.id === id);
  if (target) {
    target.enabled = enabled;
    setJson(STORAGE_KEYS.ALARMS, alarms);
  }
}

export function deleteAlarm(id: string): void {
  const alarms = getAlarms().filter((a) => a.id !== id);
  setJson(STORAGE_KEYS.ALARMS, alarms);
}

// ----------------- Daily Mindful Reflections -----------------
export function getDailyReflections(): DailyReflection[] {
  return getJson<DailyReflection[]>(STORAGE_KEYS.REFLECTIONS, []);
}

export function saveDailyReflection(reflection: DailyReflection): void {
  const list = getDailyReflections();
  const index = list.findIndex((r) => r.date === reflection.date);
  if (index >= 0) {
    list[index] = reflection;
  } else {
    list.unshift(reflection);
  }
  setJson(STORAGE_KEYS.REFLECTIONS, list);
}

export function getTodayReflection(): DailyReflection | undefined {
  const todayStr = toLocalDateStr();
  return getDailyReflections().find((r) => r.date === todayStr);
}

// ----------------- Daily Habits & Rhythm -----------------
export const DEFAULT_HABITS: DailyHabit[] = [
  { id: 'habit_water', name: 'Drink 2L Water', iconName: 'Droplet', color: '#0284C7', completedDates: [] },
  { id: 'habit_focus', name: '25m Deep Focus', iconName: 'Brain', color: '#6366F1', completedDates: [] },
  { id: 'habit_walk', name: 'Morning Walk & Sunlight', iconName: 'Sun', color: '#F59E0B', completedDates: [] },
  { id: 'habit_read', name: 'Read 15 Minutes', iconName: 'BookOpen', color: '#10B981', completedDates: [] },
  { id: 'habit_unwind', name: 'Evening Unwind & Sleep Early', iconName: 'Moon', color: '#8B5CF6', completedDates: [] },
];

export function getHabits(): DailyHabit[] {
  return getJson<DailyHabit[]>(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
}

export function saveHabit(habit: DailyHabit): void {
  const habits = getHabits();
  const idx = habits.findIndex((h) => h.id === habit.id);
  if (idx >= 0) {
    habits[idx] = habit;
  } else {
    habits.push(habit);
  }
  setJson(STORAGE_KEYS.HABITS, habits);
}

export function toggleHabitForDate(habitId: string, dateStr: string): boolean {
  const habits = getHabits();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return false;
  const exists = habit.completedDates.includes(dateStr);
  if (exists) {
    habit.completedDates = habit.completedDates.filter((d) => d !== dateStr);
  } else {
    habit.completedDates = [...habit.completedDates, dateStr];
  }
  setJson(STORAGE_KEYS.HABITS, habits);
  return !exists;
}

export function deleteHabit(habitId: string): void {
  const habits = getHabits().filter((h) => h.id !== habitId);
  setJson(STORAGE_KEYS.HABITS, habits);
}

// ----------------- Settings -----------------
export function getSettings(): AppSettings {
  const current = getJson<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...current,
    pomodoro: {
      ...DEFAULT_SETTINGS.pomodoro,
      ...(current.pomodoro || {}),
    },
  };
}

export function saveSettings(settings: AppSettings): void {
  setJson(STORAGE_KEYS.SETTINGS, settings);
  applyTheme(settings.theme, settings.themePalette, settings.displayDensity);
}

// Clean system media listener
let systemMediaListener: ((e: MediaQueryListEvent) => void) | null = null;

export function applyTheme(
  theme: string,
  palette: ThemePalette = 'warm_linen',
  density: DisplayDensity = 'comfortable'
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Trigger subtle theme transition without scrolling lag
  if (document.body) {
    document.body.classList.add('theme-transitioning');
    setTimeout(() => {
      document.body?.classList.remove('theme-transitioning');
    }, 280);
  }

  // Set Palette attribute
  root.setAttribute('data-palette', palette);

  // Set Density attribute
  root.setAttribute('data-density', density);

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Remove existing media listener if any
  if (systemMediaListener) {
    mediaQuery.removeEventListener('change', systemMediaListener);
    systemMediaListener = null;
  }

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    if (mediaQuery.matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Attach real-time listener for system changes
    systemMediaListener = (e: MediaQueryListEvent) => {
      if (getSettings().theme === 'system') {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', systemMediaListener);
  }
}

// ----------------- Export / Import / Wipe -----------------
export interface DaylightBackup {
  version: 2;
  exportedAt: string;
  tasks: Task[];
  notes: Note[];
  categories: Category[];
  birthdays: Birthday[];
  alarms: Alarm[];
  settings: AppSettings;
}

export function exportAllData(): string {
  const data: DaylightBackup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    tasks: getTasks(),
    notes: getNotes(),
    categories: getCategories(),
    birthdays: getBirthdays(),
    alarms: getAlarms(),
    settings: getSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonString) as Partial<DaylightBackup>;
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid file content: not a valid JSON object.' };
    }

    if (Array.isArray(data.tasks)) setJson(STORAGE_KEYS.TASKS, data.tasks);
    if (Array.isArray(data.notes)) setJson(STORAGE_KEYS.NOTES, data.notes);
    if (Array.isArray(data.categories)) setJson(STORAGE_KEYS.CATEGORIES, data.categories);
    if (Array.isArray(data.birthdays)) setJson(STORAGE_KEYS.BIRTHDAYS, data.birthdays);
    if (Array.isArray(data.alarms)) setJson(STORAGE_KEYS.ALARMS, data.alarms);
    if (data.settings && typeof data.settings === 'object') {
      const merged = { ...DEFAULT_SETTINGS, ...data.settings };
      setJson(STORAGE_KEYS.SETTINGS, merged);
      applyTheme(merged.theme, merged.themePalette, merged.displayDensity);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.NOTES);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.BIRTHDAYS);
  localStorage.removeItem(STORAGE_KEYS.ALARMS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.FOCUS_STATE);
  localStorage.removeItem(STORAGE_KEYS.STOPWATCH_STATE);

  // Re-seed default categories, alarms & settings
  setJson(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  setJson(STORAGE_KEYS.ALARMS, DEFAULT_ALARMS);
  setJson(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  applyTheme(DEFAULT_SETTINGS.theme, DEFAULT_SETTINGS.themePalette, DEFAULT_SETTINGS.displayDensity);
  window.dispatchEvent(new Event('daylight_storage_update'));
}
