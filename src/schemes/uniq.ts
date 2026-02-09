/**
 * @module schemes/uniq
 * UNIQ (Unique Identifier) scheme implementation
 *
 * The UNIQ scheme packs (order, ipix_nested) into a single integer,
 * useful for multi-resolution applications like MOC (Multi-Order Coverage).
 *
 * References:
 * - HEALPix documentation Section 3.2: http://healpix.sourceforge.net/pdf/intro.pdf
 * - IVOA MOC standard Section 2.3.1: http://ivoa.net/documents/MOC/
 */

import { OrderPix } from '../types';
import { assert } from '../utils';

/**
 * Packs (order, ipix_nested) into a single unique integer.
 *
 * @param order - Resolution level
 * @param ipix - Nested pixel index at that order
 * @returns Unique identifier integer
 *
 * The UNIQ scheme encodes both resolution and pixel index in one number,
 * useful for multi-resolution applications (like MOC - Multi-Order Coverage maps).
 *
 * ## Formula
 *
 *   uniq = 4 * (4^order - 1) + ipix
 *        = 4 * (nside² - 1) + ipix
 *
 * This formula ensures:
 * 1. All pixels at each order have consecutive uniq values
 * 2. Higher orders have higher uniq values
 * 3. The order can be recovered by finding how many complete 4^k fit
 *
 * ## Bit structure
 *
 * The formula can also be written as:
 *   uniq = (1 << (2*order + 2)) + ipix - 4
 *
 * Which shows that the order is encoded in the position of the highest set bit.
 */
export function orderpix2uniq(order: number, ipix: number): number {
  return 4 * ((1 << (2 * order)) - 1) + ipix;
}

/**
 * Unpacks a unique identifier into (order, ipix_nested).
 *
 * @param uniq - Unique identifier
 * @returns { order, ipix } resolution level and nested pixel index
 *
 * Inverse of orderpix2uniq.
 *
 * ## Algorithm
 *
 * 1. Find order by counting how many times we can divide (uniq/4 + 1) by 4
 * 2. Subtract the offset to get ipix
 *
 * The loop essentially finds log₄((uniq >> 2) + 1), which gives the order.
 */
export function uniq2orderpix(uniq: number): OrderPix {
  assert(uniq <= 0x7fffffff, 'uniq must fit in 31 bits');

  // Find order by iteratively dividing by 4
  let order = 0;
  let l = (uniq >> 2) + 1;
  while (l >= 4) {
    l >>= 2;
    ++order;
  }

  // Recover ipix by subtracting the offset for this order
  const ipix = uniq - (((1 << (2 * order)) - 1) << 2);

  return { order, ipix };
}

/**
 * Gets the parent uniq value (coarser resolution).
 *
 * @param uniq - Unique identifier
 * @returns Parent's unique identifier
 */
export function uniqParent(uniq: number): number {
  const { order, ipix } = uniq2orderpix(uniq);
  if (order === 0) {
    throw new Error('Base pixels (order 0) have no parent');
  }
  return orderpix2uniq(order - 1, ipix >> 2);
}

/**
 * Gets the 4 child uniq values (finer resolution).
 *
 * @param uniq - Unique identifier
 * @returns Array of 4 children's unique identifiers
 */
export function uniqChildren(uniq: number): [number, number, number, number] {
  const { order, ipix } = uniq2orderpix(uniq);
  const childOrder = order + 1;
  const base = ipix << 2;
  return [
    orderpix2uniq(childOrder, base),
    orderpix2uniq(childOrder, base + 1),
    orderpix2uniq(childOrder, base + 2),
    orderpix2uniq(childOrder, base + 3)
  ];
}
