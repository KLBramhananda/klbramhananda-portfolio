import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Compass, FolderGit2, ListChecks, type LucideIcon } from "lucide-react";
import { usePointerTilt } from "../effects/use-pointer-tilt";
import { Reveal } from "../effects/hero-interactions";
import { onScrollFrame } from "../layout/use-nav-scroll";
import { landingY, lockSpy, projectCardId } from "@/lib/sections";
import { SectionEyebrow } from "./about";
import { GitTimeline, type TimelineNode } from "./GitTimeline";
import { RolePanel } from "./RolePanel";

type ExperienceProject = {
  name: string;
  note?: string;
};

type RoleData = {
  role: string;
  company: string;
  period: string;
  location?: string;
  focus: string[];
  projects: ExperienceProject[];
  responsibilities: string[];
};

export type ExperienceRole = RoleData & {
  /** Short fake commit hash, derived deterministically from the title. */
  hash: string;
  slug: string;
  head: boolean;
};

const roles: RoleData[] = [
  {
    role: "Software Engineer",
    company: "HG Infotech",
    period: "Feb 2025 - Present",
    location: "Bengaluru South, India",
    focus: [
      "Full Stack Engineering",
      "ERPNext",
      "AI",
      "SAP BTP",
      "Enterprise Applications",
    ],
    projects: [
      {
        name: "KeeMeds",
        note: "ERPNext-based Healthcare Commerce & Enterprise Platform",
      },
      {
        name: "S2P Matrix",
        note: "AI-Powered Source-to-Pay Procurement Platform",
      },
      {
        name: "Fastays",
        note: "B2C Travel Booking Platform",
      },
    ],
    responsibilities: [
      "Build scalable full-stack applications using React, JavaScript, Python, FastAPI, Java, Spring Boot and REST APIs.",
      "Develop enterprise workflows, integrations, backend services and data-driven applications.",
      "Work across ERPNext, SAP BTP, AI integrations, cloud platforms and enterprise systems.",
      "Design, integrate, test, debug and support production software systems.",
      "Integrated Third-Party APIs for real-time availability of flights, hotels, tours, and bus services.",
      "Implemented API Gateway to enhance inter-service communication, security, and performance.",
      "Designed a modular LLM integration architecture supporting local AI models through Ollama and enabling future integration with OpenAI, Claude, and Gemini providers.",
    ],
  },
  {
    role: "Junior Software Engineer",
    company: "HG Infotech",
    period: "Aug 2024 - Jan 2025",
    focus: [
      "Full Stack Engineering",
      "Java",
      "Spring Boot",
      "Business Automation",
      "AI",
    ],
    projects: [{ name: "Procurement Service Platform" }],
    responsibilities: [
      "Contributed to full-stack enterprise applications using Java, Spring Boot, MongoDB and JavaScript.",
      "Developed internal business workflows for Sales, HR and Finance operations.",
      "Contributed to process automation and AI-assisted business workflows.",
      "Reduced manual coordination efforts by 35% through process automation.",
      "Assisted in developing AI-assisted candidate matching and recruitment workflow features to improve hiring efficiency.",
    ],
  },
];

// FNV-1a: the same title always gives the same 7-hex "commit".
function commitHash(title: string) {
  let h = 0x811c9dc5;
  for (const c of title) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

const EXPERIENCE: ExperienceRole[] = roles.map((r, i) => ({
  ...r,
  hash: commitHash(r.role),
  slug: r.role.toLowerCase().replace(/\s+/g, "-"),
  head: i === 0,
}));

// Projects that have a card in the Projects section (name must match it).
const LINKED_PROJECTS = new Set(["KeeMeds", "S2P Matrix", "Fastays", "Procurement Service Platform"]);
const SHOWN_RESPONSIBILITIES = 3;

function Row({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-2 first:mt-0">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900/5 text-cyan-accent dark:bg-white/5">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 text-xs tracking-wider text-muted-foreground uppercase">{title}</div>
        {children}
      </div>
    </div>
  );
}

const chipClass =
  "rounded-full border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1 text-[0.6875rem] text-foreground/80 transition-colors dark:border-white/10 dark:bg-white/[0.03] [@media(hover:hover)]:hover:border-cyan-accent/40 [@media(hover:hover)]:hover:bg-cyan-accent/10 [@media(hover:hover)]:hover:text-foreground";

/** A project chip: a link to its card in Projects when it has one. */
function ProjectChip({ project }: { project: ExperienceProject }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  if (!LINKED_PROJECTS.has(project.name)) {
    return (
      <span title={project.note} className={chipClass}>
        {project.name}
      </span>
    );
  }

  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks keep the browser's behaviour (open `/projects` in a new tab).
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const card = document.getElementById(projectCardId(project.name));
    if (!card) return;
    lockSpy(1500, false, "projects");
    const onProjects = window.location.pathname === "/projects";
    const go = onProjects
      ? Promise.resolve()
      : router.navigate({ to: "/$section", params: { section: "projects" }, resetScroll: false });
    void go.finally(() => {
      window.scrollTo({
        top: Math.max(0, card.getBoundingClientRect().top + window.scrollY - landingY()),
        behavior: reduced ? "auto" : "smooth",
      });
      card.classList.remove("project-targeted");
      void card.offsetWidth; // restart the highlight if it is already running
      card.classList.add("project-targeted");
      window.setTimeout(() => card.classList.remove("project-targeted"), 1400);
    });
  };

  return (
    <a
      href="/projects"
      onClick={open}
      title={project.note}
      aria-label={`${project.name} — view project`}
      className={`${chipClass} inline-block border-cyan-accent/25`}
    >
      {project.name}
    </a>
  );
}

/** Wrap numbers that are already in the text (e.g. "35%") in a glowing badge. */
function withImpact(text: string): ReactNode[] {
  return text.split(/(\d+(?:\.\d+)?%?)/).map((part, i) =>
    i % 2 === 1 ? (
      <span
        key={i}
        className="rounded-md bg-cyan-accent/15 px-1.5 py-0.5 text-[0.9em] font-semibold text-cyan-accent shadow-[0_0_10px_-2px_color-mix(in_oklab,var(--cyan-accent)_70%,transparent)]"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function Responsibilities({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const head = items.slice(0, SHOWN_RESPONSIBILITIES);
  const rest = items.slice(SHOWN_RESPONSIBILITIES);
  const item = (r: string) => (
    <li key={r} className="flex items-start gap-2">
      <span className="mt-[0.4375rem] h-1 w-1 shrink-0 rounded-full bg-cyan-accent/70" />
      <span>{withImpact(r)}</span>
    </li>
  );
  return (
    <>
      <ul className="space-y-1.5 text-sm text-foreground/85">{head.map(item)}</ul>
      {rest.length > 0 && (
        <>
          {/* grid-template-rows 0fr -> 1fr: smooth expand without measuring heights */}
          <div
            id={id}
            inert={!open}
            className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <ul className="space-y-1.5 pt-1.5 text-sm text-foreground/85">{rest.map(item)}</ul>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((v) => !v)}
            className="mt-3 rounded-md font-mono text-xs text-cyan-accent transition-colors hover:text-cyan-accent/80"
          >
            {open ? "Show less" : `Show all (${items.length})`}
          </button>
        </>
      )}
    </>
  );
}

/** Role details: focus, projects, responsibilities. Tilts and glows on fine pointers. */
function DetailsCard({ role }: { role: ExperienceRole }) {
  const [ref, style] = usePointerTilt<HTMLDivElement>(4, { local: true });
  return (
    <motion.div ref={ref} style={style} className="glass-strong relative rounded-3xl p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_160px_at_var(--gx,50%)_var(--gy,50%),var(--cyan-accent),transparent)] p-px opacity-[var(--glare,0)] transition-opacity duration-300 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor]"
      />
      <Row icon={Compass} title="Engineering focus">
        <div className="flex flex-wrap gap-1.5">
          {role.focus.map((f) => (
            <span key={f} className={chipClass}>
              {f}
            </span>
          ))}
        </div>
      </Row>
      <Row icon={FolderGit2} title="Projects">
        <div className="flex flex-wrap gap-1.5">
          {role.projects.map((p) => (
            <ProjectChip key={p.name} project={p} />
          ))}
        </div>
      </Row>
      <Row icon={ListChecks} title="Key responsibilities">
        <Responsibilities items={role.responsibilities} />
      </Row>
    </motion.div>
  );
}

interface Layout {
  height: number;
  width: number;
  rem: number;
  ys: number[];
}

function ExperienceTimeline() {
  const reduced = useReducedMotion() ?? false;
  const wrapRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const articleRefs = useRef<(HTMLElement | null)[]>([]);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [active, setActive] = useState(0);

  // Measure where each role starts (re-measured on resize / expand / collapse).
  useEffect(() => {
    const wrap = wrapRef.current;
    const spine = spineRef.current;
    if (!wrap || !spine) return;
    const measure = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const top = wrap.getBoundingClientRect().top;
      const ys = articleRefs.current.map((a) => (a ? a.getBoundingClientRect().top - top + rem * 1.6 : 0));
      setLayout({ height: wrap.offsetHeight, width: spine.offsetWidth, rem, ys });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // The line draws as you scroll: ONE variable, from the shared scroll loop.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (reduced) {
      wrap.style.setProperty("--tp", "1");
      return;
    }
    const update = () => {
      const r = wrap.getBoundingClientRect();
      const p = (window.innerHeight * 0.6 - r.top) / r.height;
      wrap.style.setProperty("--tp", String(Math.min(1, Math.max(0, p))));
    };
    update();
    const off = onScrollFrame(update);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      off();
      window.removeEventListener("resize", update);
    };
  }, [reduced]);

  // The role whose details sit in the middle of the viewport drives the panel.
  useEffect(() => {
    const els = articleRefs.current.filter((a): a is HTMLElement => a !== null);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.role));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const nodes: TimelineNode[] = EXPERIENCE.map((r, i) => ({
    hash: r.hash,
    slug: r.slug,
    head: r.head,
    y: layout?.ys[i] ?? 0,
    projects: r.projects.map((p) => p.name),
  }));

  return (
    <div
      ref={wrapRef}
      className="relative mt-14 [--gutter:2.25rem] md:[--gutter:9rem] lg:[--gutter:12rem]"
      style={{ "--tp": reduced ? 1 : 0, "--len": `${layout?.height ?? 0}px` } as CSSProperties}
    >
      <div ref={spineRef} aria-hidden className="pointer-events-none absolute top-0 left-0 h-full w-[var(--gutter)]" />
      {layout && (
        <GitTimeline nodes={nodes} height={layout.height} width={layout.width} rem={layout.rem} reduced={reduced} />
      )}

      <div className="pl-[var(--gutter)] lg:grid lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-8">
        {/* Desktop: sticky panel, one stacked panel per role, the active one shown */}
        <div className="hidden lg:block">
          <div className="sticky top-[5.75rem] max-h-[calc(100svh-4.25rem-48px)]">
            <div className="grid">
              {EXPERIENCE.map((r, i) => (
                <div
                  key={r.hash}
                  aria-hidden={i !== active}
                  className={`col-start-1 row-start-1 transition-[opacity,transform] duration-[250ms] ease-out motion-reduce:transition-none ${
                    i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
                  }`}
                >
                  <RolePanel role={r} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <ol className="space-y-12 lg:space-y-16">
          {EXPERIENCE.map((r, i) => (
            <li
              key={r.hash}
              ref={(el) => {
                articleRefs.current[i] = el;
              }}
              data-role={i}
            >
              <RolePanel role={r} className="mb-4 lg:hidden" />
              <DetailsCard role={r} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function Experience() {
  return (
    <section id="experience" className="relative py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <SectionEyebrow>Experience</SectionEyebrow>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
            Experience that shaped how I build.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            The roles, projects, and responsibilities behind my engineering -
            from business automation to enterprise platforms.
          </p>
        </Reveal>

        <ExperienceTimeline />
      </div>
    </section>
  );
}
