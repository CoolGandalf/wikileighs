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

let CACHE: { articles: Article[]; byTitle: Map<string, Article>; bySlug: Map<string, Article> } | null = null;

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
        return `<a class="wikilink" href="/wiki/${resolved.slug}${anchor}">${escapeHtml(label)}</a>`;
      }
      return `<a class="wikilink wikilink-broken" href="/missing?title=${encodeURIComponent(target.trim())}" title="Page does not exist">${escapeHtml(label)}</a>`;
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
  const hidden = new Set(['title', 'body']);
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

export function getFeaturedArticle(): Article | undefined {
  const pool = loadAllArticles().filter((a) => a.wordCount > 400 && !a.relPath.startsWith('_') && a.type !== 'report');
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
