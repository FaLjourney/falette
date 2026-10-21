import { describe, expect, it } from 'vitest';
import { resolveColors } from '../../src/lib/engine/palette';
import { createRng } from '../../src/lib/engine/prng';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import type { Params, RenderConfig, Size } from '../../src/lib/engine/types';
import hills, { curve, layout, type Ridge, type Segment } from '../../src/lib/patterns/hills';
import { portraitPresets, representativePresets } from '../fixtures/presets';

const defaults: Params = Object.fromEntries(
	Object.entries(hills.params).map(([key, def]) => [key, def.default])
);
const phone = representativePresets['and-fhd20'];
const presets = Object.values(representativePresets);
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
const sizes = [...presets, ...landscapes, ...customs];
/** Custom portrait sizes: the DEV-04 limits, a 21:9 phone and screens just taller than wide. */
const portraitCustoms: Size[] = [
	{ width: 320, height: 7680 },
	{ width: 1644, height: 3840 },
	{ width: 320, height: 400 },
	{ width: 1000, height: 1001 },
	{ width: 7679, height: 7680 }
];
const extremes: Params[] = [
	{},
	{ layers: 3 },
	{ layers: 10 },
	{ height: 0 },
	{ height: 1 },
	{ softness: 0 },
	{ softness: 1 },
	{ layers: 10, height: 1, softness: 1 },
	{ layers: 3, height: 0, softness: 0 },
	{ layers: 10, height: 0, softness: 1 }
];
const steps = (key: string, count: number) =>
	Array.from({ length: count + 1 }, (_, i) => ({ [key]: i / count }));
const seeds = (count: number) => Array.from({ length: count }, (_, i) => String(i + 1));
/** Every seed the floor tests use, and every snapshot seed ('299' is among the first 300). */
const testSeeds = [...seeds(300), 'senja-teduh-42', '480'];
/**
 * Extreme params, every layer count, every height step and softness in tenths. Height sets the
 * margin above the floor; softness only bends segments cut at an edge, within their ends.
 */
const floorParams: Params[] = [
	...extremes,
	...Array.from({ length: 6 }, (_, i) => ({ layers: i + 4 })),
	...steps('height', 20),
	...steps('softness', 10)
];

function config(overrides: Partial<RenderConfig> = {}): RenderConfig {
	return {
		version: ENGINE_VERSION,
		pattern: 'hills',
		seed: '42',
		palette: ['e07a5f', '3d405b', '81b29a'],
		background: 'f4efe6',
		size: phone,
		params: {},
		variant: 'light',
		...overrides
	};
}

function ridges(size: Size, seed: string, params: Params = {}): Ridge[] {
	return layout(size.width, size.height, { ...defaults, ...params }, createRng(seed));
}

/** The drawn curve of every ridge, back first, at the given params. */
function curves(size: Size, seed: string, params: Params = {}): Segment[][] {
	const softness = Number({ ...defaults, ...params }.softness);
	return ridges(size, seed, params).map((r) => curve(r.points, size.width, softness));
}

/** The main peak: the highest point of a ridge. */
const mainPeak = (ridge: Ridge) => ridge.points.reduce((a, b) => (b.h > a.h ? b : a));

const mask = (svg: string) => svg.replace(/#[0-9a-f]{6}/g, '#');
const fills = (svg: string) =>
	[...svg.matchAll(/<path d="[^"]*" fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);

/** Height of the curve at x, by bisection on the segment that spans it. */
function heightAt(segments: Segment[], x: number): number {
	const segment = segments.find((s) => s[0].x <= x && x <= s[3].x);
	if (segment === undefined) throw new Error(`no segment at x ${x}`);
	const [p0, p1, p2, p3] = segment;
	const along = (t: number, key: 'x' | 'h') => {
		const u = 1 - t;
		return (
			u * u * u * p0[key] + 3 * u * u * t * p1[key] + 3 * u * t * t * p2[key] + t ** 3 * p3[key]
		);
	};
	let lo = 0;
	let hi = 1;
	for (let i = 0; i < 40; i++) {
		const t = (lo + hi) / 2;
		if (along(t, 'x') < x) lo = t;
		else hi = t;
	}
	return along((lo + hi) / 2, 'h');
}

/**
 * Points below `low` on the back ridge or above `high` on any ridge, as shares of the height.
 * Checks every start, control and end point: a Bézier curve lies within their heights.
 */
function outOfRange(
	size: Size,
	label: string,
	low: number,
	high: (size: Size) => number,
	runSeeds = testSeeds
) {
	const wrong: string[] = [];
	const floor = low * size.height;
	const top = high(size);
	for (const seed of runSeeds) {
		for (const params of floorParams) {
			let lowest = Infinity;
			let highest = -Infinity;
			curves(size, seed, params).forEach((segments, band) => {
				for (const segment of segments) {
					for (const { h } of segment) {
						if (band === 0) lowest = Math.min(lowest, h);
						highest = Math.max(highest, h);
					}
				}
			});
			if (lowest < floor || highest > top) {
				wrong.push(`${label} seed ${seed} ${JSON.stringify(params)}: ${lowest}, ${highest}`);
			}
		}
	}
	return wrong;
}

/** The highest point the hills may reach: half the longer side, at most 70% of the height. */
const cap = ({ width, height }: Size) => Math.min(0.7 * height, 0.5 * Math.max(width, height));

describe('hills: module (PAT-02, PAT-09, ENG-03)', () => {
	it('matches its catalog row', () => {
		expect(hills.id).toBe('hills');
		expect(hills.name).toBe('Hills');
		expect(hills.category).toBe('landscape');
		expect(hills.params).toEqual({
			layers: { type: 'number', min: 3, max: 10, step: 1, default: 5 },
			height: { type: 'number', min: 0, max: 1, step: 0.05, default: 0.5 },
			softness: { type: 'number', min: 0, max: 1, step: 0.05, default: 0.6 }
		});
	});

	it('asks for one color per layer (ENG-11)', () => {
		for (let layers = 3; layers <= 10; layers++) {
			expect(hills.colorCount({ ...defaults, layers })).toBe(layers);
		}
	});
});

describe('hills: colors (ENG-11, COL-05)', () => {
	const palettes = [
		['2a78d6'],
		['e07a5f', '3d405b', '81b29a'],
		['e07a5f', '3d405b', '81b29a', 'f2cc8f', '6d597a']
	];

	it.each(palettes.map((palette) => ({ palette })))(
		'paints the resolved colors in order, back layer first: $palette',
		({ palette }) => {
			for (const variant of ['light', 'dark'] as const) {
				for (const layers of [3, 5, 10]) {
					const { background, colors } = resolveColors(palette, 'f4efe6', variant, layers);
					const svg = render(config({ palette, variant, params: { layers } }), hills);
					expect(ridges(phone, '42', { layers }).map((r) => r.band)).toEqual(
						Array.from({ length: layers }, (_, i) => i)
					);
					expect(fills(svg)).toEqual(colors);
					expect(svg).toContain(`<rect width="1080" height="2400" fill="${background}"/>`);
				}
			}
		}
	);
});

describe('hills: one composition for both variants (MODE-01)', () => {
	it('draws light and dark with identical geometry', () => {
		for (const seed of seeds(10)) {
			for (const size of presets) {
				for (const params of extremes) {
					const light = render(config({ seed, size, params, variant: 'light' }), hills);
					const dark = render(config({ seed, size, params, variant: 'dark' }), hills);
					expect(mask(dark)).toBe(mask(light));
				}
			}
		}
	});

	it('keeps the geometry when the palette or background changes', () => {
		for (const seed of seeds(10)) {
			const reference = mask(render(config({ seed }), hills));
			for (const palette of [['2a78d6'], ['e07a5f', '3d405b', '81b29a', 'f2cc8f', '6d597a']]) {
				for (const background of ['auto', '2a78d6']) {
					expect(mask(render(config({ seed, palette, background }), hills))).toBe(reference);
				}
			}
		}
	});
});

describe('hills: randomness (ENG-02)', () => {
	it('draws exactly 24 numbers from the seeded PRNG for any params and canvas', () => {
		const middles: Params[] = [{ layers: 4 }, { layers: 7, height: 0.35 }, { softness: 0.25 }];
		for (const seed of ['7', '42', '1234']) {
			for (const size of [phone, ...customs, { width: 320, height: 320 }]) {
				for (const overrides of [...extremes, ...middles]) {
					const params = { ...defaults, ...overrides };
					const source = createRng(seed);
					let calls = 0;
					const rng = () => {
						calls++;
						return source();
					};
					const colors = Array.from({ length: hills.colorCount(params) }, () => '#ffffff');
					hills.generate({ ...size, params, rng, background: '#000000', colors });
					expect(calls).toBe(24);
				}
			}
		}
	});
});

describe('hills: SVG output (ENG-01, ENG-06, EXP-02)', () => {
	it('writes one rect and paths with presentation attributes only', () => {
		for (const size of presets) {
			for (const params of extremes) {
				const svg = render(config({ size, params }), hills);
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
				const svg = render(config({ seed: '7', size, params }), hills);
				expect(svg).not.toMatch(/\d\.\d{3}/);
				expect(svg).not.toMatch(/-\d/);
			}
		}
	});

	it('closes each layer along the bottom edge and draws nothing outside the canvas', () => {
		const wrong: string[] = [];
		for (const seed of seeds(20)) {
			for (const size of [...sizes, ...portraitCustoms]) {
				for (const params of extremes) {
					const where = `seed ${seed} ${size.width}x${size.height} ${JSON.stringify(params)}`;
					const svg = render(config({ seed, size, params }), hills);
					for (const [, d] of svg.matchAll(/ d="([^"]*)"/g)) {
						const head = `M0 ${size.height}L0 `;
						const tail = `L${size.width} ${size.height}Z`;
						if (!d.startsWith(head) || !d.endsWith(tail)) wrong.push(`${where}: ${d}`);
						const values = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
						for (let i = 0; i < values.length; i += 2) {
							const [x, y] = [values[i], values[i + 1]];
							if (x < 0 || x > size.width || y < 0 || y > size.height) {
								wrong.push(`${where}: point ${x},${y}`);
							}
						}
					}
				}
			}
		}
		expect(wrong).toEqual([]);
	});
});

describe('hills: proportions (ENG-04, DEV-05)', () => {
	it('scales with the canvas: twice the size gives exactly twice the geometry', () => {
		const twice = (r: Ridge[]) =>
			r.map(({ band, points }) => ({
				band,
				points: points.map(({ x, h }) => ({ x: x * 2, h: h * 2 }))
			}));
		for (const seed of seeds(10)) {
			for (const size of [...presets, ...customs]) {
				for (const params of extremes) {
					const double = { width: size.width * 2, height: size.height * 2 };
					expect(ridges(double, seed, params)).toEqual(twice(ridges(size, seed, params)));
					const drawn = curves(size, seed, params).map((c) =>
						c.map((s) => s.map(({ x, h }) => ({ x: x * 2, h: h * 2 })))
					);
					expect(curves(double, seed, params)).toEqual(drawn);
				}
			}
		}
	});

	it('adds hills on wider screens instead of stretching them', () => {
		const narrow = { width: 2560, height: 1440 };
		const wide = { width: 5120, height: 1440 };
		/** Points from the main peak rightwards, as offsets from it. */
		const rightOf = (ridge: Ridge) => {
			const main = mainPeak(ridge);
			return ridge.points
				.slice(ridge.points.indexOf(main))
				.map(({ x, h }) => ({ x: x - main.x, h }));
		};
		for (const seed of seeds(20)) {
			const a = ridges(narrow, seed);
			const b = ridges(wide, seed);
			// Each ridge goes on to the right of its main peak with the same hills, then adds more.
			a.forEach((ridge, i) => {
				const shown = rightOf(ridge);
				const more = rightOf(b[i]);
				expect(more.length).toBeGreaterThanOrEqual(shown.length);
				shown.forEach(({ x, h }, j) => {
					expect(more[j].x).toBeCloseTo(x, 6);
					expect(more[j].h).toBe(h);
				});
			});
			const count = (all: Ridge[]) => all.reduce((sum, r) => sum + r.points.length, 0);
			expect(count(b)).toBeGreaterThan(count(a));
		}
	});

	it('covers the bottom 30% of every portrait preset with hills and keeps its top half free', () => {
		const wrong = Object.entries(portraitPresets).flatMap(([id, size]) =>
			outOfRange(size, id, 0.3, (s) => 0.5 * s.height)
		);
		expect(wrong).toEqual([]);
	});

	it('keeps the same floor and top on custom portrait sizes, 320x7680 included', () => {
		const wrong = portraitCustoms.flatMap((size) =>
			outOfRange(size, `${size.width}x${size.height}`, 0.3, (s) => 0.5 * s.height)
		);
		expect(wrong).toEqual([]);
	});

	it('keeps the floor on landscape and square canvases, below 70% of the height and half the longer side', () => {
		const wide = [...landscapes, ...customs].filter((size) => size.width >= size.height);
		const wrong = wide.flatMap((size) =>
			outOfRange(size, `${size.width}x${size.height}`, 0.3, cap, seeds(100))
		);
		expect(wrong).toEqual([]);
	});
});

describe('hills: parameters', () => {
	it('height raises the back main peak from 38% of the height to the top', () => {
		for (const size of [...sizes, ...portraitCustoms]) {
			for (const seed of seeds(10)) {
				expect(mainPeak(ridges(size, seed, { height: 0 })[0]).h).toBe(0.38 * size.height);
				expect(mainPeak(ridges(size, seed, { height: 1 })[0]).h).toBe(cap(size));
			}
		}
		expect(cap(phone) / phone.height).toBe(0.5);
		expect(cap(representativePresets['ipad-pro-13']) / 2752).toBe(0.5);
		expect(cap({ width: 2752, height: 2064 }) / 2064).toBeCloseTo(2 / 3, 10);
		for (const id of ['mba-13', 'desk-uw', 'desk-5k']) {
			expect(cap(representativePresets[id]) / representativePresets[id].height).toBe(0.7);
		}
	});

	it('height raises every point and moves nothing sideways', () => {
		for (const seed of seeds(20)) {
			for (const size of presets) {
				let previous = ridges(size, seed, { height: 0 });
				for (let step = 1; step <= 20; step++) {
					const current = ridges(size, seed, { height: step / 20 });
					current.forEach((ridge, i) => {
						ridge.points.forEach((point, j) => {
							expect(point.x).toBe(previous[i].points[j].x);
							expect(point.h).toBeGreaterThan(previous[i].points[j].h);
						});
					});
					previous = current;
				}
			}
		}
	});

	it('layers keeps the back and front ridges and only adds ridges between them', () => {
		for (const seed of seeds(20)) {
			for (const size of presets) {
				const base = ridges(size, seed, { layers: 3 });
				for (let layers = 4; layers <= 10; layers++) {
					const all = ridges(size, seed, { layers });
					expect(all).toHaveLength(layers);
					expect(all[0]).toEqual(base[0]);
					expect(all[layers - 1].points).toEqual(base[2].points);
				}
			}
		}
	});

	it('softness only bends the curve between the points, from straight flanks to level handles', () => {
		for (const seed of seeds(10)) {
			for (const size of [...presets, ...customs]) {
				const all = ridges(size, seed);
				for (const softness of [0, 0.3, 0.6, 1]) {
					for (const { points } of all) {
						const segments = curve(points, size.width, softness);
						const ends = [segments[0][0], ...segments.map((s) => s[3])];
						const inside = points.filter((p) => p.x > 0 && p.x < size.width);
						expect(ends.slice(1, -1)).toEqual(inside);
						for (const segment of segments) {
							const [start, c1, c2, end] = segment;
							// The two points this segment joins; one lies past the edge when it was cut there.
							const j = points.findIndex((p) => p.x >= end.x);
							const [a, b] = [points[j - 1], points[j]];
							const slack = 1e-9 * size.height;
							for (const { h } of segment) {
								expect(h).toBeGreaterThanOrEqual(Math.min(a.h, b.h) - slack);
								expect(h).toBeLessThanOrEqual(Math.max(a.h, b.h) + slack);
							}
							if (start === a && end === b) {
								const run = b.x - a.x;
								expect(c1).toEqual({ x: a.x + (softness / 2) * run, h: a.h });
								expect(c2).toEqual({ x: b.x - (softness / 2) * run, h: b.h });
							}
						}
					}
				}
			}
		}
	});

	it('shows every layer: its main peak is on the canvas and rises above every layer in front', () => {
		const hidden: string[] = [];
		for (const size of [...sizes, ...portraitCustoms]) {
			for (const seed of seeds(300)) {
				for (const params of [
					{ layers: 10 },
					{ layers: 10, height: 0 },
					{ layers: 3 },
					{}
				] as Params[]) {
					const all = ridges(size, seed, params);
					// The thinnest step: (1 - FRONT_MAX) (1 - TAPER) / (LAYERS.max - 1) of the back peak.
					const step = (0.4 * 0.4 * mainPeak(all[0]).h) / 9;
					all.forEach((ridge, i) => {
						const peak = mainPeak(ridge);
						const above = Math.max(...all.slice(i + 1).flatMap((r) => r.points.map((p) => p.h)));
						if (peak.x < 0 || peak.x >= size.width || peak.h - above < step * (1 - 1e-9)) {
							hidden.push(
								`seed ${seed} ${size.width}x${size.height} layer ${i}: ${peak.h - above}`
							);
						}
					});
				}
			}
		}
		expect(hidden).toEqual([]);
	});
});

describe('hills: seed variation (PAT-04, PAT-10)', () => {
	/** Band index of the last layer covering each cell of a 40-column grid; -1 is background. */
	function grid(size: Size, all: Segment[][]): Int8Array {
		const cols = 40;
		const rows = Math.round((cols * size.height) / size.width);
		const cells = new Int8Array(cols * rows).fill(-1);
		all.forEach((segments, band) => {
			for (let x = 0; x < cols; x++) {
				const top = size.height - heightAt(segments, ((x + 0.5) * size.width) / cols);
				for (let y = 0; y < rows; y++) {
					if (((y + 0.5) * size.height) / rows >= top) cells[y * cols + x] = band;
				}
			}
		});
		return cells;
	}

	// Layered hills keep their order in every seed: the back layer on top, the front one along the
	// bottom edge, so this metric tops out near 0.6 instead of the 0.85 of arcs. One height step on
	// the same seed scores 0.04–0.08, so the bars are scaled down from those of arcs (PAT-10).
	it.each(Object.entries(representativePresets))(
		'gives clearly different compositions for different seeds on %s',
		(_, size) => {
			const grids = seeds(30).map((seed) => grid(size, curves(size, seed)));
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
			expect(distances[Math.floor(distances.length / 2)]).toBeGreaterThanOrEqual(0.45);
			expect(distances[0]).toBeGreaterThanOrEqual(0.1);
			expect(distances.filter((d) => d < 0.2).length).toBeLessThanOrEqual(0.02 * distances.length);
		}
	);

	it.each(Object.entries(representativePresets))(
		'moves every seed axis both ways on %s',
		(_, size) => {
			const traits = seeds(30).map((seed) => {
				const all = ridges(size, seed);
				const back = all[0].points;
				const peaks = all.map((r) => mainPeak(r).h);
				const front = all[all.length - 1];
				return {
					spacing: (back[back.length - 1].x - back[0].x) / (back.length - 1) / size.height,
					front: peaks[peaks.length - 1] / peaks[0],
					depth: 1 - Math.min(...front.points.map((p) => p.h)) / peaks[peaks.length - 1],
					taper: (peaks[2] - (peaks[0] + peaks[4]) / 2) / peaks[0],
					main: mainPeak(all[0]).x / size.width
				};
			});
			const range = (key: keyof (typeof traits)[number]) => {
				const values = traits.map((t) => t[key]);
				return [Math.min(...values), Math.max(...values)];
			};
			const [narrow, broad] = range('spacing');
			expect(narrow).toBeLessThanOrEqual(0.2);
			expect(broad).toBeGreaterThanOrEqual(0.4);
			const [low, high] = range('front');
			expect(low).toBeLessThanOrEqual(0.3);
			expect(high).toBeGreaterThanOrEqual(0.52);
			const [shallow, deep] = range('depth');
			expect(shallow).toBeLessThanOrEqual(0.3);
			expect(deep).toBeGreaterThanOrEqual(0.6);
			const [back, forth] = range('taper');
			expect(back).toBeLessThanOrEqual(-0.04);
			expect(forth).toBeGreaterThanOrEqual(0.04);
			const [left, right] = range('main');
			expect(left).toBeLessThanOrEqual(1 / 3);
			expect(right).toBeGreaterThanOrEqual(2 / 3);
		}
	);
});

describe('hills: render time (ENG-07)', () => {
	it('renders desk-5k at maximum params well within 50 ms', () => {
		const max = config({
			size: representativePresets['desk-5k'],
			params: { layers: 10, height: 1, softness: 1 }
		});
		const times = Array.from({ length: 21 }, () => {
			const start = performance.now();
			render(max, hills);
			return performance.now() - start;
		}).sort((a, b) => a - b);
		expect(times[10]).toBeLessThan(50);
	});
});
