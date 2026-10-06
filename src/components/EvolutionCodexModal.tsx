import React, { useState } from 'react';
import { FACTION_DETAILS, Faction, StageIndex } from '../types/game';
import { X, Shield, Swords, Zap, Activity, Award, ArrowRight } from 'lucide-react';

interface EvolutionCodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFaction?: Faction;
}

export const EvolutionCodexModal: React.FC<EvolutionCodexModalProps> = ({
  isOpen,
  onClose,
  initialFaction = 'centipede'
}) => {
  const [selectedFaction, setSelectedFaction] = useState<Faction>(initialFaction);
  const [selectedStage, setSelectedStage] = useState<StageIndex>(1);

  if (!isOpen) return null;

  const faction = FACTION_DETAILS[selectedFaction];
  const stage = faction.stages[selectedStage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-emerald-950/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-100 tracking-wide">
                EVOLUTION CODEX
              </h2>
              <p className="text-xs text-slate-400">
                Species evolution branches, mutation abilities, and backyard stats
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Faction Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800/60 bg-slate-900/20">
          {(['centipede', 'ant', 'spider'] as Faction[]).map((fId) => {
            const f = FACTION_DETAILS[fId];
            const isSelected = selectedFaction === fId;
            const icon = fId === 'centipede' ? '🐛' : fId === 'ant' ? '🐜' : '🕷️';

            return (
              <button
                key={fId}
                onClick={() => {
                  setSelectedFaction(fId);
                  setSelectedStage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>{icon}</span>
                <span>{f.name}</span>
                <span className="text-[10px] text-slate-500 font-normal">· {f.archetype}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Faction Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Growth Mechanic:</span>
              <p className="text-slate-200 mt-0.5">{faction.growthStyle}</p>
            </div>
            <div>
              <span className="text-emerald-400 font-medium">Triangle Advantage:</span>
              <p className="text-slate-200 mt-0.5">{faction.counterAdvantage}</p>
            </div>
            <div>
              <span className="text-rose-400 font-medium">Natural Weakness:</span>
              <p className="text-slate-200 mt-0.5">{faction.counterWeakness}</p>
            </div>
          </div>

          {/* 4-Stage Evolution Stepper */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Mutation Progression
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([1, 2, 3, 4] as StageIndex[]).map((sIdx) => {
                const stageInfo = faction.stages[sIdx];
                const isCurrent = selectedStage === sIdx;

                return (
                  <button
                    key={sIdx}
                    onClick={() => setSelectedStage(sIdx)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-950/50 border-emerald-500/50 shadow-md'
                        : 'bg-slate-900/30 border-slate-800/60 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-emerald-400 font-bold">Stage {sIdx}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {stageInfo.xpRequired === 0 ? 'Base' : `${stageInfo.xpRequired} XP`}
                      </span>
                    </div>
                    <div className="font-display font-semibold text-xs text-slate-200 truncate">
                      {stageInfo.speciesName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {stageInfo.abilityName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Stage Detail Card */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-slate-100">
                    {stage.speciesName}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Stage {stage.stage} of 4
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{stage.subtitle}</p>
              </div>

              {/* Base Stat Badges */}
              <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  SPD: {stage.stats.speed}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  HP: {stage.stats.health}
                </span>
                <span className="flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5 text-rose-400" />
                  DMG: {stage.stats.damage}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  ARM: {stage.stats.armor}
                </span>
              </div>
            </div>

            {/* Core Feature */}
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Physiological Trait:
              </span>
              <p className="text-sm text-slate-200 mt-1">{stage.coreFeature}</p>
            </div>

            {/* Active Ability */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-display">
                  <Zap className="w-3.5 h-3.5" />
                  <span>ACTIVE ABILITY: {stage.abilityName}</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">
                  Cooldown: {stage.abilityCooldown}s · {stage.abilityKey}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{stage.abilityDesc}</p>
            </div>

            {/* Stage 4 Ultimate (if stage 4) */}
            {stage.ultimateName && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-600/30">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 font-display">
                    <Award className="w-3.5 h-3.5" />
                    <span>APEX ULTIMATE: {stage.ultimateName}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Cooldown: {stage.ultimateCooldown}s · {stage.ultimateKey}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{stage.ultimateDesc}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            Close Codex
          </button>
        </div>
      </div>
    </div>
  );
};
