# Leighpedia — STATUS

**Updated:** 2026-04-14 (overnight build)
**Status:** MVP running on dev server

## What it is

A Wikipedia-styled web reader for the Obsidian vault at `C:/Users/leigh/Documents/leigh-vault/`.
Scoped to the `notes/` subtree. Frontmatter drives categorization; `[[wikilinks]]` become navigation; H2 headings build a Contents box; frontmatter fields populate an infobox. Visual target: Farza Majeed's Farzapedia.

## How to run

Dev server (default — hot reload on markdown/code edits):
```
cd ~/projects/leighpedia
npm run dev
# -> http://127.0.0.1:4321/
```

Static build (not yet optimized for paths, dev server is the intended experience for now):
```
npm run build
npm run preview
```

## What works

- Home page: welcome + stats + Featured article + Recently updated + About + Browse by category
- Article pages: breadcrumb (`{type} · created {date} · updated {date}`), H1, tab bar, body, right-floating infobox, numbered Contents TOC
- Person articles show a silver-circle initials placeholder when there's no image (Farzapedia pattern)
- Category/type listing pages at `/category/{type}` grouped by first letter with two-column layout
- Tag listings at `/tag/{slug}`
- Wikilink resolution: `[[Page]]`, `[[Page|Alias]]`, `[[Page#Section]]` resolve across the vault's slug namespace; broken links render in red (Wikipedia style)
- "What links here" reverse-link section at the bottom of every article
- Client-side search in the top bar (title + aliases + tags + first-paragraph excerpt)
- Random article link (`/random`)
- Left-rail nav with category list (by type, counts shown) and a sampling of pages

## Vault scope

Reads only:
- `notes/**/*.md`

Excludes (intentionally):
- `Private/`, `_local-*/`, `archive/`, `inbox/`, `journal/`, `attachments/`
- Any file whose relative path starts with `_`

## Content counts (at last build)

~161 articles across 10 types (person, project, reference, concept, map, idea, research, plan, index, report).

## Known gaps / MVP exclusions

Deliberately skipped:
- Talk tabs (not meaningful on a personal wiki)
- Per-section `[edit]` anchors
- v1/v2 version toggle on the Welcome block
- "1 Issue" pill

Short-term polish items (nice, not critical):
- Hero images on articles (the silver-circle falls back when no image is set; adding a `photo:` frontmatter field is the next step)
- Nested sub-sections in the Contents TOC (currently flat H2 only)
- Featured article selector currently just picks the longest non-report article — will want manual curation later
- Production static build has not been smoke-tested (dev server is the intended experience)

## Files

- `src/lib/vault.ts` — vault loader: md walk, frontmatter parse, slug generation, wikilink resolver, TOC extraction, search index
- `src/layouts/Base.astro` — top bar + left rail + main column + footer shell
- `src/components/TopBar.astro` — logo + wordmark + search + action buttons
- `src/components/LeftRail.astro` — navigation, category counts, spotlight pages
- `src/pages/index.astro` — home
- `src/pages/wiki/[slug].astro` — article page (one per note)
- `src/pages/category/[type].astro` — category listing
- `src/pages/tag/[tag].astro` — tag listing
- `src/pages/random.astro` — random redirect
- `src/pages/about.astro` — about page
- `src/pages/missing.astro` — broken-wikilink landing page
- `src/styles/global.css` — Wikipedia-ish typography + infobox + TOC + rails

## Verification

Screenshots in `screenshots/` capture home, article-person (Rachel Shively), article-project (Men and Kings), article-reference (LifeOS Architecture), category-person, category-project, about. Compared against Farza 1/2/3 reference screenshots on Desktop.

## Next up

Leigh's call — but natural next steps are:
1. Add photos to person articles (frontmatter `photo:` → overrides silver-circle)
2. Manual Featured-article picker (`featured: true` in frontmatter or a small curation file)
3. Production build + deploy target (Cloudflare Pages / Vercel / local-only?)
4. Dataview-style query blocks (e.g. surface "projects with status: active updated in last 14 days")
