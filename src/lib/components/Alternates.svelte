<script lang="ts">
	import { languages } from '../../params/lang';
	import { SITE_URL } from '#lib/site.ts';

	interface Props {
		/** Path after the language prefix: `''` for Home, `'create/'` for Create. */
		path: '' | 'create/';
	}

	let { path }: Props = $props();
</script>

<!-- One set per page, also on the redirect page of that page (NAV-11). -->
<svelte:head>
	{#each languages as lang (lang)}
		<link rel="alternate" hreflang={lang} href="{SITE_URL}/{lang}/{path}" />
	{/each}
	<link rel="alternate" hreflang="x-default" href="{SITE_URL}/{path}" />
</svelte:head>
