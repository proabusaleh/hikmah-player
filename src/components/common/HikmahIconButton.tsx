import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

type IconButtonVariant = 'default' | 'filled' | 'accent' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface HikmahIconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

const variantColors: Record<IconButtonVariant, string> = {
  default: Colors.transparent,
  filled: Colors.card,
  accent: Colors.secondary,
  danger: Colors.danger,
};

const sizeMap: Record<IconButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
};

export const HikmahIconButton: React.FC<HikmahIconButtonProps> = ({
  icon,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}) => {
  const dimension = sizeMap[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: variantColors[variant],
          opacity: disabled ? 0.35 : 1,
        },
        style,
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
