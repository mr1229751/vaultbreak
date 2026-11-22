// player.js — the thief: smooth keyboard movement with tile collision, vent
// slips, loot pickup and the smoke-bomb ghost, drawn as a bright hooded figure
// with a loot sack that swells as the haul grows.

import { TILE, tileCenter, blocksMovement } from './levels.js';
import { sfxStep, sfxVent } from './audio.js';

const RADIUS = 13;
const SPEED = 182;

export function createPlayer(level) {
  const start = tileCenter(level.playerStart.x, level.playerStart.y);
  return {
    x: start.x,
    y: start.y,
    angle: -Math.PI / 2,
    moving: false,
    stepTimer: 0,
    ghostTimer: 0,
    ventCooldown: 0,
  };
}

function circleHitsWall(level, x, y) {
  const minTx = Math.floor((x - RADIUS) / TILE), maxTx = Math.floor((x + RADIUS) / TILE);
  const minTy = Math.floor((y - RADIUS) / TILE), maxTy = Math.floor((y + RADIUS) / TILE);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (!blocksMovement(level, tx, ty)) continue;
      const nx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
      const ny = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
      if (Math.hypot(x - nx, y - ny) < RADIUS) return true;
    }
  }
  return false;
}

export function updatePlayer(game, dt) {
  const p = game.player;
  const level = game.level;
  let dx = 0, dy = 0;
  if (game.keys.has('arrowleft') || game.keys.has('a')) dx -= 1;
  if (game.keys.has('arrowright') || game.keys.has('d')) dx += 1;
  if (game.keys.has('arrowup') || game.keys.has('w')) dy -= 1;
  if (game.keys.has('arrowdown') || game.keys.has('s')) dy += 1;
  p.moving = dx !== 0 || dy !== 0;
  if (p.moving) {
    const len = Math.hypot(dx, dy);
    const vx = (dx / len) * SPEED * dt, vy = (dy / len) * SPEED * dt;
    if (!circleHitsWall(level, p.x + vx, p.y)) p.x += vx;
    if (!circleHitsWall(level, p.x, p.y + vy)) p.y += vy;
    p.angle = Math.atan2(dy, dx);
    p.stepTimer -= dt;
    if (p.stepTimer <= 0) {
      p.stepTimer = 0.34;
      sfxStep();
    }
  }
  p.ghostTimer = Math.max(0, p.ghostTimer - dt);
  p.ventCooldown = Math.max(0, p.ventCooldown - dt);

  const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
  const here = level.tiles[ty] && level.tiles[ty][tx];
  if ((here === 'a' || here === 'b') && p.ventCooldown <= 0) {
    const pair = (level.vents[here] || []).find((v) => v.x !== tx || v.y !== ty);
    if (pair) {
      const dest = tileCenter(pair.x, pair.y);
      p.x = dest.x;
      p.y = dest.y;
      p.ventCooldown = 1.0;
      sfxVent();
      game.flashHint('Through the vent…', 1.2);
    }
  }
  for (const item of level.loot) {
    if (item.taken) continue;
    const c = tileCenter(item.tx, item.ty);
    if (Math.hypot(p.x - c.x, p.y - c.y) < 25) game.collectLoot(item);
  }
}

export function useSmoke(game) {
  const p = game.player;
  if (game.smokeLeft <= 0 || p.ghostTimer > 0) return false;
  game.smokeLeft -= 1;
  game.smokeUsed += 1;
  p.ghostTimer = 3.5;
  return true;
}

export function drawPlayer(ctx, game) {
  const p = game.player;
  const ghost = p.ghostTimer > 0;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 11, 13, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();
  if (ghost) {
    ctx.strokeStyle = 'rgba(200, 220, 255, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = game.time * 2.4 + (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * 19, p.y + Math.sin(a) * 13, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = ghost ? 0.45 : 1;
  const sackScale = Math.min(1, game.lootValue / 4000);
  ctx.beginPath();
  ctx.arc(p.x - Math.cos(p.angle) * 11, p.y - Math.sin(p.angle) * 11 + 3, 6 + sackScale * 4, 0, Math.PI * 2);
  ctx.fillStyle = '#8a6b32';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x, p.y, RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#ff7847';
  ctx.fill();
  ctx.strokeStyle = '#ffd9c4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 3, p.y + Math.sin(p.angle) * 3, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#26202e';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.angle) * 12, p.y + Math.sin(p.angle) * 12);
  ctx.lineTo(p.x + Math.cos(p.angle) * 18, p.y + Math.sin(p.angle) * 18);
  ctx.strokeStyle = '#ffe9b0';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = 1;
}
