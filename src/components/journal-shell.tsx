import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { listEntries } from "@/lib/entries";
import { MOOD_EMOJI } from "@/lib/moods";
import { EntryList } from "./entry-list";
import { SearchBox } from "./search-box";

/**
 * The signed-in frame: top bar, entry sidebar, and whatever the current page
 * puts in the main pane. Redirects to the login screen when nobody is signed in.
 */
export async function JournalShell({
  search = "",
  children,
}: {
  search?: string;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const entries = await listEntries(user.id, search);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/journal" className="font-serif text-lg whitespace-nowrap">
            📔 Journaley
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user.username}</span>
            <form action={logout}>
              <button
                type="submit"
                className="btn border border-line hover:bg-accent-soft"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-3">
          <Link
            href="/journal/new"
            className="btn w-full bg-accent text-paper hover:opacity-90"
          >
            ＋ New entry
          </Link>

          <SearchBox initial={search} />

          <p className="px-1 text-xs tracking-wide text-muted uppercase">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
            {search && " found"}
          </p>

          <nav aria-label="Your entries">
            <EntryList
              entries={entries}
              moods={MOOD_EMOJI}
              emptyMessage={
                search ? "No entries match that search." : "No entries yet."
              }
            />
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
