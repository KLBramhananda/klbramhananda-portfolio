import workspace from "@/assets/images/workspace.jpg";
import { motion } from "framer-motion";
import {
  Boxes,
  Bot,
  Cloud,
  Compass,
  FolderGit2,
  Layout, 
  ListChecks,
  MapPin,
  Server,
  Webhook,
  type LucideIcon,
} from "lucide-react";

const focusAreas = [
  {
    icon: Layout,
    label: "Full Stack Engineering",
    desc: "React.js, JavaScript, Python, FastAPI, Java, Spring Boot",
  },
  {
    icon: Boxes,
    label: "Enterprise Applications",
    desc: "Microservices, Kafka, event-driven systems, AWS",
  },
  {
    icon: Bot,
    label: "AI & LLM Integrations",
    desc: "AI-powered application features and LLM integrations",
  },
  {
    icon: Server,
    label: "ERPNext / Frappe",
    desc: "ERPNext, enterprise business workflows",
  },
  {
    icon: Cloud,
    label: "SAP BTP",
    desc: "SAP Build Apps, HANA Cloud, BAS, Intigration Suite, Joule",
  },
  {
    icon: Webhook,
    label: "API & Integration Engineering",
    desc: "REST APIs, MongoDB, MySQL, CI/CD, Git/GitHub",
  },
];

type ExperienceProject = {
  name: string;
  note?: string;
  current?: boolean;
};

type Experience = {
  role: string;
  company: string;
  period: string;
  location?: string;
  focus: string[];
  projects: ExperienceProject[];
  responsibilities: string[];
};

const experience: Experience[] = [
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
        current: true,
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
      "Designed a modular LLM integration architecture supporting local AI models through Ollama and enabling future integration with OpenAI, Claude, and Gemini providers."
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
      "Assisted in developing AI-assisted candidate matching and recruitment workflow features to improve hiring efficiency."
    ],
  },
];

const reveal = {
  initial: { opacity: 0, y: 19 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-56px" },
} as const;

export function About() {
  return (
    <section id="about" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionEyebrow>About</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          Engineering enterprise software with clarity, speed, and depth.
        </h2>

        <div className="mt-14 grid lg:grid-cols-[0.82fr_1fr] gap-10 lg:gap-14">
          <div className="relative flex flex-col">
            {/* Faint engineering network behind the image card */}
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full hidden lg:block text-cyan-accent"
              viewBox="0 0 400 700"
              preserveAspectRatio="none"
              fill="none"
            >
              <g
                stroke="currentColor"
                strokeOpacity="0.13"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              >
                <line x1="200" y1="210" x2="90" y2="120" />
                <line x1="200" y1="210" x2="310" y2="90" />
                <line x1="200" y1="210" x2="320" y2="330" />
                <line x1="200" y1="210" x2="80" y2="330" />
                <line x1="200" y1="210" x2="200" y2="470" />
                <line x1="200" y1="210" x2="120" y2="560" />
                <line x1="200" y1="210" x2="290" y2="540" />
                <g className="stroke-foreground/10 dark:stroke-white/10">
                  <line x1="90" y1="120" x2="310" y2="90" />
                  <line x1="80" y1="330" x2="320" y2="330" />
                  <line x1="120" y1="560" x2="290" y2="540" />
                </g>
              </g>
              <g fill="currentColor" fillOpacity="0.4">
                <circle cx="200" cy="210" r="3" />
                <circle cx="90" cy="120" r="2" />
                <circle cx="310" cy="90" r="2" />
                <circle cx="320" cy="330" r="2" />
                <circle cx="80" cy="330" r="2" />
                <circle cx="200" cy="470" r="2" />
                <circle cx="120" cy="560" r="2" />
                <circle cx="290" cy="540" r="2" />
              </g>
            </svg>

            {/* Faint technical annotations */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden lg:block font-mono text-[0.625rem] uppercase tracking-[0.2em]"
            >
              <span className="absolute left-[22%] top-[56%] text-cyan-accent/70 dark:text-cyan-accent/40">
                REST APIs
              </span>
              <span className="absolute left-[52%] top-[70%] text-cyan-accent/60 dark:text-cyan-accent/35">
                WORKFLOWS
              </span>
              <span className="absolute left-[14%] top-[84%] text-cyan-accent/55 dark:text-cyan-accent/30">
                AI / LLM
              </span>
            </div>

            {/* Image card */}
            <motion.div
              initial={{ opacity: 0, y: 19 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-56px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="glass-strong rounded-3xl p-3 glow-cyan">
                {/* 3/2 frame matches the source photo, no cropping */}
                <div className="relative aspect-[3/2] overflow-hidden rounded-2xl">
                  <img
                    src={workspace}
                    alt="Bramhananda K L's engineering workspace"
                    width={750}
                    height={500}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                </div>
              </div>
            </motion.div>

            {/* Focus indicator pinned to the bottom of the column */}
            <div className="relative mt-auto hidden lg:flex items-center gap-3 glass-strong rounded-2xl px-5 py-4 w-full">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
                <Compass className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Engineering focus</div>
                <div className="text-sm font-semibold text-foreground">
                  Full Stack · ERP · AI · SAP BTP
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 19 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-56px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Professional summary
              </h3>
              <p className="mt-3 text-lg leading-relaxed text-foreground/90">
                Full Stack Software Engineer focused on building scalable
                enterprise applications across frontend, backend, AI
                integrations, ERPNext, and SAP BTP. I work end-to-end across
                application development, APIs, integrations, business
                workflows, and production systems.
              </p>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Engineering focus
              </h3>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {focusAreas.map((f, index) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-32px" }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.04 * index,
                    }}
                    className="glass rounded-2xl p-4 flex items-start gap-3 transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{f.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {f.desc}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Engineering approach
              </h3>
              <p className="mt-3 text-foreground/85 leading-relaxed">
                End-to-end development with emphasis on scalable architecture,
                clean integrations, reliable business workflows and
                production-ready software.
              </p>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Current work
              </h3>
              <p className="mt-3 text-foreground/85 leading-relaxed">
                Currently working on KeeMeds, an ERPNext-based healthcare
                commerce and enterprise platform.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Experience timeline */}
      <div id="experience" className="mx-auto max-w-7xl px-4 mt-24 lg:mt-32">
        <SectionEyebrow>Experience</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          Experience that shaped how I build.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          The roles, projects, and responsibilities behind my engineering -
          from business automation to enterprise platforms.
        </p>

        <div className="relative mt-14">
          {/* One continuous vertical line. Desktop: centered on the dedicated
              dot column (which sits at 50% of a 1fr/2rem/1fr grid).
              Mobile: fixed at left-4. */}
          <div
            aria-hidden
            className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-900/15 to-transparent lg:left-1/2 lg:-translate-x-1/2 dark:via-white/15"
          />

          <ol className="relative space-y-10 lg:space-y-12">
            {experience.map((e, i) => {
              const cardLeft = i % 2 === 0;
              return (
                <li
                  key={e.role}
                  className="relative lg:grid lg:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] lg:gap-8 lg:items-start"
                >
                  {/* Card (alternates left / right) */}
                  <motion.div
                    {...reveal}
                    transition={{
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.12,
                    }}
                    className={`relative pl-12 lg:pl-0 lg:row-start-1 ${
                      cardLeft
                        ? "lg:col-start-1"
                        : "lg:col-start-3"
                    }`}
                  >
                    {/* Mobile: dot pinned to the left line */}
                    <span
                      aria-hidden
                      className="absolute left-4 top-[1.625rem] -translate-x-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-cyan-accent to-blue-accent shadow-[0_0_20px_rgba(6,182,212,0.55)] ring-4 ring-background/60 lg:hidden"
                    />
                    <div className="lg:hidden mb-3 text-xs font-medium text-muted-foreground">
                      {e.period}
                    </div>

                    <article className="glass-strong rounded-3xl p-6 transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {e.role}
                        </h3>
                        <div className="text-sm text-cyan-accent">{e.company}</div>
                        {e.location && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {e.location}
                          </div>
                        )}
                      </div>

                      <Row icon={Compass} title="Engineering focus">
                        <div className="flex flex-wrap gap-1.5">
                          {e.focus.map((f) => (
                            <span
                              key={f}
                              className="rounded-full border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1 text-[0.6875rem] text-foreground/80 dark:border-white/10 dark:bg-white/[0.03]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </Row>

                      <Row icon={FolderGit2} title="Projects">
                        <div className="flex flex-wrap gap-1.5">
                          {e.projects.map((p) =>
                            p.current ? (
                              <span
                                key={p.name}
                                title={p.note}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Currently building · {p.name}
                              </span>
                            ) : (
                              <span
                                key={p.name}
                                title={p.note}
                                className="rounded-full border border-slate-900/10 bg-slate-900/[0.04] px-3 py-1 text-xs text-foreground/85 dark:border-white/10 dark:bg-white/[0.03]"
                              >
                                {p.name}
                              </span>
                            ),
                          )}
                        </div>
                      </Row>

                      <Row icon={ListChecks} title="Key responsibilities">
                        <ul className="space-y-1.5 text-sm text-foreground/85">
                          {e.responsibilities.map((r) => (
                            <li key={r} className="flex gap-2 items-start">
                              <span className="mt-[0.4375rem] h-1 w-1 shrink-0 rounded-full bg-cyan-accent/70" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </Row>
                    </article>
                  </motion.div>

                  {/* Desktop: dot column (centered in the middle 2rem column) */}
                  <div className="hidden lg:flex lg:row-start-1 lg:col-start-2 justify-center">
                    <motion.span
                      initial={{ scale: 0.3, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, margin: "-56px" }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 18,
                      }}
                      aria-hidden
                      className="mt-[1.875rem] flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-cyan-accent to-blue-accent shadow-[0_0_20px_rgba(6,182,212,0.55)] ring-4 ring-background/60"
                    />
                  </div>

                  {/* Desktop: date on the opposite side of the card */}
                  <motion.div
                    {...reveal}
                    transition={{
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.2,
                    }}
                    className={`hidden lg:block lg:row-start-1 lg:pt-[1.875rem] text-sm font-medium text-muted-foreground ${
                      cardLeft
                        ? "lg:col-start-3 lg:text-left"
                        : "lg:col-start-1 lg:text-right"
                    }`}
                  >
                    {e.period}
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex gap-2 items-start">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900/5 text-cyan-accent dark:bg-white/5">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 11 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs uppercase tracking-widest text-foreground/85 dark:text-muted-foreground"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent" />
      {children}
    </motion.div>
  );
}
