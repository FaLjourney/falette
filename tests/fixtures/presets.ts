import type { Size } from '../../src/lib/engine/types';

/** The 6 representative presets from PRD Appendix A (PAT-10), until presets.json exists. */
export const representativePresets: Record<string, Size> = {
	'and-fhd20': { width: 1080, height: 2400 },
	'ios-63': { width: 1206, height: 2622 },
	'ipad-pro-13': { width: 2064, height: 2752 },
	'mba-13': { width: 2560, height: 1664 },
	'desk-uw': { width: 3440, height: 1440 },
	'desk-5k': { width: 5120, height: 2880 }
};

/** Every portrait preset in PRD Appendix A (all phones and tablets), until presets.json exists. */
export const portraitPresets: Record<string, Size> = {
	'ios-69': { width: 1320, height: 2868 },
	'ios-67': { width: 1290, height: 2796 },
	'ios-65': { width: 1260, height: 2736 },
	'ios-63': { width: 1206, height: 2622 },
	'ios-61': { width: 1179, height: 2556 },
	'ios-61b': { width: 1170, height: 2532 },
	'and-qhd': { width: 1440, height: 3120 },
	'and-pixel': { width: 1280, height: 2856 },
	'and-15k': { width: 1220, height: 2712 },
	'and-fhd20': { width: 1080, height: 2400 },
	'and-fhd195': { width: 1080, height: 2340 },
	'ipad-pro-13': { width: 2064, height: 2752 },
	'ipad-air-13': { width: 2048, height: 2732 },
	'ipad-pro-11': { width: 1668, height: 2420 },
	'ipad-11': { width: 1640, height: 2360 },
	'ipad-mini': { width: 1488, height: 2266 },
	'tab-wqxga': { width: 1600, height: 2560 }
};

/** Every landscape preset in PRD Appendix A (all laptops and desktops), until presets.json exists. */
export const landscapePresets: Record<string, Size> = {
	'mbp-16': { width: 3456, height: 2234 },
	'mbp-14': { width: 3024, height: 1964 },
	'mba-15': { width: 2880, height: 1864 },
	'mba-13': { width: 2560, height: 1664 },
	'lap-wuxga': { width: 1920, height: 1200 },
	'lap-wqxga': { width: 2560, height: 1600 },
	'desk-5k': { width: 5120, height: 2880 },
	'desk-4k': { width: 3840, height: 2160 },
	'desk-uw': { width: 3440, height: 1440 },
	'desk-qhd': { width: 2560, height: 1440 },
	'desk-fhd': { width: 1920, height: 1080 }
};

/** All 28 presets in PRD Appendix A, until presets.json exists. */
export const allPresets: Record<string, Size> = { ...portraitPresets, ...landscapePresets };
