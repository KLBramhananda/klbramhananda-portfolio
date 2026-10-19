import { Layers, Boxes, FileCheck, MoveRight, type LucideIcon } from "lucide-react";

/** Diagram data for the Projects "View architecture" flip (matched by title). */
// eslint-disable-next-line react-refresh/only-export-components -- data shared with Projects
export const diagrams = [
  {
    icon: Layers,
    title: "ERP System Flow",
    subtitle: "ERPNext + Frappe",
    nodes: ["Customer", "Sales Order", "Inventory", "Fulfillment", "Invoice"],
  },
  {
    icon: Boxes,
    title: "Microservices Architecture",
    subtitle: "Spring Boot · Kafka",
    nodes: ["API Gateway", "Auth Svc", "Order Svc", "Inventory Svc", "Kafka Bus"],
  },
  {
    icon: FileCheck,
    title: "Procurement Lifecycle",
    subtitle: "S2P Matrix",
    nodes: ["Requisition", "RFQ", "Supplier Match", "PO", "Receipt", "Payment"],
  },
];

/**
 * One animated flow diagram. `compact` tightens the paddings for the small
 * browser-frame back face in Projects.
 */
export function Diagram({
  icon: Icon,
  title,
  subtitle,
  nodes,
  phase,
  compact = false,
  aside,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  nodes: string[];
  phase: number;
  compact?: boolean;
  /** Optional side node shown under the flow (only used by the Projects 10xTA card). */
  aside?: { label: string; note: string };
}) {
  const cycle = 7.2;
  const step = cycle / nodes.length;

  return (
    <article
      className={`architecture-card glass-strong rounded-3xl transition-colors hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.06] ${
        compact ? "p-4 lg:p-5" : "p-6 lg:p-7"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-blue-accent/20 text-cyan-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>

      <div
        className={`rounded-2xl border border-slate-900/10 bg-slate-900/[0.03] overflow-hidden dark:border-white/10 dark:bg-white/[0.02] ${
          compact ? "mt-3 p-3" : "mt-6 p-5"
        }`}
      >
        {/* Each arrow leads its step as one unbreakable unit, so arrows only ever
            sit between steps — never trailing at the end of a wrapped line. */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
          {nodes.map((n, i) => (
            <div key={n} className="flex items-center whitespace-nowrap">
              {i > 0 && (
                <span
                  aria-hidden
                  className="flow-segment mr-2 inline-flex h-4 w-4 shrink-0 items-center justify-center"
                >
                  <MoveRight className="flow-arrow h-4 w-4 text-cyan-accent/60" />
                  <span
                    className="flow-particle"
                    style={{ animationDelay: `${phase + (i - 1) * step - cycle}s` }}
                  />
                </span>
              )}
              <div
                className="flow-node rounded-lg glass px-3 py-2 text-xs font-medium text-foreground/90 border border-slate-900/10 dark:border-white/10"
                style={{ animationDelay: `${phase + i * step - cycle}s` }}
              >
                {n}
              </div>
            </div>
          ))}
        </div>
        {aside && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs">
            <span aria-hidden className="h-px w-5 bg-cyan-accent/50" />
            <div className="flow-node rounded-lg glass border border-slate-900/10 px-3 py-2 font-medium text-foreground/90 dark:border-white/10">
              {aside.label}
              <span className="ml-1.5 font-normal text-muted-foreground">{aside.note}</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
