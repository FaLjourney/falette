import { ACHROMATIC_C, GAMUT_STEPS } from './color-constants';

/** OKLab coordinates: lightness L in [0, 1], a and b unbounded. */
export interface Oklab {
	L: number;
	a: number;
	b: number;
}

/** OKLCH coordinates: hue in degrees [0, 360). Hue is meaningless when chroma is ~0. */
export interface Oklch {
	l: number;
	c: number;
	h: number;
}

const HEX_PATTERN = /^[0-9a-f]{6}$/i;

export function isHex(value: string): boolean {
	return HEX_PATTERN.test(value);
}

function decode(channel: number): number {
	return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function encode(channel: number): number {
	return channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
}

// Linear sRGB <-> OKLab with Björn Ottosson's matrices (updated 2021-01-25):
// https://bottosson.github.io/posts/oklab/
function linearToOklab(r: number, g: number, b: number): Oklab {
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return {
		L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	};
}

function oklabToLinear({ L, a, b }: Oklab): [number, number, number] {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	];
}

/** True when every linear sRGB channel lies in [0, 1]. */
export function inGamut(lab: Oklab): boolean {
	return oklabToLinear(lab).every((channel) => channel >= 0 && channel <= 1);
}

/** Parses 6 hex digits without `#`. */
export function hexToOklab(hex: string): Oklab {
	if (!isHex(hex)) {
		throw new RangeError(`Invalid HEX color: ${hex}`);
	}
	const n = parseInt(hex, 16);
	return linearToOklab(
		decode(((n >> 16) & 255) / 255),
		decode(((n >> 8) & 255) / 255),
		decode((n & 255) / 255)
	);
}

/**
 * Brings a color into the sRGB gamut by lowering chroma while keeping
 * lightness and hue: (a, b) is scaled by a factor found by bisection.
 */
export function gamutMap(lab: Oklab): Oklab {
	if (lab.L >= 1) return { L: 1, a: 0, b: 0 };
	if (lab.L <= 0) return { L: 0, a: 0, b: 0 };
	if (inGamut(lab)) return lab;
	let lo = 0;
	let hi = 1;
	for (let i = 0; i < GAMUT_STEPS; i++) {
		const mid = (lo + hi) / 2;
		if (inGamut({ L: lab.L, a: lab.a * mid, b: lab.b * mid })) lo = mid;
		else hi = mid;
	}
	return { L: lab.L, a: lab.a * lo, b: lab.b * lo };
}

/** Gamut-maps, then writes 6 lowercase hex digits without `#` (ENG-05). */
export function oklabToHex(lab: Oklab): string {
	return oklabToLinear(gamutMap(lab))
		.map((channel) =>
			Math.round(encode(Math.min(1, Math.max(0, channel))) * 255)
				.toString(16)
				.padStart(2, '0')
		)
		.join('');
}

export function oklabToOklch({ L, a, b }: Oklab): Oklch {
	const h = (Math.atan2(b, a) * 180) / Math.PI;
	return { l: L, c: Math.sqrt(a * a + b * b), h: (h + 360) % 360 };
}

export function oklchToOklab({ l, c, h }: Oklch): Oklab {
	const rad = (h * Math.PI) / 180;
	return { L: l, a: c * Math.cos(rad), b: c * Math.sin(rad) };
}

export function hexToOklch(hex: string): Oklch {
	return oklabToOklch(hexToOklab(hex));
}

export function oklchToHex(lch: Oklch): string {
	return oklabToHex(oklchToOklab(lch));
}

/** Euclidean distance in OKLab (deltaE OK). */
export function deltaEOK(p: Oklab, q: Oklab): number {
	return Math.sqrt((p.L - q.L) ** 2 + (p.a - q.a) ** 2 + (p.b - q.b) ** 2);
}

/**
 * Interpolates in OKLCH: lightness and chroma linearly, hue along the shorter
 * arc. A near-achromatic endpoint takes the other endpoint's hue, unless both are.
 */
export function mixOklch(p: Oklab, q: Oklab, t: number): Oklab {
	const c1 = Math.sqrt(p.a * p.a + p.b * p.b);
	const c2 = Math.sqrt(q.a * q.a + q.b * q.b);
	let h1 = Math.atan2(p.b, p.a);
	let h2 = Math.atan2(q.b, q.a);
	if (c1 < ACHROMATIC_C && c2 >= ACHROMATIC_C) h1 = h2;
	else if (c2 < ACHROMATIC_C && c1 >= ACHROMATIC_C) h2 = h1;
	let dh = h2 - h1;
	if (dh > Math.PI) dh -= 2 * Math.PI;
	else if (dh <= -Math.PI) dh += 2 * Math.PI;
	const h = h1 + dh * t;
	const c = c1 + (c2 - c1) * t;
	return { L: p.L + (q.L - p.L) * t, a: c * Math.cos(h), b: c * Math.sin(h) };
}
