import { useState } from "react";
import { SectionEyebrow } from "./about";
import {
  Mail,
  Phone,
  Link as Linkedin,
  GitFork as Github,
  Download,
  Send,
  ArrowUp,
} from "lucide-react";

const channels = [
  { icon: Mail, label: "Email", value: "bramhananda.kl@example.com", href: "mailto:bramhananda.kl@example.com" },
  { icon: Phone, label: "Phone", value: "+91 · Available on request", href: "tel:+910000000000" },
  { icon: Linkedin, label: "LinkedIn", value: "in/bramhananda-kl", href: "https://linkedin.com" },
  { icon: Github, label: "GitHub", value: "@bramhananda-kl", href: "https://github.com" },
];

export function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionEyebrow>Contact</SectionEyebrow>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-gradient max-w-3xl">
          Let's build something enterprise-grade.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Open to backend, ERPNext, and AI-integration engagements. Reach out
          with a brief and I'll get back within a day.
        </p>

        <div className="mt-12 grid lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-8">
          {/* Channels */}
          <div className="space-y-4">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="group flex items-center gap-4 glass-strong rounded-2xl p-5 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--cyan-accent)]/20 to-[color:var(--blue-accent)]/20 text-[color:var(--cyan-accent)]">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {c.label}
                  </div>
                  <div className="text-foreground/90 truncate group-hover:text-[color:var(--cyan-accent)] transition">
                    {c.value}
                  </div>
                </div>
              </a>
            ))}

            <a
              id="resume"
              href="#"
              className="flex items-center justify-between glass-strong rounded-2xl p-5 hover:bg-white/[0.07] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--cyan-accent)] to-[color:var(--blue-accent)] text-background">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">Download Resume</div>
                  <div className="text-xs text-muted-foreground">PDF · 2 pages</div>
                </div>
              </div>
              <span className="text-sm text-[color:var(--cyan-accent)]">
                Get it →
              </span>
            </a>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              setTimeout(() => setSent(false), 3500);
            }}
            className="glass-strong rounded-3xl p-6 sm:p-8"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Name" name="name" placeholder="Your name" />
              <Field label="Email" name="email" type="email" placeholder="you@company.com" />
            </div>
            <Field label="Subject" name="subject" placeholder="What's the project about?" />
            <div className="mt-4">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Message
              </label>
              <textarea
                required
                rows={5}
                placeholder="Tell me about your project, timeline, and stack…"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-[color:var(--cyan-accent)]/50 focus:bg-white/[0.05] transition"
              />
            </div>

            <button
              type="submit"
              disabled={sent}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--cyan-accent)] to-[color:var(--blue-accent)] px-5 py-3 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_rgba(6,182,212,0.6)] hover:shadow-[0_14px_50px_-8px_rgba(6,182,212,0.75)] transition-shadow disabled:opacity-70"
            >
              {sent ? "Message sent — I'll reply soon" : (
                <>
                  Send Message
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
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
    <div className="mt-4 first:mt-0 sm:first:mt-0">
      <label htmlFor={name} className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-[color:var(--cyan-accent)]/50 focus:bg-white/[0.05] transition"
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
  { label: "Contact", href: "#contact" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-10 mt-10">
      <div className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[color:var(--cyan-accent)] to-[color:var(--blue-accent)] text-background font-bold">
            B
          </div>
          <div>
            <div className="font-semibold">Bramhananda K L</div>
            <div className="text-xs text-muted-foreground">
              Software Engineer · ERPNext · Backend · AI
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {footerLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            aria-label="GitHub"
            className="flex h-10 w-10 items-center justify-center rounded-xl glass hover:bg-white/10 transition"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://linkedin.com"
            aria-label="LinkedIn"
            className="flex h-10 w-10 items-center justify-center rounded-xl glass hover:bg-white/10 transition"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="#home"
            aria-label="Back to top"
            className="flex h-10 w-10 items-center justify-center rounded-xl glass hover:bg-white/10 transition"
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
