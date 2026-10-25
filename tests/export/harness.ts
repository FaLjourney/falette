import type { Page } from '@playwright/test';

/** The export test page from tests/harness, served by the second web server in playwright.config.ts. */
export const HARNESS_URL = 'http://localhost:4174/';

export async function openHarness(page: Page): Promise<void> {
	await page.goto(HARNESS_URL);
	await page.waitForFunction(() => window.harness !== undefined);
}

export function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** The four MVP patterns (PAT-01). */
export const patternIds = ['arcs', 'hills', 'waves', 'gradient'];
