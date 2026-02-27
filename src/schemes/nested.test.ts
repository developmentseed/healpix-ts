import { fxy2nest, nest2fxy, bitCombine, bitDecombine } from './nested';

describe('bitCombine / bitDecombine', () => {
  it('round-trips for zero', () => {
    expect(bitDecombine(bitCombine(0, 0))).toEqual({ x: 0, y: 0 });
  });

  it('round-trips for small values', () => {
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const combined = bitCombine(x, y);
        const { x: x2, y: y2 } = bitDecombine(combined);
        expect(x2).toBe(x);
        expect(y2).toBe(y);
      }
    }
  });

  it('round-trips for larger values', () => {
    const cases = [
      [100, 200],
      [255, 255],
      [1023, 511],
      [0, 1000]
    ];
    for (const [x, y] of cases) {
      const { x: x2, y: y2 } = bitDecombine(bitCombine(x, y));
      expect(x2).toBe(x);
      expect(y2).toBe(y);
    }
  });

  it('interleaves bits correctly for simple case', () => {
    // x=1 (binary: 1), y=0 -> result should be 1 (bit 0 is x's bit 0)
    expect(bitCombine(1, 0)).toBe(1);
    // x=0, y=1 (binary: 1) -> result should be 2 (bit 1 is y's bit 0)
    expect(bitCombine(0, 1)).toBe(2);
    // x=1, y=1 -> result should be 3 (bits: y0=1, x0=1 -> 11 = 3)
    expect(bitCombine(1, 1)).toBe(3);
  });

  it('round-trips for 20-bit values', () => {
    const cases = [
      [0, 0],
      [1 << 19, 1 << 19],
      [(1 << 20) - 1, (1 << 20) - 1],
      [(1 << 20) - 1, 0],
      [0, (1 << 20) - 1],
      [123456, 789012]
    ];
    for (const [x, y] of cases) {
      const { x: x2, y: y2 } = bitDecombine(bitCombine(x, y));
      expect(x2).toBe(x);
      expect(y2).toBe(y);
    }
  });
});

describe('fxy2nest / nest2fxy', () => {
  const nside = 4;

  it('round-trips for all pixels at nside=4', () => {
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const { f, x, y } = nest2fxy(nside, ipix);
      const result = fxy2nest(nside, f, x, y);
      expect(result).toBe(ipix);
    }
  });

  it('base pixel index f is in [0, 11]', () => {
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const { f } = nest2fxy(nside, ipix);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(11);
    }
  });

  it('x and y are in [0, nside)', () => {
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const { x, y } = nest2fxy(nside, ipix);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(nside);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(nside);
    }
  });

  it('first pixel of each base pixel has ipix = f * nside^2', () => {
    for (let f = 0; f < 12; f++) {
      const ipix = fxy2nest(nside, f, 0, 0);
      expect(ipix).toBe(f * nside * nside);
    }
  });

  it('hierarchical property: children are at 4*parent + {0,1,2,3}', () => {
    const parentNside = 2;
    const childNside = 4;
    const parentNpix = 12 * parentNside * parentNside;

    for (let parentIpix = 0; parentIpix < parentNpix; parentIpix++) {
      const { f: pf, x: px, y: py } = nest2fxy(parentNside, parentIpix);

      // Each parent pixel's 4 children at double resolution
      const childBase = parentIpix * 4;
      for (let c = 0; c < 4; c++) {
        const childIpix = childBase + c;
        const { f: cf, x: cx, y: cy } = nest2fxy(childNside, childIpix);

        // Child must be in same base pixel
        expect(cf).toBe(pf);
        // Child coords must be in the correct quadrant of parent
        expect(Math.floor(cx / 2)).toBe(px);
        expect(Math.floor(cy / 2)).toBe(py);
      }
    }
  });
});
