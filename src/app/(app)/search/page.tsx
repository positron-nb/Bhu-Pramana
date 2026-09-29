import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "./SearchView";

export const metadata: Metadata = { title: "Evidence Library" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-40" />}>
      <SearchView />
    </Suspense>
  );
}
