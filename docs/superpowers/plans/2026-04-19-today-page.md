# /today Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the live-computed `/today` Astro page with a daily-archived markdown artifact that lives at `~/Projects/vault/journal/today/YYYY-MM-DD.md`, regenerates hourly via openclaw cron + LLM summarization, and is rendered by WikiLeighs as a normal article.

**Architecture:** New openclaw cron runs a shell script (`gather.sh`) to collect raw data, then an agentTurn payload summarizes via gpt-5.4 and writes markdown into the vault. WikiLeighs adds two thin Astro routes (`/today` for today's date, `/today/[date]` for archive). A vault-side GitHub workflow fires `repository_dispatch(vault-changed)` on push, which triggers the existing wikileighs `deploy.yml` rebuild.

**Tech Stack:** Bash, jq, gog CLI, openclaw cron, Astro 5, TypeScript, gray-matter, marked, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-04-19-today-page-design.md`

---

## File Structure

**Create:**
- `~/.openclaw/workspace/today/gather.sh` — raw data collector, outputs JSON
- `~/Projects/wikileighs/src/pages/today/[date].astro` — archive route per date
- `~/Projects/vault/.github/workflows/notify-wikileighs.yml` — vault-side dispatcher

**Modify:**
- `~/.openclaw/cron/jobs.json` — append "Today Page Refresh" cron entry
- `~/Projects/wikileighs/src/pages/today.astro` — replace live computation with markdown loader + fallback
- `~/Projects/wikileighs/src/lib/vault.ts` — add `getTodayPage(date)` and `listTodayPageDates()` helpers

**Verify-only (already in place):**
- `~/Projects/wikileighs/.github/workflows/deploy.yml` — already listens for `repository_dispatch(vault-changed)`. No changes needed.

**Created at runtime by cron (not by this plan):**
- `~/Projects/vault/journal/today/YYYY-MM-DD.md` — first instance written by the first cron tick after deployment.

---

## Task 1: Create `gather.sh` raw data collector

**Files:**
- Create: `~/.openclaw/workspace/today/gather.sh`
- Test: run script and verify JSON shape (no test framework — bash + jq assertions)

- [ ] **Step 1: Create the workspace directory**

```bash
mkdir -p ~/.openclaw/workspace/today
```

- [ ] **Step 2: Write `gather.sh`**

Create `~/.openclaw/workspace/today/gather.sh` with this exact content:

```bash
#!/bin/bash
# gather.sh — collect raw data for the daily /today snapshot.
# Outputs a single JSON file to /tmp/today-raw-YYYYMMDD.json.
# Pure data collection — zero LLM, zero opinions. Each sub-command's
# failure is non-fatal: missing data becomes empty arrays / null.

set -uo pipefail  # NOT -e; sub-failures must not abort

VAULT_ROOT="${VAULT_ROOT:-$HOME/Projects/vault}"
DATE="${TODAY_DATE:-$(date '+%Y-%m-%d')}"
DATE_COMPACT="${DATE//-/}"
WEEKDAY="$(date '+%A')"
GENERATED_AT="$(date -Iseconds)"
YESTERDAY="$(date -v-1d '+%Y-%m-%d' 2>/dev/null || date -d 'yesterday' '+%Y-%m-%d')"
MIDNIGHT_EPOCH="$(date -j -f '%Y-%m-%d %H:%M:%S' "${DATE} 00:00:00" '+%s' 2>/dev/null \
  || date -d "${DATE} 00:00:00" '+%s')"
OUT="/tmp/today-raw-${DATE_COMPACT}.json"

# --- Helpers ---
log() { echo "[gather] $*" >&2; }
emit() { jq -n "$@"; }

# --- Calendar (gog) ---
cal_json='[]'
if command -v gog >/dev/null 2>&1; then
  END_DATE="$(date -v+1d '+%Y-%m-%d' 2>/dev/null || date -d 'tomorrow' '+%Y-%m-%d')"
  cal_raw="$(gog calendar events list --start "${DATE}T00:00:00" --end "${END_DATE}T00:00:00" -j 2>/dev/null || echo '{}')"
  cal_json="$(echo "$cal_raw" | jq '[.events // .items // [] | .[] | {start: (.start.dateTime // .start.date), end: (.end.dateTime // .end.date), title: .summary}]' 2>/dev/null || echo '[]')"
else
  log "gog not found; calendar empty"
fi

# --- Reminders (remindctl) ---
rem_json='[]'
if command -v remindctl >/dev/null 2>&1; then
  rem_raw="$(remindctl list --json 2>/dev/null || echo '[]')"
  # Filter to today/overdue (best-effort; schema may vary)
  rem_json="$(echo "$rem_raw" | jq --arg today "$DATE" '[.[]? | select((.due // "") <= $today and (.completed // false) == false) | {text: (.title // .text // ""), due: (.due // null), list: (.list // null)}]' 2>/dev/null || echo '[]')"
fi

# --- TODOs (TODO.md) ---
todos_path="$VAULT_ROOT/notes/TODO.md"
todos_json='{"raw_md":"","open_count":0}'
if [[ -f "$todos_path" ]]; then
  todos_raw="$(cat "$todos_path")"
  open_count="$(grep -cE '^- \[ \]' "$todos_path" || echo 0)"
  todos_json="$(jq -n --arg raw "$todos_raw" --argjson n "$open_count" '{raw_md: $raw, open_count: $n}')"
fi

# --- Voice memos (today's date prefix in journal/personal/) ---
vm_dir="$VAULT_ROOT/journal/personal"
vm_json='[]'
if [[ -d "$vm_dir" ]]; then
  vm_files=()
  while IFS= read -r f; do
    [[ -n "$f" ]] && vm_files+=("$f")
  done < <(find "$vm_dir" -maxdepth 1 -name "${DATE}-*.md" -type f 2>/dev/null | sort)
  if (( ${#vm_files[@]} > 0 )); then
    arr='[]'
    for f in "${vm_files[@]}"; do
      base="$(basename "$f" .md)"
      # Preview = first 5 non-empty lines after "## Clean Transcript"
      preview="$(awk '/^## Clean Transcript/{flag=1; next} flag && NF{print; n++; if(n>=5) exit}' "$f" | jq -Rs '.' 2>/dev/null || echo '""')"
      arr="$(echo "$arr" | jq --arg path "journal/personal/$(basename "$f")" --arg title "$base" --argjson preview "$preview" '. += [{path: $path, title: $title, preview: $preview}]')"
    done
    vm_json="$arr"
  fi
fi

# --- Vault added today (excluding journal/today/) ---
added_json='[]'
if [[ -d "$VAULT_ROOT/.git" ]]; then
  added_raw="$(git -C "$VAULT_ROOT" log --since=midnight --diff-filter=A --name-only --pretty=format: 2>/dev/null | sort -u | grep -v '^$' | grep -v '^journal/today/' || true)"
  if [[ -n "$added_raw" ]]; then
    added_json="$(echo "$added_raw" | jq -R -s 'split("\n") | map(select(length > 0)) | map({path: ., title: (split("/") | last | sub("\\.md$"; ""))})')"
  fi
fi

# --- Vault updated today (excluding journal/today/, journal/personal/, inbox/) ---
updated_json='[]'
if [[ -d "$VAULT_ROOT/.git" ]]; then
  updated_raw="$(git -C "$VAULT_ROOT" log --since=midnight --diff-filter=M --name-only --pretty=format: 2>/dev/null | sort -u | grep -v '^$' | grep -v '^journal/today/' | grep -v '^journal/personal/' | grep -v '^inbox/' || true)"
  if [[ -n "$updated_raw" ]]; then
    updated_json="$(echo "$updated_raw" | jq -R -s 'split("\n") | map(select(length > 0)) | map({path: ., title: (split("/") | last | sub("\\.md$"; ""))})')"
  fi
fi

# --- Inbox added today ---
inbox_json='[]'
inbox_dir="$VAULT_ROOT/inbox"
if [[ -d "$inbox_dir" ]]; then
  inbox_arr='[]'
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    file_epoch="$(stat -f '%m' "$f" 2>/dev/null || stat -c '%Y' "$f" 2>/dev/null || echo 0)"
    if (( file_epoch >= MIDNIGHT_EPOCH )); then
      base="$(basename "$f" .md)"
      inbox_arr="$(echo "$inbox_arr" | jq --arg path "inbox/$(basename "$f")" --arg title "$base" '. += [{path: $path, title: $title}]')"
    fi
  done < <(find "$inbox_dir" -maxdepth 1 -name '*.md' -type f 2>/dev/null)
  inbox_json="$inbox_arr"
fi

# --- Cron runs today (parsed from openclaw cron run jsonl files) ---
cron_json='[]'
runs_dir="$HOME/.openclaw/cron/runs"
if [[ -d "$runs_dir" ]]; then
  # Aggregate by job_id: count runs, count ok/error, capture last
  cron_json="$(find "$runs_dir" -name '*.jsonl' -type f 2>/dev/null \
    | xargs -I{} cat {} 2>/dev/null \
    | jq -s --argjson midnight "$MIDNIGHT_EPOCH" '
        map(select((.startedAtMs // 0) / 1000 >= $midnight))
        | group_by(.jobId)
        | map({
            job_id: .[0].jobId,
            name: (.[0].jobName // .[0].name // "unknown"),
            runs_today: length,
            ok: (map(select(.status == "ok")) | length),
            error: (map(select(.status == "error")) | length),
            last_status: (sort_by(.startedAtMs) | last | .status),
            last_summary: (sort_by(.startedAtMs) | last | (.replyText // .reply // "") | tostring | .[0:200])
          })' 2>/dev/null || echo '[]')"
fi

# --- Yesterday's briefing (parse from yesterday's snapshot if it exists) ---
yest_path="$VAULT_ROOT/journal/today/${YESTERDAY}.md"
yest_briefing='null'
yest_open_count=0
if [[ -f "$yest_path" ]]; then
  yest_briefing="$(awk '/^## Briefing/{flag=1; next} /^## /{flag=0} flag && NF{print}' "$yest_path" \
    | sed '/^[[:space:]]*$/d' | jq -Rs '.' 2>/dev/null || echo 'null')"
  # Count open TODOs as of yesterday's file (best-effort)
  yest_open_count="$(grep -cE '^- \[ \]' "$yest_path" || echo 0)"
fi

# --- Assemble ---
jq -n \
  --arg date "$DATE" \
  --arg weekday "$WEEKDAY" \
  --arg generated_at "$GENERATED_AT" \
  --argjson calendar "$cal_json" \
  --argjson reminders "$rem_json" \
  --argjson todos "$todos_json" \
  --argjson voice_memos "$vm_json" \
  --argjson vault_added "$added_json" \
  --argjson vault_updated "$updated_json" \
  --argjson inbox_added "$inbox_json" \
  --argjson cron_runs "$cron_json" \
  --argjson yesterday_briefing "$yest_briefing" \
  --argjson yesterday_open_todos_count "$yest_open_count" \
  '{
    date: $date,
    weekday: $weekday,
    generated_at: $generated_at,
    calendar: $calendar,
    reminders: $reminders,
    todos: $todos,
    voice_memos: $voice_memos,
    vault_added: $vault_added,
    vault_updated: $vault_updated,
    inbox_added: $inbox_added,
    cron_runs: $cron_runs,
    yesterday_briefing: $yesterday_briefing,
    yesterday_open_todos_count: $yesterday_open_todos_count
  }' > "$OUT"

echo "$OUT"
log "wrote $OUT"
```

- [ ] **Step 3: Make executable**

```bash
chmod +x ~/.openclaw/workspace/today/gather.sh
```

- [ ] **Step 4: Run gather.sh and assert JSON validity**

```bash
out=$(~/.openclaw/workspace/today/gather.sh)
echo "Output file: $out"
jq -e 'has("date") and has("calendar") and has("voice_memos") and has("cron_runs")' "$out"
```

Expected: outputs the path `/tmp/today-raw-20260419.json` and `jq -e` prints `true`.

- [ ] **Step 5: Sanity-check shape**

```bash
jq '{date, voice_memo_count: (.voice_memos | length), cron_run_groups: (.cron_runs | length), yesterday_has_briefing: (.yesterday_briefing != null)}' /tmp/today-raw-20260419.json
```

Expected: a small JSON object showing today's date, the number of voice memos for today (1 for 2026-04-19), the number of cron job groupings (≥3 — voice memo, agent backup, morning briefing), and whether yesterday's briefing was found (false on day 1, true thereafter).

- [ ] **Step 6: Commit (workspace)**

```bash
cd ~/.openclaw/workspace && git add today/gather.sh 2>/dev/null && git commit -m "today: add gather.sh raw data collector" --no-verify -q 2>/dev/null || echo "workspace not git-tracked or no commit needed"
```

The openclaw workspace may not be a git repo at the workspace root — if not, this is a no-op. The Agent Config Backup cron will pick the file up on its next sanitized push.

---

## Task 2: Add the cron job

**Files:**
- Modify: `~/.openclaw/cron/jobs.json`

- [ ] **Step 1: Backup current jobs.json**

```bash
cp ~/.openclaw/cron/jobs.json ~/.openclaw/cron/jobs.json.bak-$(date '+%Y-%m-%d-%H%M')
```

- [ ] **Step 2: Read current jobs.json structure**

```bash
jq '.jobs | length' ~/.openclaw/cron/jobs.json
```

Note the existing job count for sanity-checking after the edit.

- [ ] **Step 3: Append the new job using `jq`**

Run this single command — it inserts the new job at the end of `.jobs`:

```bash
jq --arg msg "$(cat <<'PROMPT'
You are generating Leigh's daily snapshot page. Today is {{DATE}} ({{WEEKDAY}}).

Step 1: Run the data collector and capture its output path:
  RAW_PATH="$(~/.openclaw/workspace/today/gather.sh)"

If the script exits non-zero or RAW_PATH is empty, send an error email and stop:
  gog gmail send --to leigh.llewelyn@gmail.com --subject "Today page generation failed — gather.sh" --body "<stderr from gather.sh>"
  Reply: today_page_written=error reason=gather_failed

Step 2: Read the JSON: cat $RAW_PATH

Step 3: Generate two LLM-written sections:

A. **Briefing** (60–100 words). Synthesize what's notable about the day so far. Pull signal from voice_memos, vault_added, vault_updated, inbox_added, cron_runs, calendar. Voice: matter-of-fact, dry. Skip filler. If the day is quiet, say so in one sentence and stop.

B. **Agent activity** (1–2 sentences). Lead with errors if cron_runs has any (.error > 0). Otherwise summarize total volume + outcome. Do NOT list every job — that's for the <details> block.

Also: for each voice memo, write one line capturing the single most actionable or salient point.

Step 4: Write the markdown file to ~/Projects/vault/journal/today/{{DATE}}.md using this template (omit any section whose data is empty, except Calendar and Open TODOs which always render):

---
title: {{WEEKDAY}}, {{MONTH_DAY}} {{YEAR}}
type: today
tags: [today, daily-snapshot]
created: {{DATE}}
updated: {{ISO_TIMESTAMP}}
source: today-cron
---

# {{WEEKDAY}}, {{MONTH_DAY}} {{YEAR}}

*Last updated {{HUMAN_TIME}}. Next refresh top of the hour.*

## Briefing

{{briefing prose}}

## What's new

### Voice memos ({{N}})
- [[<memo title>]] — <one-line summary>
(repeat per memo; skip section if N=0)

### Vault content ({{X}} added · {{Y}} updated)
**Added**
- [[<title>]] — <type from frontmatter or "note">
**Updated**
- [[<title>]] — <type>
(skip section if X=Y=0; skip "Added" or "Updated" sub-headings if their list is empty)

### Inbox captures ({{N}})
- [[<title>]]
(skip section if N=0)

## Agent activity

{{agent activity prose}}

<details>
<summary>Detail ({{total_runs}} runs)</summary>

- **<job name>** — <runs_today> runs · <ok> OK · <error> errors
(repeat per cron_run group)

</details>

## Today ahead

### Calendar
- **<HH:MM AM/PM>** — <title>
(if no events: "No calendar events today.")

### Reminders due ({{N}})
- <text>
(skip section if N=0)

### Open TODOs ({{N}})
{{raw TODO.md content rendered as markdown — preserve sub-headings; checkbox items render as bullets}}

<details>
<summary>Yesterday ({{YESTERDAY_WEEKDAY}}, {{YESTERDAY_MONTH_DAY}}) ▸</summary>

**Briefing:** {{yesterday_briefing}}

**Carryover:** {{yesterday_open_todos_count}} TODOs were also open yesterday.

</details>
(omit Yesterday tail entirely if yesterday_briefing is null)

Step 5: Commit and push the vault:
  cd ~/Projects/vault
  git add journal/today/{{DATE}}.md
  git commit -m "today: {{DATE}} {{HH:MM}}" --no-verify -q
  git push origin main 2>&1 || echo "push deferred (next tick will retry)"

Reply with one line: today_page_written=ok briefing_words=<n> sections=<n>
PROMPT
)" '
.jobs += [{
  "id": "today-page-refresh-2026",
  "name": "Today Page Refresh",
  "enabled": true,
  "createdAtMs": (now * 1000 | floor),
  "updatedAtMs": (now * 1000 | floor),
  "schedule": {
    "kind": "cron",
    "expr": "30 7-23 * * *",
    "tz": "America/New_York",
    "staggerMs": 60000
  },
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": $msg,
    "timeoutSeconds": 600,
    "model": "openai-codex/gpt-5.4"
  },
  "delivery": {"mode": "none", "channel": "whatsapp", "to": "+16467374989"},
  "state": {"consecutiveErrors": 0}
}]' ~/.openclaw/cron/jobs.json > /tmp/jobs.json.new && mv /tmp/jobs.json.new ~/.openclaw/cron/jobs.json
```

- [ ] **Step 4: Validate JSON**

```bash
python3 -c "import json; d=json.load(open('/Users/$USER/.openclaw/cron/jobs.json')); job=[j for j in d['jobs'] if j['id']=='today-page-refresh-2026'][0]; print('valid; message len:', len(job['payload']['message']))"
```

Expected: `valid; message len: <some 2000+ number>`.

- [ ] **Step 5: Sanity-check job count grew by exactly 1**

```bash
jq '.jobs | length' ~/.openclaw/cron/jobs.json
```

Expected: previous count + 1.

- [ ] **Step 6: Manually trigger one run to verify**

The cron will fire on its own at the next HH:30 boundary. To not wait, manually run the agent prompt against the model. Easiest: shell out via openclaw's CLI if available, OR just verify the next cron tick by watching `~/.openclaw/cron/runs/today-page-refresh-2026-*.jsonl`.

```bash
# Wait for next HH:30 cron tick, then check:
ls -lat ~/.openclaw/cron/runs/today-page-refresh-2026-*.jsonl 2>/dev/null | head -1
ls -la ~/Projects/vault/journal/today/$(date '+%Y-%m-%d').md 2>/dev/null
```

Expected (after the tick): both files exist; the markdown file has frontmatter and at least the Briefing section.

---

## Task 3: Add `getTodayPage` and `listTodayPageDates` helpers to vault.ts

**Files:**
- Modify: `~/Projects/wikileighs/src/lib/vault.ts:677` (add new functions after `getDailyNote`)

- [ ] **Step 1: Add the two new helper functions**

Open `~/Projects/wikileighs/src/lib/vault.ts` and insert immediately after the `getDailyNote` function (line 677):

```typescript
export function getTodayPage(date: Date): Article | null {
  const stamp = formatYMDDashed(date);
  const abs = path.join(VAULT_ROOT!, 'journal', 'today', `${stamp}.md`);
  if (!fs.existsSync(abs)) return null;
  return loadStandaloneMdFile(abs, `journal/today/${stamp}.md`);
}

export function listTodayPageDates(): string[] {
  const dir = path.join(VAULT_ROOT!, 'journal', 'today');
  if (!fs.existsSync(dir)) return [];
  const files = fg.sync(['*.md'], { cwd: dir, onlyFiles: true });
  return files
    .map((f) => f.replace(/\.md$/, ''))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse();
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd ~/Projects/wikileighs && npx astro check 2>&1 | tail -20
```

Expected: 0 errors. (Warnings are fine.)

- [ ] **Step 3: Commit**

```bash
cd ~/Projects/wikileighs && git add src/lib/vault.ts && git commit -m "feat(vault): add getTodayPage + listTodayPageDates helpers" --no-verify -q
```

---

## Task 4: Replace `today.astro` with thin loader

**Files:**
- Modify: `~/Projects/wikileighs/src/pages/today.astro` (full replacement)

- [ ] **Step 1: Replace the file with this exact content**

```astro
---
import Base from '../layouts/Base.astro';
import { getTodayPage } from '../lib/vault';

const today = new Date();
const todayPage = getTodayPage(today);

const weekday = today.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
const monthDay = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
const headerDate = `${weekday}, ${monthDay}`;
const BASE_URL = import.meta.env.BASE_URL;
---
<Base title="Today" description={`Daily snapshot for ${headerDate}.`}>
  <div class="breadcrumb"><a href={BASE_URL}>Main page</a> · Today</div>
  {todayPage ? (
    <article class="article-body">
      <Fragment set:html={todayPage.html} />
    </article>
  ) : (
    <article class="article-body">
      <h1>{headerDate}</h1>
      <p style="color: var(--color-muted);">
        <em>Today's snapshot hasn't been generated yet. The next refresh fires at the top of each hour from 7 AM to 11 PM EDT.</em>
      </p>
      <p>
        Meanwhile: <a href={`${BASE_URL}today/${(() => {
          const y = new Date(today);
          y.setDate(y.getDate() - 1);
          return y.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
        })()}`}>Yesterday's snapshot ▸</a>
      </p>
    </article>
  )}
</Base>
```

- [ ] **Step 2: Run build to verify no errors**

```bash
cd ~/Projects/wikileighs && pnpm build 2>&1 | tail -20
```

Expected: build succeeds, page count increases or stays roughly the same.

- [ ] **Step 3: Visual check via dev server**

```bash
cd ~/Projects/wikileighs && pnpm dev &
sleep 3
curl -s http://127.0.0.1:4321/today | head -40
```

Expected: HTML output includes either the snapshot body OR the fallback paragraph. Stop the dev server with `kill %1` after.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/wikileighs && git add src/pages/today.astro && git commit -m "feat(today): replace live computation with snapshot loader + fallback" --no-verify -q
```

---

## Task 5: Add archive route `today/[date].astro`

**Files:**
- Create: `~/Projects/wikileighs/src/pages/today/[date].astro`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p ~/Projects/wikileighs/src/pages/today
```

Then write `~/Projects/wikileighs/src/pages/today/[date].astro` with:

```astro
---
import Base from '../../layouts/Base.astro';
import { getTodayPage, listTodayPageDates } from '../../lib/vault';

export function getStaticPaths() {
  return listTodayPageDates().map((date) => ({ params: { date } }));
}

const { date } = Astro.params;
const parsed = new Date(`${date}T12:00:00-04:00`);
const page = getTodayPage(parsed);

const weekday = parsed.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
const monthDay = parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
const headerDate = `${weekday}, ${monthDay}`;
const BASE_URL = import.meta.env.BASE_URL;
---
<Base title={`Today — ${date}`} description={`Daily snapshot for ${headerDate}.`}>
  <div class="breadcrumb">
    <a href={BASE_URL}>Main page</a> · <a href={`${BASE_URL}today`}>Today</a> · {date}
  </div>
  {page ? (
    <article class="article-body">
      <Fragment set:html={page.html} />
    </article>
  ) : (
    <article class="article-body">
      <h1>{headerDate}</h1>
      <p style="color: var(--color-muted);"><em>No snapshot exists for this date.</em></p>
    </article>
  )}
</Base>
```

- [ ] **Step 2: Run build to verify static paths generate**

```bash
cd ~/Projects/wikileighs && pnpm build 2>&1 | grep -E "(today|page)" | head -10
```

Expected: build log shows `/today/<date>` paths being generated (one per file in `journal/today/`).

- [ ] **Step 3: Commit**

```bash
cd ~/Projects/wikileighs && git add src/pages/today/ && git commit -m "feat(today): add archive route /today/[date]" --no-verify -q
```

---

## Task 6: Add vault-side `notify-wikileighs.yml` workflow

**Files:**
- Create: `~/Projects/vault/.github/workflows/notify-wikileighs.yml`

**Prerequisite (Leigh manual action):** Create a fine-grained PAT scoped to `CoolGandalf/wikileighs` with **Actions: Read and write** permission only. 90-day expiry. Add it as a secret named `WIKILEIGHS_DISPATCH_PAT` in the **vault repo** (`CoolGandalf/leigh-wiki`) settings → Secrets and variables → Actions.

- [ ] **Step 1: Create the .github/workflows directory in the vault**

```bash
mkdir -p ~/Projects/vault/.github/workflows
```

- [ ] **Step 2: Write the workflow file**

Create `~/Projects/vault/.github/workflows/notify-wikileighs.yml` with:

```yaml
name: Notify wikileighs of vault changes

on:
  push:
    branches: [main]

jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - name: Fire repository_dispatch to wikileighs
        env:
          PAT: ${{ secrets.WIKILEIGHS_DISPATCH_PAT }}
        run: |
          curl -fsS -X POST \
            -H "Authorization: Bearer $PAT" \
            -H "Accept: application/vnd.github+json" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            https://api.github.com/repos/CoolGandalf/wikileighs/dispatches \
            -d '{"event_type":"vault-changed","client_payload":{"sha":"${{ github.sha }}","ref":"${{ github.ref }}"}}'
```

- [ ] **Step 3: Confirm the secret exists (Leigh manual)**

Manual check via UI: go to `https://github.com/CoolGandalf/leigh-wiki/settings/secrets/actions` and confirm `WIKILEIGHS_DISPATCH_PAT` is listed. If not, this task is blocked until the PAT is created.

- [ ] **Step 4: Commit and push the vault workflow**

```bash
cd ~/Projects/vault && git add .github/workflows/notify-wikileighs.yml && git commit -m "ci: notify wikileighs on vault push (repository_dispatch)" --no-verify -q && git push origin main
```

- [ ] **Step 5: Verify the workflow ran**

```bash
gh run list --repo CoolGandalf/leigh-wiki --workflow notify-wikileighs.yml --limit 1
```

Expected: one row showing `completed success` (or `in_progress`). If it failed with auth error, the PAT is missing or wrong-scoped — return to the prerequisite.

- [ ] **Step 6: Verify wikileighs deploy fired in response**

```bash
gh run list --repo CoolGandalf/wikileighs --workflow deploy.yml --limit 2
```

Expected: most-recent run with event `repository_dispatch`, status `completed success` (or in-progress).

---

## Task 7: End-to-end verification

This task has no files to create or modify — it confirms the system works.

- [ ] **Step 1: Confirm gather.sh produces complete data**

```bash
out=$(~/.openclaw/workspace/today/gather.sh)
jq '{
  date,
  voice_memos: (.voice_memos | length),
  vault_added: (.vault_added | length),
  vault_updated: (.vault_updated | length),
  inbox_added: (.inbox_added | length),
  cron_runs: (.cron_runs | length),
  yesterday: (.yesterday_briefing != null)
}' "$out"
```

Expected: every numeric field is a non-negative integer; `yesterday` is true or false (false only on day 1).

- [ ] **Step 2: Wait for the next HH:30 cron tick OR manually trigger**

If you can wait: just look at the clock and wait for HH:30. If you can't: openclaw may support `agent run-job <id>` or similar; otherwise edit the `nextRunAtMs` field in jobs.json to within the next minute.

```bash
# Watch for the cron to fire
ls -lat ~/.openclaw/cron/runs/ 2>/dev/null | head -3
```

- [ ] **Step 3: Confirm the markdown file got written**

```bash
ls -la ~/Projects/vault/journal/today/$(date '+%Y-%m-%d').md
head -40 ~/Projects/vault/journal/today/$(date '+%Y-%m-%d').md
```

Expected: file exists; frontmatter is valid YAML with `type: today`; body has at least `# <date>`, `## Briefing`, `## Today ahead` sections.

- [ ] **Step 4: Confirm vault auto-pushed**

```bash
git -C ~/Projects/vault log --oneline -2
git -C ~/Projects/vault log origin/main..HEAD --oneline
```

Expected: most-recent commit is `today: <date> <HH:MM>`; second command outputs nothing (everything pushed).

- [ ] **Step 5: Confirm wikileighs rebuild fired**

```bash
gh run list --repo CoolGandalf/wikileighs --workflow deploy.yml --limit 1
```

Expected: most-recent run created within the last 2 minutes, event `repository_dispatch`, status `in_progress` or `completed success`.

- [ ] **Step 6: Visual check the live page**

After the deploy completes (~3–4 min):

```bash
open https://lgl.gg/wikileighs/today
```

Or in a browser. Confirm the page shows today's date, the Briefing section, and any "What's new" content.

- [ ] **Step 7: Visual check an archive page**

```bash
open "https://lgl.gg/wikileighs/today/$(date '+%Y-%m-%d')"
```

Expected: same content as `/today` (since `/today` redirects to today's date).

- [ ] **Step 8: Wait for the NEXT cron tick and confirm idempotency**

Wait one hour. Verify:

```bash
git -C ~/Projects/vault log --oneline -2 -- journal/today/$(date '+%Y-%m-%d').md
```

Expected: second commit on the same file with an updated `HH:MM` in the message. The page content should reflect any new data captured between the two ticks.

---

## Self-review checklist

Run through this before handing off to execution:

- [x] Spec section "Architecture" → covered by Tasks 1, 2, 3+4+5
- [x] Spec section "Component 1: gather.sh" → Task 1 (full script)
- [x] Spec section "Component 2: openclaw cron job" → Task 2 (jq insertion + manual verification)
- [x] Spec section "Component 3: WikiLeighs route" → Tasks 3 (helpers), 4 (today.astro), 5 (archive)
- [x] Spec section "Auto-rebuild hook" → Task 6 (vault-side; wikileighs side already exists per `deploy.yml`)
- [x] Spec section "Page structure" → embodied in Task 2 (cron prompt) markdown template
- [x] Spec section "Agent prompt" → Task 2 (verbatim, with template placeholders)
- [x] Spec section "Data sources" → Task 1 (gather.sh implements all approved sources from buckets 1, 2, 3)
- [x] Spec section "Error handling" → Task 1 (sub-command failures → empty fields), Task 2 (gather.sh failure → email), fallback page in Task 4
- [x] Spec section "Verification plan" → Task 7 (each step in the spec maps to a step here)

Type / signature consistency:
- [x] `getTodayPage(date: Date)` — used same signature in Tasks 3, 4, 5
- [x] `listTodayPageDates()` returns `string[]` of `YYYY-MM-DD` — consumed correctly by `getStaticPaths` in Task 5
- [x] `journal/today/YYYY-MM-DD.md` path convention used consistently across gather.sh, cron prompt, vault helpers, archive route
- [x] Cron job ID `today-page-refresh-2026` referenced in Task 7's `~/.openclaw/cron/runs/<id>-*.jsonl` glob

No placeholders found.
