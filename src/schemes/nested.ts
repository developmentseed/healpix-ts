/**
 * @module schemes/nested
 * NESTED numbering scheme implementation
 *
 * The NESTED scheme preserves spatial locality and enables efficient
 * hierarchical operations. A pixel's 4 children are at indices
 * [4*ipix, 4*ipix+3].
 */

import { FXY } from '../types';
import { assert } from '../utils';

/**
 * Converts pixel coordinates to NESTED pixel index.
 *
 * @param nside - Grid resolution
 * @param f - Base pixel index {0..11}
 * @param x - NE index within base pixel [0, nside)
 * @param y - NW index within base pixel [0, nside)
 * @returns Nested pixel index
 *
 * The nested index is computed as:
 *   ipix = f * nside² + bitCombine(x, y)
 *
 * This formula has a beautiful property: each pixel's 4 children are
 * numbered consecutively as [4*ipix, 4*ipix+1, 4*ipix+2, 4*ipix+3].
 *
 * Why bitCombine? The hierarchical property requires that when we
 * double the resolution, each pixel splits into 4 children in a
 * consistent pattern. Bit interleaving achieves this:
 *
 *   Parent (x, y) → Children: (2x, 2y), (2x+1, 2y), (2x, 2y+1), (2x+1, 2y+1)
 *   bitCombine(2x, 2y) = 4 * bitCombine(x, y)
 *
 * This is the Z-order curve (Morton code), which maps 2D coordinates
 * to 1D while preserving spatial locality.
 */
export function fxy2nest(
  nside: number,
  f: number,
  x: number,
  y: number
): number {
  return f * nside * nside + bitCombine(x, y);
}

/**
 * Extracts pixel coordinates from NESTED pixel index.
 *
 * @param nside - Grid resolution
 * @param ipix - Nested pixel index
 * @returns { f, x, y } base pixel and local coordinates
 *
 * Inverse of fxy2nest:
 *   f = floor(ipix / nside²)
 *   k = ipix mod nside²
 *   (x, y) = bitDecombine(k)
 */
export function nest2fxy(nside: number, ipix: number): FXY {
  const nside2 = nside * nside;
  const f = Math.floor(ipix / nside2); // Base pixel index
  const k = ipix % nside2; // Index within base pixel
  const { x, y } = bitDecombine(k); // Deinterleave bits
  return { f, x, y };
}

/**
 * Interleaves bits of x and y coordinates (Morton code / Z-order curve).
 *
 * @param x - NE coordinate [0, 2^16)
 * @param y - NW coordinate [0, 2^15)
 * @returns Interleaved bits: ...y₂x₂y₁x₁y₀x₀
 *
 * ## How it works
 *
 * Given x and y in binary:
 *   x = ...x₂ x₁ x₀
 *   y = ...y₂ y₁ y₀
 *
 * The result interleaves these bits:
 *   result = ...y₂ x₂ y₁ x₁ y₀ x₀
 *
 * ## Why this is important
 *
 * Bit interleaving creates a "Z-order curve" or "Morton code" that:
 * 1. Maps 2D coordinates to 1D while preserving locality
 * 2. Makes the hierarchical property work: children of pixel p are at 4p + {0,1,2,3}
 *
 * When resolution doubles (nside → 2*nside):
 *   (x, y) → (2x + dx, 2y + dy) where dx, dy ∈ {0, 1}
 *   bitCombine(2x+dx, 2y+dy) = 4*bitCombine(x,y) + 2*dy + dx
 *
 * ## Implementation
 *
 * Uses bitwise operations to efficiently interleave up to 16 bits of x
 * with 15 bits of y (covering nside up to 65536).
 */
export function bitCombine(x: number, y: number): number {
  assert(x < 1 << 16, 'x must fit in 16 bits');
  assert(y < 1 << 15, 'y must fit in 15 bits');

  return (
    (x & 1) |
    (((x & 0x2) | (y & 0x1)) << 1) |
    (((x & 0x4) | (y & 0x2)) << 2) |
    (((x & 0x8) | (y & 0x4)) << 3) |
    (((x & 0x10) | (y & 0x8)) << 4) |
    (((x & 0x20) | (y & 0x10)) << 5) |
    (((x & 0x40) | (y & 0x20)) << 6) |
    (((x & 0x80) | (y & 0x40)) << 7) |
    (((x & 0x100) | (y & 0x80)) << 8) |
    (((x & 0x200) | (y & 0x100)) << 9) |
    (((x & 0x400) | (y & 0x200)) << 10) |
    (((x & 0x800) | (y & 0x400)) << 11) |
    (((x & 0x1000) | (y & 0x800)) << 12) |
    (((x & 0x2000) | (y & 0x1000)) << 13) |
    (((x & 0x4000) | (y & 0x2000)) << 14) |
    (((x & 0x8000) | (y & 0x4000)) << 15) |
    (y & (0x8000 << 16))
  );
}

/**
 * De-interleaves bits to recover x and y coordinates (inverse Morton code).
 *
 * @param p - Interleaved value: ...y₂x₂y₁x₁y₀x₀
 * @returns { x, y } original coordinates
 *
 * Inverse of bitCombine. Extracts the even-positioned bits into x
 * and odd-positioned bits into y.
 *
 * ## Implementation
 *
 * For x: extract bits at positions 0, 2, 4, 6, ... and pack into consecutive bits
 * For y: extract bits at positions 1, 3, 5, 7, ... and pack into consecutive bits
 *
 * Uses masks to isolate specific bits:
 * - 0x1, 0x4, 0x10, 0x40, ... (powers of 4) for x bits
 * - 0x2, 0x8, 0x20, 0x80, ... (2 × powers of 4) for y bits
 */
export function bitDecombine(p: number): { x: number; y: number } {
  assert(p <= 0x7fffffff, 'p must fit in 31 bits');

  const x =
    ((p & 0x1) >> 0) |
    ((p & 0x4) >> 1) |
    ((p & 0x10) >> 2) |
    ((p & 0x40) >> 3) |
    ((p & 0x100) >> 4) |
    ((p & 0x400) >> 5) |
    ((p & 0x1000) >> 6) |
    ((p & 0x4000) >> 7) |
    ((p & 0x10000) >> 8) |
    ((p & 0x40000) >> 9) |
    ((p & 0x100000) >> 10) |
    ((p & 0x400000) >> 11) |
    ((p & 0x1000000) >> 12) |
    ((p & 0x4000000) >> 13) |
    ((p & 0x10000000) >> 14) |
    ((p & 0x40000000) >> 15);

  const y =
    ((p & 0x2) >> 1) |
    ((p & 0x8) >> 2) |
    ((p & 0x20) >> 3) |
    ((p & 0x80) >> 4) |
    ((p & 0x200) >> 5) |
    ((p & 0x800) >> 6) |
    ((p & 0x2000) >> 7) |
    ((p & 0x8000) >> 8) |
    ((p & 0x20000) >> 9) |
    ((p & 0x80000) >> 10) |
    ((p & 0x200000) >> 11) |
    ((p & 0x800000) >> 12) |
    ((p & 0x2000000) >> 13) |
    ((p & 0x8000000) >> 14) |
    ((p & 0x20000000) >> 15);

  return { x, y };
}
