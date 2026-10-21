import * as THREE from "three";
import { hasComponent } from "bitecs";
import { Held } from "../bit-components";

// The mime's balloon animals on Jay's table in the Rovers (lounge-assets
// tables.py): he twists one for the table every round and sets it down; from
// that moment its bone on the prop rig (DinCafeProps_BAj0..3) holds still at
// PROXY scale, and this system shows a copy there that Jay and his guest can
// pick up (grip in VR, or grab with the cursor). Picked up, it is theirs: it
// stays wherever it is put down (on the table, or dropped onto whatever is
// under it) and no longer follows the clip; where it is is shared with the room
// over NAF messages ("lounge-balloon"), like the glasses (drinks.js). One left
// alone on the table pops with all the others when the mime snaps his fingers
// at the end of the loop. The copies' meshes are LoungeBalloon_<bone> in the
// scene (parked out of sight under the building).
const DATA_TYPE = "lounge-balloon";
const BONES = ["BAj0", "BAj1", "BAj2", "BAj3"];
const PROXY_LO = 0.0035; // the bone's scale while the copy is on show (tables.py PROXY = 0.005)
const PROXY_HI = 0.0075;
const MAX_FREE = 8; // picked-up balloons kept (the oldest goes)
const SEND_EVERY = 0.1; // s, while held
const TELL_EVERY = 8; // s, the last mover repeats its state (late joiners)
const TABLE_R = 0.3;

const m4 = new THREE.Matrix4();
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const scl = new THREE.Vector3();
const down = new THREE.Vector3(0, -1, 0);

AFRAME.registerSystem("lounge-balloons", {
  init() {
    this.slots = [];
    this.free = [];
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.subscribed = false;
    this.raycaster = new THREE.Raycaster();
  },

  remove() {
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.clear();
  },

  clear() {
    for (const s of this.slots) s.proxy?.el.parentNode?.removeChild(s.proxy.el);
    for (const b of this.free) b.el.parentNode?.removeChild(b.el);
    this.slots = [];
    this.free = [];
  },

  onSceneLoaded() {
    this.clear();
    const envRoot = document.querySelector("#environment-root");
    if (!envRoot) return;
    this.envRoot = envRoot.object3D;
    const skinned = [];
    this.envRoot.traverse(o => {
      if (o.isSkinnedMesh) skinned.push(o);
    });
    for (const name of BONES) {
      const template = this.envRoot.getObjectByName(`LoungeBalloon_${name}`);
      const bone = this.envRoot.getObjectByName(`DinCafeProps_${name}`);
      if (!template || !bone) continue;
      let mesh = null;
      template.traverse(o => {
        if (!mesh && o.isMesh) mesh = o;
      });
      if (!mesh) continue;
      template.visible = false;
      const sk = skinned.find(s => s.skeleton?.bones.includes(bone));
      if (!sk) continue;
      this.slots.push({
        name,
        bone,
        sk,
        index: sk.skeleton.bones.indexOf(bone),
        geometry: mesh.geometry,
        material: mesh.material,
        proxy: null, // the copy following the bone while it is on the table
        suppressed: false, // picked up: no copy until the bone's next set-down
        inBand: 0,
        pop: 0
      });
    }
  },

  // The copy's world matrix: the bone's skinning transform with its scale taken out.
  boneMatrix(s, out) {
    const { sk, index } = s;
    s.bone.updateWorldMatrix(true, false);
    sk.updateWorldMatrix(true, false);
    out.copy(sk.matrixWorld).multiply(sk.bindMatrixInverse);
    out.multiply(s.bone.matrixWorld).multiply(sk.skeleton.boneInverses[index]).multiply(sk.bindMatrix);
    out.decompose(pos, quat, scl);
    return out.compose(pos, quat, scl.set(1, 1, 1));
  },

  makeEntity(slot) {
    const el = document.createElement("a-entity");
    el.setAttribute("class", "interactable");
    el.setAttribute(
      "body-helper",
      "type: kinematic; mass: 0.1; collisionFilterGroup: 1; collisionFilterMask: 15; gravity: 0 0 0;"
    );
    // (sized from the animal: a box round its mesh, from its feet up)
    slot.geometry.computeBoundingBox();
    const bb = slot.geometry.boundingBox;
    const hx = Math.max(0.04, (bb.max.x - bb.min.x) / 2);
    const hy = Math.max(0.04, (bb.max.y - bb.min.y) / 2);
    const hz = Math.max(0.04, (bb.max.z - bb.min.z) / 2);
    const c = bb.getCenter(new THREE.Vector3());
    el.setAttribute(
      "shape-helper",
      `type: box; fit: manual; halfExtents: ${hx} ${hy} ${hz}; offset: ${c.x} ${c.y} ${c.z}`
    );
    el.setAttribute("is-remote-hover-target", "");
    el.setAttribute(
      "tags",
      "isHandCollisionTarget: true; isHoldable: true; offersHandConstraint: true; offersRemoteConstraint: true;"
    );
    const m = new THREE.Mesh(slot.geometry, slot.material);
    el.object3D.add(m);
    const root = document.querySelector("#objects-root") || this.el.sceneEl;
    root.appendChild(el);
    return { el, mesh: m };
  },

  subscribe() {
    if (this.subscribed || !window.NAF?.connection?.subscribeToDataChannel) return;
    NAF.connection.subscribeToDataChannel(DATA_TYPE, (_from, _type, data) => this.onMessage(data));
    this.subscribed = true;
  },

  send(b, reliable) {
    const o = b.el.object3D;
    const data = {
      id: b.id,
      bone: b.name,
      held: b.held,
      p: o.position.toArray().map(n => Math.round(n * 1000) / 1000),
      q: o.quaternion.toArray().map(n => Math.round(n * 10000) / 10000),
      by: window.NAF?.clientId || ""
    };
    try {
      if (reliable) NAF.connection.broadcastDataGuaranteed(DATA_TYPE, data);
      else NAF.connection.broadcastData(DATA_TYPE, data);
    } catch {
      /* not connected yet */
    }
  },

  onMessage(data) {
    if (!data?.id || !Array.isArray(data.p) || !Array.isArray(data.q) || data.by === window.NAF?.clientId) return;
    let b = this.free.find(x => x.id === data.id);
    if (!b) {
      const slot = this.slots.find(s => s.name === data.bone);
      if (!slot) return;
      b = this.detach(slot, data.id); // (theirs now: our copy of it goes with it)
      if (!b) return;
    }
    if (b.held) return;
    b.owner = false;
    b.remote = {
      held: !!data.held,
      p: new THREE.Vector3().fromArray(data.p),
      q: new THREE.Quaternion().fromArray(data.q)
    };
    b.settle = null;
  },

  // The slot's copy (or a new one at the bone) becomes a free balloon.
  detach(slot, id) {
    let ent = slot.proxy;
    slot.proxy = null;
    slot.suppressed = true;
    if (!ent) {
      ent = this.makeEntity(slot);
      this.boneMatrix(slot, m4).decompose(ent.el.object3D.position, ent.el.object3D.quaternion, scl);
    }
    ent.mesh.scale.setScalar(1);
    ent.el.object3D.visible = true;
    const b = {
      id,
      name: slot.name,
      el: ent.el,
      held: false,
      owner: false,
      remote: null,
      settle: null,
      nextSend: 0,
      nextTell: 0
    };
    this.free.push(b);
    while (this.free.length > MAX_FREE) {
      const old = this.free.shift();
      old.el.parentNode?.removeChild(old.el);
    }
    return b;
  },

  kinematic(el) {
    const ps = this.el.sceneEl.systems["hubs-systems"]?.physicsSystem;
    const eid = el.object3D.eid;
    if (ps && eid !== undefined && el.components["body-helper"]) {
      try {
        ps.updateRigidBodyOptions(eid, { type: "kinematic" });
      } catch {
        el.setAttribute("body-helper", "type", "kinematic");
      }
    }
  },

  // Let go: on Jay's table it stands where it was set; anywhere else it drops
  // straight down onto whatever is below. Upright either way, keeping its turn.
  place(b) {
    const o = b.el.object3D;
    const to = o.position.clone();
    const table = this.el.sceneEl.systems["lounge-drinks"]?.table;
    let landed = false;
    if (table) {
      const d = new THREE.Vector2(o.position.x - table.x, o.position.z - table.z);
      const high = o.position.y - table.y;
      if (d.length() < TABLE_R + 0.15 && high > -0.15 && high < 0.6) {
        if (d.length() > TABLE_R - 0.05) d.setLength(TABLE_R - 0.05);
        to.set(table.x + d.x, table.y, table.z + d.y);
        landed = true;
      }
    }
    if (!landed && this.envRoot) {
      this.raycaster.set(o.position.clone().add(new THREE.Vector3(0, 0.05, 0)), down);
      this.raycaster.far = 4;
      const hit = this.raycaster.intersectObject(this.envRoot, true).find(h => h.object.visible && h.face);
      if (hit) to.y = hit.point.y;
    }
    const e = new THREE.Euler().setFromQuaternion(o.quaternion, "YXZ");
    const upright = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, e.y, 0, "YXZ"));
    b.settle = { from: o.position.clone(), fromQ: o.quaternion.clone(), to, toQ: upright, t: 0 };
  },

  tick(time, dtMs) {
    if (!this.slots.length) return;
    this.subscribe();
    const dt = Math.min(0.1, (dtMs || 16) / 1000);
    const now = time / 1000;
    // Copies following the clip: on show while the bone is set down at PROXY scale.
    for (const s of this.slots) {
      s.bone.updateWorldMatrix(true, false);
      const k = s.bone.scale.x;
      const band = k > PROXY_LO && k < PROXY_HI;
      s.inBand = band ? s.inBand + 1 : 0;
      if (!band && s.suppressed && k < PROXY_LO) s.suppressed = false; // (gone: the next set-down is a new one)
      if (s.proxy) {
        const eid = s.proxy.el.object3D.eid;
        if (eid !== undefined && hasComponent(APP.world, Held, eid)) {
          const b = this.detach(s, `${s.name}:${window.NAF?.clientId || "me"}:${Math.round(now * 1000)}`);
          b.held = true;
          b.owner = true;
          continue;
        }
      }
      if (band && s.inBand >= 2 && !s.suppressed) {
        if (!s.proxy) s.proxy = this.makeEntity(s);
        const o = s.proxy.el.object3D;
        this.boneMatrix(s, m4).decompose(o.position, o.quaternion, scl);
        o.visible = true;
        o.matrixNeedsUpdate = true;
        s.proxy.mesh.scale.setScalar(1);
        s.pop = 0;
      } else if (s.proxy) {
        // Off the table in the clip (the mime's snap): a quick pop, then gone.
        s.pop += dt;
        s.proxy.mesh.scale.setScalar(1 + 2.5 * Math.min(s.pop, 0.1));
        if (s.pop > 0.1) {
          s.proxy.el.parentNode?.removeChild(s.proxy.el);
          s.proxy = null;
        }
      }
    }
    // Free ones: held here, settling, or following whoever moved them last.
    for (const b of this.free) {
      const o = b.el.object3D;
      const eid = o.eid;
      const heldNow = eid !== undefined && hasComponent(APP.world, Held, eid);
      if (heldNow && !b.held) {
        b.held = true;
        b.owner = true;
        b.remote = null;
        b.settle = null;
      } else if (!heldNow && b.held) {
        b.held = false;
        this.kinematic(b.el);
        this.place(b);
        b.nextTell = 0;
      }
      if (b.held) {
        if (now >= b.nextSend) {
          this.send(b, false);
          b.nextSend = now + SEND_EVERY;
        }
        continue;
      }
      if (b.settle) {
        const st = b.settle;
        st.t = Math.min(1, st.t + dt / 0.35);
        const e = st.t * st.t * (3 - 2 * st.t);
        o.position.lerpVectors(st.from, st.to, e);
        o.quaternion.slerpQuaternions(st.fromQ, st.toQ, e);
        o.matrixNeedsUpdate = true;
        if (st.t >= 1) {
          b.settle = null;
          if (b.owner) this.send(b, true);
        }
      } else if (b.remote) {
        o.position.lerp(b.remote.p, Math.min(1, dt * 12));
        o.quaternion.slerp(b.remote.q, Math.min(1, dt * 12));
        o.matrixNeedsUpdate = true;
      }
      if (b.owner && !b.settle && now >= b.nextTell) {
        this.send(b, true);
        b.nextTell = now + TELL_EVERY;
      }
    }
  }
});
