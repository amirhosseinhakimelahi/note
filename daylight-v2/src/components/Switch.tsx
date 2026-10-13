import React from 'react';
import { Check } from 'lucide-react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  size?: 'sm' | 'md';
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  // Precision dimensions preventing layout shifts:
  // sm: 38px width x 22px height, 14px thumb, travel 16px
  // md: 48px width x 28px height, 20px thumb, travel 20px
  const trackDimensions = isSm ? 'w-[38px] h-[22px]' : 'w-[48px] h-[28px]';
  const thumbDimensions = isSm ? 'w-[14px] h-[14px]' : 'w-[20px] h-[20px]';
  const travelX = isSm ? 16 : 20;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${trackDimensions} ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
      } border-2 ${
        checked
          ? 'bg-brand-primary border-brand-primary shadow-xs'
          : 'bg-slate-200 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600'
      }`}
    >
      <span
        style={{
          transform: checked ? `translateX(${travelX}px)` : 'translateX(0px)',
        }}
        className={`pointer-events-none inline-flex items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${thumbDimensions}`}
      >
        {checked && (
          <Check
            className={`${isSm ? 'w-2 h-2' : 'w-3 h-3'} text-brand-primary stroke-[3.5]`}
          />
        )}
      </span>
    </button>
  );
};
