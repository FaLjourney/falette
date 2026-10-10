import { describe, expect, it } from 'vitest';
import { lang } from '../src/params/lang';

describe('lang param matcher', () => {
	it('accepts en and id', () => {
		expect(lang('en')).toBe('en');
		expect(lang('id')).toBe('id');
	});

	it('rejects other values', () => {
		expect(lang('de')).toBeUndefined();
		expect(lang('EN')).toBeUndefined();
	});
});
