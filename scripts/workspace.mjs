import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readWorkspace, replaceWorkspace } from "../src/lib/workspace.ts";
import { validateWorkspace } from "../src/lib/model.ts";
const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const [command, file, confirmation] = process.argv.slice(2);
if (!file || !["export", "import"].includes(command)) { console.error("Usage: node scripts/workspace.mjs export backup.json | import backup.json --confirm-replace\nRun with the app stopped. Backups are private."); process.exit(1); }
if (command === "export") { writeFileSync(resolve(file), JSON.stringify(readWorkspace(), null, 2), { flag: "wx", mode: 0o600 }); console.log("Private backup saved. No existing file overwritten."); }
else {
  if (confirmation !== "--confirm-replace") { console.error("Import replaces this local workspace. Export it first, then add --confirm-replace."); process.exit(1); }
  const input = validateWorkspace(JSON.parse(readFileSync(resolve(file), "utf8")));
  const stamp = new Date().toISOString().replaceAll(":", "-");
  if (existsSync("data/workspace.sqlite")) {
    const backup = `data/recovery-${stamp}`; mkdirSync(backup, { recursive: true, mode: 0o700 });
    for (const name of ["workspace.sqlite", "workspace.sqlite-wal", "workspace.sqlite-shm"]) if (existsSync(`data/${name}`)) copyFileSync(`data/${name}`, `${backup}/${name}`);
    console.log("Previous database files retained in", backup);
  }
  replaceWorkspace(input); console.log("Workspace restored from validated backup. Start the app again.");
}
