/**
 * StatCard / StatCardGrid
 *
 * Displays data-journalism stat highlights within articles.
 * Used by the blog/data/[slug] template.
 */

export interface StatCardProps {
  /** The main figure to display, e.g. "73%", "1,247", "4.2x" */
  stat: string;
  /** A short label explaining what the stat represents */
  label: string;
  /** Optional source or context note shown beneath the label */
  source?: string;
}

export function StatCard({ stat, label, source }: StatCardProps) {
  return (
    <div className="my-6 p-5 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
      <p
        className="font-bebas text-5xl tracking-wide text-emerald-400 leading-none mb-2"
        aria-label={`${stat} — ${label}`}
      >
        {stat}
      </p>
      <p className="text-sm font-medium text-slate-200 leading-snug">{label}</p>
      {source && (
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">{source}</p>
      )}
    </div>
  );
}

export function StatCardGrid({ stats }: { stats: StatCardProps[] }) {
  return (
    <div className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map((s, i) => (
        <StatCard key={i} {...s} />
      ))}
    </div>
  );
}
