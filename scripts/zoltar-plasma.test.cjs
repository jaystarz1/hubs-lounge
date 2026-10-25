const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const P = require("../src/lounge/zoltar-plasma.cjs");

test("silent: target 0; speaking: floor, then follows loudness, capped at 1", () => {
  assert.equal(P.targetLevel(false, 1), 0);
  assert.equal(P.targetLevel(true, 0), P.CONFIG.SPEAK_FLOOR);
  assert.ok(P.targetLevel(true, 0.5) > P.CONFIG.SPEAK_FLOOR);
  assert.equal(P.targetLevel(true, 5), 1);
});

test("level rises fast and eases back down slowly, smoothly, never overshooting", () => {
  let l = 0;
  for (let i = 0; i < 12; i++) l = P.easeLevel(l, 1, 1 / 72);
  assert.ok(l > 0.6 && l <= 1, `attack reached ${l}`);
  let prev = l;
  for (let i = 0; i < 36; i++) {
    l = P.easeLevel(l, 0, 1 / 72); // half a second of silence
    assert.ok(l < prev && l >= 0);
    prev = l;
  }
  assert.ok(l > 0.2, "still easing after 0.5 s, not snapped off");
  for (let i = 0; i < 72 * 6; i++) l = P.easeLevel(l, 0, 1 / 72);
  assert.ok(l < 0.001);
});

test("easing is frame-rate independent and survives a long stall", () => {
  let a = 0, b = 0;
  for (let i = 0; i < 30; i++) a = P.easeLevel(a, 1, 1 / 30);
  for (let i = 0; i < 90; i++) b = P.easeLevel(b, 1, 1 / 90);
  assert.ok(Math.abs(a - b) < 1e-9);
  assert.ok(P.easeLevel(0, 1, 100) <= 1);
  assert.equal(P.easeLevel(0.5, 1, -1), 0.5);
});

test("idle is dim with few slow arcs; flare is brighter, more numerous, faster", () => {
  assert.equal(P.glowFor(0), P.CONFIG.IDLE_GLOW);
  assert.equal(P.glowFor(1), P.CONFIG.FLARE_GLOW);
  assert.ok(P.CONFIG.IDLE_GLOW < 0.5 * P.CONFIG.FLARE_GLOW);
  assert.equal(P.arcsFor(0), P.CONFIG.IDLE_ARCS);
  assert.equal(P.arcsFor(1), P.CONFIG.MAX_ARCS);
  assert.ok(P.lifeFor(1) < P.lifeFor(0));
});

function seeded() {
  let s = 12345;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}
const lit = a => {
  let n = 0;
  for (let i = 0; i < a.colors.length; i += 3 * a.segs * 2) {
    let m = 0;
    for (let j = i; j < i + 3 * a.segs * 2; j++) m = Math.max(m, a.colors[j]);
    if (m > 0.01) n++;
  }
  return n;
};
const peak = a => a.colors.reduce((m, v) => Math.max(m, v), 0);

test("arc field: arcs stay inside the glass, finite, and brightness/count follow level", () => {
  const R = 0.046;
  const a = P.createArcs(R, seeded());
  const run = (level, seconds) => {
    let maxLit = 0, maxPeak = 0;
    for (let f = 0, t = 0; f < 72 * seconds; f++, t += 1 / 72) {
      a.update(t, 1 / 72, level);
      maxLit = Math.max(maxLit, lit(a));
      maxPeak = Math.max(maxPeak, peak(a));
      for (let i = 0; i < a.positions.length; i += 3) {
        const r = Math.hypot(a.positions[i], a.positions[i + 1], a.positions[i + 2]);
        assert.ok(Number.isFinite(r) && r <= R * 1.25, `point outside glass: ${r}`);
      }
    }
    return { maxLit, maxPeak };
  };
  const idle = run(0, 6), flare = run(1, 6);
  assert.ok(idle.maxLit <= P.CONFIG.IDLE_ARCS);
  assert.ok(flare.maxLit > idle.maxLit);
  assert.ok(flare.maxPeak > 2 * idle.maxPeak);
});

test("update allocates nothing per call (typed arrays reused, same buffers)", () => {
  const a = P.createArcs(0.046, seeded());
  const [p, c] = [a.positions, a.colors];
  a.update(1, 1 / 72, 0.5);
  assert.equal(a.positions, p);
  assert.equal(a.colors, c);
});

test("zoltar.js wires the plasma to the speech analyser, not a timer", () => {
  const src = fs.readFileSync(__dirname + "/../src/lounge/zoltar.js", "utf8");
  assert.match(src, /zoltar-plasma\.cjs/);
  assert.match(src, /targetLevel\(!!this\.node, talk, awake\)/);
  assert.match(src, /easeLevel\(/);
  assert.match(src, /tickAtmosphere\(s, talk\)/);
  assert.match(src, /const talk = this\.level;/);
});

// --- Dark case and wake on speech ---------------------------------------------------------
test("awake without a clip holds a gentle crackle; asleep is 0; a clip still follows loudness", () => {
  assert.equal(P.targetLevel(false, 0, true), P.CONFIG.AWAKE_LEVEL);
  assert.equal(P.targetLevel(false, 1, false), 0);
  assert.ok(P.targetLevel(true, 0.9, true) > P.CONFIG.AWAKE_LEVEL);
});

test("wake: dark at rest, rises fast on a signal, holds, then eases to dark without snapping", () => {
  const w = P.createWake();
  const dt = 1 / 72;
  for (let i = 0; i < 36; i++) assert.equal(P.stepWake(w, false, dt), 0, "stays off with no signal");
  for (let i = 0; i < 36; i++) P.stepWake(w, true, dt); // half a second of speech
  assert.ok(w.level > 0.9, `lit within 0.5 s: ${w.level}`);
  let t = 0;
  while (t < P.CONFIG.WAKE_HOLD - 0.1) {
    P.stepWake(w, false, dt);
    t += dt;
  }
  assert.ok(w.level > 0.99, "still fully lit during the hold (no flicker between turns)");
  P.stepWake(w, true, dt); // next turn starts inside the hold: never dipped
  assert.ok(w.level > 0.99);
  assert.equal(P.CONFIG.WAKE_HOLD, 45, "hold is 45 s");
  assert.equal(P.WAKE_HOLD_SECONDS, P.CONFIG.WAKE_HOLD, "one named constant");
  for (let i = 0; i < 72 * 43; i++) P.stepWake(w, false, dt); // ~44.9 s since the last signal
  assert.ok(w.level > 0.99, "still lit just before 45 s");
  P.stepWake(w, true, dt); // new activity restarts the timer
  for (let i = 0; i < 72 * 44; i++) P.stepWake(w, false, dt);
  assert.ok(w.level > 0.99, "restarted: lit another ~44 s");
  for (let i = 0; i < 72 * 2.5; i++) P.stepWake(w, false, dt); // hold has ended, fade running
  let prev = w.level;
  assert.ok(prev < 0.9 && prev > 0, `easing, not snapped: ${prev}`);
  for (let i = 0; i < 72 * 4; i++) {
    const l = P.stepWake(w, false, dt);
    assert.ok(l <= prev);
    prev = l;
  }
  assert.equal(w.level, 0, "fully dark at the end");
});

test("wake is frame-rate independent and survives a stall", () => {
  const run = fps => {
    const w = P.createWake();
    for (let i = 0; i < fps; i++) P.stepWake(w, true, 1 / fps);
    return w.level;
  };
  assert.ok(Math.abs(run(30) - run(90)) < 1e-9);
  const w = P.createWake();
  assert.ok(P.stepWake(w, true, 100) <= 1);
});

test("dark case: asleep is a dim silhouette (not pitch black, not visible), veil clear when lit", () => {
  assert.equal(P.veilFor(0), P.CONFIG.OFF_VEIL);
  assert.ok(P.CONFIG.OFF_VEIL === 0.68 && P.CONFIG.OFF_VEIL >= 0.6 && P.CONFIG.OFF_VEIL <= 0.92, "faintly visible: some light gets through, but subtle");
  assert.ok(P.veilFor(0) < 1 && 1 - P.veilFor(0) >= 0.3, "silhouette visible at rest");
  assert.equal(P.veilFor(1), 0, "nothing covers Zoltar, the ball or his hands once lit");
  assert.equal(P.sideFor(0), P.CONFIG.OFF_VEIL);
  assert.equal(P.sideFor(1), P.CONFIG.SIDE_LIT);
  assert.ok(P.veilFor(0.5) < P.veilFor(0.2));
});

test("push-to-talk press and release with no speech keeps it lit 45 s from the release", () => {
  const w = P.createWake(), dt = 1 / 72;
  for (let i = 0; i < 72; i++) P.stepWake(w, true, dt); // button held 1 s, no clip, no reply
  for (let i = 0; i < 72 * 40; i++) P.stepWake(w, false, dt);
  assert.ok(w.level > 0.99, "lit 40 s after release");
  for (let i = 0; i < 72 * 8; i++) P.stepWake(w, false, dt);
  assert.equal(w.level, 0, "dark after the 45 s hold plus fade");
});

test("arcs are invisible when asleep (wake 0), full at wake 1", () => {
  const a = P.createArcs(0.05, seeded());
  for (let f = 0, t = 0; f < 72 * 3; f++, t += 1 / 72) a.update(t, 1 / 72, 1, 0);
  assert.equal(peak(a), 0);
  for (let f = 0, t = 3; f < 72 * 3; f++, t += 1 / 72) a.update(t, 1 / 72, 1, 1);
  assert.ok(peak(a) > 0.2);
});

test("GLB: ZoltarBall sits exactly where the plasma core goes; panels are inside the glass, clear of him", () => {
  const glbPath = __dirname + "/../../../lounge-assets/zoltar.glb";
  const buf = fs.readFileSync(glbPath);
  const jl = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.slice(20, 20 + jl).toString());
  const bin = buf.slice(20 + jl + 8);
  const node = gltf.nodes.find(n => n.name === "ZoltarBall");
  const prim = gltf.meshes[node.mesh].primitives[0];
  const acc = gltf.accessors[prim.attributes.POSITION], bv = gltf.bufferViews[acc.bufferView];
  const off = (bv.byteOffset || 0) + (acc.byteOffset || 0), stride = bv.byteStride || 12;
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < acc.count; i++)
    for (let k = 0; k < 3; k++) {
      const v = bin.readFloatLE(off + i * stride + k * 4) + (node.translation?.[k] || 0);
      lo[k] = Math.min(lo[k], v);
      hi[k] = Math.max(hi[k], v);
    }
  for (let k = 0; k < 3; k++) {
    assert.ok(Math.abs((lo[k] + hi[k]) / 2 - P.BALL_AT[k]) < 0.003, `ball centre axis ${k}: ${(lo[k] + hi[k]) / 2}`);
    assert.ok(Math.abs((hi[k] - lo[k]) / 2 - P.BALL_R) < 0.003, `ball radius axis ${k}`);
  }
  // The front veil stays clear of the ball's front (z 0.225) and hands; side panels inside the glass.
  assert.ok(P.CASE.zFront > P.BALL_AT[2] + P.BALL_R + 0.01);
  assert.ok(P.CASE.zFront < 0.2635, "veil is behind the front glass");
  assert.ok(P.CASE.x < 0.29 && P.CASE.x > 0.25);
});

test("wiring: zoltar.js wakes on voice-controls state and speech; corner globe is gone", () => {
  const src = fs.readFileSync(__dirname + "/../src/lounge/zoltar.js", "utf8");
  assert.match(src, /stepWake\(this\.wake, awake \|\| !!this\.node, dt\)/);
  assert.match(src, /setVoiceState\(/);
  assert.match(src, /veilFor\(wake\)/);
  assert.doesNotMatch(src, /GLOBE_AT|GLOBE_R/);
  const vc = fs.readFileSync(__dirname + "/../src/lounge/voice-controls.js", "utf8");
  assert.match(vc, /setVoiceState\(!!this\.recorder, this\.busy\)/);
  assert.ok((vc.match(/this\.wakeZoltar\(\)/g) || []).length >= 3, "start, stop and reply-end all signal");
});
