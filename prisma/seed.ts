/**
 * Seeds the demo shopper.
 *
 *   npm run db:seed           create/update the demo account (idempotent)
 *   npm run demo:reset        also wipe the demo user's cart, wishlist and history
 *
 * The auth user is created through the Supabase Admin API when
 * SUPABASE_SERVICE_ROLE_KEY is set (recommended). Without it, the user is
 * written straight into Supabase's `auth` schema over DATABASE_URL.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient, type User } from "@supabase/supabase-js";
import { Client } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO = {
  email: process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@usc.app",
  phone: process.env.NEXT_PUBLIC_DEMO_PHONE || "+919000000001",
  password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || "Demo@12345",
  fullName: "Demo Shopper",
};

const DEMO_SEARCHES = ["amul butter", "aashirvaad atta 5kg", "milk", "maggi", "surf excel"];
const reset = process.argv.includes("--reset");

function log(message: string) {
  console.log(`  • ${message}`);
}

async function upsertWithAdminApi(url: string, serviceKey: string): Promise<string> {
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const phoneDigits = DEMO.phone.replace(/^\+/, "");

  let existing: User | undefined;
  for (let page = 1; !existing; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    existing = data.users.find((u) => u.email === DEMO.email || u.phone === phoneDigits);
    if (data.users.length < 1000) break;
  }

  const attributes = {
    email: DEMO.email,
    phone: DEMO.phone,
    password: DEMO.password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { full_name: DEMO.fullName, is_demo: true },
  };

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, attributes);
    if (error) throw error;
    log(`Updated Supabase auth user ${existing.id}`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser(attributes);
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  log(`Created Supabase auth user ${data.user.id}`);
  return data.user.id;
}

/** Fallback for when only the Postgres URL is available. */
async function upsertWithSql(connectionString: string): Promise<string> {
  const client = new Client({ connectionString });
  await client.connect();
  const phoneDigits = DEMO.phone.replace(/^\+/, "");
  try {
    await client.query("BEGIN");
    const found = await client.query<{ id: string }>(
      "SELECT id FROM auth.users WHERE email = $1 OR phone = $2 LIMIT 1",
      [DEMO.email, phoneDigits],
    );

    let id = found.rows[0]?.id;
    const metadata = JSON.stringify({ full_name: DEMO.fullName, is_demo: true });
    const appMetadata = JSON.stringify({ provider: "email", providers: ["email", "phone"] });

    if (id) {
      await client.query(
        `UPDATE auth.users SET email = $2, phone = $3,
           encrypted_password = extensions.crypt($4, extensions.gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
           raw_user_meta_data = $5::jsonb, updated_at = now()
         WHERE id = $1`,
        [id, DEMO.email, phoneDigits, DEMO.password, metadata],
      );
      log(`Updated auth.users row ${id}`);
    } else {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO auth.users (
           instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data,
           created_at, updated_at, confirmation_token, recovery_token,
           email_change_token_new, email_change, email_change_token_current,
           phone_change, phone_change_token, reauthentication_token)
         VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
           'authenticated', $1, extensions.crypt($3, extensions.gen_salt('bf')), now(),
           $2, now(), $4::jsonb, $5::jsonb, now(), now(), '', '', '', '', '', '', '', '')
         RETURNING id`,
        [DEMO.email, phoneDigits, DEMO.password, appMetadata, metadata],
      );
      id = inserted.rows[0].id;
      log(`Inserted auth.users row ${id}`);
    }

    for (const [provider, data] of [
      ["email", { sub: id, email: DEMO.email, email_verified: true }],
      ["phone", { sub: id, phone: phoneDigits, phone_verified: true }],
    ] as const) {
      await client.query(
        `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1::uuid, $2::text, $3, $4::jsonb, now(), now(), now())
         ON CONFLICT (provider_id, provider) DO UPDATE SET identity_data = EXCLUDED.identity_data, updated_at = now()`,
        // user_id (uuid) and provider_id (text) are separate parameters: Postgres
        // can't infer two different types for one placeholder.
        [id, id, provider, JSON.stringify(data)],
      );
    }

    await client.query("COMMIT");
    return id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  console.log("\nSeeding Ultimate Shopping Centre demo data…");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId =
    supabaseUrl && serviceKey
      ? await upsertWithAdminApi(supabaseUrl, serviceKey)
      : await upsertWithSql(process.env.DIRECT_URL || databaseUrl);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    await prisma.profile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: DEMO.email,
        phone: DEMO.phone,
        fullName: DEMO.fullName,
        isDemo: true,
        locationLabel: "Bengaluru",
        latitude: 12.9716,
        longitude: 77.5946,
        pincode: "560001",
      },
      update: { email: DEMO.email, phone: DEMO.phone, fullName: DEMO.fullName, isDemo: true },
    });
    log("Upserted demo profile");

    if (reset) {
      await prisma.$transaction([
        prisma.cartItem.deleteMany({ where: { userId } }),
        prisma.wishlistItem.deleteMany({ where: { userId } }),
        prisma.searchHistory.deleteMany({ where: { userId } }),
      ]);
      log("Cleared demo cart, wishlist and search history");
    }

    const now = Date.now();
    for (const [index, query] of DEMO_SEARCHES.entries()) {
      await prisma.searchHistory.upsert({
        where: { userId_query: { userId, query } },
        create: { userId, query, createdAt: new Date(now - index * 60_000) },
        update: {},
      });
    }
    log("Seeded recent searches");
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nDemo credentials");
  console.log(`  Email:    ${DEMO.email}`);
  console.log(`  Phone:    ${DEMO.phone}`);
  console.log(`  Password: ${DEMO.password}\n`);
}

main().catch((error) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
