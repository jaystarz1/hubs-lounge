// Zoltar voice volume: the pure rules, kept apart from the scene so they are testable.
// The display is a plain 0..100 scale (default 50) in steps of 5. Underneath, a curve
// maps it to the old gain percent (25..400, where 100 = the level before this control
// existed): 0 is silent, 5 is the old minimum 25, 50 is the old default 150, 100 is the
// old maximum 400. Each segment is geometric, so every step is the same loudness ratio.
// Auto-boost adds up to 2x on top when the room mic hears a racket.
const KEY = "lounge-zoltar-volume-v2";
const OLD_KEY = "lounge-zoltar-volume-v1"; // stored the old 25..400 gain percent
const AUTO_KEY = "lounge-zoltar-auto-v1";
const MIN = 0;
const MAX = 100;
const STEP = 5;
const DEFAULT = 50;
const GAIN_MIN = 25;
const GAIN_MID = 150;
const GAIN_MAX = 400;
const QUIET_RMS = 0.02;
const LOUD_RMS = 0.15;
const MAX_AUTO = 2;

function clampPercent(p) {
  const n = Number(p);
  if (!Number.isFinite(n)) return DEFAULT;
  return Math.min(MAX, Math.max(MIN, Math.round(n / STEP) * STEP));
}
function stepPercent(p, direction) {
  return clampPercent(clampPercent(p) + (direction < 0 ? -STEP : STEP));
}
// Display percent to the old gain percent (0 = silent).
function gainPercent(display) {
  const d = clampPercent(display);
  if (d <= 0) return 0;
  if (d <= 50) return GAIN_MIN * Math.pow(GAIN_MID / GAIN_MIN, (d - STEP) / (50 - STEP));
  return GAIN_MID * Math.pow(GAIN_MAX / GAIN_MID, (d - 50) / 50);
}
// Inverse, for migrating a stored old value.
function displayFromGain(gain) {
  const g = Number(gain);
  if (!Number.isFinite(g)) return DEFAULT;
  if (g <= GAIN_MIN) return STEP;
  if (g >= GAIN_MAX) return MAX;
  const d = g <= GAIN_MID
    ? STEP + (Math.log(g / GAIN_MIN) / Math.log(GAIN_MID / GAIN_MIN)) * (50 - STEP)
    : 50 + (Math.log(g / GAIN_MID) / Math.log(GAIN_MAX / GAIN_MID)) * 50;
  return clampPercent(d);
}
// Ambient mic RMS (0..1) to a gain multiplier 1..MAX_AUTO, smooth in between.
function autoBoost(rms) {
  if (!Number.isFinite(rms) || rms <= QUIET_RMS) return 1;
  if (rms >= LOUD_RMS) return MAX_AUTO;
  return 1 + ((rms - QUIET_RMS) / (LOUD_RMS - QUIET_RMS)) * (MAX_AUTO - 1);
}
function gainFor(percent, auto, rms) {
  return (gainPercent(percent) / 100) * (auto ? autoBoost(rms) : 1);
}
function load(storage) {
  try {
    const raw = storage.getItem(KEY);
    const old = storage.getItem(OLD_KEY);
    const percent = raw !== null ? clampPercent(raw) : old !== null ? displayFromGain(old) : DEFAULT;
    return { percent, auto: storage.getItem(AUTO_KEY) === "1" };
  } catch {
    return { percent: DEFAULT, auto: false };
  }
}
function save(storage, percent, auto) {
  try {
    storage.setItem(KEY, String(clampPercent(percent)));
    storage.setItem(AUTO_KEY, auto ? "1" : "0");
  } catch {
    /* session-only */
  }
}
module.exports = { KEY, OLD_KEY, AUTO_KEY, gainPercent, displayFromGain, MIN, MAX, STEP, DEFAULT, clampPercent, stepPercent, autoBoost, gainFor, load, save };
