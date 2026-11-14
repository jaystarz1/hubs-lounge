import { GROUND, BOX, CYL, BALL, CONE, WORLDS, AMBIENCE } from "./shoots-art";
import { LAYOUTS } from "./plates";
import { bird, cross, run, charge, pick, flyers } from "./shoot-paths";
import { rush, skim, bed, natureRows as rows } from "./campaign-kit";

// The White Stag hunt's five more levels (Jay, 2026-10-31: "add five more
// levels to each set"), between the highlands and the Old King:
//   5 THE AUTUMN MAPLES  red and gold woods: whitetails, turkeys, squirrels
//   6 THE RIVER FORD     elk crossing a shallow river, a bear on the bank
//   7 THE ASPEN MEADOW   white trunks, yellow leaves, the bulls bugling
//   8 THE BURNT FOREST   black snags after the fire, mule deer in the ash
//   9 THE MISTY GLEN     a Highland glen at dawn: red stags in the mist

const G = GROUND;

const kinds = {
  deer_whitetail: {
    pts: 75,
    r: 0.6,
    hy: 0.7,
    dies: "fall",
    art: { plate: "buck", tint: 0xc8884a, h: 1.4 },
    face: "slide",
    sound: "thud"
  },
  deer_doeRun: {
    pts: 75,
    r: 0.55,
    hy: 0.6,
    dies: "fall",
    art: { plate: "doe", tint: 0xc8985a, h: 1.25 },
    face: "slide",
    sound: "thud"
  },
  deer_bullElk: {
    pts: 50,
    r: 0.8,
    hy: 1.0,
    dies: "fall",
    art: { plate: "bigbuck", tint: 0x9a6a3a, h: 2.0 },
    face: "slide",
    sound: "roar"
  },
  deer_muley: {
    pts: 75,
    r: 0.6,
    hy: 0.7,
    dies: "fall",
    art: { plate: "buck", tint: 0x8a7a6a, h: 1.5 },
    face: "slide",
    sound: "thud"
  },
  deer_turkeyRun: {
    pts: 100,
    r: 0.35,
    hy: 0.35,
    dies: "fall",
    art: { plate: "turkey", tint: 0x6a4a2a, h: 0.7 },
    face: "slide",
    sound: "caw"
  },
  deer_squirrelRun: {
    pts: 100,
    r: 0.2,
    hy: 0.15,
    dies: "fall",
    art: { plate: "squirrel", tint: 0xa86a3a, h: 0.35 },
    face: "slide",
    sound: "chirp"
  },
  deer_bearRun: {
    pts: 50,
    r: 0.8,
    hy: 0.7,
    dies: "fall",
    art: { plate: "bear", tint: 0x5a3a22, h: 1.4 },
    face: "slide",
    sound: "roar"
  },
  deer_foxRun: {
    pts: 100,
    r: 0.35,
    hy: 0.3,
    dies: "fall",
    art: { plate: "wolf", tint: 0xd8702a, h: 0.6 },
    face: "slide",
    sound: "chirp"
  },
  deer_crow: bird("crow", 25, 0.3, "caw"),
  deer_woodpigeon: bird("woodpigeon", 5, 0.45, "chirp"),
  deer_pheasant: bird("pheasant", 5, 0.5, "caw"),
  deer_goose: bird("duck_canada", 10, 0.6, "honk")
};

// Trees for every season.
function maple(P, u, f, s = 1) {
  P.add(CYL(0.18 * s, 0.28 * s, 3 * s, 6), 0x4a3020, u, G + 1.5 * s, f);
  P.add(
    BALL(1.9 * s, 7),
    [0xc8302a, 0xe8802a, 0xe8b030, 0xa83a1a][Math.abs(Math.round(u * 3 + f)) % 4],
    u,
    G + 4 * s,
    f,
    0,
    0,
    0,
    1.1,
    0.9,
    1.1
  );
}
function aspen(P, u, f, s = 1) {
  P.add(CYL(0.1 * s, 0.14 * s, 6 * s, 5), 0xe8e4d8, u, G + 3 * s, f);
  for (let k = 0; k < 3; k++) P.add(BOX(0.12, 0.04, 0.02), 0x2a2a2a, u, G + (1 + k * 1.4) * s, f - 0.13 * s);
  P.add(
    BALL(1.2 * s, 6),
    Math.abs(Math.round(u + f)) % 3 ? 0xf2c230 : 0xe8a020,
    u,
    G + 6.2 * s,
    f,
    0,
    0,
    0,
    0.8,
    1.4,
    0.8
  );
}
function snag(P, u, f, s = 1) {
  P.add(CYL(0.12 * s, 0.22 * s, 7 * s, 5), 0x1a1612, u, G + 3.5 * s, f, 0.03 * Math.sin(u), 0, 0.03 * Math.cos(f));
  for (let k = 0; k < 2; k++)
    P.add(
      CYL(0.04, 0.07, 1.6 * s, 4),
      0x1a1612,
      u + (k ? 0.6 : -0.5) * s,
      G + (4 + k * 1.5) * s,
      f,
      0,
      0,
      k ? -0.9 : 0.9
    );
}
function heather(P, u, f) {
  P.add(BALL(0.7, 6), Math.abs(Math.round(u * 7 + f)) % 2 ? 0x8a5a8a : 0x6a6a3a, u, G + 0.1, f, 0, 0, 0, 1.4, 0.5, 1.2);
}

// ---- Level 5: the autumn maples --------------------------------------------------------

WORLDS.deer_maples = {
  sky: {
    top: "#4a7ab8",
    mid: "#a8c4dc",
    horizon: "#f0dcc0",
    ground: "#8a5a2a",
    sun: [-30, 30, "#fff4d8", 11],
    clouds: 6,
    hills: [
      { colour: "#a8502a", height: 9, rough: 3, trees: true, phase: 1 },
      { colour: "#c8802a", height: 5, rough: 2, trees: true }
    ],
    seed: 801
  },
  fog: 0xd8b890,
  build(P) {
    P.ground(0x7a6a32, [
      { u: 0, f: 20, r: 10, c: 0x9a6a2a, sx: 2.4, sz: 0.8 },
      { u: -10, f: 34, r: 7, c: 0xb8702a }
    ]);
    P.scatter(110, 4, 90, (u, f, R) => Math.abs(u) > 4 && maple(P, u, f, 0.8 + R() * 0.6), 80, 6);
    P.scatter(
      60,
      2,
      50,
      (u, f, R) =>
        Math.abs(u) > 3 &&
        P.add(BALL(0.4, 6), [0xc8302a, 0xe8802a, 0xe8b030][Math.floor(R() * 3)], u, G + 0.05, f, 0, 0, 0, 2, 0.15, 2),
      50
    );
    for (let k = 0; k < 14; k++) P.add(BOX(2.4, 0.1, 0.12), 0x6a4a2a, -26 + k * 4, G + 0.9, 8);
    for (let k = 0; k < 15; k++) P.add(BOX(0.12, 1.2, 0.12), 0x5a3a20, -28 + k * 4, G + 0.6, 8);
    P.scatter(20, 6, 40, (u, f, R) => P.rock(u, f, 0.4 + R() * 0.6, 0x8a8278), 40, 4);
  },
  slots: [],
  cover: null
};
LAYOUTS.deer_maples = L =>
  rows(L, {
    near: "squirrel",
    near2: "turkey",
    mid: "doe",
    mid2: "buck",
    far: "bigbuck",
    perch: "owl",
    peek: [
      ["buck", 50],
      ["doe", 30],
      ["hiker", 20, { dont: true }]
    ],
    far2: [["bigbuck", 100, { pts: 50 }]]
  });
const maplesWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 12; k++)
      add(1 + k * 2, k % 3 ? "deer_whitetail" : "deer_doeRun", run(R, { v: R(12, 15) * c.S, f: R(14, 44) }));
    flyers(["deer_crow", "deer_pheasant"], R, add, c, 4);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(2); j++)
    add(R(1, 22), R(0, 1) < 0.6 ? "deer_whitetail" : "deer_doeRun", run(R, { v: R(11, 15) * c.S, f: R(12, 46) }));
  for (let j = 0; j < 1 + n(1); j++) add(R(1, 22), "deer_turkeyRun", run(R, { v: R(6, 8) * c.S, f: R(6, 18) }));
  for (let j = 0; j < 1 + n(1); j++)
    add(R(1, 22), "deer_squirrelRun", skim(R, { v: R(5, 7) * c.S, f: 8, h: 0.95, u0: 20 }));
  if (k === 1 || k === 4) flyers(["deer_crow", "deer_pheasant"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.3) add(R(2, 18), "deer_hikerRun", cross(R, { u0: -16, u1: 16, f: R(14, 20), v: 1.6 }));
};

// ---- Level 6: the river ford ----------------------------------------------------------

WORLDS.deer_ford = {
  sky: {
    top: "#3a6ab0",
    mid: "#98bcd8",
    horizon: "#e0e8e8",
    ground: "#4a5a3a",
    sun: [35, 40, "#fffbe8", 10],
    clouds: 8,
    hills: [
      { colour: "#5a7a6a", height: 16, rough: 5, phase: 2, trees: true },
      { colour: "#3a5a3a", height: 8, rough: 3, trees: true }
    ],
    seed: 811
  },
  fog: 0xb8c8c0,
  build(P) {
    P.ground(0x5a6a3a, [
      { u: 0, f: 22, r: 6, c: 0x8a8a7a, sx: 12, sz: 1 },
      { u: 0, f: 22, r: 4.6, c: 0x4a7a9a, sx: 14, sz: 1 }
    ]);
    // stones in the ford, a gravel bar, pines on both banks, a log jam
    P.scatter(40, 18, 26, (u, f, R) => P.rock(u, f, 0.3 + R() * 0.6, 0x8a8a84), 60);
    P.scatter(90, 30, 90, (u, f, R) => P.pine(u, f, 0.9 + R() * 0.8, 0x24502e), 80, 6);
    P.scatter(40, 2, 14, (u, f, R) => Math.abs(u) > 6 && P.pine(u, f, 0.8 + R() * 0.6, 0x2a5a32), 60, 4);
    for (let k = 0; k < 6; k++)
      P.add(
        CYL(0.3, 0.35, 6, 6),
        0x6a5a48,
        -18 + k * 0.6,
        G + 0.4 + (k % 2) * 0.4,
        20 + k * 0.5,
        Math.PI / 2,
        k * 0.4,
        0
      );
    P.scatter(30, 4, 40, (u, f, R) => P.bush(u, f, 0.5 + R() * 0.5, 0x3a6a2a), 60, 3);
  },
  slots: [],
  cover: null
};
LAYOUTS.deer_ford = L =>
  rows(L, {
    near: "frog",
    near2: "rabbit",
    nearTint: "green",
    mid: "bigbuck",
    mid2: "doe",
    far: "bear",
    farTint: "brown",
    perch: "crow",
    peek: [
      ["bigbuck", 50],
      ["bear", 25],
      ["ranger", 25, { dont: true }]
    ],
    far2: [
      ["bear", 50, { pts: 50 }],
      ["bigbuck", 50, { pts: 50 }]
    ]
  });
const fordWave = (R, add, c) => {
  const ford = (t, kind = R(0, 1) < 0.7 ? "deer_bullElk" : "deer_doeRun") =>
    add(
      t,
      kind,
      rush(
        R,
        [
          [pick(R, [-1, 1]) * R(20, 30), R(30, 38), G],
          [R(-10, 10), 22, G - 0.2],
          [pick(R, [-1, 1]) * R(20, 30), R(10, 14), G]
        ],
        R(5, 7) * c.S,
        false
      )
    );
  if (c.x2) {
    for (let k = 0; k < 12; k++) ford(1 + k * 2);
    add(6, "deer_bearRun", charge(R, { v: 8 * c.S, f0: 50 }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(2); j++) ford(R(1, 22));
  if (k === 1 || k === 4) add(R(2, 16), "deer_bearRun", run(R, { v: R(7, 9) * c.S, f: R(30, 40) }));
  if (k === 2 || k === 5) flyers(["deer_goose", "deer_crow"], R, add, c, 2 + n(1.5));
  if (k === 0 || k === 3) add(R(2, 20), "deer_foxRun", run(R, { v: R(9, 11) * c.S, f: R(6, 14) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "deer_rangerRun", cross(R, { u0: -16, u1: 16, f: R(10, 14), v: 1.6 }));
};

// ---- Level 7: the aspen meadow --------------------------------------------------------

WORLDS.deer_aspen = {
  sky: {
    top: "#3a7ac8",
    mid: "#98c4e8",
    horizon: "#e8f0f0",
    ground: "#8a9a4a",
    sun: [-20, 45, "#fffbe8", 11],
    clouds: 9,
    hills: [
      { colour: "#8a9aa8", height: 20, rough: 6, phase: 1 },
      { colour: "#5a7a4a", height: 8, rough: 3, trees: true }
    ],
    seed: 821
  },
  fog: 0xc8d8d0,
  build(P) {
    P.ground(0x9aa04a, [
      { u: 0, f: 24, r: 14, c: 0xa8b05a, sx: 2, sz: 1 },
      { u: 8, f: 40, r: 8, c: 0x8a9a3a }
    ]);
    P.scatter(130, 6, 90, (u, f, R) => (Math.abs(u) > 12 || f > 44) && aspen(P, u, f, 0.8 + R() * 0.5), 80);
    P.scatter(
      60,
      2,
      40,
      (u, f, R) => P.add(CONE(0.1, 0.5, 4), [0xe8d040, 0xf4efe2, 0x8a6ae8][Math.floor(R() * 3)], u, G + 0.25, f),
      30
    );
    P.scatter(20, 4, 40, (u, f, R) => P.rock(u, f, 0.4 + R() * 0.8, 0x9a9a94), 40, 4);
  },
  slots: [],
  cover: null
};
LAYOUTS.deer_aspen = L =>
  rows(L, {
    near: "deer_marmot",
    near2: "rabbit",
    mid: "bigbuck",
    mid2: "doe",
    far: "bigbuck",
    perch: "deer_grouse",
    peek: [
      ["bigbuck", 60],
      ["doe", 20],
      ["hiker", 20, { dont: true }]
    ],
    far2: [["bigbuck", 100, { pts: 50 }]]
  });
const aspenWave = (R, add, c) => {
  if (c.x2) {
    // the bulls bugle and come
    for (let k = 0; k < 8; k++) add(1 + k * 3, "deer_bullElk", charge(R, { v: R(8, 10) * c.S, f0: R(40, 55) }));
    for (let k = 0; k < 4; k++) add(2 + k * 6, "deer_doeRun", run(R, { v: R(12, 14) * c.S, f: R(20, 40) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.4); j++) add(R(1, 22), "deer_bullElk", run(R, { v: R(10, 13) * c.S, f: R(20, 46) }));
  for (let j = 0; j < 1 + n(1.4); j++) add(R(1, 22), "deer_doeRun", run(R, { v: R(12, 15) * c.S, f: R(14, 40) }));
  if (k === 1 || k === 4) add(R(2, 16), "deer_bullElk", charge(R, { v: R(8, 10) * c.S, f0: R(40, 55) }));
  if (k === 2 || k === 5) flyers(["deer_eagle", "deer_grouse"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.3) add(R(2, 18), "deer_hikerRun", cross(R, { u0: -16, u1: 16, f: R(14, 20), v: 1.6 }));
};

// ---- Level 8: the burnt forest -----------------------------------------------------------

WORLDS.deer_burnt = {
  sky: {
    top: "#5a6a8a",
    mid: "#a8a8a8",
    horizon: "#d8c8b0",
    ground: "#3a3028",
    sun: [10, 25, "#ffd8a0", 13],
    clouds: 10,
    cloud: "rgba(160,150,140,0.55)",
    hills: [
      { colour: "#4a4a44", height: 10, rough: 4, phase: 2 },
      { colour: "#3a3430", height: 5, rough: 2, trees: true }
    ],
    seed: 831
  },
  fog: 0xa8a098,
  build(P) {
    P.ground(0x3a342c, [
      { u: 0, f: 20, r: 10, c: 0x4a5a2a, sx: 2.6, sz: 0.8 },
      { u: -12, f: 36, r: 6, c: 0x2a2620 }
    ]);
    P.scatter(140, 4, 90, (u, f, R) => Math.abs(u) > 3 && snag(P, u, f, 0.7 + R() * 0.7), 80, 5);
    // green coming back: fireweed and saplings; fallen trunks
    P.scatter(70, 2, 40, (u, f, R) => P.add(CONE(0.12, 0.7, 4), R() < 0.5 ? 0xd84a9a : 0x4a8a3a, u, G + 0.35, f), 50);
    for (const [u, f, a] of [
      [-8, 10, 0.4],
      [7, 16, -0.6],
      [-14, 26, 1.1]
    ])
      P.add(CYL(0.3, 0.4, 7, 6), 0x1a1612, u, G + 0.35, f, Math.PI / 2, a, 0);
  },
  slots: [],
  cover: null
};
LAYOUTS.deer_burnt = L =>
  rows(L, {
    near: "rabbit",
    near2: "squirrel",
    nearTint: "white",
    mid: "buck",
    mid2: "doe",
    far: "wolf",
    farTint: "steel",
    perch: "crow",
    wood: 0x1a1612,
    peek: [
      ["buck", 50],
      ["wolf", 30],
      ["ranger", 20, { dont: true }]
    ],
    far2: [
      ["wolf", 50, { pts: 50 }],
      ["bigbuck", 50, { pts: 50 }]
    ]
  });
const burntWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 10; k++) add(1 + k * 2.4, "deer_muley", run(R, { v: R(11, 14) * c.S, f: R(12, 44) }));
    for (let k = 0; k < 3; k++) add(3 + k * 7, "deer_wolf", charge(R, { v: R(10, 12) * c.S, f0: R(35, 50) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(2); j++) add(R(1, 22), "deer_muley", run(R, { v: R(10, 14) * c.S, f: R(12, 46) }));
  if (k === 1 || k === 4) add(R(2, 16), "deer_wolf", charge(R, { v: R(10, 12) * c.S, f0: R(35, 50) }));
  if (k === 2 || k === 5) flyers(["deer_crow", "vulture"], R, add, c, 2 + n(1.5));
  if (k === 0 || k === 3) add(R(2, 20), "deer_foxRun", run(R, { v: R(9, 11) * c.S, f: R(6, 14) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "deer_rangerRun", cross(R, { u0: -16, u1: 16, f: R(10, 14), v: 1.6 }));
};

// ---- Level 9: the misty glen ------------------------------------------------------------

WORLDS.deer_glen = {
  sky: {
    top: "#6a7a9a",
    mid: "#b8c0cc",
    horizon: "#e8e0d8",
    ground: "#5a5a3a",
    sun: [-15, 6, "#ffe8c0", 15],
    clouds: 12,
    cloud: "rgba(230,230,235,0.7)",
    hills: [
      { colour: "#6a6a7a", height: 18, rough: 5, phase: 1 },
      { colour: "#5a5a4a", height: 10, rough: 3 }
    ],
    seed: 841
  },
  fog: 0xd8dad8,
  build(P) {
    P.ground(0x6a6a3a, [
      { u: 4, f: 12, r: 2.4, c: 0x5a7a8a, sx: 1.4, sz: 2.4 },
      { u: -2, f: 20, r: 2.4, c: 0x5a7a8a, sx: 1.6, sz: 2.2 },
      { u: 5, f: 28, r: 2.4, c: 0x5a7a8a, sx: 1.6, sz: 2.2 },
      { u: -3, f: 37, r: 2.4, c: 0x5a7a8a, sx: 1.8, sz: 2.4 },
      { u: 6, f: 47, r: 2.4, c: 0x5a7a8a, sx: 2, sz: 2.6 },
      { u: -14, f: 20, r: 10, c: 0x7a5a6a, sx: 1.4, sz: 1 }
    ]);
    P.scatter(160, 2, 80, (u, f) => heather(P, u, f), 80, 3);
    P.scatter(30, 10, 80, (u, f, R) => P.rock(u, f, 0.6 + R() * 1.4, 0x8a8a84), 80, 4);
    // a stone bothy, a dry-stone wall, a few Scots pines
    P.add(BOX(5, 2.6, 4), 0x8a8a84, 16, G + 1.3, 30);
    P.add(BOX(5.4, 0.3, 4.6), 0x3a3a3a, 16, G + 2.8, 30, 0.3, 0, 0);
    for (let k = 0; k < 20; k++)
      P.add(BOX(1.4, 0.9, 0.6), 0x8a8a84, -30 + k * 1.5, G + 0.45, 14 + Math.sin(k * 0.4) * 1.5, 0, k * 0.1, 0);
    P.scatter(14, 30, 80, (u, f, R) => P.pine(u, f, 1 + R() * 0.6, 0x2a4a2a), 80, 10);
    // mist: pale low clouds in the glen
    P.scatter(
      24,
      20,
      70,
      (u, f, R) => P.add(BALL(1, 8), 0xe8eaea, u, G + 1.2 + R(), f, 0, 0, 0, 6 + R() * 6, 0.6, 2.5),
      70
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.deer_glen = L =>
  rows(L, {
    near: "deer_grouse",
    near2: "rabbit",
    mid: "bigbuck",
    mid2: "doe",
    far: "deer_royal",
    farTint: "white",
    perch: "crow",
    peek: [
      ["bigbuck", 50],
      ["doe", 25],
      ["deer_cow", 25, { dont: true }]
    ],
    far2: [["bigbuck", 100, { pts: 50 }]]
  });
const glenWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 8; k++) add(1 + k * 3, "deer_redStag", run(R, { v: R(11, 14) * c.S, f: R(16, 46) }));
    for (let k = 0; k < 6; k++) add(2 + k * 4, "deer_hind", run(R, { v: R(12, 15) * c.S, f: R(16, 40) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.6); j++) add(R(1, 22), "deer_redStag", run(R, { v: R(11, 14) * c.S, f: R(16, 46) }));
  for (let j = 0; j < 1 + n(1.4); j++) add(R(1, 22), "deer_hind", run(R, { v: R(12, 15) * c.S, f: R(14, 40) }));
  if (k === 1 || k === 4) flyers(["deer_grouse", "deer_ptarmigan"], R, add, c, 3 + n(1.5));
  if (k === 2 || k === 5) flyers(["deer_eagle", "deer_crow"], R, add, c, 2);
  if (R(0, 1) < 0.3) add(R(2, 18), "deer_cattle", run(R, { v: 2, f: R(10, 16) }));
};

// ---- Sound and the levels ----------------------------------------------------------------

Object.assign(AMBIENCE, {
  deer_maples(d, sr, R) {
    bed(d, sr, R, { wind: 1.6, birds: 0.03 });
  },
  deer_ford(d, sr, R) {
    bed(d, sr, R, { wind: 1.0, water: 0.7, birds: 0.02 });
  },
  deer_aspen(d, sr, R) {
    bed(d, sr, R, { wind: 1.8, birds: 0.02, howl: 0.02 });
  },
  deer_burnt(d, sr, R) {
    bed(d, sr, R, { wind: 2.0 });
  },
  deer_glen(d, sr, R) {
    bed(d, sr, R, { wind: 2.2, water: 0.2, howl: 0.015 });
  }
});

const level = o => ({ music: "deer", ...o });
export const DEER_MORE = {
  kinds,
  levels: [
    level({
      world: "deer_maples",
      name: "THE AUTUMN MAPLES",
      story: "October in the hardwoods. The leaves are falling",
      amb: "deer_maples",
      legend: "WHITETAILS 75 · TURKEYS AND SQUIRRELS 100 · DON'T SHOOT THE HIKERS",
      wave: maplesWave,
      title: (w, x2) => (x2 ? "THE WHOLE HERD RUNS · DOUBLE POINTS" : null)
    }),
    level({
      world: "deer_ford",
      name: "THE RIVER FORD",
      story: "The elk cross at the shallows at first light",
      amb: "deer_ford",
      legend: "ELK 50 · FOXES 100 · BEARS 50 · DON'T SHOOT THE RANGERS",
      wave: fordWave,
      title: (w, x2) => (x2 ? "THE HERD CROSSES · DOUBLE POINTS" : null)
    }),
    level({
      world: "deer_aspen",
      name: "THE ASPEN MEADOW",
      story: "Golden aspens. Listen for the bulls bugling",
      amb: "deer_aspen",
      legend: "BULL ELK 50 · CHARGING BULLS COST YOU 10 · DON'T SHOOT THE HIKERS",
      wave: aspenWave,
      title: (w, x2) => (x2 ? "THE BULLS ARE BUGLING · DOUBLE POINTS" : null)
    }),
    level({
      world: "deer_burnt",
      name: "THE BURNT FOREST",
      story: "After the fire. The mule deer graze the new green",
      amb: "deer_burnt",
      legend: "MULE DEER 75 · WOLVES 75 · DON'T SHOOT THE RANGERS",
      wave: burntWave,
      title: (w, x2) => (x2 ? "THE WOLVES ARE HUNTING · DOUBLE POINTS" : null)
    }),
    level({
      world: "deer_glen",
      name: "THE MISTY GLEN",
      story: "A Highland glen at dawn. Red stags in the mist",
      amb: "deer_glen",
      legend: "RED STAGS AND HINDS 75 · THE ROYAL 50 · DON'T SHOOT THE CATTLE",
      wave: glenWave,
      title: (w, x2) => (x2 ? "THE STAGS ROAR · DOUBLE POINTS" : null)
    })
  ]
};
