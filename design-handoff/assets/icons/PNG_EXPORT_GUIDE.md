# PNG Export Guide for Category Icons

## Overview
This guide provides instructions for generating PNG assets from SVG source files at multiple resolutions for React Native compatibility.

---

## Export Specifications

### Sizes
- **24px icons**: Export at 24, 48, 72 pixels
- **20px icons**: Export at 20, 40, 60 pixels

### Resolutions
- **@1x**: Base size (24px or 20px)
- **@2x**: 2× base size (48px or 40px)
- **@3x**: 3× base size (72px or 60px)

### Format
- **Format**: PNG
- **Color mode**: RGBA
- **Background**: Transparent
- **Color**: Export with `currentColor` preserved as black (#000000) - will be tinted at runtime

---

## Export Methods

### Method 1: Using svg2png (Command Line)

```bash
# Install svg2png
npm install -g svg2png

# Export 24px icons
svg2png icon-category-nails-outline-24.svg --width 24 --height 24 --output icon-category-nails-outline-24@1x.png
svg2png icon-category-nails-outline-24.svg --width 48 --height 48 --output icon-category-nails-outline-24@2x.png
svg2png icon-category-nails-outline-24.svg --width 72 --height 72 --output icon-category-nails-outline-24@3x.png

# Export 20px icons
svg2png icon-category-nails-outline-20.svg --width 20 --height 20 --output icon-category-nails-outline-20@1x.png
svg2png icon-category-nails-outline-20.svg --width 40 --height 40 --output icon-category-nails-outline-20@2x.png
svg2png icon-category-nails-outline-20.svg --width 60 --height 60 --output icon-category-nails-outline-20@3x.png
```

### Method 2: Using Figma

1. Import SVG to Figma
2. Select the icon frame
3. Export settings:
   - **24px icons**: Export as PNG at 1x, 2x, 3x (24px, 48px, 72px)
   - **20px icons**: Export as PNG at 1x, 2x, 3x (20px, 40px, 60px)
4. Name files: `icon-category-{name}-outline-{size}@{scale}x.png`

### Method 3: Using Sketch

1. Import SVG to Sketch
2. Select artboard
3. Export settings:
   - Add export preset: PNG @1x, @2x, @3x
   - Ensure transparent background
4. Export all sizes

### Method 4: Automated Batch Export Script

```bash
#!/bin/bash
# batch-export-icons.sh

SIZES=(24 20)

for svg_file in icon-category-*-outline-*.svg; do
  # Extract base name without extension
  base_name="${svg_file%.svg}"
  
  # Extract size from filename (24 or 20)
  if [[ $base_name == *"24"* ]]; then
    size=24
    scales=(24 48 72)
    names=("@1x" "@2x" "@3x")
  else
    size=20
    scales=(20 40 60)
    names=("@1x" "@2x" "@3x")
  fi
  
  # Export each scale
  for i in {0..2}; do
    output="${base_name}${names[$i]}.png"
    svg2png "$svg_file" --width ${scales[$i]} --height ${scales[$i]} --output "$output"
    echo "Exported: $output"
  done
done
```

---

## File Naming Convention

### Pattern
```
icon-category-{category}-outline-{size}@{scale}x.png
```

### Examples
```
icon-category-nails-outline-24@1x.png   (24×24 px)
icon-category-nails-outline-24@2x.png   (48×48 px)
icon-category-nails-outline-24@3x.png   (72×72 px)
icon-category-nails-outline-20@1x.png   (20×20 px)
icon-category-nails-outline-20@2x.png   (40×40 px)
icon-category-nails-outline-20@3x.png   (60×60 px)
```

---

## Complete Export List

### All 12 Categories × 2 Sizes × 3 Scales = 72 PNG files

#### Nails (6 files)
- icon-category-nails-outline-24@1x.png, @2x.png, @3x.png
- icon-category-nails-outline-20@1x.png, @2x.png, @3x.png

#### Hair (6 files)
- icon-category-hair-outline-24@1x.png, @2x.png, @3x.png
- icon-category-hair-outline-20@1x.png, @2x.png, @3x.png

#### Skin (6 files)
- icon-category-skin-outline-24@1x.png, @2x.png, @3x.png
- icon-category-skin-outline-20@1x.png, @2x.png, @3x.png

#### Lashes (6 files)
- icon-category-lashes-outline-24@1x.png, @2x.png, @3x.png
- icon-category-lashes-outline-20@1x.png, @2x.png, @3x.png

#### Brows (6 files)
- icon-category-brows-outline-24@1x.png, @2x.png, @3x.png
- icon-category-brows-outline-20@1x.png, @2x.png, @3x.png

#### Massage (6 files)
- icon-category-massage-outline-24@1x.png, @2x.png, @3x.png
- icon-category-massage-outline-20@1x.png, @2x.png, @3x.png

#### Makeup (6 files)
- icon-category-makeup-outline-24@1x.png, @2x.png, @3x.png
- icon-category-makeup-outline-20@1x.png, @2x.png, @3x.png

#### Barber (6 files)
- icon-category-barber-outline-24@1x.png, @2x.png, @3x.png
- icon-category-barber-outline-20@1x.png, @2x.png, @3x.png

#### Waxing (6 files)
- icon-category-waxing-outline-24@1x.png, @2x.png, @3x.png
- icon-category-waxing-outline-20@1x.png, @2x.png, @3x.png

#### Spa (6 files)
- icon-category-spa-outline-24@1x.png, @2x.png, @3x.png
- icon-category-spa-outline-20@1x.png, @2x.png, @3x.png

#### Injectables (6 files)
- icon-category-injectables-outline-24@1x.png, @2x.png, @3x.png
- icon-category-injectables-outline-20@1x.png, @2x.png, @3x.png

#### Wellness (6 files)
- icon-category-wellness-outline-24@1x.png, @2x.png, @3x.png
- icon-category-wellness-outline-20@1x.png, @2x.png, @3x.png

---

## React Native Usage

### With react-native-svg (Recommended)
```javascript
import NailsIcon from './assets/icons/icon-category-nails-outline-24.svg';

// SVG will automatically select correct resolution
<NailsIcon 
  color="#E3A9A0"  // Active state
  width={24} 
  height={24} 
/>
```

### With PNG Assets
```javascript
import { Image } from 'react-native';

// React Native automatically selects @2x or @3x based on device
<Image 
  source={require('./assets/icons/icon-category-nails-outline-24.png')}
  style={{ 
    width: 24, 
    height: 24,
    tintColor: '#E3A9A0' // Active state
  }}
/>
```

---

## Color States

Icons use `currentColor` in SVG which should be exported as black (#000000) in PNG, then tinted at runtime:

- **Inactive**: `tintColor: '#6B6B6B'` (text-muted)
- **Active**: `tintColor: '#E3A9A0'` (primary)
- **Disabled**: `tintColor: '#B0B0B0'` with `opacity: 0.6`

---

## Quality Checklist

Before exporting, verify:
- [ ] All SVG files are present (24 files: 12 categories × 2 sizes)
- [ ] ViewBox is correct (24×24 or 20×20)
- [ ] Stroke width is consistent (1.5 for 24px, 1.25 for 20px)
- [ ] `currentColor` is used for stroke
- [ ] Background is transparent
- [ ] Export at exact pixel dimensions (no scaling artifacts)
- [ ] File naming follows convention
- [ ] PNG files are optimized (use imageoptim or similar)

---

## Optimization (Optional)

After export, optimize PNGs to reduce file size:

```bash
# Using imageoptim-cli
npm install -g imageoptim-cli
imageoptim icon-category-*.png

# Or using pngquant
pngquant --quality=85-95 icon-category-*.png
```

---

## Deliverables

After export, you should have:
- **24 SVG files** (source)
- **72 PNG files** (@1x, @2x, @3x for each SVG)
- **Total**: 96 icon files

Place all PNG files in the same directory as SVG files:
```
design-handoff/assets/icons/
```

---

**Note**: SVG is preferred for React Native apps as it scales perfectly and allows runtime color tinting. PNGs are provided as fallback for compatibility or performance requirements.
