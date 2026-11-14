// private-quest-lounge: per-room visibility (Jay, 2026-11-14: 19 fps on the TV-room
// sofa). three.js only skips what is outside the view frustum, walls or not, so
// from the sofa a headset drew the dining room, the cafe, the pub, the bedrooms
// and the roof range through the walls: 230 draw calls per eye facing the window
// wall, 870 facing across the penthouse.
//
// While your head is in a baked room ("zone"), anything that cannot be seen from
// anywhere in that room is not drawn. What can be seen is baked from the live
// room by tests/bake-visibility.cjs into room-visibility.json, and
// tests/visibility-check.cjs proves by rendering that a culled view and a full
// view are the same picture. The rules are in visibility-core.cjs.
//
// REBAKE after any change to the room model or to a zone:
//   node tests/bake-visibility.cjs "$(grep ^LOUNGE_PIN= .env | cut -d= -f2-)" bake
//   node tests/visibility-check.cjs "$(grep ^LOUNGE_PIN= .env | cut -d= -f2-)" 400
// A stale bake is safe for moved things (a static object that is not where it was
// baked is judged by the space it is in), but a NEW wall opening is not known
// until the rebake. Zones: tests/visibility-zones.json (TV room so far).
//
// Off while the REC camera is rolling (it films from somewhere else), for the TV
// feeder client, and with ?nocull in the address (to compare in a headset).
import data from "./room-visibility.json";
import { createVisibility } from "./visibility-core.cjs";

const STEP_MS = 200; // one fifth of the scenery is re-checked per step
const COLLECT_MS = 3000; // pick up things made since

AFRAME.registerSystem("lounge-visibility", {
  init() {
    this.off = /[?&]nocull\b/.test(location.search);
    this.vis = createVisibility(THREE, data);
    this.head = new THREE.Vector3();
    this.nextStep = 0;
    this.nextCollect = 0;
    this.stats = this.vis.stats;
  },

  tick(t) {
    if (t < this.nextStep) return;
    this.nextStep = t + STEP_MS;
    const scene = this.el;
    const camera = scene.camera;
    const env = document.getElementById("environment-scene")?.object3D;
    if (!camera || !env) return;
    if (t >= this.nextCollect) {
      this.nextCollect = t + COLLECT_MS;
      this.vis.collect(env, [scene.systems["lounge-skeet"]?.root, scene.systems["lounge-zoltar"]?.root]);
    }
    const idle = this.off || scene.systems["lounge-tv"]?.isFeeder || scene.systems["lounge-record"]?.rec?.active;
    // The eye that is rendering (in a headset three.js keeps this at the head pose).
    this.vis.step(idle ? null : this.head.setFromMatrixPosition(camera.matrixWorld));
  }
});
