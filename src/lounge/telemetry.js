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
const SAMPLE_EVERY = 1000; // ms
const POST_EVERY = 15000; // ms
const KEEP = 900; // records held while posts fail
const SLOW_FRAME = 34; // ms, under 30 fps
const HITCH = 250; // ms, a frame this long is logged as an event
const AUDIO_SLOW = 0.8; // audio clock / wall clock below this while running = stalled
const MAX_ERRORS = 20; // per minute

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
    window.addEventListener("pagehide", () => this.flush(true));
    const scene = this.el.sceneEl;
    scene.addEventListener("enter-vr", () => this.event("enter-vr"));
    scene.addEventListener("exit-vr", () => this.event("exit-vr"));
    // Why a headset left the room, and the A/X freeze that shows the leave button.
    scene.addEventListener("leave_room_requested", () => this.event("leave", { via: "leave-room button" }));
    scene.addEventListener("hub_closed", () => this.event("leave", { via: "room closed" }));
    scene.addEventListener("stateadded", e => e.detail === "frozen" && this.event("frozen"));
    scene.addEventListener("stateremoved", e => e.detail === "frozen" && this.event("thawed"));
    this.event("start", { ua: navigator.userAgent, path: location.pathname });
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
    const pov = document.getElementById("avatar-pov-node")?.object3D;
    if (pov)
      s.pos = pov
        .getWorldPosition(new THREE.Vector3())
        .toArray()
        .map(n => Math.round(n * 10) / 10);
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
