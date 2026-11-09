import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md bg-bg px-4 py-24 text-center text-text">
      <h1 className="text-2xl font-bold">Listing not found</h1>
      <p className="mt-2 text-text-muted">It may have been removed, or it is not public yet.</p>
      <Link href="/browse" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary">Browse listings</Link>
    </main>
  );
}
