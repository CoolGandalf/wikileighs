# WikiLeighs — STATUS

**Updated:** 2026-07-25 (macbookair, branch `main`) — **Constellation redesign LIVE**
**Status:** LIVE at `https://lgl.gg/wikileighs/` behind Cloudflare Access (only `leigh.llewelyn@gmail.com`, email OTP). Deployed via merge `0130f77`; **rollback = revert that merge commit.** ~2,494 pages.

## Current design (2026-07-25): "Constellation / The Instrument"

Dark ink + gold/verdigris, IBM Plex Mono chrome + Newsreader reading serif (self-hosted fontsource). Spec: `docs/superpowers/specs/2026-07-24-wikileighs-constellation-redesign-design.md` · Plan (+ Greene parity-verification record): `docs/superpowers/plans/2026-07-24-constellation-redesign.md` · Screenshots: `screenshots/redesign/`.

- **Homepage** = explorable night sky: every page a star (deterministic slug-hash positions, `src/lib/constellation.ts`), gold glow = updated ≤7d (frontmatter, NOT git — CI vault checkout is shallow), hover shows wikilink edge-fans (2,839 edges), wheel zoom / drag pan / click navigates; canvas field + capped-40 DOM stars; status line = vault health → /gaps.
- **⌘K / Ctrl+K / `/` palette** site-wide; empty state = old left-rail contents; index externalized to `/search-index.json` (lazy-fetched — pages are ~95% lighter than the old inline-index era); typing on the homepage auto-opens seeded; static routes (foundation/today/gaps/…) searchable.
- **Articles** = reading room: dossier (infobox reborn), sticky scrollable TOC, local-sky 1-hop backlink SVG (`src/lib/localsky.ts`, collision-free layout), true backlink counts, broken wikilinks dimmed+dashed. **Greene lessons untouched by contract** — pixel-parity with pre-redesign main (`:where()` parity block in global.css; do not "clean up" the light literals marked with comments).
- **Category/tag** = mono indexes, Recent/A–Z toggle; project keeps all 7 status buckets. **Today** = verdigris + illustration wash + calendar archive. **Gaps** = "unlit sky", IDs `#stubs #orphans #broken #stale` stable. **404** = uncharted star (?title= now actually works in prod — was dev-only).

## Known follow-ups

- `/today/archive` is ~25MB (full-res data-URI thumbnails in calendar cells) — chip filed; markers-or-thumbnails fix.
- Greene `.article-body` decouple (post-redesign refactor) — chip filed; re-run the parity verification after.
- Deploy workflow: actions target Node 20 (deprecated, forced to 24, working) — bump versions.
- Homepage vault-health counters (1,079 stubs …) — Leigh may want them muted to /gaps only.
- First deploy attempt of the redesign timed out in Pages `updating_pages` (transient; prior successful artifacts were 3× larger at 367MB vs ours 123MB). If it recurs: retry via `gh workflow run deploy.yml` before engineering anything.

---

## Pre-redesign history (kept for reference)

## What was done this session (2026-04-26 afternoon, pre-flight LGA — Cortana)

- `src/pages/category/[type].astro`: when `type === 'project'`, prepend a status-grouped overview table (Project / Updated / Summary) before the existing alphabetical list. Buckets: Active, In progress, Paused, Planned/Ideas, Shipped, Archived, Other — empty buckets are not rendered. Within each bucket, items sort by `updated:` desc. All other category pages (concept, person, etc.) unchanged. Build verified locally (1362 pages, 12.88s). Commit `b3fde9a`, pushed to origin/main → deploy pipeline triggered.

## Next up (added this session)

- `notes/Project Status Dashboard.md` partially obsolete — Active/Planned/Paused tables now duplicated by the live page; future pass should shrink it to just the supplementary content (GitHub repo URLs, tech stacks, live URLs, Infrastructure repos) and link the live page for status.
- Frontmatter normalization: 5 shipped projects (Keats, StoicBot, Pillars, Core Compass, ForceRank) carry `status: active`. Flip them to `status: shipped` to surface a Shipped bucket on the live page.

## Deploy architecture (2026-04-19)

- **Hosting:** GitHub Pages (repo set to **public** 2026-04-17). Project-pages URL `CoolGandalf.github.io/wikileighs/` auto-301s to `lgl.gg/wikileighs/` (inheriting the landing-page repo's CNAME). Seneca pattern.
- **DNS:** Cloudflare zone (moved from Porkbun 2026-04-17). Nameservers `cody.ns.cloudflare.com` + `indie.ns.cloudflare.com`. A records Proxied (orange cloud). SSL mode Full (strict).
- **Auth:** Cloudflare Access application on `lgl.gg/wikileighs/*`. Team `coolgandalf.cloudflareaccess.com`. Policy: Allow → email `leigh.llewelyn@gmail.com`. Auth: One-time PIN (email OTP).
- **Build pipeline:** `.github/workflows/deploy.yml`. Triggers on push to main, manual `workflow_dispatch`, or `repository_dispatch(vault-changed)`. Checks out wikileighs + leigh-wiki (via `VAULT_READ_TOKEN` fine-grained PAT, Contents: Read, 90-day expiration). Runs `npm ci` + `npm run build`, deploys to GitHub Pages.
- **Subpath config:** `astro.config.mjs` has `base: '/wikileighs/'`. All internal links use `import.meta.env.BASE_URL` + relative path. Inline TopBar search script receives BASE_URL via `define:vars`.
- **Change-request loop:** Every article page has a "✎ Suggest edit" tab → opens `mailto:leigh.llewelyn@gmail.com` with `[cc:Mac] WikiLeighs edit: <title>` subject + body containing page title, slug, and source path. Routes through existing Monitor → Cortana/Librarian pickup. First live use 2026-04-19 (XDA article capture).

## Pending

- **Today page: Reminders display bug** — section shows reminder LIST names ("Shopping, Reminders, Alexa To Do List, Todoist, Evernote, IFTTT") instead of items. `gather.sh` reminders parser needs to match the right shape from `remindctl list --json`.
- **Today page: Vault content section is noisy** — surfaces system/scratch files (`Untitled 2.canvas`, `STATUS.md`, `hot.md`, `notify-wikileighs.yml`). Filter system files in `gather.sh` and/or the agent prompt.
- **Rotate `WIKILEIGHS_DISPATCH_PAT` before 2026-07-18** (90-day expiry; recorded in `notes/API Keys/API Keys.md`).
- **Rotate `VAULT_READ_TOKEN`** — separate token, expires ~2026-07-16.
- **Node 20 deprecation** in Action — GH forcing Node 24 in June 2026. Non-blocking.

## What was done this session (2026-04-19 evening)

- New routes: `src/pages/today.astro` (replaced live computation with snapshot loader + fallback), `src/pages/today/[date].astro` (archive route via `getStaticPaths`).
- New `src/lib/vault.ts` helpers: `getTodayPage(date)`, `listTodayPageDates()`. Plus extended `loadAllArticles()` to glob `journal/personal/*.md` so voice memos become first-class articles (type `voice-memo`, stubs <20 words filtered, humanized title, slug-style baseName aliased so `[[2026-04-19-121450]]` resolves).
- Spec + plan committed under `docs/superpowers/{specs,plans}/`.
- Auto-deploy chain: vault-side `.github/workflows/notify-wikileighs.yml` fires `repository_dispatch(vault-changed)` on push; wikileighs `deploy.yml` already listened for it.

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
