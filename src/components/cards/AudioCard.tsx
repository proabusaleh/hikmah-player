import { Heart, Music, Pause } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { MediaItem } from '@/types/media';
import { formatTime } from '@/utils/formatters';

interface AudioCardProps {
  item: MediaItem;
  index?: number;
  isPlaying?: boolean;
  isFavorite?: boolean;
  onPress: () => void;
  onFavorite?: () => void;
  rightAction?: React.ReactNode;
}

export const AudioCard: React.FC<AudioCardProps> = ({
  item,
  index,
  isPlaying = false,
  isFavorite = false,
  onPress,
  onFavorite,
  rightAction,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.container, isPlaying && styles.containerActive]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title}`}
      accessibilityState={{ selected: isPlaying }}
    >
      <View style={[styles.iconCircle, isPlaying && styles.iconCircleActive]}>
        {isPlaying ? (
          <Pause size={16} color={Colors.background} fill={Colors.background} />
        ) : index !== undefined ? (
          <Text style={styles.indexText}>{index + 1}</Text>
        ) : (
          <Music size={16} color={Colors.muted} />
        )}
      </View>

      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.title, isPlaying && styles.titleActive]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {item.artistOrSpeaker || 'Hikmah Audio'} • {formatTime(item.duration)}
        </Text>
      </View>

      {onFavorite && (
        <TouchableOpacity
          onPress={onFavorite}
          style={styles.actionBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
        >
          <Heart
            size={18}
            color={isFavorite ? Colors.danger : Colors.dim}
            fill={isFavorite ? Colors.danger : Colors.transparent}
          />
        </TouchableOpacity>
      )}

      {rightAction}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  containerActive: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconCircleActive: {
    backgroundColor: Colors.secondary,
  },
  indexText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.h4,
    fontSize: 15,
    marginBottom: 2,
  },
  titleActive: {
    color: Colors.accent,
  },
  artist: {
    ...Typography.bodySmall,
  },
  actionBtn: {
    padding: Spacing.sm,
  },
});
