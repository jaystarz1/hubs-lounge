import * as THREE from "three";
import { hasComponent } from "bitecs";
import { Held } from "../bit-components";
import { sipState, sipTick, sipRelax, tipped, srgb } from "./sip";

// Jay's table in the Rovers (rovers_figures JAY_GLASSES): a red wine and a pint
// he and his guest can pick up (grip in VR, or grab with the cursor) and drink
// from: bring it to your mouth and it tips to your lips and goes down a sip
// (sip.js). Put down on the table it
// stays where it was set (upright); let go anywhere else and it goes back to
// its place. Left on the table it is quietly topped up again (nobody brings
// drinks to that table any more). Where a glass is, and how full, is shared
// with everyone in the room over NAF messages ("lounge-drink"): whoever moved
// it last keeps telling the room about it.
const DATA_TYPE = "lounge-drink";
const KINDS = {
  red: {
    // A wine glass: foot, stem and bowl (radius, height from the base).
    profile: [
      [0.0, 0.0],
      [0.038, 0.0],
      [0.038, 0.004],
      [0.006, 0.01],
      [0.004, 0.075],
      [0.02, 0.085],
      [0.042, 0.12],
      [0.044, 0.15],
      [0.04, 0.2]
    ],
    liquid: { colour: 0x5a0c1c, from: 0.084, to: 0.15, r0: 0.026, r1: 0.043 },
    halfHeight: 0.1
  },
  pint: {
    profile: [
      [0.0, 0.0],
      [0.033, 0.0],
      [0.035, 0.008],
      [0.042, 0.15]
    ],
    liquid: { colour: 0xa2560f, from: 0.008, to: 0.13, r0: 0.033, r1: 0.04, head: 0xf2ead8 },
    halfHeight: 0.075
  }
};
const REFILL_TIME = 120; // empty to full, standing on the table
const SEND_EVERY = 0.1; // s, while held
const TELL_EVERY = 8; // s, the last mover repeats its state (late joiners)
const TABLE_R = 0.3;

const v = new THREE.Vector3();
const tp = new THREE.Vector3();
const tq = new THREE.Quaternion();

function glassMesh(kind) {
  const k = KINDS[kind];
  const group = new THREE.Group();
  const pts = k.profile.map(([r, h]) => new THREE.Vector2(r, h));
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 20),
    new THREE.MeshStandardMaterial({
      color: srgb(0xdfe8ee),
      roughness: 0.08,
      metalness: 0.0,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  glass.renderOrder = 2;
  group.add(glass);
  const L = k.liquid;
  // The liquid: a cylinder from the inside bottom, scaled up and down from it.
  const geo = new THREE.CylinderGeometry(L.r1, L.r0, L.to - L.from, 20);
  geo.translate(0, (L.to - L.from) / 2, 0);
  const liquid = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: srgb(L.colour), roughness: 0.25 }));
  liquid.position.y = L.from;
  group.add(liquid);
  let head = null;
  if (L.head) {
    head = new THREE.Mesh(
      new THREE.CylinderGeometry(L.r1, L.r1, 0.014, 20),
      new THREE.MeshStandardMaterial({ color: srgb(L.head), roughness: 0.9 })
    );
    group.add(head);
  }
  return { group, liquid, head, L };
}

AFRAME.registerSystem("lounge-drinks", {
  init() {
    this.glasses = [];
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.subscribed = false;
  },

  remove() {
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.clear();
  },

  clear() {
    for (const g of this.glasses) g.el.parentNode?.removeChild(g.el);
    this.glasses = [];
  },

  onSceneLoaded() {
    this.clear();
    const envRoot = document.querySelector("#environment-root");
    if (!envRoot) return;
    const marks = [];
    envRoot.object3D.traverse(o => {
      const m = /^LoungeDrink_([a-z]+)/.exec(o.name || "");
      if (m && KINDS[m[1]]) marks.push({ kind: m[1], node: o });
    });
    if (!marks.length) return;
    const centre = new THREE.Vector3();
    for (const { node } of marks) centre.add(node.getWorldPosition(v));
    centre.divideScalar(marks.length);
    this.table = centre; // (the table top: the glasses stand round its middle)
    const root = document.querySelector("#objects-root") || this.el.sceneEl;
    marks.sort((a, b) => (a.kind < b.kind ? -1 : 1));
    marks.forEach(({ kind, node }, i) => {
      const home = node.getWorldPosition(new THREE.Vector3());
      const el = document.createElement("a-entity");
      el.setAttribute("class", "interactable");
      el.setAttribute(
        "body-helper",
        "type: kinematic; mass: 0.3; collisionFilterGroup: 1; collisionFilterMask: 15; gravity: 0 0 0;"
      );
      el.setAttribute(
        "shape-helper",
        `type: box; fit: manual; halfExtents: 0.045 ${KINDS[kind].halfHeight} 0.045; offset: 0 ${KINDS[kind].halfHeight} 0`
      );
      el.setAttribute("is-remote-hover-target", "");
      el.setAttribute(
        "tags",
        "isHandCollisionTarget: true; isHoldable: true; offersHandConstraint: true; offersRemoteConstraint: true;"
      );
      el.object3D.position.copy(home);
      const mesh = glassMesh(kind);
      el.object3D.add(mesh.group);
      root.appendChild(el);
      this.glasses.push({
        i,
        kind,
        el,
        mesh,
        home,
        fill: 1,
        sip: sipState(KINDS[kind].halfHeight),
        held: false, // held here
        remote: null, // { by, p, q, at } held (or last placed) by someone else
        owner: false, // we moved it last: we keep the room told
        nextSend: 0,
        nextTell: 0,
        settle: null // { from, to, t } gliding to where it was put down
      });
    });
    this.setFill();
  },

  subscribe() {
    if (this.subscribed || !window.NAF?.connection?.subscribeToDataChannel) return;
    NAF.connection.subscribeToDataChannel(DATA_TYPE, (_from, _type, data) => this.onMessage(data));
    this.subscribed = true;
  },

  send(g, reliable) {
    tipped(g.el.object3D, g.mesh.group, tp, tq);
    const data = {
      i: g.i,
      held: g.held,
      p: tp.toArray().map(n => Math.round(n * 1000) / 1000),
      q: tq.toArray().map(n => Math.round(n * 10000) / 10000),
      fill: Math.round(g.fill * 1000) / 1000,
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
    const g = this.glasses.find(x => x.i === data?.i);
    if (!g || !Array.isArray(data.p) || !Array.isArray(data.q) || data.by === window.NAF?.clientId) return;
    if (g.held) return; // (ours while we hold it)
    g.owner = false;
    g.fill = THREE.MathUtils.clamp(Number(data.fill) || 0, 0, 1);
    g.remote = {
      by: data.by,
      held: !!data.held,
      p: new THREE.Vector3().fromArray(data.p),
      q: new THREE.Quaternion().fromArray(data.q)
    };
    g.settle = null;
    this.setFill();
  },

  setFill() {
    for (const g of this.glasses) {
      const { liquid, head, L } = g.mesh;
      const f = Math.max(0.001, g.fill);
      liquid.scale.y = f;
      liquid.visible = g.fill > 0.01;
      if (head) {
        head.position.y = L.from + (L.to - L.from) * f + 0.007;
        head.visible = g.fill > 0.01;
      }
    }
  },

  place(g) {
    // Let go: on the table it stands where it was set, upright; anywhere else
    // it goes home.
    const o = g.el.object3D;
    const to = g.home.clone();
    if (this.table) {
      const d = new THREE.Vector2(o.position.x - this.table.x, o.position.z - this.table.z);
      const high = o.position.y - this.table.y;
      if (d.length() < TABLE_R + 0.15 && high > -0.15 && high < 0.45) {
        if (d.length() > TABLE_R - 0.05) d.setLength(TABLE_R - 0.05);
        to.set(this.table.x + d.x, this.table.y, this.table.z + d.y);
        for (const other of this.glasses) {
          if (other === g) continue; // (not inside the other glass)
          const op = other.el.object3D.position;
          const sep = new THREE.Vector2(to.x - op.x, to.z - op.z);
          if (sep.length() < 0.09) {
            sep.setLength(0.09);
            to.x = op.x + sep.x;
            to.z = op.z + sep.y;
          }
        }
      }
    }
    g.settle = { from: o.position.clone(), fromQ: o.quaternion.clone(), to, t: 0 };
  },

  kinematic(g) {
    const ps = this.el.sceneEl.systems["hubs-systems"]?.physicsSystem;
    const eid = g.el.object3D.eid;
    if (ps && eid !== undefined && g.el.components["body-helper"]) {
      try {
        ps.updateRigidBodyOptions(eid, { type: "kinematic" });
      } catch {
        g.el.setAttribute("body-helper", "type", "kinematic");
      }
    }
  },

  tick(time, dtMs) {
    if (!this.glasses.length) return;
    this.subscribe();
    const dt = Math.min(0.1, (dtMs || 16) / 1000);
    const now = time / 1000;
    const camera = document.getElementById("avatar-pov-node")?.object3D;
    let changed = false;
    for (const g of this.glasses) {
      const o = g.el.object3D;
      const eid = o.eid;
      const heldNow = eid !== undefined && hasComponent(APP.world, Held, eid);
      if (heldNow && !g.held) {
        g.held = true;
        g.owner = true;
        g.remote = null;
        g.settle = null;
      } else if (!heldNow && g.held) {
        g.held = false;
        this.kinematic(g);
        this.place(g);
        g.nextTell = 0;
      }
      if (g.held) {
        // Drinking: up to the mouth, it tips to the lips and goes down a sip.
        const fill = sipTick(g.sip, o, g.mesh.group, g.fill, dt, camera);
        if (fill !== g.fill) {
          g.fill = fill;
          changed = true;
        }
        if (now >= g.nextSend) {
          this.send(g, false);
          g.nextSend = now + SEND_EVERY;
        }
        continue;
      }
      sipRelax(g.sip, g.mesh.group, dt);
      if (g.settle) {
        const s = g.settle;
        s.t = Math.min(1, s.t + dt / 0.35);
        const e = s.t * s.t * (3 - 2 * s.t);
        o.position.lerpVectors(s.from, s.to, e);
        o.quaternion.slerpQuaternions(s.fromQ, new THREE.Quaternion(), e);
        o.matrixNeedsUpdate = true;
        if (s.t >= 1) {
          g.settle = null;
          if (g.owner) this.send(g, true);
        }
      } else if (g.remote) {
        o.position.lerp(g.remote.p, Math.min(1, dt * 12));
        o.quaternion.slerp(g.remote.q, Math.min(1, dt * 12));
        o.matrixNeedsUpdate = true;
      }
      // Standing on the table, it is topped up again.
      const onTable = !g.remote?.held && !g.settle;
      if (onTable && g.fill < 1) {
        g.fill = Math.min(1, g.fill + dt / REFILL_TIME);
        changed = true;
      }
      if (g.owner && !g.settle && now >= g.nextTell) {
        this.send(g, true);
        g.nextTell = now + TELL_EVERY;
      }
    }
    if (changed) this.setFill();
  }
});
