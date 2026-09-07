"use client";

import { CATEGORIES } from "@/lib/categories";
import { useJournalQuery } from "./use-journal-query";

/** Narrows the sidebar to one category, or to entries filed under none. */
export function CategoryFilter({ category }: { category: string }) {
  const { apply } = useJournalQuery();

  return (
    <div className="rounded-lg border border-line px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wide text-muted uppercase">Category</span>
        {category && (
          <button
            type="button"
            onClick={() => apply({ category: "" })}
            className="text-xs text-accent underline underline-offset-2 hover:opacity-80"
          >
            Clear
          </button>
        )}
      </div>

      <select
        value={category}
        onChange={(event) => apply({ category: event.target.value })}
        aria-label="Filter by category"
        className="field mt-2 py-1 text-sm"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.emoji} {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
