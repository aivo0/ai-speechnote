<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  let isLoading = $state(false);
  
  async function signInWithGoogle() {
    isLoading = true;
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/auth-test',
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function signOut() {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
</script>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md mx-auto">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Auth Test</h1>
      
      {#if data.user}
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Welcome!</h2>
          <p class="text-gray-600 mb-2">Email: {data.user.email}</p>
          <p class="text-gray-600 mb-4">Name: {data.user.name || 'Not provided'}</p>
          <button
            onclick={signOut}
            class="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      {:else}
        <div class="bg-white p-6 rounded-lg shadow">
          <p class="text-gray-600 mb-4">Not signed in</p>
          <button
            onclick={signInWithGoogle}
            disabled={isLoading}
            class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      {/if}
      
      <div class="mt-4 text-sm text-gray-500">
        <p>Database Status:</p>
        <p>Main DB: Connected</p>
        <p>Auth DB: Connected</p>
      </div>
    </div>
  </div>
</div>