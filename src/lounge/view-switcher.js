// private-quest-lounge: window views. The skyline is one cylindrical
// panorama ("ViewPano", stitched by lounge-assets/make-pano.py from the four
// directional photos with feathered seams) plus an emissive sky dome
// ("ViewSky"); images in assets/images/lounge-views/ are named
// <scene>-pano.jpg and <scene>-sky.jpg, and every scene (day, dusk, night)
// sets both at once so the whole house stays in one time of day. Each scene
// also scales the interior lighting (ambient down and the warm fixtures up
// at night) so the rooms read as evening, not a daylit house with a dark
// window. Two arrow buttons by the kitchen glass cycle scenes; flips
// broadcast so all occupants match.
import * as THREE from "three";
import { getLightLevel, onLightLevel } from "./lights";

const viewContext = require.context("../assets/images/lounge-views", false, /\.(jpe?g|png)$/);
// "-aNN" filename suffix = vertical anchor: the fraction of the image (percent
// from the top, i.e. the horizon line) to place at the centre of the band
// visible through the glass. Only meaningful for cropped flat walls; the
// panorama and sky map 1:1 (aspect null).
const WALLS = [
  { mesh: "ViewPano", dir: "pano", aspect: null },
  { mesh: "ViewSky", dir: "sky", aspect: null }
];
const SCENES = [];
for (const k of viewContext.keys().sort()) {
  const m = k.match(/^\.\/([a-z0-9]+)-(north|east|south|west|sky|pano)(?:-a(\d{1,2}))?\.(?:jpe?g|png)$/i);
  if (!m) continue;
  let sc = SCENES.find(s => s.name === m[1]);
  if (!sc) {
    sc = { name: m[1], byDir: {} };
    SCENES.push(sc);
  }
  sc.byDir[m[2]] = { url: viewContext(k), anchor: m[3] ? Number(m[3]) / 100 : 0.5 };
}
SCENES.sort((a, b) => (a.name === "day" ? -1 : b.name === "day" ? 1 : a.name.localeCompare(b.name)));

// Interior light multipliers per scene (ambient, point fixtures), relative to
// the intensities baked into the GLB.
const LIGHTING = {
  day: { ambient: 1.0, point: 1.0 },
  dusk: { ambient: 0.8, point: 1.08 },
  night: { ambient: 0.42, point: 1.25 }
};

// The mime's finale in the Rovers (lounge-assets/cafe_figures.py) takes the
// house lights down and puts him in a spotlight. The café prop rig carries a
// bone, DinCafeProps_Show, on the dinner party's session clock: its scale x is
// how far down the lights are (0.001 up .. 1 down), y that times how much of the
// spotlight there is (some numbers play in the dark or with the spot off him),
// z how black the rest of the room goes (a glow-in-the-dark number: 0.001 ..
// 1); its position is where the spotlight hangs (just above and in front of
// what it lights). Lights down: ambient and
// the other fixtures dim, the Rovers' globes dim, and the Rovers' own point
// light (Light_G) slides down to that spot with a short reach, so it lights him
// and the stage and little else. No light is added (a new light recompiles
// every shader on the headset).
const SHOW = { ambient: 0.75, others: 0.6, spotGain: 2.2, spotRange: 2.6, globes: 0.85, black: 0.92 };

// The planes span y -2.5..10.5 but the penthouse glass shows y 0..6.3; the
// centre of that visible band sits at 0.565 of the plane, from the top.
const WINDOW_CENTER = 0.565;

AFRAME.registerComponent("lounge-view-switcher", {
  init() {
    this.index = 0;
    this.textures = new Map(); // only the active scene's four textures
    this.replacedTextures = new WeakSet();
    this.materials = null; // dir -> material
    this.lights = null; // [{ light, base }]
    this.loader = new THREE.TextureLoader();

    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.offLightLevel = onLightLevel(() => this.applyLighting());
    this.revision = -1;
    this.onNetMessage = data => {
      const index = SCENES.findIndex(scene => scene.name === data?.name);
      if (index < 0 || !Number.isSafeInteger(data.revision) || data.revision < this.revision) return;
      this.revision = data.revision;
      this.setScene(index, false);
    };
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);

    // State lives in the room database, including when the room is empty.
    // Rebind after socket migration and query periodically to cover reconnects
    // and changes that arrived before the environment finished loading.
    this.subscribeTimer = setInterval(() => {
      const channel = window.APP?.hubChannel?.channel;
      if (!channel || channel.state !== "joined") return;
      if (this.channel !== channel) {
        if (this.channel) this.channel.off("lounge_view:state", this.binding);
        this.channel = channel;
        this.binding = channel.on("lounge_view:state", this.onNetMessage);
      }
      channel.push("lounge_view:get", {}).receive("ok", this.onNetMessage);
    }, 3000);
  },

  remove() {
    this.offLightLevel();
    if (this.subscribeTimer) clearInterval(this.subscribeTimer);
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    if (this.channel) this.channel.off("lounge_view:state", this.binding);
    for (const tex of this.textures.values()) tex.dispose();
    this.textures.clear();
    this.prevEl?.remove();
    this.nextEl?.remove();
  },

  onSceneLoaded() {
    const envRoot = document.querySelector("#environment-root");
    if (!envRoot) return;
    this.materials = {};
    for (const w of WALLS) {
      const mesh = envRoot.object3D.getObjectByName(w.mesh);
      if (mesh) this.materials[w.dir] = mesh.material;
      else console.warn(`lounge-view-switcher: ${w.mesh} mesh not found`);
    }
    this.lights = [];
    envRoot.object3D.traverse(o => {
      if (o.isAmbientLight || o.isPointLight) this.lights.push({ light: o, base: o.intensity });
    });
    this.showBone = envRoot.object3D.getObjectByName("DinCafeProps_Show") || null;
    this.showDim = 0;
    this.showSpot = 1;
    this.showBlack = 0;
    this.spot = null;
    for (const entry of this.lights) {
      for (let o = entry.light; o; o = o.parent) {
        if (o.name === "Light_G") {
          entry.spot = true;
          this.spot = { entry, home: entry.light.position.clone(), range: entry.light.distance };
          break;
        }
      }
    }
    this.globes = [];
    const glow = envRoot.object3D.getObjectByName("RoversGlow");
    glow?.traverse(o => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        if (m && "emissiveIntensity" in m) this.globes.push({ m, base: m.emissiveIntensity });
      }
    });
    // The GLB ships with capped placeholder textures; swap to the selected
    // directional set now.
    this.applyScene(this.index);
    if (SCENES.length > 1) this.buildButtons();
  },

  buildButtons() {
    const makeArrow = dir => {
      const el = document.createElement("a-entity");
      el.classList.add("interactable");
      el.setAttribute("is-remote-hover-target", "");
      el.setAttribute("tags", "singleActionButton: true");

      const group = new THREE.Group();
      const plate = new THREE.Mesh(
        new THREE.CircleGeometry(0.11, 24),
        new THREE.MeshBasicMaterial({ color: 0x2e2620, transparent: true, opacity: 0.75 })
      );
      group.add(plate);
      const tri = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.1, 3),
        new THREE.MeshBasicMaterial({ color: 0xffe6b0 })
      );
      tri.rotation.z = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      tri.position.z = 0.005;
      group.add(tri);

      el.setObject3D("mesh", group);
      this.el.sceneEl.appendChild(el);
      el.object3D.position.set(dir > 0 ? 3.27 : 2.73, 1.25, -9.35); // inside the kitchen glass
      el.object3D.addEventListener("interact", () => this.step(dir));
      return el;
    };
    this.prevEl = makeArrow(-1);
    this.nextEl = makeArrow(1);
  },

  step(dir) {
    const n = SCENES.length;
    this.setScene((this.index + dir + n) % n, true);
  },

  setScene(index, broadcast) {
    if (!SCENES[index]) return;
    if (broadcast) {
      const channel = window.APP?.hubChannel?.channel;
      if (!channel || channel.state !== "joined") {
        console.warn("Time of day unchanged: room is disconnected");
        return;
      }
      channel
        .push("lounge_view:set", { name: SCENES[index].name })
        .receive("ok", this.onNetMessage)
        .receive("error", error => console.warn("Time of day was not saved", error))
        .receive("timeout", () => console.warn("Time of day update timed out"));
      return;
    }
    if (index === this.index) return;
    this.index = index;
    if (!this.materials) return; // onSceneLoaded applies this pending selection.
    this.releaseInactiveTextures(index);
    this.applyScene(index);
  },

  // Time-of-day profile times the viewer's dimmer (lights.js).
  applyLighting(scene = SCENES[this.index]) {
    const profile = LIGHTING[scene?.name] || LIGHTING.day;
    const level = getLightLevel();
    const d = this.showDim || 0;
    const lit = this.showSpot ?? 1;
    const dark = 1 - SHOW.black * (this.showBlack || 0);
    for (const { light, base, spot } of this.lights || []) {
      const show = light.isAmbientLight
        ? (1 - SHOW.ambient * d) * dark
        : spot
          ? 1 + (SHOW.spotGain * lit - 1) * d
          : (1 - SHOW.others * d) * dark;
      light.intensity = base * level * (light.isAmbientLight ? profile.ambient : profile.point) * show;
    }
  },

  // The finale's lights (see SHOW): follow the show bone every frame while
  // the lights are down; nothing to do otherwise.
  tick() {
    const bone = this.showBone;
    if (!bone) return;
    const s = bone.scale.x;
    const d = Math.min(1, Math.max(0, (s - 0.001) / 0.999));
    if (d < 0.002 && (this.showDim || 0) < 0.002) return;
    this.showDim = d < 0.002 ? 0 : d;
    this.showSpot = Math.min(1, Math.max(0, bone.scale.y / Math.max(0.001, s)));
    this.showBlack = this.showDim ? Math.min(1, Math.max(0, (bone.scale.z - 0.001) / 0.999)) : 0;
    if (this.spot) {
      const light = this.spot.entry.light;
      const target = bone.getWorldPosition(this.tmp || (this.tmp = new THREE.Vector3()));
      light.parent?.updateWorldMatrix(true, false);
      const local = light.parent ? light.parent.worldToLocal(target) : target;
      light.position.copy(this.spot.home).lerp(local, this.showDim);
      light.distance = this.spot.range + (SHOW.spotRange - this.spot.range) * this.showDim;
    }
    const dark = 1 - this.showBlack;
    for (const g of this.globes) g.m.emissiveIntensity = g.base * (1 - SHOW.globes * this.showDim) * dark;
    this.applyLighting();
  },

  applyScene(index) {
    const scene = SCENES[index];
    if (!scene) return;
    this.applyLighting(scene);

    for (const w of WALLS) {
      const mat = this.materials[w.dir];
      if (!mat) continue;
      const view = scene.byDir[w.dir];
      if (!view) continue;
      this.applyTexture(index, w, view, mat);
    }
  },

  applyTexture(index, wall, view, mat) {
    const key = `${index}:${wall.dir}`;
    const cached = this.textures.get(key);
    if (cached) {
      this.assign(mat, cached);
      return;
    }
    this.loader.load(view.url, tex => {
      if (this.index !== index) {
        tex.dispose();
        return;
      }
      // Backdrop UVs follow the glTF convention (v flipped) — match it.
      tex.flipY = false;
      if ("colorSpace" in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      else tex.encoding = THREE.sRGBEncoding;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      // The 8K panorama is minified across most of the cylinder in headset;
      // plain linear sampling shimmers badly there. Mipmaps + anisotropy cost
      // about a third more GPU memory but keep the skyline crisp and stable.
      // The decoded browser image is still released right after upload.
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      const renderer = AFRAME.scenes[0]?.renderer;
      if (renderer) {
        tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      }
      // Cover-crop for this wall's plane. Horizontal overflow centres;
      // vertical overflow is positioned so the image's anchor line (the
      // horizon) lands at the centre of the band visible through the glass.
      const img = tex.image;
      const imgAspect = img.width / img.height;
      if (wall.aspect === null) {
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);
      } else if (imgAspect > wall.aspect) {
        tex.repeat.set(wall.aspect / imgAspect, 1);
        tex.offset.set((1 - tex.repeat.x) / 2, 0);
      } else {
        const ry = imgAspect / wall.aspect;
        const oy = Math.min(Math.max(view.anchor - ry * WINDOW_CENTER, 0), 1 - ry);
        tex.repeat.set(1, ry);
        tex.offset.set(0, oy);
      }
      tex.onUpdate = function () {
        tex.image = null;
        tex.onUpdate = null;
      };
      this.textures.set(key, tex);
      if (this.index === index) this.assign(mat, tex);
    });
  },

  assign(mat, tex) {
    const previous = mat.emissiveMap;
    mat.emissiveMap = tex;
    mat.needsUpdate = true;
    if (previous && previous !== tex && !this.replacedTextures.has(previous)) {
      this.replacedTextures.add(previous);
      previous.dispose();
    }
  },

  releaseInactiveTextures(activeIndex) {
    const stillAssigned = new Set(Object.values(this.materials || {}).map(mat => mat.emissiveMap));
    for (const [key, tex] of this.textures) {
      if (!key.startsWith(`${activeIndex}:`)) {
        this.textures.delete(key);
        // Keep the old wall alive only until its replacement finishes loading.
        // assign() disposes it immediately after the swap.
        if (!stillAssigned.has(tex)) tex.dispose();
      }
    }
  }
});
