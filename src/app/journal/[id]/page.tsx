import { notFound, redirect } from "next/navigation";
import { EntryEditor } from "@/components/entry-editor";
import { JournalShell } from "@/components/journal-shell";
import { getCurrentUser } from "@/lib/auth";
import { getEntry } from "@/lib/entries";
import { listCategories } from "@/lib/user-categories";

export default async function EntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [entry, categories] = await Promise.all([
    getEntry(id, user.id),
    listCategories(user.id),
  ]);
  if (!entry) notFound();

  const saved = (await searchParams).saved === "1";

  return (
    <JournalShell>
      {/* Remounting on id change resets the uncontrolled inputs to the new entry. */}
      <EntryEditor
        key={entry.id}
        entry={entry}
        categories={categories}
        justSaved={saved}
      />
    </JournalShell>
  );
}
