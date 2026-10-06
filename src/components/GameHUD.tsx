import React from 'react';
import { BugPlayer, FACTION_DETAILS } from '../types/game';
import { Shield, Zap, Sparkles, Swords, Skull, Flame } from 'lucide-react';

interface GameHUDProps {
  player: BugPlayer;
  autoBite: boolean;
  onToggleAutoBite: () => void;
  onTriggerBite: () => void;
  onStartBoost?: () => void;
  onEndBoost?: () => void;
  onTriggerAbility: () => void;
  onTriggerUltimate: () => void;
  onTriggerSugarRush?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  autoBite,
  onToggleAutoBite,
  onTriggerBite,
  onStartBoost,
  onEndBoost,
  onTriggerAbility,
  onTriggerUltimate,
  onTriggerSugarRush
}) => {
  const factionData = FACTION_DETAILS[player.faction];
  const stageData = factionData.stages[player.stage];

  // XP Progress calculation
  const prevStageXp = player.stage === 1 ? 0 : factionData.stages[player.stage].xpRequired;
  const nextStageXp = player.stage < 4 ? factionData.stages[(player.stage + 1) as 1 | 2 | 3 | 4].xpRequired : prevStageXp + 500;
  const stageSpan = Math.max(1, nextStageXp - prevStageXp);
  const currentProgress = Math.max(0, player.xp - prevStageXp);
  const xpPercent = player.stage === 4 ? 100 : Math.min(100, (currentProgress / stageSpan) * 100);

  // Health calculation
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));

  // Cooldown percentages
  const abilityCdPercent = player.abilityCooldownTimer > 0
    ? (player.abilityCooldownTimer / player.abilityMaxCooldown) * 100
    : 0;

  const ultimateCdPercent = player.ultimateCooldownTimer > 0
    ? (player.ultimateCooldownTimer / player.ultimateMaxCooldown) * 100
    : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-4 md:p-6">
      {/* Top spacer for TopBar */}
      <div className="h-12" />

      {/* Center status alert for active Sugar Rush or Stun */}
      <div className="flex flex-col items-center justify-center gap-1">
        {player.isBoosting && player.score > 15 && (
          <div className="px-3.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-display font-bold text-xs tracking-wider shadow-md animate-pulse flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>SLITHER SPRINT (+85% SPEED · SHEDDING MASS)</span>
          </div>
        )}

        {player.isSugarRushActive && (
          <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-display font-bold text-sm tracking-wider shadow-lg animate-pulse flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>SUGAR RUSH ADRENALINE · +40% SPEED & 2X CRUSH</span>
          </div>
        )}

        {player.isStunned && (
          <div className="px-4 py-1 rounded-full bg-rose-500/30 border border-rose-400 text-rose-300 font-display font-bold text-xs tracking-wider animate-bounce">
            ⚡ STUNNED BY AGONY STING!
          </div>
        )}

        {player.isWebbed && player.faction !== 'centipede' && (
          <div className="px-4 py-1 rounded-full bg-purple-500/30 border border-purple-400 text-purple-300 font-display font-bold text-xs tracking-wider">
            🕸️ TRAPPED IN SPIDER WEB (-60% VELOCITY)
          </div>
        )}
      </div>

      {/* Bottom Area: Left gauges + Center Action Buttons */}
      <div className="flex flex-col lg:flex-row items-end justify-between gap-4">
        {/* Left Status Console */}
        <div className="pointer-events-auto w-full max-w-md bg-slate-950/85 backdrop-blur-md border border-emerald-950/50 rounded-2xl p-4 shadow-2xl space-y-3">
          {/* Species Title & Stage Badge */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-slate-100">
                  {stageData.speciesName}
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  Stage {player.stage}/4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                {stageData.subtitle}
              </p>
            </div>

            {/* Slither.io Mass & Length */}
            <div className="text-right">
              <div className="font-mono tabular-nums font-bold text-emerald-400 text-sm">
                {Math.round(player.score).toLocaleString()} <span className="text-[10px] text-slate-400 font-sans font-normal">MASS</span>
              </div>
              <div className="text-[11px] font-mono font-semibold text-amber-400">
                {player.faction === 'centipede'
                  ? `LENGTH: ${player.segments.length}`
                  : player.faction === 'ant'
                  ? `BULK: ${(player.bodyRadius * 2.2).toFixed(0)}mm`
                  : `LEG SPAN: ${(player.bodyRadius * 2.8).toFixed(0)}mm`}
              </div>
              <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 mt-0.5">
                <span className="flex items-center gap-0.5">
                  <Skull className="w-3 h-3 text-rose-400" /> {player.kills}
                </span>
                {player.killStreak > 1 && (
                  <span className="text-amber-400 font-mono font-bold animate-pulse">
                    🔥 {player.killStreak}x STREAK
                  </span>
                )}
                {player.segmentsSevered > 0 && (
                  <span className="text-sky-400 font-mono">
                    ✂ {player.segmentsSevered} cut
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Health Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1 font-medium">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Carapace Armor
              </span>
              <span className="font-mono tabular-nums">
                {Math.max(0, Math.round(player.hp))} / {Math.round(player.maxHp)} HP
              </span>
            </div>
            <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  hpPercent > 45 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Sugar / Evolution XP Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Evolution Growth (Sugar XP)
              </span>
              <span className="font-mono tabular-nums text-slate-400">
                {player.stage === 4 ? 'APEX MUTATION' : `${Math.round(player.xp)} / ${nextStageXp} XP`}
              </span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-200"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Sugar Rush Adrenaline Bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-sky-400" />
                Sugar Rush Meter
              </span>
              <span className="font-mono tabular-nums">
                {Math.round(player.sugarRush)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  player.isSugarRushActive
                    ? 'bg-sky-400 animate-pulse'
                    : 'bg-gradient-to-r from-sky-600 to-sky-400'
                }`}
                style={{ width: `${player.sugarRush}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center/Right Action Buttons (Primary Bite, Ability, Ultimate) */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-emerald-950/50 rounded-2xl p-2.5 shadow-2xl">
          {/* Primary Bite */}
          <button
            onClick={onTriggerBite}
            className="group relative flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-700/60 transition-all cursor-pointer"
          >
            <Swords className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold text-slate-200 mt-0.5">BITE</span>
            <span className="text-[9px] text-slate-400 font-mono">L-Click</span>
          </button>

          {/* Auto-Bite Toggle */}
          <button
            onClick={onToggleAutoBite}
            title="Toggle Auto-Bite on contact (Press [B])"
            className={`group relative flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-all cursor-pointer ${
              autoBite
                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-950'
                : 'bg-slate-900/70 hover:bg-slate-800/70 border-slate-700/60 text-slate-400'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full mb-1 ${autoBite ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-bold text-center leading-tight">
              AUTO BITE
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              {autoBite ? 'ON [B]' : 'OFF [B]'}
            </span>
          </button>

          {/* Slither Boost Sprint Button */}
          <button
            onMouseDown={onStartBoost}
            onMouseUp={onEndBoost}
            onTouchStart={onStartBoost}
            onTouchEnd={onEndBoost}
            title="Hold to Boost Speed (Space / Hold Click)"
            className={`group relative flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-all cursor-pointer ${
              player.isBoosting && player.score > 15
                ? 'bg-amber-950/60 border-amber-400 text-amber-300 shadow-lg shadow-amber-950 scale-95 ring-2 ring-amber-400/40'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300'
            }`}
          >
            <Zap className={`w-5 h-5 ${player.isBoosting ? 'text-amber-400 animate-pulse' : 'text-slate-400 group-hover:scale-110 transition-transform'}`} />
            <span className="text-[10px] font-bold text-center mt-0.5">BOOST</span>
            <span className="text-[9px] font-mono text-slate-400">Hold Click</span>
          </button>

          {/* Class Active Ability */}
          <button
            onClick={onTriggerAbility}
            disabled={player.abilityCooldownTimer > 0}
            className={`group relative flex flex-col items-center justify-center w-18 h-18 rounded-xl border transition-all cursor-pointer ${
              player.abilityCooldownTimer > 0
                ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-950/40 hover:bg-emerald-900/40 active:scale-95 border-emerald-700/60 text-emerald-300'
            }`}
          >
            <Zap className={`w-6 h-6 ${player.abilityCooldownTimer > 0 ? 'text-slate-500' : 'text-emerald-400 group-hover:scale-110 transition-transform'}`} />
            <span className="text-[10px] font-bold truncate max-w-[65px] px-1 text-center mt-0.5">
              {stageData.abilityName}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">R-Click / Shift</span>

            {/* Cooldown overlay */}
            {player.abilityCooldownTimer > 0 && (
              <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                <span className="font-mono text-sm font-bold text-amber-400">
                  {player.abilityCooldownTimer.toFixed(1)}s
                </span>
              </div>
            )}
          </button>

          {/* Stage 4 Ultimate Skill */}
          <button
            onClick={onTriggerUltimate}
            disabled={player.stage < 4 || player.ultimateCooldownTimer > 0}
            className={`group relative flex flex-col items-center justify-center w-18 h-18 rounded-xl border transition-all ${
              player.stage < 4
                ? 'bg-slate-950/40 border-slate-850 text-slate-600 cursor-not-allowed opacity-60'
                : player.ultimateCooldownTimer > 0
                ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-amber-950/40 hover:bg-amber-900/40 active:scale-95 border-amber-500/70 text-amber-300 cursor-pointer shadow-lg shadow-amber-950/40'
            }`}
          >
            <Sparkles className={`w-6 h-6 ${player.stage >= 4 && player.ultimateCooldownTimer <= 0 ? 'text-amber-400 group-hover:rotate-12 transition-transform' : 'text-slate-600'}`} />
            <span className="text-[10px] font-bold truncate max-w-[65px] px-1 text-center mt-0.5">
              {player.stage >= 4 && stageData.ultimateName ? stageData.ultimateName : 'LOCKED'}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">
              {player.stage >= 4 ? 'Space / Q' : 'Stage 4'}
            </span>

            {/* Cooldown overlay */}
            {player.stage >= 4 && player.ultimateCooldownTimer > 0 && (
              <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                <span className="font-mono text-sm font-bold text-amber-400">
                  {player.ultimateCooldownTimer.toFixed(1)}s
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
