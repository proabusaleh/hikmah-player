import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface HikmahButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
  primary: {
    bg: Colors.secondary,
    border: Colors.transparent,
    text: Colors.white,
  },
  secondary: {
    bg: Colors.card,
    border: Colors.transparent,
    text: Colors.text,
  },
  outline: {
    bg: Colors.transparent,
    border: Colors.border,
    text: Colors.text,
  },
  ghost: {
    bg: Colors.transparent,
    border: Colors.transparent,
    text: Colors.muted,
  },
  danger: {
    bg: Colors.danger,
    border: Colors.transparent,
    text: Colors.white,
  },
};

const sizeStyles: Record<ButtonSize, { paddingV: number; paddingH: number; fontSize: number }> = {
  sm: { paddingV: 8, paddingH: 14, fontSize: 13 },
  md: { paddingV: 12, paddingH: 20, fontSize: 15 },
  lg: { paddingV: 16, paddingH: 28, fontSize: 17 },
};

export const HikmahButton: React.FC<HikmahButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}) => {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          paddingVertical: s.paddingV,
          paddingHorizontal: s.paddingH,
          opacity: disabled ? 0.4 : 1,
        },
        variant === 'primary' && Shadows.glow,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} testID="button-loading" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              Typography.button,
              { color: v.text, fontSize: s.fontSize },
              icon ? { marginLeft: Spacing.sm } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
});
