import * as THREE from "three";
import { BOX, CYL, BALL, CONE, TORUS, SLAB, WORLDS, AMBIENCE } from "./shoots-art";
import { LAYOUTS } from "./plates";
import { bird, cross, across, run, pick, flyers } from "./shoot-paths";
import { kit, rush, lobbed, skim } from "./campaign-kit";
import { G, fighter, mover, friend, room, backWall, raiders, bed, drumHit } from "./campaign-indy";

// The Indiana Jones campaign's middle five (campaign-indy.js has the first
// four and the Grail; shoots.js plays these between the Well of Souls and it):
//   5 THE FLYING WING   the airfield in the desert: the wing on the runway,
//                       fuel trucks and drums, the big mechanic, fighters
//   6 THE TRUCK CHASE   the desert road: the convoy, motorcycles and
//                       sidecars, soldiers in the rocks, a camel caravan
//   7 THE TEMPLE OF DOOM  Kali over the lava pit, the cage, Mola Ram, the
//                       Thuggee, the Sankara stones
//   8 THE MINE CARTS    carts racing on the trestles, guards, the stones
//   9 THE CANYON TANK   the tank down the canyon, horsemen, the gulls

const more = {
  mechanicRun: {
    ...mover("mechanic", 2.1),
    pts: 100,
    arrive: "roar",
    lose: "THE MECHANIC!",
    name: "THE MECHANIC · 100"
  },
  thuggeeRun: { ...mover("thuggee"), arrive: "thud", lose: "THUGGEE!" },
  molaramRun: { ...mover("molaram", 1.9), pts: 250, name: "MOLA RAM · 250" },
  shortyRun: friend("shorty", "DON'T SHOOT SHORT ROUND!", 1.12),
  willieRun: friend("willie", "DON'T SHOOT WILLIE!", 1.7),
  gull: bird("duck_gull", 25, 0.3, "chirp"),
  camelDont: {
    pts: -25,
    r: 0.9,
    hy: 1.3,
    dies: "fall",
    art: { plate: "camel", tint: 0xc8a070, h: 2.6 },
    face: "slide",
    sound: "wrong",
    foe: true,
    name: "DON'T SHOOT THE CAMELS!"
  },
  horseIndy: {
    pts: -25,
    r: 0.8,
    hy: 1.4,
    dies: "fall",
    art: { plate: "rider", tint: 0x8a5a3a, h: 2.4 },
    face: "slide",
    sound: "wrong",
    foe: true,
    name: "THAT'S INDY ON THE HORSE! DON'T SHOOT!"
  },
  shortyCart: {
    pts: -25,
    r: 0.6,
    hy: 0.6,
    dies: "fall",
    art: { plate: "cart", tint: 0xc8b090, h: 1.6 },
    face: "slide",
    sound: "wrong",
    foe: true,
    name: "SHORT ROUND'S CART! DON'T SHOOT!"
  }
};
export const kinds = Object.fromEntries(Object.entries(more).map(([k, v]) => [`i_${k}`, v]));

// ---- Level 5: the flying wing -------------------------------------------------------

const AIR = { WING: 24, RUNWAY: [13, 21], HANGAR: 50, TOWER: [-20, 38] };
function flyingWing(add) {
  const c = 0x7a7e6a;
  add(BOX(22, 0.5, 4.4), c, 0, 2.6, 0);
  add(BOX(14, 0.6, 2.2), c, 0, 2.7, -2.6, 0.08, 0, 0);
  for (const s of [-1, 1]) {
    add(BOX(5, 0.35, 2.4), c, s * 12.6, 2.55, 1.0, 0, s * 0.4, 0);
    add(CYL(0.55, 0.45, 2.6, 10), 0x5a5e4e, s * 4, 2.4, -1.6, Math.PI / 2);
    add(BOX(0.12, 3.0, 0.2), 0x2a2a2a, s * 4, 2.4, -2.95, 0, 0, s * 0.4);
    add(BOX(0.12, 3.0, 0.2), 0x2a2a2a, s * 4, 2.4, -2.95, 0, 0, s * 0.4 + Math.PI / 2);
    add(CYL(0.12, 0.12, 2.4, 6), 0x3a3a3a, s * 3, 1.2, 0);
    add(CYL(0.45, 0.45, 0.3, 10), 0x1a1a1a, s * 3, 0.45, 0, 0, 0, Math.PI / 2);
  }
  add(BALL(1.0, 10), 0x6a8a9a, 0, 3.2, -1.6, 0, 0, 0, 1, 0.6, 1.2);
  add(CYL(0.08, 0.08, 1.6, 6), 0x3a3a3a, 0, 1.2, -1.8);
  add(CYL(0.3, 0.3, 0.2, 8), 0x1a1a1a, 0, 0.35, -1.8, 0, 0, Math.PI / 2);
}
function fuelTruck(add, c = 0x6a6e5a) {
  add(BOX(2.2, 1.6, 2.0), c, 0, 1.6, -2.6);
  add(BOX(1.8, 0.6, 0.1), 0x6a8a9a, 0, 2.0, -3.62);
  add(CYL(1.05, 1.05, 4.4, 12), 0x8a8a7a, 0, 1.9, 0.9, Math.PI / 2);
  add(BOX(2.3, 0.4, 6.4), 0x3a3a34, 0, 0.7, -0.2);
  for (const z of [-2.6, 0.2, 2.2])
    for (const s of [-1, 1]) add(CYL(0.45, 0.45, 0.35, 10), 0x1a1a1a, s * 1.1, 0.45, z, 0, 0, Math.PI / 2);
}
function drums(P, u, f, n = 5) {
  for (let k = 0; k < n; k++) {
    const x = u + (k % 3) * 0.7;
    const z = f + Math.floor(k / 3) * 0.7;
    P.add(CYL(0.3, 0.3, 0.9, 10), k % 2 ? 0x8a2a1a : 0x5a6a4a, x, G + 0.45, z);
  }
}
WORLDS.indy_airfield = {
  sky: {
    top: "#3a72b8",
    mid: "#8ab8e0",
    horizon: "#f4e2c0",
    ground: "#c8a070",
    sun: [40, 55, "#fffbe8", 11],
    clouds: 3,
    hills: [
      { colour: "#c09060", height: 6, rough: 2, phase: 2 },
      { colour: "#d8b080", height: 3, rough: 1 }
    ],
    seed: 151
  },
  fog: 0xe8d0a8,
  build(P) {
    P.ground(0xd4ac74, [
      { u: 0, f: (AIR.RUNWAY[0] + AIR.RUNWAY[1]) / 2, r: 4, c: 0x8a7a6a, sx: 18, sz: 1 },
      { u: 0, f: AIR.HANGAR - 4, r: 10, c: 0xb89a6a, sx: 1.6, sz: 0.6 }
    ]);
    for (let u = -60; u < 60; u += 6)
      P.add(BOX(3, 0.02, 0.25), 0xe8e4d8, u, G + 0.06, (AIR.RUNWAY[0] + AIR.RUNWAY[1]) / 2);
    flyingWing(kit(P, 0, AIR.WING, Math.PI));
    fuelTruck(kit(P, -17, 12, Math.PI / 2 + 0.3));
    fuelTruck(kit(P, 18, 13, -Math.PI / 2 - 0.3), 0x7a5a3a);
    // parked fighters, sandbags, crates, a staff car, a radio mast
    for (const [u, f, r] of [
      [-26, 30, 0.6],
      [-20, 34, 0.5],
      [26, 32, -0.6]
    ])
      fighter(kit(P, u, f, Math.PI + r, 1.1));
    for (const [u, f] of [
      [-6, 5],
      [6.5, 5]
    ])
      for (let k = 0; k < 6; k++)
        P.add(
          BOX(0.9, 0.35, 0.5),
          0xb8a070,
          u - 1.2 + (k % 3) * 0.85,
          G + 0.18 + Math.floor(k / 3) * 0.33,
          f,
          0,
          0.1 * k,
          0
        );
    for (const [u, f, w] of [
      [12, 20, 1.2],
      [13.2, 20.3, 1.0],
      [12.5, 21.4, 0.8],
      [-12, 22, 1.1]
    ])
      P.add(BOX(w, w, w), 0x8a6a46, u, G + w / 2, f);
    P.add(BOX(4, 1.0, 1.8), 0x2a2a28, 8, G + 0.7, 36, 0, 0.6, 0);
    P.add(BOX(2.2, 0.8, 1.7), 0x2a2a28, 7.7, G + 1.5, 36.2, 0, 0.6, 0);
    P.add(CYL(0.08, 0.12, 16, 5), 0x6a6a6a, -30, G + 8, 44);
    for (let h = 2; h < 16; h += 3) P.add(BOX(1.6, 0.06, 0.06), 0x6a6a6a, -30, G + h, 44);
    drums(P, -4.5, 6.5);
    drums(P, 4, 7, 4);
    drums(P, -14, 30, 6);
    // the hangar, the control tower, a windsock, sheds
    P.add(
      new THREE.CylinderGeometry(9, 9, 18, 16, 1, false, 0, Math.PI),
      0x8a8a7a,
      0,
      G,
      AIR.HANGAR + 9,
      Math.PI / 2,
      0,
      Math.PI / 2
    );
    P.add(BOX(10, 7, 0.2), 0x1a1a18, 0, G + 3.5, AIR.HANGAR - 0.05);
    const [tu, tf] = AIR.TOWER;
    for (const [a, b] of [
      [-1.5, -1.5],
      [1.5, -1.5],
      [-1.5, 1.5],
      [1.5, 1.5]
    ])
      P.add(CYL(0.12, 0.15, 7, 5), 0x5a4a3a, tu + a, G + 3.5, tf + b);
    P.add(BOX(4.2, 2.6, 4.2), 0xc8b090, tu, G + 8.3, tf);
    P.add(BOX(4.0, 0.9, 0.1), 0x2a3440, tu, G + 8.6, tf - 2.12);
    P.add(BOX(4.8, 0.3, 4.8), 0x6a5a48, tu, G + 9.75, tf);
    P.add(CYL(0.05, 0.05, 6, 4), 0x5a5a5a, 18, G + 3, 30);
    P.add(CONE(0.35, 1.6, 8), 0xff7a1a, 18.7, G + 5.7, 30, 0, 0, Math.PI / 2);
    for (const [u, f] of [
      [26, 42],
      [-32, 52],
      [32, 58]
    ]) {
      P.add(BOX(7, 3.5, 5), 0xb89a72, u, G + 1.75, f);
      P.add(BOX(7.4, 0.3, 5.4), 0x6a5a48, u, G + 3.6, f);
    }
    P.scatter(24, 30, 90, (u, f, R) => Math.abs(u) > 14 && P.rock(u, f, 0.6 + R() * 1.6, 0xb08a5a), 80);
    P.scatter(14, 40, 85, (u, f, R) => P.add(BALL(1, 8), 0xdcb478, u, G - 0.2, f, 0, 0, 0, 7, 1.2 + R(), 4), 80);
    // tents and their guy ropes, a camel train resting far off, oil drums
    for (const [u, f] of [
      [-34, 20],
      [-38, 26],
      [34, 22],
      [38, 16]
    ]) {
      P.add(CONE(2.6, 2.6, 4), 0xc8b890, u, G + 1.3, f, 0, Math.PI / 4, 0);
      for (let k = 0; k < 4; k++)
        P.add(
          CYL(0.02, 0.02, 2.6, 3),
          0x5a4a3a,
          u + Math.cos(k * 1.57) * 2.2,
          G + 0.9,
          f + Math.sin(k * 1.57) * 2.2,
          0.5 * Math.sin(k * 1.57),
          0,
          -0.5 * Math.cos(k * 1.57)
        );
    }
    P.scatter(40, 8, 60, (u, f, R) => Math.abs(u) > 22 && drums(P, u, f, 1 + Math.floor(R() * 4)), 60);
    for (let k = 0; k < 5; k++) {
      const u = -40 + k * 4;
      P.add(BOX(2.2, 1.2, 0.8), 0xc8a070, u, G + 1.2, 66);
      P.add(BOX(0.4, 1.4, 0.4), 0xc8a070, u - 1.2, G + 1.6, 66, 0, 0, 0.5);
    }
  },
  slots: [],
  cover: null
};
LAYOUTS.indy_airfield = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "can", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.38, tint: ["red", "steel"], bank: 3 });
  L.row({ ...fixed, kind: "can", n: 3, f: 6.3, u0: -4.5, u1: -3.1, base: 0.9, size: 0.36, tint: "red", bank: 3 });
  L.row({ ...fixed, kind: "can", n: 3, f: 6.8, u0: 4, u1: 5.4, base: 0.9, size: 0.36, tint: "red", bank: 3 });
  L.row({ kind: "helmet", n: 6, f: 28, u0: -10, u1: 10, base: 1.2, size: 0.5, tint: "steel", bank: 3 });
  L.row({
    ...fixed,
    kind: "can",
    n: 5,
    f: AIR.HANGAR - 0.6,
    u0: -4,
    u1: 4,
    size: 0.6,
    tint: ["red", "steel"],
    bank: 5
  });
  L.row({
    ...fixed,
    kind: "lantern",
    n: 2,
    f: AIR.TOWER[1] - 2.3,
    u0: AIR.TOWER[0] - 1.4,
    u1: AIR.TOWER[0] + 1.4,
    base: 7.2,
    size: 0.5,
    tint: "gold",
    bank: 2
  });
  const crew = [
    ["soldier", 55],
    ["mechanic", 12, { pts: 100 }],
    ["colonel", 13, { pts: 75 }],
    ["marion", 10, { dont: true }],
    ["indy", 10, { dont: true }]
  ];
  L.pops({
    fixed: true,
    f: 5.5,
    at: [
      [-6, 0],
      [6.5, 0]
    ],
    size: 1.75,
    kinds: crew
  });
  L.pops({
    fixed: true,
    f: 13.6,
    at: [
      [-17, 0],
      [18, 0]
    ],
    size: 1.8,
    kinds: crew
  });
  L.pops({
    fixed: true,
    peek: true,
    f: AIR.WING + 0.5,
    at: [
      [-6, 0],
      [6, 0]
    ],
    size: 1.8,
    kinds: crew
  });
  L.pops({
    fixed: true,
    f: AIR.WING - 2.6,
    at: [[0, 2.9]],
    size: 1.0,
    period: [5, 8],
    kinds: [
      ["soldier", 70, { pts: 50 }],
      ["marion", 30, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: AIR.HANGAR - 0.4,
    at: [
      [-3, 0],
      [3, 0]
    ],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["soldier", 80, { pts: 50 }],
      ["mechanic", 20, { pts: 100 }]
    ]
  });
  L.pops({
    fixed: true,
    f: AIR.TOWER[1] - 2.4,
    at: [[AIR.TOWER[0], 7.3]],
    size: 1.3,
    period: [5, 8],
    kinds: [["colonel", 100, { pts: 75 }]]
  });
};
const airfieldWave = (R, add, c) => {
  const out = t =>
    add(
      t,
      "i_soldierRun",
      rush(
        R,
        [
          [pick(R, [-1, 1]) * R(10, 14), R(22, 30), G],
          [R(-8, 8), R(4, 8), G]
        ],
        R(3.2, 4.2) * c.S
      )
    );
  const mechanic = t =>
    add(
      t,
      "i_mechanicRun",
      rush(
        R,
        [
          [R(-3, 3), AIR.WING + 3, G],
          [R(-5, 5), R(6, 9), G]
        ],
        2.2 * c.S
      )
    );
  if (c.x2) {
    mechanic(1);
    for (let k = 0; k < 7; k++) out(2 + k * 3);
    for (let k = 0; k < 5; k++)
      add(2 + k * 5, "i_fighter", across(R, { v: R(20, 26) * c.S, h: R(8, 16), f: R(20, 45), weave: 2 }));
    add(8, "i_truck", run(R, { v: R(9, 11) * c.S, f: 40, straight: true, steady: true }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) out(R(1, 22));
  if (k === 0 || k === 3) mechanic(R(2, 12));
  if (k !== 0)
    for (let j = 0; j < 1 + n(1.5); j++)
      add(R(1, 24), "i_fighter", across(R, { v: R(20, 26) * c.S, h: R(8, 16), f: R(20, 45), weave: 2 }));
  if (k === 1 || k === 4) add(R(2, 20), "i_truck", run(R, { v: R(9, 11) * c.S, f: 40, straight: true, steady: true }));
  if (k === 2 || k === 5)
    add(R(2, 20), "i_sidecar", run(R, { v: R(12, 15) * c.S, f: (AIR.RUNWAY[0] + AIR.RUNWAY[1]) / 2 }));
  if (k === 5)
    for (let j = 0; j < 2; j++)
      add(
        R(3, 22),
        "i_grenade",
        lobbed(R, { u: R(-8, 8), f: AIR.WING, h: G + 2, vh: R(4, 5), vu: R(-2, 2), vf: -R(5, 7) })
      );
};

// ---- Level 6: the truck chase -----------------------------------------------------

const ROAD = { F: 18, W: 5 };
WORLDS.indy_road = {
  sky: {
    top: "#3a6ab0",
    mid: "#8ab0d8",
    horizon: "#f0dcb8",
    ground: "#b8905e",
    sun: [-30, 35, "#fffbe8", 11],
    clouds: 4,
    hills: [
      { colour: "#a86a42", height: 12, rough: 4, phase: 1 },
      { colour: "#c08a58", height: 6, rough: 2 }
    ],
    seed: 161
  },
  fog: 0xe0c49a,
  build(P) {
    P.ground(0xcca06a, [{ u: 0, f: ROAD.F, r: ROAD.W / 2, c: 0x9a7a54, sx: 40, sz: 1 }]);
    for (let u = -70; u < 70; u += 9) P.add(BOX(0.3, 0.5, 0.3), 0xe8e0d0, u, G + 0.25, ROAD.F - ROAD.W / 2 - 0.4);
    // rocks and boulders along the near side (cover), cliffs and mesas far
    for (const [u, f, s] of [
      [-9, 8, 1.2],
      [-3, 6, 0.8],
      [5, 7, 1.1],
      [12, 9, 1.3],
      [-15, 11, 1.0],
      [-6, 27, 1.4],
      [8, 28, 1.6],
      [18, 26, 1.2]
    ])
      P.rock(u, f, s * 1.6, 0xb07a4a);
    for (const [u, f, w, h] of [
      [-30, 46, 14, 14],
      [-8, 58, 12, 18],
      [22, 50, 16, 12],
      [40, 66, 14, 20]
    ]) {
      P.add(BOX(w, h, 8), 0xa86a42, u, G + h / 2, f);
      P.add(BOX(w + 1, 1, 8.5), 0xc08a58, u, G + h + 0.5, f);
      P.add(BOX(w * 0.6, h * 0.3, 7), 0x8a5434, u + w * 0.3, G + h * 0.15, f - 1.2);
    }
    // a wrecked staff car by the road, telegraph poles, palms at an oasis
    P.add(BOX(4, 1.2, 1.8), 0x3a3a34, -18, G + 0.8, ROAD.F + 4, 0, 0.3, 0.2);
    P.add(BOX(2, 0.8, 1.6), 0x2a2a26, -18.5, G + 1.7, ROAD.F + 4, 0, 0.3, 0.2);
    for (let u = -60; u <= 60; u += 15) {
      P.add(CYL(0.1, 0.12, 6, 5), 0x5a4030, u, G + 3, ROAD.F + 4);
      P.add(BOX(1.4, 0.1, 0.1), 0x5a4030, u, G + 5.6, ROAD.F + 4);
    }
    for (const [u, f] of [
      [26, 34],
      [30, 37],
      [24, 39]
    ])
      P.palm(u, f, 1.2);
    P.add(CYL(4, 4, 0.02, 16), 0x3a6a7a, 28, G + 0.04, 37);
    P.scatter(30, 30, 90, (u, f, R) => P.rock(u, f, 0.5 + R() * 1.5, 0xb08a5a), 80, 10);
    // a mud-brick village over the road, dunes beyond
    for (const [u, f, w, h] of [
      [-12, 30, 4, 3],
      [-7, 32, 3.5, 4],
      [12, 31, 5, 3.4],
      [16, 34, 3, 2.6],
      [-16, 35, 4, 3.6]
    ]) {
      P.add(BOX(w, h, 3.6), 0xc8a476, u, G + h / 2, f);
      P.add(BOX(w + 0.3, 0.3, 3.9), 0xa8845a, u, G + h + 0.15, f);
      P.add(BOX(0.9, 1.6, 0.1), 0x3a2a1a, u, G + 0.8, f - 1.82);
    }
    P.scatter(
      16,
      36,
      90,
      (u, f, R) => P.add(BALL(1, 8), 0xd8b080, u, G - 0.3, f, 0, R() * 3, 0, 6 + R() * 4, 1.4 + R(), 3),
      80,
      6
    );
    for (let k = 0; k < 12; k++)
      P.add(BOX(0.5, 0.5, 0.5), 0xb8a070, -20 + k * 3.6, G + 0.25, ROAD.F - ROAD.W / 2 - 1.4, 0, k, 0);
    for (const [u, f] of [
      [-30, 32],
      [-34, 36],
      [34, 20],
      [-26, 14]
    ])
      P.palm(u, f, 1.1);
    P.scatter(50, 4, 70, (u, f, R) => Math.abs(f - ROAD.F) > 4 && P.bush(u, f, 0.4 + R() * 0.5, 0x8a8a4a), 60, 4);
  },
  slots: [],
  cover: null
};
LAYOUTS.indy_road = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "can", n: 6, f: 3.5, u0: -5, u1: 5, size: 0.38, tint: ["steel", "red"], bank: 3 });
  L.row({ kind: "skull", n: 4, f: 12, u0: -4, u1: 4, base: 1.4, size: 0.42, tint: "white", perch: true });
  L.row({ kind: "helmet", n: 6, f: 30, u0: -9, u1: 9, base: 1.2, size: 0.5, tint: "steel", bank: 3 });
  L.row({ ...fixed, kind: "can", n: 4, f: 45.6, u0: -26, u1: -20, base: 14.2, size: 0.6, tint: "red", bank: 4 });
  L.row({ ...fixed, kind: "lantern", n: 3, f: ROAD.F + 3.9, u0: -15, u1: 15, base: 5.0, size: 0.4, tint: "gold" });
  const rocks = [
    ["soldier", 75],
    ["colonel", 10, { pts: 75 }],
    ["sallah", 15, { dont: true }]
  ];
  L.pops({
    fixed: true,
    f: 9,
    at: [
      [-9, 0],
      [5, 0],
      [12, 0]
    ],
    size: 1.8,
    kinds: rocks
  });
  L.pops({
    fixed: true,
    f: 28.5,
    at: [
      [-6, 0],
      [8, 0],
      [18, 0]
    ],
    size: 1.8,
    kinds: rocks
  });
  L.pops({
    fixed: true,
    f: 46,
    at: [
      [-30, 14],
      [22, 12]
    ],
    size: 1.6,
    period: [6, 9],
    kinds: [["soldier", 100, { pts: 50 }]]
  });
  L.pops({
    fixed: true,
    f: 30.4,
    at: [
      [-12, 3],
      [12, 3.4]
    ],
    size: 1.6,
    kinds: rocks
  });
};
const roadWave = (R, add, c) => {
  const convoy = (t, n) => {
    const dir = R(0, 1) < 0.5 ? 1 : -1;
    for (let k = 0; k < n; k++) {
      const kind = k === 0 ? "i_sidecar" : R(0, 1) < 0.65 ? "i_truck" : "i_sidecar";
      add(t + k * 2.2, kind, {
        ...cross(R, { u0: -dir * 34, u1: dir * 34, f: ROAD.F + R(-0.8, 0.8), v: 12 * c.S, bob: 0.04 })
      });
    }
  };
  const out = t =>
    add(
      t,
      "i_soldierRun",
      rush(
        R,
        [
          [pick(R, [-6, 8, 18]), 28.5, G],
          [R(-8, 8), R(5, 8), G]
        ],
        R(3.4, 4.4) * c.S
      )
    );
  if (c.x2) {
    // the convoy, Indy on the horse after it
    convoy(1, 6);
    add(3, "i_horseIndy", run(R, { v: 13, f: ROAD.F + 1.5 }));
    convoy(15, 5);
    for (let k = 0; k < 4; k++) out(2 + k * 5);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  convoy(R(1, 6), 2 + n(1.5));
  if (k >= 2) convoy(R(12, 18), 1 + n(1));
  for (let j = 0; j < 1 + n(1.2); j++) out(R(1, 22));
  if (k === 1 || k === 4)
    for (let j = 0; j < 1 + n(1.2); j++)
      add(R(1, 24), "i_fighter", across(R, { v: R(20, 26) * c.S, h: R(9, 16), f: R(20, 45), weave: 2 }));
  if (k === 3) for (let j = 0; j < 4; j++) add(2 + j * 2.5, "i_camelDont", run(R, { v: 2.5, f: 36 }));
  if (k === 0 || k === 5) flyers(["i_pigeon", "i_vulture"], R, add, c, 2 + n(1));
  if (R(0, 1) < 0.25) add(R(2, 18), "i_horseIndy", run(R, { v: 13, f: ROAD.F + 1.5 }));
};

// ---- Level 7: the Temple of Doom ---------------------------------------------------

const DOOM = { W: 16, FRONT: -11, BACK: 46, CEIL: 18, PIT: [0, 30, 5.5], KALI: 42, ALTAR: 24 };
function kali(P) {
  const f = DOOM.KALI;
  const c = 0x3a1e18;
  const r = 0x8a1a10;
  P.add(BOX(8, 3, 4), 0x2a1a14, 0, G + 1.5, f);
  P.add(BOX(4.4, 6, 3), c, 0, G + 6, f + 0.4);
  P.add(BOX(3.6, 4, 2.8), c, 0, G + 3.5, f);
  P.add(BALL(1.5, 10), c, 0, G + 10.2, f);
  P.add(BOX(3.2, 1.2, 0.3), 0xc8a040, 0, G + 11.6, f - 0.4);
  for (let k = 0; k < 5; k++) P.add(CONE(0.25, 1.0, 4), 0xc8a040, -1.2 + k * 0.6, G + 12.5, f - 0.4);
  P.add(BOX(0.6, 0.25, 0.1), 0xff4a1a, -0.6, G + 10.4, f - 1.45);
  P.add(BOX(0.6, 0.25, 0.1), 0xff4a1a, 0.6, G + 10.4, f - 1.45);
  P.add(BOX(0.9, 0.5, 0.1), r, 0, G + 9.6, f - 1.45);
  for (const s of [-1, 1])
    for (let k = 0; k < 3; k++) {
      const a = -0.6 + k * 0.6;
      P.add(
        BOX(0.7, 4.2, 0.7),
        c,
        s * (3 + Math.cos(a) * 1.2),
        G + 7.5 + Math.sin(a) * 2.4,
        f - 0.2,
        0,
        0,
        s * (0.6 + a)
      );
    }
  for (let k = 0; k < 9; k++)
    P.add(BALL(0.35, 6), 0xe8dcc0, -2 + k * 0.5, G + 8.2 - Math.sin((k / 8) * Math.PI) * 1.4, f - 1.3);
}
WORLDS.indy_doom = {
  sky: { top: "#1a0a06", mid: "#2a0e08", horizon: "#3a140a", ground: "#1a0a06", seed: 171 },
  fog: 0x3a1208,
  build(P) {
    const R = DOOM;
    room(P, R, { floor: 0x3a2418, wall: 0x4a2a1c, ceil: 0x2a1610 });
    backWall(P, R, 0x3a2016);
    // the rock: lumps on the walls, the ledges where the faithful stand
    for (const s of [-1, 1]) {
      for (let f = -8; f < R.BACK; f += 5)
        P.add(BALL(2.2, 7), 0x4a2a1c, s * (R.W - 0.5), G + 2 + ((f * 7) % 9), f, 0, f, 0, 0.6, 1.4, 1.2);
      P.add(SLAB(3, 0.6, 30), 0x5a3422, s * (R.W - 1.5), G + 5.5, 22);
      for (let f = 10; f < 36; f += 6) P.add(BOX(0.2, 1.2, 0.2), 0x2a1a10, s * (R.W - 3), G + 6.4, f);
    }
    kali(P);
    // the pit of lava below her, the cage on its chain
    const [pu, pf, pr] = R.PIT;
    P.add(CYL(pr, pr, 0.04, 28), 0xff6a1a, pu, G + 0.03, pf);
    P.add(CYL(pr * 0.7, pr * 0.7, 0.05, 24), 0xffc040, pu, G + 0.05, pf);
    P.add(TORUS(pr + 0.3, 0.4, 28), 0x2a1a10, pu, G + 0.2, pf, Math.PI / 2);
    P.add(BOX(1.6, 2.2, 1.6), 0x6a5a48, pu, G + 7, pf, 0, 0.4, 0);
    for (const [x, z] of [
      [-0.8, -0.8],
      [0.8, -0.8],
      [-0.8, 0.8],
      [0.8, 0.8]
    ])
      P.add(CYL(0.04, 0.04, 2.4, 4), 0x2a2a2a, pu + x, G + 7, pf + z);
    P.add(CYL(0.05, 0.05, R.CEIL - 8, 4), 0x2a2a2a, pu, G + (R.CEIL + 8) / 2, pf);
    // the altar, braziers, piles of skulls, the drums
    P.add(BOX(5, 1.2, 2.4), 0x5a3a28, 0, G + 0.6, R.ALTAR);
    P.add(BOX(5.4, 0.2, 2.8), 0x8a1a10, 0, G + 1.3, R.ALTAR);
    for (const [u, f] of [
      [-6, 18],
      [6, 18],
      [-7, 36],
      [7, 36],
      [-4, 8],
      [4, 8]
    ]) {
      P.add(CYL(0.4, 0.25, 1.4, 8), 0x3a2a1a, u, G + 0.7, f);
      P.add(CONE(0.45, 1.0, 6), 0xff8a2a, u, G + 1.85, f);
      P.add(CONE(0.25, 0.6, 5), 0xffd040, u, G + 1.75, f);
    }
    for (const [u, f] of [
      [-10, 12],
      [10, 14],
      [-11, 30]
    ])
      for (let k = 0; k < 8; k++)
        P.add(BALL(0.25, 6), 0xe8dcc0, u + (k % 3) * 0.4, G + 0.25 + Math.floor(k / 3) * 0.35, f + (k % 2) * 0.3);
    P.scatter(
      40,
      -4,
      R.BACK,
      (u, f, Rr) => P.add(CONE(0.5 + Rr() * 0.6, 2 + Rr() * 3, 5), 0x3a2016, u, G + R.CEIL - 1.5, f, Math.PI, 0, 0),
      R.W
    );
    for (const s of [-1, 1]) {
      P.add(BOX(0.1, 6, 2.2), 0x8a1a10, s * 5, G + 10, R.KALI - 3);
      P.add(BOX(0.12, 0.8, 1.2), 0xc8a040, s * 5, G + 10.5, R.KALI - 3);
      for (let k = 0; k < 5; k++) P.add(BOX(0.08, 0.6, 0.08), 0x2a2a2a, s * (2 + k), G + R.CEIL - 1 - k * 0.3, 20);
    }
    for (let k = 0; k < 7; k++) P.add(BOX(1.4, 0.3, 0.6), 0x5a3422, -4.5 + k * 1.5, G + 0.15, R.ALTAR - 2.2);
    for (const u of [-9, 9]) {
      P.add(CYL(0.8, 0.8, 1.0, 12), 0x8a5a3a, u, G + 0.5, 4);
      P.add(CYL(0.82, 0.82, 0.05, 12), 0xe8dcc0, u, G + 1.02, 4);
    }
    for (const s of [-1, 1])
      for (let f = 0; f < R.BACK - 8; f += 9) {
        P.add(CYL(0.9, 1.3, R.CEIL, 7), 0x3a2016, s * (R.W - 4.5), G + R.CEIL / 2, f + 4);
        for (let k = 0; k < 4; k++) P.add(BALL(0.22, 5), 0xe8dcc0, s * (R.W - 4.5) + k * 0.3 - 0.45, G + 0.22, f + 3);
      }
    P.scatter(
      36,
      0,
      R.BACK,
      (u, f, Rr) => P.add(BALL(0.6 + Rr() * 0.6, 6), 0x3a2418, u, G + 0.1, f, 0, Rr() * 3, 0, 1.4, 0.6, 1.1),
      R.W - 2,
      5
    );
  },
  slots: [],
  cover: null
};
LAYOUTS.indy_doom = L => {
  const R = DOOM;
  const fixed = { fixed: true, rail: false };
  L.row({ ...fixed, kind: "skull", n: 6, f: 3, u0: -4.5, u1: 4.5, size: 0.4, tint: "white", bank: 3 });
  L.row({
    ...fixed,
    kind: "stone",
    n: 3,
    f: R.ALTAR - 0.4,
    u0: -1.6,
    u1: 1.6,
    base: 1.4,
    size: 0.45,
    tint: "gold",
    bank: 3
  });
  for (const s of [-1, 1])
    L.row({
      ...fixed,
      kind: "skull",
      n: 4,
      f: 19.8,
      u0: s * (R.W - 2.4),
      u1: s * (R.W - 2.4),
      base: 5.8,
      size: 0.4,
      tint: "white"
    });
  L.row({
    ...fixed,
    kind: "stone",
    n: 3,
    f: R.KALI - 2.2,
    u0: -1.6,
    u1: 1.6,
    base: 3.0,
    size: 0.6,
    tint: "gold",
    bank: 3
  });
  L.row({ kind: "skull", n: 5, f: 12, u0: -6, u1: 6, base: 1.2, size: 0.4, tint: "white", bank: 5 });
  L.row({
    ...fixed,
    kind: "idol",
    n: 2,
    f: R.KALI - 2.4,
    u0: -3.6,
    u1: 3.6,
    base: 0.4,
    size: 0.7,
    tint: "gold",
    bank: 2
  });
  const cult = [
    ["thuggee", 70],
    ["molaram", 8, { pts: 250 }],
    ["willie", 12, { dont: true }],
    ["shorty", 10, { dont: true }]
  ];
  for (const f of [12, 24, 34])
    L.pops({
      fixed: true,
      f: f + 0.6,
      at: [
        [-(R.W - 2), 6.0],
        [R.W - 2, 6.0]
      ],
      size: 1.8,
      kinds: [["thuggee", 100]]
    });
  L.pops({
    fixed: true,
    f: R.ALTAR + 0.9,
    at: [[0, 1.4]],
    size: 1.9,
    period: [5, 8],
    kinds: [
      ["molaram", 45, { pts: 250 }],
      ["thuggee", 55]
    ]
  });
  L.pops({
    fixed: true,
    f: R.PIT[1] - 0.9,
    at: [[0, 6.0]],
    size: 1.0,
    period: [6, 9],
    kinds: [["willie", 100, { dont: true }]]
  });
  L.pops({
    fixed: true,
    f: 8.6,
    at: [
      [-4, 0],
      [4, 0]
    ],
    size: 1.8,
    kinds: cult
  });
};
const doomWave = (R, add, c) => {
  const D = DOOM;
  const rush_ = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      "i_thuggeeRun",
      rush(
        R,
        [
          [s * (D.W - 2), R(14, 32), G],
          [s * R(2, 8), R(4, 8), G]
        ],
        R(3, 4) * c.S
      )
    );
  };
  const torches = n => {
    for (let k = 0; k < n; k++) {
      const s = R(0, 1) < 0.5 ? 1 : -1;
      add(
        2 + (k * 24) / n,
        "i_torch",
        lobbed(R, { u: s * (D.W - 2), f: R(12, 34), h: G + 7, vh: R(2, 4), vu: -s * R(2, 4), vf: -R(2, 4) })
      );
    }
  };
  if (c.x2) {
    for (let k = 0; k < 8; k++) rush_(1 + k * 2.8);
    add(5, "i_molaramRun", { ...cross(R, { u0: -6, u1: 0, f: D.ALTAR - 1.5, v: 1.4, stop: 6 }) });
    flyers(["i_bat", "i_bat"], R, add, c, 6);
    torches(3);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) rush_(R(1, 22));
  if (k === 3) add(R(2, 12), "i_molaramRun", { ...cross(R, { u0: 6, u1: 0, f: D.ALTAR - 1.5, v: 1.4, stop: 6 }) });
  if (k === 1 || k === 4) torches(2 + n(1));
  if (k !== 3) flyers(["i_bat", "i_bat"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.3) add(R(2, 18), "i_shortyRun", cross(R, { u0: -9, u1: 9, f: R(6, 10), v: 3 }));
};

// ---- Level 8: the mine carts -------------------------------------------------------

const MINE = {
  W: 18,
  FRONT: -11,
  BACK: 52,
  CEIL: 16,
  TRACKS: [
    [9, 0.6],
    [20, 4],
    [32, 8],
    [44, 3]
  ]
};
function trestle(P, f, h) {
  P.add(BOX(2 * MINE.W, 0.12, 0.12), 0x6a6a6a, 0, G + h + 0.3, f - 0.45);
  P.add(BOX(2 * MINE.W, 0.12, 0.12), 0x6a6a6a, 0, G + h + 0.3, f + 0.45);
  P.add(BOX(2 * MINE.W, 0.15, 1.6), 0x4a3424, 0, G + h + 0.15, f);
  if (h > 0.8)
    for (let u = -MINE.W + 2; u < MINE.W; u += 4) {
      P.add(BOX(0.25, h, 0.25), 0x5a3a24, u, G + h / 2, f - 0.6);
      P.add(BOX(0.25, h, 0.25), 0x5a3a24, u, G + h / 2, f + 0.6);
      P.add(BOX(0.15, Math.hypot(h, 1.2), 0.15), 0x5a3a24, u, G + h / 2, f, Math.atan2(1.2, h), 0, 0);
    }
}
WORLDS.indy_mine = {
  sky: { top: "#100806", mid: "#1a0e08", horizon: "#22140a", ground: "#100806", seed: 181 },
  fog: 0x2a160a,
  build(P) {
    const R = MINE;
    room(P, R, { floor: 0x3a2a1c, wall: 0x4a3222, ceil: 0x2a1c12 });
    backWall(P, R, 0x3a2618);
    for (const s of [-1, 1])
      for (let f = -8; f < R.BACK; f += 4.5)
        P.add(BALL(2, 7), 0x4a3222, s * (R.W - 0.4), G + 1.5 + ((f * 5) % 11), f, 0, f, 0, 0.6, 1.5, 1.1);
    for (let f = -6; f < R.BACK; f += 6) {
      P.add(BOX(2 * R.W, 0.5, 0.5), 0x5a3a24, 0, G + R.CEIL - 1.2, f);
      for (const s of [-1, 1]) P.add(BOX(0.5, R.CEIL - 1.2, 0.5), 0x5a3a24, s * (R.W - 1), G + (R.CEIL - 1.2) / 2, f);
    }
    for (const [f, h] of R.TRACKS) trestle(P, f, h);
    // the lava glow far down, lanterns, ore heaps, the water tower
    P.add(BOX(2 * R.W, 0.1, 6), 0xff6a1a, 0, G + 0.05, R.BACK - 3);
    for (const [u, f] of [
      [-12, 6],
      [10, 15],
      [-8, 26],
      [12, 38]
    ]) {
      P.add(BALL(1.8, 7), 0x5a4a3a, u, G, f, 0, 0, 0, 1.4, 0.8, 1.2);
      for (let k = 0; k < 5; k++)
        P.add(BALL(0.2, 5), [0xc8a040, 0x8a8a8a][k % 2], u + Math.cos(k) * 1.2, G + 0.9, f + Math.sin(k));
    }
    for (let f = 2; f < R.BACK; f += 7)
      for (const s of [-1, 1]) {
        P.add(BOX(0.4, 0.4, 0.4), 0x2a1a10, s * (R.W - 1.3), G + 4.5, f);
        P.add(BALL(0.18, 6), 0xffc060, s * (R.W - 1.3), G + 4.2, f);
      }
    for (const [u, f, h] of [
      [-10, 9, 0.6],
      [8, 20, 4],
      [-4, 32, 8]
    ]) {
      P.add(BOX(1.4, 0.9, 1.0), 0x6a6058, u, G + h + 0.75, f);
      for (const e of [-1, 1])
        P.add(CYL(0.25, 0.25, 0.1, 8), 0x2a2a2a, u + e * 0.5, G + h + 0.4, f - 0.55, Math.PI / 2);
    }
    for (const [u, f, h] of [
      [-15, 19.4, 4],
      [15, 31.4, 8]
    ]) {
      for (const e of [-1, 1]) P.add(BOX(0.1, h, 0.1), 0x5a3a24, u + e * 0.3, G + h / 2, f);
      for (let y = 0.4; y < h; y += 0.45) P.add(BOX(0.6, 0.05, 0.05), 0x5a3a24, u, G + y, f);
    }
    P.scatter(
      30,
      0,
      48,
      (u, f, Rr) =>
        Math.abs(u) > 12 &&
        P.add(CONE(0.15, 0.5 + Rr() * 0.6, 5), Rr() < 0.5 ? 0x7ad0e0 : 0xc8a0e8, u, G + 0.3, f, 0, 0, Rr() - 0.5),
      MINE.W
    );
    P.add(CYL(2.2, 2.2, 3.4, 12), 0x6a4a30, 14, G + 10, 28);
    for (const [x, z] of [
      [-1.6, -1.6],
      [1.6, -1.6],
      [-1.6, 1.6],
      [1.6, 1.6]
    ])
      P.add(BOX(0.25, 8.3, 0.25), 0x5a3a24, 14 + x, G + 4.15, 28 + z);
    P.scatter(
      30,
      -4,
      R.BACK,
      (u, f, Rr) => P.add(BALL(0.5 + Rr() * 0.6, 6), 0x4a3828, u, G + 0.1, f, 0, Rr() * 3, 0, 1.3, 0.7, 1.1),
      R.W - 2,
      4
    );
    for (let f = -3; f < R.BACK; f += 6)
      for (const s of [-1, 1]) P.add(BOX(0.4, 0.4, 3.2), 0x5a3a24, s * (R.W - 1), G + R.CEIL - 1.5, f, 0.6, 0, 0);
  },
  slots: [],
  cover: null
};
LAYOUTS.indy_mine = L => {
  const fixed = { fixed: true, rail: false };
  L.row({
    ...fixed,
    kind: "lantern",
    n: 6,
    f: 4,
    u0: -5,
    u1: 5,
    base: 1.0,
    size: 0.38,
    tint: "gold",
    bank: 3,
    rail: true
  });
  for (const [f, h] of MINE.TRACKS.slice(1))
    L.row({
      ...fixed,
      kind: "stone",
      n: 4,
      f: f - 0.9,
      u0: -10,
      u1: 10,
      base: h + 0.3,
      size: 0.45,
      tint: "gold",
      bank: 4
    });
  L.row({ ...fixed, kind: "skull", n: 4, f: 14, u0: -6, u1: 6, size: 0.4, tint: "white", bank: 4 });
  L.row({ ...fixed, kind: "can", n: 3, f: 27.5, u0: 12.6, u1: 15.4, base: 11.7, size: 0.5, tint: "steel", bank: 3 });
  const guards = [
    ["thuggee", 80],
    ["shorty", 10, { dont: true }],
    ["willie", 10, { dont: true }]
  ];
  L.pops({
    fixed: true,
    f: 6.8,
    at: [
      [-12, 0],
      [10, 0]
    ],
    size: 1.8,
    kinds: guards
  });
  for (const [f, h] of MINE.TRACKS.slice(1, 3))
    L.pops({
      fixed: true,
      f: f + 0.8,
      at: [
        [-14, h + 0.3],
        [14, h + 0.3]
      ],
      size: 1.8,
      kinds: [["thuggee", 100]]
    });
  L.pops({
    fixed: true,
    f: 38.8,
    at: [
      [12, 0],
      [-8, 0]
    ],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["thuggee", 85, { pts: 50 }],
      ["molaram", 15, { pts: 250 }]
    ]
  });
  L.pops({
    fixed: true,
    f: MINE.TRACKS[3][0] + 0.8,
    at: [
      [-10, MINE.TRACKS[3][1] + 0.3],
      [6, MINE.TRACKS[3][1] + 0.3]
    ],
    size: 1.8,
    kinds: guards
  });
};
const mineWave = (R, add, c) => {
  const cart = (t, kind = "i_cart") => {
    const [f, h] = pick(R, MINE.TRACKS);
    add(t, kind, skim(R, { v: R(9, 13) * c.S, f, h: h + 0.35, u0: MINE.W - 0.5 }));
  };
  if (c.x2) {
    for (let k = 0; k < 12; k++) cart(1 + k * 2);
    add(8, "i_shortyCart", skim(R, { v: 11, f: MINE.TRACKS[1][0], h: MINE.TRACKS[1][1] + 0.35, u0: MINE.W - 0.5 }));
    flyers(["i_bat", "i_bat"], R, add, c, 4);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 3 + n(2.5); j++) cart(R(1, 24));
  for (let j = 0; j < 1 + n(1); j++) {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      R(1, 22),
      "i_thuggeeRun",
      rush(
        R,
        [
          [s * (MINE.W - 1), R(10, 30), G],
          [s * R(2, 8), R(4, 8), G]
        ],
        R(3, 4) * c.S
      )
    );
  }
  if (k === 2 || k === 5) flyers(["i_bat", "i_bat"], R, add, c, 2 + n(1));
  if (R(0, 1) < 0.35)
    add(
      R(2, 18),
      "i_shortyCart",
      skim(R, { v: 11, f: MINE.TRACKS[0][0], h: MINE.TRACKS[0][1] + 0.35, u0: MINE.W - 0.5 })
    );
};

// ---- Level 9: the canyon tank ------------------------------------------------------

const CAN = { W: 9, CLIFF: 22 };
WORLDS.indy_canyon = {
  sky: {
    top: "#3a6ab0",
    mid: "#8ab4dc",
    horizon: "#f2d8b0",
    ground: "#a86a42",
    sun: [10, 60, "#fffbe8", 11],
    clouds: 3,
    hills: [{ colour: "#b8784a", height: 10, rough: 3 }],
    seed: 191
  },
  fog: 0xd8a87a,
  build(P) {
    P.ground(0xc0885a, [{ u: 0, f: 30, r: 6, c: 0xa87a52, sx: 1.4, sz: 6 }]);
    // the canyon walls: stacked blocks either side, narrowing away
    for (const s of [-1, 1])
      for (let f = -8; f < 90; f += 6) {
        const w = CAN.W + 6 - Math.min(5, f * 0.06);
        const h = CAN.CLIFF + ((f * 13) % 7);
        P.add(BOX(14, h, 6.4), [0xb06a40, 0xa86038, 0xc07a4a][Math.abs(f) % 3], s * (w + 7), G + h / 2, f);
        P.add(BOX(12, 2, 5), 0xc88858, s * (w + 7.5), G + h + 1, f + 0.5);
        if (f > 6 && f < 60 && (f / 6) % 2 === 0) P.add(BOX(3, 0.6, 3), 0xc88858, s * (w - 0.5), G + h * 0.45, f);
      }
    // the trail down the middle, rocks, a dead tree, the cow skull
    for (const [u, f, s] of [
      [-4, 6, 1],
      [5, 8, 1.2],
      [-6, 20, 1.4],
      [6, 24, 1],
      [-3, 40, 1.6],
      [4, 46, 1.2]
    ])
      P.rock(u, f, s * 1.5, 0xa86a42);
    P.add(CYL(0.15, 0.25, 4, 5), 0x4a3a2a, 3, G + 2, 14, 0, 0, 0.2);
    P.add(CYL(0.08, 0.1, 2, 4), 0x4a3a2a, 3.6, G + 3.6, 14, 0, 0, -0.7);
    P.scatter(24, 2, 80, (u, f, R) => Math.abs(u) < CAN.W && P.rock(u, f, 0.3 + R() * 0.6, 0xb07a4a), CAN.W);
    // at the canyon's end, the temple carved in the rock (the Grail's)
    P.add(BOX(14, 18, 2), 0xc8846a, 0, G + 9, 76);
    for (let k = 0; k < 6; k++) P.add(CYL(0.45, 0.5, 7, 8), 0xd8987a, -5 + k * 2, G + 3.5, 74.6);
    P.add(BOX(12, 1.2, 1.6), 0xd8987a, 0, G + 7.6, 74.8);
    P.add(CONE(6.6, 2.4, 4), 0xd8987a, 0, G + 9.4, 74.8, 0, Math.PI / 4, 0, 1, 1, 0.2);
    P.add(BOX(2.2, 3.6, 0.2), 0x2a140c, 0, G + 1.8, 74.5);
    P.add(CYL(1.2, 1.2, 3, 10), 0xd8987a, 0, G + 13, 74.8);
    // boulders at the walls' feet
    for (const s of [-1, 1]) for (let f = 0; f < 70; f += 9) P.rock(s * (CAN.W + 0.5), f + 3, 2.2, 0x9a5a36);
    for (const s of [-1, 1])
      for (let f = -6; f < 80; f += 6) {
        const w = CAN.W + 6 - Math.min(5, f * 0.06);
        for (const h of [5, 11, 17]) P.add(BOX(0.6, 0.5, 6.2), 0x9a5634, s * (w + 0.1), G + h, f);
      }
    P.scatter(90, 0, 72, (u, f, R) => Math.abs(u) < CAN.W - 0.5 && P.bush(u, f, 0.3 + R() * 0.4, 0x7a7a3a), CAN.W);
  },
  slots: [],
  cover: null
};
LAYOUTS.indy_canyon = L => {
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "can", n: 6, f: 3.5, u0: -4, u1: 4, size: 0.38, tint: ["steel", "red"], bank: 3 });
  L.row({ ...fixed, kind: "skull", n: 3, f: 13.7, u0: 2.4, u1: 4.2, base: 2.2, size: 0.4, tint: "white", bank: 3 });
  L.row({
    ...fixed,
    kind: "helmet",
    n: 5,
    f: 26,
    u0: -5,
    u1: 5,
    base: 1.2,
    size: 0.5,
    tint: "steel",
    bank: 5,
    rail: true
  });
  L.row({ ...fixed, kind: "can", n: 4, f: 50, u0: -4, u1: 4, size: 0.6, tint: "red", bank: 4 });
  L.row({ kind: "skull", n: 4, f: 17, u0: -3, u1: 3, base: 1.3, size: 0.42, tint: "white", perch: true });
  L.row({ ...fixed, kind: "idol", n: 2, f: 74, u0: -1.5, u1: 1.5, base: 2.4, size: 0.8, tint: "gold", bank: 2 });
  const ledges = [];
  for (const s of [-1, 1])
    for (let f = 12; f < 60; f += 12) {
      const w = CAN.W + 6 - Math.min(5, f * 0.06);
      ledges.push([s * (w - 0.5), f, (CAN.CLIFF + ((f * 13) % 7)) * 0.45 + 0.3]);
    }
  for (const [u, f, h] of ledges)
    L.pops({
      fixed: true,
      f: f - 0.4,
      at: [[u, h]],
      size: 1.7,
      busy: 0.7,
      kinds: [
        ["soldier", 85],
        ["colonel", 15, { pts: 75 }]
      ]
    });
  L.pops({
    fixed: true,
    f: 74.2,
    at: [[0, 0]],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["soldier", 70, { pts: 50 }],
      ["donovan", 30, { pts: 250 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 20.6,
    at: [
      [-6, 0],
      [6, 0]
    ],
    size: 1.8,
    kinds: [
      ["soldier", 80],
      ["indy", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 8.6,
    at: [
      [-4, 0],
      [5, 0]
    ],
    size: 1.8,
    kinds: [
      ["soldier", 75],
      ["henry", 12, { dont: true }],
      ["sallah", 13, { dont: true }]
    ]
  });
};
// Riding down the canyon towards you, then off across it (the canyon's too
// narrow to cross it all the way).
function flightish(R, c) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  return rush(
    R,
    [
      [R(-3, 3), 70, G],
      [R(-3, 3), R(24, 32), G],
      [s * (CAN.W + 3), R(14, 20), G]
    ],
    R(10, 13) * c.S,
    false
  );
}
// A fighter low down the canyon at you and up over you.
function flightOver(R, c) {
  return rush(
    R,
    [
      [R(-3, 3), 90, G + R(10, 14)],
      [R(-2, 2), 20, G + R(6, 9)],
      [R(-4, 4), -6, G + R(16, 22)]
    ],
    R(24, 30) * c.S,
    false
  );
}

const canyonWave = (R, add, c) => {
  const tankBy = t =>
    add(t, "i_tank", cross(R, { u0: R(0, 1) < 0.5 ? -14 : 14, u1: R(-3, 3), f: R(22, 34), v: 2.2 * c.S, stop: 8 }));
  const riders = (t, n) => {
    for (let k = 0; k < n; k++) add(t + k * 1.2, "i_rider", { ...flightish(R, c) });
  };
  if (c.x2) {
    tankBy(1);
    riders(3, 6);
    for (let k = 0; k < 3; k++) flyers(["i_gull", "i_gull"], R, add, c, 6);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 3) tankBy(R(1, 10));
  riders(R(2, 12), 1 + n(1.8));
  for (let j = 0; j < 1 + n(1); j++)
    add(
      R(1, 22),
      "i_soldierRun",
      rush(
        R,
        [
          [R(-6, 6), R(40, 55), G],
          [R(-5, 5), R(5, 9), G]
        ],
        R(3.6, 4.4) * c.S
      )
    );
  if (k === 2 || k === 5) flyers(["i_gull", "i_gull"], R, add, c, 3 + n(2));
  if (k === 1 || k === 4) for (let j = 0; j < 1 + n(1); j++) add(R(1, 22), "i_fighter", { ...flightOver(R, c) });
  if (R(0, 1) < 0.25) add(R(2, 18), "i_horseIndy", { ...flightish(R, c) });
};
// ---- Sound ------------------------------------------------------------------------

Object.assign(AMBIENCE, {
  indy_airfield(d, sr, R) {
    bed(d, sr, R, { wind: 1.4, hum: [72, 0.05] });
  },
  indy_road(d, sr, R) {
    bed(d, sr, R, { wind: 1.0, hum: [48, 0.06] });
    raiders(d, sr, R, 0.03);
  },
  indy_doom(d, sr, R) {
    bed(d, sr, R, { wind: 0.4, fire: 0.4, hum: [65, 0.05] });
    for (const off of [0, 8])
      for (let b = 0; b < 16; b++) drumHit(d, sr, off + b * 0.5, b % 4 === 3 ? 90 : 60, b % 2 ? 0.08 : 0.14, R);
  },
  indy_mine(d, sr, R) {
    bed(d, sr, R, { wind: 0.6, hum: [40, 0.06], fire: 0.2 });
    for (const off of [0, 8]) for (let b = 0; b < 32; b++) drumHit(d, sr, off + b * 0.25, 160, 0.02, R);
  },
  indy_canyon(d, sr, R) {
    bed(d, sr, R, { wind: 2, hum: [36, 0.05] });
    raiders(d, sr, R, 0.03);
  }
});

// ---- The levels --------------------------------------------------------------------

export const INDY_MORE = {
  kinds,
  levels: [
    {
      world: "indy_airfield",
      name: "THE FLYING WING",
      story: "They're loading the Ark onto a plane",
      music: "",
      amb: "indy_airfield",
      legend: "THE MECHANIC 100 · FIGHTERS 50 · DON'T SHOOT MARION OR INDY",
      wave: airfieldWave,
      title: (w, x2) => (x2 ? "THE FUEL'S GOING UP · DOUBLE POINTS" : null)
    },
    {
      world: "indy_road",
      name: "THE TRUCK CHASE",
      story: "The Ark's on a truck to Cairo. Stop the convoy",
      music: "",
      amb: "indy_road",
      legend: "TRUCKS AND SIDECARS 75 · DON'T SHOOT INDY ON HIS HORSE OR THE CAMELS",
      wave: roadWave,
      title: (w, x2) => (x2 ? "THE WHOLE CONVOY · DOUBLE POINTS" : null)
    },
    {
      world: "indy_doom",
      name: "THE TEMPLE OF DOOM",
      story: "Mola Ram has the Sankara stones",
      music: "",
      amb: "indy_doom",
      indoor: true,
      legend: "MOLA RAM 250 · SANKARA STONES IN BANKS · DON'T SHOOT WILLIE OR SHORT ROUND",
      wave: doomWave,
      title: (w, x2) => (x2 ? "KALI MA! · DOUBLE POINTS" : null)
    },
    {
      world: "indy_mine",
      name: "THE MINE CARTS",
      story: "Into the mine. Hang on to your hat",
      music: "",
      amb: "indy_mine",
      indoor: true,
      legend: "GUARDS IN CARTS 75 · DON'T SHOOT SHORT ROUND'S CART",
      wave: mineWave,
      title: (w, x2) => (x2 ? "EVERY CART IN THE MINE · DOUBLE POINTS" : null)
    },
    {
      world: "indy_canyon",
      name: "THE TANK IN THE CANYON",
      story: "They've got Dad in the tank",
      music: "",
      amb: "indy_canyon",
      legend: "THE TANK 150 · FIGHTERS 50 · DON'T SHOOT DAD, SALLAH OR INDY",
      wave: canyonWave,
      title: (w, x2) => (x2 ? "THE GULLS! · DOUBLE POINTS" : null)
    }
  ]
};
