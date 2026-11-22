// cameras.js — wall cameras: a fixed mount whose lens sweeps a blue arc back
// and forth across the room. Slower to fill the alarm than a guard's eyes,
// but tireless — and a smoke ghost slips past it like everything else.

import { tileCenter } from './levels.js';
import { lineOfSight, drawCone } from './render.js';

export const CAMERA_RANGE = 148;
export const CAMERA_HALF_ANGLE = 0.46;
export const CAMERA_FILL_RATE = 82;

const DEG = Math.PI / 180;

export function createCamera(spot, def, index) {
  const pos = tileCenter(spot.x, spot.y);
  return {
    x: pos.x,
    y: pos.y,
    base: def.base * DEG,
    sweep: def.sweep * DEG,
    speed: def.speed,
    phase: index * 1.37,
    angle: def.base * DEG,
    seesPlayer: false,
  };
}

export function updateCamera(c, time) {
  c.angle = c.base + Math.sin(time * c.speed + c.phase) * c.sweep;
}

export function cameraSeesPlayer(game, c) {
  const p = game.player;
  if (!p || p.ghostTimer > 0) return false;
  const dx = p.x - c.x, dy = p.y - c.y;
  if (Math.hypot(dx, dy) > CAMERA_RANGE) return false;
  let diff = Math.atan2(dy, dx) - c.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA_HALF_ANGLE) return false;
  return lineOfSight(game.level, c.x, c.y, p.x, p.y);
}

export function drawCameraCone(ctx, game, c) {
  const rgb = c.seesPlayer ? '255, 71, 87' : '84, 168, 255';
  drawCone(ctx, game.level, c.x, c.y, c.angle, CAMERA_HALF_ANGLE, CAMERA_RANGE, rgb, c.seesPlayer ? 0.3 : 0.16);
}

export function drawCamera(ctx, c, time) {
  if (c.hero) {
    // Staging-only hero mount: the ?shot=cover hook flags one camera so it
    // reads unmistakably as a wall camera in the entry screenshot — a chunky
    // mounting plate and a bigger housing with a glass lens. No real run
    // ever sets `hero`, so in-game cameras render exactly as before.
    ctx.fillStyle = '#0d1526';
    ctx.strokeStyle = '#7d97cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(c.x - 17, c.y - 17, 34, 34, 6);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x, c.y, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#26355a';
    ctx.fill();
    ctx.strokeStyle = '#cfe4ff';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.angle) * 4, c.y + Math.sin(c.angle) * 4, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0f1e';
    ctx.fill();
    ctx.strokeStyle = '#5eeaff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.fillStyle = '#1a2338';
    ctx.strokeStyle = '#5f7bb8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x + Math.cos(c.angle) * 13, c.y + Math.sin(c.angle) * 13);
  ctx.strokeStyle = '#cfe4ff';
  ctx.lineWidth = 4;
  ctx.stroke();
  const blink = Math.sin(time * 3 + c.phase) > 0;
  ctx.beginPath();
  ctx.arc(c.x - 5, c.y - 6, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = blink ? '#ff4757' : '#5a1620';
  ctx.fill();
}
