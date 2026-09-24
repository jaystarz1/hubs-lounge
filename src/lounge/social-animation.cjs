// Authored procedural first set, not imported motion-capture clips. Positions
// are chest-local metres; fingers/palm define each wrist's orientation.
function sampleHandPose(name, side, phase) {
  const sign = side === "left" ? 1 : -1;
  const t = Math.max(0, phase);
  if (name === "wave") {
    if (side === "left") return null;
    return {
      position: [-0.28 + 0.035 * Math.sin(t * 7), 0.4, 0.22],
      fingers: [0.45 * Math.sin(t * 7), 1, 0],
      palm: [0, 0, 1]
    };
  }
  if (name === "clap") {
    const spread = 0.045 + (0.16 * (1 - Math.cos(t * 7))) / 2;
    return { position: [sign * spread, 0.12, 0.36], fingers: [0, 1, 0], palm: [-sign, 0, 0] };
  }
  if (name === "dance")
    return {
      position: [
        sign * (0.27 + 0.06 * Math.cos(t * 3)),
        0.08 + 0.18 * Math.sin(t * 3 + sign),
        0.22 + 0.05 * Math.cos(t * 3 + sign)
      ],
      fingers: [sign * 0.3, 0.7, 0.4],
      palm: [0, 0, 1]
    };
  if (name === "sit" || name === "sit_together")
    return {
      position: [sign * 0.19, -0.14, 0.3],
      fingers: [0, -0.15, 1],
      palm: [0, -1, 0]
    };
  return null;
}

function expressionWeights(name, phase) {
  const weights = {};
  const both = (base, amount) => {
    weights[base + "Left"] = amount;
    weights[base + "Right"] = amount;
  };
  if (name === "smile") {
    both("mouthSmile", 0.65);
    both("cheekSquint", 0.15);
  }
  if (name === "sad") {
    both("mouthFrown", 0.4);
    weights.browInnerUp = 0.55;
  }
  if (name === "surprise") {
    both("eyeWide", 0.5);
    both("browOuterUp", 0.5);
    weights.browInnerUp = 0.4;
  }
  if (name === "wink") weights.eyeBlinkLeft = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, phase) / 0.8)), 2);
  return weights;
}
module.exports = { sampleHandPose, expressionWeights };
