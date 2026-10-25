// Drives src/lib/export in a real browser. Playwright calls window.harness; on a phone,
// ?run=device runs a fixed set of checks and shows the results to copy into the export report.
import { ENGINE_VERSION, render } from '../../src/lib/engine/render';
import type { Params, PatternModule, Size, Variant } from '../../src/lib/engine/types';
import { downloadFile } from '../../src/lib/export/download';
import { exportFileName, type ExportFormat } from '../../src/lib/export/filename';
import {
	checkPngSize,
	PNG_MARKS,
	svgToPng,
	type PngCheck,
	type PngPath
} from '../../src/lib/export/png';
import { svgFile } from '../../src/lib/export/svg-file';
import arcs from '../../src/lib/patterns/arcs';
import gradient from '../../src/lib/patterns/gradient';
import hills from '../../src/lib/patterns/hills';
import waves from '../../src/lib/patterns/waves';
import { allPresets } from '../fixtures/presets';

const patterns: Record<string, PatternModule> = { arcs, hills, waves, gradient };

/** One wallpaper to export; left-out fields use seed 42 and the PRD Appendix B palette, light. */
export interface HarnessCase {
	pattern: string;
	size: Size;
	variant?: Variant;
	seed?: string;
	params?: Params;
	palette?: string[];
	background?: string;
}

export type PngResult =
	| {
			ok: true;
			/** Key of the PNG kept in this page, for `banding()` and download links. */
			id: number;
			/** Read from the PNG header. */
			width: number;
			height: number;
			bytes: number;
			path: PngPath;
			/** Milliseconds from the call to each mark; `total` includes the wait for one paint. */
			load: number;
			raster: number;
			encode: number;
			total: number;
			/** Longest time between two animation frames during the export. */
			maxFrameGap: number;
			/** Longest main-thread task, where the browser reports long tasks (Chromium). */
			maxLongTask: number | null;
			/** Every pixel of a 32 × 32 thumbnail is opaque. */
			opaque: boolean;
			/** Distinct colors in that thumbnail. */
			colors: number;
			/** Hash of that thumbnail, to tell two PNGs apart. */
			thumbnailHash: number;
	  }
	| { ok: false; error: string; message: string };

export interface Banding {
	width: number;
	height: number;
	/** Longest run of identical pixels inside the gradient zone, over 5 rows. */
	longestRun: number;
	/** Largest step between neighboring pixels in any channel, in 8-bit levels. */
	maxJump: number;
	/** Zone width divided by the number of color changes, averaged over the rows. */
	averageBand: number;
	/**
	 * Longest run an undithered browser would draw in the middle row, estimated by averaging out the
	 * dither over 65 px and rounding back to 8 bits. Close to `longestRun` means no dithering.
	 */
	unditheredRun: number;
	/** Share of 64 columns across the zone holding more than one color: 0 means no dithering. */
	ditheredColumns: number;
}

function renderCase(c: HarnessCase): string {
	return render(
		{
			version: ENGINE_VERSION,
			pattern: c.pattern,
			seed: c.seed ?? '42',
			palette: c.palette ?? ['e07a5f', '3d405b', '81b29a'],
			background: c.background ?? 'f4efe6',
			size: c.size,
			params: c.params ?? {},
			variant: c.variant ?? 'light'
		},
		patterns[c.pattern]
	);
}

const pngs = new Map<number, Blob>();
let nextPng = 0;

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

async function decode(blob: Blob): Promise<ImageBitmap> {
	return createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
}

async function inspect(blob: Blob) {
	const header = new DataView(await blob.slice(0, 24).arrayBuffer());
	const bitmap = await decode(blob);
	const canvas = document.createElement('canvas');
	canvas.width = 32;
	canvas.height = 32;
	const context = canvas.getContext('2d', { willReadFrequently: true });
	if (context === null) {
		throw new Error('No canvas for the thumbnail');
	}
	context.drawImage(bitmap, 0, 0, 32, 32);
	bitmap.close();
	const { data } = context.getImageData(0, 0, 32, 32);
	const colors = new Set<number>();
	let opaque = true;
	// FNV-1a; crypto.subtle is missing on plain http, which phones on the local network use.
	let thumbnailHash = 0x811c9dc5;
	for (let i = 0; i < data.length; i += 4) {
		opaque &&= data[i + 3] === 255;
		colors.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
	}
	for (const byte of data) {
		thumbnailHash = Math.imul(thumbnailHash ^ byte, 0x01000193) >>> 0;
	}
	return {
		width: header.getUint32(16),
		height: header.getUint32(20),
		opaque,
		colors: colors.size,
		thumbnailHash
	};
}

/** Exports `c` at `size` and measures it. Never throws, so Playwright gets the error as data. */
async function png(c: HarnessCase, size: Size = c.size): Promise<PngResult> {
	const svg = renderCase(c);
	performance.clearMarks();
	const gaps: number[] = [];
	let running = true;
	let last = await nextFrame();
	const tick = (time: number) => {
		gaps.push(time - last);
		last = time;
		if (running) {
			requestAnimationFrame(tick);
		}
	};
	requestAnimationFrame(tick);
	const longTasks: number[] = [];
	const observer = PerformanceObserver.supportedEntryTypes.includes('longtask')
		? new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					longTasks.push(entry.duration);
				}
			})
		: null;
	observer?.observe({ type: 'longtask' });
	const stop = () => {
		running = false;
		longTasks.push(...(observer?.takeRecords().map((entry) => entry.duration) ?? []));
		observer?.disconnect();
	};
	const start = performance.now();
	let blob: Blob;
	try {
		blob = await svgToPng(svg, size);
	} catch (error) {
		stop();
		return {
			ok: false,
			error: error instanceof Error ? error.name : 'Error',
			message: error instanceof Error ? error.message : String(error)
		};
	}
	// Two more frames, so a frame held back by the last step is counted.
	await nextFrame();
	await nextFrame();
	stop();
	const mark = (name: string) => performance.getEntriesByName(name, 'mark')[0];
	const loaded = mark(PNG_MARKS.loaded).startTime;
	const rastered = mark(PNG_MARKS.rastered).startTime;
	const encoded = mark(PNG_MARKS.encoded) as PerformanceMark;
	const measured = {
		bytes: blob.size,
		path: (encoded.detail as { path: PngPath }).path,
		load: loaded - start,
		raster: rastered - loaded,
		encode: encoded.startTime - rastered,
		total: encoded.startTime - start,
		maxFrameGap: Math.max(...gaps),
		maxLongTask: observer === null ? null : Math.max(0, ...longTasks)
	};
	const id = nextPng++;
	pngs.set(id, blob);
	return { ok: true, id, ...measured, ...(await inspect(blob)) };
}

/**
 * Banding of a PNG of a linear gradient at angle 90, which changes along each row. Measures the
 * PNG as the browser wrote it, not the canvas before encoding.
 */
async function banding(id: number): Promise<Banding> {
	const blob = pngs.get(id);
	if (blob === undefined) {
		throw new Error(`No PNG ${id}`);
	}
	const bitmap = await decode(blob);
	const { width, height } = bitmap;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', { willReadFrequently: true });
	if (context === null) {
		throw new Error('No canvas to read the PNG');
	}
	context.drawImage(bitmap, 0, 0);
	bitmap.close();
	const color = (data: Uint8ClampedArray, i: number) =>
		(data[i * 4] << 16) | (data[i * 4 + 1] << 8) | data[i * 4 + 2];
	let longestRun = 0;
	let maxJump = 0;
	const bands: number[] = [];
	let zone = { first: 0, end: width - 1, row: new Uint8ClampedArray(0) };
	for (const share of [0.1, 0.3, 0.5, 0.7, 0.9]) {
		const { data } = context.getImageData(0, Math.floor(height * share), width, 1);
		let first = 0;
		while (first < width - 1 && color(data, first) === color(data, 0)) {
			first++;
		}
		let end = width - 1;
		while (end > first && color(data, end) === color(data, width - 1)) {
			end--;
		}
		let run = 1;
		let changes = 0;
		for (let x = first + 1; x <= end; x++) {
			for (let channel = 0; channel < 3; channel++) {
				maxJump = Math.max(maxJump, Math.abs(data[x * 4 + channel] - data[(x - 1) * 4 + channel]));
			}
			if (color(data, x) === color(data, x - 1)) {
				run++;
				longestRun = Math.max(longestRun, run);
			} else {
				run = 1;
				changes++;
			}
		}
		bands.push((end - first + 1) / (changes + 1));
		if (share === 0.5) {
			zone = { first, end, row: data };
		}
	}
	// At angle 90 every column of an undithered gradient holds one color.
	const sampled = 64;
	let dithered = 0;
	for (let i = 0; i < sampled; i++) {
		const x = Math.round(zone.first + ((zone.end - zone.first) * (i + 0.5)) / sampled);
		const { data } = context.getImageData(x, 0, 1, height);
		for (let y = 1; y < height; y++) {
			if (color(data, y) !== color(data, 0)) {
				dithered++;
				break;
			}
		}
	}
	canvas.width = 0;
	canvas.height = 0;
	const radius = 32;
	const sums = [0, 1, 2].map((channel) => {
		const sum = new Float64Array(zone.end - zone.first + 2);
		for (let x = zone.first; x <= zone.end; x++) {
			sum[x - zone.first + 1] = sum[x - zone.first] + zone.row[x * 4 + channel];
		}
		return sum;
	});
	const smoothed = (x: number) => {
		const from = Math.max(zone.first, x - radius) - zone.first;
		const to = Math.min(zone.end, x + radius) - zone.first + 1;
		return sums.map((sum) => Math.round((sum[to] - sum[from]) / (to - from))).join(',');
	};
	let unditheredRun = 1;
	let run = 1;
	let previous = smoothed(zone.first);
	for (let x = zone.first + 1; x <= zone.end; x++) {
		const current = smoothed(x);
		run = current === previous ? run + 1 : 1;
		unditheredRun = Math.max(unditheredRun, run);
		previous = current;
	}
	return {
		width,
		height,
		longestRun,
		maxJump,
		averageBand: bands.reduce((sum, band) => sum + band, 0) / bands.length,
		unditheredRun,
		ditheredColumns: dithered / sampled
	};
}

/** Exports `c` and saves it through the real download path, with its EXP-05 name. */
async function download(c: HarnessCase, format: ExportFormat, size: Size = c.size): Promise<void> {
	const svg = renderCase(c);
	const file = format === 'svg' ? svgFile(svg) : await svgToPng(svg, size);
	downloadFile(
		file,
		exportFileName({
			pattern: c.pattern,
			variant: c.variant ?? 'light',
			width: size.width,
			height: size.height,
			seed: c.seed ?? '42',
			format
		})
	);
}

/** Makes main-thread canvases larger than `maxArea` fail like Safari on iOS. */
function limitCanvas(maxArea: number): void {
	const getContext = HTMLCanvasElement.prototype.getContext;
	Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
		value(this: HTMLCanvasElement, ...args: Parameters<HTMLCanvasElement['getContext']>) {
			return this.width * this.height > maxArea ? null : getContext.apply(this, args);
		}
	});
}

const harness = {
	svg: renderCase,
	check: (size: Size): PngCheck => checkPngSize(size),
	/** The bare export, without measuring, for tests that time it themselves. */
	exportPng: (c: HarnessCase, size: Size = c.size): Promise<Blob> => svgToPng(renderCase(c), size),
	png,
	banding,
	download,
	limitCanvas
};

declare global {
	interface Window {
		harness: typeof harness;
	}
}

window.harness = harness;

// Checks to run on each phone, tablet and desktop browser (docs/laporan/ekspor/).
const desk5k = allPresets['desk-5k'];
const ios63 = allPresets['ios-63'];
const bandingParams = { type: 'linear', angle: 90, spread: 1 };
const lowChroma = ['5d6b78', '465360', '2f3a45'];
const deviceCases: { label: string; c: HarnessCase; banding?: boolean }[] = [
	{ label: 'arcs ios-63', c: { pattern: 'arcs', size: ios63 } },
	{
		label: 'waves desk-5k, max params',
		c: { pattern: 'waves', size: desk5k, params: { layers: 12, amplitude: 1, frequency: 6 } }
	},
	{
		label: 'gradient desk-5k light',
		c: { pattern: 'gradient', size: desk5k, params: bandingParams },
		banding: true
	},
	{
		label: 'gradient desk-5k dark',
		c: { pattern: 'gradient', size: desk5k, params: bandingParams, variant: 'dark' },
		banding: true
	},
	{
		label: 'gradient ios-63 dark',
		c: { pattern: 'gradient', size: ios63, params: bandingParams, variant: 'dark' },
		banding: true
	},
	{
		label: 'gradient desk-5k dark, low chroma',
		c: {
			pattern: 'gradient',
			size: desk5k,
			params: bandingParams,
			variant: 'dark',
			palette: lowChroma,
			background: 'auto'
		},
		banding: true
	},
	{ label: 'waves 7680 × 7680', c: { pattern: 'waves', size: { width: 7680, height: 7680 } } }
];

function cell(row: HTMLTableRowElement, text: string, tag: 'td' | 'th' = 'td'): HTMLElement {
	const element = document.createElement(tag);
	element.textContent = text;
	row.append(element);
	return element;
}

async function runDevice(): Promise<void> {
	const status = document.getElementById('status');
	const results = document.getElementById('results');
	const json = document.getElementById('json');
	if (status === null || results === null || json === null) {
		return;
	}
	const table = document.createElement('table');
	const head = table.insertRow();
	for (const title of [
		'Case',
		'Check',
		'PNG size',
		'Path',
		'Total ms',
		'Max frame gap ms',
		'PNG KB',
		'Longest run px',
		'Undithered run px',
		'Dithered columns',
		'Max jump',
		'File'
	]) {
		cell(head, title, 'th');
	}
	results.append(table);
	const report: unknown[] = [];
	const environment = {
		userAgent: navigator.userAgent,
		devicePixelRatio,
		screen: `${screen.width} × ${screen.height}`
	};
	for (const [index, { label, c, banding: measureBanding }] of deviceCases.entries()) {
		status.textContent = `Running ${index + 1} of ${deviceCases.length}: ${label}`;
		// Let the previous case's leftover work and memory clean-up finish before measuring.
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const check = checkPngSize(c.size);
		const size = check.ok ? c.size : check.smaller;
		const result = await png(c, size);
		const bands = result.ok && measureBanding ? await banding(result.id) : null;
		report.push({ label, check, size, result, banding: bands });
		const row = table.insertRow();
		cell(row, label);
		cell(row, check.ok ? 'fits' : `too large, offers ${size.width} × ${size.height}`);
		if (result.ok) {
			const blob = pngs.get(result.id);
			cell(row, `${result.width} × ${result.height}`);
			cell(row, result.path);
			cell(row, result.total.toFixed(0));
			cell(row, result.maxFrameGap.toFixed(0));
			cell(row, (result.bytes / 1024).toFixed(0));
			cell(row, bands === null ? '' : String(bands.longestRun));
			cell(row, bands === null ? '' : String(bands.unditheredRun));
			cell(row, bands === null ? '' : `${Math.round(bands.ditheredColumns * 100)}%`);
			cell(row, bands === null ? '' : String(bands.maxJump));
			const link = document.createElement('a');
			link.textContent = 'PNG';
			if (blob !== undefined) {
				link.href = URL.createObjectURL(blob);
				link.download = exportFileName({
					pattern: c.pattern,
					variant: c.variant ?? 'light',
					width: result.width,
					height: result.height,
					seed: c.seed ?? '42',
					format: 'png'
				});
			}
			cell(row, '').append(link);
		} else {
			cell(row, `failed: ${result.message}`);
		}
	}
	status.textContent = 'Done. Send a screenshot of the table and the text below.';
	json.textContent = JSON.stringify({ environment, report }, null, 2);
}

if (new URLSearchParams(location.search).get('run') === 'device') {
	void runDevice();
}
