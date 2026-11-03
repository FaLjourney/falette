import { existsSync } from 'node:fs';
import type { APIRequestContext } from '@playwright/test';
import en from '../src/lib/i18n/en.json' with { type: 'json' };
import id from '../src/lib/i18n/id.json' with { type: 'json' };
import { SITE_PAGES, expect, inlineSource, test } from './helpers/site';

const SITE = 'https://falette.vercel.app';
const ALTERNATES = {
	home: [
		['en', `${SITE}/en/`],
		['id', `${SITE}/id/`],
		['x-default', `${SITE}/`]
	],
	create: [
		['en', `${SITE}/en/create/`],
		['id', `${SITE}/id/create/`],
		['x-default', `${SITE}/create/`]
	]
};

/** Prerendered HTML as the server sends it, before any script runs. */
async function html(request: APIRequestContext, path: string) {
	return (await request.get(path)).text();
}

test.describe('language redirect (NAV-10, NAV-11)', () => {
	test.describe('browser in Indonesian', () => {
		test.use({ locale: 'id-ID' });

		test('/ goes to /id/', async ({ page }) => {
			await page.goto('/');
			await expect(page).toHaveURL('/id/');
		});

		test('/create/ keeps the query and hash', async ({ page }) => {
			await page.goto('/create/?a=1#v=1&p=waves');
			await expect(page).toHaveURL('/id/create/?a=1#v=1&p=waves');
		});
	});

	test.describe('browser in German', () => {
		test.use({ locale: 'de-DE' });

		test('falls back to English', async ({ page }) => {
			await page.goto('/create/#v=1');
			await expect(page).toHaveURL('/en/create/#v=1');
		});
	});

	test.describe('stored language', () => {
		test.use({ locale: 'en-US' });

		test('wins over the browser language', async ({ page }) => {
			await page.addInitScript(() => localStorage.setItem('falette:lang', 'id'));
			await page.goto('/');
			await expect(page).toHaveURL('/id/');
		});
	});

	test.describe('without JavaScript', () => {
		test.use({ javaScriptEnabled: false });

		test('/ and /create/ show both languages as links', async ({ page }) => {
			for (const path of ['', 'create/']) {
				await page.goto(`/${path}`);
				await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute(
					'href',
					`/en/${path}`
				);
				await expect(page.getByRole('link', { name: 'Bahasa Indonesia' })).toHaveAttribute(
					'href',
					`/id/${path}`
				);
			}
		});
	});
});

test.describe('prerendered HTML', () => {
	const pages = [
		['/', 'en', ALTERNATES.home],
		['/en/', 'en', ALTERNATES.home],
		['/id/', 'id', ALTERNATES.home],
		['/create/', 'en', ALTERNATES.create],
		['/en/create/', 'en', ALTERNATES.create],
		['/id/create/', 'id', ALTERNATES.create]
	] as const;

	for (const [path, lang, alternates] of pages) {
		test(`${path}: <html lang="${lang}"> and hreflang of its page (NAV-11)`, async ({
			request
		}) => {
			const page = await html(request, path);
			expect(page).toContain(`<html lang="${lang}">`);
			const links = [...page.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
			expect(links.map(([, hreflang, href]) => [hreflang, href])).toEqual(alternates);
		});
	}

	const scripts: Record<string, string[]> = {
		'/': ['lang-redirect', 'theme'],
		'/create/': ['lang-redirect', 'theme'],
		'/404.html': ['lang-404', 'theme']
	};

	for (const path of SITE_PAGES) {
		test(`${path}: inline scripts right after the CSP meta, before any CSS (P2)`, async ({
			request
		}) => {
			const page = await html(request, path);
			const head = page.slice(0, page.indexOf('</head>'));
			const meta = /<meta http-equiv="content-security-policy"[^>]*>/.exec(head);
			if (meta === null) throw new Error(`${path} has no CSP meta`);
			const inline = (scripts[path] ?? ['theme'])
				.map((name) => `<script>${inlineSource(name)}</script>`)
				.join('');
			const afterMeta = head.slice(meta.index + meta[0].length);
			expect(afterMeta.startsWith(inline)).toBe(true);
			expect(afterMeta.indexOf('<link')).toBeGreaterThanOrEqual(inline.length);
		});

		test(`${path}: no style attributes (T2)`, async ({ request }) => {
			expect(await html(request, path)).not.toMatch(/\sstyle=/);
		});
	}
});

test.describe('theme (THM-01, THM-02, THM-04)', () => {
	test('is set before the body is parsed', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.addInitScript(() => {
			new MutationObserver((_, observer) => {
				if (!document.body) return;
				const root = document.documentElement;
				root.setAttribute('data-theme-at-body', root.dataset.theme ?? 'unset');
				observer.disconnect();
			}).observe(document, { childList: true, subtree: true });
		});
		await page.goto('/en/');
		await expect(page.locator('html')).toHaveAttribute('data-theme-at-body', 'dark');
		await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(19, 19, 19)');
	});

	test('follows the system setting while nothing is stored', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/id/');
		const root = page.locator('html');
		await expect(root).toHaveAttribute('data-theme', 'light');
		await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
		await page.emulateMedia({ colorScheme: 'dark' });
		await expect(root).toHaveAttribute('data-theme', 'dark');
	});

	test('a stored choice wins over the system setting', async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem('falette:theme', 'light'));
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/en/create/');
		const root = page.locator('html');
		await expect(root).toHaveAttribute('data-theme', 'light');
		await page.emulateMedia({ colorScheme: 'light' });
		await page.emulateMedia({ colorScheme: 'dark' });
		await expect(root).toHaveAttribute('data-theme', 'light');
	});
});

test.describe('language pages (NAV-10, NFR Bahasa)', () => {
	for (const [lang, messages] of [
		['en', en],
		['id', id]
	] as const) {
		test(`/${lang}/ has its title, description, and heading`, async ({ page }) => {
			await page.goto(`/${lang}/`);
			await expect(page).toHaveTitle(messages.meta.home.title);
			await expect(page.locator('meta[name="description"]')).toHaveAttribute(
				'content',
				messages.meta.home.description
			);
			await expect(page.getByRole('heading', { level: 1 })).toHaveText(messages.home.heading);
		});

		test(`/${lang}/create/ has its title, description, and heading`, async ({ page }) => {
			await page.goto(`/${lang}/create/`);
			await expect(page).toHaveTitle(messages.meta.create.title);
			await expect(page.locator('meta[name="description"]')).toHaveAttribute(
				'content',
				messages.meta.create.description
			);
			await expect(page.getByRole('heading', { level: 1 })).toHaveText(messages.create.heading);
		});
	}

	test('<html lang> follows navigation to another language in the browser', async ({ page }) => {
		await page.goto('/en/', { waitUntil: 'networkidle' });
		await page.evaluate(() => {
			// Survives only client-side navigation, not a full page load.
			document.documentElement.setAttribute('data-test-same-document', '');
			const link = document.createElement('a');
			link.href = '/id/';
			document.body.append(link);
			link.click();
		});
		await expect(page).toHaveURL('/id/');
		const root = page.locator('html');
		await expect(root).toHaveAttribute('data-test-same-document', '');
		await expect(root).toHaveAttribute('lang', 'id');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(id.home.heading);
	});
});

test.describe('404 page (PRD route table, T1)', () => {
	test('build writes 404.html, not 404.html/index.html', () => {
		expect(existsSync('build/404.html')).toBe(true);
		expect(existsSync('build/404.html/index.html')).toBe(false);
	});

	for (const [stored, lang, messages] of [
		[null, 'en', en],
		['id', 'id', id]
	] as const) {
		test(`at a nested unknown path, shows only ${lang} with working CSS and links (P1)`, async ({
			page
		}) => {
			if (stored) {
				await page.addInitScript((value) => localStorage.setItem('falette:lang', value), stored);
			}
			// Vercel serves 404.html at the requested path; do the same here.
			await page.route('**/id/tidak-ada/', (route) =>
				route.fulfill({ status: 404, contentType: 'text/html', path: 'build/404.html' })
			);
			const response = await page.goto('/id/tidak-ada/');
			expect(response?.status()).toBe(404);

			await expect(page.locator('html')).toHaveAttribute('lang', lang);
			await expect(page).toHaveTitle(messages.notFound.title);
			const visible = page.locator('main [lang]:visible');
			await expect(visible).toHaveCount(1);
			await expect(visible).toHaveAttribute('lang', lang);
			await expect(visible.getByRole('heading', { level: 1 })).toHaveText(
				messages.notFound.heading
			);
			await expect(visible.getByRole('link', { name: messages.notFound.home })).toHaveAttribute(
				'href',
				`/${lang}/`
			);
			await expect(visible.getByRole('link', { name: messages.notFound.create })).toHaveAttribute(
				'href',
				`/${lang}/create/`
			);
			await expect(page.locator('body')).toHaveCSS('font-family', /Inter Variable/);
		});
	}
});
