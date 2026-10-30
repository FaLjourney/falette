import AxeBuilder from '@axe-core/playwright';
import { SITE_PAGES, expect, inlineSource, test } from './helpers/site';

// WCAG 2.2 AA (NFR Aksesibilitas, THM-06) on every page, in both website themes.
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const redirects = ['/', '/create/'];

for (const colorScheme of ['light', 'dark'] as const) {
	test.describe(`${colorScheme} theme`, () => {
		test.use({ colorScheme });

		for (const path of SITE_PAGES.filter((path) => !redirects.includes(path))) {
			test(`${path} passes axe`, async ({ page }) => {
				await page.goto(path);
				await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
				const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
				expect(violations).toEqual([]);
			});
		}

		// axe cannot run with JavaScript off, so the redirect pages are served as visitors without
		// JavaScript see them: no redirect, and the <noscript> links shown.
		for (const path of redirects) {
			test(`${path} as seen without JavaScript passes axe`, async ({ page, request }) => {
				const source = await (await request.get(path)).text();
				const redirect = `<script>${inlineSource('lang-redirect')}</script>`;
				expect(source).toContain(redirect);
				const body = source
					.replace(redirect, '')
					.replace('<noscript>', '<div>')
					.replace('</noscript>', '</div>');
				await page.route(`**${path}`, (route) => route.fulfill({ contentType: 'text/html', body }));
				await page.goto(path);
				await expect(page.getByRole('link')).toHaveCount(2);
				const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
				expect(violations).toEqual([]);
			});
		}
	});
}
