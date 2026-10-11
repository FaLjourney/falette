import type { PatternModule, Variant } from '../../src/lib/engine/types';
import { mockPattern } from './mock-pattern';

/** Patterns covered by the ENG-08 snapshot test. Real patterns join this list in step 3. */
export const snapshotPatterns: PatternModule[] = [mockPattern];

/** Fixed seeds: numeric and word seeds take the same text-hash path. */
export const snapshotSeeds = ['1', '42', 'senja-teduh-42'];

/** Both wallpaper variants are checked for every case (PAT-10). */
export const snapshotVariants: Variant[] = ['light', 'dark'];

/** Palette and background from the PRD Appendix B example link. */
export const snapshotPalette = ['e07a5f', '3d405b', '81b29a'];
export const snapshotBackground = 'f4efe6';
