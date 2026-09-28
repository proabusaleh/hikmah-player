import { Image } from 'expo-image';
import { Download, Film, Heart, Music, Pause } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { LocalMediaItem } from '@/types/library';
import { formatTime } from '@/utils/formatters';
import { a11yHints, a11yLabels } from '@/utils/accessibility';

interface OptimizedMediaCardProps {
  item: LocalMediaItem;
  index: number;
  isPlaying: boolean;
  isGrid: boolean;
  onPlay: (item: LocalMediaItem, index: number) => void;
  onFavorite: (id: string) => void;
  onDownload: (item: LocalMediaItem) => void;
  onLongPress?: (item: LocalMediaItem) => void;
}

export const OptimizedMediaCard: React.FC<OptimizedMediaCardProps> = memo(
  ({ item, index, isPlaying, isGrid, onPlay, onFavorite, onDownload, onLongPress }) => {
    const isVideo = item.mediaType === 'video';

    // Memoize formatted values
    const formattedDuration = useMemo(() => formatTime(item.duration), [item.duration]);

    const formattedSize = useMemo(
      () => (item.fileSize > 0 ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB` : ''),
      [item.fileSize]
    );

    if (isGrid) {
      return (
        <TouchableOpacity style={styles.gridCard} onPress={() => onPlay(item, index)} onLongPress={onLongPress ? () => onLongPress(item) : undefined} activeOpacity={0.8} accessible={true} accessibilityLabel={a11yLabels.mediaCard(item.title, '', formattedDuration)} accessibilityHint={a11yHints.doubleTapToPlay} accessibilityRole="button" accessibilityState={{ selected: isPlaying, disabled: false }}>
          <View style={styles.gridThumbnail}>
            {item.thumbnail ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumbImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              />
            ) : (
              <View style={styles.thumbFallback}>
                {isVideo ? (
                  <Film size={24} color={Colors.info} />
                ) : (
                  <Music size={24} color={Colors.secondary} />
                )}
              </View>
            )}
            <View style={styles.durationBadge}>
              <Text style={styles.durationBadgeText}>{formattedDuration}</Text>
            </View>
            {isPlaying && (
              <View style={styles.playingIndicator}>
                <Pause size={14} color={Colors.white} fill={Colors.white} />
              </View>
            )}
          </View>
          <Text numberOfLines={2} style={styles.gridTitle}>
            {item.title}
          </Text>
        </TouchableOpacity>
      );
    }

    // List variant
    return (
      <TouchableOpacity
        style={[styles.listCard, isPlaying && styles.listCardActive]}
        onPress={() => onPlay(item, index)}
        onLongPress={onLongPress ? () => onLongPress(item) : undefined}
        activeOpacity={0.75}
        accessible={true}
        accessibilityLabel={a11yLabels.mediaCard(item.title, '', formattedDuration)}
        accessibilityHint={a11yHints.doubleTapToPlay}
        accessibilityRole="button"
        accessibilityState={{ selected: isPlaying, disabled: false }}
      >
        {/* Thumbnail */}
        <View style={styles.listThumbnail}>
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbImage}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.thumbFallback}>
              {isVideo ? (
                <Film size={18} color={Colors.info} />
              ) : (
                <Music size={18} color={Colors.secondary} />
              )}
            </View>
          )}
          {isPlaying && (
            <View style={styles.playingOverlay}>
              <Pause size={12} color={Colors.white} fill={Colors.white} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.listInfo}>
          <Text numberOfLines={1} style={[styles.listTitle, isPlaying && styles.listTitleActive]}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={styles.listSubtitle}>
            {formattedDuration}
            {formattedSize ? ` • ${formattedSize}` : ''}
            {item.playCount > 0 ? ` • ${item.playCount} plays` : ''}
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => onFavorite(item.id)}
          style={styles.actionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible={true}
          accessibilityLabel={a11yLabels.favoriteButton(item.title, item.favorite)}
          accessibilityRole="button"
        >
          <Heart
            size={16}
            color={item.favorite ? Colors.danger : Colors.dim}
            fill={item.favorite ? Colors.danger : 'transparent'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDownload(item)}
          style={styles.actionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible={true}
          accessibilityLabel={a11yLabels.downloadButton(item.title)}
          accessibilityRole="button"
        >
          <Download size={16} color={Colors.dim} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  },
  // Custom comparison function for maximum performance
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.modifiedAt === nextProps.item.modifiedAt &&
      prevProps.item.favorite === nextProps.item.favorite &&
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.isGrid === nextProps.isGrid
    );
  }
);

OptimizedMediaCard.displayName = 'OptimizedMediaCard';

const styles = StyleSheet.create({
  // Grid
  gridCard: {
    flex: 1,
    margin: 4,
  },
  gridThumbnail: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    marginBottom: 6,
  },
  gridTitle: {
    ...Typography.bodySmall,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  // List
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  listThumbnail: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    overflow: 'hidden',
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },
  listInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  listTitle: {
    ...Typography.h4,
    fontSize: 14,
    marginBottom: 2,
  },
  listTitleActive: {
    color: Colors.accent,
  },
  listSubtitle: {
    ...Typography.caption,
    fontSize: 11,
  },
  actionBtn: {
    padding: Spacing.sm,
  },
});
