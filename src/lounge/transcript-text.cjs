// Shared transcript panel: the pure rules (merge, token cap, wrap, scroll), apart from the scene so
// they are testable. Entries are { t, w: "jay" | "guest" | "zoltar", x } from the daemon's
// /lounge-voice/v1/transcript, already scrubbed there.
const MAX_TOKENS = 10000;
const NAMES = { jay: "Jay", guest: "Guest", zoltar: "Zoltar" };
const COLORS = { jay: "#ffb347", guest: "#8fd3ff", zoltar: "#ffffff" };
const tokens = text => Math.ceil(String(text).length / 4) + 4;

// Add new lines to the old, drop repeats, keep the newest MAX_TOKENS worth.
function merge(old, incoming, maxTokens = MAX_TOKENS) {
  const seen = new Set(old.map(e => `${e.t}|${e.w}|${e.x}`));
  const all = [...old];
  for (const e of incoming || []) {
    if (!e || typeof e.x !== "string" || !NAMES[e.w] || typeof e.t !== "string") continue;
    const key = `${e.t}|${e.w}|${e.x}`;
    if (!seen.has(key)) {
      seen.add(key);
      all.push({ t: e.t, w: e.w, x: e.x });
    }
  }
  all.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
  let used = 0, start = all.length;
  while (start > 0 && used + tokens(all[start - 1].x) <= maxTokens) used += tokens(all[--start].x);
  return all.slice(start);
}

function wrap(text, maxWidth, measure) {
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

// Every line of the conversation as one flat list of rows, oldest first. A turn is a coloured
// name row, its wrapped text, then a gap row.
function rows(entries, maxWidth, measure) {
  const out = [];
  for (const e of entries) {
    out.push({ text: NAMES[e.w], color: COLORS[e.w], head: true });
    for (const line of wrap(e.x, maxWidth, measure)) out.push({ text: line, color: COLORS[e.w] === "#ffffff" ? "#ffffff" : "#e8e0d0" });
    out.push({ text: "", gap: true });
  }
  return out;
}

// offset = rows scrolled up from the newest (0 follows the newest line). Returns the rows to show.
function window_(allRows, visible, offset) {
  const max = Math.max(0, allRows.length - visible);
  const o = Math.min(Math.max(0, offset), max);
  const end = allRows.length - o;
  return { rows: allRows.slice(Math.max(0, end - visible), end), offset: o, max };
}

module.exports = { merge, rows, wrap, window: window_, tokens, MAX_TOKENS, NAMES, COLORS };
