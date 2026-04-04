# Finance Dashboard API

Finance Dashboard API is a NestJS backend for managing shared financial records and serving dashboard reporting data. It covers authentication, role-based access control, record management, and summary views over the stored transactions.

## Tech Stack

- NestJS
- Prisma
- SQLite
- TypeScript
- Swagger / OpenAPI

## Features

- JWT-based authentication with role-based access control for `ADMIN`, `ANALYST`, and `VIEWER`
- Financial record CRUD with filtering, sorting, and pagination
- Dashboard endpoints for summary totals, category breakdowns, trends, and recent activity
- Seeded demo data for local testing and review

## Project Structure

```text
src/
  auth/        login flow and JWT strategy
  users/       user management
  records/     financial record APIs
  dashboard/   reporting and analytics endpoints
  common/      guards, decorators, filters, shared types
  prisma/      Prisma module/service wiring
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Getting Started

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply migrations:

```bash
npx prisma migrate dev
```

Seed the database:

```bash
npx prisma db seed
```

Start the app in development mode:

```bash
npm run start:dev
```

Build the project:

```bash
npm run build
```

## API Docs

When the server is running, Swagger UI is available at:

`http://localhost:3000/api/docs`

The API itself is served under:

`http://localhost:3000/api/v1`

## Demo Accounts

Use these accounts with `POST /api/v1/auth/login` after seeding the database.

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| ADMIN | admin@example.com | admin123 | Users, records, and dashboard |
| ANALYST | analyst@example.com | analyst123 | Read-only records and dashboard |
| VIEWER | viewer@example.com | viewer123 | Dashboard only |

## Design Decisions

- SQLite keeps local setup simple and makes the project easy to run for review.
- Prisma gives typed database access and keeps query logic close to the service layer.
- Money is stored as integer cents, not floats, so totals stay exact.
- Authorization lives in guards and decorators so route access rules stay visible in controllers.
- Mutating operations use Prisma transactions to avoid partial writes when a workflow has multiple steps.

## Notes

- The local database file is `prisma/dev.db`.
- Query validation uses `class-validator` and `class-transformer` so filters and pagination stay predictable.
- Swagger is included mainly to make the API easy to inspect and test without extra setup.
