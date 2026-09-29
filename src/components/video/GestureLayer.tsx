import React, { useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import { Colors, Typography } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GestureLayerProps {
  onSingleTap: () => void;
  onDoubleTapLeft: () => void;
  onDoubleTapRight: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeProgress?: (direction: 'left' | 'right' | 'up' | 'down', delta: number) => void;
  children?: React.ReactNode;
}

export const GestureLayer: React.FC<GestureLayerProps> = ({
  onSingleTap,
  onDoubleTapLeft,
  onDoubleTapRight,
  onSwipeUp,
  onSwipeDown,
  onSwipeProgress,
  children,
}) => {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rippleOpacity] = useState(() => new Animated.Value(0));
  const [rippleScale] = useState(() => new Animated.Value(0.5));
  const [rippleSide, setRippleSide] = React.useState<'left' | 'right'>('right');

  const showRipple = (side: 'left' | 'right') => {
    setRippleSide(side);
    rippleOpacity.setValue(0.6);
    rippleScale.setValue(0.5);

    Animated.parallel([
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(rippleScale, {
        toValue: 1.5,
        damping: 15,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTap = (locationX: number) => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    tapTimerRef.current = setTimeout(() => {
      if (tapCountRef.current === 1) {
        onSingleTap();
      } else if (tapCountRef.current >= 2) {
        const isLeftSide = locationX < SCREEN_WIDTH / 2;
        if (isLeftSide) {
          onDoubleTapLeft();
          showRipple('left');
        } else {
          onDoubleTapRight();
          showRipple('right');
        }
      }

      tapCountRef.current = 0;
    }, 280);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 18 || Math.abs(gestureState.dy) > 18,
        onPanResponderMove: (_, gestureState) => {
          if (!onSwipeProgress) return;

          const { dx, dy } = gestureState;

          if (Math.abs(dx) > Math.abs(dy)) {
            onSwipeProgress(dx > 0 ? 'right' : 'left', dx);
          } else {
            onSwipeProgress(dy > 0 ? 'down' : 'up', dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dy) > 60) {
            if (gestureState.dy < 0 && onSwipeUp) onSwipeUp();
            if (gestureState.dy > 0 && onSwipeDown) onSwipeDown();
          }
        },
      }),
    [onSwipeProgress, onSwipeUp, onSwipeDown]
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <TouchableWithoutFeedback onPress={(event) => handleTap(event.nativeEvent.locationX)}>
        <View style={styles.touchArea}>{children}</View>
      </TouchableWithoutFeedback>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          rippleSide === 'left' ? styles.rippleLeft : styles.rippleRight,
          {
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale }],
          },
        ]}
      >
        <Text style={styles.rippleText}>{rippleSide === 'left' ? '◀◀ 10s' : '10s ▶▶'}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  touchArea: {
    flex: 1,
  },
  ripple: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rippleLeft: {
    left: 0,
    borderTopRightRadius: 180,
    borderBottomRightRadius: 180,
  },
  rippleRight: {
    right: 0,
    borderTopLeftRadius: 180,
    borderBottomLeftRadius: 180,
  },
  rippleText: {
    ...Typography.h4,
    color: Colors.white,
    fontWeight: '800',
  },
});
