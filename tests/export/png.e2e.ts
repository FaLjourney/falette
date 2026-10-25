import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PNG_MARKS } from '../../src/lib/export/png';
import { allPresets } from '../fixtures/presets';
import { openHarness, patternIds } from './harness';

const customSizes = [
	{ width: 320, height: 320 },
	{ width: 7680, height: 320 },
	{ width: 320, height: 7680 },
	{ width: 7680, height: 7680 }
];

test.describe('EXP-01: PNG at the exact size', () => {
	// Every preset with one pattern each, taking the four patterns in turn.
	const sizes = [
		...Object.entries(allPresets),
		...customSizes.map((size) => ['Custom', size] as const)
	];
	for (const [index, [label, size]] of sizes.entries()) {
		const pattern = patternIds[index % patternIds.length];
		test(`${label} ${size.width} × ${size.height} (${pattern})`, async ({ page }) => {
			await openHarness(page);
			const result = await page.evaluate((c) => window.harness.png(c), { pattern, size });
			expect(result).toMatchObject({
				ok: true,
				width: size.width,
				height: size.height,
				opaque: true
			});
			expect(result.ok && result.colors).toBeGreaterThan(1);
		});
	}
});

test('EXP-04: light and dark export separately, at the same size', async ({ page }) => {
	await openHarness(page);
	const size = allPresets['ios-63'];
	for (const pattern of patternIds) {
		const [light, dark] = await page.evaluate(
			async ({ pattern, size }) => [
				await window.harness.png({ pattern, size, variant: 'light' }),
				await window.harness.png({ pattern, size, variant: 'dark' })
			],
			{ pattern, size }
		);
		for (const result of [light, dark]) {
			expect(result).toMatchObject({ ok: true, width: size.width, height: size.height });
		}
		expect(light.ok && dark.ok && light.thumbnailHash !== dark.thumbnailHash).toBe(true);
	}
});

test('EXP-05: downloads are named falette-{pattern}-{mode}-{width}x{height}-{seed}', async ({
	page
}) => {
	await openHarness(page);
	const phone = { pattern: 'arcs', size: allPresets['ios-63'] };
	const [png] = await Promise.all([
		page.waitForEvent('download'),
		page.evaluate((c) => window.harness.download(c, 'png'), phone)
	]);
	expect(png.suggestedFilename()).toBe('falette-arcs-light-1206x2622-42.png');
	const pngBytes = await readFile(await png.path());
	expect([pngBytes.readUInt32BE(16), pngBytes.readUInt32BE(20)]).toEqual([1206, 2622]);

	const odd = {
		pattern: 'hills',
		size: allPresets['mba-13'],
		variant: 'dark',
		seed: 'a/b:c'
	} as const;
	const [svg] = await Promise.all([
		page.waitForEvent('download'),
		page.evaluate((c) => window.harness.download(c, 'svg'), odd)
	]);
	expect(svg.suggestedFilename()).toBe('falette-hills-dark-2560x1664-a-b-c.svg');
	expect(await readFile(await svg.path(), 'utf8')).toBe(
		await page.evaluate((c) => window.harness.svg(c), odd)
	);

	const large = { pattern: 'waves', size: { width: 7680, height: 7680 } };
	const smaller = { width: 4096, height: 4096 };
	const [scaled] = await Promise.all([
		page.waitForEvent('download'),
		page.evaluate(({ c, size }) => window.harness.download(c, 'png', size), {
			c: large,
			size: smaller
		})
	]);
	expect(scaled.suggestedFilename()).toBe('falette-waves-light-4096x4096-42.png');
	const scaledBytes = await readFile(await scaled.path());
	expect([scaledBytes.readUInt32BE(16), scaledBytes.readUInt32BE(20)]).toEqual([4096, 4096]);
});

test.describe('EXP-06: PNG limit of the browser', () => {
	test('the probe accepts every DEV-04 size here and rejects one past every browser limit', async ({
		page
	}) => {
		await openHarness(page);
		const check = (size: { width: number; height: number }) =>
			page.evaluate((size) => window.harness.check(size), size);
		expect(await check(allPresets['desk-5k'])).toEqual({ ok: true });
		expect(await check({ width: 7680, height: 7680 })).toEqual({ ok: true });
		expect(await check({ width: 32000, height: 32000 })).toEqual({
			ok: false,
			smaller: { width: 4096, height: 4096 }
		});
	});

	test('with the Safari iOS limit, large Custom sizes offer and export a smaller PNG', async ({
		page
	}) => {
		await openHarness(page);
		await page.evaluate(() => window.harness.limitCanvas(4096 * 4096));
		const check = (size: { width: number; height: number }) =>
			page.evaluate((size) => window.harness.check(size), size);
		expect(await check(allPresets['desk-5k'])).toEqual({ ok: true });
		for (const [size, smaller] of [
			[
				{ width: 7680, height: 7680 },
				{ width: 4096, height: 4096 }
			],
			[
				{ width: 7680, height: 4320 },
				{ width: 5461, height: 3072 }
			]
		]) {
			expect(await check(size)).toEqual({ ok: false, smaller });
			const result = await page.evaluate(
				({ size, smaller }) => window.harness.png({ pattern: 'waves', size }, smaller),
				{ size, smaller }
			);
			expect(result).toMatchObject({ ok: true, ...smaller, opaque: true });
		}
	});
});

test.describe('EXP-07: export without freezing the page', () => {
	const desk5k = { pattern: 'waves', size: allPresets['desk-5k'] };

	test('encodes in the worker where the browser can, and in Chromium always', async ({
		page,
		browserName
	}) => {
		await openHarness(page);
		const result = await page.evaluate((c) => window.harness.png(c), desk5k);
		expect(result).toMatchObject({ ok: true, width: 5120, height: 2880 });
		const path = result.ok ? result.path : undefined;
		expect(['worker', 'main']).toContain(path);
		if (browserName === 'chromium') {
			expect(path).toBe('worker');
		}
	});

	test('lets the page paint before the heavy work starts', async ({ page }) => {
		await openHarness(page);
		const { painted, started, loaded } = await page.evaluate(
			async ({ c, mark }) => {
				performance.clearMarks();
				// The export starts by turning the SVG into a blob URL; note when it first does.
				let started = Infinity;
				const createObjectURL = URL.createObjectURL;
				URL.createObjectURL = (blob) => {
					started = Math.min(started, performance.now());
					return createObjectURL(blob);
				};
				let painted = Infinity;
				requestAnimationFrame(() => {
					painted = performance.now();
				});
				await window.harness.exportPng(c);
				URL.createObjectURL = createObjectURL;
				return { painted, started, loaded: performance.getEntriesByName(mark)[0].startTime };
			},
			{ c: desk5k, mark: PNG_MARKS.loaded }
		);
		expect(painted).toBeLessThan(started);
		expect(started).toBeLessThan(loaded);
	});

	test('falls back to the main thread without Worker', async ({ page }) => {
		await page.addInitScript(() => Object.defineProperty(window, 'Worker', { value: undefined }));
		await openHarness(page);
		const result = await page.evaluate((c) => window.harness.png(c), desk5k);
		expect(result).toMatchObject({
			ok: true,
			width: 5120,
			height: 2880,
			path: 'main',
			opaque: true
		});
	});

	test('falls back to the main thread when createImageBitmap rejects SVG', async ({ page }) => {
		await page.addInitScript(() => {
			const original = window.createImageBitmap;
			window.createImageBitmap = ((source: ImageBitmapSource, ...rest: [ImageBitmapOptions?]) =>
				source instanceof HTMLImageElement
					? Promise.reject(new DOMException('SVG is not supported', 'InvalidStateError'))
					: original(source, ...rest)) as typeof createImageBitmap;
		});
		await openHarness(page);
		const result = await page.evaluate((c) => window.harness.png(c), desk5k);
		expect(result).toMatchObject({
			ok: true,
			width: 5120,
			height: 2880,
			path: 'main',
			opaque: true
		});
	});

	test('fails with a PngExportError when the browser cannot encode', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(window, 'Worker', { value: undefined });
			HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
				callback(null);
			};
		});
		await openHarness(page);
		const result = await page.evaluate((c) => window.harness.png(c), desk5k);
		expect(result).toMatchObject({ ok: false, error: 'PngExportError' });
	});

	test('fails with a PngExportError when the canvas stays empty', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(window, 'Worker', { value: undefined });
			CanvasRenderingContext2D.prototype.drawImage = () => {};
		});
		await openHarness(page);
		const result = await page.evaluate((c) => window.harness.png(c), desk5k);
		expect(result).toMatchObject({
			ok: false,
			error: 'PngExportError',
			message: 'The canvas of 5120 × 2880 px stayed empty'
		});
	});

	test('fails with a PngExportError past every browser limit', async ({ page }) => {
		await openHarness(page);
		const result = await page.evaluate((size) => window.harness.png({ pattern: 'arcs', size }), {
			width: 32000,
			height: 32000
		});
		expect(result).toMatchObject({ ok: false, error: 'PngExportError' });
	});
});
