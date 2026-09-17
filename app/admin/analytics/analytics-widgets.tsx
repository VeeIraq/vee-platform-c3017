export function StatTile({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink">{value.toLocaleString()}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

/** Simple, dependency-free horizontal bar chart -- proportional widths
 *  computed against the largest value in the set. No JS/charting library
 *  needed for this shape of data, and it stays legible at any width. */
export function BarList({ items, emptyLabel }: { items: { label: string; value: number }[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <dl className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <dt className="w-32 shrink-0 truncate capitalize text-ink-soft">{item.label}</dt>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-fog">
            <div className="h-full rounded-full [background:var(--accent-grad)]" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <dd className="w-12 shrink-0 text-end font-semibold text-ink">{item.value.toLocaleString()}</dd>
        </div>
      ))}
    </dl>
  );
}
