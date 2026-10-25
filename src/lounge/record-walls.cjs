// Find flat tall walls around a point, for placing a wall button (lounge/record.js).
// THREE is passed in so this runs in the scene and in a node test against the GLB.
const { isWall } = require("./record-core.cjs");

const SKIP_MESH = /^(NavMesh|Spawn|Seat_|TVScreen|MonitorScreen|View|Rain)/;
const HEIGHTS = [0.5, 1.0, 1.4, 1.8, 2.2]; // a wall is flat and tall: all the rays hit it together
const MIN_DISTANCE = 1.0; // nearer than this is furniture round the point, not the room's wall

function wallMeshes(root) {
  const meshes = [];
  root.traverse(o => {
    if (o.isMesh && !SKIP_MESH.test(o.name)) meshes.push(o);
  });
  return meshes;
}

// Walls within `reach` of `centre` (a world point at floor level), nearest first:
// [{ distance, pos: [x, y(floor + mount), z], normal: [x, y, z] }]
function findWalls(THREE, meshes, centre, { reach = 7, mount = 1.4 } = {}) {
  const ray = new THREE.Raycaster();
  ray.far = reach;
  // the real floor under the point (the guess may be a little off): the lowest
  // upward-facing surface from just above the guess down to 0.9 m below it
  ray.set(new THREE.Vector3(centre.x, centre.y + 1.8, centre.z), new THREE.Vector3(0, -1, 0));
  ray.far = 2.7;
  const ups = ray
    .intersectObjects(meshes, false)
    .filter(h => h.face && h.face.normal.clone().transformDirection(h.object.matrixWorld).y > 0.8);
  ray.far = reach;
  const floor = ups.length ? ups[ups.length - 1].point.y : centre.y;
  const cast = (origin, dir) => {
    ray.set(origin, dir);
    for (const h of ray.intersectObjects(meshes, false)) {
      let shown = true;
      for (let o = h.object; o; o = o.parent) if (!o.visible) shown = false;
      if (!shown || !h.face) continue;
      const normal = h.face.normal.clone().transformDirection(h.object.matrixWorld);
      if (normal.dot(dir) < -0.2) return { distance: h.distance, point: h.point, normal: normal.toArray() };
    }
    return null;
  };
  const walls = [];
  for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const dir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const side = new THREE.Vector3(dir.z, 0, -dir.x);
    for (const shift of [0, -0.6, 0.6, -1.2, 1.2, -2.4, 2.4]) {
      const hits = HEIGHTS.map(h => {
        const origin = centre.clone().addScaledVector(side, shift);
        origin.y = floor + h;
        return cast(origin, dir);
      });
      if (!isWall(hits)) continue;
      const mid = hits[2];
      if (mid.distance < MIN_DISTANCE) continue;
      walls.push({
        distance: mid.distance + Math.abs(shift) * 0.1,
        pos: [mid.point.x, floor + mount, mid.point.z],
        normal: mid.normal
      });
    }
  }
  return walls.sort((a, b) => a.distance - b.distance);
}

// ---- ceiling buttons -------------------------------------------------------------------
// The discreet REC button sits on a wall just under the ceiling, in a corner or on a side wall,
// well out of the shot. A spot must be one flat piece of wall at its height (no window, sconce,
// picture or doorway beside it), and a little way off the corner so a ray can reach it.
const CEIL_DROP = 0.32; // button centre this far below the ceiling
const CEIL_ROWS = [0.44, 0.32, 0.2]; // ray heights below the ceiling: all must meet one flat wall
const CORNER_MIN = 0.55; // m from the corner to the button centre
const CORNER_FAR = 2.2; // a wall spot further from a corner than this is "mid-wall", ranked after
const MAX_CEILING = 3.3; // m above the floor: higher than this and the button comes down to here
const LOWER_TRIES = [0, 0.25, 0.5];
const PLENTY = 12; // enough full-height spots: no need to look lower
const SIDE_STEP = 0.3;
const FLAT = 0.07;

function floorAndCeiling(THREE, meshes, centre) {
  const ray = new THREE.Raycaster();
  const hits = (o, d, far) =>
    ray.set(o, d) || ((ray.far = far), ray.intersectObjects(meshes, false)).filter(h => {
      for (let n = h.object; n; n = n.parent) if (!n.visible) return false;
      return !!h.face;
    });
  const up = new THREE.Vector3(0, 1, 0);
  const down = new THREE.Vector3(0, -1, 0);
  const world = h => h.face.normal.clone().transformDirection(h.object.matrixWorld);
  const lows = hits(new THREE.Vector3(centre.x, centre.y + 1.8, centre.z), down, 2.7).filter(h => world(h).y > 0.8);
  const floor = lows.length ? lows[lows.length - 1].point.y : centre.y;
  // the ceiling over several points round the centre (a light fitting or beam over one of them
  // must not set the height); the median is the plain ceiling
  const ys = [];
  for (const [dx, dz] of [[0, 0], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2], [2.4, 0], [-2.4, 0], [0, 2.4], [0, -2.4]]) {
    const o = new THREE.Vector3(centre.x + dx, floor + 1.6, centre.z + dz);
    const h = hits(o, up, 5).find(x => world(x).y < -0.7);
    if (h) ys.push(h.point.y);
  }
  ys.sort((a, b) => a - b);
  const ceiling = ys.length ? ys[Math.floor(ys.length / 2)] : floor + 2.7;
  // a tall room (double height) gets its button at a reachable height, not 6 m up
  return { floor, ceiling: Math.min(ceiling, floor + MAX_CEILING) };
}

// Spots on walls just under the ceiling within `reach` of `centre`, best first:
// [{ cornerDistance, pos: [x,y,z], normal, floor, ceiling }]
// Only the meshes that can matter to a room (a box round it): every ray here is tested against
// them, and the whole house is a lot of triangles for a headset.
function nearMeshes(THREE, meshes, centre, radius) {
  const box = new THREE.Box3(
    new THREE.Vector3(centre.x - radius, centre.y - 2, centre.z - radius),
    new THREE.Vector3(centre.x + radius, centre.y + 9, centre.z + radius)
  );
  const mine = new THREE.Box3();
  return meshes.filter(m => {
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    return box.intersectsBox(mine.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld));
  });
}

function findCeilingSpots(THREE, allMeshes, centre, { reach = 6, plenty = PLENTY } = {}) {
  const meshes = nearMeshes(THREE, allMeshes, centre, reach + 2);
  const { floor, ceiling } = floorAndCeiling(THREE, meshes, centre);
  // a wall with a sign, joinery or cornice right under the ceiling also gets spots a little
  // lower; those rank after every full-height spot
  const all = [];
  for (const lower of LOWER_TRIES) {
    all.push(...ceilingSpotsAt(THREE, meshes, centre, reach, floor, ceiling, lower));
    if (all.length >= plenty) break;
  }
  return all;
}

function ceilingSpotsAt(THREE, meshes, centre, reach, floor, ceiling, lower) {
  const ray = new THREE.Raycaster();
  const cast = (origin, dir, far = reach) => {
    ray.set(origin, dir);
    ray.far = far;
    for (const h of ray.intersectObjects(meshes, false)) {
      let shown = true;
      for (let o = h.object; o; o = o.parent) if (!o.visible) shown = false;
      if (!shown || !h.face) continue;
      const normal = h.face.normal.clone().transformDirection(h.object.matrixWorld);
      if (normal.dot(dir) < -0.2) return { distance: h.distance, point: h.point, normal: normal.toArray() };
    }
    return null;
  };
  const out = [];
  for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const dir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const side = new THREE.Vector3(dir.z, 0, -dir.x);
    const rowsAt = shift => {
      const origin = centre.clone().addScaledVector(side, shift);
      return CEIL_ROWS.map(drop => {
        origin.y = ceiling - lower - drop;
        return cast(origin, dir);
      });
    };
    const steps = [];
    for (let s = -7; s <= 7.001; s += SIDE_STEP) steps.push(+s.toFixed(2));
    const col = new Map(steps.map(s => [s, rowsAt(s)]));
    const flat = s => {
      const rows = col.get(s);
      return rows && isWall(rows) ? rows[1].distance : null;
    };
    for (const shift of steps) {
      const d = flat(shift);
      if (d === null || d < MIN_DISTANCE || Math.hypot(shift, d) > reach) continue; // beyond reach: another room's wall
      // flat for 0.6 m each side: a window, sconce, frame or door edge beside it is not
      const around = [-2, -1, 1, 2].map(k => flat(+(shift + k * SIDE_STEP).toFixed(2)));
      if (around.some(a => a === null || Math.abs(a - d) > FLAT)) continue;
      const mid = col.get(shift)[1];
      const point = mid.point.clone();
      point.y = ceiling - lower - CEIL_DROP;
      // how far to the corner (a wall that meets this one) either way along it
      const wallDir = side.clone();
      const base = point.clone().addScaledVector(new THREE.Vector3(...mid.normal), 0.15);
      let corner = Infinity;
      for (const sign of [1, -1]) {
        const c = cast(base, wallDir.clone().multiplyScalar(sign), 8);
        if (c) corner = Math.min(corner, c.distance);
      }
      if (corner < CORNER_MIN) continue;
      // in this room: a clear line from above the room's centre to the spot (no wall between)
      const eye = centre.clone();
      eye.y = ceiling - 0.6; // above the furniture: only the room's walls may be in the way
      const toSpot = point.clone().addScaledVector(new THREE.Vector3(...mid.normal), 0.2).sub(eye);
      const len = toSpot.length();
      ray.set(eye, toSpot.normalize());
      ray.far = len - 0.6;
      if (ray.intersectObjects(meshes, false).some(h => h.face && h.object.visible)) continue;
      out.push({
        cornerDistance: corner,
        pos: point.toArray(),
        normal: mid.normal,
        distance: mid.distance,
        floor,
        ceiling: ceiling - lower
      });
    }
  }
  // corners first (nearest to a corner, but not in it), then mid-wall spots
  const rank = s => (s.cornerDistance <= CORNER_FAR ? s.cornerDistance : 100 + s.cornerDistance);
  return out.sort((a, b) => rank(a) - rank(b));
}

// Where the button sits: just off the wall, tipped down so it faces people standing below.
const TILT = 0.35; // rad
const OFF_WALL = 0.05; // m
function buttonPose(THREE, spot) {
  const normal = new THREE.Vector3(...spot.normal).setY(0).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), TILT));
  const position = new THREE.Vector3(...spot.pos).addScaledVector(normal, OFF_WALL);
  return { position, quaternion };
}

// ---- can people actually press it? -------------------------------------------------------
// Places someone could stand in the room (a floor under the foot, head room, a clear line to
// the room's centre above the furniture): [eye position] at 1.6 m, up to `count`, spread out.
function standingPoints(THREE, meshes, centre, floor, count = 8) {
  const ray = new THREE.Raycaster();
  const found = [];
  for (let dx = -4.5; dx <= 4.5; dx += 0.75)
    for (let dz = -4.5; dz <= 4.5; dz += 0.75) {
      const foot = new THREE.Vector3(centre.x + dx, floor, centre.z + dz);
      ray.set(foot.clone().setY(floor + 1.8), new THREE.Vector3(0, -1, 0));
      ray.far = 2.3;
      const down = ray.intersectObjects(meshes, false).find(h => h.face && h.face.normal.clone().transformDirection(h.object.matrixWorld).y > 0.8);
      if (!down || Math.abs(down.point.y - floor) > 0.25) continue;
      ray.set(foot.clone().setY(floor + 0.3), new THREE.Vector3(0, 1, 0));
      ray.far = 1.4;
      if (ray.intersectObjects(meshes, false).some(h => h.face && h.object.visible)) continue; // furniture or low ceiling
      const eye = foot.clone().setY(floor + 1.6);
      const up = eye.clone().setY(floor + 2.4);
      const to = up.clone().sub(eye);
      const high = centre.clone().setY(floor + 2.4);
      const d = high.clone().sub(up);
      ray.set(up, d.clone().normalize());
      ray.far = d.length();
      if (ray.intersectObjects(meshes, false).some(h => h.face && h.object.visible)) continue; // another room
      found.push(eye);
    }
  const picked = [];
  for (const p of found.sort((a, b) => a.distanceToSquared(centre) - b.distanceToSquared(centre)).reverse()) {
    if (picked.length >= count) break;
    if (picked.every(q => q.distanceTo(p) > 1.6)) picked.push(p);
  }
  return picked;
}

// How many of these eyes can aim a pointer ray at the button's clickable square (hit x hit)
// with nothing in between, seeing its face (not edge-on)?
function pressableFrom(THREE, meshes, pose, hit, eyes) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(hit, hit), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  plane.position.copy(pose.position);
  plane.quaternion.copy(pose.quaternion);
  plane.updateMatrixWorld(true);
  const front = new THREE.Vector3(0, 0, 1).applyQuaternion(pose.quaternion);
  const ray = new THREE.Raycaster();
  const all = [...meshes, plane];
  return eyes.map(eye => {
    const to = pose.position.clone().sub(eye);
    const dist = to.length();
    const dir = to.normalize();
    const facing = -dir.dot(front);
    ray.set(eye, dir);
    ray.far = dist + 1;
    const first = ray.intersectObjects(all, false).find(h => h.face && (h.object === plane || h.object.visible));
    return { dist, facing, ok: !!first && first.object === plane && facing > 0.25 && dist < 10 };
  });
}

// From the spots (best first by corner), the one most people in the room can press, among those
// `accept` allows (clear of panels, the TV, Zoltar). Ties go to the earlier (more cornered) one.
function bestSpot(THREE, meshes, centre, spots, accept, hit, tries = 40) {
  const usable = [];
  for (const spot of spots) {
    if (usable.length >= tries) break;
    if (!accept(spot)) continue;
    if (usable.every(u => Math.hypot(u.pos[0] - spot.pos[0], u.pos[2] - spot.pos[2]) > 0.55 || Math.abs(u.pos[1] - spot.pos[1]) > 0.2)) usable.push(spot);
  }
  if (!usable.length) return null;
  const eyes = standingPoints(THREE, meshes, centre, usable[0].floor);
  let best = null;
  for (const spot of usable) {
    const results = pressableFrom(THREE, meshes, buttonPose(THREE, spot), hit, eyes);
    const passed = results.filter(r => r.ok).length;
    if (!best || passed > best.passed) best = { spot, passed, tested: results.length, results };
  }
  return best;
}

module.exports = { findWalls, findCeilingSpots, buttonPose, standingPoints, pressableFrom, bestSpot, wallMeshes, SKIP_MESH, CEIL_DROP, TILT };
