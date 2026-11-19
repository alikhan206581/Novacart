# NovaCart — Next.js E-commerce Starter

A multi-category storefront with animated UI, MongoDB + Prisma persistence, separate frontend/backend environment files, customer accounts, sessions, cart, checkout, order history and an admin panel.

## Requirements
- Node.js 20.9+ (Node 22 LTS recommended)
- npm

## Windows PowerShell setup
1. Extract the ZIP.
2. Open PowerShell in the `novacart` folder.
3. Install packages:
   ```powershell
   npm install
   ```
4. Create the environment files:
   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```
5. Edit `backend/.env`. Set `DATABASE_URL` to a MongoDB or MongoDB Atlas connection string and set `AUTH_SECRET` to a long random secret. Example generator:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
6. Initialize/update MongoDB collections and seed starter products:
   ```powershell
   npm run db:push
   npm run db:seed
   ```
7. Create an admin. Set your own `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` in `backend/.env` before seeding. The password must be at least 12 characters:
   ```env
   ADMIN_EMAIL="you@example.com"
   ADMIN_PASSWORD="use-a-long-unique-password"
   ```
   Then run `npm run db:seed` again.
8. Start:
   ```powershell
   npm run dev
   ```
   This starts the backend API on port 3001 and the storefront on port 3000. Visit http://localhost:3000.

## Currency
- Products have separate `pricePKR` and `priceUSD` values.
- USD prices are stored in cents (for example, 1999 = $19.99).
- Currency switcher changes storefront display.
- This starter uses the manually entered price in each currency; it does not silently apply a live exchange rate.

## Payments
- COD is implemented as an order payment method.
- Stripe Checkout is wired for USD online card payments. Install the SDK:
  ```powershell
  npm install stripe
  ```
  Set `STRIPE_SECRET_KEY` and the frontend `APP_URL` in the relevant provider environments. Add and verify a Stripe webhook before using this in production to mark paid orders as paid.
- PKR online payments are deliberately not falsely marked as working: integrate a supported local provider (for example, a merchant-approved gateway) and verify its server-side callback/webhook before enabling PKR online payment.
- Never put secret payment keys in `NEXT_PUBLIC_*` variables.

## Deploy frontend and backend as separate Vercel projects
1. Import the GitHub repository into Vercel. Set the project root directory to `/backend`. The backend project builds from `backend/package.json`.
2. Set backend environment variables from `backend/.env.example`, including `DATABASE_URL`, a strong `AUTH_SECRET`, and `APP_URL` (the storefront's Vercel URL). Keep credentials in Vercel's Environment Variables, not Git.
3. Deploy the backend project and copy its Vercel production origin.
4. Import the same repository into Vercel again as a second project. Set its root directory to `/frontend`.
5. Set the frontend variable `BACKEND_API_URL` to the backend Vercel origin, with no `/api` suffix, then deploy.
6. The storefront proxies browser `/api/*` requests to the backend, and server-rendered pages call the backend API directly. The frontend does not connect to MongoDB.

## Important production checklist
This is a runnable starter, not a production-certified commerce system. Before public launch:
- Use MongoDB Atlas backups, replica/set monitoring and least-privilege database users for production.
- Add rate limiting and email verification / password reset.
- Add CSRF/origin checks and security monitoring for all write endpoints.
- Add Stripe webhook signature verification and reconcile payment state; do not rely on redirect success alone.
- Add transactional stock reservation / expiry and robust refund/cancellation handling.
- Validate and optimize product image uploads (object storage, not arbitrary external URLs).
- Add shipping/tax calculations, privacy/terms, backups and admin audit logs.
- Add tests and review RLS/authorization if switching database providers.

## Data and credentials
Customer records, email addresses, password hashes, sessions, cart lines, orders, and addresses are persisted in MongoDB. Passwords are bcrypt hashes; raw passwords are not saved. The admin role is assigned only by the seed process or trusted server-side database administration. Never allow public registration to choose a role.
