// Per-room visibility: the rules, kept apart from the scene so the harness can
// run exactly this code in a page (tests/visibility-check.cjs).
// (lounge/visibility.js is the scene side; tests/bake-visibility.cjs makes the data.)
//
// The data is, per room ("zone"): the exact list of solid static scenery that
// shows from any head position in the room, and a grid of 0.5 m cells marking
// the space that can be seen from there. While your head is in a zone, static
// scenery not on the list is skipped; everything else (glass, things made or
// moved at run time, the figures bone by bone) is skipped when it touches no
// seen cell.
// Skipping is done on the object's layer mask, never on .visible: shows, the
// range and the recorder all switch .visible for their own reasons, and a
// skinned figure that is skipped also skips its bone upload.

const MAX_CELLS = 6000; // bounds bigger than this are always drawn
const SKIN_PAD = 0.3; // m around each bone of a figure (flesh, props in hand)
const MOVED = 0.03; // m: static scenery further than this from where it was baked is judged by cells
const SLICES = 5; // the managed list is re-checked a fifth per step

function decode(base64) {
  const text = globalThis.atob(base64);
  const bits = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bits[i] = text.charCodeAt(i);
  return bits;
}

function createVisibility(THREE, data) {
  const { origin, cell, dims } = data.grid;
  const [nx, ny, nz] = dims;
  const zones = data.zones.map(z => ({ name: z.name, min: z.box[0], max: z.box[1], bits: decode(z.cells), air: decode(z.air || z.cells), listed: new Set(z.visible || []) }));
  const baked = new Map((data.statics || []).map((s, i) => [s[0], i]));
  const records = new Map(); // object -> record
  let list = [];
  let zone = null;
  let slice = 0;
  const box = new THREE.Box3();
  const range6 = [0, 0, 0, 0, 0, 0];
  const stats = { zone: "", managed: 0, culled: 0 };

  function zoneAt(p) {
    for (const z of zones) {
      if (p.x >= z.min[0] && p.x <= z.max[0] && p.y >= z.min[1] && p.y <= z.max[1] && p.z >= z.min[2] && p.z <= z.max[2]) return z;
    }
    return null;
  }

  // Cell range of a world box, or null when it must always be drawn
  // (outside the grid, or too big to be worth testing).
  function rangeOf(b) {
    if (b.isEmpty()) return null;
    const i0 = Math.floor((b.min.x - origin[0]) / cell);
    const j0 = Math.floor((b.min.y - origin[1]) / cell);
    const k0 = Math.floor((b.min.z - origin[2]) / cell);
    const i1 = Math.floor((b.max.x - origin[0]) / cell);
    const j1 = Math.floor((b.max.y - origin[1]) / cell);
    const k1 = Math.floor((b.max.z - origin[2]) / cell);
    if (i0 < 0 || j0 < 0 || k0 < 0 || i1 >= nx || j1 >= ny || k1 >= nz) return null;
    if ((i1 - i0 + 1) * (j1 - j0 + 1) * (k1 - k0 + 1) > MAX_CELLS) return null;
    return [i0, i1, j0, j1, k0, k1];
  }

  function seen(bits, r) {
    if (!r) return true;
    for (let j = r[2]; j <= r[3]; j++)
      for (let k = r[4]; k <= r[5]; k++) {
        const row = (j * nz + k) * nx;
        for (let i = r[0]; i <= r[1]; i++) {
          const n = row + i;
          if (bits[n >> 3] & (1 << (n & 7))) return true;
        }
      }
    return false;
  }

  function measure(rec) {
    const o = rec.o;
    if (o.isSkinnedMesh && o.skeleton) {
      // Skinned geometry sits wherever its bones are, not where its bind pose was,
      // and one mesh can be props spread over three rooms: judged bone by bone.
      rec.bones = o.skeleton.bones;
      return;
    }
    const e = o.matrixWorld.elements;
    const key = e[12] + e[13] * 3.1 + e[14] * 7.3 + e[0] * 11.7 + e[5] * 13.1 + e[10] * 17.9 + e[1] * 19.3 + e[8] * 23.9;
    if (key === rec.key) return;
    rec.key = key;
    if (rec.index >= 0) {
      const at = data.statics[rec.index];
      rec.listed = Math.abs(e[12] - at[1]) < MOVED && Math.abs(e[13] - at[2]) < MOVED && Math.abs(e[14] - at[3]) < MOVED;
    }
    const g = o.geometry;
    if (!g || o.isInstancedMesh) {
      rec.range = null;
      return;
    }
    if (!g.boundingBox) g.computeBoundingBox();
    rec.range = rangeOf(box.copy(g.boundingBox).applyMatrix4(o.matrixWorld));
  }

  function apply(rec, hide) {
    if (hide === rec.culled) return;
    const o = rec.o;
    if (hide) {
      rec.mask = o.layers.mask;
      o.layers.mask = 0;
      stats.culled++;
    } else {
      // Only undo our own zero: if something else set layers meanwhile, it wins.
      if (o.layers.mask === 0) o.layers.mask = rec.mask;
      stats.culled--;
    }
    rec.culled = hide;
  }

  function boneSeen(bits, bones) {
    for (const bone of bones) {
      const e = bone.matrixWorld.elements;
      const i0 = Math.floor((e[12] - SKIN_PAD - origin[0]) / cell);
      const j0 = Math.floor((e[13] - SKIN_PAD - origin[1]) / cell);
      const k0 = Math.floor((e[14] - SKIN_PAD - origin[2]) / cell);
      const i1 = Math.floor((e[12] + SKIN_PAD - origin[0]) / cell);
      const j1 = Math.floor((e[13] + SKIN_PAD - origin[1]) / cell);
      const k1 = Math.floor((e[14] + SKIN_PAD - origin[2]) / cell);
      if (i0 < 0 || j0 < 0 || k0 < 0 || i1 >= nx || j1 >= ny || k1 >= nz) return true; // off the grid: draw
      range6[0] = i0;
      range6[1] = i1;
      range6[2] = j0;
      range6[3] = j1;
      range6[4] = k0;
      range6[5] = k1;
      if (seen(bits, range6)) return true;
    }
    return false;
  }

  function check(rec) {
    if (!zone) return apply(rec, false);
    measure(rec);
    if (rec.bones) return apply(rec, !boneSeen(zone.air, rec.bones));
    if (rec.listed) return apply(rec, !zone.listed.has(rec.index));
    apply(rec, !seen(zone.bits, rec.range));
  }

  // Re-read the drawables (things are made at run time). scenery: the room model,
  // whose static objects are matched to the baked list by name and order; others:
  // roots of things the lounge builds itself.
  function collect(scenery, others = []) {
    const live = new Set();
    const count = new Map();
    const add = (o, index) => {
      live.add(o);
      if (!records.has(o)) records.set(o, { o, key: NaN, range: null, culled: false, mask: 0, index, listed: false, bones: null });
    };
    if (scenery)
      scenery.traverse(o => {
        if (!(o.isMesh || o.isLine || o.isPoints)) return;
        const n = count.get(o.name) || 0;
        count.set(o.name, n + 1);
        const index = baked.get(`${o.name}#${n}`);
        add(o, index === undefined ? -1 : index);
      });
    for (const root of others) {
      if (!root) continue;
      root.traverse(o => (o.isMesh || o.isLine || o.isPoints) && add(o, -1));
    }
    for (const [o, rec] of records) {
      if (!live.has(o)) {
        apply(rec, false);
        records.delete(o);
      }
    }
    list = [...records.values()];
    stats.managed = list.length;
  }

  // One step. head: world position of the viewer's head, or null to draw everything.
  function step(head) {
    const now = head ? zoneAt(head) : null;
    if (now !== zone) {
      zone = now;
      stats.zone = zone ? zone.name : "";
      for (const rec of list) check(rec); // a room change is settled at once
      return;
    }
    if (!zone) return;
    for (let i = slice; i < list.length; i += SLICES) check(list[i]);
    slice = (slice + 1) % SLICES;
  }

  function settle(head) {
    zone = head ? zoneAt(head) : null;
    stats.zone = zone ? zone.name : "";
    for (const rec of list) check(rec);
  }

  return { collect, step, settle, zoneAt, stats, restore: () => settle(null) };
}

module.exports = { createVisibility };
