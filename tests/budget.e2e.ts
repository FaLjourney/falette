import { gzipSync } from 'node:zlib';
import { expect, test } from './helpers/site';

// Initial JavaScript per page, gzip (NFR Performa): every script loaded until the network is idle.
const budgets = [
	['/en/', 100_000],
	['/en/create/', 200_000]
] as const;

for (const [path, limit] of budgets) {
	test(`initial JavaScript on ${path} stays within ${limit / 1000} KB gzip`, async ({ page }) => {
		const sizes: Promise<number>[] = [];
		page.on('response', (response) => {
			if (response.request().resourceType() === 'script' || response.url().endsWith('.js')) {
				sizes.push(response.body().then((body) => gzipSync(body).length));
			}
		});
		await page.goto(path, { waitUntil: 'networkidle' });
		const total = (await Promise.all(sizes)).reduce((sum, size) => sum + size, 0);
		test.info().annotations.push({ type: 'JavaScript, gzip', description: `${total} B` });
		expect(total).toBeGreaterThan(0);
		expect(total).toBeLessThanOrEqual(limit);
	});
}
