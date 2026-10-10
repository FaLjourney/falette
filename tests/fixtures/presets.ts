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
