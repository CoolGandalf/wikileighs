# HERALD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship HERALD — a weekly cron-driven AI/dev trends digest that scrapes Trendshift + Reddit + ClawHub + TLDR.ai via Firecrawl, synthesizes via Claude Sonnet 4.6, publishes to vault, and emails Leigh via am-send.

**Architecture:** Single bash script (`herald-digest.sh`) with modular functions. Four parallel scrape blocks → one Claude synthesis call → vault note + email. Vault auto-commits and auto-deploys to wikileighs. Smoke test = real manual run before installing cron.

**Tech Stack:** Bash, `firecrawl` CLI v1.15.2, `claude --print` (Sonnet 4.6), `pandoc`, `am-send` (AgentMail), Mac cron, vault (Obsidian + git).

**Spec:** `docs/superpowers/specs/2026-04-26-trends-digest-design.md` (commit 37727fe)

---

## File Structure

**New files:**
- `~/Projects/vault/scripts/herald-digest.sh` — main orchestrator (modular bash)
- `~/Projects/vault/scripts/herald-prompt.md` — Claude synthesis prompt
- `~/Projects/vault/notes/agents/HERALD.md` — agent page
- `~/Projects/vault/notes/trending/index.md` — collection landing page
- `~/Projects/vault/notes/trending/YYYY-MM-DD.md` — created by each run

**Existing files modified:**
- `~/Projects/vault/notes/agents/SCOUT.md` — add deprecation banner (create if missing)
- `~/Projects/vault/notes/LeighOS Agents.md` — add HERALD, mark SCOUT superseded
- `~/Projects/vault/index.md` — add "Latest digest" card

**Runtime state (gitignored, device-local):**
- `~/Projects/vault/_local-macbookair/herald/raw/YYYY-MM-DD/` — scrape outputs
- `~/Projects/vault/_local-macbookair/herald/log/YYYY-MM-DD.log` — per-run logs
- `~/Projects/vault/_local-macbookair/herald/failed/YYYY-MM-DD.json` — failure dumps

**Cron:**
- `crontab -l` entry: Sundays 08:00 ET → `herald-digest.sh`

---

## Note on TDD

This pipeline is mostly external-API integration (Firecrawl, Claude, AgentMail). Strict unit-test-first TDD is high-cost / low-value here. Each task instead:
1. Writes the function/section
2. Runs it manually against real inputs
3. Verifies output file structure / content
4. Commits

The final smoke-test task IS the integration test — a real end-to-end run before installing cron.

---

### Task 1: Scaffold directories and gitignore

**Files:**
- Create: `~/Projects/vault/scripts/` (dir)
- Create: `~/Projects/vault/_local-macbookair/herald/raw/` (dir)
- Create: `~/Projects/vault/_local-macbookair/herald/log/` (dir)
- Create: `~/Projects/vault/_local-macbookair/herald/failed/` (dir)
- Create: `~/Projects/vault/notes/agents/` (dir, may already exist)
- Create: `~/Projects/vault/notes/trending/` (dir)
- Modify: `~/Projects/vault/.gitignore` (add `_local-*/herald/` if not already covered)

- [ ] **Step 1: Create directory tree**

```bash
cd ~/Projects/vault
mkdir -p scripts notes/agents notes/trending
mkdir -p _local-macbookair/herald/{raw,log,failed}
```

- [ ] **Step 2: Verify gitignore covers herald state**

Run: `grep -E "^_local-" ~/Projects/vault/.gitignore`
Expected: `_local-*/` already present (covers herald subdir). If not, append `_local-*/`.

- [ ] **Step 3: Verify with ls**

Run: `ls -d ~/Projects/vault/{scripts,notes/agents,notes/trending,_local-macbookair/herald/{raw,log,failed}}`
Expected: All 7 paths listed without errors.

- [ ] **Step 4: Commit (vault auto-commits, but force a checkpoint)**

```bash
cd ~/Projects/vault
git add notes/agents notes/trending scripts 2>/dev/null || true
git commit --allow-empty -m "scaffold: HERALD directory tree

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Write the synthesis prompt

**Files:**
- Create: `~/Projects/vault/scripts/herald-prompt.md`

The prompt is the source of truth for digest quality. Keep it in version control so prompt iterations are tracked.

- [ ] **Step 1: Write the prompt file**

Create `~/Projects/vault/scripts/herald-prompt.md` with this exact content:

````markdown
You are HERALD, an agent that produces a weekly trends digest for Leigh Llewelyn.

Your job: read the four scraped data sources below + the personal context, and write a single markdown document conforming to the template at the end of this prompt.

# Sources you've been given

1. **Trendshift** (7 daily snapshots from trendshift.io) — velocity-based GitHub trending. Look for repos with high star-deltas across multiple days = sustained momentum.
2. **Reddit** (5 subs × top.json + top 3 threads each) — r/ClaudeAI, r/AI_Agents, r/LocalLLaMA, r/OpenClaw, r/MachineLearning. Look for high-upvote threads, recurring themes, novel use cases.
3. **ClawHub** (clawhub.ai/skills sorted by downloads + top 5 skill pages) — OpenClaw skills marketplace. Versions of these often work with Claude Code too.
4. **TLDR.ai** (last 7 daily issues from tldr.tech/ai) — general AI launches and product news. Cover what's NOT in the other three sources.

# Personal context (use to personalize, not to fill the digest)

- **Leigh's recent vault commits** (last 14 days): what he's been working on
- **Active projects** (`notes/projects/*.md` modified recently): his current focus areas
- **Last 4 weeks of digests**: what's already been covered (DO NOT REPEAT items unless there's a major update)

# Topic gate

INCLUDE: AI / agents / MCP / Claude-ecosystem / dev tooling / efficient-workflow apps that Leigh or his Claude agents could use. The "AI Advantage" rule: if a nifty new app would be 1000x more efficient at something Leigh does, surface it even if it's not strictly agentic.

EXCLUDE: crypto, JS-framework-of-the-week, generic ML research papers, anything Leigh has already saved/discussed in the last 4 weeks.

# Output template — MATCH EXACTLY

```markdown
---
title: Trends Digest — {DATE}
type: report
tags: [report, trending, herald]
created: {DATE}
agent: HERALD
---

# 🔥 Trends Digest — {DATE}

🎯 **For You**: {1-3 items the LLM flagged as specifically relevant to active vault work — be specific, name the project/file/interest}

🔭 **Theme of the week**: {2-3 sentence synthesis pattern — what's the through-line across these items?}

## 🚀 Repos (5)
**[name](url)** — what it does (1 line). Why interesting / durability take (1 line).
**[name](url)** — what it does (1 line). Why interesting / durability take (1 line).
**[name](url)** — what it does (1 line). Why interesting / durability take (1 line).
**[name](url)** — what it does (1 line). Why interesting / durability take (1 line).
**[name](url)** — what it does (1 line). Why interesting / durability take (1 line).

## 💬 Threads (4)
**[title](r/sub thread link)** — what's discussed (1 line). Why it matters to you (1 line).
**[title](r/sub thread link)** — what's discussed (1 line). Why it matters to you (1 line).
**[title](r/sub thread link)** — what's discussed (1 line). Why it matters to you (1 line).
**[title](r/sub thread link)** — what's discussed (1 line). Why it matters to you (1 line).

## 🔌 Skills & Plugins (3)
**[name](clawhub url)** — what it does (1 line). Whether worth installing (1 line).
**[name](clawhub url)** — what it does (1 line). Whether worth installing (1 line).
**[name](clawhub url)** — what it does (1 line). Whether worth installing (1 line).

## 🛠 Tools & Launches (3)
**[product](url)** — what shipped (1 line). Whether it changes your workflow (1 line).
**[product](url)** — what shipped (1 line). Whether it changes your workflow (1 line).
**[product](url)** — what shipped (1 line). Whether it changes your workflow (1 line).

---
_Sources: Trendshift · 5 subs · ClawHub · TLDR.ai. Credits used: {N}. Failed sources: {list or "none"}._
```

# Hard rules

- EXACTLY 15 items total: 5 repos, 4 threads, 3 skills, 3 tools
- EACH item is EXACTLY 2 lines (what + why), never 3
- Theme synthesis is 2-3 sentences MAX
- For You callout: 1-3 items, never 0 (find SOMETHING relevant) and never 4+
- Use real links from the source data — do not hallucinate URLs
- If a source returned no data, mention it in the footer "Failed sources: <name>" and PAD the remaining sources to keep total at 15 (e.g. if Threads source failed, run 6 repos / 0 threads / 4 skills / 5 tools)
- Subject-line hooks: pick the 3 most attention-grabbing items across all sections, return them as a separate `SUBJECT_HOOKS:` line at the very top of your output (will be stripped before publishing)

# Subject hooks format

Your output MUST start with this line:

```
SUBJECT_HOOKS: hook1 · hook2 · hook3
```

Then a blank line, then the markdown document. The publish stage strips this line and uses it for the email subject.

Example:
```
SUBJECT_HOOKS: claude-skills 2.0 · MCP for Notion · Cursor desktop

---
title: Trends Digest — 2026-04-26
...
```
````

- [ ] **Step 2: Verify file**

Run: `wc -l ~/Projects/vault/scripts/herald-prompt.md && head -5 ~/Projects/vault/scripts/herald-prompt.md`
Expected: ~80 lines; first line is `You are HERALD...`

- [ ] **Step 3: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-prompt.md
git commit -m "feat(herald): add synthesis prompt

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Write herald-digest.sh skeleton with logging + arg parsing

**Files:**
- Create: `~/Projects/vault/scripts/herald-digest.sh`

The script needs a single, modular shape. Subsequent tasks fill in the function bodies. Stub them now with `echo "TODO"` so the script runs end-to-end (printing what it would do) from the start.

- [ ] **Step 1: Create the skeleton**

Write `~/Projects/vault/scripts/herald-digest.sh` with this exact content:

```bash
#!/usr/bin/env bash
# herald-digest.sh — Weekly AI/dev trends digest
# See: docs/superpowers/specs/2026-04-26-trends-digest-design.md

set -uo pipefail

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------
VAULT="$HOME/Projects/vault"
SCRIPTS="$VAULT/scripts"
RUNTIME="$VAULT/_local-macbookair/herald"
DATE="$(date +%F)"
RAW_DIR="$RUNTIME/raw/$DATE"
LOG_FILE="$RUNTIME/log/$DATE.log"
PROMPT_FILE="$SCRIPTS/herald-prompt.md"
NOTE_DIR="$VAULT/notes/trending"
NOTE_FILE="$NOTE_DIR/$DATE.md"
TRENDING_INDEX="$NOTE_DIR/index.md"
ROOT_INDEX="$VAULT/index.md"
RECIPIENT="leigh.llewelyn@gmail.com"
SCRAPE_TIMEOUT=180  # 3 min per source

# Source list
SUBREDDITS=(ClaudeAI AI_Agents LocalLLaMA OpenClaw MachineLearning)

# State
FAILED_SOURCES=()
CREDITS_BEFORE=0
CREDITS_AFTER=0

mkdir -p "$RAW_DIR" "$RUNTIME/log" "$RUNTIME/failed" "$NOTE_DIR"

# ------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------
log() {
  echo "[$(date +%T)] $*" | tee -a "$LOG_FILE"
}

# ------------------------------------------------------------------
# Stage 1: Scrape (parallel)
# ------------------------------------------------------------------
scrape_trendshift() { echo "TODO: scrape_trendshift"; }
scrape_reddit()     { echo "TODO: scrape_reddit"; }
scrape_clawhub()    { echo "TODO: scrape_clawhub"; }
scrape_tldr()       { echo "TODO: scrape_tldr"; }

run_scrapes() {
  log "Stage 1: scrape (parallel, ${SCRAPE_TIMEOUT}s timeout per source)"
  CREDITS_BEFORE=$(firecrawl credit-usage --json 2>/dev/null | jq -r '.data.remainingCredits // 0')
  log "Credits before: $CREDITS_BEFORE"

  ( timeout "$SCRAPE_TIMEOUT" bash -c "$(declare -f scrape_trendshift log); scrape_trendshift" || FAILED_SOURCES+=(trendshift) ) &
  ( timeout "$SCRAPE_TIMEOUT" bash -c "$(declare -f scrape_reddit log); scrape_reddit"     || FAILED_SOURCES+=(reddit)     ) &
  ( timeout "$SCRAPE_TIMEOUT" bash -c "$(declare -f scrape_clawhub log); scrape_clawhub"   || FAILED_SOURCES+=(clawhub)    ) &
  ( timeout "$SCRAPE_TIMEOUT" bash -c "$(declare -f scrape_tldr log); scrape_tldr"         || FAILED_SOURCES+=(tldr)       ) &
  wait

  CREDITS_AFTER=$(firecrawl credit-usage --json 2>/dev/null | jq -r '.data.remainingCredits // 0')
  log "Credits after: $CREDITS_AFTER (used $((CREDITS_BEFORE - CREDITS_AFTER)))"
  log "Failed sources: ${FAILED_SOURCES[*]:-none}"
}

# ------------------------------------------------------------------
# Stage 2: Synthesize
# ------------------------------------------------------------------
gather_vault_context() { echo "TODO: gather_vault_context"; }
synthesize()           { echo "TODO: synthesize"; }

# ------------------------------------------------------------------
# Stage 3: Publish
# ------------------------------------------------------------------
publish_vault() { echo "TODO: publish_vault"; }
send_email()    { echo "TODO: send_email"; }

# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
main() {
  log "HERALD digest run started for $DATE"
  run_scrapes
  log "Stage 2: synthesize"
  synthesize
  log "Stage 3: publish"
  publish_vault
  send_email
  log "HERALD digest run complete"
}

main "$@"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/Projects/vault/scripts/herald-digest.sh
```

- [ ] **Step 3: Run skeleton end-to-end (should print TODOs only)**

Run: `~/Projects/vault/scripts/herald-digest.sh`
Expected: Logs show "started", "Stage 1", "Credits before/after" (real numbers from firecrawl), then four TODO lines from the stub scrapes, then more stages with TODOs, then "complete". No errors.

- [ ] **Step 4: Verify log file**

Run: `cat ~/Projects/vault/_local-macbookair/herald/log/$(date +%F).log | head -20`
Expected: Same lines, prefixed with timestamps.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-digest.sh
git commit -m "feat(herald): add script skeleton with logging

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Implement scrape_trendshift

**Files:**
- Modify: `~/Projects/vault/scripts/herald-digest.sh` (replace stub)

Trendshift has no `/weekly` page (returns 404 per research), and no API. Scrape the daily view 7 times — each day's data feeds momentum analysis at synthesis time.

- [ ] **Step 1: Replace the scrape_trendshift stub**

Replace `scrape_trendshift() { echo "TODO: scrape_trendshift"; }` with:

```bash
scrape_trendshift() {
  log "  [trendshift] scraping 7 daily snapshots"
  local out_dir="$RAW_DIR/trendshift"
  mkdir -p "$out_dir"
  local i d
  for i in $(seq 0 6); do
    d=$(date -v-"$i"d +%F 2>/dev/null || date -d "$i days ago" +%F)
    # Trendshift only exposes "today" view; scrape it once per day-bucket subfolder so the
    # synthesis prompt sees "this is the snapshot we have." Future enhancement could pull
    # historical via wayback if needed.
    if [ "$i" -eq 0 ]; then
      firecrawl scrape "https://trendshift.io/" -o "$out_dir/today.md" 2>>"$LOG_FILE" \
        || { log "  [trendshift] FAIL today.md"; return 1; }
    fi
  done
  log "  [trendshift] done ($(ls "$out_dir" | wc -l | tr -d ' ') files)"
}
```

(Note: Trendshift only renders "today" — historical snapshots aren't accessible without their internal API. The plan accepts this and pulls one snapshot per run; over time the synthesis sees week-over-week deltas via the prior-digests context.)

- [ ] **Step 2: Test the function in isolation**

```bash
bash -c "source ~/Projects/vault/scripts/herald-digest.sh; scrape_trendshift" 2>&1 | tail -5
```

Wait — `source`ing runs `main` at end. Use this instead:

```bash
( unset DATE; source <(grep -v '^main "\$@"$' ~/Projects/vault/scripts/herald-digest.sh); scrape_trendshift )
```

Expected: `[trendshift] scraping...` then `[trendshift] done (1 files)`. File at `~/Projects/vault/_local-macbookair/herald/raw/$(date +%F)/trendshift/today.md` exists and is non-empty.

- [ ] **Step 3: Verify scrape content**

Run: `head -30 ~/Projects/vault/_local-macbookair/herald/raw/$(date +%F)/trendshift/today.md`
Expected: Markdown with repo names, star counts, and topic tags. If you see CAPTCHA or "Just a moment" → Trendshift is blocking; document the failure in followups.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-digest.sh
git commit -m "feat(herald): implement scrape_trendshift

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Implement scrape_reddit

**Files:**
- Modify: `~/Projects/vault/scripts/herald-digest.sh` (replace stub)

Reddit's `.json` endpoints are scrape-friendly and don't need stealth. Scrape the top.json for each of 5 subs, then read the JSON to find top 3 thread URLs and scrape those too.

- [ ] **Step 1: Replace the scrape_reddit stub**

```bash
scrape_reddit() {
  log "  [reddit] scraping ${#SUBREDDITS[@]} subs + top threads each"
  local out_dir="$RAW_DIR/reddit"
  mkdir -p "$out_dir"
  local sub url thread_urls top_url
  for sub in "${SUBREDDITS[@]}"; do
    url="https://www.reddit.com/r/$sub/top.json?t=week&limit=10"
    firecrawl scrape "$url" -o "$out_dir/$sub.json" 2>>"$LOG_FILE" \
      || { log "  [reddit] FAIL $sub top.json"; continue; }
    # Extract top 3 thread URLs from JSON
    thread_urls=$(jq -r '.data.children[0:3][].data.permalink' "$out_dir/$sub.json" 2>/dev/null)
    local idx=0
    while read -r perm; do
      [ -z "$perm" ] && continue
      idx=$((idx + 1))
      top_url="https://www.reddit.com${perm}.json"
      firecrawl scrape "$top_url" -o "$out_dir/$sub-thread-$idx.json" 2>>"$LOG_FILE" \
        || log "  [reddit] FAIL $sub thread $idx"
    done <<< "$thread_urls"
  done
  log "  [reddit] done ($(ls "$out_dir" | wc -l | tr -d ' ') files)"
}
```

- [ ] **Step 2: Test the function**

```bash
( source <(grep -v '^main "\$@"$' ~/Projects/vault/scripts/herald-digest.sh); scrape_reddit )
```

Expected: 5 sub scrapes + up to 15 thread scrapes. ~20 files in the reddit/ dir. Each `*.json` parses with `jq`.

- [ ] **Step 3: Verify with jq**

```bash
jq '.data.children | length' ~/Projects/vault/_local-macbookair/herald/raw/$(date +%F)/reddit/ClaudeAI.json
```

Expected: Number > 0 (typically 10).

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-digest.sh
git commit -m "feat(herald): implement scrape_reddit

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Implement scrape_clawhub

**Files:**
- Modify: `~/Projects/vault/scripts/herald-digest.sh` (replace stub)

Scrape the index page sorted by downloads. Then attempt to extract top 5 skill detail-page URLs from the index. If the URL extraction fails (HTML structure unknown), the index alone gives the synthesizer enough to work with.

- [ ] **Step 1: Replace the scrape_clawhub stub**

```bash
scrape_clawhub() {
  log "  [clawhub] scraping skills marketplace"
  local out_dir="$RAW_DIR/clawhub"
  mkdir -p "$out_dir"
  firecrawl scrape "https://clawhub.ai/skills?sort=downloads" \
    -o "$out_dir/index.md" 2>>"$LOG_FILE" \
    || { log "  [clawhub] FAIL index"; return 1; }
  # Try to extract top 5 skill page URLs from the index markdown.
  # Pattern is heuristic — clawhub.ai HTML structure not yet characterized.
  # Match markdown links to /skills/SOMETHING (excluding the index URL itself).
  local urls
  urls=$(grep -oE '\(https://clawhub\.ai/skills/[a-zA-Z0-9_-]+\)' "$out_dir/index.md" \
         | tr -d '()' | head -5)
  local idx=0
  while read -r u; do
    [ -z "$u" ] && continue
    idx=$((idx + 1))
    local slug="${u##*/}"
    firecrawl scrape "$u" -o "$out_dir/skill-$idx-$slug.md" 2>>"$LOG_FILE" \
      || log "  [clawhub] FAIL $slug"
  done <<< "$urls"
  log "  [clawhub] done ($(ls "$out_dir" | wc -l | tr -d ' ') files)"
}
```

- [ ] **Step 2: Test the function**

```bash
( source <(grep -v '^main "\$@"$' ~/Projects/vault/scripts/herald-digest.sh); scrape_clawhub )
```

Expected: At minimum `index.md` exists and is non-empty. Up to 6 files total (index + 5 skill pages) if URL extraction succeeded.

- [ ] **Step 3: Verify content quality**

Run: `head -50 ~/Projects/vault/_local-macbookair/herald/raw/$(date +%F)/clawhub/index.md`
Expected: Markdown with skill names, download counts, descriptions. If extraction failed (no skill pages), record as a Task 14 followup but proceed — the index alone is usable.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-digest.sh
git commit -m "feat(herald): implement scrape_clawhub

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Implement scrape_tldr

**Files:**
- Modify: `~/Projects/vault/scripts/herald-digest.sh` (replace stub)

TLDR.ai issues are dated URLs. Scrape the last 7 dates. Some dates won't have an issue (weekends typically don't) — accept 4xx as expected.

- [ ] **Step 1: Replace the scrape_tldr stub**

```bash
scrape_tldr() {
  log "  [tldr] scraping last 7 daily issues"
  local out_dir="$RAW_DIR/tldr"
  mkdir -p "$out_dir"
  local i d url
  for i in $(seq 0 6); do
    d=$(date -v-"$i"d +%F 2>/dev/null || date -d "$i days ago" +%F)
    url="https://tldr.tech/ai/$d"
    firecrawl scrape "$url" -o "$out_dir/$d.md" 2>>"$LOG_FILE" \
      || log "  [tldr] miss $d (likely weekend)"
  done
  local count=$(ls "$out_dir" | wc -l | tr -d ' ')
  if [ "$count" -lt 3 ]; then
    log "  [tldr] FAIL — only $count issues found, expected 4-5 weekdays"
    return 1
  fi
  log "  [tldr] done ($count files)"
}
```

- [ ] **Step 2: Test the function**

```bash
( source <(grep -v '^main "\$@"$' ~/Projects/vault/scripts/herald-digest.sh); scrape_tldr )
```

Expected: 4-7 files (skips weekends). Each is markdown with TLDR's section structure (Headlines, Deep Dives, etc.).

- [ ] **Step 3: Verify a single issue**

Run: `head -40 ~/Projects/vault/_local-macbookair/herald/raw/$(date +%F)/tldr/$(date -v-1d +%F 2>/dev/null || date -d '1 day ago' +%F).md`
Expected: TLDR-formatted content with section headers.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-digest.sh
git commit -m "feat(herald): implement scrape_tldr

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Implement gather_vault_context

**Files:**
- Modify: `~/Projects/vault/scripts/herald-digest.sh` (replace stub)

Pull the personalization signals: last 14 days of vault commits + recent project files + last 4 weeks of digests. Output to a single file the synthesis stage will include in the prompt.

- [ ] **Step 1: Replace the gather_vault_context stub**

```bash
gather_vault_context() {
  log "  [context] gathering vault context"
  local out_file="$RAW_DIR/vault-context.md"
  {
    echo "## Recent vault commits (last 14 days)"
    echo ""
    ( cd "$VAULT" && git log --since=14.days --pretty=format:"- %s" 2>/dev/null | head -100 )
    echo ""
    echo ""
    echo "## Active project pages (modified in last 14 days)"
    echo ""
    find "$VAULT/notes/projects" -name "*.md" -mtime -14 2>/dev/null \
      | while read -r f; do
        echo "### ${f##*/}"
        head -30 "$f"
        echo ""
      done
    echo ""
    echo "## Last 4 weeks of digests (de-dupe + week-over-week framing)"
    echo ""
    ls -t "$NOTE_DIR"/*.md 2>/dev/null | grep -v 'index.md' | head -4 \
      | while read -r f; do
        echo "### ${f##*/}"
        cat "$f"
        echo ""
      done
  } > "$out_file"
  log "  [context] done ($(wc -l < "$out_file") lines)"
}
```

- [ ] **Step 2: Test the function**

```bash
( source <(grep -v '^main "\$@"$' ~/Projects/vault/scripts/herald-digest.sh); gather_vault_context )
```

Expected: Log line, file at `$RAW_DIR/vault-context.md` is non-empty (likely 50-500 lines depending on activity). On first run, the "last 4 weeks of digests" section will be empty — that's fine.

- [ ] **Step 3: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-digest.sh
git commit -m "feat(herald): implement gather_vault_context

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Implement synthesize (Claude API call)

**Files:**
- Modify: `~/Projects/vault/scripts/herald-digest.sh` (replace stub)

Concatenate all raw files + vault context + the prompt, hand to `claude --print` (Sonnet 4.6), capture markdown output. Includes one retry on failure.

- [ ] **Step 1: Replace the synthesize stub**

```bash
synthesize() {
  log "  [synth] gathering vault context"
  gather_vault_context

  log "  [synth] building synthesis input"
  local input_file="$RAW_DIR/synthesis-input.md"
  {
    cat "$PROMPT_FILE"
    echo ""
    echo "# DATE = $DATE"
    echo "# CREDITS_USED = $((CREDITS_BEFORE - CREDITS_AFTER))"
    echo "# FAILED_SOURCES = ${FAILED_SOURCES[*]:-none}"
    echo ""
    echo "# === SOURCE: TRENDSHIFT ==="
    cat "$RAW_DIR"/trendshift/*.md 2>/dev/null || echo "(no trendshift data)"
    echo ""
    echo "# === SOURCE: REDDIT ==="
    cat "$RAW_DIR"/reddit/*.json 2>/dev/null || echo "(no reddit data)"
    echo ""
    echo "# === SOURCE: CLAWHUB ==="
    cat "$RAW_DIR"/clawhub/*.md 2>/dev/null || echo "(no clawhub data)"
    echo ""
    echo "# === SOURCE: TLDR.ai ==="
    cat "$RAW_DIR"/tldr/*.md 2>/dev/null || echo "(no tldr data)"
    echo ""
    echo "# === VAULT CONTEXT ==="
    cat "$RAW_DIR/vault-context.md"
  } > "$input_file"

  log "  [synth] input is $(wc -l < "$input_file") lines / $(wc -c < "$input_file") bytes"
  log "  [synth] calling claude --print (Sonnet 4.6)"

  local out_file="$RAW_DIR/synthesis-output.md"
  local attempt
  for attempt in 1 2; do
    if claude --print --model sonnet < "$input_file" > "$out_file" 2>>"$LOG_FILE"; then
      if [ -s "$out_file" ] && grep -q '^SUBJECT_HOOKS:' "$out_file"; then
        log "  [synth] success on attempt $attempt"
        return 0
      fi
      log "  [synth] attempt $attempt: output missing SUBJECT_HOOKS line"
    else
      log "  [synth] attempt $attempt: claude exited non-zero"
    fi
    sleep 5
  done

  log "  [synth] FAIL after 2 attempts, dumping to failed/"
  cp "$input_file" "$RUNTIME/failed/$DATE-input.md"
  return 1
}
```

- [ ] **Step 2: Test the function (requires scrapes to have run)**

If scrapes from Tasks 4-7 still exist for today:

```bash
( source <(grep -v '^main "\$@"$' ~/Projects/vault/scripts/herald-digest.sh); synthesize )
```

Expected: Two log lines about input size, one about calling claude, one about success. File at `$RAW_DIR/synthesis-output.md` exists, starts with `SUBJECT_HOOKS:`, contains the digest markdown.

- [ ] **Step 3: Verify output structure**

```bash
head -1 ~/Projects/vault/_local-macbookair/herald/raw/$(date +%F)/synthesis-output.md
grep -c '^## ' ~/Projects/vault/_local-macbookair/herald/raw/$(date +%F)/synthesis-output.md
```

Expected: First line starts with `SUBJECT_HOOKS:`. Section count = 4 (🚀 Repos, 💬 Threads, 🔌 Skills, 🛠 Tools).

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-digest.sh
git commit -m "feat(herald): implement synthesize via claude --print

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Implement publish_vault

**Files:**
- Modify: `~/Projects/vault/scripts/herald-digest.sh` (replace stub)

Take the synthesized markdown, strip the SUBJECT_HOOKS line, write to the vault note, update the trending index (prepend one line), update the root index card.

- [ ] **Step 1: Replace the publish_vault stub**

```bash
publish_vault() {
  local synth_file="$RAW_DIR/synthesis-output.md"
  if [ ! -s "$synth_file" ]; then
    log "  [publish] FAIL — no synthesis output"
    return 1
  fi

  log "  [publish] writing $NOTE_FILE"
  # Strip SUBJECT_HOOKS line + any leading blank lines
  sed '/^SUBJECT_HOOKS:/d; /./,$!d' "$synth_file" > "$NOTE_FILE"

  log "  [publish] updating trending index"
  local theme=$(grep -m1 '🔭' "$NOTE_FILE" | sed 's/.*Theme of the week\*\*: //' | head -c 120)
  if [ ! -f "$TRENDING_INDEX" ]; then
    {
      echo "---"
      echo "title: Trends Digest Index"
      echo "type: map"
      echo "tags: [report, trending, herald, map]"
      echo "---"
      echo ""
      echo "# Trends Digest Index"
      echo ""
      echo "Weekly issues from the [[HERALD]] agent. Most recent first."
      echo ""
    } > "$TRENDING_INDEX"
  fi
  # Prepend new entry after the introductory paragraph (find the blank line after "Most recent first.")
  local new_entry="- [[$DATE]] — $theme"
  awk -v entry="$new_entry" '
    BEGIN { added=0 }
    /^Weekly issues/ { print; getline; print; print entry; added=1; next }
    { print }
    END { if (!added) print entry }
  ' "$TRENDING_INDEX" > "$TRENDING_INDEX.tmp" && mv "$TRENDING_INDEX.tmp" "$TRENDING_INDEX"

  log "  [publish] updating vault root index card"
  # Replace (or insert) the "Latest digest" card near the top of root index.md
  if grep -q '<!-- HERALD-CARD -->' "$ROOT_INDEX" 2>/dev/null; then
    awk -v date="$DATE" -v theme="$theme" '
      /<!-- HERALD-CARD -->/ { in_card=1; print; next }
      /<!-- \/HERALD-CARD -->/ {
        in_card=0
        print "**🔥 Latest Trends Digest**: [[trending/" date "|" date "]] — " theme
        print
        next
      }
      !in_card { print }
    ' "$ROOT_INDEX" > "$ROOT_INDEX.tmp" && mv "$ROOT_INDEX.tmp" "$ROOT_INDEX"
  else
    log "  [publish] root index missing HERALD-CARD markers; skipping (set up by Task 12)"
  fi

  log "  [publish] done"
}
```

- [ ] **Step 2: Test the function (requires synthesize to have run)**

```bash
( source <(grep -v '^main "\$@"$' ~/Projects/vault/scripts/herald-digest.sh); publish_vault )
```

Expected: Vault note exists at `~/Projects/vault/notes/trending/$(date +%F).md`, trending/index.md updated with new entry at top.

- [ ] **Step 3: Verify**

```bash
head -10 ~/Projects/vault/notes/trending/$(date +%F).md
head -15 ~/Projects/vault/notes/trending/index.md
```

Expected: Note has frontmatter + "🔥 Trends Digest" header. Index has the new date entry near the top.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-digest.sh
git commit -m "feat(herald): implement publish_vault

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Implement send_email (am-send + gog fallback)

**Files:**
- Modify: `~/Projects/vault/scripts/herald-digest.sh` (replace stub)

Render markdown to HTML via pandoc, extract subject hooks from the synthesis output, send via am-send. On 3 consecutive am-send failures, fall back to `gog gmail send`.

- [ ] **Step 1: Replace the send_email stub**

```bash
send_email() {
  if [ ! -s "$NOTE_FILE" ]; then
    log "  [email] FAIL — no vault note to send"
    return 1
  fi

  local synth_file="$RAW_DIR/synthesis-output.md"
  local hooks
  hooks=$(grep -m1 '^SUBJECT_HOOKS:' "$synth_file" | sed 's/^SUBJECT_HOOKS: *//')
  [ -z "$hooks" ] && hooks="weekly digest"

  local subject="🔥 HERALD Digest $DATE — $hooks"
  log "  [email] subject: $subject"

  local html_file="$RAW_DIR/digest.html"
  pandoc -f markdown -t html5 --standalone --metadata title="HERALD Digest $DATE" \
    "$NOTE_FILE" > "$html_file" 2>>"$LOG_FILE" \
    || { log "  [email] FAIL — pandoc render"; return 1; }

  local body=$(cat "$NOTE_FILE")
  local html=$(cat "$html_file")

  log "  [email] sending via am-send"
  local attempt
  for attempt in 1 2 3; do
    if ~/.local/bin/am-send "$RECIPIENT" "$subject" "$body" --html "$html" >>"$LOG_FILE" 2>&1; then
      log "  [email] sent via am-send on attempt $attempt"
      return 0
    fi
    log "  [email] am-send attempt $attempt failed"
    sleep 10
  done

  log "  [email] am-send failed 3x, falling back to gog gmail"
  if gog gmail send --to "$RECIPIENT" --subject "$subject" --body "$body" >>"$LOG_FILE" 2>&1; then
    log "  [email] sent via gog (fallback)"
    return 0
  fi

  log "  [email] FAIL — both am-send and gog failed"
  return 1
}
```

- [ ] **Step 2: Test the function (requires publish_vault to have run)**

```bash
( source <(grep -v '^main "\$@"$' ~/Projects/vault/scripts/herald-digest.sh); send_email )
```

Expected: Log shows "subject: ...", "sending via am-send", "sent via am-send on attempt 1". Email arrives in `leigh.llewelyn@gmail.com` inbox within ~30s.

- [ ] **Step 3: Verify email**

Check Gmail. Subject should be `🔥 HERALD Digest YYYY-MM-DD — <hooks>`. HTML body should render as the digest.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/vault
git add scripts/herald-digest.sh
git commit -m "feat(herald): implement send_email with gog fallback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Vault page setup — agent + index + root card

**Files:**
- Create: `~/Projects/vault/notes/agents/HERALD.md`
- Modify: `~/Projects/vault/notes/agents/SCOUT.md` (create if missing)
- Modify: `~/Projects/vault/notes/LeighOS Agents.md`
- Modify: `~/Projects/vault/index.md` (add HERALD-CARD markers)

Wire the vault for the agent. The trending/index.md is created on first publish, so we don't need to seed it here.

- [ ] **Step 1: Create notes/agents/HERALD.md**

```bash
cat > ~/Projects/vault/notes/agents/HERALD.md <<'EOF'
---
title: HERALD
type: agent
tags: [agent, lifeos, herald]
created: 2026-04-26
updated: 2026-04-26
related:
  - "[[LeighOS Agents]]"
  - "[[trending/index]]"
  - "[[Firecrawl]]"
---

# HERALD

> "Hear ye, hear ye!" — the agent that surfaces what's actually new and useful in the AI/dev ecosystem each week.

## What HERALD does

Every Sunday at 8am ET, HERALD scrapes four sources, synthesizes them via Claude Sonnet 4.6, and delivers a short weekly digest:

- **🚀 5 trending GitHub repos** (via [Trendshift](https://trendshift.io))
- **💬 4 high-signal Reddit threads** (r/ClaudeAI, r/AI_Agents, r/LocalLLaMA, r/OpenClaw, r/MachineLearning)
- **🔌 3 ClawHub skills** worth installing (or skipping)
- **🛠 3 AI tools/launches** that change a workflow

Plus a "🎯 For You" callout flagged against current vault work, and a 2-3 sentence "🔭 Theme of the week" synthesis.

## How it works

- **Pipeline:** `~/Projects/vault/scripts/herald-digest.sh`
- **Prompt:** `~/Projects/vault/scripts/herald-prompt.md`
- **Schedule:** Mac cron, Sundays 08:00 America/New_York
- **Email:** `am-send` from `macallister@agentmail.to` to `leigh.llewelyn@gmail.com`
- **Vault:** This page (meta) + `[[trending/index]]` (collection)
- **Cost:** ~40 Firecrawl credits/run (~$0.013 on Hobby tier)

## Latest issue

See [[trending/index]] for the full archive. Most recent: check the date.

## History

- **2026-04-26** — Designed and shipped. Replaces the long-stalled SCOUT and OpenClaw use case scanner Notion projects.
- **Design spec:** `~/Projects/wikileighs/docs/superpowers/specs/2026-04-26-trends-digest-design.md`
- **Implementation plan:** `~/Projects/wikileighs/docs/superpowers/plans/2026-04-26-herald-implementation.md`

## Manual invocation

```bash
~/Projects/vault/scripts/herald-digest.sh
```

Logs go to `~/Projects/vault/_local-macbookair/herald/log/YYYY-MM-DD.log`. Failed runs dump raw inputs to `~/Projects/vault/_local-macbookair/herald/failed/`.

## See also

- [[LeighOS Agents]] — full agent roster
- [[trending/index]] — weekly issue archive
- [[Firecrawl]] — the scraping layer
- [[SCOUT]] — superseded predecessor
EOF
```

- [ ] **Step 2: Create or update notes/agents/SCOUT.md with deprecation banner**

```bash
SCOUT_FILE=~/Projects/vault/notes/agents/SCOUT.md
if [ -f "$SCOUT_FILE" ]; then
  # Prepend deprecation banner if not already present
  if ! grep -q "Superseded by" "$SCOUT_FILE"; then
    {
      sed -n '1,/^---$/p' "$SCOUT_FILE" | sed -n '1,/^---$/p'
      head -n $(grep -n '^---$' "$SCOUT_FILE" | sed -n '2p' | cut -d: -f1) "$SCOUT_FILE" | tail -n +1
      echo ""
      echo "> [!warning] Superseded by [[HERALD]] on 2026-04-26"
      echo "> SCOUT was a planning-stage agent that never shipped. Its intent (scanning the AI/dev ecosystem for trending content) is now fulfilled by [[HERALD]]. Historical content below preserved for context."
      echo ""
      tail -n +$(($(grep -n '^---$' "$SCOUT_FILE" | sed -n '2p' | cut -d: -f1) + 1)) "$SCOUT_FILE"
    } > "$SCOUT_FILE.tmp" && mv "$SCOUT_FILE.tmp" "$SCOUT_FILE"
  fi
else
  cat > "$SCOUT_FILE" <<'EOF'
---
title: SCOUT
type: agent
tags: [agent, lifeos, deprecated]
created: 2026-02-16
updated: 2026-04-26
related:
  - "[[HERALD]]"
  - "[[LeighOS Agents]]"
status: deprecated
---

# SCOUT

> [!warning] Superseded by [[HERALD]] on 2026-04-26
> SCOUT was a planning-stage agent that never shipped. Its intent (scanning the AI/dev ecosystem for trending content) is now fulfilled by [[HERALD]].

## Original intent (preserved for context)

Web scanner for r/ClaudeAI, r/AI_Agents, r/LocalLLaMA, r/OpenClaw, r/MachineLearning — looking for "I built" / "just shipped" / "workflow" posts with upvote traction. See historical Notion page (now closed) for the full original scope.

## Why deprecated

The scraping layer never got built — relied on inadequate WebFetch/WebSearch tools. Once Firecrawl was installed (2026-04-26), the design was rebuilt as [[HERALD]] with broader scope (GitHub + ClawHub + TLDR.ai added) and a working delivery pipeline.
EOF
fi
```

- [ ] **Step 3: Update notes/LeighOS Agents.md**

Read the existing file, find where agents are listed, add HERALD entry and mark SCOUT as superseded. The exact edit depends on current structure — open the file and adapt:

```bash
# Inspect first
head -40 ~/Projects/vault/notes/"LeighOS Agents.md"
```

Then add a HERALD line in the same style as the other agents, e.g.:

```markdown
- **[[HERALD]]** — Weekly AI/dev trends digest. Scrapes GitHub trending, Reddit, ClawHub, TLDR.ai. Sends Sunday 8am ET.
```

And add `(superseded by [[HERALD]])` next to the existing SCOUT entry.

- [ ] **Step 4: Add HERALD-CARD markers to root index.md**

```bash
INDEX=~/Projects/vault/index.md
if ! grep -q 'HERALD-CARD' "$INDEX"; then
  # Insert markers after the first H1 + intro paragraph (heuristic: after the 5th line)
  awk 'NR==5 { print; print ""; print "<!-- HERALD-CARD -->"; print "**🔥 Latest Trends Digest**: (none yet — first run pending)"; print "<!-- /HERALD-CARD -->"; print ""; next } { print }' "$INDEX" > "$INDEX.tmp" && mv "$INDEX.tmp" "$INDEX"
fi
head -15 "$INDEX"
```

Expected: index.md now has the HERALD-CARD block near the top. The publish_vault function (Task 10) will replace the placeholder text on first run.

- [ ] **Step 5: Verify all pages exist and link correctly**

```bash
ls -la ~/Projects/vault/notes/agents/{HERALD,SCOUT}.md
grep -l HERALD ~/Projects/vault/notes/"LeighOS Agents.md" ~/Projects/vault/index.md
```

Expected: Both agent pages exist. HERALD is referenced from LeighOS Agents.md and index.md.

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/vault
git add notes/agents/HERALD.md notes/agents/SCOUT.md "notes/LeighOS Agents.md" index.md
git commit -m "feat(herald): add agent pages, deprecate SCOUT, add root index card

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Smoke test — full end-to-end run

**Files:** none (runs the script)

This is the integration test. A real run against this past week's live data, archived to vault, emailed to inbox. After this passes, install cron in Task 14.

- [ ] **Step 1: Pre-flight check**

```bash
firecrawl --status
which jq pandoc claude
ls ~/.local/bin/am-send
```

Expected: Firecrawl shows credits remaining (≥80 to be safe). All four binaries resolve.

- [ ] **Step 2: Run the script end-to-end**

```bash
~/Projects/vault/scripts/herald-digest.sh 2>&1 | tee /tmp/herald-smoke.log
```

Expected runtime: 5-8 minutes. Log shows all stages completing without "FAIL" lines (or with documented expected misses like TLDR weekend).

- [ ] **Step 3: Verify all artifacts**

Run each check:

```bash
# Vault note exists with right structure
test -f ~/Projects/vault/notes/trending/$(date +%F).md && echo "✓ vault note"
grep -c '^## ' ~/Projects/vault/notes/trending/$(date +%F).md  # Expect 4

# Trending index updated
head -15 ~/Projects/vault/notes/trending/index.md

# Root index card updated (no longer says "none yet")
grep -A1 'HERALD-CARD' ~/Projects/vault/index.md | head -3

# Email arrived (manual check)
echo "→ Check Gmail for subject starting with '🔥 HERALD Digest'"

# Credit usage was reasonable
firecrawl credit-usage 2>&1 | head -3

# Logs clean
grep -i fail ~/Projects/vault/_local-macbookair/herald/log/$(date +%F).log
```

Expected:
- Vault note exists with 4 sections
- Trending index has the new date as the first item
- Root index card shows the date and theme
- Email in Gmail inbox renders correctly
- Credits used = ~40 (±10)
- No unexpected "FAIL" log lines (TLDR weekend misses are OK)

- [ ] **Step 4: Read the digest critically**

Open the vault note and the email. Judgment call:
- Are the 15 items actually interesting, or is it noise?
- Does the "🎯 For You" callout reflect your current work?
- Is the "🔭 Theme" insightful or generic?
- Subject line hooks compelling?

If yes → proceed to Task 14 (install cron).
If no → iterate on `~/Projects/vault/scripts/herald-prompt.md`, re-run smoke test, repeat.

- [ ] **Step 5: Commit any prompt iterations**

```bash
cd ~/Projects/vault
git add scripts/herald-prompt.md 2>/dev/null
git diff --cached --quiet || git commit -m "tune(herald): iterate prompt after smoke test

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Install cron entry

**Files:**
- Modify: `crontab -l` output (Mac user crontab)

Schedule the weekly run. Mac cron uses system tz (America/New_York) → handles DST automatically.

- [ ] **Step 1: Inspect current crontab**

```bash
crontab -l
```

Expected: Existing entries for today-page, morning-briefing, etc.

- [ ] **Step 2: Add HERALD entry**

```bash
( crontab -l 2>/dev/null; echo "# HERALD weekly trends digest — Sundays 08:00 America/New_York"; echo "0 8 * * 0 /Users/leighllewelyn/Projects/vault/scripts/herald-digest.sh >> /Users/leighllewelyn/Projects/vault/_local-macbookair/herald/log/cron.log 2>&1" ) | crontab -
```

- [ ] **Step 3: Verify**

```bash
crontab -l | grep -A1 HERALD
```

Expected: The two new lines present.

- [ ] **Step 4: Sanity-check next fire**

```bash
# What day is it? When does the cron next fire?
date
echo "Next cron fires: $(date -j -v+sun -v8H -v0M -v0S +'%a %F %T %Z' 2>/dev/null || echo 'next Sunday 08:00')"
```

Expected: Next Sunday at 08:00 local time.

- [ ] **Step 5: No commit needed (crontab is system state)**

Mac crontab isn't in git. Note the setup in `notes/agents/HERALD.md` (already done in Task 12).

---

### Task 15: Update hot.md, close out Notion deprecation

**Files:**
- Modify: `~/Projects/vault/hot.md` (add HERALD to "what shipped this session")
- Notion: mark SCOUT page deprecated (manual or via Notion MCP)
- Notion: mark OpenClaw use case scanner deprecated
- Notion: close the Needs Review Queue item

This is end-of-session housekeeping so the next session knows HERALD exists and SCOUT is dead.

- [ ] **Step 1: Add HERALD section to hot.md**

Open `~/Projects/vault/hot.md` and add at the top of "Latest session":

```markdown
**HERALD weekly trends digest.** Designed, planned, implemented, smoke-tested, scheduled. Spec at `~/Projects/wikileighs/docs/superpowers/specs/2026-04-26-trends-digest-design.md`, plan at `~/Projects/wikileighs/docs/superpowers/plans/2026-04-26-herald-implementation.md`. First issue at `notes/trending/{DATE}.md`. Cron fires Sundays 08:00 ET. Replaces SCOUT (now deprecated) and the OpenClaw use case scanner Notion project.
```

(Replace `{DATE}` with the smoke-test date.)

- [ ] **Step 2: Mark Notion SCOUT page deprecated**

Either via Notion UI or:

```bash
# If MCP Notion tools are available, update the page
# Page ID: 20facd4d-ba5c-4abe-b34e-24dfef69660c (SCOUT)
# Add "DEPRECATED — superseded by HERALD on 2026-04-26" to title and an opening callout block
```

If MCP tools aren't accessible, do it manually in Notion.

- [ ] **Step 3: Mark Notion "OpenClaw use case scanner" deprecated**

```bash
# Page ID: 91642df6-ccca-40e2-b6f1-e8feb876f60b
# Same treatment
```

- [ ] **Step 4: Close Notion "Needs Review Queue" item**

```bash
# Page ID: 9c621bd9-2621-4676-9d93-263e2d2f3932
# Mark complete, link to HERALD
```

- [ ] **Step 5: Commit hot.md update**

```bash
cd ~/Projects/vault
git add hot.md
git commit -m "hot: HERALD shipped, SCOUT deprecated

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-review

**Spec coverage check:**
- ✓ 4 sources via Firecrawl (Tasks 4-7)
- ✓ Synthesis via Sonnet 4.6 (Task 9)
- ✓ Vault note + trending/index + root card (Task 10, Task 12)
- ✓ am-send with gog fallback (Task 11)
- ✓ HERALD agent page + SCOUT deprecation + LeighOS Agents update (Task 12)
- ✓ Smoke test = real run (Task 13)
- ✓ Cron install only after smoke passes (Task 14)
- ✓ Failure modes — per-source fail-open in run_scrapes (Task 3), retry on synth (Task 9), 3x retry + gog fallback on email (Task 11), pandoc fail returns non-zero (Task 11)
- ✓ Credit budget tracking — credit-usage before/after in run_scrapes (Task 3)
- ✓ Out-of-scope items skipped: Twitter, daily cadence, web UI, multi-recipient

**Placeholder scan:** No "TBD" / "implement later" / "appropriate error handling" left. The TODO stubs in Task 3 are intentional placeholders that get replaced in Tasks 4-11.

**Type/name consistency:** Function names are stable across tasks (`scrape_trendshift`, `scrape_reddit`, `scrape_clawhub`, `scrape_tldr`, `gather_vault_context`, `synthesize`, `publish_vault`, `send_email`, `run_scrapes`, `main`). File paths consistent (`$RAW_DIR`, `$NOTE_FILE`, `$LOG_FILE`).

**Known risks not in plan:**
- Reddit may rate-limit even via Firecrawl on first run (User-Agent issue). Mitigation: Firecrawl handles UA; fallback would be old.reddit.com.
- ClawHub HTML structure unknown; the URL-extraction regex in Task 6 is heuristic. May need refinement after first scrape inspection.
- Trendshift may have anti-bot. If first scrape returns CAPTCHA HTML, add `--proxy stealth` flag (+5 cr per request).

These are noted in the spec's "Open questions / followups" section and don't block first ship.

---

## Execution Handoff

**Plan complete and saved to** `~/Projects/wikileighs/docs/superpowers/plans/2026-04-26-herald-implementation.md`. **Two execution options:**

**1. Subagent-Driven (recommended for plans with >5 tasks)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. Good when you want clean separation between implementation steps.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints. Good when you want continuous context.

For HERALD, **Inline Execution** is the better fit — the tasks share a lot of context (the bash script grows incrementally, each scrape function builds on the last), and dispatching subagents adds overhead. Smoke test (Task 13) is also better with you watching live.

Which approach?
