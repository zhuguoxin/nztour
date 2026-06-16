"use client";

/**
 * Error boundary for the course editor — temporary debug surface so we can
 * see the real error (digest + message + stack) instead of a minified React
 * production error. Remove once the editor is stable.
 */
export default function EditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 font-mono text-[13px] leading-relaxed">
      <h1 className="text-[18px] font-semibold mb-3">Course editor error (debug)</h1>
      <div className="mb-2"><span className="text-slate-500">digest:</span> {error.digest ?? "(none)"}</div>
      <div className="mb-2"><span className="text-slate-500">message:</span> {error.message || "(empty)"}</div>
      <pre className="whitespace-pre-wrap text-[12px] text-slate-600 bg-slate-200 border border-slate-200 rounded p-3 overflow-x-auto">
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
