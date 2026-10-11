import { describe, expect, it } from 'vitest';
import { hexToOklab, hexToOklch } from '../../src/lib/engine/color';
import {
	BG_AUTO_C,
	BG_DARK_L,
	BG_LIGHT_L,
	DARK_CHROMA,
	MIN_DL,
	SIMILAR_DE
} from '../../src/lib/engine/color-constants';
import { resolveColors } from '../../src/lib/engine/palette';
import { createRng } from '../../src/lib/engine/prng';

const APPENDIX_B = ['e07a5f', '3d405b', '81b29a'];
const FIVE = ['e07a5f', '3d405b', '81b29a', 'f2cc8f', '2a78d6'];

const lch = (color: string) => hexToOklch(color.replace('#', ''));
const lab = (color: string) => hexToOklab(color.replace('#', ''));

function randomPalette(rng: () => number): string[] {
	const size = 1 + Math.floor(rng() * 5);
	return Array.from({ length: size }, () =>
		Math.floor(rng() * 0x1000000)
			.toString(16)
			.padStart(6, '0')
	);
}

describe('pattern colors, light variant (ENG-11)', () => {
	it('uses slots in order from the first when the palette has more colors', () => {
		expect(resolveColors(FIVE, 'auto', 'light', 3).colors).toEqual([
			'#e07a5f',
			'#3d405b',
			'#81b29a'
		]);
		expect(resolveColors(APPENDIX_B, 'auto', 'light', 1).colors).toEqual(['#e07a5f']);
	});

	it('uses every slot verbatim when the counts match', () => {
		expect(resolveColors(FIVE, 'auto', 'light', 5).colors).toEqual(FIVE.map((hex) => `#${hex}`));
	});

	it('fills a duotone with OKLCH gradations between its two colors', () => {
		// Expected values cross-checked against an independent implementation during planning.
		expect(resolveColors(['e07a5f', '3d405b'], 'auto', 'light', 4).colors).toEqual([
			'#e07a5f',
			'#ac607d',
			'#70517a',
			'#3d405b'
		]);
	});

	it('fills a monochrome palette with lightness steps of the one color', () => {
		const { colors } = resolveColors(['e07a5f'], 'auto', 'light', 5);
		expect(colors).toEqual(['#e07a5f', '#bc5940', '#983920', '#731b00', '#460d00']);
		const lightness = colors.map((color) => lch(color).l);
		for (let i = 1; i < lightness.length; i++) {
			expect(lightness[i]).toBeLessThan(lightness[i - 1]);
		}
	});

	it('inserts fills between consecutive slots, earlier gaps first, keeping every slot', () => {
		const { colors } = resolveColors(APPENDIX_B, 'auto', 'light', 5);
		expect(colors).toEqual(['#e07a5f', '#8e5880', '#3d405b', '#4d7a89', '#81b29a']);
		const six = resolveColors(APPENDIX_B, 'auto', 'light', 6).colors;
		expect([six[0], six[3], six[5]]).toEqual(['#e07a5f', '#3d405b', '#81b29a']);
		const eight = resolveColors(FIVE, 'auto', 'light', 8).colors;
		expect([eight[0], eight[2], eight[4], eight[6], eight[7]]).toEqual(
			FIVE.map((hex) => `#${hex}`)
		);
	});

	it('keeps generated colors distinct in both variants', () => {
		for (const palette of [['e07a5f'], ['ffffff'], ['000000'], ['f7cbb9'], ['e07a5f', '3d405b']]) {
			for (const variant of ['light', 'dark'] as const) {
				const { colors } = resolveColors(palette, 'auto', variant, 8);
				expect(new Set(colors).size).toBe(colors.length);
			}
		}
	});
});

describe('background (COL-05)', () => {
	it('locks lightness per variant for Auto and Manual', () => {
		for (const background of ['auto', 'f4efe6', 'ff0000', '2a78d6']) {
			expect(lch(resolveColors(APPENDIX_B, background, 'light', 3).background).l).toBeCloseTo(
				BG_LIGHT_L,
				2
			);
			expect(lch(resolveColors(APPENDIX_B, background, 'dark', 3).background).l).toBeCloseTo(
				BG_DARK_L,
				2
			);
		}
	});

	it('Auto uses a pale tint of the first slot, never stronger than the slot itself', () => {
		const light = resolveColors(APPENDIX_B, 'auto', 'light', 3);
		expect(light.background).toBe('#fdebe7');
		expect(lch(light.background).c).toBeLessThan(BG_AUTO_C + 0.003);
		expect(resolveColors(APPENDIX_B, 'auto', 'dark', 3).background).toBe('#1d1311');
	});

	it('Auto stays neutral when the first slot is grey', () => {
		for (const variant of ['light', 'dark'] as const) {
			const hex = resolveColors(['808080', 'e07a5f'], 'auto', variant, 2).background;
			expect(hex.slice(1, 3)).toBe(hex.slice(3, 5));
			expect(hex.slice(3, 5)).toBe(hex.slice(5, 7));
		}
	});

	it('Manual takes only hue and chroma from the chosen color', () => {
		expect(resolveColors(APPENDIX_B, 'f4efe6', 'light', 3).background).toBe('#f4efe6');
		expect(resolveColors(APPENDIX_B, 'f4efe6', 'dark', 3).background).toBe('#191610');
		// A dark pick keeps its hue and chroma but gets the locked light lightness.
		const pick = lch('#2a78d6');
		const out = lch(resolveColors(APPENDIX_B, '2a78d6', 'light', 3).background);
		expect(out.l).toBeCloseTo(BG_LIGHT_L, 2);
		expect(Math.abs(out.h - pick.h)).toBeLessThan(2);
		expect(out.c).toBeLessThanOrEqual(pick.c);
	});
});

describe('dark variant (MODE-02)', () => {
	it('derives the Appendix B example', () => {
		expect(resolveColors(APPENDIX_B, 'auto', 'dark', 5).colors).toEqual([
			'#8e3e29',
			'#a47497',
			'#afb3cf',
			'#628895',
			'#385f4d'
		]);
	});

	it('keeps every color at least MIN_DL above the background, with chroma lowered and hue kept', () => {
		const rng = createRng('dark-distance');
		for (let i = 0; i < 2000; i++) {
			const palette = randomPalette(rng);
			const count = 1 + Math.floor(rng() * 6);
			const light = resolveColors(palette, 'auto', 'light', count);
			const dark = resolveColors(palette, 'auto', 'dark', count);
			const bgL = lch(dark.background).l;
			dark.colors.forEach((color, j) => {
				const d = lch(color);
				const l = lch(light.colors[j]);
				expect(d.l - bgL).toBeGreaterThanOrEqual(MIN_DL - 0.005);
				expect(d.c).toBeLessThanOrEqual(l.c * DARK_CHROMA + 0.003);
				const lightDistance = BG_LIGHT_L - l.l;
				if (lightDistance >= MIN_DL && lightDistance <= 1 - BG_DARK_L) {
					expect(Math.abs(d.l - bgL - lightDistance)).toBeLessThan(0.01);
				}
			});
		}
	});
});

describe('too-similar flag (COL-05)', () => {
	it('keeps the dark minimum distance above the similarity threshold', () => {
		expect(MIN_DL).toBeGreaterThan(SIMILAR_DE);
	});

	it('flags a background too close to a drawn color', () => {
		expect(resolveColors(['f8cab8'], 'fbe1d6', 'light', 1).tooSimilar).toBe(true);
		expect(resolveColors(['ffffff'], 'auto', 'light', 1).tooSimilar).toBe(true);
	});

	it('does not flag the Appendix B example', () => {
		expect(resolveColors(APPENDIX_B, 'auto', 'light', 3).tooSimilar).toBe(false);
		expect(resolveColors(APPENDIX_B, 'f4efe6', 'light', 3).tooSimilar).toBe(false);
	});

	it('only counts colors the pattern draws', () => {
		expect(resolveColors(['3d405b', 'f4efe6'], 'f4efe6', 'light', 1).tooSimilar).toBe(false);
		expect(resolveColors(['3d405b', 'f4efe6'], 'f4efe6', 'light', 2).tooSimilar).toBe(true);
	});

	it('never flags the dark variant', () => {
		const rng = createRng('dark-similar');
		for (let i = 0; i < 1000; i++) {
			const palette = randomPalette(rng);
			const background = rng() < 0.5 ? 'auto' : randomPalette(rng)[0];
			expect(resolveColors(palette, background, 'dark', 1 + Math.floor(rng() * 6)).tooSimilar).toBe(
				false
			);
		}
	});

	it('measures similarity in OKLab on the written colors', () => {
		const { background, colors } = resolveColors(['f8cab8'], 'fbe1d6', 'light', 1);
		const [l1, l2] = [lab(background), lab(colors[0])];
		expect(Math.hypot(l1.L - l2.L, l1.a - l2.a, l1.b - l2.b)).toBeLessThan(SIMILAR_DE);
	});
});

describe('resolveColors contract', () => {
	it('is deterministic', () => {
		const a = resolveColors(FIVE, 'f4efe6', 'dark', 7);
		const b = resolveColors(FIVE, 'f4efe6', 'dark', 7);
		expect(a).toEqual(b);
	});

	it('returns exactly the requested number of #rrggbb colors', () => {
		for (const count of [1, 3, 5, 8]) {
			const { background, colors } = resolveColors(APPENDIX_B, 'auto', 'dark', count);
			expect(colors).toHaveLength(count);
			for (const color of [background, ...colors]) expect(color).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it('rejects invalid input', () => {
		expect(() => resolveColors([], 'auto', 'light', 1)).toThrow(RangeError);
		expect(() => resolveColors([...FIVE, 'ffffff'], 'auto', 'light', 1)).toThrow(RangeError);
		expect(() => resolveColors(['#e07a5f'], 'auto', 'light', 1)).toThrow(RangeError);
		expect(() => resolveColors(['e07a5f'], 'nope', 'light', 1)).toThrow(RangeError);
		expect(() => resolveColors(['e07a5f'], 'auto', 'light', 0)).toThrow(RangeError);
		expect(() => resolveColors(['e07a5f'], 'auto', 'light', 1.5)).toThrow(RangeError);
	});
});
