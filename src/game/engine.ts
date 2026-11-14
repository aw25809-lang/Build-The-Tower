import { SoundSynthesizer } from './audio';
import { drawCountryBackdrop } from './scenery';
import {
  drawWorldTowerBlock,
  drawWorldTowerRoof,
  getRoofHeight,
  getTowerAccentColor,
  resolveTowerStyle,
  TOWER_STYLE_LABELS,
  TowerPresetId,
  TowerStyleId,
} from './towers';
import {
  ActivePhase,
  AlignmentPulse,
  FallingPiece,
  FloatingCallout,
  GameState,
  HudSnapshot,
  Particle,
  SliceLineFlash,
  StackedBlock,
} from './types';

const STORAGE_BEST_KEY = 'plumb_stack_best_score_v1';
const STORAGE_MUTE_KEY = 'plumb_stack_muted_v1';
const STORAGE_PRESET_KEY = 'plumb_stack_tower_preset_v1';

const BLOCK_HEIGHT = 32;
const PERFECT_TOLERANCE = 3.8;
const GRAVITY = 3600;
const INITIAL_DROP_SPEED = 260;
const MAX_PARTICLES = 120;

const VALID_PRESETS: TowerPresetId[] = [
  'world_tour',
  'taipei_101',
  'eiffel',
  'pisa',
  'big_ben',
  'skytree',
  'burj_khalifa',
];

type FinaleStage =
  | 'NONE'
  | 'MISSED_FALL'
  | 'CAPPING_ROOF'
  | 'ROOF_SETTLE'
  | 'PANORAMA_DOWN'
  | 'ZOOM_OUT_FIT'
  | 'FINAL_HOLD';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpHexColor(hexA: string, hexB: string, t: number): string {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r1 = (a >> 16) & 255;
  const g1 = (a >> 8) & 255;
  const b1 = a & 255;
  const r2 = (b >> 16) & 255;
  const g2 = (b >> 8) & 255;
  const b2 = b & 255;
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const bl = Math.round(lerp(b1, b2, t));
  return `rgb(${r}, ${g}, ${bl})`;
}

export class PendulumStackEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio: SoundSynthesizer;
  private onHudChange: (snapshot: HudSnapshot) => void;

  private rafId: number | null = null;
  private lastTimestamp = 0;

  private viewW = 1280;
  private viewH = 720;
  private dpr = 1;

  // Game state machine
  private gameState: GameState = 'TITLE_MENU';
  private activePhase: ActivePhase = 'SWINGING';

  // Tower preset & active style
  private towerPreset: TowerPresetId = 'world_tour';
  private activeTowerStyle: TowerStyleId = 'pisa';

  // Backdrop crossfade state
  private backdropStyle: TowerStyleId = 'pisa';
  private prevBackdropStyle: TowerStyleId = 'pisa';
  private backdropBlend = 1;

  // Scores & records
  private score = 0;
  private bestScore = 0;
  private combo = 0;
  private maxCombo = 0;
  private perfectCount = 0;
  private isNewRecord = false;
  private lastOverlapRatio = 1;

  // Tower & active block state
  private initialWidth = 200;
  private stack: StackedBlock[] = [];
  private activeWidth = 200;

  // Pendulum state
  private pendulumPhase = -Math.PI / 2;
  private pendulumTheta = 0;
  private angularSpeed = 2.05;
  private idleTime = 0;

  // Drop state
  private dropX = 0;
  private dropBottomY = 0;
  private dropVy = 0;

  // Camera & zoom state
  private cameraY = 0;
  private targetCameraY = 0;
  private cameraZoom = 1;
  private towerCenterScreenX = 640;
  private targetTowerCenterScreenX = 640;

  // Finale roof-cap & panorama review state
  private finaleStage: FinaleStage = 'NONE';
  private finaleTimer = 0;
  private roofVisible = false;
  private roofOffsetY = 0;
  private roofStyle: TowerStyleId = 'pisa';
  private panoramaRoofCamY = 0;
  private panoramaStartCamY = 0;
  private panoramaBaseCamY = 0;
  private panoramaFitCamY = 0;
  private panoramaFitZoom = 1;
  private panoramaDownDuration = 1.6;

  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;

  // Dynamic pools
  private fallingPieces: FallingPiece[] = [];
  private particles: Particle[] = [];
  private alignmentPulses: AlignmentPulse[] = [];
  private sliceFlashes: SliceLineFlash[] = [];
  private floatingCallouts: FloatingCallout[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    onHudChange: (snapshot: HudSnapshot) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.onHudChange = onHudChange;

    this.bestScore = this.loadBestScore();
    this.towerPreset = this.loadTowerPreset();
    const initialMuted = this.loadMutedState();
    this.audio = new SoundSynthesizer(initialMuted);

    this.handleResize();
    this.setupInitialPreviewTower();
    this.emitHud();
  }

  private loadBestScore(): number {
    try {
      const raw = localStorage.getItem(STORAGE_BEST_KEY);
      const parsed = raw ? parseInt(raw, 10) : 0;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  private saveBestScore(value: number): void {
    try {
      localStorage.setItem(STORAGE_BEST_KEY, String(value));
    } catch {
      // ignore storage errors
    }
  }

  private loadMutedState(): boolean {
    try {
      return localStorage.getItem(STORAGE_MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private saveMutedState(muted: boolean): void {
    try {
      localStorage.setItem(STORAGE_MUTE_KEY, String(muted));
    } catch {
      // ignore storage errors
    }
  }

  private loadTowerPreset(): TowerPresetId {
    try {
      const raw = localStorage.getItem(STORAGE_PRESET_KEY) as TowerPresetId | null;
      if (raw && VALID_PRESETS.includes(raw)) {
        return raw;
      }
      return 'world_tour';
    } catch {
      return 'world_tour';
    }
  }

  private saveTowerPreset(preset: TowerPresetId): void {
    try {
      localStorage.setItem(STORAGE_PRESET_KEY, preset);
    } catch {
      // ignore storage errors
    }
  }

  private transitionBackdrop(nextStyle: TowerStyleId): void {
    if (nextStyle === this.backdropStyle) return;
    this.prevBackdropStyle = this.backdropStyle;
    this.backdropStyle = nextStyle;
    this.backdropBlend = 0;
  }

  public setTowerPreset(preset: TowerPresetId): void {
    this.towerPreset = preset;
    this.saveTowerPreset(preset);
    if (this.gameState === 'TITLE_MENU') {
      this.setupInitialPreviewTower();
    }
    this.emitHud();
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt);
      this.render();

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public handleResize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    this.viewW = rect ? rect.width : window.innerWidth;
    this.viewH = rect ? rect.height : window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.max(1, Math.floor(this.viewW * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(this.viewH * this.dpr));
    this.canvas.style.width = `${this.viewW}px`;
    this.canvas.style.height = `${this.viewH}px`;

    this.updateTowerCenterTarget();
    if (this.idleTime === 0) {
      this.towerCenterScreenX = this.targetTowerCenterScreenX;
    }
  }

  private updateTowerCenterTarget(): void {
    if (this.gameState === 'TITLE_MENU' && this.viewW >= 960) {
      this.targetTowerCenterScreenX = Math.round(this.viewW * 0.66);
    } else {
      this.targetTowerCenterScreenX = Math.round(this.viewW * 0.5);
    }
  }

  private setupInitialPreviewTower(): void {
    this.initialWidth = clamp(Math.round(this.viewW * 0.34), 164, 224);
    this.activeWidth = this.initialWidth;
    const baseStyle = resolveTowerStyle(this.towerPreset, 0);
    const previewStyle1 = resolveTowerStyle(this.towerPreset, 1);
    const previewStyle2 = resolveTowerStyle(this.towerPreset, 2);
    this.activeTowerStyle = resolveTowerStyle(this.towerPreset, 3);

    this.transitionBackdrop(this.towerPreset === 'world_tour' ? 'taipei_101' : baseStyle);

    this.stack = [
      {
        x: -this.initialWidth / 2,
        y: -BLOCK_HEIGHT,
        width: this.initialWidth,
        height: BLOCK_HEIGHT,
        floor: 0,
        towerStyle: baseStyle,
        wasPerfect: false,
      },
      {
        x: -this.initialWidth / 2,
        y: 0,
        width: this.initialWidth,
        height: BLOCK_HEIGHT,
        floor: 1,
        towerStyle: previewStyle1,
        wasPerfect: false,
      },
      {
        x: -this.initialWidth / 2,
        y: BLOCK_HEIGHT,
        width: this.initialWidth,
        height: BLOCK_HEIGHT,
        floor: 2,
        towerStyle: previewStyle2,
        wasPerfect: false,
      },
    ];
    this.cameraY = BLOCK_HEIGHT * 1.4;
    this.targetCameraY = BLOCK_HEIGHT * 1.4;
    this.cameraZoom = 1;
    this.roofVisible = false;
    this.finaleStage = 'NONE';
    this.pendulumPhase = 0;
  }

  public startNewGame(): void {
    this.audio.unlock();
    this.gameState = 'PLAYING';
    this.activePhase = 'SWINGING';

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.isNewRecord = false;
    this.lastOverlapRatio = 1;

    this.initialWidth = clamp(Math.round(this.viewW * 0.34), 164, 224);
    this.activeWidth = this.initialWidth;
    const baseStyle = resolveTowerStyle(this.towerPreset, 0);
    this.activeTowerStyle = resolveTowerStyle(this.towerPreset, 1);

    this.prevBackdropStyle = baseStyle;
    this.backdropStyle = baseStyle;
    this.backdropBlend = 1;

    this.stack = [
      {
        x: -this.initialWidth / 2,
        y: -BLOCK_HEIGHT,
        width: this.initialWidth,
        height: BLOCK_HEIGHT,
        floor: 0,
        towerStyle: baseStyle,
        wasPerfect: false,
      },
    ];

    this.fallingPieces = [];
    this.particles = [];
    this.alignmentPulses = [];
    this.sliceFlashes = [];
    this.floatingCallouts = [];

    this.cameraY = 0;
    this.targetCameraY = 0;
    this.cameraZoom = 1;
    this.finaleStage = 'NONE';
    this.finaleTimer = 0;
    this.roofVisible = false;
    this.roofOffsetY = 0;
    this.hitstopTimer = 0;
    this.shakeIntensity = 0;

    this.angularSpeed = this.computeAngularSpeed(0);
    this.pendulumPhase = -Math.PI / 2;
    this.pendulumTheta = -this.getMaxSwingAngle();

    this.updateTowerCenterTarget();
    this.emitHud();
  }

  public returnToTitle(): void {
    this.gameState = 'TITLE_MENU';
    this.activePhase = 'SWINGING';
    this.score = 0;
    this.combo = 0;
    this.fallingPieces = [];
    this.particles = [];
    this.alignmentPulses = [];
    this.sliceFlashes = [];
    this.floatingCallouts = [];
    this.setupInitialPreviewTower();
    this.updateTowerCenterTarget();
    this.emitHud();
  }

  public pauseGame(): void {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      this.emitHud();
    }
  }

  public resumeGame(): void {
    if (this.gameState === 'PAUSED') {
      this.audio.unlock();
      this.gameState = 'PLAYING';
      this.lastTimestamp = performance.now();
      this.emitHud();
    }
  }

  public toggleMute(): void {
    const next = !this.audio.isMuted();
    this.audio.setMuted(next);
    this.saveMutedState(next);
    if (!next) {
      this.audio.unlock();
    }
    this.emitHud();
  }

  public handleDropAction(): void {
    if (this.gameState !== 'PLAYING' || this.activePhase !== 'SWINGING') {
      return;
    }
    this.audio.unlock();
    this.audio.playRelease();

    const { blockCenterX, blockBottomWorldY } = this.getSwingBlockWorldPosition();
    this.dropX = blockCenterX - this.activeWidth / 2;
    this.dropBottomY = blockBottomWorldY;
    this.dropVy = INITIAL_DROP_SPEED;
    this.activePhase = 'DROPPING';
  }

  public skipFinale(): void {
    if (this.gameState !== 'TOWER_FINALE') return;

    const topBlock = this.stack[this.stack.length - 1];
    this.roofStyle = topBlock.towerStyle;
    this.roofVisible = true;
    this.roofOffsetY = 0;

    this.computePanoramaTargets();
    this.cameraY = this.panoramaFitCamY;
    this.targetCameraY = this.panoramaFitCamY;
    this.cameraZoom = this.panoramaFitZoom;
    this.finaleStage = 'NONE';
    this.gameState = 'GAME_OVER';
    this.emitHud();
  }

  private computePanoramaTargets(): void {
    const topBlock = this.stack[this.stack.length - 1];
    const towerTopY = topBlock.y + topBlock.height;
    const roofH = getRoofHeight(topBlock.towerStyle, topBlock.width);
    const totalTowerH = towerTopY + roofH - -BLOCK_HEIGHT;

    this.panoramaRoofCamY = towerTopY + roofH * 0.15;
    this.panoramaBaseCamY = 0;
    this.panoramaFitZoom = clamp((this.viewH * 0.70) / Math.max(180, totalTowerH), 0.20, 0.96);
    this.panoramaFitCamY = -BLOCK_HEIGHT + (0.16 * this.viewH) / this.panoramaFitZoom;
    this.panoramaDownDuration = clamp(1.0 + this.stack.length * 0.055, 1.15, 2.6);
  }

  private beginTowerFinale(): void {
    const topBlock = this.stack[this.stack.length - 1];
    this.roofStyle = topBlock.towerStyle;
    this.roofVisible = false;
    this.roofOffsetY = 260;

    this.computePanoramaTargets();
    this.gameState = 'TOWER_FINALE';
    this.finaleStage = 'MISSED_FALL';
    this.finaleTimer = 0;
    this.emitHud();
  }

  private computeAngularSpeed(floor: number): number {
    return 2.05 + 1.85 * (1 - Math.exp(-floor / 20));
  }

  private getLayoutMetrics() {
    const targetTowerScreenY = Math.round(this.viewH * 0.69);
    const pivotScreenY = Math.max(40, Math.round(this.viewH * 0.075));
    const availableSpan = Math.max(220, targetTowerScreenY - pivotScreenY);
    const cableLength = clamp(Math.round(availableSpan * 0.52), 140, 270);
    const pivotWorldY = this.targetCameraY + (targetTowerScreenY - pivotScreenY);

    return {
      targetTowerScreenY,
      pivotScreenY,
      cableLength,
      pivotWorldY,
    };
  }

  private getMaxSwingAngle(): number {
    const { cableLength } = this.getLayoutMetrics();
    const maxHorizontalSwing = Math.min(this.viewW * 0.34, this.initialWidth * 1.05);
    const ratio = clamp(maxHorizontalSwing / cableLength, 0.32, 0.82);
    return Math.asin(ratio);
  }

  private getSwingBlockWorldPosition(): {
    clampX: number;
    clampWorldY: number;
    blockCenterX: number;
    blockBottomWorldY: number;
    pivotWorldY: number;
    cableLength: number;
  } {
    const { cableLength, pivotWorldY } = this.getLayoutMetrics();
    const clampX = cableLength * Math.sin(this.pendulumTheta);
    const clampWorldY = pivotWorldY - cableLength * Math.cos(this.pendulumTheta);
    return {
      clampX,
      clampWorldY,
      blockCenterX: clampX,
      blockBottomWorldY: clampWorldY - BLOCK_HEIGHT,
      pivotWorldY,
      cableLength,
    };
  }

  private update(dt: number): void {
    this.idleTime += dt;

    if (this.backdropBlend < 1) {
      this.backdropBlend = Math.min(1, this.backdropBlend + dt * 1.15);
    }

    this.towerCenterScreenX +=
      (this.targetTowerCenterScreenX - this.towerCenterScreenX) * Math.min(1, dt * 8);

    if (this.gameState === 'PAUSED') {
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }

    if (this.shakeIntensity > 0.1) {
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(0.0015, dt);
    } else {
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    if (this.gameState === 'TITLE_MENU') {
      this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, dt * 7.5);
      const maxAngle = this.getMaxSwingAngle() * 0.65;
      this.pendulumPhase += 1.45 * dt;
      this.pendulumTheta = maxAngle * Math.sin(this.pendulumPhase);
    } else if (this.gameState === 'PLAYING') {
      this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, dt * 7.5);

      if (this.activePhase === 'SWINGING') {
        const maxAngle = this.getMaxSwingAngle();
        this.pendulumPhase += this.angularSpeed * dt;
        this.pendulumTheta = maxAngle * Math.sin(this.pendulumPhase);
      } else if (this.activePhase === 'DROPPING') {
        this.dropVy += GRAVITY * dt;
        this.dropBottomY -= this.dropVy * dt;

        const topBlock = this.stack[this.stack.length - 1];
        const towerTopY = topBlock.y + topBlock.height;

        if (this.dropBottomY <= towerTopY) {
          this.resolveDropLanding(topBlock, towerTopY);
        }
      }
    } else if (this.gameState === 'TOWER_FINALE') {
      this.updateFinale(dt);
    }

    // Update falling offcut/missed pieces
    for (let i = this.fallingPieces.length - 1; i >= 0; i--) {
      const p = this.fallingPieces[i];
      p.vy -= GRAVITY * 0.72 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      p.alpha -= 0.45 * dt;
      if (p.alpha <= 0 || p.y < this.cameraY - this.viewH * 1.5) {
        this.fallingPieces.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.vy -= 520 * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha = 1 - pt.life / pt.maxLife;
    }

    for (let i = this.alignmentPulses.length - 1; i >= 0; i--) {
      const pulse = this.alignmentPulses[i];
      pulse.life += dt;
      if (pulse.life >= pulse.maxLife) {
        this.alignmentPulses.splice(i, 1);
      }
    }

    for (let i = this.sliceFlashes.length - 1; i >= 0; i--) {
      const flash = this.sliceFlashes[i];
      flash.life += dt;
      if (flash.life >= flash.maxLife) {
        this.sliceFlashes.splice(i, 1);
      }
    }

    for (let i = this.floatingCallouts.length - 1; i >= 0; i--) {
      const callout = this.floatingCallouts[i];
      callout.life += dt;
      callout.y += 42 * dt;
      if (callout.life >= callout.maxLife) {
        this.floatingCallouts.splice(i, 1);
      }
    }
  }

  private updateFinale(dt: number): void {
    this.finaleTimer += dt;
    const topBlock = this.stack[this.stack.length - 1];
    const towerTopY = topBlock.y + topBlock.height;

    if (this.finaleStage === 'MISSED_FALL') {
      // Gently position camera for clear sky headroom above tower top
      this.cameraY += (this.panoramaRoofCamY - this.cameraY) * Math.min(1, dt * 5);

      if (this.finaleTimer >= 0.45) {
        this.finaleStage = 'CAPPING_ROOF';
        this.finaleTimer = 0;
        this.roofVisible = true;
        this.roofOffsetY = 260;
        this.emitHud();
      }
    } else if (this.finaleStage === 'CAPPING_ROOF') {
      this.cameraY += (this.panoramaRoofCamY - this.cameraY) * Math.min(1, dt * 6);
      const duration = 0.65;
      const t = clamp(this.finaleTimer / duration, 0, 1);
      this.roofOffsetY = 260 * (1 - easeInCubic(t));

      if (t >= 1) {
        this.roofOffsetY = 0;
        this.shakeIntensity = 2.8;
        this.audio.playRoofCap();
        this.spawnDustBurst(topBlock.x, towerTopY, '#C59B27', 9);
        this.spawnDustBurst(topBlock.x + topBlock.width, towerTopY, '#C59B27', 9);
        this.alignmentPulses.push({
          x: topBlock.x,
          y: towerTopY,
          width: topBlock.width,
          life: 0,
          maxLife: 0.6,
          color: '#C59B27',
        });

        this.finaleStage = 'ROOF_SETTLE';
        this.finaleTimer = 0;
      }
    } else if (this.finaleStage === 'ROOF_SETTLE') {
      this.cameraY += (this.panoramaRoofCamY - this.cameraY) * Math.min(1, dt * 6);
      if (this.finaleTimer >= 0.55) {
        this.finaleStage = 'PANORAMA_DOWN';
        this.finaleTimer = 0;
        this.panoramaStartCamY = this.cameraY;
        this.emitHud();
      }
    } else if (this.finaleStage === 'PANORAMA_DOWN') {
      const t = clamp(this.finaleTimer / this.panoramaDownDuration, 0, 1);
      const eased = easeInOutCubic(t);
      this.cameraZoom = 1.0;
      this.cameraY = lerp(this.panoramaStartCamY, this.panoramaBaseCamY, eased);

      // Update country backdrop smoothly to reflect the tower tier passing the camera
      const approxIdx = clamp(
        Math.floor((this.cameraY + BLOCK_HEIGHT) / BLOCK_HEIGHT),
        0,
        this.stack.length - 1
      );
      this.transitionBackdrop(this.stack[approxIdx].towerStyle);

      if (t >= 1) {
        this.finaleStage = 'ZOOM_OUT_FIT';
        this.finaleTimer = 0;
        this.emitHud();
      }
    } else if (this.finaleStage === 'ZOOM_OUT_FIT') {
      const duration = 0.9;
      const t = clamp(this.finaleTimer / duration, 0, 1);
      const eased = easeInOutCubic(t);
      this.cameraY = lerp(this.panoramaBaseCamY, this.panoramaFitCamY, eased);
      this.cameraZoom = lerp(1.0, this.panoramaFitZoom, eased);

      if (t >= 1) {
        this.finaleStage = 'FINAL_HOLD';
        this.finaleTimer = 0;
      }
    } else if (this.finaleStage === 'FINAL_HOLD') {
      if (this.finaleTimer >= 0.5) {
        this.finaleStage = 'NONE';
        this.gameState = 'GAME_OVER';
        this.emitHud();
      }
    }
  }

  private resolveDropLanding(topBlock: StackedBlock, towerTopY: number): void {
    const dropLeft = this.dropX;
    const dropRight = this.dropX + this.activeWidth;
    const targetLeft = topBlock.x;
    const targetRight = topBlock.x + topBlock.width;

    const delta = dropLeft - targetLeft;
    const isPerfect = Math.abs(delta) <= PERFECT_TOLERANCE;

    const overlapLeft = Math.max(dropLeft, targetLeft);
    const overlapRight = Math.min(dropRight, targetRight);
    const overlapWidth = overlapRight - overlapLeft;

    const landedFloor = this.score + 1;

    // 1. Complete Miss -> Begin Roof-Cap & Panorama Finale
    if (!isPerfect && overlapWidth <= 0.6) {
      const centerX = dropLeft + this.activeWidth / 2;
      const targetCenter = targetLeft + topBlock.width / 2;
      const dir = centerX >= targetCenter ? 1 : -1;

      this.fallingPieces.push({
        x: centerX,
        y: towerTopY + BLOCK_HEIGHT / 2,
        width: this.activeWidth,
        height: BLOCK_HEIGHT,
        vx: dir * 75,
        vy: -Math.min(this.dropVy * 0.45, 320),
        angle: 0,
        vAngle: dir * 2.8,
        alpha: 1,
        towerStyle: this.activeTowerStyle,
        floor: landedFloor,
      });

      this.shakeIntensity = 9;
      this.audio.playGameOver();
      this.beginTowerFinale();
      return;
    }

    // 2. Successful Stack
    let finalX = overlapLeft;
    let finalWidth = overlapWidth;

    if (isPerfect) {
      finalX = targetLeft;
      finalWidth = topBlock.width;
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.perfectCount += 1;
      this.lastOverlapRatio = 1;

      this.hitstopTimer = 0.036;
      this.shakeIntensity = 2.2;
      this.alignmentPulses.push({
        x: finalX,
        y: towerTopY,
        width: finalWidth,
        life: 0,
        maxLife: 0.48,
        color: '#C59B27',
      });

      this.spawnDustBurst(finalX, towerTopY, '#C59B27', 8);
      this.spawnDustBurst(finalX + finalWidth, towerTopY, '#C59B27', 8);

      this.floatingCallouts.push({
        x: finalX + finalWidth / 2,
        y: towerTopY + BLOCK_HEIGHT + 18,
        text: this.combo > 1 ? `PERFECT ×${this.combo}` : 'PERFECT',
        life: 0,
        maxLife: 0.9,
        color: '#9A7412',
      });

      this.audio.playPerfect(this.combo);
    } else {
      this.combo = 0;
      this.lastOverlapRatio = clamp(finalWidth / this.initialWidth, 0, 1);

      if (dropLeft < targetLeft) {
        const cutWidth = targetLeft - dropLeft;
        this.fallingPieces.push({
          x: dropLeft + cutWidth / 2,
          y: towerTopY + BLOCK_HEIGHT / 2,
          width: cutWidth,
          height: BLOCK_HEIGHT,
          vx: -68 - Math.random() * 40,
          vy: -110,
          angle: 0,
          vAngle: -2.4 - Math.random() * 1.4,
          alpha: 1,
          towerStyle: this.activeTowerStyle,
          floor: landedFloor,
        });
        this.sliceFlashes.push({
          x: targetLeft,
          y: towerTopY,
          height: BLOCK_HEIGHT,
          life: 0,
          maxLife: 0.28,
        });
        this.spawnDustBurst(targetLeft, towerTopY + BLOCK_HEIGHT / 2, '#D94E28', 7);
      }

      if (dropRight > targetRight) {
        const cutWidth = dropRight - targetRight;
        this.fallingPieces.push({
          x: targetRight + cutWidth / 2,
          y: towerTopY + BLOCK_HEIGHT / 2,
          width: cutWidth,
          height: BLOCK_HEIGHT,
          vx: 68 + Math.random() * 40,
          vy: -110,
          angle: 0,
          vAngle: 2.4 + Math.random() * 1.4,
          alpha: 1,
          towerStyle: this.activeTowerStyle,
          floor: landedFloor,
        });
        this.sliceFlashes.push({
          x: targetRight,
          y: towerTopY,
          height: BLOCK_HEIGHT,
          life: 0,
          maxLife: 0.28,
        });
        this.spawnDustBurst(targetRight, towerTopY + BLOCK_HEIGHT / 2, '#D94E28', 7);
      }

      this.shakeIntensity = 2.8;
      this.audio.playLand(landedFloor);
      this.audio.playSlice();
    }

    this.stack.push({
      x: finalX,
      y: towerTopY,
      width: finalWidth,
      height: BLOCK_HEIGHT,
      floor: landedFloor,
      towerStyle: this.activeTowerStyle,
      wasPerfect: isPerfect,
    });

    this.score = landedFloor;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.isNewRecord = true;
      this.saveBestScore(this.bestScore);
    }

    const nextFloor = landedFloor + 1;
    const prevStyle = this.activeTowerStyle;
    const nextStyle = resolveTowerStyle(this.towerPreset, nextFloor);

    if (this.towerPreset === 'world_tour' && nextStyle !== prevStyle) {
      const label = TOWER_STYLE_LABELS[nextStyle];
      this.floatingCallouts.push({
        x: finalX + finalWidth / 2,
        y: towerTopY + BLOCK_HEIGHT + 40,
        text: `${label.name} · ${label.city}`,
        life: 0,
        maxLife: 1.35,
        color: getTowerAccentColor(nextStyle),
      });
    }

    this.transitionBackdrop(nextStyle);

    this.targetCameraY = towerTopY + BLOCK_HEIGHT;
    this.activeWidth = finalWidth;
    this.activeTowerStyle = nextStyle;
    this.angularSpeed = this.computeAngularSpeed(landedFloor);
    this.pendulumPhase = landedFloor % 2 === 0 ? -Math.PI / 2 : Math.PI / 2;
    this.pendulumTheta = this.getMaxSwingAngle() * Math.sin(this.pendulumPhase);
    this.activePhase = 'SWINGING';

    this.emitHud();
  }

  private spawnDustBurst(worldX: number, worldY: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 130;
      this.particles.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 60,
        size: 2 + Math.random() * 2.5,
        alpha: 1,
        life: 0,
        maxLife: 0.28 + Math.random() * 0.22,
        color,
      });
    }
  }

  private worldToScreenX(worldX: number): number {
    return this.towerCenterScreenX + worldX + this.shakeOffsetX;
  }

  private worldToScreenY(worldY: number, targetTowerScreenY: number): number {
    return targetTowerScreenY - (worldY - this.cameraY) + this.shakeOffsetY;
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    const { targetTowerScreenY, pivotScreenY, pivotWorldY } = this.getLayoutMetrics();

    // 1. Atmospheric drafting sky transitioning subtly with altitude
    const altitudeFactor = clamp(this.score / 50, 0, 1);
    const bgTop = lerpHexColor('#F4F3EF', '#DCE4EE', altitudeFactor);
    const bgBottom = lerpHexColor('#ECEAE3', '#EAECEF', altitudeFactor);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.viewH);
    bgGrad.addColorStop(0, bgTop);
    bgGrad.addColorStop(1, bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    // 2. Subtle Cultural & Scenic Country Backdrops (with smooth crossfade)
    if (this.backdropBlend < 1) {
      drawCountryBackdrop(
        ctx,
        this.prevBackdropStyle,
        this.viewW,
        this.viewH,
        this.cameraY,
        this.idleTime,
        1 - this.backdropBlend
      );
    }
    drawCountryBackdrop(
      ctx,
      this.backdropStyle,
      this.viewW,
      this.viewH,
      this.cameraY,
      this.idleTime,
      this.backdropBlend
    );

    // 3. Zoomable World Space (scales cleanly during Panorama Review)
    ctx.save();
    if (this.cameraZoom !== 1) {
      const anchorX = this.towerCenterScreenX + this.shakeOffsetX;
      const anchorY = targetTowerScreenY + this.shakeOffsetY;
      ctx.translate(anchorX, anchorY);
      ctx.scale(this.cameraZoom, this.cameraZoom);
      ctx.translate(-anchorX, -anchorY);
    }

    this.renderElevationGrid(ctx, targetTowerScreenY);
    this.renderFoundationPlinth(ctx, targetTowerScreenY);
    this.renderStackedTower(ctx, targetTowerScreenY);

    if (this.roofVisible) {
      this.renderCappedRoof(ctx, targetTowerScreenY);
    }

    this.renderAlignmentPulses(ctx, targetTowerScreenY);
    this.renderFallingPieces(ctx, targetTowerScreenY);

    if (this.gameState === 'TITLE_MENU' || this.gameState === 'PLAYING' || this.gameState === 'PAUSED') {
      this.renderPendulumAndActiveBlock(ctx, targetTowerScreenY, pivotScreenY, pivotWorldY);
    }

    this.renderSliceFlashes(ctx, targetTowerScreenY);
    this.renderParticles(ctx, targetTowerScreenY);
    this.renderFloatingCallouts(ctx, targetTowerScreenY);

    ctx.restore();
    ctx.restore();
  }

  private renderElevationGrid(ctx: CanvasRenderingContext2D, targetTowerScreenY: number): void {
    const axisX = Math.round(this.worldToScreenX(0)) + 0.5;
    const z = Math.max(0.2, this.cameraZoom);
    const halfSpanW = (this.viewW * 0.5) / z;
    const topWorldY = this.cameraY + targetTowerScreenY / z + 120;
    const bottomWorldY = this.cameraY - (this.viewH - targetTowerScreenY) / z - 120;

    ctx.save();
    ctx.strokeStyle = 'rgba(30, 36, 43, 0.045)';
    ctx.lineWidth = 1 / z;
    ctx.setLineDash([4 / z, 6 / z]);
    ctx.beginPath();
    ctx.moveTo(axisX, this.worldToScreenY(topWorldY, targetTowerScreenY));
    ctx.lineTo(axisX, this.worldToScreenY(bottomWorldY, targetTowerScreenY));
    ctx.stroke();
    ctx.setLineDash([]);

    const step = z < 0.55 ? 10 : 5;
    const minFloor = Math.max(step, Math.floor(bottomWorldY / BLOCK_HEIGHT / step) * step);
    const maxFloor = Math.ceil(topWorldY / BLOCK_HEIGHT / step) * step;

    const fontSize = Math.round(11 / Math.sqrt(z));
    ctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'middle';

    const leftX = this.towerCenterScreenX - halfSpanW + 24 / z;
    const rightX = this.towerCenterScreenX + halfSpanW - 24 / z;

    for (let f = minFloor; f <= maxFloor; f += step) {
      const worldY = f * BLOCK_HEIGHT;
      const sy = Math.round(this.worldToScreenY(worldY, targetTowerScreenY)) + 0.5;

      const isMajor = f % 10 === 0;
      ctx.strokeStyle = isMajor ? 'rgba(30, 36, 43, 0.08)' : 'rgba(30, 36, 43, 0.04)';
      ctx.beginPath();
      ctx.moveTo(leftX, sy);
      ctx.lineTo(rightX, sy);
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = 'rgba(30, 36, 43, 0.28)';
        ctx.textAlign = 'right';
        ctx.fillText(`${f}F`, rightX - 4 / z, sy - 9 / z);
      }
    }
    ctx.restore();
  }

  private renderFoundationPlinth(ctx: CanvasRenderingContext2D, targetTowerScreenY: number): void {
    const plinthWidth = this.initialWidth + 48;
    const plinthX = this.worldToScreenX(-plinthWidth / 2);
    const plinthTopY = this.worldToScreenY(-BLOCK_HEIGHT, targetTowerScreenY);
    const plinthHeight = Math.max(400, (this.viewH - plinthTopY) / Math.max(0.2, this.cameraZoom) + 400);

    ctx.save();
    ctx.fillStyle = '#D5D1C8';
    ctx.fillRect(plinthX, plinthTopY, plinthWidth, plinthHeight);

    ctx.fillStyle = '#C3BEB3';
    ctx.fillRect(plinthX, plinthTopY, plinthWidth, 7);

    ctx.fillStyle = 'rgba(30, 36, 43, 0.34)';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0.00m', plinthX + plinthWidth / 2, plinthTopY + 22);

    ctx.strokeStyle = 'rgba(30, 36, 43, 0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(plinthX + 0.5, plinthTopY + 0.5, plinthWidth - 1, plinthHeight);
    ctx.restore();
  }

  private renderStackedTower(ctx: CanvasRenderingContext2D, targetTowerScreenY: number): void {
    const z = Math.max(0.2, this.cameraZoom);
    const minVisibleSY = targetTowerScreenY - targetTowerScreenY / z - 120;
    const maxVisibleSY = targetTowerScreenY + (this.viewH - targetTowerScreenY) / z + 120;

    for (let i = 0; i < this.stack.length; i++) {
      const b = this.stack[i];
      const sx = this.worldToScreenX(b.x);
      const sy = this.worldToScreenY(b.y + b.height, targetTowerScreenY);

      if (sy > maxVisibleSY || sy + b.height < minVisibleSY) continue;

      drawWorldTowerBlock(
        ctx,
        b.towerStyle,
        sx,
        sy,
        b.width,
        b.height,
        b.floor,
        b.wasPerfect
      );
    }
  }

  private renderCappedRoof(ctx: CanvasRenderingContext2D, targetTowerScreenY: number): void {
    const topBlock = this.stack[this.stack.length - 1];
    if (!topBlock) return;

    const sx = this.worldToScreenX(topBlock.x);
    const baseY = this.worldToScreenY(
      topBlock.y + topBlock.height + this.roofOffsetY,
      targetTowerScreenY
    );

    if (this.finaleStage === 'CAPPING_ROOF' && this.roofOffsetY > 4) {
      const roofH = getRoofHeight(this.roofStyle, topBlock.width);
      const cx = sx + topBlock.width / 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(217, 78, 40, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, baseY - roofH);
      ctx.stroke();
      ctx.restore();
    }

    drawWorldTowerRoof(ctx, this.roofStyle, sx, baseY, topBlock.width);
  }

  private renderPendulumAndActiveBlock(
    ctx: CanvasRenderingContext2D,
    targetTowerScreenY: number,
    pivotScreenY: number,
    pivotWorldY: number
  ): void {
    ctx.save();
    const pivotScreenX = this.worldToScreenX(0);

    const railHalfSpan = Math.min(this.viewW * 0.36, 220);
    ctx.strokeStyle = 'rgba(30, 36, 43, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotScreenX - railHalfSpan, pivotScreenY);
    ctx.lineTo(pivotScreenX + railHalfSpan, pivotScreenY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(30, 36, 43, 0.25)';
    ctx.fillRect(pivotScreenX - railHalfSpan - 1, pivotScreenY - 4, 2, 8);
    ctx.fillRect(pivotScreenX + railHalfSpan - 1, pivotScreenY - 4, 2, 8);

    const activeFloor = this.gameState === 'TITLE_MENU' ? 3 : this.score + 1;

    if (this.activePhase === 'SWINGING') {
      const { clampX, clampWorldY, blockCenterX, blockBottomWorldY } =
        this.getSwingBlockWorldPosition();

      const clampSX = this.worldToScreenX(clampX);
      const clampSY = this.worldToScreenY(clampWorldY, targetTowerScreenY);
      const blockSX = this.worldToScreenX(blockCenterX - this.activeWidth / 2);
      const blockSY = this.worldToScreenY(blockBottomWorldY + BLOCK_HEIGHT, targetTowerScreenY);

      const { cableLength } = this.getLayoutMetrics();
      const maxAngle = this.getMaxSwingAngle();
      ctx.strokeStyle = 'rgba(30, 36, 43, 0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(
        pivotScreenX,
        this.worldToScreenY(pivotWorldY, targetTowerScreenY),
        cableLength,
        Math.PI / 2 - maxAngle,
        Math.PI / 2 + maxAngle
      );
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#333D4B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pivotScreenX, pivotScreenY);
      ctx.lineTo(clampSX, clampSY);
      ctx.stroke();

      ctx.fillStyle = '#1E242B';
      ctx.beginPath();
      ctx.arc(pivotScreenX, pivotScreenY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#D94E28';
      ctx.beginPath();
      ctx.arc(pivotScreenX, pivotScreenY, 2, 0, Math.PI * 2);
      ctx.fill();

      drawWorldTowerBlock(
        ctx,
        this.activeTowerStyle,
        blockSX,
        blockSY,
        this.activeWidth,
        BLOCK_HEIGHT,
        activeFloor,
        false
      );

      ctx.fillStyle = '#D94E28';
      ctx.fillRect(clampSX - 4, clampSY - 4, 8, 5);
      ctx.fillRect(clampSX - 1, clampSY + 1, 2, 5);
    } else if (this.activePhase === 'DROPPING') {
      ctx.fillStyle = '#1E242B';
      ctx.beginPath();
      ctx.arc(pivotScreenX, pivotScreenY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      const blockSX = this.worldToScreenX(this.dropX);
      const blockSY = this.worldToScreenY(this.dropBottomY + BLOCK_HEIGHT, targetTowerScreenY);

      const trailGrad = ctx.createLinearGradient(0, blockSY - 34, 0, blockSY);
      trailGrad.addColorStop(0, 'rgba(30, 36, 43, 0)');
      trailGrad.addColorStop(1, 'rgba(30, 36, 43, 0.12)');
      ctx.fillStyle = trailGrad;
      ctx.fillRect(blockSX, blockSY - 34, this.activeWidth, 34);

      drawWorldTowerBlock(
        ctx,
        this.activeTowerStyle,
        blockSX,
        blockSY,
        this.activeWidth,
        BLOCK_HEIGHT,
        activeFloor,
        false
      );
    }

    ctx.restore();
  }

  private renderFallingPieces(ctx: CanvasRenderingContext2D, targetTowerScreenY: number): void {
    ctx.save();
    for (const p of this.fallingPieces) {
      const sx = this.worldToScreenX(p.x);
      const sy = this.worldToScreenY(p.y, targetTowerScreenY);

      ctx.save();
      ctx.globalAlpha = clamp(p.alpha, 0, 1);
      ctx.translate(sx, sy);
      ctx.rotate(p.angle);
      drawWorldTowerBlock(
        ctx,
        p.towerStyle,
        -p.width / 2,
        -p.height / 2,
        p.width,
        p.height,
        p.floor,
        false
      );
      ctx.restore();
    }
    ctx.restore();
  }

  private renderAlignmentPulses(ctx: CanvasRenderingContext2D, targetTowerScreenY: number): void {
    ctx.save();
    for (const pulse of this.alignmentPulses) {
      const progress = pulse.life / pulse.maxLife;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const alpha = (1 - progress) * 0.85;
      const expand = easeOut * 46;

      const sx = this.worldToScreenX(pulse.x) - expand;
      const sy = this.worldToScreenY(pulse.y, targetTowerScreenY);
      const w = pulse.width + expand * 2;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = pulse.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + w, sy);
      ctx.stroke();

      ctx.fillStyle = pulse.color;
      ctx.fillRect(this.worldToScreenX(pulse.x) - 2, sy - 4, 2, 8);
      ctx.fillRect(this.worldToScreenX(pulse.x + pulse.width), sy - 4, 2, 8);
    }
    ctx.restore();
  }

  private renderSliceFlashes(ctx: CanvasRenderingContext2D, targetTowerScreenY: number): void {
    ctx.save();
    for (const flash of this.sliceFlashes) {
      const progress = flash.life / flash.maxLife;
      const sx = this.worldToScreenX(flash.x);
      const sy = this.worldToScreenY(flash.y + flash.height, targetTowerScreenY);
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = '#D94E28';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 10);
      ctx.lineTo(sx, sy + flash.height + 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D, targetTowerScreenY: number): void {
    ctx.save();
    for (const pt of this.particles) {
      const sx = this.worldToScreenX(pt.x);
      const sy = this.worldToScreenY(pt.y, targetTowerScreenY);
      ctx.globalAlpha = clamp(pt.alpha, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.fillRect(sx - pt.size / 2, sy - pt.size / 2, pt.size, pt.size);
    }
    ctx.restore();
  }

  private renderFloatingCallouts(ctx: CanvasRenderingContext2D, targetTowerScreenY: number): void {
    ctx.save();
    ctx.font = '700 13px "JetBrains Mono", "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const c of this.floatingCallouts) {
      const progress = c.life / c.maxLife;
      const alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
      const sx = this.worldToScreenX(c.x);
      const sy = this.worldToScreenY(c.y, targetTowerScreenY);

      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, sx, sy);
    }
    ctx.restore();
  }

  private getHudFinalePhase(): HudSnapshot['finalePhase'] {
    if (this.gameState !== 'TOWER_FINALE') return 'NONE';
    if (
      this.finaleStage === 'MISSED_FALL' ||
      this.finaleStage === 'CAPPING_ROOF' ||
      this.finaleStage === 'ROOF_SETTLE'
    ) {
      return 'CAPPING';
    }
    if (this.finaleStage === 'PANORAMA_DOWN') {
      return 'PANORAMA';
    }
    return 'ZOOM_OUT';
  }

  private emitHud(): void {
    this.onHudChange({
      gameState: this.gameState,
      score: this.score,
      bestScore: this.bestScore,
      combo: this.combo,
      maxCombo: this.maxCombo,
      perfectCount: this.perfectCount,
      isNewRecord: this.isNewRecord,
      isMuted: this.audio.isMuted(),
      lastOverlapRatio: this.lastOverlapRatio,
      towerPreset: this.towerPreset,
      currentTowerStyle: this.activeTowerStyle,
      finalePhase: this.getHudFinalePhase(),
    });
  }
}
