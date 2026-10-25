import { gamutMap, hexToOklab, mixOklch, oklabToHex } from '../engine/color';
import { hashSeed } from '../engine/prng';
import { el, num } from '../engine/svg';
import type { ChoiceParamDef, NumberParamDef, Params, PatternModule } from '../engine/types';

const TYPE: ChoiceParamDef = { type: 'choice', options: ['linear', 'radial'], default: 'linear' };
const ANGLE: NumberParamDef = { type: 'number', min: 0, max: 360, step: 1, default: 135 };
const SPREAD: NumberParamDef = { type: 'number', min: 0, max: 1, step: 0.05, default: 0.5 };

// Tuning constants. Changing any of them changes outputs: after the public release that needs an
// engine version bump (SHR-03); before the release the version stays 1.

/** Pattern colors: every palette slot, with ENG-11 gradations filling smaller palettes. */
const COLORS = 5;
/** Width of the transition zone at spread 0, as a share of the gradient; spread 1 spans all of it. */
const ZONE_MIN = 0.25;
/** Farthest shift of the linear zone the seed can pick, as a share of the room left on either side. */
const SHIFT = 0.75;
/** Spread of the raw gaps between stops the seed can pick: from 1 - GAP_VAR to 1 + GAP_VAR. */
const GAP_VAR = 0.9;
/** Bunching exponent of the stops ranges over e^±BUNCH (0.45 to 2.23): the stops crowd towards the background end or the far end, so a different color dominates. */
const BUNCH = 0.8;
/** Smallest gap between neighbouring stops, as a share of the zone, so no color vanishes into a hard edge. */
const MIN_GAP = 0.05;
/** Distance of the radial focal point from the circle centre, as a share of the radius: below 1, so the focal point stays inside the circle (5a). */
const FOCUS = 0.3;
/** Lowest position of the radial focal point the seed can pick, as a share of the width and of the height. */
const FOCAL_MIN = 0.2;
/** Highest position of the radial focal point the seed can pick, as a share of the width and of the height. */
const FOCAL_MAX = 0.8;
/** OKLCH stops between each pair of neighbouring stops: browsers blend SVG stops in sRGB, which dulls the middle (ENG-05). */
const SUBSTOPS = 3;

/** Gradient line in pixels, from the background end to the far end. */
export interface Linear {
	type: 'linear';
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

/** Gradient circle in pixels: the background end on the circle, the far end at the focal point. */
export interface Radial {
	type: 'radial';
	cx: number;
	cy: number;
	r: number;
	fx: number;
	fy: number;
}

/**
 * Geometry of the gradient and the positions of its six main stops (background, then colors 1 to
 * 5) along u: 0 is the background end, 1 the far end (end of the line, or the focal point).
 */
export interface Layout {
	geometry: Linear | Radial;
	offsets: number[];
}

/** A stop at `offset` along u, as `#rrggbb`. */
export interface Stop {
	offset: number;
	color: string;
}

/** Interpolation that returns exactly `a` at t = 0 and exactly `b` at t = 1. */
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

/**
 * Geometry of the gradient. It depends only on the canvas size, the params and the seed, never on
 * colors, so light and dark variants match (MODE-01).
 */
export function layout(width: number, height: number, params: Params, rng: () => number): Layout {
	// Seed: exactly 9 draws, in this order, for both types, so switching the type keeps the stops.
	const gaps = Array.from({ length: COLORS }, () => 1 + GAP_VAR * (2 * rng() - 1));
	const shift = SHIFT * (2 * rng() - 1);
	const bunch = Math.exp(BUNCH * (2 * rng() - 1));
	const focalX = lerp(FOCAL_MIN, FOCAL_MAX, rng()) * width;
	const focalY = lerp(FOCAL_MIN, FOCAL_MAX, rng()) * height;

	// The linear zone sits around the middle of the line, shifted by the seed. The radial zone always
	// ends at the focal point, so the far color never spreads into a flat disc.
	const radial = params.type === 'radial';
	const zone = lerp(ZONE_MIN, 1, Number(params.spread));
	const start = radial ? 1 - zone : (1 - zone) / 2 + (shift * (1 - zone)) / 2;

	// Bunched shares of the zone, then every gap lifted to at least MIN_GAP.
	const total = gaps.reduce((sum, gap) => sum + gap, 0);
	const offsets = [start];
	let raw = 0;
	let before = 0;
	let share = 0;
	for (const gap of gaps) {
		raw += gap;
		const bent = (raw / total) ** bunch;
		share += MIN_GAP + (1 - COLORS * MIN_GAP) * (bent - before);
		before = bent;
		offsets.push(start + zone * share);
	}

	// Angles follow CSS: 0 points up, clockwise, measured in real pixels so nothing is stretched.
	const theta = (Number(params.angle) * Math.PI) / 180;
	const dx = Math.sin(theta);
	const dy = -Math.cos(theta);
	if (!radial) {
		// As in CSS, the line runs through the centre and its ends meet the nearest and farthest corners.
		const half = (width * Math.abs(dx) + height * Math.abs(dy)) / 2;
		return {
			geometry: {
				type: 'linear',
				x1: width / 2 - dx * half,
				y1: height / 2 - dy * half,
				x2: width / 2 + dx * half,
				y2: height / 2 + dy * half
			},
			offsets
		};
	}

	// The circle centre sits FOCUS r behind the focal point, so the far color leans towards the angle.
	// r is the smallest radius that holds every corner: for corner v (from the focal point) it solves
	// |v + FOCUS r d| = r, and the farthest corner lies on the circle.
	let r = 0;
	for (const [x, y] of [
		[0, 0],
		[width, 0],
		[0, height],
		[width, height]
	]) {
		const vx = x - focalX;
		const vy = y - focalY;
		const along = vx * dx + vy * dy;
		const root = Math.sqrt(FOCUS ** 2 * along ** 2 + (1 - FOCUS ** 2) * (vx ** 2 + vy ** 2));
		r = Math.max(r, (FOCUS * along + root) / (1 - FOCUS ** 2));
	}
	return {
		geometry: {
			type: 'radial',
			cx: focalX - FOCUS * r * dx,
			cy: focalY - FOCUS * r * dy,
			r,
			fx: focalX,
			fy: focalY
		},
		offsets
	};
}

/** The main stops with SUBSTOPS OKLCH stops between each pair, from the background end. */
export function stops(offsets: readonly number[], colors: readonly string[]): Stop[] {
	const labs = colors.map((color) => hexToOklab(color.slice(1)));
	const out: Stop[] = [{ offset: offsets[0], color: colors[0] }];
	for (let i = 1; i < colors.length; i++) {
		for (let j = 1; j <= SUBSTOPS; j++) {
			const t = j / (SUBSTOPS + 1);
			out.push({
				offset: lerp(offsets[i - 1], offsets[i], t),
				color: `#${oklabToHex(gamutMap(mixOklch(labs[i - 1], labs[i], t)))}`
			});
		}
		out.push({ offset: offsets[i], color: colors[i] });
	}
	return out;
}

/**
 * Smooth transition between the background and the pattern colors, straight in one direction or
 * radiating from a focal point (catalog #2).
 */
const gradient: PatternModule = {
	id: 'gradient',
	name: 'Gradient',
	category: 'gradient',
	params: { type: TYPE, angle: ANGLE, spread: SPREAD },
	colorCount: () => COLORS,
	generate({ width, height, params, rng, background, colors }) {
		const { geometry, offsets } = layout(width, height, params, rng);
		const { type, ...coords } = geometry;
		const all = stops(offsets, [background, ...colors]);
		// SVG puts offset 0 of a radial gradient at the focal point, the opposite end of u.
		const ordered =
			type === 'radial' ? all.map((s) => ({ ...s, offset: 1 - s.offset })).reverse() : all;
		// Percent offsets keep 2 decimals of a percent, a hundred times finer than 2 decimals of 1.
		const body = ordered
			.map((s) => el('stop', { offset: `${num(s.offset * 100)}%`, 'stop-color': s.color }))
			.join('');
		const tag = type === 'linear' ? 'linearGradient' : 'radialGradient';
		const attrs = { gradientUnits: 'userSpaceOnUse', ...coords };
		// The ID comes from the gradient itself, so SVGs inlined on one page never borrow each other's.
		const id = `g${hashSeed(el(tag, attrs, body)).toString(36)}`;
		return (
			el('defs', {}, el(tag, { id, ...attrs }, body)) +
			el('rect', { width, height, fill: `url(#${id})` })
		);
	}
};

export default gradient;
