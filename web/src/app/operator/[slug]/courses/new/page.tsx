import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "../../../../_components/top-bar";
import { requireOperatorMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { createCourse } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    await requireOperatorMembership(slug);
  } catch {
    notFound();
  }
  const op = await db()
    .prepare(`SELECT name FROM operators WHERE slug = ?`)
    .bind(slug)
    .first<{ name: string }>();
  if (!op) notFound();

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0 text-[14px]">
            <Link href={`/operator/${slug}`} className="hover:text-white">
              {op.name}
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white">New course</span>
          </span>
        }
      />
      <main className="px-5 sm:px-8 py-10 max-w-2xl mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-emerald-300/70">
          /OPERATOR · NEW COURSE
        </div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-white mt-1">
          Create a new course
        </h1>
        <p className="text-[13.5px] text-[#a7d4b6] mt-1.5">
          Give the course a title and a one-line summary. You can add modules and content blocks
          after it's created. New courses start as drafts.
        </p>

        <form action={createCourse} className="mt-8 space-y-5">
          <input type="hidden" name="operator_slug" value={slug} />

          <Field label="Title" hint="What an agent sees on the course card.">
            <input
              name="title"
              required
              maxLength={200}
              placeholder="e.g. Coronet Peak 2026"
              className="w-full bg-[#0a3a2f] border border-white/[.10] rounded-md px-3 py-2.5 text-[14.5px] text-white outline-none focus:border-emerald-400/60"
            />
          </Field>

          <Field label="Summary" hint="1-2 sentences. Optional.">
            <textarea
              name="summary"
              rows={3}
              maxLength={1000}
              placeholder="Pitch this course to agents in one or two sentences."
              className="w-full bg-[#0a3a2f] border border-white/[.10] rounded-md px-3 py-2.5 text-[14.5px] text-white outline-none focus:border-emerald-400/60 resize-y"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Emoji" hint="One character.">
              <input
                name="emoji"
                maxLength={4}
                placeholder="⛷️"
                className="w-full bg-[#0a3a2f] border border-white/[.10] rounded-md px-3 py-2.5 text-[20px] text-white outline-none focus:border-emerald-400/60"
              />
            </Field>
            <Field label="Estimated minutes" hint="Total reading time.">
              <input
                name="est_minutes"
                type="number"
                min={1}
                max={600}
                placeholder="25"
                className="w-full bg-[#0a3a2f] border border-white/[.10] rounded-md px-3 py-2.5 text-[14.5px] text-white outline-none focus:border-emerald-400/60"
              />
            </Field>
          </div>

          <Field label="Primary language" hint="The language the source content is in.">
            <select
              name="primary_lang"
              defaultValue="en"
              className="w-full bg-[#0a3a2f] border border-white/[.10] rounded-md px-3 py-2.5 text-[14.5px] text-white outline-none focus:border-emerald-400/60"
            >
              <option value="en">English</option>
              <option value="zh-CN">简体中文</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </Field>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[14px] hover:bg-emerald-300"
            >
              Create course →
            </button>
            <Link
              href={`/operator/${slug}`}
              className="px-4 py-2.5 rounded-md border border-white/[.10] text-[#d8f0e1] text-[13px] hover:bg-white/[.06]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[13px] font-semibold text-[#e6f5ec]">{label}</span>
        {hint ? <span className="text-[11.5px] text-[#86b69a]">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
