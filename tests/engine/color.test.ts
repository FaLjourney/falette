import { describe, expect, it } from 'vitest';
import {
	deltaEOK,
	gamutMap,
	hexToOklab,
	hexToOklch,
	inGamut,
	mixOklch,
	oklabToHex,
	oklchToHex,
	oklchToOklab
} from '../../src/lib/engine/color';
import { createRng } from '../../src/lib/engine/prng';

const hex2 = (n: number) => n.toString(16).padStart(2, '0');

function gridHexes(): string[] {
	const levels = [...Array.from({ length: 16 }, (_, i) => i * 16), 255];
	return levels.flatMap((r) =>
		levels.flatMap((g) => levels.map((b) => hex2(r) + hex2(g) + hex2(b)))
	);
}

function randomHexes(count: number): string[] {
	const rng = createRng('color-roundtrip');
	return Array.from(
		{ length: count },
		() =>
			hex2(Math.floor(rng() * 256)) + hex2(Math.floor(rng() * 256)) + hex2(Math.floor(rng() * 256))
	);
}

describe('HEX <-> OKLCH (ENG-05)', () => {
	it('round-trips every in-gamut HEX on a grid and a seeded random sample', () => {
		const hexes = [...gridHexes(), ...randomHexes(1000), 'e07a5f', '3d405b', '81b29a', 'f4efe6'];
		const mismatches = hexes.filter((hex) => oklchToHex(hexToOklch(hex)) !== hex);
		expect(mismatches).toEqual([]);
	});

	it('accepts upper-case HEX and writes lower case', () => {
		expect(oklchToHex(hexToOklch('E07A5F'))).toBe('e07a5f');
	});

	it('rejects malformed HEX', () => {
		for (const bad of ['#e07a5f', 'e07a5', 'e07a5fa', 'g07a5f', '']) {
			expect(() => hexToOklab(bad)).toThrow(RangeError);
		}
	});

	// color.js conversion tests (expected OKLCH for sRGB primaries):
	// https://github.com/color-js/color.js/blob/main/test/conversions.js
	it.each([
		['ff0000', 0.6279553639214311, 0.2576833038053608, 29.23388027962784],
		['00ff00', 0.8664396175234368, 0.2948272245426958, 142.4953450414439],
		['0000ff', 0.45201371817442365, 0.3132143886344849, 264.0520226163699]
	])('matches color.js OKLCH for %s', (hex, l, c, h) => {
		const lch = hexToOklch(hex);
		expect(lch.l).toBeCloseTo(l, 6);
		expect(lch.c).toBeCloseTo(c, 6);
		expect(Math.abs(lch.h - h)).toBeLessThan(1e-4);
	});

	// Same file, OKLab section (values given to 6 decimals).
	it.each([
		['00ffff', 0.905399, -0.149444, -0.039398],
		['ff00ff', 0.701674, 0.274566, -0.169156],
		['ffff00', 0.967983, -0.071369, 0.19857]
	])('matches color.js OKLab for %s', (hex, L, a, b) => {
		const lab = hexToOklab(hex);
		expect(Math.abs(lab.L - L)).toBeLessThan(2e-6);
		expect(Math.abs(lab.a - a)).toBeLessThan(2e-6);
		expect(Math.abs(lab.b - b)).toBeLessThan(2e-6);
	});

	// culori OKLCH tests: https://github.com/Evercoder/culori/blob/main/test/oklch.test.js
	it('matches culori lightness for #111 and the white and black points', () => {
		expect(hexToOklch('111111').l).toBeCloseTo(0.17763777307657064, 6);
		const white = hexToOklch('ffffff');
		expect(white.l).toBeCloseTo(1, 6);
		expect(white.c).toBeLessThan(1e-6);
		expect(hexToOklch('000000')).toMatchObject({ l: 0, c: 0 });
	});
});

describe('gamut mapping (ENG-05)', () => {
	const rng = createRng('gamut');
	const samples = Array.from({ length: 2000 }, () =>
		oklchToOklab({ l: 0.02 + rng() * 0.97, c: rng() * 0.4, h: rng() * 360 })
	);

	it('always lands inside sRGB, keeping lightness and hue and never raising chroma', () => {
		for (const lab of samples) {
			const mapped = gamutMap(lab);
			expect(inGamut(mapped)).toBe(true);
			expect(mapped.L).toBe(lab.L);
			const c0 = Math.hypot(lab.a, lab.b);
			const c1 = Math.hypot(mapped.a, mapped.b);
			expect(c1).toBeLessThanOrEqual(c0);
			if (c1 > 1e-6) {
				expect(Math.abs(Math.atan2(mapped.b, mapped.a) - Math.atan2(lab.b, lab.a))).toBeLessThan(
					1e-9
				);
			}
		}
	});

	it('leaves in-gamut colors unchanged', () => {
		const lab = hexToOklab('e07a5f');
		expect(gamutMap(lab)).toBe(lab);
	});

	it('writes out-of-gamut colors as valid HEX close to the requested lightness', () => {
		for (const lab of samples) {
			const hex = oklabToHex(lab);
			expect(hex).toMatch(/^[0-9a-f]{6}$/);
			// 8-bit steps are coarse in OKLab near black, so lightness is checked from 0.15 up.
			if (lab.L >= 0.15) {
				expect(Math.abs(hexToOklab(hex).L - lab.L)).toBeLessThan(0.005);
			}
		}
	});

	it('maps lightness outside [0, 1] to black and white', () => {
		expect(oklabToHex({ L: 1.2, a: 0.1, b: 0 })).toBe('ffffff');
		expect(oklabToHex({ L: -0.1, a: 0.1, b: 0 })).toBe('000000');
	});
});

describe('OKLCH helpers', () => {
	it('measures deltaE OK as Euclidean OKLab distance', () => {
		expect(deltaEOK({ L: 0.5, a: 0, b: 0 }, { L: 0.8, a: 0.4, b: 0 })).toBeCloseTo(0.5, 12);
	});

	it('interpolates from one endpoint to the other along the shorter hue arc', () => {
		const p = oklchToOklab({ l: 0.6, c: 0.1, h: 350 });
		const q = oklchToOklab({ l: 0.4, c: 0.1, h: 30 });
		const mid = mixOklch(p, q, 0.5);
		expect(mid.L).toBeCloseTo(0.5, 12);
		expect(((Math.atan2(mid.b, mid.a) * 180) / Math.PI + 360) % 360).toBeCloseTo(10, 9);
		expect(deltaEOK(mixOklch(p, q, 0), p)).toBeLessThan(1e-12);
		expect(deltaEOK(mixOklch(p, q, 1), q)).toBeLessThan(1e-12);
	});

	it('gives a near-grey endpoint the hue of the other endpoint', () => {
		const grey = hexToOklab('f4efe6');
		const blue = hexToOklab('2a78d6');
		const blueHue = Math.atan2(blue.b, blue.a);
		const mid = mixOklch(grey, blue, 0.5);
		expect(Math.abs(Math.atan2(mid.b, mid.a) - blueHue)).toBeLessThan(1e-9);
	});
});
