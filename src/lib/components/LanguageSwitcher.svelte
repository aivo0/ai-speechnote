<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime';
	
	let currentLocale = $derived(getLocale());
	let showDropdown = $state(false);
	
	const localeNames: Record<string, string> = {
		en: 'English',
		et: 'Eesti'
	};
	
	const localeFlags: Record<string, string> = {
		en: '🇬🇧',
		et: '🇪🇪'
	};
	
	async function switchLocale(locale: typeof locales[number]) {
		setLocale(locale);
		showDropdown = false;
		
		// Reload the page to apply the new locale
		const currentPath = $page.url.pathname;
		await goto(currentPath, { invalidateAll: true });
	}
	
	function toggleDropdown() {
		showDropdown = !showDropdown;
	}
	
	// Close dropdown when clicking outside
	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.language-switcher')) {
			showDropdown = false;
		}
	}
	
	$effect(() => {
		if (showDropdown) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="language-switcher relative">
	<button
		onclick={toggleDropdown}
		class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
		aria-label="Change language"
	>
		<span class="text-lg">{localeFlags[currentLocale]}</span>
		<span class="hidden sm:inline">{localeNames[currentLocale]}</span>
		<svg
			class="w-4 h-4 transition-transform"
			class:rotate-180={showDropdown}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
	
	{#if showDropdown}
		<div class="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
			{#each locales as locale}
				<button
					onclick={() => switchLocale(locale)}
					class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition first:rounded-t-lg last:rounded-b-lg"
					class:bg-gray-100={locale === currentLocale}
					class:dark:bg-gray-700={locale === currentLocale}
				>
					<span class="text-lg">{localeFlags[locale]}</span>
					<span>{localeNames[locale]}</span>
					{#if locale === currentLocale}
						<svg class="w-4 h-4 ml-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.language-switcher {
		user-select: none;
	}
</style>