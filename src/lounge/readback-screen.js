// private-quest-lounge: Zoltar's readback, drawn on the wall TV as a background display: what he
// heard (amber) and the latest reply (white) in large type, fading out after a while. It covers
// the TV only while it has text and the TV is not showing real content (isLive). Local to this
// client, like the rest of the voice panel.
import * as THREE from "three";
import { alpha, layout, visible, HOLD_MS, FADE_MS } from "./readback-text.cjs";

const W = 1536;
const PAD = 60;
const GAP = 24;
const FONT = "600 {px}px sans-serif";

export class ReadbackScreen {
  // Placement args as label() in tv-controls.js (x, y, width, height in TV-local metres), sitting
  // z metres off the glass; isLive() says whether real content is on the TV.
  constructor(scene, anchor, rotation, x, y, width, height, z, isLive) {
    this.isLive = isLive || (() => false);
    this.alpha = 0;
    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = Math.round((W * height) / width);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.encoding = THREE.sRGBEncoding;
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
    this.geometry = new THREE.PlaneGeometry(width, height);
    this.el = document.createElement("a-entity");
    this.el.setObject3D("mesh", new THREE.Mesh(this.geometry, this.material));
    scene.appendChild(this.el);
    this.el.object3D.position.copy(new THREE.Vector3(x, y, z).applyQuaternion(rotation).add(anchor));
    this.el.object3D.quaternion.copy(rotation);
    this.el.object3D.matrixNeedsUpdate = true;
    this.blocks = [];
    this.render(0);
    // Real content may start or stop while text is showing.
    this.watch = setInterval(() => this.render(this.alpha), 500);
  }
  measure(text, font) {
    this.ctx.font = FONT.replace("{px}", font);
    return this.ctx.measureText(text).width;
  }
  get ctx() {
    return this.canvas.getContext("2d");
  }
  // Status text from the voice panel (prompts, errors): large, fades like the rest.
  draw(lines, failed = false) {
    this.hold([{ text: lines.filter(Boolean).join(" "), color: failed ? "#ff9d8a" : "#ffffff" }]);
  }
  // What Jay said (amber) over Zoltar's reply (white); fades away after HOLD_MS.
  show(heard, reply) {
    const blocks = [];
    if (heard) blocks.push({ text: heard, color: "#ffb347", max: 56 });
    if (reply) blocks.push({ text: reply, color: "#ffffff" });
    this.hold(blocks);
  }
  hold(blocks) {
    clearInterval(this.timer);
    this.blocks = blocks;
    this.shown = Date.now();
    this.render(1);
    this.timer = setInterval(() => {
      const a = alpha(Date.now() - this.shown);
      this.render(a);
      if (a === 0) clearInterval(this.timer);
    }, 200);
  }
  render(a) {
    this.alpha = a;
    const show = visible(a, this.isLive());
    this.el.object3D.visible = show;
    if (!show) return;
    const ctx = this.ctx;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, this.canvas.height);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, this.canvas.height);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let y = PAD;
    for (const block of layout(this.blocks, W, this.canvas.height, PAD, GAP, (t, f) => this.measure(t, f))) {
      ctx.fillStyle = block.color;
      ctx.font = FONT.replace("{px}", block.font);
      for (const line of block.lines) {
        ctx.fillText(line, PAD, y);
        y += block.font * 1.18;
      }
      y += GAP;
    }
    ctx.globalAlpha = 1;
    this.texture.needsUpdate = true;
  }
  remove() {
    clearInterval(this.timer);
    clearInterval(this.watch);
    this.el.remove();
    this.texture.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }
}
export { HOLD_MS, FADE_MS };
