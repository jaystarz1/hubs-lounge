import * as THREE from "three";
import { label } from "./tv-controls";

const ORIGIN = new THREE.Vector3();
const ROTATION = new THREE.Quaternion();
export const poseName = name =>
  ({ hold_hands: "Hold hands", sit_together: "Sit together", slow_dance: "Slow dance", hug: "Hug" })[name] || name;
const poseSetup = name =>
  name === "sit_together" ? "Stand side by side, facing the same way." : "Face your partner before accepting.";

// A portable control surface, not a room prop. Its panel is placed once in
// front of the wearer and stays world-locked until closed or summoned again.
export class SocialControls {
  constructor(scene, system) {
    this.scene = scene;
    this.system = system;
    this.items = [];
    this.tab = "Emotes";
    this.button = document.createElement("button");
    this.button.id = "lounge-social-toggle";
    this.button.textContent = "Together";
    this.button.setAttribute("aria-label", "Open avatar interactions");
    this.button.style.cssText =
      "position:fixed;left:20px;bottom:90px;z-index:10001;padding:12px 20px;border:1px solid #84c8b6;border-radius:5px;background:#243746;color:#f2ece0;font:600 16px sans-serif;cursor:pointer";
    this.button.addEventListener("click", () => this.toggle());
    document.body.appendChild(this.button);
    this.escape = e => {
      if (e.key === "Escape") {
        this.system.stop();
        this.close();
      }
    };
    document.addEventListener("keydown", this.escape);
  }
  update() {
    const entered = this.scene.is("entered");
    this.button.hidden = !entered || this.scene.is("vr-mode");
    const controller = document.getElementById("player-left-controller");
    if (controller && !this.wrist) {
      this.wrist = document.createElement("a-entity");
      controller.appendChild(this.wrist);
      this.wrist.object3D.position.set(0, 0.08, 0.02);
      this.wrist.object3D.rotation.x = -Math.PI / 2;
      this.wrist.object3D.matrixNeedsUpdate = true;
      this.wristItems = [
        label(this.wrist, ORIGIN, ROTATION, 0, 0.045, 0.15, 0.055, ["Together"], () => this.toggle()),
        label(this.wrist, ORIGIN, ROTATION, 0, -0.018, 0.15, 0.05, ["Stop pose"], () => this.system.stop())
      ];
    }
    if (this.wrist) this.wrist.object3D.visible = entered && this.scene.is("vr-mode");
    if (!entered) this.close();
    if (this.panel) this.render();
  }
  toggle() {
    if (this.panel) this.close();
    else this.open();
  }
  open(tab = this.tab) {
    if (!this.scene.is("entered")) return;
    this.tab = tab;
    if (!this.panel) {
      const head = document.getElementById("avatar-pov-node")?.object3D;
      if (!head) return;
      this.panel = document.createElement("a-entity");
      this.panel.id = "lounge-social-panel";
      this.scene.appendChild(this.panel);
      const q = head.getWorldQuaternion(new THREE.Quaternion());
      const e = new THREE.Euler().setFromQuaternion(q, "YXZ");
      q.setFromEuler(new THREE.Euler(0, e.y, 0, "YXZ"));
      this.panel.object3D.position
        .copy(head.getWorldPosition(new THREE.Vector3()))
        .add(new THREE.Vector3(0, -0.08, -1.25).applyQuaternion(q));
      this.panel.object3D.quaternion.copy(q);
      this.panel.object3D.matrixNeedsUpdate = true;
    }
    this.signature = null;
    this.render();
  }
  add(x, y, width, height, text, fn) {
    const item = label(this.panel, ORIGIN, ROTATION, x, y, width, height, text, fn);
    this.items.push(item);
    return item;
  }
  render() {
    const s = this.system;
    const partners = s.partners();
    if (!partners.some(p => p.id === this.partnerId)) this.partnerId = partners[0]?.id;
    const partner = partners.find(p => p.id === this.partnerId);
    const incoming = s.incoming();
    const pair = s.state.pairFor(s.state.id);
    const signature = JSON.stringify([
      this.tab,
      s.message,
      s.state.touch,
      partners,
      this.partnerId,
      incoming?.id,
      pair?.id
    ]);
    if (this.signature === signature) return;
    this.signature = signature;
    this.items.forEach(item => item.remove());
    this.items = [];
    this.add(0, 0.58, 1.26, 0.18, ["Together", s.message || "Your head stays tracked. Stop ends any pose."]);
    ["Emotes", "Partner", "Face"].forEach((tab, i) =>
      this.add((i - 1) * 0.425, 0.36, 0.4, 0.15, [tab === this.tab ? `[ ${tab} ]` : tab], () => this.open(tab))
    );
    this.add(
      0,
      0.16,
      1.26,
      0.15,
      [
        s.state.touch
          ? "Touch feedback: on. Both people must enable it."
          : "Touch feedback: off. Tap to enable for this visit."
      ],
      () => s.toggleTouch()
    );
    if (this.tab === "Emotes") {
      [
        ["Wave", "wave"],
        ["Clap", "clap"],
        ["Dance", "dance"],
        ["Sit on floor", "sit"]
      ].forEach(([text, name], i) =>
        this.add(((i % 2) - 0.5) * 0.64, -0.08 - Math.floor(i / 2) * 0.21, 0.61, 0.17, [text], () => s.emote(name))
      );
      this.add(0, -0.49, 1.26, 0.13, ["Floor sitting changes your viewpoint after you choose it."]);
    } else if (this.tab === "Face") {
      ["Smile", "Sad", "Surprise", "Wink", "Neutral"].forEach((name, i) =>
        this.add(((i % 3) - 1) * 0.425, -0.08 - Math.floor(i / 3) * 0.21, 0.4, 0.17, [name], () =>
          s.expression(name.toLowerCase())
        )
      );
      this.add(0, -0.49, 1.26, 0.13, ["Expressions are chosen, not face-tracked. Voice stays live."]);
    } else if (incoming) {
      this.add(0, -0.07, 1.26, 0.2, [
        `${s.displayName(incoming.a)} invites you: ${poseName(incoming.name)}`,
        poseSetup(incoming.name)
      ]);
      this.add(-0.32, -0.3, 0.61, 0.2, ["Accept"], () => s.accept(incoming.id));
      this.add(0.32, -0.3, 0.61, 0.2, ["Decline"], () => s.decline(incoming.id));
    } else if (pair) {
      this.add(0, -0.08, 1.26, 0.22, [
        poseName(pair.name),
        `With ${s.displayName(pair.a === s.state.id ? pair.b : pair.a)}`
      ]);
      this.add(0, -0.35, 1.26, 0.2, [poseSetup(pair.name), "Either person can stop below or on the wrist."]);
    } else {
      this.add(
        0,
        -0.065,
        1.26,
        0.16,
        [partner ? `Partner: ${partner.name}. Tap to change.` : "No other participant is ready yet."],
        () => {
          if (!partners.length) return;
          this.partnerId = partners[(partners.findIndex(p => p.id === this.partnerId) + 1) % partners.length].id;
          this.render();
        }
      );
      ["hug", "hold_hands", "sit_together", "slow_dance"].forEach((pose, i) =>
        this.add(((i % 2) - 0.5) * 0.64, -0.27 - Math.floor(i / 2) * 0.2, 0.61, 0.16, [poseName(pose)], () =>
          s.invite(this.partnerId, pose)
        )
      );
    }
    this.add(-0.215, -0.7, 0.83, 0.18, ["Stop pose / Stand up"], () => s.stop()).draw(["Stop pose / Stand up"], true);
    this.add(0.43, -0.7, 0.4, 0.18, ["Close"], () => this.close());
  }
  close() {
    this.items.forEach(item => item.remove());
    this.items = [];
    this.panel?.remove();
    this.panel = null;
    this.signature = null;
  }
  remove() {
    this.close();
    this.button.remove();
    this.wristItems?.forEach(item => item.remove());
    this.wrist?.remove();
    document.removeEventListener("keydown", this.escape);
  }
}
