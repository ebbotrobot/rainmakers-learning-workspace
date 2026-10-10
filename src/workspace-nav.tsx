"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { label: string; href: string; mark: string };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Operate",
    items: [
      { label: "Today", href: "/rainmakers", mark: "01" },
      { label: "Execution & results", href: "/rainmakers/execution-sync", mark: "EX" },
      { label: "Review queue", href: "/rainmakers/content-review", mark: "RQ" },
    ],
  },
  {
    label: "Learn",
    items: [
      { label: "Course path", href: "/rainmakers#foundation-title", mark: "CP" },
      { label: "Add a lesson", href: "/rainmakers/new", mark: "+" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Project & setup", href: "/rainmakers/settings", mark: "ST" },
    ],
  },
];

function isCurrent(pathname: string, href: string) {
  if (href.includes("#")) return false;
  const path = href.split("#")[0];
  if (path === "/rainmakers") return pathname === path;
  if (path === "/") return pathname === "/";
  return pathname.startsWith(path);
}

export function WorkspaceNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = groups.flatMap((group) => group.items).find((item) => isCurrent(pathname, item.href));

  return (
    <>
      <header className="workspace-mobilebar">
        <Link href="/rainmakers" className="workspace-brand" aria-label="Rainmakers home">
          <span className="workspace-brandmark">R</span>
          <span>
            <strong>Rainmakers</strong>
            <small>{current?.label ?? "Learning workspace"}</small>
          </span>
        </Link>
        <button className="workspace-menubutton" type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="workspace-mobile-menu">
          Menu
          <span aria-hidden>☰</span>
        </button>
      </header>

      {open ? <button className="workspace-scrim" aria-label="Dismiss navigation overlay" onClick={() => setOpen(false)} /> : null}
      <aside id="workspace-mobile-menu" className={`workspace-sidebar ${open ? "is-open" : ""}`}>
        <div className="workspace-sidebar-top">
          <Link href="/rainmakers" className="workspace-brand" onClick={() => setOpen(false)}>
            <span className="workspace-brandmark">R</span>
            <span>
              <strong>Rainmakers</strong>
              <small>Learning → action → evidence</small>
            </span>
          </Link>
          <button className="workspace-close" type="button" onClick={() => setOpen(false)} aria-label="Close navigation">×</button>
        </div>

        <nav className="workspace-nav" aria-label="Workspace navigation">
          {groups.map((group) => (
            <div className="workspace-navgroup" key={group.label}>
              <div className="workspace-navlabel">{group.label}</div>
              {group.items.map((item) => {
                const active = isCurrent(pathname, item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`workspace-navlink ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
                    <span className="workspace-navmark">{item.mark}</span>
                    <span>{item.label}</span>
                    {active ? <span className="workspace-navdot" aria-hidden /> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="workspace-safety">
          <span className="workspace-safety-dot" />
          <div><strong>Private workspace</strong><small>Live changes stay gated</small></div>
        </div>
      </aside>
    </>
  );
}
