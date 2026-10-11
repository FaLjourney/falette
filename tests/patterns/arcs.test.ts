import { describe, expect, it } from 'vitest';
import { resolveColors } from '../../src/lib/engine/palette';
import { createRng } from '../../src/lib/engine/prng';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import type { Params, RenderConfig, Size } from '../../src/lib/engine/types';
import arcs, { layout, type Disc } from '../../src/lib/patterns/arcs';
import { representativePresets } from '../fixtures/presets';

const defaults: Params = Object.fromEntries(
	Object.entries(arcs.params).map(([key, def]) => [key, def.default])
);
const phone = representativePresets['and-fhd20'];
const presets = Object.values(representativePresets);
/** Appendix A phones, from the tallest (20:9) to the widest. */
const phones: Size[] = [
	{ width: 1080, height: 2400 },
	{ width: 1080, height: 2340 },
	{ width: 1206, height: 2622 },
	{ width: 1320, height: 2868 },
	{ width: 1440, height: 3120 }
];
/** Landscape screens from a tablet on its side (4:3) to a dual-monitor span (32:9). */
const landscapes: Size[] = [
	{ width: 2752, height: 2064 },
	{ width: 2560, height: 1600 },
	{ width: 2560, height: 1664 },
	{ width: 3456, height: 2234 },
	{ width: 1920, height: 1080 },
	{ width: 5120, height: 2880 },
	{ width: 3440, height: 1440 },
	{ width: 3840, height: 1080 }
];
/** Custom sizes at the DEV-04 limits, plus a square. */
const customs: Size[] = [
	{ width: 320, height: 7680 },
	{ width: 7680, height: 320 },
	{ width: 1000, height: 1000 }
];
const sizes = [...presets, ...phones, ...landscapes, ...customs];
const extremes: Params[] = [
	{},
	{ layers: 3 },
	{ layers: 12 },
	{ curve: 0 },
	{ curve: 1 },
	{ focus: 0 },
	{ focus: 1 },
	{ layers: 12, curve: 0, focus: 0 },
	{ layers: 12, curve: 1, focus: 1 },
	{ layers: 3, curve: 0, focus: 1 }
];
const seeds = (count: number) => Array.from({ length: count }, (_, i) => String(i + 1));

function config(overrides: Partial<RenderConfig> = {}): RenderConfig {
	return {
		version: ENGINE_VERSION,
		pattern: 'arcs',
		seed: '42',
		palette: ['e07a5f', '3d405b', '81b29a'],
		background: 'f4efe6',
		size: phone,
		params: {},
		variant: 'light',
		...overrides
	};
}

function discs(size: Size, seed: string, params: Params = {}): Disc[] {
	return layout(size.width, size.height, { ...defaults, ...params }, createRng(seed));
}

/** Apex height above the bottom edge and half-width at the bottom edge of the outer arc. */
function outline(size: Size, all: Disc[]): { apex: number; half: number } {
	const { cy, r } = all[0];
	const depth = cy - size.height;
	return { apex: r - depth, half: Math.sqrt((r - depth) * (r + depth)) };
}

const mask = (svg: string) => svg.replace(/#[0-9a-f]{6}/g, '#');
const fills = (svg: string) =>
	[...svg.matchAll(/<path d="[^"]*" fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);

/** Endpoints and radii of every path command. */
function pathGeometry(svg: string): { points: [number, number][]; radii: [number, number][] } {
	const points: [number, number][] = [];
	const radii: [number, number][] = [];
	for (const [, d] of svg.matchAll(/ d="([^"]*)"/g)) {
		const tokens = d.match(/[MLAZ]|\d+(?:\.\d+)?/g) ?? [];
		let i = 0;
		const next = () => Number(tokens[i++]);
		while (i < tokens.length) {
			const command = tokens[i++];
			if (command === 'A') {
				radii.push([next(), next()]);
				i += 3;
			}
			if (command !== 'Z') points.push([next(), next()]);
		}
	}
	return { points, radii };
}

describe('arcs: module (PAT-02, PAT-09, ENG-03)', () => {
	it('matches its catalog row', () => {
		expect(arcs.id).toBe('arcs');
		expect(arcs.name).toBe('Arcs');
		expect(arcs.category).toBe('landscape');
		expect(arcs.params).toEqual({
			layers: { type: 'number', min: 3, max: 12, step: 1, default: 5 },
			curve: { type: 'number', min: 0, max: 1, step: 0.05, default: 0.6 },
			focus: { type: 'number', min: 0, max: 1, step: 0.05, default: 0.5 }
		});
	});

	it('asks for one color per layer (ENG-11)', () => {
		for (let layers = 3; layers <= 12; layers++) {
			expect(arcs.colorCount({ ...defaults, layers })).toBe(layers);
		}
	});
});

describe('arcs: colors (ENG-11, COL-05)', () => {
	const palettes = [
		['2a78d6'],
		['e07a5f', '3d405b', '81b29a'],
		['e07a5f', '3d405b', '81b29a', 'f2cc8f', '6d597a']
	];

	it.each(palettes.map((palette) => ({ palette })))(
		'paints the resolved colors in order, outermost first: $palette',
		({ palette }) => {
			for (const variant of ['light', 'dark'] as const) {
				for (const layers of [3, 5, 12]) {
					const { background, colors } = resolveColors(palette, 'f4efe6', variant, layers);
					const svg = render(config({ palette, variant, params: { layers } }), arcs);
					const all = discs(phone, '42', { layers });
					expect(all.filter((d) => d.band >= 0).map((d) => d.band)).toEqual(
						Array.from({ length: layers }, (_, i) => i)
					);
					expect(fills(svg)).toEqual(all.map((d) => (d.band < 0 ? background : colors[d.band])));
					expect(svg).toContain(`<rect width="1080" height="2400" fill="${background}"/>`);
				}
			}
		}
	);
});

describe('arcs: one composition for both variants (MODE-01)', () => {
	it('draws light and dark with identical geometry', () => {
		for (const seed of seeds(10)) {
			for (const size of presets) {
				for (const params of extremes) {
					const light = render(config({ seed, size, params, variant: 'light' }), arcs);
					const dark = render(config({ seed, size, params, variant: 'dark' }), arcs);
					expect(mask(dark)).toBe(mask(light));
				}
			}
		}
	});

	it('keeps the geometry when the palette or background changes', () => {
		for (const seed of seeds(10)) {
			const reference = mask(render(config({ seed }), arcs));
			for (const palette of [['2a78d6'], ['e07a5f', '3d405b', '81b29a', 'f2cc8f', '6d597a']]) {
				for (const background of ['auto', '2a78d6']) {
					expect(mask(render(config({ seed, palette, background }), arcs))).toBe(reference);
				}
			}
		}
	});
});

describe('arcs: randomness (ENG-02)', () => {
	it('draws exactly five numbers from the seeded PRNG for any params', () => {
		for (const overrides of extremes) {
			const params = { ...defaults, ...overrides };
			const source = createRng('42');
			let calls = 0;
			const rng = () => {
				calls++;
				return source();
			};
			const colors = Array.from({ length: arcs.colorCount(params) }, () => '#ffffff');
			arcs.generate({ width: 1080, height: 2400, params, rng, background: '#000000', colors });
			expect(calls).toBe(5);
		}
	});
});

describe('arcs: SVG output (ENG-01, ENG-06, EXP-02)', () => {
	it('writes one rect and paths with presentation attributes only', () => {
		for (const size of presets) {
			for (const params of extremes) {
				const svg = render(config({ size, params }), arcs);
				const body = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
				const tags = [...body.matchAll(/<(\w+)/g)].map((m) => m[1]);
				expect(tags[0]).toBe('rect');
				expect(new Set(tags.slice(1))).toEqual(new Set(['path']));
				const attrs = new Set([...body.matchAll(/\s([a-zA-Z-]+)="/g)].map((m) => m[1]));
				expect([...attrs].sort()).toEqual(['d', 'fill', 'height', 'width']);
			}
		}
	});

	it('writes numbers with at most 2 decimals and nothing negative', () => {
		for (const size of sizes) {
			for (const params of extremes) {
				const svg = render(config({ seed: '7', size, params }), arcs);
				expect(svg).not.toMatch(/\d\.\d{3}/);
				expect(svg).not.toMatch(/-\d/);
			}
		}
	});

	it('draws nothing outside the canvas', () => {
		const outside: string[] = [];
		for (const seed of seeds(20)) {
			for (const size of sizes) {
				for (const params of extremes) {
					const where = `seed ${seed} ${size.width}x${size.height} ${JSON.stringify(params)}`;
					const { points } = pathGeometry(render(config({ seed, size, params }), arcs));
					for (const [x, y] of points) {
						if (x < 0 || x > size.width || y < 0 || y > size.height) {
							outside.push(`${where}: point ${x},${y}`);
						}
					}
					for (const { cy, r } of discs(size, seed, params)) {
						if (cy - r < 0) outside.push(`${where}: disc top ${cy - r}`);
					}
				}
			}
		}
		expect(outside).toEqual([]);
	});
});

describe('arcs: proportions (ENG-04, DEV-05)', () => {
	it('draws circular arcs, never ellipses', () => {
		for (const size of sizes) {
			for (const params of extremes) {
				const { radii } = pathGeometry(render(config({ size, params }), arcs));
				expect(radii.length).toBeGreaterThan(0);
				for (const [rx, ry] of radii) expect(rx).toBe(ry);
			}
		}
	});

	it('scales with the canvas: twice the size gives exactly twice the geometry', () => {
		for (const seed of seeds(10)) {
			for (const size of [...presets, ...customs]) {
				for (const params of extremes) {
					const double = { width: size.width * 2, height: size.height * 2 };
					const doubled = discs(size, seed, params).map((d) => ({
						cx: d.cx * 2,
						cy: d.cy * 2,
						r: d.r * 2,
						band: d.band
					}));
					expect(discs(double, seed, params)).toEqual(doubled);
				}
			}
		}
	});

	it('keeps the top half of phones free for the lock-screen clock', () => {
		for (const size of phones) {
			for (const seed of seeds(300)) {
				for (const curve of [0, 0.6, 1]) {
					expect(outline(size, discs(size, seed, { curve })).apex).toBeLessThanOrEqual(
						size.height / 2
					);
				}
			}
		}
	});

	it('fits landscape screens with at least 8% of the width free at each side', () => {
		for (const size of landscapes) {
			for (const seed of seeds(1000)) {
				const { half } = outline(size, discs(size, seed));
				expect(size.width / 2 - half).toBeGreaterThanOrEqual(0.08 * size.width);
			}
		}
	});

	it('leaves sky above every arch', () => {
		for (const size of sizes) {
			for (const seed of seeds(300)) {
				expect(outline(size, discs(size, seed, { curve: 1 })).apex).toBeLessThanOrEqual(
					0.8 * size.height
				);
			}
		}
	});

	it('gives screens taller than 9:20 more sky instead of flat stripes', () => {
		const tall = { width: 320, height: 7680 };
		for (const seed of seeds(300)) {
			const { apex, half } = outline(tall, discs(tall, seed));
			expect(half).toBeLessThanOrEqual(1.3 * tall.width);
			expect(apex).toBeLessThanOrEqual(0.1 * tall.height);
		}
	});
});

describe('arcs: parameters', () => {
	it('layers only subdivides the arch', () => {
		for (const seed of seeds(20)) {
			for (const size of presets) {
				for (const curve of [0, 0.6, 1]) {
					const base = discs(size, seed, { layers: 3, curve });
					for (let layers = 4; layers <= 12; layers++) {
						const all = discs(size, seed, { layers, curve });
						expect(all[0]).toEqual(base[0]);
						expect(all.at(-1)?.band === -1).toBe(base.at(-1)?.band === -1);
						expect(all.filter((d) => d.band >= 0)).toHaveLength(layers);
					}
				}
			}
		}
	});

	it('curve raises and narrows the arch monotonically, up to a semicircle', () => {
		for (const seed of seeds(20)) {
			for (const size of presets) {
				let previous = outline(size, discs(size, seed, { curve: 0 }));
				for (let step = 1; step <= 20; step++) {
					const current = outline(size, discs(size, seed, { curve: step / 20 }));
					expect(current.apex).toBeGreaterThanOrEqual(previous.apex);
					expect(current.half).toBeLessThanOrEqual(previous.half);
					previous = current;
				}
				const top = discs(size, seed, { curve: 1 })[0];
				expect(top.cy).toBe(size.height);
			}
		}
	});

	it('focus places the outer arc and leaves its size alone', () => {
		for (const seed of seeds(20)) {
			for (const size of presets) {
				const reference = discs(size, seed, { focus: 0 })[0];
				for (const focus of [0, 0.25, 0.5, 0.75, 1]) {
					const first = discs(size, seed, { focus })[0];
					expect(first.cx).toBe(size.width * focus);
					expect(first.r).toBe(reference.r);
					expect(first.cy).toBe(reference.cy);
				}
			}
		}
	});

	it('keeps every stripe readable at 12 layers', () => {
		const thin: string[] = [];
		for (const size of sizes) {
			const floor = 0.002 * Math.min(size.width, size.height);
			for (const seed of seeds(300)) {
				for (const curve of [0, 0.3, 0.6, 1]) {
					const all = discs(size, seed, { layers: 12, curve });
					for (let i = 1; i < all.length; i++) {
						const thinnest = all[i - 1].r - all[i].r - Math.abs(all[i - 1].cx - all[i].cx);
						if (thinnest < floor) {
							thin.push(`seed ${seed} ${size.width}x${size.height} curve ${curve}: ${thinnest}`);
						}
					}
				}
			}
		}
		expect(thin).toEqual([]);
	});
});

describe('arcs: seed variation (PAT-04, PAT-10)', () => {
	/** Band index of the last disc covering each cell of a 40-column grid; -1 is background. */
	function grid(size: Size, all: Disc[]): Int8Array {
		const cols = 40;
		const rows = Math.round((cols * size.height) / size.width);
		const cells = new Int8Array(cols * rows).fill(-1);
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				const px = ((x + 0.5) * size.width) / cols;
				const py = ((y + 0.5) * size.height) / rows;
				for (const d of all) {
					if ((px - d.cx) ** 2 + (py - d.cy) ** 2 <= d.r * d.r) cells[y * cols + x] = d.band;
				}
			}
		}
		return cells;
	}

	it.each(Object.entries(representativePresets))(
		'gives clearly different compositions for different seeds on %s',
		(_, size) => {
			const grids = seeds(30).map((seed) => grid(size, discs(size, seed)));
			const distances: number[] = [];
			for (let i = 0; i < grids.length; i++) {
				for (let j = i + 1; j < grids.length; j++) {
					let differ = 0;
					let painted = 0;
					for (let c = 0; c < grids[i].length; c++) {
						if (grids[i][c] !== -1 || grids[j][c] !== -1) painted++;
						if (grids[i][c] !== grids[j][c]) differ++;
					}
					distances.push(differ / painted);
				}
			}
			distances.sort((a, b) => a - b);
			expect(distances[Math.floor(distances.length / 2)]).toBeGreaterThanOrEqual(0.8);
			expect(distances[0]).toBeGreaterThanOrEqual(0.1);
			expect(distances.filter((d) => d < 0.3).length).toBeLessThanOrEqual(0.02 * distances.length);
		}
	);

	it.each(Object.entries(representativePresets))(
		'moves every seed axis both ways on %s',
		(_, size) => {
			const traits = seeds(30).map((seed) => {
				const all = discs(size, seed);
				const bands = all.filter((d) => d.band >= 0);
				const n = bands.length;
				return {
					apex: outline(size, all).apex,
					opening: all[all.length - 1].band === -1,
					gaps: all.slice(0, -1).some((d) => d.band === -1),
					lean: all[all.length - 1].cx - all[0].cx,
					taper: bands[0].r - bands[1].r - (bands[n - 2].r - bands[n - 1].r)
				};
			});
			const apexes = traits.map((t) => t.apex);
			expect(Math.max(...apexes) / Math.min(...apexes)).toBeGreaterThanOrEqual(2);
			expect(new Set(traits.map((t) => t.opening))).toEqual(new Set([true, false]));
			expect(new Set(traits.map((t) => t.gaps))).toEqual(new Set([true, false]));
			expect(traits.some((t) => t.lean > 0) && traits.some((t) => t.lean < 0)).toBe(true);
			expect(traits.some((t) => t.taper > 0) && traits.some((t) => t.taper < 0)).toBe(true);
		}
	);
});

describe('arcs: render time (ENG-07)', () => {
	it('renders desk-5k at maximum params well within 50 ms', () => {
		const max = config({
			size: representativePresets['desk-5k'],
			params: { layers: 12, curve: 1, focus: 1 }
		});
		const times = Array.from({ length: 21 }, () => {
			const start = performance.now();
			render(max, arcs);
			return performance.now() - start;
		}).sort((a, b) => a - b);
		expect(times[10]).toBeLessThan(50);
	});
});
