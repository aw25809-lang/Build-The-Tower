import { Volume2, VolumeX } from 'lucide-react';
import React from 'react';
import { TOWER_PRESETS, TowerPresetId } from '../game/towers';

interface TitleOverlayProps {
  bestScore: number;
  isMuted: boolean;
  towerPreset: TowerPresetId;
  onSelectPreset: (preset: TowerPresetId) => void;
  onStart: () => void;
  onToggleMute: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  bestScore,
  isMuted,
  towerPreset,
  onSelectPreset,
  onStart,
  onToggleMute,
}) => {
  const selectedMeta = TOWER_PRESETS.find((p) => p.id === towerPreset) ?? TOWER_PRESETS[0];

  return (
    <div
      className="fixed inset-0 z-10 flex flex-col justify-between pointer-events-none p-5 sm:p-10 lg:p-14"
      aria-label="主畫面"
    >
      {/* Top bar: minimal audio toggle */}
      <div className="flex items-center justify-between w-full">
        <div className="text-xs font-mono-tabular tracking-widest text-[#1E242B]/55 uppercase">
          PLUMB STACK · WORLD TOWERS
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={isMuted ? '開啟音效' : '靜音'}
          title={isMuted ? '開啟音效 (M)' : '靜音 (M)'}
          className="pointer-events-auto inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-[#1E242B]/12 bg-[#FAF9F6]/90 text-[#1E242B] hover:bg-[#FFFFFF] hover:border-[#1E242B]/25 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D94E28] cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main title lockup placed in calm negative space */}
      <div className="my-auto max-w-md pointer-events-auto">
        <div className="mb-4">
          {/* Bespoke Architectural Plumb & World Tower SVG Lockup */}
          <svg
            width="52"
            height="62"
            viewBox="0 0 52 62"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="mb-3"
          >
            <line x1="26" y1="0" x2="26" y2="23" stroke="#1E242B" strokeWidth="1.75" />
            <circle cx="26" cy="4" r="2.5" fill="#D94E28" />
            <path d="M26 32L21 23H31L26 32Z" fill="#D94E28" />
            <path d="M12 37H40L38 45H14L12 37Z" fill="#3A6B6C" />
            <rect x="13" y="48" width="26" height="10" fill="#1E242B" />
          </svg>

          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#1E242B] leading-[1.12] text-balance">
            垂線堆疊
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-[#1E242B]/70 leading-relaxed max-w-sm">
            精準釋放世界各地名塔磚塊，切除多餘邊緣，築起專屬地標高塔。
          </p>
        </div>

        {/* World Tower Selector */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#1E242B]/65">選擇高塔外型</span>
            <span className="text-xs text-[#1E242B]/55">{selectedMeta.subtitle}</span>
          </div>
          <div
            className="flex flex-wrap gap-1.5"
            role="radiogroup"
            aria-label="選擇高塔外型"
          >
            {TOWER_PRESETS.map((preset) => {
              const active = preset.id === towerPreset;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPreset(preset.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D94E28] ${
                    active
                      ? 'bg-[#1E242B] text-white border border-[#1E242B]'
                      : 'bg-[#FAF9F6]/85 text-[#1E242B]/75 border border-[#1E242B]/14 hover:bg-white hover:text-[#1E242B]'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Unboxed typographic metadata */}
        {bestScore > 0 && (
          <div className="mb-4 flex items-center gap-2.5 text-sm text-[#1E242B]/75">
            <span>最高紀錄</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular font-semibold text-[#1E242B]">
              {bestScore} 層
            </span>
          </div>
        )}

        <div className="flex flex-col items-start gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-[#D94E28] text-white font-medium text-base tracking-wide shadow-sm hover:bg-[#C2421F] active:translate-y-px transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D94E28] cursor-pointer whitespace-nowrap"
          >
            開始堆疊
          </button>

          <p className="text-xs text-[#1E242B]/55 font-mono-tabular tracking-normal">
            點擊螢幕或按 Space 釋放磚塊 · Esc 暫停
          </p>
        </div>
      </div>

      {/* Bottom calm spacer */}
      <div className="h-2" />
    </div>
  );
};
