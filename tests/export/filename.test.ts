import { describe, expect, it } from 'vitest';
import { hashSeed } from '../../src/lib/engine/prng';
import type { Variant } from '../../src/lib/engine/types';
import { exportFileName, fileSafeSeed, type ExportFormat } from '../../src/lib/export/filename';

const patterns = ['arcs', 'hills', 'waves', 'gradient'];
const variants: Variant[] = ['light', 'dark'];
const formats: ExportFormat[] = ['png', 'svg'];

describe('exportFileName (EXP-05)', () => {
	it('matches the example in the Export panel wireframe', () => {
		expect(
			exportFileName({
				pattern: 'arcs',
				variant: 'light',
				width: 1206,
				height: 2622,
				seed: '42',
				format: 'png'
			})
		).toBe('falette-arcs-light-1206x2622-42.png');
	});

	it('writes pattern, mode, size, seed and extension for every pattern, variant and format', () => {
		for (const pattern of patterns) {
			for (const variant of variants) {
				for (const format of formats) {
					expect(
						exportFileName({ pattern, variant, width: 3440, height: 1440, seed: '7', format })
					).toBe(`falette-${pattern}-${variant}-3440x1440-7.${format}`);
				}
			}
		}
	});

	it('writes the size of the file, so a scaled-down PNG names its own size', () => {
		const name = exportFileName({
			pattern: 'waves',
			variant: 'dark',
			width: 4096,
			height: 4096,
			seed: '42',
			format: 'png'
		});
		expect(name).toBe('falette-waves-dark-4096x4096-42.png');
	});

	it('rejects sizes that are not whole positive pixels', () => {
		for (const [width, height] of [
			[0, 100],
			[100, -1],
			[100.5, 100],
			[100, NaN]
		]) {
			expect(() =>
				exportFileName({
					pattern: 'arcs',
					variant: 'light',
					width,
					height,
					seed: '1',
					format: 'png'
				})
			).toThrow(RangeError);
		}
	});
});

describe('fileSafeSeed (EXP-05)', () => {
	it('keeps numeric and word seeds as they are', () => {
		expect(fileSafeSeed('42')).toBe('42');
		expect(fileSafeSeed('0')).toBe('0');
		expect(fileSafeSeed('senja-teduh-42')).toBe('senja-teduh-42');
		expect(fileSafeSeed('under_score')).toBe('under_score');
	});

	it('keeps case, since seeds are case-sensitive', () => {
		expect(fileSafeSeed('Senja')).toBe('Senja');
		expect(fileSafeSeed('senja')).toBe('senja');
	});

	it('replaces each run of unsafe characters with one hyphen', () => {
		expect(fileSafeSeed('a/b:c')).toBe('a-b-c');
		expect(fileSafeSeed('a\\b*c?d"e<f>g|h')).toBe('a-b-c-d-e-f-g-h');
		expect(fileSafeSeed('two  words')).toBe('two-words');
		expect(fileSafeSeed('tab\tand\nnewline\u0000nul')).toBe('tab-and-newline-nul');
		expect(fileSafeSeed('1.5')).toBe('1-5');
		expect(fileSafeSeed('a--b')).toBe('a-b');
	});

	it('trims hyphens at both ends, so no path or hidden-file prefix survives', () => {
		expect(fileSafeSeed('../../x')).toBe('x');
		expect(fileSafeSeed('.hidden')).toBe('hidden');
		expect(fileSafeSeed('  42  ')).toBe('42');
		expect(fileSafeSeed('-42-')).toBe('42');
	});

	it('keeps letters, marks and digits of any script, normalized to NFC', () => {
		expect(fileSafeSeed('ñandú')).toBe('ñandú');
		expect(fileSafeSeed('n\u0303andu\u0301')).toBe('ñandú');
		expect(fileSafeSeed('日本-晴れ')).toBe('日本-晴れ');
		expect(fileSafeSeed('สวัสดี')).toBe('สวัสดี');
		expect(fileSafeSeed('٤٢')).toBe('٤٢');
	});

	it('caps the seed at 64 code points without splitting a surrogate pair', () => {
		expect(fileSafeSeed('a'.repeat(100))).toBe('a'.repeat(64));
		const astral = '𝟘'.repeat(70);
		const capped = fileSafeSeed(astral);
		expect(Array.from(capped)).toHaveLength(64);
		expect(capped).toBe('𝟘'.repeat(64));
		expect(fileSafeSeed(`${'a'.repeat(63)}/b`)).toBe('a'.repeat(63));
	});

	it('falls back to the seed hash in base 36 when nothing safe is left', () => {
		for (const seed of ['🌅🌅', '///', '', '...', ' ']) {
			expect(fileSafeSeed(seed)).toBe(hashSeed(seed).toString(36));
		}
		expect(fileSafeSeed('🌅')).not.toBe(fileSafeSeed('🌊'));
	});

	it('never leaves a character outside the safe set', () => {
		const samples = [
			'a/b',
			'..',
			'C:\\x',
			'😀x😀',
			'x y',
			'%20',
			'#1',
			'&?=',
			'é'.normalize('NFD')
		];
		for (const seed of samples) {
			expect(fileSafeSeed(seed)).toMatch(
				/^[\p{L}\p{M}\p{N}_](?:[\p{L}\p{M}\p{N}_-]*[\p{L}\p{M}\p{N}_])?$/u
			);
		}
	});
});
