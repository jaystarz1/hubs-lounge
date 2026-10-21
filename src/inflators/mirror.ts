import { addComponent } from "bitecs";
import { PlaneGeometry, Vector3 } from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import { addObject3DComponent } from "../utils/jsx-entity";
import { Mirror } from "../bit-components";
import { HubsWorld } from "../app";
import { Layers } from "../camera-layers";

const DEFAULT_MIRROR_GEOMETRY = new PlaneGeometry();
// We may need to revisit the default texture size
// because the full window resolution may be too huge.
const DEFAULT_TEXTURE_WIDTH = window.innerWidth * window.devicePixelRatio;
const DEFAULT_TEXTURE_HEIGHT = window.innerHeight * window.devicePixelRatio;

const REACH = 8; // m, level distance from the mirror
const REACH_UP = 2.5; // m, height difference (one floor)
const mirrorPos = new Vector3();
const eyePos = new Vector3();
function mirrorInReach(reflector: Reflector, camera: any) {
  mirrorPos.setFromMatrixPosition(reflector.matrixWorld);
  eyePos.setFromMatrixPosition(camera.matrixWorld);
  const dy = eyePos.y - mirrorPos.y;
  return Math.abs(dy) < REACH_UP && Math.hypot(eyePos.x - mirrorPos.x, eyePos.z - mirrorPos.z) < REACH;
}

export type MirrorParams = {
  color?: string;
};

const DEFAULTS = {
  color: "#7f7f7f"
};

export function inflateMirror(world: HubsWorld, eid: number, params: MirrorParams) {
  params = Object.assign({}, DEFAULTS, params);
  const geometry = DEFAULT_MIRROR_GEOMETRY;
  const reflector = new Reflector(geometry, {
    color: params.color,
    textureWidth: DEFAULT_TEXTURE_WIDTH,
    textureHeight: DEFAULT_TEXTURE_HEIGHT
  });

  // HACK the first time we render this, add the appropriate camera layers
  // to the virtual camera. There is no other way to easily access camera
  // used for Reflector. We may remove with Three.js r149 or newer because
  // Reflector will expose camera.
  // The reflection is a second render of the whole scene (once per eye in VR)
  // whenever the mirror is in the view frustum, walls and floors or not, so it
  // only renders for a viewer near it on its own floor.
  const originalOnBeforeRender = reflector.onBeforeRender;
  let layersSet = false;
  reflector.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
    if (!mirrorInReach(reflector, camera)) return;
    if (layersSet) return originalOnBeforeRender(renderer, scene, camera, geometry, material, group);
    const originalRender = renderer.render;
    renderer.render = function (scene, camera) {
      camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
      camera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
      layersSet = true;
      originalRender.call(renderer, scene, camera);
    };
    originalOnBeforeRender(renderer, scene, camera, geometry, material, group);
    renderer.render = originalRender;
  };

  addObject3DComponent(world, eid, reflector);
  addComponent(world, Mirror, eid);
  return eid;
}
