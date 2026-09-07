"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();

  // Debounce so a fast typist does not fire a request per keystroke.
  useEffect(() => {
    if (value === initial) return;

    const timer = setTimeout(() => {
      const query = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : "";
      startTransition(() => router.replace(`/journal${query}`));
    }, 250);

    return () => clearTimeout(timer);
  }, [value, initial, router]);

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
