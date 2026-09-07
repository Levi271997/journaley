"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EntrySummary } from "@/lib/entries";

function preview(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export function EntryList({
  entries,
  moods,
  emptyMessage,
}: {
  entries: EntrySummary[];
  moods: Record<string, string>;
  emptyMessage: string;
}) {
  const pathname = usePathname();

  if (entries.length === 0) {
    return <p className="px-3 py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-1">
      {entries.map((entry) => {
        const active = pathname === `/journal/${entry.id}`;
        return (
          <li key={entry.id}>
            <Link
              href={`/journal/${entry.id}`}
              aria-current={active ? "page" : undefined}
              className={`block rounded-lg px-3 py-2.5 transition-colors ${
                active ? "bg-accent-soft" : "hover:bg-accent-soft/60"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-medium">
                  {entry.title || "Untitled"}
                </span>
                {entry.mood && (
                  <span aria-hidden className="shrink-0">
                    {moods[entry.mood]}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted">{formatDate(entry.entry_date)}</div>
              {entry.body && (
                <p className="mt-1 line-clamp-2 text-xs text-muted">{preview(entry.body)}</p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
