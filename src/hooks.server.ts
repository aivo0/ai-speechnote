import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { paraglideMiddleware } from "$lib/paraglide/server";

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html.replace("%paraglide.lang%", locale),
    });
  });

const handleDatabase: Handle = async ({ event, resolve }) => {
  const { createDatabaseClient, createAuthDatabaseClient } = await import('$lib/server/db');
  const { createAuth } = await import('$lib/server/auth');
  
  try {
    // Initialize main application database
    event.locals.db = createDatabaseClient({
      DB: event.platform?.env?.DB,
      DATABASE_URL: process.env.DATABASE_URL || 'file:./local.db'
    });

    // Initialize auth database
    event.locals.authDb = createAuthDatabaseClient({
      AUTH_DB: event.platform?.env?.AUTH_DB,
      AUTH_DATABASE_URL: process.env.AUTH_DATABASE_URL || 'file:./local-auth.db'
    });

    // Initialize BetterAuth with auth database
    event.locals.auth = createAuth(event.locals.authDb, {
      BETTER_AUTH_SECRET: event.platform?.env?.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
      GOOGLE_CLIENT_ID: event.platform?.env?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: event.platform?.env?.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      PUBLIC_BASE_URL: event.platform?.env?.PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || 'http://localhost:5173'
    });

    // Get session and user from BetterAuth
    const sessionData = await event.locals.auth.api.getSession({
      headers: event.request.headers,
    });

    event.locals.session = sessionData?.session ?? null;
    event.locals.user = sessionData?.user ?? null;

  } catch (error) {
    console.error('Failed to setup databases:', error);
    event.locals.db = null as any;
    event.locals.authDb = null as any;
    event.locals.auth = null as any;
    event.locals.session = null;
    event.locals.user = null;
  }

  return resolve(event);
};

export const handle = sequence(handleParaglide, handleDatabase);
