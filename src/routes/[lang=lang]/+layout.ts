import { loadMessages, translator } from '#lib/i18n/index.ts';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params }) => {
	const messages = await loadMessages(params.lang);
	return { lang: params.lang, t: translator(messages) };
};
