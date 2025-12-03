'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Left addon (icon or text) */
  leftAddon?: React.ReactNode;
  /** Right addon (icon or text) */
  rightAddon?: React.ReactNode;
  /** Full width input */
  fullWidth?: boolean;
}

/**
 * Input component with Avalon theme styling
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    const baseInputStyles = `
      px-4 py-3 rounded-lg
      bg-avalon-midnight border border-avalon-silver/30
      text-avalon-parchment placeholder-avalon-silver/50
      focus:outline-none focus:border-avalon-gold focus:ring-2 focus:ring-avalon-gold/20
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const errorStyles = error
      ? 'border-evil focus:border-evil focus:ring-evil/20'
      : '';

    const addonStyles = leftAddon ? 'pl-10' : rightAddon ? 'pr-10' : '';
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-medium text-avalon-parchment"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftAddon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-avalon-silver/70">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              ${baseInputStyles}
              ${errorStyles}
              ${addonStyles}
              ${widthStyles}
              ${className}
            `.trim()}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-avalon-silver/70">
              {rightAddon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={`mt-2 text-sm ${
              error ? 'text-evil-light' : 'text-avalon-silver/70'
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
