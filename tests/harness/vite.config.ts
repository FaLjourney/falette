import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Test page for src/lib/export in real browsers, for Playwright and for checks on phones over the
// local network (npm run harness). It is built on its own and never ships with the site.
export default defineConfig({
	root: fileURLToPath(new URL('.', import.meta.url)),
	base: './',
	build: {
		outDir: fileURLToPath(new URL('../../.harness', import.meta.url)),
		emptyOutDir: true
	},
	preview: { port: 4174, strictPort: true }
});
