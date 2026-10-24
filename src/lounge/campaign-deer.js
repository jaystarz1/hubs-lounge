import { GROUND, BOX, CYL, BALL, CONE, SLAB, WORLDS, BIRDS, AMBIENCE } from "./shoots-art";
import { LAYOUTS } from "./plates";
import { SHAPES } from "./plates-shapes";
import { bird, gunman, runner, DONT, across, flush, run, charge, cross, flyers } from "./shoot-paths";

// The Deer Stalk campaign (Jay, 2026-10-24: "take the hunters deeper into the
// wild: mountains, snow, the Scottish moors, then the ancient forest where the
// legendary White Stag is"). Five levels:
//   1 THE FOREST EDGE           (the classic world, shoots.js SCREEN.deer)
//   2 THE MOUNTAIN PASS         an alpine meadow under the peaks: a hut with
//                               cowbells, marmots at their burrows, elk on the
//                               meadow, goats on the cliff ledges (far, worth
//                               the most), an eagle over; hikers on the trail
//   3 THE SNOWY RIDGE           winter over the pass: a frozen stream, the
//                               ranger's cabin, snow-laden firs, stags walking
//                               the ridge, hares, ptarmigan up off the snow
//   4 THE HIGHLANDS             a Scottish moor at golden hour: heather, dry-
//                               stone walls, a bothy, a loch with a ruined
//                               castle, red stags, grouse; the Highland cattle
//                               are not to be shot
//   5 THE OLD KING OF THE       an ancient forest at moonrise: giant trees, a
//     FOREST                    stone circle in the glade, wolves, and now and
//                               then the White Stag himself; the herd
//                               stampedes past on the double-points waves
// Everything below is laid out as the other worlds are (u right, f downrange,
// h up from the roof deck, the ground at GROUND); shoots-art moves it all
// SHIFT m back and onto the lifted land.

const G = GROUND;

// ---- New outlines (the plates' atlas) ------------------------------------------

Object.assign(SHAPES, {
  // a mountain goat: stocky, a beard, horns swept back
  deer_goat: {
    polys: [
      [
        0, 30, 2, 24, 8, 18, 14, 14, 20, 12, 24, 16, 28, 26, 36, 34, 50, 30, 70, 32, 92, 34, 100, 36, 104, 40, 108, 38,
        106, 46, 104, 52, 104, 64, 100, 72, 102, 92, 96, 92, 94, 74, 90, 74, 90, 92, 84, 92, 84, 70, 50, 72, 48, 92, 42,
        92, 42, 76, 38, 76, 38, 92, 32, 92, 30, 68, 24, 56, 16, 44, 12, 52, 8, 50, 8, 40, 4, 36, 0, 34
      ]
    ],
    lines: [
      [5, 15, 14, 19, 4, 27, -2, 36, 0, 41, 8],
      [4, 20, 13, 25, 5, 32, 2, 37, 7],
      [3, 22, 17, 30, 19]
    ],
    dots: [[10, 24, 1.6]]
  },
  // a marmot sat up on its haunches, on watch
  deer_marmot: {
    polys: [
      [
        0, 15, 2, 10, 6, 6, 12, 4, 17, 5, 19, 2, 22, 5, 24, 12, 26, 22, 32, 34, 36, 48, 38, 60, 46, 63, 53, 61, 55, 67,
        44, 72, 36, 72, 8, 72, 10, 66, 8, 56, 6, 46, 10, 40, 5, 37, 4, 32, 9, 30, 10, 26, 6, 22, 2, 20
      ]
    ],
    marks: [[2.5, 12, 32, 16, 40]],
    dots: [[8, 11, 1.5]]
  },
  // a red grouse on the heather (white: a ptarmigan)
  deer_grouse: {
    polys: [
      [
        0, 20, 4, 16, 8, 12, 14, 10, 18, 12, 22, 18, 30, 20, 44, 22, 54, 26, 62, 30, 60, 34, 50, 36, 44, 42, 30, 44, 30,
        52, 34, 54, 24, 54, 25, 44, 16, 40, 10, 32, 8, 26, 4, 24, 0, 22
      ]
    ],
    marks: [[2.5, 26, 27, 46, 31]],
    dots: [[10, 16, 1.4]]
  },
  // a Highland cow: long horns, a fringe over the eyes, shaggy all round
  deer_cow: {
    polys: [
      [
        0, 44, 2, 36, 8, 28, 14, 24, 22, 22, 28, 26, 32, 24, 44, 20, 70, 22, 96, 24, 108, 28, 112, 34, 116, 40, 118, 60,
        114, 62, 112, 46, 110, 50, 110, 62, 106, 66, 106, 80, 98, 80, 98, 68, 94, 70, 88, 66, 82, 70, 76, 66, 70, 70,
        64, 66, 58, 70, 52, 66, 46, 70, 40, 68, 40, 80, 32, 80, 32, 64, 26, 60, 20, 58, 16, 54, 12, 50, 6, 50, 2, 48
      ]
    ],
    lines: [
      [8, 18, 24, 6, 22, -6, 18, -12, 10],
      [7, 26, 23, 38, 21, 50, 16, 54, 8]
    ],
    marks: [
      [3, 8, 30, 20, 33],
      [2.5, 50, 30, 52, 44],
      [2.5, 66, 30, 68, 46],
      [2.5, 82, 30, 84, 46]
    ],
    dots: [[3, 42, 1.4]]
  },
  // the White Stag: the old king, his crown of tines
  deer_royal: {
    polys: [
      [
        0, 40, 6, 35, 14, 28, 18, 24, 20, 14, 26, 12, 25, 22, 27, 27, 32, 36, 38, 46, 46, 52, 70, 52, 92, 52, 104, 55,
        110, 54, 112, 60, 106, 62, 108, 70, 106, 80, 101, 90, 100, 98, 103, 126, 103, 132, 97, 132, 95, 104, 92, 96, 90,
        104, 90, 132, 84, 132, 84, 100, 80, 90, 60, 92, 48, 90, 47, 100, 48, 132, 42, 132, 40, 102, 38, 104, 38, 132,
        32, 132, 32, 100, 31, 86, 28, 72, 24, 60, 16, 50, 10, 46, 4, 45
      ]
    ],
    lines: [
      [6, 19, 24, 23, 8, 30, -4, 40, -14, 54, -18, 66, -14, 72, -6],
      [5.5, 24, 6, 15, -6],
      [5.5, 29, -3, 24, -22],
      [5.5, 38, -13, 36, -32],
      [5.5, 50, -17, 50, -36],
      [5.5, 61, -16, 66, -32],
      [5, 68, -10, 79, -22],
      [6, 17, 24, 12, 10, 6, 0, -2, -8, -12, -10, -20, -6],
      [5.5, 10, 6, 2, -6],
      [5.5, 4, -2, 0, -20],
      [5.5, -4, -8, -6, -26],
      [5, -12, -10, -16, -24],
      [5, -18, -7, -28, -14]
    ],
    dots: [[13, 33, 1.6]]
  }
});

// ---- New birds (flown, not plates) -------------------------------------------------

Object.assign(BIRDS, {
  deer_eagle: { body: 0x4a3018, head: 0xc8963a, wing: 0x3a2614, beak: 0xf2c230, s: 2.3, span: 1.7, tip: 0x1a1410 },
  deer_ptarmigan: {
    body: 0xf4f4f0,
    head: 0xeeeeea,
    wing: 0xffffff,
    beak: 0x222222,
    s: 0.85,
    tip: 0x222222,
    crest: 0xd0302a
  },
  deer_grouse: {
    body: 0x7a3a22,
    head: 0x6a3020,
    wing: 0x8a5a3a,
    beak: 0x222222,
    s: 0.85,
    tip: 0x3a2a1a,
    crest: 0xd0302a
  },
  deer_owl: { body: 0xb8925a, head: 0xc8a26a, wing: 0xa07a48, beak: 0xe8c040, s: 1.3, span: 1.3, ring: 0xf4e8d0 }
});

// ---- Kinds -----------------------------------------------------------------------

const walker = (cardKey, extra = {}) => ({ ...gunman(cardKey, 1.8), ...extra });
const kinds = {
  // the pass
  deer_elk: { ...runner("bigbuck", 0x8a5a32, 2.2, 0.8, "thud"), pts: 50, name: "ELK" },
  deer_chamois: { ...runner("deer_goat", 0x9a6a3a, 1.0, 0.45, "thud"), pts: 100 },
  deer_ibex: { ...runner("deer_goat", 0xf4efe2, 0.95, 0.45, "thud"), pts: 100, name: "MOUNTAIN GOAT" },
  deer_marmot: { ...runner("deer_marmot", 0xb08050, 0.5, 0.3, "thud"), pts: 100 },
  deer_eagle: { ...bird("deer_eagle", 15, 0.6, "caw"), name: "GOLDEN EAGLE" },
  deer_hikerRun: { ...walker("hiker"), pts: -25, sound: "wrong", ...DONT },
  // the ridge
  deer_stagSnow: runner("bigbuck", 0x7a4a2a, 1.9, 0.75, "thud"),
  deer_hare: { ...runner("rabbit", 0xf4f4f0, 0.55, 0.3, "thud"), pts: 100 },
  deer_ptarmigan: bird("deer_ptarmigan", 25, 0.3, "chirp"),
  deer_rangerRun: { ...walker("ranger"), pts: -25, sound: "wrong", ...DONT },
  // the moor
  deer_redStag: runner("bigbuck", 0x9a4a22, 1.9, 0.75, "thud"),
  deer_hind: runner("doe", 0xb06a3a, 1.5, 0.6, "thud"),
  deer_rutStag: { ...runner("bigbuck", 0xc85a2a, 2.0, 0.8, "thud"), name: "IN THE RUT!" },
  deer_grouse: bird("deer_grouse", 25, 0.28, "chirp"),
  deer_cattle: { ...runner("deer_cow", 0xc8682a, 1.4, 0.7, "thud"), pts: -25, sound: "wrong", ...DONT },
  // the old forest
  deer_wolf: runner("wolf", 0x6a6e78, 1.0, 0.55, "thud"),
  deer_stag5: runner("bigbuck", 0x8a5a3a, 1.9, 0.75, "thud"),
  deer_buck5: runner("buck", 0xa0683a, 1.6, 0.65, "thud"),
  deer_owl: bird("deer_owl", 25, 0.4, "caw"),
  deer_whiteStag: { ...runner("deer_royal", 0xfffff4, 2.5, 0.95, "thud"), pts: 300, name: "THE WHITE STAG!" }
};

// ---- Paths ------------------------------------------------------------------------

// Straight across like run(), but this way (dir) so a herd keeps together.
function dash(R, o) {
  const u0 = R(26, 32);
  const ph = R(0, 6);
  return {
    dur: (2 * u0) / o.v,
    pos: (tau, out) => out.set(-o.dir * u0 + o.dir * o.v * tau, o.f, G + 0.08 * Math.abs(Math.sin(ph + tau * 11)))
  };
}
// A covey of n birds low and fast across in a bunch.
function covey(R, add, t, c, kind, n, o = {}) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const f = o.f ?? R(10, 24);
  const h = o.h ?? R(2.5, 4.5);
  const v = R(13, 16) * c.S;
  for (let j = 0; j < n; j++)
    add(t + j * 0.3, kind, across(R, { v, dir, f: f + R(-1.5, 1.5), h: h + R(-0.5, 0.8), amp: 0.25, weave: 0.6 }));
}
// Walking across the field (a don't-shoot): slow, and it takes its time.
function stroll(R, add, t, kind, f, v) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  add(t, kind, cross(R, { u0: -dir * 24, u1: dir * 24, f, v }));
}
const soar = (R, c) => across(R, { v: R(8, 10.5) * c.S, f: R(22, 36), h: R(12, 17), amp: 0.5, weave: 2.5 });

// ---- Shared scenery ------------------------------------------------------------------

const FIR = [
  [1.5, 2.8, 2.2],
  [1.15, 2.4, 3.5],
  [0.75, 2.0, 4.7]
];
// A fir in three tiers; snow: a white cap on each tier.
function fir(P, u, f, s = 1, c = 0x2a4a32, snow = 0) {
  P.add(CYL(0.14 * s, 0.22 * s, 1.4 * s, 5), 0x4a3020, u, G + 0.7 * s, f);
  for (const [r, h, y] of FIR) {
    P.add(CONE(r * s, h * s, 7), c, u, G + y * s, f);
    if (snow) P.add(CONE(r * s * 0.6, h * s * 0.56, 7), snow, u, G + (y + h * 0.22 + 0.02) * s, f);
  }
}
// A mountain: a rock pyramid, a snow cap on top.
function peak(P, u, f, r, h, rock, snow, cap = 0.34) {
  const ry = u * 0.37 + f;
  P.add(CONE(r, h, 6), rock, u, G + h / 2, f, 0, ry, 0);
  if (snow) {
    const hc = h * cap * 1.02;
    P.add(CONE(r * cap * 1.05, hc, 6), snow, u, G + h - hc / 2 + hc * 0.02, f, 0, ry, 0);
  }
}
// A gable: a triangular prism w across, h tall, len long, its foot at y,
// its ridge along u (alongU) or along f.
function gable(P, c, u, y, f, w, h, len, alongU) {
  const g = CYL(1, 1, len, 3);
  const sx = w / Math.sqrt(3);
  if (alongU) P.add(g, c, u, y + h / 3, f, -Math.PI / 2, 0, Math.PI / 2, sx, 1, h / 1.5);
  else P.add(g, c, u, y + h / 3, f, -Math.PI / 2, 0, 0, sx, 1, h / 1.5);
}
// Smoke up out of a chimney, drifting.
function smoke(P, u, h, f, c = 0x9a9aa0) {
  for (let k = 0; k < 5; k++) P.add(BALL(0.3 + k * 0.12, 5), c, u - k * 0.35, h + k * 0.7, f + k * 0.1);
}
// A rock with snow on top.
function snowRock(P, u, f, s = 1) {
  P.add(BALL(0.5 * s, 5), 0x5a5a62, u, G + 0.15 * s, f, (u * 1.3) % 0.6, u, (f * 0.7) % 0.5, 1.3, 0.85, 1);
  P.add(BALL(0.48 * s, 6), 0xf4f8fc, u, G + 0.38 * s, f, 0, u, 0.1, 1.25, 0.45, 1);
}

// ---- Level 2: the mountain pass ----------------------------------------------------

// You're on the trail up to the pass: the hut on the left, the meadow and a
// tarn, then scree and a cliff band (goats on its ledges, a path across it at
// PATH), the peaks behind. The cliff is in 5 m pieces from u -40, CLIFF_H tall.
const PASS = { HUT: -21, HUTF: 12, CLIFF: 44, PATH: 5, FALL: 7.5 };
const CLIFF_H = [9, 11, 12.5, 11, 10, 12, 13.5, 12, 11, 12.5, 14, 12, 10.5, 11.5, 10, 9];
const cliffAt = u => CLIFF_H[Math.max(0, Math.min(15, Math.floor((u + 40) / 5)))];
const LEDGES = [
  [-27, 3.2],
  [-17, 6.8],
  [-8, 9],
  [3, 2.8],
  [12, 7.2],
  [24, 2.6]
];
const BURROWS = [-14, -7, 7, 14];
const BOULDERS = [
  [-26, 27, 1.3],
  [24, 24, 1.2],
  [30, 28.5, 1.4]
];
const CLUMPS = [-18, -9, 9, 18];
const FLOWERS = [0xf2c230, 0xe8f0f4, 0x9a6ad8, 0xe8344a, 0xf28ab0];

function chalet(P, u, f) {
  const W = 6;
  const D = 5;
  const wood = 0x8a5230;
  P.add(BOX(W + 0.3, 0.9, D + 0.3), 0x8a8680, u, G + 0.45, f + D / 2);
  P.add(BOX(W, 2.6, D), wood, u, G + 2.2, f + D / 2);
  for (let k = 0; k < 6; k++) P.add(BOX(W + 0.1, 0.06, 0.06), 0x5a3418, u, G + 1.1 + k * 0.42, f - 0.02);
  gable(P, wood, u, G + 3.5, f + D / 2, W, 2.0, D, false);
  // the roof, out over the front
  for (const s of [-1, 1])
    P.add(BOX(4.2, 0.2, D + 1.6), 0x4a3a30, u + s * 1.5, G + 4.65, f + D / 2 - 0.3, 0, 0, -s * 0.588);
  P.add(BOX(0.5, 1.4, 0.5), 0x8a8680, u + 1.6, G + 5.2, f + 3.2);
  // the balcony across the gable (the cowbells hang under it)
  P.add(BOX(W * 0.85, 0.14, 1.0), 0x6a3e20, u, G + 3.4, f - 0.5);
  P.add(BOX(W * 0.85, 0.08, 0.08), 0x6a3e20, u, G + 4.25, f - 0.98);
  for (let k = 0; k < 14; k++) P.add(BOX(0.12, 0.8, 0.04), 0xc89a5a, u - 2.4 + k * 0.37, G + 3.85, f - 0.98);
  for (const du of [-1.6, 0, 1.6]) P.add(BOX(0.02, 0.65, 0.02), 0x2a2a2a, u + du, G + 3.0, f - 0.45);
  // door, windows with red shutters and geraniums, a bench
  P.add(BOX(1.0, 1.9, 0.06), 0x4a2a18, u, G + 1.85, f - 0.03);
  for (const s of [-1, 1]) {
    const wu = u + s * 1.9;
    P.add(BOX(0.9, 0.9, 0.06), 0x2a2e36, wu, G + 2.1, f - 0.03);
    P.add(BOX(0.38, 0.95, 0.06), 0xb02a2a, wu - 0.66, G + 2.1, f - 0.05);
    P.add(BOX(0.38, 0.95, 0.06), 0xb02a2a, wu + 0.66, G + 2.1, f - 0.05);
    P.add(BOX(1.0, 0.22, 0.25), 0x5a3418, wu, G + 1.55, f - 0.15);
    for (let k = 0; k < 3; k++) P.add(BALL(0.1, 5), 0xe8344a, wu - 0.3 + k * 0.3, G + 1.72, f - 0.15);
  }
  P.add(BOX(2.2, 0.1, 0.45), 0x7a4a2a, u + 1.9, G + 0.5, f - 0.6);
  // a flag on a pole, and the woodpile
  P.add(CYL(0.05, 0.06, 6, 5), 0xe8e8e8, u - 4.2, G + 3, f + 0.5);
  P.add(BOX(1.3, 0.85, 0.04), 0xd8202a, u - 3.5, G + 5.4, f + 0.5);
  P.add(BOX(0.75, 0.18, 0.05), 0xffffff, u - 3.5, G + 5.4, f + 0.48);
  P.add(BOX(0.18, 0.55, 0.05), 0xffffff, u - 3.5, G + 5.4, f + 0.48);
  for (let k = 0; k < 8; k++)
    P.add(
      CYL(0.13, 0.13, 1.1, 6),
      0x9a6a3a,
      u + 3.4,
      G + 0.15 + Math.floor(k / 4) * 0.26,
      f + 0.6 + (k % 4) * 0.27,
      Math.PI / 2
    );
}

// A crag on the right with a summit cross.
function crag(P, u, f) {
  P.add(BALL(2.4, 7), 0x7a7874, u, G + 0.8, f, 0, 1, 0, 1.3, 1.1, 1);
  P.add(BALL(1.7, 6), 0x8a8884, u + 0.6, G + 2.6, f + 0.4, 0, 2, 0, 1, 1.1, 1);
  P.add(BALL(1.0, 6), 0x7e7c78, u + 0.2, G + 3.9, f + 0.2);
  P.add(BOX(0.16, 2.4, 0.16), 0x5a3a20, u + 0.2, G + 5.9, f + 0.2);
  P.add(BOX(1.2, 0.16, 0.16), 0x5a3a20, u + 0.2, G + 6.5, f + 0.2);
}

WORLDS.deer_pass = {
  sky: {
    top: "#1f4f9a",
    mid: "#6a9ad0",
    horizon: "#dce8f0",
    ground: "#5a7a3a",
    sun: [-35, 50, "#fffbe8", 13],
    clouds: 6,
    cloud: "rgba(255,255,255,0.7)",
    hills: [
      { colour: "#e2e8f0", height: 17, rough: 3, phase: 1 },
      { colour: "#8a9ab0", height: 9, rough: 4, phase: 2.4 }
    ],
    seed: 61
  },
  fog: 0xc8d8e8,
  signs: [
    ["BERGHAUS EDELWEISS", PASS.HUT, G + 4.6, PASS.HUTF - 0.06, 2.8, 0.45, "#5a2a1a", "#f4efe2"],
    ["PASS 2400 M", 5, G + 1.95, 5.45, 1.9, 0.42, "#f2c230", "#1a1a1a"],
    ["GIPFEL 3 STD", 5, G + 1.45, 5.45, 1.9, 0.38, "#f2c230", "#1a1a1a"]
  ],
  build(P) {
    P.ground(0x5a8a3a, [
      { u: 0, f: 20, r: 30, c: 0x6a9a42, sx: 1.6, sz: 0.5 },
      { u: -12, f: 15, r: 5, c: 0xb0b04a, sx: 1.8, sz: 0.5 },
      { u: 14, f: 17, r: 5, c: 0x8a7aa8, sx: 1.6, sz: 0.45 },
      { u: -5, f: 9, r: 2, c: 0x9a8a6a, sx: 0.6, sz: 4.5 },
      { u: 0, f: 40.5, r: 12, c: 0x8e8c86, sx: 4, sz: 0.32 },
      { u: PASS.FALL, f: 42, r: 2, c: 0x5a8ab0, sx: 1.3, sz: 0.6 },
      { u: 6.5, f: 35.5, r: 1, c: 0x5a8ab0, sx: 1, sz: 6 },
      { u: 5, f: 27, r: 6.6, c: 0x8a8a78, sx: 1.6, sz: 0.48 },
      { u: 5, f: 27, r: 6, c: 0x3a6a9a, sx: 1.6, sz: 0.45 }
    ]);
    // the peaks behind, and the shoulders off the cliff's ends
    for (const [u, f, r, h, cap] of [
      [-48, 66, 20, 30, 0.34],
      [-22, 80, 26, 44, 0.36],
      [2, 72, 18, 36, 0.4],
      [26, 82, 24, 42, 0.36],
      [50, 64, 18, 28, 0.32],
      [-36, 58, 10, 17, 0.25],
      [38, 59, 11, 18, 0.25]
    ])
      peak(P, u, f, r, h, 0x6a7080, 0xf4f6fa, cap);
    for (const s of [-1, 1]) peak(P, s * 49, 47, 12, 15, 0x7a7a80, 0, 0);
    // the cliff band: each piece a little out of line with the next, slabs
    // leaning on its face, crags along its top (grass, or snow on the highest)
    const C = PASS.CLIFF;
    const ROCK = [0x8a8682, 0x7c7874, 0x928e88, 0x84807c];
    CLIFF_H.forEach((h, k) => {
      const u = -37.5 + 5 * k;
      const c = ROCK[k % 4];
      const side = k % 2 ? 1 : -1;
      const top = h >= 12 ? 0xeef2f6 : 0x6a8a4a;
      P.add(BOX(5.6, h, 8), c, u, G + h / 2, C + 4 + (k % 2) * 0.25, 0, (((k * 7) % 5) - 2) * 0.04, 0);
      P.add(
        BOX(2.4, h * 0.55, 1.4),
        ROCK[(k + 1) % 4],
        u + side * 1.3,
        G + h * 0.27,
        C + 0.4,
        0,
        side * 0.35,
        side * 0.08
      );
      if (k !== 9)
        P.add(
          BOX(1.8, h * 0.35, 1.2),
          ROCK[(k + 2) % 4],
          u - side * 1.1,
          G + h * 0.8,
          C + 0.5,
          0.1,
          0.3,
          0.12 * ((k % 3) - 1)
        );
      P.add(CONE(1.6, 2.4, 5), c, u - 1.2, G + h + 0.9, C + 1.2, 0, k, 0);
      P.add(BALL(1.5, 6), top, u + 1.0, G + h, C + 2, 0, k, 0, 1.4, 0.5, 1.2);
      P.add(BOX(5.6, 0.4, 7), top, u, G + h + 0.1, C + 4.6);
      P.rock(u + side * 2, C - 1.6, 1.4 + (k % 3) * 0.4, ROCK[(k + 3) % 4]);
    });
    P.add(BOX(76, 0.35, 1.1), 0x9a9894, 0, G + PASS.PATH - 0.175, C - 0.5);
    for (const [u, top] of LEDGES) {
      P.add(BOX(3.2, 0.35, 1.2), 0xa8a6a0, u, G + top - 0.175, C - 0.55);
      P.add(BALL(0.3, 5), 0x4a7a32, u + 1.2, G + top + 0.1, C - 0.3);
    }
    // the waterfall into its pool, the stream down to the tarn
    const fh = cliffAt(PASS.FALL);
    P.add(BOX(1.3, fh, 0.25), 0xdcecf6, PASS.FALL, G + fh / 2, C - 0.15);
    P.add(BALL(1.2, 7), 0xf4f8fc, PASS.FALL, G + 0.2, C - 1, 0, 0, 0, 1.4, 0.5, 1);
    // scree, boulders, the tarn's stones
    P.scatter(34, 37, 43, (u, f, R) => P.rock(u, f, 0.4 + R() * 0.8, 0x8a8884), 40);
    for (const [u, f, top] of BOULDERS) P.add(BALL(1.4, 7), 0x8a8680, u, G + top - 1.4 * 0.8, f, 0, u, 0, 1.2, 0.8, 1);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      P.rock(5 + Math.cos(a) * 10, 27 + Math.sin(a) * 2.9, 0.35 + (k % 3) * 0.15, 0x8a8478);
    }
    // the marmots' burrows
    for (const u of BURROWS) {
      P.add(BALL(0.8, 7), 0x8a7458, u, G + 0.05, 7, 0, 0, 0, 1.2, 0.45, 0.9);
      P.rock(u - 0.7, 6.7, 0.35, 0x8a8680);
      P.rock(u + 0.8, 7.2, 0.3, 0x7a7874);
    }
    // the hut, a signpost, a cairn, the crag with its cross
    chalet(P, PASS.HUT, PASS.HUTF);
    P.add(BOX(0.12, 2.3, 0.12), 0x6a4a2a, 5, G + 1.15, 5.55);
    for (let k = 0; k < 4; k++)
      P.add(BALL(0.4 - k * 0.07, 5), 0x8a8884, 4, G + 0.2 + k * 0.5, 18, 0, k, 0, 1.3, 0.6, 1.1);
    crag(P, 30, 15);
    // firs up the sides and in clumps (the elk step out from behind them)
    const firAt = (u, f, s) => fir(P, u, f, s, [0x24502e, 0x2a5a36, 0x1f4a2a][Math.floor(P.r(0, 3))]);
    P.scatter(46, 4, 46, (u, f, R) => (Math.abs(u) > 25 ? firAt(u, f, 1.1 + R() * 0.8) : null), 66);
    for (const u of CLUMPS) {
      firAt(u + 0.4, 32.9, 1.3);
      P.bush(u, 32.2, 1.3, 0x3a6a2a);
    }
    for (const [u, f] of [
      [-30, 52],
      [-36, 50],
      [33, 51],
      [40, 49],
      [-12, 36],
      [15, 35]
    ])
      firAt(u, f, 1.2);
    // wildflowers and tufts across the meadow
    P.scatter(
      56,
      1,
      24,
      (u, f, R) => {
        const c = FLOWERS[Math.floor(R() * FLOWERS.length)];
        for (let j = 0; j < 3; j++)
          P.add(CONE(0.08, 0.22, 4), c, u + (R() - 0.5) * 0.8, G + 0.11, f + (R() - 0.5) * 0.6);
      },
      30
    );
    P.scatter(
      40,
      1,
      30,
      (u, f, R) => {
        for (let j = 0; j < 3; j++) P.add(CONE(0.1, 0.45, 3), 0x4a7a32, u + (R() - 0.5) * 0.5, G + 0.22, f);
      },
      34
    );
  },
  slots: [],
  cover: null
};

LAYOUTS.deer_pass = L => {
  const fixed = { fixed: true, rail: false };
  // the cowbells under the hut's balcony
  L.row({
    ...fixed,
    kind: "bell",
    n: 3,
    f: PASS.HUTF - 0.45,
    u0: PASS.HUT - 1.6,
    u1: PASS.HUT + 1.6,
    base: 2.3,
    size: 0.34,
    tint: "gold",
    bank: 3
  });
  // marmots sat up on the flat rocks, choughs on the fence
  L.row({ ...fixed, kind: "deer_marmot", n: 4, f: 9.5, u0: -3, u1: 3, size: 0.5, tint: "brown", bank: 4 });
  L.row({ kind: "crow", n: 6, f: 12.5, u0: -9, u1: 9, base: 1.15, size: 0.32, tint: "steel", bank: 3 });
  // up out of their burrows
  L.pops({
    fixed: true,
    f: 7.35,
    at: BURROWS.map(u => [u, 0.15]),
    size: 0.55,
    tint: "brown",
    kinds: [["deer_marmot", 100]]
  });
  // elk out on the meadow, goats up on the boulders
  L.row({ kind: "bigbuck", n: 4, f: 21, u0: -12, u1: 12, size: 1.6, tint: "brown" });
  for (const [u, f, top] of BOULDERS)
    L.row({ ...fixed, kind: "deer_goat", n: 1, f, u0: u, u1: u, base: top - 0.05, size: 0.8, tint: "white" });
  // out from behind the firs
  L.pops({
    fixed: true,
    peek: true,
    f: 33,
    at: CLUMPS.map(u => [u, 0]),
    size: 1.5,
    tint: "brown",
    slide: 2.6,
    kinds: [
      ["bigbuck", 45],
      ["buck", 25],
      ["hiker", 18, { dont: true }],
      ["deer_goat", 12]
    ]
  });
  // goats on the cliff's ledges, and up over its top
  for (const [u, top] of LEDGES)
    L.row({
      ...fixed,
      kind: "deer_goat",
      n: 1,
      f: PASS.CLIFF - 0.55,
      u0: u,
      u1: u,
      base: top,
      size: 0.85,
      tint: "white"
    });
  L.pops({
    fixed: true,
    f: PASS.CLIFF + 0.3,
    at: [-22.5, -2.5, 17.5].map(u => [u, cliffAt(u) - 0.35]),
    size: 1.0,
    tint: "white",
    period: [6, 9],
    busy: 0.6,
    kinds: [
      ["deer_goat", 85, { pts: 50 }],
      ["hiker", 15, { dont: true }]
    ]
  });
};

// A goat along the path across the cliff.
function ledgeGoat(R, add, t, c) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  add(
    t,
    "deer_ibex",
    cross(R, { u0: -dir * 30, u1: dir * 30, f: PASS.CLIFF - 0.5, h: PASS.PATH, v: R(2.8, 3.6) * c.S })
  );
}

const passWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the herd comes over the pass: elk in two bands, goats on the path, eagles over
    for (let k = 0; k < 9; k++)
      add(1 + k * 2.3, "deer_elk", run(R, { v: R(9, 12) * c.S, f: k % 2 ? R(16, 21) : R(26, 32) }));
    for (let k = 0; k < 3; k++) ledgeGoat(R, add, 2 + k * 8, c);
    for (let k = 0; k < 2; k++) add(5 + k * 10, "deer_eagle", soar(R, c));
    for (let k = 0; k < 2; k++) add(4 + k * 9, "deer_marmot", run(R, { v: R(7, 9) * c.S, f: R(4, 10) }));
    return;
  }
  const k = c.w % 6;
  const elk = m => {
    for (let j = 0; j < m; j++) add(R(1, 22), "deer_elk", run(R, { v: R(8.5, 11) * c.S, f: R(16, 33) }));
  };
  const marmots = m => {
    for (let j = 0; j < m; j++) add(R(1, 23), "deer_marmot", run(R, { v: R(6.5, 9) * c.S, f: R(4, 11) }));
  };
  const chamois = m => {
    for (let j = 0; j < m; j++) add(R(1, 22), "deer_chamois", run(R, { v: R(10, 13) * c.S, f: R(37, 41) }));
  };
  if (k === 0) (elk(1 + n(1.5)), marmots(1 + n(0.8)));
  else if (k === 1) {
    for (let j = 0; j < 1 + n(0.8); j++) ledgeGoat(R, add, R(1, 30), c);
    chamois(1);
    add(R(3, 18), "deer_eagle", soar(R, c));
  } else if (k === 2) (elk(1 + n(1)), marmots(1 + n(1)), flyers(["crow", "deer_eagle"], R, add, c, 2));
  else if (k === 3) (chamois(1 + n(1)), elk(1 + n(0.8)));
  else if (k === 4) {
    marmots(1 + n(1.2));
    ledgeGoat(R, add, R(1, 25), c);
    flyers(["crow", "deer_eagle"], R, add, c, 1 + n(1));
  } else (elk(1 + n(1)), chamois(n(0.8)), marmots(1));
  if (R(0, 1) < 0.35) stroll(R, add, R(1, 20), "deer_hikerRun", R(9, 16), R(1.3, 1.7));
};

// ---- Level 3: the snowy ridge ---------------------------------------------------------

// Winter on the far side of the pass: a frozen stream across in front of you,
// the ranger's cabin on the right, a snowfield with firs, the ridge across at
// CREST (its top at TOP) with the stags walking it, peaks behind.
const SNOW = 0xeef2f8;
const RIDGE = { STREAM: 6, CABIN: 15, CABINF: 12, CREST: 40, TOP: 4.6 };
const BANKS = [-14, -6, 6, 14];
const ICE_ROCKS = [-5, -1.7, 1.7, 5];
const SNOW_CLUMPS = [-19, -9, 9, 19];
const OUTCROPS = [
  [-30, 52, 7],
  [31, 54, 7.5]
];

function cabin(P, u, f) {
  const W = 6.4;
  const D = 5;
  P.add(BOX(W, 2.6, D), 0x6a4428, u, G + 1.3, f + D / 2);
  for (let k = 0; k < 7; k++)
    P.add(CYL(0.17, 0.17, W + 0.5, 6), k % 2 ? 0x7a5030 : 0x5e3c22, u, G + 0.2 + k * 0.37, f - 0.05, 0, 0, Math.PI / 2);
  gable(P, 0x6a4428, u, G + 2.6, f + D / 2, D, 1.7, W, true);
  // the roof, deep in snow, icicles off the eave
  for (const s of [-1, 1]) {
    const fc = f + D / 2 + s * 1.55;
    P.add(BOX(W + 1, 0.2, 3.6), 0x3a2a20, u, G + 3.45, fc, -s * 0.5);
    P.add(BOX(W + 1.1, 0.35, 3.7), SNOW, u, G + 3.45 + 0.24, fc + s * 0.12, -s * 0.5);
  }
  for (let k = 0; k < 12; k++)
    P.add(CONE(0.05, 0.3 + (k % 3) * 0.12, 4), 0xd8ecf8, u - W / 2 - 0.3 + k * 0.62, G + 2.45, f - 0.6, Math.PI);
  P.add(BOX(0.6, 1.6, 0.6), 0x7a7470, u + 1.8, G + 4.6, f + 2.8);
  P.add(BOX(0.7, 0.2, 0.7), SNOW, u + 1.8, G + 5.45, f + 2.8);
  smoke(P, u + 1.8, G + 6.1, f + 2.8, 0xc8ccd4);
  // lit windows, the door, the porch
  for (const du of [-2, 2]) {
    P.add(BOX(1.1, 0.95, 0.06), 0xffcf6a, u + du, G + 1.5, f - 0.24);
    P.add(BOX(1.3, 0.12, 0.08), 0x3a2414, u + du, G + 1.03, f - 0.25);
    P.add(BOX(0.08, 0.95, 0.08), 0x3a2414, u + du, G + 1.5, f - 0.26);
  }
  P.add(BOX(1.0, 2.0, 0.06), 0x3a2414, u, G + 1.0, f - 0.24);
  P.add(BOX(W, 0.12, 1.4), 0x7a5a3a, u, G + 0.06, f - 0.8);
  for (const s of [-1, 1]) P.add(BOX(0.18, 2.6, 0.18), 0x5a3a20, u + s * 2.4, G + 1.3, f - 1.4);
  P.add(BOX(W + 0.4, 0.14, 1.6), 0x3a2a20, u, G + 2.65, f - 0.8, 0.12);
  P.add(BOX(W + 0.5, 0.2, 1.7), SNOW, u, G + 2.82, f - 0.8, 0.12);
  // the woodpile and a sled
  for (let k = 0; k < 12; k++)
    P.add(
      CYL(0.13, 0.13, 1.2, 6),
      0x8a5a32,
      u + W / 2 + 0.6 + (k % 4) * 0.27,
      G + 0.14 + Math.floor(k / 4) * 0.26,
      f + 1,
      Math.PI / 2
    );
  P.add(BOX(1.2, 0.18, 1.3), SNOW, u + W / 2 + 1.0, G + 0.92, f + 1);
  for (const s of [-1, 1]) P.add(BOX(0.06, 0.08, 1.6), 0x8a2a1a, u - W / 2 - 1 + s * 0.3, G + 0.06, f - 1.2);
  P.add(BOX(0.7, 0.06, 1.2), 0x9a6a3a, u - W / 2 - 1, G + 0.3, f - 1.2);
}

// A bare tree, its branches up and out.
function bareTree(P, u, f, s = 1) {
  const c = 0x4a3a30;
  P.add(CYL(0.1 * s, 0.18 * s, 4.2 * s, 5), c, u, G + 2.1 * s, f);
  for (const [a, y, l] of [
    [0.7, 2.2, 1.6],
    [-0.8, 2.9, 1.4],
    [0.5, 3.5, 1.1],
    [-0.4, 1.6, 1.2]
  ])
    P.add(
      CYL(0.03 * s, 0.07 * s, l * s, 4),
      c,
      u + Math.sin(a) * l * 0.5 * s,
      G + (y + Math.cos(a) * l * 0.5) * s,
      f,
      0,
      0,
      -a
    );
}

// The ranger's hay rack for the deer.
function hayRack(P, u, f) {
  for (const s of [-1, 1])
    for (const d of [-0.5, 0.5]) P.add(BOX(0.1, 1.9, 0.1), 0x5a3a20, u + s * 1.4, G + 0.9, f + d, d * 0.5, 0, 0);
  P.add(BOX(2.6, 0.7, 0.7), 0xc8a04a, u, G + 1.2, f);
  P.add(BOX(3.2, 0.12, 1.6), 0x3a2a20, u, G + 1.95, f);
  P.add(BOX(3.3, 0.22, 1.7), SNOW, u, G + 2.1, f);
}

function snowman(P, u, f) {
  P.add(BALL(0.6, 8), SNOW, u, G + 0.5, f);
  P.add(BALL(0.42, 8), SNOW, u, G + 1.35, f);
  P.add(BALL(0.3, 8), SNOW, u, G + 1.95, f);
  P.add(CONE(0.06, 0.3, 5), 0xf27a1a, u, G + 1.95, f - 0.4, -Math.PI / 2);
  P.add(CYL(0.22, 0.22, 0.35, 8), 0x1a1a1a, u, G + 2.35, f);
  P.add(CYL(0.32, 0.32, 0.04, 8), 0x1a1a1a, u, G + 2.18, f);
  P.add(BOX(0.5, 0.1, 0.12), 0xc0182a, u, G + 1.7, f - 0.05);
  for (const s of [-1, 1]) P.add(CYL(0.025, 0.03, 0.9, 4), 0x4a3020, u + s * 0.7, G + 1.5, f, 0, 0, s * 1.0);
  for (let k = 0; k < 3; k++) P.add(BOX(0.07, 0.07, 0.04), 0x1a1a1a, u, G + 1.2 + k * 0.18, f - 0.42);
}

WORLDS.deer_ridge = {
  sky: {
    top: "#5a6a8a",
    mid: "#a8b0c8",
    horizon: "#f0d4cc",
    ground: "#e0e6ee",
    sun: [50, 6, "#ffe0c0", 15],
    clouds: 10,
    cloud: "rgba(232,232,242,0.6)",
    hills: [
      { colour: "#c8d0e0", height: 15, rough: 3, phase: 0.6 },
      { colour: "#9aa8c0", height: 8, rough: 4, phase: 2 },
      { colour: "#4a5a6a", height: 4, rough: 2, trees: true }
    ],
    seed: 62
  },
  fog: 0xd8dce8,
  signs: [
    ["RANGER STATION", RIDGE.CABIN, G + 2.25, RIDGE.CABINF - 1.5, 2.8, 0.42, "#5a3a1a", "#f2e2b8"],
    ["THIN ICE", -10, G + 1.1, 4.2, 1.3, 0.4, "#f4f4f0", "#c0182a"]
  ],
  build(P) {
    P.ground(SNOW, [
      { u: 0, f: 34, r: 14, c: 0xc8d4e4, sx: 4, sz: 0.4 },
      { u: 8, f: 9, r: 2, c: 0xd2d8e2, sx: 0.6, sz: 2.6 },
      { u: 0, f: RIDGE.STREAM, r: 4, c: 0xa8c8dc, sx: 12, sz: 0.26 },
      { u: 0, f: RIDGE.STREAM, r: 4, c: 0x5a7a94, sx: 12, sz: 0.07 },
      { u: -20, f: 22, r: 8, c: 0xdde4ee, sx: 1.6, sz: 0.5 }
    ]);
    // the peaks behind
    for (const [u, f, r, h] of [
      [-46, 70, 20, 30],
      [-18, 82, 26, 42],
      [8, 76, 18, 34],
      [30, 84, 24, 40],
      [52, 68, 18, 28]
    ])
      peak(P, u, f, r, h, 0x4a5466, 0xf4f8fc, 0.42);
    // the ridge: drifts along it, a cornice on its crest
    for (let k = 0; k < 9; k++)
      P.add(BALL(6, 10), k % 2 ? 0xe4ecf4 : 0xdce4ee, -44 + k * 11, G, RIDGE.CREST, 0, k, 0, 1.6, RIDGE.TOP / 6, 0.9);
    P.add(CYL(0.9, 0.9, 104, 8), 0xf4f8fc, 0, G + RIDGE.TOP - 0.9, RIDGE.CREST, 0, 0, Math.PI / 2);
    for (const [u, f, top] of OUTCROPS) {
      P.add(BOX(3, top, 3), 0x4a4e58, u, G + top / 2, f, 0, 0.5, 0);
      P.add(BOX(3.2, 0.4, 3.2), SNOW, u, G + top + 0.1, f, 0, 0.5, 0);
      P.add(BOX(2, top * 0.6, 2.4), 0x585c66, u + 2, G + top * 0.3, f + 1, 0, 0.2, 0);
    }
    // firs: along the crest, up the sides, two clumps the stags step out of
    const firAt = (u, f, s) => fir(P, u, f, s, [0x2a4a40, 0x24423a][Math.floor(P.r(0, 2))], SNOW);
    for (let u = -40; u <= 40; u += 6.5)
      if (Math.abs(u) > 4) firAt(u + P.r(-1.5, 1.5), RIDGE.CREST + 4 + P.r(0, 3), P.r(1.1, 1.6));
    P.scatter(34, 8, 34, (u, f, R) => (Math.abs(u) > 24 ? firAt(u, f, 1.1 + R() * 0.7) : null), 60);
    for (const u of SNOW_CLUMPS) {
      firAt(u + 0.3, 26.9, 1.25);
      snowRock(P, u, 26.3, 1.4);
    }
    // the stream: banks of snow, stones in the ice, reeds frozen stiff
    for (let u = -36; u <= 36; u += 3.6) {
      P.add(BALL(1, 6), SNOW, u, G + 0.02, RIDGE.STREAM + 1.4, 0, u, 0, 1.8, 0.42, 0.7);
      if (Math.abs(u) > 10) P.add(BALL(1, 6), SNOW, u + 1.8, G + 0.02, RIDGE.STREAM - 1.4, 0, u, 0, 1.8, 0.35, 0.6);
    }
    for (const u of BANKS) P.add(BALL(1, 6), 0xf4f8fc, u, G + 0.05, RIDGE.STREAM + 1.3, 0, 0, 0, 1.2, 0.5, 0.7);
    for (const u of ICE_ROCKS) snowRock(P, u, 5, 0.75);
    for (const u of [-18, -11, 10.5, 19]) P.reeds(u, RIDGE.STREAM + 0.9, 0.7);
    // the cabin, a snowman, a buried fence's posts, rocks in the snowfield
    cabin(P, RIDGE.CABIN, RIDGE.CABINF);
    snowman(P, -17, 11);
    hayRack(P, 24, 17);
    for (const [u, f, s] of [
      [-12, 18.5, 1],
      [12, 18.5, 1.1],
      [-3, 32, 1.2],
      [4, 33.5, 1],
      [-27, 12, 1.2]
    ])
      bareTree(P, u, f, s);
    P.add(BOX(0.1, 1.2, 0.1), 0x5a3a20, -10, G + 0.6, 4.25);
    P.scatter(22, 14, 34, (u, f, R) => snowRock(P, u, f, 0.8 + R() * 1.2), 34);
  },
  slots: [],
  cover: null
};

LAYOUTS.deer_ridge = L => {
  const fixed = { fixed: true, rail: false };
  // ptarmigan on the stones in the ice, hares in the snow
  L.row({
    ...fixed,
    kind: "deer_grouse",
    n: 4,
    f: 5,
    u0: ICE_ROCKS[0],
    u1: ICE_ROCKS[3],
    base: 0.4,
    size: 0.36,
    tint: "white",
    bank: 4
  });
  L.row({ kind: "rabbit", n: 6, f: 3, u0: -8, u1: 8, size: 0.45, tint: "white", bank: 3 });
  // the porch lanterns
  L.row({
    ...fixed,
    kind: "lantern",
    n: 2,
    f: RIDGE.CABINF - 1.5,
    u0: RIDGE.CABIN - 2.4,
    u1: RIDGE.CABIN + 2.4,
    base: 2.12,
    size: 0.34,
    tint: "gold",
    bank: 2
  });
  // up from behind the snowbanks (the ranger: don't)
  L.pops({
    fixed: true,
    f: RIDGE.STREAM + 1.7,
    at: BANKS.map(u => [u, 0.35]),
    size: 0.5,
    tint: "white",
    kinds: [
      ["rabbit", 45],
      ["deer_grouse", 35],
      ["ranger", 20, { dont: true }]
    ]
  });
  // ravens on a buried fence, stags in the snowfield
  L.row({ kind: "crow", n: 5, f: 16, u0: -10, u1: 10, base: 0.9, size: 0.34, tint: "steel", bank: 5 });
  L.row({ kind: "bigbuck", n: 4, f: 21, u0: -13, u1: 13, size: 1.6, tint: "brown" });
  L.pops({
    fixed: true,
    peek: true,
    f: 27.2,
    at: SNOW_CLUMPS.map(u => [u, 0]),
    size: 1.5,
    tint: "brown",
    slide: 2.6,
    kinds: [
      ["bigbuck", 35],
      ["buck", 30],
      ["doe", 20],
      ["ranger", 15, { dont: true }]
    ]
  });
  // the stags along the ridge, more up over its crest, goats on the rocks behind
  L.row({
    ...fixed,
    kind: "bigbuck",
    n: 5,
    f: RIDGE.CREST,
    u0: -24,
    u1: 24,
    base: RIDGE.TOP - 0.05,
    size: 1.5,
    tint: "brown",
    bank: 5
  });
  L.pops({
    fixed: true,
    f: RIDGE.CREST + 0.8,
    at: [-30, -6, 18].map(u => [u, RIDGE.TOP - 0.4]),
    size: 1.5,
    tint: "brown",
    period: [6, 9],
    kinds: [
      ["bigbuck", 60, { pts: 50 }],
      ["buck", 40]
    ]
  });
  for (const [u, f, top] of OUTCROPS)
    L.row({
      ...fixed,
      kind: "deer_goat",
      n: 1,
      f: f - 0.5,
      u0: u,
      u1: u,
      base: top + 0.25,
      size: 1.0,
      tint: "white",
      pts: 50
    });
};

// A stag along the ridge's crest.
function crestStag(R, add, t, c, dir = R(0, 1) < 0.5 ? 1 : -1) {
  add(t, "deer_stagSnow", cross(R, { u0: -dir * 34, u1: dir * 34, f: RIDGE.CREST, h: RIDGE.TOP, v: R(3.8, 5) * c.S }));
}

const ridgeWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the herd crosses the ridge nose to tail; ptarmigan up off the snow
    const dir = R(0, 1) < 0.5 ? 1 : -1;
    for (let k = 0; k < 8; k++)
      add(
        1 + k * 1.8,
        "deer_stagSnow",
        cross(R, { u0: -dir * 34, u1: dir * 34, f: RIDGE.CREST, h: RIDGE.TOP, v: 4.4 * c.S })
      );
    for (let k = 0; k < 3; k++) add(4 + k * 6, "deer_stagSnow", run(R, { v: R(10, 13) * c.S, f: R(16, 30) }));
    for (let k = 0; k < 8; k++) add(2 + k * 2.6, "deer_ptarmigan", flush(R, { S: c.S * 1.1, f: R(8, 22) }));
    return;
  }
  const k = c.w % 6;
  const stags = m => {
    for (let j = 0; j < m; j++) add(R(1, 22), "deer_stagSnow", run(R, { v: R(10, 13) * c.S, f: R(15, 32) }));
  };
  const hares = m => {
    for (let j = 0; j < m; j++) add(R(1, 23), "deer_hare", run(R, { v: R(8, 11) * c.S, f: R(4, 12) }));
  };
  const ptarmigan = m => {
    for (let j = 0; j < m; j++)
      add(2 + (j * 24) / m + R(0, 2), "deer_ptarmigan", flush(R, { S: c.S * 1.1, f: R(8, 24) }));
  };
  if (k === 0) (stags(1 + n(1.2)), hares(1 + n(0.8)));
  else if (k === 1) {
    for (let j = 0; j < 1 + n(1); j++) crestStag(R, add, R(1, 30), c);
    ptarmigan(2 + n(1.5));
  } else if (k === 2) (hares(1 + n(1.2)), flyers(["crow", "crow"], R, add, c, 2), stags(1));
  else if (k === 3) (stags(1 + n(1)), crestStag(R, add, R(1, 30), c));
  else if (k === 4) (ptarmigan(3 + n(2)), hares(1 + n(1)));
  else (stags(1 + n(0.8)), crestStag(R, add, R(1, 28), c), hares(1));
  if (R(0, 1) < 0.35) stroll(R, add, R(1, 20), "deer_rangerRun", R(11, 15), R(1.2, 1.6));
};

// ---- Level 4: the Highlands ------------------------------------------------------------

// A moor at golden hour: heather to a dry-stone wall at WALL (a gate in it),
// the bothy on the right, a second wall at WALL2, the loch with its ruined
// castle on a rock, stags on the hill beyond, the monarch on his crag.
const MOOR = { WALL: 10, WALLH: 0.65, GATE: 3, BOTHY: 24, BOTHYF: 16, WALL2: 26, LOCH: 43, CASTLE: -14, CASTLEF: 49 };
const HEATHER = [0x8a4a7a, 0x9a5a8a, 0x6a3a5a, 0x7a4a6a];
const STONE = [0x6a685e, 0x8a887c, 0x7a786e];
const HEATHER_POPS = [-12, -5, 5, 12];
const WALL2_POPS = [-24, 24];
const HAGS = [-10, 10];
const KEEP_WIN = [
  [-2, 4],
  [-2, 8.2]
];

// A dry-stone wall from u0 to u1, capstones on edge along its top.
function dryStone(P, u0, u1, f, every = 0.55, faces = 0, hgt = 0.95) {
  const len = u1 - u0;
  P.add(BOX(len, hgt, 0.75), 0x7a786e, (u0 + u1) / 2, G + hgt / 2, f);
  for (let u = u0 + 0.2; u < u1; u += every)
    P.add(
      BOX(0.24, 0.34, 0.8),
      STONE[Math.floor(Math.abs(u) * 7) % 3],
      u,
      G + hgt + 0.13,
      f,
      0,
      0,
      Math.sin(u * 3) * 0.25
    );
  for (let k = 0; k < faces; k++) {
    const u = u0 + ((k + 0.5) * len) / faces;
    P.add(BOX(0.5 + (k % 3) * 0.15, 0.22, 0.08), STONE[k % 3], u, G + 0.15 + ((k * 7) % 4) * hgt * 0.17, f - 0.38);
  }
}

function bothy(P, u, f) {
  const W = 7;
  const D = 4.4;
  const H = 2.3;
  const white = 0xe2ddd0;
  P.add(BOX(W, H, D), white, u, G + H / 2, f + D / 2);
  P.add(BOX(W + 0.2, 0.5, D + 0.2), 0x7a766a, u, G + 0.25, f + D / 2);
  gable(P, white, u, G + H, f + D / 2, D, 1.8, W, true);
  const a = Math.atan2(1.8, D / 2);
  const len = Math.hypot(1.8, D / 2) + 0.5;
  for (const s of [-1, 1]) P.add(BOX(W + 0.5, 0.4, len), 0x8a6a3a, u, G + H + 1.05, f + D / 2 + (s * D) / 4, -s * a);
  P.add(CYL(0.3, 0.3, W + 0.5, 6), 0x6a4a2a, u, G + H + 1.95, f + D / 2, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) P.add(BOX(0.7, 1.4, 0.7), 0x8a8478, u + s * (W / 2 - 0.3), G + H + 2.0, f + D / 2);
  smoke(P, u + W / 2 - 0.3, G + H + 3.1, f + D / 2, 0xb8a898);
  P.add(BOX(0.9, 1.8, 0.06), 0x2a4a5a, u - 1, G + 0.9, f - 0.03);
  for (const du of [1.4, -2.8]) {
    P.add(BOX(0.75, 0.65, 0.06), 0x2a2a30, u + du, G + 1.4, f - 0.03);
    P.add(BOX(0.85, 0.08, 0.1), 0xf4f0e8, u + du, G + 1.05, f - 0.06);
  }
  P.add(BOX(1.6, 0.9, 1.0), 0x4a3020, u - W / 2 - 1.2, G + 0.45, f + 0.8);
  P.add(BOX(1.2, 0.5, 0.8), 0x3a2418, u - W / 2 - 1.2, G + 1.15, f + 0.8);
}

function castle(P, u, f) {
  const S = 0x8a8476;
  const S2 = 0x7a7468;
  const IVY = 0x4a6a32;
  const DARK = 0x1a1814;
  P.add(BOX(18, 2.6, 11), 0x6a665a, u, G + 1.3, f + 3.5);
  for (let k = 0; k < 7; k++) P.rock(u - 9 + k * 3, f - 2.4 + (k % 2) * 0.6, 1.8, 0x6a665a);
  const top = G + 2.6;
  // the keep, its top broken off
  P.add(BOX(5.2, 12, 5.2), S, u - 2, top + 6, f + 2.6);
  for (const [du, h, w] of [
    [-1.6, 1.8, 2],
    [0.4, 0.8, 1.4],
    [1.8, 2.6, 1.6]
  ])
    P.add(BOX(w, h, 5.2), S, u - 2 + du, top + 12 + h / 2, f + 2.6);
  for (const [du, h] of KEEP_WIN) P.add(BOX(1.0, 1.5, 0.1), DARK, u + du, top + h + 0.75, f - 0.02);
  P.add(BOX(0.3, 1.0, 0.1), DARK, u - 3.4, top + 10.6, f - 0.02);
  P.add(BOX(1.6, 3.4, 0.4), IVY, u - 4.2, top + 1.7, f - 0.05);
  // the curtain wall each side, ragged, a broken gateway
  [3.4, 2.4, 4.0, 2.8].forEach((h, k) => P.add(BOX(1.15, h, 0.9), S2, u - 9 + k * 1.1, top + h / 2, f + 0.6));
  [4.2, 3.0, 0, 0, 3.6, 2.6].forEach((h, k) => {
    if (h) P.add(BOX(1.0, h, 0.9), S2, u + 1.2 + k * 0.9, top + h / 2, f + 0.6);
  });
  P.add(BOX(1.8, 2.2, 0.1), DARK, u + 3.45, top + 1.1, f + 1.1);
  // the round tower at the corner, crenels round its top
  P.add(CYL(1.9, 2.1, 9, 12), S, u + 7.2, top + 4.5, f + 1.5);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    P.add(BOX(0.6, 0.6, 0.5), S, u + 7.2 + Math.cos(a) * 1.75, top + 9.3, f + 1.5 + Math.sin(a) * 1.75, 0, -a, 0);
  }
  P.add(BOX(0.3, 1.1, 0.1), DARK, u + 7.2, top + 6, f - 0.45);
  P.add(BOX(1.4, 2.4, 0.3), IVY, u + 6.4, top + 2, f - 0.25);
}

function highlandCow(P, u, f, ry) {
  const c = 0xb8622a;
  const dx = Math.cos(ry);
  const dz = Math.sin(ry);
  P.add(BOX(1.7, 1.0, 0.85), c, u, G + 1.05, f, 0, ry, 0);
  P.add(BOX(1.75, 0.3, 0.9), 0x9a4a1a, u, G + 0.6, f, 0, ry, 0);
  P.add(BOX(0.55, 0.55, 0.55), c, u + dx * 1.05, G + 1.15, f + dz * 1.05, 0, ry, 0);
  P.add(
    CYL(0.04, 0.06, 1.1, 4),
    0xe8d8b0,
    u + dx * 1.1,
    G + 1.45,
    f + dz * 1.1,
    0,
    ry + Math.PI / 2,
    Math.PI / 2 - 0.3
  );
  for (const [x, z] of [
    [-0.6, -0.25],
    [0.6, -0.25],
    [-0.6, 0.25],
    [0.6, 0.25]
  ])
    P.add(BOX(0.16, 0.6, 0.16), 0x7a3a18, u + dx * x + dz * z, G + 0.3, f + dz * x - dx * z, 0, ry, 0);
}

function scotsPine(P, u, f, s = 1) {
  P.add(CYL(0.16 * s, 0.24 * s, 5 * s, 6), 0xa0583a, u, G + 2.5 * s, f, 0, 0, 0.06);
  P.add(BALL(1.7 * s, 7), 0x2a4a30, u + 0.3 * s, G + 5.4 * s, f, 0, u, 0, 1.3, 0.45, 1.1);
  P.add(BALL(1.2 * s, 7), 0x325438, u - 0.8 * s, G + 4.6 * s, f + 0.3, 0, u, 0, 1.3, 0.45, 1.1);
}

WORLDS.deer_moor = {
  sky: {
    top: "#3a4a8a",
    mid: "#d88a5a",
    horizon: "#ffc878",
    ground: "#5a4a3a",
    sun: [-30, 5, "#fff0b0", 18],
    clouds: 8,
    cloud: "rgba(255,190,140,0.5)",
    hills: [
      { colour: "#8a5a6a", height: 9, rough: 2, phase: 0.4 },
      { colour: "#5a4a4a", height: 5, rough: 3, phase: 2.2 }
    ],
    seed: 63
  },
  fog: 0xd89a6a,
  signs: [["GLEN DUBH ESTATE", 4.9, G + 1.75, MOOR.WALL - 0.5, 2.4, 0.42, "#2a3a2a", "#f2e2b8"]],
  build(P) {
    P.ground(0x7a6a3a, [
      { u: 0, f: 6, r: 14, c: 0x6a4a52, sx: 2.6, sz: 0.4 },
      { u: -20, f: 20, r: 10, c: 0x7a4a62, sx: 1.6, sz: 0.5 },
      { u: 16, f: 28, r: 8, c: 0x9a5a2a, sx: 1.8, sz: 0.4 },
      { u: 0, f: 19, r: 1.6, c: 0x8a7a5a, sx: 0.7, sz: 5 },
      { u: -2, f: MOOR.LOCH, r: 17, c: 0x8a8070, sx: 2.6, sz: 0.74 },
      { u: -2, f: MOOR.LOCH, r: 16, c: 0x6a8ab8, sx: 2.6, sz: 0.72 },
      { u: -26, f: 36, r: 1.4, c: 0xf0b070, sx: 3.4, sz: 0.6 },
      { u: -30, f: 42, r: 1.2, c: 0xe8a868, sx: 3, sz: 0.5 }
    ]);
    // the hills beyond the loch, the monarch's crag
    for (const [u, f, r, c] of [
      [-44, 78, 22, 0x6a5a5a],
      [0, 84, 26, 0x7a5a5a],
      [46, 76, 22, 0x6a5050],
      [22, 64, 14, 0x7a6448],
      [-30, 66, 12, 0x6a5a42]
    ])
      P.add(BALL(r, 10), c, u, G - r * 0.05, f, 0, u, 0, 1.6, 0.35, 0.7);
    P.add(BOX(3, 6, 3), 0x6a6458, -34, G + 3, 62, 0, 0.4, 0);
    P.add(BOX(2.2, 4, 2.6), 0x5a564a, -35.5, G + 2, 61, 0, 0.2, 0);
    P.rock(-32, 60.5, 1.6, 0x6a6458);
    // the loch and its castle
    castle(P, MOOR.CASTLE, MOOR.CASTLEF);
    for (let k = 0; k < 10; k++) P.reeds(-30 + k * 6.5 + (k % 2) * 1.5, MOOR.LOCH - 12, 0.6);
    // a boat out on the water, the jetty it came from
    P.add(BOX(2.6, 0.4, 1.0), 0x6a3a1e, 6, G + 0.35, 36, 0, 0.3, 0);
    P.add(BOX(2.2, 0.12, 0.75), 0x3a2414, 6, G + 0.5, 36, 0, 0.3, 0);
    P.add(BOX(3.2, 0.05, 0.08), 0xa07a4a, 6, G + 0.6, 36, 0, 0.3 + Math.PI / 2, 0.2);
    P.add(SLAB(1.4, 0.12, 4.5), 0x7a5a3a, 11, G + 0.45, 32.75);
    for (let k = 0; k < 3; k++)
      for (const s of [-1, 1]) P.add(CYL(0.07, 0.08, 0.9, 5), 0x4a3020, 11 + s * 0.6, G + 0.2, 30.8 + k * 2);
    // the walls: the near one with its gate, the far one in two runs
    dryStone(P, -34, -MOOR.GATE - 0.35, MOOR.WALL, 0.55, 26, MOOR.WALLH);
    dryStone(P, MOOR.GATE + 0.35, 34, MOOR.WALL, 0.55, 26, MOOR.WALLH);
    for (const s of [-1, 1]) P.add(BOX(0.7, 1.1, 0.85), 0x6a685e, s * MOOR.GATE, G + 0.55, MOOR.WALL);
    for (let k = 0; k < 5; k++)
      P.add(BOX(0.06, 0.08, 2.4), 0x9a8a6a, -MOOR.GATE + 0.4 + 1.0, G + 0.3 + k * 0.25, MOOR.WALL - 1.1, 0, -0.9, 0);
    P.add(BOX(0.08, 1.25, 0.08), 0x5a4a32, 4.9, G + 0.62, MOOR.WALL - 0.45);
    dryStone(P, -34, -17, MOOR.WALL2, 0.85, 0, 0.6);
    dryStone(P, 17, 34, MOOR.WALL2, 0.85, 0, 0.6);
    // peat hags out on the moor
    for (const u of HAGS) {
      P.add(BALL(1.2, 6), 0x3a2a1e, u, G + 0.05, 24, 0, u, 0, 1.4, 0.55, 0.8);
      P.add(BALL(1.1, 6), 0x6a5a32, u, G + 0.18, 24.1, 0, u, 0, 1.4, 0.45, 0.8);
    }
    // the bothy, cattle by the water, Scots pines
    bothy(P, MOOR.BOTHY, MOOR.BOTHYF);
    highlandCow(P, 29, 28, 0.3);
    highlandCow(P, 33, 29.5, 2.6);
    highlandCow(P, 36.5, 27, 0.1);
    for (const [u, f, s] of [
      [-30, 14, 1.2],
      [-36, 22, 1.4],
      [-27, 31, 1.1],
      [34, 18, 1.2],
      [38, 26, 1.4],
      [30, 12, 1.0],
      [44, 54, 1.2],
      [-42, 52, 1.3]
    ])
      scotsPine(P, u, f, s);
    // heather, thick in front, thinner up the moor; bracken
    P.scatter(
      96,
      0.5,
      9.3,
      (u, f, R) => P.add(BALL(0.42, 5), HEATHER[Math.floor(R() * 4)], u, G + 0.08, f, 0, R() * 3, 0, 1.4, 0.55, 1.1),
      34
    );
    for (const u of HEATHER_POPS) P.add(BALL(0.6, 6), 0x8a4a7a, u, G + 0.1, 6.0, 0, u, 0, 1.4, 0.6, 0.9);
    P.scatter(
      40,
      12,
      37,
      (u, f, R) =>
        P.add(
          BALL(0.5, 5),
          R() < 0.6 ? HEATHER[Math.floor(R() * 4)] : 0x9a5a2a,
          u,
          G + 0.05,
          f,
          0,
          R() * 3,
          0,
          1.5,
          0.5,
          1.2
        ),
      40
    );
  },
  slots: [],
  cover: null
};

LAYOUTS.deer_moor = L => {
  const fixed = { fixed: true, rail: false };
  // mountain hares in the heather, grouse along the wall, a dram on each gatepost
  L.row({ kind: "rabbit", n: 4, f: 8, u0: -7, u1: 7, size: 0.42, tint: "white", bank: 4 });
  for (const s of [-1, 1])
    L.row({
      ...fixed,
      kind: "deer_grouse",
      n: 4,
      f: MOOR.WALL,
      u0: s * 16,
      u1: s * 7.5,
      base: MOOR.WALLH + 0.17,
      size: 0.42,
      tint: "brown",
      bank: 4
    });
  L.row({
    ...fixed,
    kind: "bottle",
    n: 2,
    f: MOOR.WALL,
    u0: -MOOR.GATE,
    u1: MOOR.GATE,
    base: 1.1,
    size: 0.3,
    tint: ["brown", "green"],
    bank: 2
  });
  // grouse up out of the heather
  L.pops({
    fixed: true,
    f: 6.35,
    at: HEATHER_POPS.map(u => [u, 0.2]),
    size: 0.45,
    tint: "brown",
    kinds: [
      ["deer_grouse", 85],
      ["rabbit", 15]
    ]
  });
  // red stags on the moor, ravens on the bothy's ridge, a stag round its end
  L.row({ kind: "bigbuck", n: 3, f: 19, u0: -10, u1: 10, size: 1.6, tint: "orange" });
  L.row({
    ...fixed,
    kind: "crow",
    n: 3,
    f: MOOR.BOTHYF + 2.2,
    u0: MOOR.BOTHY - 2.4,
    u1: MOOR.BOTHY + 2.4,
    base: 4.4,
    size: 0.36,
    tint: "steel",
    bank: 3
  });
  L.pops({
    fixed: true,
    peek: true,
    f: MOOR.BOTHYF + 0.8,
    at: [[MOOR.BOTHY + 1.8, 0]],
    size: 1.5,
    tint: "orange",
    slide: 2.8,
    kinds: [
      ["bigbuck", 60],
      ["doe", 40]
    ]
  });
  // over the far wall: stags and hinds, and the Highland cattle (don't)
  L.pops({
    fixed: true,
    f: MOOR.WALL2 + 0.5,
    at: [...WALL2_POPS.map(u => [u, 0.4]), ...HAGS.map(u => [u, 0.2])],
    size: 1.45,
    tint: "orange",
    kinds: [
      ["deer_cow", 35, { dont: true }],
      ["bigbuck", 30],
      ["doe", 20],
      ["buck", 15]
    ]
  });
  // the castle: ravens and owls in its windows, a stag in its gate
  L.pops({
    fixed: true,
    f: MOOR.CASTLEF - 0.35,
    at: KEEP_WIN.map(([du, h]) => [MOOR.CASTLE + du, 2.6 + h + 0.05]),
    size: 0.9,
    tint: "steel",
    period: [5, 8],
    kinds: [
      ["crow", 65],
      ["owl", 35]
    ]
  });
  L.pops({
    fixed: true,
    f: MOOR.CASTLEF + 0.7,
    at: [[MOOR.CASTLE + 3.45, 2.6]],
    size: 1.4,
    tint: "orange",
    period: [6, 9],
    kinds: [
      ["bigbuck", 70, { pts: 50 }],
      ["deer_cow", 30, { dont: true }]
    ]
  });
  // stags on the hill beyond the loch, the monarch on his crag
  L.row({ ...fixed, kind: "bigbuck", n: 4, f: 58, u0: 4, u1: 34, size: 1.7, tint: "orange", bank: 2 });
  L.row({ ...fixed, kind: "bigbuck", n: 1, f: 61.4, u0: -34, u1: -34, base: 6, size: 2.0, tint: "gold", pts: 50 });
};

const moorWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the drive: the beaters push covey after covey over the guns
    for (let k = 0; k < 6; k++) covey(R, add, 1 + k * 4, c, "deer_grouse", 4, { f: R(8, 22) });
    for (let k = 0; k < 3; k++) add(3 + k * 8, "deer_redStag", run(R, { v: R(11, 14) * c.S, f: R(15, 36) }));
    return;
  }
  const k = c.w % 6;
  const stags = (m, kind = "deer_redStag") => {
    for (let j = 0; j < m; j++) add(R(1, 22), kind, run(R, { v: R(10, 13) * c.S, f: R(14, 36) }));
  };
  const grouse = m => {
    for (let j = 0; j < m; j++) add(2 + (j * 24) / m + R(0, 2), "deer_grouse", flush(R, { S: c.S * 1.3, f: R(6, 18) }));
  };
  const rut = () => {
    const side = R(0, 1) < 0.5 ? 1 : -1;
    add(R(2, 18), "deer_rutStag", charge(R, { v: R(8, 10) * c.S, f0: R(30, 37), u0: side * R(16, 26) }));
  };
  if (k === 0) (stags(1 + n(1.2)), grouse(2 + n(1)));
  else if (k === 1) (covey(R, add, R(2, 12), c, "deer_grouse", 3 + n(1)), stags(1 + n(0.8), "deer_hind"));
  else if (k === 2) (stags(1 + n(1.2)), flyers(["crow", "deer_eagle"], R, add, c, 2));
  else if (k === 3) (rut(), grouse(1 + n(1)), stags(1));
  else if (k === 4) (stags(1 + n(1)), stags(1 + n(0.8), "deer_hind"));
  else {
    covey(R, add, R(2, 8), c, "deer_grouse", 3);
    stags(1 + n(0.8));
    if (R(0, 1) < 0.5) rut();
  }
  if (R(0, 1) < 0.4) stroll(R, add, R(1, 16), "deer_cattle", R(19, 30), R(1.1, 1.5));
};

// ---- Level 5: the old king of the forest -------------------------------------------

// An ancient wood at moonrise: giant trees either side of a path to the
// glade, where the stone circle stands under the moon. A fallen giant across
// the path in front of you, ferns, toadstools, fireflies.
const WOOD = { LOG: 16, LOGU: -11, GLADE: 44 };
// [u, f, trunk radius, trunk height]
const GIANTS = [
  [-11, 8, 1.6, 16],
  [12, 9, 1.8, 17],
  [-23, 19, 2.2, 18],
  [24, 21, 2.0, 18],
  [-15, 31, 1.6, 16],
  [16, 33, 1.7, 17],
  [-33, 34, 2.4, 19],
  [34, 38, 2.4, 19],
  [-8, 58, 2.0, 18],
  [9, 60, 2.2, 19],
  [-30, 50, 2.0, 17],
  [31, 52, 2.0, 17]
];
const PEEK_TREES = [2, 3, 4, 5];
const FERN_POPS = [-17, 8, 17];
const ROCKS5 = [
  [-24, 46, 1.6],
  [24, 47, 1.6]
];
// owls on branches: [u, f, base]
const BRANCH_OWLS = [
  [-30.5, 33.6, 7],
  [-5.8, 57.6, 8],
  [6.8, 59.6, 9]
];

function giant(P, u, f, r, h) {
  const bark = 0x4a3e32;
  P.add(CYL(r * 0.75, r, h, 10), bark, u, G + h / 2, f, 0, u, 0);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + u;
    P.add(
      CONE(r * 0.5, r * 2.2, 5),
      0x42362a,
      u + Math.cos(a) * r * 0.95,
      G + r * 0.45,
      f + Math.sin(a) * r * 0.95,
      Math.sin(a) * 1.1,
      0,
      Math.cos(a) * 1.1
    );
  }
  for (const s of [-1, 1, -0.4]) {
    const y = h * (s > 0 ? 0.62 : 0.74);
    P.add(CYL(r * 0.22, r * 0.4, r * 5, 6), bark, u + s * r * 1.8, G + y + r, f, 0, 0, -s * 1.0);
    P.add(BALL(r * 2.2, 8), 0x1e3424, u + s * r * 3.6, G + y + r * 2.6, f, 0, 0, 0, 1.2, 0.7, 1);
  }
  for (const [du, dy, df] of [
    [0, 0.5, 0],
    [-1.8, 0, 0.6],
    [1.6, -0.4, -0.5]
  ])
    P.add(BALL(r * 2.6, 8), 0x1a2e20, u + du * r, G + h + dy * r + r, f + df * r, 0, 0, 0, 1.2, 0.75, 1.1);
  P.add(BALL(r * 0.6, 5), 0x4a6a2a, u - r * 0.75, G + 1.4, f - r * 0.3, 0, 0, 0, 0.5, 1.6, 0.8);
  P.add(BALL(r * 0.5, 5), 0x4a6a2a, u + r * 0.6, G + 2.4, f - r * 0.5, 0, 0, 0, 0.5, 1.4, 0.8);
}

// A fern: fronds arched out round a middle.
function fern(P, u, f, s = 1, c = 0x3a6a32) {
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + u * 3;
    const t = 0.9;
    const dx = Math.sin(t) * Math.cos(a);
    const dz = Math.sin(t) * Math.sin(a);
    P.add(
      BOX(0.16 * s, 1.0 * s, 0.03),
      c,
      u + dx * 0.5 * s,
      G + Math.cos(t) * 0.5 * s + 0.05,
      f + dz * 0.5 * s,
      Math.atan2(-dz, Math.cos(t)),
      0,
      -Math.asin(dx)
    );
  }
}

function toadstools(P, u, f, n = 3) {
  for (let k = 0; k < n; k++) {
    const x = u + (k - 1) * 0.28;
    const z = f + (k % 2) * 0.2;
    const s = 1 - k * 0.2;
    P.add(CYL(0.04 * s, 0.05 * s, 0.24 * s, 5), 0xeae0cc, x, G + 0.12 * s, z);
    P.add(BALL(0.14 * s, 6), 0xc8302a, x, G + 0.24 * s, z, 0, 0, 0, 1, 0.55, 1);
    P.add(BOX(0.04, 0.03, 0.04), 0xffffff, x, G + 0.31 * s, z - 0.06);
  }
}

WORLDS.deer_wood = {
  sky: {
    top: "#050818",
    mid: "#141c3c",
    horizon: "#4a5a7a",
    ground: "#10160f",
    sun: [0, 17, "#f4f0d0", 20],
    stars: true,
    clouds: 4,
    cloud: "rgba(150,160,190,0.25)",
    hills: [
      { colour: "#16203a", height: 12, rough: 3, trees: true, phase: 1.2 },
      { colour: "#0a1220", height: 7, rough: 3, trees: true }
    ],
    seed: 64
  },
  fog: 0x26324a,
  signs: [["THE KING'S GLADE", -7.6, G + 1.55, 9.6, 2.4, 0.42, "#2a2418", "#c8d8c0"]],
  build(P) {
    P.ground(0x22301e, [
      { u: 0, f: 18, r: 20, c: 0x2e3020, sx: 1.6, sz: 0.6 },
      { u: 0, f: 26, r: 2, c: 0x2c2e20, sx: 0.8, sz: 10 },
      { u: 0, f: WOOD.GLADE, r: 10, c: 0x4a6460, sx: 1.4, sz: 0.7 },
      { u: -18, f: 28, r: 9, c: 0x2a4428, sx: 1.8, sz: 0.5 },
      { u: 20, f: 14, r: 7, c: 0x2a4428, sx: 1.6, sz: 0.5 },
      { u: 0, f: WOOD.GLADE, r: 5, c: 0x5a7a72, sx: 1.4, sz: 0.7 }
    ]);
    for (const [u, f, r, h] of GIANTS) giant(P, u, f, r, h);
    // the branches the owls sit on
    for (const [u, f, base] of BRANCH_OWLS)
      P.add(CYL(0.16, 0.24, 3.4, 6), 0x4a3e32, u, G + base - 0.16, f + 0.1, 0, 0, Math.PI / 2);
    // the stone circle, its altar, moss
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k / 8) * Math.PI * 2;
      const su = Math.cos(a) * 7;
      const sf = WOOD.GLADE + Math.sin(a) * 4;
      P.add(BOX(1.1, 2.6 + (k % 3) * 0.5, 0.7), 0x7a8a80, su, G + 1.3, sf, 0, -a, (k % 2 ? 1 : -1) * 0.06);
      P.add(BOX(0.6, 0.5, 0.75), 0x4a6a3a, su, G + 0.4, sf, 0, -a, 0);
    }
    for (const s of [-1, 1]) P.add(BOX(0.5, 0.6, 0.8), 0x6a7a70, s * 0.8, G + 0.3, WOOD.GLADE);
    P.add(BOX(2.4, 0.4, 1.3), 0x8a9a90, 0, G + 0.8, WOOD.GLADE);
    // a fairy ring of glowing caps round the stones
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      P.add(BALL(0.11, 5), 0x9af0d8, Math.cos(a) * 9, G + 0.08, WOOD.GLADE + Math.sin(a) * 5.4, 0, 0, 0, 1, 0.6, 1);
    }
    // the fallen giant off the path, toadstools and brackets on it and round it
    const LU = WOOD.LOGU;
    P.add(CYL(0.75, 0.85, 9, 10), 0x4a3c30, LU, G + 0.75, WOOD.LOG, 0, 0, Math.PI / 2);
    for (let k = 0; k < 3; k++)
      P.add(BALL(0.6, 6), 0x3e5a2a, LU - 3 + k * 3, G + 1.35, WOOD.LOG + 0.05, 0, 0, 0, 1.6, 0.4, 1);
    P.add(BALL(1.5, 7), 0x3a2e22, LU - 4.7, G + 1.1, WOOD.LOG + 0.5, 0, 0, 0, 0.4, 1, 1);
    for (const [u, f] of [
      [LU + 2.5, WOOD.LOG - 0.9],
      [LU - 2, WOOD.LOG - 0.9],
      [6, 12.2],
      [-5, 10.5],
      [14, 22],
      [-20, 24]
    ])
      toadstools(P, u, f);
    for (let k = 0; k < 3; k++)
      P.add(CYL(0.26, 0.22, 0.07, 8), 0xc8823a, LU - 2.6 + k * 1.7, G + 0.55 + (k % 2) * 0.35, WOOD.LOG - 0.8);
    for (const [u, f, top] of ROCKS5) P.add(BALL(1.8, 7), 0x5a6458, u, G + top - 1.6, f, 0, u, 0, 1.3, 0.9, 1);
    // ferns: thick round the trees and the log (the wolves come up out of them)
    for (const u of FERN_POPS) (fern(P, u, 10.6, 1.4), fern(P, u + 0.8, 10.8, 1.2));
    P.scatter(30, 3, 30, (u, f, R) => fern(P, u, f, 0.9 + R() * 0.6), 30, 5);
    P.scatter(40, 20, 56, (u, f, R) => P.add(CONE(0.7 + R() * 0.4, 0.7, 5), 0x24402a, u, G + 0.3, f), 44, 9);
    P.add(BOX(0.1, 1.3, 0.1), 0x3a3020, -7.6, G + 0.65, 9.65);
    // fireflies
    P.scatter(46, 6, 40, (u, f, R) => P.add(BOX(0.07, 0.07, 0.07), 0xd8ff7a, u, G + 0.6 + R() * 1.8, f), 26);
  },
  slots: [],
  cover: null
};

LAYOUTS.deer_wood = L => {
  const fixed = { fixed: true, rail: false };
  // rabbits on the path, owls on the fallen giant
  L.row({ kind: "rabbit", n: 6, f: 7.5, u0: -5, u1: 5, size: 0.42, tint: "white", bank: 3 });
  L.row({
    ...fixed,
    kind: "owl",
    n: 3,
    f: WOOD.LOG - 0.1,
    u0: WOOD.LOGU - 3,
    u1: WOOD.LOGU + 3,
    base: 1.48,
    size: 0.55,
    tint: "white",
    bank: 3
  });
  // wolves up out of the ferns (a doe: don't)
  L.pops({
    fixed: true,
    f: 11.1,
    at: FERN_POPS.map(u => [u, 0]),
    size: 0.9,
    tint: "steel",
    kinds: [
      ["wolf", 80],
      ["doe", 20, { dont: true }]
    ]
  });
  // the pack in the trees, deer round the giants' trunks
  L.row({ kind: "wolf", n: 4, f: 20, u0: -10, u1: 10, size: 0.9, tint: "steel", bank: 4 });
  for (const i of PEEK_TREES) {
    const [u, f, r] = GIANTS[i];
    L.pops({
      fixed: true,
      peek: true,
      f: f + 0.3,
      at: [[u, 0]],
      size: 1.5,
      tint: "brown",
      slide: r + 1.4,
      kinds: [
        ["buck", 35],
        ["bigbuck", 20],
        ["doe", 25, { dont: true }],
        ["wolf", 12],
        ["deer_royal", 8, { pts: 250 }]
      ]
    });
  }
  L.row({ ...fixed, kind: "buck", n: 2, f: 28, u0: -9, u1: 9, size: 1.4, tint: "brown" });
  // the stone circle: and now and then, between the stones, the White Stag
  L.pops({
    fixed: true,
    f: WOOD.GLADE - 2.4,
    at: [-4.6, 0, 4.6].map(u => [u, 0]),
    size: 1.8,
    tint: "white",
    period: [5, 8],
    kinds: [
      ["deer_royal", 16, { pts: 250 }],
      ["bigbuck", 44],
      ["wolf", 40]
    ]
  });
  // stags beyond the glade, owls up in the old trees, wolves on the rocks
  L.row({ ...fixed, kind: ["bigbuck", "buck"], n: 4, f: 52, u0: -20, u1: 20, size: 1.6, tint: "brown", bank: 2 });
  for (const [u, f, base] of BRANCH_OWLS)
    L.row({ ...fixed, kind: "owl", n: 1, f, u0: u, u1: u, base, size: 0.6, tint: "white" });
  for (const [u, f, top] of ROCKS5)
    L.row({ ...fixed, kind: "wolf", n: 1, f, u0: u, u1: u, base: top - 0.1, size: 0.9, tint: "steel" });
};

// The White Stag across the glade.
function whiteStag(R, add, t, c) {
  add(t, "deer_whiteStag", run(R, { v: R(11, 13) * c.S, f: R(24, 40) }));
}

const woodWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the stampede: the herd in two rushes, wolves at its heels; the White
    // Stag leads the second
    for (const [t0, lead] of [
      [1, false],
      [15, true]
    ]) {
      const dir = R(0, 1) < 0.5 ? 1 : -1;
      if (lead) add(t0, "deer_whiteStag", dash(R, { dir, v: 13 * c.S, f: R(20, 26) }));
      for (let k = 0; k < 5; k++)
        add(t0 + 1 + k * 1.1, k % 2 ? "deer_buck5" : "deer_stag5", dash(R, { dir, v: R(12, 15) * c.S, f: R(14, 34) }));
      for (let k = 0; k < 2; k++)
        add(t0 + 7 + k * 1.4, "deer_wolf", dash(R, { dir, v: R(14, 16) * c.S, f: R(14, 30) }));
    }
    return;
  }
  const k = c.w % 6;
  const deer = m => {
    for (let j = 0; j < m; j++)
      add(R(1, 22), R(0, 1) < 0.5 ? "deer_stag5" : "deer_buck5", run(R, { v: R(10, 13) * c.S, f: R(13, 36) }));
  };
  const wolves = m => {
    for (let j = 0; j < m; j++) add(R(1, 22), "deer_wolf", run(R, { v: R(11, 14) * c.S, f: R(12, 34) }));
  };
  const lunge = () => {
    const side = R(0, 1) < 0.5 ? 1 : -1;
    add(R(2, 18), "deer_wolf", charge(R, { v: R(9, 11) * c.S, f0: R(40, 55), u0: side * R(14, 26) }));
  };
  const owls = m => {
    for (let j = 0; j < m; j++)
      add(R(1, 22), "deer_owl", across(R, { v: R(6, 8) * c.S, f: R(12, 30), h: R(3.5, 8), weave: 1.5, amp: 0.4 }));
  };
  if (k === 0) (wolves(1 + n(1)), deer(1 + n(0.8)));
  else if (k === 1) (lunge(), owls(2));
  else if (k === 2) (deer(1 + n(1.2)), wolves(1));
  else if (k === 3) {
    // the pack, one behind the other
    const dir = R(0, 1) < 0.5 ? 1 : -1;
    const f = R(16, 30);
    const t = R(2, 14);
    for (let j = 0; j < 2 + n(1); j++) add(t + j * 0.7, "deer_wolf", dash(R, { dir, v: 13 * c.S, f: f + R(-2, 2) }));
    owls(1);
  } else if (k === 4) (lunge(), deer(1 + n(0.8)));
  else (deer(1 + n(1)), wolves(n(0.8)), owls(1));
  if (R(0, 1) < 0.08 + 0.12 * c.p) whiteStag(R, add, R(3, 18), c);
};

// ---- Ambience ------------------------------------------------------------------

// Wind (low-passed noise, gusting on the 8 s loop) into d.
function wind(d, sr, R, amp, k = 0.02) {
  let lp = 0;
  for (let i = 0; i < d.length; i++) {
    lp += k * (R() * 2 - 1 - lp);
    d[i] += lp * amp * (0.6 + 0.4 * Math.sin(((i / sr) * Math.PI) / 4));
  }
}
// A tone from t0 for dur s: hz(e) its pitch over e 0..1, env(e) its level.
function tone(d, sr, t0, dur, hz, amp, env = e => Math.sin(Math.PI * e)) {
  const i0 = Math.floor(t0 * sr);
  const n = Math.floor(dur * sr);
  let ph = 0;
  for (let i = 0; i < n && i0 + i < d.length; i++) {
    const e = i / n;
    ph += (2 * Math.PI * hz(e)) / sr;
    d[i0 + i] += Math.sin(ph) * amp * env(e);
  }
}
const ring = e => Math.exp(-e * 6) * Math.min(1, e * 300);

Object.assign(AMBIENCE, {
  // wind over the pass, cowbells down the meadow, a marmot's whistle
  deer_alpine(d, sr, R) {
    wind(d, sr, R, 2.4);
    for (const [t, a] of [
      [0.7, 0.03],
      [2.9, 0.022],
      [3.3, 0.028],
      [5.6, 0.02],
      [7.0, 0.026]
    ])
      for (const hz of [560, 1290, 2050]) tone(d, sr, t, 1.3, () => hz * (1 + (t % 1) * 0.04), a, ring);
    tone(d, sr, 4.4, 0.3, e => 2600 + 300 * Math.sin(e * Math.PI), 0.05);
  },
  // a thin cold wind, snow hissing, a raven, the cabin's timbers creaking
  deer_snow(d, sr, R) {
    wind(d, sr, R, 1.6, 0.06);
    wind(d, sr, R, 1.2, 0.01);
    for (const t of [2.2, 2.6])
      for (const m of [1, 2, 3]) tone(d, sr, t, 0.32, e => 470 * m + 40 * Math.sin(e * 40), 0.03 / m);
    tone(d, sr, 6.0, 0.5, e => 170 + 60 * e, 0.025);
  },
  // wind over the heather, a curlew, a grouse's "go-back go-back"
  deer_moor(d, sr, R) {
    wind(d, sr, R, 2.6);
    tone(d, sr, 1.0, 1.6, e => 1900 + 700 * e, 0.03);
    tone(d, sr, 2.8, 1.2, e => 2000 + 600 * e, 0.025);
    for (const t of [5.0, 5.16, 5.32, 5.48, 5.84, 6.1]) tone(d, sr, t, 0.1, e => 700 - 200 * e, 0.05);
    tone(d, sr, 6.35, 0.3, e => 600 - 150 * e, 0.05);
  },
  // the night wood: a little wind, crickets, owls, a wolf howling far off
  deer_wood(d, sr, R) {
    wind(d, sr, R, 0.9);
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      d[i] += Math.sin(2 * Math.PI * 4200 * t) * Math.max(0, Math.sin(t * 2 * Math.PI * 3)) ** 4 * 0.012;
    }
    tone(d, sr, 1.5, 0.35, () => 390, 0.06);
    tone(d, sr, 2.05, 0.65, e => 385 - 25 * e, 0.06);
    tone(
      d,
      sr,
      4.2,
      3.0,
      e => 420 + 280 * Math.sin(Math.min(1, e * 1.6) * (Math.PI / 2)) - 120 * e ** 3 + 6 * Math.sin(e * 60),
      0.03
    );
  }
});

// ---- The campaign ------------------------------------------------------------------

export const DEER = {
  name: "THE HUNT FOR THE WHITE STAG",
  first: "Hunters: the White Stag is out there. Start at the forest edge",
  kinds,
  levels: [
    {
      world: "deer_pass",
      name: "THE MOUNTAIN PASS",
      story: "Up to the pass. Mind the hikers on the trail",
      music: "deer",
      amb: "deer_alpine",
      legend: "GOATS ON THE CLIFF 100 · MARMOTS 100 · ELK 50  ·  DON'T SHOOT THE HIKERS",
      wave: passWave,
      title: (w, x2) => (x2 ? "THE HERD COMES OVER THE PASS · DOUBLE POINTS" : null)
    },
    {
      world: "deer_ridge",
      name: "THE SNOWY RIDGE",
      story: "Winter on the ridge. The stags are crossing the snow",
      music: "deer",
      amb: "deer_snow",
      legend: "HARES 100 · STAGS 75 · PTARMIGAN 25  ·  DON'T SHOOT THE RANGER",
      wave: ridgeWave,
      title: (w, x2) => (x2 ? "THE HERD CROSSES THE RIDGE · DOUBLE POINTS" : null)
    },
    {
      world: "deer_moor",
      name: "THE HIGHLANDS",
      story: "Golden hour on the moor. Leave the cattle be",
      music: "deer",
      amb: "deer_moor",
      legend: "STAGS 75 · GROUSE 25 · A STAG IN THE RUT THAT REACHES YOU COSTS 10  ·  DON'T SHOOT THE CATTLE",
      wave: moorWave,
      title: (w, x2) => (x2 ? "THE GROUSE DRIVE · DOUBLE POINTS" : null)
    },
    {
      world: "deer_wood",
      name: "THE OLD KING OF THE FOREST",
      story: "Moonrise. The White Stag walks the old wood",
      music: "deer",
      amb: "deer_wood",
      legend:
        "THE WHITE STAG 300 (250 IN THE STONES) · WOLVES 75 · A WOLF THAT REACHES YOU COSTS 10  ·  DON'T SHOOT THE DOES",
      wave: woodWave,
      title: (w, x2) => (x2 ? "THE STAMPEDE · DOUBLE POINTS" : null)
    }
  ],
  done: ["THE OLD KING OF THE FOREST IS YOURS", "THE GREATEST STALK OF ALL, HUNTERS"]
};
