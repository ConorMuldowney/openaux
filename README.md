# OpenAux

OpenAux is a focused space for running time-boxed music showcases. Hosts set a
optional reference material, participants make an entry, and
listeners discover and rank the results.

## How a showcase works

1. A **Host** creates a showcase and defines its schedule and optional reference samples,
   access rules, and ranked-ballot settings.
2. **Participants** join publicly or by invitation and submit one final Entry.
   They can replace their draft until submissions close.
3. **Listeners** hear the Entries allowed by the showcase's listener scope.
4. Eligible voters submit a ranked ballot while voting is open. Ballots and
   live totals stay hidden until voting closes.
5. The showcase is finalized and results are published. In blind judging mode,
   creator identities are revealed with the results.

## Built for fair participation

- Hosts can control participation, listening, and voting independently.
- Reference samples are optional guidance and do not determine Entry validity.
- Blind judging is enabled by default to reduce popularity bias.
- Voting uses ranked ballots, allowing voters to express an ordered preference
  instead of choosing only one Entry.
- Voting rules lock when submissions open, so participants know the rules will
  not change after they commit.
- Only the latest ballot counts, and ties are resolved deterministically.
- Finalized showcases are immutable, preserving a clear record of the outcome.

## Access and privacy

Hosts and voters use authenticated accounts with verified email addresses.
Public showcases can allow anonymous listening, while private showcases use
explicit invitations for participation, listening, or voting. Participants
cannot vote in a showcase they entered.

## Project status

OpenAux is under active development. The repository contains the application,
domain rules, and local development setup; a hosted public service is not yet
announced.

## Run OpenAux locally

### Prerequisites

- Node.js 20 or later
- npm 10 or later
- PostgreSQL

Install dependencies:

```bash
npm install
```

Create `.env.local` with a PostgreSQL connection string:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
```

Generate the Prisma client, create the development database schema, and start
the app:

```bash
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The health check is
available at [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Development commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

## Learn more

- Product overview and rules: [docs/product/](docs/product/)
- Documentation index: [docs/index.md](docs/index.md)
- Architecture decisions: [docs/adr/](docs/adr/)
- Architecture notes: [docs/architecture/](docs/architecture/)
- Operations runbooks: [docs/operations/](docs/operations/)
