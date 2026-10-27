import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ResponseConsole, type ConsoleLine } from "./ResponseConsole";

// EmailJS: the provider, env variable names and template parameters are unchanged.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const FIELDS = ["name", "email", "subject", "message"] as const;
type FieldName = (typeof FIELDS)[number];
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

const EMPTY: Values = { name: "", email: "", subject: "", message: "" };
const COOLDOWN_S = 30;
const PACKET_MS = 700;
const PREVIEW_MESSAGE_CHARS = 120;
const MESSAGE_MAX = 2000;

/** The rules, on trimmed input. */
function validate(v: Values): Errors {
  const e: Errors = {};
  const name = v.name.trim();
  const email = v.email.trim();
  const subject = v.subject.trim();
  const message = v.message.trim();
  if (!name) e.name = "Please enter your name.";
  else if (name.length < 2) e.name = "Name must be at least 2 characters.";
  else if (name.length > 80) e.name = "Name must be 80 characters or fewer.";
  if (!email) e.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address.";
  if (!subject) e.subject = "Please enter a subject.";
  else if (subject.length < 3) e.subject = "Subject must be at least 3 characters.";
  else if (subject.length > 120) e.subject = "Subject must be 120 characters or fewer.";
  if (!message) e.message = "Please write a message.";
  else if (message.length < 20) e.message = `Message must be at least 20 characters (${message.length}/20).`;
  else if (message.length > MESSAGE_MAX) e.message = `Message must be ${MESSAGE_MAX} characters or fewer.`;
  return e;
}

interface SendResult {
  ok: boolean;
  /** The provider's real HTTP status, when it gave one. */
  status: number | null;
  ms: number;
}

/**
 * Sends through EmailJS and measures the call with performance.now(). Only in
 * `vite dev`, `?mock=ok|fail|net` replaces the network call (no email is ever
 * sent); the branch is dead code in production builds.
 */
async function send(payload: Values): Promise<SendResult> {
  const t0 = performance.now();
  const done = (ok: boolean, status: number | null): SendResult => ({ ok, status, ms: Math.round(performance.now() - t0) });
  if (import.meta.env.DEV) {
    const mock = new URLSearchParams(window.location.search).get("mock");
    if (mock) {
      await new Promise((r) => setTimeout(r, 380));
      if (mock === "ok") return done(true, 200);
      return done(false, mock === "fail" ? 400 : null);
    }
  }
  try {
    const res = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { ...payload }, { publicKey: EMAILJS_PUBLIC_KEY });
    return done(true, typeof res.status === "number" && res.status > 0 ? res.status : null);
  } catch (error) {
    const status = (error as { status?: unknown } | null)?.status;
    return done(false, typeof status === "number" && status > 0 ? status : null);
  }
}

// ── JSON preview: JSON.stringify, then hand-tokenized spans (no library) ───
type Tok = { kind: "key" | "str" | "punct" | "plain"; text: string };

function tokenize(json: string): Tok[] {
  const out: Tok[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|([{}[\],])/g;
  let last = 0;
  for (let m = re.exec(json); m; m = re.exec(json)) {
    if (m.index > last) out.push({ kind: "plain", text: json.slice(last, m.index) });
    if (m[1]) {
      out.push({ kind: m[2] ? "key" : "str", text: m[1] });
      if (m[2]) out.push({ kind: "punct", text: m[2] });
    } else out.push({ kind: "punct", text: m[3] });
    last = re.lastIndex;
  }
  if (last < json.length) out.push({ kind: "plain", text: json.slice(last) });
  return out;
}

/** Truncate by code points so an emoji is never cut in half. */
function truncate(s: string, max: number) {
  const chars = Array.from(s);
  return chars.length > max ? chars.slice(0, max).join("") + "…" : s;
}

const TOK_CLASS: Record<Tok["kind"], string> = {
  key: "text-cyan-accent",
  str: "text-emerald-700 dark:text-emerald-300",
  punct: "text-muted-foreground",
  plain: "",
};

function JsonPreview({ values }: { values: Values }) {
  const toks = useMemo(
    () =>
      tokenize(
        JSON.stringify(
          {
            name: values.name.trim(),
            email: values.email.trim(),
            subject: values.subject.trim(),
            message: truncate(values.message.trim(), PREVIEW_MESSAGE_CHARS),
          },
          null,
          2,
        ),
      ),
    [values],
  );
  // React escapes every text node, so nothing the visitor types is ever parsed as HTML.
  return (
    <pre className="api-json whitespace-pre-wrap break-words font-mono text-[0.75rem] leading-relaxed">
      {toks.map((t, i) => (
        <span key={i} className={TOK_CLASS[t.kind]}>
          {t.text}
        </span>
      ))}
    </pre>
  );
}

const inputCls = (error?: string) =>
  `mt-2 w-full rounded-xl border bg-slate-900/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:bg-slate-900/[0.06] dark:bg-white/[0.03] dark:focus:bg-white/[0.05] ${
    error ? "border-rose-400/60 focus:border-rose-400/60" : "border-slate-900/10 focus:border-cyan-accent/50 dark:border-white/10"
  }`;

function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
      {error}
    </p>
  ) : null;
}

/**
 * The Contact form as a request builder: a POST /contact bar, the four fields
 * with inline validation, a live `request.body` JSON preview, and a response
 * console. Spam protection: an off-screen honeypot and a 30 s cooldown.
 */
export function RequestBuilder({ email }: { email: string }) {
  const reduced = useReducedMotion() ?? false;
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [failed, setFailed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [jsonOpen, setJsonOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const jsonRef = useRef<HTMLDivElement | null>(null);
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const packetRef = useRef<HTMLSpanElement | null>(null);
  const flight = useRef<Animation | null>(null);
  const busy = useRef(false);
  const lineId = useRef(0);
  const jsonId = useId();

  const allErrors = useMemo(() => validate(values), [values]);
  const valid = Object.keys(allErrors).length === 0;
  const shown = (f: FieldName) => (touched[f] || submitted ? allErrors[f] : undefined);

  // Cooldown countdown: one timer per second, cleaned up on unmount.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);
  useEffect(() => () => flight.current?.cancel(), []);

  const set = (f: FieldName) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValues((prev) => ({ ...prev, [f]: v }));
  };
  const blur = (f: FieldName) => () => setTouched((t) => (t[f] ? t : { ...t, [f]: true }));

  const push = (text: string, tone: ConsoleLine["tone"]) =>
    setLines((prev) => [...prev, { id: ++lineId.current, text, tone }]);

  /** A glowing orb flies from the JSON panel to the console: transform + opacity only. */
  const launchPacket = () => {
    const wrap = wrapRef.current;
    const orb = packetRef.current;
    const target = consoleRef.current;
    const from = jsonRef.current && jsonRef.current.offsetParent ? jsonRef.current : buttonRef.current;
    if (reduced || !wrap || !orb || !target || !from) return;
    const w = wrap.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const sx = a.left - w.left + a.width / 2 - 7;
    const sy = a.top - w.top + a.height / 2 - 7;
    const ex = b.left - w.left + b.width / 2 - 7;
    const ey = b.top - w.top + b.height / 2 - 7;
    const mx = (sx + ex) / 2 + (ex > sx ? 24 : -24);
    const my = Math.min(sy, ey) - 56;
    flight.current?.cancel();
    flight.current = orb.animate(
      [
        { transform: `translate3d(${sx}px, ${sy}px, 0) scale(1.1) rotateX(0deg)`, opacity: 0, offset: 0 },
        { transform: `translate3d(${sx}px, ${sy - 8}px, 20px) scale(1) rotateX(10deg)`, opacity: 1, offset: 0.12 },
        { transform: `translate3d(${mx}px, ${my}px, 90px) scale(0.8) rotateX(35deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate3d(${ex}px, ${ey}px, 0) scale(0.25) rotateX(70deg)`, opacity: 0, offset: 1 },
      ],
      { duration: PACKET_MS, easing: "cubic-bezier(0.45, 0, 0.35, 1)" },
    );
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy.current || cooldown > 0) return;
    setSubmitted(true);
    if (!valid) {
      const first = FIELDS.find((f) => allErrors[f]);
      if (first) wrapRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    busy.current = true;
    setSending(true);
    setFailed(false);
    const payload: Values = {
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      message: values.message.trim(),
    };
    const first = payload.name.split(/\s+/)[0];
    setLines([{ id: ++lineId.current, text: "⏳ POST /contact … pending", tone: "pending" }]);
    launchPacket();

    const reset = () => {
      setValues(EMPTY);
      setTouched({});
      setSubmitted(false);
      setHoneypot("");
      setCooldown(COOLDOWN_S);
    };

    // Honeypot filled: a bot. Pretend success, send nothing.
    if (honeypot) {
      push("✓ OK", "ok");
      push(`"Thanks ${first} — I'll reply within 24 h."`, "ok");
      reset();
      busy.current = false;
      setSending(false);
      return;
    }

    const res = await send(payload);
    if (res.ok) {
      push(`✓ ${res.status ? `${res.status} ` : ""}OK · ${res.ms} ms`, "ok");
      push(`"Thanks ${first} — I'll reply within 24 h."`, "ok");
      reset();
      window.dispatchEvent(new Event("bbot:happy"));
    } else {
      push(`✕ Request failed · ${res.status ?? "network error"}`, "err");
      setFailed(true);
    }
    busy.current = false;
    setSending(false);
  };

  const mailto = `mailto:${email}?subject=${encodeURIComponent(values.subject.trim())}&body=${encodeURIComponent(values.message.trim())}`;
  const waiting = cooldown > 0;

  return (
    <div ref={wrapRef} className="api-wrap relative glass rounded-3xl p-5 sm:p-6">
      <form onSubmit={onSubmit} noValidate aria-busy={sending}>
        {/* Request bar */}
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-cyan-accent/40 bg-cyan-accent/15 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-cyan-accent">
            POST
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">/contact</span>
          <button
            ref={buttonRef}
            type="submit"
            disabled={sending || waiting}
            data-valid={valid && !sending && !waiting ? "" : undefined}
            className="api-send relative inline-flex min-h-[2.5rem] items-center [@media(pointer:coarse)]:min-h-[44px] justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-5 py-2 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_rgba(6,182,212,0.6)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span aria-hidden className="api-send__glow" />
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : waiting ? (
              `Wait ${cooldown}s`
            ) : (
              "Send →"
            )}
          </button>
        </div>

        {/* Fields */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground">
              Name
            </label>
            <input
              id="name"
              name="name"
              value={values.name}
              onChange={set("name")}
              onBlur={blur("name")}
              required
              placeholder="Your name"
              autoComplete="name"
              aria-invalid={shown("name") ? true : undefined}
              aria-describedby={shown("name") ? "name-error" : undefined}
              className={inputCls(shown("name"))}
            />
            <ErrorText id="name-error" error={shown("name")} />
          </div>
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={set("email")}
              onBlur={blur("email")}
              required
              placeholder="you@company.com"
              autoComplete="email"
              aria-invalid={shown("email") ? true : undefined}
              aria-describedby={shown("email") ? "email-error" : undefined}
              className={inputCls(shown("email"))}
            />
            <ErrorText id="email-error" error={shown("email")} />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="subject" className="text-xs uppercase tracking-widest text-muted-foreground">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            value={values.subject}
            onChange={set("subject")}
            onBlur={blur("subject")}
            required
            placeholder="How can I help you?"
            aria-invalid={shown("subject") ? true : undefined}
            aria-describedby={shown("subject") ? "subject-error" : undefined}
            className={inputCls(shown("subject"))}
          />
          <ErrorText id="subject-error" error={shown("subject")} />
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="message" className="text-xs uppercase tracking-widest text-muted-foreground">
              Message
            </label>
            <span
              id="message-count"
              className={`font-mono text-[0.6875rem] tabular-nums ${values.message.length > MESSAGE_MAX ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
            >
              {values.message.length} / {MESSAGE_MAX}
            </span>
          </div>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={values.message}
            onChange={set("message")}
            onBlur={blur("message")}
            placeholder="Tell me what you'd like to discuss, ask, or build..."
            aria-invalid={shown("message") ? true : undefined}
            aria-describedby={shown("message") ? "message-error message-count" : "message-count"}
            className={inputCls(shown("message"))}
          />
          <ErrorText id="message-error" error={shown("message")} />
        </div>

        {/* Honeypot: off-screen, out of the tab order, ignored by assistive tech. */}
        <div aria-hidden className="api-hp">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>

        {/* Live JSON preview. Decorative: it repeats the fields. */}
        <div className="mt-5">
          <button
            type="button"
            aria-expanded={jsonOpen}
            aria-controls={jsonId}
            onClick={() => setJsonOpen((o) => !o)}
            className="min-h-[44px] rounded-lg font-mono text-xs text-cyan-accent md:hidden"
          >
            {jsonOpen ? "Hide request" : "View request"}
          </button>
          <div id={jsonId} ref={jsonRef} aria-hidden="true" className={jsonOpen ? "" : "max-md:hidden"}>
            <div className="api-json-box rounded-2xl">
              <div className="border-b border-slate-900/10 px-4 py-2 font-mono text-[0.6875rem] tracking-wide text-muted-foreground dark:border-white/10">
                request.body
              </div>
              <div className="api-json-scroll overflow-y-auto px-4 py-3">
                <JsonPreview values={values} />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Response console */}
      <div className="mt-5">
        <ResponseConsole lines={lines} reduced={reduced} innerRef={consoleRef}>
          {failed && (
            <a
              href={mailto}
              className="mt-2 inline-flex min-h-[2.5rem] items-center [@media(pointer:coarse)]:min-h-[44px] self-start rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-400/20 dark:text-rose-300"
            >
              Email me directly
            </a>
          )}
        </ResponseConsole>
      </div>

      {/* The packet: a pre-blurred orb, animated with transform and opacity only. */}
      <span ref={packetRef} aria-hidden className="api-packet" />
    </div>
  );
}
