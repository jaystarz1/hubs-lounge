// Pure consent/state reducer. The transport authenticates the sender; this
// reducer still requires the local user's own action before moving their avatar.
const INVITE_MS = 15000;
const PEER_MS = 10000;
const PAIR_MS = 60000;
const EMOTE_MS = { wave: 4500, clap: 4500, dance: 12000, sit: 60000, none: 0 };

class SocialState {
  constructor(id) {
    this.id = id;
    this.touch = false;
    this.peers = new Map();
    this.invites = new Map();
    this.pairs = new Map();
    this.emotes = new Map();
    this.expressions = new Map();
    this.consented = new Map();
    this.cancelled = new Map();
    this.seen = new Map();
  }
  consent(id, invitation = this.invites.get(id)) {
    if (invitation) this.consented.set(id, { a: invitation.a, b: invitation.b, name: invitation.name });
  }
  pairFor(member) {
    for (const pair of this.pairs.values()) if (pair.a === member || pair.b === member) return pair;
    return null;
  }
  cancel(id, now) {
    this.pairs.delete(id);
    this.invites.delete(id);
    this.consented.delete(id);
    this.cancelled.set(id, now + PAIR_MS);
  }
  receive(e, now) {
    if (!e || !e.from_session_id || !Number.isFinite(e.at) || e.at > now + 2000 || e.at < now - INVITE_MS) return false;
    const from = e.from_session_id;
    const key = [from, e.type, e.id || e.name || e.touch, e.at].join(":");
    if (this.seen.has(key)) return false;
    this.seen.set(key, now + INVITE_MS);
    if (e.type === "state") {
      const old = this.peers.get(from);
      if (!old || e.at >= old.at) this.peers.set(from, { touch: e.touch === true, at: e.at });
    } else if (e.type === "emote" && Object.hasOwn(EMOTE_MS, e.name)) {
      const old = this.emotes.get(from);
      if (!this.pairFor(from) && (!old || e.at >= old.startedAt))
        this.emotes.set(from, { name: e.name, startedAt: e.at, until: e.at + EMOTE_MS[e.name] });
    } else if (e.type === "expression" && ["neutral", "smile", "sad", "surprise", "wink"].includes(e.name)) {
      const old = this.expressions.get(from);
      if (!old || e.at >= old.startedAt)
        this.expressions.set(from, { name: e.name, startedAt: e.at, until: e.at + (e.name === "wink" ? 1000 : 6000) });
    } else if (e.type === "invite" && !this.cancelled.has(e.id) && !this.pairFor(from) && !this.pairFor(e.to)) {
      // A nonce identifies one immutable invitation, not a mutable pose slot.
      if (this.invites.has(e.id)) return false;
      for (const pending of this.invites.values()) {
        if ([pending.a, pending.b].some(actor => actor === from || actor === e.to)) return false;
      }
      if (this.invites.size < 32) this.invites.set(e.id, { id: e.id, a: from, b: e.to, name: e.pose, at: e.at });
    } else if (e.type === "accept") {
      const invite = this.invites.get(e.id);
      if (
        !invite ||
        invite.b !== from ||
        invite.a !== e.to ||
        e.at - invite.at > INVITE_MS ||
        this.cancelled.has(e.id) ||
        this.pairFor(from) ||
        this.pairFor(e.to)
      )
        return false;
      const consent = this.consented.get(e.id);
      if (
        (invite.a === this.id || invite.b === this.id) &&
        (!consent || consent.a !== invite.a || consent.b !== invite.b || consent.name !== invite.name)
      )
        return false;
      this.pairs.set(e.id, { ...invite, startedAt: e.at + 300, until: e.at + PAIR_MS });
      this.invites.delete(e.id);
      this.emotes.delete(invite.a);
      this.emotes.delete(invite.b);
    } else if (e.type === "stop") {
      const item = this.pairs.get(e.id) || this.invites.get(e.id);
      if (item && ((item.a === from && item.b === e.to) || (item.b === from && item.a === e.to)))
        this.cancel(e.id, now);
    }
    return true;
  }
  mutualTouch(other, now) {
    const peer = this.peers.get(other);
    return this.touch && peer?.touch === true && now - peer.at < PEER_MS;
  }
  expire(now, present) {
    for (const [key, until] of this.seen) if (until < now) this.seen.delete(key);
    for (const [key, until] of this.cancelled) if (until < now) this.cancelled.delete(key);
    for (const [id, peer] of this.peers)
      if (now - peer.at > PEER_MS || (present && !present.has(id))) this.peers.delete(id);
    for (const [id, item] of this.invites)
      if (now - item.at > INVITE_MS || (present && (!present.has(item.a) || !present.has(item.b))))
        this.cancel(id, now);
    for (const [id, pair] of this.pairs) {
      if (now > pair.until || !this.peers.has(pair.a) || !this.peers.has(pair.b)) this.cancel(id, now);
    }
    // Retain finished-event timestamps briefly so a late older message
    // cannot resurrect an animation after Stop/Neutral.
    for (const map of [this.emotes, this.expressions])
      for (const [id, item] of map) if (now > item.until + INVITE_MS || (present && !present.has(id))) map.delete(id);
  }
}

// Contact latch: one pulse on approach, no continuous buzzing, and a distinct
// release radius to avoid repeated pulses from noisy controller poses.
class ContactLatch {
  constructor() {
    this.contacts = new Map();
  }
  sample(key, distance, now, radius = 0.12) {
    const old = this.contacts.get(key) || { touching: false, at: -Infinity };
    const hit = !old.touching && distance <= radius && now - old.at >= 650;
    old.touching = distance <= radius + (old.touching ? 0.06 : 0);
    if (hit) old.at = now;
    this.contacts.set(key, old);
    return hit;
  }
}

module.exports = { SocialState, ContactLatch, INVITE_MS, PEER_MS, EMOTE_MS };
