export type LearningStatus = "todo" | "doing" | "done";
export type TaskStatus = "todo" | "doing" | "review" | "done";
export type Settings = {
  memberName: string; projectName: string; siteUrl: string; goal: string;
  codexThreadId: string; communityUrl: string;
};
export type Lesson = {
  id: string; slug: string; title: string; course: string; order: number;
  summary: string; sourceUrl: string; notes: string; claims: string;
  inference: string; actionBrief: string; desiredOutcome: string;
  learningStatus: LearningStatus;
};
export type Task = {
  id: string; lessonId: string; title: string; instructions: string;
  owner: string; status: TaskStatus;
};
export type Result = {
  id: string; lessonId: string; taskId: string; taskHash: string; title: string; summary: string;
  decision: string; evidence: string; nextAction: string;
  kind: "preparation" | "measurement" | "implementation"; createdAt: string;
};
export type ReviewItem = {
  id: string; lessonId: string; title: string; proposal: string;
  evidence: string; rollback: string;
  status: "draft" | "review" | "accepted";
  acceptedHash: string; acceptedAt: string;
};
export type Workspace = {
  schemaVersion: 1; settings: Settings; lessons: Lesson[];
  tasks: Task[]; results: Result[]; reviews: ReviewItem[];
};
