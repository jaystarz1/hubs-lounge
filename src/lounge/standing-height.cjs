// Physical seated play should still present a standing avatar. A fixed
// per-session lift moves head and hands together without flattening crouches.
class StandingHeight {
  constructor() {
    this.reset();
  }
  reset() {
    this.started = null;
    this.offset = null;
  }
  sample(time, height, inVR, seated) {
    if (!inVR) {
      this.reset();
      return 0;
    }
    if (seated) return this.offset || 0;
    if (this.offset !== null) return this.offset;
    if (!Number.isFinite(height) || height < 0.4 || height > 2.5) return 0;
    if (this.started === null) this.started = time;
    // Wait for XR to replace the desktop camera's initial 1.6 m transform.
    if (time - this.started < 750) return 0;
    this.offset = Math.max(0, 1.6 - height);
    return this.offset;
  }
}
module.exports = { StandingHeight };
