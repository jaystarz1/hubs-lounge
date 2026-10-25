// private-quest-lounge: Zoltar, the voice of the Mac, in the den (office).
//
// A fortune-teller cabinet in the den's south-east corner, built by
// lounge-assets/build-zoltar.py and loaded locally by every client except
// the TV feeder. Voice replies (lounge/voice-controls.js) play from his
// mouth as global, non-positional audio at one steady volume anywhere in the
// room, so you can talk to him from anywhere. Jaw flaps on a fixed beat from the moment the
// clip starts playing until it ends (zoltar-jaw.cjs); eyes,
// crystal ball and marquee bulbs glow while he speaks. The crystal ball IS the plasma globe (core
// and arcs inside its glass shell), with a violet/blue/teal mist behind him (built here in code,
// zoltar-plasma.cjs); they flare with the same loudness signal.
// Asleep, the whole case is dark: a black veil inside the front glass and black panels inside the
// side glass, bulbs/eyes/ball off. It wakes (smooth fade) when Jay starts talking to him
// (voice-controls: recorder running, reply pending) and while he speaks, holds a moment, then
// eases back to dark. Tuning: zoltar-plasma.cjs CONFIG.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { SourceType } from "../components/audio-params";
import { MAX_ANGLE, jawOpen } from "./zoltar-jaw.cjs";
import { gainFor, load, save, stepPercent } from "./zoltar-volume.cjs";
import {
  BALL_AT, BALL_R, CASE, CONFIG, createArcs, createWake, easeLevel, glowFor, sideFor, stepWake, targetLevel, veilFor
} from "./zoltar-plasma.cjs";
import URL_ZOLTAR from "../assets/models/zoltar.glb";

// Den corner (scene coords = Blender x, z, -y), turned to face the club chairs.
const SPOT = new THREE.Vector3(-0.21, 0, 6.53);
const FACING = new THREE.Vector3(-1.6, 0, 5.74);

// The mist hangs just in front of the velvet backdrop (front face z=-0.255); the plasma lives in
// the crystal ball (zoltar-plasma.cjs BALL_AT / BALL_R, the ZoltarBall node).

const MIST_VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
// Two warped noise octaves, slowly rotating about the centre, in dim violet/blue/teal. Edges fade
// to black so the quad never shows as a rectangle; additive, so black adds nothing.
const MIST_FRAG = `
uniform float uTime; uniform float uBoost; uniform float uWake; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  vec2 c = (vUv - 0.5) * vec2(1.0, 1.55);
  float r = length(c);
  float a = uTime * 0.08 + r * 2.2;
  vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * c * 3.0;
  float w = n(q + uTime * 0.05);
  float m = n(q * 1.9 - w * 1.6 - uTime * 0.07) * 0.65 + w * 0.35;
  vec3 col = mix(vec3(0.34, 0.12, 0.62), vec3(0.08, 0.22, 0.7), smoothstep(0.25, 0.65, m));
  col = mix(col, vec3(0.04, 0.55, 0.52), smoothstep(0.55, 0.85, n(q * 1.3 + 7.0 - uTime * 0.04)));
  float edge = 1.0 - smoothstep(0.5, 0.95, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0);
  float k = smoothstep(0.3, 0.8, m) * 0.5 * edge * (0.7 + 0.5 * uBoost) * uWake;
  gl_FragColor = vec4(col * k, 1.0);
}`;

// A reply arrives as a data: URL (base64 mp3) or a /lounge-voice/v1/clip/<id> URL.
async function decodeClip(src, ctx) {
  let bytes;
  if (src.startsWith("data:")) {
    const raw = atob(src.slice(src.indexOf(",") + 1));
    bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    bytes = bytes.buffer;
  } else {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`clip ${response.status}`);
    bytes = await response.arrayBuffer();
  }
  return ctx.decodeAudioData(bytes);
}

AFRAME.registerSystem("lounge-zoltar", {
  init() {
    this.level = 0;
    // Volume is ours, not Hubs' Incoming Voice Volume: that one never touches
    // this node. Persisted in localStorage; see zoltar-volume.cjs.
    const saved = load(window.localStorage);
    this.percent = saved.percent;
    this.auto = saved.auto;
    this.ambient = 0;
    this.sceneReady = () => this.load();
    this.el.addEventListener("environment-scene-loaded", this.sceneReady, { once: true });
  },

  load() {
    if (this.el.systems["lounge-tv"]?.isFeeder || this.root) return;
    new GLTFLoader().load(URL_ZOLTAR, gltf => {
      const root = gltf.scene;
      root.position.copy(SPOT);
      root.rotation.y = Math.atan2(FACING.x - SPOT.x, FACING.z - SPOT.z);
      root.traverse(o => {
        if (o.isMesh) o.material = o.material.clone();
      });
      this.parts = {};
      for (const name of ["ZoltarHead", "ZoltarJaw", "ZoltarEyes", "ZoltarBall", "ZoltarBulbs"]) {
        this.parts[name] = root.getObjectByName(name);
      }
      this.jawRest = this.parts.ZoltarJaw?.rotation.x || 0;
      this.buildAtmosphere(root);
      this.mouth = new THREE.Object3D();
      this.mouth.position.set(0, 1.55, 0.1);
      root.add(this.mouth);
      this.el.object3D.add(root);
      root.updateMatrixWorld(true);
      this.root = root;
    });
  },

  // Plasma in the crystal ball + mist + dark case panels: fixed meshes, one geometry/material each,
  // animated only through uniforms, colours and in-place buffer writes (no per-frame allocation,
  // no matrix changes). 4 draws: core+halo (2), arcs (1), mist (1), dark panels (1).
  buildAtmosphere(root) {
    const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
    const group = new THREE.Group();
    group.position.set(...BALL_AT);
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), new THREE.MeshBasicMaterial({ ...add, color: 0x000000 }));
    this.halo = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), new THREE.MeshBasicMaterial({ ...add, color: 0x000000 }));
    this.arcs = createArcs(BALL_R * 0.9);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.arcs.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("color", new THREE.BufferAttribute(this.arcs.colors, 3).setUsage(THREE.DynamicDrawUsage));
    const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ ...add, vertexColors: true }));
    lines.frustumCulled = false; // positions change in place, the static bounds would be stale
    group.add(this.core, this.halo, lines);
    for (const o of [this.core, this.halo, lines]) o.renderOrder = 1; // after the ball shell, before the dark panels
    this.arcGeo = geo;
    this.plasma = 0;
    this.plasmaLast = 0;
    this.wake = createWake();
    this.listening = this.pending = false;

    this.mistUniforms = { uTime: { value: 0 }, uBoost: { value: 0 }, uWake: { value: 0 } };
    const mist = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.9),
      new THREE.ShaderMaterial({ ...add, uniforms: this.mistUniforms, vertexShader: MIST_VERT, fragmentShader: MIST_FRAG })
    );
    mist.position.set(0, 1.4275, -0.245);
    mist.renderOrder = -1;

    // One mesh, one draw: a black veil just inside the front glass (clear when awake) and two black
    // panels just inside the side glass, so from any angle the case shows only darkness. Alpha is
    // per vertex group (aSide: 0 front veil, 1 side panels). The front glass stays in front of it.
    const { x, y0, y1, zFront, zBack } = CASE;
    const quads = [
      [[-x, y0, zFront], [x, y0, zFront], [x, y1, zFront], [-x, y1, zFront], 0],
      [[-x, y0, zBack], [-x, y0, zFront], [-x, y1, zFront], [-x, y1, zBack], 1],
      [[x, y0, zFront], [x, y0, zBack], [x, y1, zBack], [x, y1, zFront], 1]
    ];
    const pos = [], side = [], idx = [];
    quads.forEach((q, i) => {
      for (let k = 0; k < 4; k++) {
        pos.push(...q[k]);
        side.push(q[4]);
      }
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    dg.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
    dg.setIndex(idx);
    this.darkUniforms = { uVeil: { value: CONFIG.OFF_VEIL }, uSide: { value: CONFIG.OFF_VEIL } };
    const dark = new THREE.Mesh(
      dg,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: this.darkUniforms,
        vertexShader: "attribute float aSide; varying float vSide; void main(){ vSide = aSide; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: "uniform float uVeil; uniform float uSide; varying float vSide; void main(){ gl_FragColor = vec4(0.0, 0.0, 0.0, mix(uVeil, uSide, vSide)); }"
      })
    );
    dark.renderOrder = 2; // last: darkens whatever is behind the front veil
    dark.frustumCulled = false;
    this.dark = dark;
    for (const o of [group, mist, dark]) {
      o.updateMatrix();
      o.matrixAutoUpdate = false;
    }
    root.add(group, mist, dark);

    // The crystal ball becomes a glass shell around the plasma (it was an opaque blue emissive sphere).
    const ball = this.parts.ZoltarBall;
    if (ball) {
      ball.material.transparent = true;
      ball.material.opacity = 0.3;
      ball.material.depthWrite = false;
      ball.material.needsUpdate = true;
    }
  },

  // Signals from voice-controls.js: Jay's push-to-talk recording, and the wait for the reply.
  setVoiceState(listening, pending) {
    this.listening = !!listening;
    this.pending = !!pending;
  },

  // Wake: awake while Jay records, the reply is pending, or a clip plays (plus a short hold).
  // Flare eased from the same loudness that lights the eyes and ball; 0 when asleep.
  tickAtmosphere(s, talk) {
    if (!this.arcs) return;
    const dt = Math.min(0.25, Math.max(0, s - (this.plasmaLast || s)));
    this.plasmaLast = s;
    const awake = this.listening || this.pending;
    const wake = stepWake(this.wake, awake || !!this.node, dt);
    this.plasma = easeLevel(this.plasma, targetLevel(!!this.node, talk, awake), dt);
    const level = this.plasma;
    const glow = glowFor(level) * wake;
    this.arcs.update(s, dt, level, wake);
    this.arcGeo.attributes.position.needsUpdate = true;
    this.arcGeo.attributes.color.needsUpdate = true;
    this.core.material.color.setRGB(0.6 * glow + 0.3 * level * wake, 0.45 * glow + 0.3 * level * wake, glow);
    this.halo.material.color.setRGB(0.3 * glow * glow, 0.18 * glow * glow, 0.55 * glow * glow);
    this.core.visible = this.halo.visible = wake > 0;
    this.mistUniforms.uTime.value = s;
    this.mistUniforms.uBoost.value = level;
    this.mistUniforms.uWake.value = wake;
    this.darkUniforms.uVeil.value = veilFor(wake);
    this.darkUniforms.uSide.value = sideFor(wake);
    return wake;
  },

  // Play one reply clip from Zoltar. Returns the media element.
  // Replies are decoded and played as a Web Audio buffer, not an <audio> element: on the Quest,
  // Chrome hands a media element over 5 s to Android audio focus, and the Meta party call takes
  // that focus back, pausing him after half a syllable while the jaw and lights kept going.
  // Returns a handle shaped like a media element (paused / play / pause) for voice-controls.
  speak(src, onFail) {
    const scene = this.el;
    const listener = scene.audioListener;
    const audioSystem = scene.systems["hubs-systems"]?.audioSystem;
    if (!this.root || !listener || !audioSystem) {
      const el = new Audio(src);
      el.play().catch(error => onFail?.(error));
      return el;
    }
    this.stop();
    const ctx = listener.context;
    const handle = { paused: false, play: () => Promise.resolve(), pause: () => this.stop(handle) };
    this.media = handle;
    decodeClip(src, ctx)
      .then(buffer => {
        if (this.media !== handle) return; // superseded or stopped while decoding
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const node = new THREE.Audio(listener);
        node.setNodeSource(source);
        audioSystem.addAudio({ sourceType: SourceType.SFX, node });
        // Boosting past 100% would clip, so a limiter sits after the gain.
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -8;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.1;
        node.gain.disconnect();
        node.gain.connect(limiter);
        limiter.connect(audioSystem.mixer[SourceType.SFX]);
        this.limiter = limiter;
        // What actually leaves Zoltar for the room mix, logged per clip (telemetry "zoltar-clip"), so
        // "his mouth moved but I heard nothing" can be split into page silent vs. headset silent.
        this.outAnalyser = ctx.createAnalyser();
        this.outAnalyser.fftSize = 256;
        limiter.connect(this.outAnalyser);
        this.node = node;
        this.source = source;
        this.applyVolume();
        this.analyser = new THREE.AudioAnalyser(node, 256);
        source.onended = () => this.stop(handle);
        source.start();
        this.jawStart = this.clock || 0;
        this.clipStat = {
          kind: src.startsWith("data:") ? "reply" : "clip",
          started: performance.now(),
          peak: 0,
          listen: this.listening,
          len: Math.round(buffer.duration * 1000)
        };
      })
      .catch(error => {
        if (this.media === handle) this.media = null;
        onFail?.(error);
      });
    return handle;
  },

  stop(only) {
    if (only && only !== this.media) return;
    if (!this.node) {
      this.media = null; // stopped while still decoding
      return;
    }
    if (this.source) {
      this.source.onended = null;
      try {
        this.source.stop();
      } catch {
        /* already ended */
      }
    }
    const stat = this.clipStat;
    if (stat) {
      const sfx = this.el.systems["hubs-systems"]?.audioSystem?.mixer[SourceType.SFX]?.gain.value;
      this.el.systems["lounge-telemetry"]?.event("zoltar-clip", {
        kind: stat.kind,
        ms: Math.round(performance.now() - stat.started),
        len: stat.len,
        out: Math.round(stat.peak * 1000) / 1000,
        gain: Math.round(this.gain() * 100) / 100,
        sfx: sfx === undefined ? null : Math.round(sfx * 100) / 100,
        vol: this.percent,
        listen: stat.listen || this.listening,
        ctx: this.el.audioListener?.context.state
      });
    }
    this.outAnalyser?.disconnect();
    this.outAnalyser = this.clipStat = null;
    this.el.systems["hubs-systems"]?.audioSystem?.removeAudio({ node: this.node });
    this.node.disconnect?.();
    this.limiter?.disconnect();
    this.limiter = null;
    this.node.parent?.remove(this.node);
    this.node = this.source = this.media = this.analyser = this.jawStart = null;
  },

  gain() {
    return gainFor(this.percent, this.auto, this.ambient);
  },

  applyVolume() {
    this.node?.setVolume(this.gain());
  },

  changeVolume(direction) {
    this.percent = stepPercent(this.percent, direction);
    save(window.localStorage, this.percent, this.auto);
    this.applyVolume();
    return this.percent;
  },

  toggleAuto() {
    this.auto = !this.auto;
    save(window.localStorage, this.percent, this.auto);
    this.applyVolume();
    return this.auto;
  },

  // Room loudness from the headset mic, sampled only while Zoltar is silent
  // (otherwise the mic would hear him and ratchet his own volume up).
  sampleAmbient(t) {
    if (!this.auto || this.node || t - (this.lastAmbient || 0) < 250) return;
    this.lastAmbient = t;
    const track = window.APP?.mediaDevicesManager?.audioTrack;
    const ctx = this.el.audioListener?.context;
    if (!track || track.readyState !== "live" || !ctx) return;
    if (this.micTrack !== track) {
      this.micTrack = track;
      this.micAnalyser = ctx.createAnalyser();
      this.micAnalyser.fftSize = 1024;
      ctx.createMediaStreamSource(new MediaStream([track])).connect(this.micAnalyser);
      this.micBuf = new Float32Array(this.micAnalyser.fftSize);
    }
    this.micAnalyser.getFloatTimeDomainData(this.micBuf);
    let sum = 0;
    for (let i = 0; i < this.micBuf.length; i++) sum += this.micBuf[i] * this.micBuf[i];
    const rms = Math.sqrt(sum / this.micBuf.length);
    // Slow to rise and fall: a shout or a cough should not swing his volume.
    this.ambient += (rms - this.ambient) * 0.1;
  },

  tick(t) {
    if (!this.root) return;
    this.sampleAmbient(t);
    const s = t / 1000;
    this.clock = s; // scene time; the jaw flap counts from the clip's 'playing' event
    // Smoothed loudness 0..1 from the clip; 0 when silent.
    let target = 0;
    if (this.analyser) {
      const a = this.analyser.analyser;
      this.buf = this.buf || new Uint8Array(a.fftSize);
      a.getByteTimeDomainData(this.buf);
      let sum = 0;
      for (let i = 0; i < this.buf.length; i++) sum += (this.buf[i] - 128) * (this.buf[i] - 128);
      target = Math.min(1, (Math.sqrt(sum / this.buf.length) / 128) * 5);
    }
    this.level += (target - this.level) * 0.35;
    if (this.outAnalyser && this.clipStat) {
      const out = (this.outBuf = this.outBuf || new Float32Array(this.outAnalyser.fftSize));
      this.outAnalyser.getFloatTimeDomainData(out);
      let sq = 0;
      for (let i = 0; i < out.length; i++) sq += out[i] * out[i];
      this.clipStat.peak = Math.max(this.clipStat.peak, Math.sqrt(sq / out.length));
      if (this.listening) this.clipStat.listen = true;
    }
    const talk = this.level;
    const { ZoltarHead: head, ZoltarJaw: jaw, ZoltarEyes: eyes, ZoltarBall: ball, ZoltarBulbs: bulbs } = this.parts;
    if (head) {
      // Idle sway only: nothing here follows the voice, so only the jaw moves while he talks.
      head.rotation.z = Math.sin(s * 0.7) * 0.05;
      head.rotation.x = Math.sin(s * 0.45) * 0.03;
      head.rotation.y = Math.sin(s * 0.3) * 0.12;
      // Hubs freezes every loaded node (matrixAutoUpdate = false, gltf-model-plus.js): a
      // changed rotation is invisible until matrixNeedsUpdate is set. That, not the flap
      // logic, is why the jaw never moved in the room.
      head.matrixNeedsUpdate = true;
    }
    // Hinge rotation only (origin is at the jaw hinge): ~1.3 cm at the lip, never a slide.
    if (jaw) {
      const open = jawOpen(this.jawStart, s);
      jaw.rotation.x = this.jawRest + MAX_ANGLE * open;
      jaw.matrixNeedsUpdate = true;
    }
    const wake = this.tickAtmosphere(s, talk) || 0;
    if (eyes) eyes.material.emissiveIntensity = (0.6 + 3.5 * talk) * wake;
    if (ball) ball.material.emissiveIntensity = (0.8 + 0.3 * Math.sin(s * 1.6) + 2.5 * talk) * wake;
    if (bulbs) bulbs.material.emissiveIntensity = (1.2 + 0.5 * Math.sin(s * (this.node ? 9 : 2))) * wake;
  }
});
