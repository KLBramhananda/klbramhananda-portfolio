import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Bot,
  Cpu,
  MessageSquareReply,
  Mic,
  Radio,
  Send,
  Sparkles,
  Square,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { respondToLabQuery } from "../lib/lab-brain";

/**
 * Talk to AI — optional voice + text interaction with the AI Lab.
 *
 * Uses the browser's Web Speech API where available. The microphone is never
 * activated automatically — it only starts after an explicit click. When speech
 * recognition is unavailable, the panel falls back to text input. All answers
 * come from the local, deterministic `lab-brain`; no audio is stored or
 * transmitted by this app (the browser may use its own cloud recognition).
 */

const PROCESS_MS = 1200;

const UNSUPPORTED_MSG =
  "Voice interaction is not supported in this browser. Use text input instead.";

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "Microphone permission was denied. Allow access in your browser, or use the text field below.",
  "service-not-allowed":
    "Microphone access is disabled. Allow it in your browser, or use the text field below.",
  "no-speech": "No speech was detected. Try again, or use text input.",
  "audio-capture": "No microphone was found on this device.",
  network: "Speech recognition needs a network connection. Use text input instead.",
  aborted: "",
};

type RecognitionEventLike = {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
};

type RecognitionErrorLike = { error: string; message?: string };

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Phase = "idle" | "listening" | "processing" | "done";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  module?: string;
  hint?: string;
};

type FlowNode = {
  icon: LucideIcon;
  off: string;
  on: string;
};

const FLOW: FlowNode[] = [
  { icon: Mic, off: "Text Input", on: "Voice Input" },
  { icon: AudioLines, off: "Input Parsed", on: "Speech Recognition" },
  { icon: Cpu, off: "AI Lab Processing", on: "AI Lab Processing" },
  { icon: MessageSquareReply, off: "Response", on: "Response" },
];

const PROMPTS = [
  "How healthy are the systems?",
  "Check inventory",
  "What is RAG?",
  "Crank up the traffic",
];

function nodeStatus(phase: Phase, index: number): "todo" | "active" | "done" {
  if (phase === "idle") return index === 0 ? "active" : "todo";
  if (phase === "listening") return index <= 1 ? "active" : "todo";
  if (phase === "processing") {
    if (index < 2) return "done";
    return index === 2 ? "active" : "todo";
  }
  return "done";
}

export function VoiceChat({ online = false }: { online?: boolean }) {
  const [supported] = useState<boolean>(() => getRecognitionCtor() !== null);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const busyRef = useRef(false);
  const activeRef = useRef(false);
  const interimRef = useRef("");
  const idRef = useRef(1);
  const submitTimerRef = useRef<number | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<Message[]>([]);

  const submitQuery = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setInput("");
    setInterim("");
    interimRef.current = "";
    setNotice(null);
    setHistory((prev) => [...prev, { id: idRef.current++, role: "user", text }]);
    setPhase("processing");
    if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
    submitTimerRef.current = window.setTimeout(() => {
      const reply = respondToLabQuery(text);
      setHistory((prev) => [
        ...prev,
        {
          id: idRef.current++,
          role: "assistant",
          text: reply.text,
          module: reply.module,
          hint: reply.hint,
        },
      ]);
      setPhase("done");
      busyRef.current = false;
      setBusy(false);
    }, PROCESS_MS);
  }, []);

  const handleResult = useCallback(
    (event: RecognitionEventLike) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        text += result[0].transcript;
        if (result.isFinal) {
          const finalText = text;
          interimRef.current = "";
          setInterim("");
          submitQuery(finalText);
          return;
        }
      }
      interimRef.current = text;
      setInterim(text);
    },
    [submitQuery],
  );

  const handleError = useCallback((event: RecognitionErrorLike) => {
    const code = event.error;
    if (code === "aborted") return;
    setNotice(ERROR_MESSAGES[code] ?? "Speech recognition stopped unexpectedly. Try again, or use text input.");
    activeRef.current = false;
    setListening(false);
    setPhase("idle");
  }, []);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      activeRef.current = true;
      setListening(true);
      setPhase("listening");
    };
    rec.onend = () => {
      activeRef.current = false;
      setListening(false);
    };
    rec.onresult = (event) => handleResult(event);
    rec.onerror = (event) => handleError(event);
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    };
  }, [handleResult, handleError]);

  useEffect(
    () => () => {
      if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, phase]);

  const startListening = () => {
    const rec = recognitionRef.current;
    if (!rec || busyRef.current || activeRef.current) return;
    setInterim("");
    interimRef.current = "";
    setNotice(null);
    setPhase("listening");
    try {
      rec.start();
    } catch {
      activeRef.current = false;
      setListening(false);
      setPhase("idle");
      setNotice("Could not start the microphone.");
    }
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    const partial = interimRef.current.trim();
    activeRef.current = false;
    setListening(false);
    if (partial) {
      setInterim("");
      interimRef.current = "";
      submitQuery(partial);
    } else {
      setPhase("idle");
    }
    try {
      rec.stop();
    } catch {
      /* noop */
    }
  };

  const toggleMic = () => {
    if (listening) stopListening();
    else startListening();
  };

  const handleSend = () => {
    if (busy) return;
    submitQuery(input);
  };

  return (
    <section
      id="talk-to-ai"
      aria-label="Talk to AI — voice and text interaction"
      className="ai-lab-raise ai-lab-panel ai-lab-panel--expt mt-10"
    >
      <div className="ai-lab-panel-head">
        <div className="flex min-w-0 items-center gap-3">
          <span className="ai-lab-tools-composer__title">
            <Mic className="h-4 w-4" strokeWidth={1.75} />
            Talk to AI
          </span>
          <span className="ai-lab-divider hidden sm:block" />
          <span className="ai-lab-value hidden text-muted-foreground sm:block">
            VOX / 09 — Voice interaction
          </span>
        </div>
        <span
          className={`ai-lab-chip${online ? " ai-lab-chip--online" : " ai-lab-chip--green"}`}
        >
          <span
            className={`ai-lab-dot ${
              online ? "ai-lab-dot--green" : "ai-lab-dot--amber"
            }`}
          />
          {online ? (supported ? "Voice ready" : "Text mode") : "Standby"}
        </span>
      </div>

      <div className="ai-lab-vox-grid">
        <div className="ai-lab-vox-main">
          <div className="ai-lab-vox-flow" role="list" aria-label="Talk to AI pipeline">
            {FLOW.map((node, i) => {
              const Icon = node.icon;
              const status = nodeStatus(phase, i);
              const label = supported ? node.on : node.off;
              return (
                <div
                  key={node.on}
                  className={`ai-lab-vox-flow__node ai-lab-vox-flow__node--${status}`}
                >
                  <span className="ai-lab-vox-flow__chip">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="ai-lab-vox-flow__label">{label}</span>
                </div>
              );
            })}
          </div>

          <div className="ai-lab-vox-console">
            <div ref={logRef} className="ai-lab-vox-log" aria-live="polite">
              {history.length === 0 ? (
                <div className="ai-lab-vox-empty">
                  <span className="ai-lab-vox-empty__icon">
                    <Bot className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <p>
                    Ask me anything — experiments, the agent,
                    <br />
                    or system status. Tap the mic or type below.
                  </p>
                </div>
              ) : (
                history.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} className="ai-lab-vox-msg ai-lab-vox-msg--user">
                      <p>{msg.text}</p>
                    </div>
                  ) : (
                    <div key={msg.id} className="ai-lab-vox-msg ai-lab-vox-msg--ai">
                      <span className="ai-lab-vox-msg__tag">RK-01</span>
                      <p>{msg.text}</p>
                      <span className="ai-lab-vox-msg__foot">
                        <span className="ai-lab-vox-msg__module">MOD/{msg.module}</span>
                        {msg.hint && <span className="ai-lab-vox-msg__hint">{msg.hint}</span>}
                      </span>
                    </div>
                  ),
                )
              )}
              {phase === "processing" && (
                <div className="ai-lab-vox-msg ai-lab-vox-msg--ai ai-lab-vox-msg--typing">
                  <span className="ai-lab-vox-msg__tag">RK-01</span>
                  <span className="ai-lab-vox-typing" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              )}
            </div>
          </div>

          {supported && phase === "listening" && (
            <div className="ai-lab-vox-live" aria-live="polite">
              <span className="ai-lab-vox-live__tag">LIVE · HEARING</span>
              <p>{interim || "Listening…"}</p>
            </div>
          )}

          {notice && (
            <div className="ai-lab-vox-notice" role="status">
              <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {notice}
            </div>
          )}
          {!supported && (
            <div className="ai-lab-vox-notice ai-lab-vox-notice--muted" role="status">
              <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {UNSUPPORTED_MSG}
            </div>
          )}

          <div className="ai-lab-vox-ctrl">
            <div className="ai-lab-tools-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={supported ? "Or type a question…" : "Type a question…"}
                aria-label="Text input for the AI lab"
                className="ai-lab-tools-input__field"
                disabled={busy}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={busy || input.trim() === ""}
                className="ai-lab-tools-input__run"
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
                Ask
              </button>
            </div>

            {supported && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={busy}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                className={`ai-lab-vox-mic${listening ? " is-live" : ""}`}
              >
                <span className="ai-lab-vox-mic__ring" aria-hidden />
                {listening ? (
                  <Square className="h-4 w-4" strokeWidth={2.25} fill="currentColor" />
                ) : (
                  <Mic className="h-4 w-4" strokeWidth={2} />
                )}
                <span className="ai-lab-vox-mic__label">
                  {listening ? "Stop" : "Tap to talk"}
                </span>
              </button>
            )}
          </div>
        </div>

        <aside className="ai-lab-vox-side ai-lab-expt-rag-side">
          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Radio className="h-3.5 w-3.5" strokeWidth={1.75} />
                Session
              </span>
              <span className="ai-lab-tools-console__id">LOCAL</span>
            </header>
            <dl className="ai-lab-tools-console__rows">
              <div className="ai-lab-tools-console__row">
                <dt>Input</dt>
                <dd>{supported ? "Voice + text" : "Text only"}</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>Recognition</dt>
                <dd>{supported ? "Browser API" : "Unavailable"}</dd>
              </div>
              <div className="ai-lab-tools-console__row">
                <dt>Engine</dt>
                <dd>Local synthetic</dd>
              </div>
              <div className="ai-lab-tools-console__row ai-lab-tools-console__row--result">
                <dt>Mic</dt>
                <dd>{listening ? "ACTIVE" : "OFF"}</dd>
              </div>
            </dl>
          </div>

          <div className="ai-lab-tools-console">
            <header className="ai-lab-tools-console__head">
              <span className="ai-lab-tools-console__title">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                Try asking
              </span>
              <span className="ai-lab-tools-console__id">PROMPTS</span>
            </header>
            <div className="ai-lab-vox-prompts">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitQuery(prompt)}
                  disabled={busy}
                  className="ai-lab-tools-preset"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <p className="ai-lab-tools-note">
            Audio stays in your browser — nothing is stored or transmitted. Voice
            is optional and never starts on its own.
          </p>
        </aside>
      </div>
    </section>
  );
}