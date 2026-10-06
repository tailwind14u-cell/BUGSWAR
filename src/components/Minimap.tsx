import React, { useRef, useEffect } from 'react';
import { BugPlayer, GiantSugarCrystal } from '../types/game';
import { Compass } from 'lucide-react';

interface MinimapProps {
  selfPlayer?: BugPlayer;
  players: BugPlayer[];
  crystals: GiantSugarCrystal[];
}

export const Minimap: React.FC<MinimapProps> = ({ selfPlayer, players, crystals }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const viewRange = 1000;
    const scale = size / (viewRange * 2);
    const worldCenterX = selfPlayer?.x ?? 0;
    const worldCenterY = selfPlayer?.y ?? 0;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#09120b';
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(r => {
      ctx.beginPath();
      ctx.arc(center, center, (center - 4) * r, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.moveTo(center, 0);
    ctx.lineTo(center, size);
    ctx.moveTo(0, center);
    ctx.lineTo(size, center);
    ctx.stroke();

    for (const crystal of crystals) {
      const cx = center + (crystal.x - worldCenterX) * scale;
      const cy = center + (crystal.y - worldCenterY) * scale;

      ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of players) {
      if (selfPlayer && p.id === selfPlayer.id) continue;
      const px = center + (p.x - worldCenterX) * scale;
      const py = center + (p.y - worldCenterY) * scale;

      ctx.fillStyle = p.faction === 'centipede' ? '#ef4444' : p.faction === 'ant' ? '#f59e0b' : '#a855f7';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (selfPlayer) {
      const sx = center;
      const sy = center;

      // Pulse ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
      ctx.stroke();

      // Heading indicator
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(selfPlayer.angle) * 9, sy + Math.sin(selfPlayer.angle) * 9);
      ctx.stroke();

      // Center blip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [selfPlayer, players, crystals]);

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center select-none pointer-events-none">
      <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-2xl border border-emerald-900/60 bg-black/60 backdrop-blur-sm">
        <canvas ref={canvasRef} width={144} height={144} className="w-full h-full" />
        {/* Animated radar sweep line */}
        <div className="absolute inset-0 rounded-full border border-emerald-500/20 pointer-events-none">
          <div className="w-full h-full rounded-full animate-radar bg-gradient-to-tr from-emerald-500/15 via-transparent to-transparent" />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-mono tracking-wider">
        <Compass className="w-3 h-3 text-emerald-400" />
        <span>NEARBY RADAR</span>
      </div>
    </div>
  );
};
