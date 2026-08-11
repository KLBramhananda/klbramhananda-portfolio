import { useEffect, useRef, useState } from "react";
import videoSrc from "@/assets/animation-videos/working-with-wi.mp4";

/**
 * Fixed, full-viewport background layer running the human-AI ambient video.
 *
 * The video is muted, looping, plays inline, and covers the viewport without
 * distortion (object-fit: cover). A strong dark-navy overlay sits above it so
 * the human-and-robot interaction stays a recognizable but subtle backdrop
 * behind the portfolio content.
 *
 * The wrapper keeps the previous ambient gradient as a static poster/fallback:
 * it shows while the video buffers, if playback is blocked, or whenever the
 * user prefers reduced motion. The backdrop stays intact on every screen size
 * while the video decodes off the main thread and stays GPU-composited.
 *
 * When playback is unwanted the `<video>` element is unmounted entirely, which
 * stops decoding, painting, and (via preload) network transfer until a motion
 * preference change actually needs it.
 */
export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // Stay in sync if the OS motion preference changes while the page is open.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionPrefChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMotionPrefChange);
    return () => mq.removeEventListener("change", onMotionPrefChange);
  }, []);

  const paused = reducedMotion;

  // Pause when playback is unwanted (reduced motion), otherwise (re)start
  // playback after the element has a source.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
      return;
    }
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay blocked or paused mid-session — the gradient poster below
        // keeps the backdrop intact.
      });
    }
  }, [paused]);

  return (
    <div className="video-bg bg-ambience" aria-hidden>
      {!paused && (
        <video
          ref={videoRef}
          className="video-bg__media"
          src={videoSrc}
          muted
          loop
          playsInline
          preload="auto"
          autoPlay
          tabIndex={-1}
        />
      )}
      <div className="video-bg__overlay" />
    </div>
  );
}
