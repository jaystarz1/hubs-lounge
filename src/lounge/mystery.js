import * as THREE from "three";
import { SourceType } from "../components/audio-params";
import { getServerTime } from "../phoenix-adapter";
import {
  sessionStart,
  mysteryOn,
  mysteryNight,
  mysteryGone,
  adoptStart,
  latchedStart,
  guestJoins
} from "../utils/hub-utils";
import { label } from "./tv-controls";
import { setScriptLevel } from "./lights";
import { MYSTERIES } from "./mysteries";

// A murder mystery over the dinner party (Jay, 2026-10-22), a different case
// every night of the week (2026-10-24: lounge/mysteries, tonight's by the
// session's night, hub-utils mysteryNight). The diners speak their lines
// (mysteries/<night>.json, rendered by lounge-assets/mystery-talk.py) from
// where they sit, on the dinner clock, so
// every client hears the same line at the same moment; and a board on the north
// glass behind the head of the table: everyone's pin on a suspect, moved as
// often as you like, the clues pinned up as they come out, closed when the
// pudding comes, then the answer and who called it first.
// On every evening that has a case (hub-utils mysteryOn, or ?mystery in the
// link): the dinner then waits for a second guest (hub-utils sessionStart).
// The case's dead and taken away stay as it leaves them for the rest of the
// night (hub-utils mysteryGone, loop-animation), and a cue's "dark:<s>" puts
// the lights out for that long ("flicker:<s>": a stutter) for everyone at once.
// Everything on the board but the pins follows from the clock, so a late
// joiner sees what everyone sees; each pin is its owner's, told to the room on
// every move and every few seconds after. Every card has the person's face on
// it (Jay: "so we know who is who"), taken from their figure in the room: a
// small camera in front of the face, once as the board goes up (on the patio)
// and again once they are seated; the host and the inspector have cards too.

const PHASE = 360; // the dinner's clock starts on the regulars' beat (loop-animation)
const TAG_UP = 0.36; // m above the speaker's head bone: their name while they talk
const TAG_HOLD = 0.4; // s the name stays after the line
const MIME_OUT = 1.5;
// The lines are loaded a minute and a half ahead and let go once said: the whole
// dinner decoded at once (28 minutes of speech) is more than a Quest 2 tab holds.
const AHEAD = 90;
const KEEP = 10; // m round the dining room the mime is kept out of sight during the show
const DATA_TYPE = "lounge-mystery";
const VOL = 0.9;
const LOW = 0.45; // a line said low
const REF = 3; // the whole table hears every line nearly as well
const BOARD = [8.8, 9.55, 1.55]; // Blender: on the north glass, behind the mime's spot (8.6..9.4, 8.95)
const PICK_BG = "#e9d9a8";
const WIN_BG = "#ffd75e";
const LOSE_BG = "#8a8a8a";
const FACE_PX = 256;
const FACE_AT = 150; // s on the dinner clock: seated, after the toast (the second picture)
const FACE_FOV = 50;
const FACE_DIST = 0.5; // m in front of the face (closer than anyone talking to them stands)

const DARK = 0.04; // the lights in a blackout (of the viewer's own level's scale)
const v1 = new THREE.Vector3();
let SCRIPT = null; // tonight's case (pick())
let cues = [];
let END = 0; // the last line said: up for the Rovers
let LOCK_T = Infinity;
let REVEAL_T = Infinity;
let CLUE_T = {};

// Tonight's case: its script, cues and the moments the board turns on.
function pick(night) {
  const m = MYSTERIES[night];
  SCRIPT = m.script;
  cues = m.cues;
  const at = ev => cues.find(c => c.ev === ev)?.t ?? Infinity;
  END = (cues.at(-1)?.t || 2600) + 30;
  LOCK_T = at("lock");
  REVEAL_T = at("reveal");
  CLUE_T = Object.fromEntries(Object.keys(SCRIPT.clues).map(k => [k, at(`clue:${k}`)]));
  mysteryGone.clear();
  for (const id of SCRIPT.gone || []) mysteryGone.add(SCRIPT.who[id]);
}

// The lights the script wants at t: a blackout, a flicker's off beats, or null.
function scriptLight(t) {
  for (const c of cues) {
    if (c.t > t) break;
    const m = /^(dark|flicker):([\d.]+)$/.exec(c.ev || "");
    if (!m || t >= c.t + Number(m[2])) continue;
    if (m[1] === "dark") return DARK;
    return Math.floor((t - c.t) * 7) % 3 === 1 ? 1 : DARK; // (off, on for a beat, off ...)
  }
  return null;
}
const v2 = new THREE.Vector3();

function dinnerClock() {
  return getServerTime() / 1000 - Math.floor(sessionStart() / 1000 / PHASE) * PHASE;
}

function nameOf(id) {
  const meta = window.APP?.hubChannel?.presence?.state?.[id]?.metas?.[0];
  return meta?.profile?.displayName || "Guest";
}

AFRAME.registerSystem("lounge-mystery", {
  init() {
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.next = 0; // the first cue not yet started
    this.playing = [];
    this.pins = {}; // clientId -> { p, at }
    this.mine = { p: null, at: 0 };
    this.nextTell = 0;
    this.nextDraw = 0;
    this.shift = 0; // s added to the dinner clock (tests jump to a scene with it)
    this.faces = {}; // id -> canvas
    this.faceGen = 0;
    this.faceQueue = [];
    this.tags = {};
  },

  remove() {
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.teardown();
  },

  teardown() {
    for (const l of this.labels || []) l.remove();
    this.labels = [];
    this.tags = {};
    this.ready = false;
  },

  onSceneLoaded() {
    this.teardown();
    this.amb = this.el.sceneEl.systems["lounge-ambience"];
    this.ready = true;
    this.built = false;
  },

  clock() {
    return dinnerClock() + this.shift;
  },

  // ---- the board -------------------------------------------------------------------

  buildBoard() {
    const amb = this.amb;
    const scene = this.el.sceneEl;
    const anchor = amb.toWorld(BOARD, new THREE.Vector3());
    // facing south, down the table (Blender -y)
    const rot = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(amb.envM));
    const add = (x, y, w, h, lines, fn) => {
      const l = label(scene, anchor, rot, x, y, w, h, lines, fn);
      this.labels.push(l);
      return l;
    };
    this.title = add(0, 0.66, 2.24, 0.16, [SCRIPT.title]);
    this.status = add(0, 0.47, 2.24, 0.14, [""]);
    this.cards = SCRIPT.suspects.map((s, i) =>
      Object.assign(
        add(-0.9 + i * 0.45, 0.1, 0.43, 0.54, [s.name], () => this.pick(s.id)),
        { s }
      )
    );
    // (the host and the inspector either side: not suspects, nothing to pin)
    this.castCards = SCRIPT.cast.map((s, i) => Object.assign(add(i ? 1.38 : -1.38, 0.1, 0.43, 0.54, [s.name]), { s }));
    this.faceQueue = [];
    this.faceAt = (this.amb.now || 0) + 4;
    this.faceAgain = false;
    this.faceSeated = false;
    this.clueCards = Object.keys(SCRIPT.clues).map((k, i) =>
      Object.assign(add(-0.75 + (i % 3) * 0.75, -0.3 - Math.floor(i / 3) * 0.15, 0.73, 0.13, ["?"]), { k })
    );
    this.built = true;
    this.drawn = "";
  },

  pick(id) {
    const t = this.clock();
    if (t >= LOCK_T || t < 0 || t > END) return;
    this.mine = { p: this.mine.p === id ? null : id, at: Math.round(t) };
    this.tell(true);
    this.draw(true);
  },

  // ---- the faces on the cards ----------------------------------------------------

  // A picture of one of the cast from their figure, as they are now: false if
  // they can't be seen.
  snap(id) {
    const amb = this.amb;
    const f = amb.byTag[SCRIPT.who[id]];
    // (the loader drops the dot from bone names: Mouth.L arrives as MouthL)
    const bone = n => amb.named[`${f.tag}_${n}`] || amb.named[`${f.tag}_${n.replace(".", "")}`];
    const mL = f && bone("Mouth.L");
    const mR = f && bone("Mouth.R");
    if (!f?.head || !f.visible || !mL || !mR) return false;
    const head = amb.bonePos(f.head, new THREE.Vector3());
    const face = amb.bonePos(mL, v1).clone().add(amb.bonePos(mR, v2)).multiplyScalar(0.5);
    const fwd = face.clone().sub(head).setY(0); // (the face is in front of the neck)
    if (fwd.lengthSq() < 1e-6) return false;
    face.y += 0.04; // (between the mouth and the eyes)
    if (!this.cam) {
      this.cam = new THREE.PerspectiveCamera(FACE_FOV, 1, 0.05, 30);
      this.rt = new THREE.WebGLRenderTarget(FACE_PX, FACE_PX, { encoding: THREE.sRGBEncoding });
      this.rt.texture.encoding = THREE.sRGBEncoding;
      this.px = new Uint8Array(FACE_PX * FACE_PX * 4);
    }
    this.cam.position.copy(face).addScaledVector(fwd.normalize(), FACE_DIST);
    this.cam.lookAt(face);
    this.cam.updateMatrixWorld(true);
    const scene = this.el.sceneEl;
    const r = scene.renderer;
    const xr = r.xr.enabled;
    const after = scene.object3D.onAfterRender;
    delete scene.object3D.onAfterRender;
    r.xr.enabled = false;
    const was = r.getRenderTarget();
    // (only them in the picture: whoever stands talking to them would be in the way)
    const hidden = [];
    for (const g of amb.figs) {
      const o = amb.named[`Fig_${g.tag}`];
      if (g !== f && o?.visible) {
        o.visible = false;
        hidden.push(o);
      }
    }
    try {
      r.setRenderTarget(this.rt);
      r.clear();
      r.render(scene.object3D, this.cam);
      r.readRenderTargetPixels(this.rt, 0, 0, FACE_PX, FACE_PX, this.px);
    } finally {
      for (const o of hidden) o.visible = true;
      r.setRenderTarget(was);
      r.xr.enabled = xr;
      scene.object3D.onAfterRender = after;
    }
    const canvas = this.faces[id] || document.createElement("canvas");
    canvas.width = canvas.height = FACE_PX;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(FACE_PX, FACE_PX);
    const row = FACE_PX * 4;
    for (let y = 0; y < FACE_PX; y++) img.data.set(this.px.subarray(y * row, y * row + row), (FACE_PX - 1 - y) * row);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    ctx.putImageData(img, 0, 0);
    this.faces[id] = canvas;
    this.faceGen++;
    return true;
  },

  faceTick(t, now) {
    // (each taken twice running: the first picture after a frame without one
    // comes out without the person in it; the one straight after is right)
    const all = [...SCRIPT.suspects, ...SCRIPT.cast].flatMap(s => [s.id, s.id]);
    // (taken again half a minute on: the first can come before every figure has settled into its pose)
    if (this.faceAt !== null && now >= this.faceAt) {
      this.faceAt = this.faceAgain ? null : now + 26;
      this.faceAgain = true;
      this.faceQueue = all.slice();
    }
    if (!this.faceSeated && t >= FACE_AT && t < FACE_AT + 60) {
      this.faceSeated = true;
      this.faceQueue = all.slice();
    }
    // (one at a time, between frames: taken inside the frame's update, the first
    // picture after an ordinary frame can come out from the wrong camera)
    if (this.faceQueue.length && !this.facePending) {
      const id = this.faceQueue.shift();
      this.facePending = true;
      setTimeout(() => {
        try {
          if (this.built) this.snap(id);
        } finally {
          this.facePending = false;
        }
      }, 0);
    }
  },

  draw(force) {
    const t = this.clock();
    const me = window.NAF?.clientId || "me";
    const pins = { ...this.pins, [me]: this.mine };
    const live = window.APP?.hubChannel?.presence?.state || {};
    for (const id of Object.keys(pins)) if (id !== me && !live[id]) delete pins[id];
    const locked = t >= LOCK_T;
    const revealed = t >= REVEAL_T;
    let status;
    if (t < 0) {
      const at = new Date(sessionStart()).toLocaleTimeString("en-CA", {
        timeZone: "America/Toronto",
        hour: "numeric",
        minute: "2-digit"
      });
      status =
        guestJoins().length < 2 || latchedStart() === null
          ? ["Dinner waits for a second guest, then starts on the next 6-minute mark."]
          : [`Dinner is served at ${at} Pins open then.`];
    } else if (revealed) {
      const right = Object.entries(pins)
        .filter(([, v]) => v.p === SCRIPT.killer)
        .sort((a, b) => a[1].at - b[1].at);
      status = right.length
        ? [`Called it first: ${nameOf(right[0][0])}, at ${Math.max(1, Math.round(right[0][1].at / 60))} min`]
        : ["Nobody called it."];
    } else if (locked) status = ["The board is closed."];
    else status = ["Pin your suspect: tap a card. Change it as often as you like. Closes when the pudding comes."];
    const cards = this.cards.map(c => {
      const who = Object.entries(pins)
        .filter(([, v]) => v.p === c.s.id)
        .map(([id]) => (id === me ? "YOU" : nameOf(id)));
      const lines = [c.s.name, c.s.role, "", ...(who.length ? who : ["-"])];
      let bg = "#202a30";
      if (revealed) bg = c.s.id === SCRIPT.killer ? WIN_BG : LOSE_BG;
      else if (this.mine.p === c.s.id) bg = PICK_BG;
      return [c, lines, bg];
    });
    const cast = this.castCards.map(c => [c, [c.s.name, c.s.role]]);
    const clues = this.clueCards.map(c => [c, [t >= CLUE_T[c.k] ? SCRIPT.clues[c.k].text : "?"]]);
    const key = JSON.stringify([status, cards.map(x => [x[1], x[2]]), clues.map(x => x[1]), this.faceGen]);
    if (!force && key === this.drawn) return;
    this.drawn = key;
    this.status.draw(status);
    for (const [c, lines, bg] of cards) c.draw(lines, false, bg, this.faces[c.s.id] || null);
    for (const [c, lines] of cast) c.draw(lines, false, "#202a30", this.faces[c.s.id] || null);
    for (const [c, lines] of clues) c.draw(lines);
  },

  // ---- the room told about our pin ---------------------------------------------------

  subscribe() {
    if (this.subscribed || !window.NAF?.connection?.subscribeToDataChannel) return;
    NAF.connection.subscribeToDataChannel(DATA_TYPE, (from, _type, data) => this.onMessage(from, data));
    this.subscribed = true;
  },

  tell(reliable) {
    const data = { p: this.mine.p, at: this.mine.at, s: latchedStart(), by: window.NAF?.clientId || "" };
    try {
      if (reliable) NAF.connection.broadcastDataGuaranteed(DATA_TYPE, data);
      else NAF.connection.broadcastData(DATA_TYPE, data);
    } catch {
      /* not connected yet */
    }
  },

  onMessage(from, data) {
    const by = data?.by || from;
    if (!by || by === window.NAF?.clientId || !SCRIPT) return;
    adoptStart(data.s); // (the dinner's start: the earliest anyone has)
    const p = SCRIPT.suspects.some(s => s.id === data.p) ? data.p : null;
    const old = this.pins[by];
    // (after the lock nothing moves: a pin placed later than the lock is not taken)
    if (Number(data.at) >= LOCK_T && old) return;
    this.pins[by] = { p, at: Number(data.at) || 0 };
  },

  // ---- the lines --------------------------------------------------------------------

  setupAudio() {
    const amb = this.amb;
    const audioSystem = this.el.sceneEl.systems["hubs-systems"]?.audioSystem;
    if (!amb?.ctx || !audioSystem) return false;
    this.ctx = amb.ctx;
    this.out = this.ctx.createGain();
    this.out.gain.value = 1;
    audioSystem.addAudio({ sourceType: SourceType.SFX, node: this.out });
    this.nextLoad = 0;
    this.waiting = [];
    return true;
  },

  where(cue) {
    const f = this.amb.byTag[SCRIPT.who[cue.who]];
    if (!f || !f.visible) return null;
    return { f, z: f.zone || this.amb.zones.dining };
  },

  say(cue, offset) {
    const amb = this.amb;
    const buf = amb.buffers.get(cue.n);
    const w = this.where(cue);
    if (!buf || !w || w.z.heard < 0.02) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.value = (cue.q ? LOW : VOL) * w.z.heard;
    const pan = amb.panner(amb.bonePos(w.f.head || w.f.hips, v1).clone(), REF);
    src.connect(gain);
    gain.connect(pan);
    pan.connect(this.out);
    const line = { src, gain, z: w.z, cue };
    this.playing.push(line);
    src.onended = () => {
      this.playing = this.playing.filter(x => x !== line);
      src.disconnect();
      gain.disconnect();
      pan.disconnect();
    };
    src.start(0, offset);
  },

  // ---- who is talking: their name over their head ----------------------------------

  tag(who, until) {
    let tg = this.tags[who];
    if (!tg) {
      const s = [...SCRIPT.suspects, ...SCRIPT.cast].find(x => x.id === who);
      const l = label(this.el.sceneEl, new THREE.Vector3(), new THREE.Quaternion(), 0, 0, 0.7, 0.12, [
        s ? s.name : who.toUpperCase()
      ]);
      l.el.object3D.visible = false;
      this.labels.push(l);
      tg = this.tags[who] = { l, until: 0 };
    }
    tg.until = Math.max(tg.until, until);
  },

  tagTick(now) {
    const cam = this.el.sceneEl.camera;
    if (!cam) return;
    cam.getWorldPosition(v2);
    for (const [who, tg] of Object.entries(this.tags)) {
      const f = this.amb.byTag[SCRIPT.who[who]];
      const o = tg.l.el.object3D;
      const show = now < tg.until && f?.visible && f.head;
      if (show) {
        this.amb.bonePos(f.head, o.position);
        o.position.y += TAG_UP;
        o.lookAt(v2.x, o.position.y, v2.z); // (upright, turned to you)
        o.matrixNeedsUpdate = true;
      }
      if (o.visible !== !!show) o.visible = !!show;
    }
  },

  // The show has the dining room to itself: no chatter tape under the lines, and
  // the mime's turns at the head of the table happen out of sight.
  stage(on, t) {
    const din = this.amb.zones.dining;
    const live = on && t < END;
    din.scripted = live;
    const mime = this.amb.byTag.DinMime;
    const rig = this.amb.named.Fig_DinMime;
    const props = this.amb.named.Fig_DinCafeProps;
    let away = false;
    if (live && mime?.hips) {
      const p = this.amb.toBlender(this.amb.bonePos(mime.hips, v1), v2);
      const b = din.box;
      away =
        p.x > b[0] - MIME_OUT && p.x < b[1] + MIME_OUT && p.y > b[2] - MIME_OUT && p.y < b[3] + MIME_OUT && p.z < 3.3;
    }
    for (const o of [rig, props]) if (o && o.visible === away) o.visible = !away;
  },

  // (the dining room is voices only: the curtain-call "applause" cue is silent)
  event(cue) {
    if (cue.ev === "gasp") this.amb.play(this.amb.zones.dining, "gasp", null, 0.5);
  },

  tick() {
    if (!this.ready || !this.amb?.ready) return;
    if (!mysteryOn()) {
      if (this.built) {
        for (const l of this.labels) l.remove();
        this.labels = [];
        this.tags = {};
        this.built = false;
        this.stage(false, 0);
        setScriptLevel(null);
      }
      mysteryGone.clear();
      this.night = null;
      return;
    }
    const night = mysteryNight(Math.floor(sessionStart() / 1000 / PHASE) * PHASE);
    if (!night) return;
    if (night !== this.night) {
      // (a new evening, or the session moved to another night: tonight's case from scratch)
      if (this.built) {
        for (const l of this.labels) l.remove();
        this.labels = [];
        this.tags = {};
        this.built = false;
      }
      this.night = night;
      pick(night);
      this.lastT = undefined;
      this.pins = {};
      this.mine = { p: null, at: 0 };
      this.faces = {};
    }
    if (!this.built) this.buildBoard();
    if (!this.ctx && !this.setupAudio()) return;
    this.subscribe();
    const t = this.clock();
    const now = this.amb.now || 0;
    // the lines due: start them (part-way in if we came in during one)
    if (this.lastT === undefined || t < this.lastT - 5 || t > this.lastT + 5) {
      this.next = cues.findIndex(c => c.t + c.d > t);
      if (this.next < 0) this.next = cues.length;
      this.waiting = [];
      this.nextLoad = 0;
    }
    this.lastT = t;
    if (now >= this.nextLoad) {
      this.nextLoad = now + 2;
      const amb = this.amb;
      amb.load(cues.filter(c => c.t + c.d > t - 1 && c.t < t + AHEAD).map(c => c.n));
      for (const c of cues)
        if (c.t + c.d < t - KEEP && amb.buffers.has(c.n) && !this.playing.some(l => l.cue === c))
          amb.buffers.delete(c.n);
    }
    while (this.next < cues.length && cues[this.next].t <= t) {
      const c = cues[this.next++];
      if (c.ev && t - c.t < 1) this.event(c);
      this.waiting.push(c);
    }
    // (a line not loaded yet, after a jump or on joining: said as soon as it is, from where it has got to)
    this.waiting = this.waiting.filter(c => {
      const into = t - c.t;
      if (into >= c.d - 0.4) return false;
      if (!this.amb.buffers.has(c.n)) return true;
      this.say(c, Math.max(0, into));
      this.tag(c.who, now + c.d - into + TAG_HOLD);
      return false;
    });
    // the room keeps to a murmur while someone is speaking; a line fades with how
    // much of its room you hear
    const din = this.amb.zones.dining;
    if (this.playing.length) din.hushUntil = Math.max(din.hushUntil || 0, now + 0.6);
    for (const l of this.playing)
      l.gain.gain.setTargetAtTime((l.cue.q ? LOW : VOL) * l.z.heard, this.ctx.currentTime, 0.2);
    if (now >= this.nextTell) {
      this.nextTell = now + 5;
      this.tell(false);
    }
    this.faceTick(t, now);
    this.tagTick(now);
    this.stage(true, t);
    setScriptLevel(t >= 0 && t < END ? scriptLight(t) : null);
    if (now >= this.nextDraw) {
      this.nextDraw = now + 0.5;
      this.draw(false);
    }
  }
});
