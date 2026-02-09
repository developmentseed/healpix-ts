import {
  order2nside,
  nside2order,
  nside2npix,
  nside2pixarea,
  nside2resol
} from './resolution';

describe('order2nside', () => {
  it('converts order 0 to nside 1', () => {
    expect(order2nside(0)).toBe(1);
  });

  it('converts powers of 2 correctly', () => {
    expect(order2nside(1)).toBe(2);
    expect(order2nside(2)).toBe(4);
    expect(order2nside(3)).toBe(8);
    expect(order2nside(8)).toBe(256);
    expect(order2nside(10)).toBe(1024);
  });

  it('throws for negative order', () => {
    expect(() => order2nside(-1)).toThrow(RangeError);
  });

  it('throws for order > 29', () => {
    expect(() => order2nside(30)).toThrow(RangeError);
  });

  it('accepts maximum order 29', () => {
    expect(order2nside(29)).toBe(1 << 29);
  });
});

describe('nside2order', () => {
  it('converts nside 1 to order 0', () => {
    expect(nside2order(1)).toBe(0);
  });

  it('converts powers of 2 correctly', () => {
    expect(nside2order(2)).toBe(1);
    expect(nside2order(4)).toBe(2);
    expect(nside2order(256)).toBe(8);
    expect(nside2order(1024)).toBe(10);
  });

  it('throws for non-power-of-2 nside', () => {
    expect(() => nside2order(3)).toThrow(RangeError);
    expect(() => nside2order(5)).toThrow(RangeError);
  });

  it('throws for non-positive nside', () => {
    expect(() => nside2order(0)).toThrow(RangeError);
    expect(() => nside2order(-1)).toThrow(RangeError);
  });

  it('round-trips with order2nside', () => {
    for (let order = 0; order <= 20; order++) {
      expect(nside2order(order2nside(order))).toBe(order);
    }
  });
});

describe('nside2npix', () => {
  it('returns 12 for nside 1 (base resolution)', () => {
    expect(nside2npix(1)).toBe(12);
  });

  it('returns 48 for nside 2', () => {
    expect(nside2npix(2)).toBe(48);
  });

  it('returns 192 for nside 4', () => {
    expect(nside2npix(4)).toBe(192);
  });

  it('returns 12 * nside^2 for arbitrary nside', () => {
    expect(nside2npix(1024)).toBe(12 * 1024 * 1024);
  });
});

describe('nside2pixarea', () => {
  it('total area of all pixels equals 4π (full sphere)', () => {
    const nside = 64;
    const npix = nside2npix(nside);
    const totalArea = nside2pixarea(nside) * npix;
    expect(totalArea).toBeCloseTo(4 * Math.PI);
  });

  it('pixel area decreases with higher resolution', () => {
    expect(nside2pixarea(2)).toBeGreaterThan(nside2pixarea(4));
    expect(nside2pixarea(4)).toBeGreaterThan(nside2pixarea(8));
  });
});

describe('nside2resol', () => {
  it('resolution decreases with higher nside', () => {
    expect(nside2resol(1)).toBeGreaterThan(nside2resol(2));
    expect(nside2resol(2)).toBeGreaterThan(nside2resol(4));
  });

  it('resolution is approximately sqrt(pixel area)', () => {
    const nside = 64;
    expect(nside2resol(nside)).toBeCloseTo(Math.sqrt(nside2pixarea(nside)));
  });
});
