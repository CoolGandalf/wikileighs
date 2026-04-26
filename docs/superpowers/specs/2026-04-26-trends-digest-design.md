---
title: HERALD — Weekly AI/Dev Trends Digest
type: design-spec
status: draft
created: 2026-04-26
authors:
  - Leigh Llewelyn
  - Claude (Opus 4.7)
related:
  - "[[notes/agents/HERALD]]"
  - "[[notes/trending/index]]"
  - "[[notes/Firecrawl]]"
---

# HERALD — Weekly AI/Dev Trends Digest

## Purpose

Surface what's actually new and useful in the AI/dev ecosystem each week, filtered to what Leigh or his Claude agents can practically use, delivered as a short Sunday-morning email and archived to the vault. Replaces the long-stalled SCOUT and OpenClaw use case scanner Notion projects.

## Why this, why now

Past attempts at trending-source scanning never shipped because the scraping layer was missing. With Firecrawl installed, the pipeline becomes one bash script, one Claude API call, one email send. The marginal cost is ~40 Firecrawl credits per weekly run — 12 weeks of free-tier headroom for evaluation; sustainable on the $16/mo Hobby tier thereafter.

## Success criteria

A digest is successful if Leigh:
1. Reads it most weeks (open + scan, not necessarily click everything)
2. Acts on at least one item per month (installs a skill, tries a tool, follows a thread, files a project note)
3. Stops feeling like he's "missing things" in the agent/AI-tools space

A digest is unsuccessful if it becomes:
- Generic AI news he could get from TLDR.ai
- Long enough that he stops opening it
- A maintenance burden requiring weekly intervention

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Mac cron — Sundays 08:00 ET                                      │
│  → ~/Projects/vault/scripts/herald-digest.sh                      │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  Stage 1: SCRAPE       Stage 2: SYNTHESIZE     Stage 3: PUBLISH
  (parallel, 3-min      (Sonnet 4.6, single     (vault note +
   timeout each)         API call w/ context)    am-send email)

  Trendshift (×7 dailies)──┐
  Reddit 5 subs .json     ──┼──► raw/ JSON files ──► one prompt ──► markdown
  ClawHub skills index    ──┤                                          │
  TLDR.ai latest issue    ──┘                                          ▼
                                                              notes/trending/
                                                              YYYY-MM-DD.md
                                                                       │
                                                                       ▼
                                                              am-send
                                                              (macallister
                                                               → leigh)
```

## Components

### 1. Sources (4)

| # | Source | Endpoint | Method | Credits | Why |
|---|---|---|---|---|---|
| 1 | **Trendshift** | `trendshift.io/` (7 daily snapshots) | `firecrawl scrape` ×7 | 7 | Velocity-based GitHub trending; the only quantitative "heating up now" signal. No API/RSS, scrape required. |
| 2 | **Reddit** | `reddit.com/r/<sub>/top.json?t=week` ×5 + top 3 threads each (15) | `firecrawl scrape` ×20 | 20 | Community signal. JSON endpoints avoid stealth cost. Subs: `r/ClaudeAI`, `r/AI_Agents`, `r/LocalLLaMA`, `r/OpenClaw`, `r/MachineLearning`. |
| 3 | **ClawHub** | `clawhub.ai/skills?sort=downloads` + top 5 skill pages | `firecrawl scrape` ×6 | 6 | Skills marketplace. Per Leigh: "versions of these should work with Claude as well." |
| 4 | **TLDR.ai** | `tldr.tech/ai/<each-of-last-7-dates>` | `firecrawl scrape` ×7 | 7 | General AI launches/products that aren't on Trendshift or in subreddits. Captures the "AI Advantage" angle (efficient new apps even if not strictly agentic). |

**Total budget: ~40 credits/run.** First run may add stealth-proxy fallback (+5 cr per blocked source); ceiling is ~70 cr. Free tier (500 cr) gives 7-12 weeks of runway; Hobby (3k cr/mo) gives ~75 runs/mo headroom.

### 2. Scrape stage

Bash script `~/Projects/vault/scripts/herald-digest.sh` runs four scrape blocks in parallel via `firecrawl scrape ... &` + `wait`. Outputs land in `~/Projects/vault/_local-macbookair/herald/raw/YYYY-MM-DD/{trendshift,reddit,clawhub,tldr}/`.

Each block has a 3-minute hard timeout. On timeout or non-zero exit:
- Log the failure to `~/Projects/vault/_local-macbookair/herald/log/YYYY-MM-DD.log`
- Continue with remaining sources
- Pass empty source to synthesis stage; the synthesis prompt knows how to render "(no data this week)"

### 3. Synthesis stage

A single Claude API call (Sonnet 4.6) takes:
- **Inputs**: the 4 raw JSON dumps + recent vault context + last 4 weeks of digests
- **Vault context**: last 14 days of vault commit messages (`git log --since=14.days --pretty=format:"%s"`) + paths of `notes/projects/*.md` modified in same window
- **Prior digests**: contents of last 4 `notes/trending/YYYY-MM-DD.md` files (de-dupe + week-over-week framing)
- **Output**: a single markdown document conforming to the output template (below)

Prompt lives at `~/Projects/vault/scripts/herald-prompt.md` and is checked into git. One source of truth, easy to iterate.

### 4. Output template

The vault note IS the email body. Single artifact, two destinations.

```markdown
---
title: Trends Digest — YYYY-MM-DD
type: report
tags: [report, trending, herald]
created: YYYY-MM-DD
agent: HERALD
---

# 🔥 Trends Digest — YYYY-MM-DD

🎯 **For You**: <1-3 items the LLM flagged as specifically relevant to active vault work>

🔭 **Theme of the week**: <2-3 sentence synthesis pattern>

## 🚀 Repos (5)
**[name](url)** — what it does (1 line). Why interesting / durability take (1 line).

## 💬 Threads (4)
**[title](r/sub link)** — what's discussed (1 line). Why it matters to you (1 line).

## 🔌 Skills & Plugins (3)
**[name](clawhub url)** — what it does (1 line). Whether worth installing (1 line).

## 🛠 Tools & Launches (3)
**[product](url)** — what shipped (1 line). Whether it changes your workflow (1 line).

---
_Sources: Trendshift · 5 subs · ClawHub · TLDR.ai. Credits used: N. Failed sources: <list or "none">._
```

**Hard caps:**
- Total items: 15 (5 + 4 + 3 + 3)
- Per-item line count: exactly 2 (what + why), no third line
- Theme synthesis: 2-3 sentences, never longer

### 5. Publish stage

1. Write the synthesized markdown to `~/Projects/vault/notes/trending/YYYY-MM-DD.md`
2. Update `~/Projects/vault/notes/trending/index.md` — prepend a one-line entry: `- [[YYYY-MM-DD]] — <theme line>`
3. Update `~/Projects/vault/index.md` "Latest digest" card (replace, not append) with link + theme line
4. Render markdown to inline HTML via `pandoc -f markdown -t html5 --no-highlight`
5. Send via `am-send`:
   - From: `macallister@agentmail.to` (default per CLAUDE.md tool routing)
   - To: `leigh.llewelyn@gmail.com`
   - Subject: `🔥 HERALD Digest YYYY-MM-DD — <hook 1> · <hook 2> · <hook 3>` (LLM-extracted from top items)
   - Body: HTML rendering of the vault note
6. Vault auto-commits via existing PostToolUse hook → wikileighs deploy pipeline picks it up automatically

### 6. Vault entries

Two new files plus two updates to existing files, beyond the weekly issues themselves:

**`notes/agents/HERALD.md`** — agent page
- What HERALD does, schedule, sources, link to design doc
- Link to most recent issue
- Last-run status badge (read from log)
- "How to invoke manually" snippet

**`notes/trending/index.md`** — collection landing page
- Reverse-chronological list of all issues with one-line theme summary
- Generated and updated by the publish stage

**`notes/agents/SCOUT.md`** — mark deprecated
- Add deprecation banner at top: "Superseded by [[HERALD]] on 2026-04-26"
- Keep historical content for context

**`notes/LeighOS Agents.md`** — add HERALD entry, mark SCOUT as superseded

**`index.md`** (vault root) — add a "Latest digest" card pointing at the most recent issue

## Failure modes

| Failure | Behavior |
|---|---|
| One source scrape fails | Log, skip, continue. Footer notes which sources failed. |
| All sources fail | Send a stub email "HERALD scrape failed at <ts>" with logs link. Don't write a vault note. |
| Claude API fails | Retry once with backoff. On second failure, write `_local-macbookair/herald/failed/YYYY-MM-DD.json` with raw scrape, send stub email. |
| `am-send` fails | Vault note still written. Cron retry in 1h. After 3 failures, fall back to `gog gmail send`. |
| Cron itself doesn't fire | Covered by existing `today-cron-errors` reporting pattern. |
| Firecrawl quota exhausted | Email "HERALD: out of credits, top up at firecrawl.dev". Skip the run. |

## Smoke test (before scheduling cron)

Run `~/Projects/vault/scripts/herald-digest.sh` manually once after implementation — a real end-to-end run against this past week's live data, just not yet on a schedule. Validates:
- All 4 sources reachable, parse correctly
- Claude synthesis produces the expected template (15 items, 4 sections, 2-line items, theme + For You header)
- Vault note written, `notes/trending/index.md` updated, `index.md` card updated, wiki deploy fires
- am-send arrives in inbox, HTML renders correctly
- Total credit cost matches the ~40 cr budget projection

If smoke test passes, install the cron line. If it fails, fix and re-run before scheduling. Pre-cron run produces a real, archived issue (not throwaway) so the vault has something to point at from day one.

## Out of scope (YAGNI)

- Twitter/X source (Firecrawl gets blocked; revisit with Apify or Bright Data later if it becomes a felt gap)
- Daily cadence
- Web UI, RSS, multi-recipient
- Per-source weighting knobs / sentiment scoring / star-count thresholds (Claude figures it out from context)
- Historical-data backfill (smoke test uses live current-week data)
- Long-term "Leigh interest profile" persistence (vault context is recomputed each run)

## Dependencies

- `firecrawl` CLI (installed 2026-04-26)
- `am-send` (`~/.local/bin/am-send`, AgentMail key in `~/.openclaw/.env`)
- `pandoc` (Homebrew)
- `claude` CLI for the synthesis call (Sonnet 4.6)
- Mac cron harness (existing, used by today-page and morning-briefing)
- Vault auto-commit hook (existing PostToolUse)

## Open questions / followups

- ClawHub HTML structure — confirm the scrape returns clean data on first run; may need a sub-skill if heavily JS-rendered
- Trendshift weekly rollup — research showed `/weekly` returns 404; current plan scrapes 7 dailies. If they ship a weekly view, simplify.
- After 4 weeks of runs, review: are the 4 sections the right shape? Should we add/drop any?
- After 8 weeks: re-evaluate whether to add Twitter via a different tool

## Implementation plan

To be drafted by the writing-plans skill after this design is approved.
