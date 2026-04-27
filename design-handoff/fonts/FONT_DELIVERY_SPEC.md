# Font Delivery Specification - Manrope

**Package**: Zarkili Design Handoff v1.0.0  
**Font Family**: Manrope  
**Designer**: Mikhail Sharanda  
**License**: SIL Open Font License (free for commercial use)  
**Source**: Google Fonts

---

## Required Font Files

### Production Font Files (4 weights)

| Weight | File Name | Format | Usage |
|--------|-----------|--------|-------|
| **Light 300** | `Manrope-Light.ttf` | TTF | Light body text, captions |
| **Regular 400** | `Manrope-Regular.ttf` | TTF | Body text, descriptions |
| **Medium 500** | `Manrope-Medium.ttf` | TTF | Labels, buttons, tabs |
| **Semibold 600** | `Manrope-SemiBold.ttf` | TTF | Headings, titles |

**Total Files**: 4 font files (TTF format)

**Alternative**: Variable font `Manrope-VariableFont_wght.ttf` (single file, all weights 200-800)

---

## Font Acquisition

### Free Download (Google Fonts)

**Method 1: Google Fonts CDN (for web)**
- Visit: https://fonts.google.com/specimen/Manrope
- Select weights: 300, 400, 500, 600
- Copy embed code

**Method 2: Self-Hosted (React Native)**
- Download from: https://fonts.google.com/specimen/Manrope
- Select weights: 300, 400, 500, 600
- Download ZIP file
- Extract TTF files

**Method 3: GitHub Repository**
- Repository: https://github.com/sharanda/manrope
- Download static fonts from `/fonts/ttf/` directory

**License**: SIL Open Font License 1.1 (free for commercial use, no restrictions)

---

## File Placement

### Recommended Directory Structure

```text
/assets/
  /fonts/
    Manrope-Light.ttf
    Manrope-Regular.ttf
    Manrope-Medium.ttf
    Manrope-SemiBold.ttf
```

### Alternative: Variable Font

```text
/assets/
  /fonts/
    Manrope-VariableFont_wght.ttf
```

**Note**: Variable font provides all weights in a single file, but static fonts may have better cross-platform compatibility.

---

## React Native Configuration

### Step 1: Install Font Files

Place font files in `/assets/fonts/` directory.

### Step 2: Link Fonts (Bare React Native)

Add to `react-native.config.js`:

```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts/'],
};
```

Run:

```bash
npx react-native-asset
```

### Step 3: Link Fonts (Expo - Recommended)

**Option A: Using expo-google-fonts package**

```bash
npx expo install expo-font @expo-google-fonts/manrope
```

```javascript
import { useFonts, Manrope_300Light, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';

const App = () => {
  const [fontsLoaded] = useFonts({
    'Manrope-Light': Manrope_300Light,
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <AppContent />;
};
```

**Option B: Self-hosted fonts**

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/Manrope-Light.ttf",
            "./assets/fonts/Manrope-Regular.ttf",
            "./assets/fonts/Manrope-Medium.ttf",
            "./assets/fonts/Manrope-SemiBold.ttf"
          ]
        }
      ]
    ]
  }
}
```

Or use `expo-font` package:

```bash
npx expo install expo-font
```

```javascript
import * as Font from 'expo-font';

const loadFonts = async () => {
  await Font.loadAsync({
    'Manrope-Light': require('./assets/fonts/Manrope-Light.ttf'),
    'Manrope-Regular': require('./assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Medium': require('./assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('./assets/fonts/Manrope-SemiBold.ttf'),
  });
};
```

### Step 4: Use in StyleSheet

```javascript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  heading: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 24,
    fontWeight: '600',
  },
  body: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    fontWeight: '400',
  },
  label: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    fontWeight: '500',
  },
});
```

## Fallback Font Stack

### System Fallback (if Manrope fails to load)

The typography tokens include a fallback stack:

```text
Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

Behavior:
- iOS: Falls back to San Francisco (system font)
- Android: Falls back to Roboto (system font)
- Web: Falls back to system sans-serif

Implementing fallback:

```javascript
const styles = StyleSheet.create({
  text: {
    fontFamily: Platform.select({
      ios: 'Manrope-Regular',
      android: 'Manrope-Regular',
      default: 'System',
    }),
  },
});
```

Or with error handling:

```javascript
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'Manrope-Regular': require('./assets/fonts/Manrope-Regular.ttf'),
});

const fontFamily = fontsLoaded ? 'Manrope-Regular' : Platform.select({
  ios: 'San Francisco',
  android: 'Roboto',
  default: 'System',
});
```

## Font Loading Best Practices

### 1. Preload Fonts on App Launch (Recommended)

```javascript
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Manrope_300Light, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';

SplashScreen.preventAutoHideAsync();

const App = () => {
  const [fontsLoaded] = useFonts({
    'Manrope-Light': Manrope_300Light,
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return <AppContent />;
};
```

### 2. Handle Font Loading Errors

```javascript
const [fontsLoaded, fontError] = useFonts({
  'Manrope-Regular': Manrope_400Regular,
});

if (fontError) {
  console.error('Font loading error:', fontError);
}
```

### 3. Verify Font Weights Work Correctly

iOS requires explicit font family names for each weight:

```javascript
// Correct
fontFamily: 'Manrope-SemiBold'

// Incorrect
fontFamily: 'Manrope'
fontWeight: '600'
```

Android can use numeric `fontWeight` with single family name, but for consistency across platforms, use explicit family names.

## Font Weight Mapping

| Token Name | Font Weight | Font File | CSS Weight | Usage |
|------------|-------------|-----------|------------|-------|
| light | 300 | Manrope-Light.ttf | 300 | Captions, light text |
| regular | 400 | Manrope-Regular.ttf | 400 | Body text, default |
| medium | 500 | Manrope-Medium.ttf | 500 | Labels, tabs, buttons |
| semibold | 600 | Manrope-SemiBold.ttf | 600 | Headings, titles |

## Text Style Examples

```javascript
import { typography } from './tokens/typography.json';

const heading1Style = {
  fontFamily: 'Manrope-SemiBold',
  fontSize: typography.textStyles['heading-1'].fontSize,
  lineHeight: typography.textStyles['heading-1'].lineHeight,
};

const bodyStyle = {
  fontFamily: 'Manrope-Regular',
  fontSize: typography.textStyles.body.fontSize,
  lineHeight: typography.textStyles.body.lineHeight,
};

const labelStyle = {
  fontFamily: 'Manrope-Medium',
  fontSize: typography.textStyles.label.fontSize,
  lineHeight: typography.textStyles.label.lineHeight,
};
```

## File Size Reference

| Font File | Format | Size (approx) |
|-----------|--------|---------------|
| Manrope-Light.ttf | TTF | 45-55 KB |
| Manrope-Regular.ttf | TTF | 45-55 KB |
| Manrope-Medium.ttf | TTF | 45-55 KB |
| Manrope-SemiBold.ttf | TTF | 45-55 KB |
| Total (static) |  | ~200 KB |
| Manrope-VariableFont_wght.ttf | Variable TTF | ~90 KB |

Recommendation: Use static fonts for better compatibility, or variable font to reduce bundle size.

## Using expo-google-fonts Package (Easiest Method)

### Installation

```bash
npx expo install expo-font @expo-google-fonts/manrope
```

### Usage

```javascript
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useFonts, Manrope_300Light, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Manrope-Light': Manrope_300Light,
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View>
      <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 24 }}>
        Hello World
      </Text>
    </View>
  );
}
```

Benefits:
- No need to download font files manually
- Automatic font loading
- Always up-to-date with Google Fonts
- Smaller app bundle (fonts loaded on demand)

## Troubleshooting

### Font Not Displaying
- Check font name: Must match exactly `Manrope-SemiBold`, not `Manrope-Semibold`
- Check file path: Ensure font files are in `/assets/fonts/`
- Rebuild app: Font changes require rebuild, not just reload
- Clear cache: Run `npx expo start -c` to clear cache

### iOS-Specific Issues
- Use exact font family name: `Manrope-SemiBold`, not `Manrope Semibold`
- Run `npx react-native-asset` after adding fonts
- Check `Info.plist` includes font files under `UIAppFonts`

### Android-Specific Issues
- Font files must be in `android/app/src/main/assets/fonts/`
- File names are case-sensitive
- Rebuild app after font changes

### Expo-Specific Issues
- Ensure `expo-font` is installed
- Use `expo prebuild` after font configuration changes
- Check `app.json` plugin configuration
- Try `npx expo install --fix` to resolve dependency issues

## Checklist

- Install `@expo-google-fonts/manrope` package (recommended) OR
- Download Manrope font files from Google Fonts
- Place font files in `/assets/fonts/` directory if self-hosting
- Configure font loading (`app.json` or `useFonts` hook)
- Test font rendering on iOS and Android devices
- Verify all 4 weights display correctly
- Implement fallback handling for load errors
- Test with slow network to ensure graceful loading

**Font Delivery Status**: Complete. Manrope is free and open-source (SIL OFL), no license purchase required. Use `@expo-google-fonts/manrope` for easiest integration.
