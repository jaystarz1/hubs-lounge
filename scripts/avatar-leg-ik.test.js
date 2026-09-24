// Runs the production component against the actual bundled GLBs, without a
// browser, network, texture decoding or generated output files.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const THREE = require("three");

const base = path.resolve(__dirname, "..");
let component;
vm.runInNewContext(fs.readFileSync(path.join(base, "src/components/avatar-leg-ik.js"), "utf8"), {
  THREE,
  AFRAME: { registerComponent: (_name, value) => (component = value) }
});

async function loadAvatar(who) {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const filename = path.join(base, `src/assets/models/lounge-avatars/avatar-${who}-real.glb`);
  const bytes = fs.readFileSync(filename);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength));
  const stats = {
    bytes: bytes.length,
    joints: json.skins[0].joints.length,
    triangles: json.meshes
      .flatMap(mesh => mesh.primitives)
      .reduce((sum, primitive) => sum + json.accessors[primitive.indices].count / 3, 0),
    morphs: Math.max(...json.meshes.map(mesh => mesh.extras?.targetNames?.length || 0)),
    voiceMeshes: json.nodes.filter(
      node => node.extensions?.MOZ_hubs_components?.["morph-audio-feedback"]?.name === "jawOpen"
    ).length
  };
  // Geometry, morphs, joint matrices and hierarchy are unchanged in memory.
  // Drop materials only so Node does not try to instantiate browser images.
  delete json.images;
  delete json.textures;
  delete json.materials;
  json.meshes.forEach(mesh => mesh.primitives.forEach(primitive => delete primitive.material));
  let jsonBytes = Buffer.from(JSON.stringify(json));
  jsonBytes = Buffer.concat([jsonBytes, Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 32)]);
  const geometryOnly = Buffer.concat([bytes.subarray(0, 20), jsonBytes, bytes.subarray(20 + jsonLength)]);
  geometryOnly.writeUInt32LE(geometryOnly.length, 8);
  geometryOnly.writeUInt32LE(jsonBytes.length, 12);
  const gltf = await new GLTFLoader().parseAsync(
    geometryOnly.buffer.slice(geometryOnly.byteOffset, geometryOnly.byteOffset + geometryOnly.byteLength),
    ""
  );
  return { gltf, stats };
}

function floorMesh() {
  // Ground floor and mezzanine, in the same hidden navigation mesh.
  const positions = [];
  for (const y of [0, 3.4]) {
    positions.push(-5, y, -5, 5, y, 5, 5, y, -5, -5, y, -5, -5, y, 5, 5, y, 5);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.visible = false;
  mesh.raycast = () => assert.fail("the solver must not call or replace the source navmesh raycast");
  return mesh;
}

function snapshot(object) {
  object.updateMatrixWorld(true, true);
  return ["Hips", "Spine", "Head", "LeftHand", "RightHand"].map(name => {
    const bone = object.getObjectByName(name);
    return {
      bone,
      position: bone.getWorldPosition(new THREE.Vector3()),
      quaternion: bone.getWorldQuaternion(new THREE.Quaternion())
    };
  });
}

function assertUnchanged(before, label) {
  for (const { bone, position, quaternion } of before) {
    assert.ok(
      bone.getWorldPosition(new THREE.Vector3()).distanceTo(position) < 1e-7,
      `${label}: ${bone.name} position moved`
    );
    assert.ok(
      1 - Math.abs(bone.getWorldQuaternion(new THREE.Quaternion()).dot(quaternion)) < 1e-7,
      `${label}: ${bone.name} rotation moved`
    );
  }
}

function assertLengths(comp, scale, label) {
  for (const rig of comp.rigs) {
    const upper = rig.upper.getWorldPosition(new THREE.Vector3());
    const lower = rig.lower.getWorldPosition(new THREE.Vector3());
    const foot = rig.foot.getWorldPosition(new THREE.Vector3());
    assert.ok(Math.abs(upper.distanceTo(lower) - rig.upperLength * scale) < 1e-5, `${label}: thigh stretched`);
    assert.ok(Math.abs(lower.distanceTo(foot) - rig.lowerLength * scale) < 1e-5, `${label}: shin stretched`);
  }
}

for (const who of ["jay", "her"]) {
  test(`${who}: actual full-body GLB, head/wrist invariants, posture, navmesh levels and no stretch`, async () => {
    const { gltf, stats } = await loadAvatar(who);
    assert.equal(stats.joints, 29);
    assert.equal(stats.morphs, 51);
    assert.equal(stats.voiceMeshes, 2);
    assert.equal(gltf.animations.length, 0);
    const root = new THREE.Group();
    root.add(gltf.scene);
    root.updateMatrixWorld(true, true);
    root.traverse(object => (object.matrixAutoUpdate = false));
    assert.equal(root.getObjectByName("LeftHand").parent.name, "Spine");
    assert.equal(root.getObjectByName("RightHand").parent.name, "Spine");
    assert.equal(root.getObjectByName("Spine1"), undefined);
    assert.equal(root.getObjectByName("LeftHandIndex1"), undefined);
    const nav = { mesh: floorMesh() };
    let pose = null;
    const comp = Object.assign(Object.create(component), {
      el: { object3D: root, sceneEl: { systems: { nav, "lounge-social": { poseFor: () => pose } } } }
    });
    comp.init();
    assert.ok(comp.setup());
    const restHeight = comp.rigs[0].sole - comp.rigs[0].footPosition.y;
    const bone = name => root.getObjectByName(name);
    const eyeToHips =
      bone("Spine").position.y +
      bone("Neck").position.y +
      bone("Head").position.y +
      (bone("LeftEye").position.y + bone("RightEye").position.y) / 2;
    const defaultHipHeight = 1.6 - eyeToHips;
    const cases = [
      ["standing", restHeight, null, "standing"],
      ["default-Hubs-1.6m-POV", defaultHipHeight, null, "standing"],
      ["crouch", 0.72, null, "crouch"],
      ["chair", 0.5, null, "seated"],
      ["floor", 0.2, { name: "sit" }, "floor"],
      ["paired-floor", 0.2, { name: "sit_together" }, "floor"],
      ["sit-button-does-not-lower-head", restHeight, { name: "sit" }, "standing"]
    ];
    let now = 0;
    for (const scale of [0.75, 1, 1.3]) {
      for (const [label, height, newPose, mode] of cases) {
        pose = newPose;
        root.position.set(0.4, 3.4 + height * scale, -0.5);
        root.rotation.y = scale;
        root.scale.setScalar(scale);
        root.matrixNeedsUpdate = true;
        root.updateMatrixWorld(true, true);
        const before = snapshot(root);
        comp.tock((now += 100));
        root.updateMatrixWorld(true, true);
        assert.equal(comp.debug.mode, mode, label);
        assert.ok(Math.abs(comp.debug.floor - 3.4) < 1e-6, `${label}: wrong floor`);
        assertUnchanged(before, label);
        assertLengths(comp, scale, label);
        assert.ok(comp.debug.maxReachError < 0.001, `${label}: unexpectedly unreachable ${comp.debug.maxReachError}`);
        for (const rig of comp.rigs) {
          const sole = rig.foot.getWorldPosition(new THREE.Vector3()).y - rig.sole * scale;
          assert.ok(Math.abs(sole - 3.4) < 0.001, `${label}: sole not grounded: ${sole}`);
        }
      }
    }
    root.scale.setScalar(1);
    root.rotation.set(0, 0, 0);
    root.position.set(0, 1.25, 0);
    root.matrixNeedsUpdate = true;
    pose = null;
    const before = snapshot(root);
    comp.tock((now += 100));
    root.updateMatrixWorld(true, true);
    assert.equal(comp.debug.floor, 0);
    assert.ok(comp.debug.maxReachError > 0.15, "unreachable floor must be explicit");
    assertLengths(comp, 1, "unreachable floor");
    assertUnchanged(before, "unreachable floor");
    root.position.y = 2.7;
    root.matrixNeedsUpdate = true;
    root.updateMatrixWorld(true, true);
    comp.tock((now += 100));
    assert.equal(comp.debug.floor, null, "short ray must not latch onto another level");
    assert.equal(comp.debug.mode, "ungrounded");
    root.position.y = restHeight;
    root.matrixNeedsUpdate = true;
    root.updateMatrixWorld(true, true);
    comp.tock((now += 100));
    assert.equal(comp.debug.floor, 0);
    root.position.y += 3.4;
    root.matrixNeedsUpdate = true;
    root.updateMatrixWorld(true, true);
    comp.tock(now + 16);
    assert.equal(comp.debug.floor, null, "teleport must invalidate the old floor immediately");
    comp.tock((now += 100));
    assert.ok(Math.abs(comp.debug.floor - 3.4) < 1e-6);
    const samples = comp.debug.samples;
    for (let frame = 1; frame <= 100; frame++) comp.tock(now + frame);
    assert.equal(comp.debug.samples - samples, 1, "more than ten floor samples per second");
    root.position.set(0, 3.4 + defaultHipHeight, 0);
    root.matrixNeedsUpdate = true;
    root.updateMatrixWorld(true, true);
    const beforeDance = snapshot(root);
    for (const phase of [0, 1 / 4.8, 3 / 4.8]) {
      pose = { name: "dance", phase };
      comp.tock((now += 200));
      root.updateMatrixWorld(true, true);
      assertUnchanged(beforeDance, "dance");
      assertLengths(comp, 1, "dance");
      assert.ok(comp.debug.maxReachError < 0.001);
      const lifts = comp.rigs.map(rig => rig.foot.getWorldPosition(new THREE.Vector3()).y - rig.sole - 3.4);
      assert.ok(
        lifts.every(lift => lift >= -0.001 && lift <= 0.031),
        "dance feet went through the floor"
      );
      if (phase > 0)
        assert.ok(Math.max(...lifts) > 0.025 && Math.min(...lifts) < 0.001, "dance must alternate one planted foot");
    }
    pose = null;
    nav.mesh.position.y = 0.25;
    nav.mesh.rotation.y = 0.7;
    nav.mesh.matrixNeedsUpdate = true;
    root.position.y = 3.65 + restHeight;
    root.matrixNeedsUpdate = true;
    root.updateMatrixWorld(true, true);
    comp.tock((now += 200));
    assert.ok(Math.abs(comp.debug.floor - 3.65) < 1e-6, "navmesh world transform was lost");
    root.position.y = 3.65 + 0.6301;
    root.matrixNeedsUpdate = true;
    root.updateMatrixWorld(true, true);
    comp.tock((now += 100));
    const feetBefore = comp.rigs.map(rig => rig.foot.getWorldPosition(new THREE.Vector3()));
    root.position.y -= 0.0002;
    root.matrixNeedsUpdate = true;
    root.updateMatrixWorld(true, true);
    comp.tock(now + 16, 16);
    for (let i = 0; i < comp.rigs.length; i++) {
      assert.ok(
        comp.rigs[i].foot.getWorldPosition(new THREE.Vector3()).distanceTo(feetBefore[i]) < 0.018,
        "seat threshold snapped the feet"
      );
    }
    const dimensions = comp.rigs.map(rig => ({
      side: rig.side,
      thigh: rig.upperLength,
      shin: rig.lowerLength,
      sole: rig.sole
    }));
    let sourceDisposed = false;
    nav.mesh.geometry.addEventListener("dispose", () => (sourceDisposed = true));
    comp.remove();
    assert.equal(sourceDisposed, false);
    console.log(JSON.stringify({ avatar: who, ...stats, restHeight, eyeToHips, defaultHipHeight, dimensions }));
  });
}
