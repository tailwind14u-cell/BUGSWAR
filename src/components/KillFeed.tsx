import React from 'react';
import { KillFeedItem } from '../types/game';

interface KillFeedProps {
  items: KillFeedItem[];
}

export const KillFeed: React.FC<KillFeedProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="absolute top-16 left-6 z-20 space-y-1.5 max-w-sm pointer-events-none select-none">
      {items.slice(0, 4).map((item) => {
        const killerIcon = item.killerFaction === 'centipede' ? '🐛' : item.killerFaction === 'ant' ? '🐜' : '🕷️';
        const victimIcon = item.victimFaction === 'centipede' ? '🐛' : item.victimFaction === 'ant' ? '🐜' : '🕷️';

        return (
          <div
            key={item.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/75 backdrop-blur-md border border-slate-800/60 text-xs shadow-md animate-fadeIn"
          >
            {item.wasCentipedeSplit ? (
              <span className="text-amber-400 font-bold">✂️ SEVERED</span>
            ) : (
              <span className="text-rose-400 font-bold">💀 SLAYED</span>
            )}
            <span className="text-slate-200 font-medium truncate max-w-[90px]">{item.killerName}</span>
            <span className="text-[11px]">{killerIcon}</span>
            <span className="text-slate-400">→</span>
            <span className="text-slate-300 truncate max-w-[90px]">{item.victimName}</span>
            <span className="text-[11px]">{victimIcon}</span>
          </div>
        );
      })}
    </div>
  );
};
