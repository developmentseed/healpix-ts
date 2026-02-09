/**
 * @module types
 * Core type definitions for HEALPix
 */

/**
 * 3D Vector representing a point on the unit sphere.
 *
 * Format: [X, Y, Z] where:
 * - X = sin(theta) * cos(phi)  (points toward phi=0)
 * - Y = sin(theta) * sin(phi)  (points toward phi=π/2)
 * - Z = cos(theta)             (points toward north pole)
 *
 * For a unit sphere: X² + Y² + Z² = 1
 */
export type V3 = [number, number, number];

/**
 * Pixel coordinates within the HEALPix grid.
 *
 * - f: Base pixel index {0..11}
 *      - 0-3: North polar cap
 *      - 4-7: Equatorial belt
 *      - 8-11: South polar cap
 * - x: Index along the north-east direction [0, nside)
 * - y: Index along the north-west direction [0, nside)
 *
 * The (x, y) coordinates form a rotated grid within each base pixel,
 * with (0, 0) at the southern corner of the base pixel.
 */
export type FXY = { f: number; x: number; y: number };

/**
 * Spherical coordinates in (z, a) form.
 *
 * - z: cos(colatitude) ∈ [-1, 1], where z=1 is north pole
 * - a: azimuth angle ∈ [0, 2π)
 */
export type ZA = { z: number; a: number };

/**
 * Angular coordinates (theta, phi).
 *
 * - theta: Colatitude [0, π], where 0 = north pole
 * - phi: Longitude [0, 2π)
 */
export type AngularCoords = { theta: number; phi: number };

/**
 * HEALPix projection coordinates.
 *
 * - t: longitude-like coordinate [0, 2π)
 * - u: latitude-like coordinate [-π/2, π/2]
 */
export type TU = { t: number; u: number };

/**
 * Geographic coordinates in longitude/latitude.
 *
 * - lon: Longitude in degrees [-180, 180]
 * - lat: Latitude in degrees [-90, 90], where 90 = north pole
 */
export type LonLat = [number, number];

/**
 * Order and pixel index pair (used with UNIQ scheme).
 *
 * - order: Resolution level (0, 1, 2, ...)
 * - ipix: Nested pixel index at that order
 */
export type OrderPix = { order: number; ipix: number };

/**
 * Bounding box in [minLon, minLat, maxLon, maxLat] format.
 *
 * - minLon: Minimum longitude in degrees [-180, 180]
 * - minLat: Minimum latitude in degrees [-90, 90]
 * - maxLon: Maximum longitude in degrees [-180, 180]
 * - maxLat: Maximum latitude in degrees [-90, 90]
 *
 * Note: If minLon > maxLon, the box crosses the antimeridian.
 */
export type BBox = [number, number, number, number];
