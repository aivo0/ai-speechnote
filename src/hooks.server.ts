import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { createDatabaseClient } from '$lib/server/db';
import { createAuth } from '$lib/server/auth';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleDatabase: Handle = async ({ event, resolve }) => {
	// Create database client based on environment
	const db = createDatabaseClient(event.platform?.env || process.env);
	
	// Store database in locals for use in routes
	event.locals.db = db;
	
	// Create and store auth instance
	const auth = createAuth(db, event.platform?.env || process.env);
	event.locals.auth = auth;
	
	// Handle auth routes
	const authResponse = await auth.handler(event.request);
	if (authResponse) {
		return authResponse;
	}
	
	// Get session from auth
	const session = await auth.api.getSession({
		headers: event.request.headers
	});
	
	event.locals.session = session;
	event.locals.user = session?.user || null;
	
	return resolve(event);
};

export const handle = sequence(handleParaglide, handleDatabase);