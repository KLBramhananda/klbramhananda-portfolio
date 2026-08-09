import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { motion, useReducedMotion } from "framer-motion";
import { SectionEyebrow } from "../sections/about";
import bkLogo from "@/assets/branding/bk-logo.jpeg";
import {
  Mail,
  Phone,
  Download,
  Send,
  ArrowUp,
  Loader2,
  Check,
  TriangleAlert,
} from "lucide-react";

const EMAILJS_SERVICE_ID = "service_qr820ew";
const EMAILJS_TEMPLATE_ID = "template_utu7ay8";
const EMAILJS_PUBLIC_KEY = "Do3-w2LKSBN27y8sY";

const channels = [
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

type FormErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;

function validateForm(form: HTMLFormElement): FormErrors {
  const data = new FormData(form);
  const read = (key: string) => String(data.get(key) ?? "").trim();

  const errors: FormErrors = {};
  const name = read("name");
  const email = read("email");
  const subject = read("subject");
  const message = read("message");

  if (!name) errors.name = "Please enter your name.";
  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!subject) errors.subject = "Please enter a subject.";
  if (!message) errors.message = "Please write a message.";

  return errors;
}

export function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;

    const form = formRef.current;
    if (!form) return;

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("sending");
    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        form,
        { publicKey: EMAILJS_PUBLIC_KEY },
      );
      setStatus("success");
    } catch (error) {
      console.error("EmailJS send failed:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    formRef.current?.reset();
    setErrors({});
    setStatus("idle");
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[name="name"]')?.focus();
    });
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
              noValidate
              aria-busy={status === "sending"}
              className="glass flex flex-col rounded-3xl p-6 sm:p-8"
            >
              {status === "success" ? (
                <SubmissionStatus variant="success" onReset={handleReset} />
              ) : status === "error" ? (
                <SubmissionStatus variant="error" onReset={handleReset} />
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field
                      label="Name"
                      name="name"
                      placeholder="Your name"
                      error={errors.name}
                      onChange={() => clearError("name")}
                    />
                    <Field
                      label="Email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      error={errors.email}
                      onChange={() => clearError("email")}
                    />
                  </div>
                  <div className="mt-4">
                    <Field
                      label="Subject"
                      name="subject"
                      placeholder="How can I help you?"
                      error={errors.subject}
                      onChange={() => clearError("subject")}
                    />
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
                      rows={5}
                      placeholder="Tell me what you'd like to discuss, ask, or build..."
                      aria-invalid={errors.message ? true : undefined}
                      aria-describedby={errors.message ? "message-error" : undefined}
                      onChange={() => clearError("message")}
                      className={`mt-2 w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:bg-white/[0.05] ${
                        errors.message
                          ? "border-rose-400/60 focus:border-rose-400/60"
                          : "border-white/10 focus:border-cyan-accent/50"
                      }`}
                    />
                    {errors.message && (
                      <p
                        id="message-error"
                        role="alert"
                        className="mt-1.5 text-xs text-rose-400"
                      >
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-5 py-3 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_rgba(6,182,212,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_50px_-8px_rgba(6,182,212,0.75)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="sr-only" role="status" aria-live="polite">
                    {status === "sending" ? "Sending your message." : ""}
                  </p>
                </>
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
  error,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  onChange?: () => void;
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
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        onChange={onChange}
        className={`mt-2 w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:bg-white/[0.05] ${
          error
            ? "border-rose-400/60 focus:border-rose-400/60"
            : "border-white/10 focus:border-cyan-accent/50"
        }`}
      />
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="mt-1.5 text-xs text-rose-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function SubmissionStatus({
  variant,
  onReset,
}: {
  variant: "success" | "error";
  onReset: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const isSuccess = variant === "success";
  const Icon = isSuccess ? Check : TriangleAlert;
  const title = isSuccess
    ? "Message sent successfully"
    : "Couldn't send your message";
  const body = isSuccess
    ? "Thanks for reaching out.\nI'll get back to you soon."
    : "Something went wrong while sending your message.\nPlease try again.";
  const action = isSuccess ? "Send another message" : "Try Again";

  const popIn = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.6 },
        animate: { opacity: 1, scale: 1 },
      };
  const fadeUp = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
      };
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <div
      ref={panelRef}
      role={isSuccess ? "status" : "alert"}
      tabIndex={-1}
      className="flex min-h-[320px] flex-1 flex-col items-center justify-center px-2 py-10 text-center outline-none"
    >
      <motion.div
        {...popIn}
        transition={{ duration: 0.3, ease }}
        className={`flex h-14 w-14 items-center justify-center rounded-full border ${
          isSuccess
            ? "border-cyan-accent/25 bg-cyan-accent/10"
            : "border-rose-400/25 bg-rose-400/10"
        }`}
      >
        <Icon
          className={`h-6 w-6 ${isSuccess ? "text-cyan-accent" : "text-rose-400"}`}
          strokeWidth={2.25}
        />
      </motion.div>

      <motion.h3
        {...fadeUp}
        transition={{ duration: 0.3, ease, delay: 0.08 }}
        className="mt-5 text-lg font-semibold tracking-tight text-foreground"
      >
        {title}
      </motion.h3>

      <motion.p
        {...fadeUp}
        transition={{ duration: 0.3, ease, delay: 0.16 }}
        className="mt-2 max-w-xs whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
      >
        {body}
      </motion.p>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, ease, delay: 0.24 }}
        className="mt-7"
      >
        <button
          type="button"
          onClick={onReset}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
            isSuccess
              ? "border border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent hover:bg-cyan-accent/20"
              : "border border-rose-400/30 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"
          }`}
        >
          {action}
        </button>
      </motion.div>
    </div>
  );
}

const exploreLinks = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Let's Talk", href: "#contact" },
];

const engineeringLinks = [
  { label: "Architecture", href: "#architecture" },
  { label: "Skills", href: "#skills" },
  { label: "Certifications", href: "#certifications" },
  { label: "Open Source", href: "#github" },
];

const footerReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px 0px 0px" },
} as const;

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 pt-14 pb-8 mt-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:gap-8">
          {/* Identity */}
          <motion.div
            {...footerReveal}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
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

          <FooterGroup title="Explore" links={exploreLinks} delay={0.08} />
          <FooterGroup title="Engineering" links={engineeringLinks} delay={0.14} />

          {/* Social / actions */}
          <motion.div
            {...footerReveal}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2,
            }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
              Connect
            </h3>
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
                href="#home"
                aria-label="Back to top"
                className="social-btn group flex h-10 w-10 items-center justify-center rounded-xl glass"
              >
                <ArrowUp className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-cyan-accent" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Footer meta row */}
        <div className="mt-10 border-t border-white/5 pt-6">
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

function FooterGroup({
  title,
  links,
  delay,
}: {
  title: string;
  links: { label: string; href: string }[];
  delay: number;
}) {
  return (
    <motion.nav
      aria-label={title}
      {...footerReveal}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
      className="flex flex-col gap-4"
    >
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="footer-link text-sm">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
