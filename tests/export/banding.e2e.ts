import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Variant } from '../../src/lib/engine/types';
import { allPresets } from '../fixtures/presets';
import { openHarness } from './harness';

// Measures banding in PNGs of a linear gradient made through the real EXP-01 path, per browser.
// No pass mark: the results decide the dithering question (docs/laporan/ekspor/). They go to
// banding.json in the test output folder and are attached to the HTML report.

const palettes = {
	'appendix-b': { palette: ['e07a5f', '3d405b', '81b29a'], background: 'f4efe6' },
	'low-chroma': { palette: ['5d6b78', '465360', '2f3a45'], background: 'auto' }
};
const variants: Variant[] = ['light', 'dark'];

test('banding of gradient PNGs', async ({ page, browserName }, testInfo) => {
	test.setTimeout(300_000);
	await openHarness(page);
	const rows = [];
	for (const preset of ['desk-5k', 'ios-63']) {
		const size = allPresets[preset];
		for (const spread of [0.5, 1]) {
			for (const [paletteName, colors] of Object.entries(palettes)) {
				for (const variant of variants) {
					const c = {
						pattern: 'gradient',
						size,
						variant,
						params: { type: 'linear', angle: 90, spread },
						...colors
					};
					const result = await page.evaluate((c) => window.harness.png(c), c);
					expect(result).toMatchObject({ ok: true, width: size.width, height: size.height });
					if (result.ok) {
						const banding = await page.evaluate((id) => window.harness.banding(id), result.id);
						rows.push({
							preset,
							spread,
							palette: paletteName,
							variant,
							path: result.path,
							...banding
						});
					}
				}
			}
		}
	}
	const body = JSON.stringify({ browser: browserName, rows }, null, 2);
	await writeFile(testInfo.outputPath('banding.json'), body);
	await testInfo.attach('banding.json', { body, contentType: 'application/json' });
});
