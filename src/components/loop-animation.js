import { findAncestorWithComponent } from "../utils/scene-graph";
import { getServerTime } from "../phoenix-adapter";
import { sessionStart } from "../utils/hub-utils";

/**
 * Loops the given clip using this entity's animation mixer
 * @component loop-animation
 */
AFRAME.registerComponent("loop-animation", {
  schema: {
    paused: { type: "boolean", default: false },
    /* DEPRECATED: Use activeClipIndex instead since animation names are not unique */
    clip: { type: "string", default: "" },
    activeClipIndex: { type: "int", default: 0 },
    startOffset: { type: "number", default: 0 },
    timeScale: { type: "number", default: 1 },
    activeClipIndices: { type: "array" },
    // Drive the clip from the shared server clock instead of local load time,
    // so everyone in the room sees the same moment whenever they arrived.
    serverClock: { type: "boolean", default: false },
    // With serverClock: the clips play in sequence from the start of the room
    // session (the earliest joiner still present): clip k from cues[k-1] (0 for
    // the first) until cues[k], at (session time - its cue) modulo its length;
    // the last one loops on. Without cues the first clip plays once and the
    // second loops after it. A clip may be listed twice (its action is shared).
    session: { type: "boolean", default: false },
    cues: { type: "string", default: "" },
    // Session mode, phase-locked: the session is taken to have begun at the
    // last server-time multiple of phase before the earliest joiner arrived
    // (so up to one phase of the first clip has already played), which keeps
    // both clips in step from the first second with every clip looping on the
    // server clock with that period (the first clip's length must be a
    // multiple of phase). lingerAt/lingerLen/fade are no longer used.
    lingerAt: { type: "number", default: -1 },
    lingerLen: { type: "number", default: 0 },
    phase: { type: "number", default: 0 },
    fade: { type: "number", default: 2 }
  },

  init() {
    this.mixerEl = findAncestorWithComponent(this.el, "animation-mixer");
    this.currentActions = [];

    if (!this.mixerEl) {
      console.warn("loop-animation component could not find an animation-mixer in its ancestors.");
      return;
    }
  },

  update(oldData) {
    if (this.mixerEl) {
      if (oldData.clip !== this.data.clip || oldData.activeClipIndex !== this.data.activeClipIndex) {
        this.updateClip();
      }

      if (oldData.paused !== this.data.paused) {
        for (let i = 0; i < this.currentActions.length; i++) {
          this.currentActions[i].paused = this.data.paused;
        }
      }
    }
  },

  updateClip() {
    const { mixer, animations } = this.mixerEl.components["animation-mixer"];
    const { clip: clipName, activeClipIndex } = this.data;
    const { activeClipIndices } = this.data;

    if (animations.length === 0) {
      return;
    }

    let clips = [];
    if (activeClipIndices && activeClipIndices.length > 0) {
      // Support for Spoke->Hubs activeClipIndices struct
      clips = activeClipIndices.map(index => animations[index]);
    } else {
      // Support for old Spoke->Hubs { clipName, activeClipIndex } struct. Still used for Blender imports.
      if (clipName !== "") {
        const clipNames = clipName.split(",");
        for (let i = 0; i < clipNames.length; i++) {
          const n = clipNames[i];
          const a = animations.find(({ name }) => name === n);
          if (a) {
            clips.push(a);
          } else {
            console.warn(`Could not find animation named '${n}' in ${this.el.className}`);
          }
        }
      } else {
        clips = [animations[activeClipIndex]];
      }
    }

    if (!(clips && clips.length)) return;

    this.currentActions.length = 0;
    this.skipAction = null;

    for (let i = 0; i < clips.length; i++) {
      const action = mixer.clipAction(clips[i], this.el.object3D);
      action.enabled = true;
      action.time = this.data.startOffset;
      action.timeScale = this.data.timeScale;
      action.setLoop(THREE.LoopRepeat, Infinity).play();
      this.currentActions.push(action);
    }
  },

  tick() {
    if (!this.data.serverClock || this.data.paused) return;
    const seconds = getServerTime() / 1000;
    if (this.data.session && this.currentActions.length >= 2) {
      const acts = this.currentActions;
      const { phase } = this.data;
      let start = sessionStart() / 1000;
      if (phase > 0) start = Math.floor(start / phase) * phase; // (on the regulars' beat)
      const t = Math.max(0, seconds - start);
      if (this.cueText !== this.data.cues) {
        this.cueText = this.data.cues;
        this.cueList = this.data.cues
          .split(",")
          .map(Number)
          .filter(v => Number.isFinite(v) && v > 0);
      }
      const cues = this.cueList.length ? this.cueList : [acts[0].getClip().duration];
      let k = 0;
      while (k < cues.length && k < acts.length - 1 && t >= cues[k]) k++;
      const from = k === 0 ? 0 : cues[k - 1];
      const active = acts[k];
      for (const a of acts) {
        if (a !== active) a.enabled = false;
      }
      if (this.skipAction) this.skipAction.enabled = false;
      active.enabled = true;
      active.setEffectiveWeight(1);
      const d = active.getClip().duration;
      active.time = d > 0 ? (t - from) % d : 0;
      return;
    }
    for (let i = 0; i < this.currentActions.length; i++) {
      const action = this.currentActions[i];
      const duration = action.getClip().duration;
      if (duration > 0) action.time = (seconds * this.data.timeScale + this.data.startOffset) % duration;
    }
  },

  destroy() {
    for (let i = 0; i < this.currentActions.length; i++) {
      this.currentActions[i].enabled = false;
      this.currentActions[i].stop();
    }
    this.currentActions.length = 0;
    if (this.skipAction) {
      this.skipAction.enabled = false;
      this.skipAction.stop();
      this.skipAction = null;
    }
  }
});
