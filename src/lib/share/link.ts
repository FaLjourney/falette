import { isHex } from '../engine/color';
import { ENGINE_VERSION } from '../engine/render';
import type {
	NumberParamDef,
	ParamDef,
	ParamSchema,
	ParamValue,
	Params,
	PatternModule
} from '../engine/types';
import presets from '../presets/presets.json' with { type: 'json' };

/** Preview mode in the link (`m`); on mobile `pair` shows as Compare (MODE-03). */
export type ViewMode = 'light' | 'dark' | 'pair';

/** A preset from PRD Appendix A (`d`) or a custom size in px (`w`, `h`, DEV-04). */
export type Device = { preset: string } | { width: number; height: number };

/** Everything a share link carries (PRD Appendix B). The engine version is not part of it. */
export interface Design {
	/** Pattern ID (`p`, PAT-09). */
	pattern: string;
	/** Seed text (`s`), never empty. */
	seed: string;
	/** Light-variant pattern colors as lowercase HEX without `#`, 1–5 entries (`pal`). */
	palette: string[];
	/** `auto` or a light-variant lowercase HEX without `#` (`bg`, COL-05). */
	background: 'auto' | string;
	/** Preview mode (`m`). */
	mode: ViewMode;
	/** Null when the link carries no size, so Create detects the device (HOME-07, DEV-03). */
	device: Device | null;
	/** Every key in the pattern's schema (`x`), as `normalizeParams()` returns them. */
	params: Params;
}

export type LinkNotice =
	/** The link named a pattern this build does not know; Arcs is shown instead (Appendix B). */
	| { type: 'unknown-pattern'; id: string }
	/** The link was written by another engine version; the current engine renders it (SHR-03). */
	| { type: 'version'; version: number };

export interface LinkRead {
	/** Only the keys the link carries in a readable form; Create fills in the rest. */
	design: Partial<Design>;
	notices: LinkNotice[];
}

/** Pattern shown when a link names an unknown pattern (Appendix B). */
export const FALLBACK_PATTERN = 'arcs';

/** Custom size limits per side in px (DEV-04). */
export const CUSTOM_MIN = 320;
export const CUSTOM_MAX = 7680;

const MAX_COLORS = 5;
const MODES: readonly ViewMode[] = ['light', 'dark', 'pair'];
const PRESET_IDS = new Set(presets.map(({ id }) => id));
/** Plain decimals only: `5`, `-1`, `0.62`. No exponents, hex, or empty strings. */
const DECIMAL = /^-?\d+(\.\d+)?$/;
const WHOLE = /^\d+$/;

function decimalsOf(n: number): number {
	return (String(n).split('.')[1] ?? '').length;
}

/**
 * Clamps a number into the range, then snaps it to the nearest step counted from `min`, halves
 * rounded up, written without float noise (0.6, not 0.6000000000000001). The result is always a
 * value the slider can produce.
 */
function snap(def: NumberParamDef, value: number): number {
	const clamped = Math.min(def.max, Math.max(def.min, value));
	const decimals = Math.max(decimalsOf(def.min), decimalsOf(def.step));
	const at = (steps: number) => Number((def.min + steps * def.step).toFixed(decimals));
	const steps = Math.round((clamped - def.min) / def.step);
	return at(steps) > def.max ? at(steps - 1) : at(steps);
}

function normalizeParam(def: ParamDef, value: ParamValue | undefined): ParamValue {
	if (def.type === 'number') {
		return typeof value === 'number' && Number.isFinite(value) ? snap(def, value) : def.default;
	}
	return typeof value === 'string' && def.options.includes(value) ? value : def.default;
}

/**
 * Every key in the schema, in schema order: numbers clamped and snapped to their step, unknown
 * choices and unreadable values replaced by the default, keys outside the schema dropped. Used by
 * both `writeLink()` and `readLink()`, and by the param controls, so a preview and its link always
 * agree (SHR-02).
 */
export function normalizeParams(schema: ParamSchema, raw: Params): Params {
	const params: Params = {};
	for (const [key, def] of Object.entries(schema)) {
		params[key] = normalizeParam(def, Object.hasOwn(raw, key) ? raw[key] : undefined);
	}
	return params;
}

function isWholeSide(n: number): boolean {
	return Number.isInteger(n) && n >= CUSTOM_MIN && n <= CUSTOM_MAX;
}

/**
 * Hash for a share link, without `#` (SHR-01, Appendix B). Writes every key that applies, in a
 * fixed order, and every pattern param. `o` waits for DEV-06 and `fx` for ENG-09.
 */
export function writeLink(design: Design, pattern: PatternModule): string {
	if (pattern.id !== design.pattern) {
		throw new Error(`Pattern module "${pattern.id}" does not match "${design.pattern}"`);
	}
	if (design.seed === '') {
		throw new RangeError('Seed must not be empty');
	}
	const { palette, background, device } = design;
	if (palette.length < 1 || palette.length > MAX_COLORS || !palette.every(isHex)) {
		throw new RangeError(`Palette needs 1 to ${MAX_COLORS} HEX colors: ${palette.join('.')}`);
	}
	if (background !== 'auto' && !isHex(background)) {
		throw new RangeError(`Invalid background: ${background}`);
	}
	const fields: [string, string][] = [
		['v', String(ENGINE_VERSION)],
		['p', design.pattern],
		['s', encodeURIComponent(design.seed)],
		['pal', palette.join('.').toLowerCase()],
		['bg', background.toLowerCase()],
		['m', design.mode]
	];
	if (device !== null && 'preset' in device) {
		if (!PRESET_IDS.has(device.preset)) {
			throw new RangeError(`Unknown preset: ${device.preset}`);
		}
		fields.push(['d', device.preset]);
	} else if (device !== null) {
		if (!isWholeSide(device.width) || !isWholeSide(device.height)) {
			throw new RangeError(`Custom size must be ${CUSTOM_MIN}–${CUSTOM_MAX} px per side`);
		}
		fields.push(['w', String(device.width)], ['h', String(device.height)]);
	}
	const params = normalizeParams(pattern.params, design.params);
	fields.push([
		'x',
		Object.entries(params)
			.map(([key, value]) => `${key}:${value}`)
			.join(',')
	]);
	return fields.map(([key, value]) => `${key}=${value}`).join('&');
}

/** Share link without a language prefix, so it opens in the recipient's language (SHR-02). */
export function shareUrl(origin: string, hash: string): string {
	return `${origin}/create/#${hash}`;
}

/**
 * Decoded values by key; the first occurrence of a key wins. Values that are empty or have broken
 * percent-encoding count as missing.
 */
function readFields(hash: string): Map<string, string> {
	const raw = new Map<string, string>();
	for (const part of (hash.startsWith('#') ? hash.slice(1) : hash).split('&')) {
		const eq = part.indexOf('=');
		if (eq > 0 && !raw.has(part.slice(0, eq))) {
			raw.set(part.slice(0, eq), part.slice(eq + 1));
		}
	}
	const fields = new Map<string, string>();
	for (const [key, value] of raw) {
		try {
			const decoded = decodeURIComponent(value);
			if (decoded !== '') fields.set(key, decoded);
		} catch {
			// Broken percent-encoding: the key counts as missing.
		}
	}
	return fields;
}

/** `x` as raw values; names outside the schema and unreadable numbers are left out. */
function readParams(schema: ParamSchema, x: string | undefined): Params {
	const raw: Params = {};
	const seen = new Set<string>();
	for (const pair of x?.split(',') ?? []) {
		const colon = pair.indexOf(':');
		const name = pair.slice(0, colon);
		const value = pair.slice(colon + 1);
		if (colon < 0 || seen.has(name) || !Object.hasOwn(schema, name)) continue;
		seen.add(name);
		if (schema[name].type === 'choice') {
			raw[name] = value;
		} else if (DECIMAL.test(value)) {
			raw[name] = Number(value);
		}
	}
	return raw;
}

function readSide(value: string | undefined): number | undefined {
	if (value === undefined || !DECIMAL.test(value)) return undefined;
	return Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, Math.round(Number(value))));
}

function readDevice(fields: Map<string, string>): Device | undefined {
	const width = readSide(fields.get('w'));
	const height = readSide(fields.get('h'));
	if (width !== undefined && height !== undefined) return { width, height };
	const preset = fields.get('d');
	return preset !== undefined && PRESET_IDS.has(preset) ? { preset } : undefined;
}

/**
 * Reads a share link hash, with or without `#` (Appendix B). Never throws on the hash: keys that
 * are missing or unreadable are left out of `design`, unknown keys are ignored, params are
 * clamped and snapped, and an unknown pattern falls back to Arcs at its defaults with a notice.
 * `patterns` are the modules Create has loaded and must include Arcs.
 */
export function readLink(hash: string, patterns: readonly PatternModule[]): LinkRead {
	const fallback = patterns.find(({ id }) => id === FALLBACK_PATTERN);
	if (fallback === undefined) {
		throw new Error(`readLink needs the "${FALLBACK_PATTERN}" pattern module`);
	}
	const fields = readFields(hash);
	const design: Partial<Design> = {};
	const notices: LinkNotice[] = [];

	const version = fields.get('v');
	if (version !== undefined && WHOLE.test(version)) {
		const number = Number(version);
		if (Number.isSafeInteger(number) && number !== ENGINE_VERSION) {
			notices.push({ type: 'version', version: number });
		}
	}

	const id = fields.get('p');
	if (id !== undefined) {
		const pattern = patterns.find((candidate) => candidate.id === id);
		if (pattern === undefined) notices.push({ type: 'unknown-pattern', id });
		design.pattern = (pattern ?? fallback).id;
		// After a fallback the link's params belong to another pattern, so Arcs keeps its defaults.
		design.params = pattern
			? normalizeParams(pattern.params, readParams(pattern.params, fields.get('x')))
			: normalizeParams(fallback.params, {});
	}

	const seed = fields.get('s');
	if (seed !== undefined) design.seed = seed;

	const palette = (fields.get('pal')?.split('.') ?? [])
		.filter(isHex)
		.map((hex) => hex.toLowerCase())
		.slice(0, MAX_COLORS);
	if (palette.length > 0) design.palette = palette;

	const background = fields.get('bg');
	if (background === 'auto' || (background !== undefined && isHex(background))) {
		design.background = background.toLowerCase();
	}

	const mode = MODES.find((known) => known === fields.get('m'));
	if (mode !== undefined) design.mode = mode;

	const device = readDevice(fields);
	if (device !== undefined) design.device = device;

	return { design, notices };
}
