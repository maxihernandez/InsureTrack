import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { getCurrentUser } from "@/lib/auth";
import Loading from "./loading";

// Entering the protected layout can redirect after checking the session.
// Its children still stream loading UI and the shared shell persists on navigation.
export const instant = false;

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}>{children}</AppShell>;
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<main className="mx-auto w-full max-w-6xl p-6"><Loading /></main>}>
    <AuthenticatedShell>{children}</AuthenticatedShell>
  </Suspense>;
}
