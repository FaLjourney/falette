import { describe, expect, it } from 'vitest';
import arcs from '../../src/lib/patterns/arcs';
import gradient from '../../src/lib/patterns/gradient';
import { shareUrl, writeLink, type Design } from '../../src/lib/share/link';

/** The design of the PRD Appendix B example link. */
function example(overrides: Partial<Design> = {}): Design {
	return {
		pattern: 'arcs',
		seed: '42',
		palette: ['e07a5f', '3d405b', '81b29a'],
		background: 'f4efe6',
		mode: 'pair',
		device: { preset: 'ios-69' },
		params: { layers: 5, curve: 0.6, focus: 0.5 },
		...overrides
	};
}

const APPENDIX_B =
	'v=1&p=arcs&s=42&pal=e07a5f.3d405b.81b29a&bg=f4efe6&m=pair&d=ios-69&x=layers:5,curve:0.6,focus:0.5';

describe('writeLink (SHR-01, Appendix B)', () => {
	it('writes the Appendix B example exactly', () => {
		expect(writeLink(example(), arcs)).toBe(APPENDIX_B);
	});

	it('writes every pattern param in schema order, with defaults for missing ones', () => {
		expect(writeLink(example({ params: { focus: 0.5 } }), arcs)).toBe(APPENDIX_B);
		expect(writeLink(example({ params: {} }), arcs)).toBe(APPENDIX_B);
	});

	it('writes params snapped to their step and range, and drops unknown ones', () => {
		const link = writeLink(
			example({ params: { layers: 3.5, curve: 0.6000000000000001, focus: 2, zoom: 3 } }),
			arcs
		);
		expect(link).toMatch(/&x=layers:4,curve:0\.6,focus:1$/);
	});

	it('writes choice params as their option', () => {
		const link = writeLink(
			example({ pattern: 'gradient', params: { type: 'radial', angle: 90 } }),
			gradient
		);
		expect(link).toMatch(/&x=type:radial,angle:90,spread:0\.5$/);
	});

	it('writes a custom size as w and h in place of d', () => {
		const link = writeLink(example({ device: { width: 3000, height: 2000 } }), arcs);
		expect(link).toContain('&m=pair&w=3000&h=2000&x=');
		expect(link).not.toContain('d=');
	});

	it('writes no size for a design without a device (HOME-07)', () => {
		const link = writeLink(example({ device: null }), arcs);
		expect(link).toContain('&m=pair&x=');
		expect(link).not.toMatch(/(^|&)(d|w|h)=/);
	});

	it('writes auto backgrounds and lowercase HEX', () => {
		const link = writeLink(example({ palette: ['E07A5F', '3D405B'], background: 'auto' }), arcs);
		expect(link).toContain('&pal=e07a5f.3d405b&bg=auto&');
	});

	it('never writes o or fx, also for tablet presets', () => {
		const link = writeLink(example({ device: { preset: 'ipad-pro-13' } }), arcs);
		expect(link).not.toMatch(/(^|&)(o|fx)=/);
	});

	it('percent-encodes the seed so no character breaks the link', () => {
		const seed = 'a+b & c=d#é,x:y.z%/😀';
		const link = writeLink(example({ seed }), arcs);
		const s = link.split('&').find((field) => field.startsWith('s='));
		expect(s).toBe(`s=${encodeURIComponent(seed)}`);
		expect(s?.slice(2)).toMatch(/^[A-Za-z0-9%._~!*'()-]+$/);
	});

	it('rejects designs a link cannot carry', () => {
		const invalid: Partial<Design>[] = [
			{ seed: '' },
			{ palette: [] },
			{ palette: ['e07a5f', '3d405b', '81b29a', 'f2cc8f', 'f4efe6', '000000'] },
			{ palette: ['e07a5f', 'zzz'] },
			{ background: 'fff' },
			{ device: { preset: 'iphone-99' } },
			{ device: { width: 319, height: 2000 } },
			{ device: { width: 3000, height: 7681 } },
			{ device: { width: 3000.5, height: 2000 } }
		];
		for (const overrides of invalid) {
			expect(() => writeLink(example(overrides), arcs)).toThrow(RangeError);
		}
		expect(() => writeLink(example({ pattern: 'hills' }), arcs)).toThrow(/does not match/);
	});
});

describe('shareUrl (SHR-02)', () => {
	it('points to /create/ without a language prefix', () => {
		const url = shareUrl('https://falette.vercel.app', APPENDIX_B);
		expect(url).toBe(`https://falette.vercel.app/create/#${APPENDIX_B}`);
		const parsed = new URL(url);
		expect(parsed.pathname).toBe('/create/');
		expect(parsed.pathname).not.toMatch(/^\/(en|id)\//);
		expect(parsed.hash).toBe(`#${APPENDIX_B}`);
	});
});
