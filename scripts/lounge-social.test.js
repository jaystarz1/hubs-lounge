const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const THREE = require("three");
const { SocialState, ContactLatch } = require("../src/lounge/social-state.cjs");
const { sampleHandPose } = require("../src/lounge/social-animation.cjs");
let component;
const source = fs.readFileSync(require.resolve("../src/lounge/social.js"), "utf8").replace(/^import .*;\n/gm, "");
vm.runInNewContext(source, {
  THREE,
  SocialState,
  ContactLatch,
  sampleHandPose,
  AFRAME: { registerSystem: (_name, c) => (component = c) },
  NAF: { clientId: "a" },
  Date,
  console
});
function actor(id, z, yaw) {
  const root = new THREE.Group();
  root.position.set(0, 1, z);
  root.rotation.y = yaw;
  for (const name of [
    "Spine",
    "Head",
    "Hips",
    "LeftHand",
    "RightHand",
    "LeftArm",
    "RightArm",
    "LeftForeArm",
    "RightForeArm",
    "LeftShoulder",
    "RightShoulder"
  ]) {
    const bone = new THREE.Bone();
    bone.name = name;
    root.add(bone);
    bone.position.set(
      name.startsWith("Left") ? 0.2 : name.startsWith("Right") ? -0.2 : 0,
      name === "Head" ? 0.55 : 0,
      0
    );
  }
  root.updateMatrixWorld(true);
  const rigs = [1, -1].map(sign => ({
    side: { sign },
    hand: root.getObjectByName(sign > 0 ? "LeftHand" : "RightHand")
  }));
  const el = { id, object3D: root };
  return { el, root, arms: { rigs, effectorTracked: () => true } };
}
function system() {
  const a = actor("a", 0, 0),
    b = actor("b", 0.6, Math.PI);
  const state = new SocialState("a");
  state.touch = true;
  state.peers.set("b", { touch: true, at: 1000 });
  const pulses = [];
  const s = {
    ...component,
    state,
    poseVersion: 0,
    receivedContacts: new ContactLatch(),
    actors: new Map([
      ["a", a],
      ["b", b]
    ]),
    owner: el => el?.id,
    now: () => 1200,
    el: { systems: { "hubs-systems": { hapticFeedbackSystem: { requestSocialPulse: (...p) => pulses.push(p) } } } }
  };
  return { s, a, b, pulses };
}
test("paired wrist targets coincide for opposite hands without moving either head", () => {
  const { s, a, b } = system();
  const pair = { a: "a", b: "b", name: "hold_hands", phase: 1 };
  const headA = a.root.getObjectByName("Head").getWorldPosition(new THREE.Vector3());
  const handA = s.pairedHand(a.el, a.arms.rigs[0], pair);
  const handB = s.pairedHand(b.el, b.arms.rigs[1], pair);
  const worldA = a.root.localToWorld(new THREE.Vector3().fromArray(handA.position));
  const worldB = b.root.localToWorld(new THREE.Vector3().fromArray(handB.position));
  assert.ok(worldA.distanceTo(worldB) < 0.00001);
  assert.ok(headA.distanceTo(a.root.getObjectByName("Head").getWorldPosition(new THREE.Vector3())) < 0.00001);
});
test("emote ownership blends wrist pose and returns to tracked input without moving root", () => {
  const { s, a } = system();
  let pose = { name: "wave", phase: 1 };
  s.poseFor = () => pose;
  const rig = a.arms.rigs[1],
    rootPosition = a.root.position.clone(),
    original = rig.hand.position.clone();
  for (let i = 0; i < 60; i++) {
    rig.hand.position.copy(original);
    s.applyHandPose(a.el, rig, 0.016);
  }
  assert.ok(rig.hand.position.y > 0.35);
  assert.ok(Math.abs(rig.hand.quaternion.length() - 1) < 0.00001);
  pose = null;
  for (let i = 0; i < 60; i++) {
    rig.hand.position.copy(original);
    s.applyHandPose(a.el, rig, 0.016);
  }
  assert.ok(rig.hand.position.distanceTo(original) < 0.001);
  assert.ok(rootPosition.equals(a.root.position));
});
test("touch receiver rechecks mutual consent, distance and actual contact zone", () => {
  const { s, pulses } = system();
  s.contact = () => ({ distance: 0.08, radius: 0.12, zone: "hand", targetSide: "right" });
  const e = { from_session_id: "b", to: "a", side: "left", zone: "hand" };
  s.receiveTouch(e);
  assert.equal(pulses.length, 1);
  assert.equal(pulses[0][0], "right");
  s.receiveTouch({ ...e, id: "new-id-same-contact" });
  assert.equal(pulses.length, 1);
  s.state.touch = false;
  s.receiveTouch(e);
  assert.equal(pulses.length, 1);
  s.state.touch = true;
  s.contact = () => ({ distance: 0.8, radius: 0.12, zone: "hand" });
  s.receiveTouch(e);
  assert.equal(pulses.length, 1);
  s.contact = () => ({ distance: 0.08, radius: 0.12, zone: "face" });
  s.receiveTouch(e);
  assert.equal(pulses.length, 1);
});
test("contact includes the middle of a forearm, not just the upper arm and wrist", () => {
  const { s, a, b } = system();
  b.root.position.set(0, 1, 0);
  b.root.rotation.set(0, 0, 0);
  b.root.getObjectByName("LeftArm").position.set(2, 0, 0);
  b.root.getObjectByName("LeftForeArm").position.set(1.5, 0, 0);
  b.root.getObjectByName("LeftHand").position.set(1, 0, 0);
  a.arms.rigs[0].hand.position.set(1.25, 0.04, 0);
  a.root.updateMatrixWorld(true);
  b.root.updateMatrixWorld(true);
  const hit = s.contact("a", "left", "b");
  assert.equal(hit.zone, "arm");
  assert.ok(Math.abs(hit.distance - 0.04) < 1e-6);
});
test("touch opt-in coalesces with heartbeat and off takes effect immediately", async () => {
  const { s } = system();
  const sent = [];
  let now = 1000;
  s.now = () => now;
  s.contacts = new ContactLatch();
  s.state.touch = false;
  s.send = payload => {
    sent.push(payload);
    return Promise.resolve(payload);
  };
  await s.publishState(now);
  now = 1200;
  s.toggleTouch();
  assert.equal(s.state.touch, true);
  assert.equal(s.nextHeartbeat, 2100);
  await s.publishState(now);
  assert.equal(sent.length, 1);
  now = 2100;
  await s.publishState(now);
  assert.equal(sent.length, 2);
  assert.equal(sent[1].touch, true);
  now = 2200;
  s.toggleTouch();
  assert.equal(s.state.touch, false);
  s.toggleTouch();
  s.toggleTouch();
  now = 3200;
  await s.publishState(now);
  assert.equal(sent.length, 3);
  assert.equal(sent[2].touch, false);
});
test("Stop cancels an in-flight floor sit before its late acknowledgement", async () => {
  const { s } = system();
  let resolve;
  let relocations = 0;
  s.canSit = () => true;
  s.leaveFloor = () => {};
  s.sitOnFloor = () => {
    relocations++;
    return true;
  };
  s.send = payload => (payload.name === "sit" ? new Promise(r => (resolve = r)) : Promise.resolve(null));
  const pending = s.emote("sit");
  s.stop();
  resolve({ type: "emote", name: "sit" });
  await pending;
  assert.equal(relocations, 0);
  assert.equal(s.allowedEmote, null);
});
test("Stop tombstones locally consented requests before an invite echo exists", () => {
  const { s } = system();
  s.leaveFloor = () => {};
  const sent = [];
  s.send = payload => sent.push(payload);
  s.state.consent("pending", { a: "a", b: "b", name: "hug" });
  s.stop();
  assert.equal(s.state.consented.size, 0);
  assert.ok(s.state.cancelled.has("pending"));
  assert.equal(sent[0].type, "stop");
  assert.equal(sent[0].id, "pending");
});
test("floor sampling is storey-local and does not change hidden navmesh visibility", () => {
  const { s } = system();
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (const y of [0, 3]) vertices.push(-5, y, -5, 5, y, -5, 5, y, 5, -5, y, -5, 5, y, 5, -5, y, 5);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  const nav = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  nav.visible = false;
  nav.updateMatrices = () => nav.updateMatrixWorld(true);
  s.el.systems.nav = { mesh: nav };
  assert.equal(s.sampleFloor(new THREE.Vector3(0, 1, 0)).y, 0);
  assert.equal(s.sampleFloor(new THREE.Vector3(0, 4, 0)).y, 3);
  assert.equal(s.sampleFloor(new THREE.Vector3(10, 1, 0)), null);
  assert.equal(nav.visible, false);
  s.floorProxy.material.dispose();
  geometry.dispose();
  nav.material.dispose();
});
