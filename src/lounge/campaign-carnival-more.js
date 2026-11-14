import * as THREE from "three";
import { GROUND, BOX, CYL, BALL, CONE, TORUS, SLAB, GEO, WORLDS, CARDS, CARD_SIZE, AMBIENCE } from "./shoots-art";
import { LAYOUTS, PERSON, PLATE_SOUND } from "./plates";
import { gunman, thing, bird, DONT, cross, toss, across, float, pick, flyers } from "./shoot-paths";
import { painter, arms, legs, kit, asGeo, rush, bed } from "./campaign-kit";

// Carnival night's five more levels (Jay, 2026-10-31: "add five more levels
// to each set"), between the Ferris wheel and the grand finale:
//   5 THE FUNHOUSE      crooked rooms, a spinning barrel, clown faces, the
//                       trapdoors; clowns and skeletons out of every door
//   6 THE PIER          the boardwalk out over the sea: the games, a wheel,
//                       gulls and crabs, boats
//   7 THE MAGIC SHOW    the stage: rabbits out of hats, doves, cards, the
//                       magician and his assistant (don't)
//   8 THE CIRCUS TRAIN  the circus train arriving at night: cages, clowns
//                       on the roofs, the animals getting loose
//   9 THE BALLOON RACE  hot-air balloons over the fairground at dawn

const G = GROUND;
const SKIN = "#f0d0b0";

Object.assign(CARDS, {
  carnival_magician: (c, W) => {
    const p = painter(c, W);
    p.poly([18, 46, 82, 46, 90, 190, 10, 190], "#8a1a2a");
    legs(p, "#141414", "#0a0a0a");
    p.poly([30, 46, 70, 46, 68, 110, 32, 110], "#141414");
    p.poly([42, 46, 58, 46, 55, 80, 45, 80], "#f4f0e8", 1.2);
    p.poly([46, 48, 54, 48, 52, 54, 48, 54], "#c0182a", 0);
    arms(p, "#141414", "#f4f0e8");
    p.line([76, 104, 90, 84], 2.5, "#141414");
    p.ell(90, 84, 2, 2, "#f4f0e8", 0);
    p.ell(50, 30, 12, 14, SKIN);
    p.line([44, 36, 56, 36], 2, "#2a1a10");
    p.ell(45, 28, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(55, 28, 1.6, 1.6, "#1a1a1a", 0);
    p.poly([36, 18, 64, 18, 66, 14, 34, 14], "#141414", 1.2);
    p.poly([40, 14, 40, -6, 60, -6, 60, 14], "#141414");
    p.poly([40, 8, 60, 8, 60, 11, 40, 11], "#c0182a", 0);
  },
  carnival_assistant: (c, W) => {
    const p = painter(c, W);
    legs(p, SKIN, "#c0182a");
    p.poly([32, 46, 68, 46, 70, 108, 30, 108], "#c0182a");
    for (let k = 0; k < 14; k++) p.ell(34 + ((k * 13) % 32), 50 + ((k * 29) % 56), 1, 1, "#fff0a0", 0);
    p.poly([19, 56, 29, 52, 22, 20, 14, 22], SKIN);
    p.poly([71, 52, 81, 56, 86, 22, 78, 20], SKIN);
    p.ell(50, 28, 12, 14, SKIN);
    p.ell(45, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(55, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(50, 34, 2.4, 1.6, "#c0182a", 0);
    p.poly([36, 30, 37, 12, 50, 8, 63, 12, 64, 30, 60, 18, 40, 18], "#2a1a10", 1.4);
    for (let k = 0; k < 3; k++) p.line([46 + k * 4, 8, 44 + k * 6, -6], 2, "#e8e0f8");
  },
  carnival_conductor: (c, W) => {
    const p = painter(c, W);
    legs(p, "#1a2a5a", "#141414");
    p.poly([28, 46, 72, 46, 72, 112, 28, 112], "#1a2a5a");
    for (const y of [56, 68, 80, 92]) p.ell(50, y, 1.6, 1.6, "#c8a040", 0.6);
    arms(p, "#1a2a5a", SKIN);
    p.ell(50, 30, 12, 14, SKIN);
    p.line([44, 36, 56, 36], 2.4, "#6a4a2a");
    p.ell(45, 28, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(55, 28, 1.6, 1.6, "#1a1a1a", 0);
    p.poly([36, 18, 38, 8, 62, 8, 64, 18], "#1a2a5a");
    p.poly([34, 18, 66, 18, 64, 22, 36, 22], "#141414", 1);
  }
});
const PEOPLE = { carnival_magician: [1.1, 2.0], carnival_assistant: [0.85, 1.7], carnival_conductor: [0.9, 1.8] };
Object.assign(CARD_SIZE, PEOPLE);
for (const k of Object.keys(PEOPLE)) PERSON.add(k);
PLATE_SOUND.carnival_balloon = "pop";

// A hot-air balloon: the striped envelope, ropes, the basket.
function hotAir(add, c1, c2) {
  for (let k = 0; k < 8; k++) {
    const g = new THREE.SphereGeometry(3, 4, 10, (k / 8) * Math.PI * 2, Math.PI / 4, 0, Math.PI * 0.75);
    add(g, k % 2 ? c1 : c2, 0, 3.6, 0);
  }
  add(CONE(1.6, 1.8, 10), c1, 0, 0.9, 0, Math.PI, 0, 0);
  for (let k = 0; k < 4; k++)
    add(CYL(0.02, 0.02, 1.6, 3), 0x3a2a1a, Math.cos(k * 1.57) * 0.5, -0.4, Math.sin(k * 1.57) * 0.5);
  add(BOX(1.1, 0.8, 1.1), 0x8a6a3a, 0, -1.4, 0);
}
GEO.carnival_hotairA = asGeo(add => hotAir(add, 0xe8344a, 0xf2c230));
GEO.carnival_hotairB = asGeo(add => hotAir(add, 0x2f6fe8, 0xf4efe2));
GEO.carnival_hotairC = asGeo(add => hotAir(add, 0x3ab54a, 0xe86a1a));
GEO.carnival_hat = asGeo(add => {
  add(CYL(0.13, 0.13, 0.28, 12), 0x141414, 0, 0.14, 0);
  add(CYL(0.22, 0.22, 0.02, 14), 0x141414, 0, 0, 0);
  add(CYL(0.135, 0.135, 0.05, 12), 0xc0182a, 0, 0.05, 0);
});

const kinds = {
  carnival_hotairA: {
    ...thing("carnival_hotairA", 0, 50, 2.6, "shatter", "up", "pop"),
    hy: 3.6,
    name: "HOT-AIR BALLOON · 50"
  },
  carnival_hotairB: { ...thing("carnival_hotairB", 0, 50, 2.6, "shatter", "up", "pop"), hy: 3.6 },
  carnival_hotairC: { ...thing("carnival_hotairC", 0, 50, 2.6, "shatter", "up", "pop"), hy: 3.6 },
  carnival_topHat: thing("carnival_hat", 0, 25, 0.25, "shatter", "spin", "boing"),
  carnival_dove: bird("dove", 25, 0.3, "chirp"),
  carnival_gull: bird("hostage_gull", 25, 0.3, "chirp"),
  carnival_rabbitRun: {
    pts: 100,
    r: 0.3,
    hy: 0.25,
    dies: "fall",
    art: { plate: "rabbit", tint: 0xf4efe2, h: 0.5 },
    face: "slide",
    sound: "boing"
  },
  carnival_crab: {
    pts: 100,
    r: 0.3,
    hy: 0.2,
    dies: "fall",
    art: { plate: "duck_crab", tint: 0xe86a3a, h: 0.4 },
    face: "slide",
    sound: "clank"
  },
  carnival_lionLoose: {
    pts: 75,
    r: 0.7,
    hy: 0.6,
    dies: "fall",
    art: { plate: "lion", tint: 0xe8a040, h: 1.2 },
    face: "slide",
    sound: "roar"
  },
  carnival_clownRun: { ...gunman("carnival_clown", 1.8), pts: 50, arrive: "boing", lose: "PIE IN THE FACE!" },
  carnival_magicianRun: {
    ...gunman("carnival_magician", 2.0),
    pts: -25,
    sound: "wrong",
    ...DONT,
    name: "THE GREAT MARVELLO! DON'T SHOOT!",
    arrive: undefined
  },
  carnival_assistantRun: {
    ...gunman("carnival_assistant", 1.7),
    pts: -25,
    sound: "wrong",
    ...DONT,
    name: "HIS ASSISTANT! DON'T SHOOT!",
    arrive: undefined
  },
  carnival_cardUp: thing("card", 0xc0182a, 25, 0.25, "fall", "spin", "thud"),
  carnival_cardUpB: thing("card", 0x151515, 25, 0.25, "fall", "spin", "thud")
};

// ---- Level 5: the funhouse ---------------------------------------------------------

const FUN = { W: 14, FRONT: -11, BACK: 48, CEIL: 9, DOORS: [5, 13, 21, 29, 37] };
WORLDS.carnival_funhouse = {
  sky: { top: "#1a0a2a", mid: "#2a1040", horizon: "#3a1850", ground: "#1a0a2a", seed: 601 },
  fog: 0x3a1a4a,
  build(P) {
    const F = FUN;
    const len = F.BACK + 0.3 - F.FRONT;
    const mid = (F.FRONT + F.BACK + 0.3) / 2;
    // a checkered floor, tilted walls, a striped ceiling
    for (let k = 0; k < 14; k++) P.add(SLAB(2, 0.06, len), k % 2 ? 0xf4efe2 : 0x1a1a1a, -13 + k * 2, G - 0.03, mid);
    for (let f = F.FRONT; f < F.BACK; f += 2)
      P.add(BOX(2 * F.W, 0.07, 1), Math.round(f / 2) % 2 ? 0xf4efe2 : 0x1a1a1a, 0, G - 0.02, f + 0.5);
    for (const s of [-1, 1]) {
      P.add(
        SLAB(0.3, F.CEIL + 1, len),
        s > 0 ? 0x8a2a8a : 0x2a8a8a,
        s * (F.W + 0.4),
        G + F.CEIL / 2,
        mid,
        0,
        0,
        s * 0.12
      );
      for (const f of F.DOORS) {
        P.add(BOX(0.1, 3.0, 2.0), 0x0a0a0a, s * (F.W - 0.5), G + 1.5, f, 0, 0, s * 0.12);
        // a clown face over each door
        P.add(BALL(0.9, 10), 0xf4efe2, s * (F.W - 0.3), G + 4.6, f, 0, 0, 0, 0.3, 1, 1);
        P.add(BALL(0.25, 8), 0xe8344a, s * (F.W - 0.55), G + 4.5, f);
        P.add(BALL(0.15, 6), 0x1a1a1a, s * (F.W - 0.5), G + 4.9, f - 0.35);
        P.add(BALL(0.15, 6), 0x1a1a1a, s * (F.W - 0.5), G + 4.9, f + 0.35);
        P.add(TORUS(0.4, 0.06, 10), 0xe8344a, s * (F.W - 0.45), G + 4.2, f, 0, Math.PI / 2, 0);
      }
    }
    for (let f = F.FRONT; f < F.BACK; f += 1.5)
      P.add(BOX(2 * F.W, 0.2, 0.75), [0xe8344a, 0xf2c230, 0x2f6fe8][Math.round(f / 1.5) % 3], 0, G + F.CEIL, f);
    // the spinning barrel across the middle, the tilted room at the back
    P.add(new THREE.CylinderGeometry(3, 3, 8, 16, 1, true), 0xf2c230, 0, G + 3, 18, 0, 0, Math.PI / 2);
    for (let k = 0; k < 8; k++)
      P.add(BOX(8.1, 0.3, 0.3), 0xe8344a, 0, G + 3 + Math.sin(k * 0.785) * 3, 18 + Math.cos(k * 0.785) * 3);
    P.add(BOX(2 * F.W + 0.6, F.CEIL + 0.3, 0.3), 0x6a2a8a, 0, G + F.CEIL / 2, F.BACK + 0.15);
    P.add(BOX(10, 4, 0.2), 0xf2c230, 0, G + 2.2, F.BACK - 0.5, 0, 0, 0.15);
    P.add(BOX(1.8, 2.6, 0.2), 0x0a0a0a, -2, G + 1.4, F.BACK - 0.7, 0, 0, 0.15);
    // big dice, a giant clown head, stars on strings
    for (const [u, f, s] of [
      [-8, 6, 1.2],
      [8, 8, 1],
      [-6, 26, 1.4]
    ]) {
      P.add(BOX(s, s, s), 0xf4efe2, u, G + s / 2, f, 0, u, 0);
      P.add(BALL(s * 0.12, 6), 0x1a1a1a, u, G + s + 0.01, f);
    }
    P.add(BALL(2.2, 14), 0xf4efe2, 9, G + 2.2, 28);
    P.add(BALL(0.5, 8), 0xe8344a, 9, G + 2.2, 26);
    P.add(TORUS(1.0, 0.15, 14), 0xe8344a, 9, G + 1.4, 26.2);
    P.add(CONE(1.2, 1.8, 10), 0x3ab54a, 9, G + 4.6, 28);
    for (let k = 0; k < 12; k++) {
      P.add(CYL(0.01, 0.01, 1.5, 3), 0x8a8a8a, -10 + k * 1.8, G + F.CEIL - 0.8, 10 + (k % 3) * 6);
      P.add(BALL(0.2, 6), 0xf2c230, -10 + k * 1.8, G + F.CEIL - 1.6, 10 + (k % 3) * 6);
    }
    // the hall of mirrors at the far end: tall panes angled every way
    for (let k = 0; k < 10; k++) {
      const u = -9 + k * 2;
      P.add(BOX(1.6, 4, 0.08), 0xb8d0e0, u, G + 2, 42 + (k % 3), 0, 0.3 * Math.sin(k * 2.1), 0);
      P.add(BOX(1.7, 0.15, 0.12), 0xc8a040, u, G + 4.05, 42 + (k % 3), 0, 0.3 * Math.sin(k * 2.1), 0);
    }
  },
  slots: [],
  cover: null
};
LAYOUTS.carnival_funhouse = L => {
  const F = FUN;
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: "star",
    n: 6,
    f: 3,
    u0: -4.5,
    u1: 4.5,
    base: 0.8,
    size: 0.36,
    tint: "yellow",
    bank: 3,
    rail: true
  });
  L.row({ ...fixed, kind: "carnival_pumpkin", n: 4, f: 11, u0: -4, u1: 4, size: 0.42, tint: "orange", bank: 4 });
  L.row({
    ...fixed,
    kind: "carnival_balloon",
    n: 6,
    f: 18 - 3.4,
    u0: -3,
    u1: 3,
    base: 6.4,
    size: 0.4,
    tint: ["red", "blue"],
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "carnival_bat",
    n: 4,
    f: F.BACK - 0.8,
    u0: -5,
    u1: 5,
    base: 4.8,
    size: 0.5,
    tint: "white",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "star",
    n: 4,
    f: 24,
    u0: -9,
    u1: 9,
    base: 1.6,
    size: 0.42,
    tint: "gold",
    bank: 4,
    rail: true
  });
  for (const f of F.DOORS)
    L.pops({
      fixed: true,
      f,
      at: [
        [-(F.W - 1.0), 0],
        [F.W - 1.0, 0]
      ],
      size: 1.8,
      busy: 0.6,
      kinds: [
        ["carnival_clown", 45],
        ["carnival_skeleton", 25],
        ["carnival_ghost", 15],
        ["carnival_kid", 15, { dont: true }]
      ]
    });
  L.pops({
    fixed: true,
    f: F.BACK - 0.9,
    at: [[-2, 0.1]],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["carnival_ringmaster", 20, { pts: 250 }],
      ["carnival_clown", 80, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 18.5,
    at: [
      [-1.6, 0.5],
      [1.6, 0.5]
    ],
    size: 1.6,
    kinds: [
      ["carnival_clown", 70],
      ["carnival_kid", 30, { dont: true }]
    ]
  });
  L.row({ ...fixed, kind: "carnival_ghost", n: 4, f: 46, u0: -6, u1: 6, base: 1.5, size: 0.7, tint: "white", bank: 4 });
  L.pops({
    fixed: true,
    f: 40.6,
    at: [
      [-5, 0],
      [5, 0]
    ],
    size: 1.8,
    kinds: [
      ["carnival_skeleton", 50, { pts: 50 }],
      ["carnival_clown", 50, { pts: 50 }]
    ]
  });
};
const funhouseWave = (R, add, c) => {
  const F = FUN;
  const door = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      "carnival_clownRun",
      rush(
        R,
        [
          [s * (F.W - 1), pick(R, F.DOORS), G],
          [s * R(2, 8), R(4, 9), G]
        ],
        R(3, 4.5) * c.S
      )
    );
  };
  const juggle = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n,
        pick(R, ["carnival_ballR", "carnival_ballB", "carnival_ballY", "carnival_pin"]),
        toss(R, { u: R(-8, 8), f: R(6, 26), h: G + 1, vh: R(7, 9) * Math.min(1.2, c.S), vu: R(-2, 2) })
      );
  };
  if (c.x2) {
    for (let k = 0; k < 10; k++) door(1 + k * 2.3);
    juggle(8);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.6); j++) door(R(1, 22));
  if (k !== 2) juggle(3 + n(2));
  if (k === 2 || k === 5) flyers(["carnival_bat", "carnival_bat"], R, add, c, 2 + n(1));
  if (k === 1 || k === 4)
    for (let j = 0; j < 2 + n(1); j++)
      add(R(2, 22), "carnival_ghost", float(R, { u: R(-10, 10), f: R(8, 28), v: R(1.4, 2.2), h: G + 0.5 }));
  if (R(0, 1) < 0.3) add(R(2, 18), "carnival_kid", cross(R, { u0: -9, u1: 9, f: R(6, 10), v: 2 }));
};

// ---- Level 6: the pier ----------------------------------------------------------------

const PIER = { W: 7, END: 46, WHEEL: [-10, 30] };
WORLDS.carnival_pier = {
  sky: {
    top: "#2a3a7a",
    mid: "#c86a8a",
    horizon: "#f8b878",
    ground: "#2a4a6a",
    sun: [10, 4, "#ffd27a", 16],
    clouds: 8,
    cloud: "rgba(255,170,150,0.45)",
    seed: 611
  },
  fog: 0xc88a8a,
  build(P) {
    P.ground(0x2a4a6a, [{ u: 0, f: 2, r: 8, c: 0xd8c090, sx: 4, sz: 0.4 }]);
    // the pier: deck, rails, legs into the sea, lamps
    P.add(SLAB(2 * PIER.W, 0.3, PIER.END + 10), 0x8a6a46, 0, G + 1.0, (PIER.END - 10) / 2);
    for (let u = -PIER.W; u <= PIER.W; u += 1)
      P.add(SLAB(0.04, 0.02, PIER.END + 10), 0x5a4030, u, G + 1.16, (PIER.END - 10) / 2);
    for (const s of [-1, 1]) {
      P.add(SLAB(0.08, 0.08, PIER.END + 10), 0xf4efe2, s * PIER.W, G + 2.1, (PIER.END - 10) / 2);
      for (let f = -8; f < PIER.END; f += 2) P.add(BOX(0.06, 1.0, 0.06), 0xf4efe2, s * PIER.W, G + 1.6, f);
      for (let f = -8; f < PIER.END; f += 4) P.add(CYL(0.2, 0.2, 3, 6), 0x3a2a1a, s * (PIER.W - 0.3), G - 0.4, f);
      for (let f = 0; f < PIER.END; f += 8) {
        P.add(CYL(0.06, 0.08, 4, 5), 0x2a2a2a, s * (PIER.W - 0.3), G + 3.1, f);
        P.add(BALL(0.25, 8), 0xffe8a0, s * (PIER.W - 0.3), G + 5.1, f);
      }
    }
    // game booths along the pier, the wheel off its side, the pavilion at the end
    for (const [u, f, c] of [
      [-4.5, 10, 0xe8344a],
      [4.5, 14, 0x2f6fe8],
      [-4.5, 20, 0xf2c230],
      [4.5, 24, 0x3ab54a]
    ]) {
      P.add(BOX(3, 2.4, 2.4), 0xf4efe2, u, G + 2.35, f);
      P.add(BOX(3.4, 0.3, 2.8), c, u, G + 3.7, f, 0.15, 0, 0);
      P.add(BOX(2.6, 1.0, 0.1), 0x2a1a10, u, G + 2.4, f - 1.22);
    }
    const [wu, wf] = PIER.WHEEL;
    P.add(TORUS(7, 0.18, 32), 0xf4efe2, wu, G + 9, wf, 0, Math.PI / 2, 0);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      P.add(BOX(0.1, 7, 0.1), 0xf4efe2, wu, G + 9 + Math.sin(a) * 3.5, wf + Math.cos(a) * 3.5, a, 0, 0);
      P.add(
        BOX(0.9, 0.8, 0.9),
        [0xe8344a, 0xf2c230, 0x2f6fe8, 0x3ab54a][k % 4],
        wu,
        G + 9 + Math.sin(a) * 7 - 0.7,
        wf + Math.cos(a) * 7
      );
    }
    for (const e of [-1, 1]) P.add(BOX(0.3, 10, 0.3), 0x8a8a8a, wu, G + 4.5, wf + e * 2, e * 0.3, 0, 0);
    P.add(BOX(12, 4, 6), 0xf4efe2, 0, G + 3.2, PIER.END + 2);
    P.add(CONE(7, 3, 4), 0xe8344a, 0, G + 6.7, PIER.END + 2, 0, Math.PI / 4, 0, 1, 1, 0.6);
    // the sea, boats, the beach behind
    P.scatter(
      60,
      6,
      90,
      (u, f, R) => Math.abs(u) > PIER.W + 1 && P.add(BOX(2 + R() * 3, 0.05, 0.3), 0x5a7a9a, u, G + 0.03, f),
      80
    );
    for (const [u, f] of [
      [18, 24],
      [-24, 40],
      [26, 52]
    ]) {
      P.add(BOX(3, 0.8, 1.2), 0xf4efe2, u, G + 0.2, f);
      P.add(BOX(0.08, 3, 0.08), 0x8a8a8a, u, G + 1.8, f);
      P.add(CONE(1, 2.6, 3), 0xe8344a, u + 0.6, G + 1.9, f, 0, 0, 0, 0.1, 1, 1);
    }
  },
  slots: [],
  cover: null
};
LAYOUTS.carnival_pier = L => {
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: "duck_crab",
    n: 6,
    f: 3,
    u0: -4.5,
    u1: 4.5,
    base: 1.16,
    size: 0.36,
    tint: "orange",
    bank: 3
  });
  for (const [u, f] of [
    [-4.5, 10],
    [4.5, 14],
    [-4.5, 20],
    [4.5, 24]
  ])
    L.row({
      ...fixed,
      kind: ["bottle", "star", "duck"],
      n: 3,
      f: f - 1.3,
      u0: u - 0.8,
      u1: u + 0.8,
      base: 2.0,
      size: 0.3,
      tint: ["green", "gold", "yellow"],
      bank: 3
    });
  L.row({
    ...fixed,
    kind: "carnival_balloon",
    n: 4,
    f: PIER.END - 1.2,
    u0: -4,
    u1: 4,
    base: 4.8,
    size: 0.6,
    tint: ["red", "blue", "yellow", "green"],
    bank: 4
  });
  L.row({ ...fixed, kind: "duck_gull", n: 4, f: 34, u0: -6.4, u1: 6.4, base: 2.2, size: 0.4, tint: "white", bank: 4 });
  L.pops({
    fixed: true,
    f: 10.6,
    at: [
      [-4.5, 1.15],
      [4.5, 1.15]
    ],
    size: 1.75,
    kinds: [
      ["carnival_clown", 70],
      ["carnival_kid", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 20.6,
    at: [
      [-4.5, 1.15],
      [4.5, 1.15]
    ],
    size: 1.75,
    kinds: [
      ["carnival_clown", 60],
      ["carnival_acrobat", 15, { dont: true }],
      ["carnival_kid", 25, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: PIER.END - 1,
    at: [
      [-3, 1.15],
      [3, 1.15]
    ],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["carnival_clown", 80, { pts: 50 }],
      ["carnival_ringmaster", 20, { pts: 250 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 14.6,
    at: [
      [-4.5, 1.15],
      [4.5, 1.15]
    ],
    size: 1.75,
    kinds: [
      ["carnival_clown", 70],
      ["carnival_kid", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 28,
    at: [
      [-3.8, 1.15],
      [3.8, 1.15]
    ],
    size: 1.75,
    kinds: [
      ["carnival_clown", 70],
      ["carnival_acrobat", 30, { dont: true }]
    ]
  });
};
const pierWave = (R, add, c) => {
  const crab = t =>
    add(
      t,
      "carnival_crab",
      cross(R, {
        u0: pick(R, [-1, 1]) * (PIER.W - 0.5),
        u1: R(-3, 3),
        f: R(4, 30),
        h: 1.16,
        v: R(1.5, 2.5) * c.S,
        stop: 2
      })
    );
  if (c.x2) {
    flyers(["carnival_gull", "carnival_gull"], R, add, c, 10);
    for (let k = 0; k < 6; k++) crab(1 + k * 3.5);
    for (let k = 0; k < 4; k++)
      add(
        2 + k * 5,
        "carnival_clownRun",
        rush(
          R,
          [
            [pick(R, [-3, 3]), PIER.END - 1, G + 1.15],
            [R(-4, 4), R(5, 9), G + 1.15]
          ],
          R(3, 4) * c.S
        )
      );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  flyers(["carnival_gull", "carnival_gull"], R, add, c, 2 + n(2));
  for (let j = 0; j < 1 + n(1.4); j++) crab(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++)
    add(
      R(1, 22),
      "carnival_clownRun",
      rush(
        R,
        [
          [pick(R, [-4.5, 4.5]), pick(R, [10.6, 20.6]), G + 1.15],
          [R(-4, 4), R(4, 7), G + 1.15]
        ],
        R(3, 4) * c.S
      )
    );
  if (k === 1 || k === 4)
    for (let j = 0; j < 3 + n(2); j++)
      add(
        R(1, 24),
        pick(R, ["balloonR", "balloonB", "balloonY"]),
        float(R, { u: R(-8, 8), f: R(10, 40), v: R(1.4, 2.4), h: G + 1.5 })
      );
  if (R(0, 1) < 0.3) add(R(2, 18), "carnival_kid", cross(R, { u0: -5, u1: 5, f: R(6, 9), h: 1.15, v: 2 }));
};

// ---- Level 7: the magic show --------------------------------------------------------------

const MAG = { W: 13, FRONT: -11, BACK: 50, CEIL: 12, STAGE: 30, SH: 1.2 };
WORLDS.carnival_magic = {
  sky: { top: "#100810", mid: "#180c18", horizon: "#201020", ground: "#100810", seed: 621 },
  fog: 0x2a1020,
  build(P) {
    const M = MAG;
    const len = M.BACK + 0.3 - M.FRONT;
    const mid = (M.FRONT + M.BACK + 0.3) / 2;
    P.add(SLAB(2 * M.W + 0.6, 0.06, len), 0x3a1a1a, 0, G - 0.03, mid);
    for (const s of [-1, 1]) {
      P.add(SLAB(0.3, M.CEIL + 0.3, len), 0x5a1a2a, s * (M.W + 0.15), G + M.CEIL / 2, mid);
      for (let f = -6; f < M.STAGE; f += 4) P.add(BOX(0.4, 0.4, 0.4), 0xffd27a, s * (M.W - 0.3), G + 4, f);
    }
    P.add(SLAB(2 * M.W + 0.6, 0.3, len), 0x2a0e14, 0, G + M.CEIL + 0.15, mid);
    // rows of seats (empty) between you and the stage
    for (let f = 2; f < M.STAGE - 3; f += 1.8)
      for (let u = -10; u <= 10; u += 1.2) if (Math.abs(u) > 1.2) P.add(BOX(0.9, 0.9, 0.7), 0x8a1a2a, u, G + 0.45, f);
    // the stage, the proscenium arch, the curtains, the footlights
    P.add(BOX(2 * M.W, M.SH, M.BACK - M.STAGE), 0x4a2a1a, 0, G + M.SH / 2, (M.STAGE + M.BACK) / 2);
    for (let k = 0; k < 14; k++) P.add(BALL(0.12, 6), 0xffe8a0, -9.75 + k * 1.5, G + M.SH + 0.1, M.STAGE + 0.2);
    for (const s of [-1, 1]) {
      P.add(BOX(2.6, M.CEIL, 0.6), 0xc8a040, s * (M.W - 1.3), G + M.CEIL / 2, M.STAGE);
      for (let k = 0; k < 5; k++)
        P.add(
          BOX(0.6, M.CEIL - 2, 0.3),
          0xa81a2a,
          s * (M.W - 3 - k * 0.6),
          G + M.SH + (M.CEIL - 2) / 2,
          M.STAGE + 0.6 + k * 0.05
        );
    }
    P.add(BOX(2 * M.W, 2.2, 0.6), 0xc8a040, 0, G + M.CEIL - 1.1, M.STAGE);
    P.add(BOX(2 * M.W, M.CEIL, 0.3), 0x1a0a1a, 0, G + M.CEIL / 2, M.BACK);
    // the props: the cabinet, the table with the hat, the hoop of fire, the big wheel
    P.add(BOX(1.6, 3, 1.2), 0x2a1a6a, -5, G + M.SH + 1.5, M.STAGE + 4);
    for (let k = 0; k < 5; k++) P.add(BALL(0.1, 6), 0xf2c230, -5 + (k - 2) * 0.3, G + M.SH + 2.6, M.STAGE + 3.38);
    P.add(CYL(0.6, 0.6, 0.05, 14), 0x1a1a1a, 0, G + M.SH + 1.0, M.STAGE + 3);
    P.add(CYL(0.06, 0.08, 1.0, 6), 0xc8a040, 0, G + M.SH + 0.5, M.STAGE + 3);
    P.add(TORUS(1.2, 0.1, 16), 0xff8a2a, 5, G + M.SH + 1.5, M.STAGE + 4);
    P.add(CYL(1.6, 1.6, 0.15, 20), 0xf4efe2, 8.5, G + M.SH + 2.2, M.STAGE + 6, Math.PI / 2);
    for (let k = 0; k < 8; k++)
      P.add(BOX(3.2, 0.1, 0.18), k % 2 ? 0xe8344a : 0x1a1a1a, 8.5, G + M.SH + 2.2, M.STAGE + 5.9, 0, 0, k * 0.39);
    P.scatter(
      30,
      M.STAGE + 1,
      M.BACK - 1,
      (u, f, R) => P.add(BALL(0.08, 5), 0xfff0a0, u, G + M.CEIL - 1 - R() * 3, f),
      M.W - 2
    );
    // the painted backdrop far back: a starry night, a crescent moon
    P.add(BOX(20, 9, 0.1), 0x1a1a4a, 0, G + M.SH + 4.6, M.BACK - 0.4);
    P.add(CYL(1.6, 1.6, 0.1, 16), 0xf2e2a0, 5, G + M.SH + 7, M.BACK - 0.5, Math.PI / 2);
    P.add(CYL(1.4, 1.4, 0.12, 16), 0x1a1a4a, 5.7, G + M.SH + 7.3, M.BACK - 0.55, Math.PI / 2);
    P.scatter(
      40,
      2,
      M.STAGE - 3,
      (u, f) => Math.abs(u) > 1.2 && P.add(BALL(0.18, 6), 0x5a0a1a, u, G + 1.0, f),
      M.W - 3
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.carnival_magic = L => {
  const M = MAG;
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: ["heart", "spade", "diamond", "club"],
    n: 8,
    f: M.STAGE + 1.2,
    u0: -6,
    u1: 6,
    base: M.SH,
    size: 0.4,
    tint: ["red", "white", "red", "white"],
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "rabbit",
    n: 4,
    f: M.STAGE + 3.4,
    u0: -2.4,
    u1: 2.4,
    base: M.SH + 1.05,
    size: 0.4,
    tint: "white",
    bank: 4
  });
  L.row({ ...fixed, kind: "star", n: 6, f: 3, u0: -4.5, u1: 4.5, base: 1.0, size: 0.34, tint: "gold", bank: 3 });
  L.row({
    ...fixed,
    kind: "carnival_balloon",
    n: 6,
    f: M.STAGE - 0.5,
    u0: -9,
    u1: 9,
    base: M.CEIL - 3.2,
    size: 0.45,
    tint: ["red", "yellow"],
    bank: 3
  });
  L.pops({
    fixed: true,
    f: M.STAGE + 3.6,
    at: [[-5, M.SH]],
    size: 1.8,
    kinds: [
      ["carnival_assistant", 40, { dont: true }],
      ["carnival_skeleton", 30],
      ["carnival_clown", 30]
    ]
  });
  L.pops({
    fixed: true,
    f: M.STAGE + 2.5,
    at: [[2, M.SH]],
    size: 2.0,
    period: [6, 9],
    kinds: [["carnival_magician", 100, { dont: true }]]
  });
  L.pops({
    fixed: true,
    f: 8,
    at: [
      [-12, 0],
      [12, 0]
    ],
    size: 1.75,
    kinds: [
      ["carnival_clown", 60],
      ["carnival_kid", 40, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: M.STAGE + 1,
    at: [
      [-9.5, M.SH],
      [9.5, M.SH]
    ],
    size: 1.8,
    kinds: [
      ["carnival_clown", 60],
      ["carnival_ghost", 25],
      ["carnival_assistant", 15, { dont: true }]
    ]
  });
  L.row({
    ...fixed,
    kind: "star",
    n: 6,
    f: M.BACK - 0.6,
    u0: -8,
    u1: 8,
    base: M.SH + 4,
    size: 0.5,
    tint: "gold",
    bank: 3
  });
  L.pops({
    fixed: true,
    f: 16,
    at: [
      [-12, 0],
      [12, 0]
    ],
    size: 1.75,
    kinds: [
      ["carnival_clown", 60],
      ["carnival_ghost", 20],
      ["carnival_kid", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: M.STAGE + 8,
    at: [
      [-3, M.SH],
      [3, M.SH]
    ],
    size: 1.8,
    kinds: [
      ["carnival_skeleton", 40],
      ["carnival_clown", 40],
      ["carnival_assistant", 20, { dont: true }]
    ]
  });
};
const magicWave = (R, add, c) => {
  const M = MAG;
  const doves = n => flyers(["carnival_dove", "carnival_dove"], R, add, c, n);
  const cards = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n,
        R(0, 1) < 0.5 ? "carnival_cardUp" : "carnival_cardUpB",
        toss(R, {
          u: R(-3, 3),
          f: M.STAGE + 3,
          h: G + M.SH + 1.2,
          vh: R(6, 8) * Math.min(1.2, c.S),
          vu: R(-3, 3),
          vf: -R(1, 3)
        })
      );
  };
  const rabbit = t =>
    add(
      t,
      "carnival_rabbitRun",
      cross(R, { u0: R(-1, 1), u1: pick(R, [-1, 1]) * 11, f: M.STAGE + R(1.5, 3), h: M.SH, v: R(3, 5) * c.S })
    );
  const hats = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n,
        "carnival_topHat",
        toss(R, {
          u: R(-1, 1),
          f: M.STAGE + 3,
          h: G + M.SH + 1.2,
          vh: R(7, 9) * Math.min(1.2, c.S),
          vu: R(-2, 2),
          vf: -R(2, 4)
        })
      );
  };
  if (c.x2) {
    // the grand illusion: everything out of the hat at once
    doves(10);
    cards(8);
    for (let k = 0; k < 6; k++) rabbit(1 + k * 3.6);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k % 3 === 0) doves(3 + n(3));
  if (k % 3 === 1) cards(4 + n(3));
  if (k % 3 === 2) hats(3 + n(2));
  for (let j = 0; j < 1 + n(1.2); j++) rabbit(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++)
    add(
      R(1, 22),
      "carnival_clownRun",
      rush(
        R,
        [
          [pick(R, [-12, 12]), 8, G],
          [R(-6, 6), R(4, 7), G]
        ],
        R(3, 4) * c.S
      )
    );
  if (R(0, 1) < 0.3)
    add(R(2, 18), "carnival_assistantRun", cross(R, { u0: -8, u1: 8, f: M.STAGE + 2, h: M.SH, v: 1.6 }));
};

// ---- Level 8: the circus train ------------------------------------------------------------

const CTR = { F: 18, CARS: [-21, -12, -3, 6, 15] };
const CARC = [0xc0182a, 0x2f6fe8, 0xf2c230, 0x3ab54a, 0x8a3a8a];
WORLDS.carnival_train = {
  sky: {
    top: "#0a1028",
    mid: "#1a2448",
    horizon: "#5a3a5a",
    ground: "#1a2018",
    stars: true,
    planets: [{ az: -25, el: 20, r: 12, colour: "#f4f0e0", light: 0.2, dark: 0.15 }],
    hills: [{ colour: "#1a2030", height: 5, rough: 2 }],
    seed: 631
  },
  fog: 0x2a2a3a,
  build(P) {
    P.ground(0x2a3a22, [{ u: 0, f: CTR.F, r: 2.2, c: 0x4a4038, sx: 40, sz: 1 }]);
    for (const e of [-0.72, 0.72]) P.add(BOX(140, 0.1, 0.08), 0x6a6a6a, 0, G + 0.12, CTR.F + e);
    for (let u = -68; u < 68; u += 1.2) P.add(BOX(0.25, 0.08, 2.2), 0x4a3424, u, G + 0.05, CTR.F);
    // the circus cars: painted, gilt, cages with bars on some
    CTR.CARS.forEach((u, k) => {
      const c = CARC[k % CARC.length];
      P.add(BOX(8, 3.4, 2.8), c, u, G + 2.6, CTR.F);
      P.add(BOX(8.4, 0.35, 3.1), 0xc8a040, u, G + 4.45, CTR.F);
      P.add(BOX(8.2, 0.3, 2.9), 0xc8a040, u, G + 0.95, CTR.F);
      for (const x of [-2.6, 2.6])
        for (const s of [-1, 1])
          P.add(CYL(0.45, 0.45, 0.2, 12), 0xc8a040, u + x + s * 0.6, G + 0.45, CTR.F - 1.3, Math.PI / 2);
      if (k % 2 === 0) {
        P.add(BOX(5.6, 2.4, 0.1), 0x1a1210, u, G + 2.6, CTR.F - 1.42);
        for (let b = -2.6; b <= 2.6; b += 0.4) P.add(BOX(0.06, 2.4, 0.06), 0xc8a040, u + b, G + 2.6, CTR.F - 1.46);
      } else for (let j = 0; j < 3; j++) P.add(BOX(1.4, 1.0, 0.06), 0xffd88a, u - 2.4 + j * 2.4, G + 2.9, CTR.F - 1.42);
    });
    // the engine, its lamp and smoke; the big top being raised beyond; lanterns
    P.add(CYL(1.1, 1.1, 6, 14), 0x1a1a1a, 25, G + 2.6, CTR.F, 0, 0, Math.PI / 2);
    P.add(BOX(2.6, 3.2, 2.8), 0xc0182a, 21, G + 2.9, CTR.F);
    P.add(CYL(0.45, 0.7, 1.8, 10), 0x1a1a1a, 27, G + 4.4, CTR.F);
    P.add(BALL(0.4, 8), 0xffe8a0, 28.2, G + 3.0, CTR.F);
    for (let k = 0; k < 5; k++)
      P.add(BALL(0.8 + k * 0.4, 7), 0x8a8a90, 27 - k * 1.2, G + 5.6 + k * 0.6, CTR.F + k * 0.3);
    P.add(CONE(12, 8, 16), 0xe8344a, 0, G + 4, 50);
    for (let k = 0; k < 16; k += 2)
      P.add(
        BOX(0.4, 8.2, 0.1),
        0xf4efe2,
        Math.cos((k / 16) * Math.PI * 2) * 9,
        G + 4,
        50 - Math.sin((k / 16) * Math.PI * 2) * 9,
        0,
        -(k / 16) * Math.PI * 2,
        0.9
      );
    for (let u = -30; u <= 30; u += 6) {
      P.add(CYL(0.05, 0.06, 3.6, 5), 0x3a3a3a, u, G + 1.8, 8);
      P.add(BALL(0.22, 8), [0xff6a6a, 0xffd86a, 0x6ad8ff][Math.abs(u / 6) % 3], u, G + 3.7, 8);
    }
    P.scatter(
      30,
      26,
      80,
      (u, f, R) => P.add(BOX(3, 2, 3), [0x6a4a3a, 0x4a5a3a][Math.floor(R() * 2)], u, G + 1, f, 0, R() * 3, 0),
      70,
      14
    );
    P.scatter(30, 2, 14, (u, f, R) => Math.abs(u) > 4 && P.bush(u, f, 0.5 + R() * 0.5, 0x2a3a22), 40);
  },
  slots: [],
  cover: null
};
LAYOUTS.carnival_train = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "tinduck", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.4, tint: "yellow", bank: 3 });
  L.row({
    ...fixed,
    kind: "star",
    n: 5,
    f: CTR.F - 1.6,
    u0: -21,
    u1: 15,
    base: 4.75,
    size: 0.42,
    tint: "gold",
    bank: 5
  });
  L.row({
    ...fixed,
    kind: "carnival_balloon",
    n: 6,
    f: 7.6,
    u0: -18,
    u1: 18,
    base: 3.9,
    size: 0.4,
    tint: ["red", "yellow", "blue"],
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "carnival_pumpkin",
    n: 4,
    f: 11,
    u0: -9,
    u1: 9,
    base: 0.2,
    size: 0.45,
    tint: "orange",
    bank: 4
  });
  L.row({ ...fixed, kind: "carnival_rocket", n: 3, f: 46, u0: -4, u1: 4, base: 8.2, size: 0.7, tint: "red", bank: 3 });
  CTR.CARS.forEach((u, k) => {
    if (k % 2 === 0)
      L.pops({
        fixed: true,
        f: CTR.F - 1.6,
        at: [[u, 1.1]],
        size: 1.4,
        kinds: [
          ["lion", 50, { pts: 25 }],
          ["carnival_clown", 30],
          ["carnival_acrobat", 20, { dont: true }]
        ]
      });
    else
      L.pops({
        fixed: true,
        f: CTR.F - 1.6,
        at: [
          [u - 2.4, 1.5],
          [u + 2.4, 1.5]
        ],
        size: 1.2,
        kinds: [
          ["carnival_clown", 60],
          ["carnival_conductor", 20, { dont: true }],
          ["carnival_kid", 20, { dont: true }]
        ]
      });
  });
  L.pops({
    fixed: true,
    f: CTR.F,
    at: [
      [-16.5, 4.6],
      [1.5, 4.6]
    ],
    size: 1.6,
    period: [5, 8],
    kinds: [["carnival_clown", 100, { pts: 25 }]]
  });
};
const trainWave = (R, add, c) => {
  const loose = t =>
    add(
      t,
      "carnival_lionLoose",
      rush(
        R,
        [
          [pick(R, [-21, -3, 15]), CTR.F - 2, G],
          [R(-8, 8), R(5, 9), G]
        ],
        R(5, 7) * c.S
      )
    );
  const roof = t => {
    const [a, b] = R(0, 1) < 0.5 ? [-24, 18] : [18, -24];
    add(t, "carnival_clownRun", cross(R, { u0: a, u1: b, f: CTR.F, h: 4.6, v: R(3, 4) * c.S }));
  };
  if (c.x2) {
    for (let k = 0; k < 6; k++) loose(1 + k * 3.6);
    for (let k = 0; k < 4; k++) roof(2 + k * 5);
    for (let k = 0; k < 3; k++)
      add(3 + k * 7, "carnival_cannonball", across(R, { v: R(9, 12), h: R(8, 14), f: R(24, 36) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.2); j++) loose(R(1, 22));
  for (let j = 0; j < 1 + n(1.2); j++) roof(R(1, 22));
  if (k === 1 || k === 4)
    for (let j = 0; j < 2 + n(2); j++)
      add(
        R(1, 24),
        pick(R, ["carnival_ballR", "carnival_ballB", "carnival_pin"]),
        toss(R, { u: R(-20, 15), f: CTR.F, h: G + 4.8, vh: R(6, 8), vu: R(-2, 2) })
      );
  if (k === 2 || k === 5) flyers(["carnival_bat", "carnival_bat"], R, add, c, 2 + n(1));
  if (R(0, 1) < 0.3) add(R(2, 18), "carnival_kid", cross(R, { u0: -10, u1: 10, f: R(9, 12), v: 2 }));
};

// ---- Level 9: the balloon race ----------------------------------------------------------

WORLDS.carnival_balloons = {
  sky: {
    top: "#4a8ad0",
    mid: "#a8c8e8",
    horizon: "#f8d8b0",
    ground: "#5a7a3a",
    sun: [-35, 8, "#ffe8b0", 14],
    clouds: 9,
    cloud: "rgba(255,240,230,0.6)",
    hills: [
      { colour: "#6a8a4a", height: 6, rough: 2, phase: 2, trees: true },
      { colour: "#5a7a3a", height: 3, rough: 1, trees: true }
    ],
    seed: 641
  },
  fog: 0xd8e0d0,
  build(P) {
    P.ground(0x6a8a3a, [
      { u: 0, f: 20, r: 12, c: 0x7a9a4a, sx: 2.4, sz: 1 },
      { u: -18, f: 34, r: 8, c: 0x8aa858 }
    ]);
    // the launch field: balloons laid out, baskets, the burners' trucks,
    // the fairground's tents round its edge, bunting
    for (const [u, f, c] of [
      [-10, 14, 0xe8344a],
      [8, 16, 0x2f6fe8],
      [-2, 26, 0xf2c230]
    ]) {
      P.add(BALL(3, 12), c, u, G + 0.4, f, 0, 0, 0, 1.6, 0.35, 1);
      P.add(BOX(1.2, 0.9, 1.2), 0x8a6a3a, u + 4, G + 0.45, f);
    }
    for (const [u, f] of [
      [-22, 20],
      [22, 22],
      [-26, 40],
      [24, 44]
    ]) {
      P.add(CYL(3, 3, 2.6, 10), 0xf4efe2, u, G + 1.3, f);
      P.add(CONE(3.4, 2.4, 10), u > 0 ? 0xe8344a : 0x2f6fe8, u, G + 3.8, f);
    }
    for (let k = 0; k < 24; k++) {
      const t = k / 23;
      P.add(
        CONE(0.2, 0.3, 3),
        [0xe8344a, 0xf2c230, 0x2f6fe8, 0x3ab54a][k % 4],
        -18 + 36 * t,
        G + 3.4 - Math.sin(t * Math.PI) * 0.8,
        8,
        Math.PI,
        0,
        0
      );
    }
    for (const u of [-18, 18]) P.add(CYL(0.08, 0.1, 3.6, 5), 0x6a5a48, u, G + 1.8, 8);
    // two balloons tethered, up and waiting
    hotAir(kit(P, -14, 32, 0, 4.2, 1.2), 0x8a3a8a, 0xf4efe2);
    hotAir(kit(P, 16, 36, 0, 3.6, 1.1), 0xe86a1a, 0xf2c230);
    P.scatter(30, 30, 90, (u, f, R) => P.oak(u, f, 0.8 + R() * 0.6, 0x4a7a3a), 80, 20);
    // picnic rugs, food carts, flags round the field
    for (const [u, f, c] of [
      [-6, 10, 0xe8344a],
      [5, 9, 0x2f6fe8],
      [-14, 26, 0xf2c230],
      [12, 28, 0x3ab54a]
    ])
      P.add(BOX(2, 0.02, 1.6), c, u, G + 0.02, f);
    for (const [u, f] of [
      [-28, 12],
      [28, 12]
    ]) {
      P.add(BOX(2.4, 1.6, 1.4), 0xf4efe2, u, G + 1.0, f);
      P.add(BOX(2.8, 0.2, 1.8), 0xe8344a, u, G + 2.2, f);
      for (const e of [-1, 1]) P.add(CYL(0.3, 0.3, 0.1, 10), 0x2a2a2a, u + e * 0.8, G + 0.3, f - 0.7, Math.PI / 2);
    }
    for (let u = -30; u <= 30; u += 5) {
      P.add(CYL(0.05, 0.05, 4, 5), 0x8a8a8a, u, G + 2, 54);
      P.add(BOX(0.8, 0.5, 0.02), [0xe8344a, 0xf2c230, 0x2f6fe8][Math.abs(u / 5) % 3], u + 0.4, G + 3.7, 54);
    }
    P.scatter(40, 4, 30, (u, f, R) => Math.abs(u) > 18 && P.bush(u, f, 0.4 + R() * 0.5, 0x4a6a2a), 40);
    P.scatter(
      24,
      34,
      80,
      (u, f, R) => P.add(BALL(0.8, 10), 0x5a8a3a, u, G + 0.3, f, 0, 0, 0, 1.4 + R(), 0.7, 1.2),
      80,
      10
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.carnival_balloons = L => {
  const fixed = { fixed: true, rail: false };
  L.row({
    kind: "carnival_balloon",
    n: 6,
    f: 3.5,
    u0: -4.5,
    u1: 4.5,
    base: 0.9,
    size: 0.38,
    tint: ["red", "blue"],
    bank: 3
  });
  L.row({ ...fixed, kind: "star", n: 6, f: 7.8, u0: -15, u1: 15, base: 2.9, size: 0.36, tint: "gold", bank: 3 });
  L.row({ kind: "tinduck", n: 4, f: 22, u0: -8, u1: 8, base: 1.0, size: 0.45, tint: "yellow", bank: 4 });
  L.row({
    ...fixed,
    kind: "carnival_balloon",
    n: 3,
    f: 31,
    u0: -15,
    u1: -13,
    base: 4.2,
    size: 0.5,
    tint: "yellow",
    bank: 3
  });
  L.row({
    kind: "carnival_balloon",
    n: 4,
    f: 48,
    u0: -10,
    u1: 10,
    base: 3,
    size: 0.7,
    tint: ["green", "red"],
    bank: 4,
    perch: true
  });
  L.pops({
    fixed: true,
    f: 15,
    at: [
      [-6, 0],
      [12, 0]
    ],
    size: 1.75,
    kinds: [
      ["carnival_clown", 60],
      ["carnival_acrobat", 20, { dont: true }],
      ["carnival_kid", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 19,
    at: [
      [-22, 0],
      [22, 0]
    ],
    size: 1.8,
    kinds: [
      ["carnival_clown", 70],
      ["carnival_ringmaster", 10, { pts: 250 }],
      ["carnival_kid", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 26.6,
    at: [[2, 0]],
    size: 1.75,
    kinds: [
      ["carnival_clown", 80],
      ["carnival_acrobat", 20, { dont: true }]
    ]
  });
  L.row({
    ...fixed,
    kind: "carnival_rocket",
    n: 3,
    f: 54,
    u0: -2.5,
    u1: 2.5,
    base: 4.4,
    size: 0.5,
    tint: "red",
    bank: 3
  });
  L.pops({
    fixed: true,
    f: 13,
    at: [
      [-28, 0],
      [28, 0]
    ],
    size: 1.75,
    kinds: [
      ["carnival_clown", 70],
      ["carnival_kid", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 10.6,
    at: [
      [-6, 0],
      [5, 0]
    ],
    size: 1.75,
    kinds: [
      ["carnival_clown", 75],
      ["carnival_kid", 25, { dont: true }]
    ]
  });
};
const balloonsWave = (R, add, c) => {
  const up = t =>
    add(
      t,
      pick(R, ["carnival_hotairA", "carnival_hotairB", "carnival_hotairC"]),
      float(R, { u: R(-20, 20), f: R(20, 46), v: R(0.8, 1.4) * c.S, h: G + 2 })
    );
  const drift = t =>
    add(
      t,
      pick(R, ["carnival_hotairA", "carnival_hotairB", "carnival_hotairC"]),
      across(R, { v: R(2.5, 4) * c.S, h: R(10, 18), f: R(24, 50), amp: 0.5 })
    );
  if (c.x2) {
    for (let k = 0; k < 8; k++) (k % 2 ? up : drift)(1 + k * 2.8);
    flyers(["carnival_dove", "pigeon"], R, add, c, 6);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.4); j++) up(R(1, 14));
  for (let j = 0; j < 1 + n(1); j++) drift(R(1, 16));
  for (let j = 0; j < 2 + n(2); j++)
    add(R(1, 24), pick(R, ["balloonR", "balloonB", "balloonY", "balloonG"]), float(R, { v: R(1.6, 2.8) * c.S }));
  if (k === 2 || k === 5) flyers(["carnival_dove", "pigeon"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.3) add(R(2, 18), "carnival_kid", cross(R, { u0: -9, u1: 9, f: R(8, 12), v: 2 }));
};

// ---- Sound and the levels ----------------------------------------------------------------

Object.assign(AMBIENCE, {
  carnival_funhouse(d, sr, R) {
    bed(d, sr, R, { crowd: 0.5, organ: 0.05, clank: 0.05 });
  },
  carnival_pier(d, sr, R) {
    bed(d, sr, R, { wind: 1.2, surf: 0.8, gulls: 0.04, organ: 0.03 });
  },
  carnival_magic(d, sr, R) {
    bed(d, sr, R, { crowd: 0.7, organ: 0.03 });
  },
  carnival_train(d, sr, R) {
    bed(d, sr, R, { wind: 0.8, chuff: 0.15, crickets: 0.015, organ: 0.03 });
  },
  carnival_balloons(d, sr, R) {
    bed(d, sr, R, { wind: 1.0, birds: 0.03, crowd: 0.3, organ: 0.03 });
  }
});

const level = o => ({ music: "carnival", ...o });
export const CARNIVAL_MORE = {
  kinds,
  levels: [
    level({
      world: "carnival_funhouse",
      name: "THE FUNHOUSE",
      story: "Through the clown's mouth. Mind the barrel",
      amb: "carnival_funhouse",
      indoor: true,
      legend: "CLOWNS 50 · THE RINGMASTER 250 · DON'T SHOOT THE LOST KIDS",
      wave: funhouseWave,
      title: (w, x2) => (x2 ? "EVERY DOOR AT ONCE · DOUBLE POINTS" : null)
    }),
    level({
      world: "carnival_pier",
      name: "THE PIER",
      story: "Out over the sea at sunset. The games are rigged",
      amb: "carnival_pier",
      legend: "CRABS 100 · GULLS 25 · DON'T SHOOT THE KIDS OR THE ACROBATS",
      wave: pierWave,
      title: (w, x2) => (x2 ? "THE GULLS ARE COMING · DOUBLE POINTS" : null)
    }),
    level({
      world: "carnival_magic",
      name: "THE MAGIC SHOW",
      story: "The Great Marvello. Shoot what comes out of the hat",
      amb: "carnival_magic",
      indoor: true,
      legend: "RABBITS 100 · CARDS, DOVES AND HATS 25 · DON'T SHOOT MARVELLO OR HIS ASSISTANT",
      wave: magicWave,
      title: (w, x2) => (x2 ? "THE GRAND ILLUSION · DOUBLE POINTS" : null)
    }),
    level({
      world: "carnival_train",
      name: "THE CIRCUS TRAIN",
      story: "Midnight. The cages are open",
      amb: "carnival_train",
      legend: "LIONS 75 · CLOWNS ON THE ROOFS 50 · DON'T SHOOT THE CONDUCTOR OR THE KIDS",
      wave: trainWave,
      title: (w, x2) => (x2 ? "THE ANIMALS ARE LOOSE · DOUBLE POINTS" : null)
    }),
    level({
      world: "carnival_balloons",
      name: "THE BALLOON RACE",
      story: "Dawn over the fairground. Up, up and away",
      amb: "carnival_balloons",
      legend: "HOT-AIR BALLOONS 50 · LITTLE BALLOONS 10 · DON'T SHOOT THE KIDS",
      wave: balloonsWave,
      title: (w, x2) => (x2 ? "THE MASS ASCENT · DOUBLE POINTS" : null)
    })
  ]
};
