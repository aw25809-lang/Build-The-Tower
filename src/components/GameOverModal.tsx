import { Award } from 'lucide-react';
import React from 'react';
import { TOWER_PRESETS } from '../game/towers';
import { HudSnapshot } from '../game/types';

interface GameOverModalProps {
  hud: HudSnapshot;
  onRestart: () => void;
  onTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hud,
  onRestart,
  onTitle,
}) => {
  const presetMeta = TOWER_PRESETS.find((p) => p.id === hud.towerPreset) ?? TOWER_PRESETS[0];

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-[#1E242B]/35 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm rounded-xl border border-[#1E242B]/15 bg-[#FAF9F6] p-7 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="gameover-title"
              className="font-display text-2xl font-bold text-[#1E242B] tracking-tight"
            >
              堆疊結束
            </h2>
            <p className="mt-1 text-xs text-[#1E242B]/60">
              {presetMeta.name} · 磚塊未能與塔頂重合
            </p>
          </div>
          {hud.isNewRecord && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A7412] shrink-0 pt-1">
              <Award className="w-4 h-4" />
              <span>新紀錄</span>
            </div>
          )}
        </div>

        {/* Primary Score Highlight */}
        <div className="mt-6 pb-5 border-b border-[#1E242B]/10">
          <div className="text-xs font-medium text-[#1E242B]/60">最終堆疊層數</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono-tabular text-5xl font-bold tracking-tight text-[#1E242B]">
              {hud.score}
            </span>
            <span className="text-sm font-medium text-[#1E242B]/65">層</span>
          </div>
        </div>

        {/* Clean Unboxed Stats Grid */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-left">
          <div>
            <div className="text-xs text-[#1E242B]/55">最高紀錄</div>
            <div className="mt-0.5 font-mono-tabular text-base font-semibold text-[#1E242B]">
              {hud.bestScore} 層
            </div>
          </div>
          <div>
            <div className="text-xs text-[#1E242B]/55">完美對齊</div>
            <div className="mt-0.5 font-mono-tabular text-base font-semibold text-[#1E242B]">
              {hud.perfectCount} 次
            </div>
          </div>
          <div>
            <div className="text-xs text-[#1E242B]/55">最高連擊</div>
            <div className="mt-0.5 font-mono-tabular text-base font-semibold text-[#1E242B]">
              ×{hud.maxCombo}
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[44px] px-5 py-3 rounded-lg bg-[#D94E28] text-white font-medium text-sm tracking-wide hover:bg-[#C2421F] active:translate-y-px transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D94E28] cursor-pointer whitespace-nowrap"
          >
            再玩一次
          </button>

          <button
            type="button"
            onClick={onTitle}
            className="w-full min-h-[44px] px-5 py-2 rounded-lg text-[#1E242B]/65 font-medium text-sm hover:text-[#1E242B] hover:bg-[#1E242B]/5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E242B] cursor-pointer whitespace-nowrap"
          >
            切換高塔 / 主畫面
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] font-mono-tabular text-[#1E242B]/45">
          按 Enter 或 Space 快速重新開始
        </p>
      </div>
    </div>
  );
};
