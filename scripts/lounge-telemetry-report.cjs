// Reads the headsets' field telemetry (src/lounge/telemetry.js, written by
// serve-public.js to telemetry/<day>.jsonl) and prints, per client session,
// how it ran and every glitch with what was going on at that moment.
//   node scripts/lounge-telemetry-report.cjs [day YYYY-MM-DD | file] [--hours N] [--all]
// --hours limits to the last N hours; --all also prints each session's
// samples as a table (one row per 5 s).
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const flag = name => {
  const i = args.indexOf(name);
  return i < 0 ? null : args.splice(i, 2)[1] ?? "";
};
const hours = Number(flag("--hours")) || 0;
const all = args.includes("--all") ? (args.splice(args.indexOf("--all"), 1), true) : false;
const dir = path.resolve(__dirname, "..", "telemetry");
let files;
if (args[0] && fs.existsSync(args[0])) files = [args[0]];
else if (args[0]) files = [path.join(dir, `${args[0]}.jsonl`)];
else {
  // today and yesterday (UTC), so an evening session is in one report
  const day = d => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
  files = [day(1), day(0)].map(d => path.join(dir, `${d}.jsonl`));
}
files = files.filter(f => fs.existsSync(f));
if (!files.length) {
  console.log(`No telemetry yet in ${dir}`);
  process.exit(0);
}
const since = hours ? Date.now() - hours * 3600000 : 0;

const sessions = new Map();
for (const f of files) {
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    if (!line) continue;
    let b;
    try {
      b = JSON.parse(line);
    } catch {
      continue;
    }
    const s = sessions.get(b.session) || { name: "", client: "", samples: [], events: [] };
    if (b.name) s.name = b.name;
    if (b.client) s.client = b.client;
    for (const r of b.recs || []) {
      if (r.t < since) continue;
      if (r.e) s.events.push(r);
      else s.samples.push(r);
    }
    sessions.set(b.session, s);
  }
}

const clock = t => new Date(t).toLocaleTimeString("en-CA", { hour12: false, timeZone: "America/Toronto" });
const pct = (xs, p) => {
  if (!xs.length) return "-";
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const guns = r => {
  const m = (r?.mine || []).join("+");
  const o = (r?.theirs || []).join("+");
  return m || o ? `me:${m || "-"} them:${o || "-"}` : "no guns";
};
const near = (s, t) => {
  let best = null;
  for (const r of s.samples) if (r.t <= t + 1000 && (!best || Math.abs(r.t - t) < Math.abs(best.t - t))) best = r;
  return best;
};
const ctx = r =>
  r
    ? `${guns(r)} fps ${r.fps} worst ${r.worst}ms shots ${r.shots || 0}/${r.shotsIn || 0}in snd ${r.snd || 0} cut ${
        r.cut || 0
      } voices ${r.voices ?? "-"} range ${r.skMax ?? "-"}ms calls ${r.calls ?? "-"} audio ${r.audio}@${r.aRate ?? "-"}`
    : "";

for (const [id, s] of [...sessions].sort((a, b) => (a[1].samples[0]?.t || 0) - (b[1].samples[0]?.t || 0))) {
  if (!s.samples.length && !s.events.length) continue;
  const S = s.samples;
  const t0 = S[0]?.t || s.events[0].t;
  const t1 = S[S.length - 1]?.t || t0;
  const vr = S.filter(r => r.vr && !r.hidden);
  const fps = vr.map(r => r.fps);
  const start = s.events.find(e => e.e === "start");
  const quest = /OculusBrowser|Quest/.test(start?.ua || "") ? " (Quest)" : "";
  console.log(`\n== ${s.name || "?"}${quest}  session ${id}  ${clock(t0)} - ${clock(t1)}  (${S.length} s sampled, ${vr.length} s in VR)`);
  if (fps.length) {
    console.log(
      `   VR fps median ${pct(fps, 0.5)}, worst 5% ${pct(fps, 0.05)}; worst frame ${Math.max(...vr.map(r => r.worst))} ms; heap max ${Math.max(
        ...S.map(r => r.heap || 0)
      )} MB; draw calls median ${pct(
        vr.map(r => r.calls || 0),
        0.5
      )}`
    );
    // Gun up vs not: does full auto cost frames?
    const by = {};
    for (const r of vr) {
      const k = r.mine?.includes("rifle") || r.theirs?.includes("rifle") ? "carbine up" : r.mine || r.theirs ? "other guns" : "no guns";
      (by[k] = by[k] || []).push(r);
    }
    for (const [k, rs] of Object.entries(by))
      console.log(
        `   ${k.padEnd(10)} ${String(rs.length).padStart(5)} s  fps median ${pct(
          rs.map(r => r.fps),
          0.5
        )} worst 5% ${pct(
          rs.map(r => r.fps),
          0.05
        )}  range tick max ${Math.max(...rs.map(r => r.skMax || 0))} ms  sounds/s max ${Math.max(...rs.map(r => r.snd || 0))}  cut ${rs.reduce(
          (a, r) => a + (r.cut || 0),
          0
        )}`
      );
  }
  const glitches = s.events.filter(e => !["start", "guns"].includes(e.e));
  const gunEvents = s.events.filter(e => e.e === "guns");
  if (gunEvents.length) console.log(`   gun changes: ${gunEvents.length}`);
  if (!glitches.length) console.log("   no glitches logged");
  for (const e of glitches) {
    const { e: k, t, ...rest } = e;
    const detail = Object.entries(rest)
      .map(([a, b]) => `${a}=${typeof b === "string" ? b.slice(0, 160) : JSON.stringify(b)}`)
      .join(" ");
    console.log(`   ${clock(t)} ${k.padEnd(12)} ${detail}`);
    if (["hitch", "audio-stall", "sock", "send", "recv", "audio-state"].includes(k)) console.log(`            ${ctx(near(s, t))}`);
  }
  if (all) {
    console.log("   time      fps worst slow lt   calls heap audio  aRate sock  send/recv  range  out/in shots snd cut voices guns");
    S.forEach((r, i) => {
      if (i % 5) return;
      console.log(
        `   ${clock(r.t)} ${String(r.fps).padStart(4)} ${String(r.worst).padStart(5)} ${String(r.slow).padStart(4)} ${String(r.lt).padStart(
          2
        )} ${String(r.calls ?? "").padStart(7)} ${String(r.heap ?? "").padStart(4)} ${String(r.audio ?? "").padEnd(6)} ${String(
          r.aRate ?? ""
        ).padStart(5)} ${String(r.sock ?? "").padEnd(5)} ${String(r.send ?? "").slice(0, 4)}/${String(r.recv ?? "").slice(0, 4)}  ${String(
          r.skMax ?? ""
        ).padStart(5)} ${String(r.out ?? "")}/${String(r.in ?? "")} ${String(r.shots ?? "")}/${String(r.shotsIn ?? "")} ${String(
          r.snd ?? ""
        )} ${String(r.cut ?? "")} ${String(r.voices ?? "")} ${guns(r)}`
      );
    });
  }
}
