import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AIResearchLabShell } from "./components/AIResearchLabShell";
import { AIGateway } from "./components/AIGateway";
import { GATEWAY_KEY, markGatewaySeen } from "./data/rooms";
import "./styles/ai-lab.css";

const preloadHome = () =>
  import("./components/AIResearchLabHome").then((module) => ({
    default: module.AIResearchLabHome,
  }));
const AIResearchLabHome = lazy(preloadHome);

type Stage = "gateway" | "leaving" | "world";

/** The gateway shows once per session; a deep link to a room skips it. */
function initialStage(): Stage {
  try {
    if (window.sessionStorage.getItem(GATEWAY_KEY) === "1") return "world";
    if (new URLSearchParams(window.location.search).has("room")) return "world";
  } catch {
    /* storage blocked: show the gateway */
  }
  return "gateway";
}

export function AIResearchLab() {
  const [stage, setStage] = useState<Stage>(initialStage);
  const worldOpen = stage !== "gateway";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("bk:page-ready"));
  }, []);

  // Fetch the world's chunk while the gateway plays so the hand-over never
  // waits on a network round-trip.
  useEffect(() => {
    void preloadHome();
  }, []);

  useEffect(() => {
    if (stage === "world") markGatewaySeen();
  }, [stage]);

  const handleLeave = useCallback(() => setStage("leaving"), []);
  const handleDone = useCallback(() => setStage("world"), []);

  return (
    <>
      {stage !== "world" && (
        <AIGateway leaving={stage === "leaving"} onLeave={handleLeave} onDone={handleDone} />
      )}
      <AIResearchLabShell online={worldOpen}>
        {!worldOpen ? (
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
