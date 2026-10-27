import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { SectionEyebrow } from "../sections/about";
import bkLogo from "@/assets/branding/bk-logo.jpeg";
import { Reveal } from "../effects/hero-interactions";
import { navHeight } from "@/lib/sections";
import { Mail, Phone, ArrowUp } from "lucide-react";
import { EndpointCard } from "./EndpointCard";
import { MonitorPanel } from "./MonitorPanel";
import { BbotChat } from "./BbotChat";
import { ClassicForm, Honeypot, RequestPane, useContactSession } from "./RequestBuilder";

// Shared with the terminal command bar so contact details live in one place.
// eslint-disable-next-line react-refresh/only-export-components
export const channels = [
  { icon: Mail, label: "Email", value: "bramhanandakl2030@gmail.com", href: "mailto:bramhanandakl2030@gmail.com", external: false },
  { icon: Phone, label: "Phone", value: "+91 7676068819", href: "tel:+917676088819", external: false },
  { icon: LinkedinIcon, label: "LinkedIn", value: "in/bramhanandakl", href: "https://www.linkedin.com/in/bramhanandakl/", external: true },
  { icon: GithubIcon, label: "GitHub", value: "@KLBramhananda", href: "https://github.com/KLBramhananda", external: true },
];

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const clock = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

/** Bengaluru time, refreshed every 30 s; the timer is cleared on unmount. */
function useIstTime() {
  const [time, setTime] = useState(() => clock.format(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setTime(clock.format(new Date())), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

type Breakpoint = "mobile" | "tablet" | "desktop";
const readBreakpoint = (): Breakpoint =>
  window.matchMedia("(min-width: 1024px)").matches ? "desktop" : window.matchMedia("(min-width: 768px)").matches ? "tablet" : "mobile";

function useBreakpoint() {
  const [bp, setBp] = useState<Breakpoint>(readBreakpoint);
  useEffect(() => {
    const qs = [window.matchMedia("(min-width: 768px)"), window.matchMedia("(min-width: 1024px)")];
    const on = () => setBp(readBreakpoint());
    qs.forEach((q) => q.addEventListener("change", on));
    return () => qs.forEach((q) => q.removeEventListener("change", on));
  }, []);
  return bp;
}

const MODE_KEY = "bk:contact:mode";
type Mode = "chat" | "form";

function readMode(): Mode {
  try {
    return window.sessionStorage.getItem(MODE_KEY) === "form" ? "form" : "chat";
  } catch {
    return "chat";
  }
}

/**
 * Pauses the section's idle loops (glow, cursors, typing dots) while it is off
 * screen, by toggling `anim-paused` on the panel. It reads the LATEST observer
 * entry: after a deep-link jump the observer delivers a batch, and the first
 * entry (from before the jump) must not win.
 */
function usePanelPause(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => el.classList.toggle("anim-paused", !entries[entries.length - 1].isIntersecting),
      { rootMargin: "140px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

/**
 * Desktop: both monitors get the same height, sized so the whole panel fits
 * `100svh - nav - 48px`. The height is written to a CSS variable on the panel
 * (rAF-throttled, on resize and when the header row changes); other
 * breakpoints use the CSS default.
 */
function useMonitorHeight(
  panelRef: RefObject<HTMLDivElement | null>,
  stageRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const panel = panelRef.current;
    const stage = stageRef.current;
    if (!panel || !stage) return;
    if (!enabled) {
      panel.style.removeProperty("--mon-h");
      return;
    }
    let raf = 0;
    const apply = () => {
      raf = 0;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const used = panel.offsetHeight - stage.offsetHeight;
      const h = window.innerHeight - navHeight() - 48 - used;
      panel.style.setProperty("--mon-h", `${Math.round(Math.min(Math.max(h, rem * 18), rem * 38))}px`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    const ro = new ResizeObserver(schedule);
    const head = panel.querySelector(".contact-head");
    if (head) ro.observe(head);
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, [panelRef, stageRef, enabled]);
}

export function Contact() {
  const time = useIstTime();
  const bp = useBreakpoint();
  const [mode, setMode] = useState<Mode>(readMode);
  const [requestOpen, setRequestOpen] = useState(false);
  const session = useContactSession({ onStart: () => setRequestOpen(true) });
  const email = channels[0].value;
  const panelRef = useRef<HTMLDivElement | null>(null);
  usePanelPause(panelRef);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const { wrap: attachWrap, origin: attachOrigin, packet: attachPacket, ghost: attachGhost } = session.attach;
  const setStage = useCallback(
    (el: HTMLDivElement | null) => {
      stageRef.current = el;
      attachWrap(el);
    },
    [attachWrap],
  );
  useMonitorHeight(panelRef, stageRef, bp === "desktop");

  const toggleMode = () => {
    const next: Mode = mode === "chat" ? "form" : "chat";
    setMode(next);
    try {
      window.sessionStorage.setItem(MODE_KEY, next);
    } catch {
      /* private mode: the choice just isn't remembered */
    }
  };
  const angled = bp === "desktop";

  const toggle = (
    <button
      type="button"
      onClick={toggleMode}
      className="rounded-md px-1.5 py-0.5 font-mono text-[0.6875rem] text-cyan-accent transition-colors hover:text-cyan-accent/80 [@media(pointer:coarse)]:min-h-[44px]"
    >
      {mode === "chat" ? "Use classic form" : "Use chat"}
    </button>
  );

  const left = (
    <MonitorPanel title={mode === "chat" ? "chat.tsx" : "contact.form"} side="left" angled={angled} actions={toggle} screenRef={attachOrigin}>
      <div hidden={mode !== "chat"} className="h-full min-h-0">
        <BbotChat session={session} active={mode === "chat"} email={email} />
      </div>
      <div hidden={mode !== "form"} className="h-full min-h-0 overflow-y-auto pr-1">
        <ClassicForm session={session} />
      </div>
    </MonitorPanel>
  );
  const right = (
    <MonitorPanel title="request.log" side="right" angled={angled}>
      <RequestPane session={session} email={email} />
    </MonitorPanel>
  );

  return (
    <section id="contact" className="relative py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal className="relative">
          <div ref={panelRef} className="contact-panel relative overflow-hidden glass-strong rounded-3xl p-5 sm:p-7">
            {/* Landing anchor: the nav links and deep links align the first h1/h2 of a section just below the
                nav, so this empty, hidden heading puts the panel's own top edge there instead. */}
            <h2 aria-hidden className="absolute top-0 left-0 h-0 w-0 overflow-hidden" />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 right-[10%] h-72 w-72 rounded-full bg-cyan-accent/15 blur-[6.25rem]"
            />

            {/* Header row: text on the left, status chip + endpoint keycaps on the right */}
            <div className="contact-head relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start lg:gap-8">
              <div className="max-w-2xl">
                <SectionEyebrow>Let's Talk</SectionEyebrow>
                <h2 className="mt-3 text-4xl sm:text-5xl lg:text-[2.5rem] lg:leading-tight font-bold tracking-tight text-gradient">
                  Let's build something enterprise-grade.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Open to full-stack, ERPNext, SAP BTP, and AI opportunities. Have a
                  question, idea, or opportunity? Let's talk.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="glass flex items-center gap-4 rounded-2xl px-4 py-3">
                  <div className="shrink-0 font-mono text-3xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                    {time}
                    <span className="ml-1.5 text-xs font-normal tracking-wide text-muted-foreground">IST</span>
                  </div>
                  <p className="flex min-w-0 items-start gap-2 font-mono text-xs leading-relaxed text-muted-foreground">
                    <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <span>Available for opportunities · Bengaluru · Usually replies within 24 h</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3" role="group" aria-label="Contact endpoints">
                  {channels.map((c) => (
                    <EndpointCard key={c.label} channel={c} />
                  ))}
                </div>
              </div>
            </div>

            {/* The monitors */}
            {bp === "mobile" ? (
              <div className="relative mt-6">
                <div ref={setStage} className="mon-stage relative">
                  <div className="mon-height">{left}</div>
                  <Honeypot session={session} />
                  <span ref={attachGhost(0)} aria-hidden className="api-packet" />
                  <span ref={attachGhost(1)} aria-hidden className="api-packet" />
                  <span ref={attachGhost(2)} aria-hidden className="api-packet" />
                  <span ref={attachPacket} aria-hidden className="api-packet" />
                </div>
                <button
                  type="button"
                  aria-expanded={requestOpen}
                  aria-controls="contact-request"
                  onClick={() => setRequestOpen((o) => !o)}
                  className="mt-3 min-h-[44px] rounded-lg font-mono text-xs text-cyan-accent"
                >
                  {requestOpen ? "Hide request" : "View request"}
                </button>
                <div id="contact-request" hidden={!requestOpen} className="mt-1">
                  <div className="mon-height">{right}</div>
                </div>
              </div>
            ) : (
              <div
                ref={setStage}
                className={`mon-stage relative mt-6 grid grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] gap-4 lg:gap-8 ${angled ? "mon-stage--3d" : ""}`}
              >
                <div className="mon-height">{left}</div>
                <div className="mon-height">{right}</div>
                <Honeypot session={session} />
                <span ref={attachGhost(0)} aria-hidden className="api-packet" />
                <span ref={attachGhost(1)} aria-hidden className="api-packet" />
                <span ref={attachGhost(2)} aria-hidden className="api-packet" />
                <span ref={attachPacket} aria-hidden className="api-packet" />
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const developerLinks = [
  { label: "GitHub", href: "/open-source" },
  { label: "Certifications", href: "/certifications" },
];

const footerReveal = {
  initial: { opacity: 0, y: 13 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px 0px 0px" },
} as const;

export function Footer() {
  return (
    <footer className="relative border-t border-slate-900/10 pt-14 pb-8 mt-10 dark:border-white/5">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          {/* Identity */}
          <motion.div
            {...footerReveal}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center md:items-start md:text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden">
                <img
                  src={bkLogo}
                  alt="BK logo"
                  width={1254}
                  height={1254}
                  className="h-9 w-9 shrink-0 object-cover"
                />
              </div>
              <div>
                <div className="font-semibold">Bramhananda K L</div>
                <div className="text-xs text-muted-foreground">
                  Software Engineer · Full Stack · AI · ERPNext · SAP BTP
                </div>
              </div>
            </div>
          </motion.div>

          {/* Developer links — centered */}
          <motion.nav
            aria-label="Developer links"
            {...footerReveal}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.08,
            }}
            className="flex items-center justify-center"
          >
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {developerLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="footer-link text-sm">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* Social / actions */}
          <motion.div
            {...footerReveal}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2,
            }}
            className="flex flex-col items-center gap-4 md:items-start lg:items-end"
          >
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/KLBramhananda"
                aria-label="GitHub profile"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn group flex h-10 w-10 items-center justify-center rounded-xl glass"
              >
                <GithubIcon className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-cyan-accent" />
              </a>
              <a
                href="https://www.linkedin.com/in/bramhanandakl/"
                aria-label="LinkedIn profile"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn group flex h-10 w-10 items-center justify-center rounded-xl glass"
              >
                <LinkedinIcon className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-cyan-accent" />
              </a>
              <a
                href="/"
                aria-label="Back to top"
                className="social-btn group flex h-10 w-10 items-center justify-center rounded-xl glass"
              >
                <ArrowUp className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-cyan-accent" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Footer meta row */}
        <div className="mt-8 border-t border-slate-900/10 pt-6 md:mt-10 dark:border-white/5">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                aria-hidden
                className="status-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent"
              />
              Open to opportunities & collaborations
            </p>
            <p className="text-center text-xs text-muted-foreground">
              © 2026 Bramhananda K L · Built with purpose.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
