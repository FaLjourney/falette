import { describe, expect, it } from 'vitest';
import { NOT_FOUND_ROUTES, withNotFoundRoutes, type VercelConfig } from '../adapter';

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

describe('withNotFoundRoutes (PRD route table)', () => {
	it('adds the error phase with the 404.html rule last, keeping every other rule and key', () => {
		const config = withNotFoundRoutes(structuredClone(fromAdapterStatic));
		expect(config.routes).toEqual([...fromAdapterStatic.routes, ...NOT_FOUND_ROUTES]);
		expect({ ...config, routes: [] }).toEqual({ ...fromAdapterStatic, routes: [] });
		expect(NOT_FOUND_ROUTES).toEqual([
			{ handle: 'error' },
			{ src: '/.*', dest: '/404.html', status: 404 }
		]);
	});

	it('puts the error phase after the filesystem phase and every adapter-static rule', () => {
		const routes = withNotFoundRoutes(structuredClone(fromAdapterStatic)).routes;
		const filesystem = routes.findIndex((route) => route.handle === 'filesystem');
		const error = routes.findIndex((route) => route.handle === 'error');
		expect(error).toBeGreaterThan(filesystem);
		expect(error).toBe(fromAdapterStatic.routes.length);
		expect(routes.at(-1)).toEqual({ src: '/.*', dest: '/404.html', status: 404 });
	});

	it('does not add the rules twice', () => {
		const once = withNotFoundRoutes(structuredClone(fromAdapterStatic));
		expect(withNotFoundRoutes(once).routes).toHaveLength(
			fromAdapterStatic.routes.length + NOT_FOUND_ROUTES.length
		);
	});

	it('refuses a config that already has another error phase', () => {
		const config = structuredClone(fromAdapterStatic);
		config.routes.push({ handle: 'error' }, { src: '/.*', dest: '/other.html', status: 404 });
		expect(() => withNotFoundRoutes(config)).toThrow('error');
	});
});
