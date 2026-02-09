/**
 * @module pixel/fxy
 * Conversions between projection coordinates (t, u) and pixel coordinates (f, x, y)
 */

import { FXY, TU } from '../types';
import { PI_2, PI_4 } from '../constants';
import { clip, wrap } from '../utils';

/**
 * Converts projection coordinates to base pixel and fractional position.
 *
 * @param t - Projection x-coordinate
 * @param u - Projection y-coordinate
 * @returns { f, p, q } where f is base pixel, (p,q) are fractional coords [0,1)
 *
 * This function determines which of the 12 base pixels contains the point,
 * and where within that base pixel (as fractions p, q along NE and NW axes).
 *
 * ## Algorithm Overview
 *
 * The HEALPix projection creates a pattern where each base pixel appears
 * as a 45°-rotated square (diamond shape) in the (t, u) plane.
 *
 * 1. Normalize t, u to units of π/4 for easier calculation
 * 2. Transform to a coordinate system (pp, qq) aligned with base pixel axes
 * 3. Determine which base pixel (V, H indices) from integer parts
 * 4. Extract fractional position (p, q) within that pixel
 *
 * ## Base Pixel Layout
 *
 * The 12 base pixels are arranged in a specific pattern:
 * - V (vertical index): 0=north cap, 1=equatorial, 2=south cap
 * - H (horizontal index): 0-7 around the sphere
 * - f = 4*V + (H >> 1) % 4
 */
export function tu2fpq(
  t: number,
  u: number
): { f: number; p: number; q: number } {
  // Normalize to units of π/4 (the fundamental HEALPix angular unit)
  t /= PI_4;
  u /= PI_4;

  // Wrap t to [0, 8) and shift to center around 0
  t = wrap(t, 8);
  t += -4; // Now t ∈ [-4, 4)
  u += 5; // Shift u so equator is at u=5

  // Transform to base pixel axis coordinates (pp, qq)
  // This is a 45° rotation: pp = (u+t)/2, qq = (u-t)/2
  // pp increases to the north-east, qq increases to the north-west
  const pp = clip((u + t) / 2, 0, 5);
  const PP = Math.floor(pp); // Integer part: which diagonal band

  const qq = clip((u - t) / 2, 3 - PP, 6 - PP);
  const QQ = Math.floor(qq); // Integer part: which anti-diagonal band

  // Determine base pixel from V (row) and H (column) indices
  const V = 5 - (PP + QQ); // Vertical index: 0=north, 1=equator, 2=south

  if (V < 0) {
    // Clipping case: return a valid pixel at the boundary
    return { f: 0, p: 1, q: 1 };
  }

  const H = PP - QQ + 4; // Horizontal index: 0-7 around sphere

  // Convert (V, H) to base pixel index f
  // f = 4*V + (H/2) mod 4
  const f = 4 * V + ((H >> 1) % 4);

  // Extract fractional position within base pixel
  const p = pp % 1; // NE fractional coordinate [0, 1)
  const q = qq % 1; // NW fractional coordinate [0, 1)

  return { f, p, q };
}

/**
 * Converts projection coordinates to base pixel and integer pixel indices.
 *
 * @param nside - Grid resolution
 * @param t - Projection x-coordinate
 * @param u - Projection y-coordinate
 * @returns { f, x, y } base pixel and local coordinates
 *
 * This builds on tu2fpq by discretizing the fractional position (p, q)
 * to integer pixel indices (x, y) based on the resolution nside.
 *
 * x = floor(nside * p), clamped to [0, nside-1]
 * y = floor(nside * q), clamped to [0, nside-1]
 *
 * The clamping handles edge cases where numerical precision might
 * give p or q slightly outside [0, 1).
 */
export function tu2fxy(nside: number, t: number, u: number): FXY {
  const { f, p, q } = tu2fpq(t, u);

  // Discretize fractional position to integer indices
  // clip() handles floating-point edge cases
  const x = clip(Math.floor(nside * p), 0, nside - 1);
  const y = clip(Math.floor(nside * q), 0, nside - 1);
  return { f, x, y };
}

/**
 * Converts pixel coordinates back to projection coordinates (pixel center).
 *
 * @param nside - Grid resolution
 * @param f - Base pixel index
 * @param x - NE pixel index within base pixel
 * @param y - NW pixel index within base pixel
 * @returns { t, u } projection coordinates of pixel CENTER
 *
 * This is conceptually the inverse of tu2fxy, but returns the CENTER
 * of the pixel rather than the corner.
 *
 * ## Algorithm
 *
 * 1. Compute the ring index i and horizontal index k from (f, x, y)
 * 2. Convert (i, k) to (t, u) projection coordinates
 *
 * ## Variables
 * - f_row: Which row of base pixels (0=north, 1=equator, 2=south)
 * - f1: Adjusted row index (2, 3, or 4)
 * - f2: Horizontal offset for this base pixel
 * - v = x + y: Diagonal coordinate (increases toward south)
 * - h = x - y: Anti-diagonal coordinate (increases toward east)
 * - i: Ring index (1 = northernmost)
 * - k: Pixel position within ring (before normalization)
 */
export function fxy2tu(nside: number, f: number, x: number, y: number): TU {
  const f_row = Math.floor(f / 4); // 0=north cap, 1=equator, 2=south cap
  const f1 = f_row + 2; // Maps to 2, 3, or 4
  const f2 = 2 * (f % 4) - (f_row % 2) + 1; // Horizontal offset [0..7]

  // Diagonal coordinates within base pixel
  const v = x + y; // South-pointing diagonal
  const h = x - y; // East-pointing diagonal

  // Ring index (1 = northernmost ring at this resolution)
  const i = f1 * nside - v - 1;

  // Horizontal position (needs normalization for ring wrapping)
  const k = f2 * nside + h + 8 * nside;

  // Convert to projection coordinates
  // t increases eastward, u increases northward
  const t = (k / nside) * PI_4;
  const u = PI_2 - (i / nside) * PI_4;

  return { t, u };
}

/**
 * Compares two FXY pixel coordinates for equality.
 */
export function fxyEqual(a: FXY, b: FXY): boolean {
  return a.x === b.x && a.y === b.y && a.f === b.f;
}

/**
 * Returns the next pixel to the right (east) along a ring.
 *
 * @param nside - Grid resolution
 * @param fxy - Current pixel coordinates
 * @returns Next pixel coordinates
 *
 * This handles the complex boundary conditions when crossing between
 * base pixels, which depends on whether we're in the north cap,
 * equatorial belt, or south cap.
 */
export function rightNextPixel(nside: number, { f, x, y }: FXY): FXY {
  // Move one step in the x (NE) direction
  ++x;

  if (x === nside) {
    // Crossed east boundary of base pixel
    switch (Math.floor(f / 4)) {
      case 0: // North polar cap
        f = (f + 1) % 4;
        x = y;
        y = nside;
        break;
      case 1: // Equatorial belt
        f = f - 4;
        x = 0;
        break;
      case 2: // South polar cap
        f = 4 + ((f + 1) % 4);
        x = 0;
        break;
    }
  }

  // Move one step in the -y (SE) direction to stay on same ring
  --y;

  if (y === -1) {
    // Crossed south boundary of base pixel
    switch (Math.floor(f / 4)) {
      case 0: // North polar cap
        f = 4 + ((f + 1) % 4);
        y = nside - 1;
        break;
      case 1: // Equatorial belt
        f = f + 4;
        y = nside - 1;
        break;
      case 2: // South polar cap
        f = 8 + ((f + 1) % 4);
        y = x - 1;
        x = 0;
        break;
    }
  }

  return { f, x, y };
}
