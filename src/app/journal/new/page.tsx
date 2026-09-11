import { redirect } from "next/navigation";
import { EntryEditor } from "@/components/entry-editor";
import { JournalShell } from "@/components/journal-shell";
import { getCurrentUser } from "@/lib/auth";
import { listCategories } from "@/lib/user-categories";

export default async function NewEntryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const categories = await listCategories(user.id);

  return (
    <JournalShell>
      <EntryEditor categories={categories} />
    </JournalShell>
  );
}
