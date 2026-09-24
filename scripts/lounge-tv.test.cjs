const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("wall TV gets sharp angled texture filtering without the removed counter monitor", () => {
  let component;
  const tvLive = [];
  const source = fs.readFileSync(require.resolve("../src/lounge/tv.js"), "utf8").replace(/^import .*;\n/gm, "");
  vm.runInNewContext(source, {
    URLSearchParams,
    qsTruthy: () => false,
    setTvLive: live => tvLive.push(live),
    window: { location: { hash: "" } },
    AFRAME: {
      registerSystem: (_name, value) => {
        component = value;
      }
    }
  });
  const map = { isVideoTexture: true, anisotropy: 1, needsUpdate: false };
  const material = { map };
  const system = {
    ...component,
    screens: { tv: {}, monitor: null },
    sceneEl: { renderer: { capabilities: { getMaxAnisotropy: () => 8 } } },
    pinned: new Set([{ isConnected: true, object3D: { traverse: fn => fn({ isMesh: true, material }) } }])
  };
  system.mirrorToMonitor();
  assert.equal(map.anisotropy, 8);
  assert.equal(map.needsUpdate, true);
  assert.deepEqual(tvLive, [true]);
});

function loadLights(saved) {
  const exports = {};
  const store = new Map(saved === undefined ? [] : [["lounge-lights-v1", String(saved)]]);
  const source = fs
    .readFileSync(require.resolve("../src/lounge/lights.js"), "utf8")
    .replace(/^import .*;\n/gm, "")
    .replace(/^export (?=function|class)/gm, "");
  const names = ["getLightLevel", "onLightLevel", "setLightLevel", "setTvLive"];
  vm.runInNewContext(`${source}\n${names.map(n => `exports.${n} = ${n};`).join("\n")}`, {
    exports,
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }
  });
  return { ...exports, store };
}

test("room lights dim to half while the TV is live and restore the viewer's level", () => {
  const lights = loadLights();
  const seen = [];
  lights.onLightLevel(level => seen.push(level));
  assert.equal(lights.getLightLevel(), 1);
  lights.setTvLive(true);
  assert.equal(lights.getLightLevel(), 0.5);
  lights.setTvLive(true); // repeated scans do not re-emit
  lights.setLightLevel(0.3); // adjusting during the show holds until it ends
  assert.equal(lights.getLightLevel(), 0.3);
  assert.equal(lights.store.has("lounge-lights-v1"), false);
  lights.setTvLive(false);
  assert.equal(lights.getLightLevel(), 1);
  assert.deepEqual(seen, [0.5, 0.3, 1]);
});

test("slider level is clamped, stepped and remembered; TV never brightens a dim room", () => {
  const lights = loadLights(0.4);
  assert.equal(lights.getLightLevel(), 0.4);
  lights.setLightLevel(0.03);
  assert.equal(lights.getLightLevel(), 0.1);
  lights.setLightLevel(0.74);
  assert.equal(lights.getLightLevel(), 0.7);
  assert.equal(lights.store.get("lounge-lights-v1"), "0.7");
  lights.setLightLevel(0.3);
  lights.setTvLive(true);
  assert.equal(lights.getLightLevel(), 0.3);
});
