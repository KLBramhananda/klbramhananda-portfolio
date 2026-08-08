import {
  Server,
  Boxes,
  Layout,
  Cloud,
  GitBranch,
  Bot,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { skills } from "@/data/skills";
import { SectionEyebrow } from "./about";
import { SkillInsight } from "./skill-insight";
import { TechConstellation } from "./tech-constellation";

const capabilities = [
  {
    icon: Server,
    title: "Backend & Systems",
    blurb: "Event-driven services and APIs built to stay reliable under load.",
    items: ["Python", "Java", "Spring Boot", "FastAPI", "Kafka", "REST APIs"],
  },
  {
    icon: Layout,
    title: "Frontend Engineering",
    blurb: "Clean, responsive interfaces on modern React stacks.",
    items: ["React", "TypeScript", "Tailwind", "Vite", "HTML", "CSS"],
  },
  {
    icon: Bot,
    title: "AI & Automation",
    blurb: "LLMs and retrieval woven into real enterprise workflows.",
    items: ["AI/LLM", "AI Agents", "MCP", "RAG workflows", "Vector search"],
  },
  {
    icon: Boxes,
    title: "Enterprise & ERP",
    blurb: "End-to-end ERPNext, Frappe, and SAP BTP implementations.",
    items: ["ERPNext", "Frappe", "SAP BTP", "SAP HANA", "Enterprise Integration"],
  },
  {
    icon: GitBranch,
    title: "DevOps & Delivery",
    blurb: "Repeatable pipelines and infrastructure for product teams.",
    items: ["Docker", "Git", "CI/CD", "Microservices"],
  },
  {
    icon: Cloud,
    title: "Cloud & Data",
    blurb: "Managed data stores and cloud services in production.",
    items: ["AWS", "MongoDB", "PostgreSQL", "MySQL", "SAP BTP"],
  },
];

const CLOSE_DELAY = 150;
const POPUP_ID = "skill-insight-popup";

export function Skills() {
  const [active, setActive] = useState<{ key: string; el: HTMLElement } | null>(
    null,
  );
  const [pinned, setPinned] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const lastElRef = useRef<HTMLElement | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearCloseTimer();
    setActive(null);
    setPinned(false);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(close, CLOSE_DELAY);
  }, [clearCloseTimer, close]);

  // Hover / focus opens. Does not change pin state.
  const handleOpen = useCallback(
    (key: string, el: HTMLElement) => {
      clearCloseTimer();
      lastElRef.current = el;
      // Only update when the skill actually changes — moving within the same
      // pill fires repeated mouseover events and would otherwise re-render.
      setActive((prev) => (prev?.key === key ? prev : { key, el }));
    },
    [clearCloseTimer],
  );

  // Leaving a pill closes after a short delay — unless pinned.
  const handleLeave = useCallback(() => {
    if (!pinned) scheduleClose();
  }, [pinned, scheduleClose]);

  // Click pins the card. Clicking the same pinned pill unpins it.
  const handleClick = useCallback(
    (key: string, el: HTMLElement) => {
      clearCloseTimer();
      lastElRef.current = el;
      if (active?.key === key && pinned) {
        setActive(null);
        setPinned(false);
      } else {
        setActive({ key, el });
        setPinned(true);
      }
    },
    [active, pinned, clearCloseTimer],
  );

  // Click / tap outside the pills or the card closes it.
  useEffect(() => {
    if (!active) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-skill], [data-skill-insight]")) return;
      close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [active, close]);

  // Escape closes and returns focus to the last focused pill.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        lastElRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, close]);

  const activeSkill = active ? skills[active.key] : null;
  const relatedKeys = activeSkill
    ? new Set(activeSkill.related.filter((k) => skills[k]))
    : null;

  return (
    <section id="skills" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionEyebrow>Technical Skills</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          Capabilities, grouped by what they ship.
        </h2>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((g) => (
            <article
              key={g.title}
              className="glass-strong rounded-2xl p-6 transition-colors hover:bg-white/[0.07]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
                <g.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{g.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {g.blurb}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <span
                    key={it}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-foreground/90"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Tech Stack — Engineering Tech Constellation */}
      <div id="tech" className="mx-auto max-w-7xl px-4 mt-24 lg:mt-32">
        <SectionEyebrow>Tech Stack</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          The stack behind the work.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          The languages, frameworks, and platforms I work in day to day.
        </p>

        <div className="mt-12">
          <TechConstellation
            activeKey={active?.key ?? null}
            relatedKeys={relatedKeys}
            popupId={POPUP_ID}
            onOpen={handleOpen}
            onLeave={handleLeave}
            onClick={handleClick}
          />
        </div>
      </div>

      {activeSkill && active && (
        <SkillInsight
          skill={activeSkill}
          anchorEl={active.el}
          open
          popupId={POPUP_ID}
          onPopupEnter={clearCloseTimer}
          onPopupLeave={() => {
            if (!pinned) scheduleClose();
          }}
          onClose={close}
        />
      )}
    </section>
  );
}
