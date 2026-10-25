/** Rapi (pretty) or Ringkas (compact) in the SVG code panel (EXP-03). */
export type SvgCodeStyle = 'pretty' | 'compact';

const INDENT = '  ';

/**
 * Splits engine SVG into its tags. Safe because `el()` escapes `<` and `>` in attribute values and
 * the engine writes no text or comments; anything between tags is rejected rather than guessed.
 */
function tags(svg: string): string[] {
	const list: string[] = [];
	let end = 0;
	for (const match of svg.matchAll(/<[^>]+>/g)) {
		if (svg.slice(end, match.index).trim() !== '') {
			throw new Error('SVG code must not contain text between tags');
		}
		list.push(match[0]);
		end = match.index + match[0].length;
	}
	if (svg.slice(end).trim() !== '') {
		throw new Error('SVG code must not contain text between tags');
	}
	return list;
}

/**
 * Compact is the `render()` string itself, byte for byte. Pretty puts one element per line,
 * indented 2 spaces per level, with all attributes kept on the element's line.
 */
export function formatSvg(svg: string, style: SvgCodeStyle): string {
	const list = tags(svg);
	if (style === 'compact') {
		return list.join('');
	}
	let depth = 0;
	return list
		.map((tag) => {
			if (tag.startsWith('</')) {
				depth--;
			}
			const line = INDENT.repeat(depth) + tag;
			if (!tag.startsWith('</') && !tag.endsWith('/>')) {
				depth++;
			}
			return line;
		})
		.join('\n');
}
