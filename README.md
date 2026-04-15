# Leighpedia

A Wikipedia-styled web reader for Leigh's Obsidian vault. Renders the `notes/` subtree as browsable articles, inspired by [Farzapedia](https://farzapedia.com).

**Not an editor.** The source of truth stays in Obsidian; Leighpedia reads the files and presents them.

## Stack

- [Astro](https://astro.build/) 5.x (static site generator, content-first)
- TypeScript (strict)
- Tailwind CSS (typography + utility classes)
- [`marked`](https://marked.js.org/) + `marked-gfm-heading-id` (markdown → HTML with heading IDs)
- [`gray-matter`](https://github.com/jonschlinkert/gray-matter) (YAML frontmatter parsing)
- [`fast-glob`](https://github.com/mrmlnc/fast-glob) (vault walk)

No database, no CMS, no build step at read time — everything is computed at Astro's SSG time from markdown files.

## Install & run

```
npm install
npm run dev      # http://127.0.0.1:4321/
```

## How it maps vault → wiki

| Vault concept | Leighpedia concept |
|---|---|
| `notes/**/*.md` | Articles |
| `notes/people/*.md` | Type `person` (silver-circle initials placeholder) |
| `notes/projects/*.md` | Type `project` |
| Frontmatter `type:` | Category (drives left-rail nav + `/category/{type}`) |
| Frontmatter `tags:` | Tag pages at `/tag/{slug}` |
| Frontmatter fields | Infobox (right-floating, Wikipedia-style) |
| H1 in body | Article title (if it matches frontmatter `title`, deduplicated) |
| H2 headings | Contents TOC entries |
| `[[Page]]`, `[[Page\|Alias]]`, `[[Page#Section]]` | Resolved wikilinks |
| Missing `[[Page]]` target | Red link (Wikipedia style) → `/missing?title=...` |
| Frontmatter `updated:` | Drives "Recently updated" ordering on home |

## Vault path

Configured in `src/lib/vault.ts` as `VAULT_ROOT = 'C:/Users/leigh/Documents/leigh-vault'`. Change that one constant if the vault moves.

Excluded subtrees (by design — this is a reader for the wiki, not journal or inbox):
- `Private/`, `_local-*/`, `archive/`, `inbox/`, `journal/`, `attachments/`

## Project layout

```
src/
  layouts/Base.astro           — top bar + left rail + main column + footer
  components/
    TopBar.astro               — logo, wordmark, search, Random/About buttons
    LeftRail.astro             — nav, categories, spotlight pages
  lib/vault.ts                 — single source of truth for vault loading
  pages/
    index.astro                — home
    wiki/[slug].astro          — article page
    category/[type].astro      — category listing
    tag/[tag].astro            — tag listing
    random.astro               — random article redirect
    about.astro                — about
    missing.astro              — broken-wikilink landing
  styles/global.css            — Wikipedia-ish typography + infobox + TOC
astro.config.mjs
tailwind.config.mjs
tsconfig.json
```

## Visual conventions

- **Serif body type** (`Linux Libertine` / `Georgia`) for article content — Wikipedia feel.
- **Sans-serif chrome** (`-apple-system` / `Segoe UI`) for navigation, search, infobox.
- **Purple accent** on Featured article header (Farzapedia-style).
- **Silver-circle initials** for person articles without a `photo:` frontmatter field.
- Links: blue for resolvable, visited purple, broken wikilinks red.

## STATUS.md

See `STATUS.md` for current state, what's built, what's next.
