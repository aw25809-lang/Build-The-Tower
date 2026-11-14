import React from 'react';
import { HudSnapshot } from '../game/types';

interface PauseModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  hud,
  onResume,
  onRestart,
  onTitle,
}) => {
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-[#1E242B]/35 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm rounded-xl border border-[#1E242B]/15 bg-[#FAF9F6] p-7 shadow-lg">
        <h2
          id="pause-title"
          className="font-display text-2xl font-bold text-[#1E242B] tracking-tight"
        >
          已暫停
        </h2>

        <div className="mt-4 flex items-center justify-between py-3 border-y border-[#1E242B]/10 text-sm">
          <span className="text-[#1E242B]/65">目前堆疊層數</span>
          <span className="font-mono-tabular text-lg font-semibold text-[#1E242B]">
            {hud.score} 層
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-[#D94E28] text-white font-medium text-sm hover:bg-[#C2421F] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D94E28] cursor-pointer whitespace-nowrap"
          >
            繼續遊戲
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-lg border border-[#1E242B]/15 bg-white text-[#1E242B] font-medium text-sm hover:bg-[#F1EFEA] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E242B] cursor-pointer whitespace-nowrap"
          >
            重新開始
          </button>

          <button
            type="button"
            onClick={onTitle}
            className="w-full min-h-[44px] px-5 py-2 rounded-lg text-[#1E242B]/65 font-medium text-sm hover:text-[#1E242B] hover:bg-[#1E242B]/5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E242B] cursor-pointer whitespace-nowrap"
          >
            返回主畫面
          </button>
        </div>
      </div>
    </div>
  );
};
