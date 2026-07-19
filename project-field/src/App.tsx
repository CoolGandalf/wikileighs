import { useEffect, useState } from "react";
import { ProjectsPage } from "./ProjectsPage";
import { DirectoryPage } from "./DirectoryPage";
import { agents, knowledge, skills, tools } from "./directory-data";

type Route = "projects" | "agents" | "tools" | "skills" | "knowledge";

function currentRoute(): Route {
  const value = window.location.hash.replace(/^#\/?/, "") || "projects";
  return (["agents", "tools", "skills", "knowledge"].includes(value) ? value : "projects") as Route;
}

export function App() {
  const [route, setRoute] = useState<Route>(currentRoute);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(currentRoute());
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route === "agents") return <DirectoryPage key="agents" active="agents" kicker="THE HERMES / CLAUDE CABINET · LIVE MAC AUDIT" title="Agent roster" accent="#ff6b4a" description="Seven core cabinet agents, one live on-demand specialist, personal agents, and the historical LifeOS patterns they replaced or absorbed." items={agents} statLabel="agents documented" note="Reconciled against the live MacBook Hermes gateway, profiles, topics, cron jobs, and Emrys registry" />;
  if (route === "tools") return <DirectoryPage key="tools" active="tools" kicker="THE CAPABILITY LAYER · CONNECTED + LOCAL" title="Tool chest" accent="#75bfff" description="Every surface the system can work through, what it is best for, and the boundaries that keep it safe." items={tools} statLabel="tools mapped" note="Connected services and local execution surfaces" />;
  if (route === "skills") return <DirectoryPage key="skills" active="skills" kicker="THE METHOD LAYER · LEIGH'S FLEET" title="Skill library" accent="#be8cff" description="The skills Leigh actually invokes—his live Hermes cabinet and Claude Code playbooks—organized by the work they do. Ambient Codex/Claude built-ins are tucked into the Built-in pill so they stay out of the way." items={skills} statLabel="fleet skills" note="Leigh's invoked Hermes / Claude skills up top · ambient built-ins behind the Built-in filter" />;
  if (route === "knowledge") return <DirectoryPage key="knowledge" active="knowledge" kicker="THE MEMORY LAYER · OBSIDIAN VAULT" title="Knowledge base" accent="#d9ff67" description="A map of the local second brain: deep reference, active work, people, ideas, reports, and device-specific continuity." items={knowledge} statLabel="knowledge regions" note="Local Markdown knowledge across the active Git-backed vault" />;
  return <ProjectsPage />;
}
