import { drizzle as drizzleD1, DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle as drizzleLibSQL, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { authSchema } from "./auth-schema";

export type AuthDatabase =
  | DrizzleD1Database<typeof authSchema>
  | LibSQLDatabase<typeof authSchema>;

/**
 * Create a LibSQL client for local auth development
 */
export function createAuthLibSqlClient(url: string): LibSQLDatabase<typeof authSchema> {
  const client = createClient({ url });
  return drizzleLibSQL(client, { schema: authSchema });
}

/**
 * Create a D1 client for Cloudflare Workers auth database
 */
export function createAuthD1Client(
  database: D1Database,
): DrizzleD1Database<typeof authSchema> {
  return drizzleD1(database, { schema: authSchema });
}

/**
 * Create an auth database client based on the environment
 */
export function createAuthDatabaseClient(env: {
  AUTH_DB?: D1Database;
  AUTH_DATABASE_URL?: string;
}): AuthDatabase {
  if (env.AUTH_DB) {
    // Cloudflare Workers environment with D1
    return createAuthD1Client(env.AUTH_DB);
  } else if (env.AUTH_DATABASE_URL) {
    // Local development with LibSQL
    return createAuthLibSqlClient(env.AUTH_DATABASE_URL);
  } else {
    throw new Error(
      "No auth database configuration found. Please set AUTH_DATABASE_URL or provide AUTH_DB binding.",
    );
  }
}

// Default auth database instance for development
let defaultAuthDb: AuthDatabase | null = null;

export function getAuthDb(): AuthDatabase {
  if (!defaultAuthDb) {
    const AUTH_DATABASE_URL = process.env.AUTH_DATABASE_URL || 'file:./local-auth.db';
    defaultAuthDb = createAuthLibSqlClient(AUTH_DATABASE_URL);
  }
  return defaultAuthDb;
}

// Export a default auth db instance
export const authDb = getAuthDb();

export { authSchema };
export * from "./auth-schema";