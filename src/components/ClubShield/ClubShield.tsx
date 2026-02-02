/**
 * ClubShield - Modern rounded crest rendered from club colors.
 *
 * A "fair use" vector alternative to official club logos.
 * Takes primary and secondary colors and renders a professional
 * crest shape with a vertical center stripe.
 */

import React, { memo } from 'react';
import Svg, { Path, Rect, Defs, ClipPath } from 'react-native-svg';

export interface ClubShieldProps {
  primaryColor: string;
  secondaryColor: string;
  /** Overall height in pixels (width auto-calculated from aspect ratio) */
  size?: number;
  testID?: string;
}

/**
 * Modern rounded crest shape.
 * viewBox: 0 0 24 28
 * Shape: rounded top, pointed bottom — classic football crest silhouette.
 */
const CREST_PATH =
  'M3 2C3 0.9 3.9 0 5 0H19C20.1 0 21 0.9 21 2V16C21 19.5 12 28 12 28C12 28 3 19.5 3 16V2Z';

const STRIPE_WIDTH = 7;
const STRIPE_X = 8.5;

function ClubShieldComponent({
  primaryColor,
  secondaryColor,
  size = 24,
  testID,
}: ClubShieldProps) {
  const viewBoxWidth = 24;
  const viewBoxHeight = 28;
  const aspectRatio = viewBoxWidth / viewBoxHeight;
  const width = size * aspectRatio;

  return (
    <Svg
      width={width}
      height={size}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      testID={testID}
    >
      <Defs>
        <ClipPath id="crest-clip">
          <Path d={CREST_PATH} />
        </ClipPath>
      </Defs>

      {/* Primary color fill */}
      <Path d={CREST_PATH} fill={primaryColor} />

      {/* Secondary color vertical stripe (clipped to crest shape) */}
      <Rect
        x={STRIPE_X}
        y={0}
        width={STRIPE_WIDTH}
        height={viewBoxHeight}
        fill={secondaryColor}
        clipPath="url(#crest-clip)"
      />

      {/* Border outline */}
      <Path
        d={CREST_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1}
      />
    </Svg>
  );
}

export const ClubShield = memo(ClubShieldComponent);
