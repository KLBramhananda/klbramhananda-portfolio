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
  Layers,
  Layout,
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
    </section>
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
