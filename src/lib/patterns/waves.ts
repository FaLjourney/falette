import { el, num } from '../engine/svg';
import type { NumberParamDef, Params, PatternModule } from '../engine/types';

const LAYERS: NumberParamDef = { type: 'number', min: 3, max: 12, step: 1, default: 6 };
const AMPLITUDE: NumberParamDef = { type: 'number', min: 0, max: 1, step: 0.05, default: 0.4 };
const FREQUENCY: NumberParamDef = { type: 'number', min: 1, max: 6, step: 1, default: 2 };

// Tuning constants. Changing any of them changes outputs: after the public release that needs an
// engine version bump (SHR-03); before the release the version stays 1.

/** Floor of the back wave as a share of the height: its troughs stay above it at every seed and param, so waves always cover the bottom 30% (DEV-05). */
const FLOOR = 0.3;
/** Highest point of the waves as a share of the longer side: half the height on portrait and square screens, which keeps the top half free for the lock-screen clock. */
const CAP = 0.5;
/** ...and at most this share of the height, reached on screens 1.4:1 and wider. */
const CAP_HEIGHT = 0.7;
/** Half the crest-to-trough height of the front wave at amplitude 0, as a share of the shorter side: a small ripple. */
const AMP_MIN = 0.015;
/** Half the crest-to-trough height of the front wave at amplitude 1, as a share of the shorter side, unless STEEP is lower. */
const AMP_MAX = 0.09;
/** Steepest wave: crest-to-trough height at most this share of the wavelength, so high frequencies do not turn waves into flames. It narrows the amplitude range from frequency 4 on (AMP_MAX binds up to frequency 3). */
const STEEP = 0.6;
/** Smallest amplitude of the back wave the seed can pick, as a share of the front one: calm water in the distance. */
const FADE_MIN = 0.4;
/** Largest amplitude of the back wave the seed can pick, as a share of the front one. */
const FADE_MAX = 0.9;
/** Second harmonic of the wave profile: sharper crests and flatter troughs than a sine, like water. At most (1 - π/6) / 2, so the control points of every quarter-wavelength piece stay between the heights of its ends. */
const SHARP = 0.2;
/** Largest shift of the crests from the back wave to the front one, in wavelengths, either way, before each wave's own shift (JITTER): the crests lean. */
const LEAN = 1;
/** Largest extra shift of each wave, in wavelengths, either way. */
const JITTER = 0.25;
/** Strongest uneven spacing of the waves: they crowd towards the front wave above 0 and towards the back below 0; every step stays at least 60% of an even one. */
const TAPER = 0.4;
/** Highest middle line of the front wave the seed can pick, as a share of the back one: the front wave never covers half of the pattern. */
const FRONT_MAX = 0.4;
/** Clearance of the front wave's troughs above the bottom edge, as a share of the shorter side. */
const BOTTOM = 0.02;
/** A quarter-wavelength node closer than this share of a wavelength to a side edge moves onto the edge, so no piece is almost zero wide. */
const EDGE = 0.001;
/** Most wavelengths across the width: frequency 6 on a screen 8:1 wide. Only Custom strips wider than that (DEV-04 allows 24:1) get longer waves, which keeps their render within ENG-07. */
const MAX_WAVES = 48;

/**
 * One wave, painted back to front. `band` indexes the pattern colors. `mid` is its middle line and
 * `amp` half its crest-to-trough height, both above the bottom edge. `phase` is in wavelengths at
 * the centre of the canvas, where a whole number puts a crest.
 */
export interface Wave {
	band: number;
	mid: number;
	amp: number;
	phase: number;
}

/** Geometry of the waves: the wavelength shared by all of them, and every wave, back first. */
export interface Layout {
	wavelength: number;
	waves: Wave[];
}

/** A point of a wave: `x` across the canvas, `h` its height above the bottom edge. */
export interface Point {
	x: number;
	h: number;
}

/** A cubic Bézier piece of a wave: start, two control points and end. */
export type Segment = [Point, Point, Point, Point];

/** Interpolation that returns exactly `a` at t = 0 and exactly `b` at t = 1. */
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

/** Wave profile at `tau` wavelengths: a crest of 1 + SHARP at whole numbers, a trough of SHARP - 1 halfway. */
export const profile = (tau: number) =>
	Math.cos(2 * Math.PI * tau) + SHARP * Math.cos(4 * Math.PI * tau);

/** Slope of the profile per wavelength. */
const slope = (tau: number) =>
	-2 * Math.PI * (Math.sin(2 * Math.PI * tau) + 2 * SHARP * Math.sin(4 * Math.PI * tau));

/**
 * Geometry of the waves. It depends only on the canvas size, the params and the seed, never on
 * colors, so light and dark variants match (MODE-01).
 */
export function layout(width: number, height: number, params: Params, rng: () => number): Layout {
	const n = Number(params.layers);
	const amplitude = Number(params.amplitude);

	// Seed: exactly 18 draws, in this order, before anything the params touch. Each of the
	// LAYERS.max slots gets its own shift.
	const phase = rng();
	const lean = LEAN * (2 * rng() - 1);
	const taper = TAPER * (2 * rng() - 1);
	const frontDraw = rng();
	const stack = rng();
	const fade = lerp(FADE_MIN, FADE_MAX, rng());
	const shifts = Array.from({ length: LAYERS.max }, () => JITTER * (2 * rng() - 1));

	// Wavelength and amplitude both follow the shorter side, so a wave keeps its shape on every
	// screen: wider screens show more waves instead of wider ones (DEV-05), up to MAX_WAVES.
	const unit = Math.min(width, height);
	const wavelength = Math.max(unit / Number(params.frequency), width / MAX_WAVES);
	// The steepness limit lowers the top of the amplitude range rather than cutting the slider
	// off, so every amplitude step still changes the waves.
	const top = Math.min(AMP_MAX, ((STEEP / 2) * wavelength) / unit);
	const frontAmp = lerp(AMP_MIN, top, amplitude) * unit;
	const backAmp = frontAmp * fade;

	// The back wave sits between the floor and the cap: its troughs stay above FLOOR, and its
	// crests, the highest points of all waves, below the cap. The front wave keeps its troughs
	// BOTTOM above the bottom edge; that clearance stays below FRONT_MAX of the back middle line.
	const cap = Math.min(CAP_HEIGHT * height, CAP * Math.max(width, height));
	const backMid = lerp(FLOOR * height + backAmp * (1 - SHARP), cap - backAmp * (1 + SHARP), stack);
	const frontMid = lerp(frontAmp * (1 - SHARP) + BOTTOM * unit, FRONT_MAX * backMid, frontDraw);

	// Middle lines, amplitudes and the lean all follow the same share, so the crest heights step
	// down evenly from the back wave to the front one: each wave rises above every wave in front of
	// it at its crests. The back and front waves take slots 0 and 1, so layers only adds waves
	// between them.
	const waves: Wave[] = [];
	for (let i = 0; i < n; i++) {
		const t = i / (n - 1);
		const share = t + taper * t * (1 - t);
		waves.push({
			band: i,
			mid: lerp(backMid, frontMid, share),
			amp: lerp(backAmp, frontAmp, share),
			phase: phase + lean * share + shifts[i === 0 ? 0 : i === n - 1 ? 1 : i + 1]
		});
	}
	return { wavelength, waves };
}

/**
 * One wave as cubic Bézier pieces from the left edge to the right edge. Nodes sit at every quarter
 * wavelength (crests, troughs and the points halfway between), so every full wavelength is drawn
 * the same way, and each piece has the slopes of the profile at its ends. The pieces at the edges
 * are cut exactly there, so nothing is drawn outside the viewBox and editors show what browsers
 * show (ENG-01).
 */
export function curve({ wavelength }: Layout, wave: Wave, width: number): Segment[] {
	const tauAt = (x: number) => (x - width / 2) / wavelength + wave.phase;
	const start = tauAt(0);
	const end = tauAt(width);
	const taus: number[] = [];
	for (let k = Math.floor(start * 4) + 1; k / 4 < end; k++) taus.push(k / 4);
	if (taus[0] - start > EDGE) taus.unshift(start);
	if (end - taus[taus.length - 1] > EDGE) taus.push(end);

	const last = taus.length - 1;
	const xAt = (j: number) =>
		j === 0 ? 0 : j === last ? width : width / 2 + (taus[j] - wave.phase) * wavelength;
	const out: Segment[] = [];
	for (let j = 1; j <= last; j++) {
		const [a, b] = [taus[j - 1], taus[j]];
		const [xa, xb] = [xAt(j - 1), xAt(j)];
		const run = xb - xa;
		const ha = wave.mid + wave.amp * profile(a);
		const hb = wave.mid + wave.amp * profile(b);
		const rise = (wave.amp * run) / (3 * wavelength);
		out.push([
			{ x: xa, h: ha },
			{ x: xa + run / 3, h: ha + rise * slope(a) },
			{ x: xb - run / 3, h: hb - rise * slope(b) },
			{ x: xb, h: hb }
		]);
	}
	return out;
}

/**
 * One wave as a closed path: along the wave from the left edge to the right edge, then along the
 * bottom edge. From the second full piece on, each piece is as wide as the one before and meets it
 * with a matching slope, so its first control point mirrors the previous second one and S leaves
 * it out: a third less text for each of those pieces.
 */
function wavePath(segments: Segment[], width: number, height: number): string {
	const at = ({ x, h }: Point) => `${num(x)} ${num(height - h)}`;
	const last = segments.length - 1;
	let d = `M0 ${num(height)}L${at(segments[0][0])}`;
	segments.forEach(([, c1, c2, end], j) => {
		d += j > 1 && j < last ? `S${at(c2)} ${at(end)}` : `C${at(c1)} ${at(c2)} ${at(end)}`;
	});
	return `${d}L${num(width)} ${num(height)}Z`;
}

/** Stacked layers of regular waves rising from the bottom edge (catalog #1). */
const waves: PatternModule = {
	id: 'waves',
	name: 'Waves',
	category: 'landscape',
	params: { layers: LAYERS, amplitude: AMPLITUDE, frequency: FREQUENCY },
	colorCount: (params) => Number(params.layers),
	generate({ width, height, params, rng, background, colors }) {
		const shape = layout(width, height, params, rng);
		let out = el('rect', { width, height, fill: background });
		for (const wave of shape.waves) {
			const d = wavePath(curve(shape, wave, width), width, height);
			out += el('path', { d, fill: colors[wave.band] });
		}
		return out;
	}
};

export default waves;
