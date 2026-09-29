import type { Metadata } from "next";
import { Suspense } from "react";
import { AgendaView } from "./AgendaView";

export const metadata: Metadata = { title: "Research Agenda" };

export default function AgendaPage() {
  return (
    <Suspense>
      <AgendaView />
    </Suspense>
  );
}
