// private-quest-lounge: wall TV.
//
// Any screen-share video object in the room is pinned onto the TVScreen mesh
// on the west wall instead of floating wherever it spawned. A client opened
// with ?tv=1 is the dedicated screen feeder (Jay's Mac): after entering the
// room (enter WITHOUT microphone; screen-share audio still flows) it
// auto-starts a display share and parks its avatar in the corner behind the
// TV so the third occupant is out of sight.
//
// macOS note: Chrome only captures audio when sharing a TAB — play the movie
// in a tab and share that tab for sound.

import qsTruthy from "../utils/qs_truthy";

const isTvClient = qsTruthy("tv");
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
  // media video meshes are 1 unit wide at scale 1; fill the 3.2 m screen.
  obj.scale.setScalar(3.15);
  obj.matrixNeedsUpdate = true;
  // Not grabbable, not hoverable: it is furniture now.
  el.classList.remove("interactable");
  el.removeAttribute("is-remote-hover-target");
  el.removeAttribute("floaty-object");
  if (el.components["body-helper"]) el.removeAttribute("body-helper");
}

AFRAME.registerSystem("lounge-tv", {
  init() {
    this.pinned = new Set();
    this.sceneEl = this.el;

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
      this.sceneEl.addEventListener("entered", () => this.becomeTv(), { once: true });
      // Auto-enter the room (no mic) so bin/tv-daemon can run hands-free.
      const tryEnter = setInterval(() => {
        if (window.APP?.entryManager && window.NAF?.connection?.isConnected()) {
          clearInterval(tryEnter);
          window.APP.entryManager.enterSceneWhenLoaded(false, false);
        }
      }, 500);
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
    // Red: below the TV — summon the Mac's screen (signals bin/tv-daemon).
    this.wallButton(0xc0392b, 0x8a1f12, -11.4, 0.55, -5.2, () => {
      fetch("/lounge-tv/9c4f/on", { method: "POST" }).catch(() => {});
    });
    // Green: top-right of the TV (viewer's right = north) — full page reload,
    // for picking up new client builds without leaving the headset.
    this.wallButton(0x27ae60, 0x14602f, -11.4, 2.4, -8.4, () => {
      window.location.reload();
    });
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
    this.mirrorToMonitor();
  },

  // Give the desk monitor the same live video material as the wall TV.
  mirrorToMonitor() {
    const monitor = this.screens?.monitor;
    if (!monitor) return;
    let liveMaterial = null;
    for (const el of this.pinned) {
      if (!el.isConnected) continue;
      el.object3D.traverse(o => {
        if (!liveMaterial && o.isMesh && o.material?.map?.isVideoTexture) liveMaterial = o.material;
      });
    }
    if (liveMaterial && monitor.material !== liveMaterial) {
      monitor.userData.idleMaterial = monitor.userData.idleMaterial || monitor.material;
      monitor.material = liveMaterial;
    } else if (!liveMaterial && monitor.userData.idleMaterial && monitor.material !== monitor.userData.idleMaterial) {
      monitor.material = monitor.userData.idleMaterial;
    }
    // Max anisotropic filtering: keeps text sharp when the screen is viewed
    // at any angle or distance (default filtering smears it).
    if (liveMaterial?.map && liveMaterial.map.anisotropy < 16) {
      liveMaterial.map.anisotropy = 16;
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

  becomeTv() {
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
    setTimeout(async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const loopback = devices.find(d => d.kind === "audioinput" && /blackhole/i.test(d.label));
        if (loopback) {
          await window.APP.mediaDevicesManager.startMicShare({ deviceId: loopback.deviceId, unmute: true });
        }
      } catch (e) {
        console.warn("lounge-tv: loopback audio unavailable", e);
      }
      // Auto-start the screen share.
      this.sceneEl.emit("action_share_screen");
    }, 1000);
  }
});
