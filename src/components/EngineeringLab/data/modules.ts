import {
  Boxes,
  Workflow,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export type LabModule = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: "cyan" | "blue";
  /** What the module will contain once it moves past its foundation. */
  comingSoon?: string[];
  /** Interactive scenarios are live for any module with this set. */
  status?: "live" | "foundation";
};

export const LAB_MODULES: LabModule[] = [
  {
    id: "system-design",
    name: "System Design Lab",
    tagline: "Architecture & scaling drills",
    description:
      "Hands-on scenario builders for designing enterprise systems - API boundaries, data models, queues, caches, and the trade-offs behind each choice.",
    icon: Boxes,
    accent: "cyan",
    status: "live",
    comingSoon: [
      "Interactive architecture canvas",
      "Scaling / trade-off sandbox",
      "Reference enterprise blueprints",
    ],
  },
  {
    id: "erp-procurement",
    name: "ERP / Procurement Lab",
    tagline: "Source-to-Pay workflows",
    description:
      "Model ERPNext, Frappe, and source-to-pay flows - master data, RFQs, contracts, and approvals - to see how enterprise procurement behaves end to end.",
    icon: Workflow,
    accent: "blue",
    status: "live",
    comingSoon: [
      "ERP data-model explorer",
      "S2P workflow simulator",
      "ERPNext doctype playground",
    ],
  },
  {
    id: "production-incident",
    name: "Production Incident Lab",
    tagline: "On-call runbook simulations",
    description:
      "Simulated production incidents across services, queues, and integrations - practice triage, root-cause reasoning, and clean incident response.",
    icon: ShieldAlert,
    accent: "cyan",
    status: "live",
    comingSoon: [
      "Simulated incident feeds",
      "Triage & RCA timeline",
      "Runbook / playbook builder",
    ],
  },
];