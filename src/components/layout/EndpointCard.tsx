import { useEffect, useRef, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import { usePointerTilt } from "../effects/use-pointer-tilt";

export interface Channel {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  external: boolean;
}

type Kind = "email" | "phone" | "link";

const ROUTES: Record<string, { route: string; kind: Kind; aria: string }> = {
  Email: { route: "/email", kind: "email", aria: "Copy email address" },
  Phone: { route: "/phone", kind: "phone", aria: "Reveal phone number" },
  LinkedIn: { route: "/linkedin", kind: "link", aria: "Open LinkedIn profile in a new tab" },
  GitHub: { route: "/github", kind: "link", aria: "Open GitHub profile in a new tab" },
};

const COPIED_MS = 1500;

/**
 * A contact channel presented as an API endpoint: a green GET tag, the mono
 * route, a label and a response preview (`200 OK · …`) that fades in on
 * hover / focus (opacity only; its line is always reserved, so nothing
 * shifts). Email copies on click, Phone stays out of the DOM until clicked and
 * then becomes a tel: link, LinkedIn / GitHub open in a new tab. The wrapper
 * tilts and glows on fine pointers (usePointerTilt is off on touch and under
 * reduced motion); the inner element is the real button / link.
 */
export function EndpointCard({ channel }: { channel: Channel }) {
  const meta = ROUTES[channel.label];
  const [tiltRef, tiltStyle] = usePointerTilt<HTMLDivElement>(4, { local: true });
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const timer = useRef(0);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const Icon = channel.icon;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // After the phone card swaps from a button to a link, keep keyboard focus on it.
  useEffect(() => {
    if (revealed) linkRef.current?.focus();
  }, [revealed]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(channel.value);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // Clipboard unavailable (insecure context, denied): open the mail client.
      window.location.href = channel.href;
    }
  };

  const preview = meta.kind === "phone" && !revealed ? "200 OK · click to reveal" : `200 OK · ${channel.value}`;
  const label =
    meta.kind === "phone" && revealed ? channel.value : meta.kind === "email" && copied ? "Copied ✓" : channel.label;

  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">
            GET
          </span>
          <span className="font-mono text-sm text-foreground">{meta.route}</span>
        </span>
        <span className="mt-0.5 block truncate text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <span aria-hidden className="api-preview mt-0.5 block truncate font-mono text-[0.6875rem] text-cyan-accent">
          {preview}
        </span>
      </span>
    </>
  );
  const hit = "api-hit flex min-h-[3.5rem] w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left";

  return (
    <motion.div ref={tiltRef} style={tiltStyle} className="api-card glass relative rounded-2xl">
      <span aria-hidden className="api-glow" />
      {meta.kind === "link" ? (
        <a href={channel.href} target="_blank" rel="noopener noreferrer" aria-label={meta.aria} className={hit}>
          {inner}
        </a>
      ) : meta.kind === "phone" && revealed ? (
        <a ref={linkRef} href={channel.href} aria-label={`Call ${channel.value}`} className={hit}>
          {inner}
        </a>
      ) : (
        <button
          type="button"
          aria-label={meta.aria}
          onClick={meta.kind === "email" ? copy : () => setRevealed(true)}
          className={hit}
        >
          {inner}
        </button>
      )}
      {/* Announcements for the copy and reveal actions. The number only enters
          the DOM here and in the card, after the click. */}
      <span className="sr-only" role="status" aria-live="polite">
        {meta.kind === "email" && copied ? "Email address copied to clipboard" : ""}
        {meta.kind === "phone" && revealed ? `Phone number revealed: ${channel.value}` : ""}
      </span>
    </motion.div>
  );
}
