import { defineConfig } from '@playwright/test';

// Chromium by default. PW_BROWSERS=all adds Firefox and WebKit, after npx playwright install
// firefox webkit (see docs/laporan/ekspor/).
const browsers =
	process.env.PW_BROWSERS === 'all'
		? (['chromium', 'firefox', 'webkit'] as const)
		: (['chromium'] as const);

export default defineConfig({
	webServer: [
		{ command: 'npm run build && npm run preview', port: 4173 },
		// The export test page (tests/harness), served on its own port.
		{ command: 'npm run harness', port: 4174 }
	],
	use: { baseURL: 'http://localhost:4173' },
	testDir: 'tests',
	testMatch: '**/*.e2e.ts',
	projects: browsers.map((browserName) => ({ name: browserName, use: { browserName } }))
});
