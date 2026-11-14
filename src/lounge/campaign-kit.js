import * as THREE from "three";
import { GROUND, part, merge } from "./shoots-art";
import { walk, cross, toss } from "./shoot-paths";

// Shared by the campaigns' newer files (campaign-galaxy.js on): a painter for
// the cut-outs, building props once for both a target and a world's scenery,
// and the paths (rushers who stop and fire, things lobbed at you, skimmers,
// walkers, flights). Range frame as in shoots-art.js; the ground at GROUND.

const G = GROUND;

// ---- A painter for the cut-outs ------------------------------------------------

// Units: the card is 100 wide, its height in the same units (a 0.9 x 1.8 card
// is 100 x 200). Everything outlined dark like the other cut-outs.
export function painter(c, W) {
  const k = W / 100;
  c.lineJoin = "round";
  c.lineCap = "round";
  const path = (pts, close = true) => {
    c.beginPath();
    c.moveTo(pts[0] * k, pts[1] * k);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i] * k, pts[i + 1] * k);
    if (close) c.closePath();
  };
  const edge = w => {
    if (!w) return;
    c.lineWidth = w * k;
    c.strokeStyle = "#111";
    c.stroke();
  };
  return {
    poly(pts, fill, e = 2.2) {
      path(pts);
      c.fillStyle = fill;
      c.fill();
      edge(e);
    },
    ell(x, y, rx, ry, fill, e = 2.2, a = 0) {
      c.beginPath();
      c.ellipse(x * k, y * k, rx * k, ry * k, a, 0, Math.PI * 2);
      c.fillStyle = fill;
      c.fill();
      edge(e);
    },
    line(pts, w, colour) {
      path(pts, false);
      c.lineWidth = w * k;
      c.strokeStyle = colour;
      c.stroke();
    },
    glow(x, y, r, colour) {
      const g = c.createRadialGradient(x * k, y * k, 0, x * k, y * k, r * k);
      g.addColorStop(0, colour);
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect((x - r) * k, (y - r) * k, 2 * r * k, 2 * r * k);
    }
  };
}

export const BLACK = "#141416";

// Arms down at the sides (a), or both hands on a rifle held across the chest.
export function arms(p, sleeve, hand, o = {}) {
  if (o.rifle) {
    p.poly([19, 56, 29, 56, 28, 80, 20, 80], sleeve);
    p.poly([71, 56, 81, 56, 80, 80, 72, 80], sleeve);
    if (o.elbow) {
      p.ell(24, 82, 4, 3, o.elbow, 1.5);
      p.ell(76, 82, 4, 3, o.elbow, 1.5);
    }
    p.poly([20, 84, 28, 84, 34, 97, 26, 100], sleeve);
    p.poly([72, 84, 80, 84, 70, 93, 64, 89], sleeve);
    p.poly([14, 102, 80, 82, 82, 89, 16, 109], o.gun || BLACK, 1.8);
    p.line([30, 101, 48, 95], 2.5, "#3a3e44");
    p.poly([46, 88, 54, 86, 55, 90, 47, 92], "#2a2c30", 1.2);
    p.ell(30, 99, 4, 4, hand, 1.5);
    p.ell(66, 89, 4, 4, hand, 1.5);
    return;
  }
  p.poly([19, 56, 29, 56, 30, 104, 21, 104], sleeve);
  p.poly([71, 56, 81, 56, 79, 104, 70, 104], sleeve);
  p.ell(25, 108, 4.5, 5, hand, 1.5);
  p.ell(75, 108, 4.5, 5, hand, 1.5);
  if (o.pistol) p.poly([72, 106, 86, 103, 87, 110, 74, 113], BLACK, 1.5);
}

// Two legs and boots.
export function legs(p, c, boot, o = {}) {
  p.poly([34, 104, 48, 104, 47, 184, 35, 184], c);
  p.poly([52, 104, 66, 104, 65, 184, 53, 184], c);
  if (o.knee) {
    p.ell(41, 143, 6, 4, o.knee, 1.5);
    p.ell(59, 143, 6, 4, o.knee, 1.5);
  }
  if (o.stripe) {
    p.line([35.5, 108, 35.5, 182], 2, o.stripe);
    p.line([64.5, 108, 64.5, 182], 2, o.stripe);
  }
  p.poly([33, 182, 49, 182, 50, 196, 31, 196], boot);
  p.poly([51, 182, 67, 182, 69, 196, 50, 196], boot);
}

// Built through an add(geometry, colour, x, y, z, rx, ry, rz, sx, sy, sz) in the
// thing's own frame (x right, y up, its nose to -z), so one builder makes both
// a flying target (GEO, merged) and a parked one in a world's scenery (kit).
const m4 = new THREE.Matrix4();
const qq = new THREE.Quaternion();
const ee = new THREE.Euler();
const pp = new THREE.Vector3();
const ss = new THREE.Vector3();
export const collect =
  P =>
  (geo, c, ...rest) =>
    P.push(part(geo, c, ...rest));
// Placed in a world: at (u, f) on the ground (h above it), turned ry about
// the vertical (0: its nose away from you, downrange), s times life size.
export function kit(P, u, f, ry = 0, h = 0, s = 1) {
  return (geo, c, x = 0, y = 0, z = 0, rx = 0, ry1 = 0, rz = 0, sx = 1, sy = sx, sz = sx) => {
    geo.applyMatrix4(m4.compose(pp.set(x, y, z), qq.setFromEuler(ee.set(rx, ry1, rz)), ss.set(sx, sy, sz)));
    geo.applyMatrix4(m4.compose(pp.set(u, G + h, -f), qq.setFromEuler(ee.set(0, ry, 0)), ss.set(s, s, s)));
    P.add(geo, c, 0, 0, 0);
  };
}

export const asGeo = build => () => {
  const P = [];
  build(collect(P));
  return merge(P);
};

// Along a line of points to a spot in front of you; a trooper stops there,
// fires, and it costs everyone up there 10.
export function rush(R, pts, v, fire = true) {
  const w = walk(pts, v);
  if (!fire) return { dur: w.time + 0.5, pos: w.pos };
  return { dur: w.time + 2, charge: true, arrive: w.time + 0.8, pos: w.pos };
}
// Thrown at you; if it lands it goes off (charge: everyone up there pays).
export function lobbed(R, o) {
  const L = toss(R, o);
  return { ...L, charge: true, arrive: L.dur - 0.05 };
}
// Skimming across the ground (a speeder bike), h up, bobbing.
export function skim(R, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = o.u0 ?? R(26, 32);
  const ph = R(0, 6);
  return {
    dur: (2 * u0) / o.v,
    pos: (tau, out) =>
      out.set(
        -dir * u0 + dir * o.v * tau,
        o.f + 0.6 * Math.sin(ph + tau * 0.7),
        G + o.h + 0.15 * Math.sin(ph + tau * 5)
      )
  };
}
// A walker crossing, steady (its legs do the walking).
export function stride(R, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = o.u0 ?? R(30, 40);
  return { ...cross(R, { u0: -dir * u0, u1: dir * u0, f: o.f, v: o.v, bob: 0 }) };
}
// Flown along a line of points at v m/s (a TIE down the trench and up over you).
export function flight(pts, v) {
  const w = walk(pts, v, 0);
  return { dur: w.time, pos: w.pos };
}

// A flat sheet of ground at h, cut every 2 m along f and 8 times across, so
// the lift bends it with the land and the haze bakes in smoothly.
export function sheet(P, u0, u1, f0, f1, h, c) {
  const g = new THREE.PlaneGeometry(u1 - u0, f1 - f0, Math.max(1, Math.ceil((u1 - u0) / 10)), Math.ceil((f1 - f0) / 2));
  P.add(g, c, (u0 + u1) / 2, h, (f0 + f1) / 2, -Math.PI / 2);
}
// (one leg of a parked walker, swung rot about its hip at (x, y, z))
export function legAt(add, x, y, z, rot = 0) {
  return (geo, c, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => {
    geo.applyMatrix4(m4.compose(pp.set(px, py, pz), qq.setFromEuler(ee.set(rx, ry, rz)), ss.set(sx, sy, sz)));
    geo.applyMatrix4(m4.compose(pp.set(x, y, z), qq.setFromEuler(ee.set(rot, 0, 0)), ss.set(1, 1, 1)));
    add(geo, c);
  };
}

// A world's background (AMBIENCE[kind](d, sr, R) adds into d): wind, a
// crowd, water, surf, a hum, birds, insects, crickets, fire, a steam engine's
// chuff, a clank, a howl, gulls, a fairground organ's oom-pah, each by level.
export function bed(d, sr, R, o) {
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const x = R() * 2 - 1;
    lp += 0.015 * (x - lp);
    lp2 += 0.2 * (x - lp2);
    let v = lp * (o.wind || 0) * (0.6 + 0.4 * Math.sin((t * 2 * Math.PI) / 8));
    if (o.crowd) v += (lp2 - lp) * o.crowd * (0.5 + 0.3 * Math.sin(t * 2.9) + 0.2 * Math.sin(t * 4.7));
    if (o.water) v += (lp2 - lp) * o.water;
    if (o.surf) v += lp * o.surf * Math.max(0, Math.sin((t * 2 * Math.PI) / 4)) ** 2 * 3;
    if (o.hum) v += Math.sin(2 * Math.PI * o.hum[0] * t) * o.hum[1];
    if (o.birds) {
      const y = (t * 0.7) % 2;
      if (y < 0.3)
        v += Math.sin(2 * Math.PI * (2400 + 900 * Math.sin(y * 70)) * t) * o.birds * Math.sin((Math.PI * y) / 0.3);
    }
    if (o.insects) v += Math.sin(2 * Math.PI * 4600 * t) * Math.max(0, Math.sin(t * 2 * Math.PI * 3)) ** 4 * o.insects;
    if (o.crickets)
      v += Math.sin(2 * Math.PI * 4400 * t) * Math.max(0, Math.sin(t * 2 * Math.PI * 3)) ** 4 * o.crickets;
    if (o.fire && R() < 0.0012) v += x * o.fire;
    if (o.chuff) v += x * o.chuff * Math.exp(-((t * 2.2) % 1) * 9);
    if (o.clank && (t * 1.25) % 1 < 0.04) v += Math.sin(2 * Math.PI * 820 * t) * o.clank;
    if (o.gulls) {
      const y = (t + 3) % 4;
      if (y < 0.5) v += Math.sin(2 * Math.PI * (1400 - 600 * y) * t) * o.gulls * Math.sin((Math.PI * y) / 0.5);
    }
    if (o.howl) {
      const y = t % 8;
      if (y > 5 && y < 6.8) {
        const e = (y - 5) / 1.8;
        v += Math.sin(2 * Math.PI * (600 + 500 * Math.sin(e * Math.PI)) * t) * o.howl * Math.sin(e * Math.PI);
      }
    }
    if (o.organ) {
      // oom-pah: a bass on the beat, a chord off it, a tune on top (120)
      const b = Math.floor(t * 2) % 8;
      const ph = (t * 2) % 1;
      const roots = [0, 0, 5, 5, 7, 7, 0, 0];
      const f0 = 130.8 * 2 ** (roots[b] / 12);
      v += Math.sin(2 * Math.PI * f0 * t) * Math.exp(-ph * 6) * o.organ * (ph < 0.5 ? 1 : 0);
      if (ph >= 0.5)
        for (const s of [12, 16, 19])
          v += Math.sin(2 * Math.PI * f0 * 2 ** (s / 12) * t) * 0.35 * o.organ * Math.exp(-(ph - 0.5) * 8);
      const tune = [12, 16, 19, 16, 17, 21, 19, 16];
      v += Math.sign(Math.sin(2 * Math.PI * 261.6 * 2 ** (tune[b] / 12) * t)) * 0.12 * o.organ * Math.exp(-ph * 2);
    }
    d[i] += v;
  }
}

// A nature level's plates (deer, duck, boar): near / mid / far rows of plates, peeks from cover.
export function natureRows(L, o) {
  L.row({
    kind: o.near,
    n: 6,
    f: 4,
    u0: -4.5,
    u1: 4.5,
    base: o.nearBase || 0,
    size: 0.4,
    tint: o.nearTint || "brown",
    bank: 3
  });
  L.row({
    kind: o.near2 || o.near,
    n: 4,
    f: 12,
    u0: -7,
    u1: 7,
    base: 1.0,
    size: 0.45,
    tint: o.nearTint || "brown",
    bank: 4,
    wood: o.wood
  });
  L.row({
    kind: o.mid,
    n: 5,
    f: 26,
    u0: -11,
    u1: 11,
    base: o.midBase || 0.2,
    size: 0.8,
    tint: o.midTint || "orange",
    bank: 5
  });
  L.row({
    kind: o.mid2 || o.mid,
    n: 4,
    f: 36,
    u0: -14,
    u1: 14,
    base: 0.4,
    size: 0.9,
    tint: o.midTint || "orange",
    bank: 4
  });
  L.row({
    kind: o.far,
    n: 4,
    f: 50,
    u0: -16,
    u1: 16,
    base: o.farBase || 0.6,
    size: 1.2,
    tint: o.farTint || "gold",
    bank: 4
  });
  L.row({ kind: o.perch, n: 4, f: 18, u0: -8, u1: 8, base: 2.4, size: 0.45, tint: "white", perch: true, wood: o.wood });
  L.pops({
    fixed: true,
    peek: true,
    f: 9,
    at: [
      [-10, 0],
      [10, 0]
    ],
    size: o.peekSize || 1.6,
    kinds: o.peek
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 22,
    at: [
      [-16, 0],
      [16, 0]
    ],
    size: o.peekSize || 1.7,
    kinds: o.peek
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 31,
    at: [
      [-7, 0],
      [7, 0]
    ],
    size: o.peekSize || 1.8,
    kinds: o.peek
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 15,
    at: [
      [-13, 0],
      [13, 0]
    ],
    size: o.peekSize || 1.7,
    kinds: o.peek
  });
  L.pops({
    fixed: true,
    f: 42,
    at: [
      [-27, 0],
      [27, 0]
    ],
    size: 1.9,
    period: [5, 8],
    kinds: o.far2
  });
}
