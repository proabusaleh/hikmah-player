import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { a11yLabels } from '@/utils/accessibility';
import { formatTime } from '@/utils/formatters';

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (positionMs: number) => void;
}

/** How long the fill glides toward each new polled position (polling ticks every ~500ms). */
const SMOOTHING_MS = 400;
const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;
const TOUCH_HEIGHT = 40;

const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;

/**
 * Smooths a 0..1 progress target: instead of jumping on every polled update,
 * the returned Animated.Value glides linearly toward each new target.
 * Pass `paused` while the user is dragging so the animation doesn't fight
 * the finger (set the value directly during the gesture instead).
 */
export const useAnimatedProgress = (target: number, paused = false): Animated.Value => {
  const [anim] = useState(() => new Animated.Value(clamp01(target)));

  useEffect(() => {
    if (paused) return;
    const animation = Animated.timing(anim, {
      toValue: clamp01(target),
      duration: SMOOTHING_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [target, paused, anim]);

  return anim;
};

const percent = (anim: Animated.Value): Animated.AnimatedInterpolation<string> =>
  anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

export const ProgressBar: React.FC<ProgressBarProps> = ({
  position,
  duration,
  onSeek,
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekFraction, setSeekFraction] = useState(0);
  const [thumbScale] = useState(() => new Animated.Value(1));
  const [trackWidth, setTrackWidth] = useState(0);

  const progress = useAnimatedProgress(
    duration > 0 ? position / duration : 0,
    isSeeking
  );

  useEffect(() => {
    Animated.spring(thumbScale, {
      toValue: isSeeking ? 1.5 : 1,
      tension: 400,
      friction: 22,
      useNativeDriver: true,
    }).start();
  }, [isSeeking, thumbScale]);

  const panResponder = useMemo(() => {
    const fractionFromX = (x: number): number =>
      clamp01(trackWidth > 0 ? x / trackWidth : 0);
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const fraction = fractionFromX(evt.nativeEvent.locationX);
        progress.stopAnimation();
        progress.setValue(fraction);
        setSeekFraction(fraction);
        setIsSeeking(true);
      },
      onPanResponderMove: (evt) => {
        const fraction = fractionFromX(evt.nativeEvent.locationX);
        progress.setValue(fraction);
        setSeekFraction(fraction);
      },
      onPanResponderRelease: (evt) => {
        const fraction = fractionFromX(evt.nativeEvent.locationX);
        setIsSeeking(false);
        onSeek(fraction * duration);
      },
      onPanResponderTerminate: () => {
        setIsSeeking(false);
      },
    });
  }, [progress, onSeek, duration, trackWidth]);

  const displayPosition = isSeeking ? seekFraction * duration : position;
  const currentLabel = formatTime(displayPosition, true);
  const totalLabel = formatTime(duration, true);
  const fillWidth = percent(progress);

  return (
    <View style={styles.container}>
      <View
        style={styles.touchZone}
        onLayout={(event) => {
          setTrackWidth(event.nativeEvent.layout.width);
        }}
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={a11yLabels.progressBar(currentLabel, totalLabel)}
        accessibilityValue={{ min: 0, max: Math.max(duration, 0), now: displayPosition }}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: fillWidth }]} />
        </View>
        <Animated.View
          style={[
            styles.thumb,
            { left: fillWidth, transform: [{ scale: thumbScale }] },
          ]}
        />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{currentLabel}</Text>
        <Text style={styles.timeText}>{totalLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  touchZone: {
    width: '100%',
    height: TOUCH_HEIGHT,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Colors.dark.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Colors.dark.primary,
  },
  thumb: {
    position: 'absolute',
    top: (TOUCH_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    marginLeft: -THUMB_SIZE / 2,
    backgroundColor: Colors.dark.primaryLight,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: -8,
  },
  timeText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
