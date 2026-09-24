const test = require("node:test");
const assert = require("node:assert/strict");
const { SocialState, ContactLatch } = require("../src/lounge/social-state.cjs");
const make = () => new SocialState("a");
const event = (type, data = {}, from = "b", at = 1000) => ({ type, ...data, from_session_id: from, at });
const invite = event("invite", { id: "pair", to: "a", pose: "hug" });
const accept = event("accept", { id: "pair", to: "b" }, "a", 1200);
test("a local avatar never accepts from a network event without its own action", () => {
  const s = make(); s.receive(invite, 1000); s.receive(accept, 1200);
  assert.equal(s.pairFor("a"), null);
});
test("both actors, nonce, expiry and consent must match; observers may render accepted pair", () => {
  const s = make(); s.receive(invite, 1000); s.consent("pair");
  s.receive({ ...accept, from_session_id: "stranger" }, 1200); assert.equal(s.pairs.size, 0);
  s.receive(accept, 1200); assert.equal(s.pairFor("a").name, "hug");
  assert.equal(s.pairFor("a").startedAt, 1500);
  const observer = new SocialState("c"); observer.receive(invite, 1000); observer.receive(accept, 1200);
  assert.equal(observer.pairs.size, 1);
  const expired = make(); expired.receive(invite, 1000); expired.consent("pair");
  expired.receive({ ...accept, at: 17000 }, 17000); assert.equal(expired.pairs.size, 0);
});
test("Stop is immediate, either partner can stop, strangers and replay cannot restart", () => {
  const s = make(); s.receive(invite, 1000); s.consent("pair"); s.receive(accept, 1200);
  s.receive(event("stop", { id: "pair", to: "a" }, "stranger", 1300), 1300); assert.equal(s.pairs.size, 1);
  s.receive(event("stop", { id: "pair", to: "a" }, "b", 1400), 1400); assert.equal(s.pairs.size, 0);
  s.receive({ ...invite, at: 1500 }, 1500); s.receive({ ...accept, at: 1600 }, 1600); assert.equal(s.pairs.size, 0);
});
test("touch defaults off and requires a fresh second opt-in", () => {
  const s = make(); s.receive(event("state", { touch: true }), 1000);
  assert.equal(s.mutualTouch("b", 1100), false); s.touch = true;
  assert.equal(s.mutualTouch("b", 1100), true); assert.equal(s.mutualTouch("b", 12000), false);
  s.receive(event("state", { touch: false }, "b", 1300), 1300);
  s.receive(event("state", { touch: true }, "b", 1100), 1400);
  assert.equal(s.mutualTouch("b", 1400), false);
});
test("disconnect and peer heartbeat expiry end the pair", () => {
  const s = make(); s.receive(invite, 1000); s.consent("pair"); s.receive(accept, 1200);
  for (const id of ["a", "b"]) s.receive(event("state", { touch: false }, id), 1000);
  s.expire(2000, new Set(["a", "b"])); assert.equal(s.pairs.size, 1);
  s.expire(12000, new Set(["a", "b"])); assert.equal(s.pairs.size, 0);
});
test("contact hysteresis and cooldown suppress buzz and tracking jitter", () => {
  const c = new ContactLatch(); assert.equal(c.sample("hand", .1, 1000), true);
  assert.equal(c.sample("hand", .13, 1800), false); assert.equal(c.sample("hand", .1, 1900), false);
  assert.equal(c.sample("hand", .3, 2000), false); assert.equal(c.sample("hand", .1, 2100), true);
  c.sample("hand", .3, 2200); assert.equal(c.sample("hand", .1, 2300), false);
});
test("slow approach through the outer release band still produces contact", () => {
  const c = new ContactLatch();
  assert.equal(c.sample("hand", .3, 1000), false);
  assert.equal(c.sample("hand", .15, 1050), false);
  assert.equal(c.sample("hand", .10, 1100), true);
});
test("invitation pose is immutable after consent", () => {
  const s = make(); s.receive(invite, 1000); s.consent("pair");
  s.receive({ ...invite, pose: "slow_dance", at: 1100 }, 1100);
  s.receive(accept, 1200); assert.equal(s.pairFor("a").name, "hug");
});
test("late older emote cannot resurrect a stopped animation", () => {
  const s = make(); s.receive(event("emote", { name: "none" }, "b", 1300), 1300);
  s.expire(1400); s.receive(event("emote", { name: "dance" }, "b", 1200), 1400);
  assert.equal(s.emotes.get("b").name, "none");
});
