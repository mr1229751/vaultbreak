// main.js — VAULTBREAK boots here: build the game on the page's canvas, honour
// the ?shot= staging hooks the screenshots were taken with (each names a real
// screen or a deliberately arranged moment of a real run), and start the loop.

import { Game } from './engine.js';
import { LEVELS } from './levels.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__vaultbreak = game;

const shot = new URLSearchParams(location.search).get('shot');
if (shot === 'select') {
  game.save.unlocked = LEVELS.length;
  game.save.best = { level1: { loot: 6500, time: 121, stars: 3 } };
  game.screen = 'select';
} else if (shot === 'cover') {
  stageCoverScene(game);
} else if (shot === 'victory') {
  stageVictoryScene(game);
}

function stageCoverScene(game) {
  // Round-3 cover: a mid-stealth moment, not a capture. The thief threads
  // the dark sliver between the hero camera's blue sweep (up from the left
  // wall) and a guard's amber cone (down from the top-left room), one tile
  // ahead of a second guard whose back is turned. The alarm sits in the
  // amber warning band — raised, but nobody has eyes on him yet — and the
  // gem vault ahead is untouched: the job is in front of him, not behind.
  game.startLevel(2); // AURORA GRAND RESERVE, the richest vault
  const put = (guard, tx, ty, angle) => {
    guard.x = tx * 40 + 20;
    guard.y = ty * 40 + 20;
    guard.angle = angle;
  };
  // The guard whose cone forms the near side of the gap, top-left room.
  put(game.guards[0], 6, 3, 1.35);
  // Back turned, one tile below the thief, cone firing away down the room.
  put(game.guards[1], 4, 8, Math.PI / 2);
  put(game.guards[2], 26, 4, 2.6);
  put(game.guards[3], 24, 15, -1.2);
  game.player.x = 4 * 40 + 28;
  game.player.y = 7 * 40 + 20;
  game.player.angle = 0.2;
  game.cameras[0].angle = Math.PI / 2;
  // Hero camera: the left-wall mount whose cone the thief is slipping past.
  // `hero` only fattens its housing in drawCamera; nothing in a real run
  // ever sets it, so the shipped game's rendering is untouched.
  game.cameras[1].hero = true;
  game.cameras[1].angle = -0.85;
  game.cameras[2].angle = 2.8;
  // One cash bundle pocketed on the way in; everything else — above all
  // the gem vault — still waits ahead of him.
  for (const item of game.level.loot) {
    if (item.kind === '$' && item.tx === 6 && item.ty === 8) item.taken = true;
  }
  game.lootValue = 250;
  game.lootTaken = 1;
  game.alarm = 46; // the amber band (45-75) — tension without a spotting
  game.spottedNow = false;
  game.runTime = 74;
  game.hint = null;
  game.frozen = true;
}

function stageVictoryScene(game) {
  game.startLevel(2);
  for (const item of game.level.loot) item.taken = true;
  game.level.exitOpen = true;
  game.lootValue = game.level.totalLoot;
  game.runTime = 164;
  game.result = {
    loot: game.level.totalLoot,
    time: 164,
    timeBonus: 360,
    gearCost: 150,
    total: game.level.totalLoot + 360 - 150,
    stars: 3,
  };
  game.screen = 'victory';
  game.frozen = true;
}

game.run();
