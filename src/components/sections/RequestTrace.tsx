import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export interface Point {
  x: number;
  y: number;
}

/**
 * Centre of `el` in the coordinates of `root` (a positioned ancestor), from
 * layout offsets plus each ancestor's own translate. Unlike
 * getBoundingClientRect it ignores the parallax tilt of the scene, so the
 * trace path and related-block lines stay put while the stack tilts.
 */
export function centerIn(el: HTMLElement, root: HTMLElement): Point {
  let x = el.offsetWidth / 2;
  let y = el.offsetHeight / 2;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent instanceof HTMLElement ? n.offsetParent : null;
    if (n && n !== root) {
      const t = getComputedStyle(n).transform;
      if (t && t !== "none") {
        const m = new DOMMatrixReadOnly(t);
        x += m.m41;
        y += m.m42;
      }
    }
  }
  return { x, y };
}

const HOP_MS = 300; // 8 hops → 2.4 s round trip
const REDUCED_HOP_MS = 400;
const FLASH_MS = 260;

/**
 * "Trace a request": React → API Gateway → Spring Boot → Kafka → PostgreSQL,
 * then back up the same way. A glowing packet follows an SVG path through the
 * block centres (WAAPI, transform only); each block flashes on arrival and the
 * caption updates per hop. Without a packet (mobile, reduced motion) the same
 * sequence is only highlights. Pauses and resets cleanly when the stack leaves
 * the viewport or the layout is resized.
 */
export function useRequestTrace({
  wrapRef,
  tiltRef,
  blockEl,
  keys,
  captions,
  returnCaption,
  packet,
  reduced,
}: {
  wrapRef: RefObject<HTMLElement | null>;
  tiltRef: RefObject<HTMLElement | null>;
  blockEl: (key: string) => HTMLElement | null;
  /** Resolved block key per hop, in order out. */
  keys: string[];
  captions: string[];
  returnCaption: string;
  /** Draw the moving packet (desktop / tablet, motion allowed). */
  packet: boolean;
  reduced: boolean;
}) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const packetRef = useRef<SVGCircleElement | null>(null);
  const timers = useRef<number[]>([]);
  const anim = useRef<Animation | null>(null);
  const runningRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [caption, setCaption] = useState("");

  const clearHits = useCallback(() => {
    wrapRef.current?.querySelectorAll("[data-hit]").forEach((e) => e.removeAttribute("data-hit"));
  }, [wrapRef]);

  const stop = useCallback(
    (resetCaption: boolean) => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      anim.current?.cancel();
      anim.current = null;
      clearHits();
      if (pathRef.current) pathRef.current.style.opacity = "0";
      if (packetRef.current) packetRef.current.style.opacity = "0";
      runningRef.current = false;
      setRunning(false);
      if (resetCaption) setCaption("");
    },
    [clearHits],
  );

  const start = useCallback(() => {
    if (runningRef.current) return;
    // Hop indices visited: out to the last block and back; reduced motion
    // shows each step once and ends on the response.
    const seq = reduced ? [0, 1, 2, 3, 4, 0] : [0, 1, 2, 3, 4, 3, 2, 1, 0];
    const hop = reduced ? REDUCED_HOP_MS : HOP_MS;
    const els = keys.map((k) => blockEl(k));
    if (els.some((e) => !e)) return;

    runningRef.current = true;
    setRunning(true);
    setCaption("");

    if (packet && tiltRef.current && pathRef.current && packetRef.current) {
      // Centres are measured now, so a resize since the last run is accounted for.
      const pts = seq.map((i) => centerIn(els[i] as HTMLElement, tiltRef.current as HTMLElement));
      pathRef.current.setAttribute("d", pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" "));
      pathRef.current.style.opacity = "0.55";
      packetRef.current.style.opacity = "1";
      anim.current = packetRef.current.animate(
        pts.map((p, i) => ({ transform: `translate(${p.x}px, ${p.y}px)`, offset: i / (pts.length - 1) })),
        { duration: (seq.length - 1) * hop, easing: "linear", fill: "forwards" },
      );
    }

    seq.forEach((hopIdx, step) => {
      timers.current.push(
        window.setTimeout(() => {
          clearHits();
          const el = els[hopIdx] as HTMLElement;
          el.setAttribute("data-hit", "");
          el.closest("[data-layer]")?.setAttribute("data-hit", "");
          const isReturn = reduced ? step === seq.length - 1 : step >= keys.length;
          setCaption(isReturn ? returnCaption : captions[hopIdx]);
          timers.current.push(window.setTimeout(clearHits, FLASH_MS));
        }, step * hop),
      );
    });
    timers.current.push(window.setTimeout(() => stop(false), (seq.length - 1) * hop + FLASH_MS + 40));
  }, [reduced, keys, blockEl, packet, tiltRef, captions, returnCaption, clearHits, stop]);

  // Pause (and reset) when the stack leaves the viewport; reset on resize.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && runningRef.current) stop(true);
    });
    io.observe(wrap);
    let raf = 0;
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (runningRef.current) stop(true);
      });
    });
    ro.observe(wrap);
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      stop(false);
    };
  }, [wrapRef, stop]);

  const overlay = (
    <>
      <path ref={pathRef} className="stk-trace-line" fill="none" />
      <circle ref={packetRef} className="stk-trace-packet" cx={0} cy={0} r={5} />
    </>
  );

  return { running, caption, start, overlay };
}
