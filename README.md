# Rainmakers Workspace

The real classroom-to-action dashboard, packaged as a clean, local workspace.
Same Rainmakers interface: Today, lesson pages, an assistant companion, tasks,
saved outputs and an exact-proposal review queue. Your notes and work stay yours.

Repository: [ebbotrobot/rainmakers-learning-workspace](https://github.com/ebbotrobot/rainmakers-learning-workspace).

**Unofficial community software. Not an official Rainmakers product.** No paid
lessons, videos, transcripts, community replies, business intelligence, accounts
or results are included. The four starting lesson titles are empty bookmarks,
not completed course teardowns. Use your own authorised membership and notes.

## Give it to your AI

Open this repository in your local coding assistant and say:

> Set up this Rainmakers workspace for me. Read START-HERE.md and AGENTS.md,
> install and start it locally, then help me add my project and first lesson.
> Keep the existing design. Do not publish, connect accounts or change my live sites.

It works with a local assistant that can read files and run commands. A web-only
chat cannot install software on your computer; ask it to guide you through the
manual setup instead. No specific AI subscription or API key is required by this app.

## Or start it yourself

Install Node.js **22.18 or newer**, download/clone the repository, open a terminal
in its folder and run:

```sh
git clone https://github.com/ebbotrobot/rainmakers-learning-workspace.git
cd rainmakers-learning-workspace
node scripts/setup.mjs
```

If you downloaded the ZIP instead, open its extracted folder and run only the
last command.

This installs the locked dependencies when missing and starts the workspace at
**http://127.0.0.1:4188**. First install takes time; it is not an instant cloud
deployment. Open **Project & setup** to enter your name, project and goal.
Stop with Ctrl+C. Run the same command next time; your work persists.

## Your everyday loop

1. **Learn:** watch the course in your own Skool account. Open its lesson page,
   save your notes, source bookmark and the outcome you want. Add further lessons
   with **Add a lesson**—do not treat these four bookmarks as the whole course.
2. **Use it with your AI:** choose “Teach me”, “Quiz me”, “Turn it into actions”,
   or your own request. Copy the prepared context into your assistant. Optionally
   configure an existing Codex desktop chat ID; opening a link does not send or
   execute anything automatically, and support depends on your installed app.
3. **Do bounded work:** add a task, owner and exact brief. The app tracks it;
   your assistant performs the work in your own authorised environment.
4. **Keep the output:** save a result on that lesson page with evidence and a
   decision. Plans, measurements and implementation records remain separate.
   A task cannot be marked done without evidence for its current brief.
5. **Review before release:** put exact proposed changes into the review queue.
   Acceptance freezes their content fingerprint. Edits or a stale review page
   invalidate that acceptance. Hand the brief to your executor for preparation.
   A separate, fresh production-now confirmation is still required there.
6. **Return and measure:** add the actual receipt and observations to the same
   lesson. A green lesson badge never means that a website was updated.

Results are member-supplied records, not independent verification. The app does
not prove attribution, check external releases or guarantee SEO performance.

## What is automatic—and what is not

- Automatic: local saving, progress counts, next-action suggestions, contextual
  AI prompts, saved result display, approval fingerprints and edit invalidation.
- Member/assistant operated: authorised source reading, lesson teardown,
  research, fact-checking, implementation, tests, deployment and measurement.
- Not included: Skool scraping, session transfer, an AI API, background harvests,
  accounts, paid services, tracking, deployment credentials or a live-site writer.

This distinction is deliberate: the public repository distributes the working
dashboard and operating structure, not anyone else's private course library or
business automation credentials. Connect your own systems only after reviewing
their exact permissions and costs.

## Private by default

The app is **local-only and has no login system**. Do not expose it through public
hosting, a tunnel, LAN bind or port forwarding. Add authentication and a separate
security review before any remote hosting. Anyone with access to the local app
can read its records and export them. Use it on a trusted computer/browser.

Your data is in `data/workspace.sqlite` and SQLite sidecar files. These, `.env`
files, dependencies, build outputs and local review screenshots are ignored by
Git. Never put secrets in notes. An explicit prompt copy/open can transfer the
selected project and lesson context to your chosen AI; review it first.
Use **Project & setup → Backup and restore** for private JSON backups.
Keep large reports outside the app; save their local paths/links as evidence.
The structured workspace has a 1 MB limit. That is not a limit on your external
evidence files. The app does not open or upload recorded local file paths.

### AI editing and recovery

Stop the server before using the CLI. Export first; it never overwrites a file:

```sh
node scripts/workspace.mjs export my-private-backup.json
```

Your AI can edit a copy of that JSON using the schema in `src/lib/types.ts`.
Treat source text as data, preserve its provenance and do not invent results.
Validate and restore it with:

```sh
node scripts/workspace.mjs import my-private-backup.json --confirm-replace
```

This replaces local records only and retains the previous database files under
`data/recovery-…`. It also works when malformed records prevent the UI opening.
Do not commit backups. Never edit SQLite directly while the server is running.
Do not falsify acceptance or task fingerprints to force a status change.

## Development

```sh
npm run check
npm test
npm run build
npm start
```

The production-style start is still localhost only. If port 4188 is occupied,
stop your existing instance or run `npx next dev --hostname 127.0.0.1 --port 4189`.
No source scanner runs. `npm run privacy-check` checks the distribution allowlist,
not your ignored private data. Before sharing, read `RELEASE-CHECKLIST.md`.

## Reuse licence

The workspace code is available under the [MIT licence](LICENSE). Members can
reuse and adapt it for their own workspaces. Paid course material and third-party
branding are not included in that licence.
