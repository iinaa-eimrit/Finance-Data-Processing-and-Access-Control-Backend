# Finance Dashboard API - Backend Assessment

A RESTful backend built with NestJS, Prisma, and SQLite. This API serves as the data and access-control layer for a financial dashboard, handling role-based access control (RBAC), data validation, and core financial data processing.

## Quick Start

For the fastest experience, the application and interactive documentation are deployed live. You do not need to run anything locally to evaluate the API.

- **Live Interactive API Docs (Swagger):** [https://finance-data-processing-and-access-7752.onrender.com/api/docs](https://finance-data-processing-and-access-7752.onrender.com/api/docs)
- **Base API URL:** `https://finance-data-processing-and-access-7752.onrender.com/api/v1`

*(Note: Deployed on a free Render tier. The first request may take ~30 seconds to spin up the server).*

### Test Credentials

Postman Collection is added in the files, please check that, It contains pre-configured requests for all endpoints, including authentication flows and RBAC testing.
**[View and Download the Postman Collection](./Finance API.postman_collection.json)**

The database has been seeded with 40 financial records and 3 test users. Use these credentials to test the RBAC functionality.

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@example.com` | `admin123` | Full CRUD access to all Users and Financial Records. |
| **ANALYST** | `analyst@example.com` | `analyst123` | Read-only access to Records and Dashboard analytics. |
| **VIEWER** | `viewer@example.com` | `viewer123` | Read-only access to Dashboard analytics ONLY. |

### How to Test the API in Swagger
Because the API is secured via JWT, you must authenticate before hitting the protected endpoints:
1. Scroll to the **Auth** section and open `POST /api/v1/auth/login`.
2. Click **Try it out**, paste the credentials of your chosen role (e.g., the Admin), and hit **Execute**.
3. Copy the `accessToken` string from the response body.
4. Scroll to the top of the page, click the green **Authorize** button (padlock icon), paste the token into the value box, and click **Authorize**.
5. You can now execute any endpoint your role has access to!

---

## Local Setup Instructions

If you prefer to review the code and run the application locally, the setup is frictionless. Because it uses SQLite, no external database or Docker configuration is required.

**1. Clone & Install**
```bash
git clone https://github.com/iinaa-eimrit/Finance-Data-Processing-and-Access-Control-Backend.git
cd Finance-Data-Processing-and-Access-Control-Backend
npm install
```

**2. Database Setup & Seeding**
*This will create the SQLite database, run migrations, and seed it with users and 40 financial records spread across recent months.*
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

**3. Run the Server**
```bash
npm run start:dev
```
- Swagger Documentation: `http://localhost:3000/api/docs`
- Base API Endpoint: `http://localhost:3000/api/v1`

---

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

- Swagger
- ESLint
- Prettier

## Architecture Overview

The request flow is intentionally straightforward:

`Controller -> Guard -> Service -> Prisma -> SQLite`

- Controllers: Define routes and request shapes.
- Guards: Handle authentication, active-user checks, and role checks before business logic runs.
- Services: Contain the application rules, query construction, and transaction boundaries.
- Prisma: The only layer that interacts with the database.

## Project Structure
The `src/` folder is split by feature so each area stays easy to follow:

```text
src/
  auth/        login, JWT strategy, auth endpoints
  users/       user management endpoints and service logic
  records/     record CRUD, filtering, pagination
  dashboard/   Pre-calculated aggregations for frontend analytics.
  common/      Shared guards, decorators, exception filters, and types.
  prisma/      Nest wrapper around PrismaClient
```

## Engineering Decisions & Highlights
- Integer-based Currency: To avoid floating-point precision issues, all monetary values are validated, sent, and stored strictly as integer cents (e.g., $150.50 is 15050).

- Decoupled Authorization: Instead of inline if/else role checks inside controllers, routing is protected by custom NestJS Guards (JwtAuthGuard, ActiveUserGuard, RolesGuard). Access rules stay visible at the controller level.

- Strict Validation: The app uses class-validator via a global ValidationPipe with whitelist: true. It automatically strips out undefined fields from request bodies to prevent mass-assignment vulnerabilities, and specifically validates unsupported sort fields or invalid filter ranges.

- Soft Deletes & Endpoint Separation: Users are deactivated via an isActive flag rather than hard-deleted to prevent orphaning financial records. Changing a user's status (/users/:id/status) is a separate endpoint from general profile updates (/users/:id) to prevent accidental deactivations. I also implemented logic to prevent disabling the last active admin.

- Global Error Handling: A custom GlobalExceptionFilter ensures that all errors return in a consistent, predictable JSON format across the entire API.

## Assumptions & Trade-offs
- SQLite vs. Postgres: I used SQLite so the reviewer can run the app immediately without spinning up a database container. For a multi-instance production deployment, I would swap this to PostgreSQL to handle concurrency.

- Real-time Analytics: Dashboard analytics are computed on read using Prisma's groupBy and _sum. This keeps the write-path simple and ensures reporting stays tied to real data. For a massive dataset, this would likely need to be moved to a pre-aggregation step or a Redis cache.

- Auth Scope: Authentication is currently access-token only. I skipped building a refresh-token flow to keep the scope of the assessment focused on RBAC and business logic, which leaves the token lifecycle basic.

- Enums: Role and record-type values are stored as strings in the schema. This made iteration faster for the assessment, but migrating them to native Prisma enums would be a sensible next step.

- Single Currency: I assumed a single base currency for all records.

## Future Improvements
Given more time, I would add:

- Refresh tokens and token revocation.
- Automated tests (Jest) for auth, RBAC, and filter edge cases.
- Audit logs for tracking user changes and record edits.
- Rate limiting (@nestjs/throttler) and request logging for production use.
