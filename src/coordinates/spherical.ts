/**
 * @module coordinates/spherical
 * Conversions between 3D vectors and spherical coordinates
 */

import { V3, ZA, AngularCoords } from '../types';
import { PI2 } from '../constants';

/**
 * Converts 3D Cartesian coordinates to normalized spherical coordinates (z, a).
 *
 * @param X - X component (toward phi=0)
 * @param Y - Y component (toward phi=π/2)
 * @param z - Z component (toward north pole)
 * @returns { z: cos(theta), a: azimuth angle }
 *
 * This function normalizes the input vector to the unit sphere and extracts:
 * - z = cos(colatitude) ∈ [-1, 1], where z=1 is north pole, z=-1 is south pole
 * - a = azimuth angle ∈ [0, 2π), measured from X-axis toward Y-axis
 *
 * Special case: At the poles (X=Y=0), azimuth is undefined, so we return a=0.
 *
 * Why use z instead of theta?
 * - Many HEALPix calculations are simpler with z = cos(theta)
 * - Avoids expensive trig functions in many places
 * - z directly relates to the equal-area property
 */
export function vec2za(X: number, Y: number, z: number): ZA {
  const r2 = X * X + Y * Y; // squared distance from z-axis

  if (r2 === 0) {
    // Point is on the z-axis (pole) - azimuth is undefined
    return { z: z < 0 ? -1 : 1, a: 0 };
  } else {
    // Compute azimuth using atan2 (handles all quadrants correctly)
    // Add PI2 and mod to ensure result is in [0, 2π)
    const a = (Math.atan2(Y, X) + PI2) % PI2;

    // Normalize z to unit sphere: z / |v| = z / sqrt(X² + Y² + Z²)
    z /= Math.sqrt(z * z + r2);

    return { z, a };
  }
}

/**
 * Converts spherical coordinates (z, a) to 3D Cartesian vector on unit sphere.
 *
 * @param z - cos(colatitude) ∈ [-1, 1]
 * @param a - azimuth angle ∈ [0, 2π)
 * @returns [X, Y, Z] unit vector
 *
 * Uses the standard spherical-to-Cartesian transformation:
 *   X = sin(theta) * cos(phi) = sqrt(1-z²) * cos(a)
 *   Y = sin(theta) * sin(phi) = sqrt(1-z²) * sin(a)
 *   Z = cos(theta) = z
 *
 * Note: sin(theta) = sqrt(1 - cos²(theta)) = sqrt(1 - z²)
 */
export function za2vec(z: number, a: number): V3 {
  const sin_theta = Math.sqrt(1 - z * z);
  const X = sin_theta * Math.cos(a);
  const Y = sin_theta * Math.sin(a);
  return [X, Y, z];
}

/**
 * Converts angular coordinates (theta, phi) to 3D unit vector.
 *
 * @param theta - Colatitude in radians [0, π] (0 = north pole)
 * @param phi - Longitude in radians [0, 2π)
 * @returns [X, Y, Z] unit vector
 *
 * This is the standard physics convention for spherical coordinates.
 * The conversion chain is: (theta, phi) → (z=cos(theta), a=phi) → (X, Y, Z)
 */
export function ang2vec(theta: number, phi: number): V3 {
  const z = Math.cos(theta);
  return za2vec(z, phi);
}

/**
 * Converts 3D unit vector to angular coordinates (theta, phi).
 *
 * @param v - [X, Y, Z] unit vector
 * @returns { theta: colatitude, phi: longitude }
 *
 * Inverse of ang2vec. The conversion extracts spherical coordinates
 * from the Cartesian representation.
 */
export function vec2ang(v: V3): AngularCoords {
  const { z, a } = vec2za(v[0], v[1], v[2]);
  return { theta: Math.acos(z), phi: a };
}

/**
 * Computes the angular distance between two unit vectors.
 *
 * @param a - First unit vector
 * @param b - Second unit vector
 * @returns Angular distance in radians
 *
 * Uses the formula: angle = 2 * arcsin(|a - b| / 2)
 *
 * This is more numerically stable than arccos(a · b) for small angles,
 * because arcsin has better precision near 0.
 *
 * The formula comes from the relationship between chord length and angle:
 * For unit vectors, |a - b| = 2 * sin(angle/2)
 */
export function angularDistance(a: V3, b: V3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dist2 = dx * dx + dy * dy + dz * dz;
  return 2 * Math.asin(Math.sqrt(dist2) / 2);
}
