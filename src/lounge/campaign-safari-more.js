import { GROUND, BOX, CYL, BALL, CONE, TORUS, SLAB, WORLDS, AMBIENCE } from "./shoots-art";
import { LAYOUTS, PLATE_SOUND } from "./plates";
import { SHAPES } from "./plates-shapes";
import { bird, cross, across, run, charge, pick, flyers } from "./shoot-paths";
import { rush, skim, bed } from "./campaign-kit";

// Safari night's five more levels (Jay, 2026-10-31: "add five more levels
// to each set"), between the kopjes and the great stampede:
//   5 THE RIVER CROSSING  the Mara: the herds coming down the bank and
//                       through the water, the crocodiles waiting
//   6 THE DESERT        red dunes: oryx, ostriches, meerkats up on watch
//   7 THE FLAMINGO LAKE the soda lake gone pink, hyenas on its shore
//   8 THE BAOBAB PLAIN  sunset under the baobabs: elephants, giraffes, rhino
//   9 THE NIGHT CAMP    the expedition's fire; eyes in the dark

const G = GROUND;

Object.assign(SHAPES, {
  // an ostrich, running, facing left
  safari_ostrich: {
    polys: [[30, 40, 44, 30, 70, 30, 84, 40, 80, 56, 50, 60, 34, 54]],
    lines: [
      [5, 36, 42, 24, 20, 20, 2],
      [4, 52, 58, 46, 78, 54, 96],
      [4, 64, 58, 72, 78, 66, 96]
    ],
    dots: [[19, 4, 2]],
    marks: [[3, 16, 3, 10, 6]]
  },
  // a meerkat on watch, standing up
  safari_meerkat: {
    polys: [[14, 10, 26, 10, 30, 30, 32, 70, 26, 90, 14, 90, 8, 70, 10, 30]],
    lines: [
      [4, 26, 88, 36, 96],
      [3, 12, 40, 18, 50],
      [3, 28, 40, 22, 50]
    ],
    dots: [
      [16, 16, 1.6],
      [24, 16, 1.6]
    ],
    marks: [[2, 18, 22, 22, 22]]
  },
  // a warthog, facing left
  safari_warthog: {
    polys: [[10, 24, 26, 14, 70, 14, 86, 22, 88, 40, 74, 44, 20, 46, 6, 40]],
    lines: [
      [6, 24, 44, 22, 60],
      [6, 36, 44, 38, 60],
      [6, 64, 44, 62, 60],
      [6, 76, 42, 78, 60],
      [3, 88, 24, 98, 14],
      [3, 8, 36, 2, 30]
    ],
    marks: [[4, 50, 14, 76, 10]],
    dots: [[16, 26, 2]]
  }
});
PLATE_SOUND.safari_meerkat = "squeak";

const kinds = {
  safari_ostrich: {
    pts: 75,
    r: 0.6,
    hy: 0.9,
    dies: "fall",
    art: { plate: "safari_ostrich", tint: 0x3a3a3a, h: 2.2 },
    face: "slide",
    sound: "honk"
  },
  safari_oryx: {
    pts: 75,
    r: 0.6,
    hy: 0.7,
    dies: "fall",
    art: { plate: "antelope", tint: 0xd8c8a8, h: 1.5 },
    face: "slide",
    sound: "thud"
  },
  safari_warthog: {
    pts: 100,
    r: 0.4,
    hy: 0.35,
    dies: "fall",
    art: { plate: "safari_warthog", tint: 0x8a6a5a, h: 0.7 },
    face: "slide",
    sound: "squeal"
  },
  safari_giraffeRun: {
    pts: 50,
    r: 0.9,
    hy: 2.2,
    dies: "fall",
    art: { plate: "giraffe", tint: 0xe8b040, h: 4.4 },
    face: "slide",
    sound: "thud"
  },
  safari_hyenaRun: {
    pts: 75,
    r: 0.5,
    hy: 0.45,
    dies: "fall",
    art: { plate: "safari_hyena", tint: 0xb8a070, h: 0.9 },
    face: "slide",
    sound: "roar"
  },
  safari_crocSwim: {
    pts: 100,
    r: 0.5,
    hy: 0.2,
    dies: "fall",
    art: { plate: "safari_croc", tint: 0x5a6a3a, h: 0.5 },
    face: "slide",
    sound: "splat"
  },
  safari_flamingoFly: bird("safari_flamingo", 10, 0.5, "honk"),
  safari_eagle: bird("deer_eagle", 25, 0.5, "caw"),
  safari_owl: bird("boar_owl", 25, 0.35, "chirp"),
  safari_explorerRun: {
    pts: -25,
    r: 0.45,
    hy: 0.99,
    dies: "fall",
    art: { plate: "safari_explorer", tint: 0xffffff, h: 1.8 },
    face: "slide",
    sound: "wrong",
    foe: true,
    name: "OUR GUIDE! DON'T SHOOT!"
  }
};

function baobab(P, u, f, s = 1) {
  P.add(CYL(1.4 * s, 2.2 * s, 7 * s, 9), 0x8a7a6a, u, G + 3.5 * s, f);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    P.add(
      CYL(0.15 * s, 0.35 * s, 3 * s, 5),
      0x7a6a5a,
      u + Math.cos(a) * 1.4 * s,
      G + 8 * s,
      f + Math.sin(a) * 1.4 * s,
      Math.sin(a) * 0.7,
      0,
      -Math.cos(a) * 0.7
    );
    P.add(
      BALL(0.9 * s, 6),
      0x5a7a2a,
      u + Math.cos(a) * 2.6 * s,
      G + 9.2 * s,
      f + Math.sin(a) * 2.6 * s,
      0,
      0,
      0,
      1.3,
      0.7,
      1.3
    );
  }
}
function tent(P, u, f, c = 0xc8b890) {
  P.add(CONE(2, 2.4, 4), c, u, G + 1.2, f, 0, Math.PI / 4, 0, 1, 1, 1.4);
  P.add(BOX(0.8, 1.4, 0.05), 0x2a1a10, u, G + 0.7, f - 1.38);
}

// ---- Level 5: the river crossing ---------------------------------------------------------

const RIV = { NEAR: 10, FAR: 24, BANK: 30 };
WORLDS.safari_river = {
  sky: {
    top: "#3a72b8",
    mid: "#9ac0d8",
    horizon: "#f0dcb0",
    ground: "#a88a5a",
    sun: [30, 45, "#fffbe8", 11],
    clouds: 6,
    hills: [
      { colour: "#a88a5a", height: 4, rough: 1.5, phase: 2 },
      { colour: "#8a7a4a", height: 2, rough: 1 }
    ],
    seed: 701
  },
  fog: 0xd8c8a0,
  build(P) {
    P.ground(0xb89a62, [
      { u: 0, f: (RIV.NEAR + RIV.FAR) / 2, r: 7, c: 0x7a6a42, sx: 12, sz: 1 },
      { u: 0, f: (RIV.NEAR + RIV.FAR) / 2, r: 6, c: 0x4a7a9a, sx: 12, sz: 0.9 }
    ]);
    // the far bank: a steep earth cliff the herd comes down, trampled ramps
    P.add(SLAB(120, 3, 3), 0x9a7a4a, 0, G + 1.5, RIV.FAR + 1.5, -0.4, 0, 0);
    for (const u of [-14, 0, 14]) P.add(BOX(5, 0.2, 6), 0xa8885a, u, G + 1.2, RIV.FAR + 1, -0.45, 0, 0);
    // rocks in the water, a dead tree, acacias on both banks, the herds waiting
    for (const [u, f] of [
      [-8, 15],
      [6, 18],
      [16, 14],
      [-18, 19]
    ])
      P.rock(u, f, 1.6, 0x6a5a4a);
    P.add(CYL(0.2, 0.3, 5, 5), 0x6a5a48, -4, G + 2, 20, 0, 0, 0.6);
    P.scatter(30, 2, 9, (u, f, R) => Math.abs(u) > 6 && P.acacia(u, f, 0.8 + R() * 0.5), 60, 4);
    P.scatter(24, 32, 80, (u, f, R) => P.acacia(u, f, 0.9 + R() * 0.6), 80, 8);
    for (let k = 0; k < 60; k++) {
      const u = -40 + (k % 20) * 4 + ((k * 7) % 3);
      const f = 36 + Math.floor(k / 20) * 2.5;
      P.add(BOX(1.4, 0.8, 0.5), 0x3a3028, u, G + 0.9, f);
      P.add(BOX(0.4, 0.4, 0.4), 0x2a2420, u - 0.8, G + 1.1, f);
    }
    P.scatter(
      30,
      RIV.NEAR - 1,
      RIV.FAR - 1,
      (u, f, R) => P.add(BOX(2 + R() * 3, 0.03, 0.2), 0x8aa0a8, u, G + 0.06, f),
      50
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.safari_river = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "safari_croc", n: 6, f: 4, u0: -4.5, u1: 4.5, size: 0.4, tint: "green", bank: 3 });
  for (const [u, f] of [
    [-8, 15],
    [6, 18],
    [16, 14],
    [-18, 19]
  ])
    L.row({ ...fixed, kind: "vulture", n: 1, f: f - 0.4, u0: u, u1: u, base: 1.0, size: 0.45, tint: "brown" });
  L.row({ kind: "zebra", n: 5, f: RIV.FAR + 2.4, u0: -10, u1: 10, base: 1.7, size: 0.7, tint: "white", bank: 5 });
  L.row({ kind: "safari_gnu", n: 6, f: 36, u0: -14, u1: 14, base: 0.4, size: 0.7, tint: "brown", bank: 3 });
  L.row({ kind: "lion", n: 3, f: 50, u0: -12, u1: 12, base: 0.6, size: 0.9, tint: "gold", bank: 3 });
  L.pops({
    fixed: true,
    f: 16,
    at: [
      [-12, -0.4],
      [2, -0.4],
      [12, -0.4]
    ],
    size: 0.8,
    kinds: [["safari_croc", 100, { pts: 50 }]]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 8,
    at: [
      [-10, 0],
      [10, 0]
    ],
    size: 1.8,
    kinds: [
      ["safari_hyena", 60],
      ["safari_guide", 20, { dont: true }],
      ["safari_explorer", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: RIV.FAR + 2,
    at: [
      [-20, 1.6],
      [20, 1.6]
    ],
    size: 1.4,
    kinds: [
      ["lion", 60],
      ["safari_leopard", 40]
    ]
  });
  L.pops({
    fixed: true,
    f: RIV.FAR + 2,
    at: [
      [-6, 1.6],
      [8, 1.6]
    ],
    size: 1.5,
    kinds: [
      ["safari_hyena", 60],
      ["safari_baboon", 40]
    ]
  });
};
const riverWave = (R, add, c) => {
  const ford = (t, kind = R(0, 1) < 0.6 ? "safari_gnu" : "zebra") =>
    add(
      t,
      kind,
      rush(
        R,
        [
          [R(-14, 14), RIV.FAR + 2, G + 1.2],
          [R(-12, 12), (RIV.NEAR + RIV.FAR) / 2, G - 0.3],
          [pick(R, [-1, 1]) * R(20, 30), RIV.NEAR - 2, G]
        ],
        R(5, 7) * c.S,
        false
      )
    );
  const croc = t =>
    add(t, "safari_crocSwim", skim(R, { v: R(2, 3.5) * c.S, f: R(RIV.NEAR + 2, RIV.FAR - 2), h: -0.1, u0: 24 }));
  if (c.x2) {
    for (let k = 0; k < 14; k++) ford(1 + k * 1.6);
    for (let k = 0; k < 4; k++) croc(2 + k * 5);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 3 + n(2.5); j++) ford(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++) croc(R(1, 22));
  if (k === 2 || k === 5) flyers(["safari_stork", "vulture"], R, add, c, 2 + n(1.5));
  if (k === 1 || k === 4)
    add(R(2, 16), R(0, 1) < 0.5 ? "lion" : "lioness", charge(R, { v: R(9, 11) * c.S, f0: R(40, 55) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "safari_explorerRun", cross(R, { u0: -16, u1: 16, f: 7, v: 2.4 }));
};

// ---- Level 6: the desert ------------------------------------------------------------------

WORLDS.safari_desert = {
  sky: {
    top: "#3a7ac8",
    mid: "#8ab8e8",
    horizon: "#f8e0c0",
    ground: "#c8703a",
    sun: [20, 50, "#fffbe8", 12],
    clouds: 1,
    hills: [
      { colour: "#c86a3a", height: 9, rough: 1.5, phase: 1 },
      { colour: "#d8804a", height: 5, rough: 1 }
    ],
    seed: 711
  },
  fog: 0xe8b890,
  build(P) {
    P.ground(0xd8804a, [{ u: 0, f: 14, r: 10, c: 0xe8a070, sx: 3, sz: 0.6 }]);
    // the great red dunes, their knife-edge crests, dead camel-thorn trees
    for (const [u, f, sx, sy] of [
      [-26, 30, 14, 7],
      [24, 34, 16, 9],
      [-4, 52, 22, 11],
      [-40, 56, 14, 8],
      [36, 60, 14, 9]
    ]) {
      P.add(BALL(1, 14), 0xc8603a, u, G - 0.5, f, 0, 0, 0, sx, sy, sx * 0.5);
      P.add(BALL(1, 14), 0xe8905a, u + sx * 0.2, G - 0.5, f - 1, 0, 0, 0, sx * 0.8, sy * 0.92, sx * 0.3);
    }
    for (const [u, f] of [
      [-8, 12],
      [9, 16],
      [-14, 22],
      [16, 24],
      [0, 30]
    ]) {
      P.add(CYL(0.12, 0.2, 2.6, 5), 0x3a2a1a, u, G + 1.3, f);
      for (let k = 0; k < 4; k++)
        P.add(
          CYL(0.05, 0.08, 1.6, 4),
          0x3a2a1a,
          u + Math.cos(k * 1.7) * 0.6,
          G + 2.6,
          f + Math.sin(k * 1.7) * 0.6,
          Math.sin(k) * 0.8,
          0,
          Math.cos(k) * 0.8
        );
    }
    // a white salt pan, termite mounds, stones
    P.add(CYL(8, 8, 0.03, 20), 0xf0e8d8, 12, G + 0.05, 40, 0, 0, 0, 1, 1, 0.5);
    P.scatter(
      16,
      6,
      40,
      (u, f, R) => Math.abs(u) > 4 && P.add(CONE(0.6 + R() * 0.3, 1.6 + R(), 6), 0xa8603a, u, G + 0.8, f),
      40,
      4
    );
    P.scatter(50, 2, 60, (u, f, R) => P.rock(u, f, 0.2 + R() * 0.4, 0xb8704a), 60);
    P.scatter(
      40,
      10,
      90,
      (u, f, R) =>
        P.add(
          BALL(1, 10),
          R() < 0.5 ? 0xd8804a : 0xc8703a,
          u,
          G - 0.3,
          f,
          0,
          R() * 3,
          0,
          4 + R() * 4,
          1 + R(),
          2 + R()
        ),
      85,
      8
    );
    P.scatter(
      30,
      2,
      30,
      (u, f) => Math.abs(u) > 4 && P.add(BALL(0.4, 8), 0x8a8a4a, u, G + 0.2, f, 0, 0, 0, 1.4, 0.6, 1.2),
      40,
      4
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.safari_desert = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "safari_meerkat", n: 6, f: 4, u0: -4.5, u1: 4.5, size: 0.4, tint: "brown", bank: 3 });
  L.row({ kind: "safari_meerkat", n: 4, f: 14, u0: -6, u1: 6, size: 0.45, tint: "brown", bank: 4 });
  for (const [u, f] of [
    [-8, 12],
    [9, 16],
    [-14, 22],
    [16, 24],
    [0, 30]
  ])
    L.row({ ...fixed, kind: "vulture", n: 1, f: f - 0.3, u0: u, u1: u, base: 2.6, size: 0.5, tint: "brown" });
  L.row({ kind: "safari_ostrich", n: 4, f: 36, u0: -12, u1: 12, base: 0.2, size: 1.0, tint: "white", bank: 4 });
  L.row({ kind: "antelope", n: 4, f: 48, u0: -14, u1: 14, base: 1.2, size: 0.9, tint: "white", bank: 4 });
  L.pops({
    fixed: true,
    f: 20,
    at: [
      [-6, 0],
      [6, 0],
      [-15, 0],
      [15, 0]
    ],
    size: 0.7,
    kinds: [["safari_meerkat", 100, { pts: 50 }]]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 28,
    at: [
      [-7, 0],
      [7, 0]
    ],
    size: 1.8,
    kinds: [
      ["safari_hyena", 50],
      ["safari_baboon", 20],
      ["safari_guide", 30, { dont: true }]
    ]
  });
  L.row({ ...fixed, kind: "safari_meerkat", n: 3, f: 30, u0: -1.2, u1: 1.2, size: 0.45, tint: "brown", bank: 3 });
  L.pops({
    fixed: true,
    f: 10,
    at: [
      [-9, 0],
      [9, 0]
    ],
    size: 0.6,
    kinds: [["safari_meerkat", 100, { pts: 50 }]]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 40,
    at: [
      [-20, 0],
      [22, 0]
    ],
    size: 1.8,
    kinds: [
      ["safari_hyena", 60, { pts: 50 }],
      ["safari_baboon", 40, { pts: 50 }]
    ]
  });
};
const desertWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 8; k++)
      add(1 + k * 2.6, k % 2 ? "safari_ostrich" : "safari_oryx", run(R, { v: R(13, 17) * c.S, f: R(12, 40) }));
    flyers(["safari_eagle", "vulture"], R, add, c, 6);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.6); j++)
    add(R(1, 22), R(0, 1) < 0.5 ? "safari_ostrich" : "safari_oryx", run(R, { v: R(12, 16) * c.S, f: R(10, 44) }));
  for (let j = 0; j < 1 + n(1); j++) add(R(1, 22), "safari_warthog", run(R, { v: R(8, 10) * c.S, f: R(6, 20) }));
  if (k === 2 || k === 5) flyers(["safari_eagle", "vulture"], R, add, c, 2 + n(1.5));
  if (k === 1 || k === 4) add(R(2, 18), "safari_hyenaRun", charge(R, { v: R(9, 11) * c.S, f0: R(40, 55) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "safari_explorerRun", cross(R, { u0: -16, u1: 16, f: 8, v: 2.4 }));
};

// ---- Level 7: the flamingo lake -------------------------------------------------------------

WORLDS.safari_flamingo = {
  sky: {
    top: "#5a7ab8",
    mid: "#c8a8c8",
    horizon: "#f8d0b8",
    ground: "#d8a0a8",
    sun: [-25, 12, "#fff0d8", 14],
    clouds: 6,
    cloud: "rgba(255,220,220,0.5)",
    hills: [{ colour: "#8a7a8a", height: 6, rough: 3, phase: 1 }],
    seed: 721
  },
  fog: 0xe8c8c8,
  build(P) {
    P.ground(0xc8b898, [
      { u: 0, f: 34, r: 30, c: 0xe8a0a8, sx: 2.4, sz: 0.8 },
      { u: 0, f: 34, r: 20, c: 0xf0b0b8, sx: 2.4, sz: 0.8 }
    ]);
    // the white crust at the edge, the flamingos standing in the shallows
    P.add(TORUS(30, 0.6, 40), 0xf4f0e8, 0, G + 0.02, 34, Math.PI / 2, 0, 0, 2.4, 0.8, 0.05);
    for (let k = 0; k < 90; k++) {
      const u = -30 + ((k * 37) % 60);
      const f = 24 + ((k * 53) % 26);
      P.add(BALL(0.25, 6), 0xf28aa0, u, G + 0.9, f, 0, 0, 0, 1.4, 0.8, 0.8);
      P.add(CYL(0.02, 0.02, 0.8, 3), 0xe86a8a, u, G + 0.4, f);
      P.add(CYL(0.025, 0.025, 0.6, 3), 0xf28aa0, u - 0.2, G + 1.25, f, 0, 0, 0.4);
    }
    // the shore: rocks, thorn scrub, a hide built of reeds
    P.scatter(30, 2, 18, (u, f, R) => Math.abs(u) > 4 && P.bush(u, f, 0.5 + R() * 0.5, 0x6a7a4a), 50, 4);
    P.scatter(20, 2, 20, (u, f, R) => P.rock(u, f, 0.4 + R() * 0.6, 0x8a7a6a), 50, 4);
    // the hides: low reed screens either side of you
    for (const s of [-1, 1])
      for (let k = 0; k < 10; k++) P.add(CYL(0.04, 0.04, 1.2, 3), 0x8a7a4a, s * 8 - 1.8 + k * 0.4, G + 0.6, 6.2);
  },
  slots: [],
  cover: null
};
LAYOUTS.safari_flamingo = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "safari_flamingo", n: 6, f: 4, u0: -4.5, u1: 4.5, size: 0.42, tint: "pink", bank: 3 });
  L.row({
    ...fixed,
    kind: "safari_flamingo",
    n: 6,
    f: 5.8,
    u0: -9.6,
    u1: -6.4,
    base: 0,
    size: 0.36,
    tint: "pink",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "safari_flamingo",
    n: 6,
    f: 5.8,
    u0: 6.4,
    u1: 9.6,
    base: 0,
    size: 0.36,
    tint: "pink",
    bank: 3
  });
  L.row({ kind: "safari_flamingo", n: 5, f: 26, u0: -12, u1: 12, base: 0.4, size: 0.6, tint: "pink", bank: 5 });
  L.row({ kind: "safari_flamingo", n: 4, f: 46, u0: -16, u1: 16, base: 0.4, size: 0.8, tint: "pink", bank: 4 });
  L.pops({
    fixed: true,
    peek: true,
    f: 14,
    at: [
      [-10, 0],
      [10, 0]
    ],
    size: 1.8,
    kinds: [
      ["safari_hyena", 70],
      ["safari_guide", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 6.3,
    at: [
      [-8, 0],
      [8, 0]
    ],
    size: 1.7,
    kinds: [
      ["safari_explorer", 30, { dont: true }],
      ["safari_hyena", 40],
      ["safari_baboon", 30]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 30,
    at: [
      [-26, 0],
      [26, 0]
    ],
    size: 1.8,
    kinds: [
      ["safari_hyena", 80, { pts: 50 }],
      ["safari_baboon", 20, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 3.2,
    at: [
      [-10, 0],
      [10, 0]
    ],
    size: 0.8,
    kinds: [["safari_croc", 100]]
  });
  L.pops({
    fixed: true,
    f: 18,
    at: [
      [-16, 0],
      [16, 0]
    ],
    size: 1.8,
    kinds: [
      ["safari_hyena", 70],
      ["ranger", 30, { dont: true }]
    ]
  });
};
const flamingoWave = (R, add, c) => {
  const flock = (t, size) => {
    const dir = R(0, 1) < 0.5 ? 1 : -1;
    const f = R(18, 40);
    const h = R(3, 9);
    for (let j = 0; j < size; j++)
      add(
        t + j * 0.35,
        "safari_flamingoFly",
        across(R, { v: R(7, 9) * c.S, dir, f: f + j * 0.6, h: h + Math.abs(j - size / 2) * 0.4, amp: 0.2 })
      );
  };
  if (c.x2) {
    for (let k = 0; k < 4; k++) flock(1 + k * 6, 8);
    for (let k = 0; k < 4; k++) add(2 + k * 6, "safari_hyenaRun", run(R, { v: R(10, 13) * c.S, f: R(8, 16) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.2); j++) flock(R(1, 20), 4 + Math.floor(R(0, 4)));
  for (let j = 0; j < 1 + n(1); j++)
    add(
      R(1, 22),
      "safari_hyenaRun",
      R(0, 1) < 0.5 ? run(R, { v: R(10, 13) * c.S, f: R(8, 16) }) : charge(R, { v: R(9, 11) * c.S, f0: R(30, 40) })
    );
  if (k === 2 || k === 5) flyers(["safari_stork", "safari_eagle"], R, add, c, 2 + n(1));
  if (R(0, 1) < 0.3) add(R(2, 18), "safari_explorerRun", cross(R, { u0: -14, u1: 14, f: 9, v: 2.4 }));
};

// ---- Level 8: the baobab plain -----------------------------------------------------------

WORLDS.safari_baobab = {
  sky: {
    top: "#2a3a7a",
    mid: "#c8603a",
    horizon: "#f8a840",
    ground: "#8a5a2a",
    sun: [5, 5, "#ffd060", 20],
    clouds: 5,
    cloud: "rgba(255,150,100,0.4)",
    hills: [{ colour: "#5a3a2a", height: 3, rough: 1 }],
    seed: 731
  },
  fog: 0xd88a50,
  build(P) {
    P.ground(0xa8703a, [{ u: 0, f: 20, r: 12, c: 0x8a6030, sx: 2, sz: 0.8 }]);
    for (const [u, f, s] of [
      [-14, 22, 1.2],
      [12, 28, 1.4],
      [-4, 44, 1.6],
      [24, 50, 1.3],
      [-28, 40, 1.1]
    ])
      baobab(P, u, f, s);
    P.scatter(30, 4, 70, (u, f, R) => Math.abs(u) > 5 && P.acacia(u, f, 0.7 + R() * 0.6), 70, 6);
    P.scatter(40, 2, 40, (u, f) => P.add(CONE(0.15, 0.6, 4), 0xc89a4a, u, G + 0.3, f), 50, 3);
    P.scatter(
      40,
      6,
      80,
      (u, f, R) => P.add(BALL(0.9, 10), 0x7a6a3a, u, G + 0.2, f, 0, R() * 3, 0, 1.6, 0.5, 1.2),
      75,
      8
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.safari_baobab = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "safari_warthog", n: 6, f: 4, u0: -4.5, u1: 4.5, size: 0.38, tint: "brown", bank: 3 });
  for (const [u, f, s] of [
    [-14, 22, 1.2],
    [12, 28, 1.4],
    [-4, 44, 1.6]
  ])
    L.row({
      ...fixed,
      kind: ["vulture", "safari_baboon"],
      n: 2,
      f: f - 2.4 * s,
      u0: u - 1,
      u1: u + 1,
      base: 3 * s,
      size: 0.5,
      tint: ["brown", "brown"],
      bank: 2
    });
  L.row({ kind: "elephant", n: 3, f: 34, u0: -10, u1: 10, base: 0.3, size: 1.4, tint: "steel", bank: 3 });
  L.row({ kind: "giraffe", n: 3, f: 52, u0: -12, u1: 12, base: 0.3, size: 2.0, tint: "gold", bank: 3 });
  L.row({ kind: "rhino", n: 4, f: 16, u0: -8, u1: 8, base: 0.2, size: 0.8, tint: "steel", bank: 4 });
  L.pops({
    fixed: true,
    peek: true,
    f: 23,
    at: [
      [-11, 0],
      [15, 0]
    ],
    size: 1.8,
    kinds: [
      ["safari_leopard", 40],
      ["lion", 40],
      ["ranger", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 29,
    at: [[9, 0]],
    size: 1.8,
    kinds: [
      ["safari_baboon", 60],
      ["safari_guide", 40, { dont: true }]
    ]
  });
  L.row({ kind: "antelope", n: 6, f: 24, u0: -14, u1: 14, base: 0.3, size: 0.8, tint: "white", bank: 3 });
  L.pops({
    fixed: true,
    f: 45.2,
    at: [[-4, 0]],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["safari_leopard", 60, { pts: 50 }],
      ["lion", 40, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 10,
    at: [
      [-8, 0],
      [8, 0]
    ],
    size: 1.8,
    kinds: [
      ["safari_hyena", 50],
      ["safari_baboon", 30],
      ["ranger", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 20,
    at: [
      [-12, 0],
      [-16, 0]
    ],
    size: 1.8,
    kinds: [
      ["safari_baboon", 50],
      ["safari_hyena", 30],
      ["safari_guide", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 26,
    at: [[16, 0]],
    size: 1.8,
    kinds: [
      ["safari_leopard", 60],
      ["lion", 40]
    ]
  });
};
const baobabWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 6; k++) add(1 + k * 4, "safari_giraffeRun", run(R, { v: R(7, 9) * c.S, f: R(20, 44) }));
    for (let k = 0; k < 5; k++) add(2 + k * 4.5, "safari_elephant", run(R, { v: R(5, 7) * c.S, f: R(26, 40) }));
    for (let k = 0; k < 4; k++) add(3 + k * 6, "safari_rhino", charge(R, { v: R(8, 10) * c.S, f0: R(45, 60) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.2); j++) add(R(1, 20), "safari_giraffeRun", run(R, { v: R(7, 9) * c.S, f: R(20, 46) }));
  for (let j = 0; j < 1 + n(1); j++) add(R(1, 20), "safari_elephant", run(R, { v: R(5, 7) * c.S, f: R(24, 40) }));
  for (let j = 0; j < 1 + n(1); j++) add(R(1, 22), "safari_warthog", run(R, { v: R(8, 10) * c.S, f: R(6, 18) }));
  if (k === 1 || k === 4) add(R(2, 16), "safari_rhino", charge(R, { v: R(8, 10) * c.S, f0: R(45, 60) }));
  if (k === 2 || k === 5) flyers(["vulture", "lovebird"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.3) add(R(2, 18), "safari_explorerRun", cross(R, { u0: -16, u1: 16, f: 9, v: 2.4 }));
};

// ---- Level 9: the night camp ----------------------------------------------------------------

WORLDS.safari_night = {
  sky: {
    top: "#04081a",
    mid: "#0a1430",
    horizon: "#1a2440",
    ground: "#141812",
    stars: true,
    planets: [{ az: 30, el: 30, r: 10, colour: "#f4f0e0", light: 0.6, dark: 0.7 }],
    hills: [{ colour: "#141a1a", height: 4, rough: 2, trees: true }],
    seed: 741
  },
  fog: 0x141c24,
  build(P) {
    P.ground(0x2a2a1e, [{ u: 0, f: 10, r: 6, c: 0x3a3424 }]);
    // the camp: the fire and its glow, tents round it, the truck, lanterns
    P.add(CYL(0.9, 1.0, 0.25, 12), 0x3a3a3a, 0, G + 0.12, 10);
    for (let k = 0; k < 5; k++)
      P.add(
        CONE(0.3, 1.0 + (k % 2) * 0.4, 5),
        [0xff8a2a, 0xffc040][k % 2],
        Math.cos(k * 1.3) * 0.3,
        G + 0.6,
        10 + Math.sin(k * 1.3) * 0.3
      );
    P.add(CYL(3, 3, 0.02, 20), 0x5a3a1a, 0, G + 0.01, 10);
    for (const [u, f] of [
      [-7, 12],
      [7, 13],
      [-4, 18],
      [5, 19]
    ])
      tent(P, u, f);
    P.add(BOX(2, 1.6, 4.4), 0x4a5a3a, -12, G + 1.2, 8);
    P.add(BOX(1.9, 0.8, 1.4), 0x4a5a3a, -12, G + 2.3, 6.8);
    for (const [u, f] of [
      [-3, 14],
      [3, 15],
      [-9, 10],
      [9, 11]
    ]) {
      P.add(CYL(0.04, 0.05, 1.8, 4), 0x3a3a3a, u, G + 0.9, f);
      P.add(BALL(0.18, 8), 0xffd27a, u, G + 1.9, f);
    }
    // thorn bush boma round the camp, the bush beyond it, acacias against the stars
    for (let k = 0; k < 30; k++) {
      const a = Math.PI * (0.1 + (k / 29) * 0.8);
      P.add(BALL(0.9, 7), 0x2a3020, Math.cos(a) * 16, G + 0.5, 12 + Math.sin(a) * 12, 0, k, 0, 1.2, 0.7, 1);
    }
    P.scatter(40, 26, 80, (u, f, R) => P.acacia(u, f, 0.8 + R() * 0.6), 80);
    P.scatter(40, 24, 60, (u, f, R) => P.bush(u, f, 0.6 + R() * 0.6, 0x1e2a1a), 70);
    for (let k = 0; k < 12; k++) P.add(BALL(0.06, 6), 0xffe080, -14 + k * 2.6, G + 0.6, 26 + (k % 3) * 2);
  },
  slots: [],
  cover: null
};
LAYOUTS.safari_night = L => {
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: "olla",
    n: 6,
    f: 4,
    u0: -4,
    u1: 4,
    size: 0.34,
    tint: "orange",
    bank: 3,
    rail: true,
    base: 0.6
  });
  L.row({ ...fixed, kind: "lantern", n: 4, f: 14, u0: -9, u1: 9, base: 1.9, size: 0.34, tint: "gold", bank: 4 });
  L.row({ kind: "owl", n: 5, f: 28, u0: -12, u1: 12, base: 2.4, size: 0.5, tint: "white", perch: true });
  L.row({ kind: "safari_hyena", n: 4, f: 46, u0: -14, u1: 14, base: 0.3, size: 0.9, tint: "white", bank: 4 });
  L.row({ ...fixed, kind: "safari_meerkat", n: 4, f: 9, u0: -1.6, u1: 1.6, size: 0.3, tint: "brown", bank: 4 });
  L.pops({
    fixed: true,
    peek: true,
    f: 22.6,
    at: [
      [-12, 0],
      [-4, 0],
      [4, 0],
      [12, 0]
    ],
    size: 1.8,
    busy: 0.6,
    kinds: [
      ["safari_hyena", 45],
      ["safari_leopard", 25, { pts: 50 }],
      ["lion", 20],
      ["ranger", 10, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 12.6,
    at: [
      [-7, 0],
      [7, 0]
    ],
    size: 1.75,
    kinds: [
      ["safari_explorer", 35, { dont: true }],
      ["safari_guide", 35, { dont: true }],
      ["safari_baboon", 30]
    ]
  });
  L.row({ ...fixed, kind: "olla", n: 3, f: 18.6, u0: -5, u1: -3, base: 0.2, size: 0.4, tint: "orange", bank: 3 });
  L.pops({
    fixed: true,
    f: 36,
    at: [
      [-10, 0],
      [10, 0]
    ],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["safari_hyena", 60, { pts: 50 }],
      ["safari_leopard", 40, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 16.6,
    at: [
      [-4, 0],
      [5, 0]
    ],
    size: 1.75,
    kinds: [
      ["safari_baboon", 50],
      ["safari_explorer", 50, { dont: true }]
    ]
  });
};
const nightWave = (R, add, c) => {
  if (c.x2) {
    // the pride comes to the fire
    for (let k = 0; k < 8; k++)
      add(1 + k * 2.8, k % 3 ? "lioness" : "lion", charge(R, { v: R(9, 11) * c.S, f0: R(35, 50) }));
    flyers(["safari_owl", "safari_owl"], R, add, c, 4);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++)
    add(
      R(1, 22),
      "safari_hyenaRun",
      R(0, 1) < 0.5 ? run(R, { v: R(10, 13) * c.S, f: R(18, 34) }) : charge(R, { v: R(9, 11) * c.S, f0: R(32, 44) })
    );
  if (k === 1 || k === 4) add(R(2, 16), "safari_leopard", charge(R, { v: R(10, 12) * c.S, f0: R(30, 40) }));
  if (k === 2 || k === 5) flyers(["safari_owl", "safari_owl"], R, add, c, 2 + n(1));
  if (k === 0 || k === 3)
    for (let j = 0; j < 2; j++) add(R(1, 22), "safari_warthog", run(R, { v: R(8, 10) * c.S, f: R(16, 26) }));
};

// ---- Sound and the levels ------------------------------------------------------------------

Object.assign(AMBIENCE, {
  safari_river(d, sr, R) {
    bed(d, sr, R, { wind: 1.0, water: 0.6, birds: 0.02, crowd: 0.3 });
  },
  safari_desert(d, sr, R) {
    bed(d, sr, R, { wind: 2.6 });
  },
  safari_flamingo(d, sr, R) {
    bed(d, sr, R, { wind: 1.2, water: 0.3, crowd: 0.6, gulls: 0.015 });
  },
  safari_baobab(d, sr, R) {
    bed(d, sr, R, { wind: 1.0, insects: 0.03, birds: 0.02 });
  },
  safari_night(d, sr, R) {
    bed(d, sr, R, { wind: 0.6, crickets: 0.03, fire: 0.5, howl: 0.02 });
  }
});

const level = o => ({ music: "safari", ...o });
export const SAFARI_MORE = {
  kinds,
  levels: [
    level({
      world: "safari_river",
      name: "THE RIVER CROSSING",
      story: "The herds are crossing the Mara. The crocs are waiting",
      amb: "safari_river",
      legend: "CROCODILES 100 · LIONS ON THE FAR BANK · DON'T SHOOT OUR GUIDES",
      wave: riverWave,
      title: (w, x2) => (x2 ? "THE GREAT CROSSING · DOUBLE POINTS" : null)
    }),
    level({
      world: "safari_desert",
      name: "THE RED DUNES",
      story: "Out into the Namib. Mind the meerkats' sentries",
      amb: "safari_desert",
      legend: "OSTRICHES AND ORYX 75 · WARTHOGS AND MEERKATS 100",
      wave: desertWave,
      title: (w, x2) => (x2 ? "THE HERD RUNS · DOUBLE POINTS" : null)
    }),
    level({
      world: "safari_flamingo",
      name: "THE FLAMINGO LAKE",
      story: "A million flamingos on the soda lake. Hyenas on the shore",
      amb: "safari_flamingo",
      legend: "FLAMINGOS IN BANKS · HYENAS 75 · DON'T SHOOT THE EXPLORERS",
      wave: flamingoWave,
      title: (w, x2) => (x2 ? "THE FLOCKS LIFT OFF · DOUBLE POINTS" : null)
    }),
    level({
      world: "safari_baobab",
      name: "THE BAOBAB PLAIN",
      story: "Sunset under the baobabs. The giants come to drink",
      amb: "safari_baobab",
      legend: "GIRAFFES AND ELEPHANTS 50 · RHINO 75 · DON'T SHOOT THE RANGERS",
      wave: baobabWave,
      title: (w, x2) => (x2 ? "THE GIANTS MARCH · DOUBLE POINTS" : null)
    }),
    level({
      world: "safari_night",
      name: "THE NIGHT CAMP",
      story: "Keep the fire burning. Something's out there",
      amb: "safari_night",
      legend: "HYENAS 75 · LEOPARDS 100 · DON'T SHOOT ANYONE BY THE FIRE",
      wave: nightWave,
      title: (w, x2) => (x2 ? "THE PRIDE COMES TO THE FIRE · DOUBLE POINTS" : null)
    })
  ]
};
