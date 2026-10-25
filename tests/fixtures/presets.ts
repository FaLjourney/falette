import type { Size } from '../../src/lib/engine/types';
import presets from '../../src/lib/presets/presets.json' with { type: 'json' };

type Preset = (typeof presets)[number];

const sizes = (list: Preset[]): Record<string, Size> =>
	Object.fromEntries(list.map(({ id, width, height }) => [id, { width, height }]));

/** IDs of the 6 representative presets from PRD Appendix A (PAT-10). */
const representativeIds = ['and-fhd20', 'ios-63', 'ipad-pro-13', 'mba-13', 'desk-uw', 'desk-5k'];

/** The 6 representative presets from PRD Appendix A (PAT-10). */
export const representativePresets: Record<string, Size> = sizes(
	representativeIds.map((id) => presets.find((preset) => preset.id === id)!)
);

/** Every portrait preset in PRD Appendix A (all phones and tablets). */
export const portraitPresets: Record<string, Size> = sizes(
	presets.filter(({ category }) => category === 'phone' || category === 'tablet')
);

/** Every landscape preset in PRD Appendix A (all laptops and desktops). */
export const landscapePresets: Record<string, Size> = sizes(
	presets.filter(({ category }) => category === 'laptop' || category === 'desktop')
);

/** All 28 presets in PRD Appendix A. */
export const allPresets: Record<string, Size> = { ...portraitPresets, ...landscapePresets };
