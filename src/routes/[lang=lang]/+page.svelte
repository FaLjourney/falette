<script lang="ts">
	import Alternates from '#lib/components/Alternates.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.t('meta.home.title')}</title>
	<meta name="description" content={data.t('meta.home.description')} />
</svelte:head>
<Alternates path="" />

<main>
	<h1>{data.t('home.heading')}</h1>
</main>

<style>
	main {
		padding: var(--space-5);
	}
</style>
