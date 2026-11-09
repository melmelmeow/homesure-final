// Pure server component: no JavaScript is shipped to the browser for it.
export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-text">{value}</p>
    </div>
  );
}
