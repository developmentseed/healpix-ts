import { tu2fpq, tu2fxy, fxy2tu, fxyEqual, rightNextPixel } from './fxy';
import { za2tu } from '../coordinates/projection';
import { FXY } from '../types';

const PI_4 = Math.PI / 4;

describe('tu2fpq', () => {
  it('returns valid base pixel index (0-11)', () => {
    // Sample multiple points across the sphere
    for (let z = -0.9; z <= 0.9; z += 0.3) {
      for (let a = 0.1; a < 2 * Math.PI; a += 0.5) {
        const { t, u } = za2tu(z, a);
        const { f } = tu2fpq(t, u);
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThanOrEqual(11);
      }
    }
  });

  it('returns fractional coordinates p, q in [0, 1]', () => {
    for (let z = -0.9; z <= 0.9; z += 0.3) {
      for (let a = 0.1; a < 2 * Math.PI; a += 0.5) {
        const { t, u } = za2tu(z, a);
        const { p, q } = tu2fpq(t, u);
        expect(p).toBeGreaterThanOrEqual(0 - 1e-10);
        expect(p).toBeLessThanOrEqual(1 + 1e-10);
        expect(q).toBeGreaterThanOrEqual(0 - 1e-10);
        expect(q).toBeLessThanOrEqual(1 + 1e-10);
      }
    }
  });
});

describe('tu2fxy / fxy2tu', () => {
  it('round-trips for all pixels at nside=4', () => {
    const nside = 4;
    for (let f = 0; f < 12; f++) {
      for (let x = 0; x < nside; x++) {
        for (let y = 0; y < nside; y++) {
          const { t, u } = fxy2tu(nside, f, x, y);
          const fxy = tu2fxy(nside, t, u);
          expect(fxy.f).toBe(f);
          expect(fxy.x).toBe(x);
          expect(fxy.y).toBe(y);
        }
      }
    }
  });

  it('t is in valid range', () => {
    const nside = 4;
    const { t } = fxy2tu(nside, 0, 0, 0);
    expect(t).toBeGreaterThan(0);
  });

  it('u range covers [-π/2, π/2]', () => {
    const nside = 4;
    let minU = Infinity;
    let maxU = -Infinity;
    for (let f = 0; f < 12; f++) {
      for (let x = 0; x < nside; x++) {
        for (let y = 0; y < nside; y++) {
          const { u } = fxy2tu(nside, f, x, y);
          minU = Math.min(minU, u);
          maxU = Math.max(maxU, u);
        }
      }
    }
    expect(maxU).toBeGreaterThan(0); // Some pixels near north pole
    expect(minU).toBeLessThan(0); // Some pixels near south pole
  });
});

describe('fxyEqual', () => {
  it('returns true for equal pixels', () => {
    expect(fxyEqual({ f: 0, x: 1, y: 2 }, { f: 0, x: 1, y: 2 })).toBe(true);
  });

  it('returns false for different pixels', () => {
    expect(fxyEqual({ f: 0, x: 1, y: 2 }, { f: 0, x: 1, y: 3 })).toBe(false);
    expect(fxyEqual({ f: 0, x: 1, y: 2 }, { f: 1, x: 1, y: 2 })).toBe(false);
  });
});

describe('rightNextPixel', () => {
  it('walking around a ring returns to start', () => {
    const nside = 4;
    // Pick a pixel and walk the ring
    const start: FXY = { f: 0, x: 1, y: 1 };
    let current = rightNextPixel(nside, start);
    let steps = 1;
    const maxSteps = 4 * nside * 4; // Safety limit

    while (!fxyEqual(current, start) && steps < maxSteps) {
      current = rightNextPixel(nside, current);
      steps++;
    }

    expect(fxyEqual(current, start)).toBe(true);
    expect(steps).toBeGreaterThan(0);
    expect(steps).toBeLessThanOrEqual(4 * nside); // Ring has at most 4*nside pixels
  });

  it('all pixels along a ring are unique', () => {
    const nside = 4;
    const start: FXY = { f: 4, x: 2, y: 2 }; // Equatorial belt pixel
    const seen = new Set<string>();
    let current = start;

    do {
      const key = `${current.f},${current.x},${current.y}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      current = rightNextPixel(nside, current);
    } while (!fxyEqual(current, start));
  });
});
