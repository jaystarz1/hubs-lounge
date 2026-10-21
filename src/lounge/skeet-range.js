import * as THREE from "three";

// The clay range on the Rovers roof (skeet.js): everything here is plain
// three.js with no Hubs in it, so the lab harness can drive it on its own.
//
// Range frame: u to the shooter's right, f downrange (south), h up from the
// roof deck, metres, origin on the deck midway between the two stands.
// Targets come from a fixed programme on the room's shared clock: time is cut
// into STAND-second stands, each stand is one event (crossers, ducks, teal...)
// drawn from a seeded shuffle, and a surprise is thrown in now and then. Every
// client works out the same targets from the same time, so nothing about them
// is sent over the network but the hits.

export const STAND = 45; // s per stand
const TITLE = 3; // s at the start of a stand before the first target

// Points: clays 25, ducks and the golden goose 5, the other surprises 25.
export const KINDS = {
  clay: { pts: 25, r: 0.2, dies: "shatter" },
  duck: { pts: 5, r: 0.42, dies: "fall", size: 1.4 },
  goose: { pts: 5, r: 0.7, dies: "fall", size: 1.4, name: "GOLDEN GOOSE" },
  chicken: { pts: 25, r: 0.38, dies: "fall", size: 1.3, name: "RUBBER CHICKEN" },
  melon: { pts: 25, r: 0.3, dies: "shatter", size: 1.2, name: "WATERMELON" },
  ufo: { pts: 25, r: 0.8, dies: "fall", size: 1.4, name: "FLYING SAUCER" },
  hat: { pts: 25, r: 0.33, dies: "fall", size: 1.3, name: "THE MIME'S HAT" }
};
const SURPRISES = ["goose", "chicken", "melon", "ufo", "hat"];

// Seeded randomness: the same stand number always gives the same stand.
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

// A launch: p0, v (range frame), a (constant acceleration), k (drag 1/s),
// dur (s), plus a path tweak for the flyers. pos() is the target at tau s.
function ballistic(p0, v, a, k, dur, extra = {}) {
  return { p0, v, a, k, dur, ...extra };
}

const LAUNCH = {
  // A clay crossing in front, from out past one side to the other.
  crosser(R, dir, o = {}) {
    const f = o.f ?? R(13, 24);
    return ballistic(
      [-dir * R(23, 27), f + R(-2, 2), o.h ?? R(-1.5, 2.5)],
      [dir * R(16, 19), R(-1.5, 1.5), R(5, 8)],
      [0, 0, -4.5],
      0.1,
      4.2
    );
  },
  // Out from under the parapet in front, going away.
  away(R) {
    return ballistic([R(-2, 2), 2.2, -0.8], [R(-4.5, 4.5), R(16, 19), R(6.5, 9)], [0, 0, -5], 0.15, 3.4);
  },
  // From the far tower, high, coming in over the stands (about 9 m up as
  // it passes in front, gone over the roof well above the heads).
  incoming(R) {
    const u = R(-7, 7);
    return ballistic([u, 40, R(3.5, 5)], [-u / 4 + R(-1.5, 1.5), -R(12.5, 14), R(5.5, 7)], [0, 0, -3], 0, 3.3);
  },
  // Springing straight up out of the street and dropping back.
  teal(R) {
    return ballistic([R(-10, 10), R(10, 18), -4], [R(-1, 1), R(-0.5, 0.5), R(15, 18)], [0, 0, -9.8], 0.02, 3.6);
  },
  // Ducks fly across at a steady 7-9.5 m/s and are gone past the far side.
  duck(R, dir, o = {}) {
    const u0 = R(28, 31);
    const vu = R(7, 9.5);
    return ballistic(
      [-dir * u0, o.f ?? R(12, 24), o.h ?? R(4, 10)],
      [dir * vu, R(-1, 1), R(-0.2, 0.6)],
      [0, 0, 0],
      0,
      (2 * u0) / vu,
      { bob: R(0, 6) }
    );
  },
  // A flush: up from below the parapet, scattering and climbing away.
  flush(R) {
    return ballistic([R(-3, 3), R(6, 11), -2], [R(-5, 5), R(3, 5.5), R(5, 7)], [0, 0, -1.6], 0, 5, { bob: R(0, 6) });
  },
  goose(R, dir) {
    return ballistic([-dir * 30, R(16, 22), R(8, 11)], [dir * 6.2, 0, 0], [0, 0, 0], 0, 9.6, { zig: R(0, 6) });
  },
  chicken(R) {
    return ballistic([R(-6, 6), 8, -3], [R(-3, 3), R(2, 4.5), R(16, 18)], [0, 0, -9.8], 0, 3.7, { tumble: 9 });
  },
  melon(R) {
    return ballistic([R(-5, 5), R(9, 12), -3], [R(-2, 2), R(0.5, 2), R(14, 16)], [0, 0, -9.8], 0, 3.3, { tumble: 2 });
  },
  ufo(R, dir) {
    return { dur: 6, ufo: { dir, f: R(18, 26), h: R(10, 13), stop: R(-6, 6) } };
  },
  hat(R, dir) {
    return ballistic([-dir * 28, R(10, 15), R(1, 3)], [dir * 13, R(-1, 1), R(3, 5)], [0, 0, -2.2], 0.05, 4.4, {
      spin: 14
    });
  }
};

// Each stand: a title and the launches, at times t (s from the stand start).
const STANDS = [
  {
    title: "CROSSERS · LEFT TO RIGHT",
    make(R, add) {
      for (let k = 0; k < 7; k++) add(TITLE + k * 5 + R(0, 1.5), "clay", LAUNCH.crosser(R, 1));
    }
  },
  {
    title: "CROSSERS · RIGHT TO LEFT",
    make(R, add) {
      for (let k = 0; k < 7; k++) add(TITLE + k * 5 + R(0, 1.5), "clay", LAUNCH.crosser(R, -1));
    }
  },
  {
    title: "DUCKS · LEFT TO RIGHT",
    make(R, add) {
      for (let k = 0; k < 5; k++) {
        const t = TITLE + k * 6.5;
        add(t, "duck", LAUNCH.duck(R, 1));
        if (k % 2) add(t + R(0.6, 1.2), "duck", LAUNCH.duck(R, 1));
      }
    }
  },
  {
    title: "DUCKS · RIGHT TO LEFT",
    make(R, add) {
      for (let k = 0; k < 5; k++) {
        const t = TITLE + k * 6.5;
        add(t, "duck", LAUNCH.duck(R, -1));
        if (k % 2 === 0) add(t + R(0.6, 1.2), "duck", LAUNCH.duck(R, -1));
      }
    }
  },
  {
    title: "HIGH TOWER · INCOMING",
    make(R, add) {
      for (let k = 0; k < 7; k++) add(TITLE + k * 5 + R(0, 1), "clay", LAUNCH.incoming(R));
    }
  },
  {
    title: "GOING AWAY",
    make(R, add) {
      for (let k = 0; k < 8; k++) add(TITLE + k * 4.3 + R(0, 1), "clay", LAUNCH.away(R));
    }
  },
  {
    title: "SPRINGING TEAL",
    make(R, add) {
      for (let k = 0; k < 7; k++) add(TITLE + k * 5 + R(0, 1), "clay", LAUNCH.teal(R));
    }
  },
  {
    title: "DOUBLES",
    make(R, add) {
      for (let k = 0; k < 5; k++) {
        const t = TITLE + k * 7;
        add(t, "clay", LAUNCH.crosser(R, 1, { h: R(-1, 0.5) }));
        add(t + R(0, 0.3), "clay", LAUNCH.crosser(R, -1, { h: R(1.5, 3) }));
      }
    }
  },
  {
    title: "DUCK FLUSH",
    make(R, add) {
      for (let k = 0; k < 3; k++) {
        const t = TITLE + k * 11;
        const n = 4 + Math.floor(R(0, 3));
        for (let j = 0; j < n; j++) add(t + j * R(0.15, 0.4), "duck", LAUNCH.flush(R));
      }
    }
  },
  {
    title: "RAPID FIRE",
    make(R, add) {
      for (let k = 0; k < 13; k++) add(TITLE + k * 2.6, "clay", LAUNCH.crosser(R, k % 2 ? -1 : 1));
    }
  },
  {
    title: "MIXED BAG",
    make(R, add) {
      for (let k = 0; k < 8; k++) {
        const t = TITLE + k * 4.4 + R(0, 0.8);
        const pick = Math.floor(R(0, 6));
        const dir = R(0, 1) < 0.5 ? 1 : -1;
        if (pick === 0) add(t, "clay", LAUNCH.crosser(R, dir));
        else if (pick === 1) add(t, "clay", LAUNCH.away(R));
        else if (pick === 2) add(t, "clay", LAUNCH.teal(R));
        else if (pick === 3) add(t, "clay", LAUNCH.incoming(R));
        else add(t, "duck", LAUNCH.duck(R, dir));
      }
    }
  }
];

const standCache = new Map();

// The stand at index n (n = floor(time / STAND)): { n, title, launches }, each
// launch { id, kind, t0 (absolute s), dur, ... }.
export function standAt(n) {
  let s = standCache.get(n);
  if (s) return s;
  const cycle = Math.floor(n / STANDS.length);
  const order = STANDS.map((_, i) => i);
  const shuffle = mulberry(cycle * 7919 + 13);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(shuffle() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const def = STANDS[order[((n % STANDS.length) + STANDS.length) % STANDS.length]];
  const rnd = mulberry(n * 2654435761 + 1);
  const R = (a, b) => a + (b - a) * rnd();
  const launches = [];
  const add = (t, kind, l) => launches.push({ id: `${n}.${launches.length}`, kind, t0: n * STAND + t, ...l });
  def.make(R, add);
  // The unexpected: most stands get one surprise, some two.
  const extra = rnd() < 0.75 ? (rnd() < 0.3 ? 2 : 1) : 0;
  for (let k = 0; k < extra; k++) {
    const kind = SURPRISES[Math.floor(rnd() * SURPRISES.length)];
    const dir = rnd() < 0.5 ? 1 : -1;
    const l = LAUNCH[kind](R, dir);
    add(R(TITLE + 4, STAND - l.dur - 1), kind, l);
  }
  launches.sort((a, b) => a.t0 - b.t0);
  s = { n, title: def.title, launches };
  standCache.set(n, s);
  if (standCache.size > 8) standCache.delete(standCache.keys().next().value);
  return s;
}

// Where launch L is (range frame) tau s after it was thrown.
export function launchPos(L, tau, out = new THREE.Vector3()) {
  if (L.pos) return L.pos(tau, out); // (a featured-shoot target: shoots.js)
  if (L.ufo) {
    // Swoops in from one side, stops and wobbles over the street, then
    // zips off the other way.
    const { dir, f, h, stop } = L.ufo;
    let u;
    if (tau < 2.2) {
      const e = tau / 2.2;
      u = -dir * 30 + (stop + dir * 30) * (1 - (1 - e) * (1 - e));
    } else if (tau < 4.2) u = stop + 0.6 * Math.sin((tau - 2.2) * 5);
    else u = stop + dir * 22 * (tau - 4.2) * (tau - 4.2) * 0.5;
    return out.set(u, f + 1.5 * Math.sin(tau * 1.3), h + 0.5 * Math.sin(tau * 3.1));
  }
  const { p0, v, a, k } = L;
  const s = k > 0 ? (1 - Math.exp(-k * tau)) / k : tau;
  out.set(
    p0[0] + v[0] * s + 0.5 * a[0] * tau * tau,
    p0[1] + v[1] * s + 0.5 * a[1] * tau * tau,
    p0[2] + v[2] * s + 0.5 * a[2] * tau * tau
  );
  if (L.bob !== undefined) out.z += 0.35 * Math.sin(L.bob + tau * 2.6);
  if (L.zig !== undefined) {
    out.z += 2.2 * Math.sin(L.zig + tau * 1.4);
    out.y += 3 * Math.sin(L.zig * 0.7 + tau * 0.9);
  }
  return out;
}

// The launches in the air at time T (from this stand and the one before).
export function liveLaunches(T, out = []) {
  out.length = 0;
  const n = Math.floor(T / STAND);
  for (const m of [n - 1, n]) {
    for (const L of standAt(m).launches) {
      const tau = T - L.t0;
      if (tau >= 0 && tau <= L.dur) out.push(L);
    }
  }
  return out;
}

// The range frame in the world: origin and unit axes (world vectors).
export class RangeFrame {
  constructor(origin, right, fwd, up) {
    this.o = origin.clone();
    this.r = right.clone().normalize();
    this.f = fwd.clone().normalize();
    this.up = up.clone().normalize();
  }
  // (out may be p itself)
  toWorld(p, out = new THREE.Vector3()) {
    const { x, y, z } = p;
    return out.copy(this.o).addScaledVector(this.r, x).addScaledVector(this.f, y).addScaledVector(this.up, z);
  }
}

// One shot: which live targets does it break? A shotgun's pattern opens as it
// goes (0.25 m + 3 cm per metre: about a metre across at 20 m); a bullet is a
// much smaller allowance (spread0, spreadK from GUN_TYPES). Plus the target's
// size. Shot is fast but not instant, so each target is tested where it will
// be when the shot gets there. Returns the launches hit.
const PELLET = 380; // m/s
const w = new THREE.Vector3();
const pr = new THREE.Vector3();
export function shotHits(frame, muzzle, dir, T, live, broken, spread0 = 0.25, spreadK = 0.03) {
  const hits = [];
  for (const L of live) {
    if (broken.has(L.id)) continue;
    if (L.hittable && !L.hittable(T - L.t0)) continue; // (down behind its cover, or edge-on)
    const hy = KINDS[L.kind].hy || 0; // (an animal's body is above its feet)
    launchPos(L, T - L.t0, pr).z += hy;
    frame.toWorld(pr, w);
    const far = w.distanceTo(muzzle);
    launchPos(L, Math.min(L.dur, T + far / PELLET - L.t0), pr).z += hy;
    frame.toWorld(pr, w);
    w.sub(muzzle);
    const along = w.dot(dir);
    if (along < 1 || along > 70) continue;
    const off = w.addScaledVector(dir, -along).length();
    if (off < spread0 + spreadK * along + KINDS[L.kind].r) hits.push(L);
  }
  return hits;
}

// The gun in two hands: it lies along the line from the rear hand (the one
// nearer the face: the trigger hand) to the front hand, with no roll (world
// up). With only one hand on it, it points where that controller points.
export const GUN = {
  twoHandMin: 0.14,
  twoHandMax: 0.95
};
// The guns: hands it takes, rounds a second while the trigger is held (0 =
// one per pull), the muzzle in the gun frame (origin at the grip, -z
// forward), and the hit allowance (see shotHits); a shotgun throws `pellets`
// rays at the gallery targets.
export const GUN_TYPES = {
  shotgun: {
    hands: 2,
    auto: 0,
    muzzle: new THREE.Vector3(0, 0.012, -0.84),
    spread0: 0.25,
    spreadK: 0.03,
    pellets: 9,
    cone: 0.022,
    sound: "shot",
    kick: 1,
    buzz: 1
  },
  rifle: {
    hands: 2,
    auto: 11,
    muzzle: new THREE.Vector3(0, 0.02, -0.66),
    spread0: 0.05,
    spreadK: 0.003,
    pellets: 1,
    cone: 0.003,
    sound: "rifle",
    kick: 0.35,
    buzz: 0.55
  },
  pistol: {
    hands: 1,
    auto: 0,
    muzzle: new THREE.Vector3(0, 0.052, -0.19),
    spread0: 0.07,
    spreadK: 0.004,
    pellets: 1,
    cone: 0.004,
    sound: "pistol",
    kick: 0.7,
    buzz: 0.7
  }
};
const UP = new THREE.Vector3(0, 1, 0);
const m4 = new THREE.Matrix4();
const ahead = new THREE.Vector3();
export function gunPose(rear, front, rearForward, outPos, outQuat) {
  const d = front ? ahead.subVectors(front, rear) : null;
  const len = d ? d.length() : 0;
  if (d && len > GUN.twoHandMin && len < GUN.twoHandMax) d.divideScalar(len);
  else ahead.copy(rearForward).normalize();
  // (an object turned by lookAt(eye, target) faces -z towards the target)
  const target = w.copy(rear).add(ahead);
  const up = Math.abs(ahead.y) > 0.98 ? pr.set(0, 0, 1) : UP;
  m4.lookAt(rear, target, up);
  outQuat.setFromRotationMatrix(m4);
  outPos.copy(rear);
  return d && len > GUN.twoHandMin && len < GUN.twoHandMax;
}

// ---- Meshes --------------------------------------------------------------

const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();
const std = (hex, rough = 0.6, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color: srgb(hex), roughness: rough, metalness: metal, ...extra });
const basic = hex => new THREE.MeshBasicMaterial({ color: srgb(hex) });

const MAT = {};
function mats() {
  if (MAT.walnut) return MAT;
  Object.assign(MAT, {
    walnut: std(0x5a2f17, 0.45),
    steel: std(0x2b2d31, 0.32, 0.85),
    blued: std(0x1c2230, 0.25, 0.9),
    brass: std(0xd8b25a, 0.3, 0.9),
    pad: std(0x141414, 0.9),
    clay: basic(0xff6a1a),
    clayRim: basic(0x2a1608),
    duck: std(0x6b4a2e, 0.8, 0, { emissive: srgb(0x241708) }),
    duckHead: std(0x1f6b3a, 0.5, 0, { emissive: srgb(0x0a2412) }),
    duckWing: std(0x8a7a66, 0.8, 0, { emissive: srgb(0x2a241c) }),
    bill: basic(0xf2b52a),
    gold: std(0xffc93c, 0.25, 0.95, { emissive: srgb(0x5a3a00) }),
    chicken: basic(0xffe14a),
    comb: basic(0xe02a2a),
    melon: std(0x1f6e2a, 0.5, 0, { emissive: srgb(0x0a2a10) }),
    melonStripe: std(0x8fd16a, 0.5, 0, { emissive: srgb(0x203a10) }),
    melonRed: basic(0xe8344a),
    ufo: std(0xc9ced6, 0.2, 0.95, { emissive: srgb(0x30343a) }),
    ufoDome: std(0x7fd6ff, 0.1, 0.2, { emissive: srgb(0x2a6a8a), transparent: true, opacity: 0.8 }),
    ufoLight: basic(0x7dff6a),
    hat: std(0x111111, 0.7, 0, { emissive: srgb(0x080808) }),
    hatBand: basic(0xb3122a),
    flash: new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, depthWrite: false }),
    smoke: new THREE.MeshBasicMaterial({ color: 0xcfcac2, transparent: true, opacity: 0.35, depthWrite: false }),
    tracer: new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.35, depthWrite: false })
  });
  return MAT;
}

function part(group, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.matrixNeedsUpdate = true;
  group.add(m);
  return m;
}
const box = (sx, sy, sz) => new THREE.BoxGeometry(sx, sy, sz);
const cyl = (r0, r1, h, n = 12) => new THREE.CylinderGeometry(r0, r1, h, n);
const ball = (r, n = 12) => new THREE.SphereGeometry(r, n, Math.max(6, n >> 1));

// The guns. Origin at the pistol grip (the trigger hand), -z forward along
// the barrel; a "kick" group takes the recoil, with a muzzle flash and a puff
// of smoke at the muzzle (hidden until a shot).
export function gunMesh(type = "shotgun") {
  const M = mats();
  const g = new THREE.Group();
  const kick = new THREE.Group(); // recoil moves this
  g.add(kick);
  if (type === "pistol") pistolBody(kick, M);
  else if (type === "rifle") rifleBody(kick, M);
  else shotgunBody(kick, M);
  const mz = GUN_TYPES[type].muzzle;
  const flash = part(kick, cyl(0.07, 0.0, 0.22, 10), M.flash, mz.x, mz.y, mz.z - 0.11, -Math.PI / 2);
  flash.scale.setScalar(type === "shotgun" ? 1 : 0.6);
  flash.visible = false;
  const smoke = part(kick, ball(0.06, 10), M.smoke.clone(), mz.x, mz.y, mz.z - 0.06);
  smoke.visible = false;
  g.userData = { kick, flash, smoke, muzzle: mz };
  return g;
}

// A semi-automatic pistol: slide, frame, grip.
function pistolBody(kick, M) {
  part(kick, box(0.03, 0.032, 0.2), M.steel, 0, 0.052, -0.085); // slide
  part(kick, box(0.028, 0.022, 0.15), M.blued, 0, 0.026, -0.07); // frame
  part(kick, box(0.03, 0.11, 0.05), M.pad, 0, -0.03, 0.015, 0.25); // grip
  part(kick, new THREE.TorusGeometry(0.018, 0.003, 6, 12, Math.PI), M.steel, 0, 0.012, -0.03, 0, Math.PI / 2, Math.PI); // guard
  part(kick, box(0.005, 0.02, 0.005), M.steel, 0, 0.012, -0.03, 0.3); // trigger
  part(kick, box(0.004, 0.008, 0.006), M.brass, 0, 0.071, -0.18); // front sight
  part(kick, box(0.022, 0.007, 0.006), M.steel, 0, 0.071, 0.005); // rear sight
}

// An M4-style carbine: collapsible stock, flat-top receiver with a carry
// handle, round handguard, front sight post, curved magazine.
function rifleBody(kick, M) {
  const black = M.pad;
  part(kick, cyl(0.014, 0.014, 0.2, 10), M.steel, 0, 0.035, 0.12, Math.PI / 2); // buffer tube
  part(kick, box(0.04, 0.085, 0.13), black, 0, 0.01, 0.26); // stock
  part(kick, box(0.042, 0.088, 0.012), M.steel, 0, 0.008, 0.33); // butt plate
  part(kick, box(0.03, 0.09, 0.04), black, 0, -0.045, 0.015, 0.3); // pistol grip
  part(kick, box(0.05, 0.06, 0.26), M.blued, 0, 0.035, -0.11); // receiver
  part(kick, box(0.012, 0.035, 0.12), black, 0, 0.083, -0.1); // carry handle
  part(kick, box(0.03, 0.01, 0.14), black, 0, 0.1, -0.1);
  part(kick, box(0.032, 0.14, 0.06), black, 0, -0.06, -0.14, -0.22); // magazine
  part(kick, box(0.006, 0.02, 0.006), M.steel, 0, -0.005, -0.03, 0.3); // trigger
  part(kick, cyl(0.026, 0.026, 0.3, 12), black, 0, 0.03, -0.39, Math.PI / 2); // handguard
  part(kick, cyl(0.009, 0.009, 0.13, 8), M.steel, 0, 0.02, -0.6, Math.PI / 2); // barrel
  part(kick, cyl(0.012, 0.012, 0.05, 8), M.steel, 0, 0.02, -0.64, Math.PI / 2); // flash hider
  part(kick, box(0.008, 0.07, 0.012), black, 0, 0.065, -0.555); // front sight post
}

// An over-and-under: walnut stock and forend, blued barrels, a brass bead.
function shotgunBody(kick, M) {
  part(kick, box(0.042, 0.05, 0.13), M.walnut, 0, -0.008, 0.06, -0.1); // wrist
  part(kick, box(0.046, 0.13, 0.24), M.walnut, 0, -0.045, 0.24, 0.1); // butt
  part(kick, box(0.048, 0.135, 0.02), M.pad, 0, -0.058, 0.365, 0.1); // recoil pad
  part(kick, box(0.036, 0.085, 0.05), M.walnut, 0, -0.055, 0.015, 0.35); // pistol grip
  part(kick, box(0.05, 0.068, 0.13), M.steel, 0, 0.004, -0.062); // receiver
  part(kick, box(0.006, 0.03, 0.006), M.steel, 0, -0.04, -0.035, 0.3); // trigger
  part(kick, new THREE.TorusGeometry(0.026, 0.004, 6, 14, Math.PI), M.steel, 0, -0.03, -0.035, 0, Math.PI / 2, Math.PI); // guard
  const barrel = cyl(0.0108, 0.0105, 0.71, 12);
  part(kick, barrel, M.blued, 0, 0.022, -0.48, Math.PI / 2);
  part(kick, barrel, M.blued, 0, 0.0, -0.48, Math.PI / 2);
  part(kick, box(0.009, 0.005, 0.7), M.blued, 0, 0.0355, -0.48); // rib
  part(kick, ball(0.0035, 8), M.brass, 0, 0.041, -0.83); // bead
  part(kick, ball(0.0025, 8), M.brass, 0, 0.039, -0.5); // mid bead
  part(kick, box(0.046, 0.04, 0.25), M.walnut, 0, -0.018, -0.27); // forend
}

function wing(M, side) {
  const pivot = new THREE.Group();
  part(pivot, box(0.34, 0.015, 0.16), M.duckWing, side * 0.17, 0, 0);
  return pivot;
}

// Target meshes face -z along their flight (skeet.js turns them).
export function targetMesh(kind) {
  const M = mats();
  const g = new THREE.Group();
  const ud = { wings: [] };
  if (kind === "clay") {
    // (Half as big again as a real 108 mm clay: in a headset a real one is a speck.)
    part(g, cyl(0.14, 0.155, 0.035, 18), M.clay, 0, 0, 0);
    part(g, cyl(0.158, 0.158, 0.01, 18), M.clayRim, 0, -0.02, 0);
  } else if (kind === "duck" || kind === "goose") {
    const s = kind === "goose" ? 1.55 : 1;
    const body = kind === "goose" ? M.gold : M.duck;
    const head = kind === "goose" ? M.gold : M.duckHead;
    const b = part(g, ball(0.13 * s, 12), body, 0, 0, 0);
    b.scale.set(1, 0.85, 1.75);
    part(g, ball(0.07 * s, 10), head, 0, 0.1 * s, -0.24 * s);
    if (kind === "goose") part(g, cyl(0.035, 0.045, 0.16, 8), M.gold, 0, 0.04, -0.2 * s, 0.9);
    part(g, box(0.05 * s, 0.018 * s, 0.08 * s), M.bill, 0, 0.09 * s, -0.31 * s);
    for (const side of [-1, 1]) {
      const wg = wing(M, side);
      wg.scale.setScalar(s);
      wg.position.set(side * 0.09 * s, 0.05 * s, -0.02);
      g.add(wg);
      ud.wings.push({ wg, side });
    }
  } else if (kind === "chicken") {
    // A rubber chicken: long, limp and very yellow.
    part(g, cyl(0.06, 0.05, 0.42, 10), M.chicken, 0, 0, 0, Math.PI / 2);
    part(g, ball(0.06, 10), M.chicken, 0, 0.04, -0.25);
    part(g, box(0.012, 0.05, 0.07), M.comb, 0, 0.1, -0.25);
    part(g, cyl(0.0, 0.02, 0.06, 6), M.bill, 0, 0.04, -0.32, -Math.PI / 2);
    part(g, cyl(0.012, 0.012, 0.22, 6), M.bill, 0.03, -0.08, 0.2, 0.6);
    part(g, cyl(0.012, 0.012, 0.22, 6), M.bill, -0.03, -0.08, 0.2, 0.6);
  } else if (kind === "melon") {
    const m = part(g, ball(0.2, 16), M.melon, 0, 0, 0);
    m.scale.set(1, 0.85, 1.2);
    for (let k = 0; k < 4; k++) {
      const st = part(g, new THREE.TorusGeometry(0.2, 0.012, 4, 24), M.melonStripe, 0, 0, 0, 0, (k * Math.PI) / 4, 0);
      st.scale.set(1, 0.85, 1.2);
    }
  } else if (kind === "ufo") {
    const disc = part(g, ball(0.55, 20), M.ufo, 0, 0, 0);
    disc.scale.set(1, 0.22, 1);
    part(g, ball(0.22, 14), M.ufoDome, 0, 0.12, 0);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const l = part(g, ball(0.045, 6), M.ufoLight.clone(), Math.cos(a) * 0.5, -0.02, Math.sin(a) * 0.5);
      ud.wings.push({ light: l, k });
    }
  } else if (kind === "hat") {
    part(g, cyl(0.1, 0.105, 0.2, 16), M.hat, 0, 0.1, 0);
    part(g, cyl(0.17, 0.17, 0.012, 20), M.hat, 0, 0, 0);
    part(g, cyl(0.106, 0.106, 0.035, 16), M.hatBand, 0, 0.03, 0);
  }
  // (Bigger than life, like the clays, to be seen at 20 m in a headset.)
  g.scale.setScalar(KINDS[kind].size || 1);
  g.userData = ud;
  return g;
}

// Debris for a broken target: colours by kind.
export const DEBRIS = {
  clay: [0xff6a1a, 0xff8a3a, 0x2a1608],
  duck: [0x8a7a66, 0xd9d2c4, 0x6b4a2e],
  goose: [0xffd84a, 0xfff3b0, 0xffc93c],
  chicken: [0xffe14a, 0xffffff],
  melon: [0xe8344a, 0x1f6e2a, 0xe8344a, 0x111111],
  ufo: [0x7dff6a, 0xc9ced6, 0xffd27a],
  hat: [0xffffff, 0xb3122a]
};

// ---- Sounds (made here, no files) -----------------------------------------

function render(ctx, dur, fn) {
  const sr = ctx.sampleRate;
  const n = Math.floor(dur * sr);
  const buf = ctx.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  fn(d, sr, n);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0) for (let i = 0; i < n; i++) d[i] *= 0.95 / peak;
  return buf;
}

export function makeSounds(ctx) {
  const rnd = mulberry(42);
  const noise = () => rnd() * 2 - 1;
  return {
    // A 12-bore: crack, boom, and the street throwing it back.
    shot: render(ctx, 1.1, (d, sr, n) => {
      let lp = 0;
      let lp2 = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const x = noise();
        const a = 0.08 + 0.85 * Math.exp(-t * 40);
        lp += a * (x - lp);
        const body = lp * (Math.exp(-t * 22) + 0.35 * Math.exp(-t * 5));
        const thump = Math.sin(2 * Math.PI * (48 + 40 * Math.exp(-t * 30)) * t) * Math.exp(-t * 14) * 0.9;
        const te = t - 0.24;
        lp2 += 0.06 * (x - lp2);
        const echo = te > 0 ? lp2 * 2.2 * Math.exp(-te * 7) : 0;
        d[i] = body + thump + echo;
      }
    }),
    // Clay breaking: a short dry crackle.
    clay: render(ctx, 0.22, (d, sr, n) => {
      let prev = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const x = noise() * (rnd() < 0.25 ? 1 : 0.2);
        d[i] = (x - prev) * Math.exp(-t * 18);
        prev = x;
      }
    }),
    // Melon: a wet thud.
    splat: render(ctx, 0.45, (d, sr, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        lp += 0.15 * (noise() - lp);
        d[i] = Math.sin(2 * Math.PI * 85 * t) * Math.exp(-t * 16) + lp * 1.6 * Math.exp(-t * 9);
      }
    }),
    // Goose: two honks.
    honk: render(ctx, 0.75, (d, sr, n) => {
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const k = t < 0.3 ? t : t - 0.38;
        const on = k >= 0 && k < 0.3 ? Math.sin((Math.PI * k) / 0.3) : 0;
        ph += (2 * Math.PI * (330 + 25 * Math.sin(t * 40))) / sr;
        const saw = ((ph / (2 * Math.PI)) % 1) * 2 - 1;
        d[i] = (saw * 0.7 + Math.sin(ph * 2) * 0.3) * on;
      }
    }),
    // Rubber chicken: the squeeze.
    squeak: render(ctx, 0.6, (d, sr, n) => {
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const f = 700 + 1100 * Math.sin(Math.PI * Math.min(1, t / 0.55));
        ph += (2 * Math.PI * f) / sr;
        d[i] = (Math.sin(ph) + 0.4 * Math.sin(ph * 2.01) + 0.2 * noise()) * Math.sin(Math.PI * Math.min(1, t / 0.6));
      }
    }),
    // Saucer going down.
    ufo: render(ctx, 1.2, (d, sr, n) => {
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        ph += (2 * Math.PI * (1400 * Math.exp(-t * 2) + 120)) / sr;
        d[i] = Math.sin(ph) * (0.6 + 0.4 * Math.sin(t * 60)) * Math.exp(-t * 1.6);
      }
    }),
    // Hat: a comedy "boing".
    boing: render(ctx, 0.7, (d, sr, n) => {
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        ph += (2 * Math.PI * (180 + 120 * Math.sin(t * 38) * Math.exp(-t * 3))) / sr;
        d[i] = Math.sin(ph) * Math.exp(-t * 4);
      }
    }),
    // A new stand.
    bell: render(ctx, 1.4, (d, sr, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        d[i] =
          (Math.sin(2 * Math.PI * 988 * t) +
            0.5 * Math.sin(2 * Math.PI * 1482 * t) +
            0.25 * Math.sin(2 * Math.PI * 2470 * t)) *
          Math.exp(-t * 3.2);
      }
    }),
    // 9 mm: a sharp crack.
    pistol: render(ctx, 0.6, (d, sr, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        lp += (0.15 + 0.8 * Math.exp(-t * 60)) * (noise() - lp);
        const te = t - 0.18;
        d[i] =
          lp * (Math.exp(-t * 35) + 0.2 * Math.exp(-t * 8)) +
          Math.sin(2 * Math.PI * 90 * t) * Math.exp(-t * 30) * 0.5 +
          (te > 0 ? lp * 0.5 * Math.exp(-te * 9) : 0);
      }
    }),
    // 5.56: harder and brighter, short so full auto stays crisp.
    rifle: render(ctx, 0.45, (d, sr, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        lp += (0.25 + 0.7 * Math.exp(-t * 80)) * (noise() - lp);
        const te = t - 0.15;
        d[i] =
          lp * (Math.exp(-t * 45) + 0.15 * Math.exp(-t * 10)) +
          Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t * 40) * 0.6 +
          (te > 0 ? lp * 0.35 * Math.exp(-te * 12) : 0);
      }
    }),
    // Steel ringing.
    ping: render(ctx, 0.9, (d, sr, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        d[i] =
          (Math.sin(2 * Math.PI * 1850 * t) +
            0.6 * Math.sin(2 * Math.PI * 2730 * t) +
            0.3 * Math.sin(2 * Math.PI * 4410 * t)) *
            Math.exp(-t * 6) +
          noise() * Math.exp(-t * 120) * 0.6;
      }
    }),
    gong: render(ctx, 3.5, (d, sr, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const w = 1 + 0.004 * Math.sin(t * 9);
        d[i] =
          (Math.sin(2 * Math.PI * 196 * w * t) +
            0.7 * Math.sin(2 * Math.PI * 287 * t) +
            0.5 * Math.sin(2 * Math.PI * 432 * w * t) +
            0.3 * Math.sin(2 * Math.PI * 611 * t)) *
          Math.exp(-t * 1.1) *
          Math.min(1, t * 60);
      }
    }),
    glass: render(ctx, 0.5, (d, sr, n) => {
      let prev = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const x = noise() * (rnd() < 0.08 ? 1 : 0.1);
        d[i] =
          ((x - prev) * 0.8 + Math.sin(2 * Math.PI * (3200 + 900 * Math.sin(t * 50)) * t) * 0.25) * Math.exp(-t * 9);
        prev = x;
      }
    }),
    clank: render(ctx, 0.4, (d, sr, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        d[i] =
          (Math.sin(2 * Math.PI * 820 * t) + 0.7 * Math.sin(2 * Math.PI * 1310 * t)) * Math.exp(-t * 14) +
          noise() * Math.exp(-t * 90) * 0.5;
      }
    }),
    pop: render(ctx, 0.2, (d, sr, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        lp += 0.5 * (noise() - lp);
        d[i] = lp * Math.exp(-t * 50);
      }
    }),
    thud: render(ctx, 0.35, (d, sr, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        lp += 0.2 * (noise() - lp);
        d[i] = Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t * 18) + lp * Math.exp(-t * 25);
      }
    }),
    // Featured shoots (shoots.js): a small bird, a crow, a boar, a lion, the
    // don't-shoot buzzer, a bonus ding.
    chirp: render(ctx, 0.3, (d, sr, n) => {
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const k = (t * 3) % 1;
        ph += (2 * Math.PI * (3200 + 1800 * Math.sin(k * Math.PI))) / sr;
        d[i] = Math.sin(ph) * Math.sin(Math.PI * Math.min(1, t / 0.3)) * (k < 0.7 ? 1 : 0);
      }
    }),
    caw: render(ctx, 0.5, (d, sr, n) => {
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        ph += (2 * Math.PI * (520 - 180 * t)) / sr;
        const saw = ((ph / (2 * Math.PI)) % 1) * 2 - 1;
        d[i] = (saw + 0.3 * noise()) * Math.sin(Math.PI * Math.min(1, t / 0.45)) * (t < 0.45 ? 1 : 0);
      }
    }),
    squeal: render(ctx, 0.6, (d, sr, n) => {
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        ph += (2 * Math.PI * (900 + 500 * Math.sin(t * 9) + 300 * t)) / sr;
        const sq = Math.sign(Math.sin(ph));
        d[i] = (sq * 0.6 + Math.sin(ph * 2) * 0.4) * Math.sin(Math.PI * Math.min(1, t / 0.6));
      }
    }),
    roar: render(ctx, 1.3, (d, sr, n) => {
      let lp = 0;
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        lp += 0.08 * (noise() - lp);
        ph += (2 * Math.PI * (95 + 30 * Math.sin(t * 3))) / sr;
        const env = Math.min(1, t * 6) * Math.exp(-Math.max(0, t - 0.5) * 3);
        d[i] = (lp * 3 + Math.sin(ph) * 0.8 + Math.sin(ph * 2.02) * 0.4) * env * (1 + 0.4 * Math.sin(t * 70));
      }
    }),
    wrong: render(ctx, 0.6, (d, sr, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const f = t < 0.28 ? 220 : 165;
        d[i] = Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.5 * (t % 0.3 < 0.26 ? 1 : 0);
      }
    }),
    ding: render(ctx, 0.6, (d, sr, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        d[i] = (Math.sin(2 * Math.PI * 1760 * t) + 0.4 * Math.sin(2 * Math.PI * 2640 * t)) * Math.exp(-t * 7);
      }
    }),
    // The trap throwing a clay, far off.
    thunk: render(ctx, 0.25, (d, sr, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        lp += 0.12 * (noise() - lp);
        d[i] = (lp * 2 + Math.sin(2 * Math.PI * 110 * t)) * Math.exp(-t * 22);
      }
    })
  };
}
