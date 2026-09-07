import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { listEntries, listTags, type EntryFilters } from "@/lib/entries";
import { MOOD_EMOJI } from "@/lib/moods";
import { CategoryFilter } from "./category-filter";
import { DateFilter } from "./date-filter";
import { EntryList } from "./entry-list";
import { SearchBox } from "./search-box";
import { TagFilter } from "./tag-filter";

/**
 * The signed-in frame: top bar, entry sidebar, and whatever the current page
 * puts in the main pane. Redirects to the login screen when nobody is signed in.
 */
export async function JournalShell({
  filters = {},
  children,
}: {
  filters?: EntryFilters;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // The tag list is of every tag the user owns, not just the ones surviving
  // the current filter, so narrowing to one tag does not hide all the others.
  const [entries, tags] = await Promise.all([
    listEntries(user.id, filters),
    listTags(user.id),
  ]);

  const narrowed = Boolean(
    filters.search?.trim() ||
      filters.from ||
      filters.to ||
      filters.category ||
      filters.tag,
  );

  return (
    // On a wide screen the frame owns the viewport and the sidebar and main
    // pane scroll inside it. Narrow screens keep ordinary page scrolling:
    // stacked panes with their own scrollbars are miserable on a phone.
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      <header className="sticky top-0 z-10 shrink-0 border-b border-line bg-paper/85 backdrop-blur">
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

      <div
        className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6
                   lg:min-h-0 lg:grid-cols-[20rem_1fr] lg:grid-rows-[minmax(0,1fr)]"
      >
        <aside className="space-y-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <Link
            href="/journal/new"
            className="btn w-full bg-accent text-paper hover:opacity-90"
          >
            ＋ New entry
          </Link>

          <SearchBox initial={filters.search ?? ""} />

          <DateFilter from={filters.from ?? ""} to={filters.to ?? ""} />

          <CategoryFilter category={filters.category ?? ""} />

          <TagFilter tags={tags} active={filters.tag ?? ""} />

          <p className="px-1 text-xs tracking-wide text-muted uppercase">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
            {narrowed && " found"}
          </p>

          <nav aria-label="Your entries">
            <EntryList
              entries={entries}
              moods={MOOD_EMOJI}
              emptyMessage={
                narrowed ? "No entries match those filters." : "No entries yet."
              }
            />
          </nav>
        </aside>

        <main className="min-w-0 lg:min-h-0">{children}</main>
      </div>
    </div>
  );
}
