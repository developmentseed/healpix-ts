/**
 * @module constants
 * Mathematical constants used throughout HEALPix calculations
 */

/** Full circle (360°) = 2π */
export const PI2 = 2 * Math.PI;

/** Half circle (180°) = π */
export const PI = Math.PI;

/** Quarter circle (90°) = π/2 - used for polar cap boundaries */
export const PI_2 = Math.PI / 2;

/** Eighth circle (45°) = π/4 - fundamental HEALPix angular unit */
export const PI_4 = Math.PI / 4;

/** Sixteenth circle (22.5°) = π/8 */
export const PI_8 = Math.PI / 8;

/** Degrees to radians conversion factor */
export const DEG2RAD = Math.PI / 180;

/** Radians to degrees conversion factor */
export const RAD2DEG = 180 / Math.PI;
