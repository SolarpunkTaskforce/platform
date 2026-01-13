'use client';

import * as React from 'react';

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Dependency-free Switch with a Radix/shadcn-compatible API.
 * Replace later with Radix Switch if you install it.
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { checked, defaultChecked, onCheckedChange, disabled, className, ...props },
    ref,
  ) => {
    const [internal, setInternal] = React.useState<boolean>(defaultChecked ?? false);
    const isControlled = typeof checked === 'boolean';
    const isOn = isControlled ? (checked as boolean) : internal;

    const toggle = () => {
      if (disabled) return;
      const next = !isOn;
      if (!isControlled) setInternal(next);
      onCheckedChange?.(next);
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-disabled={disabled || undefined}
        data-state={isOn ? 'checked' : 'unchecked'}
        disabled={disabled}
        onClick={toggle}
        ref={ref}
        className={[
          'inline-flex h-6 w-11 items-center rounded-full border transition',
          isOn ? 'bg-black text-white' : 'bg-white text-black',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className ?? '',
        ].join(' ')}
        {...props}
      >
        <span
          aria-hidden="true"
          className={[
            'block h-5 w-5 rounded-full bg-current transition-transform',
            isOn ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    );
  },
);
Switch.displayName = 'Switch';
