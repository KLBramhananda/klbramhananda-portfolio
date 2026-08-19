import { createContext, useContext } from "react";

/**
 * Shared contract between `PageTransitionProvider` and the page that triggers
 * the cinematic transition. Kept in its own module so the provider file only
 * exports the component (React Fast Refresh constraint).
 */
export type TransitionPhase = "idle" | "flash" | "reveal";

export interface PageTransitionOrigin {
  x: number;
  y: number;
}

export interface PageTransitionApi {
  enter: (origin?: PageTransitionOrigin) => void;
  phase: TransitionPhase;
  reduced: boolean;
}

export const PageTransitionContext = createContext<PageTransitionApi | null>(
  null,
);

export function usePageTransition(): PageTransitionApi | null {
  return useContext(PageTransitionContext);
}