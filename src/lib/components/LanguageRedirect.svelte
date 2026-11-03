<script lang="ts">
	import { resolve } from '$app/paths';
	import { languages } from '../../params/lang';
	import Alternates from './Alternates.svelte';
	import en from '#lib/i18n/en.json';

	interface Props {
		/** Path after the language prefix, as in `Alternates`. */
		path: '' | 'create/';
	}

	let { path }: Props = $props();
</script>

<!-- The redirect itself is src/lib/inline/lang-redirect.js; these links are for visitors without JavaScript. -->
<svelte:head>
	<title>{en.redirect.title}</title>
</svelte:head>
<Alternates {path} />

<noscript>
	<ul>
		{#each languages as lang (lang)}
			<li><a href={resolve(`${lang}/${path}`)} hreflang={lang} {lang}>{en.languages[lang]}</a></li>
		{/each}
	</ul>
</noscript>
