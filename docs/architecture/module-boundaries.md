# OpenAux Module Boundaries

This document defines v1 boundaries for the modular monolith in Next.js App Router.

## Intent

- Keep domain modules cohesive and independently testable.
- Keep integration wiring in route handlers and app-layer adapters.
- Enforce canonical domain language in code surfaces.

## Domain Modules

- `lifecycle`: State transitions (`creation`, `submission-open`, `voting-open`, `finalized`) and finalization invariants.
- `policy`: Participation Scope, Listener Scope, and Voter Scope decisions.
- `submissions`: Entry draft replacement and Required Sample validity checks.
- `ballots`: Ranked Ballot validation rules and ballot-shape invariants.
- `scoring`: Deterministic tally logic and tie-break ordering primitives.
- `visibility`: Blind Judging visibility rules and identity reveal behavior.

## Import Rules

- Import only from each module public surface: `@/src/modules/<module>/public`.
- Cross-module imports from `internal` surfaces are disallowed.
- Shared orchestration may import multiple module public surfaces.

## App Router Placement

- `app/*`: Web routes, server components, and route handlers.
- `app/api/*`: Transport boundary that validates request/response shapes.
- `src/modules/*`: Domain logic, pure invariants, and policies.
- `src/domain/language/*`: Canonical terms and language policy sources.

## Language Policy

Canonical domain terms are required for code-facing artifacts. Legacy terms (battle, contest, challenge, event, admin, organizer, competitor) are prohibited in app, src, and scripts surfaces.

Automated enforcement:

- `npm run check:domain-language`: scans code surfaces for prohibited legacy terms and required module presence.
