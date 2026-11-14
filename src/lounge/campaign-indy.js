import * as THREE from "three";
import {
  GROUND,
  BOX,
  CYL,
  BALL,
  CONE,
  TORUS,
  SLAB,
  GEO,
  WORLDS,
  CARDS,
  CARD_SIZE,
  AMBIENCE,
  part,
  merge
} from "./shoots-art";
import { LAYOUTS, PERSON, PLATE_SOUND, SHATTER } from "./plates";
import { SHAPES } from "./plates-shapes";
import { bird, gunman, runner, thing, DONT, cross, toss, run, pick, flyers } from "./shoot-paths";
import { painter, arms, legs, kit, asGeo, rush, lobbed, skim, sheet } from "./campaign-kit";

// The Indiana Jones campaign (Jay, 2026-10-31: "build an indianna jones
// set"). Ten levels (with campaign-indy-more.js, played between the Well of
// Souls and the Grail):
//   1 PERU             the temple in the jungle: Hovitos in the trees, the
//                      golden idol on its altar, the boulder rolling out at
//                      you, blowgun darts, tarantulas, Jock's seaplane
//   2 NEPAL            the Raven, Marion's bar, at night in the snow:
//                      Toht's men, the drinking contest's glasses, the fire
//   3 CAIRO            the market: stalls, baskets, the swordsman, thugs,
//                      soldiers, pots thrown, the monkey on the roofs
//   4 THE WELL OF SOULS snakes on the floor and in the air, mummies in the
//                      walls, Anubis either side, the Ark at the back
//  10 THE GRAIL TEMPLE in the canyon of the crescent moon: the knight, the
//                      cups (choose wisely: never the plain one), Donovan
// Laid out as the other worlds are; shoots-art moves it all SHIFT m back and
// onto the lifted land. Plain guns here, no blasters.

export const G = GROUND;

// ---- People -------------------------------------------------------------------

const SKIN = "#e0b48a";
const face = (p, x = 50, y = 26, skin = SKIN, o = {}) => {
  p.ell(x, y, 12, 14, skin);
  p.ell(x - 5, y, 1.6, 1.6, "#2a1a10", 0);
  p.ell(x + 5, y, 1.6, 1.6, "#2a1a10", 0);
  if (o.tache) p.line([x - 5, y + 7, x + 5, y + 7], 2.2, o.hair || "#3a2414");
  else p.line([x - 4, y + 7, x + 4, y + 7], 1.3, "#8a4a3a");
  if (o.beard) p.poly([x - 11, y + 2, x + 11, y + 2, x + 8, y + 15, x, y + 19, x - 8, y + 15], o.beard, 1.2);
  if (o.glasses) {
    p.ell(x - 5, y, 3.4, 3.4, "rgba(220,230,240,0.35)", 1);
    p.ell(x + 5, y, 3.4, 3.4, "rgba(220,230,240,0.35)", 1);
  }
};
const fedora = (p, c, band = "#2a1a10", x = 50, y = 14) => {
  p.poly([x - 21, y + 2, x + 21, y + 2, x + 17, y + 6, x - 17, y + 6], c);
  p.poly([x - 11, y + 2, x - 10, y - 9, x - 3, y - 12, x, y - 8, x + 3, y - 12, x + 10, y - 9, x + 11, y + 2], c);
  p.poly([x - 11, y - 1, x + 11, y - 1, x + 11, y + 2, x - 11, y + 2], band, 1);
};
const coat = (p, c, o = {}) => {
  p.poly([28, 46, 72, 46, 74, o.long ? 160 : 108, 26, o.long ? 160 : 108], c);
  if (o.shirt) p.poly([42, 46, 58, 46, 55, 92, 45, 92], o.shirt, 1.2);
  if (o.tie) p.poly([48, 48, 52, 48, 53, 74, 50, 78, 47, 74], o.tie, 1);
  if (o.belt) p.poly([28, 94, 72, 94, 72, 100, 28, 100], o.belt, 1.2);
};
const helmet = (p, c = "#5a5e4e") => {
  // the coal-scuttle helmet: a dome and its flared skirt
  p.poly([30, 24, 34, 8, 44, 2, 56, 2, 66, 8, 70, 24, 74, 30, 64, 28, 36, 28, 26, 30], c);
  p.line([36, 22, 64, 22], 1.2, "#3a3e30");
};

Object.assign(CARDS, {
  indy: (c, W) => {
    const p = painter(c, W);
    legs(p, "#8a7a5a", "#4a3020");
    coat(p, "#5a3a22", { shirt: "#c8b890", belt: "#3a2414" });
    p.poly([60, 100, 72, 100, 72, 118, 62, 118], "#3a2414", 1.2);
    p.ell(30, 114, 7, 6, "rgba(0,0,0,0)", 3);
    arms(p, "#5a3a22", SKIN, { pistol: true });
    face(p, 50, 30, SKIN, { tache: false });
    p.line([40, 38, 60, 38], 2.5, "rgba(80,50,30,0.35)");
    fedora(p, "#6a4a2a", "#2a1a10", 50, 18);
  },
  soldier: (c, W) => {
    const p = painter(c, W);
    legs(p, "#6a6e5a", "#141414");
    p.poly([33, 150, 49, 150, 49, 196, 31, 196], "#141414");
    p.poly([51, 150, 67, 150, 69, 196, 51, 196], "#141414");
    coat(p, "#6a6e5a", { belt: "#1a1a1a" });
    for (const y of [56, 68, 80]) p.ell(50, y, 1.6, 1.6, "#c8c8b0", 0.6);
    arms(p, "#6a6e5a", SKIN, { rifle: true, gun: "#3a2a1a" });
    face(p, 50, 32);
    helmet(p);
  },
  colonel: (c, W) => {
    const p = painter(c, W);
    legs(p, "#5a5e4e", "#141414");
    p.poly([33, 140, 49, 140, 49, 196, 31, 196], "#141414");
    p.poly([51, 140, 67, 140, 69, 196, 51, 196], "#141414");
    coat(p, "#7a7e6a", { belt: "#2a1a10", shirt: "#e8e4d8", tie: "#2a2a2a" });
    arms(p, "#7a7e6a", SKIN, { pistol: true });
    face(p, 50, 30);
    p.poly([34, 18, 66, 18, 70, 12, 64, 4, 36, 4, 30, 12], "#7a7e6a");
    p.poly([32, 18, 68, 18, 66, 22, 34, 22], "#141414", 1.2);
    p.ell(50, 10, 3, 2.4, "#c8c8b0", 0.6);
  },
  toht: (c, W) => {
    const p = painter(c, W);
    p.poly([33, 160, 49, 160, 49, 196, 31, 196], "#141414");
    p.poly([51, 160, 67, 160, 69, 196, 51, 196], "#141414");
    coat(p, "#1a1a1c", { long: true, belt: "#0a0a0a" });
    p.line([50, 48, 50, 160], 1.4, "#3a3a3e");
    arms(p, "#1a1a1c", "#141414", { pistol: true });
    face(p, 50, 30, "#e8c8a8", { glasses: true });
    fedora(p, "#1a1a1c", "#0a0a0a", 50, 18);
  },
  belloq: (c, W) => {
    const p = painter(c, W);
    legs(p, "#ece6d6", "#8a6a4a");
    coat(p, "#ece6d6", { shirt: "#f8f6f0", tie: "#8a6a4a" });
    arms(p, "#ece6d6", "#d8a878");
    face(p, 50, 30, "#d8a878", { beard: "#3a2a1a" });
    fedora(p, "#e8e0cc", "#5a4030", 50, 18);
  },
  hovito: (c, W) => {
    const p = painter(c, W);
    const skin = "#8a5a36";
    p.poly([34, 104, 48, 104, 47, 194, 35, 194], skin);
    p.poly([52, 104, 66, 104, 65, 194, 53, 194], skin);
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], skin);
    for (const y of [60, 66, 72]) p.line([36, y, 64, y], 1.6, "#f0e8d8");
    p.poly([30, 96, 70, 96, 64, 128, 36, 128], "#c8a04a");
    p.poly([19, 56, 29, 56, 30, 104, 21, 104], skin);
    p.poly([71, 56, 81, 56, 79, 104, 70, 104], skin);
    // the spear, the feathers, the white paint
    p.line([82, 196, 86, 10], 3, "#6a4a2a");
    p.poly([82, 12, 86, -4, 90, 12], "#c8c8c0", 1.2);
    p.ell(50, 28, 12, 14, skin);
    p.line([42, 24, 58, 24], 2, "#f0e8d8");
    p.line([44, 32, 56, 32], 1.5, "#f0e8d8");
    p.ell(45, 27, 1.6, 1.6, "#1a1a1a", 0);
    p.ell(55, 27, 1.6, 1.6, "#1a1a1a", 0);
    for (let k = -3; k <= 3; k++)
      p.line([50 + k * 4, 16, 50 + k * 7, 0], 3, ["#e8344a", "#f2c230", "#2f8a5a"][Math.abs(k) % 3]);
  },
  swordsman: (c, W) => {
    const p = painter(c, W);
    p.poly([26, 44, 74, 44, 80, 196, 20, 196], "#141414");
    p.poly([32, 94, 68, 94, 68, 100, 32, 100], "#8a1a1a", 1.2);
    p.poly([16, 52, 28, 46, 32, 110, 20, 112], "#141414");
    p.poly([72, 46, 84, 52, 78, 80, 68, 76], "#141414");
    // the scimitar, raised
    p.line([76, 78, 84, 50, 88, 26, 86, 8], 4.5, "#d8dce4");
    p.line([74, 82, 80, 74], 4, "#c8a040");
    p.ell(76, 78, 4, 4, "#8a5a3a", 1.5);
    p.ell(50, 28, 12, 14, "#8a5a3a");
    p.poly([38, 34, 62, 34, 60, 46, 40, 46], "#141414", 1);
    p.ell(45, 27, 1.8, 1.4, "#f0e8d8", 0);
    p.ell(55, 27, 1.8, 1.4, "#f0e8d8", 0);
    p.poly([36, 22, 38, 8, 50, 4, 62, 8, 64, 22], "#141414");
  },
  thug: (c, W) => {
    const p = painter(c, W);
    p.poly([28, 44, 72, 44, 76, 196, 24, 196], "#d8ccb0");
    p.poly([30, 94, 70, 94, 70, 100, 30, 100], "#5a3a22", 1.2);
    arms(p, "#d8ccb0", "#9a6a46", { pistol: false });
    p.line([75, 108, 86, 96], 3, "#d8dce4");
    face(p, 50, 28, "#9a6a46", { tache: true, hair: "#1a1a1a" });
    p.poly([40, 16, 41, 6, 59, 6, 60, 16], "#c0182a");
    p.line([58, 6, 62, 14], 1.5, "#141414");
  },
  mongol: (c, W) => {
    const p = painter(c, W);
    legs(p, "#4a3a2a", "#2a1a10");
    coat(p, "#6a4a32", { belt: "#2a1a10" });
    p.poly([26, 46, 74, 46, 72, 56, 28, 56], "#9a7a5a", 1.2);
    arms(p, "#6a4a32", "#c89868", { pistol: true });
    face(p, 50, 30, "#c89868", { tache: true, hair: "#1a1a1a" });
    p.poly([34, 20, 34, 6, 50, 2, 66, 6, 66, 20], "#7a5a3a");
    p.poly([32, 20, 68, 20, 68, 24, 32, 24], "#a8885a", 1.2);
  },
  marion: (c, W) => {
    const p = painter(c, W);
    legs(p, "#a8946a", "#5a3a22");
    coat(p, "#f4f0e6", { belt: "#5a3a22" });
    arms(p, "#f4f0e6", SKIN);
    face(p, 50, 30);
    p.poly([36, 30, 37, 14, 50, 10, 63, 14, 64, 30, 60, 20, 40, 20], "#6a3a1a", 1.4);
  },
  sallah: (c, W) => {
    const p = painter(c, W);
    p.poly([26, 44, 74, 44, 78, 196, 22, 196], "#e8e0d0");
    for (const x of [36, 46, 56, 66]) p.line([x, 50, x + 2, 194], 1.6, "#8a6a4a");
    arms(p, "#e8e0d0", "#a87a52");
    face(p, 50, 30, "#a87a52", { beard: "#2a1a10" });
    p.poly([39, 18, 40, 6, 60, 6, 61, 18], "#c0182a");
  },
  shorty: (c, W) => {
    const p = painter(c, W);
    // (100 x 180) a boy: shorts, a cap back to front
    p.poly([36, 120, 48, 120, 47, 172, 37, 172], "#d8b890");
    p.poly([52, 120, 64, 120, 63, 172, 53, 172], "#d8b890");
    p.poly([34, 100, 66, 100, 66, 126, 34, 126], "#5a4a3a");
    p.poly([30, 56, 70, 56, 68, 104, 32, 104], "#e8e4d8");
    p.poly([20, 62, 30, 58, 30, 100, 22, 100], "#e8e4d8");
    p.poly([70, 58, 80, 62, 78, 100, 70, 100], "#e8e4d8");
    face(p, 50, 40, "#e0b890");
    p.poly([38, 32, 40, 22, 60, 22, 62, 32], "#2a4a8a");
    p.poly([38, 30, 30, 34, 38, 34], "#2a4a8a", 1);
  },
  willie: (c, W) => {
    const p = painter(c, W);
    p.poly([30, 46, 70, 46, 78, 196, 22, 196], "#e8c050");
    for (let k = 0; k < 30; k++) p.ell(30 + ((k * 37) % 44), 54 + ((k * 53) % 140), 1, 1, "#fff8c0", 0);
    p.poly([20, 54, 30, 50, 32, 104, 24, 106], SKIN);
    p.poly([70, 50, 80, 54, 76, 106, 68, 104], SKIN);
    face(p, 50, 30);
    p.poly([36, 32, 37, 14, 50, 10, 63, 14, 64, 32, 60, 20, 40, 20], "#f0d070", 1.4);
  },
  henry: (c, W) => {
    const p = painter(c, W);
    legs(p, "#6a5a48", "#3a2a1a");
    coat(p, "#7a6a52", { shirt: "#f0ece0", tie: "#5a2a2a" });
    arms(p, "#7a6a52", SKIN);
    face(p, 50, 30, SKIN, { beard: "#d8d4cc", glasses: true });
    fedora(p, "#6a5a48", "#3a2a1a", 50, 18);
  },
  knight: (c, W) => {
    const p = painter(c, W);
    p.poly([34, 104, 48, 104, 47, 194, 35, 194], "#9aa0a8");
    p.poly([52, 104, 66, 104, 65, 194, 53, 194], "#9aa0a8");
    p.poly([26, 46, 74, 46, 76, 150, 24, 150], "#f0ece4");
    p.poly([46, 56, 54, 56, 54, 100, 46, 100], "#c0182a", 0);
    p.poly([36, 72, 64, 72, 64, 80, 36, 80], "#c0182a", 0);
    p.poly([19, 52, 29, 50, 30, 104, 21, 104], "#9aa0a8");
    p.poly([71, 50, 81, 52, 79, 104, 70, 104], "#9aa0a8");
    face(p, 50, 30, SKIN, { beard: "#f4f2ee" });
    p.poly([36, 22, 38, 12, 50, 8, 62, 12, 64, 22, 58, 18, 42, 18], "#f4f2ee", 1.4);
  },
  thuggee: (c, W) => {
    const p = painter(c, W);
    const skin = "#8a5a3a";
    p.poly([32, 100, 68, 100, 72, 160, 28, 160], "#e8e0cc");
    p.poly([34, 160, 48, 160, 47, 194, 35, 194], skin);
    p.poly([52, 160, 66, 160, 65, 194, 53, 194], skin);
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], skin);
    p.line([30, 50, 70, 100], 6, "#c0182a");
    p.poly([19, 56, 29, 56, 30, 104, 21, 104], skin);
    p.poly([71, 56, 81, 56, 72, 82, 64, 78], skin);
    p.line([68, 80, 90, 30], 4, "#d8dce4");
    face(p, 50, 30, skin, { tache: true, hair: "#141414" });
    p.poly([36, 22, 37, 8, 50, 4, 63, 8, 64, 22], "#1a1a1a");
  },
  molaram: (c, W) => {
    const p = painter(c, W);
    const skin = "#8a5a3a";
    p.poly([26, 44, 74, 44, 80, 196, 20, 196], "#8a1a1a");
    p.poly([38, 46, 62, 46, 60, 100, 40, 100], skin);
    for (const y of [56, 64, 72]) p.line([42, y, 58, y], 1.4, "#f0e8d8");
    p.poly([14, 44, 28, 42, 34, 70, 18, 74], "#8a1a1a");
    p.poly([72, 42, 86, 44, 82, 74, 66, 70], "#8a1a1a");
    p.ell(26, 76, 5, 5, skin, 1.5);
    p.ell(74, 76, 5, 5, skin, 1.5);
    face(p, 50, 32, skin);
    p.line([42, 26, 58, 26], 2, "#c0182a");
    // the headdress: a skull, the horns of a bull
    p.line([30, 18, 18, 8, 12, -4], 5, "#e8dcc0");
    p.line([70, 18, 82, 8, 88, -4], 5, "#e8dcc0");
    p.ell(50, 12, 10, 9, "#e8dcc0");
    p.ell(46, 12, 2.4, 2.4, "#1a1a1a", 0);
    p.ell(54, 12, 2.4, 2.4, "#1a1a1a", 0);
    for (let k = -2; k <= 2; k++) p.line([50 + k * 6, 4, 50 + k * 9, -6], 2.5, "#c0182a");
  },
  mechanic: (c, W) => {
    const p = painter(c, W);
    const skin = "#e8c09a";
    p.poly([30, 110, 48, 110, 47, 194, 31, 194], "#4a4a52");
    p.poly([52, 110, 70, 110, 69, 194, 53, 194], "#4a4a52");
    p.poly([24, 44, 76, 44, 72, 112, 28, 112], "#f0ece4");
    p.poly([10, 46, 26, 44, 30, 108, 14, 110], skin);
    p.poly([74, 44, 90, 46, 86, 110, 70, 108], skin);
    p.ell(20, 114, 7, 7, skin, 1.5);
    p.ell(80, 114, 7, 7, skin, 1.5);
    p.ell(50, 26, 15, 16, skin);
    p.ell(44, 26, 1.8, 1.8, "#1a1a1a", 0);
    p.ell(56, 26, 1.8, 1.8, "#1a1a1a", 0);
    p.line([43, 35, 57, 35], 1.6, "#8a4a3a");
    p.ell(48, 14, 6, 3, "rgba(255,255,255,0.3)", 0);
  },
  mummy: (c, W) => {
    const p = painter(c, W);
    const w = "#c8bca0";
    legs(p, w, w);
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], w);
    p.poly([19, 56, 29, 52, 22, 20, 14, 22], w);
    p.poly([71, 52, 81, 56, 86, 22, 78, 20], w);
    for (let y = 50; y < 190; y += 7) p.line([30, y, 70, y + 3], 1.2, "#8a7e64");
    p.ell(50, 28, 12, 14, w);
    for (let y = 18; y < 40; y += 5) p.line([38, y, 62, y + 2], 1.2, "#8a7e64");
    p.ell(45, 27, 2.2, 1.6, "#1a1a1a", 0);
    p.ell(55, 27, 2.2, 1.6, "#1a1a1a", 0);
  },
  donovan: (c, W) => {
    const p = painter(c, W);
    legs(p, "#3a4a5a", "#1a1a1a");
    coat(p, "#4a5a6a", { shirt: "#f4f0e8", tie: "#8a2a2a" });
    arms(p, "#4a5a6a", SKIN, { pistol: true });
    face(p, 50, 30);
    p.poly([38, 20, 40, 12, 50, 10, 60, 12, 62, 20, 56, 16, 44, 16], "#8a8a8a", 1.4);
  }
});
const PEOPLE = {
  indy: [0.9, 1.8],
  soldier: [0.9, 1.8],
  colonel: [0.9, 1.8],
  toht: [0.9, 1.8],
  belloq: [0.9, 1.8],
  hovito: [0.9, 1.8],
  swordsman: [0.95, 1.9],
  thug: [0.9, 1.8],
  mongol: [0.9, 1.8],
  marion: [0.85, 1.7],
  sallah: [0.95, 1.9],
  shorty: [0.62, 1.12],
  willie: [0.85, 1.7],
  henry: [0.9, 1.8],
  knight: [0.9, 1.8],
  thuggee: [0.9, 1.8],
  molaram: [0.95, 1.9],
  mechanic: [1.15, 2.1],
  mummy: [0.9, 1.8],
  donovan: [0.9, 1.8]
};
Object.assign(CARD_SIZE, PEOPLE);
for (const k of Object.keys(PEOPLE)) PERSON.add(k);

// ---- Outlines (the plates' atlas) ------------------------------------------------

export const ring = (cx, cy, r, n = 20, sx = 1) =>
  Array.from({ length: n }, (_, k) => [
    cx + r * sx * Math.cos((k / n) * 2 * Math.PI),
    cy + r * Math.sin((k / n) * 2 * Math.PI)
  ]).flat();
Object.assign(SHAPES, {
  // the golden fertility idol
  idol: {
    polys: [
      [
        30, 0, 50, 0, 58, 10, 58, 30, 52, 38, 62, 48, 64, 70, 56, 92, 60, 110, 20, 110, 24, 92, 16, 70, 18, 48, 28, 38,
        22, 30, 22, 10
      ]
    ],
    marks: [
      [3, 30, 18, 36, 18],
      [3, 44, 18, 50, 18],
      [2.5, 34, 28, 46, 28],
      [2.5, 26, 60, 54, 60],
      [2, 30, 92, 50, 92]
    ]
  },
  // a snake, slithering, its head to the left
  snake: {
    lines: [[9, 12, 22, 26, 14, 42, 24, 58, 16, 74, 26, 90, 18, 104, 26, 118, 24]],
    polys: [[0, 20, 8, 14, 18, 16, 20, 26, 8, 28]],
    dots: [[8, 19, 1.8]]
  },
  // a cobra, reared, hood spread
  cobra: {
    polys: [
      [26, 0, 38, 0, 50, 10, 54, 30, 46, 48, 40, 52, 44, 70, 38, 90, 28, 90, 24, 70, 28, 52, 22, 48, 14, 30, 18, 10],
      [10, 90, 60, 90, 66, 100, 4, 100]
    ],
    marks: [
      [2.5, 26, 24, 40, 24],
      [2, 32, 32, 32, 46]
    ],
    dots: [
      [28, 14, 2.5],
      [38, 14, 2.5]
    ]
  },
  tarantula: {
    polys: [ring(40, 30, 14, 16, 1.3), ring(40, 14, 9, 14)],
    lines: [
      [4, 26, 26, 8, 14, 0, 30],
      [4, 26, 32, 6, 34, 2, 50],
      [4, 28, 38, 14, 50, 12, 62],
      [4, 32, 40, 26, 56, 26, 66],
      [4, 54, 26, 72, 14, 80, 30],
      [4, 54, 32, 74, 34, 78, 50],
      [4, 52, 38, 66, 50, 68, 62],
      [4, 48, 40, 54, 56, 54, 66]
    ],
    dots: [
      [36, 10, 1.8],
      [44, 10, 1.8]
    ]
  },
  scarab: {
    polys: [ring(40, 40, 24, 18, 0.8), ring(40, 12, 10, 12)],
    marks: [[3, 40, 18, 40, 62]],
    lines: [
      [4, 22, 30, 6, 22],
      [4, 22, 44, 4, 48],
      [4, 24, 56, 10, 68],
      [4, 58, 30, 74, 22],
      [4, 58, 44, 76, 48],
      [4, 56, 56, 70, 68]
    ]
  },
  // a jewelled cup (the false grails)
  cup: {
    polys: [
      [4, 0, 56, 0, 54, 18, 44, 34, 34, 40, 34, 62, 48, 70, 50, 78, 10, 78, 12, 70, 26, 62, 26, 40, 16, 34, 6, 18]
    ],
    marks: [[3, 8, 10, 52, 10]],
    dots: [
      [20, 20, 3],
      [30, 22, 3],
      [40, 20, 3],
      [30, 70, 2.5]
    ]
  },
  // the Sankara stone
  stone: {
    polys: [[10, 0, 44, 0, 56, 14, 56, 60, 44, 74, 10, 74, -2, 60, -2, 14]],
    marks: [
      [3, 12, 22, 42, 22],
      [3, 12, 37, 42, 37],
      [3, 12, 52, 42, 52]
    ]
  },
  // a mine cart with a guard in it, facing left
  cart: {
    polys: [
      [0, 30, 70, 30, 64, 64, 6, 64],
      [24, 0, 40, 0, 44, 30, 22, 30],
      [26, -14, 38, -14, 40, -4, 38, 0, 26, 0, 24, -6]
    ],
    lines: [[4, 30, 8, 8, 18]],
    dots: [
      [16, 66, 6],
      [54, 66, 6]
    ],
    marks: [[2, 4, 40, 66, 40]]
  },
  // an army truck, a canvas tilt over its back, facing left
  truck: {
    polys: [
      [0, 40, 6, 26, 22, 24, 30, 10, 46, 10, 48, 40, 150, 40, 150, 64, 0, 64],
      [48, 0, 150, 0, 150, 40, 48, 40]
    ],
    marks: [
      [2.5, 70, 2, 70, 38],
      [2.5, 100, 2, 100, 38],
      [2.5, 128, 2, 128, 38],
      [3, 32, 14, 32, 24]
    ],
    dots: [
      [22, 66, 10],
      [104, 66, 10],
      [130, 66, 10]
    ]
  },
  // a motorcycle and sidecar, two soldiers, facing left
  sidecar: {
    polys: [
      [0, 40, 20, 30, 70, 30, 76, 46, 4, 50],
      [40, 4, 52, 4, 56, 30, 38, 30],
      [64, 12, 76, 12, 78, 32, 62, 32],
      [40, -8, 52, -8, 54, 4, 38, 4],
      [64, 0, 76, 0, 78, 12, 62, 12]
    ],
    dots: [
      [12, 52, 9],
      [62, 52, 9]
    ]
  },
  // a camel (and its rider), facing left
  camel: {
    polys: [
      [30, 30, 46, 16, 60, 26, 72, 14, 90, 28, 96, 46, 30, 50],
      [30, 34, 18, 12, 6, 8, 0, 14, 12, 20, 22, 40],
      [56, -10, 68, -10, 70, 18, 54, 20]
    ],
    lines: [
      [6, 38, 48, 36, 86],
      [6, 48, 48, 50, 86],
      [6, 80, 46, 78, 86],
      [6, 90, 46, 92, 86]
    ],
    dots: [[6, 11, 1.6]]
  }
});
SHATTER.add("cup");
Object.assign(PLATE_SOUND, {
  idol: "bell",
  cup: "bell",
  snake: "hiss",
  cobra: "hiss",
  stone: "gong",
  tarantula: "splat",
  scarab: "clank"
});

// ---- Thrown, rolled and flown things -----------------------------------------------

const ROCK = 0x9a8a72;
// The boulder (2 m across, lumpy).
GEO.boulder = () => {
  const g = new THREE.IcosahedronGeometry(1.15, 2);
  const pos = g.attributes.position;
  let a = 3;
  for (let k = 0; k < pos.count; k++) {
    a = (a * 16807) % 2147483647;
    const s = 1 + (a / 2147483647 - 0.5) * 0.16;
    pos.setXYZ(k, pos.getX(k) * s, pos.getY(k) * s, pos.getZ(k) * s);
  }
  g.computeVertexNormals();
  return merge([part(g, ROCK)]);
};
GEO.dart = () =>
  merge([
    part(CYL(0.012, 0.004, 0.32, 5), 0x5a4a2a, 0, 0, 0, Math.PI / 2),
    part(CONE(0.035, 0.08, 6), 0xe8344a, 0, 0, 0.17, -Math.PI / 2)
  ]);
GEO.pot = () =>
  merge([
    part(BALL(0.17, 10), 0xc87a4a, 0, 0, 0, 0, 0, 0, 1, 0.9, 1),
    part(CYL(0.07, 0.1, 0.1, 10), 0xc87a4a, 0, 0.17, 0),
    part(TORUS(0.17, 0.015, 14), 0x8a4a2a, 0, 0.02, 0, Math.PI / 2)
  ]);
GEO.torch = () =>
  merge([
    part(CYL(0.025, 0.03, 0.45, 5), 0x5a3a20, 0, 0, 0),
    part(CONE(0.07, 0.18, 6), 0xff8a2a, 0, 0.3, 0),
    part(BALL(0.05, 5), 0xffe27a, 0, 0.26, 0)
  ]);
// A fighter (single engine, low wing), its nose to -z.
export function fighter(add, c = 0x8a8e7a) {
  add(CYL(0.32, 0.2, 3.4, 8), c, 0, 0, 0, Math.PI / 2);
  add(CONE(0.32, 0.5, 8), 0x3a3a3a, 0, 0, -1.95, -Math.PI / 2);
  add(BOX(0.06, 1.4, 0.12), 0x2a2a2a, 0, 0, -2.25, 0, 0, 0.6);
  add(BOX(4.4, 0.08, 0.9), c, 0, -0.12, -0.3);
  add(BOX(1.5, 0.06, 0.5), c, 0, 0.05, 1.5);
  add(BOX(0.06, 0.6, 0.5), c, 0, 0.3, 1.5);
  add(BOX(0.4, 0.3, 0.7), 0x6a8a9a, 0, 0.3, -0.5);
  for (const s of [-1, 1]) add(BOX(0.5, 0.09, 0.5), 0xe8e4d8, s * 1.6, -0.1, -0.3);
}
GEO.fighter = asGeo(add => fighter(add));
// A tank (its gun forward, -z).
export function tank(add, c = 0x6a6e5a) {
  add(BOX(3.0, 1.0, 5.4), c, 0, 0.9, 0);
  for (const s of [-1, 1]) {
    add(BOX(0.7, 1.0, 5.8), 0x3a3a34, s * 1.65, 0.5, 0);
    for (let k = 0; k < 5; k++)
      add(CYL(0.36, 0.36, 0.72, 10), 0x2a2a26, s * 1.65, 0.42, -2.2 + k * 1.1, 0, 0, Math.PI / 2);
  }
  add(BOX(1.9, 0.8, 2.4), c, 0, 1.8, 0.3);
  add(CYL(0.12, 0.14, 3.0, 8), 0x4a4e42, 0, 1.8, -2.4, Math.PI / 2);
  add(BOX(0.6, 0.6, 0.4), c, 0.95, 1.4, -2.6);
  add(CYL(0.06, 0.06, 1.0, 6), 0x2a2a2a, 0.95, 1.4, -3.2, Math.PI / 2);
}
GEO.tank = asGeo(add => tank(add));

// ---- Kinds ------------------------------------------------------------------------

// Men on the move: cut-outs like the saloon's gunmen; one that gets to its
// spot stops and fires (it costs everyone up there 10).
export const mover = (cardKey, h = 1.8, extra = {}) => ({ ...gunman(cardKey, h), arrive: "pistol", ...extra });
export const friend = (cardKey, name, h = 1.8) => ({
  ...gunman(cardKey, h),
  pts: -25,
  sound: "wrong",
  ...DONT,
  name,
  arrive: undefined
});
export const base = {
  soldierRun: mover("soldier", 1.8, { arrive: "rifle" }),
  colonelRun: mover("colonel", 1.8, { pts: 75 }),
  tohtRun: mover("toht", 1.8, { pts: 150, name: "TOHT · 150" }),
  belloqRun: mover("belloq", 1.8, { pts: 200, name: "BELLOQ · 200" }),
  hovitoRun: { ...mover("hovito"), arrive: "thud", lose: "SPEARED!" },
  swordsmanRun: {
    ...mover("swordsman", 1.9),
    pts: 100,
    arrive: "thud",
    lose: "THE SWORDSMAN!",
    name: "THE SWORDSMAN · 100"
  },
  thugRun: mover("thug"),
  mongolRun: mover("mongol"),
  mummyRun: { ...mover("mummy"), arrive: "roar", lose: "MUMMY!" },
  donovanRun: mover("donovan", 1.8, { pts: 250, name: "DONOVAN · 250" }),
  indyRun: friend("indy", "THAT'S INDY! DON'T SHOOT!"),
  marionRun: friend("marion", "DON'T SHOOT MARION!", 1.7),
  sallahRun: friend("sallah", "DON'T SHOOT SALLAH!", 1.9),
  henryRun: friend("henry", "DON'T SHOOT DAD!"),
  monkey: {
    ...runner("monkey", 0xa87a4a, 0.75, 0.35, "squeak"),
    pts: -25,
    ...DONT,
    name: "BAD DATES! DON'T SHOOT THE MONKEY!"
  },
  snake: { ...runner("snake", 0x6a8a3a, 0.45, 0.4, "hiss"), pts: 50 },
  camel: { ...runner("camel", 0xc8a070, 2.6, 0.9, "thud"), pts: 50 },
  truck: { ...runner("truck", 0x7a7e6a, 2.6, 1.3, "boom"), pts: 75, boom: 3, hy: 1.2 },
  sidecar: { ...runner("sidecar", 0x6a6e5a, 1.6, 0.8, "boom"), pts: 75, boom: 2, hy: 0.7 },
  rider: { ...runner("rider", 0x8a6a4a, 2.4, 0.8, "thud"), hy: 1.4 },
  cart: { ...runner("cart", 0x9a8a72, 1.6, 0.7, "clank"), pts: 75, hy: 0.6 },
  bat: bird("boar_bat", 25, 0.25, "chirp"),
  vulture: bird("vulture", 5, 0.7, "caw"),
  pigeon: bird("pigeon", 25, 0.3, "chirp"),
  // the boulder rolling out at you: shoot it to bits before it gets here
  boulder: {
    ...thing("boulder", 0, 100, 1.15, "shatter", "tumble", "boom"),
    hy: 1.15,
    boom: 3,
    arrive: "boom",
    penalty: 10,
    lose: "THE BOULDER! RUN!",
    name: "THE BOULDER! · 100"
  },
  dart: { ...thing("dart", 0, 25, 0.18, "shatter", "level", "clank"), arrive: "thud", lose: "DART!" },
  pot: thing("pot", 0, 25, 0.2, "shatter", "tumble", "splat"),
  torch: thing("torch", 0, 25, 0.2, "shatter", "tumble", "thud"),
  fighter: { ...thing("fighter", 0, 50, 1.4, "shatter", "fly", "boom"), boom: 3, name: "FIGHTER · 50" },
  tank: { ...thing("tank", 0, 150, 1.6, "shatter", "level", "boom"), hy: 1.5, boom: 6, name: "THE TANK · 150" },
  grenade: {
    ...thing("hostage_grenade", 0, 25, 0.12, "shatter", "tumble", "clank"),
    arrive: "shot",
    blast: true,
    lose: "BOOM!"
  },
  macaw: bird("safari_macaw", 25, 0.3, "chirp"),
  bottle: { ...thing("whiskey", 0, 25, 0.17, "shatter", "tumble", "glass"), hy: 0.15 }
};
// (all of them "i_": the other shoots have their own vulture, rider, pigeon)
export const kinds = Object.fromEntries(Object.entries(base).map(([k, v]) => [`i_${k}`, v]));

// ---- Sound: a loop of the march (in the jungle, the chase, the finale) ----------

export function horn(d, sr, t0, hz, dur, amp) {
  const i0 = Math.floor(t0 * sr);
  const i1 = Math.min(d.length, Math.floor((t0 + dur + 0.1) * sr));
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / sr;
    const env = Math.min(1, t / 0.025) * (t < dur ? 1 - 0.2 * (t / dur) : Math.exp(-(t - dur) * 35));
    const w = 2 * Math.PI * hz * t * (1 + 0.004 * Math.sin(t * 31));
    let v = 0;
    for (let h = 1; h <= 6; h++) v += Math.sin(w * h) / (h * (h > 2 ? 1.5 : 1));
    d[i] += amp * env * v;
  }
}
export function drumHit(d, sr, t0, hz, amp, R) {
  const i0 = Math.floor(t0 * sr);
  const i1 = Math.min(d.length, Math.floor((t0 + 0.5) * sr));
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / sr;
    d[i] +=
      amp * Math.exp(-t * 8) * (Math.sin(2 * Math.PI * hz * (1 + 0.4 * Math.exp(-t * 25)) * t) + 0.2 * (R() * 2 - 1));
  }
}
// (the march's tune, four bars at 120, laid down twice for the 8 s loop)
export function raiders(d, sr, R, amp = 0.045) {
  const n = s => 329.63 * 2 ** (s / 12); // from E4
  const tune = [
    [0, 0, 0.36],
    [0.375, 1, 0.12],
    [0.5, 3, 0.45],
    [1, 8, 0.95],
    [2, -2, 0.36],
    [2.375, 0, 0.12],
    [2.5, 1, 1.4],
    [4, 3, 0.36],
    [4.375, 5, 0.12],
    [4.5, 7, 0.45],
    [5, 13, 0.95],
    [6, 5, 0.36],
    [6.375, 7, 0.12],
    [6.5, 8, 0.45],
    [7, 10, 0.45],
    [7.5, 12, 0.45]
  ];
  for (const off of [0, 8]) {
    for (const [t, s, dur] of tune) {
      horn(d, sr, t + off, n(s), dur, amp);
      horn(d, sr, t + off, n(s) / 2, dur, amp * 0.5);
    }
    for (let b = 0; b < 16; b++) drumHit(d, sr, off + b * 0.5, b % 2 ? 70 : 58, b % 4 === 0 ? 0.08 : 0.04, R);
  }
}
// Background bands of noise (wind, a crowd), and bird/insect chirps.
export function bed(d, sr, R, o) {
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const x = R() * 2 - 1;
    lp += 0.015 * (x - lp);
    lp2 += 0.2 * (x - lp2);
    let v = lp * (o.wind || 0) * (0.6 + 0.4 * Math.sin((t * 2 * Math.PI) / 8));
    if (o.crowd) v += (lp2 - lp) * o.crowd * (0.5 + 0.3 * Math.sin(t * 2.9) + 0.2 * Math.sin(t * 4.7));
    if (o.insects) v += Math.sin(2 * Math.PI * 4600 * t) * Math.max(0, Math.sin(t * 2 * Math.PI * 3)) ** 4 * o.insects;
    if (o.birds) {
      const y = (t * 0.7) % 2;
      if (y < 0.3)
        v += Math.sin(2 * Math.PI * (2400 + 900 * Math.sin(y * 70)) * t) * o.birds * Math.sin((Math.PI * y) / 0.3);
    }
    if (o.fire && R() < 0.0012) v += x * o.fire;
    if (o.hum) v += Math.sin(2 * Math.PI * o.hum[0] * t) * o.hum[1];
    if (o.hiss) v += (x - lp2) * o.hiss * (0.5 + 0.5 * Math.sin(t * 1.7));
    d[i] += v;
  }
}

// A plain clay cup (the Grail: choose wisely).
SHAPES.plaincup = {
  polys: [[6, 0, 50, 0, 46, 30, 36, 40, 34, 56, 44, 62, 44, 68, 12, 68, 12, 62, 22, 56, 20, 40, 10, 30]]
};
PLATE_SOUND.plaincup = "wrong";

// ---- Scenery pieces -------------------------------------------------------------

export function fern(P, u, f, s = 1, c = 0x3a6a2a) {
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    P.add(
      BOX(0.25 * s, 0.04, 1.4 * s),
      c,
      u + Math.cos(a) * 0.5 * s,
      G + 0.35 * s,
      f + Math.sin(a) * 0.5 * s,
      0.5,
      -a + Math.PI / 2,
      0
    );
  }
}
export function jungleTree(P, u, f, s = 1) {
  P.add(CYL(0.3 * s, 0.45 * s, 7 * s, 6), 0x5a4030, u, G + 3.5 * s, f);
  P.add(BALL(2.4 * s, 7), 0x2f5a26, u, G + 7.5 * s, f, 0, 0, 0, 1.3, 0.8, 1.3);
  P.add(BALL(1.8 * s, 7), 0x3a6a2e, u + 1.2 * s, G + 6.6 * s, f - 0.8 * s, 0, 0, 0, 1.2, 0.7, 1.2);
}
export function column(P, u, f, h, c = 0x9a8a72, broken = false) {
  P.add(BOX(1.1, 0.3, 1.1), c, u, G + 0.15, f);
  P.add(CYL(0.42, 0.45, h, 8), c, u, G + h / 2, f, broken ? 0.05 : 0, 0, broken ? 0.06 : 0);
  if (!broken) P.add(BOX(1.1, 0.35, 1.1), c, u, G + h + 0.17, f);
}
// An indoor room: floor, side walls, ceiling from FRONT to BACK, W either side.
export function room(P, R, o) {
  const len = R.BACK + 0.3 - R.FRONT;
  const mid = (R.FRONT + R.BACK + 0.3) / 2;
  P.add(SLAB(2 * R.W + 0.6, 0.06, len), o.floor, 0, G - 0.03, mid);
  for (const s of [-1, 1]) P.add(SLAB(0.3, R.CEIL + 0.3, len), o.wall, s * (R.W + 0.15), G + R.CEIL / 2, mid);
  if (o.ceil !== null) P.add(SLAB(2 * R.W + 0.6, 0.3, len), o.ceil, 0, G + R.CEIL + 0.15, mid);
}
// The back wall with a doorway (u, w wide, h high, its sill at h0).
export function backWall(P, R, c, door = null) {
  const B0 = R.BACK + 0.15;
  if (!door) {
    P.add(BOX(2 * R.W + 0.6, R.CEIL + 0.3, 0.3), c, 0, G + R.CEIL / 2, B0);
    return;
  }
  const { u, w, h, h0 = 0 } = door;
  const left = u - w / 2 + R.W + 0.3;
  const right = R.W + 0.3 - (u + w / 2);
  P.add(BOX(left, R.CEIL + 0.3, 0.3), c, -R.W - 0.3 + left / 2, G + R.CEIL / 2, B0);
  P.add(BOX(right, R.CEIL + 0.3, 0.3), c, R.W + 0.3 - right / 2, G + R.CEIL / 2, B0);
  P.add(BOX(w, R.CEIL + 0.3 - h0 - h, 0.3), c, u, G + h0 + h + (R.CEIL + 0.3 - h0 - h) / 2, B0);
  if (h0 > 0) P.add(BOX(w, h0, 0.3), c, u, G + h0 / 2, B0);
}

// ---- Level 1: Peru ---------------------------------------------------------------

const PERU = { TEMPLE: 38, DOOR: 2.2, STEP: 1.2, RIVER: [30, 52] };
function seaplane(add) {
  add(CYL(0.45, 0.3, 5, 8), 0xe8e0c8, 0, 1.6, 0, Math.PI / 2);
  add(BOX(8, 0.1, 1.2), 0xe8e0c8, 0, 2.3, -0.3);
  add(BOX(2.4, 0.08, 0.7), 0xe8e0c8, 0, 1.8, 2.3);
  add(BOX(0.08, 0.9, 0.8), 0xe8e0c8, 0, 2.2, 2.3);
  for (const s of [-1, 1]) {
    add(BOX(0.4, 0.35, 3.2), 0xc8c0a8, s * 1.2, 0.2, -0.2);
    add(CYL(0.04, 0.04, 1.4, 4), 0x5a5a5a, s * 0.9, 0.9, -0.4, 0, 0, s * 0.5);
  }
  add(BOX(0.1, 1.4, 0.15), 0x3a3a3a, 0, 1.6, -2.6, 0, 0, 0.8);
  add(BOX(0.4, 0.3, 0.8), 0x6a8a9a, 0, 2.05, -0.8);
}

WORLDS.indy_peru = {
  sky: {
    top: "#4a7a9a",
    mid: "#9ac0c8",
    horizon: "#d8e4c8",
    ground: "#3a5a2a",
    sun: [25, 40, "#fffbe8", 10],
    clouds: 9,
    cloud: "rgba(255,255,255,0.5)",
    hills: [
      { colour: "#5a7a6a", height: 16, rough: 5, phase: 1 },
      { colour: "#3a6a3a", height: 8, rough: 3, trees: true },
      { colour: "#2f5a2a", height: 3, rough: 1, trees: true }
    ],
    seed: 101
  },
  fog: 0xa8c0a0,
  build(P) {
    const T = PERU.TEMPLE;
    P.ground(0x3a5a2a, [
      { u: 0, f: 18, r: 5, c: 0x7a6a4a, sx: 0.6, sz: 4 },
      { u: PERU.RIVER[0], f: PERU.RIVER[1], r: 14, c: 0x3a6a7a, sx: 1.4, sz: 0.8 },
      { u: -14, f: 26, r: 8, c: 0x4a6a32 }
    ]);
    // the temple: its platform and steps, the face, the doorway, the vines
    P.add(BOX(30, PERU.STEP, 8), 0x8a8270, 0, G + PERU.STEP / 2, T - 2);
    for (let k = 0; k < 3; k++) P.add(BOX(8, 0.4, 0.8), 0x8a8270, 0, G + 0.2 + k * 0.4, T - 6.4 + k * 0.8);
    P.add(BOX(24, 11, 9), 0x7a7a66, 0, G + PERU.STEP + 5.5, T + 4.5);
    P.add(BOX(18, 3, 7), 0x6e6e5c, 0, G + PERU.STEP + 12.5, T + 4.5);
    P.add(BOX(10, 2.5, 5), 0x7a7a66, 0, G + PERU.STEP + 15.2, T + 4.5);
    P.add(BOX(2 * PERU.DOOR, 4.6, 0.3), 0x0e0c0a, 0, G + PERU.STEP + 2.3, T - 0.05);
    P.add(BOX(2 * PERU.DOOR + 1.4, 1.0, 0.8), 0x8a8270, 0, G + PERU.STEP + 5.1, T - 0.3);
    for (const s of [-1, 1]) {
      P.add(BOX(1.0, 4.6, 0.8), 0x8a8270, s * (PERU.DOOR + 0.5), G + PERU.STEP + 2.3, T - 0.3);
      // carved faces either side
      P.add(BOX(2.4, 2.8, 0.4), 0x6a6a58, s * 6.5, G + PERU.STEP + 6.5, T - 0.2);
      P.add(BOX(0.5, 0.3, 0.1), 0x2a2a22, s * 6.5 - 0.5, G + PERU.STEP + 7.0, T - 0.42);
      P.add(BOX(0.5, 0.3, 0.1), 0x2a2a22, s * 6.5 + 0.5, G + PERU.STEP + 7.0, T - 0.42);
      P.add(BOX(1.4, 0.3, 0.1), 0x2a2a22, s * 6.5, G + PERU.STEP + 5.8, T - 0.42);
    }
    for (let k = 0; k < 14; k++) {
      const u = -11 + k * 1.7;
      const h = 2 + ((k * 7) % 5);
      P.add(BOX(0.12, h, 0.1), 0x3a6a2a, u, G + PERU.STEP + 11 - h / 2, T - 0.02);
    }
    // the altar inside, under the idol
    P.add(BOX(1.2, 1.0, 0.8), 0x9a9280, 0, G + PERU.STEP + 0.5, T + 1.2);
    // ruins in front: broken columns, fallen blocks
    for (const [u, f, h, b] of [
      [-8, 12, 3.4, false],
      [8, 12, 2.2, true],
      [-11, 24, 4, false],
      [11, 24, 1.6, true],
      [-5, 30, 3, true],
      [5, 30, 3.6, false]
    ])
      column(P, u, f, h, 0x9a9280, b);
    for (const [u, f] of [
      [-3, 8],
      [4, 15],
      [-14, 17]
    ])
      P.add(BOX(1.8, 0.9, 1.2), 0x8a8270, u, G + 0.45, f, 0, u, 0.1);
    // the jungle round it all (clear down the middle)
    for (const [u, f, s] of [
      [-18, 10, 1],
      [17, 9, 1.1],
      [-24, 22, 1.2],
      [22, 20, 1.15],
      [-20, 36, 1.3],
      [18, 34, 1.1],
      [-30, 48, 1.4],
      [-13, 52, 1.2],
      [14, 46, 1.3]
    ])
      jungleTree(P, u, f, s);
    for (const [u, f] of [
      [-26, 14],
      [28, 30],
      [-34, 30],
      [34, 16],
      [-9, 44]
    ])
      P.palm(u, f, 1.1);
    P.scatter(46, 2, 50, (u, f, R) => Math.abs(u) > 5 && fern(P, u, f, 0.8 + R() * 0.8), 40, 6);
    P.scatter(24, 4, 60, (u, f, R) => Math.abs(u) > 7 && P.bush(u, f, 0.8 + R(), 0x2f5a26), 45, 8);
    seaplane(kit(P, PERU.RIVER[0] - 2, PERU.RIVER[1] - 4, -0.8, 0));
  },
  slots: [],
  cover: null
};

LAYOUTS.indy_peru = L => {
  const T = PERU.TEMPLE;
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "tarantula", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.4, tint: "brown", bank: 3 });
  L.row({ kind: "skull", n: 5, f: 20, u0: -7, u1: 7, base: 1.5, size: 0.45, tint: "white", perch: true });
  for (const [u, f, h] of [
    [-8, 12, 3.4],
    [-11, 24, 4],
    [5, 30, 3.6]
  ])
    L.row({ ...fixed, kind: "olla", n: 1, f: f - 0.3, u0: u, u1: u, base: h + 0.35, size: 0.5, tint: "orange" });
  L.row({
    ...fixed,
    kind: "idol",
    n: 1,
    f: T + 0.9,
    u0: 0,
    u1: 0,
    base: PERU.STEP + 1.0,
    size: 0.6,
    tint: "gold",
    pts: 100
  });
  L.row({
    ...fixed,
    kind: "skull",
    n: 6,
    f: T - 0.2,
    u0: -10,
    u1: 10,
    base: PERU.STEP + 11.2,
    size: 0.6,
    tint: "white",
    bank: 3
  });
  L.row({ kind: "scarab", n: 4, f: 9, u0: -6, u1: 6, base: 1.1, size: 0.35, tint: "green", bank: 4 });
  L.pops({
    fixed: true,
    f: T - 0.4,
    at: [
      [-1.4, PERU.STEP],
      [1.4, PERU.STEP]
    ],
    size: 1.8,
    kinds: [
      ["hovito", 55],
      ["belloq", 15, { pts: 200 }],
      ["indy", 15, { dont: true }],
      ["mummy", 15]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 13,
    at: [
      [-9, 0],
      [9, 0]
    ],
    size: 1.8,
    kinds: [["hovito", 100]]
  });
  L.pops({
    fixed: true,
    f: 31,
    at: [
      [-5, 0],
      [5.6, 0]
    ],
    size: 1.8,
    kinds: [
      ["hovito", 80],
      ["indy", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: T - 1,
    at: [
      [-8, PERU.STEP + 5.6],
      [8, PERU.STEP + 5.6]
    ],
    size: 1.6,
    period: [5, 8],
    kinds: [
      ["hovito", 85, { pts: 50 }],
      ["belloq", 15, { pts: 200 }]
    ]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: 24.5,
    at: [
      [-11, 0],
      [11.6, 0]
    ],
    size: 1.8,
    kinds: [
      ["hovito", 85],
      ["indy", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 17.6,
    at: [[-14, 0]],
    size: 1.8,
    kinds: [
      ["hovito", 85],
      ["marion", 15, { dont: true }]
    ]
  });
};

const boulder = (R, add, t, c) =>
  add(
    t,
    "i_boulder",
    rush(
      R,
      [
        [0, PERU.TEMPLE - 0.5, G + PERU.STEP + 1.15],
        [0, PERU.TEMPLE - 6, G + 1.15],
        [R(-3, 3), 6, G + 1.15]
      ],
      R(5.5, 7) * c.S
    )
  );
const peruWave = (R, add, c) => {
  const raid = t =>
    add(
      t,
      "i_hovitoRun",
      rush(
        R,
        [
          [pick(R, [-1, 1]) * R(16, 24), R(10, 30), G],
          [R(-8, 8), R(4, 8), G]
        ],
        R(4, 5) * c.S
      )
    );
  const darts = (t, n) => {
    for (let k = 0; k < n; k++) {
      const s = R(0, 1) < 0.5 ? 1 : -1;
      add(
        t + k * 0.5,
        "i_dart",
        lobbed(R, { u: s * R(8, 12), f: R(10, 16), h: G + 1.6, vh: R(1.5, 2.5), vu: -s * R(1, 3), vf: -R(7, 10) })
      );
    }
  };
  if (c.x2) {
    // the idol's gone: run!
    add(1, "i_indyRun", cross(R, { u0: -2, u1: 26, f: 9, v: 6.5 }));
    boulder(R, add, 2, c);
    boulder(R, add, 14, c);
    for (let k = 0; k < 7; k++) raid(3 + k * 3);
    darts(8, 4);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) raid(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++)
    add(
      R(1, 22),
      "i_hovitoRun",
      cross(R, { u0: pick(R, [-1, 1]) * 26, u1: R(-6, 6), f: R(14, 30), v: R(4, 5.5) * c.S, stop: 1.5 })
    );
  if (k === 2 || k === 5) boulder(R, add, R(3, 16), c);
  if (k === 1 || k === 4) darts(R(2, 18), 2 + n(1.5));
  if (k !== 2) flyers(["i_macaw", "i_vulture"], R, add, c, 1 + n(1.5));
  if (R(0, 1) < 0.3) add(R(2, 18), "i_indyRun", cross(R, { u0: 24, u1: -24, f: R(10, 16), v: 5.5 }));
};

// ---- Level 2: the Raven, Nepal -----------------------------------------------------

const RAV = { W: 12, FRONT: -11, BACK: 22, CEIL: 5.6, BAR: 15, DOOR: 6 };
WORLDS.indy_raven = {
  sky: {
    top: "#0a0e1a",
    mid: "#1a2234",
    horizon: "#2a3448",
    ground: "#c8d0dc",
    stars: true,
    planets: [{ az: 12, el: 18, r: 9, colour: "#e8ecf4", light: 0.3, dark: 0.3 }],
    hills: [{ colour: "#8a94a8", height: 14, rough: 5 }],
    seed: 111
  },
  fog: 0x3a3028,
  build(P) {
    const R = RAV;
    room(P, R, { floor: 0x4a3424, wall: 0x6a4a32, ceil: 0x3a2a1c });
    backWall(P, R, 0x6a4a32, { u: R.DOOR, w: 2.4, h: 2.6 });
    for (let k = 0; k < 24; k++)
      P.add(
        SLAB(0.94, 0.06, R.BACK - R.FRONT),
        [0x5a3e28, 0x52382a, 0x60442c][k % 3],
        -11.5 + k,
        G - 0.01,
        (R.BACK + R.FRONT) / 2
      );
    for (let f = R.FRONT + 1; f < R.BACK; f += 2.5) P.add(BOX(2 * R.W, 0.3, 0.3), 0x2a1a10, 0, G + R.CEIL - 0.15, f);
    // the bar across the back, the shelves behind it
    P.add(BOX(13, 1.15, 0.9), 0x5a3420, -3, G + 0.575, R.BAR);
    P.add(BOX(13.3, 0.08, 1.1), 0x2a1a10, -3, G + 1.19, R.BAR);
    P.add(BOX(13, 2.6, 0.5), 0x4a2a16, -3, G + 1.3, R.BACK - 0.3);
    for (const h of [1.45, 2.1]) P.add(BOX(12, 0.05, 0.4), 0x2a1a10, -3, G + h, R.BACK - 0.35);
    // the fireplace in the right wall, the fire
    P.add(BOX(0.8, 2.8, 3.2), 0x6a6a64, R.W - 0.4, G + 1.4, 8);
    P.add(BOX(0.2, 1.4, 1.8), 0x1a1210, R.W - 0.82, G + 0.7, 8);
    for (const [x, h, c] of [
      [0, 0.5, 0xff7a1a],
      [0.3, 0.35, 0xffc040],
      [-0.3, 0.4, 0xff9a2a]
    ])
      P.add(CONE(0.25, h * 2, 5), c, R.W - 0.95, G + h, 8 + x);
    // windows: snow outside
    for (const f of [0, 10]) P.add(BOX(0.08, 1.4, 1.8), 0xc8d4e4, -R.W + 0.05, G + 2.0, f);
    // tables, the drinking contest's table in the middle
    for (const [u, f, r] of [
      [-7, 4, 0.7],
      [-6, 10, 0.7],
      [6, 3, 0.7],
      [0, 7, 1.0],
      [5, 12, 0.7]
    ]) {
      P.add(CYL(r, r, 0.06, 14), 0x6a4a2a, u, G + 0.78, f);
      P.add(CYL(0.08, 0.1, 0.76, 6), 0x2a1a10, u, G + 0.38, f);
      for (let k = 0; k < 3; k++)
        P.add(
          BOX(0.4, 0.45, 0.4),
          0x4a2c18,
          u + Math.cos(k * 2.1) * (r + 0.4),
          G + 0.22,
          f + Math.sin(k * 2.1) * (r + 0.4)
        );
    }
    // overturned tables for cover, a yak's skull over the bar, lamps
    for (const u of [-4, 4]) P.add(CYL(0.6, 0.6, 0.06, 14), 0x6a4426, u, G + 0.6, 1.6, Math.PI / 2);
    P.add(BOX(0.5, 0.6, 0.2), 0xe8e0d0, -3, G + 3.3, R.BACK - 0.1);
    for (const s of [-1, 1]) P.add(CONE(0.1, 1.0, 5), 0xf0e8d8, -3 + s * 0.6, G + 3.5, R.BACK - 0.12, 0, 0, s * 1.1);
    for (const [u, f] of [
      [-6, 6],
      [6, 6],
      [0, 14]
    ])
      P.add(BALL(0.18, 6), 0xffd27a, u, G + R.CEIL - 0.7, f);
    // barrels, crates, pelts on the walls, bottles on the shelves, stools at the bar
    for (const [u, f] of [
      [-10.5, 1],
      [-10.6, 2.2],
      [10.4, 15],
      [10.5, 18],
      [-10.4, 18.5]
    ]) {
      P.add(CYL(0.45, 0.4, 1.1, 10), 0x6a4426, u, G + 0.55, f);
      for (const h of [0.2, 0.9]) P.add(CYL(0.46, 0.46, 0.05, 10), 0x2a2a2a, u, G + h, f);
    }
    for (const [u, f, w] of [
      [9.8, 2, 1.2],
      [10.2, 3.3, 0.9],
      [9.9, 2.6, 0.7]
    ])
      P.add(BOX(w, w, w), 0x8a6a46, u, G + w / 2 + (w < 0.8 ? 1.2 : 0), f);
    for (const s of [-1, 1])
      for (const f of [4, 13])
        P.add(BOX(0.08, 1.4, 1.0), [0x8a6a4a, 0x6a5040][f % 2], s * (R.W - 0.05), G + 3.2, f + 2.5);
    for (let k = 0; k < 18; k++) {
      const h = [1.45, 2.1][k % 2];
      P.add(
        CYL(0.06, 0.07, 0.3, 6),
        [0x3a6a3a, 0x6a3a1a, 0x8a7a3a][k % 3],
        -8.8 + k * 0.68,
        G + h + 0.15,
        R.BACK - 0.25
      );
    }
    for (let u = -8.5; u <= 2.5; u += 1.5) {
      P.add(CYL(0.22, 0.22, 0.06, 10), 0x6a2a1a, u, G + 0.8, R.BAR - 0.8);
      P.add(CYL(0.04, 0.05, 0.78, 5), 0x2a1a10, u, G + 0.39, R.BAR - 0.8);
    }
    P.add(BOX(0.3, 0.3, 4), 0x2a1a10, R.W - 1, G + R.CEIL - 0.6, 8);
    for (const f of [6.6, 7.6, 8.6, 9.6]) P.add(CYL(0.02, 0.02, 0.6, 4), 0x4a3a2a, R.W - 1, G + R.CEIL - 1.1, f);
    // candles on every table, a ladder to the loft
    for (const [u, f] of [
      [-7, 4],
      [-6, 10],
      [6, 3],
      [0, 7],
      [5, 12]
    ]) {
      P.add(CYL(0.05, 0.05, 0.2, 6), 0xf4efe2, u + 0.3, G + 0.91, f + 0.2);
      P.add(CONE(0.035, 0.08, 5), 0xffc040, u + 0.3, G + 1.05, f + 0.2);
    }
    for (const s of [-1, 1]) P.add(BOX(0.08, 4.6, 0.08), 0x5a3a20, -R.W + 1 + s * 0.25, G + 2.3, 20);
    for (let h = 0.4; h < 4.6; h += 0.45) P.add(BOX(0.6, 0.06, 0.06), 0x5a3a20, -R.W + 1, G + h, 20);
    // outside the back door: snow, huts, lanterns on poles
    sheet(P, -14, 22, R.BACK + 0.3, 70, G, 0xe0e6ee);
    for (const [u, f] of [
      [12, 40],
      [3, 52],
      [16, 60]
    ]) {
      P.add(BOX(5, 3, 4), 0x5a4a3a, u, G + 1.5, f);
      P.add(BOX(5.6, 0.6, 4.6), 0xe8eef4, u, G + 3.2, f);
    }
  },
  slots: [],
  cover: null
};

LAYOUTS.indy_raven = L => {
  const R = RAV;
  const fixed = { fixed: true, rail: false };
  // the drinking contest: shot glasses all round the middle table
  L.row({ ...fixed, kind: "glass", n: 6, f: 6.4, u0: -0.8, u1: 0.8, base: 0.81, size: 0.24, tint: "white", bank: 3 });
  for (const [u, f] of [
    [-7, 4],
    [6, 3],
    [-6, 10],
    [5, 12]
  ])
    L.row({
      ...fixed,
      kind: ["bottle", "mug"],
      n: 2,
      f,
      u0: u - 0.25,
      u1: u + 0.25,
      base: 0.81,
      size: 0.3,
      tint: ["green", "gold"],
      bank: 2
    });
  L.row({
    ...fixed,
    kind: ["bottle", "mug", "glass"],
    n: 9,
    f: R.BAR - 0.1,
    u0: -8.5,
    u1: 2.5,
    base: 1.23,
    size: 0.3,
    tint: ["brown", "gold", "white"],
    bank: 3
  });
  for (const h of [1.45, 2.1])
    L.row({
      ...fixed,
      kind: "bottle",
      n: 6,
      f: R.BACK - 0.45,
      u0: -8,
      u1: 2,
      base: h,
      size: 0.4,
      tint: ["green", "brown"],
      bank: 3
    });
  L.row({ ...fixed, kind: "lantern", n: 2, f: 46, u0: 8.4, u1: 9.6, base: 2.2, size: 0.45, tint: "gold", rail: true });
  L.pops({
    fixed: true,
    f: 1.9,
    at: [
      [-4, 0],
      [4, 0]
    ],
    size: 1.75,
    kinds: [
      ["mongol", 80],
      ["marion", 20, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: R.BAR + 0.7,
    at: [
      [-7, 0],
      [-2, 0]
    ],
    size: 1.75,
    kinds: [
      ["marion", 30, { dont: true }],
      ["mongol", 60],
      ["toht", 10, { pts: 150 }]
    ]
  });
  L.pops({
    fixed: true,
    f: R.BACK + 0.45,
    at: [[R.DOOR, 0]],
    size: 1.8,
    kinds: [
      ["mongol", 60],
      ["toht", 25, { pts: 150 }],
      ["indy", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 7.5,
    at: [[0, 0]],
    size: 1.75,
    kinds: [
      ["mongol", 70],
      ["marion", 30, { dont: true }]
    ]
  });
  L.pops({ fixed: true, f: 50, at: [[9, 0]], size: 1.7, period: [6, 9], kinds: [["mongol", 100, { pts: 50 }]] });
  L.pops({
    fixed: true,
    f: 10.8,
    at: [
      [-6, 0],
      [5, 0]
    ],
    size: 1.75,
    kinds: [
      ["mongol", 75],
      ["toht", 8, { pts: 150 }],
      ["indy", 17, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 2.0,
    at: [[10.2, 0]],
    size: 1.75,
    kinds: [["mongol", 100]]
  });
};

const ravenWave = (R, add, c) => {
  const D = RAV;
  const inDoor = t =>
    add(
      t,
      R(0, 1) < 0.85 ? "i_mongolRun" : "i_tohtRun",
      rush(
        R,
        [
          [D.DOOR, D.BACK + 1.2, G],
          [D.DOOR - 1, D.BACK - 1.2, G],
          [R(4, 9), 18.5, G],
          [R(-7, 8), R(3, 6), G]
        ],
        R(2.6, 3.4) * c.S
      )
    );
  const bottles = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n + R(0, 1),
        "i_bottle",
        toss(R, { u: R(-8, 2), f: D.BAR + 0.3, h: G + 1.2, vh: R(6, 8) * Math.min(1.2, c.S), vu: R(-2, 2) })
      );
  };
  if (c.x2) {
    // the bar's on fire, Toht's men come in
    for (let k = 0; k < 8; k++) inDoor(1 + k * 2.8);
    bottles(6);
    add(
      6,
      "i_tohtRun",
      rush(
        R,
        [
          [D.DOOR, D.BACK + 1.2, G],
          [3, 10, G],
          [1, 5, G]
        ],
        2.4 * c.S
      )
    );
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.3); j++) inDoor(R(1, 22));
  if (k !== 3) bottles(3 + n(2));
  if (k === 2 || k === 5)
    for (let j = 0; j < 1 + n(1); j++)
      add(
        R(2, 22),
        "i_grenade",
        lobbed(R, { u: D.DOOR, f: D.BACK, h: G + 1.5, vh: R(3, 4.5), vu: -R(1, 3), vf: -R(4, 6) })
      );
  if (R(0, 1) < 0.35) add(R(2, 18), "i_marionRun", cross(R, { u0: -9, u1: 2, f: D.BAR + 1.2, v: 2.2 }));
};

// ---- Level 3: Cairo ---------------------------------------------------------------

const CAI = { STALLS: [8, 16, 24, 32], ROW: 7.5, BACK: 13 };
const AWN = [0xc0182a, 0x2f6a8a, 0xe8b030, 0x3a8a4a, 0xe8e0d0, 0x8a3a8a];
WORLDS.indy_cairo = {
  sky: {
    top: "#4a82c0",
    mid: "#9ac0e0",
    horizon: "#f2e0c0",
    ground: "#c8a878",
    sun: [-20, 48, "#fffbe8", 11],
    clouds: 2,
    hills: [{ colour: "#c8a878", height: 2, rough: 1 }],
    skyline: "#b89a78",
    seed: 121
  },
  fog: 0xe0ccaa,
  build(P) {
    P.ground(0xd2b484, [
      { u: 0, f: 22, r: 5, c: 0xc8a878, sx: 1, sz: 5 },
      { u: 0, f: 46, r: 14, c: 0xc8a878, sx: 3, sz: 0.4 }
    ]);
    for (const s of [-1, 1]) {
      // the stalls down each side of the street: counters, awnings, baskets
      CAI.STALLS.forEach((f, k) => {
        const u = s * CAI.ROW;
        P.add(BOX(1.0, 0.9, 6.4), 0x8a6a46, u + s * 0.3, G + 0.45, f);
        P.add(BOX(3.0, 0.08, 7.0), AWN[(k + (s > 0 ? 3 : 0)) % AWN.length], u + s * 1.2, G + 2.75, f, 0, 0, s * 0.25);
        for (const e of [-1, 1]) P.add(BOX(0.1, 2.8, 0.1), 0x5a4030, u - s * 0.2, G + 1.4, f + e * 3.2);
        for (let j = 0; j < 3; j++) P.add(CYL(0.35, 0.3, 0.6, 10), 0xb89a5a, u - s * 0.9, G + 0.3, f - 2 + j * 2);
      });
      // the buildings behind: two and three storeys, windows, flat roofs
      for (const [f0, f1, h] of [
        [3, 13, 7],
        [13, 22, 10],
        [22, 30, 7.5],
        [30, 40, 10]
      ]) {
        const u = s * (CAI.BACK + 3);
        P.add(BOX(6, h, f1 - f0), [0xd8c09a, 0xc8a882, 0xe0ccaa][Math.round(f0) % 3], u, G + h / 2, (f0 + f1) / 2);
        P.add(BOX(6.4, 0.4, f1 - f0 + 0.2), 0xb89a72, u, G + h + 0.2, (f0 + f1) / 2);
        for (let f = f0 + 2; f < f1 - 1; f += 3.5)
          for (const wh of [3.2, 6.2])
            if (wh < h - 1) P.add(BOX(0.1, 1.3, 1.0), 0x2a1e14, s * CAI.BACK - s * 0.05 + s * 0.01, G + wh, f);
      }
    }
    // the goods: rugs hung up, fruit and spice piles, a cart, hanging lamps
    for (const s of [-1, 1])
      CAI.STALLS.forEach((f, k) => {
        const u = s * CAI.ROW;
        P.add(BOX(0.06, 1.8, 1.4), AWN[(k + 2) % AWN.length], u + s * 2.4, G + 1.6, f + 1.8);
        P.add(BOX(0.07, 1.0, 1.0), AWN[(k + 4) % AWN.length], u + s * 2.38, G + 1.5, f + 1.8);
        for (let j = 0; j < 5; j++)
          P.add(
            BALL(0.12, 6),
            [0xe8a030, 0xc0302a, 0x6a8a2a, 0xe8d050][j % 4],
            u + s * 0.1 + (j % 2) * 0.2,
            G + 0.95 + (j > 2 ? 0.12 : 0),
            f + 1.2 + j * 0.25
          );
        P.add(CONE(0.3, 0.4, 8), [0xc8602a, 0xe8b030, 0x8a3a1a][k % 3], u + s * 0.2, G + 1.1, f - 1.5);
        P.add(BALL(0.15, 6), 0xffd27a, u + s * 0.5, G + 2.3, f);
      });
    P.add(BOX(1.6, 0.8, 2.6), 0x8a6a46, -3, G + 0.9, 30);
    for (const e of [-1, 1]) P.add(TORUS(0.45, 0.06, 12), 0x3a2a1a, -3 + e * 0.85, G + 0.45, 30, 0, Math.PI / 2, 0);
    for (let k = 0; k < 6; k++)
      P.add(BOX(0.6, 0.4, 0.6), 0xb89a5a, -3.3 + (k % 2) * 0.6, G + 1.5 + Math.floor(k / 2) * 0.1, 29.2 + k * 0.3);
    P.add(BOX(0.06, 0.06, 2 * CAI.BACK), 0x5a4030, 0, G + 5.2, 20, 0, Math.PI / 2, 0);
    for (let u = -10; u <= 10; u += 2.5)
      P.add(BOX(0.8, 0.6, 0.02), AWN[Math.abs(Math.round(u)) % AWN.length], u, G + 4.8, 20);
    // across the end of the street: the mosque, its dome and minaret
    P.add(BOX(26, 8, 6), 0xe0ccaa, 0, G + 4, 52);
    P.add(BALL(5, 14), 0xc8b088, 0, G + 8, 54, 0, 0, 0, 1, 0.9, 1);
    P.add(CYL(1, 1.1, 18, 8), 0xe8d8b8, 9, G + 9, 50);
    P.add(CYL(1.6, 1.6, 0.4, 8), 0xc8b088, 9, G + 15, 50);
    P.add(CONE(1.1, 2.6, 8), 0xc8b088, 9, G + 19.3, 50);
    P.add(BOX(2.4, 3.4, 0.2), 0x2a1e14, 0, G + 1.7, 48.9);
    for (const [u, f] of [
      [-20, 20],
      [21, 30],
      [-24, 44],
      [26, 12]
    ])
      P.palm(u, f, 1.2);
    P.scatter(10, 56, 80, (u, f, R) => P.add(BOX(6 + R() * 8, 4 + R() * 8, 6), 0xd8c09a, u, G + 3, f), 60);
  },
  slots: [],
  cover: null
};

LAYOUTS.indy_cairo = L => {
  const fixed = { fixed: true, rail: false };
  for (const s of [-1, 1])
    CAI.STALLS.forEach((f, k) =>
      L.row({
        ...fixed,
        kind: k % 2 ? "olla" : "mug",
        n: 3,
        f: f - 0.2,
        u0: s * (CAI.ROW + 0.3),
        u1: s * (CAI.ROW + 0.3),
        base: 0.9,
        size: 0.32,
        tint: k % 2 ? "orange" : "gold",
        bank: 3
      })
    );
  L.row({ ...fixed, kind: "lantern", n: 4, f: 20, u0: -3, u1: 3, base: 3.4, size: 0.4, tint: "gold", rail: true });
  L.row({ ...fixed, kind: "olla", n: 5, f: 47.5, u0: -8, u1: 8, base: 0.2, size: 0.5, tint: "orange", bank: 5 });
  L.row({ kind: "scarab", n: 5, f: 4, u0: -4, u1: 4, size: 0.34, tint: "green", bank: 5 });
  const street = [
    ["thug", 50],
    ["soldier", 25],
    ["swordsman", 10, { pts: 100 }],
    ["sallah", 15, { dont: true }]
  ];
  // in the stalls' baskets and behind the counters
  for (const f of CAI.STALLS)
    L.pops({
      fixed: true,
      f: f + 0.4,
      at: [
        [-(CAI.ROW - 0.9), 0.3],
        [CAI.ROW - 0.9, 0.3]
      ],
      size: 1.75,
      busy: 0.6,
      kinds: [...street, ["marion", 8, { dont: true }]]
    });
  // in the windows and on the roofs
  L.pops({
    fixed: true,
    f: 17.5,
    at: [
      [-(CAI.BACK - 0.6), 5.6],
      [CAI.BACK - 0.6, 5.6]
    ],
    size: 1.5,
    kinds: [
      ["thug", 70],
      ["soldier", 30]
    ]
  });
  L.pops({
    fixed: true,
    f: 26,
    at: [
      [-(CAI.BACK + 1.5), 7.9],
      [CAI.BACK + 1.5, 7.9]
    ],
    size: 1.5,
    period: [5, 8],
    kinds: [["soldier", 100, { pts: 50 }]]
  });
  L.pops({ fixed: true, f: 48.6, at: [[0, 0]], size: 1.8, kinds: street });
};

const cairoWave = (R, add, c) => {
  const alley = t =>
    add(
      t,
      R(0, 1) < 0.7 ? "i_thugRun" : "i_soldierRun",
      rush(
        R,
        [
          [pick(R, [-1, 1]) * R(9, 11), pick(R, [12, 20, 28]), G],
          [R(-3, 3), R(14, 22), G],
          [R(-5, 5), R(4, 7), G]
        ],
        R(3, 4) * c.S
      )
    );
  const pots = n => {
    for (let k = 0; k < n; k++) {
      const s = R(0, 1) < 0.5 ? 1 : -1;
      add(
        2 + (k * 24) / n + R(0, 1),
        "i_pot",
        toss(R, {
          u: s * (CAI.ROW - 1),
          f: pick(R, CAI.STALLS),
          h: G + 1,
          vh: R(7.5, 9.5) * Math.min(1.2, c.S),
          vu: -s * R(1.5, 3)
        })
      );
    }
  };
  const swordsman = (t, stay = 6) =>
    add(t, "i_swordsmanRun", {
      ...cross(R, { u0: pick(R, [-1, 1]) * 5, u1: R(-1, 1), f: 14, v: 1.8, stop: stay }),
      charge: true,
      arrive: 5 / 1.8 + stay - 0.6
    });
  if (c.x2) {
    swordsman(1, 8);
    for (let k = 0; k < 8; k++) alley(2 + k * 2.6);
    pots(6);
    add(4, "i_truck", run(R, { v: R(9, 11) * c.S, f: 44 }));
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) alley(R(1, 22));
  if (k === 0 || k === 3) swordsman(R(2, 12));
  if (k !== 3) pots(3 + n(2));
  if (k === 1 || k === 4) add(R(2, 20), "i_truck", run(R, { v: R(9, 11) * c.S, f: 44 }));
  if (k === 2 || k === 5) flyers(["i_pigeon", "i_vulture"], R, add, c, 2 + n(1.5));
  if (R(0, 1) < 0.4) add(R(2, 18), "i_monkey", skim(R, { v: 4.5, f: 26, h: 7.9, u0: 20 }));
  if (R(0, 1) < 0.3) add(R(2, 18), "i_sallahRun", cross(R, { u0: -5, u1: 5, f: R(8, 12), v: 1.8 }));
};

// ---- Level 4: the Well of Souls --------------------------------------------------------

const WELL = { W: 14, FRONT: -11, BACK: 40, CEIL: 15, HOLE: [16, 24], ANUBIS: [12, 28] };
function anubis(P, s, f) {
  const u = s * (WELL.W - 2.6);
  const c = 0x2a2620;
  const gold = 0xc8a040;
  P.add(BOX(3.2, 1.2, 4), 0x8a7a5a, u, G + 0.6, f);
  P.add(BOX(2.2, 4.0, 2.4), c, u, G + 3.2, f + 0.4);
  P.add(BOX(2.0, 1.6, 2.6), c, u, G + 1.8, f - 1.0);
  P.add(BOX(1.6, 2.6, 1.8), c, u, G + 6.0, f + 0.3);
  P.add(BOX(1.4, 0.4, 1.9), gold, u, G + 5.1, f + 0.2);
  P.add(BOX(1.0, 1.1, 1.0), c, u, G + 7.7, f);
  P.add(BOX(0.5, 0.45, 1.3), c, u, G + 7.6, f - 1.0);
  for (const e of [-1, 1]) P.add(CONE(0.22, 1.1, 4), c, u + e * 0.35, G + 8.7, f + 0.2);
  P.add(BOX(0.14, 0.1, 0.05), gold, u - s * 0.2, G + 7.8, f - 0.52);
  P.add(CYL(0.08, 0.08, 7, 5), gold, u - s * 1.2, G + 3.5, f - 0.6);
}
WORLDS.indy_well = {
  sky: {
    top: "#f8f0d8",
    mid: "#e8d8b0",
    horizon: "#c8a878",
    ground: "#1a140e",
    sun: [0, 80, "#ffffff", 20],
    seed: 131
  },
  fog: 0x2a2014,
  build(P) {
    const R = WELL;
    room(P, R, { floor: 0x3a2e20, wall: 0x7a6a4c, ceil: null });
    backWall(P, R, 0x7a6a4c);
    // the ceiling, the hole they lowered you through
    const len0 = R.HOLE[0] - R.FRONT;
    P.add(SLAB(2 * R.W + 0.6, 0.6, len0), 0x5a4a34, 0, G + R.CEIL + 0.3, (R.FRONT + R.HOLE[0]) / 2);
    P.add(SLAB(2 * R.W + 0.6, 0.6, R.BACK - R.HOLE[1]), 0x5a4a34, 0, G + R.CEIL + 0.3, (R.HOLE[1] + R.BACK) / 2);
    for (const s of [-1, 1])
      P.add(
        BOX(R.W - 3, 0.6, R.HOLE[1] - R.HOLE[0]),
        0x5a4a34,
        (s * (R.W + 3)) / 2,
        G + R.CEIL + 0.3,
        (R.HOLE[0] + R.HOLE[1]) / 2
      );
    P.add(BOX(6, 0.05, R.HOLE[1] - R.HOLE[0]), 0xc8b080, 0, G + 0.02, (R.HOLE[0] + R.HOLE[1]) / 2);
    // bands of hieroglyphs, niches, torches
    for (const s of [-1, 1]) {
      const x = d => s * (R.W - d);
      for (const h of [4, 9.5])
        P.add(SLAB(0.06, 0.6, R.BACK - R.FRONT), 0x9a7a3a, x(0.04), G + h, (R.BACK + R.FRONT) / 2);
      for (const f of [4, 20, 34]) {
        P.add(BOX(0.1, 2.4, 1.4), 0x140e08, x(0.06), G + 1.2, f);
        P.add(BOX(0.4, 0.15, 0.15), 0x5a3a20, x(0.2), G + 3.2, f + 2);
        P.add(CONE(0.12, 0.35, 5), 0xff9a2a, x(0.2), G + 3.4, f + 2);
      }
      for (const f of WELL.ANUBIS) anubis(P, s, f);
    }
    // the Ark on its pedestal, at the back
    P.add(BOX(4, 1.6, 3), 0x8a7a5a, 0, G + 0.8, R.BACK - 3);
    P.add(BOX(2.2, 0.9, 1.3), 0xd8b040, 0, G + 2.05, R.BACK - 3);
    P.add(BOX(2.3, 0.12, 1.4), 0xe8c850, 0, G + 2.56, R.BACK - 3);
    for (const e of [-1, 1]) {
      P.add(BOX(0.35, 0.6, 0.4), 0xe8c850, e * 0.6, G + 2.9, R.BACK - 3);
      P.add(BOX(0.06, 0.5, 0.9), 0xe8c850, e * 0.35, G + 3.2, R.BACK - 3, 0, 0, e * 0.4);
      P.add(CYL(0.04, 0.04, 3.2, 5), 0xc8a040, 0, G + 1.8, R.BACK - 3 + e * 0.5, 0, 0, Math.PI / 2);
    }
    // columns down the hall, rubble, snakes everywhere on the floor
    for (const s of [-1, 1]) for (const f of [6, 20, 34]) column(P, s * 6.5, f, 10, 0x8a7a5a);
    P.scatter(
      70,
      0,
      36,
      (u, f, R2) => {
        if (Math.abs(u) > WELL.W - 1) return;
        const a = R2() * 6;
        for (let k = 0; k < 4; k++)
          P.add(
            CYL(0.06, 0.06, 0.5, 4),
            [0x4a5a2a, 0x5a6a3a, 0x3a4a22][k % 3],
            u + Math.cos(a + k) * k * 0.3,
            G + 0.05,
            f + Math.sin(a + k) * k * 0.3,
            0,
            a + k * 0.8,
            Math.PI / 2
          );
      },
      WELL.W
    );
  },
  slots: [],
  cover: null
};

LAYOUTS.indy_well = L => {
  const R = WELL;
  const fixed = { fixed: true, rail: false };
  L.row({ ...fixed, kind: "snake", n: 6, f: 3, u0: -4, u1: 4, size: 0.4, tint: "green", bank: 3 });
  L.row({ ...fixed, kind: "cobra", n: 4, f: 9, u0: -3.5, u1: 3.5, size: 0.55, tint: "green", bank: 4 });
  for (const s of [-1, 1])
    for (const f of [6, 20, 34])
      L.row({
        ...fixed,
        kind: "olla",
        n: 1,
        f: f - 0.6,
        u0: s * 6.5,
        u1: s * 6.5,
        base: 10.35,
        size: 0.6,
        tint: "orange"
      });
  L.row({ ...fixed, kind: "scarab", n: 5, f: R.BACK - 0.2, u0: -8, u1: 8, base: 5, size: 0.6, tint: "gold", bank: 5 });
  L.row({
    ...fixed,
    kind: "idol",
    n: 2,
    f: R.BACK - 4.6,
    u0: -1.6,
    u1: 1.6,
    base: 1.6,
    size: 0.5,
    tint: "gold",
    bank: 2
  });
  L.row({ ...fixed, kind: "cobra", n: 4, f: 26, u0: -3, u1: 3, size: 0.6, tint: "green", bank: 4 });
  for (const f of [4, 20, 34])
    L.pops({
      fixed: true,
      f,
      at: [
        [-(R.W - 0.7), 0],
        [R.W - 0.7, 0]
      ],
      size: 1.8,
      kinds: [
        ["mummy", 55],
        ["cobra", 30],
        ["sallah", 15, { dont: true }]
      ]
    });
  L.pops({
    fixed: true,
    f: R.HOLE[0] + 0.3,
    at: [
      [-2, R.CEIL + 0.6],
      [2, R.CEIL + 0.6]
    ],
    size: 1.7,
    kinds: [
      ["soldier", 55],
      ["belloq", 15, { pts: 200 }],
      ["colonel", 15, { pts: 75 }],
      ["marion", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: R.BACK - 1.2,
    at: [[0, 1.6]],
    size: 1.8,
    period: [6, 9],
    kinds: [
      ["belloq", 50, { pts: 200 }],
      ["soldier", 50, { pts: 50 }]
    ]
  });
};

const wellWave = (R, add, c) => {
  const W = WELL;
  const slither = (t, f) => add(t, "i_snake", skim(R, { v: R(4, 6) * c.S, f, h: 0.02, u0: W.W - 0.5 }));
  const shamble = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      "i_mummyRun",
      rush(
        R,
        [
          [s * (W.W - 0.7), pick(R, [4, 20, 34]), G],
          [s * R(2, 7), R(4, 8), G]
        ],
        R(1.4, 1.9) * c.S
      )
    );
  };
  const torches = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n,
        "i_torch",
        lobbed(R, { u: R(-2, 2), f: W.HOLE[0] + 1, h: G + W.CEIL, vh: R(1, 2), vu: R(-2, 2), vf: -R(2, 4) })
      );
  };
  if (c.x2) {
    // snakes. Why'd it have to be snakes?
    for (let k = 0; k < 14; k++) slither(1 + k * 1.7, R(3, 24));
    for (let k = 0; k < 3; k++) shamble(3 + k * 7);
    flyers(["i_bat", "i_bat"], R, add, c, 6);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 3 + n(2); j++) slither(R(1, 24), R(3, 26));
  for (let j = 0; j < 1 + n(1); j++) shamble(R(1, 18));
  if (k === 1 || k === 4) torches(2 + n(1));
  if (k !== 1) flyers(["i_bat", "i_bat"], R, add, c, 1 + n(1.5));
  if (R(0, 1) < 0.3) add(R(2, 16), "i_sallahRun", cross(R, { u0: -8, u1: 8, f: R(14, 20), v: 2 }));
};

// ---- Level 10: the Grail temple ------------------------------------------------------

const GRAIL = { W: 12, FRONT: -11, BACK: 52, CEIL: 13, TIERS: [1.1, 2.0, 2.9], ALTAR: 48 };
WORLDS.indy_grail = {
  sky: { top: "#1a1008", mid: "#2a1a0e", horizon: "#3a2414", ground: "#1a1008", seed: 141 },
  fog: 0x4a2a1a,
  build(P) {
    const R = GRAIL;
    room(P, R, { floor: 0x8a5a44, wall: 0xb8745a, ceil: 0x8a5040 });
    backWall(P, R, 0xa86a52);
    // the carved hall: columns, the doorways off it, lamps
    for (const s of [-1, 1]) {
      const x = d => s * (R.W - d);
      for (let f = -6; f < R.BACK - 2; f += 7) {
        P.add(BOX(1.2, R.CEIL, 1.2), 0xc88466, x(0.6), G + R.CEIL / 2, f);
        P.add(BOX(1.8, 0.6, 1.6), 0xa86a52, x(0.6), G + R.CEIL - 0.3, f);
      }
      for (const f of [10, 24, 38]) {
        P.add(BOX(0.12, 3.2, 2.2), 0x1a0e08, x(0.06), G + 1.6, f);
        P.add(BOX(0.4, 0.5, 2.8), 0xa86a52, x(0.2), G + 3.45, f);
      }
      for (const f of [3, 17, 31, 45]) {
        P.add(CYL(0.12, 0.2, 0.5, 6), 0x5a3a20, x(0.3), G + 2.6, f);
        P.add(CONE(0.12, 0.3, 5), 0xffb04a, x(0.3), G + 3.0, f);
      }
    }
    // carved bands and niches with effigies of knights, the shaft of light
    for (const s of [-1, 1]) {
      const x = d => s * (R.W - d);
      for (const h of [5, 9.5])
        P.add(SLAB(0.3, 0.5, R.BACK - R.FRONT), 0xd09478, x(0.15), G + h, (R.BACK + R.FRONT) / 2);
      for (const f of [3.5, 17.5, 31.5, 45]) {
        P.add(BOX(0.4, 3.2, 2.0), 0x7a4434, x(0.2), G + 6.4, f);
        P.add(BOX(0.5, 0.4, 2.4), 0xd09478, x(0.25), G + 8.2, f);
        P.add(BOX(0.3, 2.2, 0.6), 0xb0b4b8, x(0.45), G + 6.2, f);
        P.add(BALL(0.25, 6), 0xb0b4b8, x(0.45), G + 7.5, f);
        P.add(BOX(0.05, 1.6, 0.1), 0xc0182a, x(0.62), G + 6.3, f);
        P.add(BOX(0.05, 0.1, 0.5), 0xc0182a, x(0.62), G + 6.6, f);
      }
      for (let f = -6; f < R.BACK - 2; f += 7) {
        P.add(CYL(0.5, 0.6, R.CEIL - 1.2, 10), 0xd08a6c, s * (R.W - 3.2), G + (R.CEIL - 1.2) / 2 + 0.6, f + 3.5);
        P.add(BOX(1.4, 0.6, 1.4), 0xa86a52, s * (R.W - 3.2), G + 0.3, f + 3.5);
        P.add(BOX(1.4, 0.6, 1.4), 0xa86a52, s * (R.W - 3.2), G + R.CEIL - 0.3, f + 3.5);
      }
    }
    P.add(CYL(2.4, 2.4, 0.05, 14), 0xf0c898, 0, G + 0.02, 22);
    // the arch over the knight's chamber
    P.add(BOX(18, 2.2, 1.2), 0xc88466, 0, G + 8.5, GRAIL.ALTAR - 7);
    for (const s of [-1, 1]) P.add(BOX(1.6, 8.5, 1.2), 0xc88466, s * 8.2, G + 4.25, GRAIL.ALTAR - 7);
    for (let k = 0; k < 9; k++) P.add(BOX(0.6, 0.6, 0.2), 0xe8b090, -6 + k * 1.5, G + 9.8, GRAIL.ALTAR - 7.6);
    // the knight's chamber at the far end: the steps up, the tiers of cups
    for (let k = 0; k < 4; k++)
      P.add(BOX(16 - k * 2, 0.3, 1.2), 0xa86a52, 0, G + 0.15 + k * 0.3, R.ALTAR - 6 + k * 1.2);
    R.TIERS.forEach((h, k) => P.add(BOX(14 - k * 3, 0.15, 1.0), 0x7a4a36, 0, G + h - 0.075, R.ALTAR + k * 1.0));
    for (let k = 0; k < 3; k++)
      P.add(BOX(14 - k * 3, R.TIERS[k], 1.0), 0x9a5e48, 0, G + R.TIERS[k] / 2 - 0.08, R.ALTAR + k * 1.0);
    P.add(BOX(1.4, 1.0, 1.0), 0x7a4a36, -4.2, G + 0.5, R.ALTAR - 3.2);
    // candles on the tiers, chains, rubble
    for (let k = 0; k < 14; k++) {
      const t = k % 3;
      const u = -5.5 + ((k * 0.85) % 11);
      P.add(CYL(0.05, 0.05, 0.25, 6), 0xf4efe2, u, GRAIL.TIERS[t] + G + 0.12, GRAIL.ALTAR + t + 0.35);
      P.add(CONE(0.04, 0.09, 5), 0xffc040, u, GRAIL.TIERS[t] + G + 0.3, GRAIL.ALTAR + t + 0.35);
    }
    P.scatter(
      40,
      2,
      44,
      (u, f, Rr) =>
        P.add(BOX(0.3 + Rr() * 0.6, 0.2 + Rr() * 0.3, 0.3 + Rr() * 0.6), 0x9a5e48, u, G + 0.12, f, 0, Rr() * 3, 0),
      10,
      2.5
    );
    // the great carved door behind you (the light of the canyon)
    P.add(BOX(5, 7, 0.2), 0xf0c898, 0, G + 3.5, R.FRONT + 0.2);
    // rubble, skeletons of those who chose poorly
    for (const [u, f] of [
      [-6, 8],
      [7, 14],
      [-4, 30],
      [5, 36]
    ]) {
      P.add(BOX(1.6, 0.5, 1.0), 0x9a6048, u, G + 0.25, f, 0, u, 0);
      P.add(BALL(0.18, 6), 0xe8dcc0, u + 0.9, G + 0.18, f + 0.3);
    }
  },
  slots: [],
  cover: null
};

LAYOUTS.indy_grail = L => {
  const R = GRAIL;
  const fixed = { fixed: true, rail: false };
  // the cups on their tiers: shoot the jewelled ones (the plain one only pops up: never it)
  R.TIERS.forEach((h, k) =>
    L.row({
      ...fixed,
      kind: "cup",
      n: 7 - k * 2,
      f: R.ALTAR + k * 1.0 - 0.2,
      u0: -(6 - k * 1.5),
      u1: 6 - k * 1.5,
      base: h,
      size: 0.42,
      tint: ["gold", "steel", "gold"][k],
      bank: 7 - k * 2
    })
  );
  L.row({ ...fixed, kind: "skull", n: 6, f: 6, u0: -5, u1: 5, size: 0.4, tint: "white", bank: 3 });
  L.row({ ...fixed, kind: "olla", n: 4, f: 20, u0: -4.5, u1: 4.5, size: 0.5, tint: "orange", bank: 4 });
  L.row({
    ...fixed,
    kind: "scarab",
    n: 4,
    f: 32,
    u0: -5,
    u1: 5,
    base: 2.4,
    size: 0.45,
    tint: "gold",
    bank: 4,
    rail: true
  });
  L.pops({
    fixed: true,
    f: R.ALTAR + 2.6,
    at: [[0, R.TIERS[2]]],
    size: 0.5,
    period: [4, 6],
    kinds: [["plaincup", 100, { dont: true }]]
  });
  L.pops({
    fixed: true,
    f: R.ALTAR - 2.9,
    at: [[-4.2, 1.0]],
    size: 1.8,
    period: [6, 9],
    kinds: [["knight", 100, { dont: true }]]
  });
  L.pops({
    fixed: true,
    peek: true,
    f: GRAIL.ALTAR - 6.6,
    at: [
      [-7.4, 0],
      [7.4, 0]
    ],
    size: 1.8,
    kinds: [
      ["soldier", 75],
      ["donovan", 10, { pts: 250 }],
      ["indy", 15, { dont: true }]
    ]
  });
  for (const f of [10, 24, 38])
    L.pops({
      fixed: true,
      f,
      at: [
        [-(R.W - 0.7), 0],
        [R.W - 0.7, 0]
      ],
      size: 1.8,
      kinds: [
        ["soldier", 55],
        ["colonel", 15, { pts: 75 }],
        ["donovan", 10, { pts: 250 }],
        ["henry", 10, { dont: true }],
        ["indy", 10, { dont: true }]
      ]
    });
};

const grailWave = (R, add, c) => {
  const D = GRAIL;
  const out = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      R(0, 1) < 0.85 ? "i_soldierRun" : "i_colonelRun",
      rush(
        R,
        [
          [s * (D.W - 0.7), pick(R, [10, 24, 38]), G],
          [s * R(2, 8), R(4, 9), G]
        ],
        R(3, 4) * c.S
      )
    );
  };
  const rocks = n => {
    for (let k = 0; k < n; k++)
      add(
        2 + (k * 24) / n + R(0, 1),
        "i_pot",
        toss(R, { u: R(-8, 8), f: R(10, 30), h: G + D.CEIL - 0.5, vh: 0, vu: 0 })
      );
  };
  if (c.x2) {
    // the temple's coming down
    for (let k = 0; k < 8; k++) out(1 + k * 2.8);
    add(
      5,
      "i_donovanRun",
      rush(
        R,
        [
          [-(D.W - 0.7), 24, G],
          [-3, 9, G]
        ],
        2.2 * c.S
      )
    );
    rocks(8);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(1.4); j++) out(R(1, 22));
  if (k === 3)
    add(
      R(2, 14),
      "i_donovanRun",
      rush(
        R,
        [
          [D.W - 0.7, 38, G],
          [R(2, 6), R(8, 12), G]
        ],
        2.2 * c.S
      )
    );
  if (k === 1 || k === 4)
    for (let j = 0; j < 1 + n(1); j++)
      add(
        R(2, 22),
        "i_grenade",
        lobbed(R, {
          u: pick(R, [-1, 1]) * (D.W - 1),
          f: pick(R, [10, 24]),
          h: G + 1.4,
          vh: R(3, 4.5),
          vu: R(-2, 2),
          vf: -R(2, 4)
        })
      );
  if (k === 2 || k === 5) flyers(["i_bat", "i_bat"], R, add, c, 2 + n(1));
  if (R(0, 1) < 0.3) add(R(2, 18), "i_henryRun", cross(R, { u0: -8, u1: 8, f: R(12, 18), v: 1.6 }));
  if (R(0, 1) < 0.2) add(R(2, 18), "i_indyRun", cross(R, { u0: 9, u1: -9, f: R(10, 16), v: 3 }));
};

// ---- Sound ------------------------------------------------------------------------

Object.assign(AMBIENCE, {
  indy_peru(d, sr, R) {
    bed(d, sr, R, { wind: 0.8, insects: 0.02, birds: 0.04 });
    raiders(d, sr, R, 0.03);
  },
  indy_raven(d, sr, R) {
    bed(d, sr, R, { wind: 2.2, crowd: 0.5, fire: 0.6 });
  },
  indy_cairo(d, sr, R) {
    bed(d, sr, R, { wind: 0.6, crowd: 1.0, birds: 0.02 });
  },
  indy_well(d, sr, R) {
    bed(d, sr, R, { wind: 0.5, hiss: 0.25, hum: [55, 0.04], fire: 0.3 });
  },
  indy_grail(d, sr, R) {
    bed(d, sr, R, { wind: 1.2, hum: [110, 0.02] });
    raiders(d, sr, R, 0.025);
  }
});

// ---- The campaign ------------------------------------------------------------------

export const INDY = {
  name: "INDIANA JONES",
  first: "Peru, 1936. The golden idol is in the temple",
  kinds,
  levels: [
    {
      world: "indy_peru",
      name: "THE TEMPLE IN THE JUNGLE",
      story: "Peru, 1936. The golden idol is in the temple",
      music: "",
      amb: "indy_peru",
      legend: "THE IDOL 100 · THE BOULDER 100 (OR RUN!) · DON'T SHOOT INDY",
      wave: peruWave,
      title: (w, x2) => (x2 ? "THE IDOL'S GONE · RUN! · DOUBLE POINTS" : null)
    },
    {
      world: "indy_raven",
      name: "THE RAVEN · NEPAL",
      story: "Marion's bar. Toht's men want the headpiece",
      music: "",
      amb: "indy_raven",
      indoor: true,
      legend: "TOHT 150 · SHOT GLASSES IN BANKS · DON'T SHOOT MARION",
      wave: ravenWave,
      title: (w, x2) => (x2 ? "THE BAR'S ON FIRE · DOUBLE POINTS" : null)
    },
    {
      world: "indy_cairo",
      name: "THE STREETS OF CAIRO",
      story: "They've taken Marion. Watch the baskets",
      music: "",
      amb: "indy_cairo",
      legend: "THE SWORDSMAN 100 · DON'T SHOOT SALLAH, MARION OR THE MONKEY",
      wave: cairoWave,
      title: (w, x2) => (x2 ? "THE SWORDSMAN · DOUBLE POINTS" : null)
    },
    {
      world: "indy_well",
      name: "THE WELL OF SOULS",
      story: "The Ark is down there. So are the snakes",
      music: "",
      amb: "indy_well",
      indoor: true,
      legend: "SNAKES 50 · BELLOQ 200 · DON'T SHOOT SALLAH OR MARION",
      wave: wellWave,
      title: (w, x2) => (x2 ? "SNAKES. WHY'D IT HAVE TO BE SNAKES? · DOUBLE POINTS" : null)
    },
    {
      world: "indy_grail",
      name: "THE TEMPLE OF THE GRAIL",
      story: "The canyon of the crescent moon. Choose wisely",
      music: "",
      amb: "indy_grail",
      indoor: true,
      legend: "JEWELLED CUPS IN BANKS · DONOVAN 250 · NEVER THE PLAIN CUP · DON'T SHOOT THE KNIGHT OR DAD",
      wave: grailWave,
      title: (w, x2) => (x2 ? "THE TEMPLE IS COMING DOWN · DOUBLE POINTS" : null)
    }
  ],
  done: ["YOU CHOSE WISELY", "THE GRAIL IS SAFE. IT BELONGS IN A MUSEUM"]
};
