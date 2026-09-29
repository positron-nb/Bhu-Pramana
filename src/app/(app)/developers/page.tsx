import type { Metadata } from "next";
import { DevelopersView } from "./DevelopersView";

export const metadata: Metadata = { title: "Open APIs" };

export default function DevelopersPage() {
  return <DevelopersView />;
}
