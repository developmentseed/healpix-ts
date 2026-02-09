/**
 * @module pixel/geometry
 * Pixel geometry functions: corners, sub-pixel positions, pixel radius
 */

import { V3 } from '../types';
import { PI_4 } from '../constants';
import { fxy2tu } from './fxy';
import { tu2za, tu2vec } from '../coordinates/projection';
import { za2vec, angularDistance } from '../coordinates/spherical';

/**
 * Returns the 4 corner vertices of a pixel given (f, x, y) coordinates.
 *
 * @param nside - Grid resolution
 * @param f - Base pixel index
 * @param x - NE pixel index
 * @param y - NW pixel index
 * @returns Array of 4 V3 vectors: [north, west, south, east] corners
 *
 * The corners are returned in counter-clockwise order starting from north.
 *
 * Implementation: offset from pixel center by ±d in t and u directions,
 * where d = π/(4*nside) is the angular size of half a pixel.
 */
export function fxyCorners(
  nside: number,
  f: number,
  x: number,
  y: number
): V3[] {
  const { t, u } = fxy2tu(nside, f, x, y);
  const d = PI_4 / nside; // Half-pixel angular size

  const corners: V3[] = [];

  // Four corners: offset (t, u) by d in cardinal directions
  // Order: north (u+d), west (t-d), south (u-d), east (t+d)
  for (const [tt, uu] of [
    [0, d], // North corner: u increases
    [-d, 0], // West corner: t decreases
    [0, -d], // South corner: u decreases
    [d, 0] // East corner: t increases
  ]) {
    const { z, a } = tu2za(t + tt, u + uu);
    corners.push(za2vec(z, a));
  }

  return corners;
}

/**
 * Returns 3D vector for a sub-pixel position.
 *
 * @param nside - Grid resolution
 * @param f - Base pixel index
 * @param x - NE pixel index
 * @param y - NW pixel index
 * @param ne - Fractional offset along NE direction [0, 1]
 * @param nw - Fractional offset along NW direction [0, 1]
 * @returns [X, Y, Z] unit vector
 *
 * This allows sampling at arbitrary positions within a pixel.
 *
 * Special values:
 * - (ne=0.5, nw=0.5): pixel center
 * - (ne=0, nw=0): south corner
 * - (ne=1, nw=0): east corner
 * - (ne=0, nw=1): west corner
 * - (ne=1, nw=1): north corner
 *
 * The transformation works by:
 * - ne-nw gives offset along t (east-west)
 * - ne+nw-1 gives offset along u (north-south), centered at 0.5+0.5=1
 */
export function fxySubpixel(
  nside: number,
  f: number,
  x: number,
  y: number,
  ne: number,
  nw: number
): V3 {
  const { t, u } = fxy2tu(nside, f, x, y);
  const d = PI_4 / nside; // Angular size of one pixel

  // Offset from pixel center based on (ne, nw) coordinates
  const { z, a } = tu2za(t + d * (ne - nw), u + d * (ne + nw - 1));
  return za2vec(z, a);
}

/**
 * Computes the maximum angular radius of a pixel.
 *
 * @param nside - Grid resolution
 * @returns Maximum distance from pixel center to any corner (in radians)
 *
 * This is the "circumradius" of the pixel - the distance from the center
 * to the farthest corner. Useful for disc queries to ensure we don't
 * miss pixels that partially overlap.
 *
 * The calculation computes the angle between two adjacent corner points
 * in the projection space, which gives the pixel's angular extent.
 */
export function maxPixelRadius(nside: number): number {
  // Compute angle between two points separated by one pixel width
  const unit = PI_4 / nside;
  return angularDistance(
    tu2vec(unit, nside * unit),
    tu2vec(unit, (nside + 1) * unit)
  );
}
