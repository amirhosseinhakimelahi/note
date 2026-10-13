import { PomodoroSettings, StopwatchLap, FocusModeType } from '../types';
import { playNotificationSound, triggerVibration } from './audio';
import { showLocalNotification } from './notifications';

export type PomodoroSessionMode = 'focus' | 'short_break' | 'long_break';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface PomodoroState {
  mode: PomodoroSessionMode;
  status: TimerStatus;
  targetEndTime: number | null; // epoch ms
  remainingSeconds: number;
  completedSessions: number;
}

export interface StopwatchState {
  status: TimerStatus;
  startTime: number | null; // epoch ms
  elapsedOffsetMs: number;
  laps: StopwatchLap[];
}

const STORAGE_KEYS = {
  POMODORO: 'daylight_focus_state_v1',
  STOPWATCH: 'daylight_stopwatch_state_v1',
  ACTIVE_MODE: 'daylight_active_focus_mode_v1',
};

// Listeners for reactivity across components
type StateListener = () => void;
const listeners = new Set<StateListener>();

export function subscribeToTimer(listener: StateListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach((l) => l());
}

// ----------------- Active Focus Mode -----------------
export function getActiveFocusMode(): FocusModeType {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODE);
    return val === 'stopwatch' ? 'stopwatch' : 'pomodoro';
  } catch {
    return 'pomodoro';
  }
}

export function setActiveFocusMode(mode: FocusModeType): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MODE, mode);
    notifyListeners();
  } catch (e) {
    console.warn(e);
  }
}

// ----------------- Pomodoro State -----------------
export function getPomodoroState(settings: PomodoroSettings): PomodoroState {
  const defaultRemaining = settings.focusDurationMinutes * 60;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POMODORO);
    if (!raw) {
      return {
        mode: 'focus',
        status: 'idle',
        targetEndTime: null,
        remainingSeconds: defaultRemaining,
        completedSessions: 0,
      };
    }

    const parsed: PomodoroState = JSON.parse(raw);
    if (parsed.status === 'running' && parsed.targetEndTime) {
      const now = Date.now();
      const left = Math.max(0, Math.round((parsed.targetEndTime - now) / 1000));
      return {
        ...parsed,
        remainingSeconds: left,
      };
    }
    return parsed;
  } catch {
    return {
      mode: 'focus',
      status: 'idle',
      targetEndTime: null,
      remainingSeconds: defaultRemaining,
      completedSessions: 0,
    };
  }
}

export function savePomodoroState(state: PomodoroState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POMODORO, JSON.stringify(state));
    notifyListeners();
  } catch (e) {
    console.warn(e);
  }
}

// ----------------- Stopwatch State -----------------
export function getStopwatchState(): StopwatchState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOPWATCH);
    if (!raw) {
      return {
        status: 'idle',
        startTime: null,
        elapsedOffsetMs: 0,
        laps: [],
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      status: 'idle',
      startTime: null,
      elapsedOffsetMs: 0,
      laps: [],
    };
  }
}

export function saveStopwatchState(state: StopwatchState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STOPWATCH, JSON.stringify(state));
    notifyListeners();
  } catch (e) {
    console.warn(e);
  }
}

export function computeStopwatchElapsedMs(state: StopwatchState): number {
  if (state.status === 'running' && state.startTime) {
    return Date.now() - state.startTime + state.elapsedOffsetMs;
  }
  return state.elapsedOffsetMs;
}
