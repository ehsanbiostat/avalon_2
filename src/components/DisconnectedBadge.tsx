'use client';

/**
 * DisconnectedBadge Component
 * Phase 6: Player Recovery & Reconnection
 *
 * Visual indicator showing a player is disconnected.
 */

interface DisconnectedBadgeProps {
  /** Whether to show as small inline badge or larger standalone */
  size?: 'sm' | 'md';
  /** Custom className for positioning */
  className?: string;
}

export function DisconnectedBadge({ size = 'sm', className = '' }: DisconnectedBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'text-xs px-1.5 py-0.5'
    : 'text-sm px-2 py-1';

  return (
    <span
      className={`
        inline-flex items-center gap-1
        bg-red-500/20 text-red-400
        border border-red-500/30 rounded
        font-medium
        ${sizeClasses}
        ${className}
      `}
      title="Player disconnected"
    >
      <svg
        className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
      {size === 'md' && <span>Disconnected</span>}
    </span>
  );
}
