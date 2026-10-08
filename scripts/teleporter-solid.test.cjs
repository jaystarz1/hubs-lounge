const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const THREE = require("three");

// Runs the production teleporter component against a two-storey scene: an
// upper floor slab with a coffee table on it, a navmesh on both storeys and a
// hole in the upper navmesh under the table (as the build carves it).
function box(name, x1, x2, y1, y2, z1, z2) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, y2 - y1, z2 - z1), new THREE.MeshBasicMaterial());
  mesh.name = name;
  mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  return mesh;
}

function navMesh(rects) {
  const positions = [];
  for (const [x1, x2, z1, z2, y] of rects) {
    positions.push(x1, y, z1, x1, y, z2, x2, y, z2, x1, y, z1, x2, y, z2, x2, y, z1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  mesh.name = "NavMesh";
  mesh.visible = false;
  return mesh;
}

function loadTeleporter() {
  const env = new THREE.Group();
  env.add(box("UpperSlab", -6, 6, 3.3, 3.5, -6, 6));
  env.add(box("DenTable", -0.6, 0.6, 3.5, 3.8, -2.6, -1.4));
  // Upper storey wall at x=4 with a closed glass door; lower storey wall at z=8.
  env.add(box("WallUpperE", 4, 4.15, 3.5, 6, -6, 6));
  env.add(box("SaunaDoorGlass", -6, 6, 3.5, 5.6, 4, 4.05));
  env.add(box("WallLowerN", -15, 15, 0, 3.3, 8, 8.15));
  const nav = navMesh([
    [-15, 15, -15, 15, 0.002], // lower storey, reaching well past the upper one
    [-6, 6, -1.4, 6, 3.502], // upper storey, minus the table footprint
    [-6, 6, -6, -2.6, 3.502],
    [-6, -0.6, -2.6, -1.4, 3.502],
    [0.6, 6, -2.6, -1.4, 3.502]
  ]);
  env.add(nav);
  env.updateMatrixWorld(true);

  let def;
  const inputs = new Map();
  const scene = { systems: { userinput: { get: key => inputs.get(key) }, nav: { mesh: nav } } };
  const context = vm.createContext({
    THREE,
    AFRAME: { registerComponent: (name, d) => (def = d), scenes: [scene] },
    window: { APP: { store: { state: { preferences: { disableTeleporter: false } } } } },
    document: { getElementById: () => null, querySelector: sel => (sel === "#environment-scene" ? { object3D: env } : null) },
    textureLoader: { load: () => new THREE.Texture() },
    cylinderTextureSrc: "",
    SOUND_TELEPORT_START: 0,
    SOUND_TELEPORT_END: 1
  });
  const source = fs
    .readFileSync(require.resolve("../src/components/teleporter.js"), "utf8")
    .replace(/^import .*;\n/gm, "");
  vm.runInContext(source, context);

  const el = {
    object3D: new THREE.Object3D(),
    sceneEl: {
      is: () => true,
      object3D: new THREE.Scene(),
      systems: {
        "hubs-systems": {
          characterController: { isTeleportingDisabled: false, avatarPOV: { object3D: new THREE.Object3D() } },
          soundEffectsSystem: { playSoundLoopedWithGain: () => null, playSoundOneShot() {}, stopSoundNode() {} }
        }
      }
    }
  };
  if (!el.object3D.updateMatrices) {
    el.object3D.updateMatrices = () => el.object3D.updateMatrixWorld(true);
  }
  const component = Object.create(def);
  component.el = el;
  component.data = { start: "start", confirm: "confirm", speed: 12, hitCylinderColor: "#99ff99", hitCylinderRadius: 0.25, outerRadius: 0.6, hitCylinderHeight: 0.3 };
  component.init();

  return function aim(from, at) {
    el.object3D.position.set(...from);
    const direction = new THREE.Vector3(...at).sub(new THREE.Vector3(...from)).normalize();
    el.object3D.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    component.isTeleporting = false;
    inputs.set("start", true);
    inputs.set("confirm", false);
    component.tick(0, 16);
    return { hit: component.hit, point: component.hitPoint.clone() };
  };
}

test("teleport arc stops on furniture instead of dropping through to the storey below", () => {
  const aim = loadTeleporter();
  const table = aim([0, 4.7, 0], [0, 3.8, -2]);
  assert.equal(table.hit, false, `landed at ${table.point.toArray()} through the table`);
});

test("teleport arc still lands on open upper floor around the table", () => {
  const aim = loadTeleporter();
  const floor = aim([0, 4.7, 0], [3, 3.5, -1]);
  assert.equal(floor.hit, true, "open floor beside the table must stay reachable");
  assert.ok(Math.abs(floor.point.y - 3.502) < 0.01, `landed at height ${floor.point.y}`);
  const away = aim([0, 4.7, 0], [-3, 3.5, 2]);
  assert.equal(away.hit, true);
  assert.ok(Math.abs(away.point.y - 3.502) < 0.01);
});

test("teleport arc passes through walls and door glass into the next room", () => {
  const aim = loadTeleporter();
  const room = aim([2.5, 4.7, 0], [5, 3.5, 0]);
  assert.equal(room.hit, true, "wall must not stop the beam");
  assert.ok(Math.abs(room.point.y - 3.502) < 0.01, `landed at height ${room.point.y}`);
  const door = aim([0, 4.7, 2.5], [0, 3.5, 5]);
  assert.equal(door.hit, true, "glass door must not stop the beam");
  assert.ok(Math.abs(door.point.y - 3.502) < 0.01, `landed at height ${door.point.y}`);
  const lower = aim([0, 1.2, 6.5], [0, 0, 10]);
  assert.equal(lower.hit, true, "lower storey wall must not stop the beam");
  assert.ok(Math.abs(lower.point.y - 0.002) < 0.01);
});

test("teleport arc from the lower storey cannot go up through the ceiling", () => {
  const aim = loadTeleporter();
  const up = aim([0, 1.2, 0], [0, 6, -3]);
  assert.ok(!up.hit || up.point.y < 1, `landed upstairs at ${up.point.toArray()}`);
});
