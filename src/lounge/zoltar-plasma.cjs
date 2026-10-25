// Zoltar's plasma globe (the crystal ball itself) and the dark case: pure logic, no THREE, so it is testable. The scene side is zoltar.js.
// One `level` (0 idle .. 1 full flare) drives glow, arc count and arc speed. It is eased from the
// real speech signal (the analyser loudness that also lights the eyes and crystal ball), fast up,
// slow down, so the flare never snaps off between words.
//
// TUNE HERE. Idle look: IDLE_GLOW, IDLE_ARCS. Flare look: FLARE_GLOW, MAX_ARCS, LIFE_FLARE.
// Reaction: ATTACK (higher = flares sooner), RELEASE (lower = lingers longer), LOUDNESS_GAIN, SPEAK_FLOOR.
//
// DARK CASE / WAKE (zoltar.js reads these): OFF_VEIL = how dark the case looks when asleep
// (0 clear .. 1 pitch black). 0.68 leaves a faint powered-but-unlit arcade cabinet silhouette
// (cabinet edges, glass, Zoltar's outline at ~32% of the room light, no glow: bulbs, eyes,
// ball, plasma and mist stay fully off); raise toward 1 for darker, lower for more visible. SIDE_LIT = how dark the side panels stay while awake,
// WAKE_IN / WAKE_OUT = fade speed per second (higher = faster; WAKE_OUT 2.5 is ~1.2 s to near
// black), WAKE_HOLD = seconds the case stays lit after the last signal (set by WAKE_HOLD_SECONDS, 45). AWAKE_LEVEL = plasma flare while Jay is speaking or Zoltar is thinking.
// How long the cabinet stays lit after the last activity (Zoltar's reply ends, or a push-to-talk
// press/release, even with no speech). Any new activity restarts it. Change this one number.
const WAKE_HOLD_SECONDS = 45;

const CONFIG = {
  OFF_VEIL: 0.68,
  SIDE_LIT: 0.5,
  WAKE_IN: 7,
  WAKE_OUT: 2.5,
  WAKE_HOLD: WAKE_HOLD_SECONDS,
  AWAKE_LEVEL: 0.3,
  IDLE_GLOW: 0.22, // 0..1 core/shell glow at rest
  FLARE_GLOW: 1.0, // glow at full flare
  IDLE_ARCS: 3, // arcs showing at rest
  MAX_ARCS: 10, // arcs at full flare (also the preallocated count)
  LIFE_IDLE: 1.4, // seconds an arc lives at rest (slow)
  LIFE_FLARE: 0.2, // seconds an arc lives at full flare (fast)
  ATTACK: 10, // per second, rise rate toward the speech target
  RELEASE: 1.4, // per second, fall rate once speech ends (~0.7 s to settle)
  LOUDNESS_GAIN: 1.4, // scales the 0..1 analyser loudness
  SPEAK_FLOOR: 0.35 // minimum flare while a reply is playing, so gaps between words do not dim it
};

const SEGS = 7; // segments per arc

const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);

// Flare target 0..1 from the play state and the analyser loudness. `awake` (Jay talking, or
// waiting for the reply) holds a gentle crackle when there is no clip yet.
function targetLevel(speaking, loudness, awake) {
  if (!speaking) return awake ? CONFIG.AWAKE_LEVEL : 0;
  return clamp01(Math.max(CONFIG.SPEAK_FLOOR, (loudness || 0) * CONFIG.LOUDNESS_GAIN));
}

// Frame-rate independent ease toward the target: fast attack, slow release.
function easeLevel(current, target, dt) {
  const rate = target > current ? CONFIG.ATTACK : CONFIG.RELEASE;
  return current + (target - current) * (1 - Math.exp(-rate * Math.min(Math.max(dt, 0), 0.25)));
}

// Wake state {level, hold}: `active` is true while Jay is recording, the reply is pending, or
// Zoltar is speaking. Rises fast, holds WAKE_HOLD after the last signal, then eases down.
function createWake() {
  return { level: 0, hold: 0 };
}
function stepWake(w, active, dt) {
  dt = Math.min(Math.max(dt, 0), 0.25);
  if (active) w.hold = CONFIG.WAKE_HOLD;
  else w.hold = Math.max(0, w.hold - dt);
  const target = active || w.hold > 0 ? 1 : 0;
  const rate = target > w.level ? CONFIG.WAKE_IN : CONFIG.WAKE_OUT;
  w.level += (target - w.level) * (1 - Math.exp(-rate * dt));
  if (target === 0 && w.level < 0.004) w.level = 0;
  return w.level;
}
// Case blackness for the front veil (0 clear when awake) and the side/back panels.
const veilFor = wake => CONFIG.OFF_VEIL * (1 - clamp01(wake));
const sideFor = wake => CONFIG.OFF_VEIL + (CONFIG.SIDE_LIT - CONFIG.OFF_VEIL) * clamp01(wake);

// Geometry in the model's local metres (glTF axes: +z front glass, y up). The plasma core sits
// at the centre of the crystal ball (ZoltarBall node, checked against the GLB by the test).
const BALL_AT = [0, 1.13, 0.15];
const BALL_R = 0.075;
// Dark interior panels, just inside the glass: front veil, two sides.
const CASE = { x: 0.285, y0: 0.97, y1: 1.9, zFront: 0.252, zBack: -0.245 };

const glowFor = level => CONFIG.IDLE_GLOW + (CONFIG.FLARE_GLOW - CONFIG.IDLE_GLOW) * clamp01(level);
const arcsFor = level => CONFIG.IDLE_ARCS + (CONFIG.MAX_ARCS - CONFIG.IDLE_ARCS) * clamp01(level); // fractional
const lifeFor = level => CONFIG.LIFE_IDLE + (CONFIG.LIFE_FLARE - CONFIG.LIFE_IDLE) * clamp01(level);

// Preallocated arc field: LineSegments-ready position and colour arrays, rewritten in place.
// `rnd` is injectable for tests.
function createArcs(radius, rnd = Math.random) {
  const n = CONFIG.MAX_ARCS;
  const positions = new Float32Array(n * SEGS * 2 * 3);
  const colors = new Float32Array(n * SEGS * 2 * 3);
  const dirs = new Float32Array(n * 3);
  const age = new Float32Array(n);
  const life = new Float32Array(n);
  const seed = new Float32Array(n);
  const pts = new Float32Array((SEGS + 1) * 3);

  const reroll = (i, level) => {
    const z = rnd() * 2 - 1;
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    dirs[i * 3] = r * Math.cos(a);
    dirs[i * 3 + 1] = z;
    dirs[i * 3 + 2] = r * Math.sin(a);
    life[i] = lifeFor(level) * (0.6 + rnd() * 0.8);
    seed[i] = rnd() * 100;
  };
  for (let i = 0; i < n; i++) {
    reroll(i, 0);
    age[i] = rnd() * life[i];
  }

  function update(t, dt, level, wake = 1) {
    const active = arcsFor(level);
    const glow = glowFor(level);
    for (let i = 0; i < n; i++) {
      age[i] += dt;
      if (age[i] >= life[i]) {
        age[i] = 0;
        reroll(i, level);
      }
      const fade = clamp01(active - i);
      // Brightness: each arc swells and fades over its life, so re-aims are never visible.
      const bright = fade * glow * wake * Math.sin((Math.PI * age[i]) / life[i]);
      const dx = dirs[i * 3], dy = dirs[i * 3 + 1], dz = dirs[i * 3 + 2];
      // Two vectors perpendicular to the arc direction, for the jitter.
      const hx = Math.abs(dy) < 0.9 ? 0 : 1, hy = Math.abs(dy) < 0.9 ? 1 : 0;
      let ux = hy * dz, uy = -hx * dz, uz = hx * dy - hy * dx;
      const ul = Math.hypot(ux, uy, uz) || 1;
      ux /= ul; uy /= ul; uz /= ul;
      const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
      const s = seed[i];
      const amp = radius * (0.1 + 0.08 * level);
      for (let k = 0; k <= SEGS; k++) {
        const f = k / SEGS;
        const env = Math.sin(Math.PI * f) * amp; // pinned at the core and at the glass
        const w1 = Math.sin(t * 14 + s * 3.1 + k * 2.3) * Math.cos(t * 9 + s + k * 1.7);
        const w2 = Math.sin(t * 11 + s * 1.7 + k * 3.1) * Math.cos(t * 13 + s * 2 + k * 1.3);
        const p = k * 3;
        pts[p] = dx * radius * f + (ux * w1 + vx * w2) * env;
        pts[p + 1] = dy * radius * f + (uy * w1 + vy * w2) * env;
        pts[p + 2] = dz * radius * f + (uz * w1 + vz * w2) * env;
      }
      for (let k = 0; k < SEGS; k++) {
        const o = (i * SEGS + k) * 6;
        for (let j = 0; j < 3; j++) {
          positions[o + j] = pts[k * 3 + j];
          positions[o + 3 + j] = pts[(k + 1) * 3 + j];
        }
        // Bright at the core, fading toward the glass; violet body, whiter near the core.
        for (let e = 0; e < 2; e++) {
          const f = (k + e) / SEGS;
          const b = bright * (1 - 0.65 * f);
          const c = o + e * 3;
          colors[c] = b * (0.55 + 0.45 * (1 - f));
          colors[c + 1] = b * (0.35 + 0.5 * (1 - f));
          colors[c + 2] = b;
        }
      }
    }
  }

  return { positions, colors, update, count: n, segs: SEGS };
}

module.exports = { WAKE_HOLD_SECONDS, CASE, BALL_AT, BALL_R, createWake, stepWake, veilFor, sideFor, CONFIG, SEGS, targetLevel, easeLevel, glowFor, arcsFor, lifeFor, createArcs };
