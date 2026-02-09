/**
 * @module lookup/lookup
 * High-level API for position ↔ pixel index conversions
 */

import { V3, AngularCoords } from '../types';
import { vec2za, za2vec } from '../coordinates/spherical';
import { za2tu, tu2za } from '../coordinates/projection';
import { tu2fxy, fxy2tu } from '../pixel/fxy';
import { fxy2nest, nest2fxy } from '../schemes/nested';
import { nest2ring, ring2nest } from '../schemes/conversion';
import { fxyCorners, fxySubpixel } from '../pixel/geometry';

// ============================================================================
// POSITION → PIXEL INDEX
// ============================================================================

/**
 * Converts 3D vector to NESTED pixel index.
 *
 * @param nside - Grid resolution
 * @param v - [X, Y, Z] unit vector on sphere
 * @returns Nested pixel index containing this point
 *
 * Pipeline: vec → (z,a) → (t,u) → (f,x,y) → nested index
 */
export function vec2PixNest(nside: number, v: V3): number {
  const { z, a } = vec2za(v[0], v[1], v[2]);
  const { t, u } = za2tu(z, a);
  const { f, x, y } = tu2fxy(nside, t, u);
  return fxy2nest(nside, f, x, y);
}

/**
 * Converts 3D vector to RING pixel index.
 *
 * @param nside - Grid resolution
 * @param v - [X, Y, Z] unit vector
 * @returns Ring pixel index containing this point
 */
export function vec2PixRing(nside: number, v: V3): number {
  return nest2ring(nside, vec2PixNest(nside, v));
}

/**
 * Converts angular position to NESTED pixel index.
 *
 * @param nside - Grid resolution
 * @param theta - Colatitude [0, π]
 * @param phi - Longitude [0, 2π)
 * @returns Nested pixel index
 */
export function ang2PixNest(nside: number, theta: number, phi: number): number {
  const z = Math.cos(theta);
  const { t, u } = za2tu(z, phi);
  const { f, x, y } = tu2fxy(nside, t, u);
  return fxy2nest(nside, f, x, y);
}

/**
 * Converts angular position to RING pixel index.
 *
 * @param nside - Grid resolution
 * @param theta - Colatitude [0, π]
 * @param phi - Longitude [0, 2π)
 * @returns Ring pixel index
 */
export function ang2PixRing(nside: number, theta: number, phi: number): number {
  return nest2ring(nside, ang2PixNest(nside, theta, phi));
}

// ============================================================================
// PIXEL INDEX → POSITION
// ============================================================================

/**
 * Converts NESTED pixel index to 3D vector (pixel center).
 *
 * @param nside - Grid resolution
 * @param ipix - Nested pixel index
 * @returns [X, Y, Z] unit vector at pixel center
 *
 * Pipeline: nested → (f,x,y) → (t,u) → (z,a) → vec
 */
export function pix2VecNest(nside: number, ipix: number): V3 {
  const { f, x, y } = nest2fxy(nside, ipix);
  const { t, u } = fxy2tu(nside, f, x, y);
  const { z, a } = tu2za(t, u);
  return za2vec(z, a);
}

/**
 * Converts RING pixel index to 3D vector (pixel center).
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @returns [X, Y, Z] unit vector at pixel center
 */
export function pix2VecRing(nside: number, ipix: number): V3 {
  return pix2VecNest(nside, ring2nest(nside, ipix));
}

/**
 * Converts NESTED pixel index to angular coordinates (pixel center).
 *
 * @param nside - Grid resolution
 * @param ipix - Nested pixel index
 * @returns { theta, phi } colatitude and longitude of pixel center
 */
export function pix2AngNest(nside: number, ipix: number): AngularCoords {
  const { f, x, y } = nest2fxy(nside, ipix);
  const { t, u } = fxy2tu(nside, f, x, y);
  const { z, a } = tu2za(t, u);
  return { theta: Math.acos(z), phi: a };
}

/**
 * Converts RING pixel index to angular coordinates (pixel center).
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @returns { theta, phi } colatitude and longitude of pixel center
 */
export function pix2AngRing(nside: number, ipix: number): AngularCoords {
  return pix2AngNest(nside, ring2nest(nside, ipix));
}

// ============================================================================
// PIXEL GEOMETRY
// ============================================================================

/**
 * Returns the 4 corner vertices of a NESTED pixel.
 *
 * @param nside - Grid resolution
 * @param ipix - Nested pixel index
 * @returns Array of 4 V3 vectors: [north, west, south, east] corners
 *
 * The corners are returned in counter-clockwise order starting from north.
 */
export function cornersNest(nside: number, ipix: number): V3[] {
  const { f, x, y } = nest2fxy(nside, ipix);
  return fxyCorners(nside, f, x, y);
}

/**
 * Returns the 4 corner vertices of a RING pixel.
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @returns Array of 4 V3 vectors: [north, west, south, east] corners
 */
export function cornersRing(nside: number, ipix: number): V3[] {
  return cornersNest(nside, ring2nest(nside, ipix));
}

/**
 * Returns 3D vector for a position within a NESTED pixel.
 *
 * @param nside - Grid resolution
 * @param ipix - Nested pixel index
 * @param ne - Fractional offset along NE direction [0, 1]
 * @param nw - Fractional offset along NW direction [0, 1]
 * @returns [X, Y, Z] unit vector at specified sub-pixel position
 *
 * This allows sampling at arbitrary positions within a pixel, not just the center.
 *
 * Special values:
 * - (ne=0.5, nw=0.5): pixel center (same as pix2VecNest)
 * - (ne=0, nw=0): south corner
 * - (ne=1, nw=0): east corner
 * - (ne=0, nw=1): west corner
 * - (ne=1, nw=1): north corner
 */
export function pixcoord2VecNest(
  nside: number,
  ipix: number,
  ne: number,
  nw: number
): V3 {
  const { f, x, y } = nest2fxy(nside, ipix);
  return fxySubpixel(nside, f, x, y, ne, nw);
}

/**
 * Returns 3D vector for a position within a RING pixel.
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @param ne - Fractional NE offset [0, 1]
 * @param nw - Fractional NW offset [0, 1]
 * @returns [X, Y, Z] unit vector
 */
export function pixcoord2VecRing(
  nside: number,
  ipix: number,
  ne: number,
  nw: number
): V3 {
  return pixcoord2VecNest(nside, ring2nest(nside, ipix), ne, nw);
}
