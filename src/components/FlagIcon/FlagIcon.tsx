/**
 * FlagIcon - SVG flag component for country codes.
 *
 * Renders crisp SVG flags instead of emoji flags.
 * Supports ISO 3166-1 alpha-2 codes and GB home nations.
 */

import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { HOME_NATION_FLAGS } from './homeNationFlags';
import { FLAG_SVG_MAP } from './flagSvgMap';

export interface FlagIconProps {
  /** ISO 3166-1 alpha-2 code or GB subdivision (GB-ENG, GB-SCT, GB-WLS, GB-NIR) */
  code: string;
  /** Height in pixels (width = size * 1.5 for 3:2 ratio) */
  size?: number;
  testID?: string;
}

/**
 * Look up SVG string for a country code.
 * Returns null for unknown codes or bare 'GB'.
 */
function getFlagSvg(code: string): string | null {
  const upperCode = code.toUpperCase();

  // Never show Union Jack for bare GB
  if (upperCode === 'GB') return null;

  // Check home nation flags first
  const homeNation = HOME_NATION_FLAGS[upperCode];
  if (homeNation) return homeNation;

  // Look up from static map
  return FLAG_SVG_MAP[upperCode] ?? null;
}

function FlagIconComponent({ code, size = 16, testID }: FlagIconProps) {
  const svg = useMemo(() => getFlagSvg(code), [code]);

  if (!svg) return null;

  const width = Math.round(size * 1.5);

  return (
    <View
      style={[styles.container, { width, height: size, borderRadius: 2 }]}
      testID={testID}
    >
      <SvgXml xml={svg} width={width} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export const FlagIcon = memo(FlagIconComponent);
