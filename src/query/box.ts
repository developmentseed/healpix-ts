/**
 * @module query/box
 * Bounding box query functions for finding pixels within a rectangular region
 */

import { PI, PI_4 } from '../constants';
import { deg2Rad } from '../utils';
import { tu2fxy, fxyEqual, rightNextPixel } from '../pixel/fxy';
import { fxy2nest } from '../schemes/nested';
import { nest2ring } from '../schemes/conversion';
import { maxPixelRadius } from '../pixel/geometry';
import { pix2LonLatNest } from '../geo/latlon';
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
 * Note: Handles longitude wrapping (e.g., bbox[0]=170, bbox[2]=-170 crosses antimeridian)
 *
 * @example
 * ```ts
 * // Query pixels in a box around New York City
 * const pixels = queryBoxInclusiveNest(512, [-74.3, 40.5, -73.7, 40.9]);
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
 * Internal implementation for both NESTED and RING box queries.
 */
function queryBoxInclusiveImpl(
  nside: number,
  bbox: BBox,
  asRing: boolean
): number[] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const results: number[] = [];

  // Expand bounds by pixel radius for inclusive query
  const pixRadDeg = maxPixelRadius(nside) * (180 / PI);
  const expandedMinLat = Math.max(-90, minLat - pixRadDeg);
  const expandedMaxLat = Math.min(90, maxLat + pixRadDeg);

  // Convert latitude bounds to colatitude (theta)
  // theta = 0 at north pole, theta = PI at south pole
  const thetaMin = deg2Rad(90 - expandedMaxLat); // maxLat -> smaller theta (more north)
  const thetaMax = deg2Rad(90 - expandedMinLat); // minLat -> larger theta (more south)

  // Calculate ring range from theta bounds
  const d = PI_4 / nside; // Angular size per ring step

  // Convert theta to ring index
  // Ring 1 is at theta ≈ 0 (north pole), ring 4*nside-1 is at theta ≈ PI (south pole)
  const ringMin = Math.max(1, Math.floor(thetaMin / d));
  const ringMax = Math.min(4 * nside - 1, Math.ceil(thetaMax / d) + 1);

  // Handle longitude wrapping
  const crossesAntimeridian = minLon > maxLon;
  const expandedMinLon = minLon - pixRadDeg;
  const expandedMaxLon = maxLon + pixRadDeg;

  // Iterate through rings
  for (let ring = ringMin; ring <= ringMax; ring++) {
    walkRingFiltered(
      nside,
      ring,
      expandedMinLon,
      expandedMaxLon,
      crossesAntimeridian,
      (ipixNest) => {
        // Final check: verify pixel actually intersects the original (unexpanded) box
        if (
          pixelIntersectsBox(nside, ipixNest, minLon, maxLon, minLat, maxLat)
        ) {
          results.push(asRing ? nest2ring(nside, ipixNest) : ipixNest);
        }
      }
    );
  }

  return results;
}

/**
 * Walks pixels in a ring, filtering by longitude range.
 */
function walkRingFiltered(
  nside: number,
  ring: number,
  minLon: number,
  maxLon: number,
  crossesAntimeridian: boolean,
  cb: (ipixNest: number) => void
): void {
  const u = PI_4 * (2 - ring / nside);
  const t = PI_4 * (1 + (1 - (ring % 2)) / nside);

  const begin = tu2fxy(nside, t, u);
  let s = begin;

  do {
    const ipix = fxy2nest(nside, s.f, s.x, s.y);
    const [lon] = pix2LonLatNest(nside, ipix);

    // Check if pixel longitude is within range
    const inRange = crossesAntimeridian
      ? lon >= minLon || lon <= maxLon // Wraps around antimeridian
      : lon >= minLon && lon <= maxLon;

    if (inRange) {
      cb(ipix);
    }

    s = rightNextPixel(nside, s);
  } while (!fxyEqual(s, begin));
}

/**
 * Checks if a pixel intersects a bounding box.
 * Uses pixel center and a buffer based on pixel radius.
 */
function pixelIntersectsBox(
  nside: number,
  ipix: number,
  minLon: number,
  maxLon: number,
  minLat: number,
  maxLat: number
): boolean {
  const [centerLon, centerLat] = pix2LonLatNest(nside, ipix);
  const crossesAntimeridian = minLon > maxLon;

  // Check if center is in box
  const lonInRange = crossesAntimeridian
    ? centerLon >= minLon || centerLon <= maxLon
    : centerLon >= minLon && centerLon <= maxLon;

  if (lonInRange && centerLat >= minLat && centerLat <= maxLat) {
    return true;
  }

  // For edge pixels, check if they might still intersect due to their size
  const pixRadDeg = maxPixelRadius(nside) * (180 / PI);

  // Latitude overlap check with buffer
  if (centerLat + pixRadDeg < minLat || centerLat - pixRadDeg > maxLat) {
    return false;
  }

  // Longitude overlap check with buffer
  if (crossesAntimeridian) {
    // Box wraps around antimeridian
    return (
      centerLon + pixRadDeg >= minLon ||
      centerLon - pixRadDeg <= maxLon ||
      centerLon + pixRadDeg >= minLon - 360 ||
      centerLon - pixRadDeg <= maxLon + 360
    );
  } else {
    // Normal box
    return centerLon + pixRadDeg >= minLon && centerLon - pixRadDeg <= maxLon;
  }
}
