import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 18)) { console.error("Use Node.js 22.18 or newer, then run setup again."); process.exit(1); }
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
mkdirSync(".agent", { recursive: true });
for (const name of ["PROJECT", "RUNS", "HANDOFF", "DECISIONS", "ARTIFACTS"]) {
  if (!existsSync(`.agent/${name}.md`)) copyFileSync(`agent-templates/${name}.md`, `.agent/${name}.md`);
}
if (!existsSync("node_modules/next/package.json") || !existsSync("node_modules/better-sqlite3/package.json")) {
  console.log("Installing the locked app dependencies. This may take a few minutes.");
  const installed = spawnSync(npm, ["ci"], { stdio: "inherit", shell: process.platform === "win32" });
  if (installed.status !== 0) process.exit(installed.status || 1);
}
console.log("Starting your private Rainmakers workspace at http://127.0.0.1:4188\nOpen Project & setup to add your project. Stop with Ctrl+C.");
const server = spawnSync(npm, ["run", "dev"], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(server.status || 0);
