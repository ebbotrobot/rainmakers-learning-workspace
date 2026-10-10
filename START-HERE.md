# AI setup instructions

Build from the app in this repository. **Do not redesign or replace it.**

1. Read AGENTS.md, README.md and package.json. Inspect the local tools available.
2. Check Node is at least 22.18. Use the locked install (`npm ci`) and start the
   existing app with `node scripts/setup.mjs`. Keep it on 127.0.0.1. Do not create
   a cloud deployment or ask for credentials to get the local app working.
3. Open the running page and verify Today, a lesson, execution and review load.
4. Ask only for the member's project name, website (optional) and desired goal.
   Save them in Project & setup. Preserve the existing design and component CSS.
5. Help the member watch their first course lesson in their own authorised
   account. Ask for their notes or an accessible source; do not copy a shared
   vault, retrieve DRM-protected media, transfer login sessions or assume access.
6. Populate the lesson's notes, explicit source claims, our inference, desired
   output and exact action brief. Cite privately. Never fabricate video coverage.
7. Teach → check understanding → prepare → review. Create one useful task,
   perform only authorised bounded work, and save the actual result/evidence.
   Use the app or the validated export/import CLI; no raw SQLite mutation.
8. If a live action is desired, review the exact target and current tracking,
   prepare preview/tests/rollback, then ask separately for production-now approval
   in the executing chat. Dashboard acceptance and historical permissions are
   not that approval. This repository has no deployment engine.
9. Update the private .agent records with decisions and evidence paths. Keep
   them and all new member data out of any public distribution.

No API key is necessary. The assistant box prepares portable prompts. Optional
Codex routing uses the member's own chat ID and may depend on their app version;
the copyable prompt remains the fallback. Never populate someone else's ID.

Completion means the original interface works locally, member setup is saved,
the first lesson can be used, and the member knows how to save a real result.
Do not report actual course implementation, live changes or measured gains
unless independently supported by evidence from that member's environment.
