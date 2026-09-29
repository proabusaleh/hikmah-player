import React, { useEffect, useState } from 'react';
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
  title?: string;
  snapHeight?: number;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  height = 320,
  title,
  snapHeight,
}) => {
  const [translateY] = useState(() => new Animated.Value(height));
  const sheetHeight = snapHeight ? Math.min(height, snapHeight) : height;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : sheetHeight,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, sheetHeight, translateY]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.handle} />
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  handle: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
});
