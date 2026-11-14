// private-quest-lounge: the shared scrolling transcript. A wall panel (left of the wall TV, mirror of
// the voice buttons) showing who spoke, Jay or the guest, and Zoltar's replies, newest at the bottom,
// with UP and DOWN to read older lines. Both headsets draw the same lines from the Mac's daemon
// (see VoiceControls.pollTranscript), never from each other. Kept out of recorded clips.
import * as THREE from "three";
import { label } from "./tv-controls";
import { hideFromRecording } from "./record-core.cjs";
import { merge, rows, window as pick } from "./transcript-text.cjs";

const W = 900;
const H = 1300;
const PAD = 36;
const FONT_PX = 40;
const LEAD = 1.3;
const VISIBLE = Math.floor((H - PAD * 2) / (FONT_PX * LEAD));
const STEP = Math.max(1, VISIBLE - 2);
const FONT = `600 ${FONT_PX}px sans-serif`;

export class TranscriptPanel {
  constructor(scene, anchor, rotation, x, y, width, height) {
    this.scene = scene;
    this.entries = [];
    this.offset = 0;
    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = H;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.encoding = THREE.sRGBEncoding;
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
    this.geometry = new THREE.PlaneGeometry(width, height);
    this.el = document.createElement("a-entity");
    this.el.setObject3D("mesh", new THREE.Mesh(this.geometry, this.material));
    scene.appendChild(this.el);
    this.el.object3D.position.copy(new THREE.Vector3(x, y, 0.08).applyQuaternion(rotation).add(anchor));
    this.el.object3D.quaternion.copy(rotation);
    this.el.object3D.matrixNeedsUpdate = true;
    hideFromRecording(this.el.object3D);
    const bw = width / 2 - 0.02;
    const by = y + height / 2 + 0.12;
    this.buttons = [
      label(scene, anchor, rotation, x - width / 4, by, bw, 0.18, ["UP"], () => this.scroll(STEP)),
      label(scene, anchor, rotation, x + width / 4, by, bw, 0.18, ["DOWN"], () => this.scroll(-STEP))
    ];
    this.buttons.forEach(b => hideFromRecording(b.el.object3D));
    this.draw();
  }
  add(incoming) {
    this.entries = merge(this.entries, incoming);
    this.draw();
  }
  scroll(delta) {
    this.offset = Math.max(0, this.offset + delta);
    this.draw();
  }
  measure(text) {
    return this.ctx.measureText(text).width;
  }
  get ctx() {
    return this.canvas.getContext("2d");
  }
  draw() {
    const ctx = this.ctx;
    ctx.font = FONT;
    const all = rows(this.entries, W - PAD * 2, t => this.measure(t));
    // New lines arrive at the bottom; while scrolled up, shift the offset so the view stays put.
    if (this.offset > 0 && this.lastRows != null) this.offset += all.length - this.lastRows;
    this.lastRows = all.length;
    const view = pick(all, VISIBLE, this.offset);
    this.offset = view.offset;
    ctx.fillStyle = "#101418";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = FONT;
    let y = PAD;
    for (const row of view.rows) {
      if (row.text) {
        ctx.fillStyle = row.color;
        ctx.fillText(row.text, PAD, y, W - PAD * 2);
      }
      y += FONT_PX * LEAD;
    }
    if (!this.entries.length) {
      ctx.fillStyle = "#7a8590";
      ctx.fillText("Conversation will", PAD, PAD);
      ctx.fillText("appear here.", PAD, PAD + FONT_PX * LEAD);
    }
    if (view.offset > 0) {
      ctx.fillStyle = "#ffb347";
      ctx.fillText(`^ older (${view.offset} lines up)`, PAD, H - PAD - FONT_PX);
    }
    this.texture.needsUpdate = true;
  }
  remove() {
    this.buttons.forEach(b => b.remove());
    this.el.remove();
    this.texture.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }
}
