// Language redirect for / and /create/ (NAV-10, NAV-11): the stored language, then the first
// supported browser language, then English. Query and hash stay intact, so share links keep their
// design. Inlined by src/hooks.server.ts and allowed by its hash in the CSP (vite.config.ts).
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
	const browser = () =>
		navigator.languages
			.map((tag) => tag.toLowerCase().split('-')[0])
			.find((code) => supported.includes(code));
	const lang = stored() ?? browser() ?? 'en';
	location.replace(`/${lang}${location.pathname}${location.search}${location.hash}`);
})();
