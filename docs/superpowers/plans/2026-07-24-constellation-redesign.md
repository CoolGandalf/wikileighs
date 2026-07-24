# WikiLeighs Constellation Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Wikipedia-pastiche UI with the approved dark "Constellation/Instrument" design — night-sky homepage, ⌘K palette, reading-room article pages — per `docs/superpowers/specs/2026-07-24-wikileighs-constellation-redesign-design.md`.

**Architecture:** Astro 5 SSG, all new behavior build-time or vanilla client JS. New pure logic lives in `src/lib/constellation.ts` (star positions, recency) and `src/lib/localsky.ts` (1-hop SVG), tested with the repo's existing `node --experimental-strip-types --test` pattern. Visual surfaces are `.astro` rewrites verified by `npm run build` page-count parity + screenshots. Data layer (`src/lib/vault.ts`) is **not modified**.

**Tech Stack:** Astro 5, Tailwind v3 (kept), `@fontsource/ibm-plex-mono` + `@fontsource/newsreader`, vanilla JS palette + canvas.

**Read the spec first.** Sections referenced as §N throughout. Spec §8 lists behaviors that must survive; the checklist in Task 12 is the gate.

---

### Task 1: Branch, fonts, design tokens

**Files:**
- Modify: `package.json` (add fontsource deps)
- Create: `src/styles/tokens.css`
- Modify: `src/styles/global.css:15-40` (`:root` block + html/body ground)

- [ ] **Step 1: Branch**

```bash
cd ~/Projects/wikileighs && git checkout -b redesign/constellation
```

- [ ] **Step 2: Install self-hosted fonts**

```bash
npm install @fontsource/ibm-plex-mono @fontsource/newsreader
```

- [ ] **Step 3: Create `src/styles/tokens.css`** (complete file)

```css
/* Constellation design tokens — spec §2. Single source of truth. */
:root {
  --ink: #0b0e14;
  --raised: #12161f;
  --lifted: #1a1f2b;
  --gold: #e8c66a;
  --gold-soft: rgba(232, 198, 106, 0.4);
  --gold-hairline: rgba(232, 198, 106, 0.18);
  --verdigris: #6fd3c7;
  --verdigris-soft: rgba(111, 211, 199, 0.35);
  --t-heading: #f2efe6;
  --t-body: #d5d2c8;
  --t-secondary: #b5b0a4;
  --t-muted: #8b93a5;
  --font-mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  --font-serif: "Newsreader", Georgia, serif;
}
/* Grain: every surface carries it via this utility (spec: nothing renders flat) */
.grain {
  background-image: radial-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px);
  background-size: 3px 3px;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 4: Wire fonts + new ground into `global.css`**

At the top of `src/styles/global.css`, after the three `@tailwind` lines, add:

```css
@import '@fontsource/ibm-plex-mono/400.css';
@import '@fontsource/ibm-plex-mono/500.css';
@import '@fontsource/ibm-plex-mono/600.css';
@import '@fontsource/newsreader/400.css';
@import '@fontsource/newsreader/400-italic.css';
@import '@fontsource/newsreader/500.css';
@import './tokens.css';
```

Replace the old `:root { --color-text: ... }` block's values so legacy selectors keep working during the migration (old vars → new palette):

```css
:root {
  --color-text: var(--t-body);
  --color-muted: var(--t-muted);
  --color-link: var(--gold);
  --color-link-visited: var(--gold);
  --color-link-broken: var(--t-muted);
  --color-border: var(--gold-hairline);
  --color-border-light: rgba(139, 147, 165, 0.2);
  --color-bg: var(--ink);
  --color-rail: var(--raised);
  --color-infobox: var(--raised);
  --color-accent: var(--gold);
  --color-accent-dark: var(--gold);
  --color-chrome: var(--raised);
  --font-serif: "Newsreader", Georgia, serif;
  --font-sans: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
html { background: var(--ink); }
body { color: var(--t-body); font-family: var(--font-mono); font-size: 14px; line-height: 1.6; }
```

- [ ] **Step 5: Build must stay green**

Run: `npm run build`
Expected: completes; same page count as `main` (note the "N page(s) built" number — record it, Task 12 asserts against it). Site will look half-migrated — fine.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/styles/tokens.css src/styles/global.css
git commit -m "feat(redesign): tokens, fonts, dark ground (Task 1)"
```

---

### Task 2: `constellation.ts` — star positions + recency (TDD)

**Files:**
- Create: `src/lib/constellation.ts`
- Test: `src/lib/constellation.test.ts`
- Modify: `package.json` scripts

- [ ] **Step 1: Write the failing test** (complete file `src/lib/constellation.test.ts`)

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starPosition, isRecent, clusterCenter } from './constellation.ts';

test('starPosition is deterministic for a slug', () => {
  const a = starPosition('stoic-philosophy', 'concept');
  const b = starPosition('stoic-philosophy', 'concept');
  assert.deepEqual(a, b);
});

test('starPosition stays inside its cluster box', () => {
  const { x, y } = starPosition('anything-at-all', 'project');
  const c = clusterCenter('project');
  assert.ok(Math.abs(x - c.x) <= c.rx, 'x within cluster radius');
  assert.ok(Math.abs(y - c.y) <= c.ry, 'y within cluster radius');
});

test('unknown types fall into the misc cluster, never crash', () => {
  const p = starPosition('weird', 'no-such-type');
  assert.ok(p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100);
});

test('isRecent: 7-day window on YYYY-MM-DD frontmatter dates', () => {
  const now = new Date('2026-07-24T12:00:00-04:00');
  assert.equal(isRecent('2026-07-24', now), true);
  assert.equal(isRecent('2026-07-18', now), true);
  assert.equal(isRecent('2026-07-16', now), false);
  assert.equal(isRecent(undefined, now), false);
  assert.equal(isRecent('garbage', now), false);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --experimental-strip-types --test src/lib/constellation.test.ts`
Expected: FAIL — cannot find module `./constellation.ts`

- [ ] **Step 3: Implement** (complete file `src/lib/constellation.ts`)

```ts
// Star-position + recency logic for the Constellation homepage (spec §3).
// Pure functions — no filesystem, no globals. Coordinates are viewport
// percentages (0–100) so the canvas and DOM layers share one space.

export interface Cluster { x: number; y: number; rx: number; ry: number }

// Hand-placed cluster centers; misc catches every type not listed.
const CLUSTERS: Record<string, Cluster> = {
  project:      { x: 22, y: 24, rx: 16, ry: 14 },
  concept:      { x: 74, y: 22, rx: 18, ry: 14 },
  person:       { x: 78, y: 62, rx: 14, ry: 12 },
  journal:      { x: 20, y: 72, rx: 16, ry: 13 },
  reference:    { x: 50, y: 82, rx: 16, ry: 10 },
  idea:         { x: 46, y: 14, rx: 12, ry: 8 },
  'voice-memo': { x: 8,  y: 48, rx: 7,  ry: 10 },
  misc:         { x: 55, y: 50, rx: 10, ry: 8 },
};

export function clusterCenter(type: string): Cluster {
  return CLUSTERS[type] ?? CLUSTERS.misc;
}

// FNV-1a — tiny, deterministic, good spread. Not crypto; doesn't need to be.
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function starPosition(slug: string, type: string): { x: number; y: number } {
  const c = clusterCenter(type);
  const h = fnv1a(slug);
  // Two independent lanes from one hash; polar spread inside the ellipse.
  const angle = ((h & 0xffff) / 0xffff) * Math.PI * 2;
  const radius = Math.sqrt(((h >>> 16) & 0xffff) / 0xffff); // sqrt → uniform disc
  return {
    x: Math.min(100, Math.max(0, c.x + Math.cos(angle) * radius * c.rx)),
    y: Math.min(100, Math.max(0, c.y + Math.sin(angle) * radius * c.ry)),
  };
}

const DAY_MS = 86_400_000;

export function isRecent(updated: string | undefined, now: Date = new Date()): boolean {
  if (!updated || !/^\d{4}-\d{2}-\d{2}/.test(updated)) return false;
  const t = new Date(`${updated.slice(0, 10)}T12:00:00-04:00`).getTime();
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age >= -DAY_MS && age < 7 * DAY_MS;
}
```

- [ ] **Step 4: Run tests — pass**

Run: `node --experimental-strip-types --test src/lib/constellation.test.ts`
Expected: 4 pass, 0 fail

- [ ] **Step 5: Add to the build gate** — in `package.json`, change the `build` script's start from `npm run test:date &&` to:

```
npm run test:date && npm run test:constellation &&
```

and add to scripts:

```json
"test:constellation": "node --experimental-strip-types --test src/lib/constellation.test.ts src/lib/localsky.test.ts"
```

(`localsky.test.ts` arrives in Task 6 — until then keep only the constellation file in this script, then extend it in Task 6.)

Use for now:

```json
"test:constellation": "node --experimental-strip-types --test src/lib/constellation.test.ts"
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/constellation.ts src/lib/constellation.test.ts package.json
git commit -m "feat(redesign): deterministic star positions + frontmatter recency (Task 2)"
```

---

### Task 3: Command palette (site-wide ⌘K)

**Files:**
- Create: `src/components/Palette.astro`
- (Wired into layout in Task 4)

- [ ] **Step 1: Create `src/components/Palette.astro`** (complete file). It reuses `getSearchIndex()` (`src/lib/vault.ts:605`) and the scoring approach currently inlined in `TopBar.astro` — score logic is copied, UI is new. Empty state per spec §5.

```astro
---
import { getSearchIndex, getTypeCounts, getStubs } from '../lib/vault';
const searchIndex = getSearchIndex();
const typeCounts = getTypeCounts();
const stubCount = getStubs(10_000).length;
const BASE_URL = import.meta.env.BASE_URL;
const PINNED = [
  { label: 'Reading List', slug: 'reading-list' },
  { label: 'TODO', slug: 'todo' },
  { label: 'Project Status Dashboard', slug: 'project-status-dashboard' },
  { label: 'Trends Index', slug: 'trends-index' },
  { label: 'Bookshelf', slug: 'bookshelf' },
];
---
<div id="palette-root" class="palette-root" hidden>
  <div class="palette-scrim" data-palette-close></div>
  <div class="palette" role="dialog" aria-modal="true" aria-label="Search WikiLeighs">
    <div class="palette-input-row">
      <span class="palette-caret" aria-hidden="true"></span>
      <input id="palette-input" type="text" autocomplete="off" spellcheck="false"
        placeholder={`search ${searchIndex.length} pages — or jump below`} aria-label="Search" />
      <button class="palette-esc" data-palette-close aria-label="Close">esc</button>
    </div>
    <div id="palette-results" class="palette-results" role="listbox"></div>
    <div id="palette-empty" class="palette-empty">
      <div class="palette-col">
        <div class="palette-col-title">Pinned</div>
        {PINNED.map(p => <a href={`${BASE_URL}wiki/${p.slug}`}>{p.label}</a>)}
      </div>
      <div class="palette-col">
        <div class="palette-col-title">Categories</div>
        {typeCounts.map(tc => (
          <a href={`${BASE_URL}category/${tc.type}`}>{tc.type} <span class="count">{tc.count}</span></a>
        ))}
      </div>
      <div class="palette-col">
        <div class="palette-col-title">Go</div>
        <a class="verdigris" href={`${BASE_URL}today`}>today</a>
        <a href={`${BASE_URL}random`}>random article</a>
        <a href={`${BASE_URL}gaps`}>gaps <span class="count gold">{stubCount} stubs</span></a>
        <a href={`${BASE_URL}about`}>about</a>
        <a href={`${BASE_URL}project-field/`}>foundation</a>
      </div>
    </div>
    <div class="palette-hint">↑↓ navigate · enter open · esc close</div>
  </div>
</div>

<script is:inline define:vars={{ searchIndex, BASE_URL }}>
  (() => {
    const root = document.getElementById('palette-root');
    const input = document.getElementById('palette-input');
    const resultsEl = document.getElementById('palette-results');
    const emptyEl = document.getElementById('palette-empty');
    let matches = []; let activeIdx = -1;

    const norm = (s) => (s || '').toLowerCase();
    function score(q, item) {
      const n = norm(item.title); const ali = (item.aliases || []).map(norm);
      if (n === q) return 1000;
      if (ali.includes(q)) return 900;
      if (n.startsWith(q)) return 500 - n.length;
      if (ali.some((a) => a.startsWith(q))) return 450 - item.title.length;
      if (n.includes(q)) return 200 - n.length;
      if ((item.tags || []).some((t) => norm(t).includes(q))) return 120;
      if (norm(item.excerpt).includes(q)) return 80;
      return 0;
    }
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function render() {
      resultsEl.innerHTML = matches.map((m, i) => `
        <a role="option" aria-selected="${i === activeIdx}" class="${i === activeIdx ? 'active' : ''}" href="${BASE_URL}wiki/${m.slug}">
          <span class="r-title">${esc(m.title)}</span>
          <span class="r-meta">${esc(m.type)}${m.excerpt ? ' · ' + esc(m.excerpt.slice(0, 60)) : ''}</span>
        </a>`).join('');
      const has = matches.length > 0 || input.value.trim() !== '';
      resultsEl.hidden = !has; emptyEl.hidden = has;
    }
    function update() {
      const q = norm(input.value.trim());
      if (!q) { matches = []; activeIdx = -1; render(); return; }
      matches = searchIndex.map((it) => ({ it, s: score(q, it) }))
        .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 10).map((x) => x.it);
      activeIdx = matches.length ? 0 : -1; render();
    }
    function open() { root.hidden = false; input.value = ''; update(); requestAnimationFrame(() => input.focus()); }
    function close() { root.hidden = true; }
    window.__paletteOpen = open;

    document.addEventListener('keydown', (e) => {
      const mod = navigator.platform.startsWith('Mac') ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); root.hidden ? open() : close(); return; }
      if (e.key === '/' && root.hidden && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '')) { e.preventDefault(); open(); return; }
      if (root.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, matches.length - 1); render(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); render(); }
      if (e.key === 'Enter' && activeIdx >= 0 && matches[activeIdx]) { window.location.href = `${BASE_URL}wiki/${matches[activeIdx].slug}`; }
    });
    input?.addEventListener('input', update);
    root.querySelectorAll('[data-palette-close]').forEach((el) => el.addEventListener('click', close));
  })();
</script>
```

- [ ] **Step 2: Palette CSS** — append to `src/styles/global.css`:

```css
/* ---- Command palette (spec §5) ---- */
.palette-root { position: fixed; inset: 0; z-index: 60; }
.palette-scrim { position: absolute; inset: 0; background: rgba(4, 6, 10, 0.7); }
.palette { position: relative; margin: 12vh auto 0; width: min(680px, 92vw);
  background: var(--raised); border: 1px solid var(--gold-soft); border-radius: 10px;
  box-shadow: 0 14px 60px rgba(0, 0, 0, 0.6); overflow: hidden; }
.palette-input-row { display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border-bottom: 1px solid var(--gold-hairline); }
.palette-caret { width: 7px; height: 15px; background: var(--gold); animation: caret-blink 1.1s steps(1) infinite; }
@keyframes caret-blink { 50% { opacity: 0.2; } }
.palette-input-row input { flex: 1; background: none; border: none; outline: none;
  color: var(--t-heading); font-family: var(--font-mono); font-size: 15px; }
.palette-esc { background: none; border: 1px solid var(--color-border-light); border-radius: 5px;
  color: var(--t-muted); font-family: var(--font-mono); font-size: 10px; padding: 2px 8px; cursor: pointer; }
.palette-results a { display: flex; justify-content: space-between; gap: 12px; padding: 8px 16px;
  color: var(--t-secondary); text-decoration: none; font-family: var(--font-mono); font-size: 13px; }
.palette-results a.active { background: rgba(232, 198, 106, 0.12); border-left: 2px solid var(--gold); color: var(--t-heading); }
.palette-results .r-meta { color: var(--t-muted); font-size: 11px; white-space: nowrap; overflow: hidden; }
.palette-empty { display: flex; gap: 24px; padding: 14px 16px; }
.palette-col { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.palette-col-title { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
.palette-col a { color: var(--t-body); text-decoration: none; font-size: 13px; line-height: 1.9; }
.palette-col a:hover { color: var(--gold); }
.palette-col .count { color: var(--t-muted); }
.palette-col .count.gold { color: var(--gold); }
.palette-col a.verdigris { color: var(--verdigris); }
.palette-hint { padding: 7px 16px; border-top: 1px solid var(--gold-hairline);
  color: var(--t-muted); font-size: 10.5px; font-family: var(--font-mono); }
@media (max-width: 640px) { .palette { margin-top: 4vh; } .palette-empty { flex-direction: column; } }
```

- [ ] **Step 3: Build check** — `npm run build` → green (component exists, not yet mounted).

- [ ] **Step 4: Commit**

```bash
git add src/components/Palette.astro src/styles/global.css
git commit -m "feat(redesign): command palette with rail-replacing empty state (Task 3)"
```

---

### Task 4: New chrome — TopBar, footer, Base layout (rail removed)

**Files:**
- Modify: `src/layouts/Base.astro` (drop LeftRail, mount Palette, dark shell)
- Modify: `src/components/TopBar.astro` (full rewrite; its inline search UI dies — palette replaces it)
- Delete: `src/components/LeftRail.astro` usage (file stays until Task 12 cleanup)

- [ ] **Step 1: Rewrite `src/components/TopBar.astro`** (complete file)

```astro
---
const BASE_URL = import.meta.env.BASE_URL;
interface Props { crumb?: string }
const { crumb } = Astro.props;
---
<header class="topbar">
  <a href={BASE_URL} class="topbar-brand">wikileighs{crumb && <span class="crumb">/<span>{crumb}</span></span>}</a>
  <div class="topbar-actions">
    <button class="search-chip" onclick="window.__paletteOpen && window.__paletteOpen()">
      <span data-key-hint>⌘K</span> search
    </button>
    <a class="verdigris" href={`${BASE_URL}today`}>today</a>
    <a href={`${BASE_URL}random`}>random</a>
  </div>
</header>
<script is:inline>
  if (!navigator.platform.startsWith('Mac'))
    document.querySelectorAll('[data-key-hint]').forEach(el => (el.textContent = 'Ctrl K'));
</script>
```

- [ ] **Step 2: Rewrite `src/layouts/Base.astro` body** — keep the `<head>` exactly as-is (title pattern, `noindex` metas, description). Replace `<body>`:

```astro
<body class="grain">
  <TopBar crumb={activeType} />
  <main class="main-col">
    <slot />
  </main>
  <footer class="page-footer">
    WikiLeighs · rendered from <code>notes/</code> ·
    <a href={`${BASE_URL}about`}>about</a> · <a href={`${BASE_URL}random`}>random</a> · <a href={`${BASE_URL}gaps`}>gaps</a>
  </footer>
  <Palette />
</body>
```

Update imports: remove `LeftRail`, add `import Palette from '../components/Palette.astro';`. The `activeType` prop is repurposed as the breadcrumb crumb.

- [ ] **Step 3: Chrome CSS** — append to `global.css`:

```css
/* ---- Chrome (spec §4 topbar / §5 nav) ---- */
.topbar { display: flex; justify-content: space-between; align-items: center;
  padding: 12px 24px; border-bottom: 1px solid var(--gold-hairline); }
.topbar-brand { font-family: var(--font-mono); font-size: 14px; color: var(--t-heading); text-decoration: none; }
.topbar-brand .crumb { color: var(--gold); }
.topbar-brand .crumb span { color: var(--t-muted); }
.topbar-actions { display: flex; gap: 18px; align-items: center; font-family: var(--font-mono); font-size: 12px; }
.topbar-actions a { color: var(--t-muted); text-decoration: none; }
.topbar-actions a.verdigris { color: var(--verdigris); }
.search-chip { background: none; border: 1px solid var(--color-border-light); border-radius: 6px;
  color: var(--t-muted); font-family: var(--font-mono); font-size: 11px; padding: 4px 12px; cursor: pointer; }
.search-chip:hover { border-color: var(--gold-soft); color: var(--t-body); }
.main-col { max-width: 1080px; margin: 0 auto; padding: 24px; }
.page-footer { max-width: 1080px; margin: 24px auto 32px; padding: 12px 24px;
  border-top: 1px solid var(--gold-hairline); color: var(--t-muted);
  font-family: var(--font-mono); font-size: 11px; }
.page-footer a { color: var(--t-muted); }
```

Also DELETE the old rules for `.page-shell`, `.left-rail`, `.rail*`, old `.topbar*`, `.search-form/.search-input/.search-results` from `global.css` (they're dead after this task).

- [ ] **Step 4: Build + eyeball**

Run: `npm run build && npm run preview` → open `http://127.0.0.1:4321/wikileighs/`
Expected: every page dark, no left rail, ⌘K + `/` + click all open the palette; empty state shows Pinned/Categories/Go.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Base.astro src/components/TopBar.astro src/styles/global.css
git commit -m "feat(redesign): dark chrome, palette mounted site-wide, rail removed (Task 4)"
```

---

### Task 5: Constellation homepage

**Files:**
- Modify: `src/pages/index.astro` (full rewrite)

- [ ] **Step 1: Rewrite `src/pages/index.astro`** (complete file)

```astro
---
import Base from '../layouts/Base.astro';
import { loadAllArticles, getTypeCounts, getStubs, getOrphans, getBrokenWikilinks, getTodayPage } from '../lib/vault';
import { starPosition, clusterCenter, isRecent } from '../lib/constellation';

const BASE_URL = import.meta.env.BASE_URL;
const articles = loadAllArticles();
const typeCounts = getTypeCounts();
const stubCount = getStubs(10_000).length;
const orphanCount = getOrphans(10_000).length;
const brokenCount = getBrokenWikilinks(10_000).length;
const hasToday = getTodayPage(new Date()) != null;

const stars = articles.map(a => {
  const p = starPosition(a.slug, a.type);
  return { slug: a.slug, title: a.title, type: a.type, x: p.x, y: p.y,
    recent: isRecent(a.updated), journal: a.type === 'journal' || a.type === 'voice-memo' };
});
// Interactive DOM stars: the 40 most recently updated of the glow set (spec §3 cap).
const glowing = articles.filter(a => isRecent(a.updated))
  .sort((a, b) => (b.updated || '').localeCompare(a.updated || '')).slice(0, 40)
  .map(a => { const p = starPosition(a.slug, a.type); return { slug: a.slug, title: a.title, x: p.x, y: p.y, journal: a.type === 'journal' }; });
const clusterLabels = typeCounts.filter(tc => tc.count >= 10).map(tc => ({ ...tc, c: clusterCenter(tc.type) }));
const buildTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York' });
---
<Base title="Home">
  <div class="sky" id="sky">
    <canvas id="sky-canvas" aria-hidden="true"></canvas>
    {clusterLabels.map(l => (
      <a class="cluster-label" style={`left:${l.c.x}%;top:${Math.max(2, l.c.y - l.c.ry - 4)}%`}
         href={`${BASE_URL}category/${l.type}`}>{l.type.toUpperCase()} · {l.count}</a>
    ))}
    {glowing.map(s => (
      <a class={`star-dom ${s.journal ? 'verd' : ''}`} style={`left:${s.x}%;top:${s.y}%`}
         href={`${BASE_URL}wiki/${s.slug}`} title={s.title}><span class="tip">{s.title}</span></a>
    ))}
    <div class="sky-palette-slot">
      <button class="sky-open-palette" onclick="window.__paletteOpen && window.__paletteOpen()">
        <span class="palette-caret"></span> type to jump — <span data-key-hint>⌘K</span> anywhere
      </button>
    </div>
    <div class="sky-status">
      <span>{articles.length} pages</span>
      <a class="gold" href={`${BASE_URL}gaps#stubs`}>{stubCount} stubs</a>
      <a href={`${BASE_URL}gaps#orphans`}>{orphanCount} orphans</a>
      <a href={`${BASE_URL}gaps#broken`}>{brokenCount} broken</a>
      <a class="verd" href={`${BASE_URL}today`}>today {hasToday ? '✓' : '—'}</a>
      <span>build {buildTime}</span>
    </div>
  </div>
  <script is:inline define:vars={{ stars }}>
    const canvas = document.getElementById('sky-canvas');
    const sky = document.getElementById('sky');
    const ctx = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = matchMedia('(max-width: 640px)').matches;
    const field = isMobile ? stars.filter((_, i) => i % 5 === 0) : stars; // sampled sky on mobile
    let W, H, t0 = performance.now();
    function size() { W = canvas.width = sky.clientWidth * devicePixelRatio; H = canvas.height = sky.clientHeight * devicePixelRatio; }
    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      const t = (now - t0) / 1000;
      for (let i = 0; i < field.length; i++) {
        const s = field[i];
        const dx = reduced ? 0 : Math.sin(t / 60 + i) * 0.15; // slow drift, spec §2
        const x = ((s.x + dx) / 100) * W, y = (s.y / 100) * H;
        ctx.beginPath();
        ctx.fillStyle = s.recent ? 'rgba(232,198,106,.9)' : s.journal ? 'rgba(111,211,199,.6)' : `rgba(255,255,255,${0.18 + ((i * 37) % 20) / 100})`;
        ctx.arc(x, y, (s.recent ? 1.6 : 1) * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) requestAnimationFrame(draw);
    }
    size(); addEventListener('resize', () => { size(); if (reduced) draw(t0); });
    reduced ? draw(t0) : requestAnimationFrame(draw);
  </script>
</Base>
```

- [ ] **Step 2: Sky CSS** — append to `global.css`:

```css
/* ---- Constellation homepage (spec §3) ---- */
.sky { position: relative; height: calc(100vh - 140px); min-height: 480px; overflow: hidden;
  border-radius: 12px; background:
    radial-gradient(ellipse 60% 40% at 75% 15%, rgba(88, 118, 200, 0.16), transparent 60%),
    radial-gradient(ellipse 50% 35% at 15% 80%, rgba(64, 160, 150, 0.10), transparent 60%),
    var(--ink); }
#sky-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.cluster-label { position: absolute; transform: translateX(-50%); font-family: var(--font-mono);
  font-size: 10px; letter-spacing: 0.22em; color: rgba(255, 255, 255, 0.4); text-decoration: none; }
.cluster-label:hover { color: var(--gold); }
.star-dom { position: absolute; width: 14px; height: 14px; transform: translate(-50%, -50%); border-radius: 50%; }
.star-dom::after { content: ''; position: absolute; inset: 4px; border-radius: 50%;
  background: var(--gold); box-shadow: 0 0 10px 2px var(--gold-soft); }
.star-dom.verd::after { background: var(--verdigris); box-shadow: 0 0 10px 2px var(--verdigris-soft); }
.star-dom .tip { display: none; position: absolute; left: 12px; top: -6px; white-space: nowrap;
  font-family: var(--font-mono); font-size: 10px; color: var(--gold); background: rgba(11, 14, 20, 0.85);
  border: 1px solid var(--gold-soft); border-radius: 4px; padding: 2px 7px; z-index: 5; }
.star-dom:hover .tip, .star-dom:focus .tip { display: block; }
.sky-palette-slot { position: absolute; left: 50%; top: 34%; transform: translateX(-50%); width: min(560px, 86%); }
.sky-open-palette { width: 100%; display: flex; align-items: center; gap: 10px;
  background: rgba(13, 16, 24, 0.78); border: 1px solid var(--gold-soft); border-radius: 9px;
  padding: 13px 16px; color: var(--t-muted); font-family: var(--font-mono); font-size: 13px;
  cursor: pointer; box-shadow: 0 10px 50px rgba(0, 0, 0, 0.55); }
.sky-status { position: absolute; left: 0; right: 0; bottom: 3%; display: flex; flex-wrap: wrap;
  justify-content: center; gap: 18px; font-family: var(--font-mono); font-size: 11px; color: var(--t-muted); }
.sky-status a { color: var(--t-muted); text-decoration: none; }
.sky-status a.gold { color: var(--gold); }
.sky-status a.verd, .sky-status .verd { color: var(--verdigris); }
```

- [ ] **Step 3: Build + eyeball** — `npm run build && npm run preview`. Expected: sky renders all stars; hover tooltips; cluster labels navigate; status line numbers match `/gaps`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/styles/global.css
git commit -m "feat(redesign): constellation homepage (Task 5)"
```

---

### Task 6: `localsky.ts` + article local-sky component (TDD for layout math)

**Files:**
- Create: `src/lib/localsky.ts`
- Test: `src/lib/localsky.test.ts`
- Create: `src/components/LocalSky.astro`
- Modify: `package.json` (extend `test:constellation` per Task 2 Step 5)

- [ ] **Step 1: Failing test** (complete file `src/lib/localsky.test.ts`)

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutLocalSky } from './localsky.ts';

const neighbors = [
  { slug: 'a', title: 'A', journal: false },
  { slug: 'b', title: 'B', journal: true },
  { slug: 'c', title: 'C', journal: false },
];

test('center node sits at the middle', () => {
  const l = layoutLocalSky(neighbors, 700, 120);
  assert.equal(l.center.x, 350); assert.equal(l.center.y, 60);
});

test('every neighbor lands inside the box with a margin', () => {
  const l = layoutLocalSky(neighbors, 700, 120);
  for (const n of l.nodes) {
    assert.ok(n.x >= 40 && n.x <= 660, `x in range: ${n.x}`);
    assert.ok(n.y >= 14 && n.y <= 106, `y in range: ${n.y}`);
  }
});

test('caps at 12 neighbors', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ slug: `s${i}`, title: `S${i}`, journal: false }));
  assert.equal(layoutLocalSky(many, 700, 120).nodes.length, 12);
});
```

- [ ] **Step 2: Run — fails** (`cannot find module ./localsky.ts`)

- [ ] **Step 3: Implement** (complete file `src/lib/localsky.ts`)

```ts
// 1-hop "linked from" constellation for article footers (spec §4).
// Pure layout math; the .astro component renders the SVG at build time.
export interface SkyNeighbor { slug: string; title: string; journal: boolean }
export interface SkyNode extends SkyNeighbor { x: number; y: number }
export interface LocalSkyLayout { center: { x: number; y: number }; nodes: SkyNode[] }

export function layoutLocalSky(neighbors: SkyNeighbor[], width: number, height: number): LocalSkyLayout {
  const capped = neighbors.slice(0, 12);
  const cx = width / 2, cy = height / 2;
  const rx = width / 2 - 60, ry = height / 2 - 16; // margin keeps labels inside
  const nodes = capped.map((n, i) => {
    // Even fan around the ellipse, slight alternation so labels don't collide.
    const angle = (i / Math.max(capped.length, 1)) * Math.PI * 2 + (i % 2 ? 0.35 : 0);
    return { ...n, x: Math.round(cx + Math.cos(angle) * rx * (i % 2 ? 0.95 : 0.7)),
             y: Math.round(cy + Math.sin(angle) * ry * (i % 2 ? 0.9 : 0.65)) };
  });
  return { center: { x: cx, y: cy }, nodes };
}
```

- [ ] **Step 4: Run — 3 pass.** Update `package.json` `test:constellation` to include both test files (final form shown in Task 2 Step 5).

- [ ] **Step 5: Create `src/components/LocalSky.astro`** (complete file)

```astro
---
import { layoutLocalSky } from '../lib/localsky';
interface Props { neighbors: Array<{ slug: string; title: string; journal: boolean }> }
const { neighbors } = Astro.props;
const BASE_URL = import.meta.env.BASE_URL;
const W = 700, H = 120;
const sky = layoutLocalSky(neighbors, W, H);
---
{sky.nodes.length > 0 && (
  <div class="local-sky">
    <div class="local-sky-title">LINKED FROM — LOCAL SKY</div>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pages linking here">
      {sky.nodes.map(n => (
        <line x1={sky.center.x} y1={sky.center.y} x2={n.x} y2={n.y}
          stroke={n.journal ? 'rgba(111,211,199,.3)' : 'rgba(232,198,106,.25)'} stroke-width="1" />
      ))}
      <circle cx={sky.center.x} cy={sky.center.y} r="4" fill="#e8c66a" />
      {sky.nodes.map(n => (
        <a href={`${BASE_URL}wiki/${n.slug}`}>
          <circle cx={n.x} cy={n.y} r="2.5" fill={n.journal ? '#6fd3c7' : '#b5b0a4'} />
          <text x={n.x + 6} y={n.y + 3} fill={n.journal ? '#6fd3c7' : '#b5b0a4'}
            font-size="10" font-family="IBM Plex Mono, monospace">{n.title.slice(0, 28)}</text>
        </a>
      ))}
    </svg>
  </div>
)}
```

- [ ] **Step 6: CSS** — append to `global.css`:

```css
.local-sky { margin-top: 24px; border-top: 1px solid var(--gold-hairline); padding-top: 14px; }
.local-sky-title { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: var(--t-muted); margin-bottom: 8px; }
.local-sky svg { width: 100%; height: auto; }
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/localsky.ts src/lib/localsky.test.ts src/components/LocalSky.astro src/styles/global.css package.json
git commit -m "feat(redesign): local-sky 1-hop constellation, tested layout (Task 6)"
```

---

### Task 7: Article page — the reading room

**Files:**
- Modify: `src/pages/wiki/[slug].astro`
- Modify: `src/components/StubBanner.astro`
- Modify: `src/styles/global.css` (article-body overhaul)

- [ ] **Step 1: Frontmatter additions in `wiki/[slug].astro`** — keep every existing computation (`editMailto` block lines 32–37, `infoboxPairs`, `incoming`, `isGreeneLesson` guard). Add after `incoming`:

```ts
const skyNeighbors = incoming.map(a => ({ slug: a.slug, title: a.title, journal: a.type === 'journal' || a.type === 'voice-memo' }));
const readMinutes = Math.max(1, Math.round((article.html || '').split(/\s+/).length / 220));
```

Import `LocalSky` alongside the existing imports: `import LocalSky from '../../components/LocalSky.astro';`

- [ ] **Step 2: Replace the template** — breadcrumb `<div class="breadcrumb">` and `<nav class="tabs">` blocks are replaced by the reading-room header; the article body/infobox two-column becomes the new grid. Template (from `<Base ...>` down):

```astro
<Base title={article.title} description={article.firstParagraph || article.title} activeType={article.type}>
  <article class="room">
    <div class="room-main">
      <div class="pills">
        <a class="pill gold" href={`${BASE_URL}category/${article.type}`}>{article.type}</a>
        {article.tags.slice(0, 4).map(t => <a class="pill" href={`${BASE_URL}tag/${slugify(t)}`}>{t}</a>)}
      </div>
      <h1 class="room-title">{article.title}</h1>
      <div class="room-meta">
        updated <span class="verd">{article.updated || article.created || '—'}</span>
        · {incoming.length} backlinks · {readMinutes} min ·
        <a class="suggest" href={editMailto}>✎ suggest edit</a>
      </div>
      {isStubArticle && <StubBanner />}
      <div class="article-body" set:html={article.html} />
      <LocalSky neighbors={skyNeighbors} />
    </div>
    <aside class="room-side">
      {infoboxPairs.length > 0 && (
        <div class="dossier">
          <div class="dossier-title">Dossier</div>
          <dl>
            {infoboxPairs.map(([k, v]) => (<><dt>{k}</dt><dd set:html={renderInfoboxValue(k, v)} /></>))}
          </dl>
        </div>
      )}
      {article.toc && article.toc.length > 1 && (
        <nav class="otp" aria-label="On this page">
          <div class="otp-title">On this page</div>
          {article.toc.map(h => <a href={`#${h.id}`} class={`d${h.depth}`}>{h.text}</a>)}
        </nav>
      )}
    </aside>
  </article>
</Base>
```

(`isStubArticle` = `import { isStub } from '../../lib/vault'` → `const isStubArticle = isStub(article);`. If `article.toc` doesn't exist on the `Article` interface, check `src/lib/vault.ts:55-90` — the `TocEntry` interface at line 86 implies it does; use the actual property name found there.)

- [ ] **Step 3: Rewrite `StubBanner.astro`** (complete file)

```astro
<div class="stub-line">○ unwritten star — this page is a stub. <span>Ask Giles to expand it.</span></div>
```

```css
/* append to global.css */
.stub-line { font-family: var(--font-mono); font-size: 12px; color: var(--t-muted);
  border: 1px dashed rgba(139, 147, 165, 0.35); border-radius: 6px; padding: 8px 12px; margin: 10px 0; }
```

- [ ] **Step 4: Reading-room CSS** — in `global.css`, update `.article-body` rules to the dark serif system and add the room grid. Key block (replaces old `.article-body` colors/sizes, old `.infobox*` and `.tabs` rules die):

```css
/* ---- Reading room (spec §4) ---- */
.room { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 36px; }
.room-main { min-width: 0; }
.pills { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
.pill { font-family: var(--font-mono); font-size: 10.5px; color: var(--t-muted);
  border: 1px solid var(--color-border-light); border-radius: 999px; padding: 2px 10px; text-decoration: none; }
.pill.gold { color: var(--gold); border-color: var(--gold-soft); }
.room-title { font-family: var(--font-serif); font-weight: 400; font-size: 2.3rem; color: var(--t-heading); margin: 0 0 4px; }
.room-meta { font-family: var(--font-mono); font-size: 11.5px; color: var(--t-muted); margin-bottom: 18px; }
.room-meta .verd { color: var(--verdigris); }
.room-meta .suggest { color: var(--gold); opacity: 0.7; text-decoration: none; }
.article-body { font-family: var(--font-serif); font-size: 17.5px; line-height: 1.78; color: var(--t-body); }
.article-body h1, .article-body h2 { font-family: var(--font-serif); color: var(--t-heading);
  border-bottom: 1px solid var(--gold-hairline); }
.article-body h3, .article-body h4 { color: var(--t-heading); }
.article-body a { color: var(--gold); text-decoration: none; border-bottom: 1px solid var(--gold-soft); }
.article-body a:visited { color: var(--gold); }
.article-body a.wikilink-broken { color: var(--t-muted); border-bottom: 1px dashed rgba(139, 147, 165, 0.4); }
.article-body pre { background: var(--raised); border: 1px solid var(--color-border-light); border-radius: 7px; }
.article-body code { background: var(--raised); color: var(--t-secondary); }
.article-body blockquote { border-left: 2px solid var(--gold-soft); color: var(--t-secondary); }
.article-body th { background: var(--raised); }
.article-body th, .article-body td { border-color: var(--color-border-light); }
.room-side { position: sticky; top: 24px; align-self: start; display: flex; flex-direction: column; gap: 18px; }
.dossier { background: var(--raised); border: 1px solid var(--gold-hairline); border-radius: 8px; padding: 12px 14px; }
.dossier-title { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
.dossier dl { font-family: var(--font-mono); font-size: 12px; }
.dossier dt { color: var(--t-muted); float: left; clear: left; margin-right: 8px; }
.dossier dd { color: var(--t-heading); margin: 0 0 4px 0; overflow-wrap: anywhere; }
.dossier dd a { color: var(--gold); text-decoration: none; }
.otp { font-family: var(--font-mono); font-size: 12px; border-left: 1px solid rgba(139, 147, 165, 0.25); padding-left: 12px; }
.otp-title { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--t-muted); margin-bottom: 6px; }
.otp a { display: block; color: var(--t-muted); text-decoration: none; line-height: 1.9; }
.otp a.d3 { padding-left: 12px; }
.otp a:hover { color: var(--gold); }
@media (max-width: 860px) {
  .room { grid-template-columns: 1fr; }
  .room-side { position: static; order: -1; }
  .otp { display: none; } /* mobile: TOC collapses away; palette covers jump-nav */
}
```

- [ ] **Step 5: Build + eyeball 4 article shapes** — a concept (`wiki/stoic-philosophy`-like), a person (portrait infobox path), a Greene lesson (`isGreeneLesson` branch must still render its custom layout — do NOT restyle it in this task), and a stub.

- [ ] **Step 6: Commit**

```bash
git add "src/pages/wiki/[slug].astro" src/components/StubBanner.astro src/styles/global.css
git commit -m "feat(redesign): reading-room article page with dossier + local sky (Task 7)"
```

---

### Task 8: Category + tag pages

**Files:**
- Modify: `src/pages/category/[type].astro` (markup/styles only — **the `STATUS_BUCKETS` array and bucketing loop at lines ~73–105 are untouched**)
- Modify: `src/pages/tag/[tag].astro`

- [ ] **Step 1: Category page** — keep all frontmatter logic (buckets, journal month grouping, truncate). Replace the rendered list markup with the mono index. Row template used for both the bucket tables and the flat A–Z list:

```astro
<div class="idx-row">
  <a class="idx-title" href={`${BASE_URL}wiki/${a.slug}`}>{a.title}</a>
  <span class="idx-date">{(a.updated || a.created || '').slice(5)}</span>
  <span class="idx-excerpt">{truncate(a.firstParagraph || '', 90)}</span>
</div>
```

Header: `<h1 class="cat-title">{pluralizeType(type)} <span class="gold">{articles.length}</span></h1>` plus order toggle — two anchor tabs `#recent` / `#az` rendering two pre-built lists (CSS `:target` swaps which list shows; recent is default):

```css
/* append */
.cat-title { font-family: var(--font-serif); font-size: 1.9rem; color: var(--t-heading); }
.cat-title .gold { font-family: var(--font-mono); font-size: 0.9rem; color: var(--gold); }
.idx-row { display: flex; gap: 12px; align-items: baseline; padding: 5px 0;
  border-top: 1px solid rgba(139, 147, 165, 0.12); font-family: var(--font-mono); font-size: 13px; }
.idx-title { color: var(--gold); text-decoration: none; flex: 0 0 260px; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.idx-date { color: var(--verdigris); flex: 0 0 52px; font-size: 11.5px; }
.idx-excerpt { color: var(--t-muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bucket-title { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--gold); margin: 16px 0 4px; }
#az, #recent:target ~ #az { display: block; }
#recent, #az:target ~ #recent { display: block; }
#az { display: none; }
body:has(#az:target) #recent { display: none; }
body:has(#az:target) #az { display: block; }
@media (max-width: 640px) { .idx-title { flex-basis: 60%; } .idx-excerpt { display: none; } }
```

(If `:has` feels fragile in review, fall back to a 3-line inline script toggling a class — either is acceptable; pick one and delete the other.)

- [ ] **Step 2: Tag page** — same `.idx-row` list, no buckets. Title `#<tag>`.

- [ ] **Step 3: Build + verify**: `/category/project` shows all seven buckets incl. **Other / Unstatused**; `/category/journal` keeps its month grouping; any tag page renders.

- [ ] **Step 4: Commit**

```bash
git add "src/pages/category/[type].astro" "src/pages/tag/[tag].astro" src/styles/global.css
git commit -m "feat(redesign): mono index category/tag pages, buckets preserved (Task 8)"
```

---

### Task 9: Today + archive

**Files:**
- Modify: `src/pages/today.astro`, `src/pages/today/[date].astro`, `src/pages/today/archive.astro`

- [ ] **Step 1: Today pages** — keep ALL data plumbing (`getTodayPage`, hero-image lookup, prev/next date logic — whatever exists today). Restyle: verdigris date-nav line on top (`← wed · THURSDAY JULY 24 · fri → · archive`), title in Newsreader, existing `.today-hero` image replaced by a right-side wash:

```css
/* append */
.today-nav { font-family: var(--font-mono); font-size: 11.5px; color: var(--verdigris); margin-bottom: 6px; }
.today-nav a { color: var(--verdigris); text-decoration: none; opacity: 0.8; }
.today-wash { position: relative; border-radius: 10px; overflow: hidden; }
.today-wash img { position: absolute; right: 0; top: 0; width: 42%; height: 100%;
  object-fit: cover; opacity: 0.55; mask-image: linear-gradient(105deg, transparent 0%, #000 40%); }
.today-panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 12px; }
.today-panel { background: var(--raised); border: 1px solid var(--verdigris-soft); border-radius: 8px; padding: 10px 12px; }
.today-panel-title { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--verdigris); margin-bottom: 5px; }
```

The today page's markdown sections continue rendering through `.article-body`; panels apply only if the page already splits sections structurally — if it renders one HTML blob, wrap the blob and skip panelization (do not parse the markdown into panels; YAGNI).

- [ ] **Step 2: Archive** — replace list with a per-month calendar grid; a cell = a day; verdigris dot if `listTodayPageDates()` contains it; thumbnail background if a matching `attachments/today-photos/<date>.*` was copied by the existing build (check how today-photos are surfaced today — reuse that path helper; `getLatestUploadHero` at `vault.ts:582` shows the pattern):

```css
.cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal-day { aspect-ratio: 1; border: 1px solid rgba(139, 147, 165, 0.14); border-radius: 6px;
  font-family: var(--font-mono); font-size: 10px; color: var(--t-muted); padding: 4px;
  position: relative; background-size: cover; background-position: center; text-decoration: none; }
.cal-day.written::after { content: ''; position: absolute; right: 5px; bottom: 5px;
  width: 5px; height: 5px; border-radius: 50%; background: var(--verdigris); }
```

- [ ] **Step 3: Build + verify**: `/today` shows illustration wash when today's photo exists; archive grid dots match written days; `scripts/check-built-today-date.mjs` (already in `npm run build`) still passes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/today.astro "src/pages/today/[date].astro" src/pages/today/archive.astro src/styles/global.css
git commit -m "feat(redesign): verdigris today pages + calendar archive (Task 9)"
```

---

### Task 10: Gaps — the unlit sky

**Files:**
- Modify: `src/pages/gaps.astro`

- [ ] **Step 1: Restyle, keeping all four sections and their exact IDs** (`#stubs`, `#orphans`, `#broken`, `#stale`) and their data calls (`getStubs`, `getOrphans`, `getBrokenWikilinks`, `getStaleActiveProjects`). Each section becomes a raised panel titled in gold smallcaps (`STUBS · 87 — unwritten stars`), rows as `○ <title>` mono lines linking to page + source. Page title: `The unlit sky` (serif) with subtitle `what the vault hasn't finished thinking`.

- [ ] **Step 2: Growth strip** — 12-month page-count bars, computed at build:

```ts
// in gaps.astro frontmatter
import { loadAllArticles } from '../lib/vault';
const byMonth = new Map<string, number>();
for (const a of loadAllArticles()) {
  const d = (a.created || '').slice(0, 7);
  if (d) byMonth.set(d, (byMonth.get(d) || 0) + 1);
}
const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
let running = loadAllArticles().length - months.reduce((s, [, n]) => s + n, 0);
const growth = months.map(([m, n]) => ({ m, total: (running += n) }));
const maxTotal = growth.at(-1)?.total || 1;
```

```astro
<div class="growth" role="img" aria-label="Vault growth, 12 months">
  {growth.map(g => <div class="bar" style={`height:${Math.round((g.total / maxTotal) * 100)}%`} title={`${g.m}: ${g.total}`} />)}
</div>
```

```css
.growth { display: flex; align-items: flex-end; gap: 3px; height: 48px; }
.growth .bar { flex: 1; background: var(--gold); opacity: 0.35; border-radius: 1px; }
.growth .bar:last-child { opacity: 1; }
```

- [ ] **Step 3: Build + verify**: all four anchors resolve (`/gaps#stale` scrolls); counts equal homepage status line.

- [ ] **Step 4: Commit**

```bash
git add src/pages/gaps.astro src/styles/global.css
git commit -m "feat(redesign): unlit-sky gaps page, four sections + growth strip (Task 10)"
```

---

### Task 11: 404 / missing page

**Files:**
- Modify: `src/pages/missing.astro`

- [ ] **Step 1:** Dark empty-sky treatment: sparse canvas-free static star dots (reuse `.grain` + a few absolutely-positioned faint dots), message `that star isn't charted yet` (serif), the searched title if `?title=` param present (client-side read, existing behavior preserved), and a button opening the palette.

- [ ] **Step 2:** Build, verify `/missing?title=Foo` renders. Commit:

```bash
git add src/pages/missing.astro && git commit -m "feat(redesign): uncharted-star missing page (Task 11)"
```

---

### Task 12: Regression gate, cleanup, screenshots, design QA

**Files:**
- Delete: `src/components/LeftRail.astro`
- Modify: `src/styles/global.css` (dead-rule sweep)

- [ ] **Step 1: Page-count parity**

Run: `npm run build 2>&1 | grep -E "page\(s\) built|Complete"`
Expected: identical page count to the number recorded on `main` in Task 1 Step 5. Any delta must be explained (should be 0 — this redesign adds no routes).

- [ ] **Step 2: Spec §8 checklist — verify each in the built site (`npm run preview`)**

1. Article page → `✎ suggest edit` → mailto contains `[cc:Mac] WikiLeighs edit:` + slug + source path
2. `attachments/today-photos/<date>` image appears on its today page
3. `/category/project` → seven buckets incl. Other/Unstatused, recent-first inside buckets
4. `/gaps` → `#stubs` `#orphans` `#broken` `#stale` all present with data
5. View-source on any page → `noindex, nofollow` metas intact; all URLs unchanged (spot-check 5 slugs against main)

- [ ] **Step 3: Delete `LeftRail.astro` + dead CSS** — `grep -rn "LeftRail\|left-rail\|page-shell\|search-form" src/` must return nothing. Old `.infobox*`, `.tabs`, `.breadcrumb` rules removed unless still referenced (grep first — the Greene lesson layout may use its own classes; leave `greene-*` alone entirely).

- [ ] **Step 4: Screenshots** — `python3 screenshot.py` (check its usage header first) or manual: capture home, article, category/project, today, gaps, missing at desktop + 390px mobile. Save to `screenshots/redesign/`.

- [ ] **Step 5: Design QA (Impeccable critique)** — with Impeccable + Taste installed as Claude Code skills (clones already at the scratchpad from the brainstorm; install per their READMEs), run Impeccable's `critique` against the six screenshots/pages; fix flagged slop patterns that contradict the spec's language (typography ramp violations, dead-grey text on ink, hairline inconsistencies). Timebox: one pass, fix, re-screenshot.

- [ ] **Step 6: Doubter pass on the diff** — dispatch the `adversarial-reviewer` agent on `git diff main...redesign/constellation --stat` + the spec §8 checklist results, per the vault's review culture. Resolve or note flags.

- [ ] **Step 7: Final commit**

```bash
git add -A && git commit -m "chore(redesign): cleanup, regression checklist, screenshots (Task 12)"
```

- [ ] **Step 8: STOP — do not merge or push.** Present to Leigh: preview URL, screenshots, checklist results. Merge/deploy is Leigh's call (superpowers:finishing-a-development-branch).

---

## Self-Review Notes (already applied)

- **Spec coverage:** §2→T1, §3→T2+T5, §4→T6+T7, §5→T3+T4, §6→T8+T9+T10 (+T11 for 404), §7→T1/T2 (fonts, frontmatter recency, no-git-log), §8/§9→T12. Light theme, Higgsfield, Graphify: out of scope per §10 — no tasks, correct.
- **Consistency:** token names (`--ink/--raised/--gold/--verdigris/--t-*`) used identically in Tasks 1–11; `starPosition/isRecent/clusterCenter` (T2) match T5's imports; `layoutLocalSky` (T6) matches component usage; palette global is `window.__paletteOpen` in T3, called in T4 chrome + T5 sky + T11 missing.
- **Known judgment calls for the implementer:** `article.toc` property name (verify against `vault.ts:86` `TocEntry`), `:has()` vs script toggle in T8, today-page panelization only if sections already split (T9).
