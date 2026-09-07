"use client";

import { useJournalQuery } from "./use-journal-query";

/**
 * Narrows the sidebar to entries dated within a range. Either end can stand
 * on its own — a `from` with no `to` means "since then", and the reverse
 * means "up to then".
 */
export function DateFilter({ from, to }: { from: string; to: string }) {
  const { apply } = useJournalQuery();
  const active = Boolean(from || to);

  return (
    <div className="rounded-lg border border-line px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wide text-muted uppercase">Dates</span>
        {active && (
          <button
            type="button"
            onClick={() => apply({ from: "", to: "" })}
            className="text-xs text-accent underline underline-offset-2 hover:opacity-80"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-2 space-y-2">
        <label className="flex items-center gap-2">
          <span className="w-9 shrink-0 text-xs text-muted">From</span>
          <input
            type="date"
            value={from}
            // Bounding each input by the other keeps the picker from offering
            // a range that could never match anything.
            max={to || undefined}
            onChange={(event) => apply({ from: event.target.value })}
            className="field py-1 text-sm"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="w-9 shrink-0 text-xs text-muted">To</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => apply({ to: event.target.value })}
            className="field py-1 text-sm"
          />
        </label>
      </div>
    </div>
  );
}
