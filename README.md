# VAULTBREAK

A neon-noir top-down heist game: sneak past guard vision cones and sweeping cameras — fill the alarm meter and you're caught — grab the vault's loot target and escape.

## How to play

Open `game/index.html` in a browser. Arrow keys / WASD move, Shift drops a smoke bomb, Esc pauses.

## Modules

The game source lives in `game/js`, one job per module:

- `engine` — game loop and input
- `levels` — the three vault layouts
- `player` — the thief: movement and smoke bombs
- `guards` — patrol guards and their vision cones
- `cameras` — sweeping security cameras
- `render` — canvas drawing of the bank, cones and arcs
- `hud` — alarm meter, loot count, timer
- `screens` — title, level select, pause, caught and victory screens
- `audio` — WebAudio synth sound effects and mute toggle
- `save` — progress saved to localStorage

![](https://make.fun/badge/best-heist-game-20261122-0559.svg)![](https://make.fun/badge/best-heist-game-20261122-0559/mr1229751/vaultbreak/rank.svg)![](https://make.fun/badge/best-heist-game-20261122-0559/mr1229751/vaultbreak/reward.svg)
