import * as THREE from "three";
import { GROUND, BOX, CYL, BALL, CONE, SLAB, WORLDS, CARDS, CARD_SIZE, BIRDS, AMBIENCE, person } from "./shoots-art";
import { LAYOUTS, PERSON, PAINT } from "./plates";
import { SHAPES } from "./plates-shapes";
import { bird, runner, gunman, DONT, across, flush, toss, cross, charge, flyers } from "./shoot-paths";

// The safari campaign (Jay, 2026-10-24: the expedition goes on from the
// savanna: "crocodiles lunging out of the water, hippos, flamingos ... dense
// rainforest with a vine-covered temple ruin ... gorillas ... baboons on the
// rocks, leopards on branches ... a dust-storm sky, wildebeest stampede, an
// elephant charge, rhinos; a rare golden lion"). Five levels:
//   1 THE SAVANNA              (the safari world, shoots.js SCREEN.safari)
//   2 THE WATERHOLE            dusk at the guide's camp on the water: crocs
//                              lunging out (chargers), hippos, flamingos and
//                              storks, zebras and antelope down to drink;
//                              don't shoot the guide
//   3 THE JUNGLE               rainforest and a lost temple: monkeys in the
//                              canopy, gorillas out of the undergrowth, macaws
//                              fast across; don't shoot the explorer
//   4 THE KOPJES               granite outcrops at sunset and a ranger post:
//                              baboons on the rocks, leopards on the branch
//                              and the ledges (far, 50), hyenas running
//   5 THE GREAT STAMPEDE       the last camp in a thorn boma under a dust
//                              storm: wildebeest across, rhinos and an
//                              elephant charging, now and then the golden lion
// Laid out as the other worlds are (u right, f downrange, h up from the roof
// deck, the ground at GROUND); shoots-art moves it all SHIFT m back.

const G = GROUND;

// ---- New outlines (the plates' atlas: 8 shapes, 2 cards) ---------------------------

// A frontal outline from its right half (x 50 is the middle).
const mirrored = half => [
  ...half.flat(),
  ...half
    .slice(1, -1)
    .reverse()
    .flatMap(([x, y]) => [100 - x, y])
];

Object.assign(SHAPES, {
  // jaws open, lunging
  safari_croc: {
    polys: [
      [
        0, 6, 20, 3, 40, 1, 48, -2, 54, -4, 58, 0, 64, 1, 68, -2, 72, 1, 78, -2, 82, 1, 88, -2, 92, 1, 98, -1, 104, 2,
        116, 5, 130, 9, 144, 13, 152, 16, 140, 17, 124, 16, 110, 15, 108, 18, 112, 27, 102, 27, 98, 19, 80, 20, 68, 19,
        70, 27, 60, 27, 56, 19, 44, 18, 30, 21, 4, 28, 2, 23, 26, 16, 36, 12, 20, 11, 4, 11
      ]
    ],
    marks: [
      [2.5, 62, 8, 100, 8],
      [2, 8, 11, 8, 14],
      [2, 16, 11, 16, 14],
      [2, 10, 22, 11, 19],
      [2, 18, 19, 19, 17]
    ],
    dots: [[52, 3, 1.8]]
  },
  safari_hippo: {
    polys: [
      [
        2, 22, 0, 14, 4, 8, 14, 6, 22, 4, 26, 0, 30, 0, 32, 4, 40, 6, 50, 2, 70, 0, 92, 2, 106, 8, 114, 18, 116, 30,
        112, 40, 110, 52, 98, 52, 96, 44, 88, 46, 86, 52, 74, 52, 74, 46, 46, 46, 44, 52, 32, 52, 32, 44, 28, 44, 26,
        52, 14, 52, 16, 40, 12, 34, 4, 32, 0, 28
      ]
    ],
    lines: [[3, 114, 20, 120, 26]],
    marks: [
      [2.5, 2, 25, 14, 27],
      [2, 6, 10, 8, 12]
    ],
    dots: [[20, 10, 1.8]]
  },
  // on one leg in the shallows
  safari_flamingo: {
    polys: [
      [
        6, 22, 2, 16, 2, 10, 8, 4, 16, 1, 24, 4, 26, 10, 22, 16, 19, 24, 18, 32, 22, 39, 32, 43, 46, 41, 58, 43, 68, 49,
        74, 55, 64, 59, 56, 64, 46, 67, 44, 67, 45, 112, 48, 116, 36, 117, 41, 112, 41, 67, 34, 65, 28, 59, 26, 52, 18,
        48, 12, 40, 11, 31, 14, 23, 16, 16, 10, 16, 8, 20
      ]
    ],
    lines: [[3, 46, 66, 56, 80, 46, 90]],
    marks: [
      [3.5, 3, 12, 5, 20],
      [2.5, 48, 48, 64, 55]
    ],
    dots: [[16, 8, 1.3]]
  },
  // up on its legs, beating its chest
  safari_gorilla: {
    polys: [
      mirrored([
        [50, 0],
        [58, 1],
        [63, 6],
        [65, 14],
        [72, 19],
        [86, 22],
        [95, 30],
        [99, 44],
        [98, 56],
        [90, 62],
        [80, 64],
        [81, 74],
        [85, 94],
        [89, 106],
        [64, 108],
        [61, 92],
        [50, 84]
      ])
    ],
    marks: [
      [4.5, 90, 58, 70, 47],
      [4.5, 10, 58, 30, 47],
      [3, 42, 9, 58, 9],
      [2.5, 38, 30, 50, 36, 62, 30]
    ],
    dots: [
      [66, 46, 4.5],
      [34, 46, 4.5],
      [45, 13, 1.6],
      [55, 13, 1.6],
      [50, 21, 3]
    ]
  },
  safari_baboon: {
    polys: [
      [
        0, 26, 2, 20, 12, 16, 18, 10, 26, 6, 34, 8, 42, 6, 50, 10, 66, 16, 84, 18, 92, 24, 94, 34, 90, 40, 90, 56, 84,
        56, 83, 44, 79, 42, 78, 56, 72, 56, 71, 42, 46, 40, 44, 56, 38, 56, 38, 44, 34, 44, 32, 56, 26, 56, 28, 38, 24,
        32, 14, 30, 4, 30
      ]
    ],
    lines: [[5, 88, 22, 94, 8, 102, 4, 108, 12, 109, 32]],
    marks: [[3, 36, 12, 42, 26]],
    dots: [[18, 14, 1.5]]
  },
  safari_leopard: {
    polys: [
      [
        0, 22, 2, 16, 8, 10, 16, 8, 18, 4, 22, 6, 26, 10, 32, 16, 60, 18, 92, 18, 100, 22, 104, 30, 102, 44, 104, 56,
        98, 56, 96, 44, 94, 40, 90, 56, 84, 56, 86, 40, 60, 38, 40, 40, 38, 56, 32, 56, 32, 44, 28, 44, 26, 56, 20, 56,
        22, 40, 16, 32, 10, 28, 4, 26
      ]
    ],
    lines: [[4.5, 102, 24, 116, 30, 126, 40, 130, 52, 135, 50]],
    dots: [
      [12, 14, 1.3],
      [30, 24, 2.4],
      [40, 23, 2.6],
      [48, 30, 2.6],
      [56, 23, 2.6],
      [64, 30, 2.6],
      [72, 23, 2.6],
      [80, 30, 2.6],
      [88, 24, 2.6],
      [94, 32, 2.4],
      [44, 34, 2.4],
      [60, 34, 2.4],
      [76, 34, 2.4],
      [36, 31, 2.2]
    ]
  },
  // high shoulders, low hips, spots
  safari_hyena: {
    polys: [
      [
        0, 28, 2, 22, 8, 18, 14, 14, 16, 4, 22, 2, 24, 10, 30, 12, 40, 14, 52, 16, 74, 24, 92, 30, 98, 34, 98, 42, 96,
        64, 90, 64, 90, 50, 86, 50, 84, 64, 78, 64, 78, 50, 56, 46, 44, 46, 42, 64, 36, 64, 36, 50, 32, 50, 30, 64, 24,
        64, 26, 46, 22, 38, 14, 34, 6, 32
      ]
    ],
    lines: [[3.5, 96, 32, 104, 46]],
    marks: [[3, 20, 6, 42, 12]],
    dots: [
      [14, 18, 1.4],
      [36, 22, 2.4],
      [46, 24, 2.6],
      [56, 28, 2.6],
      [66, 30, 2.6],
      [50, 36, 2.4],
      [62, 38, 2.4],
      [76, 34, 2.4],
      [84, 38, 2.4],
      [40, 32, 2.2]
    ]
  },
  // the wildebeest: humped, bearded, horns curving up
  safari_gnu: {
    polys: [
      [
        0, 40, 2, 32, 8, 22, 14, 12, 22, 8, 28, 12, 34, 14, 42, 10, 52, 10, 62, 14, 80, 20, 96, 24, 104, 28, 108, 36,
        106, 46, 108, 60, 104, 74, 98, 74, 98, 62, 94, 56, 92, 74, 86, 74, 86, 54, 60, 52, 44, 54, 42, 74, 36, 74, 36,
        60, 32, 60, 30, 74, 24, 74, 26, 56, 24, 46, 20, 50, 18, 44, 14, 42, 6, 46, 2, 46
      ]
    ],
    lines: [
      [5, 16, 11, 8, 4, 10, -4, 20, -6],
      [3.5, 106, 30, 114, 44, 112, 54]
    ],
    marks: [
      [3, 30, 14, 46, 12],
      [2.5, 34, 22, 40, 40]
    ],
    dots: [[13, 19, 1.5]]
  }
});

Object.assign(CARDS, {
  // the guide at the waterhole
  safari_guide: (c, W, H) =>
    person(c, W, H, {
      body: "#6a7a4a",
      legs: "#c8b088",
      hat: "#5a4030",
      stetson: true,
      bandana: "#c0182a",
      skin: "#6a4024",
      hair: "#151515",
      belt: "#3a2a1a",
      armsUp: true
    }),
  // the explorer in the jungle: pith helmet, moustache
  safari_explorer: (c, W, H) => {
    person(c, W, H, {
      body: "#e8dcb8",
      vest: "#9a7a4a",
      legs: "#a08a5a",
      skin: "#f0c9a0",
      tache: true,
      hair: "#8a5a2a",
      belt: "#5a3a20",
      armsUp: true
    });
    const u = W / 10;
    c.fillStyle = "#f0ead8";
    c.beginPath();
    c.ellipse(W / 2, H * 0.105, 3.2 * u, H * 0.018, 0, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 6;
    c.strokeStyle = "#111";
    c.stroke();
    c.beginPath();
    c.ellipse(W / 2, H * 0.1, 2.2 * u, H * 0.075, 0, Math.PI, Math.PI * 2);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#9a7a4a";
    c.fillRect(W / 2 - 2.1 * u, H * 0.085, 4.2 * u, H * 0.012);
  }
});
Object.assign(CARD_SIZE, { safari_guide: [0.9, 1.8], safari_explorer: [0.9, 1.8] });
for (const k of ["safari_guide", "safari_explorer"]) PERSON.add(k);

// Plate tints for the animals
Object.assign(PAINT, {
  safari_croc: 0x8aa850,
  safari_hippo: 0xb098a8,
  safari_grey: 0x34343c,
  safari_gnu2: 0x5a4434,
  safari_baboon: 0x8a7048,
  safari_tan: 0xd8b880,
  safari_gnu: 0x4e4844,
  safari_spot: 0xf0b848
});

// ---- Birds (3D, as the other worlds' birds) -----------------------------------------

Object.assign(BIRDS, {
  safari_macaw: {
    body: 0xe8202a,
    head: 0xe8202a,
    wing: 0x2f6fe8,
    beak: 0xf4efe2,
    s: 0.9,
    tail: "long",
    accent: 0xe8202a,
    tip: 0xf2c230
  },
  safari_macawB: {
    body: 0x2f6fe8,
    head: 0x3ab54a,
    wing: 0x2f6fe8,
    beak: 0x222222,
    s: 0.9,
    tail: "long",
    accent: 0xf2c230,
    tip: 0x1f4ab8
  },
  safari_flamingo: {
    body: 0xf28ab0,
    head: 0xf28ab0,
    wing: 0xf06a98,
    beak: 0x222222,
    s: 1.6,
    tail: "long",
    tip: 0x151515,
    span: 1.4
  },
  safari_stork: {
    body: 0xf4f4f0,
    head: 0xf4f4f0,
    wing: 0xf4f4f0,
    beak: 0xe8344a,
    s: 1.7,
    tip: 0x151515,
    span: 1.5
  }
});

// ---- Kinds -----------------------------------------------------------------------

const beast = (shape, tint, h, r, sound, extra = {}) => ({ ...runner(shape, tint, h, r, sound), ...extra });
const dont = cardKey => ({ ...gunman(cardKey, 1.8), pts: -25, sound: "wrong", ...DONT });
const kinds = {
  safari_croc: beast("safari_croc", 0x8aa850, 0.55, 0.55, "roar"),
  safari_hippo: beast("safari_hippo", 0xb098a8, 1.5, 0.8, "roar"),
  safari_flamingo: bird("safari_flamingo", 10, 0.5, "honk"),
  safari_stork: bird("safari_stork", 10, 0.55, "caw"),
  safari_macaw: bird("safari_macaw", 25, 0.3, "chirp"),
  safari_macawB: bird("safari_macawB", 25, 0.3, "chirp"),
  safari_gorilla: beast("safari_gorilla", 0x34343c, 1.9, 0.75, "roar"),
  safari_silverback: beast("safari_gorilla", 0x9a9ea6, 2.4, 0.95, "roar", { pts: 150, name: "THE SILVERBACK!" }),
  safari_monkey: beast("monkey", 0xc8884a, 0.75, 0.4, "chirp"),
  safari_baboon: beast("safari_baboon", 0x8a7048, 0.85, 0.45, "squeal"),
  safari_hyena: beast("safari_hyena", 0xd8b880, 0.95, 0.5, "roar"),
  safari_leopard: beast("safari_leopard", 0xf0b848, 0.9, 0.45, "roar", { pts: 100 }),
  safari_gnu: beast("safari_gnu", 0x4e4844, 1.45, 0.65, "thud", { pts: 25 }),
  safari_gnuB: beast("safari_gnu", 0x5a4434, 1.5, 0.65, "thud", { pts: 25 }),
  safari_rhino: beast("rhino", 0xc8ccd2, 1.6, 0.8, "roar"),
  safari_elephant: beast("elephant", 0x8a8890, 3.0, 1.3, "roar", { pts: 50, name: "THE ELEPHANT CHARGES!" }),
  safari_goldLion: beast("lion", 0xffc93c, 1.4, 0.7, "roar", { pts: 300, name: "THE GOLDEN LION!" }),
  safari_guide: dont("safari_guide"),
  safari_explorer: dont("safari_explorer"),
  safari_ranger: dont("ranger")
};

// ---- Paths ------------------------------------------------------------------------

// Running straight across at distance f, this way or that (a herd keeps one way).
function herd(R, o) {
  const dir = o.dir ?? (R(0, 1) < 0.5 ? 1 : -1);
  const u0 = o.u0 ?? R(28, 34);
  const ph = R(0, 6);
  return {
    dur: (2 * u0) / o.v,
    pos: (tau, out) => out.set(-dir * u0 + dir * o.v * tau, o.f, G + 0.1 * Math.abs(Math.sin(ph + tau * 10)))
  };
}
// A monkey swinging across the canopy, vine to vine.
function swing(R, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = R(24, 30);
  const ph = R(0, 6);
  return {
    dur: (2 * u0) / o.v,
    pos: (tau, out) => out.set(-dir * u0 + dir * o.v * tau, o.f, o.h - 1.4 * Math.abs(Math.sin(ph + tau * 1.8)))
  };
}
// Out of the water / the undergrowth / the grass, diagonally at you.
function rush(R, add, t, kind, c, o) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(t, kind, charge(R, { v: R(o.v[0], o.v[1]) * c.S, u0: s * R(o.u[0], o.u[1]), f0: R(o.f[0], o.f[1]) }));
}

// ---- Shared scenery ----------------------------------------------------------------

// The expedition's Land Rover, side on, nose to the right.
function jeep(P, u, f, c = 0x8a8a5a) {
  P.add(BOX(4.2, 1.0, 1.8), c, u, G + 0.95, f);
  P.add(BOX(2.3, 0.9, 1.74), c, u - 0.5, G + 1.9, f);
  P.add(BOX(2.1, 0.55, 1.78), 0x24303a, u - 0.45, G + 2.0, f);
  P.add(BOX(2.4, 0.08, 1.8), 0x3a3a2a, u - 0.5, G + 2.4, f);
  for (const s of [-1, 1]) P.add(BOX(0.06, 0.25, 1.8), 0x3a3a2a, u - 0.5 + s * 1.15, G + 2.55, f);
  P.add(BOX(0.12, 0.3, 1.9), 0x2a2a2a, u + 2.15, G + 0.55, f);
  for (const s of [-1, 1]) P.add(BALL(0.1, 6), 0xfff0c0, u + 2.1, G + 1.15, f + s * 0.6);
  for (const x of [-1.35, 1.35])
    for (const z of [-0.85, 0.85]) {
      P.add(CYL(0.42, 0.42, 0.3, 12), 0x1a1a1a, u + x, G + 0.42, f + z, Math.PI / 2);
      P.add(CYL(0.2, 0.2, 0.32, 8), 0x8a8a8a, u + x, G + 0.42, f + z, Math.PI / 2);
    }
  P.add(CYL(0.4, 0.4, 0.25, 12), 0x1a1a1a, u - 2.2, G + 1.2, f, 0, 0, Math.PI / 2);
  for (const k of [0, 1, 2])
    P.add(BOX(0.35, 0.5, 0.2), [0xc0182a, 0x4a6a2a, 0xc0182a][k], u - 2.9, G + 0.25, f - 0.6 + k * 0.4);
}

// A ridge tent: two canvas sides, the door open (front at f - 1.7).
function tent(P, u, f, c = 0x8a8a5a) {
  for (const s of [-1, 1]) P.add(BOX(2.5, 0.06, 3.4), c, u + s * 0.86, G + 0.94, f, 0, 0, -s * 0.82);
  P.add(BOX(0.08, 2.0, 0.08), 0x5a3a20, u, G + 1.0, f - 1.7);
  P.add(BOX(0.08, 2.0, 0.08), 0x5a3a20, u, G + 1.0, f + 1.7);
  P.add(BOX(0.9, 1.4, 0.04), 0x2a2414, u, G + 0.7, f - 1.68);
  for (const s of [-1, 1]) P.add(BOX(0.04, 0.04, 1.4), 0xd8d0b0, u + s * 2.0, G + 0.6, f - 1.9, 0.6, 0, s * 0.6);
}

function campfire(P, u, f) {
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    P.add(BALL(0.2, 5), 0x6a6460, u + Math.cos(a) * 0.8, G + 0.1, f + Math.sin(a) * 0.8);
  }
  for (const a of [0.4, -0.5, 1.6]) P.add(CYL(0.09, 0.11, 1.3, 6), 0x3a2414, u, G + 0.16, f, 0, a, Math.PI / 2 - 0.15);
  P.add(CONE(0.5, 1.3, 7), 0xff7a1a, u, G + 0.75, f);
  P.add(CONE(0.28, 0.9, 6), 0xffd23a, u + 0.05, G + 0.6, f - 0.05);
}

function baobab(P, u, f, s = 1, c = 0x8a7a6a) {
  P.add(CYL(1.2 * s, 1.8 * s, 6 * s, 10), c, u, G + 3 * s, f);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    const du = Math.cos(a);
    const df = Math.sin(a);
    P.add(
      CYL(0.18 * s, 0.35 * s, 2.6 * s, 6),
      c,
      u + du * 1.4 * s,
      G + 6.8 * s,
      f + df * 1.4 * s,
      df * 0.8,
      0,
      -du * 0.8
    );
    P.add(BALL(0.9 * s, 6), 0x5a6a2a, u + du * 2.3 * s, G + 8 * s, f + df * 2.3 * s, 0, 0, 0, 1.3, 0.6, 1.3);
  }
}

// A rounded granite boulder (its middle h up off the ground).
function boulder(P, u, h, f, r, c = 0xa08a7a, sx = 1.3, sy = 0.85, sz = 1) {
  P.add(BALL(r, 9), c, u, G + h, f, 0, 0, 0, sx, sy, sz);
}

// ---- Level 2: the waterhole ---------------------------------------------------------

// The guide's camp on this bank (f 3 to 6); the water from f 9 to 30, a
// sandbar in it, a dead tree the storks use; the far bank where the herds
// come down to drink; giraffes and elephants beyond.
const WH = { MID: 19.5, R: 10.5, SX: 3, JEEP: [-13, 4.5], TENT: [8.5, 5], TREE: [13, 22] };
const nearEdge = u => WH.MID - WH.R * Math.sqrt(Math.max(0, 1 - (u / (WH.R * WH.SX)) ** 2));
const farEdge = u => WH.MID + WH.R * Math.sqrt(Math.max(0, 1 - (u / (WH.R * WH.SX)) ** 2));

function papyrus(P, u, f, s = 1) {
  for (let k = 0; k < 3; k++) {
    const du = (k - 1) * 0.35;
    const h = (2.2 + k * 0.3) * s;
    P.add(CYL(0.02, 0.035, h, 3), 0x5a7a2a, u + du, G + h / 2, f + (k % 2) * 0.3, 0, 0, du * 0.3);
    P.add(CONE(0.45 * s, 0.5 * s, 6), 0x7a9a3a, u + du * 1.4, G + h + 0.05, f + (k % 2) * 0.3, Math.PI);
  }
}

WORLDS.safari_water = {
  sky: {
    top: "#16204a",
    mid: "#4a4a8a",
    horizon: "#f0905a",
    ground: "#4a3424",
    sun: [-40, 3, "#ffcf70", 20],
    stars: true,
    clouds: 7,
    cloud: "rgba(255,140,120,0.45)",
    hills: [
      { colour: "#4a3450", height: 5, rough: 2, phase: 0.6 },
      { colour: "#2e2234", height: 2.5, rough: 2.5 }
    ],
    seed: 105
  },
  fog: 0x8a5a6a,
  signs: [
    ["BEWARE · CROCODILES", -17.5, G + 1.7, 7.9, 2.8, 0.55, "#f2c230", "#1a1a1a"],
    ["CAMP MBALI", WH.JEEP[0], G + 1.0, WH.JEEP[1] - 0.94, 1.8, 0.42, "#e8dcc0", "#3a2414"]
  ],
  build(P) {
    P.ground(0x9a7a4a, [
      { u: 0, f: WH.MID, r: WH.R + 1.4, c: 0x5a4632, sx: 2.75, sz: 1.12 },
      { u: 0, f: WH.MID, r: WH.R, c: 0x4e5a80, sx: WH.SX, sz: 1 },
      { u: 15, f: 23, r: 5, c: 0xb87a6a, sx: 2.2, sz: 0.22 },
      { u: -6, f: 19, r: 3, c: 0x8a7050, sx: 2.2, sz: 0.55 },
      { u: 0, f: 4, r: 8, c: 0x7a5e3a, sx: 3, sz: 0.45 },
      { u: 0, f: 52, r: 28, c: 0xb09050, sx: 2.4, sz: 0.5 }
    ]);
    // the camp: the Land Rover, the tent, a table, the fire, lantern posts
    jeep(P, ...WH.JEEP);
    tent(P, ...WH.TENT);
    P.add(BOX(3.2, 0.06, 0.9), 0x7a5232, 3, G + 0.77, 3.4);
    for (const x of [-1.45, 1.45])
      for (const z of [-0.35, 0.35]) P.add(BOX(0.06, 0.75, 0.06), 0x4a3020, 3 + x, G + 0.37, 3.4 + z);
    for (const x of [0.6, 5.4]) {
      P.add(BOX(0.55, 0.05, 0.5), 0x2a4a2a, x, G + 0.45, 3.2);
      P.add(BOX(0.55, 0.5, 0.05), 0x2a4a2a, x, G + 0.7, 3.45);
    }
    campfire(P, 13.5, 3);
    P.add(BOX(0.6, 0.05, 0.05), 0x2a2a2a, 9.35, G + 1.9, 3.3);
    P.add(BOX(0.08, 2.2, 0.08), 0x4a3020, 12.2, G + 1.1, 3.2);
    P.add(BOX(0.5, 0.05, 0.05), 0x2a2a2a, 12.45, G + 2.1, 3.2);
    P.add(BOX(0.12, 1.8, 0.12), 0x4a3020, -17.5, G + 0.9, 8.0);
    // reeds and papyrus round the water, the sandbar's logs
    for (let u = -28; u <= 28; u += 3.1) {
      if (Math.abs(u) > 1.5) P.reeds(u, nearEdge(u) - 0.2, 0.8 + 0.25 * Math.abs(Math.sin(u)));
      P.reeds(u + 1.2, farEdge(u + 1.2) + 0.4, 1.0);
    }
    for (const [u, f] of [
      [-30, 17],
      [-27, 25],
      [29, 15],
      [31, 21],
      [-20, 10.5],
      [22, 11],
      [-8, 30.6],
      [17, 29.8]
    ])
      papyrus(P, u, f, 1.1);
    P.add(CYL(0.18, 0.22, 3.2, 6), 0x5a4a3a, -3.4, G + 0.15, 19.3, 0, 0.3, Math.PI / 2);
    // the dead tree in the water, its branches out for the storks
    const [tu, tf] = WH.TREE;
    P.add(CYL(0.22, 0.38, 7.5, 7), 0x6a5a4a, tu, G + 3.75, tf);
    for (const [c, h, len] of [
      [11.6, 3.4, 3.2],
      [14.6, 5.0, 3.4],
      [11.8, 6.4, 2.8]
    ])
      P.add(CYL(0.09, 0.13, len, 5), 0x6a5a4a, c, G + h, tf, 0, 0, Math.PI / 2);
    P.add(CYL(0.05, 0.09, 2.4, 5), 0x6a5a4a, tu + 0.7, G + 8.2, tf, 0, 0, -0.6);
    P.add(CYL(0.05, 0.08, 2.0, 5), 0x6a5a4a, tu - 0.6, G + 8.0, tf, 0, 0, 0.55);
    // the far bank: acacias, a baobab, termite mounds, bush
    baobab(P, -24, 42, 1.0);
    baobab(P, 34, 60, 1.2);
    for (const [u, f, s] of [
      [-12, 40, 1.4],
      [6, 44, 1.2],
      [20, 38, 1.5],
      [-34, 36, 1.3],
      [36, 42, 1.1],
      [-4, 62, 1.6],
      [-40, 58, 1.4],
      [16, 70, 1.8]
    ])
      P.acacia(u, f, s);
    for (const [u, f] of [
      [-16, 37],
      [11, 41],
      [26, 46],
      [-30, 50]
    ])
      P.add(CONE(0.9, 2.6, 6), 0x9a6a42, u, G + 1.3, f);
    P.scatter(40, 34, 85, (u, f, R) => P.bush(u, f, 0.4 + R() * 0.6, 0x6a6a32), 80, 8);
    P.scatter(18, 33, 70, (u, f, R) => P.rock(u, f, 0.5 + R() * 0.9, 0x8a7a6a), 70, 10);
  },
  slots: [],
  cover: null
};

LAYOUTS.safari_water = L => {
  const fixed = { fixed: true, rail: false };
  // the camp: bottles on the table, cans on the roof rack, lanterns
  L.row({
    ...fixed,
    kind: "bottle",
    n: 5,
    f: 3.35,
    u0: 1.8,
    u1: 4.2,
    base: 0.8,
    size: 0.3,
    tint: ["green", "brown"],
    bank: 5
  });
  L.row({
    ...fixed,
    kind: "can",
    n: 4,
    f: 3.75,
    u0: WH.JEEP[0] - 1.4,
    u1: WH.JEEP[0] + 0.4,
    base: 2.44,
    size: 0.22,
    tint: ["steel", "red"],
    bank: 4
  });
  L.row({ ...fixed, kind: "lantern", n: 1, f: 3.25, u0: 9.6, u1: 9.6, base: 1.38, size: 0.36, tint: "gold" });
  L.row({ ...fixed, kind: "lantern", n: 1, f: 3.15, u0: 12.65, u1: 12.65, base: 1.58, size: 0.36, tint: "gold" });
  // crocs basking on the near mud and on the sandbar
  L.row({
    ...fixed,
    kind: "safari_croc",
    n: 4,
    f: 8.6,
    u0: -16,
    u1: 18,
    base: 0,
    size: 0.36,
    tint: "safari_croc",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "safari_croc",
    n: 3,
    f: 19,
    u0: -10,
    u1: -2,
    base: 0.02,
    size: 0.4,
    tint: "safari_croc",
    bank: 3
  });
  // storks on the dead tree
  for (const [u, h] of [
    [11.2, 3.52],
    [15.2, 5.13],
    [11.4, 6.53]
  ])
    L.row({ ...fixed, kind: "heron", n: 1, f: WH.TREE[1] - 0.2, u0: u, u1: u, base: h, size: 0.75, tint: "white" });
  // the flamingos in the shallows, two flocks
  L.row({ ...fixed, kind: "safari_flamingo", n: 6, f: 23, u0: -20, u1: -9, size: 1.3, tint: "pink", bank: 5 });
  L.row({ ...fixed, kind: "safari_flamingo", n: 4, f: 25, u0: 17, u1: 25, size: 1.3, tint: "pink", bank: 4 });
  // hippos wading, half under
  L.row({ ...fixed, kind: "safari_hippo", n: 2, f: 27, u0: -8, u1: 6, base: -0.35, size: 1.05, tint: "safari_hippo" });
  // down to drink on the far bank
  L.row({ ...fixed, kind: "zebra", n: 3, f: 32.5, u0: -14, u1: -3, size: 1.3, tint: "white" });
  L.row({ ...fixed, kind: "antelope", n: 3, f: 33.5, u0: 4, u1: 15, size: 1.0, tint: "orange" });
  // giraffes and elephants beyond, an impala far out
  L.row({ ...fixed, kind: "giraffe", n: 2, f: 49, u0: -30, u1: 26, size: 3.2, tint: "orange" });
  L.row({ ...fixed, kind: "elephant", n: 2, f: 57, u0: -9, u1: 13, size: 2.6, tint: "steel" });
  L.row({ ...fixed, kind: "antelope", n: 1, f: 66, u0: -18, u1: -18, size: 1.0, tint: "white", pts: 50 });
  // hippos surfacing, crocs out of the reeds
  L.pops({
    fixed: true,
    f: 15.5,
    at: [
      [-14, -0.5],
      [1, -0.5],
      [16, -0.5]
    ],
    size: 1.1,
    tint: "safari_hippo",
    kinds: [["safari_hippo", 100]]
  });
  L.pops({
    fixed: true,
    f: 10.2,
    at: [
      [-21, 0],
      [-6, 0],
      [6.5, 0],
      [21, 0]
    ],
    size: 0.42,
    tint: "safari_croc",
    kinds: [["safari_croc", 100]]
  });
  // round the camp: the guide (don't), and a lioness after the supplies
  L.pops({
    fixed: true,
    f: WH.TENT[1] - 1.9,
    at: [[WH.TENT[0], 0]],
    size: 1.75,
    kinds: [
      ["safari_guide", 55, { dont: true }],
      ["lion", 45]
    ],
    tint: "gold"
  });
  L.pops({
    fixed: true,
    f: WH.JEEP[1] - 1.2,
    at: [[WH.JEEP[0] + 3.2, 0]],
    size: 1.75,
    kinds: [
      ["safari_guide", 60, { dont: true }],
      ["lion", 40]
    ],
    tint: "gold"
  });
  // up out of the far bank's bush
  L.pops({
    fixed: true,
    f: 35,
    at: [
      [-20, 0],
      [-1, 0],
      [22, 0]
    ],
    size: 1.1,
    tint: "white",
    kinds: [
      ["zebra", 45],
      ["antelope", 40],
      ["lion", 15]
    ]
  });
};

// The zebras and antelope coming down to the far bank.
function drink(R, add, t, c) {
  add(t, R(0, 1) < 0.5 ? "zebra" : "antelope", herd(R, { f: R(31.5, 38), v: R(8, 11) * c.S }));
}
const croc = (R, add, t, c) => rush(R, add, t, "safari_croc", c, { v: [4.5, 6], u: [5, 22], f: [13, 24] });
const hippo = (R, add, t, c) => rush(R, add, t, "safari_hippo", c, { v: [3.8, 4.8], u: [4, 18], f: [20, 28] });
// Flushed up off the water.
function wader(R, add, t, c, kind) {
  add(t, kind, flush(R, { u: R(-26, 26), f: R(16, 28), S: c.S * 0.9 }));
}

const waterWave = (R, add, c) => {
  if (c.x2) {
    // the crocodiles rise
    for (let k = 0; k < 8; k++) croc(R, add, 1 + k * 2.8, c);
    for (let k = 0; k < 2; k++) hippo(R, add, 6 + k * 10, c);
    for (let k = 0; k < 12; k++) wader(R, add, 1 + k * 1.5, c, k % 3 ? "safari_flamingo" : "safari_stork");
    for (let k = 0; k < 4; k++) drink(R, add, 3 + k * 6, c);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 4) for (let j = 0; j < 2 + n(1.5); j++) drink(R, add, R(1, 22), c);
  if (k === 1 || k === 4)
    for (let j = 0; j < 3 + n(3); j++) wader(R, add, R(1, 24), c, R(0, 1) < 0.7 ? "safari_flamingo" : "safari_stork");
  if (k === 2 || k === 3 || k === 5) for (let j = 0; j < 1 + n(1.3); j++) croc(R, add, R(1, 22), c);
  if (k === 3 || (k === 5 && R(0, 1) < 0.6)) hippo(R, add, R(2, 18), c);
  if (k === 2 || k === 5) for (let j = 0; j < 1 + n(1); j++) drink(R, add, R(1, 22), c);
  if (k === 1) for (let j = 0; j < 1 + n(1); j++) croc(R, add, R(4, 22), c);
  if (k === 5) flyers(["lovebird", "vulture"], R, add, c, 2);
  if (R(0, 1) < 0.3) add(R(2, 20), "safari_guide", cross(R, { u0: -14, u1: 14, f: 6.4, v: 1.3 }));
};

// ---- Level 3: the jungle ---------------------------------------------------------

// A fallen log across the trail (f 9), the big trees with their limbs out
// over you, ferns and undergrowth, and up the trail the stepped temple (its
// face at f 41, the shrine on top at f 45.5).
const JG = { LOG: 9.4, PLAZA: 37.5, T1: 41, T2: 43, T3: 45, SHRINE: 45.5 };
const STONE = 0x8a8670;
const STONE2 = 0x7a786a;
const MOSS = 0x4a7a2a;
const LEAF = [0x24502a, 0x2e5e2a, 0x3a6a2a];

function jungleTree(P, u, f, s = 1, top = 13) {
  const h = top * s;
  P.add(CYL(0.5 * s, 0.85 * s, h, 8), 0x5a4a38, u, G + h / 2, f);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    P.add(
      BOX(0.18, 1.8 * s, 1.6 * s),
      0x5a4a38,
      u + Math.cos(a) * 0.8 * s,
      G + 0.8 * s,
      f + Math.sin(a) * 0.8 * s,
      0,
      a,
      0
    );
  }
  P.add(BALL(4.4 * s, 8), LEAF[0], u, G + h, f, 0, 0, 0, 1.3, 0.5, 1.2);
  P.add(BALL(3.0 * s, 7), LEAF[1], u + 2.2 * s, G + h - 1.4 * s, f - 0.8 * s, 0, 0, 0, 1.2, 0.6, 1.1);
  P.add(BALL(2.6 * s, 7), LEAF[2], u - 2.4 * s, G + h - 1.0 * s, f + 0.6 * s, 0, 0, 0, 1.2, 0.6, 1.1);
  for (const d of [-1.6, 1.3]) P.add(CYL(0.04, 0.04, 5 * s, 3), MOSS, u + d * s, G + h - 3.2 * s, f - 1.2 * s);
}
function fern(P, u, f, s = 1) {
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    P.add(
      BOX(1.3 * s, 0.03, 0.28 * s),
      k % 2 ? 0x3a7a2a : 0x2f6a24,
      u + Math.cos(a) * 0.55 * s,
      G + 0.35 * s,
      f + Math.sin(a) * 0.55 * s,
      0,
      a,
      0.55
    );
  }
}
// A vine sagging from (u - r) to (u + r) at height h.
function vine(P, u, h, f, r, sag = 0.25) {
  P.add(new THREE.TorusGeometry(r, 0.11, 3, 12, Math.PI), MOSS, u, G + h, f, 0, 0, Math.PI, 1, sag, 1);
}

WORLDS.safari_jungle = {
  sky: {
    top: "#1e3a30",
    mid: "#5a8a6a",
    horizon: "#d8e8b0",
    ground: "#223018",
    sun: [-25, 38, "#f4f8d8", 9],
    clouds: 10,
    cloud: "rgba(220,240,210,0.4)",
    hills: [
      { colour: "#2e4e2e", height: 9, rough: 4, phase: 1.1, trees: true },
      { colour: "#1e3a22", height: 5, rough: 3, trees: true }
    ],
    seed: 106
  },
  fog: 0x6a8a6a,
  signs: [["THE LOST TEMPLE", 8.5, G + 1.6, 7.0, 2.4, 0.5, "#3a2a1a", "#e8dcb0"]],
  build(P) {
    P.ground(0x3e4a22, [
      { u: 0, f: 24, r: 15, c: 0x6a4a2a, sx: 0.2, sz: 1 },
      { u: 0, f: JG.PLAZA, r: 8, c: 0x7a7460, sx: 2.2, sz: 0.45 },
      { u: -12, f: 20, r: 6, c: 0x2e4a1c, sx: 1.5 },
      { u: 14, f: 28, r: 7, c: 0x2e4a1c, sx: 1.4 }
    ]);
    // the trail sign, the fallen log
    P.add(BOX(0.12, 1.9, 0.12), 0x4a3020, 8.5, G + 0.95, 7.1);
    P.add(CYL(0.42, 0.5, 11, 10), 0x5a4030, 0, G + 0.42, JG.LOG, 0, 0, Math.PI / 2);
    for (const [u, c] of [
      [-3.5, 0xe86a1a],
      [-3.1, 0xe8a03a],
      [2.6, 0xe86a1a]
    ])
      P.add(BALL(0.14, 6), c, u, G + 0.5, JG.LOG - 0.45, 0, 0, 0, 1, 0.5, 1);
    P.add(BOX(11, 0.08, 0.5), MOSS, 0, G + 0.86, JG.LOG + 0.1);
    // the big trees, their limbs out over the trail
    for (const [u, f, s, top] of [
      [-14, 13, 1.0, 12],
      [14, 16, 1.05, 12.5],
      [-22, 26, 1.1, 13],
      [22, 30, 1.0, 13],
      [-27, 45, 1.15, 14],
      [28, 47, 1.2, 14],
      [-10, 58, 1.2, 15],
      [9, 62, 1.1, 15],
      [-34, 16, 1.0, 12],
      [34, 19, 1.0, 12]
    ])
      jungleTree(P, u, f, s, top);
    P.add(CYL(0.18, 0.28, 7, 6), 0x5a4a38, -10.5, G + 6.5, 13, 0, 0, Math.PI / 2);
    P.add(CYL(0.18, 0.28, 7.4, 6), 0x5a4a38, 10.5, G + 7.2, 16, 0, 0, Math.PI / 2);
    for (const [u, h, f, len] of [
      [-7.5, 6.5, 13, 3.4],
      [-11.5, 6.5, 13, 2.4],
      [7.4, 7.2, 16, 4.2],
      [12.4, 7.2, 16, 2.8]
    ])
      P.add(CYL(0.035, 0.035, len, 3), MOSS, u, G + h - len / 2, f - 0.1);
    vine(P, 0, 10.5, 14.5, 14, 0.22);
    vine(P, 0, 12, 28, 22, 0.15);
    vine(P, -18, 9, 20, 4, 0.5);
    // the temple: plinth, three tiers, the shrine, the stair up the middle
    P.add(BOX(34, 1.2, 14), STONE2, 0, G + 0.6, JG.T1 - 1 + 7);
    for (const [w, d, f0, h0, c] of [
      [24, 9, JG.T1, 1.2, STONE],
      [17, 7, JG.T2, 4.2, STONE2],
      [10, 5, JG.T3, 7.2, STONE]
    ]) {
      P.add(BOX(w, 3, d), c, 0, G + h0 + 1.5, f0 + d / 2);
      P.add(BOX(w + 0.2, 0.18, 0.6), MOSS, 0, G + h0 + 3.05, f0 + 0.25);
      for (const u of [-w / 2 + 2, w / 2 - 2]) P.add(BOX(1.6, 1.8, 0.1), 0x2a2a22, u, G + h0 + 1.5, f0 - 0.04);
    }
    for (const u of [-8, -5, 5, 8]) {
      P.add(BOX(1.4, 1.4, 0.1), 0x2a2a22, u, G + 2.7, JG.T1 - 0.05);
      P.add(BOX(0.6, 0.6, 0.12), STONE, u, G + 2.7, JG.T1 - 0.08);
    }
    const S = JG.SHRINE;
    P.add(BOX(6, 3.2, 4), STONE2, 0, G + 10.2 + 1.6, S + 2);
    P.add(BOX(7, 0.6, 5), STONE, 0, G + 13.7, S + 2);
    P.add(BOX(4, 1.0, 3), STONE2, 0, G + 14.5, S + 2);
    P.add(BOX(1.8, 2.4, 0.1), 0x151510, 0, G + 11.4, S - 0.04);
    for (let k = 0; k < 9; k++) {
      const h = (k + 1) * 1.0;
      P.add(BOX(3.6, h, 0.62), 0x9a967e, 0, G + 1.2 + h / 2, JG.T1 - 0.7 + k * 0.56);
    }
    // vines down its face, moss, a fig tree split through its corner
    for (const [u, h, len] of [
      [-10.5, 4.2, 3],
      [-7, 4.2, 2.2],
      [6.5, 4.2, 2.8],
      [9.8, 4.2, 2.0],
      [-6.5, 7.2, 2.6],
      [5.5, 7.2, 2.4],
      [-3.5, 10.2, 2.4],
      [2.8, 13.4, 2.6]
    ])
      P.add(CYL(0.05, 0.05, len, 3), MOSS, u, G + h - len / 2, JG.T1 + (h > 7 ? 4 : h > 4 ? 2 : 0) - 0.12);
    for (const [u, h, f] of [
      [-9, 4.3, 41.4],
      [7, 7.3, 43.4],
      [-3, 10.3, 45.4]
    ])
      P.add(BALL(1, 6), MOSS, u, G + h, f, 0, 0, 0, 1.4, 0.3, 0.8);
    P.add(CYL(0.4, 0.6, 6, 6), 0x6a5a48, 10.5, G + 4.2, 44, 0, 0, -0.35);
    P.add(BALL(3.4, 8), LEAF[1], 12, G + 8.6, 44.5, 0, 0, 0, 1.2, 0.7, 1.1);
    // the plaza: two pillars (one broken), fallen drums, the stone head
    P.add(CYL(0.6, 0.65, 6.5, 10), STONE, -6, G + 3.25, JG.PLAZA);
    P.add(BOX(1.6, 0.4, 1.6), STONE2, -6, G + 6.7, JG.PLAZA);
    P.add(CYL(0.6, 0.65, 3.6, 10), STONE, 6, G + 1.8, JG.PLAZA);
    P.add(CONE(0.62, 0.7, 10), STONE, 6, G + 3.9, JG.PLAZA, 0.3, 0, 0.2);
    P.add(CYL(0.6, 0.6, 1.3, 10), STONE, 8.8, G + 0.6, 35, 0, 0.6, Math.PI / 2);
    P.add(CYL(0.6, 0.6, 1.2, 10), STONE, 10.4, G + 0.6, 36.2, 0, 1.2, Math.PI / 2);
    P.add(BOX(2.4, 2.8, 2.2), STONE2, -11, G + 1.4, 35.5);
    P.add(BOX(2.6, 0.6, 2.4), STONE, -11, G + 3.0, 35.5);
    for (const s of [-1, 1]) P.add(BOX(0.55, 0.28, 0.1), 0x151510, -11 + s * 0.55, G + 2.05, 34.38);
    P.add(BOX(0.4, 0.6, 0.3), STONE, -11, G + 1.6, 34.3);
    P.add(BOX(1.1, 0.2, 0.1), 0x151510, -11, G + 0.95, 34.38);
    P.add(CYL(0.05, 0.05, 2.4, 3), MOSS, -10.2, G + 2.0, 34.3);
    // ruined walls either side
    for (const [u, h] of [
      [-14.5, 3.6],
      [-18.8, 2.2],
      [-23, 4.2],
      [14.5, 2.6],
      [18.8, 4.0],
      [23, 1.8]
    ]) {
      P.add(BOX(4, h, 1), STONE2, u, G + h / 2, 42);
      P.add(BOX(4.1, 0.15, 1.1), MOSS, u, G + h + 0.05, 42);
    }
    // the undergrowth: ferns, bushes, palms
    for (const [u, f, s] of [
      [-6, 6.5, 1.0],
      [5.5, 6, 0.9],
      [-9, 10.5, 1.2],
      [9, 11, 1.1],
      [-4.5, 15, 1.0],
      [4.5, 18, 1.1],
      [-10, 22, 1.3],
      [11, 24, 1.2],
      [-5, 28, 1.0],
      [6, 31, 1.1],
      [-16, 33, 1.4],
      [16, 36, 1.3],
      [-19, 8, 1.3],
      [19, 9, 1.2],
      [-3.5, 34, 0.9],
      [3.5, 34, 0.9]
    ])
      fern(P, u, f, s);
    for (const [u, f, s] of [
      [-6, 12, 1.1],
      [5, 13, 1.1],
      [-17, 15.5, 1.2],
      [17, 18.5, 1.2],
      [-12, 30, 1.4],
      [13, 33, 1.3],
      [-25, 12, 1.6],
      [25, 13, 1.5]
    ])
      P.bush(u, f, s, 0x2e5a22);
    for (const [u, f] of [
      [-17, 22],
      [18, 24],
      [-30, 34],
      [31, 36]
    ])
      P.palm(u, f, 0.9);
    P.scatter(24, 50, 85, (u, f, R) => P.bush(u, f, 1 + R() * 1.4, LEAF[Math.floor(R() * 3)]), 80, 14);
    P.scatter(26, 3, 36, (u, f, R) => Math.abs(u) > 4.5 && fern(P, u, f, 0.9 + R() * 0.8), 30, 0);
    P.scatter(
      14,
      4,
      34,
      (u, f, R) => Math.abs(u) > 5 && P.bush(u, f, 0.8 + R() * 0.6, LEAF[Math.floor(R() * 3)]),
      30,
      0
    );
  },
  slots: [],
  cover: null
};

LAYOUTS.safari_jungle = L => {
  const fixed = { fixed: true, rail: false };
  // canteens and bottles on the log
  L.row({
    ...fixed,
    kind: "bottle",
    n: 6,
    f: JG.LOG,
    u0: -4,
    u1: 4,
    base: 0.86,
    size: 0.3,
    tint: ["green", "brown"],
    bank: 3
  });
  // monkeys out along the two limbs
  L.row({
    ...fixed,
    kind: "monkey",
    n: 3,
    f: 12.75,
    u0: -12.2,
    u1: -8.8,
    base: 6.7,
    size: 0.7,
    tint: "brown",
    bank: 3
  });
  L.row({ ...fixed, kind: "monkey", n: 3, f: 15.75, u0: 8.2, u1: 12, base: 7.42, size: 0.7, tint: "brown", bank: 3 });
  // gorillas in the ferns
  L.row({ ...fixed, kind: "safari_gorilla", n: 2, f: 29.5, u0: -9, u1: 9.5, size: 1.6, tint: "safari_grey" });
  // monkeys on the pillars and the stone head
  L.row({ ...fixed, kind: "monkey", n: 1, f: JG.PLAZA - 0.2, u0: -6, u1: -6, base: 6.9, size: 0.6, tint: "white" });
  L.row({ ...fixed, kind: "monkey", n: 1, f: JG.PLAZA - 0.2, u0: 6, u1: 6, base: 4.0, size: 0.6, tint: "white" });
  L.row({ ...fixed, kind: "monkey", n: 1, f: 35.3, u0: -11, u1: -11, base: 3.3, size: 0.6, tint: "brown" });
  // the temple's pots, its gems, the golden idol in the shrine door
  for (const s of [-1, 1])
    L.row({
      ...fixed,
      kind: "olla",
      n: 3,
      f: JG.T1 + 0.4,
      u0: s * 5,
      u1: s * 10.5,
      base: 4.2,
      size: 0.55,
      tint: "orange",
      bank: 3
    });
  L.row({
    ...fixed,
    kind: "diamond",
    n: 4,
    f: JG.T2 + 0.4,
    u0: -7,
    u1: 7,
    base: 7.2,
    size: 0.5,
    tint: ["green", "red", "blue", "green"],
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "star",
    n: 1,
    f: JG.SHRINE - 0.15,
    u0: 0,
    u1: 0,
    base: 10.4,
    size: 0.8,
    tint: "gold",
    pts: 50
  });
  L.row({
    ...fixed,
    kind: "monkey",
    n: 2,
    f: JG.SHRINE + 0.2,
    u0: -2.8,
    u1: 2.8,
    base: 14.0,
    size: 0.6,
    tint: "brown"
  });
  // monkeys up in the far canopy
  L.row({ ...fixed, kind: "monkey", n: 3, f: 50, u0: -20, u1: 20, base: 9, size: 0.7, tint: "white" });
  // gorillas up out of the undergrowth (and now and then the explorer)
  const apes = [
    ["safari_gorilla", 75],
    ["safari_explorer", 18, { dont: true }],
    ["monkey", 7]
  ];
  L.pops({
    fixed: true,
    f: 11.2,
    at: [
      [-6, 0],
      [5, 0]
    ],
    size: 1.7,
    tint: "safari_grey",
    kinds: apes
  });
  L.pops({
    fixed: true,
    f: 14.4,
    at: [
      [-17, 0],
      [17, 0]
    ],
    size: 1.7,
    tint: "safari_grey",
    kinds: apes
  });
  // round the big trees' trunks
  L.pops({
    fixed: true,
    peek: true,
    f: 13.9,
    at: [[-14, 0]],
    size: 1.75,
    slide: 1.8,
    tint: "safari_grey",
    kinds: apes
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 16.9,
    at: [[14, 0]],
    size: 1.75,
    slide: 1.8,
    tint: "safari_grey",
    kinds: apes
  });
  // monkeys at the limbs' ends
  L.pops({
    fixed: true,
    f: 12.75,
    at: [[-7.2, 6.7]],
    size: 0.7,
    tint: "brown",
    period: [4, 6],
    kinds: [["monkey", 100]]
  });
  L.pops({
    fixed: true,
    f: 15.75,
    at: [[6.6, 7.42]],
    size: 0.7,
    tint: "brown",
    period: [4, 6],
    kinds: [["monkey", 100]]
  });
  // out of the temple's alcoves on the plaza
  L.pops({
    fixed: true,
    f: JG.T1 - 0.6,
    at: [
      [-3.4, 1.2],
      [3.4, 1.2]
    ],
    size: 1.7,
    tint: "safari_grey",
    period: [5, 8],
    kinds: [
      ["safari_gorilla", 85, { pts: 25 }],
      ["safari_explorer", 15, { dont: true }]
    ]
  });
};

// A flock of macaws fast across.
function macaws(R, add, t, c, size) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const f = R(12, 28);
  const h = R(5, 10);
  const v = R(12, 15) * c.S;
  const kind = R(0, 1) < 0.5 ? "safari_macaw" : "safari_macawB";
  for (let j = 0; j < size; j++)
    add(
      t + j * 0.3,
      kind,
      across(R, { v, dir, f: f + j * 0.7, h: h + Math.abs(j - size / 2) * 0.4, amp: 0.3, weave: 1 })
    );
}
const monkeySwing = (R, add, t, c) =>
  add(t, "safari_monkey", swing(R, { v: R(6, 8) * c.S, f: R(12, 26), h: G + R(6, 8.5) }));
const gorilla = (R, add, t, c) => rush(R, add, t, "safari_gorilla", c, { v: [4.5, 6], u: [6, 20], f: [20, 34] });
// Fruit thrown down out of the canopy.
const fruit = (R, add, t, c) =>
  add(
    t,
    "coconut",
    toss(R, { u: R(-10, 10), f: R(12, 18), h: G + 8, vh: R(1, 3) * c.S, vu: R(-2, 2), vf: -R(1, 2.5) })
  );

const jungleWave = (R, add, c) => {
  if (c.x2) {
    // the silverback comes down the temple steps
    add(5, "safari_silverback", charge(R, { v: 3.6 * c.S, u0: R(-3, 3), f0: 40, u1: R(-2, 2) }));
    for (let k = 0; k < 6; k++) gorilla(R, add, 1 + k * 4, c);
    for (let k = 0; k < 3; k++) macaws(R, add, 2 + k * 8, c, 3);
    for (let k = 0; k < 3; k++) monkeySwing(R, add, 4 + k * 7, c);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 4) {
    for (let j = 0; j < 2 + n(1.5); j++) monkeySwing(R, add, R(1, 22), c);
    for (let j = 0; j < 1 + n(2); j++) fruit(R, add, R(1, 24), c);
  }
  if (k === 1) for (let j = 0; j < 3; j++) macaws(R, add, 2 + j * 8 + R(0, 2), c, 3 + n(1));
  if (k === 2 || k === 3 || k === 5) for (let j = 0; j < 1 + n(1.2); j++) gorilla(R, add, R(1, 22), c);
  if (k === 2 || k === 5) for (let j = 0; j < 1 + n(1); j++) monkeySwing(R, add, R(1, 22), c);
  if (k === 3 || k === 5) macaws(R, add, R(2, 20), c, 3);
  if (k === 4 && R(0, 1) < 0.6) gorilla(R, add, R(4, 20), c);
  if (k === 1) monkeySwing(R, add, R(4, 20), c);
  if (R(0, 1) < 0.3) add(R(2, 20), "safari_explorer", cross(R, { u0: -13, u1: 13, f: 7.6, v: 1.2 }));
};

// ---- Level 4: the kopjes ---------------------------------------------------------

// The ranger post on this side, rocks in the grass, two kopjes either side
// and the big one in the middle at f 37 to 51 (its ledges, the tree with the
// branch the leopard lies on), the sun going down behind it.
const KP = { POST: [-15, 6], LEDGE: [-7, 39.5, 4.55], LEDGE2: [9, 41, 6.75], ROCKS: [-9, 3, 12] };
const GRANITE = [0xa08a7a, 0x8e7a6e, 0xb09a88];

function euphorbia(P, u, f, s = 1) {
  const c = 0x4a6a3a;
  P.add(CYL(0.2 * s, 0.26 * s, 2.6 * s, 6), 0x6a5a3a, u, G + 1.3 * s, f);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const du = Math.cos(a) * 0.6 * s;
    const df = Math.sin(a) * 0.6 * s;
    P.add(CYL(0.11 * s, 0.11 * s, 1.2 * s, 5), c, u + du / 2, G + 2.6 * s, f + df / 2, df, 0, -du);
    P.add(CYL(0.11 * s, 0.13 * s, 1.8 * s, 5), c, u + du, G + 3.4 * s, f + df);
  }
  P.add(CYL(0.13 * s, 0.13 * s, 1.6 * s, 5), c, u, G + 3.3 * s, f);
}

function rangerPost(P, u, f) {
  const H = 2.6;
  for (const x of [-1.3, 1.3])
    for (const z of [-1.0, 1.0]) P.add(BOX(0.16, H, 0.16), 0x5a4026, u + x, G + H / 2, f + z);
  P.add(BOX(3, 0.15, 2.5), 0x7a5a36, u, G + H, f);
  P.add(BOX(3, 0.1, 0.08), 0x5a4026, u, G + H + 1.0, f - 1.2);
  P.add(BOX(3, 0.6, 0.05), 0x7a5a36, u, G + H + 0.35, f - 1.22);
  for (const x of [-1.3, 1.3])
    for (const z of [-1.1, 1.1]) P.add(BOX(0.1, 2.0, 0.1), 0x5a4026, u + x, G + H + 1.0, f + z);
  P.add(CONE(2.5, 1.3, 4), 0xc8a050, u, G + H + 2.6, f, 0, Math.PI / 4, 0);
  for (const s of [-0.4, 0.4]) P.add(BOX(0.07, 3, 0.07), 0x5a4026, u + 1.9 + s, G + 1.4, f - 0.4, 0, 0, -0.3);
  for (let k = 0; k < 6; k++) P.add(BOX(0.85, 0.06, 0.06), 0x5a4026, u + 1.6 + k * 0.08, G + 0.35 + k * 0.42, f - 0.4);
}

WORLDS.safari_kopjes = {
  sky: {
    top: "#1a1238",
    mid: "#8a3a5a",
    horizon: "#ff9a3a",
    ground: "#3a2018",
    sun: [6, 2, "#ffe6a0", 34],
    clouds: 7,
    cloud: "rgba(255,110,80,0.5)",
    hills: [
      { colour: "#5a2a3a", height: 6, rough: 4, phase: 2 },
      { colour: "#3a1a24", height: 3, rough: 3 }
    ],
    seed: 107
  },
  fog: 0xa05a48,
  signs: [["RANGER POST", KP.POST[0], G + 2.95, KP.POST[1] - 1.27, 2.2, 0.45, "#3a2a1a", "#f2e2b8"]],
  build(P) {
    P.ground(0xb08a4a, [
      { u: 4, f: 15, r: 6, c: 0xc8a878, sx: 5, sz: 0.3 },
      { u: 0, f: 44, r: 12, c: 0x8a6a42, sx: 1.6, sz: 0.7 },
      { u: -18, f: 18, r: 5, c: 0x8a6a42, sx: 1.4 },
      { u: 18, f: 24, r: 5.5, c: 0x8a6a42, sx: 1.4 },
      { u: 0, f: 66, r: 26, c: 0xa07a40, sx: 2.6, sz: 0.5 }
    ]);
    rangerPost(P, ...KP.POST);
    // the flat rock with the skulls, rocks out in the grass
    P.add(BOX(6, 0.6, 1.6), GRANITE[1], 5, G + 0.3, 7.5);
    for (const s of [-1, 1]) P.add(BALL(0.8, 7), GRANITE[1], 5 + s * 3, G + 0.3, 7.5, 0, 0, 0, 0.8, 0.45, 1);
    for (const [k, u] of KP.ROCKS.entries()) P.rock(u, 10.5 + (k % 2), 1.4, GRANITE[k % 3]);
    // the left kopje, the right one
    boulder(P, -19, 1.2, 18, 3, GRANITE[0], 1.4, 0.8, 1);
    boulder(P, -18, 4.4, 18, 2, GRANITE[2], 1, 1, 1);
    boulder(P, -21, 3.5, 17.5, 1.6, GRANITE[1], 1, 1, 1);
    boulder(P, -23.5, 0.8, 20, 1.8, GRANITE[1]);
    boulder(P, 18, 1.3, 24, 3.4, GRANITE[0], 1.5, 0.8, 1.1);
    boulder(P, 16.5, 4.6, 24, 2.2, GRANITE[2], 1, 1, 1);
    boulder(P, 21, 3.6, 23.5, 1.4, GRANITE[1], 1, 1, 1);
    boulder(P, 23.5, 0.9, 26, 1.8, GRANITE[2]);
    // the big kopje: a dome, boulders piled on it, a balanced rock
    boulder(P, 2, 0, 44, 9, GRANITE[1], 1.5, 0.5, 0.8);
    boulder(P, -3, 5.5, 44, 4, GRANITE[0], 1.2, 0.9, 1);
    boulder(P, 5, 5, 43, 3.4, GRANITE[2], 1.2, 0.9, 1);
    boulder(P, 0.5, 8.8, 44.5, 2.6, GRANITE[0], 1.1, 0.85, 1);
    boulder(P, 1, 11.6, 44.5, 1.5, GRANITE[2], 1, 1, 1);
    boulder(P, -12, 1.5, 46, 3, GRANITE[2], 1.3, 0.8, 1);
    boulder(P, 15, 1.8, 47, 3.4, GRANITE[0], 1.3, 0.8, 1);
    // its ledges
    const [lu, lf, lh] = KP.LEDGE;
    boulder(P, lu, 2, lf, 2.2, GRANITE[2], 1.3, 1, 1);
    P.add(BOX(3.6, 0.5, 2.4), GRANITE[1], lu, G + lh - 0.25, lf);
    const [ru, rf, rh] = KP.LEDGE2;
    boulder(P, ru, 4, rf, 2.4, GRANITE[0], 1.2, 1, 1);
    P.add(BOX(3.6, 0.5, 2.4), GRANITE[1], ru, G + rh - 0.25, rf);
    // the boulders at its foot (baboons)
    for (const [u, h, f, r] of [
      [-2, 0.8, 37.5, 1.2],
      [3, 0.7, 37, 1.2],
      [12, 1.0, 38.5, 1.2]
    ])
      boulder(P, u, h, f, r, GRANITE[2], 1.2, 0.9, 1);
    // the tree with the leopard's branch
    P.add(CYL(0.3, 0.45, 6.5, 7), 0x5a4030, -15, G + 3.25, 35);
    P.add(CYL(0.15, 0.22, 6.5, 6), 0x5a4030, -12, G + 5.8, 35, 0, 0, Math.PI / 2);
    P.add(CYL(3, 2.6, 0.6, 10), 0x4a5a2a, -15.5, G + 7.2, 35.5);
    P.add(CYL(2.2, 1.9, 0.5, 9), 0x56662e, -11.5, G + 7.0, 35.2);
    // euphorbias, the dead tree for the vultures
    for (const [u, f, s] of [
      [-12, 41, 1.1],
      [14, 44, 1.0],
      [-23, 20, 0.9],
      [23, 26, 0.9],
      [-30, 32, 1.2],
      [30, 36, 1.1]
    ])
      euphorbia(P, u, f, s);
    P.add(CYL(0.22, 0.34, 6.2, 6), 0x5a4a3a, 22, G + 3.1, 47);
    P.add(CYL(0.08, 0.12, 2.4, 5), 0x5a4a3a, 20.9, G + 4.0, 47, 0, 0, Math.PI / 2);
    P.add(CYL(0.08, 0.12, 2.6, 5), 0x5a4a3a, 23.2, G + 5.2, 47, 0, 0, Math.PI / 2);
    // grass tufts, acacias out on the plain
    P.scatter(
      150,
      4,
      46,
      (u, f, R) => P.add(CONE(0.22, 0.9, 4), R() < 0.5 ? 0xc8a050 : 0xa88a3a, u, G + 0.45, f, 0, R() * 3, 0),
      44,
      3
    );
    // tall grass the hyenas hide in, stones along the dry riverbed
    for (const u of [-17, 19, 27])
      for (let k = 0; k < 6; k++)
        P.add(
          CONE(0.25, 1.4, 4),
          k % 2 ? 0xc8a050 : 0xb89440,
          u + (k - 2.5) * 0.4,
          G + 0.7,
          13.6 + (k % 3) * 0.3,
          0,
          k,
          0
        );
    P.scatter(26, 14, 16, (u, f, R) => P.rock(u, f, 0.25 + R() * 0.3, GRANITE[Math.floor(R() * 3)]), 30, 0);
    P.acacia(28, 11, 1.4);
    P.acacia(-30, 24, 1.6);
    for (const [u, f] of [
      [-6, 26],
      [8, 30],
      [-34, 46],
      [36, 40]
    ])
      P.add(CONE(0.9, 2.6, 6), 0x9a6a42, u, G + 1.3, f);
    for (const [u, f, s] of [
      [-26, 54, 1.5],
      [30, 58, 1.4],
      [-40, 66, 1.8],
      [42, 70, 1.6],
      [-8, 72, 1.7]
    ])
      P.acacia(u, f, s);
    P.scatter(30, 30, 85, (u, f, R) => P.bush(u, f, 0.4 + R() * 0.5, 0x6a6a32), 80, 16);
    P.scatter(16, 28, 80, (u, f, R) => P.rock(u, f, 0.8 + R() * 1.6, GRANITE[Math.floor(R() * 3)]), 80, 20);
  },
  slots: [],
  cover: null
};

LAYOUTS.safari_kopjes = L => {
  const fixed = { fixed: true, rail: false };
  const [pu, pf] = KP.POST;
  // the ranger's cans on his rail, his lantern, buffalo skulls on the flat rock
  L.row({
    ...fixed,
    kind: "can",
    n: 4,
    f: pf - 1.24,
    u0: pu - 1.1,
    u1: pu + 1.1,
    base: 3.66,
    size: 0.2,
    tint: ["steel", "red"],
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 1,
    f: pf - 1.15,
    u0: pu + 1.35,
    u1: pu + 1.35,
    base: 4.0,
    size: 0.34,
    tint: "gold"
  });
  L.row({ ...fixed, kind: "skull", n: 4, f: 7.4, u0: 3, u1: 7, base: 0.6, size: 0.34, tint: "white", bank: 4 });
  // hyenas in the grass
  L.row({ ...fixed, kind: "safari_hyena", n: 3, f: 15, u0: -6, u1: 10, size: 0.85, tint: "safari_tan", bank: 3 });
  // baboons up on the kopjes
  for (const [u, base, f] of [
    [-18, 6.3, 18],
    [-21, 5.0, 17.5],
    [-15.3, 2.4, 18],
    [16.5, 6.7, 24],
    [21, 4.9, 23.5],
    [14, 3.2, 24]
  ])
    L.row({ ...fixed, kind: "safari_baboon", n: 1, f, u0: u, u1: u, base, size: 0.7, tint: "safari_baboon" });
  L.row({
    ...fixed,
    kind: "safari_baboon",
    n: 1,
    f: 37.5,
    u0: -2,
    u1: -2,
    base: 1.8,
    size: 0.75,
    tint: "safari_baboon"
  });
  L.row({ ...fixed, kind: "safari_baboon", n: 1, f: 37, u0: 3, u1: 3, base: 1.65, size: 0.75, tint: "safari_baboon" });
  L.row({
    ...fixed,
    kind: "safari_baboon",
    n: 1,
    f: 38.5,
    u0: 12,
    u1: 12,
    base: 2.0,
    size: 0.75,
    tint: "safari_baboon"
  });
  // the leopards: on the branch, the ledges, the balanced rock
  L.row({
    ...fixed,
    kind: "safari_leopard",
    n: 1,
    f: 34.75,
    u0: -11.5,
    u1: -11.5,
    base: 6.0,
    size: 0.7,
    tint: "safari_spot",
    pts: 50
  });
  L.row({
    ...fixed,
    kind: "safari_leopard",
    n: 1,
    f: KP.LEDGE[1] - 1.0,
    u0: KP.LEDGE[0],
    u1: KP.LEDGE[0],
    base: KP.LEDGE[2],
    size: 0.7,
    tint: "safari_spot",
    pts: 50
  });
  L.row({
    ...fixed,
    kind: "safari_leopard",
    n: 1,
    f: KP.LEDGE2[1] - 1.0,
    u0: KP.LEDGE2[0],
    u1: KP.LEDGE2[0],
    base: KP.LEDGE2[2],
    size: 0.7,
    tint: "safari_spot",
    pts: 50
  });
  L.row({
    ...fixed,
    kind: "safari_leopard",
    n: 1,
    f: 44.5,
    u0: 1,
    u1: 1,
    base: 13.0,
    size: 0.6,
    tint: "safari_spot",
    pts: 50
  });
  // vultures on the dead tree
  for (const [u, base] of [
    [20.4, 4.1],
    [23.9, 5.3],
    [22, 6.15]
  ])
    L.row({ ...fixed, kind: "vulture", n: 1, f: 46.8, u0: u, u1: u, base, size: 0.75, tint: "white" });
  // impala and giraffes out on the plain
  L.row({ ...fixed, kind: "antelope", n: 4, f: 60, u0: -28, u1: -10, size: 1.0, tint: "orange", bank: 4 });
  L.row({ ...fixed, kind: "giraffe", n: 2, f: 64, u0: 20, u1: 30, size: 3.0, tint: "orange" });
  // hyenas up from behind the rocks (the ranger, now and then: don't)
  L.pops({
    fixed: true,
    f: 9.2,
    at: KP.ROCKS.map(u => [u, 0]),
    size: 0.95,
    tint: "safari_tan",
    kinds: [
      ["safari_hyena", 70],
      ["safari_baboon", 15],
      ["ranger", 15, { dont: true }]
    ]
  });
  // hyenas up out of the long grass by the riverbed
  L.pops({
    fixed: true,
    f: 13,
    at: [
      [-17, 0],
      [19, 0],
      [27, 0]
    ],
    size: 0.95,
    tint: "safari_tan",
    kinds: [
      ["safari_hyena", 80],
      ["safari_baboon", 20]
    ]
  });
  // on the post: the ranger, or a baboon after his food
  L.pops({
    fixed: true,
    f: pf + 0.2,
    at: [[pu, 2.68]],
    size: 1.75,
    tint: "safari_tan",
    kinds: [
      ["ranger", 60, { dont: true }],
      ["safari_baboon", 40]
    ]
  });
  // baboons from behind the kopjes' boulders, now and then a leopard
  L.pops({
    fixed: true,
    f: 20.5,
    at: [[-23.5, 1.6]],
    size: 0.8,
    tint: "safari_tan",
    kinds: [
      ["safari_baboon", 80],
      ["safari_leopard", 20, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 26.5,
    at: [[23.5, 1.8]],
    size: 0.8,
    tint: "safari_tan",
    kinds: [
      ["safari_baboon", 80],
      ["safari_leopard", 20, { pts: 50 }]
    ]
  });
  // leopards at the top of the big kopje
  L.pops({
    fixed: true,
    f: 43.5,
    at: [
      [-3, 8.9],
      [6, 8.0]
    ],
    size: 0.7,
    tint: "safari_spot",
    period: [6, 9],
    kinds: [
      ["safari_leopard", 70, { pts: 50 }],
      ["safari_baboon", 30, { pts: 25 }]
    ]
  });
};

// A pack of hyenas across, one behind another.
function pack(R, add, t, c, size) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const f = R(12, 30);
  const v = R(10, 12.5) * c.S;
  for (let j = 0; j < size; j++) add(t + j * R(0.4, 0.7), "safari_hyena", herd(R, { dir, f: f + R(-1.5, 1.5), v }));
}
const hyenaRush = (R, add, t, c) => rush(R, add, t, "safari_hyena", c, { v: [8, 10], u: [10, 26], f: [30, 46] });

const kopjeWave = (R, add, c) => {
  if (c.x2) {
    // the clan attacks
    for (let k = 0; k < 8; k++) hyenaRush(R, add, 1 + k * 3, c);
    for (let k = 0; k < 2; k++) add(5 + k * 10, "safari_leopard", herd(R, { f: R(30, 42), v: R(13, 16) * c.S }));
    pack(R, add, 12, c, 3);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 3) pack(R, add, R(1, 8), c, 2 + n(1.5));
  if (k === 3 || k === 5) pack(R, add, R(12, 20), c, 2 + n(1));
  if (k === 1 || k === 4) {
    for (let j = 0; j < 1 + n(1.4); j++) add(R(1, 22), "safari_baboon", herd(R, { f: R(9, 24), v: R(7, 9) * c.S }));
    flyers(["lovebird", "vulture"], R, add, c, 3 + n(2));
  }
  if (k === 2 || k === 4 || k === 5) for (let j = 0; j < 1 + n(1); j++) hyenaRush(R, add, R(1, 22), c);
  if (k === 2 || (k === 5 && R(0, 1) < 0.5))
    add(R(3, 20), "safari_leopard", herd(R, { f: R(30, 42), v: R(13, 16) * c.S }));
  if (k === 0) flyers(["lovebird", "vulture"], R, add, c, 2);
  if (R(0, 1) < 0.25) add(R(2, 20), "safari_ranger", cross(R, { u0: -10, u1: 12, f: 8.4, v: 1.2 }));
};

// ---- Level 5: the great stampede ----------------------------------------------------

// The expedition's last camp inside a thorn boma (its fence at f 8), the herd
// pouring over the plain, a baobab, a rocky outcrop and the long rise at f 48
// they come over; the dust storm behind.
const ST = { BOMA: 8.3, JEEP: [-13, 4.2], TENT: [8, 4.6], BAOBAB: [15, 28], ROCK: [-20, 22], RIDGE: 48 };
const bomaF = u => ST.BOMA + 0.012 * u * u;

WORLDS.safari_stampede = {
  sky: {
    top: "#4a2e22",
    mid: "#a8683e",
    horizon: "#e8b070",
    ground: "#5a3a22",
    sun: [-20, 22, "#fff4d8", 9],
    clouds: 14,
    cloud: "rgba(150,95,60,0.55)",
    hills: [
      { colour: "#b07a4a", height: 12, rough: 7, phase: 0.4 },
      { colour: "#8a5a36", height: 6, rough: 5 }
    ],
    seed: 108
  },
  fog: 0xb88a58,
  signs: [["MBALI EXPEDITION", 0, G + 2.45, ST.BOMA - 0.12, 3.0, 0.5, "#3a2414", "#f2e2b8"]],
  build(P) {
    P.ground(0xa07a48, [
      { u: 0, f: 3.5, r: 7, c: 0x7a5a38, sx: 2.3, sz: 0.6 },
      { u: 0, f: 26, r: 18, c: 0x8a6a40, sx: 3.2, sz: 0.4 },
      { u: 0, f: 40, r: 14, c: 0x96744a, sx: 3.6, sz: 0.3 },
      { u: 0, f: 62, r: 22, c: 0xb08a58, sx: 3, sz: 0.5 }
    ]);
    // the boma: a thorn fence, a gate with a board over it
    for (let u = -17; u <= 17.1; u += 1.25) {
      if (Math.abs(u) < 1.6) continue;
      const f = bomaF(u);
      P.add(BALL(0.5, 5), Math.round(u) % 2 ? 0x4a4228 : 0x5a5030, u, G + 0.22, f, 0, u, 0, 1.5, 0.6, 1.1);
      for (const [du, a, len] of [
        [-0.3, 0.7, 1.5],
        [0.3, -0.6, 1.4],
        [0, 0.15, 1.1]
      ])
        P.add(BOX(0.05, len, 0.05), 0x6a5a40, u + du, G + 0.4, f - 0.15, 0.2 * a, 0, a);
    }
    for (const s of [-1, 1]) P.add(BOX(0.2, 2.4, 0.2), 0x4a3020, s * 1.85, G + 1.2, ST.BOMA);
    P.add(BOX(4, 0.14, 0.14), 0x4a3020, 0, G + 2.2, ST.BOMA + 0.05);
    // the camp: the Land Rover, the tent, crates, water barrels, the flag
    jeep(P, ...ST.JEEP, 0x7a7a52);
    tent(P, ...ST.TENT, 0x7a7a50);
    for (const u of [-3.1, -2.0, -0.9]) P.add(BOX(1.0, 0.9, 0.9), 0x9a7448, u, G + 0.45, 3.6);
    P.add(BOX(0.8, 0.6, 0.8), 0x8a6a40, -2.0, G + 1.2, 3.9);
    for (const u of [2.6, 3.5]) {
      P.add(CYL(0.36, 0.33, 0.95, 10), 0x3a5a7a, u, G + 0.475, 3.2);
      P.add(CYL(0.37, 0.37, 0.05, 10), 0x2a2a2a, u, G + 0.8, 3.2);
    }
    P.add(CYL(0.04, 0.05, 5.5, 5), 0x8a8a8a, 12, G + 2.75, 3);
    P.add(BOX(1.3, 0.75, 0.03), 0xe86a1a, 11.32, G + 5.0, 3, 0, 0, 0.08);
    campfire(P, 4.5, 6);
    // the baobab, the rocky outcrop, the long rise
    const [bu, bf] = ST.BAOBAB;
    baobab(P, bu, bf, 1.0);
    P.add(CYL(0.16, 0.25, 3.6, 6), 0x8a7a6a, bu - 2.2, G + 5.0, bf, 0, 0, Math.PI / 2);
    P.add(CYL(0.16, 0.25, 3.6, 6), 0x8a7a6a, bu + 2.2, G + 5.8, bf, 0, 0, Math.PI / 2);
    baobab(P, -30, 55, 1.2);
    const [ru, rf] = ST.ROCK;
    boulder(P, ru, 1.4, rf, 2.2, GRANITE[0], 1.4, 0.8, 1);
    boulder(P, ru - 2.8, 0.9, rf + 1, 1.6, GRANITE[1]);
    boulder(P, ru + 2.4, 0.7, rf + 0.6, 1.3, GRANITE[2]);
    P.add(SLAB(110, 1.6, 8), 0x9a7448, 0, G + 0.8, ST.RIDGE + 4);
    P.add(SLAB(110, 0.8, 4), 0x8a6a40, 0, G + 0.4, ST.RIDGE - 1);
    // dust rolling in behind
    for (const [u, f, s] of [
      [-34, 80, 1],
      [8, 86, 1.3],
      [40, 78, 0.9]
    ])
      P.add(BALL(14 * s, 10), 0xc09a68, u, G + 2, f, 0, 0, 0, 2.2, 0.55, 0.6);
    // bent acacias, termite mounds, scrub
    for (const [u, f, s] of [
      [-12, 36, 1.3],
      [30, 40, 1.5],
      [-38, 44, 1.6],
      [20, 62, 1.8],
      [-6, 66, 1.7]
    ])
      P.acacia(u, f, s);
    for (const [u, f] of [
      [-8, 30],
      [24, 22],
      [-28, 30],
      [6, 42]
    ])
      P.add(CONE(1, 3, 6), 0x9a6a42, u, G + 1.5, f);
    P.scatter(50, 12, 46, (u, f, R) => P.add(CONE(0.18, 0.6, 4), 0xb89050, u, G + 0.3, f, 0, R() * 3, 0), 45, 0);
    P.scatter(30, 20, 90, (u, f, R) => P.bush(u, f, 0.4 + R() * 0.6, 0x7a7040), 80, 10);
  },
  slots: [],
  cover: null
};

LAYOUTS.safari_stampede = L => {
  const fixed = { fixed: true, rail: false };
  // the camp: bottles on the crates, cans on the roof rack, lanterns on the gate
  L.row({
    ...fixed,
    kind: "bottle",
    n: 5,
    f: 3.45,
    u0: -3.4,
    u1: -0.6,
    base: 0.9,
    size: 0.3,
    tint: ["green", "brown"],
    bank: 5
  });
  L.row({
    ...fixed,
    kind: "can",
    n: 4,
    f: ST.JEEP[1] - 0.75,
    u0: ST.JEEP[0] - 1.4,
    u1: ST.JEEP[0] + 0.4,
    base: 2.44,
    size: 0.22,
    tint: ["steel", "red"],
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 2,
    f: ST.BOMA - 0.18,
    u0: -1.85,
    u1: 1.85,
    base: 1.6,
    size: 0.36,
    tint: "gold"
  });
  // wildebeest just outside the boma, zebras, more wildebeest, rhinos
  L.row({
    ...fixed,
    kind: "safari_gnu",
    n: 6,
    f: 16.5,
    u0: -20,
    u1: 20,
    size: 0.9,
    tint: ["safari_gnu", "safari_gnu2"],
    bank: 3
  });
  L.row({ ...fixed, kind: "zebra", n: 4, f: 25, u0: -22, u1: 5, size: 1.2, tint: "white", bank: 4 });
  L.row({
    ...fixed,
    kind: "safari_gnu",
    n: 6,
    f: 33,
    u0: -26,
    u1: 26,
    size: 1.0,
    tint: ["safari_gnu", "safari_gnu2"],
    bank: 3
  });
  L.row({ ...fixed, kind: "rhino", n: 2, f: 39, u0: -14, u1: 16, size: 1.3, tint: "steel" });
  // vultures on the baobab, waiting
  L.row({
    ...fixed,
    kind: "vulture",
    n: 1,
    f: ST.BAOBAB[1] - 0.3,
    u0: ST.BAOBAB[0] - 3,
    u1: ST.BAOBAB[0] - 3,
    base: 5.22,
    size: 0.7,
    tint: "white"
  });
  L.row({
    ...fixed,
    kind: "vulture",
    n: 1,
    f: ST.BAOBAB[1] - 0.3,
    u0: ST.BAOBAB[0] + 3,
    u1: ST.BAOBAB[0] + 3,
    base: 6.02,
    size: 0.7,
    tint: "white"
  });
  // the herd coming over the rise, elephants beyond
  L.row({
    ...fixed,
    kind: "safari_gnu",
    n: 8,
    f: ST.RIDGE + 1,
    u0: -30,
    u1: 30,
    base: 1.6,
    size: 0.9,
    tint: ["safari_gnu", "safari_gnu2"],
    bank: 4
  });
  L.row({ ...fixed, kind: "elephant", n: 2, f: 60, u0: -14, u1: 18, size: 2.4, tint: "steel" });
  // lionesses up out of the grass
  L.pops({
    fixed: true,
    f: 20,
    at: [
      [-8, 0],
      [3, 0],
      [9, 0]
    ],
    size: 1.0,
    tint: "orange",
    kinds: [
      ["lion", 75],
      ["safari_gnu", 25]
    ]
  });
  // the golden lion, now and then, on the outcrop
  L.pops({
    fixed: true,
    f: ST.ROCK[1],
    at: [[ST.ROCK[0], 3.05]],
    size: 1.0,
    tint: "gold",
    period: [10, 14],
    busy: 0.35,
    kinds: [["lion", 100, { pts: 250 }]]
  });
  // out of the tent: the guide, the explorer, the ranger (don't), or a lion
  L.pops({
    fixed: true,
    f: ST.TENT[1] - 1.9,
    at: [[ST.TENT[0], 0]],
    size: 1.75,
    tint: "orange",
    kinds: [
      ["safari_guide", 25, { dont: true }],
      ["safari_explorer", 25, { dont: true }],
      ["ranger", 20, { dont: true }],
      ["lion", 30]
    ]
  });
  // zebras and wildebeest up out of the long grass
  L.pops({
    fixed: true,
    f: 30,
    at: [
      [-18, 0],
      [20, 0],
      [-28, 0]
    ],
    size: 1.1,
    tint: "white",
    kinds: [
      ["zebra", 55],
      ["safari_gnu", 45]
    ]
  });
  // more of the herd up over the rise
  L.pops({
    fixed: true,
    f: ST.RIDGE + 1.2,
    at: [
      [-12, 1.6],
      [14, 1.6]
    ],
    size: 1.0,
    tint: "steel",
    kinds: [
      ["safari_gnu", 70],
      ["rhino", 30]
    ]
  });
};

// A stream of the herd across, one way, in a band of distance.
function stream(R, add, t, c, n) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const f = R(14, 36);
  const v = R(10, 13) * c.S;
  for (let j = 0; j < n; j++) {
    const r = R(0, 1);
    const kind = r < 0.2 ? "zebra" : r < 0.6 ? "safari_gnu" : "safari_gnuB";
    add(t + j * R(0.35, 0.7), kind, herd(R, { dir, f: f + R(-3, 3), v: v * R(0.95, 1.05) }));
  }
}
const rhino = (R, add, t, c) => rush(R, add, t, "safari_rhino", c, { v: [8, 10], u: [10, 26], f: [45, 60] });
const elephant = (R, add, t, c) => rush(R, add, t, "safari_elephant", c, { v: [6, 7.5], u: [10, 24], f: [55, 66] });

const stampedeWave = (R, add, c) => {
  if (c.x2) {
    // the stampede proper, and the golden lion runs with it
    for (let k = 0; k < 5; k++) stream(R, add, 1 + k * 4.5, c, 6 + (k % 2));
    add(10, "safari_goldLion", herd(R, { f: R(14, 22), v: 12 * c.S }));
    for (let k = 0; k < 2; k++) elephant(R, add, 4 + k * 12, c);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 3) stream(R, add, R(1, 6), c, 3 + n(2));
  if (k === 3 || k === 4) stream(R, add, R(12, 18), c, 1 + n(1.5));
  if (k === 1 || k === 5) for (let j = 0; j < 1 + n(1); j++) rhino(R, add, R(1, 20), c);
  if (k === 1) stream(R, add, R(8, 16), c, 2 + n(1));
  if (k === 2) {
    elephant(R, add, R(2, 10), c);
    for (let j = 0; j < 1 + n(1); j++) add(R(1, 20), "zebra", herd(R, { f: R(16, 36), v: R(11, 14) * c.S }));
  }
  if (k === 5) {
    stream(R, add, R(1, 10), c, 2 + n(2));
    if (R(0, 1) < 0.5) elephant(R, add, R(8, 16), c);
  }
  if (k === 2 || k === 4) flyers(["lovebird", "vulture"], R, add, c, 2 + n(1));
};

// ---- Ambience ---------------------------------------------------------------------

// Water lapping, frogs, a hippo grunting off across the water.
AMBIENCE.safari_water = (d, sr, R) => {
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const x = R() * 2 - 1;
    lp += 0.01 * (x - lp);
    lp2 += 0.08 * (x - lp2);
    let v = (lp2 - lp) * (0.4 + 0.6 * Math.sin(t * 1.7) ** 2) * 0.8 + lp * 0.8;
    const cr = (t * 1.1) % 1;
    if (cr < 0.1) v += Math.sign(Math.sin(2 * Math.PI * 180 * t)) * 0.04 * Math.sin((Math.PI * cr) / 0.1);
    const y = t % 8;
    if (y > 3 && y < 4.2)
      v +=
        Math.sin(2 * Math.PI * 70 * t) *
        Math.abs(Math.sin(2 * Math.PI * 3 * y)) *
        0.12 *
        Math.sin((Math.PI * (y - 3)) / 1.2);
    d[i] += v;
  }
};
// Insects, birds whistling, monkeys hooting somewhere up there.
AMBIENCE.safari_jungle = (d, sr, R) => {
  let lp = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    lp += 0.015 * (R() * 2 - 1 - lp);
    let v = lp * 0.6 + Math.sin(2 * Math.PI * 5600 * t) * (0.5 + 0.5 * Math.sin(t * 30)) * 0.015;
    const b = t % 2.7;
    if (b < 0.35)
      v += Math.sin(2 * Math.PI * (2200 + 1400 * Math.sin(b * 18)) * t) * 0.05 * Math.sin((Math.PI * b) / 0.35);
    const y = t % 8;
    if (y > 5 && y < 6.6) {
      const h = (y - 5) % 0.4;
      v += Math.sin(2 * Math.PI * (380 + 300 * (y - 5)) * t) * 0.06 * Math.sin((Math.PI * h) / 0.4);
    }
    d[i] += v;
  }
};
// Wind over the rocks, crickets, a hyena whooping far off.
AMBIENCE.safari_kopje = (d, sr, R) => {
  let lp = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    lp += 0.02 * (R() * 2 - 1 - lp);
    let v = lp * (1.4 + 0.6 * Math.sin((t * 2 * Math.PI) / 8));
    v += Math.sin(2 * Math.PI * 4400 * t) * Math.max(0, Math.sin(t * 2 * Math.PI * 3)) ** 4 * 0.02;
    const y = t % 8;
    if (y > 2 && y < 3.4) {
      const e = (y - 2) / 1.4;
      v += Math.sin(2 * Math.PI * (300 + 700 * e) * t) * 0.05 * Math.sin(e * Math.PI);
    }
    d[i] += v;
  }
};
// The storm blowing, and under it the herd's hooves.
AMBIENCE.safari_dust = (d, sr, R) => {
  let lp = 0;
  let lo = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const x = R() * 2 - 1;
    lp += 0.03 * (x - lp);
    lo += 0.003 * (x - lo);
    const gust = 0.7 + 0.3 * Math.sin((t * 2 * Math.PI) / 4) + 0.2 * Math.sin(t * 2.3);
    d[i] += lp * 2.2 * gust + lo * 6 * (0.6 + 0.4 * Math.abs(Math.sin(t * 2 * Math.PI * 2.5)));
  }
};

// ---- The campaign ------------------------------------------------------------------

export const SAFARI = {
  name: "SAFARI NIGHT",
  first: "Our expedition sets out. The pride is out tonight",
  kinds,
  levels: [
    {
      world: "safari_water",
      name: "THE WATERHOLE",
      story: "Dusk at the waterhole. Mind the crocodiles",
      music: "safari",
      amb: "safari_water",
      legend: "CROCS & HIPPOS: GET THEM BEFORE THEY REACH YOU  ·  DON'T SHOOT THE GUIDE",
      wave: waterWave,
      title: (w, x2) => (x2 ? "THE CROCODILES RISE · DOUBLE POINTS" : null)
    },
    {
      world: "safari_jungle",
      name: "THE JUNGLE",
      story: "Into the rainforest, to the lost temple",
      music: "",
      amb: "safari_jungle",
      legend: "GOLDEN IDOL 50  ·  SILVERBACK 150  ·  DON'T SHOOT THE EXPLORER",
      wave: jungleWave,
      title: (w, x2) => (x2 ? "THE SILVERBACK · DOUBLE POINTS" : null)
    },
    {
      world: "safari_kopjes",
      name: "THE KOPJES",
      story: "Sunset on the rocks. The leopards are hunting",
      music: "",
      amb: "safari_kopje",
      legend: "LEOPARDS 50  ·  LEOPARD RUNNING 100  ·  DON'T SHOOT THE RANGER",
      wave: kopjeWave,
      title: (w, x2) => (x2 ? "THE CLAN ATTACKS · DOUBLE POINTS" : null)
    },
    {
      world: "safari_stampede",
      name: "THE GREAT STAMPEDE",
      story: "A dust storm, and the herd is coming. Hold the boma",
      music: "safari",
      amb: "safari_dust",
      legend: "GOLDEN LION 250 · RUNNING 300  ·  RHINOS & ELEPHANTS: STOP THEM BEFORE THEY REACH YOU",
      wave: stampedeWave,
      title: (w, x2) => (x2 ? "THE GREAT STAMPEDE · DOUBLE POINTS" : null)
    }
  ],
  done: ["THE GOLDEN LION IS YOURS", "THE EXPEDITION MAKES IT HOME"]
};
