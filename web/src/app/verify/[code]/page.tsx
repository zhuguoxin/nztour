import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Logo } from "../../_components/top-bar";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface BadgeView {
  verify_code: string;
  awarded_at: number;
  course_title: string;
  course_summary: string | null;
  operator_name: string;
  operator_country: string;
  learner_name: string | null;
  learner_email: string;
  cover_color: string | null;
  emoji: string | null;
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const tr = await t();
  const row = await db()
    .prepare(
      `SELECT b.verify_code, b.awarded_at,
              c.title AS course_title, c.summary AS course_summary,
              c.cover_color, c.emoji,
              o.name AS operator_name, o.country AS operator_country,
              u.name AS learner_name, u.email AS learner_email
       FROM badges b
       JOIN courses c ON c.id = b.course_id
       JOIN operators o ON o.id = b.operator_id
       JOIN users u ON u.id = b.user_id
       WHERE b.verify_code = ?`,
    )
    .bind(code.toUpperCase())
    .first<BadgeView>();
  if (!row) notFound();

  const awarded = new Date(row.awarded_at * 1000);
  const learnerLabel = row.learner_name ?? maskEmail(row.learner_email);

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased text-[16px] flex flex-col">
      <header className="border-b border-white/[.06] px-5 sm:px-8 py-3.5">
        <Logo />
      </header>

      <main className="flex-1 px-5 sm:px-8 py-12 sm:py-16 max-w-2xl mx-auto w-full">
        <div className="text-[11px] tracking-widest font-mono text-emerald-300/70 mb-2">
          {tr.verify_chrome_label}
        </div>
        <h1 className="text-[32px] sm:text-[36px] font-semibold tracking-tight text-white">
          <span className="text-lime-300">✓</span> {tr.verify_chrome_title}
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#a7d4b6] mt-1.5">
          {tr.verify_chrome_subtitle}
        </p>

        <div className="mt-8 rounded-2xl overflow-hidden border border-white/[.08] bg-[#0a3a2f]">
          <div
            className="h-40 flex items-center justify-center"
            style={{
              background: row.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)",
            }}
          >
            <div className="text-[72px] drop-shadow">{row.emoji ?? "🏅"}</div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <div className="text-[11px] font-mono text-emerald-300/70">{tr.verify_field_course}</div>
              <div className="text-[20px] font-semibold text-white mt-0.5">{row.course_title}</div>
              {row.course_summary ? (
                <div className="text-[14px] text-[#a7d4b6] mt-1.5 leading-relaxed">
                  {row.course_summary}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="text-[11px] font-mono text-emerald-300/70">{tr.verify_field_operator}</div>
                <div className="text-[14px] text-white mt-0.5">{row.operator_name}</div>
                <div className="text-[11px] text-[#86b69a]">{row.operator_country}</div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-emerald-300/70">{tr.verify_field_learner}</div>
                <div className="text-[14px] text-white mt-0.5">{learnerLabel}</div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-emerald-300/70">{tr.verify_field_awarded}</div>
                <div className="text-[14px] text-white mt-0.5">
                  {awarded.toISOString().slice(0, 10)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-emerald-300/70">{tr.verify_field_code}</div>
                <div className="font-mono text-[14px] text-emerald-300 mt-0.5">{row.verify_code}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[12px] text-[#86b69a]">
          {tr.verify_share_lead}
          <div className="font-mono text-[11px] text-[#5d9279] mt-1">
            www.libretour.com/verify/{row.verify_code}
          </div>
        </div>
      </main>
    </div>
  );
}

function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  if (!u || !d) return email;
  const head = u.slice(0, 2);
  return `${head}${"•".repeat(Math.max(3, u.length - 2))}@${d}`;
}
