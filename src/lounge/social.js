import * as THREE from "three";
import { SocialState, ContactLatch } from "./social-state.cjs";
import { sampleHandPose } from "./social-animation.cjs";
import { SocialControls, poseName } from "./social-controls";

const V = THREE.Vector3;
const Q = THREE.Quaternion;
const UP = new V(0, 1, 0);
const DOWN = new V(0, -1, 0);
const p = new V(),
  v = new V(),
  a = new V(),
  b = new V(),
  direction = new V(),
  sideVector = new V();
const fingers = new V(),
  palm = new V(),
  right = new V();
const m = new THREE.Matrix4();
const clamp = THREE.MathUtils.clamp;

function point(root, name, out) {
  const bone = root?.getObjectByName(name);
  if (!bone) return false;
  bone.getWorldPosition(out);
  return true;
}
function segmentDistance(position, start, end) {
  v.subVectors(end, start);
  const t = clamp(p.subVectors(position, start).dot(v) / Math.max(v.lengthSq(), 0.00001), 0, 1);
  return p.copy(start).addScaledVector(v, t).distanceTo(position);
}

AFRAME.registerSystem("lounge-social", {
  init() {
    this.state = new SocialState("");
    this.actors = new Map();
    this.contacts = new ContactLatch();
    this.receivedContacts = new ContactLatch();
    this.poseVersion = 0;
    this.allowedEmote = null;
    this.offset = null;
    this.nextSync = 0;
    this.nextHeartbeat = 0;
    this.lastStateSentAt = -Infinity;
    this.nextTouch = 0;
    this.message = "";
    this.receive = this.receive.bind(this);
    this.onBlocked = () => {
      this.stop();
      this.state.touch = false;
      this.state.peers.clear();
    };
    document.body.addEventListener("blocked", this.onBlocked);
    this.timer = setInterval(() => this.sync(), 250);
  },
  now() {
    return Date.now() + (this.offset || 0);
  },
  owner(el) {
    const player = el?.closest?.("[player-info]");
    if (!player) return null;
    return player.id === "avatar-rig"
      ? NAF.clientId
      : player.components["player-info"]?.playerSessionId || player.components.networked?.data?.creator;
  },
  displayName(id) {
    const metas = window.APP?.hubChannel?.presence?.state?.[id]?.metas;
    return String(metas?.[0]?.profile?.displayName || (id === this.state.id ? "You" : "Participant"))
      .replace(/\s+/g, " ")
      .slice(0, 40);
  },
  present() {
    return new Set(
      Object.entries(window.APP?.hubChannel?.presence?.state || {})
        .filter(([, data]) => data.metas?.some(meta => meta.presence === "room"))
        .map(([id]) => id)
    );
  },
  refreshActors() {
    this.actors.clear();
    for (const el of this.el.querySelectorAll("[avatar-arm-ik]")) {
      const id = this.owner(el);
      if (id)
        this.actors.set(id, {
          el,
          root: el.object3D,
          ik: el.components["ik-controller"],
          arms: el.components["avatar-arm-ik"]
        });
    }
  },
  partners() {
    const present = this.present();
    return [...this.state.peers.keys()]
      .filter(id => id !== this.state.id && present.has(id) && this.actors.has(id))
      .sort()
      .map(id => ({ id, name: this.displayName(id) }));
  },
  incoming() {
    return [...this.state.invites.values()].find(
      invite => invite.b === this.state.id && this.now() - invite.at < 15000
    );
  },
  async send(payload, quiet = false) {
    const channel = window.APP?.hubChannel?.channel;
    if (!this.el.is("entered") || channel?.state !== "joined") return null;
    return new Promise(resolve => {
      channel
        .push("lounge_social:send", payload, 4000)
        .receive("ok", event => {
          this.receive(event);
          resolve(event);
        })
        .receive("error", error => {
          if (!quiet) this.message = `Action not sent: ${error.reason || "try again"}`;
          resolve(null);
        })
        .receive("timeout", () => {
          if (!quiet) this.message = "Connection interrupted. Try again when connected.";
          resolve(null);
        });
    });
  },
  receive(event) {
    if (this.offset === null && Number.isFinite(event?.at)) this.offset = event.at - Date.now();
    if (
      event?.from_session_id === this.state.id &&
      event.type === "emote" &&
      event.name !== "none" &&
      this.allowedEmote !== event.name
    )
      return;
    const before = this.state.pairFor(this.state.id);
    if (!this.state.receive(event, this.now())) return;
    if (event.type === "invite" && event.to === this.state.id && this.state.invites.has(event.id)) {
      this.message = `${this.displayName(event.from_session_id)} invites you to ${poseName(event.pose).toLowerCase()}.`;
      this.controls?.open("Partner");
    }
    const after = this.state.pairFor(this.state.id);
    if (after && !before) {
      this.message = `${poseName(after.name)} with ${this.displayName(after.a === this.state.id ? after.b : after.a)}. Stop ends it.`;
      if (after.name === "sit_together" && !this.sitOnFloor()) this.stop();
    }
    if (before && !after) this.leaveFloor();
    if (event.type === "touch") this.receiveTouch(event);
    this.controls?.update();
  },
  sync() {
    if (this.el.systems["lounge-tv"]?.isFeeder) return;
    const channel = window.APP?.hubChannel?.channel;
    const id = window.NAF?.clientId;
    const joined = id && this.el.is("entered") && channel?.state === "joined";
    if (!joined) {
      if (this.wasJoined) {
        this.stop();
        this.state = new SocialState(id || "");
        this.offset = null;
        this.nextHeartbeat = 0;
        this.nextTouch = 0;
      }
      this.wasJoined = false;
      this.controls?.update();
      return;
    }
    if (this.channel !== channel || this.state.id !== id) {
      this.stop();
      if (this.channel) this.channel.off("lounge_social:event", this.binding);
      this.state = new SocialState(id);
      this.offset = null;
      this.channel = channel;
      this.binding = channel.on("lounge_social:event", this.receive);
      this.nextHeartbeat = 0;
    }
    this.wasJoined = true;
    if (!this.controls) this.controls = new SocialControls(this.el, this);
    this.refreshActors();
    const now = this.now();
    if (now >= this.nextHeartbeat) {
      this.publishState(now);
    }
    const before = this.state.pairFor(id);
    this.state.expire(now, this.present());
    const after = this.state.pairFor(id);
    if (before && !after) {
      this.message = "Pose ended. Partner left or connection expired.";
      this.leaveFloor();
    }
    if (after) {
      const other = after.a === id ? after.b : after.a;
      if (!this.closeEnough(id, other, 1.5)) this.stop("Pose ended because you moved apart.");
    }
    if (this.floor && !this.poseFor(this.actors.get(id)?.el)) this.leaveFloor();
    this.controls.update();
  },
  poseFor(el) {
    const id = this.owner(el);
    const pair = this.state.pairFor(id);
    const pose = pair || this.state.emotes.get(id);
    if (!pose || this.now() > pose.until || pose.name === "none") return null;
    return { ...pose, phase: Math.max(0, (this.now() - pose.startedAt) / 1000) };
  },
  expressionFor(el) {
    const expression = this.state.expressions.get(this.owner(el));
    return expression && this.now() < expression.until
      ? { ...expression, phase: (this.now() - expression.startedAt) / 1000 }
      : null;
  },
  publishState(now) {
    if (this.statePublish || now < (this.lastStateSentAt ?? -Infinity) + 1100) return;
    const pending = { state: this.state, touch: this.state.touch };
    this.statePublish = pending;
    this.lastStateSentAt = now;
    this.nextHeartbeat = now + 3000;
    return this.send({ type: "state", touch: pending.touch }, true).then(event => {
      if (this.statePublish === pending) this.statePublish = null;
      if (this.state !== pending.state) return;
      if (!event || this.state.touch !== pending.touch)
        this.nextHeartbeat = Math.max(this.now(), this.lastStateSentAt + 1100);
      if (!event && this.touchPending) this.message = "Touch setting not yet shared. Retrying.";
      if (event && this.state.touch === pending.touch && this.touchPending) {
        this.touchPending = false;
        this.message = this.state.touch
          ? "Touch enabled for this visit. Your partner must enable it too."
          : "Touch feedback off.";
      }
      this.controls?.update();
    });
  },
  toggleTouch() {
    this.state.touch = !this.state.touch;
    this.contacts.contacts.clear();
    this.receivedContacts.contacts.clear();
    this.message = this.state.touch ? "Touch enabled. Sharing your setting with the room." : "Touch feedback off.";
    // Coalesce rapid toggles with the heartbeat. Sending immediately could
    // collide with its one-second server limit and silently undo an opt-in.
    this.touchPending = true;
    this.nextHeartbeat = Math.max(this.now(), (this.lastStateSentAt ?? -Infinity) + 1100);
    this.controls?.update();
  },
  async emote(name) {
    this.stop(undefined, false);
    if (name === "sit" && !this.canSit()) return;
    const version = this.poseVersion;
    this.allowedEmote = name;
    const event = await this.send({ type: "emote", name });
    if (version !== this.poseVersion) return;
    if (!event) this.allowedEmote = null;
    if (event && name === "sit" && !this.sitOnFloor()) this.stop();
    if (event)
      this.message =
        name === "sit"
          ? "Seated on the floor. Stop pose stands you up."
          : `${name[0].toUpperCase() + name.slice(1)}. Stop returns control immediately.`;
  },
  expression(name) {
    this.send({ type: "expression", name });
  },
  closeEnough(first, second, max = 1.1) {
    const ar = this.actors.get(first),
      br = this.actors.get(second);
    if (!ar || !br || !point(ar.root, "Head", a) || !point(br.root, "Head", b)) return false;
    return Math.hypot(a.x - b.x, a.z - b.z) <= max && Math.abs(a.y - b.y) < 1;
  },
  async invite(to, pose) {
    if (!to || !this.closeEnough(this.state.id, to)) {
      this.message = "Stand within one metre of your partner first.";
      return;
    }
    if (this.state.pairFor(this.state.id)) return;
    if ([...this.state.invites.values()].some(item => item.a === this.state.id || item.b === this.state.id)) {
      this.message = "Finish or stop the current invitation first.";
      return;
    }
    if (pose === "sit_together" && !this.canSit()) return;
    const id = crypto.randomUUID();
    const version = this.poseVersion;
    this.state.consent(id, { a: this.state.id, b: to, name: pose });
    const event = await this.send({ type: "invite", id, to, pose });
    if (version !== this.poseVersion) return;
    if (!event || (!this.state.invites.has(id) && !this.state.pairs.has(id))) {
      this.state.cancel(id, this.now());
      if (event) this.send({ type: "stop", id, to }, true);
      this.message = "Invitation unavailable. Finish the existing invitation first.";
    } else this.message = `Waiting for ${this.displayName(to)} to accept ${poseName(pose).toLowerCase()}.`;
  },
  async accept(id) {
    const invitation = this.state.invites.get(id);
    if (!invitation || invitation.b !== this.state.id || this.now() - invitation.at > 15000) return;
    if (!this.closeEnough(this.state.id, invitation.a)) {
      this.message = "Move within one metre before accepting.";
      return;
    }
    if (invitation.name === "sit_together" && !this.canSit()) return;
    this.state.consent(id);
    const event = await this.send({ type: "accept", id, to: invitation.a });
    if (!event) this.state.consented.delete(id);
  },
  decline(id) {
    const item = this.state.invites.get(id);
    if (!item) return;
    this.state.cancel(id, this.now());
    this.send({ type: "stop", id, to: item.a === this.state.id ? item.b : item.a }, true);
    this.message = "Invitation declined.";
    this.controls?.update();
  },
  stop(message = "Pose stopped.", sendEmote = true) {
    const id = this.state.id;
    this.poseVersion = (this.poseVersion || 0) + 1;
    const pendingEmote = this.allowedEmote;
    this.allowedEmote = null;
    const items = new Map([...this.state.pairs, ...this.state.invites]);
    for (const [key, item] of this.state.consented) if (!items.has(key)) items.set(key, { ...item, id: key });
    for (const item of items.values()) {
      if (item.a !== id && item.b !== id) continue;
      this.state.cancel(item.id, this.now());
      this.send({ type: "stop", id: item.id, to: item.a === id ? item.b : item.a }, true);
    }
    const hadEmote = this.state.emotes.has(id);
    this.state.emotes.delete(id);
    if ((hadEmote || pendingEmote) && sendEmote) this.send({ type: "emote", name: "none" }, true);
    this.leaveFloor();
    this.message = message;
    this.controls?.update();
  },
  sampleFloor(position) {
    const nav = this.el.systems.nav?.mesh;
    if (!nav) return null;
    if (!this.floorProxy || this.floorProxy.geometry !== nav.geometry) {
      this.floorProxy?.material.dispose();
      this.floorProxy = new THREE.Mesh(nav.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    }
    nav.updateMatrices();
    this.floorProxy.matrixWorld.copy(nav.matrixWorld);
    this.floorProxy.matrix.copy(nav.matrixWorld);
    this.floorProxy.matrixAutoUpdate = false;
    this.floorRay = this.floorRay || new THREE.Raycaster();
    this.floorRay.set(position, DOWN);
    this.floorRay.near = 0;
    this.floorRay.far = 2;
    const hit = this.floorRay.intersectObject(this.floorProxy, false)[0];
    return hit?.point.clone() || null;
  },
  canSit() {
    const actor = this.actors.get(this.state.id);
    if (!actor || !point(actor.root, "Hips", a)) return false;
    a.y += 0.2;
    if (!this.sampleFloor(a)) {
      this.message = "Choose a clear walkable floor before sitting.";
      return false;
    }
    if (this.el.systems["hubs-systems"].characterController.isMotionDisabled && !this.floor) {
      this.message = "Leave the furniture seat before sitting on the floor.";
      return false;
    }
    return true;
  },
  sitOnFloor() {
    if (this.floor) return true;
    if (!this.canSit()) return false;
    const actor = this.actors.get(this.state.id);
    point(actor.root, "Hips", a);
    const head = document.getElementById("avatar-pov-node").object3D;
    head.getWorldPosition(b);
    const eyeToHip = clamp(b.y - a.y, 0.45, 0.9);
    a.y += 0.2;
    const floor = this.sampleFloor(a);
    if (!floor) return false;
    this.floor = floor.clone();
    const hs = this.el.systems["hubs-systems"];
    hs.waypointSystem.releaseAnyOccupiedWaypoints();
    // This is the existing explicitly selected seating relocation path. The
    // headset's own tracking transform remains untouched.
    hs.characterController.enqueueWaypointTravelTo(
      new THREE.Matrix4().makeTranslation(floor.x, floor.y, floor.z),
      true,
      {
        snapToNavMesh: false,
        willDisableMotion: true,
        willDisableTeleporting: false,
        willMaintainInitialOrientation: true,
        willMaintainWorldUp: true,
        eyeHeight: eyeToHip
      }
    );
    return true;
  },
  leaveFloor() {
    if (!this.floor) return;
    const head = document.getElementById("avatar-pov-node")?.object3D;
    const cc = this.el.systems["hubs-systems"]?.characterController;
    if (head && cc) {
      head.getWorldPosition(a);
      const floor = this.sampleFloor(a) || this.floor;
      cc.teleportTo(floor);
    }
    this.floor = null;
  },
  // Called by the existing arm solver after it reads tracked wrists. We blend
  // only avatar wrists; controller rays and the tracked headset are never moved.
  applyHandPose(el, rig, dt) {
    const pose = this.poseFor(el);
    const side = rig.side.sign === 1 ? "left" : "right";
    let sample = pose && sampleHandPose(pose.name, side, pose.phase);
    if (pose && pose.a && pose.name !== "sit_together") sample = this.pairedHand(el, rig, pose);
    const hand = rig.hand;
    const targetWeight = sample ? Math.min(1, pose.phase / 0.3) : 0;
    rig.socialWeight = (rig.socialWeight || 0) + (targetWeight - (rig.socialWeight || 0)) * (1 - Math.exp(-16 * dt));
    if (sample) {
      rig.socialPosition = rig.socialPosition || new V();
      rig.socialQuaternion = rig.socialQuaternion || new Q();
      rig.socialPosition.fromArray(sample.position);
      fingers.fromArray(sample.fingers).normalize();
      palm.fromArray(sample.palm).addScaledVector(fingers, -fingers.dot(palm)).normalize();
      right.crossVectors(fingers, palm).normalize();
      rig.socialQuaternion.setFromRotationMatrix(m.makeBasis(right, fingers, palm));
    }
    if (rig.socialWeight > 0.001 && rig.socialPosition) {
      hand.position.lerp(rig.socialPosition, rig.socialWeight);
      hand.quaternion.slerp(rig.socialQuaternion, rig.socialWeight);
      hand.matrixNeedsUpdate = true;
      hand.updateWorldMatrix(true, false);
    }
  },
  pairedHand(el, rig, pair) {
    const ownId = this.owner(el);
    const otherId = pair.a === ownId ? pair.b : pair.a;
    const own = this.actors.get(ownId),
      other = this.actors.get(otherId);
    if (!own || !other || !point(own.root, "Spine", a) || !point(other.root, "Spine", b)) return null;
    direction.subVectors(b, a);
    direction.y = 0;
    if (direction.lengthSq() < 0.04 || direction.lengthSq() > 2.25) return null;
    direction.normalize();
    sideVector.crossVectors(UP, direction).normalize();
    const sign = rig.side.sign;
    const sway = pair.name === "slow_dance" ? 0.035 * Math.sin(pair.phase * 1.6) : 0;
    if (pair.name === "hug") {
      p.copy(b)
        .addScaledVector(sideVector, sign * 0.18)
        .addScaledVector(direction, 0.1);
      p.y = b.y + 0.08 + (sign > 0 ? 0.035 : -0.035);
    } else if (pair.name === "slow_dance" && ((ownId === pair.a && sign < 0) || (ownId === pair.b && sign > 0))) {
      p.copy(b)
        .addScaledVector(sideVector, sign * 0.19)
        .addScaledVector(direction, 0.04);
      p.y = b.y + 0.14;
    } else {
      p.addVectors(a, b)
        .multiplyScalar(0.5)
        .addScaledVector(sideVector, sign * 0.19 + sway);
      p.y = (a.y + b.y) * 0.5 + (pair.name === "slow_dance" ? 0.16 : -0.07);
    }
    // Convert shared world targets to this actor's chest frame. Facing each
    // other maps one person's left wrist onto the other's right wrist.
    rig.hand.parent.worldToLocal(p);
    return { position: p.toArray(), fingers: [0, 1, 0.2], palm: [-sign, 0, 0] };
  },
  allowsCloseContact(el) {
    const id = this.owner(el);
    if (!id || id === this.state.id) return false;
    const pair = this.state.pairFor(this.state.id);
    return (pair && (pair.a === id || pair.b === id)) || this.state.mutualTouch(id, this.now());
  },
  contact(sourceId, side, targetId) {
    const source = this.actors.get(sourceId),
      target = this.actors.get(targetId);
    if (!source || !target) return null;
    const sourceRig = source.arms?.rigs?.find(r => (r.side.sign > 0 ? "left" : "right") === side);
    if (!sourceRig || !source.arms.effectorTracked(sourceRig.side)) return null;
    const hand = sourceRig.hand.getWorldPosition(new V());
    let best = { distance: Infinity, zone: "hand", targetSide: side, radius: 0.12 };
    for (const [name, targetSide] of [
      ["LeftHand", "left"],
      ["RightHand", "right"]
    ]) {
      if (point(target.root, name, a)) {
        const distance = a.distanceTo(hand);
        if (distance < best.distance) best = { distance, zone: "hand", targetSide, radius: 0.12 };
      }
    }
    for (const prefix of ["Left", "Right"]) {
      if (point(target.root, prefix + "Arm", a) && point(target.root, prefix + "ForeArm", b)) {
        const distance = segmentDistance(hand, a, b);
        if (distance < best.distance) best = { distance, zone: "arm", radius: 0.1 };
      }
      if (point(target.root, prefix + "ForeArm", a) && point(target.root, prefix + "Hand", b)) {
        const distance = segmentDistance(hand, a, b);
        if (distance < best.distance) best = { distance, zone: "arm", radius: 0.1 };
      }
      if (point(target.root, prefix + "Shoulder", a)) {
        const distance = a.distanceTo(hand);
        if (distance < best.distance) best = { distance, zone: "shoulder", radius: 0.14 };
      }
    }
    if (point(target.root, "Head", a)) {
      const distance = a.distanceTo(hand);
      if (distance < best.distance) best = { distance, zone: "face", radius: 0.16 };
    }
    return best;
  },
  receiveTouch(event) {
    const localIsSource = event.from_session_id === this.state.id;
    if (!localIsSource && event.to !== this.state.id) return;
    const other = localIsSource ? event.to : event.from_session_id;
    if (!this.state.mutualTouch(other, this.now())) return;
    const hit = this.contact(event.from_session_id, event.side, event.to);
    if (!hit || hit.distance > hit.radius + 0.06 || hit.zone !== event.zone) return;
    if (
      !this.receivedContacts.sample(
        `${event.from_session_id}:${event.side}:${event.to}`,
        hit.distance,
        this.now(),
        hit.radius
      )
    )
      return;
    const haptics = this.el.systems["hubs-systems"]?.hapticFeedbackSystem;
    if (!haptics) return;
    const side = localIsSource ? event.side : hit.targetSide;
    haptics.requestSocialPulse(side || "both", 0.22, 80);
  },
  tock() {
    const now = this.now();
    if (!this.wasJoined || !this.state.touch || now < this.nextTouch) return;
    this.nextTouch = now + 50;
    // Release receiving latches from locally observed separation, never from
    // a sender's claim. Repeated unique packets cannot make steady contact buzz.
    for (const key of this.receivedContacts.contacts.keys()) {
      const [source, side, target] = key.split(":");
      const hit = this.contact(source, side, target);
      if (!hit || hit.distance > hit.radius + 0.06) this.receivedContacts.sample(key, Infinity, now);
    }
    if (now < (this.nextTouchSend || 0)) return;
    for (const { id } of this.partners()) {
      if (!this.state.mutualTouch(id, now)) continue;
      for (const side of ["left", "right"]) {
        const hit = this.contact(this.state.id, side, id);
        if (!hit) continue;
        if (this.contacts.sample(`${id}:${side}`, hit.distance, now, hit.radius)) {
          this.nextTouchSend = now + 220;
          this.send({ type: "touch", id: crypto.randomUUID(), to: id, side, zone: hit.zone }, true).then(event => {
            if (!event) this.contacts.contacts.delete(`${id}:${side}`);
          });
          return;
        }
      }
    }
  },
  remove() {
    this.stop();
    clearInterval(this.timer);
    this.controls?.remove();
    this.floorProxy?.material.dispose();
    if (this.channel) this.channel.off("lounge_social:event", this.binding);
    document.body.removeEventListener("blocked", this.onBlocked);
  }
});
