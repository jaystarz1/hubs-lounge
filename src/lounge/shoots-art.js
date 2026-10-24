import * as THREE from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Art for the featured shoots (shoots.js), plain three.js. Everything is
// built in code, no files: each target kind is ONE merged, vertex-coloured
// mesh (plus flapping wings for birds, a painted card for cut-outs), with
// the shading baked into the colours, so a flock or a stampede stays cheap on
// a Quest. The worlds are the same idea at scale: one merged mesh of scenery
// and one painted sky sphere each.
//
// Frames: a target faces -z (skeet.js turns it along its path or towards the
// shooter). A world is built in the gallery frame: x = u (shooter's right),
// y = h (up from the roof deck), z = -f (downrange is -z).

export const GROUND = -2; // m, the worlds' ground below the roof deck (as laid out)

// Jay, 2026-10-20: the foreground was too close and too low to shoot. Every
// world is laid out as before, then moved SHIFT m further from the roof and
// lifted: 1.5 m everywhere, and rising 4 cm a metre beyond that (to f = 70),
// so the land slopes gently up away from you. A strip of ground fills the gap
// back to the wall. Scenery is warped vertex by vertex in buildWorld; plates
// (plates.js) and the movers' paths (shoots.js) go through the same lift.
export const SHIFT = 9;
// Jay, same day: "spread them out left and right by 50% so the arc is wider".
// The plates (plates.js) and their cover here (addCover) sit SPREAD times
// further to the side than laid out; the buildings' windows don't move.
export const SPREAD = 1.5;
export const lift = f => 1.5 + 0.04 * Math.min(61, Math.max(0, f - SHIFT));
// The ground's height at distance f (after the move).
export const groundAt = f => GROUND + lift(f);

// The saloon (Jay, 2026-10-22): the one world you shoot inside, walls left and
// right so nothing is outside. As laid out (before SHIFT), h up from its floor:
//   W     its side walls' inner faces at u = +-W
//   FRONT the walls and ceiling start here (just behind the roof's south edge)
//   BACK  the back wall's face; the upstairs rooms' doors are in it
//   BAL   the balcony's floor; BALF its front edge, where the stairs come up
//   SU    the stairs' middle at u = +-SU, rising from their foot at S0
//   BAR   the bar's front, BARH its top; the back bar's bottles under the balcony
//   CEIL  the ceiling
export const SALOON = {
  W: 15.85,
  FRONT: -11,
  BACK: 29.35,
  BAL: 4.4,
  BALF: 26.6,
  SU: 14.6,
  SW: 2.4,
  S0: 17,
  BAR: 22,
  BARH: 1.21,
  CEIL: 9.6,
  UP_DOORS: [-11.5, -7, -2.3, 2.3, 7, 11.5],
  DOWN_DOORS: [-10, 10],
  TABLES: [-9, -3.2, 3.2, 9], // round tables at f 7
  COVER: [-11.5, -6, 6, 11.5] // overturned tables at f 4 (clear of the tables behind)
};

const LIGHT = new THREE.Vector3(0.35, 0.85, 0.4).normalize();
const VIEW = new THREE.Vector3(0, 0.3, 1).normalize();
const HALF = new THREE.Vector3().addVectors(LIGHT, VIEW).normalize();
const col = new THREE.Color();
const tmp = new THREE.Color();

// Bake simple lighting (and a balloon shine when gloss > 0) into a colour
// attribute. Optional fog: mix towards fogHex with distance from the origin.
function bake(geo, hex, gloss = 0, fog = null) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const n = pos.count;
  const c = new Float32Array(n * 3);
  const base = new THREE.Color(hex).convertSRGBToLinear();
  const nv = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    nv.fromBufferAttribute(nor, i);
    const d = Math.max(0, nv.dot(LIGHT));
    col.copy(base).multiplyScalar(0.5 + 0.62 * d);
    if (gloss) {
      const s = Math.pow(Math.max(0, nv.dot(HALF)), 24) * gloss;
      col.r += s;
      col.g += s;
      col.b += s;
    }
    if (fog) {
      const dist = Math.hypot(pos.getX(i), pos.getZ(i));
      const k = THREE.MathUtils.clamp((dist - fog.near) / (fog.far - fog.near), 0, 1) * fog.max;
      col.lerp(tmp.copy(fog.color), k);
    }
    c[i * 3] = col.r;
    c[i * 3 + 1] = col.g;
    c[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(c, 3));
  return geo;
}

const m4 = new THREE.Matrix4();
const qq = new THREE.Quaternion();
const ee = new THREE.Euler();
const pp = new THREE.Vector3();
const ss = new THREE.Vector3();

// One coloured part, placed: (geometry, colour, position, rotation, scale).
export function part(geo, hex, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, gloss = 0) {
  const g = geo;
  m4.compose(pp.set(x, y, z), qq.setFromEuler(ee.set(rx, ry, rz)), ss.set(sx, sy, sz));
  g.applyMatrix4(m4);
  g.deleteAttribute("uv");
  return { geo: g, hex, gloss };
}

export function merge(parts, fog = null) {
  const geos = parts.map(p => bake(p.geo, p.hex, p.gloss, fog));
  const out = mergeBufferGeometries(geos, false);
  geos.forEach(g => g.dispose());
  out.computeBoundingSphere();
  out.userData.shared = true;
  return out;
}

export const BOX = (x, y, z) => new THREE.BoxGeometry(x, y, z);
export const CYL = (r0, r1, h, n = 10) => new THREE.CylinderGeometry(r0, r1, h, n);
export const BALL = (r, n = 10) => new THREE.SphereGeometry(r, n, Math.max(5, n >> 1));
export const CAP = (r, len, n = 8) => new THREE.CapsuleGeometry(r, len, 3, n);
export const CONE = (r, h, n = 8) => new THREE.ConeGeometry(r, h, n);
export const TORUS = (r, t, n = 14) => new THREE.TorusGeometry(r, t, 5, n);
// A box long in f, cut every 2 m so the lift (buildWorld) bends it with the land.
export const SLAB = (x, y, z) => new THREE.BoxGeometry(x, y, z, 1, 1, Math.max(1, Math.ceil(z / 2)));

let BASIC = null;
export function targetMaterial() {
  if (!BASIC) BASIC = new THREE.MeshBasicMaterial({ vertexColors: true });
  return BASIC;
}
function solid(geo) {
  const m = new THREE.Mesh(geo, targetMaterial());
  m.frustumCulled = false;
  return m;
}

// ---- Birds ---------------------------------------------------------------

// A bird: body, head, beak (one mesh) and two wings that flap. o: colours,
// s (size), tail ("fan" for a peacock, "long" for a pheasant), crest.
function birdGeo(o) {
  const s = o.s;
  const P = [];
  P.push(part(BALL(0.13 * s, 10), o.body, 0, 0, 0, 0, 0, 0, 1, 0.85, 1.75, o.gloss || 0.25));
  P.push(part(BALL(0.075 * s, 8), o.head, 0, 0.1 * s, -0.24 * s, 0, 0, 0, 1, 1, 1, 0.25));
  P.push(part(CONE(0.03 * s, 0.1 * s, 6), o.beak, 0, 0.09 * s, -0.33 * s, -Math.PI / 2));
  if (o.tail === "fan") {
    for (let k = -3; k <= 3; k++)
      P.push(
        part(
          BOX(0.06 * s, 0.5 * s, 0.01),
          k % 2 ? o.wing : o.accent || o.wing,
          k * 0.07 * s,
          0.25 * s,
          0.26 * s,
          0.3,
          0,
          -k * 0.2
        )
      );
  } else if (o.tail === "long") {
    P.push(part(BOX(0.04 * s, 0.015, 0.45 * s), o.accent || o.wing, 0, 0.02, 0.38 * s, -0.15));
  } else {
    P.push(part(BOX(0.12 * s, 0.015, 0.14 * s), o.wing, 0, 0.02, 0.24 * s, -0.2));
  }
  if (o.crest) P.push(part(CONE(0.025 * s, 0.09 * s, 5), o.crest, 0, 0.19 * s, -0.24 * s));
  if (o.ring) P.push(part(TORUS(0.06 * s, 0.012 * s, 10), o.ring, 0, 0.05 * s, -0.17 * s, Math.PI / 2.4));
  return merge(P);
}
function wingGeo(o, side) {
  const s = o.s;
  const w = o.span || 1;
  const P = [part(BOX(0.34 * s * w, 0.015, 0.16 * s), o.wing, side * 0.17 * s * w, 0, 0)];
  if (o.tip) P.push(part(BOX(0.1 * s * w, 0.016, 0.15 * s), o.tip, side * 0.3 * s * w, 0, 0.005));
  return merge(P);
}

// ---- Balloon animals -------------------------------------------------------

// Stiff-legged and shiny, like the twisted-balloon kind. o: colour, s (size),
// legs (length), neck, plus mane / antlers / tusks / horns / ears / snout.
function quadGeo(o) {
  const s = o.s;
  const G = 0.9; // gloss
  const L = (o.legs || 0.45) * s;
  const r = 0.12 * s;
  const P = [];
  const bodyLen = (o.long || 0.5) * s;
  P.push(part(CAP(r * (o.fat || 1), bodyLen, 10), o.body, 0, L + r, 0, Math.PI / 2, 0, 0, 1, 1, 1, G));
  for (const [x, z] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ])
    P.push(
      part(
        CAP(0.045 * s, L, 6),
        o.leg || o.body,
        x * r * 0.7,
        L / 2 + 0.02 * s,
        z * bodyLen * 0.42,
        0,
        0,
        0,
        1,
        1,
        1,
        G
      )
    );
  const neck = (o.neck || 0.15) * s;
  const hy = L + r + neck;
  const hz = -bodyLen / 2 - r * 0.8;
  if (neck > 0.05 * s)
    P.push(part(CAP(0.05 * s, neck, 6), o.body, 0, L + r + neck / 2, hz + 0.04 * s, -0.4, 0, 0, 1, 1, 1, G));
  P.push(part(BALL(0.1 * s * (o.head || 1), 10), o.headCol || o.body, 0, hy, hz, 0, 0, 0, 1, 1, 1, G));
  if (o.snout)
    P.push(part(CAP(0.05 * s, 0.1 * s, 6), o.snout, 0, hy - 0.04 * s, hz - 0.11 * s, Math.PI / 2, 0, 0, 1, 1, 1, G));
  if (o.mane) P.push(part(TORUS(0.11 * s, 0.06 * s, 12), o.mane, 0, hy, hz + 0.02 * s, 0, 0, 0, 1, 1, 1, G));
  if (o.ears)
    for (const x of [-1, 1])
      P.push(part(BALL(0.04 * s, 6), o.ears, x * 0.07 * s, hy + 0.09 * s, hz + 0.02 * s, 0, 0, 0, 0.7, 1.3, 0.5, G));
  if (o.antlers)
    for (const x of [-1, 1]) {
      P.push(part(CYL(0.012 * s, 0.016 * s, 0.32 * s, 5), o.antlers, x * 0.1 * s, hy + 0.2 * s, hz, 0, 0, -x * 0.5));
      P.push(
        part(
          CYL(0.01 * s, 0.012 * s, 0.16 * s, 5),
          o.antlers,
          x * 0.2 * s,
          hy + 0.3 * s,
          hz - 0.05 * s,
          0.4,
          0,
          -x * 1.1
        )
      );
      P.push(
        part(
          CYL(0.01 * s, 0.012 * s, 0.15 * s, 5),
          o.antlers,
          x * 0.13 * s,
          hy + 0.36 * s,
          hz + 0.05 * s,
          -0.5,
          0,
          -x * 0.2
        )
      );
    }
  if (o.horns)
    for (const x of [-1, 1])
      P.push(
        part(CONE(0.018 * s, 0.32 * s, 5), o.horns, x * 0.05 * s, hy + 0.2 * s, hz + 0.05 * s, 0.35, 0, -x * 0.15)
      );
  if (o.tusks)
    for (const x of [-1, 1])
      P.push(part(CONE(0.015 * s, 0.09 * s, 5), o.tusks, x * 0.05 * s, hy - 0.03 * s, hz - 0.15 * s, -1.1, 0, 0));
  if (o.eyes !== false)
    for (const x of [-1, 1]) P.push(part(BALL(0.018 * s, 6), 0x111111, x * 0.06 * s, hy + 0.03 * s, hz - 0.085 * s));
  P.push(
    part(
      CAP(0.03 * s, (o.tail || 0.18) * s, 5),
      o.tailCol || o.body,
      0,
      L + r + 0.05 * s,
      bodyLen / 2 + r + 0.05 * s,
      1.0,
      0,
      0,
      1,
      1,
      1,
      G
    )
  );
  if (o.tuft) P.push(part(BALL(0.05 * s, 6), o.tuft, 0, L + r + 0.12 * s, bodyLen / 2 + r + 0.13 * s));
  if (o.stripes)
    for (let k = -2; k <= 2; k++)
      P.push(part(TORUS(r * 1.02, 0.012 * s, 12), o.stripes, 0, L + r, k * bodyLen * 0.18, 0, 0, 0, 1, 1, 1, 0));
  return merge(P);
}

// ---- Things ------------------------------------------------------------------

function balloonGeo(hex, s = 1) {
  return merge([
    part(BALL(0.2 * s, 12), hex, 0, 0, 0, 0, 0, 0, 1, 1.2, 1, 1.2),
    part(CONE(0.03 * s, 0.05 * s, 6), hex, 0, -0.25 * s, 0, Math.PI),
    part(CYL(0.003, 0.003, 0.5 * s, 3), 0xeeeeee, 0, -0.52 * s, 0)
  ]);
}
export const GEO = {
  balloon: c => balloonGeo(c),
  bigBalloon: c => balloonGeo(c, 2.2),
  star: () => {
    const P = [];
    for (let k = 0; k < 5; k++)
      P.push(part(CONE(0.09, 0.32, 4), 0xffd23a, 0, 0, 0, 0, 0, (k * 2 * Math.PI) / 5, 1, 1, 0.35, 0.9));
    P.push(part(CYL(0.12, 0.12, 0.08, 10), 0xffe27a, 0, 0, 0, Math.PI / 2, 0, 0, 1, 1, 1, 0.9));
    return merge(P);
  },
  gold: () =>
    merge([
      part(TORUS(0.22, 0.06, 16), 0xffc93c, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1.4),
      part(BALL(0.1, 10), 0xfff1a8, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1.4)
    ]),
  coconut: () =>
    merge([
      part(BALL(0.17, 9), 0x6b4423, 0, 0, 0, 0, 0, 0, 1, 1.1, 1, 0.2),
      part(BALL(0.03, 5), 0x2a1a0c, 0, 0.05, -0.15)
    ]),
  apple: () =>
    merge([
      part(BALL(0.1, 9), 0xd92a2a, 0, 0, 0, 0, 0, 0, 1, 0.9, 1, 0.8),
      part(CYL(0.008, 0.008, 0.06, 4), 0x4a2a10, 0, 0.1, 0),
      part(BOX(0.06, 0.005, 0.03), 0x3aa34a, 0.03, 0.11, 0, 0, 0, 0.4)
    ]),
  turnip: () =>
    merge([
      part(BALL(0.14, 9), 0xeee4f2, 0, 0, 0, 0, 0, 0, 1, 0.9, 1, 0.4),
      part(BALL(0.14, 9), 0x8a3aa8, 0, 0.05, 0, 0, 0, 0, 1.02, 0.55, 1.02, 0.4),
      part(CONE(0.03, 0.12, 5), 0xeee4f2, 0, -0.16, 0, Math.PI),
      part(BOX(0.05, 0.22, 0.01), 0x3aa34a, -0.04, 0.22, 0, 0, 0, 0.3),
      part(BOX(0.05, 0.25, 0.01), 0x2f8a3a, 0.04, 0.23, 0, 0, 0, -0.3)
    ]),
  glass: () =>
    merge([
      part(CONE(0.08, 0.14, 10), 0xf6e7a6, 0, 0.15, 0, Math.PI, 0, 0, 1, 1, 1, 1.2),
      part(CYL(0.008, 0.008, 0.14, 5), 0xe8f4ff, 0, 0.02, 0, 0, 0, 0, 1, 1, 1, 1),
      part(CYL(0.06, 0.06, 0.01, 10), 0xe8f4ff, 0, -0.05, 0)
    ]),
  chip: hex => {
    const P = [part(CYL(0.16, 0.16, 0.04, 16), hex, 0, 0, 0, Math.PI / 2, 0, 0, 1, 1, 1, 0.5)];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      P.push(part(BOX(0.05, 0.03, 0.045), 0xffffff, Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0, 0, 0, a));
    }
    P.push(part(CYL(0.08, 0.08, 0.045, 12), 0xffffff, 0, 0, 0, Math.PI / 2));
    return merge(P);
  },
  card: hex =>
    merge([
      part(BOX(0.36, 0.5, 0.01), 0xfbfbf4),
      part(BOX(0.12, 0.12, 0.012), hex, 0, 0, 0, 0, 0, Math.PI / 4),
      part(BOX(0.05, 0.05, 0.012), hex, -0.12, 0.18, 0, 0, 0, Math.PI / 4),
      part(BOX(0.05, 0.05, 0.012), hex, 0.12, -0.18, 0, 0, 0, Math.PI / 4)
    ]),
  decoy: () =>
    merge([
      part(BALL(0.2, 10), 0x6b4a2e, 0, 0, 0, 0, 0, 0, 1, 0.6, 1.7, 0.3),
      part(BALL(0.11, 9), 0x1f6b3a, 0, 0.16, -0.3, 0, 0, 0, 1, 1, 1, 0.5),
      part(BOX(0.08, 0.03, 0.12), 0xf2b52a, 0, 0.14, -0.43),
      part(BOX(0.36, 0.02, 0.06), 0xffffff, 0, 0.1, -0.12)
    ]),
  drone: () => {
    const P = [
      part(BOX(0.24, 0.08, 0.24), 0x2b2d31, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.6),
      part(BALL(0.04, 6), 0xff3030, 0, -0.05, -0.1)
    ];
    for (const [x, z] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ]) {
      P.push(part(BOX(0.2, 0.025, 0.025), 0x1a1a1a, x * 0.12, 0.02, z * 0.12, 0, (x * z * Math.PI) / 4));
      P.push(part(CYL(0.11, 0.11, 0.01, 12), 0x9aa4b0, x * 0.2, 0.06, z * 0.2));
    }
    return merge(P);
  },
  heli: () =>
    merge([
      part(CAP(0.45, 0.9, 10), 0x2f3a2a, 0, 0, 0, Math.PI / 2, 0, 0, 1, 1, 1, 0.5),
      part(BALL(0.38, 10), 0x9fd6ff, 0, 0.05, -0.75, 0, 0, 0, 1, 0.8, 0.9, 1),
      part(CYL(0.09, 0.05, 2.2, 6), 0x2f3a2a, 0, 0.2, 1.7, Math.PI / 2),
      part(BOX(0.04, 0.5, 0.3), 0x2f3a2a, 0, 0.45, 2.75),
      part(CYL(2.0, 2.0, 0.02, 20), 0x55595e, 0, 0.62, 0),
      part(CYL(0.05, 0.05, 0.2, 5), 0x111111, 0, 0.52, 0),
      part(BOX(0.06, 0.06, 1.6), 0x111111, -0.35, -0.55, 0),
      part(BOX(0.06, 0.06, 1.6), 0x111111, 0.35, -0.55, 0)
    ]),
  cannonman: () =>
    merge([
      part(CAP(0.17, 0.6, 8), 0xe8344a, 0, 0, 0, Math.PI / 2, 0, 0, 1, 1, 1, 0.8),
      part(BALL(0.15, 9), 0xf2d7b6, 0, 0.05, -0.5),
      part(BALL(0.16, 9), 0xf2c230, 0, 0.11, -0.52, 0, 0, 0, 1, 0.7, 1, 1.2),
      part(CAP(0.06, 0.4, 6), 0xe8344a, -0.22, 0.05, -0.3, 1.3, 0, 0.3),
      part(CAP(0.06, 0.4, 6), 0xe8344a, 0.22, 0.05, -0.3, 1.3, 0, -0.3),
      part(CAP(0.07, 0.5, 6), 0x2f6fe8, -0.1, -0.05, 0.6, Math.PI / 2),
      part(CAP(0.07, 0.5, 6), 0x2f6fe8, 0.1, -0.05, 0.6, Math.PI / 2)
    ]),
  hat: () =>
    merge([
      part(CYL(0.1, 0.105, 0.2, 14), 0x111111, 0, 0.1, 0),
      part(CYL(0.17, 0.17, 0.012, 16), 0x111111),
      part(CYL(0.106, 0.106, 0.035, 14), 0xb3122a, 0, 0.03, 0)
    ]),
  // (the saloon's: standing on their bases at the origin)
  whiskey: () =>
    merge([
      part(CYL(0.045, 0.045, 0.19, 10), 0x8a4a1a, 0, 0.095, 0, 0, 0, 0, 1, 1, 1, 1.2),
      part(CYL(0.046, 0.046, 0.07, 10), 0xf4e4c0, 0, 0.09, 0),
      part(CONE(0.045, 0.05, 10), 0x8a4a1a, 0, 0.215, 0, 0, 0, 0, 1, 1, 1, 1.2),
      part(CYL(0.014, 0.016, 0.08, 6), 0x6a3a14, 0, 0.27, 0, 0, 0, 0, 1, 1, 1, 1.2),
      part(CYL(0.016, 0.016, 0.02, 6), 0xc8a070, 0, 0.315, 0)
    ]),
  mug: () =>
    merge([
      part(CYL(0.055, 0.05, 0.13, 10), 0xe8a838, 0, 0.065, 0, 0, 0, 0, 1, 1, 1, 1.2),
      part(CYL(0.058, 0.058, 0.03, 10), 0xfff8e0, 0, 0.14, 0),
      part(TORUS(0.035, 0.01, 8), 0xd8e8e8, 0.065, 0.07, 0)
    ]),
  // (pale, so it shows against the dark ceiling)
  stetson: () =>
    merge([
      part(CYL(0.24, 0.24, 0.015, 16), 0xe8dcc0, 0, 0, 0, 0, 0, 0, 1, 1, 1.25),
      part(CYL(0.105, 0.12, 0.13, 12), 0xe8dcc0, 0, 0.07, 0, 0, 0, 0, 1, 1, 1.2),
      part(BOX(0.04, 0.03, 0.22), 0xc8b890, 0, 0.13, 0),
      part(CYL(0.112, 0.112, 0.025, 12), 0x2a1a10, 0, 0.02, 0, 0, 0, 0, 1, 1, 1.2)
    ])
};

// ---- Painted cut-outs ------------------------------------------------------

// A cut-out: a painted card on a post, front facing -z. draw(ctx, w, h) on a
// 256-wide canvas; the card is w x h metres.
const cardCache = new Map();
function cardMesh(key, w, h, draw) {
  let c = cardCache.get(key);
  if (!c) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = Math.round((256 * h) / w);
    const ctx = canvas.getContext("2d");
    draw(ctx, canvas.width, canvas.height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(w, h);
    geo.rotateY(Math.PI); // front to -z
    geo.userData.shared = true;
    const post = merge([part(BOX(0.05, 0.9, 0.05), 0x3a2a1a, 0, -h / 2 - 0.45 + 0.05, 0.03)]);
    c = { mat, geo, post };
    cardCache.set(key, c);
  }
  const g = new THREE.Group();
  const card = new THREE.Mesh(c.geo, c.mat);
  card.frustumCulled = false;
  g.add(card);
  g.add(solid(c.post));
  return g;
}

export function person(ctx, W, H, o) {
  // A figure filling the card: head, body, arms, legs, painted flat.
  const cx = W / 2;
  const u = W / 10;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const outline = () => {
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#111";
    ctx.stroke();
  };
  // legs
  if (!o.dress) {
    ctx.fillStyle = o.legs;
    ctx.beginPath();
    ctx.rect(cx - 2.2 * u, H * 0.62, 1.8 * u, H * 0.36);
    ctx.rect(cx + 0.4 * u, H * 0.62, 1.8 * u, H * 0.36);
    ctx.fill();
    outline();
  }
  // body
  ctx.fillStyle = o.body;
  ctx.beginPath();
  ctx.moveTo(cx - 3 * u, H * 0.3);
  ctx.lineTo(cx + 3 * u, H * 0.3);
  ctx.lineTo(cx + 2.6 * u, H * 0.66);
  ctx.lineTo(cx - 2.6 * u, H * 0.66);
  ctx.closePath();
  ctx.fill();
  outline();
  if (o.shirt) {
    ctx.fillStyle = o.shirt;
    ctx.beginPath();
    ctx.moveTo(cx - 0.9 * u, H * 0.3);
    ctx.lineTo(cx + 0.9 * u, H * 0.3);
    ctx.lineTo(cx, H * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  if (o.tie) {
    ctx.fillStyle = o.tie;
    ctx.fillRect(cx - 0.3 * u, H * 0.31, 0.6 * u, H * 0.16);
  }
  if (o.vest) {
    ctx.fillStyle = o.vest;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * 3 * u, H * 0.3);
      ctx.lineTo(cx + s * 0.8 * u, H * 0.3);
      ctx.lineTo(cx + s * 0.5 * u, H * 0.6);
      ctx.lineTo(cx + s * 2.65 * u, H * 0.64);
      ctx.closePath();
      ctx.fill();
      outline();
    }
  }
  if (o.poncho) {
    // a striped serape from the shoulders
    ctx.fillStyle = o.poncho;
    ctx.beginPath();
    ctx.moveTo(cx - 3.3 * u, H * 0.29);
    ctx.lineTo(cx + 3.3 * u, H * 0.29);
    ctx.lineTo(cx + 3.9 * u, H * 0.56);
    ctx.lineTo(cx - 3.9 * u, H * 0.56);
    ctx.closePath();
    ctx.fill();
    outline();
    for (const [k, c] of [
      [0.36, o.stripe || "#f2c230"],
      [0.42, o.stripe2 || "#2f8a5a"],
      [0.48, o.stripe || "#f2c230"]
    ]) {
      ctx.fillStyle = c;
      ctx.fillRect(cx - 3.55 * u, H * k, 7.1 * u, H * 0.022);
    }
  }
  if (o.bandolier) {
    // two belts of cartridges crossed over the chest
    ctx.lineCap = "butt";
    for (const s of [-1, 1]) {
      ctx.strokeStyle = o.bandolier;
      ctx.lineWidth = 0.8 * u;
      ctx.beginPath();
      ctx.moveTo(cx + s * 2.5 * u, H * 0.3);
      ctx.lineTo(cx - s * 2.2 * u, H * 0.6);
      ctx.stroke();
      ctx.fillStyle = "#e8c050";
      for (let k = 1; k < 7; k++) {
        const t = k / 7;
        ctx.fillRect(cx + s * 2.5 * u - s * 4.7 * u * t - 0.12 * u, H * (0.3 + 0.3 * t) - 0.3 * u, 0.24 * u, 0.6 * u);
      }
    }
    ctx.lineCap = "round";
  }
  if (o.collar) {
    ctx.fillStyle = o.collar;
    ctx.fillRect(cx - 0.7 * u, H * 0.29, 1.4 * u, H * 0.025);
  }
  if (o.badge) {
    // a star on the chest
    ctx.fillStyle = o.badge;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const r = (k % 2 ? 0.35 : 0.8) * u;
      ctx.lineTo(cx - 1.4 * u + Math.cos(a) * r, H * 0.38 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }
  if (o.apron) {
    ctx.fillStyle = o.apron;
    ctx.beginPath();
    ctx.rect(cx - 2.4 * u, H * 0.5, 4.8 * u, H * 0.4);
    ctx.fill();
    outline();
  }
  if (o.belt) {
    ctx.fillStyle = o.belt;
    ctx.fillRect(cx - 2.7 * u, H * 0.585, 5.4 * u, H * 0.035);
    ctx.fillRect(cx + 2.1 * u, H * 0.6, 0.9 * u, H * 0.11); // holster
    ctx.fillStyle = "#e8c050";
    ctx.fillRect(cx - 0.4 * u, H * 0.585, 0.8 * u, H * 0.035);
  }
  if (o.dress) {
    // a flared skirt to the floor, a band of trim at the hem
    ctx.fillStyle = o.dress;
    ctx.beginPath();
    ctx.moveTo(cx - 2.5 * u, H * 0.55);
    ctx.lineTo(cx + 2.5 * u, H * 0.55);
    ctx.lineTo(cx + 4.3 * u, H * 0.975);
    ctx.lineTo(cx - 4.3 * u, H * 0.975);
    ctx.closePath();
    ctx.fill();
    outline();
    if (o.trim) {
      ctx.fillStyle = o.trim;
      ctx.fillRect(cx - 4.1 * u, H * 0.925, 8.2 * u, H * 0.035);
    }
  }
  // arms
  ctx.strokeStyle = o.arms || o.body;
  ctx.lineWidth = 1.5 * u;
  ctx.beginPath();
  if (o.armsUp) {
    ctx.moveTo(cx - 2.8 * u, H * 0.33);
    ctx.lineTo(cx - 4 * u, H * 0.08);
    ctx.moveTo(cx + 2.8 * u, H * 0.33);
    ctx.lineTo(cx + 4 * u, H * 0.08);
  } else {
    ctx.moveTo(cx - 2.8 * u, H * 0.33);
    if (o.guns2) ctx.lineTo(cx - 4.2 * u, H * 0.36);
    else if (o.hips) (ctx.lineTo(cx - 4 * u, H * 0.45), ctx.lineTo(cx - 2.6 * u, H * 0.55));
    else ctx.lineTo(cx - 3.6 * u, H * 0.6);
    ctx.moveTo(cx + 2.8 * u, H * 0.33);
    if (o.hips && !o.gun) (ctx.lineTo(cx + 4 * u, H * 0.45), ctx.lineTo(cx + 2.6 * u, H * 0.55));
    else ctx.lineTo(cx + (o.gun ? 4.6 : 3.6) * u, H * (o.gun ? 0.36 : 0.6));
  }
  ctx.stroke();
  if (o.gun) {
    ctx.fillStyle = "#222";
    ctx.fillRect(cx + 4 * u, H * 0.31, 1.6 * u, 0.6 * u);
  }
  if (o.guns2) {
    ctx.fillStyle = "#222";
    ctx.fillRect(cx - 5 * u, H * 0.31, 1.2 * u, 0.6 * u);
  }
  // head
  ctx.fillStyle = o.skin || "#f0c9a0";
  ctx.beginPath();
  ctx.arc(cx, H * 0.17, 1.9 * u, 0, Math.PI * 2);
  ctx.fill();
  outline();
  if (o.mask) {
    ctx.fillStyle = o.mask;
    ctx.beginPath();
    ctx.arc(cx, H * 0.17, 1.9 * u, Math.PI * 1.05, Math.PI * 1.95, false);
    ctx.lineTo(cx + 1.9 * u, H * 0.22);
    ctx.lineTo(cx - 1.9 * u, H * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - 1.9 * u, H * 0.19, 3.8 * u, 0.8 * u);
  }
  if (o.hair) {
    ctx.fillStyle = o.hair;
    ctx.beginPath();
    ctx.arc(cx, H * 0.15, 1.95 * u, Math.PI, Math.PI * 2);
    ctx.fill();
    if (o.longHair)
      (ctx.fillRect(cx - 2.1 * u, H * 0.15, 0.9 * u, H * 0.16),
        ctx.fillRect(cx + 1.2 * u, H * 0.15, 0.9 * u, H * 0.16));
  }
  if (o.feather) {
    ctx.fillStyle = o.feather;
    ctx.beginPath();
    ctx.ellipse(cx + 1.5 * u, H * 0.06, 0.5 * u, H * 0.06, 0.45, 0, Math.PI * 2);
    ctx.fill();
    outline();
  }
  if (o.hat && o.sombrero) {
    // a sombrero: a tall peaked crown and a brim out past the shoulders
    ctx.fillStyle = o.hat;
    ctx.beginPath();
    ctx.moveTo(cx - 1.6 * u, H * 0.095);
    ctx.quadraticCurveTo(cx - 1.4 * u, H * 0.0, cx, H * 0.002);
    ctx.quadraticCurveTo(cx + 1.4 * u, H * 0.0, cx + 1.6 * u, H * 0.095);
    ctx.closePath();
    ctx.fill();
    outline();
    ctx.beginPath();
    ctx.ellipse(cx, H * 0.1, 4.7 * u, H * 0.026, 0, 0, Math.PI * 2);
    ctx.fill();
    outline();
    ctx.fillStyle = o.hatBand || "#c0182a";
    ctx.fillRect(cx - 1.55 * u, H * 0.075, 3.1 * u, H * 0.014);
  } else if (o.hat && o.stetson) {
    // a cowboy hat: dented crown, wide brim
    ctx.fillStyle = o.hat;
    ctx.beginPath();
    ctx.moveTo(cx - 1.75 * u, H * 0.092);
    ctx.lineTo(cx - 1.5 * u, H * 0.026);
    ctx.lineTo(cx - 0.6 * u, H * 0.012);
    ctx.lineTo(cx, H * 0.03);
    ctx.lineTo(cx + 0.6 * u, H * 0.012);
    ctx.lineTo(cx + 1.5 * u, H * 0.026);
    ctx.lineTo(cx + 1.75 * u, H * 0.092);
    ctx.closePath();
    ctx.fill();
    outline();
    ctx.beginPath();
    ctx.ellipse(cx, H * 0.094, 3.4 * u, H * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
    outline();
    ctx.fillStyle = "#1a120c";
    ctx.fillRect(cx - 1.7 * u, H * 0.074, 3.4 * u, H * 0.012);
  } else if (o.hat) {
    ctx.fillStyle = o.hat;
    ctx.fillRect(cx - 2.6 * u, H * 0.075, 5.2 * u, 0.6 * u);
    ctx.fillRect(cx - 1.5 * u, H * (o.topHat ? -0.02 : 0.02), 3 * u, H * (o.topHat ? 0.1 : 0.06));
  }
  ctx.fillStyle = "#111";
  if (o.shades) ctx.fillRect(cx - 1.5 * u, H * 0.15, 3 * u, 0.7 * u);
  else {
    ctx.beginPath();
    ctx.arc(cx - 0.7 * u, H * 0.165, 0.25 * u, 0, Math.PI * 2);
    ctx.arc(cx + 0.7 * u, H * 0.165, 0.25 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  if (o.tache) {
    ctx.fillStyle = o.hair || "#3a2414";
    ctx.beginPath();
    ctx.ellipse(cx - 0.5 * u, H * 0.205, 0.7 * u, 0.22 * u, -0.25, 0, Math.PI * 2);
    ctx.ellipse(cx + 0.5 * u, H * 0.205, 0.7 * u, 0.22 * u, 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  if (o.bandana) {
    // round the neck, or pulled up over the face (masked)
    const top = o.masked ? 0.188 : 0.235;
    ctx.fillStyle = o.bandana;
    ctx.beginPath();
    ctx.moveTo(cx - 1.95 * u, H * top);
    ctx.lineTo(cx + 1.95 * u, H * top);
    ctx.lineTo(cx + 1.7 * u, H * (top + 0.03));
    ctx.lineTo(cx, H * (top + 0.07));
    ctx.lineTo(cx - 1.7 * u, H * (top + 0.03));
    ctx.closePath();
    ctx.fill();
    outline();
  }
  if (o.lips) {
    ctx.fillStyle = o.lips;
    ctx.beginPath();
    ctx.ellipse(cx, H * 0.215, 0.5 * u, 0.2 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (o.face === "white") {
    ctx.fillStyle = "#c0182a";
    ctx.fillRect(cx - 0.5 * u, H * 0.215, u, 0.3 * u);
  }
  if (o.gag) {
    ctx.fillStyle = "#eee";
    ctx.fillRect(cx - 1.8 * u, H * 0.205, 3.6 * u, 0.6 * u);
  }
  if (o.stripes) {
    ctx.fillStyle = "#f4f1ea";
    for (let k = 0; k < 4; k++) ctx.fillRect(cx - 2.8 * u, H * (0.35 + k * 0.075), 5.6 * u, H * 0.03);
  }
}

export function target(ctx, W, H, label, ring = "#e8344a") {
  for (let k = 5; k > 0; k--) {
    ctx.fillStyle = k % 2 ? ring : "#fbfbf4";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, (W / 2 - 4) * (k / 5), 0, Math.PI * 2);
    ctx.fill();
  }
  if (label) {
    ctx.fillStyle = "#111";
    ctx.font = `900 ${Math.round(W * 0.4)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#fff";
    ctx.strokeText(label, W / 2, H / 2 + 4);
    ctx.fillText(label, W / 2, H / 2 + 4);
  }
}

export function silhouette(ctx, W, H, kind, fill) {
  // A tin-sign animal in profile, facing left.
  ctx.fillStyle = fill;
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 6;
  ctx.beginPath();
  if (kind === "duck") {
    ctx.ellipse(W * 0.55, H * 0.62, W * 0.32, H * 0.22, 0, 0, Math.PI * 2);
    ctx.moveTo(W * 0.38, H * 0.35);
    ctx.arc(W * 0.3, H * 0.35, W * 0.13, 0, Math.PI * 2);
  } else {
    // a four-legged animal: deer / zebra / elephant-ish by proportions
    const neck = kind === "giraffe" ? 0.45 : kind === "deer" ? 0.28 : 0.12;
    ctx.ellipse(W * 0.55, H * 0.45, W * 0.3, H * 0.16, 0, 0, Math.PI * 2);
    ctx.rect(W * 0.3, H * 0.5, W * 0.07, H * 0.42);
    ctx.rect(W * 0.72, H * 0.5, W * 0.07, H * 0.42);
    ctx.moveTo(W * 0.3, H * 0.4);
    ctx.lineTo(W * 0.2, H * (0.4 - neck));
    ctx.lineTo(W * 0.28, H * (0.38 - neck));
    ctx.lineTo(W * 0.38, H * 0.36);
    ctx.moveTo(W * 0.26, H * (0.4 - neck));
    ctx.arc(W * 0.17, H * (0.42 - neck), W * 0.09, 0, Math.PI * 2);
    if (kind === "deer") {
      ctx.moveTo(W * 0.15, H * (0.32 - neck));
      ctx.lineTo(W * 0.1, H * (0.12 - neck));
      ctx.moveTo(W * 0.2, H * (0.32 - neck));
      ctx.lineTo(W * 0.27, H * (0.12 - neck));
    }
  }
  ctx.fill();
  ctx.stroke();
}

export const CARDS = {
  clown: (c, W, H) => {
    target(c, W, H, "", "#2f6fe8");
    c.fillStyle = "#fbfbf4";
    c.beginPath();
    c.arc(W / 2, H / 2, W * 0.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#e8344a";
    c.beginPath();
    c.arc(W / 2, H * 0.53, W * 0.08, 0, Math.PI * 2);
    c.fill();
    c.fillRect(W * 0.35, H * 0.66, W * 0.3, H * 0.05);
    c.fillStyle = "#111";
    c.fillRect(W * 0.38, H * 0.4, W * 0.06, H * 0.06);
    c.fillRect(W * 0.56, H * 0.4, W * 0.06, H * 0.06);
    c.fillStyle = "#f2c230";
    c.beginPath();
    c.arc(W * 0.24, H * 0.36, W * 0.12, 0, Math.PI * 2);
    c.arc(W * 0.76, H * 0.36, W * 0.12, 0, Math.PI * 2);
    c.fill();
  },
  bull: (c, W, H) => target(c, W, H, ""),
  letterA: (c, W, H) => target(c, W, H, "A", "#3ab54a"),
  letterB: (c, W, H) => target(c, W, H, "B", "#2f6fe8"),
  letterC: (c, W, H) => target(c, W, H, "C", "#e8344a"),
  tinduck: (c, W, H) => silhouette(c, W, H, "duck", "#f2c230"),
  tindeer: (c, W, H) => silhouette(c, W, H, "deer", "#d8a24a"),
  tinzebra: (c, W, H) => silhouette(c, W, H, "zebra", "#e8e2d0"),
  tingiraffe: (c, W, H) => silhouette(c, W, H, "giraffe", "#f2b53a"),
  henchman: (c, W, H) =>
    person(c, W, H, {
      body: "#16181c",
      legs: "#16181c",
      shirt: "#fff",
      tie: "#111",
      shades: true,
      gun: true,
      hair: "#222"
    }),
  boss: (c, W, H) => person(c, W, H, { body: "#e8e2d0", legs: "#2a2a2a", shirt: "#333", gun: true, skin: "#e8c8a8" }),
  girl: (c, W, H) =>
    person(c, W, H, { body: "#c0182a", legs: "#c0182a", hair: "#f2c230", longHair: true, arms: "#f0c9a0" }),
  bad: (c, W, H) => person(c, W, H, { body: "#3a4a2a", legs: "#2a2a2a", mask: "#151515", gun: true }),
  hostage: (c, W, H) => person(c, W, H, { body: "#e8e8e8", legs: "#4a5a7a", hair: "#7a4a2a", gag: true, armsUp: true }),
  taker: (c, W, H) => {
    c.fillStyle = "#f0c9a0";
    c.beginPath();
    c.arc(W / 2, H / 2, W * 0.45, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#151515";
    c.beginPath();
    c.arc(W / 2, H / 2, W * 0.45, Math.PI * 1.05, Math.PI * 1.95);
    c.fill();
    c.fillRect(0, H * 0.48, W, H * 0.12);
    c.lineWidth = 8;
    c.strokeStyle = "#111";
    c.beginPath();
    c.arc(W / 2, H / 2, W * 0.45, 0, Math.PI * 2);
    c.stroke();
  },
  farmer: (c, W, H) =>
    person(c, W, H, { body: "#3a5aa8", legs: "#3a5aa8", shirt: "#c0182a", hat: "#d8b060", armsUp: true }),
  hiker: (c, W, H) => person(c, W, H, { body: "#e86a1a", legs: "#5a4a3a", hat: "#3a7a3a", armsUp: true }),
  ranger: (c, W, H) => person(c, W, H, { body: "#b8a070", legs: "#8a7450", hat: "#c8b080", armsUp: true }),
  dog: (c, W, H) => {
    c.fillStyle = "#8a5a2a";
    c.strokeStyle = "#111";
    c.lineWidth = 6;
    c.beginPath();
    c.ellipse(W / 2, H * 0.55, W * 0.3, H * 0.32, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = "#5a3a1a";
    c.beginPath();
    c.ellipse(W * 0.2, H * 0.45, W * 0.1, H * 0.25, 0.2, 0, Math.PI * 2);
    c.ellipse(W * 0.8, H * 0.45, W * 0.1, H * 0.25, -0.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#f2e2c8";
    c.beginPath();
    c.ellipse(W / 2, H * 0.7, W * 0.13, H * 0.1, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#111";
    c.beginPath();
    c.arc(W * 0.4, H * 0.48, W * 0.04, 0, Math.PI * 2);
    c.arc(W * 0.6, H * 0.48, W * 0.04, 0, Math.PI * 2);
    c.arc(W / 2, H * 0.64, W * 0.05, 0, Math.PI * 2);
    c.fill();
  },
  mime: (c, W, H) =>
    person(c, W, H, {
      body: "#151515",
      legs: "#151515",
      skin: "#f4f1ea",
      face: "white",
      stripes: true,
      hat: "#111",
      topHat: true,
      armsUp: true
    }),
  // the saloon
  cowboy: (c, W, H) =>
    person(c, W, H, {
      body: "#e8dcc0",
      vest: "#6a4224",
      legs: "#3a4a6a",
      hat: "#8a5a30",
      stetson: true,
      bandana: "#c0182a",
      hair: "#3a2414",
      tache: true,
      belt: "#2a1a10",
      gun: true
    }),
  gunslinger: (c, W, H) =>
    person(c, W, H, {
      body: "#3a3a3a",
      vest: "#7a1a1a",
      legs: "#2a2a2a",
      hat: "#151515",
      stetson: true,
      hair: "#151515",
      tache: true,
      belt: "#151515",
      gun: true,
      skin: "#d8a880"
    }),
  outlaw: (c, W, H) =>
    person(c, W, H, {
      body: "#1a1a1a",
      legs: "#1a1a1a",
      vest: "#2a2a2a",
      hat: "#0e0e0e",
      stetson: true,
      bandana: "#0e0e0e",
      masked: true,
      belt: "#3a2a1a",
      gun: true,
      guns2: true
    }),
  lady: (c, W, H) =>
    person(c, W, H, {
      body: "#9a1a5a",
      dress: "#b0206a",
      trim: "#f2c230",
      shirt: "#f0c9a0",
      arms: "#f0c9a0",
      hips: true,
      hair: "#2a1a10",
      longHair: true,
      feather: "#f2c230",
      lips: "#c0182a"
    }),
  barkeep: (c, W, H) =>
    person(c, W, H, {
      body: "#f4efe2",
      vest: "#2a2a2a",
      legs: "#2a2a2a",
      apron: "#fbfbf4",
      hair: "#3a2414",
      tache: true,
      hat: "#2a2a2a",
      arms: "#f4efe2"
    })
};

// ---- Target kinds' meshes -----------------------------------------------------

const B = (body, head, wing, beak, s, extra = {}) => ({ body, head, wing, beak, s, ...extra });
export const BIRDS = {
  pigeon: B(0x8a8f98, 0x5a6a7a, 0x9aa0a8, 0xd8a050, 0.8, { ring: 0x4ab07a, tip: 0x333333, span: 0.9 }),
  woodduck: B(0xd8282a, 0x2f6fe8, 0xf2c230, 0xf2b52a, 1.8, { gloss: 1, span: 0.9 }),
  teal: B(0x9a7a5a, 0x1f7a5a, 0x8a8a7a, 0x333333, 0.7, { tip: 0x2fa070 }),
  mallard: B(0x7a6a5a, 0x1f6b3a, 0x8a7a66, 0xf2b52a, 1.45, { ring: 0xffffff }),
  goose: B(0x8a8a82, 0x222222, 0x9a9a92, 0x222222, 1.9, { ring: 0xffffff, span: 1.2 }),
  crow: B(0x1a1a1e, 0x1a1a1e, 0x26262c, 0x111111, 0.75, { span: 1.1 }),
  pheasant: B(0xb8682a, 0x1f5a3a, 0xa8784a, 0xe8d8a0, 1.4, {
    tail: "long",
    accent: 0x8a5a2a,
    ring: 0xffffff,
    crest: 0xd02a2a
  }),
  starling: B(0x2a2a3a, 0x3a2a4a, 0x3a3a4a, 0xe8c040, 0.65, { tip: 0x6a5aa0 }),
  woodpigeon: B(0x8a8aa0, 0x7a7a98, 0x9a9ab0, 0xe8c040, 1.35, { ring: 0xffffff }),
  dove: B(0xf4f4f0, 0xf4f4f0, 0xffffff, 0xe8a070, 0.7),
  peacock: B(0x1f4ab8, 0x1f6ad8, 0x2a8a5a, 0xd8c070, 1.6, { tail: "fan", accent: 0x3ab54a, crest: 0x2f6fe8 }),
  lovebird: B(0x3ab54a, 0xe8344a, 0x2fa040, 0xf2a020, 0.6, { tip: 0x2f6fe8 }),
  vulture: B(0x3a2a22, 0xd8a090, 0x2a221c, 0xd8c070, 2.1, { ring: 0xeeeeee, span: 1.5, tip: 0x111111 })
};
export const ANIMALS = {
  lion: {
    body: 0xf2a020,
    mane: 0xc0482a,
    snout: 0xf8d070,
    s: 2.4,
    legs: 0.42,
    long: 0.55,
    neck: 0.05,
    head: 1.2,
    tuft: 0xc0482a,
    ears: 0xf2a020
  },
  lioness: {
    body: 0xf2b84a,
    snout: 0xf8d890,
    s: 2.0,
    legs: 0.45,
    long: 0.6,
    neck: 0.08,
    ears: 0xf2b84a,
    tuft: 0xa0582a
  },
  antelope: {
    body: 0xe8b860,
    snout: 0xf4e4c0,
    s: 1.7,
    legs: 0.7,
    long: 0.45,
    neck: 0.32,
    horns: 0x3a2a1a,
    ears: 0xe8b860
  },
  zebra: {
    body: 0xf4f4f0,
    stripes: 0x151515,
    snout: 0x333333,
    s: 2.0,
    legs: 0.6,
    long: 0.55,
    neck: 0.25,
    ears: 0xf4f4f0,
    tailCol: 0x151515
  },
  boar: {
    body: 0x7a3a8a,
    snout: 0xe87ab0,
    s: 1.9,
    legs: 0.28,
    long: 0.5,
    neck: 0.02,
    fat: 1.35,
    tusks: 0xffffff,
    ears: 0x7a3a8a,
    tail: 0.1
  },
  bigboar: {
    body: 0x4a1a5a,
    snout: 0xe87ab0,
    s: 3.4,
    legs: 0.28,
    long: 0.55,
    neck: 0.02,
    fat: 1.4,
    tusks: 0xffffff,
    ears: 0x4a1a5a,
    tail: 0.1
  },
  piglet: {
    body: 0xf28ab8,
    snout: 0xffb0d0,
    s: 0.9,
    legs: 0.25,
    long: 0.4,
    neck: 0.02,
    fat: 1.2,
    ears: 0xf28ab8,
    tail: 0.1
  },
  deer: {
    body: 0xc88a4a,
    snout: 0xf4e4c0,
    s: 1.9,
    legs: 0.75,
    long: 0.5,
    neck: 0.32,
    ears: 0xc88a4a,
    tailCol: 0xffffff
  },
  stag: {
    body: 0x9a5a2a,
    snout: 0xf4e4c0,
    s: 2.2,
    legs: 0.75,
    long: 0.5,
    neck: 0.34,
    antlers: 0xf2d27a,
    ears: 0x9a5a2a,
    tailCol: 0xffffff
  },
  rabbit: {
    body: 0xd8d0c8,
    snout: 0xffffff,
    s: 0.8,
    legs: 0.18,
    long: 0.25,
    neck: 0.04,
    ears: 0xd8d0c8,
    tail: 0.05,
    tuft: 0xffffff
  }
};

// The cut-outs' sizes (card w, h, metres).
export const CARD_SIZE = {
  clown: [0.8, 0.8],
  bull: [0.7, 0.7],
  letterA: [0.7, 0.7],
  letterB: [0.7, 0.7],
  letterC: [0.7, 0.7],
  tinduck: [0.8, 0.6],
  tindeer: [1.1, 1.0],
  tinzebra: [1.1, 0.9],
  tingiraffe: [1.0, 1.4],
  henchman: [0.9, 1.8],
  boss: [0.9, 1.8],
  girl: [0.9, 1.8],
  bad: [0.9, 1.8],
  hostage: [0.9, 1.8],
  taker: [0.36, 0.36],
  farmer: [0.9, 1.8],
  hiker: [0.9, 1.8],
  ranger: [0.9, 1.8],
  dog: [0.8, 0.8],
  mime: [0.9, 1.8],
  cowboy: [0.9, 1.8],
  gunslinger: [0.9, 1.8],
  outlaw: [0.9, 1.8],
  lady: [0.9, 1.8],
  barkeep: [0.9, 1.8]
};

const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g;
}

// A target's mesh by art spec: { bird }, { animal }, { card }, { thing, c }.
export function artMesh(art) {
  const g = new THREE.Group();
  const ud = { wings: [] };
  if (art.bird) {
    const o = BIRDS[art.bird];
    g.add(solid(cached(`bird:${art.bird}`, () => birdGeo(o))));
    for (const side of [-1, 1]) {
      const wg = new THREE.Group();
      wg.position.set(side * 0.09 * o.s, 0.05 * o.s, -0.02);
      wg.add(solid(cached(`wing:${art.bird}:${side}`, () => wingGeo(o, side))));
      g.add(wg);
      ud.wings.push({ wg, side });
    }
  } else if (art.animal) {
    g.add(solid(cached(`animal:${art.animal}`, () => quadGeo(ANIMALS[art.animal]))));
  } else if (art.card) {
    const [w, h] = CARD_SIZE[art.card];
    g.add(cardMesh(art.card, w, h, CARDS[art.card]));
  } else if (art.thing) {
    const key = `thing:${art.thing}:${art.c || ""}`;
    g.add(solid(cached(key, () => GEO[art.thing](art.c))));
  }
  g.userData = ud;
  return g;
}

// ---- Worlds ----------------------------------------------------------------------

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

// The sky: an equirectangular painted canvas on a big inside-out sphere.
// o: { top, mid, horizon, ground, sun: [azimuth deg (0 = downrange), elevation
// deg, colour, size], stars, moon, clouds, hills: [{ colour, height (deg),
// rough }], skyline }
function skyTexture(o) {
  const W = 1024;
  const H = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, o.top);
  grad.addColorStop(0.32, o.mid);
  grad.addColorStop(0.5, o.horizon);
  grad.addColorStop(0.51, o.ground);
  grad.addColorStop(1, o.ground);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  const R = mulberry(o.seed || 7);
  // (x = 0 at azimuth 180 deg, i.e. behind; downrange is the middle, x = W/2)
  const X = az => (((az + 180) % 360) / 360) * W;
  const Yel = el => H / 2 - (el / 90) * (H / 2);
  if (o.sun) {
    const [az, el, colour, size] = o.sun;
    const x = X(az);
    const y = Yel(el);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 5);
    glow.addColorStop(0, colour);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - size * 5, y - size * 5, size * 10, size * 10);
    ctx.fillStyle = colour;
    ctx.beginPath();
    // (wider on the canvas so it is round on the sphere)
    ctx.ellipse(x, y, size / Math.cos((el * Math.PI) / 180), size, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let k = 0; k < (o.clouds || 0); k++) {
    const x = R() * W;
    const y = H * (0.18 + R() * 0.24);
    ctx.fillStyle = o.cloud || "rgba(255,255,255,0.55)";
    for (let j = 0; j < 6; j++) {
      ctx.beginPath();
      ctx.ellipse(x + j * 14 - 40, y + (R() - 0.5) * 8, 30 + R() * 20, 9 + R() * 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const hill of o.hills || []) {
    ctx.fillStyle = hill.colour;
    ctx.beginPath();
    ctx.moveTo(0, H / 2 + 2);
    const hp = hill.height / 90;
    let y = 0;
    for (let x = 0; x <= W; x += 8) {
      y += (R() - 0.5) * (hill.rough || 6);
      y *= 0.96;
      const h = (H / 2) * hp * (0.55 + 0.45 * Math.sin(x * 0.012 + (hill.phase || 0)) ** 2) + y;
      if (hill.trees && R() < 0.5) {
        ctx.lineTo(x, H / 2 - h);
        ctx.lineTo(x + 4, H / 2 - h - 6 - R() * 8);
      }
      ctx.lineTo(x, H / 2 - Math.max(0, h));
    }
    ctx.lineTo(W, H / 2 + 2);
    ctx.closePath();
    ctx.fill();
  }
  if (o.skyline) {
    ctx.fillStyle = o.skyline;
    for (let x = 0; x < W; ) {
      const w = 6 + R() * 18;
      const h = 4 + R() * 26;
      ctx.fillRect(x, H / 2 - h, w, h + 2);
      if (o.windows) {
        ctx.fillStyle = o.windows;
        for (let j = 0; j < 6; j++) ctx.fillRect(x + R() * w, H / 2 - R() * h, 1.5, 1.5);
        ctx.fillStyle = o.skyline;
      }
      x += w + R() * 4;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

// Scenery builder: P.add(geometry, colour, x, h, f, ...) in range terms (u, h,
// f), so callers think "downrange" not "-z".
class Scenery {
  constructor(seed) {
    this.parts = [];
    this.R = mulberry(seed);
  }
  add(geo, hex, u, h, f, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    this.parts.push(part(geo, hex, u, h, -f, rx, ry, rz, sx, sy, sz));
  }
  r(a, b) {
    return a + (b - a) * this.R();
  }
  // Scatter n things on the ground over a band of distances and sides.
  scatter(n, f0, f1, fn, uMax = 70, keepClear = 0) {
    for (let k = 0; k < n; k++) {
      const f = this.r(f0, f1);
      let u = this.r(-uMax, uMax);
      if (Math.abs(u) < keepClear && f < 40) u += Math.sign(u || 1) * keepClear;
      fn(u, f, this.R);
    }
  }
  pine(u, f, s = 1, c = 0x24502e) {
    this.add(CYL(0.12 * s, 0.18 * s, 1.2 * s, 5), 0x4a3020, u, GROUND + 0.6 * s, f);
    this.add(CONE(1.3 * s, 3.2 * s, 7), c, u, GROUND + 2.6 * s, f);
    this.add(CONE(1.0 * s, 2.6 * s, 7), c, u, GROUND + 3.9 * s, f);
  }
  oak(u, f, s = 1, c = 0x3a6a2a) {
    this.add(CYL(0.2 * s, 0.3 * s, 2.4 * s, 6), 0x5a3a20, u, GROUND + 1.2 * s, f);
    this.add(BALL(1.8 * s, 7), c, u, GROUND + 3.4 * s, f, 0, 0, 0, 1.1, 0.85, 1.1);
  }
  acacia(u, f, s = 1) {
    this.add(CYL(0.12 * s, 0.2 * s, 3 * s, 5), 0x5a4030, u, GROUND + 1.5 * s, f, 0, 0, 0.15);
    this.add(CYL(2.6 * s, 2.2 * s, 0.5 * s, 9), 0x5a7a2a, u + 0.4 * s, GROUND + 3.2 * s, f);
  }
  bush(u, f, s = 1, c = 0x4a6a2a) {
    this.add(BALL(0.9 * s, 6), c, u, GROUND + 0.4 * s, f, 0, 0, 0, 1.3, 0.75, 1.1);
  }
  rock(u, f, s = 1, c = 0x8a8278) {
    this.add(BALL(0.8 * s, 5), c, u, GROUND + 0.3 * s, f, this.R(), this.R(), 0, 1.2, 0.7, 1);
  }
  reeds(u, f, s = 1) {
    for (let k = 0; k < 5; k++)
      this.add(
        CYL(0.02, 0.03, 1.8 * s, 3),
        k % 2 ? 0x8a8a4a : 0x6a7a3a,
        u + this.r(-0.5, 0.5),
        GROUND + 0.9 * s,
        f + this.r(-0.5, 0.5),
        this.r(-0.15, 0.15),
        0,
        this.r(-0.15, 0.15)
      );
    this.add(CAP(0.06, 0.25, 4), 0x5a3a20, u, GROUND + 1.8 * s, f);
  }
  palm(u, f, s = 1) {
    for (let k = 0; k < 6; k++)
      this.add(
        CYL(0.16 * s, 0.2 * s, 1.2 * s, 5),
        0x8a6a4a,
        u + k * 0.08 * s,
        GROUND + 0.6 * s + k * 1.15 * s,
        f,
        0,
        0,
        -0.07
      );
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      this.add(
        BOX(2.6 * s, 0.05, 0.5 * s),
        0x2f7a2a,
        u + 0.5 * s + Math.cos(a) * 1.2 * s,
        GROUND + 7 * s,
        f + Math.sin(a) * 1.2 * s,
        0,
        -a,
        -0.35
      );
    }
  }
  // The ground: a half disc downrange of the Rovers' south wall (nothing of
  // the building stands out there), patched with fields, ponds, paths.
  ground(c, patches = []) {
    // (in rings, so the haze baked into its corners doesn't smear across
    // long thin triangles into the near ground)
    const geo = new THREE.RingGeometry(0.01, 96, 48, 16, 0, Math.PI);
    geo.rotateX(-Math.PI / 2);
    this.parts.push(part(geo, c, 0, GROUND, -0.9));
    // the strip between the wall and the moved world (SHIFT)
    // (laid out from f = -SHIFT - 1 to 1.5, so it ends up from just behind
    // the wall to a little under the disc's straight edge)
    const apron = new THREE.PlaneGeometry(192, SHIFT + 2.5, 24, 2);
    apron.rotateX(-Math.PI / 2);
    this.parts.push(part(apron, c, 0, GROUND, (SHIFT + 1 - 1.5) / 2));
    patches.forEach((p, k) => {
      const g = new THREE.CircleGeometry(p.r, 18);
      g.rotateX(-Math.PI / 2);
      // (each a little above the last, so where they overlap they don't shimmer)
      this.parts.push(
        part(g, p.c, p.u, GROUND + 0.03 + 0.03 * k + (p.lift || 0), -p.f, 0, 0, 0, p.sx || 1, 1, p.sz || 1)
      );
    });
  }
  build(fog) {
    // Move it all back SHIFT m and lift it before the haze is baked in (the
    // apron, laid out in front of the wall, lands between the wall and the world).
    for (const { geo: g } of this.parts) {
      const pos = g.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const f = -pos.getZ(k) + SHIFT;
        pos.setXYZ(k, pos.getX(k), pos.getY(k) + lift(f), -f);
      }
    }
    const geo = merge(this.parts, fog);
    this.parts = [];
    return geo;
  }
}

// The seven worlds. Each: sky (painted), fog colour, scenery (merged).
// Pop-up slots: where a world puts its cover (booths, windows, sills).
export const WORLDS = {
  carnival: {
    sky: {
      top: "#1a1046",
      mid: "#5a2a7a",
      horizon: "#f28a4a",
      ground: "#3a2a2a",
      sun: [20, 4, "#ffd27a", 18],
      stars: true,
      clouds: 6,
      cloud: "rgba(255,170,140,0.35)",
      hills: [{ colour: "#2a1a3a", height: 6, rough: 3 }],
      seed: 3
    },
    fog: 0x6a3a5a,
    build(P) {
      P.ground(0x4a3a2a, [{ u: 0, f: 30, r: 26, c: 0x6a5a3a, sx: 1.6 }]);
      // the big top
      const tops = [0xd8282a, 0xf4ecd8];
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        P.add(
          BOX(4.0, 9, 0.2),
          tops[k % 2],
          30 + Math.cos(a) * 9.3,
          GROUND + 4.5,
          55 + Math.sin(a) * 9.3,
          0,
          -a + Math.PI / 2,
          0
        );
      }
      P.add(CONE(13, 9, 16), 0xd8282a, 30, GROUND + 13.5, 55);
      P.add(CONE(3, 4, 8), 0xf4ecd8, 30, GROUND + 18, 55);
      P.add(CYL(0.1, 0.1, 4, 4), 0xf2c230, 30, GROUND + 20, 55);
      // ferris wheel
      const fw = { u: -28, f: 50, r: 13 };
      P.add(TORUS(fw.r, 0.35, 32), 0xf2f2f2, fw.u, GROUND + fw.r + 3, fw.f, 0, Math.PI / 2.6, 0);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        P.add(BOX(0.15, fw.r * 2, 0.15), 0xe8e2d0, fw.u, GROUND + fw.r + 3, fw.f, 0, Math.PI / 2.6, a);
        const cx = Math.cos(a) * fw.r;
        P.add(
          BOX(1.4, 1.2, 1.2),
          [0xe8344a, 0x2f6fe8, 0xf2c230, 0x3ab54a][k % 4],
          fw.u + cx * Math.cos(Math.PI / 2.6),
          GROUND + fw.r + 3 + Math.sin(a) * fw.r - 0.8,
          fw.f + cx * Math.sin(Math.PI / 2.6)
        );
      }
      for (const s of [-1, 1])
        P.add(
          BOX(0.4, fw.r + 4, 0.4),
          0xb8b8b8,
          fw.u + s * 3,
          GROUND + (fw.r + 4) / 2,
          fw.f,
          0,
          Math.PI / 2.6,
          s * 0.2
        );
      // booths along both sides of the midway, striped awnings
      for (let k = 0; k < 10; k++) {
        const side = k % 2 ? 1 : -1;
        const f = 16 + Math.floor(k / 2) * 9;
        const u = side * 15;
        P.add(BOX(5, 3, 3), 0x7a3a2a, u, GROUND + 1.5, f);
        for (let j = 0; j < 5; j++)
          P.add(
            BOX(1, 0.3, 3.6),
            j % 2 ? 0xf4ecd8 : [0xd8282a, 0x2f6fe8, 0x3ab54a][k % 3],
            u - 2 + j,
            GROUND + 3.3,
            f,
            0.25 * -side,
            0,
            0
          );
      }
      // strings of lights
      for (let k = 0; k < 60; k++) {
        const t = k / 60;
        P.add(
          BALL(0.18, 4),
          [0xfff1a8, 0xff8a8a, 0x8ad8ff][k % 3],
          -14 + 28 * t,
          GROUND + 6 - Math.sin(t * Math.PI) * 1.5,
          22
        );
        P.add(
          BALL(0.18, 4),
          [0xfff1a8, 0xff8a8a, 0x8ad8ff][k % 3],
          -14 + 28 * t,
          GROUND + 6 - Math.sin(t * Math.PI) * 1.5,
          40
        );
      }
      P.scatter(40, 60, 90, (u, f) => P.oak(u, f, P.r(1, 1.6), 0x2a3a2a));
    },
    // clown booth hatches along the midway
    slots: [
      [-6, 14, 0.9],
      [-2, 14, 0.9],
      [2, 14, 0.9],
      [6, 14, 0.9],
      [-8, 20, 0.9],
      [8, 20, 0.9],
      [-4, 26, 0.9],
      [4, 26, 0.9]
    ],
    cover: "counter"
  },
  duck: {
    sky: {
      top: "#3a5a8a",
      mid: "#8aa8c8",
      horizon: "#f2c8a0",
      ground: "#3a4a3a",
      sun: [-35, 6, "#fff0c0", 14],
      clouds: 10,
      hills: [
        { colour: "#4a5a5a", height: 7, rough: 4, phase: 1 },
        { colour: "#2a3a2a", height: 4, rough: 6, trees: true }
      ],
      seed: 11
    },
    fog: 0xa8b8c0,
    build(P) {
      P.ground(0x4a5a2a, [
        { u: 0, f: 32, r: 30, c: 0x5a7a8a, sx: 1.8, sz: 0.9 },
        { u: -30, f: 60, r: 16, c: 0x5a7a8a, sx: 1.5 }
      ]);
      P.scatter(90, 8, 70, (u, f) => P.reeds(u, f, P.r(0.8, 1.3)), 70, 4);
      P.scatter(30, 70, 92, (u, f) => P.oak(u, f, P.r(1.2, 2)), 90);
      // a duck blind and a little dock
      P.add(BOX(4, 1.6, 2), 0x6a5a3a, 12, GROUND + 0.8, 16);
      P.add(BOX(5, 0.15, 1.2), 0x8a6a4a, -10, GROUND + 0.2, 14);
    },
    slots: [
      [-9, 12, 0.3],
      [-3, 15, 0.3],
      [4, 13, 0.3],
      [10, 17, 0.3],
      [-6, 20, 0.3],
      [7, 22, 0.3]
    ],
    cover: "reeds"
  },
  deer: {
    sky: {
      top: "#5a7aa8",
      mid: "#a8c0d8",
      horizon: "#e8eef0",
      ground: "#3a4a32",
      sun: [40, 18, "#fff8e0", 12],
      clouds: 14,
      hills: [
        { colour: "#7a8a98", height: 12, rough: 5, phase: 2 },
        { colour: "#3a5a3a", height: 7, rough: 6, trees: true }
      ],
      seed: 19
    },
    fog: 0xc8d4d8,
    build(P) {
      P.ground(0x4a6a32, [{ u: 0, f: 30, r: 24, c: 0x6a8a3a, sx: 2 }]);
      // the forest edge: a ring of pines behind a meadow
      const pine = (u, f) => P.pine(u, f, P.r(1.1, 2.0), [0x24502e, 0x1f4a2a, 0x2a5a32][Math.floor(P.r(0, 3))]);
      P.scatter(150, 50, 90, pine, 90);
      P.scatter(60, 28, 50, (u, f) => (Math.abs(u) > 34 ? pine(u, f) : null), 90);
      P.scatter(40, 14, 34, (u, f) => (Math.abs(u) > 16 ? P.pine(u, f, P.r(1, 1.6)) : P.bush(u, f, P.r(0.5, 0.9))), 50);
      // a split-rail fence
      for (let k = 0; k < 12; k++) {
        const u = -13 + k * 2.4;
        P.add(BOX(0.12, 1.2, 0.12), 0x6a4a2a, u, GROUND + 0.6, 16);
        P.add(BOX(2.4, 0.1, 0.1), 0x7a5a3a, u + 1.2, GROUND + 0.9, 16);
        P.add(BOX(2.4, 0.1, 0.1), 0x7a5a3a, u + 1.2, GROUND + 0.5, 16);
      }
    },
    slots: [
      [-10, 17, 0],
      [-5, 17, 0],
      [0, 17, 0],
      [5, 17, 0],
      [10, 17, 0]
    ],
    cover: null
  },
  boar: {
    sky: {
      top: "#4a7ab8",
      mid: "#9ac0e0",
      horizon: "#f2d8a0",
      ground: "#7a6a4a",
      sun: [-60, 25, "#fff4d0", 14],
      clouds: 4,
      hills: [
        { colour: "#b08a6a", height: 9, rough: 3, phase: 0.5 },
        { colour: "#8a6a4a", height: 5, rough: 4 }
      ],
      seed: 23
    },
    fog: 0xe0d0b0,
    build(P) {
      P.ground(0x9a8a5a, [{ u: 0, f: 35, r: 30, c: 0xa89a6a, sx: 1.6 }]);
      const bush = (u, f) => P.bush(u, f, P.r(0.6, 1.4), [0x5a6a2a, 0x6a7a3a, 0x4a5a2a][Math.floor(P.r(0, 3))]);
      // (the near field is the plates' (plates.js): scrub only out to the sides)
      P.scatter(60, 36, 80, bush, 80);
      P.scatter(30, 10, 36, (u, f) => (Math.abs(u) > 20 ? bush(u, f) : null), 80);
      P.scatter(30, 36, 85, (u, f) => P.rock(u, f, P.r(0.6, 2.2), 0xa08a70), 85);
      P.scatter(18, 50, 90, (u, f) => P.oak(u, f, P.r(1, 1.5), 0x5a6a2a), 90);
      // a farm gate the boar come through
      P.add(BOX(0.25, 2, 0.25), 0x6a4a2a, -4, GROUND + 1, 60);
      P.add(BOX(0.25, 2, 0.25), 0x6a4a2a, 4, GROUND + 1, 60);
    },
    slots: [
      [-8, 14, 0.5],
      [-3, 17, 0.5],
      [3, 15, 0.5],
      [8, 18, 0.5],
      [0, 22, 0.5]
    ],
    cover: "bush"
  },
  bond: {
    sky: {
      top: "#05081a",
      mid: "#14204a",
      horizon: "#2a3a6a",
      ground: "#0a1018",
      sun: [-25, 30, "#f4f0e0", 9],
      stars: true,
      hills: [{ colour: "#101828", height: 10, rough: 5 }],
      skyline: "#0c1220",
      windows: "#f2d27a",
      seed: 29
    },
    fog: 0x141c34,
    build(P) {
      P.ground(0x14202a, [{ u: 0, f: 22, r: 6, c: 0x1a4a7a, sx: 2, lift: 0.01 }]); // the pool
      // the villain's lair: three storeys of windows across the far side
      const F = 32;
      for (let floor = 0; floor < 3; floor++) {
        const y = GROUND + floor * 3.5;
        P.add(BOX(36, 0.6, 3), 0xd8d2c0, 0, y + 0.3, F);
        for (let k = 0; k < 9; k++) P.add(BOX(0.6, 2.9, 2.6), 0xe8e2d0, -16 + k * 4, y + 2.05, F);
        P.add(BOX(36, 2.9, 0.2), 0x2a3a5a, 0, y + 2.05, F + 1.3);
      }
      P.add(BOX(38, 0.8, 4), 0xd8d2c0, 0, GROUND + 10.9, F);
      // balconies and a casino sign
      P.add(BOX(36, 0.15, 1.6), 0xb8b0a0, 0, GROUND + 3.6, F - 2);
      P.add(BOX(12, 2, 0.3), 0x8a0a1a, 0, GROUND + 12.8, F - 1);
      P.scatter(24, 12, 60, (u, f) => (Math.abs(u) > 18 ? P.palm(u, f, P.r(1, 1.4)) : null), 40);
      // roulette tables by the pool
      for (const [u, f] of [
        [-9, 12],
        [9, 12],
        [-12, 22],
        [12, 22]
      ]) {
        P.add(CYL(1.4, 1.4, 0.15, 14), 0x1a5a2a, u, GROUND + 1, f);
        P.add(CYL(0.25, 0.4, 1, 6), 0x3a2a1a, u, GROUND + 0.5, f);
      }
      // the bar the glasses slide along
      P.add(BOX(16, 1.1, 0.8), 0x3a1a10, 0, GROUND + 0.55, 10);
      P.add(BOX(16.4, 0.08, 1), 0xd8c070, 0, GROUND + 1.12, 10);
    },
    // between the lair's columns, on each floor (u, f, h above ground)
    slots: [
      [-14, 31, 0.6],
      [-6, 31, 0.6],
      [2, 31, 0.6],
      [10, 31, 0.6],
      [-10, 31, 4.1],
      [-2, 31, 4.1],
      [6, 31, 4.1],
      [-14, 31, 7.6],
      [2, 31, 7.6],
      [14, 31, 7.6]
    ],
    cover: null
  },
  safari: {
    sky: {
      top: "#2a3a7a",
      mid: "#c86a4a",
      horizon: "#f8b850",
      ground: "#8a6a3a",
      sun: [10, 5, "#ffe08a", 26],
      clouds: 5,
      cloud: "rgba(255,180,120,0.45)",
      hills: [
        { colour: "#7a4a3a", height: 5, rough: 3, phase: 1.2 },
        { colour: "#5a3a2a", height: 2.5, rough: 2 }
      ],
      seed: 31
    },
    fog: 0xd89a6a,
    build(P) {
      P.ground(0xb08a4a, [{ u: 0, f: 40, r: 30, c: 0xc0a060, sx: 2 }]);
      P.scatter(26, 25, 92, (u, f) => P.acacia(u, f, P.r(1, 1.8)), 92, 6);
      P.scatter(60, 10, 70, (u, f) => P.bush(u, f, P.r(0.3, 0.6), 0x8a8a3a), 70, 4);
      P.scatter(10, 20, 70, (u, f) => P.add(CONE(1, 3, 6), 0xa0704a, u, GROUND + 1.5, f), 60, 8); // termite mounds
      // a coconut palm by the waterhole
      P.palm(-7, 18, 1.1);
      P.add(new THREE.CircleGeometry(4, 16).rotateX(-Math.PI / 2), 0x4a7a8a, -10, GROUND + 0.04, 20);
    },
    slots: [
      [-8, 18, 0.5],
      [-3, 21, 0.5],
      [3, 19, 0.5],
      [8, 22, 0.5]
    ],
    cover: "bush"
  },
  hostage: {
    sky: {
      top: "#03050c",
      mid: "#0a1020",
      horizon: "#1a2234",
      ground: "#08090c",
      stars: true,
      skyline: "#0a0e18",
      windows: "#e8c860",
      seed: 37
    },
    fog: 0x10141c,
    build(P) {
      P.ground(0x2a2c30, [{ u: 0, f: 14, r: 10, c: 0x3a3c40, sx: 2.2 }]);
      // the shoot house: a front wall with doors and windows
      const F = 17;
      const wall = 0x8a8478;
      P.add(BOX(24, 0.6, 0.4), wall, 0, GROUND + 3.3, F); // lintel band
      const openings = [-9, -5, -1, 3, 7, 10];
      let u = -12;
      for (const o of openings) {
        const w = o - 0.9 - u;
        if (w > 0) P.add(BOX(w, 3.6, 0.4), wall, u + w / 2, GROUND + 1.8, F);
        P.add(BOX(1.8, 0.9, 0.4), wall, o, GROUND + 0.45, F); // sill
        u = o + 0.9;
      }
      P.add(BOX(12 - u, 3.6, 0.4), wall, u + (12 - u) / 2, GROUND + 1.8, F);
      // upstairs: windows over the openings below (sills at 4.5)
      u = -12;
      for (const o of openings) {
        const w = o - 0.9 - u;
        if (w > 0) P.add(BOX(w, 3.6, 0.4), wall, u + w / 2, GROUND + 5.4, F);
        P.add(BOX(1.8, 0.9, 0.4), wall, o, GROUND + 4.05, F); // sill
        P.add(BOX(1.8, 0.6, 0.4), wall, o, GROUND + 6.9, F); // head
        u = o + 0.9;
      }
      P.add(BOX(12 - u, 3.6, 0.4), wall, u + (12 - u) / 2, GROUND + 5.4, F);
      P.add(BOX(24, 0.3, 8), 0x5a5650, 0, GROUND + 7.35, F + 3.6); // roof
      P.add(BOX(24, 7.2, 0.3), 0x2a2824, 0, GROUND + 3.6, F + 7.6); // back wall
      P.add(BOX(24, 0.2, 7.6), 0x4a4640, 0, GROUND + 3.6, F + 3.8); // upstairs floor
      // the tower block behind: six floors of five windows
      const B2 = 40;
      const flats = 0x6a6258;
      for (let floor = 0; floor < 6; floor++) {
        const y = GROUND + floor * 3.5;
        P.add(BOX(26, 0.9, 0.4), flats, 0, y + 0.45, B2);
        P.add(BOX(26, 0.8, 0.4), flats, 0, y + 3.1, B2);
        let x = -13;
        for (const o of [-10, -5, 0, 5, 10]) {
          P.add(BOX(o - 1 - x, 1.8, 0.4), flats, (x + o - 1) / 2, y + 1.8, B2);
          x = o + 1;
        }
        P.add(BOX(13 - x, 1.8, 0.4), flats, (x + 13) / 2, y + 1.8, B2);
      }
      P.add(BOX(26.4, 0.6, 0.6), 0x4a443c, 0, GROUND + 21.3, B2); // parapet
      P.add(BOX(26, 21, 0.3), 0x1a1816, 0, GROUND + 10.5, B2 + 3); // inside, dark
      // floodlights, barrels, a car
      for (const s of [-1, 1]) {
        P.add(BOX(0.2, 6, 0.2), 0x333333, s * 14, GROUND + 3, 12);
        P.add(BOX(1.2, 0.6, 0.6), 0xfff4c0, s * 14, GROUND + 6, 12);
      }
      for (let k = 0; k < 8; k++)
        P.add(CYL(0.35, 0.35, 0.9, 8), [0x3a5a2a, 0x8a2a1a][k % 2], -16 + k * 4.6, GROUND + 0.45, 9 + (k % 3));
      P.add(BOX(4.2, 1.2, 1.9), 0x2a2a3a, 8, GROUND + 0.6, 10);
      P.add(BOX(2.4, 0.8, 1.8), 0x2a2a3a, 8.3, GROUND + 1.5, 10);
      P.scatter(
        30,
        40,
        90,
        (u, f) => P.add(BOX(P.r(6, 14), P.r(4, 18), P.r(6, 12)), 0x1a1c22, u, GROUND + 4, f),
        90,
        20
      );
    },
    // windows and doors of the shoot house
    slots: [
      [-9, 17.6, 0.95],
      [-5, 17.6, 0.95],
      [-1, 17.6, 0.95],
      [3, 17.6, 0.95],
      [7, 17.6, 0.95],
      [10, 17.6, 0.95]
    ],
    cover: null
  },
  // Inside a saloon (SALOON above): bar and back bar at the far end under a
  // balcony, a staircase up each side, the rooms' doors along the balcony.
  saloon: {
    sky: { top: "#100a06", mid: "#160e08", horizon: "#1c120a", ground: "#100a06", seed: 43 },
    fog: 0x2a1a10,
    build(P) {
      const S = SALOON;
      const G = GROUND;
      const len = S.BACK + 0.3 - S.FRONT;
      const mid = (S.FRONT + S.BACK + 0.3) / 2;
      const B0 = S.BACK + 0.15; // the back wall's middle
      // the floor: boards, dark between them
      P.add(SLAB(2 * S.W + 0.6, 0.05, len), 0x2a1a10, 0, G - 0.12, mid);
      for (let k = 0; k < 32; k++)
        P.add(SLAB(0.98, 0.1, len), [0x7a5232, 0x6e4a2c, 0x845a38][k % 3], -15.5 + k, G - 0.05, mid);
      // the side walls: wallpaper over wood panelling, windows, pictures, lamps
      for (const s of [-1, 1]) {
        const x = d => s * (S.W - d); // (d in from the wall's face)
        P.add(SLAB(0.3, S.CEIL + 0.3, len), 0x6e2c26, s * (S.W + 0.15), G + S.CEIL / 2, mid);
        P.add(SLAB(0.06, 1.2, len), 0x4e3020, x(0.03), G + 0.6, mid);
        P.add(SLAB(0.1, 0.08, len), 0x2a1a10, x(0.05), G + 1.22, mid);
        P.add(SLAB(0.1, 0.15, len), 0x2a1a10, x(0.05), G + 0.075, mid);
        P.add(SLAB(0.08, 0.25, len), 0x3a2214, x(0.04), G + S.CEIL - 0.12, mid);
        for (const f of [-5, 2, 9]) {
          P.add(BOX(0.08, 2.0, 1.4), 0x2a1a10, x(0.04), G + 2.6, f);
          P.add(BOX(0.04, 1.8, 1.2), 0x1a2a4a, x(0.1), G + 2.6, f);
          P.add(BOX(0.03, 1.8, 0.06), 0x2a1a10, x(0.13), G + 2.6, f);
          P.add(BOX(0.03, 0.06, 1.2), 0x2a1a10, x(0.13), G + 2.6, f);
        }
        for (const [f, c] of [
          [-1, 0x3a4a2a],
          [6, 0x5a3a2a],
          [13, 0x2a3a4a]
        ]) {
          P.add(BOX(0.06, 1.0, 1.4), 0xc8a050, x(0.03), G + 3.2, f);
          P.add(BOX(0.04, 0.8, 1.2), c, x(0.07), G + 3.2, f);
        }
        for (const f of [-3, 4, 11]) {
          P.add(BOX(0.25, 0.05, 0.05), 0x2a1a10, x(0.12), G + 2.75, f);
          P.add(BOX(0.16, 0.3, 0.16), 0xffd27a, x(0.25), G + 2.95, f);
        }
        // the door at the balcony's end the stairs' gunmen come out of
        P.add(BOX(0.08, 2.6, 1.45), 0x3a2214, x(0.02), G + S.BAL + 1.3, S.BALF + 1.35);
        P.add(BOX(0.06, 2.4, 1.2), 0x120a06, x(0.05), G + S.BAL + 1.2, S.BALF + 1.35);
      }
      // the ceiling and its beams
      P.add(SLAB(2 * S.W + 0.6, 0.3, len), 0x3e2a1c, 0, G + S.CEIL + 0.15, mid);
      for (let f = S.FRONT + 1; f < S.BACK; f += 3) P.add(BOX(2 * S.W, 0.35, 0.3), 0x2a1a10, 0, G + S.CEIL - 0.175, f);
      // the back wall, in bands round its doors: panelled downstairs, papered up
      const band = (h0, h1, doors, c) => {
        let u = -S.W - 0.3;
        for (const d of [...doors, S.W + 0.95]) {
          const w = d - 0.65 - u;
          if (w > 0) P.add(BOX(w, h1 - h0, 0.3), c, u + w / 2, G + (h0 + h1) / 2, B0);
          u = d + 0.65;
        }
      };
      band(0, 2.4, S.DOWN_DOORS, 0x5a3420);
      band(2.4, S.BAL, [], 0x5a3420);
      band(S.BAL, S.BAL + 2.4, S.UP_DOORS, 0x6e2c26);
      band(S.BAL + 2.4, S.CEIL + 0.3, [], 0x6e2c26);
      // the doors: frames, a dark room behind, the door swung open
      const door = (c, hb) => {
        P.add(BOX(0.12, 2.5, 0.1), 0x3a2214, c - 0.71, G + hb + 1.25, S.BACK - 0.03);
        P.add(BOX(0.12, 2.5, 0.1), 0x3a2214, c + 0.71, G + hb + 1.25, S.BACK - 0.03);
        P.add(BOX(1.54, 0.14, 0.1), 0x3a2214, c, G + hb + 2.47, S.BACK - 0.03);
        P.add(BOX(2.6, 2.8, 0.1), 0x140c08, c, G + hb + 1.3, S.BACK + 2.6);
        P.add(BOX(2.6, 0.05, 2.6), 0x1e140c, c, G + hb - 0.025, S.BACK + 1.4);
        for (const s of [-1, 1]) P.add(BOX(0.1, 2.8, 2.6), 0x140c08, c + s * 1.3, G + hb + 1.3, S.BACK + 1.4);
        P.add(BOX(2.6, 0.1, 2.6), 0x140c08, c, G + hb + 2.75, S.BACK + 1.4);
        // (hinged on the side away from the middle, so it doesn't hide the doorway)
        const sd = c >= 0 ? 1 : -1;
        const a = 1.25;
        P.add(
          BOX(1.25, 2.3, 0.05),
          0x7a4a2a,
          c + sd * (0.65 + 0.625 * Math.cos(a)),
          G + hb + 1.15,
          S.BACK - 0.625 * Math.sin(a),
          0,
          sd > 0 ? -a : Math.PI + a,
          0
        );
      };
      for (const c of S.UP_DOORS) door(c, S.BAL);
      for (const c of S.DOWN_DOORS) door(c, 0);
      // a steer's skull over the middle doors, lamps between them
      P.add(BOX(0.36, 0.5, 0.15), 0xe8e0d0, 0, G + S.BAL + 3.4, S.BACK - 0.1);
      for (const s of [-1, 1])
        P.add(CONE(0.07, 0.95, 6), 0xf4ecd8, s * 0.6, G + S.BAL + 3.55, S.BACK - 0.12, 0, 0, s * (Math.PI / 2 - 0.35));
      for (const u of [-9.25, -4.65, 0, 4.65, 9.25]) {
        if (u === 0) continue;
        P.add(BOX(0.16, 0.3, 0.16), 0xffd27a, u, G + S.BAL + 1.95, S.BACK - 0.15);
      }
      // the balcony: floor, fascia, railing, posts down to the saloon floor
      P.add(BOX(2 * S.W, 0.3, S.BACK - S.BALF), 0x5a3820, 0, G + S.BAL - 0.15, (S.BALF + S.BACK) / 2);
      P.add(BOX(2 * S.W, 0.45, 0.12), 0x4a2c18, 0, G + S.BAL - 0.2, S.BALF - 0.02);
      const railU = S.SU - S.SW / 2 - 0.05;
      P.add(BOX(2 * railU, 0.08, 0.1), 0x3e2616, 0, G + S.BAL + 1.0, S.BALF + 0.08);
      P.add(BOX(2 * railU, 0.06, 0.08), 0x3e2616, 0, G + S.BAL + 0.1, S.BALF + 0.08);
      for (let u = -railU + 0.05; u < railU; u += 0.45)
        P.add(BOX(0.05, 0.9, 0.05), 0x5a3820, u, G + S.BAL + 0.55, S.BALF + 0.08);
      for (const u of [-railU, -8.3, 8.3, railU])
        P.add(
          BOX(0.25, S.BAL + (Math.abs(u) > 9 ? 1.1 : 0), 0.25),
          0x4a2c18,
          u,
          G + (S.BAL + (Math.abs(u) > 9 ? 1.1 : 0)) / 2,
          S.BALF + 0.12
        );
      // the stairs up each side wall to the balcony
      const N = 16;
      const rise = S.BAL / N;
      const tread = (S.BALF - S.S0) / N;
      for (const s of [-1, 1]) {
        const inner = s * (S.SU - S.SW / 2 - 0.06);
        for (let k = 0; k < N; k++) {
          const top = (k + 1) * rise;
          const f = S.S0 + (k + 0.5) * tread;
          P.add(BOX(S.SW, top, tread), 0x5a3a22, s * S.SU, G + top / 2, f);
          P.add(BOX(S.SW + 0.04, 0.04, tread + 0.04), 0x8a6040, s * S.SU, G + top + 0.005, f - 0.02);
          const baluster = 1.0 - 0.5 * rise;
          P.add(BOX(0.05, baluster, 0.05), 0x5a3820, inner, G + top + baluster / 2, f);
        }
        const L = Math.hypot(S.BALF - S.S0, S.BAL);
        P.add(
          BOX(0.08, 0.1, L),
          0x3a2214,
          inner,
          G + 1.0 + S.BAL / 2,
          (S.S0 + S.BALF) / 2,
          Math.atan2(S.BAL, S.BALF - S.S0)
        );
        P.add(BOX(0.16, 1.25, 0.16), 0x3a2214, inner, G + 0.625, S.S0 + 0.1);
        P.add(BALL(0.1, 6), 0x3a2214, inner, G + 1.3, S.S0 + 0.1);
      }
      // the bar: panelled front, dark top, brass foot rail, stools
      P.add(BOX(14, 1.17, 0.9), 0x5a321c, 0, G + 0.585, S.BAR + 0.45);
      for (let k = 0; k < 10; k++) P.add(BOX(1.2, 0.8, 0.04), 0x6a3e24, -6.3 + k * 1.4, G + 0.6, S.BAR - 0.02);
      P.add(BOX(14.4, 0.06, 1.1), 0x3a2010, 0, G + S.BARH - 0.03, S.BAR + 0.45);
      P.add(CYL(0.035, 0.035, 14, 6), 0xd8a840, 0, G + 0.22, S.BAR - 0.25, 0, 0, Math.PI / 2);
      for (let u = -5; u <= 5; u += 2) {
        P.add(CYL(0.2, 0.2, 0.06, 10), 0x6a2a1a, u, G + 0.76, S.BAR - 0.55);
        P.add(CYL(0.04, 0.05, 0.74, 5), 0x2a1a10, u, G + 0.37, S.BAR - 0.55);
      }
      // the back bar under the balcony: cabinet, mirror, three shelves of bottles
      P.add(BOX(13, 1.0, 1.0), 0x4a2a16, 0, G + 0.5, S.BACK - 0.5);
      P.add(BOX(13.2, 0.05, 1.1), 0x3a2010, 0, G + 1.025, S.BACK - 0.55);
      P.add(BOX(12, 2.25, 0.04), 0x8aa2ac, 0, G + 2.6, S.BACK - 0.03);
      P.add(BOX(12.4, 0.15, 0.06), 0xc8a050, 0, G + 3.78, S.BACK - 0.05);
      for (const s of [-1, 1]) {
        P.add(BOX(0.15, 2.4, 0.06), 0xc8a050, s * 6.1, G + 2.6, S.BACK - 0.05);
        P.add(BOX(0.3, S.BAL - 0.3, 0.3), 0x3a2214, s * 6.6, G + (S.BAL - 0.3) / 2, S.BACK - 0.2);
      }
      for (const h of [1.72, 2.37, 3.02]) P.add(BOX(12.4, 0.05, 0.4), 0x3a2214, 0, G + h - 0.025, S.BACK - 0.25);
      // a piano on the left wall, a bench on the right
      P.add(BOX(0.7, 1.35, 1.6), 0x2a1810, -S.W + 0.35, G + 0.675, 10);
      P.add(BOX(0.28, 0.05, 1.45), 0xf4efe2, -S.W + 0.82, G + 0.74, 10);
      P.add(BOX(0.3, 0.06, 1.5), 0x1a100a, -S.W + 0.84, G + 0.8, 10);
      P.add(CYL(0.2, 0.2, 0.06, 10), 0x6a2a1a, -S.W + 1.45, G + 0.5, 10);
      P.add(CYL(0.04, 0.05, 0.5, 5), 0x2a1a10, -S.W + 1.45, G + 0.25, 10);
      P.add(BOX(0.5, 0.45, 3), 0x4a2c18, S.W - 0.3, G + 0.225, 10);
      // round tables and chairs near, card tables further back
      const chair = (u, f, back) => {
        P.add(BOX(0.42, 0.05, 0.42), 0x4a2c18, u, G + 0.45, f);
        for (const [a, b] of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1]
        ])
          P.add(BOX(0.04, 0.45, 0.04), 0x3a2214, u + a * 0.18, G + 0.225, f + b * 0.18);
        P.add(BOX(0.42, 0.5, 0.04), 0x4a2c18, u, G + 0.72, f + back * 0.2);
      };
      const table = (u, f, r, top) => {
        P.add(CYL(r, r, 0.05, 16), top, u, G + 0.785, f);
        P.add(CYL(0.06, 0.08, 0.76, 6), 0x2a1a10, u, G + 0.38, f);
        P.add(CYL(0.32, 0.36, 0.04, 10), 0x2a1a10, u, G + 0.02, f);
        chair(u - r - 0.3, f + 0.3, 1);
        chair(u + r + 0.3, f + 0.3, 1);
        chair(u, f + r + 0.35, 1);
      };
      for (const u of S.TABLES) table(u, 7, 0.62, 0x5a3a22);
      for (const u of [-7, 0, 7]) {
        P.add(CYL(0.95, 0.95, 0.05, 18), 0x3a2214, u, G + 0.765, 13);
        table(u, 13, 0.9, 0x1f5a32);
        // chips and a hand of cards
        if (u)
          for (let k = 0; k < 4; k++)
            P.add(
              CYL(0.035, 0.035, 0.06 + 0.03 * k, 8),
              [0xc0182a, 0x151515, 0xf4efe2, 0x2f6fe8][k],
              u - 0.3 + k * 0.12,
              G + 0.84 + 0.015 * k,
              12.8
            );
      }
      // overturned tables the pop-ups hide behind
      for (const u of S.COVER) {
        P.add(CYL(0.58, 0.58, 0.06, 16), 0x6a4426, u, G + 0.58, 3.85, Math.PI / 2);
        P.add(TORUS(0.56, 0.035, 20), 0x3a2214, u, G + 0.58, 3.8);
        for (const x of [-0.2, 0.2]) P.add(BOX(0.025, 1.0, 0.02), 0x3a2214, u + x, G + 0.58, 3.81);
      }
      // wagon-wheel chandeliers
      for (const [u, f] of [
        [-6, 3],
        [6, 3],
        [-6, 13],
        [6, 13],
        [0, 8]
      ]) {
        const h = G + 7.2;
        P.add(TORUS(1.0, 0.05, 20), 0x3a2214, u, h, f, Math.PI / 2);
        for (let k = 0; k < 3; k++) P.add(BOX(2.0, 0.04, 0.04), 0x3a2214, u, h, f, 0, (k * Math.PI) / 3, 0);
        P.add(CYL(0.015, 0.015, S.CEIL - 7.2, 4), 0x2a1a10, u, (h + G + S.CEIL) / 2, f);
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          P.add(CYL(0.03, 0.03, 0.14, 5), 0xf4efe2, u + Math.cos(a), h + 0.12, f + Math.sin(a));
          P.add(BALL(0.045, 4), 0xffd27a, u + Math.cos(a), h + 0.23, f + Math.sin(a));
        }
      }
    },
    slots: [],
    cover: null
  }
};

// Painted signs on a world's buildings (w.signs: [text, u, h, f, w, hgt, bg,
// fg, ry]), all on one canvas, one mesh; laid out like the scenery and moved
// back and lifted with it.
function signBoard(signs) {
  const ROW = 128;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 2 ** Math.ceil(Math.log2(ROW * signs.length));
  const ctx = canvas.getContext("2d");
  const geos = [];
  signs.forEach(([text, u, h, f, w, hgt, bg = "#3a2414", fg = "#f2e2b8", ry = 0], k) => {
    const pw = Math.min(1024, Math.round((ROW * w) / hgt));
    const y = k * ROW;
    ctx.fillStyle = bg;
    ctx.fillRect(0, y, pw, ROW);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 5;
    ctx.strokeRect(6, y + 6, pw - 12, ROW - 12);
    ctx.fillStyle = fg;
    ctx.font = `900 ${Math.round(ROW * 0.62)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, pw / 2, y + ROW / 2 + 4, pw - 28);
    const g = new THREE.PlaneGeometry(w, hgt);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) * pw) / 1024, 1 - (y + (1 - uv.getY(i)) * ROW) / canvas.height);
    const fs = f + SHIFT;
    g.applyMatrix4(m4.compose(pp.set(u, h + lift(fs), -fs), qq.setFromEuler(ee.set(0, ry, 0)), ss.set(1, 1, 1)));
    geos.push(g);
  });
  const geo = mergeBufferGeometries(geos, false);
  geos.forEach(g => g.dispose());
  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 4;
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: false }));
  mesh.frustumCulled = false;
  return mesh;
}

// Cover in front of a world's pop-up slots (counters, reeds, bushes).
function addCover(P, w) {
  for (const [u0, f, h] of w.slots) {
    const u = u0 * SPREAD; // (with the plates that pop up behind it)
    if (w.cover === "counter") {
      P.add(BOX(2.6, 1.0, 0.6), 0x8a2a1a, u, GROUND + 0.5, f - 0.4);
      P.add(BOX(2.8, 0.08, 0.8), 0xf2c230, u, GROUND + 1.04, f - 0.4);
    } else if (w.cover === "reeds") (P.reeds(u, f - 0.6, 1.2), P.reeds(u + 0.6, f - 0.5, 1.1));
    else if (w.cover === "bush") P.bush(u, f - 0.5, 1.2);
    void h;
  }
}

// Build a world: { group, sky, scenery } (add the group to the gallery-frame
// node). Cheap enough to build on demand; dispose() frees it.
// extra(P): more scenery from the caller (the plates' rails, ridges, cover).
export function buildWorld(key, extra) {
  const w = WORLDS[key];
  const group = new THREE.Group();
  group.name = `LoungeShootWorld:${key}`;
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture(w.sky),
    side: THREE.BackSide,
    depthWrite: false,
    fog: false
  });
  const skyGeo = new THREE.SphereGeometry(98, 32, 16);
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.rotation.y = Math.PI / 2; // (the canvas middle, x = W/2, lands downrange)
  sky.renderOrder = -2000;
  sky.frustumCulled = false;
  group.add(sky);
  let stars = null;
  if (w.sky.stars) {
    // Real points: one pixel each, however close you look.
    const R = mulberry(41);
    const pos = [];
    for (let k = 0; k < 420; k++) {
      const az = R() * Math.PI * 2;
      const el = Math.asin(0.08 + 0.92 * R());
      pos.push(Math.cos(el) * Math.sin(az) * 94, Math.sin(el) * 94, Math.cos(el) * Math.cos(az) * 94);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    stars = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, depthWrite: false, fog: false })
    );
    stars.renderOrder = -1999;
    stars.frustumCulled = false;
    group.add(stars);
  }
  const P = new Scenery(key.length * 977 + 3);
  w.build(P);
  addCover(P, w);
  extra?.(P);
  const fogColour = new THREE.Color(w.fog).convertSRGBToLinear();
  const geo = P.build({ color: fogColour, near: 25, far: 95, max: 0.75 });
  const scenery = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  scenery.frustumCulled = false;
  group.add(scenery);
  const signs = w.signs?.length ? signBoard(w.signs) : null;
  if (signs) group.add(signs);
  group.traverse(o => (o.matrixNeedsUpdate = true));
  return {
    group,
    dispose() {
      if (signs) {
        signs.geometry.dispose();
        signs.material.map.dispose();
        signs.material.dispose();
      }
      skyMat.map.dispose();
      skyMat.dispose();
      skyGeo.dispose();
      if (stars) {
        stars.geometry.dispose();
        stars.material.dispose();
      }
      geo.dispose();
      scenery.material.dispose();
    }
  };
}

// ---- Ambience (made here, no files) ---------------------------------------------

// An out-of-tune upright in the corner: 4 bars at 120 (the 8 s loop), oom-pah
// left hand (C F G C) and a right hand wandering the pentatonic, each note two
// strings a little apart.
function honkyTonk(d, sr, R) {
  const note = (t0, hz, dur, amp) => {
    const i0 = Math.floor(t0 * sr);
    const i1 = Math.min(d.length, Math.floor((t0 + dur) * sr));
    for (let i = i0; i < i1; i++) {
      const t = (i - i0) / sr;
      const env = Math.exp(-t * 5) * Math.min(1, t * 300);
      const w = 2 * Math.PI * hz * t;
      d[i] += amp * env * (Math.sin(w) + Math.sin(w * 1.007) + 0.45 * Math.sin(2 * w) + 0.2 * Math.sin(3 * w * 1.003));
    }
  };
  const hz = semis => 261.63 * 2 ** (semis / 12); // from middle C
  const roots = [0, 5, 7, 0]; // C F G C
  const scale = [0, 2, 4, 7, 9, 12, 14, 16];
  const notes = [];
  for (let bar = 0; bar < 4; bar++) {
    const r = roots[bar];
    const t = bar * 2;
    notes.push([t, hz(r - 24), 0.45, 0.09], [t + 1, hz(r - 17), 0.45, 0.09]);
    for (const b of [0.5, 1.5]) for (const c of [0, 4, 7]) notes.push([t + b, hz(r + c - 12), 0.3, 0.035]);
    for (let e = 0; e < 8; e++) {
      if (R() < 0.3) continue;
      notes.push([t + e * 0.25, hz(scale[Math.floor(R() * scale.length)] + 12), 0.35, 0.05]);
    }
  }
  // (and again from 8 s, so the loop's crossfade joins the tune to itself)
  for (const off of [0, 8]) for (const [t, f, dur, amp] of notes) note(t + off, f, dur, amp);
}

// More backgrounds (the campaigns add theirs): AMBIENCE[kind](d, sr, R) adds
// into d, a Float32Array of 8.5 s at sample rate sr, over the wind (R: a
// seeded random 0..1). The tail past 8 s is crossfaded over the head.
export const AMBIENCE = {};

// A seamless 8 s loop of a world's background: wind, water, insects, a crowd.
export function makeAmbience(ctx, kind) {
  const sr = ctx.sampleRate;
  const dur = 8;
  const n = Math.floor(dur * sr);
  const fade = Math.floor(0.5 * sr);
  const total = n + fade;
  const d = new Float32Array(total);
  const R = mulberry(kind.length * 131 + 7);
  const noise = () => R() * 2 - 1;
  let lp = 0;
  let lp2 = 0;
  let bp = 0;
  for (let i = 0; i < total; i++) {
    const t = i / sr;
    const x = noise();
    lp += 0.02 * (x - lp);
    lp2 += 0.2 * (x - lp2);
    bp = lp2 - lp;
    let v = 0;
    const wind = lp * (0.6 + 0.4 * Math.sin((t * 2 * Math.PI) / 8));
    if (kind === "saloon") {
      v = bp * (0.5 + 0.3 * Math.sin(t * 2.3) + 0.2 * Math.sin(t * 4.1)) * 0.7;
    } else if (kind === "town" || kind === "noon") {
      // desert wind gusting down the street, a windmill creaking (noon: a fly)
      v = wind * (kind === "noon" ? 1.2 : 2.2);
      const cr = (t * 0.5) % 1;
      if (cr < 0.15) v += Math.sin(2 * Math.PI * (300 + 500 * cr) * t) * 0.03 * Math.sin((Math.PI * cr) / 0.15);
      if (kind === "noon")
        v += Math.sin(2 * Math.PI * 190 * t + 3 * Math.sin(t * 7)) * 0.012 * (0.5 + 0.5 * Math.sin(t * 1.3));
    } else if (kind === "camp" || kind === "border") {
      // a fire crackling (camp) or a river (border), crickets, now and then a coyote
      v = kind === "camp" ? wind * 0.8 : bp * 0.9 + wind;
      if (kind === "camp" && R() < 0.0009) v += noise() * 0.8; // (a crack from the fire)
      v += Math.sin(2 * Math.PI * 4400 * t) * Math.max(0, Math.sin(t * 2 * Math.PI * 3)) ** 4 * 0.02;
      const y = t % 8;
      if (y > 5 && y < 6.6) {
        const e = (y - 5) / 1.6;
        v += Math.sin(2 * Math.PI * (700 + 500 * Math.sin(e * Math.PI)) * t) * 0.035 * Math.sin(e * Math.PI);
      }
    } else if (kind === "crowd" || kind === "casino") {
      // murmur: band noise swelling in voices
      v = bp * (0.5 + 0.3 * Math.sin(t * 3.1) + 0.2 * Math.sin(t * 5.3)) * 1.4;
      if (kind === "casino" && Math.floor(t * 3) % 7 === 0)
        v += Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-((t * 3) % 1) * 30) * 0.15; // chips
    } else if (kind === "marsh") {
      v = wind * 1.5;
      const croak = (t * 1.3) % 1; // frogs
      if (croak < 0.12) v += Math.sign(Math.sin(2 * Math.PI * 140 * t)) * 0.12 * Math.sin((Math.PI * croak) / 0.12);
    } else if (kind === "forest") {
      v = wind * 2;
      const tw = (t * 0.9) % 2;
      if (tw < 0.25)
        v += Math.sin(2 * Math.PI * (3200 + 800 * Math.sin(tw * 60)) * t) * 0.06 * Math.sin((Math.PI * tw) / 0.25);
    } else if (kind === "scrub") {
      v = wind * 2.4 + Math.sin(2 * Math.PI * 4800 * t) * (0.5 + 0.5 * Math.sin(t * 40)) * 0.012;
    } else if (kind === "savanna") {
      v = wind * 1.2 + Math.sin(2 * Math.PI * 5200 * t) * Math.max(0, Math.sin(t * 2 * Math.PI * 4)) * 0.03; // cicadas
    } else if (kind === "night") {
      v = wind * 0.8 + Math.sin(2 * Math.PI * 55 * t) * 0.05;
      const s = t % 8; // a siren, far off
      if (s > 2 && s < 6) v += Math.sin(2 * Math.PI * (650 + 200 * Math.sin((s - 2) * Math.PI)) * t) * 0.02;
    }
    d[i] = v;
  }
  if (kind === "saloon") honkyTonk(d, sr, R);
  AMBIENCE[kind]?.(d, sr, R);
  // loop seam: crossfade the extra tail over the head
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    d[i] = d[i] * k + d[n + i] * (1 - k);
  }
  const buf = ctx.createBuffer(1, n, sr);
  const out = buf.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
  for (let i = 0; i < n; i++) out[i] = (d[i] / (peak || 1)) * 0.9;
  return buf;
}
