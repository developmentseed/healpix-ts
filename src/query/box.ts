/**
 * @module query/box
 * Bounding box query functions for finding pixels within a rectangular region
 */

import { PI, PI_2, PI_4 } from '../constants';
import { deg2Rad } from '../utils';
import { za2tu } from '../coordinates/projection';
import { tu2fxy, fxyEqual, rightNextPixel } from '../pixel/fxy';
import { fxy2nest } from '../schemes/nested';
import { nest2ring } from '../schemes/conversion';
import { maxPixelRadius } from '../pixel/geometry';
import { pix2LonLatNest, cornersNestLonLat } from '../geo/latlon';
import { BBox } from '../types';

/**
 * Finds all NESTED pixels that intersect a lat/lon bounding box.
 *
 * @param nside - Grid resolution
 * @param bbox - Bounding box as [minLon, minLat, maxLon, maxLat] in degrees
 * @returns Array of nested pixel indices that intersect the box
 *
 * "Inclusive" means pixels are included if ANY part overlaps the box,
 * not just the center. This is achieved by expanding the search region
 * by the maximum pixel radius.
 *
 * Handles antimeridian crossing in two forms:
 * - minLon > maxLon (e.g., [170, -10, -170, 10])
 * - Longitudes outside [-180, 180] (e.g., [178, -10, 184, 10])
 *
 * @example
 * ```ts
 * // Query pixels in a box around New York City
 * const pixels = queryBoxInclusiveNest(512, [-74.3, 40.5, -73.7, 40.9]);
 *
 * // Antimeridian crossing (both forms equivalent)
 * const pixels1 = queryBoxInclusiveNest(16, [178, -21, 184, -15]);
 * const pixels2 = queryBoxInclusiveNest(16, [178, -21, -176, -15]);
 * ```
 */
export function queryBoxInclusiveNest(nside: number, bbox: BBox): number[] {
  return queryBoxInclusiveImpl(nside, bbox, false);
}

/**
 * Finds all RING pixels that intersect a lat/lon bounding box.
 *
 * @param nside - Grid resolution
 * @param bbox - Bounding box as [minLon, minLat, maxLon, maxLat] in degrees
 * @returns Array of ring pixel indices that intersect the box
 *
 * @example
 * ```ts
 * // Query pixels in a box around London
 * const pixels = queryBoxInclusiveRing(512, [-0.5, 51.3, 0.3, 51.7]);
 * ```
 */
export function queryBoxInclusiveRing(nside: number, bbox: BBox): number[] {
  return queryBoxInclusiveImpl(nside, bbox, true);
}

/**
 * Normalizes a longitude to (-180, 180].
 */
function normalizeLon(lon: number): number {
  while (lon > 180) lon -= 360;
  while (lon <= -180) lon += 360;
  return lon;
}

/**
 * Normalizes a longitude difference to (-180, 180].
 * Used for antimeridian-safe distance comparisons.
 */
function normalizeDelta(d: number): number {
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

/**
 * Internal implementation for both NESTED and RING box queries.
 *
 * Uses a reference-frame approach for longitude comparisons:
 * all longitudes are expressed as deltas from a reference point
 * (the bbox center), which eliminates antimeridian edge cases.
 */
function queryBoxInclusiveImpl(
  nside: number,
  bbox: BBox,
  asRing: boolean
): number[] {
  const [rawMinLon, minLat, rawMaxLon, maxLat] = bbox;
  const results: number[] = [];

  // Normalize longitudes to (-180, 180]
  const minLon = normalizeLon(rawMinLon);
  const maxLon = normalizeLon(rawMaxLon);

  // Compute longitude span and reference point for safe comparisons.
  // After normalization, minLon > maxLon means the box crosses the antimeridian.
  const crossesAntimeridian = minLon > maxLon;
  let lonSpan = crossesAntimeridian ? 360 - minLon + maxLon : maxLon - minLon;

  // If normalization collapsed a wide bbox to zero span (e.g., [-180,180] both
  // normalize to 180), treat it as full longitude coverage.
  if (lonSpan === 0 && rawMinLon !== rawMaxLon) {
    lonSpan = 360;
  }

  const halfLonSpan = lonSpan / 2;
  // Reference longitude at box center (may exceed 180, that's fine for deltas)
  const refLon = minLon + halfLonSpan;

  // Expand bounds by pixel radius for inclusive query
  const pixRadDeg = maxPixelRadius(nside) * (180 / PI);
  const expandedMinLat = Math.max(-90, minLat - pixRadDeg);
  const expandedMaxLat = Math.min(90, maxLat + pixRadDeg);
  const expandedHalfLonSpan = halfLonSpan + pixRadDeg;

  // Compute ring range using exact HEALPix projection (handles polar caps correctly)
  const d = PI_4 / nside;
  const zTop = Math.sin(deg2Rad(expandedMaxLat));
  const zBot = Math.sin(deg2Rad(expandedMinLat));
  const uTop = za2tu(zTop, 0).u;
  const uBot = za2tu(zBot, 0).u;
  const ringMin = Math.max(1, Math.floor((PI_2 - uTop) / d));
  const ringMax = Math.min(4 * nside - 1, Math.floor((PI_2 - uBot) / d + 1));

  // Iterate through rings
  for (let ring = ringMin; ring <= ringMax; ring++) {
    walkRingFiltered(nside, ring, refLon, expandedHalfLonSpan, (ipixNest) => {
      // Final check: verify pixel corners actually intersect the original box
      if (
        pixelIntersectsBox(nside, ipixNest, refLon, halfLonSpan, minLat, maxLat)
      ) {
        results.push(asRing ? nest2ring(nside, ipixNest) : ipixNest);
      }
    });
  }

  return results;
}

/**
 * Walks pixels in a ring, filtering by longitude range.
 *
 * Uses the reference-frame approach: a pixel passes the filter if its
 * center longitude is within `halfLonSpan` of `refLon` (accounting for
 * antimeridian wrapping via normalizeDelta).
 */
function walkRingFiltered(
  nside: number,
  ring: number,
  refLon: number,
  halfLonSpan: number,
  cb: (ipixNest: number) => void
): void {
  const u = PI_4 * (2 - ring / nside);
  const t = PI_4 * (1 + (1 - (ring % 2)) / nside);

  const begin = tu2fxy(nside, t, u);
  let s = begin;

  do {
    const ipix = fxy2nest(nside, s.f, s.x, s.y);
    const [lon] = pix2LonLatNest(nside, ipix);

    // Check if pixel center longitude is within the expanded range
    const delta = normalizeDelta(lon - refLon);
    if (Math.abs(delta) <= halfLonSpan) {
      cb(ipix);
    }

    s = rightNextPixel(nside, s);
  } while (!fxyEqual(s, begin));
}

/**
 * Checks if a pixel intersects a bounding box.
 *
 * Uses actual pixel corners for precise intersection testing.
 * Longitude overlap is tested in a reference frame centered on the
 * bbox, making all comparisons antimeridian-safe.
 */
function pixelIntersectsBox(
  nside: number,
  ipix: number,
  refLon: number,
  halfLonSpan: number,
  minLat: number,
  maxLat: number
): boolean {
  const corners = cornersNestLonLat(nside, ipix);

  // Check latitude overlap using pixel corner extents
  let pixMinLat = Infinity;
  let pixMaxLat = -Infinity;
  let pixMinDelta = Infinity;
  let pixMaxDelta = -Infinity;

  for (const [lon, lat] of corners) {
    if (lat < pixMinLat) pixMinLat = lat;
    if (lat > pixMaxLat) pixMaxLat = lat;
    const delta = normalizeDelta(lon - refLon);
    if (delta < pixMinDelta) pixMinDelta = delta;
    if (delta > pixMaxDelta) pixMaxDelta = delta;
  }

  if (pixMaxLat < minLat || pixMinLat > maxLat) return false;

  // Check longitude overlap: pixel delta range vs bbox delta range [-halfLonSpan, halfLonSpan]
  return pixMaxDelta >= -halfLonSpan && pixMinDelta <= halfLonSpan;
}
