import { describe, expect, it } from 'vitest';
import {
	deltaEOK,
	gamutMap,
	hexToOklab,
	mixOklch,
	oklabToHex,
	type Oklab
} from '../../src/lib/engine/color';
import { resolveColors } from '../../src/lib/engine/palette';
import { createRng, hashSeed } from '../../src/lib/engine/prng';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import type { Params, RenderConfig, Size } from '../../src/lib/engine/types';
import gradient, { layout, stops, type Layout, type Stop } from '../../src/lib/patterns/gradient';
import { portraitPresets, representativePresets } from '../fixtures/presets';

const defaults: Params = Object.fromEntries(
	Object.entries(gradient.params).map(([key, def]) => [key, def.default])
);
const phone = representativePresets['and-fhd20'];
const presets = Object.values(representativePresets);
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
/** All 28 presets of PRD Appendix A. */
const allPresets = [...Object.values(portraitPresets), ...desktopPresets];
/** Custom sizes at the DEV-04 limits, plus a square. */
const customs: Size[] = [
	{ width: 320, height: 7680 },
	{ width: 7680, height: 320 },
	{ width: 1000, height: 1000 }
];
const canvases = [...allPresets, ...customs];
const types = ['linear', 'radial'] as const;
const angles = Array.from({ length: 25 }, (_, i) => i * 15);
const spreads = Array.from({ length: 21 }, (_, i) => i / 20);
const extremes: Params[] = types.flatMap((type): Params[] => [
	{ type },
	{ type, angle: 0 },
	{ type, angle: 90 },
	{ type, angle: 270 },
	{ type, angle: 360 },
	{ type, spread: 0 },
	{ type, spread: 1 },
	{ type, angle: 0, spread: 0 },
	{ type, angle: 360, spread: 1 }
]);
const seeds = (count: number) => Array.from({ length: count }, (_, i) => String(i + 1));

/**
 * Time limit for the heaviest tests, which sweep many seeds, canvases and params: three times the
 * 5 s default, so they also pass on slower machines.
 */
const HEAVY = { timeout: 15000 };

function config(overrides: Partial<RenderConfig> = {}): RenderConfig {
	return {
		version: ENGINE_VERSION,
		pattern: 'gradient',
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

const corners = ({ width, height }: Size) => [
	[0, 0],
	[width, 0],
	[0, height],
	[width, height]
];

/** Position along u (0 is the background end) that the gradient gives pixel (x, y), padded at both ends. */
function uAt({ geometry: g }: Layout, x: number, y: number): number {
	if (g.type === 'linear') {
		const dx = g.x2 - g.x1;
		const dy = g.y2 - g.y1;
		const t = ((x - g.x1) * dx + (y - g.y1) * dy) / (dx * dx + dy * dy);
		return Math.min(1, Math.max(0, t));
	}
	// SVG offset t along the ray from the focal point: (x, y) = F + t (Q - F), Q on the circle.
	const [px, py] = [x - g.fx, y - g.fy];
	const [ex, ey] = [g.fx - g.cx, g.fy - g.cy];
	const pp = px * px + py * py;
	if (pp === 0) return 1;
	const ep = ex * px + ey * py;
	const inverse = (-ep + Math.sqrt(ep * ep - pp * (ex * ex + ey * ey - g.r * g.r))) / pp;
	return 1 - Math.min(1, 1 / inverse);
}

/** 8-bit sRGB channels of `#rrggbb`, as 0–255. */
const channels = (color: string) => {
	const n = parseInt(color.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * The color a browser paints at u: gamma-encoded sRGB interpolation between the stops at their
 * offsets as written (2 decimals of a percent), rounded to 8 bits. It matches Chromium's pixels
 * within deltaE 0.005 (docs/laporan/gradient).
 */
function paintedAt(list: Stop[], u: number): Oklab {
	const written = list.map((s) => ({
		offset: Math.round(s.offset * 10000) / 10000,
		rgb: channels(s.color)
	}));
	let rgb = written[0].rgb;
	if (u >= written[written.length - 1].offset) rgb = written[written.length - 1].rgb;
	else if (u > written[0].offset) {
		const i = written.findIndex((s) => s.offset >= u);
		const [a, b] = [written[i - 1], written[i]];
		const t = b.offset === a.offset ? 1 : (u - a.offset) / (b.offset - a.offset);
		rgb = a.rgb.map((c, k) => c + (b.rgb[k] - c) * t);
	}
	return hexToOklab(rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join(''));
}

const stopTags = (svg: string) =>
	[...svg.matchAll(/<stop offset="([\d.]+)%" stop-color="(#[0-9a-f]{6})"\/>/g)].map((m) => ({
		offset: Number(m[1]) / 100,
		color: m[2]
	}));
/** The SVG with colors and the gradient ID blanked out. */
const mask = (svg: string) =>
	svg.replace(/#[0-9a-f]{6}/g, '#').replace(/(id="|url\(#)g[0-9a-z]+/g, '$1g');

describe('gradient: module (PAT-02, PAT-09, ENG-03)', () => {
	it('matches its catalog row', () => {
		expect(gradient.id).toBe('gradient');
		expect(gradient.name).toBe('Gradient');
		expect(gradient.category).toBe('gradient');
		expect(gradient.params).toEqual({
			type: { type: 'choice', options: ['linear', 'radial'], default: 'linear' },
			angle: { type: 'number', min: 0, max: 360, step: 1, default: 135 },
			spread: { type: 'number', min: 0, max: 1, step: 0.05, default: 0.5 }
		});
	});

	it('asks for all five palette slots at any params (ENG-11)', () => {
		for (const params of extremes) expect(gradient.colorCount({ ...defaults, ...params })).toBe(5);
	});
});

describe('gradient: colors (ENG-05, ENG-11, COL-05)', () => {
	const palettes = [
		['2a78d6'],
		['e07a5f', '3d405b'],
		['e07a5f', '3d405b', '81b29a'],
		['e07a5f', '3d405b', '81b29a', 'f2cc8f', '6d597a']
	];

	it.each(palettes.map((palette) => ({ palette })))(
		'runs from the background through colors 1 to 5 in order: $palette',
		({ palette }) => {
			for (const variant of ['light', 'dark'] as const) {
				for (const background of ['auto', 'f4efe6']) {
					const { background: bg, colors } = resolveColors(palette, background, variant, 5);
					for (const type of types) {
						const svg = render(
							config({ palette, background, variant, params: { type } }),
							gradient
						);
						const found = stopTags(svg);
						const fromBackground = type === 'linear' ? found : [...found].reverse();
						expect(fromBackground).toHaveLength(21);
						expect(fromBackground.filter((_, i) => i % 4 === 0).map((s) => s.color)).toEqual([
							bg,
							...colors
						]);
					}
				}
			}
		}
	);

	it('puts three OKLCH stops between each pair of main stops', () => {
		const ends = ['#f4efe6', '#e07a5f', '#8e5880', '#3d405b', '#4d7a89', '#81b29a'];
		const offsets = [0.1, 0.2, 0.35, 0.5, 0.7, 0.9];
		const list = stops(offsets, ends);
		expect(list).toHaveLength(21);
		for (let i = 1; i < ends.length; i++) {
			const [a, b] = [hexToOklab(ends[i - 1].slice(1)), hexToOklab(ends[i].slice(1))];
			for (let j = 1; j <= 3; j++) {
				const stop = list[(i - 1) * 4 + j];
				expect(stop.offset).toBeCloseTo(
					offsets[i - 1] + ((offsets[i] - offsets[i - 1]) * j) / 4,
					12
				);
				expect(stop.color).toBe(`#${oklabToHex(gamutMap(mixOklch(a, b, j / 4)))}`);
			}
		}
	});
});

describe('gradient: one composition for both variants (MODE-01)', () => {
	it('draws light and dark with identical geometry and offsets', () => {
		for (const seed of seeds(10)) {
			for (const size of presets) {
				for (const params of extremes) {
					const light = render(config({ seed, size, params, variant: 'light' }), gradient);
					const dark = render(config({ seed, size, params, variant: 'dark' }), gradient);
					expect(mask(dark)).toBe(mask(light));
				}
			}
		}
	});

	it('gives light and dark different gradient IDs, so the side-by-side preview shows both', () => {
		const id = (svg: string) => svg.match(/id="(g[0-9a-z]+)"/)?.[1];
		for (const params of extremes) {
			const light = render(config({ params, variant: 'light' }), gradient);
			const dark = render(config({ params, variant: 'dark' }), gradient);
			expect(id(light)).not.toBe(id(dark));
		}
	});

	it('keeps the geometry when the palette or background changes', () => {
		for (const seed of seeds(10)) {
			for (const type of types) {
				const reference = mask(render(config({ seed, params: { type } }), gradient));
				for (const palette of [['2a78d6'], ['e07a5f', '3d405b', '81b29a', 'f2cc8f', '6d597a']]) {
					for (const background of ['auto', '2a78d6']) {
						const svg = render(config({ seed, palette, background, params: { type } }), gradient);
						expect(mask(svg)).toBe(reference);
					}
				}
			}
		}
	});
});

describe('gradient: randomness (ENG-02)', () => {
	it('draws exactly 9 numbers from the seeded PRNG for both types, any params and canvas', () => {
		for (const seed of ['7', '42', '1234']) {
			for (const size of [phone, ...customs]) {
				for (const overrides of extremes) {
					const params = { ...defaults, ...overrides };
					const source = createRng(seed);
					let calls = 0;
					const rng = () => {
						calls++;
						return source();
					};
					const colors = Array.from({ length: 5 }, () => '#ffffff');
					gradient.generate({ ...size, params, rng, background: '#000000', colors });
					expect(calls).toBe(9);
				}
			}
		}
	});

	it('keeps the spacing of the stops within the zone when the type changes', () => {
		for (const seed of seeds(30)) {
			for (const spread of [0, 0.5, 1]) {
				const within = (l: Layout) =>
					l.offsets.map((o) => (o - l.offsets[0]) / (l.offsets[5] - l.offsets[0]));
				const linear = within(shape(phone, seed, { type: 'linear', spread }));
				const radial = within(shape(phone, seed, { type: 'radial', spread }));
				linear.forEach((o, i) => expect(radial[i]).toBeCloseTo(o, 12));
			}
		}
	});
});

describe('gradient: SVG output (ENG-01, ENG-06, EXP-02)', () => {
	it('writes one gradient in defs and one rect, with presentation attributes only', () => {
		for (const size of presets) {
			for (const params of extremes) {
				const svg = render(config({ size, params }), gradient);
				const body = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
				const tags = [...body.matchAll(/<(\w+)/g)].map((m) => m[1]);
				const tag = params.type === 'linear' ? 'linearGradient' : 'radialGradient';
				expect(tags).toEqual(['defs', tag, ...Array.from({ length: 21 }, () => 'stop'), 'rect']);
				const attrs = new Set([...body.matchAll(/\s([a-zA-Z0-9-]+)="/g)].map((m) => m[1]));
				const coords =
					params.type === 'linear' ? ['x1', 'x2', 'y1', 'y2'] : ['cx', 'cy', 'fx', 'fy', 'r'];
				expect([...attrs].sort()).toEqual(
					[
						'fill',
						'gradientUnits',
						'height',
						'id',
						'offset',
						'stop-color',
						'width',
						...coords
					].sort()
				);
				expect(body).toContain(`<rect width="${size.width}" height="${size.height}" fill="url(#`);
			}
		}
	});

	it('writes numbers with at most 2 decimals, offsets in percent included', () => {
		for (const size of canvases) {
			for (const params of extremes) {
				const svg = render(config({ seed: '7', size, params }), gradient);
				expect(svg).not.toMatch(/\d\.\d{3}/);
				for (const { offset } of stopTags(svg)) {
					expect(offset).toBeGreaterThanOrEqual(0);
					expect(offset).toBeLessThanOrEqual(1);
				}
			}
		}
	});

	it('names the gradient after its own content, so equal IDs always mean equal gradients', () => {
		const ids = new Set<string>();
		for (const seed of seeds(20)) {
			for (const params of extremes) {
				const svg = render(config({ seed, params }), gradient);
				expect(render(config({ seed, params }), gradient)).toBe(svg);
				const [, tag, id, rest] = svg.match(/<(\w+Gradient) id="(g[0-9a-z]+)"(.*?<\/\1>)/) ?? [];
				expect(id).toBe(`g${hashSeed(`<${tag}${rest}`).toString(36)}`);
				if (id !== undefined) ids.add(id);
			}
		}
		// angle 0 and 360 draw the same gradient, so each seed has one ID fewer per type than params.
		expect(ids.size).toBe(20 * (extremes.length - 2));
	});

	it('draws angle 360 exactly as angle 0', () => {
		for (const seed of seeds(10)) {
			for (const type of types) {
				for (const spread of [0, 0.5, 1]) {
					const at = (angle: number) =>
						render(config({ seed, params: { type, angle, spread } }), gradient);
					expect(at(360)).toBe(at(0));
				}
			}
		}
	});
});

describe('gradient: geometry (ENG-04, DEV-05)', () => {
	it('runs the linear line through the centre with the nearest and farthest corners at its ends, as CSS does', () => {
		for (const size of canvases) {
			for (const angle of angles) {
				const l = shape(size, '42', { type: 'linear', angle });
				const g = l.geometry;
				if (g.type !== 'linear') throw new Error('expected a linear gradient');
				const theta = (angle * Math.PI) / 180;
				const length = Math.hypot(g.x2 - g.x1, g.y2 - g.y1);
				expect((g.x2 - g.x1) / length).toBeCloseTo(Math.sin(theta), 9);
				expect((g.y2 - g.y1) / length).toBeCloseTo(-Math.cos(theta), 9);
				expect((g.x1 + g.x2) / 2).toBeCloseTo(size.width / 2, 6);
				expect((g.y1 + g.y2) / 2).toBeCloseTo(size.height / 2, 6);
				const along = corners(size).map(
					([x, y]) => ((x - g.x1) * (g.x2 - g.x1) + (y - g.y1) * (g.y2 - g.y1)) / length ** 2
				);
				expect(Math.min(...along)).toBeCloseTo(0, 9);
				expect(Math.max(...along)).toBeCloseTo(1, 9);
			}
		}
	});

	it('puts the background at the start: bottom at angle 0, top left at 135, right at 270', () => {
		const start = (angle: number) => {
			const g = shape(phone, '42', { type: 'linear', angle }).geometry;
			if (g.type !== 'linear') throw new Error('expected a linear gradient');
			// + 0 turns a rounded -0 into 0.
			return [g.x1, g.y1].map((v) => Math.round(v) + 0);
		};
		expect(start(0)).toEqual([540, 2400]);
		expect(start(90)).toEqual([0, 1200]);
		expect(start(270)).toEqual([1080, 1200]);
		const [x, y] = start(135);
		expect(x).toBeLessThan(540);
		expect(y).toBeLessThan(1200);
	});

	it(
		'keeps the radial focal point inside the circle, 0.3 radii from the centre towards the angle (5a)',
		HEAVY,
		() => {
			for (const size of [...presets, ...customs]) {
				for (const seed of seeds(200)) {
					for (const angle of [0, 45, 135, 200, 270, 330]) {
						const g = shape(size, seed, { type: 'radial', angle }).geometry;
						if (g.type !== 'radial') throw new Error('expected a radial gradient');
						const theta = (angle * Math.PI) / 180;
						const scale = Math.max(size.width, size.height) * 1e-9;
						expect(Math.abs(g.fx - g.cx - 0.3 * g.r * Math.sin(theta))).toBeLessThan(scale);
						expect(Math.abs(g.fy - g.cy + 0.3 * g.r * Math.cos(theta))).toBeLessThan(scale);
						for (const [v, side] of [
							[g.fx, size.width],
							[g.fy, size.height]
						]) {
							expect(v).toBeGreaterThanOrEqual(0.2 * side - scale);
							expect(v).toBeLessThanOrEqual(0.8 * side + scale);
						}
					}
				}
			}
		}
	);

	it(
		'makes the radial circle the smallest one around the focal point that holds every corner',
		HEAVY,
		() => {
			for (const size of canvases) {
				for (const seed of seeds(50)) {
					for (const angle of angles) {
						const g = shape(size, seed, { type: 'radial', angle }).geometry;
						if (g.type !== 'radial') throw new Error('expected a radial gradient');
						const distances = corners(size).map(([x, y]) => Math.hypot(x - g.cx, y - g.cy));
						expect(Math.max(...distances) / g.r).toBeCloseTo(1, 9);
					}
				}
			}
		}
	);

	it('scales with the canvas: twice the size gives exactly twice the geometry and the same stops', () => {
		for (const size of presets) {
			for (const seed of seeds(10)) {
				for (const params of extremes) {
					const one = shape(size, seed, params);
					const two = shape({ width: 2 * size.width, height: 2 * size.height }, seed, params);
					expect(two.offsets).toEqual(one.offsets);
					for (const [key, value] of Object.entries(one.geometry)) {
						const doubled = (two.geometry as unknown as Record<string, number | string>)[key];
						if (typeof value === 'number') expect(doubled).toBeCloseTo(2 * value, 6);
						else expect(doubled).toBe(value);
					}
				}
			}
		}
	});
});

describe('gradient: spread (4a)', () => {
	it('sets the zone to 25% of the gradient at 0 and all of it at 1, in steps', HEAVY, () => {
		for (const type of types) {
			for (const spread of spreads) {
				for (const seed of seeds(100)) {
					const { offsets } = shape(phone, seed, { type, spread });
					const zone = 0.25 + 0.75 * spread;
					expect(offsets[5] - offsets[0]).toBeCloseTo(zone, 12);
					expect(offsets[0]).toBeGreaterThanOrEqual(-1e-12);
					expect(offsets[5]).toBeLessThanOrEqual(1 + 1e-12);
					// The radial zone always ends at the focal point.
					if (type === 'radial') expect(offsets[5]).toBeCloseTo(1, 12);
					for (let i = 1; i < offsets.length; i++) {
						expect(offsets[i] - offsets[i - 1]).toBeGreaterThanOrEqual(0.05 * zone - 1e-12);
					}
				}
			}
		}
	});
});

describe('gradient: seed variation (PAT-04, PAT-10)', () => {
	/** Painted color of each cell of a 40-column grid. */
	function grid(size: Size, seed: string, params: Params): Oklab[] {
		const l = shape(size, seed, params);
		const { background, colors } = resolveColors(
			['e07a5f', '3d405b', '81b29a'],
			'f4efe6',
			'light',
			5
		);
		const list = stops(l.offsets, [background, ...colors]);
		const cols = 40;
		const rows = Math.round((cols * size.height) / size.width);
		const cells: Oklab[] = [];
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				const u = uAt(l, ((x + 0.5) * size.width) / cols, ((y + 0.5) * size.height) / rows);
				cells.push(paintedAt(list, u));
			}
		}
		return cells;
	}

	/** Mean deltaE OK per cell between every pair of 30 seeds, sorted. */
	function distances(size: Size, params: Params): number[] {
		const grids = seeds(30).map((seed) => grid(size, seed, params));
		const out: number[] = [];
		for (let i = 0; i < grids.length; i++) {
			for (let j = i + 1; j < grids.length; j++) {
				out.push(
					grids[i].reduce((sum, p, c) => sum + deltaEOK(p, grids[j][c]), 0) / grids[i].length
				);
			}
		}
		return out.sort((a, b) => a - b);
	}

	// Bars approved with the plan (revision 2). For scale: about 0.02 is a just noticeable difference,
	// one spread step scores 0.013 (linear) to 0.03 (radial), and 15 degrees of angle 0.02 to 0.06.
	const cases = Object.entries(representativePresets).flatMap(([preset, size]) =>
		types.flatMap((type) => [0, 0.5, 1].map((spread) => ({ preset, size, type, spread })))
	);
	it.each(cases)(
		'gives clearly different colors for different seeds: $type spread $spread on $preset',
		({ size, type, spread }) => {
			const d = distances(size, { type, spread });
			expect(d[Math.floor(d.length / 2)]).toBeGreaterThanOrEqual(0.1);
			expect(d.filter((v) => v < 0.03).length).toBeLessThanOrEqual(0.05 * d.length);
			if (spread === 0.5) expect(d[0]).toBeGreaterThanOrEqual(0.015);
		}
	);
});

describe('gradient: seed axes at the ends of their range (PAT-04)', () => {
	/** Stand-in for the PRNG: the given draws by position, 0.5 (the middle of every axis) elsewhere. */
	function geometryAt(draws: Record<number, number>, params: Params, size: Size = phone): Layout {
		let i = 0;
		const rng = () => draws[i++] ?? 0.5;
		return layout(size.width, size.height, { ...defaults, ...params }, rng);
	}
	const even = (start: number, zone: number) =>
		Array.from({ length: 6 }, (_, i) => start + (zone * i) / 5);

	it('spaces the stops evenly when every draw is in the middle', () => {
		for (const spread of [0, 0.5, 1]) {
			const zone = 0.25 + 0.75 * spread;
			const linear = geometryAt({}, { type: 'linear', spread }).offsets;
			even((1 - zone) / 2, zone).forEach((o, i) => expect(linear[i]).toBeCloseTo(o, 12));
			const radial = geometryAt({}, { type: 'radial', spread }).offsets;
			even(1 - zone, zone).forEach((o, i) => expect(radial[i]).toBeCloseTo(o, 12));
		}
	});

	it('shift moves the linear zone by 75% of the room left either way, and the radial zone not at all', () => {
		const zone = 0.625;
		const room = (1 - zone) / 2;
		expect(geometryAt({ 5: 0 }, { type: 'linear' }).offsets[0]).toBeCloseTo(room - 0.75 * room, 12);
		expect(geometryAt({ 5: 1 }, { type: 'linear' }).offsets[0]).toBeCloseTo(room + 0.75 * room, 12);
		expect(geometryAt({ 5: 0 }, { type: 'radial' }).offsets[0]).toBeCloseTo(1 - zone, 12);
		expect(geometryAt({ 5: 1 }, { type: 'radial' }).offsets[0]).toBeCloseTo(1 - zone, 12);
	});

	it('bunch crowds the stops towards the background end or the far end', () => {
		const share = (draw: number) => {
			const { offsets } = geometryAt({ 6: draw }, { type: 'linear', spread: 1 });
			return (offsets[3] - offsets[0]) / (offsets[5] - offsets[0]);
		};
		// Three of five even gaps reach 0.6; e^-0.8 and e^0.8 bend that to 0.6^0.45 and 0.6^2.23.
		expect(share(0.5)).toBeCloseTo(0.6, 12);
		expect(share(0)).toBeCloseTo(0.05 * 3 + 0.75 * 0.6 ** Math.exp(-0.8), 12);
		expect(share(1)).toBeCloseTo(0.05 * 3 + 0.75 * 0.6 ** Math.exp(0.8), 12);
	});

	it('gaps range from 0.1 to 1.9 before bunching, so one gap can take most of the zone', () => {
		// Gap 1 wide (draw 1) and the other four narrow (draw 0): 1.9 of 2.3.
		const { offsets } = geometryAt({ 0: 1, 1: 0, 2: 0, 3: 0, 4: 0 }, { type: 'linear', spread: 1 });
		expect(offsets[1] - offsets[0]).toBeCloseTo(0.05 + 0.75 * (1.9 / 2.3), 12);
		expect(offsets[2] - offsets[1]).toBeCloseTo(0.05 + 0.75 * (0.1 / 2.3), 12);
	});

	it('places the radial focal point between 20% and 80% of the width and the height', () => {
		for (const size of [phone, ...customs]) {
			for (const [draw, share] of [
				[0, 0.2],
				[1, 0.8]
			]) {
				const g = geometryAt({ 7: draw, 8: draw }, { type: 'radial' }, size).geometry;
				if (g.type !== 'radial') throw new Error('expected a radial gradient');
				expect(g.fx).toBeCloseTo(share * size.width, 9);
				expect(g.fy).toBeCloseTo(share * size.height, 9);
			}
		}
	});
});

describe('gradient: render time (ENG-07)', () => {
	it.each(types)('renders %s at desk-5k well within 50 ms', (type) => {
		const run = config({
			size: representativePresets['desk-5k'],
			params: { type, angle: 360, spread: 1 }
		});
		const times = Array.from({ length: 21 }, () => {
			const start = performance.now();
			render(run, gradient);
			return performance.now() - start;
		}).sort((a, b) => a - b);
		expect(times[10]).toBeLessThan(50);
	});
});
