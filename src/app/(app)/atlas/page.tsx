import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasView } from "./AtlasView";

export const metadata: Metadata = { title: "Geo-Intelligence Atlas" };

export default function AtlasPage() {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse-soft rounded bg-paper-2" />}>
      <AtlasView />
    </Suspense>
  );
}
