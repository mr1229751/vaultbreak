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
  // Round-4 (final) cover: the round-2 composition, the only cover with a
  // measured top score (63.08%, #204 of 5,056) — the thief caught mid-room
  // in the top camera's red sweep, SPOTTED banner up, alarm bar hot, half
  // the take already pocketed and the gem vault lit in the centre of the
  // frame. One change from round 2: that same camera now wears the hero
  // housing, so the camera whose cone holds the thief reads unmistakably
  // as a wall camera at thumbnail size. `hero` only fattens the housing
  // in drawCamera and no real run ever sets it, so the shipped game's
  // rendering and behaviour are untouched.
  game.startLevel(2); // AURORA GRAND RESERVE, the richest vault
  const put = (guard, tx, ty, angle) => {
    guard.x = tx * 40 + 20;
    guard.y = ty * 40 + 20;
    guard.angle = angle;
  };
  put(game.guards[0], 6, 3, 0.9);
  put(game.guards[1], 26, 4, 2.6);
  put(game.guards[2], 8, 15, 0.3);
  put(game.guards[3], 24, 15, -1.2);
  game.player.x = 13 * 40 + 20;
  game.player.y = 5 * 40 + 20;
  game.player.angle = -0.9;
  // The camera that has him: red cone straight down over the thief, and
  // the hero housing so the camera itself is legible in the frame.
  game.cameras[0].angle = Math.PI / 2;
  game.cameras[0].seesPlayer = true;
  game.cameras[0].hero = true;
  game.cameras[1].angle = 0.25;
  game.cameras[2].angle = 2.8;
  const takenKinds = ['$', '$', 'g', '*'];
  for (const item of game.level.loot) {
    const at = takenKinds.indexOf(item.kind);
    if (at >= 0) {
      item.taken = true;
      takenKinds.splice(at, 1);
    }
  }
  game.lootValue = 2000;
  game.lootTaken = 4;
  game.alarm = 55;
  game.spottedNow = true;
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
