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

  it('handles antimeridian crossing box (minLon > maxLon form)', () => {
    const bbox: BBox = [170, -10, -170, 10];
    const pixels = queryBoxInclusiveNest(nside, bbox);
    expect(pixels.length).toBeGreaterThan(0);
  });

  it('handles antimeridian crossing box (lon > 180 form)', () => {
    // [178, -21, 184, -15] where 184° = -176°
    const bbox: BBox = [178, -21, 184, -15];
    const pixels = queryBoxInclusiveNest(nside, bbox);
    expect(pixels.length).toBeGreaterThan(0);

    // Should not include pixels that don't intersect the bbox
    const falsePositiveIds = [1592, 1587, 1575, 1572, 1550];
    for (const id of falsePositiveIds) {
      expect(pixels).not.toContain(id);
    }
  });

  it('both antimeridian forms return the same pixels', () => {
    const form1: BBox = [178, -21, 184, -15]; // lon > 180 form
    const form2: BBox = [178, -21, -176, -15]; // minLon > maxLon form
    const pixels1 = queryBoxInclusiveNest(nside, form1).sort();
    const pixels2 = queryBoxInclusiveNest(nside, form2).sort();
    expect(pixels1).toEqual(pixels2);
  });

  it('antimeridian query finds pixels on both sides of the dateline', () => {
    const bbox: BBox = [178, -21, 184, -15];
    const pixels = queryBoxInclusiveNest(nside, bbox);

    const hasWestSide = pixels.some((ipix) => {
      const [lon] = pix2LonLatNest(nside, ipix);
      return lon > 170;
    });
    const hasEastSide = pixels.some((ipix) => {
      const [lon] = pix2LonLatNest(nside, ipix);
      return lon < -170;
    });

    expect(hasWestSide).toBe(true);
    expect(hasEastSide).toBe(true);
  });
});

describe('queryBoxInclusiveNest - polar cap boundary', () => {
  it('finds all pixels for a box crossing the north polar cap boundary (nside=64)', () => {
    const nside = 64;
    const bbox: BBox = [10, 36.86, 30, 42.28];
    const pixels = queryBoxInclusiveNest(nside, bbox);

    // Brute-force: check every pixel to find the true set that intersects
    const npix = nside2npix(nside);
    const missed: number[] = [];
    for (let ipix = 0; ipix < npix; ipix++) {
      const [lon, lat] = pix2LonLatNest(nside, ipix);
      if (lon >= 10 && lon <= 30 && lat >= 36.86 && lat <= 42.28) {
        if (!pixels.includes(ipix)) {
          missed.push(ipix);
        }
      }
    }
    expect(missed).toEqual([]);
  });

  it('finds all pixels for a box crossing the south polar cap boundary (nside=64)', () => {
    const nside = 64;
    const bbox: BBox = [10, -42.28, 30, -36.86];
    const pixels = queryBoxInclusiveNest(nside, bbox);

    const npix = nside2npix(nside);
    const missed: number[] = [];
    for (let ipix = 0; ipix < npix; ipix++) {
      const [lon, lat] = pix2LonLatNest(nside, ipix);
      if (lon >= 10 && lon <= 30 && lat >= -42.28 && lat <= -36.86) {
        if (!pixels.includes(ipix)) {
          missed.push(ipix);
        }
      }
    }
    expect(missed).toEqual([]);
  });

  it('finds all pixels for a box fully inside the north polar cap (nside=64)', () => {
    const nside = 64;
    const bbox: BBox = [0, 50, 40, 70];
    const pixels = queryBoxInclusiveNest(nside, bbox);

    const npix = nside2npix(nside);
    const missed: number[] = [];
    for (let ipix = 0; ipix < npix; ipix++) {
      const [lon, lat] = pix2LonLatNest(nside, ipix);
      if (lon >= 0 && lon <= 40 && lat >= 50 && lat <= 70) {
        if (!pixels.includes(ipix)) {
          missed.push(ipix);
        }
      }
    }
    expect(missed).toEqual([]);
  });

  it('finds all pixels for a box spanning equatorial to polar cap (nside=32)', () => {
    const nside = 32;
    const bbox: BBox = [-20, 30, 20, 55];
    const pixels = queryBoxInclusiveNest(nside, bbox);

    const npix = nside2npix(nside);
    const missed: number[] = [];
    for (let ipix = 0; ipix < npix; ipix++) {
      const [lon, lat] = pix2LonLatNest(nside, ipix);
      if (lon >= -20 && lon <= 20 && lat >= 30 && lat <= 55) {
        if (!pixels.includes(ipix)) {
          missed.push(ipix);
        }
      }
    }
    expect(missed).toEqual([]);
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
