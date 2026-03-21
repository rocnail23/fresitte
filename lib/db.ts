import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as {
  drizzleDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

export const db =
  globalForDb.drizzleDb ?? drizzle(client, { schema, casing: "snake_case" });

if (process.env.NODE_ENV !== "production") {
  globalForDb.drizzleDb = db;
}
