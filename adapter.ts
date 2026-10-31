import { readFileSync, writeFileSync } from 'node:fs';
import adapterStatic from '@sveltejs/adapter-static';
import type { Adapter } from '@sveltejs/kit';

type Route = Record<string, unknown>;

export interface VercelConfig {
	routes: Route[];
	[key: string]: unknown;
}

/**
 * Serves 404.html with status 404 for every request that ends in a 404 (PRD route table). The
 * error phase comes after every other rule, as @vercel/next does for a static 404 page. A rule with
 * `dest` in the filesystem phase is not checked against the files again, so it cannot do this.
 */
export const NOT_FOUND_ROUTES: readonly Route[] = [
	{ handle: 'error' },
	{ src: '/.*', dest: '/404.html', status: 404 }
];

/** The Build Output API config adapter-static writes, with `NOT_FOUND_ROUTES` added last. */
export function withNotFoundRoutes(config: VercelConfig): VercelConfig {
	const tail = config.routes.slice(-NOT_FOUND_ROUTES.length);
	if (JSON.stringify(tail) === JSON.stringify(NOT_FOUND_ROUTES)) {
		return config;
	}
	if (config.routes.some((route) => route.handle === 'error')) {
		// Vercel allows each handle once, so a second error phase would be rejected.
		throw new Error('The Vercel config already has a { handle: "error" } phase');
	}
	return { ...config, routes: [...config.routes, ...NOT_FOUND_ROUTES] };
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
