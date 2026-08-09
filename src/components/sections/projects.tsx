import {
  CheckCircle2,
  Target,
  Lightbulb,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { SectionEyebrow } from "./about";
import s2p from "@/assets/images/proj-s2p.jpg";
import fastays from "@/assets/images/proj-fastays.jpg";
import psp from "@/assets/images/proj-psp.jpg";
import keemeds from "@/assets/images/proj-keemeds.jpg";

type Project = {
  name: string;
  tagline: string;
  role: string;
  status: "Completed" | "Currently Working On";
  image: string;
  imageWidth: number;
  imageHeight: number;
  description: string;
  tech: string[];
  challenge: string;
  solution: string;
  outcome: string;
};


const projects: Project[] = [
  {
    name: "KeeMeds",
    tagline: "Healthcare Commerce · ERPNext",
    role: "ERPNext developer & implementation lead",
    status: "Currently Working On",
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
  },
  {
    name: "Fastays",
    tagline: "Travel Booking Platform",
    role: "Backend engineer",
    status: "Completed",
    image: fastays,
    imageWidth: 1440,
    imageHeight: 592,
    description:
      "High-throughput booking backend handling flights and stays with event-driven order processing and inventory synchronization.",
    tech: ["Java", "Spring Boot", "Kafka", "MongoDB", "Redis"],
    challenge:
      "Booking traffic spiked 10× during promotions, causing double-bookings and confirmation delays on the legacy stack.",
    solution:
      "Decomposed the monolith into Spring Boot services with Kafka-backed order queues, Redis for hot inventory, and idempotent reservation flows.",
    outcome:
      "Sub-second confirmations at peak load with zero double-bookings during pilot promo weeks.",
  },
  {
    name: "Procurement Service Platform",
    tagline: "Reusable procurement microservices",
    role: "Architect & lead engineer",
    status: "Completed",
    image: psp,
    imageWidth: 1440,
    imageHeight: 616,
    description:
      "A shared procurement toolkit - supplier, catalog, RFQ, contract, and approval services - reused across enterprise client engagements.",
    tech: ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
    challenge:
      "Each new enterprise engagement rebuilt the same procurement primitives from scratch, blowing up timelines and cost.",
    solution:
      "Extracted the common domain into versioned microservices with clean APIs, shared auth, and a config-driven workflow engine.",
    outcome:
      "Cut new-client onboarding effort by ~50% and standardized procurement flows across engagements.",
  },
];

export function Projects() {
  return (
    <section id="projects" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between gap-6 flex-wrap">
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
        </div>

        <div className="mt-14 grid gap-6 lg:gap-8">
          {projects.map((p, i) => (
            <ProjectCard key={p.name} project={p} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({
  project: p,
  flip,
}: {
  project: Project;
  flip: boolean;
}) {
  const isCurrent = p.status === "Currently Working On";
  return (
    <article className="glass-strong rounded-3xl p-3 sm:p-4 overflow-hidden transition-colors group hover:bg-white/[0.06]">
      <div
        className={`grid lg:grid-cols-[1fr_1.05fr] gap-6 lg:gap-8 items-center ${
          flip ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        {/* Content (left by default, alternates right) */}
        <div className="p-3 sm:p-4 lg:p-6 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {p.name}
              </h3>
              <div className="text-cyan-accent text-sm mt-1">{p.tagline}</div>
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                isCurrent
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                  : "bg-white/10 text-white/85 border border-white/15"
              }`}
            >
              {isCurrent && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {p.status}
            </span>
          </div>

          <p className="mt-4 text-foreground/85 leading-relaxed">
            {p.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {p.tech.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.6875rem] text-foreground/85"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-5 text-xs text-muted-foreground">
            <span className="uppercase tracking-wider">Role · </span>
            <span className="text-foreground/80">{p.role}</span>
          </div>

          <div className="mt-5 grid gap-3">
            <Detail icon={Target} label="Challenge" text={p.challenge} />
            <Detail icon={Lightbulb} label="Solution" text={p.solution} />
            <Detail
              icon={isCurrent ? CheckCircle2 : TrendingUp}
              label={isCurrent ? "Progress" : "Outcome"}
              text={p.outcome}
              highlight
            />
          </div>
        </div>

        {/* Screenshot — full screenshot always visible, never cropped */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 aspect-[16/10] lg:aspect-[7/3]">
          <img
            src={p.image}
            alt={`${p.name} — ${p.tagline} screenshot`}
            width={p.imageWidth}
            height={p.imageHeight}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </article>
  );
}

function Detail({
  icon: Icon,
  label,
  text,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          highlight
            ? "bg-gradient-to-br from-cyan-accent/25 to-blue-accent/25 text-cyan-accent"
            : "bg-white/5 text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-sm">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-foreground/90 mt-0.5">{text}</div>
      </div>
    </div>
  );
}
