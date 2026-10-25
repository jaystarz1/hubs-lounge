import * as THREE from "three";

// The pistol and rifle targets off the Rovers roof (skeet.js), plain three.js.
// Two rigs hang in the air south of the roof from crane cables:
//   PISTOL ALLEY, 9 m out: a fairground gallery. Two rows of tin ducks run
//   along a track (5), bottles on a shelf (5), tin cans that jump when hit
//   and can be shot again in the air (5, then 25), balloons (5), and now and
//   then the mime's cut-out pops up over the top (25).
//   RIFLE LINE, 24 m out: a rack of steel plates that fall when hit and come
//   back up 8 s later (5), three silhouettes that rock back when hit
//   (body 10, head 25), a spinner (5), and a gong far out at 40 m (25).
// Where things are depends only on the shared clock and the hits, so every
// headset agrees: a hit is { id, part, at (shared time), seed }.
//
// Positions are in the range frame (RangeFrame in skeet-range.js: u to the
// shooter's right, f downrange, h up from the roof deck).

const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();
const std = (hex, rough = 0.6, metal = 0, emissive = 0x000000) =>
  new THREE.MeshStandardMaterial({ color: srgb(hex), roughness: rough, metalness: metal, emissive: srgb(emissive) });

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mesh(parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

function signTexture(lines, bg, fg, w = 1024, h = 256) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    ctx.font = `900 ${i === 0 ? 120 : 56}px serif`;
    ctx.fillText(line, w / 2, (h * (i + 1)) / (lines.length + 1), w - 40);
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  return t;
}

function stripes() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 16;
  const ctx = c.getContext("2d");
  for (let k = 0; k < 8; k++) {
    ctx.fillStyle = k % 2 ? "#f4ecd8" : "#b3122a";
    ctx.fillRect(k * 32, 0, 32, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  return t;
}

// The gallery is built in its own frame: x = u (right), y = h (up), z = -f
// (so -z is downrange). Its group is placed and turned into the world by
// skeet.js from the range frame.
export const NEAR_F = 9;
export const FAR_F = 24;
const DUCK_LOOP = 9.1; // m of track, u -4.55..4.55
const DUCK_SHOW = 4.15; // |u| beyond this is behind the end boards
const DUCK_ROWS = [
  { h: 0.6, speed: 0.9, n: 7 },
  { h: 1.25, speed: -1.25, n: 7 }
];
const POP_PERIOD = 19; // s between the mime cut-out's appearances
const POP_UP = 3.2; // s up

export class Gallery {
  constructor(fx) {
    this.fx = fx; // { play(name, worldPos, vol, ref), debris(colours, worldPos, worldVel), popup(text, by, worldPos) }
    this.group = new THREE.Group();
    this.group.name = "LoungeRangeGallery";
    this.targets = new Map(); // id -> target
    this.hitMeshes = [];
    this.state = new Map(); // id -> { at, part, seed, by }
    this.build();
  }

  add(t) {
    this.targets.set(t.id, t);
    t.mesh.traverse(o => {
      if (o.isMesh && o.userData.part) {
        o.userData.target = t.id;
        this.hitMeshes.push(o);
      }
    });
    return t;
  }

  build() {
    const g = this.group;
    const M = {
      steel: std(0x3a3d42, 0.5, 0.8),
      dark: std(0x1d1f22, 0.8, 0.3),
      wood: std(0x6b4423, 0.75),
      plate: std(0xe8e2d0, 0.5, 0.4, 0x2a2822),
      tin: std(0xf2c230, 0.4, 0.6, 0x3a2a00),
      tinBack: std(0xb8b8b0, 0.4, 0.8),
      bottle: new THREE.MeshStandardMaterial({
        color: srgb(0x2f8a3a),
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
        emissive: srgb(0x0a2a10)
      }),
      can: std(0xc8ccd2, 0.3, 0.9, 0x202020),
      canLabel: std(0xd8282a, 0.5, 0.2, 0x300000),
      sil: std(0x1a1a1a, 0.9),
      silRing: std(0xe8e2d0, 0.8),
      gong: std(0xc9962f, 0.25, 0.95, 0x3a2a00),
      cable: std(0x111111, 0.6, 0.6)
    };
    this.M = M;
    const box = (sx, sy, sz) => new THREE.BoxGeometry(sx, sy, sz);
    const cyl = (r0, r1, h, n = 14) => new THREE.CylinderGeometry(r0, r1, h, n);

    // ---- PISTOL ALLEY ----
    // (The alley hangs low, 2 m below the deck, so from the stands you look
    // down into it and the rifle line, hung higher, shows above it.)
    const near = new THREE.Group();
    near.position.set(0, -2.0, -NEAR_F);
    g.add(near);
    mesh(near, box(10, 0.2, 1.6), M.steel, 0, -0.45, 0.2); // deck
    mesh(near, box(10.2, 0.08, 0.08), M.dark, 0, -0.33, 1.0); // front rail
    const back = new THREE.MeshStandardMaterial({ map: stripes(), roughness: 0.8, emissive: srgb(0x200000) });
    mesh(near, box(9.6, 2.6, 0.08), back, 0, 0.95, -0.55);
    const sign = new THREE.MeshBasicMaterial({
      map: signTexture(
        ["PISTOL ALLEY", "ducks 5 · bottles 15 · cans 15, in the air 25 · the mime 25"],
        "#1d2a52",
        "#f3d27a"
      )
    });
    mesh(near, box(5, 1.1, 0.06), sign, 0, 2.85, -0.5);
    for (const s of [-1, 1]) mesh(near, box(0.45, 2.0, 0.5), back, s * 4.38, 0.65, -0.2); // end boards hide the duck returns
    // duck track rails
    for (const row of DUCK_ROWS) mesh(near, box(8.8, 0.04, 0.06), M.dark, 0, row.h - 0.16, -0.3);
    // bottles shelf + can ledge
    mesh(near, box(2.6, 0.05, 0.3), M.wood, -2.1, 1.75, -0.35);
    mesh(near, box(1.8, 0.05, 0.3), M.wood, 1.9, 1.75, -0.35);
    // crane cables
    for (const [x, z] of [
      [-4.9, 0.9],
      [4.9, 0.9],
      [-4.9, -0.5],
      [4.9, -0.5]
    ])
      mesh(near, cyl(0.015, 0.015, 40, 5), M.cable, x, 19.6, z);

    // Tin ducks on the track.
    DUCK_ROWS.forEach((row, r) => {
      for (let k = 0; k < row.n; k++) {
        const id = `gd${r}.${k}`;
        const m = new THREE.Group();
        const pivot = new THREE.Group(); // falls back about its foot
        m.add(pivot);
        const body = mesh(pivot, box(0.3, 0.16, 0.02), M.tin, 0, 0.12, 0);
        body.userData.part = "duck";
        const head = mesh(pivot, new THREE.CylinderGeometry(0.075, 0.075, 0.02, 14), M.tin, 0.12, 0.26, 0, Math.PI / 2);
        head.userData.part = "duck";
        mesh(pivot, box(0.07, 0.03, 0.02), std(0xe0651a, 0.5), 0.22, 0.25, 0);
        mesh(pivot, box(0.3, 0.16, 0.005), M.tinBack, 0, 0.12, -0.013);
        near.add(m);
        this.add({
          id,
          mesh: m,
          pivot,
          kind: "tinduck",
          row: r,
          k,
          points: () => 5,
          sound: "ping",
          colours: [0xf2c230, 0xffffff],
          down: 6,
          place(T) {
            const u =
              -DUCK_LOOP / 2 + (((((k * DUCK_LOOP) / row.n + row.speed * T) % DUCK_LOOP) + DUCK_LOOP) % DUCK_LOOP);
            m.position.set(u, row.h - 0.14, -0.3);
            m.scale.x = row.speed > 0 ? 1 : -1; // facing the way it goes
            m.visible = Math.abs(u) < DUCK_SHOW;
          }
        });
      }
    });

    // Bottles.
    for (let k = 0; k < 5; k++) {
      const m = new THREE.Group();
      const b = mesh(m, cyl(0.035, 0.04, 0.2, 10), M.bottle, 0, 0.1, 0);
      b.userData.part = "bottle";
      const n = mesh(m, cyl(0.013, 0.03, 0.1, 10), M.bottle, 0, 0.25, 0);
      n.userData.part = "bottle";
      m.position.set(-3.1 + k * 0.5, 1.78, -0.35);
      near.add(m);
      this.add({
        id: `gb${k}`,
        mesh: m,
        kind: "bottle",
        points: () => 15,
        sound: "glass",
        colours: [0x2f8a3a, 0x7fd18a],
        down: 8,
        shatter: true
      });
    }

    // Cans: knocked into the air, worth 25 if you hit them again up there.
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Group();
      const c = mesh(m, cyl(0.035, 0.035, 0.12, 12), M.can, 0, 0.06, 0);
      c.userData.part = "can";
      const l = mesh(m, cyl(0.0355, 0.0355, 0.06, 12), M.canLabel, 0, 0.06, 0);
      l.userData.part = "can";
      const home = new THREE.Vector3(1.35 + k * 0.55, 1.78, -0.35);
      m.position.copy(home);
      near.add(m);
      this.add({
        id: `gc${k}`,
        mesh: m,
        kind: "can",
        home,
        down: 7,
        sound: "clank",
        colours: [0xc8ccd2, 0xd8282a],
        // On the ledge 15; once it has jumped, another hit in the air is 25.
        points: (s, T) => (s && s.air === undefined && T - s.at < this.canAir(s) ? 25 : 15),
        hittable: (s, T) => !s || T - s.at > 7 || (s.air === undefined && T - s.at < this.canAir(s))
      });
    }

    // Balloons over the gallery.
    const balloonCols = [0xe8344a, 0x2f6fe8, 0xf2c230, 0x3ab54a];
    for (let k = 0; k < 4; k++) {
      const m = new THREE.Group();
      const bm = new THREE.MeshStandardMaterial({
        color: srgb(balloonCols[k]),
        roughness: 0.3,
        emissive: srgb(balloonCols[k]).multiplyScalar(0.25)
      });
      const b = mesh(m, new THREE.SphereGeometry(0.17, 14, 10), bm, 0, 0.55, 0);
      b.scale.set(1, 1.2, 1);
      b.userData.part = "balloon";
      mesh(m, cyl(0.003, 0.003, 0.4, 3), M.dark, 0, 0.2, 0);
      const x = -1.8 + k * 1.2;
      near.add(m);
      this.add({
        id: `gl${k}`,
        mesh: m,
        kind: "balloon",
        points: () => 5,
        sound: "pop",
        colours: [balloonCols[k]],
        down: 10,
        shatter: true,
        place(T) {
          m.position.set(x + 0.08 * Math.sin(T * 1.1 + k), 2.25 + 0.06 * Math.sin(T * 1.7 + k * 2), -0.6);
          m.rotation.z = 0.08 * Math.sin(T * 0.9 + k);
        }
      });
    }

    // The mime's cut-out pops up over the top every POP_PERIOD seconds.
    {
      const m = new THREE.Group();
      const pivot = new THREE.Group();
      m.add(pivot);
      const white = std(0xf4f1ea, 0.8);
      const black = std(0x151515, 0.8);
      const torso = mesh(pivot, box(0.42, 0.6, 0.03), black, 0, 0.55, 0);
      torso.userData.part = "mime";
      for (let s = 0; s < 4; s++) mesh(pivot, box(0.43, 0.06, 0.035), white, 0, 0.32 + s * 0.15, 0); // stripes
      const face = mesh(pivot, new THREE.CylinderGeometry(0.15, 0.15, 0.03, 18), white, 0, 1.03, 0, Math.PI / 2);
      face.userData.part = "mime";
      mesh(pivot, box(0.05, 0.02, 0.04), std(0xc0182a, 0.6), 0, 0.97, 0.01); // lips
      mesh(pivot, cyl(0.09, 0.1, 0.2, 14), black, 0, 1.25, 0); // top hat
      mesh(pivot, cyl(0.16, 0.16, 0.02, 16), black, 0, 1.15, 0);
      for (const s of [-1, 1]) mesh(pivot, box(0.08, 0.45, 0.03), white, s * 0.3, 0.75, 0, 0, 0, s * 0.9); // waving arms
      near.add(m);
      this.add({
        id: "gmime",
        mesh: m,
        pivot,
        kind: "mime",
        points: () => 25,
        sound: "boing",
        colours: [0xf4f1ea, 0x151515],
        down: POP_UP,
        place: T => {
          const n = Math.floor(T / POP_PERIOD);
          const tau = T - n * POP_PERIOD;
          const R = mulberry(n * 977 + 5);
          m.position.x = -3.2 + 6.4 * R();
          // up out of the backboard and down again
          const e = tau < 0.35 ? tau / 0.35 : tau > POP_UP - 0.35 ? Math.max(0, (POP_UP - tau) / 0.35) : 1;
          m.position.y = 0.95 + 1.15 * Math.min(1, e);
          m.position.z = -0.75;
          m.visible = tau < POP_UP;
          if (m.visible) pivot.rotation.z = 0.12 * Math.sin(tau * 9);
        },
        // only hittable while it's showing, once per appearance
        hittable: (s, T) => {
          const n = Math.floor(T / POP_PERIOD);
          return T - n * POP_PERIOD < POP_UP - 0.2 && (!s || s.at < n * POP_PERIOD);
        }
      });
    }

    // ---- RIFLE LINE ----
    const far = new THREE.Group();
    far.position.set(0, 1.7, -FAR_F);
    g.add(far);
    mesh(far, box(12, 0.25, 2), M.steel, 0, -0.45, 0);
    const rsign = new THREE.MeshBasicMaterial({
      map: signTexture(["RIFLE LINE", "plates 10 · silhouettes 5 · spinner 5 · gong 1"], "#2a1a10", "#f3d27a")
    });
    mesh(far, box(4.6, 1.0, 0.06), rsign, 0, 2.6, -0.8);
    for (const [x, z] of [
      [-5.9, 0.9],
      [5.9, 0.9],
      [-5.9, -0.9],
      [5.9, -0.9]
    ])
      mesh(far, cyl(0.02, 0.02, 40, 5), M.cable, x, 19.6, z);
    mesh(far, box(3.6, 0.06, 0.06), M.dark, -3.0, -0.05, 0.1); // plate rack bar
    for (let k = 0; k < 6; k++) {
      const m = new THREE.Group();
      const pivot = new THREE.Group();
      m.add(pivot);
      const p = mesh(pivot, new THREE.CylinderGeometry(0.15, 0.15, 0.025, 18), M.plate, 0, 0.17, 0, Math.PI / 2);
      p.userData.part = "plate";
      mesh(pivot, box(0.04, 0.05, 0.02), M.dark, 0, 0.02, 0);
      m.position.set(-4.5 + k * 0.6, -0.02, 0.1);
      far.add(m);
      this.add({
        id: `gp${k}`,
        mesh: m,
        pivot,
        kind: "plate",
        points: () => 10,
        sound: "ping",
        colours: [0xe8e2d0, 0xffd27a],
        down: 8
      });
    }
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Group();
      const pivot = new THREE.Group();
      m.add(pivot);
      const body = mesh(pivot, box(0.46, 0.75, 0.03), M.sil, 0, 0.45, 0);
      body.userData.part = "body";
      const head = mesh(pivot, new THREE.CylinderGeometry(0.12, 0.12, 0.03, 18), M.sil, 0, 0.97, 0, Math.PI / 2);
      head.userData.part = "head";
      mesh(pivot, new THREE.TorusGeometry(0.12, 0.012, 6, 24), M.silRing, 0, 0.5, 0.02);
      mesh(pivot, new THREE.TorusGeometry(0.05, 0.01, 6, 18), M.silRing, 0, 0.97, 0.02);
      mesh(pivot, box(0.06, 0.4, 0.06), M.dark, 0, -0.2, -0.05);
      m.position.set(0.2 + k * 1.4, 0, 0);
      far.add(m);
      this.add({
        id: `gs${k}`,
        mesh: m,
        pivot,
        kind: "sil",
        points: () => 5,
        sound: "thud",
        colours: [0x1a1a1a, 0xe8e2d0],
        rocks: true,
        hittable: () => true
      });
    }
    {
      const m = new THREE.Group();
      mesh(m, box(0.05, 0.9, 0.05), M.dark, 0, 0.15, 0);
      const spin = new THREE.Group();
      spin.position.y = 0.6;
      m.add(spin);
      mesh(spin, box(0.7, 0.03, 0.03), M.dark, 0, 0, 0);
      for (const s of [-1, 1]) {
        const p = mesh(spin, new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), M.plate, s * 0.35, 0, 0, Math.PI / 2);
        p.userData.part = "spin";
      }
      m.position.set(4.9, 0, 0);
      far.add(m);
      this.add({
        id: "gsp",
        mesh: m,
        spin,
        kind: "spinner",
        points: () => 5,
        sound: "ping",
        colours: [0xe8e2d0],
        spinner: true,
        hittable: () => true
      });
    }
    {
      const m = new THREE.Group();
      mesh(m, box(0.08, 2.0, 0.08), M.wood, -0.9, 0, 0);
      mesh(m, box(0.08, 2.0, 0.08), M.wood, 0.9, 0, 0);
      mesh(m, box(1.9, 0.1, 0.1), M.wood, 0, 1.0, 0);
      const swing = new THREE.Group();
      swing.position.y = 0.95;
      m.add(swing);
      mesh(swing, cyl(0.006, 0.006, 0.25, 3), M.dark, 0, -0.12, 0);
      const disc = mesh(swing, new THREE.CylinderGeometry(0.7, 0.7, 0.05, 28), M.gong, 0, -0.95, 0, Math.PI / 2);
      disc.userData.part = "gong";
      m.position.set(-2.5, 2.4, -16);
      mesh(m, box(5, 0.2, 1.4), M.steel, 0, -1.05, 0);
      for (const x of [-2.4, 2.4]) mesh(m, cyl(0.02, 0.02, 40, 5), M.cable, x, 19, 0);
      far.add(m);
      this.add({
        id: "ggong",
        mesh: m,
        swing,
        kind: "gong",
        points: () => 1,
        sound: "gong",
        colours: [0xffd27a],
        gong: true,
        hittable: () => true
      });
    }
  }

  canAir(s) {
    // flight time of a knocked can: up at 5-6.5 m/s, down to below the ledge
    const R = mulberry(s.seed);
    return (2 * (5 + 1.5 * R())) / 9.8 + 0.3;
  }

  isUp(t, s, T) {
    if (t.hittable) return t.hittable(s, T);
    return !s || T - s.at > (t.down || 6);
  }

  // A hit from anyone (ours or a message): returns the points, or 0 if the
  // target was not up to be hit at that moment (someone else got it first).
  hit(id, part, at, seed, by) {
    const t = this.targets.get(id);
    if (!t) return 0;
    const prev = this.state.get(id);
    if (!this.isUp(t, prev, at)) return 0;
    const pts = t.points(prev, at, part);
    let s = { at, part, seed: seed >>> 0, by };
    if (t.kind === "can" && prev && prev.air === undefined && at - prev.at < this.canAir(prev)) {
      // hit again in the air: knocked away for good
      s = { ...prev, air: at, airSeed: seed >>> 0, by };
    }
    this.state.set(id, s);
    const world = t.mesh.getWorldPosition(new THREE.Vector3());
    if (t.kind === "tinduck" || t.kind === "plate" || t.kind === "mime") world.y += 0.15;
    this.fx.play(t.sound, world, 1, t.kind === "gong" ? 30 : 12);
    if (t.shatter || t.kind === "can" || t.kind === "plate")
      this.fx.debris(t.colours, world, new THREE.Vector3(0, 1.5, 0));
    this.fx.popup(`+${pts}`, by, world);
    return pts;
  }

  // Animate everything for shared time T.
  update(T) {
    for (const t of this.targets.values()) {
      if (t.place) t.place(T);
      const s = this.state.get(t.id);
      const since = s ? T - s.at : Infinity;
      if (t.kind === "tinduck" || t.kind === "mime") {
        const down = s && since < t.down;
        // flips back about its foot in 0.2 s, back up at the end
        const e = down ? Math.min(1, since / 0.2) : 0;
        t.pivot.rotation.x = -1.45 * e;
        if (t.kind === "mime" && down) t.pivot.rotation.y = since * 14;
        else if (t.kind === "mime") t.pivot.rotation.y = 0;
      } else if (t.kind === "bottle" || t.kind === "balloon") {
        t.mesh.visible = !(s && since < t.down);
      } else if (t.kind === "plate") {
        t.pivot.rotation.x = s && since < t.down ? -1.4 * Math.min(1, since / 0.15) : 0;
      } else if (t.kind === "sil") {
        // rocks back and springs up again
        const k = s && since < 1.4 ? Math.exp(-since * 3.2) * Math.sin(Math.min(Math.PI / 2, since * 12)) : 0;
        t.pivot.rotation.x = -0.9 * k;
      } else if (t.kind === "spinner") {
        if (s && since < 3)
          t.spin.rotation.z =
            (s.part === "spin" ? 1 : -1) * (1 - Math.exp(-since * 1.5)) * Math.PI * 4 + (s.seed % 2) * Math.PI;
      } else if (t.kind === "gong") {
        t.swing.rotation.x = s && since < 6 ? -0.35 * Math.exp(-since * 0.7) * Math.sin(since * 4.2) : 0;
      } else if (t.kind === "can") {
        const m = t.mesh;
        if (!s || since > t.down) {
          m.position.copy(t.home);
          m.rotation.set(0, 0, 0);
          m.visible = true;
          continue;
        }
        const R = mulberry(s.seed);
        const vy = 5 + 1.5 * R();
        const vx = (R() - 0.5) * 2.5;
        const air = this.canAir(s);
        let tau = Math.min(since, air);
        let x = t.home.x + vx * tau;
        let y = t.home.y + vy * tau - 4.9 * tau * tau;
        let z = t.home.z - 0.6 * tau;
        if (s.air !== undefined && T > s.air) {
          // shot again: off it goes sideways, out of sight
          const R2 = mulberry(s.airSeed);
          const a = T - s.air;
          const t0 = s.air - s.at;
          x = t.home.x + vx * t0 + (R2() - 0.5) * 12 * a;
          y = t.home.y + vy * t0 - 4.9 * t0 * t0 + 6 * a - 4.9 * a * a;
          z = t.home.z - 0.6 * t0 - 3 * a;
          tau = t0 + a;
        }
        m.position.set(x, y, z);
        m.rotation.set(tau * 13, 0, tau * 7);
        m.visible = s.air !== undefined ? T - s.air < 1.5 : since < air;
      }
    }
  }

  // Which targets do these world rays hit (first surface each)? For a
  // shotgun pass several rays. Returns [{ id, part, point }], one per target.
  pick(rays, T) {
    const rc = (this._rc = this._rc || new THREE.Raycaster());
    this.group.updateMatrixWorld(true);
    const live = this.hitMeshes.filter(m => {
      for (let o = m; o; o = o.parent) if (!o.visible) return false;
      const t = this.targets.get(m.userData.target);
      return this.isUp(t, this.state.get(t.id), T);
    });
    const out = new Map();
    for (const { origin, dir } of rays) {
      rc.set(origin, dir);
      rc.far = 60;
      const hit = rc.intersectObjects(live, false)[0];
      if (hit && !out.has(hit.object.userData.target)) {
        out.set(hit.object.userData.target, {
          id: hit.object.userData.target,
          part: hit.object.userData.part,
          point: hit.point
        });
      }
    }
    return [...out.values()];
  }
}
