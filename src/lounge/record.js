// private-quest-lounge: record the room, from inside it.
//
// A small red round REC button high on a wall, just under the ceiling, in a corner or on a side
// wall of each room, so it is not in the shot. Press it to start a clip, press again
// (any room's button) to stop; it stops by itself at the maximum length. The
// clip is the view from your own head (first person, steadied: no head roll),
// with sound: the whole room mix as you hear it (voices, the TV, Zoltar, the
// ambience, which all play through the Hubs audio listener) plus your own mic.
// When it stops it is sent, over the paired voice link (record-upload.js), to the Mac, which
// converts it to a small H.264/AAC MP4 in the Video Studio. If that fails for any reason the
// clip is saved to this headset's Downloads instead, so it is never lost.
//
// Why not the stock Hubs camera tool: it only exists as a spawned object, and
// spawning is switched off server-side in this fork (no media/camera
// permission), so it can never appear. This reuses its recording machinery
// (RenderTargetRecorder) with a camera of our own.
//
// The buttons, the "REC" indicator floating in your view and the pairing keypads
// are hidden for the recording render (record-core.cjs hideForRender), so none
// of them is in the clip. Other viewers see the normal Hubs "recording" mark.
import * as THREE from "three";
import { label } from "./tv-controls";
import { RenderTargetRecorder } from "../utils/render-target-recorder";
import { Recording, uploadNote, hideFromRecording, hideForRender, unhideFromRecording } from "./record-core.cjs";
import { buttonPose } from "./record-walls.cjs";
import { uploadClip } from "./record-upload.js";

// One button per room, on a wall just under the ceiling, in a corner or on a side wall, clear of the
// TV, Zoltar, desks, windows, sconces and panels. Fixed spots in the lounge model's own coordinates
// (the Hubs scene frame; they go through the environment root's transform below). They are searched
// and ray-tested offline: `node tests/record-walls.cjs` re-checks every one against the model,
// `--search` finds new ones if a room is rebuilt. Searching at runtime would stall a headset.
// room, pos [x, y, z], normal [x, y, z] (the way the wall faces)
// "range" is on the Rovers' roof deck, on the north wall behind the shooters (they face south;
// targets are downrange, the board is on the east parapet)
const BUTTONS = [
  { room: "rovers", pos: [5.3, 2.87, 16.54], normal: [0, 0, -1] },
  { room: "dining", pos: [10.35, 2.93, -9.56], normal: [-0.011, 0, 1] },
  { room: "cocktail", pos: [4.1, 2.98, -3.99], normal: [0, 0, -1] },
  { room: "cafe", pos: [6.85, 2.19, 11.6], normal: [1, 0, 0] },
  { room: "spa", pos: [-5.5, 2.27, 6.4], normal: [-1, 0, 0] },
  { room: "bedroom-sw", pos: [-9.75, 5.88, 5.05], normal: [0.005, 0, -1] },
  { room: "bedroom-ne", pos: [6.16, 5.95, -8.9], normal: [1, 0, -0.003] },
  { room: "den", pos: [-5.26, 2.93, 5.4], normal: [1, 0, 0] },
  { room: "gym", pos: [-4.3, 2.93, -0.4], normal: [0, 0, 1] },
  { room: "lounge", pos: [-10.94, 2.91, -2.4], normal: [1, 0, 0] },
  { room: "range", pos: [-0.57, 5.88, 8.4], normal: [1, 0, -0.004] }
];
const HIT = 0.6; // m: the clickable square (generous: a pointer anywhere on it presses)
const DISC = 0.26; // m: the red disc drawn inside it

const MOBILE = AFRAME.utils.device.isMobileVR();
const WIDTH = MOBILE ? 960 : 1280;
const HEIGHT = MOBILE ? 540 : 720;
const FPS = MOBILE ? 20 : 25;

const MIME = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=h264",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm"
].find(type => window.MediaRecorder && MediaRecorder.isTypeSupported(type));

const IDLE_BG = "#202a30";
const REC_BG = "#ff6b5e";
const DISC_RED = "#c62828";
const DISC_BRIGHT = "#ff3b30";

const p = (obj, out = new THREE.Vector3()) => obj.getWorldPosition(out);

// The round red button: a transparent HIT x HIT square (all of it is the pointer target) with
// a red DISC drawn in the middle. Idle: a small REC mark. Recording: a pulsing disc, STOP and the clock.
function disc(scene, pose, onPress) {
  const el = document.createElement("a-entity");
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const geometry = new THREE.PlaneGeometry(HIT, HIT);
  el.setObject3D("mesh", new THREE.Mesh(geometry, material));
  const draw = (lines, on, pulse = 0, failed = false) => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);
    const r = (256 * DISC) / HIT;
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.fillStyle = on ? (pulse > 0.5 ? DISC_BRIGHT : DISC_RED) : DISC_RED;
    ctx.fill();
    ctx.lineWidth = failed ? 14 : 8;
    ctx.strokeStyle = failed ? "#ffcf5c" : "#ffd9d4";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (on) {
      ctx.font = "700 62px sans-serif";
      ctx.fillText(lines[0], 256, 222);
      ctx.font = "600 44px sans-serif";
      ctx.fillText(String(lines[1] || "").replace("REC ", ""), 256, 292);
    } else {
      ctx.font = "700 58px sans-serif";
      ctx.fillText("REC", 256, 256);
    }
    texture.needsUpdate = true;
  };
  draw(["REC"], false);
  scene.appendChild(el);
  el.object3D.position.copy(pose.position);
  el.object3D.quaternion.copy(pose.quaternion);
  el.object3D.matrixNeedsUpdate = true;
  el.classList.add("interactable");
  el.setAttribute("is-remote-hover-target", "");
  el.setAttribute("tags", "singleActionButton: true");
  el.object3D.addEventListener("interact", onPress);
  return {
    el,
    draw,
    remove: () => {
      el.remove();
      texture.dispose();
      material.dispose();
      geometry.dispose();
    }
  };
}

AFRAME.registerSystem("lounge-record", {
  init() {
    this.rec = new Recording();
    this.buttons = [];
    this.placed = [];
    this.cam = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 500);
    this.lastFrame = 0;
    this.lastLabel = 0;
    this.note = null;
    this.onHidden = () => document.hidden && this.rec.active && this.stop("page hidden");
    document.addEventListener("visibilitychange", this.onHidden);
    this.el.addEventListener("environment-scene-loaded", () => setTimeout(() => this.setup(), 9000), { once: true });
    window.__loungeRecord = this; // for tests: status(), start(), stop()
  },

  remove() {
    document.removeEventListener("visibilitychange", this.onHidden);
    if (this.rec.active) this.stop("removed");
    this.buttons.forEach(b => (unhideFromRecording(b.el.object3D), b.remove()));
    if (this.indicator) (unhideFromRecording(this.indicator.el.object3D), this.indicator.remove());
  },

  status() {
    return {
      mime: MIME || null,
      size: [WIDTH, HEIGHT, FPS],
      active: this.rec.active,
      frames: this.frames || 0,
      placed: this.placed.map(r => ({ room: r.room, pos: r.pos })),
      unplaced: this.unplaced || []
    };
  },

  setup() {
    // The Mac TV client is a feeder: it never gets controls.
    if (this.el.systems["lounge-tv"]?.isFeeder || this.buttons.length) return;
    if (!MIME || !document.createElement("canvas").getContext("webgl2")) {
      console.warn("lounge-record: this browser cannot record video; no buttons");
      return;
    }
    this.env = document.querySelector("#environment-root")?.object3D;
    if (!this.env) return;
    this.env.updateMatrixWorld(true);
    this.unplaced = [];
    // one button per slice: a headset should not build ten textures in one frame
    BUTTONS.forEach((spot, i) =>
      setTimeout(() => {
        try {
          this.mount(spot);
        } catch (error) {
          console.warn("lounge-record: room", spot.room, error);
          this.unplaced.push(spot.room);
        }
      }, i * 120)
    );
    this.indicatorTimer = setTimeout(() => this.makeIndicator(), 500);
  },

  // Put the disc at its spot on the wall (the model's coordinates, through the environment root).
  mount(spot) {
    const pose = buttonPose(THREE, spot);
    this.env.updateMatrixWorld(true);
    pose.position.applyMatrix4(this.env.matrixWorld);
    pose.quaternion.premultiply(this.env.getWorldQuaternion(new THREE.Quaternion()));
    const button = disc(this.el, pose, () => this.press(spot.room));
    hideFromRecording(button.el.object3D);
    button.room = spot.room;
    this.buttons.push(button);
    this.placed.push({ room: spot.room, pos: pose.position.toArray() });
    this.refresh(true);
  },

  makeIndicator() {
    const pov = document.querySelector("#avatar-pov-node");
    if (!pov || this.indicator) return;
    // a small red tag low in your own view; hidden from the clip like the buttons
    this.indicator = label(pov, new THREE.Vector3(0, -0.2, -0.52), new THREE.Quaternion(), 0, 0, 0.34, 0.06, ["REC"]);
    this.indicator.el.object3D.visible = false;
    hideFromRecording(this.indicator.el.object3D);
  },

  press(room) {
    if (this.rec.active) this.stop("button");
    else this.start(room);
  },

  // ---- recording ---------------------------------------------------------

  start(room = "room") {
    if (this.rec.active || this.saving) return false;
    try {
      this.room = room;
      this.target = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        encoding: THREE.sRGBEncoding
      });
      this.target.texture.generateMipmaps = false;
      this.recorder = new RenderTargetRecorder(this.el.renderer, MIME, WIDTH, HEIGHT, FPS, this.audioTrack());
      this.recorder.mediaRecorder.addEventListener("error", () => this.stop("recorder error"));
      this.recorder.start();
    } catch (error) {
      console.warn("lounge-record: cannot start", error);
      this.cleanup();
      this.say(["CANNOT RECORD", String(error.message || error).slice(0, 30)], 5000, true);
      return false;
    }
    const now = performance.now();
    this.rec.start(now);
    this.camReady = false;
    this.lastFrame = 0;
    this.frames = 0;
    try {
      window.APP?.hubChannel?.beginRecording();
    } catch {
      /* the mark for other viewers is a courtesy */
    }
    this.refresh(true);
    return true;
  },

  // The room mix as heard (the Hubs audio listener input: voices, TV, Zoltar,
  // ambience) plus your own mic, into one track. A near-silent tone keeps the
  // track alive in a silent room (a Chrome bug writes an empty file otherwise).
  audioTrack() {
    const listener = this.el.audioListener;
    const ctx = THREE.AudioContext.getContext();
    if (!listener || !ctx) return null;
    const dest = ctx.createMediaStreamDestination();
    this.audio = { ctx, dest, listener, nodes: [] };
    listener.getInput().connect(dest);
    const mic = window.APP?.mediaDevicesManager?.audioTrack || window.APP?.dialog?._micProducer?.track;
    if (mic && mic.readyState === "live") {
      const source = ctx.createMediaStreamSource(new MediaStream([mic]));
      source.connect(dest);
      this.audio.nodes.push(source);
      this.audio.mic = true;
    }
    const tone = ctx.createOscillator();
    const quiet = ctx.createGain();
    quiet.gain.value = 0.0001;
    tone.connect(quiet).connect(dest);
    tone.start();
    this.audio.nodes.push(tone, quiet);
    return dest.stream.getAudioTracks()[0];
  },

  stop(reason = "") {
    if (!this.rec.active) return;
    const length = this.rec.stop(performance.now());
    const recorder = this.recorder;
    const room = this.room;
    this.recorder = null;
    this.el.systems["lounge-telemetry"]?.event("rec-clip", {
      frames: this.frames,
      s: Math.round(length / 1000),
      vr: this.el.is("vr-mode") ? 1 : 0,
      why: reason
    });
    try {
      window.APP?.hubChannel?.endRecording();
    } catch {
      /* courtesy mark */
    }
    if (!this.rec.keep(length)) {
      recorder.cancel();
      this.cleanup(recorder);
      this.say(["TOO SHORT", "not saved"], 3000);
      return;
    }
    this.saving = true;
    this.say(["SAVING CLIP"], 20000);
    recorder
      .save()
      .then(async file => {
        if (!file) throw new Error("empty clip");
        this.say(["SENDING TO MAC"], 100000);
        const sent = await uploadClip(file);
        const downloaded = sent.ok ? null : this.save(file, room);
        const note = uploadNote.lines(sent, downloaded);
        if (!sent.ok) console.warn("lounge-record: upload failed, kept on headset:", sent.why);
        this.say(note.lines, 9000, note.failed);
      })
      .catch(error => {
        console.warn("lounge-record: save failed", error);
        this.say(["SAVE FAILED", String(error.message || error).slice(0, 30)], 6000, true);
      })
      .finally(() => {
        this.saving = false;
        this.cleanup(recorder);
      });
    console.log(`lounge-record: stopped (${reason}) after ${Math.round(length / 1000)}s`);
  },

  save(file, room) {
    const ext = file.type.includes("mp4") ? "mp4" : "webm";
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
    const name = `lounge-${room}-${stamp}.${ext}`;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return name;
  },

  cleanup(recorder) {
    if (this.audio) {
      try {
        this.audio.listener.getInput().disconnect(this.audio.dest);
      } catch {
        /* already gone */
      }
      for (const node of this.audio.nodes) {
        try {
          node.stop?.();
          node.disconnect();
        } catch {
          /* already gone */
        }
      }
      this.audio.dest.stream.getTracks().forEach(t => t.stop());
      this.audio = null;
    }
    recorder?.videoRenderTarget?.dispose();
    this.target?.dispose();
    this.target = null;
    this.refresh(true);
  },

  // ---- frames ------------------------------------------------------------

  tick() {
    if (!this.rec.active) {
      if (this.note && performance.now() > this.note.until) {
        this.note = null;
        this.refresh(true);
      }
      return;
    }
    const now = performance.now();
    if (this.rec.expired(now)) return this.stop("maximum length");
    if (now - this.lastLabel > 250) this.refresh();
    if (now - this.lastFrame < 1000 / FPS) return;
    this.lastFrame = now;
    this.frame();
  },

  frame() {
    const pov = document.querySelector("#avatar-pov-node")?.object3D;
    if (!pov || !this.target) return;
    // your head, without the roll, eased so a head turn is not a jolt
    const q = pov.getWorldQuaternion(new THREE.Quaternion());
    const e = new THREE.Euler().setFromQuaternion(q, "YXZ");
    e.z = 0;
    q.setFromEuler(e);
    const pos = p(pov);
    if (!this.camReady) {
      this.cam.position.copy(pos);
      this.cam.quaternion.copy(q);
      this.camReady = true;
    } else {
      this.cam.position.lerp(pos, 0.5);
      this.cam.quaternion.slerp(q, 0.4);
    }
    // Hubs turns matrix auto-update off for every object (hub.js), so without this the camera
    // keeps the pose of the first frame: the first headset clip was stuck where REC was pressed
    this.cam.matrixNeedsUpdate = true;
    this.cam.updateMatrixWorld(true);

    const renderer = this.el.renderer;
    const scene = this.el.object3D;
    const xr = renderer.xr.enabled;
    const after = scene.onAfterRender;
    const restore = hideForRender();
    const previous = renderer.getRenderTarget();
    try {
      renderer.xr.enabled = false;
      scene.onAfterRender = () => {};
      renderer.setRenderTarget(this.target);
      renderer.clearDepth();
      renderer.render(scene, this.cam);
    } finally {
      renderer.setRenderTarget(previous);
      renderer.xr.enabled = xr;
      scene.onAfterRender = after;
      restore();
    }
    this.recorder.captureFrame(this.target);
    this.frames++;
  },

  // ---- button faces ------------------------------------------------------

  say(lines, ms, failed = false) {
    this.note = { lines, until: performance.now() + ms, failed };
    this.refresh(true);
  },

  refresh() {
    const now = performance.now();
    this.lastLabel = now;
    const face = this.rec.buttonLines(now);
    const note = !this.rec.active && this.note;
    const pulse = 0.5 + 0.5 * Math.sin(now / 280);
    for (const button of this.buttons) button.draw(face.on ? face.lines : ["REC"], face.on, pulse, !!(note && note.failed));
    if (this.indicator) {
      // the tag in your own view: the clock while recording, else what happened to the last clip
      // (the disc is far too small and far away to carry words)
      const lines = this.rec.indicatorLines(now) || (note ? note.lines : null);
      this.indicator.el.object3D.visible = !!lines;
      if (lines) {
        const bg = note && !this.rec.active ? (note.failed ? "#8a2c20" : IDLE_BG) : Math.floor(now / 1000) % 2 ? REC_BG : "#b3261e";
        this.indicator.draw(lines, false, bg);
      }
    }
  }
});
