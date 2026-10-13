import React, { useState } from 'react';
import {
  X,
  Plus,
  Bell,
  Clock,
  Trash2,
  Volume2,
  Play,
  Brain,
  Check,
  AlertCircle
} from 'lucide-react';
import { Alarm, AlarmSound } from '../types';
import { playAlarmSoundOnce } from '../services/audio';
import { Switch } from '../components/Switch';

interface AlarmsSheetProps {
  isOpen: boolean;
  alarms: Alarm[];
  onSaveAlarm: (alarm: Alarm) => void;
  onToggleAlarm: (id: string, enabled: boolean) => void;
  onDeleteAlarm: (id: string) => void;
  onTriggerTestAlarm: (alarm: Alarm) => void;
  onClose: () => void;
}

const ALARM_SOUND_OPTIONS: { id: AlarmSound; label: string }[] = [
  { id: 'gentle_chimes', label: 'Gentle Chimes' },
  { id: 'morning_sunrise', label: 'Morning Sunrise' },
  { id: 'zen_bell', label: 'Zen Bell' },
  { id: 'melodic_harp', label: 'Melodic Harp' },
  { id: 'calm_breeze', label: 'Calm Breeze' },
];

const DAYS_OF_WEEK = [
  { day: 0, label: 'S' },
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
];

export const AlarmsSheet: React.FC<AlarmsSheetProps> = ({
  isOpen,
  alarms,
  onSaveAlarm,
  onToggleAlarm,
  onDeleteAlarm,
  onTriggerTestAlarm,
  onClose,
}) => {
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Form State
  const [time, setTime] = useState('08:00');
  const [label, setLabel] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sound, setSound] = useState<AlarmSound>('morning_sunrise');
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [mathEnabled, setMathEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingAlarm(null);
    setTime('08:00');
    setLabel('');
    setRepeatDays([1, 2, 3, 4, 5]);
    setSound('morning_sunrise');
    setSnoozeEnabled(true);
    setMathEnabled(true);
    setDifficulty('easy');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setTime(alarm.time);
    setLabel(alarm.label);
    setRepeatDays(alarm.repeatDays || []);
    setSound(alarm.sound);
    setSnoozeEnabled(alarm.snoozeEnabled);
    setMathEnabled(alarm.mathChallenge?.enabled || false);
    setDifficulty(alarm.mathChallenge?.difficulty || 'easy');
    setIsEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const toSave: Alarm = {
      id: editingAlarm?.id || 'alarm_' + Date.now(),
      time,
      label: label.trim(),
      enabled: true,
      repeatDays,
      sound,
      snoozeEnabled,
      mathChallenge: {
        enabled: mathEnabled,
        difficulty,
      },
      createdAt: editingAlarm?.createdAt || new Date().toISOString(),
    };
    onSaveAlarm(toSave);
    setIsEditorOpen(false);
  };

  const toggleDay = (d: number) => {
    if (repeatDays.includes(d)) {
      setRepeatDays(repeatDays.filter((x) => x !== d));
    } else {
      setRepeatDays([...repeatDays, d]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 flex flex-col max-h-[90vh]">
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Alarm Clock
              </h2>
              <p className="text-xs text-slate-500">With Wake-up Math Challenges</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isEditorOpen ? (
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Alarms ({alarms.length})
              </span>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Alarm
              </button>
            </div>

            {alarms.length === 0 ? (
              <div className="py-12 text-center space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 p-6">
                <Bell className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No alarms set
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Set morning or study alarms with optional arithmetic challenges to ensure you wake up.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between shadow-sm"
                  >
                    <div
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() => handleOpenEdit(alarm)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                          {alarm.time}
                        </span>
                        {alarm.mathChallenge?.enabled && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Math Challenge
                          </span>
                        )}
                      </div>
                      {alarm.label && alarm.label !== 'Alarm' && (
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {alarm.label}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {alarm.repeatDays.length === 0
                          ? 'Once'
                          : alarm.repeatDays.length === 7
                          ? 'Every day'
                          : alarm.repeatDays.length === 5 && !alarm.repeatDays.includes(0) && !alarm.repeatDays.includes(6)
                          ? 'Weekdays'
                          : `${alarm.repeatDays.length} days / week`}
                        {' • '}
                        {alarm.sound.replace('_', ' ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      {/* Test alarm trigger */}
                      <button
                        type="button"
                        onClick={() => onTriggerTestAlarm(alarm)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 transition-colors"
                        title="Test Alarm Sound & Challenge Now"
                      >
                        Test
                      </button>

                      {/* Enable/disable toggle */}
                      <Switch
                        checked={alarm.enabled}
                        onChange={(val) => onToggleAlarm(alarm.id, val)}
                        size="sm"
                        aria-label="Toggle alarm status"
                      />

                      <button
                        type="button"
                        onClick={() => onDeleteAlarm(alarm.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete alarm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* EDIT / CREATE FORM */
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {/* Time Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Alarm Time *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-2xl font-black text-center text-slate-900 dark:text-white"
                required
              />
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Title / Purpose (Optional)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Morning wake-up, Study session"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>

            {/* Repeat Days */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Repeat Days
              </label>
              <div className="flex items-center justify-between gap-1">
                {DAYS_OF_WEEK.map(({ day, label: dLabel }) => {
                  const isSelected = repeatDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {dLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound Selection with Instant Preview Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Alarm Sound
                </label>
                <button
                  type="button"
                  onClick={() => playAlarmSoundOnce(sound)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" /> Preview Sound
                </button>
              </div>

              <select
                value={sound}
                onChange={(e) => setSound(e.target.value as AlarmSound)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              >
                {ALARM_SOUND_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Wake-up Math Challenge Toggle & Difficulty */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Wake-up Math Challenge
                    </span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Must solve arithmetic to stop ringing
                    </p>
                  </div>
                </div>

                <Switch
                  checked={mathEnabled}
                  onChange={(val) => setMathEnabled(val)}
                  size="sm"
                  aria-label="Toggle math challenge"
                />
              </div>

              {mathEnabled && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold mr-1">
                    Difficulty:
                  </span>
                  {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                        difficulty === lvl
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Snooze Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Allow Snooze (5 minutes)
                </span>
              </div>
              <Switch
                checked={snoozeEnabled}
                onChange={(val) => setSnoozeEnabled(val)}
                size="sm"
                aria-label="Toggle snooze"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                Save Alarm
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
