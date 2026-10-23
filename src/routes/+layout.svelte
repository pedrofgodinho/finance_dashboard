<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '#lib/styles.css';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<div class="brand">
		<span class="brand-mark" aria-hidden="true">f.</span>
		<div>Finance Dashboard<small>PERSONAL PORTFOLIO</small></div>
	</div>
	<div class="identity">
		<span class="private"
			><span aria-hidden="true">●</span>
			{data.development ? 'Local development' : 'Private workspace'}</span
		>
		{#if !data.development}
			<span class="email">{data.user.email}</span>
			<!-- Cloudflare serves this endpoint outside SvelteKit's route manifest. -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href="/cdn-cgi/access/logout" data-sveltekit-reload>Sign out</a>
		{/if}
	</div>
</header>

{@render children()}

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		align-items: center;
		padding: 1.2rem max(1.5rem, calc((100vw - 1260px) / 2));
		font-size: 0.875rem;
		border-bottom: 1px solid var(--border);
		background: white;
	}
	.brand {
		display: flex;
		gap: 0.8rem;
		align-items: center;
		font-weight: 650;
		letter-spacing: -0.03em;
	}
	.brand-mark {
		background: var(--green);
		color: white;
		width: 38px;
		height: 38px;
		border-radius: 11px;
		display: grid;
		place-content: center;
		font-size: 1.6rem;
	}
	small {
		display: block;
		font-size: 0.58rem;
		letter-spacing: 0.16em;
		color: var(--muted);
		margin-top: 0.15rem;
	}
	.identity {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.75rem;
	}
	.private {
		color: var(--green);
		background: var(--green-light);
		padding: 0.4rem 0.65rem;
		border-radius: 6px;
	}
	.private span {
		font-size: 0.5rem;
		margin-right: 0.3rem;
	}
	.email {
		color: var(--muted);
	}
	a {
		color: var(--ink);
		text-underline-offset: 3px;
	}
	@media (max-width: 760px) {
		.email {
			display: none;
		}
		.identity {
			gap: 0.6rem;
		}
	}
</style>
