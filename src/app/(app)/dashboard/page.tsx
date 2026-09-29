import type { Metadata } from "next";
import { DashboardView } from "./DashboardView";

export const metadata: Metadata = { title: "Governance Dashboard" };

export default function DashboardPage() {
  return <DashboardView />;
}
