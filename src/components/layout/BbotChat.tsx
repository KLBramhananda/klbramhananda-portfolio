import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ERROR_TEXT,
  FIELDS,
  MESSAGE_MAX,
  NEXT,
  QUESTION,
  REVIEW_TEXT,
  SENT_TEXT,
  SUBJECT_CHIPS,
  fieldError,
  friendlyError,
  prompt,
  stepFor,
  type FieldName,
  type Step,
  type Values,
} from "./chat-flow";
import { mailtoFor, type ContactSession } from "./RequestBuilder";

interface Msg {
  id: number;
  from: "bot" | "you";
  text: string;
  /** A snapshot of the answers, for the review card. */
  review?: Values;
}

const FIELD_LABEL: Record<FieldName, string> = { name: "Name", email: "Email", subject: "Subject", message: "Message" };

const chipCls =
  "min-h-[2rem] rounded-full border border-cyan-accent/30 bg-cyan-accent/10 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-cyan-accent/20 disabled:cursor-not-allowed disabled:opacity-60 [@media(pointer:coarse)]:min-h-[44px]";
const primaryCls =
  "inline-flex min-h-[2.25rem] items-center justify-center rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-4 py-1.5 text-xs font-semibold text-background disabled:cursor-not-allowed disabled:opacity-70 [@media(pointer:coarse)]:min-h-[44px]";
const ghostCls =
  "inline-flex min-h-[2.25rem] items-center justify-center rounded-xl border border-slate-900/15 bg-slate-900/[0.04] px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-slate-900/[0.08] dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] [@media(pointer:coarse)]:min-h-[44px]";

/**
 * The default way to write to Bramha: a scripted chat with B-Bot. Each step
 * validates the answer with the classic form's rules, B-Bot "types" for about
 * 600 ms before every message, and the send itself goes through the shared
 * session (the same real-status, real-latency path as the classic form).
 */
export function BbotChat({ session, active, email }: { session: ContactSession; active: boolean; email: string }) {
  const reduced = useReducedMotion() ?? false;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>("name");
  const [typing, setTyping] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const timers = useRef<number[]>([]);
  const ids = useRef(0);
  const started = useRef(false);
  const engaged = useRef(false);
  const returnToReview = useRef(false);
  const stepRef = useRef<Step>("name");
  const valuesRef = useRef(session.values);

  useEffect(() => {
    stepRef.current = step;
    valuesRef.current = session.values;
  });
  // Unmount (and React StrictMode's simulated unmount): drop pending timers and let the greeting run again.
  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach((id) => window.clearTimeout(id));
      t.length = 0;
      started.current = false;
    };
  }, []);

  const add = useCallback((m: Omit<Msg, "id">) => setMsgs((prev) => [...prev, { ...m, id: ++ids.current }]), []);

  /** B-Bot "types" (three dots, ~600 ms, none under reduced motion), then each message appears. */
  const say = useCallback(
    (texts: string[], review?: Values) => {
      const run = (i: number) => {
        if (i >= texts.length) {
          setTyping(false);
          return;
        }
        setTyping(true);
        const delay = reduced ? 0 : 500 + Math.round(Math.random() * 200);
        timers.current.push(
          window.setTimeout(() => {
            add({ from: "bot", text: texts[i], review: i === texts.length - 1 ? review : undefined });
            run(i + 1);
          }, delay),
        );
      };
      run(0);
    },
    [add, reduced],
  );

  const goReview = useCallback(
    (lead: string = REVIEW_TEXT) => {
      setStep("review");
      say([lead], { ...valuesRef.current });
    },
    [say],
  );

  // Greets when the chat first becomes active.
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    say([prompt("name", "")]);
  }, [active, say]);

  // Returning from the classic form: pick up where the answers actually are.
  useEffect(() => {
    if (!active || !started.current) return;
    const s = stepRef.current;
    if (s !== "review" && !FIELDS.includes(s as FieldName)) return;
    const want = stepFor(valuesRef.current);
    if (want === s) return;
    if (want === "review") goReview("Got it — I've kept what you filled in. Here's what I'll send:");
    else {
      setStep(want);
      say([prompt(want, valuesRef.current.name)]);
    }
  }, [active, goReview, say]);

  // The result of any send (chat or classic form) shows up here.
  const { subscribe } = session;
  useEffect(
    () =>
      subscribe((ok) => {
        setStep(ok ? "done" : "error");
        say([ok ? SENT_TEXT : ERROR_TEXT]);
      }),
    [subscribe, say],
  );

  // Keep the newest message in view: only the log scrolls, never the page.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [msgs.length, typing, step, editing, reduced]);

  const isField = FIELDS.includes(step as FieldName);
  const field = isField ? (step as FieldName) : null;

  // Focus stays on the input after each step (once the visitor has started using it).
  useEffect(() => {
    if (active && engaged.current && field && !typing) inputRef.current?.focus({ preventScroll: true });
  }, [active, field, typing, msgs.length]);

  const answer = (raw: string) => {
    if (!field || typing) return;
    const text = raw.trim();
    if (!text) return;
    engaged.current = true;
    add({ from: "you", text });
    setDraft("");
    if (fieldError(field, text)) {
      say([friendlyError(field, text)]);
      return;
    }
    session.setField(field, text);
    const merged = { ...valuesRef.current, [field]: text };
    valuesRef.current = merged;
    if (returnToReview.current) {
      returnToReview.current = false;
      goReview("Updated. Here's what I'll send:");
      return;
    }
    const next = NEXT[field];
    if (next === "review") goReview();
    else {
      setStep(next);
      say([prompt(next, merged.name)]);
    }
  };

  const onSend = async () => {
    setStep("sending");
    const r = await session.submit();
    if (r !== "done") {
      setStep("review");
      say(r === "blocked" ? ["Hang on — I just sent one. Give it a moment."] : ["I still need a valid answer for every field."]);
    }
  };
  const onEdit = () => {
    setEditing(true);
    say(["Which one would you like to change?"]);
  };
  const editField = (f: FieldName) => {
    setEditing(false);
    returnToReview.current = true;
    setStep(f);
    say([`What should the ${f} be?`]);
  };
  const restart = () => {
    session.clearConsole();
    returnToReview.current = false;
    setStep("name");
    say([prompt("name", "")]);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    // The message step is a textarea: Shift+Enter makes a new line, Enter sends the answer.
    if (e.shiftKey && field === "message") return;
    e.preventDefault();
    answer(draft);
  };

  const waiting = session.cooldown > 0;
  const placeholder = field ? "Type your answer…" : step === "sending" ? "Sending…" : "Use the buttons above";

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      onPointerDownCapture={() => (engaged.current = true)}
      onKeyDownCapture={() => (engaged.current = true)}
      onFocusCapture={(e) => {
        if (e.target === inputRef.current) window.dispatchEvent(new CustomEvent("bbot:listening", { detail: true }));
      }}
      onBlurCapture={(e) => {
        if (e.target === inputRef.current) window.dispatchEvent(new CustomEvent("bbot:listening", { detail: false }));
      }}
    >
      {/* The conversation */}
      <div ref={logRef} role="log" aria-live="polite" aria-label="Chat with B-Bot" className="chat-log min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.from === "you"
                  ? "rounded-br-md bg-gradient-to-r from-cyan-accent/25 to-blue-accent/25 text-foreground"
                  : "rounded-bl-md border border-slate-900/10 bg-slate-900/[0.05] text-foreground dark:border-white/10 dark:bg-white/[0.05]"
              }`}
            >
              {m.from === "bot" && <span className="sr-only">B-Bot: </span>}
              {m.text}
              {m.review && (
                <dl className="mt-2 space-y-1 rounded-xl border border-slate-900/10 bg-slate-900/[0.04] p-2.5 text-xs dark:border-white/10 dark:bg-white/[0.04]">
                  {FIELDS.map((f) => (
                    <div key={f} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                      <dt className="text-muted-foreground">{FIELD_LABEL[f]}</dt>
                      <dd className="line-clamp-3 break-words text-foreground">{m.review?.[f]}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div aria-hidden className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md border border-slate-900/10 bg-slate-900/[0.05] px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.05]">
              <span className="chat-dot" />
              <span className="chat-dot" style={{ animationDelay: "0.15s" }} />
              <span className="chat-dot" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick replies and actions */}
      <div className="mt-2.5 flex min-h-[2.25rem] flex-wrap items-center gap-2">
        {!typing && step === "subject" &&
          SUBJECT_CHIPS.map((c) => (
            <button key={c} type="button" className={chipCls} onClick={() => answer(c)}>
              {c}
            </button>
          ))}
        {!typing && editing &&
          FIELDS.map((f) => (
            <button key={f} type="button" className={chipCls} onClick={() => editField(f)}>
              {FIELD_LABEL[f]}
            </button>
          ))}
        {!typing && step === "review" && !editing && (
          <>
            <button type="button" className={primaryCls} onClick={onSend} disabled={waiting}>
              {waiting ? `Wait ${session.cooldown}s` : "Send →"}
            </button>
            <button type="button" className={ghostCls} onClick={onEdit}>
              Edit
            </button>
          </>
        )}
        {step === "sending" && <span className="font-mono text-xs text-muted-foreground">Sending…</span>}
        {!typing && step === "error" && (
          <>
            <button type="button" className={primaryCls} onClick={onSend} disabled={session.sending}>
              Try again
            </button>
            <a href={mailtoFor(email, session.values)} className={ghostCls}>
              Email directly
            </a>
          </>
        )}
        {!typing && step === "done" &&
          (waiting ? (
            <span className="font-mono text-xs text-muted-foreground">You can send another in {session.cooldown}s</span>
          ) : (
            <button type="button" className={primaryCls} onClick={restart}>
              Send another
            </button>
          ))}
      </div>

      {/* The answer input: one line, or a textarea for the message */}
      <div className="mt-2">
        <label htmlFor="chat-input" className="flex items-baseline justify-between gap-3 font-mono text-[0.6875rem] tracking-wide text-muted-foreground">
          <span>{field ? QUESTION[field] : "Chat input"}</span>
          {field === "message" && (
            <span className={`tabular-nums ${draft.length > MESSAGE_MAX ? "text-rose-600 dark:text-rose-400" : ""}`}>
              {draft.length} / {MESSAGE_MAX}
            </span>
          )}
        </label>
        <div className="chat-input relative mt-1.5" data-idle={!draft ? "" : undefined}>
          {field === "message" ? (
            <textarea
              id="chat-input"
              ref={(el) => {
                inputRef.current = el;
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              rows={2}
              placeholder={placeholder}
              aria-describedby="chat-hint"
              className="chat-field max-h-24 w-full resize-none rounded-xl border border-slate-900/10 bg-slate-900/[0.04] py-2.5 pr-3 pl-7 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-cyan-accent/50 dark:border-white/10 dark:bg-white/[0.03]"
            />
          ) : (
            <input
              id="chat-input"
              ref={(el) => {
                inputRef.current = el;
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              disabled={!field}
              aria-describedby="chat-hint"
              placeholder={placeholder}
              autoComplete={field === "name" ? "name" : field === "email" ? "email" : "off"}
              inputMode={field === "email" ? "email" : undefined}
              enterKeyHint="send"
              className="chat-field w-full rounded-xl border border-slate-900/10 bg-slate-900/[0.04] py-2.5 pr-3 pl-7 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-cyan-accent/50 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.03]"
            />
          )}
          <span aria-hidden className="api-cursor chat-input__caret">▌</span>
        </div>
        <p id="chat-hint" className="sr-only">
          Press Enter to send your answer{field === "message" ? ". Press Shift and Enter for a new line" : ""}.
        </p>
      </div>
    </div>
  );
}
