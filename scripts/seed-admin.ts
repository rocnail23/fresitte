import "dotenv/config";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";

import * as schema from "@/db/schema";
import { hashPassword } from "@/lib/password";

async function main() {
  const email = process.env.AUTH_ADMIN_EMAIL;
  const password = process.env.AUTH_ADMIN_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL;
  const databaseAuthToken = process.env.DATABASE_AUTH_TOKEN;

  if (!email || !password) {
    throw new Error("AUTH_ADMIN_EMAIL y AUTH_ADMIN_PASSWORD deben estar definidos");
  }

  if (!databaseUrl || !databaseAuthToken) {
    throw new Error("DATABASE_URL y DATABASE_AUTH_TOKEN son necesarios para seedear");
  }

  const client = createClient({ url: databaseUrl, authToken: databaseAuthToken });
  const db = drizzle(client, { schema });

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) {
    console.log(`El usuario ${email} ya existe. No se realizaron cambios.`);
    process.exit(0);
  }

  await db.insert(schema.users).values({
    email,
    name: "Fresitte Admin",
    role: "admin",
    passwordHash: hashPassword(password),
  });

  console.log(`Usuario admin creado: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
