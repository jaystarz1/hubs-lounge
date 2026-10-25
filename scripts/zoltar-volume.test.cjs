const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const V = require("../src/lounge/zoltar-volume.cjs");

const store = (init = {}) => ({
  data: { ...init },
  getItem(k) {
    return k in this.data ? this.data[k] : null;
  },
  setItem(k, v) {
    this.data[k] = String(v);
  }
});

test("display is 0..100 in steps of 5, default 50", () => {
  assert.equal(V.DEFAULT, 50);
  assert.equal(V.stepPercent(50, 1), 55);
  assert.equal(V.stepPercent(50, -1), 45);
  assert.equal(V.stepPercent(V.MAX, 1), 100);
  assert.equal(V.stepPercent(V.MIN, -1), 0);
  assert.equal(V.clampPercent("abc"), V.DEFAULT);
  assert.equal(V.clampPercent(9999), 100);
  assert.equal(V.clampPercent(-4), 0);
  assert.equal(V.clampPercent(48), 50);
});

test("loudness is unchanged at the anchors: 0 silent, 5 old min, 50 old 150%, 100 old 400%", () => {
  assert.equal(V.gainFor(0, false, 0), 0);
  assert.ok(Math.abs(V.gainFor(5, false, 0) - 0.25) < 1e-9);
  assert.ok(Math.abs(V.gainFor(50, false, 0) - 1.5) < 1e-9);
  assert.ok(Math.abs(V.gainFor(100, false, 0) - 4) < 1e-9);
});

test("every step above silence is the same loudness ratio within each half, and always rising", () => {
  for (let d = 5; d < 50; d += 5) {
    assert.ok(Math.abs(V.gainPercent(d + 5) / V.gainPercent(d) - 6 ** (1 / 9)) < 1e-9);
  }
  for (let d = 50; d < 100; d += 5) {
    assert.ok(Math.abs(V.gainPercent(d + 5) / V.gainPercent(d) - (400 / 150) ** 0.1) < 1e-9);
  }
  for (let d = 0; d < 100; d += 5) assert.ok(V.gainPercent(d + 5) > V.gainPercent(d));
});

test("louder than before is reachable (above 100% old gain)", () => {
  assert.ok(V.gainFor(100, false, 0) === 4);
});

test("old stored gain values migrate to the same loudness", () => {
  assert.equal(V.displayFromGain(150), 50);
  assert.equal(V.displayFromGain(400), 100);
  assert.equal(V.displayFromGain(25), 5);
  assert.equal(V.displayFromGain(100), 40);
  assert.equal(V.displayFromGain("junk"), 50);
  assert.deepEqual(V.load(store({ [V.OLD_KEY]: "400", [V.AUTO_KEY]: "1" })), { percent: 100, auto: true });
  assert.deepEqual(V.load(store({ [V.OLD_KEY]: "150" })), { percent: 50, auto: false });
  assert.deepEqual(V.load(store({ [V.OLD_KEY]: "400", [V.KEY]: "30" })), { percent: 30, auto: false });
});

test("volume and auto persist across sessions", () => {
  const s = store();
  assert.deepEqual(V.load(s), { percent: V.DEFAULT, auto: false });
  V.save(s, 85, true);
  assert.deepEqual(V.load(store(s.data)), { percent: 85, auto: true });
  assert.deepEqual(
    V.load({
      getItem() {
        throw new Error("blocked");
      }
    }),
    { percent: V.DEFAULT, auto: false }
  );
});

test("auto boost: none when quiet, up to 2x when loud, smooth between, off means ignored", () => {
  assert.equal(V.autoBoost(0), 1);
  assert.equal(V.autoBoost(0.01), 1);
  assert.equal(V.autoBoost(0.5), 2);
  const mid = V.autoBoost(0.085);
  assert.ok(mid > 1 && mid < 2);
  assert.equal(V.autoBoost(NaN), 1);
  assert.equal(V.gainFor(50, false, 0.5), 1.5);
  assert.equal(V.gainFor(50, true, 0.5), 3);
});

test("wiring: zoltar applies the gain to its own node, panel has the buttons", () => {
  const z = fs.readFileSync(require.resolve("../src/lounge/zoltar.js"), "utf8");
  const c = fs.readFileSync(require.resolve("../src/lounge/voice-controls.js"), "utf8");
  assert.match(z, /node\.setVolume|this\.node\?\.setVolume/);
  assert.match(z, /createDynamicsCompressor/);
  assert.match(c, /changeVolume/);
  assert.match(c, /toggleAuto/);
});
