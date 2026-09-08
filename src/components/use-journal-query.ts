"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useProgressWhile } from "./progress";

/**
 * Rewrites some of the journal's query parameters while leaving the rest
 * alone, so the search box and the date filter do not clear each other.
 * An empty value drops the parameter entirely.
 */
export function useJournalQuery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Filtering re-renders the sidebar on the server, so it gets the same top
  // bar as a page navigation — the search box keeps its own inline hint.
  useProgressWhile(isPending);

  function apply(changes: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }

    const query = next.toString();
    startTransition(() => router.replace(query ? `/journal?${query}` : "/journal"));
  }

  return { apply, isPending };
}
