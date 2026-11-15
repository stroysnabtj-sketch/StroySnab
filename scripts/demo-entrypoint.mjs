import { spawn } from "node:child_process";
import { assertDemoEnvironment } from "./demo-guard.mjs";

assertDemoEnvironment();
const initialize = spawn(process.execPath, ["demo-init.cjs"], { stdio: "inherit" });
let server;
initialize.on("error", fail);
initialize.on("exit", (code, signal) => {
  if (code !== 0 || signal) {
    fail(new Error("Demo initialization failed; web server was not started"));
    return;
  }
  server = spawn(process.execPath, ["server.js"], { stdio: "inherit" });
  server.on("error", fail);
  server.on("exit", (status, stoppedBy) => {
    process.exitCode = stoppedBy ? 1 : (status ?? 1);
  });
});
function fail(error) {
  console.error(error.message);
  process.exitCode = 1;
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    initialize.kill(signal);
    server?.kill(signal);
  });
}
