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
  // Temporarily disable auth to debug
  event.locals.db = null as any;
  event.locals.auth = null as any;
  event.locals.session = null;
  event.locals.user = null;

  return resolve(event);
};

export const handle = sequence(handleParaglide, handleDatabase);
