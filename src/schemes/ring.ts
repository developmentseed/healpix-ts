/**
 * @module schemes/ring
 * RING numbering scheme implementation
 *
 * In the RING scheme, pixels are numbered sequentially along iso-latitude
 * rings, starting from the north pole. This is optimal for spherical
 * harmonic transforms.
 */

import { FXY } from '../types';

/**
 * Converts pixel coordinates to RING pixel index.
 *
 * @param nside - Grid resolution
 * @param f - Base pixel index
 * @param x - NE index within base pixel
 * @param y - NW index within base pixel
 * @returns Ring pixel index
 *
 * In the RING scheme, pixels are numbered sequentially along iso-latitude
 * rings, starting from the north pole and moving south.
 *
 * The sphere is divided into three regions:
 * 1. NORTH POLAR CAP: rings 1 to nside-1 (triangular pixels)
 * 2. EQUATORIAL BELT: rings nside to 3*nside (rectangular region)
 * 3. SOUTH POLAR CAP: rings 3*nside+1 to 4*nside-1 (triangular pixels)
 *
 * ## Variables
 * - i: Ring index (1 = northernmost)
 * - v = x + y: Diagonal index (position along constant-i lines)
 * - h = x - y: Horizontal offset within ring
 * - f_row: Base pixel row (0, 1, or 2)
 * - f_col: Base pixel column within row (0, 1, 2, or 3)
 *
 * ## Ring pixel counts
 * - North polar cap: ring i has 4i pixels (total: 2n(n-1) pixels)
 * - Equatorial belt: each ring has 4*nside pixels (total: 8n² pixels)
 * - South polar cap: mirrors north (total: 2n(n-1) pixels)
 */
export function fxy2ring(
  nside: number,
  f: number,
  x: number,
  y: number
): number {
  const f_row = Math.floor(f / 4);
  const f1 = f_row + 2;
  const v = x + y;
  const i = f1 * nside - v - 1;

  if (i < nside) {
    // NORTH POLAR CAP
    const f_col = f % 4;
    const ipix = 2 * i * (i - 1) + i * f_col + nside - y - 1;
    return ipix;
  }

  if (i < 3 * nside) {
    // EQUATORIAL BELT
    const h = x - y;
    const f2 = 2 * (f % 4) - (f_row % 2) + 1;
    const k = (f2 * nside + h + 8 * nside) % (8 * nside);
    const offset = 2 * nside * (nside - 1);
    const ipix = offset + (i - nside) * 4 * nside + (k >> 1);
    return ipix;
  } else {
    // SOUTH POLAR CAP
    const i_i = 4 * nside - i;
    const i_f_col = 3 - (f % 4);
    const j = 4 * i_i - i_i * i_f_col - y;
    const i_j = 4 * i_i - j + 1;
    const ipix = 12 * nside * nside - 2 * i_i * (i_i - 1) - i_j;
    return ipix;
  }
}

/**
 * Extracts pixel coordinates from RING pixel index.
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @returns { f, x, y } base pixel and local coordinates
 *
 * Inverse of fxy2ring. Determines which region the pixel is in,
 * then computes (f, x, y) using region-specific formulas.
 *
 * The polar_lim variable marks the boundary between north polar cap
 * and equatorial belt: 2*nside*(nside-1) pixels in the north cap.
 */
export function ring2fxy(nside: number, ipix: number): FXY {
  // Boundary: number of pixels in north polar cap
  const polar_lim = 2 * nside * (nside - 1);

  if (ipix < polar_lim) {
    // NORTH POLAR CAP
    const i = Math.floor((Math.sqrt(1 + 2 * ipix) + 1) / 2);
    const j = ipix - 2 * i * (i - 1);
    const f = Math.floor(j / i);
    const k = j % i;
    const x = nside - i + k;
    const y = nside - 1 - k;
    return { f, x, y };
  }

  if (ipix < polar_lim + 8 * nside * nside) {
    // EQUATORIAL BELT
    const k = ipix - polar_lim;
    const ring = 4 * nside;
    const i = nside - Math.floor(k / ring);
    const s = i % 2 === 0 ? 1 : 0;
    const j = 2 * (k % ring) + s;

    const jj = j - 4 * nside;
    const ii = i + 5 * nside - 1;
    const pp = (ii + jj) / 2;
    const qq = (ii - jj) / 2;

    const PP = Math.floor(pp / nside);
    const QQ = Math.floor(qq / nside);
    const V = 5 - (PP + QQ);
    const H = PP - QQ + 4;
    const f = 4 * V + ((H >> 1) % 4);

    const x = pp % nside;
    const y = qq % nside;
    return { f, x, y };
  } else {
    // SOUTH POLAR CAP
    const p = 12 * nside * nside - ipix - 1;
    const i = Math.floor((Math.sqrt(1 + 2 * p) + 1) / 2);
    const j = p - 2 * i * (i - 1);
    const f = 11 - Math.floor(j / i);
    const k = j % i;
    const x = i - k - 1;
    const y = k;
    return { f, x, y };
  }
}
