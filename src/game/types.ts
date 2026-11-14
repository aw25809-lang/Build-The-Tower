import { TowerPresetId, TowerStyleId } from './towers';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'TOWER_FINALE' | 'GAME_OVER';

export type ActivePhase = 'SWINGING' | 'DROPPING';

export interface StackedBlock {
  x: number; // world X (left edge relative to centerX = 0)
  y: number; // world Y (bottom edge, 0 = foundation top)
  width: number;
  height: number;
  floor: number;
  towerStyle: TowerStyleId;
  wasPerfect: boolean;
}

export interface FallingPiece {
  x: number; // center X in world coordinates
  y: number; // center Y in world coordinates
  width: number;
  height: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  alpha: number;
  towerStyle: TowerStyleId;
  floor: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface AlignmentPulse {
  x: number;
  y: number;
  width: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface SliceLineFlash {
  x: number;
  y: number;
  height: number;
  life: number;
  maxLife: number;
}

export interface FloatingCallout {
  x: number;
  y: number;
  text: string;
  subText?: string;
  life: number;
  maxLife: number;
  color: string;
}

export interface HudSnapshot {
  gameState: GameState;
  score: number;
  bestScore: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  isNewRecord: boolean;
  isMuted: boolean;
  lastOverlapRatio: number;
  towerPreset: TowerPresetId;
  currentTowerStyle: TowerStyleId;
  finalePhase: 'NONE' | 'CAPPING' | 'PANORAMA' | 'ZOOM_OUT';
}
