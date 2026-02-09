import {
  pix2LonLatNest,
  pix2LonLatRing,
  lonLat2PixNest,
  lonLat2PixRing,
  cornersNestLonLat,
  cornersRingLonLat,
  vec2LonLat
} from './latlon';
import { V3 } from '../types';
import { nest2ring } from '../schemes/conversion';

describe('pix2LonLatNest / lonLat2PixNest round-trip', () => {
  const nside = 64;

  it('pixel center maps back to same pixel', () => {
    for (let ipix = 0; ipix < 200; ipix++) {
      const [lon, lat] = pix2LonLatNest(nside, ipix);
      const recovered = lonLat2PixNest(nside, lon, lat);
      expect(recovered).toBe(ipix);
    }
  });

  it('longitude is in [-180, 180]', () => {
    for (let ipix = 0; ipix < 100; ipix++) {
      const [lon] = pix2LonLatNest(nside, ipix);
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
    }
  });

  it('latitude is in [-90, 90]', () => {
    for (let ipix = 0; ipix < 100; ipix++) {
      const [, lat] = pix2LonLatNest(nside, ipix);
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    }
  });
});

describe('ring scheme lon/lat', () => {
  const nside = 32;

  it('pix2LonLatRing round-trips', () => {
    for (let ipix = 0; ipix < 100; ipix++) {
      const [lon, lat] = pix2LonLatRing(nside, ipix);
      const recovered = lonLat2PixRing(nside, lon, lat);
      expect(recovered).toBe(ipix);
    }
  });
});

describe('known geographic positions', () => {
  const nside = 256;

  it('north pole (lat=90) maps to a north cap pixel', () => {
    const ipix = lonLat2PixNest(nside, 0, 90);
    // At nside=256, pixel 0 is in north cap (f=0)
    expect(ipix).toBeLessThan(nside * nside * 4); // First 4 base pixels
  });

  it('south pole (lat=-90) maps to a south cap pixel', () => {
    const ipix = lonLat2PixNest(nside, 0, -90);
    expect(ipix).toBeGreaterThanOrEqual(nside * nside * 8); // Last 4 base pixels
  });

  it('equator (lat=0) maps near expected region', () => {
    const ipix = lonLat2PixNest(nside, 0, 0);
    const [, lat] = pix2LonLatNest(nside, ipix);
    expect(Math.abs(lat)).toBeLessThan(5); // Should be near equator
  });
});

describe('cornersNestLonLat / cornersRingLonLat', () => {
  const nside = 16;

  it('returns 4 corners in lon/lat', () => {
    expect(cornersNestLonLat(nside, 0)).toHaveLength(4);
    expect(cornersRingLonLat(nside, 0)).toHaveLength(4);
  });

  it('corner latitudes are in valid range', () => {
    const corners = cornersNestLonLat(nside, 42);
    for (const [, lat] of corners) {
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    }
  });

  it('non-dateline pixels have lon in [-180, 180]', () => {
    const corners = cornersNestLonLat(nside, 42);
    for (const [lon] of corners) {
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
    }
  });

  it('corners form a continuous polygon (no wrapping) for dateline pixels', () => {
    // These pixels are centered at lon=180° and straddle the antimeridian
    for (const ipix of [1587, 1584, 1551]) {
      const corners = cornersNestLonLat(16, ipix);
      const lons = corners.map(([lon]) => lon);
      const span = Math.max(...lons) - Math.min(...lons);
      // Span should be small (a few degrees), not ~360°
      expect(span).toBeLessThan(30);
    }
  });

  it('dateline pixels have unwrapped lon > 180', () => {
    // ipix 1587 at nside=16 has center at lon=180, east corner crosses dateline
    const corners = cornersNestLonLat(16, 1587);
    const lons = corners.map(([lon]) => lon);
    // The east corner (index 3) should be unwrapped past 180
    expect(Math.max(...lons)).toBeGreaterThan(180);
  });

  it('cornersRingLonLat also unwraps dateline polygons', () => {
    const ringIpix = nest2ring(16, 1587);
    const corners = cornersRingLonLat(16, ringIpix);
    const lons = corners.map(([lon]: [number, number]) => lon);
    const span = Math.max(...lons) - Math.min(...lons);
    expect(span).toBeLessThan(30);
  });
});

describe('vec2LonLat', () => {
  it('north pole returns lat=90', () => {
    const v: V3 = [0, 0, 1];
    const [, lat] = vec2LonLat(v);
    expect(lat).toBeCloseTo(90);
  });

  it('south pole returns lat=-90', () => {
    const v: V3 = [0, 0, -1];
    const [, lat] = vec2LonLat(v);
    expect(lat).toBeCloseTo(-90);
  });

  it('positive X-axis returns lon=0, lat=0', () => {
    const v: V3 = [1, 0, 0];
    const [lon, lat] = vec2LonLat(v);
    expect(lon).toBeCloseTo(0);
    expect(lat).toBeCloseTo(0);
  });

  it('positive Y-axis returns lon=90, lat=0', () => {
    const v: V3 = [0, 1, 0];
    const [lon, lat] = vec2LonLat(v);
    expect(lon).toBeCloseTo(90);
    expect(lat).toBeCloseTo(0);
  });
});
