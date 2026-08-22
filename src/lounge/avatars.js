// private-quest-lounge: the fixed, preloaded avatar set. These are the only
// avatars offered in the UI; arbitrary avatar browsing/uploading is removed.
// Photo-real avatars built via MetaPerson (see lounge-assets/metaperson-*/),
// converted to Hubs half-body by hubsify.py. Max four personal avatars; the
// retired procedural set still lives in lounge-assets/avatars/.
import jayReal from "../assets/models/lounge-avatars/avatar-jay-real.glb";
import herReal from "../assets/models/lounge-avatars/avatar-her-real.glb";

export const PRESET_AVATARS = [
  { name: "Jay", swatch: "#8fa8c8", url: jayReal },
  { name: "Tracy", swatch: "#b8563a", url: herReal }
];

export function absoluteAvatarUrl(relativeUrl) {
  return new URL(relativeUrl, window.location.href).href;
}

// Stored avatarIds are absolute URLs containing a build content hash. After a
// rebuild the stored URL still points at the previous GLB (which the browser
// serves from cache), so the wearer never sees avatar fixes. Re-point any
// stored preset avatar at the current build's URL.
export function remapStaleAvatarId(store) {
  const current = store.state.profile && store.state.profile.avatarId;
  if (!current) return;
  // Note: the build emits "name-<hash>..glb" (double dot), so don't anchor on
  // a clean ".glb" — match the stem only.
  const stemMatch = current.match(/(avatar-\w+-real)-/);
  if (!stemMatch) return;
  for (const preset of PRESET_AVATARS) {
    if (preset.url.includes(stemMatch[1] + "-")) {
      const fresh = absoluteAvatarUrl(preset.url);
      if (fresh !== current) {
        store.update({ profile: { avatarId: fresh } });
      }
      return;
    }
  }
}

export function randomPresetAvatarId() {
  const pick = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
  return absoluteAvatarUrl(pick.url);
}
