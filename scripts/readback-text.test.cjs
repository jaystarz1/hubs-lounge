const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const R = require("../src/lounge/readback-text.cjs");

// 10 px per character at any font size ratio: width = chars * font / 2
const measure = (t, f) => (t.length * f) / 2;

test("wraps to the width and never splits a word", () => {
  const lines = R.wrapWords("the quick brown fox jumps", 100, t => t.length * 10);
  assert.deepEqual(lines, ["the quick", "brown fox", "jumps"]);
});

test("short text gets the biggest type", () => {
  assert.equal(R.fit("Hello", 900, 800, measure).font, 120);
});

test("long text shrinks the type until it fits", () => {
  const text = "word ".repeat(60).trim();
  const r = R.fit(text, 900, 800, measure);
  assert.ok(r.font < 120 && r.font >= 34);
  assert.ok(r.lines.length * r.font * 1.18 <= 800);
});

test("text too long even at the smallest type is cut with an ellipsis", () => {
  const r = R.fit("word ".repeat(2000), 900, 300, measure);
  assert.equal(r.font, 34);
  assert.ok(r.lines.at(-1).endsWith("..."));
  assert.ok(r.lines.length * 34 * 1.18 <= 300);
});

test("held then faded then gone", () => {
  assert.equal(R.alpha(0), 1);
  assert.equal(R.alpha(R.HOLD_MS), 1);
  assert.ok(Math.abs(R.alpha(R.HOLD_MS + R.FADE_MS / 2) - 0.5) < 1e-9);
  assert.equal(R.alpha(R.HOLD_MS + R.FADE_MS), 0);
});

test("voice panel uses the readback screen and has no DOM overlay", () => {
  const src = fs.readFileSync(__dirname + "/../src/lounge/voice-controls.js", "utf8");
  assert.match(src, /new ReadbackScreen\(/);
  assert.match(src, /panel\.show\(/);
  assert.doesNotMatch(src, /document\.body/);
});

test("layout: heard line is capped, reply gets the rest, all of it fits", () => {
  const blocks = [
    { text: "what did I say " + "word ".repeat(30), color: "a", max: 56 },
    { text: "reply " + "word ".repeat(80), color: "b" }
  ];
  const laid = R.layout(blocks, 900, 700, 40, 24, measure);
  assert.equal(laid.length, 2);
  assert.equal(laid[0].color, "a");
  assert.ok(laid[0].font <= 56);
  const used = laid.reduce((n, b) => n + b.lines.length * b.font * 1.18, 0) + 24;
  assert.ok(used <= 700 - 80 + 1);
});

test("readback shows only when faded in and the TV is not live", () => {
  assert.equal(R.visible(1, false), true);
  assert.equal(R.visible(0.4, false), true);
  assert.equal(R.visible(0, false), false);
  assert.equal(R.visible(1, true), false);
});

test("readback is on the TV, gated on live content; small black screen is gone", () => {
  const src = fs.readFileSync(__dirname + "/../src/lounge/voice-controls.js", "utf8");
  assert.match(src, /new ReadbackScreen\(\s*scene,\s*this\.anchor,\s*this\.rotation,\s*0,\s*0,\s*2\.55,\s*1\.43,/);
  assert.match(src, /lounge-tv"\]\?\.live/);
  assert.doesNotMatch(src, /0\.7, 0\.67/);
  const tv = fs.readFileSync(__dirname + "/../src/lounge/tv.js", "utf8");
  assert.match(tv, /this\.live = !!liveMaterial/);
  const screen = fs.readFileSync(__dirname + "/../src/lounge/readback-screen.js", "utf8");
  assert.match(screen, /visible\(a, this\.isLive\(\)\)/);
});

test("voice panel buttons form one column with no gap and stay on the wall panel", () => {
  const src = fs.readFileSync(__dirname + "/../src/lounge/voice-controls.js", "utf8");
  const uniq = new Map();
  for (const m of src.matchAll(/\.add\(X(?: [-+] 0\.27)?, (-?[\d.]+), ([\d.]+), ([\d.]+),/g)) uniq.set(m[1], { y: +m[1], h: +m[3] });
  const col = [...uniq.values()].sort((a, b) => b.y - a.y);
  assert.equal(col.length, 5);
  for (let i = 1; i < col.length; i++) {
    const gap = col[i - 1].y - col[i - 1].h / 2 - (col[i].y + col[i].h / 2);
    assert.ok(gap >= 0 && gap <= 0.05, `gap ${gap} between rows ${i - 1} and ${i}`);
  }
  assert.ok(col[0].y + col[0].h / 2 <= 0.75 && col.at(-1).y - col.at(-1).h / 2 >= -0.75);
});
