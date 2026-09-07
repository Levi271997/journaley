"use client";

import { useJournalQuery } from "./use-journal-query";

/**
 * The tags the user has actually written, as toggles. Only one at a time:
 * a journal's tags overlap little, so stacking them mostly yields nothing.
 */
export function TagFilter({ tags, active }: { tags: string[]; active: string }) {
  const { apply } = useJournalQuery();

  if (tags.length === 0) return null;

  return (
    <div className="rounded-lg border border-line px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wide text-muted uppercase">Tags</span>
        {active && (
          <button
            type="button"
            onClick={() => apply({ tag: "" })}
            className="text-xs text-accent underline underline-offset-2 hover:opacity-80"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const on = tag === active;

          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              // Clicking the tag you are already on takes the filter off.
              onClick={() => apply({ tag: on ? "" : tag })}
              className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                on
                  ? "bg-accent text-paper"
                  : "bg-accent-soft text-muted hover:text-ink"
              }`}
            >
              #{tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
