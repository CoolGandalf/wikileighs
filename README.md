# WikiLeighs

A Wikipedia-styled web reader for Leigh's Obsidian vault. Renders the `notes/` subtree as browsable articles, inspired by [Farzapedia](https://farzapedia.com).

**Not an editor.** The source of truth stays in Obsidian; WikiLeighs reads the files and presents them.

## Stack

- [Astro](https://astro.build/) 5.x (static site generator, content-first)
- TypeScript (strict)
- Tailwind CSS (typography + utility classes)
- [`marked`](https://marked.js.org/) + `marked-gfm-heading-id` (markdown → HTML with heading IDs)
- [`gray-matter`](https://github.com/jonschlinkert/gray-matter) (YAML frontmatter parsing)
- [`fast-glob`](https://github.com/mrmlnc/fast-glob) (vault walk)

No database, no CMS, no build step at read time — everything is computed at Astro's SSG time from markdown files.

## Install & run

WikiLeighs reads your vault via the `VAULT_ROOT` env var — it has no default, so you must point it at the vault before running anything.

```
npm install
VAULT_ROOT=~/Projects/vault npx astro dev      # http://127.0.0.1:4321/
```

Static build:

```
VAULT_ROOT=~/Projects/vault npx astro build
```

On Windows PowerShell:

```
$env:VAULT_ROOT = "C:/Users/you/Documents/your-vault"
npx astro dev
```

See `.env.example` for details.

## How it maps vault → wiki

| Vault concept | WikiLeighs concept |
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

Set `VAULT_ROOT` in the environment. `src/lib/vault.ts` reads it at startup and throws if it's unset — there is no default. Keep the path in a shell profile, `direnv`, or a `.env` file (see `.env.example`).

Excluded subtrees (by design — this is a reader for the wiki, not journal or inbox):
- `Private/`, `_local-*/`, `archive/`, `inbox/`, `journal/`, `attachments/`

Relative `photo:` values on person notes resolve against `$VAULT_ROOT/attachments/` and are inlined as base64 data URIs at build time.

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
- **Person photos** render from the `photo:` frontmatter field (relative path → `$VAULT_ROOT/attachments/…`, absolute URL passes through). Falls back to silver-circle initials if unset or the file can't be read.
- Links: blue for resolvable, visited purple, broken wikilinks red.

## STATUS.md

See `STATUS.md` for current state, what's built, what's next.
