import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

interface SettingsRowProps {
  label: string;
  value?: string;
  description?: string;
  onPress?: () => void;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  isToggle?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  danger?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  value,
  description,
  onPress,
  toggleValue,
  onToggle,
  isToggle = false,
  disabled = false,
  icon,
  danger = false,
}) => {
  const content = (
    <View style={styles.row}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}

      <View style={styles.info}>
        <Text style={[Typography.h4, danger && styles.dangerText]}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      {isToggle && onToggle ? (
        <Switch
          value={toggleValue ?? false}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: Colors.border, true: Colors.secondary }}
          thumbColor={Colors.white}
        />
      ) : (
        <Text style={[styles.value, danger && styles.dangerText]}>{value ?? '›'}</Text>
      )}
    </View>
  );

  if (onPress && !isToggle) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  description: {
    ...Typography.bodySmall,
    marginTop: 4,
  },
  value: {
    ...Typography.bodySmall,
    color: Colors.secondary,
    fontWeight: '600',
  },
  dangerText: {
    color: Colors.danger,
  },
});
