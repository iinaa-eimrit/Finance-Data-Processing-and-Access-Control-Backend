# Finance Dashboard API

A RESTful backend built with NestJS, Prisma, and SQLite for managing shared financial records and computing dashboard analytics. Built with a focus on correctness, strict validation, and transactional safety.

## Requirements

- Node.js v18 or newer
- npm

## Setup & Installation

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client and apply database migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

3. Seed the database with demo users and financial records:

```bash
npx prisma db seed
```

4. Start the application:

```bash
npm run start:dev
```

## API Documentation

Once the server is running, interactive OpenAPI/Swagger documentation is available at:

`http://localhost:3000/api/docs`

## Seeded Credentials

Use these credentials to test the RBAC features via the `/api/v1/auth/login` endpoint.

| Role | Email | Password | Permissions |
| --- | --- | --- | --- |
| ADMIN | admin@example.com | admin123 | Full access to Users, Records, and Dashboard |
| ANALYST | analyst@example.com | analyst123 | Read-only Records access and Dashboard access |
| VIEWER | viewer@example.com | viewer123 | Dashboard access only |

## Architecture Notes

- Data persistence: Stored locally in a SQLite database at `prisma/dev.db`.
- Currency: Monetary values are validated and stored as positive integer cents to avoid floating-point precision issues.
- Security: Stateless JWT authentication with all authorization enforced server-side via custom NestJS guards.
- Transactions: All mutating operations are wrapped in Prisma `$transaction` blocks to maintain consistency.
