const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { randomBytes } = require("crypto");
const { publish } = require("./public-release");

const base = path.resolve(__dirname, "..");
const lock = path.join(base, ".public-build.lock");
let locked = false;
try {
  fs.mkdirSync(lock); // Refuse concurrent builds, including another agent's.
  locked = true;
  const release = `.public-releases/${Date.now()}-${randomBytes(4).toString("hex")}`;
  const output = path.join(base, release);
  fs.mkdirSync(output, { recursive: true });
  const result = spawnSync(process.execPath, [require.resolve("webpack-cli/bin/cli.js"), "--mode=production"], {
    cwd: base,
    env: { ...process.env, PUBLIC_BUILD_DIR: output },
    stdio: "inherit"
  });
  if (result.error || result.status !== 0)
    throw result.error || new Error("Client build failed; live release unchanged");
  publish(base, release);
  console.log(`Published ${release}. Previous hashed assets retained for open tabs.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (locked) fs.rmdirSync(lock);
}
