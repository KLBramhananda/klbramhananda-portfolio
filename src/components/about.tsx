import workspace from "@/assets/images/workspace.jpg";
import { motion } from "framer-motion";
import { Brain, Cpu, Database, Layers, Award, TrendingUp, Wrench } from "lucide-react";

const interests = [
  { icon: Layers, label: "ERP Systems", desc: "ERPNext, Frappe, workflows" },
  { icon: Brain, label: "AI Integration", desc: "LLMs in enterprise flows" },
  { icon: Cpu, label: "Backend", desc: "Python, Java, distributed systems" },
  { icon: Database, label: "System Design", desc: "Scalable architectures" },
];

const experience = [
  {
    role: "Software Engineer",
    company: "HG Infotech",
    period: "2023 — Present",
    summary:
      "Building enterprise-grade platforms combining ERP, AI, and modern backend systems for procurement, travel, and healthcare.",
    tech: ["Python", "Java", "FastAPI", "React", "ERPNext", "Kafka", "MongoDB", "AWS"],
    achievements: [
      "Architected S2P Matrix procurement platform on FastAPI + React with SAP HANA integration",
      "Delivered Fastays travel booking backend with Kafka event streaming",
      "Built reusable Procurement Service Platform serving multiple enterprise clients",
    ],
    impact:
      "Reduced enterprise procurement cycle time by ~40% and enabled AI-driven vendor recommendations across pilots.",
    current: false,
  },
  {
    role: "Project · S2P Matrix",
    company: "Enterprise Procurement Platform",
    period: "2024",
    summary:
      "Source-to-Pay platform with AI-assisted supplier matching, RFQ automation, and SAP HANA integration.",
    tech: ["Python", "FastAPI", "React", "SAP HANA", "AI/LLM"],
    achievements: [
      "Designed multi-tenant procurement domain model",
      "Integrated vector search for supplier discovery",
      "Automated RFQ scoring and negotiation drafts",
    ],
    impact:
      "Cut RFQ turnaround time from days to hours for pilot enterprise buyers.",
    current: false,
  },
  {
    role: "Project · Fastays",
    company: "Travel Booking Platform",
    period: "2023 — 2024",
    summary:
      "High-throughput booking backend with event-driven order processing and inventory sync.",
    tech: ["Java", "Spring Boot", "Kafka", "MongoDB"],
    achievements: [
      "Handled 10× traffic spikes via Kafka-backed order queues",
      "Reduced booking latency with async inventory updates",
      "Rolled out microservices for pricing and availability",
    ],
    impact:
      "Enabled reliable bookings during peak load with sub-second confirmation.",
    current: false,
  },
  {
    role: "Currently working on · KeeMeds",
    company: "Healthcare Commerce · ERPNext",
    period: "2026 — Now",
    summary:
      "ERPNext + Frappe implementation for a healthcare commerce platform, from catalog to fulfillment.",
    tech: ["ERPNext", "Frappe", "Python", "MariaDB"],
    achievements: [
      "Modeling healthcare-specific inventory and compliance workflows",
      "Custom Frappe apps for supplier onboarding",
      "Integrating payments and logistics",
    ],
    impact:
      "Laying the ERP backbone for a compliant, scalable healthcare commerce launch.",
    current: true,
  },
];

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
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <img
                  src={workspace}
                  alt="Workspace"
                  width={1000}
                  height={1200}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 glass-strong rounded-2xl px-5 py-4 hidden sm:block">
              <div className="text-xs text-muted-foreground">Focus</div>
              <div className="text-base font-semibold">ERP · AI · Backend</div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Professional summary
              </h3>
              <p className="mt-3 text-lg leading-relaxed text-foreground/90">
                I'm a software engineer focused on building enterprise systems
                that actually ship — ERP implementations, AI-powered
                procurement platforms, and backend services that scale.
                I work end-to-end across product, architecture, and delivery.
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
                Current interests
              </h3>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {interests.map((i) => (
                  <div
                    key={i.label}
                    className="glass rounded-2xl p-4 flex items-start gap-3 hover:bg-white/[0.06] transition"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--cyan-accent)]/20 to-[color:var(--blue-accent)]/20 text-[color:var(--cyan-accent)]">
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
      <div id="experience" className="mx-auto max-w-7xl px-4 mt-28 lg:mt-36">
        <SectionEyebrow>Experience</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          A timeline of enterprise projects delivered.
        </h2>

        <div className="relative mt-14">
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />

          <div className="space-y-10">
            {experience.map((e, idx) => {
              const left = idx % 2 === 0;
              return (
                <div
                  key={e.role}
                  className={`relative sm:grid sm:grid-cols-2 sm:gap-10 ${
                    left ? "" : "sm:[&>*:first-child]:col-start-2"
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 top-6 flex h-4 w-4 items-center justify-center">
                    <span className="h-4 w-4 rounded-full bg-gradient-to-br from-[color:var(--cyan-accent)] to-[color:var(--blue-accent)] shadow-[0_0_20px_rgba(6,182,212,0.7)]" />
                  </div>

                  <div
                    className={`pl-12 sm:pl-0 ${
                      left ? "sm:pr-10 sm:text-right" : "sm:pl-10"
                    }`}
                  >
                    <div className="glass-strong rounded-3xl p-6 hover:bg-white/[0.06] transition-all hover:-translate-y-1">
                      <div
                        className={`flex items-center gap-2 flex-wrap ${
                          left ? "sm:justify-end" : ""
                        }`}
                      >
                        {e.current && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 text-xs font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Currently working on
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {e.period}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-semibold text-foreground">
                        {e.role}
                      </h3>
                      <div className="text-sm text-[color:var(--cyan-accent)]">
                        {e.company}
                      </div>

                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {e.summary}
                      </p>

                      <div
                        className={`mt-4 flex flex-wrap gap-1.5 ${
                          left ? "sm:justify-end" : ""
                        }`}
                      >
                        {e.tech.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-foreground/80"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-3">
                        <MetaRow
                          icon={Award}
                          title="Achievements"
                          items={e.achievements}
                          align={left ? "right" : "left"}
                        />
                        <div
                          className={`flex gap-2 items-start ${
                            left ? "sm:flex-row-reverse sm:text-right" : ""
                          }`}
                        >
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-[color:var(--cyan-accent)]">
                            <TrendingUp className="h-3.5 w-3.5" />
                          </div>
                          <div className="text-sm text-foreground/85">
                            <span className="text-muted-foreground">Business impact — </span>
                            {e.impact}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetaRow({
  icon: Icon,
  title,
  items,
  align,
}: {
  icon: typeof Wrench;
  title: string;
  items: string[];
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex gap-2 items-start ${
        align === "right" ? "sm:flex-row-reverse sm:text-right" : ""
      }`}
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-[color:var(--cyan-accent)]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
          {title}
        </div>
        <ul className="space-y-1 text-sm text-foreground/85">
          {items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
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
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--cyan-accent)]" />
      {children}
    </motion.div>
  );
}
