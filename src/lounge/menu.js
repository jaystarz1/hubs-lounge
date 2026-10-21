import { nightOf } from "../components/loop-animation";
import { sessionStart } from "../utils/hub-utils";

// The dinner's menu changes with the night of the week (lounge-assets
// menus.py): each night's food is its own mesh on the dinner prop rig,
// Fig_DinPropsFood_<night>, skinned to the plates' food bones. Show tonight's,
// the same night the mime's finale is picked by (loop-animation nightOf, on the
// regulars' beat of the session start; ?mimeNight= picks one).
const NIGHT_NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const PHASE = 360; // s (dinner_figures PHASE: the session start's beat)
const CHECK_EVERY = 2; // s

AFRAME.registerSystem("lounge-menu", {
  init() {
    this.meshes = null;
    this.night = -1;
    this.next = 0;
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);
  },

  remove() {
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
  },

  onSceneLoaded() {
    const envRoot = document.querySelector("#environment-root");
    this.meshes = null;
    this.night = -1;
    if (!envRoot) return;
    const found = NIGHT_NAMES.map(n => envRoot.object3D.getObjectByName(`Fig_DinPropsFood_${n}`) || null);
    if (found.some(Boolean)) {
      this.meshes = found;
      this.show(nightOf(Math.floor(sessionStart() / 1000 / PHASE) * PHASE));
    }
  },

  show(night) {
    if (night === this.night) return;
    this.night = night;
    this.meshes.forEach((m, i) => {
      if (m) m.visible = i === night;
    });
  },

  tick(time) {
    if (!this.meshes || time / 1000 < this.next) return;
    this.next = time / 1000 + CHECK_EVERY;
    this.show(nightOf(Math.floor(sessionStart() / 1000 / PHASE) * PHASE));
  }
});
