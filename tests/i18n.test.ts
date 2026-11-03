import { describe, expect, it } from 'vitest';
import en from '../src/lib/i18n/en.json';
import id from '../src/lib/i18n/id.json';
import { translator } from '../src/lib/i18n/index';

/** Every text as `[dotted key, text]`, in file order. */
function texts(node: object, prefix = ''): [string, string][] {
	return Object.entries(node).flatMap(([key, value]): [string, string][] =>
		typeof value === 'string' ? [[prefix + key, value]] : texts(value, `${prefix}${key}.`)
	);
}

const placeholders = (text: string) =>
	[...text.matchAll(/\{(\w+)\}/g)].map(([, name]) => name).sort();

describe('translation files (NFR Bahasa)', () => {
	it('id.json has exactly the keys of en.json', () => {
		expect(texts(id).map(([key]) => key)).toEqual(texts(en).map(([key]) => key));
	});

	it('every text has the same placeholders in both languages', () => {
		const indonesian = new Map(texts(id));
		for (const [key, text] of texts(en)) {
			expect(placeholders(indonesian.get(key) ?? ''), key).toEqual(placeholders(text));
		}
	});

	it('no text is empty', () => {
		for (const [key, text] of [...texts(en), ...texts(id)]) {
			expect(text.trim(), key).not.toBe('');
		}
	});
});

describe('translator', () => {
	it('returns the text for a dotted key', () => {
		expect(translator(en)('meta.home.title')).toBe(en.meta.home.title);
		expect(translator(id)('notFound.heading')).toBe('Halaman tidak ditemukan');
	});

	it('fills {placeholders} and rejects missing values', () => {
		const messages = structuredClone(en);
		messages.home.heading = 'PNG {width} × {height} px';
		const t = translator(messages);
		expect(t('home.heading', { width: 7680, height: 4320 })).toBe('PNG 7680 × 4320 px');
		expect(() => t('home.heading', { width: 7680 })).toThrow('{height}');
	});
});
