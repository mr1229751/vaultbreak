// decor.js — VAULTBREAK's dressing pass: the purely visual layer that makes
// each vault read as a furnished, lived-in bank — carpet tiles and marble
// veining on the floor, a plush rug under every loot pile, brass inlay where
// floor meets wall, panelled walls with brass sconces. Everything here is
// derived from a deterministic tile hash, so a room dresses itself identically
// on every run, and nothing in this file touches movement, sight, or loot —
// it only paints.

import { TILE, tileAt } from './levels.js';

function seedOf(level) {
  let s = 0;
  const id = level.def.id;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) | 0;
  return s;
}

function hash01(seed, tx, ty, salt) {
  let h = (Math.imul(tx + 1, 374761393) + Math.imul(ty + 1, 668265263)
    + Math.imul(seed + 1, 974711) + Math.imul(salt + 1, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
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

const LOOT_CHARS = new Set(['$', 'g', '*']);

export function drawFloorDecor(ctx, level) {
  const seed = seedOf(level);
  for (let ty = 0; ty < level.height; ty++) {
    for (let tx = 0; tx < level.width; tx++) {
      const ch = tileAt(level, tx, ty);
      const x = tx * TILE, y = ty * TILE;
      if (LOOT_CHARS.has(ch)) drawLootRug(ctx, x, y, ch);
      else if (ch === '.') drawFloorTile(ctx, seed, tx, ty, x, y);
      else continue;
      drawBrassInlay(ctx, level, tx, ty, x, y);
    }
  }
}

function drawLootRug(ctx, x, y, kind) {
  ctx.fillStyle = kind === '*' ? '#5c1428' : '#4a1220';
  roundRect(ctx, x + 3, y + 3, TILE - 6, TILE - 6, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + 6, y + 6, TILE - 12, TILE - 12, 4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 209, 102, 0.16)';
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 12);
  ctx.lineTo(x + 25, y + 20);
  ctx.lineTo(x + 20, y + 28);
  ctx.lineTo(x + 15, y + 20);
  ctx.closePath();
  ctx.fill();
}

function drawFloorTile(ctx, seed, tx, ty, x, y) {
  const r = hash01(seed, tx, ty, 1);
  if (r < 0.15) {
    // Carpet tile: deep burgundy with a woven border and centre diamond.
    ctx.fillStyle = '#3d1424';
    roundRect(ctx, x + 2, y + 2, TILE - 4, TILE - 4, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(233, 179, 76, 0.28)';
    ctx.lineWidth = 1;
    roundRect(ctx, x + 6, y + 6, TILE - 12, TILE - 12, 3);
    ctx.stroke();
    ctx.fillStyle = 'rgba(233, 179, 76, 0.20)';
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 14);
    ctx.lineTo(x + 26, y + 20);
    ctx.lineTo(x + 20, y + 26);
    ctx.lineTo(x + 14, y + 20);
    ctx.closePath();
    ctx.fill();
  } else if (r < 0.27) {
    // Marble veining: two faint mineral streaks across the tile.
    ctx.strokeStyle = 'rgba(190, 205, 240, 0.07)';
    ctx.lineWidth = 1.2;
    const off = hash01(seed, tx, ty, 2) * 18;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 8 + off);
    ctx.lineTo(x + 16, y + 16 + off * 0.4);
    ctx.lineTo(x + TILE - 3, y + 10 + off);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 10, y + TILE - 4);
    ctx.lineTo(x + 24, y + 22 + off * 0.3);
    ctx.stroke();
  } else if (r < 0.34) {
    // Scattered paperwork dropped on the bank floor.
    ctx.fillStyle = 'rgba(226, 220, 198, 0.75)';
    const a = hash01(seed, tx, ty, 3);
    ctx.fillRect(x + 8 + a * 8, y + 10, 9, 12);
    ctx.fillStyle = 'rgba(198, 192, 168, 0.6)';
    ctx.fillRect(x + 20, y + 20 + a * 6, 8, 11);
    ctx.fillStyle = 'rgba(120, 130, 160, 0.5)';
    ctx.fillRect(x + 10 + a * 8, y + 13, 5, 1.5);
    ctx.fillRect(x + 10 + a * 8, y + 16, 5, 1.5);
  } else if (r < 0.40) {
    // Loose coin glints spilled near the money.
    ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
    for (let i = 0; i < 3; i++) {
      const gx = x + 9 + hash01(seed, tx, ty, 4 + i) * 22;
      const gy = y + 9 + hash01(seed, tx, ty, 7 + i) * 22;
      ctx.beginPath();
      ctx.arc(gx, gy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBrassInlay(ctx, level, tx, ty, x, y) {
  ctx.fillStyle = 'rgba(233, 179, 76, 0.16)';
  if (tileAt(level, tx, ty - 1) === '#') ctx.fillRect(x, y, TILE, 2);
  if (tileAt(level, tx, ty + 1) === '#') ctx.fillRect(x, y + TILE - 2, TILE, 2);
  if (tileAt(level, tx - 1, ty) === '#') ctx.fillRect(x, y, 2, TILE);
  if (tileAt(level, tx + 1, ty) === '#') ctx.fillRect(x + TILE - 2, y, 2, TILE);
}

export function drawWallDecor(ctx, level) {
  const seed = seedOf(level);
  for (let ty = 0; ty < level.height; ty++) {
    for (let tx = 0; tx < level.width; tx++) {
      if (tileAt(level, tx, ty) !== '#') continue;
      const x = tx * TILE, y = ty * TILE;
      // Panel inset on every wall slab.
      ctx.strokeStyle = 'rgba(10, 16, 34, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 7.5, y + 7.5, TILE - 15, TILE - 15);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeRect(x + 8.5, y + 8.5, TILE - 15, TILE - 15);
      // Brass sconce with a warm pool of light, on wall faces above floor.
      if (tileAt(level, tx, ty + 1) !== '#' && hash01(seed, tx, ty, 9) < 0.34) {
        const cx = x + TILE / 2;
        ctx.fillStyle = 'rgba(255, 190, 92, 0.10)';
        ctx.beginPath();
        ctx.arc(cx, y + 16, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c99327';
        roundRect(ctx, cx - 2, y + 6, 4, 9, 2);
        ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(cx, y + 7, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
