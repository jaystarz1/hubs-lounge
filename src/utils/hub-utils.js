import configs from "./configs";
import { MYSTERIES } from "../lounge/mysteries";

// The night of the week a session belongs to (Monday 0 .. Sunday 6), in the
// lounge's time zone, the night running to 6 a.m. (a session that starts after
// midnight is still the evening before). ?mimeNight=0..6 (or mon..sun) picks one.
export const NIGHT_NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "America/Toronto", weekday: "short" });
export function nightOf(startSeconds) {
  const forced = new URLSearchParams(window.location.search).get("mimeNight");
  if (forced !== null) {
    const k = NIGHT_NAMES.indexOf(forced.slice(0, 3).toLowerCase());
    if (k >= 0) return k;
    if (/^[0-6]$/.test(forced)) return Number(forced);
  }
  const day = weekday
    .format(new Date((startSeconds - 6 * 3600) * 1000))
    .slice(0, 3)
    .toLowerCase();
  return Math.max(0, NIGHT_NAMES.indexOf(day));
}
export function getCurrentHubId() {
  const qs = new URLSearchParams(location.search);
  const defaultRoomId = configs.feature("default_room_id");

  return (
    qs.get("hub_id") ||
    (document.location.pathname === "/" && defaultRoomId
      ? defaultRoomId
      : document.location.pathname.substring(1).split("/")[0])
  );
}

export function updateVRHudPresenceCount({ presence }) {
  const occupantCount = Object.getOwnPropertyNames(presence.state).length;
  const vrHudPresenceCount = document.querySelector("#hud-presence-count");
  vrHudPresenceCount.setAttribute("text", "value", occupantCount.toString());
}
export function updateSceneCopresentState(presence, scene) {
  const occupantCount = Object.getOwnPropertyNames(presence.state).length;
  if (occupantCount > 1) {
    scene.addState("copresent");
  } else {
    scene.removeState("copresent");
  }
}

// When this page first joined the room. It rides in the presence context so
// every client agrees on when the current session began (the earliest joiner
// still present), and it survives reconnects so a dropout doesn't restart it.
let joinedAt = null;

// ?dinner=21:00 (Toronto time, today): the session starts then for everyone
// with the link, on the next 6-minute beat, so nobody misses the patio (Jay,
// 2026-10-22, the mystery test). Until then the figures hold their first pose.
let fixedStart;
function dinnerAt() {
  if (fixedStart !== undefined) return fixedStart;
  fixedStart = null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(new URLSearchParams(location.search).get("dinner") || "");
  if (!m) return null;
  const zone = { timeZone: "America/Toronto", hourCycle: "h23" };
  const [y, mo, d] = new Intl.DateTimeFormat("en-CA", { ...zone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date())
    .split("-")
    .map(Number);
  const want = Number(m[1]) * 60 + Number(m[2]);
  // (Toronto is UTC-4 or -5: take the offset that reads back as the time asked for)
  for (const off of [4, 5]) {
    const t = Date.UTC(y, mo - 1, d, 0, want + off * 60);
    const [h, mi] = new Intl.DateTimeFormat("en-GB", { ...zone, hour: "2-digit", minute: "2-digit" })
      .format(new Date(t))
      .split(":")
      .map(Number);
    if (h * 60 + mi === want) {
      fixedStart = Math.ceil(t / 360000) * 360000;
      break;
    }
  }
  return fixedStart;
}

// The week's murder mysteries (lounge/mystery.js, lounge/mysteries): every
// evening from 7 pm Toronto until 6 the next morning that has a case
// (Monday's on Monday night and so on), or with ?mystery in the link (with
// ?mimeNight= for another night's). While it is on the dinner waits for
// company: it starts on the first 6-minute beat after a second person (not the
// Mac TV) is in, and that start is kept (here and in this device's storage,
// and the room tells each other theirs: the earliest wins), so a headset that
// drops out and comes back doesn't restart it. A start over 70 minutes old
// with nobody left to recompute it is let go.
const MYSTERY_FROM = 19;
const MYSTERY_TO = 6;
const BEAT_MS = 360000;
const KEEP_MS = 70 * 60000;
let mysteryCheck = { at: -Infinity, on: false };
function torontoParts(ms) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit"
  }).formatToParts(new Date(ms));
  const get = t => p.find(x => x.type === t)?.value;
  return { day: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}
// The case for the session starting at startSeconds: its night's name, or null.
export function mysteryNight(startSeconds) {
  const n = NIGHT_NAMES[nightOf(startSeconds)];
  return MYSTERIES[n] ? n : null;
}
export function mysteryOn() {
  const now = Date.now();
  if (now - mysteryCheck.at < 60000) return mysteryCheck.on;
  const forced = new URLSearchParams(location.search).has("mystery");
  const { hour } = torontoParts(now);
  const evening = hour >= MYSTERY_FROM || hour < MYSTERY_TO;
  const on = (forced || evening) && mysteryNight(now / 1000) !== null;
  mysteryCheck = { at: now, on };
  return on;
}
// The evening a start belongs to (its day, the night running to 6 a.m.).
const evening = () => torontoParts(Date.now() - MYSTERY_TO * 3600000).day;
// Who the case leaves where they are for the rest of the night (the dead, the
// taken away): their figure tags. loop-animation holds their last frame of the
// case once it ends; mystery.js sets them for tonight's.
export const mysteryGone = new Set();
const LATCH_KEY = "loungeMysteryStart";
let latched = null;
try {
  const s = JSON.parse(localStorage.getItem(LATCH_KEY) || "null");
  if (s?.day === evening() && typeof s.at === "number") latched = s.at;
} catch {
  /* no storage */
}
export function adoptStart(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms % BEAT_MS !== 0) return;
  if (latched !== null && latched <= ms) return;
  latched = ms;
  try {
    localStorage.setItem(LATCH_KEY, JSON.stringify({ day: evening(), at: ms }));
  } catch {
    /* no storage */
  }
}
export function latchedStart() {
  return latched;
}
// The people in the room (the TV feeder doesn't count), by when they came in.
export function guestJoins() {
  const state = window.APP?.hubChannel?.presence?.state || {};
  const out = [];
  for (const id in state) {
    const c = state[id]?.metas?.[0]?.context;
    if (!c || c.tv || typeof c.joined_at !== "number") continue;
    out.push(c.joined_at);
  }
  return out.sort((a, b) => a - b);
}
function mysteryStart() {
  const joins = guestJoins();
  if (latched !== null && joins.length < 2 && Date.now() - latched > KEEP_MS) latched = null;
  if (joins.length >= 2) adoptStart(Math.ceil(joins[1] / BEAT_MS) * BEAT_MS);
  // (nobody to dine with yet: the start is always a beat away, so they hold)
  return latched ?? (Math.ceil(Date.now() / BEAT_MS) + 1) * BEAT_MS;
}

export function sessionStart() {
  const fixed = dinnerAt();
  if (fixed !== null) return fixed;
  if (mysteryOn()) return mysteryStart();
  const state = window.APP?.hubChannel?.presence?.state;
  let start = Infinity;
  if (state) {
    for (const id in state) {
      const j = state[id]?.metas?.[0]?.context?.joined_at;
      if (typeof j === "number" && j < start) start = j;
    }
  }
  return Number.isFinite(start) ? start : (joinedAt ?? Date.now());
}

export function createHubChannelParams({
  permsToken,
  profile,
  pushSubscriptionEndpoint,
  isMobile,
  isMobileVR,
  isEmbed,
  hubInviteId,
  authToken
}) {
  if (joinedAt === null) joinedAt = Date.now();
  return {
    profile,
    push_subscription_endpoint: pushSubscriptionEndpoint,
    auth_token: authToken || null,
    perms_token: permsToken || null,
    context: {
      mobile: isMobile || isMobileVR,
      embed: isEmbed,
      hmd: isMobileVR,
      tv: new URLSearchParams(location.search).get("tv") === "1",
      joined_at: joinedAt
    },
    hub_invite_id: hubInviteId
  };
}

export function isRoomOwner(clientId) {
  const presences = APP.hubChannel.presence.state;
  return presences && presences[clientId] && presences[clientId].metas[0].roles.owner;
}

export function isLockedDownDemoRoom() {
  if (APP.hubChannel?.canOrWillIfCreator("update_hub")) return;
  const hubId = getCurrentHubId();
  if (configs.feature("is_locked_down_demo_room")) {
    const idArr = configs.feature("is_locked_down_demo_room").replace(/\s/g, "").split(",");
    return idArr.includes(hubId);
  } else {
    return false;
  }
}
