"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { deleteEntry } from "@/app/actions";
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

const ACTION_CLASS =
  "flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors " +
  "hover:bg-accent-soft hover:text-ink focus-visible:bg-accent-soft focus-visible:text-ink " +
  "disabled:opacity-40";

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="currentColor">
      <path d="M11.6 1.4a1.4 1.4 0 0 1 2 2l-.8.8-2-2 .8-.8ZM9.9 3.1l2 2L5 12H3v-2l6.9-6.9Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="currentColor">
      <path d="M6.5 1h3a.5.5 0 0 1 .5.5V2h3a.5.5 0 0 1 0 1h-.55l-.7 10.06A1.5 1.5 0 0 1 10.25 14h-4.5a1.5 1.5 0 0 1-1.5-1.4L3.55 3H3a.5.5 0 0 1 0-1h3v-.5a.5.5 0 0 1 .5-.5Zm-.4 4a.5.5 0 0 0-.5.53l.3 6a.5.5 0 0 0 1-.06l-.3-6a.5.5 0 0 0-.5-.47Zm3.8 0a.5.5 0 0 0-.5.47l-.3 6a.5.5 0 0 0 1 .06l.3-6a.5.5 0 0 0-.5-.53Z" />
    </svg>
  );
}

function DeleteButton({ title }: { title: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Delete ${title}`}
      title="Delete"
      onClick={(event) => {
        // Deleting an entry cannot be undone, so make it deliberate — the same
        // check the editor's own delete button uses.
        if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
      className={`${ACTION_CLASS} hover:bg-red-500/10 hover:text-red-600 focus-visible:bg-red-500/10 dark:hover:text-red-400`}
    >
      <TrashIcon />
    </button>
  );
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
        const label = entry.title || "Untitled";

        return (
          // The actions sit alongside the link rather than inside it: a form
          // cannot be nested in an anchor, and nested controls are not
          // reachable by keyboard.
          <li key={entry.id} className="relative">
            <Link
              href={`/journal/${entry.id}`}
              aria-current={active ? "page" : undefined}
              className={`block rounded-lg py-2.5 pr-20 pl-3 transition-colors ${
                active ? "bg-accent-soft" : "hover:bg-accent-soft/60"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-medium">{label}</span>
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

            <div className="absolute top-1.5 right-2 flex items-center gap-0.5">
              <Link
                href={`/journal/${entry.id}`}
                aria-label={`Edit ${label}`}
                title="Edit"
                className={ACTION_CLASS}
              >
                <PencilIcon />
              </Link>

              <form action={deleteEntry}>
                <input type="hidden" name="id" value={entry.id} />
                <input type="hidden" name="from" value={pathname} />
                <DeleteButton title={label} />
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
