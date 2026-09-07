import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/journal");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <AuthForm />
    </main>
  );
}
