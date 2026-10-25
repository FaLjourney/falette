import type { Size } from '../engine/types';
import { cornerOpaque, PNG_TYPE } from './canvas';
import type { EncodeRequest, EncodeResponse } from './png.worker';
import { rasterSource, SAFE_PNG_AREA, smallerPngSize } from './png-size';
import { svgFile } from './svg-file';

/**
 * Performance marks at the end of each export stage. The `encoded` mark carries `{ path }` in its
 * detail, `'worker'` or `'main'`, so export times can be measured on any device.
 */
export const PNG_MARKS = {
	loaded: 'falette:png:loaded',
	rastered: 'falette:png:rastered',
	encoded: 'falette:png:encoded'
} as const;

export type PngPath = 'worker' | 'main';

/** The PNG could not be made; the UI offers a smaller size or SVG instead (EXP-07). */
export class PngExportError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'PngExportError';
	}
}

export type PngCheck = { ok: true } | { ok: false; smaller: Size };

const probed = new Map<string, boolean>();

/** Draws one pixel in the far corner of a canvas of this size and reads it back. */
function canvasFits({ width, height }: Size): boolean {
	const key = `${width}x${height}`;
	let fits = probed.get(key);
	if (fits === undefined) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d');
		if (context !== null) {
			context.fillRect(width - 1, height - 1, 1, 1);
		}
		fits = context !== null && cornerOpaque(context, width, height);
		release(canvas);
		probed.set(key, fits);
	}
	return fits;
}

/**
 * Whether this browser can make a PNG of `size`, and if not the largest size with the same ratio
 * that every supported browser can make (EXP-06). Probes only above `SAFE_PNG_AREA`, once per size.
 */
export function checkPngSize(size: Size): PngCheck {
	if (size.width * size.height <= SAFE_PNG_AREA || canvasFits(size)) {
		return { ok: true };
	}
	return { ok: false, smaller: smallerPngSize(size) };
}

/** Safari frees canvas memory late unless the canvas is shrunk first. */
function release(canvas: HTMLCanvasElement): void {
	canvas.width = 0;
	canvas.height = 0;
}

/** Resolves once the browser has painted, so a busy indicator shows before the heavy work (EXP-07). */
function afterPaint(): Promise<void> {
	return new Promise((resolve) => {
		// requestAnimationFrame does not run in hidden tabs.
		const fallback = setTimeout(resolve, 100);
		requestAnimationFrame(() =>
			setTimeout(() => {
				clearTimeout(fallback);
				resolve();
			}, 0)
		);
	});
}

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new PngExportError('The browser could not load the SVG'));
		image.src = url;
	});
}

/** The PNG worker, started on first use; `null` when this browser cannot run it. */
let encoder: Worker | null | undefined;

function encoderWorker(): Worker | null {
	if (encoder === undefined) {
		try {
			encoder =
				typeof Worker === 'function' && typeof OffscreenCanvas === 'function'
					? new Worker(new URL('./png.worker.ts', import.meta.url), { type: 'module' })
					: null;
		} catch {
			encoder = null;
		}
	}
	return encoder;
}

let nextRequest = 0;

/** Resolves `null` when the worker itself breaks, so the main thread can take over. */
function encodeInWorker(worker: Worker, bitmap: ImageBitmap): Promise<Blob | null> {
	const id = nextRequest++;
	return new Promise((resolve, reject) => {
		const stop = () => {
			worker.removeEventListener('message', onMessage);
			worker.removeEventListener('error', onError);
		};
		const onMessage = (event: MessageEvent<EncodeResponse>) => {
			if (event.data.id !== id) {
				return;
			}
			stop();
			if ('blob' in event.data) {
				resolve(event.data.blob);
			} else {
				reject(new PngExportError(event.data.error));
			}
		};
		const onError = () => {
			stop();
			worker.terminate();
			encoder = null;
			resolve(null);
		};
		worker.addEventListener('message', onMessage);
		worker.addEventListener('error', onError);
		const request: EncodeRequest = { id, bitmap };
		worker.postMessage(request, [bitmap]);
	});
}

async function encodeOnMain(image: HTMLImageElement, { width, height }: Size): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	try {
		const context = canvas.getContext('2d');
		if (context === null) {
			throw new PngExportError(`No canvas of ${width} × ${height} px`);
		}
		context.drawImage(image, 0, 0, width, height);
		if (!cornerOpaque(context, width, height)) {
			throw new PngExportError(`The canvas of ${width} × ${height} px stayed empty`);
		}
		performance.mark(PNG_MARKS.rastered);
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, PNG_TYPE));
		if (blob === null) {
			throw new PngExportError('The browser could not encode the PNG');
		}
		return blob;
	} finally {
		release(canvas);
	}
}

/**
 * Worker path: the main thread only turns the loaded SVG into an ImageBitmap, which does not block
 * in Chromium, and the worker draws and encodes it. Falls back to the main thread when the browser
 * lacks the worker, OffscreenCanvas or an ImageBitmap of SVG.
 */
async function encode(image: HTMLImageElement, size: Size): Promise<{ blob: Blob; path: PngPath }> {
	const worker = encoderWorker();
	if (worker !== null) {
		const bitmap = await createImageBitmap(image).catch(() => null);
		if (bitmap !== null && bitmap.width === size.width && bitmap.height === size.height) {
			performance.mark(PNG_MARKS.rastered);
			const blob = await encodeInWorker(worker, bitmap);
			if (blob !== null) {
				return { blob, path: 'worker' };
			}
		} else {
			bitmap?.close();
		}
	}
	return { blob: await encodeOnMain(image, size), path: 'main' };
}

/**
 * PNG of exactly `size` from the same SVG string as the preview: SVG → canvas → `toBlob`, or
 * `convertToBlob` in a worker (EXP-01, EXP-07). A size other than the SVG's own draws the same
 * design scaled (EXP-06). Rejects with `PngExportError` when the browser cannot make it.
 */
export async function svgToPng(svg: string, size: Size): Promise<Blob> {
	for (const side of [size.width, size.height]) {
		if (!Number.isInteger(side) || side < 1) {
			throw new RangeError(`PNG size must be whole pixels: ${size.width} × ${size.height}`);
		}
	}
	await afterPaint();
	const url = URL.createObjectURL(svgFile(rasterSource(svg, size)));
	try {
		const image = await loadImage(url);
		performance.mark(PNG_MARKS.loaded);
		const { blob, path } = await encode(image, size);
		performance.mark(PNG_MARKS.encoded, { detail: { path } });
		return blob;
	} catch (error) {
		if (error instanceof PngExportError) {
			throw error;
		}
		throw new PngExportError('The browser could not make the PNG', { cause: error });
	} finally {
		URL.revokeObjectURL(url);
	}
}
