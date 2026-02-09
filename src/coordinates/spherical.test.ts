import { vec2za, za2vec, ang2vec, vec2ang, angularDistance } from './spherical';
import { V3 } from '../types';

const PI = Math.PI;
const PI2 = 2 * PI;

describe('vec2za', () => {
  it('converts north pole vector', () => {
    const { z, a } = vec2za(0, 0, 1);
    expect(z).toBe(1);
    expect(a).toBe(0);
  });

  it('converts south pole vector', () => {
    const { z, a } = vec2za(0, 0, -1);
    expect(z).toBe(-1);
    expect(a).toBe(0);
  });

  it('converts equatorial point along X-axis', () => {
    const { z, a } = vec2za(1, 0, 0);
    expect(z).toBeCloseTo(0);
    expect(a).toBeCloseTo(0);
  });

  it('converts equatorial point along Y-axis', () => {
    const { z, a } = vec2za(0, 1, 0);
    expect(z).toBeCloseTo(0);
    expect(a).toBeCloseTo(PI / 2);
  });

  it('normalizes non-unit vectors', () => {
    const { z, a } = vec2za(0, 0, 5);
    expect(z).toBe(1);
    expect(a).toBe(0);
  });

  it('returns azimuth in [0, 2π)', () => {
    const { a } = vec2za(-1, 0, 0);
    expect(a).toBeCloseTo(PI);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(PI2 + 1e-10);
  });
});

describe('za2vec', () => {
  it('converts north pole', () => {
    const [x, y, z] = za2vec(1, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(1);
  });

  it('converts south pole', () => {
    const [x, y, z] = za2vec(-1, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(-1);
  });

  it('converts equatorial point', () => {
    const [x, y, z] = za2vec(0, 0);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });

  it('produces unit vectors', () => {
    const [x, y, z] = za2vec(0.5, 1.0);
    const norm = Math.sqrt(x * x + y * y + z * z);
    expect(norm).toBeCloseTo(1);
  });

  it('round-trips with vec2za', () => {
    const zIn = 0.6;
    const aIn = 1.5;
    const [x, y, z] = za2vec(zIn, aIn);
    const { z: zOut, a: aOut } = vec2za(x, y, z);
    expect(zOut).toBeCloseTo(zIn);
    expect(aOut).toBeCloseTo(aIn);
  });
});

describe('ang2vec', () => {
  it('converts north pole (theta=0)', () => {
    const [x, y, z] = ang2vec(0, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(1);
  });

  it('converts south pole (theta=π)', () => {
    const [x, y, z] = ang2vec(PI, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(-1);
  });

  it('converts equatorial point', () => {
    const [x, y, z] = ang2vec(PI / 2, 0);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });
});

describe('vec2ang', () => {
  it('round-trips with ang2vec', () => {
    const theta = PI / 3;
    const phi = PI / 4;
    const v = ang2vec(theta, phi);
    const { theta: thetaOut, phi: phiOut } = vec2ang(v);
    expect(thetaOut).toBeCloseTo(theta);
    expect(phiOut).toBeCloseTo(phi);
  });
});

describe('angularDistance', () => {
  it('returns 0 for identical vectors', () => {
    const v: V3 = [1, 0, 0];
    expect(angularDistance(v, v)).toBeCloseTo(0);
  });

  it('returns π for opposite poles', () => {
    const north: V3 = [0, 0, 1];
    const south: V3 = [0, 0, -1];
    expect(angularDistance(north, south)).toBeCloseTo(PI);
  });

  it('returns π/2 for orthogonal vectors', () => {
    const a: V3 = [1, 0, 0];
    const b: V3 = [0, 1, 0];
    expect(angularDistance(a, b)).toBeCloseTo(PI / 2);
  });

  it('is symmetric', () => {
    const a: V3 = ang2vec(0.5, 1.0);
    const b: V3 = ang2vec(1.0, 2.0);
    expect(angularDistance(a, b)).toBeCloseTo(angularDistance(b, a));
  });

  it('satisfies triangle inequality', () => {
    const a: V3 = ang2vec(0.3, 0.5);
    const b: V3 = ang2vec(0.8, 1.5);
    const c: V3 = ang2vec(1.2, 2.5);
    const ab = angularDistance(a, b);
    const bc = angularDistance(b, c);
    const ac = angularDistance(a, c);
    expect(ab + bc).toBeGreaterThanOrEqual(ac - 1e-10);
  });
});
