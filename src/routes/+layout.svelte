<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<span>{data.development ? 'Local development' : `Signed in as ${data.user.email}`}</span>
	{#if !data.development}
		<!-- Cloudflare serves this endpoint outside SvelteKit's route manifest. -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href="/cdn-cgi/access/logout" data-sveltekit-reload>Sign out</a>
	{/if}
</header>

{@render children()}

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		padding: 1rem 1.5rem;
		font-size: 0.875rem;
		border-bottom: 1px solid #dce5e0;
	}

	a {
		color: inherit;
	}
</style>
