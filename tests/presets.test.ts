import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import presets from '../src/lib/presets/presets.json' with { type: 'json' };
import { representativePresets } from './fixtures/presets';

const categories: Record<string, string> = {
	Ponsel: 'phone',
	Tablet: 'tablet',
	Laptop: 'laptop',
	Desktop: 'desktop'
};

/** Rows of the PRD Appendix A table, e.g. | `ios-69` | Ponsel | … | 1320 × 2868 |. */
function appendixA() {
	const prd = readFileSync(new URL('../docs/PRD.md', import.meta.url), 'utf8');
	const appendix = prd.slice(prd.indexOf('## Lampiran A'), prd.indexOf('## Lampiran B'));
	return [...appendix.matchAll(/^\| `([a-z0-9-]+)` \| (\w+) \|.*\| (\d+) × (\d+) \|$/gm)].map(
		([, id, category, width, height]) => ({
			id,
			category: categories[category],
			width: Number(width),
			height: Number(height)
		})
	);
}

describe('presets.json (DEV-02, PRD Appendix A)', () => {
	it('holds the 28 presets of Appendix A in its order, with its categories and sizes', () => {
		const rows = appendixA();
		expect(rows).toHaveLength(28);
		expect(presets).toEqual(rows);
	});

	it('has unique IDs', () => {
		expect(new Set(presets.map(({ id }) => id)).size).toBe(presets.length);
	});

	it('writes phones and tablets portrait, laptops and desktops landscape', () => {
		for (const { category, width, height } of presets) {
			const portrait = category === 'phone' || category === 'tablet';
			expect(portrait ? height > width : width > height).toBe(true);
		}
	});

	it('contains the 6 representative presets (PAT-10)', () => {
		for (const [id, size] of Object.entries(representativePresets)) {
			const preset = presets.find((p) => p.id === id);
			expect({ width: preset?.width, height: preset?.height }).toEqual(size);
		}
		expect(Object.keys(representativePresets)).toHaveLength(6);
	});
});
