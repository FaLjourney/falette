import type { PatternModule } from '../../src/lib/engine/types';
import { mockPattern } from './mock-pattern';

/** Patterns covered by the ENG-08 snapshot test. Real patterns join this list in step 3. */
export const snapshotPatterns: PatternModule[] = [mockPattern];

/** Fixed seeds: numeric and word seeds take the same text-hash path. */
export const snapshotSeeds = ['1', '42', 'senja-teduh-42'];
