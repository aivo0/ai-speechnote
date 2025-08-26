import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, request, params }) => {
  return await locals.auth.handler(request);
};

export const POST: RequestHandler = async ({ locals, request, params }) => {
  return await locals.auth.handler(request);
};