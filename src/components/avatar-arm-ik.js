// Solves the MetaPerson arm chain after Hubs has positioned the tracked hand
// effectors. Stock ik-controller only drives Head, LeftHand and RightHand,
// leaving the collarbone/upper-arm/forearm bones in their rest pose.
//
// Verified against a headless harness (lounge-assets/avatar-arm-lab) that
// poses the hands and measures bone lengths, wrist gap, elbow placement and
// skin stretch on both personal avatars:
//  - The chain always solves from the upper-arm head. Aiming the collarbone
//    along the arm (the previous female path) shifted the shoulder joint by
//    up to 11 cm and bent a hanging arm to 97 degrees.
//  - The collarbone gets a small shrug/protraction toward the arm direction
//    (12% at rest, up to 32% with the hand overhead), then the elbow is
//    re-solved from the moved joint, so the geometry stays exact.
//  - The elbow hint blends down/back/out by where the hand is: hanging arms
//    put the elbow behind the shoulder, reaches put it below, raises put it
//    out. The old fixed side-plus-down hint flared the elbows sideways for
//    hands at the hips, lap or face.
//  - Beyond full reach the forearm and upper arm lengthen up to 30% before
//    the hand is allowed to float; the old clamp tore the wrist skin open
//    (16x edge stretch) whenever the wearer straightened an arm.
//  - Forearm roll is the continuous unwrapped wrist twist about the forearm
//    for BOTH sides, measured against the bind pose in chest space. The old
//    left-side quaternion path flipped the forearm at 180 degrees of wrist
//    rotation and both sides took their "rest" from whatever the first frame
//    happened to be.
//  - An untracked hand (controller off, desktop viewer, tracking lost) eases
//    to a relaxed pose by the hip instead of freezing in the export T-pose.
const { Vector3, Quaternion, Matrix4 } = THREE;

const SIDES = [
  {
    hand: "LeftHand",
    clavicle: "LeftShoulder",
    upper: "LeftArm",
    lower: ["LeftForeArm", "LeftForeArm1", "LeftForeArm2"],
    sign: 1,
    controller: "leftController"
  },
  {
    hand: "RightHand",
    clavicle: "RightShoulder",
    upper: "RightArm",
    lower: ["RightForeArm", "RightForeArm1", "RightForeArm2"],
    sign: -1,
    controller: "rightController"
  }
];

const MAX_STRETCH = 1.3;
const REST_EASE = 5; // 1/s, ease toward the relaxed pose when untracked

const q = new Quaternion();
const q2 = new Quaternion();
const parentQ = new Quaternion();
const deltaQ = new Quaternion();
const chestQ = new Quaternion();
const invChestQ = new Quaternion();
const handQ = new Quaternion();
const twistQ = new Quaternion();
const blendQ = new Quaternion();
const shoulder = new Vector3();
const wrist = new Vector3();
const elbow = new Vector3();
const target = new Vector3();
const axis = new Vector3();
const pole = new Vector3();
const outward = new Vector3();
const local = new Vector3();
const upperDir = new Vector3();
const lowerDir = new Vector3();
const v = new Vector3();
const m = new Matrix4();

function snapshotBone(bone, fallbackTail) {
  bone.updateWorldMatrix(true, false);
  const head = new Vector3();
  const tail = new Vector3();
  bone.getWorldPosition(head);
  const child = bone.children.find(childBone => childBone.isBone);
  if (child) {
    child.updateWorldMatrix(true, false);
    child.getWorldPosition(tail);
  } else if (fallbackTail) {
    tail.copy(fallbackTail);
  } else {
    return null;
  }
  const direction = tail.sub(head).normalize();
  bone.getWorldQuaternion(q);
  return { bone, restDirection: direction, restQuaternion: q.clone(), restLocalQuaternion: bone.quaternion.clone() };
}

function findSkeleton(root) {
  let skeleton = null;
  root.traverse(object => {
    if (!skeleton && object.isSkinnedMesh && object.skeleton) skeleton = object.skeleton;
  });
  return skeleton;
}

function bindMatrixOf(skeleton, boneName) {
  const index = skeleton.bones.findIndex(bone => bone.name === boneName);
  if (index < 0) return null;
  return skeleton.boneInverses[index].clone().invert();
}

// Rotate `bone` so that its rest direction points along worldDirection,
// optionally rolled about that direction by `roll` radians; `amount` < 1
// blends from the rest orientation (used for the collarbone shrug).
function aim(snapshot, worldDirection, roll = 0, amount = 1) {
  const { bone, restDirection, restQuaternion } = snapshot;
  deltaQ.setFromUnitVectors(restDirection, worldDirection);
  q.copy(deltaQ).multiply(restQuaternion);
  if (roll !== 0) {
    twistQ.setFromAxisAngle(worldDirection, roll);
    q.premultiply(twistQ);
  }
  if (amount < 1) {
    blendQ.copy(q);
    q.copy(restQuaternion).slerp(blendQ, amount);
  }
  bone.parent.getWorldQuaternion(parentQ).invert();
  bone.quaternion.copy(parentQ.multiply(q));
  bone.matrixNeedsUpdate = true;
  bone.updateWorldMatrix(true, false);
}

function signedTwist(rotation, direction) {
  const amount = rotation.x * direction.x + rotation.y * direction.y + rotation.z * direction.z;
  const angle = 2 * Math.atan2(amount, rotation.w);
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function unwrap(angle, previous) {
  while (angle - previous > Math.PI) angle -= Math.PI * 2;
  while (angle - previous < -Math.PI) angle += Math.PI * 2;
  return angle;
}

AFRAME.registerComponent("avatar-arm-ik", {
  init() {
    this.rigs = null;
    this.chest = null;
  },

  setup() {
    const root = this.el.object3D;
    const skeleton = findSkeleton(root);
    const chest = root.getObjectByName("Spine");
    if (!skeleton || !chest) return false;
    root.updateWorldMatrix(true, true);
    const rigs = [];
    for (const side of SIDES) {
      const hand = root.getObjectByName(side.hand);
      const clavicleBone = root.getObjectByName(side.clavicle);
      const upperBone = root.getObjectByName(side.upper);
      const lowerBones = side.lower.map(name => root.getObjectByName(name));
      if (!hand || !clavicleBone || !upperBone || lowerBones.some(bone => !bone)) return false;
      if (hand.parent !== chest || lowerBones[0].parent !== upperBone) return false;
      const bindElbow = bindMatrixOf(skeleton, side.lower[0]);
      const bindWrist = bindMatrixOf(skeleton, side.hand);
      const bindUpper = bindMatrixOf(skeleton, side.upper);
      const bindChest = bindMatrixOf(skeleton, "Spine");
      if (!bindElbow || !bindWrist || !bindUpper || !bindChest) return false;
      const elbowPos = new Vector3().setFromMatrixPosition(bindElbow);
      const wristPos = new Vector3().setFromMatrixPosition(bindWrist);
      const upperPos = new Vector3().setFromMatrixPosition(bindUpper);
      const bindWristWorld = wristPos.clone().applyMatrix4(root.matrixWorld);
      const clavicle = snapshotBone(clavicleBone);
      const upper = snapshotBone(upperBone);
      const lower = lowerBones.map(bone => snapshotBone(bone, bindWristWorld));
      if (!clavicle || !upper || lower.some(x => !x)) return false;
      // Hand orientation at bind, expressed in chest space: the wrist-roll reference.
      m.copy(bindChest).invert().multiply(bindWrist);
      const handRestInChest = new Quaternion().setFromRotationMatrix(m);
      const lowerLength = elbowPos.distanceTo(wristPos);
      // Relaxed hand in chest space: by the hip, slightly forward, fingers
      // down, palm toward the body (bone +y = fingers, +z = palm normal).
      const fy = new Vector3(0, -1, 0.15).normalize();
      const fz = new Vector3(-side.sign, 0, 0);
      fz.addScaledVector(fy, -fy.dot(fz)).normalize();
      const fx = new Vector3().crossVectors(fy, fz).normalize();
      const relaxQuaternion = new Quaternion().setFromRotationMatrix(m.makeBasis(fx, fy, fz));
      const relaxPosition = new Vector3(side.sign * 0.22, -0.13, 0.1);
      rigs.push({
        relaxPosition,
        relaxQuaternion,
        side,
        hand,
        clavicle,
        upper,
        lower,
        upperLength: upperPos.distanceTo(elbowPos),
        lowerLength,
        elbowRestPosition: lowerBones[0].position.clone(),
        helperRestPositions: lowerBones.map(bone => bone.position.clone()),
        rollWeights: lowerBones.map((bone, i) =>
          i === 0 ? 0 : Math.min(1, Math.max(0, bone.position.length() / lowerLength))
        ),
        handRestInChest,
        handRestInverseInChest: handRestInChest.clone().invert(),
        handRestPosition: hand.position.clone(),
        handRestQuaternion: hand.quaternion.clone(),
        twistAngle: 0,
        hasTwist: false,
        stretch: 1,
        relaxed: false
      });
    }
    this.rigs = rigs;
    this.chest = chest;
    return true;
  },

  effectorTracked(side) {
    const ik = this.el.components["ik-controller"];
    const ikRoot = ik && ik.ikRoot;
    const controller = ikRoot && ikRoot[side.controller];
    if (!controller || !controller.object3D) return true;
    if (!controller.object3D.visible) return false;
    // A controller entity that has never received a pose sits exactly at the
    // rig origin; a tracked hand never does.
    const p = controller.object3D.position;
    return p.x !== 0 || p.y !== 0 || p.z !== 0;
  },

  // Relaxed hand target in chest space: by the hip, slightly forward, fingers
  // down, palm toward the body (bone +y = fingers, +z = palm normal).
  relaxHand(rig, dt) {
    const { hand } = rig;
    const k = rig.relaxed ? 1 - Math.exp(-REST_EASE * dt) : 1;
    hand.position.lerp(rig.relaxPosition, k);
    hand.quaternion.slerp(rig.relaxQuaternion, k);
    hand.matrixNeedsUpdate = true;
    hand.updateWorldMatrix(true, false);
    rig.relaxed = true;
  },

  tock(time, dt) {
    if (!this.rigs && !this.setup()) return;
    const dtSeconds = Math.min(0.1, (dt || 16) / 1000);
    this.chest.getWorldQuaternion(chestQ);
    invChestQ.copy(chestQ).invert();
    for (const rig of this.rigs) {
      if (!this.effectorTracked(rig.side)) this.relaxHand(rig, dtSeconds);
      else rig.relaxed = false;
      const { side, upper, clavicle, lower, hand } = rig;

      // Pass 1: elbow hint from where the hand is relative to the shoulder.
      upper.bone.getWorldPosition(shoulder);
      hand.getWorldPosition(wrist);
      target.subVectors(wrist, shoulder);
      const distance = target.length();
      if (distance < 0.001) continue;
      const a0 = rig.upperLength;
      const b0 = rig.lowerLength;
      const total = a0 + b0;
      local.copy(target).applyQuaternion(invChestQ);
      const h = Math.min(1, Math.max(-1, local.y / total));
      const f = Math.min(1, Math.max(-1, local.z / total));
      const o = Math.min(1, Math.max(-1, (local.x * side.sign) / total));
      const raise = Math.max(0, h);
      const reach = Math.max(0, f);
      const cross = Math.max(0, -o);
      // hint in chest space, then to world
      pole.set(
        side.sign * (0.25 + 1.1 * raise + 0.15 * reach - 0.2 * cross),
        -(0.55 + 0.3 * raise + 0.7 * reach + 0.5 * cross),
        -(0.5 - 0.6 * raise - 0.3 * reach)
      );
      pole.applyQuaternion(chestQ);

      // Collarbone shrug toward the arm direction, then re-read the joint.
      axis.copy(target).multiplyScalar(1 / distance);
      const shrug = 0.12 + 0.2 * raise;
      aim(clavicle, axis, 0, shrug);
      upper.bone.getWorldPosition(shoulder);
      target.subVectors(wrist, shoulder);
      const d0 = target.length();
      if (d0 < 0.001) continue;
      axis.copy(target).multiplyScalar(1 / d0);

      // Stretch the chain (not the skin scale) when the hand is out of reach.
      const stretch = d0 > total ? Math.min(MAX_STRETCH, d0 / total) : 1;
      if (stretch !== rig.stretch) {
        lower[0].bone.position.copy(rig.elbowRestPosition).multiplyScalar(stretch);
        for (let i = 1; i < lower.length; i++)
          lower[i].bone.position.copy(rig.helperRestPositions[i]).multiplyScalar(stretch);
        rig.stretch = stretch;
      }
      const a = a0 * stretch;
      const b = b0 * stretch;
      const d = Math.min(Math.max(d0, Math.abs(a - b) + 0.001), a + b - 0.001);
      const along = (a * a - b * b + d * d) / (2 * d);
      const height = Math.sqrt(Math.max(0, a * a - along * along));
      pole.addScaledVector(axis, -pole.dot(axis));
      if (pole.lengthSq() < 1e-6) {
        outward.set(side.sign, 0, 0).applyQuaternion(chestQ);
        pole.copy(outward).addScaledVector(axis, -outward.dot(axis));
      }
      pole.normalize();
      elbow.copy(shoulder).addScaledVector(axis, along).addScaledVector(pole, height);
      upperDir.subVectors(elbow, shoulder).normalize();
      lowerDir.subVectors(wrist, elbow).normalize();

      // Wrist roll about the forearm, relative to the bind hand, in chest space.
      hand.getWorldQuaternion(handQ);
      q2.copy(invChestQ).multiply(handQ).multiply(rig.handRestInverseInChest);
      v.copy(lowerDir).applyQuaternion(invChestQ);
      let twist = signedTwist(q2, v);
      twist = rig.hasTwist ? unwrap(twist, rig.twistAngle) : twist;
      rig.hasTwist = true;
      rig.twistAngle = twist;

      aim(upper, upperDir);
      for (let i = 0; i < lower.length; i++) {
        aim(lower[i], lowerDir, twist * rig.rollWeights[i]);
      }
    }
  }
});
