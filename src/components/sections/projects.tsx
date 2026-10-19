import { CheckCircle2, Target, Lightbulb, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { usePointerTilt } from "../effects/use-pointer-tilt";
import { SectionEyebrow } from "./about";
import s2p from "@/assets/images/proj-s2p.jpg";
import fastays from "@/assets/images/proj-fastays.jpg";
import psp from "@/assets/images/proj-psp.jpg";
import { Reveal } from "../effects/hero-interactions";
import { projectCardId } from "@/lib/sections";
import keemeds from "@/assets/images/proj-keemeds.png";
import tenxta from "@/assets/images/10xTA-PGC.png";
import { Users } from "lucide-react";
import type { CSSProperties } from "react";
import { ProjectStack } from "./ProjectStack";
import { BrowserFrame } from "./BrowserFrame";
import { CaseStudySteps } from "./CaseStudySteps";
import { Diagram, diagrams } from "./diagram";

type Project = {
  name: string;
  tagline: string;
  role: string;
  /** Badge; none when omitted. */
  status?: "Completed" | "Currently Working On";
  /** Third case-study step reads "Progress" instead of "Outcome". */
  progress?: boolean;
  image: string;
  /** Overrides the `alt` built from name + tagline. */
  alt?: string;
  imageWidth: number;
  imageHeight: number;
  description: string;
  tech: string[];
  challenge: string;
  solution: string;
  outcome: string;
  /** Headline metric, built only from numbers/phrases in this project's own text. */
  metric?: string;
  /** Title of the matching diagram in the Architecture section, if one exists. */
  architecture?: string;
  /** A diagram of this project's own, rendered on the frame's back. */
  diagram?: DiagramData;
};

type DiagramData = Parameters<typeof Diagram>[0] extends infer P
  ? Omit<P, "phase" | "compact">
  : never;

/** 10xTA system flow (not part of the Architecture section). */
const TENXTA_DIAGRAM: DiagramData = {
  icon: Users,
  title: "10xTA System Flow",
  subtitle: "Node.js · TypeScript · PostgreSQL RLS",
  nodes: [
    "Recruiter · Hiring Manager · Admin (RBAC)",
    "API Gateway",
    "Jobs · Candidates · Applications · Interviews · Scheduling",
    "PostgreSQL (RLS · tenant-aware)",
  ],
  aside: { label: "AI Interview Scheduler", note: "AI · human-led · hybrid" },
};

// eslint-disable-next-line react-refresh/only-export-components -- data read by Skills (skill-usage)
export const projects: Project[] = [
  {
    name: "10xTA",
    tagline: "Talent Acquisition · B2B Multi-Tenant SaaS",
    role: "Recruiter module lead · Backend engineer",
    status: "Currently Working On",
    progress: true,
    image: tenxta,
    imageWidth: 1852,
    imageHeight: 847,
    alt: "10xTA talent acquisition platform screenshot",
    description:
      "AI-powered talent acquisition platform — recruiter workflows, AI-driven interview scheduling, and secure multi-tenant data isolation.",
    tech: [
      "Node.js",
      "TypeScript",
      "PostgreSQL",
      "Microservices",
      "API Gateway",
      "RBAC",
      "SAP HANA Cloud",
    ],
    challenge:
      "Recruiters, hiring managers, and admins across multiple client companies need one platform — with strict client data isolation and flexible AI, human-led, and hybrid interviews.",
    solution:
      "Node.js + TypeScript microservices behind an API Gateway, PostgreSQL Row-Level Security with tenant-aware authorization, and an AI-powered interview scheduling system with RBAC.",
    outcome:
      "Leading the Recruiter module — 400+ product features analysed against Figma, codebase, APIs, and Jira to drive the roadmap.",
    metric: "400+ features analysed · Multi-tenant RLS",
    diagram: TENXTA_DIAGRAM,
  },
  {
    name: "Fastays",
    tagline: "Travel Booking Platform",
    role: "Backend & frontend engineer",
    status: "Completed",
    image: fastays,
    imageWidth: 1440,
    imageHeight: 592,
    description:
      "B2C travel booking platform for flights, hotels, tours, and buses — real-time availability, booking, and payments.",
    tech: ["Java", "Spring Boot", "MongoDB", "Kafka", "React", "API Gateway"],
    challenge:
      "Real-time availability and bookings across flights, hotels, tours, and buses from multiple third-party providers.",
    solution:
      "Spring Boot microservices behind an API Gateway, Kafka event-driven communication, and low-latency REST APIs for booking and payments.",
    outcome:
      "A scalable, fault-tolerant booking backend plus 5+ responsive React frontend modules.",
    metric: "Event-driven · 5+ frontend modules",
    architecture: "Microservices Architecture",
  },
  {
    name: "Procurement Service Platform",
    tagline: "Reusable procurement microservices",
    role: "Junior software engineer",
    status: "Completed",
    image: psp,
    imageWidth: 1440,
    imageHeight: 616,
    description:
      "A shared procurement toolkit - supplier, catalog, RFQ, contract, and approval services - reused across enterprise client engagements.",
    tech: ["Java", "Spring Boot", "MongoDB", "JavaScript", "HTML", "CSS"],
    challenge:
      "Procurement workflows across Sales, HR, and Finance relied on manual coordination.",
    solution:
      "Full-stack internal modules on Java, Spring Boot, and MongoDB to streamline procurement workflows, plus AI-assisted candidate matching features.",
    outcome:
      "Reduced manual coordination efforts by 35% through process automation.",
    metric: "35% less manual coordination",
    // No diagram in the Architecture section matches this project.
  },
  {
    name: "S2P Matrix",
    tagline: "Enterprise Procurement Platform",
    role: "Full stack & platform engineer",
    status: "Completed",
    image: s2p,
    imageWidth: 1440,
    imageHeight: 634,
    description:
      "Source-to-Pay platform unifying supplier discovery, RFQ automation, contract management, and payment reconciliation for enterprise buyers.",
    tech: [
      "Python",
      "FastAPI",
      "React",
      "SAP BTP",
      "SAP HANA",
      "AI/LLM",
      "PostgreSQL",
    ],
    challenge:
      "Enterprises ran procurement across scattered spreadsheets, SAP modules, and email - no unified view, slow RFQ cycles, weak supplier scoring.",
    solution:
      "Built a multi-tenant FastAPI backend with a React operator console, SAP BTP integration for SAP HANA master data, and LLM-assisted supplier matching and RFQ scoring.",
    outcome:
      "Cut RFQ turnaround from days to hours and gave buyers a single source of truth across procurement.",
    // From the outcome: "Cut RFQ turnaround from days to hours"
    metric: "Days → Hours",
    architecture: "Procurement Lifecycle",
  },
  {
    name: "KeeMeds",
    tagline: "Healthcare Commerce · ERPNext",
    role: "ERPNext developer & implementation lead",
    progress: true,
    image: keemeds,
    imageWidth: 1440,
    imageHeight: 619,
    description:
      "End-to-end ERPNext + Frappe implementation for a healthcare commerce platform - catalog, orders, compliance, and fulfillment.",
    tech: ["ERPNext", "Frappe", "Python", "MariaDB", "Docker"],
    challenge:
      "Healthcare commerce needs strict compliance, controlled catalogs, and reliable fulfillment - off-the-shelf ERP alone won't cover it.",
    solution:
      "Modeling domain-specific inventory and compliance workflows on ERPNext and shipping custom Frappe apps for supplier onboarding and payments.",
    outcome:
      "Laying the ERP backbone for a compliant, scalable healthcare commerce launch.",
    // No numeric outcome yet, so no headline metric.
    architecture: "ERP System Flow",
  },
];

export function Projects() {
  return (
    <section id="projects" className="relative py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <SectionEyebrow>Featured Projects</SectionEyebrow>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
              Enterprise systems, from architecture to production.
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            A selection of the platforms I've architected, built, and shipped -
            spanning procurement, travel, and healthcare.
          </p>
        </Reveal>

        {/* Not wrapped in <Reveal>: the cards are sticky and must keep the
            section grid as their containing block from the first frame. */}
        <ProjectStack names={projects.map((p) => p.name)}>
          {projects.map((p, i) => (
            <ProjectCard
              key={p.name}
              project={p}
              index={i}
              flip={i % 2 === 1}
            />
          ))}
        </ProjectStack>
      </div>
    </section>
  );
}

function ProjectCard({
  project: p,
  index,
  flip,
}: {
  project: Project;
  index: number;
  flip: boolean;
}) {
  const isCurrent = p.status === "Currently Working On";
  const diagram =
    p.diagram ??
    (p.architecture
      ? diagrams.find((d) => d.title === p.architecture)
      : undefined);
  // Fine-pointer tilt (±3°) and a cursor-following border glow via --gx/--gy
  // (aliased to --mx/--my in CSS). The sticky <article> carries the stack
  // transform; the inner card carries the tilt, so the two never fight.
  const [tiltRef, tiltStyle] = usePointerTilt<HTMLDivElement>(3, {
    local: true,
  });
  return (
    <article
      id={projectCardId(p.name)}
      data-stack-index={index}
      style={{ "--i": index } as CSSProperties}
      className="pstack-card rounded-3xl"
    >
      <motion.div
        ref={tiltRef}
        style={tiltStyle}
        className="pcard glass-strong relative isolate rounded-3xl p-3 sm:p-4 overflow-hidden transition-colors group hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
      >
        <span aria-hidden className="pcard-glow" />
        <div
          className={`grid gap-5 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:items-center ${
            flip ? "" : "lg:[&>*:first-child]:order-2"
          }`}
        >
          {/* Browser frame — first in DOM (tablet/mobile order), right column on desktop unless flipped */}
          <BrowserFrame
            name={p.name}
            src={p.image}
            alt={p.alt ?? `${p.name} — ${p.tagline} screenshot`}
            width={p.imageWidth}
            height={p.imageHeight}
            eager={index === 0}
            back={
              diagram ? <Diagram {...diagram} phase={0} compact /> : undefined
            }
          />

          {/* Content: title block, headline metric, case-study steps, chips */}
          <div className="p-2 sm:p-3 lg:p-5 flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {p.name}
                </h3>
                <div className="text-cyan-accent text-sm mt-1">{p.tagline}</div>
              </div>
              {p.status && (
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    isCurrent
                      ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 dark:text-emerald-300"
                      : "bg-slate-900/10 text-slate-900/85 border border-slate-900/15 dark:bg-white/10 dark:text-white/85 dark:border-white/15"
                  }`}
                >
                  {isCurrent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                  )}
                  {p.status}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
              {p.description}
            </p>

            <div className="mt-2 text-xs text-muted-foreground">
              <span className="uppercase tracking-wider">Role · </span>
              <span className="text-foreground/80">{p.role}</span>
            </div>

            {p.metric && (
              <div className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight text-gradient">
                {p.metric}
              </div>
            )}

            <CaseStudySteps
              steps={[
                { icon: Target, label: "Challenge", text: p.challenge },
                { icon: Lightbulb, label: "Solution", text: p.solution },
                {
                  icon: p.progress ? CheckCircle2 : TrendingUp,
                  label: p.progress ? "Progress" : "Outcome",
                  text: p.outcome,
                },
              ]}
            />

            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1 text-[0.6875rem] text-foreground/85 transition-colors dark:border-white/10 dark:bg-white/[0.03] [@media(hover:hover)]:group-hover:border-cyan-accent/30 [@media(hover:hover)]:group-hover:bg-cyan-accent/10 [@media(hover:hover)]:group-hover:text-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </article>
  );
}
