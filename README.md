# Finance Dashboard Backend

This backend handles authentication, user access, financial records, and dashboard reporting for a small shared finance system.  
It is built with NestJS, Prisma, SQLite, and TypeScript, with a focus on predictable APIs, clear access rules, and data integrity.

## Features

### Authentication and Access Control

- JWT login flow
- Role-based access for `ADMIN`, `ANALYST`, and `VIEWER`
- Active and inactive user handling through `isActive`
- Route-level authorization using Nest guards

### User Management

- Create users
- View users
- Update user roles
- Activate or deactivate users without deleting them
- Protection against disabling the last active admin

### Financial Records

- Create, read, update, and delete records
- Filter by type, category, amount range, and date range
- Sort and paginate large result sets
- Validate unsupported sort fields and invalid filter ranges

### Dashboard APIs

- Total income, total expenses, net balance, and record count
- Category breakdown grouped by income and expense
- Monthly trends for recent periods
- Recent activity feed with creator details

### Operational Details

- Consistent global error response format
- Prisma migrations for schema changes
- Seed data for local review and manual testing
- Swagger docs at `/api/docs`

## Tech Stack

### Backend

- NestJS
- TypeScript
- Passport JWT
- class-validator
- class-transformer

### Database

- Prisma ORM
- SQLite

### Tools

- Swagger / OpenAPI
- ESLint
- Prettier
- ts-node

## Architecture Overview

The request flow is intentionally straightforward:

`Controller -> Guard -> Service -> Prisma -> SQLite`

- Controllers define routes and request shapes.
- Guards handle authentication, active-user checks, and role checks before business logic runs.
- Services contain the application rules, query construction, and transaction boundaries.
- Prisma is the only layer that talks to the database.

The `src/` folder is split by feature so each area stays easy to follow:

```text
src/
  auth/        login, JWT strategy, auth endpoints
  users/       user management endpoints and service logic
  records/     record CRUD, filtering, pagination
  dashboard/   analytics and reporting endpoints
  common/      guards, decorators, filters, shared types
  prisma/      Nest wrapper around PrismaClient
```

## API Design Highlights

- Money is stored as integer cents, not floats, so totals stay exact.
- Guards are used instead of scattered inline checks so access rules stay visible in controllers.
- Multi-step writes use Prisma transactions where partial updates would be risky.
- DTOs validate both request bodies and query params before service logic runs.
- Dashboard endpoints read from the same record store used by CRUD endpoints, so reporting stays tied to the real data.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Generate the Prisma client

```bash
npx prisma generate
```

### 3. Apply migrations

```bash
npx prisma migrate deploy
```

If you are changing the schema locally and need to create a new migration:

```bash
npx prisma migrate dev
```

### 4. Seed demo data

```bash
npx prisma db seed
```

### 5. Start the server

```bash
npm run start:dev
```

### 6. Open the docs

- API base URL: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`

## Demo Credentials

Use these accounts after seeding the database.

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | admin@example.com | admin123 |
| ANALYST | analyst@example.com | analyst123 |
| VIEWER | viewer@example.com | viewer123 |

## Example API Requests

### 1. Log in

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. List expense records with pagination

```http
GET /api/v1/records?type=EXPENSE&page=1&limit=2&sortBy=transactionDate&sortOrder=desc
Authorization: Bearer <token>
```

Response:

```json
{
  "data": [
    {
      "id": "rec_1",
      "amountCents": 185000,
      "type": "EXPENSE",
      "category": "Software",
      "notes": "Quarterly license renewal",
      "transactionDate": "2026-04-01T00:00:00.000Z",
      "createdById": "user_admin",
      "updatedById": "user_admin",
      "createdAt": "2026-04-01T09:10:11.000Z",
      "updatedAt": "2026-04-01T09:10:11.000Z"
    }
  ],
  "meta": {
    "total": 18,
    "page": 1,
    "limit": 2,
    "totalPages": 9
  }
}
```

### 3. Deactivate a user

```http
PATCH /api/v1/users/2d6b7d52-7d4d-4c9d-bad3-3e6d8b06f7fd/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "isActive": false
}
```

Response:

```json
{
  "id": "2d6b7d52-7d4d-4c9d-bad3-3e6d8b06f7fd",
  "name": "Analyst User",
  "email": "analyst@example.com",
  "role": "ANALYST",
  "isActive": false,
  "createdAt": "2026-04-04T05:10:00.000Z",
  "updatedAt": "2026-04-04T05:25:00.000Z"
}
```

### 4. Get dashboard summary

```http
GET /api/v1/dashboard/summary
Authorization: Bearer <token>
```

Response:

```json
{
  "totalIncome": 1245000,
  "totalExpenses": 892300,
  "netBalance": 352700,
  "totalRecords": 40
}
```

## Assumptions

- This runs as a single backend service with one shared SQLite database.
- Role names are fixed to `ADMIN`, `ANALYST`, and `VIEWER`.
- Only active users can access protected routes.
- Dashboard numbers are calculated directly from stored financial records.
- All money values are sent and stored in cents.

## Trade-offs and Decisions

- SQLite keeps setup simple and makes the project easy to run locally. For a multi-instance deployment, I would move to PostgreSQL.
- Authentication is access-token only. There is no refresh-token flow yet, which keeps the auth path simpler but leaves token lifecycle basic.
- Dashboard analytics are computed on read. That keeps writes simple, but a larger dataset would likely need pre-aggregation.
- Role and record-type values are stored as strings in the schema. That made iteration faster, but enums would be a sensible next tightening step.

## Future Improvements

- Add refresh tokens and token revocation
- Add automated tests for auth, RBAC, and filter edge cases
- Add audit logs for user changes and record edits
- Move role and record-type values to Prisma enums
- Add rate limiting and request logging for production use
