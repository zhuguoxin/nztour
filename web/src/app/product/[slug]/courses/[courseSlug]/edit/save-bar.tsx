"use client";

import { useEffect, useState } from "react";

/**
 * Dirty-aware "Save changes" button for the course editor.
 *
 * The course form (#course-form) plus the editor's per-module/-block inputs
 * (associated via form="course-form") are uncontrolled. We watch document-level
 * input/change events for any element whose .form is #course-form to flip a
 * "dirty" flag: the button stays disabled until something actually changes, and
 * a beforeunload prompt warns before leaving with unsaved edits. Submitting the
 * form clears the flag.
 */
export function SaveBar({ label }: { label: string }) {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const onEdit = (e: Event) => {
      const t = e.target as (HTMLElement & { form?: HTMLFormElement | null }) | null;
      if (!t) return;
      // Primary: any field associated with the course form (incl. the editor's
      // module/block inputs that use form="course-form").
      if (t.form && t.form.id === "course-form") {
        setDirty(true);
        return;
      }
      // Fallback: any named form control inside the editor's centre column. This
      // makes the "unsaved" hint robust even if .form resolution is flaky.
      const el = t as HTMLInputElement;
      if (el.name && typeof t.closest === "function" && t.closest("#course-editor-main")) {
        setDirty(true);
      }
    };
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);

    const form = document.getElementById("course-form");
    const onSubmit = () => setDirty(false);
    form?.addEventListener("submit", onSubmit);

    return () => {
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
      form?.removeEventListener("submit", onSubmit);
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <button
      type="submit"
      form="course-form"
      className={`w-full px-4 py-2.5 rounded-md font-semibold text-small transition ${
        dirty
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
