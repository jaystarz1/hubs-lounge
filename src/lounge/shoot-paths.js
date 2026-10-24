import { GROUND, SALOON } from "./shoots-art";

// The featured shoots' building blocks (shoots.js and the campaigns use
// them): target kinds' helpers and the paths targets fly, run and walk.
// Range frame as in skeet-range.js: u to the shooter's right, f downrange, h
// up from the roof deck; the worlds' ground is at h = GROUND. Paths are laid
// out as the worlds are; shoots.js moves every launch SHIFT m back and onto
// the lifted land.

// Points: the smaller and faster, the more. Don't-shoots cost 25.
export const bird = (name, pts, r, sound) => ({ pts, r, dies: "fall", art: { bird: name }, face: "fly", sound });
// The running animals are the plates' cut-outs (plates-shapes.js) on a card
// h m tall, all 75 (Jay, 2026-10-21: the balloon animals looked stupid).
export const runner = (shape, tint, h, r, sound) => ({
  pts: 75,
  r,
  hy: h / 2,
  dies: "fall",
  art: { plate: shape, tint, h },
  face: "slide",
  sound
});
export const card = (name, pts, r, sound = "thud", extra = {}) => ({
  pts,
  r,
  dies: "fall",
  art: { card: name },
  face: "board",
  sound,
  ...extra
});
// A saloon gunman: a painted cut-out (plates' atlas) h m tall, 50 points.
export const gunman = (card, h) => ({
  pts: 50,
  r: 0.45,
  hy: h * 0.55,
  dies: "fall",
  art: { plate: card, tint: 0xffffff, h },
  face: "slide",
  sound: "thud",
  arrive: "pistol"
});
export const thing = (name, c, pts, r, dies, face, sound) => ({ pts, r, dies, art: { thing: name, c }, face, sound });
export const DONT = { foe: true, name: "DON'T SHOOT!" };

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Paths: each returns { dur, pos(tau, out) } (+ hittable / turn / charge) --

export function across(R, o = {}) {
  const dir = o.dir ?? (R(0, 1) < 0.5 ? 1 : -1);
  const u0 = o.u0 ?? R(26, 32);
  const v = o.v;
  const f = o.f ?? R(12, 30);
  const h = o.h ?? R(3, 11);
  const ph = R(0, 6);
  const amp = o.amp ?? 0.35;
  const weave = o.weave ?? 0;
  const climb = o.climb ?? 0;
  return {
    dur: (2 * u0) / v,
    pos: (tau, out) =>
      out.set(
        -dir * u0 + dir * v * tau,
        f + weave * Math.sin(ph + tau * 0.6),
        h + amp * Math.sin(ph + tau * 2.6) + climb * tau
      )
  };
}
// Up out of the ground (reeds, scrub) and away, climbing.
export function flush(R, o = {}) {
  const p = [o.u ?? R(-12, 12), o.f ?? R(10, 26), GROUND + 0.5];
  const v = [R(-5, 5) * (o.S || 1), R(2, 5) * (o.S || 1), R(5, 8) * (o.S || 1)];
  return {
    dur: o.dur ?? 5,
    pos: (tau, out) => out.set(p[0] + v[0] * tau, p[1] + v[1] * tau, p[2] + v[2] * tau - 0.6 * tau * tau)
  };
}
// Thrown up and falling back (coconuts, chickens, teal).
export function toss(R, o = {}) {
  const p = [o.u ?? R(-10, 10), o.f ?? R(10, 20), o.h ?? GROUND + 0.5];
  const vh = o.vh ?? R(11, 15);
  const vu = o.vu ?? R(-1.5, 1.5);
  const vf = o.vf ?? 0; // (thrown towards you: vf < 0)
  const g = 9.8;
  return {
    dur: (vh + Math.sqrt(vh * vh + 2 * g * Math.max(0, p[2] - GROUND))) / g,
    pos: (tau, out) => out.set(p[0] + vu * tau, p[1] + vf * tau, p[2] + vh * tau - 0.5 * g * tau * tau)
  };
}
// Floating up (balloons), swaying.
export function float(R, o = {}) {
  const u = o.u ?? R(-14, 14);
  const f = o.f ?? R(10, 26);
  const v = o.v ?? R(1.4, 2.6);
  const h0 = o.h ?? GROUND + 0.5;
  const ph = R(0, 6);
  return {
    dur: (26 - h0) / v,
    pos: (tau, out) => out.set(u + 0.6 * Math.sin(ph + tau * 0.8), f + 0.3 * Math.sin(ph + tau * 0.5), h0 + v * tau)
  };
}
// A cut-out animal running straight across the ground, fast, bobbing.
export function run(R, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = R(26, 32);
  const f = o.f ?? R(14, 42);
  const ph = R(0, 6);
  return {
    dur: (2 * u0) / o.v,
    pos: (tau, out) => out.set(-dir * u0 + dir * o.v * tau, f, GROUND + 0.08 * Math.abs(Math.sin(ph + tau * 11)))
  };
}
// Charging the roof on a diagonal (a cut-out coming straight on is edge-on),
// a little zig-zag, and a leap at the end. A charger that gets there costs
// everyone on the roof (charge: true).
export function charge(R, o) {
  const side = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = o.u0 ?? side * R(14, 30);
  const f0 = o.f0 ?? R(55, 75);
  const u1 = o.u1 ?? -side * R(0, 6);
  const f1 = 7;
  const dist = Math.hypot(u1 - u0, f1 - f0);
  const run = dist / o.v;
  const leap = 0.8;
  const zig = o.zig ?? R(0.3, 0.9);
  const ph = R(0, 6);
  return {
    dur: run + leap,
    charge: true,
    pos: (tau, out) => {
      const k = Math.min(1, tau / run);
      const fade = Math.min(1, (1 - k) * 4); // straightens up at the end
      out.set(
        u0 + (u1 - u0) * k + zig * fade * Math.sin(ph + tau * 1.7),
        f0 + (f1 - f0) * k,
        GROUND + 0.08 * Math.abs(Math.sin(ph + tau * 11))
      );
      if (tau > run) {
        const e = (tau - run) / leap;
        out.y -= 4 * e;
        out.z = GROUND + 3.2 * Math.sin(e * Math.PI * 0.75);
      }
      return out;
    }
  };
}
// A drone: fast, darting up and down.
export function dart(R, o) {
  const a = across(R, { ...o, amp: 0 });
  const ph = R(0, 6);
  return {
    dur: a.dur,
    pos: (tau, out) => {
      a.pos(tau, out);
      out.z += 1.6 * Math.sin(ph + tau * 2.4);
      out.y += 2 * Math.sin(ph * 2 + tau * 1.1);
      return out;
    }
  };
}
// A helicopter: in, hover, out.
export function hover(R, o = {}) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const f = o.f ?? R(30, 40);
  const h = o.h ?? R(9, 14);
  const stop = R(-8, 8);
  const tin = 5;
  const thold = 4;
  const u0 = -dir * 40;
  return {
    dur: tin + thold + 5,
    pos: (tau, out) => {
      let u;
      if (tau < tin) {
        const e = tau / tin;
        u = u0 + (stop - u0) * (1 - (1 - e) * (1 - e));
      } else if (tau < tin + thold) u = stop + 0.3 * Math.sin(tau * 2);
      else u = stop + dir * 3 * (tau - tin - thold) ** 2;
      return out.set(u, f + 0.4 * Math.sin(tau * 0.9), h + 0.4 * Math.sin(tau * 1.7));
    }
  };
}
// A human cannonball across the sky.
export function cannon(R, o = {}) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const vh = R(10, 13) * Math.sqrt(o.S || 1);
  const g = 6;
  const dur = (2 * vh) / g; // (lands back at the height it was fired from)
  const vu = 52 / dur;
  const p = [-dir * 26, o.f ?? R(18, 30), GROUND + 3];
  return {
    dur,
    pos: (tau, out) => out.set(p[0] + dir * vu * tau, p[1], p[2] + vh * tau - 0.5 * g * tau * tau)
  };
}

// ---- The saloon's paths (SALOON, in shoots-art.js) ------------------------------

// Along a line of points [u, f, h] at v m/s, bobbing as it walks.
export function walk(pts, v, bob = 0.05) {
  const segs = [];
  let total = 0;
  for (let k = 1; k < pts.length; k++) {
    const len = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1], pts[k][2] - pts[k - 1][2]);
    segs.push({ a: pts[k - 1], b: pts[k], s0: total, len });
    total += len;
  }
  return {
    time: total / v,
    pos: (tau, out) => {
      const d = Math.min(total, Math.max(0, tau * v));
      const g = segs.find(q => d <= q.s0 + q.len) || segs[segs.length - 1];
      const k = g.len ? (d - g.s0) / g.len : 1;
      out.set(g.a[0] + (g.b[0] - g.a[0]) * k, g.a[1] + (g.b[1] - g.a[1]) * k, g.a[2] + (g.b[2] - g.a[2]) * k);
      if (d < total) out.z += bob * Math.abs(Math.sin(tau * 8));
      return out;
    }
  };
}
// Out of the door at the balcony's end, down the stairs and out onto the
// floor; a gunman then stops and draws (charge: it costs everyone up there).
export function stairs(R, o) {
  const S = SALOON;
  const s = o.side ?? (R(0, 1) < 0.5 ? 1 : -1);
  const w = walk(
    [
      [s * (S.W - 0.3), S.BALF + 1.35, GROUND + S.BAL],
      [s * S.SU, S.BALF + 0.3, GROUND + S.BAL],
      [s * S.SU, S.S0 - 0.3, GROUND],
      [s * R(5, 10), o.gun ? R(8, 11) : S.BAR - 1.4, GROUND]
    ],
    o.v
  );
  // (stands there a moment, draws, and is still there a second after)
  if (!o.gun) return { dur: w.time + 0.5, pos: w.pos };
  return { dur: w.time + 2, charge: true, arrive: w.time + 0.8, pos: w.pos };
}
// Along the balcony from one end door to the other, behind the railing.
export function balcony(R, o) {
  const S = SALOON;
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const f = S.BALF + R(0.8, 1.4);
  const w = walk(
    [
      [-dir * (S.W - 0.3), S.BALF + 1.35, GROUND + S.BAL],
      [-dir * (S.W - 1.4), f, GROUND + S.BAL],
      [dir * (S.W - 1.4), f, GROUND + S.BAL],
      [dir * (S.W - 0.3), S.BALF + 1.35, GROUND + S.BAL]
    ],
    o.v
  );
  return { dur: w.time, pos: w.pos };
}
// Slid down the bar top, slowing, and left standing a moment.
export function slide(R, o) {
  const S = SALOON;
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = -dir * 6.8;
  const D = Math.abs(dir * R(1, 6.8) - u0);
  const v0 = o.v;
  const run = (2 * D) / (v0 * 1.35);
  const a = (0.35 * v0 - v0) / run;
  const f = S.BAR + R(0.3, 0.6);
  return {
    dur: run + 1.5,
    pos: (tau, out) => {
      const t = Math.min(tau, run);
      return out.set(u0 + dir * (v0 * t + 0.5 * a * t * t), f, GROUND + S.BARH);
    }
  };
}

export const pick = (R, list) => list[Math.floor(R(0, list.length))];

// Standing still at [u, f, h] (h from the ground), bobbing a little.
export function stand(R, o) {
  const ph = R(0, 6);
  return {
    dur: o.dur,
    pos: (tau, out) => out.set(o.u, o.f, GROUND + (o.h || 0) + (o.bob ?? 0.02) * Math.sin(ph + tau * 2))
  };
}
// Walking (or running) across the ground from u0 to u1 at distance f, then
// (stop) standing there; h above the ground (a roof, a ledge).
export function cross(R, o) {
  const len = Math.abs(o.u1 - o.u0);
  const run = len / o.v;
  const h = GROUND + (o.h || 0);
  const ph = R(0, 6);
  return {
    dur: run + (o.stop || 0),
    pos: (tau, out) => {
      const k = Math.min(1, tau / run);
      return out.set(
        o.u0 + (o.u1 - o.u0) * k,
        o.f,
        h + (k < 1 ? (o.bob ?? 0.06) * Math.abs(Math.sin(ph + tau * 9)) : 0)
      );
    }
  };
}
// Rolling and bouncing across the ground (a tumbleweed).
export function bounce(R, o) {
  const dir = o.dir ?? (R(0, 1) < 0.5 ? 1 : -1);
  const u0 = o.u0 ?? R(22, 28);
  const f = o.f ?? R(8, 24);
  const hop = o.hop ?? R(0.9, 1.6);
  const ph = R(0, 6);
  return {
    dur: (2 * u0) / o.v,
    pos: (tau, out) =>
      out.set(
        -dir * u0 + dir * o.v * tau,
        f + 0.4 * Math.sin(ph + tau),
        GROUND + 0.35 + hop * Math.abs(Math.sin(ph + tau * 2.4))
      )
  };
}

// Birds (or drones) of a world: [small, big] kinds, n of them through a wave,
// crossers, pairs, flushes (when there is cover to flush them from).
export function flyers(B, R, add, c, n, flushOK = false) {
  for (let k = 0; k < n; k++) {
    const t = 2 + (k * 26) / n + R(0, 1.5);
    const small = R(0, 1) < 0.45;
    const kind = small ? B[0] : B[1];
    const v = (small ? R(10, 13) : R(5.5, 7.5)) * c.S;
    const m = R(0, 1);
    if (kind === "drone") add(t, kind, dart(R, { v, h: R(4, 10) }));
    else if (m < 0.5) add(t, kind, across(R, { v, h: small ? R(4, 12) : R(3, 9), weave: small ? 2 : 0.8 }));
    else if (m < 0.75 && flushOK) add(t, kind, flush(R, { S: c.S * (small ? 1.3 : 1) }));
    else {
      const dir = R(0, 1) < 0.5 ? 1 : -1;
      const f = R(14, 26);
      add(t, kind, across(R, { v, dir, f, h: R(5, 10) }));
      add(t + R(0.3, 0.8), kind, across(R, { v, dir, f: f + R(-2, 2), h: R(5, 10) }));
    }
  }
}
