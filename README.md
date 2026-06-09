# OpenAux

OpenAux is a Next.js + TypeScript app with Prisma (PostgreSQL).

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database

## Quick Start

```bash
npm install
```

Create a local env file:

```bash
# .env.local
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
```

Run Prisma setup:

```bash
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000

Health endpoint:

- http://localhost:3000/api/health

## Route Handler API Baseline

All module boundaries now expose a baseline Route Handler with Zod-validated
request contracts and typed response shapes.

### Boundary Endpoints

- POST /api/lifecycle/transition
- POST /api/policy/submit-entry
- POST /api/submissions/required-samples
- POST /api/ballots/validate-ranked-ballot
- POST /api/scoring/ranked-ballot
- POST /api/visibility/participant-identity

### Shared Error Taxonomy

All non-success responses follow the same envelope:

```json
{
	"ok": false,
	"error": {
		"code": "validation-error | policy-denied | state-invalid",
		"message": "...",
		"details": {
			"validationIssues": [
				{
					"path": "field.path",
					"message": "Expected string",
					"issueCode": "invalid_type"
				}
			]
		}
	}
}
```

Status mapping:

- `validation-error`: 400
- `policy-denied`: 403
- `state-invalid`: 409

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run prisma:format
npm run prisma:generate
npm run prisma:migrate:dev
```
