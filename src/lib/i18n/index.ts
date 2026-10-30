import type { Language } from '../../params/lang';
import type en from './en.json';

/** UI text of one language; `en.json` defines the keys and every other file has the same ones. */
export type Messages = typeof en;

type Keys<T, Prefix extends string = ''> = {
	[K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Keys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Dotted path to one text, e.g. `meta.home.title`. */
export type MessageKey = Keys<Messages>;

export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

// One chunk per language, so the browser only loads the active one (NFR Bahasa).
const dictionaries: Record<Language, () => Promise<{ default: Messages }>> = {
	en: () => import('./en.json'),
	id: () => import('./id.json')
};

export async function loadMessages(lang: Language): Promise<Messages> {
	return (await dictionaries[lang]()).default;
}

/** `t(key, values)` for one language; `{name}` placeholders are filled from `values`. */
export function translator(messages: Messages): Translate {
	return (key, values = {}) => {
		let text: unknown = messages;
		for (const part of key.split('.')) {
			text = (text as Record<string, unknown>)[part];
		}
		if (typeof text !== 'string') {
			throw new Error(`Missing text: ${key}`);
		}
		return text.replace(/\{(\w+)\}/g, (_, name: string) => {
			if (!(name in values)) {
				throw new Error(`Missing value for {${name}} in ${key}`);
			}
			return String(values[name]);
		});
	};
}
