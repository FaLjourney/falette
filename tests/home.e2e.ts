import { expect, test } from '@playwright/test';

test('prerendered English home page loads', async ({ page }) => {
	await page.goto('/en/');
	await expect(page.locator('h1')).toBeVisible();
});
