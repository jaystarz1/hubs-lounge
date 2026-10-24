import * as THREE from "three";
import {
  GROUND,
  BOX,
  CYL,
  BALL,
  CONE,
  TORUS,
  SLAB,
  GEO,
  WORLDS,
  CARDS,
  CARD_SIZE,
  part,
  merge,
  person
} from "./shoots-art";
import { LAYOUTS, PERSON, SHATTER, PLATE_SOUND, span } from "./plates";
import { SHAPES, HORSE } from "./plates-shapes";
import { gunman, runner, thing, DONT, run, toss, walk, cross, stand, bounce, pick, flyers } from "./shoot-paths";

// The Wild West campaign (Jay, 2026-10-24: "start in the saloon, then have a
// gun fight in the streets and then a quick draw round that isn't 5k but
// pistols only, with two lanes, and then out on the trail at a camp site ...
// on the trail of Pancho Villa ... we are marshals"). Five levels:
//   1 THE SILVER SPUR SALOON   (the saloon world, shoots.js SCREEN.saloon)
//   2 GUNFIGHT ON MAIN STREET  you're on the hotel roof across the street:
//                              gunmen in the windows, on the roofs, behind
//                              the barrels; riders down the street; dynamite
//                              off the roofs (shoot it before it lands)
//   3 QUICK DRAW AT HIGH NOON  a corral, two lanes, an outlaw in each; on
//                              DRAW! the faster the shot the more it's worth,
//                              too soon costs you, too slow and he gets you;
//                              pistols only, twelve draws, then on
//   4 THE CAMP ON THE TRAIL    the gang's camp at dusk on the way to the Rio
//                              Grande: the fire, tents, the chuck wagon, a
//                              rock ridge and the mesas; coyotes, riders,
//                              the gang coming out of the dark
//   5 VILLA'S HACIENDA         across the river: the adobe walls, the gate,
//                              the mission's bell tower, and Villa himself
//                              on the balcony now and then
// Everything below is laid out as the other worlds are (u right, f downrange,
// h up from the roof deck, the ground at GROUND); shoots-art moves it all
// SHIFT m back and onto the lifted land.

const G = GROUND;

// ---- New outlines (the plates' atlas) ------------------------------------------

Object.assign(SHAPES, {
  // a horse and rider at the gallop, facing left
  rider: {
    polys: [
      HORSE,
      [56, 41, 70, 41, 69, 16, 58, 16],
      [58, 5, 68, 5, 67, -3, 59, -3],
      [59, 4, 67, 4, 69, 9, 67, 15, 59, 15, 57, 9]
    ],
    lines: [
      [3.5, 51, 4.5, 75, 4.5],
      [3.5, 59, 21, 46, 30],
      [5, 62, 41, 60, 57, 55, 60],
      [3, 68, 20, 77, 12, 82, 7]
    ]
  },
  can: {
    polys: [[0, 0, 40, 0, 40, 60, 0, 60]],
    marks: [
      [4, 0, 9, 40, 9],
      [4, 0, 51, 40, 51]
    ]
  },
  lantern: {
    polys: [[14, 0, 26, 0, 26, 6, 34, 10, 36, 20, 36, 56, 32, 62, 8, 62, 4, 56, 4, 20, 6, 10, 14, 6]],
    lines: [[3, 12, 3, 20, -7, 28, 3]],
    marks: [
      [3, 4, 20, 36, 20],
      [3, 4, 52, 36, 52],
      [3, 20, 20, 20, 52]
    ]
  },
  skull: {
    polys: [
      [
        0, 6, 14, 10, 30, 16, 44, 18, 52, 16, 68, 16, 76, 18, 90, 16, 106, 10, 120, 6, 110, 18, 94, 28, 80, 30, 76, 46,
        70, 70, 66, 84, 54, 84, 50, 70, 44, 46, 40, 30, 26, 28, 10, 18
      ]
    ],
    dots: [
      [51, 40, 5],
      [69, 40, 5]
    ],
    marks: [
      [3, 56, 66, 57, 76],
      [3, 64, 66, 63, 76]
    ]
  },
  bell: {
    polys: [
      [
        30, 0, 40, 0, 40, 8, 52, 12, 60, 24, 62, 50, 66, 66, 76, 76, 76, 82, -6, 82, -6, 76, 4, 66, 8, 50, 10, 24, 18,
        12, 30, 8
      ],
      [31, 82, 39, 82, 39, 91, 31, 91]
    ],
    marks: [[3, 2, 72, 68, 72]]
  },
  olla: {
    polys: [
      [30, 0, 50, 0, 50, 8, 46, 12, 62, 22, 72, 40, 70, 62, 58, 78, 22, 78, 10, 62, 8, 40, 18, 22, 34, 12, 30, 8]
    ],
    marks: [
      [3, 10, 44, 70, 44],
      [3, 14, 52, 66, 52]
    ]
  }
});
for (const k of ["can", "lantern", "olla"]) SHATTER.add(k);
PLATE_SOUND.lantern = "glass";
PLATE_SOUND.olla = "glass";
PLATE_SOUND.bell = "bell";
PLATE_SOUND.can = "ping";

// ---- New cut-outs ------------------------------------------------------------------

Object.assign(CARDS, {
  bandit: (c, W, H) =>
    person(c, W, H, {
      body: "#e8dcc0",
      legs: "#5a4a3a",
      hat: "#c8a060",
      sombrero: true,
      hatBand: "#c0182a",
      bandolier: "#5a3a1a",
      tache: true,
      hair: "#1a120c",
      skin: "#c89468",
      belt: "#3a2414",
      gun: true
    }),
  bandit2: (c, W, H) =>
    person(c, W, H, {
      body: "#8a5a3a",
      legs: "#3a3a3a",
      hat: "#5a3a20",
      sombrero: true,
      hatBand: "#f2c230",
      poncho: "#b8402a",
      stripe: "#f2c230",
      stripe2: "#2f6a8a",
      tache: true,
      hair: "#151515",
      skin: "#b88458",
      gun: true
    }),
  rifleman: (c, W, H) =>
    person(c, W, H, {
      body: "#6a6a52",
      legs: "#3a3a2a",
      vest: "#3a2a1a",
      hat: "#3a2a1a",
      stetson: true,
      bandana: "#2f4a8a",
      masked: true,
      belt: "#2a1a10",
      gun: true,
      guns2: true
    }),
  villa: (c, W, H) =>
    person(c, W, H, {
      body: "#7a5230",
      vest: "#3a2414",
      legs: "#3a2a1a",
      hat: "#e0c890",
      sombrero: true,
      hatBand: "#3a2414",
      bandolier: "#4a2a10",
      tache: true,
      hair: "#151515",
      skin: "#c89468",
      belt: "#2a1a10",
      gun: true,
      guns2: true
    }),
  townsman: (c, W, H) =>
    person(c, W, H, {
      body: "#3a3a4a",
      vest: "#7a6a5a",
      shirt: "#f4efe2",
      tie: "#5a1a1a",
      legs: "#3a3a4a",
      hat: "#2a2a2a",
      tache: true,
      hair: "#8a8a8a",
      armsUp: true
    }),
  padre: (c, W, H) =>
    person(c, W, H, {
      body: "#151515",
      legs: "#151515",
      collar: "#ffffff",
      hair: "#6a5a4a",
      skin: "#e0b890",
      armsUp: true
    }),
  wanted: (c, W, H) => {
    c.fillStyle = "#e8d8b0";
    c.fillRect(0, 0, W, H);
    c.strokeStyle = "#5a3a20";
    c.lineWidth = 8;
    c.strokeRect(6, 6, W - 12, H - 12);
    c.fillStyle = "#2a1a10";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `900 ${Math.round(W * 0.2)}px serif`;
    c.fillText("WANTED", W / 2, H * 0.13, W - 24);
    c.fillStyle = "#c8b088";
    c.fillRect(W * 0.2, H * 0.22, W * 0.6, H * 0.45);
    c.fillStyle = "#3a2a1a";
    c.beginPath();
    c.arc(W / 2, H * 0.4, W * 0.15, 0, Math.PI * 2);
    c.fill();
    c.fillRect(W * 0.3, H * 0.52, W * 0.4, H * 0.15);
    c.beginPath();
    c.ellipse(W / 2, H * 0.3, W * 0.28, H * 0.025, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#2a1a10";
    c.font = `900 ${Math.round(W * 0.15)}px serif`;
    c.fillText("$500", W / 2, H * 0.78, W - 24);
    c.font = `700 ${Math.round(W * 0.08)}px serif`;
    c.fillText("DEAD OR ALIVE", W / 2, H * 0.9, W - 24);
  }
});
Object.assign(CARD_SIZE, {
  bandit: [0.9, 1.8],
  bandit2: [0.9, 1.8],
  rifleman: [0.9, 1.8],
  villa: [0.9, 1.8],
  townsman: [0.9, 1.8],
  padre: [0.9, 1.8],
  wanted: [0.6, 0.8]
});
for (const k of ["bandit", "bandit2", "rifleman", "villa", "townsman", "padre", "wanted"]) PERSON.add(k);

// ---- New thrown things -------------------------------------------------------------

GEO.tumbleweed = () => {
  const P = [];
  let a = 7;
  const R = () => ((a = (a * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let k = 0; k < 26; k++) {
    P.push(
      part(
        BOX(0.025, 0.025, 0.85),
        k % 3 ? 0xb89a62 : 0x8a7048,
        R() * 0.12,
        R() * 0.12,
        R() * 0.12,
        R() * 3,
        R() * 3,
        R() * 3
      )
    );
  }
  P.push(part(BALL(0.3, 6), 0x9a7e50, 0, 0, 0, 0, 0, 0, 1, 0.9, 1));
  return merge(P);
};
GEO.dynamite = () =>
  merge([
    part(CYL(0.045, 0.045, 0.32, 8), 0xc0182a, 0, 0, 0, 0, 0, Math.PI / 2, 1, 1, 1, 0.4),
    part(CYL(0.046, 0.046, 0.04, 8), 0xf4efe2, 0.1, 0, 0, 0, 0, Math.PI / 2),
    part(CYL(0.006, 0.006, 0.12, 4), 0x2a2a2a, -0.2, 0.02, 0, 0, 0, 1.0),
    part(BALL(0.035, 5), 0xffe27a, -0.25, 0.06, 0)
  ]);

// ---- Kinds -----------------------------------------------------------------------

// A gang member on the move: a cut-out like the saloon's gunmen (50).
const mover = (cardKey, extra = {}) => ({ ...gunman(cardKey, 1.8), ...extra });
const duelist = (cardKey, extra = {}) => ({
  ...gunman(cardKey, 1.85),
  pts: 50, // (the most: the faster the shot after DRAW!, skeet.js duelPoints)
  penalty: 50,
  lose: "TOO SLOW!",
  ...extra
});
const kinds = {
  banditRun: mover("bandit"),
  bandit2Run: mover("bandit2"),
  riflemanRun: mover("rifleman"),
  townRun: { ...mover("townsman"), pts: -25, sound: "wrong", ...DONT },
  ladyRun: { ...mover("lady"), pts: -25, sound: "wrong", ...DONT },
  padreRun: { ...mover("padre"), pts: -25, sound: "wrong", ...DONT },
  rider: { ...runner("rider", 0xc8884a, 2.4, 0.8, "thud"), hy: 1.4 },
  riderB: { ...runner("rider", 0x8a6a4a, 2.4, 0.8, "thud"), hy: 1.4 },
  villaRider: { ...runner("rider", 0xffc93c, 2.5, 0.8, "thud"), hy: 1.45, pts: 300, name: "PANCHO VILLA!" },
  coyote: { ...runner("wolf", 0xc8a070, 0.8, 0.5, "thud") },
  tumbleweed: thing("tumbleweed", 0, 25, 0.45, "shatter", "tumble", "thud"),
  // dynamite thrown at you: shoot it before it lands (it costs everyone 10)
  dynamite: {
    ...thing("dynamite", 0, 25, 0.2, "shatter", "tumble", "clank"),
    arrive: "shot",
    blast: true,
    lose: "BOOM!"
  },
  // the quick draw
  duelist: duelist("gunslinger"),
  duelistB: duelist("bandit"),
  duelistC: duelist("cowboy"),
  duelistD: duelist("bandit2"),
  eltigre: duelist("outlaw", { name: "EL TIGRE", penalty: 100 }),
  laneLady: { ...mover("lady"), pts: -50, sound: "wrong", ...DONT, name: "HOLD YOUR FIRE!" },
  laneTown: { ...mover("townsman"), pts: -50, sound: "wrong", ...DONT, name: "HOLD YOUR FIRE!" }
};

// ---- Paths ------------------------------------------------------------------------

// Out of a doorway (or from the dark, or across the ford) to a spot in front
// of you; a gunman stops there, draws, and it costs everyone up there 10.
function rush(R, pts, v, gun = true) {
  const w = walk(pts, v);
  if (!gun) return { dur: w.time + 0.5, pos: w.pos };
  return { dur: w.time + 2, charge: true, arrive: w.time + 0.8, pos: w.pos };
}
// Thrown at you; if it lands it goes off (charge: everyone up there pays).
function lobbed(R, o) {
  const L = toss(R, o);
  return { ...L, charge: true, arrive: L.dur - 0.05 };
}

// ---- Level 2: Main Street ------------------------------------------------------------

// You're on the roof across from the far side of the street; its fronts face
// you at f F, the porch roofs (balconies upstairs) out to f PORCH. A cross
// street runs away between the blocks to the mission church at its end.
const ST = { F: 13, D: 8, PORCH: 10.5, CROSS: 4, CHURCH: 56 };
// [u from, u to, sign, storeys, wall, trim, roof]
const BLOCKS = [
  [-36, -27, "LIVERY STABLE", 1, 0x8a3a2a, 0xe8dcc0, 0x4a2a1a],
  [-27, -19, "GENERAL STORE", 1, 0xa88a5a, 0x5a3a20, 0x5a4a3a],
  [-19, -11, "BANK", 2, 0x9a5a4a, 0xe8dcc0, 0x3a2a2a],
  [-11, -4, "SHERIFF", 1, 0x7a6a5a, 0xf2e2b8, 0x4a3a2a],
  [4, 14, "HOTEL", 2, 0x6a8a9a, 0xf4efe2, 0x3a3a3a],
  [14, 22, "SALOON", 2, 0xb8884a, 0x5a2a1a, 0x4a2a1a],
  [22, 29, "UNDERTAKER", 1, 0x5a5a5a, 0x1a1a1a, 0x2a2a2a],
  [29, 36, "GUNSMITH", 1, 0x9a7a4a, 0x3a2414, 0x4a3a2a]
];
const bodyH = st => (st === 2 ? 7 : 4.2);
const frontH = st => (st === 2 ? 8.6 : 6.0);
const doorOf = b => (b[0] + b[1]) / 2;
const lowerWindows = b => (b[1] - b[0] >= 7 ? [-1, 1].map(s => doorOf(b) + s * ((b[1] - b[0]) / 2 - 1.6)) : []);
const upperWindows = b => (b[3] === 2 ? (b[1] - b[0] >= 9.5 ? [-3, 0, 3] : [-2, 2]).map(d => doorOf(b) + d) : []);

const DARK = 0x1a120c;

function window_(P, u, h0, f, w = 1.3, h = 1.6) {
  P.add(BOX(w + 0.24, h + 0.24, 0.08), 0xe8dcc0, u, G + h0 + h / 2, f - 0.03);
  P.add(BOX(w, h, 0.1), 0x24303a, u, G + h0 + h / 2, f - 0.05);
  P.add(BOX(0.06, h, 0.12), 0xe8dcc0, u, G + h0 + h / 2, f - 0.06);
  P.add(BOX(w, 0.06, 0.12), 0xe8dcc0, u, G + h0 + h / 2, f - 0.06);
}

function saguaro(P, u, f, s = 1) {
  const c = 0x4a7a3a;
  P.add(CYL(0.28 * s, 0.32 * s, 5 * s, 7), c, u, G + 2.5 * s, f);
  P.add(BALL(0.28 * s, 6), c, u, G + 5 * s, f);
  for (const [side, h, len] of [
    [-1, 2.2, 1.6],
    [1, 2.9, 1.2]
  ]) {
    P.add(CYL(0.2 * s, 0.2 * s, 0.9 * s, 6), c, u + side * 0.55 * s, G + h * s, f, 0, 0, Math.PI / 2);
    P.add(CYL(0.2 * s, 0.2 * s, len * s, 6), c, u + side * 1.0 * s, G + (h + len / 2) * s, f);
    P.add(BALL(0.2 * s, 5), c, u + side * 1.0 * s, G + (h + len) * s, f);
  }
}

function barrel(P, u, f, c = 0x7a4a26) {
  P.add(CYL(0.36, 0.33, 0.95, 10), c, u, G + 0.475, f);
  for (const h of [0.15, 0.8]) P.add(CYL(0.37, 0.37, 0.05, 10), 0x2a2a2a, u, G + h, f);
}

function wagon(P, u, f, covered = false, ry = 0) {
  const at = (x, z) => [u + x * Math.cos(ry) + z * Math.sin(ry), f - x * Math.sin(ry) + z * Math.cos(ry)];
  const [cu, cf] = at(0, 0);
  P.add(BOX(3.6, 0.6, 1.6), 0x7a5232, cu, G + 1.05, cf, 0, ry, 0);
  for (const [x, z] of [
    [-1.3, -0.85],
    [1.3, -0.85],
    [-1.3, 0.85],
    [1.3, 0.85]
  ]) {
    const [wu, wf] = at(x, z);
    P.add(TORUS(0.55, 0.06, 14), 0x3a2414, wu, G + 0.6, wf, 0, ry, 0);
    P.add(CYL(0.06, 0.06, 1.1, 5), 0x3a2414, wu, G + 0.6, wf, 0, ry, Math.PI / 2);
  }
  if (covered) {
    for (let k = 0; k < 5; k++) {
      const [hu, hf] = at(-1.4 + k * 0.7, 0);
      P.add(new THREE.TorusGeometry(0.87, 0.04, 4, 10, Math.PI), 0xf0e6cc, hu, G + 1.35, hf, 0, ry + Math.PI / 2, 0);
    }
    P.add(
      new THREE.CylinderGeometry(0.86, 0.86, 3, 12, 1, true, 0, Math.PI),
      0xe8dcc0,
      cu,
      G + 1.35,
      cf,
      0,
      ry,
      Math.PI / 2
    );
  }
}

function horse(P, u, f, ry = 0, c = 0x6a4428) {
  const dx = Math.cos(ry);
  const dz = -Math.sin(ry);
  P.add(BOX(1.7, 0.7, 0.55), c, u, G + 1.35, f, 0, ry, 0);
  P.add(BOX(0.35, 0.9, 0.3), c, u + dx * 0.95, G + 1.85, f + dz * 0.95, 0, ry, 0.6);
  P.add(BOX(0.55, 0.28, 0.26), c, u + dx * 1.3, G + 2.2, f + dz * 1.3, 0, ry, 0.3);
  for (const [x, z] of [
    [-0.65, -0.18],
    [0.65, -0.18],
    [-0.65, 0.18],
    [0.65, 0.18]
  ])
    P.add(BOX(0.14, 1.0, 0.14), c, u + dx * x - dz * z, G + 0.5, f + dz * x + dx * z, 0, ry, 0);
  P.add(BOX(0.12, 0.7, 0.1), 0x2a1a10, u - dx * 0.9, G + 1.3, f - dz * 0.9, 0, ry, -0.4);
}

function fence(P, u0, u1, f, posts = 2.4, c = 0x7a5a3a) {
  const len = Math.abs(u1 - u0);
  const mid = (u0 + u1) / 2;
  for (const h of [0.55, 1.05]) P.add(BOX(len, 0.1, 0.08), c, mid, G + h, f);
  const n = Math.max(1, Math.round(len / posts));
  for (let k = 0; k <= n; k++) P.add(BOX(0.14, 1.3, 0.14), c, u0 + ((u1 - u0) * k) / n, G + 0.65, f);
}
// A split-rail fence running away from you along f.
function fenceF(P, u, f0, f1, c = 0x7a5a3a) {
  const len = f1 - f0;
  for (const h of [0.55, 1.05]) P.add(SLAB(0.08, 0.1, len), c, u, G + h, (f0 + f1) / 2);
  for (let f = f0; f <= f1 + 0.01; f += 2) P.add(BOX(0.14, 1.3, 0.14), c, u, G + 0.65, f);
}

function waterTower(P, u, f) {
  for (const [a, b] of [
    [-1.4, -1.4],
    [1.4, -1.4],
    [-1.4, 1.4],
    [1.4, 1.4]
  ])
    P.add(CYL(0.12, 0.16, 9, 5), 0x5a4a3a, u + a, G + 4.5, f + b);
  P.add(CYL(2.4, 2.4, 3.6, 14), 0x8a6a4a, u, G + 10.8, f);
  for (const h of [9.4, 10.8, 12.2]) P.add(CYL(2.43, 2.43, 0.08, 14), 0x2a2a2a, u, G + h, f);
  P.add(CONE(2.7, 1.4, 14), 0x5a4a3a, u, G + 13.3, f);
}

function windmill(P, u, f) {
  for (const s of [-1, 1]) {
    P.add(BOX(0.12, 10.5, 0.12), 0x8a8a8a, u + s * 0.9, G + 5.1, f + 0.9, 0.08, 0, -s * 0.08);
    P.add(BOX(0.12, 10.5, 0.12), 0x8a8a8a, u + s * 0.9, G + 5.1, f - 0.9, -0.08, 0, -s * 0.08);
  }
  const hub = G + 10.6;
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    P.add(
      BOX(0.28, 2.0, 0.03),
      0xd8d0c0,
      u + Math.cos(a) * 1.2,
      hub + Math.sin(a) * 1.2,
      f - 0.4,
      0,
      0,
      a - Math.PI / 2
    );
  }
  P.add(BOX(0.12, 0.6, 2.2), 0xc0182a, u, hub, f + 1.2);
}

const STREET_SIGNS = BLOCKS.map(b => {
  const w = Math.min(b[1] - b[0] - 1.2, 7);
  return [b[2], doorOf(b), frontH(b[3]) - 1.0 + G, ST.F - 0.15, w, 0.95, "#2a1a10", "#f2e2b8"];
});

WORLDS.street = {
  sky: {
    top: "#3a5a8a",
    mid: "#8aa0b0",
    horizon: "#f2b878",
    ground: "#6a4a2a",
    sun: [-60, 12, "#fff0c0", 16],
    clouds: 7,
    cloud: "rgba(255,230,200,0.5)",
    hills: [
      { colour: "#9a5a3a", height: 9, rough: 2, phase: 1 },
      { colour: "#7a4a32", height: 5, rough: 3 }
    ],
    seed: 51
  },
  fog: 0xc8a078,
  signs: [...STREET_SIGNS, ["SAN ELIZARIO", 0, G + 3.3, ST.CHURCH - 3.3, 3.0, 0.6, "#e8e0d0", "#3a2414"]],
  build(P) {
    P.ground(0xb08a5a, [
      { u: 0, f: 5.5, r: 12, c: 0xc49a66, sx: 4, sz: 0.5 },
      { u: 0, f: 34, r: 8, c: 0xc49a66, sx: 0.5, sz: 3 }
    ]);
    // the far side: a boardwalk, porches, false fronts
    for (const b of BLOCKS) {
      const [a, z, , st, wall, trim, roof] = b;
      const w = z - a;
      const mid = (a + z) / 2;
      const body = bodyH(st);
      const top = frontH(st);
      P.add(BOX(w - 0.1, body, ST.D), wall, mid, G + body / 2, ST.F + ST.D / 2);
      P.add(BOX(w + 0.2, 0.25, ST.D + 0.4), roof, mid, G + body + 0.12, ST.F + ST.D / 2 + 0.1, -0.06);
      P.add(BOX(w, top, 0.25), wall, mid, G + top / 2, ST.F + 0.12);
      P.add(BOX(w + 0.3, 0.25, 0.5), trim, mid, G + top + 0.12, ST.F + 0.1);
      // (a stepped top on the two-storeys)
      if (st === 2) P.add(BOX(w * 0.4, 0.8, 0.25), wall, mid, G + top + 0.5, ST.F + 0.12);
      for (const k of [0.25, 0.75]) P.add(BOX(w, 0.06, 0.1), trim, mid, G + top * k + 0.6, ST.F - 0.02);
      // door, windows
      const d = doorOf(b);
      P.add(BOX(1.5, 2.5, 0.08), DARK, d, G + 0.4 + 1.25, ST.F - 0.03);
      P.add(BOX(1.8, 0.14, 0.12), trim, d, G + 2.95, ST.F - 0.04);
      if (b[2] === "LIVERY STABLE") P.add(BOX(3.6, 3.4, 0.06), 0x3a1a10, d, G + 2.1, ST.F - 0.02);
      for (const u of lowerWindows(b)) window_(P, u, 1.1, ST.F);
      for (const u of upperWindows(b)) window_(P, u, 4.4, ST.F, 1.2, 1.8);
      // porch: deck, posts, roof (upstairs: the balcony, with a railing)
      P.add(BOX(w, 0.12, ST.F - ST.PORCH + 0.3), 0x8a6a46, mid, G + 0.4, (ST.F + ST.PORCH) / 2);
      P.add(BOX(w, 0.4, 0.12), 0x5a4026, mid, G + 0.2, ST.PORCH);
      const posts = Math.max(2, Math.round(w / 3) + 1);
      for (let k = 0; k < posts; k++) {
        const u = a + 0.25 + ((w - 0.5) * k) / (posts - 1);
        P.add(BOX(0.16, 2.9, 0.16), 0x5a4026, u, G + 0.4 + 1.45, ST.PORCH + 0.1);
      }
      P.add(BOX(w + 0.1, 0.14, ST.F - ST.PORCH + 0.4), 0x5a4026, mid, G + 3.37, (ST.F + ST.PORCH) / 2, 0.05);
      if (st === 2) {
        P.add(BOX(w, 0.08, 0.08), 0xe8dcc0, mid, G + 4.4, ST.PORCH + 0.05);
        for (let u = a + 0.2; u < z; u += 0.5) P.add(BOX(0.05, 0.9, 0.05), 0xe8dcc0, u, G + 3.95, ST.PORCH + 0.05);
      }
    }
    // the near side, under you: barrels, a trough, a wagon, crates
    for (const [u, f] of [
      [-6.2, 4.4],
      [-5.3, 4.7],
      [-5.8, 3.6]
    ])
      barrel(P, u, f);
    P.add(BOX(2.6, 0.7, 0.9), 0x6a4426, 6, G + 0.35, 3);
    P.add(BOX(2.4, 0.04, 0.7), 0x4a7a8a, 6, G + 0.68, 3);
    wagon(P, -14, 4.6);
    for (const [u, f, s] of [
      [12, 4.2, 1],
      [12.9, 4.5, 0.8],
      [12.4, 4.4, 0.6]
    ])
      P.add(BOX(s, s, s), 0x9a7448, u, G + (s === 0.6 ? 1 + 0.3 : s / 2), f);
    // a stagecoach left in the street
    wagon(P, 22, 7.5, false, 0.15);
    P.add(BOX(2.6, 1.6, 1.5), 0x5a1a1a, 22, G + 2.0, 7.5, 0, 0.15, 0);
    // the cross street: more fronts, side on, down to the mission church
    for (const s of [-1, 1])
      for (const [f0, f1, h, c] of [
        [22, 31, 5.2, 0x9a7a5a],
        [32, 41, 7.4, 0x8a6a5a],
        [42, 50, 4.8, 0xa08a6a]
      ]) {
        const u = s * (ST.CROSS + 4);
        P.add(BOX(8, h, f1 - f0), c, u, G + h / 2, (f0 + f1) / 2);
        P.add(BOX(0.25, h + 1.2, f1 - f0), c, s * (ST.CROSS + 0.1), G + (h + 1.2) / 2, (f0 + f1) / 2);
        for (let f = f0 + 1.5; f < f1 - 1; f += 3) {
          P.add(BOX(0.1, 1.6, 1.2), 0x24303a, s * ST.CROSS, G + 1.8, f);
          if (h > 6) P.add(BOX(0.1, 1.6, 1.2), 0x24303a, s * ST.CROSS, G + 5, f);
        }
      }
    // the church: white walls, a bell tower with its belfry open to you
    const C = ST.CHURCH;
    P.add(BOX(11, 7, 12), 0xe8e0d0, 0, G + 3.5, C + 6);
    P.add(BOX(11.4, 0.3, 12.4), 0x9a6a4a, 0, G + 7.1, C + 6);
    P.add(BOX(3.4, 14, 3.4), 0xf0e8d8, 0, G + 7, C - 1.5);
    P.add(BOX(1.8, 2.2, 0.1), DARK, 0, G + 11.6, C - 3.22);
    P.add(BOX(1.6, 2.6, 0.1), 0x3a2414, 0, G + 1.3, C - 3.22);
    P.add(CONE(2.6, 3, 4), 0x9a5a3a, 0, G + 15.5, C - 1.5, 0, Math.PI / 4, 0);
    P.add(BOX(0.12, 1.4, 0.12), 0x2a2a2a, 0, G + 17.6, C - 1.5);
    P.add(BOX(0.7, 0.12, 0.12), 0x2a2a2a, 0, G + 17.8, C - 1.5);
    waterTower(P, 20, 28);
    windmill(P, -24, 30);
    // (none in the cross street)
    P.scatter(26, 30, 90, (u, f, R) => Math.abs(u) > 13 && saguaro(P, u, f, 0.8 + R() * 0.7), 80, 30);
    P.scatter(30, 25, 90, (u, f, R) => Math.abs(u) > 13 && P.rock(u, f, 0.6 + R() * 1.4, 0x9a7a5a), 80, 20);
  },
  slots: [],
  cover: null
};

LAYOUTS.street = L => {
  const fixed = { fixed: true, rail: false };
  // bottles on the hitching rail under you, cans on a crate rail to the right
  L.row({ kind: "bottle", n: 6, f: 3.2, u0: -3, u1: 3, base: 1.0, size: 0.32, tint: ["green", "brown"], bank: 3 });
  L.row({ kind: "can", n: 5, f: 6.6, u0: 8, u1: 11, base: 1.1, size: 0.22, tint: ["steel", "red"], bank: 5 });
  // lanterns hung from the porch roofs, WANTED posters on the walls
  const posts = BLOCKS.map(b => [b[0] + 0.25, b[1] - 0.25]).flat();
  L.row({
    ...fixed,
    kind: "lantern",
    n: 1,
    f: ST.PORCH - 0.1,
    u0: posts[3],
    u1: posts[3],
    base: 2.55,
    size: 0.36,
    tint: "gold"
  });
  for (const u of [posts[5], posts[8], posts[11], posts[13]])
    L.row({ ...fixed, kind: "lantern", n: 1, f: ST.PORCH - 0.1, u0: u, u1: u, base: 2.55, size: 0.36, tint: "gold" });
  for (const b of BLOCKS.filter((_, k) => k % 2 === 0 && k)) {
    const u = lowerWindows(b)[0] ?? doorOf(b) - 2.2;
    L.row({
      ...fixed,
      mirror: 1, // (it has words on it)
      kind: "wanted",
      n: 1,
      f: ST.F - 0.1,
      u0: u + 1.15,
      u1: u + 1.15,
      base: 1.5,
      size: 0.75,
      tint: "card"
    });
  }
  // the mission bell, up in the tower
  L.row({
    ...fixed,
    kind: "bell",
    n: 1,
    f: ST.CHURCH - 3.3,
    u0: 0,
    u1: 0,
    base: 10.7,
    size: 0.9,
    tint: "gold",
    pts: 50
  });
  const gang = (a, b, c) => [
    ["bandit", a],
    ["bandit2", b],
    ["rifleman", c]
  ];
  // upstairs windows
  L.pops({
    fixed: true,
    f: ST.F - 0.35,
    at: BLOCKS.flatMap(b => upperWindows(b).map(u => [u, 4.45])),
    size: 1.5,
    kinds: [...gang(35, 30, 15), ["lady", 15, { dont: true }], ["outlaw", 5, { pts: 50 }]]
  });
  // doorways
  L.pops({
    fixed: true,
    f: ST.F - 0.35,
    at: BLOCKS.map(b => [doorOf(b), 0.45]),
    size: 1.75,
    kinds: [...gang(35, 30, 10), ["townsman", 15, { dont: true }], ["lady", 10, { dont: true }]]
  });
  // up behind the false fronts
  L.pops({
    fixed: true,
    f: ST.F + 0.4,
    at: BLOCKS.map(b => [doorOf(b) + (b[3] === 2 ? 2.2 : -1.2), frontH(b[3]) - 0.55]),
    size: 1.3,
    period: [5, 8],
    busy: 0.7,
    kinds: [
      ["rifleman", 60, { pts: 25 }],
      ["bandit", 40, { pts: 25 }]
    ]
  });
  // behind the barrels, the trough, the wagon and the crates under you
  L.pops({
    fixed: true,
    f: 5.4,
    at: [
      [-5.7, 0],
      [6, 0],
      [-14, 0],
      [12.4, 0]
    ],
    size: 1.7,
    kinds: [...gang(40, 35, 10), ["townsman", 15, { dont: true }]]
  });
  // the far roofs down the cross street, and the bell tower
  L.pops({
    fixed: true,
    f: 30,
    at: [
      [-8, 5.5],
      [8, 5.5]
    ],
    size: 1.3,
    period: [6, 9],
    busy: 0.6,
    kinds: [["rifleman", 100, { pts: 50 }]]
  });
};

// One of the gang crossing the street (or a townsman: don't).
function crossing(R, add, t, c, kind) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = dir * -R(18, 24);
  add(t, kind, cross(R, { u0, u1: -u0, f: R(5, 9), v: R(4.5, 6.5) * c.S }));
}
// Out of a doorway across the street and into the middle, then draws.
function walkout(R, add, t, c) {
  const b = pick(R, BLOCKS);
  const u = doorOf(b);
  add(
    t,
    R(0, 1) < 0.5 ? "banditRun" : "bandit2Run",
    rush(
      R,
      [
        [u, ST.F - 0.3, G + 0.4],
        [u, ST.PORCH - 0.6, G + 0.4],
        [u * 0.7 + R(-2, 2), R(6, 8), G]
      ],
      R(2.4, 3.2) * c.S
    )
  );
}

const streetWave = (R, add, c) => {
  if (c.x2) {
    // the gang rides in
    for (let k = 0; k < 9; k++)
      add(1 + k * 2.6, k % 3 ? "rider" : "riderB", run(R, { v: R(12, 15) * c.S, f: R(4, 9) }));
    for (let k = 0; k < 4; k++) crossing(R, add, 3 + k * 6, c, "banditRun");
    for (let k = 0; k < 3; k++) walkout(R, add, 5 + k * 7, c);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 4)
    for (let j = 0; j < 1 + n(2); j++) add(R(1, 22), "tumbleweed", bounce(R, { v: R(3, 5) * c.S, f: R(3, 11) }));
  if (k === 1 || k === 5)
    for (let j = 0; j < 2 + n(2); j++)
      add(
        R(1, 24),
        "dynamite",
        lobbed(R, { u: R(-20, 20), f: ST.F, h: G + 7.5, vh: R(2, 4), vu: R(-1.5, 1.5), vf: -R(1.5, 3) })
      );
  if (k >= 2) {
    for (let j = 0; j < 1 + n(1.5); j++)
      crossing(R, add, R(1, 22), c, pick(R, ["banditRun", "bandit2Run", "riflemanRun"]));
    for (let j = 0; j < n(1.2); j++)
      add(R(1, 20), R(0, 1) < 0.7 ? "rider" : "riderB", run(R, { v: R(12, 15) * c.S, f: R(4, 9) }));
    if (k !== 4) for (let j = 0; j < 1 + n(0.8); j++) walkout(R, add, R(2, 20), c);
  }
  if (R(0, 1) < 0.35) crossing(R, add, R(2, 20), { ...c, S: 0.6 }, R(0, 1) < 0.5 ? "townRun" : "ladyRun");
  if (k === 1) flyers(["crow", "vulture"], R, add, c, 2);
};

// ---- Level 3: the quick draw ---------------------------------------------------------

// A corral at high noon: two lanes either side of a split-rail fence, an
// outlaw at the far end of each. Every SLOT s: READY, then DRAW! a moment
// later (seeded); each outlaw draws REACT s after that (quicker each time).
// Shot after DRAW!: 300 down to 50 the longer you take; before it: -25; if
// he gets his shot off: -50 to everyone up there. Now and then it's a
// townsman wandering into a lane instead (don't). The twelfth is El Tigre.
export const DUEL = { LANE: 3, F: 6, SLOT: 9, DRAWS: 12, FIRST: 2 };
const DUEL_KINDS = ["duelist", "duelistB", "duelistC", "duelistD"];

function draw(R, add, c, n, t) {
  const D = DUEL;
  const d = R(2.4, 4.2);
  const decoy = n === 4 || n === 8 ? (R(0, 1) < 0.5 ? 0 : 1) : -1;
  const last = n === D.DRAWS - 1;
  for (const lane of [0, 1]) {
    const u = lane ? D.LANE : -D.LANE;
    const first = lane === 0;
    if (lane === decoy) {
      add(
        t,
        R(0, 1) < 0.5 ? "laneLady" : "laneTown",
        cross(R, { u0: u - 2.6 * (lane ? -1 : 1), u1: u + 2.6 * (lane ? -1 : 1), f: D.F - 0.5, v: 0.75 })
      );
      continue;
    }
    const react = (Math.max(0.6, 1.35 - 0.065 * n) * (lane ? 1.06 : 0.94)) / Math.sqrt(c.S);
    const L = stand(R, { u, f: D.F, dur: D.SLOT - 0.5, bob: 0.01 });
    add(t, last && first ? "eltigre" : DUEL_KINDS[(n + lane) % DUEL_KINDS.length], {
      ...L,
      early: d,
      arrive: d + react,
      charge: true,
      duel: { d, react, x2: last },
      hittable: tau => tau >= d && tau < d + react + 0.25,
      say: first ? [last ? "THE LAST DRAW · EL TIGRE" : `DRAW ${n + 1} OF ${D.DRAWS}`, "READY..."] : null
    });
  }
}

const noonWave = (R, add, c) => {
  for (let k = 0; k < 3; k++) {
    const n = 3 * c.w + k;
    if (n < DUEL.DRAWS) draw(R, add, c, n, DUEL.FIRST + k * DUEL.SLOT);
  }
};

WORLDS.noon = {
  sky: {
    top: "#2a6ab8",
    mid: "#7ab0e0",
    horizon: "#f4e2c0",
    ground: "#8a6a42",
    sun: [10, 62, "#fffbe8", 14],
    clouds: 3,
    hills: [
      { colour: "#b06a42", height: 7, rough: 2, phase: 2 },
      { colour: "#8a5a3a", height: 4, rough: 3 }
    ],
    seed: 52
  },
  fog: 0xe0c8a0,
  signs: [
    ["LANE 1", -DUEL.LANE, G + 2.1, 9.4, 1.8, 0.6, "#f4efe2", "#2a1a10"],
    ["LANE 2", DUEL.LANE, G + 2.1, 9.4, 1.8, 0.6, "#f4efe2", "#2a1a10"],
    ["DIABLO CORRAL", 0, G + 3.0, 9.38, 3.6, 0.6, "#5a2a1a", "#f2c230"],
    ["PISTOLS ONLY", 0, G + 1.55, 9.38, 3.0, 0.55, "#2a1a10", "#f2c230"]
  ],
  build(P) {
    const D = DUEL;
    P.ground(0xb8905a, [
      { u: -D.LANE, f: 4.5, r: 2.4, c: 0xa07a4a, sx: 1, sz: 2.3 },
      { u: D.LANE, f: 4.5, r: 2.4, c: 0xa07a4a, sx: 1, sz: 2.3 }
    ]);
    // the lanes: a fence down the middle and one each side, one across the end
    fenceF(P, 0, -0.5, 9.2);
    for (const s of [-1, 1]) fenceF(P, s * 6.2, -0.5, 9.2);
    fence(P, -12, 12, 9.5);
    P.add(BOX(0.25, 3.4, 0.25), 0x5a3a20, -1.9, G + 1.7, 9.5);
    P.add(BOX(0.25, 3.4, 0.25), 0x5a3a20, 1.9, G + 1.7, 9.5);
    P.add(BOX(4.2, 0.25, 0.25), 0x5a3a20, 0, G + 3.45, 9.5);
    for (const u of [-D.LANE, D.LANE]) P.add(BOX(0.12, 2.0, 0.12), 0x5a3a20, u, G + 1.0, 9.4);
    // a barn, a windmill, hay, a water tower, a few horses
    P.add(BOX(12, 6, 9), 0x9a2a1a, -16, G + 3, 22);
    P.add(BOX(12.6, 0.3, 5.4), 0x4a3a2a, -16, G + 7.0, 19.6, 0.6, 0, 0);
    P.add(BOX(12.6, 0.3, 5.4), 0x4a3a2a, -16, G + 7.0, 24.4, -0.6, 0, 0);
    P.add(BOX(4, 4.4, 0.1), 0xf4efe2, -16, G + 2.2, 17.45);
    P.add(BOX(3.6, 4.0, 0.12), 0x6a1a10, -16, G + 2.0, 17.42);
    windmill(P, 12, 18);
    waterTower(P, 24, 30);
    for (const [u, f] of [
      [-9, 12],
      [-8, 13.2],
      [9, 12.5],
      [20, 14]
    ])
      P.add(BOX(1.4, 0.8, 0.9), 0xe0c060, u, G + 0.4, f);
    horse(P, -24, 15, 0.4);
    horse(P, 17, 22, -2.6, 0x3a2a1a);
    horse(P, 21, 21, -2.2, 0xc8a070);
    P.scatter(24, 30, 90, (u, f, R) => saguaro(P, u, f, 0.8 + R() * 0.6), 80, 18);
    P.scatter(24, 20, 90, (u, f, R) => P.rock(u, f, 0.6 + R() * 1.6, 0xa07a52), 80, 14);
  },
  slots: [],
  cover: null
};

LAYOUTS.noon = L => {
  // cans on the far fence, either side of the lanes, for between the draws
  for (const s of [-1, 1])
    L.row({
      fixed: true,
      rail: false,
      kind: "can",
      n: 4,
      f: 9.35,
      u0: s * 7.2,
      u1: s * 11,
      base: 1.12,
      size: 0.24,
      tint: ["steel", "red"],
      bank: 4
    });
};

// ---- Level 4: the camp on the trail ---------------------------------------------------

const CAMP = { FIRE: 14, LOG: 12.2, RIDGE: 38, MESA: 58 };
const ROCKS = [
  [-6, 6],
  [5, 7.5],
  [13, 9],
  [-17, 9]
];
const TENTS = [
  [-9, 19],
  [7, 21],
  [-3, 25],
  [15, 16]
];

function tent(P, u, f, c = 0xe8dcc0) {
  for (const s of [-1, 1]) P.add(BOX(1.9, 0.05, 3), c, u + s * 0.66, G + 0.72, f, 0, 0, -s * 0.82);
  P.add(BOX(0.06, 1.7, 0.06), 0x5a3a20, u, G + 0.85, f - 1.5);
  P.add(BOX(0.6, 1.1, 0.04), 0x2a1a10, u, G + 0.55, f - 1.48);
}

WORLDS.camp = {
  sky: {
    top: "#141030",
    mid: "#4a2a5a",
    horizon: "#f07a3a",
    ground: "#3a2418",
    sun: [25, 1, "#ffb060", 16],
    stars: true,
    clouds: 5,
    cloud: "rgba(255,140,90,0.35)",
    hills: [
      { colour: "#4a2a2a", height: 10, rough: 1.5, phase: 0.5 },
      { colour: "#2a1a1a", height: 5, rough: 3 }
    ],
    seed: 53
  },
  fog: 0x5a3a3a,
  build(P) {
    P.ground(0x8a6a48, [
      { u: 0, f: CAMP.FIRE, r: 7, c: 0x7a5a3a },
      { u: 0, f: CAMP.FIRE, r: 2.2, c: 0xc8783a },
      { u: 0, f: 32, r: 10, c: 0x6a5a48, sx: 5, sz: 0.25 }
    ]);
    // the fire: a ring of stones, logs, flames
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      P.add(BALL(0.22, 5), 0x6a6460, Math.cos(a) * 0.9, G + 0.1, CAMP.FIRE + Math.sin(a) * 0.9);
    }
    for (const a of [0.4, -0.5, 1.6])
      P.add(CYL(0.1, 0.12, 1.4, 6), 0x3a2414, 0, G + 0.18, CAMP.FIRE, 0, a, Math.PI / 2 - 0.15);
    P.add(CONE(0.55, 1.4, 7), 0xff7a1a, 0, G + 0.8, CAMP.FIRE);
    P.add(CONE(0.3, 1.0, 6), 0xffd23a, 0.05, G + 0.65, CAMP.FIRE - 0.05);
    P.add(BOX(0.06, 1.3, 0.06), 0x2a2a2a, -0.7, G + 0.65, CAMP.FIRE);
    P.add(BOX(0.06, 1.3, 0.06), 0x2a2a2a, 0.7, G + 0.65, CAMP.FIRE);
    P.add(BOX(1.5, 0.05, 0.05), 0x2a2a2a, 0, G + 1.3, CAMP.FIRE);
    P.add(CYL(0.16, 0.2, 0.3, 8), 0x3a3a3a, 0, G + 1.05, CAMP.FIRE);
    // the log you sit on, and the gang's things
    P.add(CYL(0.25, 0.28, 4.4, 8), 0x5a3a20, 0, G + 0.22, CAMP.LOG, 0, 0, Math.PI / 2);
    for (const [u, f] of TENTS) tent(P, u, f);
    wagon(P, -13, 12.6, true, 0.3);
    for (const [u, f] of ROCKS) P.add(BALL(1.25, 6), 0x8a6a52, u, G + 0.55, f, 0, 0, 0, 1.4, 0.75, 1.0);
    for (const [u, f] of [
      [9.5, 14],
      [10.3, 14.4]
    ])
      P.add(BOX(0.8, 0.6, 0.6), 0x9a6a3a, u, G + 0.3, f);
    barrel(P, -10.5, 15);
    for (const u of [5.5, 8.5]) P.add(BOX(0.06, 1.75, 0.06), 0x3a2414, u, G + 0.87, 20.7);
    // the horses on a picket line
    P.add(BOX(9, 0.05, 0.05), 0x3a2a1a, 18, G + 1.6, 27);
    for (const u of [14.5, 16.5, 18.5, 20.5, 22.5]) P.add(BOX(0.1, 1.7, 0.1), 0x3a2a1a, u - 1, G + 0.85, 27.1);
    [0x6a4428, 0x3a2a1a, 0xc8a070, 0x8a5a3a].forEach((c, k) => horse(P, 15 + k * 2, 26.4, Math.PI / 2 + 0.1 * k, c));
    // a steer-skull fence, the ridge, the mesas
    fence(P, 18, 26, 10, 2);
    for (let k = 0; k < 9; k++)
      P.add(BALL(1.6, 6), 0x7a5a42, -24 + k * 6, G + 0.9, CAMP.RIDGE + (k % 2) * 0.8, 0, k, 0, 1.6, 0.9, 1);
    P.add(SLAB(56, 1.4, 3), 0x6a4a36, 0, G + 0.7, CAMP.RIDGE + 1.6);
    for (const [u, w, h] of [
      [-20, 22, 9],
      [8, 18, 6.8],
      [30, 16, 11]
    ]) {
      P.add(BOX(w, h, 10), 0x9a4e30, u, G + h / 2, CAMP.MESA + 6);
      P.add(BOX(w + 2, 0.6, 10.6), 0x7a3e26, u, G + h - 0.3, CAMP.MESA + 6);
      P.add(BOX(w * 0.6, 1.4, 1.4), 0xa45a38, u, G + 6, CAMP.MESA + 0.6);
      P.add(BOX(w + 8, h * 0.3, 16), 0x7a4430, u, G + h * 0.15, CAMP.MESA + 6);
    }
    P.scatter(22, 18, 55, (u, f, R) => saguaro(P, u, f, 0.7 + R() * 0.6), 60, 20);
    P.scatter(30, 16, 80, (u, f, R) => P.bush(u, f, 0.5 + R() * 0.6, 0x5a6a3a), 80, 10);
  },
  slots: [],
  cover: null
};

LAYOUTS.camp = L => {
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: "can",
    n: 6,
    f: CAMP.LOG - 0.05,
    u0: -1.8,
    u1: 1.8,
    base: 0.47,
    size: 0.2,
    tint: ["steel", "red", "gold"],
    bank: 6
  });
  L.row({ ...fixed, kind: "lantern", n: 1, f: 12.3, u0: -12.2, u1: -12.2, base: 2.15, size: 0.35, tint: "gold" });
  L.row({ ...fixed, kind: "lantern", n: 2, f: 20.6, u0: 5.5, u1: 8.5, base: 1.65, size: 0.32, tint: "gold" });
  L.row({ ...fixed, kind: "skull", n: 5, f: 9.92, u0: 18, u1: 26, base: 1.3, size: 0.42, tint: "white", bank: 5 });
  L.row({
    ...fixed,
    kind: "bottle",
    n: 3,
    f: 8.6,
    u0: -17.6,
    u1: -16.4,
    base: 1.4,
    size: 0.3,
    tint: ["green", "brown"],
    bank: 3
  });
  L.row({ kind: "olla", n: 4, f: 30, u0: -9, u1: 9, base: 0.5, size: 0.55, tint: "orange", bank: 4 });
  const gang = [
    ["bandit", 40],
    ["bandit2", 35],
    ["rifleman", 15]
  ];
  // behind the rocks and the chuck wagon
  for (const [u, f] of ROCKS)
    L.pops({ fixed: true, f: f + 1.5, at: [[u, 0]], size: 1.75, kinds: [...gang, ["outlaw", 6, { pts: 50 }]] });
  L.pops({ fixed: true, f: 13.6, at: [[-13, 0]], size: 1.75, kinds: gang });
  // out of the tents (and their prisoner: don't)
  for (const [u, f] of TENTS)
    L.pops({
      fixed: true,
      peek: true,
      f: f - 1.6,
      at: [[u, 0]],
      size: 1.7,
      slide: 1.6,
      kinds: [...gang, ["hostage", 18, { dont: true }]]
    });
  // along the ridge, and on the mesa's ledges
  L.pops({
    fixed: true,
    f: CAMP.RIDGE + 0.4,
    at: span(6, -21, 21).map(u => [u, 1.5]),
    size: 1.5,
    period: [5, 8],
    kinds: [
      ["rifleman", 55, { pts: 25 }],
      ["bandit", 45, { pts: 25 }]
    ]
  });
  L.pops({
    fixed: true,
    f: CAMP.MESA - 0.3,
    at: [
      [-20, 6.7],
      [8, 6.7],
      [30, 6.7]
    ],
    size: 1.5,
    period: [7, 10],
    busy: 0.6,
    kinds: [["rifleman", 100, { pts: 50 }]]
  });
};

// Out of the dark at the camp, to a spot in front of the fire; draws.
function fromDark(R, add, t, c) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(
    t,
    pick(R, ["banditRun", "bandit2Run", "riflemanRun"]),
    rush(
      R,
      [
        [s * R(16, 26), R(30, 40), G],
        [s * R(4, 9), R(16, 20), G],
        [s * R(1, 6), R(7, 10), G]
      ],
      R(3.5, 4.8) * c.S
    )
  );
}

const campWave = (R, add, c) => {
  if (c.x2) {
    // they're breaking camp
    for (let k = 0; k < 8; k++)
      add(1 + k * 2.8, k % 2 ? "rider" : "riderB", run(R, { v: R(12, 15) * c.S, f: R(18, 34) }));
    for (let k = 0; k < 5; k++) fromDark(R, add, 2 + k * 4.5, c);
    for (let k = 0; k < 4; k++) add(3 + k * 5, "coyote", run(R, { v: R(10, 13) * c.S, f: R(14, 30) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 3)
    for (let j = 0; j < 1 + n(2); j++) add(R(1, 22), "coyote", run(R, { v: R(10, 13) * c.S, f: R(14, 32) }));
  if (k === 1 || k === 4) flyers(["crow", "vulture"], R, add, c, 3 + n(3));
  if (k >= 2) {
    for (let j = 0; j < 1 + n(1.2); j++) fromDark(R, add, R(1, 20), c);
    for (let j = 0; j < n(1.2); j++)
      add(R(1, 20), R(0, 1) < 0.5 ? "rider" : "riderB", run(R, { v: R(12, 15) * c.S, f: R(20, 36) }));
  }
  if (k === 5)
    for (let j = 0; j < 2 + n(1.5); j++)
      add(
        R(1, 22),
        "dynamite",
        lobbed(R, { u: R(-14, 14), f: R(20, 30), h: G + 1.2, vh: R(7, 9), vu: R(-1.5, 1.5), vf: -R(3, 4.5) })
      );
};

// ---- Level 5: Villa's hacienda ---------------------------------------------------------

const HAC = { R0: 6, R1: 16, WALL: 30, WH: 3, HOUSE: 34, BAL: 4.6, CHURCH: 42, TOWER: [19, 41] };
const ADOBE = 0xd8a878;
const ADOBE2 = 0xc8946a;

WORLDS.border = {
  sky: {
    top: "#2a2a5a",
    mid: "#c05a4a",
    horizon: "#ffc070",
    ground: "#5a3a2a",
    sun: [-30, 4, "#ffe0a0", 18],
    clouds: 8,
    cloud: "rgba(255,180,140,0.45)",
    hills: [
      { colour: "#7a4a4a", height: 8, rough: 2, phase: 3 },
      { colour: "#5a3a3a", height: 4, rough: 3 }
    ],
    seed: 54
  },
  fog: 0xb07a60,
  signs: [["HACIENDA DEL NORTE", 0, G + HAC.WH + 0.8, HAC.WALL - 0.12, 5.4, 0.7, "#5a2a1a", "#f2e2b8"]],
  build(P) {
    P.ground(0xb89a6a, [
      { u: 0, f: 11, r: 14, c: 0x3a6a7a, sx: 5, sz: 0.38, lift: 0.0 },
      { u: -8, f: 11.2, r: 3, c: 0xc8a878, sx: 1.6, sz: 0.25 },
      { u: 0, f: 4, r: 8, c: 0xa08a5a, sx: 5, sz: 0.4 }
    ]);
    // the river's banks: reeds, cottonwoods, stepping stones at the ford
    for (let u = -40; u <= 40; u += 3.5) {
      P.reeds(u + 1.2, HAC.R0 - 0.3, 0.7);
      if (Math.abs(u) > 29) P.oak(u, HAC.R1 + 2.2 + (u % 7 === 0 ? 1 : 0), 1.1, 0x6a8a3a);
    }
    // (the cottonwoods off to the sides and behind, so the wall stays in view)
    for (const [u, f] of [
      [-30, 36],
      [-27, 44],
      [29, 38],
      [31, 46],
      [-14, 50],
      [6, 58]
    ])
      P.oak(u, f, 1.3, 0x6a8a3a);
    for (let k = 0; k < 6; k++) P.rock(-1 + (k % 2) * 0.8, HAC.R0 + 1 + k * 1.6, 0.45, 0x8a8278);
    for (const [u, f] of [
      [-9, 3],
      [7, 3.6],
      [15, 2.6]
    ]) {
      P.add(CYL(0.45, 0.5, 0.8, 8), 0x6a4a2a, u, G + 0.4, f);
      P.add(CYL(0.45, 0.45, 0.04, 8), 0xc8a070, u, G + 0.81, f);
    }
    // the outer wall, its towers and the gate
    const W = HAC.WALL;
    for (const s of [-1, 1]) {
      P.add(BOX(23, HAC.WH, 1.2), ADOBE, s * 14.5, G + HAC.WH / 2, W + 0.6);
      P.add(BOX(23, 0.6, 0.35), ADOBE2, s * 14.5, G + HAC.WH + 0.3, W + 0.1);
      for (let u = 4; u < 26; u += 2.4)
        P.add(CYL(0.08, 0.08, 0.7, 4), 0x5a3a20, s * u, G + HAC.WH - 0.4, W - 0.1, Math.PI / 2);
      P.add(BOX(5, 6, 5), ADOBE2, s * 26, G + 3, W + 1);
      P.add(BOX(5.4, 0.9, 5.4), ADOBE, s * 26, G + 6.45, W + 1);
      P.add(BOX(1.2, 1.2, 0.1), DARK, s * 26, G + 4.6, W - 1.52);
      // the gateway's posts and the wall over its arch
      P.add(BOX(1.4, 1.4, 1.2), ADOBE, s * 2.3, G + 0.7, W + 0.6);
      P.add(BOX(1.4, 1.6, 1.2), ADOBE, s * 2.3, G + 2.2, W + 0.6);
      P.add(BOX(1.2, 2.8, 0.12), 0x5a3a20, s * 2.0, G + 1.4, W + 0.6, 0, s * 1.1, 0);
    }
    P.add(BOX(6.2, 1.6, 1.4), ADOBE, 0, G + HAC.WH + 0.8, W + 0.6);
    P.add(new THREE.TorusGeometry(1.6, 0.22, 5, 14, Math.PI), ADOBE2, 0, G + 1.4, W - 0.05);
    P.add(BOX(3.2, 3.0, 0.1), DARK, 0, G + 1.5, W + 1.3);
    // inside: the main house with its balcony, the mission church and tower
    P.add(BOX(13, 8, 8), ADOBE, -9, G + 4, HAC.HOUSE + 4);
    P.add(BOX(13.4, 0.4, 8.4), 0x9a5a3a, -9, G + 8.2, HAC.HOUSE + 4);
    P.add(BOX(10, 0.2, 1.6), 0x5a3a20, -9, G + HAC.BAL, HAC.HOUSE - 0.8);
    P.add(BOX(10, 0.08, 0.08), 0x3a2414, -9, G + HAC.BAL + 1.0, HAC.HOUSE - 1.6);
    for (let u = -14; u <= -4; u += 0.5) P.add(BOX(0.05, 1.0, 0.05), 0x3a2414, u, G + HAC.BAL + 0.5, HAC.HOUSE - 1.6);
    for (const u of [-12.5, -9, -5.5]) {
      P.add(BOX(1.4, 2.4, 0.1), DARK, u, G + HAC.BAL + 1.25, HAC.HOUSE - 0.04);
      P.add(BOX(1.2, 1.4, 0.1), DARK, u, G + 1.2, HAC.HOUSE - 0.04);
    }
    const C = HAC.CHURCH;
    P.add(BOX(10, 8, 12), 0xeee4d4, 9, G + 4, C + 6);
    P.add(BOX(6, 3, 0.6), 0xeee4d4, 9, G + 9.5, C + 0.3);
    P.add(BALL(1.6, 8), 0xeee4d4, 9, G + 11, C + 0.3, 0, 0, 0, 1, 0.8, 0.3);
    P.add(BOX(2, 3.2, 0.1), 0x3a2414, 9, G + 1.6, C - 0.02);
    P.add(TORUS(1, 0.12, 12), 0xc8b8a0, 9, G + 3.2, C - 0.05, 0, 0, 0, 1, 1, 0.5);
    const [tu, tf] = HAC.TOWER;
    P.add(BOX(3.6, 12, 3.6), 0xeee4d4, tu, G + 6, tf);
    P.add(BOX(3.2, 3, 3.2), 0xeee4d4, tu, G + 13.5, tf);
    P.add(BOX(1.6, 2.2, 0.1), DARK, tu, G + 13.4, tf - 1.62);
    P.add(BALL(1.7, 8), 0xd8c8b0, tu, G + 15.2, tf, 0, 0, 0, 1, 0.7, 1);
    P.add(BOX(0.12, 1.4, 0.12), 0x2a2a2a, tu, G + 17, tf);
    P.add(BOX(0.7, 0.12, 0.12), 0x2a2a2a, tu, G + 17.2, tf);
    // flat roofs and the hills behind
    for (const [u, f, w, h] of [
      [-20, 38, 8, 4.5],
      [22, 50, 9, 5],
      [-2, 52, 10, 5.5]
    ]) {
      P.add(BOX(w, h, 7), ADOBE2, u, G + h / 2, f);
      P.add(BOX(w + 0.4, 0.5, 7.4), ADOBE, u, G + h + 0.25, f);
    }
    // a string of lanterns over the gate, agave, cactus
    for (let k = 0; k < 14; k++) {
      const t = k / 13;
      P.add(
        BALL(0.14, 4),
        [0xffd27a, 0xff8a5a][k % 2],
        -6 + 12 * t,
        G + HAC.WH + 1.5 - Math.sin(t * Math.PI) * 0.5,
        W - 0.9
      );
    }
    P.scatter(18, 18, 60, (u, f, R) => saguaro(P, u, f, 0.7 + R() * 0.5), 70, 28);
    P.scatter(
      20,
      2,
      26,
      (u, f) => {
        if (f > HAC.R0 - 1 && f < HAC.R1 + 1) return;
        for (let k = 0; k < 7; k++)
          P.add(CONE(0.12, 1.1, 4), 0x6a8a6a, u, G + 0.45, f, Math.sin(k) * 0.6, k, Math.cos(k) * 0.6);
      },
      40,
      12
    );
  },
  slots: [],
  cover: null
};

LAYOUTS.border = L => {
  const fixed = { fixed: true, rail: false };
  // on this bank: bottles on stumps, cans on a log at the water
  for (const [u, f] of [
    [-9, 3],
    [7, 3.6],
    [15, 2.6]
  ])
    L.row({
      ...fixed,
      kind: ["bottle", "can"],
      n: 2,
      f: f - 0.1,
      u0: u - 0.2,
      u1: u + 0.2,
      base: 0.82,
      size: 0.28,
      tint: ["green", "steel"],
      bank: 2
    });
  L.row({
    kind: "olla",
    n: 6,
    f: HAC.WALL - 0.1,
    u0: -16,
    u1: 16,
    base: HAC.WH + 1.0,
    size: 0.5,
    tint: "orange",
    bank: 3,
    rail: false
  });
  L.row({
    ...fixed,
    kind: "bell",
    n: 1,
    f: HAC.TOWER[1] - 1.75,
    u0: HAC.TOWER[0],
    u1: HAC.TOWER[0],
    base: 12.6,
    size: 0.85,
    tint: "gold",
    pts: 50
  });
  const gang = [
    ["bandit", 40],
    ["bandit2", 35],
    ["rifleman", 20]
  ];
  // up behind the wall's parapet, in the towers, in the gate
  L.pops({
    fixed: true,
    f: HAC.WALL + 0.55,
    at: [-22, -16, -10, -5, 5, 10, 16, 22].map(u => [u, HAC.WH]),
    size: 1.5,
    kinds: [...gang, ["padre", 5, { dont: true }]]
  });
  L.pops({
    fixed: true,
    f: HAC.WALL - 1.5,
    at: [
      [-26, 6.9],
      [26, 6.9]
    ],
    size: 1.3,
    period: [6, 9],
    kinds: [["rifleman", 100, { pts: 50 }]]
  });
  L.pops({
    fixed: true,
    f: HAC.WALL - 0.4,
    at: [
      [-1, 0],
      [1, 0]
    ],
    size: 1.8,
    kinds: [...gang, ["lady", 12, { dont: true }], ["padre", 8, { dont: true }]]
  });
  // the balcony: and now and then Villa himself
  L.pops({
    fixed: true,
    f: HAC.HOUSE - 0.6,
    at: [
      [-12.5, HAC.BAL],
      [-9, HAC.BAL],
      [-5.5, HAC.BAL]
    ],
    size: 1.75,
    period: [5, 8],
    kinds: [
      ["bandit", 50],
      ["villa", 14, { pts: 250 }],
      ["lady", 26, { dont: true }],
      ["rifleman", 10]
    ]
  });
  // in the reeds on this bank
  L.pops({
    fixed: true,
    f: HAC.R0 - 0.6,
    at: [
      [-16, 0],
      [-4, 0],
      [11, 0]
    ],
    size: 1.7,
    kinds: [...gang, ["townsman", 15, { dont: true }]]
  });
};

// Out of the gate, across the ford, up onto this bank; draws.
function ford(R, add, t, c) {
  add(
    t,
    pick(R, ["banditRun", "bandit2Run", "riflemanRun"]),
    rush(
      R,
      [
        [R(-0.8, 0.8), HAC.WALL - 0.5, G],
        [R(-2, 1), HAC.R1 + 0.5, G],
        [R(-1.5, 1.5), HAC.R0 - 0.5, G],
        [R(-10, 10), R(2.5, 4.5), G]
      ],
      R(3.5, 4.6) * c.S
    )
  );
}

const borderWave = (R, add, c) => {
  if (c.x2) {
    // Villa rides out
    add(4, "villaRider", run(R, { v: 11 * c.S, f: R(9, 13) }));
    for (let k = 0; k < 7; k++)
      add(1 + k * 3.2, k % 2 ? "rider" : "riderB", run(R, { v: R(12, 15) * c.S, f: R(8, 15) }));
    for (let k = 0; k < 3; k++) ford(R, add, 6 + k * 6, c);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 3)
    for (let j = 0; j < 1 + n(1.4); j++)
      add(R(1, 22), R(0, 1) < 0.6 ? "rider" : "riderB", run(R, { v: R(11, 14) * c.S, f: R(8, 15) }));
  if (k === 1 || k === 5)
    for (let j = 0; j < 2 + n(2); j++)
      add(
        R(1, 23),
        "dynamite",
        lobbed(R, { u: R(-18, 18), f: HAC.WALL - 0.5, h: G + HAC.WH + 1, vh: R(6, 8), vu: R(-1.5, 1.5), vf: -R(5, 7) })
      );
  if (k >= 2) for (let j = 0; j < 1 + n(1.2); j++) ford(R, add, R(1, 20), c);
  if (k === 2 || k === 4) flyers(["dove", "vulture"], R, add, c, 2 + n(2));
  if (R(0, 1) < 0.25) add(R(2, 20), "padreRun", cross(R, { u0: -14, u1: 14, f: HAC.WALL - 1.5, v: 1.6 }));
};

// ---- The campaign ------------------------------------------------------------------

export const WEST = {
  name: "ON THE TRAIL OF PANCHO VILLA",
  first: "Marshals: Villa's men are in the Silver Spur",
  kinds,
  levels: [
    {
      world: "street",
      name: "GUNFIGHT ON MAIN STREET",
      story: "They're out in the street. Hold the hotel roof",
      music: "saloon",
      amb: "town",
      wave: streetWave,
      title: (w, x2) => (x2 ? "THE GANG RIDES IN · DOUBLE POINTS" : null)
    },
    {
      world: "noon",
      name: "QUICK DRAW AT HIGH NOON",
      story: "Two of his best call you out. Pistols only",
      goal: null,
      dur: Math.ceil((DUEL.DRAWS / 3) * 30),
      pistols: true,
      gold: 0,
      x2: () => false,
      music: "",
      amb: "noon",
      legend:
        "AFTER DRAW!: QUICKER = MORE (300 TO 50)  ·  TOO SOON -25  ·  TOO SLOW -50  ·  HOLD FIRE ON TOWNSFOLK -50",
      wave: noonWave
    },
    {
      world: "camp",
      name: "THE CAMP ON THE TRAIL",
      story: "We've tracked them to the Rio Grande",
      music: "",
      amb: "camp",
      wave: campWave,
      title: (w, x2) => (x2 ? "THEY'RE BREAKING CAMP · DOUBLE POINTS" : null)
    },
    {
      world: "border",
      name: "VILLA'S HACIENDA",
      story: "Across the river. Bring in Pancho Villa",
      music: "",
      amb: "border",
      legend: "VILLA 250 · VILLA RIDING 300  ·  DYNAMITE: SHOOT IT BEFORE IT LANDS  ·  DON'T SHOOT THE PADRE",
      wave: borderWave,
      title: (w, x2) => (x2 ? "VILLA RIDES OUT · DOUBLE POINTS" : null)
    }
  ],
  done: ["VILLA'S GANG IS FINISHED", "THE BORDER IS SAFE, MARSHALS"]
};
