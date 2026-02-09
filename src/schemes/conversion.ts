/**
 * @module schemes/conversion
 * Conversion between NESTED and RING schemes
 */

import { nest2fxy, fxy2nest } from './nested';
import { ring2fxy, fxy2ring } from './ring';

/**
 * Converts NESTED pixel index to RING pixel index.
 *
 * @param nside - Grid resolution
 * @param ipix - Nested pixel index
 * @returns Ring pixel index
 */
export function nest2ring(nside: number, ipix: number): number {
  const { f, x, y } = nest2fxy(nside, ipix);
  return fxy2ring(nside, f, x, y);
}

/**
 * Converts RING pixel index to NESTED pixel index.
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @returns Nested pixel index
 */
export function ring2nest(nside: number, ipix: number): number {
  if (nside === 1) {
    return ipix; // At base resolution, both schemes are identical
  }
  const { f, x, y } = ring2fxy(nside, ipix);
  return fxy2nest(nside, f, x, y);
}
