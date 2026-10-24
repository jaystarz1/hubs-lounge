import * as THREE from "three";
import { SourceType } from "../components/audio-params";
import { label } from "./tv-controls";
import TALK from "./bed-talk.json";

// Room sound for the lounge (Jay, 2026-10-20): low background where the
// people are (the Rovers, the dining room, the cocktail patio, the café, the
// hot tub, the two bedrooms), heard only in that room, with sounds for the
// mime's acts and the couples, all driven by what the figures are doing in
// their clips so it can't drift from what you see:
//   - each room is a zone (boxes in Blender coordinates, from floor plans of
//     the scene); its sound plays only while you're inside, fades in and out
//     over a second or so, and through an open door or across the open south
//     balcony you hear it faintly and muffled; nothing goes through walls,
//     and only the zones you can hear are playing at all
//   - the chatter bed grows with how many figures are in the room; glasses,
//     cutlery, darts, the espresso machine come at random from where the
//     people (or the bar) are. No laughs or cheers (Jay, 2026-10-22, the third
//     time a generated one came out as a child: a quiet dinner party, no kids)
//   - the mime: whooshes when his clubs and torches fly, a cymbal and an "ooh"
//     when a dove or a rabbit appears, squeaks as he twists balloons; clapping
//     comes from the guests' own hands meeting (and a round of applause when
//     enough of them do); on his rounds all of it low and cut short (ROAD); while he is on the Rovers stage (or the finale's
//     lights are down) the pub drops to a murmur that swells with a gasp when
//     a prop appears or a reveal lands, and every half minute or so anyway
//   - the couples in bed (the NE couple's loop, the café lady and the mime once
//     a night in the SW room): they talk (bed-talk.json, two voices each, no
//     moans or bed noise, which came out as hiss and "power tools"): a few
//     words now and then with long pauses, closer together and hotter the
//     longer their strokes go on, a finish when it stops and a word or two
//     after; in the SW room an exchange as she comes in, talk over the
//     cigarette, and who goes down first
// Volume: "Lounge sound" in the settings (preferences.loungeAmbienceVolume,
// per person, saved) and the little SOUND cards on the tables by the seats.
// When someone in the room is talking it all dips to about half, so speech
// stays clear (a guest is hard of hearing).

const sfx = require.context("../assets/sfx/lounge", false, /\.mp3$/);
const URLS = {};
for (const k of sfx.keys()) URLS[k.replace("./", "").replace(".mp3", "")] = sfx(k);
// "gasp" -> ["gasp-0", ...]
const GROUPS = {};
for (const n of Object.keys(URLS)) {
  const m = n.match(/^(.*)-(\d+)$/);
  if (m) (GROUPS[m[1]] = GROUPS[m[1]] || []).push(n);
}
// What a voicesOnly zone still plays: the one crowd sound that is just people
// talking (the murder's gasp). No claps, applause, "ooh" or the mime's props
// there, ever, him in the room or not (Jay, 2026-10-22: "in the dining room i
// just want voices").
const VOICES = new Set(["gasp"]);

const SAMPLE = 0.1; // s between zone / figure updates
// The Rovers stage (rovers_figures.STAGE_POLY's box, Blender x/y): while the
// mime is on it, or the finale's lights are down, the pub watches.
const STAGE = [-3.75, -1.2, -11.7, -10.05];
const MURMUR = 0.25; // the chatter while they watch
// The mime's travelling show (his rounds of the tables, not the finale on the
// stage): ok, but short (Jay, 2026-10-22): each sound at this share of its
// level, faded out after so many seconds.
const ROAD = 0.55;
const CUT = { whoosh: 0.7, fire: 0.8, squeak: 0.6, cymbal: 1.2, ooh: 1.2, clap: 0.5, applause: 2.2 };
// Sound cues a show puts on the prop rig (lounge-assets nights.py cue()):
// DinCafeProps_Sfx<Name> shown = this sound there. Cluck repeats while it
// shows; Roll is a drum roll with a cymbal as it ends; Wow is the room gasping;
// the rest play once as they come on.
const CUE_GROUP = { Roar: "roar", Whip: "whip", Snap: "snap" };
const SWELL = 0.7; // and when something surprises them
const MAX_VOICES = 10; // one-shots at once
const DEFAULT_VOLUME = 80;

// Zones in Blender coordinates: box [x0, x1, y0, y1, z0, z1]. Ground floor z
// -0.6..3.3, upstairs 3.4..7.5 (the range on the Rovers roof is above both).
// doors: [x, y, z] where the room is heard faintly outside; open: metres over
// which an open-air zone fades out beyond its box.
const ZONES = {
  rovers: {
    box: [-4, 7, -16.85, -9.8, -0.6, 3.3],
    doors: [[0, -9.8, 1.2]],
    bed: ["bed-pub", n => 0.1 + 0.03 * Math.min(n, 12)],
    music: { name: "pub-piano", at: [-2.62, -15.3, 1.1], who: "Pno", level: 0.24 },
    shots: [
      { groups: ["clink", "pint"], every: [5, 12], people: 2, at: [3.2, -14.4, 1.1], vol: 0.35 },
      { groups: ["dart"], every: [5, 11], who: "Dt", at: [-3.85, -12.6, 1.73], vol: 0.3 }
    ]
  },
  dining: {
    box: [6.1, 11.4, 4.2, 9.9, -0.6, 3.3],
    doors: [
      [6.1, 7.85, 1.2],
      [6.8, 4.2, 1.2]
    ],
    bed: ["bed-dining", n => (n >= 3 ? 0.08 + 0.025 * Math.min(n, 12) : 0.04)],
    music: { name: "dining-strings", level: 0.08, people: 3 },
    // Voices only (Jay, 2026-10-21/22): no cutlery, glasses, chairs, claps,
    // applause or mime sounds. While the mime is in the room the talk drops to
    // a murmur, and comes back after he goes.
    voicesOnly: true
  },
  cocktail: {
    box: [-5.35, 5.95, 4.0, 9.84, -0.6, 3.3],
    doors: [
      [6.0, 7.85, 1.2],
      [-5.4, 4.7, 1.2]
    ],
    bed: ["bed-cocktail", n => (n >= 2 ? 0.08 + 0.025 * Math.min(n, 12) : 0.03)],
    extra: [["bed-night", () => 0.1]], // (more beds under the chatter)
    music: { name: "cocktail-jazz", level: 0.09, people: 2 },
    shots: [
      { groups: ["clink"], every: [6, 15], people: 2, at: "person", vol: 0.3 },
      { groups: ["shaker"], every: [30, 70], people: 2, at: [0.2, 4.9, 1.1], vol: 0.3 }
    ]
  },
  cafe: {
    box: [6.5, 11.5, -10, -4.4, -0.6, 3.3],
    open: 2.5,
    bed: ["bed-cafe", n => (n >= 1 ? 0.1 + 0.02 * Math.min(n, 8) : 0.05)],
    music: { name: "cafe-accordion", level: 0.09, people: 1 },
    shots: [
      { groups: ["espresso"], every: [40, 90], at: [8.6, -4.7, 1.05], vol: 0.3 },
      { groups: ["cutlery", "clink"], every: [6, 15], people: 1, at: "person", vol: 0.25 }
    ]
  },
  tub: {
    box: [-12, -7, -10, -4.4, -0.6, 3.3],
    open: 2.5,
    bed: ["bed-tub", () => 0.22]
  },
  bedSW: {
    box: [-11.5, -6, -5.5, -1.4, 3.4, 7.5],
    open: 0.8,
    music: { name: "bedroom-rnb", level: 0.07, couple: "sw" }
  },
  bedNE: {
    box: [6.0, 11.4, 4.1, 9.9, 3.4, 7.5],
    open: 0.8,
    music: { name: "bedroom-rnb", level: 0.07, couple: "ne" }
  }
};

// The mime's props on the café prop rig (DinCafeProps_<name>), by kind of act.
const PROPS = {
  fire: /^(Torch|Flame|FireBall|PoiF|Spk)/,
  juggle: /^(Club|Ball|Ring|Knife|TKnife|Plate|Hoop|Giant|YoYo|MBall|ZBall|PoiL$|PoiR$|PoiC)/,
  reveal: /^(Dove\d$|Canary$|Rabbit$|Bunny$|Bouquet$|Fountain$|Bfly$)/,
  balloon: /^(LBal|BS[a-z])/
};
const COUPLES = {
  ne: { tags: ["BedF", "BedM"], zone: "bedNE" },
  // (her first; the SW pair dressed are the café lady and the mime)
  sw: { tags: ["DinNudeA", "DinNudeM"], dressed: ["DinCafA", "DinMime"], zone: "bedSW" }
};
// Where the volume cards stand: in front of these seats.
const CARD_SEATS = ["Seat_D3", "Seat_D7", "Seat_RovA3", "Seat_CkE1", "Seat_E1", "Seat_HotTub_N1"];

const R = (a, b) => a + (b - a) * Math.random();
const pickOne = list => list[Math.floor(Math.random() * list.length)];
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);

function inBox(b, p) {
  return p.x >= b[0] && p.x <= b[1] && p.y >= b[2] && p.y <= b[3] && p.z >= b[4] && p.z <= b[5];
}
function boxDist(b, p) {
  const dx = Math.max(b[0] - p.x, 0, p.x - b[1]);
  const dy = Math.max(b[2] - p.y, 0, p.y - b[3]);
  const dz = Math.max(b[4] - p.z, 0, p.z - b[5]);
  return Math.hypot(dx, dy, dz);
}

AFRAME.registerSystem("lounge-ambience", {
  init() {
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.ready = false;
    this.buffers = new Map();
    this.loading = new Set();
    this.voices = 0;
    this.stats = { zone: "", voices: 0, beds: 0 };
  },

  remove() {
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.teardown();
  },

  teardown() {
    for (const z of Object.values(this.zones || {})) this.stopBeds(z);
    for (const c of this.cards || []) c.remove();
    this.cards = [];
    this.ready = false;
  },

  onSceneLoaded() {
    this.teardown();
    const envRoot = document.querySelector("#environment-root");
    if (!envRoot) return;
    this.env = envRoot.object3D;
    this.env.updateMatrixWorld(true);
    this.envM = this.env.matrixWorld.clone();
    this.envInv = this.envM.clone().invert();
    const named = {};
    this.env.traverse(o => {
      if (o.name) named[o.name] = o;
    });
    this.named = named;
    // The figures: everyone with a Hips bone (not the duvets, the ball, the props rig).
    this.figs = Object.keys(named)
      .filter(n => n.endsWith("_Hips"))
      .map(n => n.slice(0, -5))
      .map(tag => ({
        tag,
        hips: named[`${tag}_Hips`],
        root: named[`${tag}_Root`],
        head: named[`${tag}_Head`],
        handL: named[`${tag}_Hand.L`],
        handR: named[`${tag}_Hand.R`],
        pos: new THREE.Vector3(),
        zone: null,
        visible: true,
        clap: { open: true, at: 0 }
      }));
    this.byTag = Object.fromEntries(this.figs.map(f => [f.tag, f]));
    this.props = [];
    this.kit = []; // the rest of his props: one appearing on stage is a surprise
    this.cues = [];
    for (const [name, o] of Object.entries(named)) {
      if (!name.startsWith("DinCafeProps_")) continue;
      const short = name.slice(13);
      const kind = Object.keys(PROPS).find(k => PROPS[k].test(short));
      if (kind) this.props.push({ o, short, kind, pos: new THREE.Vector3(), prev: null, vis: false, cool: 0 });
      else if (short.startsWith("Sfx"))
        this.cues.push({ o, name: short.slice(3), vis: false, next: 0, pos: new THREE.Vector3() });
      else if (short !== "Show") this.kit.push({ o, vis: false });
    }
    this.watching = false;
    this.swellUntil = 0;
    this.surpriseAt = 0;
    this.showBone = named.DinCafeProps_Show || null;
    this.ball = named.TubBall_Ball || null;
    this.zones = {};
    for (const [name, z] of Object.entries(ZONES)) {
      this.zones[name] = { name, ...z, presence: 0, heard: 0, people: [], beds: null, quietSince: 0, next: {} };
    }
    this.couples = Object.fromEntries(
      Object.entries(COUPLES).map(([k, c]) => [
        k,
        {
          ...c,
          key: k,
          figs: c.tags.map(t => this.byTag[t]),
          dressed: (c.dressed || []).map(t => this.byTag[t]),
          used: {},
          last: 0,
          start: 0,
          vocalFree: 0,
          done: true
        }
      ])
    );
    for (const f of this.figs) f.track = { prevZ: null, vz: 0, hi: -Infinity, lo: Infinity };
    this.later = [];
    this.nextSample = 0;
    this.nextCount = 0;
    this.listener = new THREE.Vector3();
    this.lastShow = 0;
    this.showOnAt = 0;
    this.buildCards();
    this.ready = true;
  },

  // Blender (x, y, z) <-> the scene: the env root maps Blender (x, y, z) to (x, z, -y).
  toWorld(b, out = new THREE.Vector3()) {
    return out.set(b[0], b[2], -b[1]).applyMatrix4(this.envM);
  },
  toBlender(w, out = new THREE.Vector3()) {
    out.copy(w).applyMatrix4(this.envInv);
    return out.set(out.x, -out.z, out.y);
  },
  bonePos(o, out) {
    o.updateWorldMatrix(true, false);
    out.setFromMatrixPosition(o.matrixWorld);
    return out;
  },
  boneScale(o) {
    return v2.setFromMatrixScale(o.matrixWorld).x;
  },

  // ---- audio -----------------------------------------------------------------

  setupAudio() {
    const scene = this.el.sceneEl;
    const audioSystem = scene.systems["hubs-systems"]?.audioSystem;
    if (!audioSystem || !scene.audioListener) return false;
    const ctx = THREE.AudioContext.getContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    // (into Hubs' sound-effects mix: the Mac TV client, which mutes that, stays silent)
    audioSystem.addAudio({ sourceType: SourceType.SFX, node: this.master });
    for (const z of Object.values(this.zones)) {
      z.gain = ctx.createGain();
      z.gain.gain.value = 0;
      z.filter = ctx.createBiquadFilter();
      z.filter.type = "lowpass";
      z.filter.frequency.value = 18000;
      z.gain.connect(z.filter);
      z.filter.connect(this.master);
    }
    return true;
  },

  namesFor(z) {
    const out = new Set();
    if (z.bed) out.add(z.bed[0]);
    for (const [n] of z.extra || []) out.add(n);
    if (z.music && URLS[z.music.name]) out.add(z.music.name);
    for (const s of z.shots || []) for (const g of s.groups) for (const n of GROUPS[g] || []) out.add(n);
    if (z.name === "rovers" || z.name === "cafe" || z.name === "tub" || z.name === "dining" || z.name === "cocktail")
      for (const g of [
        "whoosh",
        "fire",
        "cymbal",
        "ooh",
        "gasp",
        "cluck",
        "roar",
        "whip",
        "snap",
        "squeak",
        "pop",
        "clap",
        "applause",
        "drumroll",
        "splash"
      ])
        for (const n of GROUPS[g] || []) out.add(n);
    for (const c of Object.values(this.couples))
      if (c.zone === z.name) for (const n of Object.keys(URLS)) if (n.startsWith(`talk-${c.key}-`)) out.add(n);
    return out;
  },

  load(names) {
    for (const n of names) {
      if (this.buffers.has(n) || this.loading.has(n) || !URLS[n]) continue;
      this.loading.add(n);
      fetch(URLS[n])
        .then(r => r.arrayBuffer())
        .then(d => this.ctx.decodeAudioData(d))
        .then(b => this.buffers.set(n, b))
        .catch(() => {})
        .finally(() => this.loading.delete(n));
    }
  },

  startBeds(z) {
    if (z.beds) return;
    const list = [];
    if (z.bed) list.push([z.bed[0], z.bed[1]]);
    for (const b of z.extra || []) list.push(b);
    if (z.music && URLS[z.music.name]) list.push([z.music.name, () => 0, z.music]);
    if (!list.every(([n]) => this.buffers.has(n))) return;
    z.beds = list.map(([name, level, music]) => {
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers.get(name);
      src.loop = true;
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      let out = gain;
      if (music?.at) {
        // the piano: from where it stands
        const pan = this.panner(music.at, 3);
        gain.connect(pan);
        out = pan;
      }
      src.connect(gain);
      out.connect(z.gain);
      src.start(0, R(0, src.buffer.duration));
      return { src, gain, level, music };
    });
  },

  stopBeds(z) {
    for (const b of z.beds || []) {
      try {
        b.src.stop();
      } catch {
        /* already stopped */
      }
      b.src.disconnect();
    }
    z.beds = null;
  },

  panner(b, ref = 2) {
    const pan = this.ctx.createPanner();
    pan.panningModel = "equalpower";
    pan.distanceModel = "inverse";
    pan.refDistance = ref;
    pan.rolloffFactor = 1.3;
    pan.maxDistance = 40;
    const w = Array.isArray(b) ? this.toWorld(b, v1) : b;
    if (pan.positionX) {
      pan.positionX.value = w.x;
      pan.positionY.value = w.y;
      pan.positionZ.value = w.z;
    } else pan.setPosition(w.x, w.y, w.z);
    return pan;
  },

  // A one-shot from a group in zone z (or that one clip, as it is), at a Blender
  // point or a world point; with cut, faded out after that many seconds.
  play(z, group, at, vol = 0.4, ref = 2, onLength, cut = 0) {
    if (!z.gain || z.heard < 0.02 || this.voices >= MAX_VOICES) return 0;
    if (z.voicesOnly && !VOICES.has(group)) return 0;
    const names = (URLS[group] ? [group] : GROUPS[group] || []).filter(n => this.buffers.has(n));
    if (!names.length) return 0;
    const buf = this.buffers.get(pickOne(names));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = URLS[group] ? 1 : R(0.94, 1.06);
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain);
    if (at) {
      const pan = this.panner(at, ref);
      gain.connect(pan);
      pan.connect(z.gain);
    } else gain.connect(z.gain);
    this.voices++;
    src.onended = () => {
      this.voices--;
      src.disconnect();
      gain.disconnect();
    };
    src.start();
    let len = buf.duration / src.playbackRate.value;
    if (cut && len > cut) {
      const t = this.ctx.currentTime + cut;
      gain.gain.setValueAtTime(vol, t - 0.15);
      gain.gain.linearRampToValueAtTime(0, t);
      src.stop(t + 0.02);
      len = cut;
    }
    if (onLength) onLength(len);
    return len;
  },

  // One of the mime's sounds on his rounds: low and short.
  road(z, group, at, vol, ref = 2) {
    return this.play(z, group, at, vol * ROAD, ref, null, CUT[group] || 1);
  },

  // ---- per frame -----------------------------------------------------------------

  tick(time, dtMs) {
    if (!this.ready) return;
    if (!this.ctx && !this.setupAudio()) return;
    const now = time / 1000;
    this.now = now;
    const dt = Math.min(0.1, (dtMs || 16) / 1000);
    for (let k = this.later.length - 1; k >= 0; k--) {
      if (now >= this.later[k].at) {
        const fn = this.later[k].fn;
        this.later.splice(k, 1);
        fn();
      }
    }
    if (now >= this.nextSample) {
      this.nextSample = now + SAMPLE;
      try {
        this.sample(now);
      } catch (e) {
        // (keep the room sound going; the telemetry logs the first of each)
        if (!this.failed) console.error("lounge-ambience", e);
        this.failed = true;
      }
    }
    // per frame, only where you are: claps and the beds' rhythm
    const here = this.here;
    if (here) {
      this.claps(now, here);
      for (const c of Object.values(this.couples)) if (c.zone === here.name) this.rhythm(now, dt, c);
    }
  },

  sample(now) {
    const pov = document.getElementById("avatar-pov-node")?.object3D;
    if (!pov) return;
    this.toBlender(pov.getWorldPosition(v1), this.listener);
    const L = this.listener;
    // who's where (twice a second)
    if (now >= this.nextCount) {
      this.nextCount = now + 0.5;
      for (const z of Object.values(this.zones)) z.people = [];
      for (const f of this.figs) {
        if (f.root) f.root.updateWorldMatrix(true, false);
        f.visible = !f.root || this.boneScale(f.root) > 0.3;
        if (!f.visible) {
          f.zone = null;
          continue;
        }
        this.toBlender(this.bonePos(f.hips, v1), f.pos);
        f.zone = Object.values(this.zones).find(z => inBox(z.box, f.pos)) || null;
        if (f.zone) f.zone.people.push(f);
      }
    }
    // how much of each zone you hear, muffled from outside
    const prefs = window.APP?.store?.state?.preferences || {};
    const volume = (prefs.loungeAmbienceVolume ?? DEFAULT_VOLUME) / 100;
    const t = this.ctx.currentTime;
    this.here = null;
    let beds = 0;
    for (const z of Object.values(this.zones)) {
      const inside = inBox(z.box, L);
      let heard = 0;
      if (inside) {
        heard = 1;
        this.here = z;
      } else if (z.open) heard = Math.max(0, 1 - boxDist(z.box, L) / z.open) * 0.6;
      else
        for (const d of z.doors || [])
          if (Math.abs(L.z - d[2]) < 2.5)
            heard = Math.max(heard, Math.max(0, 1 - Math.hypot(L.x - d[0], L.y - d[1]) / 3) * 0.5);
      z.heard = heard;
      if (heard > 0 || boxDist(z.box, L) < 12) this.load(this.namesFor(z));
      z.gain.gain.setTargetAtTime(heard, t, 0.45);
      z.filter.frequency.setTargetAtTime(inside ? 18000 : 700, t, 0.3);
      if (heard > 0.005) {
        z.quietSince = now;
        this.startBeds(z);
      } else if (z.beds && now - z.quietSince > 4) this.stopBeds(z);
      if (z.beds) {
        beds++;
        const n = z.people.length;
        // (scripted: every word in the room is the mystery's, no chatter bed under it)
        const hush = z.scripted
          ? 0
          : z.name === "rovers" && this.watching
            ? now < this.swellUntil
              ? SWELL
              : MURMUR
            : z.hushed
              ? MURMUR
              : 1;
        for (const b of z.beds) {
          let level = b.level(n) * hush;
          if (b.music) level = this.musicLevel(z, b.music);
          b.gain.gain.setTargetAtTime(level, t, hush < 1 ? 0.35 : 0.8);
        }
        if (heard > 0.02 && !(z.name === "rovers" && this.watching) && !z.hushed) this.shots(now, z);
      }
    }
    // dip under voices
    let talk = 0;
    for (const el of document.querySelectorAll("[networked-audio-analyser]")) {
      talk = Math.max(talk, el.components["networked-audio-analyser"]?.volume || 0);
    }
    const duck = talk > 0.04 ? 0.45 : 1;
    this.master.gain.setTargetAtTime(volume * duck, t, duck < 1 ? 0.08 : 0.6);
    this.mime(now);
    this.trystTalk(now);
    this.extras(now);
    this.stats = { zone: this.here ? this.here.name : "", voices: this.voices, beds };
  },

  musicLevel(z, m) {
    if (m.couple) return this.couples[m.couple].figs.some(f => f && f.visible) ? m.level : 0;
    if (m.who) {
      const f = this.byTag[m.who];
      return f && f.visible && f.pos.distanceTo(v2.set(m.at[0], m.at[1], m.at[2])) < 1.6
        ? m.level * (this.showDim > 0.3 ? 0.25 : 1)
        : 0;
    }
    return z.people.length >= (m.people || 0) ? m.level : 0;
  },

  // Random sounds of the room.
  shots(now, z) {
    (z.shots || []).forEach((s, k) => {
      if (z.next[k] === undefined) z.next[k] = now + R(1, s.every[1]);
      if (now < z.next[k]) return;
      z.next[k] = now + R(s.every[0], s.every[1]);
      if (s.people && z.people.length < s.people) return;
      if (s.who && !z.people.some(f => f.tag.startsWith(s.who))) return;
      let at = s.at;
      if (at === "person" || at === "hands") {
        if (!z.people.length) return;
        const f = pickOne(z.people);
        const bone = at === "hands" ? f.handR || f.hips : f.head || f.hips;
        at = this.bonePos(bone, new THREE.Vector3());
      }
      this.play(z, pickOne(s.groups), at, s.vol, s.ref || 2);
    });
  },

  // ---- the mime ------------------------------------------------------------------

  mime(now) {
    const show = this.showBone;
    this.showDim = show ? show.scale.x : 0;
    const rov = this.zones.rovers;
    // the finale: applause as the lights come up
    if (this.showDim > 0.3 && !this.showOnAt) {
      this.showOnAt = now;
    } else if (this.showDim < 0.1 && this.showOnAt) {
      if (now - this.showOnAt > 30) this.play(rov, "applause", null, 0.45);
      this.showOnAt = 0;
    }
    const mime = this.byTag.DinMime;
    const z = mime?.zone;
    // the dining room watching him: hushed while he's in there and through the
    // applause as he goes (a walk through doesn't get one)
    const din = this.zones.dining;
    if (z === din) {
      din.showFrom = din.showFrom || now;
      din.hushUntil = now + 1.5;
    } else if (din.showFrom) {
      if (now - din.showFrom > 15 && now > (this.applauseUntil || 0)) {
        const len = this.road(din, "applause", null, 0.45);
        this.applauseUntil = now + Math.max(3, len);
        din.hushUntil = now + Math.max(1.5, len);
      }
      din.showFrom = 0;
    }
    din.hushed = now < (din.hushUntil || 0);
    // the pub watching him on stage: down to a murmur, now and then an "ooh"
    const p0 = mime?.pos;
    const onStage = z === rov && p0 && p0.x > STAGE[0] && p0.x < STAGE[1] && p0.y > STAGE[2] && p0.y < STAGE[3];
    const watching = this.showDim > 0.3 || !!onStage;
    if (watching && !this.watching) this.surpriseAt = now + R(12, 25);
    this.watching = watching;
    if (watching && this.here === rov && now > this.surpriseAt) this.surprise(now, R(25, 45));
    if (this.here === rov && this.cues.length) {
      this.named.Fig_DinCafeProps?.updateWorldMatrix(true, true);
      this.runCues(now, rov);
    }
    if (!z || z !== this.here) {
      for (const p of this.props) p.prev = null;
      this.kitPrimed = false;
      return;
    }
    const arm = this.named.Fig_DinCafeProps;
    arm?.updateWorldMatrix(true, true);
    // something new in his hands on stage: the room reacts
    let appeared = false;
    for (const k of this.kit) {
      const vis = v2.setFromMatrixScale(k.o.matrixWorld).x > 0.2;
      if (vis && !k.vis) appeared = true;
      k.vis = vis;
    }
    if (appeared && onStage && this.kitPrimed) this.surprise(now, R(20, 40));
    this.kitPrimed = true;
    let whooshes = 0;
    for (const p of this.props) {
      const s = v2.setFromMatrixScale(p.o.matrixWorld).x;
      const vis = s > 0.2;
      p.pos.setFromMatrixPosition(p.o.matrixWorld);
      const speed = p.prev && vis ? p.pos.distanceTo(p.prev) / SAMPLE : 0;
      p.prev = vis ? (p.prev || new THREE.Vector3()).copy(p.pos) : null;
      if (p.kind === "reveal" && vis && !p.vis) {
        this.road(z, "cymbal", p.pos, 0.35);
        if (this.watching) this.surprise(now + 0.3, R(20, 40), true);
        else {
          this.later.push({ at: now + 0.3, fn: () => this.road(z, "ooh", null, 0.35) });
        }
      }
      if (p.kind === "fire" && vis && !p.vis && onStage) this.surprise(now, R(20, 40));
      if ((p.kind === "fire" || p.kind === "juggle") && speed > 3.5 && now > p.cool && whooshes < 2) {
        p.cool = now + 0.35;
        whooshes++;
        this.road(z, p.kind === "fire" ? "fire" : "whoosh", p.pos, 0.3, 1.5);
      }
      if (p.kind === "balloon" && vis && speed > 0.15 && now > p.cool) {
        p.cool = now + R(0.7, 1.4);
        this.road(z, "squeak", p.pos, 0.25, 1.2);
      }
      p.vis = vis;
    }
  },

  runCues(now, z) {
    for (const c of this.cues) {
      const vis = v2.setFromMatrixScale(c.o.matrixWorld).x > 0.2;
      const on = vis && !c.vis;
      if (!vis && c.vis && c.name === "Roll") this.play(z, "cymbal", c.pos.clone(), 0.4, 2);
      c.vis = vis;
      if (!vis) continue;
      c.pos.setFromMatrixPosition(c.o.matrixWorld);
      if (c.name === "Cluck") {
        if (now >= c.next) {
          c.next = now + R(0.6, 1.4);
          this.play(z, "cluck", c.pos.clone(), 0.55, 2);
        }
      } else if (!on) continue;
      else if (c.name === "Roll") this.play(z, "drumroll", c.pos.clone(), 0.4, 2);
      else if (c.name === "Wow") this.surprise(now, R(20, 40), true);
      else if (CUE_GROUP[c.name]) this.play(z, CUE_GROUP[c.name], c.pos.clone(), 0.5, 2);
    }
  },

  // The watching pub surprised: a gasp from the room and the murmur swells for
  // a few seconds; the next unprompted one in `gap` seconds.
  surprise(at, gap, force = false) {
    if (!force && at < (this.surpriseCool || 0)) return;
    const rov = this.zones.rovers;
    this.surpriseCool = at + 6;
    this.surpriseAt = at + gap;
    this.swellUntil = at + R(2.5, 4);
    this.later.push({ at, fn: () => this.play(rov, "gasp", null, R(0.35, 0.5)) });
  },

  // Guests' hands meeting: a clap from there; enough of them, a round of applause.
  claps(now, z) {
    let clappers = 0;
    // (for him on his rounds, low and short; the stage and the finale as they are)
    const roving = this.byTag.DinMime?.zone === z && !(z.name === "rovers" && this.watching);
    const sound = (g, at, vol, ref) => (roving ? this.road(z, g, at, vol, ref) : this.play(z, g, at, vol, ref));
    for (const f of z.people) {
      if (!f.handL || !f.handR || f.tag === "DinMime") continue;
      const d = this.bonePos(f.handL, v1).distanceTo(this.bonePos(f.handR, v2));
      const c = f.clap;
      if (d > 0.16) c.open = true;
      else if (d < 0.09 && c.open) {
        c.open = false;
        c.last = now;
        if (this.voices < 6) sound("clap", v1.lerp(v2, 0.5).clone(), 0.25, 1.2);
      }
      if (now - (c.last || -9) < 1.5) clappers++;
    }
    if (clappers >= 4 && now > (this.applauseUntil || 0)) {
      const len = sound("applause", null, 0.4);
      this.applauseUntil = now + Math.max(3, len);
    }
  },

  // ---- the couples -----------------------------------------------------------------

  rhythm(now, dt, c) {
    const figs = c.figs.filter(f => f && f.visible);
    if (!figs.length) return;
    let stroke = false;
    for (const f of figs) {
      const zNow = this.toBlender(this.bonePos(f.hips, v1), v2).z;
      const tr = f.track;
      if (tr.prevZ !== null) {
        const vz = (zNow - tr.prevZ) / Math.max(dt, 0.005);
        tr.hi = Math.max(tr.hi, zNow);
        tr.lo = Math.min(tr.lo, zNow);
        // the top of a stroke: rising, then falling, after a real swing
        if (tr.vz > 0.02 && vz <= 0 && tr.hi - tr.lo > 0.012) {
          stroke = true;
          tr.hi = zNow;
          tr.lo = zNow;
        }
        tr.vz = vz;
      }
      tr.prevZ = zNow;
    }
    if (stroke && now - c.last > 0.3) {
      if (now - c.last > 2.5) {
        c.start = now;
        c.done = false;
      }
      c.last = now;
      const I = Math.min(1, (now - c.start) / 90);
      if (now > c.vocalFree && Math.random() < 0.25 + 0.35 * I)
        this.talk(now, c, I > 0.5 ? "hot" : "warm", I > 0.5 ? [3, 7] : [6, 12], 0.55 + 0.25 * I);
    } else if (!c.done && now - c.last > 2.5) {
      // it stopped: after a long run, a finish, and a moment later a word or two
      c.done = true;
      if (c.last - c.start > 45) {
        const end = this.talk(Math.max(now, c.talkEnd || 0), c, "finish", [4, 7], 0.8);
        this.later.push({ at: end + R(2.5, 5), fn: () => this.talk(this.now, c, "after", [8, 14]) });
      }
    }
  },

  // One exchange from a set in bed-talk.json: each line from whoever says it,
  // a beat between them, then quiet for `pause` seconds. Returns when it ends.
  talk(now, c, set, pause = [6, 12], vol = 0.6, gap = [0.5, 1.4]) {
    const z = this.zones[c.zone];
    const list = TALK.sets[set];
    if (!list || z.heard < 0.02) return now;
    let i;
    if (set === "smoke")
      i = c.smoked++; // (in order, over the cigarette)
    else {
      // not one of the last few heard
      const used = (c.used[set] = c.used[set] || []);
      const free = list.map((_, k) => k).filter(k => !used.includes(k));
      i = pickOne(free.length ? free : list.map((_, k) => k));
      used.push(i);
      if (used.length > list.length / 2) used.shift();
    }
    if (i >= list.length) return now;
    const names = list[i].map((_, j) => `talk-${c.key}-${set}-${i}-${j}`);
    if (!names.every(n => this.buffers.has(n))) return now;
    let at = now;
    list[i].forEach(([who], j) => {
      this.later.push({ at, fn: () => this.play(z, names[j], this.mouth(c, who), vol, 1.5) });
      at += this.buffers.get(names[j]).duration + R(gap[0], gap[1]);
    });
    c.talkEnd = at;
    c.vocalFree = at + R(pause[0], pause[1]);
    return at;
  },

  // Where her (f) or his (m) voice comes from: whichever of them is showing.
  mouth(c, who) {
    const k = who === "f" ? 0 : 1;
    const f = [c.figs[k], c.dressed[k]].find(f => f && f.visible);
    return f ? this.bonePos(f.head || f.hips, new THREE.Vector3()) : null;
  },

  // The SW tryst's words outside bed: as she comes in to him, over the
  // cigarette he conjures, and as they get dressed to go down.
  trystTalk(now) {
    const c = this.couples.sw;
    const room = this.zones[c.zone];
    const [her, him] = c.dressed;
    const met = !!her && her.zone === room && him?.zone === room;
    if (met && !c.met) this.talk(now, c, "enter", [6, 10], 0.6, [0.3, 0.7]);
    c.met = met;
    const cig = this.named.DinCafeProps_Cig;
    if (!cig || !c.figs[0]?.visible) {
      c.smoking = false;
      return;
    }
    cig.updateWorldMatrix(true, false);
    if (this.boneScale(cig) > 0.2) {
      if (!c.smoking) {
        c.smoking = true;
        c.smoked = 0;
        c.nextSmoke = now + 3.5;
      }
      if (now > c.nextSmoke && now > c.vocalFree) c.nextSmoke = this.talk(now, c, "smoke", [4, 8]) + R(10, 18);
    } else if (c.smoking) {
      c.smoking = false;
      this.later.push({ at: now + 5, fn: () => this.talk(this.now, c, "leave", [10, 15]) });
    }
  },

  // The beach ball in the tub.
  extras(now) {
    if (this.ball && this.zones.tub.heard > 0.02) {
      const z = this.toBlender(this.bonePos(this.ball, v1), v2).z;
      const vz = this.ballZ !== undefined ? (z - this.ballZ) / SAMPLE : 0;
      if (vz < -1.2 && z < 0.9 && z > 0.3 && now > (this.splashAt || 0)) {
        this.splashAt = now + 1;
        this.play(this.zones.tub, "splash", this.bonePos(this.ball, new THREE.Vector3()), 0.4, 1.5);
      }
      this.ballZ = z;
    }
  },

  // ---- the volume cards ------------------------------------------------------------

  volume() {
    return window.APP?.store?.state?.preferences?.loungeAmbienceVolume ?? DEFAULT_VOLUME;
  },
  setVolume(v) {
    window.APP?.store?.update({ preferences: { loungeAmbienceVolume: Math.max(0, Math.min(100, v)) } });
    for (const c of this.cardLabels || []) c.draw([this.volume() ? `ROOM SOUND ${this.volume()}%` : "ROOM SOUND OFF"]);
  },
  buildCards() {
    this.cards = [];
    this.cardLabels = [];
    const scene = this.el.sceneEl;
    for (const name of CARD_SEATS) {
      const seat = this.named[name];
      if (!seat) continue;
      const p = seat.getWorldPosition(new THREE.Vector3());
      // (the seat markers face +z: checked against the tables they sit at)
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(seat.getWorldQuaternion(new THREE.Quaternion()));
      fwd.y = 0;
      if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1);
      fwd.normalize();
      // a little card on the table in front of the seat, facing it
      const anchor = p.clone().addScaledVector(fwd, 0.55);
      anchor.y = Math.max(p.y + 0.42, this.toWorld([0, 0, 0.85], v1).y); // (above the tub's water too)
      const toSeat = p.clone().sub(anchor);
      const rot = new THREE.Quaternion().setFromAxisAngle(Y, Math.atan2(toSeat.x, toSeat.z));
      const add = (x, w, lines, fn) => {
        const l = label(scene, anchor, rot, x, 0, w, 0.07, lines, fn);
        l.el.object3D.position.copy(new THREE.Vector3(x, 0, 0).applyQuaternion(rot).add(anchor));
        l.el.object3D.matrixNeedsUpdate = true;
        this.cards.push(l);
        return l;
      };
      add(-0.17, 0.07, ["-"], () => this.setVolume(this.volume() - 20));
      this.cardLabels.push(add(0, 0.24, [this.volume() ? `ROOM SOUND ${this.volume()}%` : "ROOM SOUND OFF"]));
      add(0.17, 0.07, ["+"], () => this.setVolume(this.volume() + 20));
    }
  }
});
