import { describe, expect, it } from 'vitest';
import { render } from '../../src/lib/engine/render';
import type { PatternModule } from '../../src/lib/engine/types';
import arcs from '../../src/lib/patterns/arcs';
import gradient from '../../src/lib/patterns/gradient';
import hills from '../../src/lib/patterns/hills';
import waves from '../../src/lib/patterns/waves';
import { normalizeParams, readLink, type Design } from '../../src/lib/share/link';
import { designConfig } from '../fixtures/design-config';

const patterns: PatternModule[] = [arcs, hills, waves, gradient];

const APPENDIX_B =
	'v=1&p=arcs&s=42&pal=e07a5f.3d405b.81b29a&bg=f4efe6&m=pair&d=ios-69&x=layers:5,curve:0.6,focus:0.5';

const read = (hash: string) => readLink(hash, patterns);
const design = (hash: string) => read(hash).design;
const params = (hash: string) => design(hash).params ?? {};
const defaults = (pattern: PatternModule) => normalizeParams(pattern.params, {});

/** Fills what a link leaves out, as Create will in Phase 1b, so the result can be rendered. */
function complete(partial: Partial<Design>): Design {
	const pattern = partial.pattern ?? 'arcs';
	const module = patterns.find(({ id }) => id === pattern)!;
	return {
		pattern,
		seed: '42',
		palette: ['e07a5f'],
		background: 'auto',
		mode: 'pair',
		device: null,
		...partial,
		params: partial.params ?? defaults(module)
	};
}

describe('readLink: Appendix B rules', () => {
	it('reads the Appendix B example', () => {
		expect(read(APPENDIX_B)).toEqual({
			design: {
				pattern: 'arcs',
				seed: '42',
				palette: ['e07a5f', '3d405b', '81b29a'],
				background: 'f4efe6',
				mode: 'pair',
				device: { preset: 'ios-69' },
				params: { layers: 5, curve: 0.6, focus: 0.5 }
			},
			notices: []
		});
	});

	it('reads the hash with or without #', () => {
		expect(read(`#${APPENDIX_B}`)).toEqual(read(APPENDIX_B));
	});

	it('returns nothing for an empty hash', () => {
		for (const hash of ['', '#', '#&&', '#preview']) {
			expect(read(hash)).toEqual({ design: {}, notices: [] });
		}
	});

	it('fills missing params with the catalog defaults', () => {
		expect(params('p=arcs')).toEqual({ layers: 5, curve: 0.6, focus: 0.5 });
		expect(params('p=hills&x=layers:7')).toEqual({ layers: 7, height: 0.5, softness: 0.6 });
		expect(params('p=waves&x=')).toEqual(defaults(waves));
		expect(params('p=gradient&x=spread:1')).toEqual({ type: 'linear', angle: 135, spread: 1 });
	});

	it('clamps values outside the range to its bounds', () => {
		expect(params('p=arcs&x=layers:99,curve:-1,focus:1.5')).toEqual({
			layers: 12,
			curve: 0,
			focus: 1
		});
		expect(params('p=gradient&x=angle:400').angle).toBe(360);
		expect(params('p=waves&x=frequency:0').frequency).toBe(1);
		expect(params('p=hills&x=layers:-3').layers).toBe(3);
	});

	it('ignores unknown keys, including fx and o', () => {
		expect(read(`${APPENDIX_B}&foo=1&fx=grain.scanlines&o=landscape`)).toEqual(read(APPENDIX_B));
		expect(read(`foo=1&${APPENDIX_B}`)).toEqual(read(APPENDIX_B));
	});

	it('ignores unknown param names, also ones on Object.prototype', () => {
		const result = params('p=arcs&x=zoom:2,constructor:5,__proto__:5,toString:1,layers:7');
		expect(result).toEqual({ layers: 7, curve: 0.6, focus: 0.5 });
		expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
	});

	it('falls back to Arcs at its defaults with a notice for an unknown pattern ID (11a)', () => {
		expect(read('p=spiral&x=layers:7,curve:1')).toEqual({
			design: { pattern: 'arcs', params: defaults(arcs) },
			notices: [{ type: 'unknown-pattern', id: 'spiral' }]
		});
		// IDs are case-sensitive.
		expect(read('p=Arcs').notices).toEqual([{ type: 'unknown-pattern', id: 'Arcs' }]);
	});

	it('needs the Arcs module to fall back to', () => {
		expect(() => readLink('p=hills', [hills])).toThrow(/arcs/);
	});
});

describe('readLink: derived rules (plan section 4)', () => {
	it('uses the first occurrence of a key', () => {
		expect(design('p=hills&p=waves').pattern).toBe('hills');
		expect(params('p=arcs&x=layers:7,layers:9').layers).toBe(7);
		expect(params('p=arcs&x=layers:abc,layers:9').layers).toBe(5);
	});

	it('treats broken percent-encoding as a missing key', () => {
		expect(design('s=%E0%A4%A&p=arcs')).toEqual({ pattern: 'arcs', params: defaults(arcs) });
		expect(design('s=100%')).toEqual({});
	});

	it('reads plain decimals only; other numbers take the default', () => {
		for (const value of ['abc', '', '1e1', '0x10', '+7', '.5', '5.', 'Infinity', 'NaN', '7 ']) {
			expect(params(`p=arcs&x=layers:${value}`).layers).toBe(5);
		}
		expect(params('p=arcs&x=layers:7.0,curve:-0').layers).toBe(7);
		expect(params('p=arcs&x=layers').layers).toBe(5);
	});

	it('gives unknown choices the default', () => {
		expect(params('p=gradient&x=type:conic').type).toBe('linear');
		expect(params('p=gradient&x=type:Radial').type).toBe('linear');
		expect(params('p=gradient&x=type:radial').type).toBe('radial');
	});

	it('treats an empty value as a missing key', () => {
		expect(design('p=&s=&pal=&bg=&m=&d=&w=&h=&x=')).toEqual({});
	});

	it('never throws on a malformed hash, and the result always renders', () => {
		const hashes = [
			'%',
			'=&=&==',
			'#&p',
			'p=%zz',
			'v=abc&v=2',
			'p=arcs&x=:,:,,layers:',
			'p=arcs&x=layers:1:2',
			'pal=...&bg=.',
			`s=${'é'.repeat(5000)}`,
			`pal=${'e07a5f.'.repeat(1000)}`,
			'p=hills&x=layers:3.5,height:0.123456789,softness:1e-9',
			'w=Infinity&h=-Infinity',
			'd=__proto__&p=constructor',
			'p=toString'
		];
		for (const hash of hashes) {
			const { design: partial } = read(hash);
			const config = designConfig(complete(partial), 'light');
			const module = patterns.find(({ id }) => id === config.pattern)!;
			expect(render(config, module)).toMatch(/^<svg /);
		}
	});
});

describe('readLink: decisions (plan section 5)', () => {
	it('returns only the keys the link carries (1a)', () => {
		expect(design('s=42')).toEqual({ seed: '42' });
		expect(design('m=dark&bg=auto')).toEqual({ mode: 'dark', background: 'auto' });
		// Without p the params cannot be read, so x is ignored.
		expect(design('x=layers:7')).toEqual({});
	});

	it('snaps values between steps to the nearest step, halves rounded up (2a)', () => {
		expect(params('p=arcs&x=layers:3.5,curve:0.62,focus:0.625')).toEqual({
			layers: 4,
			curve: 0.6,
			focus: 0.65
		});
		expect(params('p=gradient&x=angle:134.5,spread:0.15').angle).toBe(135);
		expect(params('p=gradient&x=spread:0.15').spread).toBe(0.15);
		expect(params('p=waves&x=layers:3.49,frequency:5.5')).toMatchObject({
			layers: 3,
			frequency: 6
		});
	});

	it('only ever returns values the slider can produce (2a)', () => {
		for (const pattern of patterns) {
			for (const [key, def] of Object.entries(pattern.params)) {
				if (def.type !== 'number') continue;
				const allowed = new Set<number>();
				for (let i = 0; def.min + i * def.step <= def.max + 1e-9; i++) {
					allowed.add(Number((def.min + i * def.step).toFixed(2)));
				}
				// The set holds exact numbers, so float noise such as 0.6000000000000001 fails too.
				for (let input = def.min - 2; input <= def.max + 2; input += def.step / 7) {
					const value = params(`p=${pattern.id}&x=${key}:${input.toFixed(4)}`)[key];
					expect(allowed.has(Number(value))).toBe(true);
				}
			}
		}
	});

	it('renders all four patterns from a link with values between steps (2a)', () => {
		const odd: Record<string, string> = {
			arcs: 'layers:3.5,curve:0.62,focus:0.33',
			hills: 'layers:3.5,height:0.62,softness:0.33',
			waves: 'layers:3.5,amplitude:0.62,frequency:2.5',
			gradient: 'type:radial,angle:12.5,spread:0.33'
		};
		for (const pattern of patterns) {
			const partial = design(`p=${pattern.id}&x=${odd[pattern.id]}`);
			for (const variant of ['light', 'dark'] as const) {
				expect(render(designConfig(complete(partial), variant), pattern)).toMatch(/^<svg /);
			}
		}
	});

	it('drops invalid palette colors and keeps the rest in order (3a)', () => {
		expect(design('pal=e07a5f.zzz.81b29a').palette).toEqual(['e07a5f', '81b29a']);
		expect(design('pal=fff.e07a5f').palette).toEqual(['e07a5f']);
		expect(design('pal=E07A5F.3d405B').palette).toEqual(['e07a5f', '3d405b']);
		expect(design('pal=zzz.fff.%23e07a5f')).toEqual({});
	});

	it('treats an invalid background as missing (4a)', () => {
		expect(design('bg=zzz')).toEqual({});
		expect(design('bg=AUTO')).toEqual({});
		expect(design('bg=auto').background).toBe('auto');
		expect(design('bg=F4EFE6').background).toBe('f4efe6');
	});

	it('keeps the first five valid colors (5a)', () => {
		const seven = 'pal=111111.222222.333333.444444.555555.666666.777777';
		expect(design(seven).palette).toEqual(['111111', '222222', '333333', '444444', '555555']);
		const mixed = 'pal=zzz.111111.222222.x.333333.444444.555555.666666';
		expect(design(mixed).palette).toEqual(['111111', '222222', '333333', '444444', '555555']);
	});

	it('treats an empty seed as missing and keeps any other seed as is (6a)', () => {
		expect(design('s=')).toEqual({});
		expect(design('s=%20').seed).toBe(' ');
		expect(design('s=Senja-Teduh').seed).toBe('Senja-Teduh');
		expect(design('s=a+b').seed).toBe('a+b');
		expect(design('s=%C3%A9%F0%9F%98%80').seed).toBe('é😀');
	});

	it('treats an unknown preset as missing, without a notice (7a)', () => {
		expect(read('d=iphone-99')).toEqual({ design: {}, notices: [] });
		expect(design('d=desk-5k').device).toEqual({ preset: 'desk-5k' });
	});

	it('rounds and clamps custom sizes; w and h replace d (8a)', () => {
		expect(design('w=100&h=9000').device).toEqual({ width: 320, height: 7680 });
		expect(design('w=1080.5&h=2400.4').device).toEqual({ width: 1081, height: 2400 });
		expect(design('d=ios-69&w=3000&h=2000').device).toEqual({ width: 3000, height: 2000 });
		expect(design('d=ios-69&w=3000').device).toEqual({ preset: 'ios-69' });
		expect(design('d=ios-69&w=abc&h=2000').device).toEqual({ preset: 'ios-69' });
		expect(design('h=2000')).toEqual({});
	});

	it('ignores o, also for tablet presets (9a)', () => {
		expect(design('d=ipad-pro-13&o=landscape').device).toEqual({ preset: 'ipad-pro-13' });
		expect(design('d=ios-69&o=square').device).toEqual({ preset: 'ios-69' });
	});

	it('gives a notice for another engine version and renders with this one (10a)', () => {
		expect(read('v=2&p=arcs').notices).toEqual([{ type: 'version', version: 2 }]);
		expect(read('v=0').notices).toEqual([{ type: 'version', version: 0 }]);
		for (const hash of ['v=1', 'v=01', 'p=arcs', 'v=abc', 'v=1.0', 'v=-1', `v=${'9'.repeat(20)}`]) {
			expect(read(hash).notices).toEqual([]);
		}
		expect(design('v=2')).toEqual({});
	});

	it('reads only the three view modes', () => {
		for (const mode of ['light', 'dark', 'pair']) expect(design(`m=${mode}`).mode).toBe(mode);
		expect(design('m=compare')).toEqual({});
		expect(design('m=Pair')).toEqual({});
	});
});
