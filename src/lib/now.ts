import type { Article } from './vault';

export interface NowLoop {
  article: Article;
  label: string;
  text: string;
}

export interface NowReceipt {
  article: Article;
  text: string;
}

export interface NowData {
  recent: Article[];
  projects: Article[];
  loops: NowLoop[];
  receipts: NowReceipt[];
  resurfaced: Article | null;
}

const RECENT_EXCLUDED = new Set(['map', 'index', 'log']);
const RESURFACE_EXCLUDED = new Set(['voice-memo', 'journal', 'today', 'report', 'map', 'index', 'log']);
const ACTIVE_STATUSES = new Set(['active', 'active-live', 'in-progress', 'in progress']);
const LOOP_HEADING = /^(open questions?|next steps?|next move|next sensible move|open items?|questions?)$/i;

function articleDate(article: Article): string {
  return article.updated || article.created || '';
}

function cleanInlineMarkdown(input: string): string {
  return input
    .replace(/^\s*(?:[-*+] |\d+[.)] )/, '')
    .replace(/^\[[ xX]\]\s*/, '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, alias) => alias || target)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractOpenLoops(article: Article, limit = 2): NowLoop[] {
  const lines = article.bodyMd.split('\n');
  const found: NowLoop[] = [];
  let activeHeading = '';
  let activeLevel = 0;

  for (const raw of lines) {
    const heading = /^(#{2,6})\s+(.+?)\s*$/.exec(raw.trim());
    if (heading) {
      const level = heading[1].length;
      const text = cleanInlineMarkdown(heading[2].replace(/\s+#+$/, ''));
      if (LOOP_HEADING.test(text)) {
        activeHeading = text;
        activeLevel = level;
      } else if (activeHeading && level <= activeLevel) {
        activeHeading = '';
        activeLevel = 0;
      }
      continue;
    }
    if (!activeHeading || !/^\s*(?:[-*+] |\d+[.)] )/.test(raw)) continue;
    if (/^\s*[-*+]\s+\[[xX]\]/.test(raw)) continue;
    const text = cleanInlineMarkdown(raw);
    if (!text) continue;
    found.push({ article, label: activeHeading, text });
    if (found.length >= limit) break;
  }
  return found;
}

export function extractLatestReceipt(article: Article): NowReceipt | null {
  const lines = article.bodyMd.split('\n');
  let inActions = false;
  let headingLevel = 0;
  const receipts: string[] = [];

  for (const raw of lines) {
    const heading = /^(#{2,6})\s+(.+?)\s*$/.exec(raw.trim());
    if (heading) {
      const level = heading[1].length;
      const text = cleanInlineMarkdown(heading[2]);
      if (/^actions taken$/i.test(text)) {
        inActions = true;
        headingLevel = level;
      } else if (inActions && level <= headingLevel) {
        break;
      }
      continue;
    }
    if (!inActions || !/^\s*[-*+]\s+/.test(raw)) continue;
    const text = cleanInlineMarkdown(raw);
    if (text) receipts.push(text);
  }

  return receipts.length ? { article, text: receipts[receipts.length - 1] } : null;
}

function stableDayIndex(stamp: string, length: number): number {
  let hash = 2166136261;
  for (let i = 0; i < stamp.length; i++) {
    hash ^= stamp.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

export function selectResurfaced(articles: Article[], dateStamp: string): Article | null {
  const cutoff = new Date(`${dateStamp}T12:00:00-04:00`);
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStamp = cutoff.toISOString().slice(0, 10);
  const pool = articles
    .filter((a) => !RESURFACE_EXCLUDED.has(a.type))
    .filter((a) => a.wordCount >= 200 && !/^stub$/i.test(a.status || ''))
    .filter((a) => !articleDate(a) || articleDate(a) < cutoffStamp)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return pool.length ? pool[stableDayIndex(dateStamp, pool.length)] : null;
}

export function buildNowData(articles: Article[], dateStamp: string): NowData {
  const recent = articles
    .filter((a) => articleDate(a) && !RECENT_EXCLUDED.has(a.type))
    .sort((a, b) => articleDate(b).localeCompare(articleDate(a)) || a.title.localeCompare(b.title))
    .slice(0, 8);

  const allProjects = articles
    .filter((a) => a.type === 'project' && ACTIVE_STATUSES.has((a.status || '').toLowerCase().trim()))
    .sort((a, b) => articleDate(b).localeCompare(articleDate(a)) || a.title.localeCompare(b.title));
  const projects = allProjects.slice(0, 6);

  const loopSources = [...allProjects, ...recent.filter((a) => !allProjects.some((p) => p.slug === a.slug))];
  const loops = loopSources.flatMap((a) => extractOpenLoops(a, 2)).slice(0, 7);

  const receipts = articles
    .map(extractLatestReceipt)
    .filter((r): r is NowReceipt => r != null)
    .sort((a, b) => articleDate(b.article).localeCompare(articleDate(a.article)) || b.article.slug.localeCompare(a.article.slug))
    .slice(0, 5);

  return { recent, projects, loops, receipts, resurfaced: selectResurfaced(articles, dateStamp) };
}
