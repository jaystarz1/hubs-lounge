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
  BIRDS,
  AMBIENCE,
  part,
  merge,
  person
} from "./shoots-art";
import { LAYOUTS, PERSON, PLATE_SOUND } from "./plates";
import { SHAPES } from "./plates-shapes";
import { gunman, runner, thing, bird, DONT, run, toss, walk, cross, hover, pick, flyers } from "./shoot-paths";

// The Hostage Rescue campaign (Jay, 2026-10-24: "a multilevel game where we
// have to reach 5k points and then it changes"): a chase that ends with the
// gang's leader. Five levels:
//   1 THE SHOOT HOUSE       (the classic world, shoots.js SCREEN.hostage)
//   2 THE PARKING GARAGE    they got out of the house with hostages: a car park
//                           at night, three decks of cars; masked men behind the
//                           cars and pillars and on the decks, grenades off the
//                           decks, the getaway van making its run
//   3 THE AIRPORT           they've taken an airliner on the apron: men in its
//                           doors and windows, down the jet stairs, behind the
//                           baggage carts and the fuel truck; the crew get out
//                           (don't shoot them); the terminal and its tower
//   4 THE CARGO SHIP        the leader got away to sea: a freighter in a storm,
//                           men on the deck, on the containers, in the cranes'
//                           cabs and on the bridge; speedboats; its crew (don't)
//   5 THE TOWER             his last stand, a skyscraper's helipad at night:
//                           he walks a hostage to his helicopter now and then
//                           (300 if you get him, not her); rooftop units for
//                           cover, the towers round about; every double-points
//                           wave is the final breach
// Laid out as the other worlds are (u right, f downrange, h up from the roof
// deck, the ground at GROUND); shoots-art moves it all SHIFT m back and onto
// the lifted land.

const G = GROUND;

// ---- New outlines (the plates' atlas) ------------------------------------------

Object.assign(SHAPES, {
  // a traffic cone with its collars
  hostage_cone: {
    polys: [[20, 0, 26, 0, 40, 62, 46, 62, 46, 68, 0, 68, 0, 62, 6, 62]],
    marks: [
      [5, 15.5, 22, 30.5, 22],
      [5, 11, 42, 35, 42]
    ]
  },
  // a hard case: the ransom, the luggage
  hostage_case: {
    polys: [[0, 14, 70, 14, 70, 58, 0, 58]],
    lines: [[5, 25, 14, 25, 4, 45, 4, 45, 14]],
    marks: [
      [3, 18, 14, 18, 58],
      [3, 52, 14, 52, 58]
    ],
    dots: [
      [25, 20, 2.5],
      [45, 20, 2.5]
    ]
  },
  // a life ring (its hole painted on, so it's a target all over)
  hostage_ring: {
    svg: ["M 50 0 A 50 50 0 1 1 49.9 0 Z"],
    box: [0, 0, 100, 100],
    dots: [[50, 50, 24]],
    marks: [
      [10, 50, 1, 50, 25],
      [10, 50, 75, 50, 99],
      [10, 1, 50, 25, 50],
      [10, 75, 50, 99, 50]
    ]
  },
  // the getaway van, side on, facing left
  hostage_van: {
    polys: [
      [0, 38, 0, 27, 3, 23, 15, 20, 25, 6, 29, 3, 97, 3, 100, 6, 100, 40, 0, 40],
      [12, 42, 14.3, 36.3, 20, 34, 25.7, 36.3, 28, 42, 25.7, 47.7, 20, 50, 14.3, 47.7],
      [72, 42, 74.3, 36.3, 80, 34, 85.7, 36.3, 88, 42, 85.7, 47.7, 80, 50, 74.3, 47.7]
    ],
    marks: [
      [6, 25, 10, 21, 19],
      [7, 31, 11, 50, 11],
      [2, 54, 5, 54, 38],
      [3, 0, 31, 100, 31]
    ],
    dots: [
      [20, 42, 3.5],
      [80, 42, 3.5]
    ]
  },
  // a speedboat with two of them in it, facing left
  hostage_boat: {
    polys: [
      [0, 22, 34, 30, 98, 30, 98, 44, 30, 46, 12, 38],
      [46, 30, 50, 20, 62, 18, 64, 30],
      [96, 22, 104, 22, 104, 30, 102, 52, 98, 52, 98, 30],
      [66, 9, 78, 9, 77, 30, 67, 30],
      [68, 4, 69.2, 1.2, 72, 0, 74.8, 1.2, 76, 4, 74.8, 6.8, 72, 8, 69.2, 6.8],
      [81, 11, 91, 11, 90, 30, 82, 30],
      [82, 6, 83.2, 3.2, 86, 2, 88.8, 3.2, 90, 6, 88.8, 8.8, 86, 10, 83.2, 8.8]
    ],
    lines: [[3, 67, 14, 54, 12]],
    marks: [[3, 30, 37, 96, 37]]
  }
});
Object.assign(PLATE_SOUND, { hostage_cone: "thud", hostage_case: "thud", hostage_ring: "thud" });

// ---- New cut-outs ------------------------------------------------------------------

Object.assign(CARDS, {
  // the gang: balaclavas, a hoodie with a bandana up
  hostage_masked: (c, W, H) =>
    person(c, W, H, {
      body: "#2e322c",
      vest: "#4e5238",
      legs: "#1c1c20",
      mask: "#141414",
      skin: "#c8987a",
      belt: "#151515",
      gun: true,
      guns2: true
    }),
  hostage_hood: (c, W, H) =>
    person(c, W, H, {
      body: "#7a1e22",
      legs: "#2a3a5a",
      hair: "#5a1416",
      bandana: "#151515",
      masked: true,
      skin: "#b88a68",
      gun: true
    }),
  // don't shoot: the cabin crew, the ship's crew
  hostage_crew: (c, W, H) =>
    person(c, W, H, {
      body: "#1e2a5a",
      arms: "#1e2a5a",
      shirt: "#f4f4f0",
      tie: "#c0182a",
      dress: "#1e2a5a",
      trim: "#c0182a",
      hat: "#1e2a5a",
      hair: "#7a4a2a",
      longHair: true,
      skin: "#e8c0a0",
      lips: "#c04040",
      armsUp: true
    }),
  hostage_sailor: (c, W, H) =>
    person(c, W, H, {
      body: "#e8641a",
      legs: "#e8641a",
      stripes: true,
      hat: "#f2c230",
      hair: "#3a2a1a",
      skin: "#c8906a",
      tache: true,
      armsUp: true
    }),
  // the leader: black coat, red shirt, shades
  hostage_leader: (c, W, H) =>
    person(c, W, H, {
      body: "#151518",
      vest: "#26262c",
      shirt: "#9a1a1a",
      tie: "#151515",
      legs: "#151518",
      hat: "#101010",
      hair: "#2a2a2a",
      shades: true,
      tache: true,
      skin: "#c8946a",
      belt: "#3a2414",
      gun: true,
      guns2: true
    })
});
Object.assign(CARD_SIZE, {
  hostage_masked: [0.9, 1.8],
  hostage_hood: [0.9, 1.8],
  hostage_crew: [0.9, 1.8],
  hostage_sailor: [0.9, 1.8],
  hostage_leader: [0.95, 1.85]
});
for (const k of ["hostage_masked", "hostage_hood", "hostage_crew", "hostage_sailor", "hostage_leader"]) PERSON.add(k);

// ---- New thrown things, a bird -----------------------------------------------------

GEO.hostage_grenade = () =>
  merge([
    part(BALL(0.075, 8), 0x3a4a2a, 0, 0, 0, 0, 0, 0, 1, 1.25, 1),
    part(CYL(0.03, 0.03, 0.05, 6), 0x9a9a9a, 0, 0.1, 0),
    part(BOX(0.025, 0.12, 0.035), 0x9a9a9a, 0.045, 0.05, 0, 0, 0, -0.2),
    part(TORUS(0.022, 0.006, 8), 0xc8c8c8, -0.04, 0.12, 0)
  ]);
BIRDS.hostage_gull = {
  body: 0xf4f4f0,
  head: 0xf4f4f0,
  wing: 0xa8b0b8,
  beak: 0xf2c230,
  s: 1.0,
  tip: 0x222222,
  span: 1.4
};

// ---- Kinds -----------------------------------------------------------------------

// One of the gang on the move (50); he carries a rifle.
const mover = (cardKey, extra = {}) => ({ ...gunman(cardKey, 1.8), arrive: "rifle", ...extra });
const dont = (cardKey, extra = {}) => ({ ...gunman(cardKey, 1.8), pts: -25, sound: "wrong", ...DONT, ...extra });
const kinds = {
  hostage_mRun: mover("hostage_masked"),
  hostage_hRun: mover("hostage_hood"),
  hostage_bRun: mover("bad"),
  hostage_civRun: dont("hostage"),
  hostage_crewRun: dont("hostage_crew", { name: "THE CREW! DON'T SHOOT!" }),
  hostage_sailorRun: dont("hostage_sailor", { name: "THE CREW! DON'T SHOOT!" }),
  // the leader, and the hostage he walks in front of him
  hostage_leaderRun: { ...gunman("hostage_leader", 1.85), pts: 300, arrive: "pistol", name: "THE LEADER!" },
  hostage_heldRun: dont("hostage", { name: "HE'S GOT A HOSTAGE!" }),
  hostage_van: { ...runner("hostage_van", 0xd8d8d2, 2.3, 1.0, "clank"), name: "THE GETAWAY VAN" },
  hostage_vanY: { ...runner("hostage_van", 0xf2c230, 2.2, 1.0, "clank") },
  hostage_boat: { ...runner("hostage_boat", 0x4a525a, 2.2, 1.0, "clank"), name: "SPEEDBOAT" },
  // thrown at you: shoot it before it lands (it costs everyone 10)
  hostage_nade: {
    ...thing("hostage_grenade", 0, 25, 0.2, "shatter", "tumble", "clank"),
    arrive: "shot",
    blast: true,
    lose: "GRENADE!"
  },
  hostage_gull: bird("hostage_gull", 25, 0.3, "chirp")
};
const GANG = ["hostage_mRun", "hostage_hRun", "hostage_bRun"];
const gang = (a, b, c) => [
  ["hostage_masked", a],
  ["hostage_hood", b],
  ["bad", c]
];

// ---- Paths ------------------------------------------------------------------------

// Out to a spot in front of you; he stops there, aims, and it costs
// everyone up there 10.
function rush(R, pts, v) {
  const w = walk(pts, v);
  return { dur: w.time + 2, charge: true, arrive: w.time + 0.8, pos: w.pos };
}
// Thrown at you; if it lands it goes off (charge: everyone up there pays).
function lobbed(R, o) {
  const L = toss(R, o);
  return { ...L, charge: true, arrive: L.dur - 0.05 };
}
// Walked along a line and gone at its end (no charge).
function stroll(pts, v, hold = 0.3) {
  const w = walk(pts, v);
  return { dur: w.time + hold, pos: w.pos };
}

// ---- Scenery helpers ---------------------------------------------------------------

const LIT = 0xffe2a0; // a lit window
const GLASS = 0x26323e;
const darker = (c, k = 0.72) => new THREE.Color(c).multiplyScalar(k).getHex();

// P.add for a thing turned ry about its own spot (u, f): parts placed by
// (x across it, z along it); args (geo, colour, x, h, z, ry, rz, sx, sy, sz).
function turned(P, u, f, ry = 0) {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  return (geo, col, x, h, z, rr = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
    P.add(geo, col, u + x * c - z * s, h, f + x * s + z * c, 0, ry + rr, rz, sx, sy, sz);
}

// A thin bar from a to b ([u, h, f] each): cables, rails, bolts.
const UPV = new THREE.Vector3(0, 1, 0);
function strut(P, a, b, w, col) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], -(b[2] - a[2]));
  const geo = BOX(w, d.length(), w).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UPV, d.normalize()));
  P.add(geo, col, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}

// A flat outline [[x, y], ...] given thickness d (z), as one indexed mesh
// (the scenery merges only indexed geometry): fins, wings, the hull.
function prism(pts, d) {
  let p = pts.map(([x, y]) => new THREE.Vector2(x, y));
  if (THREE.ShapeUtils.isClockWise(p)) p = p.reverse();
  const tris = THREE.ShapeUtils.triangulateShape(p, []);
  const pos = [];
  const idx = [];
  for (const z of [d / 2, -d / 2]) {
    const o = pos.length / 3;
    for (const v of p) pos.push(v.x, v.y, z);
    for (const [a, b, c] of tris) idx.push(...(z > 0 ? [o + a, o + b, o + c] : [o + a, o + c, o + b]));
  }
  p.forEach((v, k) => {
    const w = p[(k + 1) % p.length];
    const o = pos.length / 3;
    pos.push(v.x, v.y, d / 2, w.x, w.y, d / 2, w.x, w.y, -d / 2, v.x, v.y, -d / 2);
    idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// A car, nose at -z (towards you when ry is 0); h: the deck it's parked on.
const CARS = [0xa8202a, 0x2a4a8a, 0xb8bcc0, 0xe8e8e4, 0x1e1e22, 0xd8a82a, 0x2a5a3a, 0x6a6a70, 0x7a1a3a, 0xd86a1a];
function car(P, u, f, ry, c, h = 0, wheels = true) {
  const A = turned(P, u, f, ry);
  const y = G + h;
  A(BOX(1.8, 0.62, 4.3), c, 0, y + 0.52, 0);
  A(BOX(1.66, 0.5, 2.1), GLASS, 0, y + 1.08, 0.25);
  A(BOX(1.58, 0.08, 1.9), c, 0, y + 1.37, 0.3);
  for (const z of [-2.17, 2.17]) A(BOX(1.86, 0.2, 0.14), 0x1a1a1c, 0, y + 0.3, z);
  for (const x of [-0.6, 0.6]) {
    A(BOX(0.38, 0.14, 0.06), 0xf4f0d8, x, y + 0.64, -2.16);
    A(BOX(0.36, 0.13, 0.06), 0xd82a2a, x, y + 0.66, 2.16);
  }
  for (const x of [-0.82, 0.82])
    for (const z of [-1.35, 1.4])
      if (wheels) A(CYL(0.33, 0.33, 0.24, 8), 0x141416, x, y + 0.33, z, 0, Math.PI / 2);
      else A(BOX(0.24, 0.6, 0.6), 0x141416, x, y + 0.3, z);
}

// An office or a tower: a block with its windows on its face (f is the
// face). o: lit (the share lit), grid (the dark panes too), crown (a lit band
// round the top), force ([[u, base], ...]: windows lit for the pop-ups).
function tower(P, u, f, w, d, h, wall, o = {}) {
  const lit = o.lit ?? 0.35;
  P.add(BOX(w, h, d), wall, u, G + h / 2, f + d / 2);
  const cols = Math.max(2, Math.round(w / 2.6));
  const cw = w / cols;
  for (let y = 1.2; y < h - 2; y += 3.6)
    for (let k = 0; k < cols; k++) {
      const on = P.r(0, 1) < lit;
      const c = on ? (P.r(0, 1) < 0.25 ? 0xd8e8ff : LIT) : 0x2c3446;
      if (on || o.grid) P.add(BOX(cw - 0.8, 1.4, 0.1), c, u - w / 2 + (k + 0.5) * cw, G + y + 0.7, f - 0.05);
    }
  for (const [x, b] of o.force || []) P.add(BOX(2.2, 1.7, 0.1), 0xffe8b0, x, G + b + 0.85, f - 0.07);
  P.add(BOX(w + 0.4, 0.5, d + 0.4), darker(wall, 0.8), u, G + h + 0.25, f + d / 2);
  if (o.crown) P.add(BOX(w + 0.5, 0.7, 0.3), o.crown, u, G + h - 1.0, f - 0.12);
}

// ---- Level 2: the parking garage -----------------------------------------------------

// A car park open to you on its front: the ground floor, two decks and the
// roof (heights D), pillars every 5.5 m from U0 to U1; the lot in front of
// it; an exit road off to the right and an office block beyond.
const GAR = { F: 16, B: 34, D: [0, 3.2, 6.4, 9.6], U0: -32, U1: 12, BAY: 18.9 };
const PILLARS = Array.from({ length: 9 }, (_, k) => GAR.U0 + k * 5.5);
const SPAN = PILLARS.slice(1).map(u => u - 2.75); // (the bays' middles, two bays each)
const bay = (s, side) => SPAN[s] + side * 1.35;
const LOT = [
  [-24, 11, 0.05, 0],
  [-19.5, 11, -0.03, 3],
  [-15, 11, Math.PI, 1],
  [3.5, 11, Math.PI + 0.04, 7],
  [17, 11, 0, 5],
  [21.5, 11, 0.06, 4],
  [-27.5, 5.5, 0.7, 2]
];
// [span, side] of the parked cars on each level (the empty bays are where
// they pop up)
const PARKED = [
  [
    [1, 1],
    [2, -1],
    [2, 1],
    [3, -1],
    [5, -1],
    [5, 1],
    [7, -1]
  ],
  [
    [0, -1],
    [0, 1],
    [1, 1],
    [2, -1],
    [3, -1],
    [4, -1],
    [4, 1],
    [5, 1],
    [6, -1],
    [6, 1],
    [7, -1]
  ],
  [
    [0, -1],
    [1, -1],
    [1, 1],
    [2, 1],
    [3, -1],
    [3, 1],
    [4, -1],
    [5, -1],
    [5, 1],
    [6, 1],
    [7, 1]
  ]
];
const DECK_POPS = [
  [bay(1, -1), bay(2, 1), bay(3, 1), bay(5, -1), bay(7, 1)],
  [bay(0, 1), bay(2, -1), bay(4, 1), bay(6, -1), bay(7, -1)]
];
const OFFICE = {
  U: 32,
  W: 16,
  F: 42,
  H: 26,
  WIN: [
    [26.5, 4.1],
    [31, 7.7],
    [35.5, 4.1],
    [28.5, 11.3],
    [34, 14.9]
  ]
};
const VAN = [8.2, 9.8];

function getawayVan(P, u, f, ry, c) {
  const A = turned(P, u, f, ry);
  A(BOX(2.0, 2.0, 5.4), c, 0, G + 1.45, 0.3);
  A(BOX(1.95, 1.0, 1.0), c, 0, G + 0.95, -2.85);
  A(BOX(1.8, 0.85, 0.08), GLASS, 0, G + 2.0, -2.44);
  for (const x of [-1.01, 1.01]) A(BOX(0.06, 0.7, 1.0), GLASS, x, G + 2.0, -1.8);
  A(BOX(2.04, 0.3, 5.5), 0x1e3a8a, 0, G + 1.2, 0.3);
  // the back doors open, the inside dark
  A(BOX(1.84, 1.8, 0.05), 0x101012, 0, G + 1.45, 3.0);
  for (const x of [-1.07, 1.07]) A(BOX(0.06, 1.8, 0.95), c, x, G + 1.45, 3.5);
  A(BOX(2.0, 0.22, 0.15), 0x1a1a1c, 0, G + 0.4, -3.38);
  for (const x of [-0.65, 0.65]) A(BOX(0.36, 0.16, 0.06), 0xf4f0d8, x, G + 0.95, -3.36);
  for (const x of [-0.95, 0.95])
    for (const z of [-2.1, 2.0]) A(CYL(0.38, 0.38, 0.26, 8), 0x141416, x, G + 0.38, z, 0, Math.PI / 2);
}

WORLDS.hostage_garage = {
  sky: {
    top: "#07080f",
    mid: "#161a2c",
    horizon: "#6a4a3e",
    ground: "#141416",
    sun: [34, 21, "#f0ecd8", 6],
    clouds: 6,
    cloud: "rgba(150,110,90,0.28)",
    skyline: "#11131c",
    windows: "#f2c860",
    seed: 61
  },
  fog: 0x2a2630,
  signs: [
    ["CITY CENTRE PARKING", -10, G + GAR.D[3] + 0.55, GAR.F - 0.2, 10, 0.8, "#1e3a7a", "#ffffff"],
    ["LEVEL 1", -29.25, G + GAR.D[1] - 0.36, GAR.F - 0.17, 2.2, 0.5, "#f2c230", "#151515"],
    ["LEVEL 2", -29.25, G + GAR.D[2] - 0.36, GAR.F - 0.17, 2.2, 0.5, "#f2c230", "#151515"],
    ["ENTRANCE", SPAN[4], G + 2.2, GAR.F - 0.1, 2.6, 0.45, "#2a8a3a", "#ffffff"],
    ["EXIT", SPAN[6], G + 2.2, GAR.F - 0.1, 1.6, 0.45, "#c0182a", "#ffffff"],
    ["PAY HERE", -12.4, G + 2.05, 13.36, 1.4, 0.32, "#151515", "#f2c230"],
    ["P", -34.5, G + 11.2, 15.96, 2.2, 2.2, "#1e4aa8", "#ffffff"],
    ["NORTH QUAY HOLDINGS", OFFICE.U, G + OFFICE.H - 1.4, OFFICE.F - 0.12, 9, 1.0, "#151820", "#9ad0ff"]
  ],
  build(P) {
    P.ground(0x26272c, [
      { u: -10, f: 25, r: 16, c: 0x46464a, sx: 1.45, sz: 0.6 },
      { u: -5, f: 9.5, r: 10, c: 0x303136, sx: 2.6, sz: 0.5 },
      { u: 22, f: 34, r: 8, c: 0x34353a, sx: 0.7, sz: 2.6 },
      { u: -21, f: 7, r: 3.2, c: 0x3a3634 },
      { u: 10, f: 6.5, r: 3.2, c: 0x3a3634 },
      { u: 20, f: 25, r: 3, c: 0x3a3634 }
    ]);
    // the lot: bay lines, cars, the van with its back doors open
    for (let u = -26.6; u < 25; u += 2.7)
      if (Math.abs(u - VAN[0]) > 3.5) P.add(BOX(0.12, 0.03, 4.6), 0xd8d8d0, u, G + 0.02, 11);
    for (const [u, f, ry, k] of LOT) car(P, u, f, ry, CARS[k]);
    getawayVan(P, VAN[0], VAN[1], -Math.PI / 2, 0xe8e8e4);
    // lamp posts with sodium heads
    for (const [u, f] of [
      [-21, 7],
      [10, 6.5],
      [20, 25]
    ]) {
      P.add(CYL(0.08, 0.11, 7, 6), 0x3a3a3e, u, G + 3.5, f);
      P.add(BOX(1.2, 0.1, 0.1), 0x3a3a3e, u - 0.5, G + 7, f);
      P.add(BOX(0.9, 0.22, 0.45), 0xffb050, u - 1.0, G + 6.9, f);
    }
    // the pay booth and the barriers (the exit's is smashed)
    P.add(BOX(1.8, 2.4, 1.6), 0xd8d4c8, -12.4, G + 1.2, 14.2);
    P.add(BOX(1.2, 0.8, 0.06), LIT, -12.4, G + 1.55, 13.38);
    P.add(BOX(2.2, 0.16, 2.0), 0x3a3a3e, -12.4, G + 2.48, 14.2);
    P.add(BOX(1.4, 0.06, 0.35), 0x8a8680, -12.4, G + 1.0, 13.25);
    P.add(BOX(0.3, 1.0, 0.3), 0xd8b02a, -10.6, G + 0.5, 14.6);
    for (let k = 0; k < 5; k++) P.add(BOX(1.08, 0.1, 0.1), k % 2 ? 0xf4f4f0 : 0xc0182a, -9.9 + k * 1.1, G + 0.95, 14.6);
    P.add(BOX(0.3, 1.0, 0.3), 0xd8b02a, 1.4, G + 0.5, 14.6);
    for (let k = 0; k < 4; k++)
      P.add(
        BOX(1.08, 0.1, 0.1),
        k % 2 ? 0xf4f4f0 : 0xc0182a,
        2.4 + k * 1.05,
        G + 0.8 - k * 0.2,
        14.0 - k * 0.45,
        0,
        0.45,
        -0.2
      );
    // the car park: decks, their edges, rails, pillars, lights
    const conc = 0x8e8c86;
    const w = GAR.U1 - GAR.U0 + 0.6;
    const mid = (GAR.U0 + GAR.U1) / 2;
    for (const d of GAR.D.slice(1)) {
      P.add(SLAB(w, 0.45, GAR.B - GAR.F + 0.4), 0x6e6c68, mid, G + d - 0.225, (GAR.F + GAR.B) / 2);
      P.add(BOX(w, 0.7, 0.3), conc, mid, G + d - 0.35, GAR.F + 0.05);
      P.add(BOX(w, 0.06, 0.32), 0xd8b02a, mid, G + d - 0.62, GAR.F + 0.03);
      if (d < GAR.D[3]) {
        P.add(BOX(w, 0.25, 0.25), conc, mid, G + d + 0.125, GAR.F + 0.2);
        for (const y of [0.55, 1.0]) P.add(BOX(w, 0.07, 0.07), 0xd8b02a, mid, G + d + y, GAR.F + 0.12);
        P.add(BOX(w, 1.0, 0.25), 0x5a5854, mid, G + d + 0.5, GAR.B - 0.1);
      } else {
        P.add(BOX(w, 1.1, 0.3), conc, mid, G + d + 0.55, GAR.F + 0.05);
        P.add(BOX(w + 0.2, 0.1, 0.4), 0xb0aea8, mid, G + d + 1.15, GAR.F + 0.05);
      }
    }
    for (let s = 0; s < 3; s++) {
      const h = GAR.D[s + 1] - GAR.D[s] - 0.45;
      for (const u of PILLARS)
        for (const f of [GAR.F + 0.5, GAR.B - 0.4]) P.add(BOX(0.8, h, 0.8), conc, u, G + GAR.D[s] + h / 2, f);
      for (const u of SPAN)
        for (const f of [18.6, 24]) P.add(BOX(1.6, 0.14, 0.3), 0xf4f8e8, u, G + GAR.D[s + 1] - 0.55, f);
    }
    // the stair tower at the end, the ramp up, the roof's lamps
    P.add(BOX(4, 12.6, 5), 0x7a7872, -34.5, G + 6.3, 18.5);
    for (let k = 0; k < 4; k++)
      P.add(BOX(0.8, 2.0, 0.06), LIT, -34.5 + (k % 2 ? 1 : -1) * 0.9, G + 1.6 + k * 2.8, 15.97);
    P.add(SLAB(5, 0.35, 15.4), 0x7a7874, SPAN[0], G + 1.6, 26, 0.205);
    for (const u of [-26, -10, 6]) {
      P.add(CYL(0.08, 0.1, 3.4, 6), 0x3a3a3e, u, G + GAR.D[3] + 1.7, 17.6);
      P.add(BOX(1.0, 0.24, 0.5), 0xfff0c8, u, G + GAR.D[3] + 3.45, 17.6);
    }
    // the cars on each level (lower ones with their wheels showing)
    PARKED.forEach((list, lv) => {
      for (const [s, side] of list)
        car(
          P,
          bay(s, side),
          GAR.BAY,
          s % 2 ? Math.PI : 0,
          CARS[(s * 3 + lv * 5 + (side > 0)) % CARS.length],
          GAR.D[lv],
          !lv
        );
    });
    // the exit road off to the right, the office block, the city behind
    for (let k = 0; k < 6; k++) P.add(BOX(0.2, 0.03, 1.6), 0xe8e8e0, 22 + k * 0.6, G + 0.02, 22 + k * 4);
    P.add(BOX(0.12, 1.0, 0.12), 0xd8b02a, 30, G + 0.5, 37.5);
    tower(P, OFFICE.U, OFFICE.F, OFFICE.W, 12, OFFICE.H, 0x2c303a, { lit: 0.3, grid: true, force: OFFICE.WIN });
    for (const [u, f, ww, h, c] of [
      [-44, 66, 16, 40, 0x24262e],
      [-24, 74, 14, 52, 0x2a2a34],
      [-4, 62, 18, 36, 0x26282e],
      [14, 78, 12, 46, 0x2a2c36],
      [50, 60, 14, 30, 0x22242a]
    ])
      tower(P, u, f, ww, 12, h, c, { lit: 0.32 });
  },
  slots: [],
  cover: null
};

LAYOUTS.hostage_garage = L => {
  const fixed = { fixed: true, rail: false };
  // cones across the lot, tins on the booth's ledge, the loot behind the van
  L.row({ kind: "hostage_cone", n: 6, f: 6.2, u0: -4, u1: 4, size: 0.55, tint: "orange", bank: 3 });
  L.row({
    ...fixed,
    kind: "can",
    n: 3,
    f: 13.2,
    u0: -12.9,
    u1: -11.9,
    base: 1.03,
    size: 0.24,
    tint: ["steel", "red"],
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "hostage_case",
    n: 3,
    f: 8.4,
    u0: 11.9,
    u1: 13.3,
    size: 0.48,
    tint: ["steel", "brown"],
    bank: 3
  });
  // paint tins and cones on the decks' kerbs, cones out on the exit road
  L.row({
    ...fixed,
    kind: "can",
    n: 4,
    f: GAR.F + 0.2,
    u0: -14,
    u1: -12,
    base: GAR.D[1] + 0.25,
    size: 0.26,
    tint: ["red", "steel"],
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "hostage_cone",
    n: 4,
    f: GAR.F + 0.2,
    u0: -9.6,
    u1: -5,
    base: GAR.D[2] + 0.25,
    size: 0.42,
    tint: "orange",
    bank: 4
  });
  L.row({ ...fixed, kind: "hostage_cone", n: 4, f: 38, u0: 31, u1: 37, size: 0.6, tint: "orange", bank: 4 });
  // round the cars in the lot, round the back of the van
  L.pops({
    fixed: true,
    peek: true,
    f: 13.6,
    at: [
      [-15, 0],
      [3.5, 0],
      [17, 0]
    ],
    size: 1.75,
    slide: 1.9,
    kinds: [...gang(40, 35, 15), ["hostage", 12, { dont: true }]]
  });
  L.pops({ fixed: true, peek: true, f: 10.9, at: [[10.4, 0]], size: 1.75, slide: 2, kinds: gang(45, 40, 15) });
  // in the empty bays on the decks
  for (const [lv, at] of [
    [1, DECK_POPS[0]],
    [2, DECK_POPS[1]]
  ])
    L.pops({
      fixed: true,
      f: 17.2,
      at: at.map(u => [u, GAR.D[lv]]),
      size: 1.7,
      kinds: [...gang(40, 35, 15), ["hostage", 14, { dont: true }]]
    });
  // up behind the roof's parapet; round the pillars on the ground floor
  L.pops({
    fixed: true,
    f: GAR.F + 0.5,
    at: [-24, -12, 4].map(u => [u, GAR.D[3] + 0.55]),
    size: 1.4,
    period: [5, 8],
    busy: 0.7,
    kinds: [
      ["hostage_masked", 60, { pts: 25 }],
      ["bad", 40, { pts: 25 }]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: GAR.F + 1.0,
    at: [PILLARS[1], PILLARS[6], PILLARS[8]].map(u => [u, 0]),
    size: 1.75,
    slide: 1.6,
    kinds: gang(40, 40, 20)
  });
  // their lookouts in the office windows
  L.pops({
    fixed: true,
    f: OFFICE.F - 0.3,
    at: OFFICE.WIN,
    size: 1.5,
    period: [6, 9],
    busy: 0.6,
    kinds: [
      ["hostage_masked", 50, { pts: 50 }],
      ["bad", 50, { pts: 50 }]
    ]
  });
};

// Along one of the decks (or the ground floor) behind its edge.
function deckRun(R, add, t, c) {
  const h = pick(R, [GAR.D[1], GAR.D[2], GAR.D[1], 0]);
  const a = GAR.U0 + 0.5;
  const b = GAR.U1 - 0.5;
  const right = R(0, 1) < 0.5;
  add(t, pick(R, GANG), cross(R, { u0: right ? a : b, u1: right ? b : a, f: GAR.F + 0.9, h, v: R(3.6, 5) * c.S }));
}
// Across the lot, in front of the cars or between them and the car park.
function lotCross(R, add, t, c, kind = pick(R, GANG), v = R(4.5, 6)) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(t, kind, cross(R, { u0: -s * R(20, 25), u1: s * R(20, 25), f: pick(R, [7.3, 14.8]), v: v * c.S }));
}
// Out of the entrance, across the lot to the front; aims.
function rushOut(R, add, t, c) {
  const u = SPAN[4];
  add(
    t,
    pick(R, GANG),
    rush(
      R,
      [
        [u + R(-1, 1), GAR.F + 3, G],
        [u, GAR.F - 1, G],
        [R(-11, 0), R(3.5, 6), G]
      ],
      R(3, 4) * c.S
    )
  );
}
// A grenade off a deck.
function deckNade(R, add, t) {
  add(
    t,
    "hostage_nade",
    lobbed(R, {
      u: R(-28, 8),
      f: GAR.F + 0.3,
      h: G + pick(R, [GAR.D[1], GAR.D[2]]) + 1.3,
      vh: R(2, 3.5),
      vu: R(-1, 1),
      vf: -R(3, 4.5)
    })
  );
}
// A hostage walked across the lot, his captor a step behind.
function escortCross(R, add, t) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  const v = 1.8;
  const f = 14.8;
  add(t, "hostage_civRun", cross(R, { u0: -s * 22, u1: s * 22, f, v }));
  add(t + 0.75, pick(R, GANG), cross(R, { u0: -s * 22, u1: s * 22, f: f + 0.2, v }));
}

const garageWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the van makes its run, and they come out of every level
    for (let k = 0; k < 5; k++) add(1 + k * 5, "hostage_van", run(R, { v: R(12, 15) * c.S, f: R(2.5, 4) }));
    for (let k = 0; k < 6; k++) deckRun(R, add, 2 + k * 3.6, c);
    for (let k = 0; k < 3; k++) rushOut(R, add, 3 + k * 7, c);
    for (let k = 0; k < 3; k++) deckNade(R, add, 5 + k * 7, c);
    return;
  }
  const k = c.w % 6;
  for (let j = 0; j < 1 + n(1.3); j++) deckRun(R, add, R(1, 22), c);
  for (let j = 0; j < n(1.0); j++) lotCross(R, add, R(1, 20), c);
  if (k !== 0) for (let j = 0; j < n(0.9); j++) rushOut(R, add, R(2, 20), c);
  if (k === 2 || k === 5) add(R(3, 16), "hostage_van", run(R, { v: R(12, 15) * c.S, f: R(2.5, 4) }));
  if (k === 1 || k === 4) for (let j = 0; j < 1 + n(1.2); j++) deckNade(R, add, R(1, 22), c);
  if (k === 0 || k === 3) flyers(["drone", "heli"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.35) escortCross(R, add, R(2, 12), c);
};

// ---- Level 3: the airport ---------------------------------------------------------------

// The airliner side on, nose to the left: its body's middle at f PF, HC up;
// its doors at u DOOR with the sill SILL up and the jet stairs down to
// FOOT; the near wing comes out towards you. The terminal's face at TERM.
const AP = {
  PF: 22,
  HC: 3.8,
  NOSE: -14,
  TAIL: 14,
  DOOR: [-10.5, 11.5],
  SILL: 3.0,
  FOOT: 13.4,
  CARTS: [-13.5, -17, -20.5],
  CART_F: 10.5,
  TERM: 50,
  TOWER: [-38, 62],
  WING: 3.02,
  WIN: k => -11.2 + k * 0.95
};
const NAVY = 0x1e3a8a;
const JET = 0xf2f2ee;
const NEAR_WING = [
  [-5, -1.6],
  [5.9, -16.2],
  [7.6, -16.2],
  [2, -1.6]
];

function jetStairs(P, u) {
  const top = G + AP.SILL;
  const f0 = AP.PF - 2.6;
  const n = 11;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    P.add(BOX(1.4, 0.08, 0.6), 0xc8ccd0, u, top - t * AP.SILL + 0.04, f0 - t * (f0 - AP.FOOT));
  }
  P.add(BOX(1.6, 0.12, 1.1), 0xc8ccd0, u, top, AP.PF - 2.1);
  for (const s of [-1, 1]) {
    strut(P, [u + s * 0.74, G + 0.1, AP.FOOT], [u + s * 0.74, top, f0], 0.12, 0xe8e8e8);
    strut(P, [u + s * 0.74, G + 1.0, AP.FOOT], [u + s * 0.74, top + 1.0, f0], 0.06, 0xe8e8e8);
    for (let k = 0; k <= 3; k++) {
      const t = k / 3;
      P.add(BOX(0.05, 1.0, 0.05), 0xe8e8e8, u + s * 0.74, G + 0.5 + t * AP.SILL, AP.FOOT + t * (f0 - AP.FOOT));
    }
  }
  // the truck under it, its cab beside
  const fm = (f0 + AP.FOOT) / 2 + 1.2;
  P.add(BOX(2.2, 0.8, 4.2), 0x3a3e46, u, G + 0.6, fm);
  P.add(BOX(1.5, 1.5, 1.9), 0xf2c230, u + 1.9, G + 1.05, fm - 1.2);
  P.add(BOX(0.06, 0.6, 1.3), GLASS, u + 1.9, G + 1.4, fm - 2.16);
  for (const x of [-0.9, 0.9])
    for (const z of [-1.5, 1.5]) P.add(CYL(0.34, 0.34, 0.24, 8), 0x141416, u + x, G + 0.34, fm + z, 0, 0, Math.PI / 2);
}

function cart(P, u, f) {
  P.add(BOX(2.6, 0.12, 1.6), 0x8a8e96, u, G + 0.56, f);
  for (const x of [-1, 1]) {
    for (const z of [-0.62, 0.62]) P.add(CYL(0.2, 0.2, 0.14, 8), 0x141416, u + x, G + 0.2, f + z, Math.PI / 2);
    P.add(BOX(0.08, 1.4, 1.6), 0x8a8e96, u + x * 1.26, G + 1.26, f);
  }
  P.add(BOX(2.7, 0.06, 1.7), 0x2a5a8a, u, G + 1.98, f);
  P.add(BOX(0.8, 0.06, 0.06), 0x3a3a3e, u + 1.6, G + 0.4, f);
}

function engine(P, u, h, f) {
  P.add(CYL(1.1, 0.95, 3.8, 16), 0xb8bcc4, u, h, f, 0, 0, Math.PI / 2);
  P.add(CYL(0.92, 0.92, 0.06, 16), 0x141418, u - 1.92, h, f, 0, 0, Math.PI / 2);
  P.add(CONE(0.28, 0.5, 8), 0xd8d8d8, u - 2.1, h, f, 0, 0, Math.PI / 2);
  P.add(CONE(0.6, 1.0, 10), 0x5a5e66, u + 2.3, h, f, 0, 0, -Math.PI / 2);
  P.add(BOX(2.4, 0.9, 0.24), 0xc8ccd2, u + 0.6, h + 1.2, f);
  P.add(BOX(3.7, 0.06, 2.24), NAVY, u, h + 0.6, f, 0, 0, 0, 1, 1, 0.98);
}

WORLDS.hostage_airport = {
  sky: {
    top: "#0a0d26",
    mid: "#262a5a",
    horizon: "#e2784a",
    ground: "#16161e",
    sun: [-62, -3, "#ff9a5a", 22],
    stars: true,
    clouds: 5,
    cloud: "rgba(255,140,110,0.3)",
    hills: [{ colour: "#1a1a2a", height: 2.2, rough: 2 }],
    seed: 62
  },
  fog: 0x3a3448,
  signs: [
    ["NORTHSTAR", -3, G + AP.HC + 1.15, AP.PF - 1.86, 6.6, 0.6, "#1e3a8a", "#f2f2ee"],
    ["N", 21.6, G + AP.HC + 5.2, AP.PF - 0.22, 2.2, 2.2, "#1e3a8a", "#f2c230"],
    ["JET A-1", 16.6, G + 2.4, 11.3, 2.6, 0.55, "#c0182a", "#ffffff"],
    ["BELLEVUE INTERNATIONAL", -4, G + 17.5, AP.TERM - 1.3, 16, 1.3, "#1e3a8a", "#ffffff"],
    ["GATE 12", -30, G + 15.0, AP.TERM - 0.3, 2.8, 0.6, "#151515", "#f2c230"],
    ["GATE 14", 26, G + 15.0, AP.TERM - 0.3, 2.8, 0.6, "#151515", "#f2c230"],
    ["STAND 7", -26, G + 2.6, 14.6, 2.2, 0.5, "#f2c230", "#151515"]
  ],
  build(P) {
    P.ground(0x34363c, [
      { u: 0, f: 20, r: 30, c: 0x3e4046, sx: 1.6, sz: 0.55 },
      { u: 0, f: 41, r: 20, c: 0x2a2c30, sx: 3, sz: 0.25 },
      { u: -24, f: 34, r: 7, c: 0x4a4a4c, sz: 0.6 },
      { u: 24, f: 34, r: 7, c: 0x4a4a4c, sz: 0.6 }
    ]);
    // the stand's markings, the taxiway's line and its blue edge lights
    P.add(BOX(46, 0.03, 0.25), 0xf2c230, 0, G + 0.02, AP.PF);
    P.add(BOX(0.3, 0.03, 4), 0xf2c230, -19.5, G + 0.02, AP.PF);
    P.add(BOX(110, 0.03, 0.3), 0xf2c230, 0, G + 0.02, 41.5);
    for (const f of [38.4, 44.6]) for (let u = -52; u <= 52; u += 4) P.add(BALL(0.17, 4), 0x4a8aff, u, G + 0.2, f);
    // the airliner: body, nose, tail, cheatline, windows, doors, cockpit
    const hc = G + AP.HC;
    const PF = AP.PF;
    P.add(CYL(2, 2, 28, 18), JET, 0, hc, PF, 0, 0, Math.PI / 2);
    P.add(BALL(2, 16), JET, AP.NOSE, hc, PF, 0, 0, 0, 2.3, 1, 1);
    P.add(CYL(0.5, 2, 9, 16), JET, AP.TAIL + 4.5, hc + 0.5, PF, 0, 0, -Math.PI / 2 + 0.11);
    P.add(new THREE.CylinderGeometry(2.02, 2.02, 27.4, 2, 1, true, -0.05, 0.17), NAVY, 0, hc, PF, 0, 0, Math.PI / 2);
    P.add(
      new THREE.CylinderGeometry(2.02, 2.02, 27.4, 2, 1, true, -0.17, 0.07),
      0xc0182a,
      0,
      hc,
      PF,
      0,
      0,
      Math.PI / 2
    );
    for (let k = 0; k < 26; k++) {
      const u = AP.WIN(k);
      if (AP.DOOR.some(d => Math.abs(u - d) < 0.9)) continue;
      P.add(BOX(0.3, 0.42, 0.12), LIT, u, hc + 0.55, PF - 1.93);
    }
    for (const u of AP.DOOR) {
      P.add(BOX(1.15, 2.0, 0.12), 0x141418, u, hc + 0.2, PF - 1.97);
      P.add(BOX(1.05, 1.9, 0.08), 0xe4e4e0, u - 1.0, hc + 0.2, PF - 2.4, 0, 1.2, 0);
    }
    P.add(BOX(1.4, 1.2, 0.1), 0x141418, 6.5, hc - 1.25, PF - 1.6);
    for (const [u, w] of [
      [-16.0, 0.7],
      [-16.75, 0.6]
    ])
      P.add(BOX(w, 0.36, 0.1), 0x1e2a3a, u, hc + 0.85, PF - 1.6, 0, 0, -0.32);
    // the tail fin and the tailplane, the wings, winglets, engines, gear
    P.add(
      prism(
        [
          [0, 0],
          [7, 0],
          [9.2, 7.6],
          [7.0, 7.6]
        ],
        0.35
      ),
      NAVY,
      AP.TAIL + 1,
      hc + 1.0,
      PF
    );
    for (const s of [-1, 1])
      P.add(
        prism(
          [
            [19.4, -0.5 * s],
            [23.0, -0.5 * s],
            [24.4, -6.2 * s],
            [23.2, -6.2 * s]
          ],
          0.25
        ),
        JET,
        0,
        hc + 1.2,
        PF,
        -Math.PI / 2
      );
    for (const s of [1, -1]) {
      P.add(
        prism(
          NEAR_WING.map(([x, y]) => [x, y * s]),
          0.4
        ),
        0xd8dade,
        0,
        hc - 1.0,
        PF,
        -Math.PI / 2
      );
      engine(P, -2.6, hc - 2.35, PF - 6.5 * s);
    }
    // (the near wing's tip: a small winglet, its red light; flap tracks)
    P.add(
      prism(
        [
          [0, 0],
          [1.2, 0],
          [1.35, 0.9],
          [0.95, 0.9]
        ],
        0.1
      ),
      JET,
      6.0,
      hc - 0.8,
      PF - 16.1
    );
    P.add(BALL(0.16, 6), 0xff2a2a, 6.2, hc - 0.85, PF - 16.35);
    for (const t of [0.25, 0.5, 0.75])
      P.add(BOX(1.4, 0.3, 0.25), 0xb8bcc4, 2 + 5.6 * t + 0.4, hc - 1.3, PF - 1.6 - 14.6 * t);
    P.add(BOX(0.1, 2.4, 0.1), 0x5a5e66, -26, G + 1.2, 14.65);
    P.add(BOX(0.22, 1.7, 0.22), 0x9a9ea6, -12.5, G + 1.0, PF);
    for (const z of [-0.3, 0.3]) P.add(CYL(0.38, 0.38, 0.25, 10), 0x141416, -12.5, G + 0.38, PF + z, Math.PI / 2);
    for (const s of [-1, 1]) {
      P.add(BOX(0.3, 2.2, 0.3), 0x9a9ea6, 1.2, G + 1.4, PF + s * 2.6);
      for (const x of [0.6, 1.8])
        for (const z of [2.3, 2.9]) P.add(CYL(0.55, 0.55, 0.32, 10), 0x141416, x, G + 0.55, PF + s * z, Math.PI / 2);
    }
    // the jet stairs at both doors, a belt loader at the hold
    for (const u of AP.DOOR) jetStairs(P, u);
    P.add(BOX(1.6, 0.6, 4), 0xf2c230, 6.5, G + 0.45, 16.2);
    strut(P, [6.5, G + 0.7, 14.2], [6.5, hc - 1.6, PF - 1.8], 0.9, 0x3a3e46);
    for (const [k, c] of [
      [0.3, 0xc0182a],
      [0.55, 0x2a4a8a],
      [0.8, 0x2a5a3a]
    ])
      P.add(BOX(0.5, 0.35, 0.3), c, 6.5, G + 0.95 + k * (AP.HC - 2.6), 14.2 + k * (PF - 16));
    // the baggage train and its tug, the fuel truck
    for (const u of AP.CARTS) cart(P, u, AP.CART_F);
    P.add(BOX(2.2, 1.0, 1.5), 0xf2c230, -10.2, G + 0.6, AP.CART_F);
    P.add(BOX(0.8, 0.8, 0.9), 0x1a1a1c, -10.6, G + 1.4, AP.CART_F);
    P.add(BOX(0.06, 1.4, 1.3), 0x3a3a3e, -9.4, G + 1.8, AP.CART_F);
    for (const x of [-0.8, 0.8])
      for (const z of [-0.7, 0.7])
        P.add(CYL(0.3, 0.3, 0.2, 8), 0x141416, -10.2 + x, G + 0.3, AP.CART_F + z, Math.PI / 2);
    for (const [u, k] of [
      [-12.3, 0],
      [-12.6, 1],
      [-12.1, 2]
    ])
      P.add(BOX(0.6, 0.4, 0.4), [0x5a3a2a, 0x2a2a3a, 0x7a1a2a][k], u, G + 0.82 + k * 0.4, AP.CART_F + 0.3);
    P.add(CYL(1.15, 1.15, 6.0, 14), 0xeceae4, 16.4, G + 1.85, 12.5, 0, 0, Math.PI / 2);
    P.add(BOX(6.0, 0.3, 0.05), 0xc0182a, 16.4, G + 1.4, 11.33);
    P.add(BOX(7.6, 0.5, 2.2), 0x2a2a2e, 15.8, G + 0.65, 12.5);
    P.add(BOX(2.0, 2.0, 2.3), 0xeceae4, 12.2, G + 1.55, 12.5);
    P.add(BOX(1.0, 0.7, 0.06), GLASS, 12.0, G + 2.0, 11.33);
    P.add(BALL(0.14, 6), 0xffa020, 12.2, G + 2.65, 12.5);
    for (const u of [12.4, 16.2, 18.4])
      for (const z of [-1.0, 1.0]) P.add(CYL(0.45, 0.45, 0.3, 10), 0x141416, u, G + 0.45, 12.5 + z, Math.PI / 2);
    // a cart out on the taxiway (and its bags)
    cart(P, -34.2, 38.2);
    // floodlight masts
    for (const u of [-24, 24]) {
      P.add(CYL(0.25, 0.35, 20, 8), 0x5a5e66, u, G + 10, 36);
      P.add(BOX(3.2, 1.4, 0.4), 0x4a4e56, u, G + 20.4, 36);
      for (const x of [-1.1, 0, 1.1]) P.add(BOX(0.8, 0.5, 0.1), 0xfff6d8, u + x, G + 20.4, 35.78);
    }
    // the terminal: three floors of lit glass, its gates, the tower, a hangar
    const T = AP.TERM;
    P.add(BOX(84, 17, 16), 0x2e3238, -4, G + 8.5, T + 8);
    P.add(BOX(82, 15.4, 0.2), 0xbcd4e0, -4, G + 8.6, T - 0.05);
    for (const y of [5.6, 11.2]) P.add(BOX(84, 0.5, 0.4), 0x1a1c20, -4, G + y, T - 0.2);
    for (let u = -45; u <= 37; u += 4.1) P.add(BOX(0.25, 15.6, 0.35), 0x1a1c20, u, G + 8.6, T - 0.15);
    for (const u of [-38, -21, -9, 7, 19, 31]) P.add(BOX(2.6, 2.4, 0.1), 0xffd890, u, G + 1.9, T - 0.3);
    P.add(BOX(86, 1.2, 17.5), 0x4a4e56, -4, G + 17.6, T + 7.6);
    for (const u of [-30, 26]) {
      P.add(BOX(2.8, 2.8, 11), 0x8a8e96, u, G + 5.0, T - 5.5);
      P.add(CYL(0.4, 0.4, 3.6, 8), 0x5a5e66, u, G + 1.8, T - 9);
      P.add(BOX(3.4, 3.0, 1.6), 0x9a9ea6, u, G + 5.0, T - 11.4);
      P.add(BOX(2.2, 2.2, 0.1), 0x141418, u, G + 5.0, T - 12.22);
    }
    const [tu, tf] = AP.TOWER;
    P.add(CYL(1.8, 2.4, 26, 12), 0xc8c4bc, tu, G + 13, tf);
    P.add(CYL(3.6, 3.6, 0.5, 12), 0x5a5e66, tu, G + 26.1, tf);
    P.add(CYL(4.4, 3.4, 3.6, 12), 0x8ad8c0, tu, G + 28.15, tf);
    P.add(CYL(4.8, 4.8, 0.5, 12), 0x2a2c30, tu, G + 30.2, tf);
    P.add(BOX(0.12, 3, 0.12), 0x5a5e66, tu, G + 31.9, tf);
    P.add(BALL(0.25, 6), 0xff2a2a, tu, G + 33.5, tf);
    P.add(new THREE.CircleGeometry(9, 16, 0, Math.PI), 0x6a6e76, 46, G, 46);
    P.add(new THREE.CylinderGeometry(9, 9, 20, 16, 1, true, Math.PI / 2, Math.PI), 0x5a5e66, 46, G, 56, Math.PI / 2);
    P.add(BOX(13, 6.4, 0.1), 0xd8c088, 46, G + 3.2, 45.95);
    // another airliner's fin over the terminal's roof
    P.add(
      prism(
        [
          [0, 0],
          [6, 0],
          [7.8, 6.4],
          [6, 6.4]
        ],
        0.3
      ),
      0xc0182a,
      16,
      G + 11,
      66
    );
  },
  slots: [],
  cover: null
};

LAYOUTS.hostage_airport = L => {
  const fixed = { fixed: true, rail: false };
  // bags on the baggage carts (and on one out on the taxiway)
  for (const u of AP.CARTS)
    L.row({
      ...fixed,
      kind: "hostage_case",
      n: 3,
      f: AP.CART_F - 0.2,
      u0: u - 0.8,
      u1: u + 0.8,
      base: 0.63,
      size: 0.42,
      tint: ["red", "blue", "steel"],
      bank: 3
    });
  L.row({
    ...fixed,
    kind: "hostage_case",
    n: 3,
    f: 38,
    u0: -35,
    u1: -33.4,
    base: 0.63,
    size: 0.5,
    tint: ["green", "red", "blue"],
    bank: 3
  });
  // cones at the wing tip, under the nose, out on the taxiway
  L.row({ ...fixed, kind: "hostage_cone", n: 4, f: 4.6, u0: 4.2, u1: 9.4, size: 0.5, tint: "orange", bank: 4 });
  L.row({
    ...fixed,
    kind: "hostage_cone",
    n: 3,
    f: AP.PF - 3.4,
    u0: -18.2,
    u1: -15.8,
    size: 0.48,
    tint: "orange",
    bank: 3
  });
  L.row({ ...fixed, kind: "hostage_cone", n: 4, f: 39.5, u0: -26, u1: -20, size: 0.62, tint: "orange", bank: 4 });
  // behind the tug and the last cart, round the end of the fuel truck
  L.pops({ fixed: true, f: AP.CART_F + 1.1, at: [[-10.2, 0]], size: 1.75, kinds: gang(40, 40, 20) });
  L.pops({
    fixed: true,
    f: AP.CART_F + 1.1,
    at: [[AP.CARTS[2], 0]],
    size: 1.75,
    kinds: [...gang(35, 35, 15), ["hostage", 15, { dont: true }]]
  });
  L.pops({ fixed: true, peek: true, f: 13.9, at: [[18.8, 0]], size: 1.75, slide: 2.2, kinds: gang(40, 40, 20) });
  // in the doors (the crew and the passengers too)
  L.pops({
    fixed: true,
    f: AP.PF - 2.15,
    at: AP.DOOR.map(u => [u, AP.SILL]),
    size: 1.75,
    kinds: [...gang(30, 25, 10), ["hostage_crew", 22, { dont: true }], ["hostage", 13, { dont: true }]]
  });
  // their heads at the cabin windows and in the cockpit
  L.pops({
    fixed: true,
    f: AP.PF - 2.02,
    at: [4, 8, 14, 18, 21].map(k => [AP.WIN(k), AP.HC + 0.34]),
    size: 0.38,
    period: [5, 8],
    busy: 0.55,
    kinds: [["taker", 100, { pts: 50 }]]
  });
  L.pops({
    fixed: true,
    f: AP.PF - 1.85,
    at: [[-16.4, AP.HC + 0.66]],
    size: 0.38,
    period: [5, 8],
    busy: 0.6,
    kinds: [["taker", 100, { pts: 50 }]]
  });
  // up on the wing, round the engine
  L.pops({
    fixed: true,
    f: 14,
    at: [[2.0, AP.WING]],
    size: 1.7,
    kinds: gang(40, 40, 20)
  });
  L.pops({ fixed: true, f: 9.5, at: [[4.6, AP.WING]], size: 1.7, kinds: gang(40, 40, 20) });
  L.pops({ fixed: true, peek: true, f: AP.PF - 5.2, at: [[-2.6, 0]], size: 1.75, slide: 2.6, kinds: gang(40, 40, 20) });
  // up in the terminal's top floor, and the control tower
  L.pops({
    fixed: true,
    f: AP.TERM - 0.4,
    at: [
      [-40, 11.5],
      [-28, 11.5],
      [-14, 11.5],
      [2, 11.5],
      [16, 11.5],
      [30, 11.5]
    ],
    size: 1.6,
    period: [6, 9],
    busy: 0.6,
    kinds: [
      ["hostage_masked", 50, { pts: 50 }],
      ["bad", 50, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    f: AP.TOWER[1] - 4.3,
    at: [[AP.TOWER[0], 26.5]],
    size: 1.6,
    period: [7, 10],
    busy: 0.5,
    kinds: [["bad", 100, { pts: 50 }]]
  });
};

// Out of a door and down its jet stairs; a gunman then runs out in front and
// aims, the crew and passengers get away to the side.
function stairsDown(R, add, t, c, door, kind, gun = true) {
  const u = AP.DOOR[door];
  const pts = [
    [u, AP.PF - 2.1, G + AP.SILL],
    [u, AP.PF - 2.6, G + AP.SILL],
    [u, AP.FOOT - 0.4, G],
    gun ? [u + R(-5, 5), R(4, 7), G] : [u + (door ? 1 : -1) * R(9, 13), R(8, 11), G]
  ];
  add(t, kind, gun ? rush(R, pts, R(2.6, 3.4) * c.S) : stroll(pts, 1.7));
}
// Across the apron, in front of the plane or under its wing.
function apronCross(R, add, t, c) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(
    t,
    pick(R, GANG),
    cross(R, { u0: -s * R(20, 26), u1: s * R(20, 26), f: pick(R, [7, 8.5, 16.6]), v: R(4.5, 6) * c.S })
  );
}
// A grenade out of a door.
function doorNade(R, add, t) {
  add(
    t,
    "hostage_nade",
    lobbed(R, {
      u: pick(R, AP.DOOR),
      f: AP.PF - 2.3,
      h: G + AP.SILL + 1.2,
      vh: R(3, 5),
      vu: R(-1.5, 1.5),
      vf: -R(4, 6)
    })
  );
}

const airportWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // storm the plane: they all come out
    for (let k = 0; k < 8; k++) stairsDown(R, add, 1 + k * 3, c, k % 2, pick(R, GANG));
    for (let k = 0; k < 2; k++) add(4 + k * 11, "hostage_vanY", run(R, { v: R(12, 15) * c.S, f: R(1.5, 3) }));
    for (let k = 0; k < 3; k++) apronCross(R, add, 2 + k * 7, c);
    stairsDown(R, add, 14, c, 0, "hostage_crewRun", false);
    return;
  }
  const k = c.w % 6;
  for (let j = 0; j < 1 + n(1.1); j++) stairsDown(R, add, R(1, 20), c, R(0, 1) < 0.5 ? 0 : 1, pick(R, GANG));
  for (let j = 0; j < n(1.3); j++) apronCross(R, add, R(1, 22), c);
  if (R(0, 1) < 0.5)
    stairsDown(R, add, R(2, 18), c, R(0, 1) < 0.5 ? 0 : 1, R(0, 1) < 0.6 ? "hostage_crewRun" : "hostage_civRun", false);
  if (k === 1 || k === 4) for (let j = 0; j < 1 + n(1.2); j++) doorNade(R, add, R(1, 22), c);
  if (k === 2 || k === 5) add(R(3, 16), "hostage_vanY", run(R, { v: R(12, 15) * c.S, f: R(1.5, 3) }));
  if (k === 0 || k === 3) flyers(["drone", "heli"], R, add, c, 2 + n(1.5));
};

// ---- Level 4: the cargo ship --------------------------------------------------------------

// A freighter broadside on, bow to the left, in a storm: its near side at f
// F, BEAM wide; the main deck DECK up, the forecastle FC; three bays of
// containers (rows at ROWF, TIERS high, stepping up away from you), two
// cranes in the gaps, the house aft with the bridge on top.
const SH = {
  F: 22,
  BEAM: 16,
  DECK: 4.2,
  FC: 6.4,
  BAYS: [
    [-28, -16],
    [-13, -1],
    [2, 14]
  ],
  ROW0: 23.2,
  TIERS: [2, 3, 3, 3, 3, 3],
  CRANES: [-14.5, 0.5],
  CRANE_F: 29.5,
  HOUSE: 22,
  YB: 12.0,
  MAST: [33.5, 37.3],
  RIB: [-10, 17.6]
};
const ROWF = SH.TIERS.map((_, r) => SH.ROW0 + 1.22 + r * 2.44);
const BOXES = [0x2a5a9a, 0xa8302a, 0x2a6a4a, 0xd8782a, 0x8a8e94, 0xd8b02a, 0xd8d8d0, 0x6a3a2a, 0x3a3a6a, 0x1a7a8a];
const HULL = [
  [-33.5, -0.8],
  [31, -0.8],
  [33, 1.0],
  [34.2, SH.DECK],
  [-30, SH.DECK],
  [-31, SH.FC],
  [-39, SH.FC],
  [-36.6, 2.0]
];

WORLDS.hostage_ship = {
  sky: {
    top: "#12161a",
    mid: "#2c3638",
    horizon: "#56625e",
    ground: "#14242a",
    clouds: 16,
    cloud: "rgba(28,34,38,0.75)",
    seed: 63
  },
  fog: 0x3a4648,
  signs: [["OCEAN DRAGON", -33, G + 5.3, SH.F - 0.06, 5.6, 0.8, "#22262c", "#f4f4f0"]],
  build(P) {
    P.ground(0x173039, [
      { u: -35, f: 19.4, r: 4, c: 0xa8bcc0, sx: 1.6, sz: 0.3, lift: 0.02 },
      { u: 0, f: 19.6, r: 30, c: 0x2a4a52, sx: 1.3, sz: 0.04, lift: 0.02 },
      { u: -50, f: 50, r: 6, c: 0x5a7478, sz: 0.3 },
      { u: 52, f: 44, r: 6, c: 0x5a7478, sz: 0.3 },
      { u: 30, f: 70, r: 8, c: 0x4a6266, sz: 0.3 }
    ]);
    // the swell: ridges, white breaking on their crests (none where the
    // boat's tied up)
    for (const [f, n] of [
      [2.5, 6],
      [5, 6],
      [9.5, 7],
      [13, 7],
      [16, 7],
      [20.2, 6]
    ])
      for (let k = 0; k < n; k++) {
        const len = P.r(7, 13);
        const u = -42 + (k + P.r(0.2, 0.8)) * (84 / n);
        if (f > 12 && Math.abs(u - SH.RIB[0]) < 8) continue;
        const ff = f + P.r(-0.7, 0.7);
        const hh = P.r(0.25, 0.42);
        const ridge = [
          [-1.3, 0],
          [1.0, 0],
          [0.2, hh]
        ];
        P.add(prism(ridge, len), 0x24485a, u, G, ff, 0, Math.PI / 2, 0);
        for (let j = 0; j < 5; j++)
          P.add(
            BOX(P.r(0.4, 1.3), 0.08, P.r(0.25, 0.5)),
            0xc8d8dc,
            u + P.r(-len / 2.3, len / 2.3),
            G + hh - 0.03,
            ff + 0.15 + P.r(-0.1, 0.1),
            0,
            P.r(-0.3, 0.3),
            0
          );
      }
    // the hull: black topsides, a red band at the water, a white sheer line
    P.add(prism(HULL, SH.BEAM), 0x22262c, 0, G, SH.F + SH.BEAM / 2);
    P.add(BOX(65, 0.7, 0.08), 0x9a2a1e, -2, G + 0.25, SH.F - 0.04);
    P.add(BOX(63, 0.15, 0.06), 0xe8e8e0, 2, G + SH.DECK - 0.35, SH.F - 0.04);
    P.add(BALL(0.38, 8), 0x0e0e10, -35.6, G + 4.6, SH.F - 0.02, 0, 0, 0, 1, 1, 0.3);
    for (const u of [-25, -6, 14, 28]) P.add(BOX(2.2, 0.35, 0.6), 0xd8e4e8, u, G + 0.15, SH.F - 0.3);
    // the rails along the deck and the forecastle
    for (const [u0, u1, h] of [
      [-29.5, 33.5, SH.DECK],
      [-38.5, -30.5, SH.FC]
    ]) {
      for (let u = u0; u <= u1 + 0.01; u += 2.5) P.add(BOX(0.08, 1.1, 0.08), 0xd8d8d0, u, G + h + 0.55, SH.F + 0.15);
      for (const y of [0.55, 1.1]) P.add(BOX(u1 - u0, 0.06, 0.06), 0xd8d8d0, (u0 + u1) / 2, G + h + y, SH.F + 0.15);
    }
    // the containers (the front row's faces ribbed)
    for (const [u0, u1] of SH.BAYS) {
      const um = (u0 + u1) / 2;
      ROWF.forEach((f, r) => {
        for (let t = 0; t < SH.TIERS[r]; t++) {
          const c = BOXES[Math.floor(P.r(0, BOXES.length))];
          const h = G + SH.DECK + 1.3 + t * 2.6;
          P.add(BOX(u1 - u0 - 0.1, 2.55, 2.38), c, um, h, f);
          if (r === 0)
            for (let x = u0 + 0.5; x < u1 - 0.3; x += 0.8) P.add(BOX(0.1, 2.3, 0.05), darker(c), x, h, f - 1.2);
        }
      });
    }
    // the cranes in the gaps, jibs up over the bow, one lifting a box
    for (const [i, u] of SH.CRANES.entries()) {
      const base = G + SH.DECK;
      const cf = SH.CRANE_F;
      P.add(CYL(0.8, 1.0, 8.2, 10), 0xe8b020, u, base + 4.1, cf);
      P.add(BOX(2.6, 2.3, 2.8), 0xe8b020, u, base + 9.3, cf);
      P.add(BOX(2.0, 0.9, 0.06), 0x1e2a36, u - 0.1, base + 9.6, cf - 1.43);
      const L = 13;
      const a = 0.38;
      P.add(BOX(L, 0.6, 0.7), 0xe8b020, u - (L / 2) * Math.cos(a), base + 10 + (L / 2) * Math.sin(a), cf, 0, 0, -a);
      const tip = [u - L * Math.cos(a), base + 10 + L * Math.sin(a), cf];
      if (i === 0) {
        strut(P, tip, [tip[0], base + 10.9, cf], 0.06, 0x1a1a1a);
        P.add(BOX(6, 2.55, 2.4), 0xa8302a, tip[0], base + 9.6, cf);
      } else {
        strut(P, tip, [tip[0], base + 11.5, cf], 0.06, 0x1a1a1a);
        P.add(BOX(0.5, 0.7, 0.5), 0xe8b020, tip[0], base + 11.2, cf);
      }
    }
    // the house: three decks of cabins, the bridge and its wings
    const hu = SH.HOUSE;
    for (let k = 0; k < 3; k++) {
      const y = G + SH.DECK + k * 2.6;
      P.add(BOX(10, 2.6, 12), 0xe8e8e2, hu, y + 1.3, SH.ROW0 + 6);
      P.add(BOX(10.2, 0.12, 12.2), 0xa8a8a2, hu, y + 2.6, SH.ROW0 + 6);
      for (let j = 0; j < 5; j++)
        P.add(BOX(1.0, 0.8, 0.08), (j + k) % 3 ? LIT : 0x2a3038, hu - 4 + j * 2, y + 1.5, SH.ROW0 - 0.03);
    }
    const yb = G + SH.YB;
    P.add(BOX(15, 2.6, 6), 0xe8e8e2, hu, yb + 1.3, SH.ROW0 + 3);
    for (let j = 0; j < 8; j++) P.add(BOX(1.4, 1.1, 0.1), 0xa8e0c8, hu - 6.5 + j * 1.85, yb + 1.55, SH.ROW0 - 0.04);
    P.add(BOX(15.6, 0.25, 6.6), 0xd0d0c8, hu, yb + 2.72, SH.ROW0 + 3);
    for (const s of [-1, 1]) {
      P.add(BOX(1.6, 2.6, 2.4), 0xe8e8e2, hu + s * 8.3, yb + 1.3, SH.ROW0 - 0.6);
      P.add(BOX(1.2, 1.0, 0.08), 0xa8e0c8, hu + s * 8.3, yb + 1.55, SH.ROW0 - 1.82);
    }
    P.add(BALL(0.22, 6), 0xff2a2a, hu - 8.3, yb + 2.9, SH.ROW0 - 1.6);
    // the funnel, the mast and radar on the bridge, the stern mast
    P.add(BOX(3.6, 7.5, 4.2), 0x1e2a5a, hu + 2, yb + 3.75, 33);
    P.add(BOX(3.7, 1.0, 4.3), 0xc0182a, hu + 2, yb + 5.8, 33);
    P.add(BOX(3.7, 0.5, 4.3), 0x151515, hu + 2, yb + 7.35, 33);
    P.add(CYL(0.12, 0.15, 4.5, 6), 0xd8d8d0, hu - 1, yb + 5.1, SH.ROW0 + 3.3);
    P.add(BOX(4, 0.12, 0.12), 0xd8d8d0, hu - 1, yb + 6.4, SH.ROW0 + 3.3);
    P.add(BOX(3.2, 0.18, 0.35), 0xe8e8e2, hu - 1, yb + 4.0, SH.ROW0 + 3.3);
    P.add(BALL(0.18, 6), 0xfff6e0, hu - 1, yb + 7.45, SH.ROW0 + 3.3);
    const [mu, mf] = SH.MAST;
    for (const x of [-0.5, 0.5]) P.add(BOX(0.16, 17, 0.16), 0xd8d8d0, mu + x, G + SH.DECK + 8.5, mf + 0.3);
    for (let y = SH.DECK + 2; y < 21; y += 3) P.add(BOX(1.1, 0.08, 0.08), 0xd8d8d0, mu, G + y, mf + 0.3, 0, 0, 0.5);
    P.add(BOX(4.4, 0.14, 0.14), 0xd8d8d0, mu, G + 21.0, mf + 0.3);
    for (const [y, c] of [
      [17.5, 0xc0182a],
      [15.8, 0xf2c230],
      [14.1, 0x2a5a9a]
    ])
      P.add(BOX(0.9, 0.6, 0.04), c, mu - 0.9, G + y, mf + 0.3);
    // lifeboats: one in its davits over the side, the freefall one astern
    P.add(CAP(1.0, 4.6, 10), 0xff7a1a, hu, G + SH.DECK + 3.4, SH.F - 0.4, 0, 0, Math.PI / 2);
    P.add(BOX(5.6, 0.5, 1.6), 0xf4f0e8, hu, G + SH.DECK + 4.25, SH.F - 0.4);
    for (const x of [-2.6, 2.6]) P.add(BOX(0.25, 2.8, 0.25), 0x9a9ea6, hu + x, G + SH.DECK + 4.0, SH.F + 0.2, -0.35);
    P.add(BOX(7.5, 0.25, 2.6), 0x9a9ea6, 30.5, G + SH.DECK + 2.6, 29.5, 0, 0, -0.55);
    P.add(CAP(1.1, 4.4, 10), 0xff7a1a, 30.4, G + SH.DECK + 3.8, 29.5, 0, 0, 1.02);
    // the forecastle: its mast, bollards, the windlass
    P.add(CYL(0.2, 0.25, 9, 6), 0xd8d8d0, -34, G + SH.FC + 4.5, 30);
    P.add(BALL(0.2, 6), 0xfff6e0, -34, G + SH.FC + 9.1, 30);
    for (const u of [-37, -33]) P.add(CYL(0.25, 0.3, 0.6, 8), 0x1a1a1a, u, G + SH.FC + 0.3, SH.F + 1.5);
    P.add(BOX(2.2, 1.0, 1.4), 0x3a5a3a, -35, G + SH.FC + 0.5, SH.F + 5);
    // the pirates' boat tied up alongside, the ladder they came up
    const [ru, rf] = SH.RIB;
    for (const s of [-1, 1])
      P.add(CYL(0.42, 0.42, 6.0, 10), 0x3e444a, ru + 0.4, G + 0.42, rf + s * 0.95, 0, 0, Math.PI / 2);
    P.add(BALL(0.95, 10), 0x3e444a, ru - 2.6, G + 0.42, rf, 0, 0, 0, 1, 0.45, 1.0);
    P.add(BOX(6, 0.2, 1.6), 0x1a1c20, ru + 0.4, G + 0.3, rf);
    P.add(BOX(0.8, 1.0, 0.8), 0xd8d8d0, ru + 0.4, G + 0.85, rf);
    P.add(BOX(0.5, 1.2, 0.5), 0x1a1a1a, ru + 3.6, G + 0.75, rf);
    P.add(BOX(0.7, 0.5, 0.6), 0x101010, ru + 3.6, G + 1.4, rf);
    strut(P, [ru - 2.6, G + 0.8, rf - 0.2], [-8, G + SH.DECK + 1.0, SH.F + 0.1], 0.04, 0xd8c8a0);
    for (const x of [-0.3, 0.3]) P.add(BOX(0.04, SH.DECK, 0.04), 0xd8c8a0, -9 + x, G + SH.DECK / 2 + 0.5, SH.F - 0.06);
    for (let y = 0.8; y < SH.DECK + 0.4; y += 0.45) P.add(BOX(0.7, 0.06, 0.1), 0x8a5a2a, -9, G + y, SH.F - 0.08);
    // a buoy, its light
    P.add(CYL(0.6, 0.7, 1.4, 10), 0xc0182a, 19, G + 0.5, 10);
    for (const [x, z] of [
      [-0.35, -0.35],
      [0.35, -0.35],
      [-0.35, 0.35],
      [0.35, 0.35]
    ])
      P.add(BOX(0.06, 1.0, 0.06), 0xc0182a, 19 + x, G + 1.7, 10 + z);
    P.add(BOX(0.9, 0.08, 0.9), 0xc0182a, 19, G + 2.18, 10);
    // the storm: rain, and lightning off over the sea
    for (let k = 0; k < 140; k++) {
      const f = P.r(2, 40);
      P.add(BOX(0.03, 1.3, 0.03), 0x9aa8b0, P.r(-1.1, 1.1) * (f + 9), G + P.r(0.5, 18), f, 0, 0, 0.22);
    }
    const bolt = [
      [-44, 40],
      [-40, 34],
      [-44, 29],
      [-38, 23],
      [-41, 18],
      [-37, 13]
    ];
    for (let k = 1; k < bolt.length; k++)
      strut(P, [bolt[k - 1][0], G + bolt[k - 1][1], 64], [bolt[k][0], G + bolt[k][1], 64], 0.6, 0xffffff);
    strut(P, [-40, G + 34, 64], [-48, G + 27, 64], 0.35, 0xffffff);
  },
  slots: [],
  cover: null
};

LAYOUTS.hostage_ship = L => {
  const fixed = { fixed: true, rail: false };
  // life rings and drums in the water, the buoy's light
  L.row({
    kind: "hostage_ring",
    n: 5,
    f: 7.5,
    u0: -6,
    u1: 6,
    base: 0.2,
    size: 0.6,
    tint: ["orange", "white"],
    bank: 5,
    rail: false
  });
  L.row({
    kind: "can",
    n: 4,
    f: 11.5,
    u0: -14,
    u1: 14,
    base: 0.18,
    size: 0.75,
    tint: ["blue", "red"],
    bank: 2,
    rail: false
  });
  L.row({ ...fixed, kind: "lantern", n: 1, f: 10, u0: 19, u1: 19, base: 2.22, size: 0.45, tint: "red" });
  // life rings on the ship's rail, the stern mast's lamps
  L.row({
    ...fixed,
    kind: "hostage_ring",
    n: 4,
    f: SH.F - 0.05,
    u0: -25,
    u1: 11,
    base: SH.DECK + 0.25,
    size: 0.62,
    tint: "orange",
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 3,
    f: SH.MAST[1],
    u0: SH.MAST[0] - 1.4,
    u1: SH.MAST[0] + 1.4,
    base: 21.08,
    size: 0.45,
    tint: ["red", "gold", "green"],
    bank: 3
  });
  const crew = [...gang(35, 35, 15), ["hostage_sailor", 15, { dont: true }]];
  // up in the boat; along the deck's rail; on the forecastle
  L.pops({
    fixed: true,
    f: SH.RIB[1] + 0.8,
    at: [
      [SH.RIB[0] - 1.6, 0.3],
      [SH.RIB[0] + 1.2, 0.3]
    ],
    size: 1.7,
    kinds: gang(40, 40, 20)
  });
  L.pops({
    fixed: true,
    f: SH.F + 0.7,
    at: [-21, -14.5, -6, 0.5, 8, 30].map(u => [u, SH.DECK]),
    size: 1.7,
    kinds: crew
  });
  L.pops({
    fixed: true,
    f: SH.F + 0.6,
    at: [
      [-36, SH.FC - 0.5],
      [-32.5, SH.FC - 0.5]
    ],
    size: 1.6,
    kinds: gang(40, 40, 20)
  });
  // up on the containers
  L.pops({
    fixed: true,
    f: SH.ROW0 + 0.2,
    at: [-24, -6, 10].map(u => [u, SH.DECK + 5.2]),
    size: 1.6,
    kinds: gang(40, 35, 25)
  });
  L.pops({
    fixed: true,
    f: SH.ROW0 + 2.5,
    at: [-20, 6].map(u => [u, SH.DECK + 7.8]),
    size: 1.5,
    period: [5, 8],
    kinds: gang(40, 35, 25)
  });
  // in the cranes' cabs, on the bridge (the captain: don't), its wing
  L.pops({
    fixed: true,
    f: SH.CRANE_F - 1.55,
    at: SH.CRANES.map(u => [u, SH.DECK + 8.3]),
    size: 1.3,
    period: [5, 8],
    kinds: gang(50, 30, 20)
  });
  L.pops({
    fixed: true,
    f: SH.ROW0 - 0.15,
    at: [-4.8, -1.1, 2.6].map(x => [SH.HOUSE + x, SH.YB + 0.2]),
    size: 1.6,
    kinds: [...gang(30, 30, 15), ["hostage_sailor", 25, { dont: true }]]
  });
  L.pops({
    fixed: true,
    f: SH.ROW0 - 1.9,
    at: [[SH.HOUSE - 8.3, SH.YB + 0.2]],
    size: 1.5,
    period: [6, 9],
    kinds: gang(40, 40, 20)
  });
};

// Along the deck behind the rail; now and then he stops and aims.
function deckRunS(R, add, t, c) {
  const right = R(0, 1) < 0.5;
  const [a, b] = [-29, 15];
  const f = SH.F + 0.65;
  if (R(0, 1) < 0.5) {
    add(t, pick(R, GANG), cross(R, { u0: right ? a : b, u1: right ? b : a, f, h: SH.DECK, v: R(3.6, 5) * c.S }));
    return;
  }
  add(
    t,
    pick(R, GANG),
    rush(
      R,
      [
        [right ? a : b, f, G + SH.DECK],
        [R(-20, 8), f, G + SH.DECK]
      ],
      R(3.5, 4.5) * c.S
    )
  );
}
// Across the tops of the front row of containers.
function topRun(R, add, t, c) {
  const right = R(0, 1) < 0.5;
  const [a, b] = [-28, 14];
  add(
    t,
    pick(R, GANG),
    cross(R, { u0: right ? a : b, u1: right ? b : a, f: SH.ROW0 + 0.5, h: SH.DECK + 5.2, v: R(3.6, 5) * c.S })
  );
}
// Down the ladder into the boat.
function ladder(R, add, t, c) {
  add(
    t,
    pick(R, GANG),
    stroll(
      [
        [-9, SH.F + 0.6, G + SH.DECK],
        [-9, SH.F - 0.2, G + SH.DECK],
        [-9, SH.F - 0.2, G + 0.6],
        [SH.RIB[0], SH.RIB[1], G + 0.3]
      ],
      1.6 * c.S
    )
  );
}
function shipNade(R, add, t) {
  add(
    t,
    "hostage_nade",
    lobbed(R, { u: R(-26, 12), f: SH.F - 0.2, h: G + SH.DECK + 1.3, vh: R(3, 5), vu: R(-1.5, 1.5), vf: -R(5, 7) })
  );
}

const shipWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // their boats come in, and they're all over the deck
    for (let k = 0; k < 5; k++) add(1 + k * 4.8, "hostage_boat", run(R, { v: R(11, 14) * c.S, f: R(2.5, 6) }));
    for (let k = 0; k < 5; k++) deckRunS(R, add, 2 + k * 4, c);
    for (let k = 0; k < 3; k++) topRun(R, add, 3 + k * 6, c);
    for (let k = 0; k < 3; k++) shipNade(R, add, 5 + k * 6, c);
    return;
  }
  const k = c.w % 6;
  for (let j = 0; j < 1 + n(1.3); j++) deckRunS(R, add, R(1, 22), c);
  for (let j = 0; j < n(1.1); j++) topRun(R, add, R(1, 20), c);
  if (k === 1 || k === 4)
    for (let j = 0; j < 1 + n(0.6); j++) add(R(2, 20), "hostage_boat", run(R, { v: R(11, 14) * c.S, f: R(2.5, 6) }));
  if (k === 2 || k === 5) for (let j = 0; j < 1 + n(1.2); j++) shipNade(R, add, R(1, 22), c);
  if (k === 0 || k === 3) flyers(["hostage_gull", "heli"], R, add, c, 2 + n(2));
  if (k === 3) ladder(R, add, R(2, 14), c);
  if (R(0, 1) < 0.4)
    add(R(2, 16), "hostage_sailorRun", cross(R, { u0: -28, u1: 14, f: SH.F + 0.65, h: SH.DECK, v: 1.8 }));
};

// ---- Level 5: the tower ---------------------------------------------------------------

// A skyscraper's roof at night: the helipad (its middle PAD, the H at H)
// with his helicopter, the stair house with its lit door (STAIR), rooftop
// units for cover (HVAC: u, f, w, h, d), the water tank, the dishes, the
// window cleaners' crane (BMU) on its track, the parapet at EDGE; the
// towers round about (T1, T2 with their lit windows).
const TW = {
  PAD: [-2, 17],
  H: 14.2,
  HELI: [-1.4, 20.6],
  STAIR: [-18, 15],
  DOOR: 12.47,
  HVAC: [
    [-14, 8, 3.2, 1.8, 2.2],
    [13, 8.5, 2.6, 1.6, 2.6],
    [18, 17, 4, 2.2, 3]
  ],
  TANK: [15, 28],
  BMU: 40,
  EDGE: 44,
  T1: {
    u: -36,
    w: 16,
    f: 50,
    h: 46,
    crown: 0x8ad0ff,
    WIN: [
      [-40, 8.4],
      [-34.67, 12.0],
      [-29.33, 8.4],
      [-37.33, 19.2]
    ]
  },
  T2: {
    u: 37,
    w: 14,
    f: 54,
    h: 36,
    crown: 0xff8a5a,
    WIN: [
      [31.4, 8.4],
      [37, 15.6],
      [42.6, 8.4]
    ]
  },
  ZIP: [
    [-33, 49.4, 24],
    [-20, 30.4, 0.4]
  ]
};

function helicopter(P, u, f) {
  const y = G + 0.25;
  const body = 0x1a1e2a;
  P.add(BALL(1.5, 14), body, u, y + 1.6, f, 0, 0, 0, 1.9, 1, 1);
  P.add(BOX(4.6, 0.18, 2.95), 0xf2c230, u, y + 1.35, f);
  P.add(BALL(1.2, 12), 0x2a4a6a, u - 2.2, y + 1.75, f, 0, 0, 0, 1.15, 0.9, 1);
  P.add(BOX(1.4, 1.1, 0.06), 0x0e0e12, u + 0.2, y + 1.6, f - 1.45);
  P.add(CYL(0.18, 0.35, 5.5, 8), body, u + 4.6, y + 1.95, f, 0, 0, -Math.PI / 2);
  P.add(
    prism(
      [
        [0, 0],
        [1.2, 0],
        [1.5, 1.6],
        [0.9, 1.6]
      ],
      0.12
    ),
    body,
    u + 6.4,
    y + 1.95,
    f
  );
  for (const r of [0, Math.PI / 2]) P.add(BOX(0.08, 1.4, 0.1), 0x3a3a3e, u + 7.3, y + 2.75, f - 0.2, 0, 0, r);
  P.add(CYL(0.12, 0.12, 0.6, 6), 0x3a3a3e, u, y + 2.85, f);
  P.add(BALL(0.25, 6), 0x3a3a3e, u, y + 3.15, f);
  for (const r of [0.4, 0.4 + Math.PI / 2]) P.add(BOX(11.2, 0.05, 0.35), 0x2a2a2e, u, y + 3.2, f, 0, r, 0);
  for (const s of [-1, 1]) {
    P.add(CYL(0.07, 0.07, 4.6, 6), 0x3a3a3e, u - 0.2, y + 0.1, f + s * 1.0, 0, 0, Math.PI / 2);
    for (const x of [-1.2, 0.8]) P.add(BOX(0.08, 0.7, 0.08), 0x3a3a3e, u + x, y + 0.45, f + s * 0.9, s * 0.3);
  }
  P.add(BALL(0.12, 6), 0xff2a2a, u + 6.9, y + 3.6, f);
}

WORLDS.hostage_tower = {
  sky: {
    top: "#04040c",
    mid: "#12102a",
    horizon: "#40284a",
    ground: "#0a0a12",
    sun: [-30, 21, "#f4f0e0", 7],
    stars: true,
    clouds: 3,
    cloud: "rgba(90,70,110,0.3)",
    skyline: "#0c0c18",
    windows: "#f2d27a",
    seed: 64
  },
  fog: 0x1a1628,
  signs: [
    ["MERIDIAN TOWER", 14, G + 5.2, TW.EDGE - 0.4, 9, 1.4, "#151018", "#ff4a6a"],
    ["EXIT", TW.STAIR[0], G + 2.75, TW.DOOR - 0.02, 1.0, 0.36, "#1a8a3a", "#ffffff"],
    ["H", TW.PAD[0] - 10.5, G + 2.2, TW.PAD[1] - 6.6, 1.4, 1.4, "#2e3a36", "#ffffff"],
    ["DANGER ROTORS", TW.PAD[0] + 10.5, G + 1.4, TW.PAD[1] - 6.6, 2.6, 0.5, "#f2c230", "#151515"]
  ],
  build(P) {
    P.ground(0x34363c, [
      { u: TW.PAD[0], f: TW.PAD[1], r: 10, c: 0x2a2c30, sx: 1.1, sz: 0.95 },
      { u: -16, f: 34, r: 6, c: 0x2c2e34 },
      { u: 20, f: 30, r: 5, c: 0x2e3036 }
    ]);
    // the helipad: deck, edge lights, the circle and the H, his helicopter
    const [pu, pf] = TW.PAD;
    P.add(BOX(17, 0.24, 16), 0x2e3a36, pu, G + 0.12, pf);
    for (const [a, b, w, d] of [
      [pu, pf - 8, 17, 0.3],
      [pu, pf + 8, 17, 0.3],
      [pu - 8.5, pf, 0.3, 16],
      [pu + 8.5, pf, 0.3, 16]
    ])
      P.add(BOX(w, 0.06, d), 0xf4f4f0, a, G + 0.26, b);
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      P.add(BALL(0.14, 5), k % 2 ? 0x4aff7a : 0xf2e24a, pu + Math.cos(a) * 8.3, G + 0.34, pf + Math.sin(a) * 7.8);
    }
    P.add(TORUS(6.6, 0.28, 32), 0xf2c230, pu, G + 0.27, TW.H, Math.PI / 2);
    for (const s of [-1, 1]) P.add(BOX(1.7, 0.06, 8.6), 0xffffff, pu + s * 2.8, G + 0.28, TW.H);
    P.add(BOX(4.0, 0.06, 1.7), 0xffffff, pu, G + 0.28, TW.H);
    helicopter(P, TW.HELI[0], TW.HELI[1]);
    for (const s of [-1, 1]) {
      P.add(BOX(0.12, 1.2, 0.12), 0x3a3a3e, pu + s * 9.6, G + 0.6, pf - 8);
      P.add(BOX(0.6, 0.35, 0.3), 0xfff6d8, pu + s * 9.6, G + 1.3, pf - 8.05);
      P.add(BOX(0.1, 2.6, 0.1), 0x3a3a3e, pu + s * 10.5, G + 1.0, pf - 6.5);
    }
    // the windsock
    P.add(CYL(0.05, 0.05, 4, 6), 0xd8d8d0, pu + 12, G + 2, pf - 1);
    P.add(CONE(0.32, 1.7, 8), 0xff7a1a, pu + 11.1, G + 3.8, pf - 1, 0, 0, Math.PI / 2);
    P.add(CYL(0.25, 0.27, 0.25, 8), 0xffffff, pu + 11.3, G + 3.8, pf - 1, 0, 0, Math.PI / 2);
    // the stair house, its lit door; the units, the tank, dishes, masts
    const [su, sf] = TW.STAIR;
    P.add(BOX(5, 3.4, 5), 0x8a8680, su, G + 1.7, sf);
    P.add(BOX(5.4, 0.2, 5.4), 0x6a6862, su, G + 3.5, sf);
    P.add(BOX(2.6, 1.4, 2.6), 0x7a7872, su + 0.8, G + 4.3, sf + 0.8);
    P.add(BOX(1.4, 2.5, 0.06), 0x2a2a2e, su, G + 1.25, TW.DOOR);
    P.add(BOX(1.2, 2.3, 0.06), 0xffeec0, su, G + 1.15, TW.DOOR - 0.02);
    for (const [u, f, w, h, d] of TW.HVAC) {
      P.add(BOX(w, h, d), 0x8a8e94, u, G + h / 2, f);
      for (let k = 0; k < 5; k++)
        P.add(BOX(w - 0.4, 0.06, 0.04), 0x3a3c40, u, G + 0.35 + k * ((h - 0.6) / 4), f - d / 2 - 0.02);
      P.add(CYL(0.6, 0.6, 0.2, 12), 0x3a3c40, u - w / 4, G + h + 0.1, f);
      P.add(CYL(0.6, 0.6, 0.2, 12), 0x3a3c40, u + w / 4, G + h + 0.1, f);
    }
    P.add(BOX(0.8, 0.8, 3.4), 0x9a9ea4, TW.HVAC[0][0] - 1.4, G + 0.4, TW.HVAC[0][1] + 2.8);
    const [tu, tf] = TW.TANK;
    for (const [x, z] of [
      [-1.2, -1.2],
      [1.2, -1.2],
      [-1.2, 1.2],
      [1.2, 1.2]
    ])
      P.add(BOX(0.2, 1.6, 0.2), 0x3a3a3e, tu + x, G + 0.8, tf + z);
    P.add(CYL(1.8, 1.8, 3.2, 14), 0x9a8a7a, tu, G + 3.2, tf);
    P.add(CONE(1.9, 0.8, 14), 0x7a6a5a, tu, G + 5.2, tf);
    for (let y = 0.4; y < 4.8; y += 0.4) P.add(BOX(0.5, 0.05, 0.05), 0x3a3a3e, tu - 0.8, G + y, tf - 1.82);
    for (const u of [-22, -18.5]) {
      P.add(BOX(0.2, 1.3, 0.2), 0x6a6e74, u, G + 0.65, 30.6);
      P.add(CYL(1.0, 0.15, 0.35, 12), 0xd8d8d4, u, G + 1.7, 30.4, -0.7);
    }
    P.add(BOX(1.6, 1.2, 0.8), 0x6a6e74, 24, G + 0.6, 33.6);
    for (const [x, z] of [
      [-0.4, 0.3],
      [0.4, 0.3],
      [0, -0.4]
    ])
      P.add(CYL(0.06, 0.06, 12, 4), 0xc8c8c8, 24 + x, G + 6, 34.2 + z);
    for (let y = 2; y < 12; y += 2.5) P.add(BOX(0.9, 0.05, 0.9), 0xc8c8c8, 24, G + y, 34.2);
    P.add(BALL(0.22, 6), 0xff2a2a, 24, G + 12.2, 34.2);
    P.add(CYL(0.1, 0.15, 14, 6), 0xc8c8c8, -26, G + 7, 36);
    P.add(BALL(0.22, 6), 0xff2a2a, -26, G + 14.2, 36);
    // the zip line from the tower across the way, its anchor post
    const [z0, z1] = TW.ZIP;
    P.add(BOX(0.3, 2.6, 0.3), 0x5a5e66, z1[0], G + 1.3, z1[1] - 0.2);
    strut(P, [z0[0], G + z0[2] + 2.05, z0[1] + 0.2], [z1[0], G + z1[2] + 2.05, z1[1] - 0.2], 0.04, 0x1a1a1e);
    // the window cleaners' crane on its track
    const B = TW.BMU;
    for (const z of [-0.5, 0.5]) P.add(BOX(40, 0.12, 0.12), 0x6a6e74, 12, G + 0.06, B + z);
    P.add(BOX(3, 2.4, 2.6), 0xe8e4d8, 26, G + 1.4, B);
    P.add(BOX(0.5, 3, 0.5), 0xe8e4d8, 26, G + 4.1, B);
    P.add(BOX(9.5, 0.5, 0.5), 0xe8e4d8, 21.5, G + 5.4, B);
    for (const x of [16.5, 18.5]) P.add(BOX(0.04, 1.4, 0.04), 0x1a1a1a, x, G + 4.6, B);
    P.add(BOX(3.2, 0.12, 0.9), 0xc8c8c0, 17.5, G + 3.1, B);
    P.add(BOX(3.2, 0.06, 0.06), 0xc8c8c0, 17.5, G + 4.2, B - 0.45);
    P.add(BOX(3.2, 0.5, 0.04), 0xc8c8c0, 17.5, G + 3.4, B - 0.45);
    // the parapet and its railing; the sign on its frame
    const E = TW.EDGE;
    P.add(BOX(120, 1.2, 0.5), 0x8a8680, 0, G + 0.6, E);
    P.add(BOX(120, 0.12, 0.7), 0xb0aca4, 0, G + 1.26, E);
    for (let u = -58; u <= 58; u += 4) P.add(BOX(0.06, 1.0, 0.06), 0x9a9ea4, u, G + 1.82, E + 0.25);
    P.add(BOX(120, 0.07, 0.07), 0x9a9ea4, 0, G + 2.32, E + 0.25);
    for (const u of [9.6, 18.4]) P.add(BOX(0.2, 6.2, 0.2), 0x3a3a3e, u, G + 3.1, E - 0.2);
    P.add(BOX(9.6, 0.2, 0.2), 0x3a3a3e, 14, G + 6.1, E - 0.2);
    // the towers round about (their lit windows: where they wait)
    for (const T of [TW.T1, TW.T2])
      tower(P, T.u, T.f, T.w, 14, T.h, 0x262a36, { lit: 0.34, grid: true, crown: T.crown, force: T.WIN });
    // (T1's top: a setback, its spire)
    const t1 = TW.T1;
    tower(P, t1.u, t1.f + 2, 10, 10, t1.h + 8, 0x2a2e3a, { lit: 0.3, crown: 0x8ad0ff });
    P.add(CONE(0.8, 9, 6), 0x5a5e6a, t1.u, G + t1.h + 13, t1.f + 7);
    P.add(BALL(0.35, 6), 0xff2a2a, t1.u, G + t1.h + 17.6, t1.f + 7);
    for (const [u, f, w, h, c, crown] of [
      [-12, 80, 12, 62, 0x22242e, 0xff4a6a],
      [6, 72, 16, 26, 0x2a2a34, 0],
      [20, 84, 12, 48, 0x24262e, 0x8ad0ff],
      [-24, 70, 10, 30, 0x262832, 0],
      [54, 66, 14, 28, 0x22242a, 0],
      [-60, 64, 14, 34, 0x262832, 0xf2c860],
      [36, 90, 16, 56, 0x20222c, 0]
    ])
      tower(P, u, f, w, 12, h, c, { lit: 0.3, crown });
    P.add(CONE(1.2, 10, 6), 0x3a3c46, -12, G + 67, 86);
    P.add(BALL(0.4, 6), 0xff2a2a, -12, G + 72.2, 86);
    // a generator at the front, its fuel tins
    P.add(BOX(2.6, 1.1, 1.3), 0x5a6a4a, 6.5, G + 0.55, 5.2);
    P.add(CYL(0.08, 0.08, 0.8, 6), 0x2a2a2a, 7.5, G + 1.5, 5.5);
  },
  slots: [],
  cover: null
};

LAYOUTS.hostage_tower = L => {
  const fixed = { fixed: true, rail: false };
  const [hA, , hC] = TW.HVAC;
  // tins on a unit, bottles on another, fuel tins on the generator; pigeons
  // on the stair house and along the parapet; the ransom by the helicopter
  L.row({
    ...fixed,
    kind: "can",
    n: 4,
    f: hA[1] - hA[4] / 2 + 0.2,
    u0: hA[0] - 1.2,
    u1: hA[0] + 1.2,
    base: hA[3] + 0.02,
    size: 0.26,
    tint: ["steel", "red"],
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "bottle",
    n: 3,
    f: hC[1] - hC[4] / 2 + 0.2,
    u0: hC[0] - 1.2,
    u1: hC[0] + 1.2,
    base: hC[3] + 0.02,
    size: 0.4,
    tint: ["green", "brown"],
    bank: 3
  });
  L.row({ ...fixed, kind: "can", n: 3, f: 4.65, u0: 5.7, u1: 7.0, base: 1.12, size: 0.28, tint: "red", bank: 3 });
  L.row({
    ...fixed,
    kind: "crow",
    n: 3,
    f: TW.STAIR[1] - 2.45,
    u0: TW.STAIR[0] - 1.6,
    u1: TW.STAIR[0] + 1.6,
    base: 3.6,
    size: 0.4,
    tint: "steel",
    bank: 3
  });
  L.row({
    ...fixed,
    kind: "hostage_case",
    n: 3,
    f: TW.HELI[1] - 4,
    u0: -2.4,
    u1: -0.4,
    base: 0.25,
    size: 0.45,
    tint: ["steel", "brown"],
    bank: 3
  });
  for (const [u0, u1] of [
    [-24, -14],
    [6, 16]
  ])
    L.row({ ...fixed, kind: "crow", n: 3, f: TW.EDGE - 0.1, u0, u1, base: 1.32, size: 0.45, tint: "steel", bank: 3 });
  // round the units, out of the stair door, round the tank
  for (const [u, f, w, , d] of TW.HVAC)
    L.pops({
      fixed: true,
      peek: true,
      f: f + d / 2 + 0.2,
      at: [[u + (u < 0 ? -1 : 1) * (w / 2 - 0.6), 0]],
      size: 1.75,
      slide: 2.2,
      kinds: gang(40, 40, 20)
    });
  L.pops({
    fixed: true,
    f: TW.DOOR - 0.15,
    at: [[TW.STAIR[0], 0]],
    size: 1.75,
    kinds: [...gang(40, 35, 15), ["hostage", 15, { dont: true }]]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: TW.TANK[1] + 1.2,
    at: [[TW.TANK[0] + 0.8, 0]],
    size: 1.75,
    slide: 2.4,
    kinds: gang(40, 40, 20)
  });
  // round his helicopter: in its door, round its nose, under its tail (and
  // now and then the leader himself)
  const heli = [...gang(30, 30, 15), ["hostage_leader", 12, { pts: 250 }], ["hostage", 13, { dont: true }]];
  L.pops({ fixed: true, f: TW.HELI[1] - 1.6, at: [[TW.HELI[0] + 0.2, 0.9]], size: 1.3, kinds: heli });
  L.pops({
    fixed: true,
    peek: true,
    f: TW.HELI[1] + 1.4,
    at: [[TW.HELI[0] - 3.4, 0.25]],
    size: 1.75,
    slide: 2.6,
    kinds: heli
  });
  L.pops({ fixed: true, f: TW.HELI[1] - 0.3, at: [[TW.HELI[0] + 4.4, 0.25]], size: 1.6, kinds: heli });
  // behind the dishes and the masts' cabinet; on the cleaners' cradle
  L.pops({ fixed: true, peek: true, f: 31.2, at: [[-22, 0]], size: 1.75, slide: 2.2, kinds: gang(40, 40, 20) });
  L.pops({ fixed: true, f: 34.3, at: [[24, 0]], size: 1.75, kinds: gang(40, 40, 20) });
  L.pops({
    fixed: true,
    f: TW.BMU - 0.55,
    at: [[17.5, 3.16]],
    size: 1.5,
    period: [5, 8],
    kinds: [
      ["hostage_masked", 60, { pts: 25 }],
      ["bad", 40, { pts: 25 }]
    ]
  });
  // over the parapet; in the towers' lit windows
  L.pops({
    fixed: true,
    f: TW.EDGE + 0.45,
    at: [-4, 2, 26].map(u => [u, 0.7]),
    size: 1.6,
    kinds: gang(40, 40, 20)
  });
  for (const T of [TW.T1, TW.T2])
    L.pops({
      fixed: true,
      f: T.f - 0.35,
      at: T.WIN,
      size: 1.6,
      period: [6, 9],
      busy: 0.6,
      kinds: [
        ["hostage_masked", 50, { pts: 50 }],
        ["bad", 50, { pts: 50 }]
      ]
    });
};

// Out of the stair house's door to the front; aims.
function doorRush(R, add, t, c) {
  const [su] = TW.STAIR;
  add(
    t,
    pick(R, GANG),
    rush(
      R,
      [
        [su, TW.DOOR + 0.3, G],
        [su, TW.DOOR - 1.8, G],
        [-11, TW.DOOR - 2.1, G],
        [R(-8, 6), R(3.5, 7), G]
      ],
      R(3, 4) * c.S
    )
  );
}
// Across the roof, in front of the stair house or behind the tank.
function roofCross(R, add, t, c) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(
    t,
    pick(R, GANG),
    cross(R, { u0: -s * R(18, 24), u1: s * R(18, 24), f: pick(R, [5.8, 5.8, 32.2]), v: R(4, 5.5) * c.S })
  );
}
// Down the zip line from the tower across the way, then at you.
function zip(R, add, t, c) {
  const [a, b] = TW.ZIP;
  const ride = walk(
    [
      [a[0], a[1], G + a[2]],
      [b[0], b[1], G + b[2]]
    ],
    9,
    0
  );
  const on = walk(
    [
      [b[0], b[1], G + b[2]],
      [b[0], b[1] - 0.5, G],
      [-12, 22, G],
      [R(-10, -2), R(4, 8), G]
    ],
    R(3.2, 4) * c.S
  );
  add(t, "hostage_mRun", {
    dur: ride.time + on.time + 2,
    charge: true,
    arrive: ride.time + on.time + 0.8,
    pos: (tau, out) => (tau < ride.time ? ride.pos(tau, out) : on.pos(tau - ride.time, out))
  });
}
// The leader walks a hostage out of the stair house to his helicopter,
// keeping her in front of him.
function escort(R, add, t, c) {
  const v = 1.5 * Math.min(1.3, c.S);
  const line = [
    [TW.STAIR[0] + 0.4, TW.DOOR - 0.2, G],
    [TW.STAIR[0] + 1.8, 9.0, G],
    [-7, 10.6, G],
    [-1.6, TW.HELI[1] - 2, G]
  ];
  add(t, "hostage_heldRun", stroll(line, v, 2.5));
  add(
    t,
    "hostage_leaderRun",
    stroll(
      line.map(([u, f, h]) => [u - 0.75, f + 0.45, h]),
      v,
      2.5
    )
  );
}
function roofNade(R, add, t) {
  const [u, f, , h] = pick(R, TW.HVAC);
  add(
    t,
    "hostage_nade",
    lobbed(R, { u: u + R(-1, 1), f: f + 1.6, h: G + h + 0.6, vh: R(5, 7), vu: R(-1, 1), vf: -R(2.5, 3.5) })
  );
}

const towerWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the final breach: he makes for his helicopter, twice, and they all come
    escort(R, add, 2, c);
    escort(R, add, 22, c);
    for (let k = 0; k < 5; k++) doorRush(R, add, 4 + k * 4.5, c);
    for (let k = 0; k < 3; k++) zip(R, add, 1 + k * 8, c);
    for (let k = 0; k < 3; k++) roofCross(R, add, 3 + k * 7, c);
    add(10, "heli", hover(R, { f: 36, h: 13 }));
    return;
  }
  const k = c.w % 6;
  for (let j = 0; j < 1 + n(1.0); j++) doorRush(R, add, R(1, 21), c);
  for (let j = 0; j < n(1.0); j++) roofCross(R, add, R(1, 22), c);
  if (k === 1 || k === 4) for (let j = 0; j < 1 + n(0.8); j++) zip(R, add, R(1, 18), c);
  if (k === 2 || k === 5) for (let j = 0; j < 1 + n(1.0); j++) roofNade(R, add, R(1, 22), c);
  if (k === 0 || k === 3) flyers(["drone", "heli"], R, add, c, 2 + n(1.5));
  if (k === 4 || R(0, 1) < 0.15 + 0.25 * c.p) escort(R, add, R(2, 12), c);
};

// ---- Backgrounds -------------------------------------------------------------------

// Each into d (8.5 s at sr), seeded R; shoots-art loops it.
const noiseBed = () => {
  let lp = 0;
  let lp2 = 0;
  return R => {
    const x = R() * 2 - 1;
    lp += 0.02 * (x - lp);
    lp2 += 0.2 * (x - lp2);
    return [x, lp, lp2];
  };
};
// the car park: a ventilation hum, drips, a car alarm a few levels up
AMBIENCE.hostage_garage = (d, sr, R) => {
  const nz = noiseBed();
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const [, lp, lp2] = nz(R);
    let v =
      lp * 1.2 + (lp2 - lp) * 0.15 + 0.03 * Math.sin(2 * Math.PI * 60 * t) + 0.02 * Math.sin(2 * Math.PI * 120 * t);
    for (const at of [0.7, 2.9, 4.4, 6.8]) {
      const e = (t % 8) - at;
      if (e > 0 && e < 0.15) v += Math.sin(2 * Math.PI * 1700 * e) * Math.exp(-e * 45) * 0.25;
    }
    const s = t % 8;
    if (s > 2 && s < 4.4) v += Math.sin(2 * Math.PI * (700 + 350 * Math.sin(2 * Math.PI * 2 * s)) * t) * 0.012;
    d[i] += v;
  }
};
// the apron: engines idling, the whine over it
AMBIENCE.hostage_airport = (d, sr, R) => {
  const nz = noiseBed();
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const [, lp, lp2] = nz(R);
    const swell = 0.7 + 0.3 * Math.sin((2 * Math.PI * t) / 8);
    d[i] +=
      lp * 1.8 * swell +
      (lp2 - lp) * 0.25 +
      0.018 * swell * Math.sin(2 * Math.PI * 2900 * t) +
      0.008 * Math.sin(2 * Math.PI * 5800 * t);
  }
};
// the storm: rain, gusts, the sea breaking on the hull, thunder
AMBIENCE.hostage_storm = (d, sr, R) => {
  const nz = noiseBed();
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const [x, lp, lp2] = nz(R);
    let v = (x - lp2) * 0.35 + lp * 2.2 * (0.55 + 0.45 * Math.sin((2 * Math.PI * t) / 4));
    const w = t % 4;
    if (w < 1.6) v += lp2 * 1.1 * Math.sin((Math.PI * w) / 1.6);
    const th = (t % 8) - 5;
    if (th > 0 && th < 2.8) v += lp * 6 * Math.exp(-th * 1.4) * (0.6 + 0.4 * Math.sin(th * 9));
    d[i] += v;
  }
};
// the roof: wind, the city far below, a helicopter's rotor, a siren
AMBIENCE.hostage_roof = (d, sr, R) => {
  const nz = noiseBed();
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const [, lp, lp2] = nz(R);
    let v = lp * 2.6 * (0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 8)) + (lp2 - lp) * 0.3;
    v += lp2 * 0.5 * Math.max(0, Math.sin(2 * Math.PI * 6 * t)) ** 8;
    const s = t % 8;
    if (s > 3 && s < 7) v += Math.sin(2 * Math.PI * (620 + 180 * Math.sin((s - 3) * Math.PI)) * t) * 0.015;
    d[i] += v;
  }
};

// ---- The campaign ------------------------------------------------------------------

export const HOSTAGE = {
  name: "HOSTAGE RESCUE",
  kinds,
  levels: [
    {
      world: "hostage_garage",
      name: "THE PARKING GARAGE",
      story: "They got out with hostages. Stop them in the car park",
      music: "hostage",
      amb: "hostage_garage",
      legend: "VAN 75  ·  GRENADES: SHOOT THEM BEFORE THEY LAND  ·  DON'T SHOOT THE HOSTAGES",
      wave: garageWave,
      title: (w, x2) => (x2 ? "THE VAN MAKES A RUN · DOUBLE POINTS" : null)
    },
    {
      world: "hostage_airport",
      name: "THE AIRPORT",
      story: "They've taken a jet on the apron. Get the crew out",
      music: "",
      amb: "hostage_airport",
      legend: "HEADS AT THE WINDOWS 50  ·  DON'T SHOOT THE CREW OR THE PASSENGERS",
      wave: airportWave,
      title: (w, x2) => (x2 ? "STORM THE PLANE · DOUBLE POINTS" : null)
    },
    {
      world: "hostage_ship",
      name: "THE CARGO SHIP",
      story: "Their leader got away to sea. Board the freighter",
      music: "",
      amb: "hostage_storm",
      legend: "SPEEDBOATS 75  ·  GRENADES: SHOOT THEM BEFORE THEY LAND  ·  DON'T SHOOT THE CREW",
      wave: shipWave,
      title: (w, x2) => (x2 ? "THEIR BOATS ARE COMING · DOUBLE POINTS" : null)
    },
    {
      world: "hostage_tower",
      name: "THE TOWER",
      story: "His last stand, on the roof. Take the leader down",
      music: "hostage",
      amb: "hostage_roof",
      legend: "THE LEADER 300 (250 AT THE HELICOPTER)  ·  NOT HIS HOSTAGE: -25",
      wave: towerWave,
      title: (w, x2) => (x2 ? "THE FINAL BREACH · DOUBLE POINTS" : null)
    }
  ],
  done: ["THE LEADER IS DOWN", "EVERY HOSTAGE IS HOME, TEAM"]
};
