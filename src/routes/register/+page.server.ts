import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  // If user is already authenticated, redirect to dashboard or requested page
  if (locals.user) {
    const redirectTo = url.searchParams.get('redirect') || '/';
    throw redirect(302, redirectTo);
  }

  // Check if Google OAuth is configured
  const hasGoogleAuth = !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET
  );

  return {
    hasGoogleAuth,
  };
};