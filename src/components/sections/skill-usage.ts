import { EXPERIENCE } from "./experience";
import { projects } from "./projects";
import { projectCardId } from "@/lib/sections";

/**
 * "Used in" evidence for the Skills keycaps, built once at module load from
 * the Experience and Projects data (imported read-only, never copied).
 *
 * A skill is "used in" a project when its tech chips or card text mention it,
 * or when the Experience sub-group for that project does. Text that belongs
 * to a role but to no project card (the "Other work" group) counts for the
 * role. Nothing is invented: a skill with no match gets no rows.
 */
export type UsageRow = {
  kind: "project" | "role";
  name: string;
  /** Project subtitle or role company/period. */
  context: string;
  /** Project card DOM id, or the role's index in the Experience list. */
  target: string;
};

/** Other spellings the data uses for a skill label (matched case-insensitively). */
const ALIASES: Record<string, string[]> = {
  "Spring Boot": ["SpringBoot"],
  "PostgreSQL (RLS)": ["PostgreSQL", "Postgres", "Row-Level Security"],
  React: ["React.js", "ReactJS"],
  "Node.js": ["Node", "NodeJS"],
  "TypeScript (backend)": ["TypeScript"],
  "REST APIs": ["REST API", "RESTful APIs", "RESTful"],
  "AI / LLM": ["AI", "LLM"],
  "LLM Integration": ["LLM"],
  "AI Chatbot": ["Chatbot"],
  "AI Agents": ["Agents", "agent-based"],
  "SAP HANA Cloud": ["SAP HANA"],
  "Agile / Scrum": ["Agile", "Scrum", "Agile/Scrum"],
  "CI/CD": ["CI/CD Pipeline"],
  Git: ["GitHub"],
  HTML: ["HTML/CSS"],
  CSS: ["HTML/CSS"],
  Kafka: ["Apache Kafka"],
  Tailwind: ["Tailwind CSS"],
};

/** The label plus its aliases: what the filter and the matcher look for. */
export function aliasesOf(label: string) {
  return [label, ...(ALIASES[label] ?? [])];
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** Whole-term, case-insensitive: "Java" never matches "JavaScript". */
function mentions(haystack: string, label: string) {
  return aliasesOf(label).some((a) =>
    new RegExp(`(^|[^a-z0-9])${escapeRe(a.toLowerCase())}(?![a-z0-9])`).test(haystack),
  );
}

type Source = { row: UsageRow; text: string };

function buildSources(): Source[] {
  const byProject = new Map<string, Source>();
  for (const p of projects) {
    byProject.set(p.name, {
      row: { kind: "project", name: p.name, context: p.tagline, target: projectCardId(p.name) },
      text: [p.tagline, p.description, p.challenge, p.solution, p.outcome, ...p.tech].join(" | ").toLowerCase(),
    });
  }
  const roles: Source[] = [];
  EXPERIENCE.forEach((r, i) => {
    const roleParts: string[] = [];
    for (const g of r.groups) {
      const text = [g.title ?? "", ...g.focus, ...g.bullets].join(" | ").toLowerCase();
      const project = byProject.get(g.project.name);
      if (project) project.text += " | " + text;
      else roleParts.push(text);
    }
    if (r.other) roleParts.push([...r.other.focus, ...r.other.bullets].join(" | ").toLowerCase());
    if (roleParts.length) {
      roles.push({
        row: { kind: "role", name: r.role, context: `${r.company} · ${r.period}`, target: String(i) },
        text: roleParts.join(" | "),
      });
    }
  });
  return [...byProject.values(), ...roles];
}

const SOURCES = buildSources();
const cache = new Map<string, UsageRow[]>();

/** Every project / role whose text mentions the skill, projects first. */
export function usageFor(label: string): UsageRow[] {
  let rows = cache.get(label);
  if (!rows) {
    rows = SOURCES.filter((s) => mentions(s.text, label)).map((s) => s.row);
    cache.set(label, rows);
  }
  return rows;
}

/** Type-to-filter match on the label or any alias (case-insensitive). */
export function matchesQuery(label: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return aliasesOf(label).some((a) => a.toLowerCase().includes(q));
}
