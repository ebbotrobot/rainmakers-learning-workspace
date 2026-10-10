import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspace, validateWorkspace, reviewHash, taskHash, hasCurrentEvidence, acceptReviewItem, upsertReview, upsertTask, safeUrl } from "../src/lib/model.ts";
import type { Workspace, Task, ReviewItem, Result } from "../src/lib/types.ts";
const task = (): Task => ({ id: "task-1", lessonId: "lesson-1", title: "Review the lesson", instructions: "Write one question.", owner: "Member", status: "todo" });
const review = (): ReviewItem => ({ id: "review-1", lessonId: "lesson-1", title: "Small change", proposal: "Exact proposal", evidence: "Local test", rollback: "Restore prior version", status: "review", acceptedAt: "", acceptedHash: "" });
function withResult(data: Workspace) {
  const result: Result = { id: "result-1", lessonId: "lesson-1", taskId: "task-1", taskHash: taskHash(data.tasks[0]), title: "Saved work", summary: "Prepared a question.", decision: "Review it", evidence: "notes/question.md", nextAction: "Ask the owner", kind: "preparation", createdAt: "2026-01-01T12:00:00Z" };
  data.results.push(result); return data;
}
test("fresh workspace has bookmarks but no notes, tasks, results or approvals", () => {
  const data = validateWorkspace(createWorkspace()); assert.equal(data.lessons.length, 4); assert.equal(data.tasks.length + data.results.length + data.reviews.length, 0);
  assert(data.lessons.every(row => row.notes === "" && row.claims === "" && row.learningStatus === "todo"));
});
test("backup JSON round trips without losing evidence or acceptance", () => { const data = createWorkspace(); data.tasks.push(task()); withResult(data); data.reviews.push(review()); acceptReviewItem(data, "review-1", reviewHash(data.reviews[0])); assert.deepEqual(validateWorkspace(JSON.parse(JSON.stringify(data, null, 2))), data); });
test("unknown fields are rejected", () => assert.throws(() => validateWorkspace({ ...createWorkspace(), hidden: "data" }), /fields/));
test("unsafe and credential-bearing source URLs are rejected", () => { for (const url of ["javascript:alert(1)", "file:///private", "https://user:secret@example.com"]) assert.throws(() => safeUrl(url)); assert.equal(safeUrl("https://example.com/lesson"), "https://example.com/lesson"); });
test("reserved and duplicate lesson routes are rejected", () => { const data = createWorkspace(); data.lessons[0].slug = "settings"; assert.throws(() => validateWorkspace(data)); data.lessons[0].slug = data.lessons[1].slug; assert.throws(() => validateWorkspace(data)); });
test("task completion requires current evidence", () => { const data = createWorkspace(); data.tasks.push({ ...task(), status: "done" }); assert.throws(() => validateWorkspace(data), /evidence/); withResult(data); assert.doesNotThrow(() => validateWorkspace(data)); });
test("changing task scope reopens completed work and invalidates old evidence", () => { const data = createWorkspace(); data.tasks.push(task()); withResult(data); data.tasks[0].status = "done"; upsertTask(data, { ...data.tasks[0], instructions: "Now do something else" }); assert.equal(data.tasks[0].status, "review"); assert.equal(hasCurrentEvidence(data, data.tasks[0]), false); data.tasks[0].status = "done"; assert.throws(() => validateWorkspace(data), /exact task brief/); });
test("learning complete does not complete work", () => { const data = createWorkspace(); data.lessons[0].learningStatus = "done"; data.tasks.push(task()); validateWorkspace(data); assert.equal(data.tasks[0].status, "todo"); });
test("result cannot attach to a different lesson task", () => { const data = createWorkspace(); data.tasks.push(task()); withResult(data); data.results[0].lessonId = "lesson-2"; assert.throws(() => validateWorkspace(data), /match/); });
test("review accepts exact current content", () => { const data = createWorkspace(); data.reviews.push(review()); const hash = reviewHash(data.reviews[0]); acceptReviewItem(data, "review-1", hash); assert.equal(data.reviews[0].acceptedHash, hash); assert.equal(data.reviews[0].status, "accepted"); });
test("stale-page approval is rejected", () => { const data = createWorkspace(); data.reviews.push(review()); const hash = reviewHash(data.reviews[0]); data.reviews[0].proposal += " changed"; assert.throws(() => acceptReviewItem(data, "review-1", hash), /changed/); });
test("proposal edits reset acceptance", () => { const data = createWorkspace(); data.reviews.push(review()); acceptReviewItem(data, "review-1", reviewHash(data.reviews[0])); upsertReview(data, { ...data.reviews[0], proposal: "Changed proposal" }); assert.equal(data.reviews[0].status, "review"); assert.equal(data.reviews[0].acceptedHash, ""); });
test("tampered accepted backup is rejected", () => { const data = createWorkspace(); data.reviews.push(review()); acceptReviewItem(data, "review-1", reviewHash(data.reviews[0])); data.reviews[0].rollback = "Changed"; assert.throws(() => validateWorkspace(data), /changed/); });
test("draft cannot skip review and missing evidence cannot be accepted", () => { const data = createWorkspace(); data.reviews.push({ ...review(), status: "draft" }); assert.throws(() => acceptReviewItem(data, "review-1", reviewHash(data.reviews[0])), /review first/); data.reviews[0].status = "review"; data.reviews[0].evidence = ""; assert.throws(() => acceptReviewItem(data, "review-1", reviewHash(data.reviews[0])), /evidence/); });
test("workspace size is bounded to permit backup restore", () => { const data = createWorkspace(); data.settings.goal = "x".repeat(1_000_001); assert.throws(() => validateWorkspace(data), /1 MB/); });
