/**
 * @module coordinates/projection
 * HEALPix spherical projection: (z, a) ↔ (t, u)
 *
 * The core transformation that maps the sphere to a 2D plane while
 * preserving EQUAL AREA.
 */

import { ZA, TU, V3 } from '../types';
import { PI, PI_2, PI_4, PI_8 } from '../constants';
import { square } from '../utils';
import { za2vec } from './spherical';

/**
 * Sigma function for the polar cap projection.
 *
 * @param z - cos(colatitude)
 * @returns sigma value used in polar cap transformation
 *
 * This function is key to the EQUAL AREA property in polar caps.
 *
 * For z ≥ 0: sigma(z) = 2 - sqrt(3 * (1 - z))
 * For z < 0: sigma(z) = -sigma(-z) (odd function)
 *
 * Mathematical derivation:
 * The equal-area constraint requires that equal increments in sigma
 * correspond to equal solid angles. This leads to the formula above.
 *
 * Properties:
 * - sigma(1) = 2 (north pole)
 * - sigma(2/3) = 1 (boundary between polar cap and equatorial belt)
 * - sigma(0) = 0 (equator)
 * - sigma(-1) = -2 (south pole)
 */
export function sigma(z: number): number {
  if (z < 0) return -sigma(-z);
  else return 2 - Math.sqrt(3 * (1 - z));
}

/**
 * HEALPix forward spherical projection: sphere → 2D plane.
 *
 * @param z - cos(colatitude) ∈ [-1, 1]
 * @param a - azimuth angle ∈ [0, 2π)
 * @returns { t, u } projection coordinates
 *
 * This is the core of the HEALPix projection, mapping the sphere to a
 * 2D plane while preserving EQUAL AREA.
 *
 * The projection has two regions with different formulas:
 *
 * ## EQUATORIAL BELT (|z| ≤ 2/3, i.e., latitude between ±41.8°)
 *
 * Uses a simple cylindrical equal-area projection:
 *   t = a                    (longitude unchanged)
 *   u = (3π/8) * z          (linear in z for equal area)
 *
 * Why (3π/8)? This scaling ensures continuity with the polar caps
 * at z = ±2/3, where u = ±π/4.
 *
 * ## POLAR CAPS (|z| > 2/3)
 *
 * Uses a more complex transformation to handle the polar singularity:
 *   sigma_z = sigma(z)      (see sigma function above)
 *   t = a - (|sigma_z| - 1) * (a mod π/2 - π/4)
 *   u = (π/4) * sigma_z
 *
 * The 't' transformation squeezes meridians together as they approach
 * the poles, ensuring pixels remain roughly square-shaped.
 *
 * The factor (a mod π/2 - π/4) measures the azimuthal deviation from
 * the nearest base pixel diagonal. This is multiplied by (|sigma| - 1)
 * which goes from 0 at the equatorial boundary to 1 at the pole.
 */
export function za2tu(z: number, a: number): TU {
  if (Math.abs(z) <= 2 / 3) {
    // EQUATORIAL BELT: Simple cylindrical equal-area projection
    // The factor 3π/8 ensures continuity with polar caps at z = ±2/3
    const t = a;
    const u = 3 * PI_8 * z;
    return { t, u };
  } else {
    // POLAR CAPS: Modified projection to handle polar singularity
    const p_t = a % PI_2; // Azimuth within current quadrant [0, π/2)
    const sigma_z = sigma(z); // Equal-area transformation

    // Squeeze meridians toward base pixel diagonals near poles
    // (|sigma| - 1) is 0 at equatorial boundary, 1 at pole
    // (p_t - π/4) is deviation from quadrant center
    const t = a - (Math.abs(sigma_z) - 1) * (p_t - PI_4);
    const u = PI_4 * sigma_z;
    return { t, u };
  }
}

/**
 * HEALPix inverse spherical projection: 2D plane → sphere.
 *
 * @param t - Projection x-coordinate [0, 2π)
 * @param u - Projection y-coordinate [-π/2, π/2]
 * @returns { z, a } spherical coordinates
 *
 * Inverse of za2tu. Recovers spherical coordinates from the projection.
 *
 * ## EQUATORIAL BELT (|u| ≤ π/4)
 *
 * Simple inverse:
 *   z = (8/3π) * u
 *   a = t
 *
 * ## POLAR CAPS (π/4 < |u| < π/2)
 *
 * Inverts the polar cap transformation:
 *   a = t - (|u| - π/4) / (|u| - π/2) * (t mod π/2 - π/4)
 *   z = sign(u) * (1 - (1/3) * (2 - 4|u|/π)²)
 *
 * The z formula is derived from inverting sigma(z) = 4u/π.
 */
export function tu2za(t: number, u: number): ZA {
  const abs_u = Math.abs(u);

  if (abs_u >= PI_2) {
    // ERROR: u out of valid range, return pole
    return { z: Math.sign(u), a: 0 };
  }

  if (abs_u <= PI_4) {
    // EQUATORIAL BELT: Simple inverse of cylindrical projection
    const z = (8 / (3 * PI)) * u;
    const a = t;
    return { z, a };
  } else {
    // POLAR CAPS: Inverse of polar cap transformation
    const t_t = t % PI_2; // t within current quadrant

    // Inverse of the meridian squeezing transformation
    // Factor (abs_u - π/4)/(abs_u - π/2) maps [π/4, π/2) → [0, ∞)
    const a = t - ((abs_u - PI_4) / (abs_u - PI_2)) * (t_t - PI_4);

    // Inverse of sigma function: solve sigma(z) = 4u/π for z
    // sigma(z) = 2 - sqrt(3(1-z)), so z = 1 - (2-sigma)²/3
    const z = Math.sign(u) * (1 - (1 / 3) * square(2 - (4 * abs_u) / PI));
    return { z, a };
  }
}

/**
 * Converts projection coordinates directly to 3D vector.
 *
 * @param t - Projection x-coordinate [0, 2π)
 * @param u - Projection y-coordinate [-π/2, π/2]
 * @returns [X, Y, Z] unit vector
 *
 * Convenience function combining tu2za and za2vec.
 */
export function tu2vec(t: number, u: number): V3 {
  const { z, a } = tu2za(t, u);
  return za2vec(z, a);
}
