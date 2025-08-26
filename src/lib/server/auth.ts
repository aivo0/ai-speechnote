import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { AuthDatabase } from "$lib/server/db";

export function createAuth(authDb: AuthDatabase, env: any) {
  return betterAuth({
    database: drizzleAdapter(authDb, {
      provider: "sqlite",
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.PUBLIC_BASE_URL || "http://localhost:5173",
    trustedOrigins: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://speechnote.ai",
      "https://www.speechnote.ai",
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    socialProviders: {
      google:
        env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
          ? {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            }
          : undefined,
    },
    plugins: [],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
    user: {
      additionalFields: {
        createdAt: {
          type: "number",
          required: false,
          defaultValue: () => Date.now(),
        },
        updatedAt: {
          type: "number",
          required: false,
          defaultValue: () => Date.now(),
        },
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },
    rateLimit: {
      enabled: false, // Disable for local development
    },
  });
}
