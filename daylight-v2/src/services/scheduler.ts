// Builds the list of future alarms / reminders and hands it to Android,
// so they fire even when the app is closed.
import { Alarm, Birthday, Task } from '../types';
import { getBirthdayDetails } from './storage';
import { ScheduledItem, syncNativeSchedule } from './native';

const DAY = 24 * 60 * 60 * 1000;
const ONE_SHOT_KEY = 'daylight_oneshot_due_v1';

function atTime(base: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h || 0, m || 0, 0, 0);
  return d;
}

function parseLocalDate(ymd: string): Date | null {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// ---- one-shot alarm bookkeeping (so a fired one-shot alarm gets switched off) ----
function getOneShotMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(ONE_SHOT_KEY) || '{}');
  } catch {
    return {};
  }
}
function setOneShotMap(map: Record<string, number>): void {
  localStorage.setItem(ONE_SHOT_KEY, JSON.stringify(map));
}

/** One-shot alarms whose scheduled time has already passed (they rang while the app was closed). */
export function getExpiredOneShotAlarmIds(alarms: Alarm[], now = Date.now()): string[] {
  const map = getOneShotMap();
  return alarms
    .filter((a) => a.enabled && a.repeatDays.length === 0 && map[a.id + '@' + a.time] && map[a.id + '@' + a.time] + 60_000 < now)
    .map((a) => a.id);
}

export function buildAlarmSchedule(alarms: Alarm[], now = new Date()): ScheduledItem[] {
  const items: ScheduledItem[] = [];
  const oneShot = getOneShotMap();
  const nextOneShot: Record<string, number> = {};

  for (const a of alarms) {
    if (!a.enabled) continue;
    const title = '⏰ ' + (a.label?.trim() || 'Alarm');
    if (a.repeatDays.length === 0) {
      // keep the original target if we already scheduled it, otherwise next occurrence
      const key = a.id + '@' + a.time;
      let at = oneShot[key];
      if (!at || at + 60_000 < now.getTime()) {
        let t = atTime(now, a.time);
        if (t.getTime() <= now.getTime()) t = new Date(t.getTime() + DAY);
        at = t.getTime();
      }
      nextOneShot[key] = at;
      if (at > now.getTime()) items.push({ id: 'alarm_' + a.id, at, title, body: a.time, kind: 'alarm' });
    } else {
      for (let i = 0; i < 8; i++) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        if (!a.repeatDays.includes(day.getDay())) continue;
        const t = atTime(day, a.time);
        if (t.getTime() <= now.getTime()) continue;
        items.push({ id: `alarm_${a.id}_${i}`, at: t.getTime(), title, body: a.time, kind: 'alarm' });
      }
    }
  }
  setOneShotMap(nextOneShot);
  return items;
}

const REMINDER_OFFSET: Record<Task['reminder'], number> = {
  None: -1,
  AtTime: 0,
  '15MinBefore': 15 * 60 * 1000,
  '1HourBefore': 60 * 60 * 1000,
  '1DayBefore': DAY,
};

export function buildTaskSchedule(tasks: Task[], now = new Date()): ScheduledItem[] {
  const items: ScheduledItem[] = [];
  const horizon = now.getTime() + 60 * DAY;
  for (const t of tasks) {
    if (t.completed || !t.reminder || t.reminder === 'None' || !t.dueDate) continue;
    const day = parseLocalDate(t.dueDate);
    if (!day) continue;
    const due = atTime(day, t.dueTime || '09:00');
    const at = due.getTime() - REMINDER_OFFSET[t.reminder];
    if (at <= now.getTime() || at > horizon) continue;
    const when =
      t.reminder === 'AtTime'
        ? 'Due now'
        : `Due ${due.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}`;
    items.push({ id: 'task_' + t.id, at, title: '✅ ' + t.title, body: when, kind: 'reminder' });
  }
  return items;
}

export function buildBirthdaySchedule(birthdays: Birthday[], now = new Date()): ScheduledItem[] {
  const items: ScheduledItem[] = [];
  for (const b of birthdays) {
    const { nextBirthdayDate, turningAge } = getBirthdayDetails(b, now);
    const onDay = atTime(nextBirthdayDate, '09:00');
    const age = turningAge ? ` (turning ${turningAge})` : '';
    if (onDay.getTime() > now.getTime()) {
      items.push({ id: 'bday_' + b.id, at: onDay.getTime(), title: `🎂 ${b.name}'s birthday is today`, body: `Don't forget to say happy birthday${age}!`, kind: 'reminder' });
    }
    if (b.reminderDaysBefore > 0) {
      const early = onDay.getTime() - b.reminderDaysBefore * DAY;
      if (early > now.getTime()) {
        items.push({ id: 'bday_early_' + b.id, at: early, title: `🎁 ${b.name}'s birthday in ${b.reminderDaysBefore} day${b.reminderDaysBefore === 1 ? '' : 's'}`, body: `Coming up${age}.`, kind: 'reminder' });
      }
    }
  }
  return items;
}

export function syncAllSchedules(opts: {
  alarms: Alarm[];
  tasks: Task[];
  birthdays: Birthday[];
  remindersEnabled: boolean;
}): void {
  const now = new Date();
  syncNativeSchedule('alarms', buildAlarmSchedule(opts.alarms, now));
  syncNativeSchedule(
    'reminders',
    opts.remindersEnabled ? [...buildTaskSchedule(opts.tasks, now), ...buildBirthdaySchedule(opts.birthdays, now)] : []
  );
}
