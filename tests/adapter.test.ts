import { describe, expect, it } from 'vitest';
import { NOT_FOUND_ROUTE, withNotFoundRoute, type VercelConfig } from '../adapter';

// The shape adapter-static writes to .vercel/output/config.json: page redirects, the immutable
// cache header, the filesystem phase, and a plain 404 for missing immutable assets.
const fromAdapterStatic: VercelConfig = {
	version: 3,
	routes: [
		{ src: '/en/', dest: '/en' },
		{ src: '/en', status: 308, headers: { Location: '/en/' } },
		{
			src: '/_app/immutable/.+',
			headers: { 'cache-control': 'public, immutable, max-age=31536000' }
		},
		{ handle: 'filesystem' },
		{
			src: '/_app/immutable/.+',
			status: 404,
			headers: { 'cache-control': 'no-store' },
			continue: false
		}
	],
	overrides: { '404.html': { path: '404.html' }, 'en/index.html': { path: 'en' } }
};

describe('withNotFoundRoute (PRD route table)', () => {
	it('adds the 404.html rule last and keeps every other rule and key as it was', () => {
		const config = withNotFoundRoute(structuredClone(fromAdapterStatic));
		expect(config.routes).toEqual([...fromAdapterStatic.routes, NOT_FOUND_ROUTE]);
		expect({ ...config, routes: [] }).toEqual({ ...fromAdapterStatic, routes: [] });
		expect(NOT_FOUND_ROUTE).toEqual({ src: '/.*', dest: '/404.html', status: 404 });
	});

	it('puts the rule in the filesystem phase, after the immutable asset 404', () => {
		const routes = withNotFoundRoute(structuredClone(fromAdapterStatic)).routes;
		const filesystem = routes.findIndex((route) => route.handle === 'filesystem');
		expect(routes.indexOf(NOT_FOUND_ROUTE)).toBeGreaterThan(filesystem);
		expect(routes.at(-2)).toMatchObject({ src: '/_app/immutable/.+', continue: false });
	});

	it('does not add the rule twice', () => {
		const once = withNotFoundRoute(structuredClone(fromAdapterStatic));
		expect(withNotFoundRoute(once).routes).toHaveLength(fromAdapterStatic.routes.length + 1);
	});

	it('refuses a config without the filesystem phase', () => {
		const config = { version: 3, routes: [{ src: '/en/', dest: '/en' }] };
		expect(() => withNotFoundRoute(config)).toThrow('filesystem');
	});
});
