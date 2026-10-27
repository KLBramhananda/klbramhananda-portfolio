import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import emailjs from "@emailjs/browser";
import { useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ResponseConsole, type ConsoleLine } from "./ResponseConsole";
import { EMPTY, FIELDS, MESSAGE_MAX, firstName, validate, type FieldName, type Values } from "./chat-flow";

// EmailJS: the provider, env variable names and template parameters are unchanged.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const COOLDOWN_S = 30;
const PACKET_MS = 1600;
/** Ghost copies that trail the packet: [delay ms, opacity factor]. */
const TRAIL: [number, number][] = [
  [110, 0.5],
  [220, 0.3],
  [330, 0.15],
];
const PREVIEW_MESSAGE_CHARS = 120;

interface SendResult {
  ok: boolean;
  /** The provider's real HTTP status, when it gave one. */
  status: number | null;
  ms: number;
}

/** Dev-only stand-in for the network call (`?mock=ok|fail|net`); never called in production builds. */
async function mockSend(kind: string, t0: number): Promise<SendResult> {
  await new Promise((r) => setTimeout(r, 380));
  const ms = Math.round(performance.now() - t0);
  if (kind === "ok") return { ok: true, status: 200, ms };
  return { ok: false, status: kind === "fail" ? 400 : null, ms };
}

/** Sends through EmailJS and measures the call with performance.now(). */
async function send(payload: Values): Promise<SendResult> {
  const t0 = performance.now();
  if (import.meta.env.DEV) {
    const mock = new URLSearchParams(window.location.search).get("mock");
    if (mock) return mockSend(mock, t0);
  }
  const done = (ok: boolean, status: number | null): SendResult => ({ ok, status, ms: Math.round(performance.now() - t0) });
  try {
    const res = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { ...payload }, { publicKey: EMAILJS_PUBLIC_KEY });
    return done(true, typeof res.status === "number" && res.status > 0 ? res.status : null);
  } catch (error) {
    const status = (error as { status?: unknown } | null)?.status;
    return done(false, typeof status === "number" && status > 0 ? status : null);
  }
}

export interface ContactSession {
  values: Values;
  setField: (f: FieldName, v: string) => void;
  honeypot: string;
  setHoneypot: Dispatch<SetStateAction<string>>;
  sending: boolean;
  cooldown: number;
  lines: ConsoleLine[];
  failed: boolean;
  valid: boolean;
  submit: () => Promise<"invalid" | "blocked" | "done">;
  clearConsole: () => void;
  /** Called when any send (chat or classic form) finishes; returns the unsubscribe. */
  subscribe: (fn: (ok: boolean) => void) => () => void;
  /** Callback refs for the elements the packet flies between (stage, left screen, console, orb). */
  attach: {
    wrap: (el: HTMLDivElement | null) => void;
    origin: (el: HTMLDivElement | null) => void;
    target: (el: HTMLDivElement | null) => void;
    packet: (el: HTMLSpanElement | null) => void;
    ghost: (i: number) => (el: HTMLSpanElement | null) => void;
  };
}

/**
 * The one send path, shared by the chat and the classic form: the answers, the
 * honeypot, the console, the 30 s cooldown, the no-double-submit guard, the
 * packet flight and the real-status / real-latency lines.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook shared by the chat and the classic form
export function useContactSession({ onStart }: { onStart?: () => void } = {}): ContactSession {
  const reduced = useReducedMotion() ?? false;
  const [values, setValues] = useState<Values>(EMPTY);
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [failed, setFailed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const wrap = useRef<HTMLDivElement | null>(null);
  const origin = useRef<HTMLDivElement | null>(null);
  const target = useRef<HTMLDivElement | null>(null);
  const packet = useRef<HTMLSpanElement | null>(null);
  const ghosts = useRef<(HTMLSpanElement | null)[]>([]);
  const flight = useRef<Animation | null>(null);
  const busy = useRef(false);
  const finished = useRef(false);
  const lineId = useRef(0);
  const listeners = useRef(new Set<(ok: boolean) => void>());

  const attach = useMemo(
    () => ({
      wrap: (el: HTMLDivElement | null) => void (wrap.current = el),
      origin: (el: HTMLDivElement | null) => void (origin.current = el),
      target: (el: HTMLDivElement | null) => void (target.current = el),
      packet: (el: HTMLSpanElement | null) => void (packet.current = el),
      ghost: (i: number) => (el: HTMLSpanElement | null) => void (ghosts.current[i] = el),
    }),
    [],
  );
  const subscribe = useCallback((fn: (ok: boolean) => void) => {
    const set = listeners.current;
    set.add(fn);
    return () => void set.delete(fn);
  }, []);

  const allErrors = useMemo(() => validate(values), [values]);
  const valid = Object.keys(allErrors).length === 0;

  // Cooldown countdown: one timer per second, cleaned up on unmount.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);
  useEffect(
    () => () => {
      flight.current?.cancel();
      ghosts.current.forEach((g) => g?.getAnimations().forEach((a) => a.cancel()));
    },
    [],
  );

  const clearConsole = useCallback(() => {
    finished.current = false;
    setLines([]);
    setFailed(false);
  }, []);

  // A finished request's output never lingers: the first edit after it returns the console to idle.
  const setField = useCallback(
    (f: FieldName, v: string) => {
      setValues((prev) => ({ ...prev, [f]: v }));
      if (finished.current && !busy.current) clearConsole();
    },
    [clearConsole],
  );

  const push = (text: string, tone: ConsoleLine["tone"]) => setLines((prev) => [...prev, { id: ++lineId.current, text, tone }]);

  /** A glowing orb flies from the left monitor to the console: transform + opacity only. */
  const launchPacket = (done: () => void) => {
    const w = wrap.current;
    const orb = packet.current;
    const to = target.current;
    const from = origin.current;
    if (reduced || !w || !orb || !to || !from) return done();
    const wr = w.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    if (!b.width || !a.width) return done();
    const sx = a.left - wr.left + a.width / 2 - 7;
    const sy = a.top - wr.top + a.height / 2 - 7;
    const ex = b.left - wr.left + b.width / 2 - 7;
    const ey = b.top - wr.top + b.height / 2 - 7;
    const mx = (sx + ex) / 2;
    const my = Math.min(sy, ey) - 64;
    flight.current?.cancel();
    // The same curved path for the packet and its fading ghosts (opacity scaled, delayed).
    const path = (k: number): Keyframe[] => [
      { transform: `translate3d(${sx}px, ${sy}px, 0) scale(1.1) rotateX(0deg)`, opacity: 0, offset: 0 },
      { transform: `translate3d(${sx + (mx - sx) * 0.2}px, ${sy - 10}px, 30px) scale(1) rotateX(10deg)`, opacity: k, offset: 0.12 },
      { transform: `translate3d(${mx}px, ${my}px, 110px) scale(0.8) rotateX(35deg)`, opacity: k, offset: 0.5 },
      { transform: `translate3d(${ex}px, ${ey}px, 0) scale(0.25) rotateX(70deg)`, opacity: 0, offset: 1 },
    ];
    const timing = { duration: PACKET_MS, easing: "ease-in-out", fill: "backwards" } as const;
    TRAIL.forEach(([delay, k], i) => ghosts.current[i]?.animate(path(k), { ...timing, delay }));
    const anim = orb.animate(path(1), timing);
    flight.current = anim;
    // Resolves when the packet has arrived (or was cancelled).
    anim.finished.then(done, done);
  };

  const submit = async () => {
    if (busy.current || cooldown > 0) return "blocked" as const;
    if (!valid) return "invalid" as const;
    busy.current = true;
    finished.current = false;
    setSending(true);
    setFailed(false);
    onStart?.();
    const payload: Values = {
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      message: values.message.trim(),
    };
    const first = firstName(payload.name);
    setLines([{ id: ++lineId.current, text: "⏳ POST /contact … pending", tone: "pending" }]);
    // After a frame, so a panel that opens on send (mobile) has its final position.
    // The result lines wait for the packet to arrive (or the request to finish, whichever is later).
    const arrived = new Promise<void>((resolve) => requestAnimationFrame(() => launchPacket(resolve)));

    const reset = () => {
      setValues(EMPTY);
      setHoneypot("");
      setCooldown(COOLDOWN_S);
    };
    const finish = (ok: boolean) => {
      finished.current = true;
      busy.current = false;
      setSending(false);
      listeners.current.forEach((fn) => fn(ok));
    };

    // Honeypot filled: a bot. Pretend success, send nothing.
    if (honeypot) {
      await arrived;
      push("✓ OK", "ok");
      push(`"Thanks ${first} — I'll reply within 24 h."`, "ok");
      reset();
      finish(true);
      return "done" as const;
    }

    const [res] = await Promise.all([send(payload), arrived]);
    if (res.ok) {
      push(`✓ ${res.status ? `${res.status} ` : ""}OK · ${res.ms} ms`, "ok");
      push(`"Thanks ${first} — I'll reply within 24 h."`, "ok");
      reset();
      window.dispatchEvent(new Event("bbot:happy"));
    } else {
      push(`✕ Request failed · ${res.status ?? "network error"}`, "err");
      setFailed(true);
    }
    finish(res.ok);
    return "done" as const;
  };

  return {
    values,
    setField,
    honeypot,
    setHoneypot,
    sending,
    cooldown,
    lines,
    failed,
    valid,
    submit,
    clearConsole,
    subscribe,
    attach,
  };
}

// eslint-disable-next-line react-refresh/only-export-components -- tiny helper shared with the chat
export const mailtoFor = (email: string, v: Values) =>
  `mailto:${email}?subject=${encodeURIComponent(v.subject.trim())}&body=${encodeURIComponent(v.message.trim())}`;

/** The hidden spam trap: off-screen, out of the tab order, ignored by assistive tech. Present in both modes. */
export function Honeypot({ session }: { session: ContactSession }) {
  return (
    <div aria-hidden className="api-hp">
      <label>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" value={session.honeypot} onChange={(e) => session.setHoneypot(e.target.value)} />
      </label>
    </div>
  );
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

/**
 * The right monitor's content: `request.body` (the live JSON) on top and the
 * response console below. The JSON is decorative (aria-hidden): it repeats the
 * answers.
 */
export function RequestPane({ session, email }: { session: ContactSession; email: string }) {
  const reduced = useReducedMotion() ?? false;
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col" aria-hidden="true">
        <div className="pb-1.5 font-mono text-[0.6875rem] tracking-wide text-muted-foreground">request.body</div>
        <div className="api-box api-json-scroll min-h-0 flex-1 overflow-y-auto rounded-xl px-4 py-3">
          <JsonPreview values={session.values} />
        </div>
      </div>
      <ResponseConsole
        lines={session.lines}
        reduced={reduced}
        innerRef={session.attach.target}
        className="h-[42%] min-h-[7.5rem] flex-none"
      >
        {session.failed && (
          <a
            href={mailtoFor(email, session.values)}
            className="mt-2 inline-flex min-h-[2.5rem] items-center self-start rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-400/20 dark:text-rose-300 [@media(pointer:coarse)]:min-h-[44px]"
          >
            Email me directly
          </a>
        )}
      </ResponseConsole>
    </div>
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
 * The classic form: the same four fields and rules, inline validation on blur
 * and submit, and the full-width Send button after the message field. The
 * `POST /contact` bar is only a label.
 */
export function ClassicForm({ session }: { session: ContactSession }) {
  const { values } = session;
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const allErrors = useMemo(() => validate(values), [values]);
  const shown = (f: FieldName) => (touched[f] || submitted ? allErrors[f] : undefined);
  const set = (f: FieldName) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => session.setField(f, e.target.value);
  const blur = (f: FieldName) => () => setTouched((t) => (t[f] ? t : { ...t, [f]: true }));
  const waiting = session.cooldown > 0;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    const first = FIELDS.find((f) => allErrors[f]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const r = await session.submit();
    if (r === "done") {
      setTouched({});
      setSubmitted(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-busy={session.sending} className="flex min-h-0 flex-col">
      <div className="flex items-center gap-3">
        <span className="rounded-md border border-cyan-accent/40 bg-cyan-accent/15 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-cyan-accent">
          POST
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">/contact</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          rows={4}
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

      <button
        type="submit"
        disabled={session.sending || waiting}
        data-valid={session.valid && !session.sending && !waiting ? "" : undefined}
        className="api-send relative mt-5 inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-5 py-3 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_rgba(6,182,212,0.6)] disabled:cursor-not-allowed disabled:opacity-70 [@media(pointer:coarse)]:min-h-[44px]"
      >
        <span aria-hidden className="api-send__glow" />
        {session.sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : waiting ? (
          `Wait ${session.cooldown}s`
        ) : (
          "Send →"
        )}
      </button>
    </form>
  );
}
