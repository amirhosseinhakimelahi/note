import React, { useState, useEffect } from 'react';
import { Bell, Clock, Brain, Check, AlertCircle, Volume2 } from 'lucide-react';
import { Alarm } from '../types';
import { generateMathProblem, MathProblem } from '../services/mathChallenge';
import { startAlarmRinging, stopAlarmRinging, triggerVibration } from '../services/audio';

interface ActiveAlarmOverlayProps {
  alarm: Alarm | null;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const ActiveAlarmOverlay: React.FC<ActiveAlarmOverlayProps> = ({
  alarm,
  onDismiss,
  onSnooze,
}) => {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChallengeSolved, setIsChallengeSolved] = useState(false);

  useEffect(() => {
    if (alarm) {
      startAlarmRinging(alarm.sound);
      triggerVibration([300, 150, 300, 150, 500]);

      if (alarm.mathChallenge?.enabled) {
        setProblem(generateMathProblem(alarm.mathChallenge.difficulty));
        setIsChallengeSolved(false);
      } else {
        setIsChallengeSolved(true);
      }
      setUserAnswer('');
      setErrorMsg('');
    } else {
      stopAlarmRinging();
    }

    return () => {
      stopAlarmRinging();
    };
  }, [alarm]);

  if (!alarm) return null;

  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!problem) return;

    const parsed = parseInt(userAnswer.trim(), 10);
    if (isNaN(parsed) || parsed !== problem.answer) {
      setErrorMsg('Incorrect answer! Solve this new problem:');
      setProblem(generateMathProblem(alarm.mathChallenge.difficulty));
      setUserAnswer('');
      triggerVibration([100, 100]);
    } else {
      setErrorMsg('');
      setIsChallengeSolved(true);
      triggerVibration([200, 100, 200]);
    }
  };

  const handleDismissFinal = () => {
    stopAlarmRinging();
    onDismiss();
  };

  const handleSnoozeFinal = () => {
    stopAlarmRinging();
    onSnooze(5);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alarm-dialog-title"
    >
      <div className="relative w-full max-w-sm rounded-[32px] bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-2xl p-6 flex flex-col items-center text-center space-y-4">
        {/* Pulsing Bell Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-bounce">
            <Bell className="w-8 h-8" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
          </span>
        </div>

        <div>
          <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {alarm.time}
          </span>
          <h2 id="alarm-dialog-title" className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
            {alarm.label || 'Daylight Alarm'}
          </h2>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" /> Playing sound: {alarm.sound.replace('_', ' ')}
          </p>
        </div>

        {/* Math Wake-up Challenge Box */}
        {alarm.mathChallenge?.enabled && !isChallengeSolved && problem && (
          <form
            onSubmit={handleCheckAnswer}
            className="w-full p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-3"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Brain className="w-4 h-4 text-amber-600" />
              <span>Wake-up Challenge ({alarm.mathChallenge.difficulty})</span>
            </div>

            <div className="text-xl font-black text-slate-900 dark:text-white py-1">
              What is <span className="underline decoration-indigo-500">{problem.question}</span>?
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter answer..."
                autoFocus
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow cursor-pointer"
              >
                Submit
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
              </p>
            )}
          </form>
        )}

        {/* Solved state */}
        {alarm.mathChallenge?.enabled && isChallengeSolved && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Challenge Solved! You are awake.</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="w-full space-y-2 pt-2">
          <button
            type="button"
            onClick={handleDismissFinal}
            disabled={!isChallengeSolved}
            className={`w-full min-h-[50px] py-3 px-4 rounded-2xl text-base font-bold shadow-md transition-all cursor-pointer ${
              isChallengeSolved
                ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isChallengeSolved ? 'Turn Off Alarm' : 'Solve Math Question to Dismiss'}
          </button>

          {alarm.snoozeEnabled && (
            <button
              type="button"
              onClick={handleSnoozeFinal}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
            >
              Snooze for 5 minutes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
