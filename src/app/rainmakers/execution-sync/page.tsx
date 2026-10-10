import type { Metadata } from "next";
import Link from "next/link";
import { readWorkspace } from "../../../lib/workspace";
import { hasCurrentEvidence } from "../../../lib/model";
import type { Lesson, Result, TaskStatus } from "../../../lib/types";
import { setTaskStatus } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Execution sync | Rainmakers",
  description: "Keep lesson progress, prepared work and saved implementation evidence separate.",
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do", doing: "In progress", review: "Needs review", done: "Done",
};
const resultLabels: Record<Result["kind"], string> = {
  preparation: "Preparation record", measurement: "Measurement record", implementation: "Implementation record",
};

function lessonHref(lesson: Lesson, section: "tasks" | "results") {
  return `/rainmakers/${encodeURIComponent(lesson.slug)}#${section}`;
}

export default async function RainmakersExecutionSyncPage() {
  const workspace = await readWorkspace();
  const lessons = new Map(workspace.lessons.map((lesson) => [lesson.id, lesson]));
  const learnedCount = workspace.lessons.filter((lesson) => lesson.learningStatus === "done").length;
  const preparationCount = workspace.results.filter((result) => result.kind === "preparation").length;
  const implementationCount = workspace.results.filter((result) => result.kind === "implementation").length;
  const measurementCount = workspace.results.filter((result) => result.kind === "measurement").length;
  const tasksWithoutEvidence = workspace.tasks.filter((task) => task.status === "done" &&
    !hasCurrentEvidence(workspace, task));
  const reviewCount = workspace.reviews.filter((review) => review.status === "review").length;
  const acceptedCount = workspace.reviews.filter((review) => review.status === "accepted").length;

  return (
    <div className="execution-sync-page">
      <Link href="/rainmakers" className="execution-sync-back">← Rainmakers classroom</Link>
      <header className="execution-sync-hero">
        <div>
          <span>Learn → prepare → review → record</span>
          <h1>What is actually done?</h1>
          <p>See the work, its owner and its evidence. Finishing a lesson is not the same as implementing it.</p>
        </div>
        <aside>
          <small>Workspace</small>
          <strong>{workspace.settings.projectName || "Your learning workspace"}</strong>
          <small>Execution connection</small>
          <strong>Manual records · no automatic sync</strong>
        </aside>
      </header>

      <section className="execution-sync-stage-grid" aria-label="Separate learning and evidence counts">
        <article><span>Learning</span><strong>{learnedCount} lessons learned</strong><p>Your recorded learning progress. No implementation is implied.</p></article>
        <article><span>Preparation</span><strong>{preparationCount} saved records</strong><p>Plans, drafts and previews. Prepared work is not published work.</p></article>
        <article><span>Implementation</span><strong>{implementationCount} saved records</strong><p>Reported changes and their evidence. This app does not verify a live release.</p></article>
        <article><span>Measurement</span><strong>{measurementCount} saved records</strong><p>Observations kept separately from claims about what caused a result.</p></article>
      </section>

      <section className="execution-sync-section" id="tasks">
        <div className="execution-sync-section-head">
          <div><span>Open board</span><h2>Owner + next action</h2></div>
          <p>Update the task as work progresses. Save the output on its lesson page; a status label alone is not proof.</p>
        </div>
        {workspace.tasks.length ? (
          <div className="execution-release-list">
            {workspace.tasks.map((task) => {
              const lesson = lessons.get(task.lessonId);
              const results = workspace.results.filter((result) => result.taskId === task.id);
              return (
                <article key={task.id}>
                  <div><code>{lesson?.title || "Lesson unavailable"}</code><span>{statusLabels[task.status]}</span></div>
                  <h3>{task.title}</h3>
                  <p className="whitespace-pre-wrap">{task.instructions || "Add the exact next action on the lesson page."}</p>
                  <small>Owner: {task.owner || "Unassigned"} · {results.length} saved {results.length === 1 ? "result" : "results"}</small>
                  <form action={setTaskStatus} className="rm-form">
                    <input type="hidden" name="id" value={task.id} />
                    <label className="rm-field">Task status
                      <select name="status" defaultValue={task.status}>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value} disabled={value === "done" && !hasCurrentEvidence(workspace, task)}>{label}</option>)}
                      </select>
                    </label>
                    <button type="submit">Save status</button>
                  </form>
                  {lesson ? <div className="execution-next-actions"><Link href={lessonHref(lesson, "tasks")}>Open task</Link><Link href={lessonHref(lesson, "results")}>Record or review output</Link></div> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="living-answer-empty">
            <div><h3>No tasks yet</h3><p>Open a lesson, write one concrete action and assign an owner. Its progress and output will appear here.</p></div>
            <Link href="/rainmakers">Choose a lesson →</Link>
          </div>
        )}
      </section>

      <section className="execution-sync-section" id="results">
        <div className="execution-sync-section-head">
          <div><span>Durable outputs</span><h2>Results you can return to</h2></div>
          <p>These are user-saved records, not independently verified outcomes. Keep the exact evidence and its limitations attached.</p>
        </div>
        {workspace.results.length ? (
          <div className="execution-release-list">
            {[...workspace.results].reverse().map((result) => {
              const lesson = lessons.get(result.lessonId);
              return (
                <article key={result.id}>
                  <div><code>{lesson?.title || "Lesson unavailable"}</code><span>{resultLabels[result.kind]}</span></div>
                  <h3>{result.title}</h3>
                  <p className="whitespace-pre-wrap">{result.summary}</p>
                  <small>Recorded: {result.createdAt || "Date not recorded"}</small>
                  <details className="execution-sync-details">
                    <summary>Evidence, decision and next action</summary>
                    <h4>Evidence</h4><p className="whitespace-pre-wrap">{result.evidence || "No evidence attached. Treat this as an unverified report."}</p>
                    <h4>Decision</h4><p className="whitespace-pre-wrap">{result.decision || "No decision recorded."}</p>
                    <h4>Next action</h4><p className="whitespace-pre-wrap">{result.nextAction || "No next action recorded."}</p>
                  </details>
                  {lesson ? <div className="execution-next-actions"><Link href={lessonHref(lesson, "results")}>Open lesson results →</Link></div> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="living-answer-empty"><div><h3>No output recorded yet</h3><p>When a task produces a plan, test or implementation receipt, save it on the lesson. “Learned” will stay separate from that evidence.</p></div><Link href="/rainmakers">Open the classroom →</Link></div>
        )}
      </section>

      <section className="execution-sync-section is-alert">
        <div className="execution-sync-section-head">
          <div><span>Review gates</span><h2>What still needs proof?</h2></div>
          <p>This workspace never deploys. Production changes belong to an external executor after tests and a separate confirmation.</p>
        </div>
        <div className="execution-finding-list">
          <article><span>Review</span><div><h3>{reviewCount} proposals waiting for content review</h3><p>Read the exact copy, supporting evidence and rollback before accepting.</p></div></article>
          <article><span>Prepare</span><div><h3>{acceptedCount} accepted proposals</h3><p>Acceptance permits preparation only. It does not confirm implementation, publication or permission to deploy.</p></div></article>
          {tasksWithoutEvidence.map((task) => <article key={task.id}><span>Evidence</span><div><h3>{task.title}</h3><p>Marked done, but no result with evidence is attached. Add the evidence or correct the task status.</p></div></article>)}
        </div>
      </section>

      <section className="execution-next-card">
        <div><span>Your next step</span><h2>Keep the loop small.</h2><p>Choose one lesson, prepare one useful change, review it and keep its result. Connect your own assistant in settings if useful.</p></div>
        <ol><li>Learn the lesson and record your understanding.</li><li>Prepare the task and attach its evidence.</li><li>Review the proposal before handing it to an executor.</li><li>Record what happened, including what remains unverified.</li></ol>
        <div className="execution-next-actions"><Link href="/rainmakers/content-review">Open content review</Link><Link href="/rainmakers/settings">Workspace settings</Link></div>
      </section>
    </div>
  );
}
