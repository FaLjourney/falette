export const SVG_TYPE = 'image/svg+xml';

/**
 * The downloadable SVG file: the `render()` string exactly, which is also the Ringkas code. The
 * engine already makes it self-contained (EXP-02).
 */
export function svgFile(svg: string): Blob {
	return new Blob([svg], { type: SVG_TYPE });
}
