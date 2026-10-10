import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "../../components";
import { hasCurrentEvidence } from "../../lib/model";
import type { Lesson, Task, TaskStatus, Workspace } from "../../lib/types";
import { readWorkspace } from "../../lib/workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Today | Rainmakers",
  description: "Your lessons, next action, and saved results in one place.",
};

const learningLabel = { todo: "Not started", doing: "Learning", done: "Understood" };
const taskLabel: Record<TaskStatus, string> = {
  todo: "Not started", doing: "In progress", review: "Ready for review", done: "Marked done",
};
const statusTone = (status: TaskStatus): "neutral" | "green" | "yellow" | "blue" =>
  status === "done" ? "green" : status === "doing" ? "blue" : status === "review" ? "yellow" : "neutral";
const lessonHref = (lesson?: Lesson) => lesson ? `/rainmakers/${encodeURIComponent(lesson.slug)}` : "/rainmakers/new";
const excerpt = (text: string, fallback: string, limit = 180) => {
  const value = text.trim();
  return value ? value.length > limit ? `${value.slice(0, limit).trimEnd()}…` : value : fallback;
};
const dateLabel = (value?: string) => {
  if (!value) return "No result saved yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not recorded" : new Intl.DateTimeFormat("en", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(date);
};

export default async function RainmakersPage() {
  const workspace: Workspace = await readWorkspace();
  const { settings, tasks, results, reviews } = workspace;
  const lessons = [...workspace.lessons].sort((a, b) => a.order - b.order);
  const projectName = settings.projectName.trim() || "your project";
  const understood = lessons.filter((lesson) => lesson.learningStatus === "done").length;
  const withNotes = lessons.filter((lesson) => lesson.notes.trim()).length;
  const completedTasks = tasks.filter((task) => task.status === "done");
  const missingOutputs = completedTasks.filter((task) => !hasCurrentEvidence(workspace, task));
  const pendingReviews = reviews.filter((review) => review.status === "review");
  const taskReviews = tasks.filter((task) => task.status === "review");
  const openTasks = tasks.filter((task) => task.status !== "done");
  const latestResult = [...results].sort((a, b) =>
    (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
  )[0];
  const preparation = results.filter((result) => result.kind === "preparation");
  const implementation = results.filter((result) => result.kind === "implementation");
  const measurement = results.filter((result) => result.kind === "measurement");
  const acceptedReviews = reviews.filter((review) => review.status === "accepted");
  const foundationLessons = lessons.filter((lesson) => /foundations?/i.test(lesson.course));
  const featuredLessons = foundationLessons.length ? foundationLessons : lessons.slice(0, 3);
  const supplementaryLessons = lessons.filter((lesson) => !featuredLessons.some((featured) => featured.id === lesson.id));
  const nextLesson = lessons.find((lesson) => lesson.learningStatus === "doing")
    ?? lessons.find((lesson) => lesson.learningStatus === "todo") ?? lessons[0];
  const activeTask = tasks.find((task) => task.status === "doing") ?? taskReviews[0]
    ?? tasks.find((task) => task.status === "todo");
  const activeLesson = activeTask ? lessons.find((lesson) => lesson.id === activeTask.lessonId) : nextLesson;
  const needsSetup = !settings.projectName.trim() || !settings.goal.trim();
  const nextAction = needsSetup
    ? { title: "Give your project a clear goal.", copy: "Add your project and the outcome you want. Then choose one lesson to work through.", href: "/rainmakers/settings", label: "Set your project goal" }
    : activeTask
      ? { title: activeTask.title, copy: excerpt(activeTask.instructions, "Open the task, check the brief, and save the next useful output."), href: activeLesson ? `${lessonHref(activeLesson)}#tasks` : "/rainmakers/execution-sync", label: activeTask.status === "review" ? "Review the task" : "Open the task" }
      : pendingReviews[0]
        ? { title: `Review: ${pendingReviews[0].title}`, copy: excerpt(pendingReviews[0].proposal, "Check the proposal and its evidence before deciding."), href: "/rainmakers/content-review", label: "Open content review" }
        : nextLesson && nextLesson.learningStatus !== "done"
          ? { title: `Start with ${nextLesson.title}.`, copy: excerpt(nextLesson.notes, "Add your own notes, name what is unclear, and prepare one small exercise."), href: lessonHref(nextLesson), label: "Open the lesson" }
          : latestResult?.nextAction.trim()
            ? { title: latestResult.nextAction, copy: excerpt(latestResult.summary, "Read the saved result before choosing your next step."), href: "/rainmakers/execution-sync", label: "Open the saved result" }
            : { title: lessons.length ? "Choose your next useful piece of work." : "Add your first lesson.", copy: lessons.length ? "Review your notes and create one task with an output you can check." : "Keep the title and a private bookmark, then add your own notes when you are ready.", href: lessonHref(nextLesson), label: lessons.length ? "Open your notes" : "Set up your classroom" };

  const stages = [
    { title: "Understand the lesson", label: `${understood}/${lessons.length} understood`, job: "Keep your notes and questions together.", detail: `${withNotes} lessons have your notes.`, href: lessonHref(nextLesson), active: lessons.some((lesson) => lesson.learningStatus === "doing") },
    { title: "Prepare one useful output", label: `${openTasks.length} open tasks`, job: "Give the work a clear brief and a concrete output.", detail: `${preparation.length} preparation results saved.`, href: activeLesson ? `${lessonHref(activeLesson)}#tasks` : "/rainmakers/new", active: tasks.some((task) => task.status === "doing") },
    { title: "Review the proposal", label: `${pendingReviews.length} awaiting review`, job: "Check the evidence and decide what is ready.", detail: `${acceptedReviews.length} proposals accepted. Acceptance is not implementation.`, href: "/rainmakers/content-review", active: pendingReviews.length > 0 },
    { title: "Record what you applied", label: `${implementation.length} implementation records`, job: "Save what actually changed after your separate decision to act.", detail: "Drafts and measurements stay in their own result categories.", href: "/rainmakers/execution-sync", active: implementation.length > 0 },
    { title: "Measure what happened", label: `${measurement.length} measurement records`, job: "Keep the dates, evidence, and limits with the result.", detail: "No measurement recorded means unknown, not zero.", href: "/rainmakers/execution-sync", active: measurement.length > 0 },
    { title: "Choose the next move", label: `${results.filter((result) => result.decision.trim()).length} decisions saved`, job: "Use the result to choose your next step.", detail: latestResult ? excerpt(latestResult.decision, "Add a decision to your latest result.") : "Your first saved result will appear here.", href: "/rainmakers/execution-sync", active: Boolean(latestResult?.decision.trim()) },
  ];

  return (
    <div className="simple-home money-map-home">
      <header className="simple-home-head money-map-home-head">
        <div className="workspace-eyebrow">Rainmakers × {projectName}</div>
        <h1>Build {projectName} with Rainmakers</h1>
        <p>Learn one lesson, prepare useful work, and save what actually happened.</p>
      </header>

      <ExecutionSyncBanner workspace={workspace} />

      <section className="money-map-section" aria-labelledby="long-term-goal-title">
        <div className="money-map-section-head">
          <div>
            <span>Your long-term goal</span>
            <h2 id="long-term-goal-title">{settings.goal.trim() || "What are you working towards?"}</h2>
            <p>{settings.goal.trim() ? "Keep this outcome in view when choosing the next lesson or task." : "Set an outcome in Settings. Your lessons, tasks, and results can then support it."}</p>
          </div>
          <Link href="/rainmakers/settings">Edit goal <span aria-hidden>→</span></Link>
        </div>
      </section>

      <section className="money-map-hero" aria-labelledby="current-stage-title">
        <div className="money-map-hero-main">
          <div className="money-map-current-label"><span>Today · next action</span><small>{activeTask ? taskLabel[activeTask.status] : "One step at a time"}</small></div>
          <h2 id="current-stage-title">{nextAction.title}</h2>
          <p>{nextAction.copy}</p>
          <div className="money-map-hero-checks">
            <div><span>1</span><p><strong>Learning</strong>{understood} of {lessons.length} lessons marked understood.</p></div>
            <div><span>2</span><p><strong>Work</strong>{openTasks.length} open tasks. {taskReviews.length} ready for review.</p></div>
            <div><span>3</span><p><strong>Results</strong>{results.length ? `${results.length} saved results. Latest: ${excerpt(latestResult.title, "Untitled result", 90)}.` : "Save the output, evidence, and your next decision."}</p></div>
          </div>
          <div className="money-map-hero-actions">
            <Link href={nextAction.href}>{nextAction.label} <span aria-hidden>→</span></Link>
            <Link href="/rainmakers/execution-sync">See saved results</Link>
          </div>
          <p className="money-map-stopline">Preparing or reviewing work does not apply it. Record external changes only after they happen.</p>
        </div>

        <aside className="visibility-score-card" aria-label="Your recorded learning and work progress">
          <div className="visibility-score-label">Your recorded progress</div>
          <div className="visibility-score-number">{understood}<span>/{lessons.length}</span></div>
          <div className="visibility-band">Lessons marked understood</div>
          <p>Your learning progress and saved work are counted separately.</p>
          <div className="visibility-split">
            <div><span>Tasks</span><strong>{completedTasks.length}/{tasks.length}</strong><small>Marked done{missingOutputs.length ? ` · ${missingOutputs.length} still need evidence for the current task` : ""}</small></div>
            <div><span>Saved results</span><strong>{results.length}</strong><small>{preparation.length} preparation · {implementation.length} implementation · {measurement.length} measurement</small></div>
          </div>
          <Link href="/rainmakers/execution-sync">Open the evidence <span aria-hidden>→</span></Link>
          <small className="visibility-date">{latestResult ? `Latest result · ${dateLabel(latestResult.createdAt)}` : "No result saved yet"}</small>
        </aside>
      </section>

      <section className="money-map-section" aria-labelledby="foundation-title">
        <div className="money-map-section-head">
          <div><span>Your classroom</span><h2 id="foundation-title">{foundationLessons.length ? "Start with Foundations" : "Start with your lessons"}</h2><p>Keep your learning separate from the work you choose to apply.</p></div>
          <div className="source-coverage"><strong>{withNotes}/{lessons.length}</strong><span>Lessons with your own notes</span></div>
        </div>
        <div className="foundation-parts">
          {featuredLessons.length ? featuredLessons.map((lesson, index) => {
            const lessonTasks = tasks.filter((task) => task.lessonId === lesson.id);
            const lessonResults = results.filter((result) => result.lessonId === lesson.id);
            return (
              <Link key={lesson.id} href={lessonHref(lesson)} className={lesson.id === activeLesson?.id ? "is-current-build" : ""}>
                <div className="foundation-part-top"><span>{String(index + 1).padStart(2, "0")}</span><em className={lesson.learningStatus === "done" ? "is-complete" : "is-todo"}>{learningLabel[lesson.learningStatus]}</em></div>
                <h3>{lesson.title}</h3>
                <p>{excerpt(lesson.summary || lesson.notes, "Add your own notes and a private lesson bookmark.")}</p>
                <small>{lessonTasks.length} tasks · {lessonResults.length} saved results{!lesson.sourceUrl.trim() ? " · Bookmark not set" : ""}</small>
                <b>Open lesson <span aria-hidden>→</span></b>
              </Link>
            );
          }) : (
            <Link href="/rainmakers/new" className="is-current-build">
              <div className="foundation-part-top"><span>01</span><em className="is-todo">Not started</em></div>
              <h3>Your first lesson</h3><p>Add a title and your own notes. Keep the private course bookmark in your workspace.</p><small>0 tasks · 0 saved results</small><b>Set up your classroom <span aria-hidden>→</span></b>
            </Link>
          )}
        </div>
        <details className="course-coverage-note">
          <summary>What these counts mean</summary>
          <p>Titles and bookmarks organise your own learning. Progress comes from the status you set; notes come from what you enter. No lesson content is included, and no course access or completion is inferred.</p>
        </details>
      </section>

      <section className="money-map-section" aria-labelledby="open-board-title">
        <div className="money-map-section-head">
          <div><span>Open board</span><h2 id="open-board-title">Give each task a next action</h2><p>{openTasks.length ? `${openTasks.length} tasks are still open. Read the brief before doing the work.` : "No open tasks yet. Start with one small exercise from your lesson notes."}</p></div>
          <Link href="/rainmakers/execution-sync">Full execution sync <span aria-hidden>→</span></Link>
        </div>
        <div className="rm-open-table-wrap">
          <table className="rm-open-table" aria-label="Open tasks, owners, and next steps">
            <thead><tr><th scope="col">Item</th><th scope="col">Owner</th><th scope="col">Next step</th></tr></thead>
            <tbody>
              {openTasks.length ? openTasks.map((task) => {
                const lesson = lessons.find((item) => item.id === task.lessonId);
                return <tr key={task.id}><td><strong>{task.title}</strong><br /><em>{taskLabel[task.status]}</em></td><td>{task.owner.trim() || "Not assigned"}</td><td>{excerpt(task.instructions, "Add a brief and a clear output.")} <span className="rm-open-links"><Link href={lesson ? `${lessonHref(lesson)}#tasks` : "/rainmakers/execution-sync"}>Open task →</Link></span></td></tr>;
              }) : <tr><td>No open tasks</td><td>—</td><td><Link href={lessonHref(nextLesson)}>Open a lesson to prepare your first task →</Link></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="money-map-section" aria-labelledby="stages-title">
        <div className="money-map-section-head">
          <div><span>The operating loop</span><h2 id="stages-title">Learn. Prepare. Review. Repeat.</h2><p>Your saved records show what happened at each step.</p></div>
          <Link href="/rainmakers/execution-sync">Open results <span aria-hidden>→</span></Link>
        </div>
        <div className="money-map-stages">
          {stages.map((stage, index) => (
            <Link key={stage.title} href={stage.href} className={stage.active ? "is-current" : "is-queued"}>
              <span className="money-map-stage-number">{index + 1}</span>
              <div><div className="money-map-stage-title"><h3>{stage.title}</h3><em>{stage.label}</em></div><p>{stage.job}</p><small>{stage.detail}</small></div>
              <b aria-hidden>→</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="money-map-section" aria-labelledby="review-title">
        <div className="money-map-section-head">
          <div><span>Content review</span><h2 id="review-title">From draft to a clear decision</h2><p>Keep the proposed change, evidence, and decision together.</p></div>
          <Link href="/rainmakers/content-review">Open review <span aria-hidden>→</span></Link>
        </div>
        <div className="lever-summary-grid">
          {([
            { status: "draft", title: "Drafts", copy: "Prepare the proposal and the evidence someone needs to review it." },
            { status: "review", title: "Ready for review", copy: "Check what will change, why, and how it could be undone." },
            { status: "accepted", title: "Accepted proposals", copy: "An accepted proposal still needs a separate implementation record." },
          ] as const).map((item) => (
            <Link key={item.status} href="/rainmakers/content-review" className={item.status === "review" && pendingReviews.length ? "is-current" : "is-queued"}>
              <div><span>{reviews.filter((review) => review.status === item.status).length}</span><em>{item.status === "accepted" ? "Not automatically applied" : "Your saved proposals"}</em></div>
              <h3>{item.title}</h3><p>{item.copy}</p><b>Open review <span aria-hidden>→</span></b>
            </Link>
          ))}
        </div>
      </section>

      <details className="simple-disclosure" id="reference-library">
        <summary><div><span>Reference library</span><strong>More lessons and your own notes</strong><small>{supplementaryLessons.length} additional lessons in your workspace.</small></div><b>Open library <span aria-hidden>↓</span></b></summary>
        <div className="simple-course-list">
          {supplementaryLessons.length ? supplementaryLessons.map((lesson) => (
            <Link key={lesson.id} href={lessonHref(lesson)} className={`is-${lesson.learningStatus === "done" ? "complete" : lesson.learningStatus}`}>
              <span>{lesson.learningStatus === "done" ? "✓" : lesson.order}</span>
              <div><small>{lesson.course || "Your classroom"}</small><strong>{lesson.title}</strong><em className={`course-state is-${lesson.learningStatus === "done" ? "complete" : lesson.learningStatus}`}>{learningLabel[lesson.learningStatus]}</em><p>{excerpt(lesson.summary || lesson.notes, "Add your own notes when you work through this lesson.")}</p></div>
              <b aria-hidden>→</b>
            </Link>
          )) : <Link href="/rainmakers/new"><span>+</span><div><small>Your library</small><strong>No additional lessons yet</strong><p>Add your own lesson titles and private bookmarks as you need them.</p></div><b aria-hidden>→</b></Link>}
        </div>
      </details>

      <details className="simple-disclosure" id="project-goals">
        <summary><div><span>Goal and tasks</span><strong>The full work plan</strong><small>{tasks.length} tasks · {completedTasks.length} marked done · {results.length} results.</small></div><b>Open details <span aria-hidden>↓</span></b></summary>
        <div className="goal-list simple-goal-list">
          <div className="goal-detail"><div className="goal-success"><span>Your goal</span><strong>{settings.goal.trim() || "Set your goal in Settings."}</strong></div></div>
          {lessons.map((lesson) => {
            const lessonTasks = tasks.filter((task) => task.lessonId === lesson.id);
            const done = lessonTasks.filter((task) => task.status === "done").length;
            return (
              <details key={lesson.id}>
                <summary><span className={`goal-code is-${lesson.learningStatus}`}>{String(lesson.order).padStart(2, "0")}</span><div><strong>{lesson.title}</strong><small>{lesson.desiredOutcome.trim() || "Choose an output you can check."}</small></div><div className="goal-summary-state"><Badge tone={lesson.learningStatus === "done" ? "green" : lesson.learningStatus === "doing" ? "blue" : "neutral"}>{learningLabel[lesson.learningStatus]}</Badge><span>{done}/{lessonTasks.length} tasks</span></div></summary>
                <div className="goal-detail">
                  {lessonTasks.length ? lessonTasks.map((task, index) => <GoalTask key={task.id} task={task} lesson={lesson} position={index + 1} resultCount={results.filter((result) => result.taskId === task.id).length} hasEvidence={hasCurrentEvidence(workspace, task)} />) : <div className="goal-step"><span className="goal-stepmark is-todo">1</span><div><div className="goal-step-title"><strong>No task yet</strong></div><p>Use your notes to prepare one small exercise.</p></div><div className="goal-step-actions"><Link href={`${lessonHref(lesson)}#tasks`}>Open lesson →</Link></div></div>}
                </div>
              </details>
            );
          })}
          {!lessons.length ? <div className="goal-detail"><p>Add your first lesson to begin the work plan.</p><Link href="/rainmakers/new">Add your first lesson →</Link></div> : null}
          {tasks.some((task) => !lessons.some((lesson) => lesson.id === task.lessonId)) ? <div className="goal-detail"><p>Some tasks are not linked to an existing lesson.</p><Link href="/rainmakers/execution-sync">Review unlinked work →</Link></div> : null}
        </div>
      </details>
    </div>
  );
}

function ExecutionSyncBanner({ workspace }: { workspace: Workspace }) {
  const missingOutputs = workspace.tasks.filter((task) => task.status === "done" && !hasCurrentEvidence(workspace, task)).length;
  const reviewCount = workspace.reviews.filter((review) => review.status === "review").length;
  const taskReviewCount = workspace.tasks.filter((task) => task.status === "review").length;
  const attentionCount = missingOutputs + reviewCount + taskReviewCount;
  return (
    <section className={`execution-sync-banner ${attentionCount ? "" : "is-clear"}`} aria-label="Recorded work and evidence">
      <div className="execution-sync-banner-status"><strong>{attentionCount}</strong><span>items to review</span></div>
      <div className="execution-sync-banner-copy">
        <small>{workspace.settings.memberName.trim() ? `${workspace.settings.memberName.trim()}’s workspace` : "Your workspace"} · saved records</small>
        <h2>{attentionCount ? "Check the work that needs a decision." : workspace.results.length ? "Your saved results are ready to revisit." : "Keep the proof with the work."}</h2>
        <p>{attentionCount ? `${taskReviewCount} tasks ready for review. ${reviewCount} proposals awaiting review. ${missingOutputs} tasks marked done need evidence for their current version.` : "See what was prepared, measured, or implemented, and what should happen next."}</p>
      </div>
      <Link href="/rainmakers/execution-sync">Review execution <span aria-hidden>→</span></Link>
    </section>
  );
}

function GoalTask({ task, lesson, position, resultCount, hasEvidence }: { task: Task; lesson: Lesson; position: number; resultCount: number; hasEvidence: boolean }) {
  return (
    <div className="goal-step">
      <span className={`goal-stepmark is-${task.status}`}>{task.status === "done" ? "✓" : position}</span>
      <div><div className="goal-step-title"><strong>{task.title}</strong><Badge tone={statusTone(task.status)}>{taskLabel[task.status]}</Badge></div><p>{excerpt(task.instructions, "Add the brief and the output you need.")}</p><small><b>Owner:</b> {task.owner.trim() || "Not assigned"} · {resultCount} saved results{task.status === "done" && !hasEvidence ? " · Add evidence for the current task" : ""}</small></div>
      <div className="goal-step-actions"><Link href={`${lessonHref(lesson)}#tasks`}>Open task →</Link></div>
    </div>
  );
}
