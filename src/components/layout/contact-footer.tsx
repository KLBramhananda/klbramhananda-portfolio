import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionEyebrow } from "../sections/about";
import bkLogo from "@/assets/branding/bk-logo.jpeg";
import { Reveal } from "../effects/hero-interactions";
import { Mail, Phone, ArrowUp } from "lucide-react";
import { EndpointCard } from "./EndpointCard";
import { RequestBuilder } from "./RequestBuilder";

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

export function Contact() {
  const time = useIstTime();

  return (
    <section id="contact" className="relative py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal className="relative overflow-hidden glass-strong rounded-3xl p-6 sm:p-10 lg:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 right-[10%] h-72 w-72 rounded-full bg-cyan-accent/15 blur-[6.25rem]"
          />

          <div className="relative max-w-2xl">
            <SectionEyebrow>Let's Talk</SectionEyebrow>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient">
              Let's build something enterprise-grade.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Open to full-stack, ERPNext, SAP BTP, and AI opportunities. Have a
              question, idea, or opportunity? Let's talk.
            </p>
          </div>

          {/* Status strip */}
          <p className="relative mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
            <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-foreground/90">Available for opportunities</span>
            <span aria-hidden>·</span>
            <span>Bengaluru</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">IST {time}</span>
            <span aria-hidden>·</span>
            <span>Usually replies within 24 h</span>
          </p>

          <div className="relative mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-8">
            {/* Endpoints */}
            <div className="grid grid-cols-2 content-start gap-3 lg:sticky lg:top-[5.75rem] lg:grid-cols-1 lg:self-start" role="group" aria-label="Contact endpoints">
              {channels.map((c) => (
                <EndpointCard key={c.label} channel={c} />
              ))}
            </div>

            {/* Request builder + response console */}
            <RequestBuilder email={channels[0].value} />
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
