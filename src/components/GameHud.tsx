import { Pause, Volume2, VolumeX } from 'lucide-react';
import React from 'react';
import { TOWER_STYLE_LABELS } from '../game/towers';
import { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  onPause: () => void;
  onToggleMute: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  onPause,
  onToggleMute,
}) => {
  const landmark = TOWER_STYLE_LABELS[hud.currentTowerStyle];

  return (
    <div
      className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-5 sm:p-8"
      aria-live="polite"
    >
      <div className="flex items-start justify-between w-full">
        {/* Top-left: Unboxed Live Stack Floor Counter & Metadata */}
        <div className="flex flex-col select-none">
          <span className="text-xs font-medium tracking-wider text-[#1E242B]/55">
            堆疊層數
          </span>
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className="font-mono-tabular text-4xl sm:text-5xl font-bold tracking-tight text-[#1E242B] leading-none">
              {hud.score}
            </span>
            {hud.combo >= 2 && (
              <span className="font-mono-tabular text-sm font-semibold text-[#9A7412]">
                PERFECT ×{hud.combo}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#1E242B]/65">
            <span>{landmark.name}</span>
            <span aria-hidden="true">·</span>
            <span>{landmark.city}</span>
            {hud.bestScore > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">最高 {hud.bestScore} 層</span>
              </>
            )}
          </div>
        </div>

        {/* Top-right: Audio & Pause controls (>= 44px touch targets) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={hud.isMuted ? '開啟音效' : '靜音'}
            title={hud.isMuted ? '開啟音效 (M)' : '靜音 (M)'}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-[#1E242B]/12 bg-[#FAF9F6]/90 text-[#1E242B] hover:bg-[#FFFFFF] hover:border-[#1E242B]/25 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D94E28] cursor-pointer"
          >
            {hud.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPause();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="暫停遊戲"
            title="暫停遊戲 (Esc)"
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-[#1E242B]/12 bg-[#FAF9F6]/90 text-[#1E242B] hover:bg-[#FFFFFF] hover:border-[#1E242B]/25 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D94E28] cursor-pointer"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Subtle bottom control hint only on floor 0 before first drop */}
      {hud.score === 0 && (
        <div className="mx-auto text-center pb-2">
          <span className="text-xs font-mono-tabular text-[#1E242B]/50">
            點擊螢幕或按 Space 釋放磚塊
          </span>
        </div>
      )}
    </div>
  );
};
