import workspace from "@/assets/images/workspace.jpg";
import { motion } from "framer-motion";
import {
  Boxes,
  Bot,
  Compass,
  FolderGit2,
  Layout,
  ListChecks,
  MapPin,
  Server,
  type LucideIcon,
} from "lucide-react";

const interests = [
  { icon: Layout, label: "Frontend", desc: "React, TypeScript, Tailwind" },
  { icon: Server, label: "Backend", desc: "Python, Frappe, REST APIs, ERPNext" },
  { icon: Bot, label: "AI", desc: "Agents, automation, MCP, LLM systems" },
  { icon: Boxes, label: "Enterprise", desc: "ERPNext, SAP BTP, integration" },
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
    period: "Feb 2025 — Present",
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
    ],
  },
  {
    role: "Junior Software Engineer",
    company: "HG Infotech",
    period: "Aug 2024 — Jan 2025",
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
    ],
  },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
} as const;

export function About() {
  return (
    <section id="about" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionEyebrow>About</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          Engineering enterprise software with clarity, speed, and depth.
        </h2>

        <div className="mt-14 grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-start">
          <div className="relative">
            <div className="glass-strong rounded-3xl p-3">
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
            <div className="absolute -bottom-6 -right-6 glass-strong rounded-2xl px-5 py-4 hidden lg:block">
              <div className="text-xs text-muted-foreground">Focus</div>
              <div className="text-base font-semibold">Full Stack · ERP · AI · BTP</div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Professional summary
              </h3>
              <p className="mt-3 text-lg leading-relaxed text-foreground/90">
                I'm a full-stack software engineer focused on building
                enterprise systems that actually ship — ERP implementations,
                AI-powered procurement platforms, SAP BTP integrations, and
                services that scale. I work end-to-end across frontend,
                backend, product, architecture, and delivery.
              </p>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Mission
              </h3>
              <p className="mt-3 text-foreground/85 leading-relaxed">
                Turn complex business processes into calm, reliable software
                — the kind operators trust every day.
              </p>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Engineering philosophy
              </h3>
              <p className="mt-3 text-foreground/85 leading-relaxed">
                Clear domain models, sharp interfaces, honest observability.
                Ship small, measure real impact, iterate with the users who
                depend on it.
              </p>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Capabilities
              </h3>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {interests.map((i) => (
                  <div
                    key={i.label}
                    className="glass rounded-2xl p-4 flex items-start gap-3 transition-colors hover:bg-white/[0.06]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
                      <i.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{i.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {i.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Experience timeline */}
      <div id="experience" className="mx-auto max-w-7xl px-4 mt-24 lg:mt-32">
        <SectionEyebrow>Experience</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          Experience that shaped how I build.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          The roles, projects, and responsibilities behind my engineering —
          from business automation to enterprise platforms.
        </p>

        <div className="relative mt-14">
          {/* One continuous vertical line. Desktop: centered on the dedicated
              dot column (which sits at 50% of a 1fr/2rem/1fr grid).
              Mobile: fixed at left-4. */}
          <div
            aria-hidden
            className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent lg:left-1/2 lg:-translate-x-1/2"
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
                      className="absolute left-4 top-[26px] -translate-x-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-cyan-accent to-blue-accent shadow-[0_0_20px_rgba(6,182,212,0.55)] ring-4 ring-background/60 lg:hidden"
                    />
                    <div className="lg:hidden mb-3 text-xs font-medium text-muted-foreground">
                      {e.period}
                    </div>

                    <article className="glass-strong rounded-3xl p-6 transition-colors hover:bg-white/[0.06]">
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
                              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-foreground/80"
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
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Currently building · {p.name}
                              </span>
                            ) : (
                              <span
                                key={p.name}
                                title={p.note}
                                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-foreground/85"
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
                              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-cyan-accent/70" />
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
                      viewport={{ once: true, margin: "-70px" }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 18,
                      }}
                      aria-hidden
                      className="mt-[30px] flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-cyan-accent to-blue-accent shadow-[0_0_20px_rgba(6,182,212,0.55)] ring-4 ring-background/60"
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
                    className={`hidden lg:block lg:row-start-1 lg:pt-[30px] text-sm font-medium text-muted-foreground ${
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
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-cyan-accent">
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
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent" />
      {children}
    </motion.div>
  );
}
