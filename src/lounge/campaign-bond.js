import * as THREE from "three";
import {
  GROUND,
  BOX,
  CYL,
  BALL,
  CAP,
  CONE,
  TORUS,
  SLAB,
  GEO,
  WORLDS,
  CARDS,
  CARD_SIZE,
  AMBIENCE,
  part,
  merge,
  person
} from "./shoots-art";
import { LAYOUTS, PERSON, SHATTER, PLATE_SOUND, span } from "./plates";
import { SHAPES } from "./plates-shapes";
import { gunman, runner, thing, DONT, toss, walk, cross, across, hover, dart, pick } from "./shoot-paths";

// The Spy Night campaign (Jay, 2026-10-24: "a James Bond style mission ...
// ski chase, the harbour, the volcano base, the launch, and the Mastermind
// at the end"). Five levels:
//   1 THE VILLAIN'S CASINO  (the casino world, shoots.js SCREEN.bond)
//   2 THE SKI CHASE         a ski resort under the mountain: his men skiing
//                           down and across the slope, snowmobiles, snipers
//                           in the cable car's gondolas, the chalet's
//                           windows, his lair the round restaurant on the
//                           summit; tourists on skis (don't)
//   3 THE HARBOUR           his yacht in the harbour at night: speedboats
//                           under the piers, divers up out of the water,
//                           mines drifting in, his men on the decks, the
//                           container pier and its crane; our contact (don't)
//   4 THE VOLCANO BASE      inside the hollow volcano: a lava river and its
//                           bridges, the monorail, guards down ropes from the
//                           crater, the control room, the rocket on its pad;
//                           his scientists (don't)
//   5 THE LAUNCH            the countdown at dawn on the island: the rocket
//                           in its gantry, the bunker, drones, satellites and
//                           missiles to shoot down, and the Mastermind
//                           running for his helicopter
// Laid out as the other worlds are (u right, f downrange, h up from the roof
// deck, the ground at GROUND); shoots-art moves it all SHIFT m back and up.

const G = GROUND;

// ---- New outlines (the plates' atlas) ------------------------------------------

Object.assign(SHAPES, {
  // a snowmobile and its rider, facing left
  bond_sled: {
    polys: [
      [0, 44, 8, 36, 20, 30, 26, 18, 32, 18, 34, 30, 44, 36, 92, 34, 104, 38, 102, 48, 44, 50, 26, 52, 8, 52],
      [42, 48, 102, 48, 104, 54, 100, 62, 46, 62, 40, 54],
      [44, 36, 46, 18, 50, 14, 60, 14, 66, 20, 70, 36],
      [50, 0, 58, 0, 62, 4, 62, 11, 58, 14, 50, 14, 46, 11, 46, 4]
    ],
    lines: [
      [4, 0, 54, 4, 62, 38, 62],
      [3, 22, 52, 22, 62],
      [5, 48, 22, 34, 27]
    ],
    marks: [
      [3, 10, 45, 90, 42],
      [3, 46, 5, 53, 5]
    ],
    dots: [
      [52, 55, 3],
      [66, 55, 3],
      [80, 55, 3],
      [94, 55, 3]
    ]
  },
  // a speedboat with two of his men in it, facing left
  bond_boat: {
    polys: [
      [0, 24, 14, 30, 128, 32, 142, 28, 142, 42, 132, 50, 36, 50, 14, 40],
      [42, 32, 50, 18, 58, 18, 60, 32],
      [64, 32, 64, 12, 68, 8, 78, 8, 82, 12, 82, 32],
      [68, -8, 77, -8, 80, -5, 80, 3, 77, 6, 68, 6, 65, 3, 65, -5],
      [100, 32, 100, 16, 104, 12, 114, 12, 118, 16, 118, 32],
      [104, -2, 113, -2, 116, 1, 116, 8, 113, 11, 104, 11, 101, 8, 101, 1],
      [140, 26, 152, 24, 154, 46, 144, 48]
    ],
    lines: [
      [3, 66, 16, 46, 13],
      [3, 102, 20, 90, 18]
    ],
    marks: [
      [3, 16, 40, 134, 40],
      [2.5, 46, 28, 58, 28]
    ]
  },
  // a security camera on its wall bracket
  bond_cam: {
    polys: [
      [8, 4, 66, 0, 72, 4, 72, 38, 66, 42, 8, 38],
      [0, 0, 12, 4, 12, 38, 0, 42],
      [76, 42, 88, 42, 88, 64, 76, 64]
    ],
    lines: [[7, 56, 40, 62, 52, 80, 52]],
    marks: [
      [3, 18, 12, 60, 10],
      [3, 18, 30, 60, 30]
    ],
    dots: [[6, 21, 4]]
  }
});
SHATTER.add("bond_cam");
PLATE_SOUND.bond_cam = "glass";
PLATE_SOUND.bond_sled = "clank";
PLATE_SOUND.bond_boat = "clank";

// ---- New cut-outs ------------------------------------------------------------------

// Skis under a cut-out's feet, and a pole in its free hand.
function skis(c, W, H, col, pole) {
  const u = W / 10;
  const cx = W / 2;
  c.fillStyle = col;
  c.strokeStyle = "#111";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(cx - 4.9 * u, H * 0.93);
  c.quadraticCurveTo(cx - 4.6 * u, H * 0.972, cx - 3.8 * u, H * 0.972);
  c.lineTo(cx + 4.7 * u, H * 0.972);
  c.lineTo(cx + 4.7 * u, H * 0.994);
  c.lineTo(cx - 3.9 * u, H * 0.994);
  c.quadraticCurveTo(cx - 5.1 * u, H * 0.99, cx - 4.9 * u, H * 0.93);
  c.closePath();
  c.fill();
  c.stroke();
  if (!pole) return;
  c.strokeStyle = "#333";
  c.lineWidth = 0.35 * u;
  c.beginPath();
  c.moveTo(cx - 3.6 * u, H * 0.58);
  c.lineTo(cx - 4.5 * u, H * 0.97);
  c.stroke();
  c.fillStyle = "#333";
  c.fillRect(cx - 4.9 * u, H * 0.93, 0.9 * u, 0.25 * u);
}
// A ring round the eyes: ski goggles, a diver's mask.
function lens(c, W, H, frame, glass, w, h) {
  const u = W / 10;
  const cx = W / 2;
  c.fillStyle = frame;
  c.beginPath();
  c.ellipse(cx, H * 0.163, w * u, h * u, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = glass;
  c.beginPath();
  c.ellipse(cx, H * 0.163, (w - 0.3) * u, (h - 0.25) * u, 0, 0, Math.PI * 2);
  c.fill();
}
const outline = c => {
  c.lineWidth = 5;
  c.strokeStyle = "#111";
  c.stroke();
};

Object.assign(CARDS, {
  // his men on skis: white suits, black hoods, orange goggles
  bond_skier: (c, W, H) => {
    person(c, W, H, {
      body: "#eef0f4",
      legs: "#c8ccd6",
      arms: "#eef0f4",
      mask: "#151515",
      hair: "#151515",
      skin: "#e8c8a8",
      belt: "#c0182a",
      gun: true
    });
    lens(c, W, H, "#151515", "#ff8a1a", 1.75, 0.62);
    skis(c, W, H, "#c0182a", true);
  },
  // a holidaymaker on skis, hands up (don't)
  bond_tourist: (c, W, H) => {
    person(c, W, H, {
      body: "#e8348a",
      legs: "#2a9aa8",
      arms: "#e8348a",
      hair: "#7a4a2a",
      longHair: true,
      skin: "#f0c9a0",
      lips: "#c0182a",
      armsUp: true
    });
    const u = W / 10;
    const cx = W / 2;
    c.fillStyle = "#f2c230";
    c.beginPath();
    c.arc(cx, H * 0.14, 1.95 * u, Math.PI, Math.PI * 2);
    c.closePath();
    c.fill();
    outline(c);
    c.fillStyle = "#d89a20";
    c.fillRect(cx - 1.95 * u, H * 0.118, 3.9 * u, H * 0.022);
    c.fillStyle = "#e8348a";
    c.beginPath();
    c.arc(cx, H * 0.03, 0.7 * u, 0, Math.PI * 2);
    c.fill();
    outline(c);
    skis(c, W, H, "#f2c230", false);
  },
  // a frogman: wetsuit, mask and snorkel, a tank, a speargun
  bond_diver: (c, W, H) => {
    const u = W / 10;
    const cx = W / 2;
    c.fillStyle = "#f2c230";
    c.beginPath();
    c.rect(cx - 3.9 * u, H * 0.27, 1.3 * u, H * 0.26);
    c.fill();
    outline(c);
    person(c, W, H, {
      body: "#1a1e24",
      legs: "#1a1e24",
      arms: "#1a1e24",
      skin: "#1a1e24",
      belt: "#e8c050",
      gun: true
    });
    c.fillStyle = "#d8a888";
    c.beginPath();
    c.ellipse(cx, H * 0.2, 1.1 * u, 0.5 * u, 0, 0, Math.PI * 2);
    c.fill();
    lens(c, W, H, "#111", "#8ad8ff", 1.6, 0.8);
    c.fillStyle = "#111";
    c.fillRect(cx - 0.4 * u, H * 0.2, 0.8 * u, 0.5 * u);
    c.strokeStyle = "#ff7a1a";
    c.lineWidth = 0.45 * u;
    c.beginPath();
    c.moveTo(cx + 1.5 * u, H * 0.205);
    c.lineTo(cx + 2.1 * u, H * 0.05);
    c.stroke();
    c.fillStyle = "#f2c230";
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx + s * 0.4 * u, H * 0.95);
      c.lineTo(cx + s * 2.4 * u, H * 0.95);
      c.lineTo(cx + s * 4.4 * u, H * 0.995);
      c.lineTo(cx + s * 0.4 * u, H * 0.995);
      c.closePath();
      c.fill();
      outline(c);
    }
  },
  // our contact: a belted trench coat, a beret (don't)
  bond_contact: (c, W, H) => {
    person(c, W, H, {
      body: "#c8a468",
      dress: "#c8a468",
      trim: "#8a6a3a",
      arms: "#c8a468",
      hair: "#8a1a1a",
      longHair: true,
      skin: "#f0c9a0",
      lips: "#c0182a",
      hips: true
    });
    const u = W / 10;
    const cx = W / 2;
    c.fillStyle = "#5a3a1a";
    c.fillRect(cx - 2.6 * u, H * 0.52, 5.2 * u, H * 0.028);
    c.strokeStyle = "#8a6a3a";
    c.lineWidth = 0.35 * u;
    c.beginPath();
    c.moveTo(cx - 1.6 * u, H * 0.3);
    c.lineTo(cx, H * 0.45);
    c.lineTo(cx + 1.6 * u, H * 0.3);
    c.stroke();
    c.fillStyle = "#151515";
    c.beginPath();
    c.ellipse(cx + 0.4 * u, H * 0.068, 2.3 * u, 0.75 * u, -0.15, 0, Math.PI * 2);
    c.fill();
    outline(c);
  },
  // a guard in the base: orange overalls, a black helmet
  bond_guard: (c, W, H) => {
    person(c, W, H, {
      body: "#e8701a",
      legs: "#d0601a",
      arms: "#e8701a",
      belt: "#151515",
      skin: "#e0b890",
      gun: true
    });
    const u = W / 10;
    const cx = W / 2;
    c.fillStyle = "#151515";
    c.beginPath();
    c.arc(cx, H * 0.15, 2.15 * u, Math.PI, Math.PI * 2);
    c.closePath();
    c.fill();
    c.fillRect(cx - 2.5 * u, H * 0.14, 5 * u, 0.5 * u);
    c.strokeStyle = "#151515";
    c.lineWidth = 0.25 * u;
    c.beginPath();
    c.moveTo(cx, H * 0.3);
    c.lineTo(cx, H * 0.58);
    c.stroke();
    c.fillStyle = "#151515";
    c.beginPath();
    c.arc(cx - 1.4 * u, H * 0.38, 0.7 * u, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#f2c230";
    c.beginPath();
    c.moveTo(cx - 1.4 * u, H * 0.355);
    c.lineTo(cx - 1.0 * u, H * 0.39);
    c.lineTo(cx - 1.8 * u, H * 0.39);
    c.closePath();
    c.fill();
  },
  // one of his scientists: a lab coat, glasses, hands up (don't)
  bond_lab: (c, W, H) => {
    person(c, W, H, {
      body: "#f6f6f2",
      apron: "#f6f6f2",
      arms: "#f6f6f2",
      shirt: "#9ab8d8",
      tie: "#2a4a8a",
      legs: "#3a3a44",
      hair: "#b8b8b8",
      skin: "#f0c9a0",
      armsUp: true
    });
    const u = W / 10;
    const cx = W / 2;
    c.strokeStyle = "#111";
    c.lineWidth = 0.28 * u;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.arc(cx + s * 0.75 * u, H * 0.165, 0.55 * u, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = "#2a6ae8";
    c.fillRect(cx + 1.3 * u, H * 0.34, 0.25 * u, H * 0.04);
    c.fillStyle = "#e8344a";
    c.fillRect(cx + 1.7 * u, H * 0.34, 0.25 * u, H * 0.04);
    c.fillStyle = "#f2c230";
    c.fillRect(cx - 2.2 * u, H * 0.36, 1.2 * u, H * 0.035);
  },
  // the Mastermind: a grey high-collared suit, a scar, his white cat
  bond_mm: (c, W, H) => {
    person(c, W, H, {
      body: "#4a4e58",
      legs: "#3a3e48",
      arms: "#4a4e58",
      skin: "#e8c8a8",
      gun: true
    });
    const u = W / 10;
    const cx = W / 2;
    c.fillStyle = "#2a2e36";
    c.fillRect(cx - 1.1 * u, H * 0.285, 2.2 * u, H * 0.03);
    c.fillStyle = "#e8c050";
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.arc(cx, H * (0.36 + k * 0.07), 0.22 * u, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = "#8a3a3a";
    c.lineWidth = 0.22 * u;
    c.beginPath();
    c.moveTo(cx + 0.3 * u, H * 0.115);
    c.lineTo(cx + 1.2 * u, H * 0.215);
    c.stroke();
    c.fillStyle = "#f4f4f0";
    c.beginPath();
    c.ellipse(cx - 2.5 * u, H * 0.47, 1.9 * u, 0.95 * u, 0.2, 0, Math.PI * 2);
    c.fill();
    outline(c);
    c.beginPath();
    c.moveTo(cx - 4.3 * u, H * 0.37);
    c.lineTo(cx - 4.2 * u, H * 0.335);
    c.lineTo(cx - 3.7 * u, H * 0.36);
    c.lineTo(cx - 3.1 * u, H * 0.335);
    c.lineTo(cx - 3.0 * u, H * 0.375);
    c.arc(cx - 3.65 * u, H * 0.4, 0.85 * u, -0.3, Math.PI + 0.3);
    c.closePath();
    c.fill();
    outline(c);
    c.fillStyle = "#3ab54a";
    c.beginPath();
    c.arc(cx - 4.0 * u, H * 0.395, 0.18 * u, 0, Math.PI * 2);
    c.arc(cx - 3.3 * u, H * 0.395, 0.18 * u, 0, Math.PI * 2);
    c.fill();
  }
});
Object.assign(CARD_SIZE, {
  bond_skier: [1.0, 1.8],
  bond_tourist: [1.0, 1.8],
  bond_diver: [0.9, 1.8],
  bond_contact: [0.9, 1.8],
  bond_guard: [0.9, 1.8],
  bond_lab: [0.9, 1.8],
  bond_mm: [0.9, 1.85]
});
for (const k of ["bond_skier", "bond_tourist", "bond_diver", "bond_contact", "bond_guard", "bond_lab", "bond_mm"])
  PERSON.add(k);

// ---- New thrown and flown things -------------------------------------------------

GEO.bond_grenade = () =>
  merge([
    part(BALL(0.075, 8), 0x3a4a2a, 0, 0, 0, 0, 0, 0, 1, 1.3, 1),
    part(CYL(0.03, 0.03, 0.05, 6), 0x8a8a8a, 0, 0.1, 0),
    part(BOX(0.018, 0.1, 0.03), 0x9a9a9a, 0.04, 0.06, 0, 0, 0, -0.3),
    part(TORUS(0.022, 0.006, 8), 0xd8d8d8, -0.03, 0.13, 0)
  ]);
// a sea mine: a black ball with horns
GEO.bond_mine = () => {
  const P = [part(BALL(0.45, 10), 0x1e2024, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.5)];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    P.push(part(CYL(0.035, 0.06, 0.26, 5), 0x3a3a3e, Math.cos(a) * 0.48, 0.12, Math.sin(a) * 0.48, 0, -a, Math.PI / 2));
  }
  P.push(part(CYL(0.04, 0.06, 0.3, 5), 0x3a3a3e, 0, 0.55, 0));
  P.push(part(BALL(0.06, 5), 0xff3030, 0, 0.72, 0));
  return merge(P);
};
GEO.bond_lava = () =>
  merge([
    part(BALL(0.26, 7), 0xff6a1a, 0, 0, 0),
    part(BALL(0.17, 6), 0xffc23a, 0.14, 0.08, -0.1),
    part(BALL(0.15, 5), 0x8a2a0a, -0.16, -0.04, 0.08)
  ]);
// the monorail's car (open sided: the guards ride in it); built along z
GEO.bond_monorail = () => {
  const P = [
    part(BOX(2.2, 1.0, 6), 0x2a3a5a, 0, 0.5, 0),
    part(BOX(2.24, 0.16, 6.04), 0xc0282a, 0, 0.75, 0),
    part(BOX(2.3, 0.14, 6.2), 0xd8dce0, 0, 2.45, 0),
    part(BOX(1.1, 0.7, 4.4), 0x1a1e24, 0, -0.3, 0)
  ];
  for (const z of [-2.9, 2.9]) for (const x of [-1.0, 1.0]) P.push(part(BOX(0.1, 1.5, 0.1), 0xd8dce0, x, 1.7, z));
  for (const z of [-3.4, 3.4]) {
    P.push(part(BALL(1.1, 8), 0x2a3a5a, 0, 0.6, z, 0, 0, 0, 1, 0.75, 0.6));
    P.push(part(BALL(0.18, 5), 0xfff2b0, 0, 0.7, z * 1.16));
  }
  return merge(P);
};
GEO.bond_sat = () =>
  merge([
    part(BOX(0.55, 0.55, 0.8), 0xd8b040, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0.6),
    part(BOX(1.5, 0.04, 0.6), 0x2a4ab8, -1.15, 0, 0, 0, 0, 0, 1, 1, 1, 0.8),
    part(BOX(1.5, 0.04, 0.6), 0x2a4ab8, 1.15, 0, 0, 0, 0, 0, 1, 1, 1, 0.8),
    part(BOX(0.5, 0.05, 0.05), 0x9a9a9a, 0, 0, 0, 0, 0, 0),
    part(CONE(0.3, 0.15, 10), 0xf4f4f0, 0, 0.36, 0),
    part(CYL(0.015, 0.015, 0.5, 4), 0x9a9a9a, 0, 0.6, 0)
  ]);
GEO.bond_missile = () => {
  const P = [
    part(CYL(0.16, 0.16, 1.9, 10), 0xf2f2ee, 0, 0, 0),
    part(CONE(0.16, 0.45, 10), 0xc0182a, 0, 1.17, 0),
    part(CONE(0.13, 0.7, 8), 0xff9a2a, 0, -1.3, 0, Math.PI, 0, 0)
  ];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2;
    P.push(part(BOX(0.02, 0.4, 0.3), 0x2a2a2a, Math.cos(a) * 0.2, -0.75, Math.sin(a) * 0.2, 0, -a, 0));
  }
  return merge(P);
};

// ---- Kinds -----------------------------------------------------------------------

// His men on the move: cut-outs like the saloon's gunmen (50).
const mover = (cardKey, extra = {}) => ({ ...gunman(cardKey, 1.8), ...extra });
const dont = cardKey => ({ ...mover(cardKey), pts: -25, sound: "wrong", ...DONT });
const kinds = {
  bond_skierRun: mover("bond_skier"),
  bond_henchRun: mover("henchman"),
  bond_guardRun: mover("bond_guard"),
  bond_diverUp: mover("bond_diver", { sound: "splat" }),
  bond_touristRun: dont("bond_tourist"),
  bond_contactRun: dont("bond_contact"),
  bond_labRun: dont("bond_lab"),
  bond_mmRun: mover("bond_mm", { pts: 300, name: "THE MASTERMIND!" }),
  bond_sled: { ...runner("bond_sled", 0xe8344a, 1.5, 0.75, "clank"), hy: 0.8 },
  bond_sledB: { ...runner("bond_sled", 0x6a9ae8, 1.5, 0.75, "clank"), hy: 0.8 },
  bond_boat: { ...runner("bond_boat", 0xf4efe2, 1.7, 0.9, "clank"), hy: 0.9 },
  bond_boatB: { ...runner("bond_boat", 0xe8344a, 1.7, 0.9, "clank"), hy: 0.9 },
  // thrown at you, or drifting in: shoot it before it gets there (it costs everyone 10)
  bond_grenade: {
    ...thing("bond_grenade", 0, 25, 0.22, "shatter", "tumble", "clank"),
    arrive: "shot",
    blast: true,
    lose: "BOOM!"
  },
  bond_mine: {
    ...thing("bond_mine", 0, 25, 0.55, "shatter", "up", "clank"),
    arrive: "shot",
    blast: true,
    lose: "BOOM!"
  },
  bond_lava: thing("bond_lava", 0, 25, 0.3, "shatter", "tumble", "splat"),
  // (the car itself can't be shot: the guards in it can)
  bond_monorail: thing("bond_monorail", 0, 0, 0.1, "fall", "level", "clank"),
  bond_sat: { ...thing("bond_sat", 0, 50, 0.9, "fall", "spin", "clank"), name: "SATELLITE" },
  bond_missile: { ...thing("bond_missile", 0, 50, 0.4, "shatter", "fixed", "clank"), name: "MISSILE" }
};

// ---- Paths and scenery helpers ---------------------------------------------------

// Out to a spot in front of you; a gunman stops there, draws, and it costs
// everyone up there 10.
function rush(pts, v) {
  const w = walk(pts, v);
  return { dur: w.time + 2, charge: true, arrive: w.time + 0.8, pos: w.pos };
}
// Thrown at you; if it lands it goes off.
function lobbed(R, o) {
  const L = toss(R, o);
  return { ...L, charge: true, arrive: L.dur - 0.05 };
}

// A box from a to b ([u, h, f] each): cables, struts, braces.
function beam(P, c, a, b, t = 0.08) {
  const du = b[0] - a[0];
  const dh = b[1] - a[1];
  const df = b[2] - a[2];
  const len = Math.hypot(du, dh, df);
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  P.add(BOX(t, t, len), c, mid[0], mid[1], mid[2], Math.atan2(-dh / len, -df / len), Math.asin(du / len), 0);
}
// A triangle w wide and hgt tall standing on h0, depth deep from f (a gable
// end, a roof's end).
function gable(P, c, u, h0, f, w, hgt, depth) {
  P.add(
    new THREE.CylinderGeometry(1, 1, 1, 3),
    c,
    u,
    h0 + hgt / 3,
    f + depth / 2,
    -Math.PI / 2,
    0,
    0,
    w / Math.sqrt(3),
    depth,
    hgt / 1.5
  );
}
// A four-sided outline ([x, y] x 4 in u and h, going round) made solid,
// depth deep (from f on, away from you): a raked bow.
function slab4(pts, depth) {
  const at = (k, z) => [pts[(k % 4) * 2], pts[(k % 4) * 2 + 1], z];
  const faces = [
    [at(0, 0), at(3, 0), at(2, 0), at(1, 0)],
    [at(0, depth), at(1, depth), at(2, depth), at(3, depth)]
  ];
  for (let k = 0; k < 4; k++) faces.push([at(k, 0), at(k + 1, 0), at(k + 1, depth), at(k, depth)]);
  const pos = [];
  const index = [];
  for (const q of faces) {
    const n = pos.length / 3;
    for (const v of q) pos.push(...v);
    index.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}
// A pitched roof over a w wide, d deep building (eaves at h0, ridge hgt
// higher, running along f), with snow on it if asked.
function roof(P, c, u, h0, f, w, d, hgt, snow) {
  const half = w / 2 + 0.8;
  const pitch = Math.atan(hgt / (w / 2));
  const len = half / Math.cos(pitch);
  for (const s of [-1, 1]) {
    const cu = u + (s * half) / 2;
    const ch = h0 + hgt - (half / 2) * Math.tan(pitch);
    P.add(BOX(len, 0.3, d + 1.6), c, cu, ch + 0.15, f + d / 2, 0, 0, -s * pitch);
    if (snow) P.add(BOX(len, 0.25, d + 1.5), snow, cu, ch + 0.42, f + d / 2, 0, 0, -s * pitch);
  }
}
// A lattice tower: four legs from w0 apart at h0 to w1 at h1, braced.
function lattice(P, c, u, f, h0, h1, w0, w1, levels = 3, t = 0.18) {
  const at = (k, su, sf) => {
    const w = w0 + ((w1 - w0) * k) / levels;
    return [u + (su * w) / 2, h0 + ((h1 - h0) * k) / levels, f + (sf * w) / 2];
  };
  for (const su of [-1, 1]) for (const sf of [-1, 1]) beam(P, c, at(0, su, sf), at(levels, su, sf), t * 1.4);
  for (let k = 1; k <= levels; k++) {
    for (const sf of [-1, 1]) beam(P, c, at(k, -1, sf), at(k, 1, sf), t);
    for (const su of [-1, 1]) beam(P, c, at(k, su, -1), at(k, su, 1), t);
    // (crossed on the face towards you)
    beam(P, c, at(k - 1, -1, -1), at(k, 1, -1), t * 0.7);
    beam(P, c, at(k - 1, 1, -1), at(k, -1, -1), t * 0.7);
  }
}
// A pine standing on h0 (the slope), snow on its top.
function pine(P, u, f, h0, s = 1, snow = 0xf4f8fc) {
  P.add(CYL(0.12 * s, 0.18 * s, 1.2 * s, 5), 0x4a3020, u, h0 + 0.6 * s, f);
  P.add(CONE(1.3 * s, 3.2 * s, 7), 0x1e4a32, u, h0 + 2.6 * s, f);
  P.add(CONE(1.0 * s, 2.6 * s, 7), 0x24563a, u, h0 + 3.9 * s, f);
  if (snow) P.add(CONE(0.55 * s, 1.3 * s, 7), snow, u, h0 + 4.6 * s, f);
}
// A window: frame, glass, a cross bar; shutters if given.
function window_(P, u, h0, f, w, h, frame, glass, shutter) {
  P.add(BOX(w + 0.24, h + 0.24, 0.08), frame, u, G + h0 + h / 2, f - 0.03);
  P.add(BOX(w, h, 0.1), glass, u, G + h0 + h / 2, f - 0.05);
  P.add(BOX(0.06, h, 0.12), frame, u, G + h0 + h / 2, f - 0.06);
  P.add(BOX(w, 0.06, 0.12), frame, u, G + h0 + h / 2, f - 0.06);
  if (shutter)
    for (const s of [-1, 1])
      P.add(BOX(w * 0.48, h + 0.1, 0.06), shutter, u + s * (w * 0.76 + 0.12), G + h0 + h / 2, f - 0.06);
}

// ---- Level 2: the ski chase ------------------------------------------------------

// A ski resort under the mountain on a bright afternoon. You're on the hotel
// roof across the snowfield: the chalet and its terrace on the left (CF its
// front, CU its sides), the cable car's bottom station on the right (SF, SU),
// the slope rising from S0 to the summit at S1, TOP m up. The cable runs from
// the station up to the top station; his lair is the round restaurant there.
const SKI = { CF: 10, CU: [-27, -11], CD: 9, SF: 16, SU: [13, 27], S0: 26, S1: 66, TOP: 22 };
const sh = f => Math.min(SKI.TOP, Math.max(0, ((f - SKI.S0) * SKI.TOP) / (SKI.S1 - SKI.S0)));
const CABLE = [
  [20, G + 9.2, SKI.SF + 4],
  [-16, G + SKI.TOP + 7, SKI.S1 + 1]
];
const cableAt = t => CABLE[0].map((a, k) => a + (CABLE[1][k] - a) * t);
const GONDOLAS = [0.17, 0.47, 0.78];
const PYLONS = [0.32, 0.63];
const LAIR = [12, 72]; // the revolving restaurant (u, f of its middle), 7 m round
const SNOWBANKS = [
  [-4, 8.6],
  [4.5, 8.4]
];
const CHALET_DOWN = [-24.5, -21, -13.5];
const CHALET_UP = [-24, -19, -14];
const STATION_WIN = [15, 18.5, 22, 25.5];
const TERRACE = [-22, -15];
const SNOW = 0xe4ebf2;
// the piste markers' rows (evenly spaced across us)
const MARKERS = [
  { f: 19, us: span(6, -10.5, 10.5), base: 1.6, size: 0.42 },
  { f: 38, us: span(4, -14, 14), base: sh(38) + 1.3, size: 0.6 },
  { f: 50, us: [-9, 9], base: sh(50) + 1.3, size: 0.7 }
];

function chalet(P) {
  const [u0, u1] = SKI.CU;
  const F = SKI.CF;
  const D = SKI.CD;
  const w = u1 - u0;
  const m = (u0 + u1) / 2;
  // a stone ground floor, a wooden one above, the gable to you
  P.add(BOX(w, 3.4, D), 0x8e8a82, m, G + 1.7, F + D / 2);
  P.add(BOX(w + 0.2, 3.2, D + 0.2), 0x6e4426, m, G + 5.0, F + D / 2);
  for (let k = 0; k < 4; k++) P.add(BOX(w + 0.24, 0.06, 0.04), 0x4a2a16, m, G + 3.7 + k * 0.75, F - 0.12);
  gable(P, 0x6a3e22, m, G + 6.6, F - 0.1, w + 0.2, 4.2, 0.3);
  roof(P, 0x3a2418, m, G + 6.6, F, w, D, 4.2, 0xf4f8fc);
  P.add(BOX(1.1, 3.4, 1.1), 0x8e8a82, m + 4.5, G + 9.6, F + 5);
  P.add(BOX(1.3, 0.3, 1.3), 0xf4f8fc, m + 4.5, G + 11.4, F + 5);
  // windows with red shutters, the door, the gable window
  for (const u of CHALET_DOWN) window_(P, u, 1.0, F, 1.4, 1.5, 0xf0ece0, 0x24303a, 0xb02a22);
  for (const u of CHALET_UP) {
    window_(P, u, 4.0, F - 0.1, 1.4, 1.6, 0xf0ece0, 0x24303a, 0xb02a22);
    P.add(BOX(1.6, 0.25, 0.35), 0x5a3a20, u, G + 3.95, F - 0.35);
    for (let k = 0; k < 4; k++) P.add(BALL(0.15, 5), k % 2 ? 0xe8344a : 0xf28ab0, u - 0.6 + k * 0.4, G + 4.15, F - 0.4);
  }
  window_(P, m, 7.9, F - 0.25, 1.0, 1.2, 0xf0ece0, 0x24303a, 0xb02a22);
  P.add(BOX(1.5, 2.4, 0.1), 0x3a2414, -17.5, G + 1.2, F - 0.03);
  P.add(BOX(1.8, 0.15, 0.2), 0x4a2a16, -17.5, G + 2.5, F - 0.08);
  // the balcony right across, icicles under it
  P.add(BOX(w + 0.8, 0.22, 1.7), 0x7a4a26, m, G + 3.5, F - 0.85);
  P.add(BOX(w + 0.8, 0.12, 0.12), 0x9a6a3a, m, G + 4.55, F - 1.65);
  P.add(BOX(w + 0.8, 0.1, 0.1), 0x9a6a3a, m, G + 3.75, F - 1.65);
  for (let u = u0 - 0.3; u <= u1 + 0.31; u += 0.5) P.add(BOX(0.24, 0.8, 0.05), 0x9a6a3a, u, G + 4.15, F - 1.65);
  for (let u = u0; u <= u1 + 0.01; u += w / 3) beam(P, 0x5a3a20, [u, G + 2.4, F], [u, G + 3.4, F - 1.5], 0.16);
  for (let u = u0 + 0.2; u < u1; u += 0.95) P.add(CONE(0.07, 0.45, 4), 0xdff0ff, u, G + 3.17, F - 1.65, Math.PI, 0, 0);
  // the terrace: a deck, tables under parasols, benches
  P.add(BOX(w, 0.2, 4.4), 0x8a6a46, m, G + 0.1, F - 2.2);
  for (const u of TERRACE) {
    P.add(CYL(0.65, 0.65, 0.06, 12), 0xf0ece0, u, G + 0.86, F - 2.4);
    P.add(CYL(0.05, 0.05, 0.7, 5), 0x3a3a3a, u, G + 0.5, F - 2.4);
    P.add(CYL(0.04, 0.04, 2.6, 5), 0xd8d8d8, u, G + 1.5, F - 2.2);
    P.add(CONE(1.6, 0.6, 8), u < -18 ? 0xc0282a : 0x2a5ab8, u, G + 2.95, F - 2.2);
    for (const s of [-1, 1]) P.add(BOX(1.6, 0.08, 0.4), 0x7a5232, u, G + 0.55, F - 2.4 + s * 0.95);
  }
}

// A parked snowmobile, facing left.
function sled3d(P, u, f, c) {
  P.add(BOX(2.2, 0.55, 0.9), c, u, G + 0.6, f);
  P.add(BOX(0.7, 0.45, 0.85), c, u - 0.95, G + 0.75, f, 0, 0, -0.5);
  P.add(BOX(0.05, 0.45, 0.8), 0x2a3e58, u - 0.7, G + 1.15, f, 0, 0, 0.4);
  P.add(BOX(1.1, 0.2, 0.6), 0x1a1a1a, u + 0.4, G + 0.95, f);
  P.add(BOX(1.6, 0.35, 0.5), 0x2a2a2a, u + 0.3, G + 0.2, f);
  for (const s of [-0.35, 0.35]) P.add(BOX(1.2, 0.05, 0.12), 0x3a3a3a, u - 1.0, G + 0.05, f + s);
}

function station(P) {
  const [u0, u1] = SKI.SU;
  const F = SKI.SF;
  const w = u1 - u0;
  const m = (u0 + u1) / 2;
  P.add(BOX(w, 7, 10), 0xb4b8bc, m, G + 3.5, F + 5);
  P.add(BOX(w + 0.6, 0.4, 10.6), 0x7a7e84, m, G + 7.2, F + 5);
  P.add(BOX(w - 1.6, 2.6, 0.1), 0x2a3e58, m, G + 1.6, F - 0.03);
  for (let u = u0 + 0.8; u <= u1 - 0.79; u += 1.75) P.add(BOX(0.12, 2.6, 0.14), 0x5a5e64, u, G + 1.6, F - 0.06);
  P.add(BOX(w - 1.6, 0.14, 0.16), 0x5a5e64, m, G + 2.95, F - 0.07);
  for (let k = 0; k < 6; k++) P.add(BOX(w, 0.08, 0.06), 0x9a9ea4, m, G + 3.6 + k * 0.55, F - 0.04);
  // the machine house with the big wheel the cable goes round
  P.add(BOX(7, 2.4, 7), 0x8a8e94, 20, G + 8.6, F + 4);
  P.add(BOX(7.4, 0.3, 7.4), 0xc0282a, 20, G + 9.95, F + 4);
  P.add(CYL(1.6, 1.6, 0.3, 14), 0x3a3a3a, 20, G + 10.25, F + 6, 0, 0, 0);
  // the snowmobile park in front
  for (const [u, f] of [
    [15.5, 12.5],
    [18.2, 13],
    [24, 12.4]
  ])
    sled3d(P, u, f, u > 20 ? 0x2a5ab8 : 0xc0282a);
}

function cableCar(P) {
  // two cables from the station to the top
  for (const d of [-0.45, 0.45]) {
    const [a, b] = CABLE;
    beam(P, 0x1a1a1a, [a[0] + d, a[1], a[2]], [b[0] + d, b[1], b[2]], 0.06);
  }
  // the pylons on the slope, a cross arm under the cables
  for (const t of PYLONS) {
    const [u, h, f] = cableAt(t);
    lattice(P, 0x6a7078, u, f, G + sh(f), h - 0.5, 2.4, 0.8, 3, 0.16);
    P.add(BOX(3.2, 0.3, 0.4), 0x6a7078, u, h - 0.4, f);
    for (const s of [-0.45, 0.45]) P.add(CYL(0.22, 0.22, 0.1, 8), 0x2a2a2a, u + s, h - 0.15, f, 0, 0, Math.PI / 2);
  }
  // the gondolas, hanging, a sniper in each
  for (const t of GONDOLAS) {
    const [u, h, f] = cableAt(t);
    P.add(BOX(0.12, 1.4, 0.12), 0x3a3a3a, u, h - 0.7, f);
    P.add(BOX(0.6, 0.3, 0.4), 0x3a3a3a, u, h - 0.05, f);
    P.add(BOX(2.4, 2.2, 2.0), 0xc0282a, u, h - 2.6, f);
    P.add(BOX(2.6, 0.2, 2.2), 0xd8dce0, u, h - 1.42, f);
    P.add(BOX(2.2, 0.85, 2.04), 0x1a2a3a, u, h - 2.3, f);
    P.add(BOX(2.44, 0.12, 2.04), 0xf4f4f0, u, h - 3.3, f);
  }
}

function summit(P) {
  // the slope itself, the plateau on top, snowy shoulders either side
  const a = Math.atan(SKI.TOP / (SKI.S1 - SKI.S0));
  const len = (SKI.S1 - SKI.S0) / Math.cos(a) + 1;
  const fm = (SKI.S0 + SKI.S1) / 2;
  P.add(new THREE.BoxGeometry(112, 0.6, len, 8, 1, 24), SNOW, 0, G + SKI.TOP / 2 - 0.27, fm + 0.13, a);
  P.add(new THREE.BoxGeometry(26, 0.05, len, 2, 1, 24), 0xf6f9fc, 2, G + SKI.TOP / 2 + 0.06, fm - 0.03, a);
  P.add(SLAB(112, 2, 22), SNOW, 0, G + SKI.TOP - 1, SKI.S1 + 11);
  for (const s of [-1, 1]) {
    P.add(BALL(16, 8), 0xd4dee8, s * 62, G + 4, 44, 0, 0, 0, 1, 1.1, 2.2);
    P.add(BALL(12, 7), 0xccd6e2, s * 50, G + 18, 74, 0, 0, 0, 1.4, 1.0, 1.0);
  }
  // peaks behind, rock showing through
  for (const [u, f, r, h] of [
    [-40, 82, 16, 24],
    [34, 84, 18, 20],
    [-6, 90, 13, 16]
  ]) {
    P.add(CONE(r, h, 8), 0xe8eef4, u, G + SKI.TOP + h / 2, f);
    P.add(CONE(r * 0.55, h * 0.4, 8), 0x6a7480, u + r * 0.25, G + SKI.TOP + h * 0.25, f - r * 0.55);
  }
  // ski tracks and slalom gates down the piste
  for (const [u0, du] of [
    [-6, 3],
    [8, -2.5],
    [0, 2]
  ]) {
    let p = [u0, G + sh(62) + 0.1, 62];
    for (let k = 1; k <= 6; k++) {
      const f = 62 - k * 6;
      const q = [u0 + (k % 2 ? du : -du), G + sh(f) + 0.1, f];
      beam(P, 0xc8d4e2, p, q, 0.1);
      p = q;
    }
  }
  for (let k = 0; k < 6; k++) {
    const f = 28 + k * 2.6;
    const u = (k % 2 ? 5 : -3) + k * 0.5;
    const c = k % 2 ? 0x2a5ab8 : 0xc0282a;
    for (const d of [0, 1.8]) P.add(CYL(0.03, 0.03, 1.6, 4), c, u + d, G + sh(f) + 0.8, f);
    P.add(BOX(1.8, 0.5, 0.02), c, u + 0.9, G + sh(f) + 1.3, f);
  }
  // the top station and his round restaurant
  P.add(BOX(12, 6, 7), 0x9a9ea4, -16, G + SKI.TOP + 3, SKI.S1 + 4.5);
  P.add(BOX(11, 1.6, 0.1), 0x2a3e58, -16, G + SKI.TOP + 2.2, SKI.S1 + 0.97);
  P.add(BOX(12.6, 0.4, 7.6), 0xc0282a, -16, G + SKI.TOP + 6.2, SKI.S1 + 4.5);
  const [lu, lf] = LAIR;
  P.add(CYL(2.6, 3.2, 2.6, 12), 0x8a8e94, lu, G + SKI.TOP + 1.3, lf);
  P.add(CYL(7, 7, 3.4, 22), 0x2a4058, lu, G + SKI.TOP + 4.3, lf);
  for (const h of [2.6, 6.0]) P.add(CYL(7.15, 7.15, 0.2, 22), 0xf4f4f0, lu, G + SKI.TOP + h, lf);
  for (let k = 0; k < 11; k++) {
    const a = Math.PI + (k / 10) * Math.PI;
    P.add(BOX(0.12, 3.4, 0.12), 0xd8dce0, lu + Math.cos(a) * 7.02, G + SKI.TOP + 4.3, lf + Math.sin(a) * 7.02);
  }
  P.add(CYL(7.6, 7.6, 0.35, 22), 0xf4f4f0, lu, G + SKI.TOP + 6.25, lf);
  P.add(CYL(3.2, 4.2, 1.4, 14), 0xd8dce0, lu, G + SKI.TOP + 7.1, lf);
  P.add(CYL(0.08, 0.08, 4, 5), 0x3a3a3a, lu, G + SKI.TOP + 9.8, lf);
  P.add(BALL(0.25, 6), 0xff3030, lu, G + SKI.TOP + 11.8, lf);
}

WORLDS.bond_ski = {
  sky: {
    top: "#2a64b8",
    mid: "#78b0e8",
    horizon: "#eef4fa",
    ground: "#e4ecf2",
    sun: [-35, 38, "#fffef0", 9],
    clouds: 5,
    cloud: "rgba(255,255,255,0.7)",
    hills: [
      { colour: "#e2eaf4", height: 20, rough: 5, phase: 0.6 },
      { colour: "#aab8ca", height: 10, rough: 4, phase: 2 }
    ],
    seed: 401
  },
  fog: 0xdfe8f2,
  signs: [
    ["CHALET EDELWEISS", (SKI.CU[0] + SKI.CU[1]) / 2, G + 7.0, SKI.CF - 0.3, 6, 0.6, "#3a2414", "#f2e2b8"],
    ["CABLE CAR", (SKI.SU[0] + SKI.SU[1]) / 2, G + 5.4, SKI.SF - 0.1, 5, 0.9, "#c0282a", "#ffffff"],
    ["PIZ NOIR 3200 M", -16, G + SKI.TOP + 4.6, SKI.S1 + 0.9, 6, 0.8, "#1a1a1a", "#f2c230"]
  ],
  build(P) {
    P.ground(SNOW, [
      { u: 0, f: 14, r: 12, c: 0xf2f6fa, sx: 1.4, sz: 1 },
      { u: -19, f: 4, r: 6, c: 0xd8e2ec, sx: 1.4, sz: 0.4 },
      { u: 6, f: 22, r: 4, c: 0xbcd8ec, sx: 1.6, sz: 0.5 }
    ]);
    chalet(P);
    station(P);
    cableCar(P);
    summit(P);
    // under you: a ski rack, snowbanks, the race fence, a snowman
    P.add(BOX(3.2, 0.1, 0.1), 0x5a3a20, -7, G + 1.2, 3);
    for (let k = 0; k < 8; k++)
      P.add(
        BOX(0.08, 1.7, 0.03),
        [0xc0282a, 0x2a5ab8, 0xf2c230, 0x1a1a1a][k % 4],
        -8.4 + k * 0.4,
        G + 0.85,
        3.1,
        0.12,
        0,
        0.05 * (k % 3)
      );
    for (const [u, f] of SNOWBANKS) P.add(BALL(1.4, 12), 0xf0f4f8, u, G + 0.2, f, 0, 0, 0, 1.6, 0.55, 0.9);
    P.add(BOX(12, 1.0, 0.04), 0xff7a1a, 10, G + 0.9, 5);
    for (let u = 4; u <= 16.01; u += 2) P.add(BOX(0.08, 1.5, 0.08), 0x2a2a2a, u, G + 0.75, 5);
    P.add(BALL(0.7, 8), 0xf8fafc, -7, G + 0.6, 14);
    P.add(BALL(0.5, 8), 0xf8fafc, -7, G + 1.55, 14);
    P.add(BALL(0.35, 7), 0xf8fafc, -7, G + 2.2, 14);
    P.add(CONE(0.07, 0.35, 5), 0xff7a1a, -7, G + 2.2, 13.55, -Math.PI / 2, 0, 0);
    P.add(CYL(0.28, 0.28, 0.35, 8), 0x1a1a1a, -7, G + 2.6, 14);
    P.add(CYL(0.4, 0.4, 0.05, 8), 0x1a1a1a, -7, G + 2.43, 14);
    // the markers' poles
    for (const { f, us, base } of MARKERS)
      for (const u of us) P.add(CYL(0.05, 0.06, base - sh(f), 5), 0x2a2a2a, u, G + (base + sh(f)) / 2, f + 0.06);
    // ski tracks across the snowfield to you
    for (const [u0, du] of [
      [-2.5, 2.2],
      [4, -1.8]
    ])
      for (const w of [-0.13, 0.13]) {
        let p = [u0 + w, G + 0.04, SKI.S0];
        for (let k = 1; k <= 5; k++) {
          const q = [u0 + w + (k % 2 ? du : 0), G + 0.04, SKI.S0 - k * 4.2];
          beam(P, 0xc8d4e2, p, q, 0.07);
          p = q;
        }
      }
    // pines: the forest either side of the piste, and down on the flat
    P.scatter(
      70,
      SKI.S0 + 1,
      SKI.S1 - 4,
      (u, f, R) => {
        if (Math.abs(u) < 17 || Math.abs(u) > 54) return;
        pine(P, u, f, G + sh(f) - 0.2, 0.9 + R() * 0.7);
      },
      56
    );
    P.scatter(
      22,
      8,
      SKI.S0,
      (u, f, R) => {
        if (Math.abs(u) < 30) return;
        pine(P, u, f, G, 1 + R() * 0.6);
      },
      70
    );
    for (const [u, f, s] of [
      [-30, 14, 1.4],
      [-31, 19, 1.2],
      [30, 14, 1.3],
      [-9, 21, 1.0],
      [9.5, 23, 0.9]
    ])
      pine(P, u, f, G, s);
    P.scatter(
      10,
      SKI.S0 + 2,
      SKI.S1 - 6,
      (u, f, R) => {
        if (Math.abs(u) < 16) return;
        const s = 1 + R() * 1.4;
        P.add(BALL(0.8 * s, 5), 0x6a7480, u, G + sh(f) + 0.15 * s, f, R(), R(), 0, 1.2, 0.7, 1);
      },
      50
    );
  },
  slots: [],
  cover: null
};

LAYOUTS.bond_ski = L => {
  const fixed = { fixed: true, rail: false };
  // champagne on the terrace tables
  for (const u of TERRACE)
    L.row({
      ...fixed,
      kind: ["bottle", "glass", "bottle"],
      n: 3,
      f: SKI.CF - 2.45,
      u0: u - 0.32,
      u1: u + 0.32,
      base: 0.89,
      size: 0.3,
      tint: ["green", "white", "green"],
      bank: 3
    });
  // cameras on the chalet's and the station's corners
  for (const [u, f, base] of [
    [SKI.CU[0] + 0.4, SKI.CF - 0.15, 6.0],
    [SKI.CU[1] - 0.4, SKI.CF - 0.15, 6.0],
    [SKI.SU[0] + 0.4, SKI.SF - 0.15, 6.3],
    [SKI.SU[1] - 0.4, SKI.SF - 0.15, 6.3]
  ])
    L.row({ ...fixed, kind: "bond_cam", n: 1, f, u0: u, u1: u, base, size: 0.42, tint: "steel" });
  // the piste's markers on their poles, across the snowfield and up the slope
  MARKERS.forEach(({ f, us, base, size }, k) =>
    L.row({
      ...fixed,
      kind: k === 2 ? "diamond" : ["disc", "diamond", "disc"],
      n: us.length,
      f,
      u0: us[0],
      u1: us[us.length - 1],
      base,
      size,
      tint: [["green", "blue", "red"], ["red", "blue"], "orange"][k],
      bank: k < 2 ? us.length / 2 : 0
    })
  );
  // his men (and the tourists: don't) in the windows, behind the snowbanks
  const men = (a, b, c) => [
    ["henchman", a],
    ["bond_skier", b],
    ["bond_tourist", c, { dont: true }]
  ];
  L.pops({ fixed: true, f: SKI.CF - 0.35, at: CHALET_DOWN.map(u => [u, 1.0]), size: 1.6, kinds: men(40, 40, 20) });
  L.pops({ fixed: true, f: SKI.CF - 0.45, at: CHALET_UP.map(u => [u, 4.05]), size: 1.5, kinds: men(35, 45, 20) });
  L.pops({
    fixed: true,
    f: SKI.CF - 0.6,
    at: [[(SKI.CU[0] + SKI.CU[1]) / 2, 7.9]],
    size: 1.05,
    period: [5, 8],
    busy: 0.7,
    kinds: [["bond_skier", 100, { pts: 25 }]]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 9.0,
    at: SNOWBANKS.map(([u]) => [u, 0]),
    size: 1.7,
    slide: 2.4,
    kinds: [
      ["bond_skier", 60],
      ["henchman", 25],
      ["bond_tourist", 15, { dont: true }]
    ]
  });
  L.pops({ fixed: true, f: SKI.SF - 0.35, at: STATION_WIN.map(u => [u, 0.4]), size: 1.75, kinds: men(45, 35, 20) });
  // snipers in the gondolas, at the top station and in his restaurant
  for (const t of GONDOLAS) {
    const [u, h, f] = cableAt(t);
    L.pops({
      fixed: true,
      f: f - 1.15,
      at: [[u, h - 3.45 - G]],
      size: 1.2,
      period: [5, 8],
      busy: 0.75,
      kinds: [["bond_skier", 100, { pts: f > 35 ? 50 : 25 }]]
    });
  }
  L.pops({
    fixed: true,
    f: SKI.S1 + 0.6,
    at: [[-16, SKI.TOP + 1.2]],
    size: 1.6,
    period: [6, 9],
    busy: 0.6,
    kinds: [["bond_skier", 100, { pts: 50 }]]
  });
  const [lu, lf] = LAIR;
  for (const du of [-4, 0, 4])
    L.pops({
      fixed: true,
      f: lf - Math.sqrt(49 - du * du) - 0.3,
      at: [[lu + du, SKI.TOP + 2.75]],
      size: 1.5,
      period: [6, 9],
      busy: 0.6,
      kinds: [
        ["henchman", 70, { pts: 50 }],
        ["bond_skier", 30, { pts: 50 }]
      ]
    });
};

// Across the slope, carving turns (on the snow: its height goes with f).
function carve(R, o) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = R(26, 32);
  const amp = o.amp ?? R(1, 2.5);
  const w = R(0.9, 1.5);
  const ph = R(0, 6);
  return {
    dur: (2 * u0) / o.v,
    pos: (tau, out) => {
      const f = o.f + amp * Math.sin(ph + tau * w);
      return out.set(-dir * u0 + dir * o.v * tau, f, G + sh(f));
    }
  };
}
// Straight down the mountain and out across the snowfield to you; draws.
function schuss(R, add, t, c) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  const at = (u, f) => [u, f, G + sh(f)];
  add(
    t,
    "bond_skierRun",
    rush(
      [
        at(s * R(4, 22), R(54, 62)),
        at(-s * R(2, 12), 44),
        at(s * R(2, 10), 33),
        at(s * R(0, 6), SKI.S0),
        at(R(-6, 6), R(10, 13))
      ],
      R(8, 10) * c.S
    )
  );
}
// Across the foot of the slope on a snowmobile.
function sledRun(R, c) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = R(26, 32);
  const f = R(28, 36);
  const v = R(13, 16) * c.S;
  const ph = R(0, 6);
  return {
    dur: (2 * u0) / v,
    pos: (tau, out) => out.set(-dir * u0 + dir * v * tau, f, G + sh(f) + 0.06 * Math.abs(Math.sin(ph + tau * 9)))
  };
}
// A grenade off the chalet's balcony or the station's roof.
function skiGrenade(R, add, t) {
  add(
    t,
    "bond_grenade",
    lobbed(
      R,
      R(0, 1) < 0.5
        ? { u: R(-25, -13), f: SKI.CF - 1.5, h: G + 4.8, vh: R(3, 5), vu: R(1.5, 3.5), vf: -R(1.2, 2) }
        : { u: R(15, 25), f: SKI.SF - 0.3, h: G + 7.6, vh: R(2, 4), vu: -R(1.5, 3.5), vf: -R(1.8, 2.8) }
    )
  );
}

const skiWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the whole gang comes down the mountain at once
    for (let k = 0; k < 7; k++) schuss(R, add, 1 + k * 3.3, c);
    for (let k = 0; k < 6; k++) add(2 + k * 4, k % 2 ? "bond_sled" : "bond_sledB", sledRun(R, c));
    for (let k = 0; k < 4; k++) add(3 + k * 6, "bond_skierRun", carve(R, { v: R(9, 12) * c.S, f: R(30, 42) }));
    add(8, "heli", hover(R, { S: c.S }));
    return;
  }
  const k = c.w % 6;
  for (let j = 0; j < 1 + n(1); j++) add(R(1, 22), "bond_skierRun", carve(R, { v: R(9, 12) * c.S, f: R(30, 44) }));
  if (k === 0 || k === 3)
    for (let j = 0; j < 1 + n(1.3); j++) add(R(1, 22), R(0, 1) < 0.5 ? "bond_sled" : "bond_sledB", sledRun(R, c));
  if (k === 1 || k === 4) for (let j = 0; j < 1 + n(1.1); j++) schuss(R, add, R(1, 18), c);
  if (k === 2 || k === 5) for (let j = 0; j < 2 + n(1.5); j++) skiGrenade(R, add, R(1, 24));
  if (k === 2) for (let j = 0; j < n(1); j++) schuss(R, add, R(4, 16), c);
  if (k === 5) add(R(3, 12), "heli", hover(R, { S: c.S }));
  if (R(0, 1) < 0.35) add(R(2, 18), "bond_touristRun", carve(R, { v: R(4.5, 6), f: R(28, 40), amp: 1 }));
};

// ---- Level 3: the harbour ----------------------------------------------------------

// The harbour at night, from the warehouse roof on the quay (Q its edge).
// His yacht is moored across the water (YF its near side, YU its ends, DECK
// its main deck); the boathouse on the left (BH) and the container pier on
// the right (PIER, PF) stand on piles over the water, PH up, so the boats run
// under them. The breakwater and the lighthouse are out at BW.
const HAR = {
  Q: 6,
  YF: 24,
  YU: [-15, 13],
  DECK: 2.8,
  BH: [-34, -18, 10],
  PIER: [18, 38],
  PF: [6, 44],
  PH: 2.6,
  BW: 54
};
const BOLLARDS = [-14, -8, -2, 4, 10];
const LAMPS = [-17, -5, 7];
const CRATES = [-11, 1];
const DIVERS = [-10, -3, 4];
const BUOYS = [
  [-9, 17, "red"],
  [9, 17, "green"],
  [-24, 36, "red"],
  [14, 40, "green"]
];
const DECK1 = [-9, -5.5, -2, 1.5, 5];
const DECK2 = [-7.5, -3, 1.5];
const BRIDGE = [-6.5, -3.5];
const COLS = [19.4, 21.9, 24.4, 29.6, 32.1, 34.6, 37.1]; // (the aisle down the pier between 25.6 and 28.4)
const ROW_A = [2, 1, 3, 1, 2, 3, 1];
const ROW_B = [1, 2, 1, 3, 1, 2, 2];
const BOX_COLOURS = [0xb83a2a, 0x2a5a9a, 0x3a7a4a, 0xd88a2a, 0x7a7e84, 0xe0d8c8, 0x5a3a7a];
const TOPS = [
  [21.9, 1],
  [29.6, 1],
  [34.6, 3]
];

function container(P, u, f, h0, c) {
  P.add(BOX(2.44, 2.6, 6.1), c, u, h0 + 1.3, f + 3.05);
  for (const s of [-0.45, 0.45]) P.add(BOX(0.07, 2.4, 0.06), 0x2a2a2a, u + s, h0 + 1.3, f - 0.02);
  P.add(BOX(2.46, 0.12, 0.1), 0xd8d8d8, u, h0 + 2.55, f - 0.03);
}

function quay(P) {
  P.add(SLAB(150, 1.0, 17), 0x4a4e54, 0, G, -2.5);
  P.add(BOX(150, 0.16, 0.35), 0xd8b020, 0, G + 0.58, HAR.Q - 0.25);
  for (const f of [0.4, 2.2]) P.add(BOX(150, 0.05, 0.12), 0x2a2a2a, 0, G + 0.52, f);
  for (let u = -28; u <= 16; u += 5) P.add(TORUS(0.36, 0.13, 8), 0x151515, u, G + 0.05, HAR.Q + 0.1);
  for (const u of BOLLARDS) {
    P.add(CYL(0.22, 0.28, 0.7, 8), 0x1a1a1e, u, G + 0.85, HAR.Q - 0.8);
    P.add(CYL(0.3, 0.3, 0.1, 8), 0x1a1a1e, u, G + 1.22, HAR.Q - 0.8);
  }
  for (const u of LAMPS) {
    P.add(CYL(0.08, 0.11, 5.6, 6), 0x2a2e34, u, G + 3.3, HAR.Q - 0.15);
    P.add(BOX(0.6, 0.2, 0.45), 0x2a2e34, u, G + 6.05, HAR.Q - 0.15);
    P.add(BALL(0.18, 6), 0xffe8a0, u, G + 5.85, HAR.Q - 0.15);
  }
  // crates, drums and a forklift on the quay under you
  for (const u of CRATES) {
    P.add(BOX(1.8, 1.3, 1.4), 0x8a6a42, u, G + 1.15, 3.4);
    P.add(BOX(1.84, 0.1, 1.44), 0x5a4228, u, G + 1.15, 3.4);
    P.add(BOX(1.2, 0.9, 1.1), 0x7a5a3a, u + 0.2, G + 2.25, 3.4, 0, 0.3, 0);
  }
  for (let k = 0; k < 5; k++)
    P.add(
      CYL(0.3, 0.3, 0.9, 10),
      [0x2a5a9a, 0xb83a2a][k % 2],
      12 + (k % 3) * 0.7,
      G + 0.95,
      2.6 + Math.floor(k / 3) * 0.7
    );
  P.add(BOX(2, 1.0, 1.2), 0xe8b020, -6.5, G + 1.0, 1.6);
  P.add(BOX(1.3, 0.08, 1.3), 0x2a2a2a, -6.2, G + 2.6, 1.6);
  for (const [du, df] of [
    [-0.5, -0.55],
    [-0.5, 0.55],
    [0.6, -0.55],
    [0.6, 0.55]
  ])
    P.add(BOX(0.06, 1.1, 0.06), 0x2a2a2a, -6.2 + du, G + 2.05, 1.6 + df);
  for (const s of [-0.35, 0.35]) {
    P.add(BOX(0.1, 2.6, 0.1), 0x3a3a3a, -7.6, G + 1.8, 1.6 + s);
    P.add(BOX(1.0, 0.06, 0.12), 0x3a3a3a, -8.1, G + 0.65, 1.6 + s);
  }
  for (const du of [-0.7, 0.7])
    for (const s of [-0.62, 0.62]) P.add(CYL(0.3, 0.3, 0.22, 10), 0x151515, -6.5 + du, G + 0.8, 1.6 + s, Math.PI / 2);
}

function boathouse(P) {
  const [u0, u1, F] = HAR.BH;
  const w = u1 - u0;
  const m = (u0 + u1) / 2;
  const D = 9;
  for (let k = 0; k <= 5; k++)
    for (const f of [F + 0.4, F + D - 0.4])
      P.add(CYL(0.2, 0.2, 3.2, 6), 0x3a2e24, u0 + 0.6 + ((w - 1.2) * k) / 5, G + 1.3, f);
  P.add(BOX(w + 0.6, 0.35, D + 0.6), 0x5a4a3a, m, G + 2.75, F + D / 2);
  P.add(BOX(w + 2, 0.2, 1.4), 0x6a5a44, m, G + 2.8, F - 0.7);
  P.add(BOX(w, 4.8, D), 0x3a5048, m, G + 5.3, F + D / 2);
  for (let u = u0 + 0.4; u < u1; u += 0.9) P.add(BOX(0.1, 4.8, 0.06), 0x2e4038, u, G + 5.3, F - 0.03);
  gable(P, 0x3a5048, m, G + 7.7, F - 0.05, w + 0.1, 3.0, 0.2);
  roof(P, 0x2a2a30, m, G + 7.7, F, w, D, 3.0);
  for (const u of [-30, -22]) {
    P.add(BOX(2.0, 2.6, 0.1), 0x14181c, u, G + 4.2, F - 0.06);
    P.add(BOX(2.3, 0.15, 0.15), 0x8a8a7a, u, G + 5.6, F - 0.1);
  }
  window_(P, m, 3.9, F - 0.05, 1.6, 1.2, 0x8a8a7a, 0xf2c878);
  window_(P, m, 8.0, F - 0.1, 1.2, 1.0, 0x8a8a7a, 0xf2c878);
}

function pier(P) {
  const [u0, u1] = HAR.PIER;
  const [f0, f1] = HAR.PF;
  const H = HAR.PH;
  const m = (u0 + u1) / 2;
  P.add(SLAB(u1 - u0, 0.5, f1 - f0), 0x5a5e64, m, G + H - 0.25, (f0 + f1) / 2);
  P.add(BOX(u1 - u0, 0.15, 0.3), 0xd8b020, m, G + H + 0.05, f0 + 0.2);
  P.add(BOX(u1 - u0, H - 0.5, 1), 0x44484e, m, G + 0.5 + (H - 0.5) / 2, f0 + 0.5);
  for (let u = u0 + 0.5; u <= u1; u += 4) P.add(CYL(0.25, 0.25, H, 6), 0x2a2e34, u, G + H / 2, f0 + 4);
  for (let f = f0 + 8; f <= f1; f += 4.5) P.add(CYL(0.25, 0.25, H, 6), 0x2a2e34, u0 + 0.3, G + H / 2, f);
  for (let k = 0; k < 6; k++)
    P.add(BOX(2.4, 0.35 * (k + 1), 0.32), 0x5a5e64, u0 + 1.5, G + 0.5 + 0.175 * (k + 1), f0 - 1.9 + 0.32 * k);
  // the containers, two rows and one under the crane
  COLS.forEach((u, k) => {
    for (let s = 0; s < ROW_A[k]; s++) container(P, u, 8, G + H + s * 2.6, BOX_COLOURS[(k + s * 3) % 7]);
    for (let s = 0; s < ROW_B[k]; s++) container(P, u, 32, G + H + s * 2.6, BOX_COLOURS[(k * 2 + s + 1) % 7]);
  });
  container(P, 21.9, 22.5, G + H, 0x3a7a4a);
  for (let s = 0; s < 2; s++) container(P, 24.4, 22.5, G + H + s * 2.6, BOX_COLOURS[(s + 4) % 7]);
}

// The ship-to-shore crane straddling the pier, its boom out over the yacht,
// lowering a container onto it.
function crane(P) {
  const C = 0xb8302a;
  const W = 0xe0e0e0;
  const H = HAR.PH;
  for (const u of [19.6, 35]) for (const f of [21, 29]) P.add(BOX(0.9, 26, 0.9), C, u, G + H + 13, f);
  for (const f of [21, 29]) {
    P.add(BOX(16.3, 1.2, 1.0), C, 27.3, G + H + 18, f);
    P.add(BOX(16.3, 0.8, 0.8), C, 27.3, G + H + 6, f);
  }
  for (const u of [19.6, 35]) P.add(BOX(0.8, 0.8, 8.9), C, u, G + H + 25.6, 25);
  for (const f of [24, 26]) P.add(BOX(50, 1.0, 0.7), W, 18, G + 28, f);
  for (let u = -5; u <= 41; u += 4.6) P.add(BOX(0.25, 0.25, 2.0), W, u, G + 27.6, 25);
  for (const f of [24, 26]) {
    beam(P, C, [21, G + 28, f], [27, G + 38, f], 0.6);
    beam(P, C, [33, G + 28, f], [27, G + 38, f], 0.6);
    beam(P, W, [27, G + 38, f], [-5, G + 28.5, f], 0.25);
    beam(P, W, [27, G + 38, f], [42, G + 28.5, f], 0.25);
  }
  P.add(BOX(7, 3.4, 5), 0xd8d8d8, 33, G + 30.2, 25);
  P.add(BOX(2.6, 1.2, 3), 0x3a3a3a, 2, G + 27, 25);
  for (const s of [-0.6, 0.6]) P.add(BOX(0.05, 12.2, 0.05), 0x1a1a1a, 2 + s, G + 20.5, 25);
  P.add(BOX(2.6, 0.3, 6.3), 0xf2c230, 2, G + 14.4, 25);
  container(P, 2, 21.95, G + 11.6, 0x2a5a9a);
  P.add(BOX(0.3, 1.2, 0.3), 0x3a3a3a, 14, G + 27.8, 25);
  P.add(BOX(2.2, 1.8, 2.2), W, 14, G + 26.4, 23.6);
  P.add(BOX(2.0, 0.8, 0.05), 0x1a2a3a, 14, G + 26.6, 22.48);
  for (const [u, h] of [
    [-5, 29],
    [27, 38.5],
    [42, 29]
  ])
    P.add(BALL(0.3, 6), 0xff3030, u, G + h, 25);
}

function yacht(P) {
  const [u0, u1] = HAR.YU;
  const F = HAR.YF;
  const m = (u0 + u1) / 2;
  const L = u1 - u0;
  const WH = 0xdde2e8;
  const LIT = 0xf0c070;
  // the hull: navy under white, a gold line, the bow
  P.add(BOX(L, 1.6, 6), 0x1a2a4a, m, G + 0.4, F + 3);
  P.add(BOX(L + 0.2, 1.6, 6.1), WH, m, G + 2.0, F + 3);
  P.add(BOX(L + 0.3, 0.08, 6.16), 0xd8b040, m, G + 1.22, F + 3);
  // (the bow: raked forward from the waterline, seen side on)
  for (const [c, pts] of [
    [0x1a2a4a, [0.1, -0.4, 0.1, 1.2, -4.4, 1.2, -2.6, -0.4]],
    [WH, [0.1, 1.2, 0.1, 2.8, -6.2, 3.1, -4.4, 1.2]]
  ]) {
    P.add(slab4(pts, 4.4), c, u0, G, F + 5.2);
  }
  P.add(BOX(1.4, 0.18, 5.6), 0xa07a4a, u1 + 0.7, G + 0.95, F + 3);
  for (let u = u0 + 1.5; u < u1 - 1; u += 2.2) P.add(BALL(0.16, 5), LIT, u, G + 2.0, F - 0.04);
  // the deck rail
  P.add(BOX(L + 5, 0.06, 0.06), 0xf0f0f0, m - 2.5, G + 3.8, F + 0.12);
  for (let u = u0 - 4.5; u <= u1; u += 1.4) P.add(BOX(0.05, 1.0, 0.05), 0xf0f0f0, u, G + 3.3, F + 0.12);
  // the saloon, lit
  P.add(BOX(18, 2.3, 4.8), 0xe8ecf0, -2, G + 3.95, F + 3.2);
  P.add(BOX(16.4, 1.0, 0.06), LIT, -2, G + 4.0, F + 0.77);
  for (let u = -10.2; u <= 6.21; u += 1.64) P.add(BOX(0.1, 1.0, 0.08), 0x8a8a8a, u, G + 4.0, F + 0.75);
  P.add(BOX(20, 0.18, 5.6), 0xf4f6f8, -2, G + 5.2, F + 3);
  // the upper deck and its rail, the bridge, the radar arch, the mast
  P.add(BOX(12.5, 2.0, 4.4), 0xe8ecf0, -3, G + 6.3, F + 3.4);
  P.add(BOX(11, 0.8, 0.06), LIT, -3, G + 6.35, F + 1.17);
  for (let u = -8.5; u <= 2.51; u += 1.57) P.add(BOX(0.1, 0.8, 0.08), 0x8a8a8a, u, G + 6.35, F + 1.15);
  P.add(BOX(14, 0.16, 5), 0xf4f6f8, -3, G + 7.4, F + 3.3);
  P.add(BOX(14, 0.05, 0.05), 0xf0f0f0, -3, G + 6.1, F + 0.3);
  for (let u = -10; u <= 4.01; u += 1.4) P.add(BOX(0.05, 0.85, 0.05), 0xf0f0f0, u, G + 5.7, F + 0.3);
  P.add(BOX(6.5, 1.7, 3.6), 0xe8ecf0, -5, G + 8.25, F + 3.6);
  P.add(BOX(6, 0.8, 0.06), 0x14202c, -5, G + 8.45, F + 1.77);
  P.add(BOX(7.6, 0.15, 4.4), 0xf4f6f8, -5, G + 9.15, F + 3.6);
  for (const f of [F + 2.2, F + 4.8]) P.add(BOX(0.3, 2.2, 0.3), 0xe8ecf0, -1.5, G + 10.3, f);
  P.add(BOX(0.3, 0.3, 2.9), 0xe8ecf0, -1.5, G + 11.4, F + 3.5);
  P.add(BOX(1.8, 0.12, 0.3), 0x3a3a3a, -1.5, G + 11.7, F + 3.5, 0, 0.4, 0);
  P.add(CYL(0.06, 0.08, 3, 5), 0xd8d8d8, -1.5, G + 12.9, F + 3.5);
  P.add(BALL(0.14, 5), 0xffffff, -1.5, G + 14.45, F + 3.5);
  // the tender, the bar on the after deck, a sofa
  P.add(CAP(0.6, 2.2, 8), 0xf4f4f0, 6, G + 5.85, F + 3.5, 0, 0, Math.PI / 2);
  P.add(BOX(3, 1.05, 0.7), 0x3a2a24, 10, G + 3.35, F + 2.2);
  P.add(BOX(3.2, 0.06, 0.85), 0xd8c070, 10, G + 3.9, F + 2.2);
  P.add(BOX(4, 0.5, 1), 0xf4f4f0, 10, G + 3.05, F + 4.5);
  P.add(BOX(4, 0.6, 0.25), 0xf4f4f0, 10, G + 3.6, F + 5.0);
  // its dressing lights on their lines, bow to masthead to stern
  const top = [-1.5, G + 14.4, F + 3.5];
  for (const end of [
    [u0 - 6.1, G + 3.1, F + 3],
    [u1 + 1.2, G + 3.8, F + 3]
  ]) {
    beam(P, 0x6a6e74, end, top, 0.03);
    for (let k = 1; k < 12; k++) {
      const t = k / 12;
      P.add(BALL(0.13, 4), k % 2 ? 0xffe08a : 0xff8a6a, ...end.map((a, j) => a + (top[j] - a) * t));
    }
  }
}

function breakwater(P) {
  const F = HAR.BW;
  P.add(SLAB(140, 2.6, 5), 0x30343a, 0, G + 0.3, F + 2);
  for (let k = 0; k < 16; k++)
    P.add(BALL(1.2, 5), 0x3a3e44, -44 + k * 6 + (k % 3), G + 0.2, F - 0.4, k, k * 2, 0, 1.3, 0.6, 1);
  // the lighthouse, red and white, its lamp lit
  const [lu, lf] = [-14, F + 1];
  for (let k = 0; k < 4; k++)
    P.add(
      CYL(1.45 - 0.1 * (k + 1), 1.45 - 0.1 * k, 2.75, 10),
      k % 2 ? 0xf0f0ec : 0xb82a22,
      lu,
      G + 1.6 + 2.75 * k + 1.375,
      lf
    );
  P.add(CYL(1.7, 1.7, 0.2, 12), 0x2a2a2a, lu, G + 12.7, lf);
  P.add(TORUS(1.65, 0.05, 14), 0x2a2a2a, lu, G + 13.4, lf, Math.PI / 2);
  P.add(CYL(0.9, 0.9, 1.4, 10), 0xffe8a0, lu, G + 13.5, lf);
  P.add(CONE(1.2, 1.2, 10), 0xb82a22, lu, G + 14.8, lf);
  P.add(BALL(0.2, 5), 0x2a2a2a, lu, G + 15.5, lf);
  for (const u of [6, 24]) {
    P.add(CYL(0.15, 0.2, 2.2, 6), 0xd8d8d8, u, G + 2.7, F + 0.4);
    P.add(BOX(0.4, 0.4, 0.4), 0x2a2a2a, u, G + 3.9, F + 0.4);
  }
  // a cargo ship lying off beyond it
  P.add(BOX(36, 5, 7), 0x1a2028, 26, G + 2, F + 14);
  P.add(BOX(6, 7, 6), 0xd8d8d0, 40, G + 8, F + 14);
  for (let k = 0; k < 5; k++) P.add(BOX(4.8, 2.4, 6), BOX_COLOURS[k], 12 + k * 5, G + 5.7, F + 14);
  for (let k = 0; k < 6; k++)
    P.add(BALL(0.2, 4), 0xf2c878, 38 + (k % 3) * 1.6, G + 7 + Math.floor(k / 3) * 2, F + 10.9);
}

WORLDS.bond_harbour = {
  sky: {
    top: "#040816",
    mid: "#0e1c3e",
    horizon: "#2a3e66",
    ground: "#0a1828",
    sun: [-28, 24, "#f2f0dc", 6],
    stars: true,
    clouds: 4,
    cloud: "rgba(140,160,200,0.25)",
    hills: [{ colour: "#0a1222", height: 6, rough: 3, phase: 1 }],
    skyline: "#0a1020",
    windows: "#f2d27a",
    seed: 402
  },
  fog: 0x0e1a30,
  signs: [
    ["MANTA", HAR.YU[0] + 7, G + 2.0, HAR.YF - 0.22, 3.0, 0.65, "#dde2e8", "#1a2a4a"],
    ["BOATHOUSE", (HAR.BH[0] + HAR.BH[1]) / 2, G + 6.6, HAR.BH[2] - 0.12, 4.4, 0.7, "#1a2a24", "#e8e0c8"],
    ["PIER 9", 28, G + 1.5, HAR.PF[0] - 0.05, 2.6, 0.7, "#d8b020", "#151515"]
  ],
  build(P) {
    const glints = [
      [-10, 24, 0.25, 2],
      [-18, 40, 0.3, 2.4],
      [-26, 58, 0.4, 2.6]
    ].map(([u, f, sx, sz]) => ({ u, f, r: 3, c: 0x2e5078, sx, sz }));
    // (and the lit windows' and the lamps' long reflections)
    const lights = [...[-8, -3, 2].map(u => [u, 21]), ...LAMPS.map(u => [u, 8.6])].map(([u, f]) => ({
      u,
      f,
      r: 1.5,
      c: 0x9a7e44,
      sx: 0.14,
      sz: 1.8
    }));
    P.ground(0x0d2a44, [...glints, ...lights]);
    quay(P);
    // its mooring lines out to the yacht
    for (const [u, du] of [
      [BOLLARDS[1], -2],
      [BOLLARDS[3], 3]
    ])
      beam(P, 0xc8b89a, [u, G + 1.2, HAR.Q - 0.8], [u + du, G + 2.6, HAR.YF - 0.05], 0.05);
    boathouse(P);
    pier(P);
    crane(P);
    yacht(P);
    breakwater(P);
    // the buoys out in the water
    for (const [u, f, c] of BUOYS) {
      P.add(CYL(0.45, 0.65, 1.2, 10), c === "red" ? 0xb82a22 : 0x2a8a4a, u, G + 0.4, f);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2;
        P.add(BOX(0.05, 0.6, 0.05), 0x2a2a2a, u + Math.cos(a) * 0.25, G + 1.3, f + Math.sin(a) * 0.25);
      }
      P.add(CYL(0.1, 0.1, 0.2, 6), c === "red" ? 0xff6a5a : 0x7aff8a, u, G + 1.65, f);
    }
  },
  slots: [],
  cover: null
};

LAYOUTS.bond_harbour = L => {
  const fixed = { fixed: true, rail: false };
  // gulls on the bollards, the quay's lamps, the buoys' lights
  L.row({
    ...fixed,
    kind: "crow",
    n: BOLLARDS.length,
    f: HAR.Q - 0.85,
    u0: BOLLARDS[0],
    u1: BOLLARDS[BOLLARDS.length - 1],
    base: 1.27,
    size: 0.42,
    tint: "white",
    bank: BOLLARDS.length
  });
  for (const u of LAMPS)
    L.row({ ...fixed, kind: "disc", n: 1, f: HAR.Q - 0.45, u0: u, u1: u, base: 5.45, size: 0.42, tint: "yellow" });
  for (const [u, f, c] of BUOYS)
    L.row({ ...fixed, kind: "disc", n: 1, f: f - 0.5, u0: u, u1: u, base: 1.5, size: 0.36, tint: c });
  // champagne on the yacht's bar
  L.row({
    ...fixed,
    kind: ["bottle", "glass", "glass", "bottle"],
    n: 4,
    f: HAR.YF + 1.75,
    u0: 9,
    u1: 11,
    base: 3.93,
    size: 0.3,
    tint: ["green", "white", "white", "green"],
    bank: 4
  });
  // cameras: on the boathouse, the crane's leg, the yacht's bridge
  for (const [u, f, base] of [
    [HAR.BH[1] - 0.4, HAR.BH[2] - 0.15, 6.8],
    [19.6, 20.4, 4.5 + HAR.PH],
    [-2.0, HAR.YF + 1.7, 8.8]
  ])
    L.row({ ...fixed, kind: "bond_cam", n: 1, f, u0: u, u1: u, base, size: 0.42, tint: "steel" });
  // out on the breakwater: its lights, and the lighthouse's lamp
  L.row({
    ...fixed,
    kind: "disc",
    n: 2,
    f: HAR.BW - 0.2,
    u0: 6,
    u1: 24,
    base: 3.65,
    size: 0.5,
    tint: ["red", "green"]
  });
  L.row({
    ...fixed,
    kind: "disc",
    n: 1,
    f: HAR.BW - 0.1,
    u0: -14,
    u1: -14,
    base: 13.05,
    size: 0.9,
    tint: "gold",
    pts: 50
  });
  const crew = (a, b) => [
    ["henchman", a],
    ["bond_contact", b, { dont: true }]
  ];
  // behind the crates, up out of the water, in the boathouse doors
  L.pops({ fixed: true, f: 4.45, at: CRATES.map(u => [u, 0.5]), size: 1.7, kinds: crew(70, 30) });
  L.pops({
    fixed: true,
    f: HAR.Q + 1.4,
    at: DIVERS.map(u => [u, -0.65]),
    size: 1.75,
    period: [4, 7],
    busy: 0.7,
    kinds: [["bond_diver", 100]]
  });
  L.pops({ fixed: true, f: HAR.BH[2] - 0.35, at: [-30, -22].map(u => [u, 2.95]), size: 1.7, kinds: crew(75, 25) });
  // on the yacht: the saloon's windows, the upper deck, the bridge
  L.pops({
    fixed: true,
    f: HAR.YF + 0.45,
    at: DECK1.map(u => [u, HAR.DECK + 0.15]),
    size: 1.65,
    kinds: [...crew(70, 18), ["bond_diver", 12]]
  });
  L.pops({ fixed: true, f: HAR.YF + 0.95, at: DECK2.map(u => [u, 5.3]), size: 1.5, kinds: crew(80, 20) });
  L.pops({
    fixed: true,
    f: HAR.YF + 1.5,
    at: BRIDGE.map(u => [u, 7.4]),
    size: 1.3,
    period: [5, 8],
    kinds: [["henchman", 100, { pts: 25 }]]
  });
  // on top of the containers, and in the crane's cab
  L.pops({
    fixed: true,
    f: 8.35,
    at: TOPS.map(([u, s]) => [u, HAR.PH + 2.6 * s]),
    size: 1.6,
    period: [5, 8],
    kinds: [["henchman", 100, { pts: 25 }]]
  });
  L.pops({
    fixed: true,
    f: 22.3,
    at: [[14, 25.65]],
    size: 1.2,
    period: [6, 9],
    busy: 0.6,
    kinds: [["henchman", 100, { pts: 50 }]]
  });
};

// A speedboat across the harbour (under the boathouse and the pier).
function boatRun(R, c) {
  const v = R(12, 17) * c.S;
  const f = R(0, 1) < 0.8 ? R(9, 21) : R(36, 46);
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = R(28, 34);
  const ph = R(0, 6);
  return {
    dur: (2 * u0) / v,
    pos: (tau, out) => out.set(-dir * u0 + dir * v * tau, f, G + 0.1 * Math.abs(Math.sin(ph + tau * 5)))
  };
}
// A diver up out of the water; he aims, and if he's still there it costs
// everyone 10; then he goes back under.
function surface(R, o) {
  const up = 1.0;
  const hold = o.hold;
  const drift = R(-0.3, 0.3);
  return {
    dur: up + hold + 0.8,
    charge: true,
    arrive: up + hold - 0.3,
    hittable: tau => tau > 0.6 && tau < up + hold + 0.2,
    pos: (tau, out) => {
      const e = tau < up ? 1 - (1 - tau / up) ** 2 : tau < up + hold ? 1 : Math.max(0, 1 - (tau - up - hold) / 0.8);
      return out.set(o.u + drift * tau, o.f, G - 1.9 + 1.25 * e + 0.05 * Math.sin(tau * 3));
    }
  };
}
// A mine drifting in to the quay: shoot it before it gets there.
function driftIn(R, o) {
  const f1 = HAR.Q + 0.9;
  const run = (o.f0 - f1) / o.v;
  const ph = R(0, 6);
  return {
    dur: run + 0.3,
    charge: true,
    arrive: run,
    pos: (tau, out) =>
      out.set(
        o.u + 0.5 * Math.sin(ph + tau * 0.4),
        o.f0 - o.v * Math.min(tau, run),
        G + 0.05 + 0.08 * Math.sin(ph + tau * 1.7)
      )
  };
}
function diver(R, add, t, c) {
  add(t, "bond_diverUp", surface(R, { u: R(-14, 12), f: R(8, 19), hold: R(2.4, 3.2) / c.S }));
}
// Down the pier's aisle between the containers to its end; draws.
function pierRush(R, add, t, c) {
  const h = G + HAR.PH;
  add(
    t,
    "bond_henchRun",
    rush(
      [
        [27, HAR.PF[1], h],
        [27 + R(-0.8, 0.8), 16, h],
        [R(26.2, 27.8), R(6.8, 7.6), h]
      ],
      R(4, 5) * c.S
    )
  );
}
// Along the yacht's deck behind the rail.
function deckWalk(R, add, t, c, kind) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(t, kind, cross(R, { u0: -s * 13 + 2, u1: s * 9 + 2, f: HAR.YF + 0.5, h: HAR.DECK, v: R(2.8, 3.6) * c.S }));
}

const harbourWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // they make a run for it in the boats
    for (let k = 0; k < 8; k++) add(1 + k * 3, k % 2 ? "bond_boat" : "bond_boatB", boatRun(R, c));
    for (let k = 0; k < 4; k++) diver(R, add, 3 + k * 6, c);
    for (let k = 0; k < 2; k++) pierRush(R, add, 4 + k * 10, c);
    add(10, "heli", hover(R, { S: c.S }));
    return;
  }
  const k = c.w % 6;
  for (let j = 0; j < 1 + n(0.8); j++) add(R(1, 22), pick(R, ["bond_boat", "bond_boatB"]), boatRun(R, c));
  if (k === 0 || k === 3) for (let j = 0; j < 1 + n(1.3); j++) diver(R, add, R(1, 22), c);
  if (k === 1 || k === 4) {
    for (let j = 0; j < 1 + n(0.8); j++) pierRush(R, add, R(1, 18), c);
    for (let j = 0; j < n(1); j++) deckWalk(R, add, R(1, 16), c, "bond_henchRun");
  }
  if (k === 2 || k === 5) {
    for (let j = 0; j < 1 + n(1.2); j++)
      add(R(1, 14), "bond_mine", driftIn(R, { u: R(-14, 12), f0: R(20, 23), v: R(1.4, 2) * c.S }));
    for (let j = 0; j < 1 + n(1); j++)
      add(
        R(2, 24),
        "bond_grenade",
        lobbed(R, { u: R(-12, 8), f: HAR.YF - 0.3, h: G + 4.2, vh: R(4, 6), vu: R(-1, 1), vf: -R(5, 7) })
      );
  }
  if (k === 5) add(R(3, 12), "heli", hover(R, { S: c.S }));
  if (R(0, 1) < 0.3) {
    if (R(0, 1) < 0.5) deckWalk(R, add, R(2, 14), { ...c, S: 0.6 }, "bond_contactRun");
    else {
      const s = R(0, 1) < 0.5 ? 1 : -1;
      add(R(2, 10), "bond_contactRun", cross(R, { u0: -s * 18, u1: s * 18, f: HAR.Q - 1.2, h: 0.5, v: 1.5 }));
    }
  }
};

// ---- Level 4: the volcano base ----------------------------------------------------

// Inside the hollow volcano (the one world here with walls all round: WALL
// their inner faces, BACK the far one, the crater's open sky above). You're
// on a gallery over the base's steel floor; a river of lava runs across it
// (LAVA, its near EDGE railed) with two bridges (BR). Behind it the monorail
// on its beam (RF, RH) between two tunnels, the control room in the left
// wall (CU, CF), the rocket on its pad (PAD) with its gantry (GU), and a
// catwalk along the back wall.
const VOL = {
  WALL: 30,
  BACK: 66,
  EDGE: 16,
  LAVA: [16.6, 27.4],
  BR: [-12, 12],
  RF: 33,
  RH: 11.5,
  CU: [-29, -13],
  CF: 36
};
const VPAD = [9.5, 52];
const VGU = 16;
const ROPES = [
  [-7, 39],
  [2, 41],
  [25, 40]
];
const POSTS = [-22, -6, 6, 22];
const RAIL_SIGNS = [-20, -4, 4, 20];
const CTRL_WIN = [-27, -24, -21, -18, -15];
const CTRL_DOORS = [-25, -17];
const VCRATES = [-13, 0, 13];
const CATWALK = [-18, -4, 24];
const ROCK = [0x3a2a22, 0x4a3426, 0x2e221c];

function cave(P) {
  // the side walls in three tiers leaning in, lit red down by the lava
  for (const s of [-1, 1])
    for (let k = 0, f = -8; f <= 70; f += 7, k++) {
      const lit = f > 8 && f < 34;
      P.add(BALL(7.5, 7), lit ? 0x6a321a : ROCK[k % 3], s * (VOL.WALL + 7 + (k % 2)), G + 4, f, k, k, 0, 1, 1.4, 1.1);
      P.add(BALL(7, 7), ROCK[(k + 1) % 3], s * (VOL.WALL + 6), G + 15, f + 3, k, 0, 0, 1, 1.3, 1.1);
      P.add(BALL(6.5, 7), ROCK[(k + 2) % 3], s * (VOL.WALL + 3), G + 26, f, 0, k, 0, 1.1, 1.2, 1);
      if (k % 2) P.add(BALL(5, 6), ROCK[k % 3], s * (VOL.WALL - 2), G + 34, f + 2, 0, 0, 0, 1.6, 0.6, 1.3);
      if (k % 3 === 0) P.add(BALL(2.2, 5), lit ? 0x5a2a16 : ROCK[(k + 1) % 3], s * (VOL.WALL - 0.5), G + 0.6, f + 2);
    }
  // the back wall
  for (let k = 0, u = -40; u <= 40; u += 8, k++) {
    P.add(BALL(8, 7), ROCK[k % 3], u, G + 5, VOL.BACK + 4, k, 0, 0, 1, 1.2, 1);
    P.add(BALL(7.5, 7), ROCK[(k + 1) % 3], u + 4, G + 17, VOL.BACK + 3, 0, k, 0, 1, 1.1, 1);
    P.add(BALL(7, 7), ROCK[(k + 2) % 3], u, G + 29, VOL.BACK + 1, 0, 0, 0, 1.1, 1, 1);
  }
  // a lava fall down the right wall into the river, bubbles on the river
  P.add(BOX(4, 21, 1.2), 0xff6a1a, VOL.WALL - 1.5, G + 10.5, 21, 0, 0, 0.06);
  P.add(BOX(1.3, 21, 1.3), 0xffc23a, VOL.WALL - 1.6, G + 10.5, 21, 0, 0, 0.06);
  P.add(BALL(2.6, 7), 0xff8a2a, VOL.WALL - 2.5, G + 0.3, 21, 0, 0, 0, 1.6, 0.4, 1.2);
  for (const [u, f, r] of [
    [-18, 20, 0.9],
    [-7, 25, 0.6],
    [3, 19, 0.7],
    [14, 24, 0.8],
    [24, 19.5, 0.6]
  ]) {
    P.add(BALL(r, 7), 0xffb02a, u, G, f, 0, 0, 0, 1.3, 0.55, 1);
    P.add(BALL(r * 0.45, 5), 0xffe27a, u + r * 0.2, G + r * 0.35, f - r * 0.2);
  }
  for (let u = -29; u <= 29; u += 3) P.add(BALL(0.6, 5), 0x1e1612, u, G + 0.1, VOL.LAVA[1] + 0.6, u, 0, 0, 1.4, 0.6, 1);
}

function baseFloor(P) {
  // the steel floor under you, its seams, the hazard stripe at the lava
  P.add(SLAB(64, 0.4, 27), 0x3e4248, 0, G - 0.05, 2.5);
  for (let f = -8; f < VOL.EDGE; f += 3) P.add(BOX(64, 0.02, 0.06), 0x2a2e34, 0, G + 0.16, f);
  P.add(BOX(60, 0.04, 0.5), 0xf2c230, 0, G + 0.17, VOL.EDGE - 0.4);
  for (let u = -29; u <= 29; u += 2.4) P.add(BOX(1.0, 0.05, 0.52), 0x151515, u, G + 0.18, VOL.EDGE - 0.4, 0, 0.5, 0);
  // yellow walkway lines to the bridges, his emblem painted on the floor
  for (const u of VOL.BR) for (const d of [-1.7, 1.7]) P.add(SLAB(0.12, 0.03, 26), 0xd8b020, u + d, G + 0.17, 2.5);
  P.add(TORUS(2.6, 0.22, 24), 0xc0182a, 0, G + 0.17, 4, Math.PI / 2);
  P.add(CYL(1.7, 1.7, 0.03, 20), 0xc0182a, 0, G + 0.17, 4);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    P.add(BOX(0.35, 0.03, 1.6), 0xc0182a, Math.cos(a) * 3.4, G + 0.17, 4 + Math.sin(a) * 3.4, 0, a + Math.PI / 2, 0);
  }
  // the rail along the lava (gaps for the bridges)
  for (const u of [-28, -20, -16, -8, -4, 0, 4, 8, 16, 20, 28])
    P.add(BOX(0.1, 1.2, 0.1), 0xd8b020, u, G + 0.75, VOL.EDGE + 0.1);
  for (const [a, b] of [
    [-29, -13.6],
    [-10.4, 10.4],
    [13.6, 29]
  ])
    for (const h of [0.85, 1.32]) P.add(BOX(b - a, 0.08, 0.08), 0xd8b020, (a + b) / 2, G + h, VOL.EDGE + 0.1);
  // the gas cylinder rack, crates, fuel tanks and drums
  P.add(BOX(15, 0.1, 0.6), 0x5a5e64, 0, G + 0.48, 7.9);
  P.add(BOX(15, 0.08, 0.08), 0x5a5e64, 0, G + 1.4, 8.2);
  for (const u of [-7.5, 0, 7.5]) P.add(BOX(0.1, 1.4, 0.1), 0x5a5e64, u, G + 0.85, 8.2);
  for (const u of VCRATES) {
    P.add(BOX(1.6, 1.3, 1.6), 0x6a5a3a, u, G + 0.8, 11.6);
    P.add(BOX(1.64, 0.1, 1.64), 0x4a3a24, u, G + 0.8, 11.6);
    if (u) P.add(BOX(1.1, 0.9, 1.1), 0x5a6a4a, u - Math.sign(u) * 0.2, G + 1.9, 11.7, 0, 0.4, 0);
  }
  for (const f of [8.5, 12]) {
    P.add(CYL(1.5, 1.5, 8, 14), 0xd8d8d0, 23, G + 1.8, f, 0, 0, Math.PI / 2);
    P.add(CYL(1.53, 1.53, 0.5, 14), 0xc0282a, 23, G + 1.8, f, 0, 0, Math.PI / 2);
    for (const du of [-2.5, 2.5]) P.add(BOX(0.4, 0.6, 2.6), 0x3a3e44, 23 + du, G + 0.3, f);
  }
  for (let k = 0; k < 6; k++)
    P.add(
      CYL(0.3, 0.3, 0.9, 10),
      k % 2 ? 0xf2c230 : 0x2a2a2a,
      -14 + (k % 3) * 0.7,
      G + 0.6,
      5.6 + Math.floor(k / 3) * 0.7
    );
  // pipes along the left wall, their valves
  for (const h of [1.6, 2.6])
    P.add(new THREE.CylinderGeometry(0.35, 0.35, 44, 8, 11), 0x7a6a5a, -28.5, G + h, 14, Math.PI / 2);
  for (let f = -4; f <= 32; f += 9) P.add(TORUS(0.45, 0.07, 10), 0xc0282a, -28, G + 2.1, f, 0, Math.PI / 2, 0);
}

function bridges(P) {
  for (const u of VOL.BR) {
    P.add(SLAB(3.2, 0.3, 12.8), 0x5a5e64, u, G + 1.3, 22);
    P.add(BOX(3.2, 0.15, 1.7), 0x5a5e64, u, G + 0.75, VOL.EDGE - 0.9, 0.6);
    P.add(BOX(3.2, 0.15, 1.7), 0x5a5e64, u, G + 0.75, VOL.LAVA[1] + 1.8, -0.6);
    for (const s of [-1, 1]) {
      P.add(SLAB(0.08, 0.08, 12.8), 0xd8b020, u + s * 1.5, G + 2.35, 22);
      for (let f = 16; f <= 28.01; f += 2) P.add(BOX(0.08, 1.0, 0.08), 0xd8b020, u + s * 1.5, G + 1.9, f);
      beam(P, 0x2a2e34, [u + s * 1.5, G + 1.15, 15.8], [u + s * 1.5, G + 0.25, 22], 0.25);
      beam(P, 0x2a2e34, [u + s * 1.5, G + 0.25, 22], [u + s * 1.5, G + 1.15, 28.2], 0.25);
    }
  }
}

function monorailBeam(P) {
  P.add(new THREE.BoxGeometry(68, 0.7, 0.9, 12, 1, 1), 0x6a6c70, 0, G + VOL.RH - 0.35, VOL.RF);
  for (const u of POSTS) {
    P.add(BOX(1, VOL.RH - 0.7, 1), 0x5a5c60, u, G + (VOL.RH - 0.7) / 2, VOL.RF);
    P.add(BOX(2.6, 0.5, 1.2), 0x5a5c60, u, G + VOL.RH - 0.95, VOL.RF);
    P.add(BOX(0.5, 0.5, 0.3), 0x2a2a2a, u, G + 5.2, VOL.RF - 0.6);
  }
  for (const s of [-1, 1]) {
    P.add(BOX(0.8, 5, 5), 0x7a7a7a, s * (VOL.WALL + 0.3), G + VOL.RH + 1.1, VOL.RF);
    P.add(BOX(0.2, 3.8, 3.4), 0x0a0a0a, s * (VOL.WALL - 0.1), G + VOL.RH + 1.0, VOL.RF);
  }
}

function controlRoom(P) {
  const [u0, u1] = VOL.CU;
  const F = VOL.CF;
  const w = u1 - u0;
  const m = (u0 + u1) / 2;
  P.add(BOX(w, 10, 6), 0x5a5e64, m, G + 5, F + 3);
  P.add(BOX(w + 1, 0.4, 7), 0x3a3e44, m, G + 10.2, F + 3);
  P.add(BOX(w, 0.5, 0.1), 0xf2c230, m, G + 3.3, F - 0.04);
  for (const u of CTRL_DOORS) {
    P.add(BOX(2, 2.8, 0.1), 0x14181c, u, G + 1.4, F - 0.05);
    P.add(BOX(2.3, 0.15, 0.14), 0xf2c230, u, G + 2.9, F - 0.08);
  }
  P.add(BOX(w - 1.4, 2.6, 0.08), 0x3a8aa8, m, G + 6.6, F - 0.04);
  for (let k = 0; k <= 7; k++) P.add(BOX(0.16, 2.6, 0.12), 0x2a2e34, u0 + 0.7 + ((w - 1.4) * k) / 7, G + 6.6, F - 0.07);
  P.add(BOX(w - 1.0, 0.25, 0.6), 0x2a2e34, m, G + 5.2, F - 0.3);
  P.add(CYL(0.05, 0.05, 3, 4), 0x9a9a9a, m + 5, G + 11.9, F + 3);
  P.add(BALL(0.2, 5), 0xff3030, m + 5, G + 13.4, F + 3);
}

// A rocket standing on h0: engines, fins, bands, its stages and nose.
function rocket(P, u, f, h0, r, len, band) {
  for (const [du, df] of [
    [0, 0],
    [-r * 0.45, r * 0.3],
    [r * 0.45, r * 0.3]
  ])
    P.add(CONE(r * 0.35, r * 0.7, 10), 0x3a3a3a, u + du, h0 + r * 0.3, f + df, Math.PI, 0, 0);
  P.add(CYL(r, r, len, 16), 0xf4f4f0, u, h0 + r * 0.6 + len / 2, f);
  for (const k of [0.25, 0.75]) P.add(CYL(r * 1.015, r * 1.015, r * 0.4, 16), 0x1a1a1a, u, h0 + r * 0.6 + len * k, f);
  P.add(CYL(r * 1.015, r * 1.015, r * 0.3, 16), band, u, h0 + r * 0.6 + len * 0.5, f);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    P.add(
      BOX(r * 1.1, r * 1.9, 0.25),
      band,
      u + Math.cos(a) * r * 1.3,
      h0 + r * 1.5,
      f + Math.sin(a) * r * 1.3,
      0,
      a,
      0
    );
  }
  const top = h0 + r * 0.6 + len;
  P.add(CYL(r * 0.75, r, r * 0.8, 16), 0xf4f4f0, u, top + r * 0.4, f);
  P.add(CYL(r * 0.75, r * 0.75, r, 16), 0xd8dce0, u, top + r * 1.3, f);
  P.add(CONE(r * 0.75, r * 1.9, 16), 0xf4f4f0, u, top + r * 2.75, f);
  P.add(CONE(r * 0.25, r * 0.6, 10), band, u, top + r * 3.5, f);
  return top + r * 3.8;
}

function launchPad(P) {
  const [u, f] = VPAD;
  P.add(BOX(16, 2.4, 12), 0x6a6a6c, u + 2, G + 1.2, f);
  P.add(BOX(5, 0.1, 12.2), 0x1a1a1a, u, G + 2.42, f);
  P.add(BOX(16, 0.3, 0.1), 0xf2c230, u + 2, G + 2.2, f - 6.04);
  rocket(P, u, f, G + 2.4, 2, 17, 0xc0182a);
  // the gantry, its platforms and swing arms
  lattice(P, 0x9a3a22, VGU, f, G + 2.4, G + 28, 3, 3, 7, 0.2);
  const step = (28 - 2.4) / 7;
  for (const k of [2, 4, 6]) {
    const h = G + 2.4 + step * k;
    P.add(BOX(3.6, 0.2, 3.6), 0x5a5e64, VGU, h, f);
    P.add(BOX(3.2, 0.5, 1.3), 0x8a8e94, VGU - 3.0, h + 0.2, f);
  }
  P.add(BOX(1.2, 2.2, 1.2), 0xf2c230, VGU, G + 14, f);
  P.add(CYL(0.05, 0.05, 4, 4), 0x9a9a9a, VGU, G + 30, f);
  P.add(BALL(0.3, 6), 0xff3030, VGU, G + 28.4, f);
  for (const du of [-5.5, 9.5]) {
    P.add(CYL(0.06, 0.06, 1, 5), 0x3a3a3a, u + du, G + 2.9, f - 5.8);
    P.add(BALL(0.18, 5), 0xff8a2a, u + du, G + 3.45, f - 5.8);
  }
  // the gas rack by the pad
  P.add(BOX(7, 0.1, 0.6), 0x5a5e64, -7, G + 0.45, 45);
  P.add(BOX(7, 0.08, 0.08), 0x5a5e64, -7, G + 1.3, 45.3);
  for (const du of [-3.4, 3.4]) P.add(BOX(0.1, 1.3, 0.1), 0x5a5e64, -7 + du, G + 0.65, 45.3);
}

WORLDS.bond_volcano = {
  sky: {
    top: "#1a2440",
    mid: "#2a1810",
    horizon: "#7a3010",
    ground: "#120a06",
    hills: [
      { colour: "#24160f", height: 58, rough: 6, phase: 1 },
      { colour: "#3a2216", height: 30, rough: 7, phase: 3 }
    ],
    seed: 403
  },
  fog: 0x2a140c,
  signs: [
    ["CONTROL", (VOL.CU[0] + VOL.CU[1]) / 2, G + 8.75, VOL.CF - 0.1, 4, 0.8, "#2a2e34", "#7ae0ff"],
    ["DANGER · LAVA", 0, G + 1.85, VOL.EDGE + 0.05, 3.4, 0.5, "#f2c230", "#151515"],
    ["LAUNCH PAD 1", VPAD[0] + 2, G + 1.2, VPAD[1] - 6.1, 4, 0.7, "#f2c230", "#151515"]
  ],
  build(P) {
    P.ground(0x231a16, [
      { u: 0, f: 22, r: 10, c: 0xff5a14, sx: 3.4, sz: 0.56 },
      { u: -14, f: 21.5, r: 3, c: 0xffb02a, sx: 2.2, sz: 0.3 },
      { u: 9, f: 23, r: 3, c: 0xffc23a, sx: 1.8, sz: 0.25 },
      { u: 22, f: 21, r: 2.5, c: 0xffa02a, sx: 1.6, sz: 0.3 },
      { u: -4, f: 23.5, r: 2.2, c: 0x6a1e0a, sx: 1.8, sz: 0.4 },
      { u: 16, f: 20, r: 1.8, c: 0x5a1a0a, sx: 1.4, sz: 0.4 },
      { u: -22, f: 24, r: 2, c: 0x6a1e0a, sx: 1.5, sz: 0.4 },
      { u: 11, f: 52, r: 10, c: 0x4a4a4c },
      { u: -6, f: 36, r: 6, c: 0x3a3634, sx: 3.5, sz: 0.5 }
    ]);
    cave(P);
    baseFloor(P);
    bridges(P);
    monorailBeam(P);
    controlRoom(P);
    launchPad(P);
    // the ropes down from the crater, the catwalk along the back wall
    for (const [u, f] of ROPES) P.add(CYL(0.035, 0.035, 30, 4), 0x1a1a1a, u, G + 15, f);
    P.add(BOX(52, 0.2, 1.6), 0x5a5e64, 0, G + 13, 61);
    P.add(BOX(52, 0.06, 0.06), 0xd8b020, 0, G + 14.1, 60.3);
    for (let u = -26; u <= 26.01; u += 4) P.add(BOX(0.06, 1.1, 0.06), 0xd8b020, u, G + 13.6, 60.3);
    for (let u = -24; u <= 24; u += 12) P.add(BOX(0.3, 13, 0.3), 0x3a3e44, u, G + 6.5, 61.5);
  },
  slots: [],
  cover: null
};

LAYOUTS.bond_volcano = L => {
  const fixed = { fixed: true, rail: false };
  // gas cylinders on the rack, hazard signs on the lava rail, lamps on the monorail's posts
  L.row({
    ...fixed,
    kind: "bottle",
    n: 8,
    f: 7.75,
    u0: -7,
    u1: 7,
    base: 0.53,
    size: 0.75,
    tint: ["green", "steel"],
    bank: 4
  });
  for (const u of RAIL_SIGNS)
    L.row({ ...fixed, kind: "diamond", n: 1, f: VOL.EDGE - 0.05, u0: u, u1: u, base: 0.6, size: 0.5, tint: "yellow" });
  for (const u of POSTS)
    L.row({ ...fixed, kind: "disc", n: 1, f: VOL.RF - 0.75, u0: u, u1: u, base: 5.0, size: 0.45, tint: "yellow" });
  for (const u of [VOL.CU[0] + 0.4, VOL.CU[1] - 0.4])
    L.row({ ...fixed, kind: "bond_cam", n: 1, f: VOL.CF - 0.15, u0: u, u1: u, base: 9.0, size: 0.45, tint: "steel" });
  // by the pad: more cylinders, its corner lamps, the gantry's beacon
  L.row({
    ...fixed,
    kind: "bottle",
    n: 4,
    f: 44.85,
    u0: -9.4,
    u1: -4.6,
    base: 0.5,
    size: 0.75,
    tint: ["steel", "green"],
    bank: 4
  });
  L.row({
    ...fixed,
    kind: "disc",
    n: 2,
    f: VPAD[1] - 6.2,
    u0: VPAD[0] - 5.5,
    u1: VPAD[0] + 9.5,
    base: 3.25,
    size: 0.45,
    tint: "orange"
  });
  L.row({
    ...fixed,
    kind: "disc",
    n: 1,
    f: VPAD[1] - 1.8,
    u0: VGU,
    u1: VGU,
    base: 28.1,
    size: 0.6,
    tint: "red",
    pts: 50
  });
  const staff = (a, b, c) => [
    ["bond_guard", a],
    ["henchman", b],
    ["bond_lab", c, { dont: true }]
  ];
  // behind the crates, in the control room's window and doors
  L.pops({ fixed: true, f: 12.6, at: VCRATES.map(u => [u, 0.15]), size: 1.75, kinds: staff(60, 15, 25) });
  L.pops({ fixed: true, f: VOL.CF - 0.35, at: CTRL_WIN.map(u => [u, 5.35]), size: 1.5, kinds: staff(40, 20, 40) });
  L.pops({ fixed: true, f: VOL.CF - 0.35, at: CTRL_DOORS.map(u => [u, 0.15]), size: 1.75, kinds: staff(65, 10, 25) });
  // on the gantry's platforms, along the back catwalk
  const step = (28 - 2.4) / 7;
  L.pops({
    fixed: true,
    f: VPAD[1] - 1.8,
    at: [2, 4].map(k => [VGU, 2.4 + step * k + 0.1]),
    size: 1.4,
    period: [5, 8],
    kinds: [
      ["bond_guard", 80, { pts: 50 }],
      ["bond_lab", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 60.1,
    at: CATWALK.map(u => [u, 13.1]),
    size: 1.4,
    period: [6, 9],
    busy: 0.6,
    kinds: [["bond_guard", 100, { pts: 50 }]]
  });
};

// Across the floor: the near lane (between the rack and the crates) or the
// far one (between the lava and the monorail).
function floorRun(R, add, t, c, kind, far, v) {
  const s = R(0, 1) < 0.5 ? 1 : -1;
  add(t, kind, cross(R, { u0: -s * 28, u1: s * 28, f: far ? R(29.2, 31.2) : R(9.2, 10.6), v: v ?? R(4.5, 6.5) * c.S }));
}
// Over a bridge, across the lava, up to you; draws.
function bridgeRush(R, add, t, c) {
  const u = pick(R, VOL.BR) + R(-0.6, 0.6);
  add(
    t,
    "bond_guardRun",
    rush(
      [
        [u + R(-3, 3), 34, G],
        [u, 29.6, G],
        [u, 28.4, G + 1.3],
        [u, 15.6, G + 1.3],
        [u, 14.6, G + 0.15],
        [u * 0.6 + R(-2, 2), R(9.5, 10.5), G + 0.15]
      ],
      R(3.6, 4.6) * c.S
    )
  );
}
// The monorail across, n of them riding in it (a scientist now and then: don't).
function monorail(R, add, t, c, n) {
  const dir = R(0, 1) < 0.5 ? 1 : -1;
  const u0 = -dir * 34;
  const v = R(5, 6.5) * c.S;
  const along = du => cross(R, { u0: u0 + du, u1: -u0 + du, f: VOL.RF, h: VOL.RH, v, bob: 0 });
  add(t, "bond_monorail", { ...along(0), hittable: () => false });
  const lab = n > 1 && R(0, 1) < 0.3 ? 1 : -1;
  for (let k = 0; k < n; k++) add(t, k === lab ? "bond_labRun" : "bond_guardRun", along((k - (n - 1) / 2) * 1.7));
}
// Down a rope from the crater; draws at the bottom.
function abseil(R, add, t, c) {
  const [u, f] = pick(R, ROPES);
  const w = walk(
    [
      [u, f, G + 24],
      [u, f, G]
    ],
    R(3.2, 4.2) * c.S,
    0
  );
  add(t, "bond_guardRun", { dur: w.time + 2.2, charge: true, arrive: w.time + 1.0, pos: w.pos });
}
function lavaBomb(R, add, t, c) {
  add(t, "bond_lava", toss(R, { u: R(-24, 24), f: R(18, 26), h: G + 0.3, vh: R(9, 12) * Math.sqrt(c.S) }));
}

const lairWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the alarm: every guard in the base comes for you
    monorail(R, add, 1, c, 3);
    monorail(R, add, 15, c, 3);
    for (let k = 0; k < 5; k++) abseil(R, add, 2 + k * 4.5, c);
    for (let k = 0; k < 3; k++) bridgeRush(R, add, 4 + k * 7, c);
    for (let k = 0; k < 4; k++) lavaBomb(R, add, 3 + k * 5.5, c);
    return;
  }
  const k = c.w % 6;
  for (let j = 0; j < 1 + n(0.8); j++) floorRun(R, add, R(1, 22), c, "bond_guardRun", R(0, 1) < 0.5);
  if (k === 0 || k === 3) monorail(R, add, R(1, 12), c, n(1) > 1 ? 3 : 2);
  if (k === 1 || k === 4) for (let j = 0; j < 1 + n(1); j++) abseil(R, add, R(1, 18), c);
  if (k === 2 || k === 5) {
    for (let j = 0; j < 1 + n(0.8); j++) bridgeRush(R, add, R(1, 16), c);
    for (let j = 0; j < 2 + n(1.5); j++) lavaBomb(R, add, R(1, 25), c);
  }
  if (k === 0) for (let j = 0; j < 1 + n(1); j++) lavaBomb(R, add, R(1, 25), c);
  if (k === 4)
    for (let j = 0; j < 1 + n(1); j++)
      add(
        R(2, 24),
        "bond_grenade",
        lobbed(R, { u: R(-27, -15), f: VOL.CF - 0.5, h: G + 6.5, vh: R(3, 5), vu: R(2, 4), vf: -R(4, 6) })
      );
  if (R(0, 1) < 0.35) floorRun(R, add, R(2, 16), c, "bond_labRun", true, R(1.6, 2.2));
};

// ---- Level 5: the launch -----------------------------------------------------------

// Dawn on the volcano's island, the crater opened up: the launch site. The
// bunker (BU, BF its front) on the left, the fuel spheres behind their fence
// (TANKS, FENCE) on the right, the rocket on its pad (PAD) in the middle with
// its gantry (GU), the missile silos on the apron, floodlight towers, and his
// helicopter waiting on its pad (HELI). The countdown runs down the waves.
const LCH = { BU: [-28, -12], BF: 12, PAD: [0, 50], GU: 8, FENCE: 15, HELI: [-13, 37] };
const TANKS = [
  [22, 22],
  [31, 29]
];
const SILOS = [
  [-7, 21],
  [7, 23]
];
const FLOOD = [
  [-27, 32],
  [-5, 33],
  [13, 31],
  [24, 33]
];
const SLITS = [-25.5, -22, -18.5, -15];
const BDOOR = -13.6;
const FENCE_SIGNS = [15, 19.5, 24, 28.5];
const GSTEP = (30 - 2.6) / 8;

function bunker(P) {
  const [u0, u1] = LCH.BU;
  const F = LCH.BF;
  const m = (u0 + u1) / 2;
  const w = u1 - u0;
  P.add(BOX(w, 4.2, 8), 0x6a6a64, m, G + 2.1, F + 4);
  P.add(BOX(w + 1, 0.8, 9), 0x3a3a34, m, G + 4.5, F + 4);
  for (const u of SLITS) {
    P.add(BOX(2.4, 0.5, 0.1), 0xf2b04a, u, G + 2.6, F - 0.05);
    P.add(BOX(2.8, 0.2, 0.5), 0x5a5a54, u, G + 2.95, F - 0.2);
  }
  P.add(BOX(1.6, 2.4, 0.12), 0x3a4048, BDOOR, G + 1.2, F - 0.06);
  for (let k = 0; k < 4; k++)
    P.add(BOX(1.6, 0.12, 0.13), k % 2 ? 0x151515 : 0xf2c230, BDOOR, G + 2.5 + k * 0.12, F - 0.07);
  for (const [du, h] of [
    [-5, 4],
    [-1, 6],
    [4, 3]
  ])
    P.add(CYL(0.04, 0.06, h, 4), 0x9a9a9a, m + du, G + 4.9 + h / 2, F + 4);
  // sandbags along its front
  for (let k = 0; k < 14; k++) {
    const u = u0 + 0.8 + k * 1.0;
    if (Math.abs(u - BDOOR) < 1.2) continue;
    P.add(BALL(0.35, 5), 0x8a7a5a, u, G + 0.18, F - 1.4, 0, 0, 0, 1.4, 0.5, 0.8);
    if (k % 2) P.add(BALL(0.35, 5), 0x7a6a4a, u + 0.5, G + 0.5, F - 1.4, 0, 0, 0, 1.4, 0.5, 0.8);
  }
}

function fuelFarm(P) {
  for (const [u, f] of TANKS) {
    P.add(BALL(4, 14), 0xe8e8ec, u, G + 6.5, f, 0, 0, 0, 1, 1, 1, 0.3);
    P.add(TORUS(4.02, 0.12, 20), 0xc0182a, u, G + 6.5, f, Math.PI / 2);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      P.add(BOX(0.3, 4.5, 0.3), 0x8a8e94, u + Math.cos(a) * 3.2, G + 2.25, f + Math.sin(a) * 3.2);
    }
    P.add(BOX(1.8, 0.15, 1.8), 0x5a5e64, u, G + 10.55, f);
    beam(P, 0x8a8a8a, [u - 3, G + 0.6, f + 1], [LCH.GU + 1, G + 0.6, LCH.PAD[1] - 6], 0.4);
  }
  // the fence in front, its posts and rails
  for (let u = 14; u <= 34.01; u += 2.5) P.add(BOX(0.08, 2, 0.08), 0x8a8e94, u, G + 1, LCH.FENCE);
  for (const h of [0.6, 1.3, 1.95]) P.add(BOX(20, 0.04, 0.04), 0x8a8e94, 24, G + h, LCH.FENCE);
}

function silos(P) {
  for (const [u, f] of SILOS) {
    P.add(CYL(1.8, 1.8, 0.4, 16), 0x5a5a5c, u, G + 0.2, f);
    P.add(CYL(1.4, 1.4, 0.42, 16), 0x0a0a0a, u, G + 0.21, f);
    P.add(TORUS(1.6, 0.08, 16), 0xf2c230, u, G + 0.42, f, Math.PI / 2);
    for (const s of [-1, 1]) P.add(BOX(1.4, 0.15, 2.8), 0x6a6a6c, u + s * 1.9, G + 1.0, f, 0, 0, s * 1.15);
    P.add(CYL(0.06, 0.06, 1.8, 5), 0x3a3a3a, u + 2.4, G + 0.9, f - 0.4);
    P.add(BALL(0.16, 5), 0xff8a2a, u + 2.4, G + 1.85, f - 0.4);
  }
}

function floodlights(P) {
  for (const [u, f] of FLOOD) {
    lattice(P, 0x5a5e64, u, f, G, G + 13, 1.6, 0.7, 3, 0.12);
    P.add(BOX(2.6, 1.4, 0.4), 0x2a2a2a, u, G + 13.8, f);
    P.add(BOX(2.4, 1.2, 0.05), 0xfff2c0, u, G + 13.8, f - 0.22);
  }
}

function heliPad(P) {
  const [u, f] = LCH.HELI;
  for (const [du, w, d] of [
    [-0.8, 0.4, 2.4],
    [0.8, 0.4, 2.4],
    [0, 1.6, 0.4]
  ])
    P.add(BOX(w, 0.03, d), 0xf4f4f0, u + du, G + 0.08, f - 2.6);
  // his helicopter: black, facing left
  P.add(CAP(1.1, 2.6, 10), 0x1a1a1e, u, G + 1.6, f, 0, 0, Math.PI / 2);
  P.add(BALL(0.95, 8), 0x4a7aa8, u - 1.9, G + 1.75, f, 0, 0, 0, 1, 0.9, 0.95);
  P.add(CYL(0.2, 0.1, 4.4, 6), 0x1a1a1e, u + 3.8, G + 1.95, f, 0, 0, Math.PI / 2);
  P.add(BOX(0.8, 1.2, 0.08), 0x1a1a1e, u + 5.8, G + 2.4, f, 0, 0, -0.3);
  P.add(CYL(0.08, 0.08, 0.5, 5), 0x2a2a2a, u, G + 2.85, f);
  for (const a of [0.5, -1.07]) P.add(BOX(10, 0.06, 0.35), 0x2a2a2a, u, G + 3.1, f, 0, a, 0);
  for (const s of [-0.8, 0.8]) {
    P.add(BOX(3.4, 0.08, 0.08), 0x2a2a2a, u, G + 0.2, f + s);
    for (const du of [-1, 1]) P.add(BOX(0.06, 0.6, 0.06), 0x2a2a2a, u + du, G + 0.5, f + s * 0.8);
  }
}

function launchSite(P) {
  const [u, f] = LCH.PAD;
  P.add(BOX(18, 2.6, 16), 0x6a6a6c, u, G + 1.3, f);
  P.add(BOX(5, 0.1, 16.2), 0x1a1a1a, u - 1, G + 2.62, f);
  P.add(BOX(18, 0.3, 0.1), 0xf2c230, u, G + 2.4, f - 8.04);
  for (const s of [-1, 1]) {
    // the boosters strapped on either side
    const bu = u + s * 3.4;
    P.add(CYL(1.0, 1.0, 12, 12), 0xf4f4f0, bu, G + 10.4, f);
    P.add(CONE(1.0, 2.2, 12), 0xf4f4f0, bu, G + 17.5, f);
    P.add(CONE(0.8, 1.2, 10), 0x3a3a3a, bu, G + 3.8, f, Math.PI, 0, 0);
    P.add(BOX(1.6, 2.2, 0.15), 0x1a1a1a, bu + s * 1.4, G + 5.5, f, 0, s > 0 ? 0 : Math.PI, 0);
    P.add(CYL(1.015, 1.015, 0.6, 12), 0x1a1a1a, bu, G + 13, f);
  }
  const top = rocket(P, u, f, G + 2.6, 2.4, 14, 0x1a1a1a);
  // the gantry, its platforms and arms, its beacon
  lattice(P, 0x9a2a1a, LCH.GU, f, G + 2.6, G + 30, 3.2, 3.2, 8, 0.22);
  for (const k of [3, 5, 7]) {
    const h = G + 2.6 + GSTEP * k;
    const reach = h > G + 18.6 ? u + 2.2 : u + 4.4;
    P.add(BOX(3.6, 0.2, 3.6), 0x5a5e64, LCH.GU, h, f);
    P.add(BOX(LCH.GU - 1.6 - reach, 0.55, 1.3), 0x8a8e94, (LCH.GU - 1.6 + reach) / 2, h + 0.2, f);
  }
  P.add(BOX(1.2, 2.2, 1.2), 0xf2c230, LCH.GU, G + 15, f);
  P.add(CYL(0.05, 0.05, Math.max(4, top - G - 26), 4), 0x9a9a9a, LCH.GU, G + 32, f);
  P.add(BALL(0.3, 6), 0xff3030, LCH.GU, G + 30.4, f);
  for (const du of [-8, 8]) {
    P.add(CYL(0.06, 0.06, 1.0, 5), 0x3a3a3a, u + du, G + 3.1, f - 7.7);
    P.add(BALL(0.18, 5), 0xff3030, u + du, G + 3.65, f - 7.7);
  }
  // venting steam round its foot
  for (let k = 0; k < 10; k++) {
    const a = Math.PI * (0.05 + (k / 9) * 0.9);
    const r = 6 + (k % 3) * 1.5;
    P.add(
      BALL(1.6 + (k % 3) * 0.6, 7),
      k % 2 ? 0xd8d4dc : 0xc8c4d0,
      u + Math.cos(a) * r,
      G + 3 + (k % 2),
      f + 1.5 + Math.sin(a) * r * 0.6
    );
  }
}

WORLDS.bond_launch = {
  sky: {
    top: "#0c0a2e",
    mid: "#5a2a6a",
    horizon: "#ff9a5a",
    ground: "#101822",
    sun: [40, 2, "#ffd890", 13],
    stars: true,
    clouds: 7,
    cloud: "rgba(255,150,130,0.4)",
    hills: [{ colour: "#2a1a3a", height: 5, rough: 2, phase: 2 }],
    seed: 404
  },
  fog: 0x3a2a4a,
  signs: [
    ["LAUNCH CONTROL", (LCH.BU[0] + LCH.BU[1]) / 2 - 1, G + 3.75, LCH.BF - 0.1, 5, 0.55, "#2a2a2a", "#f2c230"],
    ["DANGER · ROCKET FUEL", 24, G + 2.4, LCH.FENCE - 0.05, 5.4, 0.55, "#c0182a", "#ffffff"],
    ["PAD 1", LCH.PAD[0], G + 1.3, LCH.PAD[1] - 8.1, 2.4, 0.8, "#f2c230", "#151515"]
  ],
  build(P) {
    P.ground(0x4c4c50, [
      { u: -40, f: 40, r: 14, c: 0x2c2828, sx: 1.2, sz: 1.6 },
      { u: 44, f: 46, r: 14, c: 0x2c2828, sx: 1.2, sz: 1.4 },
      { u: 0, f: 70, r: 18, c: 0x2c2828, sx: 2.6, sz: 0.6 },
      { u: LCH.HELI[0], f: LCH.HELI[1], r: 4.5, c: 0x3a3a3c },
      { u: 22, f: 44, r: 8, c: 0x3a3436, sx: 2, sz: 0.4 },
      { u: -30, f: 50, r: 10, c: 0x3a3032, sx: 1.6, sz: 0.6 }
    ]);
    bunker(P);
    fuelFarm(P);
    silos(P);
    floodlights(P);
    heliPad(P);
    launchSite(P);
    // the radar dish
    P.add(CYL(0.6, 0.9, 5, 8), 0x8a8e94, -25, G + 2.5, 54);
    P.add(new THREE.SphereGeometry(4, 14, 4, 0, Math.PI * 2, Math.PI - 0.9, 0.9), 0xd8dce0, -25, G + 9.2, 54, -0.5);
    P.add(CYL(0.08, 0.08, 3, 5), 0x8a8e94, -25, G + 7.6, 53.4, -0.5);
    // the apron's painted lines
    P.add(SLAB(0.25, 0.03, 34), 0xd8b020, 0, G + 0.06, 24);
    for (const f of [4, 30]) P.add(BOX(40, 0.03, 0.25), 0xd8b020, -6, G + 0.06, f);
    for (let f = 2; f < 40; f += 5) P.add(BOX(1.6, 0.03, 0.25), 0xf4f4f0, -18, G + 0.06, f, 0, 0.6, 0);
    // under you: a sandbag wall, the fuel cart, crates
    for (let k = 0; k < 9; k++) {
      P.add(BALL(0.4, 5), 0x8a7a5a, -4 + k, G + 0.2, 9, 0, 0, 0, 1.4, 0.5, 0.8);
      P.add(BALL(0.4, 5), 0x7a6a4a, -3.5 + k, G + 0.55, 9, 0, 0, 0, 1.4, 0.5, 0.8);
    }
    P.add(BOX(4.4, 0.12, 1.2), 0x5a5e64, 6.5, G + 0.76, 6.2);
    for (const du of [-1.6, 1.6])
      for (const s of [-0.62, 0.62]) P.add(CYL(0.3, 0.3, 0.18, 10), 0x151515, 6.5 + du, G + 0.3, 6.2 + s, Math.PI / 2);
    P.add(BOX(0.06, 0.06, 1.4), 0x3a3a3a, 4.1, G + 0.9, 6.2);
    for (const [u, f, s] of [
      [-9, 4, 1.4],
      [-10.4, 4.6, 1.1],
      [-8.6, 4.3, 0.8]
    ])
      P.add(BOX(s, s, s), 0x5a6a4a, u, G + (s === 0.8 ? 1.4 + 0.4 : s / 2), f);
    P.scatter(18, 30, 80, (u, f, R) => Math.abs(u) > 36 && P.rock(u, f, 1 + R() * 2, 0x3a3234), 70);
  },
  slots: [],
  cover: null
};

LAYOUTS.bond_launch = L => {
  const fixed = { fixed: true, rail: false };
  // fuel cells on the cart, hazard signs on the fence, cameras on the bunker
  L.row({
    ...fixed,
    kind: "bottle",
    n: 6,
    f: 6.0,
    u0: 4.6,
    u1: 8.4,
    base: 0.82,
    size: 0.6,
    tint: ["steel", "green"],
    bank: 3
  });
  for (const u of FENCE_SIGNS)
    L.row({
      ...fixed,
      kind: "diamond",
      n: 1,
      f: LCH.FENCE - 0.15,
      u0: u,
      u1: u,
      base: 0.85,
      size: 0.5,
      tint: "yellow"
    });
  for (const u of [LCH.BU[0] + 0.4, LCH.BU[1] - 0.4])
    L.row({ ...fixed, kind: "bond_cam", n: 1, f: LCH.BF - 0.15, u0: u, u1: u, base: 3.6, size: 0.42, tint: "steel" });
  // the silos' lamps, the floodlights, the pad's lamps, the gantry's beacon
  for (const [u, f] of SILOS)
    L.row({
      ...fixed,
      kind: "disc",
      n: 1,
      f: f - 0.6,
      u0: u + 2.4,
      u1: u + 2.4,
      base: 1.68,
      size: 0.35,
      tint: "orange"
    });
  for (const [u, f] of FLOOD)
    L.row({ ...fixed, kind: "disc", n: 1, f: f - 0.45, u0: u, u1: u, base: 13.45, size: 0.7, tint: "white" });
  L.row({
    ...fixed,
    kind: "disc",
    n: 2,
    f: LCH.PAD[1] - 8.0,
    u0: LCH.PAD[0] - 8,
    u1: LCH.PAD[0] + 8,
    base: 3.45,
    size: 0.4,
    tint: "red"
  });
  L.row({
    ...fixed,
    kind: "disc",
    n: 1,
    f: LCH.PAD[1] - 1.9,
    u0: LCH.GU,
    u1: LCH.GU,
    base: 30.1,
    size: 0.6,
    tint: "red",
    pts: 50
  });
  const crew = (a, b, c) =>
    [
      ["bond_guard", a],
      ["henchman", b],
      ["bond_lab", c, { dont: true }]
    ].filter(k => k[1] > 0);
  // the bunker's slits and door, behind the sandbags under you
  L.pops({ fixed: true, f: LCH.BF - 0.35, at: SLITS.map(u => [u, 1.65]), size: 1.55, kinds: crew(55, 25, 20) });
  L.pops({ fixed: true, f: LCH.BF - 0.35, at: [[BDOOR, 0.15]], size: 1.75, kinds: crew(70, 0, 30) });
  L.pops({ fixed: true, f: 9.6, at: [-2.5, 2.5].map(u => [u, 0]), size: 1.7, kinds: crew(75, 25, 0) });
  // by his helicopter, on the gantry (and now and then, the Mastermind)
  L.pops({
    fixed: true,
    f: LCH.HELI[1] - 1.9,
    at: [-3.5, 3.5].map(du => [LCH.HELI[0] + du, 0]),
    size: 1.75,
    kinds: [
      ["henchman", 55],
      ["bond_mm", 10, { pts: 250 }],
      ["bond_guard", 35]
    ]
  });
  L.pops({
    fixed: true,
    f: LCH.PAD[1] - 1.9,
    at: [3, 5, 7].map(k => [LCH.GU, 2.6 + GSTEP * k + 0.1]),
    size: 1.4,
    period: [5, 8],
    kinds: [
      ["bond_guard", 65, { pts: 50 }],
      ["bond_mm", 12, { pts: 250 }],
      ["bond_lab", 23, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: TANKS[0][1] - 0.6,
    at: [[TANKS[0][0], 10.65]],
    size: 1.4,
    period: [6, 9],
    busy: 0.6,
    kinds: [["bond_guard", 100, { pts: 50 }]]
  });
};

// The Mastermind: down off the pad and across the apron to his helicopter.
function dash(R, add, t, c) {
  const [hu, hf] = LCH.HELI;
  const w = walk(
    [
      [LCH.GU - 1.5, LCH.PAD[1] - 2.5, G + 2.6],
      [4, LCH.PAD[1] - 7.6, G + 2.6],
      [2, LCH.PAD[1] - 9.5, G],
      [-9, 39, G],
      [hu + 1.5, hf - 0.8, G]
    ],
    R(4, 4.6) * c.S
  );
  add(t, "bond_mmRun", { dur: w.time + 0.4, pos: w.pos });
}
// Out of the bunker's door and up to you; draws.
function bunkerRush(R, add, t, c) {
  add(
    t,
    "bond_guardRun",
    rush(
      [
        [BDOOR, LCH.BF + 0.3, G],
        [BDOOR + R(1, 3), R(9.8, 10.6), G],
        [R(-10, -5.5), R(7, 8.5), G]
      ],
      R(3, 4) * c.S
    )
  );
}
// Across the apron (out from behind the fuel farm, or into it).
function apronRun(R, add, t, c, kind = "bond_guardRun", v) {
  const s = R(0, 1) < 0.5;
  add(t, kind, cross(R, { u0: s ? -30 : 13, u1: s ? 13 : -30, f: R(16.5, 19), v: v ?? R(4.5, 6) * c.S }));
}
// A missile up out of a silo.
function missile(R, add, t, c) {
  const [u, f] = pick(R, SILOS);
  const a = R(3, 4.5) * c.S;
  const v0 = 2;
  const tilt = R(-0.4, 0.4);
  add(t, "bond_missile", {
    dur: (-v0 + Math.sqrt(v0 * v0 + 2 * a * 32)) / a,
    pos: (tau, out) => out.set(u + tilt * tau * tau, f, G + 0.5 + v0 * tau + 0.5 * a * tau * tau)
  });
}
function satellite(R, add, t, c) {
  add(t, "bond_sat", across(R, { v: R(5, 7) * c.S, h: R(15, 22), f: R(30, 50), amp: 0.3 }));
}
function drone(R, add, t, c) {
  add(t, "drone", dart(R, { v: R(9, 12) * c.S, h: R(4, 10), f: R(14, 32) }));
}

const launchWave = (R, add, c) => {
  const n = x => Math.round(x * c.I);
  if (c.x2) {
    // the final assault: he runs for his helicopter, and it takes off
    dash(R, add, 3, c);
    add(12, "heli", hover(R, { f: 30, h: 10 }));
    for (let k = 0; k < 10; k++) drone(R, add, 1 + k * 2.4, c);
    for (let k = 0; k < 3; k++) satellite(R, add, 2 + k * 7, c);
    for (let k = 0; k < 4; k++) missile(R, add, 4 + k * 5, c);
    for (let k = 0; k < 3; k++) bunkerRush(R, add, 5 + k * 6, c);
    return;
  }
  const k = c.w % 6;
  for (let j = 0; j < 1 + n(1.2); j++) drone(R, add, R(1, 24), c);
  if (k === 0 || k === 3) for (let j = 0; j < 1 + n(0.8); j++) satellite(R, add, R(1, 20), c);
  if (k === 1 || k === 4) for (let j = 0; j < 1 + n(1); j++) missile(R, add, R(1, 24), c);
  if (k === 2 || k === 5) {
    for (let j = 0; j < 1 + n(0.8); j++) bunkerRush(R, add, R(1, 18), c);
    for (let j = 0; j < 1 + n(0.6); j++) apronRun(R, add, R(1, 20), c);
  }
  if (k === 5)
    for (let j = 0; j < 1 + n(1); j++)
      add(
        R(2, 24),
        "bond_grenade",
        lobbed(R, { u: R(-26, -14), f: LCH.BF + 1, h: G + 4.8, vh: R(3, 5), vu: R(1.5, 3), vf: -R(1.5, 2.5) })
      );
  if (k === 3 && R(0, 1) < 0.25) dash(R, add, R(4, 16), c);
  if (R(0, 1) < 0.3) apronRun(R, add, R(2, 14), c, "bond_labRun", R(2, 2.6));
};
// T-MINUS 6:00 down to 0:30, then the final assault.
const countdown = w => {
  const s = (12 - (w % 12)) * 30;
  return `T-MINUS ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// ---- The sound beds (shoots-art makeAmbience) -------------------------------------

// Each adds into d (8.5 s at sr; the last 0.5 s is crossfaded over the start).
const lowpass = (R, k) => {
  let y = 0;
  return () => (y += k * (R() * 2 - 1 - y));
};
// Wind over the snow in gusts, the cable car's motor far off, its wheels
// clicking over a pylon.
AMBIENCE.bond_snow = (d, sr, R) => {
  const lo = lowpass(R, 0.015);
  const hi = lowpass(R, 0.12);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const gust = 0.55 + 0.45 * Math.sin((t * 2 * Math.PI) / 8) * Math.sin((t * 2 * Math.PI) / 4 + 1);
    const a = lo();
    d[i] += a * 2.4 * gust + (hi() - a) * 0.3 * gust;
    d[i] += Math.sin(2 * Math.PI * 96 * t) * 0.01 + Math.sin(2 * Math.PI * 192 * t) * 0.005;
    const k = t % 4;
    if (k < 0.05) d[i] += (R() * 2 - 1) * 0.12 * (1 - k / 0.05);
  }
};
// Water lapping at the quay, a bell buoy, a ship's horn across the harbour.
AMBIENCE.bond_port = (d, sr, R) => {
  const lo = lowpass(R, 0.03);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] += lo() * 1.6 * (0.4 + 0.6 * Math.abs(Math.sin((t * Math.PI * 3) / 8)));
    for (const t0 of [1.3, 5.3]) {
      const e = t - t0;
      if (e > 0 && e < 2.5)
        d[i] += Math.exp(-e * 2.2) * (Math.sin(2 * Math.PI * 520 * e) * 0.05 + Math.sin(2 * Math.PI * 1310 * e) * 0.02);
    }
    if (t > 3 && t < 5.4) {
      const e = Math.min(1, (t - 3) * 3, (5.4 - t) * 3);
      d[i] +=
        e *
        0.04 *
        (Math.sin(2 * Math.PI * 92 * t) +
          0.5 * Math.sin(2 * Math.PI * 184 * t) +
          0.25 * Math.sin(2 * Math.PI * 276 * t));
    }
  }
};
// The volcano's rumble, the base's machinery humming, lava bubbling, the
// klaxon now and then.
AMBIENCE.bond_lair = (d, sr, R) => {
  const lo = lowpass(R, 0.004);
  const pops = Array.from({ length: 14 }, () => [R() * 7.6, 60 + R() * 80]);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    d[i] += lo() * 6 + Math.sin(2 * Math.PI * 50 * t) * 0.025 + Math.sin(2 * Math.PI * 100 * t) * 0.012;
    for (const [t0, hz] of pops) {
      const e = t - t0;
      if (e > 0 && e < 0.12) d[i] += Math.sin(2 * Math.PI * hz * (1 + e * 6) * e) * 0.12 * (1 - e / 0.12);
    }
    if (t > 6 && t < 7.6) d[i] += Math.sign(Math.sin(2 * Math.PI * (Math.floor(t * 4) % 2 ? 440 : 554) * t)) * 0.025;
  }
};
// Wind on the launch site, the rocket venting, the countdown's beeps.
AMBIENCE.bond_count = (d, sr, R) => {
  const lo = lowpass(R, 0.02);
  const hi = lowpass(R, 0.5);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const a = lo();
    d[i] += a * 1.4 + (hi() - a) * 0.12;
    if (t % 1 < 0.12) d[i] += Math.sin(2 * Math.PI * 1000 * t) * 0.05;
  }
};

// ---- The campaign ------------------------------------------------------------------

export const BOND = {
  name: "SPY NIGHT",
  first: "Agent: the Mastermind's men are in his casino",
  kinds,
  levels: [
    {
      world: "bond_ski",
      name: "THE SKI CHASE",
      story: "He's fled to the mountains. His men are on skis",
      music: "bond",
      amb: "bond_snow",
      legend: "SKIERS 50 · SNOWMOBILES 75 · GRENADES: SHOOT THEM BEFORE THEY LAND · DON'T SHOOT THE TOURISTS",
      wave: skiWave,
      title: (w, x2) => (x2 ? "THEY'RE ALL COMING DOWN · DOUBLE POINTS" : null)
    },
    {
      world: "bond_harbour",
      name: "THE HARBOUR",
      story: "His yacht is in the harbour. Our contact is aboard",
      music: "",
      amb: "bond_port",
      legend: "BOATS 75 · DIVERS AND MINES: SHOOT THEM BEFORE THEY GET YOU · DON'T SHOOT OUR CONTACT",
      wave: harbourWave,
      title: (w, x2) => (x2 ? "THEY'RE MAKING A RUN FOR IT · DOUBLE POINTS" : null)
    },
    {
      world: "bond_volcano",
      name: "THE VOLCANO BASE",
      story: "Inside the volcano. His rocket is fuelling",
      music: "",
      amb: "bond_lair",
      indoor: true,
      legend: "GUARDS 50 · LAVA BOMBS 25 · STOP THEM REACHING YOU · DON'T SHOOT THE SCIENTISTS",
      wave: lairWave,
      title: (w, x2) => (x2 ? "THE ALARM IS UP · DOUBLE POINTS" : null)
    },
    {
      world: "bond_launch",
      name: "THE LAUNCH",
      story: "The countdown has started. Stop the Mastermind",
      music: "bond",
      amb: "bond_count",
      legend: "MASTERMIND 250 · RUNNING 300 · SATELLITES AND MISSILES 50 · DRONES 25 · DON'T SHOOT THE SCIENTISTS",
      wave: launchWave,
      title: (w, x2) => (x2 ? "THE FINAL ASSAULT · DOUBLE POINTS" : countdown(w))
    }
  ],
  done: ["THE MASTERMIND IS FINISHED", "THE WORLD IS SAFE, AGENT"]
};
