"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTr } from "@/lib/i18n-provider";

interface Member {
  user_id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Team / access manager. Lists current members, grants access by email (a role
 * select), and removes members. Generic over the scope (supplier or product) —
 * the parent passes the slug + the add/remove server actions + role options.
 */
export function MemberManager({
  slug,
  members,
  roles,
  addAction,
  removeAction,
}: {
  slug: string;
  members: Member[];
  roles: { value: string; label: string }[];
  addAction: (slug: string, email: string, role: string) => Promise<{ ok: boolean; error?: string }>;
  removeAction: (slug: string, userId: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const tr = useTr();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roles[0]?.value ?? "");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const roleLabel = (v: string) => roles.find((r) => r.value === v)?.label ?? v;
  const friendly = (e?: string) =>
    e === "forbidden" || e === "unauthorised" ? tr.err_no_permission : e ?? tr.err_load_failed;

  const field =
    "w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-caption text-slate-900 outline-none focus:border-emerald-500";

  function add() {
    if (!email.trim()) return;
    setErr(null);
    setOk(false);
    start(async () => {
      const r = await addAction(slug, email.trim(), role);
      if (r.ok) {
        setEmail("");
        setOk(true);
        router.refresh();
      } else setErr(friendly(r.error));
    });
  }

  function remove(uid: string) {
    setErr(null);
    start(async () => {
      const r = await removeAction(slug, uid);
      if (r.ok) router.refresh();
      else setErr(friendly(r.error));
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div>
        <div className="font-semibold text-small text-slate-900">{tr.team_title}</div>
        <div className="text-caption text-slate-500 mt-0.5">{tr.team_sub}</div>
      </div>

      {members.length > 0 ? (
        <ul className="space-y-1.5">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-2 text-caption">
              <span className="flex-1 min-w-0 truncate text-slate-700" title={m.email}>
                {m.name ?? m.email}
              </span>
              <span className="text-micro text-slate-700 uppercase font-mono shrink-0">{roleLabel(m.role)}</span>
              <button
                type="button"
                onClick={() => remove(m.user_id)}
                disabled={pending}
                className="text-rose-600 hover:bg-rose-50 rounded px-1 text-caption shrink-0 disabled:opacity-50"
                title={m.email}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-caption text-slate-400">{tr.team_empty}</div>
      )}

      <div className="space-y-1.5 border-t border-slate-100 pt-3">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setOk(false);
          }}
          placeholder={tr.team_email_ph}
          className={field}
        />
        <div className="flex items-center gap-1.5">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={field + " flex-1"}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={pending || !email.trim()}
            className="px-3.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-caption hover:bg-emerald-700 disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            {tr.team_add}
          </button>
        </div>
        {ok ? <div className="text-caption text-slate-900">{tr.team_added}</div> : null}
        {err ? <div className="text-caption text-rose-600">{err}</div> : null}
        <div className="text-micro text-slate-400">{tr.team_invite_note}</div>
      </div>
    </div>
  );
}
