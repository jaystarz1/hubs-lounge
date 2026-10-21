import { GROUND, SHIFT, lift } from "./shoots-art";

// The featured shoots on the Rovers roof (Jay, 2026-10-19): seven worlds, one
// per night, each a 30-minute round in waves inside a world drawn round the
// roof (shoots-art.js). Like the clay stands (skeet-range.js) everything is a
// fixed programme on the shared clock: a round is { sc, t0, seed, round } and
// every headset works out the same targets from it, so only hits go over the
// network.
//
// A round is 60 waves of 30 s:
//   0- 6 min  the opener: carnival-style targets dressed for the night
//   6-12      birds: small fast ones (25) and big slow ones (5)
//  12-15      a breather: a few slow targets and the golden one
//  15-24      the night's main event, speeding up
//  24-29      the push: everything at once
//  29-30      the finale, double points
// then a 2-minute break and the next round (the pick from the board, or the
// next night's world). Each round runs 15% faster, up to round 4.
//
// Range frame as in skeet-range.js: u to the shooter's right, f downrange, h
// up from the roof deck; the worlds' ground is at h = GROUND.

export const WAVE = 30;
export const WAVES = 60;
export const ROUND = WAVE * WAVES;
export const BREAK = 120;
export const CYCLE = ROUND + BREAK;
export const SCENARIOS = ["carnival", "duck", "deer", "boar", "bond", "safari", "hostage"];
const PHASES = [
  ["opener", 0, 12],
  ["birds", 12, 24],
  ["breather", 24, 30],
  ["main", 30, 48],
  ["push", 48, 58],
  ["finale", 58, 60]
];
export function phaseOf(w) {
  const p = PHASES.find(([, a, b]) => w >= a && w < b) || PHASES[PHASES.length - 1];
  return { key: p[0], from: p[1], to: p[2], p: (w - p[1]) / (p[2] - p[1]) };
}

// Points: the smaller and faster, the more. Don't-shoots cost 25.
const bird = (name, pts, r, sound) => ({ pts, r, dies: "fall", art: { bird: name }, face: "fly", sound });
const animal = (name, pts, r, hy, sound) => ({ pts, r, hy, dies: "fall", art: { animal: name }, face: "run", sound });
const card = (name, pts, r, sound = "thud", extra = {}) => ({
  pts,
  r,
  dies: "fall",
  art: { card: name },
  face: "board",
  sound,
  ...extra
});
const thing = (name, c, pts, r, dies, face, sound) => ({ pts, r, dies, art: { thing: name, c }, face, sound });
const DONT = { foe: true, name: "DON'T SHOOT!" };
export const SHOW_KINDS = {
  // small, fast birds: 25; big, slow ones: 5
  pigeon: bird("pigeon", 25, 0.3, "chirp"),
  teal: bird("teal", 25, 0.3, "quack"),
  crow: bird("crow", 25, 0.3, "caw"),
  starling: bird("starling", 25, 0.28, "chirp"),
  dove: bird("dove", 25, 0.3, "chirp"),
  lovebird: bird("lovebird", 25, 0.28, "chirp"),
  woodduck: bird("woodduck", 5, 0.6, "quack"),
  mallard: bird("mallard", 5, 0.5, "quack"),
  greygoose: bird("goose", 5, 0.65, "honk"),
  pheasant: bird("pheasant", 5, 0.5, "caw"),
  woodpigeon: bird("woodpigeon", 5, 0.45, "chirp"),
  peacock: bird("peacock", 5, 0.6, "honk"),
  vulture: bird("vulture", 5, 0.7, "caw"),
  drone: { ...thing("drone", 0, 25, 0.3, "fall", "level", "clank") },
  heli: { ...thing("heli", 0, 5, 1.3, "fall", "level", "ufo"), name: "HELICOPTER" },
  // carnival things and their disguises
  tinduck: card("tinduck", 10, 0.35, "ping"),
  star: thing("star", 0, 15, 0.3, "shatter", "spin", "ping"),
  balloonR: thing("balloon", 0xe8344a, 10, 0.3, "pop", "up", "pop"),
  balloonB: thing("balloon", 0x2f6fe8, 10, 0.3, "pop", "up", "pop"),
  balloonY: thing("balloon", 0xf2c230, 10, 0.3, "pop", "up", "pop"),
  balloonG: thing("balloon", 0x3ab54a, 10, 0.3, "pop", "up", "pop"),
  bigBalloon: { ...thing("bigBalloon", 0xb03ae8, 5, 0.6, "pop", "up", "pop") },
  clown: card("clown", 15, 0.4, "boing"),
  cannonman: { ...thing("cannonman", 0, 10, 0.5, "fall", "fly", "boing"), name: "HUMAN CANNONBALL" },
  decoy: thing("decoy", 0, 10, 0.35, "fall", "level", "thud"),
  tindeer: card("tindeer", 10, 0.5, "ping"),
  apple: thing("apple", 0, 15, 0.16, "shatter", "fixed", "splat"),
  turnip: thing("turnip", 0, 15, 0.2, "shatter", "fixed", "splat"),
  glass: thing("glass", 0, 15, 0.14, "shatter", "fixed", "glass"),
  chipR: thing("chip", 0xc0182a, 15, 0.18, "fall", "spin", "clank"),
  chipK: thing("chip", 0x151515, 15, 0.18, "fall", "spin", "clank"),
  cardH: thing("card", 0xc0182a, 15, 0.25, "fall", "spin", "thud"),
  cardS: thing("card", 0x151515, 15, 0.25, "fall", "spin", "thud"),
  tinzebra: card("tinzebra", 10, 0.5, "ping"),
  tingiraffe: card("tingiraffe", 10, 0.55, "ping"),
  coconut: thing("coconut", 0, 15, 0.2, "shatter", "tumble", "splat"),
  letterA: card("letterA", 10, 0.35, "ping"),
  letterB: card("letterB", 10, 0.35, "ping"),
  letterC: card("letterC", 10, 0.35, "ping"),
  // the main events
  deer: animal("deer", 10, 0.6, 1.65, "thud"),
  stag: { ...animal("stag", 25, 0.6, 1.9, "thud"), name: "THE STAG" },
  boar: animal("boar", 10, 0.5, 0.85, "squeal"),
  piglet: animal("piglet", 25, 0.25, 0.35, "squeal"),
  bigboar: { ...animal("bigboar", 25, 0.95, 1.5, "squeal"), name: "BIG TUSKER" },
  lion: animal("lion", 10, 0.65, 1.3, "roar"),
  lioness: animal("lioness", 10, 0.55, 1.15, "roar"),
  antelope: animal("antelope", 15, 0.45, 1.4, "thud"),
  zebra: animal("zebra", 5, 0.65, 1.45, "thud"),
  henchman: card("henchman", 10, 0.5),
  boss: { ...card("boss", 50, 0.45), name: "THE MASTERMIND" },
  bad: card("bad", 10, 0.5),
  taker: card("taker", 25, 0.19),
  // don't shoot
  dog: { ...card("dog", -25, 0.35, "wrong"), ...DONT },
  hiker: { ...card("hiker", -25, 0.5, "wrong"), ...DONT },
  farmer: { ...card("farmer", -25, 0.5, "wrong"), ...DONT },
  girl: { ...card("girl", -25, 0.5, "wrong"), ...DONT },
  ranger: { ...card("ranger", -25, 0.5, "wrong"), ...DONT },
  hostage: { ...card("hostage", -25, 0.45, "wrong"), ...DONT },
  mime: { ...card("mime", -25, 0.5, "wrong"), ...DONT, name: "IT'S THE MIME! DON'T SHOOT!" },
  // anywhere, now and then
  golden: { ...thing("gold", 0, 50, 0.3, "shatter", "spin", "bell"), name: "GOLDEN TARGET · 50" }
};

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

// ---- Paths: each returns { dur, pos(tau, out) } (+ hittable / turn / charge) --

function across(R, o = {}) {
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
function flush(R, o = {}) {
  const p = [o.u ?? R(-12, 12), o.f ?? R(10, 26), GROUND + 0.5];
  const v = [R(-5, 5) * (o.S || 1), R(2, 5) * (o.S || 1), R(5, 8) * (o.S || 1)];
  return {
    dur: o.dur ?? 5,
    pos: (tau, out) => out.set(p[0] + v[0] * tau, p[1] + v[1] * tau, p[2] + v[2] * tau - 0.6 * tau * tau)
  };
}
// Thrown up and falling back (coconuts, chickens, teal).
function toss(R, o = {}) {
  const p = [o.u ?? R(-10, 10), o.f ?? R(10, 20), o.h ?? GROUND + 0.5];
  const vh = o.vh ?? R(11, 15);
  const vu = o.vu ?? R(-1.5, 1.5);
  const g = 9.8;
  return {
    dur: (vh + Math.sqrt(vh * vh + 2 * g * Math.max(0, p[2] - GROUND))) / g,
    pos: (tau, out) => out.set(p[0] + vu * tau, p[1], p[2] + vh * tau - 0.5 * g * tau * tau)
  };
}
// Floating up (balloons), swaying.
function float(R, o = {}) {
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
// Running at the roof over the ground, zig-zagging, and a leap at the end. A
// charger that gets there costs everyone on the roof (charge: true).
function charge(R, o) {
  const u0 = o.u0 ?? R(-30, 30);
  const f0 = o.f0 ?? R(55, 75);
  const u1 = o.u1 ?? R(-6, 6);
  const f1 = 7;
  const dist = Math.hypot(u1 - u0, f1 - f0);
  const run = dist / o.v;
  const leap = 0.8;
  const zig = o.zig ?? R(0.5, 2.5);
  const ph = R(0, 6);
  const gait = o.gait ?? 9;
  return {
    dur: run + leap,
    charge: true,
    pos: (tau, out) => {
      const k = Math.min(1, tau / run);
      const fade = Math.min(1, (1 - k) * 4); // straightens up at the end
      out.set(
        u0 + (u1 - u0) * k + zig * fade * Math.sin(ph + tau * 1.7),
        f0 + (f1 - f0) * k,
        GROUND + o.bounce * Math.abs(Math.sin(tau * gait))
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
// Deer: walk out, stop and look, then bolt for the trees.
function stalk(R, o = {}) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = -dir * R(18, 30);
  const f = o.f ?? R(24, 42);
  const walk = R(2.5, 4.5) / (o.S || 1);
  const stop = R(1.2, 2.6) / (o.S || 1);
  const vw = 1.6;
  const vb = R(8, 11) * (o.S || 1);
  const away = R(0, 1) < 0.5;
  const bolt = away ? 2.2 : 3.2; // (into the trees, not out of the world)
  return {
    dur: walk + stop + bolt,
    pos: (tau, out) => {
      if (tau < walk) return out.set(u0 + dir * vw * tau, f, GROUND + 0.04 * Math.abs(Math.sin(tau * 5)));
      const uw = u0 + dir * vw * walk;
      if (tau < walk + stop) return out.set(uw, f, GROUND);
      const t = tau - walk - stop;
      return out.set(
        uw + dir * vb * t * (away ? 0.4 : 1),
        f + (away ? vb * t * 0.9 : 0),
        GROUND + 0.6 * Math.abs(Math.sin(t * 6))
      );
    }
  };
}
// Bounding across (antelope, zebra): hops.
function bound(R, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = R(26, 32);
  const f = o.f ?? R(16, 40);
  return {
    dur: (2 * u0) / o.v,
    pos: (tau, out) => out.set(-dir * u0 + dir * o.v * tau, f, GROUND + o.hop * Math.abs(Math.sin(tau * o.rate)))
  };
}
// A drone: fast, darting up and down.
function dart(R, o) {
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
function hover(R, o = {}) {
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
function cannon(R, o = {}) {
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

// ---- The worlds' programmes ----------------------------------------------------

// add(t, kind, path): a target thrown at t s into the wave. c: { I (wave
// intensity), S (speed, by round), p (progress through the phase) }.
const pick = (R, list) => list[Math.floor(R(0, list.length))];

// The birds wave and birds mixed into later phases: both sizes, crossers,
// pairs, flushes, overhead.
function birds(sc, R, add, c, n) {
  const B = SCREEN[sc].birds;
  for (let k = 0; k < n; k++) {
    const t = 2 + (k * 26) / n + R(0, 1.5);
    const small = R(0, 1) < 0.45;
    const kind = small ? B[0] : B[1];
    const v = (small ? R(10, 13) : R(5.5, 7.5)) * c.S;
    const m = R(0, 1);
    if (kind === "drone") add(t, kind, dart(R, { v, h: R(4, 10) }));
    else if (m < 0.5) add(t, kind, across(R, { v, h: small ? R(4, 12) : R(3, 9), weave: small ? 2 : 0.8 }));
    else if (m < 0.75 && SCREEN[sc].flush) add(t, kind, flush(R, { S: c.S * (small ? 1.3 : 1) }));
    else {
      const dir = R(0, 1) < 0.5 ? 1 : -1;
      const f = R(14, 26);
      add(t, kind, across(R, { v, dir, f, h: R(5, 10) }));
      add(t + R(0.3, 0.8), kind, across(R, { v, dir, f: f + R(-2, 2), h: R(5, 10) }));
    }
  }
}

// Per world: names, the birds [small, big], the don't-shoot, and the opener,
// main event and finale. Counts scale with c.I, speeds with c.S.
export const SCREEN = {
  carnival: {
    name: "CARNIVAL NIGHT",
    titles: [
      "STEP RIGHT UP!",
      "PIGEONS OVER THE MIDWAY",
      "TAKE A BREATHER",
      "THE BIG TOP",
      "THE MIDWAY GOES WILD",
      "BALLOON RELEASE · DOUBLE POINTS"
    ],
    birds: ["pigeon", "woodduck"],
    dont: "mime",
    music: "carnival",
    amb: "crowd",
    opener(R, add, c) {
      // balloons drifting up (the tin ducks, rabbits and stars are plates now)
      for (let k = 0; k < Math.round(2 + 3 * c.I); k++)
        add(R(1, 25), pick(R, ["balloonR", "balloonB", "balloonY", "balloonG"]), float(R, { v: R(1.2, 2) * c.S }));
    },
    main(R, add, c) {
      // (the clowns pop up from the booths as plates)
      if (R(0, 1) < 0.6) add(R(4, 20), "cannonman", cannon(R, { S: c.S }));
      for (let k = 0; k < Math.round(2 + 3 * c.I); k++)
        add(R(1, 25), pick(R, ["balloonR", "balloonB", "balloonY", "balloonG"]), float(R, { v: R(1.6, 3) * c.S }));
    },
    finale(R, add, c) {
      for (let k = 0; k < 40; k++)
        add(
          1 + k * 0.6,
          pick(R, ["balloonR", "balloonB", "balloonY", "balloonG", "bigBalloon"]),
          float(R, { v: R(2, 3.6) * c.S, f: R(9, 22) })
        );
      for (let k = 0; k < 3; k++) add(4 + k * 8, "cannonman", cannon(R, { S: c.S }));
    }
  },
  duck: {
    name: "DUCK HUNT",
    titles: [
      "THE DECOY POND",
      "FIRST FLIGHT",
      "TAKE A BREATHER",
      "THE FLYWAY",
      "OPENING DAY",
      "THE BIG FLUSH · DOUBLE POINTS"
    ],
    birds: ["teal", "mallard"],
    flush: true,
    dont: "dog",
    music: "duck",
    amb: "marsh",
    opener(R, add, c) {
      for (let k = 0; k < Math.round(1 + 2 * c.I); k++) add(R(3, 24), "mallard", flush(R, { S: c.S * 0.8 }));
    },
    main(R, add, c) {
      // flocks: a lead bird and its followers in a line
      const flocks = Math.round(2 + 2.5 * c.I);
      for (let k = 0; k < flocks; k++) {
        const t = 1 + k * (26 / flocks);
        const dir = R(0, 1) < 0.5 ? 1 : -1;
        const f = R(14, 30);
        const h = R(5, 12);
        const kind = R(0, 1) < 0.4 ? "teal" : R(0, 1) < 0.8 ? "mallard" : "greygoose";
        const v = (kind === "teal" ? R(11, 13) : kind === "mallard" ? R(6.5, 8) : R(5, 6)) * c.S;
        const size = kind === "greygoose" ? 5 : 3 + Math.floor(R(0, 3));
        for (let j = 0; j < size; j++)
          add(t + j * 0.35, kind, across(R, { v, dir, f: f + j * 0.8, h: h + Math.abs(j - size / 2) * 0.4, amp: 0.2 }));
      }
    },
    finale(R, add, c) {
      for (let k = 0; k < 4; k++)
        for (let j = 0; j < 9; j++)
          add(1 + k * 7 + j * 0.25, R(0, 1) < 0.4 ? "teal" : "mallard", flush(R, { S: c.S * 1.2 }));
    }
  },
  deer: {
    name: "DEER STALK",
    titles: [
      "TIN DEER & APPLES",
      "CROWS IN THE PINES",
      "TAKE A BREATHER",
      "AT THE FOREST EDGE",
      "THE RUT",
      "THE HERD CROSSES · DOUBLE POINTS"
    ],
    birds: ["crow", "pheasant"],
    flush: true,
    dont: "hiker",
    music: "deer",
    amb: "forest",
    opener(R, add, c) {
      birds("deer", R, add, c, Math.round(1 + 2 * c.I));
    },
    main(R, add, c) {
      const n = Math.round(2 + 3 * c.I);
      for (let k = 0; k < n; k++) add(1 + k * (24 / n), "deer", stalk(R, { S: c.S }));
      if (R(0, 1) < 0.35 + 0.3 * c.p) add(R(4, 18), "stag", stalk(R, { S: c.S * 1.2, f: R(40, 55) }));
      birds("deer", R, add, c, Math.round(1 + c.I));
    },
    finale(R, add, c) {
      for (let k = 0; k < 14; k++)
        add(
          1 + k * 1.8,
          k % 5 === 4 ? "stag" : "deer",
          bound(R, { v: R(7, 10) * c.S, hop: 0.9, rate: 5, f: R(18, 40) })
        );
    }
  },
  boar: {
    name: "BOAR CHARGE",
    titles: [
      "THE TURNIP PATCH",
      "OVER THE SCRUB",
      "TAKE A BREATHER",
      "BOAR IN THE BRUSH",
      "THE SOUNDER",
      "BIG TUSKER · DOUBLE POINTS"
    ],
    birds: ["starling", "woodpigeon"],
    flush: true,
    dont: "farmer",
    music: "boar",
    amb: "scrub",
    opener(R, add, c) {
      if (R(0, 1) < 0.5) add(R(5, 20), "piglet", charge(R, { v: 6 * c.S, bounce: 0.25, gait: 14, f0: R(30, 45) }));
    },
    main(R, add, c) {
      const n = Math.round(2 + 3 * c.I);
      for (let k = 0; k < n; k++)
        add(1 + k * (22 / n), "boar", charge(R, { v: R(5, 7) * c.S, bounce: 0.18, gait: 10 }));
      for (let k = 0; k < Math.round(c.I * 2); k++)
        add(R(2, 20), "piglet", charge(R, { v: R(7, 9) * c.S, bounce: 0.25, gait: 14, f0: R(35, 55) }));
    },
    finale(R, add, c) {
      add(2, "bigboar", charge(R, { v: 4.5 * c.S, bounce: 0.25, gait: 6, u0: 0, f0: 70, u1: 0, zig: 1 }));
      for (let k = 0; k < 12; k++)
        add(4 + k * 1.8, k % 3 ? "boar" : "piglet", charge(R, { v: R(6, 9) * c.S, bounce: 0.2, gait: 12 }));
    }
  },
  bond: {
    name: "SPY NIGHT · THE VILLAIN'S LAIR",
    titles: [
      "THE CHAMPAGNE BAR",
      "DOVES OFF THE CASINO",
      "TAKE A BREATHER",
      "HENCHMEN",
      "THE LAIR IS ON ALERT",
      "THE MASTERMIND · DOUBLE POINTS"
    ],
    birds: ["dove", "peacock"],
    dont: "girl",
    music: "bond",
    amb: "casino",
    opener(R, add, c) {
      for (let k = 0; k < Math.round(2 + 3 * c.I); k++) {
        const u = R(-10, 10);
        add(
          R(1, 25),
          pick(R, ["chipR", "chipK", "cardH", "cardS"]),
          toss(R, { u, f: R(11, 22), h: GROUND + 1.2, vh: R(8, 11) * c.S })
        );
      }
    },
    main(R, add, c) {
      // (the henchmen are in the lair's windows, as plates)
      if (R(0, 1) < 0.3 + 0.3 * c.p) add(R(2, 15), "heli", hover(R));
      birds("bond", R, add, c, Math.round(1 + c.I));
    },
    finale(R, add, c) {
      for (let k = 0; k < 3; k++) add(2 + k * 9, "heli", hover(R, { S: c.S }));
      birds("bond", R, add, c, 10);
    }
  },
  safari: {
    name: "SAFARI NIGHT",
    titles: [
      "THE TIN PARADE",
      "OVER THE WATERHOLE",
      "TAKE A BREATHER",
      "THE LIONS COME",
      "STAMPEDE SEASON",
      "THE PRIDE CHARGES · DOUBLE POINTS"
    ],
    birds: ["lovebird", "vulture"],
    dont: "ranger",
    music: "safari",
    amb: "savanna",
    opener(R, add, c) {
      for (let k = 0; k < Math.round(2 + 2 * c.I); k++)
        add(R(1, 25), "coconut", toss(R, { u: -7 + R(-0.6, 0.6), f: 18, h: GROUND + 7, vh: R(3, 6), vu: R(-2, 2) }));
    },
    main(R, add, c) {
      const n = Math.round(2 + 2.5 * c.I);
      for (let k = 0; k < n; k++)
        add(
          1 + k * (22 / n),
          R(0, 1) < 0.5 ? "lion" : "lioness",
          charge(R, { v: R(6, 8.5) * c.S, bounce: 0.3, gait: 7 })
        );
      for (let k = 0; k < Math.round(1 + 2 * c.I); k++)
        add(R(1, 22), R(0, 1) < 0.6 ? "antelope" : "zebra", bound(R, { v: R(6, 9) * c.S, hop: 0.8, rate: 4.5 }));
    },
    finale(R, add, c) {
      for (let k = 0; k < 10; k++)
        add(1 + k * 2.2, k % 3 ? "lioness" : "lion", charge(R, { v: R(7, 9.5) * c.S, bounce: 0.3, gait: 7 }));
    }
  },
  hostage: {
    name: "HOSTAGE RESCUE",
    titles: [
      "THE PRACTICE LINE",
      "DRONES!",
      "TAKE A BREATHER",
      "CLEAR THE HOUSE",
      "BREACH!",
      "THE LAST ROOM · DOUBLE POINTS"
    ],
    birds: ["drone", "heli"],
    dont: "hostage",
    music: "hostage",
    amb: "night",
    opener(R, add, c) {
      // (the practice line and the windows are plates; drones overhead)
      birds("hostage", R, add, c, Math.round(1 + c.I));
    },
    main(R, add, c) {
      birds("hostage", R, add, c, Math.round(2 + 2 * c.I));
    },
    finale(R, add, c) {
      birds("hostage", R, add, c, 12);
      add(4, "heli", hover(R));
    }
  }
};
// Now and then, anywhere: the golden target.
function extras(R, add, c, key) {
  if (key === "finale") return;
  const gold = key === "breather" ? 0.7 : key === "main" || key === "push" ? 0.25 : 0.1;
  if (R(0, 1) < gold) add(R(3, 22), "golden", across(R, { v: R(11, 14) * c.S, h: R(4, 10), weave: 2.5 }));
  // (the night's don't-shoot and the mime come up among the plates)
}
// ---- The round's waves ---------------------------------------------------------

const waveCache = new Map();

// Wave w of round `show` ({ sc, t0, seed, round }): { w, phase, title,
// launches }, each launch { id, kind, t0 (absolute s), dur, pos, ... }.
export function showWave(show, w) {
  const key = `${show.t0}|${show.sc}|${w}`;
  let s = waveCache.get(key);
  if (s) return s;
  const sc = SCENARIOS[show.sc] || SCENARIOS[0];
  const S0 = SCREEN[sc];
  const rnd = mulberry((show.seed >>> 0) ^ Math.imul(w + 1, 2654435761));
  const R = (a, b) => a + (b - a) * rnd();
  const ph = phaseOf(w);
  const I = [0.7, 1.0, 0.8, 1.25][w % 4] * (ph.key === "main" ? 1 + 0.5 * ph.p : 1);
  const c = { I, S: 1 + 0.15 * Math.min(3, Math.max(0, (show.round || 1) - 1)), p: ph.p };
  const launches = [];
  const base = show.t0 + w * WAVE;
  const add = (t, kind, L) => {
    if (t < 0 || t + L.dur > WAVE * 1.9) return;
    // (laid out as before; flown SHIFT m further out and over the lifted land)
    const path = L.pos;
    launches.push({
      id: `s${Math.round(show.t0)}.${w}.${launches.length}`,
      kind,
      t0: base + t,
      x2: ph.key === "finale",
      ...L,
      pos: (tau, out) => {
        path(tau, out);
        out.y += SHIFT;
        out.z += lift(out.y);
        return out;
      }
    });
  };
  if (ph.key === "opener") S0.opener(R, add, c);
  else if (ph.key === "birds") birds(sc, R, add, c, Math.round(5 + 4 * I));
  else if (ph.key === "breather") {
    const calm = { ...c, I: 0.35, S: c.S * 0.8 };
    S0.opener(R, add, calm);
  } else if (ph.key === "main") S0.main(R, add, c);
  else if (ph.key === "push") {
    S0.main(R, add, { ...c, I: I * 1.15 });
    birds(sc, R, add, c, Math.round(2 + 2 * I));
    S0.opener(R, add, { ...c, I: 0.3 });
  } else S0.finale(R, add, c);
  extras(R, add, c, ph.key);
  launches.sort((a, b) => a.t0 - b.t0);
  s = { w, phase: ph.key, title: S0.titles[PHASES.findIndex(p => p[0] === ph.key)], launches };
  waveCache.set(key, s);
  if (waveCache.size > 6) waveCache.delete(waveCache.keys().next().value);
  return s;
}

// The launches in the air at shared time T (this wave and the one before).
export function liveShow(show, T, out = []) {
  out.length = 0;
  const w = Math.floor((T - show.t0) / WAVE);
  for (const m of [w - 1, w]) {
    if (m < 0 || m >= WAVES) continue;
    for (const L of showWave(show, m).launches) {
      const tau = T - L.t0;
      if (tau >= 0 && tau <= L.dur) out.push(L);
    }
  }
  return out;
}

export function findShowLaunch(show, id) {
  if (!show || !String(id).startsWith("s")) return null;
  const [, w] = String(id).slice(1).split(".");
  const n = Number(w);
  if (!Number.isFinite(n) || n < 0 || n >= WAVES) return null;
  return showWave(show, n).launches.find(L => L.id === id) || null;
}

// Tonight's world by the starter's local day: Monday carnival ... Sunday hostage.
export function tonight(date = new Date()) {
  return (date.getDay() + 6) % 7;
}
