import * as THREE from "three";
import { GROUND, SHIFT, SPREAD, SALOON, groundAt, CARDS, CARD_SIZE } from "./shoots-art";
import { SHAPES } from "./plates-shapes";
import { ASIS, LEDGES, PINS, RESEED } from "./plates-ledges";

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
const GONE = FALL + LIE; // s after a hit a plate is gone
const WALK_IN = 0.7; // s an animal takes to step back out
const FLAT = 1.45; // rad, lying back
const BANK_BACK = 0.8; // s after a bank is cleared it stands up again
const BANK_PER = 10; // bonus per plate in a cleared bank
const BANK_MAX = 25; // most a plate in a bank is worth
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

const CELL = 256;
const PAD = 14;
const MASK = 64;
const RIM = 0.018; // the dark edge round an outline, of its longer side

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

// One level's outlines only (2026-11-14: every outline of every level used to
// sit in four 2048 pages for good, about 85 MB on the headset's GPU and as
// much again in canvases; a level uses a dozen or two). The sheet is sized to
// what the level needs, drawn when its world is built and freed when the
// world goes. An outline nobody listed (a runner the waves throw up later) is
// drawn into a spare cell when it is first asked for.
class Atlas {
  constructor(n, midway) {
    this.midway = midway; // (a midway keeps its paint: natural colours are for everything else)
    this.cols = n <= 16 ? 4 : 8;
    const rows = Math.ceil(Math.max(1, n) / this.cols);
    this.rows = Math.min(8, rows <= 1 ? 1 : rows <= 2 ? 2 : rows <= 4 ? 4 : 8);
    this.W = this.cols * CELL;
    this.H = this.rows * CELL;
    this.per = this.cols * this.rows;
    this.pages = [];
    this.mats = [];
    this.cells = {};
    this.geos = {};
    this.cutMats = new Map();
    this.n = 0;
  }
  has(key) {
    return !!this.cells[key];
  }
  // Draw outline `key` into the next free cell (false: there is no such outline).
  add(key) {
    if (this.cells[key]) return true;
    const s = SHAPES[key];
    const card = CARDS[key];
    if (!s && !card) return false;
    if (this.n % this.per === 0) {
      const canvas = document.createElement("canvas");
      canvas.width = this.W;
      canvas.height = this.H;
      const tex = new THREE.CanvasTexture(canvas);
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 4;
      this.pages.push({ canvas, ctx: canvas.getContext("2d"), tex });
      this.mats.push(new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, fog: false }));
    }
    const page = this.pages.length - 1;
    const { ctx, tex } = this.pages[page];
    const slot = this.n % this.per;
    const cx = (slot % this.cols) * CELL;
    const cy = Math.floor(slot / this.cols) * CELL;
    this.n++;
    let aspect;
    let draw;
    if (s) {
      const [x0, y0, x1, y1] = shapeBox(s);
      const rim = RIM * Math.max(x1 - x0, y1 - y0);
      const bx0 = x0 - rim;
      const by0 = y0 - rim;
      const bw = x1 - x0 + 2 * rim;
      const bh = y1 - y0 + 2 * rim;
      aspect = bw / bh;
      draw = (w, h) => {
        ctx.scale(w / bw, h / bh);
        ctx.translate(-bx0, -by0);
        drawShape(ctx, s, rim);
        // (shaded down to the belly, so a tinted outline has some body to it)
        const g = ctx.createLinearGradient(0, by0, 0, by0 + bh);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.4, "rgba(0,0,0,0.04)");
        g.addColorStop(1, "rgba(0,0,0,0.36)");
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = g;
        ctx.fillRect(bx0, by0, bw, bh);
        ctx.globalCompositeOperation = "source-over";
      };
    } else {
      const [cw, ch] = CARD_SIZE[key] || [1, 1];
      aspect = cw / ch;
      draw = (w, h) => card(ctx, w, h);
    }
    if (!(aspect > 0 && aspect < 100)) {
      // (a broken outline: draw it square rather than lose the sheet)
      console.warn("plates: bad outline", key, aspect);
      aspect = 1;
    }
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
    // Hit mask: which of a MASK x MASK grid over the outline is solid (and a
    // cell's neighbours, so an edge is a hit).
    const img = ctx.getImageData(x, y, w, h).data;
    const raw = new Uint8Array(MASK * MASK);
    for (let j = 0; j < MASK; j++)
      for (let i = 0; i < MASK; i++) {
        const px = Math.min(w - 1, Math.floor(((i + 0.5) * w) / MASK));
        const py = Math.min(h - 1, Math.floor(((j + 0.5) * h) / MASK));
        raw[j * MASK + i] = img[(py * w + px) * 4 + 3] > 100 ? 1 : 0;
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
    this.cells[key] = { x, y, w, h, aspect: w / h, page, mask, shape: !!s };
    // a 1 x 1 card standing on its bottom edge, its UVs on its cell
    const g = new THREE.PlaneGeometry(1, 1);
    g.translate(0, 0.5, 0);
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++)
      uv.setXY(k, (x + uv.getX(k) * w) / this.W, 1 - (y + (1 - uv.getY(k)) * h) / this.H);
    g.userData.shared = true; // (skeet.js dropTarget leaves it for the next runner)
    this.geos[key] = g;
    tex.needsUpdate = true;
    return true;
  }
  dispose() {
    for (const p of this.pages) {
      p.tex.dispose();
      p.canvas.width = p.canvas.height = 0; // (lets the canvas' memory go at once)
    }
    for (const m of this.mats) m.dispose();
    for (const m of this.cutMats.values()) m.dispose();
    for (const g of Object.values(this.geos)) g.dispose();
    this.pages.length = 0;
  }
}

let atlas = null;
let theRenderer = null;

// The level's sheet: `kinds` are every outline it is known to need.
export function openAtlas(kinds, midway = false) {
  const list = [...new Set(kinds)].filter(k => SHAPES[k] || CARDS[k]);
  if (atlas) atlas.dispose();
  atlas = new Atlas(list.length + 2, midway);
  for (const k of list) atlas.add(k);
  for (const p of atlas.pages) theRenderer?.initTexture?.(p.tex);
  return atlas;
}
export function closeAtlas() {
  if (atlas) atlas.dispose();
  atlas = null;
}
function getAtlas() {
  if (!atlas) atlas = new Atlas(16, false);
  return atlas;
}

// (the renderer, so a level's sheet goes to the GPU as its world is built and
// not on the first frame it is seen)
export function warmPlates(renderer) {
  theRenderer = renderer || null;
}
// (for the preview harness)
export const plateAtlas = (page = 0) => getAtlas().pages[page]?.canvas;
export const atlasInfo = () => {
  const A = getAtlas();
  return { pages: A.pages.length, w: A.W, h: A.H, outlines: A.n };
};

// What an outline is, for how it is painted and how it goes down.
const ANIMAL =
  /buck|doe|antelope|rabbit|turkey|squirrel|duck|goose|heron|frog|boar|bear|wolf|crow|vulture|owl|monkey|lion|zebra|giraffe|rhino|elephant|tusker|gator|hen$|shark|goat|marmot|grouse|cow$|royal|turtle|gull|crab|moose|womprat|dewback|tauntaun|snake|cobra|tarantula|scarab|camel|ostrich|meerkat|warthog|croc|hippo|flamingo|gorilla|baboon|leopard|hyena|gnu/;
// (a campaign's outlines carry its name in front: boar_hen is a hen)
const bare = kind => kind.replace(/^(duck|boar|deer|safari|bond|hostage|carnival|galaxy|west|indy|i)_/, "");
export function plateClass(kind) {
  if (SHATTER.has(kind)) return "glass";
  if (PERSON.has(kind)) return "person";
  if (SHAPES[kind]) return ANIMAL.test(bare(kind)) ? "animal" : "thing";
  const [w, h] = CARD_SIZE[kind] || [1, 1];
  return h > w * 1.25 ? "person" : "thing";
}

// Its own colours (Jay, 2026-11-14: "less like falling plates and midway type
// shooters and more realistic"): a deer is deer-coloured whatever paint its
// row asked for. Anything not an animal keeps the paint it was given.
const COAT = [
  [/bigbuck|buck|royal|doe/, 0xa57341],
  [/antelope|gnu/, 0xae7e45],
  [/rabbit/, 0x9c8a71],
  [/turkey|grouse/, 0x6c4b31],
  [/squirrel/, 0x995228],
  [/duck/, 0x79643e],
  [/goose/, 0x837c70],
  [/heron/, 0x87949c],
  [/frog/, 0x588430],
  [/tusker|warthog|boar/, 0x5c4739],
  [/bear/, 0x5e3f2a],
  [/wolf|hyena/, 0x837c70],
  [/crow/, 0x303036],
  [/vulture|ostrich/, 0x4e3f37],
  [/owl|marmot|meerkat|womprat/, 0x947048],
  [/monkey|baboon/, 0x825e3a],
  [/lion/, 0xb68c46],
  [/zebra|goat|gull|tauntaun/, 0xc2beb3],
  [/giraffe|leopard/, 0xc29237],
  [/rhino|elephant|hippo|shark/, 0x7e7a76],
  [/gator|croc|turtle|dewback/, 0x56723a],
  [/hen$/, 0xb2652c],
  [/cow$/, 0x8d4a1d],
  [/crab/, 0xb94128],
  [/moose|gorilla|tarantula/, 0x49362e],
  [/snake/, 0x65762b],
  [/cobra/, 0x4d4d36],
  [/scarab/, 0x1f495e],
  [/camel/, 0xb08b50],
  [/flamingo/, 0xd56e85]
];
// (and a few things that have a colour of their own)
const THINGS = [
  [/pumpkin/, 0xc8691e],
  [/mushroom/, 0xa8452c],
  [/skull/, 0xd8d0bc]
];
export function plateTint(kind, tint, midway = getAtlas().midway) {
  if (midway || !SHAPES[kind]) return tint;
  const name = bare(kind);
  if (!ANIMAL.test(name)) {
    for (const [re, hex] of THINGS) if (re.test(name)) return hex;
    return tint;
  }
  for (const [re, hex] of COAT) if (re.test(name)) return hex;
  return tint;
}

// One plate on its own (the featured shoots' running animals): the outline on
// a card h m tall standing on its bottom edge, facing -x; flip scale.x to face
// +x.
export function plateCutout(kind, tint, h) {
  const A = getAtlas();
  A.add(kind);
  const page = A.cells[kind].page;
  const hex = plateTint(kind, tint, A.midway);
  const key = `${page}:${hex}`;
  if (!A.cutMats.has(key)) {
    const m = A.mats[page].clone();
    m.color.setHex(hex);
    A.cutMats.set(key, m);
  }
  const cls = plateClass(kind);
  if (cls !== "animal" && cls !== "person") {
    const mesh = new THREE.Mesh(A.geos[kind], A.cutMats.get(key));
    mesh.scale.set(h * A.cells[kind].aspect, h, 1);
    return mesh;
  }
  // Something with legs gets a card of its own cut at the hip, three across:
  // stride(k) pulls its feet together and throws them out (k -1..1), fore and
  // hind opposite, so it gallops (or a man's legs scissor) as it goes.
  const c = A.cells[kind];
  const g = new THREE.PlaneGeometry(1, 1, 2, 2);
  g.translate(0, 0.5, 0);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const HIP = cls === "animal" ? 0.46 : 0.5;
  for (let i = 0; i < pos.count; i++) {
    // (rows at the top, the hip and the feet)
    if (Math.abs(pos.getY(i) - 0.5) < 0.01) pos.setY(i, HIP);
    uv.setXY(i, (c.x + (pos.getX(i) + 0.5) * c.w) / A.W, 1 - (c.y + (1 - pos.getY(i)) * c.h) / A.H);
  }
  pos.setUsage(THREE.DynamicDrawUsage);
  const mesh = new THREE.Mesh(g, A.cutMats.get(key));
  mesh.scale.set(h * c.aspect, h, 1);
  const reach = cls === "animal" ? 0.14 : 0.1;
  mesh.userData.stride = k => {
    for (let i = 0; i < pos.count; i++)
      if (pos.getY(i) < 0.01) {
        const x0 = Math.round(pos.getX(i) * 2) / 2; // -0.5, 0, 0.5 as cut
        pos.setX(i, x0 === 0 ? 0 : x0 * (1 + 2 * reach * k));
      }
    pos.needsUpdate = true;
  };
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

// What a level's raised targets sit on now that the rails are gone: dead wood
// in the country, rock where there is none, crates and barrels in town.
const WOODS = /^(duck|deer|boar|safari)/;
const ROCKS =
  /^(camp|west_canyon|west_boothill|west_mine|border|tatooine|hoth|galaxy_endor|galaxy_sarlacc|indy_peru|indy_canyon|indy_road|indy_well|indy_grail|bond_volcano|bond_ice)/;
const EYE_H = 1.6;
const DRINK = /^(glass|mug|bottle)$/;
const FILLER = /^(hostage_cone|disc|bond_martini|heart|spade|diamond|club|helmet|star)$/;
// (for the preview harness: lay every row out as it was, to compare)
export const DEBUG = { even: false, seed: undefined };

// How wide an outline is for its height (before its sheet is drawn).
function aspectOf(kind) {
  const s = SHAPES[kind];
  if (s) {
    const [x0, y0, x1, y1] = shapeBox(s);
    return (x1 - x0) / (y1 - y0) || 1;
  }
  const c = CARD_SIZE[kind];
  return c ? c[0] / c[1] : 1.2;
}
const widest = kinds => kinds.reduce((a, k) => (aspectOf(k) > aspectOf(a) ? k : a), kinds[0]);

class Layout {
  constructor(key) {
    this.key = key;
    this.plates = [];
    this.props = [];
    this.banks = 0;
    this.loose = []; // rows to be scattered once everything is laid out (finish)
    this.rows = 0;
    // (a midway is a midway: the carnival keeps its rows, rails and paint)
    this.midway = /^carnival/.test(key);
    this.ground = WOODS.test(key) ? "wood" : ROCKS.test(key) ? "rock" : "crate";
    // (RESEED: a level whose scatter put something behind its scenery gets another deal)
    this.R = mulberry(key.length * 7919 + key.charCodeAt(0) + 1013 * (DEBUG.seed ?? RESEED[key] ?? 0));
  }
  r(a, b) {
    return a + (b - a) * this.R();
  }
  // A row of midway filler (see finish()): plate discs, cones, card suits,
  // helmets; in the Bond levels the cocktail glasses set out on the tables too.
  filler(o) {
    const kinds = [].concat(o.kind);
    return kinds.every(k => FILLER.test(k)) || (this.key.startsWith("bond") && kinds.every(k => k === "glass"));
  }
  add(p) {
    p.i = this.plates.length;
    p.id = `p${p.i}`;
    this.plates.push(p);
    return p;
  }
  // n plates across u0..u1 at distance f, standing at base (m above the
  // ground). kinds/tints cycle. bank: plates per group (0 = none).
  //
  // Jay, 2026-11-14: the rows read as a midway's falling plates. So unless
  // the level is a midway (or the row says even: true, or it is fixed to a
  // building), a row is only where its plates are roughly: finish() scatters
  // them into loose groups, uneven in spacing, depth and size, each group of
  // a bank a herd. A raised row no longer gets a rail: each plate gets
  // something of its own to sit on. A raised row with rail: false is on a
  // wall or a counter the level built, so it only shuffles along it.
  row(o) {
    const kinds = [].concat(o.kind);
    const tints = [].concat(o.tint || "white");
    const base = o.base || 0;
    const bankSize = o.bank || 0;
    const w = o.fixed ? 1 : SPREAD; // (fixed: on a bar or balcony that doesn't move)
    // (raised with rail: false: it is on something the level built there. A
    // stump apiece and it stays put; one long shelf, wall or counter
    // (plates-ledges.js, found by the preview harness) and its plates bunch
    // up along it. Raised, fixed and on the old rail: it bunches up along its
    // line too, each plate on a seat of its own.)
    const row = this.rows++;
    const free = !this.midway && !o.even && !DEBUG.even;
    const built = base > 0.15 && o.rail === false && !o.perch;
    const railed = base > 0.15 && !!o.fixed && o.rail !== false && !o.perch;
    const ledge = free && ((built && !!LEDGES[this.key]?.includes(row)) || railed);
    // (out of town, a low row with a stump or a rock apiece leaves them and
    // scatters onto seats of its own: the stumps stay as stumps. In town a
    // mug on a table is where a mug belongs.)
    const reseat = free && built && !ledge && base <= 1.3 && o.n >= 3 && this.ground !== "crate";
    // (fixed to a floor: shuffled about on it)
    const floor = free && !!o.fixed && base <= 0.15;
    const even = !ledge && !reseat && !floor && (!free || o.fixed || built);
    let bank = null;
    const mine = [];
    for (let k = 0; k < o.n; k++) {
      const u = w * (o.n === 1 ? (o.u0 + o.u1) / 2 : o.u0 + ((o.u1 - o.u0) * k) / (o.n - 1));
      const f = o.f + (o.jitter ? this.r(-o.jitter, o.jitter) : 0);
      if (bankSize && k % bankSize === 0) bank = this.banks++;
      const kind = kinds[k % kinds.length];
      mine.push(
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
          bank: bankSize ? bank : null,
          bj: bankSize ? k % bankSize : 0,
          row,
          built,
          tag: even ? (o.fixed ? "fixed" : built ? "built" : "even") : ledge ? "ledge" : "loose"
        })
      );
    }
    const wood = o.wood ?? 0x5a3a22;
    // (filler set out on a table or a low counter the level built: kept aside,
    // and if the level has people of its own they stand there instead)
    if (even && free && built && base <= 1.4 && this.filler(o))
      (this.tabled ||= []).push({
        plates: mine,
        o,
        base,
        wood,
        ledge: false,
        railed: false,
        table: true,
        lo: Math.min(o.u0, o.u1) * w,
        hi: Math.max(o.u0, o.u1) * w
      });
    // (drinks set out on a table or a bar top: every third one becomes
    // whoever is drinking it, the rest stay as their bottles and glasses)
    else if (even && free && built && base <= 1.4 && kinds.every(k => DRINK.test(k))) {
      const who = mine.filter((p, k) => k % 3 === 1 && !ASIS[this.key]?.includes(p.i));
      if (who.length)
        (this.tabled ||= []).push({
          plates: who,
          o,
          base,
          wood,
          ledge: false,
          railed: false,
          table: true,
          drink: true,
          lo: Math.min(o.u0, o.u1) * w,
          hi: Math.max(o.u0, o.u1) * w
        });
    }
    if (!even) {
      this.loose.push({
        plates: mine,
        o,
        base,
        wood,
        ledge,
        railed: ledge && railed,
        lo: Math.min(o.u0, o.u1) * w,
        hi: Math.max(o.u0, o.u1) * w
      });
      return;
    }
    if (base > 0.15 && o.perch) {
      // a pole (a dead tree, a post) under each
      // (where they are as laid out: PlateField moves the plates back before
      // the scenery is built, and the scenery is moved back itself)
      const at = mine.map(p => [p.u, p.f]);
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
  // Where a plate shows from the stands, as a box on a screen 1 m away (the
  // two ends of the roof see it a little differently: m is the slack).
  box(u, f, base, size, m = 1.25, kind = null) {
    const d = f + SHIFT;
    const y = groundAt(d) + base - EYE_H;
    const hw = (size * Math.max(0.5, aspectOf(kind) / 2 + 0.1) * m) / d;
    return [u / d - hw, y / d - (size * (m - 1)) / d, u / d + hw, (y + size * m) / d];
  }
  clear(b, boxes, self) {
    for (const c of boxes) if (c.own !== self && b[0] < c[2] && b[2] > c[0] && b[1] < c[3] && b[3] > c[1]) return false;
    return true;
  }
  // Scatter the loose rows. Everything that doesn't move (pop-ups, fixed
  // rows) is taken first, so nothing lands in front of a window.
  finish() {
    // Jay, 2026-11-14: no midway filler. A row of cones, discs, helmets, card
    // suits or glasses set out on the ground (or on the old rail) becomes the
    // level's own people, standing about: drawn from who its pop-ups are
    // (never a don't-shoot, never its 50-point boss).
    const cast = [];
    for (const p of this.plates)
      if (p.roll)
        for (const [kind, weight, extra] of p.roll)
          if (!extra?.dont && !(extra?.pts > 25) && plateClass(kind) === "person" && p.size > 1.2)
            cast.push([kind, weight, p.size]);
    if (cast.length && this.tabled) this.loose.push(...this.tabled);
    // (the same for drinks along a bar top or a shelf the row shuffles on)
    if (cast.length)
      for (const row of [...this.loose]) {
        if (!row.ledge || row.railed || row.base > 1.4 || row.drink) continue;
        if (![].concat(row.o.kind).every(k => DRINK.test(k))) continue;
        const who = row.plates.filter((p, k) => k % 3 === 1 && !ASIS[this.key]?.includes(p.i));
        if (!who.length) continue;
        row.plates = row.plates.filter(p => !who.includes(p));
        this.loose.push({ ...row, plates: who, ledge: false, railed: false, table: true, drink: true });
      }
    if (!this.loose.length) return;
    // (PINS, found by tests/plates-preview/pins.py: plates every deal put
    // behind the level's scenery. They stay where the level set them.)
    const pins = DEBUG.nopins ? null : PINS[this.key];
    if (pins) for (const row of this.loose) for (const p of row.plates) if (pins.includes(p.i)) p.pin = [p.u, p.f];
    const taken = [];
    const moving = new Set(this.loose.flatMap(l => l.plates));
    for (const p of this.plates) {
      if (moving.has(p)) continue;
      const s = Math.abs(p.slide || 0);
      const b = this.box(p.u, p.f, p.base, p.size, 1.25, widest(p.kinds));
      if (s) {
        b[0] -= s / (p.f + SHIFT);
        b[2] += s / (p.f + SHIFT);
      }
      taken.push(b);
    }
    if (cast.length)
      for (const row of this.loose) {
        if (!(row.drink || this.filler(row.o)) || (row.ledge && !row.railed && row.base > 1.4)) continue;
        // (at a table: behind it, on whatever floor the table stands on)
        const back = row.table || (row.ledge && !row.railed) ? 0.55 : 0;
        const floor = back && !row.drink ? Math.max(0, row.base - 0.8) : 0;
        row.table = !!back;
        const total = cast.reduce((a, c) => a + c[1], 0);
        for (const p of row.plates) {
          let w = this.R() * total;
          let pick = cast[0];
          for (const c of cast)
            if ((w -= c[1]) <= 0) {
              pick = c;
              break;
            }
          p.kind = pick[0];
          p.kinds = [pick[0]];
          p.size = pick[2] * this.r(0.94, 1.04);
          p.base = p.pin && back ? 0 : floor;
          p.f += p.pin && back ? -1 : back; // (pinned: in front of the table, in the open)
          // (pinned people in front of a table still do not stand in a rank: a step off the line
          // each, the same step every time)
          if (p.pin && back) {
            p.u += Math.sin(p.i * 12.9898) * 0.45;
            p.f += Math.cos(p.i * 78.233) * 0.55 - 0.3;
            p.size *= 1 + Math.sin(p.i * 3.7) * 0.05;
          }
          p.tint = PAINT.card;
          p.pts = undefined;
        }
        row.o = { ...row.o, size: row.plates[0].size, f: row.o.f + back };
        row.base = floor;
        // (and they stand about like anything else on the ground, not in a line)
        row.ledge = row.railed = row.floor = false;
        // (people need more room than the plates they replace, and do not
        // stand shoulder to shoulder)
        row.cast = true;
        const need = row.plates.length * row.plates[0].size * 0.75;
        if (row.hi - row.lo < need) {
          const mid = (row.lo + row.hi) / 2;
          row.lo = mid - need / 2;
          row.hi = mid + need / 2;
        }
        row.plates.forEach((p, k, all) => {
          if (!p.pin) p.u = all.length > 1 ? row.lo + ((row.hi - row.lo) * k) / (all.length - 1) : p.u;
        });
      }
    // (every plate holds the place its row gave it until it has a new one,
    // so none is dealt onto another, and one with nowhere to go stays put)
    for (const row of this.loose)
      for (const p of row.plates) {
        const b = this.box(p.u, p.f, p.base, p.size, 1.05, p.kind);
        b.own = p;
        taken.push(b);
      }
    const place = (p, u, f, size, base, m = 1.25) => {
      if (p.pin) return true;
      const b = this.box(u, f, base, size, m, p.kind);
      if (!this.clear(b, taken, p)) return false;
      const held = taken.findIndex(c => c.own === p);
      if (held >= 0) taken.splice(held, 1);
      taken.push(b);
      p.u = u;
      p.f = f;
      p.size = size;
      return true;
    };
    // (no room found by chance: the nearest clear place to where the row had
    // it, working outwards; only if there is none at all does it stay there)
    const squeeze = (p, u0, f0, size, base, deep, lo, hi) => {
      const step = Math.max(0.25, size * 0.5);
      for (let k = 0; k < 40; k++)
        for (const j of deep ? [0, 1, -1, 2] : [0])
          for (const sgn of k ? [1, -1] : [1]) {
            const u = u0 + sgn * k * step;
            if (u < lo || u > hi) continue;
            if (place(p, u, f0 + j * 0.9, size, base, 1.05)) return;
          }
      p.u = u0;
      p.f = f0;
    };
    for (const row of this.loose) {
      const { plates, o, base, lo, hi } = row;
      const n = plates.length;
      const raised = base > 0.15 && !row.table;
      const slot = n > 1 ? (hi - lo) / (n - 1) : 2;
      if (row.ledge || row.floor) {
        // along the shelf it is on: left in twos and threes, not set out (on a
        // floor, a little nearer or further too)
        const deep = row.floor ? 0.6 : 0;
        for (let k = 0; k < n; ) {
          const len = o.bank ? o.bank : Math.min(n - k, 2 + Math.floor(this.r(0, 2.99)));
          const g = plates.slice(k, k + len);
          k += len;
          const c = g.reduce((a, p) => a + p.u, 0) / g.length;
          const pull = this.r(0.3, 0.8);
          const shift = this.r(-0.3, 0.3) * slot;
          for (const p of g) {
            const u0 = p.u;
            const f0 = p.f;
            let ok = false;
            for (let t = 0; t < 10 && !ok; t++)
              ok = place(
                p,
                THREE.MathUtils.clamp(c + shift + (u0 - c) * pull + this.r(-0.14, 0.14) * slot, lo, hi),
                f0 + this.r(-deep, deep),
                p.size,
                base,
                1.05
              );
            if (!ok) squeeze(p, u0, f0, p.size, base, 0, lo, hi);
          }
        }
        if (row.railed) this.seat(row);
        continue;
      }
      // groups: a bank is one; plates in no bank gather in twos to fours
      const groups = [];
      for (let k = 0; k < n; ) {
        const len = o.bank && !row.cast ? o.bank : Math.min(n - k, 1 + Math.floor(this.r(0, row.cast ? 2.99 : 3.99)));
        groups.push(plates.slice(k, k + len));
        k += len;
      }
      const df = row.table ? 0.35 : raised ? Math.min(1.2, 0.3 + 0.03 * o.f) : Math.min(3.4, 1.5 + 0.06 * o.f);
      for (const g of groups) {
        const c = g.reduce((a, p) => a + p.u, 0) / g.length;
        const reach = Math.max(slot * g.length * 0.5, o.size * 1.6 * g.length * 0.5);
        const gc = c + this.r(-0.3, 0.3) * slot * (groups.length > 1 ? 1 : 0.4);
        const gf = o.f + this.r(-df, df) * 0.6;
        for (const p of g) {
          const u0 = p.u;
          const f0 = p.f;
          const size0 = p.size;
          let ok = false;
          for (let t = 0; t < 14 && !ok; t++) {
            const u = THREE.MathUtils.clamp(gc + this.r(-1, 1) * reach, lo - 0.6, hi + 0.6);
            const f = Math.max(o.f - Math.min(df, 1.2), gf + this.r(-df, df) * 0.6 + (raised ? 0 : df * 0.5));
            ok = place(p, u, f, size0 * this.r(0.86, 1.2), base);
          }
          // (no room in its group: anywhere along the row)
          for (let t = 0; t < 24 && !ok; t++)
            ok = place(p, this.r(lo, hi), Math.max(o.f - df, o.f + this.r(-df, df)), size0, base);
          // (people who replaced a plate rack have no rack to go back to: off
          // to either side of whatever they would stand in front of)
          for (let t = 0; t < 60 && !ok && row.cast && !row.table; t++)
            ok = place(p, this.r(lo - 10, hi + 10), Math.max(o.f - 1.2, o.f + this.r(-df, df * 1.5)), size0, base);
          // (still none: where the row had it, or wider and deeper yet)
          if (!ok) ok = place(p, u0, f0, size0, base);
          for (let t = 0; t < 40 && !ok; t++)
            ok = place(p, this.r(lo - 2.5, hi + 2.5), Math.max(o.f - df, o.f + this.r(-df, df) * 1.6), size0, base);
          if (!ok) squeeze(p, u0, f0, size0, base, 1, lo - 3, hi + 3);
        }
        // a ground plate knocked down comes back somewhere else nearby: two
        // more places each, clear of everything else's
        if (!raised)
          for (const p of g) {
            p.spots = [];
            for (let t = 0; t < 10 && p.spots.length < 2; t++) {
              const u = THREE.MathUtils.clamp(gc + this.r(-1.25, 1.25) * reach, lo - 1, hi + 1);
              const f = Math.max(o.f - df, gf + this.r(-df, df));
              const b = this.box(u, f, base, p.size, 1.25, p.kind);
              if (!this.clear(b, taken)) continue;
              taken.push(b);
              p.spots.push([u, f]);
            }
          }
      }
      if (raised) this.seat(row);
    }
  }
  // Something for each raised plate to sit on.
  seat({ plates, base, wood, o }) {
    const at = plates.map(p => [p.u, p.f, p.size, this.R(), this.R()]);
    const kind = this.ground;
    const grey = 0x8a8072;
    const CYL = (r0, r1, h, n) => new THREE.CylinderGeometry(r0, r1, h, n);
    this.props.push(P => {
      for (const [u, f, size, a, b] of at) {
        const top = GROUND + base;
        // (behind the plate as the stands see it: it faces them, so "behind"
        // is away from the roof, not straight downrange)
        const d = Math.hypot(u, f + SHIFT);
        const bu = u / d;
        const bf = (f + SHIFT) / d;
        // put(geometry, colour, sideways, height of its middle, behind, turn about up, lean)
        const put = (geo, hex, side, h, back, ry = 0, rz = 0, sy = 1) =>
          P.add(geo, hex, u + bu * back + bf * side, h, f + bf * back - bu * side, 0, ry, rz, 1, sy, 1);
        if (o.perch || base > 2.6) {
          // a dead tree (a pole, in town) with a stub of a branch
          put(CYL(0.05, 0.1 + base * 0.012, base, 5), wood, 0, GROUND + base / 2, 0.07);
          if (kind !== "crate")
            put(CYL(0.025, 0.04, 0.7, 4), wood, (b - 0.5) * 0.5, top - 0.25, 0.07, 0, b < 0.5 ? 1.1 : -1.1);
        } else if (kind === "wood") {
          if (base < 0.75) put(CYL(0.17 + a * 0.08, 0.24 + a * 0.08, base, 7), wood, 0, GROUND + base / 2, 0.19);
          else {
            // a snag: a broken trunk
            put(CYL(0.09 + a * 0.04, 0.2 + a * 0.06, base, 6), wood, 0, GROUND + base / 2, 0.17);
            put(CYL(0.03, 0.05, 0.6, 4), wood, b < 0.5 ? -0.3 : 0.3, top - 0.5 - a * 0.4, 0.17, 0, b < 0.5 ? 1 : -1);
          }
        } else if (kind === "rock") {
          // a boulder, and another against its foot
          const w = Math.max(0.4, size * 0.75) + a * 0.25;
          put(CYL(w * 0.56, w * 0.72 + base * 0.04, base, 5), grey, 0, GROUND + base / 2, 0.07 + w * 0.5, a * 3);
          put(
            new THREE.SphereGeometry(w * 0.55, 6, 4),
            grey,
            (b - 0.5) * w,
            GROUND + base * 0.3,
            0.07 + w * 0.6,
            b * 3,
            0,
            0.7
          );
        } else if (base < 1.0 && a < 0.5) {
          // a barrel
          put(CYL(0.3, 0.3, base, 9), wood, 0, GROUND + base / 2, 0.36);
        } else {
          // crates, stacked as high as it takes
          const n = Math.max(1, Math.round(base / 0.7));
          const h = base / n;
          const turn = Math.atan2(bu, bf);
          for (let k = 0; k < n; k++)
            put(BOX(0.62 - k * 0.05, h - 0.02, 0.6), k % 2 ? 0x6e5234 : wood, 0, GROUND + h * (k + 0.5), 0.36, turn);
        }
      }
    });
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
  L.finish();
  return L;
}

// ---- The field: a world's plates, drawn and hit -----------------------------------

const v = new THREE.Vector3();
const n0 = new THREE.Vector3();
const r0 = new THREE.Vector3();
const up0 = new THREE.Vector3();
const m4 = new THREE.Matrix4();
const r0b = new THREE.Vector3();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const UP = new THREE.Vector3(0, 1, 0);

const ease = k => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

export class PlateField {
  // extra: outlines the level's movers will want from the same sheet
  constructor(key, fx, extra = []) {
    this.key = key;
    this.fx = fx; // { play(name, worldPos, vol, ref), debris(colours, worldPos, worldVel), popup(text, by, worldPos), bonus(text, by, worldPos) }
    const L = plateLayout(key);
    this.plates = L.plates;
    this.propFns = L.props;
    this.byId = new Map(this.plates.map(p => [p.id, p]));
    this.state = new Map(); // id -> { at, by, n, k (times a stand plate has gone down) }
    this.bankAt = new Map(); // bank -> time it was cleared
    this.seed = 1;
    this.group = new THREE.Group();
    this.group.name = `LoungePlates:${key}`;
    const A = openAtlas([...this.plates.flatMap(p => p.kinds), ...extra], L.midway);
    this.atlas = A;
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
      p.cls = {};
      for (const k of p.kinds) {
        p.cls[k] = plateClass(k);
        const im = this.meshes[k];
        if (!im) continue;
        const i = im.userData.next++;
        p.slots[k] = i;
        const paint = PERSON.has(k) || /^(letter|bull|clown|dog)/.test(k) ? PAINT.card : plateTint(k, p.tint, L.midway);
        if (p.kinds.length === 1) p.tint = paint;
        im.setColorAt(i, col.setHex(paint));
        im.setMatrixAt(i, ZERO);
      }
      // laid out as the world was; moved back and stood on the lifted ground
      // with it (shoots-art.js SHIFT, groundAt). at: every place it can stand
      // (a scattered ground plate has two more to come back to).
      p.f += SHIFT;
      p.at = [[p.u, p.f - SHIFT], ...(p.spots || [])].map(([u, f0]) => {
        const f = f0 + SHIFT;
        const o = new THREE.Vector3(u, groundAt(f) + p.base, -f);
        const n = new THREE.Vector3(-u, 0, f).normalize(); // faces the stands
        const r = new THREE.Vector3().crossVectors(UP, n); // the shooter's right across its face
        let pts = p.pts;
        if (pts === undefined && p.mode === "stand") pts = sizePoints(p.size, u, f, o.y + p.size / 2);
        // (a plate in a bank is never worth more than 25: Jay, 2026-10-31, "no 50s for the banks")
        if (p.bank !== null && pts > BANK_MAX) pts = BANK_MAX;
        return { o, n, r, f, pts };
      });
      p.o = p.at[0].o;
      p.n = p.at[0].n;
      p.r = p.at[0].r;
      p.pts = p.at[0].pts;
      p.ph = ((p.i * 2.399) % 6.283) + 0.3; // (its own sway)
    }
    for (const im of Object.values(this.meshes)) if (im.instanceColor) im.instanceColor.needsUpdate = true;
    this.group.traverse(o => (o.matrixNeedsUpdate = true));
  }

  // The plates' seats, ridges and cover, into the world's scenery.
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

  // When a knocked-down stand plate is back. A cleared group comes back
  // sooner, but one after another, not as one (it isn't a pinball's bank).
  upAt(p, s) {
    let t = s.at + DOWN + (p.at.length > 1 ? ((p.i * 0.37) % 1) * 1.5 : 0);
    const b = p.bank !== null ? this.bankAt.get(p.bank) : undefined;
    if (b !== undefined && b >= s.at) t = Math.min(t, b + BANK_BACK + 0.55 * p.bj);
    return t;
  }

  // How a hit plate goes at t s after the hit: an animal drops on its side,
  // a person crumples, a thing is knocked flat backward. null: gone.
  drop(cls, t, side) {
    if (t > GONE || cls === "glass") return null;
    const sink = 1 - ease((t - (GONE - 0.25)) / 0.25);
    if (cls === "animal") {
      const k = Math.min(1, t / 0.32);
      const bounce = t > 0.32 && t < 0.5 ? 0.07 * Math.sin(((t - 0.32) / 0.18) * Math.PI) : 0;
      return { a: 0.25 * k, roll: side * (1.48 * k * k - bounce), sq: sink };
    }
    if (cls === "person") {
      const k = ease(t / 0.3);
      return { a: 0.5 * k, roll: side * 0.55 * k, sq: (1 - 0.62 * k) * sink };
    }
    return { a: FLAT * Math.min(1, (t / FALL) ** 2), roll: 0, sq: 1 };
  }

  // Where plate p is at T: { kind, sp (which of its places), a (lean back,
  // rad), roll (over sideways, rad), sq (how tall, 0..1), off (slide), live
  // (can be hit), pts, dont } or null when it isn't showing.
  pose(p, T) {
    const s = this.state.get(p.id);
    if (p.mode === "stand") {
      const cls = p.cls[p.kind];
      const k = s ? s.k || 0 : 0;
      const sp = k % p.at.length;
      if (s) {
        const up = this.upAt(p, s);
        if (T < up) {
          // going down where it stood
          const d = this.drop(cls, T - s.at, p.mirror);
          return d && { kind: p.kind, sp: (k + p.at.length - 1) % p.at.length, off: 0, live: false, ...d };
        }
        const back = cls === "animal" ? WALK_IN : RISE;
        if (T < up + back) {
          const e = (T - up) / back;
          // an animal steps out, a person stands up, a thing is stood up
          if (cls === "animal")
            return {
              kind: p.kind,
              sp,
              a: 0,
              roll: 0,
              sq: 0.55 + 0.45 * ease(e * 1.6),
              off: -p.mirror * 1.3 * (1 - ease(e)),
              live: false
            };
          if (cls === "person")
            return { kind: p.kind, sp, a: 0, roll: 0, sq: 0.3 + 0.7 * ease(e), off: 0, live: false };
          return { kind: p.kind, sp, a: FLAT * (1 - e), roll: 0, sq: 1, off: 0, live: false };
        }
      }
      // (standing: not stock still)
      const sway =
        cls === "animal" ? 0.022 * Math.sin(T * 0.9 + p.ph) : cls === "person" ? 0.012 * Math.sin(T * 0.6 + p.ph) : 0;
      return { kind: p.kind, sp, a: 0, roll: sway, sq: 1, off: 0, live: true, pts: p.at[sp].pts };
    }
    const tn = this.turn(p, T);
    if (tn.t0 === undefined || T < tn.t0 || T > tn.t1) return null;
    const cls = p.cls[tn.kind];
    if (s && s.n === tn.n) {
      const d = this.drop(cls, T - s.at, p.mirror);
      return d && { kind: tn.kind, sp: 0, off: p.mode === "peek" ? p.slide : 0, live: false, ...d };
    }
    const e = Math.min(1, (T - tn.t0) / RISE, (tn.t1 - T) / RISE);
    if (e <= 0.02) return null;
    // a person or an animal comes up from behind its cover; a thing swings up
    const stands = p.mode === "pop" && cls !== "thing" && cls !== "glass";
    return {
      kind: tn.kind,
      sp: 0,
      a: p.mode === "pop" && !stands ? FLAT * (1 - e) : 0,
      roll: 0,
      sq: stands ? Math.max(0.05, e) : 1,
      off: p.mode === "peek" ? p.slide * e : 0,
      live: e > 0.7,
      pts: tn.pts,
      dont: tn.dont
    };
  }

  // The plate's frame at a pose: origin (bottom middle), right, up, normal.
  frame(p, ps, o, r, up, n) {
    const S = p.at[ps.sp];
    const c = Math.cos(ps.a);
    const s = Math.sin(ps.a);
    o.copy(S.o).addScaledVector(S.r, ps.off);
    up.copy(UP).multiplyScalar(c).addScaledVector(S.n, -s);
    n.copy(S.n).multiplyScalar(c).addScaledVector(UP, s);
    r.copy(S.r);
    if (ps.roll) {
      const cr = Math.cos(ps.roll);
      const sr = Math.sin(ps.roll);
      r0b.copy(r);
      r.multiplyScalar(cr).addScaledVector(up, -sr);
      up.multiplyScalar(cr).addScaledVector(r0b, sr);
    }
  }

  update(T) {
    const A = this.atlas;
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
        const h = p.size * ps.sq;
        const w = p.size * A.cells[k].aspect * p.mirror;
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
    const A = this.atlas;
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
        const y = q.dot(up) / (p.size * ps.sq);
        if (x < 0 || x >= 1 || y < 0 || y >= 1) continue;
        if (!c.mask[Math.floor((1 - y) * MASK) * MASK + Math.floor(x * MASK)]) continue;
        best = { t, p, ps, point: ray.origin.clone().addScaledVector(ray.dir, t) };
      }
      if (best && !out.has(best.p.id)) out.set(best.p.id, best);
    }
    return [...out.values()].map(b => ({ id: b.p.id, pts: b.ps.pts, dont: b.ps.dont, point: b.point }));
  }

  // Where plate p's middle is at T (for the harness and anything aiming at it).
  middle(p, T, out = new THREE.Vector3()) {
    const ps = this.pose(p, T);
    const S = p.at[ps ? ps.sp : 0];
    return out
      .copy(S.o)
      .addScaledVector(S.r, ps ? ps.off : 0)
      .addScaledVector(UP, p.size * 0.5);
  }

  // A hit from anyone at shared time `at` (ours or a message). Returns { pts,
  // bonus } (bonus: a group cleared), or null if it was already down (someone
  // else got it first) or not up to be hit. x2: the finale.
  hit(id, at, by, x2, toWorld) {
    const p = this.byId.get(id);
    if (!p) return null;
    // Two shots at once (each headset took its own first): both settle on
    // the earlier one, so they agree on what's down.
    const prev = this.state.get(id);
    if (prev && prev.at > at && prev.at - at < GONE) {
      this.state.set(id, { ...prev, at, by });
      return null;
    }
    const ps = this.pose(p, at);
    if (!ps || !ps.live) return null;
    const n = p.mode === "stand" ? 0 : this.turn(p, at).n;
    this.state.set(id, { at, by, n, k: ((prev && prev.k) || 0) + 1 });
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
    const S = p.at[ps.sp];
    const centre = toWorld(
      v
        .copy(S.o)
        .addScaledVector(S.r, ps.off)
        .addScaledVector(UP, p.size * 0.5)
        .clone()
    );
    const kind = ps.kind;
    const sound = ps.dont ? "wrong" : SOUND[kind] || (PERSON.has(kind) ? "thud" : "ping");
    this.fx.play(sound, centre, 1, 8 + S.f * 0.3);
    if (ps.dont) this.fx.play("wrong", centre, 0.9, 14);
    const tint = new THREE.Color(p.tint).getHex();
    const cls = p.cls[kind];
    this.fx.debris(
      SHATTER.has(kind)
        ? [0xe8f4ff, 0xffffff, 0x7fd18a]
        : cls === "animal"
          ? [tint, 0x6a5a48, 0x3a3028] // (a puff of dust and hair, not paint chips)
          : [tint, 0xffffff, 0x333333],
      centre,
      v.set(0, 1.5, 0)
    );
    this.fx.popup(pts < 0 ? `${pts}` : `+${pts}`, pts < 0 ? null : by, centre);
    if (bonus) {
      this.fx.play("bell", centre, 0.9, 20);
      this.fx.bonus(
        `${this.atlas.midway ? "BANK" : "CLEAN SWEEP"} +${bonus}`,
        by,
        centre.clone().add(v.set(0, p.size + 0.6, 0))
      );
    }
    return { pts, bonus };
  }

  dispose() {
    for (const im of Object.values(this.meshes)) im.dispose();
  }
}
