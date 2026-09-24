// Actual bundled GLBs + the installed Hubs Three.js fork. No copied lab assets,
// no generated output, and no network/image decoding are involved.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const THREE = require("three");
const base = path.resolve(__dirname, "..");

function armModule() {
  let definition;
  const context = vm.createContext({
    THREE,
    AFRAME: { registerComponent: (_name, value) => (definition = value) }
  });
  const source = fs.readFileSync(path.join(base, "src/components/avatar-arm-ik.js"), "utf8");
  vm.runInContext(source.replace(/^export /gm, ""), context);
  return { definition, prepare: context.prepareAvatarArmsForRender };
}

async function loadAvatar(who) {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const bytes = fs.readFileSync(path.join(base, `src/assets/models/lounge-avatars/avatar-${who}-real.glb`));
  const length = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + length));
  assert.equal(json.skins[0].joints.length, 29, "test must use the current full-body asset");
  delete json.images;
  delete json.textures;
  delete json.materials;
  json.meshes.forEach(mesh => mesh.primitives.forEach(primitive => delete primitive.material));
  let text = Buffer.from(JSON.stringify(json));
  text = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 32)]);
  const buffer = Buffer.concat([bytes.subarray(0, 20), text, bytes.subarray(20 + length)]);
  buffer.writeUInt32LE(buffer.length, 8);
  buffer.writeUInt32LE(text.length, 12);
  const gltf = await new GLTFLoader().parseAsync(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    ""
  );
  const root = new THREE.Group();
  root.add(gltf.scene);
  root.updateMatrixWorld(true, true);
  root.traverse(object => (object.matrixAutoUpdate = false));
  return root;
}

function controller() {
  const object3D = new THREE.Object3D();
  object3D.position.set(0.2, 0.3, 0.4);
  return { object3D };
}

function componentFor(definition, root) {
  const controllers = { leftController: controller(), rightController: controller() };
  const component = Object.assign(Object.create(definition), {
    el: { object3D: root, components: { "ik-controller": { ikRoot: controllers } }, sceneEl: {} }
  });
  component.init();
  component.play();
  assert.ok(component.setup());
  return { component, controllers };
}

function update(root) {
  root.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true, true);
}

function bonePosition(bone) {
  return bone.getWorldPosition(new THREE.Vector3());
}

function jointsInChest(component) {
  const inverse = component.chest.matrixWorld.clone().invert();
  return component.rigs.flatMap(rig =>
    [rig.clavicle.bone, rig.upper.bone, ...rig.lower.map(segment => segment.bone)].map(bone =>
      bonePosition(bone).applyMatrix4(inverse)
    )
  );
}

function armEdges(root) {
  const meshes = [];
  const edges = [];
  root.traverse(mesh => {
    if (!mesh.isSkinnedMesh || !["AvatarBody", "outfit"].includes(mesh.name)) return;
    meshes.push(mesh);
    const geometry = mesh.geometry;
    const weighted = i => {
      for (let k = 0; k < 4; k++) {
        const joint = geometry.attributes.skinIndex.array[i * 4 + k];
        if (
          /^(Left|Right)(Arm|ForeArm|Hand|Shoulder)/.test(mesh.skeleton.bones[joint].name) &&
          geometry.attributes.skinWeight.array[i * 4 + k] > 0.05
        )
          return true;
      }
      return false;
    };
    for (let i = 0; i < geometry.index.count; i += 3) {
      const triangle = [geometry.index.getX(i), geometry.index.getX(i + 1), geometry.index.getX(i + 2)];
      if (!triangle.some(weighted)) continue;
      for (let e = 0; e < 3; e++) {
        const a = triangle[e],
          b = triangle[(e + 1) % 3];
        const length = new THREE.Vector3()
          .fromBufferAttribute(geometry.attributes.position, a)
          .distanceTo(new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, b));
        if (length > 0.001) edges.push({ mesh, a, b, length });
      }
    }
  });
  return () => {
    for (const mesh of meshes) mesh.skeleton.update();
    const a = new THREE.Vector3(),
      b = new THREE.Vector3();
    let worst = 0;
    for (const edge of edges) {
      a.fromBufferAttribute(edge.mesh.geometry.attributes.position, edge.a);
      b.fromBufferAttribute(edge.mesh.geometry.attributes.position, edge.b);
      edge.mesh.boneTransform(edge.a, a);
      edge.mesh.boneTransform(edge.b, b);
      worst = Math.max(worst, a.distanceTo(b) / edge.length);
    }
    return worst;
  };
}

function setHands(component) {
  for (const rig of component.rigs) {
    rig.hand.position.set(rig.side.sign * 0.2, 0.22, 0.4);
    rig.hand.quaternion.copy(rig.relaxQuaternion);
    rig.hand.matrixNeedsUpdate = true;
  }
}

for (const who of ["jay", "her"]) {
  test(`${who}: chest-local arm pose is invariant under body yaw and chest rotation`, async () => {
    const { definition } = armModule();
    const root = await loadAvatar(who);
    // Setup is deliberately not in the world-aligned bind pose.
    root.rotation.y = 0.8;
    root.matrixNeedsUpdate = true;
    update(root);
    const { component } = componentFor(definition, root);
    const chestRest = component.chest.quaternion.clone();
    const worstStretch = armEdges(root);
    let reference,
      referenceStretch,
      maxDrift = 0;
    for (const chestAngles of [
      [0, 0, 0],
      [0.12, 0.4, -0.1],
      [-0.2, -0.3, 0.15]
    ]) {
      for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        root.position.set(0.3, 0.9, -0.7);
        root.rotation.y = yaw;
        root.matrixNeedsUpdate = true;
        component.chest.quaternion
          .copy(chestRest)
          .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...chestAngles)));
        component.chest.matrixNeedsUpdate = true;
        update(root);
        setHands(component);
        const headBefore = bonePosition(root.getObjectByName("Head"));
        const wristsBefore = component.rigs.map(rig => bonePosition(rig.hand));
        for (let frame = 0; frame < 120; frame++) component.tock(frame * 16, 16);
        update(root);
        const joints = jointsInChest(component);
        if (!reference) reference = joints;
        const drift = Math.max(...joints.map((point, i) => point.distanceTo(reference[i])));
        maxDrift = Math.max(maxDrift, drift);
        assert.ok(drift < 0.00002, `${who}: root yaw/chest rotation changed arm pose by ${drift} m`);
        assert.ok(bonePosition(root.getObjectByName("Head")).distanceTo(headBefore) < 1e-7);
        for (let i = 0; i < component.rigs.length; i++) {
          const rig = component.rigs[i];
          assert.equal(rig.stretch, 1, "turning in place must not lengthen arms");
          assert.ok(bonePosition(rig.hand).distanceTo(wristsBefore[i]) < 1e-7, "tracked wrist moved");
          const elbow = bonePosition(rig.lower[0].bone);
          const tail = bonePosition(rig.lower[2].bone)
            .sub(elbow)
            .normalize()
            .multiplyScalar(rig.lowerLength)
            .add(elbow);
          assert.ok(tail.distanceTo(bonePosition(rig.hand)) < 0.002, "wrist chain disconnected");
        }
        if (chestAngles.every(angle => angle === 0)) {
          const stretch = worstStretch();
          if (referenceStretch === undefined) referenceStretch = stretch;
          assert.ok(
            Math.abs(stretch - referenceStretch) < 0.0001,
            `yaw changed skin stretch ${referenceStretch} -> ${stretch}`
          );
          assert.ok(stretch < 3, `unexpected arm skin ribbon: ${stretch}x edge length`);
        }
      }
    }
    component.remove();
    console.log(JSON.stringify({ avatar: who, maxJointDrift: maxDrift, worstYawSkinStretch: referenceStretch }));
  });

  test(`${who}: late render hand repair follows real bone-visibility, preserves privacy and controllers`, async () => {
    const { definition, prepare } = armModule();
    const root = await loadAvatar(who);
    const { component, controllers } = componentFor(definition, root);
    let visibilityDefinition;
    const context = vm.createContext({
      THREE,
      AFRAME: { registerComponent: (_name, value) => (visibilityDefinition = value) }
    });
    const visibility = fs.readFileSync(path.join(base, "src/components/bone-visibility.js"), "utf8");
    vm.runInContext(
      visibility.replace(/^export /gm, "") + "\nglobalThis.TestVisibilitySystem = BoneVisibilitySystem;",
      context
    );
    const visibilitySystem = new context.TestVisibilitySystem();
    const visibilityComponents = component.rigs.map(rig => {
      const cmp = Object.assign(Object.create(visibilityDefinition), {
        el: { object3D: rig.hand },
        data: { updateWhileInvisible: true }
      });
      cmp.play();
      rig.hand.el = { components: {} };
      return cmp;
    });
    const runHiddenFrame = invading => {
      for (const rig of component.rigs) {
        const tracked = controllers[rig.side.controller].object3D;
        tracked.visible = false;
        const invader = {
          invading,
          alwaysHidden: true,
          setAlwaysHidden(hidden) {
            this.alwaysHidden = hidden;
            rig.hand.visible = !this.invading && !hidden;
          }
        };
        rig.hand.el.components["personal-space-invader"] = invader;
        rig.hand.visible = false;
      }
      visibilitySystem.tick();
      for (const rig of component.rigs) assert.equal(rig.hand.scale.x, 1e-8, "fixture did not reproduce stock hiding");
      prepare();
    };
    runHiddenFrame(false);
    for (const rig of component.rigs) {
      assert.equal(rig.hand.visible, true);
      assert.deepEqual(rig.hand.scale.toArray(), [1, 1, 1]);
      assert.equal(controllers[rig.side.controller].object3D.visible, false);
      assert.deepEqual(controllers[rig.side.controller].object3D.position.toArray(), [0.2, 0.3, 0.4]);
    }
    let socialCalls = 0;
    component.el.sceneEl.systems = {
      "lounge-social": {
        poseFor: () => ({ name: "hug", phase: 1 }),
        applyHandPose: () => socialCalls++
      }
    };
    runHiddenFrame(true);
    for (const rig of component.rigs) {
      assert.equal(rig.hand.visible, false, "a pose must not override personal-space hiding");
      assert.equal(rig.hand.scale.x, 1e-8);
    }
    runHiddenFrame(false);
    component.tock(100, 16);
    assert.equal(socialCalls, 2, "existing social hand-pose hook was lost");
    component.pause();
    runHiddenFrame(false);
    for (const rig of component.rigs) assert.equal(rig.hand.scale.x, 1e-8, "paused component remained registered");
    component.play();
    prepare();
    for (const rig of component.rigs) assert.equal(rig.hand.scale.x, 1);
    const hands = component.rigs.map(rig => rig.hand);
    component.remove();
    for (const hand of hands) hand.visible = false;
    visibilitySystem.tick();
    prepare();
    for (const hand of hands) assert.equal(hand.scale.x, 1e-8, "removed component remained registered");
    for (const cmp of visibilityComponents) cmp.pause();
    // Frame preparation is safe before a model has completed loading.
    const pending = Object.assign(Object.create(definition), { el: { object3D: new THREE.Group() } });
    pending.init();
    pending.play();
    prepare();
    pending.remove();
  });
}
