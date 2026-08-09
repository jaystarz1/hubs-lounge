// private-quest-lounge: the fixed, preloaded avatar set. These are the only
// avatars offered in the UI; arbitrary avatar browsing/uploading is removed.
import amber from "../assets/models/lounge-avatars/avatar-amber.glb";
import sage from "../assets/models/lounge-avatars/avatar-sage.glb";
import marigold from "../assets/models/lounge-avatars/avatar-marigold.glb";
import teal from "../assets/models/lounge-avatars/avatar-teal.glb";
import indigo from "../assets/models/lounge-avatars/avatar-indigo.glb";
import plum from "../assets/models/lounge-avatars/avatar-plum.glb";

export const PRESET_AVATARS = [
  { name: "Amber", swatch: "#a8543a", url: amber },
  { name: "Sage", swatch: "#5c7a64", url: sage },
  { name: "Marigold", swatch: "#c99a3f", url: marigold },
  { name: "Teal", swatch: "#3f6e7a", url: teal },
  { name: "Indigo", swatch: "#3a4a6e", url: indigo },
  { name: "Plum", swatch: "#6e3a5c", url: plum }
];

export function absoluteAvatarUrl(relativeUrl) {
  return new URL(relativeUrl, window.location.href).href;
}

export function randomPresetAvatarId() {
  const pick = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
  return absoluteAvatarUrl(pick.url);
}
