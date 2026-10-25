import { hashSeed } from '../engine/prng';
import type { Variant } from '../engine/types';

export type ExportFormat = 'png' | 'svg';

/** Longest seed part of a file name, in code points. */
const SEED_MAX_LENGTH = 64;

/**
 * Seed text that is safe in a file name: letters, marks, digits, `_` and `-` only, case kept
 * because seeds are case-sensitive. Falls back to the seed hash when nothing is left. The seed
 * itself is never changed (EXP-05).
 */
export function fileSafeSeed(seed: string): string {
	const safe = seed
		.normalize('NFC')
		.replace(/[^\p{L}\p{M}\p{N}_-]+/gu, '-')
		.replace(/-{2,}/g, '-')
		.replace(/^-|-$/g, '');
	const capped = Array.from(safe).slice(0, SEED_MAX_LENGTH).join('').replace(/-$/, '');
	return capped === '' ? hashSeed(seed).toString(36) : capped;
}

export interface ExportFileInfo {
	pattern: string;
	variant: Variant;
	/** Size of the file itself, which is smaller than the design for a scaled-down PNG. */
	width: number;
	height: number;
	seed: string;
	format: ExportFormat;
}

/** `falette-{pattern}-{mode}-{width}x{height}-{seed}.{ext}` (EXP-05). */
export function exportFileName({
	pattern,
	variant,
	width,
	height,
	seed,
	format
}: ExportFileInfo): string {
	for (const side of [width, height]) {
		if (!Number.isInteger(side) || side < 1) {
			throw new RangeError(`File size must be whole pixels: ${width} × ${height}`);
		}
	}
	return `falette-${pattern}-${variant}-${width}x${height}-${fileSafeSeed(seed)}.${format}`;
}
