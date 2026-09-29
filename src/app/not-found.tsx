import Link from "next/link";
import { BrandMark } from "@/components/shell/Brand";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6">
      <div className="max-w-md text-center">
        <BrandMark size={40} className="mx-auto" />
        <div className="label-caps mt-5 text-saffron-deep">404 · Not found</div>
        <h1 className="mt-2 font-serif text-[30px] font-semibold text-ink-900">No evidence at this address</h1>
        <p className="mt-2 text-[14px] text-muted">The page or record you were looking for does not exist in this repository.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/search" className="rounded-[5px] bg-ink-900 px-4 py-2 text-[14px] font-medium text-paper hover:bg-ink-800">Search the evidence</Link>
          <Link href="/" className="rounded-[5px] border border-rule-strong bg-card px-4 py-2 text-[14px] font-medium text-ink-900 hover:border-ink-500">Home</Link>
        </div>
      </div>
    </div>
  );
}
