import { toLocalDateStr } from '../services/date';
import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Cake,
  Clock,
  CheckCircle2,
  Circle,
  CalendarDays,
  Trash2,
  Edit3
} from 'lucide-react';
import { Task, Birthday, FirstDayOfWeek } from '../types';
import { getBirthdayDetails } from '../services/storage';
import { formatToSolarHijri, formatToSolarHijriShort } from '../services/jalali';

interface CalendarScreenProps {
  tasks: Task[];
  birthdays: Birthday[];
  firstDayOfWeek: FirstDayOfWeek;
  showSolarHijriDates: boolean;
  onOpenCreateTaskForDate: (date: string) => void;
  onOpenEditTask: (task: Task) => void;
  onToggleTaskComplete: (id: string, completed: boolean) => void;
  onOpenCreateBirthday: () => void;
  onOpenEditBirthday: (birthday: Birthday) => void;
  onRequestDeleteBirthday: (id: string) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  tasks,
  birthdays,
  firstDayOfWeek,
  showSolarHijriDates,
  onOpenCreateTaskForDate,
  onOpenEditTask,
  onToggleTaskComplete,
  onOpenCreateBirthday,
  onOpenEditBirthday,
  onRequestDeleteBirthday,
}) => {
  const [subTab, setSubTab] = useState<'calendar' | 'birthdays'>('calendar');

  const today = new Date();
  const todayStr = toLocalDateStr(today);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  // Week header labels and startDay offset calculation
  const { weekHeaders, startDayOffsetFn } = useMemo(() => {
    if (firstDayOfWeek === 'saturday') {
      return {
        weekHeaders: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startDayOffsetFn: (gDay: number) => (gDay + 1) % 7, // Sun=0->1, Mon=1->2, ... Sat=6->0
      };
    } else if (firstDayOfWeek === 'monday') {
      return {
        weekHeaders: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        startDayOffsetFn: (gDay: number) => (gDay + 6) % 7, // Mon=1->0, Sun=0->6
      };
    } else {
      // Sunday
      return {
        weekHeaders: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        startDayOffsetFn: (gDay: number) => gDay, // Sun=0
      };
    }
  }, [firstDayOfWeek]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const totalDaysInMonth = lastDayOfMonth.getDate();
    const gDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const startDayOfWeek = startDayOffsetFn(gDayOfWeek);

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNumber: dayNum, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNumber: i, isCurrentMonth: true });
    }

    // Next month padding
    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNumber: i, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth, startDayOffsetFn]);

  // Tasks mapped by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const list = map.get(t.dueDate) || [];
      list.push(t);
      map.set(t.dueDate, list);
    });
    return map;
  }, [tasks]);

  // Birthdays mapped by MM-DD
  const birthdaysByDate = useMemo(() => {
    const map = new Map<string, Birthday[]>();
    birthdays.forEach((b) => {
      const parts = b.birthDate.split('-');
      const m = parts.length === 3 ? parts[1] : parts[0];
      const d = parts.length === 3 ? parts[2] : parts[1];
      const key = `${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const list = map.get(key) || [];
      list.push(b);
      map.set(key, list);
    });
    return map;
  }, [birthdays]);

  const selectedDateTasks = tasksByDate.get(selectedDate) || [];
  const selectedMonthDay = selectedDate.substring(5);
  const selectedDateBirthdays = birthdaysByDate.get(selectedMonthDay) || [];

  const [sYear, sMonth, sDay] = selectedDate.split('-').map(Number);
  const selectedDateFormatted = new Date(sYear, sMonth - 1, sDay).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const selectedDateSolarHijri = formatToSolarHijri(selectedDate);

  const sortedBirthdays = useMemo(() => {
    return birthdays
      .map((b) => ({
        birthday: b,
        details: getBirthdayDetails(b, today),
      }))
      .sort((a, b) => a.details.daysRemaining - b.details.daysRemaining);
  }, [birthdays]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-2xl mx-auto w-full pb-24">
      {/* Top Header & Sub-tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">
            Calendar &amp; Events
          </h1>
          <p className="text-xs text-slate-500">
            Due dates, agenda schedule, and birthday countdowns
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setSubTab('calendar')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'calendar'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Calendar
          </button>
          <button
            type="button"
            onClick={() => setSubTab('birthdays')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'birthdays'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Cake className="w-3.5 h-3.5" /> Birthdays ({birthdays.length})
          </button>
        </div>
      </div>

      {subTab === 'calendar' ? (
        <>
          {/* Calendar Card */}
          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
            {/* Month & Navigation Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {monthName}
                </h2>
                {showSolarHijriDates && (
                  <p className="text-[11px] text-slate-400">
                    {formatToSolarHijri(new Date(currentYear, currentMonth, 1))}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="min-h-[36px] px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Weekday headers respecting Saturday/Sunday/Monday start */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {weekHeaders.map((day) => (
                <span
                  key={day}
                  className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 py-1"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map(({ dateStr, dayNumber, isCurrentMonth }) => {
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === todayStr;

                const dayTasks = tasksByDate.get(dateStr) || [];
                const dayMonthPart = dateStr.substring(5);
                const dayBirthdays = birthdaysByDate.get(dayMonthPart) || [];

                const hasIncompleteTasks = dayTasks.some((t) => !t.completed);
                const hasBirthdays = dayBirthdays.length > 0;
                const solarShort = showSolarHijriDates ? formatToSolarHijriShort(dateStr) : '';

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative min-h-[50px] sm:min-h-[56px] p-1 rounded-2xl flex flex-col items-center justify-start transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md scale-102 z-10'
                        : isToday
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                        : isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <span className="text-xs sm:text-sm mt-0.5">{dayNumber}</span>

                    {/* Secondary Solar Hijri day label */}
                    {showSolarHijriDates && (
                      <span
                        className={`text-[9px] font-normal leading-none ${
                          isSelected ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {solarShort}
                      </span>
                    )}

                    {/* Indicators container */}
                    <div className="flex items-center gap-1 mt-1">
                      {hasIncompleteTasks && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-indigo-500'
                          }`}
                          title="Tasks due"
                        />
                      )}
                      {hasBirthdays && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-amber-300' : 'bg-rose-500'
                          }`}
                          title="Birthday"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Agenda Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Agenda for {selectedDateFormatted}
                </h3>
                {showSolarHijriDates && (
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Solar Hijri: {selectedDateSolarHijri}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {selectedDateTasks.length} task{selectedDateTasks.length === 1 ? '' : 's'} • {selectedDateBirthdays.length} birthday{selectedDateBirthdays.length === 1 ? '' : 's'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenCreateTaskForDate(selectedDate)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add for this Date
              </button>
            </div>

            {/* Birthdays on selected date */}
            {selectedDateBirthdays.map((b) => (
              <div
                key={b.id}
                onClick={() => onOpenEditBirthday(b)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 cursor-pointer hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center">
                    <Cake className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                      {b.name}'s Birthday!
                    </h4>
                    {b.birthYear && (
                      <p className="text-xs text-rose-700 dark:text-rose-300">
                        Born in {b.birthYear} (Turning {currentYear - b.birthYear})
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Edit
                </span>
              </div>
            ))}

            {/* Tasks on this date */}
            {selectedDateTasks.length === 0 && selectedDateBirthdays.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center space-y-2">
                <CalendarIcon className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">
                  No tasks or events scheduled for this day.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenCreateTaskForDate(selectedDate)}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  + Add task for {selectedDate}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleTaskComplete(task.id, !task.completed)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div
                        className="cursor-pointer min-w-0"
                        onClick={() => onOpenEditTask(task)}
                      >
                        <p
                          className={`text-sm font-semibold truncate ${
                            task.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.dueTime && (
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {task.dueTime}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenEditTask(task)}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-2"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* BIRTHDAY MANAGEMENT SUB-TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Upcoming Birthdays
              </h2>
              <p className="text-xs text-slate-500">
                Automatic yearly reminders and age tracking
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenCreateBirthday}
              className="min-h-[44px] px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Birthday
            </button>
          </div>

          {birthdays.length === 0 ? (
            <div className="py-14 text-center space-y-3 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900/40 p-6">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-500 flex items-center justify-center mx-auto">
                <Cake className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No birthdays added yet
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Add friends and family birthdays to see automatic yearly countdowns and age reminders.
              </p>
              <button
                type="button"
                onClick={onOpenCreateBirthday}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-rose-600 text-white text-xs font-semibold shadow hover:bg-rose-700 cursor-pointer"
              >
                Add First Birthday
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedBirthdays.map(({ birthday, details }) => (
                <div
                  key={birthday.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-800 transition-all"
                >
                  <div
                    className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                    onClick={() => onOpenEditBirthday(birthday)}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <Cake className="w-6 h-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {birthday.name}
                        </h4>
                        {details.isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                            TODAY 🎉
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {details.isToday
                          ? 'Celebrate today!'
                          : `In ${details.daysRemaining} days`}
                        {details.turningAge ? ` • Turning ${details.turningAge}` : ''}
                        {showSolarHijriDates && (
                          <span className="text-slate-400 ml-1">
                            ({formatToSolarHijri(details.nextBirthdayDate)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => onOpenEditBirthday(birthday)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestDeleteBirthday(birthday.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
