// private-quest-lounge: the fixed, preloaded avatar set. These are the only
// avatars offered in the UI; arbitrary avatar browsing/uploading is removed.
import amber from "../assets/models/lounge-avatars/avatar-amber.glb";
import sage from "../assets/models/lounge-avatars/avatar-sage.glb";
import marigold from "../assets/models/lounge-avatars/avatar-marigold.glb";
import teal from "../assets/models/lounge-avatars/avatar-teal.glb";
import indigo from "../assets/models/lounge-avatars/avatar-indigo.glb";
import plum from "../assets/models/lounge-avatars/avatar-plum.glb";
import slate from "../assets/models/lounge-avatars/avatar-slate.glb";
import rust from "../assets/models/lounge-avatars/avatar-rust.glb";
import forest from "../assets/models/lounge-avatars/avatar-forest.glb";
import wine from "../assets/models/lounge-avatars/avatar-wine.glb";
import sand from "../assets/models/lounge-avatars/avatar-sand.glb";
import night from "../assets/models/lounge-avatars/avatar-night.glb";
import red from "../assets/models/lounge-avatars/avatar-red.glb";
import gray from "../assets/models/lounge-avatars/avatar-gray.glb";
import red2 from "../assets/models/lounge-avatars/avatar-red2.glb";
import jay from "../assets/models/lounge-avatars/avatar-jay.glb";

export const PRESET_AVATARS = [
  { name: "Amber", swatch: "#a8543a", url: amber },
  { name: "Sage", swatch: "#5c7a64", url: sage },
  { name: "Marigold", swatch: "#c99a3f", url: marigold },
  { name: "Teal", swatch: "#3f6e7a", url: teal },
  { name: "Indigo", swatch: "#3a4a6e", url: indigo },
  { name: "Plum", swatch: "#6e3a5c", url: plum },
  { name: "Slate", swatch: "#4a5560", url: slate },
  { name: "Rust", swatch: "#8a4a32", url: rust },
  { name: "Forest", swatch: "#3d5c3a", url: forest },
  { name: "Wine", swatch: "#7a2e3a", url: wine },
  { name: "Sand", swatch: "#b89a6a", url: sand },
  { name: "Night", swatch: "#2a3244", url: night },
  { name: "Her", swatch: "#9a5636", url: red },
  { name: "Him", swatch: "#8a8a84", url: gray },
  { name: "Her 2", swatch: "#3e6b58", url: red2 },
  { name: "Jay", swatch: "#c86a4a", url: jay }
];

export function absoluteAvatarUrl(relativeUrl) {
  return new URL(relativeUrl, window.location.href).href;
}

export function randomPresetAvatarId() {
  const pick = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
  return absoluteAvatarUrl(pick.url);
}
