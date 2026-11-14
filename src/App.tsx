/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { TitleOverlay } from './components/TitleOverlay';
import { PendulumStackEngine } from './game/engine';
import { TowerPresetId } from './game/towers';
import { HudSnapshot } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  gameState: 'TITLE_MENU',
  score: 0,
  bestScore: 0,
  combo: 0,
  maxCombo: 0,
  perfectCount: 0,
  isNewRecord: false,
  isMuted: false,
  lastOverlapRatio: 1,
  towerPreset: 'world_tour',
  currentTowerStyle: 'pisa',
  finalePhase: 'NONE',
};

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PendulumStackEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const gameStateRef = useRef(hud.gameState);
  gameStateRef.current = hud.gameState;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new PendulumStackEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;
    engine.startLoop();

    const resizeObserver = new ResizeObserver(() => {
      engine.handleResize();
    });
    resizeObserver.observe(container);

    const handleWindowResize = () => engine.handleResize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const pressedKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || pressedKeys.has(e.code)) return;
      pressedKeys.add(e.code);

      const engine = engineRef.current;
      if (!engine) return;

      const currentState = gameStateRef.current;

      if (e.code === 'KeyM') {
        engine.toggleMute();
        return;
      }

      if (e.code === 'Escape') {
        if (currentState === 'PLAYING') {
          e.preventDefault();
          engine.pauseGame();
        } else if (currentState === 'PAUSED') {
          e.preventDefault();
          engine.resumeGame();
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'BUTTON' && currentState !== 'PLAYING') {
          return;
        }

        e.preventDefault();
        if (currentState === 'TITLE_MENU') {
          engine.startNewGame();
        } else if (currentState === 'PLAYING') {
          engine.handleDropAction();
        } else if (currentState === 'GAME_OVER') {
          engine.startNewGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.code);
    };

    const handleBlur = () => {
      pressedKeys.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handlePlayfieldPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (gameStateRef.current === 'PLAYING') {
      engineRef.current?.handleDropAction();
    }
  }, []);

  const handleSkipFinale = useCallback(() => {
    engineRef.current?.skipFinale();
  }, []);

  const handleSelectPreset = useCallback((preset: TowerPresetId) => {
    engineRef.current?.setTowerPreset(preset);
  }, []);

  const handleStart = useCallback(() => {
    engineRef.current?.startNewGame();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseGame();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resumeGame();
  }, []);

  const handleReturnTitle = useCallback(() => {
    engineRef.current?.returnToTitle();
  }, []);

  const handleToggleMute = useCallback(() => {
    engineRef.current?.toggleMute();
  }, []);

  return (
    <main
      ref={containerRef}
      onPointerDown={handlePlayfieldPointerDown}
      className="relative w-full h-full overflow-hidden bg-[#F4F3EF] cursor-pointer"
    >
      {/* Isolated 60fps Canvas Container */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        aria-label="垂線堆疊遊戲畫布"
      />

      {/* Game Shell Overlays */}
      {hud.gameState === 'TITLE_MENU' && (
        <TitleOverlay
          bestScore={hud.bestScore}
          isMuted={hud.isMuted}
          towerPreset={hud.towerPreset}
          onSelectPreset={handleSelectPreset}
          onStart={handleStart}
          onToggleMute={handleToggleMute}
        />
      )}

      {(hud.gameState === 'PLAYING' || hud.gameState === 'PAUSED') && (
        <GameHud
          hud={hud}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
        />
      )}

      {hud.gameState === 'PAUSED' && (
        <PauseModal
          hud={hud}
          onResume={handleResume}
          onRestart={handleStart}
          onTitle={handleReturnTitle}
        />
      )}

      {hud.gameState === 'TOWER_FINALE' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-5 sm:p-8">
          <div className="flex flex-col select-none">
            <span className="text-xs font-medium tracking-wider text-[#1E242B]/55">
              {hud.finalePhase === 'CAPPING'
                ? '建築封頂中'
                : hud.finalePhase === 'PANORAMA'
                ? '全景回顧中'
                : '全塔全貌展示'}
            </span>
            <span className="font-mono-tabular text-3xl sm:text-4xl font-bold tracking-tight text-[#1E242B] mt-0.5">
              {hud.score} 層
            </span>
          </div>

          <div className="flex justify-end w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSkipFinale();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="pointer-events-auto inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg border border-[#1E242B]/15 bg-[#FAF9F6]/90 text-[#1E242B] text-xs font-medium tracking-wide hover:bg-white hover:border-[#1E242B]/30 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D94E28] cursor-pointer whitespace-nowrap"
            >
              略過回顧
            </button>
          </div>
        </div>
      )}

      {hud.gameState === 'GAME_OVER' && (
        <GameOverModal
          hud={hud}
          onRestart={handleStart}
          onTitle={handleReturnTitle}
        />
      )}
    </main>
  );
}
