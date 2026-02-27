# API Reference

Complete API documentation for the HEALPix TypeScript library.

## Types

### V3
3D vector representing a point on the unit sphere.
```typescript
type V3 = [number, number, number]  // [X, Y, Z]
```

### FXY
Pixel coordinates within the HEALPix grid.
```typescript
type FXY = { f: number, x: number, y: number }
```

### LonLat
Geographic coordinates in degrees.
```typescript
type LonLat = [number, number]  // [longitude, latitude] in degrees
```

### AngularCoords
Spherical angular coordinates.
```typescript
type AngularCoords = { theta: number, phi: number }
```

### OrderPix
Resolution level and pixel index pair.
```typescript
type OrderPix = { order: number, ipix: number }
```

### BBox
Bounding box in geographic coordinates.
```typescript
type BBox = [number, number, number, number]  // [minLon, minLat, maxLon, maxLat] in degrees
```
Note: If minLon > maxLon, the box crosses the antimeridian.

---

## Resolution Functions

### order2nside
Converts order to nside.
```typescript
function order2nside(order: number): number
```

### nside2order
Converts nside to order.
```typescript
function nside2order(nside: number): number
```

### nside2npix
Returns total pixel count.
```typescript
function nside2npix(nside: number): number
```

### nside2pixarea
Returns pixel area in steradians.
```typescript
function nside2pixarea(nside: number): number
```

### nside2resol
Returns pixel resolution in radians.
```typescript
function nside2resol(nside: number): number
```

---

## Position ↔ Pixel Index

### ang2PixNest / ang2PixRing
Angular position to pixel index.
```typescript
function ang2PixNest(nside: number, theta: number, phi: number): number
function ang2PixRing(nside: number, theta: number, phi: number): number
```
- `theta`: Colatitude [0, π]
- `phi`: Longitude [0, 2π)

### pix2AngNest / pix2AngRing
Pixel index to angular position (center).
```typescript
function pix2AngNest(nside: number, ipix: number): AngularCoords
function pix2AngRing(nside: number, ipix: number): AngularCoords
```

### vec2PixNest / vec2PixRing
3D vector to pixel index.
```typescript
function vec2PixNest(nside: number, v: V3): number
function vec2PixRing(nside: number, v: V3): number
```

### pix2VecNest / pix2VecRing
Pixel index to 3D vector (center).
```typescript
function pix2VecNest(nside: number, ipix: number): V3
function pix2VecRing(nside: number, ipix: number): V3
```

---

## Geographic Coordinates

### lonLat2PixNest / lonLat2PixRing
Longitude/latitude to pixel index.
```typescript
function lonLat2PixNest(nside: number, lon: number, lat: number): number
function lonLat2PixRing(nside: number, lon: number, lat: number): number
```
- `lon`: Longitude in degrees [-180, 180]
- `lat`: Latitude in degrees [-90, 90]

### pix2LonLatNest / pix2LonLatRing
Pixel index to latitude/longitude (center).
```typescript
function pix2LonLatNest(nside: number, ipix: number): LonLat
function pix2LonLatRing(nside: number, ipix: number): LonLat
```

### vec2LonLat
3D vector to latitude/longitude.
```typescript
function vec2LonLat(v: V3): LonLat
```

---

## Scheme Conversion

### nest2ring
NESTED to RING index.
```typescript
function nest2ring(nside: number, ipix: number): number
```

### ring2nest
RING to NESTED index.
```typescript
function ring2nest(nside: number, ipix: number): number
```

### orderpix2uniq
Pack (order, ipix) into UNIQ format.
```typescript
function orderpix2uniq(order: number, ipix: number): number
```

### uniq2orderpix
Unpack UNIQ to (order, ipix).
```typescript
function uniq2orderpix(uniq: number): OrderPix
```

---

## Pixel Geometry

### cornersNest / cornersRing
Get 4 corner vertices.
```typescript
function cornersNest(nside: number, ipix: number): V3[]
function cornersRing(nside: number, ipix: number): V3[]
```
Returns: `[north, west, south, east]` corners

### cornersNestLonLat / cornersRingLonLat
Get 4 corners in lat/lon.
```typescript
function cornersNestLonLat(nside: number, ipix: number): LonLat[]
function cornersRingLonLat(nside: number, ipix: number): LonLat[]
```

### pixcoord2VecNest / pixcoord2VecRing
Get 3D vector for sub-pixel position.
```typescript
function pixcoord2VecNest(nside: number, ipix: number, ne: number, nw: number): V3
function pixcoord2VecRing(nside: number, ipix: number, ne: number, nw: number): V3
```
- `ne`: Fractional NE offset [0, 1]
- `nw`: Fractional NW offset [0, 1]
- `(0.5, 0.5)` = pixel center

### maxPixelRadius
Maximum angular radius of a pixel.
```typescript
function maxPixelRadius(nside: number): number
```

---

## Hierarchical Operations

### nestParent
Get parent pixel index.
```typescript
function nestParent(ipix: number): number
```

### nestChildren
Get 4 child pixel indices.
```typescript
function nestChildren(ipix: number): [number, number, number, number]
```

### nestAncestor
Get ancestor at specific level.
```typescript
function nestAncestor(ipix: number, levels: number): number
```

### nestDescendants
Get all descendants at specific depth.
```typescript
function nestDescendants(ipix: number, levels: number): number[]
```

### isNestAncestor
Check if one pixel is an ancestor of another.
```typescript
function isNestAncestor(ancestor: number, ancestorNside: number, descendant: number, descendantNside: number): boolean
```

### uniqParent
Get parent in UNIQ scheme.
```typescript
function uniqParent(uniq: number): number
```

### uniqChildren
Get 4 children in UNIQ scheme.
```typescript
function uniqChildren(uniq: number): [number, number, number, number]
```

---

## Spatial Queries

### queryDiscInclusiveNest / queryDiscInclusiveRing
Find all pixels overlapping a disc.
```typescript
function queryDiscInclusiveNest(
  nside: number,
  center: V3,
  radius: number,
  callback: (ipix: number) => void
): void
```
- `center`: Unit vector at disc center
- `radius`: Disc radius in radians (must be < π/2)
- `callback`: Called for each overlapping pixel

### queryBoxInclusiveNest / queryBoxInclusiveRing
Find all pixels overlapping a bounding box.
```typescript
function queryBoxInclusiveNest(nside: number, bbox: BBox): number[]
function queryBoxInclusiveRing(nside: number, bbox: BBox): number[]
```
- `bbox`: Bounding box as [minLon, minLat, maxLon, maxLat] in degrees
- Handles antimeridian crossing (when minLon > maxLon)

---

## Coordinate Transformations

### vec2za / za2vec
3D vector ↔ (z, a) coordinates.
```typescript
function vec2za(X: number, Y: number, z: number): ZA
function za2vec(z: number, a: number): V3
```

### ang2vec / vec2ang
Angular ↔ 3D vector.
```typescript
function ang2vec(theta: number, phi: number): V3
function vec2ang(v: V3): AngularCoords
```

### za2tu / tu2za
Spherical ↔ HEALPix projection.
```typescript
function za2tu(z: number, a: number): TU
function tu2za(t: number, u: number): ZA
```

### tu2fxy / fxy2tu
Projection ↔ pixel coordinates.
```typescript
function tu2fxy(nside: number, t: number, u: number): FXY
function fxy2tu(nside: number, f: number, x: number, y: number): TU
```

### fxy2nest / nest2fxy
Pixel coordinates ↔ NESTED index.
```typescript
function fxy2nest(nside: number, f: number, x: number, y: number): number
function nest2fxy(nside: number, ipix: number): FXY
```

### fxy2ring / ring2fxy
Pixel coordinates ↔ RING index.
```typescript
function fxy2ring(nside: number, f: number, x: number, y: number): number
function ring2fxy(nside: number, ipix: number): FXY
```

---

## Bit Operations

### bitCombine
Interleave bits (Morton code).
```typescript
function bitCombine(x: number, y: number): number
```

### bitDecombine
De-interleave bits.
```typescript
function bitDecombine(p: number): { x: number, y: number }
```

---

## Utility Functions

### angularDistance
Angular distance between two vectors.
```typescript
function angularDistance(a: V3, b: V3): number
```

### clip
Clamp value to range.
```typescript
function clip(value: number, min: number, max: number): number
```

### wrap
Wrap value to range [0, period).
```typescript
function wrap(value: number, period: number): number
```

---

## Constants

```typescript
const PI2 = 2 * Math.PI    // 2π
const PI = Math.PI         // π
const PI_2 = Math.PI / 2   // π/2
const PI_4 = Math.PI / 4   // π/4
const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI
```
