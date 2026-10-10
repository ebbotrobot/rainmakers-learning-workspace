import Link from "next/link";
import { readWorkspace } from "../../../lib/workspace";
import { saveSettings, importWorkspace } from "../actions";
export const dynamic = "force-dynamic";
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; restored?: string }> }) {
  const { settings } = readWorkspace();
  const query = await searchParams;
  return <div className="simple-home">
    <header className="simple-home-head"><div className="workspace-eyebrow">Your workspace</div><h1>Make it yours</h1><p>Same classroom. Your project, your notes, your assistant.</p></header>
    {query.saved || query.restored ? <p className="rm-notice" role="status">{query.restored ? "Workspace restored." : "Settings saved."} <Link href="/rainmakers">Back to Today →</Link></p> : null}
    <section className="money-map-section"><div className="money-map-section-head"><div><span>One-time setup</span><h2>Project and assistant</h2></div></div>
      <form action={saveSettings} className="rm-form">
        <div className="rm-fields"><label>Your name<input name="memberName" defaultValue={settings.memberName} maxLength={100}/></label><label>Project name<input name="projectName" defaultValue={settings.projectName} required maxLength={160}/></label></div>
        <label>Website (optional)<input type="url" name="siteUrl" defaultValue={settings.siteUrl} placeholder="https://example.com"/></label>
        <label>What do you want to achieve?<textarea name="goal" defaultValue={settings.goal} rows={3} placeholder="A specific outcome you can measure"/></label>
        <label>Community link<input type="url" name="communityUrl" defaultValue={settings.communityUrl}/></label>
        <details><summary>Optional: open lesson prompts in one Codex chat</summary><div className="rm-form"><label>Existing Codex chat ID<input name="codexThreadId" defaultValue={settings.codexThreadId} pattern="[a-zA-Z0-9-]{10,80}" placeholder="Leave blank to use any assistant"/></label><p>Use a chat ID from your own Codex desktop app. This is an optional local deep link, not an API connection. It may depend on your app version; the prompt is always available to copy. Review and send it yourself. No API key, login cookie or session is needed here.</p></div></details>
        <button className="rm-button" type="submit">Save workspace</button>
      </form>
    </section>
    <section className="money-map-section"><div className="money-map-section-head"><div><span>How to use it</span><h2>One lesson, one useful result</h2></div></div><ol className="rm-steps"><li>Watch a lesson in your own authorised course account.</li><li>Add your notes and the source link on its lesson page.</li><li>Use the assistant box to learn, plan, or prepare a bounded task.</li><li>Save the result and evidence on that same page.</li><li>Review exact changes here. Live action needs a separate, current approval in your execution tool.</li></ol><p>This unofficial workspace does not contain the paid course, fetch videos, connect to Skool or automatically execute a prompt. No telemetry is installed.</p></section>
    <details className="simple-disclosure"><summary><div><span>Private data</span><strong>Backup and restore</strong><small>Backups contain your own notes, project details and results. Keep them private.</small></div><b>Open ↓</b></summary><div className="rm-form rm-padded">
      <a className="rm-button" href="/api/workspace" download>Download private backup</a>
      <p>The app stores your workspace in its own local data folder. Export before replacing it. A restore replaces this workspace, not your website. Records are limited to 1 MB; keep large evidence files outside the app and record their paths. The README includes recovery instructions if the app cannot open your data.</p>
      <form action={importWorkspace} className="rm-form"><label>Paste a workspace JSON backup<textarea name="workspace" rows={6} required maxLength={2000000} spellCheck={false}/></label><label>Type REPLACE to confirm<input name="confirmation" required pattern="REPLACE" autoComplete="off"/></label><button className="rm-button secondary" type="submit">Restore this backup</button></form>
    </div></details>
  </div>;
}
