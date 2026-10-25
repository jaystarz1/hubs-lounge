// Room video recording: the pure rules, kept apart from the scene so they are testable.
// (lounge/record.js is the scene side.)

const MAX_MS = 120000; // hard cap on one clip: Quest memory, and LinkedIn clips are short
const MIN_MS = 1500; // a stop sooner than this is a mis-press, the clip is dropped

// Things the recording camera must not see: the record buttons and indicator, and
// the pairing keypads. (Those only ever show dots for a PIN, never the digits, and
// a token is never drawn anywhere, but a clip posted publicly is no place for them.)
const hidden = new Set();

function hideFromRecording(obj) {
  if (obj) hidden.add(obj);
  return obj;
}

function unhideFromRecording(obj) {
  hidden.delete(obj);
}

// Hide every registered object for one render pass. Returns the function that puts
// things back; call it in a finally.
function hideForRender() {
  const flipped = [];
  for (const obj of hidden) {
    if (!obj.parent) {
      hidden.delete(obj); // removed from the scene since: forget it
      continue;
    }
    if (obj.visible) {
      obj.visible = false;
      flipped.push(obj);
    }
  }
  return () => flipped.forEach(obj => (obj.visible = true));
}

function clock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// One recording at a time, for the whole room. Time comes from the caller.
class Recording {
  constructor(maxMs = MAX_MS) {
    this.maxMs = maxMs;
    this.startedAt = null;
  }
  get active() {
    return this.startedAt !== null;
  }
  start(now) {
    if (this.active) return false;
    this.startedAt = now;
    return true;
  }
  // Ends the clip; returns its length in ms (0 if none was running).
  stop(now) {
    if (!this.active) return 0;
    const length = now - this.startedAt;
    this.startedAt = null;
    return length;
  }
  elapsed(now) {
    return this.active ? now - this.startedAt : 0;
  }
  expired(now) {
    return this.active && now - this.startedAt >= this.maxMs;
  }
  // Is a clip of this length worth keeping?
  keep(length) {
    return length >= MIN_MS;
  }
  // Button text: [line, ...] and whether it is in the "recording" colours.
  buttonLines(now) {
    // One word idle (the 2:00 cap is not worth a second line on a wall button); STOP and the
    // clock, in the red colours, while recording.
    if (!this.active) return { lines: ["REC"], on: false };
    return { lines: ["STOP", `REC ${clock(this.elapsed(now))}`], on: true };
  }
  // Text for the floating indicator in your own view (never in the clip).
  indicatorLines(now) {
    return this.active ? [`REC ${clock(this.elapsed(now))} / ${clock(this.maxMs)}`] : null;
  }
}

// From wall spots (nearest first), the first that is not within `gap` metres of an
// obstacle. A spot is { pos: [x, y, z] }; an obstacle is { pos: [x, y, z], gap? }.
function chooseSpot(spots, obstacles, gap = 0.7) {
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  return (
    spots.find(spot =>
      obstacles.every(o => {
        // an obstacle's gap is wider than the default when it is a whole panel
        // cluster (the TV wall); it never gets narrower.
        return dist(spot.pos, o.pos) >= Math.max(gap, o.gap || 0);
      })
    ) || null
  );
}

// Is this set of ray hits (distances along one horizontal ray, at several heights)
// one flat tall wall, rather than furniture or a doorway? And are the surface
// normals upright (horizontal)?
function isWall(hits, tolerance = 0.08) {
  hits = hits.slice();
  // the lowest and highest rays may find a gap (a skirting board, a picture rail,
  // a window head); a gap anywhere between them is a doorway or a shelf
  const inner = hits.slice(1, -1);
  if (hits.length < 3 || inner.some(h => !h)) return false;
  hits = hits.filter(Boolean);
  const ds = hits.map(h => h.distance);
  if (Math.max(...ds) - Math.min(...ds) > tolerance) return false;
  return hits.every(h => Math.abs(h.normal[1]) < 0.2);
}

const MAX_UPLOAD = 88 * 1024 * 1024; // the Mac refuses over 90 MB (Cloudflare Tunnel allows 100)

// What the button says once a clip is saved. Short lines: the face is small.
const uploadNote = {
  refusal(status, error) {
    if (status === 401) return "voice not paired";
    if (status === 409) return "Mac still busy";
    if (status === 413) return "too big to send";
    if (status === 415 || status === 422) return "Mac could not convert";
    if (status === 501) return "restart voice on Mac";
    return String(error || `error ${status}`).slice(0, 30);
  },
  // sent: the upload result; downloaded: the local file name if the fallback ran
  lines(sent, downloaded) {
    if (sent && sent.ok) return { lines: ["SAVED TO STUDIO", String(sent.name || "").replace(/\.mp4$/, "").slice(0, 26)], failed: false };
    const why = ((sent && sent.why) || "upload failed").slice(0, 30);
    return downloaded
      ? { lines: ["SAVED ON HEADSET", why], failed: true }
      : { lines: ["SAVE FAILED", why], failed: true };
  }
};

module.exports = {
  MAX_MS,
  MAX_UPLOAD,
  uploadNote,
  MIN_MS,
  Recording,
  clock,
  chooseSpot,
  isWall,
  hideFromRecording,
  unhideFromRecording,
  hideForRender
};
