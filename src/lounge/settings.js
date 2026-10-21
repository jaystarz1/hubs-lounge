import * as THREE from "three";
import { hasComponent } from "bitecs";
import { Held } from "../bit-components";
import { sipState, sipTick, sipRelax, tipped, srgb } from "./sip";

// The two places kept free at the dinner table (lounge-assets dinner_figures
// EMPTY) are for Jay and his guest: their knife, fork, spoon and water tumbler
// are made here, at the markers LoungeSetting_<kind>_<place>, and can be picked
// up (grip in VR, or grab with the cursor) and used: the tumbler tips to your
// lips and goes down a sip each time you bring it to your mouth (sip.js), and
// is quietly filled again standing on the table.
// Let go over the table top (LoungeSettingTable) a thing lies or stands where it
// was put; anywhere else it goes back to its place. Where each one is, and the
// water in the tumblers, is shared with the room over NAF messages
// ("lounge-setting"), like the Rovers glasses (drinks.js).
const DATA_TYPE = "lounge-setting";
const SILVER = { color: 0xcfd1d5, roughness: 0.25, metalness: 0.9 };
const REFILL_TIME = 120;
const SEND_EVERY = 0.1;
const TELL_EVERY = 8;
const MARGIN = 0.12; // let go this far off the table's edge still lands on it
const LIFT = { fork: 0.003, knife: 0.004, spoon: 0.003, tumbler: 0 }; // its underside above the table top
const SPACE = { fork: 0.05, knife: 0.05, spoon: 0.05, tumbler: 0.075 };

const tp = new THREE.Vector3();
const tq = new THREE.Quaternion();
const fwd = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);

// (In the marker's frame: x across, -z away from the diner, y up; cutlery as
// dinner_figures _cutlery_mesh, the tumbler as build-penthouse DinnerSetTumbler.)
function box(group, mat, [x, y, z], [sx, sy, sz]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  m.position.set(x, y, z);
  group.add(m);
  return m;
}

function settingMesh(kind) {
  const group = new THREE.Group();
  let liquid = null;
  if (kind === "tumbler") {
    const pts = [
      [0, 0],
      [0.033, 0],
      [0.033, 0.004],
      [0.031, 0.006],
      [0.033, 0.1]
    ].map(([r, h]) => new THREE.Vector2(r, h));
    const glass = new THREE.Mesh(
      new THREE.LatheGeometry(pts, 20),
      new THREE.MeshStandardMaterial({
        color: srgb(0xdfe8ee),
        roughness: 0.08,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    glass.renderOrder = 2;
    group.add(glass);
    const geo = new THREE.CylinderGeometry(0.03, 0.029, 0.066, 20);
    geo.translate(0, 0.033, 0);
    liquid = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: srgb(0xcfe6ee), roughness: 0.05, transparent: true, opacity: 0.55 })
    );
    liquid.position.y = 0.005;
    group.add(liquid);
    return { group, liquid };
  }
  const mat = new THREE.MeshStandardMaterial(SILVER);
  if (kind === "fork") {
    box(group, mat, [0, 0, 0.02], [0.012, 0.004, 0.11]);
    box(group, mat, [0, 0, -0.05], [0.02, 0.003, 0.03]);
    for (const x of [-0.0075, -0.0025, 0.0025, 0.0075]) box(group, mat, [x, 0, -0.08], [0.003, 0.002, 0.035]);
  } else if (kind === "knife") {
    box(group, mat, [0, 0, 0.025], [0.014, 0.006, 0.1]);
    box(group, new THREE.MeshStandardMaterial({ ...SILVER, color: 0xe2e4e7 }), [0, 0, -0.075], [0.017, 0.002, 0.1]);
  } else {
    box(group, mat, [0, 0, 0.01], [0.011, 0.004, 0.12]);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 6), mat);
    bowl.scale.set(0.8, 0.3, 1.3);
    bowl.position.set(0, 0.002, -0.075);
    group.add(bowl);
  }
  group.position.y = LIFT[kind];
  return { group, liquid };
}

AFRAME.registerSystem("lounge-settings", {
  init() {
    this.items = [];
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.subscribed = false;
  },

  remove() {
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.clear();
  },

  clear() {
    for (const it of this.items) it.el.parentNode?.removeChild(it.el);
    this.items = [];
  },

  onSceneLoaded() {
    this.clear();
    const envRoot = document.querySelector("#environment-root");
    if (!envRoot) return;
    this.table = envRoot.object3D.getObjectByName("LoungeSettingTable") || null;
    const marks = [];
    envRoot.object3D.traverse(o => {
      const m = /^LoungeSetting_(fork|knife|spoon|tumbler)_(\d)/.exec(o.name || "");
      if (m) marks.push({ kind: m[1], place: m[2], node: o });
    });
    marks.sort((a, b) => (`${a.place}${a.kind}` < `${b.place}${b.kind}` ? -1 : 1));
    const root = document.querySelector("#objects-root") || this.el.sceneEl;
    marks.forEach(({ kind, place, node }, i) => {
      const home = node.getWorldPosition(new THREE.Vector3());
      const homeQ = node.getWorldQuaternion(new THREE.Quaternion());
      const el = document.createElement("a-entity");
      el.setAttribute("class", "interactable");
      el.setAttribute(
        "body-helper",
        "type: kinematic; mass: 0.2; collisionFilterGroup: 1; collisionFilterMask: 15; gravity: 0 0 0;"
      );
      el.setAttribute(
        "shape-helper",
        kind === "tumbler"
          ? "type: box; fit: manual; halfExtents: 0.045 0.05 0.045; offset: 0 0.05 0"
          : "type: box; fit: manual; halfExtents: 0.025 0.02 0.08; offset: 0 0.01 -0.02"
      );
      el.setAttribute("is-remote-hover-target", "");
      el.setAttribute(
        "tags",
        "isHandCollisionTarget: true; isHoldable: true; offersHandConstraint: true; offersRemoteConstraint: true;"
      );
      el.object3D.position.copy(home);
      el.object3D.quaternion.copy(homeQ);
      const mesh = settingMesh(kind);
      el.object3D.add(mesh.group);
      root.appendChild(el);
      this.items.push({
        i,
        kind,
        place,
        el,
        mesh,
        home,
        homeQ,
        fill: 1,
        sip: kind === "tumbler" ? sipState(0.05) : null,
        held: false,
        remote: null,
        owner: false,
        nextSend: 0,
        nextTell: 0,
        settle: null
      });
    });
    this.setFill();
  },

  subscribe() {
    if (this.subscribed || !window.NAF?.connection?.subscribeToDataChannel) return;
    NAF.connection.subscribeToDataChannel(DATA_TYPE, (_from, _type, data) => this.onMessage(data));
    this.subscribed = true;
  },

  send(it, reliable) {
    tipped(it.el.object3D, it.mesh.group, tp, tq);
    const data = {
      i: it.i,
      held: it.held,
      p: tp.toArray().map(n => Math.round(n * 1000) / 1000),
      q: tq.toArray().map(n => Math.round(n * 10000) / 10000),
      fill: Math.round(it.fill * 1000) / 1000,
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
    const it = this.items.find(x => x.i === data?.i);
    if (!it || !Array.isArray(data.p) || !Array.isArray(data.q) || data.by === window.NAF?.clientId) return;
    if (it.held) return;
    it.owner = false;
    it.fill = THREE.MathUtils.clamp(Number(data.fill) || 0, 0, 1);
    it.remote = {
      held: !!data.held,
      p: new THREE.Vector3().fromArray(data.p),
      q: new THREE.Quaternion().fromArray(data.q)
    };
    it.settle = null;
    this.setFill();
  },

  setFill() {
    for (const it of this.items) {
      const { liquid } = it.mesh;
      if (!liquid) continue;
      liquid.scale.y = Math.max(0.001, it.fill);
      liquid.visible = it.fill > 0.01;
    }
  },

  place(it) {
    // Let go over the table: it lies (or stands) where it was put, turned the
    // way it was held; anywhere else it goes back to its place.
    const o = it.el.object3D;
    let to = it.home.clone();
    let toQ = it.homeQ.clone();
    const t = this.table;
    if (t) {
      t.updateWorldMatrix(true, false);
      const top = t.getWorldPosition(new THREE.Vector3());
      const l = t.worldToLocal(o.position.clone());
      const hx = Math.abs(t.scale.x) || 1;
      const hz = Math.abs(t.scale.z) || 1;
      const high = o.position.y - top.y;
      if (Math.abs(l.x) <= 1 + MARGIN / hx && Math.abs(l.z) <= 1 + MARGIN / hz && high > -0.15 && high < 0.45) {
        l.x = THREE.MathUtils.clamp(l.x, -1 + 0.05 / hx, 1 - 0.05 / hx);
        l.z = THREE.MathUtils.clamp(l.z, -1 + 0.05 / hz, 1 - 0.05 / hz);
        l.y = 0;
        to = t.localToWorld(l);
        fwd.set(0, 0, -1).applyQuaternion(o.quaternion);
        fwd.y = 0;
        if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1).applyQuaternion(it.homeQ);
        toQ = new THREE.Quaternion().setFromAxisAngle(Y, Math.atan2(-fwd.x, -fwd.z));
        for (const other of this.items) {
          if (other === it) continue;
          const op = other.el.object3D.position;
          const sep = new THREE.Vector2(to.x - op.x, to.z - op.z);
          const need = Math.max(SPACE[it.kind], SPACE[other.kind]);
          if (sep.length() < need && (it.kind === "tumbler" || other.kind === "tumbler")) {
            if (sep.lengthSq() < 1e-6) sep.set(1, 0);
            sep.setLength(need);
            to.x = op.x + sep.x;
            to.z = op.z + sep.y;
          }
        }
      }
    }
    it.settle = { from: o.position.clone(), fromQ: o.quaternion.clone(), to, toQ, t: 0 };
  },

  kinematic(it) {
    const ps = this.el.sceneEl.systems["hubs-systems"]?.physicsSystem;
    const eid = it.el.object3D.eid;
    if (ps && eid !== undefined && it.el.components["body-helper"]) {
      try {
        ps.updateRigidBodyOptions(eid, { type: "kinematic" });
      } catch {
        it.el.setAttribute("body-helper", "type", "kinematic");
      }
    }
  },

  tick(time, dtMs) {
    if (!this.items.length) return;
    this.subscribe();
    const dt = Math.min(0.1, (dtMs || 16) / 1000);
    const now = time / 1000;
    const camera = document.getElementById("avatar-pov-node")?.object3D;
    let changed = false;
    for (const it of this.items) {
      const o = it.el.object3D;
      const eid = o.eid;
      const heldNow = eid !== undefined && hasComponent(APP.world, Held, eid);
      if (heldNow && !it.held) {
        it.held = true;
        it.owner = true;
        it.remote = null;
        it.settle = null;
      } else if (!heldNow && it.held) {
        it.held = false;
        this.kinematic(it);
        this.place(it);
        it.nextTell = 0;
      }
      if (it.held) {
        if (it.sip) {
          const fill = sipTick(it.sip, o, it.mesh.group, it.fill, dt, camera);
          if (fill !== it.fill) {
            it.fill = fill;
            changed = true;
          }
        }
        if (now >= it.nextSend) {
          this.send(it, false);
          it.nextSend = now + SEND_EVERY;
        }
        continue;
      }
      if (it.sip) sipRelax(it.sip, it.mesh.group, dt);
      if (it.settle) {
        const s = it.settle;
        s.t = Math.min(1, s.t + dt / 0.35);
        const e = s.t * s.t * (3 - 2 * s.t);
        o.position.lerpVectors(s.from, s.to, e);
        o.quaternion.slerpQuaternions(s.fromQ, s.toQ, e);
        o.matrixNeedsUpdate = true;
        if (s.t >= 1) {
          it.settle = null;
          if (it.owner) this.send(it, true);
        }
      } else if (it.remote) {
        o.position.lerp(it.remote.p, Math.min(1, dt * 12));
        o.quaternion.slerp(it.remote.q, Math.min(1, dt * 12));
        o.matrixNeedsUpdate = true;
      }
      if (it.kind === "tumbler" && !it.remote?.held && !it.settle && it.fill < 1) {
        it.fill = Math.min(1, it.fill + dt / REFILL_TIME);
        changed = true;
      }
      if (it.owner && !it.settle && now >= it.nextTell) {
        this.send(it, true);
        it.nextTell = now + TELL_EVERY;
      }
    }
    if (changed) this.setFill();
  }
});
