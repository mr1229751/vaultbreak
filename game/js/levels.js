// levels.js — VAULTBREAK's three bank layouts and the parser that turns each
// ASCII map into runtime data (loot, vents, spawns, patrol paths, cameras).
//
// Map legend:
//   #  wall            blocks movement and sight
//   D  desk            blocks movement, not sight (low cover)
//   p  plant           blocks movement, not sight
//   V  vault door      decorative slab, blocks movement and sight
//   .  floor           $ cash $250    g gold bars $500    * gem $1000
//   E  exit            P thief start  1-4 guard spawns    C camera mount
//   a/b air vents      step on one vent to slip through to its pair

export const TILE = 40;
export const LOOT_VALUES = { $: 250, g: 500, '*': 1000 };
export const LOOT_LABELS = { $: 'CASH', g: 'GOLD', '*': 'GEM' };

export const LEVELS = [
  {
    id: 'level1',
    name: 'FIRST NATIONAL LOBBY',
    subtitle: 'A sleepy branch bank. Learn the cones, fill your sack.',
    target: 2000,
    par: 150,
    guardSpeed: 76,
    guardPause: 1.1,
    smoke: 2,
    cameras: [
      { base: 115, sweep: 48, speed: 0.45 },
      { base: 0, sweep: 42, speed: 0.55 },
    ],
    patrols: {
      1: [[24, 5], [29, 5], [29, 8], [24, 8]],
      2: [[24, 11], [29, 11], [29, 14], [24, 14]],
      3: [[8, 13], [24, 13]],
    },
    map: `
################################
#P....D.....#..........#.......#
#.....D.....#....$.....#...C...#
#...........#..........#.......#
#..$........#....D.....#.......#
#...........#..........#...1...#
#.....g.....#....D.....#.......#
###.#########..........#.......#
#...........#....$.....#.......#
#C....D.....#..........###.#####
#.....D.....#....D.............#
#..$........#..........2.......#
#...........#####.######.......#
#..............................#
#....D......3......D......$....#
#..............................#
#..........#####..###..........#
#....$.....#.V.**....#....g....#
#....E.....#...**....#.........#
################################`,
  },
  {
    id: 'level2',
    name: 'MERIDIAN TRUST VAULT',
    subtitle: 'Vents in the floor, cameras on the walls, gold in the back.',
    target: 3000,
    par: 170,
    guardSpeed: 88,
    guardPause: 0.9,
    smoke: 2,
    cameras: [
      { base: 90, sweep: 50, speed: 0.6 },
      { base: 200, sweep: 55, speed: 0.5 },
    ],
    patrols: {
      1: [[3, 3], [6, 3], [6, 6], [3, 6]],
      2: [[25, 8], [29, 8], [29, 12], [25, 12]],
      3: [[4, 15], [15, 15], [15, 17], [4, 17]],
    },
    map: `
################################
#P......#..........#.......$...#
#.......#....C.....#...........#
#..1....#..........#.....D.....#
#.......#....$.....#...........#
#....D..#..........#......g....#
#.......#####.######...........#
#..............................#
#......$.................2C....#
#..D..........#####.#####......#
#.............#.......#....$...#
#....a........#...V*V.#........#
#.............#..V***V#........#
#......D......#...V*V.#........#
###.###########.......####.#####
#..............................#
#..3......D......$......D......#
#..............................#
#....E......g......a......$....#
################################`,
  },
  {
    id: 'level3',
    name: 'AURORA GRAND RESERVE',
    subtitle: 'The big one. Four guards, three cameras, one golden vault.',
    target: 4500,
    par: 200,
    guardSpeed: 98,
    guardPause: 0.7,
    smoke: 3,
    cameras: [
      { base: 90, sweep: 46, speed: 0.65 },
      { base: 0, sweep: 52, speed: 0.55 },
      { base: 180, sweep: 52, speed: 0.6 },
    ],
    patrols: {
      1: [[3, 2], [6, 2], [6, 5], [3, 5]],
      2: [[23, 3], [28, 3], [28, 5], [23, 5]],
      3: [[4, 14], [12, 14], [12, 17], [4, 17]],
      4: [[22, 14], [28, 14], [28, 17], [22, 17]],
    },
    map: `
################################
#P......#..........#...........#
#..1....#....C.....#..2........#
#.......#..........#...........#
#...D...#....$.....#....D......#
#.......#..........#...........#
###.#####....D.....#####.#######
#..............................#
#C.....$......a...........$....#
#..D..........##.##.#####......#
#.............#..V*V..#........#
#..a..........#..***..#....C...#
#.............#..V*V..#........#
#..3....D.....#####.#####......#
#..............................#
#......D.............4..D....$.#
#..............................#
#....$......b......g......b....#
#....E.........................#
################################`,
  },
];

const BLOCKING = new Set(['#', 'D', 'p', 'V']);
const SIGHT_BLOCKING = new Set(['#', 'V']);

export function parseLevel(def) {
  const rows = def.map.replace(/^\n+|\n+$/g, '').split('\n');
  const height = rows.length;
  const width = rows[0].length;
  const tiles = [];
  const loot = [];
  const vents = {};
  const guardSpawns = {};
  const cameraSpots = [];
  let playerStart = { x: 1, y: 1 };
  let exit = { x: 1, y: 1 };
  for (let y = 0; y < height; y++) {
    tiles.push([]);
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x] || '#';
      tiles[y].push(ch);
      if (ch === 'P') playerStart = { x, y };
      else if (ch === 'E') exit = { x, y };
      else if (LOOT_VALUES[ch]) loot.push({ tx: x, ty: y, kind: ch, value: LOOT_VALUES[ch], taken: false });
      else if (ch >= '1' && ch <= '4') guardSpawns[ch] = { x, y };
      else if (ch === 'C') cameraSpots.push({ x, y });
      else if (ch === 'a' || ch === 'b') (vents[ch] = vents[ch] || []).push({ x, y });
    }
  }
  return {
    def,
    width,
    height,
    tiles,
    loot,
    vents,
    guardSpawns,
    cameraSpots,
    playerStart,
    exit,
    totalLoot: loot.reduce((sum, item) => sum + item.value, 0),
  };
}

export function tileAt(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= level.width || ty >= level.height) return '#';
  return level.tiles[ty][tx];
}

export function blocksMovement(level, tx, ty) {
  return BLOCKING.has(tileAt(level, tx, ty));
}

export function blocksSight(level, tx, ty) {
  return SIGHT_BLOCKING.has(tileAt(level, tx, ty));
}

export function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}
