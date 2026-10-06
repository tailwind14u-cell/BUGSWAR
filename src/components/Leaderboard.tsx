import React from 'react';
import { LeaderboardEntry } from '../types/game';
import { Trophy } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  selfId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, selfId }) => {
  return (
    <div className="absolute top-16 right-4 z-20 w-64 bg-slate-950/85 backdrop-blur-md border border-emerald-950/40 rounded-xl p-3.5 shadow-2xl pointer-events-none select-none">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 font-display">
          <Trophy className="w-3.5 h-3.5" />
          <span>Yard Leaderboard</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">TOP 10</span>
      </div>

      <div className="space-y-1">
        {entries.length === 0 ? (
          <div className="text-center py-3 text-xs text-slate-400">Scouting backyard...</div>
        ) : (
          entries.map((entry, idx) => {
            const isSelf = entry.id === selfId;
            const factionIcon = entry.faction === 'centipede' ? '🐛' : entry.faction === 'ant' ? '🐜' : '🕷️';

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                  isSelf
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className={`w-4 text-[11px] font-mono text-right ${idx === 0 ? 'text-amber-400 font-bold' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {idx + 1}
                  </span>
                  <span>{factionIcon}</span>
                  <span className="truncate max-w-[100px]">{entry.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">S{entry.stage}</span>
                </div>

                <div className="font-mono tabular-nums text-[11px] text-right text-slate-300">
                  {Math.round(entry.score).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
