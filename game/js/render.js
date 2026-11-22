// render.js — VAULTBREAK's room renderer and vision geometry: the bank floor,
// walls, desks, plants, the golden vault door, vents, loot and the exit, plus
// the raycast helpers that clip every vision cone against the walls.

import { TILE, tileAt, blocksSight } from './levels.js';
import { drawFloorDecor, drawWallDecor } from './decor.js';

export const COLORS = {
  floor: '#141e36',
  floorAlt: '#18253f',
  wall: '#33477a',
  wallEdge: '#0e1730',
  wallTrim: 'rgba(255, 209, 102, 0.28)',
  desk: '#4a3421',
  deskEdge: '#2c1e12',
  plant: '#1f6b3a',
  gold: '#ffd166',
  goldDeep: '#c99327',
  exit: '#2ee6a8',
  alarm: '#ff4757',
};

export function lineOfSight(level, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const x = x0 + (x1 - x0) * (i / steps);
    const y = y0 + (y1 - y0) * (i / steps);
    if (blocksSight(level, Math.floor(x / TILE), Math.floor(y / TILE))) return false;
  }
  return true;
}

export function conePolygon(level, x, y, angle, halfAngle, range) {
  const rays = 26;
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    let d = range;
    const steps = Math.ceil(range / 6);
    for (let s = 1; s <= steps; s++) {
      const px = x + Math.cos(a) * s * 6;
      const py = y + Math.sin(a) * s * 6;
      if (blocksSight(level, Math.floor(px / TILE), Math.floor(py / TILE))) {
        d = s * 6;
        break;
      }
    }
    points.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return points;
}

export function drawCone(ctx, level, x, y, angle, halfAngle, range, rgb, alpha) {
  const poly = conePolygon(level, x, y, angle, halfAngle, range);
  const grad = ctx.createRadialGradient(x, y, 8, x, y, range);
  grad.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  grad.addColorStop(1, `rgba(${rgb}, ${alpha * 0.12})`);
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawRoom(ctx, level, time) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, level.width * TILE, level.height * TILE);
  for (let ty = 0; ty < level.height; ty++) {
    for (let tx = 0; tx < level.width; tx++) {
      const ch = tileAt(level, tx, ty);
      const x = tx * TILE, y = ty * TILE;
      if ((tx + ty) % 2 === 0 && ch !== '#') {
        ctx.fillStyle = COLORS.floorAlt;
        ctx.fillRect(x, y, TILE, TILE);
      }
      if (ch === 'a' || ch === 'b') drawVent(ctx, x, y, time);
      if (ch === 'E') drawExit(ctx, x, y, level.exitOpen, time);
    }
  }
  ctx.strokeStyle = 'rgba(120, 150, 220, 0.05)';
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= level.width; tx++) {
    ctx.beginPath(); ctx.moveTo(tx * TILE, 0); ctx.lineTo(tx * TILE, level.height * TILE); ctx.stroke();
  }
  for (let ty = 0; ty <= level.height; ty++) {
    ctx.beginPath(); ctx.moveTo(0, ty * TILE); ctx.lineTo(level.width * TILE, ty * TILE); ctx.stroke();
  }
  drawFloorDecor(ctx, level);
}

export function drawFurniture(ctx, level) {
  for (let ty = 0; ty < level.height; ty++) {
    for (let tx = 0; tx < level.width; tx++) {
      const ch = tileAt(level, tx, ty);
      const x = tx * TILE, y = ty * TILE;
      if (ch === 'D') drawDesk(ctx, x, y);
      else if (ch === 'p') drawPlant(ctx, x, y);
      else if (ch === 'V') drawVaultDoor(ctx, x, y);
      else if (ch === '#') drawWall(ctx, x, y);
    }
  }
  drawWallDecor(ctx, level);
}

function drawWall(ctx, x, y) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(x, y, TILE, 5);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(x, y + TILE - 3, TILE, 3);
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
}

function drawDesk(ctx, x, y) {
  // Chair tucked behind the desk.
  ctx.fillStyle = '#241812';
  roundRect(ctx, x + 12, y + 31, 16, 8, 3);
  ctx.fill();
  ctx.fillStyle = '#31231a';
  roundRect(ctx, x + 14, y + 28, 12, 5, 2);
  ctx.fill();
  ctx.fillStyle = COLORS.deskEdge;
  roundRect(ctx, x + 4, y + 8, TILE - 8, TILE - 14, 4);
  ctx.fill();
  ctx.fillStyle = COLORS.desk;
  roundRect(ctx, x + 6, y + 6, TILE - 12, TILE - 14, 4);
  ctx.fill();
  // Ledger paper, a second sheet, and a dark monitor with a teal glow line.
  ctx.fillStyle = '#e8ddc0';
  ctx.fillRect(x + 11, y + 12, 9, 12);
  ctx.fillStyle = '#cfc4a4';
  ctx.fillRect(x + 12, y + 21, 7, 9);
  ctx.fillStyle = '#1a2233';
  roundRect(ctx, x + 24, y + 9, 11, 9, 1.5);
  ctx.fill();
  ctx.fillStyle = 'rgba(94, 234, 255, 0.55)';
  ctx.fillRect(x + 26, y + 12, 7, 1.6);
  ctx.fillRect(x + 26, y + 15, 5, 1.6);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(x + 29, y + 24, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlant(ctx, x, y) {
  ctx.fillStyle = '#5a3a22';
  roundRect(ctx, x + 13, y + 24, 14, 10, 3);
  ctx.fill();
  ctx.fillStyle = '#7a4e2c';
  roundRect(ctx, x + 12, y + 23, 16, 4, 2);
  ctx.fill();
  ctx.fillStyle = '#3a2413';
  ctx.beginPath();
  ctx.ellipse(x + 20, y + 25, 6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.plant;
  for (const [dx, dy, r] of [[14, 18, 8], [24, 13, 9], [27, 22, 7], [18, 24, 6]]) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2c8a4c';
  ctx.beginPath();
  ctx.arc(x + 21, y + 15, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawVaultDoor(ctx, x, y) {
  ctx.fillStyle = '#39415e';
  ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
  ctx.strokeStyle = COLORS.goldDeep;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
  ctx.beginPath();
  ctx.arc(x + 20, y + 20, 11, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.gold;
  ctx.fill();
  ctx.strokeStyle = '#7a5b12';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 20, y + 20, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#7a5b12';
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.4;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 20);
    ctx.lineTo(x + 20 + Math.cos(a) * 10, y + 20 + Math.sin(a) * 10);
    ctx.strokeStyle = '#7a5b12';
    ctx.stroke();
  }
}

function drawVent(ctx, x, y, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 2 + x * 0.05);
  ctx.fillStyle = '#0d2b33';
  roundRect(ctx, x + 5, y + 5, TILE - 10, TILE - 10, 5);
  ctx.fill();
  ctx.strokeStyle = `rgba(55, 224, 200, ${0.45 + pulse * 0.3})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(55, 224, 200, 0.65)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 12 + i * 6);
    ctx.lineTo(x + 30, y + 12 + i * 6);
    ctx.stroke();
  }
}

function drawExit(ctx, x, y, open, time) {
  const glow = open ? 0.55 + 0.35 * Math.sin(time * 4) : 0.16;
  ctx.fillStyle = open ? `rgba(46, 230, 168, ${glow})` : 'rgba(120, 130, 150, 0.35)';
  roundRect(ctx, x + 3, y + 3, TILE - 6, TILE - 6, 6);
  ctx.fill();
  ctx.fillStyle = '#06281c';
  roundRect(ctx, x + 8, y + 8, TILE - 16, TILE - 16, 4);
  ctx.fill();
  ctx.fillStyle = open ? '#2ee6a8' : '#8a93a5';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', x + 20, y + 24);
}

export function drawLootItem(ctx, item, time) {
  if (item.taken) return;
  const cx = item.tx * TILE + TILE / 2;
  const cy = item.ty * TILE + TILE / 2 + Math.sin(time * 3 + item.tx * 1.7 + item.ty) * 2.5;
  if (item.kind !== '$') {
    // Stone plinth the gold and gems sit on; the treasure bobs, the stone doesn't.
    const gy = item.ty * TILE + TILE - 7;
    ctx.fillStyle = 'rgba(8, 11, 22, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx, gy + 2, 14, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d4a6e';
    roundRect(ctx, cx - 12, gy - 6, 24, 7, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(190, 205, 240, 0.35)';
    ctx.fillRect(cx - 12, gy - 6, 24, 2);
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.fillStyle = item.kind === '*' ? 'rgba(94, 234, 255, 0.13)' : 'rgba(255, 209, 102, 0.13)';
  ctx.fill();
  if (item.kind === '$') {
    ctx.fillStyle = '#1d7a3a';
    roundRect(ctx, cx - 10, cy - 7, 20, 14, 3);
    ctx.fill();
    ctx.strokeStyle = '#7ee787';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#d9ffd9';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', cx, cy + 4);
  } else if (item.kind === 'g') {
    ctx.fillStyle = '#e6b93d';
    for (const [dx, dy] of [[-9, 2], [1, 2], [-4, -6]]) {
      roundRect(ctx, cx + dx, cy + dy, 9, 6, 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(ctx, cx - 4, cy - 6, 9, 2.5, 1);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 11);
    ctx.lineTo(cx + 9, cy);
    ctx.lineTo(cx, cy + 11);
    ctx.lineTo(cx - 9, cy);
    ctx.closePath();
    ctx.fillStyle = '#5eeaff';
    ctx.fill();
    ctx.strokeStyle = '#c9f7ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy);
    ctx.lineTo(cx + 9, cy);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.stroke();
  }
}
