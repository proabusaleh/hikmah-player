import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        <Text style={Typography.h4}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.actionButton} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <ChevronRight size={16} color={Colors.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  textGroup: {
    flex: 1,
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },
});
