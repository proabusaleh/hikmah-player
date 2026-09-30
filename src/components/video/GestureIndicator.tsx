import { Sun, Volume2, VolumeX } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Colors } from '@/constants/theme';

export type GestureIndicatorKind = 'volume' | 'brightness' | 'seek';

interface GestureIndicatorProps {
  visible: boolean;
  kind: GestureIndicatorKind;
  /** 0..1 for volume/brightness. */
  fraction: number;
  /** Label line, e.g. "Volume 60%" or "−00:10". */
  label: string;
}

/** Center overlay shown while swipe-adjusting volume, brightness, or seek. */
export const GestureIndicator: React.FC<GestureIndicatorProps> = ({
  visible,
  kind,
  fraction,
  label,
}) => {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  const Icon =
    kind === 'brightness' ? Sun : kind === 'volume' && fraction <= 0 ? VolumeX : Volume2;

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { opacity }]}>
      <Icon size={30} color={Colors.white} />
      <Text style={styles.label}>{label}</Text>
      {kind !== 'seek' ? (
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.round(fraction * 100)}%` }]} />
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    top: '32%',
    minWidth: 120,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },
  barBg: {
    width: 96,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
  },
});
