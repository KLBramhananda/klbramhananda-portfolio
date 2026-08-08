import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { SectionEyebrow } from "./about";
import {
  Mail,
  Phone,
  Link as Linkedin,
  GitFork as Github,
  Download,
  Send,
  ArrowUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const EMAILJS_SERVICE_ID = "service_qr820ew";
const EMAILJS_TEMPLATE_ID = "template_utu7ay8";
const EMAILJS_PUBLIC_KEY = "Do3-w2LKSBN27y8sY";

const channels = [
  { icon: Mail, label: "Email", value: "bramhanandakl2030@gmail.com", href: "mailto:bramhanandakl2030@gmail.com", external: false },
  { icon: Phone, label: "Phone", value: "+91 7676068819", href: "tel:+917676088819", external: false },
  { icon: Linkedin, label: "LinkedIn", value: "in/bramhanandakl", href: "https://www.linkedin.com/in/bramhanandakl/", external: true },
  { icon: Github, label: "GitHub", value: "@KLBramhananda", href: "https://github.com/KLBramhananda", external: true },
];

export function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const formRef = useRef<HTMLFormElement>(null);
  const resetTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== undefined) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current!,
        { publicKey: EMAILJS_PUBLIC_KEY },
      );
      formRef.current?.reset();
      setStatus("success");
      resetTimerRef.current = window.setTimeout(() => setStatus("idle"), 3500);
    } catch {
      setStatus("error");
      resetTimerRef.current = window.setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <section id="contact" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden glass-strong rounded-3xl p-8 sm:p-12 lg:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 right-[10%] h-72 w-72 rounded-full bg-cyan-accent/15 blur-[100px]"
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

          <div className="relative mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Channels */}
            <div className="flex flex-col gap-3">
              {channels.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex flex-1 items-center gap-3.5 glass rounded-2xl px-4 py-3.5 transition-colors hover:bg-white/[0.07]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {c.label}
                    </div>
                    <div className="text-foreground/90 truncate transition-colors group-hover:text-cyan-accent">
                      {c.value}
                    </div>
                  </div>
                </a>
              ))}

              <a
                id="resume"
                href="/resume/Bramhananda-K-L-Resume.pdf"
                download
                className="flex flex-1 items-center justify-between glass rounded-2xl px-4 py-3.5 transition-colors hover:bg-white/[0.07]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-blue-accent text-background">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold">Download Resume</div>
                    <div className="text-xs text-muted-foreground">PDF</div>
                  </div>
                </div>
                <span className="text-sm text-cyan-accent">Get it →</span>
              </a>
            </div>

            {/* Form */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="glass rounded-3xl p-6 sm:p-8"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Name" name="name" placeholder="Your name" />
                <Field label="Email" name="email" type="email" placeholder="you@company.com" />
              </div>
              <div className="mt-4">
                <Field label="Subject" name="subject" placeholder="How can I help you?" />
              </div>
              <div className="mt-4">
                <label
                  htmlFor="message"
                  className="text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell me what you'd like to discuss, ask, or build..."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-cyan-accent/50 focus:bg-white/[0.05]"
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending" || status === "success"}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-5 py-3 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_rgba(6,182,212,0.6)] transition-shadow hover:shadow-[0_14px_50px_-8px_rgba(6,182,212,0.75)] disabled:opacity-70"
              >
                {status === "sending" ? (
                  <>
                    Sending…
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : status === "success" ? (
                  "Thanks! I'll get back to you soon"
                ) : (
                  <>
                    Send Message
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>

              {status === "success" && (
                <p
                  role="status"
                  className="mt-3 flex items-center gap-2 text-sm text-emerald-400"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Message sent — I'll get back to you soon.
                </p>
              )}
              {status === "error" && (
                <p
                  role="alert"
                  className="mt-3 flex items-center gap-2 text-sm text-rose-400"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Something went wrong. Please try again or email me directly.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="text-xs uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-cyan-accent/50 focus:bg-white/[0.05]"
      />
    </div>
  );
}

const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Tech Stack", href: "#tech" },
  { label: "Skills", href: "#skills" },
  { label: "Let's Talk", href: "#contact" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-10 mt-10">
      <div className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-accent to-blue-accent text-background font-bold">
            B
          </div>
          <div>
            <div className="font-semibold">Bramhananda K L</div>
            <div className="text-xs text-muted-foreground">
              Software Engineer · Full Stack · AI · ERPNext · SAP BTP
            </div>
          </div>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
        >
          {footerLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/KLBramhananda"
            aria-label="GitHub profile"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl glass transition-colors hover:bg-white/10"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/bramhanandakl/"
            aria-label="LinkedIn profile"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl glass transition-colors hover:bg-white/10"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="#home"
            aria-label="Back to top"
            className="flex h-10 w-10 items-center justify-center rounded-xl glass transition-colors hover:bg-white/10"
          >
            <ArrowUp className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 mt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Bramhananda K L. Crafted with care.
      </div>
    </footer>
  );
}
