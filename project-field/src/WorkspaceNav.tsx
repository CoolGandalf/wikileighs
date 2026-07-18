import type { ReactNode } from "react";

const links = [
  { id: "projects", label: "Projects", href: "#/" },
  { id: "agents", label: "Agents", href: "#/agents" },
  { id: "tools", label: "Tools", href: "#/tools" },
  { id: "skills", label: "Skills", href: "#/skills" },
  { id: "knowledge", label: "Knowledge", href: "#/knowledge" },
];

export function WorkspaceNav({ active, action }: { active: string; action?: ReactNode }) {
  return (
    <header className="topbar workspace-topbar">
      <a className="brand" href="#/" aria-label="Leigh's workspace home">
        <span className="brand-mark">L</span>
        <span>PROJECT / FIELD</span>
      </a>
      <nav className="workspace-nav" aria-label="Workspace sections">
        {links.map((link) => (
          <a className={active === link.id ? "active" : ""} href={link.href} key={link.id}>{link.label}</a>
        ))}
      </nav>
      <div className="topbar-actions">
        <span className="local-badge"><i /> Protected WikiLeighs</span>
        {action}
      </div>
    </header>
  );
}
