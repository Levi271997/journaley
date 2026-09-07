"use client";

import { useEffect, useState } from "react";
import { useJournalQuery } from "./use-journal-query";

export function SearchBox({ initial }: { initial: string }) {
  const { apply, isPending } = useJournalQuery();
  const [value, setValue] = useState(initial);

  // Debounce so a fast typist does not fire a request per keystroke.
  useEffect(() => {
    if (value === initial) return;

    const timer = setTimeout(() => apply({ q: value.trim() }), 250);
    return () => clearTimeout(timer);
    // `apply` is rebuilt on every render; re-running the timer for it would
    // defeat the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, initial]);

  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search entries…"
        aria-label="Search entries"
        className="field py-1.5 pl-8 text-sm"
      />
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted">
        {isPending ? "…" : "⌕"}
      </span>
    </div>
  );
}
