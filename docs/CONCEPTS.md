# HEALPix Concepts

This document explains the key concepts behind the HEALPix spherical pixelization scheme.

## Overview

**HEALPix** stands for **H**ierarchical **E**qual **A**rea iso**L**atitude **Pix**elization. It's a method for dividing a sphere into pixels with three crucial properties:

1. **Equal Area**: Every pixel has the same area
2. **Hierarchical**: Pixels can be recursively subdivided
3. **Iso-Latitude**: Pixel centers lie on rings of constant latitude

## The 12 Base Pixels

At the coarsest resolution (order 0, nside 1), the sphere is divided into 12 base pixels:

```
        ┌───────┐
       /  0   1  \      North Polar Cap
      /  2   3    \     (base pixels 0-3)
     ├─────────────┤
     │ 4   5   6  7│    Equatorial Belt
     │             │    (base pixels 4-7)
     ├─────────────┤
      \  8   9    /     South Polar Cap
       \ 10  11  /      (base pixels 8-11)
        └───────┘
```

Each base pixel is a curvilinear quadrilateral (diamond-shaped when projected).

## Resolution Levels

Resolution is controlled by two equivalent parameters:

- **order**: Resolution level (0, 1, 2, 3, ...)
- **nside**: Number of pixel divisions per base pixel edge = 2^order

| Order | Nside | Total Pixels | Formula |
|-------|-------|--------------|---------|
| 0     | 1     | 12           | 12 × 1² |
| 1     | 2     | 48           | 12 × 2² |
| 2     | 4     | 192          | 12 × 4² |
| k     | 2^k   | 12 × 4^k     | 12 × nside² |

## The Equal Area Property

Every HEALPix pixel has exactly the same area:

```
pixel_area = 4π / (12 × nside²) = π / (3 × nside²) steradians
```

This is achieved through a clever projection that:
- Uses a cylindrical projection in the equatorial belt (|latitude| < 41.8°)
- Uses a specially designed polar cap projection near the poles

## The Hierarchical Property

Each pixel can be subdivided into exactly 4 children, enabling:
- Multi-resolution data storage
- Efficient spatial indexing
- Progressive refinement algorithms

```
Parent pixel at nside=N
┌─────────┐
│         │      Becomes 4 children at nside=2N
│   P     │  →   ┌────┬────┐
│         │      │ C0 │ C1 │
└─────────┘      ├────┼────┤
                 │ C2 │ C3 │
                 └────┴────┘
```

In the NESTED scheme:
- Parent index: `ipix >> 2`
- Children indices: `[4*ipix, 4*ipix+1, 4*ipix+2, 4*ipix+3]`

## The Iso-Latitude Property

Pixel centers are arranged on rings of constant latitude:
- This enables efficient spherical harmonic transforms (using FFT)
- The number of pixels per ring varies:
  - Polar caps: 4i pixels in ring i (i = 1 to nside-1)
  - Equatorial belt: 4×nside pixels per ring

## Coordinate Systems

HEALPix uses several coordinate systems, connected by transformations:

### 1. 3D Cartesian (X, Y, Z)
Standard unit sphere coordinates:
- X = sin(θ)cos(φ)
- Y = sin(θ)sin(φ)
- Z = cos(θ)

### 2. Spherical (z, a)
Optimized for HEALPix calculations:
- z = cos(colatitude) ∈ [-1, 1]
- a = azimuth ∈ [0, 2π)

### 3. Angular (theta, phi)
Standard spherical coordinates:
- theta (θ) = colatitude ∈ [0, π], where 0 = north pole
- phi (φ) = longitude ∈ [0, 2π)

### 4. Projection (t, u)
HEALPix 2D projection:
- t = longitude-like coordinate ∈ [0, 2π)
- u = latitude-like coordinate ∈ [-π/2, π/2]

### 5. Pixel (f, x, y)
Discrete pixel coordinates:
- f = base pixel index ∈ {0..11}
- x = north-east index ∈ [0, nside)
- y = north-west index ∈ [0, nside)

### Transformation Chain

```
(X,Y,Z) ↔ (z,a) ↔ (θ,φ) ↔ (t,u) ↔ (f,x,y) ↔ ipix
```

## Numbering Schemes

### NESTED Scheme
- Uses bit-interleaving (Morton code / Z-order curve)
- Preserves spatial locality
- Efficient for hierarchical operations
- **Best for**: Tree traversal, neighbor finding, multi-resolution

### RING Scheme
- Pixels numbered along iso-latitude rings
- Sequential numbering from north to south
- **Best for**: Spherical harmonic transforms (FFT along rings)

### UNIQ Scheme
- Packs (order, ipix_nested) into a single integer
- Formula: `uniq = 4 × (4^order - 1) + ipix`
- **Best for**: Multi-Order Coverage maps (MOC)

## The HEALPix Projection

### Equatorial Belt (|z| ≤ 2/3)
Simple cylindrical equal-area projection:
```
t = a
u = (3π/8) × z
```

### Polar Caps (|z| > 2/3)
Modified projection to handle the polar singularity:
```
σ(z) = 2 - √(3(1-z))  for z ≥ 0
t = a - (|σ| - 1) × (a mod π/2 - π/4)
u = (π/4) × σ
```

The sigma function ensures equal-area preservation in the polar caps.

## Morton Code (Z-order Curve)

The NESTED scheme uses bit-interleaving to map 2D (x, y) coordinates to 1D indices:

```
x = ...x₂x₁x₀  (binary)
y = ...y₂y₁y₀  (binary)
       ↓
index = ...y₂x₂y₁x₁y₀x₀  (interleaved)
```

This preserves locality: nearby pixels in 2D have nearby 1D indices.

Key property for hierarchy:
```
bit_combine(2x, 2y) = 4 × bit_combine(x, y)
```

## Applications

1. **Cosmic Microwave Background (CMB) Analysis**
   - WMAP and Planck missions use HEALPix
   
2. **Astronomical Sky Surveys**
   - Efficient storage and querying of all-sky data
   
3. **Geospatial Applications**
   - Global data tiling
   - Multi-resolution terrain
   
4. **Spherical Harmonic Transforms**
   - Fast transforms using the iso-latitude property

## References

- [Górski, K.M. et al. (2005)](http://iopscience.iop.org/article/10.1086/427976/pdf) - Original HEALPix paper
- [HEALPix Website](https://healpix.sourceforge.io/) - Official documentation
- [IVOA MOC Standard](http://ivoa.net/documents/MOC/) - Multi-Order Coverage specification
