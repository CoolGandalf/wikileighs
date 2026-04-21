---
title: Night-shift 2026-04-20 → 2026-04-21 — Vault & WikiLeighs improvement
type: plan
status: in-progress
created: 2026-04-20
updated: 2026-04-20
owner: Librarian (Giles)
device: macbookair
session_start: 2026-04-20T21:15
target_wake: 2026-04-21 morning (Giles email)
---

# Night-shift — Vault & WikiLeighs improvement

Leigh is asleep. Work until TODOs are clear, then email a summary.

## Inputs

- 2026-04-20 session shipped: Keep-import synthesis plan (Phases 1, 2, 3 all done), family-page enrichments, Shayan Lebastchi correction, James Lewis enrichment, Rachel wedding-date confirmation.
- `notes/Gaps.md` (regenerated tonight) — has the priority list.
- `hot.md` — long-tail pending items.
- 2026-04-19 audit + FB Phase 1 person-page mining.

## Goals (for this night-shift)

1. **Close the most-referenced broken wikilinks** to get the vault's link-density higher.
2. **Fix mechanical debt** (frontmatter, aliases, one-liner redirects).
3. **Mint load-bearing missing pages** (agent stubs, FB Phase 2 group pages, gloss pages).
4. **Enrich thin person stubs** where we have signal from the FB mining.
5. **Verify WikiLeighs builds clean** after the new content.
6. **Investigate the today-page cron errors** flagged on 2026-04-20.
7. **Update `hot.md`** so tomorrow's session starts primed.

## Work units

Ordered by `(impact × safety) / cost`. Each sub-item has an output path and source.

### Batch A — Mechanical, reversible, fast (parallel)

**A1.** Alias sweep — edit existing pages to close the typo / redirect classes of broken wikilinks:
- Add `Phillip Johnson` alias → `notes/people/Phil Johnson.md` (6 refs)
- Add `Rachel` alias → `notes/people/Rachel Shively.md` (2 refs)
- Add `Attia Index` alias → `notes/figures/Peter Attia.md` (2 refs)
- Add `LifeOS` alias → `notes/LeighOS.md` (2 refs)
- Add `Alex Carl Leigh Good Buddies Discussion Group` alias → `notes/archive/fb-threads/alex-carl-leigh-good-buddies.md` (6 refs)
- Find-and-replace `[[Vault Index]]` → `[[index]]` (6 refs in journal/daily files)
- Find-and-replace `[[vault index]]` → `[[index]]` (3 refs)
- Add `Project Landscape` alias → `notes/Project Status Dashboard.md` (10 refs)
- Add `GTD Task Manager` alias → `notes/GTD System Design.md` (4 refs, verify)
- Add `Cheyen` alias confirmation (already done this session; verify)

**A2.** Class 1 frontmatter sweep — add `type: idea`, `created:`, `updated:` to the ~18 files in `notes/Ideas from Old Emails/` lacking frontmatter. Use git-log first-commit date for `created:`, set `updated: 2026-04-20`.

**A3.** Regenerate `notes/Gaps.md` with corrected family-pages fact.

### Batch B — New short pages (parallel)

**B1.** Gloss / redirect pages — each is a short encyclopedic stub (100-250 words) pointing at the real content:
- `notes/Stoic Philosophy.md` (6 refs) → gloss + pointer to `qmd:stoic-corpus` and `[[Live Like a Stoic]]`
- `notes/Stoic Index.md` (8 refs) → same territory; alias of Stoic Philosophy
- `notes/Voice Memo Action Dispatcher.md` (9 refs) → describes the `~/.openclaw/workspace/voice-memos/` component

**B2.** Agent stubs — one-paragraph pages for each agent named in `CLAUDE.md` but without a vault stub:
- `notes/projects/BRIEF.md` (6 refs) — morning briefing agent
- `notes/projects/PICKWICK.md` (6 refs) — resurfacing/selection agent
- `notes/projects/JADE.md` (5 refs) — personal research agent (Notion-based)
- `notes/projects/ORACLE.md` (5 refs) — broadening/outward-research agent
- `notes/projects/SCOUT.md` (5 refs) — scouting agent
- `notes/projects/Rupert.md` (7 refs) — OpenClaw scheduler persona
- `notes/projects/mungo.md` (4 refs) — brainstorming partner persona
- `notes/LeighOS Agents.md` — index linking all seven + other agents (Librarian/Giles, Cortana, Keats, etc.)

### Batch C — Medium enrichments (parallel)

**C1.** Person-page stub enrichment (from FB Phase 1 archive + Keep import):
- `notes/people/Anurag Dhingra.md` (263 chars) — NYC friends group, Ben Kessler connection
- `notes/people/Christina Bloomquist.md` (279 chars)
- `notes/people/Annajan Navaratnam.md` (294 chars)

**C2.** Today-page cron error investigation — check `/tmp/today-raw-20260420.json` + the per-job jsonl logs, identify root cause of the 3 errors, file findings in `_local-macbookair/`.

### Batch D — Heavy (FB Phase 2 pipeline)

**D1.** FB Phase 2 — mint 5 group pages via `~/Projects/facebook-archive/scripts/write_group_page.py`:
- `notes/Brolympians.md` (28 refs)
- `notes/Leigh's Lascivious Leighaison.md` (25 refs)
- `notes/4 Boys 1 Hellpod.md` (9 refs)
- `notes/Top Gunners.md` (7 refs)
- `notes/Tres Amigos.md` (6 refs)

Uses Opus 4.7 per-group summaries; estimated 100-200K input tokens total.

### Batch E — Verification + wrap-up (serial, at end)

**E1.** WikiLeighs build check — run `npm run build` locally or trust the auto-deploy chain; verify page count increased appropriately (expect 1020 + new pages ≈ 1050+).

**E2.** Re-run `/librarian audit` to regenerate Gaps.md against the end-of-night state.

**E3.** Update `hot.md` with the night's deltas.

**E4.** Commit batch in vault + WikiLeighs as needed.

**E5.** `/log-to-daily`.

**E6.** **Giles morning email** to leigh.llewelyn@gmail.com — one letter, dry, scholarly, what shipped + what's still pending.

## Execution mode

**Run-now, parallel batches.** Night-shift skill says single sessions routinely handle 800K tokens without throttle; this list is ~15 work units but most are Light. Dispatch A, B, C, D in parallel where possible; E is sequential at the end.

## Safety rails

- No writes to `Private/`, `_local-alienware-*/`, `archive/keep-family-correspondence-2026-04-19/` (except redactions, none planned tonight).
- No work content in vault/WikiLeighs (per privacy rule).
- Don't invent person pages from email volume alone (Rhys lesson).
- No `git push --force` or destructive git operations.
- Auto-commit hook handles git commits per operation.

## State files

- Plan: this file.
- TODOS: `_local-macbookair/agent-state/TODOS.md`.
- Loop log: `_local-macbookair/agent-state/AGENT_LOOP.md`.
- Nightly Librarian output: `_local-macbookair/librarian-nightly-2026-04-20.md` (if produced).
- Morning-brief-feed excerpt: `_local-macbookair/morning-brief-feed.md`.

## Exit criteria

- TODOS checked off or explicitly deferred with reason.
- WikiLeighs builds clean and deploys.
- Giles email sent.
- Daily log written.
- `hot.md` updated.
