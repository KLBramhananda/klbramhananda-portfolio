import { useEffect, useRef, useState, type ComponentType } from "react";

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
 * A contact channel as an API endpoint, drawn as a 3D keycap-style tile (the
 * same layered depth, lift, underglow and press as the Skills keycaps, with
 * its own `.api-key*` classes because a tile is block-level). Email copies on
 * click, Phone stays out of the DOM until clicked and then becomes a tel:
 * link, LinkedIn / GitHub open in a new tab. On hover or focus the label
 * crossfades into the `200 OK · …` response preview (opacity only, one
 * reserved line, so nothing shifts).
 */
export function EndpointCard({ channel }: { channel: Channel }) {
  const meta = ROUTES[channel.label];
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const timer = useRef(0);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const Icon = channel.icon;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // After the phone tile swaps from a button to a link, keep keyboard focus on it.
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
      <span aria-hidden className="api-key__glow" />
      <span className="api-key__top">
        <span className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-accent" />
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">
            GET
          </span>
          <span className="min-w-0 truncate font-mono text-sm text-foreground">{meta.route}</span>
        </span>
        <span className="api-key__line">
          <span className="api-key__label truncate text-[0.6875rem] uppercase tracking-widest text-muted-foreground">{label}</span>
          <span aria-hidden className="api-key__resp truncate font-mono text-[0.6875rem] text-cyan-accent">
            {preview}
          </span>
        </span>
      </span>
    </>
  );

  return (
    <div className="relative">
      {meta.kind === "link" ? (
        <a href={channel.href} target="_blank" rel="noopener noreferrer" aria-label={meta.aria} className="api-key">
          {inner}
        </a>
      ) : meta.kind === "phone" && revealed ? (
        <a ref={linkRef} href={channel.href} aria-label={`Call ${channel.value}`} className="api-key">
          {inner}
        </a>
      ) : (
        <button type="button" aria-label={meta.aria} onClick={meta.kind === "email" ? copy : () => setRevealed(true)} className="api-key">
          {inner}
        </button>
      )}
      {/* Announcements for the copy and reveal actions. The number only enters
          the DOM here and in the tile, after the click. */}
      <span className="sr-only" role="status" aria-live="polite">
        {meta.kind === "email" && copied ? "Email address copied to clipboard" : ""}
        {meta.kind === "phone" && revealed ? `Phone number revealed: ${channel.value}` : ""}
      </span>
    </div>
  );
}
