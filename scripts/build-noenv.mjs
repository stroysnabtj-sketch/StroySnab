import { spawnSync } from "node:child_process";

process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.SKIP_ENV_VALIDATION = "1";

const isWindows = process.platform === "win32";
const nextCmd = isWindows ? "npx.cmd" : "npx";

const result = spawnSync(nextCmd, ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? (result.error ? 1 : 0));

