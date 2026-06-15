"use client";

import { useState } from "react";
import { useTr } from "@/lib/i18n-provider";
import type { Dict } from "@/lib/i18n";
import type { OperatorCard as OperatorCardData } from "@/lib/db";
import { OperatorCard } from "../_components/operator-card";

/**
 * Products directory: a region filter (chips) on top, products grouped by
 * experience category below. Category/region codes come from the DB; labels
 * are looked up in the i18n dict.
 */

const CATEGORY_ORDER = ["snow", "adventure", "cruise", "hiking", "stay", "entertainment"];
const REGION_ORDER = [
  "queenstown",
  "fiordland",
  "aoraki",
  "rotorua",
  "auckland",
  "waikato",
  "canterbury",
  "australia",
];

function catLabel(tr: Dict, c: string | null): string {
  switch (c) {
    case "snow": return tr.cat_snow;
    case "adventure": return tr.cat_adventure;
    case "cruise": return tr.cat_cruise;
    case "hiking": return tr.cat_hiking;
    case "stay": return tr.cat_stay;
    case "entertainment": return tr.cat_entertainment;
    default: return tr.cat_other;
  }
}

function regLabel(tr: Dict, r: string): string {
  switch (r) {
    case "queenstown": return tr.reg_queenstown;
    case "fiordland": return tr.reg_fiordland;
    case "aoraki": return tr.reg_aoraki;
    case "rotorua": return tr.reg_rotorua;
    case "auckland": return tr.reg_auckland;
    case "waikato": return tr.reg_waikato;
    case "canterbury": return tr.reg_canterbury;
    case "australia": return tr.reg_australia;
    default: return r;
  }
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
        <span className="text-[12.5px] text-slate-500 mr-1">{tr.pr_filter_region}:</span>
        {["all", ...regions].map((r) => {
          const on = region === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`px-3 py-1.5 rounded-full border text-[12.5px] transition ${
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
              <h2 className="text-[18px] sm:text-[20px] font-semibold text-slate-900">
                {catLabel(tr, g.cat)}
              </h2>
              <span className="text-[12.5px] text-slate-400">{g.items.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {g.items.map((op) => (
                <OperatorCard
                  key={op.id}
                  op={op}
                  tr={tr}
                  canManage={false}
                  href={`/products/${op.slug}`}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
