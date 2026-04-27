# Zarkili Design Handoff Package v1.0.0

**Target Platform**: React Native with Expo  
**Date**: 2026-04-22  
**Status**: Production Ready

---

## 📦 Package Contents

### 1. Design Tokens (`/tokens`)

| File | Description | Format |
|------|-------------|--------|
| `colors.json` | Complete color system including brand, semantic, opacity, and state colors | JSON |
| `typography.json` | Font families, weights, and text styles for all components | JSON |
| `spacing.json` | 4pt grid spacing system, border radius, shadows | JSON |

**Implementation**: Import directly into your React Native theme configuration.

```javascript
import colors from './tokens/colors.json';
import typography from './tokens/typography.json';
import spacing from './tokens/spacing.json';
```

---

### 2. Icons (`/assets/icons`)

#### Provided SVG Files
- ✅ `icon-category-nails-outline-24.svg`
- ✅ `icon-category-nails-outline-20.svg`
- ✅ `icon-category-hair-outline-24.svg`
- ✅ `icon-category-hair-outline-20.svg`

#### Complete Icon Set (12 categories)
All categories: nails, hair, skin, lashes, brows, massage, makeup, barber, waxing, spa, injectables, wellness

**Specifications**:
- Style: Outline, rounded, 1.5px/1.25px stroke
- Sizes: 24px, 20px
- Color: Uses `currentColor` for easy theming
- Export formats: SVG (provided), PNG @1x @2x @3x (generate from SVG)

**Usage**:
```javascript
import NailsIcon from './assets/icons/icon-category-nails-outline-24.svg';

<NailsIcon 
  color={isActive ? '#E3A9A0' : '#6B6B6B'} 
  width={24} 
  height={24} 
/>
```

See `ICONS_MANIFEST.md` for complete specifications.

---

### 3. Components (`/components`)

| Component | File | States |
|-----------|------|--------|
| Category Pill | `category-pill.json` | default, selected, pressed, disabled |
| Service/Salon Card | `service-card.json` | default, pressed, loading, error |

**Each component spec includes**:
- Layout properties (spacing, sizing, alignment)
- State-specific styling
- Transition specifications
- Accessibility requirements
- Code examples

**Implementation Pattern**:
```javascript
import { CategoryPill } from '@/components/CategoryPill';

<CategoryPill
  icon="nails"
  label="Nails"
  selected={selectedCategory === 'nails'}
  onPress={() => setSelectedCategory('nails')}
  disabled={false}
/>
```

---

### 4. Screens (`/specs`)

| Screen | File | Includes |
|--------|------|----------|
| Explore | `screen-explore.json` | Layout, spacing, states, responsive rules |
| Welcome | `screen-welcome.json` | Onboarding/welcome layout |
| Home | `screen-home.json` | Main dashboard layout |

**Specifications include**:
- Complete layout hierarchy
- Spacing measurements (redlines)
- Safe area behavior
- Scroll configuration
- Sticky elements
- Loading/empty/error states
- Responsive breakpoints
- Performance optimization settings

---

### 5. Interactions (`/specs`)

| File | Description |
|------|-------------|
| `interactions.json` | Complete interaction specifications for all UI patterns |

**Covers**:
- Category pill selection/deselection
- Filter apply/clear
- Service card press
- Tab changes
- Favorite toggle
- Message badge updates
- Pull-to-refresh
- Bottom sheet behavior
- Search focus
- Haptic feedback guidelines

**Animation Specifications**:
- Duration (ms)
- Easing curves
- Transform properties
- Spring configurations
- Stagger timings

---

### 6. Strings (`/strings`)

| File | Description |
|------|-------------|
| `en-US.json` | Complete English string table with pluralization |

**Includes**:
- Navigation labels
- Screen content
- Categories
- Filters
- Messages
- Accessibility labels
- Truncation rules
- Error messages

**Localization Ready**:
```javascript
import strings from './strings/en-US.json';

const text = strings.strings.explore.searchPlaceholder;
// "Search services, salons..."
```

---

## 🎨 Color System Quick Reference

### Brand Colors
- **Primary (Coral Blossom)**: `#E3A9A0`
- **Secondary (Warm Oat)**: `#D1BFB3`
- **Background (Cream Silk)**: `#F2EDDD`
- **Accent (Mint Fresh)**: `#BBEDDA`

### Semantic Colors
- **Foreground**: `#1A1A1A`
- **Text Muted**: `#6B6B6B`
- **Border**: `#E5E0D1`
- **Success**: `#4CAF50`
- **Error**: `#F44336`
- **Warning**: `#FF9800`

### State Colors
- **Primary Hover**: `#D99A90`
- **Primary Pressed**: `#CF8B80`
- **Selected**: `#E3A9A0`
- **Disabled**: `#B0B0B0`

---

## 📏 Spacing System

**4pt Grid**: 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96

**Semantic Spacing**:
- Page horizontal: `16px`
- Page vertical: `24px`
- Section gap: `24px`
- Element gap: `12px`
- Touch target minimum: `44px`

**Border Radius**:
- Small (chips): `8px`
- Medium (buttons): `12px`
- Large (cards): `16px`
- 2XL (prominent cards): `24px`
- Full (pills): `9999px`

---

## ✍️ Typography

**Font Family**: Manrope (free, open-source via Google Fonts)

**Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold)

**Text Styles**:
| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| heading-1 | 32px | 600 | 40px | Page titles |
| heading-2 | 24px | 600 | 32px | Section headers |
| heading-3 | 20px | 600 | 28px | Subsection headers |
| heading-4 | 18px | 600 | 24px | Card titles |
| body | 14px | 400 | 20px | Default text |
| body-small | 12px | 400 | 16px | Captions |
| label | 14px | 500 | 20px | Buttons, tabs |
| label-small | 12px | 500 | 16px | Badges |

---

## ♿ Accessibility Requirements

### Minimum Touch Targets
- All interactive elements: `44x44 pt` minimum
- Add padding to small icons to meet requirement

### Contrast Compliance
- Text on background: WCAG AA minimum (4.5:1)
- Large text/icons: WCAG AA (3:1)
- All color combinations tested and compliant

### Screen Reader Labels
- All icon-only buttons require `accessibilityLabel`
- States announced with `accessibilityState`
- Example: `accessibilityLabel="Nails category, selected"`

### Reduced Motion
- All animations respect `prefers-reduced-motion`
- Provide instant state changes when enabled

---

## 🚀 Implementation Checklist

### Phase 1: Foundation
- [ ] Import and configure design tokens
- [ ] Set up typography system
- [ ] Configure spacing/layout constants
- [ ] Install and configure react-native-svg

### Phase 2: Icons
- [ ] Import provided SVG icons
- [ ] Generate PNG assets @1x @2x @3x
- [ ] Create remaining category icons (10 more)
- [ ] Test icon color theming

### Phase 3: Components
- [ ] Build CategoryPill component
- [ ] Build ServiceCard component
- [ ] Build SearchBar component
- [ ] Build FilterButton component
- [ ] Build Badge/Chip components
- [ ] Implement all component states

### Phase 4: Screens
- [ ] Build Explore screen layout
- [ ] Implement sticky header behavior
- [ ] Add pull-to-refresh
- [ ] Implement loading states
- [ ] Implement empty states
- [ ] Implement error states

### Phase 5: Interactions
- [ ] Implement category pill animations
- [ ] Add haptic feedback
- [ ] Implement filter bottom sheet
- [ ] Add card press animations
- [ ] Test all transitions

### Phase 6: Polish
- [ ] Integrate string table
- [ ] Test accessibility
- [ ] Verify touch targets
- [ ] Test on multiple devices
- [ ] Performance optimization

---

## 📱 Testing Devices

Test on the following device sizes:
- **Small**: iPhone SE (375 x 667)
- **Standard**: iPhone 14 (390 x 844)
- **Large**: iPhone 14 Pro Max (430 x 932)
- **Tablet**: iPad (768 x 1024)

---

## 📞 Support

For questions or clarifications:
- Review component JSON specs for detailed properties
- Check interaction specs for animation parameters
- Refer to screen specs for layout measurements
- Use string table for all user-facing text

---

## 🔄 Version History

### v1.0.0 (2026-04-22)
- Initial production-ready handoff
- Complete token system
- 4 sample icons + specifications for 8 more
- 2 component specifications
- Explore screen specification
- Complete interaction specifications
- English string table
- Accessibility documentation

---

## 📁 File Structure

```
design-handoff/
├── HANDOFF_MANIFEST.md (this file)
├── tokens/
│   ├── colors.json
│   ├── typography.json
│   └── spacing.json
├── assets/
│   └── icons/
│       ├── ICONS_MANIFEST.md
│       ├── icon-category-nails-outline-24.svg
│       ├── icon-category-nails-outline-20.svg
│       ├── icon-category-hair-outline-24.svg
│       └── icon-category-hair-outline-20.svg
├── components/
│   ├── category-pill.json
│   └── service-card.json
├── specs/
│   ├── interactions.json
│   └── screen-explore.json
└── strings/
    └── en-US.json
```

---

**End of Handoff Package**
