import { nest2ring, ring2nest } from './conversion';

describe('nest2ring / ring2nest', () => {
  it('round-trips for all pixels at nside=1', () => {
    const nside = 1;
    const npix = 12;
    for (let ipix = 0; ipix < npix; ipix++) {
      expect(ring2nest(nside, nest2ring(nside, ipix))).toBe(ipix);
      expect(nest2ring(nside, ring2nest(nside, ipix))).toBe(ipix);
    }
  });

  it('round-trips for all pixels at nside=4', () => {
    const nside = 4;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      expect(ring2nest(nside, nest2ring(nside, ipix))).toBe(ipix);
    }
  });

  it('round-trips for all pixels at nside=8', () => {
    const nside = 8;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      expect(ring2nest(nside, nest2ring(nside, ipix))).toBe(ipix);
    }
  });

  it('nest2ring produces unique indices', () => {
    const nside = 4;
    const npix = 12 * nside * nside;
    const ringIndices = new Set<number>();
    for (let ipix = 0; ipix < npix; ipix++) {
      ringIndices.add(nest2ring(nside, ipix));
    }
    expect(ringIndices.size).toBe(npix);
  });

  it('ring2nest produces unique indices', () => {
    const nside = 4;
    const npix = 12 * nside * nside;
    const nestIndices = new Set<number>();
    for (let ipix = 0; ipix < npix; ipix++) {
      nestIndices.add(ring2nest(nside, ipix));
    }
    expect(nestIndices.size).toBe(npix);
  });

  it('all indices are in valid range [0, npix)', () => {
    const nside = 4;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const ring = nest2ring(nside, ipix);
      expect(ring).toBeGreaterThanOrEqual(0);
      expect(ring).toBeLessThan(npix);
    }
  });
});
