import type { DailyPoint } from "@/lib/operator-stats";

/**
 * Tiny dependency-free SVG line chart of the last N days' learning activity.
 * Two series: module completions (emerald, filled area) and new learners
 * (lime, dotted line). Server component — pure SVG, no client JS.
 */
export function ActivityChart({
  points,
  labels,
}: {
  points: DailyPoint[];
  labels: { title: string; completions: string; new_learners: string; empty: string };
}) {
  const W = 640;
  const H = 160;
  const padX = 8;
  const padY = 18;

  const maxVal = Math.max(
    1,
    ...points.map((p) => Math.max(p.module_completions, p.new_learners)),
  );
  const totalActivity = points.reduce((s, p) => s + p.module_completions + p.new_learners, 0);

  const n = points.length;
  const x = (i: number) => padX + (i * (W - 2 * padX)) / Math.max(1, n - 1);
  const y = (v: number) => H - padY - (v / maxVal) * (H - 2 * padY);

  const linePath = (key: "module_completions" | "new_learners") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");

  const areaPath =
    points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.module_completions).toFixed(1)}`)
      .join(" ") + ` L ${x(n - 1).toFixed(1)} ${H - padY} L ${x(0).toFixed(1)} ${H - padY} Z`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="font-semibold text-small text-slate-900">{labels.title}</div>
        <div className="flex items-center gap-4 text-micro">
          <span className="flex items-center gap-1.5 text-slate-900">
            <span className="inline-block w-3 h-[3px] rounded bg-emerald-600" />
            {labels.completions}
          </span>
          <span className="flex items-center gap-1.5 text-lime-700">
            <span className="inline-block w-3 h-[3px] rounded bg-lime-300" style={{ opacity: 0.7 }} />
            {labels.new_learners}
          </span>
        </div>
      </div>

      {totalActivity === 0 ? (
        <div className="h-[120px] flex items-center justify-center text-small text-slate-400">
          {labels.empty}
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} role="img">
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* baseline */}
          <line x1={padX} y1={H - padY} x2={W - padX} y2={H - padY} stroke="rgba(0,0,0,.08)" strokeWidth="1" />
          {/* completions area + line */}
          <path d={areaPath} fill="url(#activityFill)" />
          <path d={linePath("module_completions")} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {/* new learners dotted line */}
          <path d={linePath("new_learners")} fill="none" stroke="#bef264" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" opacity="0.8" />
          {/* completion dots + value labels */}
          {points.map((p, i) => (
            <g key={p.date}>
              <circle cx={x(i)} cy={y(p.module_completions)} r="3" fill="#34d399" />
              {p.module_completions > 0 ? (
                <text x={x(i)} y={y(p.module_completions) - 7} textAnchor="middle" fontSize="10" fill="#475569" fontFamily="ui-monospace,monospace">
                  {p.module_completions}
                </text>
              ) : null}
            </g>
          ))}
          {/* x-axis day labels (Mon/Tue ...) */}
          {points.map((p, i) => {
            const d = new Date(p.date + "T00:00:00Z");
            const wd = d.toLocaleDateString("en-NZ", { weekday: "short", timeZone: "UTC" });
            return (
              <text key={p.date} x={x(i)} y={H - 4} textAnchor="middle" fontSize="9.5" fill="#64748b" fontFamily="ui-monospace,monospace">
                {wd}
              </text>
            );
          })}
        </svg>
      )}
    </section>
  );
}
