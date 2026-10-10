/**
 * Hashes seed text to a 32-bit unsigned integer (xmur3). Numeric seeds are
 * hashed as their text too, so `'42'` and `'senja-teduh-42'` take the same path.
 */
export function hashSeed(seed: string): number {
	let h = 1779033703 ^ seed.length;
	for (let i = 0; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	return (h ^ (h >>> 16)) >>> 0;
}

/** mulberry32: returns a generator of floats in [0, 1). */
export function mulberry32(state: number): () => number {
	let a = state >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Seeded random source (ENG-02). */
export function createRng(seed: string): () => number {
	return mulberry32(hashSeed(seed));
}
