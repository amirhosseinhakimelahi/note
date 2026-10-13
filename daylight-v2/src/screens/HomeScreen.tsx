import { toLocalDateStr } from '../services/date';
import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Play,
  Plus,
  Cake,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Bell,
  CheckSquare,
  Brain,
  Check,
  Droplet,
  Sun,
  Moon,
  BookOpen,
  Download,
  Smartphone,
  Flame,
  Volume2,
  X
} from 'lucide-react';
import { Task, Birthday, Note, TabDestination, Alarm, DailyHabit } from '../types';
import { getBirthdayDetails } from '../services/storage';
import { formatToSolarHijri } from '../services/jalali';
import { Switch } from '../components/Switch';

interface HomeScreenProps {
  tasks: Task[];
  birthdays: Birthday[];
  notes: Note[];
  alarms: Alarm[];
  habits: DailyHabit[];
  showBirthdayCountdown: boolean;
  showSolarHijriDates: boolean;
  onNavigateTab: (tab: TabDestination) => void;
  onOpenQuickCapture: () => void;
  onOpenTask: (task: Task) => void;
  onOpenBirthday: (birthday: Birthday) => void;
  onOpenCreateBirthday: () => void;
  onToggleTaskComplete: (id: string, completed: boolean) => void;
  onStartFocus: () => void;
  onOpenAlarms: () => void;
  onToggleAlarm: (id: string, enabled: boolean) => void;
  onOpenEditAlarm: (alarm: Alarm) => void;
  onOpenCreateAlarm: () => void;
  onTriggerTestAlarm: (alarm: Alarm) => void;
  onToggleHabit: (habitId: string) => void;
  onAddHabit?: (name: string) => void;
  onDeleteHabit?: (habitId: string) => void;
  onOpenDownloadApk?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  tasks,
  birthdays,
  notes,
  alarms,
  habits,
  showBirthdayCountdown,
  showSolarHijriDates,
  onNavigateTab,
  onOpenQuickCapture,
  onOpenTask,
  onOpenBirthday,
  onOpenCreateBirthday,
  onToggleTaskComplete,
  onStartFocus,
  onOpenAlarms,
  onToggleAlarm,
  onOpenEditAlarm,
  onOpenCreateAlarm,
  onTriggerTestAlarm,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onOpenDownloadApk,
}) => {
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const now = new Date();
  const todayStr = toLocalDateStr(now);

  // Dynamic greeting based on hour
  const hour = now.getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  // Format today's Gregorian date: "Tuesday, October 13"
  const formattedToday = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Secondary Solar Hijri date
  const solarHijriToday = formatToSolarHijri(now);

  // Filter today's incomplete tasks: ordered by time and priority
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  const todayTasks = tasks
    .filter((t) => t.dueDate === todayStr && !t.completed)
    .sort((a, b) => {
      if (a.dueTime && b.dueTime) {
        const timeDiff = a.dueTime.localeCompare(b.dueTime);
        if (timeDiff !== 0) return timeDiff;
      } else if (a.dueTime && !b.dueTime) return -1;
      else if (!a.dueTime && b.dueTime) return 1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  // Filter upcoming tasks
  const nextWeekDate = new Date(now);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeekStr = toLocalDateStr(nextWeekDate);

  const upcomingTasks = tasks
    .filter((t) => t.dueDate > todayStr && t.dueDate <= nextWeekStr && !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5);

  // Next upcoming birthday
  let nextBirthday: { birthday: Birthday; details: ReturnType<typeof getBirthdayDetails> } | null = null;
  if (birthdays.length > 0) {
    const sorted = birthdays
      .map((b) => ({ birthday: b, details: getBirthdayDetails(b, now) }))
      .sort((a, b) => a.details.daysRemaining - b.details.daysRemaining);
    if (sorted.length > 0) {
      nextBirthday = sorted[0];
    }
  }

  // Habits completed today
  const habitsCompletedCount = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const habitCompletionRate = habits.length > 0 ? Math.round((habitsCompletedCount / habits.length) * 100) : 0;

  // Active alarms sorted by time
  const activeAlarms = [...alarms].sort((a, b) => a.time.localeCompare(b.time));
  const nextActiveAlarm = activeAlarms.find((a) => a.enabled);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 max-w-2xl mx-auto w-full pb-24 overscroll-y-contain">
      {/* Friendly greeting & date header with Solar Hijri subtitle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{formattedToday}</span>
            {showSolarHijriDates && (
              <span className="text-amber-700 dark:text-amber-400 pl-1 border-l border-amber-300 dark:border-amber-800">
                {solarHijriToday}
              </span>
            )}
          </div>

          {/* Quick APK / Android install button */}
          {onOpenDownloadApk && (
          <button
            type="button"
            onClick={onOpenDownloadApk}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Download APK or Install Native Android App"
          >
            <Smartphone className="w-3 h-3 text-emerald-600" />
            <span>Get APK</span>
          </button>
          )}
        </div>

        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight pt-1">
          {greeting}, friend
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {todayTasks.length === 0
            ? "You're all caught up for today. Enjoy the calm!"
            : `You have ${todayTasks.length} task${todayTasks.length === 1 ? '' : 's'} scheduled for today.`}
        </p>
      </div>

      {/* Prominent Quick-Start Focus Timer Banner */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-5 text-white shadow-lg shadow-indigo-500/20">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1 pr-4">
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-200">
              Deep Focus &amp; Productivity
            </span>
            <h2 className="text-xl font-bold leading-tight">
              Ready for a productive session?
            </h2>
            <p className="text-xs text-indigo-100/90">
              Pomodoro study blocks, lap stopwatch, and peaceful white noise.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={onStartFocus}
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-white text-indigo-700 font-bold text-xs shadow hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-700" /> Start Focus
            </button>
          </div>
        </div>
      </div>

      {/* ALARMS SECTION DIRECTLY ON HOME (Without redundant alarm labels) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white leading-tight">
                Alarms &amp; Wake-up
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCreateAlarm}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Alarm
            </button>
            <button
              type="button"
              onClick={onOpenAlarms}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {activeAlarms.length === 0 ? (
          <div
            onClick={onOpenCreateAlarm}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1.5 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No alarms configured
            </p>
            <p className="text-[11px] text-slate-500">
              Set a morning or study alarm with math challenges to keep your schedule punctual.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeAlarms.map((alarm) => {
              // Convert 24h "HH:mm" to friendly 12h display
              const [hStr, mStr] = alarm.time.split(':');
              const hNum = parseInt(hStr, 10);
              const period = hNum >= 12 ? 'PM' : 'AM';
              const display12h = `${hNum % 12 === 0 ? 12 : hNum % 12}:${mStr}`;

              // Format repeat summary
              const repeatText =
                alarm.repeatDays.length === 0
                  ? 'Once'
                  : alarm.repeatDays.length === 7
                  ? 'Every day'
                  : alarm.repeatDays.length === 5 && !alarm.repeatDays.includes(0) && !alarm.repeatDays.includes(6)
                  ? 'Mon–Fri'
                  : `${alarm.repeatDays.length} days`;

              return (
                <div
                  key={alarm.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    alarm.enabled
                      ? 'bg-white dark:bg-slate-900 border-indigo-200/80 dark:border-indigo-900/60 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75'
                  }`}
                >
                  <div
                    className="cursor-pointer flex-1 min-w-0 pr-2"
                    onClick={() => onOpenEditAlarm(alarm)}
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {display12h}
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {period}
                      </span>
                      {alarm.mathChallenge?.enabled && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ml-1">
                          <Brain className="w-2.5 h-2.5" /> Math
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {alarm.label && alarm.label !== 'Alarm' ? (
                        <>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {alarm.label}
                          </span>
                          <span>•</span>
                        </>
                      ) : null}
                      <span>{repeatText}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onTriggerTestAlarm(alarm)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                      title="Test ring sound"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <Switch
                      checked={alarm.enabled}
                      onChange={(checked) => onToggleAlarm(alarm.id, checked)}
                      size="sm"
                      aria-label="Toggle alarm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NEW FEATURE: DAILY RHYTHM & HABITS TRACKER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Flame className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white leading-tight">
                Daily Rhythm
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {habitsCompletedCount}/{habits.length} Done ({habitCompletionRate}%)
            </span>
            <button
              type="button"
              onClick={() => setIsAddingHabit(!isAddingHabit)}
              className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Habit
            </button>
          </div>
        </div>

        {/* Add Habit Inline Form */}
        {isAddingHabit && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newHabitName.trim() && onAddHabit) {
                onAddHabit(newHabitName.trim());
                setNewHabitName('');
                setIsAddingHabit(false);
              }
            }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 shadow-xs"
          >
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Read 15 mins, Drink 2L water, Stretch..."
              className="flex-1 px-3 py-1.5 text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newHabitName.trim()}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingHabit(false);
                setNewHabitName('');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${habitCompletionRate}%` }}
          />
        </div>

        {/* Habit chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {habits.map((habit) => {
            const isCompleted = habit.completedDates.includes(todayStr);
            return (
              <button
                key={habit.id}
                type="button"
                onClick={() => onToggleHabit(habit.id)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isCompleted
                        ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-80'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {habit.name}
                  </span>
                </div>

                <span className="text-[10px] font-semibold text-slate-400">
                  {habit.completedDates.length} days
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Upcoming Birthday Card (if enabled) */}
      {showBirthdayCountdown && (
        nextBirthday ? (
          <div
            onClick={() => onOpenBirthday(nextBirthday!.birthday)}
            className="rounded-[24px] bg-gradient-to-r from-rose-50 via-peach-50 to-amber-50 dark:from-rose-950/40 dark:via-slate-800 dark:to-amber-950/30 border border-rose-200/80 dark:border-rose-900/60 p-4.5 cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                  <Cake className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Upcoming Birthday
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {nextBirthday.birthday.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {nextBirthday.details.isToday
                      ? '🎉 Birthday is today!'
                      : `In ${nextBirthday.details.daysRemaining} day${nextBirthday.details.daysRemaining === 1 ? '' : 's'}`}
                    {nextBirthday.details.turningAge
                      ? ` • Turning ${nextBirthday.details.turningAge}`
                      : ''}
                    {showSolarHijriDates && (
                      <span className="text-slate-400 ml-1">
                        ({formatToSolarHijri(nextBirthday.details.nextBirthdayDate)})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span>View</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ) : (
          /* Friendly prompt if toggle is enabled but no birthdays added yet */
          <div
            onClick={onOpenCreateBirthday}
            className="rounded-[24px] bg-rose-50/50 dark:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900/40 p-4 flex items-center justify-between cursor-pointer hover:bg-rose-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center">
                <Cake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Track Birthdays &amp; Countdowns
                </h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">
                  Add friends' birthdays to display countdown cards here.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600 hover:underline">
              + Add
            </span>
          </div>
        )
      )}

      {/* Quick-Capture Action Row */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Have an idea or new todo on your mind?
        </span>
        <button
          type="button"
          onClick={onOpenQuickCapture}
          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Quick Capture
        </button>
      </div>

      {/* TODAY'S TASKS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white">
            Today's Plan
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('planner')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            All Tasks <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No tasks due today
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Plan ahead or take a well-deserved moment to breathe.
            </p>
            <button
              type="button"
              onClick={onOpenQuickCapture}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add a task for today
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((t) => (
              <div
                key={t.id}
                className="group flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
              >
                <button
                  type="button"
                  onClick={() => onToggleTaskComplete(t.id, true)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                  aria-label="Complete task"
                >
                  <Circle className="w-5 h-5" />
                </button>

                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => onOpenTask(t)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {t.title}
                    </span>
                    {t.priority === 'High' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        High
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t.dueTime && (
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Clock className="w-3 h-3" /> {t.dueTime}
                      </span>
                    )}
                    {showSolarHijriDates && (
                      <span className="text-slate-400">
                        • {formatToSolarHijri(t.dueDate)}
                      </span>
                    )}
                    {t.checklist.length > 0 && (
                      <span>
                        • Checklist ({t.checklist.filter((c) => c.completed).length}/{t.checklist.length})
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenTask(t)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UPCOMING TASKS SECTION */}
      <div className="space-y-3">
        <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white">
          Upcoming Days
        </h2>

        {upcomingTasks.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-500">
            No upcoming tasks scheduled for the next 7 days.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onOpenTask(t)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>{t.dueDate}</span>
                      {showSolarHijriDates && (
                        <span>({formatToSolarHijri(t.dueDate)})</span>
                      )}
                      {t.dueTime && <span>at {t.dueTime}</span>}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
