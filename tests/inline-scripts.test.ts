import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { languages } from '../src/params/lang';

// The exact text that src/hooks.server.ts inlines and vite.config.ts hashes, run against fakes.
const source = (name: string) =>
	readFileSync(new URL(`../src/lib/inline/${name}.js`, import.meta.url), 'utf8');

/** `localStorage` with these values; `null` stands for storage that throws, as in some private modes. */
function withStorage(context: object, values: Record<string, string> | null): object {
	return Object.defineProperty(context, 'localStorage', {
		get() {
			if (values === null) throw new Error('SecurityError');
			return { getItem: (key: string) => values[key] ?? null };
		}
	});
}

describe('theme.js (THM-02, THM-04)', () => {
	function load(stored: Record<string, string> | null, systemDark: boolean) {
		const values = stored === null ? null : { ...stored };
		const listeners: (() => void)[] = [];
		const system = {
			matches: systemDark,
			addEventListener: (type: string, listener: () => void) => {
				if (type === 'change') listeners.push(listener);
			}
		};
		const dataset: Record<string, string> = {};
		const context = withStorage(
			{
				matchMedia: (query: string) => {
					expect(query).toBe('(prefers-color-scheme: dark)');
					return system;
				},
				document: { documentElement: { dataset } }
			},
			values
		);
		runInNewContext(source('theme'), context);
		return {
			theme: () => dataset.theme,
			setSystem(dark: boolean) {
				system.matches = dark;
				for (const listener of listeners) listener();
			},
			/** What the toggle in session 2 does: store the choice and show it. */
			choose(theme: string) {
				if (values !== null) values['falette:theme'] = theme;
				dataset.theme = theme;
			}
		};
	}

	it('follows the system setting when nothing is stored', () => {
		expect(load({}, false).theme()).toBe('light');
		expect(load({}, true).theme()).toBe('dark');
	});

	it('uses the stored choice over the system setting', () => {
		expect(load({ 'falette:theme': 'dark' }, false).theme()).toBe('dark');
		expect(load({ 'falette:theme': 'light' }, true).theme()).toBe('light');
	});

	it('ignores an unknown stored value and storage that throws', () => {
		expect(load({ 'falette:theme': 'blue' }, true).theme()).toBe('dark');
		expect(load(null, true).theme()).toBe('dark');
	});

	it('changes with the system setting while nothing is stored', () => {
		const page = load({}, false);
		page.setSystem(true);
		expect(page.theme()).toBe('dark');
		page.setSystem(false);
		expect(page.theme()).toBe('light');
	});

	it('stops following the system once a choice is stored after load', () => {
		const page = load({}, false);
		page.choose('dark');
		page.setSystem(true);
		page.setSystem(false);
		expect(page.theme()).toBe('dark');
	});
});

describe('lang-redirect.js (NAV-10, NAV-11)', () => {
	function redirect(
		stored: Record<string, string> | null,
		browser: string[],
		{ pathname = '/', search = '', hash = '' } = {}
	): string | undefined {
		let target: string | undefined;
		const context = withStorage(
			{
				navigator: { languages: browser },
				location: { pathname, search, hash, replace: (url: string) => (target = url) }
			},
			stored
		);
		runInNewContext(source('lang-redirect'), context);
		return target;
	}

	it('prefers the stored language', () => {
		expect(redirect({ 'falette:lang': 'id' }, ['en-US'])).toBe('/id/');
		expect(redirect({ 'falette:lang': 'en' }, ['id-ID'])).toBe('/en/');
	});

	it('then the first supported browser language, then English', () => {
		expect(redirect({}, ['de-DE', 'ID-id', 'en'])).toBe('/id/');
		expect(redirect({ 'falette:lang': 'xx' }, ['id'])).toBe('/id/');
		expect(redirect({}, ['fr-FR'])).toBe('/en/');
		expect(redirect({}, [])).toBe('/en/');
		expect(redirect(null, ['id-ID'])).toBe('/id/');
	});

	it('knows every language of the route matcher', () => {
		for (const lang of languages) {
			expect(redirect({}, [lang])).toBe(`/${lang}/`);
		}
	});

	it('keeps the path, query, and hash', () => {
		const target = redirect({}, ['id-ID'], {
			pathname: '/create/',
			search: '?a=1',
			hash: '#v=1&p=waves'
		});
		expect(target).toBe('/id/create/?a=1#v=1&p=waves');
	});
});

describe('lang-404.js', () => {
	const titles: Record<string, string> = {
		en: 'Page not found · Falette',
		id: 'Halaman tidak ditemukan · Falette'
	};

	function show(stored: Record<string, string> | null) {
		const listeners: Record<string, () => void> = {};
		const document = {
			documentElement: { lang: 'en' },
			title: titles.en,
			addEventListener: (type: string, listener: () => void) => (listeners[type] = listener),
			querySelector: (selector: string) => {
				const lang = /^\[lang="(\w+)"\]\[data-title\]$/.exec(selector)?.[1];
				return lang && titles[lang] ? { getAttribute: () => titles[lang] } : null;
			}
		};
		runInNewContext(source('lang-404'), withStorage({ document }, stored));
		listeners.DOMContentLoaded?.();
		return { lang: document.documentElement.lang, title: document.title };
	}

	it('shows the stored language', () => {
		expect(show({ 'falette:lang': 'id' })).toEqual({ lang: 'id', title: titles.id });
	});

	it('falls back to English', () => {
		const english = { lang: 'en', title: titles.en };
		expect(show({})).toEqual(english);
		expect(show({ 'falette:lang': 'en' })).toEqual(english);
		expect(show({ 'falette:lang': 'xx' })).toEqual(english);
		expect(show(null)).toEqual(english);
	});
});
