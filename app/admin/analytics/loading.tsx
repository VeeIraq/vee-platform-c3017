export default function AdminAnalyticsLoading() {
  return (
    <div>
      <div className="mb-1 h-8 w-40 animate-pulse rounded bg-line" />
      <div className="mb-6 h-4 w-72 animate-pulse rounded bg-line" />
      <div className="mb-6 h-40 animate-pulse rounded-[var(--radius-lg)] bg-line" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-line" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-line lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-line" />
      </div>
    </div>
  );
}
