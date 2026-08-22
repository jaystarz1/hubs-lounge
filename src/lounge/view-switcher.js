// private-quest-lounge: directional window views. Each of the four backdrop
// planes (north/east/south/west) has its own emissive material; images in
// assets/images/lounge-views/ are named <scene>-<direction>-aNN.jpg and every
// scene (day, dusk, ...) sets all four walls at once, so the whole house stays
// in one time of day but each compass direction shows what it should — Central
// Park north, East River east, Hudson west, Midtown south. Two arrow buttons
// by the kitchen glass cycle scenes; flips broadcast so all occupants match.
import * as THREE from "three";

const viewContext = require.context("../assets/images/lounge-views", false, /\.(jpe?g|png)$/);
// "-aNN" filename suffix = vertical anchor: the fraction of the image (percent
// from the top, i.e. the horizon line) to place at the centre of the band
// visible through the glass. Defaults to 50 (image centre).
const WALLS = [
  { mesh: "RockiesView", dir: "north", aspect: 26 / 13 },
  { mesh: "ViewEast", dir: "east", aspect: 30 / 13 },
  { mesh: "ViewWest", dir: "west", aspect: 30 / 13 },
  { mesh: "ViewSouth", dir: "south", aspect: 30 / 13 }
];
const SCENES = [];
for (const k of viewContext.keys().sort()) {
  const m = k.match(/^\.\/([a-z0-9]+)-(north|east|south|west)(?:-a(\d{1,2}))?\.(?:jpe?g|png)$/i);
  if (!m) continue;
  let sc = SCENES.find(s => s.name === m[1]);
  if (!sc) {
    sc = { name: m[1], byDir: {} };
    SCENES.push(sc);
  }
  sc.byDir[m[2]] = { url: viewContext(k), anchor: m[3] ? Number(m[3]) / 100 : 0.5 };
}
SCENES.sort((a, b) => (a.name === "day" ? -1 : b.name === "day" ? 1 : a.name.localeCompare(b.name)));

const CHANNEL = "lounge_view";
// The planes span y -2.5..10.5 but the penthouse glass shows y 0..6.3; the
// centre of that visible band sits at 0.565 of the plane, from the top.
const WINDOW_CENTER = 0.565;

AFRAME.registerComponent("lounge-view-switcher", {
  init() {
    this.index = 0;
    this.textures = new Map(); // only the active scene's four textures
    this.replacedTextures = new WeakSet();
    this.materials = null; // dir -> material
    this.loader = new THREE.TextureLoader();

    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.onNetMessage = (_fromId, _type, data) => {
      if (data && typeof data.index === "number") this.setScene(data.index, false);
    };
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);

    // NAF.connection.adapter appears only after the room connects; poll briefly.
    this.subscribeTimer = setInterval(() => {
      if (window.NAF && NAF.connection && NAF.connection.adapter) {
        clearInterval(this.subscribeTimer);
        this.subscribeTimer = null;
        NAF.connection.subscribeToDataChannel(CHANNEL, this.onNetMessage);
      }
    }, 1000);
  },

  remove() {
    if (this.subscribeTimer) clearInterval(this.subscribeTimer);
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    try {
      NAF.connection.unsubscribeToDataChannel(CHANNEL, this.onNetMessage);
    } catch {
      /* not connected */
    }
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
    if (!this.materials || index === this.index || !SCENES[index]) return;
    this.index = index;
    this.releaseInactiveTextures(index);
    this.applyScene(index);
    if (broadcast) {
      try {
        NAF.connection.broadcastDataGuaranteed(CHANNEL, { index });
      } catch {
        /* solo in room */
      }
    }
  },

  applyScene(index) {
    const scene = SCENES[index];
    if (!scene) return;
    for (const w of WALLS) {
      const mat = this.materials[w.dir];
      if (!mat) continue;
      const view = scene.byDir[w.dir] || scene.byDir.north;
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
      // These are large, flat background planes. Mipmaps add one third more GPU
      // memory without a useful quality gain in headset, so use linear sampling
      // and release the decoded browser image as soon as WebGL uploads it.
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      // Cover-crop for this wall's plane. Horizontal overflow centres;
      // vertical overflow is positioned so the image's anchor line (the
      // horizon) lands at the centre of the band visible through the glass.
      const img = tex.image;
      const imgAspect = img.width / img.height;
      if (imgAspect > wall.aspect) {
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
