/**
 * @module utils
 * General utility functions used throughout the library
 */

import { DEG2RAD, RAD2DEG } from './constants';

/**
 * Converts radians to degrees.
 * @param radians - The angle in radians.
 * @returns The angle in degrees.
 */
export function rad2Deg(radians: number): number {
  return radians * RAD2DEG;
}

/**
 * Converts degrees to radians.
 * @param degrees - The angle in degrees.
 * @returns The angle in radians.
 */
export function deg2Rad(degrees: number): number {
  return degrees * DEG2RAD;
}

/**
 * Computes the square of a number.
 *
 * @param x - Number to square
 * @returns x²
 */
export function square(x: number): number {
  return x * x;
}

/**
 * Clamps a value to a specified range.
 *
 * @param value - Value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns Value clamped to [min, max]
 */
export function clip(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Wraps a value to a specified range [0, period).
 *
 * @param value - Value to wrap
 * @param period - Period (upper bound, exclusive)
 * @returns Value wrapped to [0, period)
 *
 * Handles negative values correctly (unlike simple modulo).
 * Example: wrap(-0.5, 2π) returns 2π - 0.5, not -0.5.
 */
export function wrap(value: number, period: number): number {
  return value < 0 ? period - (-value % period) : value % period;
}

/**
 * Integer log base 2 (floor).
 *
 * @param x - Positive integer
 * @returns floor(log2(x))
 */
export function ilog2(x: number): number {
  return Math.floor(Math.log2(x));
}

/**
 * Debug assertion.
 *
 * @param condition - Condition that should be true
 * @param message - Optional error message
 *
 * Logs to console and triggers debugger if condition is false.
 */
export function assert(condition: boolean, message?: string): void {
  if (!condition) {
    // eslint-disable-next-line no-console
    console.assert(condition, message);
    // eslint-disable-next-line no-debugger
    debugger;
  }
}
