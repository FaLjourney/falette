import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import type { PatternModule, Variant } from '../../src/lib/engine/types';
import { representativePresets } from '../fixtures/presets';
import {
	snapshotBackground,
	snapshotExtraCases,
	snapshotExtraPresets,
	snapshotExtraVariants,
	snapshotPalette,
	snapshotPatterns,
	snapshotSeeds,
	snapshotVariants,
	type SnapshotCase
} from '../fixtures/snapshot-patterns';

const snapshotDir = fileURLToPath(new URL('./__snapshots__', import.meta.url));

/** Shared seeds on all presets in both variants, plus the pattern's extra cases on a few. */
function snapshotCases(pattern: PatternModule) {
	const grid = (variants: Variant[], presets: string[], runs: SnapshotCase[]) =>
		variants.flatMap((variant) =>
			presets.flatMap((preset) =>
				runs.map(({ seed, params }) => {
					const label = Object.entries(params)
						.map(([key, value]) => `${key}-${value}`)
						.join('_');
					const name = label === '' ? seed : `${seed}_${label}`;
					const file = `${pattern.id}/${variant}/${preset}-${name}.svg`;
					return { variant, preset, size: representativePresets[preset], seed, params, name, file };
				})
			)
		);
	return [
		...grid(
			snapshotVariants,
			Object.keys(representativePresets),
			snapshotSeeds.map((seed) => ({ seed, params: {} }))
		),
		...grid(snapshotExtraVariants, snapshotExtraPresets, snapshotExtraCases[pattern.id] ?? [])
	];
}

// ENG-08: fixed seeds must produce identical SVG strings on every build.
// Snapshots are .svg files so they can be opened for the PAT-10 visual check.
describe.each(snapshotPatterns)('snapshot: $id', (pattern) => {
	it.each(snapshotCases(pattern))(
		'$variant $preset seed $name',
		async ({ variant, size, seed, params, file }) => {
			const svg = render(
				{
					version: ENGINE_VERSION,
					pattern: pattern.id,
					seed,
					palette: snapshotPalette,
					background: snapshotBackground,
					size,
					params,
					variant
				},
				pattern
			);
			await expect(svg).toMatchFileSnapshot(join(snapshotDir, file));
		}
	);
});

// Vitest never reports file snapshots as obsolete, so a file no case writes any more fails here.
it('keeps no orphan snapshot files', () => {
	const expected = new Set(
		snapshotPatterns.flatMap((pattern) => snapshotCases(pattern).map(({ file }) => file))
	);
	const orphans = readdirSync(snapshotDir, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile())
		.map((entry) => relative(snapshotDir, join(entry.parentPath, entry.name)).split(sep).join('/'))
		.filter((file) => !expected.has(file));
	expect(orphans).toEqual([]);
});
