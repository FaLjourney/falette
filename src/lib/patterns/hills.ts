import { mulberry32 } from '../engine/prng';
import { el, num } from '../engine/svg';
import type { NumberParamDef, Params, PatternModule } from '../engine/types';

const LAYERS: NumberParamDef = { type: 'number', min: 3, max: 10, step: 1, default: 5 };
const HEIGHT: NumberParamDef = { type: 'number', min: 0, max: 1, step: 0.05, default: 0.5 };
const SOFTNESS: NumberParamDef = { type: 'number', min: 0, max: 1, step: 0.05, default: 0.6 };

// Tuning constants. Changing any of them changes outputs: after the public release that needs an
// engine version bump (SHR-03); before the release the version stays 1.

/** Floor of the back ridge as a share of the height: it stays above it at every seed and param, so hills always cover the bottom 30% (DEV-05). */
const FLOOR = 0.3;
/** Main peak of the back ridge at height 0, as a share of the height. */
const LOW_TOP = 0.38;
/** Main peak of the back ridge at height 1, as a share of the longer side: half the height on portrait and square screens, which keeps the top half free for the lock-screen clock. */
const CAP = 0.5;
/** ...and at most this share of the height, reached on screens 1.4:1 and wider. */
const CAP_HEIGHT = 0.7;
/** Lowest main peak of the front layer the seed can pick, as a share of the back one. */
const FRONT_MIN = 0.15;
/** Highest main peak of the front layer the seed can pick, as a share of the back one: the strongest seed axis, low enough that the front layer seldom covers over half of the hills. */
const FRONT_MAX = 0.6;
/** Strongest uneven spacing of the main peaks: they crowd towards the front layer above 0 and towards the back below 0; every step stays at least 40% of an even one. */
const TAPER = 0.6;
/** Smallest distance from a peak to the next valley on the back ridge, as a share of the height: many small hills. */
const SPACING_MIN = 0.15;
/** Largest distance from a peak to the next valley on the back ridge, as a share of the height: a few broad hills. */
const SPACING_MAX = 0.45;
/** Widening of the hills from the back layer to the front one: twice as wide at 1. */
const GROW = 1;
/** Shallowest valleys the seed can pick, as a share of the room below each main peak (down to FLOOR for the back ridge, to the bottom edge for the others). */
const DEEP_MIN = 0.25;
/** Deepest valleys the seed can pick, on the same scale: below 1, so the back ridge stays above FLOOR and the others above the bottom edge. */
const DEEP_MAX = 0.85;
/** Irregularity of each ridge: spacing varies by up to ±35%, other peaks drop and valleys rise by up to 35% of the depth. */
const IRREGULAR = 0.35;

/** A peak or valley of a ridge: `x` across the canvas, `h` its height above the bottom edge. */
export interface Point {
	x: number;
	h: number;
}

/**
 * One layer of hills, painted back to front. `band` indexes the pattern colors. `points` alternate
 * between peaks and valleys from left to right: the first lies on or left of the left edge and the
 * last on or right of the right edge. The highest one is the main peak, always on the canvas.
 */
export interface Ridge {
	band: number;
	points: Point[];
}

/** A cubic Bézier piece of a ridge: start, two control points and end, heights above the bottom edge. */
export type Segment = [Point, Point, Point, Point];

/** Interpolation that returns exactly `a` at t = 0 and exactly `b` at t = 1. */
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

/** Point between `a` and `b`; equal coordinates stay exactly equal. */
const mix = (a: Point, b: Point, t: number): Point => ({
	x: a.x + (b.x - a.x) * t,
	h: a.h + (b.h - a.h) * t
});

/**
 * Peaks and valleys of one ridge: its main peak at `mainX`, then alternating valleys and peaks
 * outwards on both sides until past the edges. The spacing and the drop of each point come from
 * `next`, the ridge's own stream, so the number of points can follow the canvas width.
 */
function ridgePoints(
	width: number,
	mainX: number,
	top: number,
	depth: number,
	half: number,
	next: () => number
): Point[] {
	const side = (direction: 1 | -1): Point[] => {
		const out: Point[] = [];
		let x = mainX;
		let peak = true;
		while (direction > 0 ? x < width : x > 0) {
			x += direction * half * (1 + IRREGULAR * (2 * next() - 1));
			peak = !peak;
			const drop = IRREGULAR * next();
			out.push({ x, h: top - depth * (peak ? drop : 1 - drop) });
		}
		return out;
	};
	const right = side(1);
	const left = side(-1);
	return [...left.reverse(), { x: mainX, h: top }, ...right];
}

/**
 * Geometry of the hills, back layer first. It depends only on the canvas size, the params and the
 * seed, never on colors, so light and dark variants match (MODE-01). Softness only bends the curve
 * between these points (see `curve`).
 */
export function layout(width: number, height: number, params: Params, rng: () => number): Ridge[] {
	const n = Number(params.layers);
	const rise = Number(params.height);

	// Seed: exactly 24 draws, in this order, before anything the params touch. Each of the
	// LAYERS.max slots gets its main peak and a stream for the rest of its ridge.
	const spacingDraw = rng();
	const deep = lerp(DEEP_MIN, DEEP_MAX, rng());
	const front = lerp(FRONT_MIN, FRONT_MAX, rng());
	const taper = TAPER * (2 * rng() - 1);
	const slots = Array.from({ length: LAYERS.max }, () => ({
		main: rng(),
		stream: (rng() * 2 ** 32) >>> 0
	}));

	// Main peak of the back ridge, the highest point of the hills. The seed only sets the depth of
	// its valleys, as a share of the room above FLOOR, so the hills cover the bottom FLOOR of the
	// height at every seed, and softness never takes the curve past its points (see `curve`).
	const cap = Math.min(CAP_HEIGHT * height, CAP * Math.max(width, height));
	const top = lerp(LOW_TOP * height, cap, rise);
	const half = lerp(SPACING_MIN, SPACING_MAX, spacingDraw) * height;

	// The main peaks step down from the back to the front layer, evenly at taper 0; |taper| < 1 keeps
	// every step positive, so each layer rises above all layers in front of it at its main peak.
	// The back and front ridges take slots 0 and 1, so layers only adds ridges between them.
	const ridges: Ridge[] = [];
	for (let i = 0; i < n; i++) {
		const t = i / (n - 1);
		const share = t + taper * t * (1 - t);
		const peak = top * (1 - (1 - front) * share);
		const depth = deep * (i === 0 ? top - FLOOR * height : peak);
		const slot = slots[i === 0 ? 0 : i === n - 1 ? 1 : i + 1];
		ridges.push({
			band: i,
			points: ridgePoints(
				width,
				width * slot.main,
				peak,
				depth,
				half * (1 + GROW * share),
				mulberry32(slot.stream)
			)
		});
	}
	return ridges;
}

/** Parameter t at which a segment, monotone in x, crosses the vertical line at `x`. */
function crossing([p0, p1, p2, p3]: Segment, x: number): number {
	let lo = 0;
	let hi = 1;
	for (let i = 0; i < 52; i++) {
		const t = (lo + hi) / 2;
		const u = 1 - t;
		const at = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
		if (at < x) lo = t;
		else hi = t;
	}
	return (lo + hi) / 2;
}

/** The two halves of a segment split at t (de Casteljau). */
function split([p0, p1, p2, p3]: Segment, t: number): [Segment, Segment] {
	const a = mix(p0, p1, t);
	const b = mix(p1, p2, t);
	const c = mix(p2, p3, t);
	const d = mix(a, b, t);
	const e = mix(b, c, t);
	const f = mix(d, e, t);
	return [
		[p0, a, d, f],
		[f, e, c, p3]
	];
}

/**
 * The ridge as cubic Bézier segments from the left edge to the right edge. Each segment joins two
 * neighbouring points with level control handles of `softness / 2` times their distance: straight
 * flanks and sharp tips at 0, round tops at about 0.7, broad tops at 1, where the handles meet.
 * Level handles keep every segment between the heights of its ends, so the curve never dips
 * below its lowest valley or rises above its main peak. Segments reaching past an edge are cut
 * there, so nothing is drawn outside the viewBox and editors show what browsers show (ENG-01).
 */
export function curve(points: Point[], width: number, softness: number): Segment[] {
	const k = softness / 2;
	const out: Segment[] = [];
	for (let j = 1; j < points.length; j++) {
		const a = points[j - 1];
		const b = points[j];
		if (b.x <= 0 || a.x >= width) continue;
		const run = b.x - a.x;
		let segment: Segment = [a, { x: a.x + k * run, h: a.h }, { x: b.x - k * run, h: b.h }, b];
		if (a.x < 0) {
			segment = split(segment, crossing(segment, 0))[1];
			segment[0] = { x: 0, h: segment[0].h };
		}
		if (b.x > width) {
			segment = split(segment, crossing(segment, width))[0];
			segment[3] = { x: width, h: segment[3].h };
		}
		out.push(segment);
	}
	return out;
}

/** One layer as a closed path: along the ridge from the left edge to the right edge, then along the bottom edge. */
function ridgePath(segments: Segment[], width: number, height: number): string {
	const at = ({ x, h }: Point) => `${num(x)} ${num(height - h)}`;
	let d = `M0 ${num(height)}L${at(segments[0][0])}`;
	for (const [, c1, c2, end] of segments) d += `C${at(c1)} ${at(c2)} ${at(end)}`;
	return `${d}L${num(width)} ${num(height)}Z`;
}

/** Stacked minimalist hills rising from the bottom edge (catalog #15b). */
const hills: PatternModule = {
	id: 'hills',
	name: 'Hills',
	category: 'landscape',
	params: { layers: LAYERS, height: HEIGHT, softness: SOFTNESS },
	colorCount: (params) => Number(params.layers),
	generate({ width, height, params, rng, background, colors }) {
		const softness = Number(params.softness);
		let out = el('rect', { width, height, fill: background });
		for (const { band, points } of layout(width, height, params, rng)) {
			const d = ridgePath(curve(points, width, softness), width, height);
			out += el('path', { d, fill: colors[band] });
		}
		return out;
	}
};

export default hills;
