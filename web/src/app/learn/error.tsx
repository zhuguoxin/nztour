"use client";

/**
 * Error boundary for /learn — temporary debug surface.
 *
 * Renders the digest + message + stack in plain text. Once we've identified
 * the root cause this should be replaced with a friendly error UI (or simply
 * deleted to fall back to Next.js's default error page).
 */
export default function LearnError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 font-mono text-[13px] leading-relaxed">
      <h1 className="text-[18px] font-semibold mb-3">/learn render error (debug)</h1>
      <div className="mb-2"><span className="text-slate-500">digest:</span> {error.digest ?? "(none)"}</div>
      <div className="mb-2"><span className="text-slate-500">message:</span> {error.message || "(empty)"}</div>
      <pre className="whitespace-pre-wrap text-[12px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-3 overflow-x-auto">
        {error.stack ?? "(no stack)"}
      </pre>
      <button
        onClick={() => reset()}
        className="mt-4 px-3 py-1.5 rounded-md border border-slate-300 text-[13px] hover:bg-slate-50"
      >
        Retry
      </button>
    </div>
  );
}
