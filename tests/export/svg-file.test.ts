import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import type { PatternModule, Variant } from '../../src/lib/engine/types';
import arcs from '../../src/lib/patterns/arcs';
import gradient from '../../src/lib/patterns/gradient';
import hills from '../../src/lib/patterns/hills';
import waves from '../../src/lib/patterns/waves';
import { SVG_TYPE, svgFile } from '../../src/lib/export/svg-file';
import { allPresets } from '../fixtures/presets';

const patterns: PatternModule[] = [arcs, hills, waves, gradient];
const variants: Variant[] = ['light', 'dark'];
const sizes = [
	...Object.values(allPresets),
	{ width: 320, height: 320 },
	{ width: 7680, height: 320 },
	{ width: 320, height: 7680 },
	{ width: 7680, height: 7680 }
];

describe('svgFile (EXP-02)', () => {
	it('holds the render() string exactly, as an SVG file', async () => {
		const svg = render(
			{
				version: ENGINE_VERSION,
				pattern: 'waves',
				seed: '42',
				palette: ['e07a5f', '3d405b', '81b29a'],
				background: 'f4efe6',
				size: { width: 1206, height: 2622 },
				params: {},
				variant: 'dark'
			},
			waves
		);
		const file = svgFile(svg);
		expect(file.type).toBe(SVG_TYPE);
		expect(await file.text()).toBe(svg);
	});

	it('is self-contained with the exact size, for every pattern, preset, Custom extreme and variant', async () => {
		for (const pattern of patterns) {
			for (const size of sizes) {
				for (const variant of variants) {
					const svg = await svgFile(
						render(
							{
								version: ENGINE_VERSION,
								pattern: pattern.id,
								seed: '42',
								palette: ['e07a5f', '3d405b', '81b29a'],
								background: 'auto',
								size,
								params: {},
								variant
							},
							pattern
						)
					).text();
					const root = svg.slice(0, svg.indexOf('>') + 1);
					expect(root).toBe(
						`<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">`
					);
					// No fonts, images, scripts or links to anything outside the file.
					expect(svg).not.toMatch(/<(image|text|font|script|style|foreignObject|use)\b/);
					expect(svg).not.toMatch(/\b(href|xlink:href|font-family|src)=/);
					expect(svg).not.toMatch(/@import|url\((?!#)/);
					expect(svg).not.toMatch(/\d\.\d{3}/);
				}
			}
		}
	});
});
