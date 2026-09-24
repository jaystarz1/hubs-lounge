import { expressionWeights } from "../lounge/social-animation.cjs";

// Voice keeps sole ownership of jawOpen. No estimated eye or face tracking.
AFRAME.registerComponent("avatar-expression", {
  init() {
    this.meshes = [];
    this.activeNames = new Set();
    this.scanAt = 0;
  },
  tock(time, dt) {
    if (time >= this.scanAt) {
      this.meshes.length = 0;
      this.el.object3D.traverse(o => {
        if (o.morphTargetDictionary && o.morphTargetInfluences) this.meshes.push(o);
      });
      this.scanAt = time + 1000;
    }
    const expression = this.el.sceneEl.systems["lounge-social"]?.expressionFor(this.el);
    const weights = expression ? expressionWeights(expression.name, expression.phase) : {};
    Object.keys(weights).forEach(name => this.activeNames.add(name));
    const k = 1 - Math.exp(-14 * Math.min((dt || 16) / 1000, 0.1));
    for (const mesh of this.meshes) {
      for (const name of this.activeNames) {
        const i = mesh.morphTargetDictionary[name];
        if (i === undefined) continue;
        const value = mesh.morphTargetInfluences[i] || 0;
        mesh.morphTargetInfluences[i] = value + ((weights[name] || 0) - value) * k;
      }
    }
  },
  remove() {
    for (const mesh of this.meshes)
      for (const name of this.activeNames) {
        const i = mesh.morphTargetDictionary[name];
        if (i !== undefined) mesh.morphTargetInfluences[i] = 0;
      }
  }
});
