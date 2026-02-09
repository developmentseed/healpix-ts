/**
 * @module geo/LonLat
 * Geographic coordinate conversions (latitude/longitude)
 */

import { AngularCoords, LonLat, V3 } from '../types';
import { PI2, PI_2 } from '../constants';
import { vec2ang } from '../coordinates/spherical';
import {
  pix2AngNest,
  pix2AngRing,
  cornersNest,
  cornersRing
} from '../lookup/lookup';
import { ang2PixNest, ang2PixRing } from '../lookup/lookup';
import { deg2Rad, rad2Deg } from '../utils';

/**
 * Converts a NESTED pixel index to latitude/longitude (pixel center).
 *
 * @param nside - Grid resolution
 * @param ipix - Nested pixel index
 * @returns [lon, lat] in degrees
 */
export function pix2LonLatNest(nside: number, ipix: number): LonLat {
  const { theta, phi } = pix2AngNest(nside, ipix);
  return ang2LonLat(theta, phi);
}

/**
 * Converts a RING pixel index to latitude/longitude (pixel center).
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @returns [lon, lat] in degrees
 */
export function pix2LonLatRing(nside: number, ipix: number): LonLat {
  const { theta, phi } = pix2AngRing(nside, ipix);
  return ang2LonLat(theta, phi);
}

/**
 * Converts latitude/longitude to NESTED pixel index.
 *
 * @param nside - Grid resolution
 * @param lat - Latitude in degrees [-90, 90]
 * @param lon - Longitude in degrees [-180, 180] or [0, 360]
 * @returns Nested pixel index
 */
export function lonLat2PixNest(
  nside: number,
  lon: number,
  lat: number
): number {
  const { theta, phi } = lonLat2Ang(lon, lat);
  return ang2PixNest(nside, theta, phi);
}

/**
 * Converts latitude/longitude to RING pixel index.
 *
 * @param nside - Grid resolution
 * @param lat - Latitude in degrees [-90, 90]
 * @param lon - Longitude in degrees [-180, 180] or [0, 360]
 * @returns Ring pixel index
 */
export function lonLat2PixRing(
  nside: number,
  lon: number,
  lat: number
): number {
  const { theta, phi } = lonLat2Ang(lon, lat);
  return ang2PixRing(nside, theta, phi);
}

/**
 * Gets the 4 corner coordinates of a NESTED pixel in lon/lat.
 *
 * @param nside - Grid resolution
 * @param ipix - Nested pixel index
 * @returns Array of 4 corners: [north, west, south, east] in [lon, lat]
 *
 * For pixels that cross the antimeridian (±180°), corner longitudes are
 * unwrapped to form a continuous polygon. This means some longitudes may
 * exceed the [-180, 180] range (e.g., 182° instead of -178°).
 */
export function cornersNestLonLat(nside: number, ipix: number): LonLat[] {
  const corners = cornersNest(nside, ipix);
  return unwrapCornerLons(corners.map((v) => vec2LonLat(v)));
}

/**
 * Gets the 4 corner coordinates of a RING pixel in lon/lat.
 *
 * @param nside - Grid resolution
 * @param ipix - Ring pixel index
 * @returns Array of 4 corners: [north, west, south, east] in [lon, lat]
 *
 * For pixels that cross the antimeridian (±180°), corner longitudes are
 * unwrapped to form a continuous polygon. This means some longitudes may
 * exceed the [-180, 180] range (e.g., 182° instead of -178°).
 */
export function cornersRingLonLat(nside: number, ipix: number): LonLat[] {
  const corners = cornersRing(nside, ipix);
  return unwrapCornerLons(corners.map((v) => vec2LonLat(v)));
}

/**
 * Unwraps corner longitudes so they form a continuous polygon.
 *
 * When a pixel straddles the antimeridian (±180°), some corners end up
 * near +180° and others near -180°, causing a ~360° longitude span.
 * This function shifts outlier longitudes so all corners are within
 * 180° of each other, keeping the polygon continuous for rendering.
 */
function unwrapCornerLons(corners: LonLat[]): LonLat[] {
  // Use the first corner as the reference longitude.
  const refLon = corners[0][0];
  return corners.map(([lon, lat]) => {
    while (lon - refLon > 180) lon -= 360;
    while (lon - refLon < -180) lon += 360;
    return [lon, lat] as LonLat;
  });
}

/**
 * Converts 3D vector to latitude/longitude.
 *
 * @param v - [X, Y, Z] unit vector
 * @returns [lon, lat] in degrees
 */
export function vec2LonLat(v: V3): LonLat {
  const { theta, phi } = vec2ang(v);
  return ang2LonLat(theta, phi);
}

/**
 * Converts angular coordinates to lon/lat.
 */
function ang2LonLat(theta: number, phi: number): LonLat {
  // Convert theta (polar angle) to latitude.
  const lat = rad2Deg(PI_2 - theta);
  // Convert phi (azimuthal angle) to longitude.
  let lon = rad2Deg(phi);
  // Adjust longitude to be in range [-180, 180]
  while (lon > 180) lon -= 360;
  return [lon, lat];
}

/**
 * Converts lon/lat to angular coordinates.
 */
function lonLat2Ang(lon: number, lat: number): AngularCoords {
  const theta = deg2Rad(90 - lat);
  let phi = deg2Rad(lon);
  while (phi < 0) phi += PI2;
  return { theta, phi };
}
