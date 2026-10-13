import React, { useState, useEffect } from 'react';
import { X, Cake, Calendar, Bell, Trash2, AlertCircle } from 'lucide-react';
import { Birthday } from '../types';
import { getBirthdayDetails } from '../services/storage';

interface BirthdayEditorModalProps {
  isOpen: boolean;
  initialBirthday?: Birthday | null;
  onSave: (birthday: Birthday) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const BirthdayEditorModal: React.FC<BirthdayEditorModalProps> = ({
  isOpen,
  initialBirthday,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [birthMonth, setBirthMonth] = useState('1');
  const [birthDay, setBirthDay] = useState('1');
  const [birthYear, setBirthYear] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(0);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (initialBirthday) {
      setName(initialBirthday.name);
      const parts = initialBirthday.birthDate.split('-');
      if (parts.length === 3) {
        setBirthMonth(String(parseInt(parts[1], 10)));
        setBirthDay(String(parseInt(parts[2], 10)));
      } else if (parts.length === 2) {
        setBirthMonth(String(parseInt(parts[0], 10)));
        setBirthDay(String(parseInt(parts[1], 10)));
      }
      setBirthYear(initialBirthday.birthYear ? String(initialBirthday.birthYear) : '');
      setNotes(initialBirthday.notes || '');
      setReminderDaysBefore(initialBirthday.reminderDaysBefore ?? 0);
    } else {
      const today = new Date();
      setName('');
      setBirthMonth(String(today.getMonth() + 1));
      setBirthDay(String(today.getDate()));
      setBirthYear('');
      setNotes('');
      setReminderDaysBefore(0);
    }
    setErrors({});
  }, [initialBirthday, isOpen]);

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const parsedYear = birthYear ? parseInt(birthYear, 10) : undefined;
  const formattedDate = `${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

  const previewDetails = getBirthdayDetails({
    id: 'preview',
    name: name || 'Friend',
    birthDate: formattedDate,
    birthYear: parsedYear,
    reminderDaysBefore,
    createdAt: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "Person's name is required" });
      return;
    }

    const bday: Birthday = {
      id: initialBirthday?.id || 'bday_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      birthDate: formattedDate,
      birthYear: parsedYear && parsedYear > 1900 && parsedYear <= currentYear ? parsedYear : undefined,
      notes: notes.trim() || undefined,
      reminderDaysBefore,
      createdAt: initialBirthday?.createdAt || new Date().toISOString(),
    };

    onSave(bday);
    onClose();
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md my-auto rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-all flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Cake className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialBirthday ? 'Edit Birthday' : 'Add Birthday'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Person's Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({});
              }}
              placeholder="e.g., Sarah Parker"
              className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border ${
                errors.name
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
              } text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2`}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
              </p>
            )}
          </div>

          {/* Month & Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Month *
              </label>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {months.map((m, idx) => (
                  <option key={m} value={String(idx + 1)}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Day *
              </label>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Birth year (optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Birth Year (optional for age calculation)
            </label>
            <input
              type="number"
              min="1900"
              max={currentYear}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder={`e.g., 2002`}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Reminder preference */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-500" /> Reminder Preference
            </label>
            <select
              value={reminderDaysBefore}
              onChange={(e) => setReminderDaysBefore(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="0">On the birthday</option>
              <option value="1">1 day beforehand</option>
              <option value="3">3 days beforehand</option>
              <option value="7">7 days beforehand</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Gift Ideas / Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Likes coffee mugs, books..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              <div>
                <span className="font-semibold text-rose-900 dark:text-rose-200">
                  {previewDetails.isToday
                    ? '🎉 Birthday is TODAY!'
                    : `In ${previewDetails.daysRemaining} days`}
                </span>
                {previewDetails.turningAge && (
                  <span className="text-rose-700 dark:text-rose-300 ml-1">
                    (Turns {previewDetails.turningAge})
                  </span>
                )}
              </div>
            </div>
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              Repeats yearly
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {initialBirthday && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(initialBirthday.id)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete birthday"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="min-h-[44px] px-5 py-2 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {initialBirthday ? 'Save' : 'Add Birthday'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
