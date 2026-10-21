// Values the PRD leaves open, approved for step 2b. Changing any of them
// changes rendered output: after the public release that requires an engine
// version bump (SHR-03); before the release the version stays 1.

/** OKLCH lightness of the light-variant background (COL-05). Renders Appendix B's f4efe6 unchanged. */
export const BG_LIGHT_L = 0.954;

/** OKLCH lightness of the dark-variant background (COL-05), about #1f1f1f when neutral. */
export const BG_DARK_L = 0.24;

/** Chroma of the Auto background: a pale tint that fits sRGB for every hue at both lightness locks. */
export const BG_AUTO_C = 0.02;

/** Chroma multiplier for the dark variant, background and pattern colors alike (MODE-02). */
export const DARK_CHROMA = 0.92;

/** Minimum lightness distance between the dark background and each dark pattern color (MODE-02). */
export const MIN_DL = 0.31;

/** OKLab distance below which the background counts as too similar to a pattern color (COL-05). */
export const SIMILAR_DE = 0.1;

/** Below this chroma a color's hue is treated as undefined when building gradations (ENG-11). */
export const ACHROMATIC_C = 0.02;

/** Fixed bisection steps when lowering chroma into the sRGB gamut (ENG-05). */
export const GAMUT_STEPS = 32;
