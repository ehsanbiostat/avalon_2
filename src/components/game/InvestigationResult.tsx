'use client';

/**
 * InvestigationResult Component
 * Shows the Lady of the Lake investigation result to the holder
 */

interface InvestigationResultProps {
  targetNickname: string;
  result: 'good' | 'evil';
  newHolderNickname: string;
  onContinue: () => void;
}

export function InvestigationResult({
  targetNickname,
  result,
  newHolderNickname,
  onContinue,
}: InvestigationResultProps) {
  const isGood = result === 'good';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-blue-500/30 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2 animate-bounce">🌊</div>
          <h2 className="text-2xl font-bold text-blue-300">
            REVEALED
          </h2>
        </div>

        {/* Target Name */}
        <div className="text-center mb-4">
          <p className="text-slate-400 text-sm mb-1">The alignment of</p>
          <p className="text-xl font-bold text-white">{targetNickname}</p>
        </div>

        {/* Result Display */}
        <div
          className={`
            rounded-xl p-6 mb-6 text-center
            ${isGood
              ? 'bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border-2 border-emerald-500'
              : 'bg-gradient-to-br from-red-900/50 to-red-800/30 border-2 border-red-500'}
          `}
        >
          <div className="text-6xl mb-2">
            {isGood ? '🛡️' : '😈'}
          </div>
          <div
            className={`text-4xl font-black tracking-wider ${
              isGood ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isGood ? 'GOOD' : 'EVIL'}
          </div>
        </div>

        {/* Token Transfer Message */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-center border border-slate-700">
          <p className="text-slate-300 text-sm">
            The Lady of the Lake passes to
          </p>
          <p className="text-blue-300 font-semibold mt-1">
            🌊 {newHolderNickname}
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-3 px-4 rounded-lg font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg transition-all"
        >
          Continue
        </button>

        {/* Private Info Notice */}
        <p className="text-center text-xs text-slate-500 mt-4">
          🔒 Only you can see this result
        </p>
      </div>
    </div>
  );
}

