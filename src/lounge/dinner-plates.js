import * as THREE from "three";

// The courses served at the two free places (lounge-assets dinner_figures
// EMPTY: Jay's and his guest's) can be eaten: touch the food with the fork,
// knife or spoon you are holding (settings.js) and a bite goes, as the diners'
// do in the clip. Each plate's food is cut into BITE_K bands on bones
// DinProps_C<course>P<place>B<band>, chained so a band scaled flat takes the
// ones eaten before it along (dinner_figures BITE_K): across the plate from the
// diner's left, the sorbet from the top down; the soup goes down the bowl (its
// Sub bone, dinner_figures soup_level). The clip never moves these bones at the
// free places (nobody eats there), so they are set here. A plate starts full
// each time it is served. The bites are shared with the room over NAF messages
// ("lounge-dinner-bite").
const DATA_TYPE = "lounge-dinner-bite";
const BITE_K = 6;
const SORBET = 3; // dinner_figures COURSES index eaten top down
const SOUP = 1;
const SOUP_BITES = 6;
const RADIUS = [0.115, 0.12, 0.135, 0.09, 0.14, 0.125, 0.115]; // COURSES r
const FOOD_Z = [0.03, 0.05, 0.03, 0.13, 0.035, 0.03, 0.04]; // the food's middle above the plate's foot
const TIP = new THREE.Vector3(0, 0.003, -0.08); // the business end of the cutlery (settings.js frame)
const COOLDOWN = 0.7; // s between bites
const EASE = 0.25; // s a bite takes to go
const STILL_FOR = 1.0; // s a plate has stood on the table before it can be eaten from
const TELL_EVERY = 8;
// dinner_figures BOWL_IN, SOUP_FULL, SOUP_DRY
const BOWL = { r0: 0.052, r1: 0.081, floor: 0.021, rim: 0.056, full: 0.05, dry: 0.0225 };

const wp = new THREE.Vector3();
const ws = new THREE.Vector3();
const tip = new THREE.Vector3();

function soupLevel(fill) {
  const u = THREE.MathUtils.clamp((fill - 0.12) / 0.88, 0, 1);
  const z = BOWL.dry + (BOWL.full - BOWL.dry) * u;
  const rAt = h => BOWL.r0 + ((BOWL.r1 - BOWL.r0) * (h - BOWL.floor)) / (BOWL.rim - BOWL.floor) - 0.001;
  return [z - BOWL.full, rAt(z) / rAt(BOWL.full)];
}

AFRAME.registerSystem("lounge-dinner-plates", {
  init() {
    this.plates = [];
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.subscribed = false;
  },

  remove() {
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
    this.plates = [];
  },

  onSceneLoaded() {
    this.plates = [];
    const envRoot = document.querySelector("#environment-root");
    if (!envRoot) return;
    const places = new Set();
    const bones = [];
    envRoot.object3D.traverse(o => {
      const s = /^LoungeSetting_(?:fork|knife|spoon|tumbler)_(\d)/.exec(o.name || "");
      if (s) places.add(s[1]);
      const m = /^DinProps_C(\d)P(\d)$/.exec(o.name || "");
      if (m && o.isBone) bones.push({ bone: o, course: Number(m[1]), place: m[2] });
    });
    for (const { bone, course, place } of bones) {
      if (!places.has(place)) continue;
      const kids = {};
      bone.traverse(o => {
        if (o.isBone) kids[o.name] = o;
      });
      const name = bone.name;
      const sub = kids[`${name}Sub`] || null;
      const bands = [];
      for (let j = 0; j < BITE_K; j++) if (kids[`${name}B${j}`]) bands.push(kids[`${name}B${j}`]);
      if (course === SOUP ? !sub : bands.length !== BITE_K) continue;
      this.plates.push({
        name,
        course,
        bone,
        sub,
        subRest: sub ? sub.position.clone() : null,
        bands,
        bites: 0, // eaten (shared)
        shown: 0, // eased toward bites
        served: false,
        still: 0,
        last: new THREE.Vector3(),
        inside: false,
        nextBite: 0,
        mine: false,
        nextTell: 0
      });
    }
  },

  subscribe() {
    if (this.subscribed || !window.NAF?.connection?.subscribeToDataChannel) return;
    NAF.connection.subscribeToDataChannel(DATA_TYPE, (_from, _type, data) => this.onMessage(data));
    this.subscribed = true;
  },

  send(p) {
    try {
      NAF.connection.broadcastDataGuaranteed(DATA_TYPE, { b: p.name, n: p.bites, by: window.NAF?.clientId || "" });
    } catch {
      /* not connected yet */
    }
  },

  onMessage(data) {
    if (!data?.b || data.by === window.NAF?.clientId) return;
    const p = this.plates.find(x => x.name === data.b);
    if (!p || !p.served) return;
    const n = Math.min(this.maxBites(p), Math.max(0, Math.floor(Number(data.n) || 0)));
    if (n > p.bites) {
      p.bites = n;
      p.mine = false;
    }
  },

  maxBites(p) {
    return p.course === SOUP ? SOUP_BITES : BITE_K - 1;
  },

  apply(p) {
    if (p.course === SOUP) {
      const [drop, s] = soupLevel(1 - (0.88 * p.shown) / SOUP_BITES);
      p.sub.position.set(p.subRest.x, p.subRest.y, p.subRest.z + drop);
      p.sub.scale.set(s, 1, s);
      p.sub.matrixNeedsUpdate = true;
      return;
    }
    for (let j = 0; j < BITE_K; j++) {
      const n = p.course === SORBET ? BITE_K - 1 - j : j; // its turn
      const s = Math.max(0.001, 1 - THREE.MathUtils.clamp(p.shown - n, 0, 1));
      const b = p.bands[j];
      if (p.course === SORBET) b.scale.y = s;
      else b.scale.x = s;
      b.matrixNeedsUpdate = true;
    }
  },

  // The tips of the cutlery held here.
  tips() {
    const items = this.el.sceneEl.systems["lounge-settings"]?.items || [];
    const out = [];
    for (const it of items) {
      if (it.kind === "tumbler" || !it.held) continue;
      out.push(it.el.object3D.localToWorld(tip.copy(TIP)).clone());
    }
    return out;
  },

  tick(time, dtMs) {
    if (!this.plates.length) return;
    this.subscribe();
    const dt = Math.min(0.1, (dtMs || 16) / 1000);
    const now = time / 1000;
    let tips = null;
    for (const p of this.plates) {
      p.bone.updateWorldMatrix(true, false);
      p.bone.matrixWorld.decompose(wp, new THREE.Quaternion(), ws);
      const on = ws.x > 0.5;
      if (!on) {
        // Taken away (or not out yet): full again for the next time it is served.
        if (p.served || p.shown > 0) {
          p.served = false;
          p.bites = 0;
          p.shown = 0;
          p.mine = false;
          this.apply(p);
        }
        p.still = 0;
        continue;
      }
      const moved = wp.distanceTo(p.last) > 0.002;
      p.last.copy(wp);
      p.still = moved ? 0 : p.still + dt;
      if (!p.served && p.still >= STILL_FOR) p.served = true;
      if (p.served) {
        tips = tips || this.tips();
        const top = wp.y + FOOD_Z[p.course] * ws.y;
        const r = RADIUS[p.course] * 0.8 * ws.x;
        let inside = false;
        for (const t of tips) {
          const dx = t.x - wp.x;
          const dz = t.z - wp.z;
          if (dx * dx + dz * dz < r * r && t.y > top - 0.04 && t.y < top + 0.06) inside = true;
        }
        if (inside && !p.inside && now >= p.nextBite && p.bites < this.maxBites(p)) {
          p.bites += 1;
          p.mine = true;
          p.nextBite = now + COOLDOWN;
          this.send(p);
          p.nextTell = now + TELL_EVERY;
        }
        p.inside = inside;
        if (p.mine && p.bites > 0 && now >= p.nextTell) {
          this.send(p);
          p.nextTell = now + TELL_EVERY;
        }
      }
      if (p.shown !== p.bites) {
        p.shown = p.bites > p.shown ? Math.min(p.bites, p.shown + dt / EASE) : p.bites;
        this.apply(p);
      }
    }
  }
});
