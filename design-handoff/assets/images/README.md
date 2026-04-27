# Images Directory

## Image Strategy

**Runtime API-Provided Images with Programmatic Fallback**

All raster images (salon photos, user avatars, service images) are provided via API at runtime. No static placeholder images are bundled with the application.

### Implementation Approach

1. **Primary Source**: API endpoints provide image URLs
2. **Fallback Behavior**: Programmatic placeholder generation using design tokens
3. **No Bundled Assets**: This directory contains no static image files for production

---

## Image Specifications

### Service Card Images

**Source**: API endpoint provides image URL  
**Aspect Ratio**: 16:9  
**Display Sizes**:
- Small devices: 343×193 pt
- Medium devices: 375×211 pt  
- Large devices: 430×242 pt

**Fallback (when API returns no image or load fails)**:
```javascript
{
  background: '#F5F5F5',
  border: '1px solid #E5E0D1',
  borderRadius: 12,
  // Optional: centered placeholder icon or salon initial
}
```

**Error State (when image fails to load)**:

```javascript
{
  background: '#FEE',
  iconColor: '#F44336',
  iconName: 'alert-circle',
  iconSize: 24
}
```

### Avatar Images

**Source**: API endpoint provides avatar URL  
**Size**: 40×40 pt (all devices)  
**Shape**: Circle  
**Format**: JPG, PNG, or WebP from API

**Fallback (when API returns no avatar)**:

```javascript
{
  type: 'initial',
  size: 40,
  shape: 'circle',
  backgroundColor: generateColorFromName(userName),
  textColor: '#FFFFFF',
  text: getInitial(userName),
  fontSize: 16,
  fontWeight: 600
}
```

**Fallback Color Rotation**: Use deterministic color assignment based on user ID or name hash:

- `#E3A9A0` (Coral Blossom)
- `#D1BFB3` (Warm Oat)
- `#BBEDDA` (Mint Fresh)
- `#6B6B6B` (Muted Gray)

## Implementation Example

### Service Card Image with Fallback

```javascript
import { Image, View, Text } from 'react-native';
import { useState } from 'react';

const ServiceCardImage = ({ imageUrl, salonName }) => {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <View style={{
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: imageError ? '#FEE' : '#F5F5F5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E0D1',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {imageError ? (
          <AlertCircleIcon size={24} color="#F44336" />
        ) : (
          <Text style={{ color: '#6B6B6B', fontSize: 14 }}>
            {salonName?.[0] || '?'}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={{
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 12
      }}
      onError={() => setImageError(true)}
    />
  );
};
```

### Avatar with Initial Fallback

```javascript
const generateColorFromName = (name) => {
  const colors = ['#E3A9A0', '#D1BFB3', '#BBEDDA', '#6B6B6B'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const Avatar = ({ imageUrl, userName }) => {
  const [imageError, setImageError] = useState(false);
  const initial = userName?.[0]?.toUpperCase() || '?';
  const backgroundColor = generateColorFromName(userName || 'default');

  if (!imageUrl || imageError) {
    return (
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
          {initial}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={{ width: 40, height: 40, borderRadius: 20 }}
      onError={() => setImageError(true)}
    />
  );
};
```

## API Contract

### Expected API Response Format

**Service Card Image**:

```json
{
  "salon": {
    "id": "salon_123",
    "name": "Beauty Studio",
    "imageUrl": "https://api.zarkili.com/images/salons/salon_123.jpg",
    "imageAlt": "Beauty Studio storefront"
  }
}
```

**User Avatar**:

```json
{
  "user": {
    "id": "user_456",
    "name": "Jane Doe",
    "avatarUrl": "https://api.zarkili.com/avatars/user_456.jpg"
  }
}
```

### Handling Missing Images

- `imageUrl: null` -> Use programmatic fallback immediately
- `imageUrl: ""` -> Use programmatic fallback immediately
- `imageUrl: "https://..." but 404/error` -> Show error state or fallback

## Performance Considerations

### Image Caching

Use React Native's built-in image caching or a library like `react-native-fast-image`:

```javascript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
  }}
  style={{ width: '100%', aspectRatio: 16 / 9 }}
  onError={() => setImageError(true)}
/>
```

### Loading States

Show skeleton/shimmer while image is loading:

```javascript
const [isLoading, setIsLoading] = useState(true);

<FastImage
  source={{ uri: imageUrl }}
  onLoadStart={() => setIsLoading(true)}
  onLoadEnd={() => setIsLoading(false)}
  onError={() => { setImageError(true); setIsLoading(false); }}
/>
{isLoading && <SkeletonPlaceholder />}
```

## Directory Usage

### Current Scope (v1.0.0)

This directory contains no bundled image files. All images are runtime-provided via API.

### Future Additions

If static images are needed in future versions (for example app branding or splash screens):

- Use descriptive naming: `logo-primary@3x.png`, `splash-background@3x.jpg`
- Optimize for mobile (compress, use WebP where supported)
- Follow `@1x`, `@2x`, `@3x` naming convention
- Document additions in this README

## Related Files

- Category Icons: Located in `assets/icons/` as SVG files (24 production-ready files)
- Design Tokens: `tokens/colors.json` for fallback colors
- Component Specs: `components/service-card.json` includes image specifications
- Typography: `tokens/typography.json` for fallback text styles

**Strategy Summary**: Runtime API images with programmatic fallback. No bundled placeholders. Zero static image files in production package.
