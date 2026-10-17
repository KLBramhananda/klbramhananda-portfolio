export type Tier = "high" | "mid" | "2d";

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/** The Core's on-screen sphere in client px: centre (x, y) and radius r. */
export interface CoreCircle {
  x: number;
  y: number;
  r: number;
}

/**
 * Shared between the entry intro and the hero Core. The Core registers where
 * its sphere is once it is ready, so the intro can fly its particles there;
 * the intro flags itself active so the Core idles underneath until it is gone.
 */
export const coreBridge: {
  introActive: boolean;
  circle: (() => CoreCircle | null) | null;
} = { introActive: false, circle: null };

export function hasWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

let cachedWebGL2: boolean | null = null;

export function detectTier(): Tier {
  if (cachedWebGL2 === null) cachedWebGL2 = hasWebGL2();
  if (window.innerWidth < 768 || !cachedWebGL2) return "2d";
  const nav = navigator as NavigatorHints;
  const high =
    (nav.hardwareConcurrency ?? 0) >= 4 &&
    (nav.deviceMemory === undefined || nav.deviceMemory >= 4) &&
    !nav.connection?.saveData;
  return high ? "high" : "mid";
}

/** Low-end signal: the Core falls back to its SVG version. */
export function isLowEnd(): boolean {
  const nav = navigator as NavigatorHints;
  return (
    !!nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory < 2)
  );
}

let introScene: Promise<typeof import("./intro-webgl")> | null = null;

/** The intro's WebGL scene chunk (and its `three` dependency), fetched once. */
export function loadIntroScene() {
  introScene ??= import("./intro-webgl");
  return introScene;
}

/**
 * Called at app boot, before React renders: when the entry intro is going to
 * play on a WebGL-capable tier, start fetching its scene chunk right away, in
 * parallel with the rest of the app, instead of waiting for the overlay to mount.
 */
export function preloadIntro() {
  try {
    if (window.location.pathname !== "/") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (detectTier() === "2d") return;
    void loadIntroScene().catch(() => {
      introScene = null; // a failed fetch may be retried by the overlay
    });
  } catch {
    // Preloading is an optimisation only.
  }
}
