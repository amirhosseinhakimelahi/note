import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Flag,
  Sparkles,
  Coffee,
  Brain,
  Sliders,
  Timer,
  Clock,
  Bell,
  Volume2,
  CloudRain,
  Waves,
  Radio,
  Headphones,
  VolumeX
} from 'lucide-react';
import { PomodoroSettings, FocusModeType, StopwatchLap, Alarm } from '../types';
import {
  getPomodoroState,
  savePomodoroState,
  getStopwatchState,
  saveStopwatchState,
  computeStopwatchElapsedMs,
  getActiveFocusMode,
  setActiveFocusMode,
  subscribeToTimer,
  PomodoroSessionMode,
  TimerStatus
} from '../services/timerManager';
import {
  playNotificationSound,
  triggerVibration,
  startAmbientSound,
  stopAmbientSound,
  getCurrentAmbientType
} from '../services/audio';
import { showLocalNotification } from '../services/notifications';
import { isNativeApp, syncNativeSchedule } from '../services/native';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface FocusScreenProps {
  settings: PomodoroSettings;
  onOpenSettings: () => void;
  onOpenAlarms: () => void;
  activeFocusMode: FocusModeType;
  onChangeFocusMode: (mode: FocusModeType) => void;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({
  settings,
  onOpenSettings,
  onOpenAlarms,
  activeFocusMode,
  onChangeFocusMode,
}) => {
  // ----------------- POMODORO STATE -----------------
  const [pomoState, setPomoState] = useState(() => getPomodoroState(settings));
  const [showPomoResetConfirm, setShowPomoResetConfirm] = useState(false);
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);

  // ----------------- STOPWATCH STATE -----------------
  const [stopwatchState, setStopwatchState] = useState(getStopwatchState);
  const [stopwatchElapsedMs, setStopwatchElapsedMs] = useState(() => computeStopwatchElapsedMs(getStopwatchState()));

  // ----------------- FOCUS AMBIENT SOUNDSCAPES -----------------
  const [ambientType, setAmbientType] = useState<'brown_noise' | 'rain' | 'stream' | 'binaural_alpha' | null>(getCurrentAmbientType);

  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const handleToggleAmbient = (type: 'brown_noise' | 'rain' | 'stream' | 'binaural_alpha') => {
    if (ambientType === type) {
      stopAmbientSound();
      setAmbientType(null);
    } else {
      startAmbientSound(type);
      setAmbientType(type);
    }
  };

  // Total duration helper
  const getTotalDurationForMode = (m: PomodoroSessionMode): number => {
    switch (m) {
      case 'focus':
        return settings.focusDurationMinutes * 60;
      case 'short_break':
        return settings.shortBreakMinutes * 60;
      case 'long_break':
        return settings.longBreakMinutes * 60;
    }
  };

  // Sync with background updates
  useEffect(() => {
    const unsub = subscribeToTimer(() => {
      setPomoState(getPomodoroState(settings));
      setStopwatchState(getStopwatchState());
    });
    return unsub;
  }, [settings]);

  // Pomodoro timer tick loop
  useEffect(() => {
    if (pomoState.status !== 'running' || !pomoState.targetEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.round((pomoState.targetEndTime! - now) / 1000));

      if (left <= 0) {
        clearInterval(interval);
        handlePomodoroComplete();
      } else {
        setPomoState((prev) => ({ ...prev, remainingSeconds: left }));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [pomoState.status, pomoState.targetEndTime, pomoState.mode, pomoState.completedSessions]);

  // Let Android post the "session finished" notification even if the app is in the background
  useEffect(() => {
    if (!isNativeApp) return;
    if (pomoState.status === 'running' && pomoState.targetEndTime) {
      const isFocus = pomoState.mode === 'focus';
      syncNativeSchedule('focus', [
        {
          id: 'pomodoro_end',
          at: pomoState.targetEndTime,
          title: isFocus ? '☀️ Daylight Focus Complete' : '☀️ Daylight Break Finished',
          body: isFocus ? 'Great job! Time for a break.' : 'Ready to focus again?',
          kind: 'focus',
        },
      ]);
    } else {
      syncNativeSchedule('focus', []);
    }
  }, [pomoState.status, pomoState.targetEndTime, pomoState.mode]);

  // Pomodoro timer completion
  const handlePomodoroComplete = () => {
    if (settings.soundEnabled) {
      playNotificationSound('warm_chord');
    }
    if (settings.vibrationEnabled) {
      triggerVibration([200, 100, 200]);
    }

    if (pomoState.mode === 'focus') {
      const nextCompleted = pomoState.completedSessions + 1;
      const isLong = nextCompleted % settings.sessionsBeforeLongBreak === 0;
      const nextMode: PomodoroSessionMode = isLong ? 'long_break' : 'short_break';
      const duration = getTotalDurationForMode(nextMode);

      setCompletionBanner(`🎉 Focus session complete! Time for a ${Math.round(duration / 60)}-min ${isLong ? 'long' : 'short'} break.`);
      if (!isNativeApp) showLocalNotification('☀️ Daylight Focus Complete', {
        body: `Great job! Time for a ${isLong ? 'long' : 'short'} break.`,
      });

      const nextState = {
        mode: nextMode,
        status: (settings.autoStartBreaks ? 'running' : 'idle') as TimerStatus,
        targetEndTime: settings.autoStartBreaks ? Date.now() + duration * 1000 : null,
        remainingSeconds: duration,
        completedSessions: nextCompleted,
      };
      setPomoState(nextState);
      savePomodoroState(nextState);
    } else {
      setCompletionBanner('Break finished! Ready to begin your next focus block.');
      if (!isNativeApp) showLocalNotification('☀️ Daylight Break Finished', {
        body: 'Ready to focus again?',
      });

      const focusDur = getTotalDurationForMode('focus');
      const nextState = {
        mode: 'focus' as PomodoroSessionMode,
        status: 'idle' as TimerStatus,
        targetEndTime: null,
        remainingSeconds: focusDur,
        completedSessions: pomoState.completedSessions,
      };
      setPomoState(nextState);
      savePomodoroState(nextState);
    }
  };

  // Pomodoro controls
  const handlePomoStartResume = () => {
    const end = Date.now() + pomoState.remainingSeconds * 1000;
    const next = {
      ...pomoState,
      status: 'running' as TimerStatus,
      targetEndTime: end,
    };
    setPomoState(next);
    savePomodoroState(next);
    setCompletionBanner(null);
  };

  const handlePomoPause = () => {
    let left = pomoState.remainingSeconds;
    if (pomoState.targetEndTime) {
      left = Math.max(0, Math.round((pomoState.targetEndTime - Date.now()) / 1000));
    }
    const next = {
      ...pomoState,
      status: 'paused' as TimerStatus,
      targetEndTime: null,
      remainingSeconds: left,
    };
    setPomoState(next);
    savePomodoroState(next);
  };

  const handlePomoRequestReset = () => {
    const total = getTotalDurationForMode(pomoState.mode);
    if (pomoState.status === 'running' || pomoState.remainingSeconds < total) {
      setShowPomoResetConfirm(true);
    } else {
      doPomoReset();
    }
  };

  const doPomoReset = () => {
    const dur = getTotalDurationForMode(pomoState.mode);
    const next = {
      ...pomoState,
      status: 'idle' as TimerStatus,
      targetEndTime: null,
      remainingSeconds: dur,
    };
    setPomoState(next);
    savePomodoroState(next);
    setShowPomoResetConfirm(false);
  };

  const handlePomoSkip = () => {
    const nextMode: PomodoroSessionMode = pomoState.mode === 'focus' ? 'short_break' : 'focus';
    const dur = getTotalDurationForMode(nextMode);
    const next = {
      ...pomoState,
      mode: nextMode,
      status: 'idle' as TimerStatus,
      targetEndTime: null,
      remainingSeconds: dur,
    };
    setPomoState(next);
    savePomodoroState(next);
  };

  const handleSelectPomoMode = (m: PomodoroSessionMode) => {
    const dur = getTotalDurationForMode(m);
    const next = {
      ...pomoState,
      mode: m,
      status: 'idle' as TimerStatus,
      targetEndTime: null,
      remainingSeconds: dur,
    };
    setPomoState(next);
    savePomodoroState(next);
  };

  // ----------------- STOPWATCH TICK LOOP -----------------
  useEffect(() => {
    if (stopwatchState.status !== 'running') {
      setStopwatchElapsedMs(stopwatchState.elapsedOffsetMs);
      return;
    }

    const interval = setInterval(() => {
      setStopwatchElapsedMs(computeStopwatchElapsedMs(stopwatchState));
    }, 40);

    return () => clearInterval(interval);
  }, [stopwatchState]);

  const handleStopwatchStart = () => {
    const next = {
      ...stopwatchState,
      status: 'running' as TimerStatus,
      startTime: Date.now(),
    };
    setStopwatchState(next);
    saveStopwatchState(next);
  };

  const handleStopwatchPause = () => {
    const currentTotal = computeStopwatchElapsedMs(stopwatchState);
    const next = {
      ...stopwatchState,
      status: 'paused' as TimerStatus,
      startTime: null,
      elapsedOffsetMs: currentTotal,
    };
    setStopwatchState(next);
    saveStopwatchState(next);
  };

  const handleStopwatchReset = () => {
    const next = {
      status: 'idle' as TimerStatus,
      startTime: null,
      elapsedOffsetMs: 0,
      laps: [],
    };
    setStopwatchState(next);
    saveStopwatchState(next);
    setStopwatchElapsedMs(0);
  };

  const handleStopwatchLap = () => {
    const currentTotal = computeStopwatchElapsedMs(stopwatchState);
    const prevTotal = stopwatchState.laps.length > 0 ? stopwatchState.laps[0].overallDurationMs : 0;
    const lapDuration = currentTotal - prevTotal;

    const newLap: StopwatchLap = {
      id: 'lap_' + Date.now(),
      lapNumber: stopwatchState.laps.length + 1,
      lapDurationMs: lapDuration,
      overallDurationMs: currentTotal,
    };

    const next = {
      ...stopwatchState,
      laps: [newLap, ...stopwatchState.laps],
    };
    setStopwatchState(next);
    saveStopwatchState(next);
  };

  // Stopwatch formatted time
  const formatStopwatchTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  // Pomodoro time formatting
  const pMinutes = Math.floor(pomoState.remainingSeconds / 60);
  const pSeconds = pomoState.remainingSeconds % 60;
  const pomoFormatted = `${String(pMinutes).padStart(2, '0')}:${String(pSeconds).padStart(2, '0')}`;

  const currentModeTotal = getTotalDurationForMode(pomoState.mode);
  const progressFraction = Math.min(1, Math.max(0, 1 - pomoState.remainingSeconds / currentModeTotal));
  const circleCircumference = 2 * Math.PI * 115;
  const strokeDashoffset = circleCircumference * (1 - progressFraction);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-2xl mx-auto w-full pb-24 flex flex-col items-center">
      {/* Top Header & Alarm / Mode Switcher */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">
            Focus &amp; Timers
          </h1>
          <p className="text-xs text-slate-500">
            {activeFocusMode === 'pomodoro' ? 'Pomodoro interval timer' : 'Precision lap stopwatch'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Alarms Clock Button */}
          <button
            type="button"
            onClick={onOpenAlarms}
            className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Alarm Clock with Math Challenge"
          >
            <Bell className="w-3.5 h-3.5 text-indigo-500" /> Alarms
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[38px] px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors"
            title="Adjust Pomodoro Durations"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Switcher: Pomodoro vs Stopwatch */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-xs w-full">
        <button
          type="button"
          onClick={() => {
            onChangeFocusMode('pomodoro');
            setActiveFocusMode('pomodoro');
          }}
          className={`flex-1 min-h-[36px] py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeFocusMode === 'pomodoro'
              ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Timer className="w-3.5 h-3.5" /> Pomodoro
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeFocusMode('stopwatch');
            setActiveFocusMode('stopwatch');
          }}
          className={`flex-1 min-h-[36px] py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeFocusMode === 'stopwatch'
              ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Stopwatch
        </button>
      </div>

      {activeFocusMode === 'pomodoro' ? (
        /* =================== POMODORO MODE =================== */
        <>
          {completionBanner && (
            <div className="w-full p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{completionBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setCompletionBanner(null)}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Sub-mode Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl max-w-sm w-full">
            <button
              type="button"
              onClick={() => handleSelectPomoMode('focus')}
              className={`flex-1 min-h-[38px] py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                pomoState.mode === 'focus'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Brain className="w-3.5 h-3.5" /> Focus ({settings.focusDurationMinutes}m)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPomoMode('short_break')}
              className={`flex-1 min-h-[38px] py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                pomoState.mode === 'short_break'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" /> Short ({settings.shortBreakMinutes}m)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPomoMode('long_break')}
              className={`flex-1 min-h-[38px] py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                pomoState.mode === 'long_break'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Long ({settings.longBreakMinutes}m)
            </button>
          </div>

          {/* Circular Progress & Clock Centerpiece */}
          <div className="relative my-2 flex items-center justify-center">
            <svg className="w-68 h-68 sm:w-76 sm:h-76 -rotate-90 transform" viewBox="0 0 260 260">
              <circle
                cx="130"
                cy="130"
                r="115"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-100 dark:text-slate-800"
                fill="transparent"
              />
              <circle
                cx="130"
                cy="130"
                r="115"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-300 ${
                  pomoState.mode === 'focus'
                    ? 'text-indigo-600 dark:text-indigo-500'
                    : pomoState.mode === 'short_break'
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-purple-600 dark:text-purple-400'
                }`}
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-1">
                {pomoState.mode === 'focus'
                  ? 'Focus Session'
                  : pomoState.mode === 'short_break'
                  ? 'Short Rest'
                  : 'Deep Recovery'}
              </span>

              <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                {pomoFormatted}
              </span>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
                {pomoState.status === 'running'
                  ? 'Session in progress...'
                  : pomoState.status === 'paused'
                  ? 'Timer paused'
                  : 'Ready to start'}
              </span>
            </div>
          </div>

          {/* Session indicators */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">
              Completed Focus Sessions: {pomoState.completedSessions}
            </span>
            <div className="flex items-center gap-2">
              {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => {
                const isFilled = i < (pomoState.completedSessions % settings.sessionsBeforeLongBreak);
                return (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      isFilled ? 'bg-indigo-600 shadow-sm scale-110' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Pomodoro Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={handlePomoRequestReset}
              className="w-13 h-13 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Reset session"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {pomoState.status === 'running' ? (
              <button
                type="button"
                onClick={handlePomoPause}
                className="min-w-[140px] min-h-[56px] px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Pause className="w-5 h-5 fill-white" /> Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePomoStartResume}
                className="min-w-[140px] min-h-[56px] px-8 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" /> {pomoState.status === 'paused' ? 'Resume' : 'Start'}
              </button>
            )}

            <button
              type="button"
              onClick={handlePomoSkip}
              className="w-13 h-13 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Skip to next session"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </>
      ) : (
        /* =================== STOPWATCH MODE =================== */
        <div className="w-full flex flex-col items-center space-y-6">
          {/* Big Digital Stopwatch Display */}
          <div className="py-8 flex flex-col items-center">
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-2">
              Elapsed Time
            </span>
            <span className="text-6xl sm:text-7xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatStopwatchTime(stopwatchElapsedMs)}
            </span>
          </div>

          {/* Stopwatch Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleStopwatchReset}
              disabled={stopwatchElapsedMs === 0}
              className="w-13 h-13 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Reset Stopwatch"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {stopwatchState.status === 'running' ? (
              <button
                type="button"
                onClick={handleStopwatchPause}
                className="min-w-[140px] min-h-[56px] px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Pause className="w-5 h-5 fill-white" /> Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopwatchStart}
                className="min-w-[140px] min-h-[56px] px-8 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" /> {stopwatchState.status === 'paused' ? 'Resume' : 'Start'}
              </button>
            )}

            <button
              type="button"
              onClick={handleStopwatchLap}
              disabled={stopwatchState.status !== 'running'}
              className="w-13 h-13 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Record Lap"
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          {/* Laps List */}
          {stopwatchState.laps.length > 0 && (
            <div className="w-full max-w-md rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1">
                <span>Lap</span>
                <span>Lap Split</span>
                <span>Overall</span>
              </div>
              {stopwatchState.laps.map((lap) => (
                <div
                  key={lap.id}
                  className="flex items-center justify-between text-xs py-1 text-slate-800 dark:text-slate-200 font-medium tabular-nums"
                >
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    Lap {lap.lapNumber}
                  </span>
                  <span>+{formatStopwatchTime(lap.lapDurationMs)}</span>
                  <span className="text-slate-500">{formatStopwatchTime(lap.overallDurationMs)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================== FOCUS AMBIENT SOUNDSCAPES =================== */}
      <div className="w-full max-w-md rounded-[28px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 mt-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Focus Soundscapes
            </h3>
          </div>
          {ambientType && (
            <button
              type="button"
              onClick={() => {
                stopAmbientSound();
                setAmbientType(null);
              }}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" /> Stop Sound
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          Gentle synthetic background audio generated in real-time to drown out distractions and induce flow.
        </p>

        {/* 4 Soundscape Choices */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'rain', label: 'Gentle Rain', desc: 'Soft window drops', icon: CloudRain },
            { id: 'brown_noise', label: 'Brown Noise', desc: 'Warm deep focus', icon: Waves },
            { id: 'stream', label: 'Forest Stream', desc: 'Babbling water', icon: Radio },
            { id: 'binaural_alpha', label: '10Hz Alpha', desc: 'Flow state waves', icon: Brain },
          ].map((sound) => {
            const Icon = sound.icon;
            const isPlaying = ambientType === sound.id;
            return (
              <button
                key={sound.id}
                type="button"
                onClick={() => handleToggleAmbient(sound.id as any)}
                className={`p-2.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isPlaying ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate leading-tight">
                    {sound.label}
                  </span>
                  <span
                    className={`text-[10px] block truncate mt-0.5 ${
                      isPlaying ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {sound.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog for Pomodoro Reset */}
      <ConfirmDialog
        isOpen={showPomoResetConfirm}
        title="Reset Current Session?"
        message="Are you sure you want to reset this session? Your current elapsed progress will be cleared."
        confirmLabel="Reset"
        cancelLabel="Continue"
        isDestructive={false}
        onConfirm={doPomoReset}
        onCancel={() => setShowPomoResetConfirm(false)}
      />
    </div>
  );
};
