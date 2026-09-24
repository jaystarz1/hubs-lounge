// Build into a fresh directory; publish one small pointer with an atomic rename.
// Old release assets remain available to already-open room tabs.
const fs = require("fs");
const path = require("path");

function releases(base) {
  try {
    const value = JSON.parse(fs.readFileSync(path.join(base, ".public-current.json"), "utf8"));
    if (!Array.isArray(value) || !value.every(x => /^\.public-releases\/[a-z0-9-]+$/.test(x))) {
      throw new Error("Invalid release pointer");
    }
    return [...value, "dist"];
  } catch (error) {
    if (error.code === "ENOENT") return ["dist"];
    throw error;
  }
}

function validate(root) {
  for (const page of ["index.html", "hub.html"]) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    if (!html.includes("<html")) throw new Error(`Invalid ${page}`);
    const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map(m => new URL(m[1], "https://build.invalid/").pathname)
      .filter(p => p.startsWith("/assets/"));
    if (!assets.length) throw new Error(`No assets in ${page}`);
    for (const asset of assets) {
      if (!fs.statSync(path.join(root, asset)).isFile()) throw new Error(`Missing ${asset}`);
    }
  }
}

function publish(base, relative) {
  if (!/^\.public-releases\/[a-z0-9-]+$/.test(relative)) throw new Error("Invalid release name");
  validate(path.join(base, relative));
  const history = releases(base).filter(x => x !== "dist" && x !== relative);
  const temporary = path.join(base, `.public-current-${process.pid}.tmp`);
  fs.writeFileSync(temporary, JSON.stringify([relative, ...history]));
  fs.renameSync(temporary, path.join(base, ".public-current.json"));
}

function resolveFile(base, pathname) {
  base = path.resolve(base);
  const roots = releases(base);
  // Only fingerprinted assets may fall back. Never serve stale HTML or config.
  const candidates = /^\/assets\/.*-[a-f0-9]{8,}\./i.test(pathname) ? roots : roots.slice(0, 1);
  for (const relative of candidates) {
    const root = path.join(base, relative);
    const filename = path.resolve(root, `.${pathname}`);
    if (!filename.startsWith(root + path.sep)) return null;
    try {
      const stat = fs.statSync(filename);
      if (stat.isFile()) return { filename, stat };
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
    }
  }
  return null;
}

module.exports = { releases, validate, publish, resolveFile };
