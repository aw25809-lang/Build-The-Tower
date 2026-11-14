export type TowerStyleId =
  | 'taipei_101'
  | 'eiffel'
  | 'pisa'
  | 'big_ben'
  | 'skytree'
  | 'burj_khalifa';

export type TowerPresetId = 'world_tour' | TowerStyleId;

export interface TowerPresetMeta {
  id: TowerPresetId;
  name: string;
  subtitle: string;
}

export const TOWER_PRESETS: TowerPresetMeta[] = [
  { id: 'world_tour', name: '世界巡禮', subtitle: '攀升切換各國名塔' },
  { id: 'taipei_101', name: '台北 101', subtitle: '台北 · 竹節玻璃帷幕' },
  { id: 'eiffel', name: '艾菲爾鐵塔', subtitle: '巴黎 · 鏤空鍛鐵桁架' },
  { id: 'pisa', name: '比薩斜塔', subtitle: '比薩 · 羅馬大理石拱廊' },
  { id: 'big_ben', name: '大笨鐘', subtitle: '倫敦 · 哥德石灰岩鐘樓' },
  { id: 'skytree', name: '東京晴空塔', subtitle: '東京 · 鋼骨網格觀景台' },
  { id: 'burj_khalifa', name: '哈里發塔', subtitle: '杜拜 · 階梯銀藍尖塔' },
];

export const TOWER_STYLE_LABELS: Record<TowerStyleId, { name: string; city: string; color: string }> = {
  pisa: { name: '比薩斜塔', city: '義大利', color: '#8C7D65' },
  big_ben: { name: '大笨鐘', city: '英國', color: '#9E8259' },
  eiffel: { name: '艾菲爾鐵塔', city: '法國', color: '#4A3E36' },
  taipei_101: { name: '台北 101', city: '台灣', color: '#3A6B6C' },
  skytree: { name: '東京晴空塔', city: '日本', color: '#4B5E73' },
  burj_khalifa: { name: '哈里發塔', city: '杜拜', color: '#456782' },
};

const WORLD_TOUR_SEQUENCE: TowerStyleId[] = [
  'pisa',
  'big_ben',
  'eiffel',
  'taipei_101',
  'skytree',
  'burj_khalifa',
];

export function resolveTowerStyle(preset: TowerPresetId, floor: number): TowerStyleId {
  if (preset !== 'world_tour') {
    return preset;
  }
  const tier = Math.floor(Math.max(0, floor) / 4);
  return WORLD_TOUR_SEQUENCE[tier % WORLD_TOUR_SEQUENCE.length];
}

export function getTowerAccentColor(style: TowerStyleId): string {
  return TOWER_STYLE_LABELS[style].color;
}

export function drawWorldTowerBlock(
  ctx: CanvasRenderingContext2D,
  style: TowerStyleId,
  sx: number,
  sy: number,
  width: number,
  height: number,
  floor: number,
  wasPerfect = false
): void {
  if (width <= 0.4 || height <= 0.4) return;

  ctx.save();

  switch (style) {
    case 'taipei_101':
      drawTaipei101Block(ctx, sx, sy, width, height, floor);
      break;
    case 'eiffel':
      drawEiffelBlock(ctx, sx, sy, width, height, floor);
      break;
    case 'pisa':
      drawPisaBlock(ctx, sx, sy, width, height, floor);
      break;
    case 'big_ben':
      drawBigBenBlock(ctx, sx, sy, width, height, floor);
      break;
    case 'skytree':
      drawSkytreeBlock(ctx, sx, sy, width, height, floor);
      break;
    case 'burj_khalifa':
      drawBurjKhalifaBlock(ctx, sx, sy, width, height, floor);
      break;
  }

  // Perfect alignment subtle gold edge markers
  if (wasPerfect && width >= 6) {
    ctx.fillStyle = '#C59B27';
    ctx.fillRect(sx, sy + 3, 2.5, height - 6);
    ctx.fillRect(sx + width - 2.5, sy + 3, 2.5, height - 6);
  }

  ctx.restore();
}

function drawTaipei101Block(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  width: number,
  height: number,
  floor: number
): void {
  const isTierBand = floor > 0 && floor % 4 === 0;
  const flare = width >= 22 ? Math.min(3.8, width * 0.04) : 0;

  // Upward-flaring bamboo module silhouette
  ctx.beginPath();
  ctx.moveTo(sx - flare, sy);
  ctx.lineTo(sx + width + flare, sy);
  ctx.lineTo(sx + width + flare * 0.5, sy + 5);
  ctx.lineTo(sx + width, sy + height);
  ctx.lineTo(sx, sy + height);
  ctx.lineTo(sx - flare * 0.5, sy + 5);
  ctx.closePath();

  const grad = ctx.createLinearGradient(sx, sy, sx + width, sy);
  grad.addColorStop(0, '#274A4D');
  grad.addColorStop(0.45, '#3E7174');
  grad.addColorStop(1, '#2B5154');
  ctx.fillStyle = grad;
  ctx.fill();

  // Clip interior details to silhouette
  ctx.save();
  ctx.clip();

  // Jade glass vertical mullions centered symmetrically
  if (width >= 16) {
    const step = 12;
    const center = sx + width / 2;
    ctx.fillStyle = 'rgba(176, 224, 224, 0.24)';
    for (let dx = step / 2; dx < width / 2 - 2; dx += step) {
      ctx.fillRect(center - dx - 0.5, sy + 4, 1, height - 6);
      ctx.fillRect(center + dx - 0.5, sy + 4, 1, height - 6);
    }
  }

  // Top eave highlight
  ctx.fillStyle = '#82B9BC';
  ctx.fillRect(sx - flare, sy, width + flare * 2, 2.5);

  // Structural bamboo band & bronze ruyi/coin medallion on every 4th floor
  if (isTierBand) {
    ctx.fillStyle = '#1D3437';
    ctx.fillRect(sx - flare, sy + height - 7, width + flare * 2, 7);

    if (width >= 32) {
      const cx = sx + width / 2;
      const cy = sy + height / 2 - 1;
      ctx.strokeStyle = '#C59B27';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#C59B27';
      ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
    }
  } else {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(sx, sy + height - 2, width, 2);
  }

  ctx.restore();

  // Crisp outer silhouette stroke
  ctx.strokeStyle = '#193235';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawEiffelBlock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  width: number,
  height: number,
  floor: number
): void {
  const isDeck = floor > 0 && floor % 4 === 0;
  const deckOverhang = isDeck && width >= 24 ? 3 : 0;

  // Semi-transparent warm wrought-iron interior so background sky shows through trusswork
  ctx.fillStyle = 'rgba(74, 62, 54, 0.16)';
  ctx.fillRect(sx, sy, width, height);

  // Top and bottom riveted girder beams
  ctx.fillStyle = '#3B312B';
  ctx.fillRect(sx - deckOverhang, sy, width + deckOverhang * 2, 4.5);
  ctx.fillStyle = '#6B5B50';
  ctx.fillRect(sx - deckOverhang, sy, width + deckOverhang * 2, 1.5);

  ctx.fillStyle = '#2B231E';
  ctx.fillRect(sx, sy + height - 3.5, width, 3.5);

  // Outer vertical iron columns
  const colW = Math.min(3, width * 0.25);
  ctx.fillStyle = '#4A3E36';
  ctx.fillRect(sx, sy, colW, height);
  ctx.fillRect(sx + width - colW, sy, colW, height);

  // X-bracing diagonal trusses inside the frame
  if (width >= 10) {
    const innerLeft = sx + colW * 0.5;
    const innerRight = sx + width - colW * 0.5;
    const innerW = innerRight - innerLeft;
    const cellCount = Math.max(1, Math.round(innerW / 20));
    const cellW = innerW / cellCount;
    const topY = sy + 4;
    const botY = sy + height - 3;

    ctx.strokeStyle = '#4A3E36';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < cellCount; i++) {
      const x1 = innerLeft + i * cellW;
      const x2 = x1 + cellW;
      ctx.moveTo(x1, topY);
      ctx.lineTo(x2, botY);
      ctx.moveTo(x2, topY);
      ctx.lineTo(x1, botY);
      if (i > 0) {
        ctx.moveTo(x1, topY);
        ctx.lineTo(x1, botY);
      }
    }
    ctx.stroke();

    // Subtle arched iron brace on deck levels
    if (isDeck && width >= 30) {
      ctx.fillStyle = '#3B312B';
      for (let x = sx - deckOverhang + 3; x < sx + width + deckOverhang - 2; x += 6) {
        ctx.fillRect(x, sy - 3, 1.2, 3);
      }
      ctx.fillRect(sx - deckOverhang, sy - 3.5, width + deckOverhang * 2, 1.2);
    }
  }
}

function drawPisaBlock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  width: number,
  height: number,
  _floor: number
): void {
  // Cylindrical Carrara marble shading
  const grad = ctx.createLinearGradient(sx, sy, sx + width, sy);
  grad.addColorStop(0, '#C7BFAEE0'.slice(0, 7));
  grad.addColorStop(0.28, '#EDE9DF');
  grad.addColorStop(0.65, '#E2DDD0');
  grad.addColorStop(1, '#BFB7A6');

  ctx.fillStyle = grad;
  ctx.fillRect(sx, sy, width, height);

  // Top projecting marble cornice & bottom plinth molding
  ctx.fillStyle = '#F5F2EA';
  ctx.fillRect(sx - 1, sy, width + 2, 4);
  ctx.fillStyle = 'rgba(94, 87, 75, 0.25)';
  ctx.fillRect(sx, sy + 4, width, 1.5);
  ctx.fillStyle = '#B5AD9B';
  ctx.fillRect(sx, sy + height - 3, width, 3);

  // Romanesque blind-arcade arches symmetrically placed across width
  if (width >= 16) {
    const center = sx + width / 2;
    const spacing = 14;
    const archW = 8;
    const archTop = sy + 7;
    const archBot = sy + height - 3.5;

    const drawArch = (cx: number) => {
      if (cx - archW / 2 < sx + 2 || cx + archW / 2 > sx + width - 2) return;
      ctx.fillStyle = '#6A6154';
      ctx.beginPath();
      ctx.arc(cx, archTop + archW / 2, archW / 2, Math.PI, 0);
      ctx.lineTo(cx + archW / 2, archBot);
      ctx.lineTo(cx - archW / 2, archBot);
      ctx.closePath();
      ctx.fill();

      // Slender marble column highlight
      ctx.fillStyle = '#F5F2EA';
      ctx.fillRect(cx - archW / 2 - 1.5, archTop + 2, 1.5, archBot - archTop - 2);
    };

    drawArch(center);
    for (let dx = spacing; dx < width / 2 - 4; dx += spacing) {
      drawArch(center - dx);
      drawArch(center + dx);
    }
  }

  ctx.strokeStyle = 'rgba(72, 65, 55, 0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(sx + 0.5, sy + 0.5, Math.max(0, width - 1), height - 1);
}

function drawBigBenBlock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  width: number,
  height: number,
  floor: number
): void {
  const isClockFloor = floor > 0 && floor % 4 === 0;

  // Neo-Gothic honey-limestone masonry
  const grad = ctx.createLinearGradient(sx, sy, sx + width, sy);
  grad.addColorStop(0, '#9E8258');
  grad.addColorStop(0.5, '#C5A97B');
  grad.addColorStop(1, '#987D54');

  ctx.fillStyle = grad;
  ctx.fillRect(sx, sy, width, height);

  // Dark Gothic slate cornice band
  ctx.fillStyle = '#2F363F';
  ctx.fillRect(sx, sy, width, 4);
  ctx.fillStyle = '#4B5563';
  ctx.fillRect(sx, sy, width, 1.5);

  ctx.fillStyle = 'rgba(47, 54, 63, 0.35)';
  ctx.fillRect(sx, sy + height - 2.5, width, 2.5);

  // Side corner limestone piers
  if (width >= 18) {
    ctx.fillStyle = '#D2BA90';
    ctx.fillRect(sx + 1, sy + 4, 3, height - 6.5);
    ctx.fillRect(sx + width - 4, sy + 4, 3, height - 6.5);
  }

  // Gothic lancet windows
  if (width >= 20) {
    const center = sx + width / 2;
    const spacing = 13;
    const drawLancet = (cx: number) => {
      if (isClockFloor && Math.abs(cx - center) < 14 && width >= 44) return;
      if (cx - 3 < sx + 5 || cx + 3 > sx + width - 5) return;

      ctx.fillStyle = '#2F363F';
      ctx.beginPath();
      ctx.moveTo(cx, sy + 6.5);
      ctx.lineTo(cx + 3, sy + 11);
      ctx.lineTo(cx + 3, sy + height - 5);
      ctx.lineTo(cx - 3, sy + height - 5);
      ctx.lineTo(cx - 3, sy + 11);
      ctx.closePath();
      ctx.fill();
    };

    drawLancet(center);
    for (let dx = spacing; dx < width / 2 - 6; dx += spacing) {
      drawLancet(center - dx);
      drawLancet(center + dx);
    }
  }

  // Iconic Clock Dial on every 4th floor
  if (isClockFloor && width >= 44) {
    const cx = sx + width / 2;
    const cy = sy + height / 2 + 1;
    const r = Math.min(10, height * 0.36);

    // Dark cast-iron bezel
    ctx.fillStyle = '#262C34';
    ctx.fillRect(cx - r - 2, cy - r - 2, (r + 2) * 2, (r + 2) * 2);

    // Illuminated cream dial
    ctx.fillStyle = '#FBF6E6';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#C59B27';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Clock hands
    ctx.strokeStyle = '#1E242B';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - r * 0.62);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.15);
    ctx.stroke();
  }
}

function drawSkytreeBlock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  width: number,
  height: number,
  floor: number
): void {
  const isTemboDeck = floor > 0 && floor % 5 === 0;
  const deckLip = isTemboDeck && width >= 26 ? 4 : 0;

  // Crisp steel-white core shell
  ctx.fillStyle = 'rgba(232, 238, 246, 0.85)';
  ctx.fillRect(sx, sy, width, height);

  // Diagonal steel diagrid trusses
  if (width >= 10) {
    const cellCount = Math.max(1, Math.round(width / 16));
    const cellW = width / cellCount;
    const topY = sy + 2;
    const botY = sy + height - 2;

    ctx.strokeStyle = '#53677E';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < cellCount; i++) {
      const x1 = sx + i * cellW;
      const mid = x1 + cellW / 2;
      const x2 = x1 + cellW;
      ctx.moveTo(x1, botY);
      ctx.lineTo(mid, topY);
      ctx.lineTo(x2, botY);
    }
    ctx.stroke();
  }

  // Top & bottom crisp steel rings
  ctx.fillStyle = '#3B4D61';
  ctx.fillRect(sx - deckLip, sy, width + deckLip * 2, 3.5);
  ctx.fillStyle = '#8FA4BC';
  ctx.fillRect(sx, sy + height - 2, width, 2);

  // Outer vertical steel chord
  ctx.strokeStyle = '#3B4D61';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(sx + 0.5, sy + 0.5, Math.max(0, width - 1), height - 1);

  // Tembo Observation Deck gallery band
  if (isTemboDeck && width >= 26) {
    ctx.fillStyle = '#2B3B4D';
    ctx.fillRect(sx - deckLip, sy + 4, width + deckLip * 2, 8);
    ctx.fillStyle = '#93C5FD';
    ctx.fillRect(sx - deckLip + 2, sy + 6.5, Math.max(0, width + deckLip * 2 - 4), 2.5);
    ctx.fillStyle = '#D94E28';
    ctx.fillRect(sx + width / 2 - 2, sy + 4, 4, 2);
  }
}

function drawBurjKhalifaBlock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  width: number,
  height: number,
  floor: number
): void {
  // Stepped silver-blue curtain wall with soaring vertical fins
  const grad = ctx.createLinearGradient(sx, sy, sx + width, sy);
  grad.addColorStop(0, '#3C546B');
  grad.addColorStop(0.35, '#5C7C99');
  grad.addColorStop(0.5, '#7698B5');
  grad.addColorStop(0.65, '#587895');
  grad.addColorStop(1, '#374D63');

  ctx.fillStyle = grad;
  ctx.fillRect(sx, sy, width, height);

  // Setback wing vertical ribs emphasizing multi-lobed spire
  if (width >= 20) {
    const wingStep = width * 0.22;
    ctx.fillStyle = 'rgba(226, 236, 246, 0.22)';
    ctx.fillRect(sx + wingStep, sy + 2, 2, height - 3);
    ctx.fillRect(sx + width - wingStep - 2, sy + 2, 2, height - 3);

    // Central high-rise core fin
    ctx.fillStyle = 'rgba(241, 245, 249, 0.38)';
    ctx.fillRect(sx + width / 2 - 1.5, sy + 2, 3, height - 3);
  }

  // Fine aluminum vertical mullions
  if (width >= 14) {
    const center = sx + width / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    for (let dx = 8; dx < width / 2 - 2; dx += 8) {
      ctx.fillRect(center - dx, sy + 3, 1, height - 5);
      ctx.fillRect(center + dx, sy + 3, 1, height - 5);
    }
  }

  // Brushed aluminum horizontal spandrel & shadow seam
  ctx.fillStyle = floor % 3 === 0 ? '#CBD5E1' : '#94A3B8';
  ctx.fillRect(sx, sy, width, 3);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.fillRect(sx, sy + height - 2, width, 2);
}

export function getRoofHeight(style: TowerStyleId, width: number): number {
  const wFactor = Math.max(0.55, Math.min(1.15, width / 160));
  switch (style) {
    case 'taipei_101':
      return Math.round(92 * wFactor);
    case 'eiffel':
      return Math.round(88 * wFactor);
    case 'pisa':
      return Math.round(52 * wFactor);
    case 'big_ben':
      return Math.round(86 * wFactor);
    case 'skytree':
      return Math.round(98 * wFactor);
    case 'burj_khalifa':
      return Math.round(104 * wFactor);
  }
}

/**
 * Draws the iconic architectural roof/spire crown resting cleanly on [sx, sx + width]
 * with its base edge aligned at `baseY`.
 */
export function drawWorldTowerRoof(
  ctx: CanvasRenderingContext2D,
  style: TowerStyleId,
  sx: number,
  baseY: number,
  width: number
): void {
  if (width <= 1) return;
  const roofH = getRoofHeight(style, width);
  const cx = sx + width / 2;

  ctx.save();

  switch (style) {
    case 'taipei_101': {
      // Stepped octagonal-feel pagoda crown + soaring needle spire
      const tier1H = roofH * 0.24;
      const tier2H = roofH * 0.20;
      const spireH = roofH - tier1H - tier2H;

      // Tier 1 trapezoidal pagoda base
      const w1 = width * 0.72;
      ctx.fillStyle = '#2B5154';
      ctx.beginPath();
      ctx.moveTo(cx - width / 2, baseY);
      ctx.lineTo(cx + width / 2, baseY);
      ctx.lineTo(cx + w1 / 2, baseY - tier1H);
      ctx.lineTo(cx - w1 / 2, baseY - tier1H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#82B9BC';
      ctx.fillRect(cx - w1 / 2 - 2, baseY - tier1H, w1 + 4, 2.5);

      // Tier 2 upper lantern base
      const w2 = width * 0.42;
      ctx.fillStyle = '#1E3A3D';
      ctx.beginPath();
      ctx.moveTo(cx - w1 * 0.42, baseY - tier1H);
      ctx.lineTo(cx + w1 * 0.42, baseY - tier1H);
      ctx.lineTo(cx + w2 / 2, baseY - tier1H - tier2H);
      ctx.lineTo(cx - w2 / 2, baseY - tier1H - tier2H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#C59B27';
      ctx.fillRect(cx - w2 / 2 - 1, baseY - tier1H - tier2H, w2 + 2, 2.5);

      // Needle spire
      const spireBaseW = Math.max(3, width * 0.10);
      ctx.fillStyle = '#2A4346';
      ctx.beginPath();
      ctx.moveTo(cx - spireBaseW / 2, baseY - tier1H - tier2H);
      ctx.lineTo(cx + spireBaseW / 2, baseY - tier1H - tier2H);
      ctx.lineTo(cx + 1, baseY - roofH);
      ctx.lineTo(cx - 1, baseY - roofH);
      ctx.closePath();
      ctx.fill();

      // Finial beacon
      ctx.fillStyle = '#D94E28';
      ctx.beginPath();
      ctx.arc(cx, baseY - roofH, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'eiffel': {
      // Tapered wrought-iron cupola & broadcast mast
      const bodyH = roofH * 0.56;
      const topW = Math.max(6, width * 0.24);

      ctx.fillStyle = 'rgba(74, 62, 54, 0.20)';
      ctx.beginPath();
      ctx.moveTo(cx - width / 2, baseY);
      ctx.lineTo(cx - topW / 2, baseY - bodyH);
      ctx.lineTo(cx + topW / 2, baseY - bodyH);
      ctx.lineTo(cx + width / 2, baseY);
      ctx.closePath();
      ctx.fill();

      // Diagonal iron lattice ribs
      ctx.strokeStyle = '#3B312B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - width / 2, baseY);
      ctx.lineTo(cx - topW / 2, baseY - bodyH);
      ctx.moveTo(cx + width / 2, baseY);
      ctx.lineTo(cx + topW / 2, baseY - bodyH);
      ctx.moveTo(cx - width / 2, baseY);
      ctx.lineTo(cx + topW / 2, baseY - bodyH);
      ctx.moveTo(cx + width / 2, baseY);
      ctx.lineTo(cx - topW / 2, baseY - bodyH);
      ctx.stroke();

      // Cupola ring
      ctx.fillStyle = '#2B231E';
      ctx.fillRect(cx - topW / 2 - 3, baseY - bodyH - 4, topW + 6, 4);

      // Spire antenna
      ctx.strokeStyle = '#3B312B';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - bodyH - 4);
      ctx.lineTo(cx, baseY - roofH);
      ctx.stroke();

      ctx.fillStyle = '#D94E28';
      ctx.beginPath();
      ctx.arc(cx, baseY - roofH, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'pisa': {
      // Iconic narrower cylindrical belfry chamber with arches + flat stone crown
      const belfryW = Math.max(12, width * 0.68);
      const belfryX = cx - belfryW / 2;
      const belfryH = roofH * 0.72;
      const belfryY = baseY - belfryH;

      // Stepped stone terrace base
      ctx.fillStyle = '#C7BFAE';
      ctx.fillRect(sx, baseY - 5, width, 5);
      ctx.fillStyle = '#F5F2EA';
      ctx.fillRect(sx - 1, baseY - 7, width + 2, 2.5);

      // Belfry marble cylinder
      const grad = ctx.createLinearGradient(belfryX, belfryY, belfryX + belfryW, belfryY);
      grad.addColorStop(0, '#C7BFAE');
      grad.addColorStop(0.35, '#EDE9DF');
      grad.addColorStop(1, '#BFB7A6');
      ctx.fillStyle = grad;
      ctx.fillRect(belfryX, belfryY, belfryW, belfryH - 5);

      // Belfry cornice cap
      ctx.fillStyle = '#F5F2EA';
      ctx.fillRect(belfryX - 2, belfryY - 4, belfryW + 4, 4);
      ctx.strokeStyle = 'rgba(72, 65, 55, 0.30)';
      ctx.lineWidth = 1;
      ctx.strokeRect(belfryX + 0.5, belfryY + 0.5, belfryW - 1, belfryH - 5.5);

      // Belfry bell-arch openings
      if (belfryW >= 24) {
        const archW = Math.min(10, belfryW * 0.22);
        const offsets = belfryW >= 46 ? [-belfryW * 0.24, 0, belfryW * 0.24] : [0];
        ctx.fillStyle = '#5E574B';
        for (const off of offsets) {
          const ax = cx + off;
          ctx.beginPath();
          ctx.arc(ax, belfryY + 12, archW / 2, Math.PI, 0);
          ctx.lineTo(ax + archW / 2, baseY - 7);
          ctx.lineTo(ax - archW / 2, baseY - 7);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Subtle bronze bell / finial tip
      ctx.fillStyle = '#8C7D65';
      ctx.fillRect(cx - 1.5, belfryY - 12, 3, 8);
      break;
    }

    case 'big_ben': {
      // Steep Neo-Gothic pyramidal slate spire + gilded finials
      const baseBandH = 8;
      const spireH = roofH - baseBandH;

      // Dark slate parapet with corner pinnacles
      ctx.fillStyle = '#2F363F';
      ctx.fillRect(sx, baseY - baseBandH, width, baseBandH);

      if (width >= 26) {
        // Gothic corner spirelets
        for (const px of [sx + 3, sx + width - 3]) {
          ctx.fillStyle = '#9E8258';
          ctx.beginPath();
          ctx.moveTo(px - 3, baseY - baseBandH);
          ctx.lineTo(px + 3, baseY - baseBandH);
          ctx.lineTo(px, baseY - baseBandH - 16);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Steep Gothic spire roof
      const spireBaseW = width * 0.78;
      ctx.fillStyle = '#283038';
      ctx.beginPath();
      ctx.moveTo(cx - spireBaseW / 2, baseY - baseBandH);
      ctx.lineTo(cx, baseY - roofH + 10);
      ctx.lineTo(cx + spireBaseW / 2, baseY - baseBandH);
      ctx.closePath();
      ctx.fill();

      // Subtle sunlit slate facet
      ctx.fillStyle = '#3B4550';
      ctx.beginPath();
      ctx.moveTo(cx - spireBaseW / 2, baseY - baseBandH);
      ctx.lineTo(cx, baseY - roofH + 10);
      ctx.lineTo(cx, baseY - baseBandH);
      ctx.closePath();
      ctx.fill();

      // Gilded crown finial & spire needle
      ctx.fillStyle = '#C59B27';
      ctx.fillRect(cx - 1.2, baseY - roofH, 2.4, 12);
      ctx.beginPath();
      ctx.arc(cx, baseY - roofH + 4, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'skytree': {
      // Sleek tapered steel diagrid crown + broadcast antenna mast
      const crownH = roofH * 0.48;
      const mastW = Math.max(4, width * 0.14);

      ctx.fillStyle = 'rgba(232, 238, 246, 0.90)';
      ctx.beginPath();
      ctx.moveTo(cx - width * 0.44, baseY);
      ctx.lineTo(cx - mastW / 2, baseY - crownH);
      ctx.lineTo(cx + mastW / 2, baseY - crownH);
      ctx.lineTo(cx + width * 0.44, baseY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#3B4D61';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Broadcast antenna mast with red/white aviation rings
      const mastX = cx - mastW / 4;
      const mastTopY = baseY - roofH;
      const mastBodyW = Math.max(3, mastW * 0.55);
      ctx.fillStyle = '#DCE3EB';
      ctx.fillRect(cx - mastBodyW / 2, mastTopY + 8, mastBodyW, roofH - crownH - 8);
      ctx.fillStyle = '#D94E28';
      ctx.fillRect(cx - mastBodyW / 2, mastTopY + 14, mastBodyW, 6);
      ctx.fillRect(cx - mastBodyW / 2, mastTopY + 28, mastBodyW, 5);

      ctx.strokeStyle = '#3B4D61';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, mastTopY + 8);
      ctx.lineTo(cx, mastTopY);
      ctx.stroke();
      ctx.fillStyle = '#D94E28';
      ctx.beginPath();
      ctx.arc(cx, mastTopY, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'burj_khalifa': {
      // Telescoping setback tiers into soaring silver needle spire
      const t1W = width * 0.68;
      const t2W = width * 0.40;
      const t3W = Math.max(6, width * 0.18);
      const stepH = roofH * 0.18;

      const tiers = [
        { w: t1W, y: baseY - stepH, h: stepH },
        { w: t2W, y: baseY - stepH * 2, h: stepH },
        { w: t3W, y: baseY - stepH * 3, h: stepH },
      ];

      tiers.forEach((tier, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#5C7C99' : '#7698B5';
        ctx.fillRect(cx - tier.w / 2, tier.y, tier.w, tier.h);
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(cx - tier.w / 2, tier.y, tier.w, 2);
      });

      // Soaring needle spire
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(cx - Math.max(2, t3W * 0.3), baseY - stepH * 3);
      ctx.lineTo(cx + Math.max(2, t3W * 0.3), baseY - stepH * 3);
      ctx.lineTo(cx + 0.8, baseY - roofH);
      ctx.lineTo(cx - 0.8, baseY - roofH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(cx, baseY - roofH, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

