import { readFileSync } from 'node:fs';
import { expect, test as base } from '@playwright/test';

/**
 * `test` for pages of the site: fails when the browser reports a Content-Security-Policy
 * violation, such as a blocked inline script or a `style` attribute (NFR Keamanan, T2).
 */
export const test = base.extend<{ cspViolations: string[] }>({
	cspViolations: [
		async ({ page }, use) => {
			const violations: string[] = [];
			page.on('console', (message) => {
				if (message.type() === 'error' && /content.security.policy/i.test(message.text())) {
					violations.push(message.text());
				}
			});
			await use(violations);
			expect(violations, 'Content-Security-Policy violations').toEqual([]);
		},
		{ auto: true }
	]
});

export { expect };

export const SITE_PAGES = [
	'/',
	'/create/',
	'/en/',
	'/id/',
	'/en/create/',
	'/id/create/',
	'/404.html'
];

/** Source of an inline script in src/lib/inline/, exactly as src/hooks.server.ts inlines it. */
export const inlineSource = (name: string) => readFileSync(`src/lib/inline/${name}.js`, 'utf8');
