'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

/**
 * Skeleton loading placeholder
 */
export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-avalon-silver/10';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton for player card
 */
export function PlayerCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-avalon-midnight/50">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" height={16} width="60%" />
        <Skeleton variant="text" height={12} width="30%" />
      </div>
    </div>
  );
}

/**
 * Skeleton for room card
 */
export function RoomCardSkeleton() {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" height={24} width={100} />
        <Skeleton variant="text" height={20} width={60} />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" height={14} width="70%" />
        <Skeleton variant="text" height={14} width="40%" />
      </div>
      <Skeleton variant="rectangular" height={40} className="w-full" />
    </div>
  );
}

/**
 * Skeleton for lobby player list
 */
export function LobbyPlayerListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for room list
 */
export function RoomListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </div>
  );
}
