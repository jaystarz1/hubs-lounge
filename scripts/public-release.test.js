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

test("publish keeps only the newest 3 releases and deletes the ones that fall off", t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "lounge-release-prune-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const make = (relative, hash) => {
    const root = path.join(base, relative);
    fs.mkdirSync(path.join(root, "assets"), { recursive: true });
    fs.writeFileSync(path.join(root, `assets/hub-${hash}.js`), relative);
    for (const page of ["index.html", "hub.html"])
      fs.writeFileSync(path.join(root, page), `<html><script src="/assets/hub-${hash}.js"></script></html>`);
  };
  make(".public-releases/building", "99999999");
  for (const [i, name] of ["r1", "r2", "r3", "r4", "r5"].entries()) {
    make(`.public-releases/${name}`, `${i + 1}`.repeat(8));
    publish(base, `.public-releases/${name}`);
  }
  assert.deepEqual(releases(base), [".public-releases/r5", ".public-releases/r4", ".public-releases/r3", "dist"]);
  assert.equal(fs.existsSync(path.join(base, ".public-releases/r1")), false);
  assert.equal(fs.existsSync(path.join(base, ".public-releases/r2")), false);
  assert.equal(fs.existsSync(path.join(base, ".public-releases/r3")), true);
  assert.equal(fs.existsSync(path.join(base, ".public-releases/building")), true);
});
