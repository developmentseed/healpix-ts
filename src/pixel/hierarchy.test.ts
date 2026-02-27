import {
  nestParent,
  nestChildren,
  nestAncestor,
  nestDescendants,
  isNestAncestor,
  ringParent,
  ringChildren,
  ringAncestor,
  ringDescendants,
  isRingAncestor
} from './hierarchy';
import { nest2ring, ring2nest } from '../schemes/conversion';

describe('nestParent', () => {
  it('parent of pixels 0-3 is 0', () => {
    expect(nestParent(0)).toBe(0);
    expect(nestParent(1)).toBe(0);
    expect(nestParent(2)).toBe(0);
    expect(nestParent(3)).toBe(0);
  });

  it('parent of pixels 4-7 is 1', () => {
    expect(nestParent(4)).toBe(1);
    expect(nestParent(5)).toBe(1);
    expect(nestParent(6)).toBe(1);
    expect(nestParent(7)).toBe(1);
  });

  it('parent of pixel 100 is 25', () => {
    expect(nestParent(100)).toBe(25);
  });
});

describe('nestChildren', () => {
  it('children of pixel 0 are [0, 1, 2, 3]', () => {
    expect(nestChildren(0)).toEqual([0, 1, 2, 3]);
  });

  it('children of pixel 5 are [20, 21, 22, 23]', () => {
    expect(nestChildren(5)).toEqual([20, 21, 22, 23]);
  });

  it('parent of each child is the original pixel', () => {
    const ipix = 42;
    const children = nestChildren(ipix);
    for (const child of children) {
      expect(nestParent(child)).toBe(ipix);
    }
  });
});

describe('nestAncestor', () => {
  it('0 levels up returns the pixel itself', () => {
    expect(nestAncestor(100, 0)).toBe(100);
  });

  it('1 level up is same as nestParent', () => {
    expect(nestAncestor(100, 1)).toBe(nestParent(100));
  });

  it('2 levels up is grandparent', () => {
    expect(nestAncestor(100, 2)).toBe(nestParent(nestParent(100)));
  });
});

describe('nestDescendants', () => {
  it('0 levels returns the pixel itself', () => {
    expect(nestDescendants(5, 0)).toEqual([5]);
  });

  it('1 level returns 4 children', () => {
    const desc = nestDescendants(5, 1);
    expect(desc).toHaveLength(4);
    expect(desc).toEqual([20, 21, 22, 23]);
  });

  it('2 levels returns 16 grandchildren', () => {
    const desc = nestDescendants(0, 2);
    expect(desc).toHaveLength(16);
    // Grandchildren of pixel 0 are 0-15
    for (let i = 0; i < 16; i++) {
      expect(desc[i]).toBe(i);
    }
  });

  it('all descendants at level n have the original as ancestor', () => {
    const ipix = 3;
    const levels = 3;
    const desc = nestDescendants(ipix, levels);
    for (const d of desc) {
      expect(nestAncestor(d, levels)).toBe(ipix);
    }
  });
});

describe('isNestAncestor', () => {
  it('returns true for parent-child relationship', () => {
    // Pixel 0 at nside=1 contains pixel 0 at nside=2
    expect(isNestAncestor(0, 1, 0, 2)).toBe(true);
    expect(isNestAncestor(0, 1, 1, 2)).toBe(true);
    expect(isNestAncestor(0, 1, 2, 2)).toBe(true);
    expect(isNestAncestor(0, 1, 3, 2)).toBe(true);
  });

  it('returns false for non-ancestor', () => {
    // Pixel 1 at nside=1 does NOT contain pixel 0 at nside=2
    expect(isNestAncestor(1, 1, 0, 2)).toBe(false);
  });

  it('returns false when ancestor nside >= descendant nside', () => {
    expect(isNestAncestor(0, 2, 0, 2)).toBe(false);
    expect(isNestAncestor(0, 4, 0, 2)).toBe(false);
  });

  it('returns false when nside ratio is not a power of 2', () => {
    expect(isNestAncestor(0, 1, 0, 3)).toBe(false);
  });

  it('works for multi-level ancestry', () => {
    // Pixel 0 at nside=1 should contain pixel 0 at nside=4
    expect(isNestAncestor(0, 1, 0, 4)).toBe(true);
    expect(isNestAncestor(0, 1, 15, 4)).toBe(true);
    expect(isNestAncestor(0, 1, 16, 4)).toBe(false);
  });
});

describe('ringParent', () => {
  it('each child maps back to its parent', () => {
    const nside = 4;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const parent = ringParent(nside, ipix);
      const parentNpix = 12 * (nside >> 1) * (nside >> 1);
      expect(parent).toBeGreaterThanOrEqual(0);
      expect(parent).toBeLessThan(parentNpix);
    }
  });

  it('is consistent with nested parent via conversion', () => {
    const nside = 4;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const nestIdx = ring2nest(nside, ipix);
      const nestPar = nestParent(nestIdx);
      const expected = nest2ring(nside >> 1, nestPar);
      expect(ringParent(nside, ipix)).toBe(expected);
    }
  });
});

describe('ringChildren', () => {
  it('returns 4 valid children', () => {
    const nside = 2;
    const childNside = 4;
    const childNpix = 12 * childNside * childNside;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const kids = ringChildren(nside, ipix);
      expect(kids).toHaveLength(4);
      for (const k of kids) {
        expect(k).toBeGreaterThanOrEqual(0);
        expect(k).toBeLessThan(childNpix);
      }
    }
  });

  it('children have no duplicates across all pixels', () => {
    const nside = 2;
    const allChildren = new Set<number>();
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      for (const k of ringChildren(nside, ipix)) {
        allChildren.add(k);
      }
    }
    const childNpix = 12 * (nside * 2) * (nside * 2);
    expect(allChildren.size).toBe(childNpix);
  });

  it('parent of each child is the original pixel', () => {
    const nside = 2;
    const childNside = 4;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      for (const k of ringChildren(nside, ipix)) {
        expect(ringParent(childNside, k)).toBe(ipix);
      }
    }
  });
});

describe('ringAncestor', () => {
  it('0 levels returns the pixel itself', () => {
    expect(ringAncestor(4, 10, 0)).toBe(10);
  });

  it('1 level up matches ringParent', () => {
    const nside = 4;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      expect(ringAncestor(nside, ipix, 1)).toBe(ringParent(nside, ipix));
    }
  });

  it('2 levels up matches chained ringParent', () => {
    const nside = 8;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const grandparent = ringParent(nside >> 1, ringParent(nside, ipix));
      expect(ringAncestor(nside, ipix, 2)).toBe(grandparent);
    }
  });
});

describe('ringDescendants', () => {
  it('0 levels returns the pixel itself', () => {
    expect(ringDescendants(2, 5, 0)).toEqual([5]);
  });

  it('1 level returns same as ringChildren', () => {
    const nside = 2;
    const npix = 12 * nside * nside;
    for (let ipix = 0; ipix < npix; ipix++) {
      const desc = ringDescendants(nside, ipix, 1);
      const kids = ringChildren(nside, ipix);
      expect(desc.sort((a, b) => a - b)).toEqual(
        [...kids].sort((a, b) => a - b)
      );
    }
  });

  it('2 levels returns 16 descendants', () => {
    const desc = ringDescendants(1, 0, 2);
    expect(desc).toHaveLength(16);
    const unique = new Set(desc);
    expect(unique.size).toBe(16);
  });

  it('all descendants map back to the original via ringAncestor', () => {
    const nside = 2;
    const levels = 2;
    const descNside = nside << levels;
    for (let ipix = 0; ipix < 12 * nside * nside; ipix++) {
      for (const d of ringDescendants(nside, ipix, levels)) {
        expect(ringAncestor(descNside, d, levels)).toBe(ipix);
      }
    }
  });
});

describe('isRingAncestor', () => {
  it('returns true for parent-child relationship', () => {
    const nside = 2;
    const childNside = 4;
    for (let ipix = 0; ipix < 12 * nside * nside; ipix++) {
      for (const k of ringChildren(nside, ipix)) {
        expect(isRingAncestor(ipix, nside, k, childNside)).toBe(true);
      }
    }
  });

  it('returns false for non-ancestor', () => {
    const parent = ringChildren(1, 0);
    expect(isRingAncestor(parent[0], 2, parent[1], 2)).toBe(false);
  });

  it('returns false when ancestor nside >= descendant nside', () => {
    expect(isRingAncestor(0, 2, 0, 2)).toBe(false);
    expect(isRingAncestor(0, 4, 0, 2)).toBe(false);
  });

  it('returns false when nside ratio is not a power of 2', () => {
    expect(isRingAncestor(0, 1, 0, 3)).toBe(false);
  });

  it('is consistent with isNestAncestor via conversion', () => {
    const ancestorNside = 2;
    const descendantNside = 8;
    for (let a = 0; a < 12 * ancestorNside * ancestorNside; a++) {
      for (let d = 0; d < 12 * descendantNside * descendantNside; d++) {
        const ringResult = isRingAncestor(a, ancestorNside, d, descendantNside);
        const nestA = ring2nest(ancestorNside, a);
        const nestD = ring2nest(descendantNside, d);
        const nestResult = isNestAncestor(nestA, ancestorNside, nestD, descendantNside);
        expect(ringResult).toBe(nestResult);
      }
    }
  });
});
