<script lang="ts">
	import '../app.css';
	import logoSvg from '$lib/assets/logo.svg';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';
	import * as m from '$lib/paraglide/messages';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	
	let { children, data }: { children: any, data: LayoutData } = $props();
	
	let user = $derived(data?.user);
</script>

<svelte:head>
	<link rel="icon" type="image/x-icon" href="/favicon.ico" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="128x128" href="/favicon-128x128.png" />
	<link rel="apple-touch-icon" href="/favicon.png" />
	<link rel="manifest" href="/manifest.json" />
	<meta name="theme-color" content="#4f46e5" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen bg-white dark:bg-gray-900">
	<!-- Navigation -->
	<nav class="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<a href="/" class="flex items-center space-x-3">
						<img src={logoSvg} alt="SpeechNote Logo" class="w-9 h-9" />
						<span class="font-semibold text-xl text-gray-900 dark:text-white">SpeechNote</span>
					</a>
				</div>
				
				<div class="hidden md:flex items-center space-x-8">
					<a href="/help" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">{m.nav_help()}</a>
					
					{#if user}
						<a href="/speech" class="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition font-medium">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
							</svg>
							Speech
						</a>
						<a href="/dashboard" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">{m.nav_dashboard()}</a>
						<form method="POST" action="/api/auth/sign-out">
							<button type="submit" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
								{m.nav_signout()}
							</button>
						</form>
					{:else}
						<a href="/signin" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">{m.nav_signin()}</a>
						<a href="/register" class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition">
							{m.nav_getstarted()}
						</a>
					{/if}
					
					<LanguageSwitcher />
				</div>
				
				<!-- Mobile menu button -->
				<button class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Open mobile menu">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
					</svg>
				</button>
			</div>
		</div>
	</nav>
	
	<!-- Main content -->
	<main class="pt-16">
		{@render children?.()}
	</main>
	
	<!-- Footer -->
	<footer class="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
				<div>
					<h3 class="font-semibold text-gray-900 dark:text-white mb-4">{m.footer_product()}</h3>
					<ul class="space-y-2">
						<li><a href="/download" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{m.footer_download()}</a></li>
					</ul>
				</div>
				
				<div>
					<h3 class="font-semibold text-gray-900 dark:text-white mb-4">{m.footer_support()}</h3>
					<ul class="space-y-2">
						<li><a href="/help" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{m.footer_help()}</a></li>
						<li><a href="/contact" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{m.footer_contact()}</a></li>
					</ul>
				</div>
				
				<div>
					<h3 class="font-semibold text-gray-900 dark:text-white mb-4">{m.footer_legal()}</h3>
					<ul class="space-y-2">
						<li><a href="/terms" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{m.footer_terms()}</a></li>
						<li><a href="/privacy" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{m.footer_privacy()}</a></li>
					</ul>
				</div>
				
				<div>
					<h3 class="font-semibold text-gray-900 dark:text-white mb-4">{m.footer_connect()}</h3>
					<ul class="space-y-2">
						<li><a href="https://github.com" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{m.footer_github()}</a></li>
						<li><a href="https://twitter.com" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{m.footer_twitter()}</a></li>
					</ul>
				</div>
			</div>
			
			<div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
				<p class="text-center text-gray-600 dark:text-gray-400">
					{m.footer_copyright()}
				</p>
			</div>
		</div>
	</footer>
</div>