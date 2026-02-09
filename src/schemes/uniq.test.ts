import { orderpix2uniq, uniq2orderpix, uniqParent, uniqChildren } from './uniq';

describe('orderpix2uniq / uniq2orderpix', () => {
  it('round-trips for order 0', () => {
    for (let ipix = 0; ipix < 12; ipix++) {
      const uniq = orderpix2uniq(0, ipix);
      const { order, ipix: ipix2 } = uniq2orderpix(uniq);
      expect(order).toBe(0);
      expect(ipix2).toBe(ipix);
    }
  });

  it('round-trips for order 1', () => {
    for (let ipix = 0; ipix < 48; ipix++) {
      const uniq = orderpix2uniq(1, ipix);
      const { order, ipix: ipix2 } = uniq2orderpix(uniq);
      expect(order).toBe(1);
      expect(ipix2).toBe(ipix);
    }
  });

  it('round-trips for several orders', () => {
    for (let order = 0; order <= 5; order++) {
      const npix = 12 * (1 << (2 * order));
      // Test a sample of pixels
      for (let ipix = 0; ipix < Math.min(npix, 50); ipix++) {
        const uniq = orderpix2uniq(order, ipix);
        const result = uniq2orderpix(uniq);
        expect(result.order).toBe(order);
        expect(result.ipix).toBe(ipix);
      }
    }
  });

  it('higher orders produce larger uniq values', () => {
    const u0 = orderpix2uniq(0, 0);
    const u1 = orderpix2uniq(1, 0);
    const u2 = orderpix2uniq(2, 0);
    expect(u1).toBeGreaterThan(u0);
    expect(u2).toBeGreaterThan(u1);
  });

  it('uniq values at the same order are consecutive', () => {
    const order = 2;
    for (let ipix = 0; ipix < 10; ipix++) {
      expect(orderpix2uniq(order, ipix + 1) - orderpix2uniq(order, ipix)).toBe(
        1
      );
    }
  });
});

describe('uniqParent', () => {
  it('throws for order 0 pixels (no parent)', () => {
    for (let ipix = 0; ipix < 12; ipix++) {
      expect(() => uniqParent(orderpix2uniq(0, ipix))).toThrow();
    }
  });

  it('parent of order 1 pixel is correct order 0 pixel', () => {
    // Children of pixel 0 at order 0 are pixels 0-3 at order 1
    for (let c = 0; c < 4; c++) {
      const childUniq = orderpix2uniq(1, c);
      const parentUniq = uniqParent(childUniq);
      const { order, ipix } = uniq2orderpix(parentUniq);
      expect(order).toBe(0);
      expect(ipix).toBe(0);
    }
  });
});

describe('uniqChildren', () => {
  it('returns 4 children', () => {
    const children = uniqChildren(orderpix2uniq(0, 0));
    expect(children).toHaveLength(4);
  });

  it('children are at the next order', () => {
    const parentUniq = orderpix2uniq(2, 5);
    const children = uniqChildren(parentUniq);
    for (const childUniq of children) {
      const { order } = uniq2orderpix(childUniq);
      expect(order).toBe(3);
    }
  });

  it('parent of children is the original pixel', () => {
    const parentUniq = orderpix2uniq(2, 7);
    const children = uniqChildren(parentUniq);
    for (const childUniq of children) {
      expect(uniqParent(childUniq)).toBe(parentUniq);
    }
  });

  it('children ipix values are consecutive 4*ipix + {0,1,2,3}', () => {
    const order = 1;
    const ipix = 3;
    const children = uniqChildren(orderpix2uniq(order, ipix));
    for (let i = 0; i < 4; i++) {
      const { ipix: childIpix } = uniq2orderpix(children[i]);
      expect(childIpix).toBe(4 * ipix + i);
    }
  });
});
