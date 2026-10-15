import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const ROLES = [
  "Software Engineer",
  "Full Stack Engineering",
  "AI Integrations",
  "ERPNext · SAP BTP",
] as const;

const STATIC_LINE = "Software Engineer · Full Stack · AI · ERPNext · SAP BTP";
const SR_LINE = "Software Engineer — Full Stack, AI, ERPNext, SAP BTP";
const LONGEST = ROLES.reduce((a, b) => (b.length > a.length ? b : a));
const HOLD_MS = 2600;
const TURN_MS = 500;
const FACE_HEIGHT = "1.5em";

/**
 * Role line that turns like a 4-sided prism on the X axis. The box is sized by
 * the longest role (no layout shift); screen readers get one static line and
 * the animated part is hidden from them. Reduced motion shows a static line.
 */
export function RoleRotator({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (reduced || !el) return;
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);
    const id = window.setInterval(() => {
      if (visible && !document.hidden) setStep((s) => s + 1);
    }, HOLD_MS);
    return () => {
      window.clearInterval(id);
      observer.disconnect();
    };
  }, [reduced]);

  return (
    <p className={className}>
      <span className="sr-only">{SR_LINE}</span>
      {reduced ? (
        <span aria-hidden>{STATIC_LINE}</span>
      ) : (
        <span
          ref={rootRef}
          aria-hidden
          className="relative inline-block align-top"
          style={{ perspective: "700px", height: FACE_HEIGHT }}
        >
          <span className="invisible block whitespace-nowrap" style={{ height: FACE_HEIGHT }}>
            {LONGEST}
          </span>
          <span
            className="absolute inset-0 block"
            style={{
              transformStyle: "preserve-3d",
              transform: `translateZ(-0.75em) rotateX(${step * 90}deg)`,
              transition: `transform ${TURN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
          >
            {ROLES.map((role, i) => (
              <span
                key={role}
                className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
                style={{
                  backfaceVisibility: "hidden",
                  transform: `rotateX(${-i * 90}deg) translateZ(0.75em)`,
                }}
              >
                {role}
              </span>
            ))}
          </span>
        </span>
      )}
    </p>
  );
}
