// private-quest-lounge: wall TV.
//
// Any screen-share video object in the room is pinned onto the TVScreen mesh
// on the west wall instead of floating wherever it spawned. A client opened
// with a daemon-issued ?tv=1 launch capability is the Mac screen feeder.
// It captures Screen 1 and BlackHole system audio, silences room playback to
// avoid feedback, and stops both tracks if control connectivity is lost.

import qsTruthy from "../utils/qs_truthy";
import { TvControls } from "./tv-controls";
import { LightsPanel, setTvLive } from "./lights";
import { MediaDevicesEvents } from "../utils/media-devices-utils";
import { updateAudioSettings } from "../update-audio-settings";

const feederToken = new URLSearchParams(window.location.hash.slice(1)).get("tv-session");
const isTvClient = qsTruthy("tv") && /^[a-f0-9]{64}$/.test(feederToken || "");
if (isTvClient) window.history.replaceState(null, "", window.location.pathname + window.location.search);
const VIDEO_SRC_RE = /^hubs:\/\/clients\/\S+\/video$/;

function findScreens(scene) {
  const found = { tv: null, monitor: null };
  scene.object3D.traverse(o => {
    if (!found.tv && o.name === "TVScreen") found.tv = o;
    if (!found.monitor && o.name === "MonitorScreen") found.monitor = o;
  });
  return found.tv ? found : null;
}

function pinEntityToScreen(el, screen) {
  const obj = el.object3D;
  screen.updateMatrices ? screen.updateMatrices() : screen.updateMatrixWorld(true);
  screen.getWorldPosition(obj.position);
  screen.getWorldQuaternion(obj.quaternion);
  // Nudge off the glass so the video z-fights nothing.
  obj.translateZ(0.02);
  // media video meshes are 1 unit wide at scale 1; fill the 2.6 m panel
  // (16:9 at 2.55 wide is 1.43 tall, inside the 1.5 m screen).
  obj.scale.setScalar(2.55);
  obj.matrixNeedsUpdate = true;
  // Not grabbable, not hoverable: it is furniture now.
  el.classList.remove("interactable");
  el.removeAttribute("is-remote-hover-target");
  el.removeAttribute("floaty-object");
  if (el.components["body-helper"]) el.removeAttribute("body-helper");
}

AFRAME.registerSystem("lounge-tv", {
  init() {
    this.isFeeder = isTvClient;
    this.pinned = new Set();
    this.sceneEl = this.el;
    // Per-viewer TV mute. Only the TV's own audio (feeder avatar + pinned
    // screen-share) is silenced; people's voices are untouched.
    this.tvMuted = false;
    this.mutedByTv = new Set();

    this.sceneEl.addEventListener("environment-scene-loaded", () => {
      this.screens = findScreens(this.sceneEl);
    });

    // Keep Quest fixed foveation at maximum. The TV is still readable in the
    // gaze centre, while the peripheral savings leave headroom for two avatars
    // and live video without pushing the headset into frame stalls.
    this.sceneEl.addEventListener("enter-vr", () => {
      try {
        this.sceneEl.renderer?.xr?.setFoveation?.(1);
      } catch (e) {
        console.warn("lounge-tv: could not set foveation", e);
      }
    });

    // Pin any networked screen-share video object as it appears.
    this.observer = new MutationObserver(() => this.scan());
    this.observer.observe(this.sceneEl, { childList: true, subtree: false });
    this.scanInterval = setInterval(() => this.scan(), 1500);

    if (isTvClient) {
      this.initFeeder();
    } else {
      // Power button on the wall below the TV: press in-room to summon the
      // Mac's screen (signals bin/tv-daemon through the tunnel).
      this.sceneEl.addEventListener("environment-scene-loaded", () => this.addPowerButton(), { once: true });
    }
  },

  wallButton(color, emissive, x, y, z, onPress) {
    const btn = document.createElement("a-entity");
    this.sceneEl.appendChild(btn);
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.04, 20),
      new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.7, roughness: 0.5 })
    );
    disc.rotation.z = Math.PI / 2; // cylinder axis along x — button face into the room
    btn.setObject3D("mesh", disc);
    btn.object3D.position.set(x, y, z);
    btn.classList.add("interactable");
    btn.setAttribute("is-remote-hover-target", "");
    btn.setAttribute("tags", "singleActionButton: true");
    btn.object3D.addEventListener("interact", onPress);
    return btn;
  },

  addPowerButton() {
    const tv = this.screens?.tv;
    if (!tv || this.controls) return;
    tv.updateMatrices ? tv.updateMatrices() : tv.updateMatrixWorld(true);
    this.controls = new TvControls(this.sceneEl, tv, () => this.toggleMute());
    this.lightsPanel = new LightsPanel(this.sceneEl, tv);
  },

  scan() {
    if (!this.screens) {
      this.screens = findScreens(this.sceneEl);
      if (!this.screens) return;
    }
    const els = this.sceneEl.querySelectorAll("[media-loader]");
    for (const el of els) {
      if (this.pinned.has(el)) continue;
      const src = el.components["media-loader"]?.data?.src;
      if ((typeof src === "string" && VIDEO_SRC_RE.test(src)) || src instanceof MediaStream) {
        this.pinned.add(el);
        pinEntityToScreen(el, this.screens.tv);
        if (typeof src === "string") this.tvClientId = src.match(/clients\/([^/]+)\/video/)?.[1] || null;
      }
    }
    for (const el of [...this.pinned]) if (!el.isConnected) this.pinned.delete(el);
    // The screen-feeder client is furniture, not a person — hide its avatar.
    if (this.tvClientId) {
      for (const el of document.querySelectorAll("[networked-avatar]")) {
        if (el.components.networked?.data?.owner === this.tvClientId && el.object3D.visible) {
          el.object3D.visible = false;
        }
      }
    }
    this.applyMute();
    this.mirrorToMonitor();
  },

  toggleMute() {
    this.tvMuted = !this.tvMuted;
    this.applyMute();
    return this.tvMuted;
  },

  tvAudioEls() {
    const els = [...this.pinned].filter(el => el.isConnected);
    if (this.tvClientId) {
      for (const el of document.querySelectorAll("[networked-avatar]")) {
        if (el.components.networked?.data?.owner !== this.tvClientId) continue;
        el.querySelectorAll("[avatar-audio-source]").forEach(audioEl => els.push(audioEl));
      }
    }
    return els;
  },

  applyMute() {
    const targets = this.tvMuted ? new Set(this.tvAudioEls()) : new Set();
    const changed = [];
    for (const el of targets) {
      if (APP.mutedState.has(el)) continue;
      APP.mutedState.add(el);
      this.mutedByTv.add(el);
      changed.push(el);
    }
    for (const el of [...this.mutedByTv]) {
      if (targets.has(el)) continue;
      APP.mutedState.delete(el);
      this.mutedByTv.delete(el);
      changed.push(el);
    }
    for (const el of changed) {
      const audio = APP.audios.get(el);
      if (audio) updateAudioSettings(el, audio);
    }
  },

  // Give the desk monitor the same live video material as the wall TV.
  mirrorToMonitor() {
    const monitor = this.screens?.monitor;
    let liveMaterial = null;
    for (const el of this.pinned) {
      if (!el.isConnected) continue;
      el.object3D.traverse(o => {
        if (!liveMaterial && o.isMesh && o.material?.map?.isVideoTexture) liveMaterial = o.material;
      });
    }
    // Dim the room while a live picture is on the wall (viewers only).
    if (!this.isFeeder) setTvLive(!!liveMaterial);
    if (monitor && liveMaterial && monitor.material !== liveMaterial) {
      monitor.userData.idleMaterial = monitor.userData.idleMaterial || monitor.material;
      monitor.material = liveMaterial;
    } else if (!liveMaterial && monitor?.userData.idleMaterial && monitor.material !== monitor.userData.idleMaterial) {
      monitor.material = monitor.userData.idleMaterial;
    }
    // Max anisotropic filtering: keeps text sharp when the screen is viewed
    // at any angle or distance (default filtering smears it).
    const anisotropy = Math.min(16, this.sceneEl.renderer.capabilities.getMaxAnisotropy());
    if (liveMaterial?.map && liveMaterial.map.anisotropy < anisotropy) {
      liveMaterial.map.anisotropy = anisotropy;
      liveMaterial.map.needsUpdate = true;
    }
  },

  tick() {
    // Re-assert the pin: physics/networking may try to move the panel.
    if (!this.screens) return;
    for (const el of this.pinned) {
      if (el.isConnected && el.object3D) pinEntityToScreen(el, this.screens.tv);
    }
  },

  async initFeeder() {
    this.feederReport = { audio: "connecting" };
    this.feederFailures = 0;
    this.onFeederEnded = () => {
      if (this.feederStopped) return;
      this.feederReport.error = "Screen sharing ended. Press START to share again.";
      this.heartbeat();
      this.stopFeeder();
    };
    this.sceneEl.addEventListener("share_video_failed", this.onFeederEnded);
    this.sceneEl.addEventListener("share_video_disabled", this.onFeederEnded);
    this.sceneEl.addEventListener("share_video_enabled", () => {
      this.videoPublished = true;
      if (this.feederStopped) this.stopFeeder(); // Capture permission may finish after Stop.
    });
    this.sceneEl.addEventListener("entered", () => this.becomeTv(), { once: true });
    // Authenticate the per-launch capability before entering or capturing.
    if (!(await this.heartbeat())) return;
    this.feederPoll = setInterval(() => this.heartbeat(), 2000);
    this.enterPoll = setInterval(() => {
      if (this.feederStopped) return;
      if (window.APP?.entryManager && window.NAF?.connection?.isConnected()) {
        clearInterval(this.enterPoll);
        window.APP.entryManager.enterSceneWhenLoaded(false, false);
      }
    }, 500);
  },

  async heartbeat() {
    if (this.heartbeatBusy) return false;
    this.heartbeatBusy = true;
    const manager = window.APP?.mediaDevicesManager;
    const video = manager?.mediaStream?.getVideoTracks().find(t => t.readyState === "live");
    if (video && this.videoPublished) {
      const settings = video.getSettings();
      this.feederReport.video = {
        width: settings.width,
        height: settings.height,
        fps: settings.frameRate,
        display: settings.displaySurface || video.label
      };
    }
    if (manager?.audioTrack?.readyState === "live" && /blackhole/i.test(manager.audioTrack.label)) {
      this.feederReport.audio = true;
    } else if (this.feederReport.audio === true) {
      this.feederReport.audio = "BlackHole audio disconnected";
    }
    try {
      const response = await fetch("/lounge-tv/v1/heartbeat", {
        method: "POST",
        headers: { Authorization: `Bearer ${feederToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(this.feederReport),
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) throw new Error("TV control unavailable");
      const data = await response.json();
      if (data.command !== "continue") {
        this.stopFeeder();
        return false;
      }
      this.feederFailures = 0;
      return true;
    } catch {
      if (++this.feederFailures >= 2 || !this.feederPoll) this.stopFeeder();
      return false;
    } finally {
      this.heartbeatBusy = false;
    }
  },

  async stopFeeder() {
    this.feederStopped = true;
    clearInterval(this.feederPoll);
    clearInterval(this.enterPoll);
    clearTimeout(this.captureDelay);
    const manager = window.APP?.mediaDevicesManager;
    // Stop tracks synchronously too: failed signaling must not leave capture on.
    manager?.mediaStream?.getVideoTracks().forEach(track => track.stop());
    manager?.audioTrack?.stop();
    await Promise.allSettled([manager?.stopVideoShare(), manager?.stopMicShare()]);
    this.sceneEl.emit(MediaDevicesEvents.VIDEO_SHARE_ENDED);
    // Leave the room. A stopped feeder that stays connected is a ghost
    // participant: it counts against the two-person cap, holds SFU transports
    // and piles up with every Start/Retry (each launch is a new tab).
    if (!this.leaveTimer) {
      this.leaveTimer = setTimeout(() => {
        window.close();
        window.location.replace("about:blank");
      }, 1500);
    }
  },

  remove() {
    this.observer?.disconnect();
    clearInterval(this.scanInterval);
    this.controls?.remove();
    this.lightsPanel?.remove();
    if (isTvClient) this.stopFeeder();
  },

  becomeTv() {
    if (this.feederStopped) return;
    if (!window.APP.hubChannel.can("spawn_and_move_media")) {
      this.feederReport.error = "The TV feeder does not have screen-sharing permission in this room.";
      this.heartbeat();
      this.stopFeeder();
      return;
    }
    // Park the avatar in the north-west corner, facing the wall.
    const rig = document.getElementById("avatar-rig");
    if (rig) {
      rig.object3D.position.set(-9.5, 0, -6.8);
      rig.object3D.rotation.set(0, Math.PI / 2, 0);
      rig.object3D.matrixNeedsUpdate = true;
    }
    // CRITICAL: never play room audio out of the Mac. With the BlackHole
    // loopback capturing the Mac's output, any voice audio this client plays
    // would feed straight back into the room as an echo loop.
    window.APP.store.update({
      preferences: {
        globalVoiceVolume: 0,
        globalMediaVolume: 0,
        globalSFXVolume: 0,
        // Music through voice processing sounds terrible — feed the loopback raw.
        disableEchoCancellation: true,
        disableNoiseSuppression: true,
        disableAutoGainControl: true
      }
    });
    // System audio: if a BlackHole loopback device exists, use it as this
    // client's "microphone" — the daemon routes Mac output into it, so all
    // Mac audio (any app, not just tabs) streams into the room.
    this.captureDelay = setTimeout(async () => {
      // Video and loopback audio have separate permission paths. A pending
      // microphone prompt must not prevent the display from connecting.
      this.sceneEl.emit("action_share_screen");
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const loopback = devices.find(d => d.kind === "audioinput" && /blackhole/i.test(d.label));
        if (loopback) {
          const started = await window.APP.mediaDevicesManager.startMicShare({
            deviceId: loopback.deviceId,
            unmute: true
          });
          this.feederReport.audio = started ? true : "BlackHole permission denied";
        } else this.feederReport.audio = "BlackHole unavailable; video only";
      } catch (e) {
        this.feederReport.audio = "BlackHole capture failed; video only";
        console.warn("lounge-tv: loopback audio unavailable", e);
      }
      if (this.feederStopped) {
        this.stopFeeder();
        return;
      }
    }, 1000);
  }
});
