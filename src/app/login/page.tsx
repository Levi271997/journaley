import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/journal");

  // Set when a confirmation link could not be used; see app/auth/confirm.
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <AuthForm initialError={error} />
    </main>
  );
}
