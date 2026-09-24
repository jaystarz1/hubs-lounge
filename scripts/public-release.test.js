const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publish, resolveFile, releases } = require("./public-release");

test("failed builds never change live root; published releases retain old assets", t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "lounge-release-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const make = (relative, hash) => {
    const root = path.join(base, relative);
    fs.mkdirSync(path.join(root, "assets"), { recursive: true });
    fs.writeFileSync(path.join(root, `assets/hub-${hash}.js`), relative);
    for (const page of ["index.html", "hub.html"])
      fs.writeFileSync(
        path.join(root, page),
        `<html><script src="https://lounge-app.test/assets/hub-${hash}.js"></script></html>`
      );
  };
  make("dist", "11111111");
  make(".public-releases/new", "22222222");
  assert.throws(() => publish(base, ".public-releases/broken"));
  assert.deepEqual(releases(base), ["dist"]);
  publish(base, ".public-releases/new");
  assert.match(resolveFile(base, "/hub.html").filename, /new\/hub.html$/);
  assert.match(resolveFile(base, "/assets/hub-11111111.js").filename, /dist\/assets/);
  assert.match(resolveFile(base, "/assets/hub-22222222.js").filename, /new\/assets/);
  assert.equal(resolveFile(base, "/../../secret"), null);
  assert.throws(() => publish(base, "../../bad"));
  fs.writeFileSync(path.join(base, "dist", "only-old.html"), "old");
  assert.equal(resolveFile(base, "/only-old.html"), null);
  fs.unlinkSync(path.join(base, ".public-releases/new/assets/hub-22222222.js"));
  assert.throws(() => publish(base, ".public-releases/new"));
});
