export const languages = ['en', 'id'] as const;

export type Language = (typeof languages)[number];

export function lang(param: string): Language | undefined {
	return languages.find((language) => language === param);
}
