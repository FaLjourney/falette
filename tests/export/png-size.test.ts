import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import arcs from '../../src/lib/patterns/arcs';
import { rasterSource, SAFE_PNG_AREA, smallerPngSize } from '../../src/lib/export/png-size';
import { allPresets } from '../fixtures/presets';

describe('smallerPngSize (EXP-06)', () => {
	it('fits the Safari iOS canvas limit of 4096 × 4096 px', () => {
		expect(SAFE_PNG_AREA).toBe(16_777_216);
	});

	it('leaves every Appendix A preset at its own size', () => {
		for (const size of Object.values(allPresets)) {
			expect(size.width * size.height).toBeLessThanOrEqual(SAFE_PNG_AREA);
			expect(smallerPngSize(size)).toEqual(size);
		}
	});

	it('scales the largest Custom sizes to the largest size that fits', () => {
		expect(smallerPngSize({ width: 7680, height: 7680 })).toEqual({ width: 4096, height: 4096 });
		expect(smallerPngSize({ width: 7680, height: 4320 })).toEqual({ width: 5461, height: 3072 });
		expect(smallerPngSize({ width: 4320, height: 7680 })).toEqual({ width: 3072, height: 5461 });
	});

	it('keeps each side within 1 px of the exact scaled size, and the area within the limit', () => {
		const sides = [320, 1000, 2185, 4096, 4097, 5000, 6143, 7000, 7680];
		for (const width of sides) {
			for (const height of sides) {
				const smaller = smallerPngSize({ width, height });
				expect(smaller.width * smaller.height).toBeLessThanOrEqual(SAFE_PNG_AREA);
				expect(smaller.width).toBeLessThanOrEqual(width);
				expect(smaller.height).toBeLessThanOrEqual(height);
				expect(Number.isInteger(smaller.width) && Number.isInteger(smaller.height)).toBe(true);
				if (width * height > SAFE_PNG_AREA) {
					const scale = Math.sqrt(SAFE_PNG_AREA / (width * height));
					expect(Math.abs(smaller.width - width * scale)).toBeLessThan(1);
					expect(Math.abs(smaller.height - height * scale)).toBeLessThan(1);
				}
			}
		}
	});

	it('takes a lower limit when asked', () => {
		expect(smallerPngSize({ width: 2000, height: 1000 }, 500_000)).toEqual({
			width: 1000,
			height: 500
		});
	});
});

describe('rasterSource (EXP-01, EXP-06)', () => {
	const svg = render(
		{
			version: ENGINE_VERSION,
			pattern: 'arcs',
			seed: '42',
			palette: ['e07a5f', '3d405b', '81b29a'],
			background: 'f4efe6',
			size: { width: 7680, height: 4320 },
			params: {},
			variant: 'light'
		},
		arcs
	);

	it('leaves the SVG unchanged at its own size', () => {
		expect(rasterSource(svg, { width: 7680, height: 4320 })).toBe(svg);
	});

	it('changes only the root width and height, keeping the viewBox and every element', () => {
		const scaled = rasterSource(svg, { width: 5461, height: 3072 });
		const root = scaled.slice(0, scaled.indexOf('>') + 1);
		expect(root).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="5461" height="3072" viewBox="0 0 7680 4320" preserveAspectRatio="none">'
		);
		expect(scaled.slice(root.length)).toBe(svg.slice(svg.indexOf('>') + 1));
	});

	it('rejects strings that are not engine SVG', () => {
		expect(() => rasterSource('<rect/>', { width: 1, height: 1 })).toThrow();
		expect(() => rasterSource('<svg viewBox="0 0 1 1"></svg>', { width: 1, height: 1 })).toThrow();
	});
});
