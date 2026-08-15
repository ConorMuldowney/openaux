import { redirect } from "next/navigation";
import { auth0 } from "@/src/auth/auth0";
import { CANONICAL_DOMAIN_TERMS } from "@/src/domain/language/canonical-terms";
import { MODULE_BOUNDARIES } from "@/src/modules/module-boundaries";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function LandingPage() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/home");
  }

  return (
    <StandardPageLayout
      eyebrow="OpenAux App Router Skeleton"
      title="Modular Monolith Baseline"
      description={(
        <>
          This app shell bootstraps explicit module boundaries for lifecycle, policy,
          submissions, ballots, scoring, and visibility.
        </>
      )}
      actions={<ThemeToggle />}
    >

      <Card>
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
    </StandardPageLayout>
  );
}
