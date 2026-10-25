import type { Size } from '../engine/types';

/**
 * Largest canvas every supported browser can draw: Safari on iOS stops at 4096 × 4096 px. Up to
 * this area no probe is needed; all presets in PRD Appendix A fit (EXP-06).
 */
export const SAFE_PNG_AREA = 4096 * 4096;

/** Largest size with the same ratio within `maxArea`, or `size` itself when it already fits. */
export function smallerPngSize(size: Size, maxArea = SAFE_PNG_AREA): Size {
	const { width, height } = size;
	if (width * height <= maxArea) {
		return size;
	}
	const scale = Math.sqrt(maxArea / (width * height));
	// The epsilon keeps exact fits such as 7680 → 4096 from flooring to 4095.
	const fit = (side: number) => Math.max(1, Math.floor(side * scale + 1e-9));
	let smaller = { width: fit(width), height: fit(height) };
	while (smaller.width * smaller.height > maxArea) {
		smaller =
			smaller.width >= smaller.height
				? { ...smaller, width: smaller.width - 1 }
				: { ...smaller, height: smaller.height - 1 };
	}
	return smaller;
}

/**
 * The SVG to rasterize at `size`. At the design's own size it is unchanged. Otherwise only the
 * root `width` and `height` change, so the browser draws the same vector design sharply at the new
 * size; `preserveAspectRatio="none"` keeps a ratio off by under 1 px from leaving a see-through edge.
 */
export function rasterSource(svg: string, size: Size): string {
	const root = /^<svg [^>]*>/.exec(svg)?.[0];
	const width = root && / width="([^"]*)"/.exec(root)?.[1];
	const height = root && / height="([^"]*)"/.exec(root)?.[1];
	if (!root || width === undefined || height === undefined) {
		throw new Error('Expected an SVG string from render()');
	}
	if (Number(width) === size.width && Number(height) === size.height) {
		return svg;
	}
	const resized = root
		.replace(/ width="[^"]*"/, ` width="${size.width}"`)
		.replace(/ height="[^"]*"/, ` height="${size.height}"`)
		.replace(/>$/, ' preserveAspectRatio="none">');
	return resized + svg.slice(root.length);
}
