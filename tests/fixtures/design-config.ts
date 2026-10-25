import { ENGINE_VERSION } from '../../src/lib/engine/render';
import type { RenderConfig, Size, Variant } from '../../src/lib/engine/types';
import presets from '../../src/lib/presets/presets.json' with { type: 'json' };
import type { Design } from '../../src/lib/share/link';

/** Size used when a design has no device, standing in for device detection (DEV-03). */
const DETECTED: Size = { width: 1206, height: 2622 };

/** The render config of one variant of a design, as the Create preview will build it. */
export function designConfig(design: Design, variant: Variant): RenderConfig {
	const { device } = design;
	let size = DETECTED;
	if (device !== null && 'preset' in device) {
		const preset = presets.find(({ id }) => id === device.preset)!;
		size = { width: preset.width, height: preset.height };
	} else if (device !== null) {
		size = device;
	}
	return {
		version: ENGINE_VERSION,
		pattern: design.pattern,
		seed: design.seed,
		palette: design.palette,
		background: design.background,
		size,
		params: design.params,
		variant
	};
}
