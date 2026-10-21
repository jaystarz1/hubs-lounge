import * as THREE from "three";

// Drinking from a held glass (drinks.js, dinner-glasses.js, settings.js): bring
// it up to your mouth and it tips towards your lips by itself, further the
// emptier it is, and each time it gets there it goes down by one sip. Take it
// away and bring it back for the next sip. The tip is on the glass's mesh (a
// child of the held entity), turned about the middle of the glass, so the grip
// and physics never move; tipped() hands the room the tipped pose.
const NEAR = 0.3; // m, glass to mouth: it starts to tip
const AT = 0.13; // at the lips: fully tipped, a sip
const AWAY = 0.2; // taken this far away, the next approach is another sip
const SIP_TIME = 1.1; // s, one sip going down
const TIP_FULL = THREE.MathUtils.degToRad(35); // world tilt at the lips, full glass
const TIP_EMPTY = THREE.MathUtils.degToRad(95); // and empty
const EASE = 7; // 1/s
export const SIP = 0.12; // of a full glass

// Scene glasses get their colours through Blender (sRGB vertex colours,
// exported linear). This three.js reads a hex as linear, so the same hex came
// out lighter on the pickable copies: convert it the same way.
export const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();

const eye = new THREE.Vector3();
const mouth = new THREE.Vector3();
const bowl = new THREE.Vector3();
const fwd = new THREE.Vector3();
const camUp = new THREE.Vector3();
const local = new THREE.Vector3();
const up = new THREE.Vector3();
const q = new THREE.Quaternion();
const Y = new THREE.Vector3(0, 1, 0);

export function sipState(pivot) {
  return { pivot, angle: 0, axis: new THREE.Vector3(1, 0, 0), left: 0, ready: true };
}

function pose(st, group) {
  group.quaternion.setFromAxisAngle(st.axis, st.angle);
  group.position.set(0, st.pivot, 0).applyQuaternion(group.quaternion).negate();
  group.position.y += st.pivot;
  group.matrixNeedsUpdate = true;
}

// Held: tip towards the mouth and sip. Returns the new fill.
export function sipTick(st, o, group, fill, dt, camera) {
  let target = 0;
  let d = Infinity;
  if (camera) {
    camera.updateMatrices?.();
    camera.getWorldPosition(eye);
    fwd.setFromMatrixColumn(camera.matrixWorld, 2).normalize().negate();
    camUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    mouth.copy(eye).addScaledVector(camUp, -0.07).addScaledVector(fwd, 0.02);
    o.updateMatrices?.();
    o.localToWorld(bowl.set(0, st.pivot, 0));
    d = bowl.distanceTo(mouth);
    const inFront = local.subVectors(bowl, eye).dot(fwd) > -0.03;
    const w = inFront ? 1 - THREE.MathUtils.smoothstep(d, AT, NEAR) : 0;
    if (w > 0) {
      o.worldToLocal(local.copy(mouth));
      local.y = 0;
      if (local.lengthSq() > 1e-6) st.axis.crossVectors(Y, local).normalize();
      // Only what the hand has not tipped already.
      o.getWorldQuaternion(q);
      up.copy(Y).applyQuaternion(q);
      const tilt = Math.acos(THREE.MathUtils.clamp(up.y, -1, 1));
      target = Math.max(0, w * (TIP_FULL + (TIP_EMPTY - TIP_FULL) * (1 - fill)) - tilt);
    }
    if (d <= AT && inFront && st.ready && fill > 0) {
      st.ready = false;
      st.left = Math.min(SIP, fill);
    }
  }
  if (d > AWAY) {
    st.ready = true;
    st.left = 0;
  }
  if (st.left > 0) {
    const step = Math.min(st.left, (SIP * dt) / SIP_TIME);
    st.left -= step;
    fill = Math.max(0, fill - step);
  }
  st.angle += (target - st.angle) * Math.min(1, dt * EASE);
  if (st.angle < 1e-4 && target === 0) st.angle = 0;
  pose(st, group);
  return fill;
}

// Not held: ease back upright.
export function sipRelax(st, group, dt) {
  st.ready = true;
  st.left = 0;
  if (!st.angle) return;
  st.angle -= st.angle * Math.min(1, dt * EASE);
  if (st.angle < 1e-3) st.angle = 0;
  pose(st, group);
}

// The held entity's pose with the tip in it (for the room).
export function tipped(o, group, outP, outQ) {
  outQ.copy(o.quaternion).multiply(group.quaternion);
  outP.copy(group.position).multiply(o.scale).applyQuaternion(o.quaternion).add(o.position);
}
