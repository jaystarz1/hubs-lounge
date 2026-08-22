const fs = require("fs");
const https = require("https");
const path = require("path");

const root = path.resolve(__dirname, "..", "dist");
const port = Number(process.env.PORT || 8080);
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
    (req, res) => {
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

      const filename = path.resolve(root, `.${pathname}`);
      if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
        res.writeHead(403).end("Forbidden");
        return;
      }

      fs.stat(filename, (statError, stat) => {
        if (statError || !stat.isFile()) {
          res.writeHead(404, { "Access-Control-Allow-Origin": "*" }).end("Not found");
          return;
        }
        const extension = path.extname(filename).toLowerCase();
        const immutable = pathname.startsWith("/assets/") && /-[a-f0-9]{8,}\./i.test(pathname);
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "public, max-age=300",
          "Content-Length": stat.size,
          "Content-Type": mimeTypes[extension] || "application/octet-stream",
          "X-Content-Type-Options": "nosniff"
        });
        if (req.method === "HEAD") res.end();
        else fs.createReadStream(filename).pipe(res);
      });
    }
  )
  .listen(port, "0.0.0.0", () => console.log(`Serving production client on https://0.0.0.0:${port}`));
