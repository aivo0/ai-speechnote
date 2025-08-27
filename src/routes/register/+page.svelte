<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import * as m from '$lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  
  let isLoading = $state(false);
  let isGoogleLoading = $state(false);
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let agreeToTerms = $state(false);
  let errors = $state<Record<string, string>>({});
  let registrationSuccess = $state(false);

  function validateForm() {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = m.auth_error_name_required();
    }
    
    if (!email) {
      newErrors.email = m.auth_error_email_required();
    }
    
    if (!password) {
      newErrors.password = m.auth_error_password_required();
    } else if (password.length < 8) {
      newErrors.password = m.auth_error_password_min();
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = m.auth_error_passwords_match();
    }
    
    if (!agreeToTerms) {
      newErrors.terms = m.auth_error_terms_required();
    }
    
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    
    isLoading = true;
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: name.trim(),
      });
      
      if (result.error) {
        if (result.error.message?.includes('already exists') || 
            result.error.message?.includes('duplicate')) {
          errors = { general: m.auth_error_email_exists() };
        } else {
          errors = { general: m.auth_error_generic() };
        }
      } else {
        registrationSuccess = true;
        setTimeout(() => {
          goto('/verify-email?email=' + encodeURIComponent(email));
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      errors = { general: m.auth_error_generic() };
    } finally {
      isLoading = false;
    }
  }

  async function handleGoogleSignUp() {
    isGoogleLoading = true;
    try {
      const redirectTo = $page.url.searchParams.get('redirect') || '/';
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectTo,
      });
    } catch (error) {
      console.error('Google sign up error:', error);
      errors = { general: m.auth_error_generic() };
    } finally {
      isGoogleLoading = false;
    }
  }
</script>

<svelte:head>
  <title>{m.auth_register_title()} - SpeechNote</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900">{m.auth_register_title()}</h1>
      <p class="mt-2 text-gray-600">{m.auth_register_subtitle()}</p>
    </div>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if registrationSuccess}
        <div class="bg-green-50 border border-green-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                {m.auth_register_title()}
              </h3>
              <div class="mt-2 text-sm text-green-700">
                <p>{m.auth_verify_email_sent()}</p>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- Google Sign Up Button -->
        {#if data.hasGoogleAuth}
          <button
            type="button"
            onclick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            class="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isGoogleLoading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            {:else}
              <svg class="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            {/if}
            {m.auth_register_google()}
          </button>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">{m.auth_or()}</span>
              </div>
            </div>
          </div>
        {/if}

        <!-- Email/Password Registration Form -->
        <form class="space-y-6 {data.hasGoogleAuth ? 'mt-6' : ''}" onsubmit={handleSubmit}>
          {#if errors.general}
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <p class="text-sm text-red-600">{errors.general}</p>
            </div>
          {/if}

          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              {m.auth_name()}
            </label>
            <div class="mt-1">
              <input
                id="name"
                name="name"
                type="text"
                autocomplete="name"
                required
                bind:value={name}
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                class:border-red-300={errors.name}
              />
              {#if errors.name}
                <p class="mt-1 text-sm text-red-600">{errors.name}</p>
              {/if}
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              {m.auth_email()}
            </label>
            <div class="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                bind:value={email}
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                class:border-red-300={errors.email}
              />
              {#if errors.email}
                <p class="mt-1 text-sm text-red-600">{errors.email}</p>
              {/if}
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              {m.auth_password()}
            </label>
            <div class="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                bind:value={password}
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                class:border-red-300={errors.password}
              />
              {#if errors.password}
                <p class="mt-1 text-sm text-red-600">{errors.password}</p>
              {/if}
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              {m.auth_confirm_password()}
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                bind:value={confirmPassword}
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                class:border-red-300={errors.confirmPassword}
              />
              {#if errors.confirmPassword}
                <p class="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              {/if}
            </div>
          </div>

          <div class="flex items-center">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              bind:checked={agreeToTerms}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              class:border-red-300={errors.terms}
            />
            <label for="agreeToTerms" class="ml-2 block text-sm text-gray-900">
              {m.auth_terms()}
              <a href="/terms" class="text-blue-600 hover:text-blue-500">{m.auth_terms_link()}</a>
              {m.auth_and()}
              <a href="/privacy" class="text-blue-600 hover:text-blue-500">{m.auth_privacy_link()}</a>
            </label>
          </div>
          {#if errors.terms}
            <p class="text-sm text-red-600">{errors.terms}</p>
          {/if}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isLoading}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {/if}
              {isLoading ? m.auth_loading() : m.auth_register_button()}
            </button>
          </div>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">
                {m.auth_has_account()}
                <a href="/signin" class="font-medium text-blue-600 hover:text-blue-500 ml-1">
                  {m.auth_signin_link()}
                </a>
              </span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>