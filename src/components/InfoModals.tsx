import React from 'react';
import { X, Crosshair, HelpCircle, Shield, Swords, Zap, CheckCircle2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CombatTriangleModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-emerald-950/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <Crosshair className="w-5 h-5 text-amber-400" />
            <h2 className="font-display text-lg font-bold text-slate-100 tracking-wide">
              THE COMBAT TRIANGLE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-300 leading-relaxed">
            BUGS WAR adheres to a strict Rock-Paper-Scissors meta. Exploiting faction match-ups allows you to conquer heavier opponents and break enemy formations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Centipedes */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2">
              <div className="flex items-center gap-1.5 font-display font-bold text-rose-400 text-sm">
                <span>🐛 CENTIPEDES</span>
              </div>
              <p className="text-xs text-slate-300">
                <span className="text-emerald-400 font-semibold">COUNTERS SPIDERS:</span> Glides through web traps without slowing down. Coils around lone stalkers.
              </p>
              <p className="text-[11px] text-rose-300/80">
                <span className="text-rose-400 font-semibold">PREY TO:</span> Ant crushing jaws severing body segments.
              </p>
            </div>

            {/* Ants */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
              <div className="flex items-center gap-1.5 font-display font-bold text-amber-400 text-sm">
                <span>🐜 ANTS</span>
              </div>
              <p className="text-xs text-slate-300">
                <span className="text-emerald-400 font-semibold">COUNTERS CENTIPEDES:</span> Massive armored mandibles snap segment chains with +50% bonus severance.
              </p>
              <p className="text-[11px] text-amber-300/80">
                <span className="text-rose-400 font-semibold">PREY TO:</span> Spider webs and venom neutralizing swarms.
              </p>
            </div>

            {/* Spiders */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-2">
              <div className="flex items-center gap-1.5 font-display font-bold text-purple-400 text-sm">
                <span>🕷️ SPIDERS</span>
              </div>
              <p className="text-xs text-slate-300">
                <span className="text-emerald-400 font-semibold">COUNTERS ANTS:</span> Dense web matrices root and cripple slow-moving ant columns from safety.
              </p>
              <p className="text-[11px] text-purple-300/80">
                <span className="text-rose-400 font-semibold">PREY TO:</span> Unstoppable Centipedes ignoring webbing.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1.5">
            <div className="font-semibold text-emerald-400">💡 Backyard Veteran Tip:</div>
            <p className="text-slate-300">
              When biting a Centipede, always strike behind the head to trigger a segment split. The severed tail pieces instantly dissolve into high-value sugar drops for you to consume!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export const ControlsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-950 border border-emerald-950/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <h2 className="font-display text-lg font-bold text-slate-100 tracking-wide">
              HOW TO SURVIVE THE YARD
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Layout */}
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">Movement & Steering</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
                Mouse Cursor / WASD / Arrow Keys
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">Slither Speed Boost</span>
              <span className="font-mono text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
                Hold L-Click / Space (+85% Speed, sheds mass)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">Auto-Bite (On Contact)</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
                Key [B] / HUD Toggle (ON by default)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">Primary Chitin Bite</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
                Left Click / Space (Instant Force Bite)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">Class Active Ability</span>
              <span className="font-mono text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
                Right Click / Shift / E
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">Apex Ultimate (Stage 4)</span>
              <span className="font-mono text-sky-400 bg-sky-950/40 px-2 py-1 rounded border border-sky-800/40">
                Q / Space / R
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Eat glowing sugar drops to earn XP and trigger 4 evolutionary species mutations.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Consuming sugar fills the Sugar Rush meter for an adrenaline boost (+40% speed & 2x bite).</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Bite the Giant Sugar Crystals to shatter massive honeydew clusters for your colony.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer"
          >
            Ready to Hunt
          </button>
        </div>
      </div>
    </div>
  );
};
