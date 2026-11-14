import * as THREE from "three";

// Field telemetry (Jay, 2026-10-20: "put some trackers on to see what happens
// during actual use"). Every client keeps a one-second sample of how the room
// is running for it: frame rate and the worst frames, long tasks, draw calls,
// memory, the audio clock (an AudioContext whose clock stops or crawls while
// "running" is the sound going off), the lounge socket and the voice
// transports, the range's own work (its tick time, messages, shots, sounds,
// voices cut) and which guns are up, its own and other people's. Hitches,
// audio stalls, connection changes and script errors are also logged as
// events the moment they happen. Batches go every 15 s (and on leaving) to
// /_lounge/telemetry on the asset host, which appends them to
// services/hubs/telemetry/<day>.jsonl; bin/telemetry reads them back.
//
// Also per sample since 2026-11-14: head yaw/pitch, the visibility zone and how many
// things it is skipping; and every 30 s a "draws" event, one frame's draw calls by group
// (note: a counted frame covers one to two frames of calls, compare the proportions).
const SAMPLE_EVERY = 1000; // ms
const POST_EVERY = 15000; // ms
const KEEP = 900; // records held while posts fail
const SLOW_FRAME = 34; // ms, under 30 fps
const HITCH = 250; // ms, a frame this long is logged as an event
const AUDIO_SLOW = 0.8; // audio clock / wall clock below this while running = stalled
const MAX_ERRORS = 20; // per minute
const DRAWS_EVERY = 30; // samples between per-group draw-call counts

function postUrl() {
  const s = [...document.scripts].find(x => /\/_lounge\/runtime\.js$/.test(x.src));
  return s ? new URL("/_lounge/telemetry", s.src).href : null;
}

AFRAME.registerSystem("lounge-telemetry", {
  init() {
    this.url = postUrl();
    if (!this.url) return; // (local dev: no access gate, nowhere to send)
    this.session = Math.random().toString(36).slice(2, 10);
    this.queue = [];
    this.frame = { n: 0, worst: 0, slow: 0, last: 0 };
    this.longTasks = { n: 0, ms: 0 };
    this.errors = { n: 0, minute: 0 };
    this.last = {};
    this.audioMark = null;
    this.drawTick = 0;
    try {
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          this.longTasks.n++;
          this.longTasks.ms += e.duration;
        }
      }).observe({ type: "longtask", buffered: false });
    } catch {
      /* no long task timing */
    }
    window.addEventListener("error", e => this.error(e.message || String(e.error), e.filename, e.lineno));
    window.addEventListener("unhandledrejection", e => this.error(String(e.reason?.stack || e.reason)));
    document.addEventListener("visibilitychange", () => this.event("visibility", { hidden: document.hidden }));
    // Why a page went away: a reload from inside VR shows as pagehide with vr true and a
    // new session seconds later (the wall RELOAD button logs itself first, tv-controls.js).
    window.addEventListener("pagehide", e => {
      this.event("pagehide", {
        vr: this.el.sceneEl.is("vr-mode"),
        persisted: e.persisted,
        up: Math.round(performance.now() / 1000)
      });
      this.flush(true);
    });
    const scene = this.el.sceneEl;
    scene.addEventListener("enter-vr", () => {
      this.event("enter-vr");
      // The headset's own view of the session: "visible-blurred" or "hidden" is a system
      // overlay over the room (an incoming call, the Meta menu), which document.hidden misses.
      const session = scene.renderer?.xr?.getSession?.();
      if (session && session !== this.xrSession) {
        this.xrSession = session;
        session.addEventListener("visibilitychange", () =>
          this.event("xr-visibility", { state: session.visibilityState })
        );
      }
    });
    scene.addEventListener("exit-vr", () => this.event("exit-vr"));
    // Why a headset left the room, and the A/X freeze that shows the leave button.
    scene.addEventListener("leave_room_requested", () => this.event("leave", { via: "leave-room button" }));
    scene.addEventListener("hub_closed", () => this.event("leave", { via: "room closed" }));
    scene.addEventListener("stateadded", e => e.detail === "frozen" && this.event("frozen"));
    scene.addEventListener("stateremoved", e => e.detail === "frozen" && this.event("thawed"));
    this.event("start", { ua: navigator.userAgent, path: location.pathname });
    // How long the room took to load, and whether the big files came from the
    // browser's cache (wire 0) or down the line again: "load", once per page.
    scene.addEventListener(
      "environment-scene-loaded",
      () => {
        const mb = n => Math.round(n / 1e5) / 10;
        const sum = { model: [0, 0], js: [0, 0], audio: [0, 0] };
        for (const e of performance.getEntriesByType("resource")) {
          const k = /\.glb/.test(e.name) ? "model" : /\.js/.test(e.name) ? "js" : /\.mp3/.test(e.name) ? "audio" : null;
          if (!k) continue;
          sum[k][0] += e.encodedBodySize;
          sum[k][1] += e.transferSize;
        }
        const room = performance.getEntriesByType("resource").find(e => /lounge-[0-9a-f]+\.+glb/.test(e.name));
        this.event("load", {
          s: Math.round(performance.now() / 100) / 10,
          modelS: room ? Math.round(room.duration / 100) / 10 : undefined,
          modelMB: mb(sum.model[0]),
          modelWire: mb(sum.model[1]),
          jsMB: mb(sum.js[0]),
          jsWire: mb(sum.js[1]),
          audioMB: mb(sum.audio[0])
        });
      },
      { once: true }
    );
    this.sampler = setInterval(() => this.sample(), SAMPLE_EVERY);
    this.poster = setInterval(() => this.flush(false), POST_EVERY);
  },

  remove() {
    clearInterval(this.sampler);
    clearInterval(this.poster);
  },

  tick() {
    if (!this.url) return;
    const t = performance.now();
    const f = this.frame;
    if (f.last && !document.hidden) {
      const gap = t - f.last;
      f.n++;
      f.worst = Math.max(f.worst, gap);
      if (gap > SLOW_FRAME) f.slow++;
      if (gap > HITCH) this.event("hitch", { ms: Math.round(gap) });
    }
    f.last = t;
    // A draw count (countDraws) covers whole frames: started mid-frame, so end it
    // on the second tick after, when one full frame has been drawn in between.
    if (this.endCount && ++this.countFrames >= 2) this.endCount();
  },

  push(rec) {
    this.queue.push(rec);
    if (this.queue.length > KEEP) this.queue.splice(0, this.queue.length - KEEP);
  },

  event(k, data = {}) {
    this.push({ e: k, t: Date.now(), ...data });
  },

  error(msg, file, line) {
    const minute = Math.floor(Date.now() / 60000);
    if (minute !== this.errors.minute) this.errors = { n: 0, minute };
    if (++this.errors.n > MAX_ERRORS) return;
    this.event("error", { msg: String(msg).slice(0, 400), at: file ? `${file.split("/").pop()}:${line}` : undefined });
  },

  // Changes worth an event of their own (state strings compared sample to sample).
  watch(key, value) {
    if (this.last[key] !== undefined && this.last[key] !== value) this.event(key, { from: this.last[key], to: value });
    this.last[key] = value;
  },

  sample() {
    const scene = this.el.sceneEl;
    const now = performance.now();
    const f = this.frame;
    const s = { t: Date.now(), fps: f.n, worst: Math.round(f.worst), slow: f.slow };
    this.frame = { n: 0, worst: 0, slow: 0, last: f.last };
    s.lt = this.longTasks.n;
    s.ltMs = Math.round(this.longTasks.ms);
    this.longTasks = { n: 0, ms: 0 };
    s.vr = scene.is("vr-mode") ? 1 : 0;
    s.hidden = document.hidden ? 1 : 0;
    const r = scene.renderer;
    if (r) {
      s.calls = r.info.render.calls;
      s.tris = r.info.render.triangles;
      s.geo = r.info.memory.geometries;
      s.tex = r.info.memory.textures;
      s.xrHz = r.xr?.getSession?.()?.frameRate || undefined;
    }
    if (performance.memory) s.heap = Math.round(performance.memory.usedJSHeapSize / 1048576);
    // The audio clock: running but not keeping up with the wall = no sound.
    try {
      const ctx = THREE.AudioContext.getContext();
      s.audio = ctx.state;
      if (this.audioMark) {
        const rate = (ctx.currentTime - this.audioMark.a) / ((now - this.audioMark.w) / 1000);
        s.aRate = Math.round(rate * 100) / 100;
        this.watch("audio-stall", ctx.state === "running" && rate < AUDIO_SLOW);
      }
      this.audioMark = { a: ctx.currentTime, w: now };
      this.watch("audio-state", ctx.state);
    } catch {
      /* no audio */
    }
    const app = window.APP;
    s.sock = app?.hubChannel?.channel?.socket?.connectionState?.();
    s.send = app?.dialog?._sendTransport?.connectionState;
    s.recv = app?.dialog?._recvTransport?.connectionState;
    s.peers = Object.keys(app?.hubChannel?.presence?.state || {}).length;
    for (const k of ["sock", "send", "recv"]) this.watch(k, s[k]);
    // The microphone track: a call taking the mic shows as muted or ended.
    const mic = app?.dialog?._localMediaStream?.getAudioTracks?.()[0];
    if (mic) this.watch("mic", `${mic.readyState}${mic.muted ? " muted" : ""}${mic.enabled ? "" : " off"}`);
    const pov = document.getElementById("avatar-pov-node")?.object3D;
    if (pov)
      s.pos = pov
        .getWorldPosition(new THREE.Vector3())
        .toArray()
        .map(n => Math.round(n * 10) / 10);
    // Which way the head points (degrees, 0 = -z, turning left is positive; pitch up
    // is positive). What gets drawn depends on it: three.js culls by view frustum only.
    const cam = scene.camera;
    if (cam) {
      const e = cam.matrixWorld.elements;
      s.yaw = Math.round((Math.atan2(e[8], e[10]) * 180) / Math.PI);
      s.pitch = Math.round((Math.asin(Math.max(-1, Math.min(1, -e[9]))) * 180) / Math.PI);
    }
    // Per-room visibility (visibility.js): the room it is culling for, things skipped.
    const vis = scene.systems["lounge-visibility"];
    if (vis) {
      s.zone = vis.stats.zone || undefined;
      s.cull = vis.stats.culled;
    }
    // Every 30 s, one frame's draw calls by what they belong to.
    if (r && ++this.drawTick % DRAWS_EVERY === 0) this.countDraws(r);
    // The range.
    const sk = scene.systems["lounge-skeet"];
    if (sk?.ready) {
      const st = sk.stats;
      Object.assign(s, {
        roof: sk.onRoofNow ? 1 : 0,
        skMs: Math.round(st.tickMs),
        skMax: Math.round(st.tickMax * 10) / 10,
        out: st.sent,
        in: st.heard,
        shots: st.shots,
        shotsIn: st.shotsHeard,
        snd: st.sounds,
        cut: st.cut,
        voices: sk.voices.filter(v => v.isPlaying).length,
        debris: sk.debris.length,
        tgts: sk.targets.size
      });
      for (const k of Object.keys(st)) st[k] = 0;
      const me = sk.myId();
      const mine = sk.held().map(g => g.type);
      const theirs = sk.guns.filter(g => g.holder && g.holder !== me).map(g => g.type);
      if (mine.length) s.mine = mine;
      if (theirs.length) s.theirs = theirs;
      this.watch("guns", `${mine.join("+")}|${theirs.join("+")}`);
      if (sk.show) s.show = sk.show.sc;
    }
    // The room sound (ambience.js): which zone you're in, sounds playing.
    const amb = scene.systems["lounge-ambience"];
    if (amb?.ready) {
      s.amb = amb.stats.zone;
      s.ambV = amb.stats.voices;
      s.ambBeds = amb.stats.beds;
    }
    this.push(s);
  },

  // Wraps the renderer's draw for exactly one frame and logs a "draws" event:
  // calls per group (room model static / figures, range, Zoltar, avatars, other).
  countDraws(renderer) {
    if (this.counting) return;
    const scene = this.el.sceneEl;
    const roots = [
      ["room", document.getElementById("environment-scene")?.object3D],
      ["range", scene.systems["lounge-skeet"]?.root],
      ["zoltar", scene.systems["lounge-zoltar"]?.root]
    ];
    const group = object => {
      for (let p = object; p; p = p.parent) {
        for (const [name, root] of roots)
          if (p === root) return name === "room" && object.isSkinnedMesh ? "figures" : name;
        if (p.el?.components?.["player-info"] || p.el?.id === "avatar-rig") return "avatars";
      }
      return "other";
    };
    const tally = {};
    const original = renderer.renderBufferDirect;
    this.counting = true;
    renderer.renderBufferDirect = function (camera, sc, geometry, material, object) {
      const k = group(object);
      tally[k] = (tally[k] || 0) + 1;
      return original.apply(this, arguments);
    };
    this.endCount = () => {
      renderer.renderBufferDirect = original;
      this.counting = false;
      this.endCount = null;
      this.event("draws", { ...tally, zone: scene.systems["lounge-visibility"]?.stats.zone || undefined });
    };
    this.countFrames = 0;
  },

  flush(leaving) {
    if (!this.queue.length) return;
    const recs = this.queue;
    this.queue = [];
    const body = JSON.stringify({
      session: this.session,
      client: window.NAF?.clientId || "",
      name: window.APP?.store?.state?.profile?.displayName || "",
      recs
    });
    if (leaving && navigator.sendBeacon) {
      navigator.sendBeacon(this.url, new Blob([body], { type: "text/plain" }));
      return;
    }
    fetch(this.url, { method: "POST", body, credentials: "include", headers: { "Content-Type": "text/plain" } })
      .then(res => {
        if (!res.ok) throw new Error(res.status);
      })
      .catch(() => {
        // Keep them for the next try (newest win if it never comes back).
        this.queue = recs.concat(this.queue).slice(-KEEP);
      });
  }
});
