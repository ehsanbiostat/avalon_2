'use client';

import { type ReactNode, type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'outlined' | 'elevated';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Interactive (hover effects) */
  interactive?: boolean;
  /** Card content */
  children: ReactNode;
}

/**
 * Card component with Avalon theme styling
 */
export function Card({
  variant = 'default',
  padding = 'md',
  interactive = false,
  children,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-300';

  const variantStyles = {
    default: 'bg-avalon-navy/80 backdrop-blur-sm border border-avalon-silver/20',
    outlined: 'bg-transparent border-2 border-avalon-silver/30',
    elevated: 'bg-avalon-navy/90 shadow-xl shadow-black/30 border border-avalon-silver/10',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-avalon-gold/50 hover:shadow-lg hover:shadow-avalon-gold/10 hover:scale-[1.02]'
    : '';

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${interactiveStyles}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header component
 */
export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card Title component
 */
export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-lg font-display font-semibold text-avalon-gold ${className}`}>
      {children}
    </h3>
  );
}

/**
 * Card Description component
 */
export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`mt-1 text-sm text-avalon-silver/70 ${className}`}>
      {children}
    </p>
  );
}

/**
 * Card Content component
 */
export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/**
 * Card Footer component
 */
export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-6 pt-4 border-t border-avalon-silver/20 ${className}`}>
      {children}
    </div>
  );
}
