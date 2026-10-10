# Initial release verification — 10 October 2026

This is the sanitised actual interface, not a replacement design.

- Original Rainmakers CSS and shared shell/card/badge/navigation presentation retained.
- Today, lesson companion/result contracts, execution cards and review flow
  adapted from the actual application. Private data imports and embedded owner
  history removed; fresh storage and member-editing controls added.
- Four empty lesson-title bookmarks; no shipped course knowledge or evidence.
- Dedicated dependency install succeeded from package-lock.json.
- Type check passed; 15 focused record/approval tests passed.
- Production build passed; all ten app/API route checks returned HTTP 200.
- Browser-verified: project setup persists; lesson notes and action brief save;
  task creation; a result linked to its exact task; task completion only after
  evidence; lesson status independent of task status; assistant prompt copy;
  exact proposal acceptance and material edit returning it to review.
- Browser-verified mobile navigation at 390 × 844; Today and execution views
  had no horizontal overflow. Original app layout and styling visually checked.
- JSON export endpoint and validated CLI backup/restore round trip passed.
  Previous database files are retained during CLI restore. Test records were
  backed up outside the distribution and removed from the review preview.
- Distribution privacy scan passes for the explicit 40-file allowlist. Separate
  manual source review found no inherited business names, private paths, chat
  IDs, credentials, deployment receipts or course substance. Runtime files,
  screenshots and all existing repository history are excluded.

Limits: tested locally on macOS with Node 22, not on every OS/browser. Optional
Codex routing was not opened because no member chat was configured. No external
assistant API, Skool access, live releases or tracking integrations were tested
or connected. The UI backup download was checked through its HTTP response and
contents; no claim is made about a native browser download dialog. Large-file
evidence belongs outside the 1 MB structured workspace.

These application checks were performed before repository publication. The owner
subsequently approved publishing the clean source to a new public repository.
No hosted app deployment or community post is included in that approval. No real
business sites, tracking configuration, accounts or source scanners were changed.
The optional Codex deep-link route is unconfigured and not a universal AI API.
