import { Reflector } from "three/examples/jsm/objects/Reflector";

const DEFAULT_MIRROR_GEOMETRY = new THREE.PlaneBufferGeometry();
const DEFAULT_TEXTURE_WIDTH = window.innerWidth * window.devicePixelRatio;
const DEFAULT_TEXTURE_HEIGHT = window.innerHeight * window.devicePixelRatio;

import { Layers } from "../camera-layers";

const REACH = 8; // m, level distance from the mirror
const REACH_UP = 2.5; // m, height difference (one floor)
const mirrorPos = new THREE.Vector3();
const eyePos = new THREE.Vector3();
function mirrorInReach(reflector, camera) {
  mirrorPos.setFromMatrixPosition(reflector.matrixWorld);
  eyePos.setFromMatrixPosition(camera.matrixWorld);
  const dy = eyePos.y - mirrorPos.y;
  return Math.abs(dy) < REACH_UP && Math.hypot(eyePos.x - mirrorPos.x, eyePos.z - mirrorPos.z) < REACH;
}

/**
 * Should need to entity that has geometry primitive
 *
 * @example
 * ```html
 * <a-plane mirror scale="5 5 5" position="0 3 0"></a-plane>
 * <a-circle mirror="color: #7f7f7f" scale="5 5 5" position="0 3 0"></a-circle>
 * ```
 */
AFRAME.registerComponent("mirror", {
  schema: {
    color: { type: "color", default: "#7f7f7f" }
  },

  init() {
    const geometry = this.el.object3DMap?.mesh?.geometry || DEFAULT_MIRROR_GEOMETRY;
    const reflector = new Reflector(geometry, {
      color: this.data.color,
      textureWidth: DEFAULT_TEXTURE_WIDTH,
      textureHeight: DEFAULT_TEXTURE_HEIGHT
    });
    this.el.setObject3D("mesh", reflector);

    // HACK the first time we render this, add the appropriate camera layers to the virtual camera
    // The reflection is a second render of the whole scene (once per eye in VR)
    // whenever the mirror is in the view frustum, walls and floors or not, so it
    // only renders for a viewer near it on its own floor.
    const originalOnBeforeRender = reflector.onBeforeRender;
    let layersSet = false;
    reflector.onBeforeRender = function (renderer, scene, camera, ...rest) {
      if (!mirrorInReach(reflector, camera)) return;
      if (layersSet) return originalOnBeforeRender(renderer, scene, camera, ...rest);
      const originalRender = renderer.render;
      renderer.render = function (scene, camera) {
        camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
        camera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
        layersSet = true;
        originalRender.call(renderer, scene, camera);
      };
      originalOnBeforeRender(renderer, scene, camera, ...rest);
      renderer.render = originalRender;
    };
  }
});
