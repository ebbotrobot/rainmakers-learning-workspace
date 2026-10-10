import { createHash, randomUUID } from "node:crypto";
import type { Workspace, Lesson, Task, Result, ReviewItem, Settings } from "./types.ts";

export function createWorkspace(): Workspace {
  const names = ["The Shift", "The Levers", "The Operation", "Tools + Repositories"];
  return {
    schemaVersion: 1,
    settings: { memberName: "", projectName: "Your project", siteUrl: "", goal: "", codexThreadId: "", communityUrl: "https://www.skool.com/ai-seo-rainmakers" },
    lessons: names.map((title, order) => ({
      id: `lesson-${order + 1}`, slug: title.toLowerCase().replace(/ \+ /g, "-and-").replace(/ /g, "-"),
      title, course: order < 3 ? "Foundations" : "Resources", order: order + 1,
      summary: "Add your own notes after watching the lesson.", sourceUrl: "", notes: "", claims: "", inference: "",
      actionBrief: "", desiredOutcome: "", learningStatus: "todo",
    })), tasks: [], results: [], reviews: [],
  };
}

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function object(value: unknown, label: string): Record<string, unknown> {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be an object.`);
  return value as Record<string, unknown>;
}
function strings(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) assert(typeof record[key] === "string" && (record[key] as string).length <= 60000, `Invalid ${key}.`);
}
function exactKeys(record: Record<string, unknown>, keys: string[]) {
  assert(Object.keys(record).every(key => keys.includes(key)) && keys.every(key => key in record), "Unexpected or missing workspace fields.");
}
export function safeUrl(value: string): string {
  if (!value) return "";
  try { const url = new URL(value); assert(["http:", "https:"].includes(url.protocol) && !url.username && !url.password, "Only HTTP(S) links without credentials are allowed."); return value; }
  catch { throw new Error("Use a full HTTP(S) URL without credentials."); }
}
const lessonKeys = ["id", "slug", "title", "course", "order", "summary", "sourceUrl", "notes", "claims", "inference", "actionBrief", "desiredOutcome", "learningStatus"];
const taskKeys = ["id", "lessonId", "title", "instructions", "owner", "status"];
const resultKeys = ["id", "lessonId", "taskId", "taskHash", "title", "summary", "decision", "evidence", "nextAction", "kind", "createdAt"];
const reviewKeys = ["id", "lessonId", "title", "proposal", "evidence", "rollback", "status", "acceptedHash", "acceptedAt"];
export function reviewHash(item: ReviewItem): string {
  return createHash("sha256").update(JSON.stringify({ id: item.id, lessonId: item.lessonId, title: item.title, proposal: item.proposal, evidence: item.evidence, rollback: item.rollback })).digest("hex");
}
export function taskHash(task: Task): string {
  return createHash("sha256").update(JSON.stringify({ id: task.id, lessonId: task.lessonId, title: task.title, instructions: task.instructions })).digest("hex");
}
export function hasCurrentEvidence(workspace: Workspace, task: Task): boolean {
  return workspace.results.some(result => result.taskId === task.id && result.taskHash === taskHash(task) && Boolean(result.evidence.trim()));
}
export function validateWorkspace(input: unknown): Workspace {
  assert(Buffer.byteLength(JSON.stringify(input) || "", "utf8") <= 1_000_000, "Workspace exceeds the 1 MB local record limit. Keep large evidence files outside the app and save their paths here.");
  const data = object(input, "Workspace");
  exactKeys(data, ["schemaVersion", "settings", "lessons", "tasks", "results", "reviews"]);
  assert(data.schemaVersion === 1, "Unsupported workspace version.");
  const settings = object(data.settings, "Settings");
  const settingKeys = ["memberName", "projectName", "siteUrl", "goal", "codexThreadId", "communityUrl"];
  exactKeys(settings, settingKeys); strings(settings, settingKeys);
  safeUrl(settings.siteUrl as string); safeUrl(settings.communityUrl as string);
  assert(!settings.codexThreadId || /^[a-zA-Z0-9-]{10,80}$/.test(settings.codexThreadId as string), "Invalid Codex chat ID.");
  for (const name of ["lessons", "tasks", "results", "reviews"]) {
    assert(Array.isArray(data[name]) && (data[name] as unknown[]).length <= 5000, `Invalid ${name} collection.`);
    const ids = new Set<string>();
    for (const row of data[name] as unknown[]) {
      const record = object(row, name); assert(typeof record.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(record.id), "Invalid record ID.");
      assert(!ids.has(record.id), "Duplicate record ID."); ids.add(record.id);
    }
  }
  const workspace = data as unknown as Workspace;
  const lessonIds = new Set(workspace.lessons.map(row => row.id));
  const slugs = new Set<string>();
  const reserved = ["new", "settings", "content-review", "execution-sync"];
  for (const lesson of workspace.lessons) {
    exactKeys(lesson as unknown as Record<string, unknown>, lessonKeys);
    strings(lesson as unknown as Record<string, unknown>, lessonKeys.filter(key => key !== "order"));
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lesson.slug) && !reserved.includes(lesson.slug) && !slugs.has(lesson.slug), "Lesson slug must be unique and use lowercase words separated by hyphens."); slugs.add(lesson.slug);
    assert(Number.isInteger(lesson.order) && lesson.order >= 0, "Invalid lesson order.");
    assert(lesson.title.trim() && ["todo", "doing", "done"].includes(lesson.learningStatus), "Invalid lesson title or status.");
    safeUrl(lesson.sourceUrl);
  }
  for (const task of workspace.tasks) {
    exactKeys(task as unknown as Record<string, unknown>, taskKeys); strings(task as unknown as Record<string, unknown>, taskKeys);
    assert(lessonIds.has(task.lessonId) && task.title.trim() && ["todo", "doing", "review", "done"].includes(task.status), "Invalid task.");
    if (task.status === "done") assert(hasCurrentEvidence(workspace, task), "Save evidence for this exact task brief before marking work complete.");
  }
  for (const result of workspace.results) {
    exactKeys(result as unknown as Record<string, unknown>, resultKeys); strings(result as unknown as Record<string, unknown>, resultKeys);
    assert(lessonIds.has(result.lessonId) && (!result.taskId || workspace.tasks.some(task => task.id === result.taskId && task.lessonId === result.lessonId)), "Result does not match its lesson/task.");
    assert(result.taskId ? /^[a-f0-9]{64}$/.test(result.taskHash) : result.taskHash === "", "Invalid task evidence fingerprint.");
    assert(result.title.trim() && result.summary.trim() && result.evidence.trim() && Number.isFinite(Date.parse(result.createdAt)) && ["preparation", "measurement", "implementation"].includes(result.kind), "A result needs a title, summary, evidence, valid date and kind.");
  }
  for (const item of workspace.reviews) {
    exactKeys(item as unknown as Record<string, unknown>, reviewKeys); strings(item as unknown as Record<string, unknown>, reviewKeys);
    assert(lessonIds.has(item.lessonId) && item.title.trim() && ["draft", "review", "accepted"].includes(item.status), "Invalid review item.");
    if (item.status === "accepted") assert(item.proposal.trim() && item.evidence.trim() && item.rollback.trim() && item.acceptedHash === reviewHash(item) && Number.isFinite(Date.parse(item.acceptedAt)), "Accepted review has changed or lacks evidence/rollback.");
    else assert(item.acceptedHash === "" && item.acceptedAt === "", "Unaccepted review cannot retain an approval.");
  }
  return workspace;
}
export function upsertLesson(data: Workspace, lesson: Lesson) {
  const index = data.lessons.findIndex(row => row.id === lesson.id);
  if (index < 0) data.lessons.push(lesson); else data.lessons[index] = lesson;
  return validateWorkspace(data);
}
export function upsertTask(data: Workspace, task: Task) {
  const index = data.tasks.findIndex(row => row.id === task.id);
  const previous = data.tasks[index];
  if (previous && previous.lessonId !== task.lessonId) throw new Error("Tasks cannot move between lessons; create a new task.");
  if (previous && (previous.title !== task.title || previous.instructions !== task.instructions) && task.status === "done") task.status = "review";
  if (index < 0) data.tasks.push(task); else data.tasks[index] = task;
  return validateWorkspace(data);
}
export function upsertReview(data: Workspace, item: ReviewItem) {
  const index = data.reviews.findIndex(row => row.id === item.id);
  const previous = data.reviews[index];
  if (previous?.status === "accepted" && reviewHash(previous) === reviewHash(item)) item = previous;
  else { item.status = item.status === "accepted" ? "review" : item.status; item.acceptedHash = ""; item.acceptedAt = ""; }
  if (index < 0) data.reviews.push(item); else data.reviews[index] = item;
  return validateWorkspace(data);
}
export function acceptReviewItem(data: Workspace, id: string, expectedHash: string) {
  const item = data.reviews.find(row => row.id === id);
  assert(item && item.status === "review", "Submit this draft for review first.");
  assert(reviewHash(item) === expectedHash, "This proposal changed. Reload and review the current version.");
  assert(item.proposal.trim() && item.evidence.trim() && item.rollback.trim(), "Acceptance requires exact proposal, evidence and rollback.");
  item.status = "accepted"; item.acceptedHash = reviewHash(item); item.acceptedAt = new Date().toISOString();
  return validateWorkspace(data);
}
export const newId = () => randomUUID();
