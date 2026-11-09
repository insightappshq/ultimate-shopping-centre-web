# Ultimate Shopping Centre (USC) — Web

The web platform for Ultimate Shopping Centre (USC), a unified ecommerce aggregator and shopping experience platform designed for India.

USC searches **Blinkit, Zepto, Swiggy Instamart, BigBasket, JioMart, DMart and Amazon** in one go, matches the same product across platforms, and shows who's cheapest, fastest and best value for the shopper's pincode. Shoppers build one cart across platforms and check out on each platform's own site with a guided, item-by-item flow.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Partial Prefetching, Turbopack) |
| UI | shadcn/ui (Radix) + Tailwind CSS v4, custom USC design tokens |
| Auth | Supabase Auth: email/phone with password or OTP |
| Email | Resend, through Supabase's **Send Email** auth hook |
| Database | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
| Product data | [QuickCommerce API](https://quickcommerceapi.com/docs) |

## Quick start

```bash
npm install
cp .env.example .env          # fill in the values (see below)
npm run db:deploy             # apply migrations
npm run db:seed               # create the demo shopper
npm run dev                   # http://localhost:3000
```

If `QUICKCOMMERCE_API_KEY` is not set, the app uses a built-in **sample catalogue**, so you can try search, comparison, cart and wishlist without spending credits. Set the key (or `QUICKCOMMERCE_MOCK=false`) to switch to live prices.

### Demo credentials

`npm run db:seed` creates (or resets the password of) this account. The login page shows it with one-click sign-in buttons.

| | |
| --- | --- |
| Email | `demo@usc.app` |
| Mobile | `+91 90000 00001` |
| Password | `Demo@12345` |
| Mobile OTP | `123456` (after you add the Supabase test number below) |

You can override these with the `NEXT_PUBLIC_DEMO_*` variables. Set `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` to hide them in production.

## npm scripts

| Script | What it does |
| --- | --- |
| `dev` / `build` / `start` | Next.js dev server, production build (runs `prisma generate` first) and server |
| `lint` / `typecheck` | ESLint, and TypeScript with no emit |
| `db:generate` | Generate the Prisma client into `src/generated/prisma` |
| `db:migrate` | Create and apply a migration in development |
| `db:deploy` | Apply committed migrations (CI and production) |
| `db:push` | Push the schema without a migration (prototyping) |
| `db:studio` | Open Prisma Studio |
| `db:seed` / `demo:seed` | Upsert the demo auth user, profile and sample search history |
| `demo:reset` | Same as `demo:seed`, and also clears the demo cart, wishlist and history |
| `setup` | `db:deploy` followed by `db:seed` |

## Configuration

All variables are documented in [`.env.example`](.env.example).

### 1. Postgres

Set `DATABASE_URL`. On Supabase, use the pooled transaction URL (port 6543, `?pgbouncer=true`) for `DATABASE_URL` and the session/direct URL (port 5432) for `DIRECT_URL`. Prisma uses `DIRECT_URL` for migrations.

The initial migration turns on **row-level security, with no policies,** for every app table. Supabase's public Data API therefore can't read them with the anon key. The app reaches them only through Prisma on the server.

### 2. Supabase Auth

1. **Project settings → API**: copy the URL and the publishable (or anon) key into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Copy the service-role key into `SUPABASE_SERVICE_ROLE_KEY`; only the seed script uses it.
2. **Authentication → Providers → Email**: enable it. It allows email + password and email OTP.
3. **Authentication → Providers → Phone**: enable it and configure an SMS provider (Twilio, MessageBird, Vonage or Textlocal) for real SMS OTPs. To demo without SMS, add the test number `919000000001=123456`.
4. **Authentication → URL configuration**: set the Site URL to `NEXT_PUBLIC_SITE_URL` and add `<site-url>/auth/confirm` to the redirect URLs.

Without `SUPABASE_SERVICE_ROLE_KEY`, the seed script writes the demo user directly into Supabase's `auth` schema over `DIRECT_URL`/`DATABASE_URL`.

### 3. Email OTP via Resend

**Option A: Send Email hook (recommended).** USC renders a branded email with the 6-digit code and sends it through Resend.

1. In Resend, verify your sending domain, create an API key and set `RESEND_API_KEY` and `EMAIL_FROM`.
2. In Supabase, go to **Authentication → Hooks → Send Email → HTTPS** and enter `https://<your-domain>/api/auth/email-hook`.
3. Copy the generated secret (`v1,whsec_…`) into `SUPABASE_AUTH_HOOK_SECRET`.

Supabase must be able to reach the URL. For local development, expose port 3000 with a tunnel such as ngrok or Cloudflare Tunnel.

**Option B: Resend as Supabase SMTP.** In Supabase, go to **Authentication → SMTP settings** and enter host `smtp.resend.com`, port `465`, user `resend` and your Resend API key as the password. Then edit the Magic Link and Confirm signup templates so they include `{{ .Token }}`. That way users receive a code instead of only a link.

### 4. QuickCommerce API

Set `QUICKCOMMERCE_API_KEY`. Each platform search costs 1 credit, and an item lookup costs 1 credit. To keep costs and latency down, USC:

- searches each platform **in parallel and caches each one separately**, keyed by query, platform and location rounded to about 100 m. Searches are cached for 10 minutes and items for 5;
- applies brand, price, rating, discount, stock and ETA filters to cached results, so **changing a filter costs no credits**;
- passes the original search query to the product page, so the price comparison usually **reuses the search already cached**;
- isolates failures. A platform that fails, has no credits or isn't serviceable shows a status chip, and the other platforms still render.

## Architecture

```
src/
├─ app/
│  ├─ (shop)/              Storefront: home, search, product/[platform]/[id], cart, wishlist, account
│  ├─ (auth)/              Login and signup (split-screen layout)
│  ├─ auth/confirm/        Handles magic links and email confirmation links
│  └─ api/                 REST endpoints (see below)
├─ actions/                Server Actions: auth, cart, wishlist, location, profile
├─ components/
│  ├─ ui/                  shadcn/ui primitives (with USC "deal" and "success" variants)
│  ├─ brand/               USC logo, platform logos/stacks
│  ├─ layout/              Header, search bar, location picker, user menu, footer, mobile tab bar
│  ├─ product/             Cards, price, rating, gallery, comparison table, best deals, cart/wishlist buttons
│  ├─ search/              URL-driven filter state, filters panel, toolbar, platform status
│  ├─ cart/                Cart rows, guided checkout assistant
│  └─ auth/ account/ …     Feature components
├─ config/                 Platform registry, site config, demo account, image CDN allow-list
├─ lib/
│  ├─ quickcommerce/       client (HTTP) → normalize → service (cached) → matching / filters; mock catalogue
│  ├─ data/                Data access for cart, wishlist and profile (Prisma), always scoped by user id
│  ├─ auth/dal.ts          Data Access Layer: verified session, ensureProfile
│  ├─ supabase/            Server, browser and proxy clients
│  └─ email/               Resend client and OTP email template
├─ proxy.ts                Session refresh and optimistic redirect for protected routes
└─ generated/prisma/       Generated Prisma client (git-ignored)
prisma/                    schema, migrations, seed
```

Key principles:

- **Server-first.** Pages are Server Components. Session-dependent UI streams in behind `<Suspense>`, so the static shell is served instantly (Partial Prerendering).
- **One data path.** Server Actions (used by the UI) and REST route handlers (for other clients) call the same DAL and data modules. Every mutation re-verifies the session server-side.
- **URL as state.** Search filters, sort, view and page live in the query string, so results are shareable and back-button friendly.
- **Design system.** Semantic tokens in `globals.css`: indigo `primary`, saffron `deal`, `success` and `warning`, with light and dark themes. Composable primitives (`Price`, `DiscountBadge`, `PlatformLogo`, `EmptyState`, …) are used throughout.

## REST API

All responses have the shape `{ data }` or `{ error: { code, message } }`. Authentication uses the Supabase session cookie.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/search?q=&platforms=&brands=&minPrice=&maxPrice=&minRating=&minDiscount=&maxEta=&inStock=1&sort=&view=&page=` | Search, grouping and facets |
| GET | `/api/products/:platform/:id?compare=1&q=` | Product details plus cross-platform comparison |
| GET / POST / DELETE | `/api/cart` | Get the cart / add `{ product, quantity }` / clear purchased items |
| PATCH / DELETE | `/api/cart/:id` | Update `{ quantity?, status? }` / remove |
| GET / POST | `/api/wishlist` | List / add `{ product }` |
| DELETE | `/api/wishlist/:id` | Remove |
| GET / PUT | `/api/location` | Current delivery location / set `{ label, lat, lon, pincode }` |
| GET | `/api/me` | Session and badge counts |
| GET | `/api/health` | Database and data-source health |
| POST | `/api/auth/email-hook` | Supabase Send Email hook (signature-verified) |

## Notes

- USC does not process payments. Each order is placed on the platform's own site or app. Cart items can be marked as purchased, which the guided checkout does as you go.
- Platform logos in `public/platforms/` are the platforms' official app icons. They are used to identify each platform and belong to their respective owners.
