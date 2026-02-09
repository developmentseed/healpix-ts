import { queryBoxInclusiveNest, queryBoxInclusiveRing } from './box';
import { pix2LonLatNest } from '../geo/latlon';
import { nside2npix } from '../resolution';
import { BBox } from '../types';

describe('queryBoxInclusiveNest', () => {
  const nside = 16;

  it('returns pixels for a small box', () => {
    const bbox: BBox = [-10, -10, 10, 10];
    const pixels = queryBoxInclusiveNest(nside, bbox);
    expect(pixels.length).toBeGreaterThan(0);
  });

  it('all returned pixels are in valid range', () => {
    const bbox: BBox = [0, 0, 45, 45];
    const npix = nside2npix(nside);
    const pixels = queryBoxInclusiveNest(nside, bbox);
    for (const ipix of pixels) {
      expect(ipix).toBeGreaterThanOrEqual(0);
      expect(ipix).toBeLessThan(npix);
    }
  });

  it('returned pixels are unique', () => {
    const bbox: BBox = [-30, -20, 30, 20];
    const pixels = queryBoxInclusiveNest(nside, bbox);
    const unique = new Set(pixels);
    expect(unique.size).toBe(pixels.length);
  });

  it('pixel centers are near the query box', () => {
    const bbox: BBox = [10, 20, 30, 40];
    const pixels = queryBoxInclusiveNest(nside, bbox);

    for (const ipix of pixels) {
      const [lon, lat] = pix2LonLatNest(nside, ipix);
      // With pixel radius buffer, centers should be reasonably close
      expect(lon).toBeGreaterThan(-30);
      expect(lon).toBeLessThan(80);
      expect(lat).toBeGreaterThan(-30);
      expect(lat).toBeLessThan(90);
    }
  });

  it('larger box returns more pixels', () => {
    const smallBox: BBox = [0, 0, 10, 10];
    const largeBox: BBox = [-20, -20, 30, 30];
    const smallPixels = queryBoxInclusiveNest(nside, smallBox);
    const largePixels = queryBoxInclusiveNest(nside, largeBox);
    expect(largePixels.length).toBeGreaterThan(smallPixels.length);
  });

  it('handles box near north pole', () => {
    const bbox: BBox = [-180, 80, 180, 90];
    const pixels = queryBoxInclusiveNest(nside, bbox);
    expect(pixels.length).toBeGreaterThan(0);

    for (const ipix of pixels) {
      const [, lat] = pix2LonLatNest(nside, ipix);
      expect(lat).toBeGreaterThan(50); // Should be in northern region
    }
  });

  it('handles box near south pole', () => {
    const bbox: BBox = [-180, -90, 180, -80];
    const pixels = queryBoxInclusiveNest(nside, bbox);
    expect(pixels.length).toBeGreaterThan(0);

    for (const ipix of pixels) {
      const [, lat] = pix2LonLatNest(nside, ipix);
      expect(lat).toBeLessThan(-50); // Should be in southern region
    }
  });

  it('handles antimeridian crossing box', () => {
    // Box that wraps around the antimeridian
    const bbox: BBox = [170, -10, -170, 10]; // minLon > maxLon
    const pixels = queryBoxInclusiveNest(nside, bbox);
    expect(pixels.length).toBeGreaterThan(0);
  });
});

describe('queryBoxInclusiveRing', () => {
  const nside = 16;

  it('returns same count as nest version', () => {
    const bbox: BBox = [-15, -15, 15, 15];
    const nestPixels = queryBoxInclusiveNest(nside, bbox);
    const ringPixels = queryBoxInclusiveRing(nside, bbox);
    expect(ringPixels.length).toBe(nestPixels.length);
  });

  it('ring pixels are in valid range', () => {
    const bbox: BBox = [0, 0, 30, 30];
    const npix = nside2npix(nside);
    const pixels = queryBoxInclusiveRing(nside, bbox);
    for (const ipix of pixels) {
      expect(ipix).toBeGreaterThanOrEqual(0);
      expect(ipix).toBeLessThan(npix);
    }
  });
});
