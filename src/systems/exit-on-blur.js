/**
 * Legacy Hubs used a requestAnimationFrame timeout to infer that an Oculus Go
 * had entered standby, then dispatched a full scene exit. Modern Quest
 * headsets routinely pause the page during focus changes and brief standby, so
 * that heuristic disconnects healthy participants and makes them appear to be
 * kicked from the room.
 *
 * Keep the system registered for compatibility, but let WebXR, Phoenix and
 * Dialog handle their own suspend and reconnect lifecycles. A deliberate exit
 * still goes through the normal UI and entry-manager paths.
 *
 * @system exit-on-blur
 */
AFRAME.registerSystem("exit-on-blur", {});
