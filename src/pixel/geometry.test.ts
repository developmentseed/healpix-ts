import { fxyCorners, fxySubpixel, maxPixelRadius } from './geometry';
import { angularDistance } from '../coordinates/spherical';

describe('fxyCorners', () => {
  it('returns 4 corners', () => {
    const corners = fxyCorners(4, 0, 1, 1);
    expect(corners).toHaveLength(4);
  });

  it('corners are unit vectors', () => {
    const corners = fxyCorners(4, 0, 1, 1);
    for (const [x, y, z] of corners) {
      const norm = Math.sqrt(x * x + y * y + z * z);
      expect(norm).toBeCloseTo(1);
    }
  });

  it('corners are distinct', () => {
    const corners = fxyCorners(4, 4, 2, 2);
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        const dist = angularDistance(corners[i], corners[j]);
        expect(dist).toBeGreaterThan(0.001);
      }
    }
  });

  it('corners are close to pixel center', () => {
    const nside = 8;
    const center = fxySubpixel(nside, 0, 3, 3, 0.5, 0.5);
    const corners = fxyCorners(nside, 0, 3, 3);
    const radius = maxPixelRadius(nside);

    for (const corner of corners) {
      const dist = angularDistance(center, corner);
      // Corner should be within ~2x pixel radius
      expect(dist).toBeLessThan(2 * radius);
    }
  });
});

describe('fxySubpixel', () => {
  it('center (0.5, 0.5) returns a unit vector', () => {
    const [x, y, z] = fxySubpixel(4, 0, 1, 1, 0.5, 0.5);
    const norm = Math.sqrt(x * x + y * y + z * z);
    expect(norm).toBeCloseTo(1);
  });

  it('different sub-pixel positions give different vectors', () => {
    const nside = 8;
    const center = fxySubpixel(nside, 4, 2, 2, 0.5, 0.5);
    const south = fxySubpixel(nside, 4, 2, 2, 0, 0);
    const north = fxySubpixel(nside, 4, 2, 2, 1, 1);

    expect(angularDistance(center, south)).toBeGreaterThan(0);
    expect(angularDistance(center, north)).toBeGreaterThan(0);
    expect(angularDistance(south, north)).toBeGreaterThan(0);
  });
});

describe('maxPixelRadius', () => {
  it('returns positive value', () => {
    expect(maxPixelRadius(4)).toBeGreaterThan(0);
  });

  it('decreases with higher resolution', () => {
    expect(maxPixelRadius(4)).toBeGreaterThan(maxPixelRadius(8));
    expect(maxPixelRadius(8)).toBeGreaterThan(maxPixelRadius(16));
  });

  it('is less than π/4 for reasonable nside', () => {
    expect(maxPixelRadius(4)).toBeLessThan(Math.PI / 4);
  });
});
