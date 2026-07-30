import test from 'node:test';
import assert from 'node:assert/strict';
import type { Article } from './vault';
import { buildNowData, extractLatestReceipt, extractOpenLoops, selectResurfaced } from './now.ts';

function article(overrides: Partial<Article> = {}): Article {
  return {
    slug: 'sample', title: 'Sample', type: 'reference', tags: [], status: null,
    created: '2026-01-01', updated: '2026-01-01', source: null, related: [], aliases: [],
    infobox: {}, bodyMd: '', html: '', toc: [], outbound: [], relPath: 'Sample.md',
    wordCount: 300, hasImage: false, firstParagraph: '', photo: null, featured: false,
    ...overrides,
  };
}

test('extractOpenLoops reads list items only from useful open-loop sections', () => {
  const a = article({ bodyMd: `## Background\n- Ignore me\n## Pending decisions\n- Historical prose is not a live queue\n## Open questions\n- What should happen next?\n- [x] Already answered\n1. Which source is canonical?\n## Notes\n- Ignore this too` });
  assert.deepEqual(extractOpenLoops(a).map((x) => x.text), [
    'What should happen next?',
    'Which source is canonical?',
  ]);
});

test('extractLatestReceipt returns the last action receipt', () => {
  const a = article({ bodyMd: `## Actions Taken\n- First thing\n- [2026-07-28 20:00] Verified delivery (Telegram 42)\n## Transcript\nNope` });
  assert.equal(extractLatestReceipt(a)?.text, '[2026-07-28 20:00] Verified delivery (Telegram 42)');
});

test('selectResurfaced is stable for a day and excludes recent/system pages', () => {
  const oldA = article({ slug: 'a', title: 'A', updated: '2025-01-01' });
  const oldB = article({ slug: 'b', title: 'B', updated: '2025-02-01' });
  const recent = article({ slug: 'recent', title: 'Recent', updated: '2026-07-20' });
  const report = article({ slug: 'report', title: 'Report', type: 'report', updated: '2025-01-01' });
  const first = selectResurfaced([oldA, oldB, recent, report], '2026-07-28');
  const second = selectResurfaced([report, recent, oldB, oldA], '2026-07-28');
  assert.ok(first);
  assert.equal(first?.slug, second?.slug);
  assert.ok(['a', 'b'].includes(first!.slug));
});

test('buildNowData ranks recent work, active projects, loops, and receipts', () => {
  const project = article({ slug: 'project', title: 'Project', type: 'project', status: 'active', updated: '2026-07-28', bodyMd: '## Next steps\n- Ship the pilot' });
  const memo = article({ slug: '2026-07-28-120000', title: 'Memo', type: 'voice-memo', updated: '2026-07-28', bodyMd: '## Actions Taken\n- Sent the result' });
  const old = article({ slug: 'old', title: 'Old', updated: '2025-01-01' });
  const data = buildNowData([old, memo, project], '2026-07-28');
  assert.equal(data.projects[0].slug, 'project');
  assert.equal(data.loops[0].text, 'Ship the pilot');
  assert.equal(data.receipts[0].text, 'Sent the result');
  assert.equal(data.resurfaced?.slug, 'old');
});
