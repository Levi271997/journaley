import { EntryEditor } from "@/components/entry-editor";
import { JournalShell } from "@/components/journal-shell";

export default function NewEntryPage() {
  return (
    <JournalShell>
      <EntryEditor />
    </JournalShell>
  );
}
