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
    // With serverClock: the first clip plays once from the start of the room
    // session (the earliest joiner still present), the second loops after it.
    session: { type: "boolean", default: false },
    // Session mode, phase-locked: part of the first clip's window
    // [lingerAt, lingerAt + lingerLen) is skipped (cross-faded over fade s) so
    // the first clip always ends on a server-time multiple of phase; the loop
    // after it then runs in step with every clip looping on the server clock
    // with that period (the first clip's length must be a multiple of phase).
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
    if (this.data.session && this.data.lingerLen > 0 && this.data.phase > 0 && clips.length >= 2) {
      // A second copy of the first clip to cross-fade across the skipped part.
      const copy = mixer.clipAction(clips[0].clone(), this.el.object3D);
      copy.enabled = false;
      copy.setLoop(THREE.LoopRepeat, Infinity).play();
      this.skipAction = copy;
    }
  },

  tick() {
    if (!this.data.serverClock || this.data.paused) return;
    const seconds = getServerTime() / 1000;
    if (this.data.session && this.currentActions.length >= 2) {
      const [once, loop] = this.currentActions;
      const start = sessionStart() / 1000;
      const t = Math.max(0, seconds - start);
      const first = once.getClip().duration;
      const copy = this.skipAction;
      // How much of the linger window to skip, so the first clip ends at a
      // server time that is a whole number of phases.
      let skip = 0;
      let cut = Infinity;
      const { lingerAt, lingerLen, phase, fade } = this.data;
      if (copy && phase > 0 && lingerAt >= 0) {
        const keep = ((-(start + first) % phase) + phase) % phase; // seconds of the window that are played
        skip = Math.max(0, lingerLen - keep);
        cut = lingerAt + keep;
      }
      const end = first - skip;
      const inFirst = t < end;
      loop.enabled = !inFirst;
      if (!inFirst) {
        once.enabled = false;
        if (copy) copy.enabled = false;
        const d = loop.getClip().duration;
        if (d > 0) loop.time = (t - end) % d;
        loop.setEffectiveWeight(1);
        return;
      }
      if (t < cut) {
        once.enabled = true;
        once.time = t;
        once.setEffectiveWeight(1);
        if (copy) copy.enabled = false;
      } else if (copy && t < cut + fade) {
        // Cross-fade from where the clip is to where it jumps to.
        const s = (t - cut) / fade;
        const w = s * s * (3 - 2 * s);
        once.enabled = true;
        once.time = t;
        once.setEffectiveWeight(1 - w);
        copy.enabled = true;
        copy.time = t + skip;
        copy.setEffectiveWeight(w);
      } else {
        once.enabled = true;
        once.time = t + skip;
        once.setEffectiveWeight(1);
        if (copy) copy.enabled = false;
      }
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
