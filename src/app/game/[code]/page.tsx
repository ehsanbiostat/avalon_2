'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

/**
 * Game started placeholder page
 * This is where the actual game logic would be implemented in future phases
 */
export default function GamePage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
      <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
        {/* Success Icon */}
        <div className="text-6xl">🎮</div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-avalon-gold">
            Game Started!
          </h1>
          <p className="text-avalon-silver">
            Room Code: <span className="font-mono font-bold">{code}</span>
          </p>
        </div>

        {/* Placeholder Message */}
        <div className="card">
          <div className="space-y-4">
            <h2 className="font-display text-xl text-avalon-gold">
              🚧 Coming Soon
            </h2>
            <p className="text-avalon-parchment/70 text-sm">
              The quest phase is not yet implemented. In future phases, this is
              where you&apos;ll:
            </p>
            <ul className="text-left text-sm text-avalon-silver/80 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-avalon-gold">•</span>
                <span>Build teams for each quest</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-avalon-gold">•</span>
                <span>Vote to approve or reject team proposals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-avalon-gold">•</span>
                <span>Go on quests and make crucial decisions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-avalon-gold">•</span>
                <span>Deduce who the traitors are</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Return Button */}
        <Button
          variant="secondary"
          onClick={() => router.push('/')}
          fullWidth
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
}
