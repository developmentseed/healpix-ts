/**
 * @module pixel/hierarchy
 * Hierarchical pixel operations: parent/child relationships
 */

import { nest2ring, ring2nest } from '../schemes/conversion';

/**
 * Gets the parent pixel index in the NESTED scheme.
 *
 * @param ipix - Nested pixel index
 * @returns Parent pixel index at coarser resolution (nside/2)
 *
 * The parent of a nested pixel is simply ipix >> 2 (divide by 4).
 * This works because of the bit-interleaving in the nested scheme.
 */
export function nestParent(ipix: number): number {
  return ipix >> 2;
}

/**
 * Gets the 4 child pixel indices in the NESTED scheme.
 *
 * @param ipix - Nested pixel index
 * @returns Array of 4 child indices at finer resolution (nside*2)
 *
 * Children of pixel p are: [4p, 4p+1, 4p+2, 4p+3]
 */
export function nestChildren(ipix: number): [number, number, number, number] {
  const base = ipix << 2;
  return [base, base + 1, base + 2, base + 3];
}

/**
 * Gets the parent pixel at a specific ancestor level.
 *
 * @param ipix - Nested pixel index
 * @param levels - Number of levels up (1 = parent, 2 = grandparent, etc.)
 * @returns Ancestor pixel index
 */
export function nestAncestor(ipix: number, levels: number): number {
  return ipix >> (2 * levels);
}

/**
 * Gets all descendants at a specific depth.
 *
 * @param ipix - Nested pixel index
 * @param levels - Number of levels down
 * @returns Array of all descendant pixel indices
 *
 * At each level, pixels multiply by 4:
 * - levels=1: 4 children
 * - levels=2: 16 grandchildren
 * - levels=n: 4^n descendants
 */
export function nestDescendants(ipix: number, levels: number): number[] {
  if (levels <= 0) return [ipix];

  const count = 1 << (2 * levels); // 4^levels
  const base = ipix << (2 * levels);

  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(base + i);
  }
  return result;
}

/**
 * Checks if one pixel is an ancestor of another.
 *
 * @param ancestor - Potential ancestor pixel index
 * @param ancestorNside - Nside of ancestor pixel
 * @param descendant - Potential descendant pixel index
 * @param descendantNside - Nside of descendant pixel
 * @returns True if ancestor contains descendant
 */
export function isNestAncestor(
  ancestor: number,
  ancestorNside: number,
  descendant: number,
  descendantNside: number
): boolean {
  if (ancestorNside >= descendantNside) return false;

  const ratio = descendantNside / ancestorNside;
  const levels = Math.log2(ratio);

  if (!Number.isInteger(levels)) return false;

  return descendant >> (2 * levels) === ancestor;
}

/**
 * Gets the parent pixel index in the RING scheme.
 *
 * @param nside - Grid resolution (must be > 1)
 * @param ipix - Ring pixel index at the given nside
 * @returns Parent ring pixel index at nside/2
 *
 * Converts to nested scheme, shifts bits, then converts back.
 */
export function ringParent(nside: number, ipix: number): number {
  const parentNside = nside >> 1;
  const nestIdx = ring2nest(nside, ipix);
  return nest2ring(parentNside, nestParent(nestIdx));
}

/**
 * Gets the 4 child pixel indices in the RING scheme.
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index at the given nside
 * @returns Array of 4 child ring pixel indices at nside*2
 */
export function ringChildren(
  nside: number,
  ipix: number
): [number, number, number, number] {
  const childNside = nside << 1;
  const nestIdx = ring2nest(nside, ipix);
  const nestKids = nestChildren(nestIdx);
  return nestKids.map((k) => nest2ring(childNside, k)) as [
    number,
    number,
    number,
    number
  ];
}

/**
 * Gets the ancestor pixel at a specific level in the RING scheme.
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @param levels - Number of levels up (1 = parent, 2 = grandparent, etc.)
 * @returns Ancestor ring pixel index at nside / 2^levels
 */
export function ringAncestor(
  nside: number,
  ipix: number,
  levels: number
): number {
  const ancestorNside = nside >> levels;
  const nestIdx = ring2nest(nside, ipix);
  return nest2ring(ancestorNside, nestAncestor(nestIdx, levels));
}

/**
 * Gets all descendants at a specific depth in the RING scheme.
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @param levels - Number of levels down
 * @returns Array of descendant ring pixel indices at nside * 2^levels
 */
export function ringDescendants(
  nside: number,
  ipix: number,
  levels: number
): number[] {
  if (levels <= 0) return [ipix];

  const descNside = nside << levels;
  const nestIdx = ring2nest(nside, ipix);
  return nestDescendants(nestIdx, levels).map((d) => nest2ring(descNside, d));
}

/**
 * Checks if one ring pixel is an ancestor of another.
 *
 * @param ancestor - Potential ancestor ring pixel index
 * @param ancestorNside - Nside of ancestor pixel
 * @param descendant - Potential descendant ring pixel index
 * @param descendantNside - Nside of descendant pixel
 * @returns True if ancestor contains descendant
 */
export function isRingAncestor(
  ancestor: number,
  ancestorNside: number,
  descendant: number,
  descendantNside: number
): boolean {
  if (ancestorNside >= descendantNside) return false;

  const ratio = descendantNside / ancestorNside;
  const levels = Math.log2(ratio);
  if (!Number.isInteger(levels)) return false;

  const nestAnc = ring2nest(ancestorNside, ancestor);
  const nestDesc = ring2nest(descendantNside, descendant);
  return isNestAncestor(nestAnc, ancestorNside, nestDesc, descendantNside);
}
