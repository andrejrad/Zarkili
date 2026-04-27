# PNG Icon Files - Not Included (SVG Primary)

## 📌 Important Note

**This package uses SVG as the primary production asset.**

PNG files are **not included** and are **not required** for React Native implementation with `react-native-svg`.

---

## Why SVG-Only?

**Advantages of SVG for React Native**:
- ✅ **Perfect scaling** on all device resolutions
- ✅ **Smaller file size** than managing @1x/@2x/@3x PNG variants
- ✅ **Runtime color tinting** with `currentColor` - no need for multiple colored versions
- ✅ **Production-ready** - all 24 SVG files are complete and optimized
- ✅ **Simpler maintenance** - single source file per icon size

**React Native with react-native-svg**:
```javascript
import NailsIcon from './assets/icons/icon-category-nails-outline-24.svg';

// Automatically scales to device pixel ratio
// No need for @1x/@2x/@3x management
<NailsIcon 
  color="#E3A9A0"  // Runtime tinting
  width={24} 
  height={24} 
/>
```

---

## Optional PNG Generation

If you have a specific workflow requirement for PNG files (e.g., legacy system compatibility), you can generate them from the SVG source files.

### When You Might Need PNGs

- Legacy systems that don't support SVG
- Email templates requiring raster images
- Third-party integrations with PNG-only requirements
- Specific platform limitations (rare in modern React Native)

### How to Generate PNGs

See **`PNG_EXPORT_GUIDE.md`** in this directory for:
- Detailed export instructions
- Automated batch export scripts
- Tool recommendations (Figma, Sketch, svg2png, Inkscape)
- Naming conventions and file specifications

**Quick example**:
```bash
# Using svg2png (Node.js)
npm install -g svg2png

# Generate all resolutions for one icon
svg2png icon-category-nails-outline-24.svg --width 24 --output icon-category-nails-outline-24@1x.png
svg2png icon-category-nails-outline-24.svg --width 48 --output icon-category-nails-outline-24@2x.png
svg2png icon-category-nails-outline-24.svg --width 72 --output icon-category-nails-outline-24@3x.png
```

---

## File Specifications (If You Generate PNGs)

### Required Files
If generating PNGs, you'll need **72 files total**:
- 12 categories × 2 sizes (24px, 20px) × 3 scales (@1x, @2x, @3x) = 72 PNG files

### Naming Convention
```
icon-category-{category}-outline-{size}@{scale}.png
```

**Examples**:
```
icon-category-nails-outline-24@1x.png   (24×24 px)
icon-category-nails-outline-24@2x.png   (48×48 px)
icon-category-nails-outline-24@3x.png   (72×72 px)
icon-category-nails-outline-20@1x.png   (20×20 px)
icon-category-nails-outline-20@2x.png   (40×40 px)
icon-category-nails-outline-20@3x.png   (60×60 px)
```

### Export Settings
- **Format**: PNG
- **Color mode**: RGBA
- **Background**: Transparent
- **Anti-aliasing**: Enabled
- **Color**: Black (#000000) for icons (will be tinted at runtime)

---

## Recommendation

**For React Native apps**: Use SVG directly (no PNG generation needed)

**For other workflows**: Generate PNGs only if specifically required

---

**See**: `PNG_EXPORT_GUIDE.md` for complete export instructions and batch scripts
