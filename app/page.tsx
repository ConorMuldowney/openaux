import { redirect } from "next/navigation";
import { auth0 } from "@/src/auth/auth0";
import { BrandBackground } from "@/components/layout/brand-background";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LandingPage() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/home");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-8">
      <BrandBackground />

      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <Card className="relative z-10 w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-black">OPENAUX</CardTitle>
          <CardDescription className="text-center">Sign in to your account or create a new one.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild size="lg">
            <a href="/auth/login?screen_hint=signup">Sign up</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="/auth/login">Sign in</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

