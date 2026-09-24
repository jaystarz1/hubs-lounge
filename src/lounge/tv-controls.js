import * as THREE from "three";

const KEY = "lounge-tv-controller-v1";

// Canvas labels stay readable in immersive VR and need no DOM prompt/keyboard.
export function label(scene, anchor, rotation, x, y, width, height, lines, onPress) {
  const el = document.createElement("a-entity");
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = Math.round((1024 * height) / width);
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const geometry = new THREE.PlaneGeometry(width, height);
  el.setObject3D("mesh", new THREE.Mesh(geometry, material));
  const draw = (text, failed = false, background = "#202a30") => {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = failed ? "#ffb6a6" : background === "#202a30" ? "#fff0d4" : "#202a30";
    ctx.font = `600 ${Math.min(156, Math.floor(canvas.height / (text.length + 1.5)))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    text.forEach((line, i) => ctx.fillText(line, 512, (canvas.height * (i + 1)) / (text.length + 1), 970));
    texture.needsUpdate = true;
  };
  draw(lines);
  scene.appendChild(el);
  el.object3D.position.copy(new THREE.Vector3(x, y, 0.08).applyQuaternion(rotation).add(anchor));
  el.object3D.quaternion.copy(rotation);
  el.object3D.matrixNeedsUpdate = true;
  if (onPress) {
    el.classList.add("interactable");
    el.setAttribute("is-remote-hover-target", "");
    el.setAttribute("tags", "singleActionButton: true");
    el.object3D.addEventListener("interact", onPress);
  }
  return {
    el,
    draw,
    remove: () => {
      el.remove();
      texture.dispose();
      material.dispose();
      geometry.dispose();
    }
  };
}

export class TvControls {
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
    this.status = this.add(0, -1.04, 2.5, 0.34, ["MAC SCREEN TV", "PAIR TV once, then START"]);
    ["PAIR TV", "START", "STOP", "RETRY"].forEach((name, i) => {
      this.add(-0.96 + i * 0.64, -1.34, 0.59, 0.2, [name], () =>
        name === "PAIR TV" ? this.showPairing() : this.command(name.toLowerCase())
      );
    });
    this.add(1.65, 0.6, 0.55, 0.19, ["RELOAD"], () => window.location.reload());
    this.poll = setInterval(() => this.refresh(), 3000);
    this.refresh();
  }
  add(...args) {
    const item = label(this.scene, this.anchor, this.rotation, ...args);
    this.labels.push(item);
    return item;
  }
  async request(action, body = {}, token = this.token) {
    const response = await fetch(`/lounge-tv/v1/${action}`, {
      method: action === "status" ? "GET" : "POST",
      headers: { Authorization: `Bearer ${token || ""}`, "Content-Type": "application/json" },
      body: action === "status" ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(7000)
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && action !== "pair") {
        this.token = null;
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* session-only storage */
        }
      }
      throw new Error(data.error || `TV request failed (${response.status})`);
    }
    return data;
  }
  show(state) {
    const video = state.video
      ? `${state.video.width} x ${state.video.height} / ${state.video.fps} fps`
      : "waiting for video";
    this.status.draw(
      [
        `${state.phase.toUpperCase()} | ${state.source} | AUDIO: ${state.audio}`,
        state.error || (state.phase === "idle" ? "START shares the Mac display and system audio" : video)
      ],
      state.phase === "failed"
    );
  }
  async refresh() {
    if (!this.token || this.busy) return;
    try {
      this.show(await this.request("status"));
    } catch (error) {
      this.status.draw(["TV NOT CONNECTED", error.message], true);
    }
  }
  async command(action) {
    if (!this.token) return this.showPairing();
    if (this.busy) return;
    this.busy = true;
    this.status.draw([action === "stop" ? "STOPPING VIDEO + AUDIO" : "CONNECTING TO MAC", "Waiting for confirmation"]);
    try {
      this.show(await this.request(action));
    } catch (error) {
      this.status.draw(["TV COMMAND FAILED", error.message], true);
    } finally {
      this.busy = false;
    }
  }
  showPairing() {
    if (this.keypad) return;
    this.code = "";
    this.keypad = [];
    const add = (...args) => {
      const item = label(this.scene, this.anchor, this.rotation, ...args);
      this.keypad.push(item);
      return item;
    };
    const heading = add(0, 0.55, 1.8, 0.35, ["Enter your TV PIN", "Or use a temporary pairing code"]);
    const close = () => {
      this.keypad?.forEach(item => item.remove());
      this.keypad = null;
    };
    [..."123456789", "BACK", "0", "OK"].forEach((key, i) => {
      add(((i % 3) - 1) * 0.38, 0.2 - Math.floor(i / 3) * 0.23, 0.34, 0.2, [key], async () => {
        if (key === "BACK") this.code = this.code.slice(0, -1);
        else if (key === "OK") {
          if (this.code.length < 4 || this.code.length > 8 || this.pairBusy) return;
          this.pairBusy = true;
          try {
            const result = await this.request("pair", { code: this.code }, "");
            this.token = result.token;
            try {
              localStorage.setItem(KEY, this.token);
            } catch {
              /* keep this session paired */
            }
            close();
            await this.refresh();
          } catch (error) {
            heading.draw(["PAIRING FAILED", error.message], true);
          } finally {
            this.pairBusy = false;
          }
          return;
        } else if (this.code.length < 8) this.code += key;
        heading.draw([
          this.code.length >= 4 ? "PRESS OK TO PAIR" : "ENTER TV PIN",
          "•".repeat(this.code.length) || "PIN"
        ]);
      });
    });
    add(0.85, -0.45, 0.45, 0.2, ["CANCEL"], close);
  }
  remove() {
    clearInterval(this.poll);
    this.labels.forEach(item => item.remove());
    this.keypad?.forEach(item => item.remove());
  }
}
