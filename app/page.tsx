import { auth0 } from "@/src/auth/auth0";
import { CANONICAL_DOMAIN_TERMS } from "@/src/domain/language/canonical-terms";
import { MODULE_BOUNDARIES } from "@/src/modules/module-boundaries";

export default async function HomePage() {
  const session = await auth0.getSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          OpenAux App Router Skeleton
        </p>
        <h1 className="text-4xl font-black tracking-tight">Modular Monolith Baseline</h1>
        <p className="max-w-3xl text-base text-foreground/80">
          This app shell bootstraps explicit module boundaries for lifecycle, policy,
          submissions, ballots, scoring, and visibility.
        </p>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
        {session ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Auth0 Session Active
            </p>
            <p className="text-sm text-foreground/75">
              Logged in as {session.user.email ?? session.user.name ?? "authenticated user"}.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-black/5 p-4 text-xs text-foreground/80">
              {JSON.stringify(session.user, null, 2)}
            </pre>
            <a className="inline-flex font-medium text-accent underline-offset-4 hover:underline" href="/auth/logout">
              Logout
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Auth0 Not Signed In
            </p>
            <p className="text-sm text-foreground/75">
              Use the hosted Auth0 login flow to sign in or create a new account.
            </p>
            <div className="flex flex-wrap gap-3">
              <a className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90" href="/auth/login?screen_hint=signup">
                Signup
              </a>
              <a className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold transition hover:border-black/20" href="/auth/login">
                Login
              </a>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULE_BOUNDARIES.map((moduleBoundary) => (
          <article key={moduleBoundary.moduleName} className="rounded-xl border border-black/10 bg-white p-4">
            <h2 className="text-lg font-bold">{moduleBoundary.moduleName}</h2>
            <p className="mt-2 text-sm text-foreground/75">{moduleBoundary.responsibility}</p>
          </article>
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
