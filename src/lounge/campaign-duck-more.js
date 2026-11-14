import { GROUND, BOX, CYL, BALL, CONE, WORLDS, AMBIENCE } from "./shoots-art";
import { LAYOUTS } from "./plates";
import { bird, cross, across, flush, run, pick, flyers } from "./shoot-paths";
import { bed, natureRows as rows } from "./campaign-kit";

// Hunting season's five more levels (Jay, 2026-10-31: "add five more levels
// to each set"), between the salt marsh and the great migration:
//   5 THE FLOODED TIMBER  standing water in the oaks: wood ducks, mallards
//                       dropping in through the branches
//   6 THE PRAIRIE POTHOLES  big sky, little ponds, pintails and teal
//   7 THE BIG LAKE AT DAWN  open water, a layout boat, divers low and fast
//   8 THE FOG BLIND     fog on the marsh: they're on you before you see them
//   9 THE ICE EDGE      late season: open water at the edge of the ice,
//                       goldeneyes and mergansers, the swans (don't)

const G = GROUND;

const kinds = {
  duck_woodMore: bird("woodduck", 10, 0.5, "quack"),
  duck_mallardMore: bird("mallard", 10, 0.5, "quack"),
  duck_tealMore: bird("teal", 25, 0.3, "quack"),
  duck_pintailMore: bird("duck_pintail", 15, 0.45, "quack"),
  duck_scoterMore: bird("duck_scoter", 25, 0.4, "quack"),
  duck_eiderMore: bird("duck_eider", 15, 0.5, "quack"),
  duck_goldenMore: { ...bird("duck_golden", 100, 0.45, "quack"), name: "THE GOLDEN DUCK · 100" },
  duck_canadaMore: bird("duck_canada", 10, 0.6, "honk"),
  duck_swanMore: { ...bird("duck_swan", -25, 0.7, "wrong"), foe: true, name: "A SWAN! DON'T SHOOT!" },
  duck_otter: {
    pts: 100,
    r: 0.3,
    hy: 0.15,
    dies: "fall",
    art: { plate: "duck_turtle", tint: 0x6a4a2a, h: 0.35 },
    face: "slide",
    sound: "splat"
  },
  duck_muskrat: {
    pts: 100,
    r: 0.25,
    hy: 0.15,
    dies: "fall",
    art: { plate: "rabbit", tint: 0x5a3a22, h: 0.35 },
    face: "slide",
    sound: "squeak"
  }
};

// Birds coming in to the water: dropping from high to settle in front of you.
function dropIn(R, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = R(18, 26);
  const f = o.f ?? R(14, 34);
  const v = o.v;
  const t = (2 * u0) / v;
  return {
    dur: t,
    pos: (tau, out) => {
      const k = tau / t;
      return out.set(
        -dir * u0 + dir * v * tau,
        f + 4 * (1 - k),
        GROUND + 0.6 + (o.h ?? 12) * (1 - Math.sin(Math.PI * Math.min(1, k * 1.2) * 0.5))
      );
    }
  };
}
// A flock across in a line.
function flock(R, add, t, kind, size, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const f = o.f ?? R(14, 34);
  const h = o.h ?? R(5, 11);
  for (let j = 0; j < size; j++)
    add(t + j * 0.35, kind, across(R, { v: o.v, dir, f: f + j * 0.8, h: h + Math.abs(j - size / 2) * 0.4, amp: 0.2 }));
}
function reedBed(P, u, f, n = 8) {
  for (let k = 0; k < n; k++) P.reeds(u + (k % 4) * 0.6 - 1, f + Math.floor(k / 4) * 0.5, 1.1);
}
function blind(P, u, f) {
  P.add(BOX(3.2, 1.3, 0.3), 0x6a6a3a, u, G + 0.65, f);
  for (let k = 0; k < 10; k++)
    P.add(CYL(0.04, 0.04, 1.8, 3), 0x8a7a4a, u - 1.5 + k * 0.33, G + 0.9, f - 0.2, k % 2 ? 0.1 : -0.1, 0, 0);
}

// ---- Level 5: the flooded timber ------------------------------------------------------

WORLDS.duck_timber = {
  sky: {
    top: "#4a6a9a",
    mid: "#a8b8c8",
    horizon: "#e0dcd0",
    ground: "#3a4a3a",
    sun: [-20, 20, "#fff0d0", 11],
    clouds: 8,
    hills: [{ colour: "#3a4a2a", height: 8, rough: 3, trees: true }],
    seed: 901
  },
  fog: 0xa8b0a8,
  build(P) {
    P.ground(0x4a5a5a, [
      { u: 0, f: 26, r: 30, c: 0x4a6a7a, sx: 2.4, sz: 1.2 },
      { u: 0, f: 4, r: 8, c: 0x5a5a3a, sx: 3, sz: 0.4 }
    ]);
    // the oaks standing in the water, their reflections dark under them
    P.scatter(
      90,
      6,
      90,
      (u, f, R) => {
        if (Math.abs(u) < 5 && f < 30) return;
        const s = 0.9 + R() * 0.7;
        P.add(CYL(0.25 * s, 0.4 * s, 6 * s, 6), 0x4a3a2a, u, G + 3 * s, f);
        P.add(BALL(2.4 * s, 7), R() < 0.5 ? 0x5a6a2a : 0x7a6a2a, u, G + 6.5 * s, f, 0, 0, 0, 1.2, 0.7, 1.2);
        P.add(CYL(0.6 * s, 0.6 * s, 0.02, 8), 0x2a3a3a, u, G + 0.02, f);
      },
      70
    );
    P.scatter(
      20,
      2,
      20,
      (u, f, R) => Math.abs(u) > 3 && P.add(BALL(0.5, 6), 0x6a6a3a, u, G + 0.1, f, 0, R() * 3, 0, 1.6, 0.3, 1.2),
      30
    );
    blind(P, -15, 3.2);
    blind(P, 15, 3.2);
    for (const [u, f] of [
      [-3, 12],
      [4, 16],
      [-8, 22],
      [2, 26]
    ])
      P.add(BOX(0.4, 0.15, 0.5), 0x2a6a3a, u, G + 0.08, f);
  },
  slots: [],
  cover: null
};
LAYOUTS.duck_timber = L =>
  rows(L, {
    near: "duck",
    near2: "frog",
    nearTint: "green",
    mid: "duck",
    mid2: "heron",
    midTint: "brown",
    far: "goose",
    farTint: "steel",
    perch: "owl",
    peek: [
      ["duck", 60],
      ["heron", 20],
      ["duck_birder", 20, { dont: true }]
    ],
    far2: [["goose", 100, { pts: 50 }]]
  });
const timberWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 4; k++)
      for (let j = 0; j < 6; j++)
        add(
          1 + k * 6 + j * 0.4,
          R(0, 1) < 0.5 ? "duck_woodMore" : "duck_mallardMore",
          dropIn(R, { v: R(7, 9) * c.S, h: R(10, 14) })
        );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 5 + n(3); j++)
    add(
      R(1, 22),
      pick(R, ["duck_woodMore", "duck_mallardMore", "duck_tealMore"]),
      dropIn(R, { v: R(7, 10) * c.S, h: R(9, 14) })
    );
  if (k === 1 || k === 4) flock(R, add, R(2, 12), "duck_mallardMore", 4 + n(2), { v: R(7, 9) * c.S });
  if (k === 2 || k === 5)
    for (let j = 0; j < 2; j++)
      add(R(2, 20), "duck_kingfisher", across(R, { v: R(12, 15) * c.S, h: R(1.5, 3), f: R(8, 18) }));
  for (let j = 0; j < 1 + n(0.8); j++)
    add(R(2, 20), j % 2 ? "duck_otter" : "duck_muskrat", run(R, { v: R(3, 4), f: R(6, 14) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "duck_retriever", run(R, { v: R(6, 8), f: R(8, 12) }));
};

// ---- Level 6: the prairie potholes ------------------------------------------------------

WORLDS.duck_prairie = {
  sky: {
    top: "#2a5aa8",
    mid: "#7aa8e0",
    horizon: "#e8f0f0",
    ground: "#a89a5a",
    sun: [30, 35, "#fffbe8", 10],
    clouds: 14,
    cloud: "rgba(255,255,255,0.75)",
    hills: [{ colour: "#a8a060", height: 2, rough: 0.6 }],
    seed: 911
  },
  fog: 0xd8dcd0,
  build(P) {
    P.ground(0xb8a860, [
      { u: -10, f: 14, r: 6, c: 0x4a7a9a, sx: 1.4, sz: 0.8 },
      { u: 12, f: 22, r: 7, c: 0x4a7a9a, sx: 1.6, sz: 0.7 },
      { u: -4, f: 36, r: 9, c: 0x5a8aa8, sx: 1.8, sz: 0.6 },
      { u: 20, f: 50, r: 10, c: 0x5a8aa8, sx: 2, sz: 0.5 }
    ]);
    for (const [u, f, r] of [
      [-10, 14, 8],
      [12, 22, 9]
    ])
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        reedBed(P, u + Math.cos(a) * r, f + Math.sin(a) * r * 0.6, 2);
      }
    P.scatter(
      70,
      2,
      80,
      (u, f, R) => P.add(CONE(0.15, 0.6 + R() * 0.4, 4), R() < 0.5 ? 0xc8b860 : 0x9aa050, u, G + 0.3, f),
      80
    );
    // a farm far off: a red barn, a windbreak, a grain elevator
    P.add(BOX(6, 4, 8), 0x9a2a1a, -30, G + 2, 70);
    P.add(BOX(6.4, 0.3, 8.4), 0x3a3a3a, -30, G + 4.4, 70, 0.4, 0, 0);
    P.add(BOX(4, 14, 4), 0xc8c0b0, 34, G + 7, 78);
    P.scatter(18, 64, 82, (u, f, R) => P.oak(u, f, 0.8 + R() * 0.4, 0x3a5a2a), 60, 10);
    blind(P, -15, 3.2);
  },
  slots: [],
  cover: null
};
LAYOUTS.duck_prairie = L =>
  rows(L, {
    near: "duck_pumpkin",
    near2: "frog",
    nearTint: "orange",
    mid: "duckfly",
    midTint: "white",
    far: "goose",
    farTint: "steel",
    perch: "crow",
    peek: [
      ["duck", 50],
      ["goose", 30],
      ["duck_birder", 20, { dont: true }]
    ],
    far2: [["goose", 100, { pts: 50 }]]
  });
const prairieWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 5; k++)
      flock(R, add, 1 + k * 5, k % 2 ? "duck_pintailMore" : "duck_tealMore", 6, { v: R(9, 12) * c.S });
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.2); j++)
    flock(R, add, R(1, 18), R(0, 1) < 0.5 ? "duck_pintailMore" : "duck_tealMore", 3 + Math.floor(R(0, 3)), {
      v: R(9, 12) * c.S
    });
  for (let j = 0; j < 2 + n(1.5); j++)
    add(R(1, 22), pick(R, ["duck_tealMore", "duck_pintailMore"]), flush(R, { S: c.S, f: R(12, 24) }));
  if (k === 1 || k === 4) flock(R, add, R(2, 12), "duck_canadaMore", 5, { v: R(5, 6) * c.S, h: R(9, 13) });
  if (k === 2 || k === 5) add(R(2, 20), "duck_fox", run(R, { v: R(9, 11) * c.S, f: R(8, 20) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "duck_farmer", cross(R, { u0: -14, u1: 14, f: R(10, 16), v: 1.5 }));
};

// ---- Level 7: the big lake at dawn ------------------------------------------------------

WORLDS.duck_lake = {
  sky: {
    top: "#2a3a6a",
    mid: "#a87a8a",
    horizon: "#f8c8a0",
    ground: "#4a5a7a",
    sun: [0, 3, "#ffd8a0", 16],
    clouds: 7,
    cloud: "rgba(255,200,180,0.5)",
    hills: [{ colour: "#2a3a3a", height: 3, rough: 1, trees: true }],
    seed: 921
  },
  fog: 0xc8a8a0,
  build(P) {
    P.ground(0x4a6a8a, [{ u: 0, f: 2, r: 9, c: 0x6a6a4a, sx: 3, sz: 0.5 }]);
    // the layout boat, the decoy spread, the swell, the far shore
    P.add(BOX(5, 0.6, 1.8), 0x5a5a3a, -12, G + 0.3, 4);
    P.add(BOX(1.8, 0.4, 0.6), 0x3a3a2a, -12, G + 0.8, 4.4);
    for (let k = 0; k < 30; k++) {
      const u = -12 + ((k * 37) % 24);
      const f = 10 + ((k * 53) % 18);
      P.add(BALL(0.25, 6), k % 3 ? 0x2a2a2a : 0xe8e4d8, u, G + 0.08, f, 0, 0, 0, 1.6, 0.6, 0.8);
      P.add(BALL(0.12, 5), 0x1a1a1a, u - 0.3, G + 0.25, f);
    }
    P.scatter(80, 4, 90, (u, f, R) => P.add(BOX(2 + R() * 3, 0.04, 0.25), 0x6a8aa8, u, G + 0.02, f), 80);
    P.scatter(50, 78, 92, (u, f, R) => P.pine(u, f, 1 + R() * 0.6, 0x1a3a2a), 85);
  },
  slots: [],
  cover: null
};
LAYOUTS.duck_lake = L =>
  rows(L, {
    near: "duck_buoy",
    near2: "duck",
    nearTint: "red",
    mid: "duck",
    midTint: "white",
    far: "duck_gull",
    farTint: "white",
    perch: "duck_gull",
    peek: [
      ["duck", 70],
      ["duck_birder", 30, { dont: true }]
    ],
    far2: [["goose", 100, { pts: 50 }]]
  });
const lakeWave = (R, add, c) => {
  const divers = (t, kind) =>
    flock(R, add, t, kind, 4 + Math.floor(R(0, 3)), { v: R(12, 15) * c.S, h: R(1.5, 3), f: R(14, 36) });
  if (c.x2) {
    for (let k = 0; k < 5; k++) divers(1 + k * 4.5, k % 2 ? "duck_scoterMore" : "duck_eiderMore");
    add(12, "duck_goldenMore", across(R, { v: 14 * c.S, h: 4, f: 20 }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.4); j++) divers(R(1, 18), R(0, 1) < 0.5 ? "duck_scoterMore" : "duck_eiderMore");
  for (let j = 0; j < 1 + n(1); j++)
    add(R(1, 22), "duck_mallardMore", dropIn(R, { v: R(7, 10) * c.S, h: R(8, 12), f: R(12, 26) }));
  if (k === 3) add(R(2, 16), "duck_goldenMore", across(R, { v: 14 * c.S, h: 4, f: 22 }));
  if (k === 1 || k === 4) flyers(["duck_gull", "duck_gull"], R, add, c, 2);
  if (k === 2 || k === 5) add(R(2, 20), "duck_otter", run(R, { v: R(3, 5), f: R(8, 20) }));
};

// ---- Level 8: the fog blind ---------------------------------------------------------------

WORLDS.duck_fog = {
  sky: {
    top: "#b8bcc0",
    mid: "#c8ccd0",
    horizon: "#d8dadc",
    ground: "#9a9c98",
    clouds: 18,
    cloud: "rgba(240,240,240,0.7)",
    seed: 931
  },
  fog: 0xd8dad8,
  build(P) {
    P.ground(0x7a7a5a, [
      { u: 0, f: 24, r: 20, c: 0x6a7a7a, sx: 2.2, sz: 1 },
      { u: -18, f: 10, r: 6, c: 0x6a7a7a }
    ]);
    P.scatter(36, 4, 50, (u, f) => reedBed(P, u, f, 2), 50, 3);
    blind(P, -15, 3.2);
    blind(P, 15, 3.2);
    // fog banks lying on the water, stumps, a dead tree
    P.scatter(
      40,
      12,
      80,
      (u, f, R) => P.add(BALL(1, 8), 0xe0e2e0, u, G + 0.8 + R(), f, 0, 0, 0, 6 + R() * 8, 0.8, 3),
      80
    );
    P.scatter(20, 6, 40, (u, f, R) => P.add(CYL(0.25, 0.3, 1 + R(), 6), 0x4a3a2a, u, G + 0.4, f), 30, 3);
    P.add(CYL(0.2, 0.3, 6, 5), 0x3a3028, -12, G + 3, 26, 0, 0, 0.2);
  },
  slots: [],
  cover: null
};
LAYOUTS.duck_fog = L =>
  rows(L, {
    near: "duck",
    near2: "frog",
    nearTint: "yellow",
    mid: "heron",
    midTint: "white",
    far: "goose",
    farTint: "steel",
    perch: "owl",
    peek: [
      ["duck", 60],
      ["heron", 20],
      ["duck_birder", 20, { dont: true }]
    ],
    far2: [["goose", 100, { pts: 50 }]]
  });
const fogWave = (R, add, c) => {
  // (out of the fog close in: low, near, quick)
  const close = (t, kind) => add(t, kind, across(R, { v: R(10, 13) * c.S, h: R(2, 6), f: R(8, 18), weave: 1.5 }));
  if (c.x2) {
    for (let k = 0; k < 16; k++) close(1 + k * 1.4, pick(R, ["duck_tealMore", "duck_mallardMore", "duck_woodMore"]));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 6 + n(4); j++)
    close(R(1, 24), pick(R, ["duck_tealMore", "duck_tealMore", "duck_mallardMore", "duck_woodMore"]));
  for (let j = 0; j < 1 + n(1); j++)
    add(R(1, 22), pick(R, ["duck_tealMore", "duck_mallardMore"]), flush(R, { S: c.S, f: R(8, 18) }));
  if (k === 1 || k === 4) flock(R, add, R(2, 12), "duck_canadaMore", 4, { v: R(5, 6) * c.S, h: R(6, 9), f: R(16, 24) });
  for (let j = 0; j < 1 + n(0.8); j++)
    add(R(2, 20), "duck_kingfisher", across(R, { v: R(12, 15) * c.S, h: R(1.5, 3), f: R(8, 16) }));
  if (R(0, 1) < 0.3) add(R(2, 18), "duck_retriever", run(R, { v: R(6, 8), f: R(8, 12) }));
};

// ---- Level 9: the ice edge ----------------------------------------------------------------

WORLDS.duck_ice = {
  sky: {
    top: "#5a7aa8",
    mid: "#a8bcd0",
    horizon: "#e8eef4",
    ground: "#d8e4ee",
    sun: [-25, 12, "#fff4e0", 12],
    clouds: 9,
    hills: [{ colour: "#c8d4de", height: 6, rough: 2, trees: true }],
    seed: 941
  },
  fog: 0xd8e0e8,
  build(P) {
    P.ground(0xe0eaf2, [
      { u: 0, f: 26, r: 10, c: 0x3a5a7a, sx: 3, sz: 0.8 },
      { u: -10, f: 42, r: 6, c: 0x3a5a7a, sx: 1.6, sz: 0.6 }
    ]);
    // the ice's broken edge round the open water, snow on the reeds, pines
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2;
      P.add(BOX(1.6 + (k % 3) * 0.6, 0.15, 1.0), 0xf0f6fa, Math.cos(a) * 30, G + 0.08, 26 + Math.sin(a) * 8, 0, a, 0);
    }
    P.scatter(40, 4, 16, (u, f, R) => Math.abs(u) > 4 && P.reeds(u, f, 0.9 + R() * 0.3), 40);
    P.scatter(80, 40, 92, (u, f, R) => P.pine(u, f, 0.9 + R() * 0.7, 0x2a4a3a), 85, 10);
    P.scatter(30, 2, 30, (u, f, R) => P.add(BALL(0.6, 6), 0xf4f8fc, u, G + 0.05, f, 0, R() * 3, 0, 2, 0.3, 1.4), 40, 4);
    blind(P, 15, 3.2);
  },
  slots: [],
  cover: null
};
LAYOUTS.duck_ice = L =>
  rows(L, {
    near: "duck",
    near2: "duck_moose",
    nearTint: "white",
    mid: "duck",
    midTint: "steel",
    far: "goose",
    farTint: "white",
    perch: "owl",
    peek: [
      ["duck", 60],
      ["goose", 20],
      ["duck_birder", 20, { dont: true }]
    ],
    far2: [["duck_moose", 100, { pts: 50 }]]
  });
const iceWave = (R, add, c) => {
  if (c.x2) {
    for (let k = 0; k < 4; k++)
      flock(R, add, 1 + k * 6, k % 2 ? "duck_scoterMore" : "duck_eiderMore", 7, {
        v: R(11, 14) * c.S,
        h: R(2, 5),
        f: R(20, 32)
      });
    add(10, "duck_goldenMore", across(R, { v: 15 * c.S, h: 5, f: 24 }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.4); j++)
    flock(
      R,
      add,
      R(1, 18),
      pick(R, ["duck_scoterMore", "duck_eiderMore", "duck_mallardMore"]),
      3 + Math.floor(R(0, 3)),
      { v: R(10, 13) * c.S, h: R(2, 6), f: R(18, 32) }
    );
  for (let j = 0; j < 1 + n(1); j++)
    add(R(1, 22), "duck_mallardMore", dropIn(R, { v: R(7, 9) * c.S, h: R(8, 12), f: R(20, 30) }));
  if (k === 2 || k === 5) flock(R, add, R(2, 12), "duck_swanMore", 3, { v: R(5, 6), h: R(6, 9), f: R(26, 36) });
  if (k === 1 || k === 4) add(R(2, 20), "duck_fox", run(R, { v: R(9, 11) * c.S, f: R(6, 14) }));
};

// ---- Sound and the levels ------------------------------------------------------------------

Object.assign(AMBIENCE, {
  duck_timber(d, sr, R) {
    bed(d, sr, R, { wind: 1.0, water: 0.3, birds: 0.02 });
  },
  duck_prairie(d, sr, R) {
    bed(d, sr, R, { wind: 2.4, insects: 0.015, birds: 0.02 });
  },
  duck_lake(d, sr, R) {
    bed(d, sr, R, { wind: 1.4, surf: 0.4, gulls: 0.02 });
  },
  duck_fog(d, sr, R) {
    bed(d, sr, R, { wind: 0.5, water: 0.25 });
  },
  duck_ice(d, sr, R) {
    bed(d, sr, R, { wind: 2.6, water: 0.15 });
  }
});

const level = o => ({ music: "duck", ...o });
export const DUCK_MORE = {
  kinds,
  levels: [
    level({
      world: "duck_timber",
      name: "THE FLOODED TIMBER",
      story: "Green timber. They come down through the branches",
      amb: "duck_timber",
      legend: "WOOD DUCKS AND MALLARDS 10 · KINGFISHERS 50 · DON'T SHOOT THE DOG",
      wave: timberWave,
      title: (w, x2) => (x2 ? "THEY'RE COMMITTED · DOUBLE POINTS" : null)
    }),
    level({
      world: "duck_prairie",
      name: "THE PRAIRIE POTHOLES",
      story: "Big sky country. Pintails over the potholes",
      amb: "duck_prairie",
      legend: "TEAL 25 · PINTAILS 15 · FOXES 75 · DON'T SHOOT THE FARMER",
      wave: prairieWave,
      title: (w, x2) => (x2 ? "THE SKY IS FULL · DOUBLE POINTS" : null)
    }),
    level({
      world: "duck_lake",
      name: "THE BIG LAKE AT DAWN",
      story: "Out in the layout boat. The divers come in low",
      amb: "duck_lake",
      legend: "SCOTERS 25 · EIDERS 15 · THE GOLDEN DUCK 100",
      wave: lakeWave,
      title: (w, x2) => (x2 ? "THE DIVERS RAFT UP · DOUBLE POINTS" : null)
    }),
    level({
      world: "duck_fog",
      name: "THE FOG BLIND",
      story: "You'll hear them before you see them",
      amb: "duck_fog",
      legend: "THEY COME OUT OF THE FOG CLOSE · DON'T SHOOT THE DOG",
      wave: fogWave,
      title: (w, x2) => (x2 ? "THE FOG LIFTS · DOUBLE POINTS" : null)
    }),
    level({
      world: "duck_ice",
      name: "THE ICE EDGE",
      story: "Late season. The last open water",
      amb: "duck_ice",
      legend: "DIVERS 15 TO 25 · THE GOLDEN DUCK 100 · DON'T SHOOT THE SWANS",
      wave: iceWave,
      title: (w, x2) => (x2 ? "THE LAST FLIGHT · DOUBLE POINTS" : null)
    })
  ]
};
