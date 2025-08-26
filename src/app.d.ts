// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { Database, AuthDatabase } from "$lib/server/db";
import type { Auth, Session, User } from "better-auth";

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
        AUTH_DB: D1Database;
        DOWNLOADS: R2Bucket;
        BETTER_AUTH_SECRET: string;
        GOOGLE_CLIENT_ID?: string;
        GOOGLE_CLIENT_SECRET?: string;
        STRIPE_SECRET_KEY?: string;
        STRIPE_WEBHOOK_SECRET?: string;
        STRIPE_PUBLISHABLE_KEY?: string;
        MAILGUN_API_KEY?: string;
        MAILGUN_DOMAIN?: string;
        TURNSTILE_SECRET_KEY?: string;
        TURNSTILE_SITE_KEY?: string;
        PUBLIC_BASE_URL?: string;
      };
      cf: CfProperties;
      ctx: ExecutionContext;
    }

    interface Locals {
      db: Database;
      authDb: AuthDatabase;
      auth: ReturnType<typeof import("$lib/server/auth").createAuth>;
      session: Session | null;
      user: User | null;
    }

    interface PageData {
      user: User | null;
    }

    // interface Error {}
    // interface PageState {}
  }
}

export {};
