// Estimated lower-body posture for the personal MetaPerson rigs. Only leg
// rotations are written: stock head/hand IK, the avatar root and the camera
// remain authoritative. This is not body tracking or a physics simulation.
const { Vector3, Quaternion, Matrix4, Raycaster, Mesh, MeshBasicMaterial, DoubleSide } = THREE;

const SIDES = ["Left", "Right"];
const ATTRIBUTE_COMPONENTS = ["getX", "getY", "getZ", "getW"];
const FLOOR_INTERVAL = 100; // At most ten navmesh queries per second/avatar.
const UP = new Vector3(0, 1, 0);
const DOWN = new Vector3(0, -1, 0);
const rootQ = new Quaternion();
const parentQ = new Quaternion();
const deltaQ = new Quaternion();
const desiredQ = new Quaternion();
const restQ = new Quaternion();
const hipsPosition = new Vector3();
const hip = new Vector3();
const ankle = new Vector3();
const knee = new Vector3();
const direction = new Vector3();
const restDirection = new Vector3();
const pole = new Vector3();
const forward = new Vector3();
const worldScale = new Vector3();
const vertex = new Vector3();

function bindMatrix(skeleton, name) {
  const index = skeleton.bones.findIndex(bone => bone.name === name);
  return index < 0 ? null : skeleton.boneInverses[index].clone().invert();
}

function rotationOf(bind) {
  return new Quaternion().setFromRotationMatrix(new Matrix4().extractRotation(bind));
}

function pointOf(bind) {
  return new Vector3().setFromMatrixPosition(bind);
}

function aim(bone, bindDirection, bindQuaternion, worldDirection) {
  restDirection.copy(bindDirection).applyQuaternion(rootQ);
  deltaQ.setFromUnitVectors(restDirection, worldDirection);
  restQ.copy(rootQ).multiply(bindQuaternion);
  desiredQ.copy(deltaQ).multiply(restQ);
  bone.parent.getWorldQuaternion(parentQ).invert();
  bone.quaternion.copy(parentQ.multiply(desiredQ));
  bone.matrixNeedsUpdate = true;
  bone.updateWorldMatrix(true, false);
}

// Foot origin is the ankle, not the sole. Derive its clearance from actual
// footwear vertices in bind space, rather than one hard-coded avatar height.
function soleClearance(root, side, bindFoot, fallback) {
  let lowest = Infinity;
  root.traverse(mesh => {
    if (!mesh.isSkinnedMesh || !mesh.skeleton) return;
    const { position, skinIndex, skinWeight } = mesh.geometry.attributes;
    if (!position || !skinIndex || !skinWeight) return;
    const wanted = new Set();
    mesh.skeleton.bones.forEach((bone, index) => {
      if (bone.name === side + "Foot" || bone.name.startsWith(side + "Toe")) wanted.add(index);
    });
    if (!wanted.size) return;
    for (let i = 0; i < position.count; i++) {
      let weight = 0;
      for (let k = 0; k < 4; k++) {
        if (wanted.has(skinIndex[ATTRIBUTE_COMPONENTS[k]](i))) weight += skinWeight[ATTRIBUTE_COMPONENTS[k]](i);
      }
      if (weight < 0.5) continue;
      vertex.fromBufferAttribute(position, i).applyMatrix4(mesh.bindMatrix);
      lowest = Math.min(lowest, vertex.y);
    }
  });
  const clearance = bindFoot.y - lowest;
  return Number.isFinite(clearance) && clearance > 0.015 && clearance < 0.25 ? clearance : fallback;
}

AFRAME.registerComponent("avatar-leg-ik", {
  init() {
    this.rigs = null;
    this.hips = null;
    this.navSource = null;
    this.navProxy = null;
    this.floor = null;
    this.nextFloorAt = 0;
    this.nextSetupAt = 0;
    this.lastSamplePosition = new Vector3();
    this.raycaster = new Raycaster(new Vector3(), DOWN.clone(), 0, 1.5);
    this.raycaster.firstHitOnly = true;
    this.hits = [];
    // Readable diagnostic state for the test harness and headset calibration.
    this.debug = { mode: "waiting-for-rig", floor: null, maxReachError: 0, samples: 0 };
  },

  setup() {
    const root = this.el.object3D;
    const hips = root.getObjectByName("Hips");
    let skeleton = null;
    root.traverse(object => {
      if (!skeleton && object.isSkinnedMesh && object.skeleton) skeleton = object.skeleton;
    });
    if (!hips || !skeleton) return false;
    const rigs = [];
    for (const side of SIDES) {
      const upper = root.getObjectByName(side + "UpLeg");
      const lower = root.getObjectByName(side + "Leg");
      const foot = root.getObjectByName(side + "Foot");
      if (!upper || !lower || !foot || lower.parent !== upper || foot.parent !== lower) return false;
      const upperBind = bindMatrix(skeleton, side + "UpLeg");
      const lowerBind = bindMatrix(skeleton, side + "Leg");
      const footBind = bindMatrix(skeleton, side + "Foot");
      if (!upperBind || !lowerBind || !footBind) return false;
      const upperPosition = pointOf(upperBind);
      const lowerPosition = pointOf(lowerBind);
      const footPosition = pointOf(footBind);
      const upperLength = upperPosition.distanceTo(lowerPosition);
      const lowerLength = lowerPosition.distanceTo(footPosition);
      if (upperLength < 0.05 || lowerLength < 0.05) return false;
      rigs.push({
        side,
        upper,
        lower,
        foot,
        upperLength,
        lowerLength,
        upperDirection: lowerPosition.clone().sub(upperPosition).normalize(),
        lowerDirection: footPosition.clone().sub(lowerPosition).normalize(),
        upperQuaternion: rotationOf(upperBind),
        lowerQuaternion: rotationOf(lowerBind),
        footQuaternion: rotationOf(footBind),
        footPosition,
        sole: soleClearance(root, side, footPosition, lowerLength * 0.19),
        restUpper: upper.quaternion.clone(),
        restLower: lower.quaternion.clone(),
        restFoot: foot.quaternion.clone(),
        forwardOffset: null,
        reachError: 0
      });
    }
    this.hips = hips;
    this.rigs = rigs;
    return true;
  },

  sampleFloor(time, scale) {
    const nav = this.el.sceneEl.systems.nav?.mesh;
    if (nav !== this.navSource) {
      this.navProxy?.material.dispose();
      this.navSource = nav;
      // Never change visibility or raycast handlers on the real navmesh.
      this.navProxy = nav ? new Mesh(nav.geometry, new MeshBasicMaterial({ side: DoubleSide })) : null;
      if (this.navProxy) this.navProxy.matrixAutoUpdate = false;
      this.floor = null;
    }
    // A teleport must not plant feet on the cached floor from the old level.
    if (this.lastSamplePosition.distanceTo(hipsPosition) > 0.6 * scale) this.floor = null;
    if (time < this.nextFloorAt) return;
    this.nextFloorAt = time + FLOOR_INTERVAL;
    this.lastSamplePosition.copy(hipsPosition);
    this.floor = null;
    if (!nav || !this.navProxy) return;
    nav.updateWorldMatrix(true, false);
    nav.matrixWorld.decompose(this.navProxy.position, this.navProxy.quaternion, this.navProxy.scale);
    this.navProxy.updateMatrix();
    this.navProxy.updateWorldMatrix(false, false);
    this.raycaster.ray.origin.copy(hipsPosition).addScaledVector(UP, 0.12 * scale);
    this.raycaster.far = 1.45 * scale;
    this.hits.length = 0;
    // Hubs can replace the source mesh's raycast with a no-op. The proxy uses
    // the Mesh implementation and shares, but never disposes, source geometry.
    this.navProxy.raycast(this.raycaster, this.hits);
    this.debug.samples++;
    let nearest = Infinity;
    for (const hit of this.hits) {
      if (hit.distance < nearest) {
        nearest = hit.distance;
        this.floor = hit.point.y;
      }
    }
  },

  tock(time = 0, dt = 16) {
    const root = this.el.object3D;
    if (this.hips && root.getObjectByName("Hips") !== this.hips) this.rigs = null;
    if (!this.rigs) {
      if (time < this.nextSetupAt) return;
      this.nextSetupAt = time + 1000;
      if (!this.setup()) return; // Stock half-body avatars remain supported.
    }
    // In Hubs, updateWorldMatrix(true, true) can clear the root's dirty-child
    // flag before passing it down. Update parents, then propagate explicitly.
    root.updateWorldMatrix(true, false);
    root.updateMatrixWorld(false, true);
    root.getWorldQuaternion(rootQ);
    root.getWorldScale(worldScale);
    const scale = (Math.abs(worldScale.x) + Math.abs(worldScale.y) + Math.abs(worldScale.z)) / 3;
    if (!Number.isFinite(scale) || scale < 0.01) return;
    this.hips.getWorldPosition(hipsPosition);
    this.sampleFloor(time, scale);
    const pose = this.el.sceneEl.systems["lounge-social"]?.poseFor(this.el);
    const floorPose = pose?.name === "sit" || pose?.name === "sit_together";
    const height = this.floor === null ? Infinity : (hipsPosition.y - this.floor) / scale;
    // Floor poses only extend legs once the user's hips are actually low.
    // Pressing Sit while standing cannot pull the HMD down or stretch legs.
    const mode =
      this.floor === null
        ? "ungrounded"
        : floorPose && height < 0.5
          ? "floor"
          : height < 0.63
            ? "seated"
            : height < 0.82
              ? "crouch"
              : "standing";
    this.debug.mode = mode;
    this.debug.floor = this.floor;
    this.debug.maxReachError = 0;
    const seconds = Math.min(0.1, Math.max(0, dt) / 1000);
    forward.set(0, 0, 1).applyQuaternion(rootQ);
    forward.y = 0;
    if (forward.lengthSq() < 1e-8) forward.set(0, 0, 1);
    forward.normalize();
    for (const rig of this.rigs) {
      if (this.floor === null) {
        rig.upper.quaternion.copy(rig.restUpper);
        rig.lower.quaternion.copy(rig.restLower);
        rig.foot.quaternion.copy(rig.restFoot);
        for (const bone of [rig.upper, rig.lower, rig.foot]) bone.matrixNeedsUpdate = true;
        continue;
      }
      rig.upper.getWorldPosition(hip);
      ankle.copy(rig.footPosition).applyMatrix4(root.matrixWorld);
      ankle.y = this.floor + rig.sole * scale;
      const step =
        pose?.name === "dance" && mode === "standing" && Number.isFinite(pose.phase)
          ? Math.max(0, Math.sin(pose.phase * Math.PI * 2 * 1.2 + (rig.side === "Left" ? 0 : Math.PI)))
          : 0;
      // Small alternating in-place steps. No root travel, height changes or
      // synthetic body tracking are introduced by the dance emote.
      ankle.y += step * 0.03 * scale;
      ankle.addScaledVector(forward, step * 0.025 * scale);
      const extension =
        mode === "floor" ? (rig.upperLength + rig.lowerLength) * 0.86 : mode === "seated" ? rig.upperLength * 0.88 : 0;
      if (rig.forwardOffset === null) rig.forwardOffset = extension;
      rig.forwardOffset += THREE.MathUtils.clamp(extension - rig.forwardOffset, -seconds, seconds);
      const a = rig.upperLength * scale;
      const b = rig.lowerLength * scale;
      direction.subVectors(ankle, hip);
      const vertical = direction.y;
      direction.y = 0;
      const alongFloor = direction.dot(forward);
      const horizontalReach = Math.max(0, (a + b - 0.0001 * scale) ** 2 - vertical ** 2);
      const forwardReach = Math.max(
        0,
        -alongFloor + Math.sqrt(Math.max(0, alongFloor ** 2 + horizontalReach - direction.lengthSq()))
      );
      // Sitting/standing crosses a classification boundary, but feet glide.
      // As the head rises, shorten that glide to the remaining natural reach.
      ankle.addScaledVector(forward, Math.min(rig.forwardOffset * scale, forwardReach));
      direction.subVectors(ankle, hip);
      const requestedDistance = direction.length();
      const distance = Math.min(a + b - 0.0001 * scale, Math.max(Math.abs(a - b) + 0.0001 * scale, requestedDistance));
      if (requestedDistance < 1e-6) direction.copy(DOWN);
      else direction.multiplyScalar(1 / requestedDistance);
      rig.reachError = Math.abs(requestedDistance - distance);
      this.debug.maxReachError = Math.max(this.debug.maxReachError, rig.reachError);
      const along = (a * a - b * b + distance * distance) / (2 * distance);
      const bend = Math.sqrt(Math.max(0, a * a - along * along));
      // Knees bend forward. A small outward hint avoids crossing the midline;
      // floor sitting adds an upward hint to keep the knees above the floor.
      pole.set(rig.side === "Left" ? 0.12 : -0.12, mode === "floor" ? 0.5 : 0, 1).applyQuaternion(rootQ);
      pole.addScaledVector(direction, -pole.dot(direction));
      if (pole.lengthSq() < 1e-8) pole.copy(UP).addScaledVector(direction, -direction.y);
      pole.normalize();
      knee.copy(hip).addScaledVector(direction, along).addScaledVector(pole, bend);
      ankle.copy(hip).addScaledVector(direction, distance);
      direction.subVectors(knee, hip).normalize();
      aim(rig.upper, rig.upperDirection, rig.upperQuaternion, direction);
      rig.lower.getWorldPosition(knee);
      direction.subVectors(ankle, knee).normalize();
      aim(rig.lower, rig.lowerDirection, rig.lowerQuaternion, direction);
      // Keep the footwear's bind pitch and toe spread, with the avatar's yaw.
      desiredQ.copy(rootQ).multiply(rig.footQuaternion);
      rig.foot.parent.getWorldQuaternion(parentQ).invert();
      rig.foot.quaternion.copy(parentQ.multiply(desiredQ));
      rig.foot.matrixNeedsUpdate = true;
      rig.foot.updateWorldMatrix(true, false);
    }
  },

  remove() {
    this.navProxy?.material.dispose();
    this.navProxy = null;
    this.navSource = null;
    this.rigs = null;
  }
});
