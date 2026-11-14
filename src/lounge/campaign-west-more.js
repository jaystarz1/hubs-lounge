import { GROUND, BOX, CYL, BALL, CONE, TORUS, SLAB, WORLDS, AMBIENCE } from "./shoots-art";
import { LAYOUTS } from "./plates";
import { cross, toss, across, run, pick, flyers, bird } from "./shoot-paths";
import { skim } from "./campaign-kit";
import { rush, lobbed, saguaro, barrel, wagon, horse, fence, waterTower, window_ } from "./campaign-west";

// The western's five more levels (Jay, 2026-10-31: "add five more levels to
// each set"), between the camp on the trail and Villa's hacienda:
//   5 THE TRAIN ROBBERY  the gang has stopped the express in the desert:
//                       bandits in the cars and on the roofs, riders along
//                       the line, dynamite from the express car
//   6 THE GOLD MINE     the diggings: the adit in the hill, the stamp mill,
//                       ore carts, shacks, the flume; dynamite everywhere
//   7 THE CANYON AMBUSH  you're guarding the stage in a canyon: men on the
//                       ledges and behind the rocks, riders down the trail
//   8 THE RIVERBOAT     a paddle steamer at the landing: gamblers and gunmen
//                       on her decks, cards and bottles, the ladies (don't)
//   9 BOOT HILL         midnight in the graveyard: crosses and headstones,
//                       the hanging tree, the gang among the graves

const G = GROUND;

const kinds = {
  w_crow: bird("crow", 25, 0.3, "caw"),
  w_bat: bird("boar_bat", 25, 0.25, "chirp"),
  w_bottle: { pts: 25, r: 0.17, hy: 0.15, dies: "shatter", art: { thing: "whiskey" }, face: "tumble", sound: "glass" },
  w_cart: {
    pts: 75,
    r: 0.7,
    hy: 0.6,
    dies: "fall",
    art: { plate: "cart", tint: 0x9a8a72, h: 1.6 },
    face: "slide",
    sound: "clank"
  }
};

// ---- Level 5: the train robbery ----------------------------------------------------

const TRN = { F: 15, CARS: [-14, -4, 6, 16], LOCO: 26 };
function railcar(P, u, c, roofC) {
  const f = TRN.F;
  P.add(BOX(9, 3.0, 2.8), c, u, G + 2.4, f);
  P.add(BOX(9.4, 0.3, 3.2), roofC, u, G + 4.05, f);
  P.add(BOX(9.2, 0.25, 2.9), 0x2a2a2a, u, G + 0.85, f);
  for (const x of [-3, 3])
    for (const s of [-1, 1]) P.add(CYL(0.42, 0.42, 0.2, 10), 0x2a2a2a, u + x + s * 0.7, G + 0.42, f - 1.3, Math.PI / 2);
  for (let k = 0; k < 4; k++) window_(P, u - 3.3 + k * 2.2, 1.6, f - 1.42, 1.0, 0.9);
}
WORLDS.west_train = {
  sky: {
    top: "#2a62a8",
    mid: "#7aa8d8",
    horizon: "#f4dcb0",
    ground: "#8a6a42",
    sun: [-40, 30, "#fffbe8", 12],
    clouds: 4,
    hills: [
      { colour: "#b06a42", height: 8, rough: 2, phase: 2 },
      { colour: "#8a5a3a", height: 4, rough: 3 }
    ],
    seed: 301
  },
  fog: 0xe0c49a,
  build(P) {
    P.ground(0xc09a62, [{ u: 0, f: TRN.F, r: 2.2, c: 0x8a7050, sx: 40, sz: 1 }]);
    for (const e of [-0.72, 0.72]) P.add(BOX(140, 0.1, 0.08), 0x6a6a6a, 0, G + 0.12, TRN.F + e);
    for (let u = -68; u < 68; u += 1.2) P.add(BOX(0.25, 0.08, 2.2), 0x5a4030, u, G + 0.05, TRN.F);
    // the cars: two coaches, the express car, the tender, the locomotive
    railcar(P, TRN.CARS[0], 0x7a2a1a, 0x3a2a2a);
    railcar(P, TRN.CARS[1], 0x6a3a2a, 0x3a2a2a);
    railcar(P, TRN.CARS[2], 0x3a4a3a, 0x2a2a2a);
    P.add(BOX(1.8, 2.2, 0.1), 0x1a1210, TRN.CARS[2], G + 1.9, TRN.F - 1.45);
    P.add(BOX(6, 2.4, 2.8), 0x2a2a2a, TRN.CARS[3], G + 2.0, TRN.F);
    P.add(BOX(5, 1.0, 2.4), 0x1a1a1a, TRN.CARS[3], G + 3.5, TRN.F);
    const L0 = TRN.LOCO;
    P.add(CYL(1.1, 1.1, 7, 14), 0x2a2a2a, L0, G + 2.6, TRN.F, 0, 0, Math.PI / 2);
    P.add(BOX(2.6, 3.2, 2.8), 0x3a2a1a, L0 - 4.4, G + 2.9, TRN.F);
    P.add(CYL(0.45, 0.7, 1.8, 10), 0x1a1a1a, L0 + 2.3, G + 4.4, TRN.F);
    P.add(CYL(0.3, 0.3, 0.6, 8), 0xc8a040, L0, G + 3.9, TRN.F);
    P.add(CONE(1.6, 1.6, 4), 0x5a1a1a, L0 + 4.3, G + 0.8, TRN.F, 0, 0, -Math.PI / 2, 1, 1, 0.6);
    for (let k = 0; k < 3; k++)
      P.add(CYL(0.85, 0.85, 0.2, 14), 0xc0182a, L0 - 2 + k * 1.8, G + 0.85, TRN.F - 1.45, Math.PI / 2);
    P.add(BALL(0.4, 8), 0xffe8a0, L0 + 3.6, G + 3.0, TRN.F);
    // smoke from the stack, the desert round it
    for (let k = 0; k < 5; k++)
      P.add(BALL(0.8 + k * 0.4, 7), 0xd8d4cc, L0 + 2.3 - k * 1.2, G + 5.6 + k * 0.6, TRN.F + k * 0.3);
    waterTower(P, 34, 32);
    P.scatter(26, 24, 90, (u, f, R) => saguaro(P, u, f, 0.8 + R() * 0.7), 80, 10);
    P.scatter(30, 4, 80, (u, f, R) => Math.abs(f - TRN.F) > 3 && P.rock(u, f, 0.5 + R() * 1.4, 0xa07a52), 70, 4);
    for (const [u, f] of [
      [-6, 6],
      [7, 7],
      [-16, 9]
    ])
      P.rock(u, f, 2, 0x9a7048);
  },
  slots: [],
  cover: null
};
LAYOUTS.west_train = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "can", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.34, tint: ["steel", "red"], bank: 3 });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 4,
    f: TRN.F - 1.6,
    u0: -14,
    u1: 16,
    base: 4.2,
    size: 0.4,
    tint: "gold",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "bottle",
    n: 6,
    f: TRN.F + 1.2,
    u0: -17,
    u1: -11,
    base: 4.2,
    size: 0.34,
    tint: ["green", "brown"],
    bank: 3
  });
  L.row({ kind: "can", n: 5, f: 28, u0: -9, u1: 9, base: 1.2, size: 0.45, tint: ["red", "steel"], bank: 5 });
  L.row({ ...fixed, kind: "bell", n: 1, f: 31.4, u0: 34, u1: 34, base: 10.6, size: 0.8, tint: "gold", pts: 50 });
  L.row({ fixed: true, kind: "skull", n: 4, f: 46, u0: -6, u1: 6, base: 1.6, size: 0.6, tint: "white", perch: true });
  const gang = [
    ["bandit", 40],
    ["bandit2", 30],
    ["rifleman", 15],
    ["lady", 8, { dont: true }],
    ["townsman", 7, { dont: true }]
  ];
  for (const u of TRN.CARS.slice(0, 2))
    L.pops({ fixed: true, f: TRN.F - 1.6, at: [-3.3, 1.1].map(x => [u + x, 1.4]), size: 1.3, kinds: gang });
  L.pops({
    fixed: true,
    f: TRN.F - 1.6,
    at: [[TRN.CARS[2], 0.8]],
    size: 1.8,
    kinds: [
      ["bandit", 50],
      ["rifleman", 30],
      ["villa", 5, { pts: 250 }],
      ["townsman", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: TRN.F + 0.5,
    at: TRN.CARS.slice(0, 3).map(u => [u + 2, 4.2]),
    size: 1.6,
    period: [5, 8],
    kinds: [
      ["rifleman", 60, { pts: 25 }],
      ["bandit", 40, { pts: 25 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 7.4,
    at: [
      [-6, 0],
      [7, 0],
      [-16, 0]
    ],
    size: 1.75,
    kinds: [
      ["bandit", 45],
      ["bandit2", 40],
      ["townsman", 15, { dont: true }]
    ]
  });
};
const trainWave = (R, add, c) => {
  const ride = (t, f) => add(t, R(0, 1) < 0.6 ? "rider" : "riderB", run(R, { v: R(12, 15) * c.S, f }));
  const off = t => {
    const u = pick(R, TRN.CARS.slice(0, 3));
    add(
      t,
      pick(R, ["banditRun", "bandit2Run", "riflemanRun"]),
      rush(
        R,
        [
          [u, TRN.F - 1.6, G],
          [u * 0.6 + R(-2, 2), R(5, 9), G]
        ],
        R(2.8, 3.6) * c.S
      )
    );
  };
  const dyna = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n,
        "dynamite",
        lobbed(R, { u: TRN.CARS[2] + R(-2, 2), f: TRN.F - 1.5, h: G + 2.5, vh: R(4, 6), vu: R(-2, 2), vf: -R(3, 5) })
      );
  };
  if (c.x2) {
    for (let k = 0; k < 8; k++) ride(1 + k * 3, k % 2 ? R(9, 12) : R(19, 24));
    for (let k = 0; k < 5; k++) off(2 + k * 4.5);
    dyna(4);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.5); j++) ride(R(1, 22), R(0, 1) < 0.5 ? R(9, 12) : R(19, 26));
  for (let j = 0; j < 1 + n(1.3); j++) off(R(1, 22));
  if (k === 1 || k === 4) dyna(2 + n(1));
  if (k === 2 || k === 5) flyers(["w_crow", "vulture"], R, add, c, 2 + n(1));
  if (R(0, 1) < 0.3) add(R(2, 18), "ladyRun", cross(R, { u0: -12, u1: 4, f: TRN.F - 2.4, v: 1.6 }));
};

// ---- Level 6: the gold mine ------------------------------------------------------

const MIN = { ADIT: [0, 32], MILL: [-16, 26], RAIL: 0 };
WORLDS.west_mine = {
  sky: {
    top: "#3a6ab0",
    mid: "#8ab0d8",
    horizon: "#e8dcc0",
    ground: "#6a5a3a",
    sun: [30, 40, "#fffbe8", 11],
    clouds: 6,
    hills: [
      { colour: "#6a7a5a", height: 14, rough: 4, phase: 1, trees: true },
      { colour: "#5a6a4a", height: 8, rough: 3, trees: true }
    ],
    seed: 311
  },
  fog: 0xc8c0a8,
  build(P) {
    const [au, af] = MIN.ADIT;
    P.ground(0x9a8460, [
      { u: 0, f: 18, r: 3, c: 0x7a6a50, sx: 0.6, sz: 5 },
      { u: au, f: af - 3, r: 9, c: 0x8a7a5a, sx: 1.4, sz: 0.7 }
    ]);
    // the hill and the adit's timbers, rails out of it and down to you
    P.add(BALL(14, 14), 0x7a6a4a, au, G - 4, af + 10, 0, 0, 0, 1.8, 1.1, 1);
    P.add(BOX(4, 4, 1), 0x1a120c, au, G + 2, af - 0.2);
    for (const s of [-1, 1]) P.add(BOX(0.5, 4.4, 0.5), 0x6a4a2a, au + s * 2.2, G + 2.2, af - 0.6);
    P.add(BOX(5.4, 0.5, 0.6), 0x6a4a2a, au, G + 4.4, af - 0.6);
    for (const e of [-0.5, 0.5]) P.add(SLAB(0.08, 0.08, af - 4), 0x6a6a6a, au + e, G + 0.12, af / 2 + 2);
    for (let f = 4; f < af; f += 1) P.add(BOX(1.6, 0.08, 0.2), 0x5a4030, au, G + 0.05, f);
    // the stamp mill on its hillside, the flume on trestles, the shacks
    const [mu, mf] = MIN.MILL;
    P.add(BOX(9, 7, 7), 0x8a6a46, mu, G + 3.5, mf);
    P.add(BOX(9.6, 0.4, 7.6), 0x5a4030, mu, G + 7.6, mf, 0.25, 0, 0);
    for (let k = 0; k < 4; k++) P.add(BOX(0.4, 3, 0.4), 0x3a3a3a, mu - 2.4 + k * 1.6, G + 9, mf - 1);
    for (let k = 0; k < 3; k++) window_(P, mu - 2.5 + k * 2.5, 3.2, mf - 3.55, 1.2, 1.2);
    for (let u = -10; u < 26; u += 4) {
      P.add(BOX(0.25, 5, 0.25), 0x6a4a2a, u, G + 2.5, 22);
      P.add(BOX(4.2, 0.6, 0.9), 0x7a5a3a, u + 2, G + 5.2, 22);
    }
    for (const [u, f, w] of [
      [14, 14, 5],
      [20, 24, 6],
      [-24, 12, 5]
    ]) {
      P.add(BOX(w, 3.2, 4), 0x8a6a46, u, G + 1.6, f);
      P.add(BOX(w + 0.5, 0.3, 4.6), 0x5a4030, u, G + 3.4, f, 0.15, 0, 0);
      P.add(BOX(1.0, 2.0, 0.1), 0x1a120c, u, G + 1.0, f - 2.02);
      window_(P, u + w / 4, 1.2, f - 2.02, 0.9, 0.8);
    }
    // ore carts, tailings, a wagon, barrels of powder
    for (const f of [8, 20]) {
      P.add(BOX(1.4, 0.9, 1.0), 0x6a6058, au, G + 0.75, f);
      P.add(BALL(0.6, 6), 0x8a7a5a, au, G + 1.2, f, 0, 0, 0, 1.1, 0.5, 0.8);
    }
    P.add(BALL(5, 10), 0x9a8a6a, 9, G - 1.5, 34, 0, 0, 0, 1.6, 0.7, 1.2);
    wagon(P, -9, 8);
    for (const [u, f] of [
      [5, 6],
      [5.8, 6.4],
      [-5.6, 15]
    ])
      barrel(P, u, f, 0x5a3a20);
    P.scatter(40, 30, 90, (u, f, R) => P.pine(u, f, 0.9 + R() * 0.8, 0x3a5a3a), 80, 20);
    P.scatter(30, 4, 40, (u, f, R) => Math.abs(u) > 4 && P.rock(u, f, 0.4 + R() * 0.8, 0x8a7a5a), 30, 4);
  },
  slots: [],
  cover: null
};
LAYOUTS.west_mine = L => {
  const fixed = { fixed: true, rail: false };
  const [au, af] = MIN.ADIT;
  L.row({ kind: "can", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.34, tint: ["steel", "red"], bank: 3 });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 3,
    f: af - 0.9,
    u0: au - 1.8,
    u1: au + 1.8,
    base: 3.4,
    size: 0.4,
    tint: "gold",
    bank: 3
  });
  L.row({ ...fixed, kind: "olla", n: 6, f: 21.5, u0: -8, u1: 12, base: 5.6, size: 0.45, tint: "orange", bank: 3 });
  L.row({ kind: "skull", n: 4, f: 12, u0: -5, u1: 5, base: 1.3, size: 0.42, tint: "white", perch: true });
  L.row({
    ...fixed,
    kind: "bell",
    n: 1,
    f: MIN.MILL[1] - 1.4,
    u0: MIN.MILL[0],
    u1: MIN.MILL[0],
    base: 10.4,
    size: 0.7,
    tint: "gold",
    pts: 50
  });
  L.row({ kind: "can", n: 4, f: 46, u0: -12, u1: 12, base: 1.4, size: 0.55, tint: "red", bank: 4 });
  const gang = [
    ["bandit", 40],
    ["bandit2", 30],
    ["rifleman", 20],
    ["townsman", 10, { dont: true }]
  ];
  L.pops({
    fixed: true,
    f: af - 0.8,
    at: [
      [au - 1, 0],
      [au + 1, 0]
    ],
    size: 1.8,
    kinds: gang
  });
  for (const [u, f] of [
    [14, 14, 5],
    [20, 24, 6],
    [-24, 12, 5]
  ])
    L.pops({ fixed: true, f: f - 2.3, at: [[u, 0]], size: 1.75, kinds: [...gang, ["lady", 10, { dont: true }]] });
  L.pops({
    fixed: true,
    f: MIN.MILL[1] - 3.8,
    at: [
      [MIN.MILL[0] - 2.5, 3.2],
      [MIN.MILL[0] + 2.5, 3.2]
    ],
    size: 1.4,
    kinds: [
      ["rifleman", 60, { pts: 25 }],
      ["bandit", 40, { pts: 25 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 8.6,
    at: [
      [au + 1.2, 0],
      [-9, 0]
    ],
    size: 1.75,
    kinds: gang
  });
};
const mineWave = (R, add, c) => {
  const [au, af] = MIN.ADIT;
  const out = t =>
    add(
      t,
      pick(R, ["banditRun", "bandit2Run", "riflemanRun"]),
      rush(
        R,
        [
          [au, af - 1, G],
          [au + R(-1, 1), R(14, 20), G],
          [R(-6, 6), R(4, 8), G]
        ],
        R(3, 3.8) * c.S
      )
    );
  const cart = t => add(t, "w_cart", skim(R, { v: R(7, 10) * c.S, f: pick(R, [10, 26]), h: 0.3, u0: 26 }));
  const dyna = n => {
    for (let k = 0; k < n; k++) {
      const from = pick(R, [
        [au, af - 1, 2],
        [MIN.MILL[0], MIN.MILL[1] - 3.6, 4],
        [14, 12, 1.5]
      ]);
      add(
        2 + (k * 24) / n,
        "dynamite",
        lobbed(R, {
          u: from[0],
          f: from[1],
          h: G + from[2],
          vh: R(4, 6),
          vu: R(-2, 2),
          vf: -R(from[1] / 5, from[1] / 3.5)
        })
      );
    }
  };
  if (c.x2) {
    for (let k = 0; k < 7; k++) out(1 + k * 3);
    dyna(6);
    for (let k = 0; k < 3; k++) cart(2 + k * 7);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) out(R(1, 22));
  if (k !== 0) dyna(1 + n(1.5));
  for (let j = 0; j < 1 + n(1); j++) cart(R(1, 22));
  if (k === 3) flyers(["w_crow", "vulture"], R, add, c, 3);
};

// ---- Level 7: the canyon ambush ---------------------------------------------------

const AMB = { W: 14, CLIFF: 20, STAGE: [0, 14] };
WORLDS.west_canyon = {
  sky: {
    top: "#2a5aa8",
    mid: "#7aa8d8",
    horizon: "#f2d4a8",
    ground: "#9a5a36",
    sun: [-20, 50, "#fffbe8", 11],
    clouds: 3,
    hills: [{ colour: "#a85a36", height: 12, rough: 4 }],
    seed: 321
  },
  fog: 0xd8a074,
  build(P) {
    P.ground(0xb87a4a, [{ u: 0, f: 30, r: 5, c: 0x9a6a42, sx: 1.2, sz: 7 }]);
    for (const s of [-1, 1])
      for (let f = -8; f < 90; f += 7) {
        const w = AMB.W + 4 - Math.min(4, f * 0.05) + ((f * 7) % 5) * 0.4;
        const h = AMB.CLIFF + ((f * 11) % 8);
        P.add(BOX(12, h, 7.4), [0xa85a36, 0x9a5030, 0xb86a40][Math.abs(f) % 3], s * (w + 6), G + h / 2, f);
        P.add(BOX(3.6, 0.7, 4), 0xc07a4a, s * (w - 1.2), G + h * 0.4, f + 1);
        P.add(BOX(10, 1.4, 6), 0xc88a58, s * (w + 6.5), G + h + 0.7, f + 0.3);
        for (const hh of [h * 0.25, h * 0.65]) P.add(BOX(0.6, 0.4, 7.2), 0x8a4628, s * w, G + hh, f);
      }
    // the stagecoach you're guarding, its team, rocks round the trail
    const [su, sf] = AMB.STAGE;
    wagon(P, su, sf, false, Math.PI / 2);
    P.add(BOX(1.6, 1.8, 2.8), 0x5a1a1a, su, G + 2.1, sf, 0, 0, 0);
    P.add(BOX(1.7, 0.2, 2.9), 0xc8a040, su, G + 3.05, sf);
    horse(P, su - 0.6, sf + 3.6, Math.PI / 2, 0x6a4428);
    horse(P, su + 0.6, sf + 3.6, Math.PI / 2, 0x3a2a1a);
    for (const [u, f, s] of [
      [-7, 6, 1.4],
      [6, 7, 1.2],
      [-8, 22, 1.8],
      [8, 26, 1.6],
      [-5, 38, 1.5],
      [6, 44, 2]
    ])
      P.rock(u, f, s * 1.4, 0x9a5a36);
    P.scatter(50, 0, 80, (u, f, R) => Math.abs(u) < AMB.W - 2 && P.bush(u, f, 0.3 + R() * 0.4, 0x7a7a3a), AMB.W);
    P.scatter(10, 10, 70, (u, f, R) => Math.abs(u) < AMB.W - 3 && saguaro(P, u, f, 0.6 + R() * 0.4), AMB.W, 5);
    P.scatter(30, 2, 70, (u, f, R) => Math.abs(u) < AMB.W - 2 && P.rock(u, f, 0.3 + R() * 0.5, 0xa86a42), AMB.W);
  },
  slots: [],
  cover: null
};
LAYOUTS.west_canyon = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "can", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.34, tint: ["steel", "red"], bank: 3 });
  L.row({
    ...fixed,
    kind: "bottle",
    n: 3,
    f: AMB.STAGE[1] - 1.5,
    u0: -0.6,
    u1: 0.6,
    base: 3.1,
    size: 0.3,
    tint: ["green", "brown"],
    bank: 3
  });
  L.row({ kind: "skull", n: 4, f: 18, u0: -4, u1: 4, base: 1.4, size: 0.42, tint: "white", perch: true });
  L.row({ kind: "can", n: 5, f: 32, u0: -6, u1: 6, base: 1.2, size: 0.5, tint: ["red", "steel"], bank: 5 });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 4,
    f: 50,
    u0: -4,
    u1: 4,
    base: 1.4,
    size: 0.55,
    tint: "gold",
    bank: 4,
    rail: true
  });
  const ledges = [];
  for (const s of [-1, 1])
    for (let f = 6; f < 70; f += 14) {
      const w = AMB.W + 4 - Math.min(4, f * 0.05) + ((f * 7) % 5) * 0.4;
      ledges.push([s * (w - 1.2), f + 1, (AMB.CLIFF + ((f * 11) % 8)) * 0.4 + 0.35]);
    }
  for (const [u, f, h] of ledges)
    L.pops({
      fixed: true,
      f: f - 1.6,
      at: [[u, h]],
      size: 1.7,
      busy: 0.7,
      kinds: [
        ["rifleman", 55],
        ["bandit", 30],
        ["bandit2", 15]
      ]
    });
  L.pops({
    fixed: true,
    peek: true,
    f: 22.6,
    at: [
      [-8, 0],
      [8, 0]
    ],
    size: 1.8,
    kinds: [
      ["bandit", 50],
      ["bandit2", 35],
      ["townsman", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: AMB.STAGE[1] - 1.7,
    at: [[1.2, 1.2]],
    size: 1.4,
    kinds: [
      ["lady", 60, { dont: true }],
      ["townsman", 40, { dont: true }]
    ]
  });
};
const canyonWave = (R, add, c) => {
  const ride = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      R(0, 1) < 0.6 ? "rider" : "riderB",
      rush(
        R,
        [
          [R(-3, 3), 80, G],
          [R(-4, 4), R(28, 36), G],
          [s * (AMB.W - 1), R(18, 24), G]
        ],
        R(11, 14) * c.S,
        false
      )
    );
  };
  const rocks = n => {
    for (let k = 0; k < n; k++) {
      const s = R(0, 1) < 0.5 ? 1 : -1;
      add(
        2 + (k * 24) / n,
        "dynamite",
        lobbed(R, { u: s * (AMB.W - 1), f: R(10, 30), h: G + 8, vh: R(2, 4), vu: -s * R(2, 4), vf: -R(1, 3) })
      );
    }
  };
  if (c.x2) {
    for (let k = 0; k < 9; k++) ride(1 + k * 2.6);
    rocks(5);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.5); j++) ride(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++)
    add(
      R(1, 22),
      pick(R, ["banditRun", "bandit2Run"]),
      rush(
        R,
        [
          [pick(R, [-8, 8]), 22.6, G],
          [R(-5, 5), R(5, 9), G]
        ],
        R(3, 4) * c.S
      )
    );
  if (k === 1 || k === 4) rocks(2 + n(1));
  if (k === 2 || k === 5) flyers(["w_crow", "vulture"], R, add, c, 2 + n(1));
};

// ---- Level 8: the riverboat ---------------------------------------------------------

const BOAT = { F: 22, DECKS: [1.8, 4.6, 7.2], RIVER: [14, 40] };
function steamer(P) {
  const f = BOAT.F;
  const W = 0xf0ece0;
  P.add(BOX(30, 1.6, 7), W, 0, G + 0.6, f);
  P.add(BOX(30.4, 0.3, 7.4), 0x8a3a2a, 0, G + 1.45, f);
  P.add(BOX(24, 2.6, 5), W, -1, G + 2.9, f + 0.6);
  P.add(BOX(25, 0.3, 6.6), 0x5a4a3a, -1, G + 4.35, f);
  P.add(BOX(18, 2.4, 4), W, -1, G + 5.7, f + 0.8);
  P.add(BOX(19, 0.3, 5.6), 0x5a4a3a, -1, G + 7.0, f);
  P.add(BOX(5, 2, 3), W, -1, G + 8.2, f + 0.8);
  for (const s of [-1, 1]) {
    P.add(CYL(0.55, 0.55, 9, 10), 0x1a1a1a, -1 + s * 1.6, G + 11, f - 0.6);
    P.add(CYL(0.9, 0.6, 0.6, 10), 0x1a1a1a, -1 + s * 1.6, G + 15.6, f - 0.6);
  }
  // the stern wheel, the railings on each deck, windows and doors
  P.add(CYL(3.2, 3.2, 6, 16, 1, true), 0xc0182a, 16.5, G + 2.6, f, 0, 0, Math.PI / 2);
  for (let k = 0; k < 8; k++)
    P.add(
      BOX(6, 0.2, 0.4),
      0x8a1a1a,
      16.5,
      G + 2.6 + Math.sin(k * 0.78) * 3.1,
      f + Math.cos(k * 0.78) * 3.1,
      k * 0.78,
      0,
      0
    );
  for (const [h, len, u0] of [
    [4.95, 25, -1],
    [7.6, 19, -1]
  ]) {
    P.add(BOX(len, 0.08, 0.08), W, u0, G + h, f - 2.75);
    for (let u = u0 - len / 2; u < u0 + len / 2; u += 0.6) P.add(BOX(0.05, 0.6, 0.05), W, u, G + h - 0.3, f - 2.75);
  }
  for (let k = 0; k < 7; k++) P.add(BOX(1.0, 1.6, 0.1), 0x2a3a4a, -11 + k * 3.4, G + 2.9, f - 1.92);
  for (let k = 0; k < 5; k++) P.add(BOX(0.9, 1.4, 0.1), 0x2a3a4a, -8 + k * 3.6, G + 5.7, f - 1.22);
  P.add(BOX(8, 0.8, 0.12), 0x1a3a6a, -1, G + 7.4, f - 2.85);
}
WORLDS.west_riverboat = {
  sky: {
    top: "#2a3a6a",
    mid: "#c86a5a",
    horizon: "#f8b878",
    ground: "#3a4a2a",
    sun: [25, 6, "#ffd27a", 15],
    clouds: 8,
    cloud: "rgba(255,180,140,0.45)",
    hills: [{ colour: "#3a4a3a", height: 4, rough: 2, trees: true }],
    seed: 331
  },
  fog: 0xc89a7a,
  signs: [["NATCHEZ BELLE", -1, G + 7.4, BOAT.F - 2.95, 7.6, 0.7, "#1a3a6a", "#f2e2b8"]],
  build(P) {
    P.ground(0x4a5a32, [
      { u: 0, f: (BOAT.RIVER[0] + BOAT.RIVER[1]) / 2, r: 13, c: 0x3a5a6a, sx: 6, sz: 1 },
      { u: 0, f: 8, r: 6, c: 0x6a5a3a, sx: 3, sz: 0.6 }
    ]);
    steamer(P);
    // the landing: planks out to her, bales and barrels, a lamp post
    P.add(BOX(10, 0.3, 8), 0x7a5a3a, 0, G + 0.3, 10);
    for (let u = -4.5; u <= 4.5; u += 3) P.add(CYL(0.15, 0.15, 1.6, 6), 0x5a4030, u, G + 0.3, 14);
    P.add(BOX(1.4, 0.15, 5), 0x7a5a3a, -6, G + 1.0, 16.5, 0.18, 0, 0);
    for (const [u, f] of [
      [-3, 8],
      [-2.2, 8.6],
      [3.5, 7.5]
    ])
      barrel(P, u, f);
    for (const [u, f] of [
      [2, 11],
      [3.2, 11],
      [2.6, 11.9]
    ])
      P.add(BOX(1.1, 0.9, 0.9), 0xd8c890, u, G + 0.75 + (f > 11.5 ? 0.9 : 0), f);
    P.add(CYL(0.06, 0.08, 3.4, 5), 0x2a2a2a, -4.6, G + 2, 7);
    P.add(BALL(0.25, 8), 0xffd27a, -4.6, G + 3.8, 7);
    // willows on the banks, the far shore
    P.scatter(18, 2, 12, (u, f, R) => Math.abs(u) > 8 && P.oak(u, f, 0.9 + R() * 0.5, 0x5a7a3a), 40);
    P.scatter(30, 42, 80, (u, f, R) => P.oak(u, f, 1 + R() * 0.6, 0x3a5a2a), 80);
    for (let k = 0; k < 20; k++)
      P.add(
        CYL(0.08, 0.1, 1.6, 5),
        0x6a7a3a,
        -14 + k * 1.4,
        G + 0.6,
        13.4 + (k % 3) * 0.3,
        0.2 * Math.sin(k),
        0,
        0.2 * Math.cos(k)
      );
    P.scatter(20, 2, 12, (u, f, R) => Math.abs(u) > 6 && P.bush(u, f, 0.6 + R() * 0.6, 0x4a6a2a), 30);
  },
  slots: [],
  cover: null
};
LAYOUTS.west_riverboat = L => {
  const fixed = { fixed: true, rail: false };
  const f = BOAT.F;
  L.row({
    ...fixed,
    kind: ["spade", "heart", "diamond", "club"],
    n: 4,
    f: 5.5,
    u0: -2.2,
    u1: 2.2,
    base: 0.45,
    size: 0.4,
    tint: ["white", "red", "red", "white"],
    bank: 4,
    rail: true
  });
  L.row({
    ...fixed,
    kind: "bottle",
    n: 3,
    f: 7.4,
    u0: -3.6,
    u1: -1.6,
    base: 1.6,
    size: 0.3,
    tint: ["green", "brown"],
    bank: 3
  });
  L.row({ ...fixed, kind: "lantern", n: 6, f: f - 2.9, u0: -12, u1: 10, base: 4.4, size: 0.38, tint: "gold", bank: 3 });
  L.row({
    ...fixed,
    kind: ["heart", "spade"],
    n: 4,
    f: f - 2.9,
    u0: -8,
    u1: 6,
    base: 7.05,
    size: 0.42,
    tint: ["red", "white"],
    bank: 4
  });
  L.row({ ...fixed, kind: "bell", n: 1, f: f - 0.8, u0: -1, u1: -1, base: 9.3, size: 0.6, tint: "gold", pts: 50 });
  L.row({ kind: "bottle", n: 4, f: 46, u0: -12, u1: 12, base: 1.4, size: 0.5, tint: "green", bank: 4 });
  const crew = [
    ["gunslinger", 35],
    ["cowboy", 25],
    ["outlaw", 10, { pts: 50 }],
    ["lady", 20, { dont: true }],
    ["barkeep", 10, { dont: true }]
  ];
  L.pops({ fixed: true, f: f - 2.1, at: [-11, -4.2, 2.6, 9.4].map(u => [u, 2.0]), size: 1.6, kinds: crew });
  L.pops({ fixed: true, f: f - 1.4, at: [-8, -0.8, 6.4].map(u => [u, 4.7]), size: 1.5, kinds: crew });
  L.pops({
    fixed: true,
    f: f - 0.9,
    at: [[-1, 7.3]],
    size: 1.4,
    period: [5, 8],
    kinds: [
      ["outlaw", 70, { pts: 50 }],
      ["lady", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 12.4,
    at: [
      [2.6, 0.3],
      [-2.6, 0.3]
    ],
    size: 1.75,
    kinds: crew
  });
};
const riverboatWave = (R, add, c) => {
  const f = BOAT.F;
  const ashore = t =>
    add(
      t,
      R(0, 1) < 0.5 ? "banditRun" : "riflemanRun",
      rush(
        R,
        [
          [-6, f - 3, G + 1.6],
          [-6, 14, G + 0.3],
          [R(-4, 4), R(5, 9), G + 0.3]
        ],
        R(2.6, 3.4) * c.S
      )
    );
  const bottles = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n,
        "w_bottle",
        toss(R, { u: R(-10, 10), f: f - 3.2, h: G + 2.2, vh: R(7, 9) * Math.min(1.2, c.S), vu: R(-2, 2) })
      );
  };
  if (c.x2) {
    for (let k = 0; k < 8; k++) ashore(1 + k * 2.8);
    bottles(6);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.3); j++) ashore(R(1, 22));
  if (k !== 3) bottles(3 + n(2));
  if (k === 2 || k === 5) flyers(["w_crow", "pigeon"], R, add, c, 2 + n(1));
  if (k === 1 || k === 4)
    for (let j = 0; j < 1 + n(1); j++) add(R(2, 22), "w_cart", skim(R, { v: 6, f: 9, h: 0.3, u0: 20 }));
  if (R(0, 1) < 0.3) add(R(2, 18), "ladyRun", cross(R, { u0: -10, u1: 10, f: f - 2.4, h: 1.6, v: 1.5 }));
};

// ---- Level 9: Boot Hill ---------------------------------------------------------------

const BH = { HILL: [0, 30], TREE: [-14, 22] };
function cross_(P, u, f, s = 1, c = 0x8a6a4a) {
  P.add(BOX(0.12 * s, 1.4 * s, 0.1 * s), c, u, G + 0.7 * s, f, 0, 0, (u % 3) * 0.04);
  P.add(BOX(0.7 * s, 0.12 * s, 0.1 * s), c, u, G + 1.05 * s, f);
  P.add(BOX(0.6, 0.15, 1.6), 0x4a3a2a, u, G + 0.05, f + 0.9);
}
function headstone(P, u, f) {
  P.add(BOX(0.7, 0.9, 0.18), 0x8a8a84, u, G + 0.45, f, 0, (u % 2) * 0.1, 0);
  P.add(CYL(0.35, 0.35, 0.18, 10), 0x8a8a84, u, G + 0.9, f, Math.PI / 2, 0, 0, 1, 1, 1);
}
WORLDS.west_boothill = {
  sky: {
    top: "#060a18",
    mid: "#0e1630",
    horizon: "#2a3050",
    ground: "#141a20",
    stars: true,
    planets: [{ az: -15, el: 22, r: 18, colour: "#f4f0e0", light: 0.2, dark: 0.15 }],
    clouds: 4,
    cloud: "rgba(120,130,170,0.35)",
    hills: [{ colour: "#1a2028", height: 6, rough: 2 }],
    seed: 341
  },
  fog: 0x1a2030,
  build(P) {
    const [hu, hf] = BH.HILL;
    P.ground(0x3a3a2a, [{ u: hu, f: hf, r: 14, c: 0x46462e, sx: 1.6, sz: 1 }]);
    P.add(BALL(16, 16), 0x3e3e2c, hu, G - 12, hf, 0, 0, 0, 1.8, 0.95, 1.2);
    // the graves up the hill, crosses and stones, a picket fence round them
    for (let k = 0; k < 26; k++) {
      const u = -16 + (k % 9) * 4 + ((k * 7) % 3) * 0.6;
      const f = 10 + Math.floor(k / 9) * 6 + ((k * 5) % 3);
      if (k % 3 === 1) headstone(P, u, f);
      else cross_(P, u, f, 1 + (k % 4) * 0.1);
    }
    fence(P, -20, 20, 7, 2, 0xd8d0c0);
    P.add(BOX(2.6, 0.2, 0.2), 0x6a5a48, 0, G + 2.4, 7);
    for (const s of [-1, 1]) P.add(BOX(0.25, 2.4, 0.25), 0x6a5a48, s * 1.3, G + 1.2, 7);
    // the hanging tree, its rope; the undertaker's wagon; coffins stood up
    const [tu, tf] = BH.TREE;
    P.add(CYL(0.45, 0.7, 6, 7), 0x2a2018, tu, G + 3, tf);
    for (const [a, l, h] of [
      [0.9, 4, 5],
      [-0.7, 3.2, 4.4],
      [2.4, 2.6, 5.4]
    ])
      P.add(
        CYL(0.12, 0.2, l, 5),
        0x2a2018,
        tu + Math.cos(a) * l * 0.4,
        G + h,
        tf + Math.sin(a) * l * 0.4,
        0,
        -a,
        Math.PI / 2 - 0.5
      );
    P.add(CYL(0.02, 0.02, 2, 4), 0xc8b890, tu + 1.6, G + 4, tf + 0.6);
    P.add(TORUS(0.2, 0.03, 8), 0xc8b890, tu + 1.6, G + 2.9, tf + 0.6);
    wagon(P, 14, 14, true, -0.4);
    for (const [u, f] of [
      [9, 8],
      [10, 8.4]
    ]) {
      P.add(BOX(0.8, 2.0, 0.4), 0x3a2a1a, u, G + 1.0, f, 0, 0, 0.08);
    }
    // the town's lights far off
    for (let k = 0; k < 10; k++) P.add(BOX(3, 2.5, 3), 0x1a1a22, -40 + k * 9, G + 1.25, 80);
    for (let k = 0; k < 14; k++) P.add(BOX(0.4, 0.4, 0.1), 0xffd27a, -40 + k * 6.4, G + 1.6, 78.4);
    P.scatter(30, 2, 60, (u, f, R) => Math.abs(u) > 20 && P.bush(u, f, 0.5 + R() * 0.5, 0x2a3a22), 60);
    for (let k = 0; k < 18; k++) {
      const u = -18 + k * 2.1;
      P.add(BOX(0.6, 0.15, 1.6), 0x4a3a2a, u, G + 0.08, 40 + (k % 2));
      cross_(P, u, 39 + (k % 2), 0.8, 0x6a5a48);
    }
    P.scatter(50, 8, 40, (u, f, R) => P.rock(u, f, 0.3 + R() * 0.4, 0x5a5a4e), 22, 3);
  },
  slots: [],
  cover: null
};
LAYOUTS.west_boothill = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "can", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.34, tint: ["steel", "red"], bank: 3 });
  L.row({ ...fixed, kind: "skull", n: 8, f: 6.8, u0: -14, u1: 14, base: 1.1, size: 0.34, tint: "white", bank: 4 });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 4,
    f: 18,
    u0: -9,
    u1: 9,
    base: 1.6,
    size: 0.4,
    tint: "gold",
    bank: 4,
    rail: true
  });
  L.row({
    ...fixed,
    kind: "skull",
    n: 3,
    f: BH.TREE[1] - 0.6,
    u0: BH.TREE[0] - 1,
    u1: BH.TREE[0] + 1.6,
    base: 2.6,
    size: 0.4,
    tint: "white",
    bank: 3
  });
  L.row({ kind: "wanted", n: 5, f: 30, u0: -8, u1: 8, base: 1.3, size: 0.6, tint: "card", bank: 5, mirror: 1 });
  L.row({ ...fixed, kind: "lantern", n: 4, f: 76, u0: -20, u1: 20, base: 1.4, size: 0.6, tint: "gold", bank: 4 });
  const graves = [
    ["outlaw", 30, { pts: 25 }],
    ["gunslinger", 35],
    ["bandit", 25],
    ["padre", 10, { dont: true }]
  ];
  L.pops({
    fixed: true,
    peek: true,
    f: 13.2,
    at: [
      [-12, 0],
      [12, 0]
    ],
    size: 1.8,
    kinds: graves
  });
  L.pops({
    fixed: true,
    f: 19.4,
    at: [
      [-6, 0.4],
      [6, 0.4]
    ],
    size: 1.8,
    kinds: graves
  });
  L.pops({
    fixed: true,
    f: 25.4,
    at: [
      [-2, 0.9],
      [2, 0.9]
    ],
    size: 1.8,
    kinds: graves
  });
  L.pops({
    fixed: true,
    f: 7.6,
    at: [[0, 0]],
    size: 1.8,
    kinds: [
      ["outlaw", 50, { pts: 50 }],
      ["padre", 25, { dont: true }],
      ["townsman", 25, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 13.4,
    at: [[14, 0.2]],
    size: 1.8,
    kinds: [
      ["gunslinger", 70],
      ["padre", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 37.6,
    at: [
      [-8, 1.2],
      [8, 1.2]
    ],
    size: 1.8,
    period: [5, 8],
    kinds: graves
  });
};
const boothillWave = (R, add, c) => {
  const grave = t =>
    add(
      t,
      pick(R, ["banditRun", "bandit2Run", "riflemanRun"]),
      rush(
        R,
        [
          [pick(R, [-12, -6, 6, 12]), R(14, 26), G + 0.3],
          [R(-4, 4), R(8.5, 10), G],
          [R(-5, 5), R(4, 6), G]
        ],
        R(2.8, 3.6) * c.S
      )
    );
  if (c.x2) {
    // midnight: the whole gang among the graves
    for (let k = 0; k < 9; k++) grave(1 + k * 2.6);
    flyers(["w_bat", "w_crow"], R, add, c, 6);
    for (let k = 0; k < 3; k++) add(2 + k * 7, "coyote", run(R, { v: R(10, 13) * c.S, f: R(30, 40) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) grave(R(1, 22));
  if (k !== 2) flyers(["w_bat", "w_crow"], R, add, c, 2 + n(1.5));
  if (k === 2 || k === 4)
    for (let j = 0; j < 2 + n(1); j++) add(R(1, 22), "coyote", run(R, { v: R(10, 13) * c.S, f: R(30, 44) }));
  if (k === 1 || k === 5) add(R(2, 20), "tumbleweed", across(R, { v: R(4, 6), h: G + 0.5, f: R(8, 20), amp: 0.3 }));
  if (R(0, 1) < 0.3) add(R(2, 18), "padreRun", cross(R, { u0: -10, u1: 10, f: R(8, 12), v: 1.2 }));
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
    if (o.water) v += (lp2 - lp) * o.water;
    if (o.hum) v += Math.sin(2 * Math.PI * o.hum[0] * t) * o.hum[1];
    if (o.crickets)
      v += Math.sin(2 * Math.PI * 4400 * t) * Math.max(0, Math.sin(t * 2 * Math.PI * 3)) ** 4 * o.crickets;
    if (o.chuff) {
      const y = (t * 2.2) % 1;
      v += x * o.chuff * Math.exp(-y * 9);
    }
    if (o.clank) {
      const y = (t * 1.25) % 1;
      if (y < 0.04) v += Math.sin(2 * Math.PI * 820 * t) * o.clank * (1 - y / 0.04);
    }
    if (o.howl) {
      const y = t % 8;
      if (y > 5 && y < 6.8) {
        const e = (y - 5) / 1.8;
        v += Math.sin(2 * Math.PI * (600 + 500 * Math.sin(e * Math.PI)) * t) * o.howl * Math.sin(e * Math.PI);
      }
    }
    d[i] += v;
  }
}
Object.assign(AMBIENCE, {
  west_train(d, sr, R) {
    bed(d, sr, R, { wind: 1.4, chuff: 0.25, hum: [40, 0.03] });
  },
  west_mine(d, sr, R) {
    bed(d, sr, R, { wind: 1.0, clank: 0.25, water: 0.25 });
  },
  west_canyon(d, sr, R) {
    bed(d, sr, R, { wind: 2.4, howl: 0.02 });
  },
  west_riverboat(d, sr, R) {
    bed(d, sr, R, { wind: 0.8, water: 0.6, crickets: 0.015, chuff: 0.1 });
  },
  west_boothill(d, sr, R) {
    bed(d, sr, R, { wind: 2.0, crickets: 0.02, howl: 0.04 });
  }
});

// ---- The levels ----------------------------------------------------------------------

export const WEST_MORE = {
  kinds,
  levels: [
    {
      world: "west_train",
      name: "THE TRAIN ROBBERY",
      story: "Villa's men have stopped the express",
      music: "",
      amb: "west_train",
      legend: "RIDERS 75 · DYNAMITE: SHOOT IT BEFORE IT LANDS · DON'T SHOOT THE PASSENGERS",
      wave: trainWave,
      title: (w, x2) => (x2 ? "THEY'RE BLOWING THE SAFE · DOUBLE POINTS" : null)
    },
    {
      world: "west_mine",
      name: "THE GOLD MINE",
      story: "They're hiding out in the Lucky Strike diggings",
      music: "",
      amb: "west_mine",
      legend: "ORE CARTS 75 · THE MILL BELL 50 · DYNAMITE · DON'T SHOOT THE MINERS",
      wave: mineWave,
      title: (w, x2) => (x2 ? "FIRE IN THE HOLE! · DOUBLE POINTS" : null)
    },
    {
      world: "west_canyon",
      name: "AMBUSH IN THE CANYON",
      story: "Guard the stage through Diablo Canyon",
      music: "",
      amb: "west_canyon",
      legend: "RIDERS 75 · RIFLEMEN ON THE LEDGES · DON'T SHOOT THE PASSENGERS",
      wave: canyonWave,
      title: (w, x2) => (x2 ? "THE WHOLE GANG RIDES DOWN · DOUBLE POINTS" : null)
    },
    {
      world: "west_riverboat",
      name: "THE RIVERBOAT",
      story: "Villa's paymaster is aboard the Natchez Belle",
      music: "",
      amb: "west_riverboat",
      legend: "CARDS AND BOTTLES IN BANKS · THE OUTLAW 50 · DON'T SHOOT THE LADIES OR THE BARKEEP",
      wave: riverboatWave,
      title: (w, x2) => (x2 ? "EVERY GUN ON THE BOAT · DOUBLE POINTS" : null)
    },
    {
      world: "west_boothill",
      name: "BOOT HILL AT MIDNIGHT",
      story: "They're waiting for you among the graves",
      music: "",
      amb: "west_boothill",
      legend: "WANTED POSTERS IN A BANK · COYOTES 75 · DON'T SHOOT THE PADRE",
      wave: boothillWave,
      title: (w, x2) => (x2 ? "THE MIDNIGHT SHOWDOWN · DOUBLE POINTS" : null)
    }
  ]
};
