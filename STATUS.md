# WikiLeighs — STATUS

**Updated:** 2026-04-16 (night-shift)
**Status:** MVP running; production build is clean

## What it is

A Wikipedia-styled web reader for Leigh's Obsidian vault. Scoped to the `notes/` subtree. Frontmatter drives categorization; `[[wikilinks]]` become navigation; H2 headings build a Contents box; frontmatter fields populate an infobox. Visual target: Farza Majeed's Farzapedia.

## How to run

`VAULT_ROOT` is required — no default. Point it at your vault before running anything.

Dev server (hot reload on markdown/code edits):
```
cd ~/Projects/wikileighs
VAULT_ROOT=~/Projects/vault npx astro dev
# -> http://127.0.0.1:4321/
```

Static build:
```
VAULT_ROOT=~/Projects/vault npx astro build
VAULT_ROOT=~/Projects/vault npx astro preview
```

See `.env.example` for Windows (PowerShell) syntax.

## What works

- Home page: welcome + stats + Featured article + Recently updated (prominent list) + Latest activity (sidebar) + About + Browse by category
- Article pages: breadcrumb (`{type} · created {date} · updated {date}`), H1, tab bar, body, right-floating infobox, numbered Contents TOC
- Person articles render `photo:` frontmatter when set (relative path → `$VAULT_ROOT/attachments/…`, absolute URL passes through, inlined as data URI at build time); fall back to silver-circle initials otherwise
- Featured-article curation: any article with `featured: true` in frontmatter is used; most-recently-updated wins if multiple. Falls back to longest non-report article
- Category/type listing pages at `/category/{type}` grouped by first letter with two-column layout
- Tag listings at `/tag/{slug}`
- Wikilink resolution: `[[Page]]`, `[[Page|Alias]]`, `[[Page#Section]]` resolve across the vault's slug namespace; broken links render in red (Wikipedia style)
- "What links here" reverse-link section at the bottom of every article
- Client-side search in the top bar (title + aliases + tags + first-paragraph excerpt)
- Random article link (`/random`)
- Gap analysis (`/gaps`) — stubs, orphans, broken wikilinks, stale active projects
- Daily journal viewer (`/today`)
- Left-rail nav with category list (by type, counts shown) and a sampling of pages

## Vault scope

Reads only:
- `notes/**/*.md` (main article index)
- `journal/daily/YYYYMMDD.md` and `journal/personal/YYYY-MM-DD*.md` via dedicated loaders for `/today`

Excludes from the main article index (intentionally):
- `Private/`, `_local-*/`, `archive/`, `inbox/`, `journal/`, `attachments/`
- Any file whose relative path starts with `_`

## Known gaps / MVP exclusions

Deliberately skipped:
- Talk tabs (not meaningful on a personal wiki)
- Per-section `[edit]` anchors
- v1/v2 version toggle on the Welcome block
- "1 Issue" pill

Short-term polish items (nice, not critical):
- Hero images on non-person articles
- Nested sub-sections in the Contents TOC (currently flat H2 only)
- Dataview-style query blocks beyond the `/gaps` view

Done (previously "next up"):
- [x] Photo field on person articles (`photo:` → overrides silver-circle)
- [x] Manual featured-article picker (`featured: true` in frontmatter)
- [x] Production build smoke test — `VAULT_ROOT=~/Projects/vault npx astro build` succeeds cleanly

## Files

- `src/lib/vault.ts` — vault loader: md walk, frontmatter parse, slug generation, wikilink resolver, TOC extraction, search index, gap analysis, journal loaders, photo resolver, featured picker
- `src/layouts/Base.astro` — top bar + left rail + main column + footer shell
- `src/components/TopBar.astro` — logo + wordmark + search + action buttons
- `src/components/LeftRail.astro` — navigation, category counts, spotlight pages
- `src/components/StubBanner.astro` — banner for articles flagged as stubs
- `src/pages/index.astro` — home
- `src/pages/wiki/[slug].astro` — article page (one per note)
- `src/pages/category/[type].astro` — category listing
- `src/pages/tag/[tag].astro` — tag listing
- `src/pages/random.astro` — random redirect
- `src/pages/about.astro` — about page
- `src/pages/missing.astro` — broken-wikilink landing page
- `src/pages/gaps.astro` — gap analysis report
- `src/pages/today.astro` — daily journal viewer
- `src/styles/global.css` — Wikipedia-ish typography + infobox + TOC + rails

## Verification

Screenshots in `screenshots/` capture home, article-person (Rachel Shively), article-project (Men and Kings), article-reference (LifeOS Architecture), category-person, category-project, about.

## Next up

Leigh's call — natural next steps:
1. Deploy target — **Cloudflare Pages + Access** is the recommended host (zero-config SSG, Access for auth). Vercel/Netlify also viable.
2. Add `photo:` values to priority person notes and flag 3–5 notes `featured: true` to seed the curation flywheel
3. Dataview-style query blocks in arbitrary articles (e.g. "projects with status: active updated in last 14 days") beyond the `/gaps` view
