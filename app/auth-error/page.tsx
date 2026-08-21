import Link from "next/link";
import { BrandBackground } from "@/components/layout/brand-background";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-8">
      <BrandBackground />

      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <Card className="relative z-10 w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-black">Sign-in failed</CardTitle>
          <CardDescription className="text-center">
            {message || "Something went wrong while signing you in. Please try again."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild size="lg">
            <Link href="/auth/login">Try again</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
