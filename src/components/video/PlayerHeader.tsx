import {
    Cast,
    ChevronLeft,
    MoreVertical,
    PictureInPicture2,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

interface PlayerHeaderProps {
  title: string;
  subtitle?: string;
  isFullscreen: boolean;
  onBack: () => void;
  onMore?: () => void;
  onCast?: () => void;
  onPiP?: () => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  title,
  subtitle,
  isFullscreen,
  onBack,
  onMore,
  onCast,
  onPiP,
}) => {
  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenPadding]}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.7}>
        <ChevronLeft size={26} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightActions}>
        {onCast ? (
          <TouchableOpacity onPress={onCast} style={styles.iconBtn} activeOpacity={0.7}>
            <Cast size={20} color={Colors.white} />
          </TouchableOpacity>
        ) : null}
        {onPiP ? (
          <TouchableOpacity onPress={onPiP} style={styles.iconBtn} activeOpacity={0.7}>
            <PictureInPicture2 size={20} color={Colors.white} />
          </TouchableOpacity>
        ) : null}
        {onMore ? (
          <TouchableOpacity onPress={onMore} style={styles.iconBtn} activeOpacity={0.7}>
            <MoreVertical size={22} color={Colors.white} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  fullscreenPadding: {
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  iconBtn: {
    padding: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  title: {
    ...Typography.h4,
    color: Colors.white,
    fontSize: 16,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
