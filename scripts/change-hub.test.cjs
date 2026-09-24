const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("history restoration before hub metadata is safe; later room navigation still works", () => {
  let popstate;
  const changes = [];
  const app = {};
  const location = { search: "", pathname: "/room-a/the-lounge" };
  const source = fs
    .readFileSync(require.resolve("../src/change-hub.js"), "utf8")
    .replace(/^import .*;\n/gm, "")
    .replace("export async function", "async function");
  vm.runInNewContext(source + "\nchangeHub = (...args) => record(...args);", {
    APP: app,
    URLSearchParams,
    location,
    document: { location },
    window: {
      addEventListener: (_event, callback) => {
        popstate = callback;
      }
    },
    record: (...args) => changes.push(args)
  });
  assert.doesNotThrow(() => popstate());
  assert.equal(changes.length, 0);
  app.hub = { hub_id: "room-a" };
  popstate();
  assert.equal(changes.length, 0);
  location.pathname = "/room-b/the-lounge";
  popstate();
  assert.deepEqual(changes, [["room-b", false]]);
});
