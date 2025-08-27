import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const token = url.searchParams.get('token');
  const email = url.searchParams.get('email');
  
  let verificationResult: 'success' | 'error' | null = null;
  
  // If there's a verification token, we'll handle it client-side
  if (token) {
    // For now, we'll let the client-side handle verification
    // The client will show success or error based on the actual API response
    verificationResult = null;
  }
  
  return {
    email,
    verificationResult,
  };
};