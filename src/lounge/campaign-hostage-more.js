import * as THREE from "three";
import { GROUND, BOX, CYL, BALL, CONE, TORUS, SLAB, WORLDS, CARDS, CARD_SIZE, AMBIENCE } from "./shoots-art";
import { LAYOUTS, PERSON, PLATE_SOUND } from "./plates";
import { SHAPES } from "./plates-shapes";
import { gunman, DONT, cross, toss, hover, pick, flyers } from "./shoot-paths";
import { painter, arms, legs, rush, lobbed, skim, bed } from "./campaign-kit";

// Hostage rescue's five more levels (Jay, 2026-10-31: "add five more levels
// to each set"), between the cargo ship and the tower:
//   5 THE BANK         the banking hall: tellers' windows, the open vault
//   6 THE SUBWAY       the station: trains through, pillars, the stairs
//   7 THE MALL         the atrium: two floors, escalators, the fountain
//   8 THE HOTEL        the pool deck below the balconies; a helicopter
//   9 THE EMBASSY      the compound at night: the gate, searchlights, vans

const G = GROUND;
const SKIN = "#e0b896";

Object.assign(CARDS, {
  hostage_teller: (c, W) => {
    const p = painter(c, W);
    legs(p, "#2a2a3a", "#141414");
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], "#f0ece4");
    p.poly([36, 50, 64, 50, 62, 100, 38, 100], "#2a3a6a");
    arms(p, "#f0ece4", SKIN);
    p.poly([19, 56, 29, 52, 22, 20, 14, 22], "#f0ece4");
    p.poly([71, 52, 81, 56, 86, 22, 78, 20], "#f0ece4");
    p.ell(50, 28, 12, 14, SKIN);
    p.ell(45, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(55, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(50, 34, 2.6, 2.2, "#8a2a2a", 0);
    p.poly([37, 26, 38, 12, 50, 8, 62, 12, 63, 26, 58, 18, 42, 18], "#6a3a1a", 1.4);
  },
  hostage_guest: (c, W) => {
    const p = painter(c, W);
    legs(p, SKIN, "#f0ece4");
    p.poly([30, 46, 70, 46, 72, 120, 28, 120], "#e8f0f8");
    for (const y of [56, 70, 84, 98, 112]) p.line([30, y, 70, y], 2, "#6ab0e8");
    p.poly([19, 56, 29, 52, 22, 20, 14, 22], "#e8f0f8");
    p.poly([71, 52, 81, 56, 86, 22, 78, 20], "#e8f0f8");
    p.ell(50, 28, 12, 14, SKIN);
    p.poly([38, 22, 62, 22, 62, 27, 38, 27], "#1a1a1a", 1);
    p.poly([36, 18, 40, 10, 60, 10, 64, 18], "#f0d070", 1.4);
  },
  hostage_diplomat: (c, W) => {
    const p = painter(c, W);
    legs(p, "#1a1a22", "#0e0e10");
    p.poly([28, 46, 72, 46, 72, 110, 28, 110], "#1a1a22");
    p.poly([42, 46, 58, 46, 55, 86, 45, 86], "#f4f0e8", 1.2);
    p.line([30, 52, 70, 92], 3, "#c0182a");
    p.poly([19, 56, 29, 52, 22, 20, 14, 22], "#1a1a22");
    p.poly([71, 52, 81, 56, 86, 22, 78, 20], "#1a1a22");
    p.ell(50, 28, 12, 14, SKIN);
    p.ell(45, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(55, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.poly([38, 20, 40, 12, 50, 10, 60, 12, 62, 20, 56, 16, 44, 16], "#d8d4cc", 1.4);
  },
  hostage_robber: (c, W) => {
    const p = painter(c, W);
    legs(p, "#2a2a2a", "#141414");
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], "#e8e0c8");
    for (const y of [54, 64, 74, 84, 94]) p.line([30, y, 70, y], 3, "#1a1a1a");
    arms(p, "#e8e0c8", "#1a1a1a", { pistol: true });
    p.poly([16, 88, 30, 86, 32, 112, 14, 112], "#c8a060", 1.5);
    p.line([20, 96, 26, 104], 2, "#2a6a2a");
    p.line([26, 96, 20, 104], 2, "#2a6a2a");
    p.ell(50, 28, 12, 14, "#1a1a1a");
    p.poly([38, 22, 62, 22, 62, 30, 38, 30], "#e8e0c8", 1);
    p.ell(44, 26, 2.4, 2, "#1a1a1a", 0);
    p.ell(56, 26, 2.4, 2, "#1a1a1a", 0);
  }
});
const PEOPLE = {
  hostage_teller: [0.9, 1.8],
  hostage_guest: [0.9, 1.8],
  hostage_diplomat: [0.9, 1.8],
  hostage_robber: [0.9, 1.8]
};
Object.assign(CARD_SIZE, PEOPLE);
for (const k of Object.keys(PEOPLE)) PERSON.add(k);

Object.assign(SHAPES, {
  // a bag of money, $ on it
  hostage_bag: {
    polys: [[20, 0, 40, 0, 36, 10, 52, 22, 60, 44, 56, 62, 40, 70, 20, 70, 4, 62, 0, 44, 8, 22, 24, 10]],
    marks: [
      [3, 22, 8, 38, 8],
      [4, 36, 32, 30, 28, 24, 32, 26, 40, 34, 44, 36, 52, 30, 56, 24, 52],
      [3, 30, 24, 30, 60]
    ]
  },
  // a gold bar
  hostage_gold: {
    polys: [[10, 0, 70, 0, 80, 26, 0, 26]],
    marks: [[2, 14, 6, 66, 6]]
  },
  // a subway train, two cars, the gang in the windows, facing left
  hostage_train: {
    polys: [[0, 20, 10, 4, 200, 4, 200, 60, 0, 60]],
    marks: [
      [3, 100, 4, 100, 60],
      [4, 0, 42, 200, 42]
    ],
    dots: [
      [30, 24, 7],
      [60, 24, 7],
      [130, 24, 7],
      [160, 24, 7]
    ]
  }
});
PLATE_SOUND.hostage_gold = "ping";
PLATE_SOUND.hostage_bag = "thud";

const mover = (cardKey, h = 1.8, extra = {}) => ({ ...gunman(cardKey, h), ...extra });
const dont = (cardKey, name) => ({
  ...gunman(cardKey, 1.8),
  pts: -25,
  sound: "wrong",
  ...DONT,
  name,
  arrive: undefined
});
const kinds = {
  hostage_robRun: mover("hostage_robber"),
  hostage_tellerRun: dont("hostage_teller", "THE TELLER! DON'T SHOOT!"),
  hostage_guestRun: dont("hostage_guest", "A GUEST! DON'T SHOOT!"),
  hostage_dipRun: dont("hostage_diplomat", "THE AMBASSADOR! DON'T SHOOT!"),
  hostage_train: {
    pts: 75,
    r: 1.6,
    hy: 1.4,
    dies: "fall",
    art: { plate: "hostage_train", tint: 0xc8ccd4, h: 3.0 },
    face: "slide",
    sound: "clank"
  },
  hostage_bagUp: {
    pts: 25,
    r: 0.25,
    dies: "shatter",
    art: { thing: "chip", c: 0x3a7a3a },
    face: "tumble",
    sound: "thud"
  }
};

// An indoor hall: floor, walls, ceiling (FRONT to BACK, W either side).
function hall(P, R, o) {
  const len = R.BACK + 0.3 - R.FRONT;
  const mid = (R.FRONT + R.BACK + 0.3) / 2;
  P.add(SLAB(2 * R.W + 0.6, 0.06, len), o.floor, 0, G - 0.03, mid);
  for (const s of [-1, 1]) P.add(SLAB(0.3, R.CEIL + 0.3, len), o.wall, s * (R.W + 0.15), G + R.CEIL / 2, mid);
  P.add(SLAB(2 * R.W + 0.6, 0.3, len), o.ceil, 0, G + R.CEIL + 0.15, mid);
}

// ---- Level 5: the bank ---------------------------------------------------------------

const BANK = { W: 14, FRONT: -11, BACK: 34, CEIL: 11, COUNTER: 16, VAULT: [0, 34, 3] };
WORLDS.hostage_bank = {
  sky: { top: "#1a1a1e", mid: "#22222a", horizon: "#2a2a32", ground: "#1a1a1e", seed: 501 },
  fog: 0x6a6458,
  build(P) {
    const B = BANK;
    hall(P, B, { floor: 0xd8d0c0, wall: 0xc8bca8, ceil: 0xb8ac98 });
    for (let u = -13; u <= 13; u += 2)
      P.add(SLAB(0.04, 0.02, B.BACK - B.FRONT), 0x8a7a68, u, G + 0.006, (B.BACK + B.FRONT) / 2);
    for (const s of [-1, 1]) {
      for (let f = -4; f < B.BACK; f += 6) {
        P.add(CYL(0.6, 0.7, B.CEIL, 12), 0xe8e0d0, s * (B.W - 2), G + B.CEIL / 2, f);
        P.add(BOX(1.6, 0.6, 1.6), 0xc8bca8, s * (B.W - 2), G + B.CEIL - 0.3, f);
        P.add(BOX(1.6, 0.4, 1.6), 0xc8bca8, s * (B.W - 2), G + 0.2, f);
      }
      for (const f of [6, 26]) P.add(BOX(0.12, 3, 2.2), 0x2a2018, s * (B.W - 0.06), G + 1.5, f);
    }
    // the tellers' counter across the hall, its brass grilles and windows
    P.add(BOX(22, 1.2, 1.0), 0x6a4a2a, 0, G + 0.6, B.COUNTER);
    P.add(BOX(22.2, 0.08, 1.2), 0x3a2414, 0, G + 1.22, B.COUNTER);
    for (let u = -10; u <= 10; u += 4) {
      P.add(BOX(0.12, 1.6, 0.12), 0xc8a040, u - 1.6, G + 2.0, B.COUNTER);
      P.add(BOX(0.12, 1.6, 0.12), 0xc8a040, u + 1.6, G + 2.0, B.COUNTER);
      P.add(BOX(3.3, 0.12, 0.12), 0xc8a040, u, G + 2.8, B.COUNTER);
      for (let k = -1; k <= 1; k++) P.add(BOX(0.04, 1.4, 0.04), 0xc8a040, u + k * 0.8, G + 2.0, B.COUNTER);
    }
    // the back wall, the vault's great round door swung open, gold inside
    const [vu, vf, vr] = B.VAULT;
    P.add(BOX(2 * B.W + 0.6, B.CEIL + 0.3, 0.3), 0xc8bca8, 0, G + B.CEIL / 2, vf + 0.15);
    P.add(CYL(vr, vr, 0.4, 24), 0x1a1612, vu, G + vr + 0.2, vf - 0.1, Math.PI / 2);
    P.add(TORUS(vr + 0.3, 0.3, 24), 0x8a8a8a, vu, G + vr + 0.2, vf - 0.3);
    P.add(CYL(vr, vr, 0.8, 24), 0x9a9a9a, vu + vr + 1.2, G + vr + 0.2, vf - vr * 0.8, Math.PI / 2, 1.2, 0);
    for (let k = 0; k < 6; k++)
      P.add(
        BOX(0.2, 0.2, 0.5),
        0x5a5a5a,
        vu + vr + 1.2 + Math.cos(k) * 1.6,
        G + vr + 0.2 + Math.sin(k) * 1.6,
        vf - vr * 0.8 - 0.5
      );
    P.add(BOX(5, 2.5, 6), 0x2a2620, vu, G + 1.25, vf + 3);
    // chandeliers, desks with lamps, ropes for the queue
    for (const f of [4, 22]) {
      P.add(TORUS(1.4, 0.08, 16), 0xc8a040, 0, G + B.CEIL - 2, f, Math.PI / 2);
      for (let k = 0; k < 8; k++)
        P.add(BALL(0.12, 6), 0xfff0c0, Math.cos(k * 0.785) * 1.4, G + B.CEIL - 1.85, f + Math.sin(k * 0.785) * 1.4);
      P.add(CYL(0.02, 0.02, 2, 4), 0x2a2a2a, 0, G + B.CEIL - 1, f);
    }
    for (const u of [-7, 7]) {
      P.add(BOX(2.4, 0.9, 1.2), 0x5a3a20, u, G + 0.45, 6);
      P.add(CYL(0.05, 0.08, 0.5, 6), 0xc8a040, u + 0.8, G + 1.15, 6);
      P.add(CONE(0.2, 0.2, 8), 0x2a6a3a, u + 0.8, G + 1.45, 6);
    }
    for (let u = -4; u <= 4; u += 2) P.add(CYL(0.05, 0.08, 1.0, 6), 0xc8a040, u, G + 0.5, 10);
    P.add(BOX(8, 0.06, 0.06), 0x8a1a1a, 0, G + 0.9, 10);
    for (const s of [-1, 1])
      for (let f = -4; f < BANK.BACK; f += 6) P.add(BALL(0.5, 10), 0xc8a040, s * (BANK.W - 2), G + BANK.CEIL - 0.9, f);
    for (const s of [-1, 1])
      for (let f = -1; f < BANK.BACK; f += 6) P.add(BOX(0.06, 2.6, 3), 0xb8ac98, s * (BANK.W - 0.04), G + 5.5, f);
  },
  slots: [],
  cover: null
};
LAYOUTS.hostage_bank = L => {
  const B = BANK;
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: "hostage_bag",
    n: 6,
    f: B.COUNTER - 0.2,
    u0: -9,
    u1: 9,
    base: 1.26,
    size: 0.36,
    tint: "green",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "hostage_case",
    n: 4,
    f: 6.4,
    u0: -7.6,
    u1: 7.6,
    base: 0.95,
    size: 0.32,
    tint: "brown",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "hostage_gold",
    n: 6,
    f: B.VAULT[1] + 2,
    u0: -1.8,
    u1: 1.8,
    base: 2.5,
    size: 0.3,
    tint: "gold",
    bank: 3
  });
  L.row({ kind: "hostage_cone", n: 6, f: 3, u0: -4.5, u1: 4.5, size: 0.34, tint: "orange", bank: 3 });
  L.row({
    ...fixed,
    kind: "hostage_ring",
    n: 4,
    f: 28,
    u0: -6,
    u1: 6,
    base: 1.5,
    size: 0.45,
    tint: "gold",
    bank: 4,
    rail: true
  });
  const gang = [
    ["hostage_robber", 45],
    ["hostage_masked", 25],
    ["hostage_teller", 20, { dont: true }],
    ["hostage", 10, { dont: true }]
  ];
  L.pops({
    fixed: true,
    f: B.COUNTER + 0.6,
    at: [-10, -6, -2, 2, 6, 10].map(u => [u, 0]),
    size: 1.75,
    busy: 0.55,
    kinds: gang
  });
  for (const f of [6, 26])
    L.pops({
      fixed: true,
      f,
      at: [
        [-(B.W - 0.7), 0],
        [B.W - 0.7, 0]
      ],
      size: 1.8,
      kinds: gang
    });
  L.pops({
    fixed: true,
    f: B.VAULT[1] + 1,
    at: [
      [-1, 0],
      [1, 0]
    ],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["hostage_robber", 60, { pts: 50 }],
      ["hostage_leader", 15, { pts: 250 }],
      ["hostage_teller", 25, { dont: true }]
    ]
  });
};
const bankWave = (R, add, c) => {
  const B = BANK;
  const over = t => {
    const u = pick(R, [-10, -6, -2, 2, 6, 10]);
    add(
      t,
      R(0, 1) < 0.7 ? "hostage_robRun" : "hostage_mRun",
      rush(
        R,
        [
          [u, B.COUNTER + 0.6, G],
          [u + R(-1, 1), B.COUNTER - 1.2, G],
          [R(-6, 6), R(4, 9), G]
        ],
        R(2.8, 3.6) * c.S
      )
    );
  };
  const bags = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n,
        "hostage_bagUp",
        toss(R, { u: R(-9, 9), f: B.COUNTER + 0.8, h: G + 1.3, vh: R(7, 9) * Math.min(1.2, c.S), vu: R(-2, 2) })
      );
  };
  if (c.x2) {
    for (let k = 0; k < 8; k++) over(1 + k * 2.8);
    bags(6);
    add(
      6,
      "hostage_leaderRun",
      rush(
        R,
        [
          [0, B.VAULT[1] + 1, G],
          [0, B.COUNTER + 1, G],
          [-3, 8, G]
        ],
        2.4 * c.S
      )
    );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) over(R(1, 22));
  if (k !== 3) bags(3 + n(2));
  if (k === 2 || k === 5)
    add(
      R(2, 20),
      "hostage_nade",
      lobbed(R, { u: R(-6, 6), f: B.COUNTER + 1, h: G + 1.5, vh: R(4, 5), vu: R(-2, 2), vf: -R(4, 6) })
    );
  if (R(0, 1) < 0.35) add(R(2, 18), "hostage_tellerRun", cross(R, { u0: -9, u1: 9, f: B.COUNTER + 2, v: 2.4 }));
};

// ---- Level 6: the subway ---------------------------------------------------------------

const SUB = { W: 16, FRONT: -11, BACK: 46, CEIL: 7, TRACK: [14, 22], PLAT: 22 };
WORLDS.hostage_subway = {
  sky: { top: "#101012", mid: "#141418", horizon: "#18181c", ground: "#101012", seed: 511 },
  fog: 0x2a2a30,
  build(P) {
    const S = SUB;
    hall(P, S, { floor: 0x8a8a84, wall: 0xe8e4d8, ceil: 0x6a6a64 });
    // your platform's edge, the tracks in their trench, the far platform
    P.add(BOX(2 * S.W, 0.2, 0.4), 0xe8d040, 0, G + 0.01, S.TRACK[0] - 0.2);
    P.add(SLAB(2 * S.W, 1.1, S.TRACK[1] - S.TRACK[0]), 0x2a2620, 0, G - 0.55, (S.TRACK[0] + S.TRACK[1]) / 2);
    for (const f of [16, 17.4, 18.6, 20]) P.add(BOX(2 * S.W, 0.1, 0.1), 0x8a8a8a, 0, G - 0.9, f);
    P.add(BOX(2 * S.W, 0.2, 0.4), 0xe8d040, 0, G + 0.01, S.TRACK[1] + 0.2);
    // tiled pillars on both platforms, benches, signs, the stairs up at the back
    for (const f of [8, S.PLAT + 4])
      for (let u = -12; u <= 12; u += 6) {
        P.add(BOX(0.8, S.CEIL, 0.8), 0xf0ece0, u, G + S.CEIL / 2, f);
        P.add(BOX(0.82, 0.3, 0.82), 0x2a6a8a, u, G + 2.2, f);
      }
    for (const u of [-9, 9]) P.add(BOX(2.4, 0.5, 0.6), 0x6a4a2a, u, G + 0.45, 5);
    for (const u of [-12, 0, 12]) {
      P.add(BOX(3.6, 0.7, 0.1), 0x1a3a6a, u, G + 4.2, S.TRACK[1] + 0.5);
      P.add(BOX(3.2, 0.12, 0.12), 0xf4efe2, u, G + 4.2, S.TRACK[1] + 0.45);
    }
    P.add(BOX(2 * S.W + 0.6, S.CEIL + 0.3, 0.3), 0xe8e4d8, 0, G + S.CEIL / 2, S.BACK + 0.15);
    for (let k = 0; k < 10; k++) P.add(BOX(6, 0.3, 0.6), 0x8a8a84, 0, G + k * 0.35, S.BACK - 2 - k * 0.6);
    for (const s of [-1, 1]) {
      P.add(BOX(0.1, 3, 6), 0x141414, s * (S.W - 0.05), G - 0.5, (S.TRACK[0] + S.TRACK[1]) / 2);
      for (let f = 0; f < S.BACK; f += 4)
        P.add(BOX(0.06, 0.6, 3.6), [0x2a6a8a, 0xc8402a][Math.round(f / 4) % 2], s * (S.W - 0.04), G + 2.6, f);
    }
    for (let f = -8; f < S.BACK; f += 4) P.add(BOX(2 * S.W - 2, 0.08, 0.3), 0xf8f8f0, 0, G + S.CEIL - 0.05, f);
    // tiles in bands down both walls, bins, the tunnel mouths' arches, lights
    for (const s of [-1, 1])
      for (let f = -9; f < SUB.BACK; f += 0.9) {
        P.add(BOX(0.04, 0.4, 0.8), Math.round(f / 0.9) % 2 ? 0xd8d4c8 : 0xc8c4b8, s * (SUB.W - 0.02), G + 1.0, f);
        P.add(BOX(0.04, 0.4, 0.8), Math.round(f / 0.9) % 2 ? 0xc8c4b8 : 0xd8d4c8, s * (SUB.W - 0.02), G + 4.2, f);
      }
    for (const s of [-1, 1])
      P.add(
        new THREE.TorusGeometry(3, 0.3, 5, 16, Math.PI),
        0x6a6a64,
        s * (SUB.W - 0.2),
        G - 0.5,
        (SUB.TRACK[0] + SUB.TRACK[1]) / 2,
        0,
        Math.PI / 2,
        0
      );
    for (const [u, f] of [
      [-14, 4],
      [14, 4],
      [-3, 6],
      [3, 30]
    ])
      P.add(CYL(0.35, 0.3, 0.9, 12), 0x3a3a3a, u, G + 0.45, f);
    P.scatter(
      30,
      24,
      SUB.BACK - 4,
      (u, f, Rr) => P.add(BOX(0.6 + Rr(), 0.04, 0.6), 0x6a6a64, u, G + 0.01, f),
      SUB.W - 1
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.hostage_subway = L => {
  const S = SUB;
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "hostage_cone", n: 6, f: 3, u0: -4.5, u1: 4.5, size: 0.34, tint: "orange", bank: 3 });
  L.row({
    ...fixed,
    kind: "hostage_case",
    n: 4,
    f: 5.3,
    u0: -9.6,
    u1: 9.6,
    base: 0.7,
    size: 0.32,
    tint: "brown",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "hostage_ring",
    n: 6,
    f: S.TRACK[1] + 0.4,
    u0: -13,
    u1: 13,
    base: 4.6,
    size: 0.4,
    tint: "gold",
    bank: 3
  });
  L.row({ ...fixed, kind: "hostage_bag", n: 4, f: 34, u0: -6, u1: 6, base: 0.2, size: 0.45, tint: "green", bank: 4 });
  L.row({
    ...fixed,
    kind: "hostage_cone",
    n: 4,
    f: S.BACK - 1,
    u0: -8,
    u1: 8,
    base: 0.1,
    size: 0.5,
    tint: "orange",
    bank: 4
  });
  const gang = [
    ["hostage_hood", 40],
    ["hostage_masked", 30],
    ["hostage", 20, { dont: true }],
    ["hostage_crew", 10, { dont: true }]
  ];
  L.pops({
    fixed: true,
    peek: true,
    f: 8.5,
    at: [
      [-6, 0],
      [6, 0]
    ],
    size: 1.8,
    kinds: gang
  });
  L.pops({
    fixed: true,
    peek: true,
    f: S.PLAT + 4.5,
    at: [
      [-6, 0],
      [6, 0],
      [-12, 0],
      [12, 0]
    ],
    size: 1.8,
    busy: 0.6,
    kinds: gang
  });
  L.pops({
    fixed: true,
    f: S.BACK - 4,
    at: [
      [-1.5, 1.2],
      [1.5, 1.2]
    ],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["hostage_hood", 70, { pts: 50 }],
      ["hostage_leader", 10, { pts: 250 }],
      ["hostage", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 5.6,
    at: [
      [-9, 0],
      [9, 0]
    ],
    size: 1.75,
    kinds: [
      ["hostage_hood", 60],
      ["hostage", 40, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 14.6,
    at: [
      [-14, 0],
      [14, 0]
    ],
    size: 1.75,
    kinds: [
      ["hostage_masked", 70],
      ["hostage_crew", 30, { dont: true }]
    ]
  });
};
const subwayWave = (R, add, c) => {
  const S = SUB;
  const train = t =>
    add(t, "hostage_train", skim(R, { v: R(10, 14) * c.S, f: (S.TRACK[0] + S.TRACK[1]) / 2, h: 0.1, u0: S.W + 4 }));
  const down = t =>
    add(
      t,
      R(0, 1) < 0.5 ? "hostage_hRun" : "hostage_mRun",
      rush(
        R,
        [
          [R(-2, 2), S.BACK - 4, G + 2],
          [R(-6, 6), S.PLAT + 2, G],
          [R(-10, 10), S.PLAT + 1, G]
        ],
        R(3, 4) * c.S
      )
    );
  if (c.x2) {
    for (let k = 0; k < 6; k++) train(1 + k * 4);
    for (let k = 0; k < 7; k++) down(2 + k * 3);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1); j++) train(R(1, 20));
  for (let j = 0; j < 2 + n(1.4); j++) down(R(1, 22));
  if (k === 2 || k === 5)
    add(
      R(2, 20),
      "hostage_nade",
      lobbed(R, { u: R(-8, 8), f: S.PLAT + 2, h: G + 1.5, vh: R(4, 5), vu: R(-2, 2), vf: -R(5, 7) })
    );
  if (R(0, 1) < 0.35) add(R(2, 18), "hostage_civRun", cross(R, { u0: -14, u1: 14, f: S.PLAT + 2.5, v: 2.4 }));
};

// ---- Level 7: the mall -----------------------------------------------------------------

const MALL = { W: 16, FRONT: -11, BACK: 44, CEIL: 12, UP: 5, GAL: 3.5, FOUNT: [0, 20] };
const SHOPS = [0xc0182a, 0x2f6a8a, 0xe8b030, 0x3a8a4a, 0x8a3a8a, 0xe86a1a];
WORLDS.hostage_mall = {
  sky: { top: "#a8c8e8", mid: "#c8dcf0", horizon: "#e8f0f8", ground: "#d8d8d0", seed: 521 },
  fog: 0xc8c8c0,
  build(P) {
    const M = MALL;
    const len = M.BACK + 0.3 - M.FRONT;
    const mid = (M.FRONT + M.BACK + 0.3) / 2;
    P.add(SLAB(2 * M.W + 0.6, 0.06, len), 0xe8e4dc, 0, G - 0.03, mid);
    for (const s of [-1, 1]) {
      P.add(SLAB(0.3, M.CEIL + 0.3, len), 0xd8d4cc, s * (M.W + 0.15), G + M.CEIL / 2, mid);
      // the upper gallery, its glass rail, the shopfronts on both floors
      P.add(SLAB(M.GAL, 0.3, len), 0xe0dcd4, s * (M.W - M.GAL / 2), G + M.UP, mid);
      P.add(SLAB(0.06, 1.0, len), 0xb8d8e8, s * (M.W - M.GAL), G + M.UP + 0.65, mid);
      P.add(SLAB(0.08, 0.08, len), 0xc8ccd4, s * (M.W - M.GAL), G + M.UP + 1.15, mid);
      for (let f = -6; f < M.BACK; f += 6)
        for (const h of [0, M.UP]) {
          const c = SHOPS[(Math.round(f / 6) + (h ? 2 : 0) + (s > 0 ? 1 : 0) + 12) % SHOPS.length];
          P.add(BOX(0.1, 3.4, 5.4), 0xa8c8d8, s * (M.W - 0.06), G + h + 1.7, f);
          P.add(BOX(0.12, 0.7, 5.6), c, s * (M.W - 0.08), G + h + 3.75, f);
          P.add(BOX(0.4, 1.2, 0.6), 0xf0ece4, s * (M.W - 0.6), G + h + 0.6, f + 1.5);
        }
      for (let f = -6; f < M.BACK; f += 6) P.add(BOX(0.4, M.UP, 0.4), 0xc8c4bc, s * (M.W - M.GAL), G + M.UP / 2, f + 3);
    }
    // the glass roof, the escalators, the fountain and its palms
    for (let f = -8; f < M.BACK; f += 4) P.add(BOX(2 * M.W, 0.1, 0.2), 0x8a8a84, 0, G + M.CEIL, f);
    P.add(SLAB(2 * M.W - 2 * M.GAL, 0.05, len), 0xd8e8f4, 0, G + M.CEIL + 0.1, mid);
    for (const s of [-1, 1]) {
      P.add(BOX(1.4, 0.2, 9), 0x8a8a84, s * 7, G + M.UP / 2, 34, Math.atan2(M.UP, 9), 0, 0);
      P.add(BOX(0.08, 1.0, 9.2), 0x2a2a2a, s * 7 - 0.7, G + M.UP / 2 + 0.6, 34, Math.atan2(M.UP, 9), 0, 0);
      P.add(BOX(0.08, 1.0, 9.2), 0x2a2a2a, s * 7 + 0.7, G + M.UP / 2 + 0.6, 34, Math.atan2(M.UP, 9), 0, 0);
    }
    const [fu, ff] = MALL.FOUNT;
    P.add(CYL(3.2, 3.4, 0.6, 24), 0xc8c4bc, fu, G + 0.3, ff);
    P.add(CYL(2.9, 2.9, 0.1, 24), 0x6ab0d8, fu, G + 0.55, ff);
    P.add(CYL(0.3, 0.5, 2, 10), 0xc8c4bc, fu, G + 1.3, ff);
    P.add(CYL(1.2, 0.6, 0.3, 14), 0xc8c4bc, fu, G + 2.3, ff);
    for (const [u, f] of [
      [-5, 16],
      [5, 16],
      [-5, 24],
      [5, 24]
    ]) {
      P.add(CYL(0.6, 0.5, 0.8, 10), 0x8a6a4a, u, G + 0.4, f);
      P.palm(u, f, 0.5);
    }
    P.add(BOX(2 * M.W + 0.6, M.CEIL + 0.3, 0.3), 0xd8d4cc, 0, G + M.CEIL / 2, M.BACK + 0.15);
    for (const s of [-1, 1])
      for (let f = -3; f < MALL.BACK; f += 6) {
        P.add(BALL(0.6, 10), 0x3a7a3a, s * (MALL.W - MALL.GAL - 1), G + 0.9, f);
        P.add(CYL(0.45, 0.4, 0.6, 10), 0x8a6a4a, s * (MALL.W - MALL.GAL - 1), G + 0.3, f);
      }
  },
  slots: [],
  cover: null
};
LAYOUTS.hostage_mall = L => {
  const M = MALL;
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "hostage_cone", n: 6, f: 3, u0: -4.5, u1: 4.5, size: 0.34, tint: "orange", bank: 3 });
  L.row({
    ...fixed,
    kind: "hostage_ring",
    n: 4,
    f: MALL.FOUNT[1] - 3.3,
    u0: -2.4,
    u1: 2.4,
    base: 0.6,
    size: 0.36,
    tint: "gold",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "hostage_case",
    n: 6,
    f: 9,
    u0: -(M.W - 0.6),
    u1: -(M.W - 0.6),
    base: 1.25,
    size: 0.3,
    tint: "brown",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "hostage_bag",
    n: 6,
    f: 21,
    u0: -(M.W - M.GAL),
    u1: -(M.W - M.GAL),
    base: M.UP + 1.2,
    size: 0.34,
    tint: "green",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "hostage_ring",
    n: 4,
    f: M.BACK - 0.4,
    u0: -6,
    u1: 6,
    base: 2.5,
    size: 0.6,
    tint: "gold",
    bank: 4
  });
  const gang = [
    ["hostage_masked", 40],
    ["hostage_robber", 30],
    ["hostage", 20, { dont: true }],
    ["hostage_guest", 10, { dont: true }]
  ];
  for (const f of [3, 15, 27])
    L.pops({
      fixed: true,
      f: f + 1.2,
      at: [
        [-(M.W - 0.8), 0],
        [M.W - 0.8, 0],
        [-(M.W - 1.2), M.UP + 0.15],
        [M.W - 1.2, M.UP + 0.15]
      ],
      size: 1.75,
      busy: 0.6,
      kinds: gang
    });
  L.pops({
    fixed: true,
    f: MALL.FOUNT[1] + 3.6,
    at: [
      [-2, 0.6],
      [2, 0.6]
    ],
    size: 1.8,
    kinds: gang
  });
};
// Along an upper gallery from f a to f b.
function galleryWalk(R, s, a, b, c) {
  const v = R(3, 4) * c.S;
  const len = Math.abs(b - a);
  return {
    dur: len / v,
    pos: (tau, out) =>
      out.set(
        s * (MALL.W - 1.6),
        a + Math.sign(b - a) * Math.min(len, v * tau),
        G + MALL.UP + 0.15 + 0.05 * Math.abs(Math.sin(tau * 8))
      )
  };
}

const mallWave = (R, add, c) => {
  const M = MALL;
  const gallery = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    const [a, b] = R(0, 1) < 0.5 ? [-6, 40] : [40, -6];
    add(t, "hostage_mRun", galleryWalk(R, s, a, b, c));
  };
  const shop = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      R(0, 1) < 0.6 ? "hostage_robRun" : "hostage_mRun",
      rush(
        R,
        [
          [s * (M.W - 0.8), pick(R, [4.2, 16.2, 28.2]), G],
          [s * R(3, 8), R(4, 9), G]
        ],
        R(3, 4) * c.S
      )
    );
  };
  if (c.x2) {
    for (let k = 0; k < 6; k++) shop(1 + k * 3.6);
    for (let k = 0; k < 5; k++) gallery(2 + k * 4);
    add(
      5,
      "hostage_leaderRun",
      rush(
        R,
        [
          [7, 38, G + M.UP],
          [7, 29, G],
          [2, 8, G]
        ],
        2.6 * c.S
      )
    );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) shop(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++) gallery(R(1, 20));
  if (k === 2 || k === 5)
    add(
      R(2, 20),
      "hostage_nade",
      lobbed(R, {
        u: pick(R, [-1, 1]) * (M.W - M.GAL),
        f: R(8, 24),
        h: G + M.UP + 1.2,
        vh: R(2, 4),
        vu: R(-3, 3),
        vf: -R(2, 4)
      })
    );
  if (R(0, 1) < 0.35) add(R(2, 18), "hostage_civRun", cross(R, { u0: -10, u1: 10, f: R(8, 12), v: 2.6 }));
};
// ---- Level 8: the hotel --------------------------------------------------------------

const HOT = { F: 30, FLOORS: 7, FH: 3.2, BAYS: [-12, -7, -2, 3, 8, 13], POOL: [0, 14] };
WORLDS.hostage_hotel = {
  sky: {
    top: "#2a6ab8",
    mid: "#8ab8e8",
    horizon: "#f0e8d8",
    ground: "#c8b898",
    sun: [-40, 50, "#fffbe8", 11],
    clouds: 5,
    seed: 531
  },
  fog: 0xd8e4ec,
  signs: [["GRAND HOTEL", 0, G + HOT.FLOORS * HOT.FH + 2.2, HOT.F - 1.2, 12, 1.4, "#1a3a6a", "#f2e2b8"]],
  build(P) {
    P.ground(0xe8dcc0, [{ u: HOT.POOL[0], f: HOT.POOL[1], r: 5, c: 0x4ab0d8, sx: 2.2, sz: 1 }]);
    // the hotel: a tall white block, its balconies floor by floor
    const H = HOT.FLOORS * HOT.FH;
    P.add(BOX(32, H, 8), 0xf0ece4, 0, G + H / 2, HOT.F + 4);
    P.add(BOX(33, 1.2, 9), 0xd8d0c0, 0, G + H + 0.6, HOT.F + 4);
    for (let fl = 1; fl < HOT.FLOORS; fl++) {
      const h = fl * HOT.FH;
      for (const u of HOT.BAYS) {
        P.add(BOX(3.6, 0.2, 1.4), 0xe0d8c8, u, G + h, HOT.F - 0.7);
        P.add(BOX(3.6, 0.9, 0.06), 0xb8d8e8, u, G + h + 0.55, HOT.F - 1.38);
        P.add(BOX(1.6, 2.2, 0.06), 0x3a5a7a, u, G + h + 1.2, HOT.F - 0.02);
      }
    }
    // the lobby's glass front, the pool's edge, loungers and umbrellas, palms
    P.add(BOX(20, 2.8, 0.1), 0x8ab0c8, 0, G + 1.4, HOT.F - 0.05);
    P.add(TORUS(5.2, 0.25, 24), 0xf0ece4, HOT.POOL[0], G + 0.1, HOT.POOL[1], Math.PI / 2, 0, 0, 2.2, 1, 1);
    for (const u of [-11, -7, 7, 11]) {
      P.add(BOX(0.8, 0.3, 2), 0xf0ece4, u, G + 0.3, 20);
      P.add(CYL(0.04, 0.04, 2.2, 4), 0xc8c8c8, u + 1, G + 1.1, 20);
      P.add(CONE(1.3, 0.6, 8), [0xe8344a, 0xf2c230, 0x2f6fe8, 0x3ab54a][Math.abs(u) % 4], u + 1, G + 2.3, 20);
    }
    for (const [u, f] of [
      [-16, 12],
      [16, 12],
      [-18, 24],
      [18, 24],
      [-22, 8],
      [22, 8]
    ])
      P.palm(u, f, 1.1);
    P.add(BOX(30, 1.0, 0.4), 0xf0ece4, 0, G + 0.5, 5);
    P.scatter(20, 4, 28, (u, f, R) => Math.abs(u) > 14 && P.bush(u, f, 0.6 + R() * 0.6, 0x3a7a3a), 30);
    // the windows of every room, flower boxes on the balconies
    for (let fl = 1; fl < HOT.FLOORS; fl++)
      for (const u of HOT.BAYS) {
        P.add(BOX(0.8, 1.0, 0.06), 0x5a7a9a, u + 1.4, G + fl * HOT.FH + 1.4, HOT.F - 0.03);
        P.add(
          BALL(0.25, 8),
          [0xe8344a, 0xf2c230, 0xe86ad8][(fl + Math.abs(u)) % 3],
          u - 1.4,
          G + fl * HOT.FH + 1.1,
          HOT.F - 1.3
        );
      }
    P.scatter(24, 3, 26, (u, f, R) => Math.abs(u) > 13 && P.palm(u, f, 0.8 + R() * 0.3), 30);
  },
  slots: [],
  cover: null
};
LAYOUTS.hostage_hotel = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ ...fixed, kind: "glass", n: 6, f: 4.8, u0: -6, u1: 6, base: 1.0, size: 0.3, tint: "white", bank: 3 });
  L.row({
    ...fixed,
    kind: "hostage_ring",
    n: 4,
    f: 19.8,
    u0: -11,
    u1: 11,
    base: 0.5,
    size: 0.4,
    tint: "gold",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "hostage_case",
    n: 6,
    f: HOT.F - 1.45,
    u0: -12,
    u1: 13,
    base: HOT.FH + 0.95,
    size: 0.34,
    tint: "brown",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "hostage_bag",
    n: 4,
    f: HOT.F - 1.45,
    u0: -7,
    u1: 8,
    base: 4 * HOT.FH + 0.95,
    size: 0.45,
    tint: "green",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "hostage_cone",
    n: 4,
    f: 46,
    u0: -10,
    u1: 10,
    base: 0.2,
    size: 0.6,
    tint: "orange",
    bank: 4
  });
  const gang = [
    ["hostage_masked", 45],
    ["hostage_hood", 25],
    ["hostage_guest", 20, { dont: true }],
    ["hostage", 10, { dont: true }]
  ];
  for (let fl = 1; fl < HOT.FLOORS; fl++)
    L.pops({
      fixed: true,
      f: HOT.F - 0.5,
      at: HOT.BAYS.filter((_, k) => (k + fl) % 2 === 0).map(u => [u, fl * HOT.FH + 0.1]),
      size: 1.5,
      busy: 0.4,
      kinds: gang
    });
  L.pops({
    fixed: true,
    f: HOT.F - 0.3,
    at: [
      [-5, 0],
      [5, 0]
    ],
    size: 1.8,
    kinds: gang
  });
  L.pops({
    fixed: true,
    f: 5.4,
    at: [
      [-12, 0],
      [12, 0]
    ],
    size: 1.75,
    kinds: gang
  });
};
const hotelWave = (R, add, c) => {
  const out = t =>
    add(
      t,
      R(0, 1) < 0.6 ? "hostage_mRun" : "hostage_hRun",
      rush(
        R,
        [
          [pick(R, [-5, 5]), HOT.F - 0.3, G],
          [R(-8, 8), R(18, 22), G],
          [R(-6, 6), R(6, 9), G]
        ],
        R(3, 4) * c.S
      )
    );
  if (c.x2) {
    for (let k = 0; k < 8; k++) out(1 + k * 2.8);
    add(3, "heli", hover(R, { f: HOT.F + 4, h: HOT.FLOORS * HOT.FH + 6 }));
    add(14, "heli", hover(R, { f: R(20, 26), h: R(12, 16) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) out(R(1, 22));
  if (k === 1 || k === 4) add(R(2, 12), "heli", hover(R, { f: HOT.F + 4, h: HOT.FLOORS * HOT.FH + 6 }));
  if (k === 2 || k === 5)
    for (let j = 0; j < 1 + n(1); j++)
      add(
        R(2, 22),
        "hostage_nade",
        lobbed(R, { u: pick(R, HOT.BAYS), f: HOT.F - 1, h: G + 3 * HOT.FH, vh: R(1, 2), vu: R(-1, 1), vf: -R(4, 6) })
      );
  if (k === 0 || k === 3) flyers(["hostage_gull", "pigeon"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.35) add(R(2, 18), "hostage_guestRun", cross(R, { u0: -12, u1: 12, f: 18, v: 2.6 }));
};

// ---- Level 9: the embassy ------------------------------------------------------------

const EMB = { WALL: 14, HOUSE: 34, GATE: 3 };
WORLDS.hostage_embassy = {
  sky: {
    top: "#060a18",
    mid: "#101830",
    horizon: "#2a3050",
    ground: "#141820",
    stars: true,
    skyline: "#0e1220",
    windows: "#ffd88a",
    seed: 541
  },
  fog: 0x1a2030,
  signs: [["EMBASSY", 0, G + 9.8, EMB.HOUSE - 4.2, 6, 0.9, "#e8e4d8", "#1a2a4a"]],
  build(P) {
    P.ground(0x2a3028, [
      { u: 0, f: 8, r: 6, c: 0x3a3a3a, sx: 4, sz: 0.8 },
      { u: 0, f: 26, r: 3, c: 0x6a6a64, sx: 1, sz: 4 }
    ]);
    // the road out front, the compound wall and its gate, the guard huts
    for (const s of [-1, 1]) {
      P.add(BOX(24, 3.2, 0.6), 0xd8d0c0, s * (EMB.GATE + 12), G + 1.6, EMB.WALL);
      P.add(BOX(1.2, 4, 1.2), 0xd8d0c0, s * (EMB.GATE + 0.6), G + 2, EMB.WALL);
      P.add(BALL(0.4, 8), 0xffe8a0, s * (EMB.GATE + 0.6), G + 4.3, EMB.WALL);
      P.add(BOX(2, 2.6, 2), 0xc8c0b0, s * 9, G + 1.3, EMB.WALL + 2);
      P.add(BOX(1.4, 0.8, 0.06), 0xffd88a, s * 9, G + 1.8, EMB.WALL + 0.98);
    }
    for (let u = -EMB.GATE; u <= EMB.GATE; u += 0.4) P.add(BOX(0.05, 2.6, 0.05), 0x2a2a2a, u, G + 1.3, EMB.WALL);
    // the residence: columns, the portico, lit windows, the flag
    const f = EMB.HOUSE;
    P.add(BOX(26, 9, 10), 0xe8e4d8, 0, G + 4.5, f + 5);
    P.add(BOX(10, 1, 4), 0xe8e4d8, 0, G + 8.6, f - 2);
    P.add(CONE(6, 2, 4), 0xe8e4d8, 0, G + 10.1, f - 2, 0, Math.PI / 4, 0, 1, 1, 0.4);
    for (let u = -4; u <= 4; u += 2) P.add(CYL(0.35, 0.4, 8, 10), 0xf0ece4, u, G + 4, f - 3.6);
    for (let k = 0; k < 4; k++) P.add(BOX(10, 0.3, 1.2), 0xd8d0c0, 0, G + 0.15 + k * 0.3, f - 4.5 + k * 0.3);
    for (const h of [2.4, 6])
      for (let u = -11; u <= 11; u += 3) if (Math.abs(u) > 5) P.add(BOX(1.2, 1.6, 0.1), 0xffd88a, u, G + h, f - 0.05);
    P.add(CYL(0.06, 0.06, 8, 5), 0xc8c8c8, 0, G + 13, f + 2);
    P.add(BOX(2.4, 1.4, 0.05), 0x2f4a9a, 1.2, G + 16.2, f + 2);
    // searchlight towers, the lawn, a fountain, parked cars on the drive
    for (const s of [-1, 1]) {
      P.add(BOX(0.6, 10, 0.6), 0x5a5a5a, s * 18, G + 5, 20);
      P.add(CYL(0.6, 0.4, 0.8, 10), 0xe8e4d8, s * 18, G + 10.4, 20, Math.PI / 2 - 0.4, 0, 0);
    }
    P.add(CYL(2, 2.2, 0.6, 18), 0xd8d0c0, 0, G + 0.3, 22);
    P.add(CYL(0.4, 0.6, 1.6, 10), 0xd8d0c0, 0, G + 1.1, 22);
    for (const u of [-8, 8]) {
      P.add(BOX(1.8, 1.0, 4.2), 0x1a1a1e, u, G + 0.7, 26);
      P.add(BOX(1.6, 0.6, 2.2), 0x1a1a1e, u, G + 1.5, 26.3);
    }
    P.scatter(20, 16, 30, (u, f2, R) => Math.abs(u) > 4 && P.bush(u, f2, 0.6 + R() * 0.5, 0x2a4a2a), 14);
    // hedges along the drive, lamps, the residence's windows, trees round the wall
    for (const s of [-1, 1]) {
      for (let f = 16; f < 32; f += 1.6) P.add(BALL(0.8, 10), 0x2a4a2a, s * 3.2, G + 0.5, f, 0, 0, 0, 1, 0.8, 1);
      for (let f = 17; f < 32; f += 5) {
        P.add(CYL(0.06, 0.08, 3, 5), 0x2a2a2a, s * 4.4, G + 1.5, f);
        P.add(BALL(0.25, 8), 0xffe8a0, s * 4.4, G + 3.1, f);
      }
    }
    for (const h of [2.4, 6])
      for (let u = -11; u <= 11; u += 3)
        if (Math.abs(u) > 5) P.add(BOX(1.4, 0.15, 0.2), 0xd8d0c0, u, G + h - 0.9, EMB.HOUSE - 0.1);
    P.scatter(30, 16, 60, (u, f, R) => Math.abs(u) > 14 && P.oak(u, f, 0.8 + R() * 0.5, 0x2a3a22), 40);
    for (let u = -26; u <= 26; u += 1.2)
      if (Math.abs(u) > EMB.GATE + 1) P.add(CONE(0.12, 0.5, 6), 0x3a3a3a, u, G + 3.45, EMB.WALL);
    P.scatter(55, 2, 12, (u, f, R) => Math.abs(u) > 6 && P.bush(u, f, 0.5 + R() * 0.5, 0x2a3a26), 40);
  },
  slots: [],
  cover: null
};
LAYOUTS.hostage_embassy = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "hostage_cone", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.34, tint: "orange", bank: 3 });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 6,
    f: EMB.WALL - 0.4,
    u0: -14,
    u1: 14,
    base: 3.25,
    size: 0.4,
    tint: "gold",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "hostage_case",
    n: 4,
    f: 25.9,
    u0: -8.6,
    u1: 8.6,
    base: 1.85,
    size: 0.32,
    tint: "brown",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "hostage_ring",
    n: 6,
    f: EMB.HOUSE - 4.2,
    u0: -4,
    u1: 4,
    base: 8.0,
    size: 0.4,
    tint: "gold",
    bank: 3
  });
  L.row({ ...fixed, kind: "hostage_bag", n: 4, f: 46, u0: -12, u1: 12, base: 0.3, size: 0.55, tint: "green", bank: 4 });
  const gang = [
    ["hostage_masked", 40],
    ["hostage_hood", 30],
    ["hostage_diplomat", 20, { dont: true }],
    ["hostage", 10, { dont: true }]
  ];
  L.pops({
    fixed: true,
    f: EMB.WALL - 0.4,
    at: [
      [-9, 0],
      [9, 0],
      [-1.4, 0],
      [1.4, 0]
    ],
    size: 1.8,
    busy: 0.6,
    kinds: gang
  });
  L.pops({
    fixed: true,
    f: EMB.HOUSE - 0.4,
    at: [-11, -8, 8, 11].map(u => [u, 4.8]),
    size: 1.4,
    busy: 0.6,
    kinds: gang
  });
  L.pops({
    fixed: true,
    f: EMB.HOUSE - 3.4,
    at: [
      [-3, 1.2],
      [3, 1.2]
    ],
    size: 1.8,
    kinds: [...gang, ["hostage_leader", 10, { pts: 250 }]]
  });
  L.pops({
    fixed: true,
    f: 25.4,
    at: [
      [-8, 0],
      [8, 0]
    ],
    size: 1.75,
    kinds: gang
  });
};
const embassyWave = (R, add, c) => {
  const out = t =>
    add(
      t,
      R(0, 1) < 0.6 ? "hostage_mRun" : "hostage_hRun",
      rush(
        R,
        [
          [pick(R, [-3, 3]), EMB.HOUSE - 3.4, G + 1.2],
          [R(-2, 2), EMB.WALL + 1, G],
          [R(-2, 2), EMB.WALL - 1, G],
          [R(-8, 8), R(5, 9), G]
        ],
        R(3, 4) * c.S
      )
    );
  const van = t =>
    add(t, R(0, 1) < 0.5 ? "hostage_van" : "hostage_vanY", skim(R, { v: R(12, 16) * c.S, f: 8, h: 0.05, u0: 34 }));
  if (c.x2) {
    for (let k = 0; k < 7; k++) out(1 + k * 3);
    for (let k = 0; k < 4; k++) van(2 + k * 5);
    add(6, "heli", hover(R, { f: EMB.HOUSE, h: 16 }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.3); j++) out(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++) van(R(1, 22));
  if (k === 2 || k === 5)
    add(
      R(2, 20),
      "hostage_nade",
      lobbed(R, { u: R(-8, 8), f: EMB.WALL, h: G + 3.4, vh: R(3, 4), vu: R(-2, 2), vf: -R(3, 4) })
    );
  if (k === 1 || k === 4) add(R(2, 12), "heli", hover(R, { f: EMB.HOUSE, h: 16 }));
  if (R(0, 1) < 0.3) add(R(2, 18), "hostage_dipRun", cross(R, { u0: -9, u1: 9, f: 20, v: 2.2 }));
};

// ---- Sound and the levels ----------------------------------------------------------------

Object.assign(AMBIENCE, {
  hostage_bank(d, sr, R) {
    bed(d, sr, R, { crowd: 0.6, hum: [60, 0.02] });
  },
  hostage_subway(d, sr, R) {
    bed(d, sr, R, { wind: 1.2, crowd: 0.4, hum: [45, 0.05], clank: 0.06 });
  },
  hostage_mall(d, sr, R) {
    bed(d, sr, R, { crowd: 0.9, water: 0.2 });
  },
  hostage_hotel(d, sr, R) {
    bed(d, sr, R, { wind: 0.8, water: 0.3, gulls: 0.02, birds: 0.02 });
  },
  hostage_embassy(d, sr, R) {
    bed(d, sr, R, { wind: 0.8, crickets: 0.02, hum: [50, 0.02] });
  }
});

const level = o => ({ music: "hostage", ...o });
export const HOSTAGE_MORE = {
  kinds,
  levels: [
    level({
      world: "hostage_bank",
      name: "THE BANK JOB",
      story: "They're holding the tellers. The vault is open",
      amb: "hostage_bank",
      indoor: true,
      legend: "MONEY BAGS 25 · THE LEADER 250 · DON'T SHOOT THE TELLERS",
      wave: bankWave,
      title: (w, x2) => (x2 ? "THEY'RE MAKING A RUN FOR IT · DOUBLE POINTS" : null)
    }),
    level({
      world: "hostage_subway",
      name: "THE SUBWAY",
      story: "They've gone underground. Watch the trains",
      amb: "hostage_subway",
      indoor: true,
      legend: "TRAINS 75 · DON'T SHOOT THE COMMUTERS",
      wave: subwayWave,
      title: (w, x2) => (x2 ? "RUSH HOUR · DOUBLE POINTS" : null)
    }),
    level({
      world: "hostage_mall",
      name: "THE MALL",
      story: "Shoppers trapped on both floors",
      amb: "hostage_mall",
      indoor: true,
      legend: "THE LEADER 250 · DON'T SHOOT THE SHOPPERS",
      wave: mallWave,
      title: (w, x2) => (x2 ? "THE ATRIUM · DOUBLE POINTS" : null)
    }),
    level({
      world: "hostage_hotel",
      name: "THE GRAND HOTEL",
      story: "They've taken a floor. Guests on every balcony",
      amb: "hostage_hotel",
      legend: "THE HELICOPTER 20 · DON'T SHOOT THE GUESTS",
      wave: hotelWave,
      title: (w, x2) => (x2 ? "THE ROOFTOP PICK-UP · DOUBLE POINTS" : null)
    }),
    level({
      world: "hostage_embassy",
      name: "THE EMBASSY",
      story: "Midnight. The ambassador is inside",
      amb: "hostage_embassy",
      legend: "VANS 75 · THE LEADER 250 · DON'T SHOOT THE AMBASSADOR",
      wave: embassyWave,
      title: (w, x2) => (x2 ? "THE BREAKOUT · DOUBLE POINTS" : null)
    })
  ]
};
