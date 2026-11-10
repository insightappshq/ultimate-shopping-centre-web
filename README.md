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

### Demo account

`npm run db:seed` creates (or resets) a demo account, marked as onboarded so it goes straight into the app. The credentials are not shown anywhere in the UI. They default to the values below and can be overridden with `DEMO_USER_EMAIL`, `DEMO_USER_PHONE` and `DEMO_USER_PASSWORD`.

| | |
| --- | --- |
| Email | `demo@usc.app` |
| Mobile | `+91 90000 00001` |
| Password | `Demo@12345` |
| Mobile OTP | `123456` (after you add the Supabase test number below) |

## Access and onboarding

- **Public:** the landing page (`/`), `/terms`, `/cookies`, `/login` and `/signup`. Signed-in visitors to `/` are sent to the app at `/home`.
- **Signed in only:** everything else — search, product pages, cart, wishlist, account — and the REST API. Signed-out page requests redirect to `/login?next=…`; API requests get `401`. The proxy (`src/proxy.ts`) handles the routing, and the data access layer re-checks the session on the server.
- **Onboarding:** after signup or first sign-in, shoppers complete their profile at `/onboarding`: their name, and a delivery pincode detected from their device location and confirmed by them. Completion is stored as `user_metadata.onboarded` on the Supabase user, so the proxy can enforce it without a database query.

## Location and pincode detection

The delivery pincode comes from the device's location: the browser's geolocation is reverse-geocoded to a pincode. Typing a pincode works the other way, turning it into coordinates and an area name. Both are implemented in `src/lib/geo.ts`, using:

- [OpenStreetMap Nominatim](https://nominatim.org/release-docs/latest/api/Overview/) to convert between coordinates and pincodes;
- [India Post's pincode API](https://api.postalpincode.in) to validate pincodes and supply friendly area names.

Results are cached for weeks, and requests send an identifying User-Agent, as Nominatim's [usage policy](https://operations.osmfoundation.org/policies/nominatim/) requires. Nominatim's public instance is limited to about 1 request per second. For production traffic, replace the two functions in `src/lib/geo.ts` with a commercial geocoder such as Google Maps, Mapbox or Ola Maps; callers don't change.

## Legal pages

`/terms` and `/cookies` are rendered from Markdown in `content/legal/`. Placeholders such as `{{ENTITY_NAME}}`, `{{JURISDICTION}}` and `{{GRIEVANCE_EMAIL}}` are filled from the `NEXT_PUBLIC_LEGAL_*` variables (see `.env.example`). The text is a starting template written for an Indian B2C price-comparison service; **have it reviewed by legal counsel before launch**. The cookie table lists exactly what the app sets: the Supabase session cookie, `usc_location`, and three localStorage keys. Update it if that changes.

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
| `auth:configure` | Configure Supabase email OTP (Resend SMTP and code-only templates) via the Management API; `-- --mode=phone` adds Twilio Verify phone OTP settings and the demo test number |
| `setup` | `db:deploy` followed by `db:seed` |

## Configuration

All variables are documented in [`.env.example`](.env.example).

### 1. Postgres

Set `DATABASE_URL`. On Supabase, use the pooled transaction URL (port 6543, `?pgbouncer=true`) for `DATABASE_URL` and the session/direct URL (port 5432) for `DIRECT_URL`. Prisma uses `DIRECT_URL` for migrations.

The initial migration turns on **row-level security, with no policies,** for every app table. Supabase's public Data API therefore can't read them with the anon key. The app reaches them only through Prisma on the server.

### 2. Supabase Auth

1. **Project settings → API**: copy the URL and the publishable (or anon) key into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Copy the service-role key into `SUPABASE_SERVICE_ROLE_KEY`; only the seed script uses it.
2. **Authentication → Providers → Email**: enable it. It allows email + password and email OTP.
3. **Authentication → Sign In / Providers → Phone**: enable it with **Twilio Verify** as the SMS provider (Account SID, Auth Token and Verify Service SID). See "Phone OTP with Twilio Verify" below.
4. **Authentication → URL configuration**: set the Site URL to `NEXT_PUBLIC_SITE_URL` and add `<site-url>/auth/confirm` to the redirect URLs.

Without `SUPABASE_SERVICE_ROLE_KEY`, the seed script writes the demo user directly into Supabase's `auth` schema over `DIRECT_URL`/`DATABASE_URL`.

### 3. Email OTP via Resend

Email sign-in sends a **6-digit code with no sign-in link**. The shopper must type the code into the app. Supabase generates and verifies the code, and Resend delivers it.

1. In Resend, verify your sending domain, create an API key, and set `RESEND_API_KEY` and `EMAIL_FROM` (an address on that domain).
2. Create a Supabase personal access token at <https://supabase.com/dashboard/account/tokens> and set `SUPABASE_ACCESS_TOKEN`.
3. Run:

   ```bash
   npm run auth:configure -- --dry-run   # preview the changes
   npm run auth:configure                # apply them
   ```

This sets up Supabase in one step, through the Management API:
- **Delivery:** Supabase sends its auth emails through Resend's SMTP relay (`smtp.resend.com`).
- **Templates:** every auth email template (sign-in, sign-up, recovery, invite, email change, reauthentication) is replaced with USC's branded, code-only template, which uses `{{ .Token }}`.
- **Codes:** 6 digits, expiring after 10 minutes.

The script is idempotent; re-run it after changing the templates in `src/lib/email/templates.ts`.

**Alternative: Send Email hook.** USC can render and send the email itself through `/api/auth/email-hook`, using the same template. Supabase must be able to reach the hook's URL over public HTTPS, so for local development use a tunnel.

```bash
npm run auth:configure -- --mode=hook --hook-url=https://<your-domain>/api/auth/email-hook
```

The script prints a generated `SUPABASE_AUTH_HOOK_SECRET` to add to `.env`.

### Phone OTP with Twilio Verify

Mobile sign-in sends a one-time code through **Twilio Verify**. Supabase calls Verify for you, so the app only uses `signInWithOtp({ phone })` and `verifyOtp({ phone, token, type: "sms" })`. Twilio generates and checks the code, which means Supabase's SMS template and OTP-length settings don't apply.

1. In Twilio, create a Verify Service. Keep its code length at **6**, or set `NEXT_PUBLIC_PHONE_OTP_LENGTH` to match it.
2. In Supabase, enable the Phone provider with Twilio Verify and your Account SID, Auth Token and Verify Service SID (`VA…`).
3. Run `npm run auth:configure -- --mode=phone` (add `--dry-run` to preview). It:
   - adds the demo test number (`919000000001 → 123456`, valid for a year), which signs in without sending a real SMS;
   - keeps any test numbers you've already added;
   - sets the resend interval to 60 seconds, matching the app's "Resend code" timer.
4. **WhatsApp (optional):** enable the WhatsApp channel on the Verify service, then set `NEXT_PUBLIC_PHONE_OTP_WHATSAPP=true`. The login screen then offers "Send code on WhatsApp", and the code screen offers switching between WhatsApp and SMS.

Mobile numbers are Indian (+91, 10 digits starting 6–9). Common Twilio errors are shown as plain guidance:
- too many attempts (60203)
- invalid number (60200 / 21211)
- unsupported region (60605)
- WhatsApp not enabled

Supabase's project-wide SMS limit defaults to 30 per hour. Raise it under **Authentication → Rate Limits** before launch, and consider enabling CAPTCHA to protect against SMS abuse.

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
│  ├─ (marketing)/         Public landing page, /terms, /cookies (Markdown in content/legal)
│  ├─ (shop)/              Signed-in app: home, search, product/[platform]/[id], cart, wishlist, account
│  ├─ (onboarding)/        First-run profile and pincode confirmation
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
├─ proxy.ts                Session refresh, sign-in gate and onboarding redirect
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
