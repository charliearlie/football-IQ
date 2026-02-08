/**
 * ProBadge - Custom 4-point faceted star SVG for Football IQ Pro branding.
 *
 * A heraldic compass-rose star shape with Pro Amber gradient fill,
 * darker gold border, and optional "P" text at larger sizes.
 * Replaces all Crown icons as the unified Pro brand marker.
 */

import React, { memo } from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

export interface ProBadgeProps {
  /** Size in pixels (width and height). Default: 24 */
  size?: number;
  /** Override fill color. When set, uses solid fill instead of gradient. */
  color?: string;
  /** Optional style for the wrapping Svg element */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * 4-point faceted star path (compass rose / heraldic star).
 * viewBox: 0 0 24 24, center at (12, 12).
 * Points extend to edges; inner vertices create the faceted diamond shape.
 */
const STAR_PATH =
  'M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z';

/** Border stroke color — darker gold */
const BORDER_COLOR = '#D4A500';

/** Minimum size at which the "P" text is rendered */
const MIN_TEXT_SIZE = 20;

function ProBadgeComponent({
  size = 24,
  color,
  style,
  testID,
}: ProBadgeProps) {
  const useSolidFill = !!color;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      testID={testID}
    >
      {/* Gradient definition (only when no color override) */}
      {!useSolidFill && (
        <Defs>
          <LinearGradient id="proAmberGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFD700" />
            <Stop offset="1" stopColor="#FFBF00" />
          </LinearGradient>
        </Defs>
      )}

      {/* Star shape */}
      <Path
        d={STAR_PATH}
        fill={useSolidFill ? color : 'url(#proAmberGradient)'}
        stroke={BORDER_COLOR}
        strokeWidth={0.8}
      />


    </Svg>
  );
}

export const ProBadge = memo(ProBadgeComponent);
