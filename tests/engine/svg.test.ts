import { describe, expect, it } from 'vitest';
import { el, num } from '../../src/lib/engine/svg';

describe('num (EXP-02)', () => {
	it('rounds to at most 2 decimals without trailing zeros', () => {
		expect(num(1.234)).toBe('1.23');
		expect(num(1.236)).toBe('1.24');
		expect(num(2)).toBe('2');
		expect(num(2.5)).toBe('2.5');
		expect(num(0.1 + 0.2)).toBe('0.3');
	});

	it('rounds halves away from zero', () => {
		expect(num(0.125)).toBe('0.13');
		expect(num(-0.125)).toBe('-0.13');
	});

	it('never writes -0', () => {
		expect(num(-0)).toBe('0');
		expect(num(-0.001)).toBe('0');
		expect(num(-1.5)).toBe('-1.5');
	});

	it('rejects non-finite numbers', () => {
		expect(() => num(NaN)).toThrow(RangeError);
		expect(() => num(Infinity)).toThrow(RangeError);
	});
});

describe('el', () => {
	it('formats number attributes through num', () => {
		expect(el('circle', { cx: 1.004, cy: 2, r: 0.333, fill: '#fff' })).toBe(
			'<circle cx="1" cy="2" r="0.33" fill="#fff"/>'
		);
	});

	it('rejects style attributes and elements (ENG-01)', () => {
		expect(() => el('rect', { style: 'fill:red' })).toThrow();
		expect(() => el('style', {})).toThrow();
	});
});
