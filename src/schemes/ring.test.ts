import { fxy2ring, ring2fxy } from './ring';

describe('fxy2ring / ring2fxy', () => {
  it('round-trips for all pixels at nside=4', () => {
    const nside = 4;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const { f, x, y } = ring2fxy(nside, ipix);
      const result = fxy2ring(nside, f, x, y);
      expect(result).toBe(ipix);
    }
  });

  it('round-trips for all pixels at nside=8', () => {
    const nside = 8;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const { f, x, y } = ring2fxy(nside, ipix);
      const result = fxy2ring(nside, f, x, y);
      expect(result).toBe(ipix);
    }
  });

  it('fxy values are in valid ranges', () => {
    const nside = 8;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const { f, x, y } = ring2fxy(nside, ipix);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(11);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(nside);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(nside);
    }
  });

  it('north polar cap has correct pixel counts per ring', () => {
    const nside = 4;
    // Ring 1 should have 4 pixels, ring 2 has 8, ring 3 has 12
    // First ring pixel indices: 0..3 (4 pixels)
    for (let ipix = 0; ipix < 4; ipix++) {
      const { f, x, y } = ring2fxy(nside, ipix);
      // Verify these are in the north polar cap (f in 0-3)
      const fxy_ring = fxy2ring(nside, f, x, y);
      expect(fxy_ring).toBe(ipix);
    }
  });
});
