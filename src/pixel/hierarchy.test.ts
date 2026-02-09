import {
  nestParent,
  nestChildren,
  nestAncestor,
  nestDescendants,
  isAncestor
} from './hierarchy';

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

describe('isAncestor', () => {
  it('returns true for parent-child relationship', () => {
    // Pixel 0 at nside=1 contains pixel 0 at nside=2
    expect(isAncestor(0, 1, 0, 2)).toBe(true);
    expect(isAncestor(0, 1, 1, 2)).toBe(true);
    expect(isAncestor(0, 1, 2, 2)).toBe(true);
    expect(isAncestor(0, 1, 3, 2)).toBe(true);
  });

  it('returns false for non-ancestor', () => {
    // Pixel 1 at nside=1 does NOT contain pixel 0 at nside=2
    expect(isAncestor(1, 1, 0, 2)).toBe(false);
  });

  it('returns false when ancestor nside >= descendant nside', () => {
    expect(isAncestor(0, 2, 0, 2)).toBe(false);
    expect(isAncestor(0, 4, 0, 2)).toBe(false);
  });

  it('returns false when nside ratio is not a power of 2', () => {
    expect(isAncestor(0, 1, 0, 3)).toBe(false);
  });

  it('works for multi-level ancestry', () => {
    // Pixel 0 at nside=1 should contain pixel 0 at nside=4
    expect(isAncestor(0, 1, 0, 4)).toBe(true);
    expect(isAncestor(0, 1, 15, 4)).toBe(true);
    expect(isAncestor(0, 1, 16, 4)).toBe(false);
  });
});
