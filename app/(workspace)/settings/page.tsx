import { BellIcon, MoonIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const SETTINGS_SECTIONS = [
  {
    title: "Profile",
    description: "Manage your workspace identity and account details.",
    icon: UserRoundIcon,
  },
  {
    title: "Notifications",
    description: "Choose how you hear about submissions, votes, and invitations.",
    icon: BellIcon,
  },
  {
    title: "Security",
    description: "Review sign-in and access settings for your account.",
    icon: ShieldCheckIcon,
  },
] as const;

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b pb-6">
        <p className="text-sm font-medium text-muted-foreground">Workspace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Configure your account and workspace preferences.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Settings sections">
        {SETTINGS_SECTIONS.map(({ title, description, icon: Icon }) => (
          <Card key={title} className="h-full">
            <CardHeader>
              <Icon className="size-5 text-primary" />
              <CardTitle className="mt-2">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MoonIcon className="size-5 text-primary" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Choose the theme used across your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </main>
  );
}