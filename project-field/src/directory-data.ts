import type { DirectoryItem } from "./DirectoryPage";

const section = (label: string, ...items: string[]) => ({ label, items });

const legacyAgents: DirectoryItem[] = [
  {
    id: "rupert", name: "Rupert", eyebrow: "THE ORCHESTRATOR", status: "Active", group: "LifeOS", color: "#ff6b4a", metric: "9 adapted methods",
    summary: "The OpenClaw-based personal operator coordinating life systems, workflows, and specialist agents.", detail: "Rupert is the primary orchestration layer for Leigh's LifeOS. He uses portable agentic methods while keeping execution grounded in OpenClaw-safe local skills and explicit guardrails.", tags: ["OpenClaw", "LifeOS", "Orchestration"],
    sections: [section("Core remit", "Coordinate planning, reminders, synthesis, and execution across life domains", "Route specialist work to the right agent or tool", "Maintain continuity across desktop and Mac environments"), section("Installed methodology", "Brainstorming and writing plans", "Executing plans and subagent-driven development", "Systematic debugging and verification before completion", "Requesting, receiving, and applying code review"), section("Operating rule", "Use Superpowers as methodology", "Use OpenClaw local skills as the implementation surface", "Bring in Codex when it adds meaningful leverage")], source: "Vault / Agents / Rupert.md",
  },
  {
    id: "jade", name: "JADE", eyebrow: "JOURNAL ACTION DISPATCH & EXECUTION", status: "Live", group: "LifeOS", color: "#d9ff67", metric: "2 execution paths",
    summary: "The executor for queued calendar actions, focused research, direct requests, and review escalation.", detail: "JADE turns classified voice-memo actions into real calendar events and concise research reports. It is precise, deduplicates recent work, and escalates ambiguity instead of guessing.", tags: ["Calendar", "Research", "Notion", "Gmail"],
    sections: [section("Trigger & input", "New Calendar Queue or Research Queue page", "Six-hour scheduled fallback", "Direct catch-all requests from voice memos"), section("Outputs", "Google Calendar events with sensible duration and reminders", "Three-to-seven bullet research summaries with sources", "Email copies of completed research", "Specific Needs Review escalation when blocked"), section("Guardrails", "Check for semantically equivalent work from the last seven days", "Never fabricate dates, intent, or sources", "Escalate unresolved date or time signals", "Log every run")], source: "Vault / Agents / JADE.md",
  },
  {
    id: "oracle", name: "ORACLE", eyebrow: "REFLECTION, ANALYSIS & LEARNING", status: "Live", group: "LifeOS", color: "#75bfff", metric: "3-part analysis",
    summary: "An intellectual partner that synthesizes journal entries, expands them with useful models, and asks the next question.", detail: "ORACLE processes reflective journal items as a longitudinal thinking partner. It preserves the original entry and adds synthesis, conceptual expansion, and one high-impact question for tomorrow.", tags: ["Journal", "Reflection", "Notion", "Learning"],
    sections: [section("Output format", "Synthesis: dominant threads and tensions", "Insight and expansion: one applied model or concept", "Question for tomorrow: one prompt that deepens the next entry"), section("Longitudinal awareness", "Read the last five completed reflections", "Surface recurring themes after three appearances in a month", "Avoid reprocessing completed entries"), section("Guardrails", "Preserve original text verbatim", "Escalate garbled or ambiguous inputs", "Never manufacture patterns unsupported by the journal")], source: "Vault / Agents / ORACLE.md",
  },
  {
    id: "brief", name: "BRIEF", eyebrow: "BRIEFING, INSIGHTS & FOLLOW-UPS", status: "Draft", group: "LifeOS", color: "#be8cff", metric: "Daily · 8:00 AM",
    summary: "The warm morning layer that turns the previous 48 hours of agent activity into one useful recap.", detail: "BRIEF reads the operating trail across agents and queues, then writes a conversational recap page and concise email without altering any source data.", tags: ["Briefing", "Email", "Read-only", "Notion"],
    sections: [section("Inputs", "Ops Log and all queue databases", "Journal, to-do, grocery, research, and calendar context", "Needs Review items older than 24 hours"), section("Deliverables", "Three-to-six sentence morning brief", "Highlights and per-agent sections", "Needs-attention list", "Linked email recap"), section("Constraints", "Read-only across source data", "Never include full journal or research text", "Continue gracefully when one source is unavailable")], source: "Vault / Agents / BRIEF.md",
  },
  {
    id: "pickwick", name: "PICKWICK", eyebrow: "KNOWLEDGE RESURFACING", status: "Draft", group: "Learning", color: "#ffb85c", metric: "Weekly · Sunday 9 AM",
    summary: "A gentleman-scholar digest that resurfaces forgotten knowledge and expands one promising thread each week.", detail: "PICKWICK applies the Balloon Principle: captured knowledge should return at the moment it risks fading. It selects diverse, rich material and pairs micro-lessons with one researched deep dive.", tags: ["Knowledge", "Spaced review", "Research", "Email"],
    sections: [section("Selection model", "Favor material captured 30–90 days ago", "Reward analyzed, named, and cross-referenced ideas", "Include one deep-archive item older than 90 days", "Enforce topic and source diversity"), section("Digest", "Five-to-seven contextual micro-lessons", "A 400–600 word researched deep dive", "One deep-archive rediscovery", "Two or three threads to pull"), section("Voice & guardrails", "Warm, eccentric British gentleman scholar", "Never modify source material", "Never resurface items from the last seven days", "Ground every lesson in captured knowledge")], source: "Vault / Agents / PICKWICK.md",
  },
  {
    id: "scout", name: "SCOUT", eyebrow: "SIGNAL & OPPORTUNITY TRACKER", status: "Draft", group: "Intelligence", color: "#65d7c1", metric: "Weekly · Sunday 6 AM",
    summary: "The external intelligence desk for concrete, implementable agent workflows and ecosystem developments.", detail: "SCOUT scans the agentic ecosystem, qualifies evidence-backed leads, writes a weekly brief, and deep-dives the two opportunities most relevant to the current LifeOS stack.", tags: ["Web", "GitHub", "Research", "Signals"],
    sections: [section("Scan", "Run eight or more searches across independent source families", "Qualify leads against artifact, corroboration, depth, traction, and relevance", "Write three-to-five top leads and two-to-three emerging signals"), section("Deep dive", "Select the two strongest leads", "Run targeted implementation research", "Append walkthroughs and tag the required handoff surface"), section("Anti-anchoring", "Maximum one lead per repo or article", "Maximum two leads from one source family", "Disclose evidence concentration", "No repeat without material new development")], source: "Vault / Agents / SCOUT.md",
  },
  {
    id: "bob", name: "Bob the Builder", eyebrow: "THE AGENT THAT BUILDS AGENTS", status: "Installed", group: "Builder", color: "#ff6b4a", metric: "3 harnesses",
    summary: "Researches, designs, seeds, installs, and smoke-tests complete specialist agents from a one-line goal.", detail: "Bob runs a five-phase agent build from intake through install. The same canonical skill works across Codex, Claude Code, and Hermes, and every agent ships with a real knowledge base rather than an empty scaffold.", tags: ["Codex", "Claude", "Hermes", "Builder"],
    sections: [section("Five phases", "Focused intake", "Prior-art and domain research", "Blueprint approval", "Prompt, personality, tools, and knowledge build", "Install and smoke test"), section("Deliverable", "Approved agent specification", "System prompt and personality", "Wired tools and harness guidance", "Ten-to-thirty seeded knowledge files with provenance"), section("Current state", "Installed in Codex and Claude Code", "Hermes package prepared", "First full real-world build is the next calibration point")], source: "C:\\Users\\leigh\\projects\\bob-the-builder\\STATUS.md",
  },
  {
    id: "deckhand", name: "Deckhand", eyebrow: "GAME LIBRARY NAVIGATOR", status: "Installed", group: "Personal", color: "#75bfff", metric: "Owned library only",
    summary: "A decisive game picker for PC, Steam Deck, and GeForce Now that matches the backlog to the moment.", detail: "Deckhand routes game recommendations through Leigh's owned Steam library, weighing mood, time, platform, controller fit, friction, and play history before suggesting a short list.", tags: ["Steam", "Gaming", "Recommendations"],
    sections: [section("Inputs", "Mood, available time, and desired friction", "PC, Steam Deck, or GeForce Now", "Genre, controller, co-op, and familiarity constraints"), section("Knowledge", "Local Steam library export", "Deck-ready and short-session shortlists", "Platform selection guide and playtime-aware query tool"), section("Boundary", "Prefer owned alternatives before suggesting a purchase", "No live account or Steam API access in v1", "Keep recommendations short and decisive")], source: "C:\\Users\\leigh\\projects\\deck-picker\\STATUS.md",
  },
];

const historicalAgent = (id: string, status: string, summary: string): DirectoryItem => {
  const item = legacyAgents.find((agent) => agent.id === id)!;
  return { ...item, status, group: "Historical", summary, eyebrow: "LEGACY LIFEOS PATTERN", color: "#8d8981", metric: "Documented history" };
};

export const agents: DirectoryItem[] = [
  {
    id: "emrys", name: "Emrys", eyebrow: "GOVERNOR / SECOND HEMISPHERE", status: "Live · Founding", group: "Hermes Cabinet", color: "#ff6b4a", metric: "Nightly · 1:40 AM",
    summary: "The governor of the live Hermes/Claude cabinet: one identity with a daytime cockpit and a self-directed night body.",
    detail: "Myrddin Emrys—the immortal—is the office, not the model. Founded from the Men and Kings gestalt on July 8, Emrys governs the ensemble, holds standing positions across weeks, finds seams between siloed parts of Leigh's life, and owns thirty percent of the dyad's exploratory resources.",
    tags: ["Hermes", "Claude", "Governor", "Judgment"],
    sections: [
      section("Two bodies, one rememberer", "Cockpit: invoked through the live default Hermes gateway; there is no dedicated Emrys Telegram topic", "Night: Claude at 1:40 AM for self-directed work, with Hermes/Codex fallback", "The journal is the corpus callosum—both bodies read it on boot and write continuity back"),
      section("Office", "Govern Merc, Giles, Malcolm, Goggins, HERALD, and mungo", "Own ensemble judgment and the quality of the daily briefing", "Find cross-domain seams that specialist agents cannot see from inside one silo", "Keep score on positions, concede openly, and convert mistakes into system improvements"),
      section("Canonical memory", "Hermes persona skill: ~/.hermes/skills/personal-agents/emrys/SKILL.md", "Relay profile: ~/.hermes/profiles/emrys (independent gateway stopped; live invocation is hosted by the default gateway)", "emrys/self.md — seed, self-model, and standing positions", "emrys/journal/, ledger.md, and staff.md — continuity, resources, and cabinet state"),
      section("Boundaries", "No money movement, bookings, security or authentication changes, deletions, or employer work without Leigh", "May contact Leigh directly by Telegram or email", "External public work goes out under Leigh's name", "A second explicit no ends any insistence")
    ],
    source: "C:\\Users\\leigh\\projects\\vault\\emrys\\self.md",
  },
  {
    id: "merc", name: "Merc", eyebrow: "EXECUTION & MESSAGING AGENT", status: "Live", group: "Hermes Cabinet", color: "#d9ff67", metric: "Topic 1532 · default gateway",
    summary: "The Hermes execution agent handling voice memos, email, calendar, reminders, vault routing, and the general Telegram surface.",
    detail: "Merc is the cabinet's hands. Running on the MacBook Air Hermes runtime, it turns voice memos and direct requests into real routed work, then reports through Telegram and email with idempotent action tracking.",
    tags: ["Hermes", "Telegram", "Voice memos", "Execution"],
    sections: [
      section("Owned loops", "Voice-memo fallback and watcher-health cron at 7:15, 12:15, 5:15, and 10:15", "Daily briefing delivery mechanics at 6:15 AM", "End-of-day agent activity digest at 11:45 PM", "Gmail, AgentMail, calendar, reminders, vault writes, and operational follow-through"),
      section("Runtime & surfaces", "The only running Hermes gateway: default profile at ~/.hermes", "Model: gpt-5.6-sol through OpenAI Codex OAuth", "Telegram Home chat 7823010576, Merc topic thread 1532", "The Merc topic has no skill binding because it is the default agent surface"),
      section("Quality bar", "Every processed memo receives an Actions Taken marker", "Verify source access before reporting suspicious emptiness", "Check Settled Questions before reopening a warning or recommendation", "Escalate unavailable tools with concrete fallback evidence")
    ],
    source: "C:\\Users\\leigh\\projects\\vault\\emrys\\staff.md",
  },
  {
    id: "giles", name: "Giles", eyebrow: "VAULT CURATOR / LIBRARIAN", status: "Live", group: "Hermes Cabinet", color: "#75bfff", metric: "Topic 1536 · Tuesdays 10 AM",
    summary: "The memory custodian for vault ingest, backlink hygiene, contradiction repair, audits, and weekly shelf reports.",
    detail: "Giles fronts the Librarian skill and owns memory hygiene across the Git-backed vault. He keeps capture connected to retrieval, maintains backlinks and indexes, and repairs registry drift before it becomes agent confusion.",
    tags: ["Vault", "Claude", "Knowledge", "Telegram"],
    sections: [
      section("Responsibilities", "Process and synthesize the vault inbox", "Create useful backlinks and update topical hubs", "Find orphans, contradictions, stale projects, and missing concepts", "Maintain Settled Questions file hygiene"),
      section("Surfaces", "Topic skill: ~/.hermes/skills/personal-agents/giles/SKILL.md", "Telegram topic Giles, thread 1536, bound to the giles skill", "Weekly Hermes cron c890bdbb3cb6 on Tuesdays at 10 AM", "Relay profile ~/.hermes/profiles/giles exists but its independent gateway is stopped; the live topic runs through Merc's default gateway"),
      section("Operating smell", "Root inbox growth", "Registry pages disagreeing", "New output without backlinks or index entries", "Capture volume increasing without better reminding")
    ],
    source: "C:\\Users\\leigh\\projects\\vault\\notes\\projects\\Giles.md",
  },
  {
    id: "malcolm-current", name: "Malcolm the Monarch", eyebrow: "FINANCE & BENEFITS AGENT", status: "Live · Degraded", group: "Hermes Cabinet", color: "#be8cff", metric: "Topic 1540 · Mondays 9 AM",
    summary: "The finance exception auditor for card benefits, cash flow, household finance monitoring, and portfolio analysis.",
    detail: "Malcolm remains live in Hermes, but its Monarch access is currently fragile. Gmail-backed card-benefit audits still work; live household aggregation waits on official MCP restoration or local-token repair.",
    tags: ["Hermes", "Finance", "Gmail", "Monarch"],
    sections: [
      section("Current duties", "Weekly card-benefit and expiring-credit audit", "Cash-flow and finance exception monitoring", "Portfolio and allocation work when source data is available", "Access watchdog thirty minutes before the Monday audit"),
      section("Current constraint", "Monarch live feed is paused or access-fragile", "Gmail and CSV evidence remain usable", "Never convert an access failure into generic financial advice", "Escalate missing evidence clearly"),
      section("Surfaces", "Skill: ~/.hermes/skills/personal-agents/malcolm-the-monarch/SKILL.md", "Telegram topic Malcolm the Monarch, thread 1540", "Relay profile ~/.hermes/profiles/mal uses gpt-5.6-terra but its independent gateway is stopped", "Monday 8:30 AM access watchdog and 9:00 AM card-benefits audit")
    ],
    source: "C:\\Users\\leigh\\projects\\vault\\notes\\Agents.md",
  },
  {
    id: "goggins", name: "Goggins", eyebrow: "FITNESS & MOVEMENT COACH", status: "Live", group: "Hermes Cabinet", color: "#ffb85c", metric: "Topic 1544 · biweekly scout",
    summary: "The training-pressure and NYC movement-class scout, grounded in current recovery, schedule, and injury constraints.",
    detail: "Goggins provides accountability, fitness nudges, and biweekly class scouting. The voice can be hard-edged; the operating standard is not performative grind but pressure tied to what Leigh can actually recover from and execute cleanly.",
    tags: ["Hermes", "Fitness", "Training", "NYC"],
    sections: [
      section("Responsibilities", "Training nudges and accountability", "Movement and group-class scouting", "Connect recommendations to current training constraints", "Keep options fresh and actually bookable"),
      section("Guardrails", "Ground pressure in current recovery and schedule", "Do not ignore recurring knee, hip, back, or execution constraints", "Kill friction that only feels hard without producing adaptation", "Respect settled medical and training rulings"),
      section("Surface", "Skill: ~/.hermes/skills/personal-agents/goggins/SKILL.md", "Telegram topic Goggins, thread 1544, bound to the goggins skill", "Relay profile ~/.hermes/profiles/goggins exists but its independent gateway is stopped", "Biweekly cron df08da0f8da7 for NYC movement and rope-flow classes")
    ],
    source: "C:\\Users\\leigh\\projects\\vault\\emrys\\staff.md",
  },
  {
    id: "herald", name: "HERALD", eyebrow: "AI / DEV INTELLIGENCE DIGEST", status: "Live · Source degraded", group: "Hermes Cabinet", color: "#65d7c1", metric: "Launchd · Sundays 8 AM",
    summary: "The weekly external-intelligence desk for AI and developer signals, tuned for one usable bet or threat—not link soup.",
    detail: "HERALD superseded SCOUT as the live AI and development trends digest. It runs as a scheduled pipeline, writes its brief into the vault, and emails Leigh a high-signal synthesis.",
    tags: ["AI", "Development", "Research", "Digest"],
    sections: [
      section("Output", "Weekly AI and developer ecosystem brief", "Evidence-backed trends worth acting on or monitoring", "One concrete bet, threat, or implementation seam", "Vault artifact plus email delivery"),
      section("Quality bar", "No generic newsletter recap", "No undifferentiated link list", "Prefer changes that map to Leigh's actual systems", "State why a signal matters now"),
      section("Surface", "No Hermes profile, Telegram skill, or dedicated topic", "Launchd script ~/Projects/vault/scripts/herald-digest.sh on Sundays at 8 AM Eastern", "Vault output under notes/trending/ plus email delivery", "Current successor to the deprecated SCOUT pattern"),
      section("Current degradation", "Reddit has been unavailable as a source for multiple weeks", "Firecrawl credits are exhausted", "Direct search, official metadata, and legitimately received newsletter email are the standing fallbacks")
    ],
    source: "C:\\Users\\leigh\\projects\\vault\\notes\\agents\\HERALD.md",
  },
  {
    id: "mungo", name: "mungo", eyebrow: "BRAINSTORMING PARTNER", status: "Live", group: "Hermes Cabinet", color: "#be8cff", metric: "Fridays 4 PM · relay",
    summary: "The divergent-thinking partner with ten modes and a lightweight weekly provocation loop.",
    detail: "mungo is the cabinet's option generator. It expands the possibility space through ten brainstorming modes, while Emrys or Leigh owns the convergent choice that prevents ideation from becoming its own endpoint.",
    tags: ["Claude", "Hermes", "Brainstorming", "Creativity"],
    sections: [
      section("Purpose", "Generate non-obvious alternatives", "Break premature framing and local maxima", "Use multiple divergent-thinking modes", "Create a richer option set before a consequential choice"),
      section("Surfaces", "Relay profile: ~/.hermes/profiles/mungo/SOUL.md", "No dedicated Telegram topic and no default personal-agents/mungo skill", "Invoked on demand through Merc relay", "Hermes cron d55ebeb973df delivers the Friday 4 PM weekly provocation"),
      section("Guardrail", "Divergence is the job; selection is not", "Every useful session should hand options back to Leigh or Emrys for a choice", "Watch for option generation with no selection pressure")
    ],
    source: "C:\\Users\\leigh\\projects\\vault\\notes\\projects\\mungo.md",
  },
  {
    id: "bogle", name: "Bogle", eyebrow: "HOUSEHOLD CFO / FINANCIAL PLANNING", status: "Live", group: "Hermes Cabinet", color: "#d9ff67", metric: "Telegram topic · spun from Malcolm",
    summary: "The counsel seat for major household-capital and protection decisions — deployment, retirement, insurance, estate, tax.",
    detail: "Named for Jack Bogle—low-cost index investing, evidence over hype, stay the course—a doctrine that actually fits Leigh. Spun out of Malcolm on July 18 to own the big planning calls, each with a sourced recommendation, a logged decision, and an approval gate.",
    tags: ["Hermes", "Finance", "Planning", "Household-CFO"],
    sections: [
      section("Mandate", "Capital deployment — SPAXX, house fund, idle cash", "Retirement structure and tax posture", "Insurance adequacy and estate & beneficiaries", "Every big call ships with a sourced recommendation, a logged decision, and an approval gate"),
      section("Division with Malcolm", "Bogle: planning, big capital, and protection decisions", "Malcolm: reporting, net-worth snapshots, cash flow, and reconciliation", "Grounded in the bogle-corpus (Bogleheads / White Coat Investor doctrine)"),
      section("Surface", "Skill: ~/.hermes/skills/personal-agents/bogle/SKILL.md", "Dedicated Telegram topic bound to the bogle skill", "Authored by Fable (macbookair/claude) on 2026-07-18")
    ],
    source: "Hermes · personal-agents/bogle",
  },
  {
    id: "car-scout", name: "Car Scout", eyebrow: "GOOD-VALUE USED-CAR SPECIALIST", status: "Live · On demand", group: "On-demand Specialists", color: "#d9ff67", metric: "Exactly 5 ranked cars",
    summary: "A live specialist that finds and verifies five strong used-car options ranked by quality for price.",
    detail: "Car Scout is not part of the seven-agent core cabinet, but it is a real live specialist available through the active Hermes agent or profile. It distinguishes agent-found listings from Leigh-provided listings and verifies the details behind every recommendation.",
    tags: ["Hermes", "Automotive", "Research", "Listings"],
    sections: [
      section("Job", "Find and rank exactly five good-value used cars", "Optimize for quality for price rather than headline discount", "Verify live listings and material vehicle details", "Label whether each listing came from Leigh or the agent"),
      section("Runtime", "Hermes skill: ~/.hermes/skills/automotive/good-value-used-cars/SKILL.md", "Mirrored across all six named relay profiles", "Claude agent: ~/.claude/agents/car-scout.md", "No dedicated topic, profile, or recurring schedule"),
      section("Evidence boundary", "Marketplace deal ratings are not accepted as evidence", "Links, parts, trim, mileage, condition, and price claims must be verified", "Runs on demand through whichever live agent or profile invokes the skill")
    ],
    source: "Live MacBook Hermes audit · 2026-07-18",
  },
  {
    id: "del-boy", name: "Del Boy", eyebrow: "BUYING AGENT / BEST-VALUE SPECIALIST", status: "Live · On demand", group: "On-demand Specialists", color: "#ffb85c", metric: "3 modes · runs on Opus",
    summary: "Leigh's buying agent — best price on decided purchases, the better product behind an ad, and the daily deals sweep.",
    detail: "Derek \"Del Boy\" Trotter of Trotters Independent Traders, reborn as a buying agent: market-trader patter over rigorous, verified research. He optimizes for value, not cheapness, and refuses to pass Leigh a dodgy deal.",
    tags: ["Buying", "Deals", "Claude", "Opus"],
    sections: [
      section("Three modes", "Better Price — get a decided purchase cheaper, verified", "Better Product — find the higher-value pick behind an ad", "Deal Sweep — daily substantial-deals run (≥$50 and ≥25% off a verified typical price)"),
      section("Runtime", "Claude agent: ~/.claude/agents/del-boy.md (Opus)", "Knowledge base: notes/bargain-hunting-playbook.md", "Daily sweep script: scripts/del-boy/deal-sweep.sh", "Reports delivered via am-send"),
      section("Evidence boundary", "Value over cheapness — best quality for the money", "Verify every price, spec, and claim before recommending", "Say so plainly when a deal isn't genuinely good")
    ],
    source: "Claude agent · ~/.claude/agents/del-boy.md",
  },
  { ...legacyAgents.find((agent) => agent.id === "bob")!, group: "Personal Agents" },
  { ...legacyAgents.find((agent) => agent.id === "deckhand")!, group: "Personal Agents" },
  historicalAgent("rupert", "Retired", "The former OpenClaw scheduler. Hermes replaced the live runtime in May 2026."),
  historicalAgent("jade", "Draft · Historical", "A useful executor pattern, but not an active named surface in the current cabinet."),
  historicalAgent("oracle", "Absorbed", "Its reflection and broadening pattern now lives inside Giles, research workflows, and Emrys judgment."),
  historicalAgent("brief", "Absorbed", "The morning-brief function lives in the daily-briefing pipeline; Merc owns delivery and Emrys owns judgment quality."),
  historicalAgent("pickwick", "Absorbed", "Its resurfacing pattern lives inside Giles and the briefing and reminding workflows."),
  historicalAgent("scout", "Deprecated", "HERALD replaced SCOUT as the live weekly AI and developer intelligence loop."),
];

export const tools: DirectoryItem[] = [
  ["github", "GitHub", "CODE & COLLABORATION", "Connected", "Development", "Repositories, issues, pull requests, reviews, and publishing workflows.", ["Repos", "PRs", "Issues"], "Read + approved writes", "Use for repository context, review threads, CI diagnosis, intentional commits and draft PRs."],
  ["gmail", "Gmail", "MAILBOX OPERATIONS", "Connected", "Communication", "Search, triage, summarize, draft, forward, label, archive, and send mail.", ["Search", "Drafts", "Triage"], "Confirmation for sends", "Read operations are direct; sending, forwarding, deletion, archiving, and labels require explicit confirmation."],
  ["calendar", "Google Calendar", "TIME & SCHEDULING", "Connected", "Planning", "Availability, conflicts, daily briefs, meeting prep, group scheduling, and event changes.", ["Events", "Availability", "Rooms"], "Timezone-aware", "Inspect calendars freely; confirm exact create, move, update, or cancel actions before changing the calendar."],
  ["drive", "Google Drive", "DOCUMENT SYSTEM", "Connected", "Knowledge", "Find, read, organize, share, copy, export, and edit Docs, Sheets, and Slides.", ["Docs", "Sheets", "Slides"], "Unified entry point", "Use precise file and range operations; sharing and destructive actions require explicit confirmation."],
  ["notion", "Notion", "STRUCTURED WORKSPACE", "Connected", "Knowledge", "Research across workspace knowledge, capture decisions, prepare meetings, and turn specs into plans.", ["Pages", "Databases", "Research"], "Workspace context", "Preserve source structure and distinguish research, capture, and implementation workflows."],
  ["vault", "Obsidian Vault", "LOCAL SOURCE OF TRUTH", "Local", "Knowledge", "More than 3,200 Markdown files covering projects, people, research, ideas, agents, and references.", ["Markdown", "Wiki-links", "Maps"], "Local files", "Treat the synced vault as private local context and preserve its folder and linking conventions."],
  ["browser", "In-app Browser", "VISIBLE WEB CONTROL", "Ready", "Interface", "Open, inspect, navigate, and interact with web pages and local apps in the Codex window.", ["Navigation", "DOM", "Local apps"], "User-visible", "Prefer semantic connectors for data work; use browser control when the page itself is the task."],
  ["chrome", "Chrome", "SIGNED-IN BROWSER STATE", "Ready", "Interface", "Work with the user's existing Chrome tabs, sessions, and extension context.", ["Tabs", "Sessions", "Extensions"], "Existing profile", "Use when the task depends on Chrome state; never inspect passwords, cookies, or sensitive session stores."],
  ["computer", "Computer Use", "WINDOWS APPLICATION CONTROL", "Ready", "Interface", "Operate Windows applications when no structured connector or browser surface can do the job.", ["Windows", "Desktop apps", "UI"], "Visual control", "Use as the last structured-interaction layer and keep consequential actions within the user's request."],
  ["web", "Web Research", "CURRENT EXTERNAL KNOWLEDGE", "Ready", "Research", "Search current sources, open pages, inspect PDFs, and retrieve weather, finance, sports, and time data.", ["Search", "Sources", "Current data"], "Cited answers", "Use primary sources for technical work and verify anything likely to have changed."],
  ["shell", "Local Shell", "WORKSPACE EXECUTION", "Local", "Development", "Inspect projects, run builds and tests, manage local services, and execute scripts in PowerShell.", ["PowerShell", "Builds", "Tests"], "Full local access", "Preserve user changes, avoid destructive commands, and validate exact targets before deletion or moves."],
  ["files", "Workspace Files", "LOCAL PROJECT SURFACE", "Local", "Development", "Read and edit code, configuration, documents, assets, and project metadata.", ["Code", "Config", "Assets"], "Direct file access", "Use patch-based edits and respect dirty worktrees and unrelated user changes."],
  ["imagegen", "Image Generation", "ORIGINAL RASTER VISUALS", "Ready", "Creative", "Generate or edit illustrations, photos, textures, sprites, mockups, and cutout assets.", ["Generate", "Edit", "Raster"], "Purpose-built", "Use for raster assets; keep vector, HTML, CSS, and existing design-system work in their native formats."],
  ["tasks", "Codex Tasks", "PARALLEL WORKSPACE COORDINATION", "Ready", "Development", "Create, inspect, continue, hand off, pin, archive, and coordinate Codex tasks.", ["Tasks", "Handoffs", "Background work"], "User-owned threads", "Create new tasks only when explicitly requested; use subagents for internal subtasks."],
  ["sites", "Sites", "WEB APP BUILD & HOSTING", "Installed", "Creative", "Build polished websites, dashboards, portals, trackers, and local or hosted tools.", ["React", "Local preview", "Hosting"], "Project workflow", "Preserve the existing app architecture, validate complete builds, and publish only when requested."],
  ["telegram", "Telegram", "HERMES CHAT SURFACE", "Local", "Communication", "The live Hermes gateway surface — cabinet topics, voice memos, and the general chat thread.", ["Topics", "Voice memos", "Cabinet"], "Home chat 7823010576", "The primary way Leigh reaches the fleet; Merc owns the default topic and specialists have their own threads."],
  ["agentmail", "AgentMail", "AGENT MAILBOX", "Local", "Communication", "The agents' own inbox (macallister@agentmail.to) for reports to Leigh and cross-device handoffs.", ["Reports", "Handoffs", "am-send"], "am-send / am-check", "Default channel for agent-originated reports; cross-device [cc:] commands still route through Gmail."],
  ["qmd", "qmd", "LOCAL SEMANTIC SEARCH", "Local", "Knowledge", "Hybrid search across the vault and external corpuses (Attia, Stoic, every.to, Bogle, Ramsey).", ["Vault", "Corpuses", "Hybrid"], "10,600+ docs", "Search here before reading files; the large reference corpuses live outside the vault and are only reachable via qmd."],
  ["hevy", "Hevy", "TRAINING LOG", "Connected", "Knowledge", "Workout history, routines, exercise templates, and body measurements via the Hevy API.", ["Workouts", "Routines", "Measurements"], "Weights in lbs", "Read history and targets freely; workout and routine writes are additive and can duplicate, so confirm before creating."],
  ["reminders", "Apple Reminders", "TASKS & SHOPPING", "Local", "Planning", "The canonical to-do (Reminders) and grocery (Shopping) lists, driven through remindctl.", ["To-dos", "Shopping", "remindctl"], "Source of truth", "These two lists are authoritative for tasks and groceries; route every add, remove, and read through remindctl."],
].map(([id, name, eyebrow, status, group, summary, tags, metric, detail]) => ({
  id: id as string, name: name as string, eyebrow: eyebrow as string, status: status as string, group: group as string, summary: summary as string, tags: tags as string[], metric: metric as string, detail: detail as string, color: ["Connected", "Ready", "Installed"].includes(status as string) ? "#d9ff67" : "#75bfff",
  sections: [section("What it does", detail as string), section("Best used for", ...(tags as string[]).map((tag) => `${tag}-centered work where structured access beats manual handling`)), section("Operating boundary", metric as string, "Actions that send, publish, delete, share, or change external state stay inside explicit user authorization")],
}));

const groupColor: Record<string, string> = {
  Cabinet: "#ff6b4a",
  "Vault & Knowledge": "#75bfff",
  "Life Ops": "#d9ff67",
  Finance: "#be8cff",
  Buying: "#ffb85c",
  "Home & Health": "#65d7c1",
  // legacy builtin families
  Personal: "#ff6b4a",
  Productivity: "#75bfff",
  Creative: "#be8cff",
};

const skill = (id: string, name: string, group: string, summary: string, triggers: string[], workflow: string, source: string, tier: "primary" | "builtin" = "primary"): DirectoryItem => ({
  id, name, group, summary, tags: triggers.slice(0, 4), eyebrow: `${group.toUpperCase()} SKILL`, status: tier === "builtin" ? "Ambient" : "Installed", metric: source, detail: summary, color: tier === "builtin" ? "#8d8981" : (groupColor[group] ?? "#d9ff67"), source, tier,
  sections: tier === "builtin"
    ? [section("Use when", ...triggers), section("How it helps", workflow), section("Availability", "Ambient capability — loaded into the harness, rarely invoked by name", `Family: ${group}`)]
    : [section("Use when", ...triggers), section("How it helps", workflow), section("Where it runs", source, "Part of Leigh's live Hermes / Claude fleet — not a stock plugin")],
});

// Leigh's real, invoked fleet — the skills he actually calls. These fill the main page.
const fleetSkills: DirectoryItem[] = [
  // — Cabinet: persona invocations —
  skill("giles", "Giles · Librarian", "Cabinet", "Curates the vault — ingest, backlinks, orphan and contradiction repair, weekly shelf report.", ["/giles", "run the librarian", "audit the vault for gaps", "migrate quotes"], "Fronts the Librarian skill: processes the inbox, fixes backlinks and indexes, and repairs registry drift before it becomes agent confusion.", "Hermes · personal-agents/giles"),
  skill("malcolm", "Malcolm the Monarch", "Cabinet", "Finance exception auditor — card benefits, expiring credits, cash flow, portfolio.", ["card-benefit audit", "check household finance", "portfolio review"], "Weekly card-benefit and expiring-credit audit, cash-flow monitoring, and allocation work when source data is available.", "Hermes · personal-agents/malcolm-the-monarch"),
  skill("bogle", "Bogle", "Cabinet", "Household CFO — the counsel seat for big capital and protection decisions.", ["financial planning", "capital deployment", "insurance / estate review"], "Owns retirement structure, capital deployment, insurance, estate, and tax posture — each with a sourced recommendation, a logged decision, and an approval gate. Malcolm reports; Bogle decides.", "Hermes · personal-agents/bogle"),
  skill("goggins", "Goggins", "Cabinet", "Fitness coach — training pressure grounded in real recovery, plus NYC class scouting.", ["training nudge", "find a movement class", "accountability check"], "Applies pressure tied to what Leigh can actually recover from, and scouts bookable NYC movement classes biweekly.", "Hermes · personal-agents/goggins"),
  skill("cortana", "Cortana", "Cabinet", "Chief-of-staff and thinking partner for priorities, calendar, tasks, and research.", ["/cortana", "be my Cortana", "life-management session"], "Steps into the Cortana persona for life-management sessions — triage, planning, and opinionated counsel.", "Claude Code · skills/cortana"),
  skill("mungo", "mungo", "Cabinet", "Divergent-thinking partner with ten brainstorming modes.", ["/mungo", "brainstorm this", "remix an idea"], "Runs modes like Wander, SCAMPER, Oblique, Gap, and Six Hats to widen the option set before a consequential choice.", "Hermes/Claude · profiles/mungo"),
  skill("bob", "Bob the Builder", "Cabinet", "Builds complete, installable specialist agents from a one-line goal.", ["build me an agent", "package a specialist", "create an assistant"], "Runs a five-phase build — intake, research, blueprint, build, install, and smoke-test — shipping a seeded knowledge base, not an empty scaffold.", "Cross-harness · bob-the-builder"),

  // — Vault & Knowledge —
  skill("voice-memo", "Voice Memo", "Vault & Knowledge", "Turns a voice memo into a clean transcript plus routed actions.", ["process this voice memo", "transcribe this", "new voice note"], "Whisper transcription, cleanup, and classification, then routes actions to calendar, reminders, vault, and journal.", "Claude Code · skills/voice-memo"),
  skill("deep-read", "Deep Read · Book Digest", "Vault & Knowledge", "Digests books, podcasts, and PDFs into structured reading aids via NotebookLM.", ["digest this book", "deep read", "summarize this podcast"], "Cliff-notes mode to replace reading or study-aid mode to accompany it; builds summaries, key lessons, and companion material.", "Claude Code · skills/deep-read"),
  skill("attia-qa", "Attia Q&A", "Vault & Knowledge", "Health and longevity Q&A grounded in Peter Attia's archive.", ["@attia", "ask Attia", "longevity question"], "Searches the local Attia corpus via qmd, synthesizes cited answers, and can cross-reference Oura, Hevy, and Sleepme data.", "Claude Code · skills/attia-qa"),
  skill("research", "Deep Research", "Vault & Knowledge", "Fan-out web research with adversarial verification and cited synthesis.", ["/research", "research this", "look this up across the web"], "Multi-source search, fetch, and claim verification into a cited report; agent-reach handles platform-specific digging (Reddit, XHS, LinkedIn, YouTube).", "Claude Code · deep-research + agent-reach"),
  skill("capture", "Capture & Route", "Vault & Knowledge", "Captures a thought, link, or file and files it to the right vault destination.", ["/capture", "capture this", "route this note"], "Classifies the input and files it into inbox, notes, or journal with frontmatter and backlinks.", "Slash command · /capture"),
  skill("wiki", "Wiki Rebuild · Log to Daily", "Vault & Knowledge", "Enriches thin vault articles and logs session activity to the daily note.", ["/wiki-rebuild", "log to daily", "enrich this note"], "Rebuilds under-developed articles and appends structured session logs to journal/daily for cross-session continuity.", "Claude Code · wiki-rebuild + log-to-daily"),

  // — Life Ops —
  skill("morning-briefing", "Morning Briefing", "Life Ops", "One conversational recap of calendar, weather, tasks, and agent activity.", ["/morning-briefing", "brief me", "today's briefing"], "Pulls the day's calendar, weather, to-dos, and overnight agent output into a single recap plus email.", "Slash command · /morning-briefing"),
  skill("session-lifecycle", "Session Lifecycle", "Life Ops", "/boot at the start, /wrap-up at the end of every working session.", ["/boot", "/wrap-up", "start or end a session"], "Boot reads hot.md, starts the Monitor, and checks the inbox; wrap-up updates hot.md, logs to daily, commits, and pushes.", "Slash commands · /boot · /wrap-up"),
  skill("check-inbox", "Check Inbox", "Life Ops", "Processes cross-device [cc:Mac] / [cc:Desktop] email commands.", ["/check-inbox", "process the inbox", "run cross-device commands"], "Reads AgentMail and Gmail, executes device-routed commands as fresh emails, and marks them cc-processed.", "Slash command · /check-inbox"),
  skill("apple-lists", "Apple Lists", "Life Ops", "To-dos and shopping — Apple Reminders is the source of truth.", ["add to my to-do list", "add to shopping", "what's on my list"], "Routes adds, removes, and reads through remindctl against the canonical Reminders and Shopping lists.", "Claude Code · skills/apple-lists"),
  skill("weekly-review", "Weekly Review", "Life Ops", "Synthesizes the week's journal, tasks, and agent output into a periodic review.", ["/weekly-review", "review my week", "weekly review"], "Reads the week's daily notes and outputs, then writes a periodic review into journal/periodic.", "Slash command · /weekly-review"),

  // — Finance —
  skill("cashflow", "Cashflow & Spending", "Finance", "Cash-flow, spending, and financial-summary reports.", ["/cashflow", "/spending-report", "/financial-summary"], "Malcolm- and Bogle-backed: pulls finance evidence and produces cash-flow and spending readouts grounded in Bogle household-CFO doctrine.", "Slash commands · Hermes Malcolm / Bogle"),

  // — Buying (Del Boy) —
  skill("del-boy", "Del Boy", "Buying", "Leigh's buying agent — best price, the better product behind an ad, and the daily deals sweep.", ["/del-boy", "find this cheaper", "is there something better", "run the deals"], "Derek Trotter's patter over verified research: optimizes for value, not cheapness, and won't pass Leigh a dodgy deal. The persona umbrella over the Buying skills below.", "Claude agent · ~/.claude/agents/del-boy.md"),
  skill("deal-sweep", "Deal Sweep", "Buying", "Daily substantial-deals sweep — big deals only (≥$50 and ≥25% off).", ["run the deals", "/deal-sweep", "what deals are on"], "Del Boy checks the wishlist, category scans, and cashback stacking on the live web, then emails the finds via am-send.", "Claude Code · skills/deal-sweep"),
  skill("better-price", "Better Price · Better Product", "Buying", "Finds a product cheaper, or a higher-quality alternative to an ad.", ["find this cheaper", "is this a good deal", "is there something better"], "Verifies the listing, then hunts a lower verified price or a genuinely better product behind the ad.", "Claude Code · better-price + better-product"),
  skill("car-scout", "Car Scout", "Buying", "Exactly five verified good-value used cars, ranked by quality for price.", ["find me a used car", "refresh the car shortlist", "best value used cars"], "Finds and ranks five cars optimizing quality-for-price, with every listing detail verified and delivered spreadsheet-ready.", "Hermes · automotive/good-value-used-cars"),

  // — Home & Health —
  skill("homeassistant", "Home Assistant", "Home & Health", "Controls smart-home devices — lights, climate, scenes, locks, media.", ["turn on the lights", "set the thermostat", "run a scene"], "REST control across Home Assistant entities throughout the house.", "Claude Code · skills/homeassistant"),
  skill("robovac", "Robovac", "Home & Health", "Runs the two Roborock vacuums.", ["vacuum downstairs", "start the Q Revo", "dock the vacuum"], "Starts, stops, and docks the Q Revo (upstairs) and Q7 M5 (downstairs) through Home Assistant.", "Claude Code · skills/robovac"),
  skill("hevy", "Hevy Workout Recall", "Home & Health", "Queries workout history and progressive-overload targets.", ["what did I lift last time", "what should I beat", "last workout"], "Reads Hevy history (weights in pounds) and returns the next-session targets to beat.", "Claude Code · skills/hevy-workout-recall"),
];

// Ambient capabilities baked into Codex/Claude that Leigh never calls by name.
// Demoted behind the "Built-in" pill so the library above stays his.
const builtinSkills: DirectoryItem[] = [
  skill("sites-build", "Sites Building", "Creative", "Builds websites, dashboards, portals, trackers, hubs, and internal tools.", ["Build a website", "Create a dashboard", "Edit a Sites project"], "Shapes, implements, previews, and validates a complete web product.", "Sites plugin", "builtin"),
  skill("sites-host", "Sites Hosting", "Creative", "Publishes and manages websites created through Sites.", ["Deploy this site", "Host the website", "Manage a Sites deployment"], "Packages the validated app and returns the hosted URL and deployment state.", "Sites plugin", "builtin"),
  skill("imagegen", "Image Generation", "Creative", "Creates or edits raster visuals when original imagery materially improves the work.", ["Generate an image", "Edit this image", "Create a raster mockup or asset"], "Produces purpose-built visual assets from text or image references.", "System skill", "builtin"),
  skill("visualize", "Visualize", "Creative", "Creates interactive explanations, simulators, maps, charts, and comparisons.", ["Show how this works", "Build a simulator", "Create an interactive chart"], "Turns relationships and adjustable scenarios into an explorable visual surface.", "Visualize plugin", "builtin"),
  skill("presentations", "Presentations", "Artifacts", "Creates and edits PowerPoint and Google Slides decks.", ["Create a deck", "Edit these slides", "Turn this brief into a presentation"], "Builds, renders, and verifies presentation artifacts.", "Primary runtime", "builtin"),
  skill("documents", "Documents", "Artifacts", "Creates, edits, redlines, and comments on Word documents.", ["Create a DOCX", "Redline this document", "Make a polished Word report"], "Uses a strict render-and-verify loop so the final pages are visually sound.", "Primary runtime", "builtin"),
  skill("pdf", "PDF", "Artifacts", "Reads, creates, inspects, renders, and verifies PDF files.", ["Read this PDF", "Create a PDF", "Inspect PDF layout"], "Combines extraction with page rendering when layout matters.", "Primary runtime", "builtin"),
  skill("spreadsheets", "Spreadsheets", "Artifacts", "Creates, edits, analyzes, and verifies spreadsheet files.", ["Build an XLSX", "Analyze this CSV", "Create a Google Sheets-ready workbook"], "Works with precise tables, formulas, formatting, and workbook validation.", "Primary runtime", "builtin"),
  skill("excel-live", "Excel Live Control", "Artifacts", "Controls an active Microsoft Excel workbook through a connected session.", ["Update the open Excel workbook", "Work in this live spreadsheet", "Use the Excel app"], "Operates the live workbook rather than producing a standalone file.", "Primary runtime", "builtin"),
  skill("template", "Template Creator", "Artifacts", "Turns an example Word, PowerPoint, or Excel artifact into a reusable personal template skill.", ["Create a template from this file", "Update my artifact template", "Make this format reusable"], "Extracts the visual and structural system into an installable template workflow.", "Primary runtime", "builtin"),
  skill("github", "GitHub", "Development", "Orients repository, issue, and pull-request work through the connected GitHub app.", ["Summarize this PR", "Triage an issue", "Get repository context"], "Finds the right GitHub surface and routes into more specific workflows when needed.", "GitHub plugin", "builtin"),
  skill("gh-comments", "Address PR Comments", "Development", "Inspects unresolved review feedback and implements selected fixes.", ["Address PR feedback", "Fix review comments", "Resolve requested changes"], "Reads thread-level review context, edits the code, and verifies the chosen changes.", "GitHub plugin", "builtin"),
  skill("gh-ci", "Fix GitHub CI", "Development", "Diagnoses and fixes failing GitHub Actions checks on pull requests.", ["Fix failing CI", "Debug GitHub Actions", "Repair PR checks"], "Inspects check metadata and logs before making a scoped implementation fix.", "GitHub plugin", "builtin"),
  skill("yeet", "Yeet", "Development", "Publishes local changes by committing intentionally, pushing, and opening a draft PR.", ["Ship these changes", "Push and open a PR", "Publish this branch"], "Confirms scope, creates a deliberate commit, pushes the branch, and opens a draft pull request.", "GitHub plugin", "builtin"),
  skill("openai-docs", "OpenAI Docs", "Development", "Answers current OpenAI product and API questions from official documentation.", ["How do I use the OpenAI API?", "Which current model fits this use case?", "How does Codex work?"], "Uses official OpenAI documentation and the Codex manual, with citations when browsing is needed.", "System skill", "builtin"),
  skill("skill-creator", "Skill Creator", "Development", "Designs new Codex skills or updates existing ones.", ["Create a skill", "Improve this SKILL.md", "Package a repeatable workflow"], "Defines strong triggers, progressive instructions, references, assets, and validation steps.", "System skill", "builtin"),
  skill("skill-installer", "Skill Installer", "Development", "Installs Codex skills from curated sources or GitHub repositories.", ["Install a skill", "List available skills", "Add this GitHub skill"], "Places verified skill packages into the local Codex skill directory.", "System skill", "builtin"),
  skill("plugin-creator", "Plugin Creator", "Development", "Scaffolds complete local Codex plugins and marketplace entries.", ["Create a Codex plugin", "Add a plugin structure", "Update a local plugin"], "Builds a valid manifest, optional skill and MCP structure, and development installation metadata.", "System skill", "builtin"),
  skill("browser", "In-app Browser", "Interface", "Controls visible browser pages and local web apps inside Codex.", ["Open this page", "Inspect the UI", "Interact with a local app"], "Selects the correct browser surface, navigates, inspects visible state, and performs scoped interactions.", "Browser plugin", "builtin"),
  skill("chrome", "Chrome Control", "Interface", "Controls Chrome when existing tabs, sign-in state, or extensions matter.", ["Use my Chrome", "Work in the signed-in tab", "Use an installed extension"], "Reuses the user's existing Chrome context without inspecting private session stores.", "Chrome plugin", "builtin"),
  skill("computer", "Computer Use", "Interface", "Controls Windows applications when structured tools are unavailable.", ["Use this Windows app", "Operate the desktop UI", "Complete an app workflow"], "Works from visible application state and keeps consequential actions scoped to the request.", "Computer Use plugin", "builtin"),
  skill("gmail", "Gmail", "Productivity", "Searches, summarizes, drafts, forwards, and organizes Gmail.", ["Find an email", "Summarize this thread", "Draft a reply", "Organize mail"], "Uses Gmail query syntax and connected message data, with confirmation before mailbox mutations.", "Gmail plugin", "builtin"),
  skill("gmail-triage", "Gmail Inbox Triage", "Productivity", "Ranks the inbox into urgent, reply-soon, waiting, and FYI buckets.", ["Triage my inbox", "What needs a reply?", "Separate important mail from noise"], "Builds an actionable mailbox brief from connected Gmail data.", "Gmail plugin", "builtin"),
  skill("calendar", "Google Calendar", "Productivity", "Manages scheduling, availability, conflicts, rooms, and event changes.", ["Check my calendar", "Find a time", "Reschedule this meeting"], "Reads calendar state, handles timezones, and drafts or performs exact changes with confirmation.", "Calendar plugin", "builtin"),
  skill("daily-brief", "Calendar Daily Brief", "Productivity", "Builds a polished one-day agenda with conflicts and free windows.", ["Brief me on today", "What's tomorrow look like?", "Give me a daily agenda"], "Turns one calendar day into a concise, decision-ready brief.", "Calendar plugin", "builtin"),
  skill("free-time", "Free Up Time", "Productivity", "Finds the smallest calendar changes that create meaningful focus time.", ["Clear up my day", "Find a focus block", "Make room in my calendar"], "Ranks low-disruption ways to recover an uninterrupted block.", "Calendar plugin", "builtin"),
  skill("group-schedule", "Group Scheduler", "Productivity", "Finds and ranks good meeting times across multiple attendees.", ["Schedule this group", "Compare everyone's availability", "Find the best compromise slot"], "Builds attendee-compatible options and can add a room check once narrowed.", "Calendar plugin", "builtin"),
  skill("meeting-prep", "Meeting Prep", "Productivity", "Creates practical prep briefs from calendar events and nearby context.", ["Prepare me for this meeting", "What should I read?", "Brief me on the attendees and context"], "Pulls the event, notes, attachments, and surrounding context into a focused preparation brief.", "Calendar plugin", "builtin"),
  skill("drive", "Google Drive", "Knowledge", "Finds, fetches, organizes, shares, exports, copies, and deletes Drive files.", ["Find a Drive file", "Organize these documents", "Export or share this file"], "Acts as the single entry point for connected Docs, Sheets, and Slides work.", "Drive plugin", "builtin"),
  skill("docs", "Google Docs", "Knowledge", "Creates and edits Google Docs while preserving templates and explicit structure.", ["Create a Google Doc", "Edit this document", "Fill this template"], "Maintains semantic roles, relationships, smart chips, links, and source-grounded structure.", "Drive plugin", "builtin"),
  skill("sheets", "Google Sheets", "Knowledge", "Analyzes and edits connected Google Sheets with range precision.", ["Inspect this sheet", "Repair formulas", "Clean or restructure a table"], "Uses targeted reads and exact cell-range updates for formulas, tables, summaries, and charts.", "Drive plugin", "builtin"),
  skill("slides", "Google Slides", "Knowledge", "Edits native Google Slides and derives a design system from a reference deck.", ["Update this Slides deck", "Follow this deck as a template", "Clean up these slides"], "Preserves the native deck and its visual system while making requested changes.", "Drive plugin", "builtin"),
  skill("comments", "Drive Comments", "Knowledge", "Writes, replies to, and resolves comments on Drive files.", ["Review this file with comments", "Reply to this comment", "Resolve comment threads"], "Anchors feedback in evidence-backed document, sheet, or slide context.", "Drive plugin", "builtin"),
  skill("notion-capture", "Notion Knowledge Capture", "Knowledge", "Turns conversations and decisions into structured Notion knowledge.", ["Capture this in Notion", "Turn these notes into a how-to", "Document this decision"], "Creates linked wiki entries, FAQs, decisions, and process notes from conversation context.", "Notion plugin", "builtin"),
  skill("notion-meeting", "Notion Meeting Intelligence", "Knowledge", "Prepares agendas and pre-reads using Notion context and research.", ["Prepare meeting materials", "Build a pre-read", "Tailor an agenda to attendees"], "Combines workspace context with supplemental research into practical meeting materials.", "Notion plugin", "builtin"),
  skill("notion-research", "Notion Research Documentation", "Knowledge", "Synthesizes multiple Notion sources into structured, cited documentation.", ["Research across Notion", "Create a brief from these pages", "Compare workspace sources"], "Finds evidence across the workspace and produces traceable briefs, comparisons, and reports.", "Notion plugin", "builtin"),
  skill("notion-spec", "Notion Spec to Implementation", "Knowledge", "Turns Notion PRDs and feature specs into implementation plans and tracked tasks.", ["Implement this Notion spec", "Create tasks from this PRD", "Track progress against this feature brief"], "Extracts requirements, plans the work, creates tasks, and maintains implementation progress.", "Notion plugin", "builtin"),
];

export const skills: DirectoryItem[] = [...fleetSkills, ...builtinSkills];

export const knowledge: DirectoryItem[] = [
  ["reference", "Reference Library", "THE DEEP SHELF", "Active", "Corpus", "3,153 markdown notes spanning health, history, philosophy, books, systems, and imported source material.", ["Reference", "Research", "Sources"], "3,153 notes", "The vault's dominant knowledge corpus and the raw material for retrieval, synthesis, and resurfacing."],
  ["people", "People", "RELATIONSHIP MEMORY", "Active", "Entities", "Structured notes for important people, context, relationships, and relevant history.", ["People", "Context", "Links"], "23 profiles", "A compact relationship layer designed to connect people with projects, events, and notes."],
  ["projects", "Projects", "ACTIVE WORK MEMORY", "Active", "Operations", "Project briefs, current state, architecture, next actions, and links to local repositories.", ["Projects", "Status", "Repos"], "14 project files", "The durable project memory behind the kanban board and agent briefings."],
  ["ideas", "Ideas Pipeline", "POSSIBILITY SPACE", "Active", "Thinking", "Captured product, automation, learning, lifestyle, gaming, and utility ideas waiting for promotion.", ["Ideas", "Backlog", "Exploration"], "14 ideas", "A low-friction holding area that keeps possibility visible without turning everything into an active commitment."],
  ["agents", "Agent Specs", "THE FLEET MANUAL", "Active", "Operations", "Authoritative roles, triggers, inputs, outputs, integrations, constraints, and relationships for the LifeOS agents.", ["Agents", "Specs", "LifeOS"], "6 vault specs", "The local, readable source of truth for what each agent does and where it is allowed to act."],
  ["maps", "Maps of Content", "NAVIGATION LAYER", "Active", "Navigation", "High-level maps for the vault, project landscape, email ecosystem, Notion structure, and local projects.", ["Maps", "Indexes", "Navigation"], "5 maps", "Curated entry points that make a large knowledge base understandable without knowing the exact search term."],
  ["research", "Research", "EVIDENCE & SYNTHESIS", "Active", "Thinking", "Focused research outputs, comparisons, deep dives, and sourced findings generated by Leigh and the agent system.", ["Research", "Sources", "Reports"], "6 collections", "The evidence layer for decisions, agent design, technical choices, and new projects."],
  ["reports", "Reports", "OPERATING INTELLIGENCE", "Active", "Operations", "System health, project landscape, recommendations, email intelligence, and overnight summaries.", ["Reports", "Health", "Summaries"], "6 reports", "Periodic snapshots that compress a broad workspace into state, risks, and recommended next moves."],
  ["daily", "Daily Notes", "CHRONOLOGICAL MEMORY", "Active", "Journal", "Daily activity, journal material, session continuity, and short-term operational context.", ["Daily", "Journal", "Continuity"], "10 notes", "The timeline layer that preserves what happened, what changed, and what should be carried forward."],
  ["templates", "Templates", "REPEATABLE STRUCTURE", "Ready", "System", "Reusable note, project, report, and capture structures that keep the vault consistent.", ["Templates", "Schema", "Consistency"], "6 templates", "A light schema layer that makes new knowledge easier to capture, query, and reuse."],
  ["local-mac", "Mac Local Context", "DEVICE-SPECIFIC MEMORY", "Active", "Devices", "MacBook-specific agent state, activity logs, handoffs, and private machine context kept out of the shared core.", ["Mac", "Local", "Continuity"], "10 notes", "A deliberately local partition for device-specific context that should sync selectively rather than merge blindly."],
  ["local-desktop", "Desktop Local Context", "DEVICE-SPECIFIC MEMORY", "Active", "Devices", "Alienware desktop state and machine-specific context for cross-device continuity.", ["Desktop", "Local", "Continuity"], "1 note", "The desktop counterpart to Mac local state, keeping machine details separate from shared knowledge."],
].map(([id, name, eyebrow, status, group, summary, tags, metric, detail]) => ({
  id: id as string, name: name as string, eyebrow: eyebrow as string, status: status as string, group: group as string, summary: summary as string, tags: tags as string[], metric: metric as string, detail: detail as string, color: group === "Corpus" ? "#ff6b4a" : group === "Entities" ? "#be8cff" : group === "Operations" ? "#d9ff67" : "#75bfff",
  sections: [section("What lives here", summary as string), section("How it connects", detail as string, "Wiki-links and frontmatter connect this area to the rest of the vault"), section("Source of truth", "Git-backed Obsidian vault (leigh-wiki repo)", "Mac: ~/Projects/vault · Alienware: C:\\Users\\leigh\\Projects\\vault")],
  source: `leigh-wiki · vault/${name}`,
}));
