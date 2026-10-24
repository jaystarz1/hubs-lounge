import * as THREE from "three";
import { paths } from "../systems/userinput/paths";
import { getServerTime } from "../phoenix-adapter";
import { SourceType } from "../components/audio-params";
import { label } from "./tv-controls";
import URL_QUACK from "../assets/sfx/quack.mp3";
import {
  STAND,
  KINDS,
  standAt,
  launchPos,
  liveLaunches,
  RangeFrame,
  shotHits,
  gunPose,
  GUN_TYPES,
  gunMesh,
  targetMesh,
  DEBRIS,
  makeSounds
} from "./skeet-range";
import {
  WAVE,
  BREAK,
  LEVEL_GAP,
  SCENARIOS,
  SHOW_KINDS,
  showWave,
  liveShow,
  findShowLaunch,
  tonight,
  levelsOf,
  levelOf,
  levelGoal,
  campaignOf
} from "./shoots";
import { buildWorld, artMesh, makeAmbience } from "./shoots-art";
import { MUSIC } from "./range-music";
import { PlateField, warmPlates, plateCutout } from "./plates";

Object.assign(KINDS, SHOW_KINDS);

// The shooting range off the Rovers' roof terrace (Jay, 2026-10-18), facing
// south over the city. On the south parapet's coping lie two over-and-under
// shotguns (in front of the two stands), two M4-style carbines and two pairs
// of pistols. In VR, squeeze grip with a hand on one to pick it up; it stays
// with you (no need to keep squeezing). A shotgun or carbine takes both
// hands: it lies along the line from your rear hand to your front hand, so
// you aim it with both, and whichever hand is nearer your face is the trigger
// hand (the other is just the forend), so left- and right-handers both work.
// The shotgun is one pull, one shot; the carbine fires full auto while the
// trigger is held. A pistol takes one hand and points where that controller
// points, so you can have one in each hand, each on its own trigger. No
// reloading. Squeeze grip again, anywhere, to put a gun down: it glides back
// to its place on the wall (Jay, 2026-10-20: laying a shotgun or carbine back
// in its exact place was so hard people ran off the roof to drop it). They
// also go back by themselves if you leave the roof or take the headset off.
//
// The old pistol alley and rifle line (range-gallery.js) are gone (Jay,
// 2026-10-21: they showed until a world came up, then vanished); the only
// standing targets are each world's knockdown plates (plates.js).
//
// While anyone has a gun up, the range runs: one stand (crossers, ducks,
// teal, doubles, a duck flush...) every STAND seconds, with surprises thrown
// in (a golden goose, a rubber chicken, a watermelon, a flying saucer, the
// mime's hat). Clays 25, ducks and the golden goose 5, other surprises 25. The board on the east parapet
// keeps everyone's score; NEW GAME zeroes it for the room.
//
// The targets are a fixed programme on the shared clock (skeet-range.js), so
// every headset sees the same clays without sending them. Over the NAF data
// channel ("lounge-skeet") go: who holds which gun and where (10 Hz), shots
// (flash and bang for the others), hits (the target breaks for everyone) and
// each player's score. Each player's own client decides their hits.
//
// The skyline is a 21 m cylinder: clays thrown past it would vanish behind
// the buildings, so while you are on the roof the skyline and the sky dome
// draw first without writing depth (like a skybox) and the clays fly over the
// city in front of them.
const DATA_TYPE = "lounge-skeet";

// Layout in Blender coordinates (lounge-assets build-penthouse.py: the Rovers'
// roof deck is at z 3.53, the south parapet's coping top at 4.61, centred on
// y -16.725; the east parapet runs along x 6.75..7.0).
const DECK = 3.53;
const COPING = 4.61;
const ORIGIN = [2.9, -16.0]; // between the two stands, on the deck
const RACK_Y = -16.725;
// Each gun lies on its side on the coping, muzzle east: its type and the x of
// its grip (clear of the planters at the corners, x -3.65..-3.05 and 6.05..6.65).
const GUNS = [
  ["shotgun", 1.55],
  ["shotgun", 3.55],
  ["rifle", -2.75],
  ["rifle", -1.7],
  ["pistol", -0.75],
  ["pistol", -0.4],
  ["pistol", 4.95],
  ["pistol", 5.3]
];
// Per type: back end (gun frame), half its thickness lying down, its length.
const SHAPE = {
  shotgun: { back: new THREE.Vector3(0, -0.05, 0.36), lie: 0.026, len: 1.32 },
  rifle: { back: new THREE.Vector3(0, 0.01, 0.33), lie: 0.026, len: 1.1 },
  pistol: { back: new THREE.Vector3(0, -0.07, 0.03), lie: 0.016, len: 0.32 }
};
// The board stands on the east parapet (coping centre x 6.875), facing west.
const BOARD = { x: 6.875, y: -14.25, z: COPING + 1.15, w: 2.4, h: 1.5 };
const ROOF = { x1: -4.1, x2: 7.1, y1: -17.0, y2: -9.3, z1: 3.0, z2: 7.0 };
const BANNER = { u: 0, f: 16, h: 7.2, w: 10, hgt: 1.9 };
// The world picker on the north-east parapet, by the walkout (shoots.js).
const PICKER = { x: 4.95, y: -9.93, w: 2.15, h: 1.35 };
const PICK_NAMES = [
  ["CARNIVAL", "MON"],
  ["DUCK HUNT", "TUE"],
  ["DEER STALK", "WED"],
  ["BOAR CHARGE", "THU"],
  ["SPY NIGHT", "FRI"],
  ["SAFARI", "SAT"],
  ["HOSTAGE", "SUN"],
  ["WILD WEST", "VILLA'S TRAIL"]
];
const IDLE = 90; // s with no gun up before a featured round is dropped
const MUSIC_VOL = 0.2;
const AMB_VOL = 0.16;
const PENALTY = 10; // a charger that reaches the roof (a kind can say more)
const EARLY = 25; // the quick draw: shooting at him before DRAW!
const BAD_COLOUR = "#ff4a4a";

const SEND_EVERY = 0.1; // s, while holding
const TELL_EVERY = 4; // s, holders and scorers repeat themselves for late joiners
const STALE = 6; // s without word from a holder: the gun goes home
const GRAB_REACH = 0.4; // m, hand to the gun to pick it up
const POINT_REACH = 8; // m, or point the controller at it from up to this far
const POINT_SLACK = 0.15; // m, how near the pointing line must pass the gun
const PUT_DOWN_AFTER = 0.4; // s after picking up before grip puts it down again
const REAR_SWAP = 0.04; // m, hysteresis before the trigger hand changes
const HOME_TIME = 0.4; // s, gliding back to the wall
const POPUP_TIME = 1.3;
const FALL_TIME = 2.6;
const DEBRIS_TIME = 1.5;
// Sounds play on a fixed set of reused voices with cheap (equal-power)
// panning. Every shot used to add a new HRTF panner to the audio graph; two
// carbines on full auto (22 rounds a second plus the other headset's) choked
// the Quest's audio and froze the room for minutes (Jay, 2026-10-20). When all
// voices are busy the oldest is cut off.
const VOICES = 14;
const MAX_DEBRIS = 160;
const CATCH_UP = 0.25; // s, full auto never fires back rounds missed in a stall
const NO_FREEZE_AFTER = 2.5; // s after putting a gun down that A/X still can't freeze the room
const MY_COLOUR = "#ffd24a";
const OTHER_COLOURS = ["#6fe3ff", "#ff7fd0", "#9dff7a", "#ffa65a"];

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const q1 = new THREE.Quaternion();
const m1 = new THREE.Matrix4();
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, -1);

function dirty(o) {
  o.traverse(c => (c.matrixNeedsUpdate = true));
}

// Nearest distance from point p to the segment a-b.
function segDist(p, a, b) {
  v3.subVectors(b, a);
  const t = THREE.MathUtils.clamp(v1.subVectors(p, a).dot(v3) / v3.lengthSq(), 0, 1);
  return v1.copy(a).addScaledVector(v3, t).distanceTo(p);
}

function canvasPlane(w, h, px) {
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = Math.round((px * h) / w);
  const tex = new THREE.CanvasTexture(canvas);
  tex.encoding = THREE.sRGBEncoding;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  return { canvas, tex, mesh, ctx: canvas.getContext("2d") };
}

AFRAME.registerSystem("lounge-skeet", {
  init() {
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.subscribed = false;
    this.ready = false;
  },

  remove() {
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.clear();
  },

  clear() {
    if (this.hold) this.releaseAll(false);
    this.root?.parent?.remove(this.root);
    this.newGame?.remove();
    for (const l of this.picker || []) l.remove();
    this.picker = null;
    this.setWorld("");
    this.stopMusic();
    this.setView(false);
    this.setSkybox(false);
    this.dropVoices();
    this.ready = false;
  },

  onSceneLoaded() {
    this.clear();
    const envRoot = document.querySelector("#environment-root");
    if (!envRoot) return;
    const env = envRoot.object3D;
    env.updateMatrices();
    this.envM = env.matrixWorld.clone();
    this.envInv = this.envM.clone().invert();
    const B = (x, y, z) => new THREE.Vector3(x, z, -y).applyMatrix4(this.envM);
    const BD = (x, y, z) => new THREE.Vector3(x, z, -y).transformDirection(this.envM);
    this.B = B;
    // Facing south your right hand is west.
    this.frame = new RangeFrame(B(ORIGIN[0], ORIGIN[1], DECK), BD(-1, 0, 0), BD(0, -1, 0), BD(0, 0, 1));
    this.root = new THREE.Group();
    this.root.name = "LoungeSkeet";
    this.el.sceneEl.object3D.add(this.root);

    this.sky = [];
    env.traverse(o => {
      if (o.isMesh && /^View(Pano|Sky)/.test(o.name))
        this.sky.push({ o, order: o.renderOrder, depthWrite: o.material.depthWrite });
    });
    this.skybox = false;

    // The guns, each on a strip of green baize on the coping.
    const baize = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x24502e).convertSRGBToLinear(),
      roughness: 0.95
    });
    this.guns = GUNS.map(([type, x], i) => {
      const y = RACK_Y;
      const shape = SHAPE[type];
      const mesh = gunMesh(type);
      const rackPos = B(x, y, COPING + shape.lie);
      // Lying on its left side: muzzle east, the top of the gun towards the stand.
      const fwd = BD(1, 0, 0);
      const top = BD(0, 1, 0);
      const zAxis = fwd.clone().negate();
      const xAxis = new THREE.Vector3().crossVectors(top, zAxis);
      const rackQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, top, zAxis));
      mesh.position.copy(rackPos);
      mesh.quaternion.copy(rackQuat);
      dirty(mesh);
      this.root.add(mesh);
      const mat = new THREE.Mesh(new THREE.BoxGeometry(shape.len, 0.008, 0.22), baize);
      mat.position.copy(B(x + shape.len / 2 - shape.back.z - 0.02, y, COPING + 0.004));
      mat.quaternion.setFromUnitVectors(Y, BD(0, 0, 1));
      dirty(mat);
      this.root.add(mat);
      return {
        i,
        type,
        spec: GUN_TYPES[type],
        shape,
        mesh,
        rackPos,
        rackQuat,
        holder: null, // client id, ours or someone else's
        name: "",
        heard: 0,
        target: null, // { p, q } from the holder
        home: null, // { from, fromQ, t } gliding back to the wall
        kick: 0,
        flashUntil: 0,
        nextShot: 0,
        rounds: 0
      };
    });

    this.buildBoard(B, BD);
    this.banner = canvasPlane(BANNER.w, BANNER.hgt, 1400);
    this.banner.mesh.position.copy(this.frame.toWorld(v1.set(BANNER.u, BANNER.f, BANNER.h)));
    this.banner.mesh.lookAt(this.frame.toWorld(v1.set(0, 0, 1.6)));
    this.banner.mesh.visible = false;
    this.banner.mesh.renderOrder = 5;
    dirty(this.banner.mesh);
    this.root.add(this.banner.mesh);
    this.bannerUntil = 0;

    this.targets = new Map(); // launch id -> { L, mesh, dead }
    this.broken = new Map(); // launch id -> { by, at }
    this.debris = [];
    this.popups = [];
    this.tracers = [];
    this.players = new Map(); // client id -> { name, score, hits, shots, at }
    this.me = { score: 0, hits: 0, shots: 0, streak: 0, best: 0, lp: 0, lk: "" };
    this.hold = { left: null, right: null };
    this.rearHand = "right";
    this.prev = { left: { grip: false, trig: false }, right: { grip: false, trig: false } };
    this.nextSend = 0;
    this.nextTell = 0;
    this.lastStand = null;
    this.boardSig = "";
    this.wasActive = false;

    // The featured shoots: the level being played, the next pick, the world
    // round the roof.
    this.show = null; // { sc, lvl, t0, seed, round }
    this.queued = null; // { sc, lvl, at }
    this.drawn = new Set(); // quick-draw slots that have had their DRAW!
    this.lastActive = 0;
    this.reached = new Set();
    this.statusKey = "";
    this.sessionBest = null; // { name, score, sc }
    this.worldNode = new THREE.Group();
    this.worldNode.name = "LoungeShootWorlds";
    // (set out in the range frame)
    const gm = new THREE.Matrix4().makeBasis(this.frame.r, this.frame.up, this.frame.f.clone().negate());
    gm.setPosition(this.frame.o);
    gm.decompose(this.worldNode.position, this.worldNode.quaternion, this.worldNode.scale);
    dirty(this.worldNode);
    this.root.add(this.worldNode);
    this.world = null;
    this.worldKey = "";
    this.worldOn = false;
    this.music = null;
    this.buildPicker(B);

    // Counters for the field telemetry (telemetry.js reads and zeroes them).
    this.stats = { tickMs: 0, tickMax: 0, sent: 0, heard: 0, shots: 0, shotsHeard: 0, sounds: 0, cut: 0 };
    this.voices = [];
    this.ready = true;
    this.loadSounds();
    warmPlates(this.el.sceneEl.renderer);
  },

  buildBoard(B) {
    const centre = B(BOARD.x, BOARD.y, BOARD.z);
    const look = B(BOARD.x - 10, BOARD.y, BOARD.z);
    this.board = canvasPlane(BOARD.w, BOARD.h, 1200);
    const m = this.board.mesh;
    m.material.transparent = false;
    m.material.depthWrite = true;
    m.position.copy(centre);
    m.lookAt(look.x, centre.y, look.z);
    dirty(m);
    this.root.add(m);
    // A dark frame and two posts down to the coping.
    const wood = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x2a1a10).convertSRGBToLinear(),
      roughness: 0.7
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(BOARD.w + 0.08, BOARD.h + 0.08, 0.04), wood);
    frame.position.set(0, 0, -0.025);
    m.add(frame);
    for (const s of [-1, 1]) {
      const postH = BOARD.z - BOARD.h / 2 - COPING;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, postH, 0.06), wood);
      post.position.set((s * BOARD.w) / 2.6, -BOARD.h / 2 - postH / 2, -0.03);
      m.add(post);
    }
    dirty(m);
    // NEW GAME: pointed at with the cursor (put the gun down first).
    const rot = m.quaternion.clone();
    this.newGame = label(this.el.sceneEl, centre, rot, 0, -BOARD.h / 2 - 0.16, 0.6, 0.16, ["NEW GAME"], () =>
      this.reset(true)
    );
  },

  async loadSounds() {
    const ctx = THREE.AudioContext.getContext();
    this.sounds = makeSounds(ctx);
    try {
      const data = await (await fetch(URL_QUACK)).arrayBuffer();
      this.sounds.quack = await ctx.decodeAudioData(data);
    } catch {
      /* no quack */
    }
  },

  play(name, pos, vol = 1, ref = 4) {
    const buf = this.sounds?.[name];
    const scene = this.el.sceneEl;
    if (!buf || !scene.audioListener || window.APP?.store?.state?.preferences?.disableSoundEffects) return;
    const audioSystem = scene.systems["hubs-systems"]?.audioSystem;
    if (!audioSystem) return;
    let a = this.voices.find(v => !v.isPlaying);
    if (!a && this.voices.length < VOICES) {
      a = new THREE.PositionalAudio(scene.audioListener);
      a.panner.panningModel = "equalpower";
      this.root.add(a);
      audioSystem.addAudio({ sourceType: SourceType.SFX, node: a });
      this.voices.push(a);
    }
    if (!a) {
      a = this.voices.reduce((p, v) => (v.startedAt < p.startedAt ? v : p));
      a.stop();
      this.stats.cut++;
    }
    a.setBuffer(buf);
    a.setRefDistance(ref);
    a.setVolume(vol);
    a.position.copy(pos);
    a.matrixNeedsUpdate = true;
    a.updateMatrixWorld(true);
    a.startedAt = performance.now();
    a.play();
    this.stats.sounds++;
  },

  dropVoices() {
    const audioSystem = this.el.sceneEl.systems["hubs-systems"]?.audioSystem;
    for (const a of this.voices || []) {
      if (a.isPlaying) a.stop();
      audioSystem?.removeAudio({ node: a });
      a.parent?.remove(a);
    }
    this.voices = [];
  },

  pulse(hand, strength, ms) {
    const actuator = AFRAME.scenes[0].systems.userinput?.get(paths.haptics.actuators[hand]);
    if (actuator?.pulse) Promise.resolve(actuator.pulse(strength, ms)).catch(() => {});
  },

  // ---- network --------------------------------------------------------------

  subscribe() {
    if (this.subscribed || !window.NAF?.connection?.subscribeToDataChannel) return;
    NAF.connection.subscribeToDataChannel(DATA_TYPE, (_from, _type, data) => this.onMessage(data));
    this.subscribed = true;
  },

  send(data, reliable) {
    data.by = window.NAF?.clientId || "";
    this.stats.sent++;
    try {
      if (reliable) NAF.connection.broadcastDataGuaranteed(DATA_TYPE, data);
      else NAF.connection.broadcastData(DATA_TYPE, data);
    } catch {
      /* not connected yet */
    }
  },

  sendGun(g, reliable) {
    const o = g.mesh;
    this.send(
      {
        k: "gun",
        i: g.i,
        held: g.holder === this.myId(),
        p: o.position.toArray().map(n => Math.round(n * 1000) / 1000),
        q: o.quaternion.toArray().map(n => Math.round(n * 10000) / 10000)
      },
      reliable
    );
  },

  sendScore() {
    const { score, hits, shots, lp, lk } = this.me;
    this.send({ k: "score", score, hits, shots, lp, lk }, true);
  },

  myId() {
    return window.NAF?.clientId || "me";
  },

  onMessage(d) {
    if (!this.ready || !d || d.by === this.myId()) return;
    this.stats.heard++;
    const now = performance.now() / 1000;
    if (d.k === "gun") {
      const g = this.guns[d.i];
      if (!g) return;
      if (d.held) {
        if (g.holder === this.myId()) {
          // Both picked it up at once: the lower id keeps it.
          if (d.by < this.myId()) this.release(g, false);
          else return;
        }
        g.holder = d.by;
        g.heard = now;
        g.home = null;
        if (Array.isArray(d.p) && Array.isArray(d.q)) {
          g.target = { p: new THREE.Vector3().fromArray(d.p), q: new THREE.Quaternion().fromArray(d.q) };
        }
      } else if (g.holder === d.by) {
        this.goHome(g);
      }
    } else if (d.k === "shot") {
      const g = this.guns[d.i];
      if (g && g.holder === d.by) {
        this.stats.shotsHeard++;
        this.shotFx(g, false);
      }
    } else if (d.k === "hit") {
      const L = this.findLaunch(d.id);
      if (L) this.breakTarget(L, d.by, Number(d.pts) || KINDS[L.kind].pts, false);
    } else if (d.k === "phit") {
      const at = Number(d.at) || getServerTime() / 1000;
      const st = this.showStatus(at);
      if (this.plates && st.inRound)
        this.plates.hit(String(d.id), at, d.by, st.x2, p => this.worldNode.localToWorld(p));
    } else if (d.k === "score") {
      this.players.set(d.by, {
        score: Number(d.score) || 0,
        hits: Number(d.hits) || 0,
        shots: Number(d.shots) || 0,
        lp: Number(d.lp) || 0,
        lk: String(d.lk || ""),
        at: now
      });
    } else if (d.k === "reset") {
      this.reset(false);
    } else if (d.k === "show") {
      this.adoptShow(d);
    } else if (d.k === "pick") {
      const sc = Number(d.sc);
      const at = Number(d.at) || 0;
      if (SCENARIOS[sc] && (!this.queued || at > this.queued.at)) this.queued = { sc, lvl: Number(d.lvl) | 0, at };
    }
  },

  findLaunch(id) {
    if (String(id).startsWith("s")) return findShowLaunch(this.show, id);
    const n = Number(String(id).split(".")[0]);
    if (!Number.isFinite(n)) return null;
    return standAt(n).launches.find(L => L.id === id) || null;
  },

  reset(broadcast) {
    this.me = { score: 0, hits: 0, shots: 0, streak: 0, best: 0, lp: 0, lk: this.levelKey() };
    for (const p of this.players.values()) Object.assign(p, { score: 0, hits: 0, shots: 0, lp: 0 });
    if (broadcast) {
      this.send({ k: "reset" }, true);
      this.sendScore();
    }
    this.boardSig = "";
  },

  // ---- guns -------------------------------------------------------------------

  goHome(g) {
    g.holder = null;
    g.target = null;
    g.home = { from: g.mesh.position.clone(), fromQ: g.mesh.quaternion.clone(), t: 0 };
  },

  held() {
    return [...new Set([this.hold.left, this.hold.right].filter(Boolean))];
  },

  release(g, tell = true) {
    for (const side of ["left", "right"]) if (this.hold[side] === g) this.hold[side] = null;
    if (!this.held().length) this.el.sceneEl.removeState("lounge-gun");
    this.goHome(g);
    if (tell) this.sendGun(g, true);
  },

  releaseAll(tell = true) {
    for (const g of this.held()) this.release(g, tell);
  },

  take(g, side, now) {
    if (!this.show) {
      const q = this.queued;
      this.startShow(getServerTime() / 1000, q ? q.sc : tonight(), q ? q.lvl : 0);
    }
    this.lastActive = now;
    this.tookAt = now;
    g.holder = this.myId();
    g.home = null;
    g.target = null;
    if (g.spec.hands === 2) {
      this.hold.left = this.hold.right = g;
      this.rearHand = side;
    } else this.hold[side] = g;
    this.el.sceneEl.addState("lounge-gun");
    this.sendGun(g, true);
    this.nextTell = now + TELL_EVERY;
  },

  hand(side) {
    if (!this.hands) this.hands = {};
    const el = this.hands[side] || (this.hands[side] = document.getElementById(`player-${side}-controller`));
    if (!el) return null;
    const o = el.object3D;
    if (!o.visible) return null;
    o.updateMatrices();
    const q = o.getWorldQuaternion(new THREE.Quaternion());
    return { p: o.getWorldPosition(new THREE.Vector3()), q, fwd: Z.clone().applyQuaternion(q) };
  },

  gunEnds(g) {
    const o = g.mesh;
    return [
      g.shape.back.clone().applyQuaternion(o.quaternion).add(o.position),
      g.spec.muzzle.clone().applyQuaternion(o.quaternion).add(o.position)
    ];
  },

  // The free gun a hand takes: the nearest within reach of the hand, else
  // the nearest one the controller points at (it flies to the hand).
  grabTarget(h, busy) {
    let best = null;
    let bestD = GRAB_REACH;
    let ray = null;
    let rayT = Infinity;
    const end = h.p.clone().addScaledVector(h.fwd, POINT_REACH);
    const pt = new THREE.Vector3();
    const pistolsOnly = this.pistolsOnly();
    for (const g of this.guns) {
      if (g.holder) continue;
      if (g.spec.hands === 2 && busy) continue; // needs both hands free
      if (pistolsOnly && g.type !== "pistol") continue;
      const [a, b] = this.gunEnds(g);
      const d = segDist(h.p, a, b);
      if (d < bestD) {
        best = g;
        bestD = d;
      }
      for (let i = 0; i <= 8; i++) {
        pt.lerpVectors(a, b, i / 8);
        const t = pt.distanceTo(h.p);
        if (t < rayT && segDist(pt, h.p, end) < POINT_SLACK) {
          ray = g;
          rayT = t;
        }
      }
    }
    return best || ray;
  },

  onRoof() {
    const head = document.getElementById("avatar-pov-node")?.object3D;
    if (!head) return false;
    const p = head.getWorldPosition(v1).applyMatrix4(this.envInv);
    // (back to Blender: x, -z, y)
    const x = p.x;
    const y = -p.z;
    const z = p.y;
    return x > ROOF.x1 && x < ROOF.x2 && y > ROOF.y1 && y < ROOF.y2 && z > ROOF.z1 && z < ROOF.z2;
  },

  handleInput(now, T, live) {
    const scene = this.el.sceneEl;
    const userinput = scene.systems.userinput;
    const vr = scene.is("vr-mode") && scene.is("entered");
    const state = {};
    for (const side of ["left", "right"]) {
      const b = paths.device.webxr[side].button;
      const grip = !!userinput?.get(b.grip.pressed);
      const trig = !!userinput?.get(b.trigger.pressed);
      state[side] = {
        gripDown: vr && grip && !this.prev[side].grip,
        trigDown: vr && trig && !this.prev[side].trig,
        trig: vr && trig,
        h: vr ? this.hand(side) : null
      };
      this.prev[side] = { grip, trig };
    }
    if (!vr || !this.onRoofNow) {
      if (this.held().length) this.releaseAll();
      return;
    }
    const other = side => (side === "right" ? "left" : "right");
    // Grip: put a held gun down (either hand on a two-handed gun; it goes
    // back to the wall by itself), or pick one up. An empty hand also picks
    // up with the trigger (Jay, 2026-10-19: grip alone on a gun lying past
    // the parapet's inner face never caught in the headset).
    let putDown = false;
    for (const side of ["left", "right"]) {
      const s = state[side];
      const mine = this.hold[side];
      if (!(s.gripDown || (s.trigDown && !mine))) continue;
      if (mine) {
        if (s.gripDown && now - this.tookAt > PUT_DOWN_AFTER) {
          this.release(mine);
          putDown = true;
        }
        continue;
      }
      // (Both grips squeezed to let go must not pick it straight up again.)
      if (!s.h || putDown) continue;
      const busy = this.hold[other(side)];
      if (busy && busy.spec.hands === 2) continue; // (both hands are on it)
      const best = this.grabTarget(s.h, busy);
      if (best) {
        this.take(best, side, now);
        this.pulse(side, 0.5, 40);
        this.play("thunk", s.h.p, 0.4, 1);
        // The pull that picked it up doesn't also fire it.
        s.trigDown = s.trig = false;
      }
    }
    const two = this.hold.left && this.hold.left === this.hold.right ? this.hold.left : null;
    if (two) {
      // Trigger hand: the one nearer your face.
      const head = document.getElementById("avatar-pov-node")?.object3D;
      const eye = head ? head.getWorldPosition(v2) : null;
      const L = state.left.h;
      const R = state.right.h;
      if (eye && L && R) {
        const dl = L.p.distanceTo(eye);
        const dr = R.p.distanceTo(eye);
        if (this.rearHand === "right" && dl < dr - REAR_SWAP) this.rearHand = "left";
        else if (this.rearHand === "left" && dr < dl - REAR_SWAP) this.rearHand = "right";
      } else if (L && !R) this.rearHand = "left";
      else if (R && !L) this.rearHand = "right";
      const rear = state[this.rearHand].h;
      const front = state[other(this.rearHand)].h;
      if (rear) {
        gunPose(rear.p, front?.p || null, rear.fwd, two.mesh.position, two.mesh.quaternion);
        two.mesh.matrixNeedsUpdate = true;
        const t = state[this.rearHand];
        if (two.spec.auto) {
          // Full auto: a round every 1/auto s while the trigger is held.
          if (t.trigDown || now - two.nextShot > CATCH_UP) two.nextShot = now;
          while (t.trig && now >= two.nextShot) {
            this.fire(two, this.rearHand, now, T, live);
            two.nextShot += 1 / two.spec.auto;
          }
        } else if (t.trigDown) this.fire(two, this.rearHand, now, T, live);
      }
    } else {
      for (const side of ["left", "right"]) {
        const g = this.hold[side];
        const h = state[side].h;
        if (!g || !h) continue;
        g.mesh.position.copy(h.p);
        g.mesh.quaternion.copy(h.q);
        g.mesh.matrixNeedsUpdate = true;
        if (state[side].trigDown) this.fire(g, side, now, T, live);
      }
    }
    if (this.held().length && now >= this.nextSend) {
      const tell = now >= this.nextTell;
      for (const g of this.held()) this.sendGun(g, tell);
      if (tell) this.sendShow(true);
      if (tell) this.nextTell = now + TELL_EVERY;
      this.nextSend = now + SEND_EVERY;
    }
  },

  fire(g, side, now, T, live) {
    const spec = g.spec;
    g.mesh.updateMatrices();
    const muzzle = spec.muzzle.clone().applyMatrix4(g.mesh.matrixWorld);
    const dir = Z.clone().applyQuaternion(g.mesh.quaternion).normalize();
    const hits = this.active ? shotHits(this.frame, muzzle, dir, T, live, this.broken, spec.spread0, spec.spreadK) : [];
    let scored = 0;
    let bad = 0;
    // The quick draw: a shot at an outlaw before DRAW! costs you.
    const early = live.filter(L => L.duel && T - L.t0 < L.duel.d && !this.fouled?.has(L.id));
    if (early.length && this.active) {
      const at = shotHits(
        this.frame,
        muzzle,
        dir,
        T,
        early.map(L => ({ ...L, hittable: null })),
        this.broken,
        spec.spread0,
        spec.spreadK
      );
      for (const L of at) {
        if (!this.fouled) this.fouled = new Set();
        this.fouled.add(L.id);
        bad -= EARLY;
        const p = this.frame
          .toWorld(launchPos(L, T - L.t0, v1), new THREE.Vector3())
          .addScaledVector(this.frame.up, 2.3);
        this.popup(`TOO SOON -${EARLY}`, BAD_COLOUR, p);
        this.play("wrong", p, 0.9, 12);
      }
    }
    for (const L of hits) {
      const pts = this.pointsFor(L, T);
      if (pts < 0) bad += pts;
      else scored += pts;
      this.breakTarget(L, this.myId(), pts, true);
      this.send({ k: "hit", id: L.id, pts }, true);
    }
    // The plates: one ray for a bullet, a ring of pellets for the shotgun.
    const rays = [{ origin: muzzle, dir }];
    if (spec.pellets > 1) {
      const side1 = new THREE.Vector3().crossVectors(dir, Y).normalize();
      if (side1.lengthSq() < 0.5) side1.set(1, 0, 0);
      const side2 = new THREE.Vector3().crossVectors(side1, dir);
      for (let k = 0; k < spec.pellets - 1; k++) {
        const a = (k / (spec.pellets - 1)) * Math.PI * 2;
        const d = dir
          .clone()
          .addScaledVector(side1, Math.cos(a) * spec.cone)
          .addScaledVector(side2, Math.sin(a) * spec.cone)
          .normalize();
        rays.push({ origin: muzzle, dir: d });
      }
    }
    // The world's knockdown plates, in a round, up here.
    if (this.plates && this.worldOn && this.status?.inRound && this.active) {
      const inv = this.worldNode.matrixWorld.clone().invert();
      const local = rays.map(r => ({
        origin: r.origin.clone().applyMatrix4(inv),
        dir: r.dir.clone().transformDirection(inv)
      }));
      const x2 = !!this.status.x2;
      for (const h of this.plates.pick(local, T)) {
        const res = this.plates.hit(h.id, T, this.myId(), x2, p => this.worldNode.localToWorld(p));
        if (!res) continue;
        if (res.pts < 0) bad += res.pts;
        else scored += res.pts + res.bonus;
        this.send({ k: "phit", id: h.id, at: Math.round(T * 1000) / 1000 }, true);
      }
    }
    this.me.shots += 1;
    this.stats.shots++;
    this.me.score += scored + bad;
    if (this.status?.inRound) this.me.lp += scored + bad;
    if (scored && !bad) {
      this.me.hits += 1;
      this.me.streak += 1;
      this.me.best = Math.max(this.me.best, this.me.streak);
    } else this.me.streak = 0;
    g.rounds += 1;
    this.shotFx(g, true, muzzle, dir);
    if (spec.hands === 2) {
      this.pulse(side, spec.buzz, spec.auto ? 40 : 90);
      this.pulse(side === "right" ? "left" : "right", spec.buzz * 0.6, spec.auto ? 30 : 70);
    } else this.pulse(side, spec.buzz, 60);
    this.send({ k: "shot", i: g.i }, false);
    this.scoreDirty = true;
  },

  shotFx(g, mine, muzzle, dir) {
    const now = performance.now() / 1000;
    g.kick = 1;
    g.flashUntil = now + (g.spec.auto ? 0.035 : 0.06);
    const { smoke } = g.mesh.userData;
    if (!g.spec.auto || !smoke.visible) {
      smoke.visible = true;
      smoke.userData.t = 0;
    }
    g.mesh.updateMatrices();
    const at = muzzle || g.spec.muzzle.clone().applyMatrix4(g.mesh.matrixWorld);
    this.play(g.spec.sound, at, mine ? 0.9 : 0.8, 3);
    // A faint streak down the line of the shot, so you can see where it went
    // (every third round on full auto).
    if (mine && (!g.spec.auto || g.rounds % 3 === 0)) {
      const len = 30;
      // (one shared streak per gun type, never disposed)
      if (!this._tracerGeo) this._tracerGeo = {};
      const r1 = g.type === "shotgun" ? 0.06 : 0.012;
      if (!this._tracerGeo[r1]) this._tracerGeo[r1] = new THREE.CylinderGeometry(0.003, r1, len, 6, 1, true);
      const tr = new THREE.Mesh(this._tracerGeo[r1], this.tracerMat());
      tr.position.copy(at).addScaledVector(dir, len / 2 + 0.3);
      tr.quaternion.setFromUnitVectors(Y, dir);
      dirty(tr);
      this.root.add(tr);
      this.tracers.push({ mesh: tr, t: 0 });
    }
  },

  tracerMat() {
    if (!this._tracer) {
      this._tracer = new THREE.MeshBasicMaterial({
        color: 0xfff1c0,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
      });
    }
    return this._tracer;
  },

  // ---- targets ------------------------------------------------------------------

  colourFor(by) {
    if (by === this.myId()) return MY_COLOUR;
    const ids = [...this.players.keys()].sort();
    const k = ids.indexOf(by);
    return OTHER_COLOURS[(k < 0 ? 0 : k) % OTHER_COLOURS.length];
  },

  breakTarget(L, by, pts, mine) {
    if (this.broken.has(L.id)) return;
    const T = getServerTime() / 1000;
    this.broken.set(L.id, { by, at: T });
    const tau = THREE.MathUtils.clamp(T - L.t0, 0, L.dur);
    const p = this.frame.toWorld(launchPos(L, tau, v1), new THREE.Vector3());
    const p2 = this.frame.toWorld(launchPos(L, Math.min(L.dur, tau + 0.05), v2), new THREE.Vector3());
    const vel = p2.sub(p).multiplyScalar(20);
    let t = this.targets.get(L.id);
    if (!t) {
      t = this.spawn(L);
      this.targets.set(L.id, t);
    }
    const spec = KINDS[L.kind];
    if (spec.face === "run" || spec.face === "board" || spec.face === "slide") {
      // knocked over where it stands (a charger, a cut-out)
      t.dead = { t: 0, topple: true, q0: t.mesh.quaternion.clone(), side: Math.random() < 0.5 ? 1 : -1 };
      t.mesh.position.copy(p);
    } else if (spec.dies === "fall") {
      t.dead = { t: 0, v: vel.multiplyScalar(0.4).add(v3.set(0, 3, 0)), spin: new THREE.Vector3(6, 9, 4) };
      t.mesh.position.copy(p);
    } else {
      t.mesh.visible = false;
      t.dead = { t: 0, gone: true };
    }
    const at = p.clone();
    if (spec.hy) at.addScaledVector(this.frame.up, spec.hy);
    this.spawnDebris(spec.art ? this.debrisFor(spec) : L.kind, at, vel);
    this.popup(pts < 0 ? `${pts}` : `+${pts}`, pts < 0 ? BAD_COLOUR : this.colourFor(by), at);
    if (spec.art) {
      this.play(spec.sound || "thud", at, 1, 10);
      if (pts < 0) this.play("wrong", at, 0.9, 14);
      else if (L.x2 && mine) this.play("ding", at, 0.5, 10);
      return;
    }
    const sound = {
      clay: "clay",
      duck: "quack",
      goose: "honk",
      chicken: "squeak",
      melon: "splat",
      ufo: "ufo",
      hat: "boing"
    }[L.kind];
    this.play(sound, p, 1, 10);
    if (mine && L.kind !== "clay") this.play("clay", p, 0.6, 10);
  },

  spawn(L) {
    const spec = KINDS[L.kind];
    let mesh;
    if (spec.art?.plate) {
      // a running cut-out: square on to the stands, nose first (orientShow)
      mesh = new THREE.Group();
      const cut = plateCutout(spec.art.plate, spec.art.tint, spec.art.h);
      mesh.add(cut);
      mesh.userData = { wings: [], cut, w: cut.scale.x };
    } else mesh = spec.art ? artMesh(spec.art) : targetMesh(L.kind);
    dirty(mesh);
    this.root.add(mesh);
    return { L, mesh, dead: null, announced: false };
  },

  spawnDebris(kind, p, vel) {
    if (this.debris.length > MAX_DEBRIS) return;
    const cols = Array.isArray(kind) ? kind : DEBRIS[kind] || DEBRIS.clay;
    const n = kind === "melon" ? 16 : 11;
    for (let k = 0; k < n; k++) {
      if (!this._debrisMats) this._debrisMats = new Map();
      const mat = this._debrisMats;
      const c = cols[k % cols.length];
      if (!mat.has(c)) mat.set(c, new THREE.MeshBasicMaterial({ color: new THREE.Color(c).convertSRGBToLinear() }));
      const s = kind === "clay" ? 0.035 : 0.05;
      if (!this._debrisGeo) this._debrisGeo = new THREE.TetrahedronGeometry(1);
      const m = new THREE.Mesh(this._debrisGeo, mat.get(c));
      m.scale.setScalar(s * (0.5 + Math.random()));
      m.position.copy(p);
      dirty(m);
      this.root.add(m);
      const dv = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).multiplyScalar(7);
      this.debris.push({ mesh: m, v: dv.addScaledVector(vel, 0.35), spin: Math.random() * 12, t: 0 });
    }
  },

  popup(text, colour, p) {
    const key = `${text}|${colour}`;
    if (!this._popupTex) this._popupTex = new Map();
    const cache = this._popupTex;
    const wide = text.length > 5 ? 2 : 1;
    if (!cache.has(key)) {
      const canvas = document.createElement("canvas");
      canvas.width = 256 * wide;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      ctx.font = "900 92px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 12;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.strokeText(text, 128 * wide, 66, 256 * wide - 16);
      ctx.fillStyle = colour;
      ctx.fillText(text, 128 * wide, 66, 256 * wide - 16);
      const tex = new THREE.CanvasTexture(canvas);
      tex.encoding = THREE.sRGBEncoding;
      cache.set(key, tex);
    }
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: cache.get(key), depthTest: false, transparent: true })
    );
    sprite.renderOrder = 10;
    sprite.position.copy(p);
    dirty(sprite);
    this.root.add(sprite);
    this.popups.push({ sprite, t: 0, from: p.clone(), wide });
  },

  showBanner(lines, colour = "#fff4d6", secs = 3.5) {
    const { canvas, ctx, tex, mesh } = this.banner;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((line, i) => {
      const size = i === 0 ? 130 : 80;
      ctx.font = `900 ${size}px sans-serif`;
      const y = (canvas.height * (i + 1)) / (lines.length + 1);
      ctx.lineWidth = 16;
      ctx.strokeStyle = "rgba(10,10,14,0.9)";
      ctx.strokeText(line, canvas.width / 2, y, canvas.width - 40);
      ctx.fillStyle = i === 0 ? colour : "#ffffff";
      ctx.fillText(line, canvas.width / 2, y, canvas.width - 40);
    });
    tex.needsUpdate = true;
    mesh.visible = true;
    this.bannerUntil = performance.now() / 1000 + secs;
  },

  orient(t, tau, p) {
    const { L, mesh } = t;
    const ud = mesh.userData;
    if (KINDS[L.kind].face) {
      this.orientShow(t, tau, p, KINDS[L.kind]);
      return;
    }
    const next = this.frame.toWorld(launchPos(L, Math.min(L.dur + 1, tau + 0.05), v2), v2);
    const vel = next.sub(p);
    if (L.kind === "clay") {
      // Turned mostly towards the stands so you see the whole dish (seen
      // edge-on, as it really flies, it is a sliver), spinning.
      const eye = this.frame.toWorld(v3.set(0, 0, 1.6), v3);
      const n = eye.sub(p).normalize().multiplyScalar(0.85).addScaledVector(Y, 0.3).normalize();
      mesh.quaternion.setFromUnitVectors(Y, n);
      mesh.quaternion.multiply(q1.setFromAxisAngle(Y, tau * 22));
    } else if (L.kind === "duck" || L.kind === "goose") {
      vel.y *= 0.4;
      if (vel.lengthSq() > 1e-6) {
        const m = new THREE.Matrix4().lookAt(p, p.clone().add(vel), Y);
        mesh.quaternion.setFromRotationMatrix(m);
      }
      const rate = L.kind === "goose" ? 7 : 13;
      const amp = L.kind === "goose" ? 0.6 : 0.8;
      for (const { wg, side } of ud.wings) {
        wg.rotation.z = side * amp * Math.sin(tau * rate + (L.bob || 0));
        wg.matrixNeedsUpdate = true;
      }
    } else if (L.kind === "chicken" || L.kind === "melon") {
      mesh.rotation.set(tau * (L.tumble || 3), tau * (L.tumble || 3) * 0.6, tau * 1.3);
    } else if (L.kind === "hat") {
      mesh.quaternion.setFromAxisAngle(Y, tau * (L.spin || 10));
      mesh.quaternion.premultiply(q1.setFromAxisAngle(v3.set(1, 0, 0), 0.25));
    } else if (L.kind === "ufo") {
      mesh.quaternion.setFromAxisAngle(Y, tau * 2.5);
      mesh.quaternion.premultiply(q1.setFromAxisAngle(v3.set(0, 0, 1), 0.12 * Math.sin(tau * 4)));
      for (const { light, k } of ud.wings) {
        const on = (Math.floor(tau * 10) + k) % 4 === 0;
        light.material.color.setHex(on ? 0xffffff : 0x7dff6a);
      }
    }
  },

  updateTargets(T, dt, live) {
    const alive = new Set();
    if (this.active) {
      for (const L of live) {
        alive.add(L.id);
        let t = this.targets.get(L.id);
        if (!t) {
          if (this.broken.has(L.id)) continue;
          t = this.spawn(L);
          this.targets.set(L.id, t);
        }
        if (t.dead) continue;
        const tau = T - L.t0;
        const p = this.frame.toWorld(launchPos(L, tau, v1), new THREE.Vector3());
        t.mesh.position.copy(p);
        this.orient(t, tau, p);
        t.mesh.matrixNeedsUpdate = true;
        if (L.charge && tau >= (L.arrive ?? L.dur - 0.15) && !this.reached.has(L.id)) this.chargerArrived(L, p);
        if (L.duel && tau >= L.duel.d && !this.drawn.has(L.t0)) {
          // (one call for both lanes)
          this.drawn.add(L.t0);
          if (this.onRoofNow) {
            this.showBanner(["DRAW!"], "#ff4a4a", 1.4);
            this.play("bell", this.frame.toWorld(v2.set(0, 4, 2.5), new THREE.Vector3()), 1, 12);
          }
        }
        if (!t.announced) {
          t.announced = true;
          if (tau < 0.6) {
            const info = KINDS[L.kind];
            if (L.say) this.showBanner(L.say, "#fff4d6", Math.min(3, L.duel ? L.duel.d - 0.2 : 3));
            else if (L.duel) {
              /* (no points banner on a duelist) */
            } else if (info.art) {
              if (info.name && !this.banner.mesh.visible)
                this.showBanner([info.name, `${info.pts} POINTS`], info.pts < 0 ? BAD_COLOUR : "#ffd24a", 2.2);
            } else if (info.name) {
              this.showBanner([`${info.name}!`, `${info.pts} POINTS`], "#ffd24a", 2.6);
              if (L.kind === "goose") this.play("honk", p, 1, 14);
            } else if (L.kind === "duck" && Math.random() < 0.3) this.play("quack", p, 0.7, 12);
            else if (L.kind === "clay") this.play("thunk", p, 0.5, 8);
          }
        }
      }
    }
    for (const [id, t] of this.targets) {
      if (t.dead) {
        t.dead.t += dt;
        if (t.dead.topple) {
          const e = Math.min(1, t.dead.t / 0.35);
          t.mesh.quaternion.copy(t.dead.q0).multiply(q1.setFromAxisAngle(v3.set(0, 0, 1), t.dead.side * e * e * 1.5));
          t.mesh.visible = t.dead.t < FALL_TIME - 0.6 || Math.floor(t.dead.t * 10) % 2 === 0;
          t.mesh.matrixNeedsUpdate = true;
        } else if (!t.dead.gone) {
          const d = t.dead;
          d.v.y -= 9.8 * dt;
          t.mesh.position.addScaledVector(d.v, dt);
          t.mesh.rotation.x += d.spin.x * dt;
          t.mesh.rotation.y += d.spin.y * dt;
          t.mesh.rotation.z += d.spin.z * dt;
          t.mesh.matrixNeedsUpdate = true;
        }
        if (t.dead.t > FALL_TIME) this.dropTarget(id, t);
      } else if (!alive.has(id)) this.dropTarget(id, t);
    }
    for (const [id, b] of this.broken) if (T - b.at > 120) this.broken.delete(id);
    if (this.drawn.size > 40) this.drawn.clear();
  },

  dropTarget(id, t) {
    this.root.remove(t.mesh);
    t.mesh.traverse(o => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    });
    this.targets.delete(id);
  },

  updateFx(now, dt) {
    for (let k = this.debris.length - 1; k >= 0; k--) {
      const d = this.debris[k];
      d.t += dt;
      d.v.y -= 9.8 * dt;
      d.mesh.position.addScaledVector(d.v, dt);
      d.mesh.rotation.x += d.spin * dt;
      d.mesh.rotation.y += d.spin * 0.7 * dt;
      d.mesh.matrixNeedsUpdate = true;
      if (d.t > DEBRIS_TIME) {
        this.root.remove(d.mesh);
        this.debris.splice(k, 1);
      }
    }
    for (let k = this.popups.length - 1; k >= 0; k--) {
      const p = this.popups[k];
      p.t += dt;
      const e = p.t / POPUP_TIME;
      const cam = document.getElementById("avatar-pov-node")?.object3D;
      const dist = cam ? cam.getWorldPosition(v1).distanceTo(p.from) : 10;
      p.sprite.position.copy(p.from).y += 0.4 + e * 1.2;
      const s = Math.max(0.6, dist * 0.11);
      p.sprite.scale.set(s * p.wide, s / 2, 1);
      p.sprite.material.opacity = e < 0.7 ? 1 : 1 - (e - 0.7) / 0.3;
      p.sprite.matrixNeedsUpdate = true;
      if (p.t > POPUP_TIME) {
        this.root.remove(p.sprite);
        p.sprite.material.dispose();
        this.popups.splice(k, 1);
      }
    }
    for (let k = this.tracers.length - 1; k >= 0; k--) {
      const tr = this.tracers[k];
      tr.t += dt;
      tr.mesh.visible = tr.t < 0.09;
      if (tr.t > 0.12) {
        this.root.remove(tr.mesh);
        this.tracers.splice(k, 1);
      }
    }
    for (const g of this.guns) {
      const { kick, flash, smoke } = g.mesh.userData;
      flash.visible = now < g.flashUntil;
      flash.matrixNeedsUpdate = true;
      if (g.kick > 0) {
        g.kick = Math.max(0, g.kick - dt / 0.18);
        const e = g.kick * g.kick;
        const k = g.spec.kick;
        kick.position.set(0, 0.01 * e * k, 0.05 * e * k);
        kick.rotation.x = 0.16 * e * k;
        kick.matrixNeedsUpdate = true;
      }
      if (smoke.visible) {
        smoke.userData.t += dt;
        const t = smoke.userData.t;
        smoke.scale.setScalar(1 + t * 5);
        smoke.position.set(0, 0.011 + t * 0.15, -0.9 - t * 0.6);
        smoke.material.opacity = Math.max(0, 0.35 * (1 - t / 1.1));
        smoke.matrixNeedsUpdate = true;
        if (t > 1.1) smoke.visible = false;
      }
    }
    if (this.banner.mesh.visible && now > this.bannerUntil) this.banner.mesh.visible = false;
  },

  updateGuns(now, dt) {
    const me = this.myId();
    for (const g of this.guns) {
      if (g.holder && g.holder !== me && now - g.heard > STALE) this.goHome(g);
      const o = g.mesh;
      if (g.home) {
        g.home.t = Math.min(1, g.home.t + dt / HOME_TIME);
        const e = g.home.t * g.home.t * (3 - 2 * g.home.t);
        o.position.lerpVectors(g.home.from, g.rackPos, e);
        o.quaternion.slerpQuaternions(g.home.fromQ, g.rackQuat, e);
        o.matrixNeedsUpdate = true;
        if (g.home.t >= 1) g.home = null;
      } else if (g.target && g.holder !== me) {
        o.position.lerp(g.target.p, Math.min(1, dt * 18));
        o.quaternion.slerp(g.target.q, Math.min(1, dt * 18));
        o.matrixNeedsUpdate = true;
      }
    }
  },

  setSkybox(on) {
    if (on === this.skybox || !this.sky) return;
    this.skybox = on;
    this.sky.forEach(({ o, order, depthWrite }, k) => {
      o.renderOrder = on ? -1000 - k : order;
      o.material.depthWrite = on ? false : depthWrite;
    });
  },

  drawBoard(T, stand, status) {
    const name = id => this.nameOf(id);
    const rows = this.standings();
    const left = Math.max(0, Math.ceil((stand.n + 1) * STAND - T));
    const show = this.show && !status.idle ? this.show : null;
    const camp = show ? campaignOf(show.sc) : null;
    const levels = show ? levelsOf(show.sc) : [];
    const lv = status.lv;
    const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
    const team = this.team();
    const goal = levelGoal(lv);
    let line;
    let bar = null;
    if (!show)
      line = this.active ? `NOW: ${stand.title}   ·   next stand in ${left}s` : "Pick up a gun from the wall to start";
    else if (status.starting)
      line = `LEVEL ${show.lvl + 1} OF ${levels.length} · ${lv.name} · STARTS IN ${status.starting}s`;
    else if (status.inRound) {
      const title = showWave(show, status.w).title;
      if (goal) {
        line = `LEVEL ${show.lvl + 1}/${levels.length} · ${title} · TEAM ${team.toLocaleString()} / ${goal.toLocaleString()}`;
        bar = Math.max(0, Math.min(1, team / goal));
      } else {
        line = `LEVEL ${show.lvl + 1}/${levels.length} · ${title} · ${mmss(Math.max(0, status.left))} LEFT`;
        bar = Math.max(0, Math.min(1, 1 - status.left / lv.dur));
      }
    } else {
      const n = this.queued ? this.queued.sc : (show.sc + 1) % SCENARIOS.length;
      line = `${camp.name} DONE · ${campaignOf(n).name} IN ${mmss(Math.max(0, status.left))} · the clay stands are open`;
    }
    const best = this.sessionBest ? `   ·   BEST TONIGHT: ${this.sessionBest.name} ${this.sessionBest.score}` : "";
    const total = rows.reduce((a, r) => a + r.score, 0);
    const sig = JSON.stringify([
      this.active,
      line,
      bar && Math.round(bar * 200),
      best,
      rows.map(r => [r.id, name(r.id), r.score, r.hits, r.shots]),
      this.me.streak
    ]);
    if (sig === this.boardSig) return;
    this.boardSig = sig;
    const { canvas, ctx, tex } = this.board;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = "#14281b";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#d9b860";
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f3d27a";
    ctx.font = "900 60px serif";
    ctx.fillText(camp && !status.inBreak ? camp.name : "ROVERS ROOF CLAY CLUB", W / 2, 66, W - 60);
    ctx.font = "600 32px sans-serif";
    ctx.fillStyle = "#e9e3d0";
    ctx.fillText(line, W / 2, 122, W - 60);
    if (bar !== null) {
      // the team's way through the level
      ctx.fillStyle = "#0a160e";
      ctx.fillRect(70, 148, W - 140, 22);
      ctx.fillStyle = goal ? "#7fd18a" : "#d9b860";
      ctx.fillRect(70, 148, (W - 140) * bar, 22);
      ctx.strokeStyle = "#d9b860";
      ctx.lineWidth = 3;
      ctx.strokeRect(70, 148, W - 140, 22);
    }
    ctx.textAlign = "left";
    const top = 222;
    const rowH = Math.min(88, (H - top - 140) / Math.max(1, rows.length));
    ctx.font = "600 30px sans-serif";
    ctx.fillStyle = "#9fb8a4";
    ctx.fillText(show ? `SHOOTER  ·  TEAM ${total.toLocaleString()}` : "SHOOTER", 70, top - 26);
    ctx.textAlign = "right";
    ctx.fillText("HITS / SHOTS", W - 330, top - 26);
    ctx.fillText("SCORE", W - 70, top - 26);
    rows.slice(0, 5).forEach((r, k) => {
      const y = top + rowH * (k + 0.55);
      ctx.textAlign = "left";
      ctx.fillStyle = this.colourFor(r.id);
      ctx.font = `800 ${Math.round(rowH * 0.55)}px sans-serif`;
      ctx.fillText(`${k + 1}. ${name(r.id)}`, 70, y, W - 760);
      ctx.textAlign = "right";
      ctx.fillStyle = "#e9e3d0";
      ctx.font = `600 ${Math.round(rowH * 0.42)}px sans-serif`;
      ctx.fillText(`${r.hits} / ${r.shots}`, W - 330, y);
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${Math.round(rowH * 0.62)}px sans-serif`;
      ctx.fillText(String(r.score), W - 70, y);
    });
    ctx.textAlign = "center";
    ctx.fillStyle = "#d9b860";
    ctx.font = "700 30px sans-serif";
    const streak = this.me.streak >= 3 ? `   ·   ${this.me.streak} IN A ROW!` : "";
    let legend = `CLAYS 25  ·  DUCKS & GOOSE 5  ·  SURPRISES 25${streak}${best}`;
    if (show && !status.inBreak)
      legend =
        lv?.legend ||
        `SMALLER + FASTER = MORE  ·  GOLDEN 50  ·  DON'T-SHOOTS -25  ·  ${goal ? `${goal.toLocaleString()} AS A TEAM TO WIN THE LEVEL` : ""}${streak}`;
    ctx.fillText(legend, W / 2, H - 98, W - 60);
    ctx.fillStyle = "#9fb8a4";
    ctx.font = "500 25px sans-serif";
    ctx.fillText(
      lv?.pistols && show && !status.inBreak
        ? "PISTOLS ONLY · take one in each hand · grip to put it down"
        : "Point at a gun + grip or trigger to pick it up · shotgun/rifle: both hands, trigger on the hand nearest your face · pistols: one per hand · grip again to put it down",
      W / 2,
      H - 50,
      W - 60
    );
    tex.needsUpdate = true;
  },

  // ---- featured shoots (shoots.js) ------------------------------------------

  pointsFor(L, T = getServerTime() / 1000) {
    if (L.duel) {
      // the quick draw: 300 for a shot the moment he's called, down to 50
      const dt = T - L.t0 - L.duel.d;
      const pts = 5 * Math.round((50 + 250 * Math.max(0, 1 - dt / L.duel.react)) / 5);
      return L.duel.x2 ? pts * 2 : pts;
    }
    const pts = KINDS[L.kind].pts;
    return L.x2 && pts > 0 ? pts * 2 : pts;
  },

  debrisFor(spec) {
    const a = spec.art;
    if (a.thing === "balloon" || a.thing === "bigBalloon") return [a.c, a.c, 0xffffff];
    if (a.thing === "gold") return [0xffc93c, 0xfff1a8, 0xffffff];
    if (a.thing === "glass") return [0xe8f4ff, 0xf6e7a6, 0xffffff];
    if (a.thing === "apple") return [0xd92a2a, 0xf4e4c0];
    if (a.thing === "turnip") return [0x8a3aa8, 0xeee4f2, 0x3aa34a];
    if (a.thing === "coconut") return [0x6b4423, 0xffffff];
    if (a.thing === "whiskey") return [0x8a4a1a, 0xf4e4c0, 0xe8f4ff];
    if (a.thing === "mug") return [0xe8a838, 0xfff8e0, 0xe8f4ff];
    if (a.thing === "stetson") return [0xe8dcc0, 0x2a1a10];
    if (a.bird) return [0xffffff, 0xd8d0c8, 0x8a7a66];
    if (a.animal) return [0xffffff, 0xf2c230, 0xe8344a];
    if (a.plate) return [a.tint, a.tint, 0x1a1a1a];
    return [0xd8c8a8, 0xffffff, 0x555555];
  },

  // A charger got to the roof (a gunman drew, dynamite landed, an outlaw
  // beat you to the draw): everyone up here with a gun loses its penalty.
  chargerArrived(L, p) {
    this.reached.add(L.id);
    const spec = KINDS[L.kind];
    this.play(spec.arrive || spec.sound || "roar", p, 1, 16);
    if (spec.blast) this.spawnDebris([0xff7a1a, 0xffd23a, 0x5a5a5a], p, v2.set(0, 4, 0));
    if (!this.held().length || !this.onRoofNow) return;
    const pen = spec.penalty || PENALTY;
    this.me.score -= pen;
    if (this.status?.inRound) this.me.lp -= pen;
    this.me.streak = 0;
    this.scoreDirty = true;
    this.popup(
      spec.lose ? `${spec.lose} -${pen}` : `-${pen}`,
      BAD_COLOUR,
      p.clone().addScaledVector(this.frame.up, spec.hy ? 2.3 : 1.5)
    );
    for (const side of ["left", "right"]) if (this.hold[side]) this.pulse(side, 1, 200);
  },

  orientShow(t, tau, p, spec) {
    const { L, mesh } = t;
    const ud = mesh.userData;
    const next = this.frame.toWorld(launchPos(L, Math.min(L.dur + 1, tau + 0.05), v2), v2);
    const vel = next.sub(p);
    const face = dir => {
      if (dir.lengthSq() < 1e-8) return;
      mesh.quaternion.setFromRotationMatrix(m1.lookAt(p, v3.copy(p).add(dir), Y));
    };
    if (spec.face === "fly") {
      vel.y *= 0.4;
      face(vel);
      const small = spec.pts >= 25;
      for (const { wg, side } of ud.wings) {
        wg.rotation.z = side * (small ? 0.9 : 0.6) * Math.sin(tau * (small ? 18 : 8) + L.t0);
        wg.matrixNeedsUpdate = true;
      }
    } else if (spec.face === "run" || spec.face === "level") {
      vel.y = 0;
      face(vel);
      if (spec.face === "run") mesh.quaternion.multiply(q1.setFromAxisAngle(v3.set(1, 0, 0), 0.08 * Math.sin(tau * 9)));
    } else if (spec.face === "board") {
      const eye = this.frame.toWorld(v3.set(0, 0, 1.6), v3).sub(p);
      eye.y = 0;
      face(eye.clone());
      if (L.turn) mesh.quaternion.multiply(q1.setFromAxisAngle(Y, (1 - L.turn(tau)) * Math.PI * 0.5));
    } else if (spec.face === "slide") {
      const eye = this.frame.toWorld(v3.set(0, 0, 1.6), v3).sub(p);
      eye.y = 0;
      face(eye.clone());
      // the outline faces its -x: turn it to face the way it runs
      const nose = v3.set(-1, 0, 0).applyQuaternion(mesh.quaternion);
      const sx = nose.dot(vel) < 0 ? -ud.w : ud.w;
      if (ud.cut.scale.x !== sx) {
        ud.cut.scale.x = sx;
        ud.cut.matrixNeedsUpdate = true;
      }
    } else if (spec.face === "spin") {
      const eye = this.frame.toWorld(v3.set(0, 0, 1.6), v3).sub(p);
      eye.y = 0;
      face(eye.clone());
      mesh.quaternion.multiply(q1.setFromAxisAngle(Y, tau * 4));
    } else if (spec.face === "up") {
      mesh.quaternion.setFromAxisAngle(v3.set(0, 0, 1), 0.12 * Math.sin(tau * 1.3 + L.t0));
    } else if (spec.face === "tumble") {
      mesh.rotation.set(tau * 3, tau * 2, tau);
    }
  },

  // The current level's key: points scored in it count towards it.
  levelKey(show = this.show) {
    return show ? `${show.sc}.${show.lvl | 0}.${Math.round(show.t0)}` : "";
  },

  // Everyone's points in this level (the team's way to its goal).
  team() {
    const key = this.levelKey();
    if (!key) return 0;
    const me = this.myId();
    const present = window.APP?.hubChannel?.presence?.state || {};
    let n = this.me.lk === key ? this.me.lp : 0;
    for (const [id, p] of this.players) {
      if (id === me || (!present[id] && Object.keys(present).length)) continue;
      if (p.lk === key) n += p.lp;
    }
    return n;
  },

  pistolsOnly() {
    const st = this.status;
    return !!(st && (st.inRound || st.starting) && st.lv?.pistols);
  },

  // Where the featured shoot is at shared time T: { idle } | { starting, lv }
  // | { inRound, lv, w, x2, left } | { inBreak, left } (the campaign is over).
  showStatus(T) {
    const s = this.show;
    if (!s) return { idle: true };
    const lv = levelOf(s);
    if (!lv) return { inBreak: true, done: true, left: Math.ceil(s.t0 + BREAK - T) };
    const t = T - s.t0;
    if (t < 0) return { starting: Math.ceil(-t), lv };
    const w = Math.floor(t / WAVE);
    return { inRound: true, lv, w, x2: showWave(s, w).x2, left: lv.dur ? Math.ceil(lv.dur - t) : null };
  },

  startShow(T, sc, lvl = 0) {
    const prev = this.show;
    this.show = {
      sc,
      lvl: Math.min(lvl | 0, levelsOf(sc).length - 1),
      t0: Math.round(T) + 5,
      seed: (Math.random() * 4294967296) >>> 0,
      round: 1
    };
    this.queued = null;
    this.levelStarted(prev, true);
    this.sendShow(true);
  },

  sendShow(reliable) {
    if (!this.show) return;
    const { sc, lvl, t0, seed, round } = this.show;
    const q = this.queued;
    this.send({ k: "show", sc, lvl, t0, seed, round, q: q ? q.sc : -1, ql: q ? q.lvl : 0, qa: q ? q.at : 0 }, reliable);
  },

  // Someone else's show: the newer one wins (ties: the lower world, seed).
  adoptShow(d) {
    const s = {
      sc: Number(d.sc),
      lvl: Number(d.lvl) | 0,
      t0: Number(d.t0),
      seed: Number(d.seed) >>> 0,
      round: Number(d.round) || 1
    };
    if (!SCENARIOS[s.sc] || !Number.isFinite(s.t0)) return;
    const q = Number(d.q);
    const qa = Number(d.qa) || 0;
    if (SCENARIOS[q] && (!this.queued || qa > this.queued.at)) this.queued = { sc: q, lvl: Number(d.ql) | 0, at: qa };
    const c = this.show;
    const better = !c || (s.t0 !== c.t0 ? s.t0 > c.t0 : s.sc !== c.sc ? s.sc < c.sc : s.seed < c.seed);
    if (!better) return;
    if (this.queued && this.queued.at <= s.t0 - 4.5 && c && s.t0 > c.t0 && s.lvl === 0) this.queued = null;
    this.show = s;
    // (a new campaign, unless it's the next level of the one we're in)
    const fresh = !c || c.sc !== s.sc || c.round !== s.round || s.lvl === 0 || s.lvl < c.lvl;
    this.levelStarted(c, fresh);
  },

  // A level (or the campaign's end) began: fresh = a new campaign, scores to zero.
  levelStarted(prev, fresh) {
    if (fresh) this.reset(false);
    this.me.lp = 0;
    this.me.lk = this.levelKey();
    this.scoreDirty = true;
    this.reached.clear();
    this.statusKey = "";
    // the level just won
    if (!fresh && prev && prev.sc === this.show.sc && this.show.lvl > prev.lvl && this.onRoofNow) {
      const next = levelOf(this.show);
      const won = levelOf(prev);
      if (next)
        this.showBanner(
          [won && won.goal === null ? `${won.name} DONE` : "LEVEL CLEARED!", `NEXT: ${next.name}`],
          "#7fd18a",
          LEVEL_GAP - 1
        );
      this.play("ding", this.frame.toWorld(v1.set(0, 4, 2.5), new THREE.Vector3()), 0.9, 10);
    }
    if (!levelOf(this.show)) this.campaignOver();
  },

  // The level was won: everyone's points in it reached its goal. The next
  // level (or the campaign's end) for everyone, LEVEL_GAP s from now.
  levelUp(T) {
    const s = this.show;
    const lvl = s.lvl + 1;
    const last = lvl >= levelsOf(s.sc).length;
    this.show = {
      sc: s.sc,
      lvl,
      t0: last ? Math.round(T) : Math.round(T) + LEVEL_GAP,
      seed: Math.imul(s.seed ^ 0x9e3779b9, 2654435761) >>> 0,
      round: s.round
    };
    this.levelStarted(s, false);
    this.sendShow(true);
  },

  // Time moves the shoot on by itself: a timed level's end, the end of the
  // break after a campaign (the next one if anyone still has a gun up: the
  // pick from the board, or the next night's), or nobody playing.
  advanceShow(T, now) {
    const s = this.show;
    if (!s) return;
    if (!this.active && now - this.lastActive > IDLE) {
      this.show = null;
      return;
    }
    const lv = levelOf(s);
    if (lv && lv.dur && T >= s.t0 + lv.dur) {
      const next = s.lvl + 1 < levelsOf(s.sc).length;
      this.show = { ...s, lvl: s.lvl + 1, t0: s.t0 + lv.dur + (next ? LEVEL_GAP : 0) };
      this.levelStarted(s, false);
      return;
    }
    if (lv || T < s.t0 + BREAK) return;
    if (!this.active) {
      this.show = null;
      return;
    }
    const q = this.queued;
    const sc = q ? q.sc : (s.sc + 1) % SCENARIOS.length;
    this.show = {
      sc,
      lvl: q ? Math.min(q.lvl | 0, levelsOf(sc).length - 1) : 0,
      t0: s.t0 + BREAK,
      seed: Math.imul(s.seed ^ 0x9e3779b9, 2654435761) >>> 0,
      round: s.round + 1
    };
    this.queued = null;
    this.levelStarted(s, true);
  },

  campaignOver() {
    const rows = this.standings();
    const top = rows[0];
    const camp = campaignOf(this.show.sc);
    const total = rows.reduce((a, r) => a + r.score, 0);
    if (top && top.score > 0) {
      const name = this.nameOf(top.id);
      this.showBanner(
        [...(camp.done || [`${camp.name} DONE`]), `TOP GUN: ${name} ${top.score} · TEAM ${total}`],
        "#ffd24a",
        8
      );
      if (!this.sessionBest || top.score > this.sessionBest.score)
        this.sessionBest = { name, score: top.score, sc: this.show.sc };
    } else this.showBanner(camp.done || [`${camp.name} DONE`], "#ffd24a", 6);
    if (this.onRoofNow) this.play("gong", this.frame.toWorld(v1.set(0, 6, 3), new THREE.Vector3()), 0.6, 8);
  },

  // Banners as a level starts and at each double-points wave.
  announce(status) {
    const key = status.inRound ? `${this.levelKey()}|${status.x2 ? status.w : "on"}` : "";
    if (key === this.statusKey) return;
    this.statusKey = key;
    if (!key || !this.onRoofNow) return;
    const lv = status.lv;
    const n = levelsOf(this.show.sc).length;
    const title = showWave(this.show, status.w).title;
    let lines;
    if (status.x2) lines = [title];
    else if (status.w === 0)
      lines = [`LEVEL ${this.show.lvl + 1} OF ${n}`, lv.name, lv.story || campaignOf(this.show.sc).name];
    else return;
    this.showBanner(lines, "#fff4d6", 5);
    this.play("bell", this.frame.toWorld(v1.set(0, 3, 2), new THREE.Vector3()), 0.5, 6);
  },

  // ---- the picker ---------------------------------------------------------------

  buildPicker(B) {
    const centre = B(PICKER.x, PICKER.y, COPING + 0.16 + PICKER.h / 2);
    const look = new THREE.Object3D();
    look.position.copy(centre);
    look.lookAt(B(PICKER.x, PICKER.y - 10, COPING + 0.16 + PICKER.h / 2));
    const rot = look.quaternion.clone();
    const wood = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x2a1a10).convertSRGBToLinear(),
      roughness: 0.7
    });
    const back = new THREE.Mesh(new THREE.BoxGeometry(PICKER.w, PICKER.h, 0.04), wood);
    back.position.copy(centre).add(v1.set(0, 0, -0.03).applyQuaternion(rot));
    back.quaternion.copy(rot);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), wood);
      post.position.set((s * PICKER.w) / 2.6, -PICKER.h / 2 - 0.08, 0);
      back.add(post);
    }
    dirty(back);
    this.root.add(back);
    const scene = this.el.sceneEl;
    const L = [];
    L.push(label(scene, centre, rot, 0, 0.53, 2.0, 0.2, ["PICK THE SHOOT"]));
    PICK_NAMES.forEach((lines, i) => {
      const row = i < 4 ? 0 : 1;
      const x = -0.78 + (i % 4) * 0.52;
      L.push(label(scene, centre, rot, x, row === 0 ? 0.27 : -0.01, 0.48, 0.24, lines, () => this.pickWorld(i)));
    });
    L.push(label(scene, centre, rot, 0, -0.25, 2.0, 0.15, [""]));
    // which level to start at
    this.levelButtons = [0, 1, 2, 3, 4].map(n =>
      label(scene, centre, rot, -0.84 + n * 0.3, -0.47, 0.27, 0.15, [`LEVEL ${n + 1}`], () => this.pickLevel(n))
    );
    L.push(...this.levelButtons);
    L.push(label(scene, centre, rot, 0.75, -0.47, 0.5, 0.15, ["START IT NOW"], () => this.startNow()));
    this.picker = L;
    this.pickerSig = "";
  },

  pickWorld(sc) {
    const T = getServerTime() / 1000;
    this.queued = { sc, lvl: 0, at: T };
    this.send({ k: "pick", sc, lvl: 0, at: T }, true);
    this.pickerSig = "";
  },

  // Start the picked shoot at a later level (to try one without winning the
  // ones before it).
  pickLevel(lvl) {
    const T = getServerTime() / 1000;
    const sc = this.queued ? this.queued.sc : this.show ? this.show.sc : tonight();
    if (lvl >= levelsOf(sc).length) return;
    this.queued = { sc, lvl, at: T };
    this.send({ k: "pick", sc, lvl, at: T }, true);
    this.pickerSig = "";
  },

  startNow() {
    const T = getServerTime() / 1000;
    const q = this.queued;
    const sc = q ? q.sc : this.show ? this.show.sc : tonight();
    this.startShow(T, sc, q ? q.lvl : 0);
    this.lastActive = performance.now() / 1000;
    this.pickerSig = "";
  },

  drawPicker(status) {
    if (!this.picker) return;
    const now = this.show && (status.inRound || status.starting) ? this.show.sc : -1;
    const next = this.queued ? this.queued.sc : -1;
    const qlvl = this.queued ? this.queued.lvl | 0 : 0;
    const sig = `${now}|${next}|${qlvl}|${this.show ? this.show.lvl : ""}|${status.inBreak ? status.left : ""}|${status.starting || ""}`;
    if (sig === this.pickerSig) return;
    this.pickerSig = sig;
    PICK_NAMES.forEach((lines, i) => {
      const bg = i === next ? "#f3d27a" : i === now ? "#7fd18a" : "#202a30";
      this.picker[i + 1].draw(i === next ? [lines[0], "NEXT"] : i === now ? [lines[0], "NOW"] : lines, false, bg);
    });
    const forSc = next >= 0 ? next : now >= 0 ? now : tonight();
    const nLevels = levelsOf(forSc).length;
    this.levelButtons.forEach((b, n) => {
      const on = next >= 0 && n === qlvl;
      b.draw(n < nLevels ? [`LEVEL ${n + 1}`] : ["·"], false, on ? "#f3d27a" : "#202a30");
    });
    const name = i => PICK_NAMES[i][0];
    const lvlName = (sc, n) => (n > 0 ? ` FROM LEVEL ${n + 1}` : "");
    let text;
    if (status.starting) text = `${name(this.show.sc)} LEVEL ${this.show.lvl + 1} STARTS IN ${status.starting}`;
    else if (status.inRound)
      text =
        next >= 0
          ? `NOW: ${name(now)} L${this.show.lvl + 1} · NEXT: ${name(next)}${lvlName(next, qlvl)}`
          : `NOW: ${name(now)} LEVEL ${this.show.lvl + 1} · point + trigger to pick the next`;
    else if (status.inBreak) {
      const n = next >= 0 ? next : (this.show.sc + 1) % SCENARIOS.length;
      text = `BREAK · ${name(n)} IN ${status.left}s`;
    } else
      text =
        next >= 0
          ? `PICK UP A GUN TO START ${name(next)}${lvlName(next, qlvl)}`
          : `TONIGHT: ${name(tonight())} · PICK UP A GUN TO START`;
    this.picker[PICK_NAMES.length + 1].draw([text]);
  },

  // ---- the world round the roof -------------------------------------------------

  setWorld(key) {
    if (this.worldKey === key) return;
    if (this.world) {
      this.worldNode.remove(this.world.group);
      this.world.dispose();
      this.world = null;
      this.plates.dispose();
      this.plates = null;
    }
    this.worldKey = key;
    if (key) {
      // the world's knockdown plates (plates.js), their rails and cover in its scenery
      this.plates = new PlateField(key, {
        play: (name, p, vol, ref) => this.play(name, p, vol, ref),
        debris: (cols, p, vel) => this.spawnDebris(cols, p, vel),
        popup: (text, by, p) => this.popup(text, by ? this.colourFor(by) : BAD_COLOUR, p),
        bonus: (text, by, p) => this.popup(text, this.colourFor(by), p)
      });
      this.plates.reset(this.show ? this.show.seed : 1);
      this.world = buildWorld(key, P => this.plates.props(P));
      this.world.group.add(this.plates.group);
      this.worldNode.add(this.world.group);
    }
  },

  // While a world is up the city skyline and sky go (the world has its own).
  setView(worldOn) {
    if (worldOn === this.worldOn || !this.sky) return;
    this.worldOn = worldOn;
    for (const { o } of this.sky) o.visible = !worldOn;
    if (this.world) this.world.group.visible = worldOn;
  },

  // ---- music and ambience ---------------------------------------------------------

  stopMusic() {
    const m = this.music;
    if (!m) return;
    const audioSystem = this.el.sceneEl.systems["hubs-systems"]?.audioSystem;
    for (const k of ["calm", "drive", "amb"]) {
      const a = m[k];
      if (!a) continue;
      try {
        if (a.isPlaying) a.stop();
      } catch {
        /* never started */
      }
      audioSystem?.removeAudio({ node: a });
      this.root.remove(a);
    }
    this.music = null;
  },

  startMusic(lv) {
    this.stopMusic();
    const scene = this.el.sceneEl;
    const audioSystem = scene.systems["hubs-systems"]?.audioSystem;
    if (!scene.audioListener || !audioSystem) return;
    const ctx = THREE.AudioContext.getContext();
    const key = lv.music;
    const m = { lv, g: { calm: 0, drive: 0, amb: 0 } };
    this.music = m;
    const node = buf => {
      const a = new THREE.Audio(scene.audioListener);
      a.setBuffer(buf);
      a.setLoop(true);
      a.setVolume(0);
      this.root.add(a);
      audioSystem.addAudio({ sourceType: SourceType.SFX, node: a });
      a.play();
      return a;
    };
    m.amb = node(makeAmbience(ctx, lv.amb || "night"));
    const urls = MUSIC[key] || [];
    ["calm", "drive"].forEach(async (k, i) => {
      try {
        const buf = await ctx.decodeAudioData(await (await fetch(urls[i])).arrayBuffer());
        if (this.music === m) m[k] = node(buf);
      } catch {
        /* no music: ambience only */
      }
    });
  },

  // Low under the shooting: the calm cut, the driving cut as the waves build,
  // and the world's ambience; only on the roof, faded in and out.
  updateMusic(dt, status) {
    const prefs = window.APP?.store?.state?.preferences;
    const lv = status.inRound || status.starting ? status.lv : null;
    const on = this.onRoofNow && !!lv && !prefs?.disableSoundEffects;
    if (on && (!this.music || this.music.lv !== lv)) this.startMusic(lv);
    const m = this.music;
    if (!m) return;
    // (the driving cut as the level gets busy, all of it on a double-points wave)
    const drive = status.inRound ? (status.x2 ? 1 : 0.25 + 0.5 * Math.min(1, status.w / 16)) : 0;
    const want = {
      calm: on ? (status.inRound ? 1 - 0.85 * drive : 0.6) * MUSIC_VOL : 0,
      drive: on ? drive * MUSIC_VOL : 0,
      amb: on && (status.inRound || status.starting) ? AMB_VOL : 0
    };
    const k = Math.min(1, dt / 1.2);
    let any = false;
    for (const name of ["calm", "drive", "amb"]) {
      m.g[name] += (want[name] - m.g[name]) * k;
      if (m[name]) m[name].setVolume(m.g[name]);
      if (m.g[name] > 0.002 || want[name] > 0) any = true;
    }
    if (!any && !on) this.stopMusic();
  },

  standings() {
    const me = this.myId();
    const present = window.APP?.hubChannel?.presence?.state || {};
    const rows = [{ id: me, ...this.me }];
    for (const [id, p] of this.players) {
      if (id === me || (!present[id] && Object.keys(present).length)) continue;
      rows.push({ id, ...p });
    }
    rows.sort((a, b) => b.score - a.score);
    return rows;
  },

  nameOf(id) {
    const present = window.APP?.hubChannel?.presence?.state || {};
    const n = present[id]?.metas?.[0]?.profile?.displayName;
    return String(n || (id === this.myId() ? "You" : "Guest")).slice(0, 18);
  },

  tick(time, dtMs) {
    if (!this.ready) return;
    const t0 = performance.now();
    this.step(time, dtMs);
    const ms = performance.now() - t0;
    this.stats.tickMs += ms;
    this.stats.tickMax = Math.max(this.stats.tickMax, ms);
  },

  step(time, dtMs) {
    this.subscribe();
    const dt = Math.min(0.1, (dtMs || 16) / 1000);
    const now = time / 1000;
    const T = getServerTime() / 1000;
    this.onRoofNow = this.onRoof();
    this.setSkybox(this.onRoofNow);
    // No freezing (A/X) up here with a gun, nor just after putting one down.
    if (this.held().length) this.heldAt = now;
    const noFreeze = this.onRoofNow && now - (this.heldAt || -99) < NO_FREEZE_AFTER;
    if (noFreeze !== this.el.sceneEl.is("lounge-nofreeze"))
      this.el.sceneEl[noFreeze ? "addState" : "removeState"]("lounge-nofreeze");
    const me = this.myId();
    this.active = this.guns.some(g => g.holder && (g.holder === me || now - g.heard < STALE));
    if (this.active) this.lastActive = now;
    this.advanceShow(T, now);
    let status = this.showStatus(T);
    this.status = status;
    // The level won: the team's points in it reached its goal.
    const goal = levelGoal(status.lv);
    if (status.inRound && goal && this.active && this.team() >= goal) {
      this.levelUp(T);
      status = this.status = this.showStatus(T);
    }
    // Pistols only: a long gun in your hands goes back to the wall.
    if (this.pistolsOnly()) for (const g of this.held()) if (g.type !== "pistol") this.release(g);
    // A featured level: its world round the roof (only drawn up here), the
    // clay stands put away.
    if ((status.inRound || status.starting) && this.onRoofNow) {
      this.setWorld(status.lv.world);
      this.setView(true);
    } else this.setView(false);
    if (!this._live) this._live = [];
    // (A featured round's targets fly inside its world, so only up here; no
    // clays in its 5 s countdown either.)
    const live = !this.active
      ? []
      : status.inRound
        ? this.onRoofNow
          ? liveShow(this.show, T, this._live)
          : []
        : status.starting
          ? []
          : liveLaunches(T, this._live);
    this.handleInput(now, T, live);
    this.updateGuns(now, dt);
    const stand = standAt(Math.floor(T / STAND));
    this.announce(status);
    if (!status.inRound && !status.starting && this.active && (this.lastStand !== stand.n || !this.wasActive)) {
      if (this.onRoofNow) {
        this.showBanner([stand.title], "#fff4d6", 3.5);
        this.play("bell", this.frame.toWorld(v1.set(0, 3, 2), new THREE.Vector3()), 0.5, 6);
      }
      this.lastStand = stand.n;
    }
    this.wasActive = this.active;
    this.updateTargets(T, dt, live);
    if (this.plates && this.worldOn) this.plates.update(T);
    this.updateFx(now, dt);
    this.updateMusic(dt, status);
    // Scores: at most 4 a second while shooting (full auto), and every 8 s.
    if ((this.scoreDirty && now >= (this.nextScoreSend || 0)) || now >= (this.nextScoreTell || 0)) {
      if (this.me.shots || this.me.lp) this.sendScore();
      this.scoreDirty = false;
      this.nextScoreSend = now + 0.25;
      this.nextScoreTell = now + 8;
    }
    if (now >= (this.nextBoard || 0)) {
      this.drawBoard(T, stand, status);
      this.drawPicker(status);
      this.nextBoard = now + 0.25;
    }
  }
});
