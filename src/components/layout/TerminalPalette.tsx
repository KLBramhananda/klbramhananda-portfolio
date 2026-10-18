import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { useRouter } from "@tanstack/react-router";
import { useTheme } from "@/lib/theme";
import { lockSpy, scrollToSection, sectionForPath } from "@/lib/sections";
import { channels } from "./contact-footer";

interface Line {
  id: number;
  kind: "cmd" | "out" | "err";
  text: string;
}

// command -> section path (matches the site's existing section URLs)
const SECTION_COMMANDS: Record<string, string> = {
  about: "about",
  experience: "experience",
  projects: "projects",
  skills: "skills",
  stack: "stack",
  opensource: "open-source",
  certs: "certifications",
  contact: "contact",
};

const OTHER_COMMANDS = ["help", "github", "linkedin", "email", "theme", "clear", "exit"];
const EGG = ["hire bramha", "sudo hire bramha"];
const ALL_COMMANDS = [...Object.keys(SECTION_COMMANDS), ...OTHER_COMMANDS, ...EGG];
const CHIPS = ["help", "about", "projects", "skills", "contact", "github", "theme", "clear"];

const HELP = [
  "Navigate:  about · experience · projects · skills · stack · opensource · certs · contact",
  "Links:     github · linkedin · email",
  "Other:     theme · clear · exit · help",
];

const channelHref = (label: string) => channels.find((c) => c.label === label)?.href;

export default function TerminalPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { toggleTheme, resolvedTheme } = useTheme();
  const reduced = useReducedMotion();
  const [lines, setLines] = useState<Line[]>([
    { id: 0, kind: "out", text: "Type 'help' to see the available commands." },
  ]);
  const [input, setInput] = useState("");
  const nextId = useRef(1);
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const print = (kind: Line["kind"], ...texts: string[]) =>
    setLines((prev) => [...prev, ...texts.map((text) => ({ id: nextId.current++, kind, text }))]);

  const goToSection = async (path: string) => {
    const section = sectionForPath(`/${path}`);
    if (!section) return;
    lockSpy(1200, false, section.id);
    if (sectionForPath(router.state.location.pathname)?.id !== section.id) {
      await router.navigate({ to: "/$section", params: { section: section.path }, resetScroll: false });
    }
    scrollToSection(section.id, reduced ? "auto" : "smooth");
  };

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!cmd) return;
    print("cmd", raw.trim());
    history.current.push(raw.trim());
    cursor.current = -1;

    if (cmd in SECTION_COMMANDS) {
      void goToSection(SECTION_COMMANDS[cmd]);
      onClose();
      return;
    }
    switch (cmd) {
      case "help":
        print("out", ...HELP);
        break;
      case "github":
      case "linkedin": {
        const href = channelHref(cmd === "github" ? "GitHub" : "LinkedIn");
        if (href) window.open(href, "_blank", "noopener,noreferrer");
        print("out", `Opening ${cmd}…`);
        break;
      }
      case "email": {
        const href = channelHref("Email");
        if (href) window.location.href = href;
        print("out", "Opening your mail client…");
        break;
      }
      case "theme":
        toggleTheme();
        print("out", `Switched to ${resolvedTheme === "dark" ? "light" : "dark"} theme.`);
        break;
      case "clear":
        setLines([]);
        break;
      case "exit":
        onClose();
        break;
      case "hire bramha":
      case "sudo hire bramha":
        void goToSection("contact");
        print("out", "Great choice. Let's talk.");
        window.setTimeout(onClose, 1400);
        break;
      default:
        print("err", `command not found: ${cmd} — type 'help'`);
    }
  };

  const complete = () => {
    const value = input.trim().toLowerCase();
    if (!value) return;
    const matches = ALL_COMMANDS.filter((c) => c.startsWith(value));
    if (matches.length === 1) {
      setInput(matches[0]);
    } else if (matches.length > 1) {
      let prefix = matches[0];
      for (const m of matches) while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
      setInput(prefix);
      print("out", matches.join("  "));
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run(input);
      setInput("");
    } else if (e.key === "Tab" && !e.shiftKey && input.trim()) {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      cursor.current =
        e.key === "ArrowUp"
          ? Math.min(cursor.current + 1, h.length - 1)
          : Math.max(cursor.current - 1, -1);
      setInput(cursor.current === -1 ? "" : h[h.length - 1 - cursor.current]);
    }
  };

  // Escape closes; Tab stays inside the dialog.
  const onPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Tab" && !(e.target === inputRef.current && !e.shiftKey && input.trim())) {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>("button, input");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-black/45 p-0 sm:p-4 sm:pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Terminal"
        onKeyDown={onPanelKeyDown}
        className="glass-strong flex max-h-[85vh] w-full flex-col overflow-hidden rounded-none shadow-[var(--shadow-terminal)] sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center gap-1.5 border-b border-slate-900/10 px-3 py-2 dark:border-white/10">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 truncate font-mono text-[0.625rem] text-muted-foreground">
            bramha@portfolio — terminal
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md px-2 py-0.5 font-mono text-[0.625rem] text-muted-foreground transition-colors hover:text-foreground"
          >
            esc
          </button>
        </div>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          className="min-h-[9rem] flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed"
        >
          {lines.map((l) => (
            <div
              key={l.id}
              className={
                l.kind === "cmd"
                  ? "text-foreground"
                  : l.kind === "err"
                    ? "text-rose-600 dark:text-rose-300"
                    : "text-muted-foreground"
              }
            >
              {l.kind === "cmd" && <span className="text-cyan-accent">bramha@portfolio:~$ </span>}
              <span className="whitespace-pre-wrap">{l.text}</span>
            </div>
          ))}
        </div>

        <label className="flex items-center gap-2 border-t border-slate-900/10 px-4 py-3 font-mono text-xs dark:border-white/10">
          <span aria-hidden className="shrink-0 text-cyan-accent">
            bramha@portfolio:~$
          </span>
          <span className="sr-only">Command</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60"
            placeholder="type a command…"
          />
        </label>

        <div className="flex flex-wrap gap-1.5 border-t border-slate-900/10 px-4 py-3 dark:border-white/10">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                run(c);
                inputRef.current?.focus();
              }}
              className="rounded-full border border-slate-900/10 bg-slate-900/[0.04] px-2.5 py-1 font-mono text-[0.625rem] text-foreground/80 transition-colors hover:border-cyan-accent/40 hover:text-cyan-accent dark:border-white/10 dark:bg-white/[0.03]"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
