import {
  GROUND,
  BOX,
  CYL,
  BALL,
  CONE,
  TORUS,
  SLAB,
  WORLDS,
  CARDS,
  CARD_SIZE,
  BIRDS,
  AMBIENCE,
  person
} from "./shoots-art";
import { LAYOUTS, PERSON, SHATTER, PLATE_SOUND } from "./plates";
import { SHAPES } from "./plates-shapes";
import { runner, gunman, bird, DONT, run, charge, toss, cross, walk, pick, flyers } from "./shoot-paths";

// The boar campaign (Jay, 2026-10-24: every shoot becomes five levels, each
// a new world, a story that escalates to the big one). We're after Big
// Tusker and his sounder:
//   1 THE SCRUB             (the boar world, shoots.js SCREEN.boar)
//   2 THE OAK WOODS         they've fled into the autumn oaks: the sounder
//                           rooting in the leaves and charging between the
//                           trunks, squirrels, jays; a mushroom forager (don't)
//   3 THE FARMYARD RAID     at dusk they hit the Miller farm: barn, silo,
//                           farmhouse, the pig pens (the farm pigs: don't),
//                           hens thrown up in the panic, bales and a tractor;
//                           the farmer (don't)
//   4 THE BAYOU             they've run for the swamp: cypress and moss, a
//                           stilt shack, feral hogs charging through the
//                           shallows, gators lunging, herons; a fisherman (don't)
//   5 THE NIGHT RAID        back at the farm by moonlight: eyes in the dark,
//                           the whole sounder, and Big Tusker himself
// Laid out as the other worlds are (u right, f downrange, h up from the roof
// deck, the ground at GROUND); shoots-art moves it all SHIFT m back and up.

const G = GROUND;

// ---- New outlines (the plates' atlas) ------------------------------------------

Object.assign(SHAPES, {
  // Big Tusker: a hump of bristles, a long snout, tusks
  boar_tusker: {
    polys: [
      [
        0, 34, 2, 26, 10, 22, 18, 16, 22, 6, 26, 2, 30, 12, 36, 8, 42, 2, 48, 8, 54, 0, 60, 6, 66, 0, 72, 8, 80, 6, 90,
        12, 104, 18, 112, 24, 116, 22, 122, 18, 118, 28, 114, 32, 114, 44, 110, 52, 110, 68, 102, 68, 100, 54, 94, 54,
        94, 68, 86, 68, 86, 52, 46, 54, 44, 68, 36, 68, 36, 56, 32, 56, 30, 68, 22, 68, 22, 50, 14, 46, 6, 42, 2, 40
      ]
    ],
    lines: [
      [5, 12, 38, 5, 31, 7, 22],
      [4, 16, 40, 11, 31, 14, 24]
    ],
    marks: [[3, 40, 14, 86, 16]],
    dots: [[20, 24, 2.2]]
  },
  // an alligator lunging, jaws open, facing left
  boar_gator: {
    polys: [
      [
        0, 10, 4, 6, 30, 4, 40, 2, 46, 0, 52, 4, 60, 8, 80, 6, 90, 4, 100, 8, 110, 4, 120, 8, 130, 4, 140, 8, 150, 6,
        165, 10, 185, 16, 200, 22, 185, 24, 165, 22, 150, 24, 146, 34, 152, 42, 138, 42, 136, 30, 100, 30, 92, 32, 98,
        42, 84, 42, 82, 30, 60, 26, 48, 24, 30, 30, 4, 28, 2, 24, 26, 20, 40, 16, 24, 13, 2, 14
      ]
    ],
    marks: [[2.5, 64, 14, 150, 14]],
    dots: [[42, 5, 2]]
  },
  // a hen, facing left
  boar_hen: {
    polys: [
      [
        0, 16, 6, 12, 8, 8, 10, 4, 13, 0, 16, 4, 19, 0, 22, 5, 24, 10, 24, 18, 30, 24, 40, 24, 48, 14, 52, 4, 58, 10,
        58, 24, 56, 34, 48, 42, 36, 46, 24, 44, 16, 36, 12, 26, 10, 22, 8, 20, 6, 18
      ]
    ],
    lines: [
      [3, 32, 45, 30, 58],
      [3, 38, 45, 40, 58]
    ],
    marks: [[2, 28, 30, 44, 34]],
    dots: [[14, 11, 1.4]]
  },
  // a toadstool: a spotted cap on a stem
  boar_mushroom: {
    polys: [
      [0, 30, 2, 20, 10, 8, 22, 1, 30, 0, 38, 1, 50, 8, 58, 20, 60, 30, 38, 30, 40, 62, 44, 70, 16, 70, 20, 62, 22, 30]
    ],
    marks: [[2.5, 3, 30, 57, 30]],
    dots: [
      [18, 12, 3],
      [32, 7, 3],
      [44, 14, 3],
      [26, 22, 2.5],
      [50, 23, 2.5]
    ]
  },
  // a pumpkin
  boar_pumpkin: {
    polys: [
      [
        40, 12, 54, 13, 66, 17, 75, 24, 80, 34, 79, 44, 74, 52, 64, 58, 52, 60, 40, 60, 28, 60, 16, 58, 6, 52, 1, 44, 0,
        34, 5, 24, 14, 17, 26, 13
      ],
      [36, 14, 44, 14, 46, 2, 40, 0, 36, 4]
    ],
    marks: [
      [2.5, 28, 15, 24, 36, 28, 58],
      [2.5, 52, 15, 56, 36, 52, 58]
    ]
  }
});
for (const k of ["boar_mushroom", "boar_pumpkin"]) SHATTER.add(k);
PLATE_SOUND.boar_mushroom = "splat";
PLATE_SOUND.boar_pumpkin = "splat";
PLATE_SOUND.boar_hen = "squeak";

// ---- New cut-outs ------------------------------------------------------------------

Object.assign(CARDS, {
  // the forager: green jacket, a basket of mushrooms on her arm
  boar_forager: (c, W, H) => {
    person(c, W, H, {
      body: "#4a7a3a",
      legs: "#3a3a4a",
      hat: "#c0402a",
      hair: "#a87a4a",
      longHair: true,
      skin: "#f0c8a0"
    });
    const u = W / 10;
    const x = W / 2 + 3.3 * u;
    const y = H * 0.6;
    c.lineWidth = 5;
    c.strokeStyle = "#111";
    c.beginPath();
    c.arc(x, y, 1.1 * u, Math.PI, 0);
    c.stroke();
    for (const [dx, col] of [
      [-0.6, "#c0182a"],
      [0.55, "#d8b070"]
    ]) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(x + dx * u, y + 0.1 * u, 0.6 * u, Math.PI, 0);
      c.closePath();
      c.fill();
      c.stroke();
    }
    c.fillStyle = "#a8783a";
    c.beginPath();
    c.moveTo(x - 1.4 * u, y);
    c.lineTo(x + 1.4 * u, y);
    c.lineTo(x + 1.0 * u, y + 1.7 * u);
    c.lineTo(x - 1.0 * u, y + 1.7 * u);
    c.closePath();
    c.fill();
    c.stroke();
  },
  // the fisherman: yellow slicker, waders, a rod and his catch
  boar_fisher: (c, W, H) => {
    const u = W / 10;
    c.strokeStyle = "#2a1a10";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(W / 2 + 3.6 * u, H * 0.6);
    c.lineTo(W - 3, 3);
    c.stroke();
    person(c, W, H, {
      body: "#e0b030",
      legs: "#3a4a3a",
      hat: "#5a6a3a",
      hair: "#9a9a9a",
      tache: true,
      skin: "#d8a078"
    });
    c.fillStyle = "#b8c4c8";
    c.strokeStyle = "#111";
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(W / 2 - 3.6 * u, H * 0.66, 0.6 * u, 1.6 * u, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  },
  // a farm pig (they're the Millers': don't)
  boar_pig: (c, W, H) => {
    c.lineJoin = "round";
    c.lineCap = "round";
    c.strokeStyle = "#1a1a1a";
    c.fillStyle = "#f2a0b0";
    c.lineWidth = 6;
    for (const x of [0.22, 0.34, 0.6, 0.72]) {
      c.beginPath();
      c.rect(W * x, H * 0.6, W * 0.08, H * 0.36);
      c.fill();
      c.stroke();
    }
    c.lineWidth = 5;
    c.beginPath();
    c.arc(W * 0.92, H * 0.34, W * 0.035, 0.3, Math.PI * 1.7);
    c.stroke();
    c.lineWidth = 6;
    c.beginPath();
    c.ellipse(W * 0.53, H * 0.44, W * 0.37, H * 0.29, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(W * 0.17, H * 0.42, W * 0.13, H * 0.19, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(W * 0.16, H * 0.26);
    c.lineTo(W * 0.26, H * 0.06);
    c.lineTo(W * 0.28, H * 0.3);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#e07a90";
    c.beginPath();
    c.ellipse(W * 0.05, H * 0.47, W * 0.035, H * 0.09, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = "#a8705a";
    c.beginPath();
    c.ellipse(W * 0.62, H * 0.5, W * 0.1, H * 0.08, 0.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#1a1a1a";
    c.beginPath();
    c.arc(W * 0.14, H * 0.36, W * 0.014, 0, Math.PI * 2);
    c.fill();
  },
  // eyes in the dark: something in the bracken, looking at you
  boar_eyes: (c, W, H) => {
    c.fillStyle = "#0c120e";
    c.beginPath();
    c.ellipse(W * 0.5, H * 0.6, W * 0.47, H * 0.36, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 7; k++) {
      const x = W * (0.12 + k * 0.126);
      c.beginPath();
      c.moveTo(x - W * 0.07, H * 0.45);
      c.lineTo(x + W * (k % 2 ? 0.03 : -0.02), H * (k % 2 ? 0.04 : 0.12));
      c.lineTo(x + W * 0.07, H * 0.45);
      c.closePath();
      c.fill();
    }
    for (const s of [-1, 1]) {
      const x = W * (0.5 + s * 0.15);
      const y = H * 0.56;
      const g = c.createRadialGradient(x, y, 0, x, y, W * 0.1);
      g.addColorStop(0, "#fff6c0");
      g.addColorStop(0.4, "#ffb020");
      g.addColorStop(1, "#3a1a04");
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x, y, W * 0.09, H * 0.1, s * 0.35, 0, Math.PI * 2);
      c.fill();
    }
  }
});
Object.assign(CARD_SIZE, {
  boar_forager: [0.9, 1.8],
  boar_fisher: [0.9, 1.8],
  boar_pig: [1.1, 0.75],
  boar_eyes: [0.7, 0.4]
});
for (const k of ["boar_forager", "boar_fisher", "boar_pig", "boar_eyes"]) PERSON.add(k);

// ---- New birds (3D, like the other shoots' birds) -----------------------------------

Object.assign(BIRDS, {
  boar_jay: { body: 0xc89a82, head: 0xd8b0a0, wing: 0x3a6ad8, beak: 0x2a2a2a, s: 0.75, tip: 0x111111 },
  boar_heron: { body: 0x8a96a2, head: 0xe8eaec, wing: 0x7a8898, beak: 0xe8b030, s: 2.0, span: 1.6, tip: 0x2a2a30 },
  boar_owl: { body: 0xe8d8c0, head: 0xd8c0a0, wing: 0xc8a878, beak: 0x8a6a3a, s: 1.3, span: 1.2 },
  boar_bat: { body: 0x7a6a7a, head: 0x6a5a6a, wing: 0x8a7a8a, beak: 0x5a4a5a, s: 0.6, span: 1.5 }
});

// ---- Kinds -----------------------------------------------------------------------

const hunt = (shape, tint, h, r, sound, extra = {}) => ({ ...runner(shape, tint, h, r, sound), ...extra });
const dont = (cardKey, h) => ({ ...gunman(cardKey, h), pts: -25, sound: "wrong", ...DONT });
const kinds = {
  // the oak woods
  boar_wood: hunt("boar", 0x6a4a36, 0.9, 0.6, "squeal"),
  boar_squeaker: hunt("boar", 0xe0b080, 0.45, 0.38, "squeal", { pts: 100 }),
  boar_squirrel: hunt("squirrel", 0xd8682a, 0.42, 0.3, "squeak", { pts: 100 }),
  boar_jay: bird("boar_jay", 25, 0.3, "caw"),
  boar_foragerWalk: dont("boar_forager", 1.75),
  // the farmyard
  boar_raider: hunt("boar", 0x8a5a3a, 0.9, 0.6, "squeal"),
  boar_henW: hunt("boar_hen", 0xf4efe2, 0.5, 0.32, "squeak", { pts: 50 }),
  boar_henR: hunt("boar_hen", 0xc8602a, 0.5, 0.32, "squeak", { pts: 50 }),
  boar_pigLoose: { ...hunt("boar_pig", 0xffffff, 0.75, 0.5, "squeal"), pts: -25, sound: "wrong", ...DONT },
  // the bayou
  boar_hog: hunt("boar", 0x3a302a, 0.9, 0.6, "squeal"),
  boar_gator: hunt("boar_gator", 0x6a8a42, 0.6, 0.7, "roar", { pts: 100, arrive: "roar", penalty: 15, lose: "SNAP!" }),
  boar_heron: bird("boar_heron", 5, 0.7, "honk"),
  boar_fisherWalk: dont("boar_fisher", 1.75),
  // the night raid
  boar_night: hunt("boar", 0xb8c0d4, 0.9, 0.6, "squeal"),
  boar_nightSqueaker: hunt("boar", 0xe8d4c4, 0.45, 0.38, "squeal", { pts: 100 }),
  boar_bigTusker: hunt("boar_tusker", 0xffc93c, 1.7, 1.0, "roar", {
    pts: 300,
    name: "BIG TUSKER!",
    arrive: "roar",
    penalty: 50,
    lose: "GORED!"
  }),
  boar_owl: bird("boar_owl", 5, 0.5, "caw"),
  boar_bat: bird("boar_bat", 25, 0.25, "chirp")
};

// ---- Paths ------------------------------------------------------------------------

// Out of the trees (or the dark) and at the stands.
function sounder(R, add, t, c, kind, o = {}) {
  add(t, kind, charge(R, { v: R(9, 12) * c.S, ...o }));
}
// Straight across in front of you at a run.
function dash(R, add, t, c, kind, f0, f1, v0 = 11, v1 = 14) {
  add(t, kind, run(R, { v: R(v0, v1) * c.S, f: R(f0, f1) }));
}
// Hens flapping up out of the yard in a panic.
function flap(R, add, t, c, n, u, f) {
  for (let k = 0; k < n; k++)
    add(
      t + k * 0.3,
      R(0, 1) < 0.6 ? "boar_henW" : "boar_henR",
      toss(R, { u: u + R(-1.5, 1.5), f: f + R(-1, 1), h: G + 0.3, vh: R(6.5, 8.5), vu: R(-2.5, 2.5) })
    );
}
// A gator off the mud and up the bank at you, low and quick.
function lunge(R, add, t, c) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(t, "boar_gator", charge(R, { u0: s * R(6, 16), f0: R(20, 32), u1: -s * R(0, 4), v: R(5, 6.5) * c.S, zig: 0.15 }));
}

// ---- Level 2: the oak woods -------------------------------------------------------

const BARK = 0x4a3426;
const WOOD = 0x6a4a2e;
const AUTUMN = [0xc8601a, 0xe0962a, 0xa8381a, 0xd0a838, 0x9a5a1a];
const LOG = { U: -0.5, F: 10.6 };
const STUMP = [6, 12.5];
const OAKS_MID = [
  [-10, 24],
  [7, 22],
  [-3, 31],
  [15, 30],
  [-19, 33]
];
const FORAGER_OAK = [-16, 12];
const SEAT = [12, 38];
const STONE = 48;
const BRACKEN = [
  [-8, 16.2],
  [11, 16.6],
  [21, 22]
];

function autumnOak(P, u, f, s = 1, k = 0) {
  const a = AUTUMN[((k % 5) + 5) % 5];
  const b = AUTUMN[(((k + 2) % 5) + 5) % 5];
  P.add(CONE(0.9 * s, 1.2 * s, 7), BARK, u, G + 0.6 * s, f);
  P.add(CYL(0.34 * s, 0.52 * s, 4.8 * s, 7), BARK, u, G + 2.4 * s, f);
  P.add(CYL(0.1 * s, 0.2 * s, 2.8 * s, 5), BARK, u - 1.0 * s, G + 4.7 * s, f, 0, 0, 0.8);
  P.add(CYL(0.1 * s, 0.2 * s, 2.6 * s, 5), BARK, u + 1.0 * s, G + 4.9 * s, f, 0, 0, -0.75);
  P.add(BALL(2.3 * s, 7), a, u, G + 6.6 * s, f, 0, k, 0, 1.3, 0.75, 1.1);
  P.add(BALL(1.6 * s, 6), b, u - 2.0 * s, G + 5.7 * s, f - 0.3 * s, 0, k, 0, 1.1, 0.8, 1);
  P.add(BALL(1.5 * s, 6), b, u + 2.1 * s, G + 5.9 * s, f + 0.3 * s, 0, k, 0, 1.1, 0.8, 1);
}

function bracken(P, u, f, s = 1) {
  for (let k = 0; k < 7; k++)
    P.add(
      CONE(0.16 * s, 1.1 * s, 3),
      k % 2 ? 0xb8702a : 0x8a4a1e,
      u + Math.cos(k * 1.3) * 0.45 * s,
      G + 0.45 * s,
      f + Math.sin(k * 2.1) * 0.3,
      Math.sin(k * 3) * 0.5,
      k,
      Math.cos(k * 2) * 0.6
    );
}

function toadstool(P, u, f, s = 1) {
  P.add(CYL(0.04 * s, 0.05 * s, 0.22 * s, 5), 0xf0e8d8, u, G + 0.11 * s, f);
  P.add(CONE(0.14 * s, 0.1 * s, 7), 0xc8201a, u, G + 0.25 * s, f);
}

function highSeat(P, u, f) {
  for (const [a, b] of [
    [-0.8, -0.7],
    [0.8, -0.7],
    [-0.8, 0.7],
    [0.8, 0.7]
  ])
    P.add(BOX(0.14, 4.6, 0.14), WOOD, u + a, G + 2.3, f + b);
  P.add(BOX(2.0, 0.12, 1.8), WOOD, u, G + 3.6, f);
  P.add(BOX(2.0, 0.9, 0.08), 0x7a5a3a, u, G + 4.1, f - 0.9);
  for (const s of [-1, 1]) P.add(BOX(0.08, 0.9, 1.8), 0x7a5a3a, u + s * 1.0, G + 4.1, f);
  for (const [a, b] of [
    [-0.9, -0.8],
    [0.9, -0.8],
    [-0.9, 0.8],
    [0.9, 0.8]
  ])
    P.add(BOX(0.08, 1.2, 0.08), WOOD, u + a, G + 4.75, f + b);
  P.add(BOX(2.4, 0.1, 2.2), 0x3a3a2a, u, G + 5.35, f, -0.1, 0, 0);
  for (const s of [-1, 1]) P.add(BOX(0.07, 3.9, 0.07), WOOD, u + s * 0.3, G + 1.8, f - 1.55, -0.35, 0, 0);
  for (let k = 0; k < 8; k++)
    P.add(BOX(0.66, 0.05, 0.06), WOOD, u, G + 0.3 + k * 0.45, f - 2.1 + k * 0.165, -0.35, 0, 0);
}

WORLDS.boar_woods = {
  sky: {
    top: "#4a6aa0",
    mid: "#c8a88a",
    horizon: "#f6c878",
    ground: "#5a3a1a",
    sun: [35, 9, "#ffe2a0", 16],
    clouds: 5,
    cloud: "rgba(255,220,170,0.45)",
    hills: [
      { colour: "#8a4a22", height: 10, rough: 3, phase: 1.2, trees: true },
      { colour: "#5a3418", height: 6, rough: 4, trees: true }
    ],
    seed: 61
  },
  fog: 0xc89060,
  signs: [
    ["KINGSWOOD", -5.5, G + 1.85, 13.5, 2.0, 0.5, "#3a2414", "#f2d8a0"],
    ["BEWARE: WILD BOAR", 23, G + 1.7, 13.9, 2.6, 0.45, "#f2e2b8", "#7a1a10"]
  ],
  build(P) {
    P.ground(0x8a5a2a, [
      { u: 0, f: 20, r: 14, c: 0xa86a2a, sx: 2.2, sz: 1 },
      { u: 0, f: 9, r: 6, c: 0x6a4a28, sx: 3, sz: 0.4 },
      { u: -16, f: 34, r: 9, c: 0x9a4a20 },
      { u: 17, f: 40, r: 10, c: 0xb88a3a },
      { u: 0, f: 50, r: 10, c: 0x6a4a2a, sx: 0.35, sz: 3 }
    ]);
    // the big oaks framing the glade, those you peek round, the deep wood
    for (const [u, f, s] of [
      [...FORAGER_OAK, 1.4],
      [19, 11, 1.5],
      [-27, 18, 1.3],
      [28, 20, 1.4],
      [-37, 26, 1.4],
      [37, 24, 1.3]
    ])
      autumnOak(P, u, f, s, Math.round(u + f));
    OAKS_MID.forEach(([u, f], k) => autumnOak(P, u, f, 1.05 + (k % 2) * 0.15, k));
    for (let k = 0; k < 14; k++) {
      const u = -42 + k * 6.5 + Math.sin(k * 2.3) * 1.5;
      const f = 42 + (k % 3) * 6 + Math.cos(k) * 1.5;
      if (Math.abs(u) < 5) continue;
      autumnOak(P, u, f, 1.1 + (k % 2) * 0.25, k + 3);
    }
    P.scatter(26, 62, 92, (u, f, R) => P.oak(u, f, 1.3 + R() * 0.6, AUTUMN[Math.floor(R() * 5)]), 90);
    // the fallen log (and its toadstools), the stump, the forager's basket
    P.add(CYL(0.42, 0.48, 8, 9), BARK, LOG.U, G + 0.45, LOG.F, 0, 0, Math.PI / 2);
    for (const s of [-1, 1])
      P.add(CYL(0.4, 0.4, 0.04, 9), 0xc8a070, LOG.U + s * 4.01, G + 0.45, LOG.F, 0, 0, Math.PI / 2);
    for (const [u, sx] of [
      [-2.6, 1.4],
      [1.6, 1]
    ])
      P.add(BALL(0.4, 6), 0x5a6a2a, LOG.U + u, G + 0.8, LOG.F - 0.15, 0, 0, 0, sx, 0.35, 1);
    P.add(CYL(0.08, 0.12, 1.4, 5), BARK, LOG.U + 2.5, G + 1.1, LOG.F, 0, 0, -0.7);
    for (let k = 0; k < 9; k++) toadstool(P, LOG.U - 3.5 + k * 0.9, LOG.F - 0.7 - (k % 2) * 0.3, 0.8 + (k % 3) * 0.3);
    P.add(CYL(0.55, 0.7, 0.9, 9), BARK, STUMP[0], G + 0.45, STUMP[1]);
    P.add(CYL(0.53, 0.53, 0.04, 9), 0xc8a070, STUMP[0], G + 0.91, STUMP[1]);
    P.add(CYL(0.28, 0.22, 0.32, 8), 0xa8783a, 3.9, G + 0.16, 9.8);
    P.add(TORUS(0.24, 0.025, 10), 0x7a5228, 3.9, G + 0.34, 9.8);
    for (const [u, c] of [
      [3.8, 0xc0182a],
      [4.0, 0xd8b070]
    ])
      P.add(BALL(0.1, 5), c, u, G + 0.34, 9.8);
    // a woodpile
    for (let r = 0; r < 3; r++)
      for (let k = 0; k < 6 - r; k++)
        P.add(
          CYL(0.2, 0.2, 1.6, 7),
          k % 2 ? 0x8a6a42 : 0x7a5a36,
          15.8 + r * 0.21 + k * 0.42,
          G + 0.2 + r * 0.36,
          15,
          Math.PI / 2
        );
    // the hunters' high seat, the old stone wall and its gate
    highSeat(P, ...SEAT);
    for (let u = -44, k = 0; u <= 44; u += 2.2, k++) {
      if (Math.abs(u) < 2.4) continue;
      P.add(BOX(2.3, 0.9, 0.8), k % 2 ? 0x7a7468 : 0x6a665c, u, G + 0.45, STONE);
      P.add(BOX(2.2, 0.16, 0.9), k % 3 ? 0x8a8478 : 0x5a6a3a, u, G + 0.98, STONE);
    }
    for (const s of [-1, 1]) P.add(BOX(0.25, 1.6, 0.25), WOOD, s * 2.4, G + 0.8, STONE);
    for (let k = 0; k < 5; k++)
      P.add(
        BOX(2.3, 0.08, 0.06),
        0x9a8a6a,
        -2.3 + Math.cos(1.2) * 1.15,
        G + 0.3 + k * 0.25,
        STONE - Math.sin(1.2) * 1.15,
        0,
        1.2,
        0
      );
    // the sign posts
    P.add(BOX(0.12, 2.2, 0.12), WOOD, -5.5, G + 1.1, 13.6);
    P.add(BOX(0.12, 2.0, 0.12), WOOD, 23, G + 1.0, 14.0);
    // leaf drifts, bracken, toadstools, rocks with moss
    P.scatter(
      40,
      5,
      40,
      (u, f, R) =>
        P.add(BALL(0.6 + R() * 0.5, 5), AUTUMN[Math.floor(R() * 5)], u, G + 0.05, f, 0, R() * 3, 0, 1.6, 0.25, 1.2),
      30
    );
    for (const [u, f] of BRACKEN) bracken(P, u, f, 1.1);
    P.scatter(18, 8, 40, (u, f, R) => Math.abs(u) > 9 && bracken(P, u, f, 0.8 + R() * 0.5), 34);
    P.scatter(14, 12, 40, (u, f, R) => Math.abs(u) > 6 && P.rock(u, f, 0.5 + R() * 0.6, 0x7a7468), 30);
    P.scatter(16, 6, 30, (u, f, R) => toadstool(P, u, f, 0.8 + R()), 18);
  },
  slots: [],
  cover: null
};

LAYOUTS.boar_woods = L => {
  const fixed = { fixed: true, rail: false };
  // toadstools along the log, squirrels on the stump, jays on dead sticks
  L.row({
    ...fixed,
    kind: "boar_mushroom",
    n: 6,
    f: LOG.F - 0.05,
    u0: LOG.U - 3.2,
    u1: LOG.U + 3.0,
    base: 0.88,
    size: 0.32,
    tint: ["red", "orange"],
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "squirrel",
    n: 2,
    f: STUMP[1] - 0.1,
    u0: STUMP[0] - 0.3,
    u1: STUMP[0] + 0.3,
    base: 0.92,
    size: 0.38,
    tint: "orange",
    bank: 2
  });
  L.row({ kind: "crow", n: 4, f: 14, u0: -9, u1: -4, base: 1.6, size: 0.34, tint: "blue", bank: 4, perch: true });
  // squeakers rooting in the leaves, the sounder in the glade, rabbits
  L.row({ kind: "boar", n: 6, f: 7.5, u0: -7, u1: 7, size: 0.42, tint: "pink", bank: 3 });
  L.row({ kind: "boar", n: 5, f: 20, u0: -14, u1: 14, size: 0.8, tint: "orange" });
  L.row({ kind: "rabbit", n: 4, f: 27, u0: -10, u1: 10, size: 0.42, tint: "white", bank: 2 });
  // an owl on the high seat, boar on the wall, Big Tusker down the ride
  L.row({ ...fixed, kind: "owl", n: 1, f: SEAT[1], u0: SEAT[0], u1: SEAT[0], base: 5.4, size: 0.45, tint: "white" });
  L.row({
    kind: "boar",
    n: 4,
    f: STONE,
    u0: -16,
    u1: 16,
    base: 1.06,
    size: 0.95,
    tint: "orange",
    bank: 4,
    rail: false
  });
  L.row({ kind: "boar_tusker", n: 1, f: 58, u0: 0, u1: 0, size: 1.4, tint: "gold", pts: 50 });
  // boar peeking out from behind the oaks
  for (const [u, f] of OAKS_MID)
    L.pops({
      fixed: true,
      peek: true,
      f: f + 0.7,
      at: [[u, 0]],
      size: 0.85,
      slide: 1.9,
      tint: "brown",
      kinds: [
        ["boar", 85],
        ["boar_tusker", 15, { pts: 50 }]
      ]
    });
  // up out of the bracken
  L.pops({
    fixed: true,
    f: 15.5,
    at: BRACKEN.filter(b => b[1] < 20).map(([u]) => [u, 0]),
    size: 0.75,
    tint: "orange",
    kinds: [["boar", 100]]
  });
  L.pops({
    fixed: true,
    f: 21.3,
    at: [[21, 0]],
    size: 0.75,
    tint: "orange",
    kinds: [["boar", 100]]
  });
  // in front of the woodpile, through the gateway, up behind the wall
  L.pops({ fixed: true, f: 14.2, at: [[17, 0]], size: 0.75, tint: "orange", kinds: [["boar", 100]] });
  L.pops({
    fixed: true,
    f: STONE - 0.7,
    at: [[0, 0]],
    size: 0.95,
    tint: "brown",
    kinds: [
      ["boar", 80],
      ["boar_tusker", 20, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    f: STONE + 0.5,
    at: [
      [-21, 0.55],
      [20, 0.55]
    ],
    size: 0.9,
    tint: "brown",
    period: [5, 8],
    kinds: [["boar", 100]]
  });
  // the forager, round the big oak now and then
  L.pops({
    fixed: true,
    peek: true,
    f: FORAGER_OAK[1] + 0.8,
    at: [[FORAGER_OAK[0], 0]],
    size: 1.75,
    slide: 1.6,
    period: [6, 9],
    busy: 0.45,
    kinds: [["boar_forager", 100, { dont: true }]]
  });
};

const woodsWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the whole sounder breaks cover
    for (let k = 0; k < 8; k++) sounder(R, add, 1 + k * 2.8, c, "boar_wood");
    for (let k = 0; k < 4; k++) dash(R, add, 2 + k * 5.5, c, "boar_squeaker", 8, 18);
    flyers(["boar_jay", "woodpigeon"], R, add, c, 3);
    return;
  }
  const k = c.w % 6;
  if (k === 0 || k === 3) {
    for (let j = 0; j < 1 + n(1); j++) dash(R, add, R(1, 22), c, "boar_squeaker", 8, 18);
    for (let j = 0; j < n(1); j++) dash(R, add, R(1, 22), c, "boar_wood", 18, 40);
  }
  if (k === 1 || k === 4) {
    flyers(["boar_jay", "woodpigeon"], R, add, c, 3 + n(2));
    for (let j = 0; j < 1 + n(1); j++) dash(R, add, R(1, 22), c, "boar_squirrel", 9, 24, 9, 12);
  }
  if (k === 2 || k === 4) for (let j = 0; j < 1 + n(1.5); j++) sounder(R, add, R(1, 20), c, "boar_wood");
  if (k === 5) {
    for (let j = 0; j < 2 + n(2); j++) sounder(R, add, 1 + j * 3.5, c, "boar_wood");
    for (let j = 0; j < 1 + n(1); j++) dash(R, add, R(2, 20), c, "boar_squeaker", 8, 18);
  }
  if (R(0, 1) < 0.3) add(R(2, 18), "boar_foragerWalk", cross(R, { u0: -16, u1: 16, f: R(12, 13), v: R(1.0, 1.3) }));
};

// ---- Level 3: the farmyard raid ---------------------------------------------------

const BARN = { U: -17, F: 26, W: 13, D: 11, H: 6 };
const HOUSE = { U: 19, F: 34, W: 11, D: 8, H: 5.4 };
const PEN = { U0: -13, U1: -3, F0: 14, F1: 19 };
const BALES = [6, 7.6, 9.2];
const BALE_F = 11.6;
const TRACTOR = [15, 16];
const COOP = [2, 24];
const MILK = [-8, 24.8];
const FIELD = 49.5;
const SCARECROW = [-6, 56];
const RED = 0x9a2a1e;
const TRIM = 0xf4efe2;

function fenceU(P, u0, u1, f, h = 1.1, c = WOOD) {
  const len = Math.abs(u1 - u0);
  const mid = (u0 + u1) / 2;
  for (const k of [0.4, 0.85]) P.add(BOX(len, 0.12, 0.06), c, mid, G + h * k, f);
  const n = Math.max(1, Math.round(len / 2.5));
  for (let k = 0; k <= n; k++) P.add(BOX(0.12, h, 0.12), c, u0 + ((u1 - u0) * k) / n, G + h / 2, f);
}
function fenceF(P, u, f0, f1, h = 1.1, c = WOOD) {
  for (const k of [0.4, 0.85]) P.add(SLAB(0.06, 0.12, f1 - f0), c, u, G + h * k, (f0 + f1) / 2);
  for (let f = f0; f <= f1 + 0.01; f += 2.5) P.add(BOX(0.12, h, 0.12), c, u, G + h / 2, f);
}

function truck(P, u, f, body, glass, lights) {
  P.add(BOX(4.6, 0.7, 1.9), body, u, G + 0.9, f);
  P.add(BOX(1.8, 0.9, 1.8), body, u + 0.6, G + 1.7, f);
  P.add(BOX(1.4, 0.6, 1.82), glass, u + 0.7, G + 1.75, f);
  for (const s of [-1, 1]) {
    P.add(CYL(0.4, 0.4, 0.3, 10), 0x121212, u + 1.5, G + 0.4, f + s * 0.95, Math.PI / 2);
    P.add(CYL(0.4, 0.4, 0.3, 10), 0x121212, u - 1.5, G + 0.4, f + s * 0.95, Math.PI / 2);
    P.add(BALL(0.14, 6), lights, u + 2.32, G + 1.0, f + s * 0.65);
  }
}

function hayWagon(P, u, f) {
  P.add(BOX(3.6, 0.25, 1.7), 0x6a4a32, u, G + 0.95, f);
  for (const s of [-1, 1])
    for (const t of [-1, 1]) P.add(TORUS(0.45, 0.06, 12), 0x2a2420, u + s * 1.2, G + 0.45, f + t * 0.9);
  for (const s of [-1, 0, 1]) P.add(BOX(1.1, 0.5, 1.5), 0xd8b85a, u + s * 1.15, G + 1.33, f);
  P.add(BOX(1.6, 0.08, 0.08), 0x4a3a2a, u - 2.5, G + 0.7, f, 0, 0, 0.2);
}

function barn(P) {
  const { U, F, W, D, H } = BARN;
  const m = F + D / 2;
  P.add(BOX(W, H, D), RED, U, G + H / 2, m);
  // the gambrel: an octagon on its point, squashed, and the roof round it
  P.add(CYL(W / 2, W / 2, D, 8), RED, U, G + H, m, Math.PI / 2, 0, 0, 1, 1, 0.55);
  P.add(CYL(W / 2 + 0.35, W / 2 + 0.35, D - 0.4, 8), 0x4a3a36, U, G + H, m, Math.PI / 2, 0, 0, 1, 1, 0.56);
  // the big door with its white X, the hayloft, the pulley beam
  P.add(BOX(4.4, 4.0, 0.08), 0x7a1a12, U, G + 2.0, F - 0.04);
  for (const s of [-1, 1]) {
    P.add(BOX(0.22, 4.2, 0.1), TRIM, U + s * 2.2, G + 2.1, F - 0.06);
    P.add(BOX(5.9, 0.2, 0.06), TRIM, U, G + 2.0, F - 0.09, 0, 0, s * 0.74);
    P.add(BOX(1.2, 1.2, 0.08), 0x24303a, U + s * 4.5, G + 3.6, F - 0.04);
    P.add(BOX(1.4, 0.14, 0.1), TRIM, U + s * 4.5, G + 4.25, F - 0.06);
    P.add(BOX(1.4, 0.14, 0.1), TRIM, U + s * 4.5, G + 2.95, F - 0.06);
    // lantern brackets
    P.add(BOX(0.08, 0.08, 0.4), 0x2a2a2a, U + s * 3.2, G + 3.55, F - 0.2);
  }
  P.add(BOX(4.6, 0.22, 0.1), TRIM, U, G + 4.2, F - 0.06);
  P.add(BOX(2.0, 1.8, 0.08), 0x3a1a10, U, G + 5.1, F - 0.04);
  P.add(BOX(1.7, 0.45, 0.12), 0xd8b85a, U, G + 4.45, F - 0.05);
  for (const s of [-1, 1]) P.add(BOX(0.16, 2.0, 0.1), TRIM, U + s * 1.05, G + 5.1, F - 0.06);
  P.add(BOX(2.3, 0.16, 0.1), TRIM, U, G + 6.05, F - 0.06);
  P.add(BOX(0.2, 0.2, 1.4), WOOD, U, G + 7.4, F - 0.5);
  // the silo
  P.add(CYL(2.6, 2.6, 13, 14), 0x9aa2a8, -28.5, G + 6.5, 32);
  for (const h of [2, 5, 8, 11]) P.add(CYL(2.64, 2.64, 0.14, 14), 0x5a6068, -28.5, G + h, 32);
  P.add(BALL(2.6, 12), 0xb8b0a0, -28.5, G + 13, 32, 0, 0, 0, 1, 0.55, 1);
  P.add(BOX(0.5, 12, 0.1), 0x5a6068, -26.1, G + 6.5, 31, 0, 0.6, 0);
}

function farmhouse(P) {
  const { U, F, W, D, H } = HOUSE;
  P.add(BOX(W, H, D), 0xe8e2d4, U, G + H / 2, F + D / 2);
  P.add(
    CYL(D / 2 + 0.4, D / 2 + 0.4, W + 0.6, 4),
    0x5a3a34,
    U,
    G + H,
    F + D / 2,
    0,
    0,
    Math.PI / 2,
    2.6 / (D / 2 + 0.4),
    1,
    1
  );
  P.add(BOX(0.8, 2.4, 0.8), 0x8a4a3a, U + 3.5, G + H + 1.8, F + D / 2 + 1);
  const lit = 0xffd27a;
  for (const [u, h0, w, h] of [
    [U - 3.7, 1.0, 1.2, 1.3],
    [U + 4.2, 1.0, 1.2, 1.3],
    [U - 3.2, 3.3, 1.0, 1.0],
    [U + 0.3, 3.3, 1.0, 1.0],
    [U + 3.8, 3.3, 1.0, 1.0]
  ]) {
    P.add(BOX(w, h, 0.08), lit, u, G + h0 + h / 2, F - 0.04);
    for (const s of [-1, 1]) P.add(BOX(0.4, h, 0.08), 0x2a4a3a, u + s * (w / 2 + 0.25), G + h0 + h / 2, F - 0.05);
    P.add(BOX(0.06, h, 0.1), TRIM, u, G + h0 + h / 2, F - 0.07);
  }
  P.add(BOX(1.6, 2.3, 0.08), 0x5a3a2a, U + 0.3, G + 0.25 + 1.15, F - 0.04);
  // the porch
  P.add(BOX(W + 0.4, 0.25, 2.4), 0x8a6a4a, U, G + 0.12, F - 1.2);
  for (let k = 0; k < 5; k++)
    P.add(BOX(0.16, 2.7, 0.16), 0xe8e2d4, U - W / 2 + 0.2 + k * ((W - 0.4) / 4), G + 1.5, F - 2.3);
  P.add(BOX(W + 0.6, 0.12, 2.7), 0x5a3a34, U, G + 2.9, F - 1.2, 0.08, 0, 0);
  P.add(BOX(2, 0.14, 0.6), 0x8a6a4a, U + 0.3, G + 0.07, F - 2.7);
}

function tractor(P, u, f) {
  const GREEN = 0x2f7a3a;
  const YEL = 0xf2c230;
  P.add(BOX(2.2, 0.9, 0.95), GREEN, u - 0.6, G + 1.25, f);
  P.add(BOX(2.3, 0.1, 1.0), YEL, u - 0.6, G + 1.72, f);
  P.add(BOX(1.1, 0.3, 1.3), GREEN, u + 0.75, G + 1.05, f);
  P.add(BOX(0.5, 0.6, 0.5), 0x2a2a2a, u + 0.85, G + 1.45, f);
  P.add(CYL(0.07, 0.07, 1.0, 6), 0x2a2a2a, u - 1.2, G + 2.15, f - 0.2);
  P.add(TORUS(0.2, 0.03, 10), 0x2a2a2a, u + 0.3, G + 1.95, f, Math.PI / 2, 0, 0.5);
  for (const s of [-1, 1]) {
    P.add(CYL(0.85, 0.85, 0.45, 14), 0x1a1a1a, u + 0.75, G + 0.85, f + s * 0.85, Math.PI / 2);
    P.add(CYL(0.45, 0.45, 0.47, 10), YEL, u + 0.75, G + 0.85, f + s * 0.85, Math.PI / 2);
    P.add(CYL(0.45, 0.45, 0.3, 10), 0x1a1a1a, u - 1.3, G + 0.45, f + s * 0.6, Math.PI / 2);
    P.add(CYL(0.22, 0.22, 0.32, 8), YEL, u - 1.3, G + 0.45, f + s * 0.6, Math.PI / 2);
  }
}

function coop(P, u, f) {
  for (const [a, b] of [
    [-1, -0.6],
    [1, -0.6],
    [-1, 0.6],
    [1, 0.6]
  ])
    P.add(BOX(0.1, 0.6, 0.1), WOOD, u + a, G + 0.3, f + b);
  P.add(BOX(2.4, 1.2, 1.6), 0xa83a2a, u, G + 1.2, f);
  P.add(CYL(1.05, 1.05, 2.7, 4), 0x4a3a36, u, G + 1.8, f, 0, 0, Math.PI / 2, 0.6, 1, 1);
  P.add(BOX(0.5, 0.5, 0.06), 0x2a1a10, u + 0.6, G + 1.0, f - 0.82);
  P.add(BOX(0.4, 0.04, 1.3), WOOD, u + 0.6, G + 0.42, f - 1.35, -0.55, 0, 0);
  P.add(BOX(2.5, 0.1, 0.08), TRIM, u, G + 1.8, f - 0.82);
}

function windpump(P, u, f) {
  for (const s of [-1, 1]) {
    P.add(BOX(0.1, 8.5, 0.1), 0x7a7a7a, u + s * 0.7, G + 4.1, f + 0.7, 0.07, 0, -s * 0.07);
    P.add(BOX(0.1, 8.5, 0.1), 0x7a7a7a, u + s * 0.7, G + 4.1, f - 0.7, -0.07, 0, -s * 0.07);
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    P.add(
      BOX(0.24, 1.6, 0.03),
      0xd8d0c0,
      u + Math.cos(a) * 0.95,
      G + 8.6 + Math.sin(a) * 0.95,
      f - 0.3,
      0,
      0,
      a - Math.PI / 2
    );
  }
  P.add(BOX(0.1, 0.5, 1.8), 0xc0182a, u, G + 8.6, f + 1);
}

WORLDS.boar_farm = {
  sky: {
    top: "#2a2a5a",
    mid: "#b05a5a",
    horizon: "#ffb060",
    ground: "#4a3a2a",
    sun: [-22, 3, "#ffd080", 20],
    clouds: 7,
    cloud: "rgba(255,150,110,0.45)",
    hills: [
      { colour: "#5a4a4a", height: 6, rough: 2, phase: 2, trees: true },
      { colour: "#3a3030", height: 3, rough: 3 }
    ],
    seed: 62
  },
  fog: 0xa86a5a,
  signs: [
    ["MILLER FARM", BARN.U, G + 8.3, BARN.F - 0.08, 3.6, 0.6, "#f4efe2", "#7a1a10"],
    ["FRESH EGGS", COOP[0], G + 1.25, COOP[1] - 0.86, 1.6, 0.35, "#f4efe2", "#3a2414"]
  ],
  build(P) {
    P.ground(0x5a6a32, [
      { u: -2, f: 17, r: 16, c: 0x8a6a48, sx: 1.8, sz: 0.75 },
      { u: -8, f: 16.5, r: 4.6, c: 0x5a3a22, sx: 1.1, sz: 0.55 },
      { u: -2, f: 36, r: 6, c: 0x8a6a48, sx: 0.5, sz: 2 },
      { u: 0, f: 55, r: 12, c: 0x7a6a3a, sx: 6, sz: 0.75 }
    ]);
    barn(P);
    farmhouse(P);
    // the pig pens: low plank fences, huts, troughs
    for (const f of [PEN.F0, PEN.F1]) fenceU(P, PEN.U0, PEN.U1, f, 0.75);
    for (const u of [PEN.U0, (PEN.U0 + PEN.U1) / 2, PEN.U1]) fenceF(P, u, PEN.F0, PEN.F1, 0.75);
    for (const u of [-10.5, -5.5]) P.add(CYL(1.0, 1.0, 1.6, 3), 0x8a6a4a, u, G + 0.5, PEN.F1 - 0.8, -Math.PI / 2);
    for (const u of [-11.5, -4.5]) P.add(BOX(1.6, 0.4, 0.5), 0x6a6a6a, u, G + 0.2, PEN.F0 + 1.1);
    // bales, round and square
    for (const u of BALES) {
      P.add(CYL(0.72, 0.72, 1.3, 12), 0xd8b85a, u, G + 0.72, BALE_F, Math.PI / 2);
      P.add(CYL(0.5, 0.5, 1.32, 10), 0xc8a04a, u, G + 0.72, BALE_F, Math.PI / 2);
    }
    for (const [u, f] of [
      [-24, 14],
      [-22.4, 14.3],
      [26, 24]
    ])
      P.add(CYL(0.72, 0.72, 1.3, 12), 0xd0b052, u, G + 0.72, f, Math.PI / 2);
    for (const [x, y] of [
      [-1.25, 0],
      [0, 0],
      [1.25, 0],
      [-0.62, 1],
      [0.62, 1],
      [0, 2]
    ])
      P.add(BOX(1.2, 0.5, 0.6), y % 2 ? 0xc8a04a : 0xd8b85a, -17 + x, G + 0.25 + y * 0.5, 10.5);
    tractor(P, ...TRACTOR);
    coop(P, ...COOP);
    // the milk stand, a water trough, the yard's fences
    P.add(BOX(2.4, 0.8, 0.8), WOOD, MILK[0], G + 0.4, MILK[1] + 0.3);
    P.add(BOX(2.2, 0.6, 0.8), 0x7a8288, 8.5, G + 0.3, 27);
    fenceF(P, -30, 8, 40);
    fenceF(P, 30, 8, 44);
    fenceU(P, -40, 40, FIELD);
    // the field: rows, a scarecrow, a windpump; trees behind
    for (let f = FIELD + 2, k = 0; f < 64; f += 2.2, k++) {
      P.add(BOX(76, 1.5, 0.4), k % 2 ? 0x7a7a32 : 0x6a7030, 0, G + 0.75, f);
      for (let u = -37 + (k % 2) * 1.1; u < 38; u += 2.2) P.add(CONE(0.2, 0.55, 4), 0xc8a848, u, G + 1.7, f);
    }
    const [su, sf] = SCARECROW;
    P.add(BOX(0.12, 3.4, 0.12), WOOD, su, G + 1.7, sf - 0.3);
    P.add(BOX(1.8, 0.1, 0.1), WOOD, su, G + 2.7, sf - 0.3);
    P.add(BOX(0.5, 0.7, 0.25), 0x8a3a2a, su, G + 2.4, sf - 0.3);
    P.add(BALL(0.22, 6), 0xd8b860, su, G + 3.0, sf - 0.3);
    P.add(CONE(0.36, 0.4, 7), 0x6a4a2a, su, G + 3.3, sf - 0.3);
    windpump(P, 6, 40);
    // a pickup by the house, a hay wagon by the barn, a washing line
    truck(P, 28, 27, 0x2f4a7a, 0x9ab0c0, 0xf4efe2);
    hayWagon(P, -6, 35);
    for (const u of [24, 31]) P.add(BOX(0.1, 2.2, 0.1), WOOD, u, G + 1.1, 31);
    P.add(BOX(7, 0.03, 0.03), 0xe8e8e8, 27.5, G + 2.1, 31);
    [0xf4efe2, 0xc0182a, 0x3a6ad8, 0xf2c230, 0xf4efe2].forEach((col, k) =>
      P.add(BOX(0.9, 0.8, 0.04), col, 24.8 + k * 1.3, G + 1.68, 31)
    );
    for (const [u, f] of [
      [12, 44],
      [-6, 44],
      [26, 40]
    ])
      P.oak(u, f, 1.7, 0x4a5a2a);
    P.scatter(30, 66, 92, (u, f, R) => P.oak(u, f, 1.2 + R() * 0.6, 0x3a4a2a), 90);
    for (const [u, f] of [
      [-36, 14],
      [-40, 30],
      [33, 30],
      [36, 42],
      [28, 46]
    ])
      P.oak(u, f, 1.5, 0x4a5a2a);
    P.scatter(20, 8, 44, (u, f, R) => Math.abs(u) > 31 && P.bush(u, f, 0.6 + R() * 0.5, 0x4a5a2a), 60);
  },
  slots: [],
  cover: null
};

LAYOUTS.boar_farm = L => {
  const fixed = { fixed: true, rail: false };
  // hens on the pen fence and the coop roof, pumpkins on the bales
  L.row({
    ...fixed,
    kind: "boar_hen",
    n: 5,
    f: PEN.F0 - 0.05,
    u0: PEN.U0 + 1,
    u1: PEN.U1 - 1,
    base: 0.72,
    size: 0.42,
    tint: ["white", "orange"],
    bank: 5
  });
  L.row({
    ...fixed,
    kind: "boar_hen",
    n: 3,
    f: COOP[1],
    u0: COOP[0] - 0.7,
    u1: COOP[0] + 0.7,
    base: 2.4,
    size: 0.38,
    tint: "white",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "boar_pumpkin",
    n: 3,
    f: BALE_F,
    u0: BALES[0],
    u1: BALES[2],
    base: 1.44,
    size: 0.38,
    tint: "orange",
    bank: 3
  });
  // milk churns on the stand, lanterns by the barn door and on the porch
  L.row({
    ...fixed,
    kind: "can",
    n: 4,
    f: MILK[1],
    u0: MILK[0] - 0.9,
    u1: MILK[0] + 0.9,
    base: 0.8,
    size: 0.36,
    tint: "steel",
    bank: 4
  });
  for (const s of [-1, 1])
    L.row({
      ...fixed,
      kind: "lantern",
      n: 1,
      f: BARN.F - 0.35,
      u0: BARN.U + s * 3.2,
      u1: BARN.U + s * 3.2,
      base: 3.0,
      size: 0.36,
      tint: "gold"
    });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 1,
    f: HOUSE.F - 2.45,
    u0: HOUSE.U - 2.6,
    u1: HOUSE.U - 2.6,
    base: 2.1,
    size: 0.32,
    tint: "gold"
  });
  // the raiders: piglets in the yard, boar about the farm, along the field
  L.row({ kind: "boar", n: 6, f: 8, u0: -5, u1: 5, size: 0.4, tint: "brown", bank: 3 });
  L.row({ kind: "boar", n: 5, f: 21, u0: -1, u1: 8, size: 0.8, tint: "orange" });
  L.row({ ...fixed, kind: "boar", n: 2, f: 31, u0: -8, u1: -4, size: 0.85, tint: "brown" });
  L.row({ ...fixed, kind: "boar", n: 2, f: 31, u0: 5.5, u1: 10, size: 0.85, tint: "brown" });
  L.row({ kind: "boar", n: 5, f: 44, u0: -16, u1: 16, size: 1.0, tint: "orange", bank: 5 });
  L.row({
    ...fixed,
    kind: "crow",
    n: 2,
    f: SCARECROW[1] - 0.1,
    u0: SCARECROW[0] - 0.75,
    u1: SCARECROW[0] + 0.75,
    base: 2.75,
    size: 0.38,
    tint: "white"
  });
  L.row({ kind: "boar_tusker", n: 1, f: 47.5, u0: 7, u1: 7, size: 1.3, tint: "gold", pts: 50 });
  // out of the bales, round the tractor, in the pens (pigs: don't)
  const raid = [
    ["boar", 85],
    ["boar_pig", 15, { dont: true }]
  ];
  L.pops({ fixed: true, f: 9.6, at: [[-17, 0]], size: 0.8, tint: "brown", kinds: raid });
  L.pops({ fixed: true, f: BALE_F - 0.9, at: [[BALES[1], 0]], size: 0.8, tint: "brown", kinds: raid });
  L.pops({ fixed: true, f: TRACTOR[1] - 1.4, at: [[TRACTOR[0] + 0.4, 0]], size: 0.8, tint: "brown", kinds: raid });
  L.pops({
    fixed: true,
    f: PEN.F0 + 1.6,
    at: [
      [-10, 0.25],
      [-6, 0.25]
    ],
    size: 0.75,
    tint: "brown",
    kinds: [
      ["boar", 55],
      ["boar_pig", 45, { dont: true }]
    ]
  });
  L.pops({ fixed: true, f: COOP[1] - 1.3, at: [[COOP[0] - 1.6, 0]], size: 0.8, tint: "brown", kinds: raid });
  L.pops({ fixed: true, f: 25.4, at: [[28, 0]], size: 0.8, tint: "brown", kinds: raid });
  L.pops({ fixed: true, f: 34, at: [[-6, 1.05]], size: 0.8, tint: "brown", kinds: raid });
  // the hayloft, the farmhouse door and window
  L.pops({
    fixed: true,
    f: BARN.F - 0.2,
    at: [[BARN.U, 4.3]],
    size: 0.5,
    tint: "white",
    kinds: [
      ["boar_hen", 70],
      ["owl", 30]
    ]
  });
  L.pops({
    fixed: true,
    f: HOUSE.F - 0.25,
    at: [[HOUSE.U + 0.3, 0.25]],
    size: 0.85,
    tint: "brown",
    kinds: [
      ["boar", 75],
      ["boar_pig", 25, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: HOUSE.F - 0.25,
    at: [[HOUSE.U - 3.7, 1.0]],
    size: 1.25,
    period: [6, 9],
    busy: 0.45,
    kinds: [["farmer", 100, { dont: true }]]
  });
};

const farmWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  const henAt = () =>
    pick(R, [
      [PEN.U0 + 2, PEN.F0 - 1],
      [COOP[0], COOP[1] - 1.5],
      [BALES[1], BALE_F - 1.5],
      [-2, 18]
    ]);
  if (c.x2) {
    // the raid: they come over the field fence and through the yard
    for (let k = 0; k < 10; k++) sounder(R, add, 1 + k * 2.2, c, "boar_raider", { f0: R(48, 62) });
    for (let k = 0; k < 3; k++) flap(R, add, 2 + k * 8, c, 3, ...henAt());
    for (let k = 0; k < 2; k++) dash(R, add, 4 + k * 10, c, "boar_squeaker", 8, 14);
    add(R(5, 20), "boar_pigLoose", run(R, { v: R(6, 8), f: R(10, 16) }));
    return;
  }
  const k = c.w % 6;
  if (k === 0 || k === 3) {
    flap(R, add, R(1, 20), c, 3 + n(1), ...henAt());
    for (let j = 0; j < n(1); j++) dash(R, add, R(1, 22), c, "boar_squeaker", 8, 14);
  }
  if (k === 1 || k === 3 || k === 5) for (let j = 0; j < 1 + n(1); j++) sounder(R, add, R(1, 20), c, "boar_raider");
  if (k === 2 || k === 5) {
    for (let j = 0; j < 1 + n(1.2); j++) dash(R, add, R(1, 22), c, "boar_raider", 20, 42);
    for (let j = 0; j < n(0.8); j++) dash(R, add, R(1, 22), c, "boar_squeaker", 8, 14);
    flap(R, add, R(2, 20), c, 2, ...henAt());
  }
  if (k === 4) {
    flyers(["starling", "woodpigeon"], R, add, c, 3 + n(2));
    for (let j = 0; j < 1 + n(0.8); j++) dash(R, add, R(1, 22), c, "boar_squeaker", 8, 14);
    flap(R, add, R(2, 20), c, 2, ...henAt());
  }
  if (R(0, 1) < 0.35) add(R(2, 20), "boar_pigLoose", run(R, { v: R(6, 8), f: R(9, 13) }));
  if (R(0, 1) < 0.3) add(R(2, 16), "farmer", cross(R, { u0: -15, u1: 15, f: 12.5, v: R(1.6, 2.2) }));
};

// ---- Level 4: the bayou ---------------------------------------------------------

const SHACK = { U: 13, F: 22, W: 5.5, D: 4.5, FLOOR: 1.6 };
const DOCK = { U: 11, F0: 10, F1: 20, H: 0.5 };
const BOAT = [-5, 14];
const PADS = [-9, -7.5, -6, -4.5, -3];
const ISLE_A = [-14, 18];
const ISLE_B = [4, 27];
const CYP_PEEK = [
  [-8, 23],
  [-24, 21],
  [25, 30]
];
const SNAGS = [
  [-28, 30, 6],
  [20, 35, 5]
];
const REEDS = [-12, 2];
const MOSS = 0x8a9478;

function cypress(P, u, f, s = 1, k = 0) {
  P.add(CONE(1.0 * s, 1.8 * s, 8), 0x5a4a3a, u, G + 0.9 * s, f);
  P.add(CYL(0.22 * s, 0.4 * s, 8 * s, 7), 0x5a4a3a, u, G + 4 * s, f);
  P.add(BALL(2.2 * s, 7), 0x3a4a2a, u, G + 8.2 * s, f, 0, k, 0, 1.5, 0.35, 1.3);
  P.add(BALL(1.6 * s, 6), 0x4a5a32, u + 1.2 * s, G + 6.6 * s, f + 0.3, 0, k, 0, 1.5, 0.4, 1.2);
  for (let j = 0; j < 5; j++) {
    const a = j * 1.3 + k;
    P.add(
      CONE(0.22 * s, 1.8 * s, 4),
      MOSS,
      u + Math.cos(a) * 1.8 * s,
      G + 6.4 * s - (j % 2) * 1.2 * s,
      f + Math.sin(a) * 0.9,
      Math.PI,
      a,
      0
    );
  }
  for (let j = 0; j < 3; j++)
    P.add(CONE(0.15, 0.5, 5), 0x5a4a3a, u + Math.cos(j * 2.1) * 1.6 * s, G + 0.25, f + Math.sin(j * 2.1) * 1.2 * s);
}

function boat(P, u, f) {
  P.add(BOX(3.0, 0.4, 1.0), 0x3a5a4a, u, G + 0.15, f);
  for (const s of [-1, 1]) P.add(BOX(0.8, 0.4, 0.7), 0x3a5a4a, u + s * 1.75, G + 0.2, f, 0, Math.PI / 4, 0, 1, 1, 1);
  P.add(BOX(3.2, 0.06, 1.04), 0x2a2a2a, u, G + 0.36, f);
  P.add(BOX(0.9, 0.08, 0.9), 0x8a6a4a, u + 0.6, G + 0.3, f);
}

WORLDS.boar_bayou = {
  sky: {
    top: "#1a2440",
    mid: "#5a4a6a",
    horizon: "#e8905a",
    ground: "#2a3a2a",
    sun: [10, 4, "#ffb070", 22],
    clouds: 6,
    cloud: "rgba(240,150,120,0.4)",
    hills: [
      { colour: "#2a3a30", height: 8, rough: 3, phase: 0.7, trees: true },
      { colour: "#1a2a22", height: 4, rough: 5, trees: true }
    ],
    seed: 63
  },
  fog: 0x6a6a5a,
  signs: [
    ["BAIT & TACKLE", SHACK.U, G + SHACK.FLOOR + 2.4, SHACK.F - 0.08, 2.8, 0.5, "#e8dcc0", "#3a2414"],
    ["NO SWIMMIN", -12, G + 1.5, 7.9, 1.8, 0.42, "#c0182a", "#f4efe2"]
  ],
  build(P) {
    P.ground(0x4a4a30, [
      { u: 0, f: 23, r: 18, c: 0x2e4a44, sx: 3.6, sz: 0.95 },
      { u: 4, f: 30, r: 6, c: 0x7a6a58, sx: 0.5, sz: 1.3 },
      { u: ISLE_A[0], f: ISLE_A[1], r: 3.2, c: 0x5a5030, sz: 0.6 },
      { u: ISLE_B[0], f: ISLE_B[1], r: 3.6, c: 0x5a5030, sz: 0.5 },
      { u: 0, f: 46, r: 12, c: 0x3a4a2a, sx: 5, sz: 0.5 }
    ]);
    // the cypress: framing you, standing in the water, along the far bank
    for (const [u, f, s] of [
      [-19, 7.5, 1.3],
      [21, 9, 1.2],
      [-31, 12, 1.4],
      [31, 14, 1.3]
    ])
      cypress(P, u, f, s, Math.round(u));
    CYP_PEEK.forEach(([u, f], k) => cypress(P, u, f, 1.05, k));
    for (const [u, f] of [
      [-16, 35],
      [8, 38]
    ])
      cypress(P, u, f, 1.1, u);
    for (let k = 0; k < 15; k++) {
      const u = -46 + k * 6.6 + Math.sin(k * 1.7) * 1.5;
      const f = 45 + (k % 3) * 5;
      if (Math.abs(u) < 7) continue;
      cypress(P, u, f, 1.15 + (k % 2) * 0.2, k);
    }
    P.scatter(
      30,
      62,
      92,
      (u, f) => {
        P.add(CYL(0.3, 0.45, 9, 5), 0x3a3a30, u, G + 4.5, f);
        P.add(BALL(2.4, 6), 0x2a3a28, u, G + 9, f, 0, 0, 0, 1.4, 0.4, 1.2);
      },
      90
    );
    // dead snags
    for (const [u, f, h] of SNAGS) {
      P.add(CYL(0.15, 0.35, h, 6), 0x8a8478, u, G + h / 2, f);
      P.add(CYL(0.06, 0.12, 2, 4), 0x8a8478, u + 0.6, G + h * 0.7, f, 0, 0, -0.9);
    }
    // the stilt shack, its porch, the dock and the steps
    const { U, F, W, D, FLOOR } = SHACK;
    for (const a of [-W / 2 + 0.2, 0, W / 2 - 0.2])
      for (const b of [-2.2, 0, D])
        P.add(CYL(0.12, 0.15, FLOOR + 0.5, 6), 0x4a3a2a, U + a, G + (FLOOR - 0.5) / 2, F + b);
    P.add(BOX(W, 2.8, D), 0x6a5a48, U, G + FLOOR + 1.4, F + D / 2);
    for (let k = 0; k < 6; k++) P.add(BOX(W + 0.02, 0.05, 0.02), 0x4a3e32, U, G + FLOOR + 0.4 + k * 0.45, F - 0.01);
    P.add(
      CYL(D / 2 + 0.5, D / 2 + 0.5, W + 0.8, 4),
      0x8a5a3a,
      U,
      G + FLOOR + 2.8,
      F + D / 2,
      0,
      0,
      Math.PI / 2,
      1.5 / (D / 2 + 0.5),
      1,
      1
    );
    P.add(BOX(W + 0.4, 0.15, 2.2), 0x7a6650, U, G + FLOOR, F - 1.1);
    for (const s of [-1, 1]) P.add(BOX(0.14, 2.6, 0.14), 0x4a3a2a, U + s * (W / 2 - 0.05), G + FLOOR + 1.3, F - 2.0);
    P.add(BOX(W + 0.6, 0.1, 2.4), 0x8a5a3a, U, G + FLOOR + 2.6, F - 1.1, 0.12, 0, 0);
    P.add(BOX(W, 0.07, 0.07), 0x4a3a2a, U - 0.5, G + FLOOR + 0.9, F - 2.0);
    P.add(BOX(1.0, 1.9, 0.08), 0x2a1a10, U + 1.6, G + FLOOR + 0.95, F - 0.04);
    P.add(BOX(1.2, 1.0, 0.08), 0xffc860, U - 1.4, G + FLOOR + 1.2, F - 0.04);
    P.add(BOX(0.06, 1.0, 0.1), 0x4a3a2a, U - 1.4, G + FLOOR + 1.2, F - 0.06);
    P.add(SLAB(1.6, 0.12, DOCK.F1 - DOCK.F0), 0x8a7458, DOCK.U, G + DOCK.H, (DOCK.F0 + DOCK.F1) / 2);
    for (let f = DOCK.F0; f <= DOCK.F1; f += 2.5)
      for (const s of [-1, 1]) P.add(CYL(0.08, 0.08, 1.2, 5), 0x4a3a2a, DOCK.U + s * 0.75, G + 0.2, f);
    for (let k = 0; k < 4; k++)
      P.add(BOX(1.2, 0.1, 0.45), 0x7a6650, DOCK.U + 0.6, G + DOCK.H + 0.28 * (k + 1), DOCK.F1 + 0.1 + k * 0.4);
    P.add(CYL(0.36, 0.33, 0.9, 10), 0x6a3a22, DOCK.U, G + DOCK.H + 0.45, DOCK.F0 + 0.6);
    P.add(BOX(0.7, 0.4, 0.7), 0x9a8a6a, DOCK.U + 0.4, G + DOCK.H + 0.2, DOCK.F0 + 1.8);
    boat(P, ...BOAT);
    boat(P, DOCK.U + 1.8, DOCK.F0 + 3);
    // lily pads, reeds, rocks, the warning sign's post
    for (const u of PADS) P.add(CYL(0.42, 0.42, 0.03, 9), 0x4a7a3a, u, G + 0.05, 8.5);
    P.scatter(30, 7, 30, (u, f, R) => P.add(CYL(0.3 + R() * 0.2, 0.3, 0.03, 8), 0x3a6a32, u, G + 0.04, f), 24);
    for (let u = -40; u <= 40; u += 3.2)
      if (Math.abs(u) > 4) P.reeds(u + Math.sin(u) * 0.8, 5.6 + Math.cos(u) * 0.5, 0.9);
    for (const u of REEDS) (P.reeds(u * 1.5, 6.4, 1.2), P.reeds(u * 1.5 + 0.8, 6.6, 1.1));
    for (const [u, f] of [ISLE_A, ISLE_B]) (P.reeds(u - 2.4, f + 0.6), P.reeds(u + 2.6, f + 0.9));
    P.add(BOX(0.1, 1.6, 0.1), 0x4a3a2a, -12, G + 0.8, 8.0);
  },
  slots: [],
  cover: null
};

LAYOUTS.boar_bayou = L => {
  const fixed = { fixed: true, rail: false };
  // frogs on the pads, decoys on the water, bottles on the barrel
  L.row({
    ...fixed,
    kind: "frog",
    n: 5,
    f: 8.45,
    u0: PADS[0],
    u1: PADS[4],
    base: 0.06,
    size: 0.3,
    tint: "green",
    bank: 5
  });
  L.row({
    ...fixed,
    kind: "duck",
    n: 4,
    f: 12,
    u0: 1,
    u1: 6,
    base: 0.02,
    size: 0.34,
    tint: ["yellow", "white"],
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "bottle",
    n: 3,
    f: DOCK.F0 + 0.55,
    u0: DOCK.U - 0.25,
    u1: DOCK.U + 0.25,
    base: DOCK.H + 0.9,
    size: 0.3,
    tint: ["green", "brown"],
    bank: 3
  });
  // herons in the shallows, gators and hogs on the mud
  L.row({ kind: "heron", n: 3, f: 17, u0: -16, u1: 16, size: 1.2, tint: "white" });
  L.row({
    ...fixed,
    kind: "boar_gator",
    n: 2,
    f: ISLE_A[1],
    u0: ISLE_A[0] - 1.3,
    u1: ISLE_A[0] + 1.3,
    base: 0.15,
    size: 0.4,
    tint: "green",
    bank: 2
  });
  L.row({
    ...fixed,
    kind: "boar",
    n: 3,
    f: ISLE_B[1],
    u0: ISLE_B[0] - 1.4,
    u1: ISLE_B[0] + 1.4,
    base: 0.1,
    size: 0.75,
    tint: "brown"
  });
  L.row({ kind: "boar_gator", n: 3, f: 31, u0: -14, u1: -2, size: 0.4, tint: "green", bank: 3 });
  for (const s of [-1, 1])
    L.row({
      ...fixed,
      kind: "lantern",
      n: 1,
      f: SHACK.F - 2.15,
      u0: SHACK.U + s * (SHACK.W / 2 - 0.05),
      u1: SHACK.U + s * (SHACK.W / 2 - 0.05),
      base: SHACK.FLOOR + 1.3,
      size: 0.34,
      tint: "gold"
    });
  for (const [u, f, h] of SNAGS)
    L.row({ ...fixed, kind: "owl", n: 1, f: f - 0.3, u0: u, u1: u, base: h - 0.1, size: 0.45, tint: "white" });
  // hogs on the far bank, herons beyond, a golden gator
  L.row({ kind: "boar", n: 5, f: 42, u0: -18, u1: 18, size: 0.95, tint: "brown", bank: 5 });
  L.row({ kind: "heron", n: 2, f: 52, u0: -10, u1: 10, size: 1.3, tint: "white" });
  L.row({ kind: "boar_gator", n: 1, f: 56, u0: 3, u1: 3, size: 0.6, tint: "gold", pts: 50 });
  // hogs round the cypress, in the reeds, in the shack
  for (const [u, f] of CYP_PEEK)
    L.pops({
      fixed: true,
      peek: true,
      f: f + 0.7,
      at: [[u, 0]],
      size: 0.85,
      slide: 1.8,
      tint: "brown",
      kinds: [["boar", 100]]
    });
  L.pops({ f: 6.0, at: REEDS.map(u => [u, 0]), size: 0.8, tint: "brown", kinds: [["boar", 100]] });
  L.pops({
    fixed: true,
    f: SHACK.F - 0.2,
    at: [[SHACK.U + 1.6, SHACK.FLOOR]],
    size: 0.85,
    tint: "brown",
    kinds: [["boar", 100]]
  });
  // gators surfacing
  L.pops({
    f: 20,
    at: [
      [-4, 0],
      [6, 0]
    ],
    size: 0.38,
    tint: "green",
    period: [4, 7],
    kinds: [["boar_gator", 100]]
  });
  // the fisherman: in his boat (or a heron on it), at his window
  L.pops({
    fixed: true,
    f: BOAT[1] - 0.1,
    at: [[BOAT[0] + 0.6, 0.3]],
    size: 1.5,
    tint: "white",
    kinds: [
      ["boar_fisher", 55, { dont: true }],
      ["heron", 45]
    ]
  });
  L.pops({
    fixed: true,
    f: SHACK.F - 0.2,
    at: [[SHACK.U - 1.4, SHACK.FLOOR + 0.6]],
    size: 1.0,
    period: [6, 9],
    busy: 0.45,
    kinds: [["boar_fisher", 100, { dont: true }]]
  });
};

// Along the dock and back up to the shack.
function dockWalk(R, add, t) {
  const h = G + DOCK.H + 0.06;
  const w = walk(
    [
      [DOCK.U, DOCK.F1 - 0.3, h],
      [DOCK.U, DOCK.F0 + 1.2, h],
      [DOCK.U + 0.3, DOCK.F0 + 0.9, h]
    ],
    R(0.9, 1.2)
  );
  add(t, "boar_fisherWalk", { dur: w.time + 4, pos: w.pos });
}

const bayouWave = (R, add, c) => {
  const n = x => Math.round(x * c.I * 1.2);
  if (c.x2) {
    // the bayou boils
    for (let k = 0; k < 9; k++) sounder(R, add, 1 + k * 2.5, c, "boar_hog");
    for (let k = 0; k < 4; k++) lunge(R, add, 3 + k * 6, c);
    for (let k = 0; k < 3; k++) dash(R, add, 2 + k * 7, c, "boar_hog", 10, 30);
    flyers(["crow", "boar_heron"], R, add, c, 3);
    return;
  }
  const k = c.w % 6;
  if (k === 0 || k === 2 || k === 4) for (let j = 0; j < 1 + n(1.3); j++) dash(R, add, R(1, 22), c, "boar_hog", 9, 34);
  if (k === 0 || k === 2) flyers(["crow", "boar_heron"], R, add, c, 2 + n(k === 2 ? 2 : 0));
  if (k === 1 || k === 3 || k === 5)
    for (let j = 0; j < 1 + n(k === 1 ? 1 : 1.6); j++) sounder(R, add, R(1, 20), c, "boar_hog");
  if (k === 1 || k === 4) for (let j = 0; j < 1 + n(0.9); j++) lunge(R, add, R(2, 22), c);
  if (k === 3 || k === 5) for (let j = 0; j < n(1.1); j++) lunge(R, add, R(2, 22), c);
  if (R(0, 1) < 0.3) dockWalk(R, add, R(2, 18));
};

// ---- Level 5: the night raid -------------------------------------------------------

const NFENCE = 8;
const WAGON = [9.5, 11.5];
const TRUCK = [-8, 12];
const CORN = { U0: -32, U1: -13, ROWS: [16, 18.5, 21, 23.5, 26, 28.5, 31] };
const GATE = 30;
const NHOUSE = { U: 20, F: 36, W: 11, D: 8, H: 5.4 };
const NBARN = [-26, 48];
const WOODS = 46;
const LIT = 0xffd27a;

function nightHouse(P) {
  const { U, F, W, D, H } = NHOUSE;
  P.add(BOX(W, H, D), 0x8a8a9a, U, G + H / 2, F + D / 2);
  P.add(
    CYL(D / 2 + 0.4, D / 2 + 0.4, W + 0.6, 4),
    0x2a2a34,
    U,
    G + H,
    F + D / 2,
    0,
    0,
    Math.PI / 2,
    2.6 / (D / 2 + 0.4),
    1,
    1
  );
  P.add(BOX(0.8, 2.4, 0.8), 0x4a3a3a, U + 3.5, G + H + 1.8, F + D / 2 + 1);
  for (const [u, h0, w, h] of [
    [U - 3.7, 1.0, 1.2, 1.3],
    [U + 4.2, 1.0, 1.2, 1.3],
    [U - 3.2, 3.3, 1.0, 1.0],
    [U + 3.8, 3.3, 1.0, 1.0]
  ])
    P.add(BOX(w, h, 0.08), LIT, u, G + h0 + h / 2, F - 0.04);
  P.add(BOX(1.6, 2.3, 0.08), 0x2a2020, U + 0.3, G + 1.4, F - 0.04);
  P.add(BOX(W + 0.4, 0.25, 2.4), 0x4a4a4a, U, G + 0.12, F - 1.2);
  for (let k = 0; k < 5; k++)
    P.add(BOX(0.16, 2.7, 0.16), 0x8a8a9a, U - W / 2 + 0.2 + k * ((W - 0.4) / 4), G + 1.5, F - 2.3);
  P.add(BOX(W + 0.6, 0.12, 2.7), 0x2a2a34, U, G + 2.9, F - 1.2, 0.08, 0, 0);
  P.add(BALL(0.18, 6), 0xfff4c0, U + 1.4, G + 2.6, F - 0.2);
}

WORLDS.boar_night = {
  sky: {
    top: "#050a1e",
    mid: "#142446",
    horizon: "#3a4a6a",
    ground: "#0a1014",
    sun: [-25, 22, "#f4f0dc", 9],
    stars: true,
    clouds: 4,
    cloud: "rgba(150,170,210,0.25)",
    hills: [
      { colour: "#101828", height: 8, rough: 3, phase: 2.4, trees: true },
      { colour: "#0a1018", height: 4, rough: 4, trees: true }
    ],
    seed: 64
  },
  fog: 0x1a2238,
  signs: [["MILLER FARM", 0, G + 3.7, GATE - 0.1, 3.4, 0.6, "#2a1a10", "#f2d8a0"]],
  build(P) {
    P.ground(0x34443e, [
      { u: 0, f: 30, r: 9, c: 0x46483e, sx: 0.28, sz: 2.4 },
      { u: -22, f: 24, r: 12, c: 0x2a3424, sx: 1, sz: 0.85 },
      { u: -34, f: 40, r: 6, c: 0x5a6a8a, sx: 1.4, sz: 0.5 },
      { u: 12, f: 14, r: 5, c: 0x3a3a2a, sx: 1.2, sz: 0.5 }
    ]);
    // the fence along the lane, with posts for the lanterns and the owls
    for (const s of [-1, 1]) {
      for (const h of [0.55, 1.05]) P.add(BOX(13, 0.1, 0.08), 0x5a5048, s * 9, G + h, NFENCE);
      for (let k = 1; k <= 5; k++) P.add(BOX(0.16, 1.35, 0.16), 0x5a5048, s * 3 * k, G + 0.67, NFENCE + 0.02);
    }
    // the hay wagon and the pumpkin patch; the truck with its lights on
    const [wu, wf] = WAGON;
    P.add(BOX(3.6, 0.25, 1.7), 0x6a4a32, wu, G + 0.95, wf);
    for (const s of [-1, 1])
      for (const t of [-1, 1]) P.add(TORUS(0.45, 0.06, 12), 0x2a2420, wu + s * 1.2, G + 0.45, wf + t * 0.9);
    P.add(BOX(3.2, 0.5, 0.6), 0x8a7a4a, wu, G + 1.3, wf + 0.4);
    for (let k = 0; k < 9; k++) {
      const u = 6 + (k % 5) * 1.8 + Math.sin(k) * 0.4;
      const f = 13.5 + Math.floor(k / 5) * 1.6;
      P.add(BALL(0.28, 7), 0xd8701a, u, G + 0.2, f, 0, k, 0, 1.2, 0.8, 1.2);
      P.add(CYL(0.03, 0.04, 0.14, 4), 0x3a5a2a, u, G + 0.45, f);
    }
    truck(P, ...TRUCK, 0x5a1e1e, 0x1a2030, 0xfff4c0);
    // the cornfield on the left
    for (const f of CORN.ROWS) {
      P.add(BOX(CORN.U1 - CORN.U0, 1.7, 0.35), 0x2e3e2a, (CORN.U0 + CORN.U1) / 2, G + 0.85, f);
      for (let u = CORN.U0 + 0.5; u < CORN.U1; u += 1.6) P.add(CONE(0.18, 0.5, 4), 0x6a6a3a, u, G + 1.9, f);
    }
    // the gate across the lane, the farmhouse, the barn, haystacks
    for (const s of [-1, 1]) P.add(BOX(0.3, 4.2, 0.3), 0x4a3e34, s * 3, G + 2.1, GATE);
    P.add(BOX(6.6, 0.25, 0.25), 0x4a3e34, 0, G + 3.3, GATE);
    nightHouse(P);
    P.add(CYL(2.4, 2.4, 12, 12), 0x5a6068, NBARN[0] - 10, G + 6, NBARN[1] + 6);
    P.add(BALL(2.4, 10), 0x6a6a70, NBARN[0] - 10, G + 12, NBARN[1] + 6, 0, 0, 0, 1, 0.55, 1);
    // a lamp by the gate, fireflies over the corn
    P.add(BOX(0.12, 3.6, 0.12), 0x2a2a2a, 4.2, G + 1.8, GATE - 0.5);
    P.add(BALL(0.22, 7), 0xfff0b0, 4.2, G + 3.7, GATE - 0.5);
    P.scatter(40, 12, 34, (u, f, R) => u < -8 && P.add(BALL(0.05, 4), 0xd8ff7a, u, G + 0.8 + R() * 1.8, f), 34);
    const [bu, bf] = NBARN;
    P.add(BOX(12, 6, 10), 0x4a2226, bu, G + 3, bf + 5);
    P.add(CYL(6, 6, 10, 8), 0x4a2226, bu, G + 6, bf + 5, Math.PI / 2, 0, 0, 1, 1, 0.55);
    P.add(CYL(6.35, 6.35, 9.6, 8), 0x1e1a20, bu, G + 6, bf + 5, Math.PI / 2, 0, 0, 1, 1, 0.56);
    P.add(BOX(1.8, 1.6, 0.08), LIT, bu, G + 5.0, bf - 0.04);
    P.add(BOX(4, 3.8, 0.08), 0x2a1214, bu, G + 1.9, bf - 0.04);
    for (const [u, f] of [
      [-9, 36],
      [-5, 38],
      [8, 40],
      [30, 30]
    ])
      P.add(CONE(1.5, 2.6, 8), 0x7a6a42, u, G + 1.3, f);
    // the woods behind, dark
    for (let k = 0; k < 18; k++) {
      const u = -50 + k * 5.9 + Math.sin(k * 2.1) * 1.5;
      const f = WOODS + 3 + (k % 3) * 4;
      if (Math.abs(u) < 4) continue;
      if (k % 2) P.pine(u, f, 1.6 + (k % 3) * 0.2, 0x1e3028);
      else P.oak(u, f, 1.6, 0x26382c);
    }
    P.scatter(36, 60, 92, (u, f, R) => P.pine(u, f, 1.6 + R() * 0.6, 0x16241e), 90);
    P.scatter(14, 14, 44, (u, f, R) => u > 0 && P.bush(u, f, 0.5 + R() * 0.5, 0x22302a), 40);
  },
  slots: [],
  cover: null
};

LAYOUTS.boar_night = L => {
  const fixed = { fixed: true, rail: false };
  // lanterns and owls on the fence posts, pumpkins on the wagon
  for (const u of [-12, -6, 6, 12])
    L.row({ ...fixed, kind: "lantern", n: 1, f: NFENCE - 0.1, u0: u, u1: u, base: 1.35, size: 0.34, tint: "gold" });
  for (const u of [-9, 9, 15])
    L.row({ ...fixed, kind: "owl", n: 1, f: NFENCE - 0.1, u0: u, u1: u, base: 1.35, size: 0.42, tint: "white" });
  L.row({
    ...fixed,
    kind: "boar_pumpkin",
    n: 4,
    f: WAGON[1] - 0.5,
    u0: WAGON[0] - 1.3,
    u1: WAGON[0] + 1.3,
    base: 1.08,
    size: 0.34,
    tint: "orange",
    bank: 4
  });
  // the raiders: squeakers in the lane, the sounder in the moonlight
  L.row({ kind: "boar", n: 4, f: 14, u0: -3, u1: 3, size: 0.42, tint: "pink", bank: 4 });
  L.row({ kind: "boar", n: 5, f: 22, u0: -4, u1: 10, size: 0.85, tint: "brown" });
  L.row({ ...fixed, kind: "boar", n: 2, f: GATE - 0.2, u0: -4.6, u1: 4.6, size: 1.0, tint: "steel" });
  L.row({ ...fixed, kind: "owl", n: 1, f: GATE - 0.15, u0: 1.8, u1: 1.8, base: 3.43, size: 0.4, tint: "white" });
  L.row({
    ...fixed,
    kind: "boar_pumpkin",
    n: 2,
    f: NHOUSE.F - 2.5,
    u0: NHOUSE.U - 1,
    u1: NHOUSE.U + 1.6,
    base: 0.25,
    size: 0.34,
    tint: "orange",
    bank: 2
  });
  L.row({ kind: "boar", n: 6, f: 40, u0: -16, u1: 16, size: 1.0, tint: "steel", bank: 3 });
  L.row({ kind: "boar_tusker", n: 1, f: 58, u0: 0, u1: 0, size: 1.6, tint: "gold", pts: 50 });
  // eyes in the dark: the corn, the edge of the woods, the barn's loft
  for (const [u, k] of [
    [-16, 1],
    [-22, 2],
    [-27, 3],
    [-19, 4]
  ])
    L.pops({ fixed: true, f: CORN.ROWS[k] - 0.3, at: [[u, 0.75]], size: 0.35, kinds: [["boar_eyes", 100]] });
  L.pops({
    fixed: true,
    f: WOODS - 0.5,
    at: [
      [-12, 0.35],
      [-5, 0.5],
      [6, 0.4],
      [14, 0.45],
      [24, 0.4]
    ],
    size: 0.4,
    period: [4, 6.5],
    kinds: [["boar_eyes", 100]]
  });
  L.pops({
    fixed: true,
    f: NBARN[1] - 0.15,
    at: [[NBARN[0], 4.3]],
    size: 0.45,
    tint: "white",
    kinds: [
      ["owl", 50],
      ["boar_eyes", 50]
    ]
  });
  // the Millers at the window (don't), a boar at their door
  L.pops({
    fixed: true,
    f: NHOUSE.F - 0.25,
    at: [[NHOUSE.U - 3.7, 1.0]],
    size: 1.25,
    period: [6, 9],
    busy: 0.45,
    kinds: [["farmer", 100, { dont: true }]]
  });
  L.pops({
    fixed: true,
    f: NHOUSE.F - 0.25,
    at: [[NHOUSE.U + 0.3, 0.25]],
    size: 0.85,
    tint: "steel",
    kinds: [["boar", 100]]
  });
};

const nightWave = (R, add, c) => {
  const n = x => Math.round(x * c.I * 1.15);
  if (c.x2) {
    // the whole sounder, and him at the head of it
    add(5, "boar_bigTusker", charge(R, { v: 7 * c.S, f0: 70, u0: R(-6, 6) }));
    for (let k = 0; k < 12; k++) sounder(R, add, 1 + k * 2, c, "boar_night");
    for (let k = 0; k < 4; k++) dash(R, add, 2 + k * 6, c, "boar_nightSqueaker", 8, 16);
    return;
  }
  const k = c.w % 6;
  if (k !== 4) for (let j = 0; j < 1 + n(k === 5 ? 2 : 1.3); j++) sounder(R, add, R(1, 20), c, "boar_night");
  if (k === 1 || k === 4) for (let j = 0; j < 1 + n(1); j++) dash(R, add, R(1, 22), c, "boar_nightSqueaker", 8, 16);
  if (k === 0 || k === 2 || k === 4) flyers(["boar_bat", "boar_owl"], R, add, c, 2 + n(k === 4 ? 2 : 0.6));
  if (k === 3) for (let j = 0; j < n(1); j++) dash(R, add, R(1, 22), c, "boar_night", 20, 40);
  if ((k === 3 || k === 5) && R(0, 1) < 0.3 + 0.3 * c.p)
    add(R(2, 12), "boar_bigTusker", charge(R, { v: 7 * c.S, f0: R(62, 72) }));
  if (k === 4 && R(0, 1) < 0.4) add(R(2, 16), "farmer", cross(R, { u0: 15, u1: -15, f: 16, v: R(1.4, 1.8) }));
};

// ---- Sound beds (shoots-art makeAmbience: a campaign's own key has no wind
// of its own, so each adds it) ---------------------------------------------------------

function bed(d, sr, R, wind, rustle = 0) {
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const x = R() * 2 - 1;
    lp += 0.02 * (x - lp);
    lp2 += 0.2 * (x - lp2);
    d[i] +=
      lp * wind * (0.6 + 0.4 * Math.sin((t * 2 * Math.PI) / 8)) + (lp2 - lp) * rustle * (0.5 + 0.5 * Math.sin(t * 1.7));
  }
}
const saw = p => ((p / Math.PI) % 2) - 1;
const sq = p => Math.sign(Math.sin(p));
// One call (a grunt, a cluck, a hoot) at t0 s: hz gliding by glide over dur.
function call(d, sr, t0, hz, dur, amp, wave = Math.sin, glide = 0) {
  const i0 = Math.floor(t0 * sr);
  const n = Math.floor(dur * sr);
  let ph = 0;
  for (let k = 0; k < n && i0 + k < d.length; k++) {
    const e = k / n;
    ph += (2 * Math.PI * (hz + glide * e)) / sr;
    d[i0 + k] += amp * Math.sin(Math.PI * e) * wave(ph);
  }
}
function crickets(d, sr, amp) {
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] += Math.sin(2 * Math.PI * 4400 * t) * Math.max(0, Math.sin(t * 2 * Math.PI * 3)) ** 4 * amp;
  }
}

AMBIENCE.boar_woods = (d, sr, R) => {
  bed(d, sr, R, 2, 0.6);
  for (let k = 0; k < 9; k++) call(d, sr, 3 + k * 0.065, 1500, 0.02, 0.12, sq); // a woodpecker
  call(d, sr, 6.1, 2300, 0.32, 0.05, saw, -600); // a jay
  for (const t of [0.8, 1.0, 4.6, 4.75, 4.9]) call(d, sr, t, 3600 + t * 80, 0.08, 0.04, Math.sin, 500);
};
AMBIENCE.boar_farm = (d, sr, R) => {
  bed(d, sr, R, 1.6, 0.3);
  crickets(d, sr, 0.014);
  for (const t of [1.0, 1.25, 1.45, 1.6, 4.8, 5.05]) call(d, sr, t, 520, 0.07, 0.07, saw, -80); // hens
  call(d, sr, 3.2, 95, 0.35, 0.12, sq); // a pig
  call(d, sr, 6.2, 170, 1.3, 0.05, saw, -25); // a cow
};
AMBIENCE.boar_bayou = (d, sr, R) => {
  bed(d, sr, R, 0.9, 0.5);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] += Math.sin(2 * Math.PI * 5200 * t) * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 5)) * 0.012;
  }
  for (let t = 0.3; t < 8; t += 0.77) call(d, sr, t, 140, 0.1, 0.07, sq); // frogs
  call(d, sr, 4.0, 55, 1.2, 0.14, sq, -8); // a gator, far off
};
AMBIENCE.boar_night = (d, sr, R) => {
  bed(d, sr, R, 0.7);
  crickets(d, sr, 0.02);
  call(d, sr, 1.5, 420, 0.4, 0.08); // an owl
  call(d, sr, 2.2, 400, 0.25, 0.06);
  call(d, sr, 2.6, 400, 0.6, 0.08, Math.sin, -30);
  call(d, sr, 5.5, 85, 0.25, 0.1, sq); // grunts in the dark
  call(d, sr, 5.9, 80, 0.3, 0.1, sq);
  call(d, sr, 7.0, 600, 0.12, 0.04, saw, -200); // a dog, far off
  call(d, sr, 7.25, 600, 0.12, 0.04, saw, -200);
};

// ---- The campaign ------------------------------------------------------------------

export const BOAR = {
  name: "THE HUNT FOR BIG TUSKER",
  kinds,
  levels: [
    {
      world: "boar_woods",
      name: "THE OAK WOODS",
      story: "The sounder's fled into the oak woods. Flush them out",
      music: "boar",
      amb: "boar_woods",
      legend: "BOAR 75 · SQUEAKERS 100 · SQUIRRELS 100  ·  DON'T SHOOT THE FORAGER",
      wave: woodsWave,
      title: (w, x2) => (x2 ? "THE SOUNDER BREAKS COVER · DOUBLE POINTS" : null)
    },
    {
      world: "boar_farm",
      name: "THE FARMYARD RAID",
      story: "At dusk they hit the Miller farm. Save the pigs",
      music: "",
      amb: "boar_farm",
      legend: "BOAR 75 · HENS 50  ·  THE FARM PIGS AND THE FARMER: DON'T SHOOT",
      wave: farmWave,
      title: (w, x2) => (x2 ? "THE RAID · DOUBLE POINTS" : null)
    },
    {
      world: "boar_bayou",
      name: "THE BAYOU",
      story: "They've run for the swamp. Mind the gators",
      music: "",
      amb: "boar_bayou",
      legend: "HOGS 75 · GATORS 100, -15 IF ONE GETS YOU  ·  DON'T SHOOT THE FISHERMAN",
      wave: bayouWave,
      title: (w, x2) => (x2 ? "THE BAYOU BOILS · DOUBLE POINTS" : null)
    },
    {
      world: "boar_night",
      name: "THE NIGHT RAID",
      story: "By moonlight Big Tusker leads them back. End it",
      music: "boar",
      amb: "boar_night",
      legend: "BIG TUSKER 300, -50 IF HE GETS YOU  ·  WATCH FOR EYES IN THE DARK  ·  DON'T SHOOT THE MILLERS",
      wave: nightWave,
      title: (w, x2) => (x2 ? "THE WHOLE SOUNDER CHARGES · DOUBLE POINTS" : null)
    }
  ],
  done: ["BIG TUSKER IS DOWN", "THE VALLEY SLEEPS SAFE TONIGHT, HUNTERS"]
};
