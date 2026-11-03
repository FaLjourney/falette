// Website theme before the first render (THM-02, THM-04). Inlined into every page by
// src/hooks.server.ts and allowed by its hash in the CSP (vite.config.ts).
(() => {
	const system = matchMedia('(prefers-color-scheme: dark)');
	const stored = () => {
		try {
			const theme = localStorage.getItem('falette:theme');
			return theme === 'light' || theme === 'dark' ? theme : null;
		} catch {
			return null;
		}
	};
	// Read the stored choice on every change, so a choice made after load stops following the system.
	const apply = () => {
		document.documentElement.dataset.theme = stored() ?? (system.matches ? 'dark' : 'light');
	};
	apply();
	system.addEventListener('change', apply);
})();
