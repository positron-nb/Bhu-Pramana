import type { Metadata } from "next";
import { Suspense } from "react";
import { BriefView } from "./BriefView";

export const metadata: Metadata = { title: "Policy Briefs" };

export default function BriefPage() {
  return (
    <Suspense fallback={<div className="h-40" />}>
      <BriefView />
    </Suspense>
  );
}
