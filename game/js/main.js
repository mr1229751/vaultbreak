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
  game.startLevel(2); // AURORA GRAND RESERVE, the richest vault
  const put = (guard, tx, ty, angle) => {
    guard.x = tx * 40 + 20;
    guard.y = ty * 40 + 20;
    guard.angle = angle;
  };
  put(game.guards[0], 5, 2, 0.9);
  put(game.guards[1], 26, 4, 2.6);
  put(game.guards[2], 8, 15, 0.3);
  put(game.guards[3], 24, 15, -1.2);
  game.player.x = 10 * 40 + 20;
  game.player.y = 7 * 40 + 20;
  game.player.angle = 0.4;
  game.cameras[0].angle = 2.0;
  game.cameras[0].seesPlayer = true;
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
