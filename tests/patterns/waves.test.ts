import { describe, expect, it } from 'vitest';
import { resolveColors } from '../../src/lib/engine/palette';
import { createRng } from '../../src/lib/engine/prng';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import type { Params, RenderConfig, Size } from '../../src/lib/engine/types';
import waves, {
	curve,
	layout,
	profile,
	type Layout,
	type Segment
} from '../../src/lib/patterns/waves';
import { portraitPresets, representativePresets } from '../fixtures/presets';

const defaults: Params = Object.fromEntries(
	Object.entries(waves.params).map(([key, def]) => [key, def.default])
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
/** Every laptop and desktop preset in PRD Appendix A, until presets.json exists. */
const desktopPresets: Size[] = [
	{ width: 3456, height: 2234 },
	{ width: 3024, height: 1964 },
	{ width: 2880, height: 1864 },
	{ width: 2560, height: 1664 },
	{ width: 1920, height: 1200 },
	{ width: 2560, height: 1600 },
	{ width: 5120, height: 2880 },
	{ width: 3840, height: 2160 },
	{ width: 3440, height: 1440 },
	{ width: 2560, height: 1440 },
	{ width: 1920, height: 1080 }
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
	{ layers: 12 },
	{ amplitude: 0 },
	{ amplitude: 1 },
	{ frequency: 1 },
	{ frequency: 6 },
	{ layers: 12, amplitude: 1, frequency: 6 },
	{ layers: 3, amplitude: 0, frequency: 1 },
	{ layers: 12, amplitude: 0, frequency: 6 }
];
const steps = (key: string, count: number) =>
	Array.from({ length: count + 1 }, (_, i) => ({ [key]: i / count }));
const seeds = (count: number) => Array.from({ length: count }, (_, i) => String(i + 1));
/** Every seed the floor tests use, and every snapshot seed ('1' and '42' are among the first 300). */
const testSeeds = [...seeds(300), 'senja-teduh-42', '603', '965'];
/**
 * Extreme params, every layer count, every amplitude step and every frequency. Amplitude sets the
 * margin to the floor and the cap; frequency moves the nodes against the edges.
 */
const floorParams: Params[] = [
	...extremes,
	...Array.from({ length: 8 }, (_, i) => ({ layers: i + 4 })),
	...steps('amplitude', 20),
	...Array.from({ length: 4 }, (_, i) => ({ frequency: i + 2 }))
];
/** The layer counts and amplitudes that set how far apart the crests are. */
const visibilityParams: Params[] = [
	{},
	{ layers: 3 },
	{ layers: 12 },
	{ layers: 12, amplitude: 0 },
	{ layers: 12, amplitude: 1 },
	{ layers: 12, amplitude: 0, frequency: 6 }
];

function config(overrides: Partial<RenderConfig> = {}): RenderConfig {
	return {
		version: ENGINE_VERSION,
		pattern: 'waves',
		seed: '42',
		palette: ['e07a5f', '3d405b', '81b29a'],
		background: 'f4efe6',
		size: phone,
		params: {},
		variant: 'light',
		...overrides
	};
}

function shape(size: Size, seed: string, params: Params = {}): Layout {
	return layout(size.width, size.height, { ...defaults, ...params }, createRng(seed));
}

/** The drawn curve of every wave, back first, at the given params. */
function curves(size: Size, seed: string, params: Params = {}): Segment[][] {
	const geometry = shape(size, seed, params);
	return geometry.waves.map((wave) => curve(geometry, wave, size.width));
}

/** Highest point of a drawn wave, control points included: the curve stays below it. */
function top(segments: Segment[]): number {
	let highest = -Infinity;
	for (const segment of segments) for (const { h } of segment) highest = Math.max(highest, h);
	return highest;
}

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
 * Points below `low` (a share of the height) on the back wave or above `high(size)` (in pixels)
 * on any wave.
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
	const cap = high(size);
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
			if (lowest < floor || highest > cap) {
				wrong.push(`${label} seed ${seed} ${JSON.stringify(params)}: ${lowest}, ${highest}`);
			}
		}
	}
	return wrong;
}

/** The highest point the waves may reach: half the longer side, at most 70% of the height. */
const cap = ({ width, height }: Size) => Math.min(0.7 * height, 0.5 * Math.max(width, height));

describe('waves: module (PAT-02, PAT-09, ENG-03)', () => {
	it('matches its catalog row', () => {
		expect(waves.id).toBe('waves');
		expect(waves.name).toBe('Waves');
		expect(waves.category).toBe('landscape');
		expect(waves.params).toEqual({
			layers: { type: 'number', min: 3, max: 12, step: 1, default: 6 },
			amplitude: { type: 'number', min: 0, max: 1, step: 0.05, default: 0.4 },
			frequency: { type: 'number', min: 1, max: 6, step: 1, default: 2 }
		});
	});

	it('asks for one color per layer (ENG-11)', () => {
		for (let layers = 3; layers <= 12; layers++) {
			expect(waves.colorCount({ ...defaults, layers })).toBe(layers);
		}
	});
});

describe('waves: colors (ENG-11, COL-05)', () => {
	const palettes = [
		['2a78d6'],
		['e07a5f', '3d405b', '81b29a'],
		['e07a5f', '3d405b', '81b29a', 'f2cc8f', '6d597a']
	];

	it.each(palettes.map((palette) => ({ palette })))(
		'paints the resolved colors in order, back wave first: $palette',
		({ palette }) => {
			for (const variant of ['light', 'dark'] as const) {
				for (const layers of [3, 6, 12]) {
					const { background, colors } = resolveColors(palette, 'f4efe6', variant, layers);
					const svg = render(config({ palette, variant, params: { layers } }), waves);
					expect(shape(phone, '42', { layers }).waves.map((w) => w.band)).toEqual(
						Array.from({ length: layers }, (_, i) => i)
					);
					expect(fills(svg)).toEqual(colors);
					expect(svg).toContain(`<rect width="1080" height="2400" fill="${background}"/>`);
				}
			}
		}
	);
});

describe('waves: one composition for both variants (MODE-01)', () => {
	it('draws light and dark with identical geometry', () => {
		for (const seed of seeds(10)) {
			for (const size of presets) {
				for (const params of extremes) {
					const light = render(config({ seed, size, params, variant: 'light' }), waves);
					const dark = render(config({ seed, size, params, variant: 'dark' }), waves);
					expect(mask(dark)).toBe(mask(light));
				}
			}
		}
	});

	it('keeps the geometry when the palette or background changes', () => {
		for (const seed of seeds(10)) {
			const reference = mask(render(config({ seed }), waves));
			for (const palette of [['2a78d6'], ['e07a5f', '3d405b', '81b29a', 'f2cc8f', '6d597a']]) {
				for (const background of ['auto', '2a78d6']) {
					expect(mask(render(config({ seed, palette, background }), waves))).toBe(reference);
				}
			}
		}
	});
});

describe('waves: randomness (ENG-02)', () => {
	it('draws exactly 18 numbers from the seeded PRNG for any params and canvas', () => {
		const middles: Params[] = [{ layers: 4 }, { layers: 7, amplitude: 0.35 }, { frequency: 3 }];
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
					const colors = Array.from({ length: waves.colorCount(params) }, () => '#ffffff');
					waves.generate({ ...size, params, rng, background: '#000000', colors });
					expect(calls).toBe(18);
				}
			}
		}
	});
});

describe('waves: SVG output (ENG-01, ENG-06, EXP-02)', () => {
	it('writes one rect and paths with presentation attributes only', () => {
		for (const size of presets) {
			for (const params of extremes) {
				const svg = render(config({ size, params }), waves);
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
				const svg = render(config({ seed: '7', size, params }), waves);
				expect(svg).not.toMatch(/\d\.\d{3}/);
				expect(svg).not.toMatch(/-\d/);
			}
		}
	});

	it('closes each wave along the bottom edge and draws nothing outside the canvas', () => {
		const wrong: string[] = [];
		for (const seed of seeds(20)) {
			for (const size of [...sizes, ...portraitCustoms]) {
				for (const params of extremes) {
					const where = `seed ${seed} ${size.width}x${size.height} ${JSON.stringify(params)}`;
					const svg = render(config({ seed, size, params }), waves);
					for (const [, d] of svg.matchAll(/ d="([^"]*)"/g)) {
						const head = `M0 ${size.height}L0 `;
						const tail = `L${size.width} ${size.height}Z`;
						if (!d.startsWith(head) || !d.endsWith(tail)) wrong.push(`${where}: ${d}`);
						if (/[^MLCSZ\d. ]/.test(d)) wrong.push(`${where}: command in ${d}`);
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

	it('writes inner pieces with S only where the left-out control point mirrors the previous one', () => {
		const wrong: string[] = [];
		// Largest distance between a left-out control point and the mirrored one, as a share of the canvas.
		let gap = 0;
		for (const seed of seeds(10)) {
			for (const size of [...presets, ...customs]) {
				for (const params of extremes) {
					const svg = render(config({ seed, size, params }), waves);
					const paths = [...svg.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]);
					curves(size, seed, params).forEach((segments, band) => {
						const last = segments.length - 1;
						const commands = segments.map((_, j) => (j > 1 && j < last ? 'S' : 'C')).join('');
						if (paths[band].replace(/[^CS]/g, '') !== commands) {
							wrong.push(`seed ${seed} ${size.width}x${size.height} ${JSON.stringify(params)}`);
						}
						for (let j = 2; j < last; j++) {
							const [start, c1] = segments[j];
							const c2 = segments[j - 1][2];
							gap = Math.max(
								gap,
								Math.abs(2 * start.x - c2.x - c1.x) / size.width,
								Math.abs(2 * start.h - c2.h - c1.h) / size.height
							);
						}
					});
				}
			}
		}
		expect(wrong).toEqual([]);
		expect(gap).toBeLessThan(1e-9);
	});
});

describe('waves: proportions (ENG-04, DEV-05)', () => {
	it('scales with the canvas: twice the size gives exactly twice the geometry', () => {
		for (const seed of seeds(10)) {
			for (const size of [...presets, ...customs]) {
				for (const params of extremes) {
					const double = { width: size.width * 2, height: size.height * 2 };
					const one = shape(size, seed, params);
					expect(shape(double, seed, params)).toEqual({
						wavelength: one.wavelength * 2,
						waves: one.waves.map((w) => ({ ...w, mid: w.mid * 2, amp: w.amp * 2 }))
					});
					const drawn = curves(size, seed, params).map((c) =>
						c.map((s) => s.map(({ x, h }) => ({ x: x * 2, h: h * 2 })))
					);
					expect(curves(double, seed, params)).toEqual(drawn);
				}
			}
		}
	});

	it('fits frequency waves to the shorter side, and at most 48 across the width', () => {
		const appendixA = [...Object.values(portraitPresets), ...desktopPresets];
		for (let frequency = 1; frequency <= 6; frequency++) {
			for (const size of [...appendixA, ...landscapes]) {
				// The limit never binds on a preset, a tablet on its side or a 32:9 span.
				const { wavelength } = shape(size, '42', { frequency });
				expect(wavelength).toBe(Math.min(size.width, size.height) / frequency);
			}
			for (const size of [...sizes, ...portraitCustoms]) {
				const { wavelength } = shape(size, '42', { frequency });
				expect(size.width / wavelength).toBeLessThanOrEqual(48 * (1 + 1e-12));
			}
		}
		// The 24:1 strip fits 24 waves at frequency 1, and 48 from frequency 2.
		const strip = { width: 7680, height: 320 };
		expect(shape(strip, '42', { frequency: 1 }).wavelength).toBe(320);
		for (const frequency of [2, 3, 6]) {
			expect(shape(strip, '42', { frequency }).wavelength).toBe(160);
		}
	});

	it('adds waves on wider screens instead of stretching them, keeping the centre', () => {
		const narrow = { width: 2560, height: 1440 };
		const wide = { width: 5120, height: 1440 };
		const offset = (wide.width - narrow.width) / 2;
		for (const seed of seeds(20)) {
			const a = shape(narrow, seed);
			const b = shape(wide, seed);
			expect(b).toEqual(a);
			const drawnA = curves(narrow, seed);
			const drawnB = curves(wide, seed);
			drawnA.forEach((segments, band) => {
				// Every node inside the narrow canvas sits at the same height in the wide one.
				const nodes = new Map(drawnB[band].map(([start]) => [Math.round(start.x * 1e6), start.h]));
				for (const [start] of segments.slice(1)) {
					expect(nodes.get(Math.round((start.x + offset) * 1e6))).toBe(start.h);
				}
				expect(drawnB[band].length).toBeGreaterThan(segments.length);
			});
		}
	});

	it('repeats every wave exactly once per wavelength', () => {
		// Largest difference between a full piece and the one a wavelength later, as a share of the canvas.
		let shift = 0;
		let rise = 0;
		for (const seed of seeds(10)) {
			for (const size of [...presets, ...customs]) {
				for (const params of extremes) {
					const { wavelength } = shape(size, seed, params);
					for (const segments of curves(size, seed, params)) {
						for (let j = 1; j + 4 < segments.length - 1; j++) {
							for (let k = 0; k < 4; k++) {
								const [point, next] = [segments[j][k], segments[j + 4][k]];
								shift = Math.max(shift, Math.abs(next.x - point.x - wavelength) / size.width);
								rise = Math.max(rise, Math.abs(next.h - point.h) / size.height);
							}
						}
					}
				}
			}
		}
		expect(shift).toBeLessThan(1e-9);
		expect(rise).toBeLessThan(1e-9);
	});

	it.each(Object.entries(portraitPresets))(
		'covers the bottom three tenths of %s with waves and keeps its top half free',
		(id, size) => {
			expect(outOfRange(size, id, 0.3, (s) => 0.5 * s.height)).toEqual([]);
		}
	);

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

	it("keeps the front wave's troughs 2% of the shorter side above the bottom edge", () => {
		const wrong: string[] = [];
		for (const size of [...sizes, ...portraitCustoms]) {
			const clearance = 0.02 * Math.min(size.width, size.height);
			for (const seed of seeds(100)) {
				for (const params of floorParams) {
					const geometry = shape(size, seed, params);
					const front = curve(geometry, geometry.waves[geometry.waves.length - 1], size.width);
					const lowest = Math.min(...front.flatMap((segment) => segment.map(({ h }) => h)));
					if (lowest < clearance) {
						wrong.push(
							`seed ${seed} ${size.width}x${size.height} ${JSON.stringify(params)}: ${lowest}`
						);
					}
				}
			}
		}
		expect(wrong).toEqual([]);
	});
});

describe('waves: parameters', () => {
	it('layers keeps the back and front waves and only adds waves between them', () => {
		for (const seed of seeds(20)) {
			for (const size of presets) {
				const base = shape(size, seed, { layers: 3 });
				const drawn = curves(size, seed, { layers: 3 });
				for (let layers = 4; layers <= 12; layers++) {
					const geometry = shape(size, seed, { layers });
					expect(geometry.waves).toHaveLength(layers);
					expect(geometry.waves[0]).toEqual(base.waves[0]);
					expect({ ...geometry.waves[layers - 1], band: 2 }).toEqual(base.waves[2]);
					const lines = curves(size, seed, { layers });
					expect(lines[0]).toEqual(drawn[0]);
					expect(lines[layers - 1]).toEqual(drawn[2]);
				}
			}
		}
	});

	it('amplitude grows every wave, the front one evenly from a 3% to an 18% swell of the shorter side, and moves nothing sideways', () => {
		for (const seed of seeds(20)) {
			for (const size of [...presets, ...customs]) {
				const unit = Math.min(size.width, size.height);
				const swell = (amplitude: number) => {
					const list = shape(size, seed, { amplitude }).waves;
					return (2 * list[list.length - 1].amp) / unit;
				};
				// 3% at 0, 9% at the default 0.4 and 18% at 1, in even steps.
				for (let step = 0; step <= 20; step++) {
					expect(swell(step / 20)).toBeCloseTo(0.03 + (0.15 * step) / 20, 12);
				}
				const xs = (amplitude: number) =>
					curves(size, seed, { amplitude }).map((c) => c.map((s) => s.map((p) => p.x)));
				const reference = xs(0);
				let previous = shape(size, seed, { amplitude: 0 }).waves;
				for (let step = 1; step <= 20; step++) {
					const current = shape(size, seed, { amplitude: step / 20 }).waves;
					current.forEach((wave, i) => {
						expect(wave.amp).toBeGreaterThan(previous[i].amp);
						expect(wave.phase).toBe(previous[i].phase);
					});
					expect(xs(step / 20)).toEqual(reference);
					previous = current;
				}
			}
		}
	});

	it('frequency changes the wavelength and nothing else', () => {
		for (const seed of seeds(20)) {
			for (const size of [...presets, ...customs]) {
				const reference = shape(size, seed, { frequency: 1 }).waves;
				for (let frequency = 2; frequency <= 6; frequency++) {
					expect(shape(size, seed, { frequency }).waves).toEqual(reference);
				}
			}
		}
	});

	it('draws the wave profile: control points between the heights of each piece, within 1% of the exact wave, no piece almost zero wide', () => {
		// Control points past the heights of their piece's ends, as a share of the height, and the
		// largest gap to the exact wave, as a share of its crest-to-trough height.
		let outside = 0;
		let error = 0;
		// Narrowest piece, as a share of the wavelength: nodes near an edge move onto it (EDGE).
		let narrowest = Infinity;
		for (const seed of seeds(10)) {
			for (const size of [...presets, ...customs]) {
				for (const params of extremes) {
					const geometry = shape(size, seed, params);
					for (const wave of geometry.waves) {
						for (const [p0, p1, p2, p3] of curve(geometry, wave, size.width)) {
							narrowest = Math.min(narrowest, (p3.x - p0.x) / geometry.wavelength);
							const [low, high] = [Math.min(p0.h, p3.h), Math.max(p0.h, p3.h)];
							for (const { h } of [p1, p2]) {
								outside = Math.max(outside, (low - h) / size.height, (h - high) / size.height);
							}
							for (const t of [0.25, 0.5, 0.75]) {
								const u = 1 - t;
								const at = (key: 'x' | 'h') =>
									u ** 3 * p0[key] +
									3 * u * u * t * p1[key] +
									3 * u * t * t * p2[key] +
									t ** 3 * p3[key];
								const tau = (at('x') - size.width / 2) / geometry.wavelength + wave.phase;
								const exact = wave.mid + wave.amp * profile(tau);
								error = Math.max(error, Math.abs(at('h') - exact) / (2 * wave.amp));
							}
						}
					}
				}
			}
		}
		expect(outside).toBeLessThan(1e-9);
		expect(error).toBeLessThan(0.01);
		expect(narrowest).toBeGreaterThan(0.001);
	});

	it('shows every wave: at its crests it rises above every wave in front of it', () => {
		// The thinnest step: (1 - TAPER) / (LAYERS.max - 1) of the smallest drop from the back crest to
		// the front one, (1 - FRONT_MAX) FLOOR - AMP_MAX (1 - FADE_MIN) (1 + SHARP) of the height.
		const share = ((1 - 0.4) / 11) * ((1 - 0.4) * 0.3 - 0.09 * (1 - 0.4) * (1 + 0.2));
		const hidden: string[] = [];
		for (const size of [...sizes, ...portraitCustoms]) {
			for (const seed of seeds(300)) {
				for (const params of visibilityParams) {
					const tops = curves(size, seed, params).map(top);
					let above = tops[tops.length - 1];
					for (let i = tops.length - 2; i >= 0; i--) {
						if (tops[i] - above < share * size.height) {
							hidden.push(
								`seed ${seed} ${size.width}x${size.height} wave ${i}: ${tops[i] - above}`
							);
						}
						above = Math.max(above, tops[i]);
					}
				}
			}
		}
		expect(hidden).toEqual([]);
	});

	it.each(Object.entries(representativePresets))(
		'lets no wave cover half of the pattern at default params on %s',
		(_, size) => {
			const cols = 400;
			for (const seed of seeds(30)) {
				const drawn = curves(size, seed);
				const seen = new Array<number>(drawn.length).fill(0);
				let total = 0;
				for (let c = 0; c < cols; c++) {
					const heights = drawn.map((segments) =>
						heightAt(segments, ((c + 0.5) * size.width) / cols)
					);
					let above = 0;
					for (let i = heights.length - 1; i >= 0; i--) {
						seen[i] += Math.max(0, heights[i] - above);
						above = Math.max(above, heights[i]);
					}
					total += above;
				}
				expect(Math.max(...seen) / total).toBeLessThan(0.5);
			}
		}
	);
});

describe('waves: seed variation (PAT-04, PAT-10)', () => {
	/** Band index of the last wave covering each cell of a 40-column grid; -1 is background. */
	function grid(size: Size, all: Segment[][]): Int8Array {
		const cols = 40;
		const rows = Math.round((cols * size.height) / size.width);
		const cells = new Int8Array(cols * rows).fill(-1);
		all.forEach((segments, band) => {
			for (let x = 0; x < cols; x++) {
				const crest = size.height - heightAt(segments, ((x + 0.5) * size.width) / cols);
				for (let y = 0; y < rows; y++) {
					if (((y + 0.5) * size.height) / rows >= crest) cells[y * cols + x] = band;
				}
			}
		});
		return cells;
	}

	// The same bars as hills (PAT-10): stacked waves keep their order in every seed, the back wave on
	// top and the front one along the bottom edge, so this metric tops out well below that of arcs.
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
				const list = shape(size, seed).waves;
				const [back, front] = [list[0], list[list.length - 1]];
				const low = 0.3 * size.height + back.amp * (1 - 0.2);
				const high = cap(size) - back.amp * (1 + 0.2);
				const share = (back.mid - list[2].mid) / (back.mid - front.mid);
				return {
					phase: ((back.phase % 1) + 1) % 1,
					lean: front.phase - back.phase,
					taper: share,
					front: front.mid / back.mid,
					stack: (back.mid - low) / (high - low),
					fade: back.amp / front.amp,
					shift: list[2].phase - (back.phase + (front.phase - back.phase) * share)
				};
			});
			const range = (key: keyof (typeof traits)[number]) => {
				const values = traits.map((t) => t[key]);
				return [Math.min(...values), Math.max(...values)];
			};
			const bars: Record<keyof (typeof traits)[number], [number, number]> = {
				phase: [0.2, 0.8],
				lean: [-0.5, 0.5],
				// An even spacing puts wave 2 of 6 at 0.4.
				taper: [0.35, 0.45],
				front: [0.15, 0.35],
				stack: [0.2, 0.8],
				fade: [0.5, 0.8],
				shift: [-0.2, 0.2]
			};
			for (const [key, [below, above]] of Object.entries(bars)) {
				const [min, max] = range(key as keyof (typeof traits)[number]);
				expect(min, key).toBeLessThanOrEqual(below);
				expect(max, key).toBeGreaterThanOrEqual(above);
			}
			// The front middle line never passes FRONT_MAX of the back one, which the visibility bound uses.
			expect(range('front')[1]).toBeLessThanOrEqual(0.4);
		}
	);
});

describe('waves: seed axes at the ends of their range (PAT-04)', () => {
	/** Positions of the 18 draws: phase, lean, taper, front, stack, fade, then the 12 slot shifts. */
	const draw = { phase: 0, lean: 1, taper: 2, front: 3, stack: 4, fade: 5, slot: 6 };
	/** Stand-in for the PRNG: the given draws by position, 0.5 (the middle of every axis) elsewhere. */
	function geometryAt(size: Size, draws: Record<number, number>, params: Params = {}): Layout {
		let i = 0;
		const rng = () => draws[i++] ?? 0.5;
		return layout(size.width, size.height, { ...defaults, ...params }, rng);
	}
	const canvases = [...presets, ...landscapes, ...customs, ...portraitCustoms];
	const amplitudes: Params[] = [{ amplitude: 0 }, {}, { amplitude: 1 }];
	const close = (a: number, b: number, size: Size) =>
		expect(Math.abs(a - b)).toBeLessThan(1e-9 * Math.max(size.width, size.height));

	it('draws a water profile: crests of 1.2 and troughs of -0.8, sharper than a sine', () => {
		expect(profile(0)).toBeCloseTo(1.2, 12);
		expect(profile(0.25)).toBeCloseTo(-0.2, 12);
		expect(profile(0.5)).toBeCloseTo(-0.8, 12);
		expect(profile(1)).toBeCloseTo(1.2, 12);
	});

	it('phase puts a crest of the back wave at the centre at 0', () => {
		for (const size of canvases) {
			const geometry = geometryAt(size, { [draw.phase]: 0 });
			const back = geometry.waves[0];
			expect(back.phase).toBe(0);
			const node = curve(geometry, back, size.width).find(([start]) => start.x === size.width / 2);
			expect(node?.[0].h).toBeCloseTo(back.mid + 1.2 * back.amp, 9);
		}
	});

	it('stack lowers the back troughs onto the floor at 0 and lifts its crests to the cap at 1', () => {
		for (const size of canvases) {
			for (const params of amplitudes) {
				const low = geometryAt(size, { [draw.stack]: 0 }, params).waves[0];
				close(low.mid - 0.8 * low.amp, 0.3 * size.height, size);
				const high = geometryAt(size, { [draw.stack]: 1 }, params).waves[0];
				close(high.mid + 1.2 * high.amp, cap(size), size);
			}
		}
	});

	it('front lowers the front troughs to 2% of the shorter side at 0 and its middle line to 40% of the back one at 1', () => {
		for (const size of canvases) {
			for (const params of amplitudes) {
				const unit = Math.min(size.width, size.height);
				const low = geometryAt(size, { [draw.front]: 0 }, params).waves;
				const front = low[low.length - 1];
				close(front.mid - 0.8 * front.amp, 0.02 * unit, size);
				const high = geometryAt(size, { [draw.front]: 1 }, params).waves;
				close(high[high.length - 1].mid, 0.4 * high[0].mid, size);
			}
		}
	});

	it('fade makes the back wave 40% to 90% as tall as the front one', () => {
		for (const size of canvases) {
			for (const [value, ratio] of [
				[0, 0.4],
				[1, 0.9]
			]) {
				const list = geometryAt(size, { [draw.fade]: value }).waves;
				expect(list[0].amp / list[list.length - 1].amp).toBeCloseTo(ratio, 12);
			}
		}
	});

	it('taper moves wave 2 of 6 from a share of 0.304 to 0.496 of the way to the front', () => {
		for (const size of presets) {
			for (const [value, share] of [
				[0, 0.304],
				[1, 0.496]
			]) {
				const list = geometryAt(size, { [draw.taper]: value }).waves;
				const [back, front] = [list[0], list[list.length - 1]];
				expect((back.mid - list[2].mid) / (back.mid - front.mid)).toBeCloseTo(share, 12);
			}
		}
	});

	it('lean shifts the front crests by a wavelength either way, and every wave by its share', () => {
		for (const size of presets) {
			for (const [value, shift] of [
				[0, -1],
				[1, 1]
			]) {
				for (const layers of [3, 6, 12]) {
					const list = geometryAt(size, { [draw.lean]: value, [draw.taper]: 1 }, { layers }).waves;
					const [back, front] = [list[0], list[list.length - 1]];
					expect(front.phase - back.phase).toBeCloseTo(shift, 12);
					for (const wave of list) {
						const share = (back.mid - wave.mid) / (back.mid - front.mid);
						expect(wave.phase - back.phase).toBeCloseTo(shift * share, 9);
					}
				}
			}
		}
	});

	it('gives each wave its own shift of up to a quarter wavelength: back slot 0, front slot 1, middle wave i slot i + 1', () => {
		for (const layers of [3, 6, 12]) {
			const base = geometryAt(phone, {}, { layers }).waves;
			for (let slot = 0; slot < 12; slot++) {
				for (const [value, shift] of [
					[0, -0.25],
					[1, 0.25]
				]) {
					const moved = geometryAt(phone, { [draw.slot + slot]: value }, { layers }).waves;
					// The wave this slot belongs to; slots past the middle waves of this layer count move none.
					const owner =
						slot === 0 ? 0 : slot === 1 ? layers - 1 : slot <= layers - 1 ? slot - 1 : -1;
					moved.forEach((current, i) => {
						expect(current.phase - base[i].phase).toBeCloseTo(i === owner ? shift : 0, 12);
					});
				}
			}
		}
	});
});

describe('waves: render time (ENG-07)', () => {
	it.each([
		['desk-5k', representativePresets['desk-5k']],
		['the widest Custom strip', { width: 7680, height: 320 }]
	])('renders %s at maximum params well within 50 ms', (_, size) => {
		const max = config({ size, params: { layers: 12, amplitude: 1, frequency: 6 } });
		const times = Array.from({ length: 21 }, () => {
			const start = performance.now();
			render(max, waves);
			return performance.now() - start;
		}).sort((a, b) => a - b);
		expect(times[10]).toBeLessThan(50);
	});
});
