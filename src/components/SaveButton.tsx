"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * The only interactive part of a listing card. Saving goes straight to Supabase from the browser
 * (row level security limits it to the caller's own rows), then router.refresh() re-runs the server
 * components so every count and list on the page agrees.
 */
export function SaveButton({ propertyId, initiallySaved }: { propertyId: string; initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function toggle() {
    setError("");
    const next = !saved;
    setSaved(next); // optimistic
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to save listings.");

      const res = next
        ? await supabase.from("saved_properties").insert({ user_id: user.id, property_id: propertyId })
        : await supabase.from("saved_properties").delete().eq("user_id", user.id).eq("property_id", propertyId);
      if (res.error) throw new Error(res.error.message);
      startTransition(() => router.refresh());
    } catch (err) {
      setSaved(!next);
      setError(err instanceof Error ? err.message : "Could not update");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save listing"}
      title={error || undefined}
      className="rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-text shadow hover:bg-surface"
    >
      {saved ? "♥ Saved" : "♡ Save"}
    </button>
  );
}
