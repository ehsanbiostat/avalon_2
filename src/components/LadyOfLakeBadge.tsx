'use client';

interface LadyOfLakeBadgeProps {
  holderName: string;
  isCurrentPlayer?: boolean;
  showFull?: boolean;
  className?: string;
}

/**
 * T042: Lady of the Lake token holder indicator
 * Displays who currently holds the Lady of the Lake token
 */
export function LadyOfLakeBadge({
  holderName,
  isCurrentPlayer = false,
  showFull = true,
  className = '',
}: LadyOfLakeBadgeProps) {
  if (showFull) {
    return (
      <div className={`p-4 bg-avalon-midnight/50 rounded-lg border border-purple-500/30 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <div className="flex-1">
            <h4 className="font-display text-purple-300 text-sm">Lady of the Lake</h4>
            <p className="text-avalon-parchment">
              {isCurrentPlayer ? (
                <span className="text-purple-400 font-medium">You hold the Lady of the Lake</span>
              ) : (
                <>
                  <span className="font-medium">{holderName}</span>
                  <span className="text-avalon-silver/70"> holds the token</span>
                </>
              )}
            </p>
          </div>
        </div>
        <p className="text-xs text-avalon-silver/50 mt-2 italic">
          The Lady of the Lake can investigate loyalties in future rounds
        </p>
      </div>
    );
  }

  // Compact badge version
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
        bg-purple-500/20 text-purple-300 border border-purple-500/30
        ${className}
      `}
      title={`${holderName} holds the Lady of the Lake`}
    >
      👑 {isCurrentPlayer ? 'You' : holderName}
    </span>
  );
}

