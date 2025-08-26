import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/server/db/auth-schema.ts",
  out: "./src/lib/server/db/auth-migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "5c9c7f7a-9311-4e55-8f43-3144bfb27c47", // Auth database ID
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});