<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';
	
	let { children, data }: { children: any, data: LayoutData } = $props();
	
	$: user = data?.user;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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
					<a href="/" class="flex items-center space-x-2">
						<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
						<span class="font-semibold text-xl text-gray-900 dark:text-white">SpeechNote</span>
					</a>
				</div>
				
				<div class="hidden md:flex items-center space-x-8">
					<a href="/#features" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Features</a>
					<a href="/#pricing" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Pricing</a>
					<a href="/help" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Help</a>
					
					{#if user}
						<a href="/dashboard" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
						<form method="POST" action="/auth/logout">
							<button type="submit" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
								Sign Out
							</button>
						</form>
					{:else}
						<a href="/auth/login" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Sign In</a>
						<a href="/auth/signup" class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition">
							Get Started
						</a>
					{/if}
				</div>
				
				<!-- Mobile menu button -->
				<button class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
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
					<h3 class="font-semibold text-gray-900 dark:text-white mb-4">Product</h3>
					<ul class="space-y-2">
						<li><a href="/#features" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Features</a></li>
						<li><a href="/#pricing" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Pricing</a></li>
						<li><a href="/download" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Download</a></li>
					</ul>
				</div>
				
				<div>
					<h3 class="font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
					<ul class="space-y-2">
						<li><a href="/help" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Help Center</a></li>
						<li><a href="/contact" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Contact</a></li>
					</ul>
				</div>
				
				<div>
					<h3 class="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
					<ul class="space-y-2">
						<li><a href="/terms" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Terms</a></li>
						<li><a href="/privacy" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Privacy</a></li>
					</ul>
				</div>
				
				<div>
					<h3 class="font-semibold text-gray-900 dark:text-white mb-4">Connect</h3>
					<ul class="space-y-2">
						<li><a href="https://github.com" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">GitHub</a></li>
						<li><a href="https://twitter.com" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Twitter</a></li>
					</ul>
				</div>
			</div>
			
			<div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
				<p class="text-center text-gray-600 dark:text-gray-400">
					© 2025 SpeechNote. All rights reserved.
				</p>
			</div>
		</div>
	</footer>
</div>