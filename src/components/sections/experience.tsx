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

/** A project worked on within a role: its own focus chips and résumé bullets. */
type ProjectGroup = {
  project: ExperienceProject;
  title?: string;
  period?: string;
  current?: boolean;
  focus: string[];
  bullets: string[];
};

type RoleData = {
  role: string;
  company: string;
  period: string;
  location?: string;
  workMode?: string;
  /** Newest first. */
  groups: ProjectGroup[];
  /** Items not in the résumé, kept verbatim in a collapsed group. */
  other?: { title: string; focus: string[]; projects: ExperienceProject[]; bullets: string[] };
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
    period: "Feb 2025 – Present",
    location: "Bengaluru South, India",
    workMode: "On-site",
    groups: [
      {
        project: { name: "10xTA", note: "AI-Powered Talent Acquisition Platform (B2B Multi-Tenant SaaS)" },
        title: "AI-Powered Talent Acquisition Platform (B2B Multi-Tenant SaaS)",
        period: "Apr 2026 – Present",
        current: true,
        focus: [
          "Node.js",
          "TypeScript",
          "PostgreSQL (RLS)",
          "Microservices",
          "API Gateway",
          "RBAC",
          "AI Interview Scheduling",
          "SAP HANA Cloud",
          "SAP SuccessFactors",
          "Agile/Scrum",
        ],
        bullets: [
          "Leading the Recruiter module, owning technical planning, Jira task breakdown, dependencies, and delivery coordination across engineering and product teams.",
          "Developing an AI-powered interview scheduling system supporting AI-conducted, human-led, and hybrid interviews, with scheduling, rescheduling, cancellation, and RBAC-based permissions for recruiters, hiring managers, and administrators.",
          "Building scalable RESTful APIs using Node.js and TypeScript for recruiter workflows including jobs, candidates, applications, interviews, and scheduling, following microservices architecture and API Gateway patterns.",
          "Implementing secure multi-tenant PostgreSQL architecture using Row-Level Security (RLS) and tenant-aware authorization to enforce client data isolation and secure access across recruiter and candidate workflows.",
          "Analysing 400+ product features by comparing Figma designs with the existing codebase, APIs, database models, and Jira requirements to identify implementation gaps, technical risks, dependencies, and roadmap priorities.",
          "Participating in SAP HANA Cloud and SAP SuccessFactors migration, environment configuration management.",
          "Collaborating with product owners, architects, designers and QA in an Agile/Scrum environment, taking part in Jira story refinement and sprint delivery.",
        ],
      },
      {
        project: { name: "Fastays", note: "B2C Travel Booking Platform (Flights, Hotels, Tours, Buses)" },
        title: "B2C Travel Booking Platform (Flights, Hotels, Tours, Buses)",
        period: "Feb 2025 – Mar 2026",
        focus: ["Java", "Spring Boot", "MongoDB", "React", "Kafka", "API Gateway", "REST APIs"],
        bullets: [
          "Designed & developed scalable backend microservices using Java, Spring Boot, MongoDB, and Microservices.",
          "Developed 5+ responsive and dynamic frontend modules using React, JavaScript, and API integration.",
          "Designed REST APIs with low latency and high throughput for real-time booking and payment systems.",
          "Implemented API Gateway to enhance inter-service communication, security, and performance.",
          "Implemented event-driven communication using Apache Kafka, improving system scalability, reliability, and fault tolerance.",
          "Integrated Third-Party APIs for real-time availability of flights, hotels, tours, and bus services.",
        ],
      },
    ],
    other: {
      title: "Other work at HG Infotech",
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
      ],
      bullets: [
        "Build scalable full-stack applications using React, JavaScript, Python, FastAPI, Java, Spring Boot and REST APIs.",
        "Develop enterprise workflows, integrations, backend services and data-driven applications.",
        "Work across ERPNext, SAP BTP, AI integrations, cloud platforms and enterprise systems.",
        "Design, integrate, test, debug and support production software systems.",
        "Designed a modular LLM integration architecture supporting local AI models through Ollama and enabling future integration with OpenAI, Claude, and Gemini providers.",
      ],
    },
  },
  {
    role: "Junior Software Engineer",
    company: "HG Infotech",
    period: "Aug 2024 - Jan 2025",
    groups: [
      {
        project: { name: "Procurement Service Platform" },
        focus: ["Java", "Spring Boot", "MongoDB", "JavaScript", "HTML/CSS", "Process Automation", "AI"],
        bullets: [
          "Contributed to full-stack application development using Java, Spring Boot, MongoDB, JavaScript, HTML, and CSS.",
          "Built internal modules to streamline procurement workflows across Sales, HR, and Finance teams.",
          "Reduced manual coordination efforts by 35% through process automation.",
          "Assisted in developing AI-assisted candidate matching and recruitment workflow features to improve hiring efficiency.",
        ],
      },
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
const LINKED_PROJECTS = new Set(["10xTA", "KeeMeds", "S2P Matrix", "Fastays", "Procurement Service Platform"]);
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

/** Wrap numbers that are already in the text (e.g. "35%", "400+") in a glowing badge. */
function withImpact(text: string): ReactNode[] {
  return text.split(/(\d+(?:\.\d+)?(?:%|\+)?)/).map((part, i) =>
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

/** grid-template-rows 0fr -> 1fr: smooth expand without measuring heights. */
function Collapse({ id, open, children }: { id: string; open: boolean; children: ReactNode }) {
  return (
    <div
      id={id}
      inert={!open}
      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

const toggleClass = "mt-3 rounded-md font-mono text-xs text-cyan-accent transition-colors hover:text-cyan-accent/80";

function Bullet({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-[0.4375rem] h-1 w-1 shrink-0 rounded-full bg-cyan-accent/70" />
      <span>{withImpact(text)}</span>
    </li>
  );
}

function Responsibilities({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const head = items.slice(0, SHOWN_RESPONSIBILITIES);
  const rest = items.slice(SHOWN_RESPONSIBILITIES);
  return (
    <>
      <ul className="space-y-1.5 text-sm text-foreground/85">
        {head.map((r) => (
          <Bullet key={r} text={r} />
        ))}
      </ul>
      {rest.length > 0 && (
        <>
          <Collapse id={id} open={open}>
            <ul className="space-y-1.5 pt-1.5 text-sm text-foreground/85">
              {rest.map((r) => (
                <Bullet key={r} text={r} />
              ))}
            </ul>
          </Collapse>
          <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)} className={toggleClass}>
            {open ? "Show less" : `Show all (${items.length})`}
          </button>
        </>
      )}
    </>
  );
}

/** One project worked on within the role: chip, title, dates, focus and bullets. */
function ProjectGroupBlock({ group }: { group: ProjectGroup }) {
  return (
    <div className="mt-6 border-t border-slate-900/10 pt-5 first:mt-0 first:border-t-0 first:pt-0 dark:border-white/10">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900/5 text-cyan-accent dark:bg-white/5">
          <FolderGit2 className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <ProjectChip project={group.project} />
            {group.current && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2 py-0.5 text-[0.625rem] font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                Current
              </span>
            )}
          </div>
          {group.title && <div className="mt-1.5 text-sm text-foreground/85">{group.title}</div>}
          {group.period && <div className="mt-0.5 font-mono text-xs text-muted-foreground">{group.period}</div>}
        </div>
      </div>
      <Row icon={Compass} title="Engineering focus">
        <div className="flex flex-wrap gap-1.5">
          {group.focus.map((f) => (
            <span key={f} className={chipClass}>
              {f}
            </span>
          ))}
        </div>
      </Row>
      <Row icon={ListChecks} title="Key responsibilities">
        <Responsibilities items={group.bullets} />
      </Row>
    </div>
  );
}

/** Items not in the résumé, collapsed by default. Nothing is lost. */
function OtherWork({ other }: { other: NonNullable<RoleData["other"]> }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mt-6 border-t border-slate-900/10 pt-4 dark:border-white/10">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md text-left text-xs tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        <span
          className={`font-mono text-cyan-accent transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
          aria-hidden
        >
          ›
        </span>
        {other.title}
        <span className="ml-auto font-mono text-[0.6875rem] normal-case tracking-normal text-cyan-accent">
          {open ? "Show less" : `Show all (${other.focus.length + other.projects.length + other.bullets.length})`}
        </span>
      </button>
      <Collapse id={id} open={open}>
        <div className="pt-4">
          <Row icon={Compass} title="Engineering focus">
            <div className="flex flex-wrap gap-1.5">
              {other.focus.map((f) => (
                <span key={f} className={chipClass}>
                  {f}
                </span>
              ))}
            </div>
          </Row>
          <Row icon={FolderGit2} title="Projects">
            <div className="flex flex-wrap gap-1.5">
              {other.projects.map((p) => (
                <ProjectChip key={p.name} project={p} />
              ))}
            </div>
          </Row>
          <Row icon={ListChecks} title="Role responsibilities">
            <ul className="space-y-1.5 text-sm text-foreground/85">
              {other.bullets.map((r) => (
                <Bullet key={r} text={r} />
              ))}
            </ul>
          </Row>
        </div>
      </Collapse>
    </div>
  );
}

/** Role details: one block per project, then the collapsed non-résumé work. Tilts and glows on fine pointers. */
function DetailsCard({ role }: { role: ExperienceRole }) {
  const [ref, style] = usePointerTilt<HTMLDivElement>(4, { local: true });
  return (
    <motion.div ref={ref} style={style} className="glass-strong relative rounded-3xl p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_160px_at_var(--gx,50%)_var(--gy,50%),var(--cyan-accent),transparent)] p-px opacity-[var(--glare,0)] transition-opacity duration-300 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor]"
      />
      <div>
        {role.groups.map((g) => (
          <ProjectGroupBlock key={g.project.name} group={g} />
        ))}
      </div>
      {role.other && <OtherWork other={role.other} />}
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
    branches: r.groups.map((g) => ({
      label: g.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      period: g.period,
      open: g.current ?? false,
    })),
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
