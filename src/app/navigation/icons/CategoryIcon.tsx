import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

import type { DiscoveryCategoryId } from "../../../domains/discovery/model";

type CategoryIconProps = {
  category: DiscoveryCategoryId;
  size?: number;
  color?: string;
};

const defaultColor = "#6B6B6B";
const strokeWidth = 1.5;

export function CategoryIcon({ category, size = 24, color = defaultColor }: CategoryIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {renderCategoryShape(category, color)}
    </Svg>
  );
}

function renderCategoryShape(category: DiscoveryCategoryId, color: string) {
  switch (category) {
    case "all":
      return (
        <>
          <Rect x="4" y="4" width="6" height="6" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="14" y="4" width="6" height="6" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="4" y="14" width="6" height="6" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="14" y="14" width="6" height="6" rx="2" stroke={color} strokeWidth={strokeWidth} />
        </>
      );
    case "barber":
      return (
        <>
          <Path d="M7 20L9 4L15 4L17 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 4L10 2L14 2L15 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="8.5" y1="12" x2="15.5" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="8" y1="16" x2="16" y2="16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      );
    case "brows":
      return (
        <>
          <Path d="M3 8C3 8 5 6 8 6C11 6 12 8 12 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M21 8C21 8 19 6 16 6C13 6 12 8 12 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M4 10C4 10 6 12 9 12C11 12 12 11 12 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M20 10C20 10 18 12 15 12C13 12 12 11 12 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "hair":
      return (
        <>
          <Path d="M7 14L5 22M17 14L19 22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 2C8.68629 2 6 4.68629 6 8V14H18V8C18 4.68629 15.3137 2 12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 8C9 6.89543 9.89543 6 11 6H13C14.1046 6 15 6.89543 15 8V14H9V8Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "injectables":
      return (
        <>
          <Path d="M19 9L15 5M15 5L13 7M15 5L17 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M13 7L7 13L5 19L11 17L17 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M11 9L15 13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx="7" cy="17" r="1" fill={color} />
        </>
      );
    case "lashes":
      return (
        <>
          <Path d="M12 13C7.58172 13 4 10.3137 4 7C4 3.68629 7.58172 2 12 2C16.4183 2 20 3.68629 20 7C20 10.3137 16.4183 13 12 13Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="12" cy="7" r="2" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M8 4L8 2M10 3L10 1M14 3L14 1M16 4L16 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      );
    case "makeup":
      return (
        <>
          <Path d="M20 14L18 22H6L4 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="4" y="8" width="16" height="6" rx="1" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8" stroke={color} strokeWidth={strokeWidth} />
          <Circle cx="12" cy="11" r="1.5" fill={color} />
        </>
      );
    case "massage":
      return (
        <>
          <Circle cx="12" cy="6" r="3" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M7 22V14C7 11.7909 8.79086 10 11 10H13C15.2091 10 17 11.7909 17 14V22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M7 16L4 14M17 16L20 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "nails":
      return (
        <>
          <Path d="M12 2C11.4477 2 11 2.44772 11 3V10C11 10.5523 11.4477 11 12 11C12.5523 11 13 10.5523 13 10V3C13 2.44772 12.5523 2 12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M12 11C10.3431 11 9 12.3431 9 14V20C9 21.1046 9.89543 22 11 22H13C14.1046 22 15 21.1046 15 20V14C15 12.3431 13.6569 11 12 11Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Ellipse cx="12" cy="7" rx="2" ry="3" stroke={color} strokeWidth={strokeWidth} />
        </>
      );
    case "skin":
      return (
        <>
          <Path d="M12 2C12 2 8 4 8 8C8 9.5 8.5 10.5 9 11.5C9.5 12.5 10 14 10 16C10 19 8 22 8 22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 2C12 2 16 4 16 8C16 9.5 15.5 10.5 15 11.5C14.5 12.5 14 14 14 16C14 19 16 22 16 22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="12" cy="8" r="2" stroke={color} strokeWidth={strokeWidth} />
        </>
      );
    case "spa":
      return (
        <>
          <Path d="M12 2C12 2 8 5 8 9C8 11.2091 9.79086 13 12 13C14.2091 13 16 11.2091 16 9C16 5 12 2 12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 14C5 14 3 16 3 18C3 19.1046 3.89543 20 5 20C6.10457 20 7 19.1046 7 18C7 16 5 14 5 14Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M19 14C19 14 17 16 17 18C17 19.1046 17.8954 20 19 20C20.1046 20 21 19.1046 21 18C21 16 19 14 19 14Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 14C12 14 10 16 10 18C10 19.1046 10.8954 20 12 20C13.1046 20 14 19.1046 14 18C14 16 12 14 12 14Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "waxing":
      return (
        <>
          <Path d="M8 2V6C8 7.10457 8.89543 8 10 8H14C15.1046 8 16 7.10457 16 6V2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="6" y="8" width="12" height="10" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M9 18V22M12 18V22M15 18V22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="9" y1="11" x2="15" y2="11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="9" y1="14" x2="15" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      );
    case "wellness":
      return (
        <>
          <Path d="M12 21C12 21 4 16 4 9.5C4 6.46243 6.46243 4 9.5 4C10.8 4 12 4.5 12 4.5C12 4.5 13.2 4 14.5 4C17.5376 4 20 6.46243 20 9.5C20 16 12 21 12 21Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 10V14M10 12H14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      );
    default:
      return null;
  }
}