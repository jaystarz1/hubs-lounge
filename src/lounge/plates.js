import * as THREE from "three";
import { GROUND, SHIFT, SPREAD, SALOON, groundAt, CARDS, CARD_SIZE } from "./shoots-art";
import { SHAPES } from "./plates-shapes";

// Knockdown plates for the featured shoots (Jay, 2026-10-20: "give us falling
// plates that are shaped like the animals and limit the movers ... most of
// them can be static ... they could fall for a few seconds like the bottles,
// disappear, and then come back"). Each world sets out 35 to 50 painted steel
// cut-outs near (8-15 m), in the middle (15-35 m) and far (35-65 m): rabbits
// and turkeys up close, bucks on the far ridge, henchmen in the lair's
// windows. Three ways a plate shows:
//   stand  always up; hit, it falls back, lies a moment, goes, and stands up
//          again DOWN s later
//   pop    in a window or behind cover: up for 3 s (5 points), 1.8 s (10) or
//          0.9 s (25), then down again; what comes up (a henchman, the girl)
//          is drawn fresh each time from the round's seed
//   peek   slides out from behind cover (deer from the bushes), same timings
// Stand plates come in banks, like a pinball's drop targets: knock a whole
// bank down before any of it comes back and it's BANK +10 a plate, and the
// bank stands straight back up.
// Points by how small the plate looks (smaller = more), as for the movers.
// Everything is worked out from the shared clock, the round's seed and the
// hits, so every headset agrees and only hits go over the network.
//
// Positions are in the worlds' frame (shoots-art.js): x = u (right), y = h
// (up from the roof deck), z = -f (downrange). One atlas texture holds every
// outline; each outline is one InstancedMesh, so a world's plates are a dozen
// draw calls however many there are.

export const DOWN = 5; // s a knocked-down stand plate stays down
const FALL = 0.22; // s to fall back
const LIE = 1.0; // s lying there before it goes
const RISE = 0.3; // s to stand up (or pop up, or slide out)
const FLAT = 1.45; // rad, lying back
const BANK_BACK = 0.8; // s after a bank is cleared it stands up again
const BANK_PER = 10; // bonus per plate in a cleared bank
const DONT = -25;
const TIERS = [
  { up: 3.0, pts: 5 },
  { up: 1.8, pts: 10 },
  { up: 0.9, pts: 25 }
];

export const PAINT = {
  white: 0xf4efe2,
  yellow: 0xf2c230,
  orange: 0xff7a1a,
  red: 0xe8344a,
  blue: 0x6a9ae8,
  green: 0x6ac85a,
  gold: 0xffc93c,
  steel: 0xc8ccd2,
  brown: 0xc8884a,
  pink: 0xf28ab0,
  card: 0xffffff
};
const SOUND = { glass: "glass", bottle: "glass", mug: "glass" };
export const SHATTER = new Set(["glass", "bottle", "mug"]);
export const PLATE_SOUND = SOUND;
export const PERSON = new Set([
  "henchman",
  "boss",
  "girl",
  "bad",
  "hostage",
  "mime",
  "farmer",
  "ranger",
  "hiker",
  "cowboy",
  "gunslinger",
  "outlaw",
  "lady",
  "barkeep"
]);

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- The atlas: every outline drawn once, with a hit mask each -----------------

const ATLAS = 2048;
const CELL = 256;
const PAD = 14;
const MASK = 64;
let atlas = null;

function shapeBox(s) {
  if (s.box) return s.box.slice();
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const take = (pts, r = 0) => {
    for (let k = 0; k < pts.length; k += 2) {
      x0 = Math.min(x0, pts[k] - r);
      x1 = Math.max(x1, pts[k] + r);
      y0 = Math.min(y0, pts[k + 1] - r);
      y1 = Math.max(y1, pts[k + 1] + r);
    }
  };
  for (const p of s.polys || []) take(p);
  for (const [w, ...pts] of s.lines || []) take(pts, w / 2);
  return [x0, y0, x1, y1];
}

function drawShape(ctx, s, rim) {
  const path = pts => {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
  };
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // a dark rim all round, then the white face over it
  ctx.strokeStyle = "#1a1a1a";
  ctx.fillStyle = "#1a1a1a";
  for (const p of s.polys || []) {
    path(p);
    ctx.closePath();
    ctx.lineWidth = rim * 2;
    ctx.stroke();
  }
  for (const d of s.svg || []) {
    ctx.lineWidth = rim * 2;
    ctx.stroke(new Path2D(d));
  }
  for (const [w, ...pts] of s.lines || []) {
    path(pts);
    ctx.lineWidth = w + rim * 2;
    ctx.stroke();
  }
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  for (const p of s.polys || []) {
    path(p);
    ctx.closePath();
    ctx.fill();
  }
  for (const d of s.svg || []) ctx.fill(new Path2D(d));
  for (const [w, ...pts] of s.lines || []) {
    path(pts);
    ctx.lineWidth = w;
    ctx.stroke();
  }
  ctx.strokeStyle = "#1a1a1a";
  ctx.fillStyle = "#1a1a1a";
  for (const [w, ...pts] of s.marks || []) {
    path(pts);
    ctx.lineWidth = w;
    ctx.stroke();
  }
  for (const [x, y, r] of s.dots || []) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// (more outlines than fit on one: the atlas runs on to another page, each its
// own texture and material)
const PER_PAGE = (ATLAS / CELL) ** 2;
function* atlasSteps() {
  const pages = [];
  const cells = {};
  let n = 0;
  let ctx = null;
  const place = (key, aspect, draw) => {
    if (!(aspect > 0 && aspect < 100)) {
      // (a broken outline: draw it square rather than lose the whole atlas)
      console.warn("plates: bad outline", key, aspect);
      aspect = 1;
    }
    if (n % PER_PAGE === 0) {
      const canvas = document.createElement("canvas");
      canvas.width = ATLAS;
      canvas.height = ATLAS;
      ctx = canvas.getContext("2d");
      pages.push({ canvas, ctx });
    }
    const page = pages.length - 1;
    const cx = (n % (ATLAS / CELL)) * CELL;
    const cy = (Math.floor(n / (ATLAS / CELL)) % (ATLAS / CELL)) * CELL;
    n++;
    const room = CELL - 2 * PAD;
    const w = aspect >= 1 ? room : Math.round(room * aspect);
    const h = aspect >= 1 ? Math.round(room / aspect) : room;
    const x = cx + Math.round((CELL - w) / 2);
    const y = cy + Math.round((CELL - h) / 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x, y);
    draw(w, h);
    ctx.restore();
    cells[key] = { x, y, w, h, aspect: w / h, page };
  };
  for (const [key, s] of Object.entries(SHAPES)) {
    const [x0, y0, x1, y1] = shapeBox(s);
    const rim = 0.028 * Math.max(x1 - x0, y1 - y0);
    const bx0 = x0 - rim;
    const by0 = y0 - rim;
    const bw = x1 - x0 + 2 * rim;
    const bh = y1 - y0 + 2 * rim;
    place(key, bw / bh, (w, h) => {
      ctx.scale(w / bw, h / bh);
      ctx.translate(-bx0, -by0);
      drawShape(ctx, s, rim);
    });
    yield;
  }
  for (const [key, draw] of Object.entries(CARDS)) {
    const [cw, ch] = CARD_SIZE[key] || [1, 1];
    place(key, cw / ch, (w, h) => draw(ctx, w, h));
    yield;
  }
  // Hit masks: which of a MASK x MASK grid over each outline is solid (and a
  // cell's neighbours, so an edge is a hit).
  for (const c of Object.values(cells)) {
    const img = pages[c.page].ctx.getImageData(c.x, c.y, c.w, c.h).data;
    const raw = new Uint8Array(MASK * MASK);
    for (let j = 0; j < MASK; j++)
      for (let i = 0; i < MASK; i++) {
        const px = Math.min(c.w - 1, Math.floor(((i + 0.5) * c.w) / MASK));
        const py = Math.min(c.h - 1, Math.floor(((j + 0.5) * c.h) / MASK));
        raw[j * MASK + i] = img[(py * c.w + px) * 4 + 3] > 100 ? 1 : 0;
      }
    const mask = new Uint8Array(MASK * MASK);
    for (let j = 0; j < MASK; j++)
      for (let i = 0; i < MASK; i++) {
        let on = 0;
        for (let dj = -1; dj <= 1 && !on; dj++)
          for (let di = -1; di <= 1 && !on; di++) {
            const ii = i + di;
            const jj = j + dj;
            if (ii >= 0 && jj >= 0 && ii < MASK && jj < MASK) on = raw[jj * MASK + ii];
          }
        mask[j * MASK + i] = on;
      }
    c.mask = mask;
    yield;
  }
  const mats = pages.map(({ canvas }) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, fog: false });
  });
  const geos = {};
  for (const [key, c] of Object.entries(cells)) {
    // a 1 x 1 card standing on its bottom edge, its UVs on its cell
    const g = new THREE.PlaneGeometry(1, 1);
    g.translate(0, 0.5, 0);
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++) {
      uv.setXY(k, (c.x + uv.getX(k) * c.w) / ATLAS, 1 - (c.y + (1 - uv.getY(k)) * c.h) / ATLAS);
    }
    geos[key] = g;
  }
  return { cells, mats, geos };
}

let job = null;
function getAtlas() {
  job = job || atlasSteps();
  while (!atlas) {
    const r = job.next();
    if (r.done) atlas = r.value;
  }
  return atlas;
}

// Draw the atlas a piece at a time after the lounge loads (4 ms every 50 ms,
// so it gets done even when a headset has no idle time between frames), so
// the first round doesn't stall on it (0.75 s at once on a desktop, more on a
// Quest), and send it to the GPU then too.
export function warmPlates(renderer) {
  const step = () => {
    job = job || atlasSteps();
    const until = performance.now() + 4;
    while (!atlas && performance.now() < until) {
      const r = job.next();
      if (r.done) atlas = r.value;
    }
    if (!atlas) setTimeout(step, 50);
    else for (const m of atlas.mats) renderer?.initTexture?.(m.map);
  };
  setTimeout(step, 2000);
}
// (for the preview harness)
export const plateAtlas = (page = 0) => getAtlas().mats[page]?.map.image;

// One plate on its own (the featured shoots' running animals): the outline on
// a card h m tall standing on its bottom edge, facing -x; flip scale.x to face
// +x.
const cutMats = new Map();
export function plateCutout(kind, tint, h) {
  const A = getAtlas();
  const page = A.cells[kind].page;
  const key = `${page}:${tint}`;
  if (!cutMats.has(key)) {
    const m = A.mats[page].clone();
    m.color.setHex(tint);
    cutMats.set(key, m);
  }
  const mesh = new THREE.Mesh(A.geos[kind], cutMats.get(key));
  mesh.scale.set(h * A.cells[kind].aspect, h, 1);
  return mesh;
}

// ---- Layouts ----------------------------------------------------------------------

// Smaller = more: by the angle the plate makes from the stands (h: its
// middle's height above the roof deck; eyes are about 1.6 m up).
function sizePoints(size, u, f, h) {
  const a = size / Math.hypot(u, f, h - 1.6);
  return a > 0.08 ? 5 : a > 0.045 ? 10 : a > 0.025 ? 25 : 50;
}

const BOX = (x, y, z) => new THREE.BoxGeometry(x, y, z);

class Layout {
  constructor(key) {
    this.key = key;
    this.plates = [];
    this.props = [];
    this.banks = 0;
    this.R = mulberry(key.length * 7919 + key.charCodeAt(0));
  }
  r(a, b) {
    return a + (b - a) * this.R();
  }
  add(p) {
    p.i = this.plates.length;
    p.id = `p${p.i}`;
    this.plates.push(p);
    return p;
  }
  // n plates in a row across u0..u1 at distance f, standing at base (m above
  // the ground). kinds/tints cycle. bank: plates per bank (0 = none). A
  // raised row gets a dark rail and posts unless rail is false.
  row(o) {
    const kinds = [].concat(o.kind);
    const tints = [].concat(o.tint || "white");
    const base = o.base || 0;
    const bankSize = o.bank || 0;
    const w = o.fixed ? 1 : SPREAD; // (fixed: on a bar or balcony that doesn't move)
    let bank = null;
    for (let k = 0; k < o.n; k++) {
      const u = w * (o.n === 1 ? (o.u0 + o.u1) / 2 : o.u0 + ((o.u1 - o.u0) * k) / (o.n - 1));
      const f = o.f + (o.jitter ? this.r(-o.jitter, o.jitter) : 0);
      if (bankSize && k % bankSize === 0) bank = this.banks++;
      const kind = kinds[k % kinds.length];
      this.add({
        mode: "stand",
        kind,
        kinds: [kind],
        u,
        f,
        base,
        size: o.size,
        tint: PAINT[tints[k % tints.length]] ?? PAINT.white,
        mirror: o.mirror ?? (this.R() < 0.5 ? 1 : -1),
        pts: o.pts, // (none: by its size, once it's in place)
        bank: bankSize ? bank : null
      });
    }
    const wood = o.wood ?? 0x5a3a22;
    if (base > 0.15 && o.perch) {
      // a pole (a dead tree, a post) under each
      // (where they are as laid out: PlateField moves the plates back before
      // the scenery is built, and the scenery is moved back itself)
      const at = this.plates.slice(-o.n).map(p => [p.u, p.f]);
      this.props.push(P => {
        for (const [u, f] of at)
          P.add(new THREE.CylinderGeometry(0.05, 0.08, base, 5), wood, u, GROUND + base / 2, f + 0.05);
      });
    } else if (base > 0.15 && o.rail !== false) {
      // a thin rail on posts
      const len = Math.abs(o.u1 - o.u0) * w + 1.2;
      const mid = ((o.u0 + o.u1) / 2) * w;
      this.props.push(P => {
        P.add(BOX(len, 0.05, 0.12), wood, mid, GROUND + base - 0.025, o.f + 0.04);
        const posts = Math.max(2, Math.round(len / 4) + 1);
        for (let k = 0; k < posts; k++)
          P.add(
            BOX(0.05, base, 0.05),
            wood,
            mid - len / 2 + ((len - 0.1) * k) / (posts - 1) + 0.05,
            GROUND + base / 2,
            o.f + 0.06
          );
      });
    }
  }
  // Pop-ups at spots [[u, base], ...] at distance f: kinds [[kind, weight,
  // { dont, pts }]], each up for a tier's time once a period (busy: the
  // chance a spot is used in a period).
  pops(o) {
    for (const [u0, base] of o.at) {
      const u = o.fixed ? u0 : u0 * SPREAD; // (fixed: windows in a building)
      this.add({
        mode: o.peek ? "peek" : "pop",
        kinds: o.kinds.map(k => k[0]),
        roll: o.kinds,
        u,
        f: o.f,
        base,
        size: o.size,
        tint: PAINT[o.tint || "card"],
        mirror: o.peek ? (u < 0 ? 1 : -1) : this.R() < 0.5 ? 1 : -1,
        slide: o.peek ? (u < 0 ? -1 : 1) * (o.slide || 2.6) : 0,
        period: this.r(o.period?.[0] ?? 4.5, o.period?.[1] ?? 7.5),
        phase: this.r(0, 10),
        busy: o.busy ?? 0.8,
        bank: null
      });
    }
  }
  prop(fn) {
    this.props.push(fn);
  }
}

export const span = (n, a, b) => Array.from({ length: n }, (_, k) => a + ((b - a) * k) / Math.max(1, n - 1));

export const LAYOUTS = {
  carnival(L) {
    L.row({ kind: "duck", n: 8, f: 8.5, u0: -4.2, u1: 4.2, base: 1.0, size: 0.42, tint: "yellow", bank: 4 });
    L.row({ kind: "rabbit", n: 6, f: 10.5, u0: -6, u1: 6, base: 1.7, size: 0.5, tint: "white", bank: 3 });
    L.row({
      kind: ["star", "owl"],
      n: 6,
      f: 12,
      u0: -8,
      u1: 8,
      base: 3.2,
      size: 0.55,
      tint: ["gold", "pink"],
      bank: 3
    });
    L.row({ kind: "bear", n: 5, f: 23, u0: -13, u1: 13, size: 0.9, tint: "red" });
    L.row({ kind: "elephant", n: 3, f: 31, u0: -16, u1: 16, size: 1.5, tint: "blue" });
    L.row({ kind: "bull", n: 4, f: 35, u0: -21, u1: 21, base: 2.4, size: 0.9, tint: "card" });
    L.row({ kind: "duck", n: 6, f: 46, u0: -20, u1: 20, base: 5, size: 0.9, tint: "yellow", bank: 3 });
    L.row({ kind: "star", n: 3, f: 58, u0: -14, u1: 14, base: 10, size: 1.2, tint: "gold", pts: 50 });
    // clowns (and now and then the mime) up from behind the booth counters
    L.pops({
      f: 14,
      at: [
        [-6, 1.05],
        [-2, 1.05],
        [2, 1.05],
        [6, 1.05]
      ],
      size: 0.8,
      kinds: [
        ["clown", 85],
        ["mime", 15, { dont: true }]
      ]
    });
    L.pops({
      f: 20,
      at: [
        [-8, 1.05],
        [8, 1.05]
      ],
      size: 0.8,
      kinds: [
        ["clown", 85],
        ["mime", 15, { dont: true }]
      ]
    });
    L.pops({
      f: 26,
      at: [
        [-4, 1.05],
        [4, 1.05]
      ],
      size: 0.8,
      kinds: [
        ["clown", 85],
        ["mime", 15, { dont: true }]
      ]
    });
  },

  duck(L) {
    L.row({ kind: "duck", n: 8, f: 9, u0: -6, u1: 6, size: 0.45, tint: ["white", "yellow"], bank: 4 });
    L.row({ kind: "frog", n: 6, f: 12, u0: -9, u1: 9, size: 0.32, tint: "green", bank: 3 });
    L.row({ kind: "heron", n: 4, f: 19, u0: -15, u1: 15, size: 1.3, tint: "white" });
    L.row({ kind: "goose", n: 4, f: 24, u0: -11, u1: 11, size: 0.9, tint: "steel" });
    L.row({ kind: "duck", n: 8, f: 30, u0: -16, u1: 16, size: 0.6, tint: "yellow", bank: 4 });
    L.row({ kind: "goose", n: 3, f: 60, u0: -18, u1: 18, size: 1.1, tint: "steel" });
    // ducks up out of the far reeds
    L.pops({
      f: 45,
      at: span(6, -24, 24).map(u => [u, 0]),
      size: 0.9,
      tint: "white",
      kinds: [["duckfly", 100]]
    });
    // ducks up out of the reeds (and the dog)
    L.pops({
      f: 15,
      at: [
        [-9, 0.3],
        [-3, 0.3],
        [4, 0.3],
        [10, 0.3]
      ],
      size: 0.6,
      tint: "white",
      kinds: [
        ["duckfly", 85],
        ["dog", 15, { dont: true }]
      ]
    });
    L.pops({
      f: 21,
      at: [
        [-6, 0.3],
        [7, 0.3]
      ],
      size: 0.6,
      tint: "white",
      kinds: [
        ["duckfly", 85],
        ["dog", 15, { dont: true }]
      ]
    });
  },

  deer(L) {
    L.row({ kind: "rabbit", n: 5, f: 9, u0: -7, u1: 7, size: 0.45, tint: "white" });
    L.row({ kind: "turkey", n: 3, f: 11, u0: -9, u1: 9, size: 0.75, tint: "orange" });
    L.row({ kind: "squirrel", n: 4, f: 13, u0: -12, u1: 12, base: 0.6, size: 0.4, tint: "orange", rail: false });
    L.prop(P => {
      for (const u of span(4, -12, 12).map(x => x * SPREAD))
        P.add(new THREE.CylinderGeometry(0.3, 0.36, 0.6, 7), 0x6a4a2a, u, GROUND + 0.3, 13);
    });
    // crows on the ground in front of the fence
    L.row({ kind: "crow", n: 6, f: 15, u0: -11, u1: 11, size: 0.35, tint: "white", bank: 3 });
    L.row({ kind: "buck", n: 5, f: 24, u0: -18, u1: 18, size: 1.3, tint: "orange" });
    L.row({ kind: "turkey", n: 3, f: 30, u0: -12, u1: 12, size: 0.8, tint: "white" });
    // deer step out of the bushes at the forest edge (does: don't)
    const edge = [-20, -12, -4, 4, 12, 20].map(u => u * SPREAD);
    L.prop(P => {
      for (const u of edge) {
        P.bush(u, 33.2, 1.6, 0x2f5a2a);
        P.pine(u + 0.8, 34.5, 1.3);
      }
    });
    L.pops({
      f: 34,
      peek: true,
      fixed: true, // (edge is spread already)
      at: edge.map(u => [u, 0]),
      size: 1.4,
      tint: "orange",
      slide: 2.7,
      kinds: [
        ["buck", 55],
        ["bigbuck", 10, { pts: 50 }],
        ["doe", 25, { dont: true }],
        ["turkey", 10]
      ]
    });
    // the ridge: bucks along it, and two big ones
    L.prop(P => {
      P.add(BOX(76 * SPREAD, 2, 4), 0x3a5a2a, 0, GROUND + 1, 46);
      P.add(BOX(76 * SPREAD, 0.6, 3), 0x4a6a32, 0, GROUND + 2.1, 45.6);
      P.add(BOX(40 * SPREAD, 3, 5), 0x2f4a2a, 0, GROUND + 1.5, 63);
    });
    L.row({ kind: "buck", n: 6, f: 45, u0: -30, u1: 30, base: 2.4, size: 1.7, tint: "orange", bank: 3, rail: false });
    L.row({ kind: "bigbuck", n: 2, f: 45.5, u0: -6, u1: 6, base: 2.4, size: 2.1, tint: "gold", pts: 50, rail: false });
    L.row({ kind: ["buck", "doe"], n: 4, f: 62, u0: -15, u1: 15, base: 3, size: 1.4, tint: "white", rail: false });
  },

  boar(L) {
    L.row({ kind: "crow", n: 6, f: 8, u0: -7, u1: 7, size: 0.38, tint: "white", bank: 3 });
    L.row({ kind: "boar", n: 6, f: 12, u0: -10, u1: 10, size: 0.45, tint: "pink", bank: 3 });
    L.row({ kind: "rabbit", n: 4, f: 16, u0: -13, u1: 13, size: 0.45, tint: "white" });
    L.row({ kind: "boar", n: 5, f: 21, u0: -17, u1: 17, size: 0.85, tint: "orange" });
    L.row({ kind: "wolf", n: 3, f: 27, u0: -14, u1: 14, size: 1.0, tint: "steel" });
    L.row({ kind: "bear", n: 2, f: 34, u0: -11, u1: 11, size: 1.3, tint: "brown" });
    L.prop(P => P.add(BOX(36 * SPREAD, 1.5, 6), 0x8a7a4a, 0, GROUND + 0.75, 55));
    L.row({ kind: "boar", n: 4, f: 54, u0: -15, u1: 15, base: 1.5, size: 1.0, tint: "orange", bank: 4, rail: false });
    L.row({ kind: "boar", n: 1, f: 62, u0: 0, u1: 0, size: 1.6, tint: "gold", pts: 50 });
    L.pops({
      f: 14,
      at: [
        [-8, 0],
        [3, 0]
      ],
      size: 0.85,
      tint: "orange",
      kinds: [
        ["boar", 70],
        ["farmer", 15, { dont: true }],
        ["wolf", 15]
      ]
    });
    L.pops({
      f: 17,
      at: [
        [-3, 0],
        [8, 0]
      ],
      size: 0.85,
      tint: "orange",
      kinds: [
        ["boar", 70],
        ["farmer", 15, { dont: true }],
        ["wolf", 15]
      ]
    });
    L.pops({
      f: 22,
      at: [[0, 0]],
      size: 0.85,
      tint: "orange",
      kinds: [
        ["boar", 85],
        ["farmer", 15, { dont: true }]
      ]
    });
  },

  safari(L) {
    L.row({ kind: "monkey", n: 4, f: 9, u0: -6, u1: 6, size: 0.55, tint: "white", bank: 4 });
    L.row({ kind: "vulture", n: 3, f: 12, u0: -10, u1: 10, size: 0.6, tint: "white" });
    L.row({ kind: "antelope", n: 5, f: 16, u0: -12, u1: 12, size: 1.0, tint: "orange" });
    L.row({ kind: "boar", n: 4, f: 20, u0: -15, u1: 15, size: 0.6, tint: "red", bank: 4 });
    L.row({ kind: "zebra", n: 4, f: 27, u0: -16, u1: 16, size: 1.4, tint: "white" });
    L.row({ kind: "lion", n: 3, f: 34, u0: -14, u1: 14, size: 1.2, tint: "red" });
    L.row({ kind: "rhino", n: 3, f: 44, u0: -20, u1: 20, size: 1.4, tint: "steel" });
    L.row({ kind: "giraffe", n: 3, f: 48, u0: -26, u1: 26, size: 3, tint: "orange" });
    L.row({ kind: "elephant", n: 2, f: 52, u0: -12, u1: 12, size: 2.6, tint: "steel" });
    L.row({ kind: "antelope", n: 4, f: 66, u0: -24, u1: 24, size: 1.0, tint: "white", pts: 50 });
    // lions up out of the bush (and the ranger)
    L.pops({
      f: 18,
      at: [
        [-8, 0],
        [8, 0]
      ],
      size: 1.1,
      tint: "gold",
      kinds: [
        ["lion", 70],
        ["antelope", 15],
        ["ranger", 15, { dont: true }]
      ]
    });
    L.pops({
      f: 21,
      at: [
        [-3, 0],
        [3, 0]
      ],
      size: 1.1,
      tint: "gold",
      kinds: [
        ["lion", 70],
        ["antelope", 15],
        ["ranger", 15, { dont: true }]
      ]
    });
  },

  bond(L) {
    L.row({
      kind: "glass",
      n: 8,
      f: 10,
      u0: -7,
      u1: 7,
      base: 1.16,
      size: 0.32,
      tint: "white",
      bank: 4,
      rail: false,
      fixed: true
    });
    L.row({
      kind: ["spade", "heart", "diamond", "club"],
      n: 4,
      f: 13,
      u0: -12,
      u1: 12,
      base: 1.3,
      size: 0.6,
      tint: ["white", "red", "red", "white"],
      bank: 4
    });
    L.row({
      kind: ["heart", "spade", "club", "diamond"],
      n: 4,
      f: 18,
      u0: -15,
      u1: 15,
      base: 2,
      size: 0.8,
      tint: ["red", "white", "white", "red"],
      bank: 4
    });
    L.row({
      kind: "bottle",
      fixed: true,
      n: 8,
      f: 29.4,
      u0: -16,
      u1: 16,
      base: 3.75,
      size: 0.8,
      tint: "gold",
      bank: 4,
      rail: false
    });
    // the lair's windows: 3 floors of 8, henchmen up slow, medium and fast
    const at = [];
    for (let floor = 0; floor < 3; floor++) for (const u of span(8, -14, 14)) at.push([u, floor * 3.5 + 0.6]);
    L.pops({
      fixed: true,
      f: 31.4,
      at,
      size: 1.7,
      kinds: [
        ["henchman", 70],
        ["boss", 7, { pts: 50 }],
        ["girl", 23, { dont: true }]
      ]
    });
    // snipers on the roof
    L.pops({
      fixed: true,
      f: 31,
      at: [-16, -10, 10, 16].map(u => [u, 11.3]), // (either side of the casino sign)
      size: 1.0,
      period: [6, 9],
      busy: 0.6,
      kinds: [["bad", 100, { pts: 25 }]]
    });
  },

  hostage(L) {
    // the practice line: two plate racks and the lettered targets
    L.row({ kind: "disc", n: 6, f: 8, u0: -2.5, u1: 2.5, base: 0.9, size: 0.3, tint: "white", bank: 6 });
    L.row({ kind: "disc", n: 5, f: 10, u0: 11.5, u1: 15.5, base: 0.9, size: 0.3, tint: "orange", bank: 5 });
    L.row({
      kind: ["letterA", "letterB", "letterC"],
      n: 3,
      f: 11,
      u0: -12,
      u1: -8,
      base: 1.2,
      size: 0.7,
      tint: "card"
    });
    L.row({ kind: "bad", n: 4, f: 13, u0: -16, u1: 16, size: 1.6, tint: "card" });
    // the shoot house's windows and doors, both floors, and the tower block
    // behind (its top three floors: the house hides the rest)
    const openings = [-9, -5, -1, 3, 7, 10];
    L.pops({
      fixed: true,
      f: 17.6,
      at: openings.map(u => [u, 0.95]),
      size: 1.7,
      kinds: [
        ["bad", 75],
        ["hostage", 25, { dont: true }]
      ]
    });
    L.pops({
      fixed: true,
      f: 17.6,
      at: openings.map(u => [u, 4.5]),
      size: 1.6,
      kinds: [
        ["bad", 75],
        ["hostage", 25, { dont: true }]
      ]
    });
    const block = [];
    for (let floor = 3; floor < 6; floor++) for (const u of span(5, -10, 10)) block.push([u, floor * 3.5 + 0.9]);
    L.pops({
      fixed: true,
      f: 40.4,
      at: block,
      size: 1.5,
      kinds: [
        ["bad", 75],
        ["hostage", 25, { dont: true }]
      ]
    });
    L.pops({
      fixed: true,
      f: 40,
      at: span(3, -9, 9).map(u => [u, 21.6]),
      size: 1.0,
      period: [6, 9],
      busy: 0.6,
      kinds: [["bad", 100, { pts: 25 }]]
    });
  },

  // Inside the saloon (shoots-art.js SALOON), everything where the room puts
  // it (fixed): spittoons on the floor, glasses and bottles on the tables and
  // the bar, three shelves of small bottles over the back bar. Gunmen pop up
  // behind the overturned tables and the bar and step into the doorways;
  // the ladies (and the barkeep) are don't-shoots.
  saloon(L) {
    const S = SALOON;
    const fixed = { fixed: true, rail: false };
    L.row({ ...fixed, kind: "spittoon", n: 6, f: 1.5, u0: -7.5, u1: 7.5, size: 0.32, tint: "gold", bank: 3 });
    for (const u of S.TABLES)
      L.row({
        ...fixed,
        kind: ["bottle", "mug", "bottle"],
        n: 3,
        f: 6.75,
        u0: u - 0.32,
        u1: u + 0.32,
        base: 0.81,
        size: 0.3,
        tint: ["green", "gold", "brown"],
        bank: 3
      });
    L.row({
      ...fixed,
      kind: ["spade", "heart", "diamond", "club"],
      n: 4,
      f: 12.4,
      u0: -0.66,
      u1: 0.66,
      base: 0.82,
      size: 0.45,
      tint: ["white", "red", "red", "white"],
      bank: 4
    });
    L.row({
      ...fixed,
      kind: ["mug", "glass"],
      n: 10,
      f: S.BAR + 0.25,
      u0: -6.3,
      u1: 6.3,
      base: S.BARH,
      size: 0.3,
      tint: ["gold", "white"],
      bank: 5
    });
    [1.72, 2.37, 3.02].forEach((base, k) =>
      L.row({
        ...fixed,
        kind: "bottle",
        n: 8,
        f: S.BACK - 0.3,
        u0: -5.6,
        u1: 5.6,
        base,
        size: 0.42,
        tint: [
          ["green", "brown"],
          ["brown", "gold"],
          ["gold", "green"]
        ][k],
        bank: 4
      })
    );
    const gunmen = (cowboy, gunslinger) => [
      ["cowboy", cowboy],
      ["gunslinger", gunslinger]
    ];
    L.pops({
      fixed: true,
      f: 4.3,
      at: S.COVER.map(u => [u, 0]),
      size: 1.7,
      kinds: [...gunmen(45, 35), ["lady", 12, { dont: true }], ["outlaw", 8, { pts: 50 }]]
    });
    L.pops({
      fixed: true,
      f: S.BAR + 1.2,
      at: [-4.5, 0, 4.5].map(u => [u, 0]),
      size: 1.75,
      kinds: [...gunmen(40, 35), ["barkeep", 25, { dont: true }]]
    });
    L.pops({
      fixed: true,
      f: S.BACK + 0.45,
      at: S.UP_DOORS.map(u => [u, S.BAL]),
      size: 1.7,
      kinds: [...gunmen(35, 30), ["lady", 30, { dont: true }], ["outlaw", 5, { pts: 50 }]]
    });
    L.pops({
      fixed: true,
      f: S.BACK + 0.45,
      at: S.DOWN_DOORS.map(u => [u, 0]),
      size: 1.75,
      kinds: [...gunmen(40, 35), ["lady", 25, { dont: true }]]
    });
  }
};

export function plateLayout(key) {
  const L = new Layout(key);
  LAYOUTS[key]?.(L);
  return L;
}

// ---- The field: a world's plates, drawn and hit -----------------------------------

const v = new THREE.Vector3();
const n0 = new THREE.Vector3();
const r0 = new THREE.Vector3();
const up0 = new THREE.Vector3();
const m4 = new THREE.Matrix4();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const UP = new THREE.Vector3(0, 1, 0);

export class PlateField {
  constructor(key, fx) {
    this.key = key;
    this.fx = fx; // { play(name, worldPos, vol, ref), debris(colours, worldPos, worldVel), popup(text, by, worldPos), bonus(text, by, worldPos) }
    const L = plateLayout(key);
    this.plates = L.plates;
    this.propFns = L.props;
    this.byId = new Map(this.plates.map(p => [p.id, p]));
    this.state = new Map(); // id -> { at, by, n }
    this.bankAt = new Map(); // bank -> time it was cleared
    this.seed = 1;
    this.group = new THREE.Group();
    this.group.name = `LoungePlates:${key}`;
    const A = getAtlas();
    // one InstancedMesh per outline; a pop plate has a slot in each of its kinds
    const counts = {};
    for (const p of this.plates) for (const k of p.kinds) counts[k] = (counts[k] || 0) + 1;
    this.meshes = {};
    const col = new THREE.Color();
    for (const [k, c] of Object.entries(counts)) {
      if (!A.geos[k]) {
        console.warn("plates: no outline for", k);
        continue;
      }
      const im = new THREE.InstancedMesh(A.geos[k], A.mats[A.cells[k].page], c);
      im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.name = `plates:${k}`;
      im.userData.next = 0;
      this.meshes[k] = im;
      this.group.add(im);
    }
    for (const p of this.plates) {
      p.slots = {};
      for (const k of p.kinds) {
        const im = this.meshes[k];
        if (!im) continue;
        const i = im.userData.next++;
        p.slots[k] = i;
        im.setColorAt(i, col.setHex(PERSON.has(k) || /^(letter|bull|clown|dog)/.test(k) ? PAINT.card : p.tint));
        im.setMatrixAt(i, ZERO);
      }
      // laid out as the world was; moved back and stood on the lifted ground
      // with it (shoots-art.js SHIFT, groundAt)
      p.f += SHIFT;
      p.o = new THREE.Vector3(p.u, groundAt(p.f) + p.base, -p.f);
      if (p.pts === undefined && p.mode === "stand") p.pts = sizePoints(p.size, p.u, p.f, p.o.y + p.size / 2);
      // faces the stands; r: the shooter's right across its face
      n0.set(-p.u, 0, p.f).normalize();
      p.n = n0.clone();
      p.r = new THREE.Vector3().crossVectors(UP, n0);
    }
    for (const im of Object.values(this.meshes)) if (im.instanceColor) im.instanceColor.needsUpdate = true;
    this.group.traverse(o => (o.matrixNeedsUpdate = true));
  }

  // The plates' rails, posts, ridges and cover, into the world's scenery.
  props(P) {
    for (const fn of this.propFns) fn(P);
  }

  reset(seed) {
    this.seed = seed >>> 0 || 1;
    this.state.clear();
    this.bankAt.clear();
  }

  // A pop plate's turn in the period around T: { n, t0, t1, kind, pts, dont } or
  // { n } if it stays down this time.
  turn(p, T) {
    const n = Math.floor((T - p.phase) / p.period);
    const R = mulberry((this.seed ^ Math.imul(p.i + 1, 2654435761) ^ Math.imul(n + 7, 40503)) >>> 0);
    if (R() > p.busy) return { n };
    const r = R();
    const tier = r < 0.35 ? 0 : r < 0.75 ? 1 : 2;
    const up = TIERS[tier].up;
    const start = n * p.period + p.phase + R() * Math.max(0, p.period - up - 2 * RISE - 0.3);
    let w = R() * p.roll.reduce((a, k) => a + k[1], 0);
    let pick = p.roll[0];
    for (const k of p.roll) {
      if ((w -= k[1]) <= 0) {
        pick = k;
        break;
      }
    }
    const o = pick[2] || {};
    return {
      n,
      t0: start,
      t1: start + up + 2 * RISE,
      kind: pick[0],
      dont: !!o.dont,
      pts: o.dont ? DONT : (o.pts ?? TIERS[tier].pts)
    };
  }

  // When a knocked-down stand plate stands again.
  upAt(p, s) {
    let t = s.at + DOWN;
    const b = p.bank !== null ? this.bankAt.get(p.bank) : undefined;
    if (b !== undefined && b >= s.at) t = Math.min(t, b + BANK_BACK);
    return t;
  }

  // Where plate p is at T: { kind, a (lean back, rad), off (slide), live
  // (can be hit), pts, dont } or null when it isn't showing.
  pose(p, T) {
    const s = this.state.get(p.id);
    if (p.mode === "stand") {
      if (s) {
        const up = this.upAt(p, s);
        if (T < up) {
          const t = T - s.at;
          if (t > FALL + LIE || SHATTER.has(p.kind)) return null;
          return { kind: p.kind, a: FLAT * Math.min(1, (t / FALL) ** 2), off: 0, live: false };
        }
        if (T < up + RISE) return { kind: p.kind, a: FLAT * (1 - (T - up) / RISE), off: 0, live: false };
      }
      return { kind: p.kind, a: 0, off: 0, live: true, pts: p.pts };
    }
    const tn = this.turn(p, T);
    if (tn.t0 === undefined || T < tn.t0 || T > tn.t1) return null;
    if (s && s.n === tn.n) {
      const t = T - s.at;
      if (t > FALL + LIE) return null;
      return { kind: tn.kind, a: FLAT * Math.min(1, (t / FALL) ** 2), off: 0, live: false };
    }
    const e = Math.min(1, (T - tn.t0) / RISE, (tn.t1 - T) / RISE);
    if (e <= 0.02) return null;
    return {
      kind: tn.kind,
      a: p.mode === "pop" ? FLAT * (1 - e) : 0,
      off: p.mode === "peek" ? p.slide * e : 0,
      live: e > 0.7,
      pts: tn.pts,
      dont: tn.dont
    };
  }

  // The plate's frame at a pose: origin (bottom middle), right, up, normal.
  frame(p, ps, o, r, up, n) {
    const c = Math.cos(ps.a);
    const s = Math.sin(ps.a);
    o.copy(p.o).addScaledVector(p.r, ps.off);
    r.copy(p.r);
    up.copy(UP).multiplyScalar(c).addScaledVector(p.n, -s);
    n.copy(p.n).multiplyScalar(c).addScaledVector(UP, s);
  }

  update(T) {
    const A = getAtlas();
    for (const im of Object.values(this.meshes)) im.instanceMatrix.needsUpdate = true;
    for (const p of this.plates) {
      const ps = this.pose(p, T);
      for (const k of p.kinds) {
        const im = this.meshes[k];
        if (!im) continue;
        if (!ps || ps.kind !== k) {
          im.setMatrixAt(p.slots[k], ZERO);
          continue;
        }
        this.frame(p, ps, v, r0, up0, n0);
        const h = p.size;
        const w = h * A.cells[k].aspect * p.mirror;
        m4.set(
          r0.x * w,
          up0.x * h,
          n0.x,
          v.x,
          r0.y * w,
          up0.y * h,
          n0.y,
          v.y,
          r0.z * w,
          up0.z * h,
          n0.z,
          v.z,
          0,
          0,
          0,
          1
        );
        im.setMatrixAt(p.slots[k], m4);
      }
    }
  }

  // Which plates do these rays (in the worlds' frame) hit at T? One hit per
  // plate, the nearest along each ray. [{ p, pts, dont, point (frame) }]
  pick(rays, T) {
    const A = getAtlas();
    const out = new Map();
    const o = new THREE.Vector3();
    const r = new THREE.Vector3();
    const up = new THREE.Vector3();
    const n = new THREE.Vector3();
    const q = new THREE.Vector3();
    const live = [];
    for (const p of this.plates) {
      const ps = this.pose(p, T);
      if (ps && ps.live && A.cells[ps.kind]) live.push([p, ps]);
    }
    for (const ray of rays) {
      let best = null;
      for (const [p, ps] of live) {
        this.frame(p, ps, o, r, up, n);
        const d = ray.dir.dot(n);
        if (Math.abs(d) < 1e-4) continue;
        const t = q.copy(o).sub(ray.origin).dot(n) / d;
        if (t <= 0 || (best && t >= best.t)) continue;
        q.copy(ray.origin).addScaledVector(ray.dir, t).sub(o);
        const c = A.cells[ps.kind];
        const x = (q.dot(r) / (p.size * c.aspect)) * p.mirror + 0.5;
        const y = q.dot(up) / p.size;
        if (x < 0 || x >= 1 || y < 0 || y >= 1) continue;
        if (!c.mask[Math.floor((1 - y) * MASK) * MASK + Math.floor(x * MASK)]) continue;
        best = { t, p, ps, point: ray.origin.clone().addScaledVector(ray.dir, t) };
      }
      if (best && !out.has(best.p.id)) out.set(best.p.id, best);
    }
    return [...out.values()].map(b => ({ id: b.p.id, pts: b.ps.pts, dont: b.ps.dont, point: b.point }));
  }

  // A hit from anyone at shared time `at` (ours or a message). Returns { pts,
  // bonus } (bonus: a bank cleared), or null if it was already down (someone
  // else got it first) or not up to be hit. x2: the finale.
  hit(id, at, by, x2, toWorld) {
    const p = this.byId.get(id);
    if (!p) return null;
    // Two shots at once (each headset took its own first): both settle on
    // the earlier one, so they agree on what's down.
    const prev = this.state.get(id);
    if (prev && prev.at > at && prev.at - at < FALL + LIE) {
      this.state.set(id, { ...prev, at, by });
      return null;
    }
    const ps = this.pose(p, at);
    if (!ps || !ps.live) return null;
    const n = p.mode === "stand" ? 0 : this.turn(p, at).n;
    this.state.set(id, { at, by, n });
    let pts = ps.pts;
    if (x2 && pts > 0) pts *= 2;
    let bonus = 0;
    if (p.bank !== null) {
      const bank = this.plates.filter(q => q.bank === p.bank);
      const cleared = bank.every(q => {
        const s = this.state.get(q.id);
        return s && s.at <= at && this.upAt(q, s) > at;
      });
      if (cleared) {
        this.bankAt.set(p.bank, at);
        bonus = BANK_PER * bank.length * (x2 ? 2 : 1);
      }
    }
    // effects
    const centre = toWorld(
      v
        .copy(p.o)
        .addScaledVector(p.r, ps.off)
        .addScaledVector(UP, p.size * 0.5)
        .clone()
    );
    const kind = ps.kind;
    const sound = ps.dont ? "wrong" : SOUND[kind] || (PERSON.has(kind) ? "thud" : "ping");
    this.fx.play(sound, centre, 1, 8 + p.f * 0.3);
    if (ps.dont) this.fx.play("wrong", centre, 0.9, 14);
    const tint = new THREE.Color(p.tint).getHex();
    this.fx.debris(
      SHATTER.has(kind) ? [0xe8f4ff, 0xffffff, 0x7fd18a] : [tint, 0xffffff, 0x333333],
      centre,
      v.set(0, 1.5, 0)
    );
    this.fx.popup(pts < 0 ? `${pts}` : `+${pts}`, pts < 0 ? null : by, centre);
    if (bonus) {
      this.fx.play("bell", centre, 0.9, 20);
      this.fx.bonus(`BANK +${bonus}`, by, centre.clone().add(v.set(0, p.size + 0.6, 0)));
    }
    return { pts, bonus };
  }

  dispose() {
    for (const im of Object.values(this.meshes)) im.dispose();
  }
}
