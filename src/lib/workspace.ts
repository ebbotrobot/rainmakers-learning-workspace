import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createWorkspace, validateWorkspace } from "./model.ts";
import type { Workspace } from "./types.ts";

let connection: Database.Database | undefined;
function db() {
  if (connection) return connection;
  const directory = path.resolve(process.cwd(), "data");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  connection = new Database(path.join(directory, "workspace.sqlite"));
  connection.pragma("journal_mode = WAL");
  connection.exec("CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL)");
  connection.prepare("INSERT OR IGNORE INTO workspace (id,value) VALUES (1,?)").run(JSON.stringify(createWorkspace()));
  return connection;
}
export function readWorkspace(): Workspace {
  const row = db().prepare("SELECT value FROM workspace WHERE id=1").get() as { value: string };
  return validateWorkspace(JSON.parse(row.value));
}
export function updateWorkspace(change: (workspace: Workspace) => Workspace): void {
  db().transaction(() => {
    const updated = validateWorkspace(change(readWorkspace()));
    db().prepare("UPDATE workspace SET value=? WHERE id=1").run(JSON.stringify(updated));
  })();
}
export function replaceWorkspace(workspace: Workspace): void {
  const validated = validateWorkspace(workspace);
  db().prepare("UPDATE workspace SET value=? WHERE id=1").run(JSON.stringify(validated));
}
