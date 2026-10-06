import React from 'react';
import { Volume2, VolumeX, Maximize2, BookOpen, Crosshair, HelpCircle } from 'lucide-react';
import { sound } from '../services/sound';

interface TopBarProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenCodex: () => void;
  onOpenControls: () => void;
  onOpenCombatTriangle: () => void;
  gameState: 'LOBBY' | 'PLAYING';
  onReturnToLobby?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isMuted,
  onToggleMute,
  onOpenCodex,
  onOpenControls,
  onOpenCombatTriangle,
  gameState,
  onReturnToLobby
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 bg-[#0a100c]/90 backdrop-blur-md border-b border-emerald-950/40 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-4">
        <span 
          onClick={onReturnToLobby}
          className="font-display text-xl font-bold tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          BUGS WAR
        </span>
        <span className="hidden sm:inline text-xs text-slate-500 font-mono">
          BACKYARD BATTLEFIELD
        </span>
      </div>

      {/* Zone 2: 4 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
        <button
          onClick={onOpenCodex}
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span>Evolution Codex</span>
        </button>

        <button
          onClick={onOpenCombatTriangle}
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <Crosshair className="w-4 h-4 text-amber-500" />
          <span>Combat Triangle</span>
        </button>

        <button
          onClick={onOpenControls}
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span>How to Play</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="hidden sm:inline-flex p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {gameState === 'PLAYING' && onReturnToLobby && (
          <button
            onClick={onReturnToLobby}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Factions
          </button>
        )}
      </div>
    </header>
  );
};
