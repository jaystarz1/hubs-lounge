import { paths } from "../paths";
import { Pose } from "../pose";

const ONES = new THREE.Vector3(1, 1, 1);
// Note these offests are specifically for the oculus touch controllers on a Quest.
// We'll have to account for other headsets and controllers as we expand WebXR support.
const LEFT_HAND_OFFSET = new THREE.Matrix4().makeTranslation(-0.025, -0.03, 0.12);
const RIGHT_HAND_OFFSET = new THREE.Matrix4().makeTranslation(0.025, -0.03, 0.12);
const m = new THREE.Matrix4();

export class WebXRControllerDevice {
  constructor(gamepad) {
    this.gamepad = gamepad;

    this.selector = `#player-${gamepad.hand}-controller`;
    this.rayObject = null;
    this.rayObjectRotation = new THREE.Quaternion();
    this.pose = new Pose();

    this.matrix = new THREE.Matrix4();
    this.position = new THREE.Vector3();
    this.orientation = new THREE.Quaternion();
  }
  write(frame, xrFrame, referenceSpace) {
    if (!referenceSpace || !xrFrame || !this.gamepad) return;

    const hand = this.gamepad.hand || "right";
    const path = paths.device.webxr[hand];
    const pose = xrFrame.getPose(this.gamepad.targetRaySpace, referenceSpace);
    const isTracked = !!(pose && pose.transform.position && pose.transform.orientation);

    // When tracking drops mid-press the browser keeps serving the last
    // sample, which latches pressed buttons (a latched trigger leaves the
    // teleport arc and its alert loop stuck on until the user rejoins).
    // Publish a released state instead so every falling edge still fires.
    const buttonPaths = [
      path.button.trigger,
      path.button.grip,
      path.button.touchpad,
      path.button.thumbStick,
      path.button.a,
      path.button.b
    ];
    for (let i = 0; i < buttonPaths.length; i++) {
      const button = this.gamepad.buttons[i];
      if (!button) continue;
      frame.setValueType(buttonPaths[i].pressed, isTracked && button.pressed);
      frame.setValueType(buttonPaths[i].touched, isTracked && button.touched);
      frame.setValueType(buttonPaths[i].value, isTracked ? button.value : 0);
    }

    if (isTracked && this.gamepad.axes.length >= 4) {
      frame.setValueType(path.axis.touchpadX, this.gamepad.axes[0]);
      frame.setValueType(path.axis.touchpadY, this.gamepad.axes[1]);
      frame.setValueType(path.axis.joyX, this.gamepad.axes[2]);
      frame.setValueType(path.axis.joyY, this.gamepad.axes[3]);
    } else {
      // WebXR can leave the last gamepad sample in place when a controller
      // temporarily loses tracking. Always publish a neutral sample so motion
      // and turning cannot remain latched until the page is refreshed.
      frame.setValueType(path.axis.touchpadX, 0);
      frame.setValueType(path.axis.touchpadY, 0);
      frame.setValueType(path.axis.joyX, 0);
      frame.setValueType(path.axis.joyY, 0);
    }
    this.rayObject = this.rayObject || document.querySelector(this.selector).object3D;
    this.rayObject.updateMatrixWorld();
    this.rayObjectRotation.setFromRotationMatrix(m.extractRotation(this.rayObject.matrixWorld));

    this.pose.position.setFromMatrixPosition(this.rayObject.matrixWorld);
    this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
    this.pose.orientation.copy(this.rayObjectRotation);

    frame.setPose(path.pose, this.pose);

    if (isTracked) {
      this.position.copy(pose.transform.position);
      this.orientation.copy(pose.transform.orientation);
      this.matrix.compose(this.position, this.orientation, ONES);
      this.matrix.multiply(hand === "left" ? LEFT_HAND_OFFSET : RIGHT_HAND_OFFSET);
      frame.setMatrix4(path.matrix, this.matrix);
    }
  }
}
