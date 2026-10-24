import type { Params, PatternModule, Variant } from '../../src/lib/engine/types';
import arcs from '../../src/lib/patterns/arcs';
import hills from '../../src/lib/patterns/hills';
import waves from '../../src/lib/patterns/waves';
import { mockPattern } from './mock-pattern';

/** Patterns covered by the ENG-08 snapshot test. */
export const snapshotPatterns: PatternModule[] = [mockPattern, arcs, hills, waves];

/** Fixed seeds shared by all patterns: numeric and word seeds take the same text-hash path. */
export const snapshotSeeds = ['1', '42', 'senja-teduh-42'];

/** A fixed seed with param overrides; params left out use their schema defaults. */
export interface SnapshotCase {
	seed: string;
	params: Params;
}

/** Extra cases run on one phone and one laptop preset, light variant only. */
export const snapshotExtraPresets = ['ios-63', 'mba-13'];
export const snapshotExtraVariants: Variant[] = ['light'];

/** Extra cases per pattern ID, for branches the shared seeds at default params never reach. */
export const snapshotExtraCases: Record<string, SnapshotCase[]> = {
	arcs: [
		// The shared seeds all draw a solid arch: '1234' has an opening, '106' an opening and gaps.
		{ seed: '1234', params: {} },
		{ seed: '106', params: {} },
		{ seed: '42', params: { layers: 3 } },
		{ seed: '42', params: { layers: 12 } },
		{ seed: '42', params: { curve: 0 } },
		{ seed: '42', params: { curve: 1 } },
		{ seed: '42', params: { focus: 0 } },
		{ seed: '42', params: { focus: 1 } },
		{ seed: '42', params: { layers: 12, curve: 1, focus: 1 } }
	],
	hills: [
		// '480' has a high front layer, broad hills, shallow valleys and layers crowding to the front;
		// '299' a low front layer, narrow hills, deep valleys and layers crowding to the back.
		{ seed: '480', params: {} },
		{ seed: '299', params: {} },
		{ seed: '42', params: { layers: 3 } },
		{ seed: '42', params: { layers: 10 } },
		{ seed: '42', params: { height: 0 } },
		{ seed: '42', params: { height: 1 } },
		{ seed: '42', params: { softness: 0 } },
		{ seed: '42', params: { softness: 1 } },
		{ seed: '42', params: { layers: 3, height: 0, softness: 0 } },
		{ seed: '42', params: { layers: 10, height: 1, softness: 1 } }
	],
	waves: [
		// The shared seeds all lean one way. '603' leans the other way, with a high stack, a high front
		// wave, waves crowding to the front and a calm back wave; '965' leans further the first way,
		// with a low stack, a low front wave, waves crowding to the back and a lively back wave.
		{ seed: '603', params: {} },
		{ seed: '965', params: {} },
		{ seed: '42', params: { layers: 3 } },
		{ seed: '42', params: { layers: 12 } },
		{ seed: '42', params: { amplitude: 0 } },
		{ seed: '42', params: { amplitude: 1 } },
		{ seed: '42', params: { frequency: 1 } },
		{ seed: '42', params: { frequency: 6 } },
		{ seed: '42', params: { layers: 3, amplitude: 0, frequency: 1 } },
		{ seed: '42', params: { layers: 12, amplitude: 1, frequency: 6 } }
	]
};

/** The shared seeds run on every representative preset in both variants (PAT-10). */
export const snapshotVariants: Variant[] = ['light', 'dark'];

/** Palette and background from the PRD Appendix B example link. */
export const snapshotPalette = ['e07a5f', '3d405b', '81b29a'];
export const snapshotBackground = 'f4efe6';
