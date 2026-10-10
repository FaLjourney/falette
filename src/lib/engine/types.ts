/** Wallpaper mode variant. `render()` produces one variant per call. */
export type Variant = 'light' | 'dark';

export interface Size {
	width: number;
	height: number;
}

export type ParamValue = number | string;

export type Params = Record<string, ParamValue>;

/** Everything `render()` needs to reproduce one wallpaper variant. */
export interface RenderConfig {
	/** Engine version (SHR-03). */
	version: number;
	/** Pattern ID (PAT-09). */
	pattern: string;
	/** Always text, numeric seeds included, so links keep their output when word seeds arrive (PAT-05). */
	seed: string;
	/** Light-variant pattern colors as HEX without `#`, 1–5 entries. */
	palette: string[];
	/** `auto` or a light-variant HEX without `#` (COL-05). */
	background: 'auto' | string;
	size: Size;
	params: Params;
	variant: Variant;
}

/** Category keys; user-facing labels live in the translation files. */
export type Category =
	| 'landscape'
	| 'gradient'
	| 'geometry'
	| 'tiles-textiles'
	| 'organic'
	| 'math'
	| 'lines-flow'
	| 'retro-digital'
	| 'sky-weather';

export interface NumberParamDef {
	type: 'number';
	min: number;
	max: number;
	step: number;
	default: number;
}

export interface ChoiceParamDef {
	type: 'choice';
	options: readonly string[];
	default: string;
}

export type ParamDef = NumberParamDef | ChoiceParamDef;

export type ParamSchema = Record<string, ParamDef>;

export interface GenerateContext {
	width: number;
	height: number;
	/** Every key in the pattern's schema, with defaults filled in. */
	params: Params;
	/** Seeded random source in [0, 1) (ENG-02). */
	rng: () => number;
}

/** One pattern module (ENG-03). */
export interface PatternModule {
	id: string;
	name: string;
	category: Category;
	params: ParamSchema;
	/** Returns the SVG elements that go inside the root `<svg>`. */
	generate(ctx: GenerateContext): string;
}
