import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __quantivaDbClient: postgres.Sql | undefined;
}

// postgres.js connects lazily on the first query, so it's safe to construct
// the client at module scope even when DATABASE_URL is unset during
// `next build`'s route-collection step. The placeholder URL is never used to
// open a real connection unless a query actually runs without a real
// DATABASE_URL configured, which will fail loudly at request time instead.
const connectionString =
  process.env.DATABASE_URL ?? "postgres://unconfigured:unconfigured@localhost:5432/unconfigured";

const client = global.__quantivaDbClient ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  global.__quantivaDbClient = client;
}

export const db = drizzle(client, { schema });
