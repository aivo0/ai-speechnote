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
  // Temporarily provide mock auth for development
  const { createDatabaseClient } = await import('$lib/server/db');
  
  try {
    event.locals.db = createDatabaseClient({
      DATABASE_URL: process.env.DATABASE_URL || 'file:./local.db'
    });
    
    // Mock user for development
    const mockUser = {
      id: 'dev-user-1',
      email: 'dev@example.com',
      name: 'Development User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Ensure mock user exists in database
    try {
      const { user } = await import('$lib/server/db/schema');
      await event.locals.db
        .insert(user)
        .values({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          emailVerified: mockUser.emailVerified,
          image: mockUser.image,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt
        })
        .onConflictDoNothing(); // Don't error if user already exists
    } catch (userError) {
      // Ignore errors if user already exists
      console.log('Mock user setup (this is normal):', userError.message);
    }
    
    event.locals.user = mockUser;
    event.locals.session = null;
    event.locals.auth = null as any;
  } catch (error) {
    console.error('Failed to setup database:', error);
    event.locals.db = null as any;
    event.locals.auth = null as any;
    event.locals.session = null;
    event.locals.user = null;
  }

  return resolve(event);
};

export const handle = sequence(handleParaglide, handleDatabase);
