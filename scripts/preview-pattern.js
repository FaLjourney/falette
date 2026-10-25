// Writes the PAT-10 previews of one pattern, in light and dark, with the palette and background of
// the PRD Appendix B example:
// - seed 42 with default params on the 6 representative presets,
// - seeds 1–8 with default params on and-fhd20 and mba-13,
// - seed 42 on and-fhd20 with each param at its min, default and max (each option for choices).
// Each set is saved as SVG files and as one PNG sheet, rendered with Playwright's Chromium
// (once: npx playwright install chromium). Also reports file sizes and the median render time at
// desk-5k for default and maximum params (ENG-07).
// Optional key=value arguments fix those params in every set, e.g. type=radial; the files then go
// to previews/<pattern-id>/<key>-<value>/.
// Usage: npm run preview:pattern -- <pattern-id> [key=value ...]
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { runnerImport } from 'vite';

const id = process.argv[2];
if (id === undefined) {
	process.stderr.write('Usage: npm run preview:pattern -- <pattern-id> [key=value ...]\n');
	process.exit(1);
}
const fixed = Object.fromEntries(
	process.argv.slice(3).map((arg) => {
		const [key, value] = arg.split('=');
		return [key, value !== '' && Number.isFinite(Number(value)) ? Number(value) : value];
	})
);
const out = [
	'previews',
	id,
	...Object.entries(fixed).map(([key, value]) => `${key}-${value}`)
].join('/');
const title = [id, ...Object.entries(fixed).map(([key, value]) => `${key} ${value}`)].join(' · ');
const seed = '42';
const seeds = ['1', '2', '3', '4', '5', '6', '7', '8'];
const seedPresets = ['and-fhd20', 'mba-13'];
const paramPreset = 'and-fhd20';
const palette = ['e07a5f', '3d405b', '81b29a'];
const background = 'f4efe6';
const timedRuns = 50;
const sheetHeight = 320;

// Loads TypeScript sources through Vite, without the project config and its SvelteKit plugin.
async function load(path) {
	const { module } = await runnerImport(resolve(path), { configFile: false, logLevel: 'silent' });
	return module;
}

const { ENGINE_VERSION, render } = await load('src/lib/engine/render.ts');
const { representativePresets } = await load('tests/fixtures/presets.ts');
const pattern = (await load(`src/lib/patterns/${id}.ts`)).default;

const config = (size, variant, params, runSeed = seed) => ({
	version: ENGINE_VERSION,
	pattern: id,
	seed: runSeed,
	palette,
	background,
	size,
	params,
	variant
});
const print = (line) => process.stdout.write(`${line}\n`);

/** One preview: its file name, sheet row and label, size, seed and params. */
const item = (file, group, label, preset, params = {}, runSeed = seed) => ({
	file,
	group,
	label,
	size: representativePresets[preset],
	params: { ...params, ...fixed },
	seed: runSeed
});

const paramValues = Object.entries(pattern.params)
	.filter(([key]) => !(key in fixed))
	.flatMap(([key, def]) =>
		(def.type === 'number' ? [def.min, def.default, def.max] : def.options).map((value) => [
			key,
			value
		])
	);
const sets = [
	{
		name: `seed-${seed}`,
		items: Object.keys(representativePresets).map((preset) =>
			item(preset, `seed ${seed}`, preset, preset)
		)
	},
	{
		name: 'seeds',
		items: seedPresets.flatMap((preset) =>
			seeds.map((s) => item(`seeds/${preset}-${s}`, preset, `seed ${s}`, preset, {}, s))
		)
	},
	{
		name: 'params',
		items: paramValues.map(([key, value]) =>
			item(`params/${key}-${value}`, `${paramPreset} ${key}`, `${key} ${value}`, paramPreset, {
				[key]: value
			})
		)
	}
];

/** HTML page with one row per variant and group, each preview scaled to the same height and labelled. */
function sheet(title, rows) {
	const cells = (previews) =>
		previews
			.map(({ label, size, svg }) => {
				const width = Math.round((size.width / size.height) * sheetHeight);
				const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
				return `<figure><img src="${src}" width="${width}" height="${sheetHeight}" alt=""><figcaption>${label}</figcaption></figure>`;
			})
			.join('');
	return `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#e5e5e5;color:#222;font:13px system-ui,sans-serif;width:max-content}
h1{margin:0 0 12px;font-size:15px}h2{margin:12px 0 6px;font-size:13px}
.row{display:flex;gap:10px}figure{margin:0}img{display:block;outline:1px solid #bbb}
figcaption{margin-top:3px}</style><h1>${title}</h1>${rows
		.map(({ label, previews }) => `<h2>${label}</h2><div class="row">${cells(previews)}</div>`)
		.join('')}`;
}

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { name, items } of sets) {
	const rows = [];
	for (const variant of ['light', 'dark']) {
		for (const { file, group, label, size, params, seed: runSeed } of items) {
			const svg = render(config(size, variant, params, runSeed), pattern);
			const path = `${out}/${variant}/${file}.svg`;
			await mkdir(resolve(path, '..'), { recursive: true });
			await writeFile(path, svg);
			print(`${path}  ${Buffer.byteLength(svg)} B`);
			const row = `${variant} · ${group}`;
			if (rows.at(-1)?.label !== row) rows.push({ label: row, previews: [] });
			rows.at(-1).previews.push({ label, size, svg });
		}
	}
	// Start narrow, then widen the page to the sheet so the PNG has no empty margin.
	await page.setViewportSize({ width: 320, height: 600 });
	await page.setContent(sheet(`${title} · ${name}`, rows));
	const width = await page.evaluate(() => document.documentElement.scrollWidth);
	await page.setViewportSize({ width, height: 600 });
	const png = `${out}/${name}.png`;
	await page.screenshot({ path: png, fullPage: true });
	print(png);
}
await browser.close();

const maxParams = Object.fromEntries(
	Object.entries(pattern.params).map(([key, def]) => [
		key,
		def.type === 'number' ? def.max : def.default
	])
);
for (const [label, params] of [
	['default', {}],
	['max', maxParams]
]) {
	const timed = { ...params, ...fixed };
	const run = config(representativePresets['desk-5k'], 'light', timed);
	for (let i = 0; i < timedRuns; i++) render(run, pattern);
	const times = Array.from({ length: timedRuns }, () => {
		const start = performance.now();
		render(run, pattern);
		return performance.now() - start;
	}).sort((a, b) => a - b);
	const median = times[Math.floor(timedRuns / 2)];
	const bytes = Buffer.byteLength(render(run, pattern));
	print(
		`desk-5k ${label} ${JSON.stringify(timed)}: median ${median.toFixed(3)} ms, ` +
			`slowest ${times[timedRuns - 1].toFixed(3)} ms of ${timedRuns}, ${bytes} B (ENG-07: 50 ms)`
	);
}
