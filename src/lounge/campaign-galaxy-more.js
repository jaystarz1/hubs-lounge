import * as THREE from "three";
import { GROUND, BOX, CYL, BALL, CONE, TORUS, SLAB, GEO, WORLDS, CARDS, CARD_SIZE, AMBIENCE } from "./shoots-art";
import { LAYOUTS, PERSON, PLATE_SOUND } from "./plates";
import { SHAPES } from "./plates-shapes";
import { gunman, thing, DONT, cross, toss, across, pick, flyers } from "./shoot-paths";
import { painter, BLACK, arms, legs, kit, asGeo, rush, lobbed, skim } from "./campaign-kit";

// The galaxy's five more levels (Jay, 2026-10-31: "add five more levels to
// each set"), played after the Death Star's docking bay and before the
// trench run:
//   5 DETENTION BLOCK AA-23  the cell block: the guard post, cell doors both
//                       sides, troopers out of the lift; Leia in a cell
//   6 CLOUD CITY        the landing platform over the clouds of Bespin:
//                       cloud cars, Boba Fett, Lando's guards (don't)
//   7 JABBA'S PALACE    the throne room: Jabba on his dais, Gamorrean guards,
//                       the rancor under the trap door, Han in carbonite
//   8 THE SAIL BARGE    the Sarlacc pit in the Dune Sea: skiffs, the barge,
//                       Boba Fett; Luke on a skiff (don't)
//   9 ENDOR             the forest moon: scout troopers on speeder bikes,
//                       AT-STs, the bunker; the Ewoks are with us (don't)

const G = GROUND;
const SKIN = "#e0b896";

// ---- People -------------------------------------------------------------------

Object.assign(CARDS, {
  gamorrean: (c, W) => {
    const p = painter(c, W);
    const skin = "#7a8a4a";
    p.poly([32, 104, 48, 104, 47, 194, 33, 194], skin);
    p.poly([52, 104, 68, 104, 67, 194, 53, 194], skin);
    p.poly([24, 44, 76, 44, 80, 116, 20, 116], "#6a4a2a");
    p.poly([24, 96, 76, 96, 76, 104, 24, 104], "#3a2a1a");
    p.poly([12, 50, 26, 46, 30, 106, 16, 110], skin);
    p.poly([74, 46, 88, 50, 84, 82, 70, 80], skin);
    // the axe, raised
    p.line([80, 84, 90, 10], 3.5, "#5a3a20");
    p.poly([84, 6, 98, 2, 100, 26, 88, 22], "#a8acb4", 1.5);
    p.ell(50, 28, 17, 18, skin);
    p.ell(50, 34, 8, 6, "#9aa86a", 1.2);
    p.ell(47, 34, 1.4, 1.4, "#2a2a1a", 0);
    p.ell(53, 34, 1.4, 1.4, "#2a2a1a", 0);
    p.ell(43, 24, 2, 2, "#1a1a10", 0);
    p.ell(57, 24, 2, 2, "#1a1a10", 0);
    p.poly([40, 40, 42, 46, 44, 40], "#f0e8d8", 0);
    p.poly([56, 40, 58, 46, 60, 40], "#f0e8d8", 0);
    p.poly([32, 14, 40, 6, 60, 6, 68, 14, 66, 20, 34, 20], "#5a4a3a");
  },
  scout: (c, W) => {
    const p = painter(c, W);
    p.poly([30, 48, 70, 48, 68, 104, 32, 104], BLACK);
    legs(p, BLACK, "#f2f3f5", { knee: "#f2f3f5" });
    p.poly([33, 52, 67, 52, 65, 72, 35, 72], "#f2f3f5");
    p.poly([36, 96, 64, 96, 64, 104, 36, 104], "#f2f3f5");
    arms(p, BLACK, BLACK, { pistol: true });
    p.ell(25, 54, 6, 5, "#f2f3f5");
    p.ell(75, 54, 6, 5, "#f2f3f5");
    // the scout helmet: a dome, the long visor, the brim
    p.poly([42, 42, 58, 42, 57, 50, 43, 50], BLACK);
    p.ell(50, 20, 15, 15, "#f2f3f5");
    p.poly([32, 18, 68, 18, 70, 24, 30, 24], "#f2f3f5");
    p.poly([38, 26, 62, 26, 58, 32, 42, 32], BLACK, 1);
    p.poly([44, 34, 56, 34, 56, 44, 44, 44], "#d8dce4");
    p.line([46, 38, 54, 38], 1.2, "#6a707a");
  },
  ewok: (c, W) => {
    const p = painter(c, W);
    // (100 x 150) brown fur, a leather hood, a spear
    p.poly([28, 60, 72, 60, 74, 140, 26, 140], "#7a5a3a");
    p.poly([30, 138, 46, 138, 46, 148, 28, 148], "#5a3e26");
    p.poly([54, 138, 70, 138, 72, 148, 54, 148], "#5a3e26");
    p.poly([18, 70, 30, 64, 32, 110, 20, 112], "#7a5a3a");
    p.poly([70, 64, 82, 70, 80, 112, 68, 110], "#7a5a3a");
    p.line([84, 148, 90, 30], 3, "#8a6a4a");
    p.poly([86, 30, 90, 16, 94, 30], "#c8c8c0", 1);
    p.ell(50, 38, 22, 22, "#8a6a46");
    p.poly([26, 34, 32, 14, 50, 8, 68, 14, 74, 34, 66, 26, 34, 26], "#c8865a", 1.6);
    p.ell(50, 44, 10, 8, "#c8a07a", 0);
    p.ell(42, 36, 3.6, 3.6, "#1a1a1a", 0);
    p.ell(58, 36, 3.6, 3.6, "#1a1a1a", 0);
    p.ell(50, 44, 3, 2.2, "#2a1a10", 0);
  },
  lando: (c, W) => {
    const p = painter(c, W);
    legs(p, "#3a4a6a", BLACK);
    p.poly([24, 46, 76, 46, 80, 120, 20, 120], "#2a5a9a");
    p.poly([40, 46, 60, 46, 56, 100, 44, 100], "#e8dcc0");
    arms(p, "#2a5a9a", "#8a5a3a", { pistol: true });
    p.ell(50, 28, 12, 14, "#8a5a3a");
    p.line([45, 34, 55, 34], 2.2, "#1a1a1a");
    p.poly([38, 20, 40, 12, 50, 10, 60, 12, 62, 20, 56, 16, 44, 16], "#1a1a1a", 1.4);
    p.ell(45, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(55, 27, 1.6, 1.6, "#1a1a1a", 0);
  },
  bespin: (c, W) => {
    const p = painter(c, W);
    legs(p, "#2a3a6a", BLACK);
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], "#3a5a9a");
    p.poly([32, 94, 68, 94, 68, 100, 32, 100], "#e8dcc0", 1);
    arms(p, "#3a5a9a", SKIN, { pistol: true });
    p.ell(50, 28, 12, 14, SKIN);
    p.ell(45, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(55, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.poly([36, 20, 38, 8, 50, 4, 62, 8, 64, 20, 58, 16, 42, 16], "#2a3a6a", 1.4);
  },
  weequay: (c, W) => {
    const p = painter(c, W);
    const skin = "#a8805a";
    legs(p, "#6a5a3a", "#3a2a1a");
    p.poly([28, 46, 72, 46, 72, 110, 28, 110], "#8a6a46");
    p.line([30, 50, 70, 100], 5, "#3a2a1a");
    arms(p, "#8a6a46", skin, { rifle: true, gun: "#3a2a1a" });
    p.ell(50, 28, 13, 16, skin);
    for (const y of [20, 26, 32, 38]) p.line([40, y, 60, y + 1], 1.2, "#7a5a3a");
    p.ell(45, 26, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(55, 26, 1.6, 1.6, "#1a1a1a", 0);
    p.line([48, 10, 44, 0], 3, "#2a1a10");
  },
  jabba: (c, W) => {
    const p = painter(c, W);
    // (100 x 90) the Hutt on his dais: the great slug, his little arms
    const skin = "#8a8a52";
    p.poly([4, 90, 10, 52, 22, 30, 40, 16, 60, 16, 76, 28, 90, 52, 96, 90], skin, 2.5);
    for (const y of [56, 66, 76]) p.line([14, y, 86, y + 2], 1.6, "#6a6a3a");
    p.ell(50, 34, 26, 18, "#9a9a5a");
    p.ell(40, 28, 5, 3.6, "#e8a020", 1.2);
    p.ell(60, 28, 5, 3.6, "#e8a020", 1.2);
    p.ell(40, 28, 2.4, 1.2, "#1a1a1a", 0);
    p.ell(60, 28, 2.4, 1.2, "#1a1a1a", 0);
    p.line([28, 42, 72, 42], 2.5, "#4a4a2a");
    p.poly([20, 56, 28, 52, 30, 64, 22, 66], skin);
    p.poly([72, 52, 80, 56, 78, 66, 70, 64], skin);
  },
  rancor: (c, W) => {
    const p = painter(c, W);
    // (100 x 110) out of its pit: head, shoulders, claws reaching
    const skin = "#8a6a4a";
    p.poly([10, 110, 14, 60, 30, 40, 70, 40, 86, 60, 90, 110], skin, 2.5);
    p.poly([2, 50, 16, 46, 24, 80, 12, 84], skin);
    p.poly([84, 46, 98, 50, 88, 84, 76, 80], skin);
    for (const x of [2, 8, 14]) p.line([x, 52, x - 4, 40], 2.5, "#e8dcc0");
    for (const x of [86, 92, 98]) p.line([x, 52, x + 4, 40], 2.5, "#e8dcc0");
    p.ell(50, 34, 20, 18, skin);
    p.poly([32, 38, 68, 38, 64, 54, 36, 54], "#3a1a10", 1.5);
    for (let k = 0; k < 7; k++) p.poly([34 + k * 5, 38, 36.5 + k * 5, 45, 39 + k * 5, 38], "#f0e8d8", 0);
    p.ell(42, 26, 2.6, 2.2, "#ffd23a", 0);
    p.ell(58, 26, 2.6, 2.2, "#ffd23a", 0);
  }
});
const PEOPLE = {
  gamorrean: [1.05, 2.0],
  scout: [0.9, 1.8],
  ewok: [0.62, 0.93],
  lando: [0.9, 1.8],
  bespin: [0.9, 1.8],
  weequay: [0.9, 1.8],
  jabba: [2.6, 2.34],
  rancor: [3.0, 3.3]
};
Object.assign(CARD_SIZE, PEOPLE);
for (const k of Object.keys(PEOPLE)) PERSON.add(k);
PLATE_SOUND.scout = "sizzle";

// ---- Outlines ----------------------------------------------------------------------

Object.assign(SHAPES, {
  // a skiff over the sand, two guards aboard, facing left
  skiff: {
    polys: [
      [0, 40, 10, 30, 120, 30, 124, 44, 110, 50, 12, 50],
      [30, 0, 44, 0, 46, 30, 28, 30],
      [72, 4, 86, 4, 88, 30, 70, 30],
      [31, -12, 43, -12, 45, 0, 29, 0],
      [73, -8, 85, -8, 87, 4, 71, 4]
    ],
    marks: [[3, 12, 36, 118, 36]]
  },
  // the carbonite slab with Han in it
  carbonite: {
    polys: [[0, 0, 60, 0, 60, 110, 0, 110]],
    marks: [
      [4, 30, 10, 30, 30],
      [4, 14, 30, 22, 50, 30, 46],
      [4, 46, 30, 40, 50, 30, 46],
      [3, 26, 60, 30, 100, 34, 60],
      [2, 8, 4, 8, 106],
      [2, 52, 4, 52, 106]
    ]
  }
});
PLATE_SOUND.skiff = "clank";
PLATE_SOUND.carbonite = "clank";

// ---- Flying things --------------------------------------------------------------

// A Bespin cloud car: two pods, the wing between, its engines.
function cloudcar(add) {
  for (const s of [-1, 1]) {
    add(BALL(0.6, 10), 0xe86a1a, s * 1.1, 0, -0.4, 0, 0, 0, 1, 1, 1.6);
    add(CYL(0.42, 0.42, 1.4, 10), 0xd8d8d0, s * 1.1, 0, 0.7, Math.PI / 2);
    add(BALL(0.32, 8), 0x2a3440, s * 1.1, 0.25, -1.1);
  }
  add(BOX(2.2, 0.15, 1.6), 0xd8d8d0, 0, 0, 0.2);
  add(BOX(0.6, 0.6, 1.2), 0xb8b8b0, 0, -0.2, 0.6);
}
GEO.cloudcar = asGeo(cloudcar);

// ---- Kinds ------------------------------------------------------------------------

const mover = (cardKey, h = 1.8, extra = {}) => ({
  ...gunman(cardKey, h),
  arrive: "blasterR",
  fires: 1.3,
  lose: "BLASTED!",
  ...extra
});
const dont = (cardKey, name, h = 1.8) => ({
  ...gunman(cardKey, h),
  pts: -25,
  sound: "wrong",
  ...DONT,
  name,
  arrive: undefined
});
const kinds = {
  gamorreanRun: { ...mover("gamorrean", 2.0), arrive: "roar", fires: 0, lose: "AXED!" },
  scoutRun: mover("scout"),
  weequayRun: mover("weequay"),
  ewokRun: dont("ewok", "YUB NUB! DON'T SHOOT THE EWOKS!", 0.95),
  landoRun: dont("lando", "DON'T SHOOT LANDO!"),
  bespinRun: dont("bespin", "CLOUD CITY GUARD! DON'T SHOOT!"),
  lukeRun2: dont("luke", "DON'T SHOOT LUKE!", 1.76),
  cloudcar: {
    ...thing("cloudcar", 0, 50, 1.3, "shatter", "fly", "boom"),
    boom: 2.6,
    flyby: "tie",
    name: "CLOUD CAR · 50"
  },
  skiff: {
    pts: 75,
    r: 1.2,
    hy: 0.9,
    dies: "fall",
    art: { plate: "skiff", tint: 0xc8b8a0, h: 2.6 },
    face: "slide",
    sound: "boom",
    boom: 2.5
  },
  skiffLuke: {
    pts: -25,
    r: 1.2,
    hy: 0.9,
    dies: "fall",
    art: { plate: "skiff", tint: 0xe8e0d0, h: 2.6 },
    face: "slide",
    sound: "wrong",
    ...DONT,
    name: "LUKE'S SKIFF! DON'T SHOOT!"
  }
};

// ---- Level 5: the detention block ---------------------------------------------------

const DET = { W: 8, FRONT: -11, BACK: 44, CEIL: 7, CELLS: [6, 12, 18, 24, 30, 36], DESK: 4, LIFT: 42 };
WORLDS.galaxy_detention = {
  sky: { top: "#000000", mid: "#02030a", horizon: "#05060c", ground: "#000000", seed: 201 },
  fog: 0x14161c,
  build(P) {
    const D = DET;
    const len = D.BACK + 0.3 - D.FRONT;
    const mid = (D.FRONT + D.BACK + 0.3) / 2;
    P.add(SLAB(2 * D.W + 0.6, 0.06, len), 0x2a2e34, 0, G - 0.03, mid);
    for (let u = -6; u <= 6; u += 3) P.add(SLAB(0.06, 0.02, len), 0x4a5058, u, G + 0.006, mid);
    P.add(SLAB(2 * D.W + 0.6, 0.3, len), 0x2a2c30, 0, G + D.CEIL + 0.15, mid);
    for (let f = -8; f < D.BACK; f += 4) P.add(BOX(2 * D.W, 0.08, 0.8), 0xe8f0ff, 0, G + D.CEIL - 0.05, f);
    for (const s of [-1, 1]) {
      const x = d => s * (D.W - d);
      P.add(SLAB(0.3, D.CEIL + 0.3, len), 0x3a3e46, s * (D.W + 0.15), G + D.CEIL / 2, mid);
      P.add(SLAB(0.06, 0.4, len), 0x1a1c20, x(0.03), G + 0.2, mid);
      P.add(SLAB(0.06, 0.15, len), 0xd84a3a, x(0.03), G + 5.8, mid);
      for (const f of D.CELLS) {
        // a cell door: its frame, the dark door, a panel of lights by it
        P.add(BOX(0.2, 2.8, 2.2), 0x6a7078, x(0.1), G + 1.4, f);
        P.add(BOX(0.08, 2.5, 1.8), 0x1a1c20, x(0.24), G + 1.25, f);
        P.add(BOX(0.06, 0.6, 0.4), 0x2a2e34, x(0.05), G + 1.5, f + 1.6);
        for (const [h, col] of [
          [1.65, 0xff4a3a],
          [1.5, 0x7fd18a],
          [1.35, 0xffd23a]
        ])
          P.add(BOX(0.04, 0.08, 0.08), col, x(0.08), G + h, f + 1.6);
      }
      for (let f = -6; f < D.BACK; f += 6) P.add(BOX(0.5, D.CEIL, 0.5), 0x2a2c32, x(0.25), G + D.CEIL / 2, f + 3);
    }
    // the guard post across the front, its consoles
    P.add(BOX(9, 1.1, 1.0), 0x4a4e56, 0, G + 0.55, D.DESK);
    P.add(BOX(9.2, 0.08, 1.2), 0x2a2c30, 0, G + 1.12, D.DESK);
    for (let k = 0; k < 6; k++)
      P.add(
        BOX(0.9, 0.5, 0.06),
        [0x3a6ae8, 0x7fd18a, 0xe8344a][k % 3],
        -3.6 + k * 1.45,
        G + 1.4,
        D.DESK + 0.35,
        -0.4,
        0,
        0
      );
    // the lift at the far end, its doors open
    P.add(BOX(2 * D.W + 0.6, D.CEIL + 0.3, 0.3), 0x3a3e46, 0, G + D.CEIL / 2, D.BACK + 0.15);
    P.add(BOX(3.6, 3.2, 0.1), 0x0e1014, 0, G + 1.6, D.BACK - 0.02);
    P.add(BOX(4.2, 0.3, 0.3), 0x8a9098, 0, G + 3.35, D.BACK - 0.1);
    for (const e of [-1, 1]) P.add(BOX(0.6, 3.2, 0.2), 0x8a9098, e * 2.1, G + 1.6, D.BACK - 0.1);
    // ceiling pipes, ducts, wall panels between the cells
    for (const s of [-1, 1])
      for (let f = -9; f < D.BACK; f += 3) {
        P.add(BOX(0.1, 1.6, 1.0), 0x4a4e56, s * (D.W - 0.06), G + 4.2, f);
        P.add(BOX(0.12, 0.25, 0.6), 0x8a9098, s * (D.W - 0.08), G + 4.2, f);
      }
    for (let k = -3; k <= 3; k++)
      P.add(
        CYL(0.12, 0.12, D.BACK - D.FRONT, 6),
        0x3a3e46,
        k * 1.6,
        G + D.CEIL - 0.35,
        (D.BACK + D.FRONT) / 2,
        Math.PI / 2
      );
    // the garbage chute's grate, cables, a trooper's dropped helmet
    P.add(BOX(1.4, 1.0, 0.1), 0x2a2c30, -D.W + 0.06, G + 0.7, 40, 0, Math.PI / 2, 0);
    for (let k = 0; k < 4; k++)
      P.add(CYL(0.05, 0.05, len, 4), 0x1a1c20, -D.W + 0.3, G + D.CEIL - 0.4 - k * 0.12, mid, Math.PI / 2);
    // floor grates, consoles along the walls
    for (let f = -8; f < D.BACK; f += 2) P.add(BOX(4, 0.02, 0.12), 0x4a5058, 0, G + 0.012, f);
    for (const s of [-1, 1])
      for (let f = -6; f < D.BACK; f += 6) {
        P.add(BOX(0.6, 1.0, 1.2), 0x4a4e56, s * (D.W - 0.4), G + 0.5, f + 1.5);
        P.add(BOX(0.05, 0.3, 0.8), 0x3a6ae8, s * (D.W - 0.72), G + 0.8, f + 1.5);
      }
  },
  slots: [],
  cover: null
};
LAYOUTS.galaxy_detention = L => {
  const D = DET;
  const fixed = { fixed: true, rail: false };
  L.row({ ...fixed, kind: "mouse", n: 4, f: 2.2, u0: -3, u1: 3, size: 0.36, tint: "steel", bank: 4 });
  L.row({
    ...fixed,
    kind: "helmet",
    n: 6,
    f: D.DESK + 0.1,
    u0: -4,
    u1: 4,
    base: 1.16,
    size: 0.32,
    tint: "white",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "crest",
    n: 4,
    f: 16,
    u0: -4.5,
    u1: 4.5,
    base: 4.4,
    size: 0.5,
    tint: "steel",
    bank: 4,
    rail: true
  });
  L.row({ ...fixed, kind: "helmet", n: 4, f: 28, u0: -3.6, u1: 3.6, size: 0.4, tint: "white", bank: 4 });
  L.row({
    ...fixed,
    kind: "crest",
    n: 3,
    f: D.BACK - 0.3,
    u0: -5.5,
    u1: 5.5,
    base: 4.4,
    size: 0.6,
    tint: "steel",
    bank: 3
  });
  for (const f of D.CELLS)
    L.pops({
      fixed: true,
      f: f - 0.4,
      at: [
        [-(D.W - 0.7), 0],
        [D.W - 0.7, 0]
      ],
      size: 1.8,
      busy: 0.6,
      kinds: [
        ["trooper", 60],
        ["officer", 12],
        ["leia", 14, { dont: true }],
        ["chewie", 7, { dont: true }],
        ["luke", 7, { dont: true }]
      ]
    });
  L.pops({
    fixed: true,
    f: D.DESK + 0.6,
    at: [
      [-2.5, 0],
      [2.5, 0]
    ],
    size: 1.75,
    kinds: [
      ["officer", 50, { pts: 50 }],
      ["trooper", 50]
    ]
  });
  L.pops({
    fixed: true,
    f: D.BACK - 0.6,
    at: [
      [-1, 0],
      [1, 0]
    ],
    size: 1.8,
    kinds: [
      ["trooper", 80],
      ["vader", 8, { pts: 250 }],
      ["gunner", 12]
    ]
  });
};
const detentionWave = (R, add, c) => {
  const D = DET;
  const lift = t =>
    add(
      t,
      "trooperRun",
      rush(
        R,
        [
          [R(-1, 1), D.BACK - 0.6, G],
          [R(-5, 5), R(8, 14), G]
        ],
        R(3, 4) * c.S
      )
    );
  const cell = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      R(0, 1) < 0.8 ? "trooperRun" : "officerRun",
      rush(
        R,
        [
          [s * (D.W - 0.7), pick(R, D.CELLS), G],
          [s * R(1, 5), R(7, 12), G]
        ],
        R(3, 4) * c.S
      )
    );
  };
  if (c.x2) {
    for (let k = 0; k < 10; k++) (k % 2 ? lift : cell)(1 + k * 2.3);
    for (let k = 0; k < 3; k++)
      add(
        4 + k * 6,
        "thermal",
        lobbed(R, { u: R(-2, 2), f: D.BACK - 2, h: G + 1.5, vh: R(3, 4), vu: R(-2, 2), vf: -R(5, 7) })
      );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) lift(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++) cell(R(1, 22));
  if (k === 2 || k === 5)
    add(R(2, 20), "mouse", cross(R, { u0: -(D.W - 0.5), u1: D.W - 0.5, f: R(6, 14), v: R(6, 8) * c.S, bob: 0.02 }));
  if (k === 1 || k === 4)
    add(
      R(2, 20),
      "thermal",
      lobbed(R, { u: R(-2, 2), f: D.BACK - 2, h: G + 1.5, vh: R(3, 4), vu: R(-2, 2), vf: -R(5, 7) })
    );
  if (R(0, 1) < 0.3) add(R(2, 18), "leiaRun", cross(R, { u0: -6, u1: 6, f: R(9, 14), v: 3 }));
  if (k === 3 && R(0, 1) < 0.5) add(R(2, 10), "vaderWalk", cross(R, { u0: -5, u1: 0, f: 30, v: 1.2, stop: 5 }));
};

// ---- Level 6: Cloud City ------------------------------------------------------------

const BES = { PAD: [0, 22, 12], WALK: 8 };
WORLDS.galaxy_bespin = {
  sky: {
    top: "#e8a070",
    mid: "#f8c8a0",
    horizon: "#ffe8c8",
    ground: "#f0b080",
    sun: [-30, 25, "#fff8e0", 14],
    clouds: 26,
    cloud: "rgba(255,230,210,0.7)",
    hills: [
      { colour: "#f4c8a8", height: 4, rough: 2 },
      { colour: "#f8d8b8", height: 2, rough: 1 }
    ],
    seed: 211
  },
  fog: 0xf8d0b0,
  build(P) {
    const [pu, pf, pr] = BES.PAD;
    // no ground: cloud below, the city's platforms over it
    for (let k = 0; k < 40; k++) {
      const a = k * 2.4;
      const r = 20 + ((k * 37) % 60);
      P.add(
        BALL(1, 8),
        k % 2 ? 0xf8d8c0 : 0xf0c8a8,
        Math.sin(a) * r,
        G - 8 - (k % 5),
        Math.abs(Math.cos(a)) * r + 4,
        0,
        a,
        0,
        9,
        2.5,
        6
      );
    }
    P.add(CYL(pr, pr * 0.8, 1.2, 32), 0xe8e4dc, pu, G - 0.6, pf);
    P.add(TORUS(pr, 0.15, 32), 0xc8c4bc, pu, G + 0.02, pf, Math.PI / 2);
    P.add(TORUS(pr * 0.5, 0.08, 24), 0xe86a1a, pu, G + 0.02, pf, Math.PI / 2);
    // the walkway out to it from under you, its railings
    P.add(SLAB(5, 0.4, pf - pr + 11), 0xe8e4dc, 0, G - 0.2, (pf - pr - 11) / 2);
    for (const s of [-1, 1]) {
      P.add(SLAB(0.08, 0.08, pf - pr + 11), 0xc8c4bc, s * 2.5, G + 1.0, (pf - pr - 11) / 2);
      for (let f = -9; f < pf - pr; f += 2.5) P.add(BOX(0.06, 1.0, 0.06), 0xc8c4bc, s * 2.5, G + 0.5, f);
    }
    // the city: white towers and domes either side, walkways between
    for (const [u, f, r, h] of [
      [-22, 16, 5, 10],
      [-30, 34, 7, 18],
      [-14, 46, 4, 8],
      [22, 14, 4.5, 12],
      [30, 30, 6, 16],
      [16, 48, 5, 9],
      [0, 62, 9, 22]
    ]) {
      P.add(CYL(r, r * 1.15, h, 16), 0xf0ece4, u, G - 6 + h / 2, f);
      P.add(BALL(r, 14), 0xe8e4dc, u, G - 6 + h, f, 0, 0, 0, 1, 0.45, 1);
      for (let k = 0; k < 3; k++)
        P.add(TORUS(r * 1.01 + k * 0.05, 0.08, 20), 0xa8b0c0, u, G - 6 + h * (0.3 + k * 0.25), f, Math.PI / 2);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        P.add(
          BOX(0.8, 1.0, 0.1),
          0x3a4a6a,
          u + Math.sin(a) * r * 1.02,
          G - 6 + h * 0.7,
          f - Math.cos(a) * r * 1.02,
          0,
          a,
          0
        );
      }
    }
    // antennae and lamps on the towers, a cloud car parked on the pad
    for (const [u, f, h] of [
      [-22, 16, 10],
      [22, 14, 12],
      [0, 62, 22]
    ]) {
      P.add(CYL(0.1, 0.1, 4, 5), 0xa8b0c0, u, G - 6 + h + 3, f);
      P.add(BALL(0.2, 6), 0xff4a3a, u, G - 6 + h + 5, f);
    }
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      P.add(BOX(0.3, 0.12, 0.3), 0xffe8a0, pu + Math.cos(a) * (pr - 0.4), G + 0.06, pf + Math.sin(a) * (pr - 0.4));
    }
    for (const [u0, f0, u1, f1] of [
      [-22, 16, -9, 20],
      [22, 14, 9, 19],
      [-30, 34, -14, 46]
    ]) {
      const len = Math.hypot(u1 - u0, f1 - f0);
      P.add(BOX(len, 0.3, 2), 0xe0dcd4, (u0 + u1) / 2, G - 0.6, (f0 + f1) / 2, 0, -Math.atan2(f1 - f0, u1 - u0), 0);
    }
  },
  slots: [],
  cover: null
};
LAYOUTS.galaxy_bespin = L => {
  const [, pf, pr] = BES.PAD;
  const fixed = { fixed: true, rail: false };
  L.row({ ...fixed, kind: "crest", n: 4, f: 3, u0: -1.8, u1: 1.8, base: 1.05, size: 0.36, tint: "steel", bank: 4 });
  L.row({ ...fixed, kind: "helmet", n: 6, f: pf - pr + 1.5, u0: -5, u1: 5, size: 0.4, tint: "white", bank: 3 });
  L.row({ ...fixed, kind: "mouse", n: 4, f: pf, u0: -4, u1: 4, size: 0.42, tint: "steel", bank: 4 });
  L.row({ ...fixed, kind: "crest", n: 4, f: pf + pr - 1, u0: -6, u1: 6, base: 0.4, size: 0.6, tint: "gold", bank: 4 });
  L.row({ ...fixed, kind: "carbonite", n: 1, f: 46, u0: -6, u1: -6, base: 2.0, size: 1.4, tint: "steel", pts: 100 });
  L.row({ ...fixed, kind: "helmet", n: 4, f: 61, u0: -6, u1: 6, base: 9, size: 0.7, tint: "white", bank: 4 });
  L.pops({
    fixed: true,
    f: pf - 2,
    at: [
      [-6, 0],
      [6, 0]
    ],
    size: 1.8,
    kinds: [
      ["trooper", 50],
      ["boba", 12, { pts: 150 }],
      ["bespin", 18, { dont: true }],
      ["lando", 10, { dont: true }],
      ["vader", 10, { pts: 250 }]
    ]
  });
  L.pops({
    fixed: true,
    f: pf + 4,
    at: [[0, 0]],
    size: 1.8,
    kinds: [
      ["trooper", 70],
      ["boba", 15, { pts: 150 }],
      ["leia", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 19,
    at: [
      [-13, 0.0],
      [13, 0.0]
    ],
    size: 1.7,
    kinds: [
      ["trooper", 60],
      ["bespin", 25, { dont: true }],
      ["lando", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 10,
    at: [
      [-17.5, 3.9],
      [17.6, 5.9]
    ],
    size: 1.6,
    period: [5, 8],
    kinds: [["trooper", 100, { pts: 25 }]]
  });
  L.pops({
    fixed: true,
    f: 47.5,
    at: [
      [-14, 2.0],
      [16, 3.0]
    ],
    size: 1.6,
    period: [5, 8],
    kinds: [
      ["trooper", 80, { pts: 50 }],
      ["boba", 20, { pts: 150 }]
    ]
  });
};
const bespinWave = (R, add, c) => {
  const [, pf, pr] = BES.PAD;
  const across_ = t =>
    add(t, "cloudcar", across(R, { v: R(14, 19) * c.S, h: R(2, 10), f: R(14, 45), weave: 2.5, amp: 0.8 }));
  const pad = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      "trooperRun",
      rush(
        R,
        [
          [s * R(4, 8), pf + R(2, 6), G],
          [s * R(0.5, 1.8), pf - pr - 1, G],
          [R(-1.5, 1.5), R(2, 6), G]
        ],
        R(3, 4) * c.S
      )
    );
  };
  if (c.x2) {
    for (let k = 0; k < 8; k++) across_(1 + k * 3);
    for (let k = 0; k < 6; k++) pad(2 + k * 3.6);
    add(
      6,
      "bobaRun",
      rush(
        R,
        [
          [6, pf + 4, G],
          [1, pf - pr - 1, G],
          [0, 4, G]
        ],
        2.6 * c.S
      )
    );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(2); j++) across_(R(1, 24));
  for (let j = 0; j < 1 + n(1.2); j++) pad(R(1, 22));
  if (k === 3)
    add(
      R(2, 12),
      "bobaRun",
      rush(
        R,
        [
          [-6, pf + 4, G],
          [-1, pf - pr - 1, G],
          [-1, 5, G]
        ],
        2.6 * c.S
      )
    );
  if (R(0, 1) < 0.3) add(R(2, 18), "landoRun", cross(R, { u0: -8, u1: 8, f: pf - 3, v: 2.6 }));
  if (R(0, 1) < 0.25) add(R(2, 18), "bespinRun", cross(R, { u0: 8, u1: -8, f: pf + 2, v: 2.2 }));
};

// ---- Level 7: Jabba's palace --------------------------------------------------------

const JAB = { W: 13, FRONT: -11, BACK: 50, CEIL: 10, DAIS: 44, PIT: [0, 16, 3.2] };
WORLDS.galaxy_jabba = {
  sky: { top: "#100a06", mid: "#160e08", horizon: "#1c120a", ground: "#100a06", seed: 221 },
  fog: 0x2a1a10,
  build(P) {
    const J = JAB;
    const len = J.BACK + 0.3 - J.FRONT;
    const mid = (J.FRONT + J.BACK + 0.3) / 2;
    P.add(SLAB(2 * J.W + 0.6, 0.06, len), 0x4a3a2a, 0, G - 0.03, mid);
    P.add(SLAB(2 * J.W + 0.6, 0.3, len), 0x3a2c20, 0, G + J.CEIL + 0.15, mid);
    for (const s of [-1, 1]) {
      const x = d => s * (J.W - d);
      P.add(SLAB(0.3, J.CEIL + 0.3, len), 0x6a5440, s * (J.W + 0.15), G + J.CEIL / 2, mid);
      for (let f = -6; f < J.BACK; f += 5) {
        P.add(BOX(0.8, J.CEIL, 1.2), 0x5a4634, x(0.4), G + J.CEIL / 2, f);
        P.add(BOX(0.3, 0.3, 0.3), 0xffb050, x(0.9), G + 3.2, f);
      }
      for (const f of [6, 18, 30]) P.add(BOX(0.12, 3.0, 2.4), 0x140c08, x(0.06), G + 1.5, f);
      // hangings, cages of the court's pets, the gallery up the walls
      for (let f = -3; f < J.BACK; f += 10) {
        P.add(BOX(0.06, 3.4, 1.6), [0x7a2a1a, 0x5a3a6a, 0x2a5a5a][Math.abs(f) % 3], x(0.85), G + 6, f);
        P.add(BOX(0.1, 0.2, 1.8), 0xc8a040, x(0.85), G + 7.8, f);
      }
      P.add(SLAB(2.2, 0.3, J.BACK - 4), 0x5a4634, x(1.1), G + 4.4, (J.BACK - 4) / 2 + 2);
      P.add(SLAB(0.08, 0.08, J.BACK - 4), 0x3a2c20, x(2.2), G + 5.4, (J.BACK - 4) / 2 + 2);
      for (let f = 4; f < J.BACK - 2; f += 3) P.add(BOX(0.06, 1.0, 0.06), 0x3a2c20, x(2.2), G + 4.9, f);
      for (const f of [10, 34]) {
        P.add(BOX(1.4, 1.6, 1.4), 0x2a2a28, x(2.6), G + 0.8, f);
        for (let k = 0; k < 5; k++) P.add(BOX(0.05, 1.6, 0.05), 0x8a8a8a, x(2.0 + k * 0.3), G + 0.8, f - 0.7);
      }
    }
    P.add(BOX(2 * J.W + 0.6, J.CEIL + 0.3, 0.3), 0x6a5440, 0, G + J.CEIL / 2, J.BACK + 0.15);
    // the dais, its steps, the curtain behind
    P.add(BOX(10, 1.0, 5), 0x5a4030, 0, G + 0.5, J.DAIS + 1);
    P.add(BOX(8, 0.5, 1), 0x5a4030, 0, G + 0.25, J.DAIS - 2);
    P.add(BOX(12, 6, 0.2), 0x7a2a1a, 0, G + 4, J.BACK - 0.1);
    for (let k = 0; k < 8; k++) P.add(BOX(0.1, 6, 0.3), 0x5a1a10, -5.25 + k * 1.5, G + 4, J.BACK - 0.25);
    // the trap door and the grate over the rancor's pit
    const [pu, pf, pr] = J.PIT;
    P.add(CYL(pr, pr, 0.04, 20), 0x1a1208, pu, G + 0.01, pf);
    for (let k = -2; k <= 2; k++) P.add(BOX(0.12, 0.06, 2 * pr), 0x6a6a6a, pu + k * 1.1, G + 0.04, pf);
    P.add(TORUS(pr, 0.12, 24), 0x6a6a6a, pu, G + 0.04, pf, Math.PI / 2);
    // Han in carbonite on the wall, the band's corner, cushions, hookah
    P.add(BOX(1.4, 2.6, 0.4), 0x5a6068, -J.W + 0.3, G + 2.0, 22, 0, Math.PI / 2, 0);
    for (const s2 of [-1, 1])
      for (let f = 2; f < J.BACK - 6; f += 8) P.add(CYL(0.5, 0.6, J.CEIL, 10), 0x6a5440, s2 * 6.5, G + J.CEIL / 2, f);
    P.add(CYL(2, 2, 0.4, 16), 0x5a4030, 9, G + 0.2, 34);
    for (const [u, f, c] of [
      [-6, 8, 0x8a2a4a],
      [-7, 9, 0x6a3a8a],
      [6, 7, 0x8a6a2a],
      [7.2, 8.2, 0x2a6a6a]
    ])
      P.add(BALL(0.6, 8), c, u, G + 0.3, f, 0, 0, 0, 1.4, 0.6, 1.1);
    P.add(CYL(0.25, 0.4, 1.2, 8), 0xc8a040, 3.6, G + 0.6, J.DAIS - 1);
    P.add(BALL(0.4, 8), 0x3a8a6a, 3.6, G + 1.4, J.DAIS - 1);
    // hanging lamps, bones on the floor, cushions round the hall
    for (let f = 4; f < J.BACK - 4; f += 6)
      for (const u of [-3.5, 3.5]) {
        P.add(CYL(0.02, 0.02, 2, 4), 0x2a1a10, u, G + J.CEIL - 1, f);
        P.add(BALL(0.3, 8), 0xffb050, u, G + J.CEIL - 2.1, f);
      }
    P.scatter(
      30,
      2,
      J.BACK - 6,
      (u, f, R) =>
        P.add(
          BALL(0.5, 8),
          [0x8a2a4a, 0x6a3a8a, 0x8a6a2a, 0x2a6a6a][Math.floor(R() * 4)],
          u,
          G + 0.25,
          f,
          0,
          R() * 3,
          0,
          1.4,
          0.6,
          1.1
        ),
      J.W - 3
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.galaxy_jabba = L => {
  const J = JAB;
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: ["glass", "mug"],
    n: 6,
    f: 3.2,
    u0: -4,
    u1: 4,
    base: 0.5,
    size: 0.3,
    tint: ["white", "gold"],
    bank: 3,
    rail: true
  });
  L.row({
    ...fixed,
    kind: "skull",
    n: 4,
    f: J.PIT[1] - J.PIT[2] - 0.4,
    u0: -3,
    u1: 3,
    size: 0.4,
    tint: "white",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "carbonite",
    n: 1,
    f: 22,
    u0: -(J.W - 0.6),
    u1: -(J.W - 0.6),
    base: 0.7,
    size: 2.4,
    tint: "steel",
    pts: 50
  });
  L.row({
    ...fixed,
    kind: ["bottle", "mug"],
    n: 6,
    f: J.DAIS - 1.6,
    u0: -3.6,
    u1: 3.6,
    base: 1.0,
    size: 0.32,
    tint: ["green", "gold"],
    bank: 3
  });
  L.row({ ...fixed, kind: "crest", n: 3, f: J.BACK - 0.4, u0: -5, u1: 5, base: 6.4, size: 0.6, tint: "gold", bank: 3 });
  L.pops({
    fixed: true,
    f: J.DAIS + 1.2,
    at: [[0, 1.0]],
    size: 2.0,
    period: [6, 9],
    kinds: [["jabba", 100, { pts: 150 }]]
  });
  L.pops({
    fixed: true,
    f: J.PIT[1] + 0.4,
    at: [[0, -1.6]],
    size: 3.0,
    period: [7, 10],
    kinds: [["rancor", 100, { pts: 200 }]]
  });
  for (const f of [6, 18, 30])
    L.pops({
      fixed: true,
      f,
      at: [
        [-(J.W - 0.7), 0],
        [J.W - 0.7, 0]
      ],
      size: 1.9,
      kinds: [
        ["gamorrean", 50],
        ["weequay", 20],
        ["boba", 8, { pts: 150 }],
        ["threepio", 11, { dont: true }],
        ["leia", 11, { dont: true }]
      ]
    });
  L.pops({
    fixed: true,
    f: 34.6,
    at: [[9, 0.4]],
    size: 1.75,
    kinds: [
      ["bith", 70, { dont: true }],
      ["gamorrean", 30]
    ]
  });
  L.pops({
    fixed: true,
    f: J.DAIS - 2.6,
    at: [
      [-6, 0.5],
      [6, 0.5]
    ],
    size: 1.9,
    kinds: [
      ["gamorrean", 70],
      ["weequay", 20],
      ["artoo", 10, { dont: true }]
    ]
  });
  L.row({
    ...fixed,
    kind: "skull",
    n: 3,
    f: 30,
    u0: -(J.W - 2.2),
    u1: -(J.W - 2.2),
    base: 5.45,
    size: 0.4,
    tint: "white"
  });
  L.row({ ...fixed, kind: "skull", n: 3, f: 30, u0: J.W - 2.2, u1: J.W - 2.2, base: 5.45, size: 0.4, tint: "white" });
  L.row({
    ...fixed,
    kind: ["glass", "bottle"],
    n: 4,
    f: 27,
    u0: -2.5,
    u1: 2.5,
    base: 0.75,
    size: 0.3,
    tint: ["white", "green"],
    bank: 4,
    rail: true
  });
};
const jabbaWave = (R, add, c) => {
  const J = JAB;
  const guard = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      R(0, 1) < 0.7 ? "gamorreanRun" : "weequayRun",
      rush(
        R,
        [
          [s * (J.W - 0.7), pick(R, [6, 18, 30]), G],
          [s * R(4, 9), R(3, 7), G]
        ],
        R(2.4, 3.2) * c.S
      )
    );
  };
  const drinks = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n,
        R(0, 1) < 0.5 ? "glassUp" : "mugUp",
        toss(R, { u: R(-4, 4), f: J.DAIS - 1.6, h: G + 1, vh: R(7, 9) * Math.min(1.2, c.S), vu: R(-2, 2) })
      );
  };
  if (c.x2) {
    for (let k = 0; k < 10; k++) guard(1 + k * 2.3);
    drinks(5);
    add(
      5,
      "bobaRun",
      rush(
        R,
        [
          [J.W - 0.7, 18, G],
          [4, 8, G],
          [2, 4, G]
        ],
        2.6 * c.S
      )
    );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.5); j++) guard(R(1, 22));
  if (k !== 2) drinks(3 + n(2));
  if (k === 3)
    add(
      R(2, 12),
      "bobaRun",
      rush(
        R,
        [
          [-(J.W - 0.7), 6, G],
          [-4, 6, G],
          [-3, 4, G]
        ],
        2.6 * c.S
      )
    );
  if (R(0, 1) < 0.3) add(R(2, 18), "droidRun", cross(R, { u0: -7, u1: 7, f: R(14, 18), v: 1.4 }));
};

// ---- Level 8: the sail barge -------------------------------------------------------

const SAR = { PIT: [0, 30, 6], BARGE: [16, 40] };
function sailBarge(add) {
  const c = 0xb8a07a;
  add(BOX(5, 2.4, 20), c, 0, 4, 0);
  add(BOX(4.2, 1.6, 4), c, 0, 4.2, -11.2, 0.5, 0, 0);
  add(BOX(5.2, 0.3, 20.4), 0x8a6a4a, 0, 5.3, 0);
  add(BOX(3.6, 2.2, 8), 0xa8906a, 0, 6.5, 3);
  for (let k = 0; k < 6; k++) add(BOX(5.4, 0.3, 0.2), 0x5a4a3a, 0, 3.4, -8 + k * 3.2);
  for (const z of [-4, 6]) {
    add(CYL(0.15, 0.15, 9, 6), 0x5a4030, 0, 10, z);
    add(BOX(0.06, 6, 5), 0xe8dcc0, 0.2, 10.5, z + 2.6);
  }
  for (const s of [-1, 1]) add(BOX(0.1, 0.7, 18), 0x5a4a3a, s * 2.6, 5.75, 0);
}
WORLDS.galaxy_sarlacc = {
  sky: {
    top: "#3a6aa8",
    mid: "#8ab4d8",
    horizon: "#f8e0b0",
    ground: "#d4a868",
    sun: [-40, 40, "#fff8e0", 10],
    suns: [[-26, 34, "#ffd49a", 7]],
    clouds: 2,
    hills: [
      { colour: "#d8a868", height: 4, rough: 1.2, phase: 2 },
      { colour: "#e0b478", height: 2, rough: 0.8 }
    ],
    seed: 231
  },
  fog: 0xe8cfa0,
  build(P) {
    const [pu, pf, pr] = SAR.PIT;
    P.ground(0xdcb070, [
      { u: pu, f: pf, r: pr + 3, c: 0xc8985a },
      { u: pu, f: pf, r: pr, c: 0xa8784a },
      { u: pu, f: pf, r: pr * 0.45, c: 0x5a2a1a }
    ]);
    // the Sarlacc: the beak ring of teeth, the tentacles
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2;
      P.add(
        CONE(0.18, 0.9, 5),
        0xf0e8d8,
        pu + Math.cos(a) * pr * 0.45,
        G + 0.4,
        pf + Math.sin(a) * pr * 0.45,
        Math.sin(a) * 0.4,
        0,
        -Math.cos(a) * 0.4
      );
    }
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      P.add(
        CYL(0.12, 0.2, 2.4, 6),
        0x8a4a3a,
        pu + Math.cos(a) * 1.6,
        G + 1.0,
        pf + Math.sin(a) * 1.6,
        Math.sin(a) * 0.6,
        0,
        -Math.cos(a) * 0.6
      );
    }
    sailBarge(kit(P, SAR.BARGE[0], SAR.BARGE[1], Math.PI + 0.5, 0));
    // dunes all round, a wrecked skiff on the sand, bones
    P.scatter(
      40,
      10,
      90,
      (u, f, R) =>
        Math.hypot(u - pu, f - pf) > pr + 6 &&
        P.add(
          BALL(1, 10),
          R() < 0.5 ? 0xe0b478 : 0xd4a468,
          u,
          G - 0.2,
          f,
          0,
          R() * 3,
          0,
          6 + R() * 6,
          1.2 + R() * 1.4,
          3 + R() * 2
        ),
      80,
      6
    );
    P.add(BOX(6, 0.4, 2), 0xa89070, -10, G + 0.4, 18, 0.2, 0.6, 0.15);
    for (const [u, f] of [
      [-14, 41],
      [-4, 41]
    ])
      P.add(BALL(1, 10), 0xd8a868, u, G - 0.4, f, 0, 0, 0, 2.6, 1.4, 1.6);
    P.scatter(
      40,
      4,
      60,
      (u, f, R) => Math.hypot(u - pu, f - pf) > pr + 2 && P.rock(u, f, 0.3 + R() * 0.5, 0xb8905a),
      50,
      4
    );
    for (let k = 0; k < 6; k++)
      P.add(
        new THREE.TorusGeometry(1.6 - k * 0.15, 0.08, 4, 8, Math.PI),
        0xe8dcc0,
        -18 + k * 0.9,
        G - 0.3,
        26,
        0,
        Math.PI / 2,
        0
      );
    P.scatter(
      40,
      40,
      95,
      (u, f, R) => P.add(BALL(1, 10), 0xdcb070, u, G - 0.3, f, 0, R() * 3, 0, 8 + R() * 6, 1 + R(), 4),
      85,
      10
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.galaxy_sarlacc = L => {
  const [, pf, pr] = SAR.PIT;
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "womprat", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.42, tint: "brown", bank: 3 });
  L.row({ kind: "helmet", n: 5, f: 12, u0: -6, u1: 6, base: 1.2, size: 0.42, tint: "white", bank: 5 });
  L.row({ ...fixed, kind: "skull", n: 6, f: pf - pr - 1, u0: -5, u1: 5, size: 0.45, tint: "white", bank: 3 });
  L.row({
    ...fixed,
    kind: "crest",
    n: 3,
    f: SAR.BARGE[1] - 4,
    u0: 12,
    u1: 16,
    base: 5.6,
    size: 0.55,
    tint: "gold",
    bank: 3
  });
  L.row({ kind: "helmet", n: 4, f: 52, u0: -10, u1: 2, base: 1.5, size: 0.6, tint: "white", bank: 4 });
  L.pops({
    fixed: true,
    f: SAR.BARGE[1] - 5,
    at: [
      [11.5, 5.5],
      [15.5, 5.5],
      [19, 5.5]
    ],
    size: 1.7,
    kinds: [
      ["weequay", 50],
      ["gamorrean", 25],
      ["boba", 10, { pts: 150 }],
      ["leia", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 18.6,
    at: [[-10, 0.3]],
    size: 1.8,
    kinds: [
      ["weequay", 70],
      ["lando", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 40,
    at: [
      [-14, 0],
      [-4, 0]
    ],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["weequay", 70, { pts: 50 }],
      ["gamorrean", 30, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 8,
    at: [
      [-7, 0],
      [7, 0]
    ],
    size: 1.8,
    kinds: [
      ["weequay", 60],
      ["sandtrooper", 30],
      ["jawa", 10, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 18.4,
    at: [[-7.6, 0.4]],
    size: 1.8,
    kinds: [
      ["weequay", 75],
      ["chewie", 25, { dont: true }]
    ]
  });
};
const sarlaccWave = (R, add, c) => {
  const skiff = (t, kind = "skiff") => add(t, kind, skim(R, { v: R(7, 10) * c.S, f: R(16, 42), h: R(1.8, 3.6) }));
  if (c.x2) {
    // the barge's deck gun, everyone on the skiffs
    for (let k = 0; k < 9; k++) skiff(1 + k * 2.6);
    skiff(10, "skiffLuke");
    add(
      6,
      "bobaRun",
      rush(
        R,
        [
          [10, SAR.BARGE[1] - 6, G],
          [4, 12, G],
          [3, 6, G]
        ],
        3 * c.S
      )
    );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.5); j++) skiff(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++)
    add(
      R(1, 22),
      "weequayRun",
      rush(
        R,
        [
          [pick(R, [-1, 1]) * R(14, 20), R(8, 20), G],
          [R(-6, 6), R(4, 7), G]
        ],
        R(3, 4) * c.S
      )
    );
  if (k === 2 || k === 5) skiff(R(2, 18), "skiffLuke");
  if (k === 1 || k === 4)
    for (let j = 0; j < 2; j++)
      add(
        R(2, 22),
        "thermal",
        lobbed(R, { u: R(10, 18), f: SAR.BARGE[1] - 5, h: G + 6, vh: R(2, 4), vu: -R(1, 3), vf: -R(5, 7) })
      );
  if (k === 0 || k === 3) flyers(["vulture", "vulture"], R, add, c, 2);
};

// ---- Level 9: Endor ----------------------------------------------------------------

const END = { BUNKER: [0, 46] };
function redwood(P, u, f, s = 1) {
  P.add(CYL(0.9 * s, 1.4 * s, 26, 8), 0x6a3a22, u, G + 13, f);
  P.add(CYL(1.6 * s, 2.0 * s, 1.2, 8), 0x5a3220, u, G + 0.6, f);
  for (let k = 0; k < 3; k++) P.add(CONE(3.2 * s, 5 * s, 7), 0x2a4a22, u, G + 20 + k * 3.2, f);
}
WORLDS.galaxy_endor = {
  sky: {
    top: "#5a8ab0",
    mid: "#a8c8d8",
    horizon: "#d8e8e0",
    ground: "#2a3a1e",
    sun: [10, 50, "#fffbe8", 9],
    planets: [{ az: 40, el: 30, r: 26, colour: "#c8a878", bands: [[-0.2, "#a88a5a", 0.12]], light: -0.5, dark: 0.6 }],
    clouds: 4,
    hills: [
      { colour: "#2a4a2a", height: 10, rough: 3, trees: true },
      { colour: "#1e3a1e", height: 5, rough: 2, trees: true }
    ],
    seed: 241
  },
  fog: 0x8aa890,
  build(P) {
    P.ground(0x2e4222, [
      { u: 0, f: 26, r: 4, c: 0x4a3a26, sx: 0.8, sz: 6 },
      { u: END.BUNKER[0], f: END.BUNKER[1] - 3, r: 8, c: 0x5a5040, sx: 1.4, sz: 0.6 }
    ]);
    for (const [u, f, s] of [
      [-10, 8, 1],
      [11, 10, 1.1],
      [-19, 18, 1.2],
      [17, 22, 1],
      [-8, 32, 1.1],
      [9, 34, 0.9],
      [-26, 36, 1.3],
      [24, 40, 1.2],
      [-15, 52, 1.1],
      [15, 54, 1],
      [-34, 58, 1.4],
      [32, 62, 1.3]
    ])
      redwood(P, u, f, s);
    // the Ewoks' platforms and bridges up the trees
    for (const [u, f] of [
      [-19, 18],
      [17, 22],
      [-26, 36]
    ]) {
      P.add(CYL(3.4, 3.4, 0.3, 12), 0x8a6a42, u, G + 9, f);
      P.add(CONE(1.6, 1.8, 8), 0x9a7a4a, u + 1.6, G + 10.5, f, 0, 0, 0);
      P.add(CYL(1.3, 1.3, 1.4, 8), 0x7a5a3a, u + 1.6, G + 9.8, f);
    }
    P.add(BOX(30, 0.15, 1.0), 0x8a6a42, -1, G + 9, 20, 0, -0.1, 0);
    // the bunker: its door in the hill, its dish
    const [bu, bf] = END.BUNKER;
    P.add(BALL(9, 14), 0x3a4a2a, bu, G - 2, bf + 3, 0, 0, 0, 1.4, 0.7, 1);
    P.add(BOX(6, 4, 2), 0x6a6e6a, bu, G + 2, bf);
    P.add(BOX(3.4, 3, 0.2), 0x2a2c2e, bu, G + 1.5, bf - 1.02);
    P.add(
      new THREE.SphereGeometry(4, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2.6),
      0x9aa0a8,
      bu + 8,
      G + 8,
      bf + 4,
      0.6,
      0,
      0
    );
    P.scatter(
      70,
      2,
      70,
      (u, f, R) =>
        Math.abs(u) > 3 &&
        P.add(BALL(0.9, 6), R() < 0.5 ? 0x3a5a2a : 0x2e4a24, u, G + 0.3, f, 0, R() * 3, 0, 1.4, 0.7, 1.2),
      60,
      3
    );
    P.scatter(
      30,
      4,
      60,
      (u, f, R) => Math.abs(u) > 4 && P.add(CYL(0.4, 0.45, 6, 6), 0x5a3a22, u, G + 0.4, f, Math.PI / 2, R() * 3, 0),
      50,
      4
    );
    P.scatter(
      40,
      2,
      50,
      (u, f, R) => Math.abs(u) > 3 && P.add(CONE(0.6, 1.2 + R(), 5), 0x2e5a2a, u, G + 0.5, f),
      50,
      3
    );
    for (let k = 0; k < 12; k++) P.add(BOX(0.4, 0.4, 0.4), 0x6a6e6a, -6 + k, G + 0.2, END.BUNKER[1] - 3);
  },
  slots: [],
  cover: null
};
LAYOUTS.galaxy_endor = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "helmet", n: 6, f: 4, u0: -4.5, u1: 4.5, base: 0.9, size: 0.38, tint: "white", bank: 3 });
  L.row({ kind: "crest", n: 4, f: 15, u0: -5, u1: 5, base: 1.6, size: 0.45, tint: "steel", perch: true });
  L.row({ ...fixed, kind: "helmet", n: 6, f: 20, u0: -12, u1: 10, base: 9.25, size: 0.4, tint: "white", bank: 3 });
  L.row({ kind: "probe", n: 3, f: 28, u0: -6, u1: 6, base: 1.8, size: 0.6, tint: "steel", perch: true });
  L.row({
    ...fixed,
    kind: "crest",
    n: 4,
    f: END.BUNKER[1] - 1.2,
    u0: -2.4,
    u1: 2.4,
    base: 4.2,
    size: 0.55,
    tint: "steel",
    bank: 4
  });
  for (const [u, f] of [
    [-19, 18],
    [17, 22],
    [-26, 36]
  ])
    L.pops({
      fixed: true,
      f: f - 3.2,
      at: [[u, 9.15]],
      size: 0.95,
      period: [5, 8],
      kinds: [["ewok", 100, { dont: true }]]
    });
  L.pops({
    fixed: true,
    f: END.BUNKER[1] - 1.2,
    at: [
      [-1, 0],
      [1, 0]
    ],
    size: 1.8,
    kinds: [
      ["trooper", 50, { pts: 50 }],
      ["scout", 30, { pts: 50 }],
      ["officer", 20, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 10.6,
    at: [
      [-10, 0],
      [11, 0]
    ],
    size: 1.8,
    kinds: [
      ["scout", 70],
      ["ewok", 15, { dont: true }],
      ["han", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 34.6,
    at: [
      [-8, 0],
      [9, 0]
    ],
    size: 1.8,
    kinds: [
      ["scout", 80],
      ["leia", 20, { dont: true }]
    ]
  });
};
const endorWave = (R, add, c) => {
  const bike = t => add(t, "speeder", skim(R, { v: R(18, 24) * c.S, f: R(6, 40), h: R(0.7, 1.4) }));
  const atst = t =>
    add(
      t,
      "atst",
      rush(
        R,
        [
          [R(-12, 12), R(46, 54), G],
          [R(-6, 6), R(10, 14), G]
        ],
        R(2.8, 3.4) * c.S
      )
    );
  if (c.x2) {
    for (let k = 0; k < 9; k++) bike(1 + k * 2.6);
    atst(2);
    atst(12);
    for (let k = 0; k < 3; k++) add(3 + k * 6, "ewokRun", cross(R, { u0: -10, u1: 10, f: R(8, 14), v: 2.4 }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(2); j++) bike(R(1, 24));
  if (k === 1 || k === 4) atst(R(1, 10));
  for (let j = 0; j < 1 + n(1); j++)
    add(
      R(1, 22),
      "scoutRun",
      rush(
        R,
        [
          [R(-3, 3), END.BUNKER[1] - 1.5, G],
          [R(-6, 6), R(5, 9), G]
        ],
        R(3.4, 4.2) * c.S
      )
    );
  if (R(0, 1) < 0.4) add(R(2, 18), "ewokRun", cross(R, { u0: 10, u1: -10, f: R(6, 14), v: 2.4 }));
};

// ---- Sound ------------------------------------------------------------------------

function bed(d, sr, R, o) {
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const x = R() * 2 - 1;
    lp += 0.015 * (x - lp);
    lp2 += 0.2 * (x - lp2);
    let v = lp * (o.wind || 0) * (0.6 + 0.4 * Math.sin((t * 2 * Math.PI) / 8));
    if (o.crowd) v += (lp2 - lp) * o.crowd * (0.5 + 0.3 * Math.sin(t * 2.9) + 0.2 * Math.sin(t * 4.7));
    if (o.hum) v += Math.sin(2 * Math.PI * o.hum[0] * t) * o.hum[1];
    if (o.birds) {
      const y = (t * 0.7) % 2;
      if (y < 0.3)
        v += Math.sin(2 * Math.PI * (2400 + 900 * Math.sin(y * 70)) * t) * o.birds * Math.sin((Math.PI * y) / 0.3);
    }
    d[i] += v;
  }
}
Object.assign(AMBIENCE, {
  galaxy_detention(d, sr, R) {
    bed(d, sr, R, { wind: 0.4, hum: [50, 0.05] });
    for (let i = 0; i < d.length; i++) {
      const y = (i / sr) % 4;
      if (y < 0.5) d[i] += Math.sin(2 * Math.PI * (600 + 300 * Math.sin(y * 12)) * (i / sr)) * 0.02;
    }
  },
  galaxy_bespin(d, sr, R) {
    bed(d, sr, R, { wind: 2.2, hum: [80, 0.01] });
  },
  galaxy_jabba(d, sr, R) {
    bed(d, sr, R, { wind: 0.4, crowd: 1.0, hum: [45, 0.03] });
  },
  galaxy_sarlacc(d, sr, R) {
    bed(d, sr, R, { wind: 2.4, hum: [30, 0.04] });
  },
  galaxy_endor(d, sr, R) {
    bed(d, sr, R, { wind: 1.0, birds: 0.03 });
  }
});

// ---- The levels --------------------------------------------------------------------

const level = o => ({ music: "", lasers: true, ...o });
export const GALAXY_MORE = {
  kinds,
  levels: [
    level({
      world: "galaxy_detention",
      name: "DETENTION BLOCK AA-23",
      story: "She's in cell 2187. Get her out",
      amb: "galaxy_detention",
      indoor: true,
      legend: "DARTH VADER 250 · DON'T SHOOT LEIA, LUKE OR CHEWIE",
      wave: detentionWave,
      title: (w, x2) => (x2 ? "THEY'RE COMING THROUGH! · DOUBLE POINTS" : null)
    }),
    level({
      world: "galaxy_bespin",
      name: "CLOUD CITY",
      story: "Lando's city in the clouds. It's a trap",
      amb: "galaxy_bespin",
      legend: "CLOUD CARS 50 · BOBA FETT 150 · HAN IN CARBONITE 100 · DON'T SHOOT LANDO OR HIS GUARDS",
      wave: bespinWave,
      title: (w, x2) => (x2 ? "THE EMPIRE'S TAKEN THE CITY · DOUBLE POINTS" : null)
    }),
    level({
      world: "galaxy_jabba",
      name: "JABBA'S PALACE",
      story: "Han's on Jabba's wall. Watch the trap door",
      amb: "galaxy_jabba",
      indoor: true,
      legend: "JABBA 150 · THE RANCOR 200 · DON'T SHOOT THE BAND, THE DROIDS OR LEIA",
      wave: jabbaWave,
      title: (w, x2) => (x2 ? "THE WHOLE COURT · DOUBLE POINTS" : null)
    }),
    level({
      world: "galaxy_sarlacc",
      name: "THE PIT OF CARKOON",
      story: "The sail barge, over the Sarlacc. Free them",
      amb: "galaxy_sarlacc",
      legend: "SKIFFS 75 · BOBA FETT 150 · DON'T SHOOT LUKE'S SKIFF",
      wave: sarlaccWave,
      title: (w, x2) => (x2 ? "INTO THE PIT! · DOUBLE POINTS" : null)
    }),
    level({
      world: "galaxy_endor",
      name: "THE FOREST MOON OF ENDOR",
      story: "Bring the shield down. The Ewoks are with us",
      amb: "galaxy_endor",
      legend: "SPEEDER BIKES 75 · AT-ST 75 · DON'T SHOOT THE EWOKS, HAN OR LEIA",
      wave: endorWave,
      title: (w, x2) => (x2 ? "THE BATTLE OF ENDOR · DOUBLE POINTS" : null)
    })
  ]
};
