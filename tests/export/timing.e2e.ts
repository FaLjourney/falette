import { writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import type { Params, Size } from '../../src/lib/engine/types';
import { representativePresets } from '../fixtures/presets';
import { median, openHarness, patternIds } from './harness';

// Measures export times on each path and records them for the report; there is no time limit
// (decision 8a in docs/laporan/ekspor/1-rencana-ekspor.md). Results go to timing-<pattern>.json
// in the test output folder and are attached to the HTML report.

const runs = 5;

interface TimingCase {
	label: string;
	size: Size;
	params?: Params;
}

const casesFor = (pattern: string): TimingCase[] => [
	...Object.entries(representativePresets).map(([label, size]) => ({ label, size })),
	...(pattern === 'waves'
		? [
				{
					label: 'desk-5k, max params',
					size: representativePresets['desk-5k'],
					params: { layers: 12, amplitude: 1, frequency: 6 }
				},
				{ label: 'Custom 7680 × 7680', size: { width: 7680, height: 7680 } }
			]
		: [])
];

async function measure(page: Page, pattern: string, { label, size, params }: TimingCase) {
	const results = [];
	for (let run = 0; run < runs; run++) {
		const result = await page.evaluate((c) => window.harness.png(c), { pattern, size, params });
		expect(result).toMatchObject({ ok: true, width: size.width, height: size.height });
		if (result.ok) {
			results.push(result);
		}
	}
	const longTasks = results.flatMap((result) =>
		result.maxLongTask === null ? [] : [result.maxLongTask]
	);
	return {
		pattern,
		label,
		size: `${size.width}x${size.height}`,
		path: results[0].path,
		load: median(results.map((result) => result.load)),
		raster: median(results.map((result) => result.raster)),
		encode: median(results.map((result) => result.encode)),
		total: median(results.map((result) => result.total)),
		maxFrameGap: Math.max(...results.map((result) => result.maxFrameGap)),
		maxLongTask: longTasks.length === 0 ? null : Math.max(...longTasks),
		bytes: results[0].bytes
	};
}

for (const pattern of patternIds) {
	test(`export times: ${pattern}`, async ({ page, context, browserName }, testInfo) => {
		test.setTimeout(300_000);
		const mainOnly = await context.newPage();
		await mainOnly.addInitScript(() =>
			Object.defineProperty(window, 'Worker', { value: undefined })
		);
		await openHarness(page);
		await openHarness(mainOnly);
		const rows = [];
		for (const timingCase of casesFor(pattern)) {
			const worker = await measure(page, pattern, timingCase);
			if (browserName === 'chromium') {
				expect(worker.path).toBe('worker');
			}
			const main = await measure(mainOnly, pattern, timingCase);
			expect(main.path).toBe('main');
			rows.push(worker, main);
		}
		const body = JSON.stringify({ browser: browserName, runs, rows }, null, 2);
		await writeFile(testInfo.outputPath(`timing-${pattern}.json`), body);
		await testInfo.attach(`timing-${pattern}.json`, { body, contentType: 'application/json' });
	});
}
