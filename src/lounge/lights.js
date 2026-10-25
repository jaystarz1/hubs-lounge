// private-quest-lounge: room light dimmer.
//
// A LIGHTS button beside the wall TV opens a ten-step slider (10-100 %).
// While the TV shows live video the room dims to 50 % automatically, then
// returns to the viewer's own level when the screen stops. Changing the
// slider during a show keeps that choice until the show ends. The level is
// per viewer (it only changes this headset's rendering) and is remembered.
// view-switcher.js multiplies its day/dusk/night profile by this level.
import * as THREE from "three";
import { label } from "./tv-controls";

const KEY = "lounge-lights-v1";
const TV_LEVEL = 0.5;
const STEPS = 10;

let userLevel = 1;
try {
  const saved = Number(localStorage.getItem(KEY));
  if (saved >= 0.1 && saved <= 1) userLevel = saved;
} catch {
  /* storage unavailable: start at full brightness */
}
let showLevel = null; // level in force while the TV is live, if any
let scriptLevel = null; // a mystery's blackout (lounge/mystery.js), over everything else
const listeners = new Set();

export function getLightLevel() {
  return scriptLevel ?? showLevel ?? userLevel;
}

// The lights as a mystery's script says (a blackout, a flicker): null gives
// them back to the viewer's own level.
export function setScriptLevel(level) {
  if (level === scriptLevel) return;
  scriptLevel = level;
  listeners.forEach(fn => fn(getLightLevel()));
}

export function onLightLevel(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach(fn => fn(getLightLevel()));
}

export function setLightLevel(level) {
  level = Math.round(Math.min(1, Math.max(0.1, level)) * STEPS) / STEPS;
  if (showLevel !== null) showLevel = level;
  else {
    userLevel = level;
    try {
      localStorage.setItem(KEY, String(level));
    } catch {
      /* session only */
    }
  }
  emit();
}

export function setTvLive(live) {
  if (live === (showLevel !== null)) return;
  showLevel = live ? Math.min(TV_LEVEL, userLevel) : null;
  emit();
}

export class LightsPanel {
  constructor(scene, screen) {
    this.scene = scene;
    this.anchor = screen.getWorldPosition(new THREE.Vector3());
    this.rotation = screen.getWorldQuaternion(new THREE.Quaternion());
    this.segments = null;
    this.button = label(scene, this.anchor, this.rotation, -1.65, 0.6, 0.5, 0.2, this.buttonText(), () =>
      this.toggle()
    );
    this.unsubscribe = onLightLevel(() => this.redraw());
  }
  buttonText() {
    const pct = Math.round(getLightLevel() * 100);
    return [`LIGHTS ${pct}%${showLevel !== null ? " TV" : ""}`];
  }
  toggle() {
    if (this.segments) {
      this.segments.forEach(item => item.remove());
      this.segments = null;
      return;
    }
    // Horizontal slider on the flat wall above the TV, centred on it (the
    // sconces sit 1.65 m either side, the chimney breast starts 1.96 m left).
    // Left step is 10 %, right is 100 %.
    this.segments = [];
    for (let i = 0; i < STEPS; i++) {
      const level = (i + 1) / STEPS;
      const item = label(this.scene, this.anchor, this.rotation, (i - 4.5) * 0.22, 0.95, 0.2, 0.12, [""], () =>
        setLightLevel(level)
      );
      item.level = level;
      this.segments.push(item);
    }
    this.redraw();
  }
  redraw() {
    this.button.draw(this.buttonText());
    const current = getLightLevel();
    this.segments?.forEach(item => {
      const on = item.level <= current + 1e-6;
      item.draw([on ? `${Math.round(item.level * 100)}` : "·"], false, on ? "#f2c46b" : "#202a30");
    });
  }
  remove() {
    this.unsubscribe();
    this.button.remove();
    this.segments?.forEach(item => item.remove());
  }
}
