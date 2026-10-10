import { createRng } from './prng';
import { el, num } from './svg';
import type { Params, PatternModule, RenderConfig } from './types';

export const ENGINE_VERSION = 1;

function withDefaults(pattern: PatternModule, params: Params): Params {
	const resolved: Params = {};
	for (const [key, def] of Object.entries(pattern.params)) {
		resolved[key] = params[key] ?? def.default;
	}
	return resolved;
}

/**
 * Renders one wallpaper variant as a self-contained SVG string (ENG-01).
 * Pure: the caller loads the pattern module (ENG-10) and passes it in.
 */
export function render(config: RenderConfig, pattern: PatternModule): string {
	if (pattern.id !== config.pattern) {
		throw new Error(
			`Pattern module "${pattern.id}" does not match config pattern "${config.pattern}"`
		);
	}
	const { width, height } = config.size;
	const body = pattern.generate({
		width,
		height,
		params: withDefaults(pattern, config.params),
		rng: createRng(config.seed)
	});
	return el(
		'svg',
		{
			xmlns: 'http://www.w3.org/2000/svg',
			width,
			height,
			viewBox: `0 0 ${num(width)} ${num(height)}`
		},
		body
	);
}
