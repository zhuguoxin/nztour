import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

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
    <div className="min-h-screen bg-[#0b1117] text-[#e6edf3] font-sans flex flex-col">
      <header className="border-b border-[#1f2a35] px-7 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 19l9-14 9 14H3z" stroke="#22d3ee" strokeWidth="2" fill="rgba(34,211,238,.1)" />
            <circle cx="12" cy="14" r="2" fill="#a3e635" />
          </svg>
          <span className="font-semibold text-[15px]">
            <span className="text-[#22d3ee]">Tour</span>Train
          </span>
        </Link>
      </header>

      <main className="flex-1 px-6 py-16 max-w-2xl mx-auto w-full">
        <div className="text-[11px] tracking-widest font-mono text-[#5b6b7d] mb-2">
          VERIFIED BADGE
        </div>
        <h1 className="text-3xl font-semibold">
          <span className="text-[#bef264]">✓</span> Authentic
        </h1>
        <p className="text-[14px] text-[#9aa7b8] mt-1">
          This badge was issued by TourTrain on behalf of the operator listed below.
        </p>

        <div className="mt-8 rounded-2xl overflow-hidden border border-[#1f2a35] bg-[#11181f]">
          <div
            className="h-36 flex items-center justify-center"
            style={{
              background: row.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)",
            }}
          >
            <div className="text-6xl">{row.emoji ?? "🏅"}</div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="text-[11px] font-mono text-[#5b6b7d]">COURSE</div>
              <div className="text-lg font-semibold">{row.course_title}</div>
              {row.course_summary ? (
                <div className="text-[13px] text-[#9aa7b8] mt-1">{row.course_summary}</div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-mono text-[#5b6b7d]">OPERATOR</div>
                <div className="text-[14px]">{row.operator_name}</div>
                <div className="text-[11px] text-[#5b6b7d]">{row.operator_country}</div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-[#5b6b7d]">LEARNER</div>
                <div className="text-[14px]">{learnerLabel}</div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-[#5b6b7d]">AWARDED</div>
                <div className="text-[14px]">
                  {awarded.toISOString().slice(0, 10)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-[#5b6b7d]">VERIFY CODE</div>
                <div className="font-mono text-[14px] text-[#67e8f9]">{row.verify_code}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[12px] text-[#5b6b7d]">
          Anyone with this URL can verify authenticity. Share on LinkedIn or in your email signature:
          <div className="font-mono text-[11px] mt-1">tourtrain.pages.dev/verify/{row.verify_code}</div>
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
