import { TowerStyleId } from './towers';

/**
 * Renders subtle, low-opacity cultural & scenic landscape silhouettes
 * matched to each world tower's country, carefully positioned along the
 * distant horizon and edges so gameplay alignment remains crisp and unobstructed.
 */
export function drawCountryBackdrop(
  ctx: CanvasRenderingContext2D,
  style: TowerStyleId,
  viewW: number,
  viewH: number,
  cameraY: number,
  idleTime: number,
  opacity: number
): void {
  if (opacity <= 0.005) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Gentle vertical parallax so scenery drifts very slowly as tower climbs
  const parallaxY = Math.min(viewH * 0.12, Math.max(0, cameraY * 0.045));
  const horizonY = viewH * 0.82 + parallaxY * 0.5;

  switch (style) {
    case 'taipei_101':
      drawTaiwanBackdrop(ctx, viewW, viewH, horizonY, idleTime);
      break;
    case 'eiffel':
      drawFranceBackdrop(ctx, viewW, viewH, horizonY, idleTime);
      break;
    case 'pisa':
      drawItalyBackdrop(ctx, viewW, viewH, horizonY);
      break;
    case 'big_ben':
      drawUkBackdrop(ctx, viewW, viewH, horizonY);
      break;
    case 'skytree':
      drawJapanBackdrop(ctx, viewW, viewH, horizonY, idleTime);
      break;
    case 'burj_khalifa':
      drawDubaiBackdrop(ctx, viewW, viewH, horizonY);
      break;
  }

  ctx.restore();
}

function drawTaiwanBackdrop(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  horizonY: number,
  idleTime: number
): void {
  // Distant misty mountain ridges (Yangmingshan / Xiangshan silhouette)
  ctx.fillStyle = 'rgba(58, 107, 108, 0.10)';
  ctx.beginPath();
  ctx.moveTo(0, viewH);
  ctx.lineTo(0, horizonY - 36);
  ctx.quadraticCurveTo(viewW * 0.16, horizonY - 105, viewW * 0.34, horizonY - 48);
  ctx.quadraticCurveTo(viewW * 0.55, horizonY - 120, viewW * 0.78, horizonY - 52);
  ctx.quadraticCurveTo(viewW * 0.90, horizonY - 88, viewW, horizonY - 40);
  ctx.lineTo(viewW, viewH);
  ctx.closePath();
  ctx.fill();

  // Closer gentle foothills
  ctx.fillStyle = 'rgba(43, 81, 84, 0.08)';
  ctx.beginPath();
  ctx.moveTo(0, viewH);
  ctx.lineTo(0, horizonY - 10);
  ctx.quadraticCurveTo(viewW * 0.25, horizonY - 52, viewW * 0.5, horizonY - 16);
  ctx.quadraticCurveTo(viewW * 0.75, horizonY - 44, viewW, horizonY - 8);
  ctx.lineTo(viewW, viewH);
  ctx.closePath();
  ctx.fill();

  // Traditional swallowtail temple roof silhouette on distant left ridge
  const tx = viewW * 0.12;
  const ty = horizonY - 34;
  ctx.fillStyle = 'rgba(43, 81, 84, 0.14)';
  ctx.beginPath();
  ctx.moveTo(tx - 26, ty);
  ctx.quadraticCurveTo(tx, ty - 14, tx + 26, ty);
  ctx.lineTo(tx + 18, ty + 8);
  ctx.lineTo(tx - 18, ty + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(tx - 14, ty + 8, 28, 12);

  // Subtle floating Pingxi sky lanterns in calm corners
  const lanterns = [
    { x: viewW * 0.14, y: viewH * 0.34, phase: 0.4, scale: 1.0 },
    { x: viewW * 0.85, y: viewH * 0.28, phase: 1.9, scale: 0.82 },
    { x: viewW * 0.89, y: viewH * 0.45, phase: 3.1, scale: 0.68 },
  ];
  for (const l of lanterns) {
    const bob = Math.sin(idleTime * 0.8 + l.phase) * 7;
    const lx = l.x + Math.cos(idleTime * 0.4 + l.phase) * 4;
    const ly = l.y + bob;
    const w = 10 * l.scale;
    const h = 14 * l.scale;

    ctx.fillStyle = 'rgba(217, 78, 40, 0.14)';
    ctx.beginPath();
    ctx.moveTo(lx - w * 0.35, ly - h * 0.5);
    ctx.lineTo(lx + w * 0.35, ly - h * 0.5);
    ctx.lineTo(lx + w * 0.5, ly + h * 0.25);
    ctx.lineTo(lx + w * 0.25, ly + h * 0.5);
    ctx.lineTo(lx - w * 0.25, ly + h * 0.5);
    ctx.lineTo(lx - w * 0.5, ly + h * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(197, 155, 39, 0.22)';
    ctx.fillRect(lx - 1.5 * l.scale, ly + h * 0.32, 3 * l.scale, 2 * l.scale);
  }
}

function drawFranceBackdrop(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  horizonY: number,
  idleTime: number
): void {
  // Distant Montmartre hill & Sacré-Cœur dome silhouette on right
  const mx = viewW * 0.84;
  const my = horizonY - 30;
  ctx.fillStyle = 'rgba(74, 62, 54, 0.08)';
  ctx.beginPath();
  ctx.moveTo(viewW * 0.62, viewH);
  ctx.quadraticCurveTo(mx, horizonY - 68, viewW, horizonY - 12);
  ctx.lineTo(viewW, viewH);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(74, 62, 54, 0.11)';
  ctx.beginPath();
  ctx.arc(mx, my - 10, 10, Math.PI, 0);
  ctx.lineTo(mx + 14, my + 8);
  ctx.lineTo(mx - 14, my + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(mx - 1.5, my - 25, 3, 7);

  // Haussmann Parisian mansard rooftops along lower horizon
  ctx.fillStyle = 'rgba(74, 62, 54, 0.10)';
  const roofBlocks = [
    { x: 0, w: viewW * 0.16, h: 46 },
    { x: viewW * 0.16, w: viewW * 0.12, h: 38 },
    { x: viewW * 0.72, w: viewW * 0.13, h: 42 },
    { x: viewW * 0.85, w: viewW * 0.15, h: 52 },
  ];
  for (const b of roofBlocks) {
    const topY = horizonY - b.h;
    ctx.fillRect(b.x, topY + 10, b.w, viewH - topY);
    // Mansard trapezoid roof
    ctx.beginPath();
    ctx.moveTo(b.x + 5, topY);
    ctx.lineTo(b.x + b.w - 5, topY);
    ctx.lineTo(b.x + b.w, topY + 10);
    ctx.lineTo(b.x, topY + 10);
    ctx.closePath();
    ctx.fill();
  }

  // Seine stone arched bridge band at bottom
  ctx.fillStyle = 'rgba(59, 49, 43, 0.09)';
  const bridgeY = viewH - 36;
  ctx.fillRect(0, bridgeY, viewW, 36);
  ctx.fillStyle = '#F4F3EF';
  const arches = 5;
  const span = viewW / arches;
  for (let i = 0; i < arches; i++) {
    const cx = span * (i + 0.5);
    ctx.beginPath();
    ctx.arc(cx, viewH, Math.min(34, span * 0.34), Math.PI, 0);
    ctx.fill();
  }

  // Subtle distant Montgolfier hot-air balloon on upper-left
  const bx = viewW * 0.16 + Math.sin(idleTime * 0.35) * 6;
  const by = viewH * 0.30 + Math.cos(idleTime * 0.5) * 5;
  ctx.fillStyle = 'rgba(74, 62, 54, 0.12)';
  ctx.beginPath();
  ctx.arc(bx, by, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(bx - 3, by + 15, 6, 4);
  ctx.strokeStyle = 'rgba(74, 62, 54, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - 4, by + 9);
  ctx.lineTo(bx - 2, by + 15);
  ctx.moveTo(bx + 4, by + 9);
  ctx.lineTo(bx + 2, by + 15);
  ctx.stroke();
}

function drawItalyBackdrop(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  horizonY: number
): void {
  // Rolling Tuscan hills
  ctx.fillStyle = 'rgba(130, 118, 96, 0.10)';
  ctx.beginPath();
  ctx.moveTo(0, viewH);
  ctx.lineTo(0, horizonY - 22);
  ctx.quadraticCurveTo(viewW * 0.22, horizonY - 72, viewW * 0.48, horizonY - 26);
  ctx.quadraticCurveTo(viewW * 0.76, horizonY - 64, viewW, horizonY - 18);
  ctx.lineTo(viewW, viewH);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(110, 99, 80, 0.09)';
  ctx.beginPath();
  ctx.moveTo(0, viewH);
  ctx.lineTo(0, horizonY + 4);
  ctx.quadraticCurveTo(viewW * 0.35, horizonY - 36, viewW * 0.65, horizonY + 2);
  ctx.quadraticCurveTo(viewW * 0.86, horizonY - 28, viewW, horizonY + 8);
  ctx.lineTo(viewW, viewH);
  ctx.closePath();
  ctx.fill();

  // Slender Tuscan cypress tree silhouettes
  const cypresses = [
    { x: viewW * 0.10, y: horizonY - 34, h: 36 },
    { x: viewW * 0.13, y: horizonY - 38, h: 44 },
    { x: viewW * 0.16, y: horizonY - 30, h: 30 },
    { x: viewW * 0.87, y: horizonY - 28, h: 40 },
    { x: viewW * 0.90, y: horizonY - 24, h: 32 },
  ];
  ctx.fillStyle = 'rgba(84, 88, 72, 0.14)';
  for (const c of cypresses) {
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - c.h);
    ctx.quadraticCurveTo(c.x + 6, c.y - c.h * 0.35, c.x + 3.5, c.y);
    ctx.lineTo(c.x - 3.5, c.y);
    ctx.quadraticCurveTo(c.x - 6, c.y - c.h * 0.35, c.x, c.y - c.h);
    ctx.closePath();
    ctx.fill();
  }

  // Distant Pisa Duomo / Baptistery dome silhouette
  const dx = viewW * 0.81;
  const dy = horizonY - 18;
  ctx.fillStyle = 'rgba(130, 118, 96, 0.13)';
  ctx.beginPath();
  ctx.arc(dx, dy - 14, 16, Math.PI, 0);
  ctx.lineTo(dx + 22, dy + 16);
  ctx.lineTo(dx - 22, dy + 16);
  ctx.closePath();
  ctx.fill();
}

function drawUkBackdrop(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  horizonY: number
): void {
  // Distant London Eye wheel silhouette on left horizon
  const ex = viewW * 0.15;
  const ey = horizonY - 56;
  const er = 42;
  ctx.strokeStyle = 'rgba(47, 54, 63, 0.12)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(ex, ey, er, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + Math.cos(a) * er, ey + Math.sin(a) * er);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(ex - 16, horizonY);
  ctx.lineTo(ex, ey);
  ctx.lineTo(ex + 16, horizonY);
  ctx.stroke();

  // Distant Westminster Gothic spires on right horizon
  ctx.fillStyle = 'rgba(120, 102, 74, 0.11)';
  const spires = [viewW * 0.78, viewW * 0.83, viewW * 0.89];
  for (const sx of spires) {
    ctx.fillRect(sx - 6, horizonY - 28, 12, 34);
    ctx.beginPath();
    ctx.moveTo(sx, horizonY - 52);
    ctx.lineTo(sx + 6, horizonY - 28);
    ctx.lineTo(sx - 6, horizonY - 28);
    ctx.closePath();
    ctx.fill();
  }

  // Soft Thames mist & bridge arches
  ctx.fillStyle = 'rgba(47, 54, 63, 0.08)';
  ctx.fillRect(0, horizonY - 6, viewW, viewH - horizonY + 6);
  ctx.fillStyle = '#F4F3EF';
  const arches = 6;
  const span = viewW / arches;
  for (let i = 0; i < arches; i++) {
    const cx = span * (i + 0.5);
    ctx.beginPath();
    ctx.arc(cx, viewH, Math.min(30, span * 0.34), Math.PI, 0);
    ctx.fill();
  }
}

function drawJapanBackdrop(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  horizonY: number,
  idleTime: number
): void {
  // Iconic Mount Fuji silhouette on left/center-left horizon
  const fx = viewW * 0.22;
  const fy = horizonY + 8;
  const fw = Math.min(340, viewW * 0.52);
  const fh = Math.min(130, viewH * 0.20);

  ctx.fillStyle = 'rgba(75, 94, 115, 0.10)';
  ctx.beginPath();
  ctx.moveTo(fx - fw * 0.5, fy);
  ctx.quadraticCurveTo(fx - fw * 0.16, fy - fh * 0.45, fx - fw * 0.08, fy - fh);
  ctx.lineTo(fx + fw * 0.08, fy - fh);
  ctx.quadraticCurveTo(fx + fw * 0.16, fy - fh * 0.45, fx + fw * 0.5, fy);
  ctx.closePath();
  ctx.fill();

  // Snow cap highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.moveTo(fx - fw * 0.08, fy - fh);
  ctx.lineTo(fx + fw * 0.08, fy - fh);
  ctx.lineTo(fx + fw * 0.16, fy - fh * 0.68);
  ctx.lineTo(fx + fw * 0.06, fy - fh * 0.74);
  ctx.lineTo(fx, fy - fh * 0.65);
  ctx.lineTo(fx - fw * 0.07, fy - fh * 0.74);
  ctx.lineTo(fx - fw * 0.16, fy - fh * 0.68);
  ctx.closePath();
  ctx.fill();

  // Subtle Torii gate silhouette on right horizon
  const tx = viewW * 0.85;
  const ty = horizonY + 4;
  ctx.fillStyle = 'rgba(217, 78, 40, 0.13)';
  ctx.fillRect(tx - 16, ty - 28, 3.5, 30);
  ctx.fillRect(tx + 12.5, ty - 28, 3.5, 30);
  ctx.fillRect(tx - 22, ty - 31, 44, 3.5);
  ctx.fillRect(tx - 19, ty - 23, 38, 2.5);

  // Faint drifting sakura petals in upper corners
  ctx.fillStyle = 'rgba(217, 114, 128, 0.22)';
  for (let i = 0; i < 6; i++) {
    const px = ((viewW * (0.12 + i * 0.16) + idleTime * (12 + (i % 3) * 5)) % (viewW + 40)) - 20;
    const py = viewH * (0.18 + ((i * 0.13) % 0.4)) + Math.sin(idleTime * 1.4 + i) * 14;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(idleTime * 0.8 + i);
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.2, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawDubaiBackdrop(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  horizonY: number
): void {
  // Subtle desert crescent moon in upper-right calm sky
  const mx = viewW * 0.85;
  const my = viewH * 0.22;
  ctx.fillStyle = 'rgba(197, 155, 39, 0.16)';
  ctx.beginPath();
  ctx.arc(mx, my, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F4F3EF';
  ctx.beginPath();
  ctx.arc(mx + 6, my - 3, 13, 0, Math.PI * 2);
  ctx.fill();

  // Distant Burj Al Arab sail silhouette on left horizon
  const sx = viewW * 0.14;
  const sy = horizonY + 6;
  ctx.fillStyle = 'rgba(69, 103, 130, 0.11)';
  ctx.beginPath();
  ctx.moveTo(sx - 4, sy);
  ctx.lineTo(sx - 4, sy - 64);
  ctx.quadraticCurveTo(sx + 20, sy - 42, sx + 12, sy);
  ctx.closePath();
  ctx.fill();

  // Sweeping Arabian desert sand dunes
  ctx.fillStyle = 'rgba(181, 154, 114, 0.12)';
  ctx.beginPath();
  ctx.moveTo(0, viewH);
  ctx.lineTo(0, horizonY - 12);
  ctx.quadraticCurveTo(viewW * 0.28, horizonY - 46, viewW * 0.54, horizonY - 10);
  ctx.quadraticCurveTo(viewW * 0.80, horizonY - 38, viewW, horizonY - 6);
  ctx.lineTo(viewW, viewH);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(162, 134, 94, 0.10)';
  ctx.beginPath();
  ctx.moveTo(0, viewH);
  ctx.lineTo(0, horizonY + 12);
  ctx.quadraticCurveTo(viewW * 0.36, horizonY - 14, viewW * 0.68, horizonY + 14);
  ctx.quadraticCurveTo(viewW * 0.88, horizonY - 6, viewW, horizonY + 16);
  ctx.lineTo(viewW, viewH);
  ctx.closePath();
  ctx.fill();
}
