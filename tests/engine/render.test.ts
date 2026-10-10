import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import type { RenderConfig } from '../../src/lib/engine/types';
import { mockPattern } from '../fixtures/mock-pattern';

function config(overrides: Partial<RenderConfig> = {}): RenderConfig {
	return {
		version: ENGINE_VERSION,
		pattern: 'mock',
		seed: '42',
		palette: ['e07a5f'],
		background: 'auto',
		size: { width: 1080, height: 2400 },
		params: {},
		variant: 'light',
		...overrides
	};
}

describe('render (ENG-01)', () => {
	it('returns the same string for the same config', () => {
		expect(render(config(), mockPattern)).toBe(render(config(), mockPattern));
	});

	it('returns different strings for different seeds', () => {
		expect(render(config({ seed: '42' }), mockPattern)).not.toBe(
			render(config({ seed: '43' }), mockPattern)
		);
	});

	it('works with numeric and word seeds', () => {
		const numeric = render(config({ seed: '42' }), mockPattern);
		const word = render(config({ seed: 'senja-teduh-42' }), mockPattern);
		expect(numeric).toMatch(/^<svg /);
		expect(word).toMatch(/^<svg /);
		expect(word).not.toBe(numeric);
	});

	it('writes a self-contained root with width, height and viewBox (EXP-02)', () => {
		const svg = render(config({ size: { width: 3440, height: 1440 } }), mockPattern);
		expect(svg).toMatch(
			/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="3440" height="1440" viewBox="0 0 3440 1440">/
		);
		expect(svg).toMatch(/<\/svg>$/);
		expect(svg).not.toMatch(/\shref=|url\(/);
	});

	it('has no style attribute or element', () => {
		const svg = render(config({ params: { mode: 'scatter' } }), mockPattern);
		expect(svg).not.toMatch(/\sstyle=/);
		expect(svg).not.toMatch(/<style/);
	});

	it('writes numbers with at most 2 decimals and no -0', () => {
		const svg = render(config({ params: { mode: 'scatter' } }), mockPattern);
		expect(svg).not.toMatch(/\d\.\d{3}/);
		expect(svg).not.toMatch(/-0(?![.\d])/);
	});

	it('fills missing params with schema defaults', () => {
		expect(render(config({ params: {} }), mockPattern)).toBe(
			render(config({ params: { count: 5, mode: 'rings' } }), mockPattern)
		);
	});

	it('rejects a pattern module that does not match the config', () => {
		expect(() => render(config({ pattern: 'arcs' }), mockPattern)).toThrow();
	});
});
