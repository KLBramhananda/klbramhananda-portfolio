import { useCallback, useEffect, useState } from "react";
import { AIResearchLabShell } from "./components/AIResearchLabShell";
import { AIResearchLabHome } from "./components/AIResearchLabHome";
import { WakeSystem, type LabPhase } from "./components/WakeSystem";
import "./styles/ai-lab.css";

const INIT_ITEMS = 8;
const INIT_MS = 190;
const INIT_BUFFER_MS = 1500;

export function AIResearchLab() {
  const [phase, setPhase] = useState<LabPhase>("dormant");
  const online = phase === "online";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
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

  return (
    <>
      <WakeSystem phase={phase} onWake={handleWake} />
      <AIResearchLabShell online={online}>
        {phase !== "online" ? (
          <div className="ai-lab-wake-placeholder" aria-hidden />
        ) : (
          <AIResearchLabHome online />
        )}
      </AIResearchLabShell>
    </>
  );
}