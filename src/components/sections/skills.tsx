import {
  Server,
  Boxes,
  Layout,
  Cloud,
  GitBranch,
  Bot,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { SectionEyebrow } from "./about";
import { Reveal } from "../effects/hero-interactions";
import { usePauseAnimations } from "../effects/use-pause-animations";
import { Keycap } from "./Keycap";
import { SkillEvidence } from "./SkillEvidence";
import { StackRing } from "./StackRing";
import { matchesQuery, usageFor } from "./skill-usage";

const capabilities = [
  {
    icon: Server,
    title: "Backend & Systems",
    blurb:
      "Production-ready services, APIs, and event-driven systems designed for reliability and scale.",
    items: [
      "Python",
      "Java",
      "Spring Boot",
      "FastAPI",
      "Kafka",
      "REST APIs",
      "Node.js",
      "TypeScript (backend)",
      "API Gateway",
      "RBAC",
    ],
  },
  {
    icon: Layout,
    title: "Frontend Engineering",
    blurb:
      "Scalable, responsive interfaces built with modern component-driven web architecture.",
    items: ["React", "TypeScript", "Tailwind", "Vite", "HTML", "CSS"],
  },
  {
    icon: Bot,
    title: "AI & Automation",
    blurb:
      "AI-powered workflows, retrieval systems, and agent-based integrations for enterprise applications.",
    items: [
      "AI / LLM",
      "AI Agents",
      "MCP",
      "RAG Workflows",
      "Vector Search",
      "LLM Integration",
      "AI Chatbot",
      "Azure OpenAI",
    ],
  },
  {
    icon: Boxes,
    title: "Enterprise & ERP",
    blurb:
      "Enterprise workflows, ERP platforms, integrations, and business process automation.",
    items: [
      "ERPNext",
      "Frappe",
      "SAP BTP",
      "SAP HANA Cloud",
      "SAP SuccessFactors",
      "Enterprise Integration",
    ],
  },
  {
    icon: GitBranch,
    title: "DevOps & Delivery",
    blurb:
      "Containerized deployments, version control, CI/CD, and production delivery workflows.",
    items: ["Docker", "Git", "CI/CD", "Microservices", "Agile / Scrum", "Jira"],
  },
  {
    icon: Cloud,
    title: "Cloud & Data",
    blurb:
      "Cloud infrastructure, databases, and data services supporting production applications.",
    items: ["AWS", "MongoDB", "PostgreSQL (RLS)", "MySQL"],
  },
];

const CLOSE_DELAY = 150;
const EVIDENCE_ID = "skill-evidence-popup";
const HOVER_INTENT_MS = 250;
const FILTER_DEBOUNCE_MS = 80;
const COARSE = "(pointer: coarse)";

const SKILL_COUNT = capabilities.reduce((n, g) => n + g.items.length, 0);
/** Every skill label of the Skills data; the Tech Stack adds a "+" block only if it is here. */
const SKILL_LABELS = capabilities.flatMap((g) => g.items);

type Evidence = { skill: string; el: HTMLButtonElement; pinned: boolean; keyboard: boolean; sheet: boolean };

export function Skills() {
  const techBlockRef = usePauseAnimations<HTMLDivElement>();
  // ── Keycaps: "Used in" evidence card (one open at a time) ──────────────
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const intentTimer = useRef<number | null>(null);
  const evidenceCloseTimer = useRef<number | null>(null);
  const evidenceKeyRef = useRef<HTMLButtonElement | null>(null);

  const clearEvidenceTimers = useCallback(() => {
    if (intentTimer.current != null) window.clearTimeout(intentTimer.current);
    if (evidenceCloseTimer.current != null) window.clearTimeout(evidenceCloseTimer.current);
    intentTimer.current = null;
    evidenceCloseTimer.current = null;
  }, []);

  const closeEvidence = useCallback(() => {
    clearEvidenceTimers();
    setEvidence(null);
  }, [clearEvidenceTimers]);

  // Hovering a key for 250ms opens its card (fine pointers only).
  const onKeyHover = useCallback(
    (skill: string, el: HTMLButtonElement) => {
      clearEvidenceTimers();
      intentTimer.current = window.setTimeout(() => {
        evidenceKeyRef.current = el;
        setEvidence((prev) =>
          prev?.pinned ? prev : { skill, el, pinned: false, keyboard: false, sheet: false },
        );
      }, HOVER_INTENT_MS);
    },
    [clearEvidenceTimers],
  );

  const onKeyHoverEnd = useCallback(() => {
    if (intentTimer.current != null) window.clearTimeout(intentTimer.current);
    intentTimer.current = null;
    setEvidence((prev) => {
      if (!prev || prev.pinned) return prev;
      if (evidenceCloseTimer.current == null) {
        evidenceCloseTimer.current = window.setTimeout(() => {
          evidenceCloseTimer.current = null;
          setEvidence((p) => (p && !p.pinned ? null : p));
        }, CLOSE_DELAY);
      }
      return prev;
    });
  }, []);

  // Click / Enter / Space pins the card; the same key again closes it.
  const onKeyPress = useCallback(
    (skill: string, el: HTMLButtonElement, keyboard: boolean) => {
      clearEvidenceTimers();
      evidenceKeyRef.current = el;
      setEvidence((prev) =>
        prev?.skill === skill && prev.pinned
          ? null
          : { skill, el, pinned: true, keyboard, sheet: window.matchMedia(COARSE).matches },
      );
    },
    [clearEvidenceTimers],
  );

  // Tap / click outside the keys or the card closes it.
  useEffect(() => {
    if (!evidence) return;
    const onPointerDown = (e: Event) => {
      const t = e.target;
      if (t instanceof Element && t.closest("[data-skill], [data-skill-evidence]")) return;
      closeEvidence();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [evidence, closeEvidence]);

  // Esc closes and returns focus to the key.
  useEffect(() => {
    if (!evidence) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      closeEvidence();
      evidenceKeyRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [evidence, closeEvidence]);

  useEffect(() => clearEvidenceTimers, [clearEvidenceTimers]);

  // ── Type-to-filter (opacity only, debounced) ───────────────────────────
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const filterId = useId();
  useEffect(() => {
    const id = window.setTimeout(() => setFilter(query), FILTER_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);
  const onQueryKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && query) {
      e.stopPropagation();
      setQuery("");
    }
  };
  const matchCount = filter
    ? capabilities.reduce((n, g) => n + g.items.filter((it) => matchesQuery(it, filter)).length, 0)
    : SKILL_COUNT;

  return (
    <section id="skills" className="relative py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <SectionEyebrow>Technical Skills</SectionEyebrow>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
            Engineering capabilities, built for production.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            The systems, platforms, and engineering practices I work across.
          </p>
        </Reveal>

        {/* Type-to-filter: dims non-matching keys, never moves anything */}
        <Reveal className="mt-10 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <input
              id={filterId}
              type="search"
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyDown={onQueryKey}
              placeholder="Search skills…"
              aria-label="Search skills"
              autoComplete="off"
              className="kb-search w-full rounded-xl border border-slate-900/10 bg-slate-900/[0.04] py-2.5 pr-9 pl-4 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-cyan-accent/50 focus:bg-slate-900/[0.06] dark:border-white/10 dark:bg-white/[0.03] dark:focus:bg-white/[0.05]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
          <p aria-live="polite" className="font-mono text-xs text-muted-foreground">
            {matchCount} skills match
          </p>
        </Reveal>

        <Reveal className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((g) => {
            const hits = filter ? g.items.filter((it) => matchesQuery(it, filter)).length : g.items.length;
            return (
              <article
                key={g.title}
                data-dim={hits === 0 ? "" : undefined}
                className="skill-card kb-panel glass-strong rounded-2xl p-6"
              >
                <div className="skill-card__icon flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
                  <g.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{g.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {g.blurb}
                </p>
                <div className="kb-plate mt-4 flex flex-wrap gap-2 rounded-xl p-2.5">
                  {g.items.map((it) => (
                    <Keycap
                      key={it}
                      label={it}
                      dim={filter !== "" && !matchesQuery(it, filter)}
                      expanded={evidence?.skill === it}
                      pressed={evidence?.skill === it && evidence.pinned}
                      controls={EVIDENCE_ID}
                      onHover={onKeyHover}
                      onHoverEnd={onKeyHoverEnd}
                      onPress={onKeyPress}
                    />
                  ))}
                </div>
              </article>
            );
          })}
        </Reveal>
      </div>

      {evidence && (
        <SkillEvidence
          skill={evidence.skill}
          rows={usageFor(evidence.skill)}
          anchorEl={evidence.el}
          popupId={EVIDENCE_ID}
          sheet={evidence.sheet}
          autoFocus={evidence.keyboard}
          onClose={closeEvidence}
          onEnter={clearEvidenceTimers}
          onLeave={() => {
            if (!evidence.pinned) onKeyHoverEnd();
          }}
        />
      )}

      {/* Tech Stack — Engineering Tech Constellation */}
      <div
        id="tech"
        ref={techBlockRef}
        className="mx-auto max-w-7xl px-4 mt-24 lg:mt-32"
      >
        <Reveal>
          <SectionEyebrow>Tech Stack</SectionEyebrow>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
            The stack behind the work.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            The languages, frameworks, and platforms I work in day to day.
          </p>
        </Reveal>

        <div className="mt-12">
          <StackRing skillLabels={SKILL_LABELS} />
        </div>
      </div>

    </section>
  );
}
