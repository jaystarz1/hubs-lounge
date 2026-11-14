// private-quest-lounge: which headset input means "talk", read straight from the WebXR input sources.
//
// Hubs' userinput system only carries controllers it recognised (it drops hand-tracking sources and
// anything whose gamepad is missing), so a headset it does not map never shows left X. This reads
// the sources themselves as a second route, and offers fallbacks when X is not delivered.
const TOUCH_A = 4; // xr-standard: trigger, squeeze, touchpad, thumbstick, A/X, B/Y
const TOUCH_B = 5;
const TRIGGER = 0;

const isHandSource = source => !!source?.hand || (source?.profiles || []).some(profile => /hand/i.test(profile));
const pressed = (source, index) => !!source?.gamepad?.buttons?.[index]?.pressed;

// Compact, loggable description of one input source (no pose, nothing personal).
function describeSource(source) {
  const pad = source?.gamepad;
  return {
    hand: source?.handedness || "none",
    mode: source?.targetRayMode || "",
    profiles: (source?.profiles || []).slice(0, 4).join("|"),
    isHand: isHandSource(source),
    pad: !!pad,
    mapping: pad?.mapping || "",
    buttons: pad?.buttons?.length ?? 0
  };
}

// Pressed buttons as a short string ("x", "trigger", "x+trigger"), "" when none.
function pressedNames(source) {
  const pad = source?.gamepad;
  if (!pad?.buttons) return "";
  const out = [];
  pad.buttons.forEach((button, i) => button?.pressed && out.push(i === TRIGGER ? "trigger" : "b" + i));
  return out.join("+");
}

// Is the held talk button down? Left X first. Right A and right trigger count only when no left
// controller with an X button is present at all (so a normal owner headset never gets extra
// triggers, and right A's freeze is untouched). Returns { held, via }.
function readTalk(sources) {
  const list = [...(sources || [])].filter(s => s && !isHandSource(s));
  const left = list.filter(s => s.handedness === "left" && (s.gamepad?.buttons?.length || 0) > TOUCH_A);
  if (left.some(s => pressed(s, TOUCH_A))) return { held: true, via: "left-x" };
  // The guest's telemetry showed her pressing the upper left button (Y, index 5) while hunting for X.
  if (left.some(s => pressed(s, TOUCH_B))) return { held: true, via: "left-y" };
  if (left.length) return { held: false, via: "" };
  for (const s of list) {
    if (s.handedness !== "right") continue;
    if (pressed(s, TOUCH_A)) return { held: true, via: "right-a" };
    if (pressed(s, TRIGGER)) return { held: true, via: "right-trigger" };
  }
  return { held: false, via: "" };
}

// Ray (in the button's local space, button in the z=0 plane, half sizes w/2, h/2) against the button.
// origin/dir are [x, y, z]; pad widens the target a little for hand pointing.
function rayHitsRect(origin, dir, w, h, pad = 0.02) {
  if (Math.abs(dir[2]) < 1e-6) return false;
  const t = -origin[2] / dir[2];
  if (t <= 0 || t > 6) return false;
  const x = origin[0] + dir[0] * t;
  const y = origin[1] + dir[1] * t;
  return Math.abs(x) <= w / 2 + pad && Math.abs(y) <= h / 2 + pad;
}

module.exports = { isHandSource, describeSource, pressedNames, readTalk, rayHitsRect };
