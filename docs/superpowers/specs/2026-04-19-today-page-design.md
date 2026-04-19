# /today Page — Design Spec

**Date:** 2026-04-19
**Status:** Approved (brainstorming complete; ready for implementation plan)
**Author:** Cortana session 2026-04-19

## Goal

Replace the current `/today` Astro page with a daily-archived markdown
artifact that lives in the vault, regenerates hourly, freezes at midnight,
and gives Leigh a single page to scan in the morning, throughout the day,
or at end-of-day review. Historical lookback by date for free.

## Decisions locked in brainstorming

- **Time window:** strict calendar day (America/New_York), with a collapsed
  "Yesterday" tail at the bottom for morning context.
- **Generation lifecycle:** continuous regeneration. An openclaw cron rewrites
  `journal/today/YYYY-MM-DD.md` hourly; the midnight tick is naturally the
  last write of the day and freezes the snapshot.
- **Section order:** news-first
  (Briefing → What's new → Agent activity → Today ahead → Yesterday tail).
- **Content sources** approved (see §"Data sources"); Notion mirror dropped.
- **Agent activity must be summarized** (1–2 sentences), not bullet-dumped.
  Raw detail goes in a collapsed `<details>` block beneath the summary.
- **Build pipeline:** openclaw cron runs a shell gather script + agent turn
  that summarizes + writes the markdown. WikiLeighs renders the markdown
  like any other vault article.

## Architecture

Three components, each with one responsibility:

```
hourly cron  ─┐
              ├──► gather.sh ──► /tmp/today-raw-YYYYMMDD.json
              │
              └──► openclaw agent turn ──► reads JSON
                                       ├──► generates Briefing prose
                                       ├──► generates Agent-activity prose
                                       └──► writes journal/today/YYYY-MM-DD.md
                                                            │
                                                            ▼
                                          git add + commit + push (vault)
                                                            │
                                                            ▼
                                  vault push triggers wikileighs rebuild
                                  via repository_dispatch (new hook)
                                                            │
                                                            ▼
                                  WikiLeighs /today route loads today's
                                  date and renders the markdown
```

### Component 1: `~/.openclaw/workspace/today/gather.sh`

Pure data collector. Zero LLM, zero opinions. Writes one JSON file.

**Output schema** (`/tmp/today-raw-YYYYMMDD.json`):

```json
{
  "date": "2026-04-19",
  "weekday": "Sunday",
  "generated_at": "2026-04-19T16:04:00-04:00",
  "calendar": [
    {"start": "2026-04-19T15:00:00-04:00", "end": "...", "title": "Doctor appointment"}
  ],
  "reminders": [
    {"text": "Pick up dry cleaning", "due": "2026-04-19", "list": "Personal"}
  ],
  "todos": {
    "raw_md": "<full TODO.md content>",
    "open_count": 16
  },
  "voice_memos": [
    {
      "path": "journal/personal/2026-04-19-121450.md",
      "title": "2026-04-19-121450",
      "preview": "<first 5 non-empty lines of clean transcript>"
    }
  ],
  "vault_added": [
    {"path": "notes/places/Dead Letter No 9.md", "title": "Dead Letter No. 9"}
  ],
  "vault_updated": [
    {"path": "notes/people/Helen Lewis.md", "title": "Helen Lewis"}
  ],
  "inbox_added": [
    {"path": "inbox/2026-04-19-xda-claude-code-desktop-control-for-a-week.md", "title": "..."}
  ],
  "cron_runs": [
    {
      "job_id": "e5f1efce-...",
      "name": "Voice Memo Transcribe Hourly",
      "runs_today": 9,
      "ok": 9,
      "error": 0,
      "last_status": "ok",
      "last_summary": "fresh=0 backlog=0 actions=0"
    }
  ],
  "yesterday_briefing": "<paragraph copied verbatim from yesterday's file's ## Briefing section, or null>",
  "yesterday_open_todos_count": 16
}
```

**Data source commands:**

| Field | Source |
|---|---|
| calendar | `gog calendar events list --start <today> --end <tomorrow> -j` |
| reminders | `remindctl list --json` filtered to today/overdue |
| todos | `cat ~/Projects/vault/notes/TODO.md` + count lines matching `^- \[ \]` |
| voice_memos | `find ~/Projects/vault/journal/personal -name "<today>-*.md"` + parse |
| vault_added | `git -C ~/Projects/vault log --since=midnight --diff-filter=A --name-only --pretty=format: \| sort -u` |
| vault_updated | `git -C ~/Projects/vault log --since=midnight --diff-filter=M --name-only --pretty=format: \| sort -u \| grep -v "^journal/today/"` |
| inbox_added | `find ~/Projects/vault/inbox -newer <midnight-marker> -name "*.md"` |
| cron_runs | `find ~/.openclaw/cron/runs -name "*.jsonl" -newer <midnight-marker>` |
| yesterday_briefing | parse `journal/today/<yesterday>.md` between `## Briefing` and next `##` |

**Failure mode:** any sub-command failure logs to stderr but does NOT abort.
The JSON contains whatever was successfully gathered; missing keys default
to empty arrays / nulls. The agent's prompt handles missing data
gracefully ("No calendar events today" etc.).

### Component 2: openclaw cron job

New job in `~/.openclaw/cron/jobs.json`:

- **Name:** `Today Page Refresh`
- **Schedule:** `cron 0 7-23 * * *`, tz `America/New_York`, staggerMs 60000
  (1-minute random offset to avoid colliding with voice-memo cron at minute 0)
- **wakeMode:** `now`
- **sessionTarget:** `isolated`
- **payload:**
  - `kind: agentTurn`
  - `model: openai-codex/gpt-5.4`
  - `timeoutSeconds: 600`
  - `message:` see §"Agent prompt" below
- **delivery:** `mode: none` (no WhatsApp; the page itself is the deliverable)

### Component 3: WikiLeighs route

**Replace** `src/pages/today.astro` with a thin loader:

```typescript
// Pseudocode
const today = new Date()
  .toLocaleDateString('en-CA', { timeZone: 'America/New_York' });  // YYYY-MM-DD
const slug = `journal-today-${today}`;
const article = getArticleBySlug(slug);

if (article) {
  // Render normal article body via existing pipeline
} else {
  // Fallback: "Page hasn't refreshed yet today" + yesterday's briefing inline
}
```

**Add** `src/pages/today/[date].astro` for archive lookup. `getStaticPaths`
enumerates every `journal/today/*.md` file. Hitting `/today/2026-04-19`
renders that day's snapshot.

**Auto-rebuild hook** (bundled — required for /today to be useful):
- Add `.github/workflows/rebuild-on-vault-push.yml` to wikileighs that
  triggers on `repository_dispatch` event type `vault-changed`.
- Add a vault-side workflow (or git post-receive equivalent) that fires
  `repository_dispatch` to wikileighs on every push. Use a dedicated PAT
  scoped to wikileighs Actions: write only.
- Once in place, every cron tick → vault commit + push → wikileighs rebuild
  → live deploy in ~3–4 minutes.

## Page structure (markdown skeleton)

```markdown
---
title: Sunday, April 19 2026
type: today
tags: [today, daily-snapshot]
created: 2026-04-19
updated: 2026-04-19T16:04:00-04:00
source: today-cron
---

# Sunday, April 19 2026

*Last updated 4:04 PM. Next refresh top of the hour.*

## Briefing

<60–100 word LLM-generated paragraph synthesizing what is notable about
the day so far. Pulls signal from voice memos + new content + agent
activity + calendar. Tone: matter-of-fact, dry-British (Giles register).
Morning runs draw from overnight signal; later runs read as a recap.>

## What's new

### Voice memos (N)
- [[YYYY-MM-DD-HHMMSS]] — <1-line LLM summary per memo>
(Section omitted entirely if N == 0.)

### Vault content (X added · Y updated)
**Added**
- [[Title]] — (frontmatter `type`, e.g. "person", "place")
**Updated**
- [[Title]] — (frontmatter `type`)
(Section omitted if X == Y == 0. "Added" / "Updated" sub-headings
omitted if their list is empty.)

### Inbox captures (N)
- [[2026-04-19-xda-…]]
(Section omitted if N == 0.)

## Agent activity

<1–2 sentence LLM summary. Includes any errors prominently.>

<details>
<summary>Detail (N runs)</summary>

- **Voice Memo Transcribe Hourly** — 9 runs · 9 OK · 0 errors
- **Morning Briefing 7:15** — 1 run · 0 OK · 1 error (auth)
- **Agent Config Backup** — 1 run · 0 OK · 1 error (auth)
…

</details>

## Today ahead

### Calendar
- **3:00 PM** — Doctor appointment
- **6:00 PM** — Family dinner
(Section reads "No calendar events today." if empty.)

### Reminders due (N)
- Pick up dry cleaning
- Call insurance
(Section omitted if N == 0.)

### Open TODOs (N)
<rendered from TODO.md, preserving sub-headings;
each `- [ ] item` rendered as a bullet, [[wikilinks]] preserved>

<details>
<summary>Yesterday (Saturday, April 18) ▸</summary>

**Briefing:** <yesterday's briefing paragraph, copied verbatim from yesterday's file>

**Carryover:** N TODOs were also open yesterday.

</details>
```

**Section omission rules:** any section with zero items is omitted entirely
(except "Calendar" and "Open TODOs" — those always render with an "empty"
state because they're foundational). Saves visual clutter on quiet days.

## Agent prompt

```
You are generating Leigh's daily snapshot page. Today is {{date}}.

Read the raw data: {{json_path}}

Write a markdown file to: ~/Projects/vault/journal/today/{{date}}.md

Use this template (fill the <bracketed> sections, omit empty optional sections):

{{markdown_template}}

Constraints for the LLM-generated sections:

## Briefing (60-100 words)
- Synthesize what's notable about the day so far
- Pull signal from: voice memos, new vault content, agent activity, calendar
- Voice: matter-of-fact, dry; Giles register if a personality choice is needed
- Skip filler ("Today is a day...")
- If the day is quiet, say so in one sentence and stop

## Agent activity (1-2 sentences)
- Lead with errors if any (e.g., "Morning briefing cron is failing on auth — re-auth needed.")
- Otherwise summarize volume + outcome ("9 voice memos processed clean; everything else nominal.")
- Do NOT list every job — that's what the <details> block is for

## "What's new" voice memo summaries (1 line each)
- Capture the single most actionable or salient point
- "Met Josh at McCarren Track, taught rope flow basics" not "Talked about meeting someone"

After writing the file:
1. cd ~/Projects/vault && git add journal/today/{{date}}.md && git commit -m "today: {{date}} {{HH:MM}}" --no-verify -q
2. git push origin main (best-effort; swallow errors — local commit is durable)

Reply with one line: today_page_written=ok briefing_words=<n> sections=<n>
```

## Data sources

Approved in brainstorming:

**Bucket 1 — Relevant to my day**
- (a) Today's daily note (kept; rendered into "What's new" if updated today)
- (b) Today's calendar events
- (c) Open reminders due today/overdue
- (d) TODO.md
- (h) Yesterday's briefing tail (collapsed)

**Bucket 2 — New content**
- (i) Voice memos transcribed today
- (j) Vault articles created today
- (k) Vault articles updated today
- (l) Inbox/ items created today

**Bucket 3 — Agent activity (summarized)**
- (o) Openclaw cron runs today
- (p) Vault commits by agents today (parsed from commit message prefixes:
  `voice-memo-actions:`, `librarian:`, `cortana:`, `today:`, etc.)
- (t) Errors / failures (cron `lastRunStatus: error` aggregated)

**Deferred to v2:** health metrics (e), weather (f), morning briefing email
content (g), Librarian-Queue items (m), Notion mirror (n — explicitly
dropped), Librarian/Giles email digests (q), Suggest-edit captures (r),
WikiLeighs deploys (s).

## Error handling

- **gather.sh fails entirely:** agent emails `leigh.llewelyn@gmail.com`
  with subject "Today page generation failed — gather.sh" and stderr.
  Previous file stays in place.
- **Individual sub-command in gather.sh fails:** logs stderr, returns
  empty array/null for that field. Agent prompts handle gracefully.
- **Agent timeout:** openclaw retries on next cron tick. Stale page
  surfaces via the "Last updated HH:MM" line.
- **Vault push fails:** local commit is durable; next successful push
  delivers the file. Stale wikileighs deploy.
- **WikiLeighs build fails:** existing GitHub Actions failure email; Leigh
  manually retriggers.
- **`/today` route loads with no file for today:** fallback page renders
  yesterday's briefing inline + "Page hasn't refreshed yet today" notice.
  This is the page-not-yet-generated edge case (e.g., 6:55 AM before the
  7 AM cron tick).

## Verification plan

Concrete steps for confirming the build works (per the
"every plan must include how we'll test what we built" rule):

1. **Dry-run gather.sh:** `bash ~/.openclaw/workspace/today/gather.sh`
   → inspect `/tmp/today-raw-2026-04-19.json`. Assert all fields populated
   with sane shapes (not just empty objects).
2. **Manual cron payload run:** copy the agent prompt, run via `bash`
   pipeline locally with the model's CLI. Assert
   `~/Projects/vault/journal/today/2026-04-19.md` exists, frontmatter is
   valid YAML, and all sections render.
3. **Astro dev server visual check:** `cd ~/Projects/wikileighs && pnpm dev`,
   open `http://localhost:4321/today` and `http://localhost:4321/today/2026-04-19`.
   Confirm both load with full content.
4. **Auto-rebuild hook:** make a trivial vault commit + push, watch
   wikileighs Actions in `gh run watch`. Confirm rebuild fires within
   30 seconds and deploys within 3–4 minutes.
5. **Cron live:** wait for the next hourly tick, confirm the file
   timestamp updates and content reflects the new hour. Verify with
   `git log -1 --pretty=format:"%h %s" -- journal/today/2026-04-19.md`.
6. **Edge case — empty day:** at start of day before any data,
   confirm the page renders cleanly with mostly empty sections
   (Briefing should say "quiet day so far" or similar).

## Out of scope (v2 candidates)

- Health/Hevy/Oura integration
- Weather widget
- Morning briefing email content embedded in page
- Librarian-Queue inline render
- Suggest-edit capture log
- WikiLeighs deploy log
- A "since I last looked" view (would require state tracking)
- Multi-device read tracking
- Push notifications when page updates

## Open items deferred to plan phase

- Exact path/filename convention if `journal-today-` slug collides
  with anything (likely fine — `journal/today/` is a new folder)
- Whether to also add a homepage link to `/today` in the LeftRail or
  TopBar component (small UX call, not architectural)
- PAT scope and rotation cadence for the vault → wikileighs
  `repository_dispatch` token (security review during plan)
