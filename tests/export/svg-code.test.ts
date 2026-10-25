import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { formatSvg } from '../../src/lib/export/svg-code';

const snapshotDir = fileURLToPath(new URL('../engine/__snapshots__', import.meta.url));

/** Every ENG-08 snapshot: engine output of all patterns, presets, variants and extra cases. */
const snapshots = readdirSync(snapshotDir, { recursive: true, withFileTypes: true })
	.filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
	.map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8'));

describe('formatSvg (EXP-03)', () => {
	it('reads all engine snapshots', () => {
		expect(snapshots.length).toBeGreaterThanOrEqual(266);
	});

	it('gives the render() string itself as Ringkas', () => {
		for (const svg of snapshots) {
			expect(formatSvg(svg, 'compact')).toBe(svg);
		}
	});

	it('turns Rapi back into the exact render() string', () => {
		for (const svg of snapshots) {
			const pretty = formatSvg(svg, 'pretty');
			expect(formatSvg(pretty, 'compact')).toBe(svg);
			expect(formatSvg(pretty, 'pretty')).toBe(pretty);
		}
	});

	it('puts one tag per line, indented 2 spaces per nesting level', () => {
		for (const svg of snapshots) {
			const lines = formatSvg(svg, 'pretty').split('\n');
			expect(lines).toHaveLength(svg.match(/<[^>]+>/g)?.length ?? 0);
			let depth = 0;
			for (const line of lines) {
				const tag = line.trimStart();
				if (tag.startsWith('</')) {
					depth--;
				}
				expect(line).toBe('  '.repeat(depth) + tag);
				expect(tag).toMatch(/^<[^>]+>$/);
				if (!tag.startsWith('</') && !tag.endsWith('/>')) {
					depth++;
				}
			}
			expect(depth).toBe(0);
			expect(lines[0]).toMatch(/^<svg /);
			expect(lines.at(-1)).toBe('</svg>');
		}
	});

	it('nests gradient stops under defs and the gradient', () => {
		const svg =
			'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">' +
			'<defs><linearGradient id="g1"><stop offset="0%" stop-color="#ffffff"/></linearGradient>' +
			'</defs><rect width="10" height="10" fill="url(#g1)"/></svg>';
		expect(formatSvg(svg, 'pretty')).toBe(
			[
				'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">',
				'  <defs>',
				'    <linearGradient id="g1">',
				'      <stop offset="0%" stop-color="#ffffff"/>',
				'    </linearGradient>',
				'  </defs>',
				'  <rect width="10" height="10" fill="url(#g1)"/>',
				'</svg>'
			].join('\n')
		);
	});

	it('keeps escaped attribute values intact', () => {
		const svg = '<svg id="a&quot;&lt;b&gt;"><rect fill="#000"/></svg>';
		expect(formatSvg(formatSvg(svg, 'pretty'), 'compact')).toBe(svg);
	});

	it('rejects text between tags instead of guessing', () => {
		expect(() => formatSvg('<svg>text</svg>', 'pretty')).toThrow();
		expect(() => formatSvg('<svg><rect/></svg>tail', 'compact')).toThrow();
		expect(() => formatSvg('lead<svg/>', 'compact')).toThrow();
	});
});
