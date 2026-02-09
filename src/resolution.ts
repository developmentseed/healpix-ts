/**
 * @module resolution
 * Functions for converting between HEALPix resolution parameters
 */

import { PI } from './constants';
import { ilog2 } from './utils';

/**
 * Converts HEALPix order (resolution level) to nside (grid divisions).
 *
 * @param order - Resolution level (0, 1, 2, 3, ...)
 * @returns nside = 2^order (1, 2, 4, 8, 16, ...)
 * @throws {RangeError} If order is negative or exceeds maximum safe bit shift (29)
 *
 * The relationship is: nside = 2^order
 *
 * | Order | Nside | Total Pixels | Pixel Size (deg²) |
 * |-------|-------|--------------|-------------------|
 * |   0   |   1   |      12      |     3437.75       |
 * |   1   |   2   |      48      |      859.44       |
 * |   2   |   4   |     192      |      214.86       |
 * |   3   |   8   |     768      |       53.72       |
 * |  10   | 1024  |  12,582,912  |        0.003      |
 *
 * The bit-shift operation `1 << order` is equivalent to 2^order but faster.
 */
export function order2nside(order: number): number {
  if (order < 0 || order > 29) {
    throw new RangeError(`order must be between 0 and 29, got ${order}`);
  }
  return 1 << order;
}

/**
 * Converts nside (grid divisions) back to order (resolution level).
 *
 * @param nside - Must be a positive power of 2 (1, 2, 4, 8, ...)
 * @returns order = log2(nside)
 * @throws {RangeError} If nside is not a positive integer
 * @throws {RangeError} If nside is not a power of 2
 *
 * This is the inverse of order2nside.
 */
export function nside2order(nside: number): number {
  if (nside <= 0 || !Number.isInteger(nside)) {
    throw new RangeError(`nside must be a positive integer, got ${nside}`);
  }
  if ((nside & (nside - 1)) !== 0) {
    throw new RangeError(`nside must be a power of 2, got ${nside}`);
  }
  return ilog2(nside);
}

/**
 * Calculates the total number of pixels at a given resolution.
 *
 * @param nside - Grid resolution parameter
 * @returns Total pixel count = 12 * nside²
 *
 * The formula comes from:
 * - 12 base pixels
 * - Each base pixel subdivided into nside × nside smaller pixels
 * - Total = 12 * nside * nside
 *
 * Examples:
 * - nside=1:    12 pixels (base resolution)
 * - nside=2:    48 pixels
 * - nside=4:   192 pixels
 * - nside=1024: ~12.6 million pixels
 */
export function nside2npix(nside: number): number {
  return 12 * nside * nside;
}

/**
 * Calculates the solid angle (area) of each pixel in steradians.
 *
 * @param nside - Grid resolution parameter
 * @returns Pixel area in steradians
 *
 * Since HEALPix pixels have EQUAL AREA, this is simply:
 *   pixel_area = total_sphere_area / number_of_pixels
 *              = 4π / (12 * nside²)
 *              = π / (3 * nside²)
 *
 * The full sphere has solid angle 4π steradians ≈ 41,253 square degrees.
 */
export function nside2pixarea(nside: number): number {
  return PI / (3 * nside * nside);
}

/**
 * Calculates the approximate angular size (resolution) of pixels.
 *
 * @param nside - Grid resolution parameter
 * @returns Average pixel size in radians
 *
 * This gives the characteristic angular scale of pixels.
 * Computed as the square root of the pixel area:
 *   resolution ≈ √(pixel_area) = √(π/3) / nside
 *
 * For nside=1024, resolution ≈ 3.4 arcminutes
 */
export function nside2resol(nside: number): number {
  return Math.sqrt(PI / 3) / nside;
}
