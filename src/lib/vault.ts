import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';

const VAULT_ROOT = process.env.VAULT_ROOT;
if (!VAULT_ROOT) {
  throw new Error(
    'VAULT_ROOT env var is not set. Point it at your local vault, e.g.\n' +
    '  macOS/Linux:  export VAULT_ROOT=/Users/you/Projects/vault\n' +
    '  Windows PS:   $env:VAULT_ROOT="C:/Users/you/Documents/leigh-vault"\n' +
    'See .env.example for details.'
  );
}
const NOTES_ROOT = path.join(VAULT_ROOT, 'notes');

export interface Article {
  slug: string;
  title: string;
  type: string;
  tags: string[];
  status: string | null;
  created: string | null;
  updated: string | null;
  source: string | null;
  related: string[];
  aliases: string[];
  infobox: Record<string, unknown>;
  bodyMd: string;
  html: string;
  toc: TocEntry[];
  outbound: string[];
  relPath: string;
  wordCount: number;
  hasImage: boolean;
  firstParagraph: string;
  /**
   * Resolved photo src for the person-article infobox. Set via frontmatter
   * `photo:`. Absolute URLs (http/https/data:) pass through; relative paths
   * resolve against `$VAULT_ROOT/attachments/` and are inlined as data URIs at
   * build time. Null if unset or the file could not be read.
   */
  photo: string | null;
  /** True if frontmatter `featured: true` was set (manual Featured curator). */
  featured: boolean;
}

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019\u201C\u201D]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeTitle(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, ' ');
}

function asStringArray(val: unknown): string[] {
  if (val == null) return [];
  if (Array.isArray(val)) return val.map((x) => String(x)).filter(Boolean);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    return [trimmed];
  }
  return [];
}

function coerceString(val: unknown): string | null {
  if (val == null) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val);
}

function extractWikilinks(md: string): Array<{ raw: string; target: string; alias?: string; heading?: string }> {
  const out: Array<{ raw: string; target: string; alias?: string; heading?: string }> = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const inner = m[1];
    const [targetPart, aliasPart] = inner.split('|');
    const [baseTarget, heading] = targetPart.split('#');
    out.push({
      raw: m[0],
      target: baseTarget.trim(),
      heading: heading?.trim(),
      alias: aliasPart?.trim(),
    });
  }
  return out;
}

function extractFirstParagraph(md: string): string {
  const lines = md.split('\n');
  let started = false;
  const buf: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!started) {
      if (trimmed.startsWith('#') || !trimmed) continue;
      started = true;
      buf.push(trimmed);
    } else {
      if (!trimmed) break;
      if (trimmed.startsWith('#')) break;
      buf.push(trimmed);
    }
  }
  return buf
    .join(' ')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, a) => a || t)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .slice(0, 320);
}

function extractTocFromMd(md: string, toSlug: (t: string) => string): TocEntry[] {
  const out: TocEntry[] = [];
  const lines = md.split('\n');
  let inCode = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^```/.test(line.trim())) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = /^(#{1,4})\s+(.+)$/.exec(line);
    if (!m) continue;
    const level = m[1].length;
    if (level < 2) continue;
    const text = m[2]
      .replace(/\s*\[edit\]\s*$/i, '')
      .replace(/\s+#+\s*$/, '')
      .trim();
    if (!text) continue;
    out.push({ id: toSlug(text), text, level });
  }
  return out;
}

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function detectImage(md: string): boolean {
  return /!\[[^\]]*\]\([^)]+\)|<img\s/i.test(md);
}

const PHOTO_MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

/**
 * Resolve a frontmatter `photo:` value to something usable as an <img src=…>.
 * - Absolute URLs (http, https, data:) pass through untouched.
 * - Relative paths resolve against `$VAULT_ROOT/attachments/` and get inlined
 *   as base64 data URIs at build time (SSG output contains no external asset
 *   deps). Missing or unreadable files return null so the caller can fall back
 *   to the silver-circle initials.
 */
function resolvePhoto(raw: unknown): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (/^(?:https?:|data:)/i.test(value)) return value;
  const cleaned = value.replace(/^\/+/, '').replace(/^attachments[\\/]/i, '');
  const abs = path.join(VAULT_ROOT!, 'attachments', cleaned);
  try {
    const buf = fs.readFileSync(abs);
    const ext = path.extname(abs).toLowerCase();
    const mime = PHOTO_MIME_BY_EXT[ext] || 'application/octet-stream';
    if (ext === '.svg') {
      return `data:${mime};utf8,${encodeURIComponent(buf.toString('utf8'))}`;
    }
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

function coerceBool(val: unknown): boolean {
  if (val === true) return true;
  if (typeof val === 'string') return /^(true|yes|1)$/i.test(val.trim());
  return false;
}

let CACHE: { articles: Article[]; byTitle: Map<string, Article>; bySlug: Map<string, Article> } | null = null;

export function clearCache() {
  CACHE = null;
}

export function loadAllArticles(): Article[] {
  return getCache().articles;
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getCache().bySlug.get(slug);
}

export function resolveWikilink(target: string): Article | undefined {
  const cache = getCache();
  return cache.byTitle.get(normalizeTitle(target));
}

function getCache() {
  if (CACHE) return CACHE;

  const files = fg.sync(['**/*.md'], {
    cwd: NOTES_ROOT,
    onlyFiles: true,
    absolute: true,
    dot: false,
  });

  const articles: Article[] = [];
  const byTitle = new Map<string, Article>();
  const bySlug = new Map<string, Article>();

  for (const abs of files) {
    const rel = path.relative(NOTES_ROOT, abs).replace(/\\/g, '/');
    if (rel.startsWith('_') || rel.includes('/_')) continue;

    let raw: string;
    try {
      raw = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }

    const parsed = matter(raw);
    const fm = parsed.data as Record<string, unknown>;
    let bodyMd = parsed.content;

    const titleFromFm = coerceString(fm.title);
    const baseNameForStrip = path.basename(abs, '.md');
    const effectiveTitle = titleFromFm || baseNameForStrip;
    const h1Re = /^\s*#\s+(.+?)\s*$/m;
    const h1Match = h1Re.exec(bodyMd);
    if (h1Match && normalizeTitle(h1Match[1]) === normalizeTitle(effectiveTitle)) {
      bodyMd = bodyMd.replace(h1Re, '').replace(/^\s*\n+/, '');
    }

    const baseName = path.basename(abs, '.md');
    const title = coerceString(fm.title) || baseName;
    const slug = slugify(baseName);
    if (!slug) continue;
    if (bySlug.has(slug)) continue;

    const type = (coerceString(fm.type) || inferType(rel)).toLowerCase();
    const tags = asStringArray(fm.tags);
    const related = asStringArray(fm.related).map((w) =>
      w.replace(/^\[\[/, '').replace(/\]\]$/, '').split('|')[0].trim()
    );
    const aliases = asStringArray(fm.aliases);

    const infobox = buildInfobox(fm);

    const firstParagraph = extractFirstParagraph(bodyMd);

    const article: Article = {
      slug,
      title,
      type,
      tags,
      status: coerceString(fm.status),
      created: coerceString(fm.created),
      updated: coerceString(fm.updated),
      source: coerceString(fm.source),
      related,
      aliases,
      infobox,
      bodyMd,
      html: '',
      toc: [],
      outbound: [],
      relPath: rel,
      wordCount: countWords(bodyMd),
      hasImage: detectImage(bodyMd),
      firstParagraph,
      photo: resolvePhoto(fm.photo),
      featured: coerceBool(fm.featured),
    };

    articles.push(article);
    bySlug.set(slug, article);
    byTitle.set(normalizeTitle(title), article);
    byTitle.set(normalizeTitle(baseName), article);
    for (const a of aliases) byTitle.set(normalizeTitle(a), article);
  }

  for (const article of articles) {
    const outbound = new Set<string>();
    const links = extractWikilinks(article.bodyMd);
    let md = article.bodyMd;

    md = md.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
      const [targetPart, alias] = inner.split('|');
      const [target, heading] = targetPart.split('#');
      const label = (alias || targetPart).trim();
      const resolved = byTitle.get(normalizeTitle(target.trim()));
      if (resolved) {
        outbound.add(resolved.slug);
        const anchor = heading ? `#${slugify(heading)}` : '';
        return `<a class="wikilink" href="${import.meta.env.BASE_URL}wiki/${resolved.slug}${anchor}">${escapeHtml(label)}</a>`;
      }
      return `<a class="wikilink wikilink-broken" href="${import.meta.env.BASE_URL}missing?title=${encodeURIComponent(target.trim())}" title="Page does not exist">${escapeHtml(label)}</a>`;
    });

    const marked = new Marked({ gfm: true, breaks: false });
    marked.use(gfmHeadingId());
    article.html = marked.parse(md) as string;
    article.toc = extractTocFromMd(article.bodyMd, slugify);
    article.outbound = Array.from(outbound);
    for (const l of links) void l;
  }

  CACHE = { articles, byTitle, bySlug };
  return CACHE;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function inferType(relPath: string): string {
  if (relPath.startsWith('people/')) return 'person';
  if (relPath.startsWith('projects/')) return 'project';
  return 'reference';
}

function buildInfobox(fm: Record<string, unknown>): Record<string, unknown> {
  // `photo` is rendered as the infobox hero image; `featured` is a curator flag
  // consumed by getFeaturedArticle — neither belongs as a visible table row.
  const hidden = new Set(['title', 'body', 'photo', 'featured']);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fm)) {
    if (hidden.has(k)) continue;
    if (v == null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export interface TypeCount {
  type: string;
  count: number;
}

export function getTypeCounts(): TypeCount[] {
  const map = new Map<string, number>();
  for (const a of loadAllArticles()) {
    map.set(a.type, (map.get(a.type) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

export function getArticlesByType(type: string): Article[] {
  const norm = type.toLowerCase();
  return loadAllArticles()
    .filter((a) => a.type === norm)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getRecentArticles(n = 8): Article[] {
  return loadAllArticles()
    .filter((a) => a.updated)
    .sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))
    .slice(0, n);
}

/**
 * Top-N articles by `updated:` date, excluding meta/index types that aren't
 * meaningful as "activity" signals (map, index, log). Used by the homepage
 * Recently-updated feed.
 */
const RECENT_EXCLUDED_TYPES = new Set(['map', 'index', 'log']);

export function getRecentlyUpdated(n = 8): Article[] {
  return loadAllArticles()
    .filter((a) => a.updated && !RECENT_EXCLUDED_TYPES.has(a.type))
    .sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))
    .slice(0, n);
}

/**
 * Pick the Featured article for the home page.
 *
 * Resolution order:
 *   1. Any article with frontmatter `featured: true` — if multiple are flagged,
 *      the one with the most recent `updated:` wins (falls back to `created:`,
 *      then title).
 *   2. Otherwise, the longest non-report article with wordCount > 400.
 *
 * Flip curation by editing the note: add `featured: true` in the YAML
 * frontmatter. Remove or set `false` to return to the automatic pick.
 */
export function getFeaturedArticle(): Article | undefined {
  const all = loadAllArticles();
  const manual = all.filter((a) => a.featured && !a.relPath.startsWith('_'));
  if (manual.length) {
    manual.sort((a, b) => {
      const bu = b.updated || b.created || '';
      const au = a.updated || a.created || '';
      if (bu !== au) return bu.localeCompare(au);
      return a.title.localeCompare(b.title);
    });
    return manual[0];
  }
  const pool = all.filter((a) => a.wordCount > 400 && !a.relPath.startsWith('_') && a.type !== 'report');
  pool.sort((a, b) => b.wordCount - a.wordCount);
  return pool[0];
}

export function getAllSlugs(): string[] {
  return loadAllArticles().map((a) => a.slug);
}

export function getIncomingLinks(slug: string): Article[] {
  return loadAllArticles()
    .filter((a) => a.outbound.includes(slug) && a.slug !== slug)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getSearchIndex(): Array<{ slug: string; title: string; type: string; aliases: string[]; tags: string[]; excerpt: string }> {
  return loadAllArticles().map((a) => ({
    slug: a.slug,
    title: a.title,
    type: a.type,
    aliases: a.aliases,
    tags: a.tags,
    excerpt: a.firstParagraph.slice(0, 160),
  }));
}

export function pickRandomSlug(): string {
  const all = loadAllArticles();
  if (!all.length) return '';
  return all[Math.floor(Math.random() * all.length)].slug;
}

export function humanizeType(type: string): string {
  return type
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function pluralizeType(type: string): string {
  const lower = type.toLowerCase();
  const overrides: Record<string, string> = {
    person: 'People',
    people: 'People',
    research: 'Research',
    index: 'Indexes',
    bookshelf: 'Bookshelves',
    entity: 'Entities',
  };
  if (overrides[lower]) return overrides[lower];
  const h = humanizeType(type);
  if (/(s|x|z|ch|sh)$/i.test(h)) return h + 'es';
  if (/[^aeiou]y$/i.test(h)) return h.slice(0, -1) + 'ies';
  return h + 's';
}

// --- Gap analysis helpers ---------------------------------------------------

const STUB_BODY_LINE_THRESHOLD = 40;
const STUB_WORD_COUNT_THRESHOLD = 80;
const STUB_EXEMPT_TYPES = new Set(['map', 'index', 'commonplace-book']);

function nonEmptyBodyLines(bodyMd: string): number {
  return bodyMd
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^---+$/.test(l))
    .length;
}

export function isStub(article: Article): boolean {
  if (STUB_EXEMPT_TYPES.has(article.type)) return false;
  const lines = nonEmptyBodyLines(article.bodyMd);
  return lines < STUB_BODY_LINE_THRESHOLD || article.wordCount < STUB_WORD_COUNT_THRESHOLD;
}

export function getInboundLinkCount(slug: string): number {
  let n = 0;
  for (const a of loadAllArticles()) {
    if (a.slug === slug) continue;
    if (a.outbound.includes(slug)) n++;
  }
  return n;
}

export function getStubs(limit = 30): Array<Article & { inboundCount: number }> {
  const all = loadAllArticles();
  const stubs = all.filter(isStub);
  const inbound = new Map<string, number>();
  for (const a of all) {
    for (const out of a.outbound) {
      if (out === a.slug) continue;
      inbound.set(out, (inbound.get(out) || 0) + 1);
    }
  }
  return stubs
    .map((a) => ({ ...a, inboundCount: inbound.get(a.slug) || 0 }))
    .sort((a, b) => b.inboundCount - a.inboundCount || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export function getOrphans(limit = 30): Article[] {
  const all = loadAllArticles();
  const referenced = new Set<string>();
  for (const a of all) {
    for (const out of a.outbound) referenced.add(out);
  }
  return all
    .filter((a) => !referenced.has(a.slug))
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, limit);
}

const BROKEN_TEMPLATE_ARTIFACTS = new Set<string>([
  '{t}',
  '{target}',
  'entity name',
  'topic-name',
  'wikilink',
  'related page 1',
  'related page 2',
  'linked entity 1',
  'linked entity 2',
]);

export function getBrokenWikilinks(
  limit = 30,
): Array<{ target: string; sourceCount: number; sources: string[] }> {
  const cache = getCache();
  const broken = new Map<string, { target: string; sources: Set<string> }>();
  for (const a of cache.articles) {
    const links = extractWikilinks(a.bodyMd);
    for (const l of links) {
      const target = l.target;
      if (!target) continue;
      const lowered = target.toLowerCase().trim();
      if (BROKEN_TEMPLATE_ARTIFACTS.has(lowered)) continue;
      if (cache.byTitle.has(normalizeTitle(target))) continue;
      const key = target.trim();
      if (!broken.has(key)) broken.set(key, { target: key, sources: new Set() });
      broken.get(key)!.sources.add(a.slug);
    }
  }
  return Array.from(broken.values())
    .map((b) => ({ target: b.target, sourceCount: b.sources.size, sources: Array.from(b.sources) }))
    .sort((a, b) => b.sourceCount - a.sourceCount || a.target.localeCompare(b.target))
    .slice(0, limit);
}

export function getStaleActiveProjects(daysStale = 14, now: Date = new Date()): Article[] {
  const cutoff = new Date(now.getTime() - daysStale * 24 * 60 * 60 * 1000);
  return loadAllArticles()
    .filter((a) => a.type === 'project')
    .filter((a) => (a.status || '').toLowerCase() === 'active')
    .filter((a) => {
      if (!a.updated) return true;
      const d = new Date(a.updated);
      if (isNaN(d.getTime())) return false;
      return d < cutoff;
    })
    .sort((a, b) => (a.updated || '').localeCompare(b.updated || ''));
}

// --- Time-series loaders (journal/daily and journal/personal) ---------------

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatYMDCompact(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

function formatYMDDashed(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function renderMarkdownStandalone(md: string): string {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use(gfmHeadingId());
  // Render bare wikilinks as plain text since these files live outside the article graph.
  const replaced = md.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const [targetPart, alias] = String(inner).split('|');
    const label = (alias || targetPart.split('#')[0] || '').trim();
    const target = targetPart.split('#')[0].trim();
    const resolved = getCache().byTitle.get(normalizeTitle(target));
    if (resolved) {
      return `<a class="wikilink" href="${import.meta.env.BASE_URL}wiki/${resolved.slug}">${escapeHtml(label)}</a>`;
    }
    return `<a class="wikilink wikilink-broken" href="${import.meta.env.BASE_URL}missing?title=${encodeURIComponent(target)}" title="Page does not exist">${escapeHtml(label)}</a>`;
  });
  return marked.parse(replaced) as string;
}

function loadStandaloneMdFile(absPath: string, relPath: string): Article | null {
  let raw: string;
  try {
    raw = fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
  const parsed = matter(raw);
  const fm = parsed.data as Record<string, unknown>;
  let bodyMd = parsed.content;
  const baseName = path.basename(absPath, '.md');
  const titleFromFm = coerceString(fm.title);
  const effectiveTitle = titleFromFm || baseName;
  const h1Re = /^\s*#\s+(.+?)\s*$/m;
  const h1Match = h1Re.exec(bodyMd);
  if (h1Match && normalizeTitle(h1Match[1]) === normalizeTitle(effectiveTitle)) {
    bodyMd = bodyMd.replace(h1Re, '').replace(/^\s*\n+/, '');
  }
  const slug = slugify(baseName);
  const article: Article = {
    slug,
    title: titleFromFm || baseName,
    type: (coerceString(fm.type) || 'journal').toLowerCase(),
    tags: asStringArray(fm.tags),
    status: coerceString(fm.status),
    created: coerceString(fm.created),
    updated: coerceString(fm.updated),
    source: coerceString(fm.source),
    related: asStringArray(fm.related).map((w) => w.replace(/^\[\[/, '').replace(/\]\]$/, '').split('|')[0].trim()),
    aliases: asStringArray(fm.aliases),
    infobox: buildInfobox(fm),
    bodyMd,
    html: renderMarkdownStandalone(bodyMd),
    toc: extractTocFromMd(bodyMd, slugify),
    outbound: [],
    relPath,
    wordCount: countWords(bodyMd),
    hasImage: detectImage(bodyMd),
    firstParagraph: extractFirstParagraph(bodyMd),
  };
  return article;
}

export function getDailyNote(date: Date): Article | null {
  const stamp = formatYMDCompact(date);
  const abs = path.join(VAULT_ROOT!, 'journal', 'daily', `${stamp}.md`);
  if (!fs.existsSync(abs)) return null;
  return loadStandaloneMdFile(abs, `journal/daily/${stamp}.md`);
}

export function getVoiceMemosForDate(date: Date): Article[] {
  const stamp = formatYMDDashed(date);
  const dir = path.join(VAULT_ROOT!, 'journal', 'personal');
  if (!fs.existsSync(dir)) return [];
  const files = fg.sync([`${stamp}*.md`], { cwd: dir, onlyFiles: true, absolute: true });
  const out: Article[] = [];
  for (const abs of files) {
    const rel = `journal/personal/${path.basename(abs)}`;
    const a = loadStandaloneMdFile(abs, rel);
    if (a) out.push(a);
  }
  out.sort((a, b) => a.slug.localeCompare(b.slug));
  return out;
}

export function getCleanTranscriptPreview(bodyMd: string, maxLines = 5): string[] {
  const lines = bodyMd.split('\n');
  let i = 0;
  // Look for "Clean Transcript" heading; fallback to first content lines.
  const cleanIdx = lines.findIndex((l) => /^##+\s*clean\s*transcript/i.test(l.trim()));
  if (cleanIdx >= 0) i = cleanIdx + 1;
  const out: string[] = [];
  for (; i < lines.length && out.length < maxLines; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (/^#{1,6}\s/.test(t)) {
      if (out.length > 0) break;
      continue;
    }
    out.push(t);
  }
  return out;
}

export function getTodos(): string {
  const abs = path.join(NOTES_ROOT, 'TODO.md');
  if (!fs.existsSync(abs)) return '';
  try {
    const raw = fs.readFileSync(abs, 'utf8');
    const parsed = matter(raw);
    let body = parsed.content;
    const h1Re = /^\s*#\s+TODO\s*$/im;
    body = body.replace(h1Re, '').replace(/^\s*\n+/, '');
    return renderMarkdownStandalone(body);
  } catch {
    return '';
  }
}

export function formatInfoboxValue(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) {
    return v
      .map((x) => String(x).replace(/^\[\[/, '').replace(/\]\]$/, ''))
      .join(', ');
  }
  const s = String(v);
  const wm = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/.exec(s.trim());
  if (wm) return wm[2] || wm[1];
  return s;
}

export function getInfoboxAsPairs(a: Article): Array<{ key: string; value: string; wikilinkSlug?: string }> {
  const order = ['type', 'status', 'created', 'updated', 'tags', 'source', 'related'];
  const entries: Array<{ key: string; value: string; wikilinkSlug?: string }> = [];
  const seen = new Set<string>();
  const push = (k: string, v: unknown) => {
    if (seen.has(k)) return;
    seen.add(k);
    const val = formatInfoboxValue(v);
    if (!val) return;
    entries.push({ key: k, value: val });
  };
  for (const k of order) {
    if (k in a.infobox) push(k, a.infobox[k]);
  }
  for (const [k, v] of Object.entries(a.infobox)) {
    if (order.includes(k)) continue;
    push(k, v);
  }
  return entries;
}
