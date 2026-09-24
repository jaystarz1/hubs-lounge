const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { sampleHandPose, expressionWeights } = require("../src/lounge/social-animation.cjs");
test("procedural hands remain bounded and clap targets never cross", () => {
  for (const name of ["wave", "clap", "dance", "sit"]) for (let t = 0; t < 12; t += .016) {
    for (const side of ["left", "right"]) {
      const p = sampleHandPose(name, side, t); if (!p) continue;
      assert.ok(p.position.every(Number.isFinite)); assert.ok(Math.hypot(...p.position) < .7);
      assert.ok(Math.hypot(...p.fingers) > .1); assert.ok(Math.hypot(...p.palm) > .1);
    }
    if (name === "clap") {
      const l = sampleHandPose(name, "left", t), r = sampleHandPose(name, "right", t);
      assert.ok(l.position[0] > r.position[0]); assert.equal(l.position[0], -r.position[0]);
    }
  }
});
test("expressions never take voice mouth ownership", () => {
  for (const name of ["smile", "sad", "surprise", "wink", "neutral"]) {
    const weights = expressionWeights(name, .3);
    assert.equal(weights.jawOpen, undefined); assert.equal(weights.mouthClose, undefined);
    assert.ok(Object.values(weights).every(v => v >= 0 && v <= 1));
  }
});
test("real component fades face and eyelashes, preserves jaw, resets neutral", () => {
  let component;
  const source = fs.readFileSync(require.resolve("../src/components/avatar-expression.js"), "utf8").replace(/^import .*;\n/, "");
  vm.runInNewContext(source, { expressionWeights, AFRAME: { registerComponent: (_name, c) => component = c } });
  const face = { morphTargetDictionary: { jawOpen: 0, mouthSmileLeft: 1, cheekSquintLeft: 2 }, morphTargetInfluences: [.63, 0, 0] };
  const lash = { morphTargetDictionary: { cheekSquintLeft: 0 }, morphTargetInfluences: [0] };
  let pose = { name: "smile", phase: .4 };
  const c = { ...component, el: { object3D: { traverse: fn => [face, lash].forEach(fn) }, sceneEl: { systems: { "lounge-social": { expressionFor: () => pose } } } } };
  c.init(); for (let t = 0; t < 500; t += 16) c.tock(t, 16);
  assert.ok(face.morphTargetInfluences[1] > .6); assert.ok(lash.morphTargetInfluences[0] > .14);
  assert.equal(face.morphTargetInfluences[0], .63);
  pose = null; for (let t = 500; t < 1500; t += 16) c.tock(t, 16);
  assert.ok(face.morphTargetInfluences[1] < .001); assert.equal(face.morphTargetInfluences[0], .63);
  c.remove(); assert.equal(lash.morphTargetInfluences[0], 0);
});
