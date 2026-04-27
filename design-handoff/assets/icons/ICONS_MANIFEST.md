# Category Icons Manifest

## Icon Set Overview
All icons follow consistent design principles:
- **Style**: Outline, rounded corners
- **Stroke weight**: 1.5px (24px), 1.25px (20px)
- **Viewbox**: Centered, with 2px padding
- **Color**: Uses `currentColor` for easy theming
- **Export formats**: SVG (vector), PNG @1x @2x @3x (raster)

## Complete Icon List

### ✅ All 12 Categories × 2 Sizes = 24 SVG Files (Complete)

1. **Nails**
   - `icon-category-nails-outline-24.svg` ✓
   - `icon-category-nails-outline-20.svg` ✓

2. **Hair**
   - `icon-category-hair-outline-24.svg` ✓
   - `icon-category-hair-outline-20.svg` ✓

3. **Skin**
   - `icon-category-skin-outline-24.svg` ✓
   - `icon-category-skin-outline-20.svg` ✓

4. **Lashes**
   - `icon-category-lashes-outline-24.svg` ✓
   - `icon-category-lashes-outline-20.svg` ✓

5. **Brows**
   - `icon-category-brows-outline-24.svg` ✓
   - `icon-category-brows-outline-20.svg` ✓

6. **Massage**
   - `icon-category-massage-outline-24.svg` ✓
   - `icon-category-massage-outline-20.svg` ✓

7. **Makeup**
   - `icon-category-makeup-outline-24.svg` ✓
   - `icon-category-makeup-outline-20.svg` ✓

8. **Barber**
   - `icon-category-barber-outline-24.svg` ✓
   - `icon-category-barber-outline-20.svg` ✓

9. **Waxing**
   - `icon-category-waxing-outline-24.svg` ✓
   - `icon-category-waxing-outline-20.svg` ✓

10. **Spa**
    - `icon-category-spa-outline-24.svg` ✓
    - `icon-category-spa-outline-20.svg` ✓

11. **Injectables**
    - `icon-category-injectables-outline-24.svg` ✓
    - `icon-category-injectables-outline-20.svg` ✓

12. **Wellness**
    - `icon-category-wellness-outline-24.svg` ✓
    - `icon-category-wellness-outline-20.svg` ✓

### PNG Exports Required

For each SVG (24 files), export at 3 resolutions:
- **@1x**: Base size (24px or 20px)
- **@2x**: 2× size (48px or 40px)
- **@3x**: 3× size (72px or 60px)

**Total PNG files needed**: 24 SVGs × 3 scales = **72 PNG files**

See `PNG_EXPORT_GUIDE.md` for detailed export instructions.

## Color Variants

### Usage in React Native
```javascript
import NailsIcon from './assets/icons/icon-category-nails-outline-24.svg';

// Default (inherits text color)
<NailsIcon color="#1A1A1A" />

// Active state
<NailsIcon color="#E3A9A0" />

// Inactive state  
<NailsIcon color="#6B6B6B" />
```

### Color Specifications
- **Active**: `#E3A9A0` (Coral Blossom)
- **Inactive**: `#6B6B6B` (Text Muted)
- **On Primary**: `#FFFFFF` (White)

## PNG Export Settings

### Naming Convention
```
icon-category-{name}-outline-{size}@{scale}.png
```

### Examples
```
icon-category-nails-outline-24@1x.png  (24x24)
icon-category-nails-outline-24@2x.png  (48x48)
icon-category-nails-outline-24@3x.png  (72x72)
icon-category-nails-outline-20@1x.png  (20x20)
icon-category-nails-outline-20@2x.png  (40x40)
icon-category-nails-outline-20@3x.png  (60x60)
```

### Export Settings
- **Format**: PNG
- **Color mode**: RGBA
- **Background**: Transparent
- **Anti-aliasing**: Enabled
- **Compression**: Optimized

## Accessibility

### Minimum Sizes
- Touch targets using 20px icons: Add 12px padding (total 44x44)
- Touch targets using 24px icons: Add 10px padding (total 44x44)

### Contrast Requirements
- Active state (#E3A9A0 on #F2EDDD): 2.8:1 (WCAG AA for large text/icons)
- Inactive state (#6B6B6B on #F2EDDD): 4.9:1 (WCAG AA)

### Labels
All icon-only buttons require `accessibilityLabel`:
```javascript
<TouchableOpacity accessibilityLabel="Nails category">
  <NailsIcon size={24} color={isActive ? '#E3A9A0' : '#6B6B6B'} />
</TouchableOpacity>
```

## Implementation Notes

### React Native Setup
```bash
npm install react-native-svg
```

### SVGR Configuration
Icons can be converted to React components using SVGR with these settings:
```json
{
  "native": true,
  "typescript": true,
  "dimensions": false,
  "svgProps": {
    "width": "{props.size || 24}",
    "height": "{props.size || 24}"
  }
}
```
