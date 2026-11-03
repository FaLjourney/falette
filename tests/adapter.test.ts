import { describe, expect, it } from 'vitest';
import { NOT_FOUND_ROUTES, withNotFoundRoutes, type VercelConfig } from '../adapter';

// The pair adapter-static writes for 404.html, a trailingSlash 'never' page.
const notFoundPageRoutes = [
	{ src: '/404.html', dest: '/404.html/' },
	{ src: '/404.html/', status: 308, headers: { Location: '/404.html' } }
];

// The rest of what adapter-static writes to .vercel/output/config.json: page redirects, the
// immutable cache header, the filesystem phase, and a plain 404 for missing immutable assets.
const otherRoutes = [
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
];

const fromAdapterStatic: VercelConfig = {
	version: 3,
	routes: [...notFoundPageRoutes, ...otherRoutes],
	overrides: { '404.html': { path: '404.html' }, 'en/index.html': { path: 'en' } }
};

describe('withNotFoundRoutes (PRD route table)', () => {
	it('drops the 404.html pair and adds the error phase last, keeping the rest as written', () => {
		const config = withNotFoundRoutes(structuredClone(fromAdapterStatic));
		expect(config.routes).toEqual([...otherRoutes, ...NOT_FOUND_ROUTES]);
		expect(NOT_FOUND_ROUTES).toEqual([
			{ handle: 'error' },
			{ src: '/.*', dest: '/404.html', status: 404 }
		]);
	});

	it('drops the 404.html rules and override, keeping the other overrides and keys', () => {
		const config = withNotFoundRoutes(structuredClone(fromAdapterStatic));
		expect(config.overrides).toEqual({ 'en/index.html': { path: 'en' } });
		expect({ ...config, routes: [], overrides: {} }).toEqual({
			...fromAdapterStatic,
			routes: [],
			overrides: {}
		});
		const sources = config.routes.map((route) => route.src);
		expect(sources).not.toContain('/404.html');
		expect(sources).not.toContain('/404.html/');
	});

	it('puts the error phase after the filesystem phase and every other rule', () => {
		const routes = withNotFoundRoutes(structuredClone(fromAdapterStatic)).routes;
		const filesystem = routes.findIndex((route) => route.handle === 'filesystem');
		const error = routes.findIndex((route) => route.handle === 'error');
		expect(error).toBeGreaterThan(filesystem);
		expect(error).toBe(otherRoutes.length);
		expect(routes.at(-1)).toEqual({ src: '/.*', dest: '/404.html', status: 404 });
	});

	it('gives the same result when run twice', () => {
		const once = withNotFoundRoutes(structuredClone(fromAdapterStatic));
		expect(withNotFoundRoutes(structuredClone(once))).toEqual(once);
	});

	it('refuses a config that already has another error phase', () => {
		const config = structuredClone(fromAdapterStatic);
		config.routes.push({ handle: 'error' }, { src: '/.*', dest: '/other.html', status: 404 });
		expect(() => withNotFoundRoutes(config)).toThrow('error');
	});
});
