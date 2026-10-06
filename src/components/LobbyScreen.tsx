import React, { useState } from 'react';
import { FACTION_DETAILS, Faction } from '../types/game';
import { Play, Sparkles, BookOpen, Crosshair, HelpCircle, Shield, Swords, Zap } from 'lucide-react';
import centipedeImg from '../assets/images/centipede_fury_portrait_1791251498352.jpg';
import antImg from '../assets/images/soldier_ant_portrait_1791251510492.jpg';
import spiderImg from '../assets/images/goliath_spider_portrait_1791251528781.jpg';
import backdropImg from '../assets/images/bugs_war_arena_backdrop_1791251485503.jpg';

interface LobbyScreenProps {
  onJoinGame: (name: string, faction: Faction) => void;
  onOpenCodex: () => void;
  onOpenCombatTriangle: () => void;
  onOpenControls: () => void;
}

const FACTION_PORTRAITS: Record<Faction, string> = {
  centipede: centipedeImg,
  ant: antImg,
  spider: spiderImg
};

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onJoinGame,
  onOpenCodex,
  onOpenCombatTriangle,
  onOpenControls
}) => {
  const [playerName, setPlayerName] = useState(() => {
    const prefixes = ['Viper', 'Chitin', 'Apex', 'Mandible', 'Shadow', 'Scythe', 'Crawler', 'Titan'];
    const suffixes = ['Fang', 'Hunter', 'Stalker', 'Crusher', 'Weaver', 'Bane', 'Sovereign'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  });

  const [selectedFaction, setSelectedFaction] = useState<Faction>('centipede');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onJoinGame(playerName.trim(), selectedFaction);
  };

  const faction = FACTION_DETAILS[selectedFaction];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#070d08] text-slate-100 select-none">
      {/* Background Graphic with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={backdropImg}
          alt="Backyard Battlefield"
          className="w-full h-full object-cover opacity-25 filter blur-[1px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070d08] via-[#070d08]/80 to-[#070d08]/40" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-12 flex-1 flex flex-col justify-center">
        {/* Hero Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Multiplayer Evolution Arena</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-wider text-slate-100 uppercase">
            BUGS WAR
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            Choose your insect faction, feast on glowing sugar drops, evolve through 4 mutation stages, and sever enemy centipedes in an authoritative backyard battlefield.
          </p>
        </div>

        {/* Faction Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {(['centipede', 'ant', 'spider'] as Faction[]).map((fId) => {
            const f = FACTION_DETAILS[fId];
            const isSelected = selectedFaction === fId;
            const portrait = FACTION_PORTRAITS[fId];

            return (
              <div
                key={fId}
                onClick={() => setSelectedFaction(fId)}
                className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col ${
                  isSelected
                    ? fId === 'centipede'
                      ? 'border-rose-500 bg-rose-950/20 shadow-xl shadow-rose-950/40 ring-2 ring-rose-500/40'
                      : fId === 'ant'
                      ? 'border-amber-500 bg-amber-950/20 shadow-xl shadow-amber-950/40 ring-2 ring-amber-500/40'
                      : 'border-purple-500 bg-purple-950/20 shadow-xl shadow-purple-950/40 ring-2 ring-purple-500/40'
                    : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                {/* Portrait Header */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  <img
                    src={portrait}
                    alt={f.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Archetype Label */}
                  <div className="absolute top-3 left-3 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-slate-700/60 text-slate-200">
                    {f.archetype}
                  </div>

                  {/* Faction Header Title */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-display text-xl font-bold text-slate-100 flex items-center justify-between">
                      <span>{f.name}</span>
                      <span className="text-base">{fId === 'centipede' ? '🐛' : fId === 'ant' ? '🐜' : '🕷️'}</span>
                    </h3>
                    <p className="text-xs text-slate-300 truncate">{f.tagline}</p>
                  </div>
                </div>

                {/* Body Specs */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
                  <p className="text-slate-300 leading-normal line-clamp-3">
                    {f.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-medium">Counters:</span>
                      <span className="text-slate-300 truncate max-w-[170px]">{f.counterAdvantage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 font-medium">Vulnerable:</span>
                      <span className="text-slate-300 truncate max-w-[170px]">{f.counterWeakness}</span>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  <div className="pt-1">
                    <div
                      className={`w-full py-1.5 rounded-lg text-center font-display font-semibold text-xs tracking-wider transition-colors ${
                        isSelected
                          ? fId === 'centipede'
                            ? 'bg-rose-500 text-white'
                            : fId === 'ant'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-purple-500 text-white'
                          : 'bg-slate-800/60 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {isSelected ? 'SELECTED FACTION' : 'SELECT FACTION'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enter Arena Input & Action Button */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter Bug Name..."
              maxLength={16}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 focus:outline-none text-slate-100 font-display text-sm tracking-wide placeholder:text-slate-500 shadow-inner"
            />

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-sm tracking-wider bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-xl shadow-emerald-950/60 transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>SPAWN IN BATTLEFIELD</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-1">
            <button
              type="button"
              onClick={onOpenCodex}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Evolution Tree (12 Stages)</span>
            </button>

            <button
              type="button"
              onClick={onOpenCombatTriangle}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Matchup Triangle</span>
            </button>

            <button
              type="button"
              onClick={onOpenControls}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Controls</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
