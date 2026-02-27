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

/** Max coordinate bits (supports nside up to 2^BITS) */
const BITS = 26;
const MAX_COORD = (1 << BITS) - 1;

/** Spreads 32-bit value: inserts 0 between each bit. */
function spread1By1(n: bigint): bigint {
  n = n & 0xffffffffn;
  n = (n | (n << 16n)) & 0x0000ffff0000ffffn;
  n = (n | (n << 8n)) & 0x00ff00ff00ff00ffn;
  n = (n | (n << 4n)) & 0x0f0f0f0f0f0f0f0fn;
  n = (n | (n << 2n)) & 0x3333333333333333n;
  n = (n | (n << 1n)) & 0x5555555555555555n;
  return n;
}

/** Compacts 64-bit value: extracts even bits. */
function compact1By1(n: bigint): bigint {
  n = n & 0x5555555555555555n;
  n = (n | (n >> 1n)) & 0x3333333333333333n;
  n = (n | (n >> 2n)) & 0x0f0f0f0f0f0f0f0fn;
  n = (n | (n >> 4n)) & 0x00ff00ff00ff00ffn;
  n = (n | (n >> 8n)) & 0x0000ffff0000ffffn;
  n = (n | (n >> 16n)) & 0x00000000ffffffffn;
  return n;
}

/**
 * Interleaves bits of x and y coordinates (Morton code / Z-order curve).
 *
 * @param x - NE coordinate [0, 2^26)
 * @param y - NW coordinate [0, 2^26)
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
 * Uses parallel bit spread. Supports up to 26 bits per coordinate (nside up to
 * 2^26).
 */
export function bitCombine(x: number, y: number): number {
  assert(x <= MAX_COORD && x >= 0, 'x must fit in 26 bits');
  assert(y <= MAX_COORD && y >= 0, 'y must fit in 26 bits');
  return Number(spread1By1(BigInt(x)) | (spread1By1(BigInt(y)) << 1n));
}

/**
 * De-interleaves bits to recover x and y coordinates (inverse Morton code).
 *
 * @param p - Interleaved value: ...y₂x₂y₁x₁y₀x₀ [0, 4^26)
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
 * Uses parallel bit compact (no loops, no division).
 */
export function bitDecombine(p: number): { x: number; y: number } {
  const pn = BigInt(p);
  return {
    x: Number(compact1By1(pn)),
    y: Number(compact1By1(pn >> 1n))
  };
}
