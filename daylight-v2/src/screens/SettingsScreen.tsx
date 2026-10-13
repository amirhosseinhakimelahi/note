import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Volume2,
  Smartphone,
  Calendar,
  Cake,
  Download,
  Upload,
  Trash2,
  Bell,
  Play,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';
import {
  AppSettings,
  ThemePreference,
  FirstDayOfWeek,
  ThemePalette,
  DisplayDensity,
  AlarmSound,
  NotificationSound,
} from '../types';
import { playNotificationSound, playAlarmSoundOnce, triggerVibration } from '../services/audio';
import {
  getNotificationPermission,
  requestNotificationPermission,
  testNotification
} from '../services/notifications';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Switch } from '../components/Switch';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onClearAllData: () => void;
  onBack: () => void;
  onOpenDownloadApk?: () => void;
}

const THEME_PALETTES: { id: ThemePalette; label: string; primaryColor: string; bgHint: string }[] = [
  { id: 'warm_linen', label: 'Warm Linen', primaryColor: '#6366F1', bgHint: '#FBF9F4' },
  { id: 'sage', label: 'Sage', primaryColor: '#10B981', bgHint: '#F5F7F4' },
  { id: 'soft_lavender', label: 'Soft Lavender', primaryColor: '#8B5CF6', bgHint: '#F9F7FC' },
  { id: 'slate_blue', label: 'Slate Blue', primaryColor: '#0284C7', bgHint: '#F4F6F9' },
];

const ALARM_SOUND_OPTIONS: { id: AlarmSound; label: string }[] = [
  { id: 'gentle_chimes', label: 'Gentle Chimes' },
  { id: 'morning_sunrise', label: 'Morning Sunrise' },
  { id: 'zen_bell', label: 'Zen Bell' },
  { id: 'melodic_harp', label: 'Melodic Harp' },
  { id: 'calm_breeze', label: 'Calm Breeze' },
];

const NOTIFICATION_SOUND_OPTIONS: { id: NotificationSound; label: string }[] = [
  { id: 'crystal_ping', label: 'Crystal Ping' },
  { id: 'soft_tap', label: 'Soft Tap' },
  { id: 'warm_chord', label: 'Warm Chord' },
  { id: 'dewdrop', label: 'Dewdrop' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onClearAllData,
  onBack,
  onOpenDownloadApk,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );
  const [showNotificationExplainer, setShowNotificationExplainer] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Stepper durations helper
  const handleDurationStep = (
    key: 'focusDurationMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'sessionsBeforeLongBreak',
    delta: number,
    min: number,
    max: number
  ) => {
    const current = settings.pomodoro[key];
    const next = Math.max(min, Math.min(max, current + delta));
    onUpdateSettings({
      ...settings,
      pomodoro: {
        ...settings.pomodoro,
        [key]: next,
      },
    });
  };

  const handleRequestNotifications = async () => {
    setShowNotificationExplainer(false);
    const result = await requestNotificationPermission();
    setNotificationStatus(result);
    if (result === 'granted') {
      testNotification();
      onUpdateSettings({ ...settings, notificationsEnabled: true });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        onImportData(content);
        setImportMessage({ text: 'Data successfully restored from backup!', isError: false });
      } catch (err) {
        setImportMessage({ text: 'Failed to restore: invalid backup JSON format.', isError: true });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 max-w-2xl mx-auto w-full pb-24">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Settings &amp; Preferences
          </h1>
          <p className="text-xs text-slate-500">Customize Daylight appearance, timers, and storage</p>
        </div>
      </div>

      {/* SECTION 1: THEME & COLOR PALETTES */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Theme &amp; Appearance
            </h2>
          </div>
        </div>

        {/* Light / Dark / System Mode */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor },
          ].map(({ id, label, icon: Icon }) => {
            const isSelected = settings.theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: id as ThemePreference })}
                className={`min-h-[46px] p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-200 ring-2 ring-indigo-500/30 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Muted Color Palettes */}
        <div className="pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Color Palette
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {THEME_PALETTES.map((pal) => {
              const isSelected = settings.themePalette === pal.id;
              return (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, themePalette: pal.id })}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: pal.primaryColor }}
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {pal.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Muted &amp; Readable
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Density */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Display Density
              </span>
              <p className="text-[11px] text-slate-500">Comfortable spacing vs compact information</p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            {(['comfortable', 'compact'] as DisplayDensity[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onUpdateSettings({ ...settings, displayDensity: d })}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                  settings.displayDensity === d
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: POMODORO DURATION STEPPERS (NO SPINNERS) */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Pomodoro Stepper Durations
            </h2>
          </div>
          <span className="text-xs text-slate-400">Minutes</span>
        </div>

        <div className="space-y-3.5">
          {/* Focus Duration */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Focus Session
              </span>
              <p className="text-xs text-slate-500">Target work interval (1–90 min)</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDurationStep('focusDurationMinutes', -5, 1, 90)}
                disabled={settings.pomodoro.focusDurationMinutes <= 1}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center shadow-sm cursor-pointer"
                aria-label="Decrease focus duration by 5 minutes"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-12 text-center text-base font-black text-slate-900 dark:text-white tabular-nums">
                {settings.pomodoro.focusDurationMinutes}m
              </span>

              <button
                type="button"
                onClick={() => handleDurationStep('focusDurationMinutes', 5, 1, 90)}
                disabled={settings.pomodoro.focusDurationMinutes >= 90}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center shadow-sm cursor-pointer"
                aria-label="Increase focus duration by 5 minutes"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Short Break */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Short Break
              </span>
              <p className="text-xs text-slate-500">Rest after focus (1–30 min)</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDurationStep('shortBreakMinutes', -1, 1, 30)}
                disabled={settings.pomodoro.shortBreakMinutes <= 1}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center shadow-sm cursor-pointer"
                aria-label="Decrease short break"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-12 text-center text-base font-black text-slate-900 dark:text-white tabular-nums">
                {settings.pomodoro.shortBreakMinutes}m
              </span>

              <button
                type="button"
                onClick={() => handleDurationStep('shortBreakMinutes', 1, 1, 30)}
                disabled={settings.pomodoro.shortBreakMinutes >= 30}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center shadow-sm cursor-pointer"
                aria-label="Increase short break"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Long Break */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Long Break
              </span>
              <p className="text-xs text-slate-500">Extended rest (5–60 min)</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDurationStep('longBreakMinutes', -5, 5, 60)}
                disabled={settings.pomodoro.longBreakMinutes <= 5}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center shadow-sm cursor-pointer"
                aria-label="Decrease long break"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-12 text-center text-base font-black text-slate-900 dark:text-white tabular-nums">
                {settings.pomodoro.longBreakMinutes}m
              </span>

              <button
                type="button"
                onClick={() => handleDurationStep('longBreakMinutes', 5, 5, 60)}
                disabled={settings.pomodoro.longBreakMinutes >= 60}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center shadow-sm cursor-pointer"
                aria-label="Increase long break"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sessions Before Long Break */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Sessions Before Long Break
              </span>
              <p className="text-xs text-slate-500">Required completed focus blocks (2–8)</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDurationStep('sessionsBeforeLongBreak', -1, 2, 8)}
                disabled={settings.pomodoro.sessionsBeforeLongBreak <= 2}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center shadow-sm cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-12 text-center text-base font-black text-slate-900 dark:text-white tabular-nums">
                {settings.pomodoro.sessionsBeforeLongBreak}
              </span>

              <button
                type="button"
                onClick={() => handleDurationStep('sessionsBeforeLongBreak', 1, 2, 8)}
                disabled={settings.pomodoro.sessionsBeforeLongBreak >= 8}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Auto-start breaks toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Auto-Start Breaks
              </span>
              <p className="text-[11px] text-slate-500">Immediately begin break countdown when focus finishes</p>
            </div>
            <Switch
              checked={settings.pomodoro.autoStartBreaks}
              onChange={(checked) =>
                onUpdateSettings({
                  ...settings,
                  pomodoro: {
                    ...settings.pomodoro,
                    autoStartBreaks: checked,
                  },
                })
              }
              aria-label="Toggle auto-start breaks"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: CALENDAR, WEEK START & SOLAR HIJRI */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Calendar &amp; Date Systems
          </h2>
        </div>

        {/* First day of week with Saturday support */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            First Day of the Week
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'saturday', label: 'Saturday' },
              { id: 'sunday', label: 'Sunday' },
              { id: 'monday', label: 'Monday' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onUpdateSettings({ ...settings, firstDayOfWeek: id as FirstDayOfWeek })}
                className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  settings.firstDayOfWeek === id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Persian Solar Hijri (Jalali) Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Secondary Solar Hijri Dates (هجری شمسی)
            </span>
            <p className="text-[11px] text-slate-500">
              Show Iranian Jalali dates beside Gregorian dates on Home, Tasks, and Calendar
            </p>
          </div>
          <Switch
            checked={settings.showSolarHijriDates}
            onChange={(checked) => onUpdateSettings({ ...settings, showSolarHijriDates: checked })}
            aria-label="Toggle Solar Hijri dates"
          />
        </div>

        {/* Birthday Countdown on Home */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Cake className="w-4 h-4 text-rose-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Upcoming Birthday on Home
              </span>
              <p className="text-[11px] text-slate-500">Show birthday countdown card on Home dashboard</p>
            </div>
          </div>
          <Switch
            checked={settings.showBirthdayCountdownOnHome}
            onChange={(checked) => onUpdateSettings({ ...settings, showBirthdayCountdownOnHome: checked })}
            aria-label="Toggle upcoming birthday countdown on Home"
          />
        </div>
      </div>

      {/* SECTION 4: SELECTABLE SOUNDS (ALARMS & NOTIFICATIONS) */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Audio &amp; Notification Sounds
          </h2>
        </div>

        {/* Alarm Sound Picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Default Alarm Sound
            </label>
            <button
              type="button"
              onClick={() => playAlarmSoundOnce(settings.alarmSound)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" /> Preview
            </button>
          </div>
          <select
            value={settings.alarmSound}
            onChange={(e) => onUpdateSettings({ ...settings, alarmSound: e.target.value as AlarmSound })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          >
            {ALARM_SOUND_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Sound Picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Default Notification Sound
            </label>
            <button
              type="button"
              onClick={() => playNotificationSound(settings.notificationSound)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" /> Preview
            </button>
          </div>
          <select
            value={settings.notificationSound}
            onChange={(e) => onUpdateSettings({ ...settings, notificationSound: e.target.value as NotificationSound })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          >
            {NOTIFICATION_SOUND_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sound & Vibration Toggles */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Enable Timer Sounds
            </span>
            <Switch
              checked={settings.pomodoro.soundEnabled}
              onChange={(checked) =>
                onUpdateSettings({
                  ...settings,
                  pomodoro: {
                    ...settings.pomodoro,
                    soundEnabled: checked,
                  },
                })
              }
              aria-label="Toggle timer sounds"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Enable Vibration
            </span>
            <Switch
              checked={settings.pomodoro.vibrationEnabled}
              onChange={(checked) => {
                onUpdateSettings({
                  ...settings,
                  pomodoro: {
                    ...settings.pomodoro,
                    vibrationEnabled: checked,
                  },
                });
                if (checked) triggerVibration([100, 50, 100]);
              }}
              aria-label="Toggle timer vibration"
            />
          </div>
        </div>
      </div>

      {/* SECTION: ANDROID APK & INSTALLATION */}
      {onOpenDownloadApk && (
        <div className="rounded-[28px] bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
              Android Application &amp; APK
            </h2>
          </div>

          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            Install Daylight directly as an Android WebAPK with offline support, or export the complete native Kotlin Android Studio project ready for building release APK binaries.
          </p>

          <button
            type="button"
            onClick={onOpenDownloadApk}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" /> Get Android App / Download APK Source
          </button>
        </div>
      )}

      {/* SECTION 5: LOCAL DATA BACKUP & WIPE */}
      <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Local Storage &amp; Backup
          </h2>
        </div>

        {importMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-medium ${
              importMessage.isError
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {importMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onExportData}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Backup (JSON)
          </button>

          <label className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
            <Upload className="w-4 h-4" /> Import Backup (JSON)
            <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
          </label>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete All Local Data
          </button>
        </div>
      </div>

      {/* Confirmation modal for data wipe */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Permanently Delete All Data?"
        message="This action will erase all notes, sketches, tasks, birthdays, alarms, and settings. This cannot be undone."
        confirmLabel="Erase All Data"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          onClearAllData();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
