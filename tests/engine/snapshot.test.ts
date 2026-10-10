import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import { representativePresets } from '../fixtures/presets';
import { snapshotPatterns, snapshotSeeds } from '../fixtures/snapshot-patterns';

// ENG-08: fixed seeds must produce identical SVG strings on every build.
// Snapshots are .svg files so they can be opened for the PAT-10 visual check.
describe.each(snapshotPatterns)('snapshot: $id', (pattern) => {
	const presets = Object.entries(representativePresets);

	it.each(
		presets.flatMap(([preset, size]) => snapshotSeeds.map((seed) => ({ preset, size, seed })))
	)('$preset seed $seed', async ({ preset, size, seed }) => {
		const svg = render(
			{
				version: ENGINE_VERSION,
				pattern: pattern.id,
				seed,
				palette: [],
				background: 'auto',
				size,
				params: {},
				variant: 'light'
			},
			pattern
		);
		await expect(svg).toMatchFileSnapshot(`./__snapshots__/${pattern.id}/${preset}-${seed}.svg`);
	});
});
