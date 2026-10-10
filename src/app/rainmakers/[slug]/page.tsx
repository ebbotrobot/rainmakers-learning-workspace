import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Badge, Card } from "../../../components";
import { hasCurrentEvidence } from "../../../lib/model";
import type { Lesson, Result, Task } from "../../../lib/types";
import { readWorkspace } from "../../../lib/workspace";
import { saveLesson, saveResult, saveReview, saveTask, setLearningStatus, setTaskStatus } from "../actions";
import { LessonCodexChat } from "./lesson-codex-chat";

export const dynamic = "force-dynamic";
const loadWorkspace = cache(readWorkspace);
type Props = { params: Promise<{ slug: string }> };
const learningLabels = { todo: "Not started", doing: "Learning in progress", done: "Lesson learned" } as const;
const taskLabels = { todo: "Not started", doing: "In progress", review: "Ready for review", done: "Work complete" } as const;
const lines = (text: string) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const lessonHref = (slug: string) => `/rainmakers/${encodeURIComponent(slug)}`;

function sourceHref(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function blankLesson(order: number): Lesson {
  return { id: "", slug: "", title: "", course: "", order, summary: "", sourceUrl: "", notes: "", claims: "", inference: "", actionBrief: "", desiredOutcome: "", learningStatus: "todo" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "new") return { title: "Add a lesson | Rainmakers OS" };
  const lesson = loadWorkspace().lessons.find((item) => item.slug === slug);
  return lesson ? { title: `${lesson.title} | Rainmakers OS`, description: lesson.summary } : { title: "Lesson not found | Rainmakers OS" };
}

export default async function RainmakerModulePage({ params }: Props) {
  const { slug } = await params;
  const workspace = loadWorkspace();
  const lessons = workspace.lessons.slice().sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  if (slug === "new") {
    return (
      <div className="pb-12">
        <Link href="/rainmakers" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] hover:underline">← Rainmakers OS</Link>
        <header className="mt-4 border border-[var(--line)] bg-white p-6 md:p-8">
          <Badge tone="blue">Your lesson record</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">Add a lesson</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">Start with a title and your own notes. No course material or completed work is assumed.</p>
        </header>
        <LessonEditor lesson={blankLesson(Math.max(0, ...lessons.map((lesson) => lesson.order)) + 1)} isNew />
      </div>
    );
  }
  const lesson = lessons.find((item) => item.slug === slug);
  if (!lesson) notFound();
  const index = lessons.findIndex((item) => item.id === lesson.id);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const tasks = workspace.tasks.filter((task) => task.lessonId === lesson.id);
  const results = workspace.results.filter((result) => result.lessonId === lesson.id).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reviews = workspace.reviews.filter((review) => review.lessonId === lesson.id);
  const missingReceipts = tasks.filter((task) => task.status === "done" && !hasCurrentEvidence(workspace, task));
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const source = sourceHref(lesson.sourceUrl);

  return (
    <div className="pb-12">
      <Link href="/rainmakers" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] hover:underline">← Rainmakers OS</Link>
      <header className="mt-4 border border-[var(--line)] bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-4xl font-black text-[#d9dcf0]">{String(lesson.order).padStart(2, "0")}</span>
          <Badge tone="blue">Member lesson</Badge>
          <Badge>{lesson.course || "Course not specified"}</Badge>
          <Badge tone={lesson.learningStatus === "done" ? "green" : lesson.learningStatus === "doing" ? "blue" : "neutral"}>{lesson.learningStatus === "done" ? "✓ " : ""}{learningLabels[lesson.learningStatus]}</Badge>
          <Badge tone={missingReceipts.length ? "red" : "neutral"}>{tasks.length ? `Work: ${completedTasks}/${tasks.length} tasks marked complete` : "Work: no tasks saved"}</Badge>
        </div>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">{lesson.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">{lesson.summary || "No summary saved. Add your own understanding in the notes below."}</p>
        <div className="mt-6 border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3">
          <div className="text-xs font-black uppercase text-[var(--accent)]">The result we want</div>
          <div className="mt-1 font-bold text-[var(--ink)]">{lesson.desiredOutcome || "No desired outcome recorded yet."}</div>
        </div>
        <form action={setLearningStatus} className="rm-form mt-5">
          <input type="hidden" name="lessonId" value={lesson.id} />
          <label className="rm-field"><span>My learning status</span><select name="status" defaultValue={lesson.learningStatus}><option value="todo">Not started</option><option value="doing">In progress</option><option value="done">Learned</option></select></label>
          <p className="text-xs leading-5 text-[var(--muted)]">Learning a lesson does not complete its tasks or apply an external change.</p>
          <button className="rm-button" type="submit">Save learning status</button>
        </form>
      </header>

      {missingReceipts.length ? <MissingCompletedResult lesson={lesson} tasks={missingReceipts} /> : null}
      {results.length ? <CompletedResult result={results[0]} primary /> : <LessonStatePanel lesson={lesson} tasks={tasks} />}

      <LessonCodexChat key={`${lesson.id}:${lesson.learningStatus}:${results[0]?.id ?? "empty"}`} settings={workspace.settings} lesson={lesson} latestResult={results[0]} />

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <ListCard eyebrow="Learn it" title="What my notes say" items={lines(lesson.notes)} empty="No owner notes saved yet." tone="blue" />
        <ListCard eyebrow="Assistant preparation" title="Ways to work with this lesson" items={["Explain only the notes you supply.", "Check understanding one question at a time.", "Prepare a bounded task or review your saved output."]} tone="green" />
      </section>

      <section id="tasks" className="mt-5 grid scroll-mt-6 gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <Card>
          <div className="text-xs font-black uppercase text-[var(--accent)]">Do it together</div>
          <h2 className="mt-1 text-2xl font-black">My practice tasks</h2>
          {tasks.length ? <ol className="mt-5 space-y-5">{tasks.map((task, taskIndex) => <li key={task.id} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center bg-[var(--accent)] text-sm font-black text-white">{taskIndex + 1}</span><div className="min-w-0 flex-1 pt-1 text-sm leading-6 text-[var(--text)]"><TaskRecord task={task} hasReceipt={hasCurrentEvidence(workspace, task)} /></div></li>)}</ol> : <p className="mt-4 text-sm leading-6 text-[var(--muted)]">No tasks saved. Add one exercise when you know what you want to practise.</p>}
          <details className="rm-form mt-5"><summary>Add one practice task</summary><TaskEditor lessonId={lesson.id} /></details>
        </Card>
        <div className="grid gap-4">
          <ListCard eyebrow="Member input" title="What I need to provide" items={["My own notes and a concrete question.", "The scope and constraints of this practice task.", "Any facts or inputs still missing."]} tone="yellow" />
          <ListCard eyebrow="Proof" title="What a result must record" items={["The actual output and what was performed.", "What was not performed and any limitations.", "Evidence, a decision and one next action."]} tone="neutral" />
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <ListCard eyebrow="Stop rules" title="Preparation is not permission" items={["Keep missing facts labelled unknown.", "Review the exact proposed action before publishing, spending, messaging or changing external systems.", "Save the evidence before describing work as complete."]} tone="red" />
        <Card>
          <div className="text-xs font-black uppercase text-[var(--muted)]">Provenance</div>
          <h2 className="mt-1 text-xl font-black">Source, interpretation and observation</h2>
          <div className="mt-4 grid gap-2">{source ? <a href={source} target="_blank" rel="noopener noreferrer" className="border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm font-bold text-[var(--accent)] hover:border-[#c8c8fb]">Open my private source bookmark ↗</a> : <p className="text-sm text-[var(--muted)]">No valid source bookmark saved.</p>}</div>
          <details className="mt-4"><summary className="font-bold">My notes on explicit source claims</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{lesson.claims || "No source claims recorded. The workspace does not invent what a lesson teaches."}</p></details>
          <details className="mt-4"><summary className="font-bold">My interpretation</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{lesson.inference || "No interpretation recorded."}</p></details>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">Source claims are your attributed notes, not independently verified teaching. Observed results belong in dated receipts. Keep paid lessons, transcripts and community replies out of shared copies.</p>
        </Card>
      </section>

      <LessonEditor lesson={lesson} />
      <section id="save-result" className="mt-5 scroll-mt-6"><Card><div className="text-xs font-black uppercase text-[var(--accent)]">Save the proof</div><h2 className="mt-1 text-2xl font-black">Add a result receipt</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Record only what happened. Saving a preparation or measurement does not claim an implementation.</p><details className="rm-form mt-4"><summary>Record an output, evidence and decision</summary><ResultEditor lessonId={lesson.id} tasks={tasks} /></details></Card></section>
      {results.length > 1 ? <details className="lesson-result-evidence mt-5"><summary><span>Earlier saved results</span><small>{results.length - 1} records</small></summary><div>{results.slice(1).map((result) => <CompletedResult key={result.id} result={result} />)}</div></details> : null}
      <section className="mt-5"><Card><div className="text-xs font-black uppercase text-[var(--accent)]">Separate review</div><h2 className="mt-1 text-2xl font-black">Proposals needing a decision</h2>{reviews.length ? <ul className="mt-4 space-y-3">{reviews.map((review) => <li key={review.id}><strong>{review.title}</strong> <Badge tone={review.status === "accepted" ? "green" : "yellow"}>{review.status}</Badge><p className="mt-1 text-sm text-[var(--muted)]">{review.proposal}</p></li>)}</ul> : <p className="mt-3 text-sm text-[var(--muted)]">No review proposal saved for this lesson.</p>}<details className="rm-form mt-4"><summary>Prepare a review proposal</summary><ReviewEditor lessonId={lesson.id} /></details><p className="mt-4 text-xs text-[var(--muted)]">A saved or accepted proposal is a local record. It does not publish or execute anything.</p></Card></section>

      <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Rainmakers lesson navigation">
        {previous ? <Link href={lessonHref(previous.slug)} className="border border-[var(--line)] bg-white p-4 hover:border-[#c8c8fb]"><div className="text-xs font-bold uppercase text-[var(--muted)]">Previous</div><div className="mt-1 font-black">← {previous.title}</div></Link> : <div />}
        {next ? <Link href={lessonHref(next.slug)} className="border border-[var(--line)] bg-white p-4 text-right hover:border-[#c8c8fb]"><div className="text-xs font-bold uppercase text-[var(--muted)]">Next</div><div className="mt-1 font-black">{next.title} →</div></Link> : null}
      </nav>
    </div>
  );
}

function LessonStatePanel({ lesson, tasks }: { lesson: Lesson; tasks: Task[] }) {
  const started = tasks.some((task) => task.status !== "todo");
  return <section id="results" className={`lesson-state-contract scroll-mt-6 is-${started ? "doing" : "todo"}`} aria-labelledby="lesson-state-title"><div className="lesson-result-head"><div><div className="lesson-result-eyebrow">{learningLabels[lesson.learningStatus]} · practice tracked separately</div><h2 id="lesson-state-title">{started ? "Work has started. No result is saved yet." : lesson.learningStatus === "done" ? "Lesson learned. No practice result saved yet." : "No performed work is recorded yet."}</h2><p>Save the actual output, evidence and conclusion here. Learning progress alone does not prove that a task was completed or a change was applied.</p></div><span className="lesson-state-pill">{started ? "In progress" : "No saved result"}</span></div><div className="lesson-contract-grid"><article><div className="lesson-result-eyebrow">Purpose</div><h3>What this lesson should produce</h3><p>{lesson.desiredOutcome || "Define one desired outcome in your lesson record."}</p></article><article><div className="lesson-result-eyebrow">Proof of completion</div><h3>What will be saved here</h3><ul><li>The actual output and its date.</li><li>What happened, what did not happen, and limitations.</li><li>Evidence, a decision and the next step.</li></ul></article></div><div className="lesson-contract-actions"><div><span>My action brief</span><p className="whitespace-pre-wrap">{lesson.actionBrief || "No practice brief saved. Add your own brief below."}</p></div><a href="#lesson-editor">{lesson.actionBrief ? "Review my notes" : "Prepare the brief"} <span aria-hidden>→</span></a></div></section>;
}

function MissingCompletedResult({ lesson, tasks }: { lesson: Lesson; tasks: Task[] }) {
  return <section className="lesson-state-contract is-missing" aria-labelledby="missing-result-title"><div className="lesson-result-head"><div><div className="lesson-result-eyebrow">Completion check · current proof missing</div><h2 id="missing-result-title">Work is marked complete without a matching current result.</h2><p>The portal keeps this mismatch visible. Recover the real output and evidence for the current task brief or reopen the task. Earlier receipts remain historical evidence. This is separate from whether you understood the lesson.</p></div><span className="lesson-state-pill is-warning">Needs repair</span></div><div className="lesson-contract-grid"><article><div className="lesson-result-eyebrow">Expected purpose</div><h3>{lesson.desiredOutcome || "No desired outcome recorded."}</h3></article><article><div className="lesson-result-eyebrow">Missing proof</div><ul>{tasks.map((task) => <li key={task.id}>{task.title}</li>)}</ul></article></div><div className="lesson-contract-actions is-repair"><div><span>Required next step</span><strong>Attach a result to the current task brief or reopen its status.</strong><p>No external action is authorized by repairing a record.</p></div><a href="#save-result">Save the missing result <span aria-hidden>→</span></a></div></section>;
}

function CompletedResult({ result, primary = false }: { result: Result; primary?: boolean }) {
  const date = new Date(result.createdAt);
  const dateLabel = Number.isNaN(date.getTime()) ? "Date not recorded" : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return <section id={primary ? "results" : undefined} className="lesson-completed-result scroll-mt-6" aria-labelledby={`result-${result.id}`}><div className="lesson-result-head"><div><div className="lesson-result-eyebrow">Saved {result.kind} · record saved {dateLabel}</div><h2 id={`result-${result.id}`}>{result.title}</h2><p className="whitespace-pre-wrap">{result.summary || "No output summary recorded."}</p></div><span className="lesson-result-status">✓ Saved</span></div><div className="lesson-result-gates" aria-label="Saved lesson outputs"><article className={`lesson-result-gate is-${result.evidence ? "prepared" : "not-performed"}`}><div className="lesson-result-gate-head"><span>Evidence</span><strong>{result.evidence ? "Member record saved" : "Not supplied"}</strong></div><p>{result.evidence ? "Inspect the supporting evidence below. A saved record is not independent verification." : "No supporting evidence has been attached to this record."}</p></article><article className="lesson-result-gate is-prepared"><div className="lesson-result-gate-head"><span>Record type</span><strong>{result.kind}</strong></div><p>{result.kind === "implementation" ? "The member recorded an implementation. This page did not perform or verify an external change." : "This result does not claim that an external change was implemented."}</p></article></div><div className="lesson-result-decision"><div className="lesson-result-eyebrow">Decision from this task</div><p className="whitespace-pre-wrap">{result.decision || "No decision recorded."}</p></div>{result.nextAction ? <div className="lesson-result-next-action"><div><span>Next action</span><strong>{result.nextAction}</strong><p>Review the scope before taking another action.</p></div><a href="#lesson-codex-composer">Prepare a follow-up prompt <span aria-hidden>→</span></a></div> : null}<details className="lesson-result-evidence"><summary><span>Evidence and limitations</span><small>Open details</small></summary><div><p className="whitespace-pre-wrap">{result.evidence || "No evidence supplied. Missing evidence is unknown, not a zero result."}</p><p>Read the output and evidence together for what was not performed and any limits on the conclusion.</p></div></details></section>;
}

function LessonEditor({ lesson, isNew = false }: { lesson: Lesson; isNew?: boolean }) {
  return <details id="lesson-editor" className="rm-form mt-5 scroll-mt-6" open={isNew}><summary>{isNew ? "Create my lesson record" : "Edit my notes, source claims and action brief"}</summary><form action={saveLesson} className="rm-form"><input type="hidden" name="id" value={lesson.id} /><input type="hidden" name="learningStatus" value={lesson.learningStatus} /><Field label="Lesson title" name="title" value={lesson.title} required /><Field label="Course name" name="course" value={lesson.course} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Order in my course path" name="order" value={String(lesson.order)} type="number" /><Field label="URL name (leave blank to generate)" name="slug" value={lesson.slug} /></div><Field label="Private source bookmark (optional)" name="sourceUrl" value={lesson.sourceUrl} type="url" /><Field label="My short summary" name="summary" value={lesson.summary} multiline /><Field label="The result I want" name="desiredOutcome" value={lesson.desiredOutcome} multiline /><Field label="My own lesson notes" name="notes" value={lesson.notes} multiline /><Field label="My notes on explicit source claims" name="claims" value={lesson.claims} multiline /><Field label="My interpretation or inference" name="inference" value={lesson.inference} multiline /><Field label="One practice action brief — scope, inputs, limits, deliverable and review checks" name="actionBrief" value={lesson.actionBrief} multiline /><p className="text-xs leading-5 text-[var(--muted)]">Write your own notes. Do not paste paid transcripts, course attachments or other members’ private replies. No public copy or external action is created by saving this record.</p><button className="rm-button" type="submit">{isNew ? "Create lesson" : "Save my lesson record"}</button></form></details>;
}

function TaskRecord({ task, hasReceipt }: { task: Task; hasReceipt: boolean }) {
  return <><strong>{task.title}</strong><p className="mt-1 whitespace-pre-wrap">{task.instructions || "No task instructions saved."}</p><p className="mt-1 text-xs text-[var(--muted)]">Owner: {task.owner || "Not assigned"}</p><form action={setTaskStatus} className="rm-form mt-3"><input type="hidden" name="lessonId" value={task.lessonId} /><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="id" value={task.id} /><label className="rm-field"><span>Work status for {task.title}</span><select name="status" defaultValue={task.status}>{Object.entries(taskLabels).map(([value, label]) => <option key={value} value={value} disabled={value === "done" && !hasReceipt}>{label}</option>)}</select></label>{!hasReceipt ? <p className="text-xs text-[var(--muted)]">Save a result with evidence for this task’s current title and instructions before marking its work complete. An earlier brief’s receipt does not complete the revised task.</p> : null}<button className="rm-button" type="submit">Save work status</button></form><details className="rm-form mt-3"><summary>Edit this task</summary><TaskEditor lessonId={task.lessonId} task={task} /></details></>;
}

function TaskEditor({ lessonId, task }: { lessonId: string; task?: Task }) {
  return <form action={saveTask} className="rm-form"><input type="hidden" name="id" value={task?.id ?? ""} /><input type="hidden" name="lessonId" value={lessonId} /><input type="hidden" name="status" value={task?.status ?? "todo"} /><Field label="Task title" name="title" value={task?.title ?? ""} required /><Field label="Instructions, scope and review checks" name="instructions" value={task?.instructions ?? ""} multiline /><Field label="Owner (optional)" name="owner" value={task?.owner ?? ""} /><button className="rm-button" type="submit">{task ? "Save task changes" : "Add practice task"}</button></form>;
}

function ResultEditor({ lessonId, tasks }: { lessonId: string; tasks: Task[] }) {
  return <form action={saveResult} className="rm-form"><input type="hidden" name="id" value="" /><input type="hidden" name="lessonId" value={lessonId} /><Field label="Result title" name="title" value="" required /><label className="rm-field"><span>Related practice task</span><select name="taskId" defaultValue=""><option value="">Lesson-level result · no linked task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><label className="rm-field"><span>What kind of result is this?</span><select name="kind" defaultValue="preparation"><option value="preparation">Preparation</option><option value="measurement">Measurement</option><option value="implementation">Implementation actually performed</option></select></label><p className="text-xs text-[var(--muted)]">The receipt records when it is saved. Include the date of the work or observation in the output if different.</p><Field label="Saved output — what was done, when, and what was NOT performed" name="summary" value="" multiline required /><Field label="Evidence and limitations — mark unknowns explicitly" name="evidence" value="" multiline required /><Field label="Decision and why" name="decision" value="" multiline required /><Field label="One next action (or explain why none is needed)" name="nextAction" value="" multiline /><button className="rm-button" type="submit">Save result receipt</button></form>;
}

function ReviewEditor({ lessonId }: { lessonId: string }) {
  return <form action={saveReview} className="rm-form"><input type="hidden" name="id" value="" /><input type="hidden" name="lessonId" value={lessonId} /><Field label="Proposal title" name="title" value="" required /><Field label="Exact proposed change and scope" name="proposal" value="" multiline required /><Field label="Evidence and remaining uncertainties" name="evidence" value="" multiline /><Field label="Rollback or correction plan" name="rollback" value="" multiline /><label className="rm-field"><span>Proposal state</span><select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="review">Ready for review</option></select></label><button className="rm-button" type="submit">Save review proposal</button></form>;
}

function Field({ label, name, value, type = "text", multiline = false, required = false }: { label: string; name: string; value: string; type?: string; multiline?: boolean; required?: boolean }) {
  return <label className="rm-field"><span>{label}</span>{multiline ? <textarea name={name} defaultValue={value} rows={4} required={required} /> : <input name={name} type={type} defaultValue={value} required={required} min={type === "number" ? 0 : undefined} />}</label>;
}

function ListCard({ eyebrow, title, items, empty = "Nothing recorded yet.", tone }: { eyebrow: string; title: string; items: string[]; empty?: string; tone: "neutral" | "green" | "red" | "yellow" | "blue" }) {
  return <Card><div className="flex items-center justify-between gap-3"><div className="text-xs font-black uppercase text-[var(--muted)]">{eyebrow}</div><Badge tone={tone}>{items.length} items</Badge></div><h2 className="mt-1 text-xl font-black">{title}</h2>{items.length ? <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">{items.map((item, index) => <li key={`${index}-${item}`} className="flex gap-2"><span className="font-black text-[var(--accent)]">•</span><span>{item}</span></li>)}</ul> : <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{empty}</p>}</Card>;
}
