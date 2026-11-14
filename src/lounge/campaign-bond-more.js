import * as THREE from "three";
import { GROUND, BOX, CYL, BALL, CONE, TORUS, SLAB, GEO, WORLDS, CARDS, CARD_SIZE, AMBIENCE } from "./shoots-art";
import { LAYOUTS, PERSON, PLATE_SOUND } from "./plates";
import { SHAPES } from "./plates-shapes";
import { gunman, thing, cross, hover, run, pick, flyers } from "./shoot-paths";
import { painter, arms, legs, asGeo, rush, lobbed, skim, sheet, bed } from "./campaign-kit";

// Spy night's five more levels (Jay, 2026-10-31: "add five more levels to
// each set"), between the volcano base and the launch:
//   5 THE TRAIN        the Mastermind's private train crossing a viaduct at
//                      night: men in the windows and on the roofs, cars below
//   6 THE CABLE CAR    cable cars over the bay, his men in the cabins, Jaws
//   7 THE OIL RIG      his rig out at sea: decks, the derrick, cranes, boats
//   8 THE SHARK POOL   the lair under the sea: the great window, the sharks,
//                      divers, his scientists (don't)
//   9 THE ICE PALACE   his hotel of ice on the frozen lake; Oddjob's hat

const G = GROUND;
const SKIN = "#e0b896";

// ---- People and things ---------------------------------------------------------

Object.assign(CARDS, {
  bond_jaws: (c, W) => {
    const p = painter(c, W);
    legs(p, "#2a2a30", "#141414");
    p.poly([24, 44, 76, 44, 78, 112, 22, 112], "#3a3a44");
    p.poly([40, 44, 60, 44, 56, 90, 44, 90], "#e8e4d8");
    arms(p, "#3a3a44", SKIN);
    p.ell(50, 26, 14, 17, SKIN);
    p.poly([38, 30, 62, 30, 60, 38, 40, 38], "#c8ccd4", 1.5);
    for (let k = 0; k < 6; k++) p.line([41 + k * 3.6, 30, 41 + k * 3.6, 38], 0.8, "#6a6e74");
    p.ell(44, 22, 1.8, 1.8, "#1a1a1a", 0);
    p.ell(56, 22, 1.8, 1.8, "#1a1a1a", 0);
    p.poly([36, 12, 40, 6, 60, 6, 64, 12, 62, 16, 38, 16], "#3a2a1a", 1.2);
  },
  bond_oddjob: (c, W) => {
    const p = painter(c, W);
    legs(p, "#2a2a2a", "#141414");
    p.poly([22, 46, 78, 46, 76, 112, 24, 112], "#1a1a1a");
    p.poly([42, 46, 58, 46, 55, 80, 45, 80], "#f0ece4", 1.2);
    p.poly([47, 46, 53, 46, 51, 52, 49, 52], "#1a1a1a", 0);
    arms(p, "#1a1a1a", "#d8a878");
    p.ell(50, 30, 14, 15, "#d8a878");
    p.ell(44, 30, 1.6, 1.4, "#1a1a1a", 0);
    p.ell(56, 30, 1.6, 1.4, "#1a1a1a", 0);
    p.poly([32, 20, 68, 20, 66, 24, 34, 24], "#141414", 1.2);
    p.ell(50, 16, 12, 7, "#141414");
  },
  bond_frogman: (c, W) => {
    const p = painter(c, W);
    legs(p, "#1a1a1e", "#2a2a2e");
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], "#1a1a1e");
    p.poly([34, 50, 46, 50, 46, 86, 34, 86], "#c8a040", 1.2);
    p.poly([54, 50, 66, 50, 66, 86, 54, 86], "#c8a040", 1.2);
    arms(p, "#1a1a1e", "#1a1a1e", { rifle: true, gun: "#3a3e44" });
    p.ell(50, 26, 13, 15, "#1a1a1e");
    p.ell(50, 26, 9, 7, "#6a8a9a", 1.5);
    p.line([58, 32, 66, 44], 2, "#3a3a3a");
  },
  bond_skiguard: (c, W) => {
    const p = painter(c, W);
    legs(p, "#eef0f2", "#2a2a2e");
    p.poly([28, 46, 72, 46, 72, 110, 28, 110], "#f4f6f8");
    p.poly([30, 94, 70, 94, 70, 100, 30, 100], "#2a2a2e", 1.2);
    arms(p, "#f4f6f8", "#2a2a2e", { rifle: true });
    p.ell(50, 28, 12, 14, SKIN);
    p.poly([36, 22, 38, 8, 50, 4, 62, 8, 64, 22], "#f4f6f8");
    p.poly([38, 22, 62, 22, 62, 30, 38, 30], "#2a3a4a", 1.2);
  }
});
const PEOPLE = {
  bond_jaws: [1.05, 2.15],
  bond_oddjob: [1.05, 1.75],
  bond_frogman: [0.9, 1.8],
  bond_skiguard: [0.9, 1.8]
};
Object.assign(CARD_SIZE, PEOPLE);
for (const k of Object.keys(PEOPLE)) PERSON.add(k);

// (a dome: the top half of a circle)
function ring(cx, cy, r, n = 20) {
  return Array.from({ length: n }, (_, k) => [
    cx + r * Math.cos((k / n) * Math.PI),
    cy - r * Math.sin((k / n) * Math.PI) * 0.8
  ]).flat();
}
Object.assign(SHAPES, {
  // a shark, cruising, facing left
  bond_shark: {
    polys: [
      [
        0, 30, 20, 20, 60, 16, 70, 0, 80, 16, 120, 22, 150, 6, 146, 30, 150, 54, 120, 38, 80, 44, 60, 44, 40, 52, 36,
        42, 14, 40
      ]
    ],
    marks: [
      [2, 28, 26, 28, 36],
      [2, 33, 25, 33, 37]
    ],
    dots: [[16, 28, 2.2]]
  },
  // a bowler hat (Oddjob's), and a martini glass
  bond_bowler: {
    polys: [[0, 40, 70, 40, 64, 48, 6, 48], ring(35, 26, 24)]
  },
  bond_martini: {
    polys: [[0, 0, 60, 0, 32, 34, 32, 64, 46, 70, 14, 70, 28, 64, 28, 34]],
    dots: [[34, 10, 4]]
  }
});
PLATE_SOUND.bond_martini = "glass";
PLATE_SOUND.bond_bowler = "clank";

// A cable car cabin on its hanger; Oddjob's hat, spinning.
function cabin(add, c = 0xc0182a) {
  add(BOX(2.2, 1.8, 1.6), c, 0, -1.8, 0);
  add(BOX(2.0, 0.8, 0.05), 0x2a3a4a, 0, -1.6, -0.81);
  add(BOX(2.0, 0.8, 0.05), 0x2a3a4a, 0, -1.6, 0.81);
  add(BOX(2.4, 0.2, 1.8), 0xd8dce4, 0, -0.85, 0);
  add(CYL(0.05, 0.05, 1.6, 5), 0x3a3a3a, 0, -0.1, 0);
  add(BOX(0.8, 0.3, 0.3), 0x3a3a3a, 0, 0.7, 0);
}
GEO.bond_cabin = asGeo(cabin);
GEO.bond_hat = asGeo(add => {
  add(CYL(0.12, 0.13, 0.12, 12), 0x141414, 0, 0.06, 0);
  add(CYL(0.21, 0.21, 0.02, 14), 0x141414, 0, 0, 0);
  add(CYL(0.13, 0.13, 0.025, 12), 0x8a8a8a, 0, 0.02, 0);
});

const mover = (cardKey, h = 1.8, extra = {}) => ({ ...gunman(cardKey, h), ...extra });
const kinds = {
  bond_jawsRun: { ...mover("bond_jaws", 2.15), pts: 200, arrive: "roar", lose: "JAWS!", name: "JAWS · 200" },
  bond_oddjobRun: { ...mover("bond_oddjob", 1.75), pts: 150, name: "ODDJOB · 150" },
  bond_frogRun: mover("bond_frogman"),
  bond_skiRun: mover("bond_skiguard"),
  bond_cabin: {
    ...thing("bond_cabin", 0, 50, 1.2, "shatter", "level", "boom"),
    hy: -1.6,
    boom: 2,
    name: "CABLE CAR · 50"
  },
  bond_hat: { ...thing("bond_hat", 0, 50, 0.25, "shatter", "spin", "clank"), arrive: "thud", lose: "ODDJOB'S HAT!" },
  bond_shark: {
    pts: 75,
    r: 1.0,
    hy: 0.5,
    dies: "fall",
    art: { plate: "bond_shark", tint: 0x8a9aa8, h: 1.2 },
    face: "slide",
    sound: "splat"
  },
  bond_car: {
    pts: 75,
    r: 1.0,
    hy: 0.7,
    dies: "fall",
    art: { plate: "hostage_van", tint: 0x2a2a2e, h: 1.6 },
    face: "slide",
    sound: "boom",
    boom: 2.5
  }
};

// ---- Level 5: the train on the viaduct --------------------------------------------

const TRN = { F: 24, H: 9, CARS: [-16, -6, 4, 14] };
WORLDS.bond_train = {
  sky: {
    top: "#0a1028",
    mid: "#1a2448",
    horizon: "#4a5a7a",
    ground: "#1a2028",
    stars: true,
    planets: [{ az: 30, el: 25, r: 14, colour: "#f4f0e0", light: 0.2, dark: 0.15 }],
    hills: [
      { colour: "#2a3448", height: 16, rough: 6, phase: 1 },
      { colour: "#1e2838", height: 9, rough: 4, trees: true }
    ],
    seed: 401
  },
  fog: 0x2a3448,
  build(P) {
    P.ground(0x22302a, [{ u: 0, f: TRN.F + 6, r: 6, c: 0x2a4a5a, sx: 8, sz: 0.6 }]);
    // the viaduct: arches across the gorge, the line on top
    P.add(BOX(90, 1.0, 3.2), 0x6a6a68, 0, G + TRN.H, TRN.F);
    for (let u = -40; u <= 40; u += 8) {
      P.add(BOX(1.6, TRN.H, 3), 0x6a6a68, u, G + TRN.H / 2, TRN.F);
      P.add(new THREE.TorusGeometry(3.2, 0.5, 4, 12, Math.PI), 0x5a5a58, u + 4, G + TRN.H - 3.4, TRN.F, 0, 0, 0);
    }
    // the train: four sleek cars, black and gold, lit windows
    for (const [k, u] of TRN.CARS.entries()) {
      P.add(BOX(9.4, 2.8, 2.8), 0x141418, u, G + TRN.H + 1.9, TRN.F);
      P.add(BOX(9.6, 0.25, 3.0), 0xc8a040, u, G + TRN.H + 3.35, TRN.F);
      P.add(BOX(9.4, 0.12, 2.82), 0xc8a040, u, G + TRN.H + 1.3, TRN.F);
      for (let j = 0; j < 4; j++)
        P.add(BOX(1.4, 0.9, 0.06), 0xffd88a, u - 3.3 + j * 2.2, G + TRN.H + 2.2, TRN.F - 1.42);
      if (k === 3) {
        P.add(BOX(4, 2.4, 2.8), 0x141418, u + 7, G + TRN.H + 1.7, TRN.F);
        P.add(BALL(0.4, 8), 0xfff0c0, u + 9, G + TRN.H + 1.6, TRN.F);
      }
    }
    // the river below, pines, a road along the gorge
    P.add(SLAB(90, 0.2, 3.5), 0x3a3a38, 0, G + 0.1, 12);
    P.scatter(
      50,
      4,
      80,
      (u, f, R) => Math.abs(f - 12) > 3 && Math.abs(f - TRN.F) > 4 && P.pine(u, f, 0.9 + R() * 0.8, 0x1e3a2a),
      70,
      4
    );
    for (let u = -40; u <= 40; u += 10) {
      P.add(CYL(0.06, 0.08, 4, 5), 0x3a3a3a, u, G + 2, 10);
      P.add(BALL(0.2, 6), 0xffe8a0, u, G + 4, 10);
    }
    P.scatter(40, 30, 80, (u, f, R) => Math.abs(f - TRN.F) > 4 && P.pine(u, f, 0.8 + R() * 0.8, 0x1a3428), 70, 4);
    for (let k = 0; k < 8; k++) P.add(BOX(0.3, 0.3, 2.8), 0x3a3a38, -36 + k * 10, G + TRN.H + 0.65, TRN.F);
  },
  slots: [],
  cover: null
};
LAYOUTS.bond_train = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "bond_martini", n: 6, f: 3.5, u0: -4.5, u1: 4.5, base: 0.9, size: 0.34, tint: "white", bank: 3 });
  L.row({ ...fixed, kind: "lantern", n: 6, f: 9.8, u0: -25, u1: 25, base: 4.4, size: 0.4, tint: "gold", bank: 3 });
  L.row({
    ...fixed,
    kind: "bond_cam",
    n: 4,
    f: TRN.F - 1.5,
    u0: -16,
    u1: 14,
    base: TRN.H + 3.5,
    size: 0.45,
    tint: "steel",
    bank: 4
  });
  L.row({ kind: "bond_martini", n: 5, f: 16, u0: -8, u1: 8, base: 1.4, size: 0.4, tint: "white", bank: 5 });
  L.row({
    ...fixed,
    kind: "spade",
    n: 4,
    f: 50,
    u0: -14,
    u1: 14,
    base: 2.4,
    size: 0.8,
    tint: "white",
    bank: 4,
    rail: true
  });
  for (const u of TRN.CARS)
    L.pops({
      fixed: true,
      f: TRN.F - 1.6,
      at: [-2.2, 2.2].map(x => [u + x, TRN.H + 1.5]),
      size: 1.3,
      busy: 0.6,
      kinds: [
        ["henchman", 60],
        ["bond_guard", 25],
        ["bond_contact", 15, { dont: true }]
      ]
    });
  L.pops({
    fixed: true,
    f: TRN.F,
    at: [
      [-11, TRN.H + 3.4],
      [9, TRN.H + 3.4]
    ],
    size: 1.6,
    period: [5, 8],
    kinds: [
      ["henchman", 70, { pts: 50 }],
      ["bond_jaws", 30, { pts: 200 }]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 13.5,
    at: [
      [-12, 0],
      [12, 0]
    ],
    size: 1.8,
    kinds: [
      ["henchman", 70],
      ["bond_tourist", 30, { dont: true }]
    ]
  });
};
const trainWave = (R, add, c) => {
  const car = t => add(t, "bond_car", skim(R, { v: R(12, 16) * c.S, f: 12, h: 0.2, u0: 40 }));
  const roof = t => {
    const [a, b] = R(0, 1) < 0.5 ? [-20, 18] : [18, -20];
    add(t, "bond_henchRun", { ...cross(R, { u0: a, u1: b, f: TRN.F, h: TRN.H + 3.4, v: R(3.5, 4.5) * c.S }) });
  };
  if (c.x2) {
    for (let k = 0; k < 6; k++) car(1 + k * 4);
    for (let k = 0; k < 5; k++) roof(2 + k * 4);
    add(5, "heli", hover(R, { f: R(30, 36), h: R(14, 18) }));
    add(10, "bond_jawsRun", {
      ...cross(R, { u0: 20, u1: 0, f: TRN.F, h: TRN.H + 3.4, v: 2.4, stop: 6 }),
      charge: true,
      arrive: 20 / 2.4 + 5
    });
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.4); j++) car(R(1, 22));
  for (let j = 0; j < 1 + n(1.3); j++) roof(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++)
    add(
      R(1, 22),
      "bond_henchRun",
      rush(
        R,
        [
          [pick(R, [-12, 12]), 13.5, G],
          [R(-5, 5), R(4, 8), G]
        ],
        R(3, 4) * c.S
      )
    );
  if (k === 2 || k === 5) add(R(2, 12), "heli", hover(R, { f: R(30, 36), h: R(14, 18) }));
  if (k === 1 || k === 4) flyers(["dove", "crow"], R, add, c, 2 + n(1));
};

// ---- Level 6: the cable car ---------------------------------------------------------

const CAB = {
  CABLES: [
    [18, 9],
    [30, 14]
  ]
};
WORLDS.bond_cablecar = {
  sky: {
    top: "#3a7ac0",
    mid: "#8ac0e8",
    horizon: "#e8f0f0",
    ground: "#2a6a8a",
    sun: [20, 40, "#fffbe8", 11],
    clouds: 7,
    hills: [
      { colour: "#3a6a4a", height: 22, rough: 6, phase: 2, trees: true },
      { colour: "#2a5a3a", height: 10, rough: 3, trees: true }
    ],
    seed: 411
  },
  fog: 0xc8dce8,
  build(P) {
    P.ground(0x2a6a8a, [{ u: 0, f: 4, r: 8, c: 0x8a8a7a, sx: 4, sz: 0.8 }]);
    // the station platform under you, the towers, the cables across the bay
    P.add(BOX(30, 1.2, 4), 0x6a6a64, 0, G + 0.6, 2);
    P.add(BOX(30, 0.08, 0.08), 0xd8d8d0, 0, G + 2.2, 4);
    for (let u = -15; u <= 15; u += 1.5) P.add(BOX(0.06, 1.0, 0.06), 0xd8d8d0, u, G + 1.7, 4);
    for (const [f, h] of CAB.CABLES) {
      for (const e of [-0.4, 0.4]) P.add(BOX(140, 0.06, 0.06), 0x2a2a2a, 0, G + h, f + e);
      for (const u of [-34, 34]) {
        P.add(BOX(1.2, h + 1, 1.2), 0x8a8a84, u, G + (h + 1) / 2, f);
        P.add(BOX(4, 0.6, 1.4), 0x8a8a84, u, G + h + 0.7, f);
      }
    }
    // the peaks (one like a sugarloaf), islands, boats in the bay
    for (const [u, f, r, h] of [
      [-10, 66, 12, 30],
      [22, 56, 9, 18],
      [-34, 44, 7, 11]
    ]) {
      P.add(BALL(1, 14), 0x3a5a3a, u, G - 2, f, 0, 0, 0, r, h, r * 0.9);
      P.add(BALL(1, 10), 0x5a6a5a, u + r * 0.2, G + h * 0.5, f - r * 0.5, 0, 0, 0, r * 0.4, h * 0.35, r * 0.3);
    }
    for (const [u, f] of [
      [8, 14],
      [-16, 26],
      [26, 36]
    ]) {
      P.add(BOX(3, 0.8, 1.2), 0xf4efe2, u, G + 0.2, f);
      P.add(BOX(0.08, 3, 0.08), 0x8a8a8a, u, G + 1.8, f);
      P.add(CONE(0.9, 2.6, 3), 0xf4efe2, u + 0.5, G + 1.9, f, 0, 0, 0, 0.1, 1, 1);
    }
    for (let k = 0; k < 10; k++) P.add(BOX(2 + (k % 3), 3 + (k % 4) * 1.5, 2), 0xe8e0d0, -40 + k * 9, G + 1.5, 78);
    P.scatter(30, 50, 90, (u, f, R) => P.palm(u, f, 0.8 + R() * 0.4), 70, 30);
    P.scatter(30, 8, 40, (u, f, R) => P.add(BOX(1.4 + R(), 0.05, 0.3), 0x4a8aaa, u, G + 0.03, f), 60);
  },
  slots: [],
  cover: null
};
LAYOUTS.bond_cablecar = L => {
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: "bond_martini",
    n: 6,
    f: 2.4,
    u0: -4.5,
    u1: 4.5,
    base: 1.2,
    size: 0.34,
    tint: "white",
    bank: 3
  });
  L.row({ ...fixed, kind: "bond_cam", n: 4, f: 5.6, u0: -12, u1: 12, base: 1.2, size: 0.4, tint: "steel", bank: 4 });
  for (const [f, h] of CAB.CABLES)
    for (const u of [-34, 34])
      L.row({ ...fixed, kind: "crest", n: 1, f: f - 0.8, u0: u, u1: u, base: h + 1.0, size: 0.6, tint: "gold" });
  L.row({ kind: "bond_boat", n: 3, f: 22, u0: -8, u1: 8, base: 0.3, size: 0.9, tint: "white", bank: 3 });
  L.row({ kind: "spade", n: 4, f: 46, u0: -14, u1: 14, base: 1.0, size: 0.8, tint: "white", bank: 4 });
  L.pops({
    fixed: true,
    f: 5.8,
    at: [
      [-7, 1.2],
      [7, 1.2],
      [-13, 1.2],
      [13, 1.2]
    ],
    size: 1.75,
    kinds: [
      ["henchman", 50],
      ["bond_guard", 20],
      ["bond_jaws", 10, { pts: 200 }],
      ["bond_tourist", 20, { dont: true }]
    ]
  });
  for (const [f, h] of CAB.CABLES)
    L.pops({
      fixed: true,
      f: f + 0.8,
      at: [
        [-34, h + 1],
        [34, h + 1]
      ],
      size: 1.6,
      period: [5, 8],
      kinds: [["henchman", 100, { pts: 25 }]]
    });
  L.row({ ...fixed, kind: "lantern", n: 4, f: 4.2, u0: -14, u1: -8, base: 1.4, size: 0.36, tint: "gold", bank: 4 });
  L.pops({
    fixed: true,
    f: 14.6,
    at: [
      [8, 0.3],
      [-16, 0.3]
    ],
    size: 1.7,
    kinds: [
      ["bond_frogman", 70],
      ["bond_tourist", 30, { dont: true }]
    ]
  });
};
const cablecarWave = (R, add, c) => {
  const cab = t => {
    const [f, h] = pick(R, CAB.CABLES);
    add(t, "bond_cabin", {
      ...cross(R, { u0: R(0, 1) < 0.5 ? -40 : 40, u1: R(0, 1) < 0.5 ? 40 : -40, f, h, v: R(4, 6) * c.S, bob: 0.03 })
    });
  };
  if (c.x2) {
    for (let k = 0; k < 8; k++) cab(1 + k * 3);
    add(
      4,
      "bond_jawsRun",
      rush(
        R,
        [
          [-13, 5.8, G + 1.2],
          [-3, 4, G + 1.2],
          [-1, 3, G + 1.2]
        ],
        2 * c.S
      )
    );
    for (let k = 0; k < 2; k++) add(6 + k * 8, "heli", hover(R, { f: R(26, 34), h: R(12, 16) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.6); j++) cab(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++) add(R(1, 22), "bond_boat", run(R, { v: R(10, 14) * c.S, f: R(16, 40) }));
  for (let j = 0; j < n(1.2); j++)
    add(
      R(1, 22),
      "bond_henchRun",
      rush(
        R,
        [
          [pick(R, [-13, 13]), 5.8, G + 1.2],
          [R(-4, 4), 3, G + 1.2]
        ],
        R(3, 4) * c.S
      )
    );
  if (k === 3)
    add(
      R(2, 10),
      "bond_jawsRun",
      rush(
        R,
        [
          [13, 5.8, G + 1.2],
          [3, 4, G + 1.2],
          [1, 3, G + 1.2]
        ],
        2 * c.S
      )
    );
  if (k === 1 || k === 4) flyers(["dove", "lovebird"], R, add, c, 2 + n(1.5));
};

// ---- Level 7: the oil rig ----------------------------------------------------------

const RIG = { F: 26, DECKS: [5, 10], W: 26 };
WORLDS.bond_rig = {
  sky: {
    top: "#4a6a98",
    mid: "#98b0c8",
    horizon: "#d8e0e8",
    ground: "#2a4a6a",
    sun: [-30, 20, "#fff0d0", 12],
    clouds: 10,
    cloud: "rgba(230,235,245,0.6)",
    seed: 421
  },
  fog: 0xa8b8c8,
  build(P) {
    P.ground(0x2a4a6a, [{ u: 0, f: 6, r: 8, c: 0x6a6a64, sx: 3, sz: 0.6 }]);
    // you're on the supply barge; the rig: legs, two decks, the derrick, cranes, the helipad
    P.add(BOX(24, 1.4, 6), 0x5a5a54, 0, G + 0.7, 4);
    const f = RIG.F;
    for (const [x, z] of [
      [-10, -5],
      [10, -5],
      [-10, 5],
      [10, 5]
    ])
      P.add(CYL(1.0, 1.2, RIG.DECKS[1] + 2, 10), 0xc8a040, x, G + (RIG.DECKS[1] + 2) / 2 - 2, f + z);
    for (const h of RIG.DECKS) {
      P.add(BOX(RIG.W, 0.6, 14), 0x6a6a64, 0, G + h, f);
      P.add(BOX(RIG.W, 0.08, 0.08), 0xe8d040, 0, G + h + 1.0, f - 7);
      for (let u = -RIG.W / 2; u <= RIG.W / 2; u += 1.5) P.add(BOX(0.05, 1.0, 0.05), 0xe8d040, u, G + h + 0.5, f - 7);
    }
    P.add(BOX(6, 4, 4), 0xe8e4d8, -7, G + RIG.DECKS[1] + 2.3, f + 2);
    for (let k = 0; k < 4; k++) P.add(BOX(0.9, 0.7, 0.06), 0x2a3a4a, -9.4 + k * 1.6, G + RIG.DECKS[1] + 3, f - 0.03);
    // the derrick, a lattice tower
    const du = 6;
    for (const [x, z] of [
      [-1.6, -1.6],
      [1.6, -1.6],
      [-1.6, 1.6],
      [1.6, 1.6]
    ])
      P.add(BOX(0.25, 22, 0.25), 0xc8402a, du + x * 0.6, G + RIG.DECKS[1] + 11, f + z * 0.6, z * 0.06, 0, -x * 0.06);
    for (let h = 2; h < 22; h += 2.5)
      P.add(BOX(3.4 - h * 0.1, 0.12, 0.12), 0xc8402a, du, G + RIG.DECKS[1] + h, f - 1.6 + h * 0.05);
    // a crane's boom, the helipad and its H, a flare stack burning
    P.add(BOX(0.6, 0.6, 16), 0xe8d040, -12, G + RIG.DECKS[1] + 4, f - 8, -0.5, 0.4, 0);
    P.add(CYL(5, 5, 0.3, 20), 0x4a4a48, 10, G + RIG.DECKS[1] + 3, f + 6);
    P.add(BOX(0.4, 0.05, 3), 0xf4efe2, 9, G + RIG.DECKS[1] + 3.2, f + 6);
    P.add(BOX(0.4, 0.05, 3), 0xf4efe2, 11, G + RIG.DECKS[1] + 3.2, f + 6);
    P.add(BOX(2, 0.05, 0.4), 0xf4efe2, 10, G + RIG.DECKS[1] + 3.2, f + 6);
    P.add(CYL(0.4, 0.4, 14, 8), 0x8a8a84, 22, G + 7, f + 10, 0, 0, -0.3);
    P.add(CONE(1.2, 3, 7), 0xff8a2a, 24.4, G + 14, f + 10);
    // the sea's swell, a tanker far off
    P.scatter(60, 8, 90, (u, f2, R) => P.add(BOX(3 + R() * 4, 0.05, 0.4), 0x4a6a8a, u, G + 0.03, f2), 80);
    P.add(BOX(40, 4, 6), 0x5a3a2a, -30, G + 2, 80);
    P.add(BOX(8, 6, 5), 0xe8e4d8, -46, G + 7, 80);
    // pipes, containers, lifeboats, stairs
    for (const h of RIG.DECKS)
      for (let k = 0; k < 4; k++)
        P.add(
          CYL(0.2, 0.2, RIG.W - 2, 8),
          [0x8a8a84, 0xc8a040][k % 2],
          0,
          G + h + 0.5 + k * 0.4,
          RIG.F + 5 - k * 0.6,
          0,
          0,
          Math.PI / 2
        );
    for (const [u, c] of [
      [-4, 0x2a5a8a],
      [0, 0xc84a2a],
      [3, 0x3a7a3a]
    ])
      P.add(BOX(2.6, 2.4, 2.4), c, u, G + RIG.DECKS[0] + 1.5, RIG.F + 3);
    for (const u of [-12.4, 12.4]) {
      P.add(BOX(1, 0.8, 3), 0xff7a1a, u, G + RIG.DECKS[1] - 1.2, RIG.F - 3);
      for (let k = 0; k < 8; k++)
        P.add(BOX(1.2, 0.1, 0.4), 0x8a8a84, u * 0.85, G + 0.6 + k * 0.6, RIG.F - 7.4 + k * 0.5);
    }
    // his submarine surfaced beside the rig, buoys, the swell
    P.add(CYL(2.2, 2.2, 26, 20), 0x2a2e34, -24, G + 0.4, RIG.F + 4, 0, 0.2, Math.PI / 2);
    P.add(BOX(2.4, 3, 6), 0x2a2e34, -24, G + 3, RIG.F + 4);
    P.scatter(36, 6, 70, (u, f, R) => P.add(BALL(0.35, 10), R() < 0.5 ? 0xff7a1a : 0xe8d040, u, G + 0.2, f), 70, 4);
    P.scatter(60, 8, 90, (u, f, R) => P.add(BOX(3 + R() * 4, 0.06, 0.5), 0x5a7a9a, u, G + 0.04, f), 80);
  },
  slots: [],
  cover: null
};
LAYOUTS.bond_rig = L => {
  const fixed = { fixed: true, rail: false };
  const f = RIG.F;
  L.row({
    ...fixed,
    kind: "can",
    n: 6,
    f: 2.4,
    u0: -4.5,
    u1: 4.5,
    base: 1.4,
    size: 0.34,
    tint: ["red", "steel"],
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "bond_cam",
    n: 4,
    f: f - 7.2,
    u0: -9,
    u1: 9,
    base: RIG.DECKS[0] + 1.1,
    size: 0.4,
    tint: "steel",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "can",
    n: 6,
    f: f - 7.2,
    u0: -11,
    u1: 11,
    base: RIG.DECKS[1] + 1.1,
    size: 0.4,
    tint: "red",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "crest",
    n: 1,
    f: f - 2,
    u0: 6,
    u1: 6,
    base: RIG.DECKS[1] + 21,
    size: 0.7,
    tint: "gold",
    pts: 50
  });
  L.row({ kind: "bond_boat", n: 3, f: 14, u0: -9, u1: 9, base: 0.3, size: 0.9, tint: "white", bank: 3 });
  L.row({ kind: "spade", n: 4, f: 48, u0: -14, u1: 14, base: 1.0, size: 0.8, tint: "white", bank: 4 });
  const crew = [
    ["henchman", 50],
    ["bond_guard", 25],
    ["bond_frogman", 10],
    ["bond_lab", 15, { dont: true }]
  ];
  L.pops({
    fixed: true,
    f: f - 6.6,
    at: [-8, -2, 4, 10].map(u => [u, RIG.DECKS[0] + 0.3]),
    size: 1.7,
    busy: 0.6,
    kinds: crew
  });
  L.pops({
    fixed: true,
    f: f - 6.6,
    at: [-10, 0, 10].map(u => [u, RIG.DECKS[1] + 0.3]),
    size: 1.6,
    busy: 0.6,
    kinds: crew
  });
  L.pops({
    fixed: true,
    f: 6.6,
    at: [
      [-8, 1.4],
      [8, 1.4]
    ],
    size: 1.75,
    kinds: [
      ["bond_frogman", 70],
      ["henchman", 30]
    ]
  });
  L.pops({
    fixed: true,
    f: RIG.F + 1.4,
    at: [
      [-4, RIG.DECKS[0] + 2.7],
      [3, RIG.DECKS[0] + 2.7]
    ],
    size: 1.6,
    kinds: [
      ["henchman", 70],
      ["bond_lab", 30, { dont: true }]
    ]
  });
};
const rigWave = (R, add, c) => {
  const boat = t => add(t, R(0, 1) < 0.5 ? "bond_boat" : "bond_boatB", run(R, { v: R(12, 16) * c.S, f: R(10, 18) }));
  const deck = t => {
    const h = pick(R, RIG.DECKS);
    add(t, "bond_henchRun", {
      ...cross(R, { u0: R(0, 1) < 0.5 ? -12 : 12, u1: R(-6, 6), f: RIG.F - 6.4, h: h + 0.3, v: R(3, 4) * c.S, stop: 2 })
    });
  };
  const frog = t =>
    add(
      t,
      "bond_frogRun",
      rush(
        R,
        [
          [R(-6, 6), R(10, 14), G - 1],
          [R(-6, 6), 6.4, G + 1.4]
        ],
        R(2, 2.6) * c.S
      )
    );
  if (c.x2) {
    for (let k = 0; k < 6; k++) boat(1 + k * 4);
    for (let k = 0; k < 6; k++) deck(2 + k * 3.6);
    add(6, "heli", hover(R, { f: R(30, 34), h: R(16, 20) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.3); j++) boat(R(1, 22));
  for (let j = 0; j < 1 + n(1.4); j++) deck(R(1, 22));
  if (k === 2 || k === 5) for (let j = 0; j < 1 + n(1); j++) frog(R(2, 20));
  if (k === 1 || k === 4) flyers(["hostage_gull", "hostage_gull"], R, add, c, 2 + n(2));
  if (k === 3) add(R(2, 12), "heli", hover(R, { f: R(30, 34), h: R(16, 20) }));
};

// ---- Level 8: the shark pool ---------------------------------------------------------

const LAIR = { W: 15, FRONT: -11, BACK: 52, CEIL: 9, GLASS: 22, TANK: [1, 7.5] };
WORLDS.bond_lair = {
  sky: { top: "#04101e", mid: "#082036", horizon: "#0c2a44", ground: "#04101e", seed: 431 },
  fog: 0x0c2032,
  build(P) {
    const R = LAIR;
    const len = R.GLASS + 0.3 - R.FRONT;
    const mid = (R.FRONT + R.GLASS + 0.3) / 2;
    P.add(SLAB(2 * R.W + 0.6, 0.06, len), 0x2a2e36, 0, G - 0.03, mid);
    P.add(SLAB(2 * R.W + 0.6, 0.3, len), 0x1a1e26, 0, G + R.CEIL + 0.15, mid);
    for (const s of [-1, 1]) {
      const x = d => s * (R.W - d);
      P.add(SLAB(0.3, R.CEIL + 0.3, len), 0x3a404a, s * (R.W + 0.15), G + R.CEIL / 2, mid);
      for (let f = -6; f < R.GLASS; f += 5) {
        P.add(BOX(0.4, R.CEIL, 0.6), 0xc8a040, x(0.2), G + R.CEIL / 2, f);
        P.add(BOX(0.06, 1.6, 2.6), 0x2a6a8a, x(0.04), G + 3.2, f + 2.5);
      }
      for (const f of [4, 14]) P.add(BOX(0.12, 2.8, 2.0), 0x0a0c10, x(0.06), G + 1.4, f);
    }
    // the great window: its frame, the water behind, the tank's floor and rocks
    P.add(BOX(2 * R.W + 0.6, 1.0, 0.6), 0xc8a040, 0, G + 0.5, R.GLASS);
    P.add(BOX(2 * R.W + 0.6, R.CEIL - R.TANK[1], 0.6), 0x3a404a, 0, G + R.TANK[1] + (R.CEIL - R.TANK[1]) / 2, R.GLASS);
    for (let u = -R.W; u <= R.W; u += 5) P.add(BOX(0.4, R.TANK[1], 0.5), 0xc8a040, u, G + R.TANK[1] / 2, R.GLASS);
    P.add(SLAB(2 * R.W, 0.1, R.BACK - R.GLASS), 0xc8b890, 0, G + 0.3, (R.GLASS + R.BACK) / 2);
    P.add(BOX(2 * R.W + 0.6, R.CEIL + 2, 0.3), 0x0a3a5a, 0, G + R.CEIL / 2, R.BACK);
    P.scatter(
      30,
      R.GLASS + 1,
      R.BACK - 1,
      (u, f, Rr) =>
        P.add(BALL(0.6 + Rr(), 6), Rr() < 0.5 ? 0x5a6a5a : 0x8a6a5a, u, G + 0.4, f, 0, Rr() * 3, 0, 1.2, 0.7, 1),
      R.W - 1
    );
    P.scatter(
      24,
      R.GLASS + 1,
      R.BACK - 1,
      (u, f, Rr) => P.add(CYL(0.04, 0.06, 1.5 + Rr() * 2, 4), 0x3a8a5a, u, G + 1.2, f, 0, 0, Rr() - 0.5),
      R.W - 1
    );
    // the Mastermind's desk, his chair, the console, white sofas
    P.add(BOX(5, 1.0, 1.6), 0x1a1a1e, 0, G + 0.5, 12);
    P.add(BOX(5.2, 0.08, 1.8), 0xc8a040, 0, G + 1.04, 12);
    P.add(BOX(1.2, 2, 1), 0xc8202a, 0, G + 1, 13.4);
    for (const s of [-1, 1]) {
      P.add(BOX(3.6, 0.6, 1.2), 0xf0ece4, s * 7, G + 0.3, 6);
      P.add(BOX(3.6, 0.8, 0.3), 0xf0ece4, s * 7, G + 0.8, 6.6);
    }
    for (let k = 0; k < 8; k++)
      P.add(
        BOX(0.8, 0.5, 0.06),
        [0x3aa0e8, 0x7fd18a, 0xe8344a][k % 3],
        -6 + k * 1.7,
        G + 1.6,
        R.GLASS - 0.35,
        -0.3,
        0,
        0
      );
    // the tank goes back into the dark: a sunken wreck, a reef, light shafts
    P.add(BOX(10, 3, 3), 0x3a3428, 6, G + 1.5, 42, 0, 0.5, 0.2);
    P.add(CYL(0.25, 0.25, 7, 6), 0x3a3428, 4, G + 4.5, 41, 0.3, 0, 0.4);
    P.scatter(
      40,
      R.GLASS + 4,
      R.BACK - 1,
      (u, f, Rr) =>
        P.add(
          BALL(0.5 + Rr() * 0.8, 6),
          [0xc86a5a, 0xe8a04a, 0x6a8ac8, 0x8ac86a][Math.floor(Rr() * 4)],
          u,
          G + 0.5,
          f,
          0,
          0,
          0,
          1,
          1.4,
          1
        ),
      R.W - 1
    );
    for (const s of [-1, 1])
      for (let f = R.GLASS + 2; f < R.BACK; f += 6)
        P.add(BOX(0.3, R.CEIL, 0.3), 0x0e2a40, s * (R.W - 0.5), G + R.CEIL / 2, f);
    // a shoal of small fish, bubbles rising
    for (let k = 0; k < 60; k++)
      P.add(
        BALL(0.12, 8),
        0xe8c040,
        -8 + (k % 12) * 0.5,
        G + 4 + Math.floor(k / 12) * 0.35,
        34 + (k % 5) * 0.4,
        0,
        0,
        0,
        1.6,
        0.8,
        0.6
      );
    P.scatter(
      40,
      R.GLASS + 2,
      R.BACK - 2,
      (u, f, Rr) => P.add(BALL(0.1 + Rr() * 0.1, 8), 0xa8d8f0, u, G + 1 + Rr() * 6, f),
      R.W - 1
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.bond_lair = L => {
  const R = LAIR;
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: "bond_martini",
    n: 6,
    f: 2.4,
    u0: -4.5,
    u1: 4.5,
    size: 0.34,
    tint: "white",
    bank: 3,
    rail: true,
    base: 0.6
  });
  L.row({
    ...fixed,
    kind: "bond_martini",
    n: 4,
    f: 11.4,
    u0: -2,
    u1: 2,
    base: 1.08,
    size: 0.3,
    tint: "white",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "bond_cam",
    n: 6,
    f: R.GLASS - 0.5,
    u0: -12,
    u1: 12,
    base: R.TANK[1] + 0.2,
    size: 0.4,
    tint: "steel",
    bank: 3
  });
  L.row({ ...fixed, kind: "crest", n: 4, f: 20, u0: -R.W + 0.6, u1: -R.W + 0.6, base: 3.0, size: 0.5, tint: "gold" });
  L.row({
    ...fixed,
    kind: "safari_croc",
    n: 3,
    f: R.BACK - 2,
    u0: -8,
    u1: 8,
    base: 0.4,
    size: 0.9,
    tint: "green",
    bank: 3
  });
  for (const f of [4, 14])
    L.pops({
      fixed: true,
      f,
      at: [
        [-(R.W - 0.7), 0],
        [R.W - 0.7, 0]
      ],
      size: 1.8,
      kinds: [
        ["henchman", 50],
        ["bond_guard", 20],
        ["bond_lab", 20, { dont: true }],
        ["bond_contact", 10, { dont: true }]
      ]
    });
  L.pops({
    fixed: true,
    f: 13.8,
    at: [[0, 0.2]],
    size: 1.9,
    period: [6, 9],
    kinds: [
      ["bond_mm", 40, { pts: 250 }],
      ["bond_oddjob", 30, { pts: 150 }],
      ["henchman", 30]
    ]
  });
  L.pops({
    fixed: true,
    f: 6.9,
    at: [
      [-7, 0],
      [7, 0]
    ],
    size: 1.75,
    kinds: [
      ["henchman", 70],
      ["bond_contact", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: R.GLASS + 2,
    at: [
      [-6, 0.8],
      [6, 0.8]
    ],
    size: 1.8,
    kinds: [["bond_frogman", 100, { pts: 25 }]]
  });
  L.row({ ...fixed, kind: "bond_shark", n: 2, f: 46, u0: -6, u1: 6, base: 3.0, size: 1.0, tint: "steel", bank: 2 });
  L.pops({
    fixed: true,
    f: 9.6,
    at: [
      [-11, 0],
      [11, 0]
    ],
    size: 1.75,
    kinds: [
      ["henchman", 60],
      ["bond_oddjob", 15, { pts: 150 }],
      ["bond_lab", 25, { dont: true }]
    ]
  });
};
const lairWave = (R, add, c) => {
  const D = LAIR;
  const shark = t =>
    add(t, "bond_shark", skim(R, { v: R(4, 7) * c.S, f: R(D.GLASS + 2, D.BACK - 2), h: R(2.6, 6), u0: D.W - 0.8 }));
  const out = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      "bond_henchRun",
      rush(
        R,
        [
          [s * (D.W - 0.7), pick(R, [4, 14]), G],
          [s * R(2, 8), R(3, 7), G]
        ],
        R(3, 4) * c.S
      )
    );
  };
  if (c.x2) {
    for (let k = 0; k < 10; k++) shark(1 + k * 2.4);
    for (let k = 0; k < 5; k++) out(2 + k * 4.5);
    add(
      6,
      "bond_oddjobRun",
      rush(
        R,
        [
          [D.W - 0.7, 14, G],
          [4, 8, G],
          [2, 5, G]
        ],
        2.6 * c.S
      )
    );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.6); j++) shark(R(1, 22));
  for (let j = 0; j < 1 + n(1.2); j++) out(R(1, 22));
  if (k === 3)
    add(
      R(2, 10),
      "bond_oddjobRun",
      rush(
        R,
        [
          [-(D.W - 0.7), 4, G],
          [-4, 5, G],
          [-2, 4, G]
        ],
        2.6 * c.S
      )
    );
  if (k === 1 || k === 4)
    for (let j = 0; j < 1 + n(1); j++)
      add(
        R(2, 22),
        "bond_hat",
        lobbed(R, { u: pick(R, [-(D.W - 1), D.W - 1]), f: 14, h: G + 1.5, vh: R(1, 2), vu: R(-3, 3), vf: -R(8, 10) })
      );
  if (R(0, 1) < 0.3) add(R(2, 18), "bond_labRun", cross(R, { u0: -9, u1: 9, f: R(8, 10), v: 1.8 }));
};

// ---- Level 9: the ice palace ----------------------------------------------------------

const ICE = { W: 15, FRONT: -11, BACK: 34, CEIL: 12, DOOR: 4 };
WORLDS.bond_ice = {
  sky: {
    top: "#1a2a4a",
    mid: "#6a8ab0",
    horizon: "#c8dcec",
    ground: "#d8e4ee",
    sun: [10, 8, "#fff4e0", 12],
    hills: [{ colour: "#a8bcd0", height: 10, rough: 4 }],
    seed: 441
  },
  fog: 0xb8cce0,
  build(P) {
    const R = ICE;
    const len = R.BACK + 0.3 - R.FRONT;
    const mid = (R.FRONT + R.BACK + 0.3) / 2;
    P.add(SLAB(2 * R.W + 0.6, 0.06, len), 0xd8e8f4, 0, G - 0.03, mid);
    P.add(SLAB(2 * R.W + 0.6, 0.3, len), 0xc8dcec, 0, G + R.CEIL + 0.15, mid);
    for (const s of [-1, 1]) {
      const x = d => s * (R.W - d);
      P.add(SLAB(0.3, R.CEIL + 0.3, len), 0xb8d4e8, s * (R.W + 0.15), G + R.CEIL / 2, mid);
      for (let f = -6; f < R.BACK; f += 5) {
        P.add(CYL(0.5, 0.6, R.CEIL, 6), 0xd0e4f4, x(1.5), G + R.CEIL / 2, f);
        P.add(BOX(0.06, 3, 2), 0x8ab0d0, x(0.04), G + 4, f + 2.5);
      }
      for (const f of [6, 18]) P.add(BOX(0.12, 3, 2.2), 0x4a6a8a, x(0.06), G + 1.5, f);
    }
    // the back wall: a great doorway onto the frozen lake
    P.add(
      BOX(R.W - R.DOOR + 0.3, R.CEIL + 0.3, 0.3),
      0xb8d4e8,
      -(R.W + R.DOOR) / 2 - 0.15,
      G + R.CEIL / 2,
      R.BACK + 0.15
    );
    P.add(
      BOX(R.W - R.DOOR + 0.3, R.CEIL + 0.3, 0.3),
      0xb8d4e8,
      (R.W + R.DOOR) / 2 + 0.15,
      G + R.CEIL / 2,
      R.BACK + 0.15
    );
    P.add(BOX(2 * R.DOOR, R.CEIL - 6, 0.3), 0xb8d4e8, 0, G + 6 + (R.CEIL - 6) / 2, R.BACK + 0.15);
    sheet(P, -30, 30, R.BACK + 0.3, 80, G, 0xe0ecf6);
    // the chandelier of icicles, the ice bar, sculptures, the lake's far shore
    P.add(TORUS(3, 0.12, 20), 0xe8f4ff, 0, G + R.CEIL - 2, 14, Math.PI / 2);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      P.add(CONE(0.12, 1.4, 4), 0xf4faff, Math.cos(a) * 3, G + R.CEIL - 2.8, 14 + Math.sin(a) * 3, Math.PI, 0, 0);
    }
    P.add(BOX(10, 1.15, 1.0), 0xc0d8ec, 0, G + 0.575, 24);
    P.add(BOX(10.2, 0.08, 1.2), 0xe8f4ff, 0, G + 1.19, 24);
    for (const [u, f] of [
      [-8, 9],
      [8, 9]
    ]) {
      P.add(BOX(1.2, 1.4, 1.2), 0xd0e4f4, u, G + 0.7, f);
      P.add(BALL(0.8, 8), 0xe8f4ff, u, G + 2.2, f, 0, 0, 0, 0.8, 1.2, 0.8);
    }
    for (let k = 0; k < 8; k++) P.pine(-28 + k * 8, 70 + (k % 2) * 4, 1.2, 0x3a5a4a);
    // ice tables and chairs, swan sculptures, fur rugs, blue lights in the walls
    for (const [u, f] of [
      [-5, 12],
      [5, 12],
      [-5, 18],
      [5, 18]
    ]) {
      P.add(CYL(0.7, 0.7, 0.1, 10), 0xe0eef8, u, G + 0.8, f);
      P.add(CYL(0.25, 0.35, 0.8, 8), 0xc8dcec, u, G + 0.4, f);
      for (let k = 0; k < 3; k++)
        P.add(BOX(0.45, 0.45, 0.45), 0xd8e8f4, u + Math.cos(k * 2.1) * 1.1, G + 0.22, f + Math.sin(k * 2.1) * 1.1);
      P.add(CYL(1.2, 1.2, 0.03, 12), 0xe8e0d0, u, G + 0.02, f);
    }
    for (const u of [-11, 11]) {
      P.add(BALL(0.8, 10), 0xf0f8ff, u, G + 1.2, 28, 0, 0, 0, 1.2, 0.7, 0.8);
      P.add(CYL(0.12, 0.18, 1.2, 6), 0xf0f8ff, u, G + 2.0, 27.4, 0.4, 0, 0);
      P.add(BOX(1.6, 0.8, 1.2), 0xc8dcec, u, G + 0.4, 28);
    }
    for (const s of [-1, 1])
      for (let f = -4; f < R.BACK; f += 5) P.add(BOX(0.05, 0.4, 1.2), 0x6ab0f0, s * (R.W - 0.04), G + 7.5, f);
    P.scatter(
      30,
      40,
      75,
      (u, f, Rr) => P.add(BALL(1, 8), 0xe8f0f8, u, G - 0.2, f, 0, Rr() * 3, 0, 4 + Rr() * 4, 0.8 + Rr(), 2),
      30
    );
    P.scatter(30, R.BACK + 2, 40, (u, f, Rr) => P.add(BALL(0.4 + Rr() * 0.3, 10), 0xf4f8fc, u, G + 0.2, f), 26);
    for (let k = 0; k < 40; k++) {
      const a = k * 0.6;
      P.add(
        CONE(0.1, 0.6 + (k % 4) * 0.3, 6),
        0xf4faff,
        Math.cos(a) * (6 + (k % 3) * 3),
        G + R.CEIL - 0.5,
        4 + ((k * 7) % 28),
        Math.PI,
        0,
        0
      );
    }
  },
  slots: [],
  cover: null
};
LAYOUTS.bond_ice = L => {
  const R = ICE;
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: "bond_martini",
    n: 6,
    f: 2.4,
    u0: -4.5,
    u1: 4.5,
    size: 0.34,
    tint: "white",
    bank: 3,
    rail: true,
    base: 0.6
  });
  L.row({
    ...fixed,
    kind: "bond_martini",
    n: 8,
    f: 23.6,
    u0: -4.5,
    u1: 4.5,
    base: 1.23,
    size: 0.3,
    tint: "white",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "bond_cam",
    n: 4,
    f: 12,
    u0: -R.W + 0.5,
    u1: -R.W + 0.5,
    base: 4.0,
    size: 0.4,
    tint: "steel"
  });
  L.row({
    ...fixed,
    kind: "crest",
    n: 3,
    f: 50,
    u0: -3,
    u1: 3,
    base: 1.5,
    size: 0.6,
    tint: "gold",
    bank: 3,
    rail: true
  });
  L.row({ ...fixed, kind: "diamond", n: 4, f: 15, u0: -2.4, u1: 2.4, base: 6.6, size: 0.4, tint: "blue", bank: 4 });
  for (const f of [6, 18])
    L.pops({
      fixed: true,
      f,
      at: [
        [-(R.W - 0.7), 0],
        [R.W - 0.7, 0]
      ],
      size: 1.8,
      kinds: [
        ["bond_skiguard", 55],
        ["henchman", 20],
        ["bond_oddjob", 8, { pts: 150 }],
        ["bond_contact", 17, { dont: true }]
      ]
    });
  L.pops({
    fixed: true,
    f: 24.6,
    at: [
      [-3, 0],
      [3, 0]
    ],
    size: 1.8,
    kinds: [
      ["bond_skiguard", 60],
      ["bond_tourist", 25, { dont: true }],
      ["bond_mm", 15, { pts: 250 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 9.6,
    at: [
      [-8, 0],
      [8, 0]
    ],
    size: 1.75,
    kinds: [
      ["bond_skiguard", 80],
      ["bond_contact", 20, { dont: true }]
    ]
  });
  L.pops({ fixed: true, f: 52, at: [[0, 0]], size: 1.8, period: [5, 8], kinds: [["bond_skiguard", 100, { pts: 50 }]] });
};
const iceWave = (R, add, c) => {
  const D = ICE;
  const out = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      "bond_skiRun",
      rush(
        R,
        [
          [s * (D.W - 0.7), pick(R, [6, 18]), G],
          [s * R(2, 8), R(3, 7), G]
        ],
        R(3, 4) * c.S
      )
    );
  };
  const lake = t =>
    add(t, R(0, 1) < 0.5 ? "bond_sled" : "bond_car", skim(R, { v: R(14, 20) * c.S, f: R(44, 60), h: 0.1, u0: 30 }));
  if (c.x2) {
    for (let k = 0; k < 7; k++) out(1 + k * 3);
    for (let k = 0; k < 5; k++) lake(2 + k * 4);
    for (let k = 0; k < 3; k++)
      add(
        3 + k * 6,
        "bond_hat",
        lobbed(R, { u: pick(R, [-(D.W - 1), D.W - 1]), f: 18, h: G + 1.5, vh: R(1, 2), vu: R(-3, 3), vf: -R(8, 10) })
      );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) out(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++) lake(R(1, 22));
  if (k === 1 || k === 4)
    add(
      R(2, 22),
      "bond_hat",
      lobbed(R, { u: pick(R, [-(D.W - 1), D.W - 1]), f: 18, h: G + 1.5, vh: R(1, 2), vu: R(-3, 3), vf: -R(8, 10) })
    );
  if (k === 3)
    add(
      R(2, 10),
      "bond_oddjobRun",
      rush(
        R,
        [
          [D.W - 0.7, 18, G],
          [4, 9, G],
          [2, 5, G]
        ],
        2.6 * c.S
      )
    );
};

// ---- Sound and the levels -------------------------------------------------------------

Object.assign(AMBIENCE, {
  bond_train(d, sr, R) {
    bed(d, sr, R, { wind: 1.4, chuff: 0.12, clank: 0.12, hum: [55, 0.03] });
  },
  bond_cablecar(d, sr, R) {
    bed(d, sr, R, { wind: 2.2, gulls: 0.03, hum: [90, 0.015] });
  },
  bond_rig(d, sr, R) {
    bed(d, sr, R, { wind: 2.0, surf: 0.8, gulls: 0.03, hum: [45, 0.04] });
  },
  bond_lair(d, sr, R) {
    bed(d, sr, R, { water: 0.4, hum: [60, 0.04] });
  },
  bond_ice(d, sr, R) {
    bed(d, sr, R, { wind: 2.6, hum: [120, 0.008] });
  }
});

export const BOND_MORE = {
  kinds,
  levels: [
    {
      world: "bond_train",
      name: "THE MIDNIGHT EXPRESS",
      story: "His private train crosses the viaduct tonight",
      music: "bond",
      amb: "bond_train",
      legend: "JAWS 200 · CARS 75 · DON'T SHOOT OUR CONTACT OR THE TOURISTS",
      wave: trainWave,
      title: (w, x2) => (x2 ? "THE TRAIN IS UNDER ATTACK · DOUBLE POINTS" : null)
    },
    {
      world: "bond_cablecar",
      name: "THE CABLE CAR",
      story: "Over the bay to the Mastermind's peak. Jaws is aboard",
      music: "bond",
      amb: "bond_cablecar",
      legend: "CABLE CARS 50 · JAWS 200 · DON'T SHOOT THE TOURISTS",
      wave: cablecarWave,
      title: (w, x2) => (x2 ? "JAWS ON THE PLATFORM · DOUBLE POINTS" : null)
    },
    {
      world: "bond_rig",
      name: "THE OIL RIG",
      story: "He's refuelling his submarine at sea",
      music: "bond",
      amb: "bond_rig",
      legend: "BOATS 75 · FROGMEN COME UP OUT OF THE SEA · DON'T SHOOT THE SCIENTISTS",
      wave: rigWave,
      title: (w, x2) => (x2 ? "THE RIG IS ON ALERT · DOUBLE POINTS" : null)
    },
    {
      world: "bond_lair",
      name: "THE SHARK POOL",
      story: "His lair under the sea. Mind the sharks",
      music: "bond",
      amb: "bond_lair",
      indoor: true,
      legend: "SHARKS 75 · ODDJOB 150 · HIS HAT: SHOOT IT FIRST · DON'T SHOOT THE SCIENTISTS",
      wave: lairWave,
      title: (w, x2) => (x2 ? "FEEDING TIME · DOUBLE POINTS" : null)
    },
    {
      world: "bond_ice",
      name: "THE ICE PALACE",
      story: "His hotel of ice on the frozen lake",
      music: "bond",
      amb: "bond_ice",
      indoor: true,
      legend: "THE MASTERMIND 250 · ODDJOB 150 · DON'T SHOOT OUR CONTACT",
      wave: iceWave,
      title: (w, x2) => (x2 ? "THE ICE IS CRACKING · DOUBLE POINTS" : null)
    }
  ]
};
