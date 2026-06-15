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
      <div className="text-[11px] tracking-widest font-mono text-emerald-300/70 mb-1.5">{label}</div>
      <select
        value={current}
        onChange={(e) => router.push(`/product/${operatorSlug}/courses/${e.target.value}/edit`)}
        className="w-full bg-[#0a3a2f] border border-white/[.10] rounded-md px-3 py-2 text-[13.5px] text-white outline-none focus:border-emerald-400/60"
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
