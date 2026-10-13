import React from 'react';
import { Sun, Moon, Settings, Smartphone, Monitor } from 'lucide-react';
import { AppSettings } from '../types';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  settings: AppSettings;
  isDeviceFrame: boolean;
  onToggleDeviceFrame?: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenDownloadApk?: () => void;
  actionButton?: React.ReactNode;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  settings,
  isDeviceFrame,
  onToggleDeviceFrame,
  onToggleTheme,
  onOpenSettings,
  onOpenDownloadApk,
  actionButton,
}) => {
  return (
    <header className="shrink-0 bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between z-30">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 flex items-center justify-center text-white shadow-sm font-black text-sm">
          ☀️
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {actionButton}

        {/* APK / Android Install button */}
        {onOpenDownloadApk && (
          <button
            type="button"
            onClick={onOpenDownloadApk}
            className="h-8 px-2.5 rounded-full flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 transition-colors shadow-xs"
            title="Download APK / Install Native App"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">APK</span>
          </button>
        )}

        {/* Toggle device frame mode (web preview only) */}
        {onToggleDeviceFrame && (
        <button
          type="button"
          onClick={onToggleDeviceFrame}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDeviceFrame ? 'Switch to Fullscreen View' : 'Switch to Android Device Frame'}
        >
          {isDeviceFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>
        )}

        {/* Quick theme switch */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Daylight Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
