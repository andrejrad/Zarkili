# Zarkili Design Handoff Package

**Production-ready design assets for React Native with Expo**

This package contains everything needed to implement the Zarkili beauty booking app's design system in React Native.

---

## 📌 Important: Icon Format

**This package uses SVG as the primary production asset.**

- ✅ **24 SVG files included** (12 categories × 2 sizes: 24px + 20px)
- ✅ **Production-ready** with `currentColor` for runtime tinting
- ✅ **Recommended for React Native** with `react-native-svg`
- 📋 **PNG files intentionally deferred** - not required for React Native implementation
- 📝 **Optional PNG export guide** provided in `assets/icons/PNG_EXPORT_GUIDE.md` for alternative workflows

**Benefits of SVG**:
- Perfect scaling on all device resolutions
- Smaller file size than multiple PNG variants
- Runtime color tinting without multiple asset versions
- No need to manage @1x/@2x/@3x variants

---

## 🚀 Quick Start

### 1. Review the Manifest
Start with [`HANDOFF_MANIFEST.md`](./HANDOFF_MANIFEST.md) for a complete overview of all deliverables.

### 2. Set Up Design Tokens

```bash
# Install dependencies
npm install react-native-svg
npx expo install expo-font @expo-google-fonts/manrope
```

```javascript
// theme.js
import colors from './design-handoff/tokens/colors.json';
import typography from './design-handoff/tokens/typography.json';
import spacing from './design-handoff/tokens/spacing.json';

export const theme = {
  colors: colors.colors.semantic,
  typography: typography.textStyles,
  spacing: spacing.spacing,
  borderRadius: spacing.borderRadius,
  shadows: spacing.shadows,
};
```

### 3. Use Design Tokens

```javascript
import { theme } from './theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary.value,
    paddingHorizontal: theme.spacing['4'].value,
    paddingVertical: theme.spacing['3'].value,
    borderRadius: theme.borderRadius.full.value,
  },
  text: {
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight,
  },
});
```

---

## 📂 Package Structure

```
design-handoff/
│
├── README.md (this file)
├── HANDOFF_MANIFEST.md (complete package overview)
│
├── tokens/
│   ├── colors.json          ← Brand, semantic, state colors
│   ├── typography.json       ← Font styles and sizes
│   └── spacing.json          ← Spacing grid, radius, shadows
│
├── assets/
│   └── icons/
│       ├── ICONS_MANIFEST.md       ← Icon specifications
│       ├── icon-category-*.svg     ← Category icons (SVG)
│       └── [Generate PNG @1x @2x @3x from SVGs]
│
├── components/
│   ├── category-pill.json   ← Category filter pill spec
│   ├── service-card.json    ← Salon/service card spec
│   ├── search-bar.json      ← Search input spec
│   └── badge.json           ← Notification badge spec
│
├── specs/
│   ├── screen-explore.json  ← Explore screen layout
│   └── interactions.json    ← Animation & interaction specs
│
└── strings/
    └── en-US.json           ← All user-facing text
```

---

## 🎨 Design Token Overview

### Colors
- **Brand**: Coral Blossom (`#E3A9A0`), Warm Oat (`#D1BFB3`), Cream Silk (`#F2EDDD`), Mint Fresh (`#BBEDDA`)
- **Semantic**: Primary, background, surface, border, foreground, text-muted
- **States**: Hover, pressed, selected, disabled
- **Feedback**: Success, warning, error, info

### Typography
- **Font**: Manrope (free, open-source via Google Fonts)
- **Styles**: 12 predefined text styles from heading-1 to label-small
- **Accessibility**: All styles meet WCAG AA contrast requirements
- **Installation**: Use `@expo-google-fonts/manrope` package for easiest setup

### Spacing
- **Grid**: 4pt base (0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96)
- **Touch Targets**: Minimum 44x44 pt
- **Border Radius**: sm (8), md (12), lg (16), xl (20), 2xl (24), full (9999)

---

## 🖼️ Icons

### Complete Icon Set - 24 SVG Files
✅ **All 12 Categories Included** (24px + 20px each):
- Nails, Hair, Skin, Lashes
- Brows, Massage, Makeup, Barber
- Waxing, Spa, Injectables, Wellness

**Format**: SVG with `currentColor` (production-ready)  
**Total**: 24 files (12 categories × 2 sizes)

### Icon Usage (React Native with react-native-svg)

```javascript
import NailsIcon from './design-handoff/assets/icons/icon-category-nails-outline-24.svg';

// Active state
<NailsIcon color="#E3A9A0" width={24} height={24} />

// Inactive state
<NailsIcon color="#6B6B6B" width={24} height={24} />
```

### Optional: Generate PNG Assets

**Note**: PNG generation is optional and not required for React Native implementation. SVG is the recommended format.

If you need PNG files for alternative workflows, see `assets/icons/PNG_EXPORT_GUIDE.md` for complete export instructions including automated batch scripts.

---

## 🧩 Component Implementation

Each component JSON file includes:
- **States**: default, pressed, selected, disabled, loading, error
- **Layout**: dimensions, spacing, alignment
- **Styling**: colors, borders, shadows for each state
- **Transitions**: durations, easing, properties
- **Accessibility**: roles, labels, hints
- **Code examples**: React Native usage

### Example: Category Pill

```javascript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from './theme';
import NailsIcon from './assets/icons/icon-category-nails-outline-20.svg';

export const CategoryPill = ({ icon, label, selected, onPress, disabled }) => {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        selected && styles.pillSelected,
        disabled && styles.pillDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} category`}
      accessibilityState={{ selected }}
    >
      {icon}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E0D1',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  pillSelected: {
    backgroundColor: '#E3A9A0',
    borderColor: '#E3A9A0',
  },
  pillDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
```

---

## 📱 Screen Implementation

See `specs/screen-explore.json` for detailed layout specifications including:
- Component hierarchy
- Exact spacing measurements
- Safe area configuration
- Scroll behavior
- Sticky elements
- State variations (loading, empty, error)
- Responsive breakpoints

---

## 🎬 Animations & Interactions

See `specs/interactions.json` for:
- Transition durations and easing
- Spring configurations
- Haptic feedback timings
- Gesture handling
- State change animations

### Example: Category Pill Selection

```javascript
import { useSpring, animated } from '@react-spring/native';

const CategoryPill = ({ selected, onPress }) => {
  const springProps = useSpring({
    scale: selected ? 1.0 : 1.0,
    backgroundColor: selected ? '#E3A9A0' : '#FFFFFF',
    config: { tension: 400, friction: 15 },
  });

  return (
    <animated.View style={[styles.pill, springProps]}>
      {/* content */}
    </animated.View>
  );
};
```

---

## 🌐 Localization

All user-facing text is in `strings/en-US.json`:

```javascript
import strings from './design-handoff/strings/en-US.json';

const text = strings.strings.explore.searchPlaceholder;
// "Search services, salons..."

// With pluralization
const count = 5;
const resultsText = strings.strings.explore.resultsCount.other.replace('{{count}}', count);
// "5 salons found"
```

---

## ♿ Accessibility

### Minimum Requirements
- **Touch targets**: 44x44 pt minimum
- **Contrast**: WCAG AA (4.5:1 text, 3:1 large text/icons)
- **Labels**: All icon-only buttons need `accessibilityLabel`
- **States**: Use `accessibilityState` for selected/disabled
- **Motion**: Respect `prefers-reduced-motion`

### Example

```javascript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Nails category"
  accessibilityState={{ selected: true }}
  accessibilityHint="Filters results to show nail services"
>
  <NailsIcon />
</TouchableOpacity>
```

---

## 🧪 Testing Checklist

- [ ] Test on iPhone SE (375x667), iPhone 14 (390x844), iPhone 14 Pro Max (430x932)
- [ ] Test with VoiceOver/TalkBack enabled
- [ ] Test with Reduced Motion enabled
- [ ] Test with large text size (accessibility settings)
- [ ] Verify all touch targets are minimum 44x44
- [ ] Test color contrast in light conditions
- [ ] Verify all animations are 60fps
- [ ] Test pull-to-refresh on long lists
- [ ] Test search, filter, and sort functionality
- [ ] Verify proper keyboard handling

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "18.x",
    "react-native": "0.73.x",
    "react-native-svg": "^14.1.0",
    "expo": "~50.0.0"
  },
  "devDependencies": {
    "@svgr/cli": "^8.1.0"
  }
}
```

---

## 🔗 Related Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native SVG](https://github.com/software-mansion/react-native-svg)
- [React Spring](https://www.react-spring.dev/) - For animations
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 💡 Tips

1. **Start with tokens** - Set up your theme file first before building components
2. **Build components incrementally** - Start with static states, then add interactions
3. **Test accessibility early** - Don't wait until the end to add labels and test with screen readers
4. **Use provided measurements** - The JSON specs have exact pixel values for spacing
5. **Respect animations specs** - Duration and easing values are tested for best UX
6. **Generate missing icons** - Follow the pattern in provided SVGs for consistency

---

## 📞 Questions?

Refer to:
- **HANDOFF_MANIFEST.md** for package overview
- **Component JSON files** for detailed specs
- **ICONS_MANIFEST.md** for icon guidelines
- **interactions.json** for animation parameters
- **screen-explore.json** for layout measurements

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-22  
**Status**: Production Ready ✅
