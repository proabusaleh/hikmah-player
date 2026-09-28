import { Image } from 'expo-image';
import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BorderRadius, Colors } from '@/constants/theme';

interface CachedThumbnailProps {
  uri: string | null | undefined;
  width?: number;
  height?: number;
  borderRadius?: number;
  fallbackIcon?: React.ReactNode;
  blurhash?: string;
}

// Default blurhash for smooth placeholder
const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export const CachedThumbnail: React.FC<CachedThumbnailProps> = memo(
  ({
    uri,
    width = 52,
    height = 52,
    borderRadius = BorderRadius.md,
    fallbackIcon,
    blurhash = DEFAULT_BLURHASH,
  }) => {
    const containerStyle = useMemo(
      () => ({
        width,
        height,
        borderRadius,
      }),
      [width, height, borderRadius]
    );

    if (!uri) {
      return <View style={[styles.fallback, containerStyle]}>{fallbackIcon}</View>;
    }

    return (
      <Image
        source={{ uri }}
        style={containerStyle}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        placeholder={{ blurhash }}
        recyclingKey={uri}
        // Performance: don't retry failed images
        allowDownscaling={true}
      />
    );
  }
);

CachedThumbnail.displayName = 'CachedThumbnail';

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
