import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface AndroidDeviceFrameProps {
  children: React.ReactNode;
  enabled: boolean;
}

export const AndroidDeviceFrame: React.FC<AndroidDeviceFrameProps> = ({
  children,
  enabled,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!enabled) {
    return <div className="w-full h-screen flex flex-col">{children}</div>;
  }

  return (
    <div className="w-full min-h-screen bg-slate-200 dark:bg-slate-950 flex items-center justify-center p-0 sm:p-4 md:p-6 transition-colors">
      {/* Android Device Mockup Chassis */}
      <div className="relative w-full sm:max-w-[430px] h-screen sm:h-[900px] sm:max-h-[95vh] bg-surface dark:bg-slate-950 sm:rounded-[48px] sm:border-[8px] sm:border-slate-800 dark:sm:border-slate-800 shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/10">
        {/* Android Status Bar */}
        <div className="shrink-0 h-8 sm:h-9 bg-surface dark:bg-slate-900 px-6 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 select-none z-40 border-b border-slate-200/40 dark:border-slate-800/40">
          {/* Time */}
          <span className="text-[12px] font-bold tracking-tight">
            {currentTimeStr || '09:41'}
          </span>

          {/* Front Camera Punch-hole on Android devices */}
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 dark:bg-black border border-slate-700 mx-auto shadow-inner" />

          {/* Status Icons: Signal, WiFi, Battery */}
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">98%</span>
              <BatteryMedium className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Device Screen Interior */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* Android Gesture Navigation Bar handle */}
        <div className="shrink-0 h-4 bg-surface dark:bg-slate-900 flex items-center justify-center">
          <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};
