# WikiLeighs "Constellation" Redesign — Design Spec

**Date:** 2026-07-24
**Status:** Approved by Leigh section-by-section (visual companion session, macbookair/claude)
**Replaces:** The Wikipedia-pastiche UI (Linux Libertine serif, #3366cc links, gray left rail)

## 1. Problem & Goals

Leigh's verdict on the current UI: "tired, old, and hard to figure out where content is."

Goals, in priority order:
1. **Findability** — from any page, any of 1,362 pages is reachable in seconds.
2. **Distinctiveness** — a committed visual world, not a template. Direction chosen through mockup rounds: *Modern Knowledge Base* bones → *The Instrument* (command-palette-first) → **B1 Constellation** (the vault rendered as a night sky).
3. **Reading quality** — long-form pages tuned for nightly reading.

Explicit decisions from the session:
- **Dark everywhere** (Leigh chose over dark-home/light-articles and over a dual-theme toggle).
- Left rail is removed; its contents relocate (see §5).
- Round-1 "LLM default" layouts (bento dashboard, hero+cards directory, activity feed) were rejected; design derives from the Impeccable + Taste skill rules (commit to one idea; background must be atmosphere or data, never flat filler).

## 2. Design Language — "The Instrument"

### Surfaces
| Token | Value | Use |
|---|---|---|
| `--ink` | `#0B0E14` | page ground |
| `--raised` | `#12161F` | panels, code blocks, dossier |
| `--lifted` | `#1A1F2B` | hover states |

Texture: subtle grain overlay (CSS dot-matrix or tiled SVG noise, ~3–4% opacity) on all surfaces; nebula radial washes (indigo/teal, low alpha) on the homepage and section headers. Nothing renders flat.

### Accents — exactly two
| Token | Value | Meaning |
|---|---|---|
| `--gold` | `#E8C66A` | interactive & recent: links, caret, glowing stars, active states, counts |
| `--verdigris` | `#6FD3C7` | time & journal: dates, today, timeline, journal cluster |

Neutrals: `#F2EFE6` (headings), `#D5D2C8` (body), `#B5B0A4` (secondary), `#8B93A5` (muted).

### Type
- **Chrome/UI:** IBM Plex Mono, self-hosted via `@fontsource` (no CDN).
- **Reading:** Newsreader (serif), self-hosted, article body ≈17.5px / 1.75–1.8 line-height, warm off-white on ink.
- Display sizes on a fixed ramp; no ad-hoc font sizes (Impeccable rule).

### Motion
- Stars drift in slow (~60s) loops; staggered reveals on page load; palette focus glow.
- `prefers-reduced-motion` ⇒ still sky, no reveals, no drift. No scroll-jacking anywhere.

## 3. Homepage — the Constellation

- Full-viewport night sky. **Every page is a star** (1,362): position computed at build time from a deterministic hash of the slug, clustered by category; positions stable across builds.
- **Gold glow** = touched within 7 days (from git log at build). **Verdigris** = journal/time pages. Standard pages = faint white points.
- Cluster labels (`PROJECTS · 214`, etc.) are clickable → category pages.
- **Command palette front and center**: type → live-filtered results (existing search index) → Enter opens. ⌘K/Ctrl-K summons it site-wide.
- Hover star = title tooltip; click = open page.
- Bottom **status line**: `1,362 pages · 87 stubs · 12 orphans · today ✓ · build 14:02 · gaps →`.
- Rendering: one `<canvas>` for the field + interactive DOM stars for the glowing set, **capped at the 40 most recently touched** (excess stay canvas-only, still searchable). Mobile: sampled sky (~300 stars), full-width palette, tappable cluster labels.

## 4. Article Page — the Reading Room

- Topbar: `wikileighs/<type>` breadcrumb (type chip links to category page), search chip (platform-aware ⌘K/Ctrl K label), `today`, `random`.
- Title in Newsreader; meta line in mono: `updated <date> · N backlinks · M min · ✎ suggest edit` (mailto behavior preserved verbatim).
- Pill tags (mono, outlined; type pill in gold).
- **Dossier** panel (infobox reborn): raised panel, gold-hairline border, type/since/corpus/related.
- Sticky mono **"On this page"** TOC, gold active indicator. Mobile: dossier stacks under title; TOC collapses to a jump menu.
- Wikilinks: gold with soft gold underline. **Broken wikilinks: dimmed + dashed** (not red — unwritten, not error). Code blocks: raised panel, no glow.
- **"Linked from" local sky** at page bottom: this page + 1-hop links drawn as a small constellation (build-time-rendered SVG; journal links verdigris); click to traverse.
- Stub pages: quiet "unwritten star" banner line replaces the yellow box.

## 5. Navigation — where the left rail went

- **⌘K empty state** = the old rail: three columns — PINNED (Reading List, TODO, Project Status Dashboard, Trends Index, Bookshelf), CATEGORIES (all types + counts), GO (today, random, gaps + stub count, about, foundation). Recents surface above pinned once history exists (localStorage).
- Keyboard: `⌘K` (macOS) / `Ctrl+K` (Windows/Linux) / `/` universal fallback; topbar chip opens it by click (mouse-only path).
- Belt-and-braces: homepage cluster labels, per-article type chips, footer keeps about/random as plain links.
- Accepted trade-off (stated in session): browsing costs one keystroke more; articles gain a full-width canvas.

## 6. Other Pages

- **/category/[type]**: dense mono index rows (title · updated · one-line excerpt), Recent/A–Z orders pre-built as tabs. **`project` keeps its status buckets** (Active / In progress / Paused / Planned / Shipped / Archived — the 2026-04-26 feature). Header links to "its stars on the sky."
- **/today**: verdigris domain. Daily illustration (existing `attachments/today-photos/<date>` convention) as a right-side wash under a dark gradient; prev/next day + archive nav; calendar/reminders/vault-activity as raised panels. **Archive**: calendar grid, verdigris dot per written day, thumbnail per illustrated day.
- **/gaps** — "The unlit sky": stubs (unwritten stars), orphans (unlinked), broken links, each row linking to page + source; 12-month growth strip (build-time, dataviz-skill styling). **Element/anchor IDs stay stable** — Giles's audits parse this page.
- **/tag/[tag]**: same flat mono index as categories.
- 404: empty sky + palette ("that star isn't charted yet").

## 7. Build & Tech

- **Stack unchanged:** Astro SSG → GitHub Pages → Cloudflare Access; `base: '/wikileighs/'`; existing deploy workflow + `repository_dispatch(vault-changed)` untouched.
- New build steps (all in `src/lib/`): star-position JSON (slug hash → cluster-local coords), recent-set from `git log --since=7.days` over the vault checkout, local-sky SVG per article (1-hop graph from existing wikilink index).
- Palette consumes the existing `getSearchIndex()`; scoring logic reused, UI rewritten.
- Fonts: `@fontsource/ibm-plex-mono`, `@fontsource/newsreader` — subset latin, weights 400/500/600 mono + 400/500 serif with italics.
- JS budget: homepage = canvas sky + palette (~vanilla, no framework); article pages = palette only. No client graph libraries.
- **Implementation aids (not dependencies):** Impeccable + Taste v2 installed as Claude Code skills; Impeccable `critique` runs as the design-QA pass on each page type before merge.

## 8. Preserved Behaviors (regression checklist)

1. `✎ suggest edit` mailto → `[cc:Mac] WikiLeighs edit: <title>` routing
2. `attachments/today-photos/<date>` hero convention on today pages
3. Project category status buckets & their bucket order
4. `/gaps` data + stable IDs (Giles dependency)
5. Search index contents/scoring; all existing URLs & slugs unchanged; `noindex` metas; Cloudflare Access flow

## 9. Rollout

1. Branch `redesign/constellation`; implement page-type by page-type.
2. Every build must produce all pages clean (baseline 1,362 at last count — assert ±0 vs main at parity, then allow growth).
3. Before/after screenshots of the 6 page types via `screenshot.py`; eyeball pass.
4. **Doubter pass** (`adversarial-reviewer` agent) over the implementation plan before code, per Leigh's new light-touch review culture.
5. Merge → existing Actions pipeline deploys. Rollback = revert merge commit.

## 10. Out of Scope (explicitly)

- Light theme / theme toggle (revisit only if dark-everywhere reading fatigues in practice)
- Higgsfield or any generated imagery; Scroll World-style scroll animation
- Graphify integration; global 3D/interactive graph explorer (local sky is the only graph surface)
- Any content, frontmatter, or vault-side changes
