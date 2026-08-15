import { auth0 } from "@/src/auth/auth0";
import { CANONICAL_DOMAIN_TERMS } from "@/src/domain/language/canonical-terms";
import { MODULE_BOUNDARIES } from "@/src/modules/module-boundaries";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const session = await auth0.getSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          OpenAux App Router Skeleton
        </p>
        <h1 className="text-4xl font-black tracking-tight">Modular Monolith Baseline</h1>
        <p className="max-w-3xl text-base text-foreground/75">
          This app shell bootstraps explicit module boundaries for lifecycle, policy,
          submissions, ballots, scoring, and visibility.
        </p>
      </section>

      <Card>
        {session ? (
          <CardContent className="space-y-3 p-5">
            <Badge variant="secondary">Auth0 Session Active</Badge>
            <p className="text-sm text-foreground/75">
              Logged in as {session.user.email ?? session.user.name ?? "authenticated user"}.
            </p>
            <Button asChild className="h-auto p-0" variant="link">
              <a href="/auth/logout">Logout</a>
            </Button>
          </CardContent>
        ) : (
          <CardContent className="space-y-3 p-5">
            <Badge variant="outline">Auth0 Not Signed In</Badge>
            <p className="text-sm text-foreground/75">
              Use the hosted Auth0 login flow to sign in or create a new account.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="/auth/login?screen_hint=signup">Signup</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="/auth/login">Login</a>
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULE_BOUNDARIES.map((moduleBoundary) => (
          <Card key={moduleBoundary.moduleName} size="sm">
            <CardContent className="p-4">
              <h2 className="text-lg font-bold">{moduleBoundary.moduleName}</h2>
              <p className="mt-2 text-sm text-foreground/75">{moduleBoundary.responsibility}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Canonical Domain Terms</h2>
        <ul className="grid list-disc gap-1 pl-6 sm:grid-cols-2">
          {CANONICAL_DOMAIN_TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
