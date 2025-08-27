<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import type { PageData } from './$types';
	import * as m from '$lib/paraglide/messages';
	
	let { data }: { data: PageData } = $props();
	let email = $state('');
	let isSubmitting = $state(false);
	
	async function handleWaitlist(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		
		try {
			const response = await fetch('/api/waitlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			
			if (response.ok) {
				email = '';
				alert(m.cta_success());
			}
		} catch (error) {
			console.error('Error:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{m.meta_title()}</title>
	<meta name="description" content="{m.meta_description()}" />
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
	<div class="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:bg-grid-slate-700/25"></div>
	
	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
		<div class="text-center">
			<div class="flex justify-center mb-8">
				<img src="/favicon-128x128.png" alt="SpeechNote" class="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-2xl" />
			</div>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
				{m.hero_title()}
				<span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {m.hero_title_highlight()}</span>
			</h1>
			
			<p class="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
				{m.hero_subtitle()}
			</p>
			
			<div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/auth/signup" class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl transition">
					{m.hero_cta_trial()}
					<svg class="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
				</a>
				<a href="#demo" class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-gray-700 bg-white dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
					{m.hero_cta_demo()}
					<svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</a>
			</div>
			
			<div class="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
				<span class="flex items-center">
					<svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{m.hero_feature_offline()}
				</span>
				<span class="flex items-center">
					<svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{m.hero_feature_languages()}
				</span>
				<span class="flex items-center">
					<svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
					{m.hero_feature_ai()}
				</span>
			</div>
		</div>
	</div>
</section>



<!-- CTA Section -->
<section class="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h2 class="text-3xl sm:text-4xl font-bold text-white">
			{m.cta_title()}
		</h2>
		<p class="mt-4 text-xl text-blue-100">
			{m.cta_subtitle()}
		</p>
		
		<form onsubmit={handleWaitlist} class="mt-8 max-w-md mx-auto">
			<div class="flex gap-4">
				<input
					type="email"
					bind:value={email}
					required
					placeholder="{m.cta_email_placeholder()}"
					class="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-white"
					disabled={isSubmitting}
				/>
				<button
					type="submit"
					class="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
					disabled={isSubmitting}
				>
					{isSubmitting ? m.cta_button_joining() : m.cta_button_join()}
				</button>
			</div>
		</form>
		
		<p class="mt-4 text-sm text-blue-100">
			{m.cta_early_access()}
		</p>
	</div>
</section>