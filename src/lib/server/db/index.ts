import { drizzle as drizzleD1, DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle as drizzleLibSQL, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

export type Database =
  | DrizzleD1Database<typeof schema>
  | LibSQLDatabase<typeof schema>;

/**
 * Create a LibSQL client for local development
 */
export function createLibSqlClient(url: string): LibSQLDatabase<typeof schema> {
  const client = createClient({ url });
  return drizzleLibSQL(client, { schema });
}

/**
 * Create a D1 client for Cloudflare Workers
 */
export function createD1Client(
  database: D1Database,
): DrizzleD1Database<typeof schema> {
  return drizzleD1(database, { schema });
}

/**
 * Create a database client based on the environment
 */
export function createDatabaseClient(env: {
  DB?: D1Database;
  DATABASE_URL?: string;
}): Database {
  if (env.DB) {
    // Cloudflare Workers environment with D1
    return createD1Client(env.DB);
  } else if (env.DATABASE_URL) {
    // Local development with LibSQL
    return createLibSqlClient(env.DATABASE_URL);
  } else {
    throw new Error(
      "No database configuration found. Please set DATABASE_URL or provide D1 binding.",
    );
  }
}

// Default database instance for development
let defaultDb: Database | null = null;

export function getDb(): Database {
  if (!defaultDb) {
    const DATABASE_URL = process.env.DATABASE_URL || 'file:./local.db';
    defaultDb = createLibSqlClient(DATABASE_URL);
  }
  return defaultDb;
}

// Export a default db instance
export const db = getDb();

export { schema };
export * from "./schema";
