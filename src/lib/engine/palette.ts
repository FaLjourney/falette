import { deltaEOK, gamutMap, hexToOklab, isHex, mixOklch, oklabToHex, type Oklab } from './color';
import {
	BG_AUTO_C,
	BG_DARK_L,
	BG_LIGHT_L,
	DARK_CHROMA,
	MIN_DL,
	SIMILAR_DE
} from './color-constants';
import type { Variant } from './types';

export interface ResolvedColors {
	/** Background as `#rrggbb`. */
	background: string;
	/** Exactly the number of colors the pattern asked for, as `#rrggbb`. */
	colors: string[];
	/** True when the background is too close to a drawn color (COL-05 warning). */
	tooSimilar: boolean;
}

/**
 * Light-variant pattern colors (ENG-11). Extra slots are dropped from the end.
 * Missing colors are OKLCH gradations: lightness steps for one slot, otherwise
 * colors inserted between consecutive slots, earlier gaps first.
 */
function lightColors(slots: Oklab[], count: number): Oklab[] {
	if (count <= slots.length) return slots.slice(0, count);
	if (slots.length === 1) {
		// Step lightness through the distances that stay visible in both variants:
		// from MIN_DL up to the distance whose dark counterpart reaches white.
		const [slot] = slots;
		const maxDistance = 1 - BG_DARK_L;
		const start = Math.min(maxDistance, Math.max(MIN_DL, BG_LIGHT_L - slot.L));
		const end = start - MIN_DL > maxDistance - start ? MIN_DL : maxDistance;
		const out = [slot];
		for (let j = 1; j < count; j++) {
			const distance = start + ((end - start) * j) / count;
			out.push(gamutMap({ L: BG_LIGHT_L - distance, a: slot.a, b: slot.b }));
		}
		return out;
	}
	const gaps = slots.length - 1;
	const fills = count - slots.length;
	const out: Oklab[] = [];
	for (let g = 0; g < gaps; g++) {
		out.push(slots[g]);
		const inGap = Math.floor(fills / gaps) + (g < fills % gaps ? 1 : 0);
		for (let j = 1; j <= inGap; j++) {
			out.push(gamutMap(mixOklch(slots[g], slots[g + 1], j / (inGap + 1))));
		}
	}
	out.push(slots[gaps]);
	return out;
}

/**
 * Dark counterpart of a light pattern color (MODE-02): same hue, chroma times
 * DARK_CHROMA, and the light-variant distance to the background mirrored above
 * the dark background, never less than MIN_DL.
 */
function darkColor({ L, a, b }: Oklab): Oklab {
	const distance = Math.max(Math.abs(BG_LIGHT_L - L), MIN_DL);
	return gamutMap({
		L: Math.min(1, BG_DARK_L + distance),
		a: a * DARK_CHROMA,
		b: b * DARK_CHROMA
	});
}

/** Hue and chroma of the background as OKLab (a, b); lightness is locked per variant (COL-05). */
function backgroundTint(firstSlot: Oklab, background: string): { a: number; b: number } {
	if (background !== 'auto') {
		const { a, b } = hexToOklab(background);
		return { a, b };
	}
	const chroma = Math.sqrt(firstSlot.a ** 2 + firstSlot.b ** 2);
	const scale = chroma > BG_AUTO_C ? BG_AUTO_C / chroma : 1;
	return { a: firstSlot.a * scale, b: firstSlot.b * scale };
}

/**
 * Turns the light-variant palette and background into the background and
 * pattern colors of one variant (COL-05, MODE-02, ENG-05, ENG-11).
 */
export function resolveColors(
	palette: readonly string[],
	background: string,
	variant: Variant,
	count: number
): ResolvedColors {
	if (palette.length < 1 || palette.length > 5) {
		throw new RangeError(`Palette needs 1 to 5 colors, got ${palette.length}`);
	}
	if (background !== 'auto' && !isHex(background)) {
		throw new RangeError(`Invalid background: ${background}`);
	}
	if (!Number.isInteger(count) || count < 1) {
		throw new RangeError(`Invalid color count: ${count}`);
	}
	const slots = palette.map(hexToOklab);
	const light = lightColors(slots, count);
	const tint = backgroundTint(slots[0], background);
	const isDark = variant === 'dark';
	const bg = isDark
		? { L: BG_DARK_L, a: tint.a * DARK_CHROMA, b: tint.b * DARK_CHROMA }
		: { L: BG_LIGHT_L, ...tint };
	const backgroundHex = oklabToHex(bg);
	const colorHexes = (isDark ? light.map(darkColor) : light).map(oklabToHex);

	// Compare the colors as written, after rounding to HEX.
	const writtenBackground = hexToOklab(backgroundHex);
	const tooSimilar = colorHexes.some(
		(hex) => deltaEOK(writtenBackground, hexToOklab(hex)) < SIMILAR_DE
	);

	return {
		background: `#${backgroundHex}`,
		colors: colorHexes.map((hex) => `#${hex}`),
		tooSimilar
	};
}
