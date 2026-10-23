<svelte:head>
	<title>ETF Portfolio | Finance Dashboard</title>
	<meta
		name="description"
		content="Track your ETF investments and explore long-term portfolio scenarios using historical data."
	/>
</svelte:head>

<main>
	<p class="eyebrow">Finance Dashboard</p>
	<h1>ETF Portfolio</h1>
	<p>Track past investments and explore long-term portfolio scenarios using historical data.</p>
	<p class="status">
		The project foundation is ready. Portfolio tracking and projections are next.
	</p>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f5f7f6;
		color: #16312b;
		font-family: system-ui, sans-serif;
		line-height: 1.6;
	}

	main {
		max-width: 42rem;
		margin-inline: auto;
		padding: clamp(2rem, 10vw, 8rem) 1.5rem;
	}

	h1 {
		margin-block: 0.5rem 1rem;
		font-size: clamp(2.5rem, 8vw, 4rem);
		line-height: 1.1;
		letter-spacing: -0.04em;
	}

	.eyebrow {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.status {
		margin-top: 2rem;
		color: #52665e;
		font-size: 0.875rem;
	}
</style>
