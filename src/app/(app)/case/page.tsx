import type { Metadata } from "next";
import { Suspense } from "react";
import { CaseView } from "./CaseView";

export const metadata: Metadata = { title: "Policy Casefile" };

export default function CasePage() {
  return (
    <Suspense fallback={<div className="mx-auto h-[70vh] max-w-[1400px] animate-pulse-soft rounded-md bg-paper-2" />}>
      <CaseView />
    </Suspense>
  );
}
