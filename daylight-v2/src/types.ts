export type Priority = 'Low' | 'Medium' | 'High';

export type Recurrence = 'None' | 'Daily' | 'Weekly' | 'Monthly';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color
  isDefault?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm (optional 24h)
  priority: Priority;
  categoryId: string;
  reminder: 'None' | 'AtTime' | '15MinBefore' | '1HourBefore' | '1DayBefore';
  recurrence: Recurrence;
  completed: boolean;
  completedAt?: string; // ISO string
  checklist: ChecklistItem[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type PenType = 'pen' | 'calligraphy' | 'pencil' | 'marker' | 'highlighter' | 'eraser';

// Advanced note elements
export interface DrawingStroke {
  id: string;
  tool: PenType;
  color: string;
  size: number;
  opacity?: number;
  points: { x: number; y: number; pressure?: number }[];
}

export interface NoteTextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export interface NoteImageBlock {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NotePage {
  id: string;
  background: 'blank' | 'lined' | 'grid';
  strokes: DrawingStroke[];
  textBlocks: NoteTextBlock[];
  images: NoteImageBlock[];
}

export interface Note {
  id: string;
  title: string;
  body: string;
  color: string; // Background tint class or hex
  labels: string[];
  isPinned: boolean;
  isAdvanced?: boolean;
  advancedPages?: NotePage[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Birthday {
  id: string;
  name: string;
  birthDate: string; // MM-DD or YYYY-MM-DD
  birthYear?: number;
  notes?: string;
  reminderDaysBefore: number; // 0 (on the day), 1, 3, or 7 days before
  createdAt: string;
}

export interface PomodoroSettings {
  focusDurationMinutes: number; // default 25
  shortBreakMinutes: number; // default 5
  longBreakMinutes: number; // default 15
  sessionsBeforeLongBreak: number; // default 4
  autoStartBreaks: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export type ThemePreference = 'system' | 'light' | 'dark';
export type FirstDayOfWeek = 'monday' | 'sunday' | 'saturday';
export type ThemePalette = 'warm_linen' | 'sage' | 'soft_lavender' | 'slate_blue';
export type DisplayDensity = 'comfortable' | 'compact';

export type AlarmSound =
  | 'gentle_chimes'
  | 'morning_sunrise'
  | 'zen_bell'
  | 'melodic_harp'
  | 'calm_breeze';

export type NotificationSound =
  | 'crystal_ping'
  | 'soft_tap'
  | 'warm_chord'
  | 'dewdrop';

export interface Alarm {
  id: string;
  time: string; // "HH:mm" (24h)
  label: string;
  enabled: boolean;
  repeatDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat (empty for one-shot)
  sound: AlarmSound;
  snoozeEnabled: boolean;
  mathChallenge: {
    enabled: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  createdAt: string;
}

export interface StopwatchLap {
  id: string;
  lapNumber: number;
  lapDurationMs: number;
  overallDurationMs: number;
}

export interface AppSettings {
  theme: ThemePreference;
  firstDayOfWeek: FirstDayOfWeek;
  showBirthdayCountdownOnHome: boolean;
  showSolarHijriDates: boolean;
  themePalette: ThemePalette;
  displayDensity: DisplayDensity;
  alarmSound: AlarmSound;
  notificationSound: NotificationSound;
  pomodoro: PomodoroSettings;
  notificationsEnabled: boolean;
}

export type TabDestination = 'home' | 'notes' | 'planner' | 'calendar' | 'focus';
export type FocusModeType = 'pomodoro' | 'stopwatch';

export type MoodEnergyType = 'sunny' | 'energized' | 'calm' | 'focused' | 'restful';

export interface DailyReflection {
  date: string; // YYYY-MM-DD
  mood: MoodEnergyType;
  reflectionNote?: string;
}

export interface DailyHabit {
  id: string;
  name: string;
  iconName?: string;
  color?: string;
  completedDates: string[]; // List of YYYY-MM-DD
}
