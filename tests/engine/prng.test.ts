import { describe, expect, it } from 'vitest';
import { createRng, hashSeed } from '../../src/lib/engine/prng';

function take(rng: () => number, n: number): number[] {
	return Array.from({ length: n }, rng);
}

describe('seeded PRNG (ENG-02)', () => {
	it('repeats the same sequence for the same seed', () => {
		expect(take(createRng('42'), 10)).toEqual(take(createRng('42'), 10));
	});

	it('gives different sequences for different seeds', () => {
		expect(take(createRng('42'), 10)).not.toEqual(take(createRng('43'), 10));
	});

	it('hashes numeric and word seeds as text', () => {
		expect(hashSeed('42')).not.toBe(hashSeed('042'));
		expect(take(createRng('senja-teduh-42'), 10)).not.toEqual(take(createRng('42'), 10));
		expect(Number.isInteger(hashSeed('senja-teduh-42'))).toBe(true);
	});

	it('stays in [0, 1)', () => {
		for (const value of take(createRng('range'), 1000)) {
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});
});
