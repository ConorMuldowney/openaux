import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { auth0 } from "@/src/auth/auth0";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/");
  }

  const userName =
    typeof session.user.name === "string"
      ? session.user.name
      : typeof session.user.nickname === "string"
        ? session.user.nickname
        : undefined;
  const userEmail = typeof session.user.email === "string" ? session.user.email : undefined;

  return (
    <AppShell userName={userName} userEmail={userEmail}>
      {children}
    </AppShell>
  );
}
