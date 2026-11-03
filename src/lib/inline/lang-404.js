// Language of the 404 page: the stored language, with English as the fallback (PRD route table).
// The page holds every language and CSS shows the one in <html lang>, so this runs before the
// first render. Inlined by src/hooks.server.ts and allowed by its hash in the CSP (vite.config.ts).
(() => {
	const supported = ['en', 'id'];
	const stored = () => {
		try {
			const lang = localStorage.getItem('falette:lang');
			return supported.find((code) => code === lang) ?? null;
		} catch {
			return null;
		}
	};
	const lang = stored();
	if (lang === null || lang === document.documentElement.lang) return;
	document.documentElement.lang = lang;
	document.addEventListener('DOMContentLoaded', () => {
		const title = document
			.querySelector(`[lang="${lang}"][data-title]`)
			?.getAttribute('data-title');
		if (title) document.title = title;
	});
})();
