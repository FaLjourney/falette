import { el } from '../../src/lib/engine/svg';
import type { PatternModule } from '../../src/lib/engine/types';

const COLORS = ['e07a5f', '3d405b', '81b29a'];

/** Test-only pattern with fixed colors, exercising a number and a choice parameter. */
export const mockPattern: PatternModule = {
	id: 'mock',
	name: 'Mock',
	category: 'geometry',
	params: {
		count: { type: 'number', min: 3, max: 12, step: 1, default: 5 },
		mode: { type: 'choice', options: ['scatter', 'rings'], default: 'rings' }
	},
	generate({ width, height, params, rng }) {
		const count = Number(params.count);
		const short = Math.min(width, height);
		const cx = width * (0.25 + rng() * 0.5);
		const cy = height * (0.25 + rng() * 0.5);
		let out = el('rect', { width, height, fill: '#f4efe6' });
		for (let i = 0; i < count; i++) {
			const fill = `#${COLORS[i % COLORS.length]}`;
			if (params.mode === 'rings') {
				const r = short * (0.5 - (i / count) * 0.45);
				out += el('circle', { cx, cy, r, fill });
			} else {
				const r = short * (0.05 + rng() * 0.15);
				out += el('circle', { cx: width * rng(), cy: height * rng(), r, fill });
			}
		}
		return out;
	}
};
