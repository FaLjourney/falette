import type { Handle } from '@sveltejs/kit/hooks';
import lang404 from '#lib/inline/lang-404.js?raw';
import langRedirect from '#lib/inline/lang-redirect.js?raw';
import theme from '#lib/inline/theme.js?raw';

// Runs only while pages are prerendered (and in `npm run dev`); the site itself has no server.

const CSP_META = /<meta http-equiv="content-security-policy"[^>]*>/;

/** Inline scripts per route; their hashes are allowed in `script-src` (vite.config.ts). */
const ROUTE_SCRIPTS: Record<string, string[]> = {
	'/': [langRedirect],
	'/create': [langRedirect],
	'/404.html': [lang404]
};

export const handle: Handle = ({ event, resolve }) => {
	const lang = event.params.lang ?? 'en';
	const scripts = [...(ROUTE_SCRIPTS[event.route.id ?? ''] ?? []), theme]
		.map((source) => `<script>${source}</script>`)
		.join('');
	return resolve(event, {
		// Right after the CSP meta, so the policy covers the scripts, and before the CSS links, so
		// the scripts do not wait for stylesheets. Pages without a CSP meta get them first in <head>.
		transformPageChunk: ({ html }) =>
			html
				.replace('%falette.lang%', lang)
				.replace(CSP_META.test(html) ? CSP_META : '<head>', (tag) => tag + scripts)
	});
};
