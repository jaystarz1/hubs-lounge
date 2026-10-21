AFRAME.registerComponent("leave-room-button", {
  init() {
    this.onClick = () => {
      if (this.el.sceneEl.is("lounge-nofreeze")) return; // (see freeze-controller)
      this.el.sceneEl.emit("leave_room_requested");
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
