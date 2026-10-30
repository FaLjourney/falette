import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');

/** Custom properties declared in the first rule with this selector. */
function tokens(selector: string): Record<string, string> {
	const start = css.indexOf(`${selector} {`);
	const body = css.slice(start, css.indexOf('}', start));
	return Object.fromEntries(
		[...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, n, v]) => [n, v])
	);
}

const light = tokens(':root');
const dark = { ...light, ...tokens(":root[data-theme='dark']") };

/** WCAG 2 relative luminance of `#rrggbb`. */
function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (high + 0.05) / (low + 0.05);
}

/** Foreground, background, and the WCAG AA minimum: 4.5 for text, 3 for component edges. */
const pairs: [string, string, number][] = [
	['--color-text', '--color-bg', 4.5],
	['--color-text', '--color-surface', 4.5],
	['--color-text', '--color-accent-soft', 4.5],
	['--color-text-muted', '--color-bg', 4.5],
	['--color-text-muted', '--color-surface', 4.5],
	['--color-accent', '--color-bg', 4.5],
	['--color-accent', '--color-surface', 4.5],
	['--color-accent', '--color-accent-soft', 3],
	['--color-border-strong', '--color-bg', 3],
	['--color-border-strong', '--color-surface', 3]
];

describe('color tokens (THM-01, THM-06)', () => {
	it('the dark theme overrides every color token with a HEX color', () => {
		const colors = (set: Record<string, string>) =>
			Object.keys(set).filter((name) => name.startsWith('--color-'));
		expect(Object.keys(tokens(":root[data-theme='dark']")).sort()).toEqual(colors(light).sort());
		for (const value of [
			...colors(light).map((n) => light[n]),
			...colors(dark).map((n) => dark[n])
		]) {
			expect(value).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	for (const [theme, set] of [
		['light', light],
		['dark', dark]
	] as const) {
		it.each(pairs)(`${theme}: %s on %s reaches %d:1`, (foreground, background, minimum) => {
			expect(contrast(set[foreground], set[background])).toBeGreaterThanOrEqual(minimum);
		});
	}
});
