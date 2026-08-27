import { spawn } from "node:child_process";

const services = ["intake-triage", "dispatch", "geospatial", "notification"];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = services.map((service) =>
  spawn(npmCommand, ["run", "dev", `--workspace=${service}`], {
    stdio: "inherit",
    shell: process.platform === "win32",
  }),
);

let shuttingDown = false;

function stopChildren(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on("error", () => stopChildren(1));
  child.on("exit", (code) => {
    if (!shuttingDown && code && code !== 130) stopChildren(code);
  });
}

process.on("SIGINT", () => stopChildren());
process.on("SIGTERM", () => stopChildren());
