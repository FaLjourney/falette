import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import { representativePresets } from '../fixtures/presets';
import {
	snapshotBackground,
	snapshotPalette,
	snapshotPatterns,
	snapshotSeeds,
	snapshotVariants
} from '../fixtures/snapshot-patterns';

// ENG-08: fixed seeds must produce identical SVG strings on every build.
// Snapshots are .svg files so they can be opened for the PAT-10 visual check.
describe.each(snapshotPatterns)('snapshot: $id', (pattern) => {
	const cases = snapshotVariants.flatMap((variant) =>
		Object.entries(representativePresets).flatMap(([preset, size]) =>
			snapshotSeeds.map((seed) => ({ variant, preset, size, seed }))
		)
	);

	it.each(cases)('$variant $preset seed $seed', async ({ variant, preset, size, seed }) => {
		const svg = render(
			{
				version: ENGINE_VERSION,
				pattern: pattern.id,
				seed,
				palette: snapshotPalette,
				background: snapshotBackground,
				size,
				params: {},
				variant
			},
			pattern
		);
		await expect(svg).toMatchFileSnapshot(
			`./__snapshots__/${pattern.id}/${variant}/${preset}-${seed}.svg`
		);
	});
});
