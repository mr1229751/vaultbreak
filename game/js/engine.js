// engine.js — VAULTBREAK's conductor: the screen state machine (title, vault
// select, the heist itself, pause, caught, getaway), the fixed-step loop,
// keyboard and mouse input, the alarm economy, and the win/lose rulings.

import { LEVELS, parseLevel, TILE } from './levels.js';
import { loadSave, recordResult, setMuted } from './save.js';
import { setAudioMuted, sfxClick, sfxLoot, sfxSmoke, sfxSpotted, sfxCaught, sfxVictory, sfxUnlock } from './audio.js';
import { createPlayer, updatePlayer, useSmoke, drawPlayer } from './player.js';
import { createGuard, updateGuard, guardSeesPlayer, drawGuard, drawGuardCone, GUARD_FILL_RATE } from './guards.js';
import { createCamera, updateCamera, cameraSeesPlayer, drawCamera, drawCameraCone, CAMERA_FILL_RATE } from './cameras.js';
import { drawRoom, drawFurniture, drawLootItem } from './render.js';
import { drawHUD, drawSpottedVignette } from './hud.js';
import { drawTitle, drawLevelSelect, drawPause, drawCaught, drawVictory } from './screens.js';

const ALARM_DECAY = 26;
const SMOKE_COST = 150;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.save = loadSave();
    setAudioMuted(this.save.muted);
    this.screen = 'title';
    this.buttons = [];
    this.keys = new Set();
    this.mouse = { x: -1, y: -1 };
    this.time = 0;
    this.showHelp = false;
    this.frozen = false;
    this.levelIndex = 0;
    this.hint = null;
    this.setupDemo();
    this.bindInput();
  }

  setupDemo() {
    this.demoLevel = parseLevel(LEVELS[0]);
    this.demoGuards = Object.entries(LEVELS[0].patrols).map(([key, path]) =>
      createGuard(this.demoLevel, key, path, LEVELS[0].guardSpeed, LEVELS[0].guardPause));
    this.demoCameras = this.demoLevel.cameraSpots.map((spot, i) => createCamera(spot, LEVELS[0].cameras[i], i));
  }

  startLevel(index) {
    const def = LEVELS[index];
    this.levelIndex = index;
    this.level = parseLevel(def);
    this.level.exitOpen = false;
    this.player = createPlayer(this.level);
    this.guards = Object.entries(def.patrols).map(([key, path]) =>
      createGuard(this.level, key, path, def.guardSpeed, def.guardPause));
    this.cameras = this.level.cameraSpots.map((spot, i) => createCamera(spot, def.cameras[i], i));
    this.alarm = 0;
    this.lootValue = 0;
    this.lootTaken = 0;
    this.runTime = 0;
    this.smokeLeft = def.smoke;
    this.smokeUsed = 0;
    this.spottedNow = false;
    this.wasSpotted = false;
    this.result = null;
    this.caughtReason = '';
    this.frozen = false;
    this.screen = 'play';
    this.flashHint(`Target: $${def.target.toLocaleString('en-US')} — then reach the EXIT`, 3.2);
  }

  flashHint(text, seconds) {
    this.hint = { text, until: this.runTime + seconds };
  }

  collectLoot(item) {
    item.taken = true;
    this.lootValue += item.value;
    this.lootTaken += 1;
    sfxLoot(item.value >= 1000);
    if (this.lootValue >= this.level.def.target && !this.level.exitOpen) {
      this.level.exitOpen = true;
      sfxUnlock();
      this.flashHint('Target reached — the EXIT is open!', 2.6);
    }
  }

  caught(reason) {
    this.caughtReason = reason;
    this.screen = 'caught';
    sfxCaught();
  }

  victory() {
    const def = this.level.def;
    const timeBonus = Math.max(0, Math.round((def.par - this.runTime) * 10));
    const gearCost = this.smokeUsed * SMOKE_COST;
    const total = Math.max(0, this.lootValue + timeBonus - gearCost);
    let stars = 1;
    if (this.lootValue >= this.level.totalLoot * 0.85) stars = 2;
    if (this.lootValue >= this.level.totalLoot && this.runTime <= def.par + 30) stars = 3;
    this.result = { loot: this.lootValue, time: this.runTime, timeBonus, gearCost, total, stars };
    recordResult(this.save, def.id, LEVELS.length, this.result);
    this.screen = 'victory';
    sfxVictory();
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
      if (!e.repeat) this.onKey(key);
      this.keys.add(key);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 1280;
      this.mouse.y = ((e.clientY - rect.top) / rect.height) * 800;
    });
    this.canvas.addEventListener('click', () => {
      for (let i = this.buttons.length - 1; i >= 0; i--) {
        const b = this.buttons[i];
        if (this.mouse.x >= b.x && this.mouse.x <= b.x + b.w && this.mouse.y >= b.y && this.mouse.y <= b.y + b.h) {
          this.activate(b.action);
          return;
        }
      }
      if (this.screen === 'title' && !this.showHelp) this.activate('goto-select');
    });
  }

  onKey(key) {
    if (key === 'm') return this.activate('toggle-mute');
    if (this.screen === 'title') {
      if (key === 'enter' || key === ' ') this.activate(this.showHelp ? 'toggle-help' : 'goto-select');
      if (key === 'escape') this.showHelp = false;
    } else if (this.screen === 'select') {
      if (key === 'escape') this.screen = 'title';
      const n = Number(key);
      if (n >= 1 && n <= LEVELS.length && n <= this.save.unlocked) this.activate(`start-${n - 1}`);
    } else if (this.screen === 'play') {
      if (key === 'escape' || key === 'p') this.screen = 'pause';
      if (key === ' ' && useSmoke(this)) sfxSmoke();
    } else if (this.screen === 'pause') {
      if (key === 'escape' || key === 'p') this.screen = 'play';
    } else if (this.screen === 'caught') {
      if (key === 'enter') this.activate('restart');
    } else if (this.screen === 'victory') {
      if (key === 'enter') this.activate(this.levelIndex + 1 < LEVELS.length ? 'next-level' : 'goto-select');
    }
  }

  activate(action) {
    sfxClick();
    if (action === 'toggle-mute') {
      setMuted(this.save, !this.save.muted);
      setAudioMuted(this.save.muted);
    } else if (action === 'toggle-help') {
      this.showHelp = !this.showHelp;
    } else if (action === 'goto-select') {
      this.screen = 'select';
    } else if (action === 'goto-title') {
      this.screen = 'title';
    } else if (action === 'resume') {
      this.screen = 'play';
    } else if (action === 'restart') {
      this.startLevel(this.levelIndex);
    } else if (action === 'next-level') {
      this.startLevel(Math.min(LEVELS.length - 1, this.levelIndex + 1));
    } else if (action.startsWith('start-')) {
      this.startLevel(Number(action.slice(6)));
    }
  }

  update(dt) {
    this.time += dt;
    if (this.screen === 'title') {
      for (const g of this.demoGuards) updateGuard(g, dt, this.time);
      for (const c of this.demoCameras) updateCamera(c, this.time);
      return;
    }
    if (this.screen !== 'play' || this.frozen) return;
    this.runTime += dt;
    updatePlayer(this, dt);
    for (const g of this.guards) updateGuard(g, dt, this.time);
    for (const c of this.cameras) updateCamera(c, this.time);

    let fill = 0;
    this.spottedNow = false;
    for (const g of this.guards) {
      g.seesPlayer = guardSeesPlayer(this, g);
      if (g.seesPlayer) {
        fill = Math.max(fill, GUARD_FILL_RATE);
        this.spottedNow = true;
      }
      if (Math.hypot(g.x - this.player.x, g.y - this.player.y) < 27) {
        return this.caught('A guard tackled you in the open. Cones are warnings — heed them.');
      }
    }
    for (const c of this.cameras) {
      c.seesPlayer = cameraSeesPlayer(this, c);
      if (c.seesPlayer) {
        fill = Math.max(fill, CAMERA_FILL_RATE);
        this.spottedNow = true;
      }
    }
    if (this.spottedNow && !this.wasSpotted) sfxSpotted();
    this.wasSpotted = this.spottedNow;
    this.alarm = Math.max(0, Math.min(100, this.alarm + (fill > 0 ? fill * dt : -ALARM_DECAY * dt)));
    if (this.alarm >= 100) {
      return this.caught('The alarm hit full and the vault sealed itself. Stay out of the light.');
    }
    const ptx = Math.floor(this.player.x / TILE), pty = Math.floor(this.player.y / TILE);
    if (ptx === this.level.exit.x && pty === this.level.exit.y) {
      if (this.level.exitOpen) return this.victory();
      if (!this.hint || this.runTime > this.hint.until - 1) {
        this.flashHint(`Vault sealed — you need $${(this.level.def.target - this.lootValue).toLocaleString('en-US')} more`, 1.4);
      }
    }
  }

  renderWorld(level, guards, cameras, withPlayer) {
    const ctx = this.ctx;
    drawRoom(ctx, level, this.time);
    for (const item of level.loot) drawLootItem(ctx, item, this.time);
    for (const g of guards) drawGuardCone(ctx, this, g);
    for (const c of cameras) drawCameraCone(ctx, this, c);
    drawFurniture(ctx, level);
    for (const c of cameras) drawCamera(ctx, c, this.time);
    for (const g of guards) drawGuard(ctx, g, this.time);
    if (withPlayer && this.player) drawPlayer(ctx, this);
  }

  render() {
    const ctx = this.ctx;
    this.buttons = [];
    ctx.clearRect(0, 0, 1280, 800);
    if (this.screen === 'title') {
      const demoGame = { level: this.demoLevel, player: null, time: this.time };
      drawRoom(ctx, this.demoLevel, this.time);
      for (const item of this.demoLevel.loot) drawLootItem(ctx, item, this.time);
      for (const g of this.demoGuards) drawGuardCone(ctx, demoGame, g);
      for (const c of this.demoCameras) drawCameraCone(ctx, demoGame, c);
      drawFurniture(ctx, this.demoLevel);
      for (const c of this.demoCameras) drawCamera(ctx, c, this.time);
      for (const g of this.demoGuards) drawGuard(ctx, g, this.time);
      drawTitle(ctx, this);
    } else if (this.screen === 'select') {
      drawLevelSelect(ctx, this);
    } else {
      this.renderWorld(this.level, this.guards, this.cameras, true);
      drawSpottedVignette(ctx, this);
      drawHUD(ctx, this);
      if (this.screen === 'pause') drawPause(ctx, this);
      if (this.screen === 'caught') drawCaught(ctx, this);
      if (this.screen === 'victory') drawVictory(ctx, this);
    }
    const status = document.getElementById('status');
    if (status) status.textContent = `VAULTBREAK — ${this.screen}`;
  }

  run() {
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      this.update(dt);
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
