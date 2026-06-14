import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { db, type CourseWithOperator } from "@/lib/db";
import { TopBar } from "../_components/top-bar";
import { bootstrapAdminFromEmailList } from "@/lib/roles";
import { t, fmt } from "@/lib/i18n";
import { FavoriteButton } from "./favorite-button";

export const dynamic = "force-dynamic";

type Tab = "in_progress" | "completed" | "favorites" | "all" | "badges";
const TABS: Array<{ id: Tab; label: string }> = [
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "favorites", label: "Favorites" },
  { id: "all", label: "All courses" },
  { id: "badges", label: "Badges" },
];

interface CourseCardData extends CourseWithOperator {
  /** True when an enrollment exists and last_seen_version < published_version */
  has_update: boolean;
  /** Total module count for progress display */
  module_count: number;
  /** Completed module count for the current user */
  completed_modules: number;
  /** Is this course in user's favorites */
  is_favorite: boolean;
}

interface BadgeCard {
  verify_code: string;
  awarded_at: number;
  course_title: string;
  operator_name: string;
  operator_slug: string;
  course_slug: string;
  emoji: string | null;
  cover_color: string | null;
}

export default async function LearnHome({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  // bootstrapAdminFromEmailList reconciles users + platform_admins on first
  // sign-in. Letting failures bubble surfaces them via the /learn error
  // boundary so we don't silently lose admin promotion again.
  await bootstrapAdminFromEmailList();
  const [paramsResult, userResult, authResult, trResult] = await Promise.allSettled([
    searchParams,
    currentUser(),
    auth(),
    t(),
  ]);
  for (const [name, r] of [
    ["searchParams", paramsResult],
    ["currentUser", userResult],
    ["auth", authResult],
    ["t", trResult],
  ] as const) {
    if (r.status === "rejected") {
      console.error(`[/learn] ${name}() rejected:`, r.reason instanceof Error ? r.reason.message : r.reason);
    }
  }
  const { tab: tabParam, q: rawQ } = paramsResult.status === "fulfilled" ? paramsResult.value : { tab: undefined, q: undefined };
  const user = userResult.status === "fulfilled" ? userResult.value : null;
  const { userId } = authResult.status === "fulfilled" ? authResult.value : { userId: null };
  const tr = trResult.status === "fulfilled" ? trResult.value : null;
  if (!tr) {
    throw new Error("[/learn] i18n strings failed to load");
  }
  const tab: Tab = (TABS.find((t) => t.id === tabParam)?.id ?? "in_progress") as Tab;
  const q = (rawQ ?? "").trim().slice(0, 80);

  const firstName =
    user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? tr.learn_anonymous;

  let cards: CourseCardData[] = [];
  let badges: BadgeCard[] = [];
  let counts: Record<Tab, number> = { in_progress: 0, completed: 0, favorites: 0, all: 0, badges: 0 };

  if (userId) {
    // Single query gets everything we need: every published course, with
    // per-user enrollment + favorites + progress aggregates folded in.
    let results: Array<CourseWithOperator & { published_version: number; last_seen_version: number | null; module_count: number; completed_modules: number; is_favorite: number }> = [];
    try {
      const r = await db()
      .prepare(
        `SELECT c.id, c.slug, c.operator_id, c.title, c.summary, c.cover_color, c.emoji, c.cover_r2_key,
                c.primary_lang, c.status, c.est_minutes, c.ai_examples_json, c.published_version,
                c.available_langs, c.title_i18n, c.summary_i18n,
                o.name AS operator_name, o.slug AS operator_slug,
                e.last_seen_version,
                (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) AS module_count,
                (SELECT COUNT(*) FROM module_progress mp
                   JOIN modules m ON m.id = mp.module_id
                   WHERE mp.user_id = ? AND m.course_id = c.id AND mp.completed_at IS NOT NULL
                ) AS completed_modules,
                (SELECT COUNT(*) FROM user_favorites uf WHERE uf.user_id = ? AND uf.course_id = c.id) AS is_favorite
         FROM courses c
         JOIN operators o ON o.id = c.operator_id
         LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
         WHERE c.status = 'published' AND o.status = 'active'
         ORDER BY (e.started_at IS NULL) ASC, e.started_at DESC, o.name, c.title`,
      )
      .bind(userId, userId, userId)
      .all<
        CourseWithOperator & {
          published_version: number;
          last_seen_version: number | null;
          module_count: number;
          completed_modules: number;
          is_favorite: number;
        }
      >();
      results = r.results ?? [];
    } catch (e) {
      console.error("[/learn] cards query threw:", e instanceof Error ? e.message : e, e instanceof Error ? e.stack : "");
      results = [];
    }
    cards = results.map((r) => {
      const enrolled = r.last_seen_version !== null;
      return {
        ...r,
        has_update:
          enrolled && (r.last_seen_version ?? 0) < r.published_version,
        module_count: r.module_count ?? 0,
        completed_modules: r.completed_modules ?? 0,
        is_favorite: !!r.is_favorite,
      } as CourseCardData;
    });

    // Counts for tab badges
    for (const c of cards) {
      counts.all += 1;
      if (c.is_favorite) counts.favorites += 1;
      const inProgress = c.completed_modules > 0 && c.completed_modules < c.module_count;
      const completed = c.module_count > 0 && c.completed_modules === c.module_count;
      if (inProgress) counts.in_progress += 1;
      if (completed) counts.completed += 1;
    }

    // Badges
    const { results: badgeRows = [] } = await db()
      .prepare(
        `SELECT b.verify_code, b.awarded_at, c.title AS course_title, c.slug AS course_slug,
                c.emoji, c.cover_color, o.name AS operator_name, o.slug AS operator_slug
         FROM badges b
         JOIN courses c ON c.id = b.course_id
         JOIN operators o ON o.id = b.operator_id
         WHERE b.user_id = ?
         ORDER BY b.awarded_at DESC`,
      )
      .bind(userId)
      .all<BadgeCard>();
    badges = badgeRows;
    counts.badges = badges.length;
  } else {
    // Anonymous: show all published as the "All" tab, no progress / favorites.
    const { results = [] } = await db()
      .prepare(
        `SELECT c.id, c.slug, c.operator_id, c.title, c.summary, c.cover_color, c.emoji, c.cover_r2_key,
                c.primary_lang, c.status, c.est_minutes, c.ai_examples_json,
                c.available_langs, c.title_i18n, c.summary_i18n,
                o.name AS operator_name, o.slug AS operator_slug
         FROM courses c
         JOIN operators o ON o.id = c.operator_id
         WHERE c.status='published' AND o.status='active'
         ORDER BY o.name, c.title`,
      )
      .all<CourseWithOperator>();
    cards = results.map((r) => ({
      ...r,
      has_update: false,
      module_count: 0,
      completed_modules: 0,
      is_favorite: false,
    }));
    counts.all = cards.length;
  }

  // Filter for the active tab
  const filtered = (() => {
    const matches = (c: CourseCardData) =>
      q.length === 0 ||
      c.title.toLowerCase().includes(q.toLowerCase()) ||
      c.operator_name.toLowerCase().includes(q.toLowerCase()) ||
      (c.summary ?? "").toLowerCase().includes(q.toLowerCase());
    switch (tab) {
      case "in_progress":
        return cards
          .filter((c) => c.completed_modules > 0 && c.completed_modules < c.module_count)
          .filter(matches);
      case "completed":
        return cards
          .filter((c) => c.module_count > 0 && c.completed_modules === c.module_count)
          .filter(matches);
      case "favorites":
        return cards.filter((c) => c.is_favorite).filter(matches);
      case "all":
        return cards.filter(matches);
      case "badges":
        return [];
    }
  })();

  const operatorCount = new Set(cards.map((c) => c.operator_slug)).size;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2">
            <Link href="/" className="hover:text-slate-900">
              {tr.nav_home}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">{tr.nav_my_learning}</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-10 sm:py-12 max-w-6xl mx-auto">
        <div className="mb-7 sm:mb-9">
          <div className="text-[11px] tracking-widest font-mono text-emerald-700/70 mb-1">
            {tr.learn_label}
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-slate-900">
            {fmt(tr.learn_welcome, { name: firstName })}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-600 mt-1.5">
            {fmt(tr.learn_summary, { courses: cards.length, operators: operatorCount })}
          </p>
        </div>

        {/* Tabs + search */}
        <div className="border-b border-slate-200 mb-5 flex items-end gap-3 flex-wrap">
          <nav className="flex items-end gap-1">
            {TABS.map((t) => {
              const params = new URLSearchParams({ tab: t.id });
              if (q) params.set("q", q);
              const active = t.id === tab;
              return (
                <Link
                  key={t.id}
                  href={`/learn?${params.toString()}`}
                  className={`px-3 py-2 text-[13.5px] border-b-2 -mb-px ${
                    active
                      ? "border-emerald-600 text-slate-900 font-semibold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                  <span
                    className={`ml-1.5 text-[11px] font-mono ${
                      active ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {counts[t.id]}
                  </span>
                </Link>
              );
            })}
          </nav>
          <form className="ml-auto" action="/learn">
            <input type="hidden" name="tab" value={tab} />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search title, supplier, summary…"
              className="w-64 max-w-full px-3 py-1.5 rounded-md border border-slate-300 text-[13px] outline-none focus:border-emerald-500"
            />
          </form>
        </div>

        {/* Body */}
        {tab === "badges" ? (
          <BadgesGrid badges={badges} />
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} q={q} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <CourseCard key={c.id} c={c} t={tr} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CourseCard({ c, t }: { c: CourseCardData; t: { card_live: string; card_minutes: string } }) {
  const pct =
    c.module_count > 0 ? Math.round((c.completed_modules / c.module_count) * 100) : 0;
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition relative">
      <Link href={`/learn/${c.operator_slug}/${c.slug}`} className="block">
        <div
          className="h-32 relative overflow-hidden"
          style={{ background: c.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)" }}
        >
          {c.cover_r2_key ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/course-cover?id=${c.id}`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-medium text-emerald-200 border border-white/15">
              {t.card_live}
            </span>
            {c.has_update ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-400/90 text-[#04241e] text-[11px] font-semibold border border-amber-300">
                Updated
              </span>
            ) : null}
          </div>
          <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between z-10">
            <div className="text-[36px] leading-none drop-shadow">{c.cover_r2_key ? "" : c.emoji ?? "📚"}</div>
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] text-white/85 border border-white/15">
              {c.operator_name}
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="font-semibold text-[17px] text-slate-900 leading-snug line-clamp-2">
            {c.title}
          </div>
          <p className="text-[13px] text-slate-600 mt-1.5 line-clamp-2">{c.summary}</p>
          {c.module_count > 0 && c.completed_modules > 0 ? (
            <div className="mt-3">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>
                  {c.completed_modules} / {c.module_count} modules
                </span>
                <span className="text-emerald-700 font-mono">{pct}%</span>
              </div>
            </div>
          ) : null}
          <div className="flex items-center gap-2.5 mt-3.5 text-[13px] text-slate-500">
            {c.est_minutes ? <span>⏱ {fmt(t.card_minutes, { n: c.est_minutes })}</span> : null}
            <span className="text-slate-300">·</span>
            <span>{c.primary_lang.toUpperCase()}</span>
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              💬 AI
            </span>
          </div>
        </div>
      </Link>
      <div className="absolute top-3.5 right-3.5">
        <FavoriteButton courseId={c.id} initial={c.is_favorite} compact />
      </div>
    </div>
  );
}

function BadgesGrid({ badges }: { badges: BadgeCard[] }) {
  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 text-[14px]">
        No badges yet. Complete a course to earn your first.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {badges.map((b) => (
        <Link
          key={b.verify_code}
          href={`/verify/${b.verify_code}`}
          target="_blank"
          className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-lime-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition"
        >
          <div
            className="h-24 flex items-end p-3"
            style={{ background: b.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)" }}
          >
            <div className="text-[40px] leading-none drop-shadow">{b.emoji ?? "🏅"}</div>
          </div>
          <div className="p-4">
            <div className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">
              {b.course_title}
            </div>
            <div className="text-[12px] text-slate-500 mt-1.5 flex items-center gap-2">
              <span>{b.operator_name}</span>
              <span className="text-slate-300">·</span>
              <span>{new Date(b.awarded_at * 1000).toISOString().slice(0, 10)}</span>
            </div>
            <div className="mt-2 font-mono text-[11px] text-lime-700">{b.verify_code}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ tab, q }: { tab: Tab; q: string }) {
  const msg = q
    ? `Nothing matches "${q}" in this view.`
    : tab === "in_progress"
      ? "You haven't started anything yet. Browse the All tab and dive in."
      : tab === "completed"
        ? "No completed courses yet — finish a chapter to start earning a badge."
        : tab === "favorites"
          ? "No favorites yet — tap the ♥ on any card to save it here."
          : "Nothing published yet.";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500 text-[14px]">
      {msg}
    </div>
  );
}
