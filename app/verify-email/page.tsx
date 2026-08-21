import Link from "next/link";
import { BrandBackground } from "@/components/layout/brand-background";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-8">
      <BrandBackground />

      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <Card className="relative z-10 w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-black">Check your inbox</CardTitle>
          <CardDescription className="text-center">
            We&apos;ve sent a verification link to your email address. Click it to confirm your
            account, then sign in below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild size="lg">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
