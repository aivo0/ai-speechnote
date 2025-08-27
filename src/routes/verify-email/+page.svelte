<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import * as m from '$lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  
  let isResending = $state(false);
  let resendSuccess = $state(false);
  let resendError = $state('');
  
  const email = $page.url.searchParams.get('email') || data.email || '';
  
  onMount(() => {
    // Check if there's a verification token in the URL
    const token = $page.url.searchParams.get('token');
    if (token && data.verificationResult === 'success') {
      // Verification successful, redirect after a brief delay
      setTimeout(() => {
        goto('/');
      }, 3000);
    }
  });

  async function resendVerification() {
    if (!email) return;
    
    isResending = true;
    resendError = '';
    resendSuccess = false;
    
    try {
      // Use the API endpoint directly instead of client method
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        resendSuccess = true;
        setTimeout(() => {
          resendSuccess = false;
        }, 5000);
      } else {
        resendError = m.auth_error_generic();
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      resendError = m.auth_error_generic();
    } finally {
      isResending = false;
    }
  }
</script>

<svelte:head>
  <title>{m.auth_verify_email_title()} - SpeechNote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="text-center">
      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
        <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 class="mt-6 text-3xl font-bold text-gray-900">{m.auth_verify_email_title()}</h1>
      <p class="mt-2 text-sm text-gray-600">{m.auth_verify_email_subtitle()}</p>
    </div>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if $page.url.searchParams.get('token')}
        {#if data.verificationResult === 'success'}
          <div class="bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  {m.auth_verify_email_success()}
                </h3>
              </div>
            </div>
          </div>
        {:else}
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  {m.auth_verify_email_error()}
                </h3>
              </div>
            </div>
          </div>
        {/if}
      {:else}
        <div class="text-center">
          <p class="text-gray-600 mb-6">{m.auth_verify_email_sent()}</p>
          
          {#if email}
            <p class="text-sm text-gray-500 mb-6">
              {email}
            </p>
          {/if}

          {#if resendSuccess}
            <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p class="text-sm text-green-600">{m.auth_verify_email_sent()}</p>
            </div>
          {/if}

          {#if resendError}
            <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p class="text-sm text-red-600">{resendError}</p>
            </div>
          {/if}

          {#if email}
            <button
              onclick={resendVerification}
              disabled={isResending}
              class="text-blue-600 hover:text-blue-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isResending}
                <div class="inline-flex items-center">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  {m.auth_loading()}
                </div>
              {:else}
                {m.auth_verify_email_resend()}
              {/if}
            </button>
          {/if}

          <div class="mt-6">
            <a href="/signin" class="text-sm text-gray-500 hover:text-gray-700">
              ← {m.auth_signin_link()}
            </a>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>