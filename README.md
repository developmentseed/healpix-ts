# HEALPix TypeScript

A complete TypeScript implementation of the **HEALPix** (Hierarchical Equal Area isoLatitude Pixelization) spherical projection system.

Based on [Górski et al. (2005)](http://iopscience.iop.org/article/10.1086/427976/pdf)

## What is HEALPix?

HEALPix is a scheme for dividing a sphere into pixels with three key properties:

1. **Equal Area**: Every pixel has exactly the same area (important for statistical analysis)
2. **Hierarchical**: Pixels can be subdivided into 4 children (enables multi-resolution)
3. **Iso-Latitude**: Pixel centers lie on rings of constant latitude (enables fast spherical harmonics)

HEALPix is widely used in astronomy (CMB analysis, sky surveys) and geospatial applications.

## Installation

```bash
npm install healpix-ts
```

## Quick Start

```typescript
import { 
  order2nside,
  ang2PixNest, 
  pix2AngNest,
  pix2LonLatNest,
  cornersNestLonLat
} from 'healpix-ts'

// Resolution: order 8 = nside 256 = 786,432 pixels
const nside = order2nside(8)

// Convert position to pixel index
const theta = Math.PI / 4  // 45° from north pole
const phi = Math.PI / 2    // 90° longitude
const ipix = ang2PixNest(nside, theta, phi)

// Get pixel center in lat/lon
const [lon, lat] = pix2LonLatNest(nside, ipix)
console.log(`Pixel ${ipix}: lat=${lat.toFixed(2)}°, lon=${lon.toFixed(2)}°`)

// Get pixel corners
const corners = cornersNestLonLat(nside, ipix)
console.log('Corners:', corners)
```

## Resolution Levels

| Order | Nside | Total Pixels | Pixel Size (deg²) | Approx. Resolution |
|-------|-------|--------------|-------------------|-------------------|
| 0     | 1     | 12           | 3437.75           | 58.6°            |
| 1     | 2     | 48           | 859.44            | 29.3°            |
| 2     | 4     | 192          | 214.86            | 14.7°            |
| 3     | 8     | 768          | 53.72             | 7.3°             |
| 4     | 16    | 3,072        | 13.43             | 3.7°             |
| 8     | 256   | 786,432      | 0.052             | 13.7'            |
| 10    | 1024  | 12,582,912   | 0.003             | 3.4'             |

## Numbering Schemes

### NESTED Scheme
- Preserves spatial locality (nearby pixels have nearby indices)
- Efficient for hierarchical operations
- Parent pixel: `ipix >> 2`
- Children pixels: `[4*ipix, 4*ipix+1, 4*ipix+2, 4*ipix+3]`

### RING Scheme
- Pixels numbered along iso-latitude rings
- Optimal for spherical harmonic transforms

### UNIQ Scheme
- Packs (order, ipix) into a single integer
- Used for multi-resolution coverage maps (MOC)

## API Reference

### Resolution Functions

```typescript
order2nside(order: number): number          // order → nside
nside2order(nside: number): number          // nside → order
nside2npix(nside: number): number           // total pixel count
nside2pixarea(nside: number): number        // pixel area in steradians
nside2resol(nside: number): number          // pixel size in radians
```

### Position ↔ Pixel Index

```typescript
// Angular coordinates (theta, phi) ↔ pixel index
ang2PixNest(nside, theta, phi): number
ang2PixRing(nside, theta, phi): number
pix2AngNest(nside, ipix): { theta, phi }
pix2AngRing(nside, ipix): { theta, phi }

// 3D vector ↔ pixel index
vec2PixNest(nside, [x, y, z]): number
vec2PixRing(nside, [x, y, z]): number
pix2VecNest(nside, ipix): [x, y, z]
pix2VecRing(nside, ipix): [x, y, z]

// Lat/lon ↔ pixel index
lonLat2PixNest(nside, lon, lat): number
lonLat2PixRing(nside, lon, lat): number
pix2LonLatNest(nside, ipix): [lon, lat]
pix2LonLatRing(nside, ipix): [lon, lat]
```

### Scheme Conversion

```typescript
nest2ring(nside, ipix): number    // NESTED → RING
ring2nest(nside, ipix): number    // RING → NESTED
orderpix2uniq(order, ipix): number   // (order, ipix) → UNIQ
uniq2orderpix(uniq): { order, ipix } // UNIQ → (order, ipix)
```

### Pixel Geometry

```typescript
cornersNest(nside, ipix): V3[]           // 4 corner vertices
cornersRing(nside, ipix): V3[]
cornersNestLonLat(nside, ipix): LonLat[]
cornersRingLonLat(nside, ipix): LonLat[]
pixcoord2VecNest(nside, ipix, ne, nw): V3  // sub-pixel position
pixcoord2VecRing(nside, ipix, ne, nw): V3
maxPixelRadius(nside): number              // max angular radius
```

### Hierarchical Operations

```typescript
nestParent(ipix): number                   // parent pixel
nestChildren(ipix): [n, n, n, n]           // 4 children
nestAncestor(ipix, levels): number         // ancestor at level
nestDescendants(ipix, levels): number[]    // all descendants
isAncestor(ancestor, ancestorNside, descendant, descendantNside): boolean
uniqParent(uniq): number
uniqChildren(uniq): [n, n, n, n]
```

### Spatial Queries

```typescript
queryDiscInclusiveNest(nside, center, radius, callback): void
queryDiscInclusiveRing(nside, center, radius, callback): void
queryBoxInclusiveNest(nside, bbox): number[]
queryBoxInclusiveRing(nside, bbox): number[]
```

## Coordinate Systems

```
3D Vector (X,Y,Z)  ↔  Spherical (z,a)  ↔  Projection (t,u)  ↔  Pixel (f,x,y)  ↔  Index
```

- **3D Cartesian (X, Y, Z)**: Unit sphere, Z = north pole
- **Spherical (z, a)**: z = cos(colatitude), a = azimuth
- **Angular (theta, phi)**: theta = colatitude, phi = longitude
- **Lat/Lon (lat, lon)**: Geographic coordinates in degrees
- **Projection (t, u)**: HEALPix 2D projection
- **Pixel (f, x, y)**: Base pixel + local coordinates
- **Index**: NESTED, RING, or UNIQ

## File Structure

```
src/
├── index.ts           # Main entry point
├── types.ts           # Type definitions
├── constants.ts       # Mathematical constants
├── utils.ts           # Utility functions
├── resolution.ts      # Resolution conversions
├── coordinates/       # Coordinate transformations
│   ├── spherical.ts   # 3D ↔ spherical
│   └── projection.ts  # HEALPix projection
├── pixel/             # Pixel operations
│   ├── fxy.ts         # (f,x,y) coordinates
│   ├── geometry.ts    # Corners, sub-pixel positions
│   └── hierarchy.ts   # Parent/child relationships
├── schemes/           # Numbering schemes
│   ├── nested.ts      # NESTED scheme
│   ├── ring.ts        # RING scheme
│   ├── uniq.ts        # UNIQ scheme
│   └── conversion.ts  # Scheme conversions
├── lookup/            # High-level lookup functions
│   └── lookup.ts      # pix2ang, ang2pix, etc.
├── query/             # Spatial queries
│   ├── disc.ts        # Disc queries
│   └── box.ts         # Bounding box queries
└── geo/               # Geographic utilities
    └── latlon.ts      # Lat/lon conversions
```

## References

- [HEALPix Official Website](https://healpix.sourceforge.io/)
- [HEALPix Paper (Górski et al. 2005)](http://iopscience.iop.org/article/10.1086/427976/pdf)
- [HEALPix Documentation](https://healpix.sourceforge.io/html/intro.htm)

## License

MIT
