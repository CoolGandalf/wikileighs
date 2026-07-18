import { useMemo, useState } from "react";
import { WorkspaceNav } from "./WorkspaceNav";

export type DirectorySection = { label: string; items: string[] };

export type DirectoryItem = {
  id: string;
  name: string;
  eyebrow: string;
  status: string;
  group: string;
  summary: string;
  tags: string[];
  metric: string;
  detail: string;
  color: string;
  sections: DirectorySection[];
  source?: string;
};

type DirectoryPageProps = {
  active: "agents" | "tools" | "skills" | "knowledge";
  kicker: string;
  title: string;
  accent: string;
  description: string;
  items: DirectoryItem[];
  statLabel: string;
  note: string;
};

export function DirectoryPage({ active, kicker, title, accent, description, items, statLabel, note }: DirectoryPageProps) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const groups = useMemo(() => ["All", ...Array.from(new Set(items.map((item) => item.group))).sort()], [items]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.name} ${item.eyebrow} ${item.status} ${item.group} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
      return (group === "All" || item.group === group) && (!needle || haystack.includes(needle));
    });
  }, [group, items, query]);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const activeCount = items.filter((item) => /active|live|connected|installed|ready/i.test(item.status)).length;

  return (
    <main className="app-shell directory-shell" style={{ "--page-accent": accent } as React.CSSProperties}>
      <WorkspaceNav active={active} />

      <section className="directory-hero">
        <div>
          <p className="kicker">{kicker}</p>
          <h1>{title}<em>.</em></h1>
          <p>{description}</p>
        </div>
        <div className="directory-stats">
          <div><strong>{items.length}</strong><span>{statLabel}</span></div>
          <div><strong>{activeCount}</strong><span>ready now</span></div>
          <div><strong>{groups.length - 1}</strong><span>families</span></div>
        </div>
      </section>

      <section className="directory-controls" aria-label={`${title} filters`}>
        <label className="search-field">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}, capabilities, tags…`} aria-label={`Search ${title.toLowerCase()}`} />
        </label>
        <div className="filter-pills" role="group" aria-label="Filter by family">
          {groups.map((item) => <button className={group === item ? "active" : ""} onClick={() => setGroup(item)} key={item}>{item}</button>)}
        </div>
        <span className="result-count">{filtered.length} visible</span>
      </section>

      <section className="directory-grid" aria-label={`${title} directory`}>
        {filtered.map((item, index) => (
          <article className="directory-card" key={item.id} onClick={() => setSelectedId(item.id)} tabIndex={0} role="button" onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setSelectedId(item.id);
          }} aria-label={`Open details for ${item.name}`}>
            <div className="directory-card-index" style={{ color: item.color }}>{String(index + 1).padStart(2, "0")}</div>
            <div className="directory-card-top"><span className="area-pill">{item.group}</span><span className="status-label"><i style={{ background: item.color }} />{item.status}</span></div>
            <p className="directory-eyebrow">{item.eyebrow}</p>
            <h2>{item.name}</h2>
            <p className="directory-summary">{item.summary}</p>
            <div className="tag-row">{item.tags.slice(0, 4).map((tag) => <span key={tag}>#{tag}</span>)}</div>
            <div className="directory-card-foot"><span>{item.metric}</span><b>Open file →</b></div>
          </article>
        ))}
        {filtered.length === 0 && <div className="directory-empty"><strong>Nothing found.</strong><span>Try a different search or family.</span></div>}
      </section>

      <footer className="directory-footer"><span><i /> {note}</span><p>Click any card for the full operating brief</p></footer>

      {selected && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedId(null); }}>
          <aside className="drawer directory-drawer" role="dialog" aria-modal="true" aria-labelledby="directory-drawer-title">
            <button className="close-button" onClick={() => setSelectedId(null)} aria-label="Close details">×</button>
            <p className="drawer-kicker">{selected.group.toUpperCase()} / {selected.status.toUpperCase()}</p>
            <p className="directory-drawer-eyebrow">{selected.eyebrow}</p>
            <h2 id="directory-drawer-title">{selected.name}</h2>
            <p className="directory-drawer-summary">{selected.detail}</p>
            <div className="drawer-meta"><span>{selected.metric}</span>{selected.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
            <div className="directory-sections">
              {selected.sections.map((section) => (
                <section key={section.label}>
                  <h3>{section.label}</h3>
                  <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
              ))}
            </div>
            {selected.source && <div className="path-block"><span>SOURCE OF TRUTH</span><code>{selected.source}</code></div>}
          </aside>
        </div>
      )}
    </main>
  );
}
