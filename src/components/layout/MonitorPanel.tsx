import type { ReactNode, Ref } from "react";
import { motion } from "framer-motion";
import { usePointerTilt } from "../effects/use-pointer-tilt";

/**
 * One "monitor": a glass panel with a thin bezel, a pre-blurred screen glow
 * (its opacity breathes slowly) and a top bar with traffic-light dots, a mono
 * title and optional actions. On desktop the pair is angled toward each other
 * (`rotateY` via `.mon--left` / `.mon--right` inside a 1600px perspective) and
 * each tilts up to 3° more toward the pointer (fine pointers only: the hook is
 * off on touch and under reduced motion). `angled` is off on tablet / mobile.
 */
export function MonitorPanel({
  title,
  side,
  angled,
  actions,
  screenRef,
  children,
}: {
  title: string;
  side: "left" | "right";
  angled: boolean;
  actions?: ReactNode;
  /** The screen element (the packet flies from / to it). */
  screenRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  const [tiltRef, tiltStyle] = usePointerTilt<HTMLDivElement>(angled ? 3 : 0);
  return (
    <div className={`mon ${angled ? `mon--angled mon--${side}` : ""}`}>
      <motion.div ref={tiltRef} style={tiltStyle} className="mon__tilt">
        <span aria-hidden className="mon__glow" />
        <div className="mon__bezel glass-strong">
          <div className="mon__bar">
            <span aria-hidden className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-[0.6875rem] tracking-wide text-muted-foreground">{title}</span>
            {actions}
          </div>
          <div ref={screenRef} className="mon__screen">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
