const TONES: Record<string, string> = {
  approved: "bg-primary/15 text-primary",
  paid: "bg-primary/15 text-primary",
  confirmed: "bg-primary/15 text-primary",
  verified: "bg-primary/15 text-primary",
  pending: "bg-accent/20 text-text",
  draft: "bg-surface-soft text-text-muted",
  closed: "bg-surface-soft text-text-muted",
  rejected: "bg-red-500/15 text-red-500",
  failed: "bg-red-500/15 text-red-500",
  expired: "bg-red-500/15 text-red-500",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status ?? "").toLowerCase();
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TONES[key] ?? "bg-surface-soft text-text-muted"}`}>
      {status ?? "—"}
    </span>
  );
}
