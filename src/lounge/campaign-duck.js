import {
  GROUND,
  BOX,
  CYL,
  BALL,
  CAP,
  CONE,
  TORUS,
  SLAB,
  WORLDS,
  BIRDS,
  CARDS,
  CARD_SIZE,
  AMBIENCE,
  person
} from "./shoots-art";
import { LAYOUTS, PERSON, SHATTER, PLATE_SOUND, span } from "./plates";
import { SHAPES } from "./plates-shapes";
import { bird, runner, gunman, DONT, across, flush, run, cross, pick } from "./shoot-paths";

// The Duck Hunt campaign (Jay, 2026-10-24: "a progression through a hunting
// season": a river at dawn, the goose fields in the fall, a salt marsh at
// sunset and the great migration in the first snow). Five levels:
//   1 THE DECOY POND       (the classic world, shoots.js SCREEN.duck)
//   2 THE RIVER BEND       dawn on a river: ducks off the water and out of the
//                          reeds, a boat blind with its decoys, a fallen log
//                          (turtles and decoys on it), kingfishers small and
//                          fast; the retriever is a don't-shoot
//   3 THE GOOSE FIELDS     October corn stubble, a red barn and silo, decoy
//                          spreads, Canada geese in V's and coming in to land,
//                          crows off the corn; the farmer is a don't-shoot
//   4 THE SALT MARSH       sunset on the coast: tidal creeks, a fish shack,
//                          dunes, a lighthouse, eiders and scoters low over
//                          the waves; gulls are protected (don't shoot)
//   5 THE GREAT MIGRATION  first snow on a northern lake: ice, pines, ice
//                          huts, huge mixed flocks; swans and the game warden
//                          are don't-shoots; now and then the golden goose
//                          (a rare boss: 100)
// Laid out as the other worlds are (u right, f downrange, h up from the roof
// deck, the ground at GROUND); shoots-art moves it all SHIFT m back and onto
// the lifted land.

const G = GROUND;

// ---- New outlines (the plates' atlas: 6 shapes, 1 card) -----------------------

Object.assign(SHAPES, {
  // a painted turtle on a log, facing left
  duck_turtle: {
    polys: [
      [
        0, 26, 3, 21, 10, 19, 16, 21, 20, 18, 28, 9, 42, 3, 58, 3, 72, 9, 82, 18, 90, 26, 84, 27, 82, 32, 74, 32, 72,
        27, 32, 27, 30, 32, 22, 32, 20, 27, 12, 27, 5, 29
      ]
    ],
    marks: [
      [3, 26, 18, 42, 10, 58, 10, 76, 18],
      [3, 42, 10, 44, 25],
      [3, 58, 10, 57, 25]
    ],
    dots: [[7, 23, 1.6]]
  },
  duck_pumpkin: {
    polys: [
      [
        10, 22, 20, 13, 33, 11, 41, 13, 49, 11, 62, 13, 72, 22, 76, 36, 72, 50, 62, 58, 49, 60, 41, 58, 33, 60, 20, 58,
        10, 50, 6, 36
      ],
      [37, 13, 38, 0, 46, 0, 45, 13]
    ],
    marks: [
      [3, 41, 15, 39, 36, 41, 56],
      [3, 27, 16, 22, 36, 27, 56],
      [3, 55, 16, 60, 36, 55, 56]
    ]
  },
  // a gull standing, facing left
  duck_gull: {
    polys: [
      [
        0, 15, 9, 12, 14, 7, 21, 5, 27, 9, 29, 15, 37, 19, 56, 21, 74, 21, 94, 25, 82, 29, 68, 33, 52, 37, 42, 37, 40,
        52, 37, 52, 37, 39, 33, 39, 31, 52, 28, 52, 29, 37, 22, 33, 18, 25, 14, 19, 9, 17
      ]
    ],
    marks: [
      [3, 36, 25, 60, 27, 84, 27],
      [4, 80, 26, 92, 25]
    ],
    dots: [[19, 10, 1.4]]
  },
  duck_crab: {
    polys: [
      [12, 20, 22, 12, 40, 10, 58, 12, 68, 20, 64, 28, 44, 32, 26, 32, 16, 28],
      [2, 8, 8, 0, 17, 4, 12, 9, 19, 13, 14, 18, 5, 15],
      [78, 8, 72, 0, 63, 4, 68, 9, 61, 13, 66, 18, 75, 15]
    ],
    lines: [
      [3, 18, 25, 8, 33, 4, 42],
      [3, 26, 30, 18, 38, 14, 46],
      [3, 54, 30, 62, 38, 66, 46],
      [3, 62, 25, 72, 33, 76, 42],
      [4, 18, 18, 13, 12],
      [4, 62, 18, 67, 12],
      [3, 34, 12, 33, 5],
      [3, 46, 12, 47, 5]
    ],
    dots: [
      [33, 5, 2.4],
      [47, 5, 2.4]
    ]
  },
  // a lobster float on its spindle
  duck_buoy: {
    polys: [
      [
        16, 0, 22, 0, 22, 14, 30, 18, 36, 28, 38, 44, 36, 62, 30, 72, 22, 76, 16, 76, 8, 72, 2, 62, 0, 44, 2, 28, 8, 18,
        16, 14
      ],
      [17, 75, 21, 75, 21, 92, 17, 92]
    ],
    marks: [
      [6, 2, 34, 36, 34],
      [6, 1, 55, 37, 55]
    ]
  },
  // a bull moose, facing left: the bell, the hump, the palmed antlers
  duck_moose: {
    polys: [
      [
        0, 46, 3, 37, 10, 31, 20, 28, 28, 25, 40, 21, 56, 13, 74, 16, 96, 20, 118, 24, 125, 31, 127, 46, 123, 70, 121,
        86, 124, 118, 115, 118, 112, 88, 110, 68, 100, 63, 62, 65, 56, 72, 57, 118, 48, 118, 46, 74, 41, 66, 36, 58, 31,
        64, 26, 68, 23, 58, 19, 53, 11, 53, 4, 51
      ],
      [24, 26, 15, 13, 5, 7, 2, -4, 10, -1, 12, -12, 19, -4, 23, -15, 28, -5, 34, -14, 37, -3, 42, -2, 37, 9, 31, 23],
      [33, 23, 40, 12, 50, 5, 58, -4, 60, 6, 55, 15, 42, 22]
    ],
    dots: [[15, 35, 1.8]]
  }
});
SHATTER.add("duck_pumpkin");
PLATE_SOUND.duck_pumpkin = "splat";
PLATE_SOUND.duck_buoy = "thunk";
PLATE_SOUND.duck_crab = "clank";

Object.assign(CARDS, {
  // a birdwatcher with binoculars up (the salt marsh: don't)
  duck_birder: (c, W, H) => {
    person(c, W, H, {
      body: "#6a7a4a",
      vest: "#c8b080",
      legs: "#4a4a3a",
      hat: "#c8b080",
      hair: "#8a6a4a",
      skin: "#f0c9a0"
    });
    const u = W / 10;
    c.lineCap = "round";
    c.strokeStyle = "#6a7a4a";
    c.lineWidth = 1.5 * u;
    c.beginPath();
    c.moveTo(W / 2 - 2.8 * u, H * 0.33);
    c.lineTo(W / 2 - 1.6 * u, H * 0.19);
    c.moveTo(W / 2 + 2.8 * u, H * 0.33);
    c.lineTo(W / 2 + 1.6 * u, H * 0.19);
    c.stroke();
    c.fillStyle = "#222";
    c.fillRect(W / 2 - 1.6 * u, H * 0.145, 1.3 * u, H * 0.05);
    c.fillRect(W / 2 + 0.3 * u, H * 0.145, 1.3 * u, H * 0.05);
    c.strokeStyle = "#222";
    c.lineWidth = 0.3 * u;
    c.beginPath();
    c.moveTo(W / 2 - 1.2 * u, H * 0.2);
    c.lineTo(W / 2, H * 0.33);
    c.lineTo(W / 2 + 1.2 * u, H * 0.2);
    c.stroke();
  }
});
CARD_SIZE.duck_birder = [0.9, 1.8];
PERSON.add("duck_birder");

// ---- New birds (3D, like the classic ones; not in the atlas) ------------------

const B = (body, head, wing, beak, s, extra = {}) => ({ body, head, wing, beak, s, ...extra });
Object.assign(BIRDS, {
  duck_kingfisher: B(0x1f6ad8, 0x1a50b0, 0x2f8ae8, 0x1a1a1a, 0.6, { ring: 0xff8a2a, tip: 0x123a8a, span: 0.8 }),
  duck_canada: B(0x7a6a58, 0x151515, 0x8a7a66, 0x151515, 1.95, { ring: 0xf4f4f0, tip: 0x3a3028, span: 1.25 }),
  duck_snowgoose: B(0xf4f4f0, 0xf4f4f0, 0xfbfbf8, 0xf28a7a, 1.8, { tip: 0x151515, span: 1.2 }),
  duck_eider: B(0x1a1a1a, 0xf4f0e8, 0xf4f0e8, 0x8a9a6a, 1.45, { tip: 0x1a1a1a, ring: 0x6ac85a }),
  duck_scoter: B(0x151518, 0x151518, 0x26262c, 0xff8a1a, 1.1, { span: 1.05 }),
  duck_gull: B(0xf8f8f4, 0xf8f8f4, 0xb8c0c8, 0xf2c230, 1.3, { tip: 0x151515, span: 1.45 }),
  duck_swan: B(0xfbfbf8, 0xfbfbf8, 0xffffff, 0x151515, 2.7, { span: 1.4 }),
  duck_pintail: B(0x9a9a92, 0x5a3a24, 0x8a8a84, 0x3a4a5a, 1.3, { ring: 0xffffff, tail: "long", accent: 0x2a2a2a }),
  duck_golden: B(0xffc93c, 0xffe27a, 0xffd85a, 0xff8a1a, 2.1, { gloss: 1.4, ring: 0xffffff, span: 1.25 })
});

// ---- Kinds -----------------------------------------------------------------------

// Smaller and faster = more: kingfisher 50, teal and scoter 25, pintail,
// eider and pheasant 15, mallard, wood duck and the geese 10. The golden goose
// (L5, rare) is a boss: 100.
const kinds = {
  duck_mallard: bird("mallard", 10, 0.5, "quack"),
  duck_wood: bird("woodduck", 10, 0.55, "quack"),
  duck_kingfisher: bird("duck_kingfisher", 50, 0.24, "chirp"),
  duck_retriever: {
    ...runner("wolf", 0xd8a050, 0.8, 0.45, "wrong"),
    pts: -25,
    ...DONT,
    name: "THE RETRIEVER! DON'T SHOOT"
  },
  duck_canada: bird("duck_canada", 10, 0.65, "honk"),
  duck_pheasant: bird("pheasant", 15, 0.45, "caw"),
  duck_coyote: runner("wolf", 0xb89a6a, 0.9, 0.5, "thud"),
  duck_farmer: { ...gunman("farmer", 1.8), pts: -25, sound: "wrong", ...DONT, name: "THE FARMER! DON'T SHOOT" },
  duck_eider: bird("duck_eider", 15, 0.5, "quack"),
  duck_scoter: bird("duck_scoter", 25, 0.4, "quack"),
  duck_gull: { ...bird("duck_gull", -25, 0.5, "wrong"), ...DONT, name: "GULLS ARE PROTECTED" },
  duck_crab: { ...runner("duck_crab", 0xe8443a, 0.42, 0.3, "clank"), pts: 50 },
  duck_snowgoose: bird("duck_snowgoose", 10, 0.6, "honk"),
  duck_pintail: bird("duck_pintail", 15, 0.45, "quack"),
  duck_swan: { ...bird("duck_swan", -25, 0.8, "wrong"), ...DONT, name: "A SWAN! DON'T SHOOT" },
  duck_golden: { ...bird("duck_golden", 100, 0.6, "bell"), name: "THE GOLDEN GOOSE" },
  duck_fox: runner("wolf", 0xe8782a, 0.65, 0.4, "thud")
};

// ---- Paths ------------------------------------------------------------------------

// A lead bird and its followers in a line.
function line(R, add, t, kind, size, o) {
  const dir = o.dir ?? (R(0, 1) < 0.5 ? 1 : -1);
  const u0 = R(26, 30);
  for (let j = 0; j < size; j++)
    add(
      t + j * (o.gap ?? 0.35),
      kind,
      across(R, {
        v: o.v,
        dir,
        u0,
        f: o.f + j * (o.df ?? 0.8),
        h: o.h + Math.abs(j - size / 2) * 0.35,
        amp: o.amp ?? 0.2
      })
    );
}
// Geese in a V: the leader in front, the two arms trailing up and down
// behind it (a "<" going across).
function vee(R, add, t, kind, size, o) {
  const dir = o.dir ?? (R(0, 1) < 0.5 ? 1 : -1);
  const u0 = R(28, 32);
  for (let j = 0; j < size; j++) {
    const r = Math.ceil(j / 2);
    const s = j % 2 ? 1 : -1;
    add(t + (r * 1.7) / o.v, kind, across(R, { v: o.v, dir, u0, f: o.f + r * 0.7, h: o.h + s * r * 0.55, amp: 0.06 }));
  }
}
// Gliding in from the side, wings cupped, and landing at [u, f] (in among
// the decoys); sits there a moment, then it's gone.
function landing(R, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = -dir * R(24, 30);
  const f0 = o.f + R(4, 10);
  const h0 = o.h ?? R(8, 12);
  const hEnd = G + 0.35;
  const T = Math.hypot(o.u - u0, o.f - f0) / o.v;
  const sit = o.sit ?? 1.6;
  return {
    dur: T + sit,
    pos: (tau, out) => {
      const k = Math.min(1, tau / T);
      const e = 1 - (1 - k) * (1 - k);
      return out.set(u0 + (o.u - u0) * e, f0 + (o.f - f0) * e, hEnd + (h0 - hEnd) * (1 - k) ** 1.5);
    }
  };
}
// Several up off the water (or out of the stubble) from one spot.
function burst(R, add, t, kinds_, n, u, f, S) {
  for (let j = 0; j < n; j++) add(t + j * 0.22, pick(R, kinds_), flush(R, { u: u + R(-1.2, 1.2), f: f + R(-1, 1), S }));
}

// ---- Scenery helpers ----------------------------------------------------------------

function willow(P, u, f, s = 1, c = 0x8a9a4a) {
  P.add(CYL(0.25 * s, 0.4 * s, 3.2 * s, 6), 0x5a4a3a, u, G + 1.6 * s, f);
  P.add(BALL(2.2 * s, 8), c, u, G + 3.9 * s, f, 0, 0, 0, 1.25, 0.8, 1.15);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    P.add(
      CONE(0.4 * s, 2.8 * s, 4),
      k % 2 ? c : 0x9aaa5a,
      u + Math.cos(a) * 2.2 * s,
      G + 2.4 * s,
      f + Math.sin(a) * 2 * s,
      Math.PI
    );
  }
}
function birch(P, u, f, s = 1, c = 0xa8b848) {
  P.add(CYL(0.11 * s, 0.15 * s, 5 * s, 5), 0xe8e4dc, u, G + 2.5 * s, f);
  for (const h of [1.2, 2.4, 3.3]) P.add(BOX(0.2 * s, 0.07, 0.05), 0x2a2a2a, u, G + h * s, f - 0.13 * s);
  P.add(BALL(1.2 * s, 7), c, u, G + 4.6 * s, f, 0, 0, 0, 1, 1.3, 1);
  P.add(BALL(0.9 * s, 6), c, u + 0.6 * s, G + 3.7 * s, f - 0.2, 0, 0, 0, 1, 1.2, 1);
}
function snowPine(P, u, f, s = 1) {
  P.add(CYL(0.12 * s, 0.18 * s, 1.2 * s, 5), 0x4a3020, u, G + 0.6 * s, f);
  for (const [h, r, hh] of [
    [2.3, 1.4, 2.8],
    [3.6, 1.1, 2.4],
    [4.8, 0.75, 2.0]
  ]) {
    P.add(CONE(r * s, hh * s, 7), 0x1f3a30, u, G + h * s, f);
    P.add(CONE(r * 0.62 * s, hh * 0.45 * s, 7), 0xf2f6fa, u, G + (h + hh * 0.3) * s, f);
  }
}
// A gable roof, its ridge along u: [u, f] middle, w along u, d deep, eave h,
// pitch a.
function roof(P, u, f, w, d, h, a, c) {
  const run = d / 2 / Math.cos(a) + 0.35;
  for (const s of [-1, 1])
    P.add(BOX(w + 0.5, 0.18, run), c, u, h + Math.sin(a) * (run / 2 - 0.35), f + s * (d / 4 + 0.1), -s * a, 0, 0);
}
function smoke(P, u, h, f) {
  for (let k = 0; k < 6; k++) P.add(BALL(0.35 + k * 0.12, 6), 0xc8c4cc, u + k * 0.35, h + k * 0.75, f + k * 0.1);
}
function rowboat(P, u, f, c = 0x8a3a2a, ry = 0) {
  P.add(BOX(1.1, 0.42, 3), c, u, G + 0.25, f, 0, ry, 0);
  P.add(BOX(0.9, 0.06, 2.8), 0x5a4a3a, u, G + 0.44, f, 0, ry, 0);
  P.add(BOX(0.78, 0.42, 0.78), c, u + Math.sin(ry) * 1.5, G + 0.25, f - Math.cos(ry) * 1.5, 0, ry + Math.PI / 4, 0);
  P.add(BOX(1.05, 0.06, 0.25), 0x5a4a3a, u, G + 0.5, f, 0, ry, 0);
}
function post(P, u, f, h, c = 0x5a4a3a, r = 0.09) {
  P.add(CYL(r, r * 1.15, h, 5), c, u, G + h / 2, f);
}
function grassTuft(P, u, f, s = 1, c = 0xa89a52) {
  for (let k = 0; k < 6; k++)
    P.add(
      CONE(0.05 * s, 0.8 * s, 3),
      k % 2 ? c : 0x8a8a42,
      u + (k - 2.5) * 0.09 * s,
      G + 0.36 * s,
      f + (k % 3) * 0.05,
      0,
      0,
      (k - 2.5) * 0.16
    );
}

// ---- Level 2: the river bend ----------------------------------------------------

// The river runs across in front of you from f 3 to 19 and bends away to the
// left past an old railway trestle. On it: the boat blind with its decoys,
// lily pads, the fallen log; on the far bank a gravel bar, willows, a cabin.
const RV = {
  BANK: 2.7,
  FAR: 18.6,
  LOG: 14.5,
  BOAT: [12, 7.5],
  DOCK: -15,
  CABIN: [20, 29],
  SNAG: [-12, 40],
  TRESTLE: 56
};
const PADS = span(5, -9, -1).map(u => [u, 4.6]); // (lily pads, frogs on them)
const NEAR_REEDS = [-28, -22, -17, -12, -5, 3, 7, 18, 24, 29];
const FAR_REEDS = [-20, -16, -9, -4, 16, 20, 24, 28, 32];

WORLDS.duck_river = {
  sky: {
    top: "#22305e",
    mid: "#9a88b0",
    horizon: "#ffc890",
    ground: "#4a5a48",
    sun: [-25, 3, "#ffe2a8", 15],
    clouds: 6,
    cloud: "rgba(255,200,180,0.45)",
    hills: [
      { colour: "#5a6078", height: 8, rough: 2, phase: 0.6 },
      { colour: "#2e4038", height: 4.5, rough: 4, trees: true }
    ],
    seed: 61
  },
  fog: 0x9a9aac,
  signs: [
    ["CEDAR BEND", RV.CABIN[0], G + 3.55, RV.CABIN[1] - 2.62, 2.6, 0.5, "#3a2414", "#f2e2b8"],
    ["NO WAKE", RV.DOCK - 1.3, G + 1.75, 8.05, 1.3, 0.45, "#f4efe2", "#c0182a"]
  ],
  build(P) {
    P.ground(0x56683a, [
      { u: 0, f: 32, r: 14, c: 0x6a7a44, sx: 3, sz: 0.6 },
      { u: 0, f: 2.3, r: 30, c: 0x4a5030, sx: 2.2, sz: 0.045 },
      { u: 0, f: 10.8, r: 10, c: 0x5a7898, sx: 6, sz: 0.82 },
      { u: -30, f: 34, r: 12, c: 0x5a7898, sx: 1.1, sz: 1.7 },
      { u: -22, f: 58, r: 10, c: 0x6a84a0, sx: 2.6, sz: 0.55 },
      { u: 6, f: 20.6, r: 5, c: 0xb8a888, sx: 2.2, sz: 0.3 },
      { u: -24, f: 12, r: 5, c: 0xe0b8a8, sx: 3.2, sz: 0.35 },
      { u: 2, f: 14.5, r: 6, c: 0x7a92b0, sx: 4, sz: 0.25 }
    ]);
    // reeds and cattails along both banks
    for (const u of NEAR_REEDS) P.reeds(u, RV.BANK + 0.1, 0.8);
    for (let k = 0; k < 22; k++)
      grassTuft(P, -33 + k * 3.1 + ((k * 7) % 3) * 0.4, 0.6 + ((k * 5) % 4) * 0.45, 0.9, 0x7a8a3a);
    for (const u of FAR_REEDS) P.reeds(u, RV.FAR, 0.9);
    // lily pads, a flower or two
    for (const [u, f] of PADS) {
      P.add(CYL(0.42, 0.42, 0.04, 9), 0x4a8a3a, u, G + 0.05, f);
      P.add(BALL(0.07, 5), 0xf4d0e0, u + 0.3, G + 0.1, f - 0.2);
    }
    for (const [u, f] of [
      [-11, 6],
      [1.5, 5.4],
      [-6, 7.2]
    ])
      P.add(CYL(0.35, 0.35, 0.04, 9), 0x5a9a42, u, G + 0.05, f);
    // the fallen log, half in the water: root plate one end, a branch the other
    P.add(CYL(0.48, 0.55, 11, 10), 0x5a4632, -7, G + 0.3, RV.LOG, 0, 0, Math.PI / 2);
    P.add(BOX(9, 0.06, 0.45), 0x5a7a3a, -7.5, G + 0.8, RV.LOG);
    P.add(BALL(1.1, 8), 0x6a5040, -1.2, G + 0.55, RV.LOG, 0, 0, 0, 0.35, 1, 1);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      P.add(CYL(0.05, 0.1, 1.3, 4), 0x3a2a1a, -0.9, G + 0.7 + Math.sin(a) * 1.3, RV.LOG + Math.cos(a) * 1.2, a, 0, 0);
    }
    P.add(CYL(0.08, 0.16, 2.4, 5), 0x5a4632, -12, G + 1.4, RV.LOG + 0.2, 0, 0, 0.6);
    P.add(CYL(0.06, 0.1, 1.6, 4), 0x5a4632, -9.5, G + 1.2, RV.LOG + 0.3, 0.3, 0, -0.5);
    // the boat blind: a camouflaged duck boat with a grass screen
    const [bu, bf] = RV.BOAT;
    P.add(BOX(4.4, 0.55, 1.6), 0x3e4a2c, bu, G + 0.2, bf);
    P.add(BOX(1.13, 0.55, 1.13), 0x3e4a2c, bu + 2.2, G + 0.2, bf, 0, Math.PI / 4, 0);
    P.add(BOX(4.5, 0.08, 1.7), 0x2a3020, bu, G + 0.5, bf);
    P.add(BOX(4, 0.9, 0.12), 0x8a8a4a, bu - 0.2, G + 0.95, bf - 0.75);
    P.add(BOX(4, 0.9, 0.12), 0x7a7a42, bu - 0.2, G + 0.95, bf + 0.75);
    P.add(BOX(4, 0.08, 1.5), 0x7a7a42, bu - 0.2, G + 1.5, bf, 0.12, 0, 0);
    for (let k = 0; k < 12; k++)
      P.add(
        CONE(0.1, 0.8, 4),
        k % 2 ? 0xa89a5a : 0x8a8a4a,
        bu - 2 + k * 0.36,
        G + 1.75,
        bf - 0.75,
        0.1 * (k % 3),
        0,
        0.2 * ((k % 3) - 1)
      );
    P.reeds(bu - 2.4, bf, 0.75);
    // the dock, a rowboat tied up, a lantern post at the end
    P.add(SLAB(1.6, 0.12, 6), 0x8a6a46, RV.DOCK, G + 0.55, 5);
    for (const f of [2.2, 4.2, 6.2, 8]) for (const s of [-0.75, 0.75]) post(P, RV.DOCK + s, f, 0.9, 0x5a4026, 0.08);
    for (const s of [-0.7, 0.7]) P.add(BOX(0.14, 1.0, 0.14), 0x5a4026, RV.DOCK + s, G + 0.9, 8.05);
    post(P, RV.DOCK - 1.3, 8.1, 1.6, 0x5a4026, 0.05);
    rowboat(P, RV.DOCK + 2.3, 5.5, 0x9a3a2a, 0.1);
    // the cabin on the far bank: logs, a stone chimney, a lamp lit in the window
    const [cu, cf] = RV.CABIN;
    P.add(BOX(7, 3.2, 5), 0x7a5232, cu, G + 1.6, cf);
    for (let k = 0; k < 6; k++) P.add(BOX(7.04, 0.07, 0.06), 0x4a3220, cu, G + 0.3 + k * 0.52, cf - 2.52);
    roof(P, cu, cf, 7, 5, G + 3.2, 0.55, 0x3a3a3a);
    P.add(BOX(1.1, 2.0, 0.08), 0x2a1a10, cu - 1.2, G + 1.0, cf - 2.52);
    for (const du of [1.3, 2.8]) {
      P.add(BOX(0.9, 0.8, 0.08), 0xffd27a, cu + du, G + 1.8, cf - 2.53);
      P.add(BOX(1.1, 0.1, 0.1), 0xe8dcc0, cu + du, G + 2.25, cf - 2.55);
    }
    P.add(BOX(1, 4.6, 1), 0x8a8278, cu - 3.2, G + 2.3, cf + 0.8);
    smoke(P, cu - 3.2, G + 5, cf + 0.8);
    P.add(BOX(7.6, 0.12, 1.6), 0x6a4a2a, cu, G + 0.35, cf - 3.3);
    for (const s of [-3.5, 3.5]) P.add(BOX(0.14, 2.4, 0.14), 0x4a3220, cu + s, G + 1.5, cf - 4);
    P.add(BOX(7.8, 0.12, 1.8), 0x3a3a3a, cu, G + 2.75, cf - 3.4, 0.25, 0, 0);
    for (let k = 0; k < 5; k++)
      P.add(CYL(0.16, 0.16, 1.3, 6), 0x9a7448, cu + 4.2, G + 0.18 + k * 0.3, cf - 1.5 + (k % 2) * 0.4, Math.PI / 2);
    P.add(CAP(0.35, 3.8, 6), 0x2f6a8a, cu - 5, G + 0.35, cf - 1, Math.PI / 2, 0.3, 0, 1, 1, 0.55);
    // willows and birches along the far bank, a dead snag
    willow(P, -19, 23, 1.1);
    willow(P, 29, 22.5, 1.0);
    willow(P, -27, 27, 0.9, 0x7a8a42);
    for (const [u, f, s] of [
      [-22, 32, 1],
      [-15.5, 33, 0.8],
      [31, 31, 1.1],
      [14, 34, 0.9]
    ])
      birch(P, u, f, s);
    const [su, sf] = RV.SNAG;
    P.add(CYL(0.16, 0.3, 4.6, 6), 0x6a5a4a, su, G + 2.3, sf);
    P.add(CYL(0.06, 0.1, 1.8, 4), 0x6a5a4a, su + 0.6, G + 3.6, sf, 0, 0, -0.9);
    P.add(CYL(0.05, 0.08, 1.4, 4), 0x6a5a4a, su - 0.5, G + 3.1, sf, 0, 0, 0.9);
    // a wood-duck box on a pole
    post(P, -24, 17.5, 2.6, 0x5a4a3a, 0.06);
    P.add(BOX(0.5, 0.7, 0.5), 0x8a6a46, -24, G + 2.9, 17.5);
    P.add(BALL(0.07, 5), 0x1a1a1a, -24, G + 3.0, 17.24);
    // the old trestle over the bend
    const T = RV.TRESTLE;
    P.add(BOX(40, 0.45, 2.4), 0x4a3a2a, -30, G + 6.6, T);
    for (const s of [-1.1, 1.1]) P.add(BOX(40, 0.18, 0.12), 0x2a2a2a, -30, G + 6.95, T + s);
    for (let u = -50; u <= -10; u += 4) {
      for (const s of [-0.9, 0.9]) P.add(BOX(0.28, 6.5, 0.28), 0x5a4632, u, G + 3.25, T + s);
      if (u < -10) {
        P.add(BOX(0.12, 5.6, 0.12), 0x5a4632, u + 2, G + 3.3, T - 0.95, 0, 0, 0.6);
        P.add(BOX(0.12, 5.6, 0.12), 0x5a4632, u + 2, G + 3.3, T - 0.95, 0, 0, -0.6);
      }
    }
    // rocks along the banks, pines up the far slope
    for (const [u, f, s] of [
      [-25, 2.5, 1.2],
      [12.5, 2.4, 0.9],
      [26, 3, 1.4],
      [-6, 19.6, 1],
      [33, 19.8, 1.2]
    ])
      P.rock(u, f, s, 0x7a7670);
    P.scatter(
      36,
      44,
      80,
      (u, f, R) => (R() < 0.75 ? P.pine(u, f, 1.1 + R() * 0.8, 0x24442e) : birch(P, u, f, 1.2, 0x98a848)),
      80
    );
  },
  slots: [],
  cover: null
};

LAYOUTS.duck_river = L => {
  const fixed = { fixed: true, rail: false };
  // frogs on the lily pads, decoys in front of the boat blind
  L.row({
    ...fixed,
    kind: "frog",
    n: PADS.length,
    f: 4.6,
    u0: PADS[0][0],
    u1: PADS[PADS.length - 1][0],
    base: 0.07,
    size: 0.3,
    tint: "green",
    bank: 5
  });
  L.row({
    ...fixed,
    kind: "duck",
    n: 6,
    f: 6.3,
    u0: 2.5,
    u1: 10.5,
    size: 0.4,
    tint: ["brown", "white", "green"],
    bank: 3
  });
  // turtles and a couple of decoys sunning on the log
  L.row({
    ...fixed,
    kind: "duck_turtle",
    n: 4,
    f: RV.LOG - 0.3,
    u0: -11.4,
    u1: -4.4,
    base: 0.82,
    size: 0.3,
    tint: ["green", "brown"],
    bank: 4
  });
  // lanterns on the dock's end, still lit
  L.row({
    ...fixed,
    kind: "lantern",
    n: 2,
    f: 7.9,
    u0: RV.DOCK - 0.7,
    u1: RV.DOCK + 0.7,
    base: 1.4,
    size: 0.32,
    tint: "gold"
  });
  // wood ducks on the gravel bar, herons wading at the bend
  L.row({ ...fixed, kind: "duck", n: 5, f: 20.6, u0: 1, u1: 13, size: 0.45, tint: ["orange", "brown"], bank: 5 });
  for (const [u, f] of [
    [-27, 22],
    [-21.5, 19],
    [-33, 27]
  ])
    L.row({ ...fixed, kind: "heron", n: 1, f, u0: u, u1: u, size: 1.15, tint: "white" });
  // crows on the cabin roof, one on the snag
  L.row({
    ...fixed,
    kind: "crow",
    n: 3,
    f: RV.CABIN[1],
    u0: RV.CABIN[0] - 2.5,
    u1: RV.CABIN[0] + 2.2,
    base: 4.1,
    size: 0.42,
    tint: "steel",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "crow",
    n: 1,
    f: RV.SNAG[1] - 0.2,
    u0: RV.SNAG[0],
    u1: RV.SNAG[0],
    base: 4.55,
    size: 0.5,
    tint: "steel",
    pts: 50
  });
  // geese on the far meadow, ducks out on the bend
  L.row({ ...fixed, kind: "goose", n: 4, f: 39, u0: -5, u1: 10, size: 0.9, tint: "steel", bank: 4 });
  L.row({ ...fixed, kind: "duck", n: 3, f: 47, u0: -34, u1: -27, size: 0.6, tint: "white", bank: 3 });
  // ducks up out of the reeds (and now and then the dog)
  const reeds = [
    ["duckfly", 82],
    ["dog", 18, { dont: true }]
  ];
  L.pops({
    fixed: true,
    f: RV.BANK + 0.6,
    at: [-17, -5, 3, 24].map(u => [u, 0.2]),
    size: 0.6,
    tint: "white",
    period: [4, 6],
    busy: 0.85,
    kinds: reeds
  });
  L.pops({
    fixed: true,
    f: RV.FAR + 0.6,
    at: [-16, -9, 16, 24, 32].map(u => [u, 0.2]),
    size: 0.75,
    tint: "white",
    period: [4, 6],
    busy: 0.85,
    kinds: reeds
  });
  // behind the boat's screen: the dog sticks its head up, or a duck flares off
  L.pops({
    fixed: true,
    f: RV.BOAT[1] - 0.5,
    at: [
      [RV.BOAT[0] - 1, 0.9],
      [RV.BOAT[0] + 1, 0.9]
    ],
    size: 0.7,
    tint: "white",
    period: [4, 6],
    kinds: [
      ["dog", 40, { dont: true }],
      ["duckfly", 60]
    ]
  });
  // and off the bend, under the trestle
  L.pops({
    fixed: true,
    f: 50,
    at: [-36, -24].map(u => [u, 0]),
    size: 0.9,
    tint: "white",
    period: [5, 7],
    kinds: [["duckfly", 100]]
  });
};

const riverWave = (R, add, c) => {
  const S = c.S;
  const kf = t =>
    add(t, "duck_kingfisher", across(R, { v: R(15, 19) * S, f: R(5, 17), h: G + R(0.9, 2.2), amp: 0.12, weave: 0.6 }));
  if (c.x2) {
    // the big flush: the whole bend gets up at once
    for (let k = 0; k < 5; k++)
      burst(R, add, 1 + k * 5, ["teal", "teal", "duck_mallard", "duck_wood"], 4, R(-16, 16), R(5, 17), S * 1.1);
    for (let k = 0; k < 3; k++) kf(3 + k * 8);
    line(R, add, 12, "teal", 5, { v: R(11, 13) * S, f: R(14, 22), h: R(5, 9) });
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  // ducks off the water, singles and pairs
  for (let j = 0; j < 2 + n(k === 0 || k === 3 ? 2.5 : 1); j++) {
    const t = R(1, 24);
    const kind = pick(R, ["teal", "teal", "duck_mallard", "duck_wood"]);
    add(t, kind, flush(R, { u: R(-16, 16), f: R(5, 17), S: S * 0.95 }));
    if (R(0, 1) < 0.4) add(t + 0.3, kind, flush(R, { u: R(-16, 16), f: R(5, 17), S: S * 0.95 }));
  }
  // flocks along the river
  if (k !== 0)
    for (let j = 0; j < 1 + n(k === 1 || k === 5 ? 1.3 : 0.6); j++) {
      const teal = R(0, 1) < 0.55;
      line(R, add, 1 + j * 9 + R(0, 4), teal ? "teal" : "duck_mallard", 3 + Math.floor(R(0, 3)), {
        v: (teal ? R(11, 13) : R(7, 9)) * S,
        f: R(8, 24),
        h: R(3.5, 9)
      });
    }
  // wood ducks out of the willows
  if (k === 2 || k === 4)
    for (let j = 0; j < 1 + n(1.5); j++) add(R(1, 22), "duck_wood", flush(R, { u: R(-22, 30), f: R(20, 24), S }));
  // kingfishers, low and fast
  for (let j = 0; j < 1 + n(k === 4 ? 1.6 : 0.6); j++) kf(R(1, 24));
  // the retriever goes along the far bank
  if (R(0, 1) < 0.3) add(R(2, 18), "duck_retriever", run(R, { v: R(6, 8) * S, f: R(19.5, 21) }));
};

// ---- Level 3: the goose fields --------------------------------------------------

// A cut corn field: stubble rows running away from you, a fence in front,
// the hay wagon and tractor, the scarecrow and the decoy spreads, round bales,
// the red barn and silo on the left, grain bins and the farmhouse on the
// right, and the standing corn along the back.
const FD = {
  FENCE: 5,
  WAGON: [9, 9],
  TRACTOR: [14.5, 9],
  SCARE: [-5, 19],
  BARN: [-17, 34],
  SILO: [-8, 35],
  CORN: 46,
  HOUSE: [26, 44]
};
const BALES = [
  [4, 28],
  [11, 29],
  [-27, 22],
  [21, 25],
  [-30, 38]
];
const FENCE_POSTS = span(17, -24, 24);
const BARN = { W: 10, D: 8, EAVE: 4.6 };

// The barn: red walls, a gambrel roof (an octagon end on: steep, then
// shallow), white trim, the big doors and the hayloft door facing you.
function barn(P, u, f) {
  const { W, D, EAVE } = BARN;
  const r = W / 2;
  const red = 0xa8281a;
  const front = f - D / 2;
  P.add(BOX(W, EAVE, D), red, u, G + EAVE / 2, f);
  const prism = (rad, len, c, df) => {
    const g = CYL(rad, rad, len, 8);
    g.scale(1, 1, 1.2);
    P.add(g, c, u, G + EAVE, f + df, Math.PI / 2, 0, 0);
  };
  prism(r + 0.25, D + 0.2, 0x4a4a4e, 0);
  prism(r * 0.97, D + 0.5, red, -0.15);
  // trim: corner boards, the eave line, the doors' white X's
  for (const s of [-1, 1]) P.add(BOX(0.25, EAVE, 0.06), 0xf4efe2, u + s * (r - 0.12), G + EAVE / 2, front - 0.42);
  P.add(BOX(W, 0.18, 0.06), 0xf4efe2, u, G + EAVE, front - 0.42);
  for (const s of [-1, 1]) {
    const du = u + s * 1.3;
    P.add(BOX(2.5, 3.4, 0.08), 0x8a1a10, du, G + 1.7, front - 0.44);
    P.add(BOX(2.5, 3.4, 0.04), 0xf4efe2, du, G + 1.7, front - 0.43, 0, 0, 0, 1.02, 1.02, 1);
    P.add(BOX(2.3, 3.2, 0.06), 0x8a1a10, du, G + 1.7, front - 0.46);
    for (const a of [0.63, -0.63]) P.add(BOX(0.16, 4, 0.06), 0xf4efe2, du, G + 1.7, front - 0.5, 0, 0, a);
  }
  P.add(BOX(1.6, 1.6, 0.08), 0x2a1a10, u, G + EAVE + 1.25, front - 0.6);
  P.add(BOX(1.9, 1.9, 0.06), 0xf4efe2, u, G + EAVE + 1.25, front - 0.57);
  P.add(BOX(2.2, 0.15, 0.9), 0x4a4a4e, u, G + EAVE + 2.3, front - 0.8);
  // the cupola and its weathervane
  P.add(BOX(1.2, 1.1, 1.2), 0xf4efe2, u, G + EAVE + 6.3, f);
  P.add(CONE(1.0, 0.9, 4), 0x4a4a4e, u, G + EAVE + 7.3, f, 0, Math.PI / 4, 0);
  P.add(BOX(0.05, 1.2, 0.05), 0x2a2a2a, u, G + EAVE + 8.2, f);
  P.add(BOX(0.9, 0.2, 0.04), 0x2a2a2a, u, G + EAVE + 8.5, f);
}
function silo(P, u, f) {
  P.add(CYL(2, 2, 13, 14), 0xb85a3a, u, G + 6.5, f);
  for (const h of [2.5, 5, 7.5, 10, 12.5]) P.add(CYL(2.03, 2.03, 0.12, 14), 0x5a5a5e, u, G + h, f);
  P.add(BALL(2.05, 12), 0xc8ccd2, u, G + 13, f, 0, 0, 0, 1, 0.55, 1);
  P.add(BOX(0.22, 12, 0.1), 0x6a6a6e, u + 0.8, G + 6.5, f - 2.0);
}
function grainBin(P, u, f, r, h) {
  P.add(CYL(r, r, h, 14), 0xb8bec4, u, G + h / 2, f);
  for (let k = 1; k < 5; k++) P.add(CYL(r + 0.02, r + 0.02, 0.06, 14), 0x8a9098, u, G + (h * k) / 5, f);
  P.add(CONE(r + 0.2, r * 0.7, 14), 0xa8aeb4, u, G + h + r * 0.35, f);
}
function farmhouse(P, u, f) {
  P.add(BOX(8, 5.6, 6), 0xf0ece0, u, G + 2.8, f);
  roof(P, u, f, 8, 6, G + 5.6, 0.7, 0x3a3a44);
  for (const du of [-2.6, 0, 2.6]) {
    P.add(BOX(1, 1.3, 0.08), 0x34404a, u + du, G + 4.1, f - 3.02);
    P.add(
      BOX(1, 1.3, 0.08),
      du ? 0x34404a : 0x6a3a2a,
      u + du,
      G + (du ? 1.7 : 1.2),
      f - 3.02,
      0,
      0,
      0,
      1,
      du ? 1 : 1.6,
      1
    );
  }
  P.add(BOX(8.4, 0.14, 1.8), 0x3a3a44, u, G + 2.9, f - 3.9, 0.2, 0, 0);
  for (const s of [-3.9, -1.3, 1.3, 3.9]) P.add(BOX(0.14, 2.8, 0.14), 0xf4efe2, u + s, G + 1.4, f - 4.6);
  P.add(BOX(0.8, 2.6, 0.8), 0x8a3a2a, u + 2.6, G + 7.2, f + 1);
  smoke(P, u + 2.6, G + 8.8, f + 1);
}
function tractor(P, u, f) {
  const red = 0xc0281a;
  P.add(BOX(2.6, 1.0, 1.1), red, u + 0.4, G + 1.25, f);
  P.add(BOX(1.4, 0.8, 0.9), red, u + 1.9, G + 1.15, f);
  P.add(BOX(0.06, 0.6, 0.8), 0x2a2a2a, u + 2.62, G + 1.15, f);
  P.add(CYL(0.08, 0.08, 1.2, 5), 0x2a2a2a, u + 1.6, G + 2.2, f - 0.3);
  for (const s of [-1, 1]) {
    P.add(CYL(0.85, 0.85, 0.45, 12), 0x1a1a1a, u - 0.6, G + 0.85, f + s * 0.85, Math.PI / 2);
    P.add(CYL(0.45, 0.45, 0.47, 10), 0xf2c230, u - 0.6, G + 0.85, f + s * 0.85, Math.PI / 2);
    P.add(CYL(0.45, 0.45, 0.3, 10), 0x1a1a1a, u + 2.0, G + 0.45, f + s * 0.7, Math.PI / 2);
  }
  for (const [x, z] of [
    [-1.1, -0.6],
    [0.2, -0.6],
    [-1.1, 0.6],
    [0.2, 0.6]
  ])
    P.add(BOX(0.07, 1.3, 0.07), 0x2a2a2a, u + x, G + 2.4, f + z);
  P.add(BOX(1.6, 0.08, 1.5), red, u - 0.45, G + 3.05, f);
}
function scarecrow(P, u, f) {
  P.add(BOX(0.12, 2.6, 0.12), 0x5a4026, u, G + 1.3, f);
  P.add(BOX(2.6, 0.1, 0.1), 0x5a4026, u, G + 2.0, f);
  P.add(BOX(0.9, 0.9, 0.35), 0xb83a2a, u, G + 1.65, f);
  for (const s of [-1, 1]) P.add(BOX(0.9, 0.3, 0.3), 0xb83a2a, u + s * 0.7, G + 1.98, f);
  P.add(BOX(0.7, 0.6, 0.3), 0x3a4a7a, u, G + 0.95, f);
  P.add(BALL(0.3, 7), 0xd8c08a, u, G + 2.45, f);
  P.add(CYL(0.5, 0.5, 0.04, 10), 0x8a6a3a, u, G + 2.68, f);
  P.add(CONE(0.25, 0.4, 7), 0x8a6a3a, u, G + 2.88, f);
}

WORLDS.duck_field = {
  sky: {
    top: "#3a6aa8",
    mid: "#9ac0e0",
    horizon: "#f4d8a8",
    ground: "#8a6a3a",
    sun: [40, 24, "#fff4d0", 14],
    clouds: 7,
    cloud: "rgba(255,245,230,0.6)",
    hills: [
      { colour: "#b8783a", height: 6, rough: 3, phase: 2, trees: true },
      { colour: "#8a5a2a", height: 3.5, rough: 4, trees: true }
    ],
    seed: 62
  },
  fog: 0xe0c8a0,
  signs: [
    ["MILLER FARM", FD.BARN[0], G + BARN.EAVE + 3.0, FD.BARN[1] - BARN.D / 2 - 0.66, 3.2, 0.6, "#f4efe2", "#8a1a10"],
    ["NO HUNTING NEAR BUILDINGS", -12, G + 1.4, FD.FENCE - 0.12, 3.4, 0.45, "#f4efe2", "#2a2a2a"]
  ],
  build(P) {
    P.ground(0xb89a5a, [
      { u: 0, f: 18, r: 30, c: 0xc8aa68, sx: 2, sz: 0.55 },
      { u: -14, f: 36, r: 10, c: 0x8a7a4a, sx: 1.4, sz: 0.6 },
      { u: 22, f: 42, r: 9, c: 0x7a8a4a, sx: 1.3, sz: 0.6 },
      { u: 0, f: 2.4, r: 30, c: 0x9a7a4a, sx: 2, sz: 0.06 }
    ]);
    // the stubble: rows running away from you
    for (let u = -33; u <= 33; u += 2.2)
      P.add(SLAB(0.35, 0.14, 38), (u * 10) % 4 ? 0xd8bc78 : 0xb89858, u, G + 0.07, 25);
    // the fence across the front, a sign on it
    P.add(BOX(48, 0.06, 0.06), 0x3a3a3a, 0, G + 0.75, FD.FENCE);
    P.add(BOX(48, 0.06, 0.06), 0x3a3a3a, 0, G + 1.1, FD.FENCE);
    for (const u of FENCE_POSTS) P.add(BOX(0.16, 1.3, 0.16), 0x6a5236, u, G + 0.65, FD.FENCE);
    // the hay wagon (square bales on it) and the tractor
    const [wu, wf] = FD.WAGON;
    P.add(BOX(6, 0.2, 2.4), 0x7a5a3a, wu, G + 0.95, wf);
    for (const x of [-2, 2])
      for (const z of [-0.9, 0.9]) P.add(CYL(0.42, 0.42, 0.2, 10), 0x2a2a2a, wu + x, G + 0.42, wf + z, Math.PI / 2);
    for (let k = 0; k < 5; k++)
      P.add(BOX(1.15, 0.45, 2.1), k % 2 ? 0xe0c070 : 0xd4b060, wu - 2.3 + k * 1.15, G + 1.28, wf);
    P.add(BOX(2.2, 0.45, 2.1), 0xe0c070, wu + 0.6, G + 1.73, wf + 0.1);
    tractor(P, FD.TRACTOR[0], FD.TRACTOR[1]);
    P.add(BOX(1.4, 0.08, 0.08), 0x2a2a2a, wu + 3.6, G + 0.8, wf);
    // the scarecrow; round bales about the field
    scarecrow(P, FD.SCARE[0], FD.SCARE[1]);
    for (const [u, f] of BALES) {
      P.add(CYL(0.85, 0.85, 1.4, 14), 0xd8b462, u, G + 0.85, f, 0, 0, Math.PI / 2);
      P.add(CYL(0.86, 0.86, 0.1, 14), 0xa88a4a, u, G + 0.85, f, 0, 0, Math.PI / 2);
    }
    // the barn and silo, the grain bins, the farmhouse
    barn(P, FD.BARN[0], FD.BARN[1]);
    silo(P, FD.SILO[0], FD.SILO[1]);
    grainBin(P, 14, 38, 2.2, 4.2);
    grainBin(P, 18.8, 39, 2.6, 5);
    farmhouse(P, FD.HOUSE[0], FD.HOUSE[1]);
    // the standing corn along the back, tassels on top
    P.add(SLAB(80, 2.2, 3), 0xc8a84a, 0, G + 1.1, FD.CORN);
    for (let u = -39; u <= 39; u += 1.1)
      P.add(CONE(0.22, 0.7, 4), (u * 10) % 3 ? 0xe0c060 : 0xb89a3a, u, G + 2.45, FD.CORN - 1.3);
    // autumn trees along the lane and the field edges
    for (const [u, f, s, c] of [
      [-34, 26, 1.4, 0xd8742a],
      [-31, 31, 1.1, 0xc84a2a],
      [33, 30, 1.3, 0xe0a030],
      [35, 22, 1.2, 0xc8642a],
      [30, 46, 1.2, 0xd8742a],
      [-28, 44, 1.3, 0xe0a030]
    ])
      P.oak(u, f, s, c);
    P.scatter(
      30,
      52,
      85,
      (u, f, R) => P.oak(u, f, 1.3 + R() * 0.8, [0xd8742a, 0xc84a2a, 0xe0a030, 0x8a8a3a][Math.floor(R() * 4)]),
      85
    );
  },
  slots: [],
  cover: null
};

LAYOUTS.duck_field = L => {
  const fixed = { fixed: true, rail: false };
  // crows on the fence posts (none in front of the wagon)
  for (const posts of [FENCE_POSTS.slice(2, 5), FENCE_POSTS.slice(6, 9)])
    L.row({
      ...fixed,
      kind: "crow",
      n: 3,
      f: FD.FENCE - 0.05,
      u0: posts[0],
      u1: posts[2],
      base: 1.32,
      size: 0.36,
      tint: "steel",
      bank: 3
    });
  // pumpkins on the hay wagon
  L.row({
    ...fixed,
    kind: "duck_pumpkin",
    n: 5,
    f: FD.WAGON[1] - 0.6,
    u0: FD.WAGON[0] - 2.4,
    u1: FD.WAGON[0] + 2.2,
    base: 1.5,
    size: 0.42,
    tint: "orange",
    bank: 5
  });
  // the decoy spreads
  L.row({ ...fixed, kind: "goose", n: 4, f: 13, u0: -15, u1: -6, size: 0.75, tint: "steel", bank: 4 });
  L.row({ ...fixed, kind: "goose", n: 4, f: 16, u0: 0, u1: 6.5, size: 0.75, tint: ["brown", "steel"], bank: 4 });
  L.row({ ...fixed, kind: "goose", n: 4, f: 24, u0: -15, u1: -1.5, size: 0.75, tint: ["white", "steel"], bank: 4 });
  // crows on the scarecrow's arms, pumpkins on two round bales
  L.row({
    ...fixed,
    kind: "crow",
    n: 2,
    f: FD.SCARE[1] - 0.2,
    u0: FD.SCARE[0] - 1.15,
    u1: FD.SCARE[0] + 1.15,
    base: 2.06,
    size: 0.36,
    tint: "steel",
    bank: 2
  });
  for (const [u, f] of BALES.slice(0, 2))
    L.row({ ...fixed, kind: "duck_pumpkin", n: 1, f: f - 0.1, u0: u, u1: u, base: 1.68, size: 0.42, tint: "orange" });
  // geese and turkeys far out by the corn
  L.row({ ...fixed, kind: "goose", n: 3, f: 39, u0: -2, u1: 10, size: 0.85, tint: "steel", bank: 3 });
  L.row({ ...fixed, kind: "turkey", n: 3, f: 43.5, u0: -5, u1: 4, size: 0.8, tint: "brown" });
  // up out of the corn: geese lifting, crows
  L.pops({
    fixed: true,
    f: FD.CORN,
    at: [-36, -31, 1, 8, 14, 20].map(u => [u, 1.6]),
    size: 0.9,
    tint: "white",
    period: [4, 6.5],
    busy: 0.85,
    kinds: [
      ["duckfly", 65],
      ["crow", 35]
    ]
  });
  // the barn: the farmer in the hayloft or the big doors (don't), crows, a turkey
  const front = FD.BARN[1] - BARN.D / 2 - 0.7;
  L.pops({
    fixed: true,
    f: front,
    at: [[FD.BARN[0], BARN.EAVE + 0.45]],
    size: 1.25,
    tint: "steel",
    period: [4, 6],
    kinds: [
      ["farmer", 35, { dont: true }],
      ["crow", 65]
    ]
  });
  L.pops({
    fixed: true,
    f: front,
    at: [
      [FD.BARN[0] - 1.3, 0],
      [FD.BARN[0] + 1.3, 0]
    ],
    size: 1.3,
    tint: "brown",
    period: [4, 6],
    kinds: [
      ["farmer", 35, { dont: true }],
      ["turkey", 65]
    ]
  });
  // in the tractor's seat, and behind the round bales
  L.pops({
    fixed: true,
    f: FD.TRACTOR[1] - 0.1,
    at: [[FD.TRACTOR[0] - 0.4, 1.4]],
    size: 0.95,
    tint: "steel",
    period: [5, 7],
    kinds: [
      ["farmer", 40, { dont: true }],
      ["crow", 60]
    ]
  });
  L.pops({
    fixed: true,
    f: 22.6,
    at: [
      [-27, 0],
      [21, 0]
    ],
    size: 0.85,
    tint: "white",
    period: [4, 6],
    kinds: [["duckfly", 100]]
  });
};

const fieldWave = (R, add, c) => {
  const S = c.S;
  const crows = n => {
    for (let j = 0; j < n; j++)
      add(R(1, 24), "crow", across(R, { v: R(11, 14) * S, f: R(12, 40), h: R(3, 8), weave: 2 }));
  };
  const land = n => {
    for (let j = 0; j < n; j++)
      add(1 + j * 6 + R(0, 3), "duck_canada", landing(R, { u: R(-14, 6), f: R(13, 25), v: R(7, 9) * S, h: R(8, 12) }));
  };
  const V = (t, size) => vee(R, add, t, "duck_canada", size, { v: R(7.5, 9.5) * S, f: R(16, 34), h: R(8, 14) });
  if (c.x2) {
    // the big flight: V after V, and they all want the spread
    for (let k = 0; k < 4; k++) V(1 + k * 6.5, 7);
    land(4);
    crows(4);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 3 || k === 5) V(R(1, 6), 5);
  if (k === 3) V(R(15, 19), 5);
  if (k === 1 || k === 4 || k === 5) land(1 + n(1.2));
  crows(2 + n(k === 2 || k === 4 ? 2.5 : 1.6));
  if (k === 1 || k === 2 || k === 4)
    for (let j = 0; j < 1 + n(1); j++)
      add(R(1, 22), "duck_pheasant", flush(R, { u: R(-20, 20), f: R(10, 30), S: S * 1.1 }));
  // a coyote after the geese in the spread
  if (k !== 0)
    for (let j = 0; j < 1 + n(k === 2 || k === 4 ? 0.9 : 0.4); j++)
      add(2 + j * 9 + R(0, 4), "duck_coyote", run(R, { v: R(11, 13) * S, f: R(13, 30) }));
  if (k === 0 || k === 2) line(R, add, R(8, 18), "duck_mallard", 3, { v: R(7, 9) * S, f: R(14, 30), h: R(5, 9) });
  // the farmer walking out along the corn
  if (R(0, 1) < 0.3) {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(R(1, 12), "duck_farmer", cross(R, { u0: s * 22, u1: -s * 22, f: R(36, 41), v: R(1.4, 1.8) }));
  }
};

// ---- Level 4: the salt marsh ----------------------------------------------------

// Marsh grass in front, tidal creeks winding through it, a mudflat where the
// crabs are, the fish shack on stilts, a boardwalk out to a blind, old pier
// pilings, the dunes on the right, the beach, the sea and the lighthouse on
// its point. The sun's going down over the water.
const CO = { MUD: 6.5, SHACK: [14, 9], BOARD: -8, PILES: 30, BEACH: 36, LIGHT: [-30, 56] };
const PILES = span(6, 4, 16);
const DUNES = [
  [22, 25],
  [28, 28],
  [34, 24],
  [19, 31]
];

function lighthouse(P, u, f) {
  for (let k = 0; k < 7; k++) {
    const r0 = 1.7 - k * 0.13;
    P.add(CYL(r0 - 0.13, r0, 2, 12), k % 2 ? 0xf4efe2 : 0xc0282a, u, G + 1.5 + k * 2, f);
  }
  P.add(CYL(1.35, 1.35, 0.2, 12), 0x2a2a2a, u, G + 15.6, f);
  P.add(TORUS(1.3, 0.05, 12), 0x2a2a2a, u, G + 16.3, f, Math.PI / 2);
  P.add(CYL(0.85, 0.85, 1.4, 10), 0xffe890, u, G + 16.4, f);
  P.add(CONE(1.05, 1.0, 10), 0xc0282a, u, G + 17.6, f);
  P.add(BALL(0.15, 5), 0x2a2a2a, u, G + 18.2, f);
  P.add(BOX(0.8, 1.4, 0.1), 0x2a2a2a, u, G + 2.2, f - 1.62);
}
function shack(P, u, f) {
  for (const x of [-1.6, 1.6]) for (const z of [-1, 1]) post(P, u + x, f + z, 1.4, 0x5a5048, 0.1);
  P.add(BOX(4.4, 0.14, 3.2), 0x7a6a5a, u, G + 1.4, f);
  P.add(BOX(3.6, 2.4, 2.4), 0x5a7a8a, u, G + 2.65, f + 0.2);
  roof(P, u, f + 0.2, 3.6, 2.4, G + 3.85, 0.5, 0x4a3a34);
  P.add(BOX(0.8, 1.7, 0.08), 0x2a2420, u - 1.1, G + 2.3, f - 1.02);
  P.add(BOX(0.7, 0.6, 0.08), 0xffc870, u + 1.1, G + 3.0, f - 1.02);
  for (let k = 0; k < 4; k++)
    P.add(BOX(0.2, 0.06, 0.7), 0x7a6a5a, u - 2.4, G + 0.25 + k * 0.32, f - 1.3 - k * 0.12, -0.4);
  // lobster pots stacked by it
  for (const [x, y] of [
    [2.8, 0],
    [3.8, 0],
    [3.3, 0.5]
  ]) {
    P.add(BOX(0.9, 0.5, 0.6), 0x3a4a3a, u + x, G + 0.25 + y, f - 0.6);
    P.add(BOX(0.92, 0.04, 0.62), 0xc8b880, u + x, G + 0.5 + y, f - 0.6);
  }
}

WORLDS.duck_coast = {
  sky: {
    top: "#24204a",
    mid: "#b04a6a",
    horizon: "#ffa860",
    ground: "#2a4a72",
    sun: [18, 3, "#ffd890", 20],
    clouds: 9,
    cloud: "rgba(255,150,120,0.45)",
    seed: 63
  },
  fog: 0xa07a8a,
  signs: [
    ["POINT HOPE LIGHT", CO.LIGHT[0] + 5, G + 3.4, CO.LIGHT[1] - 2.3, 3.6, 0.55, "#f4efe2", "#2a2a2a"],
    ["BAIT & TACKLE", CO.SHACK[0], G + 4.3, CO.SHACK[1] - 1.06, 2.4, 0.45, "#c0282a", "#f4efe2"]
  ],
  build(P) {
    P.ground(0x8a8a4a, [
      { u: -20, f: 3, r: 9, c: 0x7a7a3a, sx: 1.6, sz: 0.3 },
      { u: 16, f: 4, r: 8, c: 0x9a9450, sx: 1.8, sz: 0.3 },
      { u: 0, f: 66, r: 40, c: 0x22406a, sx: 2.4, sz: 0.68 },
      { u: 0, f: 37, r: 20, c: 0xd8c090, sx: 3.6, sz: 0.18 },
      { u: 18, f: 60, r: 10, c: 0xf0a070, sx: 0.5, sz: 1.6 },
      { u: -30, f: 55, r: 6, c: 0x6a6460, sx: 1.4, sz: 0.8 },
      { u: 26, f: 27, r: 9, c: 0xd8c08a, sx: 1.4, sz: 0.8 },
      { u: 0, f: CO.MUD, r: 8, c: 0x7a6a50, sx: 1.6, sz: 0.4 },
      { u: -22, f: 13, r: 6, c: 0x5a6a88, sx: 1.8, sz: 0.35 },
      { u: -6, f: 13.5, r: 6, c: 0x5a6a88, sx: 1.6, sz: 0.3 },
      { u: 6, f: 16, r: 5, c: 0x6a7a98, sx: 1.6, sz: 0.35 },
      { u: 12, f: 21, r: 4, c: 0x6a7a98, sx: 1.2, sz: 0.6 },
      { u: 6, f: 24, r: 4, c: 0x7a6a50, sx: 1.6, sz: 0.4 },
      { u: -16, f: 24, r: 5, c: 0x9a8a48, sx: 1.6, sz: 0.5 }
    ]);
    // the surf: lines of foam along the shore, the sun's path on the water
    for (const [f, w] of [
      [41, 70],
      [45, 60],
      [51, 70],
      [60, 80]
    ])
      for (let u = -w / 2; u < w / 2; u += 6.5)
        P.add(BOX(5.2, 0.28, 0.4), 0xf4efe8, u + ((f * 3) % 4), G + 0.1, f, -0.3, 0, 0);
    for (let k = 0; k < 6; k++) P.add(BOX(2.4 - k * 0.25, 0.05, 0.5), 0xffd890, 14 + k * 1.2, G + 0.12, 44 + k * 4);
    // the fish shack, the beached rowboat
    shack(P, CO.SHACK[0], CO.SHACK[1]);
    rowboat(P, -14, 7, 0x2f6a8a, 0.6);
    // the boardwalk out through the marsh, a reed blind at the end
    P.add(SLAB(1.4, 0.1, 26), 0x8a7a62, CO.BOARD, G + 0.6, 15);
    for (let f = 3; f <= 28; f += 2.5) for (const s of [-0.65, 0.65]) post(P, CO.BOARD + s, f, 1.4, 0x6a5a4a, 0.06);
    for (const s of [-0.65, 0.65]) P.add(SLAB(0.06, 0.06, 26), 0x6a5a4a, CO.BOARD + s, G + 1.4, 15);
    P.add(BOX(3, 1.4, 0.2), 0x9a8a52, CO.BOARD, G + 1.3, 28.6);
    for (let k = 0; k < 8; k++) P.add(CONE(0.1, 0.7, 3), 0xb8a862, CO.BOARD - 1.4 + k * 0.4, G + 2.2, 28.6);
    // the old pier's pilings
    for (const u of PILES) {
      post(P, u, CO.PILES, 1.9, 0x5a5048, 0.16);
      P.add(CYL(0.17, 0.17, 0.1, 6), 0x8a8a8a, u, G + 1.9, CO.PILES);
    }
    P.add(BOX(13, 0.25, 0.3), 0x5a5048, 10, G + 1.0, CO.PILES + 0.15);
    // the dunes: sand, beach grass, a slatted fence
    for (const [u, f] of DUNES) {
      P.add(BALL(3.4, 9), 0xe0c890, u, G - 0.4, f, 0, 0, 0, 1.4, 0.62, 1.1);
      for (let k = 0; k < 4; k++) grassTuft(P, u - 2.5 + k * 1.7, f - 1 + (k % 2), 1.1, 0x9aa04a);
    }
    for (let u = 17; u <= 37; u += 0.5)
      P.add(BOX(0.08, 1.0, 0.04), 0x9a8a6a, u, G + 0.5, 21.5, 0, 0, (u * 7) % 3 > 1.5 ? 0.06 : -0.04);
    P.add(BOX(20, 0.05, 0.05), 0x4a4a4a, 27, G + 0.8, 21.5);
    // driftwood on the beach, an anchor
    P.add(CYL(0.2, 0.28, 5, 6), 0xb8aa98, -6, G + 0.22, 34, 0, 0.3, Math.PI / 2);
    P.add(CYL(0.15, 0.2, 3, 6), 0xa89a88, 6, G + 0.18, 35.5, 0, -0.5, Math.PI / 2);
    // the lighthouse on its point, the keeper's house
    const [lu, lf] = CO.LIGHT;
    for (const [x, z, s] of [
      [-2, -1, 2],
      [2, 1, 1.8],
      [0, -3, 1.4],
      [4, -2, 1.2],
      [-4, 2, 1.6]
    ])
      P.rock(lu + x, lf + z, s, 0x5a5650);
    lighthouse(P, lu, lf);
    P.add(BOX(5.6, 3, 4), 0xf4efe2, lu + 5, G + 1.5, lf + 0.5);
    roof(P, lu + 5, lf + 0.5, 5.6, 4, G + 3, 0.6, 0xc0282a);
    P.add(BOX(0.9, 0.9, 0.08), 0xffd27a, lu + 6.4, G + 1.8, lf - 1.52);
    // a lobster boat on its mooring, a rock jetty off the point
    P.add(BOX(6, 1.1, 2.2), 0xf4efe2, -17, G + 0.45, 48);
    P.add(BOX(1.56, 1.1, 1.56), 0xf4efe2, -14, G + 0.45, 48, 0, Math.PI / 4, 0);
    P.add(BOX(6.1, 0.22, 2.25), 0xc0282a, -17, G + 0.05, 48);
    P.add(BOX(2.2, 1.4, 1.8), 0xe8e4dc, -17.6, G + 1.7, 48);
    P.add(BOX(2.24, 0.45, 1.6), 0x2a3440, -17.6, G + 2.0, 48);
    P.add(BOX(2.6, 0.12, 2.1), 0x3a6a8a, -17.6, G + 2.45, 48);
    P.add(BOX(0.1, 3.4, 0.1), 0x5a5a5a, -19.2, G + 2.6, 48);
    for (let k = 0; k < 7; k++) P.rock(-25 + k * 2.1, 53 + (k % 2) * 0.6, 1.3 - k * 0.08, 0x5a5650);
    // a sailboat out on the evening sea
    P.add(BOX(3.4, 0.6, 1), 0xf4efe2, 6, G + 0.3, 74);
    P.add(BOX(0.08, 5, 0.08), 0x5a5a5a, 6, G + 3, 74);
    P.add(CONE(1.5, 4.4, 3), 0xfbf4ea, 6.8, G + 3, 74, 0, 0, 0, 0.6, 1, 0.05);
    // the marsh grass and the reeds by the creeks
    P.scatter(
      60,
      3,
      30,
      (u, f, R) => {
        if (u > 15 && f > 18) return;
        if (Math.abs(u - CO.BOARD) < 1.5) return;
        grassTuft(P, u, f, 0.8 + R() * 0.5);
      },
      36
    );
    for (const [u, f] of [
      [-26, 11],
      [-18, 15.5],
      [-11, 11.2],
      [-2, 15.8],
      [10, 13.8],
      [16, 18.5]
    ])
      P.reeds(u, f, 0.8);
    // and the near edge of the marsh, right under you
    for (let k = 0; k < 24; k++) {
      const u = -34 + k * 2.9 + ((k * 7) % 3) * 0.5;
      if (Math.abs(u - CO.BOARD) > 1.5) grassTuft(P, u, 0.5 + ((k * 5) % 4) * 0.6, 1.1 + ((k * 3) % 2) * 0.3);
    }
  },
  slots: [],
  cover: null
};

LAYOUTS.duck_coast = L => {
  const fixed = { fixed: true, rail: false };
  // crabs on the mudflat and on the sandbar
  L.row({
    kind: "duck_crab",
    n: 5,
    f: CO.MUD,
    u0: -3.6,
    u1: 3.6,
    base: 0.02,
    size: 0.3,
    tint: "red",
    bank: 5,
    rail: false
  });
  L.row({
    ...fixed,
    kind: "duck_crab",
    n: 3,
    f: 24,
    u0: 3.5,
    u1: 8.5,
    base: 0.02,
    size: 0.34,
    tint: "orange",
    bank: 3
  });
  // floats hung on the shack
  L.row({
    ...fixed,
    kind: "duck_buoy",
    n: 4,
    f: CO.SHACK[1] - 1.1,
    u0: CO.SHACK[0] - 0.4,
    u1: CO.SHACK[0] + 1.7,
    base: 1.62,
    size: 0.42,
    tint: ["red", "yellow", "white", "blue"],
    bank: 4
  });
  // eider decoys in the creek
  L.row({ ...fixed, kind: "duck", n: 5, f: 13.5, u0: -9, u1: 0, size: 0.4, tint: ["white", "brown"], bank: 5 });
  // egrets out in the marsh
  for (const [u, f] of [
    [-18, 21],
    [-3, 19.5],
    [11, 21.5]
  ])
    L.row({ ...fixed, kind: "heron", n: 1, f, u0: u, u1: u, size: 1.0, tint: "white" });
  // brant on the beach, and the light in the lighthouse
  L.row({ ...fixed, kind: "goose", n: 4, f: 37.5, u0: -12, u1: 9, size: 0.8, tint: "steel", bank: 4 });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 1,
    f: CO.LIGHT[1] - 0.95,
    u0: CO.LIGHT[0],
    u1: CO.LIGHT[0],
    base: 15.75,
    size: 0.9,
    tint: "gold",
    pts: 50
  });
  // on the pilings: a gull (don't) or an eider getting up
  const gulls = (dont, duck) => [
    ["duck_gull", dont, { dont: true }],
    ["duckfly", duck]
  ];
  L.pops({
    fixed: true,
    f: CO.PILES - 0.2,
    at: PILES.map(u => [u, 1.96]),
    size: 0.55,
    tint: "white",
    period: [4, 6],
    busy: 0.85,
    kinds: gulls(40, 60)
  });
  // up out of the dune grass and the creek reeds
  L.pops({
    fixed: true,
    f: 26,
    at: DUNES.slice(0, 3).map(([u]) => [u, 0.55]),
    size: 0.7,
    tint: "white",
    period: [4, 6],
    busy: 0.85,
    kinds: gulls(25, 75)
  });
  L.pops({
    fixed: true,
    f: 12,
    at: [-26, -11, 10].map(u => [u, 0]),
    size: 0.6,
    tint: "white",
    period: [4, 6],
    busy: 0.85,
    kinds: gulls(15, 85)
  });
  // behind the beached rowboat
  L.pops({ fixed: true, f: 7.8, at: [[-14.4, 0.2]], size: 0.6, tint: "white", period: [4, 6], kinds: gulls(20, 80) });
  // the birdwatcher on the boardwalk (don't), or an egret stepping out
  L.pops({
    fixed: true,
    peek: true,
    f: 28.2,
    at: [[CO.BOARD - 0.4, 0.66]],
    size: 1.55,
    slide: 1.9,
    period: [5, 7],
    kinds: [
      ["duck_birder", 45, { dont: true }],
      ["heron", 55]
    ]
  });
};

const coastWave = (R, add, c) => {
  const S = c.S;
  // low over the waves: strings of eiders, scoters in pairs and threes
  const string = (t, kind, size) =>
    line(R, add, t, kind, size, {
      v: (kind === "duck_scoter" ? R(12, 15) : R(9, 11.5)) * S,
      f: R(30, 48),
      h: G + R(1.6, 3.2),
      gap: 0.3,
      df: 0.5,
      amp: 0.15
    });
  const gull = t =>
    add(t, "duck_gull", across(R, { v: R(4.5, 6.5) * S, f: R(14, 36), h: R(4, 10), weave: 2.2, amp: 0.6 }));
  if (c.x2) {
    // the evening flight comes in off the sea
    for (let k = 0; k < 6; k++) string(1 + k * 4, k % 2 ? "duck_scoter" : "duck_eider", 5);
    for (let k = 0; k < 2; k++) gull(4 + k * 10);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  // (a string every 9 s or so, scoters in the gaps between)
  for (let j = 0; j < 1 + n(k === 0 || k === 3 ? 1.6 : 0.8); j++)
    string(1 + j * 9 + R(0, 2), "duck_eider", k === 3 ? 4 : 3);
  if (k !== 0)
    for (let j = 0; j < n(k === 1 || k === 4 ? 1.7 : 0.8); j++) string(5.5 + j * 9 + R(0, 2), "duck_scoter", 2);
  // teal off the creeks
  if (k === 2 || k === 5)
    for (let j = 0; j < 2 + n(1.5); j++) add(R(1, 22), "teal", flush(R, { u: R(-24, 14), f: R(11, 17), S: S * 1.2 }));
  // crabs out across the mud
  if (k !== 0 && k !== 3)
    for (let j = 0; j < 1 + n(k === 2 || k === 4 ? 1.4 : 0.8); j++) {
      const s = R(0, 1) < 0.5 ? 1 : -1;
      add(
        1 + j * 7 + R(0, 3),
        "duck_crab",
        cross(R, { u0: s * 11, u1: -s * 11, f: R(4.8, 8.5), v: R(2.6, 3.6) * S, bob: 0.03 })
      );
    }
  if (R(0, 1) < 0.6) gull(R(1, 22));
  if (k === 3) gull(R(8, 22));
};

// ---- Level 5: the great migration --------------------------------------------------

// A northern lake in the first snow: a snowbank in front, the ice with open
// water through it where the ducks sit, ice huts, an island of pines, a log
// cabin on the shore, the far shore under the snowy hills.
const NO = { BANK: 3.5, LEAD: 15, ISLAND: [17, 30], CABIN: [-25, 31], FAR: 42 };
const HUTS = [
  [-9, 9, 0xc0282a],
  [5, 22, 0x2f6aa8],
  [-15, 26, 0xf2c230]
];
const STUMPS = [
  [10, 6],
  [13.5, 6.6]
];

function hut(P, u, f, c) {
  P.add(BOX(2, 2, 1.8), c, u, G + 1.05, f);
  roof(P, u, f, 2, 1.8, G + 2.05, 0.45, 0xf2f6fa);
  P.add(BOX(0.7, 1.5, 0.06), 0x2a2a2a, u - 0.4, G + 0.8, f - 0.92);
  P.add(BOX(0.4, 0.3, 0.06), 0xffd27a, u + 0.5, G + 1.4, f - 0.92);
  P.add(CYL(0.07, 0.07, 1.2, 5), 0x3a3a3a, u + 0.6, G + 2.6, f + 0.4);
  P.add(BOX(0.06, 1.7, 0.06), 0x5a4a3a, u + 1.3, G + 0.85, f - 1.0);
  P.add(CYL(0.25, 0.25, 0.04, 8), 0x1a2a3a, u + 1.6, G + 0.08, f - 1.8);
}

WORLDS.duck_north = {
  sky: {
    top: "#5a6478",
    mid: "#a4aec0",
    horizon: "#e8ecf2",
    ground: "#c8d0da",
    sun: [-35, 11, "#fff4dc", 10],
    clouds: 14,
    cloud: "rgba(236,240,246,0.65)",
    hills: [
      { colour: "#a8b4c8", height: 13, rough: 2, phase: 1 },
      { colour: "#4a5a5a", height: 5.5, rough: 4, trees: true }
    ],
    seed: 64
  },
  fog: 0xdce2ea,
  signs: [
    ["NORTH LAKE CAMP", NO.CABIN[0], G + 3.35, NO.CABIN[1] - 2.62, 3, 0.5, "#3a2414", "#f2e2b8"],
    ["THIN ICE", 1.5, G + 1.25, NO.LEAD - 2.6, 1.4, 0.45, "#f2c230", "#2a2a2a"]
  ],
  build(P) {
    P.ground(0xe8eef4, [
      { u: 0, f: 24, r: 30, c: 0xc0d4e2, sx: 1.8, sz: 0.7 },
      { u: 2, f: NO.LEAD, r: 12, c: 0x2a4658, sx: 1.6, sz: 0.13 },
      { u: -20, f: 18, r: 6, c: 0xd8e6f0, sx: 1.5, sz: 0.4 },
      { u: 10, f: 34, r: 7, c: 0xd8e6f0, sx: 1.6, sz: 0.3 },
      { u: -4, f: 9, r: 5, c: 0xa8c0d2, sx: 2.2, sz: 0.25 },
      { u: NO.ISLAND[0], f: NO.ISLAND[1], r: 4, c: 0xeef2f6, sx: 1.5, sz: 0.8 }
    ]);
    // the snowbank in front, rocks with snow on them
    for (const [u, f, s] of [
      [-24, 2.5, 2.4],
      [-14, 2.2, 1.8],
      [18, 2.8, 2.2],
      [27, 3.4, 2.6],
      [4, 1.8, 1.5]
    ])
      P.add(BALL(s, 8), 0xf4f8fc, u, G - s * 0.45, f, 0, 0, 0, 1.6, 0.8, 1);
    for (const [u, f, s] of [
      [-20, 4.4, 1],
      [22, 5, 1.2],
      [-30, 20, 1.6],
      [31, 18, 1.4]
    ]) {
      P.rock(u, f, s, 0x6a6e74);
      P.add(BALL(0.75 * s, 6), 0xf4f8fc, u, G + 0.55 * s, f, 0, 0, 0, 1.1, 0.4, 1);
    }
    // stumps (the owls), the overturned canoe, the dock
    for (const [u, f] of STUMPS) {
      P.add(CYL(0.32, 0.38, 0.8, 8), 0x5a4232, u, G + 0.4, f);
      P.add(CYL(0.33, 0.33, 0.08, 8), 0xf4f8fc, u, G + 0.82, f);
    }
    P.add(CAP(0.42, 3.6, 7), 0xc0402a, 4, G + 0.22, 4.3, 0, 0.25, Math.PI / 2, 0.5, 1, 1);
    P.add(SLAB(1.6, 0.12, 5), 0x6a5a4a, -3, G + 0.45, 6);
    P.add(SLAB(1.62, 0.06, 5), 0xf4f8fc, -3, G + 0.53, 6);
    for (const f of [4, 6, 8.2]) for (const s of [-0.7, 0.7]) post(P, -3 + s, f, 0.8, 0x4a3a2a, 0.07);
    // the ice huts out on the lake, the THIN ICE sign by the open water
    for (const [u, f, c] of HUTS) hut(P, u, f, c);
    post(P, 1.5, NO.LEAD - 2.55, 1.0, 0x5a4a3a, 0.05);
    for (let k = 0; k < 8; k++)
      P.add(
        BOX(1.4 + (k % 3) * 0.6, 0.05, 0.9),
        0xe0ecf4,
        -14 + k * 4.2,
        G + 0.11,
        NO.LEAD + (k % 2 ? 1.7 : -1.7),
        0,
        k * 0.7,
        0
      );
    // tip-ups set over holes in the ice, their flags up
    for (const [u, f] of [
      [-3, 11],
      [9, 10],
      [12, 19],
      [-20, 13],
      [-6, 21]
    ]) {
      P.add(CYL(0.22, 0.22, 0.04, 8), 0x1a2a3a, u, G + 0.07, f);
      P.add(BOX(0.04, 0.9, 0.04), 0x5a4a3a, u, G + 0.45, f);
      P.add(BOX(0.3, 0.2, 0.02), 0xff6a1a, u + 0.16, G + 0.8, f);
    }
    // the island
    const [iu, i_f] = NO.ISLAND;
    P.rock(iu - 2, i_f - 1, 1.6, 0x6a6e74);
    P.rock(iu + 2.5, i_f - 0.5, 1.3, 0x5a5e64);
    for (const [x, z, s] of [
      [0, 1, 1.3],
      [-2, 2, 1],
      [2.4, 1.5, 1.1],
      [1, 3, 1.5]
    ])
      snowPine(P, iu + x, i_f + z, s);
    // the cabin on the shore: logs, snow on the roof, a woodpile, smoke
    const [cu, cf] = NO.CABIN;
    P.add(BOX(7, 3, 5), 0x6a4a2e, cu, G + 1.5, cf);
    for (let k = 0; k < 5; k++) P.add(BOX(7.04, 0.07, 0.06), 0x3a2a1a, cu, G + 0.35 + k * 0.55, cf - 2.52);
    roof(P, cu, cf, 7, 5, G + 3, 0.6, 0xf4f8fc);
    P.add(BOX(1, 1.9, 0.08), 0x2a1a10, cu + 1.5, G + 0.95, cf - 2.52);
    for (const du of [-1.6, -0.2]) P.add(BOX(0.8, 0.7, 0.08), 0xffd27a, cu + du, G + 1.7, cf - 2.53);
    P.add(BOX(0.9, 4.4, 0.9), 0x7a7670, cu - 2.6, G + 2.2, cf + 0.5);
    smoke(P, cu - 2.6, G + 4.8, cf + 0.5);
    for (let k = 0; k < 6; k++)
      P.add(
        CYL(0.15, 0.15, 1.2, 6),
        0x8a6a46,
        cu + 4.4,
        G + 0.16 + (k % 3) * 0.3,
        cf - 1 + Math.floor(k / 3) * 0.32,
        Math.PI / 2
      );
    P.add(BOX(1.3, 0.06, 0.8), 0xf4f8fc, cu + 4.4, G + 0.98, cf - 0.85);
    // the far shore: pines in the snow under the hills
    for (let u = -48; u <= 48; u += 4.6)
      snowPine(P, u + ((u * 7) % 3), NO.FAR + 4 + ((u * 3) % 4), 1.2 + ((u * 13) % 5) * 0.1);
    for (const [u, f, s] of [
      [-30, 26, 1.4],
      [-33, 34, 1.6],
      [33, 26, 1.3],
      [30, 33, 1.5],
      [-19, 37, 1.1]
    ])
      snowPine(P, u, f, s);
    P.scatter(14, 56, 85, (u, f, R) => snowPine(P, u, f, 1.6 + R() * 0.8), 85);
  },
  slots: [],
  cover: null
};

LAYOUTS.duck_north = L => {
  const fixed = { fixed: true, rail: false };
  // snowshoe hares on the snowbank, snowy owls on the stumps
  L.row({ ...fixed, kind: "rabbit", n: 4, f: 4.6, u0: -12, u1: -5, base: 0.05, size: 0.38, tint: "white", bank: 4 });
  for (const [u, f] of STUMPS)
    L.row({ ...fixed, kind: "owl", n: 1, f: f - 0.1, u0: u, u1: u, base: 0.85, size: 0.5, tint: "white", bank: 0 });
  // the lanterns by the huts' doors
  for (const [u, f] of HUTS)
    L.row({
      ...fixed,
      kind: "lantern",
      n: 1,
      f: f - 1.05,
      u0: u + 1.3,
      u1: u + 1.3,
      base: 1.32,
      size: 0.3,
      tint: "gold"
    });
  // decoys on the open water, snow-goose decoys out on the ice
  L.row({
    ...fixed,
    kind: "duck",
    n: 6,
    f: NO.LEAD,
    u0: -9,
    u1: 11,
    size: 0.4,
    tint: ["white", "brown", "green"],
    bank: 3
  });
  L.row({ ...fixed, kind: "goose", n: 4, f: 26, u0: -6, u1: 1.5, size: 0.75, tint: "white", bank: 4 });
  L.row({ ...fixed, kind: "goose", n: 3, f: 36, u0: -10, u1: 6, size: 0.8, tint: "steel", bank: 3 });
  // a fox out on the ice, moose on the far shore
  L.row({ ...fixed, kind: "wolf", n: 2, f: 30, u0: -4, u1: 8, size: 0.6, tint: "orange" });
  L.row({ ...fixed, kind: "duck_moose", n: 2, f: NO.FAR + 1, u0: -12, u1: 9, size: 1.9, tint: "brown" });
  // ducks up off the open water
  L.pops({
    fixed: true,
    f: NO.LEAD + 0.6,
    at: [-12, -4, 8, 14].map(u => [u, 0]),
    size: 0.6,
    tint: "white",
    period: [4, 6],
    busy: 0.85,
    kinds: [["duckfly", 100]]
  });
  // round the huts: the game warden checking licences (don't), or a goose getting up
  for (const [u, f] of HUTS)
    L.pops({
      fixed: true,
      peek: true,
      f: f + 0.3,
      at: [[u - 0.2, 0]],
      size: 1.35,
      slide: 1.7,
      period: [4.5, 6.5],
      kinds: [
        ["ranger", 35, { dont: true }],
        ["duckfly", 65]
      ]
    });
  // geese up off the island and along the far shore
  L.pops({
    fixed: true,
    f: NO.ISLAND[1] - 0.5,
    at: [
      [NO.ISLAND[0] - 3, 0.4],
      [NO.ISLAND[0] + 3.6, 0.4]
    ],
    size: 0.9,
    tint: "white",
    period: [4, 6],
    kinds: [["duckfly", 100]]
  });
  L.pops({
    fixed: true,
    f: NO.FAR + 2,
    at: [-30, -20, 18, 28].map(u => [u, 0]),
    size: 1.0,
    tint: "white",
    period: [4, 6],
    busy: 0.85,
    kinds: [["duckfly", 100]]
  });
};

// A mixed flock: one kind, in a loose bunch.
function bunch(R, add, t, kind, size, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = R(26, 30);
  for (let j = 0; j < size; j++)
    add(
      t + R(0, 1.4),
      kind,
      across(R, { v: o.v * R(0.96, 1.04), dir, u0, f: o.f + R(-3, 3), h: o.h + R(-1.2, 1.2), amp: 0.25 })
    );
}
const FLOCKS = [
  ["teal", [11, 13], 5],
  ["duck_pintail", [9, 11], 4],
  ["duck_mallard", [7.5, 9], 4],
  ["duck_snowgoose", [7, 8.5], 5]
];

const northWave = (R, add, c) => {
  const S = c.S;
  const flock = (t, which) => {
    const [kind, [v0, v1], size] = which || pick(R, FLOCKS);
    bunch(R, add, t, kind, size, { v: R(v0, v1) * S, f: R(16, 40), h: R(5, 13) });
  };
  const V = (t, size) => vee(R, add, t, "duck_canada", size, { v: R(7.5, 9.5) * S, f: R(20, 40), h: R(9, 15) });
  const swans = t => {
    const dir = R(0, 1) < 0.5 ? 1 : -1;
    const f = R(18, 34);
    const h = R(6, 11);
    for (let j = 0; j < 2; j++)
      add(t + j * 0.6, "duck_swan", across(R, { v: 6 * S, dir, f: f + j, h: h + j * 0.3, amp: 0.2 }));
  };
  if (c.x2) {
    // the sky is full of them, and the golden goose is in among them
    for (let k = 0; k < 3; k++) V(1 + k * 8, 7);
    for (let k = 0; k < 5; k++) flock(3 + k * 4.5, FLOCKS[k % FLOCKS.length]);
    swans(10);
    add(13, "duck_golden", across(R, { v: 9 * S, f: R(24, 34), h: R(8, 11), amp: 0.3, weave: 1.2 }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  // a flock or a V every 9 s or so
  const groups = 2 + n(k === 1 || k === 4 || k === 5 ? 0.9 : 0.4);
  for (let j = 0; j < groups; j++) {
    const t = 1 + j * 9 + R(0, 1.5);
    if ((j + k) % 3 === 1) V(t, 5);
    else flock(t);
  }
  if (k === 2 || k === 5)
    for (let j = 0; j < 1 + n(1); j++)
      add(5 + j * 9 + R(0, 2), "teal", flush(R, { u: R(-14, 16), f: NO.LEAD + R(-1, 1), S: S * 1.2 }));
  // a fox trotting out across the ice
  if (k === 0 || k === 3 || k === 4) add(R(2, 16), "duck_fox", run(R, { v: R(10, 12) * S, f: R(18, 30) }));
  if (R(0, 1) < 0.35) swans(R(2, 20));
  // (rare) the golden goose
  if (R(0, 1) < 0.06 + 0.12 * c.p)
    add(R(3, 18), "duck_golden", across(R, { v: 9 * S, f: R(24, 38), h: R(8, 12), amp: 0.3, weave: 1.2 }));
};

// ---- Ambience (procedural, over nothing: each makes its own wind) -------------------

// Events at fixed times in the 8 s loop: a chirp is a little falling whistle,
// a honk two nasal tones, a caw a rasp, a cry a gull's falling yelp.
function voice(type, e, hz) {
  if (type === "chirp")
    return e < 0.3 ? Math.sin(2 * Math.PI * (hz * e - 1500 * e * e)) * Math.sin((Math.PI * e) / 0.3) * 0.05 : 0;
  if (type === "honk") {
    if (e >= 0.42) return 0;
    const f = e < 0.2 ? hz : hz * 1.15;
    return Math.sign(Math.sin(2 * Math.PI * f * e)) * Math.sin((Math.PI * (e % 0.21)) / 0.21) * 0.03;
  }
  if (type === "caw") return e < 0.28 ? (((hz * e) % 1) - 0.5) * Math.sin((Math.PI * e) / 0.28) * 0.07 : 0;
  if (type === "cry")
    return e < 0.5
      ? Math.sin(2 * Math.PI * (hz * e - 380 * e * e) + 2 * Math.sin(e * 60)) * Math.sin((Math.PI * e) / 0.5) * 0.045
      : 0;
  return 0;
}
function amb(events, bed) {
  return (d, sr, R) => {
    let lp = 0;
    let lp2 = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      const x = R() * 2 - 1;
      lp += 0.02 * (x - lp);
      lp2 += 0.25 * (x - lp2);
      let v = bed(t, lp, lp2 - lp);
      const tt = t % 8;
      for (const [type, t0, hz] of events) {
        const e = tt - t0;
        if (e > 0 && e < 0.6) v += voice(type, e, hz);
      }
      d[i] += v;
    }
  };
}
// dawn on the river: water babbling, songbirds waking up
AMBIENCE.duck_river = amb(
  [
    ["chirp", 0.6, 3400],
    ["chirp", 0.95, 3600],
    ["chirp", 2.9, 4100],
    ["chirp", 3.3, 3900],
    ["chirp", 5.8, 3000],
    ["chirp", 7.0, 4400]
  ],
  (t, wind, band) => wind * 1.1 + band * (0.35 + 0.25 * Math.sin(t * 7.3) * Math.sin(t * 2.1))
);
// the fields: wind in the stubble, crows, geese a long way off
AMBIENCE.duck_field = amb(
  [
    ["caw", 1.2, 560],
    ["caw", 1.55, 540],
    ["honk", 2.6, 330],
    ["honk", 3.1, 350],
    ["caw", 4.9, 600],
    ["honk", 6.2, 320]
  ],
  (t, wind) => wind * (1.8 + 0.8 * Math.sin((t * Math.PI) / 4))
);
// the coast: surf rolling in twice a loop, gulls
AMBIENCE.duck_coast = amb(
  [
    ["cry", 1.5, 1300],
    ["cry", 2.05, 1200],
    ["cry", 5.6, 1400]
  ],
  (t, wind, band) => {
    const swell = Math.max(0, Math.sin((t * Math.PI) / 2)) ** 2;
    return wind * (1 + 1.6 * swell) + band * 0.5 * swell;
  }
);
// the north: a cold wind, geese everywhere, the ice creaking
AMBIENCE.duck_north = amb(
  [
    ["honk", 0.4, 310],
    ["honk", 0.9, 340],
    ["honk", 1.7, 300],
    ["honk", 2.5, 360],
    ["honk", 3.4, 320],
    ["honk", 4.6, 345],
    ["honk", 5.1, 305],
    ["honk", 6.3, 335],
    ["honk", 7.2, 315]
  ],
  (t, wind, band) => {
    const creak = t % 8 > 3.8 && t % 8 < 4.6 ? Math.sin(2 * Math.PI * (70 - 30 * ((t % 8) - 3.8)) * t) * 0.05 : 0;
    return wind * 2.2 + band * 0.25 * (0.5 + 0.5 * Math.sin(t * 1.7)) + creak;
  }
);

// ---- The campaign ------------------------------------------------------------------

export const DUCK = {
  name: "HUNTING SEASON",
  first: "Opening morning: the season starts at the decoy pond",
  kinds,
  levels: [
    {
      world: "duck_river",
      name: "THE RIVER BEND",
      story: "Dawn on the river. They're coming off the water",
      music: "duck",
      amb: "duck_river",
      legend: "KINGFISHER 50 · TEAL 25 · MALLARD AND WOOD DUCK 10  ·  DON'T SHOOT THE DOG",
      wave: riverWave,
      title: (w, x2) => (x2 ? "THE BIG FLUSH · DOUBLE POINTS" : null)
    },
    {
      world: "duck_field",
      name: "THE GOOSE FIELDS",
      story: "October. The geese are working the corn",
      music: "duck",
      amb: "duck_field",
      legend: "CROW 25 · PHEASANT 15 · GEESE 10 · COYOTE 75  ·  DON'T SHOOT THE FARMER",
      wave: fieldWave,
      title: (w, x2) => (x2 ? "THE BIG V · DOUBLE POINTS" : null)
    },
    {
      world: "duck_coast",
      name: "THE SALT MARSH",
      story: "Sunset on the coast. The sea ducks fly low",
      music: "duck",
      amb: "duck_coast",
      legend: "SCOTER 25 · EIDER 15 · CRAB 50  ·  GULLS ARE PROTECTED: DON'T SHOOT",
      wave: coastWave,
      title: (w, x2) => (x2 ? "THE EVENING FLIGHT · DOUBLE POINTS" : null)
    },
    {
      world: "duck_north",
      name: "THE GREAT MIGRATION",
      story: "First snow up north. Here they all come",
      music: "duck",
      amb: "duck_north",
      legend: "GOLDEN GOOSE 100 (RARE) · TEAL 25 · PINTAIL 15  ·  DON'T SHOOT SWANS OR THE WARDEN",
      wave: northWave,
      title: (w, x2) => (x2 ? "THE SKY IS FULL · DOUBLE POINTS" : null)
    }
  ],
  done: ["THAT'S THE SEASON", "THE FLOCKS ARE SOUTH. SEE YOU NEXT FALL"]
};
