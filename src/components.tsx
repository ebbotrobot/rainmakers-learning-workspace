import { WorkspaceNav } from "./workspace-nav";
const cls = (...values: Array<string | undefined>) => values.filter(Boolean).join(" ");

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-shell">
      <WorkspaceNav />
      <main className="workspace-main">
        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 border-b border-[var(--line)] pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <div className="text-xs font-bold uppercase text-[var(--accent)]">{eyebrow}</div> : null}
        <h1 className="text-3xl font-black text-[var(--ink)]">{title}</h1>
      </div>
      {children ? <div className="text-sm text-[var(--muted)]">{children}</div> : null}
    </header>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cls("rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[0_1px_2px_rgba(17,22,41,0.035)]", className)}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "red" | "yellow" | "blue" }) {
  const tones = {
    neutral: "bg-[var(--panel-2)] text-[var(--muted)]",
    green: "bg-emerald-500/10 text-[#087f5b]",
    red: "bg-red-500/10 text-[#cf304a]",
    yellow: "bg-yellow-500/10 text-[#a86205]",
    blue: "bg-blue-500/10 text-[#2563c7]",
  };
  return <span className={cls("inline-flex rounded px-2 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}

export function Tags({ value }: { value: string | string[] | null | undefined }) {
  const tags = Array.isArray(value) ? value : (value || "").split(",").map(tag => tag.trim()).filter(Boolean);
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 8).map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </div>
  );
}

export function Risk({ value }: { value: string }) {
  const tone = value === "extreme" || value === "high" ? "red" : value === "medium" ? "yellow" : value === "low" ? "green" : "neutral";
  return <Badge tone={tone}>{value}</Badge>;
}
