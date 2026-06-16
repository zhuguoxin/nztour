import Link from "next/link";

export interface Crumb {
  href?: string;
  label: string;
}

/**
 * In-content breadcrumb shown just above a page's heading (light theme), rather
 * than in the dark TopBar. The last item renders as the current page (no link).
 */
export function PageBreadcrumb({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return (
    <nav className={`flex items-center gap-1.5 text-[12.5px] text-slate-500 flex-wrap min-w-0 ${className}`}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 ? <span className="text-slate-300">/</span> : null}
            {it.href && !last ? (
              <Link href={it.href} className="hover:text-slate-700 shrink-0">{it.label}</Link>
            ) : (
              <span className={last ? "text-slate-700 truncate" : "shrink-0"}>{it.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
