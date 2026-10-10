import { readWorkspace } from "../../../lib/workspace";
export const dynamic = "force-dynamic";
export async function GET() {
  return new Response(JSON.stringify(readWorkspace(), null, 2), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Content-Disposition": 'attachment; filename="rainmakers-workspace-private.json"' } });
}
