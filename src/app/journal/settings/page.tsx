import { redirect } from "next/navigation";
import { JournalShell } from "@/components/journal-shell";
import { ProfileSettings } from "@/components/profile-settings";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <JournalShell>
      <div className="space-y-6 lg:h-full lg:overflow-y-auto lg:pr-1">
        <h1 className="font-serif text-2xl">Settings</h1>
        <ProfileSettings user={user} />
      </div>
    </JournalShell>
  );
}
