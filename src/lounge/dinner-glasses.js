import * as THREE from "three";
import { hasComponent } from "bitecs";
import { Held } from "../bit-components";
import { sipState, sipTick, sipRelax, tipped, srgb } from "./sip";

// The wine glasses on the dinner table (lounge-assets dinner_figures: bones
// DinProps_G<wine><place> on the prop rig). While one stands untouched on the
// table its bone holds still at FREE scale and this system shows a copy there
// that anyone can pick up (grip in VR, or grab with the cursor), move, and
// drink from (bring it to your mouth: it tips to your lips, a sip each time,
// sip.js). Let go over the table top
// (LoungeSettingTable) it stands where it was put; anywhere else it goes back
// to its place. A second before a guest or a waiter comes for it (a sip, a
// pour, a glass change) the bone goes to FREE_BACK scale: the copy glides back
// to its spot (out of your hand, if you are holding it) and the clip's glass
// takes over again. Where a copy is, and how full, is shared with the room
// over NAF messages ("lounge-dinner-glass"), like the settings (settings.js).
const DATA_TYPE = "lounge-dinner-glass";
const FREE_LO = 0.0035; // dinner_figures FREE = 0.005
const FREE_HI = 0.0075;
const BACK_HI = 0.014; // dinner_figures FREE_BACK = 0.010
const BACK_TIME = 0.8; // s, the copy's glide home
const SEND_EVERY = 0.1;
const TELL_EVERY = 8;
const PENDING_FOR = 5; // s a message for a glass not (yet) free here is kept
const MARGIN = 0.12;

// dinner_figures GLASS_SHAPE: foot r, stem top, bowl (z0, r0, z1, r1), liquid (z0, r0, z1, r1); LIQUID.
const SHAPES = {
  champ: [0.032, 0.104, [0.104, 0.012, 0.25, 0.026], [0.11, 0.011, 0.235, 0.024], 0xe6cf7e],
  white: [0.034, 0.085, [0.088, 0.03, 0.2, 0.036], [0.094, 0.028, 0.19, 0.034], 0xe2d68a],
  red: [0.038, 0.075, [0.078, 0.044, 0.21, 0.042], [0.084, 0.041, 0.195, 0.04], 0x4e0c18],
  sweet: [0.028, 0.06, [0.062, 0.025, 0.135, 0.028], [0.067, 0.023, 0.125, 0.026], 0xc47a20]
};

const m4 = new THREE.Matrix4();
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const scl = new THREE.Vector3();
const tp = new THREE.Vector3();
const tq = new THREE.Quaternion();
const fwd = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);

function glassMesh(wine) {
  const [fr, st, [bz0, br0, bz1, br1], [lz0, lr0, lz1, lr1], colour] = SHAPES[wine];
  const group = new THREE.Group();
  const pts = [
    [0, 0],
    [fr, 0],
    [fr, 0.004],
    [0.004, 0.006],
    [0.004, st],
    [br0, bz0],
    [br1, bz1]
  ].map(([r, h]) => new THREE.Vector2(r, h));
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 20),
    new THREE.MeshStandardMaterial({
      color: srgb(0xe8e4dc),
      roughness: 0.08,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  glass.renderOrder = 2;
  group.add(glass);
  // The wine: from the inside bottom, scaled up and down from it (the clip's Sub bone).
  const geo = new THREE.CylinderGeometry(lr1, lr0, lz1 - lz0, 16);
  geo.translate(0, (lz1 - lz0) / 2, 0);
  const liquid = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: srgb(colour), roughness: 0.2 })
  );
  liquid.position.y = lz0;
  group.add(liquid);
  return { group, liquid, rim: bz1, r: Math.max(fr, br0, br1) };
}

AFRAME.registerSystem("lounge-dinner-glasses", {
  init() {
    this.slots = [];
    this.orphans = [];
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.subscribed = false;
  },

  remove() {
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.clear();
  },

  clear() {
    for (const s of this.slots) {
      s.copy?.el.parentNode?.removeChild(s.copy.el);
      if (s.ghost) s.ghost.group.parent?.remove(s.ghost.group);
    }
    for (const o of this.orphans) o.el.parentNode?.removeChild(o.el);
    this.slots = [];
    this.orphans = [];
  },

  onSceneLoaded() {
    this.clear();
    const envRoot = document.querySelector("#environment-root");
    if (!envRoot) return;
    this.table = envRoot.object3D.getObjectByName("LoungeSettingTable") || null;
    const skinned = [];
    const bones = [];
    envRoot.object3D.traverse(o => {
      if (o.isSkinnedMesh) skinned.push(o);
      const m = /^DinProps_G(champ|white|red|sweet)(\d)$/.exec(o.name || "");
      if (m && o.isBone) bones.push({ bone: o, wine: m[1], name: o.name });
    });
    for (const { bone, wine, name } of bones) {
      const sk = skinned.find(s => s.skeleton?.bones.includes(bone));
      if (!sk) continue;
      this.slots.push({
        name,
        wine,
        bone,
        sub: bone.children.find(c => c.isBone && c.name === `${name}Sub`) || null,
        sk,
        index: sk.skeleton.bones.indexOf(bone),
        inBand: 0,
        copy: null, // the pickable copy while the glass is free
        ghost: null, // the copy on its way back to the spot
        pending: null
      });
    }
  },

  // The bone's skinning transform with its scale taken out (the glass's base, upright).
  boneMatrix(s, out) {
    const { sk, index } = s;
    s.bone.updateWorldMatrix(true, false);
    sk.updateWorldMatrix(true, false);
    out.copy(sk.matrixWorld).multiply(sk.bindMatrixInverse);
    out.multiply(s.bone.matrixWorld).multiply(sk.skeleton.boneInverses[index]).multiply(sk.bindMatrix);
    out.decompose(pos, quat, scl);
    return out.compose(pos, quat, scl.set(1, 1, 1));
  },

  clipFill(s) {
    return s.sub ? THREE.MathUtils.clamp(s.sub.scale.y, 0, 1) : 1;
  },

  makeCopy(s) {
    const mesh = glassMesh(s.wine);
    const el = document.createElement("a-entity");
    el.setAttribute("class", "interactable");
    el.setAttribute(
      "body-helper",
      "type: kinematic; mass: 0.2; collisionFilterGroup: 1; collisionFilterMask: 15; gravity: 0 0 0;"
    );
    const hh = Math.max(0.05, mesh.rim / 2);
    const hr = Math.max(0.04, mesh.r + 0.005);
    el.setAttribute("shape-helper", `type: box; fit: manual; halfExtents: ${hr} ${hh} ${hr}; offset: 0 ${hh} 0`);
    el.setAttribute("is-remote-hover-target", "");
    el.setAttribute(
      "tags",
      "isHandCollisionTarget: true; isHoldable: true; offersHandConstraint: true; offersRemoteConstraint: true;"
    );
    el.object3D.add(mesh.group);
    this.boneMatrix(s, m4).decompose(el.object3D.position, el.object3D.quaternion, scl);
    el.object3D.matrixNeedsUpdate = true;
    const root = document.querySelector("#objects-root") || this.el.sceneEl;
    root.appendChild(el);
    const c = {
      el,
      mesh,
      fill: this.clipFill(s),
      sip: sipState((SHAPES[s.wine][2][0] + SHAPES[s.wine][2][2]) / 2),
      moved: false,
      held: false,
      owner: false,
      remote: null,
      settle: null,
      nextSend: 0,
      nextTell: 0
    };
    this.setFill(c);
    return c;
  },

  setFill(c) {
    c.mesh.liquid.scale.y = Math.max(0.001, c.fill);
    c.mesh.liquid.visible = c.fill > 0.01;
  },

  isHeld(el) {
    const eid = el.object3D.eid;
    return eid !== undefined && hasComponent(APP.world, Held, eid);
  },

  // The copy goes: if someone is holding it here the entity stays in their hand,
  // empty and unseen, until they let go (pulling an entity out of a grip is not safe).
  dropCopy(s) {
    const c = s.copy;
    s.copy = null;
    if (!c) return;
    if (this.isHeld(c.el)) {
      c.mesh.group.visible = false;
      c.el.removeAttribute("is-remote-hover-target");
      this.orphans.push(c);
    } else {
      c.el.parentNode?.removeChild(c.el);
    }
  },

  // Free time is up: the copy glides back to the spot (a plain mesh, not pickable).
  sendHome(s) {
    const c = s.copy;
    if (!c) return;
    const o = c.mesh.group; // (tipped at someone's lips, it starts from there)
    o.updateMatrices?.();
    const mesh = glassMesh(s.wine);
    mesh.group.position.copy(o.getWorldPosition(new THREE.Vector3()));
    mesh.group.quaternion.copy(o.getWorldQuaternion(new THREE.Quaternion()));
    const fill = c.fill;
    mesh.liquid.scale.y = Math.max(0.001, fill);
    mesh.liquid.visible = fill > 0.01;
    this.el.sceneEl.object3D.add(mesh.group);
    s.ghost = {
      group: mesh.group,
      liquid: mesh.liquid,
      from: mesh.group.position.clone(),
      fromQ: mesh.group.quaternion.clone(),
      fill,
      t: 0
    };
    this.dropCopy(s);
  },

  dropGhost(s) {
    if (!s.ghost) return;
    s.ghost.group.parent?.remove(s.ghost.group);
    s.ghost = null;
  },

  subscribe() {
    if (this.subscribed || !window.NAF?.connection?.subscribeToDataChannel) return;
    NAF.connection.subscribeToDataChannel(DATA_TYPE, (_from, _type, data) => this.onMessage(data));
    this.subscribed = true;
  },

  send(s, reliable) {
    const c = s.copy;
    if (!c) return;
    tipped(c.el.object3D, c.mesh.group, tp, tq);
    const data = {
      b: s.name,
      held: c.held,
      p: tp.toArray().map(n => Math.round(n * 1000) / 1000),
      q: tq.toArray().map(n => Math.round(n * 10000) / 10000),
      fill: Math.round(c.fill * 1000) / 1000,
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
    if (!data?.b || !Array.isArray(data.p) || !Array.isArray(data.q) || data.by === window.NAF?.clientId) return;
    const s = this.slots.find(x => x.name === data.b);
    if (!s) return;
    if (!s.copy) {
      s.pending = { data, at: performance.now() / 1000 };
      return;
    }
    this.applyRemote(s.copy, data);
  },

  applyRemote(c, data) {
    if (c.held) return;
    c.owner = false;
    c.moved = true;
    c.fill = THREE.MathUtils.clamp(Number(data.fill) || 0, 0, 1);
    c.remote = {
      held: !!data.held,
      p: new THREE.Vector3().fromArray(data.p),
      q: new THREE.Quaternion().fromArray(data.q)
    };
    c.settle = null;
    this.setFill(c);
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

  // Let go over the table: it stands upright where it was put, turned the way it
  // was held; anywhere else it goes back to its spot.
  place(s, c) {
    const o = c.el.object3D;
    this.boneMatrix(s, m4).decompose(pos, quat, scl);
    let to = pos.clone();
    let toQ = quat.clone();
    const t = this.table;
    if (t) {
      t.updateWorldMatrix(true, false);
      const top = t.getWorldPosition(new THREE.Vector3());
      const l = t.worldToLocal(o.position.clone());
      const hx = Math.abs(t.scale.x) || 1;
      const hz = Math.abs(t.scale.z) || 1;
      const high = o.position.y - top.y;
      if (Math.abs(l.x) <= 1 + MARGIN / hx && Math.abs(l.z) <= 1 + MARGIN / hz && high > -0.15 && high < 0.45) {
        l.x = THREE.MathUtils.clamp(l.x, -1 + 0.06 / hx, 1 - 0.06 / hx);
        l.z = THREE.MathUtils.clamp(l.z, -1 + 0.06 / hz, 1 - 0.06 / hz);
        l.y = 0;
        to = t.localToWorld(l);
        fwd.set(0, 0, -1).applyQuaternion(o.quaternion);
        fwd.y = 0;
        if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1).applyQuaternion(quat);
        toQ = new THREE.Quaternion().setFromAxisAngle(Y, Math.atan2(-fwd.x, -fwd.z));
      }
    }
    c.settle = { from: o.position.clone(), fromQ: o.quaternion.clone(), to, toQ, t: 0 };
  },

  tick(time, dtMs) {
    if (!this.slots.length) return;
    this.subscribe();
    const dt = Math.min(0.1, (dtMs || 16) / 1000);
    const now = time / 1000;
    const camera = document.getElementById("avatar-pov-node")?.object3D;
    for (const s of this.slots) {
      const k = s.bone.scale.x;
      const free = k > FREE_LO && k < FREE_HI;
      const back = k >= FREE_HI && k < BACK_HI;
      s.inBand = free ? s.inBand + 1 : 0;
      if (free && s.inBand >= 2 && !s.copy) {
        this.dropGhost(s);
        s.copy = this.makeCopy(s);
        const p = s.pending;
        s.pending = null;
        if (p && now - p.at < PENDING_FOR) this.applyRemote(s.copy, p.data);
      } else if (back && s.copy) {
        this.sendHome(s);
      } else if (!free && !back) {
        this.dropCopy(s);
        this.dropGhost(s);
      }
      if (s.ghost) {
        const g = s.ghost;
        g.t = Math.min(1, g.t + dt / BACK_TIME);
        const e = g.t * g.t * (3 - 2 * g.t);
        this.boneMatrix(s, m4).decompose(pos, quat, scl);
        g.group.position.lerpVectors(g.from, pos, e);
        g.group.quaternion.slerpQuaternions(g.fromQ, quat, e);
        g.liquid.scale.y = Math.max(0.001, g.fill + (this.clipFill(s) - g.fill) * e);
        g.liquid.visible = g.liquid.scale.y > 0.01;
      }
      const c = s.copy;
      if (!c) continue;
      const o = c.el.object3D;
      const heldNow = this.isHeld(c.el);
      if (heldNow && !c.held) {
        c.held = true;
        c.owner = true;
        c.moved = true;
        c.remote = null;
        c.settle = null;
      } else if (!heldNow && c.held) {
        c.held = false;
        this.kinematic(c.el);
        this.place(s, c);
        c.nextTell = 0;
      }
      if (c.held) {
        const fill = sipTick(c.sip, o, c.mesh.group, c.fill, dt, camera);
        if (fill !== c.fill) {
          c.fill = fill;
          this.setFill(c);
        }
        if (now >= c.nextSend) {
          this.send(s, false);
          c.nextSend = now + SEND_EVERY;
        }
        continue;
      }
      sipRelax(c.sip, c.mesh.group, dt);
      if (c.settle) {
        const st = c.settle;
        st.t = Math.min(1, st.t + dt / 0.35);
        const e = st.t * st.t * (3 - 2 * st.t);
        o.position.lerpVectors(st.from, st.to, e);
        o.quaternion.slerpQuaternions(st.fromQ, st.toQ, e);
        o.matrixNeedsUpdate = true;
        if (st.t >= 1) {
          c.settle = null;
          if (c.owner) this.send(s, true);
        }
      } else if (c.remote) {
        o.position.lerp(c.remote.p, Math.min(1, dt * 12));
        o.quaternion.slerp(c.remote.q, Math.min(1, dt * 12));
        o.matrixNeedsUpdate = true;
      } else if (!c.moved) {
        // Untouched: on the clip's spot, as full as the clip's glass.
        this.boneMatrix(s, m4).decompose(o.position, o.quaternion, scl);
        o.matrixNeedsUpdate = true;
        const f = this.clipFill(s);
        if (Math.abs(f - c.fill) > 0.002) {
          c.fill = f;
          this.setFill(c);
        }
      }
      if (c.owner && !c.settle && now >= c.nextTell) {
        this.send(s, true);
        c.nextTell = now + TELL_EVERY;
      }
    }
    // Copies taken back while someone held them: gone once let go.
    for (let i = this.orphans.length - 1; i >= 0; i--) {
      const c = this.orphans[i];
      if (!this.isHeld(c.el)) {
        c.el.parentNode?.removeChild(c.el);
        this.orphans.splice(i, 1);
      }
    }
  }
});
