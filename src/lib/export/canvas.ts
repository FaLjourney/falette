export const PNG_TYPE = 'image/png';

/**
 * True when the bottom-right pixel is opaque. Every pattern paints the whole canvas, and a browser
 * past its canvas limit drops drawing calls without an error, so a see-through corner means the
 * drawing failed (EXP-06, EXP-07).
 */
export function cornerOpaque(
	context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	width: number,
	height: number
): boolean {
	try {
		return context.getImageData(width - 1, height - 1, 1, 1).data[3] === 255;
	} catch {
		return false;
	}
}
