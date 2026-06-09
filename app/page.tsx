import { CANONICAL_DOMAIN_TERMS } from "@/src/domain/language/canonical-terms";
import { MODULE_BOUNDARIES } from "@/src/modules/module-boundaries";

export default function HomePage() {
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
