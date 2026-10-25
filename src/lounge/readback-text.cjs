// Zoltar readback screen: the pure text rules, kept apart from the scene so they are testable.
// Greedy word wrap that shrinks the type until everything fits; the latest reply stays on screen
// HOLD_MS, then fades out over FADE_MS.
const HOLD_MS = 45000;
const FADE_MS = 4000;

function wrapWords(text, maxWidth, measure) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// measure(text, font) -> pixel width. Returns { font, lines } with the largest font in
// [minFont, maxFont] whose wrapped text fits maxHeight; at minFont the tail is cut with "...".
function fit(text, maxWidth, maxHeight, measure, maxFont = 120, minFont = 34, leading = 1.18) {
  for (let font = maxFont; font >= minFont; font -= 2) {
    const lines = wrapWords(text, maxWidth, t => measure(t, font));
    if (lines.length * font * leading <= maxHeight) return { font, lines };
  }
  const rows = Math.max(1, Math.floor(maxHeight / (minFont * leading)));
  const lines = wrapWords(text, maxWidth, t => measure(t, minFont));
  if (lines.length <= rows) return { font: minFont, lines };
  const kept = lines.slice(0, rows);
  kept[rows - 1] = `${kept[rows - 1]}...`;
  return { font: minFont, lines: kept };
}

// 1 while held, then a linear fade to 0.
function alpha(age, hold = HOLD_MS, fade = FADE_MS) {
  if (age <= hold) return 1;
  if (age >= hold + fade) return 0;
  return 1 - (age - hold) / fade;
}

// Stack the blocks top to bottom: a block with `max` is the "heard" line and takes a capped share
// of the room; the last block gets everything left. Returns blocks with { font, lines }.
function layout(blocks, width, height, pad, gap, measure) {
  let room = height - pad * 2;
  return blocks.map((block, i) => {
    const last = i === blocks.length - 1;
    const share = last ? room : Math.min(room * 0.3, room);
    const result = fit(block.text, width - pad * 2, share, (t, f) => measure(t, f), block.max || 120);
    room -= result.lines.length * result.font * 1.18 + (last ? 0 : gap);
    return { ...block, ...result };
  });
}

// The readback lives on the TV as a background display: only while something is faded in and
// the TV is not showing real content.
function visible(a, live) {
  return a > 0 && !live;
}

module.exports = { HOLD_MS, FADE_MS, wrapWords, fit, alpha, layout, visible };
