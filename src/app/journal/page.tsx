import Link from "next/link";
import { redirect } from "next/navigation";
import { JournalShell } from "@/components/journal-shell";
import { getCurrentUser } from "@/lib/auth";
import { countEntries } from "@/lib/entries";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    category?: string;
    tag?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { q, from, to, category, tag } = await searchParams;

  // The count is of everything, not of the current filter — it decides
  // between the empty state and the greeting.
  const total = await countEntries(user.id);

  return (
    <JournalShell
      filters={{
        search: q ?? "",
        from: from ?? "",
        to: to ?? "",
        category: category ?? "",
        tag: tag ?? "",
      }}
    >
      <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
        <div className="mb-4 text-4xl">🕯️</div>
        <h2 className="font-serif text-2xl">
          {total === 0 ? "Your journal is empty" : `Hello again, ${user.username}`}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted">
          {total === 0
            ? "Write the first page. Only you can read what goes in here."
            : "Pick an entry from the left, or start a new one."}
        </p>
        <Link
          href="/journal/new"
          className="btn mt-6 bg-accent text-paper hover:opacity-90"
        >
          ＋ New entry
        </Link>
      </div>
    </JournalShell>
  );
}
