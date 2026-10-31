import { readFileSync, writeFileSync } from 'node:fs';
import adapterStatic from '@sveltejs/adapter-static';
import type { Adapter } from '@sveltejs/kit';

type Route = Record<string, unknown>;

export interface VercelConfig {
	routes: Route[];
	[key: string]: unknown;
}

/**
 * Serves 404.html with status 404 for every request that ends in a 404 (PRD route table), in the
 * error phase after every other rule, as @vercel/next does for a static 404 page.
 */
export const NOT_FOUND_ROUTES: readonly Route[] = [
	{ handle: 'error' },
	{ src: '/.*', dest: '/404.html', status: 404 }
];

/**
 * The pair adapter-static writes for 404.html, a `trailingSlash: 'never'` page. It rewrites
 * /404.html to /404.html/, which matches no file; without it, the 404.html override serves the file.
 */
const NOT_FOUND_PAGE_SOURCES = new Set(['/404.html', '/404.html/']);

/**
 * The Build Output API config adapter-static writes, without its 404.html rules and with
 * `NOT_FOUND_ROUTES` added last. Every other rule and the overrides stay as written.
 */
export function withNotFoundRoutes(config: VercelConfig): VercelConfig {
	const tail = config.routes.slice(-NOT_FOUND_ROUTES.length);
	if (JSON.stringify(tail) === JSON.stringify(NOT_FOUND_ROUTES)) {
		return config;
	}
	if (config.routes.some((route) => route.handle === 'error')) {
		// Vercel allows each handle once, so a second error phase would be rejected.
		throw new Error('The Vercel config already has a { handle: "error" } phase');
	}
	const routes = config.routes.filter(
		(route) => typeof route.src !== 'string' || !NOT_FOUND_PAGE_SOURCES.has(route.src)
	);
	return { ...config, routes: [...routes, ...NOT_FOUND_ROUTES] };
}

const VERCEL_CONFIG = '.vercel/output/config.json';

/** adapter-static, plus the 404 rules in the config it writes on Vercel. */
export function adapter(): Adapter {
	const base = adapterStatic();
	return {
		...base,
		async adapt(builder) {
			await base.adapt(builder);
			// Same check as adapter-static's own Vercel detection, which writes the config file.
			if (process.env.VERCEL) {
				const config: VercelConfig = JSON.parse(readFileSync(VERCEL_CONFIG, 'utf8'));
				writeFileSync(VERCEL_CONFIG, JSON.stringify(withNotFoundRoutes(config), null, '  '));
			}
		}
	};
}
