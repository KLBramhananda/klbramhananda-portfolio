import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePointerTilt } from "../effects/use-pointer-tilt";
import { HangingBadge } from "../ui/HangingBadge";
import { ScrollLitText } from "../ui/ScrollLitText";
import { Reveal } from "../effects/hero-interactions";
import { onScrollFrame } from "../layout/use-nav-scroll";
import {
  Boxes,
  Bot,
  Cloud,
  Compass,
  FolderGit2,
  Layers,
  Layout,
  ListChecks,
  MapPin,
  Plug,
  Rocket,
  Server,
  Webhook,
  Workflow,
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
  initial: { opacity: 0, y: 16, filter: "blur(6px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-56px" },
} as const;

const SUMMARY =
  "Full Stack Software Engineer focused on building scalable enterprise applications across frontend, backend, AI integrations, ERPNext, and SAP BTP. I work end-to-end across application development, APIs, integrations, business workflows, and production systems.";

const APPROACH_LEAD =
  "End-to-end development with emphasis on scalable architecture, clean integrations, reliable business workflows and production-ready software.";

const approachPillars: { icon: LucideIcon; label: string }[] = [
  { icon: Layers, label: "Scalable architecture" },
  { icon: Plug, label: "Clean integrations" },
  { icon: Workflow, label: "Reliable workflows" },
  { icon: Rocket, label: "Production-ready" },
];

// Mixed card sizes: 3 columns (container >= 684px) -> Full Stack and ERPNext and
// API span 2; the balanced 2-column fallback -> Full Stack and API span 2.
const focusSpans = [
  "min-[400px]:col-span-2",
  "",
  "",
  "@min-[684px]:col-span-2",
  "",
  "min-[400px]:col-span-2",
];

/** Focus card: ±5° tilt, a border glow that follows the cursor, icon wiggle. */
function FocusCard({ area, className }: { area: (typeof focusAreas)[number]; className: string }) {
  const [ref, style] = usePointerTilt<HTMLDivElement>(5, { local: true });
  return (
    <motion.div
      ref={ref}
      style={style}
      whileHover="hover"
      className={`group glass relative flex items-start gap-3 rounded-2xl p-4 ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_130px_at_var(--gx,50%)_var(--gy,50%),var(--cyan-accent),transparent)] p-px opacity-[var(--glare,0)] transition-opacity duration-300 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor]"
      />
      <motion.div
        variants={{ hover: { rotate: [0, -10, 8, 0], scale: 1.12 } }}
        transition={{ duration: 0.3 }}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent"
      >
        <area.icon className="h-5 w-5" />
      </motion.div>
      <div className="relative min-w-0">
        <div className="font-medium text-foreground">{area.label}</div>
        <div className="text-sm text-muted-foreground transition-colors duration-300 [@media(hover:hover)]:group-hover:text-foreground/90">
          {area.desc}
        </div>
      </div>
    </motion.div>
  );
}

/** Four pillars joined by a thin line; small pulses travel along it. */
function ApproachPillars() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    let anims: Animation[] = [];
    let visible = false;

    const build = () => {
      anims.forEach((a) => a.cancel());
      anims = [];
      root.querySelectorAll<HTMLElement>("[data-lane]").forEach((lane) => {
        const horizontal = lane.dataset.lane === "x";
        const length = horizontal ? lane.offsetWidth : lane.offsetHeight;
        if (!length) return; // the other orientation is hidden at this width
        lane.querySelectorAll<HTMLElement>("[data-pulse]").forEach((pulse, i) => {
          const size = horizontal ? pulse.offsetWidth : pulse.offsetHeight;
          const axis = horizontal ? "X" : "Y";
          const a = pulse.animate(
            [
              { transform: `translate${axis}(0px)`, opacity: 0 },
              { opacity: 1, offset: 0.15 },
              { opacity: 1, offset: 0.85 },
              { transform: `translate${axis}(${Math.max(length - size, 0)}px)`, opacity: 0 },
            ],
            { duration: 3400, delay: i * 1100, iterations: Infinity, easing: "linear" },
          );
          if (!visible) a.pause();
          anims.push(a);
        });
      });
    };

    // Pulses only run while the block is on screen.
    const setVisible = (v: boolean) => {
      if (v === visible) return;
      visible = v;
      anims.forEach((a) => (visible ? a.play() : a.pause()));
    };
    const io = new IntersectionObserver((entries) => setVisible(entries[entries.length - 1].isIntersecting));
    io.observe(root);
    // Backstop for jumps that land between observer deliveries (deep links).
    const offScroll = onScrollFrame(() => {
      const r = root.getBoundingClientRect();
      setVisible(r.bottom > 0 && r.top < window.innerHeight);
    });
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(build);
    });
    ro.observe(root);
    build();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      offScroll();
      ro.disconnect();
      anims.forEach((a) => a.cancel());
    };
  }, [reduced]);

  const pulses = [0, 1, 2].map((i) => (
    <span
      key={i}
      data-pulse
      className="absolute top-0 left-0 rounded-full bg-cyan-accent opacity-0 shadow-[0_0_8px_var(--cyan-accent)]"
      style={{ width: "var(--pw)", height: "var(--ph)" }}
    />
  ));

  return (
    <div ref={rootRef} className="relative mt-5">
      {/* Horizontal connector (md+) */}
      <div aria-hidden className="pointer-events-none absolute top-5 right-[12.5%] left-[12.5%] hidden md:block">
        <svg className="h-px w-full text-cyan-accent/40" viewBox="0 0 100 1" preserveAspectRatio="none">
          <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <div
          data-lane="x"
          className="absolute -top-[2px] right-0 left-0 h-[5px] [--ph:5px] [--pw:1.5rem]"
        >
          {pulses}
        </div>
      </div>
      {/* Vertical connector (mobile) */}
      <div aria-hidden className="pointer-events-none absolute top-5 bottom-5 left-5 w-px md:hidden">
        <svg className="h-full w-px text-cyan-accent/40" viewBox="0 0 1 100" preserveAspectRatio="none">
          <line x1="0.5" y1="0" x2="0.5" y2="100" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <div
          data-lane="y"
          className="absolute -left-[2px] top-0 bottom-0 w-[5px] [--ph:1.5rem] [--pw:5px]"
        >
          {pulses}
        </div>
      </div>

      <ol className="relative grid gap-5 md:grid-cols-4">
        {approachPillars.map((p) => (
          <li key={p.label} className="flex items-center gap-3 md:flex-col md:text-center">
            <span className="glass-strong relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-cyan-accent">
              <p.icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-foreground">{p.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function About() {
  return (
    <section id="about" className="relative py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <SectionEyebrow>About</SectionEyebrow>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
            Engineering enterprise software with clarity, speed, and depth.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:gap-14">
          {/* Badge column: sticky on desktop while the content scrolls */}
          <div className="lg:sticky lg:top-[6rem] lg:self-start">
            <Reveal>
              <HangingBadge />
            </Reveal>
          </div>

          <Reveal className="min-w-0 space-y-10" delay={0.12}>
            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Professional summary
              </h3>
              <ScrollLitText
                text={SUMMARY}
                className="mt-3 text-lg leading-relaxed text-foreground"
              />
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Engineering focus
              </h3>
              <div className="@container mt-4">
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 @min-[684px]:grid-cols-3">
                  {focusAreas.map((f, i) => (
                    <FocusCard key={f.label} area={f} className={focusSpans[i]} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                Engineering approach
              </h3>
              <p className="mt-3 text-foreground/85 leading-relaxed">{APPROACH_LEAD}</p>
              <ApproachPillars />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Experience timeline */}
      <div id="experience" className="mx-auto max-w-7xl px-4 mt-24 lg:mt-32">
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
    <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs uppercase tracking-widest text-foreground/85 dark:text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent" />
      {children}
    </div>
  );
}
