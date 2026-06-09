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
