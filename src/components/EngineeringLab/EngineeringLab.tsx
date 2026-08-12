import { lazy, Suspense, useEffect, useState } from "react";
import { LabShell } from "./components/LabShell";
import { LabHome } from "./components/LabHome";
import { LAB_MODULES, type LabModule } from "./data/modules";
import "./styles/lab.css";

/**
 * Each module screen is a separate lazy chunk. Opening the Lab home only loads
 * the shell + home screen; the module you actually pick is fetched on demand,
 * so a visit that stays on the Lab home never parses any module implementation.
 */
const SystemDesignLab = lazy(() =>
  import("./components/SystemDesignLab").then((m) => ({ default: m.SystemDesignLab })),
);
const ErpProcurementLab = lazy(() =>
  import("./components/ErpProcurementLab").then((m) => ({ default: m.ErpProcurementLab })),
);
const ProductionIncidentLab = lazy(() =>
  import("./components/ProductionIncidentLab").then((m) => ({ default: m.ProductionIncidentLab })),
);
const ModulePlaceholder = lazy(() =>
  import("./components/ModulePlaceholder").then((m) => ({ default: m.ModulePlaceholder })),
);

function ModuleLoadingFallback() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 pb-44 pt-36">
      <span
        aria-hidden
        className="h-9 w-9 animate-spin rounded-full border-2 border-cyan-accent/25 border-t-cyan-accent"
      />
      <span className="text-sm text-muted-foreground">Loading module…</span>
    </div>
  );
}

/**
 * BK Engineering Lab — the lazy-loaded entry point for the entire Lab chunk.
 * Owns the active screen (Lab home vs. a module screen) and keeps the Lab
 * fully self-contained: its only dependency outside this folder is the shared
 * React runtime, lucide icons, and TanStack Router links already used by the
 * portfolio.
 *
 * Only the selected module's *id* is stored in state; the module object is
 * always re-derived from LAB_MODULES on render. That way a stale object
 * preserved across Fast Refresh (whose icon/description may no longer exist
 * after editing the module data) can never be rendered raw.
 */
export function EngineeringLab() {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const activeModule = activeModuleId
    ? (LAB_MODULES.find((m) => m.id === activeModuleId) ?? null)
    : null;

  // When leaving the Lab (route change) the module selection resets naturally,
  // but if we ever re-mount beneath a sub-route, reset first so a stale module
  // never shows. Also reset scroll position on entry so the Lab always opens
  // at its home header.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    return () => setActiveModuleId(null);
  }, []);

  const openModule = (module: LabModule) => {
    setActiveModuleId(module.id);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const closeModule = () => setActiveModuleId(null);

  return (
    <LabShell>
      {activeModule ? (
        <Suspense fallback={<ModuleLoadingFallback />}>
          {activeModule.id === "system-design" ? (
            <SystemDesignLab module={activeModule} onBack={closeModule} />
          ) : activeModule.id === "erp-procurement" ? (
            <ErpProcurementLab module={activeModule} onBack={closeModule} />
          ) : activeModule.id === "production-incident" ? (
            <ProductionIncidentLab module={activeModule} onBack={closeModule} />
          ) : (
            <ModulePlaceholder module={activeModule} onBack={closeModule} />
          )}
        </Suspense>
      ) : (
        <LabHome onOpen={openModule} />
      )}
    </LabShell>
  );
}