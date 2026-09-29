import type { Role } from "@/lib/domain/schemas";

export type Permission =
  | "workspace"
  | "notes"
  | "copilot"
  | "lab.run"
  | "lab.save"
  | "brief.generate"
  | "brief.decision"
  | "download"
  | "propose"
  | "admin";

export const ROLE_META: Record<Role, { label: string; hindi: string; tagline: string; description: string; home: string; accent: string }> = {
  public: {
    label: "Public user",
    hindi: "नागरिक",
    tagline: "Open evidence, maps and dashboards",
    description: "Browse the national evidence base, explore maps and dashboards, read published briefs and try illustrative scenarios.",
    home: "/dashboard",
    accent: "var(--color-observed)",
  },
  researcher: {
    label: "Researcher",
    hindi: "शोधकर्ता",
    tagline: "Search, synthesise, annotate, propose",
    description: "Search and annotate the evidence library, build casefiles, inspect every model assumption, and turn evidence gaps into research calls.",
    home: "/search",
    accent: "var(--color-documented)",
  },
  policymaker: {
    label: "Policymaker",
    hindi: "नीति-निर्माता",
    tagline: "Test scenarios, get evidence-backed briefs",
    description: "Open a policy casefile: ask a question, see the evidence and where it matters, test a reform, get a decision and a traceable brief.",
    home: "/case",
    accent: "var(--color-saffron)",
  },
  admin: {
    label: "Administrator",
    hindi: "प्रशासक",
    tagline: "Curate sources, provenance and APIs",
    description: "Review submissions, manage provenance and licences, monitor platform mode and integrations.",
    home: "/admin",
    accent: "var(--color-green)",
  },
};

const MATRIX: Record<Role, Permission[]> = {
  public: ["copilot", "lab.run", "download"],
  researcher: ["workspace", "notes", "copilot", "lab.run", "lab.save", "brief.generate", "download", "propose"],
  policymaker: ["workspace", "notes", "copilot", "lab.run", "lab.save", "brief.generate", "brief.decision", "download"],
  admin: ["workspace", "notes", "copilot", "lab.run", "lab.save", "brief.generate", "brief.decision", "download", "propose", "admin"],
};

export function can(role: Role | null | undefined, p: Permission): boolean {
  return !!role && MATRIX[role].includes(p);
}

export function permissionsOf(role: Role): Permission[] {
  return MATRIX[role];
}

export const ALL_PERMISSIONS: { id: Permission; label: string }[] = [
  { id: "copilot", label: "Research copilot" },
  { id: "lab.run", label: "Run scenarios" },
  { id: "lab.save", label: "Save scenarios" },
  { id: "workspace", label: "Workspace & bookmarks" },
  { id: "notes", label: "Research notes" },
  { id: "brief.generate", label: "Generate briefs" },
  { id: "brief.decision", label: "Decision annex in briefs" },
  { id: "download", label: "Download data" },
  { id: "propose", label: "Propose research" },
  { id: "admin", label: "Data stewardship" },
];

export const ROLE_COOKIE = "bp_role";
