import * as THREE from "three";
import {
  GROUND,
  BOX,
  CYL,
  BALL,
  CAP,
  CONE,
  TORUS,
  SLAB,
  GEO,
  WORLDS,
  CARDS,
  CARD_SIZE,
  AMBIENCE,
  part,
  merge,
  person
} from "./shoots-art";
import { LAYOUTS, PERSON, SHATTER, PLATE_SOUND, PAINT } from "./plates";
import { SHAPES } from "./plates-shapes";
import {
  gunman,
  runner,
  thing,
  DONT,
  across,
  dart,
  toss,
  float,
  walk,
  cross,
  charge,
  pick,
  flyers
} from "./shoot-paths";

// The Carnival Night campaign (Jay, 2026-10-24: "take them through the fair
// at night - start in the midway (done), then the big top with circus acts,
// then ghost train dark ride, then the ferris wheel and coaster at night,
// then grand finale with fireworks and the ringmaster"). Five levels, one
// night at the fair, later and wilder each time:
//   1 THE MIDWAY               (the carnival world, shoots.js SCREEN.carnival)
//   2 THE BIG TOP              inside the circus tent: the ring, the stands,
//                              the trapeze rigs, the lions on their drums;
//                              clowns up out of barrels, the human cannonball,
//                              juggling pins thrown up; the acrobats: don't
//   3 THE GHOST TRAIN          the dark ride: a graveyard at midnight and the
//                              haunted house front; ghosts in the windows,
//                              skeletons out of the coffins and the graves,
//                              bats, pumpkins; a lost kid: don't
//   4 FERRIS WHEEL AND COASTER the lit rides late at night: gondolas going
//                              round on the wheel, coaster trains on the
//                              track, the prize stall, balloons
//   5 THE GRAND FINALE         midnight fireworks over the lake: shoot the
//                              shells before they burst, the giant balloons,
//                              and the Ringmaster himself on the stage
// Everything below is laid out as the other worlds are (u right, f downrange,
// h up from the roof deck, the ground at GROUND); shoots-art moves it all
// SHIFT m back and onto the lifted land.

const G = GROUND;
const TAU = Math.PI * 2;
const WAVE = 30; // s (shoots.js WAVE)

// ---- New outlines (the plates' atlas) ------------------------------------------

Object.assign(SHAPES, {
  // a sheet ghost, arms out, a wavy hem
  carnival_ghost: {
    polys: [
      [
        0, 100, 9, 88, 18, 100, 28, 88, 38, 100, 48, 88, 58, 100, 68, 88, 78, 100, 76, 62, 92, 50, 78, 42, 76, 28, 68,
        10, 52, 0, 30, 0, 14, 8, 6, 24, 4, 40, -12, 50, 4, 60, 2, 80
      ]
    ],
    dots: [
      [28, 32, 6],
      [50, 32, 6],
      [39, 54, 8]
    ]
  },
  // a bat, wings spread
  carnival_bat: {
    polys: [
      [
        60, 10, 66, 2, 70, 14, 80, 12, 94, 6, 108, 10, 120, 22, 110, 26, 104, 36, 94, 32, 86, 42, 76, 36, 68, 48, 60,
        58, 52, 48, 44, 36, 34, 42, 26, 32, 16, 36, 10, 26, 0, 22, 12, 10, 26, 6, 40, 12, 50, 14, 54, 2
      ]
    ],
    dots: [
      [55, 21, 2.6],
      [65, 21, 2.6]
    ]
  },
  // a jack-o'-lantern
  carnival_pumpkin: {
    polys: [
      [
        50, 8, 62, 6, 78, 10, 92, 22, 98, 40, 96, 60, 86, 76, 70, 84, 50, 86, 30, 84, 14, 76, 4, 60, 2, 40, 8, 22, 22,
        10, 38, 6
      ],
      [45, 10, 55, 10, 58, -2, 47, -4]
    ],
    marks: [
      [2.5, 30, 14, 26, 48, 32, 80],
      [2.5, 70, 14, 74, 48, 68, 80],
      [7, 26, 42, 42, 42, 34, 30, 26, 42],
      [7, 58, 42, 74, 42, 66, 30, 58, 42],
      [6, 46, 54, 54, 54, 50, 48, 46, 54],
      [6, 22, 62, 31, 71, 40, 64, 50, 72, 60, 64, 69, 71, 78, 62]
    ]
  },
  // a balloon on its string
  carnival_balloon: {
    polys: [
      [
        40, 0, 58, 6, 70, 20, 74, 38, 68, 58, 54, 74, 44, 80, 48, 87, 32, 87, 36, 80, 26, 74, 12, 58, 6, 38, 10, 20, 22,
        6
      ]
    ],
    lines: [[3, 40, 87, 45, 100, 36, 113, 42, 126]],
    marks: [[4, 20, 26, 24, 16, 32, 10]]
  },
  // a firework rocket on its stick
  carnival_rocket: {
    polys: [[20, 0, 31, 16, 31, 70, 41, 86, 31, 82, 27, 90, 13, 90, 9, 82, -1, 86, 9, 70, 9, 16]],
    lines: [[4, 20, 90, 20, 132]],
    marks: [
      [4, 9, 30, 31, 30],
      [4, 9, 58, 31, 58]
    ],
    dots: [[20, 44, 4.5]]
  }
});
for (const k of ["carnival_pumpkin", "carnival_balloon"]) SHATTER.add(k);
PLATE_SOUND.carnival_pumpkin = "splat";
PLATE_SOUND.carnival_balloon = "pop";
PLATE_SOUND.carnival_ghost = "thunk";
PLATE_SOUND.carnival_bat = "squeak";
PLATE_SOUND.carnival_rocket = "clank";
// (plate tints: a dusky violet for the bats, a pale green-white for the ghosts,
// a brown for the circus bears)
PAINT.carnival_bat = 0xa894d0;
PAINT.carnival_ghost = 0xe4fff0;
PAINT.carnival_bear = 0xa06a3e;

// ---- New cut-outs ------------------------------------------------------------------

function blob(c, x, y, rx, ry, fill, line = 5) {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fill();
  if (line) {
    c.lineWidth = line;
    c.strokeStyle = "#111";
    c.stroke();
  }
}

Object.assign(CARDS, {
  carnival_clown: (c, W, H) => {
    const u = W / 10;
    const cx = W / 2;
    person(c, W, H, { body: "#f2c230", legs: "#2f6fe8", arms: "#3ab54a", skin: "#fbf6ee", face: "white" });
    // spots on the suit, big shoes, a ruff, tufts of hair, the nose, a pointed hat
    for (const [x, y] of [
      [-1.7, 0.37],
      [1.5, 0.41],
      [-0.3, 0.5],
      [1.9, 0.57],
      [-1.9, 0.6]
    ])
      blob(c, cx + x * u, H * y, 0.5 * u, 0.5 * u, "#e8344a", 0);
    for (const s of [-1, 1]) blob(c, cx + s * 2.1 * u, H * 0.966, 1.7 * u, 0.75 * u, "#e8344a");
    blob(c, cx, H * 0.292, 3.3 * u, 0.9 * u, "#fbfbf4");
    for (const s of [-1, 1]) blob(c, cx + s * 2.0 * u, H * 0.15, 1.0 * u, 1.0 * u, "#ff7a1a");
    blob(c, cx, H * 0.186, 0.6 * u, 0.6 * u, "#e8344a", 3);
    c.fillStyle = "#3ab54a";
    c.beginPath();
    c.moveTo(cx - 1.5 * u, H * 0.09);
    c.lineTo(cx + 1.5 * u, H * 0.09);
    c.lineTo(cx + 0.4 * u, H * 0.012);
    c.closePath();
    c.fill();
    c.lineWidth = 5;
    c.stroke();
    blob(c, cx + 0.4 * u, H * 0.016, 0.5 * u, 0.5 * u, "#fbfbf4", 3);
  },
  carnival_acrobat: (c, W, H) => {
    const u = W / 10;
    const cx = W / 2;
    person(c, W, H, {
      body: "#c8102e",
      legs: "#f4b8c8",
      arms: "#f0c9a0",
      hair: "#2a1a10",
      armsUp: true,
      lips: "#c0182a"
    });
    // a sequinned leotard: a gold sash and sparkles; her hair in a bun
    c.fillStyle = "#c8102e";
    c.fillRect(cx - 2.6 * u, H * 0.6, 5.2 * u, H * 0.07);
    c.strokeStyle = "#f2c230";
    c.lineWidth = 0.55 * u;
    c.beginPath();
    c.moveTo(cx - 2.8 * u, H * 0.32);
    c.lineTo(cx + 2.4 * u, H * 0.62);
    c.stroke();
    for (const [x, y] of [
      [1.6, 0.36],
      [-1.4, 0.5],
      [0.9, 0.55],
      [-2, 0.4]
    ])
      blob(c, cx + x * u, H * y, 0.3 * u, 0.3 * u, "#fff4b0", 0);
    blob(c, cx, H * 0.062, 0.9 * u, 0.8 * u, "#2a1a10", 3);
  },
  carnival_ringmaster: (c, W, H) => {
    const u = W / 10;
    const cx = W / 2;
    person(c, W, H, {
      body: "#f2c230",
      vest: "#b0101e",
      shirt: "#f8f4ea",
      tie: "#111",
      legs: "#f4efe2",
      arms: "#b0101e",
      hat: "#151515",
      topHat: true,
      hair: "#2a1a10",
      tache: true
    });
    // riding boots, gold epaulettes and buttons, a red hat band, a cane
    c.fillStyle = "#151515";
    c.fillRect(cx - 2.25 * u, H * 0.83, 1.9 * u, H * 0.15);
    c.fillRect(cx + 0.35 * u, H * 0.83, 1.9 * u, H * 0.15);
    for (const s of [-1, 1]) blob(c, cx + s * 2.9 * u, H * 0.305, 1.0 * u, 0.4 * u, "#f2c230", 3);
    for (const y of [0.42, 0.49, 0.56]) blob(c, cx, H * y, 0.3 * u, 0.3 * u, "#7a1010", 0);
    c.fillStyle = "#c0182a";
    c.fillRect(cx - 1.5 * u, H * 0.058, 3 * u, H * 0.018);
    c.strokeStyle = "#111";
    c.lineWidth = 0.4 * u;
    c.beginPath();
    c.moveTo(cx + 3.6 * u, H * 0.6);
    c.lineTo(cx + 4.3 * u, H * 0.97);
    c.stroke();
    blob(c, cx + 3.6 * u, H * 0.595, 0.45 * u, 0.45 * u, "#f2c230", 3);
  },
  carnival_kid: (c, W, H) => {
    const u = W / 10;
    const cx = W / 2;
    person(c, W, H, { body: "#3ab54a", legs: "#2f4a8a", hair: "#7a4a2a", hat: "#e8344a", armsUp: true });
    // a striped T-shirt
    c.fillStyle = "#f4f1ea";
    for (const y of [0.38, 0.46, 0.54]) c.fillRect(cx - 2.75 * u, H * y, 5.5 * u, H * 0.03);
  },
  carnival_skeleton: (c, W, H) => {
    const u = W / 10;
    const cx = W / 2;
    const X = x => cx + x * u;
    // bones: [width, points...] (x in tenths of the card's width from the
    // middle, y as a part of its height), drawn black and then bone white
    const bones = [
      [0.7, [0, 0.25], [0, 0.6]],
      [0.6, [-2.6, 0.3], [2.6, 0.3]],
      [0.45, [-2.3, 0.37], [0, 0.35], [2.3, 0.37]],
      [0.45, [-2.1, 0.43], [0, 0.41], [2.1, 0.43]],
      [0.45, [-1.8, 0.49], [0, 0.47], [1.8, 0.49]],
      [0.6, [-1.7, 0.63], [0, 0.585], [1.7, 0.63]],
      [0.6, [-2.6, 0.3], [-3.6, 0.2], [-4.1, 0.06]],
      [0.6, [2.6, 0.3], [3.6, 0.2], [4.1, 0.06]],
      [0.65, [-1.3, 0.63], [-1.5, 0.8], [-1.6, 0.955]],
      [0.65, [1.3, 0.63], [1.5, 0.8], [1.6, 0.955]],
      [0.6, [-1.5, 0.965], [-2.6, 0.975]],
      [0.6, [1.5, 0.965], [2.6, 0.975]]
    ];
    c.lineCap = "round";
    c.lineJoin = "round";
    for (const [col, extra] of [
      ["#111", 0.55],
      ["#f2eedd", 0]
    ]) {
      c.strokeStyle = col;
      for (const [w, ...pts] of bones) {
        c.lineWidth = (w + extra) * u;
        c.beginPath();
        pts.forEach(([x, y], k) => (k ? c.lineTo(X(x), H * y) : c.moveTo(X(x), H * y)));
        c.stroke();
      }
    }
    // the skull: jaw, sockets, nose, teeth
    c.fillStyle = "#f2eedd";
    c.strokeStyle = "#111";
    c.lineWidth = 0.4 * u;
    c.fillRect(cx - 1.2 * u, H * 0.19, 2.4 * u, H * 0.07);
    c.strokeRect(cx - 1.2 * u, H * 0.19, 2.4 * u, H * 0.07);
    blob(c, cx, H * 0.15, 1.9 * u, 1.9 * u, "#f2eedd", 0.4 * u);
    for (const s of [-1, 1]) blob(c, cx + s * 0.75 * u, H * 0.145, 0.62 * u, 0.62 * u, "#111", 0);
    blob(c, cx, H * 0.19, 0.25 * u, 0.3 * u, "#111", 0);
    c.lineWidth = 0.18 * u;
    c.beginPath();
    for (const x of [-0.6, 0, 0.6]) {
      c.moveTo(X(x), H * 0.21);
      c.lineTo(X(x), H * 0.25);
    }
    c.stroke();
  }
});
Object.assign(CARD_SIZE, {
  carnival_clown: [0.9, 1.8],
  carnival_acrobat: [0.9, 1.8],
  carnival_ringmaster: [0.9, 1.8],
  carnival_kid: [0.7, 1.2],
  carnival_skeleton: [0.9, 1.8]
});
for (const k of ["carnival_clown", "carnival_acrobat", "carnival_ringmaster", "carnival_kid", "carnival_skeleton"])
  PERSON.add(k);

// ---- New thrown things -------------------------------------------------------------

GEO.carnival_pin = () =>
  merge([
    part(CYL(0.045, 0.075, 0.28, 8), 0xf4f1ea, 0, 0.06, 0),
    part(BALL(0.08, 8), 0xf4f1ea, 0, 0.17, 0),
    part(CYL(0.025, 0.045, 0.18, 6), 0xf4f1ea, 0, -0.16, 0),
    part(CYL(0.078, 0.078, 0.04, 8), 0xe8344a, 0, 0.13, 0),
    part(CYL(0.058, 0.058, 0.035, 8), 0xe8344a, 0, -0.02, 0),
    part(BALL(0.035, 5), 0xe8344a, 0, -0.26, 0)
  ]);
GEO.carnival_jball = c =>
  merge([part(BALL(0.15, 10), c, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.9), part(TORUS(0.15, 0.03, 14), 0xf4f1ea)]);
GEO.carnival_jack = () =>
  merge([
    part(BALL(0.24, 10), 0xff7a1a, 0, 0, 0, 0, 0, 0, 1, 0.82, 1, 0.5),
    part(CYL(0.03, 0.045, 0.12, 5), 0x4a6a2a, 0, 0.22, 0),
    part(BOX(0.09, 0.08, 0.04), 0x2a1408, -0.08, 0.05, 0.22),
    part(BOX(0.09, 0.08, 0.04), 0x2a1408, 0.08, 0.05, 0.22),
    part(BOX(0.22, 0.05, 0.04), 0x2a1408, 0, -0.07, 0.22)
  ]);
// a gondola, hanging from its pin at the origin: a target painted both sides
GEO.carnival_gondola = c => {
  const P = [
    part(BOX(0.08, 0.7, 0.08), 0xd8d8e0, 0, -0.35, 0),
    part(CONE(0.95, 0.4, 4), c, 0, -0.62, 0, 0, Math.PI / 4, 0, 1, 1, 0.8),
    part(BOX(1.3, 0.8, 1.0), c, 0, -1.5, 0, 0, 0, 0, 1, 1, 1, 0.6),
    part(BOX(1.34, 0.08, 1.04), 0xf2c230, 0, -1.1, 0)
  ];
  for (const [x, z] of [
    [-0.6, -0.45],
    [0.6, -0.45],
    [-0.6, 0.45],
    [0.6, 0.45]
  ])
    P.push(part(BOX(0.05, 0.42, 0.05), 0xd8d8e0, x, -0.88, z));
  for (const s of [-1, 1])
    for (const [r, col] of [
      [0.36, 0xf4f1ea],
      [0.25, 0xe8344a],
      [0.13, 0xf4f1ea],
      [0.05, 0xe8344a]
    ])
      P.push(part(CYL(r, r, 0.02, 16), col, 0, -1.5, s * (0.51 + (0.36 - r) * 0.04), Math.PI / 2));
  return merge(P);
};
// a coaster car, nose to -z, riders with their arms up
GEO.carnival_coaster = c => {
  const P = [
    part(BOX(1.15, 0.5, 1.9), c, 0, 0.45, 0, 0, 0, 0, 1, 1, 1, 0.6),
    part(BOX(1.15, 0.4, 0.6), c, 0, 0.6, -0.9, -0.5, 0, 0, 1, 1, 1, 0.6),
    part(BOX(1.17, 0.08, 1.92), 0xf4f1ea, 0, 0.62, 0),
    part(BOX(0.95, 0.06, 1.5), 0x222222, 0, 0.71, 0.1)
  ];
  for (const [x, z] of [
    [-0.5, -0.65],
    [0.5, -0.65],
    [-0.5, 0.65],
    [0.5, 0.65]
  ])
    P.push(part(CYL(0.13, 0.13, 0.1, 8), 0x2a2a2a, x, 0.15, z, 0, 0, Math.PI / 2));
  [0x2f6fe8, 0xf2c230, 0x3ab54a, 0xe86a1a].forEach((shirt, k) => {
    const x = k % 2 ? 0.26 : -0.26;
    const z = k < 2 ? -0.2 : 0.5;
    P.push(part(BOX(0.32, 0.36, 0.24), shirt, x, 0.9, z));
    P.push(part(BALL(0.13, 6), 0xf0c9a0, x, 1.2, z));
    for (const s of [-1, 1]) P.push(part(BOX(0.07, 0.42, 0.07), shirt, x + s * 0.17, 1.25, z, 0, 0, -s * 0.3));
  });
  return merge(P);
};
// the ghost train's car: a skull on the front, a ghost riding
GEO.carnival_ghostcar = () =>
  merge([
    part(BOX(1.15, 0.55, 1.8), 0x4a1a5a, 0, 0.45, 0, 0, 0, 0, 1, 1, 1, 0.6),
    part(BOX(1.17, 0.08, 1.82), 0x9aff7a, 0, 0.66, 0),
    part(BALL(0.36, 8), 0xeae4d4, 0, 0.85, -0.95),
    part(BALL(0.08, 5), 0x111111, -0.13, 0.9, -1.25),
    part(BALL(0.08, 5), 0x111111, 0.13, 0.9, -1.25),
    part(BOX(1.9, 0.05, 0.5), 0x1a1020, 0, 1.0, -0.55, 0, 0, 0, 1, 1, 1, 0.3),
    part(CAP(0.28, 0.45, 8), 0xe4fff0, 0, 1.25, 0.25),
    part(BALL(0.05, 4), 0x111111, -0.1, 1.45, 0.0),
    part(BALL(0.05, 4), 0x111111, 0.1, 1.45, 0.0),
    part(CYL(0.13, 0.13, 0.1, 8), 0x2a2a2a, -0.5, 0.15, -0.6, 0, 0, Math.PI / 2),
    part(CYL(0.13, 0.13, 0.1, 8), 0x2a2a2a, 0.5, 0.15, -0.6, 0, 0, Math.PI / 2),
    part(CYL(0.13, 0.13, 0.1, 8), 0x2a2a2a, -0.5, 0.15, 0.6, 0, 0, Math.PI / 2),
    part(CYL(0.13, 0.13, 0.1, 8), 0x2a2a2a, 0.5, 0.15, 0.6, 0, 0, Math.PI / 2)
  ]);
// a firework shell going up, its fuse sparking behind it
GEO.carnival_shell = c =>
  merge([
    part(BALL(0.2, 9), c, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1.4),
    part(BALL(0.11, 6), 0xfff6d0, 0, 0, 0.12),
    part(CONE(0.1, 0.7, 6), 0xffb040, 0, -0.5, 0, Math.PI, 0, 0, 1, 1, 1, 1.2),
    part(CONE(0.05, 0.5, 5), 0xfff0a0, 0, -0.42, 0, Math.PI)
  ]);
GEO.carnival_rocketfly = c =>
  merge([
    part(CYL(0.08, 0.08, 0.55, 8), c, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.8),
    part(CONE(0.09, 0.22, 8), 0xf4f1ea, 0, 0.38, 0),
    part(BOX(0.3, 0.14, 0.02), c, 0, -0.25, 0),
    part(CYL(0.012, 0.012, 0.9, 4), 0x8a6a3a, 0.09, -0.5, 0),
    part(CONE(0.07, 0.4, 6), 0xffa030, 0, -0.45, 0, Math.PI, 0, 0, 1, 1, 1, 1.2)
  ]);

// ---- Kinds -----------------------------------------------------------------------

// A cut-out on the move (the plates' outline), like the western's gunmen.
const figure = (key, h, extra = {}) => ({ ...gunman(key, h), ...extra });
const kinds = {
  // the big top
  carnival_clown: figure("carnival_clown", 1.7, { sound: "boing", arrive: "splat", lose: "CUSTARD PIE!" }),
  carnival_acrobat: {
    ...figure("carnival_acrobat", 1.7),
    pts: -25,
    sound: "wrong",
    ...DONT,
    name: "ACROBATS! DON'T SHOOT!"
  },
  carnival_cannonball: { ...thing("cannonman", 0, 50, 0.5, "fall", "fly", "boing"), name: "THE HUMAN CANNONBALL · 50" },
  carnival_pin: thing("carnival_pin", 0, 25, 0.25, "shatter", "tumble", "clank"),
  carnival_ballR: thing("carnival_jball", 0xe8344a, 25, 0.22, "shatter", "tumble", "pop"),
  carnival_ballB: thing("carnival_jball", 0x2f6fe8, 25, 0.22, "shatter", "tumble", "pop"),
  carnival_ballY: thing("carnival_jball", 0xf2c230, 25, 0.22, "shatter", "tumble", "pop"),
  carnival_lion: { ...runner("lion", 0xff7a1a, 1.2, 0.7, "roar"), name: "THE LION'S LOOSE!", lose: "MAULED!" },
  // the ghost train
  carnival_bat: { ...runner("carnival_bat", PAINT.carnival_bat, 0.6, 0.4, "squeak"), pts: 25 },
  carnival_ghost: { ...runner("carnival_ghost", PAINT.carnival_ghost, 1.4, 0.6, "thunk"), pts: 50 },
  carnival_skeleton: figure("carnival_skeleton", 1.8, { sound: "clank", arrive: "thunk", lose: "GOT YOU!" }),
  carnival_kid: {
    ...figure("carnival_kid", 1.15),
    pts: -25,
    sound: "wrong",
    ...DONT,
    name: "A LOST KID! DON'T SHOOT!"
  },
  carnival_jack: thing("carnival_jack", 0, 25, 0.28, "shatter", "tumble", "splat"),
  carnival_ghostcar: { ...thing("carnival_ghostcar", 0, 25, 0.85, "fall", "level", "clank"), hy: 0.7 },
  // the rides
  carnival_gondolaR: { ...thing("carnival_gondola", 0xe8344a, 15, 0.75, "fall", "fixed", "ping"), hy: -1.4 },
  carnival_gondolaB: { ...thing("carnival_gondola", 0x2f6fe8, 15, 0.75, "fall", "fixed", "ping"), hy: -1.4 },
  carnival_gondolaY: { ...thing("carnival_gondola", 0xf2c230, 15, 0.75, "fall", "fixed", "ping"), hy: -1.4 },
  carnival_gondolaG: { ...thing("carnival_gondola", 0x3ab54a, 15, 0.75, "fall", "fixed", "ping"), hy: -1.4 },
  carnival_coasterR: { ...thing("carnival_coaster", 0xe8344a, 50, 0.85, "fall", "level", "clank"), hy: 0.6 },
  carnival_coasterB: { ...thing("carnival_coaster", 0x2f6fe8, 50, 0.85, "fall", "level", "clank"), hy: 0.6 },
  carnival_coasterY: { ...thing("carnival_coaster", 0xf2c230, 50, 0.85, "fall", "level", "clank"), hy: 0.6 },
  // the finale
  carnival_shellR: { ...thing("carnival_shell", 0xff4a6a, 25, 0.3, "shatter", "up", "pop"), name: "BEFORE IT BURSTS!" },
  carnival_shellG: { ...thing("carnival_shell", 0x6aff8a, 25, 0.3, "shatter", "up", "pop"), name: "BEFORE IT BURSTS!" },
  carnival_shellB: { ...thing("carnival_shell", 0x6ac8ff, 25, 0.3, "shatter", "up", "pop"), name: "BEFORE IT BURSTS!" },
  carnival_shellY: { ...thing("carnival_shell", 0xffe04a, 25, 0.3, "shatter", "up", "pop"), name: "BEFORE IT BURSTS!" },
  carnival_rocket: thing("carnival_rocketfly", 0xe8344a, 25, 0.28, "shatter", "up", "pop"),
  carnival_rocketB: thing("carnival_rocketfly", 0x2f6fe8, 25, 0.28, "shatter", "up", "pop"),
  carnival_ringmaster: { ...figure("carnival_ringmaster", 1.9), pts: 300, name: "THE RINGMASTER! · 300" }
};
const JUGGLED = ["carnival_pin", "carnival_pin", "carnival_ballR", "carnival_ballB", "carnival_ballY"];
const GONDOLAS = ["carnival_gondolaR", "carnival_gondolaY", "carnival_gondolaB", "carnival_gondolaG"];
const SHELLS = ["carnival_shellR", "carnival_shellG", "carnival_shellB", "carnival_shellY"];
const BALLOONS = ["balloonR", "balloonB", "balloonY", "balloonG"];

// ---- Paths ------------------------------------------------------------------------

// Out from somewhere to a spot in front of you; there it gets you (a pie in
// the face, a skeleton's grab) and it costs everyone up there 10.
function rush(R, pts, v) {
  const w = walk(pts, v);
  return { dur: w.time + 2, charge: true, arrive: w.time + 0.8, pos: w.pos };
}
// Flown from p0 to p1 ([u, f, h]) over a top at height top (g: faster or slower).
function lob(p0, p1, top, g = 9.8) {
  const up = Math.sqrt(2 * g * Math.max(0.2, top - p0[2]));
  const dur = up / g + Math.sqrt((2 * Math.max(0.2, top - p1[2])) / g);
  const vu = (p1[0] - p0[0]) / dur;
  const vf = (p1[1] - p0[1]) / dur;
  return {
    dur,
    pos: (tau, out) => out.set(p0[0] + vu * tau, p0[1] + vf * tau, p0[2] + up * tau - 0.5 * g * tau * tau)
  };
}

// Scenery helpers.
// A box from a to b ([u, h, f]): w across, t thick.
function seg(P, a, b, w, t, c) {
  const du = b[0] - a[0];
  const dh = b[1] - a[1];
  const df = b[2] - a[2];
  P.add(
    BOX(Math.hypot(du, dh, df), t, w),
    c,
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2,
    0,
    Math.atan2(df, du),
    Math.atan2(dh, Math.hypot(du, df))
  );
}
// A string of bulbs from a to b ([u, h, f]), sagging in the middle.
function garland(P, a, b, n, sag, cols, r = 0.13) {
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    P.add(
      BALL(r, 4),
      cols[k % cols.length],
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - sag * Math.sin(t * Math.PI),
      a[2] + (b[2] - a[2]) * t
    );
  }
}
const BULBS = [0xfff1a8, 0xff6a7a, 0x8ad8ff, 0xffd24a];
// Striped awning strips across u0..u1 at f, h.
function awning(P, u0, u1, f, h, depth, cols, tilt = 0.25) {
  const n = Math.max(2, Math.round((u1 - u0) / 1.1));
  const w = (u1 - u0) / n;
  for (let k = 0; k < n; k++) P.add(BOX(w, 0.08, depth), cols[k % cols.length], u0 + w * (k + 0.5), h, f, tilt);
}

// ---- Level 2: the big top ---------------------------------------------------------

// Inside the tent (shot from inside, like the saloon). Side walls at u = +-W,
// the canvas rising from WALL to the ridge at PEAK; the ring at f RING (radius
// RR) behind the ring fence at FENCE; the trapeze towers at u = +-TW, f TF,
// their platforms PLAT up; the band box over the performers' entrance at BACK.
const TOP = {
  W: 19.5,
  FRONT: -11,
  BACK: 46,
  WALL: 6,
  PEAK: 17.5,
  RING: 22,
  RR: 6.5,
  FENCE: 14.6,
  TW: 12,
  TF: 30,
  PLAT: 8,
  POLE: 7.5,
  BAND: 4.3
};
const roofAt = u => TOP.WALL + (TOP.PEAK - TOP.WALL) * (1 - Math.abs(u) / TOP.W);
const BARRELS = [
  [-3, 19.5],
  [-1.1, 19.5],
  [1.1, 19.5],
  [3, 19.5]
];
const CANNON = { U: -10.5, F: 6.5, H: 1.5, A: 0.95 };
const MOUTH = [CANNON.U + (0.6 + 1.7) * Math.sin(CANNON.A), CANNON.F, G + CANNON.H + (0.6 + 1.7) * Math.cos(CANNON.A)];
const NET = [12.6, 20, G + 4];

WORLDS.carnival_bigtop = {
  sky: { top: "#1a0808", mid: "#200a0a", horizon: "#2a1010", ground: "#140806", seed: 61 },
  fog: 0x2a1610,
  signs: [["THE GREAT CARNIVAL CIRCUS", 0, G + 7.1, TOP.BACK - 0.08, 9.5, 1.1, "#8a0a14", "#f2c230"]],
  build(P) {
    const T = TOP;
    const len = T.BACK + 0.3 - T.FRONT;
    const mid = (T.FRONT + T.BACK + 0.3) / 2;
    const RED = 0xc81e24;
    const CREAM = 0xf2e6cc;
    // the floor (sawdust), the ring, its curb
    P.add(SLAB(2 * T.W + 0.4, 0.1, len), 0x6a4a2a, 0, G - 0.05, mid);
    P.add(CYL(T.RR, T.RR, 0.06, 36), 0xd8b070, 0, G + 0.03, T.RING);
    P.add(TORUS(T.RR, 0.3, 44), 0xc0182a, 0, G + 0.3, T.RING, Math.PI / 2);
    P.add(TORUS(T.RR, 0.1, 44), 0xf2c230, 0, G + 0.58, T.RING, Math.PI / 2);
    P.add(CYL(1.1, 1.2, 0.5, 14), 0xf4f1ea, 0, G + 0.25, T.RING + 0.5);
    P.add(CYL(1.12, 1.12, 0.08, 14), 0xc0182a, 0, G + 0.5, T.RING + 0.5);
    // the canvas: striped side walls, the roof up to the ridge, the gable at the back
    const n = 29;
    const sw = len / n;
    const slope = Math.hypot(T.W, T.PEAK - T.WALL);
    const a = Math.atan2(T.PEAK - T.WALL, T.W);
    for (let k = 0; k < n; k++) {
      const f = T.FRONT + sw * (k + 0.5);
      const c = k % 2 ? RED : CREAM;
      for (const s of [-1, 1]) {
        P.add(BOX(0.2, T.WALL, sw + 0.02), c, s * (T.W + 0.1), G + T.WALL / 2, f);
        P.add(BOX(slope + 0.3, 0.12, sw + 0.02), c, (s * T.W) / 2, G + (T.WALL + T.PEAK) / 2, f, 0, 0, -s * a);
      }
    }
    for (let u = -T.W; u < T.W - 0.01; u += 1.5) {
      const uc = u + 0.75;
      const h = roofAt(uc) + 0.4;
      P.add(BOX(1.5, h, 0.25), Math.round(u / 1.5) % 2 ? RED : CREAM, uc, G + h / 2, T.BACK + 0.15);
    }
    // a gold scalloped band round the top of the walls
    for (const s of [-1, 1]) P.add(SLAB(0.1, 0.35, len), 0xf2c230, s * (T.W - 0.05), G + T.WALL - 0.2, mid);
    P.add(BOX(2 * T.W, 0.35, 0.1), 0xf2c230, 0, G + T.WALL - 0.2, T.BACK - 0.02);
    // the king poles, striped, and spotlights on them
    for (const s of [-1, 1]) {
      const top = roofAt(T.POLE);
      for (let k = 0; k < 6; k++)
        P.add(CYL(0.24, 0.24, top / 6, 8), k % 2 ? RED : CREAM, s * T.POLE, G + (top / 6) * (k + 0.5), T.RING);
      for (const df of [-0.45, 0.45]) {
        P.add(CYL(0.28, 0.34, 0.5, 8), 0x2a2a2a, s * (T.POLE - 0.4), G + 9, T.RING + df, 0.5, 0, -s * 0.6);
        P.add(CYL(0.27, 0.27, 0.04, 8), 0xfff4c0, s * (T.POLE - 0.55), G + 8.82, T.RING + df - 0.12, 0.5, 0, -s * 0.6);
      }
      // strings of lights from the poles to the walls and across
      garland(P, [s * T.POLE, G + 12.2, T.RING], [s * T.W, G + T.WALL, 2], 10, 1.2, BULBS);
      garland(P, [s * T.POLE, G + 12.2, T.RING], [s * T.W, G + T.WALL, 40], 10, 1.2, BULBS);
      garland(P, [s * T.POLE, G + 12.2, T.RING], [s * 3, G + roofAt(3) - 0.2, -6], 10, 1.0, BULBS);
    }
    garland(P, [-T.POLE, G + 12.2, T.RING], [T.POLE, G + 12.2, T.RING], 12, 1.6, BULBS);
    // the ring fence: red boards, a gold rail, gold stars painted on
    P.add(BOX(15, 0.95, 0.25), 0xa8141e, 0, G + 0.475, T.FENCE + 0.2);
    P.add(BOX(15.2, 0.08, 0.4), 0xf2c230, 0, G + 0.99, T.FENCE + 0.2);
    for (let u = -6.5; u <= 6.6; u += 1.3)
      P.add(BOX(0.28, 0.28, 0.04), 0xf2c230, u, G + 0.5, T.FENCE + 0.06, 0, 0, Math.PI / 4);
    // clowns' barrels in the ring, striped
    for (const [u, f] of BARRELS) {
      P.add(CYL(0.42, 0.4, 1.35, 12), 0x2f6fe8, u, G + 0.675, f + 0.35);
      for (const h of [0.25, 0.68, 1.1]) P.add(CYL(0.43, 0.43, 0.1, 12), 0xf4f1ea, u, G + h, f + 0.35);
    }
    // the lions' drums: a pyramid at the back of the ring
    for (const [u, h] of [
      [-4.4, 1.0],
      [-2.2, 1.4],
      [0, 1.8],
      [2.2, 1.4],
      [4.4, 1.0]
    ]) {
      P.add(CYL(0.55, 0.6, h, 12), u % 4.4 ? 0x2f6fe8 : 0xc0182a, u, G + h / 2, 25.9);
      P.add(CYL(0.58, 0.58, 0.07, 12), 0xf2c230, u, G + h - 0.02, 25.9);
      P.add(CYL(0.62, 0.62, 0.07, 12), 0xf2c230, u, G + 0.05, 25.9);
    }
    // the bears' balls near the fence ends
    for (const s of [-1, 1]) {
      P.add(BALL(0.58, 10), 0xf2c230, s * 9, G + 0.58, 16.9);
      P.add(TORUS(0.58, 0.06, 18), 0xc0182a, s * 9, G + 0.58, 16.9, 0, Math.PI / 2);
    }
    // the elephants' tubs
    for (const s of [-1, 1]) {
      P.add(CYL(0.95, 1.05, 0.6, 14), 0x2f6fe8, s * 10, G + 0.3, 40.5);
      P.add(CYL(1.0, 1.0, 0.08, 14), 0xf2c230, s * 10, G + 0.6, 40.5);
    }
    // the trapeze towers, their platforms and ladders, the wire between them
    for (const s of [-1, 1]) {
      const u = s * T.TW;
      for (const [x, z] of [
        [-0.6, -0.6],
        [0.6, -0.6],
        [-0.6, 0.6],
        [0.6, 0.6]
      ])
        P.add(CYL(0.07, 0.07, T.PLAT + 1, 5), 0xd8d8d8, u + x, G + (T.PLAT + 1) / 2, T.TF + z);
      P.add(BOX(1.7, 0.14, 1.7), 0xc0182a, u, G + T.PLAT, T.TF);
      P.add(BOX(1.7, 0.05, 0.05), 0xf2c230, u, G + T.PLAT + 0.9, T.TF + 0.6);
      P.add(BOX(0.05, 0.05, 1.7), 0xf2c230, u + s * 0.6, G + T.PLAT + 0.9, T.TF);
      for (let h = 0.5; h < T.PLAT; h += 0.6) P.add(BOX(0.05, 0.05, 1.2), 0xd8d8d8, u + s * 0.62, G + h, T.TF);
      // a trapeze hanging between the towers and the poles
      const tu = s * 5.5;
      for (const x of [-0.6, 0.6])
        P.add(BOX(0.03, roofAt(tu) - 10, 0.03), 0xd8d8d8, tu + x, G + (roofAt(tu) + 10) / 2, T.TF);
      P.add(CYL(0.04, 0.04, 1.3, 5), 0xf2c230, tu, G + 10, T.TF, 0, 0, Math.PI / 2);
    }
    P.add(BOX(2 * T.TW - 1.6, 0.035, 0.035), 0xe8e8e8, 0, G + T.PLAT + 0.05, T.TF);
    // the human cannonball's cannon, and his net
    const C = CANNON;
    P.add(BOX(2.4, 0.6, 1.3), 0xa8141e, C.U, G + 0.75, C.F);
    for (const s of [-1, 1]) {
      P.add(TORUS(0.75, 0.08, 16), 0xf2c230, C.U - 0.2, G + 0.75, C.F + s * 0.75);
      for (let k = 0; k < 3; k++)
        P.add(BOX(1.45, 0.07, 0.05), 0xf2c230, C.U - 0.2, G + 0.75, C.F + s * 0.75, 0, 0, (k * Math.PI) / 3);
    }
    const dir = [Math.sin(C.A), Math.cos(C.A)];
    P.add(CYL(0.42, 0.56, 3.4, 14), 0xc0182a, C.U + 0.6 * dir[0], G + C.H + 0.6 * dir[1], C.F, 0, 0, -C.A);
    for (const d of [-1.2, 0, 1.6])
      P.add(
        CYL(0.55 - d * 0.04, 0.55 - d * 0.04, 0.12, 14),
        0xf2c230,
        C.U + (0.6 + d) * dir[0],
        G + C.H + (0.6 + d) * dir[1],
        C.F,
        0,
        0,
        -C.A
      );
    for (const df of [-1.3, 1.3]) P.add(CYL(0.06, 0.06, 4.6, 5), 0xd8d8d8, NET[0] + 0.4, G + 2.3, NET[1] + df);
    for (let k = 0; k < 6; k++) P.add(BOX(0.03, 0.03, 2.6), 0xf4f1ea, NET[0], G + 3.3 + k * 0.3, NET[1], 0, 0, 0.5);
    for (let k = 0; k < 7; k++)
      P.add(BOX(0.03, 1.7, 0.03), 0xf4f1ea, NET[0], G + 4.1, NET[1] - 1.3 + k * 0.43, 0, 0, 0.5);
    // the stands down both sides, rising to the walls, full
    const FANS = [0xe8344a, 0x2f6fe8, 0xf2c230, 0x3ab54a, 0xf4f1ea, 0x8a4ac8, 0xe86a1a];
    let fan = 0;
    for (const s of [-1, 1])
      for (let k = 0; k < 6; k++) {
        const h = 0.5 * (k + 1);
        const u = s * (13.8 + k);
        P.add(SLAB(1.0, h, 34), k % 2 ? 0x5a3a22 : 0x6a4428, u, G + h / 2, 19);
        P.add(SLAB(0.06, 0.08, 34), 0xf2c230, u - s * 0.47, G + h, 19);
        if (k % 2) continue;
        for (let f = 3.2 + k * 0.5; f < 35.5; f += 2.3) {
          const c = FANS[fan++ % FANS.length];
          P.add(BOX(0.42, 0.55, 0.32), c, u, G + h + 0.28, f);
          P.add(BALL(0.14, 4), [0xf0c9a0, 0xc89468, 0x8a5a3a][fan % 3], u, G + h + 0.72, f);
        }
      }
    // the band box over the performers' entrance: curtains, a railing, drums
    const B = T.BACK;
    P.add(BOX(10, 0.3, 2.4), 0x5a3a22, 0, G + T.BAND, B - 1.2);
    P.add(BOX(10, 0.6, 0.12), 0xa8141e, 0, G + T.BAND - 0.15, B - 2.42);
    P.add(BOX(10, 0.06, 0.06), 0xf2c230, 0, G + T.BAND + 0.95, B - 2.35);
    for (let u = -4.9; u <= 4.95; u += 0.7) P.add(BOX(0.05, 0.8, 0.05), 0xf2c230, u, G + T.BAND + 0.55, B - 2.35);
    for (const u of [-4.8, 4.8]) P.add(BOX(0.25, T.BAND, 0.25), 0xf2c230, u, G + T.BAND / 2, B - 2.3);
    for (const u of [-3.8, 3.8]) {
      P.add(CYL(0.4, 0.4, 0.55, 12), 0xf4f1ea, u, G + T.BAND + 0.43, B - 0.8, Math.PI / 2);
      P.add(TORUS(0.4, 0.04, 12), 0xc0182a, u, G + T.BAND + 0.43, B - 1.08);
    }
    P.add(BOX(3.4, T.BAND - 0.2, 0.1), 0x140806, 0, G + (T.BAND - 0.2) / 2, B - 0.05);
    for (const s of [-1, 1]) P.add(BOX(1.3, T.BAND - 0.15, 0.18), 0x8a0a14, s * 2.3, G + (T.BAND - 0.15) / 2, B - 0.25);
    // the red carpet from the front up to the ring fence, a stool either side
    P.add(SLAB(2.4, 0.03, 17), 0x9a0a1a, 0, G + 0.015, 6);
    for (const s of [-1, 1]) {
      P.add(SLAB(0.12, 0.035, 17), 0xf2c230, s * 1.2, G + 0.02, 6);
      P.add(CYL(0.45, 0.5, 0.7, 12), s < 0 ? 0xc0182a : 0x2f6fe8, s * 5.5, G + 0.35, 9);
      P.add(CYL(0.48, 0.48, 0.06, 12), 0xf2c230, s * 5.5, G + 0.7, 9);
    }
    P.add(BOX(5, 0.45, 0.2), 0xf2c230, 0, G + T.BAND - 0.4, B - 0.3);
  },
  slots: [],
  cover: null
};

LAYOUTS.carnival_bigtop = L => {
  const fixed = { fixed: true, rail: false };
  // tin ducks and stars along the ring fence, balloons on the balloon man's sticks
  L.row({
    ...fixed,
    kind: ["duck", "star"],
    n: 8,
    f: TOP.FENCE + 0.1,
    u0: -6.3,
    u1: 6.3,
    base: 1.03,
    size: 0.4,
    tint: ["yellow", "gold"],
    bank: 4
  });
  L.row({
    ...fixed,
    perch: true,
    wood: 0xf4f1ea,
    kind: "carnival_balloon",
    n: 5,
    f: 8.6,
    u0: 9.4,
    u1: 12.2,
    base: 2.2,
    size: 0.55,
    tint: ["red", "blue", "yellow", "green", "pink"],
    bank: 5
  });
  // the bears up on their balls, facing in
  L.row({
    ...fixed,
    kind: "bear",
    n: 1,
    f: 16.6,
    u0: -9,
    u1: -9,
    base: 1.14,
    size: 0.85,
    tint: "carnival_bear",
    mirror: -1
  });
  L.row({
    ...fixed,
    kind: "bear",
    n: 1,
    f: 16.6,
    u0: 9,
    u1: 9,
    base: 1.14,
    size: 0.85,
    tint: "carnival_bear",
    mirror: 1
  });
  // the lions on their drums
  L.row({ ...fixed, kind: "lion", n: 2, f: 25.6, u0: -4.4, u1: 4.4, base: 1.0, size: 0.9, tint: "orange", bank: 2 });
  L.row({ ...fixed, kind: "lion", n: 2, f: 25.6, u0: -2.2, u1: 2.2, base: 1.4, size: 0.9, tint: "yellow", bank: 2 });
  L.row({ ...fixed, kind: "lion", n: 1, f: 25.6, u0: 0, u1: 0, base: 1.8, size: 1.0, tint: "gold" });
  // monkeys on the trapezes, elephants on their tubs at the back
  L.row({
    ...fixed,
    kind: "monkey",
    n: 2,
    f: TOP.TF - 0.1,
    u0: -5.5,
    u1: 5.5,
    base: 10.04,
    size: 0.8,
    tint: "brown",
    bank: 2
  });
  L.row({
    ...fixed,
    kind: "elephant",
    n: 1,
    f: 40,
    u0: -10,
    u1: -10,
    base: 0.64,
    size: 2.1,
    tint: "steel",
    mirror: -1
  });
  L.row({ ...fixed, kind: "elephant", n: 1, f: 40, u0: 10, u1: 10, base: 0.64, size: 2.1, tint: "steel", mirror: 1 });
  // gold stars over the circus's name
  L.row({
    ...fixed,
    kind: "star",
    n: 3,
    f: TOP.BACK - 0.3,
    u0: -3.8,
    u1: 3.8,
    base: 7.9,
    size: 0.6,
    tint: "gold",
    bank: 3
  });
  // clowns up out of the barrels (an acrobat now and then: don't)
  L.pops({
    fixed: true,
    f: 19.5,
    at: BARRELS.map(([u]) => [u, 1.35]),
    size: 1.35,
    kinds: [
      ["carnival_clown", 85],
      ["carnival_acrobat", 15, { dont: true }]
    ]
  });
  // on the trapeze platforms
  L.pops({
    fixed: true,
    f: TOP.TF + 0.2,
    at: [
      [-TOP.TW, TOP.PLAT + 0.07],
      [TOP.TW, TOP.PLAT + 0.07]
    ],
    size: 1.6,
    period: [5, 8],
    kinds: [
      ["carnival_clown", 50, { pts: 50 }],
      ["carnival_acrobat", 50, { dont: true }]
    ]
  });
  // in the band box, and now and then the Ringmaster looking in
  L.pops({
    fixed: true,
    f: TOP.BACK - 1.5,
    at: [
      [-2.2, TOP.BAND + 0.15],
      [0, TOP.BAND + 0.15],
      [2.2, TOP.BAND + 0.15]
    ],
    size: 1.6,
    period: [5, 8],
    kinds: [
      ["carnival_clown", 60, { pts: 50 }],
      ["carnival_ringmaster", 12, { pts: 100 }],
      ["carnival_acrobat", 28, { dont: true }]
    ]
  });
  // up among the crowd in the stands
  L.pops({
    fixed: true,
    f: 11,
    at: [
      [-14.6, 1.0],
      [14.6, 1.0]
    ],
    size: 1.5,
    kinds: [["carnival_clown", 100]]
  });
  L.pops({
    fixed: true,
    f: 24,
    at: [
      [-14.6, 1.0],
      [14.6, 1.0]
    ],
    size: 1.5,
    kinds: [["carnival_clown", 100]]
  });
};

// Fired from the cannon across the tent into the net.
function fire(R, add, t, c) {
  add(
    t,
    "carnival_cannonball",
    lob(
      MOUTH,
      [NET[0] + R(-0.4, 0.4), NET[1] + R(-0.8, 0.8), NET[2] + R(-0.3, 0.4)],
      G + R(10.5, 12.5),
      9.8 * c.S * c.S
    )
  );
}
// Thrown up out of a barrel.
function juggle(R, add, t, c) {
  const [u, f] = pick(R, BARRELS);
  add(
    t,
    pick(R, JUGGLED),
    toss(R, {
      u: u + R(-0.2, 0.2),
      f,
      h: G + 1.5,
      vh: Math.min(9.5, R(6.5, 8.5) * c.S),
      vu: R(-1.4, 1.4),
      vf: R(-0.8, 0.4)
    })
  );
}
// A clown running round in front of the ring.
function clownRun(R, add, t, c) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  add(t, "carnival_clown", cross(R, { u0: -dir * 17, u1: dir * 17, f: R(6, 12), v: R(3.5, 5) * c.S, bob: 0.12 }));
}
// A clown out from under the stands with a custard pie: get him first.
function pieRush(R, add, t, c) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(
    t,
    "carnival_clown",
    rush(
      R,
      [
        [s * R(12.5, 13.2), R(4, 12), G],
        [s * R(4, 8), R(6, 9), G],
        [R(-3, 3), R(4, 5.5), G]
      ],
      R(3, 4) * c.S
    )
  );
}
// A lion out through the curtain, across the ring and at you.
function lionRun(R, add, t, c) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(t, "carnival_lion", charge(R, { v: R(8, 10) * c.S, u0: s * R(1.5, 3), f0: TOP.BACK - 3, u1: -s * R(3, 7) }));
}
// An acrobat (don't): from platform to platform, or along the wire.
function leap(R, add, t, c) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  const h = G + TOP.PLAT + 0.1;
  add(
    t,
    "carnival_acrobat",
    lob([-s * (TOP.TW - 0.5), TOP.TF - 0.3, h], [s * (TOP.TW - 0.5), TOP.TF - 0.3, h], G + 12.5, 9.8 * c.S)
  );
}
function wire(R, add, t) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(
    t,
    "carnival_acrobat",
    cross(R, {
      u0: -s * (TOP.TW - 0.8),
      u1: s * (TOP.TW - 0.8),
      f: TOP.TF - 0.1,
      h: TOP.PLAT + 0.07,
      v: 1.1,
      bob: 0.02
    })
  );
}

const bigtopWave = (R, add, c) => {
  if (c.x2) {
    // the whole company: clowns everywhere, the cannon, the lions loose
    for (let k = 0; k < 10; k++) clownRun(R, add, 1 + k * 2.2, c);
    for (let k = 0; k < 5; k++) fire(R, add, 2 + k * 4.5, c);
    for (let k = 0; k < 12; k++) juggle(R, add, 1.5 + k * 1.8, c);
    for (let k = 0; k < 2; k++) lionRun(R, add, 6 + k * 9, c);
    leap(R, add, 11, c);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 3 || k === 5) for (let j = 0; j < 3 + n(2.5); j++) juggle(R, add, R(1, 24), c);
  if (k !== 1) for (let j = 0; j < 1 + n(k === 2 ? 1.5 : 0.5); j++) fire(R, add, R(1, 22), c);
  if (k === 1 || k === 4 || k === 5) for (let j = 0; j < 1 + n(1.5); j++) clownRun(R, add, R(1, 20), c);
  if (k === 3 || k === 5) for (let j = 0; j < 1 + n(0.8); j++) pieRush(R, add, R(2, 18), c);
  if (k === 4 || (k === 2 && R(0, 1) < 0.5)) lionRun(R, add, R(3, 16), c);
  if (k === 1) wire(R, add, R(1, 6));
  if (k === 2 || (k === 5 && R(0, 1) < 0.5)) leap(R, add, R(3, 20), c);
};

// ---- Level 3: the ghost train -----------------------------------------------------

// A dark ride through a graveyard at midnight: its track along the front
// (f TRACK) and up through the gate in the graveyard wall (f WALL) to the
// haunted house's doorway (its front at f HOUSE); coffins stood up at f
// COFFIN, graves, dead trees; the crypt and the chapel ruin up the hill.
const GH = { TRACK: 5.5, WALL: 10.5, COFFIN: 17.2, HOUSE: 34, PORCH: 31.9, CRYPT: [10, 50], CHAPEL: [-17, 58] };
const COFFINS = [-10, -5.2, 5.2, 10];
const RISERS = [
  [-13, 13.5],
  [-7, 21],
  [7, 21],
  [13, 13.5]
];
const HEADSTONES = [
  [-2.8, 14],
  [2.8, 14],
  [-13, 14.4],
  [13, 14.4],
  [-7, 21.9],
  [7, 21.9],
  [-1.2, 23.5],
  [3.5, 24.5],
  [-15.5, 19],
  [16, 22]
];
const ANGELS = [
  [-11, 22.3],
  [11, 22.3]
];
// [u, f, scale]
const DEAD = [
  [-15, 25.5, 1.1],
  [15, 26.5, 1.2],
  [-5.5, 27.5, 1.0],
  [20, 46, 1.3]
];
const branchEnd = (u, f, s, side, h) => [u + side * 1.79 * s, G + (h + 1.28) * s, f];
const WINDOWS = [
  [-7, 1.2],
  [-3.6, 1.2],
  [3.6, 1.2],
  [7, 1.2],
  [-7, 5.2],
  [0, 5.2],
  [7, 5.2],
  [-13, 5.2],
  [-13, 10.2],
  [0, 10.2]
];

function deadTree(P, u, f, s) {
  const c = 0x2a2430;
  P.add(CYL(0.22 * s, 0.4 * s, 5.4 * s, 6), c, u, G + 2.7 * s, f);
  for (const [side, h, l] of [
    [-1, 3.4, 1],
    [1, 3.4, 1],
    [-1, 4.8, 0.7],
    [1, 2.6, 0.6],
    [1, 4.6, 0.8]
  ]) {
    P.add(
      CYL(0.06 * s, 0.13 * s, 2.2 * s * l, 5),
      c,
      u + side * 0.9 * s * l,
      G + (h + 0.64 * l) * s,
      f,
      0,
      0,
      -side * 0.95
    );
    P.add(
      CYL(0.03 * s, 0.06 * s, 0.9 * s * l, 4),
      c,
      u + side * 1.7 * s * l,
      G + (h + 1.5 * l) * s,
      f,
      0,
      0,
      side * 0.3
    );
  }
}
function headstone(P, u, f, h, k) {
  const c = [0x6a6a74, 0x5e6460, 0x74727a][k % 3];
  if (k % 3 === 2) {
    // a cross
    P.add(BOX(0.22, h, 0.18), c, u, G + h / 2, f);
    P.add(BOX(0.8, 0.2, 0.18), c, u, G + h * 0.72, f);
  } else {
    P.add(BOX(0.85, h - 0.3, 0.2), c, u, G + (h - 0.3) / 2, f);
    P.add(CYL(0.425, 0.425, 0.2, 10), c, u, G + h - 0.3, f, Math.PI / 2);
  }
  P.add(BOX(0.9, 0.12, 1.8), 0x2a3426, u, G + 0.06, f - 1.0);
}
function window_(P, u, h0, f, pane, w = 1.3, h = 1.8) {
  P.add(BOX(w + 0.3, h + 0.3, 0.1), 0x1a1220, u, G + h0 + h / 2, f - 0.04);
  P.add(BOX(w, h, 0.08), pane, u, G + h0 + h / 2, f - 0.08);
  P.add(BOX(0.06, h, 0.1), 0x1a1220, u, G + h0 + h / 2, f - 0.1);
  P.add(BOX(w, 0.06, 0.1), 0x1a1220, u, G + h0 + h * 0.6, f - 0.1);
  P.add(BOX(0.55, h + 0.1, 0.06), 0x2a1e30, u - w / 2 - 0.35, G + h0 + h / 2, f - 0.1, 0, 0, 0.08);
  P.add(BOX(0.55, h + 0.1, 0.06), 0x2a1e30, u + w / 2 + 0.38, G + h0 + h / 2 - 0.1, f - 0.12, 0, 0, -0.18);
}

WORLDS.carnival_ghosts = {
  sky: {
    top: "#04050e",
    mid: "#121a34",
    horizon: "#3a3058",
    ground: "#0c0a12",
    sun: [-28, 30, "#eef4dc", 13],
    stars: true,
    clouds: 6,
    cloud: "rgba(150,160,200,0.28)",
    hills: [
      { colour: "#161630", height: 8, rough: 2, phase: 1.5, trees: true },
      { colour: "#0c0c18", height: 4, rough: 4 }
    ],
    seed: 62
  },
  fog: 0x221e3a,
  signs: [
    ["GHOST TRAIN", 0, G + 4.35, GH.PORCH - 0.5, 5.2, 1.0, "#14081e", "#9aff7a"],
    ["TICKETS", 12.5, G + 2.25, 2.35, 1.6, 0.4, "#14081e", "#9aff7a"],
    ["BONEYARD", 0, G + 2.72, GH.WALL - 0.08, 2.2, 0.42, "#1a1a1a", "#d8d8c8"]
  ],
  build(P) {
    P.ground(0x262430, [
      { u: 0, f: 18, r: 12, c: 0x2a3426, sx: 1.6 },
      { u: 0, f: 6, r: 6, c: 0x3a3430, sx: 5, sz: 0.25 },
      { u: 0, f: 46, r: 14, c: 0x2a3026, sx: 2.2, sz: 0.7 }
    ]);
    // the ride's track: along the front and up through the gate to the house
    for (const f of [GH.TRACK - 0.5, GH.TRACK + 0.5]) P.add(BOX(64, 0.08, 0.08), 0x8a8a92, 0, G + 0.16, f);
    for (let u = -31; u <= 31; u += 1.5) P.add(BOX(0.25, 0.06, 1.5), 0x3a2a20, u, G + 0.06, GH.TRACK);
    for (const s of [-1, 1])
      P.add(SLAB(0.08, 0.08, GH.HOUSE - GH.TRACK), 0x8a8a92, s * 0.5, G + 0.16, (GH.HOUSE + GH.TRACK) / 2);
    for (let f = GH.TRACK + 2; f < GH.HOUSE; f += 2) P.add(BOX(1.5, 0.06, 0.25), 0x3a2a20, 0, G + 0.06, f);
    // the graveyard wall, its railings, the gate's pillars and arch
    for (const s of [-1, 1]) {
      P.add(BOX(14.2, 0.7, 0.5), 0x4a4650, s * 8.9, G + 0.35, GH.WALL);
      P.add(BOX(14.2, 0.08, 0.6), 0x5a5660, s * 8.9, G + 0.72, GH.WALL);
      for (let u = 2.4; u < 15.8; u += 0.8) P.add(BOX(0.04, 1.0, 0.04), 0x1a1a1e, s * u, G + 1.2, GH.WALL + 0.1);
      P.add(BOX(13.6, 0.05, 0.05), 0x1a1a1e, s * 9.1, G + 1.62, GH.WALL + 0.1);
      for (const u of [1.8, 16.2]) {
        P.add(BOX(0.7, 1.5, 0.7), 0x5a5660, s * u, G + 0.75, GH.WALL);
        P.add(BOX(0.85, 0.12, 0.85), 0x6a6670, s * u, G + 1.5, GH.WALL);
      }
    }
    for (const s of [-1, 1]) P.add(BOX(0.06, 1.6, 0.06), 0x1a1a1e, s * 1.8, G + 2.3, GH.WALL);
    P.add(BOX(3.7, 0.07, 0.07), 0x1a1a1e, 0, G + 3.08, GH.WALL);
    // by the track: the ride's ticket booth, green lamps, a pumpkin patch
    P.add(BOX(2.2, 2.4, 1.6), 0x3a2a4a, 12.5, G + 1.2, 3.2);
    P.add(BOX(1.4, 0.9, 0.06), 0x9aff7a, 12.5, G + 1.5, 2.38);
    P.add(CONE(1.8, 1.2, 4), 0x1c1424, 12.5, G + 3.0, 3.2, 0, Math.PI / 4, 0);
    for (const u of [-11, 11, -19, 19]) {
      P.add(CYL(0.06, 0.09, 3.0, 6), 0x1a1a1e, u, G + 1.5, GH.TRACK + 1.4);
      P.add(BALL(0.22, 6), 0x9aff7a, u, G + 3.1, GH.TRACK + 1.4);
    }
    for (const [u, f] of [
      [-14, 3],
      [-13.2, 3.6],
      [-6, 2.6],
      [6.5, 3.4],
      [14.5, 3.8],
      [15.3, 3.1]
    ]) {
      P.add(BALL(0.32, 7), 0xff7a1a, u, G + 0.25, f, 0, 0, 0, 1, 0.8, 1);
      P.add(CYL(0.03, 0.05, 0.16, 4), 0x4a6a2a, u, G + 0.55, f);
    }
    // the graves, the stones, the stone angels the ghosts hide behind
    HEADSTONES.forEach(([u, f], k) => headstone(P, u, f, k < 2 ? 1.05 : 0.9 + (k % 4) * 0.2, k));
    for (const [u, f] of RISERS) P.add(BOX(1.0, 0.25, 2.0), 0x3a2e22, u, G + 0.12, f - 1.2);
    for (const [u, f] of ANGELS) {
      P.add(BOX(1.4, 0.4, 1.0), 0x6a6a74, u, G + 0.2, f);
      P.add(BOX(0.7, 1.2, 0.5), 0x74727a, u, G + 1.0, f);
      P.add(BALL(0.26, 6), 0x74727a, u, G + 1.85, f);
      for (const s of [-1, 1]) P.add(BOX(0.7, 1.0, 0.1), 0x6a6a74, u + s * 0.5, G + 1.4, f + 0.2, 0, s * 0.5, s * 0.3);
    }
    // coffins stood up, lids open
    for (const u of COFFINS) {
      P.add(BOX(1.15, 2.25, 0.5), 0x4a2a1a, u, G + 1.12, GH.COFFIN + 0.25);
      P.add(BOX(0.85, 1.95, 0.05), 0x0e0808, u, G + 1.1, GH.COFFIN - 0.02);
      P.add(
        BOX(1.15, 2.2, 0.1),
        0x5a3420,
        u + (u < 0 ? -1.05 : 1.05),
        G + 1.05,
        GH.COFFIN + 0.1,
        0,
        0,
        u < 0 ? 0.2 : -0.2
      );
      P.add(
        BOX(0.12, 0.5, 0.04),
        0xc8a050,
        u + (u < 0 ? -1.05 : 1.05),
        G + 1.4,
        GH.COFFIN + 0.03,
        0,
        0,
        u < 0 ? 0.2 : -0.2
      );
    }
    for (const [u, f, s] of DEAD) deadTree(P, u, f, s);
    // the haunted house: the main block and its roof, the attic gable, the
    // tower, the low wing, the porch with the ride's doorway
    const F = GH.HOUSE;
    const WALLC = 0x54466a;
    P.add(BOX(20, 9, 8), WALLC, 0, G + 4.5, F + 4);
    P.add(BOX(20.4, 0.25, 0.3), 0x1c1424, 0, G + 4.0, F - 0.1);
    P.add(BOX(20.8, 0.2, 5.6), 0x3a2e46, 0, G + 10.75, F + 2, 0.72);
    P.add(BOX(20.8, 0.2, 5.6), 0x3a2e46, 0, G + 10.75, F + 6, -0.72);
    P.add(BOX(4.6, 4.6, 0.3), WALLC, 0, G + 9, F - 0.12, 0, 0, Math.PI / 4);
    for (const s of [-1, 1])
      P.add(BOX(3.6, 0.22, 0.4), 0x1c1424, s * 1.25, G + 10.3, F - 0.3, 0, 0, -s * (Math.PI / 4));
    P.add(BOX(4.5, 15, 4.5), 0x4c4060, -13, G + 7.5, F + 2);
    P.add(CONE(3.6, 7, 4), 0x3a2e46, -13, G + 18.5, F + 2, 0, Math.PI / 4, 0);
    P.add(BOX(0.1, 1.6, 0.1), 0x1a1a1e, -13, G + 22.6, F + 2);
    P.add(BOX(7, 6, 7), 0x4e4264, 13.5, G + 3, F + 3.5);
    P.add(BOX(7.6, 0.2, 4.6), 0x3a2e46, 13.5, G + 7, F + 2, 0.6);
    window_(P, 13.5, 1.6, F, 0xd8c060);
    window_(P, -13, 12.6, F - 0.25, 0xd8c060, 1.0, 1.2);
    for (const [u, h] of WINDOWS) {
      const f = u === -13 ? F - 0.25 : u === 0 && h > 9 ? F - 0.3 : F;
      window_(P, u, h, f, 0x1e3020, 1.3, 1.8);
    }
    // the ride's doorway: dark, a skull over it
    P.add(BOX(3.6, 3.4, 0.1), 0x08060c, 0, G + 1.7, F - 0.05);
    P.add(BOX(4.2, 0.3, 0.2), 0x1c1424, 0, G + 3.5, F - 0.1);
    P.add(BALL(0.45, 8), 0xeae4d4, 0, G + 3.0, F - 0.3);
    for (const s of [-1, 1]) P.add(BALL(0.12, 5), 0x111111, s * 0.16, G + 3.05, F - 0.7);
    // the porch: floor, posts, roof, railings
    const PF = GH.PORCH;
    P.add(BOX(19, 0.4, 2.3), 0x2a2228, 0, G + 0.2, PF + 1.0);
    for (const u of [-9, -4.5, -2, 2, 4.5, 9]) P.add(BOX(0.22, 3.4, 0.22), 0x1c1424, u, G + 1.9, PF);
    P.add(BOX(19.4, 0.16, 2.8), 0x3a2e46, 0, G + 3.7, PF + 1.0, -0.12);
    for (const s of [-1, 1]) {
      P.add(BOX(6.9, 0.08, 0.1), 0x1c1424, s * 5.5, G + 1.3, PF);
      for (let u = 2.2; u < 9; u += 0.5) P.add(BOX(0.05, 0.9, 0.05), 0x1c1424, s * u, G + 0.85, PF);
    }
    // the crypt up the hill, and the chapel ruin with its belfry
    const [cu, cf] = GH.CRYPT;
    P.add(BOX(6, 4.2, 5), 0x5e5c66, cu, G + 2.1, cf + 2.5);
    P.add(BOX(4.6, 4.6, 0.4), 0x5e5c66, cu, G + 4.2, cf - 0.1, 0, 0, Math.PI / 4);
    for (const s of [-1, 1]) P.add(CYL(0.28, 0.3, 3.9, 8), 0x74727a, cu + s * 1.8, G + 1.95, cf - 0.4);
    P.add(BOX(1.9, 2.9, 0.1), 0x08060c, cu, G + 1.45, cf - 0.06);
    P.add(BOX(4.2, 0.3, 1.2), 0x5e5c66, cu, G + 0.15, cf - 0.8);
    const [hu, hf] = GH.CHAPEL;
    P.add(BOX(3.2, 11, 3.2), 0x4a4652, hu, G + 5.5, hf + 1.6);
    P.add(BOX(1.6, 2.0, 0.1), 0x08060c, hu, G + 9.6, hf - 0.02);
    P.add(CONE(2.4, 4, 4), 0x2a2630, hu + 0.3, G + 13, hf + 1.6, 0, Math.PI / 4, 0.12);
    P.add(BOX(8, 4.5, 0.6), 0x3e3a46, hu + 6, G + 2.25, hf + 3);
    P.add(BOX(3, 2.2, 0.6), 0x3e3a46, hu + 11.5, G + 1.1, hf + 3);
    // the far side: more stones, rocks, dead trees
    P.scatter(
      26,
      14,
      40,
      (u, f, R) => Math.abs(u) > 18 && headstone(P, u, f, 0.8 + R() * 0.5, Math.floor(R() * 3)),
      32
    );
    P.scatter(30, 10, 70, (u, f, R) => Math.abs(u) > 17 && P.rock(u, f, 0.5 + R() * 1.2, 0x3a3840), 60);
    P.scatter(14, 40, 80, (u, f, R) => Math.abs(u) > 24 && deadTree(P, u, f, 1 + R() * 0.6), 70);
  },
  slots: [],
  cover: null
};

LAYOUTS.carnival_ghosts = L => {
  const fixed = { fixed: true, rail: false };
  // pumpkins along the wall, crows on its pillars, pumpkins on two stones
  for (const s of [-1, 1])
    L.row({
      ...fixed,
      kind: "carnival_pumpkin",
      n: 3,
      f: GH.WALL - 0.32,
      u0: s * 3.5,
      u1: s * 9.5,
      base: 0.76,
      size: 0.45,
      tint: "orange",
      bank: 3
    });
  L.row({
    ...fixed,
    kind: "crow",
    n: 2,
    f: GH.WALL - 0.3,
    u0: -1.8,
    u1: 1.8,
    base: 1.56,
    size: 0.42,
    tint: "carnival_bat",
    bank: 2,
    mirror: 1
  });
  L.row({
    ...fixed,
    kind: "crow",
    n: 2,
    f: GH.WALL - 0.3,
    u0: -16.2,
    u1: 16.2,
    base: 1.56,
    size: 0.42,
    tint: "carnival_bat",
    bank: 2
  });
  L.row({
    ...fixed,
    kind: "carnival_pumpkin",
    n: 2,
    f: 13.85,
    u0: -2.8,
    u1: 2.8,
    base: 1.17,
    size: 0.42,
    tint: "orange",
    bank: 2
  });
  // bats hanging in the dead trees
  for (const [u, f, s] of DEAD.slice(0, 3)) {
    const a = branchEnd(u, f, s, -1, 3.4);
    const b = branchEnd(u, f, s, 1, 3.4);
    L.row({
      ...fixed,
      kind: "carnival_bat",
      n: 2,
      f: f - 0.3,
      u0: a[0],
      u1: b[0],
      base: a[1] - G - 0.45,
      size: 0.5,
      tint: "carnival_bat",
      bank: 2
    });
  }
  // pumpkins on the porch rail
  for (const s of [-1, 1])
    L.row({
      ...fixed,
      kind: "carnival_pumpkin",
      n: 2,
      f: GH.PORCH - 0.2,
      u0: s * 5.6,
      u1: s * 7.8,
      base: 1.34,
      size: 0.44,
      tint: "orange",
      bank: 2
    });
  // up the hill: bats on the crypt and in the belfry, an owl in the far tree
  const [cu, cf] = GH.CRYPT;
  L.row({
    ...fixed,
    kind: "carnival_bat",
    n: 2,
    f: cf - 0.45,
    u0: cu - 2.4,
    u1: cu + 2.4,
    base: 4.2,
    size: 0.5,
    tint: "carnival_bat",
    bank: 2
  });
  L.row({
    ...fixed,
    kind: "carnival_bat",
    n: 2,
    f: GH.CHAPEL[1] - 0.3,
    u0: GH.CHAPEL[0] - 0.5,
    u1: GH.CHAPEL[0] + 0.5,
    base: 9.0,
    size: 0.5,
    tint: "carnival_bat",
    bank: 2
  });
  const [ou, fo, so] = DEAD[3];
  const o = branchEnd(ou, fo, so, -1, 3.4);
  L.row({
    ...fixed,
    kind: "owl",
    n: 1,
    f: fo - 0.3,
    u0: o[0],
    u1: o[0],
    base: o[1] - G,
    size: 0.6,
    tint: "brown",
    pts: 50
  });
  // out of the coffins
  L.pops({
    fixed: true,
    f: GH.COFFIN - 0.1,
    at: COFFINS.map(u => [u, 0.15]),
    size: 1.7,
    kinds: [
      ["carnival_skeleton", 75],
      ["carnival_ghost", 25]
    ]
  });
  // out from behind the stone angels (and the lost kid: don't)
  L.pops({
    fixed: true,
    peek: true,
    f: ANGELS[0][1] + 0.6,
    at: ANGELS.map(([u]) => [u, 0]),
    size: 1.3,
    slide: 1.5,
    kinds: [
      ["carnival_ghost", 70],
      ["carnival_kid", 30, { dont: true }]
    ]
  });
  // in the house's windows
  for (const [u, h] of WINDOWS) {
    const f = (u === -13 ? GH.HOUSE - 0.25 : u === 0 && h > 9 ? GH.HOUSE - 0.3 : GH.HOUSE) - 0.25;
    L.pops({
      fixed: true,
      f,
      at: [[u, h + 0.1]],
      size: 1.4,
      period: [5, 8],
      kinds: [
        ["carnival_ghost", 45],
        ["carnival_skeleton", 35],
        ["carnival_bat", 10],
        ["carnival_kid", 10, { dont: true }]
      ]
    });
  }
  // the crypt's door
  L.pops({
    fixed: true,
    f: cf - 0.3,
    at: [[cu, 0.3]],
    size: 1.8,
    period: [6, 9],
    kinds: [
      ["carnival_ghost", 60],
      ["carnival_skeleton", 40]
    ]
  });
};

// Up out of a grave, through the gate and at you.
function rise(R, add, t, c) {
  const [u, f] = pick(R, RISERS);
  add(
    t,
    "carnival_skeleton",
    rush(
      R,
      [
        [u, f - 1.2, G - 1.7],
        [u, f - 1.2, G],
        [u * 0.4, GH.WALL + 1.5, G],
        [R(-0.8, 0.8), GH.WALL - 1, G],
        [R(-6, 6), R(6.5, 8.5), G]
      ],
      R(1.8, 2.5) * c.S
    )
  );
}
function haunt(R, add, t, c) {
  add(t, "carnival_ghost", across(R, { v: R(3.5, 5.5) * c.S, f: R(13, 30), h: R(-0.5, 3), amp: 0.6, weave: 2 }));
}
function batFlight(R, add, t, c) {
  add(t, "carnival_bat", dart(R, { v: R(7, 10) * c.S, f: R(12, 32), h: R(1, 6) }));
}
// The ride's cars out of the house, down to the front and away along it.
function ghostTrain(R, add, t, c, cars) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const h = G + 0.2;
  const pts = [
    [0, GH.HOUSE + 1, h],
    [0, GH.TRACK + 1.4, h],
    [dir * 2.5, GH.TRACK, h],
    [dir * 31, GH.TRACK, h]
  ];
  const v = R(5, 6.5) * c.S;
  for (let k = 0; k < cars; k++) {
    const w = walk(pts, v, 0.02);
    add(t + k * (2.4 / v), "carnival_ghostcar", { dur: w.time, pos: w.pos });
  }
}
function jack(R, add, t) {
  const [u, f] = pick(R, ANGELS.concat(HEADSTONES.slice(4, 8)));
  add(t, "carnival_jack", toss(R, { u, f: f + 0.4, h: G + 0.6, vh: R(6.5, 8.5), vu: R(-1.6, 1.6), vf: -R(0.5, 1.5) }));
}
function lostKid(R, add, t) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(t, "carnival_kid", cross(R, { u0: -s * 14, u1: s * 14, f: R(7.6, 8.6), v: 1.2, bob: 0.05 }));
}

const ghostWave = (R, add, c) => {
  if (c.x2) {
    // midnight: the graves open
    for (let k = 0; k < 8; k++) rise(R, add, 1 + k * 2.6, c);
    for (let k = 0; k < 12; k++) batFlight(R, add, 0.5 + k * 1.9, c);
    for (let k = 0; k < 4; k++) haunt(R, add, 2 + k * 5.5, c);
    ghostTrain(R, add, 4, c, 3);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 4) for (let j = 0; j < 4 + n(3); j++) batFlight(R, add, R(1, 24), c);
  if (k === 1 || k === 3 || k === 5) for (let j = 0; j < 1 + n(1); j++) rise(R, add, R(1, 16), c);
  if (k === 1 || k === 2 || k === 4) for (let j = 0; j < 1 + n(1.5); j++) haunt(R, add, R(1, 22), c);
  if (k === 2 || k === 5) ghostTrain(R, add, R(1, 12), c, 2);
  if (k === 3 || k === 5) for (let j = 0; j < 2 + n(2); j++) jack(R, add, R(1, 24));
  if (k === 2) flyers(["crow", "vulture"], R, add, c, 2);
  if (R(0, 1) < 0.3) lostKid(R, add, R(2, 8));
};

// ---- Level 4: the Ferris wheel and the coaster ------------------------------------

// Late at night on the rides: the prize stall up front (its shelves at f
// STALL, the counter at COUNTER), game booths, the high striker; the wheel
// (FW: hub at u U, H up, facing you at f F, radius R, a turn every REV s) on
// the left; the coaster's track (COASTER: [u, f, h], a closed loop) on the
// right, its station along the front straight.
const RIDE = { STALL: 13.4, COUNTER: 11.2, REV: 64 };
const FW = { U: -13, F: 38, R: 11, H: 14.2 };
const BOOTHS = [
  [-9.5, 18.5, "RING TOSS"],
  [9.5, 18.5, "HOOK A DUCK"]
];
const STRIKER = [5.6, 20.6];
const COASTER = [
  [22, 25, 1.6],
  [12, 25, 1.6],
  [5, 25, 1.7],
  [1.5, 26.3, 2.2],
  [0.3, 28.8, 3.0],
  [1.8, 31.3, 4.0],
  [5, 33, 6],
  [10, 33, 11],
  [14, 33, 15],
  [16.6, 33, 16],
  [19, 33, 14.6],
  [22, 33, 8.5],
  [24.5, 33, 3.6],
  [27, 33, 2.3],
  [29.5, 33, 6.4],
  [31.6, 32.8, 7.6],
  [33.6, 31.8, 7],
  [35, 29.8, 5.4],
  [35.2, 27.4, 3.8],
  [33.8, 25.6, 2.7],
  [30.5, 24.7, 2],
  [26.5, 24.8, 1.7]
];
const TRACK = new THREE.CatmullRomCurve3(
  COASTER.map(([u, f, h]) => new THREE.Vector3(u, h, f)),
  true
);
// The ride round it: distance and time at each point, faster lower down.
const LAP = (() => {
  const pts = TRACK.getSpacedPoints(240);
  const top = Math.max(...pts.map(p => p.y));
  const S = [0];
  const T = [0];
  for (let k = 1; k < pts.length; k++) {
    const len = pts[k].distanceTo(pts[k - 1]);
    const v = Math.sqrt(25 + 2 * 9.8 * (top - (pts[k].y + pts[k - 1].y) / 2));
    S.push(S[k - 1] + len);
    T.push(T[k - 1] + len / v);
  }
  return { pts, S, T, L: S[S.length - 1], time: T[T.length - 1] };
})();
function lapAt(arr, x) {
  let k = 1;
  while (k < arr.length - 1 && arr[k] < x) k++;
  return [k, (x - arr[k - 1]) / Math.max(1e-6, arr[k] - arr[k - 1])];
}
function coasterAt(s, out) {
  const L = LAP;
  const d = ((s % L.L) + L.L) % L.L;
  const [k, e] = lapAt(L.S, d);
  const a = L.pts[k - 1];
  const b = L.pts[k];
  return out.set(a.x + (b.x - a.x) * e, a.z + (b.z - a.z) * e, G + a.y + (b.y - a.y) * e + 0.12);
}
// A train of three cars, round once (or more), a car's length apart.
function train(R, add, t, c, laps = 1) {
  const S = c.S * R(0.95, 1.1);
  const cars = ["carnival_coasterR", "carnival_coasterY", "carnival_coasterB"];
  cars.forEach((kind, k) =>
    add(t, kind, {
      dur: (LAP.time * laps) / S,
      pos: (tau, out) => {
        const T = tau * S;
        const n = Math.floor(T / LAP.time);
        const [j, e] = lapAt(LAP.T, T - n * LAP.time);
        const s = n * LAP.L + LAP.S[j - 1] + (LAP.S[j] - LAP.S[j - 1]) * e;
        return coasterAt(s - k * 2.3, out);
      }
    })
  );
}
// The wheel's gondolas, n round it all through the wave (the same wheel
// wave after wave: a gondola shot is back next wave).
function wheelRing(add, c, n) {
  const w = TAU / RIDE.REV;
  for (let k = 0; k < n; k++)
    add(0, GONDOLAS[k % GONDOLAS.length], {
      dur: WAVE,
      pos: (tau, out) => {
        const a = (k * TAU) / n - w * (c.w * WAVE + tau);
        return out.set(FW.U + FW.R * Math.cos(a), FW.F - 1.0, G + FW.H + FW.R * Math.sin(a));
      }
    });
}

function booth(P, u, f, w, c) {
  P.add(BOX(w, 3, 0.2), c, u, G + 1.5, f + 1.3);
  for (const s of [-1, 1]) P.add(BOX(0.16, 3.2, 1.6), 0xf4f1ea, u + (s * w) / 2, G + 1.6, f + 0.5);
  P.add(BOX(w, 1.0, 0.6), 0xc0182a, u, G + 0.5, f - 0.2);
  P.add(BOX(w + 0.1, 0.08, 0.75), 0xf4f1ea, u, G + 1.04, f - 0.2);
  awning(P, u - w / 2, u + w / 2, f + 0.3, G + 3.3, 2.0, [0xf4f1ea, 0xc0182a]);
  garland(P, [u - w / 2, G + 3.1, f - 0.7], [u + w / 2, G + 3.1, f - 0.7], 10, 0.15, BULBS, 0.1);
}
function lamp(P, u, f) {
  P.add(CYL(0.06, 0.09, 3.6, 6), 0x2a2a3a, u, G + 1.8, f + 0.1);
  P.add(BOX(0.7, 0.06, 0.06), 0x2a2a3a, u, G + 3.55, f + 0.1);
  P.add(BALL(0.18, 6), 0xfff1a8, u, G + 3.75, f + 0.1);
}
const LAMPS = [
  [-6.5, 16.5],
  [6.5, 16.5],
  [-17, 24],
  [23, 20]
];

WORLDS.carnival_rides = {
  sky: {
    top: "#090a26",
    mid: "#24245e",
    horizon: "#b0508a",
    ground: "#1a1424",
    stars: true,
    clouds: 4,
    cloud: "rgba(200,120,200,0.22)",
    hills: [{ colour: "#1a1430", height: 5, rough: 3, phase: 2 }],
    skyline: "#140f22",
    windows: "#ffd27a",
    seed: 63
  },
  fog: 0x2a1e3e,
  signs: [
    ["PRIZES", 0, G + 4.3, RIDE.COUNTER - 1.0, 3.4, 0.8, "#c0182a", "#fff4c0"],
    ["THE COMET", 13, G + 3.85, 23.25, 4.2, 0.7, "#1a2a6a", "#ffd24a"],
    ["STARLIGHT WHEEL", FW.U, G + 0.3, FW.F - 2.56, 4.0, 0.48, "#2a1a5a", "#ffd24a"],
    ...BOOTHS.map(([u, f, t]) => [t, u, G + 3.75, f - 0.75, 3.4, 0.6, "#2f6fe8", "#fff4c0"]),
    ["POPCORN", 11, G + 2.45, 9.0, 1.5, 0.4, "#c0182a", "#fff4c0"],
    ["TEST YOUR STRENGTH", STRIKER[0], G + 0.75, STRIKER[1] - 0.7, 2.4, 0.38, "#f2c230", "#3a1a0a"]
  ],
  build(P) {
    P.ground(0x1e2a22, [
      { u: 0, f: 18, r: 11, c: 0x4a3e3a, sx: 1.6, sz: 1.4 },
      { u: 14, f: 29, r: 12, c: 0x3a3438, sx: 1.8, sz: 0.6 },
      { u: FW.U, f: FW.F, r: 7, c: 0x3a3438, sx: 1.4, sz: 0.8 }
    ]);
    // the prize stall: shelves, counter, awning, lights
    const S = RIDE.STALL;
    P.add(BOX(9, 3.4, 0.2), 0x6a2a5a, 0, G + 1.7, S + 0.35);
    for (const h of [1.2, 1.85, 2.5]) P.add(BOX(8.6, 0.08, 0.45), 0xf2c230, 0, G + h - 0.04, S + 0.12);
    for (const s of [-1, 1]) P.add(BOX(0.2, 3.6, 2.6), 0xf4f1ea, s * 4.6, G + 1.8, S - 0.9);
    P.add(BOX(11.6, 1.0, 0.7), 0xc0182a, 0, G + 0.5, RIDE.COUNTER);
    P.add(BOX(11.8, 0.08, 0.85), 0xf4f1ea, 0, G + 1.04, RIDE.COUNTER);
    awning(P, -5, 5, S - 1.1, G + 3.6, 2.8, [0xc0182a, 0xf4f1ea]);
    garland(P, [-5, G + 3.3, RIDE.COUNTER - 0.4], [5, G + 3.3, RIDE.COUNTER - 0.4], 16, 0.2, BULBS, 0.1);
    // the balloon man's cart, the popcorn stand
    P.add(BOX(1.6, 0.9, 0.9), 0x2f6fe8, -11, G + 0.75, 8.9);
    for (const s of [-1, 1]) P.add(TORUS(0.35, 0.05, 12), 0x2a2a2a, -11 + s * 0.6, G + 0.35, 8.9 + 0.48);
    P.add(BOX(1.6, 1.0, 1.0), 0xc0182a, 11, G + 0.5, 9.6);
    P.add(BOX(1.4, 1.0, 0.9), 0xfff0b0, 11, G + 1.5, 9.6);
    P.add(CONE(1.2, 0.6, 4), 0xf4f1ea, 11, G + 2.3, 9.6, 0, Math.PI / 4, 0);
    // the game booths, the high striker, lamps, strings of lights
    for (const [u, f] of BOOTHS) booth(P, u, f, 5, u < 0 ? 0x3a6a2a : 0x2a4a8a);
    const [su, sf] = STRIKER;
    P.add(BOX(1.2, 0.3, 1.2), 0xc0182a, su, G + 0.15, sf);
    P.add(BOX(0.35, 6, 0.25), 0xf4f1ea, su, G + 3, sf + 0.2);
    for (let k = 0; k < 6; k++)
      P.add(BOX(0.37, 0.12, 0.27), [0x3ab54a, 0xf2c230, 0xe86a1a, 0xe8344a][k % 4], su, G + 0.9 + k * 0.85, sf + 0.19);
    P.add(BOX(0.6, 0.5, 0.25), 0xf2c230, su, G + 6.2, sf + 0.25);
    for (const [u, f] of LAMPS) lamp(P, u, f);
    garland(P, [-6.5, G + 3.6, 16.6], [-17, G + 3.6, 24.1], 16, 0.8, BULBS);
    garland(P, [6.5, G + 3.6, 16.6], [23, G + 3.6, 20.1], 18, 0.8, BULBS);
    garland(P, [-6.5, G + 3.6, 16.6], [6.5, G + 3.6, 16.6], 16, 0.9, BULBS);
    // benches and bins along the front
    for (const s of [-1, 1]) {
      P.add(BOX(2.2, 0.08, 0.6), 0x8a5a3a, s * 6.5, G + 0.5, 4.2);
      P.add(BOX(2.2, 0.5, 0.08), 0x8a5a3a, s * 6.5, G + 0.85, 4.5);
      for (const x of [-0.9, 0.9]) P.add(BOX(0.08, 0.5, 0.6), 0x2a2a3a, s * 6.5 + x, G + 0.25, 4.25);
      P.add(CYL(0.3, 0.26, 0.9, 10), 0x2a5a3a, s * 9.2, G + 0.45, 4.4);
      P.add(CYL(0.32, 0.32, 0.06, 10), 0x3a7a4a, s * 9.2, G + 0.9, 4.4);
    }
    // the Ferris wheel: rim, spokes, hub, legs, lights, its platform and fence
    const { U, F, R: WR, H } = FW;
    P.add(TORUS(WR, 0.22, 48), 0xe8e8f0, U, G + H, F);
    P.add(TORUS(WR * 0.48, 0.12, 24), 0xe8e8f0, U, G + H, F);
    for (let k = 0; k < 8; k++) P.add(BOX(0.12, 2 * WR, 0.1), 0xd8d8e8, U, G + H, F, 0, 0, (k * Math.PI) / 8);
    P.add(CYL(0.9, 0.9, 1.4, 12), 0xf2c230, U, G + H, F, Math.PI / 2);
    for (const s of [-1, 1])
      for (const d of [-1.2, 1.2])
        P.add(
          BOX(0.4, Math.hypot(6.4, H), 0.4),
          0xb8b8c8,
          U + s * 3.2,
          G + H / 2,
          F + d,
          0,
          0,
          s * Math.asin(6.4 / Math.hypot(6.4, H))
        );
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * TAU;
      P.add(BALL(0.17, 4), BULBS[k % 4], U + (WR + 0.28) * Math.cos(a), G + H + (WR + 0.28) * Math.sin(a), F - 0.15);
    }
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU;
      for (const r of [3.5, 7.5])
        P.add(BALL(0.13, 4), 0xfff1a8, U + r * Math.cos(a), G + H + r * Math.sin(a), F - 0.12);
    }
    P.add(BOX(9, 0.6, 5), 0x4a3a4a, U, G + 0.3, F);
    P.add(BOX(9, 0.06, 0.06), 0xf2c230, U, G + 1.3, F - 2.55);
    for (let u = U - 4.4; u <= U + 4.5; u += 1.1) P.add(BOX(0.05, 0.7, 0.05), 0xf2c230, u, G + 0.95, F - 2.55);
    // the coaster: rails, ties, supports, lights; the station
    const rails = TRACK.getSpacedPoints(76);
    for (let k = 1; k < rails.length; k++) {
      const a = rails[k - 1];
      const b = rails[k];
      const du = b.x - a.x;
      const df = b.z - a.z;
      const l = Math.hypot(du, df) || 1;
      const nu = -df / l;
      const nf = du / l;
      for (const o of [-0.45, 0.45])
        seg(P, [a.x + nu * o, G + a.y, a.z + nf * o], [b.x + nu * o, G + b.y, b.z + nf * o], 0.1, 0.12, 0xd8e8f8);
      if (k % 2)
        seg(
          P,
          [a.x - nu * 0.55, G + a.y - 0.08, a.z - nf * 0.55],
          [a.x + nu * 0.55, G + a.y - 0.08, a.z + nf * 0.55],
          0.2,
          0.08,
          0x3a4a6a
        );
      if (k % 3 === 0 && a.y > 2.2)
        for (const o of [-0.45, 0.45]) P.add(CYL(0.07, 0.1, a.y, 5), 0x8a9ab0, a.x + nu * o, G + a.y / 2, a.z + nf * o);
      if (k % 3 === 0 && a.y > 7)
        seg(
          P,
          [a.x - nu * 0.45, G + 0.3, a.z - nf * 0.45],
          [a.x + nu * 0.45, G + a.y - 0.3, a.z + nf * 0.45],
          0.08,
          0.08,
          0x8a9ab0
        );
      if (k % 2 === 0) P.add(BALL(0.1, 4), BULBS[k % 4], a.x + nu * 0.6, G + a.y + 0.08, a.z + nf * 0.6);
    }
    P.add(BOX(12, 1.3, 1.6), 0x3a3a5a, 13, G + 0.65, 26.3);
    for (const u of [7.2, 18.8]) for (const f of [23.6, 26.9]) P.add(CYL(0.1, 0.1, 4.3, 6), 0xf4f1ea, u, G + 2.15, f);
    P.add(BOX(13, 0.2, 3.6), 0x1a2a6a, 13, G + 4.3, 25.2);
    P.add(BOX(13.1, 0.12, 0.12), 0xf2c230, 13, G + 4.2, 23.4);
    garland(P, [6.6, G + 4.1, 23.35], [19.4, G + 4.1, 23.35], 18, 0.05, BULBS, 0.09);
    // far off: the big top, balloons over it, the town's lights
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU;
      P.add(
        BOX(3.6, 5, 0.2),
        k % 2 ? 0xd8282a : 0xf4ecd8,
        2 + Math.cos(a) * 7.6,
        G + 2.5,
        62 + Math.sin(a) * 7.6,
        0,
        -a + Math.PI / 2,
        0
      );
    }
    P.add(CONE(10.5, 7, 14), 0xd8282a, 2, G + 8.5, 62);
    P.add(CYL(0.08, 0.08, 3, 4), 0xf2c230, 2, G + 13, 62);
    garland(P, [2, G + 12, 62], [-12, G + 0.5, 55], 14, 0.5, BULBS);
    garland(P, [2, G + 12, 62], [16, G + 0.5, 55], 14, 0.5, BULBS);
    P.scatter(30, 50, 90, (u, f) => Math.abs(u) > 26 && P.oak(u, f, P.r(1, 1.5), 0x1a2a22), 90);
  },
  slots: [],
  cover: null
};

LAYOUTS.carnival_rides = L => {
  const fixed = { fixed: true, rail: false };
  const S = RIDE.STALL;
  // the prizes on the stall's shelves
  L.row({
    ...fixed,
    kind: "elephant",
    n: 4,
    f: S,
    u0: -3,
    u1: 3,
    base: 2.54,
    size: 0.55,
    tint: ["blue", "pink"],
    bank: 4
  });
  L.row({ ...fixed, kind: "duck", n: 5, f: S, u0: -3.4, u1: 3.4, base: 1.89, size: 0.36, tint: "yellow", bank: 5 });
  L.row({
    ...fixed,
    kind: "star",
    n: 5,
    f: S,
    u0: -3.4,
    u1: 3.4,
    base: 1.24,
    size: 0.38,
    tint: ["gold", "pink"],
    bank: 5
  });
  // the balloon man's balloons, the striker's bell, the lamps
  L.row({
    ...fixed,
    perch: true,
    wood: 0xf4f1ea,
    kind: "carnival_balloon",
    n: 5,
    f: 8.6,
    u0: -12.2,
    u1: -9.8,
    base: 2.5,
    size: 0.5,
    tint: ["red", "blue", "yellow", "green", "pink"],
    bank: 5
  });
  L.row({
    ...fixed,
    kind: "bell",
    n: 1,
    f: STRIKER[1] - 0.05,
    u0: STRIKER[0],
    u1: STRIKER[0],
    base: 6.5,
    size: 0.5,
    tint: "gold",
    pts: 50
  });
  L.row({ ...fixed, kind: "lantern", n: 2, f: 16.45, u0: -6.2, u1: 6.2, base: 3.05, size: 0.4, tint: "gold", bank: 2 });
  L.row({ ...fixed, kind: "lantern", n: 1, f: 23.95, u0: -16.7, u1: -16.7, base: 3.05, size: 0.4, tint: "gold" });
  L.row({ ...fixed, kind: "lantern", n: 1, f: 19.95, u0: 22.7, u1: 22.7, base: 3.05, size: 0.4, tint: "gold" });
  // stars along the coaster station's roof, ducks on the wheel's fence
  L.row({
    ...fixed,
    kind: "star",
    n: 5,
    f: 24.6,
    u0: 8.6,
    u1: 17.4,
    base: 4.42,
    size: 0.5,
    tint: ["gold", "red"],
    bank: 5
  });
  L.row({
    ...fixed,
    kind: "duck",
    n: 4,
    f: FW.F - 2.7,
    u0: FW.U - 3.3,
    u1: FW.U + 3.3,
    base: 1.33,
    size: 0.42,
    tint: "yellow",
    bank: 4
  });
  // far off: balloons tethered over the big top
  L.row({
    ...fixed,
    perch: true,
    wood: 0x2a2a2a,
    kind: "carnival_balloon",
    n: 3,
    f: 53.5,
    u0: -6,
    u1: 10,
    base: 9.5,
    size: 1.2,
    tint: ["red", "blue", "yellow"],
    bank: 3
  });
  // behind the counters: the stall's barkers, the booths', the station's riders
  L.pops({
    fixed: true,
    f: RIDE.COUNTER + 0.35,
    at: [
      [-5.15, 1.0],
      [5.15, 1.0]
    ],
    size: 1.3,
    kinds: [
      ["carnival_clown", 85],
      ["carnival_kid", 15, { dont: true }]
    ]
  });
  for (const [u, f] of BOOTHS)
    L.pops({
      fixed: true,
      f: f + 0.15,
      at: [
        [u - 1.2, 1.0],
        [u + 1.2, 1.0]
      ],
      size: 1.3,
      busy: 0.85,
      kinds: [
        ["carnival_clown", 80],
        ["carnival_kid", 20, { dont: true }]
      ]
    });
  L.pops({
    fixed: true,
    f: 26.1,
    at: [
      [9.5, 1.3],
      [13, 1.3],
      [16.5, 1.3]
    ],
    size: 1.4,
    busy: 0.85,
    kinds: [
      ["carnival_clown", 70],
      ["carnival_kid", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 9.3,
    at: [[12.3, 0.9]],
    size: 1.3,
    kinds: [["carnival_clown", 100]]
  });
  L.pops({
    fixed: true,
    f: FW.F - 2.3,
    at: [
      [FW.U - 2.2, 0.6],
      [FW.U + 2.2, 0.6]
    ],
    size: 1.4,
    period: [5, 8],
    kinds: [
      ["carnival_clown", 75],
      ["carnival_kid", 25, { dont: true }]
    ]
  });
};

const ridesWave = (R, add, c) => {
  wheelRing(add, c, c.x2 ? 6 : 5);
  if (c.x2) {
    // the coaster runs away: train after train, and the balloon release
    for (let k = 0; k < 4; k++) train(R, add, 1 + k * 6, c);
    for (let k = 0; k < 10; k++) add(1 + k * 2.2, pick(R, BALLOONS), float(R, { v: R(2.2, 3.4) * c.S, f: R(10, 30) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  const trains = k === 3 || k === 5 ? 2 : 1 + (R(0, 1) < 0.4 ? 1 : 0);
  for (let j = 0; j < trains; j++) train(R, add, 1 + j * 13 + R(0, 4), c);
  const b = k === 1 || k === 4 ? 3 + n(2) : 1 + n(1);
  for (let j = 0; j < b; j++) add(R(1, 22), pick(R, BALLOONS), float(R, { v: R(1.6, 2.8) * c.S, f: R(9, 24) }));
  if (k === 2)
    for (let j = 0; j < 2; j++) add(R(1, 14), "bigBalloon", float(R, { v: R(1.2, 1.8) * c.S, f: R(14, 26) }));
  if (k === 5)
    for (let j = 0; j < 2; j++) add(R(1, 20), "star", across(R, { v: R(9, 12) * c.S, h: R(4, 9), weave: 1.5 }));
  if (R(0, 1) < 0.25) add(R(2, 8), "carnival_kid", cross(R, { u0: -14, u1: 14, f: R(6.5, 7.5), v: 1.3, bob: 0.05 }));
};

// ---- Level 5: the grand finale ----------------------------------------------------

// Midnight on the lakeshore. The launch rack along the front (f RACK), the
// mortars and crates behind it; the lake from LAKE to beyond the barges; the
// Ringmaster's floating stage at f STAGE (its deck DECK up), the fireworks
// barges either side at BARGE; the fair's lights across the water at f FAR.
const FIN = { RACK: 9, STAGE: 26, DECK: 0.8, BARGE: 32, FAR: 58, TOP: 14 };
const MORTARS = [
  [-11, 13.6],
  [0, 15],
  [11, 13.6]
];
const CRATES = [
  [-8.5, 11],
  [8.5, 11]
];
const LAUNCH = [
  ...MORTARS.map(([u, f]) => [u, f, G + 0.9]),
  [-18, FIN.BARGE, G + 0.8],
  [-16, FIN.BARGE, G + 0.8],
  [16, FIN.BARGE, G + 0.8],
  [18, FIN.BARGE, G + 0.8]
];

WORLDS.carnival_finale = {
  sky: {
    top: "#020210",
    mid: "#0c0a2c",
    horizon: "#3a1a4a",
    ground: "#08060e",
    sun: [12, 26, "#ff7ad8", 5],
    stars: true,
    clouds: 9,
    cloud: "rgba(255,140,220,0.2)",
    hills: [{ colour: "#0e0a1a", height: 4, rough: 3, phase: 0.5 }],
    skyline: "#0a0814",
    windows: "#ffb070",
    seed: 64
  },
  fog: 0x1a1430,
  signs: [
    ["THE GRAND FINALE", 0, G + FIN.DECK + 4.3, FIN.STAGE + 2.4, 6.4, 1.0, "#3a0a4a", "#ffd24a"],
    ["DANGER! FIREWORKS", 0, G + 0.55, FIN.RACK - 0.4, 3.2, 0.4, "#c0182a", "#fff4c0"]
  ],
  build(P) {
    P.ground(0x1a2418, [
      { u: 0, f: 30, r: 16, c: 0x14204a, sx: 3.2, sz: 0.85 },
      { u: 0, f: 10, r: 9, c: 0x3a3428, sx: 3, sz: 0.7 }
    ]);
    // light on the water
    for (let k = 0; k < 18; k++) {
      const u = -24 + ((k * 37) % 48);
      const f = 19 + ((k * 13) % 21);
      P.add(BOX(1.6 + (k % 3), 0.02, 0.12), [0xff7ad8, 0xffd24a, 0x8ad8ff][k % 3], u, G + 0.12, f);
    }
    // the launch rack, the mortars, the crates
    P.add(BOX(14, 0.12, 0.7), 0x6a4a2a, 0, G + 1.0, FIN.RACK);
    for (let u = -6.6; u <= 6.7; u += 2.2) P.add(BOX(0.12, 1.0, 0.12), 0x4a3420, u, G + 0.5, FIN.RACK);
    for (const [u, f] of MORTARS) {
      P.add(BOX(2.4, 0.8, 1.6), 0x5a4028, u, G + 0.4, f + 0.4);
      for (let k = 0; k < 6; k++)
        P.add(CYL(0.16, 0.16, 0.9, 8), 0x2a2a30, u - 0.8 + (k % 3) * 0.8, G + 1.05, f + 0.05 + Math.floor(k / 3) * 0.7);
    }
    for (const [u, f] of CRATES) {
      P.add(BOX(1.6, 0.9, 1.0), 0x8a6a3a, u, G + 0.45, f);
      P.add(BOX(1.62, 0.18, 1.02), 0xc0182a, u, G + 0.55, f);
      P.add(BOX(1.0, 0.6, 0.8), 0x8a6a3a, u + 0.2, G + 1.2, f + 0.1, 0, 0.3, 0);
    }
    // picnic blankets and hampers on the shore, lanterns along it
    for (const [u, f, c] of [
      [-9.5, 4.5, 0xc0182a],
      [-4, 3.2, 0x2f6fe8],
      [5, 4, 0xf2c230],
      [11, 3.4, 0x3ab54a]
    ]) {
      P.add(BOX(2.2, 0.03, 1.6), c, u, G + 0.02, f, 0, (u % 3) * 0.2, 0);
      P.add(BOX(0.6, 0.4, 0.4), 0x8a6a3a, u + 0.6, G + 0.2, f + 0.3);
    }
    for (let u = -16; u <= 16; u += 4) {
      if (!u) continue;
      P.add(CYL(0.03, 0.03, 1.1, 4), 0x2a2a2a, u, G + 0.55, 6.5);
      P.add(BALL(0.12, 5), [0xffd24a, 0xff6a7a, 0x8ad8ff][Math.abs(u / 4) % 3], u, G + 1.15, 6.5);
    }
    // the Catherine wheels' posts
    for (const u of [-13, -4, 4, 13]) P.add(BOX(0.12, 2.3, 0.12), 0x4a3420, u, G + 1.15, 16.1);
    // the stage: its barge, the arch of lights, the curtain
    const S = FIN.STAGE;
    P.add(BOX(13, FIN.DECK, 6), 0x3a2a22, 0, G + FIN.DECK / 2, S);
    P.add(BOX(13.1, 0.12, 6.1), 0xf2c230, 0, G + FIN.DECK, S);
    garland(P, [-6.5, G + 0.5, S - 3.05], [6.5, G + 0.5, S - 3.05], 20, 0, BULBS, 0.09);
    P.add(BOX(11, 5, 0.25), 0x1c1a6a, 0, G + FIN.DECK + 2.5, S + 2.6);
    for (let k = 0; k < 9; k++)
      P.add(
        BOX(0.3, 0.3, 0.04),
        0xf2c230,
        -4.4 + k * 1.1,
        G + FIN.DECK + 1.2 + (k % 2) * 1.5,
        S + 2.46,
        0,
        0,
        Math.PI / 4
      );
    for (const s of [-1, 1]) P.add(BOX(0.6, 3.2, 0.6), 0xf2c230, s * 5.8, G + FIN.DECK + 1.6, S + 2.2);
    P.add(new THREE.TorusGeometry(5.8, 0.25, 5, 22, Math.PI), 0xf2c230, 0, G + FIN.DECK + 3.2, S + 2.2);
    for (let k = 0; k <= 16; k++) {
      const a = (k / 16) * Math.PI;
      P.add(BALL(0.16, 4), BULBS[k % 4], 5.8 * Math.cos(a), G + FIN.DECK + 3.2 + 5.8 * Math.sin(a), S + 1.9);
    }
    // the fireworks barges
    for (const s of [-1, 1]) {
      P.add(BOX(7, 0.7, 3.6), 0x2a2420, s * 17, G + 0.35, FIN.BARGE + 0.6);
      P.add(BOX(6.4, 0.1, 0.1), 0x6a4a2a, s * 17, G + 2.1, FIN.BARGE - 0.15);
      for (const u of [14.6, 17, 19.4]) P.add(BOX(0.1, 1.4, 0.1), 0x6a4a2a, s * u, G + 1.4, FIN.BARGE - 0.15);
      for (let k = 0; k < 9; k++)
        P.add(
          CYL(0.15, 0.15, 0.8, 7),
          0x2a2a30,
          s * (15.2 + (k % 3) * 1.8),
          G + 1.1,
          FIN.BARGE + 0.6 + Math.floor(k / 3) * 0.7
        );
    }
    // across the water: the fair's wheel, the big top, the coaster, lights along the shore
    const W = { U: -20, F: 60, R: 8, H: 10.5 };
    P.add(TORUS(W.R, 0.16, 36), 0xe8e8f0, W.U, G + W.H, W.F);
    for (let k = 0; k < 6; k++) P.add(BOX(0.1, 2 * W.R, 0.1), 0xd8d8e8, W.U, G + W.H, W.F, 0, 0, (k * Math.PI) / 6);
    for (const s of [-1, 1])
      P.add(
        BOX(0.3, Math.hypot(4.5, W.H), 0.3),
        0xb8b8c8,
        W.U + s * 2.25,
        G + W.H / 2,
        W.F,
        0,
        0,
        s * Math.asin(4.5 / Math.hypot(4.5, W.H))
      );
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * TAU;
      P.add(
        BALL(0.18, 4),
        BULBS[k % 4],
        W.U + (W.R + 0.2) * Math.cos(a),
        G + W.H + (W.R + 0.2) * Math.sin(a),
        W.F - 0.1
      );
    }
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU;
      P.add(
        BOX(3.4, 4, 0.2),
        k % 2 ? 0xd8282a : 0xf4ecd8,
        FIN.TOP + Math.cos(a) * 7,
        G + 2,
        FIN.FAR + Math.sin(a) * 7,
        0,
        -a + Math.PI / 2,
        0
      );
    }
    P.add(CONE(9.5, 6, 14), 0xd8282a, FIN.TOP, G + 7, FIN.FAR);
    P.add(CYL(0.08, 0.08, 2, 4), 0xf2c230, FIN.TOP, G + 10.6, FIN.FAR);
    for (const [u, h] of [
      [28, 4],
      [31, 9],
      [34, 12.5],
      [37, 8],
      [40, 3]
    ])
      P.add(BOX(0.2, h, 0.2), 0xb8c8d8, u, G + h / 2, 55);
    for (let k = 1; k < 5; k++) {
      const a = [
        [28, 4],
        [31, 9],
        [34, 12.5],
        [37, 8],
        [40, 3]
      ];
      seg(P, [a[k - 1][0], G + a[k - 1][1], 55], [a[k][0], G + a[k][1], 55], 0.6, 0.12, 0xd8e8f8);
    }
    garland(P, [-36, G + 2.5, 51], [-8, G + 2.5, 50], 18, 0.6, BULBS, 0.15);
    garland(P, [14, G + 2.5, 50], [40, G + 2.5, 51], 18, 0.6, BULBS, 0.15);
    garland(P, [-8, G + 2.5, 50], [14, G + 2.5, 50], 14, 0.6, BULBS, 0.15);
    // bursts high over the fair across the water
    for (const [u, h, f, r, c1, c2] of [
      [-26, 26, 62, 5, 0xff6ad8, 0xffd24a],
      [22, 30, 66, 6, 0x6ad8ff, 0xffffff],
      [-2, 34, 70, 4.5, 0xffd24a, 0xff6a6a]
    ])
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * TAU;
        for (const [e, col, rr] of [
          [1, c1, 0.35],
          [0.6, c2, 0.25]
        ])
          P.add(BALL(rr, 4), col, u + r * e * Math.cos(a), G + h + r * e * Math.sin(a), f);
      }
    P.scatter(36, 62, 92, (u, f) => P.oak(u, f, P.r(1.1, 1.7), 0x141c18), 90);
    P.scatter(16, 8, 40, (u, f) => Math.abs(u) > 26 && P.bush(u, f, P.r(0.8, 1.3), 0x1e2a1e), 50);
  },
  slots: [],
  cover: null
};

LAYOUTS.carnival_finale = L => {
  const fixed = { fixed: true, rail: false };
  const S = FIN.STAGE;
  // rockets on the launch rack, Catherine wheels on their posts
  L.row({
    ...fixed,
    kind: "carnival_rocket",
    n: 8,
    f: FIN.RACK - 0.1,
    u0: -6.2,
    u1: 6.2,
    base: 1.06,
    size: 0.8,
    tint: ["red", "blue", "gold", "green"],
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "star",
    n: 4,
    f: 16.0,
    u0: -13,
    u1: 13,
    base: 2.3,
    size: 0.55,
    tint: ["gold", "pink"],
    bank: 4
  });
  // the stage: stars on its pillars and over its name, the giant balloons
  L.row({
    ...fixed,
    kind: "star",
    n: 2,
    f: S + 1.85,
    u0: -5.8,
    u1: 5.8,
    base: FIN.DECK + 3.25,
    size: 0.55,
    tint: "gold",
    bank: 2
  });
  L.row({ ...fixed, kind: "star", n: 1, f: S + 2.0, u0: 0, u1: 0, base: 10.35, size: 0.7, tint: "gold", pts: 50 });
  L.row({
    ...fixed,
    perch: true,
    wood: 0x2a2a2a,
    kind: "carnival_balloon",
    n: 2,
    f: S - 2,
    u0: -8,
    u1: 8,
    base: 7,
    size: 1.6,
    tint: ["red", "blue"],
    bank: 2
  });
  L.row({
    ...fixed,
    perch: true,
    wood: 0x2a2a2a,
    kind: "carnival_balloon",
    n: 1,
    f: S + 3,
    u0: 0,
    u1: 0,
    base: 11.2,
    size: 1.6,
    tint: "yellow"
  });
  // rockets on the barges' racks
  for (const s of [-1, 1])
    L.row({
      ...fixed,
      kind: "carnival_rocket",
      n: 3,
      f: FIN.BARGE - 0.3,
      u0: s * 14.6,
      u1: s * 19.4,
      base: 2.15,
      size: 0.9,
      tint: ["red", "gold", "blue"],
      bank: 3
    });
  // across the water: a star on the big top, a balloon over the wheel, a star on the coaster
  L.row({
    ...fixed,
    kind: "star",
    n: 1,
    f: FIN.FAR - 0.3,
    u0: FIN.TOP,
    u1: FIN.TOP,
    base: 11.4,
    size: 1.0,
    tint: "gold"
  });
  L.row({ ...fixed, kind: "carnival_balloon", n: 1, f: 59.5, u0: -20, u1: -20, base: 19.2, size: 1.4, tint: "pink" });
  L.row({ ...fixed, kind: "star", n: 1, f: 54.7, u0: 34, u1: 34, base: 12.6, size: 1.0, tint: "gold" });
  // the crews behind the crates and the mortars
  L.pops({
    fixed: true,
    f: CRATES[0][1] + 0.65,
    at: CRATES.map(([u]) => [u, 0.9]),
    size: 1.25,
    period: [3.5, 6],
    busy: 0.9,
    kinds: [["carnival_clown", 100]]
  });
  for (const [u, f] of MORTARS)
    L.pops({
      fixed: true,
      f: f - 0.55,
      at: [[u, 0]],
      size: 1.3,
      period: [3.5, 6],
      busy: 0.9,
      kinds: [
        ["carnival_clown", 85],
        ["carnival_acrobat", 15, { dont: true }]
      ]
    });
  // on the stage: clowns, acrobats (don't), and now and then the Ringmaster
  L.pops({
    fixed: true,
    f: S + 1.6,
    at: [
      [-3, FIN.DECK],
      [3, FIN.DECK]
    ],
    size: 1.7,
    period: [3.5, 6],
    busy: 0.9,
    kinds: [
      ["carnival_clown", 60, { pts: 25 }],
      ["carnival_acrobat", 40, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: S + 1.6,
    at: [[0, FIN.DECK]],
    size: 1.8,
    period: [5, 8],
    busy: 0.9,
    kinds: [
      ["carnival_ringmaster", 25, { pts: 250 }],
      ["carnival_clown", 45, { pts: 25 }],
      ["carnival_acrobat", 30, { dont: true }]
    ]
  });
  // the barges' crews
  L.pops({
    fixed: true,
    f: FIN.BARGE + 1.6,
    at: [
      [-17, 0.7],
      [17, 0.7]
    ],
    size: 1.4,
    period: [3.5, 6],
    busy: 0.9,
    kinds: [["carnival_clown", 100]]
  });
};

// A shell up out of a mortar: it bursts at the top (gone), so get it on the way up.
function shell(R, add, t, c, at = pick(R, LAUNCH)) {
  const vh = R(15, 20) * Math.sqrt(c.S);
  const L = toss(R, { u: at[0] + R(-0.4, 0.4), f: at[1], h: at[2], vh, vu: R(-1.5, 1.5), vf: R(-1, 1) });
  add(t, pick(R, SHELLS), { dur: vh / 9.8, pos: L.pos });
}
// A volley: several shells from one mortar.
function salvo(R, add, t, c, n) {
  const at = pick(R, LAUNCH);
  for (let k = 0; k < n; k++) shell(R, add, t + k * R(0.15, 0.4), c, at);
}
// A rocket off the rack, spiralling up.
function rocket(R, add, t, c) {
  const u = R(-6, 6);
  const ph = R(0, 6);
  const sp = R(5, 8) * (R(0, 1) < 0.5 ? 1 : -1);
  const v = R(6, 8) * c.S;
  add(t, R(0, 1) < 0.5 ? "carnival_rocket" : "carnival_rocketB", {
    dur: 2.6,
    pos: (tau, out) => {
      const r = 0.6 * Math.min(1, tau);
      return out.set(
        u + r * Math.sin(ph + sp * tau),
        FIN.RACK + r * Math.cos(ph + sp * tau),
        G + 1.4 + v * tau + 1.2 * tau * tau
      );
    }
  });
}
function shoreClown(R, add, t, c) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  add(t, "carnival_clown", cross(R, { u0: -dir * 16, u1: dir * 16, f: R(5, 7), v: R(3.5, 5) * c.S, bob: 0.12 }));
}
// The Ringmaster across his stage, or (the last wave) out to take his bow.
function strut(R, add, t, c) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  add(
    t,
    "carnival_ringmaster",
    cross(R, { u0: -dir * 5, u1: dir * 5, f: FIN.STAGE + 0.6, h: FIN.DECK, v: 1.6 * c.S, stop: 2, bob: 0.04 })
  );
}
function bow(R, add, t, c) {
  const h = G + FIN.DECK;
  const w = walk(
    [
      [-5.4, FIN.STAGE + 1.4, h],
      [0, FIN.STAGE + 0.4, h]
    ],
    1.6 * c.S,
    0.04
  );
  add(t, "carnival_ringmaster", { dur: w.time + 8, pos: w.pos });
}

const finaleWave = (R, add, c) => {
  if (c.x2) {
    // the barrage: every mortar at once, and the Ringmaster's bow
    for (let k = 0; k < 10; k++) salvo(R, add, 1 + k * 2.5, c, 3);
    for (let k = 0; k < 6; k++) rocket(R, add, 2 + k * 3.8, c);
    bow(R, add, 5, c);
    for (let k = 0; k < 3; k++) add(3 + k * 7, "bigBalloon", float(R, { v: R(1.2, 1.8) * c.S, f: R(18, 30) }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 3) for (let j = 0; j < 4 + n(3); j++) shell(R, add, R(1, 25), c);
  if (k === 1 || k === 4 || k === 5) for (let j = 0; j < 2 + n(2); j++) rocket(R, add, R(1, 24), c);
  if (k === 2 || k === 5) for (let j = 0; j < 2 + n(1); j++) salvo(R, add, R(1, 22), c, 3 + Math.floor(R(0, 2)));
  if (k === 3 || k === 4) for (let j = 0; j < 1 + n(1); j++) shoreClown(R, add, R(1, 20), c);
  if (k === 1 || k === 4) for (let j = 0; j < 3 + n(2); j++) shell(R, add, R(1, 25), c);
  if (k === 2)
    for (let j = 0; j < 2; j++) add(R(1, 14), "bigBalloon", float(R, { v: R(1.2, 1.8) * c.S, f: R(18, 30) }));
  if (k === 3 && R(0, 1) < 0.35 + 0.3 * c.p) strut(R, add, R(2, 16), c);
};

// ---- Background sound ---------------------------------------------------------------

// The worlds' beds (shoots-art makeAmbience): d is 8.5 s at sr, its tail
// crossfaded over its head, so everything here goes by t % 8.
function crowdBed(d, sr, R, amp) {
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < d.length; i++) {
    const x = R() * 2 - 1;
    lp += 0.02 * (x - lp);
    lp2 += 0.2 * (x - lp2);
    const t = i / sr;
    d[i] += (lp2 - lp) * (0.6 + 0.25 * Math.sin(t * 2.7) + 0.15 * Math.sin(t * 4.9)) * amp;
  }
}
// One note (and again 8 s on, for the loop's seam); harm: odd harmonics' weights (an organ pipe).
function note(d, sr, t0, hz, dur, amp, harm = [1, 0.4, 0.2]) {
  for (const off of [0, 8]) {
    const i0 = Math.floor((t0 + off) * sr);
    const i1 = Math.min(d.length, Math.floor((t0 + off + dur) * sr));
    for (let i = Math.max(0, i0); i < i1; i++) {
      const t = (i - i0) / sr;
      const env = Math.min(1, t * 40) * Math.min(1, (dur - t) * 12);
      const w = TAU * hz * t * (1 + 0.004 * Math.sin(t * 34));
      let v = 0;
      harm.forEach((a, k) => (v += a * Math.sin(w * (2 * k + 1))));
      d[i] += amp * env * v;
    }
  }
}
AMBIENCE.carnival_bigtop = (d, sr, R) => {
  crowdBed(d, sr, R, 1.0);
  // the band's calliope: a waltz, oom-pah-pah, four bars to the loop
  const hz = s => 261.63 * 2 ** (s / 12);
  const roots = [0, 7, 5, 0];
  const tune = [
    [7, 9, 7, 4, 7, 12],
    [5, 7, 5, 2, 5, 11],
    [4, 5, 7, 9, 12, 9],
    [7, 4, 2, 4, 0, 0]
  ];
  for (let bar = 0; bar < 4; bar++) {
    const t = bar * 2;
    note(d, sr, t, hz(roots[bar] - 24), 0.5, 0.05);
    for (const b of [0.667, 1.333]) for (const s of [0, 4, 7]) note(d, sr, t + b, hz(roots[bar] + s - 12), 0.3, 0.015);
    tune[bar].forEach((s, k) => note(d, sr, t + k * 0.333, hz(s + 12), 0.3, 0.03));
  }
};
AMBIENCE.carnival_ghosts = (d, sr, R) => {
  let lp = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const y = t % 8;
    lp += 0.01 * (R() * 2 - 1 - lp);
    // wind, a wavering moan, a creaking door, an owl
    let v = lp * 3 * (0.6 + 0.4 * Math.sin((t * TAU) / 8));
    v += Math.sin(TAU * (260 + 90 * Math.sin(y * 0.8)) * t + 2 * Math.sin(t * 6)) * 0.018 * Math.sin((y * Math.PI) / 8);
    if (y > 2 && y < 2.9)
      v +=
        Math.sin(TAU * (180 + 420 * (y - 2)) * t) *
        (Math.sin(t * 190) > 0 ? 1 : 0.3) *
        0.02 *
        Math.sin(((y - 2) / 0.9) * Math.PI);
    for (const h0 of [5.2, 5.75])
      if (y > h0 && y < h0 + 0.4) v += Math.sin(TAU * 360 * t) * 0.04 * Math.sin(((y - h0) / 0.4) * Math.PI);
    d[i] += v;
  }
};
AMBIENCE.carnival_rides = (d, sr, R) => {
  crowdBed(d, sr, R, 0.8);
  let lp = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const y = t % 8;
    lp += 0.05 * (R() * 2 - 1 - lp);
    // the coaster: the chain's clack up the lift, then the roar down
    if (y > 0.8 && y < 3.6) {
      const c = (y * 9) % 1;
      if (c < 0.06) d[i] += (R() * 2 - 1) * 0.12 * (1 - c / 0.06);
    }
    if (y > 4 && y < 6.5) d[i] += lp * 1.6 * Math.sin(((y - 4) / 2.5) * Math.PI);
  }
};
AMBIENCE.carnival_finale = (d, sr, R) => {
  crowdBed(d, sr, R, 0.6);
  let lp = 0;
  const booms = [0.8, 2.9, 4.1, 6.3];
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const y = t % 8;
    lp += 0.03 * (R() * 2 - 1 - lp);
    // a boom, and the crackle after it
    for (const b of booms) {
      const e = y - b;
      if (e > 0 && e < 1.2) d[i] += (Math.sin(TAU * 52 * e) * 0.25 + lp * 2.5) * Math.exp(-e * 5);
      if (e > 0.3 && e < 1.1 && R() < 0.004) d[i] += (R() * 2 - 1) * 0.3;
    }
  }
};

// ---- The campaign ------------------------------------------------------------------

export const CARNIVAL = {
  name: "CARNIVAL NIGHT",
  first: "Step right up! A night at the fair",
  kinds,
  levels: [
    {
      world: "carnival_bigtop",
      name: "THE BIG TOP",
      story: "The show's on. Clowns, cannon and lions in the ring",
      music: "carnival",
      amb: "carnival_bigtop",
      indoor: true,
      legend: "CANNONBALL 50 · CLOWNS 50 · PINS AND BALLS 25  ·  A PIE IN THE FACE -10  ·  DON'T SHOOT THE ACROBATS",
      wave: bigtopWave,
      title: (w, x2) => (x2 ? "THE WHOLE COMPANY · DOUBLE POINTS" : null)
    },
    {
      world: "carnival_ghosts",
      name: "THE GHOST TRAIN",
      story: "All aboard the ghost train. Mind the lost kid",
      music: "carnival",
      amb: "carnival_ghosts",
      legend: "GHOSTS 50 · SKELETONS 50 (IF ONE GETS YOU -10) · BATS 25  ·  DON'T SHOOT THE LOST KID",
      wave: ghostWave,
      title: (w, x2) => (x2 ? "MIDNIGHT: THE GRAVES OPEN · DOUBLE POINTS" : null)
    },
    {
      world: "carnival_rides",
      name: "FERRIS WHEEL AND COASTER",
      story: "The rides are lit. Hit them on the wheel and the track",
      music: "carnival",
      amb: "carnival_rides",
      legend: "COASTER CARS 50 · WHEEL GONDOLAS 15 · BALLOONS 10  ·  DON'T SHOOT THE KIDS",
      wave: ridesWave,
      title: (w, x2) => (x2 ? "THE COASTER'S RUNAWAY · DOUBLE POINTS" : null)
    },
    {
      world: "carnival_finale",
      name: "THE GRAND FINALE",
      story: "Midnight fireworks. The Ringmaster takes his bow",
      music: "carnival",
      amb: "carnival_finale",
      legend: "SHELLS AND ROCKETS 25: GET THEM BEFORE THEY BURST  ·  THE RINGMASTER 250 TO 300",
      wave: finaleWave,
      title: (w, x2) => (x2 ? "THE FIREWORKS BARRAGE · DOUBLE POINTS" : null)
    }
  ],
  done: ["THE FAIR IS CLOSED FOR THE NIGHT", "WHAT A SHOW, SHOOTERS"]
};
