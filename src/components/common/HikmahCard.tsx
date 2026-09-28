import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';

interface HikmahCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: keyof typeof Spacing;
  style?: ViewStyle;
}

export const HikmahCard: React.FC<HikmahCardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'lg',
  style,
}) => {
  const cardStyle: ViewStyle[] = [
    styles.base,
    { padding: Spacing[padding] },
    variant === 'elevated' ? styles.elevated : undefined,
    variant === 'bordered' ? styles.bordered : undefined,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  elevated: {
    backgroundColor: Colors.card,
    ...Shadows.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
