"use client";

import { useState } from "react";
import { useTr } from "@/lib/i18n-provider";
import type { Dict } from "@/lib/i18n";
import type { OperatorCard as OperatorCardData } from "@/lib/db";
import { OperatorCard } from "../_components/operator-card";
import { NZ_RTOS } from "@/lib/rto";

/**
 * Products directory: a region filter (chips) on top, products grouped by
 * experience category below. Category/region codes come from the DB; labels
 * are looked up in the i18n dict.
 */

const CATEGORY_ORDER = [
  "attractions",
  "adventure",
  "culture",
  "water",
  "land",
  "air",
  "accommodation",
  "tour",
  "rto",
];
// Region = NZ Regional Tourism Organisation (RTO). Values are the RTO names
// themselves (stored verbatim in operators.region), so they are their own label.
const REGION_ORDER: readonly string[] = NZ_RTOS;

function catLabel(tr: Dict, c: string | null): string {
  switch (c) {
    case "attractions": return tr.cat_attractions;
    case "adventure": return tr.cat_adventure;
    case "culture": return tr.cat_culture;
    case "water": return tr.cat_water;
    case "land": return tr.cat_land;
    case "air": return tr.cat_air;
    case "accommodation": return tr.cat_accommodation;
    case "tour": return tr.cat_tour;
    case "rto": return tr.cat_rto;
    default: return tr.cat_other;
  }
}

function regLabel(_tr: Dict, r: string): string {
  return r; // RTO name is its own label (no translation — proper org names)
}

export function ProductsBrowser({ operators }: { operators: OperatorCardData[] }) {
  const tr = useTr();
  const [region, setRegion] = useState<string>("all");

  const present = new Set(operators.map((o) => o.region).filter(Boolean) as string[]);
  const regions = REGION_ORDER.filter((r) => present.has(r));

  const filtered = region === "all" ? operators : operators.filter((o) => o.region === region);

  const cats = [...CATEGORY_ORDER, "other"];
  const groups = cats
    .map((cat) => ({
      cat,
      items: filtered.filter((o) =>
        cat === "other"
          ? !CATEGORY_ORDER.includes(o.category ?? "")
          : o.category === cat,
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      {/* Region filter */}
      <div className="flex items-center gap-2 flex-wrap mb-8">
        <span className="text-caption text-slate-500 mr-1">{tr.pr_filter_region}:</span>
        {["all", ...regions].map((r) => {
          const on = region === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`px-3 py-1.5 rounded-full border text-caption transition ${
                on
                  ? "bg-[#04241e] border-[#04241e] text-white"
                  : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
              }`}
            >
              {r === "all" ? tr.reg_all : regLabel(tr, r)}
            </button>
          );
        })}
      </div>

      {/* Category sections */}
      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.cat}>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-title sm:text-h3 font-semibold text-slate-900">
                {catLabel(tr, g.cat)}
              </h2>
              <span className="text-caption text-slate-400">{g.items.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {g.items.map((op) => (
                <OperatorCard
                  key={op.id}
                  op={op}
                  tr={tr}
                  canManage={false}
                  href={`/products/${op.slug}`}
                  nameAsTitle
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
