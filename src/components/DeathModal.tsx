import React from 'react';
import { BugPlayer, FACTION_DETAILS } from '../types/game';
import { Skull, RotateCcw, Award, Scissors, Users } from 'lucide-react';

interface DeathModalProps {
  player: BugPlayer;
  onRespawn: () => void;
  onChangeFaction: () => void;
  killerName?: string;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  player,
  onRespawn,
  onChangeFaction,
  killerName
}) => {
  const faction = FACTION_DETAILS[player.faction];
  const stage = faction.stages[player.stage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-950 border border-rose-950/70 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Skull icon & defeat header */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-600/40 flex items-center justify-center mb-3 text-rose-500 shadow-lg shadow-rose-950/50">
            <Skull className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-wider text-rose-400">
            METABOLISM COLLAPSED
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {killerName ? `Crushed by ${killerName}` : 'Decomposed into the backyard ecosystem'}
          </p>
        </div>

        {/* Match Statistics Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-left">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Final Mass</div>
            <div className="font-mono text-base font-bold text-emerald-400 mt-0.5">
              {Math.round(player.score).toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Peak Stage</div>
            <div className="font-display text-xs font-bold text-amber-400 mt-0.5 truncate">
              {stage.speciesName}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Kills</div>
            <div className="font-mono text-base font-bold text-rose-400 mt-0.5">
              {player.kills}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Segments Cut</div>
            <div className="font-mono text-base font-bold text-sky-400 mt-0.5">
              {player.segmentsSevered}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRespawn}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-display font-bold text-sm tracking-wider bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESPAWN NOW</span>
          </button>

          <button
            onClick={onChangeFaction}
            className="py-3 px-5 rounded-xl font-medium text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 transition-all cursor-pointer"
          >
            Switch Faction
          </button>
        </div>
      </div>
    </div>
  );
};
