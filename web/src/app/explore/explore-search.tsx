"use client";

import { useState } from "react";
import { CourseCard } from "../_components/course-card";
import { useTr } from "@/lib/i18n-provider";
import type { CourseWithOperator } from "@/lib/db";

/**
 * Client-side course search + grid for the public /explore page. Filters the
 * pre-loaded published-course list by title / supplier name (case-insensitive
 * substring) as the user types.
 */
export function ExploreSearch({ courses }: { courses: CourseWithOperator[] }) {
  const tr = useTr();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.operator_name.toLowerCase().includes(q),
      )
    : courses;

  return (
    <div>
      <div className="mb-6 max-w-md">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr.ex_search_ph}
          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} tr={tr} />
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-slate-500 py-8">{tr.ex_no_results}</p>
      )}
    </div>
  );
}
