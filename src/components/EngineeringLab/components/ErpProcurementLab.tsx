import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  FilePlus2,
  FileText,
  Package,
  Receipt,
  RotateCw,
  Stamp,
  Truck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { LabModule } from "../data/modules";

type ErpStageId = "pr" | "approval" | "po" | "supplier" | "receipt" | "invoice" | "payment";

type StageStatus = "queued" | "action" | "done";

type ErpStage = {
  id: ErpStageId;
  step: string;
  title: string;
  actionLabel: string;
  success: string;
  description: string;
  icon: LucideIcon;
};

const ORDER: ErpStageId[] = ["pr", "approval", "po", "supplier", "receipt", "invoice", "payment"];

const STAGES: ErpStage[] = [
  {
    id: "pr",
    step: "01",
    title: "Purchase Request",
    actionLabel: "Create Purchase Request",
    success: "Purchase request created",
    description:
      "An internal need is captured as a purchase request — what's needed, how much, and a suggested supplier.",
    icon: FilePlus2,
  },
  {
    id: "approval",
    step: "02",
    title: "Approval",
    actionLabel: "Approve Request",
    success: "Request approved",
    description:
      "Budget owners and policy checks review the request before any money can be committed.",
    icon: Stamp,
  },
  {
    id: "po",
    step: "03",
    title: "Purchase Order",
    actionLabel: "Issue Purchase Order",
    success: "Purchase order issued",
    description:
      "The approved request becomes a formal purchase order — a binding commitment issued to the supplier.",
    icon: FileText,
  },
  {
    id: "supplier",
    step: "04",
    title: "Supplier",
    actionLabel: "Send Order to Supplier",
    success: "Order sent to supplier",
    description:
      "The order is dispatched to the supplier, who confirms it and prepares delivery.",
    icon: Truck,
  },
  {
    id: "receipt",
    step: "05",
    title: "Purchase Receipt",
    actionLabel: "Record Goods Receipt",
    success: "Goods receipt recorded",
    description:
      "The receiving team records what actually landed and checks it against the order.",
    icon: Package,
  },
  {
    id: "invoice",
    step: "06",
    title: "Purchase Invoice",
    actionLabel: "Submit Invoice",
    success: "Invoice submitted",
    description:
      "The supplier bills us; the invoice is matched to the order and receipt before it can be paid.",
    icon: Receipt,
  },
  {
    id: "payment",
    step: "07",
    title: "Payment",
    actionLabel: "Approve Payment",
    success: "Payment approved",
    description:
      "Invoices that match are scheduled for payment, and finance closes out the cycle.",
    icon: CreditCard,
  },
];

const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<ErpStageId, ErpStage>;

function initialStates(): Record<ErpStageId, StageStatus> {
  return {
    pr: "action",
    approval: "queued",
    po: "queued",
    supplier: "queued",
    receipt: "queued",
    invoice: "queued",
    payment: "queued",
  };
}

const DOT_CLS: Record<StageStatus, string> = {
  queued: "bg-slate-400/40",
  action: "bg-gradient-to-br from-cyan-accent to-blue-accent shadow-[0_0_12px_2px_rgba(6,182,212,0.45)]",
  done: "bg-emerald-500 shadow-[0_0_10px_1px_rgba(16,185,129,0.4)]",
};

const PILL_CLS: Record<StageStatus, string> = {
  queued:
    "border-slate-900/10 bg-slate-900/[0.04] text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]",
  action: "border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const CHIP_CLS: Record<StageStatus, string> = {
  queued: "bg-slate-900/[0.04] text-muted-foreground dark:bg-white/[0.03]",
  action: "bg-gradient-to-br from-cyan-accent/25 to-blue-accent/15 text-cyan-accent",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

const PILL_TEXT: Record<StageStatus, string> = {
  queued: "Queued",
  action: "Action required",
  done: "Completed",
};

export function ErpProcurementLab({
  module,
  onBack,
}: {
  module: LabModule;
  onBack: () => void;
}) {
  const reduced = useReducedMotion() ?? false;

  const [states, setStates] = useState<Record<ErpStageId, StageStatus>>(initialStates);
  const [processing, setProcessing] = useState<ErpStageId | null>(null);
  const [milestones, setMilestones] = useState<string[]>([]);
  const timerRef = useRef<number | null>(null);

  const doneCount = ORDER.filter((id) => states[id] === "done").length;
  const complete = doneCount === ORDER.length;
  const progress = (doneCount / ORDER.length) * 100;

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function step(id: ErpStageId) {
    if (processing || states[id] !== "action") return;
    const rs = reduced ? 0.35 : 1;
    setProcessing(id);
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setStates((prev) => {
        const next = { ...prev, [id]: "done" as const };
        const idx = ORDER.indexOf(id);
        if (idx !== -1 && idx < ORDER.length - 1) {
          next[ORDER[idx + 1]] = "action" as const;
        }
        return next;
      });
      setMilestones((prev) => [...prev.slice(-11), STAGE_BY_ID[id].success]);
      setProcessing(null);
    }, 700 * rs);
  }

  function reset() {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    setProcessing(null);
    setStates(initialStates());
    setMilestones([]);
  }

  return (
    <section className="mx-auto max-w-7xl pb-24 pt-8 sm:pb-32">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="animate-fade-up flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
      >
        <Link
          to="/lab"
          className="font-medium text-muted-foreground transition-colors hover:text-cyan-accent"
        >
          BK Engineering Lab
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground/85">{module.name}</span>
        <button
          type="button"
          onClick={onBack}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          All modules
        </button>
      </nav>

      {/* Header */}
      <div className="mt-8 animate-fade-up">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-accent/25 to-cyan-accent/15 text-blue-accent shadow-[0_0_40px_-12px_rgba(59,130,246,0.6)]">
            <Workflow className="h-8 w-8" strokeWidth={1.6} />
          </div>
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-900/[0.06] hover:text-foreground dark:hover:bg-white/[0.06]"
          >
            Exit Lab
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs uppercase tracking-widest text-foreground/85 dark:text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Module · Interactive
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gradient sm:text-5xl">
          {module.name}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-cyan-accent">{module.tagline}</p>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Walk a source-to-pay purchase cycle one step at a time. Progress
          through each stage with a single action and watch the document
          lifecycle build up.
        </p>
      </div>

      {/* Cycle summary */}
      <div className="mt-10 animate-fade-up rounded-2xl glass p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-cyan-accent" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">
                Source-to-pay · Purchase cycle
              </h2>
            </div>
            <div
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={ORDER.length}
              aria-label="Procurement cycle progress"
              className="mt-3 flex items-center gap-3"
            >
              <div className="h-1.5 w-full max-w-[16rem] overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-accent to-emerald-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span
                className={`shrink-0 text-xs tabular-nums ${
                  complete ? "font-semibold text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"
                }`}
              >
                {doneCount} / {ORDER.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-slate-900/[0.03] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-cyan-accent/30 hover:text-foreground dark:border-white/10 dark:bg-white/[0.03]"
          >
            <RotateCw className="h-4 w-4" />
            Reset cycle
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="mt-10 grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4 gap-y-6 sm:gap-x-5">
        {STAGES.map((stage, i) => {
          const status = processing === stage.id ? "action" : states[stage.id];
          const isProcessing = processing === stage.id;
          const isLast = i === STAGES.length - 1;
          const Icon = stage.icon;
          return (
            <Fragment key={stage.id}>
              <div className="relative flex justify-center pt-4">
                <span
                  aria-hidden
                  className={`h-3.5 w-3.5 rounded-full ${DOT_CLS[status]} ${
                    isProcessing ? "lab-erp-pulse" : ""
                  }`}
                />
                {!isLast && (
                  <span
                    className={`lab-erp-line absolute left-1/2 -bottom-[2.9375rem] top-[1.4375rem] w-px -translate-x-1/2 ${
                      isProcessing ? "lab-erp-line--active" : ""
                    }`}
                  >
                    {isProcessing && <span className="lab-erp-flow" aria-hidden />}
                  </span>
                )}
              </div>

              <div
                className={`lab-raise glass-strong rounded-2xl p-4 transition-all duration-300 sm:p-5 ${
                  status === "action"
                    ? "border-cyan-accent/35 shadow-[0_0_26px_-10px_rgba(6,182,212,0.45)]"
                    : status === "done"
                      ? ""
                      : "opacity-75"
                }`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CHIP_CLS[status]}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[0.625rem] tabular-nums text-muted-foreground/70">
                        {stage.step}
                      </span>
                      <h3 className="text-base font-semibold tracking-tight text-foreground">
                        {stage.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium ${PILL_CLS[status]}`}
                      >
                        {isProcessing && (
                          <span
                            aria-hidden
                            className="h-1 w-1 rounded-full bg-cyan-accent animate-pulse"
                          />
                        )}
                        {isProcessing ? "Processing…" : PILL_TEXT[status]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {stage.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center border-t border-slate-900/8 pt-3.5 dark:border-white/8">
                  {isProcessing ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-4 py-2 text-sm font-semibold text-background opacity-70"
                    >
                      <RotateCw className="h-4 w-4 animate-spin" />
                      Processing…
                    </button>
                  ) : status === "action" ? (
                    <button
                      type="button"
                      onClick={() => step(stage.id)}
                      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-accent to-blue-accent px-4 py-2 text-sm font-semibold text-background shadow-[0_8px_28px_-10px_rgba(6,182,212,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-8px_rgba(6,182,212,0.7)]"
                    >
                      {stage.actionLabel}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ) : status === "done" ? (
                    <span className="lab-erp-pop inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {stage.success}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/80">
                      Complete the previous step first.
                    </span>
                  )}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Completion banner */}
      {complete && (
        <div className="mt-6 animate-fade-up rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" aria-hidden />
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            Source-to-pay cycle completed
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Request → approval → order → supplier → receipt → invoice → payment
            executed end to end.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-accent px-5 py-2.5 text-sm font-semibold text-background shadow-[0_10px_40px_-12px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-0.5"
          >
            <RotateCw className="h-4 w-4" />
            Start a new cycle
          </button>
        </div>
      )}

      {/* Milestones log */}
      <div className="mt-6 rounded-2xl glass p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-foreground">Completed milestones</h3>
        {milestones.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground/80">
            No milestones yet — create the purchase request to begin the cycle.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {milestones.map((m, i) => (
              <li
                key={`${m}-${i}`}
                className="lab-erp-pop flex items-center gap-2.5 text-sm text-foreground/85"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Educational note */}
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground/70">
        Educational simulation — synthetic flows only. No production systems,
        credentials, or proprietary process data are used.
      </p>

      {/* Footer actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl glass-strong px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-slate-900/10 dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lab modules
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-cyan-accent transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06]"
        >
          Exit Lab
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}