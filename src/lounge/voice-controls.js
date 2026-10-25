// private-quest-lounge: push-to-talk to the Mac (bin/voice-daemon).
//
// Panel right of the wall TV (past the sconce, above the plant), local to this client: the other viewer never
// sees what was heard. Its own pairing, separate from the TV PIN, locked to
// one headset: pairing makes a non-extractable signing key that stays in
// this browser, and every request is signed with it. Replies play in this
// headset; with BOTH HEAR on, the other viewer's client plays them too (by a
// short-lived clip id). Never through the TV or the room mix.
import * as THREE from "three";
import { label } from "./tv-controls";
import { hideFromRecording } from "./record-core.cjs";
import { paths } from "../systems/userinput/paths";
import { ReadbackScreen } from "./readback-screen";

const KEY = "lounge-voice-controller-v1";
const SHARE_KEY = "lounge-voice-share-v1";
const DATA_TYPE = "lounge-voice";
const MAX_MS = 20000;
const X = 2.3;

function wrap(text, width = 30, max = 6) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    if ((line + " " + word).trim().length > width) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines.length > max ? [...lines.slice(0, max - 1), lines[max - 1] + "..."] : lines;
}

function keyStore(mode, use) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("lounge-voice", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("keys");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction("keys", mode);
      const request = use(tx.objectStore("keys"));
      tx.oncomplete = () => {
        open.result.close();
        resolve(request.result);
      };
      tx.onerror = () => reject(tx.error);
    };
  });
}
// A 4-digit guest code, or the 6 to 8 digit owner PIN / Mac code. The server decides which it is.
const validCode = code => code.length === 4 || (code.length >= 6 && code.length <= 8);
const hex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
const base64 = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const stored = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export class VoiceControls {
  constructor(scene, screen) {
    this.scene = scene;
    this.anchor = screen.getWorldPosition(new THREE.Vector3());
    this.rotation = screen.getWorldQuaternion(new THREE.Quaternion());
    this.labels = [];
    try {
      this.token = localStorage.getItem(KEY);
    } catch {
      this.token = null;
    }
    this.share = stored(SHARE_KEY, "both") === "both";
    // Readback on the wall TV (idle or off only): status, what Jay said, Zoltar's reply, large.
    this.panel = new ReadbackScreen(
      scene,
      this.anchor,
      this.rotation,
      0,
      0,
      2.55,
      1.43,
      0.03,
      () => !!scene.systems["lounge-tv"]?.live
    );
    this.labels.push(this.panel);
    // One tidy column right of the TV, top button level with the top of the TV.
    this.talk = this.add(X, 0.62, 0.7, 0.24, ["TALK"], () => this.press());
    this.shareButton = this.add(X, 0.42, 0.7, 0.16, [""], () => this.toggleShare());
    this.add(X, 0.23, 0.7, 0.16, ["PAIR VOICE"], () => this.showPairing());
    // Visible to everyone; the owner's signed request is the lock. Shows the code only on this client, never in a recorded clip.
    this.inviteButton = this.add(X, 0.0, 0.7, 0.22, ["INVITE GUEST"], () => this.inviteGuest());
    hideFromRecording(this.inviteButton.el.object3D);
    // Zoltar's volume, persisted; see lounge/zoltar.js.
    this.add(X - 0.27, -0.19, 0.16, 0.16, ["-"], () => this.volume(-1));
    this.volumeLabel = this.add(X, -0.19, 0.34, 0.16, [""]);
    this.add(X + 0.27, -0.19, 0.16, 0.16, ["+"], () => this.volume(1));
    this.autoButton = this.add(X, -0.38, 0.7, 0.16, [""], () => this.toggleAuto());
    this.drawShare();
    this.drawVolume();
    this.idle();
    this.subscribe();
    this.subscribeTimer = setInterval(() => this.subscribe(), 2000);
    // Hold left X to talk, release to send.
    this.pttTimer = setInterval(() => this.pollX(), 50);
    // Zoltar's news from background tasks (bin/voice-task) arrives here.
    this.newsTimer = setInterval(() => this.checkNews(), 8000);
  }
  async checkNews() {
    if (!this.token || this.busy || this.recorder || this.newsBusy) return;
    this.newsBusy = true;
    try {
      const route = "/lounge-voice/v1/status";
      const response = await fetch(route, {
        headers: { Authorization: `Bearer ${this.token}`, ...(await this.signed("GET", route)) },
        signal: AbortSignal.timeout(7000)
      });
      if (response.status === 401) return; // reason is in bin/voice log; keep the pairing
      const news = response.ok && (await response.json()).announcement;
      if (!news) return;
      this.panel.show("", news.text);
      if (news.clip) {
        this.play(`/lounge-voice/v1/clip/${news.clip}`);
        if (this.share) NAF.connection?.broadcastDataGuaranteed(DATA_TYPE, { c: news.clip });
      }
    } catch {
      /* try again next round */
    } finally {
      this.newsBusy = false;
    }
  }
  pollX() {
    const held = !!this.scene.systems.userinput?.get(paths.device.webxr.left.button.a.pressed);
    if (held === this.xHeld) return;
    this.xHeld = held;
    if (!this.token) return; // unpaired headsets: X does nothing
    if (held && !this.recorder && !this.busy) {
      this.pulse();
      this.press();
    } else if (!held && this.recorder) this.recorder.stop();
  }
  pulse() {
    const actuator = this.scene.systems.userinput?.get(paths.haptics.actuators.left);
    actuator?.pulse?.(0.4, 40);
  }
  drawShare() {
    this.shareButton.draw([this.share ? "BOTH HEAR" : "ONLY ME"], false, this.share ? "#202a30" : "#ffb347");
  }
  drawVolume() {
    const z = this.scene.systems["lounge-zoltar"];
    this.volumeLabel.draw([`VOL ${z.percent}%`]);
    this.autoButton.draw([z.auto ? "AUTO BOOST ON" : "AUTO BOOST OFF"], false, z.auto ? "#ffb347" : "#202a30");
  }
  volume(direction) {
    this.scene.systems["lounge-zoltar"].changeVolume(direction);
    this.drawVolume();
  }
  toggleAuto() {
    this.scene.systems["lounge-zoltar"].toggleAuto();
    this.drawVolume();
  }
  toggleShare() {
    this.share = !this.share;
    try {
      localStorage.setItem(SHARE_KEY, this.share ? "both" : "me");
    } catch {
      /* session-only preference */
    }
    this.drawShare();
  }
  // The other viewer's reply clips. Ids are random and expire in minutes.
  subscribe() {
    if (this.subscribed || !window.NAF?.connection?.subscribeToDataChannel) return;
    NAF.connection.subscribeToDataChannel(DATA_TYPE, (_from, _type, data) => {
      // The owner pressed INVITE GUEST: open the keypad here. The code itself never travels.
      if (data?.invite === 1) return this.scene.systems["lounge-tv"]?.isFeeder || this.showPairing();
      if (!/^[a-f0-9]{32}$/.test(data?.c || "")) return;
      this.play(`/lounge-voice/v1/clip/${data.c}`);
    });
    this.subscribed = true;
    clearInterval(this.subscribeTimer);
  }
  // Zoltar (lounge/zoltar.js) speaks it; plain audio if he hasn't loaded.
  play(src) {
    this.audio?.pause();
    const telemetry = this.scene.systems["lounge-telemetry"];
    // A reply that fails to play used to vanish silently; log why and retry as plain audio.
    const fallback = error => {
      telemetry?.event("voice-play-failed", { msg: String(error?.message || error).slice(0, 200) });
      const plain = new Audio(src);
      this.audio = plain;
      plain.play().catch(e => telemetry?.event("voice-play-failed", { msg: `plain: ${String(e?.message || e).slice(0, 200)}` }));
    };
    try {
      this.audio = this.scene.systems["lounge-zoltar"]?.speak(src, fallback) || new Audio(src);
    } catch (error) {
      return fallback(error);
    }
    if (this.audio.paused) this.audio.play().catch(fallback);
  }
  async signed(method, route, body) {
    this.key = this.key || (await keyStore("readonly", store => store.get("headset")));
    if (!this.key) throw new Error("This headset lost its voice key. Pair again.");
    const time = String(Date.now());
    const bytes = body ? await body.arrayBuffer() : new ArrayBuffer(0);
    const text = `${time}\n${method}\n${route}\n${hex(await crypto.subtle.digest("SHA-256", bytes))}`;
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      this.key,
      new TextEncoder().encode(text)
    );
    return { "X-Voice-Time": time, "X-Voice-Signature": base64(signature) };
  }
  add(...args) {
    const item = label(this.scene, this.anchor, this.rotation, ...args);
    this.labels.push(item);
    return item;
  }
  idle() {
    this.talk.draw(["TALK"]);
  }
  // Wakes Zoltar's case (lounge/zoltar.js): lit from the moment Jay starts recording until the reply ends.
  wakeZoltar() {
    this.scene.systems["lounge-zoltar"]?.setVoiceState(!!this.recorder, this.busy);
  }
  async press() {
    if (!this.token) return this.showPairing();
    if (this.recorder) return this.recorder.stop();
    if (this.busy) return;
    try {
      await this.record();
    } catch (error) {
      this.panel.draw(["MIC UNAVAILABLE", ...wrap(error.message || String(error), 30, 3)], true);
      this.idle();
    }
  }
  // Clone the room mic when Hubs already holds one: a second capture on Quest
  // can end the existing track and set off Hubs' restart loop.
  async micStream() {
    const track = window.APP?.mediaDevicesManager?.audioTrack;
    if (track && track.readyState === "live") {
      const copy = track.clone();
      copy.enabled = true;
      return new MediaStream([copy]);
    }
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  }
  async record() {
    const stream = await this.micStream();
    const type = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
    const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks = [];
    recorder.ondataavailable = event => event.data.size && chunks.push(event.data);
    recorder.onstop = () => {
      clearTimeout(this.limit);
      stream.getTracks().forEach(t => t.stop());
      this.recorder = null;
      this.busy = true; // reply pending: keeps the case lit with no gap before send() runs
      this.wakeZoltar();
      this.send(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
    };
    this.recorder = recorder;
    recorder.start();
    this.wakeZoltar();
    this.limit = setTimeout(() => recorder.state === "recording" && recorder.stop(), MAX_MS);
    this.talk.draw(["LISTENING", this.xHeld ? "release X to send" : "press to send"], false, "#ffb347");
    this.panel.draw(["Speak now.", this.xHeld ? "Release X" : "Press TALK again", "when you're done."]);
  }
  async send(blob) {
    this.busy = true;
    this.talk.draw(["THINKING"], false, "#8fd3ff");
    try {
      const route = "/lounge-voice/v1/turn";
      const response = await fetch(route, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": blob.type,
          ...(await this.signed("POST", route, blob))
        },
        body: blob,
        signal: AbortSignal.timeout(100000)
      });
      const data = await response.json();
      if (!response.ok) {
        // Never drop the pairing on a refusal: with voice locked to this
        // headset, a dropped pairing could only be restored from the Mac.
        throw new Error(data.error || `Voice request failed (${response.status})`);
      }
      this.panel.show(data.heard && `"${data.heard}"`, data.reply);
      if (data.audio) this.play(`data:audio/mpeg;base64,${data.audio}`);
      if (this.share && data.clip) NAF.connection?.broadcastDataGuaranteed(DATA_TYPE, { c: data.clip });
    } catch (error) {
      this.panel.draw(["VOICE FAILED", ...wrap(error.message || String(error), 30, 3)], true);
    } finally {
      this.busy = false;
      this.wakeZoltar();
      this.idle();
    }
  }
  // Asks the Mac for a fresh four digit guest code, signed with this headset's
  // key (only the owner's key is accepted). Shown here for about five minutes.
  async inviteGuest() {
    if (this.inviteBusy) return;
    this.inviteBusy = true;
    clearInterval(this.inviteTimer);
    this.inviteButton.draw(["ASKING..."], false, "#8fd3ff");
    try {
      const route = "/lounge-voice/v1/invite-guest";
      const body = new Blob(["{}"], { type: "application/json" });
      const response = await fetch(route, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token || ""}`,
          "Content-Type": "application/json",
          ...(await this.signed("POST", route, body))
        },
        body,
        signal: AbortSignal.timeout(7000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !/^\d{4}$/.test(data.code || "")) throw new Error(data.error || "refused");
      const until = Date.now() + (data.expiresInSeconds || 300) * 1000;
      const show = () => {
        const left = Math.max(0, Math.round((until - Date.now()) / 1000));
        if (!left) {
          clearInterval(this.inviteTimer);
          this.inviteButton.draw(["INVITE GUEST"]);
          return;
        }
        this.inviteButton.draw(
          [`GUEST CODE ${data.code}`, `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} left`],
          false,
          "#ffb347"
        );
      };
      show();
      this.inviteTimer = setInterval(show, 1000);
      NAF.connection?.broadcastDataGuaranteed(DATA_TYPE, { invite: 1 });
    } catch (error) {
      // Short message only; the reason is in bin/voice log.
      this.inviteButton.draw(["REFUSED", "owner headset only"], true);
      setTimeout(() => this.inviteButton.draw(["INVITE GUEST"]), 3500);
    } finally {
      this.inviteBusy = false;
    }
  }
  showPairing() {
    if (this.keypad) return;
    this.code = "";
    this.keypad = [];
    const add = (...args) => {
      const item = label(this.scene, this.anchor, this.rotation, ...args);
      hideFromRecording(item.el.object3D); // never in a recorded clip
      this.keypad.push(item);
      return item;
    };
    const heading = add(0, 0.55, 1.8, 0.35, ["Voice PIN or owner code", "or 4-digit guest code"]);
    const close = () => {
      this.keypad?.forEach(item => item.remove());
      this.keypad = null;
    };
    [..."123456789", "BACK", "0", "OK"].forEach((key, i) => {
      add(((i % 3) - 1) * 0.38, 0.2 - Math.floor(i / 3) * 0.23, 0.34, 0.2, [key], async () => {
        if (key === "BACK") this.code = this.code.slice(0, -1);
        else if (key === "OK") {
          if (!validCode(this.code) || this.pairBusy) return;
          this.pairBusy = true;
          try {
            // The private half never leaves this browser, not even to us.
            const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, [
              "sign",
              "verify"
            ]);
            const { kty, crv, x, y } = await crypto.subtle.exportKey("jwk", pair.publicKey);
            const response = await fetch("/lounge-voice/v1/pair", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: this.code, key: { kty, crv, x, y } }),
              signal: AbortSignal.timeout(7000)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Pairing failed (${response.status})`);
            await keyStore("readwrite", store => store.put(pair.privateKey, "headset"));
            this.key = pair.privateKey;
            this.token = data.token;
            try {
              localStorage.setItem(KEY, this.token);
            } catch {
              /* keep this session paired */
            }
            close();
            this.panel.draw(["LOCKED TO THIS HEADSET", "Press TALK, speak,", "press again to send"]);
          } catch (error) {
            heading.draw(["PAIRING FAILED", ...wrap(error.message, 26, 2)], true);
          } finally {
            this.pairBusy = false;
          }
          return;
        } else if (this.code.length < 8) this.code += key;
        heading.draw([
          validCode(this.code) ? "PRESS OK TO PAIR" : "ENTER VOICE PIN",
          "•".repeat(this.code.length) || "4-digit guest code or 6 to 8"
        ]);
      });
    });
    add(0.85, -0.45, 0.45, 0.2, ["CANCEL"], close);
  }
  remove() {
    clearInterval(this.subscribeTimer);
    clearInterval(this.pttTimer);
    clearInterval(this.newsTimer);
    clearInterval(this.inviteTimer);
    this.recorder?.state === "recording" && this.recorder.stop();
    this.audio?.pause();
    this.labels.forEach(item => item.remove());
    this.keypad?.forEach(item => item.remove());
  }
}
