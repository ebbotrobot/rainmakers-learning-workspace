"use client";
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return <section className="lesson-state-contract is-missing"><div className="lesson-result-eyebrow">Could not save</div><h1>Please check the record</h1><p>{process.env.NODE_ENV === "development" ? error.message : "Check required fields, valid links and unique lesson names. A completed task needs a saved result with evidence; accepting work requires a proposal, evidence and rollback."}</p><button className="rm-button" onClick={reset}>Back to the workspace</button></section>;
}
