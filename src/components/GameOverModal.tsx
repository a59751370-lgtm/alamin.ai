import React from 'react';
import { GameStats } from '../types/game';
import { RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart }) => {
  const accuracy =
    stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

  const minutes = Math.floor(stats.timeSurvived / 60);
  const seconds = Math.floor(stats.timeSurvived % 60);
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="modal-frame relative w-full max-w-lg bg-[#18181b] border-2 border-[#ef4444] p-8 sm:p-10 text-[#e4e4e7] shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col">
          <span className="font-mono text-xs uppercase tracking-widest text-[#ef4444] font-bold">
            Connection Lost
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight mt-1">
            Mission Failed
          </h1>
          <p className="font-sans text-xs text-[#e4e4e7]/60 mt-1">
            Operator vital signs terminated. Combat logs archived for analysis.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="border-t border-[#e4e4e7]/15 pt-6 flex flex-col gap-4">
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-xs uppercase text-[#e4e4e7]/60 tracking-wider">
              Final Score
            </span>
            <span className="font-display text-2xl font-bold text-[#38bdf8] tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="font-mono text-xs uppercase text-[#e4e4e7]/60 tracking-wider">
              Eliminations
            </span>
            <span className="font-display text-2xl font-bold text-white tabular-nums">
              {stats.kills}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="font-mono text-xs uppercase text-[#e4e4e7]/60 tracking-wider">
              Accuracy
            </span>
            <span className="font-display text-2xl font-bold text-[#10b981] tabular-nums">
              {accuracy}%
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="font-mono text-xs uppercase text-[#e4e4e7]/60 tracking-wider">
              Waves Cleared
            </span>
            <span className="font-display text-2xl font-bold text-[#fbbf24] tabular-nums">
              {stats.wave}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="font-mono text-xs uppercase text-[#e4e4e7]/60 tracking-wider">
              Combat Duration
            </span>
            <span className="font-mono text-sm font-semibold text-[#e4e4e7]/80">
              {timeFormatted}
            </span>
          </div>
        </div>

        {/* Redeploy Button */}
        <button
          onClick={onRestart}
          className="w-full py-4 bg-[#ef4444] hover:bg-[#dc2626] text-white font-display font-extrabold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/50 mt-2"
        >
          <RotateCcw className="w-4 h-4" />
          Redeploy Operator
        </button>
      </div>
    </div>
  );
};
