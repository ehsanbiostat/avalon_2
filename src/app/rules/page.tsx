'use client';

import { useRouter } from 'next/navigation';
import { RulebookContent } from '@/components/rulebook/RulebookContent';

/**
 * Dedicated Rules Page
 * Feature 014: Rulebook Page
 * Accessible from home page footer link
 */
export default function RulesPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col bg-avalon-midnight min-h-screen">
      {/* Header with back button */}
      <header className="sticky top-0 z-10 bg-avalon-midnight/95 backdrop-blur-sm border-b border-avalon-silver/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-avalon-text-muted hover:text-avalon-gold transition-colors"
          >
            <span>←</span>
            <span className="text-sm">Back to Home</span>
          </button>
          <h1 className="text-lg font-display font-bold text-avalon-gold">
            AVALON
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <RulebookContent />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-avalon-silver/10 py-4">
        <p className="text-center text-sm text-avalon-text-muted">
          For 5-10 players • Real-time multiplayer
        </p>
      </footer>
    </div>
  );
}

