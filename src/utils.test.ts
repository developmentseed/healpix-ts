import { clip, wrap, square, ilog2, rad2Deg, deg2Rad } from './utils';

describe('rad2Deg', () => {
  it('converts 0 radians to 0 degrees', () => {
    expect(rad2Deg(0)).toBe(0);
  });

  it('converts π radians to 180 degrees', () => {
    expect(rad2Deg(Math.PI)).toBeCloseTo(180);
  });

  it('converts π/2 radians to 90 degrees', () => {
    expect(rad2Deg(Math.PI / 2)).toBeCloseTo(90);
  });

  it('converts 2π radians to 360 degrees', () => {
    expect(rad2Deg(2 * Math.PI)).toBeCloseTo(360);
  });

  it('handles negative values', () => {
    expect(rad2Deg(-Math.PI)).toBeCloseTo(-180);
  });
});

describe('deg2Rad', () => {
  it('converts 0 degrees to 0 radians', () => {
    expect(deg2Rad(0)).toBe(0);
  });

  it('converts 180 degrees to π radians', () => {
    expect(deg2Rad(180)).toBeCloseTo(Math.PI);
  });

  it('converts 90 degrees to π/2 radians', () => {
    expect(deg2Rad(90)).toBeCloseTo(Math.PI / 2);
  });

  it('round-trips with rad2Deg', () => {
    const degrees = 42.5;
    expect(rad2Deg(deg2Rad(degrees))).toBeCloseTo(degrees);
  });
});

describe('square', () => {
  it('squares positive numbers', () => {
    expect(square(3)).toBe(9);
  });

  it('squares negative numbers', () => {
    expect(square(-4)).toBe(16);
  });

  it('squares zero', () => {
    expect(square(0)).toBe(0);
  });

  it('squares fractional numbers', () => {
    expect(square(0.5)).toBeCloseTo(0.25);
  });
});

describe('clip', () => {
  it('returns value when within range', () => {
    expect(clip(5, 0, 10)).toBe(5);
  });

  it('clamps to min when below range', () => {
    expect(clip(-5, 0, 10)).toBe(0);
  });

  it('clamps to max when above range', () => {
    expect(clip(15, 0, 10)).toBe(10);
  });

  it('handles value at boundaries', () => {
    expect(clip(0, 0, 10)).toBe(0);
    expect(clip(10, 0, 10)).toBe(10);
  });
});

describe('wrap', () => {
  it('wraps positive values', () => {
    expect(wrap(5, 3)).toBeCloseTo(2);
  });

  it('returns value when within range', () => {
    expect(wrap(1.5, 3)).toBeCloseTo(1.5);
  });

  it('wraps negative values', () => {
    expect(wrap(-0.5, 2 * Math.PI)).toBeCloseTo(2 * Math.PI - 0.5);
  });

  it('wraps zero', () => {
    expect(wrap(0, 5)).toBe(0);
  });
});

describe('ilog2', () => {
  it('returns 0 for 1', () => {
    expect(ilog2(1)).toBe(0);
  });

  it('returns exact values for powers of 2', () => {
    expect(ilog2(2)).toBe(1);
    expect(ilog2(4)).toBe(2);
    expect(ilog2(8)).toBe(3);
    expect(ilog2(16)).toBe(4);
    expect(ilog2(1024)).toBe(10);
  });

  it('returns floor for non-powers of 2', () => {
    expect(ilog2(3)).toBe(1);
    expect(ilog2(5)).toBe(2);
    expect(ilog2(7)).toBe(2);
  });
});
