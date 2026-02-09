/**
 * @module query/disc
 * Disc query functions for finding pixels within a circular region
 */

import { V3 } from '../types';
import { PI, PI2, PI_2, PI_4 } from '../constants';
import { square, wrap } from '../utils';
import { vec2za, angularDistance } from '../coordinates/spherical';
import { za2tu, tu2za } from '../coordinates/projection';
import { tu2fxy, fxyEqual, rightNextPixel } from '../pixel/fxy';
import { fxy2nest } from '../schemes/nested';
import { nest2ring } from '../schemes/conversion';
import { maxPixelRadius } from '../pixel/geometry';
import { pix2VecNest } from '../lookup/lookup';

/**
 * Finds all NESTED pixels that overlap with a disc on the sphere.
 *
 * @param nside - Grid resolution
 * @param v - Center of disc (unit vector)
 * @param radius - Disc radius in radians (must be < π/2)
 * @param cb - Callback function called with each pixel index
 *
 * "Inclusive" means pixels are included if ANY part overlaps the disc,
 * not just the center. This is achieved by expanding the search radius
 * by maxPixelRadius (the pixel's circumradius).
 *
 * ## Algorithm Overview
 *
 * 1. Compute the range of rings (i1 to i2) that the disc might touch
 * 2. Handle special cases where disc covers poles
 * 3. For each ring, either:
 *    - Walk the entire ring (if disc is very wide)
 *    - Walk only the pixels near the disc center azimuth
 * 4. Final filtering checks actual angular distance
 *
 * ## Why radius < π/2?
 *
 * For larger discs, the algorithm would need significant modifications
 * to handle wrapping around the sphere correctly.
 */
export function queryDiscInclusiveNest(
  nside: number,
  v: V3,
  radius: number,
  cb: (ipix: number) => void
): void {
  if (radius > PI_2) {
    throw new Error('query_disc: radius must be < PI/2');
  }

  const pixrad = maxPixelRadius(nside); // Maximum pixel radius for "inclusive" query
  const d = PI_4 / nside; // Angular size per ring step

  // Convert disc center to spherical coordinates
  const { z: z0, a: a0 } = vec2za(v[0], v[1], v[2]); // z0 = cos(theta)
  const sin_t = Math.sqrt(1 - z0 * z0); // sin(theta) of disc center

  const cos_r = Math.cos(radius);
  const sin_r = Math.sin(radius);

  const z1 = z0 * cos_r + sin_t * sin_r;
  const z2 = z0 * cos_r - sin_t * sin_r;

  const u1 = za2tu(z1, 0).u;
  const u2 = za2tu(z2, 0).u;

  const cover_north_pole = sin_t * cos_r - z0 * sin_r < 0;
  const cover_south_pole = sin_t * cos_r + z0 * sin_r < 0;

  let i1 = Math.floor((PI_2 - u1) / d);
  let i2 = Math.floor((PI_2 - u2) / d + 1);

  if (cover_north_pole) {
    ++i1;
    for (let i = 1; i <= i1; ++i) walkRing(nside, i, cb);
    ++i1;
  }
  if (i1 === 0) {
    walkRing(nside, 1, cb);
    i1 = 2;
  }

  if (cover_south_pole) {
    --i2;
    for (let i = i2; i <= 4 * nside - 1; ++i) walkRing(nside, i, cb);
    --i2;
  }
  if (i2 === 4 * nside) {
    walkRing(nside, 4 * nside - 1, cb);
    i2 = 4 * nside - 2;
  }

  const theta = Math.acos(z0);
  for (let i = i1; i <= i2; ++i) {
    walkRingAround(nside, i, a0, theta, radius + pixrad, (ipix) => {
      if (angularDistance(pix2VecNest(nside, ipix), v) <= radius + pixrad)
        cb(ipix);
    });
  }
}

/**
 * Finds all RING pixels that overlap with a disc.
 *
 * @param nside - Grid resolution
 * @param v - Center of disc (unit vector)
 * @param radius - Disc radius in radians (must be < π/2)
 * @param cbRing - Callback function called with each RING pixel index
 *
 * Same as queryDiscInclusiveNest but returns RING indices.
 */
export function queryDiscInclusiveRing(
  nside: number,
  v: V3,
  radius: number,
  cbRing: (ipix: number) => void
): void {
  return queryDiscInclusiveNest(nside, v, radius, (ipix) => {
    cbRing(nest2ring(nside, ipix));
  });
}

/**
 * Iterates all pixels in a specific ring.
 *
 * @param nside - Grid resolution
 * @param i - Ring index (1 = northernmost)
 * @param cb - Callback for each pixel
 *
 * Used by disc query when a ring is fully contained in the disc,
 * or when the azimuthal range spans the entire ring.
 */
function walkRing(nside: number, i: number, cb: (ipix: number) => void): void {
  // Compute (t, u) for a starting pixel in this ring
  const u = PI_4 * (2 - i / nside);
  const t = PI_4 * (1 + (1 - (i % 2)) / nside); // Account for ring staggering

  const begin = tu2fxy(nside, t, u);
  let s = begin;

  // Walk around the ring until we return to the starting pixel
  do {
    cb(fxy2nest(nside, s.f, s.x, s.y));
    s = rightNextPixel(nside, s);
  } while (!fxyEqual(s, begin));
}

/**
 * Iterates pixels in a ring near a specific azimuth.
 *
 * @param nside - Grid resolution
 * @param i - Ring index
 * @param a0 - Center azimuth
 * @param theta - Colatitude of disc center
 * @param r - Search radius (including pixel radius buffer)
 * @param cb - Callback for each pixel
 *
 * Computes the azimuthal range where a disc of radius r centered at
 * (theta, a0) intersects ring i, then walks only those pixels.
 */
function walkRingAround(
  nside: number,
  i: number,
  a0: number,
  theta: number,
  r: number,
  cb: (ipix: number) => void
): void {
  // If disc center is very close to a pole, walk entire ring
  if (theta < r || theta + r > PI) return walkRing(nside, i, cb);

  const u = PI_4 * (2 - i / nside);
  const z = tu2za(PI_4, u).z;

  const st = Math.sin(theta);
  const ct = Math.cos(theta);
  const sr = Math.sin(r);
  const cr = Math.cos(r);

  const w = Math.atan2(
    Math.sqrt(-square(z - ct * cr) / (square(st) * sr * sr) + 1) * sr,
    (-z * ct + cr) / st
  );

  if (w >= PI) return walkRing(nside, i, cb);

  const t1 = centerT(nside, i, za2tu(z, wrap(a0 - w, PI2)).t);
  const t2 = centerT(nside, i, za2tu(z, wrap(a0 + w, PI2)).t);

  const begin = tu2fxy(nside, t1, u);
  const end = rightNextPixel(nside, tu2fxy(nside, t2, u));

  for (let s = begin; !fxyEqual(s, end); s = rightNextPixel(nside, s)) {
    cb(fxy2nest(nside, s.f, s.x, s.y));
  }
}

/**
 * Snaps a t-coordinate to the center of the nearest pixel in ring i.
 *
 * @param nside - Grid resolution
 * @param i - Ring index
 * @param t - Input t-coordinate
 * @returns t-coordinate snapped to pixel center
 *
 * Pixels in alternating rings are offset by half a pixel width,
 * so this function handles that staggering.
 */
function centerT(nside: number, i: number, t: number): number {
  const d = PI_4 / nside;
  t /= d;
  // Snap to pixel center, accounting for ring parity
  t = (((t + (i % 2)) >> 1) << 1) + 1 - (i % 2);
  t *= d;
  return t;
}
