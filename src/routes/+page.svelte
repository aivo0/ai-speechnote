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

<!-- Features Section -->
<section id="features" class="py-24 bg-white dark:bg-gray-900">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
				{m.features_title()}
			</h2>
			<p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
				{m.features_subtitle()}
			</p>
		</div>
		
		<div class="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			<!-- Feature 1 -->
			<div class="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition">
				<div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{m.feature_private_title()}</h3>
				<p class="text-gray-600 dark:text-gray-300">
					{m.feature_private_desc()}
				</p>
			</div>
			
			<!-- Feature 2 -->
			<div class="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition">
				<div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{m.feature_estonian_title()}</h3>
				<p class="text-gray-600 dark:text-gray-300">
					{m.feature_estonian_desc()}
				</p>
			</div>
			
			<!-- Feature 3 -->
			<div class="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition">
				<div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{m.feature_realtime_title()}</h3>
				<p class="text-gray-600 dark:text-gray-300">
					{m.feature_realtime_desc()}
				</p>
			</div>
			
			<!-- Feature 4 -->
			<div class="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition">
				<div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{m.feature_crossplatform_title()}</h3>
				<p class="text-gray-600 dark:text-gray-300">
					{m.feature_crossplatform_desc()}
				</p>
			</div>
			
			<!-- Feature 5 -->
			<div class="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition">
				<div class="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{m.feature_ai_title()}</h3>
				<p class="text-gray-600 dark:text-gray-300">
					{m.feature_ai_desc()}
				</p>
			</div>
			
			<!-- Feature 6 -->
			<div class="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition">
				<div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
					<svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{m.feature_flexible_title()}</h3>
				<p class="text-gray-600 dark:text-gray-300">
					{m.feature_flexible_desc()}
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Pricing Section -->
<section id="pricing" class="py-24 bg-gray-50 dark:bg-gray-800">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
				{m.pricing_title()}
			</h2>
			<p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
				{m.pricing_subtitle()}
			</p>
		</div>
		
		<div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
			<!-- Personal Plan -->
			<div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
				<div class="p-8">
					<h3 class="text-2xl font-semibold text-gray-900 dark:text-white">{m.pricing_personal_title()}</h3>
					<p class="mt-2 text-gray-600 dark:text-gray-400">{m.pricing_personal_desc()}</p>
					<div class="mt-6">
						<span class="text-4xl font-bold text-gray-900 dark:text-white">{m.pricing_personal_price()}</span>
						<span class="text-gray-600 dark:text-gray-400">{m.pricing_personal_billing()}</span>
					</div>
					<ul class="mt-8 space-y-4">
						<li class="flex items-start">
							<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-gray-600 dark:text-gray-300">{m.pricing_feature_devices_1()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-gray-600 dark:text-gray-300">{m.pricing_feature_all()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-gray-600 dark:text-gray-300">{m.pricing_feature_updates_1year()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-gray-600 dark:text-gray-300">{m.pricing_feature_support_email()}</span>
						</li>
					</ul>
					<button class="mt-8 w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
						{m.pricing_cta_trial()}
					</button>
				</div>
			</div>
			
			<!-- Professional Plan -->
			<div class="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden transform scale-105">
				<div class="p-8">
					<div class="flex items-center justify-between">
						<h3 class="text-2xl font-semibold text-white">{m.pricing_professional_title()}</h3>
						<span class="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{m.pricing_professional_badge()}</span>
					</div>
					<p class="mt-2 text-blue-100">{m.pricing_professional_desc()}</p>
					<div class="mt-6">
						<span class="text-4xl font-bold text-white">{m.pricing_professional_price()}</span>
						<span class="text-blue-100">{m.pricing_professional_billing()}</span>
					</div>
					<ul class="mt-8 space-y-4">
						<li class="flex items-start">
							<svg class="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-white">{m.pricing_feature_devices_3()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-white">{m.pricing_feature_all()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-white">{m.pricing_feature_updates_lifetime()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-white">{m.pricing_feature_support_priority()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-white">{m.pricing_feature_early_access()}</span>
						</li>
					</ul>
					<button class="mt-8 w-full bg-white text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-100 transition font-semibold">
						{m.pricing_cta_trial()}
					</button>
				</div>
			</div>
			
			<!-- Team Plan -->
			<div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
				<div class="p-8">
					<h3 class="text-2xl font-semibold text-gray-900 dark:text-white">{m.pricing_team_title()}</h3>
					<p class="mt-2 text-gray-600 dark:text-gray-400">{m.pricing_team_desc()}</p>
					<div class="mt-6">
						<span class="text-4xl font-bold text-gray-900 dark:text-white">{m.pricing_team_price()}</span>
					</div>
					<ul class="mt-8 space-y-4">
						<li class="flex items-start">
							<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-gray-600 dark:text-gray-300">{m.pricing_feature_devices_unlimited()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-gray-600 dark:text-gray-300">{m.pricing_feature_volume()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-gray-600 dark:text-gray-300">{m.pricing_feature_management()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-gray-600 dark:text-gray-300">{m.pricing_feature_support_dedicated()}</span>
						</li>
						<li class="flex items-start">
							<svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<span class="ml-3 text-gray-600 dark:text-gray-300">{m.pricing_feature_integrations()}</span>
						</li>
					</ul>
					<button class="mt-8 w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
						{m.pricing_cta_sales()}
					</button>
				</div>
			</div>
		</div>
		
		<div class="mt-12 text-center">
			<p class="text-gray-600 dark:text-gray-400">
				{m.pricing_trial_note()} <span class="font-semibold">{m.pricing_trial_duration()}</span>{m.pricing_trial_no_card()}
			</p>
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