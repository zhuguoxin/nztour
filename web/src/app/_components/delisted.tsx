import Link from "next/link";
import { TopBar } from "./top-bar";

/**
 * Friendly "this has been delisted" notice. Shown to a learner who reaches a
 * supplier/product/course whose supplier has been disabled but who has history
 * (enrollment or badge) there — so their links don't dead-end on a bare 404.
 * Everyone else gets notFound() instead.
 */
export function Delisted({ message, backLabel }: { message: string; backLabel: string }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar />
      <main className="px-5 sm:px-8 py-24 max-w-xl mx-auto text-center">
        <div className="text-display mb-4">📦</div>
        <h1 className="text-h2 sm:text-h2 font-semibold text-slate-900">{message}</h1>
        <div className="mt-6">
          <Link
            href="/learn"
            className="inline-block px-4 py-2.5 rounded-md bg-emerald-600 text-white font-semibold text-small hover:bg-emerald-700"
          >
            {backLabel}
          </Link>
        </div>
      </main>
    </div>
  );
}
