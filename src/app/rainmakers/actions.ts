"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateWorkspace } from "../../lib/workspace";
import { newId, upsertLesson, upsertTask, upsertReview, acceptReviewItem, validateWorkspace, reviewHash, taskHash } from "../../lib/model";
import type { LearningStatus, TaskStatus, Result, ReviewItem } from "../../lib/types";

function value(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }
function refresh() { revalidatePath("/rainmakers", "layout"); }
export async function saveSettings(form: FormData) {
  updateWorkspace(data => { data.settings = { memberName: value(form, "memberName"), projectName: value(form, "projectName") || "Your project", siteUrl: value(form, "siteUrl"), goal: value(form, "goal"), codexThreadId: value(form, "codexThreadId"), communityUrl: value(form, "communityUrl") }; return data; }); refresh();
  redirect("/rainmakers/settings?saved=1");
}
export async function saveLesson(form: FormData) {
  const slug = value(form, "slug") || value(form, "title").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  updateWorkspace(data => upsertLesson(data, {
    id: value(form, "id") || newId(), slug, title: value(form, "title"), course: value(form, "course") || "My courses", order: Number(form.get("order") || data.lessons.length + 1),
    summary: value(form, "summary"), sourceUrl: value(form, "sourceUrl"), notes: value(form, "notes"), claims: value(form, "claims"), inference: value(form, "inference"),
    actionBrief: value(form, "actionBrief"), desiredOutcome: value(form, "desiredOutcome"), learningStatus: (value(form, "learningStatus") || "todo") as LearningStatus,
  })); refresh(); redirect(`/rainmakers/${slug}?saved=1`);
}
export async function setLearningStatus(form: FormData) {
  updateWorkspace(data => { const lesson = data.lessons.find(row => row.id === value(form, "lessonId")); if (!lesson) throw new Error("Lesson not found."); lesson.learningStatus = value(form, "status") as LearningStatus; return data; }); refresh();
}
export async function saveTask(form: FormData) {
  updateWorkspace(data => upsertTask(data, { id: value(form, "id") || newId(), lessonId: value(form, "lessonId"), title: value(form, "title"), instructions: value(form, "instructions"), owner: value(form, "owner"), status: (value(form, "status") || "todo") as TaskStatus })); refresh();
}
export async function setTaskStatus(form: FormData) {
  updateWorkspace(data => { const task = data.tasks.find(row => row.id === (value(form, "id") || value(form, "taskId"))); if (!task) throw new Error("Task not found."); task.status = value(form, "status") as TaskStatus; return data; }); refresh();
}
export async function saveResult(form: FormData) {
  updateWorkspace(data => {
    const taskId = value(form, "taskId");
    const task = data.tasks.find(row => row.id === taskId);
    if (taskId && !task) throw new Error("Task not found.");
    data.results.push({ id: newId(), lessonId: value(form, "lessonId"), taskId, taskHash: task ? taskHash(task) : "", title: value(form, "title"), summary: value(form, "summary"), decision: value(form, "decision"), evidence: value(form, "evidence"), nextAction: value(form, "nextAction"), kind: value(form, "kind") as Result["kind"], createdAt: new Date().toISOString() }); return data;
  }); refresh();
}
export async function saveReview(form: FormData) {
  updateWorkspace(data => upsertReview(data, { id: value(form, "id") || newId(), lessonId: value(form, "lessonId"), title: value(form, "title"), proposal: value(form, "proposal"), evidence: value(form, "evidence"), rollback: value(form, "rollback"), status: value(form, "status") === "review" ? "review" : "draft", acceptedHash: "", acceptedAt: "" })); refresh();
}
export async function acceptReview(form: FormData) {
  if (value(form, "confirmation") !== "yes") throw new Error("Confirm review of this exact proposal first.");
  updateWorkspace(data => {
    const item = data.reviews.find(row => row.id === value(form, "id"));
    if (!item || reviewHash(item) !== value(form, "expectedHash")) throw new Error("This proposal changed after you opened it. Reload and review the current version.");
    return acceptReviewItem(data, item.id, value(form, "expectedHash"));
  }); refresh();
}
export async function importWorkspace(form: FormData) {
  if (value(form, "confirmation") !== "REPLACE") throw new Error("Type REPLACE to confirm replacing this local workspace.");
  const json = value(form, "workspace"); if (json.length > 2_000_000) throw new Error("Backup is too large.");
  const replacement = validateWorkspace(JSON.parse(json));
  updateWorkspace(() => replacement); refresh(); redirect("/rainmakers/settings?restored=1");
}
