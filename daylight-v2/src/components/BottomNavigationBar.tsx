import React from 'react';
import { Home, StickyNote, CheckSquare, Calendar, Timer, Clock } from 'lucide-react';
import { TabDestination, FocusModeType } from '../types';

interface BottomNavigationBarProps {
  currentTab: TabDestination;
  onSelectTab: (tab: TabDestination) => void;
  pendingTasksCount?: number;
  activeFocusMode?: FocusModeType;
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  currentTab,
  onSelectTab,
  pendingTasksCount = 0,
  activeFocusMode = 'pomodoro',
}) => {
  const tabs: { id: TabDestination; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'planner', label: 'Planner', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'focus', label: activeFocusMode === 'stopwatch' ? 'Stopwatch' : 'Focus', icon: activeFocusMode === 'stopwatch' ? Clock : Timer },
  ];

  return (
    <nav
      className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 sm:px-4 py-2 z-40"
      aria-label="Main Navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center min-h-[52px] py-1 px-1 rounded-2xl group transition-all duration-200 cursor-pointer select-none"
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 shadow-sm scale-105'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 group-hover:bg-slate-100/60 dark:group-hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.id === 'planner' && pendingTasksCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingTasksCount > 99 ? '99+' : pendingTasksCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-medium mt-1 transition-colors tracking-tight ${
                  isActive
                    ? 'text-indigo-900 dark:text-indigo-200 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
