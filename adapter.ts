import { readFileSync, writeFileSync } from 'node:fs';
import adapterStatic from '@sveltejs/adapter-static';
import type { Adapter } from '@sveltejs/kit';

type Route = Record<string, unknown>;

export interface VercelConfig {
	routes: Route[];
	[key: string]: unknown;
}

/**
 * Serves 404.html with status 404 for every path no file matches (PRD route table). Routes after
 * `{ handle: 'filesystem' }` only run once the filesystem lookup has missed.
 */
export const NOT_FOUND_ROUTE: Route = { src: '/.*', dest: '/404.html', status: 404 };

/** The Build Output API config adapter-static writes, with `NOT_FOUND_ROUTE` added last. */
export function withNotFoundRoute(config: VercelConfig): VercelConfig {
	if (!config.routes.some((route) => route.handle === 'filesystem')) {
		// Without the filesystem phase the catch-all would answer every request with the 404 page.
		throw new Error('Expected a { handle: "filesystem" } route in the Vercel config');
	}
	const present = config.routes.some(
		(route) => JSON.stringify(route) === JSON.stringify(NOT_FOUND_ROUTE)
	);
	return present ? config : { ...config, routes: [...config.routes, NOT_FOUND_ROUTE] };
}

const VERCEL_CONFIG = '.vercel/output/config.json';

/** adapter-static, plus the 404 rule in the config it writes on Vercel. */
export function adapter(): Adapter {
	const base = adapterStatic();
	return {
		...base,
		async adapt(builder) {
			await base.adapt(builder);
			// Same check as adapter-static's own Vercel detection, which writes the config file.
			if (process.env.VERCEL) {
				const config: VercelConfig = JSON.parse(readFileSync(VERCEL_CONFIG, 'utf8'));
				writeFileSync(VERCEL_CONFIG, JSON.stringify(withNotFoundRoute(config), null, '  '));
			}
		}
	};
}
