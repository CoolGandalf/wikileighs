import { FormEvent, useEffect, useMemo, useState } from "react";
import { WorkspaceNav } from "./WorkspaceNav";

type Status = "now" | "next" | "watching" | "shipped";
type Priority = "high" | "medium" | "low";

type Project = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  area: string;
  tags: string[];
  nextStep: string;
  progress: number;
  updated: string;
  source: string;
  path?: string;
};

const STORAGE_KEY = "leigh-project-board-v1";

const columns: { id: Status; eyebrow: string; title: string; description: string; accent: string }[] = [
  { id: "now", eyebrow: "01", title: "In focus", description: "The work getting attention now", accent: "#ff6b4a" },
  { id: "next", eyebrow: "02", title: "Up next", description: "Ready when a focus slot opens", accent: "#d9ff67" },
  { id: "watching", eyebrow: "03", title: "On radar", description: "Alive, but not pulling focus", accent: "#75bfff" },
  { id: "shipped", eyebrow: "04", title: "Shipped", description: "Built, live, or in maintenance", accent: "#be8cff" },
];

const seedProjects: Project[] = [
  {
    id: "vault",
    title: "Leigh Vault",
    description: "The Obsidian-based second brain and shared memory layer for projects, people, research, and agents.",
    status: "now",
    priority: "high",
    area: "Knowledge",
    tags: ["Obsidian", "AI", "LifeOS"],
    nextStep: "Finish the active vault setup and tighten multi-device continuity.",
    progress: 74,
    updated: "Jul 12",
    source: "Local activity + vault",
    path: "C:\\Users\\leigh\\projects\\vault",
  },
  {
    id: "bob",
    title: "Bob the Builder",
    description: "An agent that researches, designs, seeds, and installs complete specialist agents across Codex, Claude Code, and Hermes.",
    status: "now",
    priority: "high",
    area: "Agents",
    tags: ["Codex", "Claude", "Hermes"],
    nextStep: "Run the first full real-world build, then tune intake and research depth.",
    progress: 82,
    updated: "Jul 5",
    source: "STATUS.md",
    path: "C:\\Users\\leigh\\projects\\bob-the-builder",
  },
  {
    id: "malcolm",
    title: "Malcolm the Monarch",
    description: "A financial-planning agent layered on Monarch Money for reporting, portfolio review, allocation, and eventually tax optimization.",
    status: "now",
    priority: "high",
    area: "Finance",
    tags: ["Monarch", "Agents", "Python"],
    nextStep: "Add holdings to the CLI and ship the first /portfolio-review command.",
    progress: 46,
    updated: "May 2",
    source: "STATUS.md + vault",
    path: "C:\\Users\\leigh\\projects\\malcolm-the-monarch",
  },
  {
    id: "wikileighs",
    title: "WikiLeighs",
    description: "A fast, Wikipedia-styled reader for the vault with wikilinks, search, gap analysis, daily notes, and knowledge maps.",
    status: "next",
    priority: "medium",
    area: "Knowledge",
    tags: ["Astro", "Obsidian", "Web"],
    nextStep: "Choose a private deployment target and seed featured articles and photos.",
    progress: 78,
    updated: "Apr 17",
    source: "STATUS.md",
    path: "C:\\Users\\leigh\\projects\\wikileighs",
  },
  {
    id: "health",
    title: "Health Dashboard / Bones",
    description: "A personal training and recovery command center integrating Hevy, Oura, WHOOP, Notion, and coaching workflows.",
    status: "next",
    priority: "medium",
    area: "Health",
    tags: ["Next.js", "Hevy", "Oura"],
    nextStep: "Remove the debug endpoint, set the real dashboard password, and document the repo.",
    progress: 88,
    updated: "Apr 5",
    source: "STATUS.md + vault",
    path: "C:\\Users\\leigh\\projects\\health-dashboard",
  },
  {
    id: "house-elf",
    title: "Project House Elf",
    description: "Natural-language home control using OpenClaw and Home Assistant, with safe allowlists and six dependable core commands.",
    status: "next",
    priority: "medium",
    area: "Home",
    tags: ["Home Assistant", "OpenClaw"],
    nextStep: "Inventory devices, normalize entity IDs, and test the six v1 commands.",
    progress: 24,
    updated: "Mar 25",
    source: "Vault",
  },
  {
    id: "stoicbot",
    title: "StoicBot",
    description: "A swipe-based Stoic reading app built from 2,321 tagged passages across Marcus, Seneca, Epictetus, and others.",
    status: "next",
    priority: "low",
    area: "Learning",
    tags: ["React", "Reading", "Stoicism"],
    nextStep: "Build the concept graph, rank iconic passages, then scaffold the app.",
    progress: 35,
    updated: "Mar 27",
    source: "Vault",
  },
  {
    id: "men-kings",
    title: "Men & Kings",
    description: "The maximalist AI operating system for life: briefings, reminders, routing, synthesis, and proactive follow-through.",
    status: "watching",
    priority: "medium",
    area: "LifeOS",
    tags: ["OpenClaw", "Automation", "AI"],
    nextStep: "Reconfirm the high-leverage domains and the daily and weekly operating loops.",
    progress: 41,
    updated: "Mar 25",
    source: "Vault",
  },
  {
    id: "renaissance",
    title: "Renaissance Man",
    description: "A personal learning engine spanning history, philosophy, literature, rhetoric, art, religion, and political economy.",
    status: "watching",
    priority: "low",
    area: "Learning",
    tags: ["Learning", "Obsidian", "Writing"],
    nextStep: "Pick the first two domains and define one visible six-week output.",
    progress: 12,
    updated: "Mar 25",
    source: "Vault",
  },
  {
    id: "deck-picker",
    title: "Deck Picker",
    description: "A Codex skill that picks games from the owned Steam library based on mood, time, platform, and friction.",
    status: "shipped",
    priority: "low",
    area: "Gaming",
    tags: ["Codex", "Steam", "Skill"],
    nextStep: "Refresh the knowledge base after the next Steam library export.",
    progress: 100,
    updated: "Jul 5",
    source: "STATUS.md",
    path: "C:\\Users\\leigh\\projects\\deck-picker",
  },
  {
    id: "deal-agent",
    title: "Deal Agent",
    description: "A local deal command center with watchlists, scoring, stack calculations, scouting, and daily and weekly reports.",
    status: "shipped",
    priority: "low",
    area: "Utility",
    tags: ["Python", "Local-first", "Shopping"],
    nextStep: "Decide whether the scouting loop deserves a cloud automation pass.",
    progress: 92,
    updated: "Jun 27",
    source: "Local project",
    path: "C:\\Users\\leigh\\Documents\\Playground\\deal-agent",
  },
  {
    id: "keats",
    title: "Keats",
    description: "Tinder for poems: a polished PWA for swiping through 4,272 public-domain poems with weighted discovery and saved favorites.",
    status: "shipped",
    priority: "low",
    area: "Reading",
    tags: ["React", "PWA", "Poetry"],
    nextStep: "Add shareable poem links and improve error handling before the next feature wave.",
    progress: 94,
    updated: "Mar 26",
    source: "Vault",
  },
  {
    id: "lgl",
    title: "lgl.gg",
    description: "Leigh's minimal personal site and public home on the web, hosted through GitHub Pages on a custom domain.",
    status: "shipped",
    priority: "low",
    area: "Personal",
    tags: ["Web", "GitHub Pages"],
    nextStep: "Replace the Tailwind CDN and do a quick domain and mail-link health check.",
    progress: 97,
    updated: "Mar 25",
    source: "Vault",
    path: "C:\\Users\\leigh\\projects\\CoolGandalf.github.io",
  },
];

const emptyDraft = {
  title: "",
  description: "",
  status: "now" as Status,
  area: "Personal",
  nextStep: "",
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All areas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects, hydrated]);

  const areas = useMemo(
    () => ["All areas", ...Array.from(new Set(projects.map((project) => project.area))).sort()],
    [projects],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesArea = area === "All areas" || project.area === area;
      const haystack = `${project.title} ${project.description} ${project.area} ${project.tags.join(" ")}`.toLowerCase();
      return matchesArea && (!needle || haystack.includes(needle));
    });
  }, [projects, query, area]);

  const selected = projects.find((project) => project.id === selectedId) ?? null;
  const focusCount = projects.filter((project) => project.status === "now").length;
  const shippedCount = projects.filter((project) => project.status === "shipped").length;
  const averageProgress = Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length);

  function moveProject(id: string, status: Status) {
    setProjects((current) => current.map((project) => (project.id === id ? { ...project, status } : project)));
  }

  function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    const project: Project = {
      id: `${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title,
      description: draft.description.trim() || "A newly captured project ready to be shaped.",
      status: draft.status,
      priority: "medium",
      area: draft.area.trim() || "Personal",
      tags: ["New"],
      nextStep: draft.nextStep.trim() || "Define the next concrete action.",
      progress: 5,
      updated: "Today",
      source: "Added here",
    };
    setProjects((current) => [project, ...current]);
    setDraft(emptyDraft);
    setShowAdd(false);
    setSelectedId(project.id);
  }

  function updateSelected(patch: Partial<Project>) {
    if (!selectedId) return;
    setProjects((current) => current.map((project) => (project.id === selectedId ? { ...project, ...patch } : project)));
  }

  function resetBoard() {
    setProjects(seedProjects);
    setSelectedId(null);
    setQuery("");
    setArea("All areas");
  }

  return (
    <main className="app-shell">
      <WorkspaceNav active="projects" action={<button className="primary-button" onClick={() => setShowAdd(true)}><span>ï¼‹</span> Add project</button>} />

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker">LEIGH'S ACTIVE PROJECT SYSTEM · JULY 2026</p>
          <h1>Make the work<br /><em>visible.</em></h1>
          <p className="hero-description">A living view of everything in motion—seeded from your vault and the projects you’ve actually touched lately.</p>
        </div>
        <div className="stats" aria-label="Board summary">
          <div><strong>{focusCount}</strong><span>focus slots</span></div>
          <div><strong>{projects.length}</strong><span>projects tracked</span></div>
          <div><strong>{averageProgress}%</strong><span>overall motion</span></div>
          <div><strong>{shippedCount}</strong><span>shipped</span></div>
        </div>
      </section>

      <section className="controls" aria-label="Board controls">
        <label className="search-field">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, tags, tools…" aria-label="Search projects" />
          <kbd>/</kbd>
        </label>
        <label className="select-field">
          <span>AREA</span>
          <select value={area} onChange={(event) => setArea(event.target.value)} aria-label="Filter by area">
            {areas.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button className="text-button" onClick={resetBoard}>↺ Reset from vault</button>
        <div className="result-count">{filtered.length} visible</div>
      </section>

      <section className="board" aria-label="Project kanban board">
        {columns.map((column) => {
          const items = filtered.filter((project) => project.status === column.id);
          return (
            <section
              className={`column ${draggingId ? "is-dragging" : ""}`}
              key={column.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingId) moveProject(draggingId, column.id);
                setDraggingId(null);
              }}
            >
              <header className="column-header">
                <div>
                  <span className="column-number" style={{ color: column.accent }}>{column.eyebrow}</span>
                  <h2>{column.title}</h2>
                  <p>{column.description}</p>
                </div>
                <span className="column-count">{items.length}</span>
              </header>

              <div className="column-stack">
                {items.map((project) => (
                  <article
                    className={`project-card priority-${project.priority}`}
                    key={project.id}
                    draggable
                    onDragStart={() => setDraggingId(project.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => setSelectedId(project.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") setSelectedId(project.id);
                    }}
                    aria-label={`Open ${project.title}`}
                  >
                    <div className="card-topline">
                      <span className="area-pill">{project.area}</span>
                      <span className="drag-handle" aria-hidden="true">⠿</span>
                    </div>
                    <h3>{project.title}</h3>
                    <p className="card-description">{project.description}</p>
                    <div className="tag-row">
                      {project.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
                    </div>
                    <div className="next-action"><span>→</span><p>{project.nextStep}</p></div>
                    <div className="progress-track" aria-label={`${project.progress}% complete`}>
                      <i style={{ width: `${project.progress}%`, background: column.accent }} />
                    </div>
                    <footer className="card-footer">
                      <span>{project.progress}%</span>
                      <span>Updated {project.updated}</span>
                    </footer>
                  </article>
                ))}
                {items.length === 0 && (
                  <div className="empty-column"><span>ï¼‹</span><p>Drop a project here</p></div>
                )}
              </div>
            </section>
          );
        })}
      </section>

      <footer className="board-footer">
        <span><i /> Saved automatically in this browser</span>
        <p>Drag cards to move them · Click any card for details</p>
      </footer>

      {selected && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setSelectedId(null);
        }}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <button className="close-button" onClick={() => setSelectedId(null)} aria-label="Close project details">×</button>
            <p className="drawer-kicker">PROJECT DETAIL / {selected.source.toUpperCase()}</p>
            <input
              id="drawer-title"
              className="title-input"
              value={selected.title}
              onChange={(event) => updateSelected({ title: event.target.value })}
              aria-label="Project title"
            />
            <textarea className="description-input" value={selected.description} onChange={(event) => updateSelected({ description: event.target.value })} aria-label="Project description" />

            <div className="drawer-grid">
              <label><span>STATUS</span><select value={selected.status} onChange={(event) => updateSelected({ status: event.target.value as Status })}>{columns.map((column) => <option value={column.id} key={column.id}>{column.title}</option>)}</select></label>
              <label><span>PRIORITY</span><select value={selected.priority} onChange={(event) => updateSelected({ priority: event.target.value as Priority })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
              <label><span>AREA</span><input value={selected.area} onChange={(event) => updateSelected({ area: event.target.value })} /></label>
              <label><span>PROGRESS · {selected.progress}%</span><input type="range" min="0" max="100" value={selected.progress} onChange={(event) => updateSelected({ progress: Number(event.target.value) })} /></label>
            </div>

            <label className="next-step-field"><span>NEXT CONCRETE ACTION</span><textarea value={selected.nextStep} onChange={(event) => updateSelected({ nextStep: event.target.value })} /></label>

            <div className="drawer-tags">{selected.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
            {selected.path && <div className="path-block"><span>LOCAL HOME</span><code>{selected.path}</code></div>}
            <div className="drawer-note">Changes save instantly to this browser. Nothing leaves your machine.</div>
          </aside>
        </div>
      )}

      {showAdd && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setShowAdd(false);
        }}>
          <form className="add-modal" onSubmit={addProject} role="dialog" aria-modal="true" aria-labelledby="add-title">
            <button type="button" className="close-button" onClick={() => setShowAdd(false)} aria-label="Close add project">×</button>
            <p className="drawer-kicker">QUICK CAPTURE</p>
            <h2 id="add-title">Add a project</h2>
            <p>Capture the shape now. You can refine it from the board.</p>
            <label><span>PROJECT NAME</span><input autoFocus required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="What are you building?" /></label>
            <label><span>ONE-LINE BRIEF</span><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Why does this project exist?" /></label>
            <div className="form-row">
              <label><span>START IN</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Status })}>{columns.map((column) => <option value={column.id} key={column.id}>{column.title}</option>)}</select></label>
              <label><span>AREA</span><input value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })} /></label>
            </div>
            <label><span>NEXT ACTION</span><input value={draft.nextStep} onChange={(event) => setDraft({ ...draft, nextStep: event.target.value })} placeholder="The smallest useful next step" /></label>
            <button className="primary-button modal-submit" type="submit">Add to board <span>→</span></button>
          </form>
        </div>
      )}
    </main>
  );
}
