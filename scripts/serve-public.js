const fs = require("fs");
const https = require("https");
const path = require("path");
const { resolveFile } = require("./public-release");
const { createAccessGate } = require("./lounge-access.cjs");
const dns = require("dns");
const http = require("http");
const zlib = require("zlib");

const publicHost = process.env.PUBLIC_HOST || "lounge.thechatbotgenius.com";
let reticulumAddress;
let dialogAddress;
dns.lookup("reticulum", (error, address) => { if (!error) reticulumAddress = address; });
dns.lookup("dialog", (error, address) => { if (!error) dialogAddress = address; });
const gate = createAccessGate({
  pin: process.env.LOUNGE_PIN,
  roomPath: process.env.LOUNGE_ROOM_PATH,
  publicHost,
  relayHost: req => {
    const peer = req.socket.remoteAddress.replace(/^::ffff:/, "");
    const host = req.headers["x-lounge-host"];
    if (peer === reticulumAddress && host === publicHost) return host;
    if (peer === dialogAddress && host === publicHost.replace("lounge.", "lounge-voice.")) return host;
    return null;
  },
  // Only the real Reticulum container can warm templates. Forwarded headers
  // and Host alone never establish internal authority.
  internalAllowed: req => !req.headers["x-lounge-host"] && req.headers.host === "hubs-client:8080" &&
    req.socket.remoteAddress.replace(/^::ffff:/, "") === reticulumAddress,
  verifyTv: token => new Promise(resolve => {
    const req = http.request({ hostname: "host.docker.internal", port: 9917,
      path: "/lounge-tv/v1/session", method: "POST", headers: { Authorization: `Bearer ${token}` } }, res => {
      res.resume(); resolve(res.statusCode === 204);
    });
    req.on("error", () => resolve(false)); req.end();
  })
});

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 8080);
const telemetryDir = path.join(root, "telemetry");

// Loading speed (Jay, 2026-10-20: "this loading has gone on far too long").
// Every visit pulled the 97 MB scene (and the rest) from this Mac through the
// home upload, uncompressed and never cached: about a minute each time.
// Release files whose names carry a content hash never change, so the
// headset may keep them (private: its own browser cache only, never
// Cloudflare's; still behind the PIN). Big binary files (the scene .glb) are
// also sent compressed, from a copy made once next to the file (bin/up-public,
// or in the background the first time it is asked for): brotli (97 MB ->
// ~32 MB) when asked, else gzip (~41 MB). (Cloudflare asks this origin for
// gzip only.)
const HASHED = /-[0-9a-f]{16,}\.+[a-z0-9]+$/i;
const COMPRESS = new Set([".glb", ".bin", ".gltf", ".wasm"]);
const compressing = new Set();
const CODECS = {
  br: { ext: ".br", make: (data, cb) => zlib.brotliCompress(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length } }, cb) },
  gzip: { ext: ".gz", make: (data, cb) => zlib.gzip(data, { level: 9 }, cb) }
};
function compressedFor(filename, stat, codec) {
  const br = `${filename}${CODECS[codec].ext}`;
  try {
    if (fs.statSync(br).mtimeMs >= stat.mtimeMs) return br;
  } catch {
    /* not made yet */
  }
  if (!compressing.has(br)) {
    compressing.add(br);
    fs.readFile(filename, (err, data) => {
      if (err) return compressing.delete(br);
      CODECS[codec].make(data, (e, out) => {
        if (!e) {
          fs.writeFile(`${br}.tmp`, out, w => {
            if (!w) fs.rename(`${br}.tmp`, br, () => console.log(`${codec} ready: ${path.basename(br)} ${data.length} -> ${out.length}`));
            compressing.delete(br);
          });
        } else compressing.delete(br);
      });
    });
  }
  return null;
}
const TELEMETRY_MAX_BODY = 512 * 1024;
const TELEMETRY_MAX_DAY = 300 * 1024 * 1024;
const rewrites = [
  [/^\/link(?:\/|$)/, "/link.html"],
  [/^\/avatars(?:\/|$)/, "/avatar.html"],
  [/^\/scenes(?:\/|$)/, "/scene.html"],
  [/^\/signin(?:\/|$)/, "/signin.html"],
  [/^\/discord(?:\/|$)/, "/discord.html"],
  [/^\/cloud(?:\/|$)/, "/cloud.html"],
  [/^\/verify(?:\/|$)/, "/verify.html"],
  [/^\/tokens(?:\/|$)/, "/tokens.html"],
  [/^\/whats-new(?:\/|$)/, "/whats-new.html"]
];
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".glb": "model/gltf-binary",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".toml": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

https
  .createServer(
    {
      cert: fs.readFileSync(path.resolve(__dirname, "..", "certs", "cert.pem")),
      key: fs.readFileSync(path.resolve(__dirname, "..", "certs", "key.pem"))
    },
    async (req, res) => {
      try {
        if (await gate(req, res)) return;
      } catch {
        res.writeHead(503, { "Cache-Control": "no-store" }).end("Access unavailable");
        return;
      }
      if (req.url === "/_lounge/runtime.js" && ["GET", "HEAD"].includes(req.method)) {
        res.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "private, no-store" });
        res.end(req.method === "HEAD" ? "" : fs.readFileSync(path.join(__dirname, "lounge-access-runtime.js")));
        return;
      }
      // Field telemetry from signed-in clients (src/lounge/telemetry.js): one
      // JSON line per batch, a file per day, read back with bin/telemetry.
      if (req.url === "/_lounge/telemetry" && req.method === "POST") {
        const cors = req.headers.origin === `https://${publicHost}` ? {
          "Access-Control-Allow-Origin": req.headers.origin,
          "Access-Control-Allow-Credentials": "true"
        } : {};
        let body = "";
        try {
          for await (const chunk of req) {
            body += chunk;
            if (body.length > TELEMETRY_MAX_BODY) throw Error("large body");
          }
          const batch = JSON.parse(body);
          if (!Array.isArray(batch.recs)) throw Error("no records");
          fs.mkdirSync(telemetryDir, { recursive: true });
          const file = path.join(telemetryDir, `${new Date().toISOString().slice(0, 10)}.jsonl`);
          const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
          if (size < TELEMETRY_MAX_DAY) {
            const line = { at: Date.now(), ip: req.headers["cf-connecting-ip"] || req.socket.remoteAddress, ...batch };
            fs.appendFileSync(file, JSON.stringify(line) + "\n");
          }
          res.writeHead(204, { ...cors, "Cache-Control": "no-store" }).end();
        } catch {
          res.writeHead(400, { ...cors, "Cache-Control": "no-store" }).end();
        }
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { Allow: "GET, HEAD" }).end();
        return;
      }
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      } catch {
        res.writeHead(400).end("Bad request");
        return;
      }

      const rewrite = rewrites.find(([pattern]) => pattern.test(pathname));
      if (rewrite) pathname = rewrite[1];
      if (pathname === "/") pathname = "/index.html";

      try {
        const file = resolveFile(root, pathname);
        if (!file) {
          res.writeHead(404, { "Access-Control-Allow-Origin": "*" }).end("Not found");
          return;
        }
        const { filename, stat } = file;
        const extension = path.extname(filename).toLowerCase();
        let html;
        if ([".html", ".js", ".css"].includes(extension)) {
          // Worker/importScripts and immutable webpack chunks need same-origin
          // authenticated URLs. Transform responses only, never release files.
          html = fs.readFileSync(filename, "utf8").split(`https://${publicHost.replace("lounge.", "lounge-app.")}/`).join(`https://${publicHost}/_lounge/assets/`);
          if (extension === ".html") html = html.replace("<head>",
            `<head><script src="https://${publicHost.replace("lounge.", "lounge-app.")}/_lounge/runtime.js"></script>`);
        }
        const cors = req.headers.origin === `https://${publicHost}` ? {
          "Access-Control-Allow-Origin": req.headers.origin,
          "Access-Control-Allow-Credentials": "true"
        } : {};
        const hashed = HASHED.test(path.basename(filename));
        const accepts = req.headers["accept-encoding"] || "";
        const codec =
          html === undefined && COMPRESS.has(extension) ? (/\bbr\b/.test(accepts) ? "br" : /\bgzip\b/.test(accepts) ? "gzip" : null) : null;
        const br = codec ? compressedFor(filename, stat, codec) : null;
        const sendFile = br || filename;
        res.writeHead(200, {
          ...cors,
          Vary: "Origin, Cookie, Accept-Encoding",
          "Cache-Control": hashed ? "private, max-age=31536000, immutable" : "private, no-store",
          ...(br ? { "Content-Encoding": codec } : {}),
          "Content-Length": html !== undefined ? Buffer.byteLength(html) : br ? fs.statSync(br).size : stat.size,
          "Content-Type": mimeTypes[extension] || "application/octet-stream",
          "X-Content-Type-Options": "nosniff"
        });
        if (req.method === "HEAD") res.end();
        else if (html !== undefined) res.end(html);
        else
          fs.createReadStream(sendFile)
            .on("error", () => res.destroy())
            .pipe(res);
      } catch (error) {
        console.error("Public release unavailable:", error.message);
        res.writeHead(503, { "Cache-Control": "no-store" }).end("Client release unavailable");
      }
    }
  )
  .listen(port, "0.0.0.0", () => console.log(`Serving production client on https://0.0.0.0:${port}`));
