import {
  vec2PixNest,
  ang2PixNest,
  ang2PixRing,
  pix2VecNest,
  pix2VecRing,
  pix2AngNest,
  pix2AngRing,
  cornersNest,
  cornersRing,
  pixcoord2VecNest
} from './lookup';
import { angularDistance } from '../coordinates/spherical';
import { nside2npix, nside2resol } from '../resolution';
import { V3 } from '../types';

const PI = Math.PI;

describe('ang2PixNest / pix2AngNest round-trip', () => {
  const nside = 64;

  it('pixel center maps back to same pixel', () => {
    const npix = nside2npix(nside);
    // Test a sample of pixels
    const step = Math.max(1, Math.floor(npix / 200));
    for (let ipix = 0; ipix < npix; ipix += step) {
      const { theta, phi } = pix2AngNest(nside, ipix);
      const recovered = ang2PixNest(nside, theta, phi);
      expect(recovered).toBe(ipix);
    }
  });

  it('angular coordinates are in valid ranges', () => {
    for (let ipix = 0; ipix < 100; ipix++) {
      const { theta } = pix2AngNest(nside, ipix);
      expect(theta).toBeGreaterThanOrEqual(0);
      expect(theta).toBeLessThanOrEqual(PI);
    }
  });
});

describe('vec2PixNest / pix2VecNest round-trip', () => {
  const nside = 64;

  it('pixel center vector maps back to same pixel', () => {
    const npix = nside2npix(nside);
    const step = Math.max(1, Math.floor(npix / 200));
    for (let ipix = 0; ipix < npix; ipix += step) {
      const v = pix2VecNest(nside, ipix);
      const recovered = vec2PixNest(nside, v);
      expect(recovered).toBe(ipix);
    }
  });

  it('returned vectors are on unit sphere', () => {
    for (let ipix = 0; ipix < 50; ipix++) {
      const [x, y, z] = pix2VecNest(nside, ipix);
      const norm = Math.sqrt(x * x + y * y + z * z);
      expect(norm).toBeCloseTo(1);
    }
  });
});

describe('ring scheme equivalence', () => {
  const nside = 16;

  it('ang2PixRing and ang2PixNest give consistent results via conversion', () => {
    const theta = PI / 3;
    const phi = PI / 4;
    const nestPix = ang2PixNest(nside, theta, phi);
    const ringPix = ang2PixRing(nside, theta, phi);
    // Both should identify the same point on the sphere
    const nestVec = pix2VecNest(nside, nestPix);
    const ringVec = pix2VecRing(nside, ringPix);
    expect(angularDistance(nestVec, ringVec)).toBeLessThan(nside2resol(nside));
  });

  it('pix2AngRing returns valid coordinates', () => {
    for (let ipix = 0; ipix < 50; ipix++) {
      const { theta, phi } = pix2AngRing(nside, ipix);
      expect(theta).toBeGreaterThanOrEqual(0);
      expect(theta).toBeLessThanOrEqual(PI);
      expect(phi).toBeGreaterThanOrEqual(0);
    }
  });

  it('pix2VecRing returns unit vectors', () => {
    for (let ipix = 0; ipix < 50; ipix++) {
      const [x, y, z] = pix2VecRing(nside, ipix);
      const norm = Math.sqrt(x * x + y * y + z * z);
      expect(norm).toBeCloseTo(1);
    }
  });
});

describe('cornersNest / cornersRing', () => {
  const nside = 8;

  it('returns 4 corner vectors', () => {
    expect(cornersNest(nside, 0)).toHaveLength(4);
    expect(cornersRing(nside, 0)).toHaveLength(4);
  });

  it('corners are on unit sphere', () => {
    const corners = cornersNest(nside, 42);
    for (const [x, y, z] of corners) {
      const norm = Math.sqrt(x * x + y * y + z * z);
      expect(norm).toBeCloseTo(1);
    }
  });
});

describe('pixcoord2VecNest', () => {
  const nside = 8;

  it('center (0.5, 0.5) matches pix2VecNest', () => {
    for (let ipix = 0; ipix < 20; ipix++) {
      const center = pix2VecNest(nside, ipix);
      const subpixCenter = pixcoord2VecNest(nside, ipix, 0.5, 0.5);
      expect(angularDistance(center, subpixCenter)).toBeLessThan(1e-10);
    }
  });
});

describe('known positions', () => {
  const nside = 1;

  it('north pole maps to a north cap pixel (f=0..3)', () => {
    const northPole: V3 = [0, 0, 1];
    const ipix = vec2PixNest(nside, northPole);
    expect(ipix).toBeGreaterThanOrEqual(0);
    expect(ipix).toBeLessThan(4); // Base pixels 0-3 are north cap
  });

  it('south pole maps to a south cap pixel (f=8..11)', () => {
    const southPole: V3 = [0, 0, -1];
    const ipix = vec2PixNest(nside, southPole);
    expect(ipix).toBeGreaterThanOrEqual(8);
    expect(ipix).toBeLessThan(12);
  });

  it('equatorial point maps to equatorial pixel (f=4..7)', () => {
    const equator: V3 = [1, 0, 0];
    const ipix = vec2PixNest(nside, equator);
    expect(ipix).toBeGreaterThanOrEqual(4);
    expect(ipix).toBeLessThan(8);
  });

  it('all 12 base pixels are reachable', () => {
    const nside8 = 8;
    const seen = new Set<number>();
    const npix = nside2npix(nside8);
    for (let ipix = 0; ipix < npix; ipix++) {
      const v = pix2VecNest(nside8, ipix);
      const recovered = vec2PixNest(nside8, v);
      seen.add(recovered);
    }
    expect(seen.size).toBe(npix);
  });
});
