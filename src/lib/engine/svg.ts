/**
 * Formats a number for SVG output: at most 2 decimals, halves rounded away
 * from zero, no trailing zeros and never `-0` (EXP-02).
 */
export function num(n: number): string {
	if (!Number.isFinite(n)) {
		throw new RangeError(`Cannot write non-finite number to SVG: ${n}`);
	}
	const rounded = (Math.sign(n) * Math.round(Math.abs(n) * 100)) / 100;
	return String(rounded === 0 ? 0 : rounded);
}

export type AttrValue = number | string;

function escapeAttr(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Builds one SVG element. Numbers go through `num()`. Styling must use
 * presentation attributes, so `style` is rejected as a tag or attribute (ENG-01).
 */
export function el(tag: string, attrs: Record<string, AttrValue>, children = ''): string {
	if (tag === 'style') {
		throw new Error('SVG output must not contain a <style> element');
	}
	let out = `<${tag}`;
	for (const [name, value] of Object.entries(attrs)) {
		if (name === 'style') {
			throw new Error('SVG output must not contain a style attribute');
		}
		out += ` ${name}="${typeof value === 'number' ? num(value) : escapeAttr(value)}"`;
	}
	return children === '' ? `${out}/>` : `${out}>${children}</${tag}>`;
}
