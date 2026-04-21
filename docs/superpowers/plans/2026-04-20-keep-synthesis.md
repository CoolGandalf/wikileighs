---
title: Keep Import — Synthesis & Enrichment Plan
status: draft
created: 2026-04-20
updated: 2026-04-20
owner: Librarian (Giles)
context:
  - 2026-04-19 Keep import ingested 1,925 notes
  - 54 family-correspondence files → archive/keep-family-correspondence-2026-04-19/
  - 8 aggregation files → notes/Ideas from Old Keep Notes/ (incl Quick Captures 12K lines)
  - 21 un-enriched essay stubs → notes/keep-YYYY-MM-DDTN.md
---

# Keep Import — Synthesis & Enrichment Plan

## Goal

Mine high-value small items from the 2026-04-19 Keep import and fold them into existing canonical pages. Elevate a small number to new canonical pages. Archive or quarantine the rest.

Surveyed by three parallel Librarian subagents on 2026-04-20:
- Family correspondence archive (54 files) → biographical facts, dated events, traditions
- 8 aggregation files in `notes/Ideas from Old Keep Notes/` → quotes, books, recipes, recurring themes
- 21 un-enriched `notes/keep-*.md` essay stubs → promote/merge/archive per-file verdict

### Correction to the 2026-04-20 audit

`notes/Gaps.md` flagged `Leigh Llewelyn.md`, `Taron Llewelyn.md`, and `Eleri Llewelyn.md` as missing inner-circle pages. In fact `notes/people/Taron.md`, `Eleri.md`, `Helen Lewis.md`, `Stuart Shively.md`, `Susan Burkhalter.md`, and `Curtis Shively.md` all exist. Only `Leigh Llewelyn.md` is genuinely missing. Gaps.md will be corrected on the next audit run.

## Headline finding

**The "Rachel's family birthdays" note Leigh remembered exists** — it's in `Quick Captures.md` under the 2019-03-19 timestamp, not in the family-correspondence archive. Content:

- Rachel's mother (Susan Burkhalter): **April 16**
- Stu (Stuart Shively, brother): **Valentine's Day (Feb 14)**
- Rachel's dad (Curtis Shively): **July 20**

Quick win: these three facts go into the three existing person pages.

---

## Phase 1 — Mechanical merges and archives (no inference risk)

Small, bounded, low-stakes moves. Roughly 30 minutes total.

### A. Carl's best-man-speech trio → merge into existing page

Three keep-*.md files are drafts/fragments for the same speech. Target: `notes/carl-best-man-speech-ideas.md` (already exists).

- `notes/keep-2024-10-10T2.md` (hurricane + Phil shot gag)
- `notes/keep-2024-10-17T0.md` (loyalty, kids, meaning themes)
- `notes/keep-2024-10-18T0.md` (Asheville post-hurricane opener)

Action: append a `## Draft fragments (Oct 2024)` section to the speech page, then delete the three keep-*.md files.

### B. Keats (poems-app) pair → merge into project page

- `notes/keep-2026-02-22T2.md` — OpenClaw's sourcing strategy (Gutenberg, Wikisource, PoetryDB, licensing)
- `notes/keep-2026-02-23T1.md` — UX spec ("Tinder for poems", swipe left/right)

Target: `notes/projects/Keats.md`. Append as "Content sourcing" + "UX brief" sections. Delete the two keep-*.md files.

### C. Health Dashboard pair → merge into project page

- `notes/keep-2025-10-06T1.md` — running-progression prompt for 40-yo weightlifter
- `notes/keep-2026-02-28T1.md` — personal-trainer-bot / Whoop+Apple Health+Hevy dashboard brief

Target: `notes/projects/Health Dashboard.md`. Append as "Founding brief" + "Training-agent prompt". Delete the two keep-*.md files.

### D. Meditations mini-pilgrimage prompt → merge

`notes/keep-2024-11-30T1 (Keep import).md` — assignment prompt for reflective read of Meditations.

Target: `notes/Meditations Reading Notes.md`. Append as a "Mini-Pilgrimage Prompt" section. Delete the keep-*.md file.

### E. Warhammer 40K Commissar speech → merge into Quotes

`notes/keep-2024-05-11T1.md` — Novobazky's rally speech (Dan Abnett, Gaunt's Ghosts).

Target: `notes/Quotes.md` under a new `## Fiction / Warhammer 40K` subheading. Drop the stray Alaska Airlines phone number. Delete the keep-*.md file.

### F. Sleep-hygiene protocol → merge

`notes/keep-2024-01-17T1.md` — shift-work sleep advice.

Target: append a `## Shift-work sleep hygiene` section to `notes/Nutrition Notes.md` (the catch-all health page; if Leigh prefers a dedicated `Sleep.md` page, create that instead). Delete the keep-*.md file.

### G. Rename WikiLeighs deploy log

`notes/keep-2026-04-17T1.md` — OpenClaw log of Cloudflare Access gating.

Target: append to `notes/projects/WikiLeighs.md` as a "Deployment + gating runbook" section. Delete the keep-*.md file.

### H. Archive-only files (move, do not synthesize)

Low-forward-value but keep for record:

- `notes/keep-2024-10-11T1.md` (landlord rent-increase pushback) → `archive/correspondence/2024-10-11-landlord-rent-increase.md`
- `notes/keep-2024-11-11T1.md` (debt-verification LLM template) → `archive/correspondence/2024-11-debt-verification-letter.md`
- `notes/keep-2024-11-20T2.md` (diaper-change instructions for Eleri — boilerplate, obsolete) → `archive/` or delete outright

### I. Promote-and-rename (give real titles)

These are Leigh's own writing or load-bearing reference material; they deserve real filenames and frontmatter:

- `notes/keep-2023-11-01T2 (Keep import).md` → `notes/Total War Warhammer - Vampire Counts Strategy.md` (medium strategy writeup)
- `notes/keep-2023-11-01T2.md` → `notes/Greenpoint Church Reflection 2018.md` (Leigh's sincere personal writing; drop the stray maritime line)
- `notes/keep-2023-12-27T1.md` → `notes/Annual Review Template.md` (add `type: template`)
- `notes/keep-2025-08-02T2.md` → `notes/Lenus Platform - Contract Analysis.md`
- `notes/keep-2026-02-17T2.md` → `notes/Python Dev Env - Package Inventory.md`
- `notes/keep-2026-02-26T2.md` → `notes/projects/Another Life.md` (distinct app idea with a clear thesis)

### J. Privacy flag — needs Leigh's decision

`notes/keep-2025-06-29T1.md` — intimate letter to Rachel after a conflict.

Per the 2026-04-20 permissive-privacy memory, work content lives in the main vault and Leigh excises later. This is not work content. But it's sensitive in a different way (marriage). Options:
- Rename and keep at vault root (`notes/Letter to Rachel (June 2025).md`)
- Move to `_local-macbookair/journal/` (device-local, not synced to WikiLeighs)
- Move to `Private/` (gitignored entirely)

**Librarian recommendation:** `_local-macbookair/journal/` — WikiLeighs is gated to Leigh's Gmail only, so public exposure isn't the concern, but this kind of content doesn't benefit from being in the searchable wiki graph either. Leigh to confirm.

---

## Phase 2 — Enrichment of existing canonical pages

Fold newly-mined facts into existing person, project, and concept pages. Each target already exists; additions are new sections or bullet entries.

### Person-page enrichments

**`notes/people/Susan Burkhalter.md`** (Rachel's mother, Alzheimer's)
- Birthday: April 16 (source: Quick Captures 2019-03-19)
- Diagnosed with Alzheimer's (disclosed in Helen Lewis message, 2025-11-09)

**`notes/people/Curtis Shively.md`** (FIL)
- Birthday: July 20 (source: Quick Captures 2019-03-19)
- End-of-life status: "I know Curtis is dying" (Helen Lewis's words, 2025-11-09; corroborates the Oct–Nov 2025 decline thread already in the vault)

**`notes/people/Stuart Shively.md`** (Rachel's brother)
- Birthday: February 14 (source: Quick Captures 2019-03-19)

**`notes/people/Rachel Shively.md`**
- Pet-name: **Bluebell** (add to `aliases:` frontmatter; used across anniversary/birthday cards 2017–2025)
- ER work at Mount Sinai (sick bank 170 hrs at Taron's delivery; NY PFL $746.41/wk; Aetna STD) — add as "Career" detail, not operational specifics
- Maternity-leave context: ~12 weeks total after Taron's birth

**`notes/people/Taron.md`**
- Full legal name: **Taron Jack Llewelyn**
- DOB: **2020-04-07, 4:56 PM**
- Birth weight/length: **7 lb 11.2 oz, 21 in**
- COVID-era delivery (Rachel COVID-positive at delivery 3am; moved to isolation; NJ hospital because NYC hospitals banned fathers in delivery rooms)
- 2025-09-14 arm injury (fell head-first off bench, right arm near elbow, pin required per 2025-09-15 follow-up)

**`notes/people/Eleri.md`**
- Full legal name: **Eleri Lise Llewelyn**
- DOB: ~July 2022 (triangulated from a 2022-07 Baby Checklist note + Apr 2025 "age 2.9" reference; confirm precise date from Leigh)

**`notes/people/Helen Lewis.md`** (Leigh's mother)
- Retired early-childhood-development / counseling professional
- Emigrated from Wales
- Partner "Peter" died in January (unspecified year)
- Survived three hurricanes alone in Florida prior to Dec 2024
- Was receiving $360/mo recurring transfer from Leigh (as of Nov 2018)
- Cross-link to `2025-04-18 → 2026-01-15 correspondence arc` (see Phase 4 privacy note)

**`notes/people/Carl MacMichael.md`**
- Wife: **Kate**
- Daughter: **Alexis**
- Asheville wedding: Oct 2024 (weekend of Oct 11–13; the hurricane context in the best-man-speech drafts refers to this)

**`notes/people/Josh Currence.md`** and **`notes/people/Soph Ingham.md`**
- Confirmed couple (attended both Tampa Jan 2025 gathering and Asheville Oct 2024 wedding)

**`notes/people/James Lewis.md`** (Leigh's brother, if exists; otherwise flag for Phase 3)
- Tampa Jan 2025 gathering attendee (with Derrick Hensley, Evan + Paula, etc.)

### Project-page enrichments

**`notes/projects/Health Dashboard.md`** — append "Founding brief" + "Running progression prompt" from Phase 1-C.

**`notes/projects/Keats.md`** — append "Content sourcing" + "UX brief" from Phase 1-B.

**`notes/projects/WikiLeighs.md`** — append "Deployment + gating runbook" from Phase 1-G.

**`notes/carl-best-man-speech-ideas.md`** — append "Draft fragments (Oct 2024)" from Phase 1-A.

### Canonical content-page enrichments

**`notes/Quotes.md`** — add ~14 entries surfaced by Agent 2:

Stoics cluster (verified attributions):
- Marcus Aurelius: "The tranquility that comes when you stop caring…" (Meditations)
- Marcus Aurelius: "I am arising to a man's work…" (Meditations)
- Epictetus: "Give yourself fully to your endeavors…"
- Seneca: "The whole future lies in uncertainty: live immediately."

Nietzsche cluster:
- "Excess of strength alone is the proof of strength."
- "If we have our own why of life, we shall get along with almost any how."
- "The will to a system is a lack of integrity."

Other attributed:
- Camus: "There is no fate that cannot be surmounted by scorn."
- Ella Baker (via Biden): "Give people light and they will find the way."
- Booker T. Washington (commonly): "Success is to be measured not so much by the position that one has reached in life…"

Leigh-authored fragments — keep in a separate "Leigh" subsection:
- "He who fights with creeps might take care lest he thereby become a creep." (riff on Nietzsche)
- "Life is other people, and other people make life worth living… friendship isn't about compatibility, common interests or shared politics. The only things that matter are loyalty and shared suffering." (Dublin toast, 2025-06-21)
- "Certare, Petere, Reperire, Neque Cedere." (Tennyson paraphrase adopted as motto)

Unattributed but worth keeping:
- "When death greets you — all you have is who you have become."
- "The root of all wisdom is knowing what an asshole you are."

**`notes/Cooking Techniques.md`** — add concrete canonical-recipe section referencing the Cooking Captures file. Dozen recipes worth lifting:

- Jamie Oliver one-pan chicken thighs (2019-11-01)
- Salsa verde (roasted tomatillo + cilantro-stems blender, 2019-12-13)
- Whole-chicken 4-hour soup stock (2020-11-10)
- Seared salmon with anchovy butter + capers (2021-03-10)
- Dry-brine chicken (1 tsp salt/lb, uncovered hour, 2019-03-14)
- Air-fryer zucchini spears (2020-04-08)
- Instant Pot mushroom-spinach risotto (2022-01-08)
- AeroPress inverted method (17g/200g/185°F, 2022-10-15)

**`notes/Nutrition Notes.md`** — append "Breathwork protocol (James Nestor)" section:
- Nasal breathing, tape, CO2 tolerance, incline bed, avoid supine sleep
- Source: Quick Captures 2023-04-11 (long podcast notes — high density)

**`notes/Reading List.md`** — add BBC 100 books list with Leigh's read-marks (high-value artifact from D&D Captures 2020-06-14).

**`notes/Investing & Finance.md`** — add:
- Ticker watchlist (ANET, CIEN, ALAB, INTC, TSM, QCOM) from 2026-04-08
- GLDM (gold ETF) pointer from 2020
- 2023-24 FIRE goals + 2025 goals doc (two distinct multi-paragraph goal-setting artifacts)

**`notes/training/Leigh's Training Database.md`** — append:
- 12/8/4 rep scheme (30RM/20RM/working weight, 2023-05-10)
- 2020-01-06 knee injury log (progression notes)

**`notes/training/Shoulder & Rotator Cuff.md`** — append:
- Snow angel on wall, T-spine foam-roll + shoulder stretch

**`notes/training/Hip Mobility.md`** — append:
- Lapsed bast lunge, kick-through, scorpion flow (2026-04-09)

---

## Phase 3 — New canonical pages worth creating

Eight new pages. Each is justified by concrete recurring material, not speculation.

### New person page

**`notes/people/Leigh Llewelyn.md`** — still missing (confirmed in audit). High-priority link target. Draft from voice memos and personal journals per canon rules. Also now has supporting material from the Keep import: Welsh heritage references, Greenpoint church reflection, career-arc notes.

### New pet / minor-entity pages (stubs, not person pages)

**`notes/pets/Simon.md`** or similar — the cat is referenced across multiple correspondence drafts ("Simon bringing us a dead bird"; "ask Simon to scratch dadda"). Minor but he comes up.

### New canonical concept/theme pages

**`notes/The Good Life.md`** — the 7-bullet framework recurs verbatim three times (2023-01-18, 2024-05-29, 2024 journals): Other people / Work / Feeling good / Doing good / Type-2 fun / Vigorous exercise / Good music / Victorian professional. This is Leigh's settled life-philosophy artifact. Crosslink to `Seven Fs.md`, `Renaissance Man.md`.

**`notes/Welsh Heritage.md`** — recurring thread (2018 Welsh-American Civil War essay, 2018 Welsh language study, 2020 Cardiff trip, 2021 Welsh cawl recipe, 2024 Gower/Pembrokeshire wikivoyage, "plant a garden with Welsh soil"). Worth consolidating.

**`notes/Child Mind.md`** or similar — "return to childhood / child-mind / play" recurs (2023-06-26 magical-ruler thought experiment, 2026-01-18 Instagram end-goals "cultivate a spirit of play," 2026-01-23 voice memo "child mind, chasing not skill but grace"). Possibly a subsection of an existing philosophy page; Leigh's call on standalone.

**`notes/dnd/Lyria-Morningstar.md`** — Dune-meets-Foundation worldbuilding dump from D&D Captures 2020-05-01, 300+ lines. Houses (Dragon/Crab/Phoenix/Scorpion/Lion/Crane/Wolf), the Veil FTL network, Daemonarchy, Amaranth treaty, Nakamata shipboard-AI protocols, Connor Kao + Red Sky Co. This is a full campaign setting; don't leave it in an aggregate file.

### New project / reference pages

**`notes/projects/Another Life.md`** — from Phase 1-I (`keep-2026-02-26T2.md`). App idea for a statistically-average-human-life simulator. Distinct thesis, not buried.

**`notes/Thanksgiving Menu.md`** — the Nov 2025 menu is a canonical recipe roster: mac & cheese (Gruyère + cheddar), sourdough stuffing (pork/turkey sausage, celery, apple, sage), Brussels sprouts, sweet-potato-marshmallow casserole, pumpkin pie (Carnation evaporated milk), Hershey-bar s'mores. Crosslink to `Cooking Techniques.md`. Leigh has made "every effort to make Thanksgiving happen every year"; this is tradition-grade material.

**`notes/Kitchen Pantry Staples.md`** and **`notes/Costco Order.md`** — two persistent lists extracted from Cooking Captures. Low philosophical weight but high practical value (Leigh will re-use these).

### New person page with clear evidence

**`notes/people/Cheyen.md`** — Leigh's personal trainer. Voice-memo-sourced bio (2025-05-24): Persian, family from Iran, dual citizen, from San Diego, Columbia grad, went into PT after own injury, 30s, girlfriend, now Manhattan. Recurring presence per Leigh's training arc. Minimum-signal criterion met: voice-memo + relationship is active.

---

## Phase 4 — Privacy cleanup and quarantine

Per the 2026-04-20 permissive-privacy memory, most content is fair game. But three clusters in the Keep import warrant Leigh's judgment:

### The Helen-Lewis rupture correspondence (~9 files, 2025-04-18 through 2026-01-15)

Intimate conflict letters between Leigh and his mother. Currently at `archive/keep-family-correspondence-2026-04-19/` (inside the main vault, but in `archive/` not `notes/`).

Options:
1. **Summarize** — write a single "Relationship with mother — 2025-2026 rupture" section on `Helen Lewis.md` referencing dates but not full text; leave raw files in archive.
2. **Leave as-is** — raw files stay in archive; Librarian does not mine further.
3. **Move to `Private/`** — archive still mirrors to WikiLeighs if not gitignored; Private is the only true wall.

**Librarian recommendation:** Option 1 (summarize on the person page, leave raw in archive). The content is emotionally heavy but not work-sensitive; the vault's value is the synthesis, not the raw text.

### Eyal & Ben's Miami apartment credentials

`archive/keep-family-correspondence-2026-04-19/2024-10-07T21_55_17.926-04_00.md` contains door code (5345), WiFi password, key-fob location for Gran Paraiso Unit 4207. These are **someone else's credentials**, not Leigh's.

**Action:** redact the credentials from the archive file (leave file, remove the specific codes/passwords). The building name + unit can stay as travel context.

### Rachel maternity insurance + medical-adjacent details

`archive/keep-family-correspondence-2026-04-19/Rachel_s maternity leave.md` has Aetna agent phone numbers, policy IDs, sick-bank hours, PFL amounts. Also a 2023 Ondansetron/Dexamethasone prescription note signed "Dr. Schively."

**Action:** move both files from `archive/` to `Private/keep-medical-private-2026-04-20/`. The dated facts (leave duration, return date) can be surfaced in Rachel's page in summary form per Phase 2; the operational specifics don't need to be retrievable.

### Rachel letter (June 2025)

See Phase 1-J above. Librarian recommendation: `_local-macbookair/journal/`.

---

## Phase 5 — Flagged for Leigh's judgment (not actioning)

Items I won't touch without explicit confirmation:

- **"James Lewis" person page** — Leigh's brother. Referenced across multiple Keep notes (Budget car rental, Tampa gatherings). No existing vault page. Uncertain whether Leigh wants a dedicated page (same Rhys lesson — don't infer without explicit OK).
- **Wedding date reconciliation** — one draft dated 2017-11-17 references a "5-year anniversary" implying Nov 2012 wedding. Rachel's page says Edson Keith Mansion 2018-03-10 + SDNY 2018-12-17 legal ceremony. Possibly Leigh counts from a different anchor point (dating? engagement?). Flag for Leigh to reconcile.
- **Bluebell alias** — adding nicknames to aliases frontmatter is standard; confirming because this one is intimate.
- **Cheyen page** — voice-memo evidence is strong but page would mention nationality + personal bio. Worth double-checking Leigh is OK with that level of detail for a trainer.
- **The Mass Effect + BG3 + Destiny 2 build notes** — Agent 2 flagged these as gaming-corner candidates. Low weight; Leigh decides whether gaming deserves canonical pages or stays in aggregate.

---

## Execution order (recommended)

If Leigh approves in full, a reasonable sequencing:

1. **Phase 1** (mechanical merges + archives + renames) — ~30 min. Bounded and reversible.
2. **Phase 2** (enrich existing pages) — ~60 min across ~15 person / project / concept pages. Each edit is small and surgical.
3. **Phase 4** (privacy cleanup) — ~15 min. Redactions + one `Private/` folder move.
4. **Phase 3** (new canonical pages) — ~90 min. Each new page gets proper frontmatter, ≥2 wikilinks, ≥2 See also.
5. **Defer Phase 5** to explicit Leigh decisions.

Total: roughly 3.5 hours of Librarian work. Can be broken into sessions. Each phase writes one git commit per operation.

## What this plan does NOT cover

- The 1,677 short captures in `Quick Captures.md` beyond the ~30 items surfaced by the survey. The long tail stays searchable in the aggregation file; Leigh can re-run targeted mining with `/librarian fill <topic>` later.
- The remaining ~50 essay-tier Keep pages Giles touched lightly in the 2026-04-19 synthesis pass. Those have real titles and frontmatter already.
- The 47 secrets in `Private/keep-secrets-2026-04-19.md` — still awaiting Leigh's 5-min triage (pending in hot.md).
- FB Phase 2 group pages — separate pipeline (hot.md pending).
- Year-split of Quick Captures (hot.md pending).

---

*Produced by Librarian audit on 2026-04-20 (Mac). Surveyed via three parallel subagents against `archive/keep-family-correspondence-2026-04-19/`, `notes/Ideas from Old Keep Notes/`, and `notes/keep-*.md`.*
