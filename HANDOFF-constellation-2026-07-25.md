# HANDOFF — WikiLeighs Constellation Redesign

**Date:** 2026-07-25 · **Author:** macbookair/claude · **State:** SHIPPED and live at `https://lgl.gg/wikileighs/`
**For:** any agent or device picking up WikiLeighs work cold. Read this before touching the repo.

## TL;DR

The Wikipedia-pastiche UI is gone. The site is now the dark "Constellation/Instrument" design: a night-sky homepage where every vault page is a star (explorable — hover shows wikilink edges, wheel zoom, drag pan, click opens), a site-wide ⌘K/Ctrl+K palette, reading-room article pages, and themed category/today/gaps/404 pages. Merged as `0130f77` on `main`, deployed via the existing GitHub Actions → Pages pipeline. **Rollback = `git revert -m 1 0130f77`.**

## Canonical documents (read in this order if going deep)

1. `docs/superpowers/specs/2026-07-24-wikileighs-constellation-redesign-design.md` — the approved design. §2 tokens, §8 preserved-behavior contract.
2. `docs/superpowers/plans/2026-07-24-constellation-redesign.md` — 12-task build plan **+ the Greene parity-verification record appended under Task 7** (method for proving Greene lessons render identically to pre-redesign).
3. `STATUS.md` — current operational status + known follow-ups.
4. `screenshots/redesign/` — 20 reference PNGs incl. ultrawide, explore-mode, palette states.

## Architecture crib sheet

- **Stack unchanged:** Astro 5 SSG → GitHub Pages behind Cloudflare Access. `base: '/wikileighs/'`. Build needs `VAULT_ROOT=/Users/leighllewelyn/Projects/vault` (or the CI checkout path) — the today-drift guard **fails closed** without it; that's intentional.
- **New pure-logic modules, all tested:** `src/lib/constellation.ts` (star positions via reverse-FNV1a slug hash, 7-day recency, `buildEdges`), `src/lib/localsky.ts` (two-band greedy-tier backlink layout, collision-free proven N=1–12), additions in `src/lib/date.ts` (NY weekday index, pure `getAdjacentTodayDates(dates, stamp)`). Test pattern: `node --experimental-strip-types --test`, wired into `npm run build`.
- **Search:** index is a static endpoint `src/pages/search-index.json.ts` → `/search-index.json`, lazy-fetched by `Palette.astro` on first open. Do NOT re-inline it into pages — the old inline-per-page pattern was 437KB × every page.
- **vault.ts:** the plan said "never modify"; two sanctioned exceptions exist and are documented in review history: `getTodayPhotoForDate` (needs private helpers) and the `getTodayPage` refactor (byte-equivalent, verified). Keep future changes out of vault.ts unless they genuinely need its private data.

## Tripwires — things that WILL bite you if you don't know them

1. **Greene lessons are a preservation contract.** They render via `.article-body.greene-lesson` with (a) ~12 `:not(.greene-lesson)` qualifiers on dark rules, (b) a `:where()` parity block restoring main-era link/th colors at exact pre-redesign cascade weights (comment in global.css explains the specificity math — read it before touching), (c) three light literals marked `/* Greene palette on main — do not migrate to tokens */`. "Cleaning up" any of these breaks 14 lesson pages subtly. A decouple refactor is chip'd; it requires re-running the parity verification in the plan doc.
2. **Recency is frontmatter, not git.** The homepage glow set reads `updated:` frontmatter because CI checks out the vault with `fetch-depth: 1` — `git log` approaches silently return nothing in CI while working locally. This bug was caught pre-merge once already; don't reintroduce it.
3. **Gaps page IDs are load-bearing:** `#stubs #orphans #broken #stale` — homepage status line links to them and automations may parse them. Totals on /gaps headers must equal the homepage status line (both computed from the same `get*(10_000)` calls).
4. **Journal rows use `e._date`,** not `updated || created` — that field drives month grouping in `category/[type].astro`. The `STATUS_BUCKETS` array + bucketing loop + month grouping are byte-preserved from pre-redesign; treat as read-only.
5. **`suggest-edit` mailto strings** (`[cc:Mac] WikiLeighs edit:` + slug + source path) are a cross-device command contract — byte-preserved, verified against main. Don't reword.
6. **Deploy timeouts:** if "Deploy to GitHub Pages" hangs in `updating_pages`, compare artifact size against prior successful runs (`gh api .../artifacts`) before engineering anything — prior good deploys were 367MB, ours is ~123MB, and a plain `gh workflow run deploy.yml` retry fixed it last time. Also: workflow actions target Node 20 (deprecated, forced to 24, still green) — version bumps are a pending nicety.
7. **Preview locally:** `npm run preview` serves `dist/` at `http://127.0.0.1:4321/wikileighs/` — the `/wikileighs/` path is mandatory; the root shows Astro's 404. Chrome may silently try https and show ERR_CONNECTION_REFUSED.

## Open work queue (chips filed in the macbookair Claude session; also in vault hot.md)

1. **`/today/archive` is ~25MB** — calendar cells inline full-res photo data URIs via `getTodayPhotoForDate` (built for single heroes). Fix: markers instead of thumbnails, or real thumbnail files. Target <200KB.
2. **Greene decouple** — remove the shared `.article-body` class from lessons, copy the ~dozen structural rules into the gl-system, delete the three protection mechanisms. Re-verify parity per the plan-doc record.
3. **Vault-side:** ~3 `journal/personal/` files begin with leaked `┌─ Reasoning ─┐` trace blocks (surface as wiki excerpts); find the writer, clean the files.
4. **Undecided (Leigh):** homepage status-line counters (1,079 stubs · 812 orphans · 120 broken) — keep or mute to /gaps only. Deployed with them ON.

## How to verify anything

```bash
cd ~/Projects/wikileighs && VAULT_ROOT=~/Projects/vault npm run build
```
Green = date tests (7) + constellation/localsky tests (38) + project-field build + ~2,494 pages + today-flag guard. Page-count parity vs main matters only ±1 (the search-index endpoint). For visual work: screenshot before/after against `screenshots/redesign/`, and never trust "looks fine" on Greene pages — use computed styles vs a main-worktree build (method in the plan doc's parity record).

## Session history

Full narrative: vault `journal/daily/20260725.md`. Design rationale trail: the spec's §1 decision log. The build ran as a reviewed pipeline (12 tasks + 2 feedback rounds, three agents per task); review findings live in the session transcript, with durable lessons in vault `machines/lessons-queue.md` (2026-07-25 entries).
