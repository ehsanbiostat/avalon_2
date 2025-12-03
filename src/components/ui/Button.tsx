'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
}

/**
 * Button component with Avalon theme styling
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-display font-semibold uppercase tracking-wider
      rounded-lg transition-all duration-300
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-avalon-midnight
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `;

    const variantStyles = {
      primary: `
        bg-avalon-gold text-avalon-midnight
        hover:bg-yellow-500 hover:scale-105 hover:shadow-xl
        focus:ring-avalon-gold
        shadow-lg
      `,
      secondary: `
        border-2 border-avalon-silver text-avalon-silver
        hover:bg-avalon-silver hover:text-avalon-midnight
        focus:ring-avalon-silver
      `,
      danger: `
        bg-avalon-crimson text-white
        hover:bg-red-700 hover:scale-105
        focus:ring-avalon-crimson
      `,
      ghost: `
        text-avalon-silver
        hover:bg-avalon-silver/10
        focus:ring-avalon-silver/50
      `,
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${widthStyles}
          ${className}
        `.trim()}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
