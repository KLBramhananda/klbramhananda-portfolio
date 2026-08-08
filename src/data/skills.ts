export type SkillStatus = "CORE" | "EXPERIENCE" | "EXPLORING";

export interface SkillInfo {
  /** Canonical key. Matches the label shown on the Tech Stack nodes. */
  key: string;
  /** Display name shown inside the Skill Insight card. */
  name: string;
  /** Accent color for the pill dot. */
  color: string;
  /** Category badge, e.g. "Frontend". */
  category: string;
  /** One or two concise sentences explaining what the technology is. */
  description: string;
  /** How it is actually used in engineering work. */
  myWork: string;
  /** Related technologies. Entries matching a known key become highlightable pills. */
  related: string[];
  /** Optional usage-level label. Only set when supported by portfolio content. */
  status?: SkillStatus;
}

interface SkillDef {
  key: string;
  name: string;
  color: string;
  category: string;
  description: string;
  myWork: string;
  related: string[];
  status?: SkillStatus;
}

const skillsList: SkillDef[] = [
  {
    key: "React",
    name: "React",
    color: "#61DAFB",
    category: "Frontend",
    description:
      "A component-based JavaScript library for building interactive user interfaces.",
    myWork:
      "Building reusable frontend components, responsive interfaces and API-driven applications.",
    related: ["TypeScript", "REST APIs", "Tailwind"],
    status: "CORE",
  },
  {
    key: "TypeScript",
    name: "TypeScript",
    color: "#3178C6",
    category: "Frontend / Full Stack",
    description:
      "A typed superset of JavaScript that improves code safety, maintainability and developer tooling.",
    myWork:
      "Building maintainable React applications and strongly typed frontend and application logic.",
    related: ["React", "Vite", "REST APIs"],
    status: "CORE",
  },
  {
    key: "Python",
    name: "Python",
    color: "#3776AB",
    category: "Backend",
    description:
      "A general-purpose programming language widely used for backend development, automation and application logic.",
    myWork:
      "Backend logic, APIs, automation and enterprise application development.",
    related: ["Frappe", "ERPNext", "REST APIs"],
    status: "CORE",
  },
  {
    key: "Frappe",
    name: "Frappe",
    color: "#7B68EE",
    category: "Enterprise Application Framework",
    description:
      "A full-stack web application framework used to build business applications and ERP systems.",
    myWork:
      "Backend development, APIs, DocTypes, workflows and enterprise application functionality.",
    related: ["Python", "ERPNext", "REST APIs"],
    status: "CORE",
  },
  {
    key: "ERPNext",
    name: "ERPNext",
    color: "#0089FF",
    category: "Enterprise ERP",
    description:
      "An open-source ERP platform for managing business processes and enterprise operations.",
    myWork:
      "ERP workflows, business processes, custom functionality, integrations and enterprise application development.",
    related: ["Frappe", "Python", "REST APIs"],
    status: "CORE",
  },
  {
    key: "SAP BTP",
    name: "SAP BTP",
    color: "#0FAAFF",
    category: "Enterprise / Cloud",
    description:
      "SAP's cloud platform for building, integrating and extending enterprise applications.",
    myWork:
      "Enterprise application development, cloud capabilities and integration-related work based on SAP BTP experience.",
    related: ["SAP", "Cloud", "Integration"],
    status: "EXPERIENCE",
  },
  {
    key: "Docker",
    name: "Docker",
    color: "#2496ED",
    category: "DevOps / Infrastructure",
    description:
      "A container platform used to package applications and their dependencies consistently.",
    myWork:
      "Containerized development environments, application deployment and reproducible development workflows.",
    related: ["Linux", "Git", "DevOps"],
    status: "CORE",
  },
  {
    key: "Git",
    name: "Git",
    color: "#8b949e",
    category: "Development",
    description:
      "A distributed version control system for tracking source code changes and collaborating on software.",
    myWork:
      "Branch-based development, source control, collaboration and development workflows.",
    related: ["GitHub", "Docker", "Development"],
    status: "CORE",
  },
  {
    key: "AI",
    name: "AI / LLM",
    color: "#A78BFA",
    category: "Artificial Intelligence",
    description:
      "AI and large language model technologies used for generation, reasoning, automation and intelligent application workflows.",
    myWork:
      "AI-powered applications, LLM workflows, intelligent automation and agent-based systems.",
    related: ["Agents", "MCP", "Automation"],
    status: "EXPLORING",
  },
  {
    key: "MCP",
    name: "MCP",
    color: "#34D399",
    category: "AI Infrastructure",
    description:
      "A protocol for connecting AI models and agents with external tools, systems and context.",
    myWork:
      "Exploring tool-connected AI systems and agent-based application architectures.",
    related: ["AI", "LLM", "Agents"],
    status: "EXPLORING",
  },
  {
    key: "REST APIs",
    name: "REST APIs",
    color: "#F59E0B",
    category: "Backend / Integration",
    description:
      "HTTP-based interfaces that allow applications and services to communicate using standard HTTP methods.",
    myWork:
      "Connecting frontend applications with backend services, ERP systems and other application components.",
    related: ["React", "Python", "ERPNext"],
    status: "CORE",
  },
  {
    key: "PostgreSQL",
    name: "PostgreSQL",
    color: "#60A5FA",
    category: "Database",
    description: "An open-source relational database management system.",
    myWork: "Working with structured application data and backend persistence.",
    related: ["Python", "REST APIs", "Backend"],
    status: "CORE",
  },
  {
    key: "Tailwind",
    name: "Tailwind CSS",
    color: "#38BDF8",
    category: "Frontend",
    description:
      "A utility-first CSS framework for building custom responsive interfaces.",
    myWork:
      "Building responsive, consistent and maintainable frontend interfaces.",
    related: ["React", "TypeScript", "Vite"],
    status: "CORE",
  },
  {
    key: "Vite",
    name: "Vite",
    color: "#C084FC",
    category: "Frontend Tooling",
    description:
      "A modern frontend build tool providing fast development and optimized production builds.",
    myWork:
      "React application development, local development workflows and production builds.",
    related: ["React", "TypeScript", "Tailwind"],
    status: "CORE",
  },
  {
    key: "Linux",
    name: "Linux",
    color: "#FACC15",
    category: "Infrastructure",
    description:
      "An open-source operating system widely used for servers, development environments and infrastructure.",
    myWork:
      "Development environments, application deployment and server-side workflows.",
    related: ["Docker", "Git", "Cloud"],
    status: "CORE",
  },
  {
    key: "Cloud",
    name: "Cloud",
    color: "#2DD4BF",
    category: "Infrastructure",
    description:
      "Cloud computing provides scalable infrastructure and managed services for applications.",
    myWork:
      "Enterprise application deployment, infrastructure and cloud-based application workflows.",
    related: ["Docker", "Linux", "SAP BTP"],
    status: "CORE",
  },
];

export const skills = Object.fromEntries(
  skillsList.map((s) => [s.key, s]),
) as Record<string, SkillInfo>;
