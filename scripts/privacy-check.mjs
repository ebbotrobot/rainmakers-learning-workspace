import { readFileSync, lstatSync } from "node:fs";
import { fileURLToPath } from "node:url";
process.chdir(fileURLToPath(new URL("../", import.meta.url)));
const files = JSON.parse(readFileSync("distribution-files.json", "utf8"));
const issues = [];
const blockedPath = /(^|\/)(\.git|\.env[^/]*|node_modules|data|\.next|\.agent|review-evidence)(\/|$)|\.(sqlite|db|log|zip)$/i;
const rules = [
  ["absolute personal home path", /\/(?:Users|home)\/[a-zA-Z0-9_.-]+\//],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["credential-like token", /(?:gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{35,}|AKIA[A-Z0-9]{16})/],
  ["embedded cookie or bearer credential", /(?:Authorization["']?\s*:\s*["']Bearer\s+[^"']{12,}|session[_-]?cookie\s*=\s*["'][^"']{12,})/i],
];
for (const file of files) {
  if (typeof file !== "string" || file.startsWith("/") || file.includes("..") || blockedPath.test(file)) { issues.push(`Forbidden path: ${file}`); continue; }
  if (!lstatSync(file).isFile()) { issues.push(`Not a regular file: ${file}`); continue; }
  const source = readFileSync(file, "utf8");
  for (const [label, pattern] of rules) if (pattern.test(source)) issues.push(`${file}: ${label}`);
}
if (issues.length) { console.error(issues.join("\n")); process.exit(1); }
console.log(`Passed ${files.length} distribution files. No runtime data, dependencies or history included. Manual content review still required.`);
