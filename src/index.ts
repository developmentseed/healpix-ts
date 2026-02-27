/**
 * # HEALPix TypeScript Library
 *
 * A complete implementation of the HEALPix (Hierarchical Equal Area isoLatitude Pixelization)
 * spherical projection system.
 *
 * Based on: [Górski et al. (2005)](http://iopscience.iop.org/article/10.1086/427976/pdf)
 *
 * ## Quick Start
 *
 * ```typescript
 * import {
 *   ang2PixNest,
 *   pix2AngNest,
 *   pix2LonLatNest,
 *   order2nside
 * } from 'healpix'
 *
 * // Convert angular position to pixel index
 * const nside = order2nside(8)  // nside = 256
 * const ipix = ang2PixNest(nside, Math.PI/4, Math.PI/2)
 *
 * // Get pixel center coordinates
 * const [lon, lat] = pix2LonLatNest(nside, ipix)
 * ```
 *
 * @packageDocumentation
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Utilities
export { clip, wrap, square, ilog2, rad2Deg, deg2Rad } from './utils';

// Resolution conversions
export * from './resolution';

// Coordinate systems
export * from './coordinates';

// Pixel operations
export * from './pixel';

// Numbering schemes
export * from './schemes';

// High-level lookup functions
export * from './lookup';

// Spatial queries
export * from './query';

// Geographic utilities
export * from './geo';
