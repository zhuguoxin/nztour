"use client";

import { useRouter } from "next/navigation";

/** Left-rail course dropdown. Selecting a course reloads the editor to that
 *  course's edit page (page jump, per the agreed design). */
export function CourseSwitcher({
  operatorSlug,
  current,
  courses,
  label,
}: {
  operatorSlug: string;
  current: string;
  courses: Array<{ slug: string; title: string }>;
  label: string;
}) {
  const router = useRouter();
  return (
    <div>
      <div className="text-micro tracking-widest font-mono text-slate-700 mb-1.5">{label}</div>
      <select
        value={current}
        onChange={(e) => router.push(`/product/${operatorSlug}/courses/${e.target.value}/edit`)}
        className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-small text-slate-900 outline-none focus:border-emerald-400/60"
      >
        {courses.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.title}
          </option>
        ))}
      </select>
    </div>
  );
}
