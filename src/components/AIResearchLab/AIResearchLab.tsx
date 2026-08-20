import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AIResearchLabShell } from "./components/AIResearchLabShell";
import { WakeSystem, type LabPhase } from "./components/WakeSystem";
import "./styles/ai-lab.css";

const preloadHome = () => import("./components/AIResearchLabHome");
const AIResearchLabHome = lazy(preloadHome);

const INIT_ITEMS = 8;
const INIT_MS = 190;
const INIT_BUFFER_MS = 1500;

export function AIResearchLab() {
  const [phase, setPhase] = useState<LabPhase>("dormant");
  const [entered, setEntered] = useState(false);
  const online = phase === "online";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("bk:page-ready"));
  }, []);

  // Fetch the Lab's content chunk while the boot screen plays so the ENTER
  // reveal never waits on a network round-trip.
  useEffect(() => {
    void preloadHome();
  }, []);

  useEffect(() => {
    if (phase !== "initializing") return;
    const t = window.setTimeout(
      () => setPhase("online"),
      INIT_ITEMS * INIT_MS + INIT_BUFFER_MS,
    );
    return () => window.clearTimeout(t);
  }, [phase]);

  const handleWake = useCallback(() => {
    setPhase((current) => (current === "dormant" ? "initializing" : current));
  }, []);

  const handleEntered = useCallback(() => {
    setEntered(true);
  }, []);

  return (
    <>
      <WakeSystem
        phase={phase}
        onWake={handleWake}
        onEntered={handleEntered}
      />
      <AIResearchLabShell online={online}>
        {phase !== "online" || !entered ? (
          <div className="ai-lab-wake-placeholder" aria-hidden />
        ) : (
          <Suspense fallback={<div className="ai-lab-wake-placeholder" aria-hidden />}>
            <AIResearchLabHome online />
          </Suspense>
        )}
      </AIResearchLabShell>
    </>
  );
}