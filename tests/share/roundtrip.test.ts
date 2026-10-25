import { describe, expect, it } from 'vitest';
import { render } from '../../src/lib/engine/render';
import type { ParamValue, Params, PatternModule } from '../../src/lib/engine/types';
import arcs from '../../src/lib/patterns/arcs';
import gradient from '../../src/lib/patterns/gradient';
import hills from '../../src/lib/patterns/hills';
import waves from '../../src/lib/patterns/waves';
import {
	normalizeParams,
	readLink,
	shareUrl,
	writeLink,
	type Design,
	type Device
} from '../../src/lib/share/link';
import { representativePresets } from '../fixtures/presets';
import {
	snapshotBackground,
	snapshotExtraCases,
	snapshotPalette,
	snapshotSeeds
} from '../fixtures/snapshot-patterns';
import { designConfig } from '../fixtures/design-config';

const patterns: PatternModule[] = [arcs, hills, waves, gradient];
const seeds = [...snapshotSeeds, 'a+b & c=d#é 😀'];
const devices: (Device | null)[] = [
	...Object.keys(representativePresets).map((preset) => ({ preset })),
	{ width: 3000, height: 2000 },
	null
];

/** Defaults, every param at its min (first option), every param at its max (last option), and the ENG-08 extra cases. */
function paramSets(pattern: PatternModule): Params[] {
	const pick = (end: 'min' | 'max') =>
		Object.fromEntries(
			Object.entries(pattern.params).map(([key, def]): [string, ParamValue] => [
				key,
				def.type === 'number' ? def[end] : def.options[end === 'min' ? 0 : def.options.length - 1]
			])
		);
	const raw = [
		{},
		pick('min'),
		pick('max'),
		...snapshotExtraCases[pattern.id].map((c) => c.params)
	];
	return raw.map((params) => normalizeParams(pattern.params, params));
}

function design(
	pattern: PatternModule,
	seed: string,
	params: Params,
	device: Device | null
): Design {
	return {
		pattern: pattern.id,
		seed,
		palette: snapshotPalette,
		background: snapshotBackground,
		mode: 'pair',
		device,
		params
	};
}

/**
 * Writes the link, copies it as a URL, and reads back the hash a browser would give. A link
 * without a size reads back without a device, which Create treats as null (DEV-03).
 */
function share(original: Design, pattern: PatternModule) {
	const hash = writeLink(original, pattern);
	const url = new URL(shareUrl('https://falette.vercel.app', hash));
	const { design: read, notices } = readLink(url.hash, patterns);
	return { hash, copy: { device: null, ...read } as Design, notices };
}

// SHR-02: opening a link gives the identical design.
describe.each(patterns)('share link round trip: $id', (pattern) => {
	it('reads back the same design and writes the same link again', () => {
		const cases = paramSets(pattern).flatMap((params) =>
			seeds.flatMap((seed) => devices.map((device) => design(pattern, seed, params, device)))
		);
		for (const original of cases) {
			const { hash, copy, notices } = share(original, pattern);
			expect(copy).toEqual(original);
			expect(notices).toEqual([]);
			expect(writeLink(copy, pattern)).toBe(hash);
		}
	});

	it('renders the same SVG for every param set and seed, in both variants', () => {
		for (const params of paramSets(pattern)) {
			for (const seed of seeds) {
				const original = design(pattern, seed, params, { preset: 'ios-63' });
				const { copy } = share(original, pattern);
				for (const variant of ['light', 'dark'] as const) {
					expect(render(designConfig(copy, variant), pattern)).toBe(
						render(designConfig(original, variant), pattern)
					);
				}
			}
		}
	});

	it('renders the same SVG on every representative preset and a custom size', () => {
		for (const device of devices) {
			const original = design(pattern, '42', normalizeParams(pattern.params, {}), device);
			const { copy } = share(original, pattern);
			for (const variant of ['light', 'dark'] as const) {
				expect(render(designConfig(copy, variant), pattern)).toBe(
					render(designConfig(original, variant), pattern)
				);
			}
		}
	});
});
