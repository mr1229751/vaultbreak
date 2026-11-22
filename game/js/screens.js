// screens.js — VAULTBREAK's menu layer: title, vault select, pause, caught
// and the getaway results. Each screen draws itself and registers its buttons
// on game.buttons for the engine's mouse hit-testing; every screen is also
// fully reachable by keyboard.

import { LEVELS } from './levels.js';
import { formatTime } from './hud.js';

const GOLD = '#ffd166';
const PAPER = '#f4f6fb';
const DIM = '#aeb9d4';

function button(ctx, game, x, y, w, h, label, action, primary = false) {
  game.buttons.push({ x, y, w, h, action });
  const hover = game.mouse.x >= x && game.mouse.x <= x + w && game.mouse.y >= y && game.mouse.y <= y + h;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fillStyle = primary ? (hover ? '#ffcf4d' : GOLD) : hover ? 'rgba(38, 51, 90, 0.95)' : 'rgba(16, 24, 46, 0.92)';
  ctx.fill();
  ctx.strokeStyle = primary ? '#8a6a14' : 'rgba(255, 209, 102, 0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = primary ? '#231a02' : PAPER;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 7);
}

function panel(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fillStyle = 'rgba(6, 10, 22, 0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(3, 5, 12, 0.55)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 96px Georgia, "Times New Roman", serif';
  ctx.fillText('VAULTBREAK', 640, 218);
  ctx.fillStyle = PAPER;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('A  N E O N - N O I R   H E I S T', 640, 262);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.7)';
  ctx.fillRect(440, 288, 400, 3);
  ctx.fillStyle = DIM;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Slip past the cones. Loot the vault. Vanish before the alarm sings.', 640, 330);

  if (game.showHelp) {
    drawHelpPanel(ctx, game);
  } else {
    button(ctx, game, 490, 386, 300, 58, 'START THE HEIST', 'goto-select', true);
    button(ctx, game, 490, 460, 300, 52, 'HOW TO PLAY', 'toggle-help');
    button(ctx, game, 490, 526, 300, 52, game.save.muted ? 'SOUND: OFF' : 'SOUND: ON', 'toggle-mute');
  }
  ctx.fillStyle = DIM;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Move  WASD / Arrows      Smoke bomb  SPACE      Pause  ESC      Sound  M', 640, 700);
  ctx.fillText('Three vaults. One alarm. Your cut is whatever you can carry.', 640, 728);
}

function drawHelpPanel(ctx, game) {
  panel(ctx, 340, 356, 600, 252);
  ctx.fillStyle = PAPER;
  ctx.font = '17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  const lines = [
    'Cross each vault and grab at least the LOOT TARGET in cash,',
    'gold and gems — then reach the EXIT while it glows green.',
    'Amber cones are guard eyes, blue arcs are cameras. Being seen',
    'fills the ALARM meter; at full, the run is over. Walls block sight,',
    'desks and plants only block your feet. Floor vents (cyan grates)',
    'slip you to their pair. A smoke bomb (SPACE) makes you a ghost',
    'for 3.5 s — but each one costs $150 of your cut at the tally.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 372, 396 + i * 26));
  button(ctx, game, 540, 548, 200, 44, 'CLOSE', 'toggle-help');
}

export function drawLevelSelect(ctx, game) {
  ctx.fillStyle = '#070b16';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 52px Georgia, "Times New Roman", serif';
  ctx.fillText('CHOOSE YOUR VAULT', 640, 110);
  ctx.fillStyle = DIM;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Clear a vault to unlock the next. Click a card, or press 1 – 3.', 640, 146);

  LEVELS.forEach((def, i) => {
    const x = 70 + i * 400, y = 196, w = 360, h = 420;
    const locked = i + 1 > game.save.unlocked;
    const best = game.save.best[def.id];
    if (!locked) game.buttons.push({ x, y, w, h, action: `start-${i}` });
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fillStyle = locked ? 'rgba(14, 19, 34, 0.9)' : 'rgba(20, 29, 54, 0.95)';
    ctx.fill();
    ctx.strokeStyle = locked ? 'rgba(120,130,160,0.35)' : 'rgba(255, 209, 102, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = locked ? '#5f6b8a' : GOLD;
    ctx.font = 'bold 25px system-ui, sans-serif';
    const words = def.name.split(' ');
    ctx.fillText(words.slice(0, 2).join(' '), x + w / 2, y + 52);
    ctx.fillText(words.slice(2).join(' '), x + w / 2, y + 84);
    ctx.fillStyle = locked ? '#48536e' : DIM;
    ctx.font = '15px system-ui, sans-serif';
    wrapText(ctx, def.subtitle, x + w / 2, y + 122, w - 48, 21);
    ctx.font = 'bold 19px system-ui, sans-serif';
    ctx.fillStyle = locked ? '#48536e' : PAPER;
    ctx.fillText(`TARGET  $${def.target.toLocaleString('en-US')}`, x + w / 2, y + 226);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = locked ? '#48536e' : DIM;
    ctx.fillText(`Par ${formatTime(def.par)}  ·  Guards patrol  ·  Cameras sweep`, x + w / 2, y + 256);
    if (locked) {
      ctx.fillStyle = '#8a93a5';
      ctx.font = 'bold 21px system-ui, sans-serif';
      ctx.fillText('L O C K E D', x + w / 2, y + 330);
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText('Clear the previous vault to open this one.', x + w / 2, y + 360);
    } else if (best) {
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('★'.repeat(best.stars) + '☆'.repeat(3 - best.stars), x + w / 2, y + 322);
      ctx.fillStyle = PAPER;
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(`Best haul $${best.loot.toLocaleString('en-US')}  ·  ${formatTime(best.time)}`, x + w / 2, y + 354);
      button(ctx, game, x + 70, y + 366, w - 140, 40, 'PLAY AGAIN', `start-${i}`);
    } else {
      ctx.fillStyle = DIM;
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Not yet robbed.', x + w / 2, y + 330);
      button(ctx, game, x + 70, y + 366, w - 140, 40, 'BREAK IN', `start-${i}`, true);
    }
  });
  ctx.fillStyle = DIM;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('ESC — back to title', 640, 692);
}

export function drawPause(ctx, game) {
  ctx.fillStyle = 'rgba(3, 5, 12, 0.66)';
  ctx.fillRect(0, 0, 1280, 800);
  panel(ctx, 440, 250, 400, 300);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 640, 322);
  button(ctx, game, 500, 356, 280, 50, 'RESUME', 'resume', true);
  button(ctx, game, 500, 418, 280, 50, 'RESTART VAULT', 'restart');
  button(ctx, game, 500, 480, 280, 50, 'ABANDON RUN', 'goto-select');
}

export function drawCaught(ctx, game) {
  ctx.fillStyle = 'rgba(60, 4, 10, 0.72)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff4757';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('CAUGHT!', 640, 250);
  ctx.fillStyle = PAPER;
  ctx.font = '21px system-ui, sans-serif';
  ctx.fillText(game.caughtReason, 640, 302);
  ctx.fillStyle = DIM;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`You had $${game.lootValue.toLocaleString('en-US')} in the sack after ${formatTime(game.time)}. The bank keeps it all.`, 640, 348);
  button(ctx, game, 490, 400, 300, 54, 'TRY AGAIN', 'restart', true);
  button(ctx, game, 490, 468, 300, 50, 'LEVEL SELECT', 'goto-select');
}

export function drawVictory(ctx, game) {
  ctx.fillStyle = 'rgba(3, 14, 10, 0.78)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2ee6a8';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('CLEAN GETAWAY', 640, 168);
  const r = game.result;
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('★'.repeat(r.stars) + '☆'.repeat(3 - r.stars), 640, 228);
  panel(ctx, 440, 262, 400, 216);
  ctx.font = '19px system-ui, sans-serif';
  const rows = [
    ['Loot hauled', `$${r.loot.toLocaleString('en-US')}`],
    ['Time bonus', `+$${r.timeBonus.toLocaleString('en-US')}`],
    ['Gear cost (smoke)', `-$${r.gearCost.toLocaleString('en-US')}`],
    ['Escaped in', formatTime(r.time)],
  ];
  rows.forEach(([label, value], i) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = DIM;
    ctx.fillText(label, 472, 308 + i * 34);
    ctx.textAlign = 'right';
    ctx.fillStyle = PAPER;
    ctx.fillText(value, 808, 308 + i * 34);
  });
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('YOUR CUT', 472, 308 + 4 * 34);
  ctx.textAlign = 'right';
  ctx.fillText(`$${r.total.toLocaleString('en-US')}`, 808, 308 + 4 * 34);
  const hasNext = game.levelIndex + 1 < LEVELS.length;
  if (hasNext) button(ctx, game, 490, 512, 300, 54, 'NEXT VAULT', 'next-level', true);
  button(ctx, game, 490, hasNext ? 578 : 512, 300, 50, 'REPLAY', 'restart', !hasNext);
  button(ctx, game, 490, hasNext ? 640 : 574, 300, 50, 'LEVEL SELECT', 'goto-select');
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
}
