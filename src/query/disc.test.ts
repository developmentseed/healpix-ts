import { queryDiscInclusiveNest, queryDiscInclusiveRing } from './disc';
import { pix2VecNest } from '../lookup/lookup';
import { ang2vec, angularDistance } from '../coordinates/spherical';
import { nside2npix } from '../resolution';
import { V3 } from '../types';

const PI = Math.PI;

describe('queryDiscInclusiveNest', () => {
  const nside = 8;

  it('returns pixels for a small disc', () => {
    const center: V3 = [1, 0, 0]; // Equatorial point
    const radius = 0.3;
    const pixels: number[] = [];
    queryDiscInclusiveNest(nside, center, radius, (ipix) => pixels.push(ipix));
    expect(pixels.length).toBeGreaterThan(0);
  });

  it('all returned pixels are in valid range', () => {
    const center: V3 = [0, 0, 1]; // North pole
    const radius = 0.5;
    const npix = nside2npix(nside);
    const pixels: number[] = [];
    queryDiscInclusiveNest(nside, center, radius, (ipix) => pixels.push(ipix));

    for (const ipix of pixels) {
      expect(ipix).toBeGreaterThanOrEqual(0);
      expect(ipix).toBeLessThan(npix);
    }
  });

  it('returned pixels are unique', () => {
    const center: V3 = ang2vec(PI / 4, PI / 3);
    const radius = 0.4;
    const pixels: number[] = [];
    queryDiscInclusiveNest(nside, center, radius, (ipix) => pixels.push(ipix));
    const unique = new Set(pixels);
    expect(unique.size).toBe(pixels.length);
  });

  it('pixel centers near disc center are included', () => {
    const center: V3 = ang2vec(PI / 3, 1.0);
    const radius = 0.3;
    const pixels: number[] = [];
    queryDiscInclusiveNest(nside, center, radius, (ipix) => pixels.push(ipix));

    // The pixel containing the center must be included
    const centerPixel = pixels.find((ipix) => {
      const v = pix2VecNest(nside, ipix);
      return angularDistance(v, center) < 0.1;
    });
    expect(centerPixel).toBeDefined();
  });

  it('larger radius returns more pixels', () => {
    const center: V3 = ang2vec(PI / 2, 0);
    const smallPixels: number[] = [];
    const largePixels: number[] = [];

    queryDiscInclusiveNest(nside, center, 0.1, (ipix) =>
      smallPixels.push(ipix)
    );
    queryDiscInclusiveNest(nside, center, 0.5, (ipix) =>
      largePixels.push(ipix)
    );

    expect(largePixels.length).toBeGreaterThan(smallPixels.length);
  });

  it('small disc returns subset of larger disc', () => {
    const center: V3 = ang2vec(PI / 4, PI);
    const smallPixels: number[] = [];
    const largePixels: number[] = [];

    queryDiscInclusiveNest(nside, center, 0.15, (ipix) =>
      smallPixels.push(ipix)
    );
    queryDiscInclusiveNest(nside, center, 0.4, (ipix) =>
      largePixels.push(ipix)
    );

    const largeSet = new Set(largePixels);
    for (const ipix of smallPixels) {
      expect(largeSet.has(ipix)).toBe(true);
    }
  });

  it('throws for radius >= π/2', () => {
    const center: V3 = [1, 0, 0];
    expect(() =>
      queryDiscInclusiveNest(nside, center, PI / 2 + 0.01, () => {})
    ).toThrow();
  });

  it('works near north pole', () => {
    const center: V3 = [0, 0, 1];
    const pixels: number[] = [];
    queryDiscInclusiveNest(nside, center, 0.3, (ipix) => pixels.push(ipix));
    expect(pixels.length).toBeGreaterThan(0);
  });

  it('works near south pole', () => {
    const center: V3 = [0, 0, -1];
    const pixels: number[] = [];
    queryDiscInclusiveNest(nside, center, 0.3, (ipix) => pixels.push(ipix));
    expect(pixels.length).toBeGreaterThan(0);
  });
});

describe('queryDiscInclusiveRing', () => {
  const nside = 8;

  it('returns same number of pixels as nest version', () => {
    const center: V3 = ang2vec(PI / 3, 1.0);
    const radius = 0.3;
    const nestPixels: number[] = [];
    const ringPixels: number[] = [];

    queryDiscInclusiveNest(nside, center, radius, (ipix) =>
      nestPixels.push(ipix)
    );
    queryDiscInclusiveRing(nside, center, radius, (ipix) =>
      ringPixels.push(ipix)
    );

    expect(ringPixels.length).toBe(nestPixels.length);
  });

  it('ring pixels are in valid range', () => {
    const center: V3 = [1, 0, 0];
    const npix = nside2npix(nside);
    const pixels: number[] = [];
    queryDiscInclusiveRing(nside, center, 0.3, (ipix) => pixels.push(ipix));

    for (const ipix of pixels) {
      expect(ipix).toBeGreaterThanOrEqual(0);
      expect(ipix).toBeLessThan(npix);
    }
  });
});
