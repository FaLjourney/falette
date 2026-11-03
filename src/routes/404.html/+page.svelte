<script lang="ts">
	import { resolve } from '$app/paths';
	import { languages, type Language } from '../../params/lang';
	import en from '#lib/i18n/en.json';
	import id from '#lib/i18n/id.json';
	import type { Messages } from '#lib/i18n/index.ts';

	// Vercel serves this page at any unknown path, so links must be root-relative:
	// `paths.relative` is false in vite.config.ts.
	const messages: Record<Language, Messages> = { en, id };
</script>

<svelte:head>
	<title>{en.notFound.title}</title>
</svelte:head>

<main>
	{#each languages as lang (lang)}
		{@const text = messages[lang].notFound}
		<div class="language" {lang} data-title={text.title}>
			<h1>{text.heading}</h1>
			<p>{text.message}</p>
			<ul>
				<li><a href={resolve(`${lang}/`)}>{text.home}</a></li>
				<li><a href={resolve(`${lang}/create/`)}>{text.create}</a></li>
			</ul>
		</div>
	{/each}
</main>

<style>
	main {
		padding: var(--space-5);
	}

	/* Only the language in <html lang> shows; lang-404.js sets it before the first render. */
	.language {
		display: none;
	}

	:global(html[lang='en']) .language[lang='en'],
	:global(html[lang='id']) .language[lang='id'] {
		display: block;
	}

	ul {
		display: flex;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
