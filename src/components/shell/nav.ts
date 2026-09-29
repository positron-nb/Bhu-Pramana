import { Braces, FolderKanban, Gauge, Library, Map, ScrollText, ShieldCheck, Target } from "lucide-react";
import type { Permission } from "@/lib/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof Map;
  requires?: Permission;
  hint: string;
  primary?: boolean;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Decide",
    items: [{ href: "/case", label: "Policy Casefile", icon: ScrollText, hint: "Question → evidence → place → decision → brief", primary: true }],
  },
  {
    group: "Explore",
    items: [
      { href: "/atlas", label: "Geo-Intelligence Atlas", icon: Map, hint: "District indicators and evidence on the map" },
      { href: "/search", label: "Evidence Library", icon: Library, hint: "Search research, law, policy and data" },
      { href: "/agenda", label: "Research Agenda", icon: Target, hint: "Evidence gaps, model assumptions, research calls" },
      { href: "/dashboard", label: "Governance Dashboard", icon: Gauge, hint: "National indicators, hotspots, research activity" },
    ],
  },
  {
    group: "Yours",
    items: [{ href: "/workspace", label: "Workspace", icon: FolderKanban, requires: "workspace", hint: "Casefiles, briefs, notes, saved evidence" }],
  },
  {
    group: "Platform",
    items: [
      { href: "/admin", label: "Data Stewardship", icon: ShieldCheck, requires: "admin", hint: "Provenance, curation, roles" },
      { href: "/developers", label: "Open APIs", icon: Braces, hint: "REST, DCAT and GeoJSON endpoints" },
    ],
  },
];
