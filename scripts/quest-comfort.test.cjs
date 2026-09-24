const console = require("node:console");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const THREE = require("three");
const { StandingHeight } = require("../src/lounge/standing-height.cjs");
const read = p => fs.readFileSync(require.resolve("../src/" + p), "utf8");

test("seated Quest calibrates to standing, preserves crouching, resets per session and bypasses seats", () => {
  const h = new StandingHeight();
  assert.equal(h.sample(0, 1.6, true, false), 0);
  assert.equal(h.sample(800, 1.05, true, false), 0.55);
  assert.equal(h.sample(900, 0.8, true, false), 0.55, "leaning must not continually change calibration");
  assert.equal(h.sample(1000, 1.05, false, false), 0);
  assert.equal(h.sample(1100, 0.5, true, true), 0, "never calibrate from an authored chair");
  h.sample(1200, 1.8, true, false);
  assert.equal(h.sample(2000, 1.8, true, false), 0, "standing users must not gain extra height");
  h.reset();
  assert.equal(h.sample(0, NaN, true, false), 0);
  assert.equal(h.sample(1000, 0, true, false), 0);
  h.sample(2000, 1.15, true, false);
  assert.ok(Math.abs(h.sample(2800, 1.15, true, false) - 0.45) < 1e-9);
});

test("real WebXR driver publishes each Quest actuator and production haptics delivers touch pulses", async () => {
  const values = new Map();
  let now = 0;
  const idle = () => ({ held: null, hovered: null });
  const controller = new THREE.Object3D();
  const scene = {
    systems: {
      userinput: { get: key => values.get(key) },
      interaction: {
        state: { leftHand: idle(), rightHand: idle(), leftRemote: idle(), rightRemote: idle() }
      }
    }
  };
  const context = vm.createContext({
    THREE,
    Vector3: THREE.Vector3,
    Quaternion: THREE.Quaternion,
    performance: { now: () => now },
    AFRAME: { scenes: [scene] },
    document: { querySelector: () => ({ object3D: controller, components: { teleporter: { isTeleporting: false } } }) }
  });
  const evaluate = (file, extra = "") =>
    vm.runInContext(
      read(file)
        .replace(/^import .*;\n/gm, "")
        .replace(/export /g, "") + extra,
      context
    );
  evaluate("systems/userinput/paths.js", "\nglobalThis.paths = paths;");
  evaluate("systems/userinput/pose.js");
  evaluate("systems/userinput/devices/webxr-controller.js", "\nglobalThis.Device = WebXRControllerDevice;");
  // Isolate this file's scope: the production modules have separate lexical scopes.
  vm.runInContext(
    "{" +
      read("systems/haptic-feedback-system.js")
        .replace(/^import .*;\n/gm, "")
        .replace(/export /g, "") +
      "\nglobalThis.Haptics = HapticFeedbackSystem;}",
    context
  );
  const calls = [];
  const frame = { setValueType: (key, value) => values.set(key, value), setPose() {}, setMatrix4() {} };
  for (const hand of ["left", "right"]) {
    const actuator = {
      pulse: (strength, duration) => {
        calls.push({ hand, strength, duration });
        return Promise.resolve(true);
      }
    };
    const pad = { hand, axes: [0, 0, 0, 0], buttons: [], hapticActuators: [actuator] };
    new context.Device(pad).write(frame, { getPose: () => null }, {});
    assert.equal(values.get(context.paths.haptics.actuators[hand]), actuator, "missing Quest actuator");
  }
  const haptics = new context.Haptics();
  haptics.requestSocialPulse("both", 0.22, 80);
  haptics.tick({}, false, false);
  assert.deepEqual(
    calls.map(x => x.hand),
    ["left", "right"]
  );
  assert.ok(calls.every(x => x.strength === 0.22 && x.duration === 15));
  now = 100;
  haptics.tick({}, false, false);
  assert.equal(calls.length, 2, "expired touch must stop");
  values.clear();
  new context.Device({ hand: "left", axes: [], buttons: [] }).write(frame, { getPose: () => null }, {});
  haptics.requestSocialPulse("left");
  haptics.tick({}, false, false);
  assert.equal(calls.length, 2, "no actuator must safely do nothing");
});

test("production character tick lifts head and hands together without accumulating or altering seated waypoints", async () => {
  const rig = new THREE.Object3D();
  const pov = new THREE.Object3D();
  const hand = new THREE.Object3D();
  rig.add(pov, hand);
  pov.position.y = 1.05;
  hand.position.set(0.2, 0.8, -0.3);
  pov.matrixNeedsUpdate = hand.matrixNeedsUpdate = true;
  let vr = true;
  const scene = {
    is: state => state === "entered" || (state === "vr-mode" && vr),
    addEventListener() {},
    systems: {
      userinput: { get: () => undefined },
      nav: { pathfinder: { zones: {} } },
      "hubs-systems": { soundEffectsSystem: {}, waypointSystem: {} }
    }
  };
  const el = id => (id === "avatar-rig" ? { object3D: rig } : id === "avatar-pov-node" ? { object3D: pov } : null);
  const context = vm.createContext({
    THREE,
    StandingHeight,
    console,
    document: { getElementById: el },
    window: { APP: { store: { state: { preferences: {} } } } },
    AFRAME: { utils: { device: { isMobile: () => false } }, scenes: [scene] },
    waitForDOMContentLoaded: () => Promise.resolve(),
    qsTruthy: () => false
  });
  const run = s => vm.runInContext(s.replace(/export /g, ""), context);
  run(read("systems/userinput/paths.js"));
  run(read("utils/get-current-player-height.js"));
  const utils = read("utils/three-utils.js");
  run(utils.slice(utils.indexOf("const IDENTITY"), utils.indexOf("// Modified version of Don")));
  run(
    utils.slice(
      utils.indexOf("export const rotateInPlaceAroundWorldUp"),
      utils.indexOf("export function createPlaneBufferGeometry")
    )
  );
  run(
    read("systems/character-controller-system.js").replace(/^import[\s\S]*?;\n/gm, "") +
      "\nglobalThis.Controller=CharacterControllerSystem;"
  );
  const cc = new context.Controller(scene);
  await Promise.resolve();
  for (let t = 0; t < 2400; t += 16) cc.tick(t, 16);
  rig.updateMatrixWorld(true, true);
  assert.ok(Math.abs(pov.getWorldPosition(new THREE.Vector3()).y - 1.6) < 1e-6);
  assert.ok(Math.abs(hand.getWorldPosition(new THREE.Vector3()).y - 1.35) < 1e-6);
  assert.equal(pov.position.y, 1.05, "must preserve raw tracked head pose");
  assert.equal(hand.position.y, 0.8, "must preserve raw tracked hand pose");
  const standingY = rig.position.y;
  for (let t = 2400; t < 4800; t += 16) cc.tick(t, 16);
  assert.ok(Math.abs(rig.position.y - standingY) < 1e-6, "comfort lift accumulated");
  cc.findPositionOnNavMesh = (_start, end, out) => out.copy(end);
  cc.teleportTo(new THREE.Vector3(2, 3.4, 1));
  cc.tick(4800, 16);
  rig.updateMatrixWorld(true, true);
  assert.ok(
    Math.abs(pov.getWorldPosition(new THREE.Vector3()).y - 5.0) < 1e-6,
    "teleport lost standing height on the next storey"
  );
  cc.teleportTo(new THREE.Vector3(0, 0, 0));
  cc.tick(4808, 8);
  pov.position.y = 0.85;
  pov.matrixNeedsUpdate = true;
  cc.tick(4816, 16);
  rig.updateMatrixWorld(true, true);
  assert.ok(Math.abs(pov.getWorldPosition(new THREE.Vector3()).y - 1.4) < 1e-6, "crouch was flattened");
  // Emulate an authored seating relocation with the existing lift removed.
  cc.isMotionDisabled = true;
  rig.position.y = 0.2 + cc.loungeLift;
  rig.matrixNeedsUpdate = true;
  for (let t = 4832; t < 6000; t += 16) cc.tick(t, 16);
  assert.ok(Math.abs(rig.position.y - 0.35) < 1e-6, "standing calibration leaked into seat height");
  vr = false;
  cc.isMotionDisabled = false;
  for (let t = 6000; t < 7200; t += 16) cc.tick(t, 16);
  assert.ok(Math.abs(cc.loungeLift) < 1e-6, "VR lift persisted on desktop");
});
