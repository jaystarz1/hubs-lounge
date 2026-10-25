// Zoltar's jaw flap: a plain mechanical clapper, not tied to the words or the audio level.
// While a voice clip is playing the jaw swings open and shut on a fixed beat; when it
// stops the jaw is shut. Kept apart from the scene so it is testable.
const PERIOD = 0.5; // seconds per open-shut cycle: slow and smooth, 2 flaps a second (sine easing below)
// Hinge angle at full open. The hinge sits ~9 cm behind the lip line (build-zoltar.py), so
// 0.143 rad drops the lower lip ~1.3 cm (half an inch). The node is at world scale 1.
const MAX_ANGLE = 0.143;

// 0 (shut) .. 1 (open) at `seconds` since the clip started playing. Deterministic.
function flap(seconds) {
  if (!(seconds >= 0)) return 0;
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * seconds) / PERIOD);
}

// Jaw openness 0..1 from the play state. `startedAt` is null when nothing is playing.
function jawOpen(startedAt, now) {
  return startedAt == null ? 0 : flap(now - startedAt);
}

module.exports = { PERIOD, MAX_ANGLE, flap, jawOpen };
