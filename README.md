# Finance Dashboard API - Backend Assessment

A RESTful backend built with **NestJS, Prisma, and SQLite**. This API serves as the data and access-control layer for a financial dashboard, strictly enforcing Role-Based Access Control (RBAC), data validation, and financial accuracy.

## Quick Start

For the fastest experience, the application and interactive documentation are deployed live. You do not need to run anything locally to evaluate the API.

- **Live Interactive API Docs (Swagger):** [https://finance-data-processing-and-access-7752.onrender.com/api/docs](https://finance-data-processing-and-access-7752.onrender.com/api/docs)
- **Base API URL:** `https://finance-data-processing-and-access-7752.onrender.com/api/v1`

*(Note: Deployed on a free Render tier. The first request may take ~30 seconds to spin up the server).*

### Test Credentials
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

## Architecture & Engineering Decisions

To ensure maintainability, security, and correctness, I prioritized the following patterns:

### 1. Financial Accuracy (No Floating Point Math)
Floating-point arithmetic is notoriously dangerous for financial systems. All monetary values are strictly validated and stored natively as integer cents (e.g., `$150.50` is stored as `15050`). 

### 2. Guard-Based Access Control (RBAC)
Authorization is completely decoupled from the business logic. Instead of cluttering controllers with `if/else` role checks, routing is protected strictly by custom NestJS Guards:
* `JwtAuthGuard`: Validates the token signature.
* `ActiveUserGuard`: Ensures the user account has not been deactivated.
* `RolesGuard`: Intercepts the request and strictly blocks users who lack the required metadata (e.g., `@Roles('ADMIN')`).

### 3. Separation of Concerns (Soft Deletes vs. Profile Updates)
Instead of hard-deleting users (which orphans financial records), users are deactivated via an `isActive` boolean. Furthermore, account status changes (`PATCH /users/:id/status`) are kept strictly separated from general profile/role updates (`PATCH /users/:id`) to prevent accidental privilege escalation or deactivation.

### 4. Ironclad Input Validation
The application heavily utilizes `class-validator` and `class-transformer` via a global `ValidationPipe` configured with `whitelist: true` and `forbidNonWhitelisted: true`. The API will automatically reject requests containing undefined fields, preventing mass-assignment vulnerabilities.

### 5. Standardized Error Handling
A custom `GlobalExceptionFilter` guarantees that every single error—whether it's a 400 Bad Request, a 403 Forbidden, or an unhandled 500 Internal Server Error—is returned to the client in a predictable, strongly-typed JSON format.

---

## 📂 Project Structure

Following a modular architecture, the domains are strictly separated:
* `src/auth/`: Identity verification, JWT generation, and login strategy.
* `src/users/`: Admin-only endpoints for managing system access and user lifecycles.
* `src/records/`: Transactional ledger for managing shared financial entries.
* `src/dashboard/`: Pre-calculated aggregations (using Prisma `groupBy` and `_sum`) for frontend analytics.
* `src/common/`: Shared utilities, global exception filters, decorators, and security Guards.

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

- Swagger
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
