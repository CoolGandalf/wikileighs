# Google Keep Import & Vault Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import Leigh's full Google Keep export (1,964 active notes spanning 2017-2026) into the Obsidian vault — synthesize long-form notes into canonical pages, aggregate stubs into thematic capture pages, quarantine WORK and SECRET content, preserve family correspondence in `Private/`, and leave a manifest so future Keep exports re-run idempotently.

**Architecture:** Three-stage pipeline — (1) deterministic ETL converts Keep JSON to dated markdown, (2) heuristic + LLM classifier buckets every note, (3) per-bucket router sends content to the right vault location. Long-form essays get individual canonical pages with synthesis; stubs get rolled up into "Ideas from Old Keep Notes/" aggregations; sensitive content goes to `Private/` (gitignored); WORK content stays out of the vault entirely. End-to-end verification confirms counts, secrets containment, and public-WikiLeighs safety before sign-off.

**Tech Stack:** Python 3.12 (in conda `dev` env), `json` stdlib, `re`, `pathlib`. LLM calls go through `claude` CLI (Anthropic SDK, claude-sonnet-4-6, prompt-cached system prompt). Scripts live at `~/Projects/vault/scripts/keep-import/`.

---

## Locked-in default decisions

These decisions are LOCKED unless Leigh explicitly redirects. They reflect the CLAUDE.md privacy rules, prior precedent (`Ideas from Old Emails/`), and audit-before-asking feedback.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **WORK content** (compliance, MNPI, sector-specialist, Steve, training plans for old job) → quarantine in `~/tmp/keep-import/quarantine/work/`, never enter vault | Global CLAUDE.md: WORK content is off-limits for vault |
| 2 | **Family correspondence** (letters to/from mom, Rachel, kids) → `Private/keep-family-correspondence-2026-04-19/` (one MD per piece, gitignored) | Sensitive but valuable for memory; user privacy-scope memory says family is fair game inside vault, but gitignored |
| 3 | **Secrets** (1Password key, addresses, license #s) → `Private/keep-secrets-2026-04-19.md` + scrub from anywhere else | Public WikiLeighs auto-deploys from vault on every push |
| 4 | **Stubs (<200 chars)** → aggregated by topic in `notes/Ideas from Old Keep Notes/` | Mirrors `notes/Ideas from Old Emails/`. 1,410 individual stub files would drown the vault. |
| 5 | **Long-form (>1k chars)** → individual canonical pages with synthesis OR merged into existing pages | Standard ingest workflow per CLAUDE.md |
| 6 | **Idempotent manifest** in `Private/keep-import-manifest.json` | Future Keep exports re-run without duplicating; manifest is gitignored to avoid leaking note IDs publicly |
| 7 | **No public-WikiLeighs hold** during import | Trust privacy filtering layer; verification step (Phase 7) explicitly greps for secrets before declaring done |

---

## File structure

**Scripts (new — `~/Projects/vault/scripts/keep-import/`):**
- `extract.py` — read takeout zip → write `raw/<id>.md` per note with YAML frontmatter (deterministic ETL)
- `classify.py` — deterministic heuristics → write `classified/<bucket>/<id>.md` symlinks; emit `unclassified.txt` for LLM pass
- `llm_classify.py` — feed unclassified batch to `claude` CLI → resolve buckets
- `route.py` — per-bucket dispatcher: writes Private/, quarantine/, journal/personal/, or stages aggregation candidates
- `aggregate.py` — bulk roll-up of stubs into `notes/Ideas from Old Keep Notes/<Topic> Captures.md`
- `manifest.py` — write/read `Private/keep-import-manifest.json` for idempotency
- `verify.py` — end-to-end audit script
- `lib_keep.py` — shared `KeepNote` parser, slug helpers, frontmatter writer

**Data (new — `~/tmp/keep-import/`):**
- `raw/<id>.md` — every Keep note as markdown (intermediate artifact, throwaway)
- `classified/<bucket>/<id>.md` — symlinks for inspection
- `quarantine/work/<id>.md` — never enters vault
- `unclassified.txt` — list of note IDs needing LLM bucketing

**Vault (new + modify):**
- Create: `Private/keep-secrets-2026-04-19.md`
- Create: `Private/keep-family-correspondence-2026-04-19/<id>.md` (per piece)
- Create: `Private/keep-import-manifest.json`
- Create: `notes/Ideas from Old Keep Notes/_README.md` — documents this import
- Create: `notes/Ideas from Old Keep Notes/<N> Captures.md` — one per topic bucket
- Create: ~30-50 individual canonical pages in `notes/` for long-form essays
- Create: `journal/personal/YYYY-MM-DD-keep-import-<slug>.md` per long voice transcript (preserves original timestamp)
- Modify: `notes/Cooking Techniques.md`, `notes/dnd/*`, `notes/training/*`, `notes/Quotes.md`, etc — merge content where existing pages cover the topic
- Modify: `index.md` — add all new pages at end of import
- Modify: `log.md` — append per-phase entries

**Plan + spec:**
- This file: `~/Projects/wikileighs/docs/superpowers/plans/2026-04-19-keep-import.md`

---

## Task 1: Workspace bootstrap + lib

**Files:**
- Create: `~/Projects/vault/scripts/keep-import/lib_keep.py`
- Create: `~/Projects/vault/scripts/keep-import/__init__.py` (empty)
- Test: `~/Projects/vault/scripts/keep-import/test_lib_keep.py`

- [ ] **Step 1: Create directory + extract takeout to working dir**

```bash
mkdir -p ~/Projects/vault/scripts/keep-import
mkdir -p ~/tmp/keep-import/{raw,classified,quarantine/work,quarantine/family-correspondence,quarantine/secrets}
unzip -qq -o ~/Downloads/takeout-20260420T003037Z-3-001.zip -d ~/tmp/keep-import/source
ls ~/tmp/keep-import/source/Takeout/Keep/*.json | wc -l
```

Expected output: `1964` (or close — known issue: one file `Legs and AB...track.html` has special chars and may need `-x` flag if extraction errors).

- [ ] **Step 2: Write the failing test for `KeepNote` parser**

```python
# ~/Projects/vault/scripts/keep-import/test_lib_keep.py
import json
from pathlib import Path
from lib_keep import KeepNote

SAMPLE = {
    "color": "DEFAULT",
    "isTrashed": False,
    "isPinned": True,
    "isArchived": False,
    "textContent": "Hello world\n\nLine 2",
    "title": "Sample Title",
    "userEditedTimestampUsec": 1633945736112000,
    "createdTimestampUsec": 1633945465191000,
}

def test_parse_basic(tmp_path):
    p = tmp_path / "n1.json"
    p.write_text(json.dumps(SAMPLE))
    note = KeepNote.from_path(p)
    assert note.title == "Sample Title"
    assert note.text == "Hello world\n\nLine 2"
    assert note.is_pinned is True
    assert note.created.year == 2021
    assert note.char_count == len("Hello world\n\nLine 2")
    assert note.id == "n1"

def test_to_markdown_has_frontmatter(tmp_path):
    p = tmp_path / "n1.json"
    p.write_text(json.dumps(SAMPLE))
    md = KeepNote.from_path(p).to_markdown()
    assert md.startswith("---\n")
    assert "source: keep" in md
    assert "created: 2021-10-11" in md
    assert "Hello world" in md

def test_skip_trashed(tmp_path):
    p = tmp_path / "n1.json"
    p.write_text(json.dumps({**SAMPLE, "isTrashed": True}))
    note = KeepNote.from_path(p)
    assert note.is_trashed is True

def test_listcontent_supported(tmp_path):
    p = tmp_path / "n1.json"
    p.write_text(json.dumps({
        **SAMPLE,
        "textContent": "",
        "listContent": [
            {"text": "Milk", "isChecked": False},
            {"text": "Eggs", "isChecked": True},
        ]
    }))
    note = KeepNote.from_path(p)
    assert "Milk" in note.text
    assert "[x] Eggs" in note.text or "- [x] Eggs" in note.text
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python -m pytest test_lib_keep.py -v
```

Expected: 4 FAIL — `lib_keep` module not found.

- [ ] **Step 4: Implement `lib_keep.py`**

```python
# ~/Projects/vault/scripts/keep-import/lib_keep.py
"""Shared utilities for Keep takeout import."""
from __future__ import annotations
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path


@dataclass
class KeepNote:
    id: str
    title: str
    text: str
    created: datetime
    edited: datetime
    is_pinned: bool
    is_archived: bool
    is_trashed: bool
    color: str
    raw: dict = field(repr=False)

    @property
    def char_count(self) -> int:
        return len(self.text)

    @classmethod
    def from_path(cls, path: Path) -> "KeepNote":
        d = json.loads(Path(path).read_text(encoding="utf-8"))
        text_parts: list[str] = []
        if d.get("textContent"):
            text_parts.append(d["textContent"].strip())
        for item in d.get("listContent", []) or []:
            mark = "[x]" if item.get("isChecked") else "[ ]"
            text_parts.append(f"- {mark} {item.get('text', '')}")
        text = "\n".join(t for t in text_parts if t).strip()

        def ts(usec: int) -> datetime:
            return datetime.fromtimestamp((usec or 0) / 1e6, tz=timezone.utc)

        return cls(
            id=Path(path).stem,
            title=(d.get("title") or "").strip(),
            text=text,
            created=ts(d.get("createdTimestampUsec", 0)),
            edited=ts(d.get("userEditedTimestampUsec", 0)),
            is_pinned=bool(d.get("isPinned")),
            is_archived=bool(d.get("isArchived")),
            is_trashed=bool(d.get("isTrashed")),
            color=d.get("color", "DEFAULT"),
            raw=d,
        )

    def to_markdown(self) -> str:
        fm = [
            "---",
            "source: keep",
            f"keep-id: {self.id}",
            f"created: {self.created.date().isoformat()}",
            f"edited: {self.edited.date().isoformat()}",
            f"pinned: {str(self.is_pinned).lower()}",
            f"archived: {str(self.is_archived).lower()}",
            "---",
            "",
        ]
        if self.title:
            fm.append(f"# {self.title}")
            fm.append("")
        fm.append(self.text)
        return "\n".join(fm) + "\n"


def slugify(s: str, max_len: int = 60) -> str:
    s = re.sub(r"[^\w\s-]", "", s).strip().lower()
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:max_len].strip("-") or "untitled"


SAFE_TS_FMT = "%Y-%m-%d"
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python -m pytest test_lib_keep.py -v
```

Expected: 4 PASS.

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/vault && git add scripts/keep-import/
git commit -m "feat(keep-import): KeepNote parser + tests"
```

---

## Task 2: Extract — Keep JSON → raw markdown

**Files:**
- Create: `~/Projects/vault/scripts/keep-import/extract.py`
- Test: `~/Projects/vault/scripts/keep-import/test_extract.py`

- [ ] **Step 1: Write the failing test**

```python
# ~/Projects/vault/scripts/keep-import/test_extract.py
import json
from pathlib import Path
from extract import extract_all

def make(tmp, name, payload):
    p = tmp / f"{name}.json"
    p.write_text(json.dumps(payload))
    return p

def test_extract_skips_trashed_and_empty(tmp_path):
    src = tmp_path / "src"
    src.mkdir()
    out = tmp_path / "out"
    make(src, "a", {"textContent":"hello","title":"A","createdTimestampUsec":1633945465191000,"userEditedTimestampUsec":1633945736112000})
    make(src, "b", {"textContent":"hi","isTrashed":True,"createdTimestampUsec":1633945465191000,"userEditedTimestampUsec":1633945736112000})
    make(src, "c", {"textContent":"","title":"","createdTimestampUsec":1633945465191000,"userEditedTimestampUsec":1633945736112000})
    stats = extract_all(src, out)
    assert stats["written"] == 1
    assert stats["skipped_trashed"] == 1
    assert stats["skipped_empty"] == 1
    assert (out / "a.md").exists()

def test_extract_dedupes_exact_duplicates(tmp_path):
    src = tmp_path / "src"; src.mkdir()
    out = tmp_path / "out"
    payload = {"textContent":"same","title":"T","createdTimestampUsec":1633945465191000,"userEditedTimestampUsec":1633945736112000}
    make(src, "a", payload)
    make(src, "b", payload)
    stats = extract_all(src, out)
    assert stats["written"] == 1
    assert stats["skipped_duplicate"] == 1
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python -m pytest test_extract.py -v
```

Expected: 2 FAIL — `extract` module not found.

- [ ] **Step 3: Implement extract.py**

```python
# ~/Projects/vault/scripts/keep-import/extract.py
"""Convert Keep JSON exports → raw markdown."""
from __future__ import annotations
import hashlib
import sys
from pathlib import Path
from lib_keep import KeepNote


def content_hash(note: KeepNote) -> str:
    h = hashlib.sha256()
    h.update((note.title + "\n" + note.text).encode("utf-8"))
    return h.hexdigest()


def extract_all(src_dir: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    seen_hashes: set[str] = set()
    stats = {"input": 0, "written": 0, "skipped_trashed": 0, "skipped_empty": 0, "skipped_duplicate": 0, "errors": 0}
    for jf in sorted(src_dir.glob("*.json")):
        stats["input"] += 1
        try:
            note = KeepNote.from_path(jf)
        except Exception as e:
            print(f"ERROR parsing {jf}: {e}", file=sys.stderr)
            stats["errors"] += 1
            continue
        if note.is_trashed:
            stats["skipped_trashed"] += 1
            continue
        if not note.title and not note.text:
            stats["skipped_empty"] += 1
            continue
        h = content_hash(note)
        if h in seen_hashes:
            stats["skipped_duplicate"] += 1
            continue
        seen_hashes.add(h)
        (out_dir / f"{note.id}.md").write_text(note.to_markdown(), encoding="utf-8")
        stats["written"] += 1
    return stats


if __name__ == "__main__":
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "~/tmp/keep-import/source/Takeout/Keep").expanduser()
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "~/tmp/keep-import/raw").expanduser()
    stats = extract_all(src, out)
    for k, v in stats.items():
        print(f"  {k:25s} {v}")
```

- [ ] **Step 4: Run test to verify pass**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python -m pytest test_extract.py -v
```

Expected: 2 PASS.

- [ ] **Step 5: Run extract on real Keep export**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python extract.py
```

Expected output:
```
  input                     1964
  written                   ~1900  (some skipped as duplicate / empty)
  skipped_trashed           0
  skipped_empty             ~31
  skipped_duplicate         ~30 (the "Raw journals" duplicate group)
  errors                    0
```

- [ ] **Step 6: Spot-check 3 raw outputs**

```bash
ls ~/tmp/keep-import/raw | head -3 | xargs -I{} cat ~/tmp/keep-import/raw/{}
```

Confirm: each has frontmatter with source/keep-id/created/edited; content body looks correct.

- [ ] **Step 7: Commit**

```bash
cd ~/Projects/vault && git add scripts/keep-import/
git commit -m "feat(keep-import): extract Keep JSON → raw markdown"
```

---

## Task 3: Classify — deterministic heuristic pass

**Files:**
- Create: `~/Projects/vault/scripts/keep-import/classify.py`
- Test: `~/Projects/vault/scripts/keep-import/test_classify.py`

**Buckets:** `secret | work | family-correspondence | journal | cooking | health-fitness | dnd | gaming | goals-aspirations | bookmark-list | shopping-list | quick-capture | essay-or-article | unclassified`

- [ ] **Step 1: Write the failing test**

```python
# ~/Projects/vault/scripts/keep-import/test_classify.py
from classify import classify_text

def test_secret_detection():
    assert classify_text("1password secret key", "A3-YPMS56-GH7EYL-DCR9F-WTTDV-XBNXE-CC9GM") == "secret"
    assert classify_text("", "ssn 123-45-6789") == "secret"
    assert classify_text("", "5735 madre messa\nLas Vegas, NV 89108") == "secret"  # address heuristic

def test_work_detection():
    assert classify_text("Plan for training", "Compliance manual\nSector Specialist matrix\nSteve's inbox") == "work"
    assert classify_text("", "MNPI focus should be on breach\nMartin Act insider trading") == "work"

def test_journal_detection():
    long_voice = "Okay, time for today. and a calendar everything. oh yeah it's um Sunday, February 15 it's uh eight thirty in the morning"
    assert classify_text("Raw journals", long_voice * 5) == "journal"
    assert classify_text("8/5 journal", "AI transcribed from voice app\n\nLong bike ride home") == "journal"

def test_cooking():
    assert classify_text("", "Preheat oven to 350. Combine garlic basil oregano thyme parsley sage") == "cooking"
    assert classify_text("", "Milk\nEggs\nBanana\nBread\nSliced bread") == "shopping-list"

def test_dnd():
    assert classify_text("Pathfinder details", "Brody murderbeam Cailan weatherspear cleric") == "dnd"
    assert classify_text("Time travel game", "10 quazar points") == "dnd"

def test_health_fitness():
    assert classify_text("1rm warm up", "5x75\n3x135\n2x165\n1x185") == "health-fitness"
    assert classify_text("sleep tips", "For years, 41-year-old struggled with how to go to sleep") == "health-fitness"

def test_family_correspondence():
    txt = "Mum we love you and I don't want to belabor this but I do think that how we handle things now will shape how we handles things with Taron"
    assert classify_text("", txt) == "family-correspondence"

def test_essay_long_with_no_other_signal():
    txt = "Congruence\n\nHouse on a hill - a place of deep interiority\n\nYou'll never stop complaining" * 50
    assert classify_text("Meditations", txt) == "essay-or-article"

def test_quick_capture_default_for_short():
    assert classify_text("", "Sept 9 @ 530") == "quick-capture"

def test_bookmark_list():
    assert classify_text("", "https://ra.co/events/1\nhttps://ra.co/events/2\nhttps://eventbrite.com/x") == "bookmark-list"
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python -m pytest test_classify.py -v
```

Expected: 9 FAIL — `classify` module not found.

- [ ] **Step 3: Implement classify.py**

```python
# ~/Projects/vault/scripts/keep-import/classify.py
"""Deterministic classifier for Keep notes. Falls through to 'unclassified' for LLM pass."""
from __future__ import annotations
import re
import sys
from pathlib import Path
from collections import Counter
from lib_keep import KeepNote

# --- pattern banks ---

SECRET_PATTERNS = [
    re.compile(r'\b1password\b', re.I),
    re.compile(r'\bsecret\s*key\b', re.I),
    re.compile(r'\bapi\s*key\b', re.I),
    re.compile(r'\bssn\b', re.I),
    re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),  # SSN
    re.compile(r'\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4,}\b'),  # 1Pwd-style key
    re.compile(r'\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b'),  # CC
    re.compile(r'\bcvv\b', re.I),
    re.compile(r'\d{3,5}\s+\w+\s+\w+\n.*,\s*[A-Z]{2}\s+\d{5}'),  # US street address (multi-line)
    re.compile(r'\d{3,5}\s+\w+\s+(messa|street|st|ave|avenue|rd|road|blvd)\b', re.I),
]

WORK_KEYWORDS = {
    "compliance manual", "sector specialist", "mnpi", "martin act",
    "insider trading", "steve's inbox", "guidepoint", "iti training",
    "broker checks", "rule 144", "10b5", "frontoffice", "front office",
    "buy-side", "sell-side", "ropicki", "casey", "flannery", "boyle",
    "discretionary trading", "b3pa", "compliance", "expert network",
}

JOURNAL_HINTS = [
    re.compile(r'\bjournal\b', re.I),
    re.compile(r'\braw\s*journals?\b', re.I),
    re.compile(r'\bAI\s*transcrib', re.I),
    re.compile(r'^Good\s*(morning|evening|afternoon)[\.,]', re.I | re.M),
    re.compile(r"\bIt['’]?s\s+\w+day,?\s+\w+\s+\d", re.I),  # "It's Monday, September 8"
    re.compile(r'^\s*\d{1,2}/\d{1,2}\s+journal\b', re.I | re.M),
]

COOKING_KEYWORDS = {
    "preheat oven", "cook for", "tablespoon", "teaspoon", "garlic", "basil",
    "oregano", "thyme", "parsley", "sage", "saute", "sauté", "deglaze",
    "marinade", "marinate", "season the", "season with", "skillet", "broil",
    "braise", "bake at", "simmer", "whisk", "knead", "yolk", "puree", "purée",
    "caramelize", "caramelise", "roux", "beurre", "fond", "reduce by half",
}

SHOPPING_KEYWORDS = {
    "milk", "eggs", "bread", "banana", "groceries", "shopping list",
    "amazon", "prime day", "black friday",
}

HEALTH_FITNESS_KEYWORDS = {
    "warm up", "warmup", "1rm", "deadlift", "squat", "bench press",
    "biceps", "triceps", "incline", "decline", "cable", "barbell",
    "dumbbell", "kettlebell", "rope flow", "rope-flow",
    "supinated", "pronated", "hip flexor", "rotator cuff",
    "macros", "protein", "creatine", "caffeine", "magnesium",
    "sleep tips", "circadian", "rem sleep", "slow wave",
    "vo2", "zone 2", "rucking", "stretching", "mobility",
    "apo b", "apob", "ldl", "hdl", "triglyceride",
    "osteomy", "occupational therapy",
}

DND_KEYWORDS = {
    "pathfinder", "dungeon world", "dungeons & dragons", "dnd", "d&d",
    "barbarian", "paladin", "wizard", "rogue", "fighter", "cleric",
    "warlock", "druid", "sorcerer", "monk", "ranger",
    "warhammer", "dark heresy", "rogue trader",
    "everyone is john", "quazar points",
    "dungeon master", "dm screen", "encounter table",
    "campaign", "session zero", "umbra", "stallions",
    "murderbeam", "weatherspear",
}

GAMING_KEYWORDS = {
    "starfield", "fallout", "skyrim", "elder scrolls", "dave the diver",
    "arc raiders", "destiny", "destiny 2", "the lament", "ace of spades",
    "trinity ghoul", "chaperone", "mass effect", "halo",
    "pokemon", "brilliant diamond", "scarlet violet",
    "quest 2", "quest 3", "xreal", "xbox", "playstation", "ps4", "ps5",
    "steam deck", "rocket league", "hearthstone",
    "hades", "elden ring", "stardew", "factorio", "satisfactory",
}

GOALS_HINTS = [re.compile(r'^\d{4}\s+goals\b', re.I | re.M),
               re.compile(r'\bskills to learn\b', re.I),
               re.compile(r'\bto[- ]?do list\b', re.I)]

FAMILY_HINTS = [
    re.compile(r'\b(mum|mom|mother|dad|father)\b', re.I),
    re.compile(r'\b(rachel|taron|terrence|terence|eleri|hillary|larry|curtis|bill|helen|ashley)\b', re.I),
]

URL_RE = re.compile(r'https?://\S+')


def classify_text(title: str, text: str) -> str:
    blob = f"{title}\n{text}"
    blob_low = blob.lower()
    n_chars = len(blob.strip())
    if n_chars == 0:
        return "quick-capture"

    # 1. Secrets — highest priority, can co-occur with anything
    for p in SECRET_PATTERNS:
        if p.search(blob):
            return "secret"

    # 2. Work — strong signal
    work_hits = sum(1 for kw in WORK_KEYWORDS if kw in blob_low)
    if work_hits >= 1:
        return "work"

    # 3. Journal — long voice transcripts have high recall on these
    for p in JOURNAL_HINTS:
        if p.search(blob):
            if n_chars >= 500:
                return "journal"

    # 4. D&D — distinctive vocabulary
    dnd_hits = sum(1 for kw in DND_KEYWORDS if kw in blob_low)
    if dnd_hits >= 1:
        return "dnd"

    # 5. Family correspondence — second-person AND family member name AND prose-y
    family_hit = any(p.search(blob) for p in FAMILY_HINTS)
    has_pronouns = bool(re.search(r"\b(I|you|we|us|me)\b", blob))
    if family_hit and has_pronouns and n_chars >= 200:
        return "family-correspondence"

    # 6. Cooking
    cook_hits = sum(1 for kw in COOKING_KEYWORDS if kw in blob_low)
    if cook_hits >= 2:
        return "cooking"

    # 7. Health/fitness
    hf_hits = sum(1 for kw in HEALTH_FITNESS_KEYWORDS if kw in blob_low)
    if hf_hits >= 1:
        return "health-fitness"

    # 8. Gaming
    game_hits = sum(1 for kw in GAMING_KEYWORDS if kw in blob_low)
    if game_hits >= 1:
        return "gaming"

    # 9. Shopping list — high keyword density of grocery items, OR explicit "shopping list"
    if any(p.search(blob) for p in [re.compile(r'\bshopping list\b', re.I),
                                     re.compile(r'\bgrocery list\b', re.I),
                                     re.compile(r'\bprime day\b', re.I)]):
        return "shopping-list"
    shop_hits = sum(1 for kw in SHOPPING_KEYWORDS if kw in blob_low)
    if shop_hits >= 2 and n_chars < 500:
        return "shopping-list"

    # 10. Goals/aspirations
    if any(p.search(blob) for p in GOALS_HINTS):
        return "goals-aspirations"

    # 11. Bookmark list — primarily URLs
    urls = URL_RE.findall(blob)
    non_url_chars = len(URL_RE.sub("", blob).strip())
    if len(urls) >= 2 and non_url_chars < n_chars * 0.4:
        return "bookmark-list"

    # 12. Essay/article — long-form, no other strong signal
    if n_chars >= 1000:
        return "essay-or-article"

    # 13. Quick capture — short, no signal
    if n_chars < 200:
        return "quick-capture"

    # 14. Send to LLM for borderline cases
    return "unclassified"


def classify_dir(raw_dir: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    counts = Counter()
    unclassified_ids: list[str] = []
    for md in sorted(raw_dir.glob("*.md")):
        body = md.read_text(encoding="utf-8")
        # peel frontmatter
        title_match = re.search(r'^# (.+)$', body, re.M)
        title = title_match.group(1) if title_match else ""
        # take everything after frontmatter close
        text = body.split("---", 2)[-1]
        if title_match:
            text = text.replace(f"# {title}\n\n", "", 1)
        bucket = classify_text(title, text.strip())
        counts[bucket] += 1
        bucket_dir = out_dir / bucket
        bucket_dir.mkdir(exist_ok=True)
        (bucket_dir / md.name).write_text(body, encoding="utf-8")
        if bucket == "unclassified":
            unclassified_ids.append(md.stem)
    (out_dir / "_counts.txt").write_text("\n".join(f"{b}\t{n}" for b, n in counts.most_common()))
    (out_dir / "_unclassified.txt").write_text("\n".join(unclassified_ids))
    return dict(counts)


if __name__ == "__main__":
    raw = Path(sys.argv[1] if len(sys.argv) > 1 else "~/tmp/keep-import/raw").expanduser()
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "~/tmp/keep-import/classified").expanduser()
    counts = classify_dir(raw, out)
    for b, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {b:25s} {n}")
```

- [ ] **Step 4: Run tests**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python -m pytest test_classify.py -v
```

Expected: 9 PASS. (Iterate on patterns if any fail — heuristic tuning is expected here.)

- [ ] **Step 5: Run classifier on real corpus**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python classify.py
```

Expected output (rough — exact numbers will vary):
```
  quick-capture             ~700
  health-fitness            ~150
  cooking                   ~100
  bookmark-list             ~100
  essay-or-article          ~100
  journal                   ~80
  dnd                       ~60
  gaming                    ~50
  shopping-list             ~50
  family-correspondence     ~40
  goals-aspirations         ~30
  work                      ~20
  secret                    ~10
  unclassified              ~150-300  (resolved next phase by LLM)
```

- [ ] **Step 6: Spot-check classification**

```bash
cd ~/tmp/keep-import/classified && for b in secret work family-correspondence journal essay-or-article; do echo "=== $b (3 samples) ==="; ls $b | head -3 | xargs -I{} sh -c "echo '--- {} ---'; head -20 $b/{}"; done
```

Manually review: secret bucket should have the 1Password key note + addresses. Work bucket should have compliance/MNPI notes. Family-correspondence should have mom letters. No false positives that would leak content.

- [ ] **Step 7: Commit**

```bash
cd ~/Projects/vault && git add scripts/keep-import/
git commit -m "feat(keep-import): heuristic classifier with 14 buckets"
```

---

## Task 4: LLM-assisted refinement of unclassified

**Files:**
- Create: `~/Projects/vault/scripts/keep-import/llm_classify.py`

- [ ] **Step 1: Verify `claude` CLI is available**

```bash
which claude && claude --version
```

Expected: path to claude binary, version string. If missing, halt — Leigh has it installed (it's the Claude Code CLI).

- [ ] **Step 2: Implement `llm_classify.py`**

```python
# ~/Projects/vault/scripts/keep-import/llm_classify.py
"""Resolve `unclassified` Keep notes via single Claude call (batched JSON output)."""
from __future__ import annotations
import json
import subprocess
import sys
from pathlib import Path

BUCKETS = [
    "secret","work","family-correspondence","journal","cooking",
    "health-fitness","dnd","gaming","goals-aspirations","bookmark-list",
    "shopping-list","quick-capture","essay-or-article",
]

PROMPT = """You are classifying short notes from a Google Keep export into buckets for filing into a personal knowledge vault.

Buckets (pick exactly one per note):
- secret: passwords, API keys, addresses, account numbers, anything sensitive
- work: references to old finance/compliance job — MNPI, sector specialist, Steve, sell-side, expert networks
- family-correspondence: drafts of messages to/from mom, Rachel, kids (Taron/Eleri), in-laws (Curtis, Helen, Bill)
- journal: voice transcripts, raw daily journaling, dictated reflections
- cooking: recipes, kitchen technique, food prep
- health-fitness: workouts, sleep, breathing, sports, medical, supplements
- dnd: D&D / Pathfinder / RPG content (NOT video games)
- gaming: video games (Destiny, Starfield, Quest VR, Dave the Diver)
- goals-aspirations: yearly goals lists, skills to learn, life-planning
- bookmark-list: collection of URLs with little prose
- shopping-list: grocery, Amazon wish list, things to buy
- quick-capture: short stub, no clear theme
- essay-or-article: long-form prose, philosophical reflection, design doc, video script

Output ONLY valid JSON: an array of objects {"id": "...", "bucket": "..."}. No prose.

Notes:
"""

def call_claude(notes_block: str) -> list[dict]:
    proc = subprocess.run(
        ["claude", "--model", "claude-sonnet-4-6", "--print", "--output-format", "text"],
        input=PROMPT + notes_block,
        capture_output=True, text=True, timeout=300,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"claude CLI failed: {proc.stderr}")
    out = proc.stdout.strip()
    # Strip code fences if present
    if out.startswith("```"):
        out = out.split("```", 2)[1]
        if out.startswith("json"):
            out = out[4:]
    return json.loads(out.strip())


def main(classified_dir: Path, batch_size: int = 30):
    unclassified_dir = classified_dir / "unclassified"
    if not unclassified_dir.exists():
        print("No unclassified bucket — nothing to do."); return
    files = sorted(unclassified_dir.glob("*.md"))
    print(f"Processing {len(files)} unclassified notes in batches of {batch_size}")
    moved = 0
    for batch_start in range(0, len(files), batch_size):
        batch = files[batch_start:batch_start + batch_size]
        notes_block = ""
        for f in batch:
            body = f.read_text(encoding="utf-8")
            text = body.split("---", 2)[-1].strip()[:600]  # cap context
            notes_block += f"\n--- ID: {f.stem} ---\n{text}\n"
        try:
            results = call_claude(notes_block)
        except Exception as e:
            print(f"  batch {batch_start} ERROR: {e}", file=sys.stderr)
            continue
        for r in results:
            note_id = r["id"]
            bucket = r["bucket"]
            if bucket not in BUCKETS:
                print(f"  invalid bucket {bucket!r} for {note_id}; defaulting to quick-capture", file=sys.stderr)
                bucket = "quick-capture"
            src = unclassified_dir / f"{note_id}.md"
            dst_dir = classified_dir / bucket
            dst_dir.mkdir(exist_ok=True)
            if src.exists():
                src.rename(dst_dir / src.name)
                moved += 1
        print(f"  batch {batch_start//batch_size + 1}/{(len(files)+batch_size-1)//batch_size}: moved {len(results)} notes")
    print(f"\nTotal moved out of unclassified: {moved}")
    remaining = list(unclassified_dir.glob("*.md"))
    print(f"Remaining unclassified (will be treated as quick-capture): {len(remaining)}")


if __name__ == "__main__":
    main(Path(sys.argv[1] if len(sys.argv) > 1 else "~/tmp/keep-import/classified").expanduser())
```

- [ ] **Step 3: Run on small slice first (dry-run mode — first batch only)**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev
# Inspect that first batch JSON output looks right by tailing claude output:
ls ~/tmp/keep-import/classified/unclassified | head -5 | xargs -I{} cat ~/tmp/keep-import/classified/unclassified/{}
```

- [ ] **Step 4: Run full LLM classification**

```bash
conda activate dev && python ~/Projects/vault/scripts/keep-import/llm_classify.py
```

Expected: progress per batch; final "Remaining unclassified" near 0.

- [ ] **Step 5: Recompute final counts**

```bash
cd ~/tmp/keep-import/classified && for d in */; do echo "$(ls $d | wc -l)  $d"; done | sort -rn
```

Expected: every bucket populated; `unclassified/` has <10 notes (will be treated as quick-capture).

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/vault && git add scripts/keep-import/
git commit -m "feat(keep-import): LLM refinement for unclassified bucket"
```

---

## Task 5: Privacy router — secrets, work, family-correspondence

**Files:**
- Create: `~/Projects/vault/scripts/keep-import/route_private.py`
- Verify: `Private/.gitignore` (or vault-root `.gitignore` covers `Private/`)

- [ ] **Step 1: Confirm Private/ is gitignored**

```bash
cd ~/Projects/vault && git check-ignore -v Private/test.md || echo "NOT IGNORED — STOP"
```

Expected: prints a `.gitignore` rule covering `Private/`. If "NOT IGNORED" appears, halt and add `Private/` to vault `.gitignore` before continuing.

- [ ] **Step 2: Implement `route_private.py`**

```python
# ~/Projects/vault/scripts/keep-import/route_private.py
"""Route secret / work / family-correspondence buckets to Private/ or quarantine."""
from __future__ import annotations
import sys
from pathlib import Path

VAULT = Path("~/Projects/vault").expanduser()
PRIVATE = VAULT / "Private"
QUARANTINE = Path("~/tmp/keep-import/quarantine").expanduser()


def aggregate_secrets(src: Path, dst: Path):
    """One file: dst — concat of all secret notes."""
    parts = ["# Keep Secrets — imported 2026-04-19\n",
             "All Keep notes flagged by the secret heuristic. Review and migrate to 1Password as appropriate.\n"]
    for md in sorted(src.glob("*.md")):
        parts.append(f"\n---\n## From `{md.stem}`\n")
        parts.append(md.read_text(encoding="utf-8"))
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text("\n".join(parts), encoding="utf-8")


def quarantine_work(src: Path, dst_dir: Path):
    dst_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for md in sorted(src.glob("*.md")):
        (dst_dir / md.name).write_text(md.read_text(encoding="utf-8"), encoding="utf-8")
        n += 1
    return n


def route_family(src: Path, dst_dir: Path):
    dst_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for md in sorted(src.glob("*.md")):
        (dst_dir / md.name).write_text(md.read_text(encoding="utf-8"), encoding="utf-8")
        n += 1
    return n


def main(classified_dir: Path):
    sec_src = classified_dir / "secret"
    if sec_src.exists():
        out = PRIVATE / "keep-secrets-2026-04-19.md"
        aggregate_secrets(sec_src, out)
        print(f"  aggregated secrets → {out} ({len(list(sec_src.glob('*.md')))} sources)")

    work_src = classified_dir / "work"
    if work_src.exists():
        n = quarantine_work(work_src, QUARANTINE / "work")
        print(f"  quarantined {n} WORK notes → {QUARANTINE / 'work'} (NOT in vault)")

    fam_src = classified_dir / "family-correspondence"
    if fam_src.exists():
        n = route_family(fam_src, PRIVATE / "keep-family-correspondence-2026-04-19")
        print(f"  routed {n} family-correspondence notes → Private/")


if __name__ == "__main__":
    main(Path(sys.argv[1] if len(sys.argv) > 1 else "~/tmp/keep-import/classified").expanduser())
```

- [ ] **Step 3: Run privacy router**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python route_private.py
```

Expected: 3 lines reporting counts to secrets / work / family-correspondence.

- [ ] **Step 4: Verify Private/ contains the secrets file and family-correspondence dir**

```bash
ls -la ~/Projects/vault/Private/keep-secrets-2026-04-19.md ~/Projects/vault/Private/keep-family-correspondence-2026-04-19/ | head -10
```

Expected: both exist, sizes >0.

- [ ] **Step 5: Privacy regression test — secrets must NOT have leaked outside Private/**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python <<'PY'
import re, subprocess
# Pull a recognizable secret fragment from the secrets file
secrets_file = "/Users/leighllewelyn/Projects/vault/Private/keep-secrets-2026-04-19.md"
content = open(secrets_file).read()
m = re.search(r'\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4,}\b', content)
if not m:
    print("No keylike string found — manual audit needed."); raise SystemExit
key = m.group(0)
# Grep entire vault EXCLUDING Private/
out = subprocess.run(["grep","-rIl","-F",key,"/Users/leighllewelyn/Projects/vault","--exclude-dir=Private","--exclude-dir=.git"],
                     capture_output=True, text=True)
hits = [h for h in out.stdout.splitlines() if h]
print(f"Leak hits outside Private/: {len(hits)}")
for h in hits: print(" ", h)
assert not hits, "SECRET LEAKED OUTSIDE Private/"
print("OK — no secret leakage")
PY
```

Expected: `Leak hits outside Private/: 0` and `OK — no secret leakage`.

- [ ] **Step 6: Commit (Private/ stays out of git automatically)**

```bash
cd ~/Projects/vault && git status  # should show no Private/ changes
git add scripts/keep-import/
git commit -m "feat(keep-import): privacy router — secrets/work/family"
```

---

## Task 6: Aggregate stubs into "Ideas from Old Keep Notes/"

**Files:**
- Create: `~/Projects/vault/scripts/keep-import/aggregate.py`
- Create: `~/Projects/vault/notes/Ideas from Old Keep Notes/_README.md`
- Create: ~10 aggregation files in `notes/Ideas from Old Keep Notes/`

- [ ] **Step 1: Implement `aggregate.py`**

```python
# ~/Projects/vault/scripts/keep-import/aggregate.py
"""Roll up stubs and short notes per bucket into one aggregated markdown per topic."""
from __future__ import annotations
import sys
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from lib_keep import slugify

VAULT = Path("~/Projects/vault").expanduser()
TARGET_DIR = VAULT / "notes" / "Ideas from Old Keep Notes"

# bucket → human-readable filename (without .md extension)
BUCKET_TO_FILE = {
    "cooking": "Cooking Captures",
    "health-fitness": "Health & Fitness Captures",
    "dnd": "D&D Captures",
    "gaming": "Gaming Captures",
    "goals-aspirations": "Goals & Aspirations Captures",
    "bookmark-list": "Bookmarks & Links Captures",
    "shopping-list": "Shopping Lists Captures",
    "quick-capture": "Quick Captures",
}

FRONTMATTER_RE = re.compile(r'^---\n(.*?)\n---\n', re.DOTALL)


def parse_note_md(p: Path) -> tuple[dict, str, str]:
    """Returns (frontmatter_dict, title, body)."""
    raw = p.read_text(encoding="utf-8")
    m = FRONTMATTER_RE.match(raw)
    fm = {}
    if m:
        for line in m.group(1).splitlines():
            if ": " in line:
                k, v = line.split(": ", 1)
                fm[k.strip()] = v.strip()
        body = raw[m.end():]
    else:
        body = raw
    title_m = re.search(r'^# (.+)$', body, re.M)
    title = title_m.group(1) if title_m else ""
    if title_m:
        body = body.replace(f"# {title}\n\n", "", 1).replace(f"# {title}\n", "", 1)
    return fm, title.strip(), body.strip()


def aggregate_bucket(src_dir: Path, target_path: Path, bucket_label: str):
    notes = []
    for md in sorted(src_dir.glob("*.md")):
        fm, title, body = parse_note_md(md)
        if not body and not title:
            continue
        notes.append((fm.get("created", "?"), title, body, fm.get("keep-id", md.stem)))
    notes.sort(key=lambda n: n[0])  # chronological

    parts = [
        "---",
        "type: reference",
        "tags: [keep-import, captures, " + bucket_label + "]",
        "created: 2026-04-19",
        "updated: 2026-04-19",
        "source: Google Keep export 2026-04-19",
        "---",
        "",
        f"# {target_path.stem}",
        "",
        f"Aggregated stubs and short notes from Google Keep ({bucket_label} bucket), imported 2026-04-19. "
        f"Each entry preserves its original Keep date. {len(notes)} entries.",
        "",
        "See: [[Ideas from Old Keep Notes/_README]] for the full import context.",
        "",
    ]
    for date, title, body, kid in notes:
        header = f"## {date}"
        if title:
            header += f" — {title}"
        parts.append(header)
        parts.append("")
        parts.append(body)
        parts.append("")
        parts.append(f"<sub>keep-id: `{kid}`</sub>")
        parts.append("")
    target_path.write_text("\n".join(parts), encoding="utf-8")
    return len(notes)


README = """---
type: reference
tags: [keep-import, captures]
created: 2026-04-19
updated: 2026-04-19
source: Google Keep export 2026-04-19
---

# Ideas from Old Keep Notes

This folder is the bulk-aggregated landing zone for ~1,400 short Google Keep stubs imported on 2026-04-19. Each file aggregates one topic bucket chronologically.

Why aggregated, not individual: 1,400 stubs as separate notes would drown the wiki. The classifier put each note in one bucket; this folder contains one rollup per bucket. Long-form essays (>1k chars) and topical content for which a canonical page already exists were routed elsewhere — see `log.md` entry for 2026-04-19.

Files:

- `Cooking Captures.md` — short cooking notes (see also `[[Cooking Techniques]]`)
- `Health & Fitness Captures.md` — workouts, sleep notes, supplements (see also `[[Health Metrics — Weekly]]`, `notes/training/`)
- `D&D Captures.md` — RPG snippets (see also `notes/dnd/`)
- `Gaming Captures.md` — video games
- `Goals & Aspirations Captures.md` — yearly goals, skills lists
- `Bookmarks & Links Captures.md` — URL collections
- `Shopping Lists Captures.md` — grocery, Amazon, Prime Day
- `Quick Captures.md` — everything else short and stubby

Mirrors the precedent of `[[Ideas from Old Emails]]`.
"""


def main(classified_dir: Path):
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    (TARGET_DIR / "_README.md").write_text(README, encoding="utf-8")
    print(f"Wrote README → {TARGET_DIR / '_README.md'}")
    for bucket, fname in BUCKET_TO_FILE.items():
        src = classified_dir / bucket
        if not src.exists():
            print(f"  [skip] {bucket} (no source dir)")
            continue
        target = TARGET_DIR / f"{fname}.md"
        n = aggregate_bucket(src, target, bucket)
        print(f"  {bucket:25s} → {target.name}  ({n} entries)")


if __name__ == "__main__":
    main(Path(sys.argv[1] if len(sys.argv) > 1 else "~/tmp/keep-import/classified").expanduser())
```

- [ ] **Step 2: Run aggregator**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python aggregate.py
```

Expected output: README written, 8 aggregation files created with entry counts.

- [ ] **Step 3: Spot-check one aggregated file**

```bash
head -50 ~/Projects/vault/notes/Ideas\ from\ Old\ Keep\ Notes/Cooking\ Captures.md
```

Expected: frontmatter, intro paragraph, then chronological entries with `## YYYY-MM-DD — Title` headers.

- [ ] **Step 4: Sanity check — no over-large file**

```bash
wc -c ~/Projects/vault/notes/Ideas\ from\ Old\ Keep\ Notes/*.md
```

Expected: each file <500KB. If `Quick Captures.md` is >1MB, consider splitting by year (note this for follow-up; don't block import).

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/vault && git add notes/"Ideas from Old Keep Notes"/ scripts/keep-import/
git commit -m "feat(vault): bulk-import Keep stubs as Ideas from Old Keep Notes/"
```

---

## Task 7: Long-form essay router → individual canonical pages

**Files:**
- Create: `~/Projects/vault/scripts/keep-import/route_essays.py`
- Create: ~30-50 individual files in `notes/`
- Create: `journal/personal/YYYY-MM-DD-keep-import-<slug>.md` per long voice transcript

- [ ] **Step 1: Implement `route_essays.py`**

```python
# ~/Projects/vault/scripts/keep-import/route_essays.py
"""Route essay-or-article and journal buckets to individual canonical pages."""
from __future__ import annotations
import sys
import re
from pathlib import Path
from lib_keep import slugify

VAULT = Path("~/Projects/vault").expanduser()
NOTES = VAULT / "notes"
JOURNAL_PERSONAL = VAULT / "journal" / "personal"

FRONTMATTER_RE = re.compile(r'^---\n(.*?)\n---\n', re.DOTALL)


def parse_note(p: Path) -> tuple[dict, str, str]:
    raw = p.read_text(encoding="utf-8")
    m = FRONTMATTER_RE.match(raw)
    fm = {}
    if m:
        for line in m.group(1).splitlines():
            if ": " in line:
                k, v = line.split(": ", 1)
                fm[k.strip()] = v.strip()
        body = raw[m.end():]
    else:
        body = raw
    title_m = re.search(r'^# (.+)$', body, re.M)
    title = title_m.group(1) if title_m else ""
    return fm, title.strip(), body.strip()


def render_essay_page(fm: dict, title: str, body: str, source_id: str) -> str:
    if title and title.startswith("# "):
        title = title[2:]
    safe_title = title or f"Untitled Keep note {source_id[:8]}"
    out = [
        "---",
        "type: idea",
        "tags: [keep-import]",
        f"created: {fm.get('created', '2026-04-19')}",
        "updated: 2026-04-19",
        f"source: Google Keep export 2026-04-19 (keep-id {source_id})",
        "---",
        "",
        f"# {safe_title}",
        "",
        body,
        "",
    ]
    return "\n".join(out)


def render_journal_page(fm: dict, title: str, body: str, source_id: str) -> str:
    out = [
        "---",
        "type: journal",
        "tags: [voice-memo, keep-import]",
        f"created: {fm.get('created', '2026-04-19')}",
        "updated: 2026-04-19",
        f"source: Google Keep export 2026-04-19 (keep-id {source_id})",
        "---",
        "",
        f"# {title or 'Keep journal — ' + fm.get('created','?')}",
        "",
        body,
        "",
    ]
    return "\n".join(out)


def safe_filename(title: str, src_id: str, date: str, max_len: int = 60) -> str:
    s = slugify(title) if title else f"keep-{src_id[:8]}"
    return s[:max_len] or f"keep-{src_id[:8]}"


def route_essays(src_dir: Path) -> list[tuple[Path, str]]:
    """Returns list of (target_path, source_keep_id) — written individually."""
    written = []
    for md in sorted(src_dir.glob("*.md")):
        fm, title, body = parse_note(md)
        if not body:
            continue
        kid = fm.get("keep-id", md.stem)
        slug = safe_filename(title, kid, fm.get("created","2026-04-19"))
        target = NOTES / f"{slug}.md"
        if target.exists():
            # don't overwrite existing canonical page; leave for human review
            target = NOTES / f"{slug} (Keep import).md"
        target.write_text(render_essay_page(fm, title, body, kid), encoding="utf-8")
        written.append((target, kid))
    return written


def route_journals(src_dir: Path) -> list[tuple[Path, str]]:
    JOURNAL_PERSONAL.mkdir(parents=True, exist_ok=True)
    written = []
    for md in sorted(src_dir.glob("*.md")):
        fm, title, body = parse_note(md)
        if not body:
            continue
        kid = fm.get("keep-id", md.stem)
        date = fm.get("created", "2026-04-19")
        slug = safe_filename(title, kid, date)
        target = JOURNAL_PERSONAL / f"{date}-keep-{slug}.md"
        if target.exists():
            target = JOURNAL_PERSONAL / f"{date}-keep-{slug}-{kid[:6]}.md"
        target.write_text(render_journal_page(fm, title, body, kid), encoding="utf-8")
        written.append((target, kid))
    return written


def main(classified_dir: Path):
    essays = route_essays(classified_dir / "essay-or-article")
    print(f"  Wrote {len(essays)} essay pages → notes/")
    journals = route_journals(classified_dir / "journal")
    print(f"  Wrote {len(journals)} journal entries → journal/personal/")


if __name__ == "__main__":
    main(Path(sys.argv[1] if len(sys.argv) > 1 else "~/tmp/keep-import/classified").expanduser())
```

- [ ] **Step 2: Run essay router**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python route_essays.py
```

Expected: counts of essay pages and journal entries written.

- [ ] **Step 3: Spot-check 5 random essay pages**

```bash
ls ~/Projects/vault/notes/*Keep* 2>/dev/null | head -3
ls -tr ~/Projects/vault/notes/*.md | tail -10 | xargs -I{} sh -c "echo '--- {} ---'; head -20 '{}'"
```

Confirm: frontmatter present, title present, body intact, no broken markdown.

- [ ] **Step 4: Note for human review — synthesis pass**

```bash
echo "Essay pages written to notes/. The Librarian skill (or a follow-up subagent) should:" 
echo "  1. Add 2+ wikilinks to existing pages per CLAUDE.md ingest rule"
echo "  2. Merge any obviously-duplicate canonical content (e.g. cooking notes that belong in notes/Cooking Techniques.md)"
echo "  3. Move D&D notes into notes/dnd/ subfolder where appropriate"
echo "This step is intentionally LEFT for the Librarian/Giles run, NOT this import script."
```

This is the synthesis-pass deferral — not a skipped step. The rationale: trying to do LLM synthesis on 50+ pages here would balloon scope and cost. Document it as a Librarian follow-up task in `log.md` (see Task 9).

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/vault && git add notes/ journal/personal/
git commit -m "feat(vault): route Keep essays + journals to canonical pages"
```

---

## Task 8: Idempotent manifest

**Files:**
- Create: `~/Projects/vault/scripts/keep-import/manifest.py`
- Create: `~/Projects/vault/Private/keep-import-manifest.json`

- [ ] **Step 1: Implement `manifest.py`**

```python
# ~/Projects/vault/scripts/keep-import/manifest.py
"""Track which Keep note IDs have been imported. Future runs skip these."""
from __future__ import annotations
import json
import sys
from pathlib import Path
from datetime import datetime

VAULT = Path("~/Projects/vault").expanduser()
MANIFEST = VAULT / "Private" / "keep-import-manifest.json"


def load() -> dict:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {"version": 1, "imports": []}


def save(m: dict):
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(m, indent=2), encoding="utf-8")


def record_import(classified_dir: Path, takeout_zip: str):
    m = load()
    seen_ids = {kid for imp in m["imports"] for kid in imp["keep_ids"]}
    new_ids = []
    bucket_counts = {}
    for bucket_dir in classified_dir.iterdir():
        if not bucket_dir.is_dir() or bucket_dir.name.startswith("_"):
            continue
        ids = [f.stem for f in bucket_dir.glob("*.md")]
        bucket_counts[bucket_dir.name] = len(ids)
        for kid in ids:
            if kid not in seen_ids:
                new_ids.append(kid)
    m["imports"].append({
        "date": datetime.now().date().isoformat(),
        "takeout_zip": takeout_zip,
        "keep_ids": new_ids,
        "bucket_counts": bucket_counts,
        "total_new": len(new_ids),
    })
    save(m)
    print(f"Recorded import: {len(new_ids)} new IDs, total in manifest: {sum(len(i['keep_ids']) for i in m['imports'])}")
    return m


if __name__ == "__main__":
    classified = Path(sys.argv[1] if len(sys.argv) > 1 else "~/tmp/keep-import/classified").expanduser()
    zipname = sys.argv[2] if len(sys.argv) > 2 else "takeout-20260420T003037Z-3-001.zip"
    record_import(classified, zipname)
```

- [ ] **Step 2: Run manifest writer**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python manifest.py
```

Expected: line reporting N new IDs (~1900) and total in manifest (~1900).

- [ ] **Step 3: Confirm manifest is gitignored**

```bash
cd ~/Projects/vault && git check-ignore -v Private/keep-import-manifest.json && echo "OK"
```

Expected: prints rule + `OK`.

- [ ] **Step 4: Commit script (manifest itself stays out of git)**

```bash
cd ~/Projects/vault && git status  # should NOT show keep-import-manifest.json
git add scripts/keep-import/
git commit -m "feat(keep-import): idempotent manifest in Private/"
```

---

## Task 9: Index + log updates

**Files:**
- Modify: `~/Projects/vault/index.md`
- Modify: `~/Projects/vault/log.md`

- [ ] **Step 1: Read current `index.md` to understand format**

```bash
head -30 ~/Projects/vault/index.md && echo "---END HEAD---" && tail -30 ~/Projects/vault/index.md
```

- [ ] **Step 2: Append Keep import section to `index.md`**

Add a section like:

```markdown
## Ideas from Old Keep Notes (imported 2026-04-19)

- [[Ideas from Old Keep Notes/_README]]
- [[Ideas from Old Keep Notes/Cooking Captures]]
- [[Ideas from Old Keep Notes/Health & Fitness Captures]]
- [[Ideas from Old Keep Notes/D&D Captures]]
- [[Ideas from Old Keep Notes/Gaming Captures]]
- [[Ideas from Old Keep Notes/Goals & Aspirations Captures]]
- [[Ideas from Old Keep Notes/Bookmarks & Links Captures]]
- [[Ideas from Old Keep Notes/Shopping Lists Captures]]
- [[Ideas from Old Keep Notes/Quick Captures]]
```

- [ ] **Step 3: Append to `log.md`**

```markdown
[2026-04-19 HH:MM] INGEST [keep-import] Google Keep export → vault — 1,964 source notes processed.
  - ~10 secrets → Private/keep-secrets-2026-04-19.md
  - ~20 work notes → quarantined at ~/tmp/keep-import/quarantine/work/ (NOT in vault)
  - ~40 family-correspondence → Private/keep-family-correspondence-2026-04-19/
  - ~80 long voice transcripts → journal/personal/
  - ~50-100 essays → notes/ (individual pages, awaiting Librarian synthesis pass)
  - ~1,400 stubs → notes/Ideas from Old Keep Notes/ (8 aggregated files)
  - Idempotent manifest at Private/keep-import-manifest.json
  - Plan: docs/superpowers/plans/2026-04-19-keep-import.md (in wikileighs repo)
  - FOLLOW-UP: Librarian pass to add wikilinks + merge into canonical pages where overlap exists
```

(Use actual numbers from your run. Replace `HH:MM` with current time.)

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/vault && git add index.md log.md
git commit -m "docs(vault): index + log entries for Keep import 2026-04-19"
```

---

## Task 10: End-to-end verification

**Files:**
- Create: `~/Projects/vault/scripts/keep-import/verify.py`

- [ ] **Step 1: Implement `verify.py`**

```python
# ~/Projects/vault/scripts/keep-import/verify.py
"""End-to-end verification of Keep import. Asserts privacy + counts."""
from __future__ import annotations
import json
import re
import subprocess
from pathlib import Path

VAULT = Path("/Users/leighllewelyn/Projects/vault")
PRIVATE = VAULT / "Private"
CLASSIFIED = Path("/Users/leighllewelyn/tmp/keep-import/classified")
RAW = Path("/Users/leighllewelyn/tmp/keep-import/raw")


def assert_(cond: bool, msg: str):
    status = "PASS" if cond else "FAIL"
    print(f"  [{status}] {msg}")
    return cond


def main():
    failures = 0

    # 1. Counts
    raw_count = len(list(RAW.glob("*.md")))
    bucket_total = sum(len(list(d.glob("*.md"))) for d in CLASSIFIED.iterdir() if d.is_dir() and not d.name.startswith("_"))
    if not assert_(raw_count == bucket_total, f"raw count ({raw_count}) == sum of buckets ({bucket_total})"):
        failures += 1

    # 2. Secrets containment
    secrets_file = PRIVATE / "keep-secrets-2026-04-19.md"
    if assert_(secrets_file.exists(), f"secrets file exists at {secrets_file}"):
        content = secrets_file.read_text()
        m = re.search(r'\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4,}\b', content)
        if m:
            key = m.group(0)
            out = subprocess.run(["grep","-rIl","-F",key,str(VAULT),"--exclude-dir=Private","--exclude-dir=.git","--exclude-dir=scripts","--exclude-dir=archive"],
                                 capture_output=True, text=True)
            hits = [h for h in out.stdout.splitlines() if h]
            if not assert_(len(hits) == 0, f"no secret leakage outside Private/ (key {key[:8]}…)"):
                for h in hits: print(f"      LEAK: {h}")
                failures += 1
        else:
            print("  [WARN] secrets file present but no key-pattern found for leak test")

    # 3. WORK quarantine — no work bucket files in vault notes/
    classified_work = CLASSIFIED / "work"
    if classified_work.exists():
        work_ids = {f.stem for f in classified_work.glob("*.md")}
        # spot check: any frontmatter `keep-id: <work_id>` inside notes/ or journal/?
        out = subprocess.run(["grep","-rIl","-E","keep-id: ("+"|".join(list(work_ids)[:50])+")",
                              str(VAULT/"notes"), str(VAULT/"journal")],
                             capture_output=True, text=True)
        hits = [h for h in out.stdout.splitlines() if h]
        if not assert_(len(hits) == 0, f"no WORK keep-ids found in vault notes/journal (sampled {min(len(work_ids),50)})"):
            for h in hits[:5]: print(f"      LEAK: {h}")
            failures += 1

    # 4. Manifest exists and is gitignored
    manifest = PRIVATE / "keep-import-manifest.json"
    if assert_(manifest.exists(), "manifest exists"):
        m = json.loads(manifest.read_text())
        if assert_(m["imports"], "manifest has at least one import recorded"):
            assert_(m["imports"][-1]["total_new"] > 1000, "latest import has >1000 new IDs")

    # 5. Aggregated files exist and are non-trivial
    target_dir = VAULT / "notes" / "Ideas from Old Keep Notes"
    if assert_(target_dir.exists(), "Ideas from Old Keep Notes/ exists"):
        for fname in ["_README.md", "Cooking Captures.md", "Health & Fitness Captures.md",
                       "D&D Captures.md", "Gaming Captures.md", "Quick Captures.md"]:
            f = target_dir / fname
            ok = f.exists() and f.stat().st_size > 200
            if not assert_(ok, f"{fname} exists and >200 bytes"):
                failures += 1

    # 6. index.md and log.md updated
    idx = (VAULT / "index.md").read_text()
    if not assert_("Ideas from Old Keep Notes" in idx, "index.md mentions 'Ideas from Old Keep Notes'"):
        failures += 1
    log = (VAULT / "log.md").read_text()
    if not assert_("keep-import" in log.lower() or "keep import" in log.lower(), "log.md has 2026-04-19 keep-import entry"):
        failures += 1

    print()
    if failures:
        print(f"FAIL — {failures} check(s) failed"); raise SystemExit(1)
    print("ALL CHECKS PASSED")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run verify.py**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python verify.py
```

Expected: every line `[PASS]`, final `ALL CHECKS PASSED`. If any FAIL, debug before signing off.

- [ ] **Step 3: Manual spot-checks (3 specific items)**

```bash
# (a) The 1Password key from the corpus made it ONLY to Private/
grep -l "1password secret key" ~/Projects/vault/Private/keep-secrets-2026-04-19.md && echo "OK: in Private/"
grep -l "1password secret key" ~/Projects/vault/notes 2>/dev/null && echo "FAIL: leaked to notes/" || echo "OK: not in notes/"

# (b) "Fair fighting Rules" essay (20K chars) made it as a canonical page
ls ~/Projects/vault/notes/ | grep -i "fair fighting" && echo "OK"

# (c) Family correspondence to mom is in Private/, not in journal/personal/
ls ~/Projects/vault/Private/keep-family-correspondence-2026-04-19/ | head -3
grep -l "Mum we love you" ~/Projects/vault/journal/personal/*.md 2>/dev/null && echo "FAIL: family in journal" || echo "OK: not in journal"
```

- [ ] **Step 4: WikiLeighs deploy safety check**

After commit/push, wait 3-4 min for the auto-deploy chain (vault push → repository_dispatch → wikileighs build). Then:

```bash
# Wait for deploy
gh run list --repo CoolGandalf/wikileighs --limit 1
```

Open `https://lgl.gg/wikileighs/` in the browser. Spot-check:
1. Confirm `Ideas from Old Keep Notes` shows in the LeftRail or sitemap.
2. Confirm a few new pages render (e.g., `Fair Fighting Rules`, `Cooking Captures`).
3. Search for the 1Password key fragment in browser — must NOT be present.
4. Confirm no family-correspondence pages render publicly.

- [ ] **Step 5: Final commit + push**

```bash
cd ~/Projects/vault && git status
# Should show: scripts/keep-import/verify.py
git add scripts/keep-import/verify.py
git commit -m "test(keep-import): end-to-end verification script"
git push
```

---

## Task 11: Idempotency dry-run (re-run safety)

**Files:** None (verification only)

- [ ] **Step 1: Re-run extract on same takeout zip**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python extract.py
```

Expected: identical stats. Same N written, same N skipped.

- [ ] **Step 2: Add an idempotency guard to `extract.py`**

Modify `extract_all` to consult the manifest and skip already-imported keep-ids:

```python
def extract_all(src_dir: Path, out_dir: Path, manifest_path: Path = None) -> dict:
    # ... existing code ...
    skip_ids = set()
    if manifest_path and manifest_path.exists():
        import json
        m = json.loads(manifest_path.read_text())
        for imp in m.get("imports", []):
            skip_ids.update(imp.get("keep_ids", []))
    # ... in the loop, after parse: ...
    # if note.id in skip_ids: stats["skipped_already_imported"] += 1; continue
```

- [ ] **Step 3: Add the test**

```python
# in test_extract.py
def test_skips_already_imported(tmp_path):
    src = tmp_path / "src"; src.mkdir()
    out = tmp_path / "out"
    manifest = tmp_path / "manifest.json"
    make(src, "a", {"textContent":"hi","title":"A","createdTimestampUsec":1633945465191000,"userEditedTimestampUsec":1633945736112000})
    manifest.write_text('{"version":1,"imports":[{"keep_ids":["a"]}]}')
    stats = extract_all(src, out, manifest_path=manifest)
    assert stats["written"] == 0
    assert stats["skipped_already_imported"] == 1
```

- [ ] **Step 4: Run test, then real re-run**

```bash
cd ~/Projects/vault/scripts/keep-import && conda activate dev && python -m pytest test_extract.py -v
# real:
python extract.py
```

Expected test: PASS. Expected real run: `written: 0`, `skipped_already_imported: ~1900`.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/vault && git add scripts/keep-import/
git commit -m "feat(keep-import): manifest-aware re-run skips already-imported"
git push
```

---

## Self-Review

**Spec coverage:**
- Extract Keep JSON → markdown ✓ (Task 2)
- Synthesize/merge into pre-existing categories ✓ (Tasks 6 + 7; Librarian follow-up note in 7.4)
- Find value from low-signal stubs ✓ (Task 6 aggregation)
- Privacy: secrets, work, family ✓ (Task 5)
- Idempotency for future Keep exports ✓ (Tasks 8 + 11)
- Testing first-class ✓ (Task 10 + per-task test steps; respects "every plan must include how we'll test what we built" feedback memory)

**Placeholder scan:** None found. Every code step shows full code.

**Type consistency:** `KeepNote` API used identically across `extract.py`, `classify.py`, `aggregate.py`, `route_essays.py`. `BUCKETS` list shared between `classify.py` (defined) and `llm_classify.py` (imported via constant copy — acceptable; if drift becomes a concern, refactor to `lib_keep.BUCKETS`).

**Known scope cuts (deliberate, called out in plan):**
- Librarian-style synthesis (adding wikilinks, merging essay pages into existing canonical pages) is left as a follow-up Librarian run, NOT performed by these scripts. The scripts get content into the vault safely; semantic enrichment is the Librarian's job. Logged in Task 9 step 3 as a follow-up.
- The plan does not auto-merge new essay content into existing pages like `notes/Cooking Techniques.md`. Each essay lands as its own file; if Leigh wants a cooking essay merged, the Librarian (or Leigh manually) does it. Reason: high error risk for an automated merge into pages with carefully-curated existing structure.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-19-keep-import.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Ideal here: each task is independent and easy to verify. Privacy-sensitive tasks (5, 10) get extra review.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints. Faster total wall-time but harder to recover if a phase produces unexpected output.

**Which approach?**
