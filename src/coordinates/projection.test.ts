import { sigma, za2tu, tu2za, tu2vec } from './projection';

const PI = Math.PI;
const PI_2 = PI / 2;
const PI_4 = PI / 4;

describe('sigma', () => {
  it('returns 2 at north pole (z=1)', () => {
    expect(sigma(1)).toBeCloseTo(2);
  });

  it('returns -2 at south pole (z=-1)', () => {
    expect(sigma(-1)).toBeCloseTo(-2);
  });

  it('returns 2 - sqrt(3) at equator (z=0)', () => {
    expect(sigma(0)).toBeCloseTo(2 - Math.sqrt(3));
  });

  it('returns 1 at equatorial boundary (z=2/3)', () => {
    expect(sigma(2 / 3)).toBeCloseTo(1);
  });

  it('is an odd function: sigma(-z) = -sigma(z)', () => {
    const z = 0.8;
    expect(sigma(-z)).toBeCloseTo(-sigma(z));
  });
});

describe('za2tu / tu2za round-trip', () => {
  it('round-trips in equatorial belt', () => {
    const z = 0.3; // |z| < 2/3
    const a = 1.5;
    const { t, u } = za2tu(z, a);
    const { z: z2, a: a2 } = tu2za(t, u);
    expect(z2).toBeCloseTo(z);
    expect(a2).toBeCloseTo(a);
  });

  it('round-trips in north polar cap', () => {
    const z = 0.9; // |z| > 2/3
    const a = 2.0;
    const { t, u } = za2tu(z, a);
    const { z: z2, a: a2 } = tu2za(t, u);
    expect(z2).toBeCloseTo(z);
    expect(a2).toBeCloseTo(a);
  });

  it('round-trips in south polar cap', () => {
    const z = -0.85;
    const a = 4.0;
    const { t, u } = za2tu(z, a);
    const { z: z2, a: a2 } = tu2za(t, u);
    expect(z2).toBeCloseTo(z);
    expect(a2).toBeCloseTo(a);
  });

  it('handles equator (z=0)', () => {
    const { t, u } = za2tu(0, 1.0);
    expect(u).toBeCloseTo(0);
    expect(t).toBeCloseTo(1.0);
  });
});

describe('za2tu', () => {
  it('equatorial belt: t equals azimuth', () => {
    const a = 2.5;
    const { t } = za2tu(0.5, a);
    expect(t).toBeCloseTo(a);
  });

  it('equatorial belt: u is linear in z', () => {
    const z1 = 0.2;
    const z2 = 0.4;
    const u1 = za2tu(z1, 0).u;
    const u2 = za2tu(z2, 0).u;
    // u = (3π/8) * z, so u2/u1 = z2/z1
    expect(u2 / u1).toBeCloseTo(z2 / z1);
  });

  it('u is in [-π/2, π/2]', () => {
    for (const z of [-1, -0.5, 0, 0.5, 1]) {
      const { u } = za2tu(z, 0);
      expect(u).toBeGreaterThanOrEqual(-PI_2 - 1e-10);
      expect(u).toBeLessThanOrEqual(PI_2 + 1e-10);
    }
  });
});

describe('tu2za', () => {
  it('returns pole for |u| >= π/2', () => {
    const { z, a } = tu2za(1.0, PI_2);
    expect(z).toBe(1);
    expect(a).toBe(0);
  });

  it('returns south pole for u = -π/2', () => {
    const { z } = tu2za(1.0, -PI_2);
    expect(z).toBe(-1);
  });
});

describe('tu2vec', () => {
  it('produces unit vectors', () => {
    const [x, y, z] = tu2vec(1.0, 0.3);
    const norm = Math.sqrt(x * x + y * y + z * z);
    expect(norm).toBeCloseTo(1);
  });

  it('north pole region gives positive z', () => {
    const [, , z] = tu2vec(0, PI_4 * 1.5);
    expect(z).toBeGreaterThan(0);
  });
});
