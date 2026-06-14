"use client";

import { useState } from "react";

/**
 * Two-input colour picker that stays in sync.
 *
 * Native <input type="color"> doesn't auto-update its companion text input, so
 * if you only read the hex text field at form submit you get the OLD value and
 * the user's pick is silently dropped (the bug operators hit before this
 * component existed). We mirror state both ways with one useState.
 *
 * Only the hex input carries `name={name}` — the colour swatch is purely a UI
 * affordance and shouldn't submit a separate value.
 */
export function ColourField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint: string;
  defaultValue: string | null;
}) {
  const initial = normaliseForPicker(defaultValue);
  const [value, setValue] = useState<string>(initial.hex);

  return (
    <label className="block">
      <div className="text-[12px] font-semibold text-white">{label}</div>
      <div className="text-[11px] text-[#86b69a] mb-1.5">{hint}</div>
      <div className="flex items-center gap-2 bg-[#04241e] border border-white/[.10] rounded-md px-2 py-1.5">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`${label} colour swatch`}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
        />
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#hex or blank to reset"
          maxLength={7}
          spellCheck={false}
          className="flex-1 bg-transparent border-0 outline-none text-[13px] text-white font-mono"
        />
      </div>
    </label>
  );
}

/** Normalise the stored value (may be null, #abc, or #aabbcc) into a hex the
 *  <input type="color"> can render. Returns `hex: ""` when the operator has no
 *  saved value — the swatch then renders black but submitting "" is read as
 *  "reset to Libretour default" by the server action. */
function normaliseForPicker(stored: string | null): { hex: string } {
  if (!stored) return { hex: "" };
  const s = stored.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const h = s.slice(1);
    return { hex: `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase() };
  }
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return { hex: s.toLowerCase() };
  return { hex: "" };
}
