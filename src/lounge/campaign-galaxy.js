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
  RIGS,
  WORLDS,
  CARDS,
  CARD_SIZE,
  AMBIENCE,
  merge
} from "./shoots-art";
import { LAYOUTS, PERSON, PLATE_SOUND } from "./plates";
import { SHAPES } from "./plates-shapes";
import { gunman, runner, thing, DONT, walk, cross, toss, across, hover, run, pick } from "./shoot-paths";
import {
  painter,
  BLACK,
  arms,
  legs,
  collect,
  kit,
  asGeo,
  rush,
  lobbed,
  skim,
  stride,
  flight,
  sheet,
  legAt
} from "./campaign-kit";

// The galaxy campaign (Jay, 2026-10-30: "add a space/alien level to the
// shooting gallery ... make it star wars and we could have the empire targets
// and the death star and storm troopers and the levels could be the
// different scenes like on the planet where he's from, and the one in the
// snow, and that lounge ... just make it as cool as you can"). Every gun is a
// blaster in it (skeet.js setLasers: red bolts, the bowcaster's green). Five
// levels, no classic first level (shoots.js CAMPAIGNS):
//   1 TATOOINE         the Lars farm under the twin suns: the homestead
//                      dome and its courtyard pit, moisture vaporators, a
//                      sandcrawler, a krayt dragon's bones; sandtroopers
//                      after the droids, Tusken raiders, speeder bikes,
//                      dewbacks (don't shoot the Jawas or the droids)
//   2 THE CANTINA      Mos Eisley: the round bar, the booths, the band; the
//                      stormtroopers come down the steps from the street
//                      (Greedo and Boba Fett in the booths; don't shoot the
//                      band, Chewie, Obi-Wan or Han)
//   3 HOTH             Echo Base's trenches: snowtroopers behind the ridges,
//                      AT-ATs walking in (hit the head), AT-STs that stop and
//                      fire, probe droids, a wampa in its cave (don't shoot
//                      the snowspeeders or the tauntauns)
//   4 THE DEATH STAR   docking bay 327: the Falcon on the deck, catwalks,
//                      blast doors, TIEs on the racks, space through the bay;
//                      Vader now and then (don't shoot Leia or Chewie)
//   5 THE TRENCH RUN   on the Death Star's surface at the head of the trench,
//                      Yavin in the sky: TIEs down the trench at you and over
//                      it, Vader on an X-wing's tail (don't hit the X-wings)
// Laid out as the other worlds are (u right, f downrange, h up from the roof
// deck, the ground at GROUND); shoots-art moves it all SHIFT m back and onto
// the lifted land.

const G = GROUND;

// Stormtrooper armour, white over the black body glove (sand: the
// sandtrooper's dirt and orange pauldron; snow: the snowtrooper's kama).
export function armour(p, o = {}) {
  const w = o.white || "#f2f3f5";
  const shade = o.shade || "#c8ccd4";
  p.poly([30, 48, 70, 48, 68, 104, 32, 104], BLACK);
  legs(p, w, w, { knee: BLACK });
  p.line([37, 150, 37, 180], 1.5, shade);
  p.line([63, 150, 63, 180], 1.5, shade);
  if (o.kama) p.poly([29, 98, 71, 98, 76, 152, 24, 152], o.kama);
  p.poly([31, 50, 69, 50, 67, 72, 50, 76, 33, 72], w);
  p.line([50, 52, 50, 74], 1.2, shade);
  p.poly([36, 78, 64, 78, 62, 96, 38, 96], w);
  p.line([38, 84, 62, 84], 1.2, shade);
  p.line([38, 90, 62, 90], 1.2, shade);
  p.poly([32, 96, 68, 96, 68, 104, 32, 104], w);
  for (const x of [36, 44, 52, 60]) p.poly([x, 98, x + 5, 98, x + 5, 103, x, 103], shade, 1);
  p.ell(25, 54, 7, 6, w);
  p.ell(75, 54, 7, 6, w);
  if (o.pauldron) p.ell(24, 53, 9, 7.5, o.pauldron);
  arms(p, w, BLACK, { rifle: true, elbow: BLACK });
  if (o.dirt)
    for (const [x, y, r] of [
      [40, 120, 6],
      [62, 170, 7],
      [55, 60, 5],
      [30, 188, 5],
      [66, 90, 4]
    ])
      p.ell(x, y, r, r * 0.6, "rgba(150,110,60,0.35)", 0);
}

export function trooperHelmet(p, o = {}) {
  const w = o.white || "#f2f3f5";
  p.poly([42, 42, 58, 42, 57, 50, 43, 50], BLACK);
  p.ell(50, 22, 17, 18, w);
  p.poly([34, 24, 66, 24, 67, 38, 60, 46, 40, 46, 33, 38], w);
  p.line([34, 25, 66, 25], 1.4, "#8a8f98");
  p.poly([37, 27, 47, 28, 46, 35, 38, 34], BLACK, 1);
  p.poly([53, 28, 63, 27, 62, 34, 54, 35], BLACK, 1);
  p.line([40, 36, 40, 41], 1.3, "#6a7aa0");
  p.line([60, 36, 60, 41], 1.3, "#6a7aa0");
  p.poly([41, 38, 59, 38, 57, 44, 43, 44], BLACK, 1);
  for (const x of [45, 50, 55]) p.line([x, 39, x, 43], 1, "#9aa0a8");
  p.ell(33, 31, 3, 4, "#b8bcc4", 1.2);
  p.ell(67, 31, 3, 4, "#b8bcc4", 1.2);
  if (o.dirt) p.ell(56, 14, 6, 3, "rgba(150,110,60,0.35)", 0);
}

Object.assign(CARDS, {
  trooper: (c, W) => {
    const p = painter(c, W);
    armour(p);
    trooperHelmet(p);
  },
  sandtrooper: (c, W) => {
    const p = painter(c, W);
    armour(p, { white: "#ece2cc", shade: "#b8aa90", pauldron: "#e8701a", dirt: true });
    trooperHelmet(p, { white: "#ece2cc", dirt: true });
  },
  snowtrooper: (c, W) => {
    const p = painter(c, W);
    armour(p, { white: "#eef1f4", shade: "#b8c0cc", kama: "#e4e8ee" });
    p.poly([16, 50, 84, 50, 80, 64, 20, 64], "#e4e8ee");
    // the hooded helmet: a flared cowl, the goggles, the breather
    p.poly([42, 42, 58, 42, 57, 50, 43, 50], BLACK);
    p.poly([28, 46, 30, 18, 40, 6, 60, 6, 70, 18, 72, 46], "#e4e8ee");
    p.poly([34, 22, 66, 22, 66, 32, 34, 32], BLACK, 1.5);
    p.line([36, 27, 64, 27], 1, "#4a5a7a");
    p.poly([42, 34, 58, 34, 56, 46, 44, 46], "#c8ccd4");
    for (const y of [37, 40, 43]) p.line([45, y, 55, y], 1, "#6a707a");
  },
  gunner: (c, W) => {
    const p = painter(c, W);
    legs(p, BLACK, "#2a2a2e");
    p.poly([30, 48, 70, 48, 68, 104, 32, 104], "#1e1e22");
    p.poly([38, 58, 62, 58, 62, 70, 38, 70], "#3a3e44", 1.5);
    for (const x of [42, 48, 54]) p.ell(x, 64, 2, 2, ["#e8344a", "#3aa0e8", "#e8e8e8"][(x - 42) / 6], 0.6);
    p.poly([32, 96, 68, 96, 68, 104, 32, 104], "#2a2a2e");
    arms(p, "#1e1e22", BLACK, { pistol: true });
    // the big black dome, the Imperial crests on its sides
    p.ell(50, 22, 21, 20, "#18181c");
    p.ell(44, 12, 6, 3, "rgba(255,255,255,0.18)", 0);
    p.poly([36, 26, 64, 26, 63, 40, 56, 46, 44, 46, 37, 40], "#2a2c30");
    p.poly([38, 28, 62, 28, 61, 34, 39, 34], "#0a0a0c", 1);
    p.ell(30, 24, 4, 4, "#c8ccd4", 1);
    p.ell(70, 24, 4, 4, "#c8ccd4", 1);
  },
  officer: (c, W) => {
    const p = painter(c, W);
    legs(p, "#5a6052", BLACK);
    p.poly([33, 152, 49, 152, 49, 196, 31, 196], BLACK);
    p.poly([51, 152, 67, 152, 69, 196, 51, 196], BLACK);
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], "#5a6052");
    p.poly([32, 96, 68, 96, 68, 101, 32, 101], BLACK, 1);
    p.poly([33, 56, 45, 56, 45, 62, 33, 62], "#c8ccd4", 1);
    for (const [x, col] of [
      [35, "#e8344a"],
      [38, "#3a6ae8"],
      [41, "#e8344a"]
    ])
      p.poly([x, 57, x + 2, 57, x + 2, 61, x, 61], col, 0);
    arms(p, "#5a6052", "#e0b896", { pistol: true });
    p.poly([44, 36, 56, 36, 56, 48, 44, 48], "#e0b896", 1.5);
    p.ell(50, 26, 11, 13, "#e0b896");
    p.line([45, 26, 47, 26], 1.6, BLACK);
    p.line([53, 26, 55, 26], 1.6, BLACK);
    p.line([46, 33, 54, 33], 1.4, "#8a5a4a");
    p.poly([36, 16, 64, 16, 66, 12, 62, 6, 38, 6, 34, 12], "#5a6052");
    p.poly([34, 16, 66, 16, 64, 20, 36, 20], BLACK, 1.5);
  },
  vader: (c, W) => {
    const p = painter(c, W);
    p.poly([22, 44, 78, 44, 94, 198, 6, 198], "#0a0a0c", 2.5);
    legs(p, "#141416", "#0e0e10");
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], "#18181c");
    p.poly([38, 58, 62, 58, 62, 74, 38, 74], "#4a4e55", 1.5);
    for (const [x, y, col] of [
      [42, 63, "#e8344a"],
      [47, 63, "#3aa0e8"],
      [52, 63, "#7fd18a"],
      [57, 63, "#e8344a"],
      [44, 69, "#e8e8e8"],
      [52, 69, "#e8e8e8"]
    ])
      p.poly([x - 1.5, y - 1.5, x + 1.5, y - 1.5, x + 1.5, y + 1.5, x - 1.5, y + 1.5], col, 0);
    p.poly([32, 94, 68, 94, 68, 102, 32, 102], "#2a2a2e");
    for (const x of [38, 47, 56]) p.poly([x, 95, x + 6, 95, x + 6, 101, x, 101], "#9aa0a8", 1);
    p.poly([19, 54, 29, 54, 30, 104, 21, 104], "#141416");
    p.poly([71, 54, 81, 54, 72, 90, 64, 86], "#141416");
    p.ell(25, 108, 4.5, 5, BLACK, 1.5);
    // the lightsaber, lit, raised from his right hand
    p.line([66, 90, 94, 34], 9, "rgba(255,40,30,0.35)");
    p.line([66, 90, 94, 34], 4.5, "#ff3a2a");
    p.line([66, 90, 94, 34], 1.6, "#ffe0d8");
    p.line([62, 98, 67, 88], 4, "#b8bcc4");
    p.ell(66, 90, 4, 4, BLACK, 1.5);
    // the helmet: the dome, its flared back, the mask
    p.poly([26, 24, 74, 24, 80, 46, 20, 46], "#0e0e10");
    p.ell(50, 20, 17, 17, "#141416");
    p.ell(43, 11, 6, 3, "rgba(255,255,255,0.2)", 0);
    p.poly([38, 22, 62, 22, 60, 36, 54, 46, 46, 46, 40, 36], "#1e1e22");
    p.ell(43, 27, 5, 3.6, "#2e3038", 1.2, -0.2);
    p.ell(57, 27, 5, 3.6, "#2e3038", 1.2, 0.2);
    p.poly([46, 33, 54, 33, 52, 44, 48, 44], "#4a4e55", 1);
    for (const y of [36, 39, 42]) p.line([47.5, y, 52.5, y], 0.8, "#1a1a1c");
  },
  tusken: (c, W) => {
    const p = painter(c, W);
    p.poly([28, 46, 72, 46, 78, 196, 22, 196], "#c8b08a");
    for (const y of [70, 100, 130, 160]) p.line([26, y, 74, y + 4], 1.5, "#9a8462");
    p.line([30, 50, 70, 100], 5, "#6a5238");
    p.poly([18, 52, 30, 50, 32, 110, 20, 112], "#bca47e");
    p.poly([70, 50, 82, 52, 80, 100, 70, 96], "#bca47e");
    p.ell(25, 114, 5, 5, "#9a8462", 1.5);
    // the gaffi stick, raised
    p.line([74, 196, 90, 26], 3.5, "#5a4a3a");
    p.poly([86, 24, 96, 20, 98, 30, 92, 36, 88, 32], "#8a8a8a", 1.5);
    p.ell(76, 96, 5, 5, "#9a8462", 1.5);
    // the wrapped head, goggles, the breath mask
    p.ell(50, 26, 15, 19, "#b8a07a");
    for (const y of [14, 20, 36, 42]) p.line([37, y, 63, y - 2], 1.4, "#8a7454");
    p.ell(43, 25, 5.5, 5.5, "#3a3a3a", 1.5);
    p.ell(57, 25, 5.5, 5.5, "#3a3a3a", 1.5);
    p.ell(43, 25, 2.5, 2.5, "#1a1a1a", 0);
    p.ell(57, 25, 2.5, 2.5, "#1a1a1a", 0);
    p.poly([45, 33, 55, 33, 56, 43, 44, 43], "#6a6a6a", 1.5);
    for (const x of [47, 50, 53]) p.line([x, 34, x, 42], 0.8, "#3a3a3a");
  },
  jawa: (c, W) => {
    const p = painter(c, W);
    p.poly([30, 34, 70, 34, 82, 146, 18, 146], "#6a4a30");
    p.line([26, 60, 74, 90], 4, "#3a2a1a");
    p.poly([28, 46, 34, 10, 50, 2, 66, 10, 72, 46], "#6a4a30");
    p.ell(50, 32, 13, 12, "#080808", 1.5);
    p.glow(43, 31, 7, "rgba(255,210,60,0.8)");
    p.glow(57, 31, 7, "rgba(255,210,60,0.8)");
    p.ell(43, 31, 3.2, 2.6, "#ffd23a", 0);
    p.ell(57, 31, 3.2, 2.6, "#ffd23a", 0);
    p.ell(30, 96, 5, 5, "#5a3a24", 1.5);
    p.ell(70, 96, 5, 5, "#5a3a24", 1.5);
  },
  greedo: (c, W) => {
    const p = painter(c, W);
    legs(p, "#7a8a7a", "#5a4a3a");
    p.poly([30, 48, 70, 48, 68, 104, 32, 104], "#7a8a7a");
    p.poly([31, 48, 46, 48, 44, 100, 32, 100], "#5a4a3a");
    p.poly([54, 48, 69, 48, 68, 100, 56, 100], "#5a4a3a");
    arms(p, "#7a8a7a", "#5a8a4a", { pistol: true });
    p.poly([44, 38, 56, 38, 55, 50, 45, 50], "#5a8a4a");
    p.ell(50, 22, 15, 18, "#5a8a4a");
    for (const [x, y] of [
      [42, 6],
      [50, 4],
      [58, 6],
      [38, 12],
      [62, 12]
    ])
      p.line([x, y + 4, x + (x - 50) * 0.15, y - 2], 1.6, "#3a6a2a");
    p.ell(41, 20, 6.5, 7.5, "#0c0c0e", 1.2, -0.3);
    p.ell(59, 20, 6.5, 7.5, "#0c0c0e", 1.2, 0.3);
    p.ell(39, 17, 2, 2, "rgba(255,255,255,0.5)", 0);
    p.ell(57, 17, 2, 2, "rgba(255,255,255,0.5)", 0);
    p.poly([45, 28, 55, 28, 54, 40, 46, 40], "#4a7a3a", 1.5);
    p.line([47, 39, 53, 39], 1.2, "#2a4a1a");
  },
  boba: (c, W) => {
    const p = painter(c, W);
    p.poly([22, 48, 30, 46, 34, 150, 18, 160], "#6a5a3a");
    legs(p, "#8a8a72", "#4a3a2a", { knee: "#c8a040" });
    p.poly([30, 48, 70, 48, 68, 104, 32, 104], "#8a8a72");
    p.poly([33, 52, 67, 52, 65, 74, 35, 74], "#5a6a4a");
    p.poly([36, 54, 47, 54, 46, 64, 37, 64], "#c8a040", 1);
    p.poly([53, 54, 64, 54, 63, 64, 54, 64], "#c8a040", 1);
    p.poly([32, 96, 68, 96, 68, 104, 32, 104], "#4a3a2a");
    arms(p, "#8a8a72", "#3a2a1a", { rifle: true, gun: "#3a3e44" });
    p.ell(25, 54, 7, 6, "#7a2a20");
    p.ell(75, 54, 7, 6, "#5a6a4a");
    // the helmet, its T visor, the rangefinder
    p.poly([42, 42, 58, 42, 57, 50, 43, 50], "#3a3a32");
    p.poly([34, 8, 66, 8, 68, 40, 62, 46, 38, 46, 32, 40], "#5a6a4a");
    p.poly([38, 18, 62, 18, 62, 24, 54, 24, 54, 40, 46, 40, 46, 24, 38, 24], BLACK, 1);
    p.poly([60, 4, 64, 4, 64, -2, 60, -2], "#3a3a32", 0);
    p.line([66, 12, 72, 0], 2, "#3a3a32");
    p.ell(58, 32, 3, 2, "#b8402a", 0);
  },
  bith: (c, W) => {
    const p = painter(c, W);
    legs(p, "#3a2a40", "#2a1a2a");
    p.poly([28, 48, 72, 48, 74, 150, 26, 150], "#3a2a40");
    p.poly([19, 56, 29, 56, 42, 84, 34, 88], "#3a2a40");
    p.poly([71, 56, 81, 56, 62, 86, 56, 82], "#3a2a40");
    // the horn (a kloo horn: a long black pipe, silver keys)
    p.line([50, 46, 50, 130], 4, BLACK);
    p.poly([44, 128, 56, 128, 60, 140, 40, 140], "#c8ccd4", 1.5);
    for (const y of [70, 80, 90, 100]) p.ell(50, y, 1.6, 1.6, "#c8ccd4", 0);
    p.ell(40, 86, 4, 4, "#e8b8a8", 1.2);
    p.ell(58, 84, 4, 4, "#e8b8a8", 1.2);
    p.ell(50, 24, 19, 22, "#e8b8a8");
    for (const y of [10, 16]) p.line([38, y, 62, y], 1.2, "#c8908a");
    p.ell(42, 32, 4.5, 5.5, "#0c0c0e", 1);
    p.ell(58, 32, 4.5, 5.5, "#0c0c0e", 1);
    p.line([44, 40, 56, 40], 1.2, "#b07a72");
    p.line([46, 44, 54, 44], 1.2, "#b07a72");
  },
  chewie: (c, W) => {
    const p = painter(c, W);
    const fur = "#7a5a38";
    p.poly([33, 104, 49, 104, 49, 196, 31, 196], fur);
    p.poly([51, 104, 67, 104, 69, 196, 51, 196], fur);
    p.poly([26, 40, 74, 40, 72, 110, 28, 110], fur);
    for (let k = 0; k < 14; k++)
      p.line([28 + k * 3.3, 50 + (k % 3) * 20, 29 + k * 3.3, 60 + (k % 3) * 20], 1.2, "#5a4026");
    p.line([30, 44, 70, 104], 6, "#4a3420");
    for (let k = 1; k < 7; k++)
      p.poly(
        [30 + k * 6, 40 + k * 9, 35 + k * 6, 40 + k * 9, 35 + k * 6, 45 + k * 9, 30 + k * 6, 45 + k * 9],
        "#b8bcc4",
        1
      );
    p.poly([16, 48, 28, 46, 30, 112, 18, 114], fur);
    p.poly([72, 46, 84, 48, 82, 114, 70, 112], fur);
    p.ell(50, 24, 14, 18, fur);
    p.ell(50, 30, 8, 7, "#a8845a", 0);
    p.ell(44, 22, 2.6, 2, "#1a1a1a", 0);
    p.ell(56, 22, 2.6, 2, "#1a1a1a", 0);
    p.ell(50, 29, 3, 2, "#1a1a1a", 0);
  },
  leia: (c, W) => {
    const p = painter(c, W);
    p.poly([30, 46, 70, 46, 76, 196, 24, 196], "#f4f2ee");
    p.poly([32, 96, 68, 96, 68, 101, 32, 101], "#c8ccd4", 1);
    p.poly([20, 54, 30, 50, 34, 104, 24, 106], "#f4f2ee");
    p.poly([70, 50, 80, 54, 76, 106, 66, 104], "#f4f2ee");
    p.ell(29, 108, 4, 4, "#f0d0b0", 1.5);
    p.ell(71, 108, 4, 4, "#f0d0b0", 1.5);
    p.poly([66, 104, 80, 101, 81, 107, 68, 110], BLACK, 1.5);
    p.ell(50, 26, 12, 14, "#f0d0b0");
    p.poly([38, 22, 42, 12, 50, 10, 58, 12, 62, 22, 58, 18, 42, 18], "#5a3a20", 1.5);
    p.ell(35, 26, 7, 8, "#5a3a20");
    p.ell(65, 26, 7, 8, "#5a3a20");
    p.ell(45, 26, 1.6, 1.6, "#2a1a10", 0);
    p.ell(55, 26, 1.6, 1.6, "#2a1a10", 0);
    p.line([47, 33, 53, 33], 1.3, "#b05a5a");
  },
  luke: (c, W) => {
    const p = painter(c, W);
    legs(p, "#e8e0cc", "#4a3a2a");
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], "#f0eadc");
    p.line([40, 48, 54, 100], 2, "#c8bfa8");
    p.poly([32, 94, 68, 94, 68, 100, 32, 100], "#4a3a2a", 1.5);
    arms(p, "#f0eadc", "#f0d0b0");
    p.ell(50, 26, 12, 14, "#f0d0b0");
    p.poly([37, 22, 40, 10, 50, 7, 60, 10, 63, 22, 58, 15, 44, 15], "#c8a060", 1.5);
    p.ell(45, 26, 1.6, 1.6, "#2a3a5a", 0);
    p.ell(55, 26, 1.6, 1.6, "#2a3a5a", 0);
    p.line([46, 33, 54, 33], 1.3, "#a86a5a");
  },
  han: (c, W) => {
    const p = painter(c, W);
    legs(p, "#2a3448", BLACK, { stripe: "#c0182a" });
    p.poly([30, 46, 70, 46, 68, 104, 32, 104], "#f4f0e6");
    p.poly([31, 46, 44, 46, 42, 100, 32, 100], BLACK);
    p.poly([56, 46, 69, 46, 68, 100, 58, 100], BLACK);
    p.poly([32, 94, 68, 94, 68, 100, 32, 100], "#3a2414", 1.5);
    p.poly([60, 98, 70, 98, 70, 118, 62, 118], "#3a2414", 1.5);
    arms(p, "#f4f0e6", "#f0d0b0");
    p.ell(50, 26, 12, 14, "#f0d0b0");
    p.poly([37, 24, 39, 10, 50, 7, 62, 10, 63, 24, 58, 15, 42, 16], "#4a3020", 1.5);
    p.ell(45, 26, 1.6, 1.6, "#2a1a10", 0);
    p.ell(55, 26, 1.6, 1.6, "#2a1a10", 0);
    p.line([46, 33, 54, 32], 1.3, "#a86a5a");
  },
  obiwan: (c, W) => {
    const p = painter(c, W);
    p.poly([24, 44, 76, 44, 82, 196, 18, 196], "#6a4a2e");
    p.poly([36, 46, 64, 46, 62, 196, 38, 196], "#e0d4b8");
    p.poly([36, 94, 64, 94, 64, 100, 36, 100], "#8a6a46", 1.5);
    p.poly([14, 52, 28, 48, 32, 114, 18, 116], "#6a4a2e");
    p.poly([72, 48, 86, 52, 82, 116, 68, 114], "#6a4a2e");
    p.ell(50, 26, 12, 14, "#f0d0b0");
    p.poly([40, 30, 60, 30, 58, 44, 50, 48, 42, 44], "#d8d4cc", 1.5);
    p.poly([38, 20, 42, 12, 50, 10, 58, 12, 62, 20], "#c8c4bc", 1.5);
    p.ell(45, 25, 1.6, 1.6, "#2a3a5a", 0);
    p.ell(55, 25, 1.6, 1.6, "#2a3a5a", 0);
  },
  threepio: (c, W) => {
    const p = painter(c, W);
    const gold = "#d8a838";
    p.poly([35, 104, 47, 104, 47, 186, 36, 186], gold);
    p.poly([53, 104, 65, 104, 64, 186, 53, 186], gold);
    p.poly([33, 184, 49, 184, 50, 196, 32, 196], gold);
    p.poly([51, 184, 67, 184, 68, 196, 50, 196], gold);
    p.poly([32, 48, 68, 48, 66, 80, 34, 80], gold);
    p.poly([38, 80, 62, 80, 62, 96, 38, 96], "#5a5a5a");
    for (const [x, col] of [
      [41, "#e8344a"],
      [46, "#3aa0e8"],
      [51, "#f2c230"],
      [56, "#7fd18a"]
    ])
      p.line([x, 81, x + 1, 95], 1.4, col);
    p.poly([34, 96, 66, 96, 66, 106, 34, 106], gold);
    p.poly([20, 54, 30, 54, 32, 102, 24, 102], gold);
    p.poly([70, 54, 80, 54, 76, 102, 68, 102], gold);
    p.ell(50, 26, 13, 16, gold);
    p.glow(44, 24, 6, "rgba(255,220,80,0.8)");
    p.glow(56, 24, 6, "rgba(255,220,80,0.8)");
    p.ell(44, 24, 3.2, 3.2, "#fff0a0", 1);
    p.ell(56, 24, 3.2, 3.2, "#fff0a0", 1);
    p.poly([46, 32, 54, 32, 53, 36, 47, 36], "#5a4010", 1);
  },
  artoo: (c, W) => {
    const p = painter(c, W);
    // (100 x 140) the legs either side, the body, the dome
    p.poly([6, 50, 20, 50, 22, 126, 4, 126], "#f0f2f4");
    p.poly([80, 50, 94, 50, 96, 126, 78, 126], "#f0f2f4");
    p.poly([2, 124, 24, 124, 26, 136, 0, 136], "#c8ccd4");
    p.poly([76, 124, 98, 124, 100, 136, 74, 136], "#c8ccd4");
    p.poly([20, 44, 80, 44, 78, 120, 22, 120], "#f0f2f4");
    for (const [x, y, w, h] of [
      [30, 52, 16, 22],
      [54, 52, 16, 10],
      [54, 66, 16, 8],
      [30, 80, 40, 6],
      [34, 92, 32, 18]
    ])
      p.poly([x, y, x + w, y, x + w, y + h, x, y + h], "#2f5ab8", 1.2);
    p.poly([20, 44, 22, 26, 34, 10, 50, 6, 66, 10, 78, 26, 80, 44], "#c8ccd4");
    p.poly([28, 30, 40, 30, 40, 40, 28, 40], "#2f5ab8", 1);
    p.poly([58, 22, 70, 22, 70, 30, 58, 30], "#2f5ab8", 1);
    p.ell(50, 26, 6, 6, "#151515", 1.5);
    p.ell(50, 26, 2.4, 2.4, "#e8344a", 0);
    p.ell(64, 38, 2.4, 2.4, "#3aa0e8", 1);
  },
  rebel: (c, W) => {
    const p = painter(c, W);
    legs(p, "#8a8070", "#4a4038");
    p.poly([28, 46, 72, 46, 72, 128, 28, 128], "#a89a80");
    p.poly([30, 94, 70, 94, 70, 100, 30, 100], "#5a4a3a", 1.5);
    arms(p, "#a89a80", "#3a3028", { rifle: true, gun: "#3a3a3a" });
    p.ell(50, 28, 12, 14, "#f0d0b0");
    p.poly([36, 26, 37, 12, 50, 8, 63, 12, 64, 26, 60, 20, 40, 20], "#c8c0b0", 1.5);
    p.poly([38, 22, 62, 22, 62, 28, 38, 28], "#2a3a4a", 1.2);
    p.poly([40, 34, 60, 34, 58, 44, 42, 44], "#d8d0c0", 1.2);
  },
  wampa: (c, W) => {
    const p = painter(c, W);
    const fur = "#eef0f2";
    p.poly([30, 120, 48, 120, 48, 196, 26, 196], fur);
    p.poly([52, 120, 70, 120, 74, 196, 52, 196], fur);
    p.poly([18, 44, 82, 44, 76, 128, 24, 128], fur);
    for (let k = 0; k < 12; k++) p.line([22 + k * 5, 60 + (k % 2) * 25, 24 + k * 5, 72 + (k % 2) * 25], 1.2, "#c0c8d0");
    p.poly([4, 10, 16, 6, 24, 48, 14, 52], fur);
    p.poly([84, 6, 96, 10, 86, 52, 76, 48], fur);
    for (const x of [4, 9, 14]) p.line([x, 8, x - 2, 0], 2, "#c8b090");
    for (const x of [86, 91, 96]) p.line([x, 8, x + 2, 0], 2, "#c8b090");
    p.ell(50, 30, 16, 16, fur);
    p.poly([40, 26, 60, 26, 58, 44, 42, 44], "#8a4a3a", 1.5);
    p.ell(45, 30, 2, 1.6, "#ffd23a", 0);
    p.ell(55, 30, 2, 1.6, "#ffd23a", 0);
    p.line([44, 40, 56, 40], 1.5, "#2a1a10");
    p.line([34, 22, 28, 12, 32, 6], 3, "#c8b090");
    p.line([66, 22, 72, 12, 68, 6], 3, "#c8b090");
  }
});
const PEOPLE = {
  trooper: [0.9, 1.8],
  sandtrooper: [0.9, 1.8],
  snowtrooper: [0.9, 1.8],
  gunner: [0.9, 1.8],
  officer: [0.9, 1.8],
  vader: [1.0, 2.0],
  tusken: [0.9, 1.8],
  jawa: [0.62, 0.93],
  greedo: [0.9, 1.8],
  boba: [0.9, 1.8],
  bith: [0.9, 1.8],
  chewie: [1.05, 2.1],
  leia: [0.85, 1.7],
  luke: [0.88, 1.76],
  han: [0.9, 1.8],
  obiwan: [0.9, 1.8],
  threepio: [0.9, 1.8],
  artoo: [0.62, 0.87],
  rebel: [0.9, 1.8],
  wampa: [1.4, 2.8]
};
Object.assign(CARD_SIZE, PEOPLE);
for (const k of Object.keys(PEOPLE)) PERSON.add(k);
for (const k of ["trooper", "sandtrooper", "snowtrooper", "gunner", "boba"]) PLATE_SOUND[k] = "sizzle";
PLATE_SOUND.artoo = "beep";
PLATE_SOUND.threepio = "beep";

// ---- New outlines (the plates' atlas) ------------------------------------------

// A circle's points (for the round outlines).
const ring = (cx, cy, r, n = 24) =>
  Array.from({ length: n }, (_, k) => [
    cx + r * Math.cos((k / n) * 2 * Math.PI),
    cy + r * Math.sin((k / n) * 2 * Math.PI)
  ]).flat();
const closed = pts => [...pts, pts[0], pts[1]];

Object.assign(SHAPES, {
  // a womp rat, facing left
  womprat: {
    polys: [
      [10, 30, 20, 18, 40, 12, 70, 12, 92, 18, 104, 28, 104, 38, 90, 44, 30, 44, 14, 40],
      [0, 32, 12, 24, 22, 22, 22, 40, 10, 38],
      [24, 15, 28, 3, 35, 14],
      [30, 43, 26, 54, 34, 54, 38, 43],
      [80, 43, 78, 54, 86, 54, 90, 43]
    ],
    lines: [[4, 102, 32, 118, 30, 128, 36, 138, 33]],
    dots: [[13, 29, 2.5]]
  },
  // a stormtrooper's helmet, face on
  helmet: {
    polys: [
      [
        40, 0, 56, 3, 68, 12, 74, 26, 75, 44, 72, 58, 66, 70, 60, 80, 52, 88, 28, 88, 20, 80, 14, 70, 8, 58, 5, 44, 6,
        26, 12, 12, 24, 3
      ]
    ],
    marks: [
      [9, 24, 41, 34, 42],
      [9, 46, 42, 56, 41],
      [5, 28, 67, 34, 62, 46, 62, 52, 67],
      [2, 36, 64, 36, 73],
      [2, 40, 64, 40, 74],
      [2, 44, 64, 44, 73],
      [2.5, 9, 30, 40, 26, 71, 30],
      [2, 28, 49, 28, 58],
      [2, 52, 49, 52, 58]
    ],
    dots: [
      [9, 48, 3.5],
      [71, 48, 3.5]
    ]
  },
  // the Imperial crest
  crest: {
    polys: [ring(50, 50, 50, 30)],
    marks: [
      [7, ...closed(ring(50, 50, 41, 30))],
      [6, ...closed(ring(50, 50, 16, 20))],
      ...Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2;
        return [7, 50 + 16 * Math.cos(a), 50 + 16 * Math.sin(a), 50 + 41 * Math.cos(a), 50 + 41 * Math.sin(a)];
      })
    ]
  },
  // a TIE fighter coming at you: |-o-|
  tie: {
    polys: [
      [0, 0, 11, 6, 11, 94, 0, 100],
      [109, 6, 120, 0, 120, 100, 109, 94],
      [11, 45, 40, 45, 40, 55, 11, 55],
      [80, 45, 109, 45, 109, 55, 80, 55],
      ring(60, 50, 23, 22)
    ],
    marks: [
      [4, ...closed(ring(60, 50, 12, 16))],
      [2.5, 48, 50, 72, 50],
      [2.5, 60, 38, 60, 62]
    ]
  },
  // a TIE fighter's wing, side on: the hexagon and its spokes
  tieside: {
    polys: [[25, 0, 75, 0, 100, 43, 75, 86, 25, 86, 0, 43]],
    marks: [
      [4, 25, 0, 75, 86],
      [4, 75, 0, 25, 86],
      [4, 0, 43, 100, 43],
      [5, ...closed(ring(50, 43, 9, 12))]
    ]
  },
  // an Imperial probe droid
  probe: {
    polys: [
      [20, 0, 60, 0, 72, 10, 76, 26, 70, 40, 10, 40, 4, 26, 8, 10],
      [28, 40, 52, 40, 48, 52, 32, 52]
    ],
    lines: [
      [3, 32, 52, 18, 92],
      [3, 37, 52, 32, 100],
      [3, 40, 52, 40, 104],
      [3, 43, 52, 48, 100],
      [3, 48, 52, 62, 92],
      [2, 30, 0, 24, -16],
      [2, 52, 0, 58, -20]
    ],
    dots: [
      [24, 22, 4],
      [40, 25, 4.5],
      [56, 22, 4]
    ]
  },
  // a mouse droid, facing left
  mouse: {
    polys: [
      [0, 30, 8, 14, 60, 8, 66, 14, 66, 34, 0, 34],
      [12, 8, 24, 8, 24, 14, 12, 14]
    ],
    marks: [[2, 10, 24, 60, 24]],
    dots: [
      [14, 36, 4],
      [54, 36, 4]
    ]
  },
  // a turbolaser tower
  turret: {
    polys: [
      [10, 100, 90, 100, 80, 60, 20, 60],
      [20, 60, 80, 60, 80, 30, 20, 30],
      [30, 30, 37, 30, 37, 0, 30, 0],
      [63, 30, 70, 30, 70, 0, 63, 0]
    ],
    marks: [
      [3, 28, 45, 72, 45],
      [3, 20, 80, 80, 80]
    ]
  },
  // an AT-AT, side on, facing left
  atat: {
    polys: [
      [30, 10, 120, 10, 128, 20, 124, 40, 30, 42, 24, 24],
      [0, 26, 6, 18, 22, 18, 26, 30, 22, 38, 2, 38],
      [20, 22, 32, 20, 32, 34, 22, 32],
      [32, 94, 48, 94, 48, 100, 32, 100],
      [48, 94, 64, 94, 64, 100, 48, 100],
      [90, 94, 106, 94, 106, 100, 90, 100],
      [106, 94, 122, 94, 122, 100, 106, 100]
    ],
    lines: [
      [8, 40, 42, 37, 70, 40, 95],
      [8, 56, 42, 59, 70, 56, 95],
      [8, 98, 42, 95, 70, 98, 95],
      [8, 114, 42, 117, 70, 114, 95],
      [3, 2, 34, -8, 36]
    ],
    marks: [[2, 34, 26, 120, 26]]
  },
  // a scout trooper on a speeder bike, facing left
  speeder: {
    polys: [
      [0, 40, 12, 34, 40, 34, 70, 30, 104, 32, 110, 40, 100, 46, 60, 46, 20, 44],
      [-14, 30, -2, 30, -2, 46, -14, 46],
      [56, 4, 72, 4, 76, 30, 56, 32],
      [57, -12, 70, -12, 74, -4, 70, 4, 58, 4, 55, -4]
    ],
    lines: [
      [4, 26, 38, -4, 38],
      [5, 60, 12, 40, 30],
      [6, 66, 30, 80, 40]
    ],
    marks: [[3, 56, -5, 64, -5]]
  },
  // a sandtrooper on a dewback, facing left
  dewback: {
    polys: [
      [20, 40, 40, 30, 90, 30, 110, 36, 130, 40, 152, 48, 110, 52, 40, 56, 22, 52],
      [0, 38, 6, 30, 22, 30, 26, 44, 4, 46],
      [62, 4, 78, 4, 80, 30, 60, 30],
      [62, -12, 76, -12, 78, -2, 76, 4, 62, 4, 60, -2]
    ],
    lines: [
      [8, 40, 54, 34, 72],
      [8, 56, 54, 62, 72],
      [8, 92, 52, 86, 72],
      [8, 108, 52, 114, 72],
      [6, 72, 30, 84, 40]
    ],
    marks: [[3, 61, -4, 70, -4]],
    dots: [[10, 36, 2.5]]
  },
  // a rebel on a tauntaun, facing left
  tauntaun: {
    polys: [
      [40, 30, 70, 26, 84, 40, 80, 60, 52, 64, 40, 50],
      [40, 30, 30, 8, 16, 4, 6, 10, 14, 16, 30, 22, 38, 40],
      [52, -12, 66, -12, 70, 24, 50, 26],
      [52, -26, 64, -26, 66, -16, 64, -12, 52, -12, 50, -18]
    ],
    lines: [
      [3, 26, 6, 34, -6, 40, 2],
      [7, 50, 62, 46, 82, 56, 96],
      [7, 70, 60, 74, 82, 64, 96],
      [4, 80, 50, 100, 62],
      [6, 60, 24, 72, 36]
    ],
    dots: [[14, 9, 2]]
  },
  // the thermal exhaust port
  port: {
    polys: [ring(50, 50, 50, 28)],
    marks: [
      [8, ...closed(ring(50, 50, 38, 24))],
      [4, 22, 38, 78, 38],
      [4, 18, 50, 82, 50],
      [4, 22, 62, 78, 62]
    ]
  }
});
Object.assign(PLATE_SOUND, {
  helmet: "sizzle",
  probe: "beep",
  mouse: "beep",
  tie: "clank",
  tieside: "clank",
  turret: "clank",
  atat: "clank",
  port: "bell"
});

// ---- Ships and walkers -------------------------------------------------------------

// (a hexagon standing on a point, its flat sides front and back: a TIE's wing)
const HEX = (r, t) => new THREE.CylinderGeometry(r, r, t, 6, 1, false, Math.PI / 6);

export const HULL = 0x8a9098;
export const PANEL = 0x23272d;
export const FRAME = 0x5a6068;

export function tieCockpit(add, r = 0.62) {
  add(BALL(r, 12), HULL, 0, 0, 0);
  add(CYL(r * 0.55, r * 0.55, 0.06, 10), 0x1a1c20, 0, 0, -r * 0.97, Math.PI / 2);
  add(TORUS(r * 0.58, 0.05, 12), HULL, 0, 0, -r * 0.97);
  for (let k = 0; k < 4; k++) add(BOX(r * 1.08, 0.035, 0.03), FRAME, 0, 0, -r - 0.01, 0, 0, (k * Math.PI) / 4);
  add(CYL(0.12, 0.12, 0.2, 8), FRAME, 0, r * 0.95, 0.1);
}
// A TIE/ln: the ball, the pylons, two hexagonal wings with their spokes.
export function tieLn(add) {
  tieCockpit(add);
  for (const s of [-1, 1]) {
    add(BOX(0.95, 0.24, 0.32), HULL, s * 0.95, 0, 0);
    add(HEX(1.62, 0.07), FRAME, s * 1.48, 0, 0, 0, 0, Math.PI / 2);
    add(HEX(1.5, 0.1), PANEL, s * 1.48, 0, 0, 0, 0, Math.PI / 2);
    for (let k = 0; k < 3; k++) add(BOX(0.12, 3.1, 0.07), FRAME, s * (1.48 + s * 0.06), 0, 0, (k * Math.PI) / 3, 0, 0);
    add(CYL(0.22, 0.22, 0.14, 8), HULL, s * 1.46, 0, 0, 0, 0, Math.PI / 2);
  }
}
// A TIE interceptor: dagger wings, four blades a side.
function tieInterceptor(add) {
  tieCockpit(add, 0.56);
  for (const s of [-1, 1]) {
    add(BOX(0.85, 0.22, 0.3), HULL, s * 0.85, 0, 0);
    add(CYL(0.2, 0.2, 0.14, 8), HULL, s * 1.3, 0, 0, 0, 0, Math.PI / 2);
    for (const t of [-1, 1]) {
      add(BOX(0.08, 1.75, 0.62), PANEL, s * 1.36, t * 0.78, -0.18, t * 0.42, 0, 0);
      add(BOX(0.09, 1.8, 0.08), FRAME, s * 1.37, t * 0.8, 0.1, t * 0.42, 0, 0);
      add(CYL(0.03, 0.03, 0.5, 5), FRAME, s * 1.36, t * 1.55, -0.6, Math.PI / 2);
    }
  }
}
// Vader's TIE Advanced: a bigger ball with its tail, wings bent in.
function tieAdvanced(add) {
  tieCockpit(add, 0.68);
  add(BOX(0.7, 0.6, 1.0), HULL, 0, 0, 0.6);
  for (const s of [-1, 1]) {
    add(BOX(0.8, 0.26, 0.5), HULL, s * 0.95, 0, 0.1);
    add(BOX(0.12, 0.5, 1.9), PANEL, s * 1.4, 0, 0.1);
    for (const t of [-1, 1]) {
      add(BOX(0.1, 1.25, 1.9), PANEL, s * 1.18, t * 0.82, 0.1, 0, 0, -s * t * 0.55);
      add(BOX(0.11, 1.3, 0.08), FRAME, s * 1.19, t * 0.84, -0.86, 0, 0, -s * t * 0.55);
    }
  }
}
// An X-wing (red five), its S-foils open.
export function xwing(add) {
  const W = 0xe0e2de;
  add(BOX(0.52, 0.46, 3.0), W, 0, 0, 0.3);
  add(CONE(0.3, 1.6, 4), W, 0, -0.02, -1.95, -Math.PI / 2, Math.PI / 4, 0);
  add(BOX(0.36, 0.22, 0.8), 0x2a3038, 0, 0.3, -0.2);
  add(BALL(0.12, 6), 0xe8344a, 0, 0.32, 0.6);
  for (const s of [-1, 1])
    for (const t of [-1, 1]) {
      const a = s * t * 0.26;
      add(BOX(2.3, 0.05, 0.9), W, s * 1.35, t * 0.36, 0.95, 0, 0, a);
      add(BOX(0.5, 0.06, 0.25), 0xc0182a, s * 1.9, t * 0.5, 0.8, 0, 0, a);
      add(CYL(0.17, 0.17, 1.2, 8), 0xb8bcc4, s * 0.45, t * 0.3, 0.9, Math.PI / 2);
      add(CYL(0.035, 0.035, 1.9, 5), 0x8a8e94, s * 2.45, t * 0.67, 0.1, Math.PI / 2);
      add(CYL(0.13, 0.13, 0.05, 8), 0xffb04a, s * 0.45, t * 0.3, 1.52, Math.PI / 2);
    }
}
// A snowspeeder: the white wedge, the orange stripes.
function snowspeeder(add) {
  add(BOX(1.7, 0.45, 2.2), 0xe8eaec, 0, 0, 0.3);
  add(BOX(1.7, 0.3, 1.2), 0xe8eaec, 0, -0.06, -1.2, 0.22, 0, 0);
  add(BOX(1.2, 0.3, 0.9), 0x2a3038, 0, 0.32, 0.1, -0.2, 0, 0);
  for (const s of [-1, 1]) {
    add(BOX(0.35, 0.47, 1.6), 0xe8701a, s * 0.62, 0.01, 0.1);
    add(CYL(0.2, 0.2, 1.1, 8), 0xb8bcc4, s * 1.0, 0, 1.0, Math.PI / 2);
    add(CYL(0.025, 0.025, 1.0, 5), 0x6a6e74, s * 0.8, -0.05, -1.7, Math.PI / 2);
  }
}
// An Imperial probe droid: the black head, its eyes, the legs hanging.
function probeDroid(add) {
  add(BALL(0.42, 10), 0x24262a, 0, 0, 0, 0, 0, 0, 1, 0.85, 1);
  for (const [x, y] of [
    [-0.18, 0.02],
    [0, -0.04],
    [0.18, 0.02]
  ])
    add(BALL(0.07, 6), 0x5a1a1a, x, y, -0.38);
  add(CYL(0.1, 0.16, 0.35, 8), 0x2e3034, 0, -0.45, 0);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    add(
      CYL(0.02, 0.015, 1.4, 4),
      0x3a3c40,
      Math.cos(a) * 0.14,
      -1.25,
      Math.sin(a) * 0.14,
      Math.sin(a) * 0.15,
      0,
      -Math.cos(a) * 0.15
    );
  }
  add(CYL(0.012, 0.012, 0.7, 4), 0x3a3c40, 0.1, 0.55, 0.05, 0, 0, -0.2);
  add(CYL(0.012, 0.012, 0.5, 4), 0x3a3c40, -0.12, 0.48, 0.05, 0, 0, 0.3);
}
function thermal(add) {
  add(BALL(0.11, 10), 0xb8bcc4, 0, 0, 0, 0, 0, 0, 1, 1, 1);
  add(CYL(0.113, 0.113, 0.04, 10), 0x4a4e55, 0, 0, 0);
  for (let k = 0; k < 3; k++) add(BALL(0.018, 4), 0xff3a2a, Math.cos(k * 2) * 0.1, 0.03, Math.sin(k * 2) * 0.1);
}

GEO.tie = asGeo(tieLn);
GEO.tieI = asGeo(tieInterceptor);
GEO.tieV = asGeo(tieAdvanced);
GEO.xwing = asGeo(xwing);
GEO.snowspeeder = asGeo(snowspeeder);
GEO.probe = asGeo(probeDroid);
GEO.thermal = asGeo(thermal);

// An AT-AT: its origin under the head (so a shot at the head is the hit), the
// body behind it, four legs on pivots at its belly. Eleven metres high.
function atatBody(add) {
  const C = 0x9aa0a8;
  const D = 0x6a7078;
  add(BOX(1.5, 1.35, 2.3), C, 0, 7.4, 0);
  add(BOX(1.1, 0.5, 0.6), D, 0, 7.0, -1.15);
  for (const s of [-1, 1]) add(CYL(0.08, 0.08, 1.2, 5), 0x3a3e44, s * 0.4, 6.95, -1.6, Math.PI / 2);
  add(BOX(1.0, 1.0, 1.8), D, 0, 7.8, 1.6, -0.15, 0, 0);
  add(BOX(3.0, 2.7, 6.6), C, 0, 8.3, 5.4);
  add(BOX(3.1, 0.5, 6.7), D, 0, 9.55, 5.4);
  add(BOX(3.02, 0.25, 6.4), D, 0, 7.2, 5.4);
  for (const z of [3.3, 5.4, 7.5]) add(BOX(3.08, 2.3, 0.1), D, 0, 8.3, z);
  add(BOX(2.6, 1.6, 0.6), C, 0, 8.1, 2.0, 0.3, 0, 0);
}
function atatLeg(add) {
  const C = 0x8a9098;
  add(BOX(0.8, 0.8, 0.9), C, 0, -0.2, 0);
  add(BOX(0.55, 3.0, 0.7), C, 0, -1.9, 0);
  add(BALL(0.45, 8), 0x6a7078, 0, -3.4, 0);
  add(BOX(0.5, 2.9, 0.6), C, 0, -4.9, 0);
  add(CYL(0.72, 0.85, 0.5, 10), 0x6a7078, 0, -6.55, 0);
}
RIGS.atat = () => {
  const P = [];
  atatBody(collect(P));
  const legGeo = asGeo(atatLeg)();
  return {
    body: merge(P),
    legs: [
      [-1.25, 2.9, 0],
      [1.25, 2.9, Math.PI],
      [-1.25, 7.9, Math.PI],
      [1.25, 7.9, 0]
    ].map(([x, z, ph]) => ({ geo: legGeo, at: [x, 6.8, z], ph, amp: 0.24 })),
    stride: 6.8
  };
};
// An AT-ST: the cockpit on two legs, chin guns.
export function atstBody(add) {
  const C = 0x9aa0a8;
  add(BOX(1.6, 1.1, 1.7), C, 0, 4.4, 0);
  add(BOX(1.4, 0.5, 0.5), 0x6a7078, 0, 4.0, -0.85, 0.3, 0, 0);
  add(BOX(1.0, 0.18, 0.08), 0x1a1c20, 0, 4.55, -0.86);
  for (const s of [-1, 1]) {
    add(CYL(0.06, 0.06, 0.8, 5), 0x3a3e44, s * 0.35, 3.85, -1.2, Math.PI / 2);
    add(BOX(0.3, 0.3, 0.9), 0x6a7078, s * 0.95, 4.2, -0.3);
    add(CYL(0.05, 0.05, 0.6, 5), 0x3a3e44, s * 0.95, 4.2, -1.0, Math.PI / 2);
  }
  add(BOX(1.0, 0.6, 0.8), 0x6a7078, 0, 3.6, 0.1);
}
export function atstLeg(add) {
  const C = 0x8a9098;
  add(BOX(0.35, 1.6, 0.4), C, 0, -0.7, -0.3, -0.4, 0, 0);
  add(BALL(0.22, 6), 0x6a7078, 0, -1.45, -0.62);
  add(BOX(0.28, 1.8, 0.32), C, 0, -2.3, -0.3, 0.38, 0, 0);
  add(BOX(0.75, 0.2, 0.95), 0x6a7078, 0, -3.25, -0.1);
}
RIGS.atst = () => {
  const P = [];
  atstBody(collect(P));
  const legGeo = asGeo(atstLeg)();
  return {
    body: merge(P),
    legs: [
      [-0.55, 0],
      [0.55, Math.PI]
    ].map(([x, ph]) => ({ geo: legGeo, at: [x, 3.35, 0.1], ph, amp: 0.38 })),
    stride: 4.6
  };
};

// ---- Kinds -----------------------------------------------------------------------

// Troopers on the move: cut-outs like the saloon's gunmen; one that gets to
// its spot stops and fires at the roof (it costs everyone up there 10; the
// bolt always misses).
const mover = (cardKey, h = 1.8, extra = {}) => ({
  ...gunman(cardKey, h),
  arrive: "blasterR",
  fires: 1.3,
  lose: "BLASTED!",
  ...extra
});
const dont = (k, name) => ({ ...k, pts: -25, sound: "wrong", ...DONT, name, fires: 0, arrive: undefined });
const ship = (geo, pts, r, extra = {}) => ({
  ...thing(geo, 0, pts, r, "shatter", "fly", "boom"),
  boom: 2.6,
  flyby: "tie",
  ...extra
});
const kinds = {
  trooperRun: mover("trooper"),
  sandRun: mover("sandtrooper"),
  snowRun: mover("snowtrooper"),
  officerRun: mover("officer", 1.8, { pts: 75 }),
  vaderWalk: { ...mover("vader", 2.0), pts: 300, name: "DARTH VADER! · 300", fires: 0, arrive: undefined },
  tuskenRun: { ...mover("tusken"), arrive: "roar", fires: 0, lose: "TUSKEN RAID!" },
  bobaRun: { ...mover("boba"), pts: 150, name: "BOBA FETT · 150" },
  jawaRun: dont(mover("jawa", 0.95), "UTINNI! DON'T SHOOT THE JAWAS!"),
  droidRun: dont(mover("threepio"), "THESE AREN'T THE DROIDS... DON'T SHOOT!"),
  artooRun: { ...dont(mover("artoo", 0.9), "THESE AREN'T THE DROIDS... DON'T SHOOT!"), sound: "beep" },
  chewieRun: dont(mover("chewie", 2.1), "DON'T SHOOT CHEWIE!"),
  leiaRun: dont(mover("leia", 1.7), "DON'T SHOOT THE PRINCESS!"),
  rebelRun: dont(mover("rebel"), "HE'S ONE OF OURS! DON'T SHOOT!"),
  speeder: { ...runner("speeder", 0xe8e4dc, 1.7, 0.85, "boom"), boom: 2, pts: 75 },
  dewback: { ...runner("dewback", 0xb8b878, 2.1, 0.9, "roar"), pts: 50 },
  tauntaun: {
    ...runner("tauntaun", 0xe8dcc8, 2.4, 0.8, "wrong"),
    pts: -25,
    ...DONT,
    name: "DON'T SHOOT THE TAUNTAUN!"
  },
  mouse: { ...runner("mouse", 0xb8bcc4, 0.45, 0.32, "beep"), pts: 100 },
  tie: ship("tie", 25, 1.5),
  tieI: ship("tieI", 50, 1.3, { name: "TIE INTERCEPTOR · 50" }),
  tieV: ship("tieV", 300, 1.6, { boom: 4, name: "DARTH VADER'S TIE! · 300" }),
  xwing: {
    ...ship("xwing", -25, 1.7, { flyby: null, boom: 0 }),
    sound: "wrong",
    ...DONT,
    name: "X-WING! HOLD YOUR FIRE!"
  },
  snowspeeder: {
    ...ship("snowspeeder", -25, 1.3, { flyby: null, boom: 0 }),
    sound: "wrong",
    ...DONT,
    name: "ROGUE SQUADRON! HOLD YOUR FIRE!"
  },
  probe: { ...thing("probe", 0, 50, 0.6, "shatter", "watch", "beep"), boom: 1.4, name: "PROBE DROID · 50" },
  atat: {
    ...thing("atat", 0, 150, 1.9, "shatter", "walk", "boom"),
    art: { rig: "atat" },
    hy: 7.4,
    cadence: 0.36,
    boom: 7,
    name: "AT-AT! HIT THE HEAD · 150"
  },
  atst: {
    ...thing("atst", 0, 75, 1.0, "shatter", "walk", "boom"),
    art: { rig: "atst" },
    hy: 4.3,
    cadence: 0.7,
    boom: 3.5,
    arrive: "blasterR",
    fires: 1,
    lose: "AT-ST FIRE!",
    name: "AT-ST · 75"
  },
  // thrown at you: shoot it before it lands (it costs everyone 10)
  thermal: {
    ...thing("thermal", 0, 25, 0.22, "shatter", "tumble", "clank"),
    arrive: "boom",
    blast: true,
    lose: "BOOM!"
  },
  glassUp: thing("glass", 0, 25, 0.16, "shatter", "tumble", "glass"),
  mugUp: { ...thing("mug", 0, 25, 0.15, "shatter", "tumble", "glass"), hy: 0.08 }
};

// ---- Paths ------------------------------------------------------------------------

function parkedAtat(add, swing) {
  atatBody(add);
  [
    [-1.25, 2.9, 1],
    [1.25, 2.9, -1],
    [-1.25, 7.9, -1],
    [1.25, 7.9, 1]
  ].forEach(([x, z, s]) => atatLeg(legAt(add, x, 6.8, z, s * swing)));
}

// ---- Level 1: Tatooine ---------------------------------------------------------------

// The Lars farm: the homestead's entrance dome, its sunken courtyard, the
// vaporators out across the sand, a sandcrawler come to trade.
const TAT = { HOME: [-11, 15], PIT: [-11, 27, 5.4], SPEEDER: [-4.5, 11], CRAWLER: [25, 54] };
const VAPS = [
  [6.5, 9],
  [-3, 19],
  [13, 17],
  [21, 30],
  [-20, 22],
  [4, 33],
  [-16, 41],
  [12, 44]
];

function vaporator(P, u, f, s = 1) {
  P.add(CYL(0.38 * s, 0.45 * s, 0.35 * s, 8), 0x9a9890, u, G + 0.17 * s, f);
  P.add(CYL(0.15 * s, 0.19 * s, 3.4 * s, 8), 0xc8c6be, u, G + 2.0 * s, f);
  for (const h of [0.8, 1.9, 2.9]) P.add(CYL(0.25 * s, 0.25 * s, 0.14 * s, 8), 0x8a8880, u, G + h * s, f);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.5;
    P.add(
      BOX(0.05 * s, 1.0 * s, 0.55 * s),
      0xb0aea6,
      u + Math.cos(a) * 0.3 * s,
      G + 3.3 * s,
      f + Math.sin(a) * 0.3 * s,
      0,
      -a,
      0
    );
  }
  P.add(CYL(0.08 * s, 0.22 * s, 0.4 * s, 8), 0x9a9890, u, G + 3.9 * s, f);
}
function sandcrawler(add) {
  const R = 0x8a5c3c;
  const D = 0x5e3e28;
  add(BOX(8, 4.2, 18), R, 0, 3.6, 0);
  add(BOX(7.2, 4.4, 12.5), R, 0, 7.9, 2.2);
  add(BOX(7.4, 5.4, 1.2), R, 0, 7.4, -5.0, -0.55, 0, 0);
  add(BOX(8.2, 3.4, 1.4), D, 0, 3.3, -9.2, 0.38, 0, 0);
  add(BOX(5.6, 0.6, 0.2), 0x1a1410, 0, 8.7, -5.45, -0.55, 0, 0);
  add(BOX(6.2, 0.7, 11.5), D, 0, 10.3, 2.6);
  for (const s of [-1, 1]) {
    for (const z of [-6, 0, 6]) add(BOX(2.4, 2.4, 4.6), 0x3a2a20, s * 3.3, 1.2, z);
    add(BOX(0.1, 1.2, 15), D, s * 4.04, 4.6, 0.5);
    for (const z of [-3, 1, 5]) add(BOX(0.12, 1.4, 1.6), 0x4a3020, s * 3.66, 7.8, z);
  }
  add(BOX(4.0, 0.25, 5.4), D, 0, 1.3, -11.2, 0.3, 0, 0);
}
function landspeeder(add) {
  add(BOX(1.7, 0.5, 3.4), 0xc8603a, 0, 0.75, 0);
  add(BOX(1.7, 0.4, 1.0), 0xc8603a, 0, 0.62, -2.0, 0.3, 0, 0);
  add(BOX(1.3, 0.45, 0.06), 0x6a8a9a, 0, 1.2, -0.7, -0.6, 0, 0);
  add(BOX(1.1, 0.3, 1.0), 0x4a3020, 0, 1.08, 0.1);
  for (const [x, y] of [
    [-1.0, 0.8],
    [1.0, 0.8],
    [0, 1.25]
  ]) {
    add(CYL(0.24, 0.24, 1.3, 8), 0x9a9890, x, y, 1.5, Math.PI / 2);
    add(CYL(0.18, 0.18, 0.05, 8), 0x3a3a3a, x, y, 2.16, Math.PI / 2);
  }
}
function kraytBones(P, u, f) {
  const bone = 0xeadfc6;
  for (let k = 0; k < 16; k++)
    P.add(BALL(0.42 - k * 0.012, 6), bone, u + k * 1.1, G + 0.2 + Math.sin(k * 0.4) * 0.3, f);
  for (let k = 0; k < 10; k++) {
    const r = 2.6 - k * 0.17;
    P.add(
      new THREE.TorusGeometry(r, 0.12, 4, 10, Math.PI),
      bone,
      u + 1.5 + k * 1.15,
      G - r * 0.25,
      f,
      0,
      Math.PI / 2,
      0
    );
  }
  P.add(BOX(2.4, 1.0, 1.3), bone, u - 1.6, G + 0.4, f, 0, 0, 0.2);
  P.add(CONE(0.25, 1.4, 5), bone, u - 1.2, G + 1.2, f - 0.5, 0.3, 0, 0.6);
  P.add(CONE(0.25, 1.4, 5), bone, u - 1.2, G + 1.2, f + 0.5, -0.3, 0, 0.6);
}
function domeHouse(P, u, f, r, c = 0xe4d6ba) {
  P.add(CYL(r, r, r * 0.7, 12), c, u, G + r * 0.35, f);
  P.add(BALL(r, 12), c, u, G + r * 0.7, f, 0, 0, 0, 1, 0.55, 1);
}

const SUNS = {
  top: "#3a6aa8",
  mid: "#8ab4d8",
  horizon: "#f8e0b0",
  ground: "#c8965a",
  sun: [-40, 13, "#fff8e0", 10],
  suns: [[-22, 7, "#ffd49a", 7]],
  planets: [
    { az: 48, el: 34, r: 14, colour: "#e8e2d8", light: -0.5, dark: 0.55 },
    { az: 62, el: 23, r: 7, colour: "#d8cfc0", light: -0.5, dark: 0.6 }
  ],
  clouds: 2,
  cloud: "rgba(255,240,220,0.3)",
  hills: [
    { colour: "#b88450", height: 8, rough: 4, phase: 3 },
    { colour: "#d8a868", height: 5, rough: 1.2, phase: 1 },
    { colour: "#e0b478", height: 2.5, rough: 0.8 }
  ],
  seed: 61
};

WORLDS.tatooine = {
  sky: SUNS,
  fog: 0xe8cfa0,
  build(P) {
    const [hu, hf] = TAT.HOME;
    const [pu, pf, pr] = TAT.PIT;
    P.ground(0xd6aa6a, [
      { u: pu, f: pf, r: pr - 0.6, c: 0x9a7448 },
      { u: pu, f: pf, r: pr - 2.2, c: 0x8a6440 },
      { u: 0, f: 5, r: 9, c: 0xcc9e60, sx: 3, sz: 0.5 },
      { u: 18, f: 36, r: 10, c: 0xdcb070, sx: 1.6, sz: 0.7 },
      { u: TAT.SPEEDER[0], f: TAT.SPEEDER[1], r: 1.8, c: 0xb08850, sx: 1, sz: 1.6 }
    ]);
    // the homestead: its dome, the doorway, vents; the courtyard's rim
    P.add(BALL(2.7, 16), 0xeadcc0, hu, G, hf, 0, 0, 0, 1, 0.68, 1);
    P.add(BOX(2.0, 2.3, 1.6), 0xe4d4b6, hu, G + 1.15, hf - 2.5);
    P.add(BOX(1.3, 1.9, 0.1), 0x2a1e14, hu, G + 0.95, hf - 3.32);
    P.add(CYL(0.7, 0.7, 0.3, 10), 0xd8c8a8, hu - 1, G + 1.9, hf + 0.4);
    P.add(CYL(0.25, 0.25, 0.6, 8), 0xb8a888, hu + 1.2, G + 2.0, hf - 0.5);
    P.add(TORUS(pr, 0.75, 28), 0xdcc090, pu, G + 0.15, pf, Math.PI / 2, 0, 0, 1, 1, 0.5);
    for (const a of [3.4, 5.6]) domeHouse(P, pu + Math.cos(a) * (pr + 1.6), pf - Math.sin(a) * (pr + 1.6), 1.1);
    // the power converters (cover) and the landspeeder
    for (const [u, c] of [
      [-3.5, 0x8a8478],
      [3.5, 0x6a6a64]
    ]) {
      P.add(BOX(1.6, 1.1, 0.9), c, u, G + 0.55, 6.4);
      P.add(CYL(0.25, 0.25, 0.5, 8), 0x9a9890, u + 0.4, G + 1.35, 6.4);
    }
    landspeeder(kit(P, TAT.SPEEDER[0], TAT.SPEEDER[1], Math.PI / 2 + 0.2));
    for (const [u, f] of VAPS) vaporator(P, u, f, 1.05);
    sandcrawler(kit(P, TAT.CRAWLER[0], TAT.CRAWLER[1], Math.PI - 0.75));
    kraytBones(P, -30, 34);
    // the Jundland wastes off to the left, mesas to the right, the dunes
    for (const [u, f, s] of [
      [-38, 46, 1.4],
      [-46, 58, 1.8],
      [-30, 64, 1.2],
      [-55, 40, 2]
    ]) {
      P.add(BOX(6 * s, 9 * s, 5 * s), 0xb47a48, u, G + 4.5 * s, f, 0, s, 0);
      P.add(BOX(4 * s, 3 * s, 4 * s), 0xc88a52, u + s, G + 10 * s, f, 0, s * 2, 0.1);
    }
    for (const [u, f, w] of [
      [42, 70, 18],
      [60, 62, 14]
    ]) {
      P.add(BOX(w, 7, 9), 0xb07848, u, G + 3.5, f);
      P.add(BOX(w + 1, 0.6, 9.5), 0xd09a62, u, G + 7.2, f);
    }
    P.scatter(
      18,
      52,
      86,
      (u, f, R) => P.add(BALL(1, 10), R() < 0.5 ? 0xe0b478 : 0xd4a468, u, G - 0.2, f, 0, R() * 3, 0, 8, 1.3 + R(), 4),
      70
    );
    // Mos Eisley, far off
    for (const [u, f, r] of [
      [-22, 82, 2.4],
      [-17, 84, 1.8],
      [-27, 80, 1.6],
      [-13, 81, 1.4]
    ])
      domeHouse(P, u, f, r);
    P.scatter(14, 8, 60, (u, f, R) => Math.abs(u) > 6 && P.rock(u, f, 0.5 + R(), 0xb08a5a), 50, 8);
  },
  slots: [],
  cover: null
};

LAYOUTS.tatooine = L => {
  const fixed = { fixed: true, rail: false };
  const [hu, hf] = TAT.HOME;
  const [pu, pf] = TAT.PIT;
  L.row({ kind: "womprat", n: 6, f: 3.5, u0: -4.5, u1: 4.5, size: 0.42, tint: "brown", bank: 3 });
  L.row({ kind: "helmet", n: 5, f: 8, u0: -6, u1: 6, base: 1.2, size: 0.4, tint: "white", bank: 5 });
  for (const [u, f] of VAPS.slice(1, 5))
    L.row({ ...fixed, kind: "crest", n: 1, f: f - 0.4, u0: u, u1: u, base: 4.25, size: 0.55, tint: "steel" });
  L.row({
    ...fixed,
    kind: "womprat",
    n: 4,
    f: pf - 6.4,
    u0: pu - 3.5,
    u1: pu + 3.5,
    base: 0.2,
    size: 0.48,
    tint: "brown",
    bank: 4
  });
  L.row({ kind: "helmet", n: 6, f: 29, u0: -8, u1: 8, base: 1.3, size: 0.5, tint: "white", bank: 3 });
  L.row({ kind: "helmet", n: 5, f: 47, u0: -6, u1: 10, base: 1.4, size: 0.62, tint: "white", bank: 5 });
  L.row({ ...fixed, kind: "crest", n: 2, f: 57, u0: -6, u1: 6, base: 2.2, size: 0.8, tint: "steel", rail: true });
  const troop = (a, extra = []) => [["sandtrooper", a], ...extra];
  L.pops({
    fixed: true,
    f: hf - 3.6,
    at: [[hu, 0]],
    size: 1.8,
    kinds: troop(60, [
      ["luke", 15, { dont: true }],
      ["threepio", 10, { dont: true }],
      ["jawa", 15, { dont: true }]
    ])
  });
  for (const [u, f] of VAPS)
    L.pops({
      fixed: true,
      f: f + 0.5,
      at: [[u + 0.55, 0]],
      size: 1.8,
      busy: 0.6,
      kinds: troop(75, [
        ["tusken", 15],
        ["jawa", 10, { dont: true }]
      ])
    });
  L.pops({
    fixed: true,
    f: pf - 4.6,
    at: [
      [pu - 3, -0.7],
      [pu + 3, -0.7]
    ],
    size: 1.8,
    kinds: troop(65, [["tusken", 35]])
  });
  L.pops({
    fixed: true,
    f: 7.0,
    at: [
      [-3.5, 0],
      [3.5, 0]
    ],
    size: 1.75,
    kinds: troop(80, [["artoo", 20, { dont: true }]])
  });
  L.pops({
    fixed: true,
    f: TAT.SPEEDER[1] + 1.1,
    at: [[TAT.SPEEDER[0], 0]],
    size: 1.8,
    kinds: troop(90, [["luke", 10, { dont: true }]])
  });
  L.pops({
    fixed: true,
    f: 44.5,
    at: [
      [18.5, 0],
      [21.5, 0]
    ],
    size: 1.0,
    kinds: [
      ["jawa", 50, { dont: true }],
      ["sandtrooper", 50, { pts: 50 }]
    ]
  });
  L.pops({
    fixed: true,
    f: 38,
    at: [
      [-33, 1.2],
      [-27, 0.4]
    ],
    size: 1.7,
    period: [5, 8],
    kinds: [["tusken", 100, { pts: 50 }]]
  });
};

const tatooineWave = (R, add, c) => {
  const [hu, hf] = TAT.HOME;
  const out = (t, from) =>
    add(t, "sandRun", rush(R, [from, [from[0] * 0.5 + R(-3, 3), R(5, 8), G]], R(2.6, 3.4) * c.S));
  const raid = t =>
    add(
      t,
      "tuskenRun",
      rush(
        R,
        [
          [R(-34, -26), R(36, 42), G],
          [R(-16, -8), R(18, 24), G],
          [R(-6, 6), R(4, 7), G]
        ],
        R(4.2, 5.2) * c.S
      )
    );
  if (c.x2) {
    // the dewback patrol: dewbacks, speeder bikes, the troopers out of the farm
    for (let k = 0; k < 8; k++) {
      if (k % 2) add(1 + k * 3, "speeder", skim(R, { v: R(16, 20) * c.S, f: R(10, 36), h: R(0.7, 1.2) }));
      else add(1 + k * 3, "dewback", run(R, { v: R(6, 8) * c.S, f: R(14, 38) }));
    }
    for (let k = 0; k < 4; k++) out(3 + k * 6, [hu, hf - 3.4, G]);
    for (let k = 0; k < 3; k++) raid(5 + k * 7);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k !== 3)
    for (let j = 0; j < 1 + n(1.6); j++)
      add(R(1, 24), "speeder", skim(R, { v: R(15, 20) * c.S, f: R(8, 40), h: R(0.7, 1.3) }));
  if (k === 1 || k === 3 || k === 5)
    for (let j = 0; j < 1 + n(1.2); j++) add(R(1, 20), "dewback", run(R, { v: R(5, 7) * c.S, f: R(12, 40) }));
  for (let j = 0; j < 1 + n(1.2); j++) {
    const from =
      j % 2
        ? [hu, hf - 3.4, G]
        : (() => {
            const [u, f] = pick(R, VAPS);
            return [u + 0.6, f + 0.5, G];
          })();
    out(R(1, 22), from);
  }
  if (k >= 2) for (let j = 0; j < 1 + n(0.8); j++) raid(R(1, 20));
  if (k === 5 || k === 2)
    for (let j = 0; j < 2 + n(1); j++) {
      const [u, f] = pick(R, VAPS);
      add(R(1, 24), "thermal", lobbed(R, { u, f, h: G + 1.6, vh: R(4, 6), vu: R(-1.5, 1.5), vf: -R(f / 4, f / 3) }));
    }
  if (k === 1 || k === 4)
    for (let j = 0; j < 2 + n(1.5); j++)
      add(R(1, 24), "tie", across(R, { v: R(15, 19) * c.S, h: R(7, 15), f: R(15, 45), weave: 2.5, amp: 0.6 }));
  if (R(0, 1) < 0.35) add(R(2, 18), "jawaRun", cross(R, { u0: -18, u1: 18, f: R(10, 20), v: 1.7 }));
  if (R(0, 1) < 0.3) {
    const t = R(2, 16);
    const f = R(9, 16);
    add(t, "droidRun", cross(R, { u0: 20, u1: -20, f, v: 1.4 }));
    add(t + 0.9, "artooRun", cross(R, { u0: 20, u1: -20, f: f + 0.6, v: 1.4 }));
  }
};

// ---- Level 2: the cantina ---------------------------------------------------------

// Down the steps from the street: a long, dim room, the round bar in its
// middle, booths in the walls, the band on its stand. The street outside is
// there through the doorway at the top of the steps.
export const CAN = {
  W: 14.5,
  FRONT: -11,
  BACK: 31,
  CEIL: 7.2,
  BAR: 14,
  BR: 4.4,
  BH: 1.15,
  BOOTHS: [4.5, 11, 17.5, 24],
  FOOT: 27.4,
  DOOR: 2.2,
  DH: 3.4,
  UP: 1.6,
  STAGE: [-9, 21]
};

WORLDS.cantina = {
  sky: SUNS,
  fog: 0xb89a70,
  build(P) {
    const C = CAN;
    const len = C.BACK + 0.3 - C.FRONT;
    const mid = (C.FRONT + C.BACK + 0.3) / 2;
    P.add(SLAB(2 * C.W + 0.6, 0.05, len), 0x3a3026, 0, G - 0.03, mid);
    P.add(CYL(5.4, 5.4, 0.02, 28), 0x2a221c, 0, G + 0.005, C.BAR);
    for (const s of [-1, 1]) {
      const x = d => s * (C.W - d);
      P.add(SLAB(0.3, C.CEIL + 0.3, len), 0x8a7660, s * (C.W + 0.15), G + C.CEIL / 2, mid);
      P.add(SLAB(0.08, 1.0, len), 0x5a4a3a, x(0.04), G + 0.5, mid);
      for (const f of C.BOOTHS) {
        // a booth: the alcove, its curved bench, the table, a lamp
        P.add(BOX(0.08, 2.6, 3.4), 0x3a2e24, x(0.06), G + 1.3, f);
        P.add(BOX(0.7, 0.45, 3.8), 0x6a5a48, x(0.35), G + 2.82, f);
        P.add(BOX(0.7, 0.5, 3.0), 0x6a3a2a, x(0.45), G + 0.25, f);
        P.add(BOX(0.2, 0.9, 3.0), 0x6a3a2a, x(0.15), G + 0.95, f);
        for (const e of [-1, 1]) P.add(BOX(1.2, 0.5, 0.25), 0x6a3a2a, x(0.9), G + 0.25, f + e * 1.4);
        P.add(CYL(0.6, 0.6, 0.06, 14), 0x4a3a2c, x(1.6), G + 0.78, f);
        P.add(CYL(0.07, 0.1, 0.75, 6), 0x2a221c, x(1.6), G + 0.375, f);
        P.add(BALL(0.13, 6), 0xffc070, x(0.18), G + 2.3, f);
      }
      // pipes and vents along the walls
      P.add(SLAB(0.12, 0.12, len), 0x4a4038, x(0.12), G + C.CEIL - 0.6, mid);
      for (const f of [0, 8, 14.5, 21, 28]) P.add(BOX(0.06, 0.6, 0.9), 0x2a241e, x(0.04), G + 4.2, f);
    }
    // arched beams across the room, the light ring over the bar, rugs
    for (const f of [1, 7.75, 20.75, 27]) {
      P.add(
        new THREE.TorusGeometry(C.W, 0.25, 4, 24, Math.PI),
        0x6a5a48,
        0,
        G + C.CEIL - C.W * 0.42,
        f,
        0,
        0,
        0,
        1,
        0.42,
        1
      );
    }
    P.add(TORUS(3.2, 0.12, 28), 0xffc070, 0, G + 4.6, C.BAR, Math.PI / 2);
    P.add(TORUS(3.2, 0.2, 28), 0x3a3026, 0, G + 4.75, C.BAR, Math.PI / 2);
    for (let k = 0; k < 4; k++)
      P.add(
        CYL(0.02, 0.02, C.CEIL - 4.7, 4),
        0x2a221c,
        Math.cos(k * 1.57) * 3.2,
        G + (C.CEIL + 4.7) / 2,
        C.BAR + Math.sin(k * 1.57) * 3.2
      );
    for (const [u, f, col] of [
      [-7, 7, 0x5a2a4a],
      [7, 7, 0x2a3a5a],
      [-5, 24, 0x4a3a2a],
      [6, 23, 0x2a4a3a]
    ])
      P.add(CYL(1.6, 1.6, 0.02, 18), col, u, G + 0.012, f);
    for (const s of [-1, 1])
      for (const f of [8, 14.5, 21])
        for (const [dh, col] of [
          [0, 0x6ad0ff],
          [0.5, 0xff6ad0]
        ])
          P.add(BOX(0.05, 0.12, 1.4), col, s * (C.W - 0.05), G + 3.6 + dh, f);
    // the band's stand
    P.add(CYL(2.4, 2.4, 0.35, 20), 0x4a3a2c, C.STAGE[0], G + 0.175, C.STAGE[1]);
    P.add(BOX(5.2, 2.8, 0.1), 0x2a221c, C.STAGE[0], G + 1.75, C.STAGE[1] + 2.5);
    // the bar: its wall, the top, the foot rail, stools; the bartender's island
    P.add(new THREE.CylinderGeometry(C.BR, C.BR, C.BH - 0.06, 32, 1, true), 0x6a5a48, 0, G + (C.BH - 0.06) / 2, C.BAR);
    P.add(
      new THREE.CylinderGeometry(C.BR - 0.9, C.BR - 0.9, C.BH - 0.06, 24, 1, true),
      0x4a3e32,
      0,
      G + (C.BH - 0.06) / 2,
      C.BAR
    );
    P.add(new THREE.RingGeometry(C.BR - 1.0, C.BR + 0.18, 32, 1), 0x2a2420, 0, G + C.BH, C.BAR, -Math.PI / 2);
    P.add(TORUS(C.BR + 0.25, 0.03, 32), 0xb89a5a, 0, G + 0.25, C.BAR, Math.PI / 2);
    for (let k = 0; k < 9; k++) {
      const a = Math.PI + ((k - 4) / 4) * 1.25;
      const r = C.BR + 0.7;
      P.add(CYL(0.22, 0.22, 0.06, 10), 0x7a3a2a, r * Math.sin(a), G + 0.76, C.BAR + r * Math.cos(a));
      P.add(CYL(0.04, 0.05, 0.74, 5), 0x2a221c, r * Math.sin(a), G + 0.37, C.BAR + r * Math.cos(a));
    }
    P.add(CYL(1.4, 1.5, 1.25, 16), 0x4a3a2c, 0, G + 0.625, C.BAR);
    for (let k = 0; k < 6; k++)
      P.add(CYL(0.05, 0.05, 0.3, 5), 0xb8bcc4, Math.cos(k) * 1.2, G + 1.4, C.BAR + Math.sin(k) * 1.2);
    // the back wall, its doorway at the top of the steps
    const B0 = C.BACK + 0.15;
    const side = C.W + 0.3 - C.DOOR;
    for (const s of [-1, 1]) P.add(BOX(side, C.CEIL + 0.3, 0.3), 0x8a7660, s * (C.DOOR + side / 2), G + C.CEIL / 2, B0);
    const top = G + C.UP + C.DH;
    P.add(BOX(2 * C.DOOR, G + C.CEIL + 0.3 - top, 0.3), 0x8a7660, 0, (top + G + C.CEIL + 0.3) / 2, B0);
    P.add(BOX(2 * C.DOOR + 0.5, 0.4, 0.5), 0x5a4a3a, 0, top + 0.2, B0 - 0.1);
    const N = 7;
    for (let k = 0; k < N; k++) {
      const h = ((k + 1) * C.UP) / N;
      const tread = (C.BACK - C.FOOT) / N;
      P.add(BOX(2 * C.DOOR, h, tread), 0x6a5a48, 0, G + h / 2, C.FOOT + (k + 0.5) * tread);
    }
    for (const s of [-1, 1])
      P.add(BOX(0.3, 1.0, C.BACK - C.FOOT), 0x5a4a3a, s * (C.DOOR + 0.15), G + 0.5 + C.UP / 2, (C.BACK + C.FOOT) / 2);
    // the ceiling, lamps hung from it
    P.add(SLAB(2 * C.W + 0.6, 0.3, len), 0x4e4236, 0, G + C.CEIL + 0.15, mid);
    for (const [u, f] of [
      [-6, 4],
      [6, 4],
      [-7, 15],
      [7, 15],
      [0, 22],
      [-6, 26],
      [6, 26]
    ]) {
      P.add(CYL(0.02, 0.02, 0.9, 4), 0x2a221c, u, G + C.CEIL - 0.45, f);
      P.add(CYL(0.45, 0.2, 0.3, 10), 0x3a3026, u, G + C.CEIL - 1.0, f);
      P.add(CYL(0.4, 0.4, 0.02, 10), 0xffd8a0, u, G + C.CEIL - 1.16, f);
    }
    // outside: the street in the suns, a dome or two, crates, a doorway across
    sheet(P, -20, 20, C.BACK + 0.3, 74, G + C.UP, 0xd8b078);
    for (const s of [-1, 1]) {
      for (const [f, w, h] of [
        [40, 9, 4],
        [52, 10, 5],
        [64, 8, 4.4]
      ]) {
        P.add(BOX(w, h, 9), 0xe4d6ba, s * (C.DOOR + 3.5 + w / 2), G + C.UP + h / 2, f);
        P.add(BALL(3, 10), 0xe8dcc4, s * (C.DOOR + 3.5 + w / 2), G + C.UP + h, f, 0, 0, 0, 1, 0.55, 1);
      }
    }
    P.add(BOX(14, 5, 1.5), 0xe4d6ba, 0, G + C.UP + 2.5, 62.5);
    P.add(BOX(1.8, 2.6, 0.1), 0x2a1e14, 0, G + C.UP + 1.3, 61.7);
    P.add(BOX(3.2, 1.0, 1.0), 0x8a7a68, 0, G + C.UP + 0.5, 48.4);
  },
  slots: [],
  cover: null
};

LAYOUTS.cantina = L => {
  const C = CAN;
  const fixed = { fixed: true, rail: false };
  // drinks round the front of the bar, in pairs (each pair a bank)
  const rr = C.BR - 0.45;
  [-48, -24, 0, 24, 48].forEach((deg, k) => {
    const a = (deg * Math.PI) / 180;
    const d = (6 * Math.PI) / 180;
    L.row({
      ...fixed,
      kind: [
        ["glass", "mug"],
        ["mug", "bottle"],
        ["bottle", "glass"],
        ["glass", "bottle"],
        ["mug", "glass"]
      ][k],
      n: 2,
      f: C.BAR - rr * Math.cos(a),
      u0: rr * Math.sin(a - d),
      u1: rr * Math.sin(a + d),
      base: C.BH,
      size: 0.3,
      tint: ["white", "gold"],
      bank: 2
    });
  });
  L.row({
    ...fixed,
    kind: "bottle",
    n: 4,
    f: C.BAR,
    u0: -1,
    u1: 1,
    base: 1.25,
    size: 0.4,
    tint: ["green", "brown"],
    bank: 4
  });
  for (const s of [-1, 1])
    for (const f of C.BOOTHS)
      L.row({
        ...fixed,
        kind: ["mug", "glass"],
        n: 2,
        f,
        u0: s * (C.W - 1.6) - 0.25,
        u1: s * (C.W - 1.6) + 0.25,
        base: 0.81,
        size: 0.28,
        tint: ["gold", "white"],
        bank: 2
      });
  // outside, on a crate in the street
  L.row({
    ...fixed,
    kind: "helmet",
    n: 3,
    f: 47.8,
    u0: -1,
    u1: 1,
    base: C.UP + 1.0,
    size: 0.5,
    tint: "white",
    bank: 3
  });
  // in the booths: who's in them
  for (const f of C.BOOTHS)
    L.pops({
      fixed: true,
      f: f + 0.2,
      at: [
        [-(C.W - 0.95), 0.25],
        [C.W - 0.95, 0.25]
      ],
      size: 1.75,
      kinds: [
        ["greedo", 22, { pts: 75 }],
        ["boba", 7, { pts: 150 }],
        ["trooper", 25],
        ["officer", 10],
        ["han", 12, { dont: true }],
        ["chewie", 9, { dont: true }],
        ["obiwan", 8, { dont: true }],
        ["luke", 7, { dont: true }]
      ]
    });
  L.pops({
    fixed: true,
    f: C.STAGE[1] + 0.5,
    at: [
      [C.STAGE[0] - 1.3, 0.35],
      [C.STAGE[0] + 1.3, 0.35]
    ],
    size: 1.75,
    kinds: [
      ["bith", 60, { dont: true }],
      ["trooper", 40]
    ]
  });
  L.pops({
    fixed: true,
    f: C.BAR + 0.3,
    at: [
      [-2.0, 0],
      [2.0, 0]
    ],
    size: 1.75,
    kinds: [
      ["trooper", 45],
      ["officer", 25],
      ["greedo", 15, { pts: 75 }],
      ["jawa", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: C.BACK + 0.4,
    at: [[0, C.UP]],
    size: 1.8,
    kinds: [
      ["trooper", 65],
      ["sandtrooper", 35]
    ]
  });
  L.pops({
    fixed: true,
    f: 61.5,
    at: [[0, C.UP]],
    size: 1.8,
    period: [5, 8],
    kinds: [
      ["trooper", 60, { pts: 50 }],
      ["sandtrooper", 40, { pts: 50 }]
    ]
  });
};

const cantinaWave = (R, add, c) => {
  const C = CAN;
  // down the steps, round the bar, and fire
  const entry = (t, kind = R(0, 1) < 0.7 ? "trooperRun" : "sandRun") => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      kind,
      rush(
        R,
        [
          [R(-1, 1), C.BACK + 1.5, G + C.UP],
          [R(-0.8, 0.8), C.BACK - 0.3, G + C.UP],
          [R(-0.8, 0.8), C.FOOT, G],
          [s * R(6.5, 8), 19.5, G],
          [s * R(4.5, 9), R(4, 7.5), G]
        ],
        R(2.8, 3.6) * c.S
      )
    );
  };
  const drinks = n => {
    for (let k = 0; k < n; k++) {
      const s = R(0, 1) < 0.5 ? 1 : -1;
      const f = pick(R, C.BOOTHS);
      add(
        2 + (k * 24) / n + R(0, 1.5),
        R(0, 1) < 0.5 ? "glassUp" : "mugUp",
        toss(R, { u: s * (C.W - 1.6), f, h: G + 1.0, vh: R(7.5, 9.5) * Math.min(1.2, c.S), vu: -s * R(1.5, 3.5) })
      );
    }
  };
  const detonator = t =>
    add(
      t,
      "thermal",
      lobbed(R, { u: R(-1, 1), f: C.BACK - 1, h: G + C.UP + 1.6, vh: R(3.5, 5), vu: R(-2, 2), vf: -R(4.5, 6.5) })
    );
  if (c.x2) {
    for (let k = 0; k < 9; k++) entry(1 + k * 2.6);
    add(
      6,
      "bobaRun",
      rush(
        R,
        [
          [C.STAGE[0], C.STAGE[1] + 1.5, G],
          [-6, 9, G],
          [-3, 5, G]
        ],
        2.6 * c.S
      )
    );
    drinks(5);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < (k === 0 ? 1 : 2) + n(1.2); j++) entry(R(1, 22));
  if (k === 1 || k === 4 || k === 5) drinks(4 + n(3));
  if (k === 2 || k === 5) for (let j = 0; j < 1 + n(1); j++) detonator(R(3, 22));
  if (k === 3)
    add(
      R(2, 14),
      "bobaRun",
      rush(
        R,
        [
          [C.STAGE[0], C.STAGE[1] + 1.5, G],
          [-7, 10, G],
          [R(-5, -2), R(4, 6), G]
        ],
        2.6 * c.S
      )
    );
  if (R(0, 1) < 0.35) add(R(2, 18), "chewieRun", cross(R, { u0: -6, u1: 6, f: 21, v: 1.6 }));
  if (R(0, 1) < 0.25) add(R(2, 18), "jawaRun", cross(R, { u0: 9, u1: -9, f: R(5, 8), v: 1.5 }));
};

// ---- Level 3: Hoth -------------------------------------------------------------------

// Echo Base's trench line: you're behind the snow wall, the turrets either
// side; ridges of snow across the plain, the shield generator off to the
// left, the base in the ice cliffs to the right, and the walkers coming in.
const HOTH = { BERM: 3.4, RIDGE1: 22, RIDGE2: 34, GEN: [-34, 50], CAVE: [-27, 17], HANGAR: [31, 24.9] };

WORLDS.hoth = {
  sky: {
    top: "#7a8ea8",
    mid: "#b8c8d8",
    horizon: "#e8eef4",
    ground: "#e4eaf0",
    sun: [20, 18, "#f8f8ff", 9],
    clouds: 12,
    cloud: "rgba(255,255,255,0.55)",
    hills: [
      { colour: "#c8d4e2", height: 14, rough: 4, phase: 2 },
      { colour: "#dde6ee", height: 8, rough: 3 },
      { colour: "#eef2f6", height: 3, rough: 1 }
    ],
    seed: 71
  },
  fog: 0xe6ecf2,
  build(P) {
    P.ground(0xeef2f6, [
      { u: 0, f: 12, r: 8, c: 0xe2e8f0, sx: 3, sz: 0.4 },
      { u: -10, f: 30, r: 6, c: 0xe6ecf4, sx: 2, sz: 0.5 },
      { u: 14, f: 44, r: 8, c: 0xe2e8f0, sx: 2.5, sz: 0.5 }
    ]);
    // the snow wall in front of you, gaps for the two turrets
    for (let u = -30; u <= 30; u += 4) {
      if (Math.abs(u + 10) < 2.5 || Math.abs(u - 13) < 2.5) continue;
      P.add(BOX(3.8, 1.0, 1.3), 0xe2e8ee, u, G + 0.5, HOTH.BERM);
      P.add(BOX(3.6, 0.22, 0.6), 0xf4f7fa, u, G + 1.08, HOTH.BERM - 0.1);
    }
    for (const [u, f] of [
      [-10, 5.0],
      [13, 5.6]
    ]) {
      // a DF.9 turret
      P.add(CYL(0.9, 1.1, 1.2, 10), 0x8a8a80, u, G + 0.6, f);
      P.add(BOX(1.5, 0.9, 1.7), 0x7a7a72, u, G + 1.65, f);
      P.add(CYL(0.11, 0.11, 2.6, 6), 0x3a3a38, u, G + 1.75, f + 1.9, Math.PI / 2);
      P.add(BOX(0.6, 0.3, 0.05), 0x2a3440, u, G + 1.8, f - 0.86);
    }
    // ridges of snow across the plain
    for (const [u, f, s] of [
      [-24, HOTH.RIDGE1, 1],
      [-12, HOTH.RIDGE1 + 0.6, 1.1],
      [0, HOTH.RIDGE1 - 0.3, 1],
      [12, HOTH.RIDGE1 + 0.4, 1.05],
      [24, HOTH.RIDGE1, 0.95],
      [-18, HOTH.RIDGE2, 1.2],
      [-4, HOTH.RIDGE2 + 0.5, 1.1],
      [10, HOTH.RIDGE2 - 0.4, 1.2],
      [22, HOTH.RIDGE2, 1.15]
    ])
      P.add(BALL(1, 10), 0xe8eef4, u, G, f + 0.8, 0, 0, 0, 5.4 * s, 1.5 * s, 1.8);
    // the shield generator
    const [gu, gf] = HOTH.GEN;
    P.add(BALL(3.4, 12), 0x9aa0a8, gu, G, gf, 0, 0, 0, 1, 0.5, 1);
    P.add(CYL(0.9, 1.5, 9, 10), 0xb8bcc0, gu, G + 5.5, gf);
    P.add(
      new THREE.SphereGeometry(4.2, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2.8),
      0xc8ccd0,
      gu,
      G + 9.6,
      gf,
      Math.PI,
      0,
      0
    );
    P.add(BALL(0.7, 8), 0x8a9098, gu, G + 10.2, gf);
    P.add(CYL(0.12, 0.12, 2.8, 5), 0x6a7078, gu, G + 9.0, gf);
    // the ice cliffs and Echo Base's hangar mouth; the wampa's cave
    const [hu, hfr] = HOTH.HANGAR;
    P.add(BOX(16, 14, 10), 0xd8e4ee, 35, G + 7, hfr + 5.1);
    P.add(BOX(12, 22, 12), 0xd0dcea, 46, G + 11, 44, 0, 0.3, 0);
    P.add(BOX(9, 9, 8), 0xdce6f0, 28, G + 4.5, 40, 0, -0.4, 0);
    P.add(BOX(8, 5, 0.2), 0x2a3440, hu, G + 2.5, hfr);
    P.add(BOX(8.4, 0.4, 0.4), 0x6a7078, hu, G + 5.1, hfr - 0.1);
    for (const x of [-3, -1, 1, 3]) P.add(BOX(0.6, 0.15, 0.1), 0xffe8a0, hu + x, G + 4.6, hfr - 0.12);
    const [cu, cf] = HOTH.CAVE;
    P.add(BOX(9, 6.5, 6), 0xdfe8f0, cu, G + 3.25, cf + 3.1, 0, 0.1, 0);
    P.add(BOX(2.8, 3.0, 0.2), 0x1a2430, cu, G + 1.5, cf - 0.1);
    // the ion cannon, far right; a downed snowspeeder; generators by the wall
    P.add(BOX(5, 3, 5), 0x8a9098, 22, G + 1.5, 62);
    P.add(BALL(4, 16), 0xb8bcc4, 22, G + 6.5, 62);
    P.add(CYL(0.6, 0.8, 7, 10), 0x6a7078, 22, G + 9.5, 58, -1.0, 0, 0);
    P.add(TORUS(4.05, 0.15, 24), 0x6a7078, 22, G + 6.5, 62);
    snowspeeder(kit(P, -15, 30, 0.7, 0.3, 1.6));
    for (const [u, f] of [
      [-16, 1.8],
      [-4, 1.6],
      [6, 1.8],
      [20, 1.7]
    ]) {
      P.add(BOX(1.2, 1.0, 0.9), 0x7a7a72, u, G + 0.5, f);
      P.add(CYL(0.3, 0.3, 0.4, 8), 0x5a5a54, u, G + 1.2, f);
      P.add(BOX(0.2, 0.2, 0.05), 0x9dff7a, u + 0.4, G + 0.7, f - 0.46);
    }
    P.scatter(
      40,
      6,
      70,
      (u, f, R) => P.add(BALL(1, 8), 0xf2f5f8, u, G - 0.1, f, 0, R() * 3, 0, 2 + R() * 3, 0.5 + R() * 0.4, 1.2 + R()),
      70,
      12
    );
    // two AT-ATs far out on the plain, coming
    parkedAtat(kit(P, -24, 72, -Math.PI / 2 + 0.4, 0, 1.6), 0.18);
    parkedAtat(kit(P, 20, 78, -Math.PI / 2 - 0.3, 0, 1.6), -0.2);
    P.scatter(30, 40, 90, (u, f, R) => P.rock(u, f, 0.6 + R() * 1.4, 0xdce4ec), 80, 20);
  },
  slots: [],
  cover: null
};

LAYOUTS.hoth = L => {
  const fixed = { fixed: true, rail: false };
  L.row({
    kind: "helmet",
    n: 8,
    f: HOTH.BERM - 0.2,
    u0: -9,
    u1: 9,
    base: 1.08,
    size: 0.4,
    tint: "white",
    bank: 4,
    rail: false
  });
  L.row({ kind: "helmet", n: 5, f: 10, u0: -6, u1: 6, size: 0.4, tint: "white", bank: 5 });
  L.row({
    kind: "probe",
    n: 4,
    f: 28,
    u0: -14,
    u1: 14,
    base: 1.7,
    size: 0.7,
    tint: "steel",
    perch: true,
    wood: 0x5a6068
  });
  L.row({ kind: "atat", n: 4, f: 47, u0: -12, u1: 12, base: 0.7, size: 1.0, tint: "steel", bank: 4, wood: 0x6a7078 });
  L.row({ ...fixed, kind: "crest", n: 3, f: 58, u0: -20, u1: 20, base: 2.0, size: 0.9, tint: "steel", rail: true });
  const snow = [
    ["snowtrooper", 80],
    ["rebel", 20, { dont: true }]
  ];
  L.pops({
    fixed: true,
    f: HOTH.RIDGE1 + 1.7,
    at: [-24, -12, 0, 12, 24].map(u => [u + 1.5, 0.3]),
    size: 1.8,
    kinds: snow
  });
  L.pops({
    fixed: true,
    f: HOTH.RIDGE2 + 1.9,
    at: [-18, -4, 10, 22].map(u => [u - 1.5, 0.4]),
    size: 1.8,
    period: [5, 8],
    kinds: [["snowtrooper", 100]]
  });
  L.pops({
    fixed: true,
    f: HOTH.HANGAR[1] - 0.3,
    at: [
      [HOTH.HANGAR[0] - 2, 0],
      [HOTH.HANGAR[0] + 2, 0]
    ],
    size: 1.8,
    kinds: [
      ["rebel", 45, { dont: true }],
      ["snowtrooper", 55]
    ]
  });
  L.pops({
    fixed: true,
    f: HOTH.CAVE[1] - 0.4,
    at: [[HOTH.CAVE[0], 0]],
    size: 2.6,
    period: [6, 9],
    kinds: [["wampa", 100, { pts: 75 }]]
  });
  L.pops({
    fixed: true,
    f: HOTH.GEN[1] - 3.8,
    at: [
      [HOTH.GEN[0] - 1.5, 0],
      [HOTH.GEN[0] + 1.5, 0]
    ],
    size: 1.8,
    period: [6, 9],
    kinds: [["snowtrooper", 100, { pts: 50 }]]
  });
};

const hothWave = (R, add, c) => {
  const atat = t => add(t, "atat", stride(R, { f: R(46, 58), v: R(2.2, 2.6) * c.S, u0: R(30, 36) }));
  const atst = t =>
    add(
      t,
      "atst",
      rush(
        R,
        [
          [R(-24, 24), R(44, 52), G],
          [R(-10, 10), R(10, 15), G]
        ],
        R(2.8, 3.4) * c.S
      )
    );
  const charge = t => {
    const u = pick(R, [-24, -12, 0, 12, 24]) + 1.5;
    add(
      t,
      "snowRun",
      rush(
        R,
        [
          [u, HOTH.RIDGE1 + 1.7, G],
          [u * 0.6 + R(-2, 2), R(6, 9), G]
        ],
        R(3, 3.8) * c.S
      )
    );
  };
  if (c.x2) {
    atat(1);
    atat(3);
    for (let k = 0; k < 4; k++) atst(2 + k * 5);
    for (let k = 0; k < 6; k++) charge(1 + k * 3.5);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  if (k === 0 || k === 3) atat(R(1, 6));
  if (k >= 1) for (let j = 0; j < 1 + n(k === 4 ? 1.4 : 0.6); j++) atst(R(1, 18));
  for (let j = 0; j < 1 + n(1.3); j++) charge(R(1, 22));
  for (let j = 0; j < n(1.4); j++)
    add(
      R(1, 22),
      "snowRun",
      cross(R, { u0: R(0, 1) < 0.5 ? -24 : 24, u1: R(-6, 6), f: R(26, 31), v: R(3.5, 4.5) * c.S, stop: 2 })
    );
  if (k === 1 || k === 5)
    for (let j = 0; j < 1 + n(1.2); j++) add(R(1, 18), "probe", hover(R, { f: R(16, 32), h: R(2.5, 6) }));
  if (k === 2 || k === 4)
    for (let j = 0; j < 1 + n(1); j++)
      add(R(2, 22), "snowspeeder", across(R, { v: R(20, 24), h: R(4, 9), f: R(14, 36), weave: 1.5 }));
  if (R(0, 1) < 0.35) add(R(2, 18), "tauntaun", run(R, { v: R(9, 11), f: R(12, 26) }));
};

// ---- Level 4: the Death Star's docking bay ------------------------------------------

export const DS = {
  W: 16,
  FRONT: -11,
  BACK: 56,
  CEIL: 14,
  CAT: 6,
  CW: 2.2,
  FAL: 26,
  DOORS: [7, 19, 31, 43],
  UPDOORS: [12, 25, 38]
};
function falcon(add) {
  const H = 0xc8c8c0;
  const D = 0xa8a8a0;
  add(CYL(6.2, 6.2, 1.0, 32), H, 0, 2.4, 0);
  add(CYL(5.0, 6.1, 0.6, 32), D, 0, 3.2, 0);
  add(CYL(6.1, 4.6, 0.5, 32), D, 0, 1.65, 0);
  add(CYL(1.0, 1.1, 0.45, 12), 0x8a8a84, 0, 3.7, 0);
  for (const s of [-1, 1]) add(CYL(0.05, 0.05, 1.2, 5), 0x3a3a38, s * 0.25, 3.9, -0.9, Math.PI / 2);
  for (const s of [-1, 1]) {
    add(BOX(1.7, 0.9, 5.4), H, s * 1.55, 2.4, -7.6);
    add(BOX(1.6, 0.3, 4.8), D, s * 1.55, 2.95, -7.3);
  }
  add(CYL(0.75, 0.75, 3.4, 12), H, 5.8, 2.6, -5.4, Math.PI / 2);
  add(BALL(0.78, 12), H, 5.8, 2.6, -7.1, 0, 0, 0, 1, 1, 0.8);
  add(BOX(0.9, 0.35, 0.1), 0x2a3038, 5.8, 2.8, -7.72);
  add(CYL(1.1, 1.1, 0.1, 14), D, -2.4, 4.0, -2.8, 0.7, 0, 0);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.5;
    add(CYL(0.22, 0.25, 1.6, 6), 0x5a5a58, Math.cos(a) * 3.6, 0.8, Math.sin(a) * 3.6);
  }
  for (const [x, z, w, d] of [
    [-2.5, 1.5, 2.2, 1.8],
    [2.8, -1.5, 1.6, 2.4],
    [-1.0, -3.5, 1.4, 1.2],
    [3.2, 2.6, 1.8, 1.4]
  ])
    add(BOX(w, 0.08, d), 0x8a8a84, x, 3.52, z);
  add(BOX(9.5, 0.4, 0.3), 0x9ad0ff, 0, 2.4, 6.1);
}

WORLDS.hangar = {
  sky: {
    top: "#000000",
    mid: "#02030a",
    horizon: "#05060c",
    ground: "#000000",
    stars: "all",
    nebula: [[-10, 8, 120, "rgba(70,90,160,0.25)"]],
    planets: [
      {
        az: 6,
        el: 4,
        r: 24,
        colour: "#3a6ab8",
        bands: [
          [-0.4, "#5a8ad8", 0.15],
          [0.15, "#e8eef4", 0.1],
          [0.45, "#4a7ac8", 0.12]
        ],
        light: 0.7,
        dark: 0.9
      }
    ],
    seed: 81
  },
  fog: 0x1a1e26,
  build(P) {
    const D = DS;
    const len = D.BACK - D.FRONT;
    const mid = (D.FRONT + D.BACK) / 2;
    P.add(SLAB(2 * D.W + 0.6, 0.06, len), 0x30343a, 0, G - 0.03, mid);
    for (let u = -12; u <= 12; u += 4) P.add(SLAB(0.07, 0.02, len), 0x5a6068, u, G + 0.006, mid);
    for (let f = -8; f < D.BACK; f += 6) P.add(BOX(2 * D.W, 0.02, 0.07), 0x5a6068, 0, G + 0.007, f);
    P.add(BOX(2 * D.W, 0.4, 0.5), 0x5a6068, 0, G - 0.2, D.BACK);
    for (let u = -D.W; u < D.W; u += 2) P.add(BOX(1.0, 0.05, 0.3), 0xd8b020, u + 0.5, G + 0.03, D.BACK - 0.6);
    for (const s of [-1, 1]) {
      const x = d => s * (D.W - d);
      P.add(SLAB(0.3, D.CEIL + 0.3, len), 0x5a6068, s * (D.W + 0.15), G + D.CEIL / 2, mid);
      P.add(SLAB(0.06, 0.6, len), 0x1a1c20, x(0.03), G + 0.3, mid);
      for (let f = -6; f < D.BACK; f += 6) P.add(BOX(0.6, D.CEIL, 0.6), 0x40444a, x(0.3), G + D.CEIL / 2, f);
      for (let f = -3; f < D.BACK - 3; f += 6) {
        P.add(BOX(0.05, 0.9, 3.0), 0xd8e4f0, x(0.04), G + 10.2, f);
        P.add(BOX(0.05, 0.3, 4.0), 0x2a2e34, x(0.04), G + 3.8, f);
      }
      for (const f of D.DOORS) {
        P.add(BOX(0.1, 3.2, 2.6), 0x101214, x(0.06), G + 1.6, f);
        P.add(BOX(0.25, 0.3, 3.1), 0x8a9098, x(0.12), G + 3.35, f);
        for (const e of [-1, 1]) P.add(BOX(0.15, 3.2, 0.5), 0x7a8088, x(0.1), G + 1.6, f + e * 1.05);
      }
      // the catwalk along the wall, its railing, its doors
      const c0 = 1;
      const c1 = 51;
      P.add(SLAB(D.CW, 0.15, c1 - c0), 0x4a4e55, x(D.CW / 2), G + D.CAT - 0.075, (c0 + c1) / 2);
      P.add(SLAB(0.06, 0.06, c1 - c0), 0x8a9098, x(D.CW), G + D.CAT + 1.0, (c0 + c1) / 2);
      P.add(SLAB(0.04, 0.04, c1 - c0), 0x8a9098, x(D.CW), G + D.CAT + 0.5, (c0 + c1) / 2);
      for (let f = c0; f <= c1; f += 3) P.add(BOX(0.05, 1.0, 0.05), 0x8a9098, x(D.CW), G + D.CAT + 0.5, f);
      for (let f = c0 + 2; f < c1; f += 8)
        P.add(BOX(D.CW, 0.25, 0.15), 0x3a3e44, x(D.CW / 2), G + D.CAT - 0.28, f, 0, 0, s * 0.3);
      for (const f of D.UPDOORS) {
        P.add(BOX(0.1, 2.6, 2.2), 0x101214, x(0.06), G + D.CAT + 1.3, f);
        P.add(BOX(0.25, 0.25, 2.6), 0x8a9098, x(0.12), G + D.CAT + 2.7, f);
      }
    }
    // the ceiling and its light panels
    P.add(SLAB(2 * D.W + 0.6, 0.3, len), 0x3a3e44, 0, G + D.CEIL + 0.15, mid);
    for (const u of [-10, -3.5, 3.5, 10])
      for (let f = -4; f < D.BACK - 4; f += 8) P.add(BOX(1.6, 0.06, 5), 0xeef4ff, u, G + D.CEIL - 0.05, f);
    // the bay: open to space, its frame
    P.add(BOX(2 * D.W + 0.6, 3, 1.2), 0x40444a, 0, G + D.CEIL - 1.5, D.BACK);
    for (const s of [-1, 1]) P.add(BOX(1.5, D.CEIL, 1.5), 0x40444a, s * (D.W - 0.75), G + D.CEIL / 2, D.BACK);
    // the Falcon on the deck, the TIEs on their racks, crates
    falcon(kit(P, 0, D.FAL, Math.PI));
    for (const s of [-1, 1]) {
      tieLn(kit(P, s * 10, 47, Math.PI / 2, 2.2));
      P.add(BOX(0.3, 6, 0.3), 0x3a3e44, s * 10, G + 3, 45.4);
      P.add(BOX(0.3, 0.3, 3.4), 0x3a3e44, s * 10, G + 5.9, 47);
    }
    for (const [u, f, w, h] of [
      [-5, 6, 1.6, 1.2],
      [5, 6, 1.6, 1.2],
      [-5.6, 6.6, 0.9, 0.7],
      [8.5, 14, 2.2, 1.6],
      [-9, 33, 2.4, 1.4]
    ])
      P.add(BOX(w, h, w * 0.8), 0x5a6068, u, G + h / 2 + (w < 1 ? 1.2 : 0), f);
  },
  slots: [],
  cover: null
};

LAYOUTS.hangar = L => {
  const D = DS;
  const fixed = { fixed: true, rail: false };
  L.row({ kind: "helmet", n: 6, f: 6.8, u0: -4, u1: 4, base: 1.25, size: 0.4, tint: "white", bank: 3, wood: 0x3a3e44 });
  L.row({ kind: "mouse", n: 4, f: 11, u0: -3, u1: 3, size: 0.42, tint: "steel", bank: 4 });
  for (const s of [-1, 1])
    for (const f of [10, 20, 30, 40])
      L.row({
        ...fixed,
        kind: "crest",
        n: 1,
        f,
        u0: s * (D.W - D.CW - 0.1),
        u1: s * (D.W - D.CW - 0.1),
        base: D.CAT + 1.08,
        size: 0.5,
        tint: "steel"
      });
  L.row({ kind: "tie", n: 4, f: 51, u0: -5, u1: 5, size: 1.0, tint: "steel", bank: 4 });
  for (const s of [-1, 1])
    L.row({
      ...fixed,
      kind: "crest",
      n: 1,
      f: D.BACK - 0.8,
      u0: s * (D.W - 0.75),
      u1: s * (D.W - 0.75),
      base: 7,
      size: 0.9,
      tint: "steel"
    });
  for (const f of D.DOORS)
    L.pops({
      fixed: true,
      f,
      at: [
        [-(D.W - 0.7), 0],
        [D.W - 0.7, 0]
      ],
      size: 1.8,
      kinds: [
        ["trooper", 50],
        ["officer", 14],
        ["gunner", 10],
        ["leia", 10, { dont: true }],
        ["chewie", 8, { dont: true }],
        ["vader", 4, { pts: 250 }],
        ["threepio", 4, { dont: true }]
      ]
    });
  for (const f of D.UPDOORS)
    L.pops({
      fixed: true,
      f,
      at: [
        [-(D.W - 0.7), D.CAT],
        [D.W - 0.7, D.CAT]
      ],
      size: 1.8,
      kinds: [
        ["trooper", 60],
        ["gunner", 25],
        ["officer", 15]
      ]
    });
  L.pops({
    fixed: true,
    peek: true,
    f: D.FAL + 0.5,
    at: [
      [-6.6, 0],
      [6.6, 0]
    ],
    size: 1.8,
    kinds: [
      ["trooper", 70],
      ["han", 15, { dont: true }],
      ["chewie", 15, { dont: true }]
    ]
  });
  L.pops({
    fixed: true,
    f: 7.2,
    at: [
      [-5, 0],
      [5, 0]
    ],
    size: 1.75,
    kinds: [
      ["trooper", 85],
      ["artoo", 15, { dont: true }]
    ]
  });
};

const hangarWave = (R, add, c) => {
  const D = DS;
  const out = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    const f = pick(R, D.DOORS);
    add(
      t,
      R(0, 1) < 0.85 ? "trooperRun" : "officerRun",
      rush(
        R,
        [
          [s * (D.W - 0.7), f, G],
          [s * R(3, 9), R(4, 9), G]
        ],
        R(3, 4) * c.S
      )
    );
  };
  const catwalk = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    const [a, b] = R(0, 1) < 0.5 ? [4, 48] : [48, 4];
    const w = walk(
      [
        [s * (D.W - 1.1), a, G + D.CAT],
        [s * (D.W - 1.1), b, G + D.CAT]
      ],
      R(3.5, 4.5) * c.S
    );
    add(t, "trooperRun", { dur: w.time, pos: w.pos });
  };
  const mouse = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(t, "mouse", cross(R, { u0: -s * (D.W - 0.5), u1: s * (D.W - 0.5), f: R(3, 14), v: R(6, 8) * c.S, bob: 0.02 }));
  };
  const detonator = t => {
    const s = R(0, 1) < 0.5 ? 1 : -1;
    add(
      t,
      "thermal",
      lobbed(R, {
        u: s * (D.W - 1.3),
        f: R(8, 30),
        h: G + D.CAT + 1.0,
        vh: R(3, 4.5),
        vu: -s * R(2, 3.5),
        vf: -R(1, 3)
      })
    );
  };
  if (c.x2) {
    // the tractor beam's off: run for the ship
    for (let k = 0; k < 7; k++) out(1 + k * 3);
    for (let k = 0; k < 4; k++) catwalk(2 + k * 5);
    add(4, "vaderWalk", cross(R, { u0: -15, u1: 15, f: 11, v: 1.3 }));
    for (let k = 0; k < 3; k++) mouse(3 + k * 7);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 1 + n(1.3); j++) out(R(1, 22));
  for (let j = 0; j < 1 + n(1); j++) catwalk(R(1, 20));
  if (k === 0 || k === 3 || k === 5) for (let j = 0; j < 1 + n(1); j++) mouse(R(1, 22));
  if (k === 2 || k === 4) for (let j = 0; j < 1 + n(1); j++) detonator(R(2, 24));
  if (k === 1 || k === 4)
    for (let j = 0; j < 2 + n(1.5); j++)
      add(R(1, 24), R(0, 1) < 0.3 ? "tieI" : "tie", across(R, { v: R(14, 18) * c.S, f: R(62, 74), h: R(1, 9) }));
  if (k === 3 && R(0, 1) < 0.6)
    add(R(2, 8), "vaderWalk", cross(R, { u0: R(0, 1) < 0.5 ? -15 : 15, u1: R(-3, 3), f: 11, v: 1.2, stop: 4 }));
  if (R(0, 1) < 0.3) add(R(2, 18), "leiaRun", cross(R, { u0: -14, u1: 14, f: R(14, 17), v: 3.2 }));
};

// ---- Level 5: the trench run ---------------------------------------------------------

// On the Death Star's surface at the head of the trench: it runs away from
// you to the exhaust port, towers along its edges, Yavin in the sky; the
// TIEs come down it at you and over it, X-wings dive in past you.
export const TR = { W: 6, D: 7, END: 88 };
const TOWERS = [
  [-14, 8],
  [16, 12],
  [-22, 26],
  [20, 30],
  [-13, 42],
  [26, 48],
  [-28, 58],
  [15, 64],
  [-18, 75],
  [30, 78]
];

WORLDS.trench = {
  sky: {
    top: "#000000",
    mid: "#03040a",
    horizon: "#0a0c14",
    ground: "#0e1014",
    stars: "all",
    nebula: [
      [-60, 40, 160, "rgba(90,60,140,0.35)"],
      [80, 25, 120, "rgba(40,80,140,0.3)"]
    ],
    planets: [
      {
        az: 32,
        el: 24,
        r: 70,
        colour: "#d8884a",
        bands: [
          [-0.6, "#e8a060", 0.12],
          [-0.3, "#b86a3a", 0.1],
          [0.0, "#f0b878", 0.14],
          [0.3, "#a85a32", 0.1],
          [0.55, "#e09858", 0.12]
        ],
        light: -0.7,
        dark: 0.92
      },
      { az: -42, el: 30, r: 11, colour: "#5a8a6a", light: -0.7, dark: 0.8 }
    ],
    seed: 91
  },
  fog: 0x101318,
  build(P) {
    const T = TR;
    for (const s of [-1, 1]) sheet(P, s > 0 ? T.W : -86, s > 0 ? 86 : -T.W, -12, T.END, G, 0x5a5e66);
    sheet(P, -T.W, T.W, -12, T.END, G - T.D, 0x3a3e46);
    const len = T.END + 12;
    for (const s of [-1, 1]) {
      P.add(SLAB(0.3, T.D, len), 0x50545c, s * (T.W + 0.15), G - T.D / 2, (T.END - 12) / 2);
      // the walls' machinery and lights
      for (let f = -9; f < T.END; f += 3.5) {
        const d = P.r(0.3, 0.9);
        const h = P.r(0.6, 3);
        P.add(
          BOX(d, h, P.r(1, 3)),
          [0x6a6e76, 0x44484f, 0x7a7e86][Math.floor(P.r(0, 3))],
          s * (T.W - d / 2),
          G - P.r(1.5, 5.5),
          f
        );
        if (P.R() < 0.6)
          P.add(BOX(0.08, 0.22, 0.22), P.R() < 0.5 ? 0xffe8a0 : 0x9ad0ff, s * (T.W - 0.04), G - P.r(0.8, 6), f + 1.6);
      }
      P.add(CYL(0.3, 0.3, len, 6), 0x44484f, s * (T.W - 0.8), G - T.D + 0.3, (T.END - 12) / 2, Math.PI / 2);
    }
    for (let f = -6; f < T.END; f += 7)
      P.add(BOX(P.r(1, 3), P.r(0.2, 0.7), P.r(1, 2.5)), 0x4a4e56, P.r(-3, 3), G - T.D + 0.2, f);
    // the exhaust port's housing, far down the trench
    P.add(BOX(3, 0.3, 3), 0x2a2c30, 0, G - T.D + 0.15, 60.5);
    // the surface: panels and blocks, the turbolaser towers
    P.scatter(
      210,
      -6,
      T.END,
      (u, f, R) => {
        if (Math.abs(u) < T.W + 1.5) return;
        const h = 0.15 + R() * R() * 2.2;
        P.add(
          BOX(2 + R() * 6, h, 2 + R() * 6),
          [0x6a6e76, 0x4a4e56, 0x7a7e86, 0x5a5e66][Math.floor(R() * 4)],
          u,
          G + h / 2,
          f
        );
      },
      80
    );
    for (const [u, f] of TOWERS) {
      P.add(BOX(3, 3.5, 3), 0x6a6e76, u, G + 1.75, f);
      P.add(BOX(2.4, 1.2, 2.4), 0x5a5e66, u, G + 4.1, f);
      for (const x of [-0.5, 0.5]) P.add(CYL(0.08, 0.08, 2.2, 6), 0x2a2c30, u + x, G + 4.2, f - 1.8, Math.PI / 2);
      P.add(BOX(1.6, 0.3, 0.05), 0x1a1c20, u, G + 4.2, f - 1.22);
      P.add(BOX(0.25, 0.25, 0.05), 0xff4a3a, u + 1.2, G + 3.2, f - 1.52);
    }
  },
  slots: [],
  cover: null
};

LAYOUTS.trench = L => {
  const T = TR;
  const fixed = { fixed: true, rail: false };
  L.row({ ...fixed, kind: "crest", n: 4, f: 10, u0: -3, u1: 3, base: -T.D, size: 0.6, tint: "steel", bank: 4 });
  L.row({ ...fixed, kind: "tieside", n: 3, f: 30, u0: -3.5, u1: 3.5, base: -T.D, size: 1.0, tint: "steel", bank: 3 });
  L.row({ ...fixed, kind: "port", n: 1, f: 60, u0: 0, u1: 0, base: -T.D + 0.3, size: 1.4, tint: "gold", pts: 100 });
  for (const s of [-1, 1])
    L.row({ ...fixed, kind: "turret", n: 3, f: 4, u0: s * 9, u1: s * 16, size: 0.7, tint: "steel", bank: 3 });
  for (const [u, f] of TOWERS.slice(2, 5))
    L.row({ ...fixed, kind: "crest", n: 1, f: f - 0.4, u0: u, u1: u, base: 4.7, size: 0.6, tint: "steel" });
  for (const [u, f] of TOWERS.slice(5, 8))
    L.row({ ...fixed, kind: "turret", n: 1, f: f - 0.4, u0: u, u1: u, base: 4.7, size: 0.8, tint: "steel" });
  L.row({ ...fixed, kind: "tie", n: 4, f: 50, u0: -24, u1: -12, size: 1.0, tint: "steel", bank: 4 });
  L.row({ ...fixed, kind: "helmet", n: 4, f: 19, u0: -15, u1: -9, size: 0.5, tint: "white", bank: 4 });
  for (const [u, f] of TOWERS.slice(0, 6))
    L.pops({
      fixed: true,
      f: f - 1.7,
      at: [[u, 3.5]],
      size: 1.6,
      busy: 0.7,
      kinds: [
        ["gunner", 70],
        ["trooper", 30]
      ]
    });
  L.pops({
    fixed: true,
    f: 20,
    at: [
      [-(T.W - 0.6), -T.D + 1.4],
      [T.W - 0.6, -T.D + 1.4]
    ],
    size: 1.8,
    kinds: [["trooper", 100]]
  });
  L.pops({
    fixed: true,
    f: 2.5,
    at: [
      [-10.5, 0],
      [10.5, 0]
    ],
    size: 1.75,
    kinds: [
      ["trooper", 70],
      ["gunner", 30]
    ]
  });
};

const trenchWave = (R, add, c) => {
  const T = TR;
  // down the trench at you, and up over you at the last moment
  const atYou = (t, kind = "tie") =>
    add(
      t,
      kind,
      flight(
        [
          [R(-2, 2), T.END, G - R(3, 5)],
          [R(-2, 2), 30, G - R(2.5, 4)],
          [R(-3, 3), 9, G + R(2, 4)],
          [R(-8, 8), -6, G + R(11, 15)]
        ],
        R(24, 30) * c.S
      )
    );
  // an X-wing from behind you diving into the trench, TIEs on its tail
  const run_ = (t, tails, lead = "xwing") => {
    const u = R(-1, 1);
    const path = du => [
      [u + du, -14, G + 12],
      [u + du * 0.5, 10, G - 2.5],
      [u + du * 0.3, T.END, G - 4]
    ];
    add(t, lead, flight(path(0), 22));
    tails.forEach((k, j) => add(t + 0.8 + j * 0.5, k, flight(path(j % 2 ? 1.3 : -1.3), 22)));
  };
  const over = (t, kind = "tie") =>
    add(
      t,
      kind,
      across(R, { v: R(15, 20) * c.S * (kind === "tieI" ? 1.3 : 1), f: R(10, 45), h: R(4, 13), weave: 2, amp: 0.8 })
    );
  if (c.x2) {
    // Vader's on your tail
    run_(2, ["tieV", "tie", "tie"]);
    run_(14, ["tie", "tieI"]);
    for (let k = 0; k < 6; k++) atYou(4 + k * 3.5, k % 3 ? "tie" : "tieI");
    for (let k = 0; k < 5; k++) over(1 + k * 5);
    return;
  }
  const k = c.w % 6;
  const n = x => Math.round(x * c.I);
  for (let j = 0; j < 2 + n(2); j++) over(R(1, 24), R(0, 1) < 0.25 ? "tieI" : "tie");
  for (let j = 0; j < (k === 0 ? 1 : 2) + n(1.2); j++) atYou(R(1, 22), R(0, 1) < 0.3 ? "tieI" : "tie");
  if (k === 1 || k === 3 || k === 5) run_(R(2, 16), k === 5 ? ["tie", "tieI"] : ["tie"]);
  if (k === 4) for (let j = 0; j < 3 + n(2); j++) over(R(1, 24), "tieI");
  if (k === 2 && R(0, 1) < 0.4) run_(R(2, 12), ["tieV", "tie"]);
};

// ---- Sound: each world's background (made here, no files) ---------------------------

// A note on a brass section (a saw's harmonics, a little vibrato, a soft
// attack), added into d from t0 for dur s.
function brass(d, sr, t0, hz, dur, amp) {
  const i0 = Math.floor(t0 * sr);
  const i1 = Math.min(d.length, Math.floor((t0 + dur + 0.12) * sr));
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / sr;
    const env = Math.min(1, t / 0.03) * (t < dur ? 1 - 0.25 * (t / dur) : Math.exp(-(t - dur) * 30));
    const w = 2 * Math.PI * hz * t * (1 + 0.004 * Math.sin(t * 34));
    let v = 0;
    for (let h = 1; h <= 7; h++) v += Math.sin(w * h) / (h * (h > 3 ? 1.6 : 1));
    d[i] += amp * env * v;
  }
}
// A timpani or a drum: a falling thump.
function drum(d, sr, t0, hz, amp, R) {
  const i0 = Math.floor(t0 * sr);
  const i1 = Math.min(d.length, Math.floor((t0 + 0.6) * sr));
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / sr;
    d[i] +=
      amp * Math.exp(-t * 7) * (Math.sin(2 * Math.PI * hz * (1 + 0.3 * Math.exp(-t * 20)) * t) + 0.15 * (R() * 2 - 1));
  }
}
// A plucked or struck note (the cantina band's steel and bass).
function pluck(d, sr, t0, hz, dur, amp, bright = 0.4) {
  const i0 = Math.floor(t0 * sr);
  const i1 = Math.min(d.length, Math.floor((t0 + dur) * sr));
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / sr;
    const w = 2 * Math.PI * hz * t;
    d[i] +=
      amp *
      Math.exp(-t * 6) *
      Math.min(1, t * 400) *
      (Math.sin(w) + bright * Math.sin(2.01 * w) + bright * 0.5 * Math.sin(3.98 * w));
  }
}
// A reedy clarinet-ish voice (odd harmonics).
function reed(d, sr, t0, hz, dur, amp) {
  const i0 = Math.floor(t0 * sr);
  const i1 = Math.min(d.length, Math.floor((t0 + dur) * sr));
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / sr;
    const env = Math.min(1, t / 0.015) * Math.min(1, (dur - t) / 0.03);
    const w = 2 * Math.PI * hz * t * (1 + 0.003 * Math.sin(t * 30));
    d[i] += amp * env * (Math.sin(w) + 0.45 * Math.sin(3 * w) + 0.2 * Math.sin(5 * w) + 0.08 * Math.sin(7 * w));
  }
}
const hz = semis => 293.66 * 2 ** (semis / 12); // from D4
// (each loop is 8 s, crossfaded from 8 to 8.5: tunes are laid down twice)
const TWICE = [0, 8];

// The march under the Death Star (the Imperial one), low brass and timpani,
// four bars at 120.
function march(d, sr, R, amp = 0.05) {
  const G3 = 196.0;
  const Eb3 = 155.56;
  const Bb3 = 233.08;
  const D4 = 293.66;
  const Eb4 = 311.13;
  const Gb3 = 185.0;
  const notes = [
    [0, G3, 0.45],
    [0.5, G3, 0.45],
    [1, G3, 0.45],
    [1.5, Eb3, 0.34],
    [1.875, Bb3, 0.12],
    [2, G3, 0.45],
    [2.5, Eb3, 0.34],
    [2.875, Bb3, 0.12],
    [3, G3, 0.95],
    [4, D4, 0.45],
    [4.5, D4, 0.45],
    [5, D4, 0.45],
    [5.5, Eb4, 0.34],
    [5.875, Bb3, 0.12],
    [6, Gb3, 0.45],
    [6.5, Eb3, 0.34],
    [6.875, Bb3, 0.12],
    [7, G3, 0.95]
  ];
  for (const off of TWICE) {
    for (const [t, f, dur] of notes) {
      brass(d, sr, t + off, f, dur, amp);
      brass(d, sr, t + off, f / 2, dur, amp * 0.6);
    }
    for (let b = 0; b < 16; b++) drum(d, sr, off + b * 0.5, b % 2 ? 62 : 55, b % 4 === 0 ? 0.12 : 0.06, R);
  }
}
// The fanfare for the trench run (the main title's), brass over the battle.
function fanfare(d, sr, amp = 0.045) {
  const D4 = 293.66;
  const G4 = 392.0;
  const A4 = 440.0;
  const B4 = 493.88;
  const C5 = 523.25;
  const D5 = 587.33;
  const G5 = 783.99;
  const tr = 1 / 6;
  const notes = [
    [0, D4, tr],
    [tr, D4, tr],
    [2 * tr, D4, tr],
    [0.5, G4, 0.95],
    [1.5, D5, 0.95],
    [2.5, C5, tr],
    [2.5 + tr, B4, tr],
    [2.5 + 2 * tr, A4, tr],
    [3, G5, 0.95],
    [4, D5, 0.45],
    [4.5, C5, tr],
    [4.5 + tr, B4, tr],
    [4.5 + 2 * tr, A4, tr],
    [5, G5, 0.95],
    [6, D5, 0.45],
    [6.5, C5, tr],
    [6.5 + tr, B4, tr],
    [6.5 + 2 * tr, C5, tr],
    [7, A4, 0.9]
  ];
  for (const off of TWICE)
    for (const [t, f, dur] of notes) {
      brass(d, sr, t + off, f, dur, amp);
      brass(d, sr, t + off, f / 2, dur, amp * 0.5);
    }
}
// The band in the cantina: a jaunty little swing number (reed lead, steel
// drum chords, a plucked bass, brushes on two and four), four bars at 120.
function cantinaBand(d, sr, R) {
  const sw = e => Math.floor(e / 2) * 0.5 + (e % 2 ? 0.333 : 0); // (swung eighths)
  // [eighth, semitones from D4, eighths long]
  const tune = [
    [0, 0, 1],
    [1, 4, 1],
    [2, 7, 1],
    [3, 9, 1],
    [4, 10, 2],
    [6, 9, 1],
    [7, 7, 1],
    [8, 5, 1],
    [9, 7, 1],
    [10, 9, 2],
    [12, 4, 1],
    [13, 5, 1],
    [14, 7, 2],
    [16, 12, 1],
    [17, 10, 1],
    [18, 9, 1],
    [19, 7, 1],
    [20, 5, 2],
    [22, 7, 1],
    [23, 4, 1],
    [24, 2, 1],
    [25, 4, 1],
    [26, 5, 1],
    [27, 7, 1],
    [28, 0, 3]
  ];
  const chords = [
    [-12, -8, -5],
    [-7, -3, 0],
    [-5, -1, 2],
    [-12, -8, -5]
  ];
  const roots = [-24, -19, -17, -24];
  for (const off of TWICE) {
    for (const [e, s, l] of tune) reed(d, sr, off + sw(e), hz(s), l * 0.25 - 0.02, 0.06);
    for (let bar = 0; bar < 4; bar++) {
      for (const b of [0.5, 1.5]) for (const s of chords[bar]) pluck(d, sr, off + bar * 2 + b, hz(s), 0.35, 0.025, 0.6);
      pluck(d, sr, off + bar * 2, hz(roots[bar]), 0.5, 0.08, 0.2);
      pluck(d, sr, off + bar * 2 + 1, hz(roots[bar] + 7), 0.5, 0.07, 0.2);
      for (const b of [0.5, 1.5]) {
        const i0 = Math.floor((off + bar * 2 + b) * sr);
        for (let i = i0; i < Math.min(d.length, i0 + sr * 0.12); i++)
          d[i] += (R() * 2 - 1) * 0.025 * Math.exp(-((i - i0) / sr) * 30);
      }
    }
  }
}

Object.assign(AMBIENCE, {
  // the desert wind, a vaporator's hum, a Jawa or two chattering far off
  tatooine(d, sr, R) {
    let lp = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      lp += 0.015 * (R() * 2 - 1 - lp);
      d[i] += lp * 2.4 * (0.6 + 0.4 * Math.sin((t * 2 * Math.PI) / 8)) + 0.012 * Math.sin(2 * Math.PI * 120 * t);
      const y = t % 8;
      if (y > 5.2 && y < 6.0) {
        const k = Math.floor((y - 5.2) * 12);
        const f = [900, 1300, 1100, 1500, 1000, 1400, 1200, 1600, 950, 1350][k % 10];
        d[i] += Math.sin(2 * Math.PI * f * t) * Math.sin(2 * Math.PI * 7 * t) ** 2 * 0.03;
      }
    }
  },
  cantina(d, sr, R) {
    let lp = 0;
    let lp2 = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      const x = R() * 2 - 1;
      lp += 0.02 * (x - lp);
      lp2 += 0.2 * (x - lp2);
      d[i] += (lp2 - lp) * (0.5 + 0.3 * Math.sin(t * 2.7) + 0.2 * Math.sin(t * 4.3)) * 0.5;
    }
    cantinaBand(d, sr, R);
  },
  // wind over the snow, howling; the walkers' feet far off
  hoth(d, sr, R) {
    let b1 = 0;
    let b2 = 0;
    let lp = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      const f = 420 + 260 * Math.sin((t * 2 * Math.PI) / 8) + 90 * Math.sin(t * 1.7);
      const w = (2 * Math.PI * f) / sr;
      const r = 0.992;
      const y = (R() * 2 - 1) * 0.06 + 2 * r * Math.cos(w) * b1 - r * r * b2;
      b2 = b1;
      b1 = y;
      lp += 0.01 * (R() * 2 - 1 - lp);
      d[i] += y * 0.35 + lp * 2;
    }
    for (const off of TWICE) for (const t of [1.3, 3.9, 6.5]) drum(d, sr, t + off, 38, 0.25, R);
  },
  // the bay's hum and vents, the march
  hangar(d, sr, R) {
    let lp = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      lp += 0.05 * (R() * 2 - 1 - lp);
      d[i] += lp * 0.6 + 0.03 * Math.sin(2 * Math.PI * 50 * t) + 0.015 * Math.sin(2 * Math.PI * 100 * t);
    }
    march(d, sr, R);
  },
  // engines, far-off explosions, a TIE's howl, the fanfare
  trench(d, sr, R) {
    let lp = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      lp += 0.01 * (R() * 2 - 1 - lp);
      d[i] += lp * 3;
      const y = t % 8;
      if (y > 3.4 && y < 4.8) {
        const e = (y - 3.4) / 1.4;
        const f = (950 + 400 * Math.sin(t * 13)) * (1.2 - 0.5 * e);
        const w = (2 * Math.PI * f) / sr;
        const yy = (R() * 2 - 1) * 0.1 + 2 * 0.985 * Math.cos(w) * b1 - 0.985 * 0.985 * b2;
        b2 = b1;
        b1 = yy;
        d[i] += yy * 0.25 * Math.sin(Math.PI * e);
      }
    }
    for (const off of TWICE) for (const t of [1.1, 5.7]) drum(d, sr, t + off, 30, 0.35, R);
    fanfare(d, sr);
  }
});

// ---- The campaign ------------------------------------------------------------------

export const GALAXY = {
  name: "STAR WARS · A NEW HOPE",
  kinds,
  levels: [
    {
      world: "tatooine",
      name: "TATOOINE · THE LARS FARM",
      story: "Sandtroopers are hunting two droids. Hold the farm",
      music: "",
      amb: "tatooine",
      lasers: true,
      legend: "SPEEDER BIKE 75 · TUSKENS THAT REACH YOU -10 · DON'T SHOOT JAWAS, DROIDS OR LUKE",
      wave: tatooineWave,
      title: (w, x2) => (x2 ? "THE DEWBACK PATROL · DOUBLE POINTS" : null)
    },
    {
      world: "cantina",
      name: "THE MOS EISLEY CANTINA",
      story: "A wretched hive of scum and villainy. Shoot first",
      music: "",
      amb: "cantina",
      indoor: true,
      lasers: true,
      legend: "GREEDO 75 · BOBA FETT 150 · DON'T SHOOT THE BAND, HAN, CHEWIE OR OBI-WAN",
      wave: cantinaWave,
      title: (w, x2) => (x2 ? "THE STORMTROOPERS ARE HERE · DOUBLE POINTS" : null)
    },
    {
      world: "hoth",
      name: "HOTH · ECHO BASE",
      story: "Imperial walkers on the north ridge",
      music: "",
      amb: "hoth",
      lasers: true,
      legend: "AT-AT: HIT THE HEAD 150 · AT-ST 75 · DON'T SHOOT SNOWSPEEDERS, TAUNTAUNS OR REBELS",
      wave: hothWave,
      title: (w, x2) => (x2 ? "THE WALKERS ARE HERE · DOUBLE POINTS" : null)
    },
    {
      world: "hangar",
      name: "THE DEATH STAR · DOCKING BAY 327",
      story: "We're caught in a tractor beam. Rescue the princess",
      music: "",
      amb: "hangar",
      indoor: true,
      lasers: true,
      legend: "DARTH VADER 300 · MOUSE DROID 100 · DON'T SHOOT LEIA, HAN OR CHEWIE",
      wave: hangarWave,
      title: (w, x2) => (x2 ? "THE TRACTOR BEAM'S OFF · RUN! · DOUBLE POINTS" : null)
    },
    {
      world: "trench",
      name: "THE TRENCH RUN",
      story: "Stay on target. Keep the TIEs off the X-wings",
      music: "",
      amb: "trench",
      lasers: true,
      legend: "TIE 25 · INTERCEPTOR 50 · VADER 300 · EXHAUST PORT 100 · DON'T HIT THE X-WINGS",
      wave: trenchWave,
      title: (w, x2) => (x2 ? "VADER'S ON THEIR TAIL · DOUBLE POINTS" : null)
    }
  ],
  first: "Sandtroopers are hunting two droids. Hold the farm",
  done: ["THE DEATH STAR IS DESTROYED!", "GREAT SHOT, KID. THAT WAS ONE IN A MILLION"]
};
