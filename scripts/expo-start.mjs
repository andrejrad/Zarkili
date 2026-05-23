#!/usr/bin/env node
/**
 * expo-start.mjs — wrapper around `expo start` that auto-picks a free port.
 *
 * Why: `expo start` defaults to 8081, and when that port is busy it prompts
 * "Use port 8082 instead?" — but our `start:dev` runs through `dotenv` which
 * makes Expo non-interactive, so the prompt fails with "Something went wrong".
 *
 * Behaviour: probe ports 8081..8181 sequentially, pick the first free one,
 * then exec `npx expo start --clear --port <free>`.
 *
 * Extra args passed to this script are forwarded to expo (e.g. `--web`,
 * `--tunnel`, `--no-dev`).
 */
import net from "node:net";
import { spawn } from "node:child_process";

const START_PORT = 8081;
const MAX_PORT = 8181;

function tryPort(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port, "0.0.0.0");
  });
}

async function findFreePort() {
  for (let p = START_PORT; p <= MAX_PORT; p++) {
    if (await tryPort(p)) return p;
  }
  throw new Error(`No free port in range ${START_PORT}-${MAX_PORT}`);
}

const port = await findFreePort();
if (port !== START_PORT) {
  console.log(
    `\u001b[33m[expo-start] Port ${START_PORT} busy → using ${port}\u001b[0m`,
  );
}

const forwarded = process.argv.slice(2);
const args = ["expo", "start", "--clear", "--port", String(port), ...forwarded];

const child = spawn("npx", args, { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code ?? 0));
