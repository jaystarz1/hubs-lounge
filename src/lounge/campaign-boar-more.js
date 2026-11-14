import { GROUND, BOX, CYL, BALL, CONE, SLAB, WORLDS, AMBIENCE } from "./shoots-art";
import { LAYOUTS } from "./plates";
import { cross, run, charge, pick, flyers } from "./shoot-paths";
import { skim, bed, natureRows as rows } from "./campaign-kit";

// The hunt for Big Tusker's five more levels (Jay, 2026-10-31: "add five
// more levels to each set"), between the bayou and the night raid:
//   5 THE CORNFIELD     tall corn in rows, the sounder rooting through it
//   6 THE VINEYARD      Tuscan vines on the hill, the farmhouse, cypresses
//   7 THE ROCKY GORGE   a dry gorge, boulders, boar on the scree
//   8 THE APPLE ORCHARD windfalls under the trees, the boar at them
//   9 THE RIVER REEDS   reeds along a slow river, a punt, herons

const G = GROUND;

const kinds = {
  boar_cornRun: {
    pts: 75,
    r: 0.6,
    hy: 0.4,
    dies: "fall",
    art: { plate: "boar", tint: 0x6a4a3a, h: 0.85 },
    face: "slide",
    sound: "squeal"
  },
  boar_pigletRun: {
    pts: 100,
    r: 0.4,
    hy: 0.25,
    dies: "fall",
    art: { plate: "boar", tint: 0xc8a080, h: 0.5 },
    face: "slide",
    sound: "squeal"
  },
  boar_hareRun: {
    pts: 100,
    r: 0.3,
    hy: 0.25,
    dies: "fall",
    art: { plate: "rabbit", tint: 0xa88a6a, h: 0.5 },
    face: "slide",
    sound: "squeak"
  },
  boar_foxRun: {
    pts: 100,
    r: 0.35,
    hy: 0.3,
    dies: "fall",
    art: { plate: "wolf", tint: 0xd8702a, h: 0.6 },
    face: "slide",
    sound: "chirp"
  },
  boar_goatRun: {
    pts: 100,
    r: 0.45,
    hy: 0.4,
    dies: "fall",
    art: { plate: "deer_goat", tint: 0xd8d0c0, h: 0.9 },
    face: "slide",
    sound: "thud"
  },
  boar_crow: { pts: 25, r: 0.3, dies: "fall", art: { bird: "crow" }, face: "fly", sound: "caw" },
  boar_pheasant: { pts: 5, r: 0.5, dies: "fall", art: { bird: "pheasant" }, face: "fly", sound: "caw" },
  boar_starling: { pts: 25, r: 0.28, dies: "fall", art: { bird: "starling" }, face: "fly", sound: "chirp" }
};

// A sounder: a few boar and their piglets running across together.
const sounder = (R, add, t, c, n, kind = "boar_cornRun") => {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const f = R(10, 40);
  const v = R(9, 11) * c.S;
  for (let j = 0; j < n; j++)
    add(
      t + j * 0.5,
      j % 3 === 2 ? "boar_pigletRun" : kind,
      cross(R, { u0: -dir * 28, u1: dir * 28, f: f + j * 0.6, v })
    );
};

// ---- Level 5: the cornfield -----------------------------------------------------------

WORLDS.boar_corn = {
  sky: {
    top: "#3a72c0",
    mid: "#98c0e0",
    horizon: "#f0e8c8",
    ground: "#a89a4a",
    sun: [30, 40, "#fffbe8", 11],
    clouds: 7,
    hills: [{ colour: "#8a9a4a", height: 4, rough: 1.5, trees: true }],
    seed: 1001
  },
  fog: 0xd8d4b0,
  build(P) {
    P.ground(0x8a7a42, [{ u: 0, f: 4, r: 8, c: 0x9a8a52, sx: 3, sz: 0.5 }]);
    // rows of corn across the field, gaps where the boar have flattened it
    for (let f = 8; f < 70; f += 3)
      for (let u = -40; u <= 40; u += 2.2) {
        if (Math.abs(Math.sin(u * 0.3 + f * 0.7)) < 0.18) continue;
        P.add(CONE(0.35, 2.4, 3), Math.round(u + f) % 2 ? 0x9aa03a : 0xb8a840, u + ((f * 7) % 0.8), G + 1.2, f);
      }
    // a scarecrow, the farm track, a silo and barn beyond
    P.add(BOX(0.12, 2.6, 0.12), 0x5a4030, 6, G + 1.3, 6);
    P.add(BOX(1.6, 0.12, 0.12), 0x5a4030, 6, G + 2.1, 6);
    P.add(BOX(0.7, 0.9, 0.3), 0x3a5a8a, 6, G + 1.9, 6);
    P.add(BALL(0.3, 6), 0xe8d8a0, 6, G + 2.7, 6);
    P.add(CONE(0.5, 0.4, 8), 0xc8a050, 6, G + 3.05, 6);
    P.add(CYL(2.4, 2.4, 10, 12), 0xc8c0b0, 30, G + 5, 74);
    P.add(BOX(8, 5, 10), 0x9a2a1a, 20, G + 2.5, 76);
  },
  slots: [],
  cover: null
};
LAYOUTS.boar_corn = L =>
  rows(L, {
    near: "boar_pumpkin",
    near2: "crow",
    nearTint: "orange",
    mid: "boar",
    midTint: "brown",
    far: "boar_tusker",
    farTint: "gold",
    perch: "crow",
    peek: [
      ["boar", 60],
      ["boar_hen", 20],
      ["farmer", 20, { dont: true }]
    ],
    far2: [["boar_tusker", 100, { pts: 50 }]]
  });
const cornWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 4; k++) sounder(R, add, 1 + k * 6, c, 5);
    for (let k = 0; k < 3; k++) add(2 + k * 7, "boar", charge(R, { v: R(9, 11) * c.S }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  sounder(R, add, R(1, 12), c, 2 + n(2));
  for (let j = 0; j < 1 + n(1); j++) add(R(1, 22), "boar", charge(R, { v: R(9, 11) * c.S }));
  if (k === 1 || k === 4) flyers(["boar_crow", "boar_pheasant"], R, add, c, 3 + n(1.5));
  if (k === 2 || k === 5) add(R(2, 20), "boar_hareRun", run(R, { v: R(9, 11) * c.S, f: R(6, 14) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "boar_foragerWalk", cross(R, { u0: -14, u1: 14, f: R(8, 12), v: 1.5 }));
};

// ---- Level 6: the vineyard ---------------------------------------------------------------

WORLDS.boar_vines = {
  sky: {
    top: "#3a6ab8",
    mid: "#98bce0",
    horizon: "#f8e0b8",
    ground: "#8a7a4a",
    sun: [-25, 20, "#fff4d8", 12],
    clouds: 4,
    hills: [
      { colour: "#7a8a5a", height: 10, rough: 3, trees: true, phase: 2 },
      { colour: "#9a8a5a", height: 5, rough: 2, trees: true }
    ],
    seed: 1011
  },
  fog: 0xe0d0b0,
  build(P) {
    P.ground(0x9a7a4a, [{ u: 0, f: 4, r: 7, c: 0xa88a5a, sx: 3, sz: 0.5 }]);
    // rows of vines running away from you on their stakes and wires
    for (let u = -36; u <= 36; u += 3) {
      if (Math.abs(u) < 2) continue;
      P.add(BOX(0.03, 0.03, 50), 0x6a6a6a, u, G + 1.2, 32);
      P.add(SLAB(0.7, 0.9, 50), Math.abs(u) % 2 ? 0x4a6a2a : 0x5a7a2a, u, G + 0.95, 33);
      for (let f = 8; f < 58; f += 6) P.add(BOX(0.06, 1.4, 0.06), 0x5a4030, u, G + 0.7, f);
      for (let f = 10; f < 56; f += 7) P.add(BALL(0.12, 5), 0x4a1a3a, u + 0.4, G + 0.7, f);
    }
    // the farmhouse on the hill, cypresses, a wine cart
    P.add(BOX(10, 6, 7), 0xe0b888, -14, G + 3, 66);
    P.add(BOX(10.6, 0.5, 7.6), 0xa85a3a, -14, G + 6.3, 66, 0.25, 0, 0);
    P.add(BOX(3, 9, 3), 0xe0b888, -6, G + 4.5, 66);
    for (const [u, f] of [
      [-24, 60],
      [-22, 64],
      [6, 62],
      [10, 66],
      [24, 70],
      [-30, 70]
    ])
      P.add(CONE(0.9, 7, 7), 0x2a4a2a, u, G + 3.5, f);
    P.add(BOX(2.4, 0.9, 1.4), 0x7a5a3a, 6, G + 0.8, 8);
    for (const e of [-1, 1]) P.add(CYL(0.45, 0.45, 0.1, 10), 0x3a2a1a, 6 + e * 0.9, G + 0.45, 7.3, Math.PI / 2);
    for (let k = 0; k < 3; k++) P.add(CYL(0.3, 0.3, 0.7, 10), 0x6a3a1a, 5.4 + k * 0.6, G + 1.6, 8);
  },
  slots: [],
  cover: null
};
LAYOUTS.boar_vines = L =>
  rows(L, {
    near: "boar_mushroom",
    near2: "bottle",
    nearTint: "red",
    mid: "boar",
    midTint: "brown",
    far: "boar_tusker",
    farTint: "gold",
    perch: "crow",
    peek: [
      ["boar", 55],
      ["boar_hen", 25],
      ["boar_forager", 20, { dont: true }]
    ],
    far2: [["boar_tusker", 100, { pts: 50 }]]
  });
const vinesWave = (R, add, c) => {
  // (down a row of vines towards you)
  const row = t => {
    const u = pick(R, [-33, -27, -21, -15, -9, -3, 3, 9, 15, 21, 27, 33]) + 1.5;
    add(
      t,
      R(0, 1) < 0.7 ? "boar" : "piglet",
      charge(R, { v: R(9, 11) * c.S, u0: u, u1: u * 0.3, f0: R(40, 55), zig: 0.2 })
    );
  };
  if (c.x2) {
    for (let k = 0; k < 10; k++) row(1 + k * 2.4);
    flyers(["boar_starling", "boar_starling"], R, add, c, 6);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.6); j++) row(R(1, 22));
  sounder(R, add, R(2, 12), c, 2 + n(1));
  if (k === 1 || k === 4) flyers(["boar_starling", "boar_jay"], R, add, c, 3 + n(2));
  if (k === 2 || k === 5) add(R(2, 20), "boar_foxRun", run(R, { v: R(9, 11) * c.S, f: R(6, 14) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "boar_foragerWalk", cross(R, { u0: -14, u1: 14, f: R(6, 8), v: 1.5 }));
};

// ---- Level 7: the rocky gorge ---------------------------------------------------------------

WORLDS.boar_gorge = {
  sky: {
    top: "#3a6ab0",
    mid: "#98b8d8",
    horizon: "#ecdcc0",
    ground: "#8a7a5a",
    sun: [10, 55, "#fffbe8", 11],
    clouds: 5,
    hills: [{ colour: "#8a7a6a", height: 14, rough: 5 }],
    seed: 1021
  },
  fog: 0xd0c4b0,
  build(P) {
    P.ground(0x9a8a6a, [{ u: 0, f: 30, r: 6, c: 0xb8a888, sx: 1.4, sz: 6 }]);
    // the gorge walls stepping up either side, scree and boulders, holm oaks
    for (const s of [-1, 1])
      for (let f = -6; f < 90; f += 6) {
        const w = 18 - Math.min(6, f * 0.06);
        for (let k = 0; k < 3; k++)
          P.add(
            BOX(6, 4 + k * 3, 6.4),
            [0x9a8a72, 0x8a7a62, 0xaa9a80][k],
            s * (w + 3 + k * 5),
            G + 2 + k * 1.5,
            f,
            0,
            s * 0.1 * k,
            0
          );
      }
    P.scatter(70, 2, 80, (u, f, R) => P.rock(u, f, 0.3 + R() * 1.2, 0x9a8a72), 20);
    P.scatter(30, 6, 80, (u, f, R) => Math.abs(u) > 10 && P.oak(u, f, 0.6 + R() * 0.4, 0x4a5a2a), 40);
    P.scatter(30, 2, 40, (u, f) => P.add(CONE(0.15, 0.5, 4), 0x7a7a4a, u, G + 0.25, f), 14);
  },
  slots: [],
  cover: null
};
LAYOUTS.boar_gorge = L =>
  rows(L, {
    near: "boar_mushroom",
    near2: "squirrel",
    nearTint: "red",
    mid: "boar",
    mid2: "deer_goat",
    midTint: "brown",
    far: "boar_tusker",
    farTint: "gold",
    perch: "vulture",
    peek: [
      ["boar", 60],
      ["deer_goat", 20],
      ["hiker", 20, { dont: true }]
    ],
    far2: [["boar_tusker", 100, { pts: 50 }]]
  });
const gorgeWave = (R, add, c) => {
  const down = t =>
    add(
      t,
      R(0, 1) < 0.7 ? "boar" : "piglet",
      charge(R, { v: R(9, 11) * c.S, u0: R(-8, 8), f0: R(50, 65), zig: R(0.5, 1) })
    );
  if (c.x2) {
    for (let k = 0; k < 9; k++) down(1 + k * 2.6);
    add(6, "bigboar", charge(R, { v: 7 * c.S, f0: 70 }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.5); j++) down(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++)
    add(R(1, 22), "boar_goatRun", skim(R, { v: R(5, 7) * c.S, f: R(18, 40), h: R(3, 6), u0: 18 }));
  if (k === 1 || k === 4) flyers(["vulture", "boar_crow"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.3) add(R(2, 18), "boar_foragerWalk", cross(R, { u0: -8, u1: 8, f: R(8, 12), v: 1.5 }));
};

// ---- Level 8: the apple orchard --------------------------------------------------------------

WORLDS.boar_orchard = {
  sky: {
    top: "#4a7ab8",
    mid: "#a8c4dc",
    horizon: "#f0e4c8",
    ground: "#6a7a3a",
    sun: [-30, 25, "#fff4d8", 11],
    clouds: 8,
    hills: [{ colour: "#6a8a4a", height: 6, rough: 2, trees: true }],
    seed: 1031
  },
  fog: 0xd8d8b8,
  build(P) {
    P.ground(0x6a8a3a, [{ u: 0, f: 4, r: 7, c: 0x7a9a4a, sx: 3, sz: 0.5 }]);
    // the orchard in its rows, apples on and under the trees
    for (let f = 8; f < 70; f += 6)
      for (let u = -36; u <= 36; u += 6) {
        if (Math.abs(u) < 3 && f < 30) continue;
        const o = ((f / 6) % 2) * 3;
        P.add(CYL(0.15, 0.22, 2, 5), 0x5a4030, u + o, G + 1, f);
        P.add(BALL(1.6, 6), 0x4a7a2a, u + o, G + 2.6, f, 0, 0, 0, 1.1, 0.85, 1.1);
        P.add(BALL(0.12, 4), 0xd83a2a, u + o + 1.3, G + 2.4, f - 0.8);
      }
    P.scatter(50, 4, 50, (u, f, R) => P.add(BALL(0.1, 5), R() < 0.5 ? 0xd83a2a : 0x9ab83a, u, G + 0.08, f), 40);
    // crates of apples, a ladder against a tree, the cider press
    for (const [u, f] of [
      [-6, 7],
      [-5, 7.6],
      [5, 8]
    ]) {
      P.add(BOX(0.9, 0.5, 0.6), 0x8a6a46, u, G + 0.25, f);
      P.add(BOX(0.8, 0.12, 0.5), 0xd83a2a, u, G + 0.55, f);
    }
    P.add(BOX(0.5, 3, 0.1), 0x8a6a46, 9.4, G + 1.4, 14, 0, 0, 0.3);
    P.add(BOX(4, 3, 3), 0x8a6a46, -22, G + 1.5, 20);
  },
  slots: [],
  cover: null
};
LAYOUTS.boar_orchard = L =>
  rows(L, {
    near: "boar_hen",
    near2: "squirrel",
    nearTint: "white",
    mid: "boar",
    midTint: "brown",
    far: "boar_tusker",
    farTint: "gold",
    perch: "owl",
    peek: [
      ["boar", 55],
      ["boar_hen", 25],
      ["boar_pig", 20, { dont: true }]
    ],
    far2: [["boar_tusker", 100, { pts: 50 }]]
  });
const orchardWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 4; k++) sounder(R, add, 1 + k * 6, c, 5);
    for (let k = 0; k < 3; k++) add(3 + k * 7, "boar_henW", run(R, { v: R(5, 7) * c.S, f: R(6, 12) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  sounder(R, add, R(1, 12), c, 2 + n(2));
  for (let j = 0; j < 1 + n(1); j++) add(R(1, 22), "boar", charge(R, { v: R(9, 11) * c.S }));
  if (k === 1 || k === 4) flyers(["boar_starling", "woodpigeon"], R, add, c, 3 + n(2));
  if (k === 2 || k === 5) add(R(2, 20), pick(R, ["boar_henW", "boar_henR"]), run(R, { v: R(5, 7) * c.S, f: R(6, 12) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "boar_pigLoose", run(R, { v: R(4, 6), f: R(8, 12) }));
};

// ---- Level 9: the river reeds ----------------------------------------------------------------

WORLDS.boar_reeds = {
  sky: {
    top: "#4a6aa8",
    mid: "#a8b8d0",
    horizon: "#f0dcc0",
    ground: "#5a6a3a",
    sun: [20, 10, "#ffe8b8", 14],
    clouds: 7,
    cloud: "rgba(255,235,220,0.5)",
    hills: [{ colour: "#5a7a4a", height: 5, rough: 2, trees: true }],
    seed: 1041
  },
  fog: 0xd0d0b8,
  build(P) {
    P.ground(0x6a7a3a, [
      { u: 0, f: 24, r: 7, c: 0x5a6a42, sx: 12, sz: 1.2 },
      { u: 0, f: 24, r: 6, c: 0x4a7a9a, sx: 12, sz: 1 }
    ]);
    // reed beds along both banks, willows, the punt tied up, a fisherman's hut
    P.scatter(80, 14, 34, (u, f, R) => Math.abs(f - 24) > 3 && P.reeds(u, f, 0.9 + R() * 0.4), 70);
    P.scatter(20, 2, 12, (u, f, R) => Math.abs(u) > 5 && P.reeds(u, f, 0.8 + R() * 0.3), 50);
    P.scatter(24, 36, 80, (u, f, R) => P.oak(u, f, 0.9 + R() * 0.5, 0x5a7a3a), 80);
    P.add(BOX(5, 0.4, 1.4), 0x6a5a3a, -8, G + 0.2, 22);
    P.add(CYL(0.03, 0.03, 4, 3), 0x8a7a5a, -7, G + 1.6, 22, 0, 0, 0.4);
    P.add(BOX(4, 2.6, 3), 0x7a6a4a, 16, G + 1.3, 32);
    P.add(BOX(4.4, 0.3, 3.4), 0x4a3a2a, 16, G + 2.8, 32, 0.3, 0, 0);
  },
  slots: [],
  cover: null
};
LAYOUTS.boar_reeds = L =>
  rows(L, {
    near: "frog",
    near2: "boar_mushroom",
    nearTint: "green",
    mid: "boar",
    mid2: "heron",
    midTint: "brown",
    far: "boar_tusker",
    farTint: "gold",
    perch: "owl",
    peek: [
      ["boar", 55],
      ["boar_gator", 25],
      ["boar_fisher", 20, { dont: true }]
    ],
    far2: [["boar_tusker", 100, { pts: 50 }]]
  });
const reedsWave = (R, add, c) => {
  const swim = t =>
    add(t, R(0, 1) < 0.6 ? "boar_cornRun" : "boar_gator", skim(R, { v: R(3, 5) * c.S, f: R(20, 28), h: -0.2, u0: 26 }));
  if (c.x2) {
    for (let k = 0; k < 8; k++) swim(1 + k * 2.8);
    for (let k = 0; k < 3; k++) add(2 + k * 7, "boar", charge(R, { v: R(9, 11) * c.S }));
    flyers(["boar_heron", "boar_crow"], R, add, c, 4);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) swim(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++) add(R(1, 22), "boar", charge(R, { v: R(9, 11) * c.S }));
  if (k === 1 || k === 4) flyers(["boar_heron", "teal"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.3) add(R(2, 18), "boar_fisherWalk", cross(R, { u0: -12, u1: 12, f: R(8, 12), v: 1.5 }));
};

// ---- Sound and the levels ------------------------------------------------------------------

Object.assign(AMBIENCE, {
  boar_corn(d, sr, R) {
    bed(d, sr, R, { wind: 2.2, insects: 0.015, birds: 0.02 });
  },
  boar_vines(d, sr, R) {
    bed(d, sr, R, { wind: 1.2, insects: 0.03, birds: 0.02 });
  },
  boar_gorge(d, sr, R) {
    bed(d, sr, R, { wind: 2.4, howl: 0.01 });
  },
  boar_orchard(d, sr, R) {
    bed(d, sr, R, { wind: 1.2, birds: 0.035 });
  },
  boar_reeds(d, sr, R) {
    bed(d, sr, R, { wind: 1.2, water: 0.4, birds: 0.02 });
  }
});

const level = o => ({ music: "boar", ...o });
export const BOAR_MORE = {
  kinds,
  levels: [
    level({
      world: "boar_corn",
      name: "THE CORNFIELD",
      story: "They're in the Millers' corn. Watch the rows",
      amb: "boar_corn",
      legend: "BOAR 75 · PIGLETS 100 · DON'T SHOOT THE FORAGERS",
      wave: cornWave,
      title: (w, x2) => (x2 ? "THE SOUNDER BREAKS COVER · DOUBLE POINTS" : null)
    }),
    level({
      world: "boar_vines",
      name: "THE VINEYARD",
      story: "Harvest time in the hills. They're at the grapes",
      amb: "boar_vines",
      legend: "BOAR DOWN THE ROWS COST YOU 10 · FOXES 100 · DON'T SHOOT THE PICKERS",
      wave: vinesWave,
      title: (w, x2) => (x2 ? "THEY'RE IN EVERY ROW · DOUBLE POINTS" : null)
    }),
    level({
      world: "boar_gorge",
      name: "THE ROCKY GORGE",
      story: "Up the dry gorge. They'll come down the scree",
      amb: "boar_gorge",
      legend: "GOATS ON THE ROCKS 100 · BIG TUSKER WALKS HERE · DON'T SHOOT THE HIKERS",
      wave: gorgeWave,
      title: (w, x2) => (x2 ? "DOWN THE GORGE · DOUBLE POINTS" : null)
    }),
    level({
      world: "boar_orchard",
      name: "THE APPLE ORCHARD",
      story: "The windfalls have brought them in",
      amb: "boar_orchard",
      legend: "BOAR 75 · HENS 50 · DON'T SHOOT THE FARM PIGS",
      wave: orchardWave,
      title: (w, x2) => (x2 ? "THE WHOLE SOUNDER · DOUBLE POINTS" : null)
    }),
    level({
      world: "boar_reeds",
      name: "THE RIVER REEDS",
      story: "They swim the river at dusk. Mind the gators",
      amb: "boar_reeds",
      legend: "SWIMMING BOAR 75 · GATORS 100 · DON'T SHOOT THE FISHERMEN",
      wave: reedsWave,
      title: (w, x2) => (x2 ? "THEY'RE CROSSING · DOUBLE POINTS" : null)
    })
  ]
};
