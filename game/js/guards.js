// guards.js — bank guards: waypoint patrols with pauses and a slow scan at
// each stop, a vision cone clipped by the walls, and the spotting test the
// alarm meter feeds on. A guard who touches the thief ends the run at once.

import { TILE, tileCenter } from './levels.js';
import { lineOfSight, drawCone } from './render.js';

export const GUARD_RANGE = 172;
export const GUARD_HALF_ANGLE = 0.58;
export const GUARD_FILL_RATE = 118;

export function createGuard(level, spawnKey, patrolTiles, speed, pauseSeconds) {
  const spawn = level.guardSpawns[spawnKey];
  const start = tileCenter(spawn.x, spawn.y);
  return {
    x: start.x,
    y: start.y,
    path: patrolTiles.map(([tx, ty]) => tileCenter(tx, ty)),
    target: 0,
    speed,
    pauseSeconds,
    pauseTimer: 0,
    angle: Math.PI / 2,
    scanPhase: Math.random() * Math.PI * 2,
    seesPlayer: false,
  };
}

export function updateGuard(g, dt, time) {
  if (g.pauseTimer > 0) {
    g.pauseTimer -= dt;
    g.angle += Math.sin(time * 1.6 + g.scanPhase) * 0.55 * dt;
    return;
  }
  const dest = g.path[g.target];
  const dx = dest.x - g.x, dy = dest.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) {
    g.target = (g.target + 1) % g.path.length;
    g.pauseTimer = g.pauseSeconds;
    return;
  }
  const want = Math.atan2(dy, dx);
  let diff = want - g.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  g.angle += Math.max(-3.2 * dt, Math.min(3.2 * dt, diff));
  g.x += Math.cos(want) * Math.min(dist, g.speed * dt);
  g.y += Math.sin(want) * Math.min(dist, g.speed * dt);
}

export function guardSeesPlayer(game, g) {
  const p = game.player;
  if (!p || p.ghostTimer > 0) return false;
  const dx = p.x - g.x, dy = p.y - g.y;
  if (Math.hypot(dx, dy) > GUARD_RANGE) return false;
  let diff = Math.atan2(dy, dx) - g.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD_HALF_ANGLE) return false;
  return lineOfSight(game.level, g.x, g.y, p.x, p.y);
}

export function drawGuardCone(ctx, game, g) {
  const rgb = g.seesPlayer ? '255, 71, 87' : '255, 176, 66';
  drawCone(ctx, game.level, g.x, g.y, g.angle, GUARD_HALF_ANGLE, GUARD_RANGE, rgb, g.seesPlayer ? 0.34 : 0.2);
}

export function drawGuard(ctx, g, time) {
  ctx.beginPath();
  ctx.ellipse(g.x, g.y + 11, 12, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#2b4acb';
  ctx.fill();
  ctx.strokeStyle = '#9db8ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(g.x, g.y, 7.5, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c79b';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(g.x + Math.cos(g.angle) * 6, g.y + Math.sin(g.angle) * 6);
  ctx.lineTo(g.x + Math.cos(g.angle) * 15, g.y + Math.sin(g.angle) * 15);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 4;
  ctx.stroke();
  if (g.seesPlayer) {
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 22 - Math.sin(time * 10) * 2);
  }
}
